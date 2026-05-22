import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function WpCore() {
  return (
    <LessonLayout
      title="Core Concepts"
      sectionId="webpack"
      lessonIndex={1}
      prev={{ path: '/webpack/intro', label: 'Webpack Introduction' }}
      next={{ path: '/webpack/loaders', label: 'Loaders' }}
    >
      <h2>The 5 Core Concepts</h2>
      <p>
        Everything in Webpack revolves around five core concepts: Entry, Output, Loaders, Plugins, and Mode.
        Master these and you can configure any Webpack project.
      </p>

      <FlowChart
        title="Webpack Core Concepts"
        chart={"graph TD\n  A[Entry] --> B[Dependency Graph]\n  B --> C[Loaders - transform files]\n  C --> D[Plugins - extend build]\n  D --> E[Output - write bundles]\n  F[Mode] --> B\n  F --> D\n  F --> E"}
      />

      <h2>Entry</h2>

      <CodeBlock language="javascript" title="Entry configuration">
{`// Single entry (default)
module.exports = {
  entry: './src/index.js',
}

// Multiple entries (separate bundles)
module.exports = {
  entry: {
    app: './src/app.js',
    admin: './src/admin.js',
  },
  output: {
    filename: '[name].bundle.js',   // app.bundle.js, admin.bundle.js
  }
}

// Dynamic entry
module.exports = {
  entry: () => new Promise((resolve) => {
    resolve('./src/index.js')
  }),
}

// Entry with dependencies pre-bundled
module.exports = {
  entry: {
    app: {
      import: './src/index.js',
      dependOn: 'vendor',      // share vendor chunk
    },
    vendor: ['react', 'react-dom'],
  }
}`}
      </CodeBlock>

      <h2>Output</h2>

      <CodeBlock language="javascript" title="Output configuration">
{`const path = require('path')

module.exports = {
  output: {
    // Where to write bundles
    path: path.resolve(__dirname, 'dist'),

    // Filename template
    filename: '[name].[contenthash:8].js',  // hash changes when content changes
    // [name] = chunk name (e.g., "main")
    // [contenthash] = hash of content
    // [chunkhash] = hash of chunk
    // [id] = module id
    // [ext] = file extension

    // Chunk filename (dynamically imported chunks)
    chunkFilename: '[name].[contenthash:8].chunk.js',

    // Asset filename (images, fonts)
    assetModuleFilename: 'assets/[name].[contenthash:8][ext]',

    // Public URL prefix for assets in HTML
    publicPath: '/',           // or '/app/' for subdirectory
    // or 'auto' for automatic detection

    // Clean output directory before build
    clean: true,

    // For libraries: expose as global variable
    library: {
      name: 'MyLibrary',
      type: 'umd',             // universal: cjs, amd, and global
    },
  }
}`}
      </CodeBlock>

      <h2>Mode</h2>

      <CodeBlock language="javascript" title="Mode configuration">
{`// mode: 'production'
// - Enables: minification (Terser), tree shaking, scope hoisting
// - Sets process.env.NODE_ENV = 'production'
// - Disables: source maps by default

// mode: 'development'
// - Enables: useful error messages, eval source maps (fast)
// - Sets process.env.NODE_ENV = 'development'
// - Disables: minification, tree shaking

// mode: 'none'
// - No built-in optimizations

// In webpack.config.js
module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'

  return {
    mode: argv.mode || 'development',
    devtool: isProd ? 'source-map' : 'eval-source-map',
    optimization: {
      minimize: isProd,
    }
  }
}

// Set via CLI
npx webpack --mode production
npx webpack --mode development`}
      </CodeBlock>

      <h2>Resolve</h2>

      <CodeBlock language="javascript" title="Module resolution configuration">
{`module.exports = {
  resolve: {
    // File extensions to try (in order)
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],

    // Path aliases (equivalent to Vite's resolve.alias)
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },

    // Where to look for modules (default: node_modules)
    modules: ['node_modules', path.resolve(__dirname, 'src')],

    // Prefer ESM builds
    mainFields: ['browser', 'module', 'main'],

    // Resolve symlinks (pnpm uses symlinks)
    symlinks: true,
  }
}`}
      </CodeBlock>

      <h2>Optimization</h2>

      <CodeBlock language="javascript" title="Optimization settings">
{`module.exports = {
  optimization: {
    // Enable tree shaking (removes unused code)
    usedExports: true,

    // Minify JavaScript
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],

    // Code splitting: extract common dependencies
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendor',
          chunks: 'all',
        },
      },
    },

    // Single runtime chunk shared across all bundles
    runtimeChunk: 'single',
  },
}`}
      </CodeBlock>

      <h2>Environment Variables</h2>

      <CodeBlock language="javascript" title="DefinePlugin for env vars">
{`const { DefinePlugin } = require('webpack')

module.exports = {
  plugins: [
    new DefinePlugin({
      // String values must be JSON.stringified
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.API_URL': JSON.stringify(process.env.API_URL),
      __DEV__: process.env.NODE_ENV !== 'production',
      __VERSION__: JSON.stringify(require('./package.json').version),
    }),
  ],
}

// In code:
if (__DEV__) {
  console.log('Debug mode')
}
fetch(process.env.API_URL + '/users')

// Better: use dotenv-webpack
const Dotenv = require('dotenv-webpack')
plugins: [new Dotenv()]`}
      </CodeBlock>

      <InfoBox variant="tip" title="contenthash vs chunkhash">
        <p>
          Use <code>[contenthash]</code> (not <code>[hash]</code> or <code>[chunkhash]</code>) for long-term caching.
          <code>contenthash</code> changes only when the file's content changes. If you update app code but not
          vendor code, only the app chunk's hash changes — browsers can cache vendor chunks indefinitely.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"What does 'splitChunks: { chunks: \"all\" }' do in Webpack's optimization config?"}
        options={[
          "Splits every module into its own file",
          "Extracts shared dependencies into separate chunks that can be cached independently",
          "Disables code splitting and bundles everything into one file",
          "Only splits async dynamic import() chunks"
        ]}
        correctIndex={1}
        explanation="splitChunks extracts modules shared between multiple bundles (like React, lodash) into separate cache groups. With chunks: 'all', this applies to both async (dynamic imports) and initial (entry point) chunks. The result: a small app bundle + a vendor bundle. On subsequent visits, the browser caches the vendor bundle (which rarely changes) and only re-downloads the app bundle when your code changes."
      />

      <InteractiveChallenge
        question="Why should you use '[contenthash]' in output filenames for production builds?"
        options={[
          "It prevents filename collisions between different builds",
          "It enables long-term browser caching — files only change names when their content changes",
          "It reduces bundle size by deduplicating content",
          "It is required for Module Federation to work"
        ]}
        correctIndex={1}
        explanation="Content hashes (e.g., main.a1b2c3d4.js) enable aggressive browser caching. You can serve these files with 'Cache-Control: max-age=31536000, immutable' — browsers cache them forever. When you deploy a new build, only changed files get new hashes, so browsers re-download only what changed. Without content hashes, you must either not cache files or clear caches manually, hurting performance."
      />
    </LessonLayout>
  );
}
