import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ModuleFederation() {
  return (
    <LessonLayout
      title="Module Federation & MFEs"
      sectionId="react19"
      lessonIndex={16}
      prev={{ path: '/react19/imperative-bridge', label: 'Imperative Bridge Patterns' }}
      next={{ path: '/react19/feature-folder', label: 'Feature-Based Architecture' }}
    >
      <h2>Micro-Frontends in One Paragraph</h2>
      <p>
        A micro-frontend (MFE) is a piece of a larger frontend app that ships and deploys
        independently. A <strong>shell</strong> app composes them at runtime.
        Webpack's <strong>Module Federation</strong> (MF) is the most common way to do
        this in React shops today. It solves a real problem — independent teams shipping
        independently — and introduces a specific set of gotchas that nothing else in
        the frontend world will prepare you for.
      </p>

      <FlowChart
        title="A typical MFE topology"
        chart={"graph TD\nA[Shell app: routing + auth] --> B[Remote: dashboard]\nA --> C[Remote: catalog]\nA --> D[Remote: billing]\nB --> E[Shared: ui-lib, react, mui]\nC --> E\nD --> E\nA --> E"}
      />

      <h2>The Basics — Host, Remote, Shared</h2>
      <CodeBlock language="js" title="Host (shell) webpack config">
{`// webpack.config.js — the shell
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');

module.exports = {
  // ...
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        dashboard: 'dashboard@/dashboard/mf-manifest.json',
        catalog:   'catalog@/catalog/mf-manifest.json',
      },
      shared: {
        react:     { singleton: true, requiredVersion: false },
        'react-dom': { singleton: true, requiredVersion: false },
        '@mui/material': { singleton: true, requiredVersion: false },
        '@emotion/react':  { singleton: true, requiredVersion: false },
        '@emotion/styled': { singleton: true, requiredVersion: false },
      },
    }),
  ],
  optimization: {
    // Required with MUI + Module Federation.
    concatenateModules: false,
  },
};

// Consumer code in the shell just does a normal dynamic import.
const Dashboard = React.lazy(() => import('dashboard/App'));`}
      </CodeBlock>

      <CodeBlock language="js" title="Remote webpack config">
{`// Each remote's webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App.tsx',
  },
  shared: {
    // Must match the shell's singleton declarations for the same packages.
    react:     { singleton: true, requiredVersion: false },
    'react-dom': { singleton: true, requiredVersion: false },
    '@mui/material': { singleton: true, requiredVersion: false },
    '@emotion/react':  { singleton: true, requiredVersion: false },
    '@emotion/styled': { singleton: true, requiredVersion: false },
  },
});`}
      </CodeBlock>

      <h2>Gotcha #1 — Singleton Libraries or Everything Breaks</h2>
      <p>
        The most important word in that config is <code>singleton: true</code> for React,
        React DOM, MUI, and Emotion. Without it, the shell and each remote each get their
        own copy at runtime.
      </p>
      <InfoBox variant="danger" title="What breaks without singletons">
        <ul>
          <li>
            <strong>Contexts don't cross the boundary.</strong> The shell's
            <code>createContext</code> and the remote's <code>useContext</code> refer to
            two <em>different</em> context objects. Consumers silently read the default
            value (usually <code>null</code>).
          </li>
          <li>
            <strong>Hooks throw "Invalid hook call".</strong> Two React instances, two
            reconcilers, one calling into the other.
          </li>
          <li>
            <strong>MUI theme fragments.</strong> Two <code>ThemeProvider</code>s, two
            Emotion caches, two style sheets. Some components pick up your theme; others
            fall back to MUI defaults.
          </li>
        </ul>
      </InfoBox>
      <p>
        Rule: any library that holds module-level state (React, ReactDOM, MUI, Emotion,
        Redux store, i18n, ag-grid license) must be a shared singleton.
      </p>

      <h2>Gotcha #2 — The "Localhost In Prod" Deploy Bug</h2>
      <p>
        In dev, remotes serve at <code>http://localhost:3001</code>,
        <code>:3002</code>, etc. If you deploy without swapping the remote URLs to the
        production ones, the shell's manifest still points at
        <code>localhost:3001</code> — every browser tries to fetch a remote from
        <em>their own machine</em>. Users with nothing on that port see the shell spinner
        forever. Users happening to run a local dev server on that port secretly serve
        their local build to themselves.
      </p>
      <CodeBlock language="text" title="Symptoms of the bug">
{`Users report "the app doesn't load; splash screen forever."
Some users see it working — turns out they have 'nx serve' running locally.
DevTools Network tab shows:
   GET http://localhost:3001/remoteEntry.js — ERR_CONNECTION_REFUSED`}
      </CodeBlock>
      <CodeBlock language="ts" title="A runtime remote-path override">
{`// public/assets/remotePaths.json — per-environment overlay
{
  "dashboard": "https://app.example.com/dashboard/remoteEntry.js",
  "catalog":   "https://app.example.com/catalog/remoteEntry.js"
}

// main.ts — fetch the overlay before boot, then rewrite the MF runtime.
async function boot() {
  const res = await fetch('/assets/remotePaths.json');
  const overrides = await res.json();

  // MF exposes runtime APIs to rewrite remote entries after startup.
  const runtime = (await import('@module-federation/runtime')).init({
    name: 'shell',
    remotes: Object.entries(overrides).map(([name, entry]) => ({
      name, entry: entry as string, type: 'manifest',
    })),
  });

  await import('./bootstrap');
}
boot();`}
      </CodeBlock>
      <InfoBox variant="warning" title="This is why you see main.ts + bootstrap.tsx everywhere">
        <p>
          The two-file bootstrap pattern (<code>main.ts</code> lazy-imports
          <code>bootstrap.tsx</code>) exists so that MF can resolve shared modules and
          apply runtime overrides <em>before</em> the app's own code starts pulling
          shared deps in. Skip the split, and MF hits shared modules before initialization
          is complete — cryptic module-scope errors follow.
        </p>
      </InfoBox>

      <h2>Gotcha #3 — Remote Load Failures Should Not Crash the Shell</h2>
      <p>
        If the dashboard remote is down, the whole shell shouldn't go white. Wrap each
        remote in an error boundary.
      </p>
      <CodeBlock language="tsx" title="An error boundary for remote failures">
{`import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { remote: string; fallback?: ReactNode; children: ReactNode }
interface State { hasError: boolean; err?: Error }

export class RemoteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    // report to your logger with which remote failed
    console.error(\`[remote:\${this.props.remote}] load failed\`, err, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert">
          Failed to load "{this.props.remote}".
          {process.env.NODE_ENV !== 'production' && this.state.err && (
            <pre style={{ opacity: 0.7 }}>{String(this.state.err)}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Use one per remote route.
<Route path="/dashboard/*" element={
  <RemoteErrorBoundary remote="dashboard">
    <React.Suspense fallback={<Spinner />}>
      <Dashboard />
    </React.Suspense>
  </RemoteErrorBoundary>
} />`}
      </CodeBlock>

      <h2>Gotcha #4 — Version Drift Between Shell and Remote</h2>
      <p>
        Your shell ships with MUI 7.2 today. A remote was built against MUI 7.1. Because
        they're both <code>singleton: true</code>, at runtime one of them wins — usually
        the one that loads first. The other remote reads APIs that don't exist in the
        loaded version and dies.
      </p>
      <p>
        Mitigations, in order of investment:
      </p>
      <ol>
        <li><strong>Version pinning.</strong> Every remote and the shell import
            <code>@cms/ui-lib</code> at the exact same version. Enforce via a lockfile in
            a monorepo, or a repo-wide script that reports drift.</li>
        <li><strong>Coordinated releases.</strong> Ship all remotes on the same tag as
            the shell.</li>
        <li><strong>Compatibility contract.</strong> The shell exposes a small stable API
            surface; remotes never import shell internals. Same principle as public API
            versioning for HTTP.</li>
      </ol>

      <h2>Gotcha #5 — MUI Emotion Cache Fragmentation</h2>
      <p>
        Even with singletons, Emotion caches by <em>root</em>. If a remote inserts styles
        without knowing about the shell's cache instance, styles get inserted twice
        or in the wrong order (spec-conformant but visually broken).
      </p>
      <CodeBlock language="tsx" title="Share the Emotion cache from the shell">
{`// In the shell — create the cache once and expose it globally.
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

const emotionCache = createCache({ key: 'app', prepend: true });

// Optional: attach for remotes to read (dev builds only; in prod, remotes should
// import a shared shell utility).
declare global {
  interface Window { __appEmotionCache?: typeof emotionCache }
}
window.__appEmotionCache = emotionCache;

root.render(
  <CacheProvider value={emotionCache}>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </CacheProvider>,
);`}
      </CodeBlock>

      <h2>Gotcha #6 — Concatenate-Modules Blows Up MUI</h2>
      <p>
        Webpack's <code>concatenateModules</code> optimization (scope hoisting) crashes
        the build when MUI's re-exports meet Module Federation. Turn it off in every MFE
        webpack config.
      </p>
      <CodeBlock language="js" title="Non-negotiable webpack setting">
{`module.exports = {
  optimization: {
    concatenateModules: false,   // required for MUI + Module Federation
  },
};`}
      </CodeBlock>

      <h2>Gotcha #7 — Shared Redux / Zustand / Query Client Stores</h2>
      <p>
        If the shell holds a Redux or React Query client and the remote wants to read from
        it, the store must be shared. Either:
      </p>
      <ul>
        <li>Wrap the shell in the store provider and mount remotes inside it; each remote
            uses the ambient store via hooks.</li>
        <li>Or pass the client explicitly as a prop or via a top-level context that all
            remotes agree to consume.</li>
      </ul>
      <p>
        In either case, the store package itself
        (<code>react-redux</code>, <code>@tanstack/react-query</code>) must be
        <code>singleton: true</code> in Module Federation.
      </p>

      <h2>Debugging Remotes</h2>
      <CodeBlock language="text" title="A short field guide">
{`Splash screen forever + no console errors:
  Network tab → look for failing remoteEntry.js requests.
  Usually a config bug (wrong URL) or a cross-origin problem.

"Invalid hook call" / hooks throw immediately:
  Two React instances loaded. Check that 'react' is singleton: true in every MFE
  and that requiredVersion doesn't disagree.

Empty screen with a console error mentioning 'default value':
  A context lookup failed — shell context isn't reaching the remote because
  React isn't a shared singleton.

Half of MUI styling missing / wrong theme:
  Emotion cache fragmentation. Confirm '@emotion/react' + '@emotion/styled' are
  singletons, and consider shared cache initialization.

"Cannot read properties of undefined (reading '...')" during MF init:
  You probably don't have the two-file bootstrap. Split main.ts and bootstrap.tsx.

Weird 'is not part of the concatenation' build errors:
  concatenateModules: false is missing from a webpack config.`}
      </CodeBlock>

      <h2>Testing MFE Boundaries</h2>
      <p>
        Full MFE testing needs the shell + at least one remote running. In practice:
      </p>
      <ul>
        <li>
          <strong>Unit tests</strong> per remote as if it were a standalone app.
        </li>
        <li>
          <strong>Contract tests</strong>: the shell has a small typed interface it
          expects each remote to expose. A CI job asserts each remote's
          <code>exposes</code> match the contract.
        </li>
        <li>
          <strong>E2E</strong> against a deployed environment where the shell composes
          real remotes.
        </li>
      </ul>

      <h2>When Not to Use Module Federation</h2>
      <InfoBox variant="warning" title="MFEs are a team-coordination tool, not a performance tool">
        <p>
          If your team is small enough to ship together, don't split. MF adds runtime
          load coordination, deployment coordination, versioning burden, and
          singleton hygiene. The break-even is at multiple independent teams that need
          to release independently against a shared shell. Below that, a monorepo with
          one build wins.
        </p>
      </InfoBox>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="A production-worthy MFE deployment has">
        <ul>
          <li>React, ReactDOM, MUI, Emotion (and any other module-stateful lib) are
              <code>singleton: true</code> in every remote and the shell.</li>
          <li>Every remote has an error boundary in the shell so a failed load doesn't
              take down the app.</li>
          <li>Remote URLs come from a per-environment overlay
              (<code>remotePaths.json</code> or equivalent), not baked in at build time.</li>
          <li>Two-file bootstrap (<code>main.ts</code> → <code>bootstrap.tsx</code>) so MF
              runtime resolves shared deps before app code runs.</li>
          <li><code>optimization.concatenateModules: false</code> in every webpack config
              that uses MUI + MF.</li>
          <li>The shell exposes a stable, versioned API surface; remotes never reach into
              shell internals.</li>
          <li>Nginx (or equivalent) serves remote assets at real deployed paths — no
              SPA-fallback returning the shell HTML for missing remote bundles.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="You add a new page to a remote MFE and calls to useContext() from that page start returning undefined even though the shell wraps everything in a Provider. What's the most likely cause?"
        options={[
          "The context value isn't memoized correctly",
          "React isn't declared as a shared singleton in Module Federation, so the shell and remote each loaded their own React instance — their createContext identities don't match",
          "You need to pass the context as a prop through the remote's boundary",
          "The provider is inside a Suspense boundary and hasn't hydrated"
        ]}
        correctIndex={1}
        explanation="This is the singleton trap. Contexts are keyed by the context object itself, which is created by React's createContext. If shell and remote each load their own React instance, they each create their own context objects — even if they share the same name — and useContext in the remote never sees the shell's Provider. Fix by declaring 'react' (and typically react-dom, MUI, Emotion) as singleton: true in every remote and the shell's Module Federation config."
      />
    </LessonLayout>
  );
}
