import type { CSSProperties } from 'react';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85rem',
};

const thStyle: CSSProperties = {
  background: '#16213e',
  color: '#e0e0e0',
  padding: '8px 10px',
  border: '1px solid #333',
  textAlign: 'left',
};

const tdStyle: CSSProperties = {
  background: '#1a1a2e',
  color: '#e0e0e0',
  padding: '8px 10px',
  border: '1px solid #333',
};

const tdLabelStyle: CSSProperties = {
  ...tdStyle,
  fontWeight: 'bold',
};

export default function BuildToolchain() {
  return (
    <LessonLayout
      title="React + TypeScript Build Toolchain"
      sectionId="react19"
      lessonIndex={12}
      prev={{ path: '/react19/typescript', label: 'React + TypeScript' }}
      next={{ path: '/react19/cheat-sheet', label: 'Cheat Sheet' }}
    >
      {/* ════════════════════════════════════════════════════
          WHY THIS PROBLEM EXISTS
          ════════════════════════════════════════════════════ */}
      <h2>Why This Problem Exists</h2>

      <p>
        Browsers understand three things: HTML, CSS, and plain JavaScript. React introduces two things browsers do not understand natively:
      </p>
      <ul>
        <li><strong>JSX</strong> — <code>&lt;div className="app"&gt;</code> is not valid JavaScript</li>
        <li><strong>TypeScript</strong> — type annotations (<code>name: string</code>) are not valid JavaScript</li>
      </ul>
      <p>
        Every approach in this document is solving the same core problem: <strong>transform JSX and TypeScript into plain JavaScript the browser can run</strong>, then optionally bundle multiple files into one.
      </p>

      <p>There are two separate jobs involved:</p>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Job</th>
            <th style={thStyle}>What it does</th>
            <th style={thStyle}>Who does it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdLabelStyle}>Transpiling</td>
            <td style={tdStyle}>Converts syntax (JSX → JS, TS → JS)</td>
            <td style={tdStyle}>Babel, esbuild, tsc, SWC</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Bundling</td>
            <td style={tdStyle}>Follows imports, collapses files into one</td>
            <td style={tdStyle}>Webpack, Rollup, esbuild, Vite, tsup</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Type checking</td>
            <td style={tdStyle}>Validates TypeScript types, reports errors</td>
            <td style={tdStyle}><code>tsc</code> only — never esbuild or Babel</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="Key Insight">
        <p>
          These are distinct jobs. esbuild and Babel can transpile but not type-check. <code>tsc</code> can type-check (and optionally emit), but is slower than dedicated bundlers. Most modern setups split the work: a fast tool transpiles and bundles, <code>tsc --noEmit</code> type-checks separately.
        </p>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          1. BABEL STANDALONE
          ════════════════════════════════════════════════════ */}
      <h3>1. Babel Standalone — In-Browser Compilation (No Build Step)</h3>

      <p>
        The simplest possible setup. No terminal, no npm, no compile step. Babel is loaded from a CDN and compiles JSX inside the browser at page load time.
      </p>

      <CodeBlock language="html" title="Babel Standalone — index.html" showLineNumbers>
{`<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<script type="text/babel" src="src/App.jsx"></script>
<script type="text/babel" src="src/main.jsx"></script>`}
      </CodeBlock>

      <p>
        Because nothing uses ES module import/export, the file:// CORS restriction never applies. You can double-click index.html and it works.
      </p>

      <InfoBox variant="tip" title="When to Use">
        <p><strong>Pros:</strong> Zero setup, works with file://, closest to CodePen style</p>
        <p><strong>Cons:</strong> Babel compiles in browser on every load (slow), no TypeScript, no bundling, not for production</p>
        <p><strong>Best for:</strong> Learning, quick demos, teaching</p>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          2. BABEL CLI
          ════════════════════════════════════════════════════ */}
      <h3>2. Babel CLI — Transpile Only, No Bundler</h3>

      <p>
        Babel runs in the terminal, transforms JSX files into plain JS files, one-to-one. Because Babel is a transpiler not a bundler, it does not follow imports. Compiled files still contain bare package specifiers that browsers cannot resolve.
      </p>

      <CodeBlock language="bash" title="Babel CLI Setup" showLineNumbers>
{`npm install --save-dev @babel/core @babel/cli @babel/preset-react
npx babel src --out-dir dist --extensions ".jsx,.js" --presets @babel/preset-react`}
      </CodeBlock>

      <CodeBlock language="js" title="What compiled output looks like" showLineNumbers>
{`// Before (JSX)
export default function App() {
  return <div className="app">Hello</div>
}

// After (plain JS)
import { jsx as _jsx } from "react/jsx-runtime";
export default function App() {
  return _jsx("div", { className: "app", children: "Hello" });
}`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Use">
        <p><strong>Pros:</strong> Teaches exactly what JSX compiles to, minimal deps</p>
        <p><strong>Cons:</strong> Requires HTTP server, manual import rewriting, no TypeScript type-checking</p>
        <p><strong>Best for:</strong> Understanding what JSX compiles to. Educational only.</p>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          3. TSC
          ════════════════════════════════════════════════════ */}
      <h3>3. TypeScript Compiler (tsc) — Manual TypeScript Build</h3>

      <p>
        The official TypeScript compiler. Can both type-check and emit JavaScript, but does neither bundling nor JSX-aware optimization at modern tool speeds. Almost always used in <code>--noEmit</code> mode (type-check only) alongside a faster tool.
      </p>

      <CodeBlock language="bash" title="tsc Usage" showLineNumbers>
{`# Mode 1: Type-check only (most common)
tsc --noEmit

# Mode 2: Emit JS files (one .js per .ts, no bundling)
tsc`}
      </CodeBlock>

      <CodeBlock language="json" title="tsconfig.json" showLineNumbers>
{`{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true
  }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Use">
        <p><strong>Pros:</strong> Official tool, full type checking, latest TS features</p>
        <p><strong>Cons:</strong> No bundling, slower than esbuild/SWC, output has unresolved bare specifiers</p>
        <p><strong>Best for:</strong> Type-checking in CI, combined with another bundler</p>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          4. ESBUILD
          ════════════════════════════════════════════════════ */}
      <h3>4. esbuild — Fast Transpiler + Bundler</h3>

      <p>
        Written in Go, 10–100x faster than Babel or webpack. Handles JSX transformation, TypeScript stripping, and bundling in a single pass. Output is a single JS file with all imports resolved.
      </p>

      <CodeBlock language="bash" title="esbuild Setup" showLineNumbers>
{`npm install --save-dev esbuild typescript @types/react @types/react-dom

# Bundle TSX to a single self-contained JS file
esbuild src/index.tsx --bundle --outfile=dist/bundle.js --platform=browser

# Minified production build
esbuild src/index.tsx --bundle --minify --outfile=dist/bundle.js --platform=browser`}
      </CodeBlock>

      <InfoBox variant="warning" title="esbuild Does NOT Type-Check">
        <p>
          esbuild strips TypeScript type annotations but does <strong>NOT</strong> check them. Run <code>tsc --noEmit</code> separately.
        </p>
      </InfoBox>

      <CodeBlock language="json" title="package.json scripts" showLineNumbers>
{`{
  "typecheck": "tsc --noEmit",
  "build": "esbuild src/index.tsx --bundle --outfile=dist/bundle.js --platform=browser"
}`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Use">
        <p><strong>Pros:</strong> Extremely fast, single output file works from file://, minimal config</p>
        <p><strong>Cons:</strong> No type checking, no HMR, limited plugins</p>
        <p><strong>Best for:</strong> Simple apps, scripts, demos that don&apos;t need a dev server</p>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          5. VITE
          ════════════════════════════════════════════════════ */}
      <h3>5. Vite — Dev Server + Optimized Builds</h3>

      <p>
        The modern standard for React application development. Dev mode uses native ES modules with esbuild on-demand transforms for instant startup. Production uses Rollup for optimized, code-split bundles.
      </p>

      <CodeBlock language="bash" title="Vite Quick Start" showLineNumbers>
{`npm create vite@latest my-app -- --template react-ts
cd my-app && npm install
npm run dev      # instant dev server with HMR
npm run build    # production build to dist/`}
      </CodeBlock>

      <CodeBlock language="ts" title="vite.config.ts" showLineNumbers>
{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`}
      </CodeBlock>

      <p>
        What Vite gives out of the box: JSX + TS compilation, HMR, CSS imports from JS, automatic code splitting, asset optimization.
      </p>

      <InfoBox variant="success" title="When to Use">
        <p><strong>Pros:</strong> Near-instant startup, HMR, highly optimized production builds, zero-config</p>
        <p><strong>Cons:</strong> Requires dev server, more abstraction, overkill for simple scripts</p>
        <p><strong>Best for:</strong> Any real React application. Default choice for new projects.</p>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          6. WEBPACK
          ════════════════════════════════════════════════════ */}
      <h3>6. Webpack — Maximum Control, Maximum Overhead</h3>

      <p>
        The original JavaScript bundler. Most configurable option, still used in large enterprise projects. Every transformation requires explicit loader configuration.
      </p>

      <CodeBlock language="bash" title="Webpack Dependencies" showLineNumbers>
{`npm install --save-dev webpack webpack-cli ts-loader \\
  sass sass-loader css-loader mini-css-extract-plugin \\
  html-webpack-plugin typescript @types/react @types/react-dom`}
      </CodeBlock>

      <CodeBlock language="js" title="webpack.config.js" showLineNumbers>
{`module.exports = {
  entry: './src/index.tsx',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js', clean: true },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: {
    rules: [
      { test: /\\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader',
              { loader: 'sass-loader', options: { api: 'modern' } }],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
  ],
};`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Use">
        <p><strong>Pros:</strong> Most configurable, mature plugin ecosystem, handles any file type</p>
        <p><strong>Cons:</strong> Verbose config, slow cold starts, not recommended for new projects</p>
        <p><strong>Best for:</strong> Large enterprise apps, legacy codebases, specific webpack plugin needs</p>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          7. TSUP
          ════════════════════════════════════════════════════ */}
      <h3>7. tsup — Library Bundling (Dual CJS/ESM Output)</h3>

      <p>
        The standard tool for publishing React component libraries to npm. Wraps esbuild and adds library-specific features: dual format output, TypeScript declarations, tree-shaking.
      </p>

      <InfoBox variant="danger" title="Critical: Libraries Must NOT Bundle React">
        <p>
          Libraries must <strong>NOT</strong> bundle React. The consuming app provides its own copy. Bundling React would load it twice, breaking hooks.
        </p>
      </InfoBox>

      <CodeBlock language="ts" title="tsup.config.ts" showLineNumbers>
{`import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
  treeshake: true,
});`}
      </CodeBlock>

      <CodeBlock language="json" title="package.json — Library exports" showLineNumbers>
{`{
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "peerDependencies": {
    "react": ">=17",
    "react-dom": ">=17"
  }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Use">
        <p><strong>Pros:</strong> Purpose-built for libraries, dual CJS/ESM, auto .d.ts generation</p>
        <p><strong>Cons:</strong> Not for apps, no dev server</p>
        <p><strong>Best for:</strong> React component libraries, design systems, npm packages</p>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          MASTER COMPARISON TABLE
          ════════════════════════════════════════════════════ */}
      <h2>Master Comparison Table</h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}></th>
              <th style={thStyle}>Babel Standalone</th>
              <th style={thStyle}>Babel CLI</th>
              <th style={thStyle}>tsc emit</th>
              <th style={thStyle}>esbuild</th>
              <th style={thStyle}>Vite</th>
              <th style={thStyle}>Webpack</th>
              <th style={thStyle}>tsup</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdLabelStyle}>Transpiles JSX</td>
              <td style={tdStyle}>Yes (runtime)</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Transpiles TS</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>With preset</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes (strips)</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes (strips)</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Type checks</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>Separate tsc</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>No</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Bundles files</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Yes</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Works file://</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>Yes (dist/)</td>
              <td style={tdStyle}>N/A</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Dev server/HMR</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>With plugin</td>
              <td style={tdStyle}>No</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Build speed</td>
              <td style={tdStyle}>N/A</td>
              <td style={tdStyle}>Slow</td>
              <td style={tdStyle}>Slow</td>
              <td style={tdStyle}>Very fast</td>
              <td style={tdStyle}>Fast</td>
              <td style={tdStyle}>Slow</td>
              <td style={tdStyle}>Very fast</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Config complexity</td>
              <td style={tdStyle}>None</td>
              <td style={tdStyle}>Low</td>
              <td style={tdStyle}>Low</td>
              <td style={tdStyle}>Low</td>
              <td style={tdStyle}>Low</td>
              <td style={tdStyle}>High</td>
              <td style={tdStyle}>Low</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Use case</td>
              <td style={tdStyle}>Demo</td>
              <td style={tdStyle}>Learn</td>
              <td style={tdStyle}>Check types</td>
              <td style={tdStyle}>App/script</td>
              <td style={tdStyle}>App</td>
              <td style={tdStyle}>Enterprise</td>
              <td style={tdStyle}>npm library</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ════════════════════════════════════════════════════
          DECISION GUIDE
          ════════════════════════════════════════════════════ */}
      <h2>Decision Guide</h2>

      <FlowChart
        title="Which Build Tool Should You Use?"
        chart={"graph TD\n  A[Start: What are you building?] --> B{Publishing to npm?}\n  B -->|Yes| C[tsup]\n  B -->|No| D{Building a React app with HMR?}\n  D -->|Yes| E[Vite]\n  D -->|No| F{Need maximum build control?}\n  F -->|Yes| G[Webpack]\n  F -->|No| H{Want single file, no server?}\n  H -->|Yes| I[esbuild]\n  H -->|No| J{Learning or prototyping?}\n  J -->|Yes| K[Babel Standalone]\n  J -->|No| L{Just type-checking?}\n  L -->|Yes| M[tsc --noEmit]\n  L -->|No| N[Vite - the safe default]"}
      />

      {/* ════════════════════════════════════════════════════
          TYPE-CHECKING SPLIT
          ════════════════════════════════════════════════════ */}
      <h2>The TypeScript Type-Checking Split</h2>

      <p>Every modern approach uses this pattern:</p>
      <ul>
        <li><strong>Fast tool</strong> (esbuild/Rollup/webpack) transpiles + bundles quickly, ignores types</li>
        <li><strong><code>tsc --noEmit</code></strong> checks types, reports errors, writes nothing</li>
      </ul>

      <InfoBox variant="warning" title="Never Skip Type Checking">
        <p>
          Never rely on a fast bundler to catch type errors — it won&apos;t. Always run <code>tsc --noEmit</code> separately.
        </p>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          WHY NOT JUST BABEL?
          ════════════════════════════════════════════════════ */}
      <h2>Why Not Just Use Babel for Everything?</h2>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}></th>
            <th style={thStyle}>Babel</th>
            <th style={thStyle}>esbuild</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdLabelStyle}>Written in</td>
            <td style={tdStyle}>JavaScript (slow)</td>
            <td style={tdStyle}>Go (fast)</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Build speed</td>
            <td style={tdStyle}>10–60s</td>
            <td style={tdStyle}>&lt;1s</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Plugin ecosystem</td>
            <td style={tdStyle}>Large</td>
            <td style={tdStyle}>Minimal</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>React Native</td>
            <td style={tdStyle}>Required</td>
            <td style={tdStyle}>Not supported</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="When Babel Is Still Needed">
        <ul>
          <li>React Native projects</li>
          <li>Specific Babel plugins (decorators, legacy transforms)</li>
          <li>Jest in non-Vitest projects</li>
        </ul>
      </InfoBox>

      {/* ════════════════════════════════════════════════════
          QUICK-START EXAMPLES
          ════════════════════════════════════════════════════ */}
      <h2>Quick-Start Examples</h2>

      <h3>Babel Standalone (HTML)</h3>
      <CodeBlock language="html" title="Quick Start — Babel Standalone" showLineNumbers>
{`<!DOCTYPE html>
<html>
<head><title>React Babel Standalone</title></head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel">
    function App() {
      return <h1>Hello from Babel Standalone!</h1>;
    }
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`}
      </CodeBlock>

      <h3>esbuild</h3>
      <CodeBlock language="bash" title="Quick Start — esbuild" showLineNumbers>
{`mkdir my-app && cd my-app
npm init -y
npm install react react-dom
npm install --save-dev esbuild typescript @types/react @types/react-dom

# Create src/index.tsx, then:
esbuild src/index.tsx --bundle --outfile=dist/bundle.js --platform=browser`}
      </CodeBlock>

      <h3>Vite</h3>
      <CodeBlock language="bash" title="Quick Start — Vite" showLineNumbers>
{`npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev`}
      </CodeBlock>

      <h3>Webpack</h3>
      <CodeBlock language="bash" title="Quick Start — Webpack" showLineNumbers>
{`mkdir my-app && cd my-app
npm init -y
npm install react react-dom
npm install --save-dev webpack webpack-cli ts-loader \\
  html-webpack-plugin typescript @types/react @types/react-dom

# Create webpack.config.js, tsconfig.json, src/index.tsx, src/index.html
npx webpack --mode production`}
      </CodeBlock>

      <h3>tsup</h3>
      <CodeBlock language="bash" title="Quick Start — tsup (Library)" showLineNumbers>
{`mkdir my-lib && cd my-lib
npm init -y
npm install --save-dev tsup typescript react @types/react

# Create tsup.config.ts and src/index.ts, then:
npx tsup`}
      </CodeBlock>

    </LessonLayout>
  );
}
