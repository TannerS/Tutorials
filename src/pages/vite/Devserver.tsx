import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Devserver() {
  return (
    <LessonLayout
      title="Dev Server & HMR"
      sectionId="vite"
      lessonIndex={3}
      prev={{ path: '/vite/plugins', label: 'Plugins & Asset Handling' }}
      next={{ path: '/vite/advanced', label: 'Advanced Config, SSR & Migration' }}
    >
      <h2>Serving Modules On Demand</h2>
      <p>
        Vite's dev server is a lightweight HTTP server (built on <code>connect</code>) that
        does no bundling. When the browser requests <code>index.html</code>, it finds a
        <code>&lt;script type="module"&gt;</code> tag and issues a native
        <code>import</code>. That import triggers a request back to the dev server for the
        specific file, which Vite transforms on the fly (JSX → JS, TS → JS, SCSS → CSS,
        etc.) and returns. Only files actually reachable from what's currently rendered get
        transformed — nothing is done speculatively.
      </p>

      <FlowChart
        title="Request Lifecycle for a Single Module"
        chart={"graph TD\n  A[Browser imports App.tsx] --> B[Dev server receives GET /src/App.tsx]\n  B --> C{Already transformed + cached?}\n  C -->|Yes| D[Serve cached transform]\n  C -->|No| E[Run resolveId / load / transform plugin hooks]\n  E --> F[esbuild strips types, compiles JSX]\n  F --> G[Rewrite bare imports to real URLs]\n  G --> H[Return as native ESM to browser]\n  H --> I[Browser issues further requests for App.tsx's own imports]"}
      />

      <InfoBox variant="info" title="No Bundle Means No Wasted Work">
        If a user never navigates to <code>/settings</code>, the module(s) behind that route
        are never transformed at all in this dev session. A bundler-based dev server, by
        contrast, generally has to include that code in the initial bundle graph whether or
        not it's ever rendered.
      </InfoBox>

      {/* ── HMR API ────────────────────────────────────────── */}
      <h2>The HMR API</h2>
      <p>
        Vite exposes a low-level Hot Module Replacement API on <code>import.meta.hot</code>.
        Framework plugins (React Fast Refresh, Vue's HMR) build on top of this API so you
        rarely write it by hand in application code — but understanding it demystifies what
        "HMR" actually means at the module level.
      </p>

      <CodeBlock language="javascript" title="import.meta.hot.accept — Manual HMR">{`// counter.js — a plain module managing some local state
export let count = 0;
export function increment() {
  count++;
  render();
}

function render() {
  document.querySelector('#count').textContent = count;
}

render();

if (import.meta.hot) {
  // Called when this module (or a dependency) is updated.
  // Vite swaps the module in place instead of reloading the page.
  import.meta.hot.accept((newModule) => {
    // newModule is the freshly re-evaluated module — you decide
    // how to reconcile it with current state
    render();
  });

  // Called right before this module is replaced — good for teardown
  // (clearing intervals, removing event listeners, closing sockets)
  import.meta.hot.dispose((data) => {
    console.log('module about to be replaced, cleaning up');
  });
}`}</CodeBlock>

      <FlowChart
        title="HMR Update Flow"
        chart={"graph TD\n  A[File saved] --> B[The file watcher detects a change]\n  B --> C[Server re-transforms only that module]\n  C --> D[WebSocket pushes update message to browser]\n  D --> E{Module or an ancestor calls hot.accept?}\n  E -->|Yes| F[dispose old, fetch new module, re-render]\n  E -->|No accept boundary found| G[Full page reload]"}
      />

      <InfoBox variant="tip" title="HMR Boundaries Propagate Upward">
        If a module doesn't call <code>import.meta.hot.accept()</code> itself, Vite walks up
        the import graph looking for an ancestor that does. If nothing in the chain accepts
        the update, Vite falls back to a full page reload — the same "accept or reload"
        model Webpack's HMR uses, just resolved per-module instead of per-bundle-chunk.
      </InfoBox>

      {/* ── FRAMEWORK HMR ──────────────────────────────────── */}
      <h2>React Fast Refresh & Vue HMR</h2>
      <p>
        In practice you almost never call <code>import.meta.hot</code> directly in
        component code — <code>@vitejs/plugin-react</code> injects the accept/dispose
        boundaries automatically around every component module, and wires them into React
        Fast Refresh, which preserves component state across an edit instead of remounting.
      </p>

      <CodeBlock language="javascript" title="What You Write (No HMR Code Needed)">{`// Counter.jsx — plugin-react handles HMR wiring transparently
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// Edit the JSX, save, and the button updates in place —
// count is NOT reset, because Fast Refresh preserves component state
// across an edit unless you change the component's hook structure.`}</CodeBlock>

      <p>
        Vue works the same way via <code>@vitejs/plugin-vue</code>: editing a
        <code>.vue</code> Single File Component's <code>&lt;template&gt;</code> or
        <code>&lt;style&gt;</code> block hot-swaps in place, while structural changes to
        <code>&lt;script setup&gt;</code> may trigger a full component remount.
      </p>

      <InfoBox variant="warning" title="Fast Refresh Requires One Component Per File Export">
        React Fast Refresh only reliably tracks state for files that export components (and
        only components) — mixing a component export with other exports (constants, hooks
        defined inline) in the same file can force a full remount instead of a state-
        preserving update. This is a React Fast Refresh convention, not unique to Vite.
      </InfoBox>

      {/* ── PROXY ──────────────────────────────────────────── */}
      <h2>server.proxy — Backend API Proxying</h2>
      <p>
        The same problem Webpack's <code>devServer.proxy</code> solves — your frontend dev
        server runs on one port, your backend API on another, and you want to avoid CORS
        friction and hardcoded absolute URLs.
      </p>

      <CodeBlock language="javascript" title="vite.config.ts — server.proxy">{`import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // Requests to /api/* are forwarded to the backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Optional: strip /api before forwarding
        rewrite: (path) => path.replace(/^\\/api/, ''),
      },
      // WebSocket proxy (e.g. for a real-time feature)
      '/socket.io': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
});

// In your app code:
// fetch('/api/users')  →  proxied to http://localhost:8080/users
// No CORS headers needed, no hardcoded backend URL in dev`}</CodeBlock>

      <InfoBox variant="tip" title="Match Production Behavior in Dev">
        Using a relative path like <code>/api/users</code> instead of an absolute URL means
        the same fetch call works unmodified whether it's proxied in dev or served from the
        same origin in production (e.g. behind a reverse proxy). Keep the proxy path prefix
        consistent with how your production infrastructure routes API traffic.
      </InfoBox>

      {/* ── MIDDLEWARE MODE ────────────────────────────────── */}
      <h2>server.middlewareMode — Embedding Vite in a Custom Server</h2>
      <p>
        Sometimes you need Vite's dev transforms available inside your own Node/Express
        server instead of running Vite standalone — most commonly for server-side rendering
        setups where a single Node process needs to both render HTML and serve module
        transforms. <code>middlewareMode</code> turns Vite into connect-compatible
        middleware you mount yourself.
      </p>

      <CodeBlock language="javascript" title="server.js — Vite Inside Express">{`import express from 'express';
import { createServer as createViteServer } from 'vite';

async function createServer() {
  const app = express();

  // Create Vite in middleware mode — no standalone HTTP server of its own
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom', // don't let Vite serve index.html itself
  });

  // Mount Vite's connect instance as middleware
  app.use(vite.middlewares);

  app.use('*', async (req, res) => {
    // Your own logic decides what HTML to send back —
    // typically reading a template and running SSR (next lesson)
    res.status(200).set({ 'Content-Type': 'text/html' }).end('<h1>Hello</h1>');
  });

  app.listen(5173);
}

createServer();`}</CodeBlock>

      <InfoBox variant="info" title="Who Actually Uses middlewareMode">
        Most projects never touch this directly — it's the mechanism SvelteKit, Nuxt, and
        custom SSR setups use under the hood. You'll encounter it if you build a custom SSR
        pipeline or need to inject authentication/logging middleware ahead of Vite's own
        request handling.
      </InfoBox>

      <InteractiveChallenge
        question="What happens when a module updated via HMR has no import.meta.hot.accept() boundary anywhere up its import chain?"
        options={[
          "Vite silently ignores the change until manual refresh",
          "Vite falls back to a full page reload",
          "The dev server crashes and must be restarted",
          "The old version of the module keeps running until the next build"
        ]}
        correctIndex={1}
        explanation="Vite walks up the import graph looking for an accept() boundary. If none exists anywhere in the chain, it falls back to a full page reload — the same safety net Webpack's HMR uses when no module.hot.accept() handler is found."
      />

      <h2>What's Next</h2>
      <p>
        You now understand how Vite serves and hot-updates modules in dev. The final lesson
        covers what changes at production build time — Rollup internals, library mode, a
        concise SSR overview, and a practical checklist for migrating a Webpack or CRA
        project to Vite.
      </p>
    </LessonLayout>
  );
}

export default Devserver;
