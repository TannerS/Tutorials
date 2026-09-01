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

## Remaining

- [ ] **3** — Spring Boot 2 to full parity: mirror Boot 4's DI, REST, Data,
      Testing, Config, Error Handling, Transactions, Kafka, AOP, WebFlux,
      Resilience4j, Observability for Boot 2 APIs (~10 new lessons)
- [ ] **4** — Spring Boot 2 field guide (falls out of the parity work)
- [ ] **8** — new lesson on AG Grid (github.com/ag-grid/ag-grid) for React
- [ ] **9** — React Router: complete v5 section and complete v8 section.
      The section label has been corrected to "React Router v6/v7 (Data Router)"
      so it no longer overstates what the lessons contain. Building v5 and v8 is
      a rewrite against each real API, not a relabel.
- [ ] **10** — regenerate every field guide after the version splits land
- [ ] **12** — SQL: keep SQL Fundamentals, add a complete PostgreSQL section,
      keep T-SQL complete and separate

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
