import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Plugins() {
  return (
    <LessonLayout
      title="Plugins & Asset Handling"
      sectionId="vite"
      lessonIndex={2}
      prev={{ path: '/vite/core', label: 'Core Concepts' }}
      next={{ path: '/vite/devserver', label: 'Dev Server & HMR' }}
    >
      <p>
        Where Webpack has loaders (transform files) and plugins (hook into the compiler),
        Vite has a single, unified concept: <strong>plugins</strong>. Vite's plugin
        interface is a superset of Rollup's plugin interface, extended with a handful of
        Vite-only hooks that only make sense in a dev-server context. Any Rollup plugin
        works in a Vite production build; Vite plugins add dev-server behavior on top.
      </p>

      <FlowChart
        title="Vite Plugin Hooks: Shared vs Vite-Only"
        chart={"graph TD\n  A[Rollup-compatible hooks] --> B[resolveId]\n  A --> C[load]\n  A --> D[transform]\n  B --> E[Run in both dev and build]\n  C --> E\n  D --> E\n  F[Vite-only hooks] --> G[config]\n  F --> H[configureServer]\n  F --> I[transformIndexHtml]\n  G --> J[Only meaningful with a dev server or HTML entry]\n  H --> J\n  I --> J"}
      />

      {/* ── PLUGIN ANATOMY ─────────────────────────────────── */}
      <h2>Anatomy of a Plugin</h2>
      <p>
        A Vite plugin is a plain object (or a factory function returning one) with a
        <code>name</code> and any subset of hooks it needs. Here's a minimal but complete
        example that injects a meta tag into the HTML and logs every module transform:
      </p>

      <CodeBlock language="javascript" title="A Minimal Custom Plugin">{`// vite-plugin-example.js
export default function myPlugin(options = {}) {
  return {
    name: 'vite-plugin-example',

    // Runs once, lets you read/modify the resolved config
    config(config, { command }) {
      if (command === 'build') {
        console.log('Building for production...');
      }
    },

    // Rollup-compatible: runs for every module import to decide its file path
    resolveId(source) {
      if (source === 'virtual:my-module') {
        return source; // mark as resolved, load() will handle it
      }
    },

    // Rollup-compatible: supplies content for a resolved id
    load(id) {
      if (id === 'virtual:my-module') {
        return \`export const message = '\${options.message ?? 'hello'}';\`;
      }
    },

    // Rollup-compatible: transforms a module's source before it's served/bundled
    transform(code, id) {
      if (id.endsWith('.special.js')) {
        return code.replace('__INJECTED__', 'true');
      }
    },

    // Vite-only: hook into the dev server's connect/express-like middleware stack
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__plugin-status') {
          res.end('Plugin is running');
        } else {
          next();
        }
      });
    },

    // Vite-only: rewrite the served/built index.html
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        '<meta name="generator" content="my-plugin" /></head>'
      );
    },
  };
}`}</CodeBlock>

      <CodeBlock language="javascript" title="Using It in vite.config.ts">{`import { defineConfig } from 'vite';
import myPlugin from './vite-plugin-example';

export default defineConfig({
  plugins: [
    myPlugin({ message: 'from config' }),
  ],
});`}</CodeBlock>

      <InfoBox variant="info" title="resolveId / load / transform Also Run at Build Time">
        Because these three hooks come straight from the Rollup plugin interface, they run
        identically whether Vite is serving files on demand in dev or Rollup is bundling
        them for production. That's the mechanism that makes Vite's dev/build parity
        possible &mdash; the same transform logic runs in both pipelines.
      </InfoBox>

      {/* ── OFFICIAL PLUGINS ───────────────────────────────── */}
      <h2>Official Framework Plugins</h2>
      <p>
        Most projects only ever add one or two plugins — the framework integration. These
        aren't optional extras; they're what makes JSX/Vue SFCs work and what wires up Fast
        Refresh / component HMR (covered in the next lesson).
      </p>

      <CodeBlock language="bash" title="React">{`npm install -D @vitejs/plugin-react
# or the SWC-based variant — faster transform, same behavior
npm install -D @vitejs/plugin-react-swc`}</CodeBlock>

      <CodeBlock language="javascript" title="vite.config.ts — React">{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`}</CodeBlock>

      <CodeBlock language="bash" title="Vue">{`npm install -D @vitejs/plugin-vue`}</CodeBlock>

      <CodeBlock language="javascript" title="vite.config.ts — Vue">{`import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});`}</CodeBlock>

      <InfoBox variant="tip" title="babel vs swc for React">
        <code>@vitejs/plugin-react</code> uses Babel and supports the full Babel plugin
        ecosystem (including custom transforms). <code>@vitejs/plugin-react-swc</code> uses
        the Rust-based SWC compiler instead — noticeably faster, especially on large
        codebases, but with a smaller Babel-plugin compatibility surface. Default to the
        SWC variant unless you specifically need a Babel plugin.
      </InfoBox>

      {/* ── STATIC ASSETS ──────────────────────────────────── */}
      <h2>Static Asset Handling</h2>
      <p>
        Vite has built-in, zero-config handling for importing static files directly in
        JavaScript — no <code>file-loader</code> or <code>asset/resource</code> rule
        required.
      </p>

      <CodeBlock language="javascript" title="Default Asset Import Behavior">{`import logoUrl from './logo.png';
// logoUrl is a string — a resolved, hashed URL to the file
// dev:   '/src/assets/logo.png'
// build: '/assets/logo.4f8a2c1e.png'

const img = document.createElement('img');
img.src = logoUrl;
document.body.appendChild(img);`}</CodeBlock>

      <p>
        Two query suffixes change that default behavior when you need something other than
        a URL:
      </p>

      <CodeBlock language="javascript" title="?url and ?raw Suffixes">{`// Force URL behavior explicitly (useful for asset types Vite
// would otherwise try to inline, like small SVGs)
import iconUrl from './icon.svg?url';

// Import the file's raw text content as a string, not a URL —
// handy for embedding a shader, a markdown snippet, or raw SVG markup
import shaderSource from './shader.glsl?raw';
import rawSvgMarkup from './icon.svg?raw';

console.log(typeof iconUrl);       // 'string' — a URL
console.log(typeof shaderSource);  // 'string' — the file's literal contents`}</CodeBlock>

      <InfoBox variant="warning" title="Small Assets Get Inlined by Default">
        Assets under <code>build.assetsInlineLimit</code> (default 4kb) are inlined as
        base64 data URIs in the production build instead of emitted as separate files —
        this avoids an extra HTTP request for tiny icons but bloats the JS bundle slightly.
        Use <code>?url</code> to force a real file/URL regardless of size, or lower/raise
        the limit in <code>build.assetsInlineLimit</code>.
      </InfoBox>

      <h3><code>public/</code> vs <code>src/assets/</code></h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Aspect</th>
            <th style={{ textAlign: 'left', padding: '8px' }}><code>public/</code></th>
            <th style={{ textAlign: 'left', padding: '8px' }}><code>src/assets/</code></th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>How you reference it</td>
            <td style={{ padding: '8px' }}>Absolute URL, e.g. <code>/favicon.svg</code></td>
            <td style={{ padding: '8px' }}><code>import</code> statement</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Processed by build?</td>
            <td style={{ padding: '8px' }}>No — copied as-is</td>
            <td style={{ padding: '8px' }}>Yes — hashed, optionally inlined</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}>Cache-busted filename?</td>
            <td style={{ padding: '8px' }}>No — same filename every build</td>
            <td style={{ padding: '8px' }}>Yes — content hash appended</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>Use for</td>
            <td style={{ padding: '8px' }}>favicon, robots.txt, files an external tool expects at a fixed path</td>
            <td style={{ padding: '8px' }}>Everything else — images, fonts, icons used in components</td>
          </tr>
        </tbody>
      </table>

      {/* ── CSS ────────────────────────────────────────────── */}
      <h2>CSS Handling</h2>
      <p>
        Webpack needs an explicit loader chain for CSS —
        <code>{"['style-loader', 'css-loader', 'postcss-loader']"}</code> at minimum. Vite
        handles CSS natively with zero configuration:
      </p>

      <CodeBlock language="javascript" title="Zero-Config CSS Import">{`// Just import it — Vite injects it during dev and extracts/hashes it at build
import './styles.css';

// CSS Modules work automatically for any .module.css file — no config needed
import styles from './Button.module.css';
element.className = styles.button;

// Sass/Less/Stylus work automatically once the preprocessor package is installed
import './styles.scss'; // npm install -D sass`}</CodeBlock>

      <CodeBlock language="bash" title="Preprocessors Are Just Peer Dependencies">{`# Vite detects the file extension and calls the matching preprocessor —
# no loader chain to configure, just install the package
npm install -D sass    # enables .scss / .sass
npm install -D less    # enables .less
npm install -D stylus  # enables .styl`}</CodeBlock>

      <p>
        PostCSS also works automatically: drop a <code>postcss.config.js</code> in your
        project root (e.g. for <code>autoprefixer</code> or Tailwind) and Vite picks it up
        without any plugin registration.
      </p>

      <InfoBox variant="info" title="CSS Loader Chains vs Zero Config">
        This is one of the starkest architectural differences between the two tools.
        Webpack treats CSS as just another file type that needs an explicit
        <code>module.rules</code> entry and an ordered loader chain you assemble yourself.
        Vite treats CSS, CSS Modules, and common preprocessors as first-class, built into
        the core — you only reach for a plugin for less common needs (Tailwind's own Vite
        plugin, CSS-in-JS libraries with build-time extraction, etc.).
      </InfoBox>

      <InteractiveChallenge
        question="Which two Vite plugin hooks come directly from the Rollup plugin interface and run identically in both dev and build?"
        options={[
          "configureServer and transformIndexHtml",
          "resolveId and load (and transform)",
          "config and configResolved",
          "buildStart and closeBundle only"
        ]}
        correctIndex={1}
        explanation="resolveId, load, and transform are Rollup-compatible hooks — they run the same way whether Vite is serving a file on demand in dev or Rollup is bundling it for production. configureServer and transformIndexHtml are Vite-specific extensions that only make sense with a running dev server or an HTML entry point."
      />

      <h2>What's Next</h2>
      <p>
        With plugins and asset handling covered, we'll go deep on the dev server itself:
        how modules are served on demand, how Hot Module Replacement actually works under
        the hood, and how to proxy API requests or embed Vite in a custom server.
      </p>
    </LessonLayout>
  );
}

export default Plugins;
