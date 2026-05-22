import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RRMigration() {
  return (
    <LessonLayout
      title="v5 to v6 Migration"
      sectionId="react-router"
      lessonIndex={7}
      prev={{ path: '/react-router/fullapp', label: 'Full Application Example' }}
      next={{ path: '/state-mgmt/intro', label: 'State Management Introduction' }}
    >
      <h2>What Changed in v6</h2>
      <p>
        React Router v6 was a significant rewrite that simplified the API and changed defaults.
        The core changes: all routes are exact by default, JSX syntax uses <code>element</code>
        instead of <code>component</code>, nested routes are declared centrally with
        <code>Outlet</code>, and several hooks were renamed or replaced.
      </p>

      <FlowChart
        title="v5 to v6 — Key Differences"
        chart={"graph LR\n  A[v5 Switch] --> B[v6 Routes]\n  C[v5 component=] --> D[v6 element=JSX]\n  E[v5 useHistory] --> F[v6 useNavigate]\n  G[v5 useRouteMatch] --> H[v6 useMatch/useLocation]\n  I[v5 nested inside component] --> J[v6 nested in route config]\n  K[v5 exact required] --> L[v6 exact by default]"}
      />

      <CodeBlock language="jsx" title="Core Routing Changes">
{`// ── 1. Switch → Routes ────────────────────────────────────────────
// v5
import { Switch, Route, Redirect } from 'react-router-dom';

<Switch>
  <Route exact path="/"        component={Home} />
  <Route exact path="/about"   component={About} />
  <Route       path="/users"   component={Users} />
  <Redirect from="/old-path"   to="/new-path" />
  <Route                       component={NotFound} />  {/* catch-all */}
</Switch>

// v6
import { Routes, Route, Navigate } from 'react-router-dom';

<Routes>
  <Route path="/"       element={<Home />} />
  <Route path="/about"  element={<About />} />
  <Route path="/users/*" element={<Users />} />           {/* /* for prefix match */}
  <Route path="/old-path" element={<Navigate to="/new-path" replace />} />
  <Route path="*"       element={<NotFound />} />         {/* catch-all */}
</Routes>

// Key changes:
// - exact removed: all routes are exact by default
//   (append /* to match a path prefix in v6)
// - component={Component} → element={<Component />}
//   (JSX: you can now pass props directly in element)
// - Redirect → Navigate component
// - No-path catch-all → explicit path="*"

// ── 2. Passing props to route components ─────────────────────────
// v5: use render prop to pass extra props
<Route path="/profile" render={(routeProps) => (
  <Profile {...routeProps} user={currentUser} theme="dark" />
)} />

// v6: just put them in the JSX element
<Route path="/profile" element={<Profile user={currentUser} theme="dark" />} />`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Hooks That Changed">
{`// ── useHistory → useNavigate ──────────────────────────────────────
// v5
import { useHistory } from 'react-router-dom';
const history = useHistory();
history.push('/dashboard');
history.replace('/login');
history.goBack();
history.go(-2);
history.push('/details', { from: 'list' });  // location state

// v6
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/dashboard');
navigate('/login', { replace: true });
navigate(-1);                                // go back
navigate(-2);                                // go back 2
navigate('/details', { state: { from: 'list' } });

// ── useRouteMatch → useMatch / useLocation ────────────────────────
// v5: useRouteMatch for current path matching
const match = useRouteMatch('/products/:id');
if (match) {
  const { params: { id }, url, path } = match;
}

// v6: useMatch for specific patterns, useLocation for current URL
import { useMatch, useLocation, useParams } from 'react-router-dom';

// Check if current path matches a pattern
const match = useMatch('/products/:id');
// match?.params.id — null if no match

// Get params of the current route
const { id } = useParams();                    // inside the matched route

// Get current URL info
const location = useLocation();
// location.pathname, location.search, location.hash, location.state

// ── useLocation state ─────────────────────────────────────────────
// v5 and v6 identical for reading state:
const location = useLocation();
const from = location.state?.from ?? '/';

// Navigate with state (v6)
navigate('/login', { state: { from: location.pathname } });`}
      </CodeBlock>

      <h2>Nested Routes — The Biggest Change</h2>

      <CodeBlock language="jsx" title="Nested Routes — From Inline to Centralized">
{`// ── v5: nested routes defined INSIDE child components ────────────
// Problems: routes are scattered; hard to see the full structure at once

// v5 App.jsx
<Switch>
  <Route path="/dashboard" component={Dashboard} />
</Switch>

// v5 Dashboard.jsx — nested routes defined here
function Dashboard() {
  const { path } = useRouteMatch();  // "/dashboard"
  return (
    <div>
      <DashboardNav />
      <Switch>
        <Route exact path={path}             component={DashboardHome} />
        <Route       path={path + '/orders'} component={Orders} />
        <Route       path={path + '/profile'} component={Profile} />
      </Switch>
    </div>
  );
}

// ── v6: nested routes declared centrally + Outlet ─────────────────
// All route structure visible in one place

// v6 router.jsx (or App.jsx)
<Routes>
  <Route path="/dashboard" element={<Dashboard />}>
    <Route index        element={<DashboardHome />} />
    <Route path="orders"  element={<Orders />} />
    <Route path="profile" element={<Profile />} />
  </Route>
</Routes>

// v6 Dashboard.jsx — just renders layout + Outlet
function Dashboard() {
  return (
    <div>
      <DashboardNav />
      <Outlet />  {/* child route renders here */}
    </div>
  );
}
// Navigating to /dashboard       → DashboardHome renders in Outlet
// Navigating to /dashboard/orders → Orders renders in Outlet

// ── INDEX ROUTES ──────────────────────────────────────────────────
// v5: exact on parent path
<Route exact path="/dashboard" component={DashboardHome} />

// v6: index prop
<Route index element={<DashboardHome />} />
// "index" renders when parent path matches exactly`}
      </CodeBlock>

      <h2>Step-by-Step Migration Strategy</h2>

      <CodeBlock language="markdown" title="Incremental Migration Plan">
{`## Phase 1: Upgrade Package
npm install react-router-dom@6
# React Router v6 is not backwards compatible with v5 JSX

## Phase 2: Replace Switch with Routes
# ✗ v5:
<Switch><Route exact path="/" component={Home} /></Switch>
# ✓ v6:
<Routes><Route path="/" element={<Home />} /></Routes>

## Phase 3: Update All Route Props
# Every Route: remove exact, rename component/render → element
# <Route exact path="/" component={Home} />
# → <Route path="/" element={<Home />} />
#
# For routes that need props:
# <Route path="/u" render={() => <User theme={theme} />} />
# → <Route path="/u" element={<User theme={theme} />} />  // cleaner!

## Phase 4: Update Redirects
# <Redirect from="/old" to="/new" />
# → <Route path="/old" element={<Navigate to="/new" replace />} />

## Phase 5: Update Hooks
# useHistory() → useNavigate()
# useRouteMatch() → useMatch() + useParams() + useLocation()

## Phase 6: Consolidate Nested Routes
# Move nested routes from inside components to the Route tree
# Add <Outlet /> where the child should render in the layout component

## Phase 7 (Optional): Migrate to Data Router
# Wrap router with createBrowserRouter() to use loaders and actions
# This step is optional — JSX Routes still works in v6

## Common Gotchas
# 1. Forgot /* on prefix routes: /users must be /users/* to match /users/42
# 2. Wrong hook names: useHistory → useNavigate, history.push → navigate
# 3. Outlet missing: nested routes render nothing without <Outlet /> in parent
# 4. State shape changed: navigate('/path', { state: data }) not push('/path', data)`}
      </CodeBlock>

      <InfoBox variant="warning" title="v6 Breaking Changes Checklist">
        <p>Before upgrading, audit your codebase for these v5-specific patterns:</p>
        <ul>
          <li><code>{'<Switch>'}</code> → must become <code>{'<Routes>'}</code></li>
          <li><code>component={'{Comp}'}</code> or <code>render={'{() => <Comp/>}'}</code> → <code>element={'{<Comp/>}'}</code></li>
          <li><code>useHistory()</code> → <code>useNavigate()</code></li>
          <li><code>useRouteMatch()</code> → <code>useMatch()</code> or <code>useParams()</code></li>
          <li><code>{'<Redirect>'}</code> → <code>{'<Navigate>'}</code></li>
          <li>Nested routes inside components → centralize with <code>{'<Outlet/>'}</code></li>
          <li>All routes without <code>exact</code> that relied on prefix matching → add <code>/*</code></li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="In React Router v6, why is the exact prop no longer needed on most routes?"
        options={[
          "v6 dropped exact matching entirely — all routes use prefix matching now",
          "All routes in v6 are exact by default — /about does not match /about/team unless you add /*",
          "exact was renamed to the strict prop in v6",
          "Routes v6 uses regex matching which handles exactness automatically"
        ]}
        correctIndex={1}
        explanation="React Router v6 changed the default matching behavior: all paths are exact by default. In v5, /about would match both /about and /about/team without exact. In v6, /about only matches /about exactly. To match a path and all its children (prefix matching), you must explicitly append /* to the path: /about/* matches /about, /about/team, /about/team/alice."
      />

      <InteractiveChallenge
        question="What replaces the v5 pattern of defining nested routes inside child components?"
        options={[
          "v6 does not support nested routes",
          "Nested routes are declared in the parent route config and the parent component uses Outlet to render the active child",
          "Nested routes are now defined using React Context",
          "Each nested route must be a separate file with its own createBrowserRouter"
        ]}
        correctIndex={1}
        explanation="In v5, nested routes were defined inside the component they belonged to using useRouteMatch(). In v6, all routes are declared centrally in the Route tree (or createBrowserRouter config). The parent component uses <Outlet /> to mark where the active child route should render. This makes the entire app's URL structure visible in one place instead of scattered across component files."
      />
    </LessonLayout>
  );
}
