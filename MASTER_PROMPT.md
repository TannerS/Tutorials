# Dev Tutorials — Master Reproduction Prompt

> **What this is:** A complete, AI-executable blueprint to recreate a 177-page interactive tutorial server from scratch. Every infrastructure file is included VERBATIM. Content specifications tell you exactly what to write for each of the 177 tutorial pages.
>
> **How to use:** Give this entire file to a new AI coding assistant and say: "Follow this prompt exactly. Build in phases, verify after each."

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Phase 1: Scaffold and Install](#2-phase-1-scaffold-and-install)
3. [Phase 1B: Verbatim Infrastructure Files](#3-phase-1b-verbatim-infrastructure-files)
4. [Phase 1C: Verbatim Component Files (9 files)](#4-phase-1c-verbatim-component-files)
5. [Phase 1D: Verbatim Data and Routing](#5-phase-1d-verbatim-data-and-routing)
6. [Page Template and Rules](#6-page-template-and-rules)
7. [Content Specifications (177 pages)](#7-content-specifications-177-pages)
8. [Build and Verify](#8-build-and-verify)

---

## 1. PROJECT OVERVIEW

| Property | Value |
|----------|-------|
| Framework | React 19 + Vite 8 |
| Routing | react-router-dom 7 |
| Syntax Highlighting | react-syntax-highlighter 16 (Prism + oneDark) |
| Diagrams | mermaid 11 |
| Theme | Dark (#0f1117 background, blue/purple gradients) |
| Fonts | Inter (UI), JetBrains Mono (code) via Google Fonts |
| Layout | Fixed left sidebar (280px) + scrollable content area |
| Features | Copy-to-clipboard code blocks, Mermaid flowcharts, interactive quiz challenges, progress tracking (localStorage), keyboard nav (left/right arrows), search, mobile responsive, 404 page |
| Pages | 177 across 26 sections |
| Min lines per page | 170 |

---

## 2. PHASE 1: SCAFFOLD AND INSTALL

Run these commands exactly:

```bash
npm create vite@latest dev-tutorials -- --template react
cd dev-tutorials
npm install react-router-dom react-syntax-highlighter mermaid
npm install
```

Then create the directory structure:

```bash
mkdir -p src/components src/data src/styles
mkdir -p src/pages/{java,springboot,react19,sql,solid,patterns}
mkdir -p src/pages/{react-antipatterns,microservices,apidesign,auth}
mkdir -p src/pages/{java-cheatsheet,react-cheatsheet,testing,devops,systemdesign}
mkdir -p src/pages/{typescript,react-router,state-mgmt,accessibility,css-mastery}
mkdir -p src/pages/{react-testing,frontend-tooling,interview-prep}
mkdir -p src/pages/{npm-deep-dive,npm-packages,webpack}
```

Delete any generated `src/App.css` and `src/index.css` files — we use a single `src/styles/global.css` instead.

---

## 3. PHASE 1B: VERBATIM INFRASTRUCTURE FILES

### FILE: index.html
Replace the generated index.html with:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dev Tutorials</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### FILE: vite.config.js
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### FILE: src/main.jsx
Replace the generated main.jsx:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

### FILE: src/styles/global.css

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --sidebar-width: 280px;
  --header-height: 56px;
  --bg-primary: #0f1117;
  --bg-secondary: #161822;
  --bg-sidebar: #12141e;
  --bg-card: #1a1d2e;
  --bg-code: #1e2235;
  --bg-hover: #1f2337;
  --bg-active: #252a3f;
  --text-primary: #e4e6f0;
  --text-secondary: #9399b2;
  --text-muted: #6c7293;
  --border-color: #2a2e42;
  --accent-blue: #5b9cf6;
  --accent-green: #4ade80;
  --accent-purple: #a78bfa;
  --accent-orange: #fb923c;
  --accent-red: #f87171;
  --accent-cyan: #22d3ee;
  --accent-yellow: #facc15;
  --accent-pink: #f472b6;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  --radius: 8px;
  --radius-sm: 4px;
  --radius-lg: 12px;
  --transition: 0.2s ease;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { height: 100%; width: 100%; overflow: hidden; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--accent-blue); text-decoration: none; transition: color var(--transition); }
a:hover { color: #7db4f8; }
h1, h2, h3, h4, h5, h6 { font-weight: 600; line-height: 1.3; margin-bottom: 0.5em; }
h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; margin-top: 2rem; }
h3 { font-size: 1.25rem; margin-top: 1.5rem; }
p { margin-bottom: 1em; color: var(--text-secondary); }

code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-code);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.875em;
  color: var(--accent-cyan);
}

pre { margin: 1em 0; border-radius: var(--radius); overflow: auto; }
ul, ol { margin: 0.5em 0 1em 1.5em; color: var(--text-secondary); }
li { margin-bottom: 0.3em; }
::selection { background: var(--accent-blue); color: white; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
.sidebar-container { display: flex; }

@media (max-width: 768px) {
  .mobile-menu-btn { display: block !important; }
  .mobile-backdrop { display: block !important; }
  .sidebar-container {
    position: fixed; top: 0; left: 0; z-index: 1002;
    transform: translateX(-100%); transition: transform 0.3s ease;
  }
  .sidebar-container.sidebar-open { transform: translateX(0); }
  main { padding: 2rem 1rem !important; }
}
```

---

## 4. PHASE 1C: VERBATIM COMPONENT FILES

Create these 9 files in src/components/ with EXACT content shown below.

### FILE: src/components/CodeBlock.jsx

Syntax-highlighted code block with copy button. Uses react-syntax-highlighter with oneDark theme customized to match the dark UI.

Props:
- children (string) - the code to display
- language (string, default "java") - syntax highlighting language
- title (string, optional) - header bar above code showing filename
- showLineNumbers (boolean, default true)

Features:
- Copy-to-clipboard button (top right) shows "Copied" for 2 seconds
- If title provided, renders a header bar with title + language badge
- Custom oneDark style: background #1a1d2e, border #2a2e42, JetBrains Mono font
- Title bar: background #252a3f, language badge blue #5b9cf6

Implementation:
```jsx
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const customStyle = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: '#1a1d2e',
    borderRadius: '8px',
    padding: '1.25rem',
    margin: '1rem 0',
    fontSize: '0.875rem',
    border: '1px solid #2a2e42',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: "'JetBrains Mono', monospace",
  },
};

export default function CodeBlock({ children, language = 'java', title, showLineNumbers = true }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative', margin: '1rem 0' }}>
      {title && (
        <div style={{
          background: '#252a3f', padding: '0.5rem 1rem',
          borderRadius: '8px 8px 0 0', border: '1px solid #2a2e42',
          borderBottom: 'none', fontSize: '0.8rem', color: '#9399b2',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span>{title}</span>
          <span style={{
            background: '#1a1d2e', padding: '2px 8px', borderRadius: '4px',
            fontSize: '0.7rem', textTransform: 'uppercase', color: '#5b9cf6',
          }}>{language}</span>
        </div>
      )}
      <button onClick={handleCopy} style={{
        position: 'absolute', top: title ? '3rem' : '0.5rem', right: '0.75rem',
        background: copied ? '#4ade80' : '#252a3f',
        color: copied ? '#0f1117' : '#9399b2',
        border: '1px solid #2a2e42', borderRadius: '4px', padding: '4px 10px',
        cursor: 'pointer', fontSize: '0.7rem',
        fontFamily: "'JetBrains Mono', monospace", zIndex: 10,
        transition: 'all 0.2s ease',
      }}>{copied ? 'Copied' : 'Copy'}</button>
      <SyntaxHighlighter language={language} style={customStyle}
        showLineNumbers={showLineNumbers} wrapLines
        customStyle={title ? { borderRadius: '0 0 8px 8px', marginTop: 0 } : {}}>
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
```

### FILE: src/components/FlowChart.jsx

Renders Mermaid diagrams. Mermaid initialized once with dark theme matching the UI.

Props:
- chart (string) - Mermaid diagram syntax using \n for line breaks (NOT template literals)
- title (string, optional)

CRITICAL: Mermaid node labels must use square brackets [], NOT parentheses (). Parentheses cause parse errors.

Implementation:
```jsx
import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let chartId = 0;

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#252a3f', primaryTextColor: '#e4e6f0',
    primaryBorderColor: '#5b9cf6', lineColor: '#5b9cf6',
    secondaryColor: '#1a1d2e', tertiaryColor: '#161822',
    background: '#0f1117', mainBkg: '#252a3f', nodeBorder: '#5b9cf6',
    clusterBkg: '#1a1d2e', clusterBorder: '#2a2e42', titleColor: '#e4e6f0',
    edgeLabelBackground: '#1a1d2e', nodeTextColor: '#e4e6f0',
  },
  flowchart: { htmlLabels: true, curve: 'basis', padding: 15 },
  fontFamily: "'Inter', sans-serif",
});

export default function FlowChart({ chart, title }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const idRef = useRef(`mermaid-${chartId++}`);
  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, chart.trim());
        if (!cancelled) setSvg(rendered);
      } catch (e) { console.error('Mermaid render error:', e); }
    };
    render();
    return () => { cancelled = true; };
  }, [chart]);
  return (
    <div style={{
      margin: '1.5rem 0', background: '#161822', borderRadius: '8px',
      border: '1px solid #2a2e42', overflow: 'hidden',
    }}>
      {title && (
        <div style={{
          padding: '0.75rem 1rem', borderBottom: '1px solid #2a2e42',
          fontSize: '0.85rem', fontWeight: 500, color: '#9399b2',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '1rem' }}>📊</span> {title}
        </div>
      )}
      <div ref={containerRef}
        style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', overflow: 'auto' }}
        dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
```

### FILE: src/components/InfoBox.jsx

Colored callout box with 7 variants.

Props:
- variant (string): "info" | "tip" | "warning" | "danger" | "note" | "success" | "question"
- title (string, optional)
- children

Implementation:
```jsx
const variants = {
  info: { bg: '#1a2744', border: '#2563eb', icon: 'i', label: 'Info' },
  tip: { bg: '#1a3329', border: '#16a34a', icon: 'bulb', label: 'Tip' },
  warning: { bg: '#3d2f14', border: '#d97706', icon: 'warn', label: 'Warning' },
  danger: { bg: '#3b1a1a', border: '#dc2626', icon: 'no', label: 'Danger' },
  note: { bg: '#2a1f44', border: '#7c3aed', icon: 'memo', label: 'Note' },
  success: { bg: '#1a3329', border: '#4ade80', icon: 'check', label: 'Success' },
  question: { bg: '#1a2744', border: '#22d3ee', icon: 'think', label: 'Think About It' },
};
```
Each variant gets: left border 4px solid in variant color, tinted background, emoji icon prefix. Renders title line + children content at 0.9rem, color #c4c8db.

NOTE: Use the actual emoji characters in the real code. The icons are: info=ℹ️, tip=💡, warning=⚠️, danger=🚫, note=📝, success=✅, question=🤔

### FILE: src/components/InteractiveChallenge.jsx

Multiple-choice quiz component with immediate feedback.

Props:
- question (string) - the question text
- options (string array) - 2-4 answer options
- correctIndex (number) - 0-based index of correct answer
- explanation (string) - explanation shown after answering
- code (string, optional) - code snippet to show with the question
- language (string, default "java")

Features:
- Purple header with puzzle emoji and "Challenge" label
- Options labeled A, B, C, D in blue
- Click to select: correct turns green, wrong turns red, all options disabled
- Explanation box: green bg for correct, red bg for incorrect
- If code prop provided, renders a CodeBlock between question and options

CRITICAL: If question or explanation text contains double quotes, the calling page MUST use JSX expression syntax: question={"What is a \"closure\"?"} — NOT question="What is a \"closure\"?"

### FILE: src/components/LessonLayout.jsx

Page wrapper providing consistent title, navigation, and progress tracking.

Props:
- title (string) - page title (rendered as gradient h1)
- sectionId (string) - matches section id in sections.js
- lessonIndex (number) - 0-based position in the section lessons array
- children - the page content
- prev (object or null) - { path: string, label: string } for previous lesson link
- next (object or null) - { path: string, label: string } for next lesson link

Features:
- Title with blue-to-purple gradient text
- 3px gradient underline bar (60px wide)
- Bottom: ProgressTracker component + prev/next navigation links
- Keyboard navigation: ArrowLeft = prev page, ArrowRight = next page (ignores when focused on input/textarea/select)

### FILE: src/components/ProgressTracker.jsx

Exports BOTH a named export (useProgress hook) AND a default export (ProgressTracker component).

useProgress hook:
- Stores progress in localStorage key "tutorial-progress"
- Format: {"sectionId/lessonIndex": true, ...}
- Methods: markComplete(sectionId, lessonId), isComplete(sectionId, lessonId), getSectionProgress(sectionId, totalLessons)

ProgressTracker component:
- Props: sectionId, lessonIndex, onComplete (optional callback)
- Shows either "Mark complete" button (blue #5b9cf6) or "Lesson completed!" green state
- Clicking button saves progress to localStorage

### FILE: src/components/Sidebar.jsx

Left navigation panel (280px, full viewport height).

Structure (top to bottom):
1. Logo: link to "/" with book emoji, "Dev Tutorials" gradient text, "Learn Practice Master" tagline
2. Search input: filters lessons across all 26 sections by title
3. Scrollable section list: each section is collapsible
   - Section header: icon + label + progress badge (e.g. "3/10") + rotate arrow
   - Expanded: numbered lessons (01, 02...) with active state (right border in section color)
4. Footer: "Built with React + Vite" with lightning emoji

Behavior:
- Auto-expands section matching current route on navigation
- Search mode: shows flat list of matching lessons with section icons
- Uses sections array from src/data/sections.js
- Uses useProgress hook from ProgressTracker for completion counts

### FILE: src/components/Layout.jsx

Main app shell. Used as the Route element wrapper.

Structure:
- Flex container: sidebar (left) + main content (right, scrollable)
- When at "/" path: renders inline HomePage component (grid of 26 section cards)
- Otherwise: renders Outlet for nested routes
- Mobile (<768px): hamburger button + backdrop overlay toggles sidebar

HomePage inline component:
- "Developer Tutorials" h1 with 3-color gradient
- Grid of cards (auto-fill, minmax 250px): each shows section icon, label, lesson count
- Cards have colored hover border effect + translateY(-2px) + shadow

### FILE: src/components/LifecycleSimulator.jsx

Self-contained interactive React lifecycle demonstration component (~300-460 lines).

This is the most complex component. It uses REAL React hooks (useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, useContext, memo) that fire and get logged in real-time.

Architecture:
- LogContext (React Context) passes a pushLog function down the tree
- ParentDemo component: tracks count, has useEffect (mount + count change) and useLayoutEffect
- ChildDemo component: receives value prop, has local state input, useMemo, useEffect (mount + prop change), useLayoutEffect
- LogPanel (memoized): scrolling list of color-coded log entries with timestamps
- LifecycleSimulator (default export): orchestrates everything

Color palette for log entries:
- Render phase: #22d3ee (cyan)
- Mount: #4ade80 (green)
- Update: #5b9cf6 (blue)
- Layout effect: #a78bfa (purple)
- Memo: #fbbf24 (yellow)
- Cleanup: #f87171 (red)

7 control buttons:
1. Mount Child (green) - mounts ChildDemo A
2. Unmount Child (red) - unmounts ChildDemo A
3. Update Parent (yellow) - increments parent count
4. Update Child Props (blue) - increments childProp value
5. Force Re-render (lightning) - triggers a re-render
6. Toggle 2nd Child - mounts/unmounts ChildDemo B
7. Clear Log - empties the log

Layout: side-by-side split - "Live Component Tree" (left) + "Event Log" (right)
Max 200 log entries, auto-scrolls to bottom. Also echoes to console.log for DevTools.
All inline styles matching the dark theme.

---

## 5. PHASE 1D: VERBATIM DATA AND ROUTING

### FILE: src/data/sections.js

This is the SINGLE SOURCE OF TRUTH for all 26 sections. It drives the sidebar, homepage cards, and prev/next navigation. Create it with EXACTLY this content (the full file with all 26 section objects and all 177 lesson entries):

The sections array contains 26 objects in this exact order. Each has: id, label, icon (emoji), color (hex), and lessons array. Each lesson has: id, title, path.

SECTIONS LIST (create the full JS array):

1. java (orange #fb923c, coffee emoji) - 10 lessons: intro, syntax, oop, collections, generics, exceptions, streams, concurrency, io, advanced
2. springboot (green #4ade80, leaf emoji) - 10 lessons: intro, setup, di, rest, data, security, testing, config, error, advanced
3. react19 (cyan #22d3ee, atom emoji) - 13 lessons: lifecycle, lifecycle-sim, hooks, state, effects, context, performance, react19, server, patterns, typescript, build-toolchain, cheat-sheet
4. sql (blue #5b9cf6, file cabinet emoji) - 8 lessons: quickstart, joins, window, indexing, design, transactions, cte, advanced
5. solid (purple #a78bfa, building emoji) - 6 lessons: intro, srp, ocp, lsp, isp, dip
6. patterns (pink #f472b6, puzzle emoji) - 8 lessons: intro, singleton, strategy, decorator, builder, composite, proxy, realworld
7. react-antipatterns (red #f87171, warning emoji) - 6 lessons: intro, state, effects, performance, components, bestpractices
8. microservices (sky blue #38bdf8, globe emoji) - 8 lessons: intro, patterns, communication, data, scaling, events, containers, migration
9. apidesign (emerald #34d399, satellite emoji) - 6 lessons: intro, methods, resources, errors, versioning, advanced
10. auth (amber #fbbf24, lock emoji) - 7 lessons: encryption, tls, cookies, jwt, oauth, authz, security
11. java-cheatsheet (orange #fb923c, clipboard emoji) - 5 lessons: syntax, collections, streams, concurrency, annotations
12. react-cheatsheet (cyan #22d3ee, memo emoji) - 5 lessons: hooks, patterns, state, styling, recipes
13. testing (green #4ade80, test tube emoji) - 6 lessons: intro, unit, mocking, integration, e2e, bestpractices
14. devops (pink #f472b6, wrench emoji) - 6 lessons: git, branching, cicd, docker, cloud, monitoring
15. systemdesign (purple #a78bfa, classical building emoji) - 7 lessons: intro, scaling, caching, databases, distributed, messaging, interview
16. typescript (TS blue #3178c6, blue diamond emoji) - 10 lessons: intro, types, interfaces, generics, advanced, react, migration, bestpractices, newproject, tsconfig
17. react-router (red #f44250, compass emoji) - 8 lessons: intro, nested, data, guards, advanced, testing, fullapp, migration
18. state-mgmt (purple #764abc, package emoji) - 5 lessons: intro, redux, zustand, comparison, patterns
19. accessibility (sky blue #0ea5e9, wheelchair emoji) - 5 lessons: intro, semantic, aria, keyboard, testing
20. css-mastery (fuchsia #e879f9, palette emoji) - 6 lessons: flexbox, grid, responsive, animations, variables, patterns
21. react-testing (red #e5484d, test tube emoji) - 6 lessons: intro, components, hooks, async, forms, patterns
22. frontend-tooling (amber #f59e0b, tools emoji) - 5 lessons: vite, linting, packages, monorepos, performance
23. interview-prep (emerald #10b981, briefcase emoji) - 4 lessons: react, typescript, frontend, coding
24. npm-deep-dive (npm red #cb3837, package emoji) - 6 lessons: intro, resolution, node-modules, lockfile, scripts, security
25. npm-packages (orange #f97316, building emoji) - 5 lessons: anatomy, package-json, modules, publishing, advanced
26. webpack (light blue #8dd6f9, triangular ruler emoji) - 6 lessons: intro, core, loaders, plugins, devserver, advanced

Lesson paths follow the pattern: /{sectionId}/{lessonId}
Lesson titles must match exactly what appears in the sidebar.

### FILE: src/App.jsx

This file imports all 177 page components and defines all routes. Structure:

```
import { Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'

// 177 imports grouped by section...
// Then NotFound component inline...
// Then App component with all routes...
export default App
```

IMPORT NAMING CONVENTIONS (must follow exactly):
- java/ files: JavaIntro, JavaSyntax, JavaOop, JavaCollections, JavaGenerics, JavaExceptions, JavaStreams, JavaConcurrency, JavaIo, JavaAdvanced
- springboot/: SpringIntro, SpringSetup, SpringDi, SpringRest, SpringData, SpringSecurity, SpringTesting, SpringConfig, SpringError, SpringAdvanced
- react19/: ReactLifecycle, ReactLifecycleSim, ReactHooks, ReactState, ReactEffects, ReactContext, ReactPerformance, ReactNew (from React19.jsx), ReactServer, ReactPatterns, ReactTypescript, ReactBuildToolchain, ReactCheatSheet
- sql/: SqlQuickstart, SqlJoins, SqlWindow, SqlIndexing, SqlDesign, SqlTransactions, SqlCte, SqlAdvanced
- solid/: SolidIntro, SolidSrp, SolidOcp, SolidLsp, SolidIsp, SolidDip
- patterns/: PatternsIntro, PatternsSingleton, PatternsStrategy, PatternsDecorator, PatternsBuilder, PatternsComposite, PatternsProxy, PatternsRealworld
- react-antipatterns/: AntiIntro, AntiState, AntiEffects, AntiPerformance, AntiComponents, AntiBestPractices
- microservices/: MicroIntro, MicroPatterns, MicroCommunication, MicroData, MicroScaling, MicroEvents, MicroContainers, MicroMigration
- apidesign/: ApiIntro, ApiMethods, ApiResources, ApiErrors, ApiVersioning, ApiAdvanced
- auth/: AuthEncryption, AuthTls, AuthCookies, AuthJwt, AuthOauth, AuthAuthz, AuthSecurity
- java-cheatsheet/: JCSyntax, JCCollections, JCStreams, JCConcurrency, JCAnnotations
- react-cheatsheet/: RCHooks, RCPatterns, RCState, RCStyling, RCRecipes
- testing/: TestIntro, TestUnit, TestMocking, TestIntegration, TestE2e, TestBestPractices
- devops/: DevGit, DevBranching, DevCicd, DevDocker, DevCloud, DevMonitoring
- systemdesign/: SysIntro, SysScaling, SysCaching, SysDatabases, SysDistributed, SysMessaging, SysInterview
- typescript/: TsIntro, TsTypes, TsInterfaces, TsGenerics, TsAdvanced, TsReact, TsMigration, TsBestPractices, TsNewProject, TsTsconfig
- react-router/: RRIntro, RRNested, RRData, RRGuards, RRAdvanced, RRTesting, RRFullapp, RRMigration
- state-mgmt/: SMIntro, SMRedux, SMZustand, SMComparison, SMPatterns
- accessibility/: A11yIntro, A11ySemantic, A11yAria, A11yKeyboard, A11yTesting
- css-mastery/: CSSFlexbox, CSSGrid, CSSResponsive, CSSAnimations, CSSVariables, CSSPatterns
- react-testing/: RTIntro, RTComponents, RTHooks, RTAsync, RTForms, RTPatterns
- frontend-tooling/: FTVite, FTLinting, FTPackages, FTMonorepos, FTPerformance
- interview-prep/: IPReact, IPTypescript, IPFrontend, IPCoding
- npm-deep-dive/: NpmIntro, NpmResolution, NpmNodeModules, NpmLockfile, NpmScripts, NpmSecurity
- npm-packages/: NpkgAnatomy, NpkgPackageJson, NpkgModules, NpkgPublishing, NpkgAdvanced
- webpack/: WpIntro, WpCore, WpLoaders, WpPlugins, WpDevserver, WpAdvanced

FILE NAMING: Each page file is PascalCase in src/pages/{sectionId}/ (e.g., src/pages/java/Intro.jsx, src/pages/npm-deep-dive/NodeModules.jsx)

NotFound component (defined inline in App.jsx):
- Centered div, full viewport height
- Magnifying glass emoji (large), "404 - Page Not Found" heading
- Link back to "/" with blue border button

Route structure:
```jsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={null} />
    <Route path="java/intro" element={<JavaIntro />} />
    ... all 177 routes matching paths from sections.js ...
    <Route path="*" element={<NotFound />} />
  </Route>
</Routes>
```

---

## 6. PAGE TEMPLATE AND RULES

### Standard Page Template

Every tutorial page (all 177 of them) follows this exact structure:

```jsx
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function PageName() {
  return (
    <LessonLayout
      title="Page Title From sections.js"
      sectionId="section-id"
      lessonIndex={0}
      prev={null}
      next={{ path: '/section/next-id', label: 'Next Title' }}
    >
      <h2>First Topic</h2>
      <p>Explanatory text with detail...</p>

      <FlowChart
        title="Diagram Title"
        chart={"graph TD\n  A[Step 1] --> B[Step 2]\n  B --> C[Step 3]"}
      />

      <CodeBlock language="java" title="Example.java">
{`public class Example {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Pro Tip">
        <p>Helpful information here.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does this code output?"
        options={["Option A", "Option B", "Option C", "Option D"]}
        correctIndex={1}
        explanation="Explanation of why B is correct."
      />
    </LessonLayout>
  );
}
```

### CRITICAL BUILD RULES (read before writing ANY page)

1. FlowChart chart prop: MUST be a JSX expression: chart={"graph TD\n  A[Label] --> B[Label]"}. Use \n for newlines. Do NOT use template literals with backticks. Do NOT use parentheses () in Mermaid node labels — only square brackets [].

2. Quotes in JSX string props: If any prop value contains double quotes, use JSX expression syntax: question={"What is a \"closure\"?"} — NOT question="What is a \"closure\"?". The backslash-in-attribute form breaks the Vite build.

3. HTML entities in JSX text: Use &quot; or &apos; in JSX text, or use {'text with "quotes"'} expressions.

4. Exports: Every page must use export default function PageName(). The function name must match the import name in App.jsx.

5. Minimum content per page: At least 170 lines, at least 1 InteractiveChallenge quiz, at least 2 CodeBlock examples, at least 1 FlowChart or InfoBox.

6. lessonIndex is 0-based within its section. First lesson = 0, second = 1, etc.

7. prev/next must link to adjacent lessons in the same section (from sections.js). First lesson has prev={null}, last has next={null}.

### SPECIAL PAGE: react19/LifecycleSim.jsx

This page is unique. In addition to the standard imports, it also imports:
```jsx
import LifecycleSimulator from '../../components/LifecycleSimulator';
```
And renders the interactive simulator within its LessonLayout, surrounded by explanation text, FlowChart diagrams showing mount/update/unmount order, and InteractiveChallenge quizzes about lifecycle concepts.

---

## 7. CONTENT SPECIFICATIONS (177 pages)

For each page below, create a rich JSX file following the template above. Include thorough explanations, multiple CodeBlock examples with the correct language, FlowChart diagrams, InfoBox callouts, and InteractiveChallenge quizzes.

### Audience Context
- Java and Spring Boot: User is NEW to these — full rundowns from basics needed
- React 19: Senior dev refresher — cover lifecycle, hooks, React 19 features in depth
- SQL: Rush through basics, focus on design and advanced topics
- Everything else: Comprehensive coverage with real code examples

### SECTION 1: Java (src/pages/java/) — 10 pages, language="java"

1. Intro.jsx (lessonIndex=0) — What is Java, WORA philosophy, JVM/JDK/JRE explained, Java versions timeline, Hello World program, compilation flow diagram (Source -> javac -> Bytecode -> JVM -> Machine Code)
2. Syntax.jsx (lessonIndex=1) — 8 primitive types with sizes, variables and constants (final), operators, control flow (if/else/switch/for/while/do-while/enhanced-for), type casting, String vs StringBuilder, naming conventions
3. Oop.jsx (lessonIndex=2) — Classes and objects, constructors, encapsulation, inheritance (extends/super), polymorphism (overloading vs overriding), abstraction (abstract vs interface), access modifiers table, static members, 4 OOP pillars diagram
4. Collections.jsx (lessonIndex=3) — Hierarchy diagram, List (ArrayList/LinkedList), Set (HashSet/TreeSet), Map (HashMap/TreeMap), Queue/Deque, Iterator, Collections utility, when-to-use decision tree
5. Generics.jsx (lessonIndex=4) — Why generics, generic classes/methods, bounded types, wildcards (?/extends/super), PECS principle, type erasure, diamond operator
6. Exceptions.jsx (lessonIndex=5) — Exception hierarchy diagram, try-catch-finally, multi-catch, try-with-resources, custom exceptions, checked vs unchecked, throw vs throws
7. Streams.jsx (lessonIndex=6) — Lambdas, functional interfaces (Predicate/Function/Consumer/Supplier), method references, Stream API, filter/map/reduce, collect/groupingBy, Optional, parallel streams
8. Concurrency.jsx (lessonIndex=7) — Thread creation, lifecycle diagram, synchronized, volatile, ReentrantLock, ExecutorService, Callable/Future, CompletableFuture, thread pools, deadlock
9. Io.jsx (lessonIndex=8) — File class, byte/character streams, BufferedReader/Writer, NIO.2 (Path/Files), serialization, directory operations
10. Advanced.jsx (lessonIndex=9) — Records, sealed classes, pattern matching, text blocks, switch expressions, var, modules, annotations, reflection

### SECTION 2: Spring Boot (src/pages/springboot/) — 10 pages, language="java"

1. Intro.jsx (0) — Spring vs Spring Boot, auto-configuration, starters, embedded servers, Initializr, ecosystem diagram
2. Setup.jsx (1) — Directory structure, pom.xml, application.properties, @SpringBootApplication, DevTools, package conventions
3. Di.jsx (2) — IoC, @Component/@Service/@Repository/@Controller, @Autowired (constructor preferred), @Bean/@Configuration, scopes, @Qualifier
4. Rest.jsx (3) — @RestController, request mappings, @PathVariable/@RequestParam/@RequestBody, ResponseEntity, DTOs, flow diagram
5. Data.jsx (4) — JPA, @Entity/@Table, JpaRepository, CRUD, @Query, derived queries, pagination, relationships
6. Security.jsx (5) — SecurityFilterChain, UserDetailsService, BCrypt, @PreAuthorize, CORS, JWT flow
7. Testing.jsx (6) — @SpringBootTest, @WebMvcTest, @DataJpaTest, MockMvc, @MockBean, test slices
8. Config.jsx (7) — yml vs properties, @Value, @ConfigurationProperties, profiles, externalized config
9. Error.jsx (8) — @ExceptionHandler, @ControllerAdvice, custom exceptions, @Valid, global error handling
10. Advanced.jsx (9) — AOP, caching, scheduling, async, actuator, custom starters, events

### SECTION 3: React 19 (src/pages/react19/) — 13 pages, language="jsx"

1. Lifecycle.jsx (0) — Class lifecycle diagram, hook equivalents, render vs commit phase, strict mode
2. LifecycleSim.jsx (1) — SPECIAL: imports LifecycleSimulator component, explanation text, lifecycle FlowCharts
3. Hooks.jsx (2) — All 15+ hooks with signature, use case, example each
4. State.jsx (3) — useState deep dive, functional updates, useReducer, batching (incl. async/await deep dive + "what counts as a synchronous block"), immutability
5. Effects.jsx (4) — useEffect anatomy, dependency rules, cleanup, race conditions
6. Context.jsx (5) — createContext/useContext, Provider, context splitting, React 19 use()
7. Performance.jsx (6) — React.memo, useMemo, useCallback (with detailed when-to-use breakdown), when NOT to memoize, React Compiler, usePrevious caller examples (PriceDisplay, UserProfile)
8. React19.jsx (7) — use() hook, React Compiler, Actions, useFormStatus/State, useOptimistic
9. Server.jsx (8) — Server vs Client Components, directives, Server Actions, streaming SSR
10. Patterns.jsx (9) — Compound components, render props, HOCs, custom hooks
11. Typescript.jsx (10) — Typing components, props, hooks, events, generic components
12. BuildToolchain.jsx (11) — Vite vs CRA, esbuild vs swc vs babel, HMR mechanics, dev/prod build pipeline, code splitting, bundle analysis
13. CheatSheet.jsx (12) — Condensed reference covering all React 19 hooks, patterns, common recipes, and the React Stability Master Reference (rules of when components re-render, when effects re-run, what triggers reconciliation)

### SECTION 4: SQL (src/pages/sql/) — 8 pages, language="sql"

1. Quickstart.jsx (0) — Quick refresher: SELECT/WHERE/ORDER BY/GROUP BY, INSERT/UPDATE/DELETE, data types, NULL
2. Joins.jsx (1) — All JOIN types with diagrams, self-join, subqueries, performance
3. Window.jsx (2) — ROW_NUMBER/RANK/DENSE_RANK, LAG/LEAD, OVER/PARTITION BY, frame specs, running totals
4. Indexing.jsx (3) — B-tree, clustered/non-clustered, composite, EXPLAIN/ANALYZE, when to index
5. Design.jsx (4) — 1NF-5NF, denormalization, ER diagrams, keys, relationships, naming
6. Transactions.jsx (5) — ACID, isolation levels, dirty/phantom reads, deadlocks, locking
7. Cte.jsx (6) — CTE syntax, recursive CTEs, hierarchical data, CTE vs temp table
8. Advanced.jsx (7) — Materialized views, stored procedures, triggers, JSON ops, query optimization

### SECTION 5: SOLID (src/pages/solid/) — 6 pages, language="java"

1. Intro.jsx (0) — What is SOLID, overview, coupling vs cohesion, relationship diagram
2. Srp.jsx (1) — Single Responsibility with Java violation/refactored examples
3. Ocp.jsx (2) — Open/Closed with strategy pattern examples
4. Lsp.jsx (3) — Liskov with Rectangle/Square problem
5. Isp.jsx (4) — Interface Segregation with fat interface splitting
6. Dip.jsx (5) — Dependency Inversion with repository pattern

### SECTION 6: Design Patterns (src/pages/patterns/) — 8 pages, language="java"

1. Intro.jsx (0) — GoF categories, catalog flowchart, when to use
2. Singleton.jsx (1) — Singleton (4 variants) + Factory + Abstract Factory
3. Strategy.jsx (2) — Strategy (payment) + Observer (events)
4. Decorator.jsx (3) — Decorator (I/O) + Adapter (legacy)
5. Builder.jsx (4) — Builder (fluent) + Prototype (cloning)
6. Composite.jsx (5) — Composite (file system) + Facade
7. Proxy.jsx (6) — Proxy + Chain of Responsibility
8. Realworld.jsx (7) — MVC, Repository, Spring patterns, decision tree

### SECTION 7: React Anti-Patterns (src/pages/react-antipatterns/) — 6 pages, language="jsx"

1. Intro.jsx (0) — Common mistakes overview, code smell checklist
2. State.jsx (1) — Prop drilling, state duplication, God component, unnecessary state
3. Effects.jsx (2) — useEffect abuse, missing cleanup, infinite loops
4. Performance.jsx (3) — Premature optimization, inline objects, wrong keys
5. Components.jsx (4) — Prop spreading, nested ternaries, monolithic components
6. BestPractices.jsx (5) — Complete checklist: structure, naming, hooks, testing, a11y

### SECTION 8: Microservices (src/pages/microservices/) — 8 pages

1. Intro.jsx (0) — Monolith vs micro, trade-offs, Conway's Law
2. Patterns.jsx (1) — 10 core patterns with diagrams
3. Communication.jsx (2) — REST/gRPC/GraphQL, message brokers, decision tree
4. Data.jsx (3) — Database per service, CQRS, event sourcing, saga
5. Scaling.jsx (4) — Horizontal/vertical, auto-scaling, load balancing
6. Events.jsx (5) — Event-driven architecture, event types, eventual consistency
7. Containers.jsx (6) — Docker, Kubernetes basics, service mesh
8. Migration.jsx (7) — Strangler fig, DDD, bounded contexts, migration flowchart

### SECTION 9: API Design (src/pages/apidesign/) — 6 pages

1. Intro.jsx (0) — REST 6 constraints, Richardson Maturity, REST vs alternatives
2. Methods.jsx (1) — HTTP methods, idempotency, status codes by category
3. Resources.jsx (2) — URL naming, nested resources, filtering, HATEOAS
4. Errors.jsx (3) — RFC 7807, error codes, validation errors, rate limiting
5. Versioning.jsx (4) — Versioning strategies, pagination, caching (ETag)
6. Advanced.jsx (5) — API security, webhooks, SSE/WebSockets, OpenAPI

### SECTION 10: Auth and Security (src/pages/auth/) — 7 pages

1. Encryption.jsx (0) — Symmetric/asymmetric, AES, RSA, hashing, digital signatures
2. Tls.jsx (1) — TLS handshake, certificates, HTTPS, mTLS
3. Cookies.jsx (2) — Cookie mechanics, attributes, session management
4. Jwt.jsx (3) — JWT structure, claims, refresh tokens, vulnerabilities
5. Oauth.jsx (4) — OAuth 2.0 flows, OIDC, tokens
6. Authz.jsx (5) — AuthN vs AuthZ, RBAC, ABAC, SSO
7. Security.jsx (6) — CORS, CSRF, XSS, CSP, OWASP Top 10

### SECTION 11: Java Cheat Sheet (src/pages/java-cheatsheet/) — 5 pages, language="java"
Dense quick-reference format: maximum code blocks, minimal prose.

1. Syntax.jsx (0) — Types, operators, control flow, string methods, arrays
2. Collections.jsx (1) — List/Set/Map/Queue operations, sorting, iteration
3. Streams.jsx (2) — Stream operations, collectors, Optional
4. Concurrency.jsx (3) — Threads, ExecutorService, CompletableFuture, concurrent collections
5. Annotations.jsx (4) — Built-in, Spring, JPA, Lombok annotations

### SECTION 12: React Cheat Sheet (src/pages/react-cheatsheet/) — 5 pages, language="jsx"

1. Hooks.jsx (0) — Every hook signature + one-liner examples
2. Patterns.jsx (1) — HOC, render props, compound, controlled/uncontrolled
3. State.jsx (2) — State patterns, forms, useReducer
4. Styling.jsx (3) — CSS modules, styled-components, Tailwind comparison
5. Recipes.jsx (4) — Debounce, infinite scroll, dark mode, clipboard, localStorage hook

### SECTION 13: Testing Strategies (src/pages/testing/) — 6 pages

1. Intro.jsx (0) — Testing pyramid, TDD/BDD, test types, coverage
2. Unit.jsx (1) — JUnit 5 + Jest side by side
3. Mocking.jsx (2) — Mockito + Jest, stubs/spies/mocks
4. Integration.jsx (3) — Integration strategies, test containers
5. E2e.jsx (4) — Playwright/Cypress/Selenium comparison
6. BestPractices.jsx (5) — AAA pattern, naming, CI/CD, mutation testing

### SECTION 14: Git and DevOps (src/pages/devops/) — 6 pages

1. Git.jsx (0) — Commands cheat sheet, rebase vs merge, internals
2. Branching.jsx (1) — Git Flow, GitHub Flow, Trunk-Based
3. Cicd.jsx (2) — Pipeline stages, GitHub Actions
4. Docker.jsx (3) — Dockerfile, multi-stage, compose
5. Cloud.jsx (4) — AWS core services, serverless
6. Monitoring.jsx (5) — Observability, ELK, Prometheus/Grafana, SLIs/SLOs

### SECTION 15: System Design (src/pages/systemdesign/) — 7 pages (LARGE: 600+ lines each)

1. Intro.jsx (0) — Fundamentals, requirements gathering, CAP theorem
2. Scaling.jsx (1) — Vertical/horizontal, load balancers, CDN, consistent hashing
3. Caching.jsx (2) — Cache strategies, Redis vs Memcached, invalidation, stampede
4. Databases.jsx (3) — SQL vs NoSQL, sharding, read replicas, polyglot persistence
5. Distributed.jsx (4) — CAP deep dive, Raft/Paxos, distributed transactions
6. Messaging.jsx (5) — RabbitMQ, Kafka, exactly-once, dead letter queues
7. Interview.jsx (6) — URL shortener, rate limiter, chat system, news feed designs

### SECTION 16: TypeScript (src/pages/typescript/) — 10 pages, language="typescript"

1. Intro.jsx (0) — What is TS, structural typing, tsconfig, strict mode
2. Types.jsx (1) — Primitives, tuples, enums, any/unknown/never, unions, narrowing
3. Interfaces.jsx (2) — Interfaces, type aliases, interface vs type
4. Generics.jsx (3) — Generic functions/classes, mapped types, conditional types, utility types
5. Advanced.jsx (4) — Template literal types, discriminated unions, branded types
6. React.jsx (5) — Typing FC, props, hooks, events, forwardRef, context
7. Migration.jsx (6) — JS to TS migration strategy, allowJS, @types/
8. BestPractices.jsx (7) — Avoid any, use unknown, as const, strict mode
9. NewProject.jsx (8) — React+TS from scratch with Vite, project setup
10. Tsconfig.jsx (9) — Every important tsconfig option explained

### SECTION 17: React Router v7 (src/pages/react-router/) — 8 pages, language="jsx"

1. Intro.jsx (0) — Setup, BrowserRouter, Link/NavLink, hooks
2. Nested.jsx (1) — Nested routes, Outlet, layout routes
3. Data.jsx (2) — Loaders, actions, defer/Await
4. Guards.jsx (3) — Protected routes, auth guards, redirect
5. Advanced.jsx (4) — Lazy loading, scroll restoration, search params
6. Testing.jsx (5) — MemoryRouter, testing navigation
7. Fullapp.jsx (6) — Complete app routing example
8. Migration.jsx (7) — v5 to v7 migration guide

### SECTION 18: State Management (src/pages/state-mgmt/) — 5 pages, language="jsx"

1. Intro.jsx (0) — When useState/useContext fail, state categories, decision tree
2. Redux.jsx (1) — Redux Toolkit: createSlice, configureStore, RTK Query
3. Zustand.jsx (2) — Store creation, selectors, middleware, persistence
4. Comparison.jsx (3) — Redux vs Zustand vs Jotai vs Recoil vs MobX
5. Patterns.jsx (4) — Atomic state, server state (TanStack Query), XState

### SECTION 19: Accessibility (src/pages/accessibility/) — 5 pages, language="jsx"

1. Intro.jsx (0) — WCAG 2.1, levels, disability categories
2. Semantic.jsx (1) — Semantic HTML, landmarks, headings
3. Aria.jsx (2) — ARIA roles/states/properties, when NOT to use ARIA
4. Keyboard.jsx (3) — Tab order, focus management, focus trapping
5. Testing.jsx (4) — axe-core, Lighthouse, screen reader testing

### SECTION 20: CSS Mastery (src/pages/css-mastery/) — 6 pages, language="css"

1. Flexbox.jsx (0) — Complete flexbox guide
2. Grid.jsx (1) — Complete CSS Grid guide
3. Responsive.jsx (2) — Media queries, container queries, clamp()
4. Animations.jsx (3) — Transitions, @keyframes, prefers-reduced-motion
5. Variables.jsx (4) — Custom properties, theming, dark mode, :has/:is/:where
6. Patterns.jsx (5) — Holy Grail, sticky footer, cards, scroll snap

### SECTION 21: React Testing (src/pages/react-testing/) — 6 pages, language="jsx"

1. Intro.jsx (0) — RTL philosophy, query priority, user-event
2. Components.jsx (1) — Testing props, conditional rendering, snapshots
3. Hooks.jsx (2) — renderHook, testing custom hooks, act()
4. Async.jsx (3) — waitFor, findBy, MSW, loading/error/success
5. Forms.jsx (4) — Form inputs, submission, validation
6. Patterns.jsx (5) — Test utilities, custom render, CI, coverage

### SECTION 22: Frontend Tooling (src/pages/frontend-tooling/) — 5 pages

1. Vite.jsx (0) — Vite architecture, config, vs Webpack
2. Linting.jsx (1) — ESLint flat config, Prettier, husky
3. Packages.jsx (2) — npm vs yarn vs pnpm, workspaces
4. Monorepos.jsx (3) — Nx, Turborepo, caching
5. Performance.jsx (4) — Bundle analysis, tree shaking, code splitting

### SECTION 23: Interview Prep (src/pages/interview-prep/) — 4 pages

1. React.jsx (0) — Top 30 React interview Q&A
2. Typescript.jsx (1) — Top 25 TypeScript Q&A
3. Frontend.jsx (2) — Frontend system design
4. Coding.jsx (3) — Live coding challenges with implementations

### SECTION 24: npm Deep Dive (src/pages/npm-deep-dive/) — 6 pages, language="bash"

1. Intro.jsx (0) — What npm is, npm vs yarn vs pnpm
2. Resolution.jsx (1) — Semver, ranges, resolution algorithm
3. NodeModules.jsx (2) — node_modules structure, hoisting
4. Lockfile.jsx (3) — package-lock.json, npm ci vs install
5. Scripts.jsx (4) — Lifecycle hooks, custom scripts, npx
6. Security.jsx (5) — npm audit, supply chain attacks

### SECTION 25: Building npm Packages (src/pages/npm-packages/) — 5 pages

1. Anatomy.jsx (0) — Package structure, entry points
2. PackageJson.jsx (1) — Every important field explained
3. Modules.jsx (2) — CJS vs ESM, dual publishing
4. Publishing.jsx (3) — npm publish, semver, CI publishing
5. Advanced.jsx (4) — npm workspaces, changesets, provenance

### SECTION 26: Webpack (src/pages/webpack/) — 6 pages, language="javascript"

1. Intro.jsx (0) — What is Webpack, bundling concept, vs alternatives
2. Core.jsx (1) — Entry, output, mode, webpack.config.js
3. Loaders.jsx (2) — babel-loader, css-loader, asset modules, ts-loader
4. Plugins.jsx (3) — HtmlWebpackPlugin, MiniCssExtract, tree shaking, splitChunks
5. Devserver.jsx (4) — webpack-dev-server, HMR, proxy, source maps
6. Advanced.jsx (5) — Module Federation, code splitting, Webpack to Vite migration

---

## 8. BUILD AND VERIFY

After creating all pages in each section, run:

```bash
npm run build
```

### Common build errors and fixes:

| Error | Cause | Fix |
|-------|-------|-----|
| Unexpected token in JSX | Escaped quotes in JSX attribute | Use prop={"text with quotes"} JSX expression syntax |
| Mermaid render error | Parentheses () in node labels | Use square brackets [label] instead |
| Module not found | Wrong import path or filename case | Check filename is PascalCase, path is ../../components/ |
| X is not exported | Missing export default | Ensure every page has export default function Name() |
| Route shows blank | Route path mismatch | Paths must be identical in App.jsx and sections.js |

### Run the dev server:

```bash
npm run dev
# Opens at http://localhost:5173
```

### Final verification checklist:
- Build passes with npm run build (no errors)
- Homepage shows 26 section cards in a grid
- Each sidebar section expands to show its lessons
- Search bar filters lessons across all sections
- Every page renders with syntax-highlighted code, diagrams, quizzes
- FlowChart diagrams render (not blank boxes)
- InteractiveChallenge quizzes are clickable with correct/incorrect feedback
- Progress tracking persists across page reloads (localStorage)
- Left/Right arrow keyboard navigation works between lessons
- Mobile hamburger menu works at less than 768px width
- 404 page shows for invalid routes

---

## EXECUTION STRATEGY FOR THE AI

Work in phases to avoid overwhelming context:

**Phase 1:** Create scaffold, install deps, create all infrastructure files (global.css, components, sections.js, App.jsx). Run npm run build to verify.

**Phase 2-27:** Create one section at a time (all pages in that section), then run npm run build after each section to catch errors early. Fix any build errors before moving to the next section.

**Priority order:** Start with sections 1-6 (Java, Spring Boot, React 19, SQL, SOLID, Patterns) as they are the core content. Then sections 7-10 (Anti-Patterns, Microservices, API Design, Auth). Then the rest.

**Total target: 26 sections, 177 pages, 68000+ lines of content, all building clean, all interactive.**
