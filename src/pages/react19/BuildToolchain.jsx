import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function BuildToolchain() {
  return (
    <LessonLayout
      title="Build Toolchain"
      sectionId="react19"
      lessonIndex={11}
      prev={{ path: '/react19/typescript', label: 'React with TypeScript' }}
      next={{ path: '/react19/cheat-sheet', label: 'React 19 Cheat Sheet' }}
    >
      <h2>Modern React Build Toolchain</h2>
      <p>
        Understanding the build toolchain helps you optimize bundle size, debugging experience, and deployment
        workflows. Modern React apps use Vite, esbuild, or SWC under the hood for ultra-fast builds.
      </p>

      <FlowChart
        title="Vite Build Pipeline"
        chart={"graph LR\n  A[Source Files .jsx .ts .css] --> B[Vite Dev Server]\n  B --> C[esbuild Transform]\n  C --> D[Hot Module Replacement]\n  D --> E[Browser]\n  A --> F[npm run build]\n  F --> G[Rollup Bundler]\n  G --> H[Tree Shaking]\n  H --> I[Minification]\n  I --> J[dist/ folder]"}
      />

      <h2>Vite vs Create React App</h2>
      <p>
        Vite replaced CRA as the go-to scaffolding tool due to drastically faster cold starts and HMR.
        While CRA uses webpack with babel, Vite uses native ES modules in dev and Rollup in production.
      </p>

      <CodeBlock language="bash" title="Scaffolding with Vite">
{`# Create a new React + TypeScript project
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev

# Available templates:
# react           - React + JavaScript
# react-ts        - React + TypeScript
# react-swc       - React + SWC (faster transforms)
# react-swc-ts    - React + SWC + TypeScript`}
      </CodeBlock>

      <h2>vite.config.ts Deep Dive</h2>

      <CodeBlock language="typescript" title="vite.config.ts">
{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      // Use babel by default for JSX transform
      // Switch to SWC for faster transforms:
      // fastRefresh: true
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,          // Generate source maps for debugging
    minify: 'esbuild',        // Use esbuild for minification (fastest)
    rollupOptions: {
      output: {
        // Manual code splitting
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Warn if chunk > 1MB
  },

  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  preview: {
    port: 4173,
  },
})`}
      </CodeBlock>

      <h2>esbuild vs SWC vs Babel</h2>
      <p>
        These are the three JavaScript transform tools used in modern React toolchains. Each trades features
        for speed differently.
      </p>

      <CodeBlock language="javascript" title="Transform tool comparison">
{`// esbuild (Go-based, fastest)
// - 10-100x faster than babel
// - No plugin ecosystem for transforms
// - Used by Vite for development transforms
// - Limited TypeScript type-checking (transpile-only)

// SWC (Rust-based, very fast)
// - 20x faster than babel
// - Better plugin support than esbuild
// - Used by Next.js, Parcel
// - Supports decorators, more babel plugins
// npm create vite@latest -- --template react-swc-ts

// Babel (JS-based, most flexible)
// - Slowest, but most plugin ecosystem
// - Required for certain transforms (class decorators stage 2)
// - Used in CRA, older setups

// @vitejs/plugin-react uses babel by default
// @vitejs/plugin-react-swc uses SWC for faster HMR`}
      </CodeBlock>

      <InfoBox variant="tip" title="Choosing Your Transformer">
        <p>
          Use SWC (<code>@vitejs/plugin-react-swc</code>) for most new projects — it is nearly as fast as esbuild
          but supports more transforms. Only use Babel if you need stage-2 decorators or custom babel plugins.
        </p>
      </InfoBox>

      <h2>Hot Module Replacement (HMR) Mechanics</h2>
      <p>
        HMR lets you update modules in the browser without a full page reload. React Fast Refresh extends HMR
        to preserve component state across edits.
      </p>

      <FlowChart
        title="HMR Flow"
        chart={"graph TD\n  A[File Change Detected] --> B[Vite Dev Server]\n  B --> C[Module Invalidated]\n  C --> D{Has HMR Handler?}\n  D -- Yes --> E[React Fast Refresh]\n  E --> F[Patch Component in Place]\n  F --> G[State Preserved]\n  D -- No --> H[Full Page Reload]"}
      />

      <CodeBlock language="javascript" title="HMR API (manual usage)">
{`// Accept HMR updates for a module
if (import.meta.hot) {
  import.meta.hot.accept('./module.js', (newModule) => {
    // Called when module or its deps update
    updateWithNewModule(newModule)
  })

  // Dispose cleanup
  import.meta.hot.dispose((data) => {
    // Clean up side effects before module replaced
    clearInterval(data.timer)
  })
}

// React Fast Refresh does this automatically for components
// Rules for Fast Refresh to work:
// 1. File only exports React components
// 2. No anonymous default exports
// 3. No mixed component + non-component exports`}
      </CodeBlock>

      <h2>Code Splitting Strategies</h2>

      <CodeBlock language="jsx" title="Route-based code splitting">
{`import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Lazy load route components — each becomes a separate chunk
const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  )
}

// Component-level splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'))

function Dashboard() {
  const [showChart, setShowChart] = useState(false)
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Load Chart</button>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  )
}`}
      </CodeBlock>

      <h2>Bundle Analysis</h2>

      <CodeBlock language="bash" title="Analyzing your bundle">
{`# Install rollup-plugin-visualizer
npm install -D rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,           // Open in browser after build
      gzipSize: true,       // Show gzip sizes
      filename: 'stats.html',
    }),
  ],
})

# Run the build
npm run build
# Opens stats.html with interactive treemap

# Alternative: use vite-bundle-analyzer
npx vite-bundle-analyzer`}
      </CodeBlock>

      <h2>Environment Variables</h2>

      <CodeBlock language="bash" title=".env files">
{`# .env                  - loaded in all cases
# .env.local            - loaded in all, gitignored
# .env.development      - loaded in dev
# .env.production       - loaded in prod

# Variables MUST start with VITE_ to be exposed to client
VITE_API_URL=https://api.example.com
VITE_STRIPE_KEY=pk_live_...

# Access in code
const apiUrl = import.meta.env.VITE_API_URL
const isDev  = import.meta.env.DEV
const isProd = import.meta.env.PROD
const mode   = import.meta.env.MODE  // "development" | "production"

# Type safety — add to vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_STRIPE_KEY: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}`}
      </CodeBlock>

      <h2>Dev vs Production Build Pipeline</h2>

      <FlowChart
        title="Development vs Production"
        chart={"graph TD\n  A[Source Code] --> B{Mode?}\n  B -- Development --> C[Vite Dev Server]\n  C --> D[Native ESM Modules]\n  D --> E[No Bundling]\n  E --> F[Fast HMR]\n  B -- Production --> G[Rollup Bundle]\n  G --> H[Tree Shaking]\n  H --> I[Minify + Compress]\n  I --> J[Code Splitting]\n  J --> K[dist/ Output]"}
      />

      <CodeBlock language="json" title="package.json scripts">
{`{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "build:analyze": "vite build && vite-bundle-analyzer",
    "build:staging": "vite build --mode staging",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="TypeScript Type Checking">
        <p>
          Vite and esbuild perform transpile-only TypeScript — they strip types but do not check them.
          Always run <code>tsc --noEmit</code> (or <code>tsc && vite build</code>) in CI to catch type errors.
        </p>
      </InfoBox>

      <h2>Optimizing the Production Build</h2>

      <CodeBlock language="typescript" title="Advanced Rollup options">
{`import { defineConfig, splitVendorChunkPlugin } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(), // Auto-split vendor into separate chunk
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put react ecosystem in vendor chunk
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          // Put router in own chunk
          if (id.includes('node_modules/react-router')) {
            return 'router'
          }
          // Large UI libraries get their own chunk
          if (id.includes('node_modules/@mui') ||
              id.includes('node_modules/antd')) {
            return 'ui-lib'
          }
        },
      },
    },
    // Target modern browsers for smaller output
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
})`}
      </CodeBlock>

      <InteractiveChallenge
        question="In a Vite project, which prefix must environment variables have to be accessible in client-side code?"
        options={["REACT_APP_", "VITE_", "PUBLIC_", "CLIENT_"]}
        correctIndex={1}
        explanation={"Vite requires the VITE_ prefix for environment variables to be exposed to client code via import.meta.env. Variables without this prefix are only available server-side (in vite.config.ts). This is a security measure to prevent accidentally leaking secrets."}
      />

      <InteractiveChallenge
        question="What does React Fast Refresh do that standard HMR does not?"
        options={[
          "Bundles faster using Rust",
          "Preserves component state when editing a component",
          "Splits code into smaller chunks automatically",
          "Converts CommonJS to ESM on the fly"
        ]}
        correctIndex={1}
        explanation="React Fast Refresh is an enhanced HMR implementation that patches React components in-place while preserving their local state. Standard HMR would reload the module and lose state. Fast Refresh requires components to be the only exports from a file to work correctly."
      />

      <InfoBox variant="note" title="Vite 5+ and Rolldown">
        <p>
          Vite 6+ is transitioning to Rolldown (a Rust-based Rollup replacement) for production builds.
          Rolldown offers 10x+ faster builds while maintaining Rollup plugin compatibility.
          The <code>@rolldown/binding-*</code> native addons are the platform-specific binaries.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
