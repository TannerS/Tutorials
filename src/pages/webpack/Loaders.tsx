import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Loaders() {
  return (
    <LessonLayout
      title="Loaders & Asset Handling"
      sectionId="webpack"
      lessonIndex={2}
      prev={{ path: '/webpack/core', label: 'Core Concepts' }}
      next={{ path: '/webpack/plugins', label: 'Plugins & Optimization' }}
    >
      <h2>What Are Loaders?</h2>
      <p>
        Webpack only understands JavaScript and JSON natively. <strong>Loaders</strong> are
        transformers that process files <em>before</em> they're added to the bundle. They
        convert TypeScript to JS, SCSS to CSS, images to data URIs &mdash; anything you need.
      </p>
      <p>
        Think of loaders as preprocessors in a pipeline. Each loader takes source content in
        and passes transformed content out. When you chain multiple loaders, they execute
        <strong> right-to-left</strong> (or bottom-to-top in the config array).
      </p>

      <FlowChart
        title="Loader Chain Execution Order"
        chart={"graph LR\n  A[Source File] --> C[sass-loader]\n  C --> D[postcss-loader]\n  D --> E[css-loader]\n  E --> F[style-loader]\n  F --> G[Bundle]"}
      />

      <InfoBox variant="info" title="Right-to-Left Is Intentional">
        The right-to-left order follows function composition: <code>style(css(postcss(sass(file))))</code>.
        The last loader in the array runs first and receives the raw file. The first loader
        runs last and returns the final JavaScript output to Webpack.
      </InfoBox>

      {/* ── JAVASCRIPT / TYPESCRIPT LOADERS ───────────── */}
      <h2>JavaScript / TypeScript Loaders</h2>

      <h3>babel-loader (The Classic Choice)</h3>
      <p>
        Babel transforms modern JS/JSX/TS into browser-compatible JavaScript. It's been the
        default choice for React projects since 2015.
      </p>

      <CodeBlock language="bash" title="Install Babel">{`npm install --save-dev \\
  babel-loader @babel/core \\
  @babel/preset-env \\
  @babel/preset-react \\
  @babel/preset-typescript  # Only if using TypeScript`}</CodeBlock>

      <CodeBlock language="javascript" title="Webpack Rule for Babel">{`{
  test: /\\.(js|jsx|ts|tsx)$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: [
        ['@babel/preset-env', {
          targets: '> 0.25%, not dead',  // Browserslist query
          useBuiltIns: 'usage',           // Auto-import polyfills as needed
          corejs: 3,
        }],
        ['@babel/preset-react', {
          runtime: 'automatic',  // No need to import React in every file
        }],
        '@babel/preset-typescript',  // Strips types (no type checking!)
      ],
      // Cache transpilation results for faster rebuilds
      cacheDirectory: true,
    },
  },
}`}</CodeBlock>

      <InfoBox variant="warning" title="Babel Doesn't Type-Check">
        <code>@babel/preset-typescript</code> strips TypeScript types but does NOT perform
        type checking. You need to run <code>tsc --noEmit</code> separately (usually in CI
        or as a pre-commit hook) to actually catch type errors.
      </InfoBox>

      <h3>Alternatively: .babelrc Config File</h3>
      <p>
        Instead of inline options, you can put Babel config in a separate file. This is
        preferred in larger projects because other tools (Jest, ESLint) can also read it.
      </p>

      <CodeBlock language="json" title=".babelrc">{`{
  "presets": [
    ["@babel/preset-env", { "targets": "> 0.25%, not dead" }],
    ["@babel/preset-react", { "runtime": "automatic" }],
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-proposal-optional-chaining"
  ]
}`}</CodeBlock>

      <h3>ts-loader vs babel-loader for TypeScript</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Feature</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>babel-loader + preset-typescript</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>ts-loader</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Speed</td>
            <td style={{ padding: '8px' }}>Faster (strips types only)</td>
            <td style={{ padding: '8px' }}>Slower (full type checking)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Type checking</td>
            <td style={{ padding: '8px' }}>None (run tsc separately)</td>
            <td style={{ padding: '8px' }}>Yes, during build</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>HMR support</td>
            <td style={{ padding: '8px' }}>Excellent</td>
            <td style={{ padding: '8px' }}>Good</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>Recommendation</td>
            <td style={{ padding: '8px' }}>Use for most projects</td>
            <td style={{ padding: '8px' }}>Use if you want build-time type errors</td>
          </tr>
        </tbody>
      </table>

      <h3>Modern Alternatives: swc-loader and esbuild-loader</h3>
      <p>
        If Babel feels slow, these Rust/Go-based alternatives are 20-70x faster:
      </p>

      <CodeBlock language="javascript" title="swc-loader (Rust-based, drop-in Babel replacement)">{`// npm install --save-dev @swc/core swc-loader
{
  test: /\\.(js|jsx|ts|tsx)$/,
  exclude: /node_modules/,
  use: {
    loader: 'swc-loader',
    options: {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    },
  },
}`}</CodeBlock>

      <CodeBlock language="javascript" title="esbuild-loader (Go-based, extremely fast)">{`// npm install --save-dev esbuild-loader
{
  test: /\\.(js|jsx|ts|tsx)$/,
  exclude: /node_modules/,
  loader: 'esbuild-loader',
  options: {
    target: 'es2020',
    jsx: 'automatic',
  },
}`}</CodeBlock>

      {/* ── CSS LOADERS ──────────────────────────────────── */}
      <h2>CSS Loaders</h2>
      <p>
        CSS handling in Webpack requires understanding a chain of loaders, each doing one
        specific job:
      </p>

      <h3>css-loader + style-loader (Development)</h3>
      <CodeBlock language="javascript" title="Basic CSS Rule">{`// npm install --save-dev style-loader css-loader
{
  test: /\\.css$/,
  use: [
    'style-loader',  // 2nd: Injects CSS into DOM via <style> tags
    'css-loader',    // 1st: Resolves @import and url() references
  ],
}`}</CodeBlock>
      <p>
        <code>css-loader</code> reads the CSS file, resolves <code>@import</code> and
        <code>url()</code> references, and returns the CSS as a JavaScript string.
        <code>style-loader</code> takes that string and injects it into the page as
        a <code>&lt;style&gt;</code> tag. This is great for development (HMR works out of
        the box) but not ideal for production.
      </p>

      <h3>SCSS / Sass</h3>
      <CodeBlock language="javascript" title="SCSS Rule">{`// npm install --save-dev sass sass-loader
{
  test: /\\.s[ac]ss$/,
  use: [
    'style-loader',   // 3rd: Injects into DOM
    'css-loader',     // 2nd: Resolves imports
    'sass-loader',    // 1st: Compiles SCSS → CSS
  ],
}`}</CodeBlock>

      <h3>PostCSS + Autoprefixer</h3>
      <CodeBlock language="javascript" title="PostCSS Rule">{`// npm install --save-dev postcss-loader postcss autoprefixer
{
  test: /\\.css$/,
  use: [
    'style-loader',
    'css-loader',
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: ['autoprefixer'],
        },
      },
    },
  ],
}`}</CodeBlock>

      <h3>CSS Modules</h3>
      <p>
        CSS Modules scope class names locally by default, preventing global style conflicts.
        Enable them by configuring <code>css-loader</code>:
      </p>
      <CodeBlock language="javascript" title="CSS Modules Rule">{`{
  // Match .module.css files for CSS Modules
  test: /\\.module\\.css$/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: {
          // Generates unique class names like: Button_primary__a1b2c
          localIdentName: '[name]_[local]__[hash:base64:5]',
        },
      },
    },
  ],
},
{
  // Regular CSS (non-module) for global styles
  test: /\\.css$/,
  exclude: /\\.module\\.css$/,
  use: ['style-loader', 'css-loader'],
}`}</CodeBlock>

      <CodeBlock language="javascript" title="Using CSS Modules in React">{`import styles from './Button.module.css';

function Button({ children }) {
  // styles.primary is a unique hashed class name
  return <button className={styles.primary}>{children}</button>;
}`}</CodeBlock>

      <h3>MiniCssExtractPlugin.loader (Production)</h3>
      <p>
        In production, you don't want CSS injected via JavaScript &mdash; you want separate
        <code>.css</code> files for parallel loading and caching. Replace <code>style-loader</code>
        with <code>MiniCssExtractPlugin.loader</code>:
      </p>
      <CodeBlock language="javascript" title="Production CSS Extraction">{`const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const isProduction = process.env.NODE_ENV === 'production';

// In module.rules:
{
  test: /\\.css$/,
  use: [
    isProduction
      ? MiniCssExtractPlugin.loader  // Production: extract to .css files
      : 'style-loader',              // Development: inject into DOM (HMR)
    'css-loader',
  ],
}

// In plugins:
plugins: [
  isProduction && new MiniCssExtractPlugin({
    filename: 'css/[name].[contenthash].css',
  }),
].filter(Boolean),`}</CodeBlock>

      {/* ── ASSET MODULES (WEBPACK 5) ────────────────────── */}
      <h2>Asset Handling (Webpack 5 Built-In)</h2>
      <p>
        Webpack 5 introduced <strong>Asset Modules</strong>, replacing the old
        <code>file-loader</code>, <code>url-loader</code>, and <code>raw-loader</code>.
        No extra packages needed!
      </p>

      <FlowChart
        title="Webpack 5 Asset Module Types"
        chart={"graph TD\n  A[Asset Modules] --> B[asset/resource]\n  A --> C[asset/inline]\n  A --> D[asset/source]\n  A --> E[asset]\n  B --> F[Emits file, returns URL]\n  C --> G[Inlines as data URI]\n  D --> H[Returns raw source string]\n  E --> I[Auto chooses based on size]"}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Old Loader</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>What It Does</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>asset/resource</code></td>
            <td style={{ padding: '8px' }}>file-loader</td>
            <td style={{ padding: '8px' }}>Emits file to output dir, returns URL</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>asset/inline</code></td>
            <td style={{ padding: '8px' }}>url-loader</td>
            <td style={{ padding: '8px' }}>Inlines as base64 data URI</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>asset/source</code></td>
            <td style={{ padding: '8px' }}>raw-loader</td>
            <td style={{ padding: '8px' }}>Returns raw file content as string</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}><code>asset</code></td>
            <td style={{ padding: '8px' }}>url-loader with limit</td>
            <td style={{ padding: '8px' }}>Auto: inline if &lt;8kb, file otherwise</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="javascript" title="Asset Module Rules">{`module: {
  rules: [
    // Images — auto-inline small files, emit larger ones
    {
      test: /\\.(png|jpg|jpeg|gif|webp)$/,
      type: 'asset',
      parser: {
        dataUrlCondition: {
          maxSize: 8 * 1024, // 8kb threshold
        },
      },
      generator: {
        filename: 'images/[name].[hash:8][ext]',
      },
    },

    // SVGs — inline as data URI (small files, great for icons)
    {
      test: /\\.svg$/,
      type: 'asset/inline',
    },

    // Fonts — always emit as files
    {
      test: /\\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'fonts/[name].[hash:8][ext]',
      },
    },

    // Text files — import as raw string
    {
      test: /\\.txt$/,
      type: 'asset/source',
    },
  ],
}`}</CodeBlock>

      <CodeBlock language="javascript" title="Using Assets in React">{`// Webpack returns the resolved URL for asset/resource
import logo from './logo.png';
import icon from './icon.svg';

function Header() {
  return (
    <header>
      <img src={logo} alt="Logo" />      {/* URL to emitted file */}
      <img src={icon} alt="Icon" />       {/* Inlined data URI */}
    </header>
  );
}`}</CodeBlock>

      <InfoBox variant="tip" title="SVG as React Components">
        If you want to import SVGs as React components (like CRA does), use
        <code>@svgr/webpack</code> instead of asset modules for SVGs:
        <code>{' { test: /\\.svg$/, use: ["@svgr/webpack"] }'}</code>
      </InfoBox>

      {/* ── OTHER LOADERS ────────────────────────────────── */}
      <h2>Other Useful Loaders</h2>

      <h3>html-loader</h3>
      <p>
        Processes HTML files, resolving image <code>src</code> and link <code>href</code>
        attributes so Webpack can handle those assets too:
      </p>
      <CodeBlock language="javascript" title="html-loader">{`{
  test: /\\.html$/,
  loader: 'html-loader',
}`}</CodeBlock>

      <h3>Custom Loaders (Brief Concept)</h3>
      <p>
        A Webpack loader is just a function that receives source content and returns
        transformed content. You can write your own:
      </p>
      <CodeBlock language="javascript" title="my-custom-loader.js">{`// A loader is a function: source → transformed source
module.exports = function (source) {
  // Replace all TODO comments with empty strings
  const result = source.replace(/\\/\\/ TODO:.*$/gm, '');
  return result;
};

// Use it: { test: /\\.js$/, use: path.resolve('./my-custom-loader.js') }`}</CodeBlock>

      {/* ── COMPLETE CONFIG ──────────────────────────────── */}
      <h2>Complete module.rules Config</h2>
      <p>
        Here's a production-ready <code>module.rules</code> that handles JS, TS, CSS, SCSS,
        CSS Modules, images, fonts, and SVGs:
      </p>

      <CodeBlock language="javascript" title="Complete Loader Configuration">{`const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const isProduction = process.env.NODE_ENV === 'production';

const cssLoader = isProduction
  ? MiniCssExtractPlugin.loader
  : 'style-loader';

module.exports = {
  module: {
    rules: [
      // JavaScript & TypeScript
      {
        test: /\\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults' }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
            cacheDirectory: true,
          },
        },
      },

      // CSS Modules (*.module.css)
      {
        test: /\\.module\\.css$/,
        use: [
          cssLoader,
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

      // Global CSS
      {
        test: /\\.css$/,
        exclude: /\\.module\\.css$/,
        use: [cssLoader, 'css-loader', 'postcss-loader'],
      },

      // SCSS Modules (*.module.scss)
      {
        test: /\\.module\\.s[ac]ss$/,
        use: [
          cssLoader,
          {
            loader: 'css-loader',
            options: { modules: { localIdentName: '[name]_[local]__[hash:base64:5]' } },
          },
          'postcss-loader',
          'sass-loader',
        ],
      },

      // Global SCSS
      {
        test: /\\.s[ac]ss$/,
        exclude: /\\.module\\.s[ac]ss$/,
        use: [cssLoader, 'css-loader', 'postcss-loader', 'sass-loader'],
      },

      // Images
      {
        test: /\\.(png|jpg|jpeg|gif|webp)$/,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
        generator: { filename: 'images/[name].[hash:8][ext]' },
      },

      // SVGs as React components
      {
        test: /\\.svg$/,
        use: ['@svgr/webpack'],
      },

      // Fonts
      {
        test: /\\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: { filename: 'fonts/[name].[hash:8][ext]' },
      },
    ],
  },
};`}</CodeBlock>

      <InteractiveChallenge
        question="In Webpack 5, what replaces the old file-loader and url-loader?"
        options={[
          "asset-loader (a new unified loader)",
          "Built-in Asset Modules (asset/resource, asset/inline, asset, asset/source)",
          "static-loader from webpack-contrib",
          "The copy-webpack-plugin"
        ]}
        correctIndex={1}
        explanation="Webpack 5 introduced built-in Asset Modules with four types: asset/resource (file-loader), asset/inline (url-loader with limit: Infinity), asset/source (raw-loader), and asset (auto-chooses based on file size)."
      />

      <h2>What's Next</h2>
      <p>
        Loaders transform files, but <strong>plugins</strong> do everything else &mdash;
        optimization, HTML generation, CSS extraction, bundle analysis, and more. Next up,
        we'll cover the essential plugins and code splitting strategies.
      </p>

    </LessonLayout>
  );
}

export default Loaders;
