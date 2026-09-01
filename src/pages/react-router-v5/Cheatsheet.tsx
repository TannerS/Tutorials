import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function ReactRouterV5Cheatsheet() {
  return (
    <GuideLayout
      title="React Router v5"
      kicker="FIELD GUIDE"
      glyph="🗺️"
      tagline="The Classic API — Switch, Route, PrivateRoute, and the prefix-matching rules that make v5 a different engine from v6+, not just a relabeled one."
      meta={['v5.3.4 (final release)', 'Switch/Route Classic Router', '16 panels']}
      page="1 / 1"
      footer="This page is for recall. The lessons in this section carry the reasoning, the worked examples, and everything verified against the real react-router-dom@5.3.4 package."
      prev={{ path: '/react-router-v5/legacy', label: 'Reading Legacy v5 Codebases' }}
      next={null}
    >
      <GuidePanel n={1} title="Setup" accent="blue" glyph="📦">
        <GuideCode>{`npm install react-router-dom@5
npm install --save-dev @types/react-router-dom@^5.3

// react-router-dom RE-EXPORTS react-router (router-agnostic
// core) plus browser bindings like BrowserRouter. Almost
// nobody imports 'react-router' directly in a v5 app.`}</GuideCode>
        <GuideRules items={['v5.3.4 ships NO TypeScript types of its own — @types/react-router-dom (latest 5.3.3) is not optional polish, it is the only source of types.']} />
      </GuidePanel>

      <GuidePanel n={2} title="Core Components & Default Matching" accent="purple" glyph="🧭" span={2}>
        <GuideCode>{`<BrowserRouter>   // History API routing
<HashRouter>       // #/fragment routing (static hosts, no server rewrites)
<Switch>            // renders the FIRST matching child, top to bottom
<Route>              // tests its own path independently — no Switch needed

// Verified against the real matchPath():
matchPath('/users/123', { path: '/users' });
// -> { isExact: false, ... }   MATCHED — prefix match is the default
matchPath('/users/123', { path: '/users', exact: true });
// -> null                       exact requires the pathname to END there`}</GuideCode>
        <GuideRules items={['exact defaults to false. Every path matches as a PREFIX unless you opt out — this is the opposite default from v6+.', 'A bare <Route> outside <Switch> just tests itself; several can render at once. <Switch> is what makes matching exclusive.']} />
      </GuidePanel>

      <GuidePanel n={3} title="component / render / children" accent="green" glyph="🎭" span={2}>
        <GuideTable
          head={['Prop', 'Called', 'Use for']}
          rows={[
            ['component={X}', 'React.createElement(X, routeProps)', 'Plain rendering, stable reference only'],
            ['render={fn}', 'fn(routeProps) on every matching render', 'Extra props, inline functions, guards'],
            ['children={fn}', 'fn({ match, ...routeProps }) — ALWAYS, match may be null', 'UI that reacts to match/no-match'],
          ]}
        />
        <GuideRules items={['Never pass an inline arrow function to component — e.g. component={() => <X/>}. A new function reference every render = a new component type = full unmount/remount, every time. Use render instead.']} />
      </GuidePanel>

      <GuidePanel n={4} title="exact & Switch Order — The Two Classic Footguns" accent="amber" glyph="🪤" span={2}>
        <GuideCode>{`// Footgun 1 — missing exact swallows everything
<Route path="/" component={Home} />        // ❌ matches EVERY url
<Route exact path="/" component={Home} />  // ✅

// Footgun 2 — a :param route placed before a static one wins,
// completely independent of exact:
<Route path="/users/:id" component={UserDetail} />   // checked first
<Route path="/users/new" component={NewUserForm} />  // unreachable!
// Visiting /users/new -> UserDetail renders with id="new"

// Fix: static/specific routes BEFORE dynamic :param routes,
// catch-all <Route path="*"> (or bare <Route>) LAST, always.`}</GuideCode>
        <GuideRules items={['<Switch> has no ranking algorithm (that is a v6+ <Routes> feature) — it is genuinely first-match-wins, so YOU are the ranking algorithm.']} />
      </GuidePanel>

      <GuidePanel n={5} title="Nested Routes: match.path vs match.url" accent="pink" glyph="🪆" span={2}>
        <GuideDefs
          items={[
            ['match.path', "the PATTERN, params intact — e.g. '/users/:id'. Use to build a nested <Route path>."],
            ['match.url', "the RESOLVED segment — e.g. '/users/42'. Use to build <Link to> / <Redirect to>."],
          ]}
        />
        <GuideCode>{`function UserDetail() {
  const match = useRouteMatch(); // no <Outlet /> in v5 — you render children yourself
  return (
    <>
      <Link to={\`\${match.url}/posts\`}>Posts</Link>
      <Switch>
        <Route exact path={match.path} component={Overview} />
        <Route path={\`\${match.path}/posts\`} component={Posts} />
      </Switch>
    </>
  );
}
// Relative <Link to="../posts"> strips URL SEGMENTS, not route
// levels — it has no concept of :id being one param. Build from
// match.url explicitly instead of relying on relative resolution.`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={6} title="Hooks (v5.1+) & withRouter" accent="cyan" glyph="🪝" span={2}>
        <GuideTable
          head={['Hook / HOC', 'Returns', 'Use in']}
          rows={[
            ['useHistory()', '{ push, replace, goBack, goForward, length }', 'Function components'],
            ['useLocation()', '{ pathname, search, hash, state, key }', 'Function components'],
            ['useParams()', ':params as strings', 'Function components'],
            ['useRouteMatch()', 'closest match, or test an explicit path', 'Function components'],
            ['withRouter(X)', 'injects history/location/match as props', 'Class components (no hooks)'],
          ]}
        />
        <GuideRules items={['history/location/match were ALWAYS injected as props by <Route> component/render/children, since v5.0.0 — hooks (v5.1) are just a hook-shaped way to reach the same objects.', 'withRouter OUTSIDE connect() — withRouter(connect(...)(X)) — so mapStateToProps can see location/match too.']} />
      </GuidePanel>

      <GuidePanel n={7} title="Redirect" accent="red" glyph="↪️">
        <GuideCode>{`<Redirect to="/login" />                    // history.replace() on mount
<Redirect to="/dashboard" push />           // history.push() instead
<Redirect to={{ pathname: '/login', state: { from: location } }} />

// Inside a Switch, "from" matches like a Route path — its
// :params carry over into "to" automatically:
<Redirect from="/old/:id" to="/new/:id" />`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={8} title="Data Fetching — useEffect IS the Loader" accent="blue" glyph="📡" span={2}>
        <GuideCode>{`// No loader/action/useLoaderData in v5 — every component fetches itself.
const { userId } = useParams();
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  fetch(\`/api/users/\${userId}\`)
    .then(r => r.json())
    .then(d => { if (!cancelled) setData(d); })
    .catch(e => { if (!cancelled) setError(e.message); })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };  // guards against out-of-order responses
}, [userId]);  // MUST include the param — same component instance is reused`}</GuideCode>
        <GuideRules items={['Missing [userId] = stale data after navigating: the same component instance persists across /users/1 -> /users/2, so the effect must re-run itself.', 'v5 has no built-in stale-navigation cancellation (v6.4+ loaders do) — the cancelled flag or AbortController above is on you.']} />
      </GuidePanel>

      <GuidePanel n={9} title="PrivateRoute & RBAC" accent="green" glyph="🔐" span={2}>
        <GuideCode>{`function PrivateRoute({ component: Component, ...rest }) {
  const { user } = useAuth();
  return (
    <Route
      {...rest}
      render={(props) =>
        user
          ? <Component {...props} />
          : <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
      }
    />
  );
}

// Login page reads it back:
const from = location.state?.from?.pathname || '/dashboard';
history.replace(from);   // replace, not push — skip /login on back-button`}</GuideCode>
        <GuideRules items={['PrivateRoute ships in NO React Router package, any version — it is a community pattern every team hand-rolls, which is why it looks slightly different everywhere.', 'This is UX, not security. Real enforcement is server-side, on every /api/* endpoint, independent of the client.']} />
      </GuidePanel>

      <GuidePanel n={10} title="Advanced Toolkit" accent="purple" glyph="🧰" span={2}>
        <GuideCode>{`// useRouteMatch — two forms
useRouteMatch();          // implicit: closest enclosing <Route>'s match
useRouteMatch('/admin');  // explicit: test ANY path, no <Route> required

// Query strings — manual parsing, no useSearchParams() in v5
const params = new URLSearchParams(useLocation().search);
const sort = params.get('sort') ?? 'name';
// query-string npm package adds array/type handling URLSearchParams lacks

// Prompt — block navigation (removed in v6, later split into
// useBlocker + unstable_usePrompt)
<Prompt when={isDirty} message="Unsaved changes — leave anyway?" />`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={11} title="Testing Reference" accent="amber" glyph="🧪" span={2}>
        <GuideTable
          head={['Scenario', 'Pattern']}
          rows={[
            ['Render at a URL', "<MemoryRouter initialEntries={['/x']}>"],
            ['Click link, check nav', 'MemoryRouter + userEvent.click'],
            ['Route params', 'useParams(), or match.params for class components'],
            ['PrivateRoute redirect', 'Render at the guarded URL; assert which page shows'],
            ['useHistory in a component', 'Real MemoryRouter (preferred) over jest.mock'],
            ['Unwrap a withRouter component', 'Component.WrappedComponent — no router needed'],
            ['Prompt / blocked navigation', 'getUserConfirmation prop on MemoryRouter'],
          ]}
        />
        <GuideRules items={['v5 has exactly ONE router test primitive (MemoryRouter) — no createMemoryRouter or createRoutesStub; those are v6.4+ data-router concepts with nothing to bridge to here.']} />
      </GuidePanel>

      <GuidePanel n={12} title="Complete App Shape" accent="cyan" glyph="🏗️">
        <GuideCode>{`<Router>
  <RootLayout>              {/* wraps children, no Outlet */}
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/login" component={Login} />
      <PrivateRoute path="/dashboard" component={Dashboard} />
      <Route path="*" component={NotFound} />  {/* LAST, always */}
    </Switch>
  </RootLayout>
</Router>`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={13} title="Recognizing v5 On Sight" accent="pink" glyph="🔎" span={2}>
        <GuideCode>{`// Hard tells — none of these exist in v6, v7, or v8:
import { Switch, Redirect, withRouter } from 'react-router-dom';
history.push('/x')            // not navigate('/x')
match.params.id               // not (only) useParams()
<Route exact component={X} /> // exact + component/render, not element
<NavLink activeClassName="active">   // removed in v6

// Soft tells — exist in BOTH, don't prove anything alone:
useParams()  useLocation()    // same in v5 and v6+

// A codebase mixing class components (withRouter) AND function
// components (hooks) side by side is itself a v5 signal.`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={14} title="Legacy Footguns Quick Table" accent="red" glyph="🐛" span={2}>
        <GuideTable
          head={['Symptom', 'Real cause', 'Fix']}
          rows={[
            ['Home renders on every URL', 'Root Route missing exact', 'Add exact to path="/"'],
            ['/x/new renders the :id page', ':param route declared before the static one', 'Static/specific routes first in Switch'],
            ['Stale data after clicking a sibling link', 'Same component instance reused across param change', 'componentDidUpdate check, or key={param} to force remount'],
            ['Whole app renders one page', 'Catch-all Route not last in Switch', 'Move path="*" / bare Route to the end'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={15} title="Upgrading Off v5" accent="blue" glyph="🚧" span={2}>
        <GuideCode>{`// Officially: mostly all-or-nothing, one real exception.
// A <Switch>/<Route render> tree and a <Routes>/<Route element>
// tree cannot both run under one <BrowserRouter> — different
// engines, one react-router-dom major installed at a time.

npm install react-router-dom-v5-compat   // real, maintained by the RR team

import { CompatRouter, CompatRoute } from 'react-router-dom-v5-compat';
// CompatRouter runs v5 AND v6 route trees in parallel — migrate
// "one component, one hook, and one route at a time" instead of
// a single cutover. Officially recommended for apps with more
// than a few routes.`}</GuideCode>
        <GuideRules items={['The compat package only bridges v5 -> v6. Later hops to v7/v8 follow the same staged path as any v6 app — see the v6/v7 section’s Migration Guide.', 'Small app, few routes? An all-at-once weekend swap is often less work than standing up the compat layer.']} />
      </GuidePanel>

      <GuidePanel n={16} title="Master Decision Table" accent="green" glyph="🧭" span={2}>
        <GuideTable
          head={['Need', 'Reach for']}
          rows={[
            ['Router access, class component', 'withRouter(X)'],
            ['Router access, function component', 'useHistory / useLocation / useParams / useRouteMatch'],
            ['Nested routes, no Outlet in v5', 'match.path for child <Route>, match.url for <Link>'],
            ['Guard a route', '<PrivateRoute> — Route + render + Redirect'],
            ['Fetch data for a route', 'useEffect + fetch, 3-state, [param] in deps'],
            ['Read ?sort=price', 'useLocation().search + URLSearchParams'],
            ['Block navigation on unsaved changes', '<Prompt when={dirty} message="..." />'],
            ['Route renders the wrong thing', 'Check Switch order: specific before dynamic, catch-all last'],
            ['Move off v5, big app', 'react-router-dom-v5-compat, incremental'],
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}
