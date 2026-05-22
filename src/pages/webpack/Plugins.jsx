import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Plugins() {
  return (
    <LessonLayout
      title="Plugins & Optimization"
      sectionId="webpack"
      lessonIndex={3}
      prev={{ path: '/webpack/loaders', label: 'Loaders & Asset Handling' }}
      next={{ path: '/webpack/devserver', label: 'Dev Server & HMR' }}
    >
      <h2>Loaders vs Plugins</h2>
      <p>
        <strong>Loaders</strong> transform individual files before they enter the bundle.
        <strong> Plugins</strong> operate on the entire compilation &mdash; they can modify
        the output, inject variables, generate HTML, extract CSS, optimize chunks, and
        hook into any stage of the build lifecycle.
      </p>
      <p>
        Think of it this way: loaders are per-file transformers, plugins are build-wide
        processors.
      </p>

      <FlowChart
        title="Loaders vs Plugins in the Pipeline"
        chart={"graph TD\n  A[Source Files] --> B[Loaders Transform Each File]\n  B --> C[Dependency Graph Built]\n  C --> D[Plugins Process the Compilation]\n  D --> E[Optimized Output]"}
      />

      {/* ── ESSENTIAL PLUGINS ────────────────────────────── */}
      <h2>Essential Plugins</h2>

      <h3>HtmlWebpackPlugin</h3>
      <p>
        The most commonly used plugin. It generates an <code>index.html</code> file and
        automatically injects <code>&lt;script&gt;</code> and <code>&lt;link&gt;</code> tags
        pointing to your output bundles &mdash; including the content hashes.
      </p>
      <CodeBlock language="javascript" title="HtmlWebpackPlugin Setup">{`// npm install --save-dev html-webpack-plugin
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      // Use your own HTML template
      template: './public/index.html',

      // Output filename
      filename: 'index.html',

      // Inject scripts into <body> (default)
      inject: 'body',

      // Minify HTML in production
      minify: process.env.NODE_ENV === 'production' ? {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
      } : false,

      // Custom template variables
      title: 'My App',

      // Favicon
      favicon: './public/favicon.ico',
    }),
  ],
};`}</CodeBlock>

      <CodeBlock language="bash" title="public/index.html Template">{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= htmlWebpackPlugin.options.title %></title>
</head>
<body>
  <div id="root"></div>
  <!-- Scripts are injected automatically by HtmlWebpackPlugin -->
</body>
</html>`}</CodeBlock>

      <h3>MiniCssExtractPlugin</h3>
      <p>
        Extracts CSS into separate <code>.css</code> files instead of injecting via JavaScript.
        Essential for production &mdash; allows parallel CSS loading and proper caching.
      </p>
      <CodeBlock language="javascript" title="MiniCssExtractPlugin Setup">{`// npm install --save-dev mini-css-extract-plugin
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  plugins: [
    new MiniCssExtractPlugin({
      // Output CSS filenames with content hash
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].[contenthash].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\\.css$/,
        use: [
          MiniCssExtractPlugin.loader,  // Instead of style-loader
          'css-loader',
        ],
      },
    ],
  },
};`}</CodeBlock>

      <h3>DefinePlugin</h3>
      <p>
        Injects build-time constants into your code. This is how <code>process.env.NODE_ENV</code>
        works in Webpack, and how you can implement feature flags.
      </p>
      <CodeBlock language="javascript" title="DefinePlugin Setup">{`// Built into Webpack — no npm install needed
const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      // Values are code expressions, not strings!
      // Wrap strings in JSON.stringify
      'process.env.API_URL': JSON.stringify('https://api.example.com'),
      'process.env.VERSION': JSON.stringify('1.2.3'),
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      FEATURE_FLAGS: JSON.stringify({
        newDashboard: true,
        darkMode: false,
      }),
    }),
  ],
};`}</CodeBlock>

      <InfoBox variant="warning" title="JSON.stringify Is Required">
        DefinePlugin performs a text replacement. If you write <code>'process.env.API_URL':
        'https://api.example.com'</code>, Webpack will insert the raw text <code>https://api.example.com</code>
        (not a string). Always wrap string values in <code>JSON.stringify()</code>.
      </InfoBox>

      <h3>CopyWebpackPlugin</h3>
      <p>
        Copies static files (favicons, manifest.json, robots.txt) to the output directory
        without processing them through Webpack:
      </p>
      <CodeBlock language="javascript" title="CopyWebpackPlugin Setup">{`// npm install --save-dev copy-webpack-plugin
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        // Copy everything in public/ except index.html
        {
          from: 'public',
          to: '.',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
  ],
};`}</CodeBlock>

      <InfoBox variant="tip" title="output.clean Replaces CleanWebpackPlugin">
        In Webpack 5, set <code>output.clean: true</code> instead of installing
        <code>clean-webpack-plugin</code>. It's built in and does the same thing &mdash;
        clears the output directory before each build.
      </InfoBox>

      {/* ── OPTIMIZATION PLUGINS ─────────────────────────── */}
      <h2>Optimization Plugins</h2>

      <h3>TerserPlugin (JavaScript Minification)</h3>
      <p>
        Webpack uses TerserPlugin by default in production mode. You only need to configure
        it explicitly if you want to customize the behavior:
      </p>
      <CodeBlock language="javascript" title="TerserPlugin Custom Config">{`// npm install --save-dev terser-webpack-plugin
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,     // Remove console.log in production
            drop_debugger: true,    // Remove debugger statements
          },
          format: {
            comments: false,        // Remove all comments
          },
        },
        extractComments: false,     // Don't create LICENSE.txt files
      }),
    ],
  },
};`}</CodeBlock>

      <h3>CssMinimizerPlugin</h3>
      <CodeBlock language="javascript" title="CSS Minification">{`// npm install --save-dev css-minimizer-webpack-plugin
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [
      '...',  // Spread to keep default minimizers (Terser)
      new CssMinimizerPlugin(),
    ],
  },
};`}</CodeBlock>

      <h3>BundleAnalyzerPlugin</h3>
      <p>
        Visualizes your bundle contents as a treemap. Invaluable for finding bloated
        dependencies and optimization opportunities:
      </p>
      <CodeBlock language="javascript" title="Bundle Analyzer">{`// npm install --save-dev webpack-bundle-analyzer
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  plugins: [
    // Only include when analyzing (controlled via env var)
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',       // Generate HTML file
      openAnalyzer: true,            // Open in browser
      reportFilename: 'bundle-report.html',
    }),
  ].filter(Boolean),
};

// Run with: ANALYZE=true npm run build`}</CodeBlock>

      <h3>CompressionPlugin</h3>
      <CodeBlock language="javascript" title="Pre-compression">{`// npm install --save-dev compression-webpack-plugin
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  plugins: [
    // Generate .gz files alongside original files
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\\.(js|css|html|svg)$/,
      threshold: 10240,   // Only compress files > 10kb
      minRatio: 0.8,      // Only if compression saves > 20%
    }),
  ],
};`}</CodeBlock>

      {/* ── CODE SPLITTING ───────────────────────────────── */}
      <h2>Code Splitting &amp; Chunks</h2>
      <p>
        Code splitting is one of Webpack's most powerful features. Instead of one massive
        bundle, you split your code into smaller chunks that load on demand.
      </p>

      <h3>optimization.splitChunks</h3>
      <p>
        Webpack's <code>splitChunks</code> automatically extracts shared modules into
        separate chunks. The default config is usually good enough, but here's how to
        customize it:
      </p>

      <CodeBlock language="javascript" title="splitChunks Configuration">{`module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',          // Split both sync and async imports
      minSize: 20000,         // Minimum chunk size (bytes) to generate
      maxSize: 244000,        // Try to split chunks larger than this
      minChunks: 1,           // Minimum times a module must be shared
      cacheGroups: {
        // Vendor chunk — all node_modules in one bundle
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Separate React into its own chunk (rarely changes)
        react: {
          test: /[\\\\/]node_modules[\\\\/](react|react-dom)[\\\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        // Common code shared between entry points
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
};`}</CodeBlock>

      <FlowChart
        title="How Code Splitting Works"
        chart={"graph TD\n  A[App Entry Point] --> B[App Code Chunk]\n  A --> C[Vendor Chunk]\n  A --> D[React Chunk]\n  B --> E[Lazy Route A]\n  B --> F[Lazy Route B]\n  E --> G[Loaded on demand]\n  F --> G"}
      />

      <h3>Dynamic Imports (Automatic Split Points)</h3>
      <p>
        Using <code>import()</code> as a function creates automatic code split points.
        Webpack generates separate chunks for dynamically imported modules:
      </p>

      <CodeBlock language="javascript" title="Dynamic Imports in React">{`import { lazy, Suspense } from 'react';

// Each lazy() call creates a separate chunk
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import(
  /* webpackChunkName: "admin" */  // Name the chunk
  './pages/AdminPanel'
));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}

// Webpack output:
// dist/main.a1b2c3.js          — app shell
// dist/vendors.d4e5f6.js       — node_modules
// dist/admin.g7h8i9.js         — admin panel (loaded on demand)
// dist/src_pages_Dashboard.js  — dashboard (loaded on demand)
// dist/src_pages_Settings.js   — settings (loaded on demand)`}</CodeBlock>

      <InfoBox variant="info" title="Magic Comments">
        Webpack supports magic comments in dynamic imports:
        <code>webpackChunkName</code> names the chunk,
        <code>webpackPrefetch: true</code> prefetches it during idle time, and
        <code>webpackPreload: true</code> loads it in parallel with the parent chunk.
      </InfoBox>

      {/* ── TREE SHAKING ─────────────────────────────────── */}
      <h2>Tree Shaking</h2>
      <p>
        Tree shaking eliminates dead code &mdash; exports that are never imported anywhere.
        Webpack performs tree shaking automatically in production mode, but only under
        certain conditions.
      </p>

      <h3>How It Works</h3>
      <ol>
        <li>Webpack analyzes ES module <code>import</code>/<code>export</code> statements (they're static and analyzable)</li>
        <li>It marks unused exports as "dead code"</li>
        <li>Terser (the minifier) removes the dead code from the final output</li>
      </ol>

      <CodeBlock language="javascript" title="Tree Shaking Example">{`// utils.js — exports 3 functions
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export function multiply(a, b) { return a * b; }

// app.js — only imports 'add'
import { add } from './utils';
console.log(add(2, 3));

// After tree shaking: subtract and multiply are removed from the bundle`}</CodeBlock>

      <h3>sideEffects in package.json</h3>
      <p>
        The <code>sideEffects</code> field tells Webpack which files have side effects
        (code that runs on import, like CSS or polyfills). Files without side effects can
        be safely tree-shaken:
      </p>

      <CodeBlock language="json" title="package.json">{`{
  "name": "my-app",
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}`}</CodeBlock>

      <h3>What Breaks Tree Shaking</h3>
      <ul>
        <li><strong>CommonJS</strong> &mdash; <code>require()</code> is dynamic, Webpack can't analyze it statically</li>
        <li><strong>Re-exporting everything</strong> &mdash; <code>export * from './module'</code> can sometimes block analysis</li>
        <li><strong>Dynamic property access</strong> &mdash; <code>utils[methodName]()</code> prevents dead code detection</li>
        <li><strong>Side effects</strong> &mdash; files that run code on import can't be safely removed</li>
      </ul>

      <InteractiveChallenge
        question="What is the purpose of the sideEffects field in package.json?"
        options={[
          "Lists npm scripts that have side effects",
          "Tells Webpack which files can be safely tree-shaken vs which have import-time side effects",
          "Defines environment variables for production builds",
          "Specifies which plugins should run during the build"
        ]}
        correctIndex={1}
        explanation="The sideEffects field tells Webpack which files run code on import (like CSS imports or polyfills). Files NOT listed can be safely tree-shaken if their exports are unused."
      />

      {/* ── COMPLETE PRODUCTION CONFIG ────────────────────── */}
      <h2>Complete Production Plugins &amp; Optimization Config</h2>

      <CodeBlock language="javascript" title="Production Plugins + Optimization">{`const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: 'source-map',

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      },
    }),

    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),

    new webpack.DefinePlugin({
      'process.env.API_URL': JSON.stringify(process.env.API_URL),
    }),

    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.', globOptions: { ignore: ['**/index.html'] } },
      ],
    }),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: true },
          format: { comments: false },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          priority: 10,
        },
        react: {
          test: /[\\\\/]node_modules[\\\\/](react|react-dom)[\\\\/]/,
          name: 'react',
          priority: 20,
        },
      },
    },
    // Separate runtime code into its own chunk
    runtimeChunk: 'single',
  },
};`}</CodeBlock>

      <InteractiveChallenge
        question="Which optimization produces separate .css files instead of injecting CSS via JavaScript?"
        options={[
          "CssMinimizerPlugin",
          "style-loader with extract option",
          "MiniCssExtractPlugin",
          "DefinePlugin with CSS_EXTRACT flag"
        ]}
        correctIndex={2}
        explanation="MiniCssExtractPlugin extracts CSS into separate .css files. CssMinimizerPlugin only minifies CSS that's already been extracted. style-loader injects CSS into the DOM via <style> tags (the opposite of extraction)."
      />

      <h2>What's Next</h2>
      <p>
        With loaders and plugins configured, you need a development environment. Next, we'll
        set up <strong>webpack-dev-server</strong> with Hot Module Replacement, proxy
        configuration, source maps, and the multi-file config pattern.
      </p>

    </LessonLayout>
  );
}

export default Plugins;
