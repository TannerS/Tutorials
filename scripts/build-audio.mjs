// Generates spoken-audio versions of lessons for listening while driving.
//
// WHY THE NARRATION IS NOT JUST "READ THE PAGE": lessons are 20-54% code by
// character count, plus mermaid diagrams. Reading `const X = lazy(() =>
// import('./Y'))` aloud, punctuation and all, would burn a third to half of a
// drive on noise. So code blocks contribute their TITLE only -- the titles in
// this repo are written as sentences ("Real output -- Node 26", "The leak, and
// the fixes") and carry the meaning. Short text/output blocks ARE read, because
// that is where the punchlines live.
//
// TTS is macOS `say`, which writes AAC/M4A directly -- no ffmpeg needed. That
// also means this cannot run on the Linux GitHub Actions runner; audio is
// generated locally and committed.
//
// Usage:
//   node scripts/build-audio.mjs /frontend-tooling/chunks      one lesson
//   node scripts/build-audio.mjs css-mastery                   a whole section
//   node scripts/build-audio.mjs --list-voices
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://localhost:4399/Tutorials';
const OUT = path.join(ROOT, 'public', 'audio');
const MANIFEST = path.join(ROOT, 'src', 'data', 'audioManifest.ts');

// Prefer an Enhanced/Premium voice if the user has downloaded one
// (System Settings > Accessibility > Spoken Content > Manage Voices).
const VOICE_PREFERENCE = ['Ava (Premium)', 'Ava (Enhanced)', 'Evan (Enhanced)', 'Zoe (Premium)', 'Samantha'];
const RATE = 180;                 // words/min; comfortable for technical prose

const args = process.argv.slice(2);

function sh(cmd, argv) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', d => (out += d));
    p.stderr.on('data', d => (err += d));
    p.on('close', c => (c === 0 ? resolve(out) : reject(new Error(err || `${cmd} exited ${c}`))));
  });
}

async function pickVoice() {
  const listing = await sh('say', ['-v', '?']);
  const available = listing.split('\n').map(l => l.replace(/\s{2,}.*$/, '').trim());
  for (const want of VOICE_PREFERENCE) if (available.includes(want)) return want;
  return 'Samantha';
}

if (args[0] === '--list-voices') {
  const listing = await sh('say', ['-v', '?']);
  console.log(listing.split('\n').filter(l => /\ben_/.test(l)).join('\n'));
  process.exit(0);
}

// Resolve the requested target into a list of { sectionId, lessonId, path, title }.
const sectionsSrc = fs.readFileSync(path.join(ROOT, 'src/data/sections.ts'), 'utf8');
const sections = [];
{
  const body = sectionsSrc.slice(sectionsSrc.indexOf('export const sections'));
  const chunks = body.split(/\n {2}\{\n/).slice(1);
  for (const c of chunks) {
    const id = c.match(/id:\s*'([^']+)'/)?.[1];
    const label = c.match(/label:\s*'([^']*)'/)?.[1];
    if (!id || !label) continue;
    const lessons = [...c.matchAll(/\{\s*id:\s*'([^']+)',\s*title:\s*(['"])((?:(?!\2).)*)\2,\s*path:\s*'([^']+)'\s*\}/g)]
      .map(m => ({ id: m[1], title: m[3], path: m[4] }));
    if (lessons.length) sections.push({ id, label, lessons });
  }
}

const targets = [];
for (const a of args) {
  if (a.startsWith('/')) {
    for (const s of sections) {
      const l = s.lessons.find(x => x.path === a);
      if (l) targets.push({ section: s, lesson: l, index: s.lessons.indexOf(l) });
    }
  } else {
    const s = sections.find(x => x.id === a);
    if (s) s.lessons.forEach((l, i) => targets.push({ section: s, lesson: l, index: i }));
  }
}
if (!targets.length) {
  console.error('No lessons matched. Pass a lesson path (/css-mastery/sizing) or a section id (css-mastery).');
  process.exit(1);
}

const voice = await pickVoice();
console.log(`voice: ${voice}   rate: ${RATE} wpm   lessons: ${targets.length}`);
if (voice === 'Samantha') {
  console.log('  (tip: System Settings > Accessibility > Spoken Content > Manage Voices');
  console.log('   downloads a free Enhanced/Premium voice that is much easier on a long drive)');
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const results = [];

for (const { section, lesson, index } of targets) {
  await page.goto(BASE + lesson.path, { waitUntil: 'networkidle' });
  await page.waitForSelector('main h1', { timeout: 20000 });

  const script = await page.evaluate(() => {
    const parts = [];
    const root = document.querySelector('.lesson-content') ?? document.querySelector('main');
    const SHORT_BLOCK_LINES = 6;
    const say = (s) => { const t = String(s).trim(); if (t) parts.push(t); };

    // Prism renders gutter line numbers into the <pre>, so strip a leading
    // number off each line before anything gets read aloud.
    const preLines = (pre) =>
      pre.innerText.split('\n').map(l => l.replace(/^\s*\d+\s?/, '')).filter(l => l.trim());

    const walk = (el) => {
      for (const node of el.children) {
        const tag = node.tagName;
        const cls = typeof node.className === 'string' ? node.className : '';

        if (tag === 'H1' || node.classList?.contains('no-print')) continue;

        // A <FlowChart>: first child div is the caption, second is the SVG.
        if (cls.includes('flow-chart')) {
          const cap = (node.children[0]?.innerText || '').replace(/^\W+\s*/, '').trim();
          say(cap ? `Diagram: ${cap}.` : 'A diagram is on screen.');
          continue;
        }

        // An <InfoBox>: first child div is the icon + title, second is the body.
        if (cls.includes('info-box')) {
          const title = (node.children[0]?.innerText || '').replace(/^\W+\s*/, '').replace(/\n/g, ' ').trim();
          if (title) say(`\nAside. ${title}.`);
          if (node.children[1]) walk(node.children[1]);
          continue;
        }

        // A <CodeBlock>: title row, Copy button, then the <pre>. Read the title;
        // read the body only when it is a short measured result, not a listing.
        if (cls.includes('code-block')) {
          const pre = node.querySelector('pre');
          const title = (node.children[0]?.innerText || '').split('\n')[0].trim();
          if (title) say(`${title}.`);
          if (!pre) continue;
          const lines = preLines(pre);
          const isOutput = /output|result|real |measured|verified/i.test(title);
          if (isOutput && lines.length <= SHORT_BLOCK_LINES) say(lines.join('. '));
          else say(lines.length > 12 ? 'A longer code listing is on screen.' : 'Code example on screen.');
          continue;
        }

        if (tag === 'PRE' || tag === 'CODE') continue;

        if (/^H[2-4]$/.test(tag)) { say(`\n${node.innerText.trim()}.`); continue; }
        if (tag === 'P') { say(node.innerText); continue; }
        if (tag === 'UL' || tag === 'OL') {
          for (const li of node.children) say(li.innerText);
          continue;
        }
        if (tag === 'TABLE') {
          const rows = [...node.querySelectorAll('tbody tr')];
          const heads = [...node.querySelectorAll('thead th')].map(h => h.innerText.trim());
          say(`A table follows, with ${rows.length} rows.`);
          for (const r of rows) {
            const cells = [...r.children].map(c => c.innerText.trim());
            say(cells.map((c, i) => (heads[i] ? `${heads[i]}: ${c}` : c)).join('. '));
          }
          continue;
        }
        walk(node);
      }
    };
    walk(root);
    return parts.join(' ')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  });

  // `say` treats "<" as the start of embedded markup and SILENTLY DISCARDS
  // everything after it — measured: a 6,555-character script produced 30
  // seconds of audio, stopping dead at the first "<" (a <script> tag inside a
  // quoted output block). Nothing errors and the file looks valid. So angle
  // brackets must be removed BEFORE anything else, and tags are spoken as
  // "<section>" -> "section element", which is how you would say it anyway.
  const deAngled = script
    .replace(/<\/([a-zA-Z][\w-]*)>/g, 'closing $1 element')
    .replace(/<([a-zA-Z][\w-]*)(\s[^>]*)?\/?>/g, '$1 element')
    .replace(/[<>]/g, ' ');

  // Light pronunciation fixes so the narration does not sound like a parser.
  const spoken = deAngled
    .replace(/\bimport\(\)/g, 'dynamic import')
    .replace(/\bnpm run\b/g, 'N P M run')
    .replace(/\bCSS\b/g, 'C S S').replace(/\bHTML\b/g, 'H T M L')
    .replace(/\bURL\b/g, 'U R L').replace(/\bAPI\b/g, 'A P I')
    .replace(/\bDOM\b/g, 'Dom').replace(/\bJSX\b/g, 'J S X')
    .replace(/\bkB\b/g, ' kilobytes').replace(/\bMB\b/g, ' megabytes')
    .replace(/—/g, ', ').replace(/–/g, ', ')
    .replace(/→/g, ' becomes ').replace(/←/g, ' from ');

  const dir = path.join(OUT, section.id);
  fs.mkdirSync(dir, { recursive: true });
  const num = String(index + 1).padStart(2, '0');
  const file = path.join(dir, `${num}-${lesson.id}.m4a`);
  const txt = file.replace(/\.m4a$/, '.txt');
  fs.writeFileSync(txt, spoken);

  const plainTitle = lesson.title.replace(/^[^\w(]+\s*/, '');
  const intro = `${plainTitle}. ${section.label}, lesson ${index + 1}.\n\n`;
  fs.writeFileSync(txt, intro + spoken);

  await sh('say', ['-v', voice, '-r', String(RATE), '-o', file, '--data-format=aac', '-f', txt]);
  // fs.unlinkSync(txt);

  const info = await sh('afinfo', [file]).catch(() => '');
  const secs = Number(info.match(/estimated duration:\s*([\d.]+)/)?.[1] ?? 0);
  const bytes = fs.statSync(file).size;
  results.push({ section: section.id, lesson: lesson.id, num, secs, bytes });
  console.log(
    `  ${section.id}/${lesson.id}`.padEnd(46) +
    `${(secs / 60).toFixed(1)} min  ${(bytes / 1048576).toFixed(2)} MB  ` +
    `${spoken.split(/\s+/).length} words`
  );
}

await browser.close();

// Rebuild the manifest from what is actually on disk, so deleting a section's
// audio makes its buttons disappear without any other edit.
const have = {};
if (fs.existsSync(OUT)) {
  for (const sec of fs.readdirSync(OUT)) {
    const dir = path.join(OUT, sec);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(\d+)-(.+)\.m4a$/);
      if (m) (have[sec] ??= {})[m[2]] = f;
    }
  }
}
fs.writeFileSync(
  MANIFEST,
  `// GENERATED by scripts/build-audio.mjs — do not edit by hand.\n` +
  `// Maps sectionId -> lessonId -> filename under /audio/<sectionId>/.\n` +
  `// A lesson missing from here simply renders no audio player.\n` +
  `export const audioManifest: Record<string, Record<string, string>> = ${JSON.stringify(have, null, 2)};\n`
);

const totalSecs = results.reduce((a, r) => a + r.secs, 0);
const totalBytes = results.reduce((a, r) => a + r.bytes, 0);
console.log(
  `\n${results.length} lesson(s)  ${(totalSecs / 60).toFixed(1)} min  ` +
  `${(totalBytes / 1048576).toFixed(1)} MB   -> public/audio/`
);
console.log(`manifest: ${path.relative(ROOT, MANIFEST)}`);
