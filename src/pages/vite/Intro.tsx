import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Intro() {
  return (
    <LessonLayout
      title="What is Vite?"
      sectionId="vite"
      lessonIndex={0}
      prev={null}
      next={{ path: '/vite/core', label: 'Core Concepts' }}
    >
      <h2>The Problem Vite Solves</h2>
      <p>
        Bundler-based dev servers (Webpack, Browserify, Parcel 1) all share the same
        fundamental cost: before they can serve a single module to the browser, they have
        to build a dependency graph of your <em>entire</em> application and bundle it into
        one or more files. On a small app that's instant. On a 2,000-module app, that's a
        multi-second (or multi-minute) wait before you see anything &mdash; and it gets
        slower every time the app grows.
      </p>
      <p>
        Vite's insight: the browser already has a module system. Modern browsers understand
        native ES modules (<code>import</code>/<code>export</code>) natively, so instead of
        bundling everything upfront, Vite's dev server can just <em>serve your source files
        directly</em> and let the browser request each module as it's needed. There's no
        bundling step to wait on &mdash; dev server startup time stays roughly constant no
        matter how large your app gets.
      </p>

      <FlowChart
        title="Bundle-First vs Serve-on-Demand"
        chart={"graph TD\n  A[npm run dev] --> B{Approach}\n  B -->|Bundler dev server| C[Bundle Entire App]\n  C --> D[Wait...]\n  D --> E[Serve One Big Bundle]\n  B -->|Vite| F[Start Server Instantly]\n  F --> G[Browser Requests index.html]\n  G --> H[Browser Imports Modules On Demand]\n  H --> I[Vite Transforms Each File As Requested]"}
      />

      <InfoBox variant="info" title="Two Different Engines, Two Different Jobs">
        Vite isn't one tool pretending to be fast &mdash; it's two purpose-built tools
        stitched together. <strong>esbuild</strong> (written in Go) pre-bundles your
        <code>node_modules</code> dependencies before dev starts, because esbuild can do in
        milliseconds what a JS-based bundler takes seconds to do. <strong>Rollup</strong>
        (written in JS, but mature and highly tunable) builds your optimized production
        bundle, because Rollup's output quality &mdash; tree-shaking, chunking, code-splitting
        &mdash; still beats esbuild's for shipping to real users.
      </InfoBox>

      <h2>Brief History: How We Got Here</h2>
      <ul>
        <li><strong>2020: Vite 1</strong> &mdash; released by Evan You (creator of Vue) as a faster alternative to vue-cli's Webpack setup</li>
        <li><strong>2021: Vite 2</strong> &mdash; framework-agnostic rewrite; React, Preact, and vanilla templates land alongside Vue</li>
        <li><strong>2021&ndash;2022: Ecosystem adoption</strong> &mdash; SvelteKit, Astro, and later Nuxt adopt Vite as their default dev/build engine</li>
        <li><strong>2022: Vite 3</strong> &mdash; stabilized APIs, improved SSR support</li>
        <li><strong>2023: Vite 4</strong> &mdash; upgraded the production bundler from Rollup 2 to Rollup 3, faster cold starts</li>
        <li><strong>2023: Create React App effectively retired</strong> &mdash; the React team starts pointing new SPA users at Vite</li>
        <li><strong>2023: Vite 5</strong> &mdash; Rollup 4, Node 18+ requirement, smaller core</li>
        <li><strong>2024: Vite 6</strong> &mdash; the Environment API, generalizing dev/build to arbitrary runtime targets (browser, SSR, edge/workers) instead of hardcoding two</li>
        <li><strong>2025: Vite 7</strong> &mdash; Node 20+, default browser target moves to Baseline Widely Available; <code>rolldown-vite</code> ships as an opt-in drop-in</li>
        <li><strong>2025&ndash;2026: Vite 8</strong> &mdash; Rolldown becomes the default bundler, replacing Rollup for builds and esbuild for pre-bundling</li>
      </ul>

      <InfoBox variant="tip" title="Rolldown: The Two Engines Became One">
        Rolldown is the Rust bundler the Vite team built to collapse the two-engine split
        described above &mdash; it takes over <em>both</em> esbuild's dependency pre-bundling and
        Rollup's production build. It landed as opt-in <code>rolldown-vite</code> in the Vite 6/7
        era and is the default from Vite 8 on.
        <br /><br />
        The architecture in this section still holds: what matters conceptually is
        <strong> native-ESM serving at dev time vs a bundled graph at build time</strong>, and
        that split is unchanged. Rolldown is Rollup-API-compatible on purpose, so
        <code> build.rollupOptions</code> and most Rollup plugins carry over. Where lessons here
        say &quot;Rollup builds your production bundle,&quot; read it as &quot;the Rollup-compatible
        bundler&quot; &mdash; Rollup on Vite 7 and below, Rolldown from Vite 8.
      </InfoBox>

      <h2>Dev Time vs Build Time: Two Different Pipelines</h2>
      <p>
        This is the single most important thing to internalize about Vite: it behaves
        completely differently depending on whether you're running <code>vite</code> (dev)
        or <code>vite build</code> (production). They are not the same code path.
      </p>

      <FlowChart
        title="Vite's Two Pipelines"
        chart={"graph TD\n  A[vite - dev command] --> B[Browser requests a module]\n  B --> C[esbuild-pre-bundled deps served]\n  B --> D[Source file transformed on demand]\n  D --> E[Served as native ESM - no bundle]\n  F[vite build command] --> G[Entry is index.html]\n  G --> H[Rollup builds dependency graph]\n  H --> I[Tree-shake, chunk, minify]\n  I --> J[Hashed static assets written to dist/]"}
      />
      <p>
        During dev, nothing is bundled &mdash; esbuild only pre-bundles your third-party
        dependencies (React, lodash, etc.) into single ESM-friendly files so the browser
        isn't making hundreds of tiny requests for a package's internal module structure.
        Your own source code is served and transformed file-by-file, on request. During
        build, Vite hands everything to Rollup, which produces the kind of optimized,
        content-hashed, tree-shaken output you'd ship to production.
      </p>

      <h2>Vite vs Webpack, From Vite's Side</h2>
      <p>
        You've seen the Webpack-authored version of this table. Here's the same comparison
        from Vite's perspective &mdash; where it wins clearly, where it's still catching up,
        and where the two are just different tools for different jobs.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Feature</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Vite</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Webpack 5</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>Dev startup</strong></td>
            <td style={{ padding: '8px' }}>Near-instant, independent of app size</td>
            <td style={{ padding: '8px' }}>Scales with app size (full bundle first)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>HMR update speed</strong></td>
            <td style={{ padding: '8px' }}>Milliseconds &mdash; only the changed module re-transforms</td>
            <td style={{ padding: '8px' }}>Fast, but still bounded by bundle graph recompute</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>Config complexity</strong></td>
            <td style={{ padding: '8px' }}>Low &mdash; sensible defaults, small config surface</td>
            <td style={{ padding: '8px' }}>High &mdash; explicit entry/output/rules/resolve required</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>Ecosystem maturity</strong></td>
            <td style={{ padding: '8px' }}>Strong and fast-growing, younger than Webpack's</td>
            <td style={{ padding: '8px' }}>Massive &mdash; a decade of loaders/plugins for every edge case</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><strong>Production bundling</strong></td>
            <td style={{ padding: '8px' }}>Delegated to Rollup &mdash; excellent tree-shaking</td>
            <td style={{ padding: '8px' }}>Built-in, extremely configurable (Module Federation, etc.)</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}><strong>Best for</strong></td>
            <td style={{ padding: '8px' }}>New projects, SPAs, most modern frameworks</td>
            <td style={{ padding: '8px' }}>Legacy/enterprise apps, micro-frontends, edge-case tooling</td>
          </tr>
        </tbody>
      </table>

      <h2>When You'll Encounter Vite</h2>
      <ul>
        <li><strong>Any new React/Vue/Svelte SPA</strong> &mdash; <code>npm create vite@latest</code> is the default starting point today</li>
        <li><strong>Vitest</strong> &mdash; Vite's test runner reuses the same dev-server transform pipeline for near-instant test startup</li>
        <li><strong>SvelteKit, Nuxt, Astro</strong> &mdash; all use Vite under the hood for dev serving and (in most cases) production bundling</li>
        <li><strong>Any repo with a <code>vite.config.ts</code></strong> &mdash; you'll need to read and modify it, same as you would a <code>webpack.config.js</code></li>
        <li><strong>Design system / component library dev</strong> &mdash; Vite's library mode (covered later) is a common Rollup-config replacement</li>
      </ul>

      <h2>Installing Vite</h2>
      <p>
        The fastest way to get a working project is the official scaffolding tool, which
        generates a template for your framework of choice:
      </p>

      <CodeBlock language="bash" title="Scaffold a New Vite Project">{`# Interactive prompts (choose framework + variant)
npm create vite@latest

# Or specify everything up front
npm create vite@latest my-app -- --template react-ts

cd my-app
npm install
npm run dev`}</CodeBlock>

      <InfoBox variant="tip" title="Templates Available">
        <code>npm create vite@latest</code> ships templates for vanilla, vue, react,
        preact, lit, svelte, solid, and qwik &mdash; each with a plain-JS and a
        <code>-ts</code> (TypeScript) variant.
      </InfoBox>

      <h2>A Minimal Project, Built by Hand</h2>
      <p>
        Scaffolding is great for real projects, but building one file at a time makes the
        architecture click. The first thing to notice: <strong>Vite treats
        <code>index.html</code> as the entry point</strong>, not a JS file. This is a core
        difference from Webpack, where <code>index.html</code> is usually a template that a
        plugin injects a <code>&lt;script&gt;</code> tag into. In Vite, the HTML file lives
        at your project root and <em>is</em> the starting point of the module graph.
      </p>

      <CodeBlock language="bash" title="Project Structure">{`my-vite-project/
├── package.json
├── index.html        # The real entry point — lives at project root
├── src/
│   ├── main.js        # Referenced by a <script type="module"> in index.html
│   └── greet.js        # A module main.js imports`}</CodeBlock>

      <CodeBlock language="bash" title="index.html">{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Vite App</title>
</head>
<body>
  <div id="app"></div>
  <!-- type="module" is required — this is a native ESM import -->
  <script type="module" src="/src/main.js"></script>
</body>
</html>`}</CodeBlock>

      <CodeBlock language="javascript" title="src/greet.js">{`// A plain ES module — no transform needed, this is valid browser JS
export function greet(name) {
  return \`Hello, \${name}! Welcome to Vite.\`;
}

export function farewell(name) {
  return \`Goodbye, \${name}!\`;
}`}</CodeBlock>

      <CodeBlock language="javascript" title="src/main.js">{`// Vite starts here because index.html points at this file
import { greet } from './greet.js';

const message = greet('Developer');
document.querySelector('#app').innerHTML = \`<h1>\${message}</h1>\`;

console.log('Module loaded — check the Network tab, no bundle in sight!');`}</CodeBlock>

      <CodeBlock language="bash" title="Run It">{`npm install --save-dev vite
npx vite

# VITE v8.x.x  ready in 180 ms
#
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose`}</CodeBlock>

      <p>
        Open the browser's Network tab while this runs: you'll see individual requests for
        <code>main.js</code> and <code>greet.js</code> &mdash; two separate native ESM
        imports, transformed and served on demand, no bundle file anywhere. That's the
        entire dev-time model. Compare the ~180ms startup here to Webpack's zero-config
        build in the previous section &mdash; and unlike Webpack, this number barely moves
        as the project grows, because Vite never bundles your source at dev time.
      </p>

      <InfoBox variant="warning" title="type='module' Is Not Optional">
        Without <code>type="module"</code> on the script tag, the browser treats
        <code>main.js</code> as a classic script and its <code>import</code> statement
        throws a syntax error. Vite's entire dev-time model depends on native ESM, so this
        attribute is load-bearing.
      </InfoBox>

      <InteractiveChallenge
        question="What does Vite use as the true entry point of a project, unlike Webpack?"
        options={[
          "src/index.js, same as Webpack",
          "vite.config.ts",
          "index.html at the project root",
          "package.json's \"main\" field"
        ]}
        correctIndex={2}
        explanation="Vite treats index.html as the entry point of the module graph — the script type='module' tag inside it is where Vite (and later Rollup) starts resolving imports. Webpack usually treats HTML as a template injected with a bundle reference, not the entry itself."
      />

      <h2>What's Next</h2>
      <p>
        You've seen the two-pipeline architecture and built a project by hand. Next, we'll
        go deep on <code>vite.config.ts</code> &mdash; root, base, aliases, environment
        variables, and exactly what dependency pre-bundling does and why it matters.
      </p>
    </LessonLayout>
  );
}

export default Intro;
