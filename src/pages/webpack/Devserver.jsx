import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function WpDevserver() {
  return (
    <LessonLayout
      title="Dev Server & HMR"
      sectionId="webpack"
      lessonIndex={4}
      prev={{ path: '/webpack/plugins', label: 'Plugins' }}
      next={{ path: '/webpack/advanced', label: 'Advanced Webpack' }}
    >
      <h2>webpack-dev-server</h2>
      <p>
        webpack-dev-server provides a development HTTP server with live reloading and HMR.
        It serves bundles from memory (not disk) for speed and automatically rebuilds on file changes.
      </p>

      <CodeBlock language="bash" title="Installation">
{`npm install --save-dev webpack-dev-server

# Start the dev server
npx webpack serve
# or via package.json script:
# "start": "webpack serve --mode development"

# Note: webpack-dev-server v4+ uses webpack CLI plugin:
# "start": "webpack serve"  (not "webpack-dev-server")`}
      </CodeBlock>

      <h2>devServer Configuration</h2>

      <CodeBlock language="javascript" title="webpack.config.js devServer">
{`module.exports = {
  devServer: {
    // Port and host
    port: 3000,
    host: 'localhost',      // or '0.0.0.0' to expose to network
    open: true,             // auto-open browser
    https: false,           // enable HTTPS with self-signed cert

    // Hot Module Replacement
    hot: true,              // enable HMR (default in dev)
    liveReload: true,       // full page reload as fallback

    // Static file serving
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
    },

    // History API fallback (for React Router BrowserRouter)
    historyApiFallback: true,

    // API proxy (avoid CORS in development)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Rewrite path: /api/users → /users
        pathRewrite: { '^/api': '' },
      },
      '/graphql': 'http://localhost:4000',
    },

    // Compression
    compress: true,

    // Headers
    headers: {
      'Access-Control-Allow-Origin': '*',
    },

    // Client (browser) configuration
    client: {
      overlay: {          // show errors in browser overlay
        warnings: false,
        errors: true,
      },
      progress: true,     // show compilation progress in browser
    },
  },
}`}
      </CodeBlock>

      <h2>Hot Module Replacement (HMR)</h2>
      <p>
        HMR updates modules in the browser without a full page reload, preserving application state.
        React's Fast Refresh extends HMR to preserve component state.
      </p>

      <CodeBlock language="javascript" title="Enabling HMR with React">
{`// webpack.config.js
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const ReactRefreshBabelPlugin = require('react-refresh/babel')

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development'

  return {
    module: {
      rules: [
        {
          test: /\\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              plugins: [
                isDev && ReactRefreshBabelPlugin,
              ].filter(Boolean),
            },
          },
        },
      ],
    },
    plugins: [
      isDev && new ReactRefreshPlugin(),
    ].filter(Boolean),
  }
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Manual HMR API">
{`// Accept HMR updates for specific modules
if (module.hot) {
  module.hot.accept('./math.js', function() {
    // Re-execute when math.js changes
    const newMath = require('./math.js')
    updateCalculator(newMath)
  })

  // Dispose: clean up before a module is replaced
  module.hot.dispose((data) => {
    clearInterval(data.timer)
    data.timer = null
  })

  // Accept all — accept updates for current module and all deps
  module.hot.accept()
}

// React Fast Refresh does this automatically for components
// You only need manual HMR for: non-React modules with side effects`}
      </CodeBlock>

      <h2>Source Maps</h2>

      <CodeBlock language="javascript" title="Source map configuration">
{`// Development: fast source maps for error messages
module.exports = {
  devtool: 'eval-source-map',      // fast, accurate, dev only

  // Options ranked by build speed (fastest first):
  // 'eval'                 → no source maps, fastest rebuild
  // 'eval-cheap-source-map' → lines only, fast rebuild
  // 'eval-source-map'      → full, ~1.5x slower rebuild
  // 'cheap-source-map'     → lines only, slower initial build
  // 'source-map'           → full, slowest (prod quality)
}

// Production: external source maps (upload to error tracking)
module.exports = {
  devtool: 'source-map',           // generates .js.map files
  // or 'hidden-source-map'        → doesn't expose URL in bundle
  // or false                      → no source maps (smallest output)
}

// Tip: upload source maps to Sentry/Datadog, then exclude from deploy
// Use SourceMapDevToolPlugin for finer control`}
      </CodeBlock>

      <h2>Proxy Configuration Patterns</h2>

      <CodeBlock language="javascript" title="Advanced proxy config">
{`devServer: {
  proxy: {
    // Simple proxy
    '/api': 'http://localhost:8080',

    // With options
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,           // changes origin to target
      secure: false,                // allow self-signed certs
      logLevel: 'debug',
    },

    // WebSocket proxy (for Socket.io etc.)
    '/socket.io': {
      target: 'http://localhost:8080',
      ws: true,
    },

    // Multiple paths to same target
    context: ['/api', '/auth'],
    target: 'http://localhost:8080',

    // Custom function for complex routing
    router: (req) => {
      if (req.hostname === 'admin.localhost') {
        return 'http://localhost:8090'
      }
      return 'http://localhost:8080'
    },
  },
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="historyApiFallback for React Router">
        <p>
          If you use React Router with <code>BrowserRouter</code>, always set <code>historyApiFallback: true</code>
          in devServer. Without it, refreshing the page on a route like <code>/dashboard</code> returns a 404
          because the dev server tries to find a <code>dashboard</code> file. With this option enabled, it
          serves <code>index.html</code> for all routes, letting React Router handle navigation.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What does 'historyApiFallback: true' do in webpack-dev-server?"
        options={[
          "It serves a 404 page when a route is not found in webpack's dependency graph",
          "It returns index.html for any 404 response, enabling client-side routing",
          "It enables the browser's history API for source map navigation",
          "It caches all responses in the browser history"
        ]}
        correctIndex={1}
        explanation="historyApiFallback: true makes the dev server return index.html for any request that doesn't match a real file. This is required for single-page apps using the HTML5 History API (React Router BrowserRouter): when you refresh at /dashboard, the server would normally return 404 since there's no actual /dashboard file. With historyApiFallback, the server returns index.html and React Router renders the correct route on the client."
      />

      <InteractiveChallenge
        question="What is the recommended devtool (source map) setting for development?"
        options={[
          "source-map — full source maps with the best accuracy",
          "eval-source-map — fast rebuilds with accurate file and line numbers",
          "false — no source maps for maximum build speed",
          "inline-source-map — embeds source maps in the bundle"
        ]}
        correctIndex={1}
        explanation="'eval-source-map' is the recommended development setting. It provides accurate file names AND line/column numbers for debugging (unlike 'eval-cheap-source-map' which is line-only), while rebuilding much faster than 'source-map' because it uses eval() to generate source maps inline. For production, use 'source-map' (external .map files) or 'hidden-source-map' (no URL in bundle, upload separately to Sentry)."
      />
    </LessonLayout>
  );
}
