import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function WpIntro() {
  return (
    <LessonLayout
      title="Webpack Introduction"
      sectionId="webpack"
      lessonIndex={0}
      prev={null}
      next={{ path: '/webpack/core', label: 'Core Concepts' }}
    >
      <h2>What is Webpack?</h2>
      <p>
        Webpack is a static module bundler for JavaScript applications. It builds a dependency graph of
        all modules and creates one or more optimized bundles. While Vite has largely replaced it for new
        projects, Webpack remains dominant in large enterprise apps.
      </p>

      <FlowChart
        title="Webpack Bundling Process"
        chart={"graph LR\n  A[Entry Point] --> B[Dependency Graph]\n  B --> C[Loaders]\n  C --> D[JS Transform]\n  C --> E[CSS Transform]\n  C --> F[Asset Transform]\n  D --> G[Plugins]\n  E --> G\n  F --> G\n  G --> H[Output Bundle]"}
      />

      <h2>Why Webpack Still Matters</h2>

      <CodeBlock language="javascript" title="Webpack strengths">
{`// Webpack excels at:
// ✓ Large enterprise apps with complex build requirements
// ✓ Mature plugin ecosystem (10+ years)
// ✓ Module Federation (microfrontend architecture)
// ✓ Used by: CRA, Next.js <12, Angular CLI, Vue CLI 4
// ✓ Granular control over every aspect of the build

// Webpack vs Vite:
// ╔═══════════════╦═══════════════╦═══════════════╗
// ║               ║   Webpack     ║     Vite      ║
// ╠═══════════════╬═══════════════╬═══════════════╣
// ║ Dev start     ║ 30-60s        ║ <1s           ║
// ║ HMR speed     ║ Seconds       ║ <100ms        ║
// ║ Config        ║ Verbose       ║ Minimal       ║
// ║ Plugin eco    ║ Massive       ║ Growing       ║
// ║ Module Fed.   ║ Native        ║ Plugin only   ║
// ║ Stability     ║ Battle-tested ║ Modern        ║
// ╚═══════════════╩═══════════════╩═══════════════╝`}
      </CodeBlock>

      <h2>Installing Webpack</h2>

      <CodeBlock language="bash" title="Setup">
{`# Core packages
npm install --save-dev webpack webpack-cli

# Dev server
npm install --save-dev webpack-dev-server

# React + TypeScript
npm install --save-dev babel-loader @babel/core @babel/preset-env
npm install --save-dev @babel/preset-react @babel/preset-typescript
npm install --save-dev css-loader style-loader
npm install --save-dev html-webpack-plugin

# Check version
npx webpack --version

# Minimal project structure:
# src/
#   index.js       ← entry point
#   App.jsx
# dist/             ← output (gitignored)
# webpack.config.js
# package.json`}
      </CodeBlock>

      <h2>Minimal Configuration</h2>

      <CodeBlock language="javascript" title="webpack.config.js (minimal)">
{`const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  // Entry: where Webpack starts building the graph
  entry: './src/index.js',

  // Output: where to write the bundle
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,          // clean dist/ before each build
  },

  // Mode: enables built-in optimizations
  mode: 'development',    // or 'production'

  // Module: how different files are processed
  module: {
    rules: [
      {
        test: /\\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  // Resolve: how modules are found
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },

  // Plugins: extend Webpack's capabilities
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
}`}
      </CodeBlock>

      <h2>package.json Scripts</h2>

      <CodeBlock language="json" title="Webpack scripts">
{`{
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production",
    "build:analyze": "webpack --mode production --analyze"
  }
}`}
      </CodeBlock>

      <h2>Webpack vs Other Bundlers</h2>

      <CodeBlock language="javascript" title="When to choose which bundler">
{`// Choose Webpack when:
// - Maintaining an existing Webpack project
// - Need Module Federation (microfrontends)
// - Complex custom loaders/plugins in the ecosystem
// - Enterprise requirements for granular control

// Choose Vite when:
// - Starting a new project (React, Vue, Svelte)
// - Fast developer experience is priority
// - Standard build requirements

// Choose Rollup when:
// - Building a library (not an app)
// - Need the best tree-shaking
// - Smaller, cleaner output

// Choose esbuild/tsup when:
// - Building TypeScript libraries
// - Need maximum build speed
// - Simple bundling without complex transforms

// Choose Parcel when:
// - Zero-config is the priority
// - Prototyping/learning projects`}
      </CodeBlock>

      <InfoBox variant="note" title="Webpack 5 vs Webpack 4">
        <p>
          Webpack 5 (2020) introduced: Module Federation, persistent caching, asset modules
          (replacing file-loader/url-loader), improved tree shaking, and Webpack 5 chunk splitting.
          If you are maintaining a Webpack 4 project, most new features and plugins require upgrading to 5.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is Webpack's core concept of a 'dependency graph'?"
        options={[
          "A visual representation of package.json dependencies",
          "Webpack starts from entry points and recursively tracks all imports to build a map of every module needed",
          "A diagram showing which plugins depend on which loaders",
          "The relationship between source files and their TypeScript types"
        ]}
        correctIndex={1}
        explanation="Starting from entry points, Webpack follows every import/require statement to discover all the modules your app uses. It builds a complete graph of these relationships. This graph determines exactly which files to bundle (dead code that's never imported is excluded), in what order to process them, and how to split them into chunks. The graph is the foundation of everything Webpack does."
      />

      <InteractiveChallenge
        question="What is the key feature that keeps Webpack relevant in 2024 despite Vite being faster?"
        options={[
          "Webpack has better TypeScript support",
          "Module Federation — native support for sharing code between independently deployed applications",
          "Webpack produces smaller bundles than Vite",
          "Webpack is the only bundler compatible with npm workspaces"
        ]}
        correctIndex={1}
        explanation="Module Federation (Webpack 5) is Webpack's killer feature. It allows separately deployed applications to share modules at runtime without bundling them together at build time. This is the foundation of micro-frontend architectures where teams deploy independently but share components. While Vite has a Module Federation plugin, Webpack's is the original, most mature, and widely used in large enterprise micro-frontend setups."
      />
    </LessonLayout>
  );
}
