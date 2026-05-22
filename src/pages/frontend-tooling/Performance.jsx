import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function FTPerformance() {
  return (
    <LessonLayout
      title="Bundle Performance"
      sectionId="frontend-tooling"
      lessonIndex={4}
      prev={{ path: '/frontend-tooling/monorepos', label: 'Monorepos' }}
      next={null}
    >
      <h2>Bundle Analysis</h2>
      <p>
        Understanding what is in your bundle is the first step to optimizing it. Large bundles hurt
        load times, especially on mobile networks. The goal: ship only what the current page needs.
      </p>

      <FlowChart
        title="Bundle Optimization Flow"
        chart={"graph TD\n  A[Analyze Bundle] --> B{Large chunks?}\n  B -- Yes --> C[Code Split]\n  C --> D[Lazy Load Routes]\n  B -- No --> E{Duplicate code?}\n  E -- Yes --> F[Tree Shake]\n  F --> G[Replace heavy deps]\n  E -- No --> H[Check third-party size]\n  H --> I[bundlephobia.com]"}
      />

      <CodeBlock language="bash" title="Bundle analysis tools">
{`# Vite — rollup-plugin-visualizer
npm install --save-dev rollup-plugin-visualizer

# In vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer'
plugins: [react(), visualizer({ open: true, gzipSize: true })]

# Run: npm run build — opens interactive treemap in browser

# Source map explorer (works with any bundler)
npm install --save-dev source-map-explorer
npx source-map-explorer dist/assets/*.js

# Bundle buddy (duplicate module detection)
npx bundle-buddy dist/assets/*.js

# Webpack Bundle Analyzer (for Webpack users)
npm install --save-dev webpack-bundle-analyzer`}
      </CodeBlock>

      <h2>Tree Shaking</h2>
      <p>
        Tree shaking eliminates unused exports from your bundle. It requires ES modules (import/export)
        and side-effect-free packages. CommonJS (require) cannot be tree-shaken.
      </p>

      <CodeBlock language="javascript" title="Tree shaking best practices">
{`// GOOD: Named imports allow tree shaking
import { debounce } from 'lodash-es'    // only debounce included
import { format } from 'date-fns'       // only format included

// BAD: Default import brings everything
import _ from 'lodash'                  // entire lodash included!
import moment from 'moment'             // 67kb! Use date-fns instead

// Package comparison (gzipped):
// lodash:     24kb  →  lodash-es: tree-shakeable
// moment.js:  67kb  →  date-fns:  2kb per function
// axios:      14kb  →  ky:        6kb (or native fetch)
// chart.js:   63kb  →  recharts: 45kb / use dynamic import

// Check if a package is side-effect free
// In package.json of the library:
{
  "sideEffects": false,        // entire package is tree-shakeable
  "sideEffects": ["*.css"]    // CSS files have side effects
}

// Your own code — mark as side-effect free
// package.json:
{ "sideEffects": false }`}
      </CodeBlock>

      <h2>Code Splitting</h2>

      <CodeBlock language="jsx" title="Dynamic imports and lazy loading">
{`import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Route-level splitting — most impactful
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  )
}

// Component-level splitting (heavy components)
const RichTextEditor = lazy(() => import('./components/RichTextEditor'))
const DataGrid = lazy(() => import('./components/DataGrid'))

// Prefetch on hover
function NavLink({ to, children }) {
  const handleMouseEnter = () => {
    // Prefetch the chunk before user navigates
    import('./pages/' + to)
  }
  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>{children}</Link>
  )
}`}
      </CodeBlock>

      <h2>Optimizing Third-Party Dependencies</h2>

      <CodeBlock language="bash" title="Auditing dependency size">
{`# Check package size before installing
# Visit bundlephobia.com/<package-name>

# Or use npx bundlesize
npx bundlesize

# Common replacements for heavy dependencies:
#
# moment.js (67kb) → date-fns (2kb/fn) or Day.js (2kb)
# lodash (24kb)    → lodash-es + named imports, or native JS
# axios (14kb)     → native fetch or ky (6kb)
# jQuery (32kb)    → vanilla JS
# chart.js (63kb)  → recharts with lazy loading
# antd (1.2mb)     → import specific components, use tree shaking

# Check for duplicate packages
npx npm-dedupe
pnpm dedupe`}
      </CodeBlock>

      <h2>Vite Production Optimizations</h2>

      <CodeBlock language="typescript" title="Production build tuning">
{`// vite.config.ts
export default defineConfig({
  build: {
    // Target modern browsers — smaller output (no polyfills)
    target: 'es2020',

    // Terser for aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,     // remove console.log in prod
        drop_debugger: true,    // remove debugger statements
        pure_funcs: ['console.info', 'console.debug'],
      },
    },

    // Control chunk splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React ecosystem in one vendor chunk
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // Router in separate chunk
            if (id.includes('react-router')) return 'router'
            // Everything else split by package name
            return id.toString().split('node_modules/')[1].split('/')[0].toString()
          }
        },
      },
    },

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Asset inlining threshold (files smaller than this are inlined as base64)
    assetsInlineLimit: 4096,   // 4kb default
  },
})`}
      </CodeBlock>

      <h2>Performance Metrics to Track</h2>

      <CodeBlock language="bash" title="Core Web Vitals and bundle budgets">
{`# Core Web Vitals targets (2024)
# LCP (Largest Contentful Paint): < 2.5s
# FID (First Input Delay): < 100ms (replaced by INP)
# CLS (Cumulative Layout Shift): < 0.1
# INP (Interaction to Next Paint): < 200ms
# TTFB (Time to First Byte): < 800ms

# Bundle size budgets (typical targets)
# Total JS (gzipped): < 200kb for initial load
# Largest single chunk: < 100kb gzipped
# CSS: < 30kb gzipped

# bundlesize config (package.json)
{
  "bundlesize": [
    { "path": "dist/assets/*.js", "maxSize": "200 kB" },
    { "path": "dist/assets/*.css", "maxSize": "30 kB" }
  ]
}`}
      </CodeBlock>

      <h2>Image and Asset Optimization</h2>

      <CodeBlock language="typescript" title="Vite image optimization">
{`// Install vite-imagetools for transform pipeline
npm install vite-imagetools

// vite.config.ts
import { imagetools } from 'vite-imagetools'
plugins: [react(), imagetools()]

// Usage — query params for transforms
import hero from './hero.jpg?w=800&format=webp&quality=80'
// Generates: /assets/hero-800w.abc123.webp

// For SVGs as React components
import Logo from './logo.svg?react'

// Preload critical images
// In HTML head:
<link rel="preload" as="image" href="/hero.webp" />

// Lazy load non-critical images (native)
<img src="..." loading="lazy" decoding="async" />

// Use modern formats
// WebP: 25-34% smaller than JPEG
// AVIF: 50% smaller than JPEG (less browser support)
// Use <picture> for fallbacks:
<picture>
  <source type="image/avif" srcset="hero.avif" />
  <source type="image/webp" srcset="hero.webp" />
  <img src="hero.jpg" alt="Hero" />
</picture>`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Biggest Win">
        <p>
          The single biggest bundle performance win is almost always <strong>route-based code splitting</strong>.
          Splitting by route means users download only the JS needed for the page they are viewing.
          A 500kb bundle split into 10 routes = ~50kb per route = dramatically better LCP.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Why can CommonJS modules (require) not be tree-shaken, but ES modules (import/export) can?"
        options={[
          "CommonJS is older and not supported by modern bundlers",
          "ES modules have static imports/exports analyzable at build time; CommonJS is dynamic",
          "CommonJS uses synchronous loading which prevents analysis",
          "Bundlers only support tree shaking for TypeScript files"
        ]}
        correctIndex={1}
        explanation="ES module imports/exports are static — they must appear at the top level and cannot be inside conditionals. This allows bundlers to build a complete dependency graph at build time and determine exactly which exports are used. CommonJS require() is dynamic — it can appear anywhere, accept variables, or be conditionally called — making static analysis impossible. This is why lodash-es (ESM) can be tree-shaken but lodash (CJS) cannot."
      />

      <InteractiveChallenge
        question="What is the recommended first optimization step when your bundle is too large?"
        options={[
          "Replace all dependencies with lighter alternatives",
          "Enable gzip compression on the server",
          "Analyze the bundle with visualizer to identify the largest contributors",
          "Split all components into separate lazy-loaded files"
        ]}
        correctIndex={2}
        explanation="Always measure before optimizing. Bundle analysis (rollup-plugin-visualizer, source-map-explorer) shows you exactly what is in your bundle and how large each module is. Without this, you might optimize the wrong thing. After analysis, the most impactful steps are typically: route-based code splitting, replacing heavy third-party libraries, and ensuring tree shaking is working."
      />
    </LessonLayout>
  );
}
