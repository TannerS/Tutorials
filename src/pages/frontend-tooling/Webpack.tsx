import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Webpack() {
  return (
    <LessonLayout
      title="Webpack: Getting Started"
      sectionId="frontend-tooling"
      lessonIndex={1}
      prev={{ path: '/frontend-tooling/vite', label: 'Vite Deep Dive' }}
      next={{ path: '/frontend-tooling/linting', label: 'ESLint & Prettier' }}
    >
      <InfoBox variant="info" title="Practical, Not Exhaustive">
        This lesson is a getting-started tour: enough to read an existing{' '}
        <code>webpack.config.js</code>, write your own for a basic React + TypeScript app, and
        know what dev server and code-splitting options exist. It is not a deep dive into
        webpack's internals or every plugin in the ecosystem.
      </InfoBox>

      <h2>What Webpack Is, and Why It Exists</h2>
      <p>
        Webpack is a <strong>module bundler</strong>. You give it an entry file, it walks every{' '}
        <code>import</code>/<code>require</code> it finds — JS, TS, CSS, images, fonts, whatever
        — builds a dependency graph out of all of it, and emits a small number of optimized
        output files (bundles) that a browser can load. Before bundlers existed, this was
        script tags in a careful hand-maintained order and global variables. Webpack (first
        released in 2012) made "just write modules and let the tool figure out the graph" the
        default way to build a frontend app.
      </p>

      <InfoBox variant="note" title="This Site Runs on Vite — So Why Learn Webpack?">
        This tutorial site is itself built with Vite, and if you're starting a project today
        you'd likely reach for Vite (or a framework's built-in tooling) too. But webpack is far
        from dead: it was the default in Next.js and Angular until Turbopack (Next.js 16, Oct
        2025) and the esbuild/Vite-based <code>@angular/build</code> application builder
        (Angular 17, Nov 2023) took over — you'll still meet it in Next.js and Angular projects
        started before then, Create React App's disappearing but still-deployed apps, and a huge
        share of existing enterprise codebases that predate Vite. You'll run into a{' '}
        <code>webpack.config.js</code> in a real job long before you'll need to write a novel one
        from scratch — this lesson gets you to the point where you can do both.
      </InfoBox>

      <h2>Core Concepts</h2>
      <p>
        Every webpack config, no matter how large, is built from the same five ideas. Get these
        and the rest is just configuration detail.
      </p>

      <FlowChart
        title="Webpack Build Pipeline"
        chart={
          'graph LR\n' +
          '  A[Entry] --> B[Dependency Graph]\n' +
          '  B --> C{File Type?}\n' +
          '  C -->|.ts/.tsx| D[Loaders: ts-loader / babel-loader]\n' +
          '  C -->|.css| E[Loaders: css-loader + style-loader]\n' +
          '  C -->|other| F[Loaders: file-loader / asset modules]\n' +
          '  D --> G[Plugins hook into the build]\n' +
          '  E --> G\n' +
          '  F --> G\n' +
          '  G --> H[Output Bundles]\n' +
          '  H --> I[HtmlWebpackPlugin wires bundles into index.html]'
        }
      />

      <p>
        <strong>Entry</strong> — the file (or files) where webpack starts building the
        dependency graph. Usually your app's top-level module, e.g. <code>./src/index.tsx</code>.
      </p>
      <p>
        <strong>Output</strong> — where webpack writes the bundle(s) it produces, and what to
        name them. In production you typically include a content hash in the filename (
        <code>main.[contenthash].js</code>) for long-term browser caching.
      </p>
      <p>
        <strong>Loaders</strong> — transform non-JS files into modules webpack can add to the
        graph. Webpack natively understands JavaScript; everything else needs a loader.{' '}
        <code>ts-loader</code> or <code>babel-loader</code> compile TypeScript/JSX down to plain
        JS. <code>css-loader</code> resolves <code>@import</code>/<code>url()</code> inside CSS
        and turns a stylesheet into a JS module; <code>style-loader</code> injects that CSS into
        the page via a <code>&lt;style&gt;</code> tag at runtime (fine for dev, wasteful for
        production, where you'd swap in <code>MiniCssExtractPlugin</code> to write real{' '}
        <code>.css</code> files instead).
      </p>
      <p>
        <strong>Plugins</strong> — hook into the broader build lifecycle in ways loaders can't,
        because a loader only ever sees one file at a time. <code>HtmlWebpackPlugin</code>{' '}
        generates an <code>index.html</code> and automatically injects{' '}
        <code>&lt;script&gt;</code> tags for your (hashed) output bundles, so you never
        hand-edit HTML to match a filename. <code>CleanWebpackPlugin</code> (or webpack 5's
        built-in <code>output.clean: true</code>) wipes stale files out of the output directory
        before each build.
      </p>
      <p>
        <strong>Mode</strong> — a single setting, <code>'development'</code> or{' '}
        <code>'production'</code>, that flips a whole bundle of built-in optimizations at once
        rather than you toggling them individually.
      </p>

      <CodeBlock language="text" title="What mode Actually Changes">
{`development                          production
--------------------------------------------------------------
No minification                      Minifies JS (via Terser)
process.env.NODE_ENV = 'development' process.env.NODE_ENV = 'production'
Fast, unoptimized source maps        Full source maps (or none, your choice)
No tree-shaking of dead code         Tree-shakes unused exports
Readable module/chunk names          Shorter, hashed names
Verbose runtime error messages       React strips dev-only warnings`}
      </CodeBlock>

      <p>
        <strong>Tree-shaking</strong> here means removing unused exports from the bundle — it's
        covered in depth in Bundle Analysis & Performance, the last lesson in this section.
      </p>

      <InfoBox variant="warning" title="Mode Is Not Optional">
        If you don't set <code>mode</code>, webpack defaults to <code>'production'</code> and
        prints a warning. Always set it explicitly — most configs derive it from the CLI flag (
        <code>webpack --mode production</code>) via the function form of the config, shown
        below.
      </InfoBox>

      <h2>A Minimal Config for a React + TypeScript App</h2>
      <p>
        Below is a genuinely working config — installed, built, and verified for this lesson
        (webpack 5.109.2, ts-loader 9.6.2, TypeScript 5.9.3). It's the shape you'll actually see
        in a small-to-medium app: one entry point, hashed output, a TS loader rule, a CSS rule,
        and <code>HtmlWebpackPlugin</code> to generate the HTML shell.
      </p>

      <CodeBlock language="bash" title="Install">
{`# Pin TypeScript to 5.x: ts-loader cannot drive the TypeScript 7 native
# compiler, and an unpinned install resolves 7.x today — you get
# "Cannot read properties of undefined (reading 'fileExists')" at build.
npm install --save-dev webpack@5 webpack-cli webpack-dev-server \\
  html-webpack-plugin style-loader css-loader ts-loader typescript@5`}
      </CodeBlock>

      <CodeBlock language="javascript" title="webpack.config.js">
{`const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.tsx',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true, // wipe dist/ before each build (replaces CleanWebpackPlugin)
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },

    module: {
      rules: [
        {
          test: /\\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        title: 'Webpack Demo',
        template: './src/index.html',
      }),
    ],

    devServer: {
      static: './dist',
      hot: true,
      port: 3000,
    },

    devtool: isProduction ? 'source-map' : 'eval-source-map',

    mode: isProduction ? 'production' : 'development',
  };
};`}
      </CodeBlock>

      <p>
        A matching <code>tsconfig.json</code> — <code>ts-loader</code> reads this to know how to
        compile your TypeScript:
      </p>

      <CodeBlock language="json" title="tsconfig.json">
{`{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="babel-loader Is the Other Common Choice">
        <code>ts-loader</code> runs the real TypeScript compiler, so it does full type-checking
        during the build (slower, but catches type errors). <code>babel-loader</code> with{' '}
        <code>@babel/preset-typescript</code> just strips types without checking them (faster,
        relies on your editor or a separate <code>tsc --noEmit</code> step for type safety).
        Large codebases often use <code>babel-loader</code> for speed and run type-checking
        separately in CI.
      </InfoBox>

      <p>Running this against a tiny app (an entry that renders one component and imports one stylesheet) with <code>npx webpack --mode production</code> produces real output:</p>

      <CodeBlock language="text" title="Actual terminal output — npx webpack --mode production">
{`asset main.138075cbef9f97c438d5.js 190 KiB [emitted] [immutable] [minimized] (name: main) 2 related assets
asset index.html 201 bytes [emitted]
orphan modules 6.94 KiB [orphan] 7 modules
runtime modules 1.36 KiB 5 modules
cacheable modules 572 KiB
  modules by path ./node_modules/ 564 KiB
    modules by path ./node_modules/react/ 18.2 KiB 4 modules
    modules by path ./node_modules/react-dom/ 533 KiB 4 modules
    modules by path ./node_modules/scheduler/ 10.1 KiB
  modules by path ./src/ 7.94 KiB
    ./src/index.tsx + 7 modules 7.27 KiB [built] [code generated]
    ./node_modules/css-loader/dist/cjs.js!./src/styles.css 686 bytes [built] [code generated]
webpack 5.109.2 compiled successfully in 1438 ms`}
      </CodeBlock>

      <p>
        Compare that to the same app built with <code>--mode development</code> — no
        minification, so the same React + ReactDOM code balloons from 190 KiB to nearly 3 MB:
      </p>

      <CodeBlock language="text" title="Actual terminal output — npx webpack --mode development">
{`asset main.js 2.93 MiB [emitted] (name: main)
asset index.html 203 bytes [emitted]
runtime modules 1.49 KiB 6 modules
modules by path ./node_modules/ 1.11 MiB
  modules by path ./node_modules/react/ 58.7 KiB 4 modules
  modules by path ./node_modules/react-dom/ 1.04 MiB 4 modules
modules by path ./src/ 2.1 KiB
  ./src/index.tsx 336 bytes [built] [code generated]
  ./src/styles.css 1.1 KiB [built] [code generated]
webpack 5.109.2 compiled successfully in 605 ms`}
      </CodeBlock>

      <InfoBox variant="info" title="That Size Gap Is the Point of mode">
        Same source, same dependencies — the only difference is the <code>mode</code> flag. Dev
        mode skips minification and dead-code elimination so builds stay fast and stack traces
        stay readable; production mode spends more build time to hand the browser a much
        smaller file. Never ship a <code>development</code>-mode bundle.
      </InfoBox>

      <h2>webpack-dev-server and Hot Module Replacement</h2>
      <p>
        You could technically re-run <code>webpack --watch</code> on every save and refresh the
        browser by hand, but <code>webpack-dev-server</code> does two things that make dev
        actually pleasant: it serves your output over HTTP (with a live-reloading WebSocket
        connection) instead of you opening files from disk, and with <code>hot: true</code> it
        does <strong>Hot Module Replacement</strong> — patching just the changed module into the
        running page without a full reload, so component state (an open modal, filled-in form
        fields, scroll position) survives the edit.
      </p>

      <CodeBlock language="bash" title="Run It">
{`npx webpack serve --mode development`}
      </CodeBlock>

      <p>Real output from starting it against the config above:</p>

      <CodeBlock language="text" title="Actual terminal output — npx webpack serve --mode development">
{`<i> [webpack-dev-server] Project is running at:
<i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
<i> [webpack-dev-server] Content not from webpack is served from './dist' directory
asset main.js 3.3 MiB [emitted] (name: main)
webpack 5.109.2 compiled successfully in 605 ms`}
      </CodeBlock>

      <InfoBox variant="note" title="One Bundle, For Now">
        <p>
          A single 3.3 MiB <code>main.js</code> is the correct output at this stage — the config
          above has no <code>splitChunks</code> and no dynamic <code>import()</code>, so webpack has
          no reason to emit anything else. It is large because development mode skips minification
          and inlines full source maps. The <a href="/frontend-tooling/webpack">code-splitting
          section further down</a> is what turns this into separate{' '}
          <code>vendors</code>/<code>main</code>/<code>about</code> chunks; if you see three assets
          here, you have already applied it.
        </p>
      </InfoBox>

      <p>
        A <code>curl http://localhost:3000/</code> against it while running returns a real{' '}
        <code>200</code> — the server is live and serving the bundle, not just printing a log
        line.
      </p>

      <InfoBox variant="tip" title="Full Reload vs HMR">
        Without <code>hot: true</code>, <code>webpack-dev-server</code> still gives you
        live-reload — it rebuilds and refreshes the whole page on every save, which is correct
        but throws away all client-side state. With <code>hot: true</code> and a framework
        integration (React Fast Refresh via <code>@pmmmwh/react-refresh-webpack-plugin</code> in
        real React setups), only the module you edited gets swapped, so state survives. Plain{' '}
        <code>webpack --watch</code> without the dev server does neither — it just rewrites the
        output file and leaves reloading the browser entirely up to you.
      </InfoBox>

      <h2>Code Splitting</h2>
      <p>
        By default, webpack puts everything reachable from your entry point into one bundle.
        That's fine for a small app, but for anything with multiple routes it means users
        download code for pages they haven't visited yet. Two independent tools fix this.
      </p>

      <h3>1. Dynamic import() for route-based splitting</h3>
      <p>
        Any <code>import()</code> call (as opposed to a static <code>import</code> statement)
        tells webpack "this module doesn't need to be in the initial bundle — give it its own
        chunk and fetch it only when this code actually runs." React's <code>lazy()</code> is
        built directly on top of this.
      </p>

      <CodeBlock language="typescript" title="src/index.tsx">
{`import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// Dynamic import -> webpack emits this as its own chunk, fetched on demand
const About = lazy(() => import(/* webpackChunkName: "about" */ './about'));

function App() {
  return (
    <>
      <h1 className="title">Hello from webpack</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <About />
      </Suspense>
    </>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}`}
      </CodeBlock>

      <h3>2. optimization.splitChunks for vendor/common chunks</h3>
      <p>
        Even without dynamic imports, your dependencies (React, lodash, whatever) rarely change
        as often as your own code. <code>splitChunks</code> pulls shared/vendor code into a
        separate chunk so the browser can cache it long-term and only re-download your (much
        smaller) app code when you ship a change.
      </p>

      <CodeBlock language="javascript" title="Add to webpack.config.js">
{`optimization: {
  splitChunks: {
    chunks: 'all', // also split code shared between entries/dynamic imports
    cacheGroups: {
      vendor: {
        test: /[\\\\/]node_modules[\\\\/]/,
        name: 'vendors',
      },
    },
  },
},`}
      </CodeBlock>

      <p>
        Adding the dynamic <code>import()</code> above and this <code>splitChunks</code> block
        to the same demo project and rebuilding with <code>--mode production</code> produces
        three real, separate files instead of one:
      </p>

      <CodeBlock language="text" title="Actual terminal output — with code splitting enabled">
{`asset vendors.bee306ac427cf43682a1.js 189 KiB [emitted] [immutable] [minimized] (name: vendors)
asset main.ad13ef3a1dfb7440a34b.js 4.43 KiB [emitted] [immutable] [minimized] (name: main)
asset about.713f1e522f33f5975e49.js 306 bytes [emitted] [immutable] [minimized] (name: about)
Entrypoint main 193 KiB (896 KiB) = vendors.bee306ac427cf43682a1.js 189 KiB main.ad13ef3a1dfb7440a34b.js 4.43 KiB
webpack 5.109.2 compiled successfully in 1218 ms`}
      </CodeBlock>

      <p>And the real <code>dist/</code> listing confirms three separate, independently-hashed chunks on disk:</p>

      <CodeBlock language="bash" title="ls -la dist/">
{`about.713f1e522f33f5975e49.js       306 bytes
about.713f1e522f33f5975e49.js.map   482 bytes
index.html                          270 bytes
main.ad13ef3a1dfb7440a34b.js        4.4 KB
main.ad13ef3a1dfb7440a34b.js.map    21 KB
vendors.bee306ac427cf43682a1.js     189 KB
vendors.bee306ac427cf43682a1.js.map 896 KB`}
      </CodeBlock>

      <InfoBox variant="success" title="What Just Happened">
        <code>react</code>/<code>react-dom</code> landed in <code>vendors.js</code> (189 KiB —
        it barely changes between deploys, so browsers cache it for a long time).{' '}
        <code>main.js</code> shrank to 4.43 KiB — just your app code. And the lazily-imported{' '}
        <code>About</code> component became its own 306-byte <code>about.js</code>, which
        wouldn't be downloaded at all until something actually renders it. Before splitting,
        all of that was one 190 KiB file.
      </InfoBox>

      <h2>Webpack vs Vite</h2>
      <p>
        The Vite lesson already covers this from Vite's side; here's the same comparison from
        webpack's. The core difference is what happens when you start the dev server.
      </p>

      <FlowChart
        title="Webpack vs Vite Dev Flow"
        chart={
          'graph TD\n' +
          '  A[Source Files] --> B{Dev Server}\n' +
          '  B -->|Webpack| C[Bundle Everything Upfront]\n' +
          '  C --> D[Serve Bundle]\n' +
          '  B -->|Vite| E[Serve Native ESM Immediately]\n' +
          '  E --> F[Transform Each Module On Request]\n' +
          '  F --> G[Browser Loads Modules As Needed]'
        }
      />

      <p>
        Webpack builds a full bundle before it can serve anything — on a small demo app that's
        the ~600ms you saw above, but on a large real-world codebase with thousands of modules
        it can mean a multi-second (or tens-of-seconds) wait before the dev server is even
        ready, and every file save re-triggers work across the bundle graph. Vite skips that
        entirely in dev: it serves your source as native ES modules and only transforms a file
        the moment the browser actually requests it, so startup time is close to flat regardless
        of app size.
      </p>

      <table>
        <thead>
          <tr>
            <th>&nbsp;</th>
            <th>Webpack</th>
            <th>Vite</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dev server startup</td>
            <td>Bundles the whole graph first</td>
            <td>Native ESM, near-instant regardless of size</td>
          </tr>
          <tr>
            <td>Production build</td>
            <td>webpack (Terser + its own bundler)</td>
            <td>Rollup / Rolldown</td>
          </tr>
          <tr>
            <td>Config complexity</td>
            <td>More explicit, more verbose (loaders + plugins for everything)</td>
            <td>Sensible defaults, less config for common cases</td>
          </tr>
          <tr>
            <td>Plugin ecosystem</td>
            <td>13+ years old, extremely mature and broad</td>
            <td>Younger, growing fast, some gaps for niche loaders</td>
          </tr>
          <tr>
            <td>Where you'll meet it</td>
            <td>Existing large/legacy apps, Angular, CRA-era codebases</td>
            <td>New projects, most modern React/Vue starters</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="question" title="When Would You Still Reach for Webpack on Purpose?">
        Mainly two cases: you're working in an existing, heavily-configured webpack codebase
        where migrating isn't worth the risk (a large app can have years of accumulated loader
        and plugin config tuned to specific edge cases), or you need a specific plugin/loader
        that only has a mature webpack integration. For a brand-new project in 2026, Vite (or a
        framework built on it) is the default choice — but "default choice for new projects"
        and "tool you'll never need to touch" are different things, which is exactly why this
        lesson exists.
      </InfoBox>

      <InteractiveChallenge
        question={"You add optimization.splitChunks to a config that also uses a dynamic import() for one route component. After a production build, you see vendors.[hash].js, main.[hash].js, and about.[hash].js as separate files. Why three files instead of one?"}
        options={[
          "Webpack always splits output into exactly three files",
          "splitChunks pulled node_modules code into vendors.js, and the dynamic import() gave the lazy-loaded component its own chunk, leaving app entry code in main.js",
          "main.js failed to build so webpack fell back to two smaller files",
          "TypeScript compilation always produces one file per exported component"
        ]}
        correctIndex={1}
        explanation={"splitChunks with a node_modules cacheGroup extracts shared dependency code (react/react-dom here) into its own long-cacheable vendors chunk. Separately, any import() call — static or via React.lazy — tells webpack to give that module its own chunk, fetched only when it's actually needed. The two features are independent and compose: one config option controls vendor extraction, the syntax you use for imports controls route-level splitting."}
      />
    </LessonLayout>
  );
}
