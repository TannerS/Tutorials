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

- [ ] **A — Java & Spring backend**: java, springboot, springboot2, from-scratch
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
