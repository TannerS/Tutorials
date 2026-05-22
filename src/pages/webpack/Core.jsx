import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Core() {
  return (
    <LessonLayout
      title="Core Concepts"
      sectionId="webpack"
      lessonIndex={1}
      prev={{ path: '/webpack/intro', label: 'What is Webpack?' }}
      next={{ path: '/webpack/loaders', label: 'Loaders & Asset Handling' }}
    >
      <p>
        Every Webpack config revolves around five core concepts. Understanding these five
        gives you the mental model to read any <code>webpack.config.js</code> you'll
        encounter in the wild. Let's go through each one with complete, working examples.
      </p>

      <FlowChart
        title="The Five Core Concepts"
        chart={"graph LR\n  A[Entry] --> B[Module Rules]\n  B --> C[Resolve]\n  C --> D[Plugins]\n  D --> E[Output]"}
      />

      {/* ── 1. ENTRY ─────────────────────────────────────── */}
      <h2>1. Entry</h2>
      <p>
        The <strong>entry</strong> tells Webpack where to start building the dependency graph.
        Every <code>import</code> or <code>require</code> Webpack finds is followed recursively
        until every dependency is accounted for.
      </p>

      <h3>Single Entry (Most Common)</h3>
      <CodeBlock language="javascript" title="webpack.config.js — Single Entry">{`const path = require('path');

module.exports = {
  // String shorthand — Webpack starts here
  entry: './src/index.js',
};`}</CodeBlock>

      <h3>Multiple Entries (Multi-Page Apps)</h3>
      <p>
        If you're building a multi-page app (e.g., a marketing site and an admin dashboard
        in the same repo), you can specify multiple entry points. Each gets its own output
        bundle.
      </p>
      <CodeBlock language="javascript" title="webpack.config.js — Multiple Entries">{`module.exports = {
  entry: {
    // Each key becomes the [name] in output.filename
    app: './src/app.js',
    admin: './src/admin.js',
    vendor: './src/vendor.js',
  },
};

// This produces:
// dist/app.[contenthash].js
// dist/admin.[contenthash].js
// dist/vendor.[contenthash].js`}</CodeBlock>

      <InfoBox variant="tip" title="When to Use Multiple Entries">
        Use multiple entries for multi-page apps or when you need completely separate bundles.
        For a typical SPA (single-page app), one entry point is all you need &mdash; code
        splitting with dynamic <code>import()</code> handles the rest.
      </InfoBox>

      {/* ── 2. OUTPUT ────────────────────────────────────── */}
      <h2>2. Output</h2>
      <p>
        The <strong>output</strong> tells Webpack where to write the bundles and how to name them.
      </p>

      <CodeBlock language="javascript" title="webpack.config.js — Output">{`const path = require('path');

module.exports = {
  entry: './src/index.js',

  output: {
    // Absolute path to output directory
    path: path.resolve(__dirname, 'dist'),

    // [name] = entry name (default: "main")
    // [contenthash] = hash of file contents (for cache busting)
    filename: '[name].[contenthash].js',

    // Public URL path for assets (used in HTML script tags)
    // '/' for root, '/app/' for sub-path deployments
    publicPath: '/',

    // Clean the dist/ folder before each build (Webpack 5+)
    clean: true,
  },
};`}</CodeBlock>

      <h3>Content Hashing Explained</h3>
      <p>
        Content hashing is critical for production caching. The hash changes only when
        the file contents change, so browsers can aggressively cache bundles. When you
        deploy a new version, the new hash forces a fresh download.
      </p>
      <CodeBlock language="bash" title="Content Hash Example">{`# First build:
dist/main.a1b2c3d4.js

# Code changes → new hash:
dist/main.e5f6g7h8.js

# No code changes → same hash (browser uses cached version):
dist/main.a1b2c3d4.js`}</CodeBlock>

      <InfoBox variant="warning" title="Use contenthash, Not hash">
        Webpack offers <code>[hash]</code>, <code>[chunkhash]</code>, and <code>[contenthash]</code>.
        Always use <code>[contenthash]</code> for production &mdash; it's scoped to the file's
        actual contents, so changing one file doesn't invalidate every other bundle's cache.
      </InfoBox>

      {/* ── 3. MODE ──────────────────────────────────────── */}
      <h2>3. Mode</h2>
      <p>
        The <strong>mode</strong> flag tells Webpack which built-in optimizations to enable.
        It's one of three values: <code>development</code>, <code>production</code>, or <code>none</code>.
      </p>

      <CodeBlock language="javascript" title="webpack.config.js — Mode">{`module.exports = {
  // 'development' | 'production' | 'none'
  mode: 'production',
};`}</CodeBlock>

      <h3>What Each Mode Enables</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Feature</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>development</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>production</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>process.env.NODE_ENV</td>
            <td style={{ padding: '8px' }}>"development"</td>
            <td style={{ padding: '8px' }}>"production"</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Minification (Terser)</td>
            <td style={{ padding: '8px' }}>Off</td>
            <td style={{ padding: '8px' }}>On</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Tree Shaking</td>
            <td style={{ padding: '8px' }}>Off</td>
            <td style={{ padding: '8px' }}>On</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Source Maps</td>
            <td style={{ padding: '8px' }}>eval (fast)</td>
            <td style={{ padding: '8px' }}>None (add manually)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Module Concatenation</td>
            <td style={{ padding: '8px' }}>Off</td>
            <td style={{ padding: '8px' }}>On</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>Named Modules</td>
            <td style={{ padding: '8px' }}>Yes (readable)</td>
            <td style={{ padding: '8px' }}>No (numeric IDs)</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="Don't Hardcode Mode">
        In real projects, you'll either pass mode via the CLI (<code>webpack --mode production</code>)
        or use separate config files (<code>webpack.dev.js</code> / <code>webpack.prod.js</code>).
        We'll cover the multi-config pattern in the Dev Server lesson.
      </InfoBox>

      {/* ── 4. MODULE RULES ──────────────────────────────── */}
      <h2>4. Module Rules</h2>
      <p>
        Out of the box, Webpack only understands JavaScript and JSON. The <code>module.rules</code>
        array tells Webpack how to handle every other file type &mdash; CSS, images, TypeScript,
        SCSS, fonts, and more. Each rule has:
      </p>
      <ul>
        <li><code>test</code> &mdash; a regex matching file extensions</li>
        <li><code>use</code> &mdash; which loader(s) to apply</li>
        <li><code>exclude</code> &mdash; directories to skip (usually <code>node_modules</code>)</li>
      </ul>

      <CodeBlock language="javascript" title="Quick Module Rules Example">{`module.exports = {
  module: {
    rules: [
      {
        // Match .js and .jsx files
        test: /\\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        // Match .css files
        test: /\\.css$/,
        // Loaders execute right-to-left:
        // css-loader resolves @import and url()
        // style-loader injects CSS into the DOM
        use: ['style-loader', 'css-loader'],
      },
      {
        // Match image files (Webpack 5 asset modules)
        test: /\\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
};`}</CodeBlock>

      <p>
        We'll dive deep into loaders in the next lesson. For now, just know that
        <code>module.rules</code> is how you teach Webpack to handle non-JS files.
      </p>

      {/* ── 5. RESOLVE ───────────────────────────────────── */}
      <h2>5. Resolve</h2>
      <p>
        The <strong>resolve</strong> config controls how Webpack finds modules when you
        write <code>import</code> statements.
      </p>

      <CodeBlock language="javascript" title="webpack.config.js — Resolve">{`const path = require('path');

module.exports = {
  resolve: {
    // Which extensions to try when you omit them in imports
    // import './App' → tries App.js, App.jsx, App.ts, App.tsx
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],

    // Path aliases — like tsconfig "paths"
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
    },

    // Where to look for modules (defaults to node_modules)
    modules: ['node_modules', path.resolve(__dirname, 'src')],
  },
};`}</CodeBlock>

      <h3>Using Aliases in Your Code</h3>
      <CodeBlock language="javascript" title="With Aliases vs Without">{`// Without aliases — fragile relative paths
import Button from '../../../components/Button';
import { formatDate } from '../../../../utils/date';

// With aliases — clean and refactor-safe
import Button from '@components/Button';
import { formatDate } from '@utils/date';`}</CodeBlock>

      <InfoBox variant="tip" title="Sync Aliases With tsconfig.json">
        If you're using TypeScript, you need to define the same aliases in both
        <code>webpack.config.js</code> and <code>tsconfig.json</code>. The
        <code>tsconfig-paths-webpack-plugin</code> can auto-sync them so you only
        define paths once.
      </InfoBox>

      {/* ── COMPLETE CONFIG ──────────────────────────────── */}
      <h2>Complete Basic Config for a React Project</h2>
      <p>
        Here's everything put together &mdash; a working <code>webpack.config.js</code> for
        a React project with JSX support, CSS handling, image assets, and path aliases:
      </p>

      <CodeBlock language="javascript" title="webpack.config.js — Complete Basic Config">{`const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // 1. ENTRY — where Webpack starts
  entry: './src/index.jsx',

  // 2. OUTPUT — where bundles go
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
    clean: true,
  },

  // 3. MODE — development or production
  mode: process.env.NODE_ENV || 'development',

  // 4. MODULE RULES — how to handle different file types
  module: {
    rules: [
      {
        test: /\\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\\.(png|jpg|gif|webp)$/,
        type: 'asset/resource',
      },
      {
        test: /\\.svg$/,
        type: 'asset/inline',
      },
      {
        test: /\\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },

  // 5. RESOLVE — how Webpack finds modules
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },

  // Plugins (covered in detail later)
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};`}</CodeBlock>

      <CodeBlock language="bash" title="Install Dependencies for This Config">{`npm install --save-dev \\
  webpack webpack-cli \\
  babel-loader @babel/core @babel/preset-env @babel/preset-react \\
  style-loader css-loader \\
  html-webpack-plugin

npm install react react-dom`}</CodeBlock>

      <InteractiveChallenge
        question="What does output.clean: true do in Webpack 5?"
        options={[
          "Removes console.log statements from the output",
          "Deletes the dist/ folder before each new build",
          "Minifies the output bundle",
          "Removes unused CSS from the output"
        ]}
        correctIndex={1}
        explanation="output.clean: true tells Webpack to remove all files from the output directory (dist/) before emitting new files. This replaces the old CleanWebpackPlugin."
      />

      <InteractiveChallenge
        question="In module.rules, loaders in the 'use' array execute in which order?"
        options={[
          "Left to right (first to last)",
          "Right to left (last to first)",
          "In parallel",
          "Alphabetically"
        ]}
        correctIndex={1}
        explanation="Loaders execute right-to-left (or bottom-to-top). In ['style-loader', 'css-loader'], css-loader runs first to resolve @import and url(), then style-loader injects the result into the DOM."
      />

      <h2>Config File Format</h2>
      <p>
        Webpack's config file is a regular Node.js module that exports an object (or a function).
        It uses <code>require()</code> because it runs in Node.js, not the browser:
      </p>

      <CodeBlock language="javascript" title="webpack.config.js — Function Form">{`// You can export a function for dynamic config
module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.jsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction
        ? '[name].[contenthash].js'
        : '[name].js',
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    // ... rest of config
  };
};`}</CodeBlock>

      <h2>What's Next</h2>
      <p>
        You now understand the five pillars of Webpack configuration. Next, we'll go deep on
        <strong> loaders</strong> &mdash; the transformer pipeline that lets Webpack handle
        TypeScript, SCSS, images, fonts, and everything else your project needs.
      </p>

    </LessonLayout>
  );
}

export default Core;
