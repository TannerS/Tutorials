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
  // Not a package registry, but the Go section asserts the current toolchain
  // release in six places. That claim went stale (1.27.2 -> 1.27.3) with
  // nothing to catch it, because `wordsFor('go')` drops a two-letter name and
  // every one of those lines also contains PROVENANCE versions that must not
  // move. Hence the explicit subject and the scope: only prose in the Go
  // section, only lines where Go itself is what is being called current.
  { kind: 'go', name: 'go', subject: /\bgo(?:lang)?\b/i, scope: 'go/' },
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

// go.dev/dl returns the two supported stable lines, newest first. Strip the
// `go` prefix so the comparison below sees the same shape as a registry
// version ("1.27.3", not "go1.27.3").
async function goStable() {
  const res = await fetch('https://go.dev/dl/?mode=json');
  if (!res.ok) return null;
  const j = await res.json();
  const v = j.find((r) => r.stable)?.version ?? null;
  return v ? v.replace(/^go/, '') : null;
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

// A number on a currency line is still not a currency CLAIM if it is
// attributed to something else, and this has to be judged per number rather
// than per line, because one line routinely carries both kinds:
//
//   'Go 1.27.3 current · verified on 1.25.5'
//
// 1.27.3 is the claim; 1.25.5 is provenance and must never be bumped. The two
// attributions that show up constantly here are PROVENANCE (what actually ran)
// and HISTORICAL (which version a feature ARRIVED in -- "as of Go 1.22 it
// handles method-based routing" is a fact about 1.22, not about what is
// newest). Matched against the text immediately before the number, tags
// stripped, so only a directly attached attribution counts.
const ATTRIBUTED =
  /(?:verified(?:\s+on)?|real output(?:\s+on)?|measured(?:\s+on)?|ran on|tested on|output from|as of|since|added in|introduced in|arrived in|new in)\s+(?:go|java|node|v)?\s*$/i;

function currencyClaims(pkgWords, { subject, scope } = {}) {
  const hits = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.tsx')) continue;
      const rel = path.relative(PAGES, p);
      // `scope` narrows a tracked entry to one section, for subjects whose
      // name is too common to match safely across the whole repo.
      if (scope && !rel.startsWith(scope)) continue;
      const src = readFileSync(p, 'utf8');
      src.split('\n').forEach((line, i) => {
        if (!CURRENCY.test(line)) return;
        // the package has to actually be the subject of the line
        const isSubject = subject ? subject.test(line) : pkgWords.some((w) => line.toLowerCase().includes(w));
        if (!isSubject) return;
        for (const m of line.matchAll(/\b(\d+\.\d+(?:\.\d+)?)\b/g)) {
          const before = line.slice(0, m.index).replace(/<[^>]*>/g, ' ');
          if (ATTRIBUTED.test(before)) continue;
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
    actual =
      t.kind === 'npm' ? await npmTag(t.name, t.tag)
      : t.kind === 'go' ? await goStable()
      : await mavenRelease(t.name);
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
  const claims = currencyClaims(wordsFor(t.name), { subject: t.subject, scope: t.scope });
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
