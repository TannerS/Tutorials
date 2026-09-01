# Site refactor — decisions and remaining work

Working notes for the 14-item review. Decisions here are settled; the checklist
below is what is left. Delete this file when the list is done.

## Settled decisions

**Quick references are called FIELD GUIDES.** One name, one format, everywhere.
A field guide is the **last lesson of its own section** — not a standalone
section. Version splits therefore get one field guide each, automatically,
because each version is its own section.

**Format** — `GuideLayout` + `GuidePanel` (`src/components/`, styles in
`src/styles/guide.css`). Modelled on printed cheat sheets: dark ground, bold
masthead, dense grid of numbered colour-accented panels. The sheet owns its
colour tokens rather than inheriting the site theme, like `PosterLayout`; the
toggle in the masthead is for printing.

```tsx
<GuideLayout title="T-SQL" kicker="FIELD GUIDE" glyph="🗄️"
             tagline="…" meta={['…']} page="1 / 1" footer="…" prev={…} next={null}>
  <GuidePanel n={1} title="House Style" accent="blue" glyph="✍️" span={2}>
    <GuideCode>{`…`}</GuideCode>
    <GuideDefs items={[['term','definition']]} />
    <GuideTable head={['a','b']} rows={[['1','2']]} />
    <GuideRules items={['one-line takeaway']} />
  </GuidePanel>
</GuideLayout>
```

Accents cycle `blue purple green amber pink cyan red`. `span` is 1–3.
Reference implementations: `src/pages/tsql/Cheatsheet.tsx` (15 panels),
`src/pages/javascript/Cheatsheet.tsx` (12 panels).

**React Router** — v5 and v8 only, as complete separate sections. No v7, no
migration guide. Verified real versions: `latest 8.3.1`, `version-7 7.18.3`,
`classic 5.3.4`.

**Spring Boot 2** — full parity with Boot 4's 19 lessons. Duplication is fine
and expected; the point is that each version stands alone.

**Version splits generally** — keep versions in separate sections even where
content duplicates. Applies to React 18/19, MUI v4/v9, React Router v5/v8,
Postgres/T-SQL, Spring Boot 2/4.

## Done

- [x] 1 — State Management split into three sections: Core State Patterns,
      Context & Providers, Zustand
- [x] 2 — "React Core" → "React 18 (Core)"
- [x] 5 — "MUI v4 (Material-UI)", "MUI v9 (Current)"
- [x] 13 — "Communicating Architecture" (architecture-docs) removed entirely
- [x] 11 — field guide format built and applied to all 21 cheat-sheet lessons:
      T-SQL (15 panels), JavaScript (12), React 18 (14), Java (15), Spring Boot 4 (16),
      Spring Boot 2 (12), DDD (11), Cloud & Infrastructure (11), Observability (9),
      DSA (15), Git/Version Control (14), Cryptography (13), TypeScript (18),
      React Router v6/v7 (15), React Query (10), React Testing (14), MUI v4 (16),
      MUI v9 (11), React 19 What's New (9), Zustand (9), CSS Basics (12).
      Each renamed to "📋 <Topic> Field Guide" in the sidebar (React Router,
      React Query, and CSS Basics previously had no 📋 prefix — added for
      consistency). TypeScript's field guide is the one exception to "last
      lesson of its section" — native-compiler/runtime-validation/node still
      follow it in src/data/sections.ts; its `next` prop points at
      native-compiler instead of null. Revisit when TypeScript's fold (below)
      happens.
- [x] 7 (partial) — JavaScript now has a field guide
- [x] fix — `tsql` and `mui9` were missing from the sidebar (registered but in
      no nav group, and the sidebar renders only groups). Both added.
- [x] 11 — folded all 6 standalone `*-field-guide` sections into their parent
      sections. Two became new lessons (no prior field guide existed there):
      `sql-advanced/field-guide` (19 panels, folds the old `sql-field-guide`
      section — SQL's natural "last stop" section, chosen since the 3 SQL
      sections have no single obvious parent) and `css-mastery/field-guide`
      (27 panels, folds `css-field-guide`). Four were merged into their
      section's existing field guide in place: React 18 (14→26 panels, folds
      `react-field-guide`'s 12 lessons), TypeScript (18→26, folds
      `typescript-field-guide`'s 6 — also closes item **6**, the old TS cheat
      sheet is now the single merged page), Java (15→24, folds
      `java-field-guide`'s 6), Spring Boot 4 (16→20, folds
      `spring-field-guide`'s 11 — most of its content was already covered, so
      the count only grew modestly, which is correct not incomplete). All 6
      standalone section directories were deleted from `src/pages/`, their
      entries removed from `src/data/sections.ts` (both the `sections` array
      and every `groups`/`children` `sectionIds` list), and their routes/
      imports removed from `src/App.tsx`. Two stale cross-links in
      `src/pages/from-scratch/Intro.tsx` (pointing at
      `/java-field-guide/concurrency` and `/spring-field-guide/aop-events`)
      were repointed at `/java/cheatsheet` and `/springboot/cheatsheet`.
      Verified: `tsc --noEmit` clean, `vite build` clean, every lesson path in
      `sections.ts` resolves to a real `App.tsx` route (325/325).
- [x] **14** — accuracy and layout-consistency audit across the whole site,
      done in 7 topic phases (A–G) tracked in the now-deleted AUDIT-PLAN.md.
      Each phase ran fact-checker + version-sentinel + learners-advocate in
      parallel, applied findings, and verified with `tsc --noEmit` + `vite
      build` before committing. Total: ~90 findings across the 7 phases,
      the large majority fixed; a handful of lower-confidence/awareness-only
      notes were deliberately left unactioned (see each phase's findings log
      in git history — search commit messages for "audit: fix Phase"). No
      security vulnerabilities or broken auth patterns were found in the
      Phase G security-content pass. Real bugs caught along the way (not
      just staleness/teachability): a silently-wrong SQL "SARGable rewrite"
      that changed query results, a self-contradicting MockMvc test that
      couldn't actually trigger the 413 it asserted, an npm workspaces
      protocol that doesn't exist in npm (Yarn/pnpm-only), and a double-
      submit bug in a React `Effects.tsx` code sample.

- [x] **3** — Spring Boot 2 brought to full parity with Boot 4: added DI &
      IoC, Building REST APIs, Error Handling & Validation, Transactions
      Deep-Dive, Kafka, AOP & Interceptors, WebFlux, Resilience4j &
      Circuit Breakers, and Observability (9 new lessons, all built against
      real Spring Boot 2.7.18 / Spring Framework 5.3.31 / Hibernate
      5.6.15.Final / javax namespace, verified via javap bytecode
      decompilation, Maven Central BOM diffs, and live-container testing —
      not asserted from memory). Section grew from 8 to 18 content lessons
      + field guide (19 total). Existing lessons (Javax, Security, Data,
      Config, Testing, Actuator, Migration) renumbered and re-linked into
      the new prev/next chain.
- [x] **4** — Spring Boot 2 field guide expanded from 12 to 21 panels,
      covering all 9 new lessons (panel 12's Section Index rewritten to
      list all 18 lessons).
- [x] **8** — `src/pages/react18/AgGrid.tsx` added as the last lesson in
      React 18 (Core), covering AG Grid v36.1.0 (verified current),
      `ag-grid-community`/`ag-grid-react`/`ag-grid-enterprise`, the
      Theming API (`themeQuartz` etc.) vs legacy CSS-import themes, and
      `AgGridProvider` (added v35.1). React 18 Field Guide grew from 26 to
      27 panels to cover it; `Portals.tsx`'s `next` repointed from `null`.
- [x] **9** — React Router v5 (Classic) and v8 (Current) built as complete,
      fully separate 9-lesson sections (Setup, Nested Routes, Data,
      Guards, Advanced, Testing, Full App, a version-specific closer
      lesson, field guide) — real APIs, not relabels. v5 verified against
      `react-router-dom@5.3.4` (Switch/Route, prefix matching, no
      Outlet/loaders, useHistory/useRouteMatch, withRouter). v8 verified
      live: `react-router-dom` is fully removed (no v8 was ever published
      to it — npm `latest` frozen at 7.18.3), middleware always-on,
      `data`→`loaderData` field rename, Node 22.22+/React 19.2.7+/Vite 7+,
      ESM-only, no official v7→v8 codemod. The pre-existing "React Router
      v6/v7 (Data Router)" section (`react-router`) was left untouched —
      its own v5→v6→v7→v8 migration narrative already covers that ground
      and isn't in conflict with the two new sibling sections.
- [x] **12** — Postgres coverage extended with two new lessons closing the
      gap against T-SQL's completeness: `sql-design-patterns/Json.tsx`
      (JSON vs JSONB, operators, GIN indexing, full-text search) and
      `sql-design-patterns/Views.tsx` (views, materialized views, RANGE/
      LIST/HASH partitioning, real extensions — pg_trgm, pgcrypto,
      pg_stat_statements). Both verified against a live `postgres:18`
      Docker container (current stable major). Two real corrections
      surfaced and were written up rather than glossed over: (1)
      `gen_random_uuid()` has been core since Postgres 13 — no extension
      needed, contradicting the common pgcrypto/uuid-ossp assumption; (2)
      views run with their **owner's** privileges by default, silently
      bypassing even `FORCE ROW LEVEL SECURITY` from the Multi-Tenancy
      lesson — flagged in a danger `InfoBox` with the PG15+
      `security_invoker = true` fix. Shared field guide
      (`sql-advanced/FieldGuide.tsx`) grew from 19 to 21 panels.
      `sql-fundamentals` stays generic/portable per the settled decision;
      `tsql` stays complete and separate, untouched.
- [x] **10** — every field guide touched by this round of version-split
      work was regenerated in the same pass its section changed (React 18:
      26→27, Spring Boot 2: 12→21, PostgreSQL/`sql-advanced`: 19→21, plus
      the brand-new React Router v5 and v8 field guides built alongside
      their sections). PDF regeneration completed via
      `npm run build:pdf:dark`: 44 section PDFs (including the new
      `react-router-v5-dark.pdf`, `react-router-v8-dark.pdf`,
      `springboot2-dark.pdf`, `sql-design-patterns-dark.pdf`) plus the
      57MB combined `tutorials-complete-dark.pdf` — "No lessons skipped"
      confirmed by the build script itself. `dist-pdf/` is gitignored, so
      nothing to commit here; regenerate again with the same command
      whenever content changes.

## Remaining

Nothing — all 14 items are done. This file can be deleted.

## Notes for whoever picks this up

- `dist-pdf/` was emptied at some point outside of any build or git command.
  Only `tsql-dark.pdf` has been regenerated. The rest need rebuilding once the
  content settles: `node scripts/build-pdf.mjs <section> --dark`.
- `npm run build` runs `tsc && vite build`; the tsc step takes minutes on this
  repo. `npx vite build` alone is ~1s when types are already known good.
- The sidebar renders **only** nav groups (`groups.map(...)` in `Sidebar.tsx`)
  — a section not listed in some group's `sectionIds` is unreachable. Check
  after adding any section.
- Group labels are uppercased by CSS and one section label is double-quoted
  (it contains an apostrophe), so naive audits report phantom gaps.
