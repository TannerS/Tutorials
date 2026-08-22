# Review Council — full-repo pass, 2026-08-22

18 agents (fact-checker / version-sentinel / learner's-advocate × 6 domains) across all 334
lessons. Findings deduped and ranked below. Per-lane raw reports were kept separately.

**How to read this:** severity is "how badly does this hurt a reader who trusts the page,"
not "how hard is it to fix." Several Tier-0/1 items are one-line changes.

**The single most useful meta-finding:** in a large majority of cases *the site already has the
right answer somewhere else* — a field guide, a what's-new section, or a sibling lesson. Most of
this is reconciliation, not research. Those cases are marked **[SITE ALREADY RIGHT ELSEWHERE]**.

---

## TIER 0 — security-critical or silently destroys data

1. **`src/pages/auth/Gateway.tsx:169`** — authorization bypass. The authz decision reads
   `x-envoy-original-path` from client-controllable headers; the Envoy config at `:91-98` strips
   only `x-user-id`/`x-user-roles`/`x-session-id`. Envoy does not sanitize that header from
   untrusted downstreams (CVE-2023-27487). Request `/api/admin/users` with
   `x-envoy-original-path: /api/public` and the admin check returns true.
   The page's own challenge at `:509-517` teaches the exact principle this violates.

2. **`src/pages/sql-advanced/StoredProcedures.tsx:190-193`** — recommends `SECURITY DEFINER` *as a
   security improvement* with no `SET search_path`. That is the classic Postgres privilege-escalation
   vector. Demonstrated live against postgres:16: an unprivileged role with only EXECUTE shadowed the
   table and the definer function returned the attacker's `999999999` instead of `1000`. The string
   `search_path` appears nowhere in `sql-advanced/`. Shadowing a *function* or *operator* by the same
   mechanism gives arbitrary code execution as the definer.

3. **`src/pages/sql-field-guide/PostgresGotchas.tsx:237` vs `:242`** — the "sargable fix" silently
   changes the result set. `lower(email) = 'a@x.com'` → 3 rows; the offered rewrite
   `email = lower('a@x.com')` → 1 row. It converts a case-insensitive lookup to case-sensitive, on
   the page whose entire premise is silent-data-loss traps, in the pattern most likely to be pasted
   into a login query. Correct fix is the expression index the card already mentions.
   Same framing recurs at `sql-design-patterns/Indexing.tsx:318-323`.

4. **`src/pages/sql-fundamentals/Joins.tsx:246-251`** — the migration-verification query reports
   "identical" for tables that are not. `EXCEPT` deduplicates, so 3 rows vs 2 rows returns 0.
   `EXCEPT ALL` correctly returns 1. Same defect at `:238-244`. A verification tool that returns
   clean on dirty data is worse than none.

---

## TIER 1 — code that cannot run, or instructions that cannot be followed

5. **`src/pages/auth/Gateway.tsx:100-109, :154`** — the ext_authz example denies every request.
   With `http_service`, Envoy uses `server_uri` only for host/cluster/timeout; the check keeps the
   original path unless `path_prefix` is set, which it isn't. Auth service gets `GET /api/orders`,
   Express 404s, non-2xx = deny.

6. **`src/pages/frontend-tooling/Webpack.tsx:122, 128-129`** — the install command produces a build
   that cannot compile. Unpinned, it resolves `typescript@7.0.2`, which `ts-loader@9.6.2` cannot
   drive (`TypeError: Cannot read properties of undefined (reading 'fileExists')`). The prose already
   names the verified versions; the install line needs to pin them.

7. **`src/pages/frontend-tooling/Webpack.tsx:274-283`** — "Actual terminal output" the shown config
   cannot produce. Real output is a single `main.js 3.3 MiB`; the pasted three-asset output belongs
   to the code-splitting state introduced 75 lines later. Self-contradicts `:238-247`.

8. **`react-router-dom` is removed in React Router v8** (shipped 2026-06-17) — **68 import sites**
   across `src/pages/react-router/*` plus `react-field-guide/Router.tsx`. `react-router/Intro.tsx:34`
   presents the re-export shim as a *feature* rather than a migration path on its way out. No v8
   awareness anywhere; `Migration.tsx` is titled v5→v7 and v6 is now EOL.

9. **"Structured concurrency finalised in Java 25" — false, in 3 files, produces non-compiling code.**
   `java/Advanced.tsx:580`, `springboot/Boot4.tsx:234,237`, `spring-field-guide/Boot4.tsx:196`.
   Still preview (JEP 505 in 25, JEP 525 sixth preview in 26); needs `--enable-preview`. Verified by
   compiling on JDK 26. `ScopedValue` is the API that finalized in 25 — the line conflates them.
   **[SITE ALREADY RIGHT ELSEWHERE]** — `java/Advanced.tsx:711` (same file), `java/Concurrency.tsx:214`,
   `java-field-guide/Concurrency.tsx:289`. Found independently by two lanes.

10. **`src/pages/typescript/Tsconfig.tsx:314-316`** — the `types` default is inverted. Says omitting
    it includes all `@types/*`; TS 6 changed the default to `[]`. Verified empirically against the
    repo's own compiler (`error TS2304` until `"types": ["mylib"]` is explicit). A reader debugging
    missing `@types` globals is sent in exactly the wrong direction.

11. **`baseUrl` taught with no deprecation notice** — deprecated in TS 6, **removed in TS 7**.
    `typescript/Tsconfig.tsx:295,467,592`, `typescript-field-guide/ProjectSetup.tsx:260`,
    `typescript/NewProject.tsx:361`. `npm i typescript` resolves 7.0.2 today, so scaffolding from
    these pages errors on a fresh install. Same for `moduleResolution: "node"` (removed in TS 7)
    at `Tsconfig.tsx:97`.

12. **`src/pages/npm-packages/Publishing.tsx:299-306`** — teaches `npm token create --type=automation`.
    Classic npm tokens were permanently revoked 2025-12-09 and the CLI flag no longer exists
    (`npm token create --help` on 11.6.2 accepts only `--read-only`/`--cidr`).
    **[SITE ALREADY RIGHT ELSEWHERE]** — `npm-deep-dive/Security.tsx:212-245` documents trusted
    publishing correctly. The two lessons contradict each other.

13. **`src/pages/dsa/Graphs.tsx:418-478`** — the Dijkstra implementation cannot run: `Edge` is never
    defined anywhere in the lesson (`:452` does `for (Edge edge : adj.get(node))` with no
    `record Edge(int to, int weight)`). "relax" is also used undefined at `:501`.

14. **`src/pages/css-mastery/Responsive.tsx:351`** — `line-height: clamp(1.5, 1.4 + 0.3vw, 1.8)` is
    invalid and silently dropped by Chromium (adds a unitless number to a length). The only invalid
    declaration found across all 133 CSS blocks in scope — and it's in the copy-paste recipe.

---

## TIER 2 — factually wrong teaching (measured, not argued)

15. **`react19/Hooks.tsx:939-943, :950` + `CheatSheet.tsx:288-289`** — "a `.then()` chain produces 2
    renders" is **1**, measured in real Chromium against the repo's own react@19.2.6. Chained `.then`
    callbacks drain in the same microtask checkpoint. Every other row of the batching table is
    correct. Self-contradicts `CheatSheet.tsx:277` and `Hooks.tsx:944`. The lesson's own stated rule
    predicts the right answer.

16. **`react-antipatterns/Effects.tsx:412-416`** — "an effect loops **iff** running it changes
    something in its own dependency array," presented as a complete decision procedure, is wrong
    twice in the same code block 20 lines above (a no-dep-array effect loops with no deps to change;
    an unstable-dep effect loops on identity, not overlap).

17. **`react-field-guide/Gotchas.tsx:34, :43`** — an "infinite loop" card whose code cannot loop.
    Measured: 1 render, 1 effect run. `setData` was trimmed for the poster format but the label kept.
    Contradicts the "THE TEST" card on the same poster.

18. **`react-antipatterns/State.tsx:307-318`** — the stated *correctness* reason for using a ref is
    false for real user clicks; React flushes discrete events synchronously, so two clicks never hit
    it. Measured both ways. The recommendation is right, the model it teaches is wrong.

19. **`forwardRef` and `Context.Provider` called "deprecated"** — neither is. `forwardRef`:
    `react19/Hooks.tsx:1295`, `CheatSheet.tsx:778`, `react-field-guide/Hooks.tsx:294`,
    `React19.tsx:827`. `Context.Provider`: `React19.tsx:445` (an `<h2>`), `:449`,
    `react-field-guide/Hooks.tsx:89`. `React19.tsx` contradicts itself 40 lines apart.
    **[SITE ALREADY RIGHT ELSEWHERE]** — `react19-whats-new/Features.tsx:294,509`,
    `react19/Context.tsx:492`. Found independently by two lanes.

20. **"Spring AOP only weaves public methods" — wrong for Spring 6+**, in 4 places:
    `springboot/Transactions.tsx:69-76` (most confident: "silently ignored"), `springboot/Aop.tsx:40,407`,
    `spring-field-guide/Gotchas.tsx:188`. As of Framework 6.0 `protected` and package-visible methods
    are transactional for class-based proxies. `private` is still correct. The site teaches Boot 3/4,
    i.e. exactly the versions where the rule changed.

21. **`dsa/Complexity.tsx:313-318`** — the binary-search step table is off by one on every row, and
    the prose invents an explanation for a gap that doesn't exist (and the explanation is backwards —
    an extra check would push measurements *above* the formula). True worst case equals
    `floor(log2 n)+1` exactly, found by exhaustive search. On the page that stakes its credibility on
    "every number was produced by running real Java."

22. **`accessibility/Keyboard.tsx:184`** — `aria-label` on a bare `<div>` is spec-prohibited
    (`role="generic"` is name-prohibited per ARIA 1.2 §5.2.8.6) and is dropped by conforming AT. It's
    the route-change focus handler, so it fails at precisely the job the comment claims.
    Fix: `role="main"` or use `<main>`.

23. **`systemdesign/Distributed.tsx:91`** — `R + W > N` does not give linearizability. Quorum overlap
    is not consensus; Cassandra resolves concurrent writes by last-write-wins timestamps, and
    linearizability needs LWTs at `SERIAL`. The same page defines CAP's C *as* linearizability at
    `:28`, and the lesson is framed as interview prep.

24. **`architecture-docs/Adrs.tsx:171, :185`** — the *model ADR* claims cross-service atomicity via
    local ACID transactions, for a flow including a third-party payment call and a separate service's
    database. **[SITE ALREADY RIGHT ELSEWHERE]** — `patterns/Composite.tsx:229` ("the rollback is a
    lie") and `microservices/Patterns.tsx:371` exist to correct this exact mistake. It's the artifact
    a learner copies.

25. **`accessibility/Testing.tsx:328-330`** — `#333` on white labelled ~7:1; actual **12.63:1**
    (computed via the WCAG luminance formula). 7:1 is the AAA threshold, so the error lands exactly
    on a decision boundary. `:322` also off (2.5 vs 2.85).

26. **`css-mastery/Grid.tsx:418-422`** — the `minmax(0,1fr)` gotcha is backwards. Measured: it never
    collapses to one column; the real defect is that it *never wraps*, so there's no responsive
    breakpoint. A reader debugging that exact symptom will rule out the actual cause.

27. **Cascade-layer rules stated absolutely; both invert under `!important`** —
    `css-mastery/Variables.tsx:257, :602`, `css-field-guide/Gotchas.tsx:198-206`. Measured in Chromium:
    with `!important`, layered beats unlayered and *earlier* layers win. Neither file mentions this,
    and the field-guide caption gives library authors architecture advice built on the un-inverted rule.

28. **`frontend-tooling/Vite.tsx:135-142`** — `__dirname` in `vite.config.ts` does not throw. Verified
    on a clean Vite 8.2.2 ESM project: both dev and build succeed; `configLoader: 'bundle'` shims it.
    The advice is good, the mechanism is wrong, and the real reason to migrate goes untaught.

29. **`sql-design-patterns/Indexing.tsx:37`** — "1 billion rows needs only ~30 node traversals" is the
    *binary*-tree figure. Measured with `pageinspect` on a real 10M-row index: **3 levels**, not 23.
    ~4-5 for 10⁹. Sits in the box titled "B-Tree Key Properties."

30. **`sql-fundamentals/Joins.tsx:268`** — "or use DISTINCT" does not fix 1:N SUM inflation; it turns a
    visible 3× overcount into a quiet undercount (200 → 600 buggy → 100 with DISTINCT). The lesson's
    own code block demonstrates only the correct remedy.

31. **`auth/Jwt.tsx:372-374`** — the algorithm-confusion demo is wrong for the library it names. Run
    against `jsonwebtoken@9.0.3`, both attacks are rejected with no `algorithms` option. Advice is
    right, reason is wrong. Also declares `const decoded` twice — SyntaxError if pasted.

32. **`auth/Cookies.tsx:118-121`** — the same-site definition is self-contradictory (premise implies
    the opposite of the conclusion; schemeful same-site makes http/https *different* sites).
    **`:108-110`** — Firefox does not default to `SameSite=Lax`.

33. **PG18 broke the absolute left-prefix rule, and a quiz now grades learners wrong.**
    `sql-design-patterns/Indexing.tsx:40, :532` (an `InteractiveChallenge`),
    `sql-field-guide/SchemaDesign.tsx:107`. PG18 B-tree skip scan uses a multicolumn index with no
    restriction on leading columns when the leading column is low-cardinality.

34. **`sql-design-patterns/Design.tsx:310-311`, `sql-field-guide/SchemaDesign.tsx:163`** — "Postgres
    has STORED only, no VIRTUAL" inverts the PG18 default (VIRTUAL is now the default; STORED is
    opt-in). All code samples write STORED explicitly so the code still works — but a reader trusting
    the prose and dropping the keyword on a `tsvector` column gets a failing `CREATE INDEX`.

35. **`cryptography/Mistakes.tsx:220-224`** — the padding-oracle demo blames the wrong mechanism
    (flips the final block, not the previous one). Outcome right, mechanism wrong — and manipulating
    the previous block *is* the attack, which the prose states correctly at `:203`.

36. **Two challenge explanations contradict their own lesson** —
    `auth/Cookies.tsx:552,557` (session cookies "deleted when browser closes"; `:132-147` explicitly
    corrects this) and `auth/Security.tsx:716-720` (CSP host allowlists; `:504-509` calls them
    "largely ineffective"). Also `sql-advanced/Transactions.tsx:477-487` — the correct answer states
    the snapshot-at-BEGIN misconception the lesson at `:179` is at pains to debunk.

37. **`dsa/Cheatsheet.tsx:52, :29`** — reasserts the ArrayList "doubling" myth (it's 1.5×) and the
    naive-Fibonacci `O(2^n)` figure, both of which `Complexity.tsx:488, :360` spends sections
    correcting — and builds a quiz question around. The cheat sheet is what a reader revises from.
    Found independently by two lanes.

38. **`react19/Hooks.tsx:955`** — "stable `dispatch` identity is one of the biggest advantages over
    `useState` setters." Setters are stable too (measured). **[SITE ALREADY RIGHT ELSEWHERE]** —
    `react-field-guide/Stability.tsx:52`.

39. **React Compiler ↔ React 19 conflation** — `react19/React19.tsx:15` (opening sentence: "React 19…
    introduces the React Compiler"), `Lifecycle.tsx:707` ("upcoming" — it's 1.0),
    `react-antipatterns/Performance.tsx:639` ("stable as of React 19"). It ships independently.
    **[SITE ALREADY RIGHT ELSEWHERE]** — `react19-whats-new/Features.tsx:598-609` and its quiz at
    `:661` exist precisely to correct this.

40. **`npm-deep-dive/Scripts.tsx:222, :230`** — "all package.json fields are available as
    `npm_package_*`" is false since npm 7; only `name`, `version`, `config.*`, `json` survive.
    `npm_config_registry` is not exported from `.npmrc`. The two examples shown happen to be
    survivors, so the section reads as verified.

41. **`typescript-field-guide/BestPracticesGotchas.tsx:230`** — "a `let` that is never reassigned keeps
    its narrowing" is false (verified: `TS18047` at the closure boundary regardless). Only `const`
    survives. Hands the reader a false diagnostic.

42. **`css-mastery/Variables.tsx:114`** — `[data-theme]` is *not* higher specificity than `:root`
    (both `(0,0,1,0)`); it wins on source order only. `Tokens.tsx:163` uses the correct
    `:root[data-theme=…]`. Reordering stylesheets silently kills the theme toggle.

43. **`microservices/Events.tsx:341-362`** — the dedup pattern drops events permanently if the consumer
    crashes between claiming and processing (claim survives its 7-day TTL; redelivery is skipped as a
    duplicate). The `SET NX EX` atomicity claim itself is correct.

44. **`microservices/Communication.tsx:210, :537`** — "7-10x faster" for gRPC with no workload, metric,
    or basis; silently converts the adjacent (defensible) payload-*size* ratio into a speed ratio.

45. **`javascript/FunctionsClosures.tsx:226-231`** — output labelled "verified with node" includes a
    line that never executes; the uncaught ReferenceError aborts the module, so the third and most
    interesting demo never runs.

46. **`version-control/Internals.tsx:143`** — the lightweight-tag block shows the merge commit's hash
    six commits before that merge exists. (All four *deterministic* hashes on the page reproduce
    byte-for-byte — this one block is out of order.)
    **`version-control/Branching.tsx:207`** — "changes the parent, which changes the tree" is a false
    causal rule; the commit's bytes include the parent hash.

47. **`java-field-guide/Concurrency.tsx:96`** — `lock.tryLock(1, TimeUnit.SECONDS)` doesn't compile
    (unreported `InterruptedException`) and never calls `unlock()`, directly under a caption saying
    "unlock() must live in finally."
    **`java/Collections.tsx:483-491`** — claims "// Output: false" from a snippet with no `println`.

48. **`spring-field-guide/AopEvents.tsx:163`** — wrong default `@Async` executor for Spring *Boot*
    (Boot auto-configures a `ThreadPoolTaskExecutor`, not `SimpleAsyncTaskExecutor`), and it hides
    the real Boot footgun: an effectively unbounded queue means `maxPoolSize` is never reached.

---

## TIER 3 — teachability (the learner's-advocate lane)

**Sequencing / prerequisites**
- **React has no fundamentals lesson before the deep dive**, and the one that exists
  (`react-field-guide/Fundamentals.tsx`) is section 8 of 8 while its own tagline calls it "the base
  layer every other page assumes." The first React lesson is "Component Lifecycle In Depth."
- **`react19/Lifecycle.tsx` (lesson 0) is the section's hardest page** — it contains lesson 3, 6 and
  7's material. Exact break point: `:214`, an InfoBox on `React.memo` + Context, neither yet taught.
- **The auth section is written to be read *after* cryptography but is ordered before it.**
  `Authz.tsx:396` promises the next lesson covers key material (it's Cookies); `Cookies.tsx:17`
  opens "the problem the last lesson left open: TLS secured the channel" (TLS is 9 lessons later);
  `Tls.tsx:460` promises the next two lessons are Cookies and JWT (next is Trust Stores).
  `CertificateIssuance.tsx` and `Tls.tsx` each cite the other as prior reading.
- **`sql-fundamentals/Joins.tsx:135-150`** puts a `WITH RECURSIVE` CTE in lesson 2 of the beginner
  track; recursive CTEs are taught in a different, later section.
- **`dsa/StacksQueues.tsx:195` teaches heap internals 3 lessons before Heaps** and then tests it —
  `Heaps.tsx:25` even acknowledges the gap.
- `java/Collections.tsx` uses generics for a full lesson before `Generics.tsx` teaches them.
- `springboot/Di.tsx:707` (lesson 2) tests lesson-11 vocabulary.
- `typescript/Types.tsx:820, :131` use `keyof`/indexed access/template literals two lessons early —
  `Generics.tsx:327` is literally headed *"Two operators you have been shown but never taught."*
- `typescript-field-guide`'s prev/next chain inverts the main section's order
  (best-practices before the types lesson it depends on).
- Error Boundaries is React lesson 20 but depended on from lesson 9; Portals is last but explained
  in lesson 6.

**Missing diagrams** (this site treats diagrams as load-bearing; these are the highest-value gaps)
- **`dsa/Trees.tsx:47-150`** — four traversal orders, zero diagrams. Every later DSA lesson assumes
  traversal order is intuitive. *Highest-value single diagram in the repo.*
- **`dsa/Graphs.tsx:418`** — Dijkstra with no priority-queue trace; the greedy mechanism is never
  observable.
- **`microservices/Data.tsx:384` + `Patterns.tsx:179`** — saga diagrams show only the happy path;
  compensation is never drawn. **The diagram already exists** at `systemdesign/Distributed.tsx:345`,
  in a later section.
- **`springboot/Resilience.tsx:15`** — defers circuit-breaker states to a lesson in a different
  section that the chain never routes to, then never defines them. **The diagram already exists** at
  `microservices/Patterns.tsx:131`. *Cheapest high-value fix in the repo — inline it.*
- **`java/Collections.tsx:419`** — the HashMap bucket walk (the lesson's hardest mechanism) is an
  ordered list; the one FlowChart is the interface taxonomy.
- **`css-mastery/Grid.tsx`** — a 2-D layout system with zero spatial diagrams, while the *preceding*
  Flexbox lesson diagrams both its axes. Grid line numbering (the classic off-by-one) lives only in
  code comments.
- **`cryptography/Aead.tsx:27-80`** — three MAC/cipher compositions in prose, and the challenge at
  `:240` requires distinguishing them. **`Hashing.tsx:166-186`** — Merkle–Damgård + Keccak + sponge +
  length-extension in one 20-line paragraph, with `||` (concatenation) never defined.
- **ECDH is called "mathematical magic" twice and never drawn**, while the *easier* concept
  (public-key encryption) gets a locksmith analogy.
- **`typescript/Advanced.tsx:1064`** — variance is a direction-of-arrows concept given as text; one
  two-arrow-pair diagram would carry it.
- **`ddd/Tactical.tsx`** — zero diagrams, and the aggregate boundary is DDD's most spatial idea.
  `ddd/SpringBoot.tsx:18` says the prior lessons were "vocabulary **and diagrams**"; they weren't.
- **`cloud-architecture/MultiRegion.tsx`** — 210 lines, zero diagrams; RTO/RPO are literally described
  as a clock and a distance.
- **`observability/ThreePillars.tsx:192`** — an InfoBox titled "blurrier than **the diagram** suggests"
  on a page with no diagram.
- **No lesson anywhere in the repo uses a mermaid `sequenceDiagram`** — every multi-party flow (OAuth,
  TLS handshake, SAML, ACME, saga, WebAuthn) is forced into a flowchart shape with no party lanes.

**Undefined terms** (each verified absent by grep)
- **Suspense is never defined in 67 React lessons** — every mention is an application.
- "Message Authentication Code" appears nowhere in `src/`, though MAC is load-bearing for two lessons.
  Also unexpanded: IV, IND-CPA, JWKS, CRL/OCSP, SPIFFE, `cnf`.
- 2PC (microservices), low-cardinality (observability), burn rate (incidents), split-brain, Aggregate,
  two-generals, CDC — each defined only in a *later* section, or not at all.
- semi-join/anti-join, heap tuple, selectivity, MVCC (used at `Transactions.tsx:16`, expanded ~300
  lines later).
- Virtual DOM and Reconciliation appear in the first diagram of the first React lesson, undefined.
- "tree-shaking" used in tooling lesson 1, defined in lesson 6.
- STW, JFR, linearithmic, in-degree, DAG, relax, spread().

**Structural**
- **`dsa/Cheatsheet.tsx:172`** — the section index says "All 10 lessons" for a 14-lesson section and
  omits Recursion, Heaps, Tries and Union-Find entirely; numbering is wrong from entry 5 on.
- **`react-query/`** is the only one of 8 React sections with zero `InteractiveChallenge`, and its
  core `staleTime`/`gcTime` model is defined only in the cheat sheet (the last lesson). The canonical
  fresh→stale→inactive→GC diagram doesn't exist.
- Five crypto lessons have zero challenges, including `Mistakes.tsx` — the trap-spotting capstone.
- `patterns/Intro.tsx:388` (lesson 0) asks the reader to distinguish four patterns, none yet taught;
  the distractor is answerable only by keyword match.
- `microservices/Migration.tsx:100,:130,:143` states as fact ("bounded context = one microservice",
  "Aggregates are yellow") what `ddd/EventStorming.tsx:126,:162,:303` explicitly marks as contested
  and warns against — and microservices comes first.
- Testcontainers and `@WebMvcTest` are each taught from scratch three times.
- `dsa/ArraysSorting.tsx:449` recommends insertion sort as the top choice; it is never taught.
- `dsa/Trees.tsx:19` defines height in edges then measures it in nodes (consistent off-by-one).
- `SecureLoginFlow.tsx:51` says "two lessons back"; it's three. `Signatures.tsx:244` renders a source
  filename in a user-facing heading. `AppliedJava/Node` claim four identical programs; two differ.
- Three crypto lessons open by answering a question the reader never asked ("That intuition is
  correct…" as the first sentence).

---

## TIER 4 — staleness and citations (low risk, cheap)

- **RFC 7807 → RFC 9457** (obsoleted July 2023) across `springboot/`, `spring-field-guide/`, and
  `apidesign/Errors.tsx:38,46,545` (heading, code title and quiz all lead with the dead number).
  **[SITE ALREADY RIGHT ELSEWHERE]** — `api-testing/Validation.tsx:157`, `apidesign/Advanced.tsx:641`.
- **Residual "WCAG 2.1"** at `accessibility/Testing.tsx:317`, `Intro.tsx:277,285`,
  `css-mastery/Animations.tsx:424` — 2.2 is Recommendation since 2023 and ISO-approved Oct 2025.
  **[SITE ALREADY RIGHT ELSEWHERE]** — `accessibility/Intro.tsx:64-121` documents all 9 new criteria.
  Ratios are unchanged, so this is a pure label fix. *This is the exact pattern PROGRESS.md records
  the site being caught by before.*
- **`accessibility/Intro.tsx:169-185`** — EAA "enforcement begins June 2025" in future tense 14 months
  late; **the DOJ ADA Title II rule is missing entirely** (WCAG 2.1 AA binding; deadlines 2027-04-26
  and 2028-04-26) — the most consequential live US accessibility deadline.
- **GitHub Actions pinned at v4** in `testing/E2e.tsx:309`, `testing/Performance.tsx:740`,
  `api-testing/Patterns.tsx:308` — v4 declares `node20`, which **GitHub removes from runners
  2026-09-16**. `Performance.tsx` also teaches `node-version: 20` (EOL April 2026).
  **[SITE ALREADY RIGHT ELSEWHERE]** — `cloud-architecture/Cicd.tsx:103` already uses v7/v5/v7.
- **Kubernetes Gateway API appears nowhere** (zero grep hits); Ingress is taught as the answer, but
  the API is feature-frozen and **ingress-nginx was retired March 2026** (no CVE patches).
- **Istio on `networking.istio.io/v1beta1`** (promoted to `/v1`; identical body) and sidecar presented
  as the only mesh model — ambient mode GA'd in Istio 1.24.
- **OTel semantic conventions pre-stabilization** — `http.method` → `http.request.method`,
  `db.system` → `db.system.name`, `db.statement` → `db.query.text` in `observability/Tracing.tsx`.
- **Vite lesson contradicts itself on its own bundler** — `frontend-tooling/Vite.tsx:26,50` still
  teaches esbuild+Rollup while `:62` correctly notes Rolldown is the Vite 8 default.
  Same in `react19/BuildToolchain.tsx:275`.
- **CVE-2025-55182** (RSC deserialization RCE, CVSS 10.0) absent from `react19/Server.tsx`; and
  `react19-whats-new/Migration.tsx:290` recommends a floor below the patched releases while mixing
  `--save-exact` with a caret range.
- **JS lessons stop at ES2024** and frame it as complete; ES2025 and ES2026 are both ratified. The
  site teaches several of those features but attributes them to *TypeScript* releases.
- Version pins: Spring Boot 3.4.0 (`java/BuildTools.tsx`) and 3.5.16 (`ddd/SpringBoot.tsx`) are past
  OSS support; `springboot/Setup.tsx` pins Boot 4.0.0 + Java 21 and labels the test starter "JUnit 5"
  (Boot 4 baselines JUnit 6); Terraform AWS provider `~> 5.0` pins off the entire v6 major, with no
  mention of OpenTofu; `sql-field-guide/*` banners say PostgreSQL 17+ (18.6 is current);
  Pact-JVM, OpenAPI 3.1, BloomRPC (archived), kafkajs (unmaintained).
- **Cypress vs Playwright table reads like 2022** — Playwright is now ~78M weekly downloads vs ~7.4M
  and *is* the mature ecosystem; the "Cypress parallel = paid" row is overstated.
- `accessibility/Testing.tsx:410` — automated-coverage "30-50%"; Deque's own study says 57%.
- Anchor positioning called "least settled" — it reached Baseline 2026.

---

## What the council verified as CORRECT (do not re-audit)

Stated plainly because a lot of it was checked by execution, not reading:

- **Java is the strongest technical content on the site.** `java/Concurrency.tsx`'s visibility demo
  reproduces exactly (2.0–2.1B iterations vs the claimed 2110180242); `java/Reflection.tsx` matches
  byte-for-byte down to `unnamed module @1dbd16a6`; every `-XX:+PrintFlagsFinal` value in
  `JvmInternals.tsx` reproduces. All five substantive Spring errors are Spring-5-facts that
  Spring 6 changed.
- **JEP 491 virtual-thread pinning is handled better than most published material** — four files
  correctly flag "swap `synchronized` for `ReentrantLock`" as *now-stale* advice while keeping the
  lock-across-I/O caveat.
- **`cryptography/CertificateIssuance.tsx`** — the published EC private key genuinely derives the
  published public key byte-for-byte, and that key appears identically in the CSR and signed cert.
- **The `SecureRandom` LCG attack predicted the undrawn value 5/5.**
- **All of `sql-advanced/Cte.tsx`**, the `Aggregation.tsx` window examples, the `Transactions.tsx`
  isolation behaviour (verified with genuinely concurrent sessions), and all 18 `PostgresGotchas`
  items still hold on PG 18.6.
- **Every claimed output in `patterns/`** matched, in both the Java and JS twins.
- **All arithmetic** — availability tables, QPS, the entire error-budget lesson, Jeff Dean latency
  ratios, `0.999³`.
- **`react-query/`, `react-testing/`, `state-mgmt/`** are fully v5/current-correct; every Zustand
  claim checks out against real zustand@5.0.15.
- **Security bugs from earlier rounds are genuinely fixed** — refresh rotation marks tokens used,
  OAuth ID tokens are JWKS-verified, Argon2id at OWASP params, `csurf` correctly flagged.
- **`playground/`** — no findings from any lane; the "change one value, watch what moves" pattern is
  the model the dense sections should copy.
- **Navigation integrity across all 88 architecture lessons** and the accessibility section's
  pedagogy were both checked and clean.

## Known coverage gaps

- The SQL/DSA fact-checker reached ~20 of 34 lessons. **Unexamined: most `dsa/` algorithm
  implementations** (ArraysSorting, LinkedLists, Trees, Graphs, DynamicProgramming, Recursion, Heaps,
  Tries, UnionFind, Hashing, StacksQueues). Given that two errors surfaced in DSA material that
  *looked* meticulous, this is where a follow-up pass should start.
- The Java fact-checker prioritized concurrency and executable claims; `java/{Oop,Generics,Exceptions,
  Io,Intro,BuildTools}` and most of `springboot/{Rest,Di,Config,Error,Intro,Setup,Kafka,Observability,
  Resilience,SecurityMigration,Testing}` were not deeply verified.
