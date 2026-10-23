// Finds claims that contradict each other ACROSS files, and summaries that have
// drifted from the lessons they condense.
//
// WHY: this is the one error class nothing else here can see. check-versions.mjs
// catches currency drift in tracked packages; check-explanations.mjs catches
// examples shown without prose. Neither can see "panel 6 says the opposite of
// panel 11", or "the field guide caps the section at TypeScript 6 while the
// section contains a lesson titled 6 -> 7". An audit of this repo found 30 such
// defects and EVERY ONE of them lived in a cheatsheet, a version table or a
// drifted measurement -- never in an explanation of mechanism. Explanations get
// verified when they are written; the summaries that condense them do not get
// re-checked when a lesson is later corrected.
//
// Every rule below is a regression test for a real defect. The git SHA that
// fixed it is cited, so a future reader can see the evidence rather than trust
// the rule.
//
//   node scripts/check-consistency.mjs             # report
//   node scripts/check-consistency.mjs --detail    # with the offending lines
//   node scripts/check-consistency.mjs <regex>     # limit to matching sections
//
// Exits 1 if anything is found, so it can gate CI.
//
// WHAT IT DOES NOT DO: it is not a contradiction detector. It cannot read prose.
// It only knows the specific facts listed in FACTS/PAIRINGS below, plus two
// structural checks that need no knowledge at all. Adding a fact is cheap; that
// is the intended way to grow this file as new drift is found.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = process.env.AUDIT_ROOT || path.join(ROOT, 'src/pages');
const sectionFilter = process.argv[2] && !process.argv[2].startsWith('--')
  ? new RegExp(process.argv[2]) : null;
const detail = process.argv.includes('--detail');

// ---------------------------------------------------------------------------
// FACTS: things the repo has already established by measurement. Each entry
// flags text that asserts the opposite. `wrong` must be specific enough that a
// correct sentence cannot match it -- prefer naming both halves of the claim.
// ---------------------------------------------------------------------------
const FACTS = [
  {
    id: 'var-is-java-10',
    fact: 'var arrived in Java 10, not Java 11 (JEP 286)',
    fixedBy: 'fd60d3b',
    // "11 LTS | var, HttpClient" in a table row, or prose crediting 11 with var
    wrong: /\b(11|eleven)\b[^.\n]{0,40}\bvar\b|\bvar\b[^.\n]{0,40}\bJava 11\b/i,
    // the correction itself names both numbers, so allow a sentence that does
    allow: /Java 10|a 10 feature|JEP 286/i,
  },
  {
    id: 'jpms-not-erasure-broke-java9',
    fact: 'strong encapsulation (JPMS) broke Mockito/serialization on Java 8->9, not type erasure',
    fixedBy: 'fd60d3b',
    wrong: /erasure[^.]{0,80}(broke|breaking)[^.]{0,80}(8\s*(->|→|to)\s*9|Java 9)/i,
  },
  {
    id: 'vite8-uses-rolldown',
    fact: 'Vite 8 transforms through Rolldown/Oxc; the esbuild-in-dev + Rollup-in-prod split is Vite 4-6',
    fixedBy: '3ffd624, ad7b290',
    wrong: /(uses|using)\s+esbuild\s+for\s+dev|esbuild\s+(in|for)\s+dev[^.\n]{0,40}Rollup[^.\n]{0,20}(prod|build)/i,
    // a sentence that flags it as the OLD architecture is correct
    allow: /Vite\s*[4-7]|no longer|superseded|outdated|used to|Through Vite|is the Vite/i,
  },
  {
    id: 'memo-does-not-stop-context',
    fact: 'React.memo does not stop a context consumer re-rendering; useContext is not a prop',
    fixedBy: 'measured in 3462a5a lineage',
    wrong: /memo[^.\n]{0,60}(prevent|stop|avoid)s?[^.\n]{0,30}context[^.\n]{0,30}re-?render/i,
    allow: /does not|cannot|will not|no help|does nothing/i,
  },
  {
    id: 'peek-elided-by-stream-not-jit',
    fact: 'peek() is elided by the stream implementation when the result does not need it, not by the JIT',
    fixedBy: 'fd60d3b',
    wrong: /JIT[^.\n]{0,40}(skip|elide|remove)[^.\n]{0,20}peek|peek[^.\n]{0,40}JIT[^.\n]{0,20}(skip|elide)/i,
  },
  {
    id: 'mockbean-removed-in-boot-4',
    fact: '@MockBean was deprecated in Boot 3.4 and REMOVED in Boot 4 (verified absent from spring-boot-test 4.1.1)',
    fixedBy: 'verified in a1086cf',
    wrong: /@MockBean[^.\n]{0,50}(still (works|available|supported)|not removed)/i,
  },
  {
    id: 'esm-named-import-of-removed-export-is-a-syntaxerror',
    // A real defect: react-router/Migration said the removed v6 data APIs
    // "yield undefined" when imported and throw TypeError when called. That
    // is the CommonJS path. Measured on react-router 7.18.2, an ESM named
    // import -- what the code sample directly below it used -- fails at
    // module load with "does not provide an export named 'defer'", so the
    // TypeError line is never reached.
    fact: 'an ESM named import of a deleted export is a load-time SyntaxError; only require() yields undefined and defers the failure to the call',
    fixedBy: '58a015a',
    wrong: /import[^\n]{0,70}\b(defer|json)\b[^\n]{0,90}(?:yields?|gives?|returns?|is|are)\s+undefined/i,
    allow: /SyntaxError|does not provide|module load|require\(/i,
  },
  {
    id: 'useid-format-is-react-19',
    // A real defect: Hooks.tsx taught useId() returning ":r1:", which is the
    // React 18 shape. Measured by server-rendering against this repo's React
    // 19.2.6: one useId gives _R_0_, two in a component give _R_0_ and
    // _R_0H1_, the same component twice gives _R_1_ and _R_2_.
    fact: 'useId returns the _R_<n>_ shape on React 19; ":r1:" is the React 18 shape',
    fixedBy: '4417148',
    // Span is [^\n], NOT [^.]: the stale line reads `useId(); // e.g., ":r1:"`
    // and an [^.] span cannot cross the periods in "e.g.", so the first
    // version of this rule passed over the very line it was written for.
    wrong: /useId[^\n]{0,80}:r\d*:|:r\d*:[^\n]{0,60}useId/i,
    // Quoting the old shape to correct it is fine, so long as the text says
    // which version it belonged to. Deliberately narrow: a bare "e.g. :r1:"
    // beside useId has no such framing and still trips.
    allow: /React 18|no longer|used to|changed|\bwas\b/i,
  },
  {
    id: 'queryby-throws-on-multiple',
    // Pre-emptive. The repo states this correctly today (react-testing's query
    // table and BestPractices both do), but "queryBy returns null instead of
    // throwing" is the single most common way to mis-summarise RTL, because
    // the not-found half of the rule is the half people remember.
    // Measured on @testing-library/dom 10.4.2: queryByRole with two matching
    // buttons THREW "Found multiple elements"; it returns null only when
    // nothing matches.
    fact: 'queryBy returns null when nothing matches but THROWS on multiple matches; only the not-found case is null',
    fixedBy: 'measured, no prior defect',
    // No `allow` clause. An earlier attempt allowed any "throw ... multiple"
    // nearby, which silently swallowed the exact sentence this guards --
    // "queryBy returns null rather than THROWING when there are MULTIPLE
    // matching elements" contains that phrase while asserting the opposite.
    // So `wrong` instead requires null to be tied to the multiple case, either
    // by an explicit negation of throwing or by a when/if/on clause.
    wrong: new RegExp(
      [
        // "...returns null rather than throwing ... multiple"
        /queryBy[^.]{0,70}(?:returns?|is|gives?)\s+null[^.]{0,40}(?:rather than|instead of|not)\s+throw\w*[^.]{0,40}(?:multiple|more than one|several)/.source,
        // "...returns null when/if/on multiple matches"
        /queryBy[^.]{0,70}(?:returns?|is|gives?)\s+null[^.]{0,30}\b(?:when|if|on|for)\b[^.]{0,25}(?:multiple|more than one|several)/.source,
      ].join('|'),
      'i',
    ),
  },
  {
    id: 'typeless-js-esm-is-detected-not-fatal',
    // Pre-emptive rather than a past regression: no file asserts this today.
    // Kept because the opposite is the natural thing to write, and it stopped
    // being true in Node 22.7.0 / 20.19.0 when syntax detection was enabled by
    // default. Measured on Node 25: `export const x = 1` in a typeless .js
    // runs, warning MODULE_TYPELESS_PACKAGE_JSON, and is reparsed as ESM.
    fact: 'ESM syntax in a typeless .js is reparsed as ESM with a MODULE_TYPELESS_PACKAGE_JSON warning, not a SyntaxError (Node >= 22.7)',
    fixedBy: 'measured, no prior defect',
    wrong: /(SyntaxError|throws?|fatal|fails? to (run|load|parse))[^.]{0,90}(no|missing|without)[^.]{0,30}"?type"?[^.]{0,20}(field|module)/i,
    allow: /detect|reparse|MODULE_TYPELESS|22\.7|20\.19/i,
  },
  {
    id: 'proxy-advises-protected-since-6',
    fact: 'CGLIB proxies advise protected and package-private methods as of Framework 6.0; only private/final are skipped',
    fixedBy: '9125c5f',
    wrong: /non-?public[^.\n]{0,40}(are|is)\s+ignored|public\s+(methods\s+)?only[^.\n]{0,40}prox/i,
    allow: /Spring 5|as of 6|since (Framework )?6|outlived/i,
  },
];

// ---------------------------------------------------------------------------
// PAIRINGS: two version lines that move together. Flags text that crosses them.
// Backed by springboot/Boot4.tsx opening with "Spring 6 (bundled by Boot 3/4)"
// while the same file twice said Boot 4 ships Framework 7. Fixed by c06f6fd.
// ---------------------------------------------------------------------------
const PAIRINGS = [
  {
    id: 'boot-framework-pairing',
    fact: 'Boot 3 ships Spring Framework 6; Boot 4 ships Spring Framework 7',
    fixedBy: 'c06f6fd',
    // "Spring 6 ... Boot 4" or "Framework 7 ... Boot 3" in one sentence.
    // A trailing + or a listed range (6 and 7 / 6, 7) is a RANGE, not a
    // mis-pairing, and `spring6` as an artifact name is not a claim at all.
    wrong: /(Spring|Framework)\s*6(?!\+|\s*(and|or|,|-|–|→|->)\s*7)\b[^.]{0,60}Boot\s*(3\s*\/\s*4|4)\b|(Spring|Framework)\s*7\b[^.]{0,60}Boot\s*3\b(?!\s*\/)/i,
    allow: /Boot 3 ships|Boot 4 ships|\bnot\b|spring6|Spring 7 and|and Spring 7|6\+/i,
  },
];

// ---------------------------------------------------------------------------
function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const files = walk(PAGES);
const findings = [];
const sectionOf = (f) => path.relative(PAGES, f).split(path.sep)[0];
const relOf = (f) => path.relative(PAGES, f);

const lineAt = (src, idx) => src.slice(0, idx).split('\n').length;

// JSX prose wraps across source lines, so matching line-by-line hides an
// `allow` clause that happens to land on the next line -- the first version of
// this script reported four false positives for exactly that reason, two of
// them the correction text of the very defect being guarded. So de-wrap first:
// strip tags and entities, collapse whitespace, then test whole SENTENCES.
// Each sentence keeps the source offset it started at so the report can still
// cite a line.
function sentences(src) {
  const out = [];
  // Work on the raw source but neutralise markup, keeping length stable so
  // offsets stay meaningful.
  // NOTE the \n in the tag character class. Without it, [^>]* happily crosses
  // newlines and swallows an entire `<GuideRules items={[ ... ]} />` block --
  // which silently hid three real defects when this script was first run
  // against them. A tag that spans lines is left alone; that is the safe
  // direction, since leaving markup in can only cause a false positive, while
  // blanking prose causes a false negative.
  const flat = src
    .replace(/<\/?[A-Za-z][^>\n]*>/g, (m) => ' '.repeat(m.length))  // JSX tags
    .replace(/&[a-z]+;|&#\d+;/g, (m) => ' '.repeat(m.length))       // entities
    .replace(/\{'\s*'\}/g, (m) => ' '.repeat(m.length));            // {' '} joins
  let start = 0;
  const re = /[.!?]["')\]]*\s|\n\s*\n/g;
  let m;
  while ((m = re.exec(flat))) {
    const text = flat.slice(start, m.index + 1).replace(/\s+/g, ' ').trim();
    if (text) out.push({ text, offset: start });
    start = re.lastIndex;
  }
  const tail = flat.slice(start).replace(/\s+/g, ' ').trim();
  if (tail) out.push({ text: tail, offset: start });
  return out;
}

for (const file of files) {
  const section = sectionOf(file);
  if (sectionFilter && !sectionFilter.test(section)) continue;
  const src = readFileSync(file, 'utf8');
  const rel = relOf(file);

  // ---- CHECK A: a "N panels" meta claim must match the real panel count ----
  const metaPanels = src.match(/'(\d+)\s+panels'/);
  if (metaPanels) {
    const actual = (src.match(/<GuidePanel\b/g) || []).length;
    const claimed = Number(metaPanels[1]);
    if (actual !== claimed) {
      findings.push({
        kind: 'PANEL-COUNT', section, rel,
        line: lineAt(src, metaPanels.index),
        detail: `meta claims ${claimed} panels, file has ${actual}`,
      });
    }
  }

  // ---- CHECK B/C: asserted facts and version pairings, per sentence ----
  const sents = sentences(src);
  for (const rule of [...FACTS, ...PAIRINGS]) {
    for (const s of sents) {
      const hit = s.text.match(rule.wrong);
      if (!hit) continue;
      if (rule.allow && rule.allow.test(s.text)) continue;
      // Point at the line the MATCH is on, not the line the sentence started
      // on -- a sentence can begin many lines earlier (headings and prose with
      // no terminal punctuation in between), and citing its start sends the
      // reader to an unrelated line.
      const anchor = hit[0].slice(0, 30).trim();
      const at = anchor ? src.indexOf(anchor, s.offset) : -1;
      findings.push({
        kind: PAIRINGS.includes(rule) ? 'PAIRING' : 'FACT',
        section, rel, id: rule.id,
        line: lineAt(src, at >= 0 ? at : s.offset),
        detail: `${rule.id} — ${rule.fact}\n          fixed by ${rule.fixedBy}\n          matched: ${hit[0].replace(/\s+/g, ' ').slice(0, 160)}`,
      });
    }
  }
}

// ---- CHECK D: a field guide's version scope vs its own section's lessons ----
// Backed by typescript/Cheatsheet.tsx capping at "TypeScript 5 -> 6" while the
// section contains "TypeScript 6 -> 7: The Native Compiler". Fixed by 9983209.
let sections = {};
try {
  const s = readFileSync(path.join(ROOT, 'src/data/sections.ts'), 'utf8');
  for (const m of s.matchAll(/id: '([a-z0-9-]+)',\s*\n?\s*title:/g)) sections[m[1]] = true;
  // collect lesson titles per section by scanning section blocks
  for (const m of s.matchAll(/\n {4}id: '([a-z0-9-]+)',[\s\S]{0,8000}?lessons: \[([\s\S]*?)\n {4}\]/g)) {
    const sec = m[1];
    const titles = [...m[2].matchAll(/title: '([^']+)'/g)].map((t) => t[1]);
    sections[sec] = titles;
  }
} catch { sections = {}; }

for (const file of files) {
  const section = sectionOf(file);
  if (sectionFilter && !sectionFilter.test(section)) continue;
  if (!/cheat ?sheet/i.test(path.basename(file))) continue;
  const src = readFileSync(file, 'utf8');
  const scope = src.match(/meta=\{\[\s*'([^']*?(\d+)\s*(?:→|->)\s*(\d+)[^']*)'/);
  const titles = Array.isArray(sections[section]) ? sections[section] : null;
  if (!scope || !titles) continue;
  const top = Number(scope[3]);
  // highest single version number mentioned in any lesson title of this section
  let highest = top;
  for (const t of titles) {
    for (const n of t.matchAll(/\b(\d{1,2})\b/g)) {
      const v = Number(n[1]);
      if (v > highest && v <= top + 6) highest = v; // guard against unrelated numbers
    }
  }
  if (highest > top) {
    findings.push({
      kind: 'SCOPE-DRIFT', section, rel: relOf(file),
      line: lineAt(src, scope.index),
      detail: `field guide scope says "${scope[1]}" but a lesson title in this section reaches ${highest}`,
    });
  }
}

// ---------------------------------------------------------------------------
const byKind = {};
for (const f of findings) (byKind[f.kind] ||= []).push(f);
const kinds = Object.entries(byKind).sort((a, b) => b[1].length - a[1].length);

console.log(`${findings.length} consistency finding(s)\n`);
if (!findings.length) {
  console.log('  No cross-file contradictions, panel-count drift or field-guide');
  console.log('  scope drift against the facts this script knows about.');
  console.log(`  (${FACTS.length} facts + ${PAIRINGS.length} pairings + 2 structural checks)`);
}
for (const [kind, list] of kinds) {
  console.log(`${kind.padEnd(14)} ${String(list.length).padStart(3)}`);
  for (const f of list) {
    console.log(`   ${f.rel}:${f.line}`);
    if (detail) console.log(`          ${f.detail}`);
  }
}
if (findings.length && !detail) console.log('\nRe-run with --detail for the offending lines.');
process.exit(findings.length ? 1 : 0);
