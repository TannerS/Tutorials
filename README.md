# Tutorials Monorepo

A learning playground with three apps:

| App | Path | Port | Description |
| --- | --- | --- | --- |
| **Tutorials site** | `apps/tutorials` | **5173** | React 19 + TS site with 25+ topics — Java, Spring Boot, React 19, SQL, SOLID, design patterns, microservices, TS, accessibility, etc. Cmd-K palette, sticky TOC, live Sandpack editor in one lesson. |
| **Broken React demo** | `apps/demo-react` | **5174** | Deliberately broken React 19 + TS app (~70 FIXMEs). Learn by fixing — context, re-renders, effects, forms, refs, React 19 features. |
| **Broken Spring demo** | `apps/demo-spring` | **8081** | Deliberately broken Spring Boot 4 + Java 21 app (~80 FIXMEs). Learn by fixing — layering, DI, transactions, N+1, validation, ProblemDetail, virtual threads, etc. |

Plus shared packages:

- `packages/ui` — `CodeBlock`, `InfoBox`, `TableOfContents`, `CommandPalette`, `LiveExample` (Sandpack).
- `packages/tsconfig` — shared base + React tsconfig.

---

## Prerequisites

| Tool | Min version | Check |
| --- | --- | --- |
| Node | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Java | 21+ | `java --version` |
| Maven | 3.9+ | `mvn -v` |

On macOS with Homebrew:

```bash
brew install node openjdk@21 maven
```

---

## First-time setup

```bash
git clone <your-repo-url>
cd Tutorials
npm install        # installs all workspace deps; Maven pulls its own on first run
```

---

## Run everything

```bash
npm run dev        # launches all three apps in parallel via Turborepo
```

Open:

- http://localhost:5173 → Tutorials site
- http://localhost:5174 → Broken React demo (also see `apps/demo-react/BROKEN.md`)
- http://localhost:8081 → Broken Spring API (also see `apps/demo-spring/BROKEN.md`)

Spring Boot takes ~10–20s to boot on a cold JVM. The Vite apps are live in <1s.

### Run just one app

```bash
npm run dev:tutorials
npm run dev:react
npm run dev:spring
```

---

## Useful commands

```bash
# Type-check every TS workspace (fast — Turbo caches)
npm run typecheck

# Build every workspace (Vite production builds + Maven package)
npm run build

# Lint
npm run lint

# Nuke node_modules + Turbo cache
npm run clean
```

---

## Printable PDFs

The tutorials site produces **one PDF per section** for offline reading — useful if you're going somewhere without internet access or where the browser isn't available.

```bash
# One-time setup — install Chromium and (optionally) Ghostscript for merging.
cd apps/tutorials && npx playwright install chromium
brew install ghostscript          # macOS; on Linux use apt/yum

# Generate every section
npm run build:pdf

# Or specific sections
cd apps/tutorials && node scripts/build-pdf.mjs java
cd apps/tutorials && node scripts/build-pdf.mjs springboot react19 typescript
```

Output goes to `apps/tutorials/dist-pdf/*.pdf` — one file per section (`java.pdf`, `springboot.pdf`, `react19.pdf`, `typescript.pdf`, …). The generator:

- Builds the site (`vite build`) and serves it via `vite preview`
- Uses Playwright + headless Chromium to visit every lesson URL
- Strips site chrome (sidebar, TOC, mobile menu) so only lesson content remains
- Applies the `@media print` stylesheet (light theme, wrap code, keep blocks together)
- Renders each lesson as one continuous **tall PDF page** at Letter width, then concatenates all a section's lessons via `pdf-lib`

**Printing the PDFs:** each lesson is one variable-height page (612 pt wide × 3000–10000 pt tall). Open in Preview.app or Adobe Acrobat and print with **"Scale to fit paper"** — the printer splits each tall page into physical Letter sheets automatically. This is the same pattern web browsers use when you print a long web page: one virtual page, many physical pages.

Print CSS lives at the end of `apps/tutorials/src/index.css`. The `html.print-mode` class is added by the PDF script but the plain `@media print` block also fires from the browser's built-in Print → Save as PDF flow if you want to print a single lesson directly.

---

## Spring Boot demo cheats

```bash
# Curl the seed data
curl -s http://localhost:8081/product | jq

# H2 console (auth disabled — that's one of the FIXMEs)
open http://localhost:8081/h2-console
#   JDBC URL: jdbc:h2:mem:brokenshop
#   User:     sa
#   Password: (blank)
```

---

## Learning paths

Each "broken" demo has three companion docs:

| File | Purpose |
| --- | --- |
| `BROKEN.md` | Tagged bug-hunt catalog. Start here. |
| `ROADMAP.md` | Phased fix-it plan (Parts 1–8/10) with exit criteria per phase. |
| `SOLUTIONS.md` | Master cheat sheet with multiple fix options per FIXME — read after attempting. |

To grep every FIXME in a demo:

```bash
grep -rn "FIXME:" apps/demo-react/src
grep -rn "FIXME:" apps/demo-spring/src
```

---

## Repository layout

```
.
├── apps/
│   ├── tutorials/          # React 19 + TS tutorials site
│   ├── demo-react/         # Broken React 19 + TS app
│   └── demo-spring/        # Broken Spring Boot 4 + Java 21 app
├── packages/
│   ├── ui/                 # Shared React components
│   └── tsconfig/           # Shared TS configs
├── package.json            # Root: npm workspaces + turbo scripts
├── turbo.json              # Pipeline (dev/build/lint/typecheck)
└── README.md
```

---

## Stack

| Layer | Choice |
| --- | --- |
| Monorepo | npm workspaces + Turborepo 2 |
| Web | React 19.2 + Vite 8 + TS 6 |
| API | Spring Boot 4.0 + Java 21 + JPA + H2 |
| Maven | 3.9+ |
| Live editor | @codesandbox/sandpack-react |
| Charts | Mermaid |
| Syntax highlight | react-syntax-highlighter (Prism) |

Latest stable versions across the board (Jan 2026).
