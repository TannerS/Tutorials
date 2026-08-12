import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Core() {
  return (
    <LessonLayout
      title="Core Concepts"
      sectionId="vite"
      lessonIndex={1}
      prev={{ path: '/vite/intro', label: 'What is Vite?' }}
      next={{ path: '/vite/plugins', label: 'Plugins & Asset Handling' }}
    >
      <p>
        <code>vite.config.ts</code> is smaller and more opinionated than a Webpack config,
        but every option matters once your project grows past the defaults. This lesson
        walks the full config surface, then covers three things unique to how Vite runs:
        its three commands, its environment variable system, and dependency pre-bundling.
      </p>

      <FlowChart
        title="vite.config.ts Building Blocks"
        chart={"graph LR\n  A[root / base / publicDir] --> B[resolve.alias]\n  B --> C[define]\n  C --> D[envDir / envPrefix]\n  D --> E[plugins]\n  E --> F[server / build options]"}
      />

      {/* ── ROOT, BASE, PUBLICDIR ─────────────────────────── */}
      <h2>root, base, and publicDir</h2>
      <p>
        These three options control where Vite looks for files and how it references them.
      </p>

      <CodeBlock language="javascript" title="vite.config.ts — root / base / publicDir">{`import { defineConfig } from 'vite';

export default defineConfig({
  // Project root — where index.html lives and imports resolve from.
  // Defaults to process.cwd(). Rarely changed unless index.html
  // lives in a subdirectory (e.g. monorepo packages).
  root: process.cwd(),

  // Base public path when served in production, e.g. if your app is
  // deployed under https://example.com/my-app/, set base: '/my-app/'.
  // Defaults to '/'.
  base: '/',

  // Directory for static assets copied as-is to the output root,
  // WITHOUT going through the build pipeline (no hashing, no transform).
  // Defaults to 'public'.
  publicDir: 'public',
});`}</CodeBlock>

      <InfoBox variant="info" title="public/ vs src/assets">
        Anything in <code>publicDir</code> is copied byte-for-byte to the output root and
        referenced by absolute URL (<code>/favicon.svg</code>) &mdash; it's never processed,
        hashed, or imported as a module. Anything in <code>src/</code> that you
        <code>import</code> goes through Vite's asset pipeline and gets a content hash.
        We cover this distinction in depth in the next lesson.
      </InfoBox>

      {/* ── RESOLVE ALIAS ─────────────────────────────────── */}
      <h2>resolve.alias</h2>
      <p>
        Same concept as Webpack's <code>resolve.alias</code>: map an import specifier to a
        filesystem path so you can write clean, refactor-safe imports.
      </p>

      <CodeBlock language="javascript" title="vite.config.ts — Aliases">{`import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
});

// import Button from '@components/Button';
// instead of
// import Button from '../../../components/Button';`}</CodeBlock>

      <InfoBox variant="tip" title="Keep tsconfig.json in Sync">
        TypeScript doesn't know about <code>vite.config.ts</code> aliases &mdash; you still
        need matching <code>paths</code> entries in <code>tsconfig.json</code> for
        type-checking and editor autocomplete, or install <code>vite-tsconfig-paths</code>
        to read them from tsconfig automatically instead of duplicating them.
      </InfoBox>

      {/* ── DEFINE ─────────────────────────────────────────── */}
      <h2>define</h2>
      <p>
        <code>define</code> does a global, compile-time text replacement across your source
        &mdash; the same role as Webpack's <code>DefinePlugin</code>. Useful for injecting
        build-time constants that aren't environment variables (version numbers, feature
        flags baked in at build time).
      </p>

      <CodeBlock language="javascript" title="vite.config.ts — define">{`export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('1.4.2'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});

// Anywhere in source:
console.log(__APP_VERSION__); // '1.4.2' — replaced at build time, not a runtime lookup`}</CodeBlock>

      <InfoBox variant="warning" title="define Values Must Be JSON-Stringified">
        Vite performs a literal text substitution, so string values need
        <code>JSON.stringify()</code> around them. <code>__APP_VERSION__: '1.4.2'</code>
        (without stringify) would emit the bare identifier <code>1.4.2</code> into your
        code, which is invalid JavaScript.
      </InfoBox>

      {/* ── ENV FILES ──────────────────────────────────────── */}
      <h2>Environment Variables & .env Files</h2>
      <p>
        Vite loads env files based on the current mode and exposes them through
        <code>import.meta.env</code> instead of Node's <code>process.env</code> &mdash;
        because dev-time code runs in the browser, where <code>process.env</code> doesn't
        exist. Only variables prefixed <code>VITE_</code> (configurable via
        <code>envPrefix</code>) are exposed to client code; everything else stays
        server-side/build-side only.
      </p>

      <CodeBlock language="bash" title=".env File Conventions">{`.env                # loaded in all modes
.env.local           # loaded in all modes, git-ignored — for secrets/local overrides
.env.development      # loaded only when mode = development (vite / vite dev)
.env.production        # loaded only when mode = production (vite build)
.env.[mode].local        # mode-specific, git-ignored

# Inside any of these files:
VITE_API_URL=https://api.example.com
VITE_FEATURE_FLAG=true

# No VITE_ prefix → NOT sent to client code, but still readable in vite.config.ts
DATABASE_URL=postgres://localhost:5432/mydb`}</CodeBlock>

      <CodeBlock language="javascript" title="Reading import.meta.env">{`const apiUrl = import.meta.env.VITE_API_URL;

// Built-in, always available regardless of prefix:
import.meta.env.MODE;    // 'development' | 'production' | custom mode
import.meta.env.DEV;     // boolean, true outside production builds
import.meta.env.PROD;    // boolean, true in production builds
import.meta.env.SSR;     // boolean, true when running in an SSR context
import.meta.env.BASE_URL; // the 'base' config option, for building asset URLs`}</CodeBlock>

      <CodeBlock language="javascript" title="vite.config.ts — envDir / envPrefix">{`export default defineConfig({
  // Directory to load .env files from — defaults to root.
  // Useful in monorepos where env files live at the repo root.
  envDir: path.resolve(__dirname, '../../'),

  // Which prefixes get exposed to client code. Defaults to ['VITE_'].
  // Rarely changed, but some teams add a second prefix for a design system package.
  envPrefix: ['VITE_', 'PUBLIC_'],
});`}</CodeBlock>

      <InfoBox variant="warning" title="VITE_-Prefixed Vars Are Public">
        Anything exposed via <code>import.meta.env</code> is statically inlined into your
        client bundle and readable by anyone who opens dev tools. Never put write-access API
        keys, database credentials, or other secrets behind the <code>VITE_</code> prefix.
      </InfoBox>

      {/* ── DEV / BUILD / PREVIEW ──────────────────────────── */}
      <h2>Dev, Build, and Preview: Three Distinct Modes</h2>
      <p>
        Vite ships three CLI commands, and it's worth being precise about what each one
        actually runs:
      </p>

      <FlowChart
        title="vite / vite build / vite preview"
        chart={"graph TD\n  A[vite] --> B[Dev server - native ESM plus esbuild transform]\n  C[vite build] --> D[Rollup production bundle to dist/]\n  E[vite preview] --> F[Static file server for dist/ - sanity check only]\n  D -.->|serves| F"}
      />

      <CodeBlock language="json" title="package.json Scripts">{`{
  "scripts": {
    "dev": "vite",              // start the dev server (mode: development)
    "build": "vite build",       // produce dist/ via Rollup (mode: production)
    "preview": "vite preview"     // locally serve dist/ to sanity-check the real build
  }
}`}</CodeBlock>

      <InfoBox variant="info" title="preview Is Not a Dev Server">
        <code>vite preview</code> serves the already-built <code>dist/</code> folder as
        static files &mdash; it does no transforming, no HMR, nothing dynamic. Its only job
        is letting you catch build-specific issues (missing base path, broken imports that
        only surface after tree-shaking) before you deploy.
      </InfoBox>

      {/* ── PRE-BUNDLING ───────────────────────────────────── */}
      <h2>Dependency Pre-Bundling</h2>
      <p>
        This is the part of Vite's architecture that makes native-ESM serving actually
        practical. Two problems would break dev mode without it:
      </p>
      <ul>
        <li>
          <strong>CommonJS/UMD packages</strong> &mdash; a huge share of npm packages still
          ship CommonJS, which the browser's native ESM loader can't <code>import</code>
          directly. Vite converts these to ESM ahead of time.
        </li>
        <li>
          <strong>Deep internal module graphs</strong> &mdash; a package like
          <code>lodash-es</code> can have 600+ internal modules. Importing it naively would
          mean 600+ separate browser requests just to load one dependency. Pre-bundling
          flattens each dependency into a single ESM file.
        </li>
      </ul>

      <FlowChart
        title="Dependency Pre-Bundling Flow"
        chart={"graph TD\n  A[Vite dev server starts] --> B[Scan entry points for imports]\n  B --> C{Bare import from node_modules?}\n  C -->|Yes| D[esbuild converts CJS/UMD to ESM]\n  D --> E[Flatten many internal modules into one file]\n  E --> F[Cache in node_modules/.vite/deps]\n  C -->|No, it's your source| G[Serve untouched, transform on request]\n  F --> H[Browser imports the flattened, cached dependency]"}
      />

      <p>
        This scan-and-convert step runs once, using esbuild, which is why it's nearly
        invisible even on projects with hundreds of dependencies &mdash; esbuild is roughly
        10&ndash;100x faster than a JavaScript-based bundler doing the same conversion. The
        result is cached in <code>node_modules/.vite/deps</code>, so subsequent dev server
        starts skip the scan entirely unless your dependencies changed.
      </p>

      <CodeBlock language="javascript" title="vite.config.ts — optimizeDeps">{`export default defineConfig({
  optimizeDeps: {
    // Force-include a dependency that Vite's scanner missed
    // (common for packages only imported dynamically, e.g. via a plugin)
    include: ['deep-nested-package/utils'],

    // Exclude a dependency from pre-bundling — useful for packages
    // that are already valid ESM and shouldn't be flattened
    exclude: ['@my-org/already-esm-package'],

    // Force a full re-optimization on the next dev server start
    force: true,
  },
});`}</CodeBlock>

      <InfoBox variant="tip" title="When You'll Actually Touch optimizeDeps">
        Most projects never need this option. You'll reach for it when the dev server logs
        "new dependencies optimized" repeatedly on every reload (a sign the scanner missed
        something — add it to <code>include</code>), or when a linked/local package via
        <code>npm link</code> or a monorepo workspace isn't getting pre-bundled correctly.
      </InfoBox>

      <h3>How Bare Import Resolution Works at Dev Time</h3>
      <p>
        When your source does <code>import {'{ useState }'} from 'react'</code>, the browser
        can't resolve a bare specifier like <code>'react'</code> on its own &mdash; native
        ESM only understands relative and absolute URLs. Vite's dev server intercepts these
        requests and rewrites them:
      </p>
      <CodeBlock language="javascript" title="What the Browser Actually Requests">{`// Your source code:
import { useState } from 'react';

// What Vite serves to the browser (import rewritten to a real URL):
import { useState } from '/node_modules/.vite/deps/react.js?v=abc123';

// The ?v= query string is a cache-busting hash tied to your
// dependency versions — it changes only when deps actually change.`}</CodeBlock>

      <InteractiveChallenge
        question="Why does Vite pre-bundle dependencies with esbuild before serving them at dev time?"
        options={[
          "To minify them for smaller file sizes during development",
          "To convert CommonJS/UMD to ESM and flatten deep internal module graphs into single requests",
          "Because Rollup can't process node_modules directly",
          "To type-check third-party packages"
        ]}
        correctIndex={1}
        explanation="Pre-bundling solves two problems: many npm packages still ship CommonJS/UMD, which native ESM can't import directly, and packages with hundreds of internal modules would otherwise require hundreds of separate browser requests. esbuild converts and flattens each dependency into one ESM file, cached in node_modules/.vite/deps."
      />

      <h2>What's Next</h2>
      <p>
        You now know how to configure Vite's core options and why pre-bundling exists.
        Next, we'll cover Vite's plugin system &mdash; Rollup-compatible with Vite-specific
        extensions &mdash; and how it handles static assets and CSS out of the box.
      </p>
    </LessonLayout>
  );
}

export default Core;
