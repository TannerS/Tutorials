import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Migration() {
  return (
    <LessonLayout
      title="Migration Guide (v5→v7)"
      sectionId="react-router"
      lessonIndex={7}
      prev={{ path: '/react-router/fullapp', label: 'Complete App Routing' }}
      next={null}
    >
      <p>
        Migrating from React Router v5 to v7 is a two-step jump: v5 → v6
        (breaking API changes) then v6 → v7 (new data APIs, Remix merge). This
        guide covers every change with before/after examples so you can migrate
        methodically.
      </p>

      <FlowChart
        title="Migration Decision Tree"
        chart={"graph TD\nA[Current Version?] --> B{v5?}\nA --> C{v6?}\nB -->|Yes| D[Step 1: Migrate to v6 API]\nD --> E[Switch to Routes]\nD --> F[component to element]\nD --> G[useHistory to useNavigate]\nD --> H[Remove exact]\nD --> I[Redirect to Navigate]\nE --> J[Step 2: Adopt v7 Data APIs]\nF --> J\nG --> J\nH --> J\nI --> J\nC -->|Yes| J\nJ --> K[Add createBrowserRouter]\nJ --> L[Add loaders and actions]\nJ --> M[Add errorElement]\nK --> N[Production-Ready v7 App]\nL --> N\nM --> N\nstyle D fill:#f59e0b,color:#fff\nstyle J fill:#8b5cf6,color:#fff\nstyle N fill:#10b981,color:#fff"}
      />

      <h2>v5 → v6: Breaking Changes</h2>

      <h3>1. Switch → Routes</h3>
      <CodeBlock language="jsx" title="Before (v5) → After (v6)">
{`// ❌ v5 — Switch renders the first matching Route
import { Switch, Route } from 'react-router-dom';

<Switch>
  <Route exact path="/" component={Home} />
  <Route path="/about" component={About} />
  <Route path="/users/:id" component={UserDetail} />
</Switch>

// ✅ v6 — Routes replaces Switch, element replaces component
import { Routes, Route } from 'react-router-dom';

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
import { useHistory } from 'react-router-dom';

function MyComponent() {
  const history = useHistory();

  const goToDashboard = () => history.push('/dashboard');
  const replaceCurrent = () => history.replace('/login');
  const goBack = () => history.goBack();
  const goForward = () => history.goForward();
}

// ✅ v6 — useNavigate
import { useNavigate } from 'react-router-dom';

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
import { Redirect } from 'react-router-dom';

<Route path="/old-page">
  <Redirect to="/new-page" />
</Route>

// Conditional redirect
{!isLoggedIn && <Redirect to="/login" />}

// ✅ v6 — Navigate component
import { Navigate } from 'react-router-dom';

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

      <h2>v6 → v7: New Data APIs</h2>
      <p>
        The jump from v6 to v7 is less about breakage and more about adopting
        powerful new APIs. The Remix framework merged into React Router,
        bringing loaders, actions, and <code>createBrowserRouter</code>.
      </p>

      <h3>Adopting createBrowserRouter</h3>
      <CodeBlock language="jsx" title="v6 JSX Router → v7 Config Router">
{`// v6 — JSX-based routing (still works in v7)
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

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

      <h2>Step-by-Step Migration Approach</h2>
      <CodeBlock language="jsx" title="Recommended Migration Order">
{`/*
Phase 1 — Syntax Migration (v5 → v6 compat)
  1. Install react-router-dom@latest
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

      <InteractiveChallenge
        question={"What replaces useHistory().push('/path') in React Router v6+?"}
        options={[
          "useRouter().push('/path')",
          "useNavigate()('/path')",
          "navigate('/path') from useNavigate()",
          "useRedirect('/path')",
        ]}
        correctIndex={2}
        explanation={"useNavigate() returns a navigate function. Call it with a path string: navigate('/path'). For replace behavior, pass { replace: true } as the second argument. For going back, use navigate(-1)."}
        language="jsx"
      />

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

v6 → v7 Data APIs
  [x] BrowserRouter → createBrowserRouter + RouterProvider
  [x] useEffect fetch → loader + useLoaderData
  [x] Manual form submit → action + <Form>
  [x] Custom loading state → useNavigation
  [x] Try/catch in components → errorElement + useRouteError
  [x] React.lazy → lazy() on route config
  [x] Manual scroll handling → <ScrollRestoration />
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
