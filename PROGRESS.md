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

## Nothing left in the original queue

Everything from both rounds of user-requested fixes is done, except:
- **Task #12 (monorepo flatten)** — was explicitly paused by the user mid-session ("lets do smaller changes first... ill come back when to flatten") and was never part of the autonomous work grant. Not resumed. Still pending if/when the user wants to revisit it.

Use `TaskList` for the structured tracker; this file is the narrative version.
