import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Vite() {
  return (
    <LessonLayout
      title="Vite Deep Dive"
      sectionId="frontend-tooling"
      lessonIndex={0}
      prev={null}
      next={{ path: '/frontend-tooling/webpack', label: 'Webpack: Getting Started' }}
    >
      <InfoBox variant="info" title="This Is the Toolchain-Level Tour">
        This lesson covers Vite as <em>one tool in your frontend toolchain</em> — enough to read
        and modify a <code>vite.config.ts</code>, wire up env vars, and ship a build.
      </InfoBox>

      <h2>Why Vite?</h2>
      <p>
        If you've used Create React App or Webpack, you've felt the pain: slow cold starts,
        sluggish HMR, and config files that rival War and Peace. Vite (French for "fast")
        was created by Evan You to solve these problems by leveraging native ES modules
        during development and a Rollup-compatible bundler for production builds. As of
        Vite 8 that bundler is <strong>Rolldown</strong>, and it now handles both halves of
        the job — see "How Vite Works Under the Hood" below for what changed.
      </p>

      <InfoBox variant="info" title="CRA Is Dead">
        Create React App is no longer maintained — the React team formally deprecated it in
        2025. The official recommendation is a framework (Next.js, React Router in framework
        mode, TanStack Start) or Vite for a plain SPA. If your new team is still on CRA,
        migrating to Vite is usually straightforward.
      </InfoBox>

      <h3>Vite vs Webpack vs CRA</h3>
      <p>
        Webpack bundles your entire app before serving it. Vite serves files individually
        using native ESM — the browser requests modules on demand, so startup is nearly
        instant regardless of app size.
      </p>

      <FlowChart
        title="Webpack vs Vite Dev Flow"
        chart={"graph TD\n  A[Source Files] --> B{Dev Server}\n  B -->|Webpack| C[Bundle Everything]\n  C --> D[Serve Bundle]\n  B -->|Vite| E[Serve Native ESM]\n  E --> F[Transform On Request]\n  F --> G[Browser Loads Modules]"}
      />

      <h2>How Vite Works Under the Hood</h2>

      <InfoBox variant="info" title="One Bundler Now, Not Two">
        Through Vite 7 this section would have described two separate engines: <strong>esbuild</strong>{' '}
        pre-bundling dependencies and transforming TS/JSX in dev, and <strong>Rollup</strong>{' '}
        producing the production build. That split was Vite's biggest structural wart — dev and
        prod could disagree because they ran through different code. Vite 8 replaces both with{' '}
        <strong>Rolldown</strong>, a Rust bundler that is Rollup-API-compatible by design, plus{' '}
        <strong>Oxc</strong> for the per-file transform esbuild used to do. If you read an older
        tutorial that says "esbuild in dev, Rollup in prod," it is describing Vite 7 and earlier.
      </InfoBox>

      <h3>Development: Native ESM + Rolldown/Oxc</h3>
      <p>
        In dev mode, Vite pre-bundles dependencies (node_modules) with Rolldown, then serves your
        source code as native ES modules. The browser's import system requests files individually,
        and Vite strips types and compiles JSX on the fly with Oxc's transformer. Pre-bundling
        exists for two reasons that have nothing to do with speed of bundling: it converts any
        CommonJS dependency to ESM so the browser can load it, and it collapses a package that
        ships hundreds of small files into one request instead of hundreds.
      </p>

      <FlowChart
        title="Vite Dev Server Architecture"
        chart={"graph TD\n  A[Browser Request] --> B[Vite Dev Server]\n  B --> C{File Type?}\n  C -->|node_modules| D[Pre-bundled with Rolldown]\n  C -->|.tsx/.jsx| E[Transformed by Oxc]\n  C -->|.css| F[Inject as JS module]\n  C -->|.svg| G[Transform via Plugin]\n  D --> H[Serve to Browser]\n  E --> H\n  F --> H\n  G --> H"}
      />

      <h3>Production: Rolldown</h3>
      <p>
        For production, Vite creates optimized bundles with tree-shaking, code splitting, and
        asset hashing. Historically that was Rollup. Rolldown — the Rust-based bundler the Vite
        team built to unify esbuild's pre-bundling role and Rollup's build role in one engine —
        shipped as opt-in <code>rolldown-vite</code> during the Vite 6/7 era and became <em>the</em>{' '}
        bundler in Vite 8, for both dev pre-bundling and the production build. CSS minification is
        handled by <strong>Lightning CSS</strong>, also Rust — it is the default minifier in Vite 8
        (esbuild is opt-in via <code>build.cssMinify: 'esbuild'</code>, and esbuild is no longer a
        bundled dependency at all). The full CSS <em>transform</em> pipeline still runs PostCSS by
        default; set <code>css.transformer: 'lightningcss'</code> to hand syntax lowering and
        vendor-prefixing to Lightning CSS too and drop Autoprefixer entirely.
      </p>

      <InfoBox variant="tip" title="Why the Config Barely Changed">
        Rolldown is deliberately Rollup-API-compatible, so <code>build.rollupOptions</code>,
        <code> manualChunks</code>, and the vast majority of Rollup plugins keep working across
        the switch. That compatibility is the whole point — you get the Rust speedup without
        rewriting your build config. Expect differences mainly in exotic plugins and in exact
        chunk-hash output, not in the options you write day to day.
      </InfoBox>

      <h2>vite.config.ts Deep Dive</h2>

      <CodeBlock language="javascript" title="Complete vite.config.ts">
{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr({
      svgrOptions: { icon: true },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },

  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\\/api/, ''),
      },
    },
  },

  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router'],
          ui: ['@mui/material', '@emotion/react'],
        },
      },
    },
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}))`}
      </CodeBlock>

      <InfoBox variant="warning" title="__dirname Works Today Only Because Vite Bundles Your Config">
        <p>
          The alias block above uses <code>__dirname</code>, which you&apos;ll see in most Vite
          tutorials. <code>__dirname</code> is a CommonJS global and does not exist in an ES module,
          and every scaffolded Vite project sets <code>&quot;type&quot;: &quot;module&quot;</code> —
          so the natural assumption is that this throws. It doesn&apos;t, and knowing <em>why</em>{' '}
          is what tells you when it will start to.
        </p>
        <p>
          Vite does not <code>import()</code> your config file directly. Its default{' '}
          <code>configLoader: 'bundle'</code> runs the config through Rolldown first, and that
          bundling step shims <code>__dirname</code> in for you. So on a clean Vite 8 ESM project
          both <code>vite</code> and <code>vite build</code> succeed — the only visible consequence
          is a warning:
        </p>
        <CodeBlock language="text" title="Verified — vite 8.2.2, clean ESM project, __dirname in the alias block">
{`(!) Your Vite config uses features that are unsupported by 'configLoader: native',
    which is planned to become the default in a future major version of Vite:
  - __dirname (vite.config.ts:6:32). Use import.meta.dirname instead

vite v8.2.2 building client environment for production...
✓ 5 modules transformed.
✓ built in 17ms`}
        </CodeBlock>
        <p>
          That warning is the real reason to migrate. <code>configLoader: 'native'</code> skips the
          bundling step and hands the config straight to Node&apos;s own ESM loader — faster, no
          transform in the way, and it is the planned default. Opt in today and the shim goes with
          it:
        </p>
        <CodeBlock language="text" title="Verified — the same project with vite build --configLoader native">
{`failed to load config from /tmp/viteverify/vite.config.ts
error during build:
ReferenceError: __dirname is not defined in ES module scope`}
        </CodeBlock>
        <p>
          So: <code>__dirname</code> is not broken, it is <em>borrowed</em>. Use{' '}
          <code>import.meta.dirname</code> on Node 20.11+, or derive it with{' '}
          <code>fileURLToPath(new URL('.', import.meta.url))</code>, and your config keeps working
          under either loader. Better still, install <code>vite-tsconfig-paths</code> and skip the
          manual alias block entirely — one source of truth in <code>tsconfig.json</code> for both
          the compiler and the bundler.
        </p>
      </InfoBox>

      <h2>Essential Plugins</h2>

      <CodeBlock language="bash" title="Install Common Plugins">
{`npm install -D @vitejs/plugin-react vite-plugin-svgr vite-tsconfig-paths`}
      </CodeBlock>

      <p>
        <strong>@vitejs/plugin-react</strong> — Adds Fast Refresh (HMR for React), JSX
        runtime, and Babel/SWC integration. Use the SWC variant for even faster transforms:
      </p>

      <CodeBlock language="bash">
{`npm install -D @vitejs/plugin-react-swc`}
      </CodeBlock>

      <p>
        <strong>vite-plugin-svgr</strong> — Import SVGs as React components.
        <strong> vite-tsconfig-paths</strong> — Reads path aliases from tsconfig.json
        so you don't duplicate them in vite.config.
      </p>

      <h2>Environment Variables</h2>
      <p>
        Vite exposes env variables on <code>import.meta.env</code> instead of
        <code>process.env</code>. Only variables prefixed with <code>VITE_</code>
        are exposed to client code.
      </p>

      <CodeBlock language="bash" title=".env Files">
{`# .env                  - loaded in all cases
# .env.local            - loaded in all cases, git-ignored
# .env.development      - loaded in dev mode
# .env.production       - loaded in production build

VITE_API_URL=https://api.example.com
VITE_FEATURE_FLAG=true

# NOT exposed to client (no VITE_ prefix)
DATABASE_URL=postgres://localhost:5432/mydb`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Using Env Variables">
{`// Access in your code
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;   // true in dev
const isProd = import.meta.env.PROD; // true in prod
const mode = import.meta.env.MODE;   // 'development' | 'production'

// TypeScript: create src/vite-env.d.ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FEATURE_FLAG: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Security: VITE_ Prefix">
        Everything with the VITE_ prefix is embedded in your client bundle and visible
        to anyone. Never put secrets, API keys with write access, or database credentials
        in VITE_ variables. Those belong on your backend only.
      </InfoBox>

      <h2>Path Aliases with TypeScript</h2>

      <CodeBlock language="json" title="tsconfig.json">
{`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"]
    }
  }
}`}
      </CodeBlock>

      <h2>Dev Server: Proxy, HTTPS, and HMR</h2>

      <CodeBlock language="javascript" title="Advanced Server Config">
{`import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  // HTTPS: server.https no longer accepts a boolean — it takes real
  // https.ServerOptions (key/cert). For a throwaway self-signed cert
  // in dev, use the plugin instead of hand-rolling one.
  plugins: [basicSsl()],

  server: {
    // Or supply your own certs explicitly:
    // https: { key: fs.readFileSync('./key.pem'),
    //          cert: fs.readFileSync('./cert.pem') },

    // Custom HMR settings
    hmr: {
      overlay: true,   // show error overlay
      port: 3001,      // separate HMR WebSocket port
    },

    // Watch options for network drives or containers
    watch: {
      usePolling: true,
      interval: 1000,
    },

    // Allow access from network (e.g., testing on phone)
    host: '0.0.0.0',
  },
})`}
      </CodeBlock>

      <h2>Build Optimization</h2>

      <CodeBlock language="javascript" title="Chunk Splitting Strategies">
{`build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        // Split vendor code by package
        if (id.includes('node_modules')) {
          if (id.includes('react')) return 'vendor-react';
          if (id.includes('@mui')) return 'vendor-mui';
          if (id.includes('lodash')) return 'vendor-lodash';
          return 'vendor'; // everything else
        }
      },
    },
  },
  // Warn if a chunk exceeds 500kB
  chunkSizeWarningLimit: 500,
  // CSS code splitting (per-chunk CSS files)
  cssCodeSplit: true,
}`}
      </CodeBlock>

      <h2>Preview Mode</h2>
      <p>
        After building, use <code>vite preview</code> to locally serve the production
        build. This catches issues that only appear in the built output.
      </p>

      <CodeBlock language="json" title="package.json Scripts">
{`{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4173",
    "lint": "eslint ."
  }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="No --ext Flag Anymore">
        Older tutorials show <code>eslint . --ext .ts,.tsx</code>. Flat config
        (<code>eslint.config.js</code>, the default since ESLint 9) removed
        <code> --ext</code> entirely — which files get linted is now decided by the
        <code> files</code>/<code>ignores</code> globs inside the config itself. Passing the flag
        is an error, not a no-op. See the ESLint lesson next for the full flat-config setup.
      </InfoBox>

      <h2>Vite + React + TypeScript Starter</h2>

      <CodeBlock language="bash" title="Scaffold a New Project">
{`# Create a new Vite + React + TypeScript project
npm create vite@latest my-app -- --template react-ts

cd my-app
npm install
npm run dev`}
      </CodeBlock>

      <InteractiveChallenge
        question={"In Vite, which prefix must environment variables have to be exposed to client-side code?"}
        options={[
          "REACT_APP_",
          "VITE_",
          "PUBLIC_",
          "NEXT_PUBLIC_"
        ]}
        correctIndex={1}
        explanation={"Vite uses the VITE_ prefix. REACT_APP_ was CRA's convention, PUBLIC_ is SvelteKit, and NEXT_PUBLIC_ is Next.js. Only VITE_ variables are statically replaced in client code at build time."}
      />

      <h2>Common Configuration Patterns</h2>

      <CodeBlock language="javascript" title="Conditional Config by Mode">
{`export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    // Dev-specific config
    return {
      plugins: [react()],
      server: { port: 3000 },
    };
  } else {
    // Build-specific config
    return {
      plugins: [react()],
      build: { sourcemap: mode !== 'production' },
    };
  }
})`}
      </CodeBlock>

      <InfoBox variant="tip" title="Speed Up Cold Starts">
        If your app has many dependencies, add them to <code>optimizeDeps.include</code> in
        your Vite config. This pre-bundles them on the first run so subsequent starts are
        instant. Vite caches the result in <code>node_modules/.vite</code>.
      </InfoBox>
    </LessonLayout>
  );
}
