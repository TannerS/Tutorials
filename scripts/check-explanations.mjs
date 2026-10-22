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
const sectionFilter = process.argv[2] ? new RegExp(process.argv[2]) : null;
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
  const titleOf = (attrs) => (attrs.match(/title=\"([^\"]*)\"/) || attrs.match(/title=\{\"([^\"]*)\"\}/) || [])[1] || '';
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

    if (next.type === 'code' && !OUTPUT.test(next.title) && !OUTPUT.test(m.title) && between.length < MIN_PROSE) {
      const contrast = BAD.test(m.title) && GOOD.test(next.title);
      const parallel = !contrast && (sharedStem(m.title, next.title) || (LANG.test(m.title) && LANG.test(next.title)));
      if (parallel) continue;
      // Worst case: nothing between the two blocks AND nothing after the
      // second one either, so the comparison is never explained anywhere.
      const after = marks[i + 2];
      const tail = after ? prose(src.slice(next.end, after.start)) : '';
      const unresolved = !after || (after.type === 'head' && tail.length < MIN_PROSE);
      findings.push({
        section, rel, line: lineOf(m.end), kind: unresolved ? 'PAIR-UNRESOLVED' : 'PAIR',
        score: (contrast ? 2 : 0) + (between.length < 20 ? 1 : 0) + (unresolved ? 2 : 0),
        detail: `"${m.title.slice(0, 44)}" -> "${next.title.slice(0, 44)}"`,
        gap: between.length,
      });
    } else if (next.type === 'head' && !OUTPUT.test(m.title) && between.length < MIN_PROSE) {
      findings.push({
        section, rel, line: lineOf(m.end), kind: 'ORPHAN',
        score: (BAD.test(m.title) || GOOD.test(m.title) ? 1 : 0) + (between.length < 20 ? 1 : 0),
        detail: `"${m.title.slice(0, 54)}" then straight to a heading`,
        gap: between.length,
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
