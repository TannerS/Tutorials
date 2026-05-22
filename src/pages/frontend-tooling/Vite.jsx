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
      next={{ path: '/frontend-tooling/linting', label: 'ESLint & Prettier' }}
    >
      <h2>Why Vite?</h2>
      <p>
        If you've used Create React App or Webpack, you've felt the pain: slow cold starts,
        sluggish HMR, and config files that rival War and Peace. Vite (French for "fast")
        was created by Evan You to solve these problems by leveraging native ES modules
        during development and Rollup for production builds.
      </p>

      <InfoBox variant="info" title="CRA Is Dead">
        Create React App is no longer maintained. The React team officially recommends
        framework-based setups (Next.js, Remix) or Vite for vanilla SPA projects.
        If your new team is still on CRA, migrating to Vite is usually straightforward.
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

      <h3>Development: Native ESM + esbuild</h3>
      <p>
        In dev mode, Vite pre-bundles dependencies (node_modules) with esbuild for speed,
        then serves your source code as native ES modules. The browser's import system
        requests files individually, and Vite transforms them on the fly.
      </p>

      <FlowChart
        title="Vite Dev Server Architecture"
        chart={"graph TD\n  A[Browser Request] --> B[Vite Dev Server]\n  B --> C{File Type?}\n  C -->|node_modules| D[Pre-bundled with esbuild]\n  C -->|.tsx/.jsx| E[Transform with esbuild]\n  C -->|.css| F[Inject as JS module]\n  C -->|.svg| G[Transform via Plugin]\n  D --> H[Serve to Browser]\n  E --> H\n  F --> H\n  G --> H"}
      />

      <h3>Production: Rollup (or Rolldown)</h3>
      <p>
        For production, Vite uses Rollup to create optimized bundles with tree-shaking,
        code splitting, and asset hashing. The Vite team is also building Rolldown — a
        Rust-based bundler that will eventually replace both esbuild and Rollup in Vite.
      </p>

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
          router: ['react-router-dom'],
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
{`export default defineConfig({
  server: {
    // HTTPS with self-signed cert (install @vitejs/plugin-basic-ssl)
    https: true,

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
    "build": "tsc && vite build",
    "preview": "vite preview --port 4173",
    "lint": "eslint . --ext .ts,.tsx"
  }
}`}
      </CodeBlock>

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
