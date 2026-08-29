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
- [x] 11 (partial) — field guide format built; T-SQL and JavaScript converted
- [x] 7 (partial) — JavaScript now has a field guide
- [x] fix — `tsql` and `mui9` were missing from the sidebar (registered but in
      no nav group, and the sidebar renders only groups). Both added.

## Remaining

- [ ] **11** — convert the other 20 cheat-sheet lessons to the field-guide
      format and rename each to "<Topic> Field Guide":
      java, springboot, springboot2, react18, react19-whats-new, ddd,
      cloud-architecture, observability, dsa, version-control, cryptography,
      typescript, react-router, state-mgmt/zustand, react-query, react-testing,
      mui, mui9, css-field-guide/basics
- [ ] **11** — fold the 6 standalone `*-field-guide` sections into their parent
      sections as a single dense field-guide lesson each:
      sql, react, typescript, css, java, spring(boot 4)
- [ ] **6** — drop the TypeScript cheat sheet once the TS field guide covers it
      (do this as part of the fold, not before)
- [ ] **3** — Spring Boot 2 to full parity: mirror Boot 4's DI, REST, Data,
      Testing, Config, Error Handling, Transactions, Kafka, AOP, WebFlux,
      Resilience4j, Observability for Boot 2 APIs (~10 new lessons)
- [ ] **4** — Spring Boot 2 field guide (falls out of the parity work)
- [ ] **8** — new lesson on AG Grid (github.com/ag-grid/ag-grid) for React
- [ ] **9** — React Router: complete v5 section and complete v8 section.
      NOTE: the existing lessons were written for the v6/v7 data-router API and
      the section is currently *labelled* v8 — that label is not yet verified
      against the real v8 API. Treat it as a rewrite, not a relabel.
- [ ] **10** — regenerate every field guide after the version splits land
- [ ] **12** — SQL: keep SQL Fundamentals, add a complete PostgreSQL section,
      keep T-SQL complete and separate
- [ ] **14** — accuracy and layout-consistency audit across the whole site

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
