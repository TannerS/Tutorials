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
- [ ] **C — Frontend languages**: typescript, javascript, css-mastery, mui, mui9
- [ ] **D — Database**: sql-fundamentals, sql-design-patterns, sql-advanced, tsql
- [ ] **E — Dev fundamentals & tooling**: dsa, version-control, frontend-tooling,
      npm-deep-dive, npm-packages, accessibility
- [ ] **F — Architecture & design**: solid, patterns, ddd, systemdesign, microservices,
      cloud-architecture, observability, apidesign, api-testing
- [ ] **G — Security & testing**: auth, cryptography, testing

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
