import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Advanced() {
  return (
    <LessonLayout
      title="Advanced Config, SSR & Migration"
      sectionId="vite"
      lessonIndex={4}
      prev={{ path: '/vite/devserver', label: 'Dev Server & HMR' }}
      next={null}
    >
      {/* ── PRODUCTION BUILD INTERNALS ─────────────────────── */}
      <h2>Production Build Internals: Rollup Under the Hood</h2>
      <p>
        Everything covered so far — native ESM serving, esbuild pre-bundling, HMR — is dev
        mode. Run <code>vite build</code> and a completely different engine takes over:
        Rollup treats <code>index.html</code> as the true entry point, builds a full
        dependency graph, and produces tree-shaken, content-hashed, chunked output. Vite's
        <code>build.rollupOptions</code> passes configuration straight through to Rollup.
      </p>

      <FlowChart
        title="vite build Pipeline"
        chart={"graph TD\n  A[index.html] --> B[Rollup resolves script tags as entries]\n  B --> C[Build full module dependency graph]\n  C --> D[Tree-shake unused exports]\n  D --> E[Apply manualChunks splitting rules]\n  E --> F[Minify with esbuild or terser]\n  F --> G[Emit hashed files to dist/]\n  G --> H[Rewrite index.html with final asset URLs]"}
      />

      <CodeBlock language="javascript" title="vite.config.ts — build.rollupOptions">{`import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Warn if any chunk exceeds this size (kB) after minification
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      // Support multiple HTML entry points (multi-page app)
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
      output: {
        // Manual chunk splitting — group related dependencies together
        // so a change to one doesn't invalidate the cache for the rest
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lodash')) {
              return 'vendor-lodash';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});`}</CodeBlock>

      <InfoBox variant="tip" title="Start With Automatic Chunking">
        Vite's default chunking (splitting dynamic <code>import()</code> boundaries into
        their own chunks) is good for most apps out of the box. Reach for
        <code>manualChunks</code> only once you've profiled a real caching or bundle-size
        problem — over-splitting can create so many small chunks that request overhead
        outweighs the caching benefit.
      </InfoBox>

      {/* ── LIBRARY MODE ───────────────────────────────────── */}
      <h2>Library Mode</h2>
      <p>
        If you're publishing a component library or utility package to npm rather than
        shipping an app, <code>build.lib</code> switches Vite into library mode: no
        <code>index.html</code> entry, no hashed asset filenames, and externalized peer
        dependencies instead of bundled ones.
      </p>

      <CodeBlock language="javascript" title="vite.config.ts — build.lib">{`import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MyComponentLibrary',
      // Output both formats so consumers can use either
      formats: ['es', 'cjs'],
      fileName: (format) => \`my-lib.\${format}.js\`,
    },
    rollupOptions: {
      // Don't bundle peer dependencies into the library output —
      // the consuming app supplies its own copy
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});`}</CodeBlock>

      <InfoBox variant="info" title="Library Mode vs App Mode">
        This is a direct replacement for the kind of hand-rolled Rollup config teams used to
        maintain separately for package publishing. The key difference from app-mode
        builds: dependencies you'd normally bundle (React, Vue) get marked
        <code>external</code> instead, because the consuming application should provide its
        own single copy rather than shipping a duplicate inside your library.
      </InfoBox>

      {/* ── SSR OVERVIEW ───────────────────────────────────── */}
      <h2>Server-Side Rendering: A Concise Overview</h2>
      <p>
        Vite has first-class SSR primitives, but it deliberately doesn't ship a full SSR
        framework — that's what Next.js, Nuxt, SvelteKit, and Astro build on top of it. If
        you're not building a custom SSR pipeline yourself, you'll interact with these
        primitives indirectly through one of those frameworks. Here's the shape of it, not
        a deep dive.
      </p>

      <FlowChart
        title="General SSR Request-Handling Flow"
        chart={"graph TD\n  A[Incoming HTTP request] --> B[Node server - Vite in middleware mode]\n  B --> C[vite.ssrLoadModule loads entry-server.js]\n  C --> D[Entry module renders app to an HTML string]\n  D --> E[HTML template + rendered string + client script tags merged]\n  E --> F[Full HTML response sent to browser]\n  F --> G[Client-side JS hydrates the static HTML into an interactive app]"}
      />

      <CodeBlock language="javascript" title="Conceptual SSR Entry (Framework-Agnostic Shape)">{`// server.js — using createServer in middleware mode (from the previous lesson)
import { createServer as createViteServer } from 'vite';

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

app.use('*', async (req, res) => {
  // ssrLoadModule transforms and executes a module in an SSR-friendly way,
  // resolving the same imports your client code uses
  const { render } = await vite.ssrLoadModule('/src/entry-server.js');

  const appHtml = await render(req.url); // your framework's render function

  const html = template.replace('<!--app-html-->', appHtml);
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
});`}</CodeBlock>

      <InfoBox variant="warning" title="Don't Hand-Roll SSR Unless You Have To">
        Building SSR directly on <code>ssrLoadModule</code> means owning hydration
        mismatches, streaming, data-fetching coordination, and route-based code splitting
        yourself. For any real product, prefer Next.js, Nuxt, SvelteKit, or Astro — they
        solve these problems on top of exactly the primitives shown here.
      </InfoBox>

      {/* ── MIGRATION ──────────────────────────────────────── */}
      <h2>Migration Checklist: Webpack/CRA → Vite</h2>
      <p>
        The concepts map over cleanly, but a handful of conventions differ enough to break
        a naive port. Work through this in order.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Webpack / CRA</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Vite Equivalent</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>REACT_APP_*</code> env vars</td>
            <td style={{ padding: '8px' }}><code>VITE_*</code>, read via <code>import.meta.env</code> not <code>process.env</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>public/index.html</code> as a template</td>
            <td style={{ padding: '8px' }}><code>index.html</code> at project root — the real entry point</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>webpack.config.js</code> aliases (<code>resolve.alias</code>)</td>
            <td style={{ padding: '8px' }}><code>vite.config.ts</code> <code>resolve.alias</code> (same shape)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>module.rules</code> loaders</td>
            <td style={{ padding: '8px' }}>Mostly unnecessary — CSS/Sass/assets work with zero config; use plugins for the rest</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>html-webpack-plugin</code></td>
            <td style={{ padding: '8px' }}>Not needed — Vite treats <code>index.html</code> as an entry natively</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>DefinePlugin</code></td>
            <td style={{ padding: '8px' }}><code>define</code> option in <code>vite.config.ts</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <td style={{ padding: '8px' }}><code>devServer.proxy</code></td>
            <td style={{ padding: '8px' }}><code>server.proxy</code> (same shape)</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}><code>@svgr/webpack</code></td>
            <td style={{ padding: '8px' }}><code>vite-plugin-svgr</code></td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="bash" title="Step-by-Step Migration">{`# 1. Install Vite and the framework plugin
npm install --save-dev vite @vitejs/plugin-react

# 2. Move index.html from public/ to the project root
mv public/index.html ./index.html

# 3. Add a module script pointing at your real entry file
#    <script type="module" src="/src/main.jsx"></script>

# 4. Rename env vars: REACT_APP_* → VITE_*
#    and update all process.env.REACT_APP_* → import.meta.env.VITE_*

# 5. Replace any require() calls with import — Vite is ESM-only

# 6. Create vite.config.ts with resolve.alias matching your old webpack aliases

# 7. Update package.json scripts:
#    "dev": "vite"
#    "build": "vite build"
#    "preview": "vite preview"

# 8. Remove webpack/react-scripts dependencies, delete webpack.config.js`}</CodeBlock>

      <CodeBlock language="javascript" title="vite.config.ts — A Typical Migration Target">{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});`}</CodeBlock>

      <h3>Common Gotchas</h3>
      <ul>
        <li><strong>Node globals</strong> &mdash; <code>process</code>, <code>Buffer</code>, and <code>global</code> aren't polyfilled automatically like some Webpack setups did; refactor or add explicit polyfills</li>
        <li><strong>Dynamic import magic comments</strong> &mdash; Webpack's <code>webpackChunkName</code> comments are ignored by Rollup; Vite/Rollup name chunks automatically</li>
        <li><strong>Absolute imports from <code>src/</code></strong> &mdash; CRA allowed bare imports rooted at <code>src/</code>; replicate with a <code>@/</code> alias</li>
        <li><strong>SVG-as-component imports</strong> &mdash; install <code>vite-plugin-svgr</code> to keep CRA-style <code>import {'{ ReactComponent as Icon }'} from './icon.svg'</code> working</li>
        <li><strong>Jest → Vitest</strong> &mdash; Jest configs and mocks don't carry over 1:1; Vitest shares Vite's config and transform pipeline but has its own mocking API</li>
      </ul>

      <InfoBox variant="tip" title="Migrate Incrementally">
        You don't need a big-bang cutover. Some teams run Vite for local development while
        keeping Webpack for the production build during the transition, then flip
        production once the Vite build has been verified against the same test suite.
      </InfoBox>

      <InteractiveChallenge
        question="When migrating a Create React App project to Vite, what must index.html do differently?"
        options={[
          "Nothing — it stays in public/ exactly as CRA had it",
          "It moves to the project root and becomes the real module entry point via a <script type=\"module\"> tag",
          "It gets deleted — Vite generates HTML automatically",
          "It must be renamed to entry.html"
        ]}
        correctIndex={1}
        explanation="CRA (via Webpack) treats public/index.html as a template that html-webpack-plugin injects a bundle reference into. Vite treats index.html at the project root as the actual entry point of the module graph — the script type='module' tag inside it is where resolution starts."
      />

      <h2>Wrapping Up</h2>
      <p>
        You now have a complete picture of Vite &mdash; from the native-ESM dev server and
        esbuild pre-bundling that make it fast, through its Rollup-compatible plugin system
        and zero-config asset/CSS handling, to production build internals, library mode, a
        working mental model of SSR, and a concrete path off Webpack or CRA. Reference
        checklist:
      </p>
      <ul>
        <li><strong>New SPA?</strong> <code>npm create vite@latest</code> is the default starting point.</li>
        <li><strong>Slow dev server elsewhere?</strong> Vite's native-ESM approach is the fix, not more Webpack config.</li>
        <li><strong>Publishing a package?</strong> <code>build.lib</code> replaces a hand-rolled Rollup config.</li>
        <li><strong>Need SSR?</strong> Reach for Next.js/Nuxt/SvelteKit/Astro before hand-rolling <code>ssrLoadModule</code>.</li>
        <li><strong>Migrating an existing app?</strong> Follow the checklist above — env prefix, entry HTML location, and aliases are the three things that actually break.</li>
      </ul>
    </LessonLayout>
  );
}

export default Advanced;
