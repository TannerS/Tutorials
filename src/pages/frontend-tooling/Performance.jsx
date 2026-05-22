import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Performance() {
  return (
    <LessonLayout
      title="Bundle Analysis & Performance"
      sectionId="frontend-tooling"
      lessonIndex={4}
      prev={{ path: '/frontend-tooling/monorepos', label: 'Monorepo Strategies' }}
      next={null}
    >
      <h2>Why Performance Is a Feature</h2>
      <p>
        A 100ms delay in load time drops conversion by 7%. Performance isn't a
        nice-to-have — it's a business requirement. Google uses Core Web Vitals
        as a ranking signal. Your users on 3G connections in rural areas will
        thank you for every kilobyte you shave.
      </p>

      <h2>Bundle Analysis Tools</h2>
      <p>
        Before optimizing, measure. These tools visualize what's actually in your
        production bundle so you can find the biggest offenders.
      </p>

      <CodeBlock language="bash" title="Install Analysis Tools">
{`# For Vite projects
npm install -D rollup-plugin-visualizer

# For any project with source maps
npm install -D source-map-explorer

# Analyze without installing
npx vite-bundle-visualizer`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Add Visualizer to Vite">
{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,           // auto-open in browser
      gzipSize: true,       // show gzipped sizes
      brotliSize: true,     // show brotli sizes
      filename: 'stats.html',
    }),
  ],
});

// Run: npm run build
// Opens interactive treemap showing every module's size`}
      </CodeBlock>

      <CodeBlock language="bash" title="Source Map Explorer">
{`# Build with source maps
npm run build

# Analyze the output
npx source-map-explorer dist/assets/index-*.js

# Multi-file analysis
npx source-map-explorer dist/assets/*.js --html result.html`}
      </CodeBlock>

      <InfoBox variant="tip" title="Check Before You Ship">
        Run bundle analysis on every significant dependency change. A single bad
        import (<code>import _ from 'lodash'</code> instead of
        <code>import get from 'lodash/get'</code>) can add 70kB to your bundle.
        Make it part of your PR review checklist.
      </InfoBox>

      <h2>Core Web Vitals</h2>
      <p>
        Google's three metrics that matter most for user experience. These are
        measured on real user devices via the Chrome User Experience Report (CrUX).
      </p>

      <FlowChart
        title="Core Web Vitals"
        chart={"graph TD\n  A[Core Web Vitals] --> B[LCP]\n  A --> C[INP]\n  A --> D[CLS]\n  B --> E[Largest Contentful Paint]\n  E --> F[< 2.5s = Good]\n  C --> G[Interaction to Next Paint]\n  G --> H[< 200ms = Good]\n  D --> I[Cumulative Layout Shift]\n  I --> J[< 0.1 = Good]"}
      />

      <h3>LCP — Largest Contentful Paint</h3>
      <p>
        Measures when the largest visible element (hero image, heading, video) finishes
        rendering. Optimize by: preloading critical assets, using responsive images,
        removing render-blocking resources, and server-side rendering above-the-fold content.
      </p>

      <h3>INP — Interaction to Next Paint</h3>
      <p>
        Replaced FID (First Input Delay) in 2024. Measures the worst-case delay between
        user input and visual response across the entire session. Optimize by: breaking
        up long tasks, using <code>startTransition</code>, deferring non-critical work,
        and keeping event handlers fast.
      </p>

      <h3>CLS — Cumulative Layout Shift</h3>
      <p>
        Measures unexpected layout movement. Caused by: images without dimensions,
        late-loading fonts, dynamically injected content. Fix by: always setting width
        and height on images, using font-display: swap with preload, and reserving
        space for async content.
      </p>

      <h2>Lighthouse Audit</h2>

      <CodeBlock language="bash" title="Run Lighthouse from CLI">
{`# Install globally
npm install -g lighthouse

# Run a full audit
lighthouse https://myapp.com --output html --output-path report.html

# Performance-only audit
lighthouse https://myapp.com --only-categories=performance

# Run in CI with budget
lighthouse https://myapp.com --budget-path=budget.json

# Use Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Select "Performance" category
# 4. Click "Analyze page load"`}
      </CodeBlock>

      <h2>Code Splitting Strategies</h2>
      <p>
        Don't ship your entire app in one bundle. Split code so users only download
        what they need for the current page.
      </p>

      <CodeBlock language="javascript" title="Route-Based Code Splitting">
{`import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Each route loads its own chunk
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Component-Level Splitting">
{`// Heavy component loaded on demand
const HeavyChart = lazy(() => import('./components/HeavyChart'));
const PdfViewer = lazy(() => import('./components/PdfViewer'));

function ReportPage() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart data={reportData} />
        </Suspense>
      )}
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Named Exports Break Lazy">
        <code>React.lazy</code> only works with default exports. If a module uses named
        exports, create an intermediate file that re-exports as default, or use the
        inline pattern: <code>{'lazy(() => import("./Foo").then(m => ({ default: m.Foo })))'}</code>
      </InfoBox>

      <h2>Tree Shaking</h2>
      <p>
        Tree shaking removes unused code from your bundle. It works by analyzing ES
        module <code>import</code>/<code>export</code> statements at build time. For
        it to work, your code and dependencies must use ESM — CommonJS <code>require</code>
        cannot be statically analyzed.
      </p>

      <CodeBlock language="javascript" title="Tree Shaking: What Works and What Breaks">
{`// GOOD - tree-shakeable (named imports from ESM)
import { debounce } from 'lodash-es';
import { Button } from '@mui/material';

// BAD - imports everything (CommonJS or barrel files)
import _ from 'lodash';         // 70kB — entire library
import * as utils from './utils'; // no tree shaking

// BAD - side effects prevent tree shaking
import './analytics';  // side effect import — always included

// Mark your package as side-effect free in package.json
// "sideEffects": false
// Or list files with side effects:
// "sideEffects": ["*.css", "./src/polyfills.ts"]`}
      </CodeBlock>

      <h2>Image Optimization</h2>

      <CodeBlock language="javascript" title="Modern Image Practices">
{`// 1. Use next-gen formats (WebP, AVIF)
<picture>
  <source srcSet="/hero.avif" type="image/avif" />
  <source srcSet="/hero.webp" type="image/webp" />
  <img src="/hero.jpg" alt="Hero" width={1200} height={600} />
</picture>

// 2. Lazy load images below the fold
<img src="/photo.webp" alt="Product" loading="lazy" />

// 3. Responsive images with srcSet
<img
  srcSet="/photo-400.webp 400w, /photo-800.webp 800w, /photo-1200.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1024px) 800px, 1200px"
  src="/photo-800.webp"
  alt="Product"
/>

// 4. Always set width and height to prevent CLS
<img src="/logo.svg" alt="Logo" width={120} height={40} />`}
      </CodeBlock>

      <h2>Font Loading Strategies</h2>

      <CodeBlock language="javascript" title="Optimal Font Loading">
{`/* 1. Preload the critical font in HTML head */
<link rel="preload" href="/fonts/inter-var.woff2"
  as="font" type="font/woff2" crossOrigin="anonymous" />

/* 2. Use font-display: swap to prevent invisible text */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-display: swap;
  font-weight: 100 900;
}

/* 3. Match fallback metrics to reduce CLS */
@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  ascent-override: 90%;
  size-adjust: 107%;
}`}
      </CodeBlock>

      <h2>Resource Hints</h2>

      <CodeBlock language="javascript" title="Preload, Prefetch, and Preconnect">
{`<!-- Preload: Critical resource needed NOW -->
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/hero.webp" as="image" />

<!-- Prefetch: Resource needed SOON (next navigation) -->
<link rel="prefetch" href="/next-page-chunk.js" />

<!-- Preconnect: Early connection to 3rd party origin -->
<link rel="preconnect" href="https://api.example.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />

<!-- DNS Prefetch: Lighter alternative to preconnect -->
<link rel="dns-prefetch" href="https://analytics.example.com" />`}
      </CodeBlock>

      <InfoBox variant="info" title="Don't Over-Preload">
        Every preload hint competes for bandwidth. Only preload resources that are
        critical for the initial viewport — hero images, web fonts, and critical CSS.
        For everything else, let the browser's natural prioritization work. Too many
        preload hints actually slow things down.
      </InfoBox>

      <h2>React Render Performance</h2>

      <CodeBlock language="javascript" title="Measuring and Optimizing Renders">
{`import { Profiler, memo, useMemo, useCallback } from 'react';

// 1. React Profiler — measure what's slow
function onRenderCallback(id, phase, actualDuration) {
  console.log({ id, phase, actualDuration });
}

<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>

// 2. React.memo — skip re-renders when props haven't changed
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(item => <ListItem key={item.id} {...item} />);
});

// 3. useMemo — cache expensive computations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// 4. useCallback — stable function references for child components
const handleClick = useCallback((id) => {
  setSelected(id);
}, []);`}
      </CodeBlock>

      <h2>Performance Budgets</h2>

      <CodeBlock language="json" title="budget.json (for Lighthouse CI)">
{`[
  {
    "path": "/*",
    "timings": [
      { "metric": "interactive", "budget": 3000 },
      { "metric": "first-contentful-paint", "budget": 1500 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "total", "budget": 500 }
    ],
    "resourceCounts": [
      { "resourceType": "third-party", "budget": 10 }
    ]
  }
]`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Vite Chunk Size Warning">
{`// vite.config.ts
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 250, // warn if chunk > 250kB
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});`}
      </CodeBlock>

      <h2>why-did-you-render</h2>
      <p>
        A development tool that patches React to log unnecessary re-renders. Add it
        once and it tells you exactly which components re-render when they shouldn't.
      </p>

      <CodeBlock language="javascript" title="Setup why-did-you-render">
{`// src/wdyr.ts — import BEFORE React
import React from 'react';

if (import.meta.env.DEV) {
  const { default: whyDidYouRender } = await import(
    '@welldone-software/why-did-you-render'
  );
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    logOnDifferentValues: true,
  });
}

// Then in main.tsx, import wdyr first:
// import './wdyr';
// import React from 'react';
// ...`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Which Core Web Vital replaced First Input Delay (FID) in 2024?"}
        options={[
          "Largest Contentful Paint (LCP)",
          "Time to First Byte (TTFB)",
          "Interaction to Next Paint (INP)",
          "Cumulative Layout Shift (CLS)"
        ]}
        correctIndex={2}
        explanation={"INP (Interaction to Next Paint) replaced FID in March 2024 as an official Core Web Vital. While FID only measured the first interaction's delay, INP measures responsiveness across ALL interactions during the entire page session, giving a much more accurate picture of real-world interactivity."}
      />

      <InfoBox variant="note" title="Performance Is Iterative">
        Don't try to optimize everything at once. Use Lighthouse and bundle analysis to
        identify the biggest wins, fix those first, measure again. The 80/20 rule
        applies: 80% of your performance gains come from 20% of the optimizations.
        Ship fast, then make it faster.
      </InfoBox>
    </LessonLayout>
  );
}
