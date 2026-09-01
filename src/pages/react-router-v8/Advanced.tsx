import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Advanced() {
  return (
    <LessonLayout
      title="Advanced Patterns"
      sectionId="react-router-v8"
      lessonIndex={4}
      prev={{ path: '/react-router-v8/guards', label: 'Auth Guards & Protected Routes' }}
      next={{ path: '/react-router-v8/testing', label: 'Testing Routes' }}
    >
      <p>
        React Router 8 (released June 2026) is a relatively quiet major version by
        design — its own release notes describe the goal as making major upgrades
        &quot;boring.&quot; Most of what follows will look identical to a v7 app,
        because most of it <em>is</em> identical: the <code>lazy</code> route
        property, <code>&lt;ScrollRestoration /&gt;</code>, modal routes, and
        breadcrumbs via <code>useMatches()</code> all work exactly as they did in
        v7. The section below on middleware is the one genuine behavior change —
        everything else here is v8-accurate, not v8-new.
      </p>

      <InfoBox variant="info" title="v8 Baseline Requirements">
        <p style={{ marginBottom: 0 }}>
          React Router 8 raises its minimum supported versions: <strong>Node
          22.22.0+</strong>, <strong>React 19.2.7+</strong>, and{' '}
          <strong>Vite 7+</strong> for Framework Mode. The package is also now{' '}
          <strong>ESM-only</strong> — <code>react-router-dom</code> has been removed
          entirely, so <code>RouterProvider</code> and <code>HydratedRouter</code>{' '}
          come from <code>react-router/dom</code>, and everything else comes from{' '}
          <code>react-router</code>. If you&apos;re carrying over v6-style{' '}
          <code>react-router-dom</code> imports, they will fail to resolve on v8.
        </p>
      </InfoBox>

      <h2>Middleware &amp; Context — the Actual v8 Headline</h2>
      <p>
        Middleware itself is <strong>not</strong> new in v8 — it stabilized (lost
        its <code>unstable_</code> prefix) back in React Router 7.9. What v8
        changes is that the <code>future.v8_middleware</code> flag is gone and
        middleware is <strong>always on</strong>. That has one concrete
        consequence for your code: the <code>context</code> argument passed to
        every <code>loader</code>, <code>action</code>, and <code>middleware</code>{' '}
        function is now unconditionally a <code>RouterContextProvider</code>{' '}
        instance — you no longer need the{' '}
        <code>{`interface Future { v8_middleware: true }`}</code> module
        augmentation just to get it typed correctly.
      </p>

      <CodeBlock language="tsx" title="Type-Safe Context with createContext">
{`// app/context.ts
import { createContext } from 'react-router';
import type { User } from './types';

// A typed slot other code can read/write on the shared context.
// Optional default value returned when nothing has been set.
export const userContext = createContext<User | null>(null);`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Data Mode: middleware Array on a Route Object">
{`import { redirect, createBrowserRouter } from 'react-router';
import { userContext } from './context';

// Server- or client-side auth middleware. Throwing redirect() here
// stops the chain before any loader/action for this route (or its
// children) ever runs.
async function authMiddleware({ request, context }) {
  const user = await getUserFromSession(request);
  if (!user) {
    throw redirect('/login');
  }
  context.set(userContext, user);
}

// Client-side timing middleware — runs around the whole chain,
// including everything nested underneath it.
async function timingMiddleware({ context }, next) {
  const start = performance.now();
  await next();
  console.log(\`Navigation took \${performance.now() - start}ms\`);
}

const router = createBrowserRouter([
  {
    path: '/',
    middleware: [timingMiddleware],
    Component: RootLayout,
    children: [
      {
        path: 'dashboard',
        middleware: [authMiddleware],
        loader: dashboardLoader,
        Component: Dashboard,
      },
      { path: 'login', Component: Login },
    ],
  },
]);

// The loader reads what middleware set — no prop drilling, no
// separate auth context provider needed.
async function dashboardLoader({ context }) {
  const user = context.get(userContext);
  return { profile: await getProfile(user) };
}`}
      </CodeBlock>

      <FlowChart
        title="Middleware Chain — Nested, Then Unwinds"
        chart={"graph TD\nA[GET /dashboard] --> B[Root middleware: before next]\nB --> C[Dashboard middleware: before next]\nC --> D{authMiddleware: user found?}\nD -->|No| E[throw redirect to /login]\nD -->|Yes| F[context.set userContext]\nF --> G[Run loaders / render]\nG --> H[Dashboard middleware: after next]\nH --> I[Root middleware: after next]\nI --> J[Response sent]\nE --> J\nstyle D fill:#2a1f44\nstyle F fill:#1a2744\nstyle J fill:#1a3329"}
      />

      <InfoBox variant="tip" title="Middleware Runs Parent → Child → Parent">
        <p>
          Think of it like nested try/finally blocks. On the way down, each
          middleware runs the code before <code>await next()</code>, from root to
          leaf. Once the deepest loader/action resolves, execution unwinds back
          through each middleware&apos;s code <em>after</em> <code>next()</code>,
          from leaf back to root. A parent&apos;s <code>authMiddleware</code>{' '}
          throwing before calling <code>next()</code> short-circuits the whole
          chain — none of its children&apos;s middleware, loaders, or actions run.
        </p>
        <p style={{ marginBottom: 0 }}>
          Server middleware returns an HTTP <code>Response</code> up the chain
          (there&apos;s a real request/response to shape). Client middleware has no
          <code>Response</code> — in most cases you just ignore what{' '}
          <code>next()</code> resolves to and let loaders/actions drive the UI.
        </p>
      </InfoBox>

      <CodeBlock language="tsx" title="Seeding Context Once Per Navigation with getContext">
{`import { createBrowserRouter, RouterContextProvider } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { sessionContext } from './context';

const router = createBrowserRouter(routes, {
  // Called fresh for every navigation/fetcher call — good for values
  // that don't need a route-level middleware to compute (e.g. a
  // session object already available in memory).
  getContext() {
    const context = new RouterContextProvider();
    context.set(sessionContext, getSession());
    return context;
  },
});

function App() {
  return <RouterProvider router={router} />;
}`}
      </CodeBlock>

      <h2>Lazy Loading Routes (Data Mode — Unchanged Since v7)</h2>
      <p>
        The <code>lazy</code> property on a route object is identical to v7. It
        returns a module that exports route properties (<code>Component</code>,{' '}
        <code>loader</code>, <code>action</code>, <code>ErrorBoundary</code>,
        and now optionally <code>middleware</code>), downloaded only when the
        route is first visited.
      </p>

      <CodeBlock language="tsx" title="Route-Level Lazy Loading">
{`const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },  // always bundled
      {
        path: 'dashboard',
        lazy: () => import('./routes/Dashboard'),
      },
      {
        path: 'admin',
        lazy: () => import('./routes/Admin'),
      },
    ],
  },
]);

// routes/Dashboard.tsx — export named properties
export async function loader() {
  return fetch('/api/dashboard').then((r) => r.json());
}

export function Component() {   // capital C — this is the element
  const data = useLoaderData();
  return <div>Dashboard: {data.title}</div>;
}

export function ErrorBoundary() {
  const error = useRouteError();
  return <p>Dashboard failed: {error.message}</p>;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="lazy vs React.lazy() — Still True in v8">
        <p style={{ marginBottom: 0 }}>
          React Router&apos;s <code>lazy</code> property loads the entire route
          module in one import, so the loader can start running the moment the
          chunk arrives — in parallel with render preparation, not after it.{' '}
          <code>React.lazy()</code> only defers the component, which forces the
          route&apos;s data-fetching code to stay in the main bundle. This tradeoff
          is unchanged from v7; nothing about it moved in v8.
        </p>
      </InfoBox>

      <h2>splitRouteModules (Framework Mode) — Now a Config Default, Not a Flag</h2>
      <p>
        Framework Mode has a separate, complementary optimization:{' '}
        <code>future.v8_splitRouteModules</code> from v7 is now the top-level{' '}
        <code>splitRouteModules</code> config option, and it defaults to{' '}
        <code>true</code>. Where Data Mode&apos;s <code>lazy</code> property
        splits a whole route&apos;s module out of the main bundle, this splits a{' '}
        <em>single</em> file-based route file&apos;s exports —{' '}
        <code>clientLoader</code>, <code>clientAction</code>,{' '}
        <code>clientMiddleware</code>, <code>HydrateFallback</code> — into their
        own chunk, separate from the route component. That lets the data-fetching
        code run while the component chunk is still downloading.
      </p>

      <CodeBlock language="ts" title="react-router.config.ts">
{`import type { Config } from '@react-router/dev/config';

export default {
  // Default is true as of v8. Set to false to keep each route's
  // exports in one chunk, or "enforce" to fail the build on any
  // route that can't be split (usually shared top-level state).
  splitRouteModules: true,
} satisfies Config;`}
      </CodeBlock>

      <h2>Scroll Restoration (Unchanged Since v7)</h2>
      <CodeBlock language="tsx" title="ScrollRestoration">
{`import { ScrollRestoration, Outlet } from 'react-router';

function RootLayout() {
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
      <ScrollRestoration
        getKey={(location) => {
          const noRestore = ['/search', '/explore'];
          return noRestore.includes(location.pathname)
            ? location.key       // unique per visit — always scroll top
            : location.pathname; // same path = restore scroll position
        }}
      />
    </>
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="One Real v8 Bugfix Worth Knowing">
        <p style={{ marginBottom: 0 }}>
          v8.3.1 fixed a genuine <code>&lt;ScrollRestoration /&gt;</code> bug: it
          could leave <code>history.scrollRestoration</code> set to{' '}
          <code>&quot;auto&quot;</code> after a back-forward-cache restore, letting
          the browser jump the scroll position before your destination route had
          even rendered. If you saw scroll position &quot;fighting&quot; itself on
          back/forward navigation in older v8 releases, updating to 8.3.1+ fixes it
          — no code change required.
        </p>
      </InfoBox>

      <h2>View Transitions (Not New — Worth Covering Properly)</h2>
      <p>
        The View Transitions API integration has been in React Router since v6.4
        and carries over to v8 unchanged. It&apos;s included here because the v7
        lesson in this site didn&apos;t cover it and it&apos;s genuinely useful:
        one prop gets you a native cross-fade between routes, no animation library
        required.
      </p>

      <CodeBlock language="tsx" title="Basic View Transition">
{`// Declarative — wraps the navigation update in document.startViewTransition()
<Link to="/about" viewTransition>About</Link>

// Programmatic
import { useNavigate } from 'react-router';

function NavigationButton() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/about', { viewTransition: true })}>
      About
    </button>
  );
}`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Named Transitions with useViewTransitionState">
{`import { Link, useViewTransitionState } from 'react-router';

function NavImage({ src, idx }: { src: string; idx: number }) {
  const href = \`/image/\${idx}\`;
  const isTransitioning = useViewTransitionState(href);

  return (
    <Link to={href} viewTransition>
      <img
        src={src}
        style={{ viewTransitionName: isTransitioning ? 'image-expand' : 'none' }}
      />
    </Link>
  );
}

/* app.css — element on both the list and detail route share this name,
   so the browser animates between their two layouts automatically   */
/*
.image-detail img { view-transition-name: image-expand; }
*/`}
      </CodeBlock>

      <InfoBox variant="warning" title="Browser Support, Not Version Support">
        <code>viewTransition</code> degrades gracefully — browsers without the
        View Transitions API (older Firefox, older Safari) simply navigate without
        the animation. This is a browser capability question, not a React Router
        version question; it applies the same way on v7 and v8.
      </InfoBox>

      <h2>Prefetching Routes</h2>
      <CodeBlock language="tsx" title="Prefetch on Hover/Focus (Framework Mode)">
{`import { Link } from 'react-router';

<Link to="/dashboard" prefetch="intent">Dashboard</Link>

// prefetch options — unchanged from v7:
// "none"     — no prefetching (default in SPA mode)
// "intent"   — prefetch when user hovers or focuses the link
// "render"   — prefetch as soon as the link renders
// "viewport" — prefetch when the link enters the viewport

// SPA/Data Mode manual equivalent — trigger the lazy import early
function PrefetchLink({ to, children, ...props }) {
  const prefetch = () => {
    import(\`./routes/\${to.replace('/', '')}\`).catch(() => {});
  };
  return (
    <Link to={to} onMouseEnter={prefetch} onFocus={prefetch} {...props}>
      {children}
    </Link>
  );
}`}
      </CodeBlock>

      <h2>Route-Level Error Boundaries</h2>
      <p>
        Error boundaries attach per-route, same shape as v7: <code>errorElement</code>{' '}
        (element-based config) or an exported <code>ErrorBoundary</code>{' '}
        component (framework/lazy modules), read from with{' '}
        <code>useRouteError()</code>. The one thing worth calling out under
        always-on middleware: an error thrown by middleware — before or after{' '}
        <code>next()</code> — bubbles to the nearest ancestor route that actually
        renders (has a <code>loader</code>, <code>action</code>, or component),
        exactly the same bubbling rule loader/action errors already followed.
      </p>

      <CodeBlock language="tsx" title="ErrorBoundary Reads Middleware and Loader Errors the Same Way">
{`import { useRouteError, isRouteErrorResponse } from 'react-router';

function DashboardError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <p>{error.status}: {error.statusText}</p>;
  }
  // Doesn't matter whether authMiddleware threw or the loader threw —
  // both land here the same way.
  return <p>Something went wrong: {(error as Error).message}</p>;
}

const routes = [
  {
    path: 'dashboard',
    middleware: [authMiddleware],
    loader: dashboardLoader,
    Component: Dashboard,
    ErrorBoundary: DashboardError,
  },
];`}
      </CodeBlock>

      <h2>Modal Routes</h2>
      <p>
        Modal routes let you open a detail view as an overlay while keeping the
        list visible underneath, with a URL that can be shared or bookmarked.
        Unchanged from v7.
      </p>

      <CodeBlock language="tsx" title="Modal Route Pattern (background location)">
{`import { Outlet, useNavigate, useLocation, Link } from 'react-router';

function PhotoGrid() {
  const photos = useLoaderData();
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo) => (
          <Link
            key={photo.id}
            to={\`/photos/\${photo.id}\`}
            state={{ backgroundLocation: location }}
          >
            <img src={photo.thumbnail} alt={photo.title} />
          </Link>
        ))}
      </div>
      {backgroundLocation && <Outlet />}
    </>
  );
}

function PhotoModal() {
  const photo = useLoaderData();
  const navigate = useNavigate();
  return (
    <div className="modal-overlay" onClick={() => navigate(-1)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={photo.fullSize} alt={photo.title} />
        <button onClick={() => navigate(-1)}>Close</button>
      </div>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Breadcrumbs with useMatches</h2>
      <p>
        <code>useMatches()</code> returns every matched route from root to leaf.
        Attach a <code>handle</code> object to carry metadata like breadcrumb
        labels — unchanged from v7.
      </p>

      <CodeBlock language="tsx" title="Breadcrumbs from Route Matches">
{`const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    handle: { breadcrumb: 'Home' },
    children: [
      {
        path: 'projects',
        Component: Projects,
        handle: { breadcrumb: 'Projects' },
        children: [
          {
            path: ':projectId',
            Component: ProjectDetail,
            loader: projectLoader,
            handle: { breadcrumb: (data) => data.project.name },
          },
        ],
      },
    ],
  },
]);

import { useMatches, Link } from 'react-router';

function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      path: match.pathname,
      label: typeof match.handle.breadcrumb === 'function'
        ? match.handle.breadcrumb(match.data)
        : match.handle.breadcrumb,
    }));

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumbs">
        {crumbs.map((crumb, i) => (
          <li key={crumb.path}>
            {i < crumbs.length - 1
              ? <Link to={crumb.path}>{crumb.label}</Link>
              : <span aria-current="page">{crumb.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}`}
      </CodeBlock>

      <h2>Programmatic Navigation Patterns</h2>
      <CodeBlock language="tsx" title="Advanced Navigation">
{`import { useNavigate, useLocation } from 'react-router';

function useSmartNavigate() {
  const navigate = useNavigate();

  return {
    goTo: (path, options) => navigate(path, options),
    goBack: (fallback = '/') => {
      if (window.history.length > 1) navigate(-1);
      else navigate(fallback, { replace: true });
    },
    replace: (path) => navigate(path, { replace: true }),
    goWithState: (path, state) => navigate(path, { state }),
    redirectAfterAction: (path) => {
      navigate(path, { replace: true, state: { flash: 'Action completed' } });
    },
  };
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Avoid Navigation in Render">
        Never call <code>navigate()</code> during render — it must be in an event
        handler, effect, or callback. For render-time redirects use{' '}
        <code>&lt;Navigate to=&quot;/path&quot; /&gt;</code> instead.
      </InfoBox>

      <h2>React Router v7 vs v8 — What Actually Changed</h2>
      <CodeBlock language="text" title="Key Differences: v7 → v8">
{`┌───────────────────────────────┬──────────────────────────────────────────┐
│ v7                             │ v8                                        │
├───────────────────────────────┼──────────────────────────────────────────┤
│ react-router-dom re-exported   │ react-router-dom REMOVED — use            │
│  for v6 compat                 │  react-router/dom for RouterProvider/     │
│                                 │  HydratedRouter, react-router for rest    │
│ future.v8_middleware (opt-in)  │ Middleware always on, no flag needed      │
│ context may be untyped without │ context is always RouterContextProvider   │
│  Future module augmentation    │                                            │
│ future.v8_splitRouteModules    │ Top-level splitRouteModules config,       │
│  (opt-in flag)                 │  defaults to true                         │
│ future.v8_passThroughRequests  │ Raw request always passed through; use    │
│  (opt-in flag)                 │  the separate url param for normalized    │
│                                 │  routing logic                            │
│ future.v8_trailingSlashAware…  │ Trailing-slash-aware .data URLs always on │
│ meta() data field (deprecated) │ data field REMOVED — use loaderData       │
│ CJS + ESM published            │ ESM-only package                          │
│ Node 20+, React 18.2+/19+      │ Node 22.22.0+, React 19.2.7+, Vite 7+     │
│ future.unstable_previewServer… │ Vite-preview-server prerendering is the   │
│  Prerendering flag             │  only path — flag removed                 │
└───────────────────────────────┴──────────────────────────────────────────┘`}
      </CodeBlock>

      <InfoBox variant="note" title="Migration Tips, v7 → v8">
        If you've already adopted every v7 future flag prefixed <code>v8_</code>,
        the upgrade is close to a no-op: bump the package, delete the now-default
        flags from your config, and swap any remaining{' '}
        <code>react-router-dom</code> imports. The one place code changes are
        <em>required</em> rather than optional is a custom server&apos;s{' '}
        <code>getLoadContext</code> — it must now return a{' '}
        <code>RouterContextProvider</code> instance; returning a plain object,
        which worked pre-flag in some v7 setups, is no longer supported.
      </InfoBox>

      <InteractiveChallenge
        question={"In React Router 8, what changed about middleware compared to React Router 7?"}
        options={[
          "Middleware was introduced for the first time in v8",
          "Middleware became always-on (future.v8_middleware removed) and context is always a RouterContextProvider",
          "Middleware was removed in v8 in favor of loaders",
          "Middleware now only runs on the server, never the client",
        ]}
        correctIndex={1}
        explanation={"Middleware and createContext stabilized back in React Router 7.9 — they already existed. What v8 changes is that the future.v8_middleware flag is gone: middleware is unconditionally enabled, and the context argument passed to loaders, actions, and middleware is always a RouterContextProvider instance, with no Future module augmentation required to type it."}
        language="tsx"
      />

      <h2>Quick Reference: When to Use What</h2>
      <CodeBlock language="text" title="Pattern Decision Guide">
{`Need                          → Pattern
─────────────────────────────────────────────────────────
Shared layout                 → Nested route + Outlet
Auth guard, sharable context   → middleware array + createContext
Auth guard, simple redirect    → Loader redirect (still valid, simpler)
Data before render            → loader + useLoaderData
Form mutation                 → action + Form component
Inline mutation (no nav)      → useFetcher
Loading indicators            → useNavigation
Route errors (incl. middleware)→ ErrorBoundary/errorElement + useRouteError
URL breadcrumbs                → useMatches + handle.breadcrumb
Code splitting (Data Mode)     → lazy() on route objects
Code splitting (Framework)     → splitRouteModules (default true)
Scroll position                → <ScrollRestoration />
Modal overlay                  → backgroundLocation state pattern
Native page transitions        → viewTransition prop + useViewTransitionState
Type-safe routes               → Framework mode + route modules`}
      </CodeBlock>

      <FlowChart
        title="React Router v8 Request/Navigation Overview"
        chart={"graph TD\nA[URL Change] --> B[Router matches routes]\nB --> C[Run middleware top-down]\nC --> D{lazy route?}\nD -->|Yes| E[Download chunk, extract Component/loader/middleware]\nD -->|No| F[Use static config]\nE --> F\nF --> G[Run loaders in parallel]\nG --> H[Unwind middleware bottom-up]\nH --> I[Render matched components]\nI --> J[Outlets fill with children]\nJ --> K[ScrollRestoration / view transition runs]\nK --> L[Page visible to user]\nstyle C fill:#2a1f44\nstyle H fill:#2a1f44\nstyle G fill:#1a2744\nstyle L fill:#1a3329"}
      />

      <InfoBox variant="success" title="Summary">
        v8 is a small, deliberate step from v7: middleware moves from opt-in to
        mandatory, a few future flags graduate to permanent defaults, and the
        minimum runtime versions move forward. Everything else you already know
        from v7 — <code>lazy</code>, <code>ScrollRestoration</code>, modal routes,
        breadcrumbs, programmatic navigation — carries over unchanged. Learn
        middleware and context well; it's the one concept genuinely new to this
        major version.
      </InfoBox>
    </LessonLayout>
  );
}
