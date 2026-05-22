import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function WpLoaders() {
  return (
    <LessonLayout
      title="Loaders"
      sectionId="webpack"
      lessonIndex={2}
      prev={{ path: '/webpack/core', label: 'Core Concepts' }}
      next={{ path: '/webpack/plugins', label: 'Plugins' }}
    >
      <h2>What are Loaders?</h2>
      <p>
        Webpack natively understands only JavaScript and JSON. Loaders transform other file types
        (TypeScript, CSS, images, SVG) into modules that Webpack can add to the dependency graph.
      </p>

      <CodeBlock language="javascript" title="Loader syntax in webpack.config.js">
{`module.exports = {
  module: {
    rules: [
      {
        test: /\\.tsx?$/,            // which files to process
        use: 'ts-loader',           // which loader to use
        exclude: /node_modules/,    // skip node_modules
      },
      {
        test: /\\.css$/,
        use: [                      // array = chain (right to left)
          'style-loader',           // 3rd: inject <style> into DOM
          'css-loader',             // 2nd: resolve @import and url()
          'postcss-loader',         // 1st: process PostCSS plugins
        ],
      },
    ],
  },
}`}
      </CodeBlock>

      <h2>JavaScript — babel-loader</h2>

      <CodeBlock language="javascript" title="babel-loader for JS/JSX">
{`// Install
// npm install --save-dev babel-loader @babel/core
// npm install --save-dev @babel/preset-env @babel/preset-react @babel/preset-typescript

module.exports = {
  module: {
    rules: [
      {
        test: /\\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,   // cache transpilation results
          },
        },
      },
    ],
  },
}

// babel.config.json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": "> 0.25%, not dead",
      "useBuiltIns": "usage",         // add polyfills as needed
      "corejs": 3
    }],
    ["@babel/preset-react", {
      "runtime": "automatic"          // no need to import React
    }],
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-proposal-decorators"
  ]
}`}
      </CodeBlock>

      <h2>TypeScript — ts-loader / swc-loader</h2>

      <CodeBlock language="javascript" title="TypeScript loaders comparison">
{`// Option 1: ts-loader (type checking + transpile)
// npm install --save-dev ts-loader typescript

{
  test: /\\.tsx?$/,
  use: [{
    loader: 'ts-loader',
    options: {
      transpileOnly: true,    // faster: skip type checking
      happyPackMode: true,    // for parallel compilation
    },
  }],
  exclude: /node_modules/,
}

// Option 2: babel-loader + @babel/preset-typescript
// Faster but NO type checking (run tsc --noEmit separately)

// Option 3: swc-loader (Rust-based, fastest)
// npm install --save-dev swc-loader @swc/core

{
  test: /\\.(ts|tsx)$/,
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
}`}
      </CodeBlock>

      <h2>CSS Loaders</h2>

      <CodeBlock language="javascript" title="CSS, SCSS, and CSS Modules">
{`// npm install --save-dev css-loader style-loader
// npm install --save-dev mini-css-extract-plugin (for prod)
// npm install --save-dev sass-loader sass
// npm install --save-dev postcss-loader autoprefixer

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  module: {
    rules: [
      // Regular CSS
      {
        test: /\\.css$/,
        exclude: /\\.module\\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },

      // CSS Modules
      {
        test: /\\.module\\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: isDev
                  ? '[local]--[hash:base64:5]'
                  : '[hash:base64:8]',
              },
            },
          },
        ],
      },

      // SCSS
      {
        test: /\\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [
    !isDev && new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
    }),
  ].filter(Boolean),
}`}
      </CodeBlock>

      <h2>Asset Modules (Webpack 5)</h2>

      <CodeBlock language="javascript" title="Images, fonts, and files">
{`// Webpack 5 built-in asset handling (no loader needed!)

module.exports = {
  module: {
    rules: [
      // Images: inline small ones as base64, emit larger ones as files
      {
        test: /\\.(png|jpg|gif|webp)$/i,
        type: 'asset',                  // auto: inline if < 8kb, else file
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024,          // 8kb threshold
          },
        },
      },

      // SVG: always inline as data URL
      {
        test: /\\.svg$/,
        type: 'asset/inline',
      },

      // Fonts: always emit as separate file
      {
        test: /\\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash:8][ext]',
        },
      },

      // Text files: import as string
      {
        test: /\\.txt$/,
        type: 'asset/source',
      },
    ],
  },
}`}
      </CodeBlock>

      <h2>Loader Order (Right to Left)</h2>

      <CodeBlock language="javascript" title="Understanding loader chaining">
{`// Loaders in 'use' array execute RIGHT to LEFT (bottom to top)
{
  test: /\\.scss$/,
  use: [
    'style-loader',   // 3. Inject into DOM
    'css-loader',     // 2. Resolve imports, CSS Modules
    'postcss-loader', // 1. Run PostCSS (autoprefixer etc.)
    'sass-loader',    // 0. Compile SCSS → CSS  ← runs first!
  ],
}

// Mnemonic: read from bottom to top
// SCSS → (sass-loader) → CSS
// CSS → (postcss-loader) → processed CSS
// processed CSS → (css-loader) → JS module
// JS module → (style-loader) → injected <style> tag`}
      </CodeBlock>

      <InfoBox variant="tip" title="style-loader vs MiniCssExtractPlugin">
        <p>
          Use <code>style-loader</code> in development — it injects CSS via <code>&lt;style&gt;</code> tags
          which enables HMR for CSS changes. Use <code>MiniCssExtractPlugin.loader</code> in production —
          it extracts CSS into separate <code>.css</code> files that can be cached and loaded in parallel
          with JavaScript.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="When Webpack processes CSS with ['style-loader', 'css-loader'], which loader runs first?"
        options={[
          "style-loader runs first (left to right)",
          "css-loader runs first (loaders execute right to left)",
          "Both run simultaneously in parallel",
          "The order does not matter for CSS loaders"
        ]}
        correctIndex={1}
        explanation="Webpack executes loaders in the 'use' array from right to left (or bottom to top). So css-loader runs first — it resolves @import statements and url() references, turning CSS into a JavaScript module. Then style-loader runs, taking that JavaScript module and injecting a <style> tag into the DOM. The order matters: style-loader needs the JavaScript module that css-loader produces."
      />

      <InteractiveChallenge
        question="What is 'type: asset' (Webpack 5 asset modules) and what does it replace?"
        options={[
          "It replaces the TypeScript loader for asset types",
          "It is Webpack 5's built-in way to handle files, replacing file-loader, url-loader, and raw-loader",
          "It defines the output type for CSS modules",
          "It is a new way to define module aliases"
        ]}
        correctIndex={1}
        explanation="Webpack 5 introduced asset modules as a first-class way to handle files, replacing the need for separate loaders. 'asset/resource' replaces file-loader (emits a file), 'asset/inline' replaces url-loader with limit: Infinity (always base64), 'asset/source' replaces raw-loader (imports as string), and 'asset' (auto) replaces url-loader with a size threshold. No installation needed — it's built into Webpack 5."
      />
    </LessonLayout>
  );
}
