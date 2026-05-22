import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function WpPlugins() {
  return (
    <LessonLayout
      title="Plugins"
      sectionId="webpack"
      lessonIndex={3}
      prev={{ path: '/webpack/loaders', label: 'Loaders' }}
      next={{ path: '/webpack/devserver', label: 'Dev Server & HMR' }}
    >
      <h2>What are Plugins?</h2>
      <p>
        While loaders transform individual files, plugins hook into the entire build pipeline.
        They can generate HTML, extract CSS, analyze bundles, inject environment variables, and much more.
      </p>

      <CodeBlock language="javascript" title="Plugin anatomy">
{`// Plugins are instantiated with 'new'
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' }),
  ],
}`}
      </CodeBlock>

      <h2>HtmlWebpackPlugin</h2>

      <CodeBlock language="javascript" title="Generating HTML with HtmlWebpackPlugin">
{`// npm install --save-dev html-webpack-plugin

const HtmlWebpackPlugin = require('html-webpack-plugin')

new HtmlWebpackPlugin({
  template: './public/index.html',     // use a custom HTML template
  filename: 'index.html',              // output filename
  title: 'My App',                     // available as <%= htmlWebpackPlugin.options.title %>
  favicon: './public/favicon.ico',     // inject favicon

  // Minify in production
  minify: {
    removeComments: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
  },

  // Multiple HTML files (for multi-page apps)
  chunks: ['app'],                     // only inject these entry chunks
})

// Multiple pages:
plugins: [
  new HtmlWebpackPlugin({ template: './src/index.html', chunks: ['app'] }),
  new HtmlWebpackPlugin({
    template: './src/admin.html',
    filename: 'admin.html',
    chunks: ['admin'],
  }),
]`}
      </CodeBlock>

      <h2>MiniCssExtractPlugin</h2>

      <CodeBlock language="javascript" title="Extracting CSS to separate files">
{`// npm install --save-dev mini-css-extract-plugin css-minimizer-webpack-plugin

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
  module: {
    rules: [
      {
        test: /\\.css$/,
        use: [
          MiniCssExtractPlugin.loader,  // extract instead of style-loader
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[id].[contenthash:8].css',
    }),
  ],
  optimization: {
    minimizer: [
      '...',                            // keep default JS minimizer
      new CssMinimizerPlugin(),         // add CSS minimizer
    ],
  },
}`}
      </CodeBlock>

      <h2>WebpackBundleAnalyzer</h2>

      <CodeBlock language="javascript" title="Analyzing bundle size">
{`// npm install --save-dev webpack-bundle-analyzer

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  plugins: [
    // Only run when ANALYZE=true
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'server',     // open browser with interactive treemap
      // analyzerMode: 'static',  // generate static HTML file
      openAnalyzer: true,
    }),
  ].filter(Boolean),
}

// Run with:
// ANALYZE=true npm run build`}
      </CodeBlock>

      <h2>Tree Shaking Configuration</h2>

      <CodeBlock language="javascript" title="Ensuring tree shaking works">
{`// Tree shaking requires:
// 1. mode: 'production' (enables usedExports)
// 2. ES Modules (import/export)
// 3. sideEffects: false in package.json (or your own webpack config)

module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,           // mark unused exports
    sideEffects: true,           // respect sideEffects in package.json
    minimize: true,              // Terser removes dead code
  },
}

// Mark your app's modules as side-effect free:
// package.json:
{ "sideEffects": ["*.css", "src/setup.js"] }

// Verify tree shaking worked:
// Look for "/* unused harmony export */" comments in build output
// or check bundle analyzer — unused exports should be absent`}
      </CodeBlock>

      <h2>DefinePlugin and EnvironmentPlugin</h2>

      <CodeBlock language="javascript" title="Injecting environment variables">
{`const { DefinePlugin, EnvironmentPlugin } = require('webpack')

module.exports = {
  plugins: [
    // DefinePlugin: literal text replacement at compile time
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3000'),
      __VERSION__: JSON.stringify('1.0.0'),
      __DEV__: process.env.NODE_ENV !== 'production',
    }),

    // EnvironmentPlugin: shorthand for process.env.* variables
    new EnvironmentPlugin({
      NODE_ENV: 'development',   // default value
      API_URL: null,             // required (null = no default, fails if unset)
    }),
  ],
}

// In code — Webpack replaces these at build time:
if (process.env.NODE_ENV === 'production') {
  // This block is removed in development builds
}
const apiUrl = process.env.API_URL  // replaced with literal string`}
      </CodeBlock>

      <h2>CopyPlugin and other Utilities</h2>

      <CodeBlock language="javascript" title="Utility plugins">
{`// npm install --save-dev copy-webpack-plugin
const CopyPlugin = require('copy-webpack-plugin')

// npm install --save-dev clean-webpack-plugin (or use output.clean: true)
// npm install --save-dev compression-webpack-plugin

const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  plugins: [
    // Copy static assets (e.g., public/ → dist/)
    new CopyPlugin({
      patterns: [
        { from: 'public', to: 'dist', globOptions: { ignore: ['**/index.html'] } },
        { from: 'src/assets/icons', to: 'icons' },
      ],
    }),

    // Generate gzip/brotli compressed versions of bundles
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\\.(js|css|html)$/,
      threshold: 10240,   // only compress files > 10kb
      minRatio: 0.8,
    }),
  ],
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Conditional Plugins">
        <p>
          Use <code>.filter(Boolean)</code> to conditionally include plugins based on environment:
        </p>
        <code>{'plugins: [isProd && new MiniCssExtractPlugin(), isDev && new HotModuleReplacementPlugin()].filter(Boolean)'}</code>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between Webpack Loaders and Plugins?"
        options={[
          "Loaders process JavaScript files; plugins process other file types",
          "Loaders transform individual file types; plugins extend the entire build pipeline and can do anything",
          "Plugins run before loaders in the build process",
          "Loaders are only for development; plugins work in both environments"
        ]}
        correctIndex={1}
        explanation="Loaders transform specific file types as they are added to the module graph — they operate at the file level. Plugins tap into Webpack's compiler events (emit, optimize, done, etc.) and can do things impossible with loaders: generating HTML, extracting CSS, analyzing the complete bundle graph, injecting variables, or writing custom output files. Plugins have access to the entire compilation lifecycle."
      />

      <InteractiveChallenge
        question="How does DefinePlugin inject process.env.NODE_ENV into your code?"
        options={[
          "It sets an actual environment variable before running Node.js",
          "It performs compile-time text replacement — replacing the expression with a literal string in the output",
          "It reads the .env file and creates a runtime global object",
          "It wraps your code in a closure with the variable set"
        ]}
        correctIndex={1}
        explanation="DefinePlugin does compile-time text substitution. When it sees 'process.env.NODE_ENV' in your source code, it replaces it with the literal string (e.g., 'production'). This allows minifiers like Terser to then eliminate dead code branches: if('production' === 'development') becomes unreachable and is removed entirely. The actual process.env object is not set at runtime."
      />
    </LessonLayout>
  );
}
