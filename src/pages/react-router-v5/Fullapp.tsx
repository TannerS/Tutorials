import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Fullapp() {
  return (
    <LessonLayout
      title="Complete App Routing"
      sectionId="react-router-v5"
      lessonIndex={6}
      prev={{ path: '/react-router-v5/testing', label: 'Testing Routes' }}
      next={{ path: '/react-router-v5/legacy', label: 'Reading Legacy v5 Codebases' }}
    >
      <p>
        Let&apos;s build a complete routing structure for a production-style app,
        assembled entirely from real <code>react-router-dom@5</code> API:{' '}
        <code>&lt;BrowserRouter&gt;</code>, <code>&lt;Switch&gt;</code>,{' '}
        <code>exact</code>, a hand-rolled <code>&lt;PrivateRoute&gt;</code> guard,
        nested routes built off <code>match.path</code>, and a <code>path=&quot;*&quot;</code>{' '}
        catch-all. This is what a real v5 app&apos;s router setup actually looked
        like — no <code>&lt;Outlet /&gt;</code>, no loaders, no{' '}
        <code>useNavigate</code>. (If you go on to — or already have — the{' '}
        <strong>React Router v6/v7</strong> section, its own Complete App Routing
        lesson builds this same shape of app with the modern data router, so you
        can compare the two directly.)
      </p>

      <FlowChart
        title="Application Route Tree (v5)"
        chart={"graph TD\nR[\"App — BrowserRouter + Switch\"] --> H[\"/ (exact) — Home\"]\nR --> A[\"/about\"]\nR --> P[\"/pricing\"]\nR --> AUTH[\"/login & /register\"]\nR --> PR[\"PrivateRoute path=/dashboard\"]\nPR --> DO[\"match.path (exact) — Overview\"]\nPR --> DP[\"match.path/profile\"]\nPR --> DS[\"match.path/settings\"]\nPR --> DU[\"match.path/users/:id\"]\nR --> NF[\"path=* — 404, MUST be last child\"]\nstyle R fill:#1a2744\nstyle PR fill:#2a1f44\nstyle NF fill:#3b1a1a"}
      />

      <h2>Step 1: The Root Switch</h2>
      <p>
        There is no config object in v5 — the route tree <em>is</em> JSX. The
        whole app is one <code>&lt;Switch&gt;</code>, which walks its children{' '}
        <strong>top to bottom</strong> and renders only the first one that
        matches. That ordering rule drives everything else on this page.
      </p>

      <CodeBlock language="jsx" title="App.js — the root Switch">
{`import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import RootLayout from './layouts/RootLayout';

import Home from './pages/Home';
import About from './pages/About';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <RootLayout>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />

            {/* Everything under /dashboard is gated — Dashboard owns its
                own nested Switch, so this route is deliberately non-exact */}
            <PrivateRoute path="/dashboard" component={Dashboard} />

            {/* Catch-all — MUST be the last child. See the note below. */}
            <Route path="*" component={NotFound} />
          </Switch>
        </RootLayout>
      </Router>
    </AuthProvider>
  );
}`}
      </CodeBlock>

      <p>
        Notice there is no <code>&lt;Outlet /&gt;</code> anywhere. In v5, a
        layout that wraps routes just receives them as <code>children</code> and
        renders them wherever it likes — the &ldquo;shared shell around a Switch&rdquo;
        pattern below is the closest v5 equivalent to a v6 root layout.
      </p>

      <CodeBlock language="jsx" title="layouts/RootLayout.js">
{`import React from 'react';
import { NavLink } from 'react-router-dom';

export default function RootLayout({ children }) {
  return (
    <div className="app">
      <header>
        <nav>
          <NavLink exact to="/" activeClassName="active">Home</NavLink>
          <NavLink to="/about" activeClassName="active">About</NavLink>
          <NavLink to="/pricing" activeClassName="active">Pricing</NavLink>
          <NavLink to="/dashboard" activeClassName="active">Dashboard</NavLink>
        </nav>
      </header>

      <main>{children}</main>

      <footer>© 2024 My App</footer>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="activeClassName Is a v5-Only Prop">
        <code>&lt;NavLink&gt;</code> in v5 takes <code>activeClassName</code> and{' '}
        <code>activeStyle</code> props to style the active link directly. Both were
        removed in v6 in favor of the <code>className</code>/<code>style</code>{' '}
        callback form (<code>{"className={({ isActive }) => ...}"}</code>). If
        you&apos;re reading this in a legacy file, that&apos;s the tell.
      </InfoBox>

      <h2>Step 2: Public Pages</h2>
      <p>
        Public pages are plain components — no loader, no route-level data
        fetching hook. Anything async happens the only way v5 knows how:{' '}
        <code>useEffect</code> (or <code>componentDidMount</code> in older
        class-based code).
      </p>

      <CodeBlock language="jsx" title="pages/Home.js, About.js, Pricing.js">
{`// pages/Home.js
export default function Home() {
  return (
    <div>
      <h1>Welcome</h1>
      <p>This is the public home page.</p>
    </div>
  );
}

// pages/About.js
export default function About() {
  return <h1>About Us</h1>;
}

// pages/Pricing.js — manual fetch, because there is no loader
import React, { useState, useEffect } from 'react';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setPlans(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p>Loading plans...</p>;

  return (
    <div>
      <h1>Pricing</h1>
      {plans.map((plan) => (
        <div key={plan.id}>{plan.name} — \${plan.price}/mo</div>
      ))}
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Every Fetch Is a useEffect">
        This is the single biggest architectural gap between v5 and v6.4+&apos;s
        data APIs. In v5, the component renders first — with nothing — then a{' '}
        <code>useEffect</code> kicks off the request, and the component
        re-renders when it resolves. Every data-bearing page needs its own{' '}
        <code>loading</code> state by hand. There is no way to start the fetch{' '}
        <em>before</em> the component mounts.
      </InfoBox>

      <h2>Step 3: Auth Pages</h2>
      <p>
        Programmatic navigation after login uses the <code>useHistory</code>{' '}
        hook, and the &ldquo;where were they trying to go?&rdquo; page is carried
        in <code>location.state</code> rather than a query string — that&apos;s the
        pattern <code>&lt;PrivateRoute&gt;</code> below sets up.
      </p>

      <CodeBlock language="jsx" title="pages/Login.js">
{`import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const history = useHistory();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  // PrivateRoute below redirects here with { from: <the page they wanted> }
  const { from } = location.state || { from: { pathname: '/dashboard' } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await login({
        email: formData.get('email'),
        password: formData.get('password'),
      });
      // replace, not push — the login page shouldn't be a back-button stop
      history.replace(from);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div>
      <h1>Log In</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" required placeholder="Email" />
        <input name="password" type="password" required placeholder="Password" />
        <button type="submit">Log In</button>
      </form>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Step 4: The PrivateRoute Guard</h2>
      <p>
        v5 has no route-level loader to gate a page before it renders, so the
        community pattern is a wrapper around <code>&lt;Route&gt;</code> itself,
        using the <code>render</code> prop to decide what to render{' '}
        <em>after</em> matching: the real component, or a{' '}
        <code>&lt;Redirect&gt;</code>.
      </p>

      <CodeBlock language="jsx" title="components/PrivateRoute.js">
{`import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Same shape as any other <Route>, plus a guard.
// component/exact/path etc. are all passed straight through via {...rest}.
export default function PrivateRoute({ component: Component, ...rest }) {
  const { user } = useAuth();

  return (
    <Route
      {...rest}
      render={(routeProps) =>
        user ? (
          <Component {...routeProps} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: routeProps.location },
            }}
          />
        )
      }
    />
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="PrivateRoute Is a Pattern, Not an API">
        Unlike <code>&lt;Switch&gt;</code> or <code>useHistory</code>,{' '}
        <code>&lt;PrivateRoute&gt;</code> ships in <strong>no</strong> React
        Router package — v5, v6, and v7 alike. It&apos;s a wrapper every team
        wrote by hand, which is exactly why it looks slightly different in every
        v5 codebase you&apos;ll open. The shape above — spread{' '}
        <code>{'{...rest}'}</code> onto <code>&lt;Route&gt;</code>, branch inside{' '}
        <code>render</code> — is the version that shows up most often.
      </InfoBox>

      <InfoBox variant="danger" title="This Guard Is UX, Not Security — Same Rule as Always">
        Exactly as in the v6/v7 section&apos;s Auth Guards lesson: this runs in
        the browser, so it stops nobody who opens devtools and edits{' '}
        <code>user</code> in memory. It exists so honest users don&apos;t land
        on a broken dashboard. The actual enforcement has to happen on every{' '}
        <code>/api/*</code> endpoint, independent of anything the client sends.
      </InfoBox>

      <h2>Step 5: Dashboard Layout — Nested Routes via match.path</h2>
      <p>
        v5 has no <code>&lt;Outlet /&gt;</code>, so nesting is manual: the parent
        route&apos;s component receives a <code>match</code> prop (because it was
        rendered by a <code>&lt;Route&gt;</code>), and renders its{' '}
        <em>own</em> <code>&lt;Switch&gt;</code> with paths built by
        string-concatenating onto <code>match.path</code>.
      </p>

      <CodeBlock language="jsx" title="pages/Dashboard.js">
{`import React from 'react';
import { Switch, Route, NavLink } from 'react-router-dom';
import Overview from './dashboard/Overview';
import Profile from './dashboard/Profile';
import Settings from './dashboard/Settings';
import UserDetail from './dashboard/UserDetail';

// "match" here comes from the <PrivateRoute path="/dashboard" component={Dashboard} />
// in App.js — react-router-dom injects match/location/history as props
// on any component rendered by a Route.
export default function Dashboard({ match }) {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <NavLink exact to={match.path} activeClassName="active">Overview</NavLink>
        <NavLink to={\`\${match.path}/profile\`} activeClassName="active">Profile</NavLink>
        <NavLink to={\`\${match.path}/settings\`} activeClassName="active">Settings</NavLink>
      </aside>

      <section className="dashboard-content">
        <Switch>
          <Route exact path={match.path} component={Overview} />
          <Route path={\`\${match.path}/profile\`} component={Profile} />
          <Route path={\`\${match.path}/settings\`} component={Settings} />
          <Route path={\`\${match.path}/users/:id\`} component={UserDetail} />
        </Switch>
      </section>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="match.path vs match.url">
        <code>match.path</code> is the <em>route pattern</em> (still has{' '}
        <code>:id</code> in it) — use it to build child <strong>route paths</strong>.{' '}
        <code>match.url</code> is the <em>actual matched URL</em> (params already
        filled in) — use it to build <strong>links</strong>. Swapping the two is a
        common typo: linking with <code>match.path</code> sends the user to a
        literal <code>/dashboard/users/:id</code> URL.
      </InfoBox>

      <h2>Step 6: Dashboard Sub-Pages</h2>
      <CodeBlock language="jsx" title="pages/dashboard/*.js">
{`// pages/dashboard/Overview.js
import React, { useState, useEffect } from 'react';

export default function Overview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard/stats').then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <p>Loading...</p>;
  return <h2>Dashboard — {stats.totalUsers} users</h2>;
}

// pages/dashboard/Profile.js
import React from 'react';
import { useAuth } from '../../auth/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  return <h2>Profile: {user.name}</h2>;
}

// pages/dashboard/Settings.js
export default function Settings() {
  return <h2>Settings</h2>;
}

// pages/dashboard/UserDetail.js — reads the :id param via useParams
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(\`/api/users/\${id}\`)
      .then((r) => r.json())
      .then(setUser)
      .finally(() => setLoading(false));
  }, [id]); // re-run whenever the :id param actually changes

  if (loading) return <p>Loading...</p>;
  return <h2>{user.name} — {user.email}</h2>;
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The [id] Dependency Array Is Doing Real Work">
        <code>UserDetail</code> above is reused across every <code>/dashboard/users/:id</code>{' '}
        navigation — React Router doesn&apos;t remount the component just because
        the param changed, it re-renders the same instance with new props. Without{' '}
        <code>[id]</code> in the dependency array, clicking from user 1 to user 2
        would leave user 1&apos;s data on screen under the new URL. The class
        component equivalent of this mistake is covered in the next lesson.
      </InfoBox>

      <h2>Step 7: The Catch-All — What path=&quot;*&quot; Actually Matches</h2>
      <p>
        v5&apos;s matcher is <a href="https://github.com/pillarjs/path-to-regexp/tree/v1.7.0" target="_blank" rel="noopener noreferrer">path-to-regexp@1.7.0</a>{' '}
        compiled per-route. Verified directly against that library, here&apos;s
        what a non-exact path actually matches — it is <em>not</em> naive string
        prefixing, but it also isn&apos;t as forgiving as it looks:
      </p>

      <CodeBlock language="jsx" title="Verified against path-to-regexp@1.7.0 (what react-router-dom@5.3.4 uses)">
{`// <Route path="/users"> (no exact) — prefix match, but SEGMENT-aware:
"/users"          -> matches         (exact same path)
"/users/42"       -> matches         (child segment)
"/users-legacy"   -> does NOT match  (no "/" boundary — this is not startsWith)
"/usersomething"  -> does NOT match

// <Route path="/"> (no exact) — matches literally every route,
// because every pathname starts with "/". This is THE classic missing-exact bug:
"/about"          -> matches
"/dashboard"      -> matches

// <Route path="*"> — matches everything, at any depth, no exceptions:
"/anything"                  -> matches
"/dashboard/nope/deep/path"  -> matches
"/"                           -> matches`}
      </CodeBlock>

      <FlowChart
        title="How Switch Picks a Route (sequential, not ranked)"
        chart={"graph TD\nA[\"URL: /wrong-page\"] --> B{\"exact path='/' ?\"}\nB -->|No match| C{\"path='/about' ?\"}\nC -->|No match| D{\"path='/pricing' ?\"}\nD -->|No match| E{\"...more Routes...\"}\nE -->|No match| F{\"path='*' ?\"}\nF -->|Always matches| G[Render NotFound]\nstyle A fill:#1a2744\nstyle F fill:#3d2f14\nstyle G fill:#3b1a1a"}
      />

      <InfoBox variant="danger" title="Why the Catch-All Must Be Last — and Only Last">
        <p>
          <code>&lt;Switch&gt;</code> has no ranking algorithm — v6&apos;s{' '}
          <code>&lt;Routes&gt;</code> can put a catch-all <em>anywhere</em> and
          still resolve the &ldquo;best&rdquo; match, because it scores every
          route and picks the winner. v5&apos;s <code>&lt;Switch&gt;</code> just
          walks its children top to bottom and stops at the first match.
        </p>
        <p style={{ marginBottom: 0 }}>
          Since <code>path=&quot;*&quot;</code> matches everything, putting it
          anywhere except last means it swallows every route declared after it —
          in the worst case, the entire app renders <code>&lt;NotFound /&gt;</code>{' '}
          for every URL, and it usually isn&apos;t obvious why until someone
          diffs the <code>&lt;Switch&gt;</code> order.
        </p>
      </InfoBox>

      <h2>Step 8: Entry Point</h2>
      <CodeBlock language="jsx" title="index.js">
{`import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`}
      </CodeBlock>

      <InfoBox variant="note" title="ReactDOM.render, Not createRoot">
        This is the classic entry point you&apos;ll find in most v5-era
        codebases — <code>ReactDOM.render</code>, not React 18&apos;s{' '}
        <code>createRoot</code>. React Router v5&apos;s final release,{' '}
        <code>react-router-dom@5.3.4</code>, declares a peer dependency of
        just <code>react &gt;=15</code>, with no upper bound — so seeing{' '}
        <code>createRoot</code> alongside <code>&lt;Switch&gt;</code> just
        means the app upgraded its React version without touching its
        router — a very common, and perfectly valid, halfway state.
      </InfoBox>

      <h2>Code Organization</h2>
      <CodeBlock language="jsx" title="Recommended Folder Structure">
{`/*
src/
├── index.js                    Entry point — ReactDOM.render
├── App.js                      BrowserRouter + root Switch
├── layouts/
│   └── RootLayout.js           Global shell (nav + footer, wraps children)
├── pages/
│   ├── Home.js
│   ├── About.js
│   ├── Pricing.js
│   ├── Login.js
│   ├── Register.js
│   ├── Dashboard.js            Owns its own nested Switch off match.path
│   ├── NotFound.js
│   └── dashboard/
│       ├── Overview.js
│       ├── Profile.js
│       ├── Settings.js
│       └── UserDetail.js
├── components/
│   └── PrivateRoute.js         Route wrapper — render prop + Redirect
└── auth/
    └── AuthContext.js          Same Context + useAuth pattern as v6/v7
*/`}
      </CodeBlock>

      <InfoBox variant="success" title="Full App Complete">
        You now have a full v5 routing architecture: public pages, an auth flow
        built on <code>useHistory</code> and <code>location.state</code>, a{' '}
        <code>&lt;PrivateRoute&gt;</code>-gated dashboard with nested{' '}
        <code>match.path</code> routing, and a catch-all placed where{' '}
        <code>&lt;Switch&gt;</code>&apos;s sequential matching actually requires
        it. The next lesson turns this around: you&apos;ve learned modern React
        Router, and you&apos;ve just been handed a codebase built like this one.
      </InfoBox>
    </LessonLayout>
  );
}
