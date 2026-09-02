import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Migration() {
  return (
    <LessonLayout
      title="Migration Guide (v5→v8)"
      sectionId="react-router"
      lessonIndex={7}
      prev={{ path: '/react-router/fullapp', label: 'Complete App Routing' }}
      next={{ path: '/react-router/cheatsheet', label: '📋 React Router Field Guide' }}
    >
      <p>
        Migrating from React Router v5 to v7 is a two-step jump: v5 → v6
        (breaking API changes), then v6 → v7 (adopt the data APIs that landed in
        v6.4, and drop the handful of APIs v7 removed). This guide covers every
        change with before/after examples so you can migrate methodically.
      </p>

      <FlowChart
        title="Migration Decision Tree"
        chart={"graph TD\nA[Current Version?] --> B{v5?}\nA --> C{v6?}\nB -->|Yes| D[Step 1: Migrate to v6 API]\nD --> E[Switch to Routes]\nD --> F[component to element]\nD --> G[useHistory to useNavigate]\nD --> H[Remove exact]\nD --> I[Redirect to Navigate]\nE --> J[Step 2: Adopt v7 Data APIs]\nF --> J\nG --> J\nH --> J\nI --> J\nC -->|Yes| J\nJ --> K[Add createBrowserRouter]\nJ --> L[Add loaders and actions]\nJ --> M[Add errorElement]\nK --> N[Production-Ready v7 App]\nL --> N\nM --> N\nstyle D fill:#3d2f14\nstyle J fill:#2a1f44\nstyle N fill:#1a3329"}
      />

      <h2>v5 → v6: Breaking Changes</h2>

      <h3>1. Switch → Routes</h3>
      <CodeBlock language="jsx" title="Before (v5) → After (v6)">
{`// ❌ v5 — Switch renders the first matching Route
import { Switch, Route } from 'react-router';

<Switch>
  <Route exact path="/" component={Home} />
  <Route path="/about" component={About} />
  <Route path="/users/:id" component={UserDetail} />
</Switch>

// ✅ v6 — Routes replaces Switch, element replaces component
import { Routes, Route } from 'react-router';

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="/users/:id" element={<UserDetail />} />
</Routes>`}
      </CodeBlock>

      <InfoBox variant="info" title="Why the Change?">
        <code>&lt;Routes&gt;</code> uses a ranking algorithm to find the best match
        instead of relying on declaration order. This makes routing predictable and
        removes the need for <code>exact</code>.
      </InfoBox>

      <h3>2. component / render → element</h3>
      <CodeBlock language="jsx" title="Component Prop Migration">
{`// ❌ v5 — component prop (auto-creates element)
<Route path="/about" component={About} />

// ❌ v5 — render prop (for passing extra props)
<Route path="/about" render={(props) => <About {...props} lang="en" />} />

// ✅ v6 — element prop (you control the JSX)
<Route path="/about" element={<About lang="en" />} />`}
      </CodeBlock>

      <h3>3. useHistory → useNavigate</h3>
      <CodeBlock language="jsx" title="Navigation Hook Migration">
{`// ❌ v5 — useHistory
import { useHistory } from 'react-router';

function MyComponent() {
  const history = useHistory();

  const goToDashboard = () => history.push('/dashboard');
  const replaceCurrent = () => history.replace('/login');
  const goBack = () => history.goBack();
  const goForward = () => history.goForward();
}

// ✅ v6 — useNavigate
import { useNavigate } from 'react-router';

function MyComponent() {
  const navigate = useNavigate();

  const goToDashboard = () => navigate('/dashboard');
  const replaceCurrent = () => navigate('/login', { replace: true });
  const goBack = () => navigate(-1);
  const goForward = () => navigate(1);
}`}
      </CodeBlock>

      <h3>4. exact Removal</h3>
      <CodeBlock language="jsx" title="No More exact Prop">
{`// ❌ v5 — exact needed to prevent / matching everything
<Route exact path="/" component={Home} />
<Route path="/about" component={About} />

// ✅ v6 — Routes uses ranked matching, exact is not needed
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
</Routes>

// For index routes (match parent path exactly):
<Route index element={<Home />} />`}
      </CodeBlock>

      <h3>5. Redirect → Navigate</h3>
      <CodeBlock language="jsx" title="Redirect Component Migration">
{`// ❌ v5 — Redirect component
import { Redirect } from 'react-router';

<Route path="/old-page">
  <Redirect to="/new-page" />
</Route>

// Conditional redirect
{!isLoggedIn && <Redirect to="/login" />}

// ✅ v6 — Navigate component
import { Navigate } from 'react-router';

<Route path="/old-page" element={<Navigate to="/new-page" replace />} />

// Conditional redirect
{!isLoggedIn && <Navigate to="/login" replace />}`}
      </CodeBlock>

      <h3>6. Nested Routes Change</h3>
      <CodeBlock language="jsx" title="Nested Route Migration">
{`// ❌ v5 — nested routes inside component, manual path building
function Dashboard() {
  const { path } = useRouteMatch();
  return (
    <div>
      <Switch>
        <Route exact path={path} component={DashOverview} />
        <Route path={\`\${path}/settings\`} component={Settings} />
      </Switch>
    </div>
  );
}

// ✅ v6 — nested routes in config, relative paths, Outlet
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<DashOverview />} />
  <Route path="settings" element={<Settings />} />
</Route>

// DashboardLayout just renders <Outlet />
function DashboardLayout() {
  return (
    <div>
      <Sidebar />
      <Outlet />
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Relative Paths">
        In v6+, nested route paths are <strong>relative</strong> to the parent.
        Write <code>path=&quot;settings&quot;</code> not{' '}
        <code>path=&quot;/dashboard/settings&quot;</code>. Absolute paths starting
        with <code>/</code> break out of the parent hierarchy.
      </InfoBox>

      <h2>Breaking Changes Summary</h2>
      <CodeBlock language="jsx" title="v5 → v6 Migration Table">
{`/*
┌───────────────────────────┬──────────────────────────────┐
│ v5                        │ v6                           │
├───────────────────────────┼──────────────────────────────┤
│ <Switch>                  │ <Routes>                     │
│ <Route component={X} />  │ <Route element={<X />} />    │
│ <Route render={fn} />    │ <Route element={<X p={v} />} │
│ useHistory()              │ useNavigate()                │
│ history.push(path)        │ navigate(path)               │
│ history.replace(path)     │ navigate(path, {replace:true}│
│ history.goBack()          │ navigate(-1)                 │
│ <Route exact path="/" />  │ <Route path="/" /> (auto)    │
│ <Redirect to={path} />   │ <Navigate to={path} replace/>│
│ useRouteMatch()           │ useMatch() (different API)   │
│ match.params              │ useParams()                  │
│ Nested <Switch> in comp   │ <Outlet /> + child routes    │
│ <Route path="/dash/set">  │ <Route path="settings">     │
│ withRouter HOC            │ Removed — use hooks           │
└───────────────────────────┴──────────────────────────────┘
*/`}
      </CodeBlock>

      <h2>v6 → v7: Data APIs and Removals</h2>
      <p>
        Two things are commonly confused here. The data APIs —{' '}
        <code>createBrowserRouter</code>, <code>RouterProvider</code>,{' '}
        <code>loader</code>, <code>action</code>, <code>errorElement</code> — did{' '}
        <strong>not</strong> arrive in v7. They landed in <strong>v6.4</strong>,
        when the Remix data layer was ported over. What v7 adds is the full
        framework mode (file-based routes, SSR, typegen) plus a round of
        <em> removals</em> of APIs that v6.4 had introduced.
      </p>

      <InfoBox variant="danger" title="v7 Removed defer(), json(), and fallbackElement">
        <p>
          These three shipped in the v6.4 data APIs and were <strong>deleted</strong>{' '}
          in v7 — importing them now yields <code>undefined</code> and calling one
          throws <code>TypeError: defer is not a function</code>. Any v6-era tutorial
          you copy from will still use them.
        </p>
        <p style={{ marginBottom: 0 }}>
          <code>defer()</code> → return a bare promise from the loader (still use{' '}
          <code>&lt;Await&gt;</code> + <code>&lt;Suspense&gt;</code> to render it).{' '}
          <code>json()</code> → return a plain object, or use <code>data()</code> when
          you need to set a status/headers. <code>fallbackElement</code> →{' '}
          <code>HydrateFallback</code> on the root route.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="v6 → v7: the removed APIs">
{`// ❌ v6.4–v6.x — all three are GONE in v7
import { defer, json } from 'react-router';

export async function loader() {
  return defer({ reviews: fetchReviews() });     // TypeError in v7
}
export async function action() {
  return json({ ok: true }, { status: 201 });    // TypeError in v7
}
<RouterProvider router={router} fallbackElement={<Spinner />} />  // prop ignored

// ✅ v7 — return promises and plain objects directly
export async function loader() {
  return { reviews: fetchReviews() };            // bare promise, still works with <Await>
}

import { data } from 'react-router';
export async function action() {
  return { ok: true };                           // plain object for a normal 200
  // ...or when you need a status/headers:
  // return data({ ok: true }, { status: 201 });
}

// HydrateFallback on the root route replaces fallbackElement
{ path: '/', element: <RootLayout />, HydrateFallback: Spinner, children: [...] }`}
      </CodeBlock>

      <h3>Adopting createBrowserRouter</h3>
      <CodeBlock language="jsx" title="v6 JSX Router → v7 Config Router">
{`// v6 — JSX-based routing (still works in v7)
import { BrowserRouter, Routes, Route } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

// v7 — Config-based routing (unlocks data APIs)
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const router = createBrowserRouter([
  { path: '/', element: <Home />, loader: homeLoader },
  { path: '/about', element: <About /> },
]);

function App() {
  return <RouterProvider router={router} />;
}`}
      </CodeBlock>

      <h3>Adding Loaders and Actions</h3>
      <CodeBlock language="jsx" title="Adding Data APIs to Existing Routes">
{`// Before: fetching inside useEffect
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}

// After: loader fetches before render
export function loader() {
  return fetch('/api/users').then((r) => r.json());
}

function UserList() {
  const users = useLoaderData();
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Incremental Adoption">
        You don&apos;t have to migrate all routes at once. Switch to{' '}
        <code>createBrowserRouter</code> first, keeping existing components
        unchanged. Then add loaders one route at a time, replacing{' '}
        <code>useEffect</code> fetching as you go.
      </InfoBox>

      <h2>v7 → v8: What Changed in June 2026</h2>

      <p>
        v8 is a much smaller jump than v6 or v7 were &mdash; there is no new routing model
        to learn. Most of the work is mechanical, and if you already import from{' '}
        <code>react-router</code> rather than <code>react-router-dom</code> you have done
        the largest part of it.
      </p>

      <CodeBlock language="jsx" title="The v7 → v8 checklist">
{`// 1. react-router-dom is GONE. It was only ever a re-export shim in v7.
//    import { Link, useNavigate } from 'react-router';
//    import { RouterProvider, HydratedRouter } from 'react-router/dom';

// 2. ESM-only. There is no CJS build any more — if you require() it
//    from a CommonJS file, that now fails.

// 3. 'data' was renamed to 'loaderData' in meta / matches / useMatches.
//    export function meta({ loaderData }) { return [{ title: loaderData.title }]; }

// 4. Middleware left the flag. future.v8_middleware is the default now,
//    so remove the flag and adopt the stable API.

// 5. New floors: Node 22.22+, React 19.2.7+, Vite 7+.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Which Version Should You Actually Be On?">
        <p>
          The team&apos;s development focus has shifted to v8. If you are starting something
          new, treat v6 and v7 as legacy and start on v8. If you are on v6, the useful path is
          v6&nbsp;&rarr;&nbsp;v7&nbsp;&rarr;&nbsp;v8 rather than a single jump: v7 is where the
          data APIs and the package unification land, and it is much easier to verify one of
          those at a time.
        </p>
        <p>
          The examples throughout this section are written for v7, which is what this site
          pins. The import style is identical in v8, so they carry over unchanged &mdash; that
          is deliberate, and it is most of the migration.
        </p>
      </InfoBox>

      <h2>Step-by-Step Migration Approach</h2>
      <CodeBlock language="jsx" title="Recommended Migration Order">
{`/*
Phase 1 — Syntax Migration (v5 → v6 compat)
  1. Install react-router@latest
     (v5/v6 shipped as react-router-dom; v7 folded it into
      react-router and v8 removes the old package outright)
  2. Replace <Switch> with <Routes>
  3. Replace component/render props with element
  4. Replace useHistory with useNavigate
  5. Remove all "exact" props
  6. Replace <Redirect> with <Navigate replace>
  7. Move nested routes to parent config + <Outlet>
  8. Remove withRouter — use hooks instead
  9. Run tests — everything should still work

Phase 2 — Router Upgrade (v6 → v7 data APIs)
  1. Replace <BrowserRouter> with createBrowserRouter
  2. Wrap app in <RouterProvider router={router}>
  3. Add errorElement to root route
  4. Add loaders to data-fetching routes (one at a time)
  5. Replace useEffect fetch with useLoaderData
  6. Add actions to form-submission routes
  7. Replace manual submit handlers with <Form>
  8. Add loading states with useNavigation
  9. Run tests — verify all flows still work

Phase 3 — Optimize
  1. Add lazy() for code splitting
  2. Add <ScrollRestoration />
  3. Add route-level error boundaries
  4. Consider framework mode for new projects
*/`}
      </CodeBlock>

      <h2>Common Migration Pitfalls</h2>

      <InfoBox variant="danger" title="Pitfall: Nested Route Paths">
        In v5, child routes used full absolute paths like{' '}
        <code>/dashboard/settings</code>. In v6+, child paths are relative —
        write <code>settings</code> not <code>/dashboard/settings</code>. Adding
        a leading <code>/</code> makes it an absolute route that ignores the
        parent.
      </InfoBox>

      <InfoBox variant="danger" title="Pitfall: Navigate Without replace">
        <code>&lt;Navigate to=&quot;/login&quot; /&gt;</code> without{' '}
        <code>replace</code> pushes a new entry on every render, causing an
        infinite loop. Always add <code>replace</code> for render-time redirects.
      </InfoBox>

      <InfoBox variant="warning" title="Pitfall: useHistory in Event Handlers">
        Simply renaming <code>history.push</code> to <code>navigate</code> works
        in event handlers. But <code>history.listen</code> has no direct
        equivalent — use <code>useLocation</code> in a <code>useEffect</code>{' '}
        instead.
      </InfoBox>

      <CodeBlock language="jsx" title="history.listen Migration">
{`// ❌ v5 — history.listen
const history = useHistory();
useEffect(() => {
  const unlisten = history.listen((location) => {
    analytics.pageView(location.pathname);
  });
  return unlisten;
}, [history]);

// ✅ v6+ — useLocation in useEffect
const location = useLocation();
useEffect(() => {
  analytics.pageView(location.pathname);
}, [location]);`}
      </CodeBlock>

      <h2>Compatibility Mode</h2>
      <p>
        React Router v6 provided a compatibility package to ease migration from
        v5. This lets you run v5-style APIs alongside v6 routing while you
        migrate incrementally.
      </p>

      <CodeBlock language="jsx" title="Using the Compat Package">
{`// Install the compat layer
// npm install react-router-dom-v5-compat

// Use compat imports for components not yet migrated
import { CompatRouter, CompatRoute } from 'react-router-dom-v5-compat';

// Wrap your v5 app with CompatRouter instead of BrowserRouter
function App() {
  return (
    <CompatRouter>
      {/* v5-style routes still work */}
      <Switch>
        <Route exact path="/" component={Home} />
        {/* Gradually replace with v6 syntax */}
        <CompatRoute path="/new-page" element={<NewPage />} />
      </Switch>
    </CompatRouter>
  );
}

// Migrate one route at a time, then remove compat when done`}
      </CodeBlock>

      <h2>Quick Reference: Full Migration Checklist</h2>
      <CodeBlock language="jsx" title="Migration Checklist">
{`/*
v5 → v6 Syntax Changes
  [x] <Switch> → <Routes>
  [x] component={X} → element={<X />}
  [x] render={fn} → element={<X prop={val} />}
  [x] useHistory → useNavigate
  [x] history.push → navigate(path)
  [x] history.replace → navigate(path, { replace: true })
  [x] history.goBack → navigate(-1)
  [x] exact prop → removed (auto-ranked)
  [x] <Redirect> → <Navigate replace>
  [x] useRouteMatch → useMatch
  [x] withRouter HOC → removed (use hooks)
  [x] Nested <Switch> → <Outlet> + child routes
  [x] Absolute child paths → relative paths
  [x] history.listen → useLocation + useEffect

Adopting the Data APIs (available since v6.4)
  [x] BrowserRouter → createBrowserRouter + RouterProvider
  [x] useEffect fetch → loader + useLoaderData
  [x] Manual form submit → action + <Form>
  [x] Custom loading state → useNavigation
  [x] Try/catch in components → errorElement + useRouteError
  [x] React.lazy → lazy() on route config
  [x] Manual scroll handling → <ScrollRestoration />

v6 → v7 Removals (these WILL break at runtime)
  [x] defer({...})              → return { ...promises } directly
  [x] json(obj)                 → return obj  (or data(obj, { status }))
  [x] RouterProvider fallbackElement → HydrateFallback on the root route
*/`}
      </CodeBlock>

      <InfoBox variant="success" title="Series Complete!">
        You&apos;ve covered the entire React Router v7 journey — from basic
        setup through testing, full app architecture, and migration. The key
        takeaway: migrate incrementally, adopt <code>createBrowserRouter</code>{' '}
        first, then layer in loaders, actions, and error boundaries one route at
        a time. Happy routing!
      </InfoBox>
    </LessonLayout>
  );
}
