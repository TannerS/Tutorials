import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Guards() {
  return (
    <LessonLayout
      title="Auth Guards & Protected Routes"
      sectionId="react-router-v8"
      lessonIndex={3}
      prev={{ path: '/react-router-v8/data', label: 'Data Loading & Actions' }}
      next={{ path: '/react-router-v8/advanced', label: 'Advanced Patterns' }}
    >
      <p>
        v7 gave you two ways to guard a route: check auth inside a{' '}
        <code>loader</code>, or wrap it in a component that redirects. Both
        still work in v8 and are covered below. But v8 also has a third,
        newer option that v7 only had in an unstable/opt-in form:{' '}
        <strong>middleware</strong>. Middleware stabilized in React Router{' '}
        <code>7.9.0</code> and became always-on by default in{' '}
        <code>8.0.0</code> — the feature flag that used to gate it is gone.
        For anything protecting more than a single route, middleware is now
        the pattern the official docs lead with, and it&apos;s the one this
        lesson recommends by default.
      </p>

      <FlowChart
        title="Auth Guard Decision Flow"
        chart={"graph TD\nA[User navigates to a protected route] --> B{Protecting a whole subtree, or need shared context?}\nB -->|Yes - recommended| C[Attach middleware to the parent route]\nC --> D[authMiddleware runs before any child loader]\nD --> E{Authenticated?}\nE -->|No| F[throw redirect to /login]\nE -->|Yes| G[context.set user - children read via context.get]\nG --> H{Authorized for this role?}\nH -->|No| I[throw 403 Response]\nH -->|Yes| J[next runs loaders, then render]\nB -->|No - single route, no data router| K[Loader calls requireAuth directly]\nK --> L{Authenticated?}\nL -->|No| F\nL -->|Yes| J\nB -->|No - plain JSX, no createBrowserRouter| M[ProtectedRoute wrapper + Outlet]\nM --> N{Auth context has user?}\nN -->|No| O[Navigate to /login]\nN -->|Yes| P[Render children via Outlet]\nstyle F fill:#3b1a1a\nstyle I fill:#3d2f14\nstyle J fill:#1a3329\nstyle P fill:#1a3329"}
      />

      <InfoBox variant="danger" title="Read This Before Anything Else on This Page">
        <p>
          Every technique on this page runs <strong>in the user&apos;s browser</strong>,
          which means it is <strong>user experience, not security</strong> —
          middleware included. A middleware is still just JavaScript you
          shipped to a machine you do not control (client-side middleware, at
          least; server middleware in a full-stack framework setup is a
          different story, but this site&apos;s examples use{' '}
          <code>createBrowserRouter</code>, which runs client-side). Anyone
          can open devtools, edit the auth state, and render your admin panel.
        </p>
        <p style={{ marginBottom: 0 }}>
          What it <em>does</em> protect is the honest majority: nobody lands on
          a broken dashboard, sees a flash of admin UI, or bookmarks a page
          they cannot use. The actual enforcement is on the server — every{' '}
          <code>/api/*</code> endpoint must independently verify the session
          and the role, and behave correctly even if the request was
          hand-crafted with <code>curl</code>. Get that wrong and a perfect
          client-side guard buys you nothing; get it right and a missing
          client-side guard is only ugly.
        </p>
      </InfoBox>

      <h2>Pattern 1: Middleware-Based Auth (v8-Recommended)</h2>
      <p>
        Middleware runs <em>before</em> the loaders on a route — and before
        the loaders of every route nested under it. Attach an auth check to a
        parent route once, and every child route is protected without
        repeating the check in each child&apos;s <code>loader</code>. That
        &ldquo;protect the whole subtree in one place&rdquo; property is the
        actual improvement over the v7 loader-only pattern, not just a syntax
        change.
      </p>

      <p>
        Step one is a typed context object — this is how middleware hands
        data down to the loaders that run after it:
      </p>

      <CodeBlock language="jsx" title="context.js — a typed slot for the current user">
{`import { createContext } from 'react-router';

// Middleware writes to this, loaders/actions read from it.
export const userContext = createContext(null);`}
      </CodeBlock>

      <CodeBlock language="jsx" title="middleware/auth.js">
{`import { redirect } from 'react-router';
import { userContext } from '../context';
import { getSession } from '../auth';

// If you don't need to run anything AFTER the route renders, you can skip
// calling next() entirely — React Router calls it for you.
export async function authMiddleware({ request, context }) {
  const session = await getSession(request);

  if (!session?.user) {
    const url = new URL(request.url);
    const returnTo = url.pathname + url.search;
    throw redirect(\`/login?returnTo=\${encodeURIComponent(returnTo)}\`);
  }

  context.set(userContext, session.user);
  // next() is called automatically here
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Attach middleware once, protect the whole subtree">
{`import { createBrowserRouter } from 'react-router';
import { authMiddleware } from './middleware/auth';
import { userContext } from './context';

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { path: 'login', Component: Login },
      {
        // authMiddleware runs once here — before dashboardLoader,
        // profileLoader, AND settingsLoader below, without repeating
        // a requireAuth() call in each one.
        middleware: [authMiddleware],
        Component: ProtectedLayout,
        children: [
          { path: 'dashboard', loader: dashboardLoader, Component: Dashboard },
          { path: 'profile', loader: profileLoader, Component: Profile },
          { path: 'settings', loader: settingsLoader, Component: Settings },
        ],
      },
    ],
  },
]);

// Any loader under the protected branch can read what the middleware set —
// no re-fetching the session, no re-checking auth.
async function dashboardLoader({ context }) {
  const user = context.get(userContext); // guaranteed to exist
  const data = await fetch('/api/dashboard', {
    headers: { Authorization: \`Bearer \${user.token}\` },
  });
  return data.json();
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Middleware Is Stable, Not Experimental, in v8">
        <p>
          To be precise about the claim: middleware and its context APIs
          (<code>RouterContextProvider</code>, <code>createContext</code>) had
          the <code>unstable_</code> prefix removed and were declared
          production-ready in <code>7.9.0</code> (September 2025). What v8
          changed is narrower — it removed the{' '}
          <code>future.v8_middleware</code> flag, so the behavior is on
          unconditionally with nothing left to enable.
        </p>
        <p style={{ marginBottom: 0 }}>
          One nuance worth knowing if you read the changelog yourself: that
          flag only ever gated <em>Framework mode</em> (the file-based{' '}
          <code>routes.ts</code> setup with generated types). In{' '}
          <strong>Data mode</strong> — <code>createBrowserRouter</code>, what
          every example on this site uses — <code>middleware</code> was
          always just a property you could add to a route object, with no
          flag required even back in v7. So if you&apos;re on Data mode like
          this lesson, the practical change in v8 is smaller than the
          changelog entry makes it sound: middleware itself isn&apos;t new to
          you, it&apos;s just no longer labeled unstable.
        </p>
      </InfoBox>

      <h2>Pattern 2: Loader-Only Auth Check (Still Valid)</h2>
      <p>
        For a single protected route with no children that need the same
        session data, a plain loader check is still completely fine — it&apos;s
        one less concept to reach for when middleware&apos;s subtree-sharing
        doesn&apos;t buy you anything.
      </p>

      <CodeBlock language="jsx" title="Auth Check in a Loader">
{`import { redirect } from 'react-router';
import { getSession } from '../auth';

async function requireAuth(request) {
  const session = await getSession(request);
  if (!session?.user) {
    const url = new URL(request.url);
    const returnTo = url.pathname + url.search;
    throw redirect(\`/login?returnTo=\${encodeURIComponent(returnTo)}\`);
  }
  return session;
}

export async function loader({ request }) {
  const session = await requireAuth(request);
  const data = await fetch('/api/dashboard', {
    headers: { Authorization: \`Bearer \${session.token}\` },
  });
  return data.json();
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="throw redirect() vs return redirect() — Not Interchangeable">
        <p>
          Notice <code>requireAuth</code> above uses{' '}
          <code>throw redirect(...)</code>, not <code>return</code>. Both
          forms exist and both are valid, but they are not substitutes:
        </p>
        <ul>
          <li>
            <code>return redirect(&apos;/login&apos;)</code> works only in the{' '}
            <strong>loader/action/middleware itself</strong>, as the last
            thing it does. Returning hands the value back to React Router,
            which acts on it.
          </li>
          <li>
            <code>throw redirect(&apos;/login&apos;)</code> works{' '}
            <strong>anywhere</strong>, including nested helpers like{' '}
            <code>requireAuth</code> above. Throwing unwinds the whole call
            stack straight to the router — which is exactly why the{' '}
            <code>authMiddleware</code> in Pattern 1 also throws rather than
            returns.
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          If <code>requireAuth</code> <em>returned</em> the redirect instead,
          it would return it to whatever called it — the loader would carry
          on, fetch <code>/api/dashboard</code> with no token, and probably
          crash on the 401. The redirect would be silently discarded as an
          unused return value.
        </p>
      </InfoBox>

      <h2>Pattern 3: ProtectedRoute Wrapper Component</h2>
      <p>
        For a plain-JSX router with no <code>createBrowserRouter</code> config
        at all, or as a bridge while migrating, a wrapper component still
        works — check auth context, redirect if needed, render{' '}
        <code>&lt;Outlet /&gt;</code> if not. Of the three patterns on this
        page, this is the one to reach for last: it runs at render time rather
        than before it, so a component briefly mounts (firing effects,
        subscriptions) before a redirect can happen.
      </p>

      <CodeBlock language="jsx" title="ProtectedRoute Component">
{`import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="loading-screen">Verifying session...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ returnTo: location.pathname + location.search }}
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// Usage in route config
const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { path: 'login', Component: Login },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', Component: Dashboard },
          { path: 'profile', Component: Profile },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [{ path: 'admin', Component: AdminPanel }],
      },
    ],
  },
]);`}
      </CodeBlock>

      <h2>Auth Context Provider</h2>
      <p>
        All three patterns above eventually need somewhere to read{' '}
        <code>user</code> from on the client (Pattern 3 directly via{' '}
        <code>useAuth()</code>; Patterns 1 and 2 for the rest of the app
        outside the router&apos;s own <code>context</code>). This part is
        unrelated to which router version or auth pattern you pick — it&apos;s
        ordinary React:
      </p>

      <CodeBlock language="jsx" title="Full AuthProvider Implementation">
{`import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(userData => setUser(userData))
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
    <AuthContext value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};`}
      </CodeBlock>

      <InfoBox variant="note" title="Two Different context Systems — Don't Mix Them Up">
        The <code>AuthProvider</code> above uses React&apos;s own{' '}
        <code>createContext</code> from <code>&apos;react&apos;</code>. The{' '}
        <code>userContext</code> in Pattern 1 uses React Router&apos;s{' '}
        <code>createContext</code> from <code>&apos;react-router&apos;</code>{' '}
        — a different function, for a different job (passing data down a
        middleware/loader chain on a single navigation, not providing state to
        a component tree over time). They share a name and a shape but are not
        interchangeable. Router context also doesn&apos;t persist across
        navigations the way React context does; it&apos;s scoped to one
        request.
      </InfoBox>

      <h2>Login Page with Return-To Redirect</h2>
      <CodeBlock language="jsx" title="Login with returnTo Pattern">
{`import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // returnTo comes from either query param (middleware/loader redirect)
  // or location state (Navigate component)
  const returnTo =
    searchParams.get('returnTo') ||
    location.state?.returnTo ||
    '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await login({
        email: formData.get('email'),
        password: formData.get('password'),
      });
      navigate(returnTo, { replace: true });
    } catch (err) {
      // show error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign In</h1>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Log In</button>
    </form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="returnTo Security">
        Always validate <code>returnTo</code> URLs before redirecting. Ensure
        the path is relative (starts with <code>/</code>) and doesn&apos;t
        point to an external domain — otherwise a crafted login link can send
        an authenticated user straight to an attacker&apos;s site.
      </InfoBox>

      <h2>Role-Based Access Control via Middleware</h2>
      <p>
        A role check composes naturally as a second middleware layered after{' '}
        <code>authMiddleware</code> — it can assume a user already exists in{' '}
        <code>context</code> because <code>authMiddleware</code> ran first and
        would have already redirected otherwise:
      </p>

      <CodeBlock language="jsx" title="middleware/requireRole.js — a middleware factory">
{`import { userContext } from '../context';

// Returns a middleware, so each route can ask for different roles.
export function requireRole(...roles) {
  return async function roleMiddleware({ context }) {
    const user = context.get(userContext); // set by authMiddleware, upstream
    if (!roles.includes(user.role)) {
      throw new Response('Forbidden', { status: 403 });
    }
  };
}

// Route config
const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        middleware: [authMiddleware], // sets context.userContext
        Component: ProtectedLayout,
        children: [
          {
            path: 'admin',
            // authMiddleware already ran on the parent; this just adds
            // the role check on top of it for this specific subtree
            middleware: [requireRole('admin', 'superadmin')],
            loader: adminLoader,
            Component: AdminPanel,
          },
          { path: 'dashboard', loader: dashboardLoader, Component: Dashboard },
        ],
      },
    ],
  },
]);`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Loader-Only Equivalent Still Works Too">
        If you&apos;re using Pattern 2 instead of middleware, the same idea
        applies as a plain function: <code>requireRole(session, ...roles)</code>{' '}
        that throws <code>new Response('Forbidden', {'{ status: 403 }'})</code>{' '}
        when the check fails, called at the top of each protected loader. The
        only thing middleware buys you here is not having to call it in every
        single loader under the protected subtree.
      </InfoBox>

      <h2>403 / Unauthorized Error Page</h2>
      <CodeBlock language="jsx" title="Handling 401 and 403 Errors">
{`import { useRouteError, isRouteErrorResponse, Link } from 'react-router';

function AuthError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 401) {
      return (
        <div className="error-page">
          <h1>Session Expired</h1>
          <p>Your session has expired. Please log in again.</p>
          <Link to="/login">Go to Login</Link>
        </div>
      );
    }
    if (error.status === 403) {
      return (
        <div className="error-page">
          <h1>Access Denied</h1>
          <p>You don&apos;t have permission to view this page.</p>
          <Link to="/dashboard">Back to Dashboard</Link>
        </div>
      );
    }
  }

  return (
    <div className="error-page">
      <h1>Error</h1>
      <p>{error?.message || 'Something went wrong'}</p>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Token Storage">
        Store tokens in HTTP-only cookies (set by the server) rather than
        localStorage. This prevents XSS attacks from stealing tokens. If you
        must use localStorage, never put tokens in URL query params.
      </InfoBox>

      <h2>Complete Auth Flow Example</h2>
      <CodeBlock language="jsx" title="Full App with Middleware-Based Guards">
{`import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AuthProvider } from './auth/AuthProvider';
import { authMiddleware } from './middleware/auth';
import { requireRole } from './middleware/requireRole';
import RootLayout from './layouts/RootLayout';
import ProtectedLayout from './layouts/ProtectedLayout';
import Login, { action as loginAction } from './routes/Login';
import Dashboard, { loader as dashLoader } from './routes/Dashboard';
import AdminPanel, { loader as adminLoader } from './routes/AdminPanel';
import Profile, { loader as profileLoader } from './routes/Profile';
import AuthError from './components/AuthError';

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    errorElement: <AuthError />,
    children: [
      { index: true, Component: Home },
      { path: 'login', Component: Login, action: loginAction },
      {
        // One middleware, protects everything nested below it
        middleware: [authMiddleware],
        Component: ProtectedLayout,
        errorElement: <AuthError />,
        children: [
          { path: 'dashboard', Component: Dashboard, loader: dashLoader },
          { path: 'profile', Component: Profile, loader: profileLoader },
          {
            path: 'admin',
            // Layered role check — authMiddleware already ran above
            middleware: [requireRole('admin')],
            Component: AdminPanel,
            loader: adminLoader,
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}`}
      </CodeBlock>

      <FlowChart
        title="Complete Auth Flow with Middleware"
        chart={"graph TD\nA[User visits /dashboard] --> B[authMiddleware runs - parent route]\nB --> C{Valid session?}\nC -->|No| D[throw redirect to /login?returnTo=/dashboard]\nD --> E[Login page renders]\nE --> F[User submits credentials]\nF --> G[Login action validates]\nG --> H{Success?}\nH -->|No| I[Return errors to form]\nH -->|Yes| J[Set session cookie]\nJ --> K[redirect to returnTo path]\nK --> L[authMiddleware runs again]\nL --> M[Session valid - context.set user]\nM --> N[dashboardLoader reads context.get user]\nN --> O[Dashboard renders with data]\nstyle D fill:#3b1a1a\nstyle I fill:#3d2f14\nstyle O fill:#1a3329"}
      />
    </LessonLayout>
  );
}
