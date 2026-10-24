// Finds "asserts without explaining": code shown to the reader with no prose
// saying what is wrong with it, what changed, or why the new version is better.
//
// Two shapes, both taken from react-antipatterns/Intro.tsx:
//   PAIR      two CodeBlocks back to back, titled like bad -> good, nothing
//             between them. The reader has to reverse-engineer the lesson.
//   ORPHAN    a CodeBlock that is the last thing before the next heading, with
//             no prose after it. The example never gets a conclusion.
//
// Prose inside an InfoBox counts as explanation; code comments do not, because
// they are not visible as the argument a reader is following.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = process.env.AUDIT_ROOT || path.join(ROOT, 'src/pages');
// Take the first NON-FLAG argument as the section filter. Reading argv[2]
// unconditionally meant `--orphans` on its own became the regex /--orphans/,
// which matched no section and printed a confident "0 findings" -- the same
// shape of silent-empty-result that this audit kept getting burned by.
const sectionFilter = (() => {
  const arg = process.argv.slice(2).find((a) => !a.startsWith('--'));
  return arg ? new RegExp(arg) : null;
})();
const MIN_PROSE = 120; // chars of real sentence text that counts as an explanation

const BAD = /(anti-?pattern|bad|wrong|problem|avoid|don'?t|never|broken|naive|before|buggy|slow|leak|smell|tutorial-style)/i;
const GOOD = /(clean|good|right|correct|better|fix|do this|prefer|after|production|idiomatic|recommended|solution|improved|safe)/i;
// A code block followed by its own output is the repo's normal, correct
// shape -- "here is the program, here is what it printed" needs no prose
// between the two. Only a block that is itself another EXAMPLE counts.
// Two blocks presenting the SAME thing in two languages, frameworks or
// halves (HTML then CSS, Node then Java) are a parallel presentation, not an
// unexplained comparison -- the second block is the explanation.
const LANG = /(node(\.js)?|java\b|python|go\b|rust|express|spring ?boot|spring|c#|\.net|php|ruby|kotlin|html|css|sql|yaml|maven|gradle|client|server)/i;
const sharedStem = (a, b) => {
  const words = (t) => new Set(t.toLowerCase().match(/[a-z0-9+-]{4,}/g) || []);
  const A = words(a), B = words(b);
  const common = [...A].filter((w) => B.has(w));
  return common.length >= 2 || (common.length === 1 && (LANG.test(a) && LANG.test(b)));
};
const OUTPUT = /(real output|^output|terminal|console|result|stdout|stderr|what .*prints?|^\s*\$|error message|compiler says|diagnostic)/i;
// Titles do not always advertise that a block is output. "Same test class,
// after adding the agent" holds a surefire run -- [INFO] lines and "Tests run:
// 3" -- and was reported as an unexplained example because OUTPUT only ever
// looked at the title. Judge the BODY too: a block that is plainly a console
// or log capture is the output half of "here is the program, here is what it
// printed", which the header says needs no prose around it.
const OUTPUT_BODY = [
  /^\s*\[(INFO|WARN|ERROR|DEBUG)\]/m,            // maven / slf4j / logback
  /\bTests run:\s*\d+/,                          // surefire summary
  /^\s*at [\w.$]+\([\w.]+:\d+\)/m,               // java stack frame
  /^\s*\$ /m,                                    // shell transcript
  /^[A-Za-z.$_]*(Exception|Error):\s/m,           // thrown-and-printed
  /^\s*(BUILD SUCCESS|BUILD FAILURE|BUILD SUCCESSFUL)/m,
  /^\s*(added|removed|changed) \d+ packages?/m,   // npm
  /^\s*(PASS|FAIL|✓|✗|√|×)\s/m,                  // test runners
  /^\s*\w+@[\w.-]+ /m,                           // package@version lines
];
const looksLikeOutput = (slice) => {
  const body = slice.match(/\{`([\s\S]*?)`\}/);
  if (!body) return false;
  return OUTPUT_BODY.some((re) => re.test(body[1]));
};

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

// Ordered list of structural markers in one file.
function parse(src) {
  const marks = [];
  const push = (type, start, end, title = '') => marks.push({ type, start, end, title });

  // CodeBlock spans (title + full element)
  const titleOf = (attrs) =>
    (attrs.match(/title="([^"]*)"/) || attrs.match(/title=\{"([^"]*)"\}/) || [])[1] || '';
  for (const m of src.matchAll(/<CodeBlock\b([^>]*)>/g)) {
    const close = src.indexOf('</CodeBlock>', m.index);
    push('code', m.index, close === -1 ? m.index + m[0].length : close + 12, titleOf(m[1]));
  }
  for (const m of src.matchAll(/<InfoBox\b([^>]*)>/g)) {
    const close = src.indexOf('</InfoBox>', m.index);
    push('info', m.index, close === -1 ? m.index + m[0].length : close + 10, titleOf(m[1]));
  }
  for (const m of src.matchAll(/<(h2|h3)>/g)) push('head', m.index, m.index + m[0].length);
  for (const m of src.matchAll(/<FlowChart\b/g)) push('chart', m.index, m.index + m[0].length);
  for (const m of src.matchAll(/<(table|Quiz|InteractiveChallenge|Challenge)\b/gi)) push('other', m.index, m.index + m[0].length);

  marks.sort((a, b) => a.start - b.start);
  // drop markers nested inside an earlier span (e.g. a <p> inside an InfoBox)
  const top = [];
  let cursor = -1;
  for (const m of marks) {
    if (m.start < cursor) continue;
    top.push(m);
    cursor = m.end;
  }
  return top;
}

// Visible sentence text in a slice, excluding code and JSX plumbing.
function prose(slice) {
  return slice
    .replace(/\{`[\s\S]*?`\}/g, ' ')       // template-literal code
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ') // jsx comments
    .replace(/<[^>]*>/g, ' ')              // tags
    .replace(/\{'[^']*'\}/g, ' ')          // {' '} and friends
    .replace(/\{[^{}]*\}/g, ' ')           // small expressions
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Explanatory text carried INSIDE a code block's comments.
//
// The header above says code comments do not count, "because they are not
// visible as the argument a reader is following". For this repo that turned out
// to be wrong, and it was the single biggest source of noise here: 128 of
// react18's findings were orphans, and the ones sampled all explained
// themselves in comments and then moved to the next heading, e.g.
//
//   // The evil version: if ANY unrelated state in this component changes
//   // later, the component re-renders and suddenly displays 3. It looks like
//   // a lag bug or a race condition. It is neither.
//
// That IS the argument, so a block carrying it is not unexplained. What still
// should not count is labelling -- "// BAD", "// Fix:", "// step 1" -- so this
// only counts comment lines that read like sentences: several words, and either
// sentence punctuation or a lowercase-then-space shape rather than a bare tag.
function commentProse(slice) {
  const body = slice.match(/\{`([\s\S]*?)`\}/);
  if (!body) return '';
  const lines = body[1].split('\n');
  const out = [];
  for (const raw of lines) {
    const m = raw.match(/^\s*(?:\/\/|\*|#)\s?(.*)$/);
    if (!m) continue;
    const text = m[1].trim();
    if (text.length < 24) continue;                 // labels, markers, dividers
    if (!/\s/.test(text)) continue;                 // single token
    if ((text.match(/\s+/g) || []).length < 4) continue; // fewer than ~5 words
    out.push(text);
  }
  return out.join(' ').trim();
}

const findings = [];
for (const file of walk(PAGES)) {
  const rel = path.relative(PAGES, file);
  const section = rel.split(path.sep)[0];
  if (sectionFilter && !sectionFilter.test(section)) continue;
  const src = readFileSync(file, 'utf8');
  const marks = parse(src);
  const lineOf = (i) => src.slice(0, i).split('\n').length;

  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    if (m.type !== 'code') continue;
    const next = marks[i + 1];
    if (!next) continue;
    const between = prose(src.slice(m.end, next.start));

    if (next.type === 'code' && !OUTPUT.test(next.title) && !OUTPUT.test(m.title)
        && !looksLikeOutput(src.slice(next.start, next.end))
        && !looksLikeOutput(src.slice(m.start, m.end)) && between.length < MIN_PROSE) {
      const contrast = BAD.test(m.title) && GOOD.test(next.title);
      // Two titles that each name a FILE are consecutive steps in a scaffold,
      // not a comparison -- "src/vite-env.d.ts" then "src/main.tsx" is the
      // repo showing you a project one file at a time. Same for an install
      // command followed by the config file it writes.
      const named = (t) => /\.(tsx?|jsx?|json|ya?ml|xml|java|mjs|cjs|css|html|properties|gradle|toml|lock|env|sh)\b|^\s*(package|tsconfig|vite\.config)/i.test(t);
      const sequential = !contrast && named(m.title) && named(next.title);
      const parallel = !contrast && (sharedStem(m.title, next.title) || (LANG.test(m.title) && LANG.test(next.title)));
      if (parallel || sequential) continue;
      // Worst case: nothing between the two blocks AND nothing after the
      // second one either, so the comparison is never explained anywhere.
      const after = marks[i + 2];
      const tail = after ? prose(src.slice(next.end, after.start)) : '';
      const unresolved = !after || (after.type === 'head' && tail.length < MIN_PROSE);
      // PAIR-UNRESOLVED is the CRITICAL bucket, so it has to mean what the
      // header at the top of this file says: two blocks "titled like bad ->
      // good". It used to mean only "no prose after the second block", with
      // `contrast` affecting nothing but the score -- which made every pair of
      // adjacent examples critical. Triaging typescript's 17 criticals by hand
      // found 0 real ones: they were sequential steps ("Install Dependencies"
      // -> "tsconfig.json") and parallel alternatives ("Higher-Order
      // Component" -> "Render prop pattern"), both of which are correct
      // structure. Without the contrast requirement this check cried wolf
      // 1,570 times and so got ignored, which is worse than not having it.
      findings.push({
        section, rel, line: lineOf(m.end), kind: unresolved && contrast ? 'PAIR-UNRESOLVED' : 'PAIR',
        score: (contrast ? 2 : 0) + (between.length < 20 ? 1 : 0) + (unresolved ? 2 : 0),
        detail: `"${m.title.slice(0, 44)}" -> "${next.title.slice(0, 44)}"`,
        gap: between.length,
      });
    } else if (next.type === 'head' && !OUTPUT.test(m.title)
               && !looksLikeOutput(src.slice(m.start, m.end)) && between.length < MIN_PROSE) {
      // A block that explains itself in its own comments is not an orphan --
      // see commentProse above for why that counts and what it excludes.
      const inside = commentProse(src.slice(m.start, m.end));
      if (inside.length >= MIN_PROSE) continue;
      // Nor is a block that was INTRODUCED. This check only ever looked
      // forward, for a trailing conclusion, but this repo's house style is to
      // explain first and then show the code -- so "prose, block, next
      // heading" was being reported as unexplained when it is the normal and
      // correct shape. Look back to the previous marker for the lead-in.
      const prev = marks[i - 1];
      const leadIn = prose(src.slice(prev ? prev.end : 0, m.start));
      if (leadIn.length >= MIN_PROSE) continue;
      findings.push({
        section, rel, line: lineOf(m.end), kind: 'ORPHAN',
        score: (BAD.test(m.title) || GOOD.test(m.title) ? 1 : 0) + (between.length < 20 ? 1 : 0),
        detail: `"${m.title.slice(0, 54)}" then straight to a heading`,
        gap: between.length,
        inside: inside.length,
      });
    }
  }
}

const bySection = {};
for (const f of findings) (bySection[f.section] ||= []).push(f);

const order = Object.entries(bySection).sort((a, b) => b[1].length - a[1].length);
console.log(`${findings.length} findings across ${order.length} sections\n`);
for (const [sec, list] of order) {
  const crit = list.filter((f) => f.kind === 'PAIR-UNRESOLVED');
  const pairs = list.filter((f) => f.kind === 'PAIR');
  console.log(`${sec.padEnd(22)} ${String(list.length).padStart(3)} total  ${String(crit.length).padStart(3)} CRITICAL  ${String(pairs.length).padStart(3)} pair  ${String(list.length-crit.length-pairs.length).padStart(3)} orphan`);
}
if (process.argv.includes('--detail')) {
  console.log('\n--- CRITICAL: contrast pair, unexplained before AND after ---');
  findings.filter((f) => f.kind === 'PAIR-UNRESOLVED')
    .sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel))
    .forEach((f) => console.log(`  ${f.kind}  ${f.rel}:${f.line}  gap=${f.gap}\n        ${f.detail}`));
}
// --orphans prints the advisory tier, which --detail deliberately omits to keep
// the critical list readable. Highest score first: score 2 means both "nothing
// between" and a bad/good title, which is where a real missing conclusion is
// most likely to be.
if (process.argv.includes('--orphans')) {
  const list = findings.filter((f) => f.kind === 'ORPHAN')
    .sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel));
  console.log(`\n--- ORPHAN: code block then straight to a heading (${list.length}) ---`);
  for (const f of list) console.log(`  score=${f.score} gap=${f.gap}  ${f.rel}:${f.line}\n        ${f.detail}`);
}
if (process.argv.includes('--pairs')) {
  const list = findings.filter((f) => f.kind === 'PAIR')
    .sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel));
  console.log(`\n--- PAIR: adjacent blocks, explained only after the second (${list.length}) ---`);
  for (const f of list) console.log(`  score=${f.score} gap=${f.gap}  ${f.rel}:${f.line}\n        ${f.detail}`);
}
