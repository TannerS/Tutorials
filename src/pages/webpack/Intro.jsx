import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Intro() {
  return (
    <LessonLayout
      title="What is Webpack?"
      sectionId="webpack"
      lessonIndex={0}
      prev={null}
      next={{ path: '/webpack/core', label: 'Core Concepts' }}
    >
      <h2>The Problem Webpack Solves</h2>
      <p>
        Browsers don't natively understand Node.js modules, npm packages, SCSS, TypeScript,
        or JSX. You can't just ship your <code>src/</code> folder with hundreds of
        <code>import</code> statements and expect it to work. Someone needs to:
      </p>
      <ul>
        <li><strong>Resolve dependencies</strong> &mdash; figure out which files depend on which other files</li>
        <li><strong>Transform code</strong> &mdash; convert JSX, TypeScript, SCSS into browser-native formats</li>
        <li><strong>Bundle everything</strong> &mdash; combine modules into optimized output files</li>
        <li><strong>Optimize</strong> &mdash; minify, tree-shake, split code, hash filenames for caching</li>
      </ul>
      <p>
        That's what Webpack does. It takes your entire project &mdash; JavaScript, CSS,
        images, fonts, everything &mdash; builds a dependency graph, transforms each file
        through the right pipeline, and outputs optimized bundles ready for the browser.
      </p>

      <FlowChart
        title="What Webpack Does"
        chart={"graph LR\n  A[JS / JSX / TS] --> W[Webpack]\n  B[CSS / SCSS] --> W\n  C[Images / Fonts] --> W\n  D[JSON / SVG] --> W\n  W --> E[bundle.js]\n  W --> F[styles.css]\n  W --> G[assets/]"}
      />

      <InfoBox variant="info" title="You Already Use Webpack">
        If you've used Create React App, you've been using Webpack the whole time &mdash;
        CRA's <code>react-scripts</code> wraps an ~800-line Webpack config. Vite replaced
        Webpack in the dev server, but many production codebases still run Webpack.
      </InfoBox>

      <h2>Brief History: How We Got Here</h2>
      <p>
        Before module bundlers, the web was a wild west of script tags and global variables.
        Here's the evolution:
      </p>
      <ul>
        <li><strong>2000s: Script tags</strong> &mdash; manually ordering <code>&lt;script&gt;</code> tags, praying nothing loaded out of order</li>
        <li><strong>2010: RequireJS / AMD</strong> &mdash; async module loading with <code>define()</code> and <code>require()</code></li>
        <li><strong>2011: Browserify</strong> &mdash; brought Node.js <code>require()</code> to the browser</li>
        <li><strong>2012: Grunt / Gulp</strong> &mdash; task runners that could concatenate files, but didn't understand dependencies</li>
        <li><strong>2014: Webpack 1</strong> &mdash; first bundler to build a true dependency graph from entry points</li>
        <li><strong>2017: Webpack 3</strong> &mdash; scope hoisting, better tree shaking</li>
        <li><strong>2018: Webpack 4</strong> &mdash; zero-config mode, <code>mode</code> flag, massive speed improvements</li>
        <li><strong>2020: Webpack 5</strong> &mdash; Module Federation, filesystem caching, asset modules, removed Node.js polyfills</li>
      </ul>

      <InfoBox variant="tip" title="Webpack 5 Is Current">
        Webpack 5 was released in October 2020 and remains the latest major version.
        Everything in this tutorial targets Webpack 5. If you encounter a Webpack 4
        project, the last lesson covers migration differences.
      </InfoBox>

      <h2>What Webpack Actually Does: The Pipeline</h2>
      <p>
        At a high level, Webpack performs these steps every time you run a build:
      </p>
      <ol>
        <li><strong>Read entry point(s)</strong> &mdash; start from the file(s) you specify</li>
        <li><strong>Resolve dependencies</strong> &mdash; recursively follow every <code>import</code> and <code>require</code></li>
        <li><strong>Apply loaders</strong> &mdash; transform each file (Babel for JSX, css-loader for CSS, etc.)</li>
        <li><strong>Generate chunks</strong> &mdash; group modules into output bundles based on entry points and split rules</li>
        <li><strong>Apply plugins</strong> &mdash; optimize, minify, extract CSS, generate HTML, inject env vars</li>
        <li><strong>Write output</strong> &mdash; emit the final files to <code>dist/</code></li>
      </ol>

      <FlowChart
        title="The Webpack Build Pipeline"
        chart={"graph TD\n  A[Entry Point] --> B[Resolve Dependencies]\n  B --> C[Apply Loaders]\n  C --> D[Generate Chunks]\n  D --> E[Apply Plugins]\n  E --> F[Write Output to dist/]"}
      />

      <h2>Webpack vs Vite vs Rollup vs esbuild</h2>
      <p>
        You already know Vite. Here's how the major bundlers compare:
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Feature</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Webpack 5</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Vite</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Rollup</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>esbuild</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>Dev startup</strong></td>
            <td style={{ padding: '8px' }}>Slow (full bundle)</td>
            <td style={{ padding: '8px' }}>Instant (ESM)</td>
            <td style={{ padding: '8px' }}>N/A (no dev server)</td>
            <td style={{ padding: '8px' }}>Fast (Go-based)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>Prod build speed</strong></td>
            <td style={{ padding: '8px' }}>Moderate</td>
            <td style={{ padding: '8px' }}>Fast (Rollup)</td>
            <td style={{ padding: '8px' }}>Fast</td>
            <td style={{ padding: '8px' }}>Fastest</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>Config complexity</strong></td>
            <td style={{ padding: '8px' }}>High</td>
            <td style={{ padding: '8px' }}>Low</td>
            <td style={{ padding: '8px' }}>Medium</td>
            <td style={{ padding: '8px' }}>Minimal</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>Plugin ecosystem</strong></td>
            <td style={{ padding: '8px' }}>Massive</td>
            <td style={{ padding: '8px' }}>Growing</td>
            <td style={{ padding: '8px' }}>Good</td>
            <td style={{ padding: '8px' }}>Limited</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>Code splitting</strong></td>
            <td style={{ padding: '8px' }}>Excellent</td>
            <td style={{ padding: '8px' }}>Good (Rollup)</td>
            <td style={{ padding: '8px' }}>Good</td>
            <td style={{ padding: '8px' }}>Basic</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}><strong>Best for</strong></td>
            <td style={{ padding: '8px' }}>Enterprise, complex apps</td>
            <td style={{ padding: '8px' }}>New projects, SPAs</td>
            <td style={{ padding: '8px' }}>Libraries</td>
            <td style={{ padding: '8px' }}>Speed-critical tooling</td>
          </tr>
        </tbody>
      </table>

      <h2>When You'll Encounter Webpack</h2>
      <p>
        Even if you'd choose Vite for a greenfield project, you'll encounter Webpack in:
      </p>
      <ul>
        <li><strong>Legacy/enterprise React apps</strong> &mdash; most React apps started before 2022 use Webpack</li>
        <li><strong>Create React App projects</strong> &mdash; CRA is Webpack under the hood</li>
        <li><strong>Next.js</strong> &mdash; uses Webpack by default (Turbopack is opt-in and still maturing)</li>
        <li><strong>Any repo with a <code>webpack.config.js</code></strong> &mdash; you'll need to read and modify it</li>
        <li><strong>Monorepos</strong> &mdash; many large orgs have custom Webpack setups with Module Federation</li>
      </ul>

      <h2>Installing Webpack</h2>
      <p>
        Webpack requires two packages: <code>webpack</code> (the core bundler) and
        <code>webpack-cli</code> (the command-line interface).
      </p>

      <CodeBlock language="bash" title="Install Webpack">{`# Create a new project
mkdir my-webpack-project && cd my-webpack-project
npm init -y

# Install Webpack as dev dependencies
npm install --save-dev webpack webpack-cli`}</CodeBlock>

      <h2>Your First Build: Zero-Config Mode</h2>
      <p>
        Webpack 5 works with zero configuration. By default, it looks for
        <code>src/index.js</code> as the entry point and outputs to <code>dist/main.js</code>.
      </p>

      <CodeBlock language="bash" title="Project Structure">{`my-webpack-project/
├── package.json
├── src/
│   ├── index.js      # Entry point (Webpack's default)
│   └── greet.js      # A module we import
└── dist/             # Output (created by Webpack)`}</CodeBlock>

      <CodeBlock language="javascript" title="src/greet.js">{`// A simple ES module
export function greet(name) {
  return \`Hello, \${name}! Welcome to Webpack.\`;
}

export function farewell(name) {
  return \`Goodbye, \${name}!\`;
}`}</CodeBlock>

      <CodeBlock language="javascript" title="src/index.js">{`// Webpack starts here and follows every import
import { greet } from './greet';

const message = greet('Developer');
document.body.innerHTML = \`<h1>\${message}</h1>\`;

console.log('Bundle loaded successfully!');`}</CodeBlock>

      <CodeBlock language="bash" title="Run Webpack">{`# Run Webpack with zero config
npx webpack

# You'll see output like:
# asset main.js 234 bytes [emitted] [minimized] (name: main)
# ./src/index.js 165 bytes [built] [code generated]
# ./src/greet.js 142 bytes [built] [code generated]
# webpack compiled successfully

# The output file is dist/main.js`}</CodeBlock>

      <InfoBox variant="warning" title="Mode Warning">
        If you run <code>npx webpack</code> without specifying a mode, you'll see a warning:
        "The 'mode' option has not been set." It defaults to production mode, which minifies
        the output. We'll cover the mode option in the next lesson.
      </InfoBox>

      <h3>What Happened Behind the Scenes</h3>
      <p>
        When you ran <code>npx webpack</code>, Webpack:
      </p>
      <ol>
        <li>Started at <code>src/index.js</code> (the default entry)</li>
        <li>Found <code>import {'{ greet }'} from './greet'</code> and followed it</li>
        <li>Built a dependency graph: <code>index.js → greet.js</code></li>
        <li>Noticed <code>farewell</code> was never imported and tree-shook it away</li>
        <li>Minified the result (production mode default)</li>
        <li>Wrote the output to <code>dist/main.js</code></li>
      </ol>

      <CodeBlock language="bash" title="Add an npm Script">{`// In package.json, add:
{
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development"
  }
}

// Now you can run:
// npm run build   → minified production output
// npm run dev     → readable development output`}</CodeBlock>

      <h2>Minimal Project With HTML</h2>
      <p>
        Zero-config gives you a JS bundle, but you need HTML to actually load it. For now,
        create a simple HTML file manually (in the next lessons, we'll automate this with
        HtmlWebpackPlugin):
      </p>

      <CodeBlock language="bash" title="dist/index.html">{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Webpack App</title>
</head>
<body>
  <!-- Webpack's output bundle -->
  <script src="main.js"></script>
</body>
</html>`}</CodeBlock>

      <p>
        Open <code>dist/index.html</code> in a browser and you'll see your bundled app running.
        That's Webpack in its simplest form &mdash; but the real power comes from configuration.
      </p>

      <InteractiveChallenge
        question="In Webpack 5 zero-config mode, what is the default entry point and output path?"
        options={[
          "index.js → build/bundle.js",
          "src/index.js → dist/main.js",
          "src/app.js → dist/app.js",
          "main.js → output/bundle.js"
        ]}
        correctIndex={1}
        explanation="Webpack 5 defaults to src/index.js as the entry point and dist/main.js as the output. You can override both in webpack.config.js."
      />

      <h2>What's Next</h2>
      <p>
        Zero-config is great for a demo, but real projects need configuration. In the
        next lesson, we'll break down Webpack's five core concepts: Entry, Output, Mode,
        Loaders, and Resolve &mdash; and build a complete <code>webpack.config.js</code> for
        a React project from scratch.
      </p>

    </LessonLayout>
  );
}

export default Intro;
