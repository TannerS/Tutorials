# Tutorials

A personal study site: React 19 + TypeScript, covering Java, Spring Boot 4, React 19, TypeScript, SQL/Postgres, SOLID, design patterns, microservices, API design, auth & security, testing, frontend tooling & npm, CSS, accessibility, and more — 31 sections, five with dedicated printable "field guide" cheat sheets. Cmd-K command palette, sticky table of contents, dark/light theme, live Sandpack editor.

The authoritative list of sections is `src/data/sections.ts`.

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
npm run typecheck   # tsc --noEmit
npm run build       # tsc && vite build
npm run lint        # eslint . — covers .ts/.tsx via typescript-eslint
npm run preview     # serve the production build locally
```

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
│   └── build-pdf.mjs        # Per-section PDF export (Playwright + pdf-lib)
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
| Routing | react-router-dom v7 |
| Live editor | @codesandbox/sandpack-react |
| Diagrams | Mermaid |
| Syntax highlighting | react-syntax-highlighter (Prism) |
| PDF export | Playwright + pdf-lib |
