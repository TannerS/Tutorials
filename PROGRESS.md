# Session Progress Log

All queued work from this session is complete. Nothing has been committed to git — everything below is in the working tree only, ready for review.

## Done (verified: typecheck + build clean throughout)

1. Site-wide day/night theme toggle — CSS token system in global.css, FlowChart/mermaid re-render on toggle, all shared components themed.
2. Backend section reorganized — SQL → "Database" group; API Design/Auth/Microservices → "Architecture & Design" group; Backend is now pure Java+Spring.
3. Old `java-cheatsheet`/`react-cheatsheet` sections retired (superseded by field guides).
4. Field guides split into 4: React 19 (11 pages), TypeScript (6), Java (6), Spring Boot 4 (11) — each audited/expanded for completeness.
5. Field guide theme + horizontal-scroll bugs fixed; toggle relabeled from "B&W printer" wording to "☀️ Light mode"/"🌙 Dark mode".
6. "Tooling & DevOps" group removed — sections relocated into Frontend (`frontend-tooling`/`vite`/`webpack`/`npm-deep-dive`/`npm-packages`) and Architecture & Design (`docker`).
7. Database refactored: `sql` (8 lessons) → `sql-fundamentals`/`sql-design-patterns`/`sql-advanced` (10 lessons, Postgres-flavored, new schema-pattern/multi-tenancy content) + new `sql-field-guide` (5 poster pages).
8. CSS Mastery expanded 6→9 lessons (Sass/SCSS, design tokens referencing this site's own theming system, style-inclusion methods) + new `css-field-guide` (6 poster pages).
9. New `api-testing` section (5 lessons), cross-referencing rather than duplicating the existing `testing/` section.
10. Design Patterns: scenario-grounded "when to use/avoid" callouts added to 8 of 13 pattern files.
11. Caching strategies expanded (stampede mitigations, materialized views, worked Redis/Gateway example).
12. ARIA/accessibility: plain-HTML examples added alongside React ones, concise per-concept explanations.
13. **Full-repo accuracy + completeness audit (Task #28)** — 4 parallel lanes, each read every lesson in its scope and fixed real issues in place:
    - **CSS + Tooling + Testing** — fixed a wrong CSS Grid gotcha, added modern CSS (View Transitions, `@starting-style`, container query units) to Animations/Responsive/Variables + mirrored into css-field-guide, fixed react-testing's Jest/Vitest mismatch, modernized ESLint flat-config examples site-wide. Confirmed `frontend-tooling/vite.tsx` is ~90% redundant with the dedicated `vite/` section — added a cross-reference callout rather than restructuring.
    - **React + TypeScript** — closed real gaps against the "Understanding TypeScript" course benchmark: Decorators was a 15-line stub (now a full Stage-3-vs-legacy treatment), Classes/OOP was essentially absent (now added), utility types were missing ~7. Added 5 missing React-19-specific items (Context-as-provider, ref cleanup functions, resource preloading, etc.) and fixed a stale `forwardRef` example. Both cheat sheets updated, 8 new field-guide PosterCards.
    - **Architecture & Design** — found and fixed real security defects: broken JWT rotation (deleted tokens instead of marking used, defeating replay detection), a deprecated CSRF library (`csurf`, archived 2022) with an overclaimed SameSite guarantee, OAuth ID tokens decoded without signature verification, password hashing entirely absent from the auth section. Also fixed a Docker bug leaking devDependencies into production images, added the Null Object pattern, distributed tracing coverage, and corrected WCAG 2.1→2.2.
    - **Backend + Database** (5 attempts total — hit a session-usage limit twice and dropped connections twice more; each retry checkpointed against disk state and typecheck before continuing, no broken partial edits at any point) — fixed a real accuracy bug (virtual-thread pinning guidance was obsoleted by JEP 491/Java 24, site still taught the old workaround as the only fix), added Stream Gatherers (JEP 485, previously uncovered), added Spring Framework 7's built-in resilience support, filled a missing Boot 4 section in the Spring cheat sheet, added Postgres `pg_stat_statements`/lock-timeout coverage. Got full line-by-line audits on Concurrency/Streams/Advanced (Java), Aop/Boot4/Cheatsheet (Spring), Indexing (SQL).
14. **Task #29 (Backend+DB follow-up)** — after repeated agent interruptions, finished this pass directly rather than via subagent. Found and fixed a real rendering bug: two `InteractiveChallenge` questions (`java/Syntax.tsx`, `java/Streams.tsx`) embedded their code sample as literal `\n` text inside the `question` string prop, which renders as a squished run-on line in a plain `<p>` — while the exact same code was *also* passed correctly via the separate `code` prop, so it displayed twice, once mangled. Removed the duplicated/broken copy from `question`, kept the properly-rendered `code` prop. Confirmed no other files have this pattern (`grep` swept the whole `pages/` tree). Also: added a Hibernate 7 mention to `springboot/Data.tsx`'s pagination-plus-collection-join caveat (was Hibernate-6-only), and updated `java/Advanced.tsx`'s version recommendation to lead with Java 25 (current LTS) instead of Java 21, consistent with its own version-recap table. Targeted `grep` sweeps across the remaining Java/Spring files for common staleness markers (Spring Boot 3-only APIs, `WebSecurityConfigurerAdapter`, stale Java-version framing) turned up nothing else wrong. **Not done**: full line-by-line reads of `java/{Syntax,Oop,Generics,Exceptions,Io,Optional,Intro}.tsx`, most `springboot/*`, `sql-fundamentals/*`, `sql-advanced/*`, `java-field-guide/{Syntax,OopGenerics,ExceptionsIo,Concurrency}.tsx` — these got a fast pattern-based check, not the exhaustive read the other 3 audit lanes received. If you want that level of scrutiny on backend content specifically, worth another pass.

**Final verification**: `npx tsc --noEmit` and `npx vite build` both clean; scripted consistency check confirms all sections are referenced exactly once across groups with zero orphans/duplicates, zero orphaned page directories.

## Monorepo flatten (Task #12) — done

User confirmed demo-react/demo-spring (referenced in the old README/package.json but never actually built) are dead — just collapse to a single flat repo. Moved `apps/tutorials/*` up to repo root; folded `packages/ui`'s 5 genuinely-used exports (CodeBlock, TableOfContents, CommandPalette, LiveExample, useCommandPaletteShortcut) into `src/components/`, dropping `packages/ui/InfoBox.tsx` which was dead code (shadowed everywhere by the app's own theme-aware `InfoBox`); inlined `packages/tsconfig`'s base+react config into one root `tsconfig.json`; removed Turborepo entirely (turbo.json, the devDependency, npm workspaces); rewrote root `package.json`/`README.md` to describe the site as it now exists. Verified clean: `tsc --noEmit`, `vite build`, dev-server smoke test. Committed and pushed (`343f194`).

Found and reverted one thing along the way: `eslint.config.js` only lints `.js`/`.jsx` files, never `.tsx` — confirmed by testing that widening the glob throws parser errors across the codebase, since there's no `typescript-eslint` parser/plugin installed. Left as-is; fixing it properly means adding a new dependency and is a separate task, not part of the flatten.

## Round 2 — Playground section (uncommitted, built since the last commit)

Built a new "Playground" section (currently nested in the Frontend group's `sectionIds`, see Round 3 task #37 to move it to root) with 3 lessons, all verified via typecheck/build/route-smoke-test:
1. **JS/TS Compiler Comparison** (`/playground/compiler`) — split-screen, pick a year (ES3→ES2025/ESNext), see actual `ts.transpileModule` downleveled output. 12 example snippets (10 plain JS, 2 optional TS).
2. **TypeScript Type Checker** (`/playground/type-checker`) — real semantic type-checking via `@typescript/vfs` (fetches real lib.d.ts from TS's CDN, cached in localStorage) + `ts.createVirtualTypeScriptEnvironment`. 6 examples, strict-mode toggle, clickable diagnostics list that jumps the editor selection to the error.
3. **JSX Compiler Comparison** (`/playground/jsx-compiler`) — same pattern, React-focused: JSX runtime selector (Classic `React.createElement` vs Automatic `jsx-runtime`) combined with the year-target selector, 6 JSX examples.

All 3 lazy-load the `typescript` package (~3.5MB) and `@typescript/vfs` as separate async chunks — zero weight added to any other page. `typescript` moved from devDependencies to dependencies (genuine runtime dep now). Every example snippet's expected output was independently verified against the real compiler via Node before being wired into the UI, not just eyeballed.

**Bug fix (also uncommitted)**: `Sidebar.tsx` determined the active/expanded section via `pathname.startsWith('/' + sectionId)` — a raw substring check, so `/java-field-guide/...` matched the `java` section (since the string "java-field-guide" starts with "java"). Same bug hit `typescript`/`typescript-field-guide`. Fixed with an `isSectionActive()` helper requiring an exact path-segment match. Verified programmatically against all 34 section IDs — zero collisions remain.

**Not yet committed/pushed** — will checkpoint this at the start of Round 3 below.

## Round 3 — 12-item batch from user (in progress)

User request, verbatim intent, numbered as given:
1. Java field guide missing a basics/variables cheat sheet
2. Support N-level nested sidebar groups (e.g. Frontend → React → TypeScript), not just Group→Section→Lesson
3. CSS Mastery lacking true from-scratch basics (other sections assume CSS knowledge)
4. Add a complete CSS cheat sheet (the css-field-guide already exists from Round 1 — treat this as "make sure it's genuinely complete," especially once #3 lands)
5. State management: remove Redux/Zustand, refocus on React's own state tools (Context, useReducer, etc.)
6. React field guide missing basics + **sort every field guide beginner→advanced** (React, TS, Java, Spring, SQL, CSS — all 6)
7. Double-check TypeScript cheat sheet — user suspects it's thin
8. Move Playground to its own root-level sidebar group (not nested in Frontend)
9. Remove Webpack and Vite sections entirely
10. Reorder Auth & Security section into one coherent login/session flow, not isolated topics
11. Remove Docker section (for now)
12. Add a CSS playground + Sass/SCSS playground, plus more playgrounds for whatever else seems valuable

### Execution plan (phases, in order)

- **Phase 0**: Commit + push the uncommitted Round 2 Playground work above, as a checkpoint before this next big batch.
- **Phase 1 (mechanical, done directly by me)**: #8 move Playground to root group; #9 remove webpack/vite; #11 remove docker; #5's mechanical half (delete Redux/Zustand lesson files).
- **Phase 2 (architecture, done directly by me — highest risk, most care)**: #2 — extend the `Group`/`Section` data model to support recursive nested child-groups, update `Sidebar.tsx` rendering to recurse, then reorganize the Frontend group into a nested tree (CSS/Sass, React, TypeScript, etc. as sub-groups) as the concrete example the user asked for.
- **Phase 3 (mechanical, done directly by me)**: Reorder Spring Boot 4 field guide and SQL field guide lessons beginner→advanced (part of #6) — lower content-generation need than React/TS/Java/CSS field guides, more just reordering/verifying, so handled directly rather than delegated.
- **Phase 4 (parallel background agents, content-heavy)**:
  - Lane A — Java field guide: add basics/variables cheat sheet (#1) + sort beginner→advanced (#6)
  - Lane B — CSS: Mastery ground-up basics (#3) + css-field-guide completeness audit (#4) + sort beginner→advanced (#6)
  - Lane C — React field guide: add missing basics + sort beginner→advanced (#6)
  - Lane D — TypeScript: audit/expand cheat sheet (#7) + sort typescript-field-guide beginner→advanced (#6)
  - Lane E — Auth & Security: reorder into one coherent login/session/token flow (#10)
  - Lane F — State management: expand remaining React-state content now that Redux/Zustand are gone, so the section doesn't feel thin (#5's content half)
  - Lane G — New playgrounds: CSS playground (live edit/preview) + Sass/SCSS playground (live compile) + 1-2 more of my judgment (#12)
- **Phase 5**: Consolidate all lane reports into `sections.ts`/`App.tsx`, run full verification (typecheck, build, orphan/consistency checks), commit, push.

### Status

Not yet started — this entry is the plan, about to begin Phase 0.
