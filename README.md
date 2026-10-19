# Tutorials

A personal study site: React 19 + TypeScript, covering HTML, CSS/SCSS, the browser runtime, browser DevTools, core JavaScript, TypeScript, React 19 (plus state management, routing, React Query, MUI and testing), Java and Spring Boot, Go, C++, SQL/Postgres/T-SQL, data structures & algorithms, SOLID, design patterns, DDD, system design, microservices, cloud & observability, API design, auth & security, testing, frontend tooling & npm, and accessibility — **49 sections, 429 lessons**, 29 of them printable "field guide" cheat sheets. Cmd-K command palette, sticky table of contents, dark/light theme, live Sandpack editor.

The authoritative list of sections is `src/data/sections.ts` — treat the counts above as a snapshot and that file as the source of truth.

---

## Prerequisites

| Tool | Min version | Check |
| --- | --- | --- |
| Node | 20+ | `node --version` |
| npm | 10+ | `npm --version` |

## First-time setup

```bash
git clone <your-repo-url>
cd Tutorials
npm install
```

## Run it

```bash
npm run dev        # http://localhost:5173
```

## Useful commands

```bash
npm run verify           # typecheck + lint + every diagram renders — run this before committing
npm run typecheck        # tsc --noEmit
npm run lint             # eslint . — covers .ts/.tsx via typescript-eslint
npm run verify:diagrams  # renders every <FlowChart> in headless Chromium
npm run check:versions   # flags "the latest X is N" claims that npm/Maven now disagree with
npm run build            # tsc && vite build
npm run preview          # serve the production build locally
```

`verify:diagrams` exists because `FlowChart` catches mermaid errors and leaves
the box **empty** — a diagram with a syntax error fails silently, and neither
`tsc` nor `eslint` nor the build will tell you. It extracts every `chart={...}`
in `src/pages`, renders each with the repo's own mermaid build, and exits
non-zero on the first failure.

`check:versions` only flags *currency* claims ("the latest is 25", "currently
ships as"), never bare version numbers — a measured `"Real output on Node 24"`
is provenance and must not be bumped, or the output stops matching the claim.

---

## Suggested reading order — frontend

The sidebar is organised by topic, not by what to read first. If the goal is
getting better at frontend specifically, this is the order that builds on
itself. Counts are lessons.

**1. The platform (42)** — everything else sits on this.

1. `html/` (7) — semantics, forms, native interactive elements, how the parser repairs your markup
2. `accessibility/` (5) — mostly "use the right element"; also where `getByRole` starts making sense
3. `css-mastery/` (14) — `sizing` and `gotchas` first if you are debugging layout
4. `devtools/` (8) — read `devtools/css` *during* CSS Mastery, not after
5. `browser-runtime/` (8) — DOM, events, event loop, observers, storage, page lifecycle, fetch

**2. The language (27)**

6. `javascript/` (11) — skim fundamentals; do not skip closures, async, modules, events
7. `typescript/` (16)

**3. React (36)**

8. `react18/jsx` then `react18/events` — the two "what is actually happening" lessons
9. The core run: `lifecycle` → `hooks` → `refs` → `state` → `effects` → `context` → `performance` → `error-boundaries` → `patterns` → `portals`
10. `react19-whats-new/` (4)
11. `react-antipatterns/` (7) — lands better after the core run

The architecture lessons (`module-federation`, `feature-folder`,
`bulletproof-react`, `adapters`, `imperative-bridge`) are reference. Read them
when you hit the problem, not in sequence.

**4. The working stack (24)**

12. State, **in this order** — the three sections are wired as one chain:
    `state-mgmt/comparison` → `choosing` → `intro` → `patterns` →
    `zustand-fundamentals` → `zustand-advanced`
13. `react-query/` (3)
14. Router — **pick the version you use**: `react-router-v8/` (current),
    `react-router/` (v6/v7 data router), `react-router-v5/` (classic)
15. MUI — `mui9/` (v5+) or `mui/` (v4)
16. `ag-grid/` (1) — only if you use it

**5. Quality and build (17)**

17. `react-testing/` (10)
18. `frontend-tooling/` (7)

`npm-deep-dive/` and `npm-packages/` are reference unless you are publishing.

**Short path (~30 lessons)** if time is tight: CSS Mastery → `devtools/css` →
`browser-runtime/events` → `accessibility/aria` → `react18/jsx` →
`react18/events` → the state chain → React Query.

The `playground/` tools are companions, not a stop on the path — the CSS and
Sass playgrounds during CSS Mastery, the JSX compiler alongside `react18/jsx`.

---

## Printable PDFs

The site produces **one PDF per section** for offline reading.

```bash
# One-time setup — the headless browser the exporter drives.
npx playwright install chromium

# Build the site, then generate every section
npm run build:pdf

# Or specific sections, re-using the existing dist/ build
npm run pdf:section java
npm run pdf:section springboot react19 typescript
```

`pdf:section` does **not** rebuild — it serves whatever is already in `dist/`,
so run `npm run build` first if the site has changed since the last build.
Merging is done in-process by `pdf-lib`; no Ghostscript or other external
binary is required.

Output goes to `dist-pdf/*.pdf` — one file per section. The generator:

- Builds the site (`vite build`) and serves it via `vite preview`
- Uses Playwright + headless Chromium to visit every lesson URL
- Strips site chrome (sidebar, TOC, mobile menu) so only lesson content remains
- Applies the `@media print` stylesheet (light theme, wrapped code, keep blocks together)
- Renders each lesson as one continuous **tall PDF page** at Letter width, then concatenates a section's lessons via `pdf-lib`

**Printing the PDFs:** each lesson is one variable-height page. Open in Preview.app or Adobe Acrobat and print with **"Scale to fit paper"** — the printer splits each tall page into physical Letter sheets automatically, the same way browsers handle printing a long web page.

Print CSS lives in a single `@media print` block in **`src/styles/global.css`**
(there is no `src/index.css`), plus a companion block in `src/styles/poster.css`
for the field-guide pages. Nothing is script-only: the same rules fire from the
browser's built-in Print → Save as PDF, so `Cmd/Ctrl+P` on any lesson produces
the same clean output — chrome hidden, code wrapped instead of clipped, dark
theme flattened to ink-on-paper regardless of the theme you were reading in.

---

## Repository layout

```
.
├── src/
│   ├── components/    # Shared UI (Layout, Sidebar, CodeBlock, PosterLayout, ...)
│   ├── data/           # sections.ts — sidebar structure, groups, lesson routes
│   ├── pages/           # One folder per section, one file per lesson
│   └── styles/            # Global theme tokens + poster/field-guide print styles
├── scripts/
│   ├── build-pdf.mjs        # Per-section PDF export (Playwright + pdf-lib)
│   ├── verify-mermaid.mjs   # Renders every <FlowChart>; catches silent diagram errors
│   └── check-versions.mjs   # Checks "latest version is N" claims against npm / Maven
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

`src/data/sections.ts` and `src/App.tsx` are the two files that define the sidebar/routing structure and must stay in sync with `src/pages/`.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | React 19.2 + Vite 8 + TypeScript 6 |
| Routing | `react-router` v7 (v7 merged `react-router-dom` into it; routes are lazy-loaded via `React.lazy`) |
| Live editor | @codesandbox/sandpack-react |
| Diagrams | Mermaid |
| Syntax highlighting | react-syntax-highlighter (Prism) |
| PDF export | Playwright + pdf-lib |
