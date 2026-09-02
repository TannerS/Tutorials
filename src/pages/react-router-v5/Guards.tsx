import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Guards() {
  return (
    <LessonLayout
      title="Auth Guards & Protected Routes"
      sectionId="react-router-v5"
      lessonIndex={3}
      prev={{ path: '/react-router-v5/data', label: 'Data Fetching Patterns' }}
      next={{ path: '/react-router-v5/advanced', label: 'Advanced Patterns' }}
    >
      <p>
        v5 has no <code>loader</code> to redirect from before a component
        renders — that mechanism doesn&apos;t exist yet. Every real v5 codebase
        solves route protection the same way: a custom{' '}
        <code>&lt;PrivateRoute&gt;</code> component that wraps{' '}
        <code>&lt;Route&gt;</code>, using its <code>render</code> prop to
        decide, at render time, whether to show the protected component or a{' '}
        <code>&lt;Redirect&gt;</code>. It&apos;s a pure-JSX pattern, not a
        router config option — and once you&apos;ve seen it, you&apos;ll
        recognize it in almost every v5 app you open.
      </p>

      <FlowChart
        title="PrivateRoute Decision Flow"
        chart={"graph TD\nA[User navigates to protected path] --> B[Route matches, render prop runs]\nB --> C{isAuthenticated?}\nC -->|No| D[Redirect to /login, state.from = current location]\nC -->|Yes| E{allowedRoles specified?}\nE -->|No| F[Render the protected component]\nE -->|Yes| G{user.role in allowedRoles?}\nG -->|No| H[Redirect to /unauthorized]\nG -->|Yes| F\nstyle D fill:#3b1a1a\nstyle H fill:#3d2f14\nstyle F fill:#1a3329"}
      />

      <InfoBox variant="danger" title="Read This Before Anything Else on This Page">
        <p>
          Everything below runs <strong>in the user&apos;s browser</strong>.
          That makes it <strong>user experience, not security</strong>. Anyone
          can open devtools, flip a boolean in memory, and render whatever your{' '}
          <code>PrivateRoute</code> was hiding — no client-side pattern, in any
          version of React Router, changes that.
        </p>
        <p style={{ marginBottom: 0 }}>
          What it <em>does</em> buy you is the honest majority: nobody lands on
          a broken dashboard with no data, sees a flash of admin UI they
          shouldn&apos;t, or bookmarks a page they can&apos;t actually use. The
          real enforcement lives on the server — every <code>/api/*</code>{' '}
          endpoint has to independently verify the session and the role, and
          behave correctly even against a hand-crafted <code>curl</code>{' '}
          request. Get that wrong and the prettiest route guard buys you
          nothing.
        </p>
      </InfoBox>

      <h2>The &lt;PrivateRoute&gt; Pattern</h2>
      <p>
        A <code>&lt;Route&gt;</code> in v5 can render its content three ways:{' '}
        <code>component</code>, <code>render</code>, or <code>children</code>.
        For a guard you need to make a decision — redirect, or render — so you
        need the <code>render</code> prop, which takes a function and lets you
        return whatever JSX you want:
      </p>

      <CodeBlock language="jsx" title="components/PrivateRoute.jsx">
{`import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function PrivateRoute({ component: Component, ...rest }) {
  const { user, isLoading } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (isLoading) {
          return <div className="loading-screen">Verifying session...</div>;
        }

        if (!user) {
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location },
              }}
            />
          );
        }

        return <Component {...props} />;
      }}
    />
  );
}

export default PrivateRoute;`}
      </CodeBlock>

      <p>
        Usage looks almost identical to a plain <code>&lt;Route&gt;</code> —
        that&apos;s the point, it&apos;s a drop-in wrapper:
      </p>

      <CodeBlock language="jsx" title="Wiring PrivateRoute into a Switch">
{`import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './routes/Login';
import Dashboard from './routes/Dashboard';
import NotFound from './routes/NotFound';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/login" component={Login} />
        <PrivateRoute exact path="/dashboard" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="component vs render — Passing an Inline Function to component Is a Real Bug">
        <p>
          The official v5 docs call this out directly: pass an inline arrow
          function to the <code>component</code> prop — e.g.{' '}
          <code>{'<Route component={() => <Dashboard />} />'}</code> — and
          React Router creates a <em>brand-new component type on every single
          render</em>. React sees a new type and treats it as a completely
          different component: it unmounts the old instance and mounts a fresh
          one, every time the parent re-renders. State resets, effects refire,
          inputs lose focus.
        </p>
        <p style={{ marginBottom: 0 }}>
          That is exactly why <code>PrivateRoute</code> above uses{' '}
          <code>render={'{(props) => ...}'}</code> instead of building a new{' '}
          <code>component</code> value on the fly. <code>render</code> is
          designed for this — the function is called to produce elements
          without ever being treated as the component&apos;s identity, so
          nothing remounts.
        </p>
      </InfoBox>

      <h2>Redirecting Back After Login</h2>
      <p>
        The <code>PrivateRoute</code> above stashes the attempted location on{' '}
        <code>state.from</code> when it redirects to <code>/login</code>. The
        login page reads it back out with <code>useLocation()</code>, and
        after a successful login sends the user to wherever they were
        originally headed instead of always dumping them on{' '}
        <code>/dashboard</code>:
      </p>

      <CodeBlock language="jsx" title="routes/Login.jsx">
{`import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const history = useHistory();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  // Fall back to /dashboard if the user landed here directly
  // (typed the URL, clicked a bookmark) rather than being redirected.
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await login({
        email: formData.get('email'),
        password: formData.get('password'),
      });
      // replace, not push — the /login entry shouldn't sit in
      // browser history for the back button to land on.
      history.replace(from);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign In</h1>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      {error && <p className="error">{error}</p>}
      <button type="submit">Log In</button>
    </form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="history.replace vs history.push">
        Use <code>replace</code> after login, not <code>push</code>. With{' '}
        <code>push</code>, the login page stays in browser history — clicking
        the back button from the dashboard would send an already-authenticated
        user right back to the login form. <code>replace</code> swaps the
        current history entry instead of adding a new one, so the back button
        skips over it.
      </InfoBox>

      <h2>Role-Based Access Control</h2>
      <p>
        The same <code>render</code>-prop trick extends naturally to roles —
        add an <code>allowedRoles</code> prop and check it after confirming
        the user is logged in at all:
      </p>

      <CodeBlock language="jsx" title="components/RoleRoute.jsx">
{`import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function RoleRoute({ component: Component, allowedRoles, ...rest }) {
  const { user, isLoading } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (isLoading) {
          return <div className="loading-screen">Verifying session...</div>;
        }

        if (!user) {
          return (
            <Redirect
              to={{ pathname: '/login', state: { from: props.location } }}
            />
          );
        }

        if (!allowedRoles.includes(user.role)) {
          return <Redirect to="/unauthorized" />;
        }

        return <Component {...props} />;
      }}
    />
  );
}

export default RoleRoute;

// Usage — admin-only and manager-or-admin routes
<Switch>
  <RoleRoute
    exact
    path="/admin"
    component={AdminPanel}
    allowedRoles={['admin', 'superadmin']}
  />
  <RoleRoute
    exact
    path="/reports"
    component={Reports}
    allowedRoles={['admin', 'manager']}
  />
</Switch>`}
      </CodeBlock>

      <InfoBox variant="info" title="One Component, Optional Prop — Also Valid">
        Rather than two separate components, many codebases fold this into a
        single <code>PrivateRoute</code> that accepts an optional{' '}
        <code>allowedRoles</code> array and only checks it when it&apos;s
        provided — that&apos;s a matter of taste, not correctness. Splitting
        them (as above) keeps each component&apos;s job obvious at a glance;
        merging them avoids having two names for one idea. Either is fine as
        long as the team is consistent.
      </InfoBox>

      <h2>Auth Context Provider</h2>
      <p>
        Both guards above call <code>useAuth()</code>. Here&apos;s a complete,
        minimal provider backing it — session check on mount, plus login and
        logout that update it:
      </p>

      <CodeBlock language="jsx" title="auth/AuthProvider.jsx">
{`import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for an existing session on first load
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((userData) => setUser(userData))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const userData = await res.json();
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Token Storage">
        Store session tokens in HTTP-only cookies set by the server (as the{' '}
        <code>credentials: 'include'</code> calls above assume), not{' '}
        <code>localStorage</code>. An HTTP-only cookie can&apos;t be read by
        JavaScript at all, which closes off the most common way a token gets
        stolen via XSS. If you must use <code>localStorage</code>, never put a
        token in a URL query string — it ends up in server logs and browser
        history.
      </InfoBox>

      <h2>Complete Example: Full App With Guards</h2>
      <CodeBlock language="jsx" title="App.jsx — everything wired together">
{`import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import Home from './routes/Home';
import Login from './routes/Login';
import Dashboard from './routes/Dashboard';
import Profile from './routes/Profile';
import AdminPanel from './routes/AdminPanel';
import Unauthorized from './routes/Unauthorized';
import NotFound from './routes/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/login" component={Login} />
          <Route exact path="/unauthorized" component={Unauthorized} />

          <PrivateRoute exact path="/dashboard" component={Dashboard} />
          <PrivateRoute exact path="/profile" component={Profile} />

          <RoleRoute
            exact
            path="/admin"
            component={AdminPanel}
            allowedRoles={['admin']}
          />

          {/* No path — always matches, must stay last in the Switch */}
          <Route component={NotFound} />
        </Switch>
      </Router>
    </AuthProvider>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Why the Catch-All Has to Be Last Here">
        Unlike v6/v7&apos;s ranking algorithm, v5&apos;s <code>&lt;Switch&gt;</code>{' '}
        renders the <em>first</em> child that matches, top to bottom, and stops.
        A pathless <code>&lt;Route component={'{NotFound}'} /&gt;</code> matches{' '}
        <strong>every</strong> URL, so if it were placed first, it would shadow
        every route below it. Order is load-bearing in v5 in a way it simply
        isn&apos;t in v6.4+ — this is one of the biggest adjustments when moving
        between the two.
      </InfoBox>

      <FlowChart
        title="Complete Auth Flow with Redirect-Back"
        chart={"graph TD\nA[User visits /dashboard, not logged in] --> B[PrivateRoute renders Redirect]\nB --> C[/login, state.from = /dashboard]\nC --> D[Login page renders, reads location.state.from]\nD --> E[User submits credentials]\nE --> F{login succeeds?}\nF -->|No| G[Show error, stay on /login]\nF -->|Yes| H[AuthProvider sets user]\nH --> I[history.replace(from)]\nI --> J[PrivateRoute re-evaluates - user now set]\nJ --> K[Dashboard renders]\nstyle B fill:#3b1a1a\nstyle G fill:#3d2f14\nstyle K fill:#1a3329"}
      />
    </LessonLayout>
  );
}
