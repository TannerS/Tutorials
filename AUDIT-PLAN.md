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
- [ ] **B — React core & ecosystem**: react18, react19-whats-new, react-antipatterns,
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

### Phase B — React core & ecosystem (reviews done, fixes not yet applied)

fact-checker: pending (agent was killed once by a machine-sleep event mid-run
and relaunched; awaiting its result).

version-sentinel — 2 minor findings:
- `state-mgmt/Comparison.tsx` mentions Recoil with no caveat; Meta archived
  it Jan 2025 and it has known React 19 concurrent-rendering issues — add a
  "deprecated, migrate to Jotai" note.
- `state-mgmt/ZustandAdvanced.tsx` cites a TypeScript-5.9 verification; repo
  is actually on TypeScript 6.0.3 (installed version). Low priority — the
  underlying technical claim is still correct, just the version citation is
  stale by one major version.

learners-advocate — 5 findings, most notable:
- **Real sequencing bug**: `react18/Lifecycle.tsx` is lessonIndex 0 (the
  first lesson, prev=null) but uses `useContext`/`useReducer`/`useMemo`/
  `useCallback`/`React.memo` and teaches full context-memoization patterns
  that aren't formally introduced until Hooks Deep Dive (index 2) and
  Context & Composition (index 6) — the same material then gets re-taught
  twice more later. Needs restructuring, not just a caveat.
- "Fiber" / "fiber tree" used repeatedly across 5 files as load-bearing
  jargon, never defined or diagrammed anywhere in the section.
- Two state-machine diagrams missing (`react18/State.tsx`,
  `state-mgmt/Patterns.tsx`) despite both lessons using FlowChart elsewhere.
- `react18/Portals.tsx` has zero diagrams for its core "same React tree,
  different DOM tree" concept.
- `state-mgmt/Intro.tsx`'s closing paragraph describes a lesson sequence
  that doesn't match its actual `next` prop — looks like leftover copy from
  before the state-mgmt section was split into state-basics/state-context/
  state-zustand.

Fixes for Phase B's findings not yet applied as of this checkpoint — resume
here if picking this back up.
