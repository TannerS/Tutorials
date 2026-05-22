import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Guards() {
  return (
    <LessonLayout
      title="Auth Guards & Protected Routes"
      sectionId="react-router"
      lessonIndex={3}
      prev={{ path: '/react-router/data', label: 'Data Loading & Actions' }}
      next={{ path: '/react-router/advanced', label: 'Advanced Patterns' }}
    >
      <p>
        Most apps have pages that only authenticated (or authorized) users should
        access. React Router v7 gives you two clean patterns for route protection:
        a <strong>wrapper component</strong> pattern for the JSX approach and a{' '}
        <strong>loader redirect</strong> pattern for the config-based approach. The
        loader redirect is preferred in v7 because it prevents the protected
        component from even beginning to render.
      </p>

      <FlowChart
        title="Auth Guard Decision Flow"
        chart={"graph TD\nA[User navigates to protected route] --> B{Using config-based router?}\nB -->|Yes| C[Loader checks auth]\nC --> D{Authenticated?}\nD -->|No| E[redirect to /login with returnTo]\nD -->|Yes| F{Authorized for this role?}\nF -->|No| G[throw 403 Response]\nF -->|Yes| H[Return data and render]\nB -->|No| I[ProtectedRoute wrapper]\nI --> J{Auth context has user?}\nJ -->|No| K[Navigate to /login]\nJ -->|Yes| L[Render children via Outlet]\nstyle E fill:#ef4444,color:#fff\nstyle G fill:#f59e0b,color:#fff\nstyle H fill:#10b981,color:#fff\nstyle L fill:#10b981,color:#fff"}
      />

      <h2>Pattern 1: Redirect in Loaders (Recommended)</h2>
      <p>
        In the config-based router, check authentication inside the route&apos;s{' '}
        <code>loader</code>. If the user isn&apos;t authenticated, return a{' '}
        <code>redirect()</code>. The protected component never renders — not even
        for a flash.
      </p>

      <CodeBlock language="jsx" title="Auth Check in Loader">
{`import { redirect } from 'react-router-dom';
import { getSession } from '../auth';

// Reusable auth guard for any loader
async function requireAuth(request) {
  const session = await getSession();
  if (!session?.user) {
    // Preserve the URL they tried to visit
    const url = new URL(request.url);
    const returnTo = url.pathname + url.search;
    throw redirect(\`/login?returnTo=\${encodeURIComponent(returnTo)}\`);
  }
  return session;
}

// Dashboard loader — protected
export async function loader({ request }) {
  const session = await requireAuth(request);
  const data = await fetch('/api/dashboard', {
    headers: { Authorization: \`Bearer \${session.token}\` },
  });
  return data.json();
}

// Route config
{
  path: 'dashboard',
  element: <Dashboard />,
  loader: dashboardLoader,   // auth checked here
  errorElement: <RouteError />,
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why Loaders Are Better Than Component Guards">
        Loader redirects run <em>before</em> any component mounts. With a
        component-based guard, React briefly renders the protected component
        (triggering effects, subscriptions) before redirecting. Loaders avoid
        this entirely.
      </InfoBox>

      <h2>Pattern 2: ProtectedRoute Wrapper Component</h2>
      <p>
        For the JSX-based approach (or when you can&apos;t use loaders), wrap
        protected routes with a component that checks auth context and redirects
        if needed.
      </p>

      <CodeBlock language="jsx" title="ProtectedRoute Component">
{`import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="loading-screen">Verifying session...</div>;
  }

  if (!user) {
    // Redirect to login, preserve where they came from
    return (
      <Navigate
        to="/login"
        state={{ returnTo: location.pathname + location.search }}
        replace
      />
    );
  }

  // Role check (if allowedRoles specified)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// Usage in route config
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: 'login', element: <Login /> },
      {
        // All children require authentication
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'profile', element: <Profile /> },
        ],
      },
      {
        // Admin-only routes
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          { path: 'admin', element: <AdminPanel /> },
          { path: 'admin/users', element: <UserManagement /> },
        ],
      },
    ],
  },
]);`}
      </CodeBlock>

      <h2>Auth Context Provider</h2>
      <CodeBlock language="jsx" title="Full AuthProvider Implementation">
{`import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
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
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};`}
      </CodeBlock>

      <h2>Login Page with Return-To Redirect</h2>
      <CodeBlock language="jsx" title="Login with returnTo Pattern">
{`import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // returnTo comes from either query param (loader redirect)
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
        Always validate <code>returnTo</code> URLs before redirecting. Ensure the
        path is relative (starts with <code>/</code>) and doesn&apos;t point to an
        external domain. This prevents open redirect vulnerabilities.
      </InfoBox>

      <h2>Role-Based Access Control</h2>
      <CodeBlock language="jsx" title="RBAC in Loaders">
{`// Require specific roles in a loader
async function requireRole(request, ...roles) {
  const session = await requireAuth(request);

  if (!roles.includes(session.user.role)) {
    throw new Response('Forbidden', { status: 403 });
  }
  return session;
}

// Admin-only route loader
export async function adminLoader({ request }) {
  const session = await requireRole(request, 'admin', 'superadmin');
  return fetch('/api/admin/stats', {
    headers: { Authorization: \`Bearer \${session.token}\` },
  });
}

// Manager or admin
export async function reportsLoader({ request }) {
  const session = await requireRole(request, 'admin', 'manager');
  return fetch('/api/reports');
}`}
      </CodeBlock>

      <h2>403 / Unauthorized Error Page</h2>
      <CodeBlock language="jsx" title="Handling 401 and 403 Errors">
{`import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

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

      <h2>Session Timeout Handling</h2>
      <CodeBlock language="jsx" title="Auto-Redirect on Token Expiry">
{`// Utility: authenticated fetch that handles expired sessions
export async function authFetch(url, options = {}) {
  const session = await getSession();
  if (!session) {
    throw redirect('/login?reason=expired');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: \`Bearer \${session.token}\`,
    },
  });

  // Server says token is invalid/expired
  if (res.status === 401) {
    await clearSession();
    throw redirect('/login?reason=expired');
  }

  return res;
}

// Use in any loader/action
export async function loader({ request }) {
  const res = await authFetch('/api/dashboard');
  if (!res.ok) throw new Response('Failed', { status: res.status });
  return res.json();
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Token Storage">
        Store tokens in HTTP-only cookies (set by the server) rather than
        localStorage. This prevents XSS attacks from stealing tokens. If you must
        use localStorage, never put tokens in URL query params.
      </InfoBox>

      <h2>Complete Auth Flow Example</h2>
      <CodeBlock language="jsx" title="Full App with Auth Guards">
{`import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import RootLayout from './layouts/RootLayout';
import Login, { action as loginAction } from './routes/Login';
import Dashboard, { loader as dashLoader } from './routes/Dashboard';
import AdminPanel, { loader as adminLoader } from './routes/AdminPanel';
import Profile, { loader as profileLoader } from './routes/Profile';
import AuthError from './components/AuthError';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <AuthError />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'login',
        element: <Login />,
        action: loginAction,
      },
      {
        // Protected — loader checks auth
        path: 'dashboard',
        element: <Dashboard />,
        loader: dashLoader,
        errorElement: <AuthError />,
      },
      {
        path: 'profile',
        element: <Profile />,
        loader: profileLoader,
        errorElement: <AuthError />,
      },
      {
        // Admin-only — loader checks role
        path: 'admin',
        element: <AdminPanel />,
        loader: adminLoader,
        errorElement: <AuthError />,
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

      <InteractiveChallenge
        question={"Where is the best place to check authentication in a React Router v7 config-based app?"}
        options={[
          "Inside the component's useEffect",
          "In a ProtectedRoute wrapper that checks context",
          "In the route's loader function",
          "In a global middleware before RouterProvider",
        ]}
        correctIndex={2}
        explanation={"In React Router v7's config-based API, the loader function is the ideal place to check auth. It runs before the component renders, prevents flash of protected content, and can return a redirect() before any client-side code executes. It also works with SSR."}
        language="jsx"
      />

      <FlowChart
        title="Complete Auth Flow"
        chart={"graph TD\nA[User visits /dashboard] --> B[Router runs dashboard loader]\nB --> C{Valid session?}\nC -->|No| D[redirect to /login?returnTo=/dashboard]\nD --> E[Login page renders]\nE --> F[User submits credentials]\nF --> G[Login action validates]\nG --> H{Success?}\nH -->|No| I[Return errors to form]\nH -->|Yes| J[Set session cookie]\nJ --> K[redirect to returnTo path]\nK --> L[Dashboard loader runs again]\nL --> M[Session valid - return data]\nM --> N[Dashboard renders with data]\nstyle D fill:#ef4444,color:#fff\nstyle I fill:#f59e0b,color:#fff\nstyle N fill:#10b981,color:#fff"}
      />
    </LessonLayout>
  );
}
