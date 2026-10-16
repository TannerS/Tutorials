// Checks the repo's "latest version is X" claims against live registries.
//
// WHY: version drift is the error class this repo is most exposed to, because
// so many lessons deliberately quote real registry state. An audit found
// react-router claimed 8.3.1 (actual 8.4.0), @mui/material 9.4.0 (9.5.0),
// ts-jest 29.4.12 (29.4.15), Mockito 5.23.0 (5.24.0) and OpenTofu 1.12 (1.13).
// None of those are findable by typecheck, lint, or reading.
//
// WHAT IT DOES NOT DO: it does not rewrite anything, and it deliberately does
// not flag every version string in the repo. Most of them are PROVENANCE --
// "Real output on 9.4.0", "verified on Node v25.2.1" -- which record what
// actually ran and must NOT be bumped; doing so turns measured output into
// fabricated output. Only the packages listed below are tracked, and the
// report is for a human to act on.
//
//   node scripts/check-versions.mjs           # report drift
//   node scripts/check-versions.mjs --json    # machine-readable
//
// Exits 1 if any tracked package has drifted, so it can gate CI if you want.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'src/pages');
const asJson = process.argv.includes('--json');

// Packages whose CURRENT version the lessons assert. `npm` reads dist-tags;
// `maven` reads maven-metadata.xml. `claimed` is the value the lessons should
// be quoting -- update it when you update the prose, so this stays honest.
const TRACKED = [
  { kind: 'npm', name: 'react-router', tag: 'latest' },
  { kind: 'npm', name: 'react-router', tag: 'version-7' },
  { kind: 'npm', name: 'react-router-dom', tag: 'latest' },
  { kind: 'npm', name: '@types/react-router-dom', tag: 'latest' },
  { kind: 'npm', name: '@mui/material', tag: 'latest' },
  { kind: 'npm', name: '@mui/material', tag: 'latest-v7' },
  { kind: 'npm', name: '@mui/styles', tag: 'latest' },
  { kind: 'npm', name: 'react', tag: 'latest' },
  { kind: 'npm', name: 'typescript', tag: 'latest' },
  { kind: 'npm', name: 'vite', tag: 'latest' },
  { kind: 'npm', name: 'jest', tag: 'latest' },
  { kind: 'npm', name: 'ts-jest', tag: 'latest' },
  { kind: 'npm', name: '@testing-library/react', tag: 'latest' },
  { kind: 'npm', name: '@testing-library/dom', tag: 'latest' },
  { kind: 'npm', name: '@testing-library/user-event', tag: 'latest' },
  { kind: 'npm', name: 'msw', tag: 'latest' },
  { kind: 'npm', name: 'zustand', tag: 'latest' },
  { kind: 'npm', name: '@tanstack/react-query', tag: 'latest' },
  { kind: 'npm', name: 'ag-grid-community', tag: 'latest' },
  { kind: 'maven', name: 'org/springframework/boot/spring-boot' },
  { kind: 'maven', name: 'org/springframework/spring-core' },
  { kind: 'maven', name: 'org/mockito/mockito-core' },
  { kind: 'maven', name: 'org/junit/jupiter/junit-jupiter' },
  { kind: 'maven', name: 'io/github/resilience4j/resilience4j-core' },
  { kind: 'maven', name: 'au/com/dius/pact/consumer/junit5' },
];

const isStable = (v) => v && !/-(?:alpha|beta|rc|pre|M\d|dev|nightly|canary|experimental)/i.test(v);

async function npmTag(name, tag) {
  const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name).replace('%40', '@')}`);
  if (!res.ok) return null;
  const j = await res.json();
  return j['dist-tags']?.[tag] ?? null;
}

async function mavenRelease(p) {
  const res = await fetch(`https://repo1.maven.org/maven2/${p}/maven-metadata.xml`);
  if (!res.ok) return null;
  const xml = await res.text();
  // <release> can be a milestone; prefer the newest STABLE version instead,
  // because a lesson saying "current is X" means the current stable line.
  const all = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((m) => m[1]);
  const stable = all.filter(isStable);
  return stable.length ? stable[stable.length - 1] : (xml.match(/<release>([^<]+)/)?.[1] ?? null);
}

// Find CURRENCY ASSERTIONS only: a version number sitting next to language
// that claims it is the newest ("latest is X", "the current release is X",
// "as of ... X", "now at X").
//
// This distinction is the whole point of the tool, and getting it wrong in
// either direction is bad. An earlier version asked "is today's version cited
// anywhere in the repo?" -- which flagged react, vite, user-event and
// react-query as stale when all four were correct: every mention was
// PROVENANCE ("Verified -- vite 8.2.2", "Measured on React 19.2.6"), which
// records what actually ran and must never be bumped. A lesson can be
// perfectly accurate and never mention the current release at all.
//
// So: match the claim, not the number.
const CURRENCY = /(latest|current(?:ly)?|newest|as of|now at|now sits at|ships? as)/i;

function currencyClaims(pkgWords) {
  const hits = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.tsx')) continue;
      const src = readFileSync(p, 'utf8');
      src.split('\n').forEach((line, i) => {
        if (!CURRENCY.test(line)) return;
        // the package has to actually be the subject of the line
        if (!pkgWords.some((w) => line.toLowerCase().includes(w))) return;
        for (const m of line.matchAll(/\b(\d+\.\d+(?:\.\d+)?)\b/g)) {
          hits.push({ file: path.relative(PAGES, p), line: i + 1, version: m[1] });
        }
      });
    }
  };
  walk(PAGES);
  return hits;
}

// Words that identify a package in prose, derived from its registry name.
function wordsFor(name) {
  const base = name.split('/').pop();
  const out = new Set([name.toLowerCase(), base.toLowerCase()]);
  // spring-boot -> "spring boot"; resilience4j-core -> "resilience4j"
  out.add(base.replace(/-/g, ' ').toLowerCase());
  out.add(base.replace(/-core$|-jupiter$/, '').toLowerCase());
  return [...out].filter((w) => w.length > 2);
}

const rows = [];
for (const t of TRACKED) {
  let actual = null;
  try {
    actual = t.kind === 'npm' ? await npmTag(t.name, t.tag) : await mavenRelease(t.name);
  } catch {
    actual = null;
  }
  const label = t.kind === 'npm' ? `${t.name}@${t.tag}` : t.name.split('/').pop();
  if (!actual) {
    rows.push({ label, actual: null, note: 'could not reach registry' });
    continue;
  }
  // Only lines that ASSERT currency count. A version that merely appears
  // somewhere is almost always provenance, and provenance is not drift.
  const claims = currencyClaims(wordsFor(t.name));
  const major = actual.split('.')[0];
  // Compare against claims on the same major line, so "latest-v7 = 7.3.11"
  // is not judged against a v9 release.
  const relevant = claims.filter((c) => c.version.split('.')[0] === major);
  const wrong = relevant.filter((c) => !actual.startsWith(c.version) && c.version !== actual);
  rows.push({ label, actual, claims: relevant.length, wrong });
}

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

const drifted = rows.filter((r) => r.wrong?.length);
const ok = rows.filter((r) => r.actual && !r.wrong?.length);
const unknown = rows.filter((r) => !r.actual);

console.log(`tracked packages: ${rows.length}\n`);
ok.forEach((r) =>
  console.log(
    `  ok     ${r.label.padEnd(38)} ${String(r.actual).padEnd(12)} ` +
      `${r.claims} currency claim${r.claims === 1 ? '' : 's'} on this major, all agree`,
  ),
);
if (drifted.length) {
  console.log('\nCURRENCY CLAIMS THAT DISAGREE WITH THE REGISTRY:');
  drifted.forEach((r) => {
    console.log(`\n  ${r.label} — registry says ${r.actual}`);
    r.wrong.forEach((w) => console.log(`     ${w.file}:${w.line}  claims ${w.version}`));
  });
  console.log(`
These are CANDIDATES, not findings. Open each line before changing anything —
on the first run all three candidates were false positives:

  - a line reading "latest=6.4.8 (behind), latest-v6=6.5.0" was correct and
    more precise than this tool; the regex just grabbed the second number
  - "useEffectEvent - React 19.2" states which version INTRODUCED a feature,
    which is a historical fact, not a currency claim
  - a "Real output" block for resilience4j-spring-boot2 was compared against
    resilience4j-core, a different artifact

And never sweep the repo for the old number. Most occurrences are provenance
("Real output on X", "Verified — X"), which records what actually ran; bumping
those attributes real measurements to a version that never produced them.`);
}
if (unknown.length) {
  console.log('\nunreachable (network?):');
  unknown.forEach((r) => console.log(`  ?      ${r.label}`));
}
process.exit(drifted.length ? 1 : 0);
