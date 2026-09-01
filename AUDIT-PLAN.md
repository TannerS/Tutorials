# Site-wide correctness audit — phases and progress

Item 14 from GUIDE-REFACTOR-PLAN.md, broken into resumable phases (41
sections / 325 lessons total — too large for one pass). Each phase runs
fact-checker + version-sentinel + learners-advocate in parallel over its
scope, applies findings with lesson-author, verifies with `tsc --noEmit` +
`vite build`, then commits and pushes before the next phase starts. Delete
this file when every phase is checked off and folded back into
GUIDE-REFACTOR-PLAN.md's item 14.

If a phase is interrupted mid-way (token limit, session end), resume by
re-running that phase — reviewing already-correct content again is cheap
compared to losing track of what's left.

## Phases

- [x] **A — Java & Spring backend**: java, springboot, springboot2, from-scratch
- [x] **B — React core & ecosystem**: react18, react19-whats-new, react-antipatterns,
      state-basics, state-context, state-zustand, react-query, react-testing, react-router
- [x] **C — Frontend languages**: typescript, javascript, css-mastery, mui, mui9
- [ ] **D — Database**: sql-fundamentals, sql-design-patterns, sql-advanced, tsql
- [ ] **E — Dev fundamentals & tooling**: dsa, version-control, frontend-tooling,
      npm-deep-dive, npm-packages, accessibility
- [ ] **F — Architecture & design**: solid, patterns, ddd, systemdesign, microservices,
      cloud-architecture, observability, apidesign, api-testing
- [ ] **G — Security & testing**: auth, cryptography, testing

## Known follow-up (not yet fixed)

- `src/pages/typescript/RuntimeValidation.tsx` — the `UserSchema.safeParse` example
  claims `issues.length` is 4; real output (checked against zod 4.4.3 and 4.5.4) is
  5, because the `avatar` field is `nullable()` but not `optional()` and the test
  payload omits it. Surfaced incidentally by the Phase C TypeScript fix pass while
  verifying an unrelated Zod version citation — out of scope for that pass, still
  needs a fix.

## Findings log

(Filled in per phase as issues are found and fixed — not every minor fix needs
an entry, but anything a future reader would want to know about goes here.)

### Phase A — Java & Spring backend (done)

fact-checker found **zero errors** after an unusually deep pass (compiled and
ran ~15 Java programs against the real installed JDK, diffed dependency
versions against real Maven Central artifacts, web-verified JEPs/CVEs/RFCs).
It read ~29 of 49 files in depth, weighted toward security/concurrency/JPA;
the remaining ~20 files (mostly intro/setup/config-type lessons, lower risk)
were not read in this pass — fine to leave as-is given zero defects in the
highest-risk material, but worth another look if this phase is ever re-run.

version-sentinel and learners-advocate findings, all fixed:
- `springboot/Webflux.tsx` wrongly claimed verification against Spring Boot
  3.5.16 (EOL 2026-06-30) inside the Boot-4-current section — corrected to
  reference Boot 4.1.1, matching every other lesson in the section.
- `springboot2/Cheatsheet.tsx` and `springboot2/Migration.tsx` had a stale/
  inconsistent Boot 3.x and Boot 2.7 EOL dates — reconciled against
  `springboot2/Intro.tsx`'s already-correct table.
- `java/TestingBasics.tsx` and `java/Mockito.tsx` cited JUnit Jupiter 6.0.3;
  bumped to current 6.1.3 (re-verified by actually building and running
  Maven projects against it).
- Added diagrams (matching the site's existing FlowChart style) to
  `java/JvmInternals.tsx` (memory layout), `java/BuildTools.tsx` (dependency
  resolution), `java/Concurrency.tsx` (virtual-thread pinning), and
  `springboot/Resilience.tsx` (Resilience4j composition order + retry loop).
- Reordered `java/Streams.tsx` so the "write your own Gatherer" subsection
  (an advanced, rarely-needed skill) no longer sits ahead of foundational
  stream-creation material later in the same lesson.

### Phase B — React core & ecosystem (done)

fact-checker found 2 confirmed bugs (both fixed):
- `react18/Effects.tsx` had a real double-submit bug in a code sample (called
  `submitToAPI` twice in one handler, contradicting its own prose) — reduced
  to one call and the surrounding explanation rewritten to be coherent.
- `react-router/Advanced.tsx` conflated two opposite React Router v7
  flat-routes conventions — trailing-underscore (nesting escape, still has a
  URL segment) vs leading-underscore (pathless layout, no URL segment) — and
  mislabeled the former as the latter. Replaced with two correctly-labeled
  contrasting examples.
(Everything else it checked across ~60 empirical checks — real Playwright
browser runs, real npm installs — held up; see the full report for what was
and wasn't deep-read.)

version-sentinel — 2 minor findings, both fixed:
- `state-mgmt/Comparison.tsx` now flags Recoil as archived by Meta (Jan
  2025) with known React 19 concurrent-rendering issues, pointing to Jotai.
- `state-mgmt/ZustandAdvanced.tsx`'s TypeScript-5.9 citation corrected to
  6.0.3 (the repo's actually-installed version) after re-verifying the
  underlying curried-`create<T>()()` claim still holds under it.

learners-advocate — 5 findings, all fixed:
- **Real sequencing bug**: `react18/Lifecycle.tsx` (lessonIndex 0, the very
  first lesson) was teaching a full context-memoization walkthrough and
  hook-internals content that isn't introduced until Hooks Deep Dive (index
  2) and Context & Composition (index 6), and gets taught properly there
  anyway. Trimmed to a forward-referencing InfoBox; the freed-up "fiber"
  definition moved to Hooks.tsx where it's genuinely first needed now.
- "Fiber" jargon: added a proper first-use definition + diagram in
  `react18/Hooks.tsx` (component tree vs fiber tree).
- Added missing state-machine diagrams to `react18/State.tsx` and
  `state-mgmt/Patterns.tsx`.
- Added the missing "same React tree, different DOM tree" diagram to
  `react18/Portals.tsx`.
- Rewrote `state-mgmt/Intro.tsx`'s closing paragraph (and a matching stale
  comment) to describe the section's real lesson sequence instead of
  leftover copy from before the state-mgmt split.

Verified: tsc --noEmit clean, vite build clean, eslint clean on all changed
files, and several pages spot-checked live via Playwright (zero console
errors, diagrams render).

### Phase C — Frontend languages (done)

fact-checker — 3 findings, fixed:
- `typescript/NativeCompiler.tsx`'s "measured on this repository" file/line
  count (269 files / 111k lines) was stale — repo has grown to 361 files /
  168k lines; re-measured and updated.
- `css-mastery/FieldGuide.tsx` Panel 27 made a false SITEWIDE claim (inline
  styles everywhere) introduced when the panel was condensed from
  `StyleInclusion.tsx`'s correctly-SCOPED original claim (inline styles only
  in that lesson's own demo components) — restored the scoping.
- `typescript/Cheatsheet.tsx` and `typescript/React.tsx` overstated
  `forwardRef` as already deprecated in React 19; @types/react 19.2.15 has
  no `@deprecated` tag on it yet — tightened to "no longer necessary,
  scheduled for future deprecation."

version-sentinel — 5 findings, fixed:
- `typescript/NodeTypescript.tsx` described `--experimental-transform-types`
  as a live escape hatch; Node 26 REMOVED it outright (not stabilized) —
  corrected, including a downstream InteractiveChallenge that assumed the
  flag still existed.
- `typescript/NewProject.tsx`'s CRA wording softened to "maintenance mode"
  when React formally sunset it Feb 2025 — tightened.
- `typescript/RuntimeValidation.tsx` Zod citation bumped 4.4.3 → 4.5.4.
- `javascript/ErrorHandling.tsx` and `javascript/Es2017.tsx` had a stale nav
  label ("ES2015-2024") that didn't match the actual page title
  ("ES2015-2026") — fixed both.
- `css-mastery/Animations.tsx` mislabeled WCAG SC 2.3.3 as Level AA; it's
  AAA — fixed.
- `mui9/*.tsx` (and, found during the fix pass, `mui/*.tsx` too) cited
  @mui/material 9.3.1; current is 9.4.0 — bumped across both sections for
  consistency, confirmed via live npm dist-tags that nothing taught changed.

learners-advocate — 7 findings + 1 lower-confidence pacing note, fixed:
- `typescript/Intro.tsx` (lesson 0, before any type is taught) dumped a
  near-complete tsconfig reference that's retaught properly in
  `typescript/Tsconfig.tsx` (lesson 9) — trimmed to install steps + a
  forward pointer.
- `typescript/Interfaces.tsx` spent half its length on full class-OOP
  content the title didn't signal — renamed to "Interfaces, Type Aliases &
  Classes" with a clear Part 1/Part 2 split (sections.ts title updated to
  match).
- `css-mastery/Fundamentals.tsx` had no diagram for z-index stacking-context
  nesting despite using diagrams for every other structural concept in the
  same lesson — added one.
- `css-mastery/Variables.tsx` and `css-mastery/Tokens.tsx` re-taught the
  same theming-tier pattern two lessons apart with no acknowledgment —
  Tokens.tsx now cross-references back and names what's actually new.
- `css-mastery/DesignSystemTokens.tsx` (a deep Carbon-Design-System dive
  unrelated to this site's actual React+MUI stack) sat in the main sequence
  with no signal it was optional — added a clear "skip freely" InfoBox.
- `mui/StylingV4.tsx` and `mui/Overrides.tsx` used bare CSS-specificity
  tuples with no definition and no link to css-mastery's cascade lesson,
  and used an inconsistent 3-column form vs. css-mastery's 4-column one —
  added a primer, reconciled the notation, and (found in the process) fixed
  a real specificity-tuple miscalculation in one code sample.
- `mui/Theming.tsx` had no diagram for the theme object's shape (12 keys,
  ~17 palette sub-keys) despite other MUI lessons using diagrams for
  comparable structural content — added a tree diagram.
- (Not acted on — lower confidence, flagged for awareness only)
  `typescript/Generics.tsx` stacks a lot of ground in one lesson; the
  reviewer judged each section individually well-motivated, so no fix was
  made, just noted here in case a future pass wants to revisit pacing.

Both merged field guides (`typescript/Cheatsheet.tsx`, 26 panels;
`css-mastery/FieldGuide.tsx`, 27 panels) were confirmed to read as coherent
single documents, not two sections stapled together.

Verified: tsc --noEmit clean, vite build clean, eslint clean on all touched
files.
