import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function WpAdvanced() {
  return (
    <LessonLayout
      title="Advanced Webpack"
      sectionId="webpack"
      lessonIndex={5}
      prev={{ path: '/webpack/devserver', label: 'Dev Server & HMR' }}
      next={null}
    >
      <h2>Module Federation</h2>
      <p>
        Module Federation (Webpack 5) allows separately deployed applications to share JavaScript
        modules at runtime. This is the foundation of micro-frontend architectures.
      </p>

      <FlowChart
        title="Module Federation Architecture"
        chart={"graph LR\n  A[Shell App - host] --> B[Loads at runtime]\n  B --> C[Header MFE - remote]\n  B --> D[Dashboard MFE - remote]\n  B --> E[Profile MFE - remote]\n  C --> F[Shared: react@18]\n  D --> F\n  E --> F"}
      />

      <CodeBlock language="javascript" title="Module Federation — Host app">
{`// shell/webpack.config.js (host/consumer)
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        // key: how you import it
        // value: remoteName@URL/remoteEntry.js
        header: 'header@http://localhost:3001/remoteEntry.js',
        dashboard: 'dashboard@http://localhost:3002/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
      },
    }),
  ],
}

// In shell app code:
const HeaderApp = React.lazy(() => import('header/HeaderApp'))

function Shell() {
  return (
    <Suspense fallback={<div>Loading header...</div>}>
      <HeaderApp />
    </Suspense>
  )
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Module Federation — Remote app">
{`// header/webpack.config.js (remote/provider)
new ModuleFederationPlugin({
  name: 'header',
  filename: 'remoteEntry.js',        // the manifest file
  exposes: {
    './HeaderApp': './src/HeaderApp', // what to share
    './useAuth': './src/hooks/useAuth',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
})`}
      </CodeBlock>

      <h2>Code Splitting with Dynamic Imports</h2>

      <CodeBlock language="javascript" title="Dynamic imports and chunk naming">
{`// React.lazy for component code splitting
const AdminPanel = React.lazy(() =>
  import(/* webpackChunkName: "admin" */ './AdminPanel')
)

// Named chunk groups for related code
const charts = () => import(
  /* webpackChunkName: "charts" */
  /* webpackPrefetch: true */         // prefetch in browser idle time
  './charts/ChartModule'
)

// Prefetch vs preload:
// webpackPrefetch: true → browser fetches when idle (future navigation)
// webpackPreload: true  → browser fetches immediately (current nav)

// Programmatic lazy loading
button.addEventListener('click', async () => {
  const { heavyFunction } = await import('./heavy-module')
  heavyFunction()
})`}
      </CodeBlock>

      <h2>Persistent Caching</h2>

      <CodeBlock language="javascript" title="Webpack 5 persistent cache">
{`module.exports = {
  cache: {
    type: 'filesystem',               // persist to disk (.webpack-cache/)
    buildDependencies: {
      config: [__filename],           // invalidate when webpack.config.js changes
    },
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    version: '1.0',                   // increment to invalidate all caches
    store: 'pack',                    // pack files into archives (faster I/O)
  },
}

// Benefits:
// - First build: normal time
// - Subsequent builds: 2-10x faster (reads from cache)
// - Cache is git-ignored but can be committed for CI (advanced)

// CI: cache the .webpack-cache directory between runs
// GitHub Actions:
// - uses: actions/cache@v3
//   with:
//     path: .webpack-cache
//     key: \${{ hashFiles('**/package-lock.json') }}`}
      </CodeBlock>

      <h2>Webpack to Vite Migration</h2>

      <CodeBlock language="javascript" title="Migration guide">
{`// Step 1: Install Vite
npm install --save-dev vite @vitejs/plugin-react

// Step 2: Add vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })

// Step 3: Move index.html to root (not public/)
// And change: <script src="%PUBLIC_URL%/index.js">
//        to:  <script type="module" src="/src/main.tsx">

// Step 4: Update env variables
// Webpack: process.env.REACT_APP_API_URL
// Vite:    import.meta.env.VITE_API_URL

// Step 5: Update imports
// Webpack asset imports: import logo from './logo.png'  ← same
// SVG as component: import { ReactComponent as Logo } from './logo.svg'
//             → in Vite: import Logo from './logo.svg?react'

// Step 6: package.json scripts
// "start": "vite"
// "build": "tsc && vite build"

// Step 7: Handle Webpack-specific features
// Loaders → Vite plugins (most have equivalents)
// require.context → import.meta.glob
// webpack-specific comments → removed or replaced`}
      </CodeBlock>

      <h2>Performance Optimization</h2>

      <CodeBlock language="javascript" title="Speeding up Webpack builds">
{`module.exports = {
  // 1. Persistent cache (biggest win)
  cache: { type: 'filesystem' },

  // 2. Limit module resolution scope
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    symlinks: false,   // disable if not using pnpm/yarn link
  },

  module: {
    rules: [
      {
        test: /\\.[jt]sx?$/,
        // 3. Exclude node_modules from babel/ts transforms
        exclude: /node_modules/,
        // 4. Use swc-loader instead of babel-loader (10x faster)
        use: 'swc-loader',
      },
      {
        // 5. Use babel-loader cache
        loader: 'babel-loader',
        options: { cacheDirectory: true },
      },
    ],
  },

  // 6. Parallel builds with thread-loader (for heavy projects)
  // npm install --save-dev thread-loader
  module: {
    rules: [{
      test: /\\.tsx?$/,
      use: ['thread-loader', 'ts-loader'],
    }],
  },
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Webpack 5 Compatibility Shims">
        <p>
          Webpack 5 removed Node.js core module polyfills (buffer, crypto, stream, etc.) that Webpack 4
          auto-included. If you migrate to Webpack 5 and get errors like "Module not found: 'buffer'",
          you need to explicitly add the polyfills or use resolve.fallback:
          <code>resolve: {'{ fallback: { buffer: require.resolve("buffer/") } }'}</code>
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What does 'singleton: true' mean in Module Federation's shared config?"
        options={[
          "Only one instance of the module will be downloaded across all remotes",
          "The shared module uses only the first loaded version, even if remotes require different versions",
          "The module is only shared if exactly one remote requests it",
          "The module version is locked to the exact version specified"
        ]}
        correctIndex={1}
        explanation="singleton: true ensures that only one instance of a package (e.g., React) runs in the application, even though it's shared between the host and multiple remotes. React specifically requires singleton mode because multiple React instances break hooks (they rely on a single internal state). Without singleton, each remote might load its own copy of React, causing context and hook errors."
      />

      <InteractiveChallenge
        question="What is the difference between webpackPrefetch and webpackPreload for dynamic imports?"
        options={[
          "Prefetch loads chunks immediately; preload loads them when needed",
          "Prefetch fetches in browser idle time for future navigations; preload fetches immediately for current navigation",
          "They are identical — both prefetch resources for future use",
          "Prefetch is for images; preload is for JavaScript chunks"
        ]}
        correctIndex={1}
        explanation="webpackPrefetch adds a <link rel='prefetch'> to the HTML — the browser fetches the chunk during idle time, anticipating future navigation. Use for: chunks needed in a likely-next step. webpackPreload adds <link rel='preload'> — the browser fetches the chunk immediately, in parallel with the current bundle, with high priority. Use for: chunks needed very soon on the current page. Misusing preload can hurt performance by competing with critical resources."
      />
    </LessonLayout>
  );
}
