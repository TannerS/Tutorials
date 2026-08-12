import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Advanced() {
  return (
    <LessonLayout
      title="Advanced Config & Migration"
      sectionId="webpack"
      lessonIndex={5}
      prev={{ path: '/webpack/devserver', label: 'Dev Server & HMR' }}
      next={null}
    >
      {/* ── MODULE FEDERATION ────────────────────────────── */}
      <h2>Module Federation (Webpack 5)</h2>
      <p>
        Module Federation is Webpack 5's flagship feature. It lets independently built and
        deployed applications share code at <em>runtime</em> &mdash; no npm packages, no
        monorepo required. This is the foundation of micro-frontend architectures.
      </p>

      <FlowChart
        title="Module Federation: Host Loading Remote Modules"
        chart={"graph TD\n  A[Host App - Shell] --> B[Remote App A]\n  A --> C[Remote App B]\n  B --> D[Exposes: Header, Nav]\n  C --> E[Exposes: Dashboard, Charts]\n  A --> F[Shared: React, React-DOM]\n  B --> F\n  C --> F"}
      />

      <h3>Key Concepts</h3>
      <ul>
        <li><strong>Host</strong> &mdash; the app that consumes remote modules (typically the shell/layout)</li>
        <li><strong>Remote</strong> &mdash; an app that exposes modules for others to consume</li>
        <li><strong>Shared</strong> &mdash; dependencies shared between host and remotes (e.g., React) to avoid duplication</li>
        <li><strong>Exposes</strong> &mdash; which modules a remote makes available</li>
      </ul>

      <CodeBlock language="javascript" title="Remote App Config (team-dashboard)">{`// webpack.config.js for the Dashboard micro-frontend
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  output: {
    publicPath: 'http://localhost:3002/',
  },
  plugins: [
    new ModuleFederationPlugin({
      // Unique name for this remote
      name: 'dashboard',

      // File that exposes the remote entry point
      filename: 'remoteEntry.js',

      // Modules this remote exposes to consumers
      exposes: {
        './DashboardApp': './src/DashboardApp',
        './Charts': './src/components/Charts',
      },

      // Shared dependencies — loaded once, shared across apps
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
      },
    }),
  ],
};`}</CodeBlock>

      <CodeBlock language="javascript" title="Host App Config (shell)">{`// webpack.config.js for the Host/Shell application
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',

      // Declare which remotes to consume
      remotes: {
        // name: 'remoteName@URL/remoteEntry.js'
        dashboard: 'dashboard@http://localhost:3002/remoteEntry.js',
        auth: 'auth@http://localhost:3003/remoteEntry.js',
      },

      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
      },
    }),
  ],
};`}</CodeBlock>

      <CodeBlock language="javascript" title="Using Remote Modules in the Host">{`import { lazy, Suspense } from 'react';

// Import components from remote apps — loaded at runtime!
const DashboardApp = lazy(() => import('dashboard/DashboardApp'));
const Charts = lazy(() => import('dashboard/Charts'));

function App() {
  return (
    <div>
      <h1>Shell Application</h1>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardApp />
        <Charts />
      </Suspense>
    </div>
  );
}`}</CodeBlock>

      <InfoBox variant="info" title="Module Federation in Practice">
        Module Federation is used by companies like Walmart, SAP, and Lululemon for
        micro-frontend architectures. Each team owns and deploys their micro-frontend
        independently, and the shell app loads them at runtime.
      </InfoBox>

      {/* ── PERFORMANCE OPTIMIZATION ─────────────────────── */}
      <h2>Performance Optimization</h2>

      <h3>Filesystem Cache (Game Changer)</h3>
      <p>
        Webpack 5's filesystem cache persists the build cache to disk. This means subsequent
        builds (after the first) can be <strong>60-80% faster</strong>.
      </p>

      <CodeBlock language="javascript" title="Filesystem Cache">{`module.exports = {
  cache: {
    type: 'filesystem',

    // Cache directory (default: node_modules/.cache/webpack)
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'),

    // Invalidate cache when these files change
    buildDependencies: {
      config: [__filename],  // Rebuild when webpack.config.js changes
    },

    // Cache version — bump to invalidate all caches
    version: '1.0',
  },
};

// First build:  ~15 seconds
// Second build:  ~3 seconds (80% faster!)`}</CodeBlock>

      <h3>thread-loader (Parallel Builds)</h3>
      <p>
        For CPU-intensive loaders like Babel, <code>thread-loader</code> offloads work to
        a worker pool:
      </p>
      <CodeBlock language="javascript" title="thread-loader Setup">{`// npm install --save-dev thread-loader
{
  test: /\\.(js|jsx|ts|tsx)$/,
  exclude: /node_modules/,
  use: [
    {
      loader: 'thread-loader',
      options: {
        workers: require('os').cpus().length - 1,
      },
    },
    'babel-loader',
  ],
}

// Note: thread-loader adds ~600ms startup overhead
// Only use for heavy loaders in large projects`}</CodeBlock>

      <h3>Lazy Compilation (Experimental)</h3>
      <p>
        Only compile entry points and dynamic imports when they are actually requested.
        Similar to Vite's on-demand approach:
      </p>
      <CodeBlock language="javascript" title="Lazy Compilation">{`module.exports = {
  experiments: {
    lazyCompilation: {
      // Only lazy-compile dynamic imports (not the entry point)
      imports: true,
      entries: false,
    },
  },
};`}</CodeBlock>

      <h3>Build Profiling</h3>
      <CodeBlock language="bash" title="Profile Your Build">{`# Generate build stats
webpack --profile --json > stats.json

# Analyze with webpack-bundle-analyzer
npx webpack-bundle-analyzer stats.json

# Or use the official analysis tool
# Upload stats.json to: https://webpack.github.io/analyse/`}</CodeBlock>

      <InfoBox variant="tip" title="Quick Performance Wins">
        In order of impact: (1) Enable filesystem cache, (2) Use swc-loader or esbuild-loader
        instead of babel-loader, (3) Narrow your <code>include</code>/<code>exclude</code>
        patterns, (4) Use <code>resolve.extensions</code> with only the extensions you need,
        (5) Add thread-loader for large projects.
      </InfoBox>

      {/* ── COMPLETE PRODUCTION CONFIG ────────────────────── */}
      <h2>Complete Production Config</h2>
      <p>
        Here's a full, annotated production <code>webpack.config.js</code> for a React +
        TypeScript application. Every option is explained:
      </p>

      <CodeBlock language="javascript" title="webpack.config.js — Full Production Config">{`const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  // ── Mode ──────────────────────────────────────────────
  mode: isProduction ? 'production' : 'development',

  // ── Entry ─────────────────────────────────────────────
  entry: './src/index.tsx',

  // ── Output ────────────────────────────────────────────
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction
      ? 'js/[name].[contenthash:8].js'     // Hashed for cache busting
      : 'js/[name].js',                     // Readable in dev
    chunkFilename: isProduction
      ? 'js/[name].[contenthash:8].chunk.js'
      : 'js/[name].chunk.js',
    publicPath: '/',
    clean: true,                             // Clear dist/ before build
  },

  // ── Source Maps ───────────────────────────────────────
  devtool: isProduction ? 'hidden-source-map' : 'eval-source-map',

  // ── Resolve ───────────────────────────────────────────
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@pages': path.resolve(__dirname, 'src/pages'),
    },
  },

  // ── Module Rules ──────────────────────────────────────
  module: {
    rules: [
      // TypeScript & JavaScript
      {
        test: /\\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults, not ie 11' }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
            plugins: [
              !isProduction && 'react-refresh/babel',
            ].filter(Boolean),
            cacheDirectory: true,
          },
        },
      },
      // CSS (global)
      {
        test: /\\.css$/,
        exclude: /\\.module\\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
      // CSS Modules
      {
        test: /\\.module\\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: isProduction
                  ? '[hash:base64:8]'
                  : '[name]_[local]__[hash:base64:5]',
              },
            },
          },
          'postcss-loader',
        ],
      },
      // Images
      {
        test: /\\.(png|jpg|jpeg|gif|webp)$/,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
        generator: { filename: 'images/[name].[hash:8][ext]' },
      },
      // SVGs as React components
      { test: /\\.svg$/, use: ['@svgr/webpack'] },
      // Fonts
      {
        test: /\\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: { filename: 'fonts/[name].[hash:8][ext]' },
      },
    ],
  },

  // ── Plugins ───────────────────────────────────────────
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico',
      minify: isProduction && {
        removeComments: true,
        collapseWhitespace: true,
      },
    }),
    isProduction && new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
    }),
    new webpack.DefinePlugin({
      'process.env.API_URL': JSON.stringify(process.env.API_URL || '/api'),
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.', globOptions: { ignore: ['**/index.html', '**/favicon.ico'] } },
      ],
    }),
    !isProduction && new ReactRefreshPlugin(),
  ].filter(Boolean),

  // ── Optimization ──────────────────────────────────────
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: true, drop_debugger: true },
          format: { comments: false },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        react: {
          test: /[\\\\/]node_modules[\\\\/](react|react-dom|scheduler)[\\\\/]/,
          name: 'react',
          priority: 20,
        },
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
    runtimeChunk: 'single',
  },

  // ── Cache (Webpack 5) ────────────────────────────────
  cache: {
    type: 'filesystem',
    buildDependencies: { config: [__filename] },
  },

  // ── Dev Server ────────────────────────────────────────
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    compress: true,
    proxy: [
      { context: ['/api'], target: 'http://localhost:3001' },
    ],
  },
};`}</CodeBlock>

      <CodeBlock language="bash" title="Install All Dependencies">{`npm install --save-dev \\
  webpack webpack-cli webpack-dev-server webpack-merge \\
  babel-loader @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript \\
  style-loader css-loader postcss-loader postcss autoprefixer \\
  mini-css-extract-plugin css-minimizer-webpack-plugin terser-webpack-plugin \\
  html-webpack-plugin copy-webpack-plugin \\
  @pmmmwh/react-refresh-webpack-plugin react-refresh \\
  @svgr/webpack

npm install react react-dom`}</CodeBlock>

      {/* ── CRA → WEBPACK ────────────────────────────────── */}
      <h2>CRA: What's Inside</h2>
      <p>
        Create React App wraps a complete Webpack configuration inside <code>react-scripts</code>.
        Understanding what's inside helps you debug issues and decide when to migrate.
      </p>

      <h3>What CRA Uses Under the Hood</h3>
      <ul>
        <li><strong>Webpack 5</strong> &mdash; the bundler</li>
        <li><strong>Babel</strong> &mdash; with preset-env, preset-react, preset-typescript</li>
        <li><strong>PostCSS</strong> &mdash; with autoprefixer</li>
        <li><strong>ESLint</strong> &mdash; with eslint-config-react-app</li>
        <li><strong>Jest</strong> &mdash; for testing</li>
        <li><strong>webpack-dev-server</strong> &mdash; with React Fast Refresh</li>
      </ul>

      <h3>Ejecting CRA</h3>
      <p>
        Running <code>npm run eject</code> copies the hidden Webpack config into your project.
        The ejected config is ~800 lines because it handles every edge case. Once ejected,
        you own the config and CRA no longer manages it.
      </p>

      <CodeBlock language="bash" title="CRA Eject">{`# WARNING: This is irreversible!
npm run eject

# Creates these files:
# config/webpack.config.js    (~800 lines)
# config/webpackDevServer.config.js
# config/paths.js
# config/env.js
# scripts/build.js
# scripts/start.js
# scripts/test.js`}</CodeBlock>

      <InfoBox variant="warning" title="Avoid Ejecting If Possible">
        Ejecting creates a maintenance burden. Instead, use <code>craco</code> or
        <code>react-app-rewired</code> to override specific Webpack settings without ejecting:
      </InfoBox>

      <CodeBlock language="javascript" title="craco.config.js — Override Without Ejecting">{`// npm install --save-dev @craco/craco
// Replace react-scripts with craco in package.json scripts

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    plugins: {
      add: [
        // Add custom plugins here
      ],
    },
    configure: (webpackConfig) => {
      // Modify the full Webpack config
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        stream: require.resolve('stream-browserify'),
      };
      return webpackConfig;
    },
  },
};`}</CodeBlock>

      {/* ── WEBPACK → VITE MIGRATION ─────────────────────── */}
      <h2>Webpack → Vite Migration</h2>
      <p>
        If you're moving a Webpack project to Vite, here's a systematic approach. Vite is
        10-100x faster in dev, but the migration has some gotchas.
      </p>

      <h3>Key Config Mapping</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Webpack</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Vite Equivalent</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>entry</code></td>
            <td style={{ padding: '8px' }}><code>index.html</code> (Vite uses HTML as entry)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>output</code></td>
            <td style={{ padding: '8px' }}><code>build.outDir</code>, <code>build.assetsDir</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>module.rules</code> (loaders)</td>
            <td style={{ padding: '8px' }}><code>plugins</code> (Vite/Rollup plugins)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>resolve.alias</code></td>
            <td style={{ padding: '8px' }}><code>resolve.alias</code> (same concept)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>devServer.proxy</code></td>
            <td style={{ padding: '8px' }}><code>server.proxy</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>DefinePlugin</code></td>
            <td style={{ padding: '8px' }}><code>define</code> in config</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}><code>process.env.REACT_APP_*</code></td>
            <td style={{ padding: '8px' }}><code>import.meta.env.VITE_*</code></td>
          </tr>
        </tbody>
      </table>

      <h3>Migration Checklist</h3>
      <CodeBlock language="bash" title="Step-by-Step Migration">{`# 1. Install Vite
npm install --save-dev vite @vitejs/plugin-react

# 2. Create vite.config.ts
# 3. Move index.html to project root (not public/)
# 4. Add <script type="module" src="/src/index.tsx"></script> to index.html
# 5. Update environment variables:
#    process.env.REACT_APP_API_URL → import.meta.env.VITE_API_URL
# 6. Replace require() with import (Vite uses ESM)
# 7. Update package.json scripts:
#    "dev": "vite"
#    "build": "vite build"
#    "preview": "vite preview"
# 8. Remove webpack dependencies from package.json
# 9. Delete webpack.config.js`}</CodeBlock>

      <CodeBlock language="typescript" title="vite.config.ts (Equivalent of Webpack Config)">{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },

  define: {
    'process.env.API_URL': JSON.stringify(process.env.API_URL),
  },
});`}</CodeBlock>

      <h3>Common Migration Gotchas</h3>
      <ul>
        <li><strong>require() calls</strong> &mdash; Vite uses ESM, so all <code>require()</code> must become <code>import</code></li>
        <li><strong>Environment variables</strong> &mdash; <code>REACT_APP_</code> prefix becomes <code>VITE_</code>, accessed via <code>import.meta.env</code></li>
        <li><strong>CSS imports in JS</strong> &mdash; usually work, but check CSS Modules syntax (<code>.module.css</code>)</li>
        <li><strong>Node.js globals</strong> &mdash; <code>process</code>, <code>Buffer</code>, <code>global</code> don't exist in Vite; use polyfills or refactor</li>
        <li><strong>Dynamic imports</strong> &mdash; Webpack magic comments (<code>webpackChunkName</code>) are ignored; Vite handles naming automatically</li>
        <li><strong>SVG imports</strong> &mdash; install <code>vite-plugin-svgr</code> for CRA-style SVG-as-component imports</li>
      </ul>

      <InfoBox variant="tip" title="Incremental Migration">
        You don't have to migrate all at once. Some teams run Vite for development and keep
        Webpack for production builds during the transition, then switch production once
        everything is verified.
      </InfoBox>

      <InteractiveChallenge
        question="When migrating from Webpack to Vite, what replaces process.env.REACT_APP_API_URL?"
        options={[
          "process.env.VITE_API_URL",
          "import.meta.env.VITE_API_URL",
          "window.env.API_URL",
          "globalThis.env.API_URL"
        ]}
        correctIndex={1}
        explanation="Vite uses import.meta.env instead of process.env, and environment variables must be prefixed with VITE_ instead of REACT_APP_. So process.env.REACT_APP_API_URL becomes import.meta.env.VITE_API_URL."
      />

      {/* ── WEBPACK 5 vs 4 ───────────────────────────────── */}
      <h2>Webpack 5 vs Webpack 4</h2>
      <p>
        If you encounter a Webpack 4 project, here are the key differences:
      </p>

      <h3>Breaking Changes in Webpack 5</h3>
      <ul>
        <li><strong>Node.js polyfills removed</strong> &mdash; Webpack 4 automatically polyfilled Node.js built-ins (Buffer, process, crypto). Webpack 5 does not. You must add <code>resolve.fallback</code> manually or refactor.</li>
        <li><strong>Asset modules replace loaders</strong> &mdash; <code>file-loader</code>, <code>url-loader</code>, and <code>raw-loader</code> are replaced by built-in <code>asset/resource</code>, <code>asset/inline</code>, and <code>asset/source</code>.</li>
        <li><strong>output.clean replaces CleanWebpackPlugin</strong> &mdash; built-in, no plugin needed.</li>
        <li><strong>Module IDs changed</strong> &mdash; deterministic module and chunk IDs by default (better long-term caching).</li>
      </ul>

      <h3>New Features in Webpack 5</h3>
      <ul>
        <li><strong>Module Federation</strong> &mdash; share code between apps at runtime</li>
        <li><strong>Filesystem caching</strong> &mdash; persistent cache across builds</li>
        <li><strong>Asset modules</strong> &mdash; built-in asset handling</li>
        <li><strong>Top-level await</strong> &mdash; <code>await</code> at module top level</li>
        <li><strong>Better tree shaking</strong> &mdash; nested tree shaking, inner-graph analysis</li>
      </ul>

      <CodeBlock language="javascript" title="Webpack 4 → 5: Node.js Polyfill Fix">{`// If you get "Module not found: Can't resolve 'buffer'"
// or similar errors after upgrading to Webpack 5:

module.exports = {
  resolve: {
    fallback: {
      // Provide polyfills for Node.js built-ins
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      // Or set to false if you don't need them
      fs: false,
      net: false,
      tls: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
};`}</CodeBlock>

      <InteractiveChallenge
        question="What Webpack 5 feature lets independently deployed apps share modules at runtime?"
        options={[
          "Code Splitting",
          "Module Federation",
          "Dynamic Imports",
          "Shared Chunks"
        ]}
        correctIndex={1}
        explanation="Module Federation is a Webpack 5 feature that allows multiple independently built applications to share code at runtime. It's the foundation for micro-frontend architectures."
      />

      <h2>Wrapping Up</h2>
      <p>
        You now have a complete understanding of Webpack &mdash; from zero-config basics to
        Module Federation and migration strategies. Here's your reference checklist:
      </p>
      <ul>
        <li><strong>New project?</strong> Use Vite. It's faster and simpler.</li>
        <li><strong>Existing Webpack project?</strong> You can now read, modify, and optimize any <code>webpack.config.js</code>.</li>
        <li><strong>CRA project?</strong> Use craco to customize, or migrate to Vite when ready.</li>
        <li><strong>Micro-frontends?</strong> Module Federation is your tool.</li>
        <li><strong>Slow builds?</strong> Enable filesystem cache, use swc-loader, and profile with bundle-analyzer.</li>
      </ul>

    </LessonLayout>
  );
}

export default Advanced;
