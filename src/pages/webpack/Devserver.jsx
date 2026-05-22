import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Devserver() {
  return (
    <LessonLayout
      title="Dev Server & HMR"
      sectionId="webpack"
      lessonIndex={4}
      prev={{ path: '/webpack/plugins', label: 'Plugins & Optimization' }}
      next={{ path: '/webpack/advanced', label: 'Advanced Config & Migration' }}
    >
      <h2>webpack-dev-server</h2>
      <p>
        <code>webpack-dev-server</code> is a development server built on Express. It compiles
        your project in memory (no disk writes), serves it over HTTP, and automatically
        refreshes when you change files. It's the Webpack equivalent of Vite's dev server,
        though considerably slower since it bundles everything upfront.
      </p>

      <CodeBlock language="bash" title="Install webpack-dev-server">{`npm install --save-dev webpack-dev-server`}</CodeBlock>

      <CodeBlock language="javascript" title="Basic devServer Configuration">{`// webpack.config.js
module.exports = {
  // ... entry, output, module, etc.

  devServer: {
    // Port to serve on
    port: 3000,

    // Open browser automatically
    open: true,

    // Enable Hot Module Replacement
    hot: true,

    // Serve index.html for all routes (SPA support)
    // Without this, /dashboard would 404 instead of loading your React app
    historyApiFallback: true,

    // Enable gzip compression for faster transfers
    compress: true,

    // Show build errors as a full-screen overlay
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },

    // Static files directory (for files not processed by Webpack)
    static: {
      directory: path.resolve(__dirname, 'public'),
    },
  },
};`}</CodeBlock>

      <CodeBlock language="json" title="package.json Scripts">{`{
  "scripts": {
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production"
  }
}`}</CodeBlock>

      <InfoBox variant="info" title="In-Memory Builds">
        webpack-dev-server compiles your entire bundle into memory &mdash; it never writes
        to <code>dist/</code>. This is faster than disk writes, but it means a full rebundle
        on every change. Vite avoids this by serving individual files via native ESM.
      </InfoBox>

      {/* ── HMR ──────────────────────────────────────────── */}
      <h2>Hot Module Replacement (HMR)</h2>
      <p>
        HMR updates changed modules <em>in place</em> without a full page reload. Your app
        state, scroll position, and form inputs are preserved. This is the same concept
        behind Vite's fast refresh.
      </p>

      <FlowChart
        title="HMR Flow"
        chart={"graph TD\n  A[File Changed] --> B[Webpack Recompiles Module]\n  B --> C[HMR Runtime Notified via WebSocket]\n  C --> D[New Module Sent to Browser]\n  D --> E{Module Accepts Update?}\n  E -->|Yes| F[Replace Module In Place]\n  E -->|No| G[Full Page Reload]\n  F --> H[UI Updates Without Losing State]"}
      />

      <h3>How HMR Works Under the Hood</h3>
      <ol>
        <li>webpack-dev-server opens a WebSocket connection to the browser</li>
        <li>When you save a file, Webpack recompiles only the changed module and its dependents</li>
        <li>The server sends a "hot update" notification over the WebSocket</li>
        <li>The HMR runtime in the browser fetches the updated module</li>
        <li>If the module (or its parent) has a <code>module.hot.accept()</code> handler, the update is applied in place</li>
        <li>If no handler exists, HMR falls back to a full page reload</li>
      </ol>

      <h3>React Fast Refresh (HMR for React)</h3>
      <p>
        Raw HMR doesn't know about React components. <code>react-refresh-webpack-plugin</code>
        adds React-specific HMR that preserves component state during updates &mdash; the same
        mechanism Vite uses via <code>@vitejs/plugin-react</code>.
      </p>

      <CodeBlock language="bash" title="Install React Fast Refresh">{`npm install --save-dev @pmmmwh/react-refresh-webpack-plugin react-refresh`}</CodeBlock>

      <CodeBlock language="javascript" title="React HMR Setup">{`const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',

  plugins: [
    // Only enable in development
    isDevelopment && new ReactRefreshPlugin(),
  ].filter(Boolean),

  module: {
    rules: [
      {
        test: /\\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
            plugins: [
              // Add react-refresh Babel plugin in development
              isDevelopment && require.resolve('react-refresh/babel'),
            ].filter(Boolean),
          },
        },
      },
    ],
  },

  devServer: {
    hot: true,
    port: 3000,
    historyApiFallback: true,
  },
};`}</CodeBlock>

      <InfoBox variant="tip" title="State Preservation">
        React Fast Refresh preserves <code>useState</code> and <code>useRef</code> values
        when you edit a component. It only resets state when you change a component's hooks
        structure (add/remove a hook). This matches Vite's behavior exactly.
      </InfoBox>

      {/* ── PROXY ────────────────────────────────────────── */}
      <h2>Proxy Configuration</h2>
      <p>
        During development, your React app runs on <code>localhost:3000</code> but your API
        might be on <code>localhost:3001</code>. The proxy config routes API requests through
        the dev server, avoiding CORS issues:
      </p>

      <CodeBlock language="javascript" title="devServer.proxy Configuration">{`module.exports = {
  devServer: {
    port: 3000,
    proxy: [
      {
        // Route /api requests to your backend
        context: ['/api'],
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Optional: rewrite paths
        // pathRewrite: { '^/api': '' },
      },
      {
        // WebSocket proxy (for real-time features)
        context: ['/ws'],
        target: 'ws://localhost:3001',
        ws: true,
      },
    ],
  },
};

// Now in your React code:
// fetch('/api/users')  →  proxied to http://localhost:3001/api/users
// No CORS issues, no absolute URLs in development`}</CodeBlock>

      {/* ── SOURCE MAPS ──────────────────────────────────── */}
      <h2>Source Maps</h2>
      <p>
        Source maps connect your bundled/minified code back to the original source, so you
        can debug in the browser with readable file names and line numbers.
      </p>

      <CodeBlock language="javascript" title="devtool Options">{`module.exports = {
  // Choose a devtool option for source maps
  devtool: 'eval-source-map',  // Recommended for development
};`}</CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>devtool</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Build Speed</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Rebuild Speed</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Quality</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>eval</code></td>
            <td style={{ padding: '8px' }}>Fastest</td>
            <td style={{ padding: '8px' }}>Fastest</td>
            <td style={{ padding: '8px' }}>Low (generated code)</td>
            <td style={{ padding: '8px' }}>Quick iteration</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>eval-source-map</code></td>
            <td style={{ padding: '8px' }}>Slow</td>
            <td style={{ padding: '8px' }}>Fast</td>
            <td style={{ padding: '8px' }}>High (original source)</td>
            <td style={{ padding: '8px' }}>Development (recommended)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>cheap-module-source-map</code></td>
            <td style={{ padding: '8px' }}>Medium</td>
            <td style={{ padding: '8px' }}>Medium</td>
            <td style={{ padding: '8px' }}>Medium (line-only)</td>
            <td style={{ padding: '8px' }}>Large projects (dev)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>source-map</code></td>
            <td style={{ padding: '8px' }}>Slowest</td>
            <td style={{ padding: '8px' }}>Slowest</td>
            <td style={{ padding: '8px' }}>Highest</td>
            <td style={{ padding: '8px' }}>Production (full maps)</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}><code>hidden-source-map</code></td>
            <td style={{ padding: '8px' }}>Slowest</td>
            <td style={{ padding: '8px' }}>Slowest</td>
            <td style={{ padding: '8px' }}>Highest</td>
            <td style={{ padding: '8px' }}>Production (upload to error tracker)</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Never Expose Source Maps in Production">
        <code>source-map</code> generates a separate <code>.map</code> file that anyone
        can download, exposing your source code. Use <code>hidden-source-map</code> if you
        need maps for error tracking (Sentry, Datadog) but don't want them publicly accessible.
      </InfoBox>

      {/* ── MULTI-CONFIG PATTERN ─────────────────────────── */}
      <h2>Environment-Specific Configs</h2>
      <p>
        Real projects use separate config files for development and production, sharing
        common settings via <code>webpack-merge</code>. This is the pattern used by CRA
        and most enterprise setups:
      </p>

      <CodeBlock language="bash" title="Install webpack-merge">{`npm install --save-dev webpack-merge`}</CodeBlock>

      <CodeBlock language="javascript" title="webpack.common.js — Shared Config">{`const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.jsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  module: {
    rules: [
      {
        test: /\\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\\.(png|jpg|gif|webp|svg)$/,
        type: 'asset',
      },
      {
        test: /\\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};`}</CodeBlock>

      <CodeBlock language="javascript" title="webpack.dev.js — Development Config">{`const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',

  // CSS in dev: inject via style-loader for HMR
  module: {
    rules: [
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  plugins: [
    new ReactRefreshPlugin(),
  ],

  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3001',
      },
    ],
  },
});`}</CodeBlock>

      <CodeBlock language="javascript" title="webpack.prod.js — Production Config">{`const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'hidden-source-map',

  output: {
    filename: '[name].[contenthash].js',
  },

  // CSS in prod: extract to separate files
  module: {
    rules: [
      {
        test: /\\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: true },
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
          chunks: 'all',
        },
      },
    },
    runtimeChunk: 'single',
  },
});`}</CodeBlock>

      <CodeBlock language="json" title="package.json Scripts">{`{
  "scripts": {
    "dev": "webpack serve --config webpack.dev.js",
    "build": "webpack --config webpack.prod.js",
    "analyze": "ANALYZE=true webpack --config webpack.prod.js"
  }
}`}</CodeBlock>

      <InteractiveChallenge
        question="Why does historyApiFallback: true matter for single-page apps?"
        options={[
          "It enables browser back/forward button support",
          "It serves index.html for all routes so client-side routing works on refresh",
          "It caches navigation history for faster page loads",
          "It enables the History API polyfill for older browsers"
        ]}
        correctIndex={1}
        explanation="Without historyApiFallback, navigating to /dashboard and refreshing the page would return a 404 because no dashboard.html file exists. With it enabled, the dev server serves index.html for all routes, letting React Router handle routing client-side."
      />

      {/* ── OTHER DEV FEATURES ───────────────────────────── */}
      <h2>Other Development Features</h2>

      <h3>Watch Mode (Without Dev Server)</h3>
      <p>
        If you don't need a dev server (e.g., building a library), use watch mode to
        automatically rebuild on file changes:
      </p>
      <CodeBlock language="bash" title="Watch Mode">{`# Rebuilds automatically when files change
webpack --watch --mode development

# Or in config:
# module.exports = { watch: true }`}</CodeBlock>

      <h3>Stats Output Customization</h3>
      <p>
        Control what Webpack logs during builds:
      </p>
      <CodeBlock language="javascript" title="Stats Configuration">{`module.exports = {
  stats: {
    // Presets: 'errors-only', 'minimal', 'normal', 'verbose'
    preset: 'errors-warnings',

    // Or customize individually:
    assets: true,
    chunks: false,
    modules: false,
    colors: true,
    timings: true,
  },

  // Dev server has its own stats config
  devServer: {
    client: {
      logging: 'warn',  // 'none', 'error', 'warn', 'info', 'log', 'verbose'
    },
  },
};`}</CodeBlock>

      <h3>Error Overlay</h3>
      <p>
        webpack-dev-server displays build errors as a full-screen overlay in the browser.
        This is enabled by default. You can customize it:
      </p>
      <CodeBlock language="javascript" title="Error Overlay">{`devServer: {
  client: {
    overlay: {
      errors: true,       // Show compilation errors
      warnings: false,    // Don't show warnings (too noisy)
      runtimeErrors: true, // Show uncaught runtime errors
    },
  },
}`}</CodeBlock>

      <InfoBox variant="tip" title="Dev Server Performance">
        If your dev server feels slow, try these quick wins: enable filesystem caching
        (<code>cache: {'{ type: "filesystem" }'}</code>), use <code>swc-loader</code> or
        <code>esbuild-loader</code> instead of Babel, and narrow your <code>module.rules</code>
        test patterns to avoid processing unnecessary files.
      </InfoBox>

      <h2>What's Next</h2>
      <p>
        You now have a complete development environment. In the final lesson, we'll cover
        advanced topics: Module Federation for micro-frontends, performance optimization
        deep dives, a complete production config, and migration guides for CRA and Vite.
      </p>

    </LessonLayout>
  );
}

export default Devserver;
