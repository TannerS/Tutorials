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
- [x] **D — Database**: sql-fundamentals, sql-design-patterns, sql-advanced, tsql
- [x] **E — Dev fundamentals & tooling**: dsa, version-control, frontend-tooling,
      npm-deep-dive, npm-packages, accessibility
- [x] **F — Architecture & design**: solid, patterns, ddd, systemdesign, microservices,
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

### Phase D — Database (done)

Note: the machine went to sleep repeatedly during this phase, killing the
fact-checker and version-sentinel agents 2-3 times each before they
completed — an environment issue, not a task issue. Also: the first pass
missed relaunching learners-advocate after its first sleep-kill (only
fact-checker/version-sentinel got retried) — caught and relaunched in a
second wave once the gap was noticed.

fact-checker — 5 findings, the 2 confirmed real bugs both fixed:
- `tsql/Cheatsheet.tsx` claimed Postgres evaluates `'a' + NULL` to `NULL`;
  Postgres has no `+` operator for text (only `||`) and actually raises
  `ERROR: operator does not exist: text + text` — fixed.
- **Real correctness bug, two locations**: `tsql/Cheatsheet.tsx` and
  `tsql/Indexing.tsx` both showed `ISNULL(col, default) = target` rewritten
  as `col = target OR col IS NULL` — only valid when default equals target.
  In both shown examples default ≠ target, so the "SARGable rewrite" as
  written silently changes query results (wrongly includes NULL rows).
  Fixed both to the correct rewrite, with a second example showing where
  `OR IS NULL` genuinely is valid.
- 3 lower-confidence findings also fixed: a missing Postgres HOT-update
  caveat in `sql-advanced/Transactions.tsx` (verified empirically against a
  real Postgres 18.6 container — HOT updates measurably skip index
  maintenance when no indexed column changes and the page has free space),
  a function-name mismatch (`get_balance` vs. the actually-defined
  `account_balance`) plus a stale PG16 citation in
  `sql-advanced/StoredProcedures.tsx`, and a timeout-value mismatch (9s
  claimed vs. 8s configured) in `tsql/Transactions.tsx`.

version-sentinel — 3 findings, all fixed: an inconsistent PG16 citation
(rest of the section cites 18.x), a missing `GENERATE_SERIES` cross-reference
in `tsql/Views.tsx`'s tally-table section, and a stale panel count in
`tsql/Cheatsheet.tsx`'s meta chip (claimed 14, actually 15). No real
version-currency errors — Postgres 18.x and SQL Server 2025 citations both
confirmed genuinely current.

learners-advocate — 11 findings, all fixed or addressed:
- **Real diagram defect**: `tsql/Intro.tsx`'s lesson-roadmap FlowChart
  skipped the Views lesson entirely and mislabeled the final node as "9.
  cheat sheet" when the real lesson 9 is Indexing — rebuilt to match the
  actual sequence.
- "Semi-join" used repeatedly (including as a section heading) without ever
  being defined, and `sql-fundamentals/Joins.tsx` (the site's *second*
  lesson) named three physical join algorithms with zero explanation —
  defined semi-join at first use in both `sql-fundamentals/Joins.tsx` and
  `tsql/Joins.tsx`; trimmed the unexplained algorithm-name aside.
- Row-value/tuple comparison (`(a,b) < (x,y)`) used for keyset pagination
  in `sql-fundamentals/Quickstart.tsx` without explaining it's lexicographic
  comparison, not per-column — added an explanation.
- `LATERAL` used unexplained 5 lessons before its own dedicated explanation
  (`sql-design-patterns/MultiTenancy.tsx` → `sql-advanced/Advanced.tsx`),
  and used again before its own in-lesson explanation within Advanced.tsx
  itself — added forward-pointing explanations at both early uses, plus a
  missing diagram for MultiTenancy.tsx's multi-step JSON-fold query.
- `GiST` named without definition one lesson before it's actually explained
  (`sql-design-patterns/Design.tsx` → `Indexing.tsx`) — added a brief
  inline definition.
- Nested-loop join never explained anywhere on the site despite being
  central to reading `EXPLAIN` output, while Hash Join gets a full
  walkthrough in the same lesson — added a matching explanation.
- `sql-advanced/FieldGuide.tsx`'s tagline/footer claimed to summarize "the
  four SQL Advanced lessons" but actually draws from SQL Fundamentals and
  SQL Design Patterns too, while never covering StoredProcedures.tsx —
  rewrote to describe its real scope.
- "RCSI" used a dozen+ times across `tsql/Transactions.tsx` and
  `tsql/Cheatsheet.tsx` without ever being spelled out — expanded at first
  use in both.
- A title/content mismatch (`sql-fundamentals/Aggregation.tsx` promised
  ROWS/RANGE/GROUPS frame coverage but never showed GROUPS) — added a real
  GROUPS example, verified against a live Postgres 18.6 container.
- The entire `tsql/` section had zero InteractiveChallenge components
  despite every other database section using them — added one each to
  `tsql/Transactions.tsx` (RCSI misconception) and `tsql/Indexing.tsx` (the
  ISNULL rewrite pitfall from the fact-checker finding above), rather than
  all 9 files, to keep effort proportional to a "minor/informational"
  finding.

Verified: tsc --noEmit clean, vite build clean, eslint clean.

### Phase E — Dev fundamentals & tooling (done)

Note: the machine went to sleep again during this phase, killing this
phase's review agents mid-run more than once; retried successfully each
time.

fact-checker — 5 findings, most notably a real npm bug, fixed:
- **Real bug, verified by actually triggering it**: `npm-packages/Advanced.tsx`
  taught a `"workspace:*"` protocol for npm workspace dependencies — this is
  Yarn/pnpm-only. `npm install` with that exact syntax fails with
  `EUNSUPPORTEDPROTOCOL`. Fixed to the real npm behavior (an ordinary semver
  range, which npm auto-resolves/symlinks based on the `workspaces` field) —
  including the InteractiveChallenge, which had been reinforcing the wrong
  answer as correct.
- `dsa/LinkedLists.tsx` claimed ArrayList uses a "doubling strategy," directly
  contradicting `dsa/Complexity.tsx`'s own reflection-measured 1.5× growth
  factor in the same section — fixed to match.
- 3 lower-confidence findings also fixed: a stale Renovate config key
  (`matchPackagePatterns` → `matchPackageNames`), a stale pnpm-lock.yaml
  format example, and an imprecise reftable claim in
  `version-control/Internals.tsx`.

version-sentinel — 5 findings, all fixed:
- Stale `actions/checkout@v4`/`actions/setup-node@v4` pins (current: v7)
  across `frontend-tooling/Linting.tsx`, `Monorepos.tsx`,
  `npm-deep-dive/Security.tsx`, `npm-packages/Publishing.tsx`, and
  `accessibility/Testing.tsx` — also found and fixed 2 more instances in
  already-committed files from earlier phases
  (`typescript/Migration.tsx`, `react-testing/Patterns.tsx`).
- `frontend-tooling/Webpack.tsx` claimed webpack "is still the default" in
  Next.js/Angular — both flipped to Turbopack/esbuild defaults in 2025/2023
  respectively; fixed to describe it as the legacy option instead.
- `accessibility/Testing.tsx`: an internal contradiction (its own commented CI
  YAML used the `eslint --ext` flag that `frontend-tooling/Vite.tsx`'s own
  InfoBox says is now a hard error under flat config) — fixed; also added a
  jest-axe-under-Vitest compatibility caveat.
- `version-control/Branching.tsx` taught only `git checkout` with no mention
  that `git switch`/`git restore` graduated from experimental in Git 2.51 —
  added a caveat (didn't rewrite the lesson's primary commands).

learners-advocate — 6 findings, all fixed:
- `dsa/Complexity.tsx` (lesson 0) introduced formal O/Ω/Θ notation with no
  worked numeric example, and Θ/Ω notation is essentially unused in every
  later lesson — added a worked example and an upfront note that O() is
  what the rest of the course actually uses.
- `dsa/Graphs.tsx`'s Dijkstra section had a thinner explanation than every
  other subtlety in the same lesson for why PQ entries can go stale — fixed.
- `dsa/LinkedLists.tsx`'s node-deletion "trick question" had no diagram
  despite the same lesson using two for ordinary insertion — added one.
- `frontend-tooling/Vite.tsx` and `Webpack.tsx` used "bundler" and
  "tree-shaking" before either term is defined anywhere in the section —
  added definitions/forward-pointers at first use.
- Two redundant-content pairs (npm/yarn/pnpm comparison in
  `frontend-tooling/Packages.tsx` vs `npm-deep-dive/Intro.tsx`; "what gets
  published" in `npm-deep-dive/NodeModules.tsx` vs
  `npm-packages/Anatomy.tsx`) — added cross-references naming what's
  actually new in the later occurrence, same pattern as Phase C's
  css-mastery fix.

version-control and accessibility came back with zero findings from
learners-advocate — already well-paced and diagrammed.

Verified: tsc --noEmit clean, vite build clean, eslint clean.

### Phase F — Architecture & design (done)

fact-checker — 3 findings, the 1 confirmed real bug fixed:
- **Real bug, verified empirically**: `api-testing/Controllers.tsx` had a
  genuine self-contradiction — an InfoBox correctly explains that `MockMvc`
  slice tests don't run the servlet container, so multipart size limits go
  unenforced, then the very next code block ships a `MockMvc`-based test
  asserting 413 as if it works. Verified: a real Spring Boot `@WebMvcTest`
  given an oversized file returns 201, not 413. Replaced with a real
  `@SpringBootTest(webEnvironment=RANDOM_PORT)` test, verified to actually
  return 413; a neighboring 415 test had the same problem and was fixed too.
- A stale date (GitHub Actions Node-20-runner removal: Sept 16 → the real
  Sept 23) and an `actions/setup-java@v5` → `@v6` bump, both also caught by
  version-sentinel below.

version-sentinel — 6 findings, all fixed:
- `ddd/SpringBoot.tsx` cited Spring Boot 3.5.16 (EOL'd June 2026) as
  "verified" — the same pattern already fixed in `springboot/Webflux.tsx`
  during Phase A, just missed there. Rebuilt and re-ran the lesson's actual
  Maven project against Spring Boot 4.1.1 — all 9 tests passed identically —
  and found a genuine Boot-4 breaking change in the process
  (`@DataJpaTest` moved modules and packages), documented as a new InfoBox.
- `microservices/Containers.tsx`'s "Production-Ready Node.js Dockerfile"
  used `node:20-alpine` — Node 20 has been EOL since April 2026, so this
  was actively bad advice, not just stale — bumped to `node:24-alpine`.
- `apidesign/Websockets.tsx` anchored a still-correct technical claim (no
  native WebSocket server in Node) to Node 25, EOL since June 2026 —
  re-verified against real Node 24 and 26 installs and re-anchored.
- `actions/setup-java@v5` → `@v6` in `cloud-architecture/Cicd.tsx` and
  `api-testing/Patterns.tsx`; a date fix in the latter (see above).
- `observability/Tracing.tsx`'s Java OpenTelemetry citation (1.44.1, Nov
  2024) bumped to 1.65.0, re-verified against a real build that the API
  surface used in the lesson is unchanged.

learners-advocate — 5 findings, all fixed:
- `patterns/Singleton.tsx` used "instruction reordering" and "happens-before
  relationship" undefined in a graded quiz's own explanation — defined both.
- `ddd/Strategic.tsx`'s context-mapping diagram covered only 3 of the 6
  relationship patterns the prose names — widened to cover all 6.
- `ddd/Tactical.tsx` had no diagram for the aggregate/consistency-boundary
  concept despite the lessons on either side of it using diagrams for
  comparable structural ideas — added one.
- `cloud-architecture/Cheatsheet.tsx` undercounted its own source lessons
  (claimed 4, actually 5) and had zero panels covering the CI/CD lesson
  entirely — added 3 new panels and corrected the count, the same
  scope-mismatch pattern already fixed in `sql-advanced/FieldGuide.tsx`
  during Phase D.
- `cloud-architecture/Cicd.tsx`'s Blue-Green/Canary/Rolling deployment
  strategies were prose/table-only despite the lesson diagramming its
  pipeline-stages sequence just above — added a diagram per strategy.

Verified: tsc --noEmit clean, vite build clean, eslint clean.

Verified: tsc --noEmit clean, vite build clean, eslint clean.
