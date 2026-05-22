import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RRGuards() {
  return (
    <LessonLayout
      title="Route Guards"
      sectionId="react-router"
      lessonIndex={3}
      prev={{ path: "/react-router/data", label: "Data Loading" }}
      next={{ path: "/react-router/advanced", label: "Advanced Patterns" }}
    >
      <p>
        Route guards restrict access to routes based on authentication status or user roles.
        React Router v6 supports two approaches: the <code>RequireAuth</code> component pattern
        (wraps protected routes in JSX) and loader-based redirects (enforces access before render
        in the data API). Loader redirects are preferred — they prevent any flash of protected content.
      </p>

      <FlowChart
        title="Auth Guard Decision Flow"
        chart={"graph TD\n  A[User navigates to /dashboard] --> B[Loader runs]\n  B --> C{Is user authenticated?}\n  C -->|No| D[redirect to /login]\n  C -->|Yes| E{Has required role?}\n  E -->|No| F[redirect to /unauthorized]\n  E -->|Yes| G[Render Dashboard]\n  D --> H[Login page]\n  H --> I[User logs in]\n  I --> J[redirect back to /dashboard]"}
      />

      <h2>RequireAuth Component Pattern</h2>
      <p>
        The simplest approach — wrap protected routes in a <code>RequireAuth</code> component that
        redirects unauthenticated users before rendering children.
      </p>

      <CodeBlock language="jsx" title="RequireAuth Component Pattern">
{`import { Navigate, useLocation } from 'react-router-dom';

// RequireAuth — wraps any protected route
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login, but save where they were trying to go
    // { replace: true } removes the protected route from history (no back button loop)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Usage in JSX routes
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />

  {/* All protected routes wrapped in RequireAuth */}
  <Route
    path="/dashboard"
    element={
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    }
  />
  <Route
    path="/settings"
    element={
      <RequireAuth>
        <Settings />
      </RequireAuth>
    }
  />
</Routes>

// Login — redirect back to the intended destination after login
function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (credentials) => {
    await authService.login(credentials);
    navigate(from, { replace: true }); // go where they were trying to go
  };
}`}
      </CodeBlock>

      <h2>Loader-Based Redirect (Preferred for Data API)</h2>
      <p>
        With <code>createBrowserRouter</code>, the loader can call <code>redirect()</code> before
        the component renders. This is cleaner — no component flash, no conditional returns in JSX.
      </p>

      <CodeBlock language="jsx" title="Redirect from Loader">
{`import { redirect, createBrowserRouter } from 'react-router-dom';

// Helper — checks auth and redirects if not authenticated
function requireAuth(redirectTo = '/login') {
  return async ({ request }) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      const url = new URL(request.url);
      // Preserve the current URL so login can redirect back
      const searchParams = new URLSearchParams();
      searchParams.set('from', url.pathname);
      return redirect(redirectTo + '?' + searchParams.toString());
    }
    return user; // returned data available via useLoaderData()
  };
}

// Role-based guard — requires specific permission
function requireRole(role) {
  return async ({ request }) => {
    const user = await getAuthenticatedUser();
    if (!user) return redirect('/login');
    if (!user.roles.includes(role)) return redirect('/unauthorized');
    return user;
  };
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    // Pathless layout — auth check for all children
    loader: requireAuth(),
    element: <AuthLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/profile', element: <Profile /> },
      {
        // Admin-only section — role check
        path: '/admin',
        loader: requireRole('admin'),
        element: <AdminPanel />,
        children: [
          { path: 'users', element: <UserManagement /> },
          { path: 'reports', element: <Reports /> },
        ],
      },
    ],
  },
]);`}
      </CodeBlock>

      <h2>Auth Context Pattern</h2>

      <CodeBlock language="jsx" title="Auth Context for App-Wide Auth State">
{`import { createContext, useContext, useState, useEffect } from 'react';

// Create auth context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage or cookie on mount
    getStoredUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const user = await authService.login(credentials);
    setUser(user);
    storeUser(user);
    return user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    clearStoredUser();
  };

  if (loading) return <FullPageSpinner />;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

// Wrap your app — AuthProvider outside RouterProvider
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}`}
      </CodeBlock>

      <h2>Handling Unauthenticated vs Unauthorized</h2>

      <CodeBlock language="jsx" title="Separate Handling for 401 vs 403">
{`// 401 Unauthenticated — user is not logged in
// 403 Unauthorized — user is logged in but lacks permission
// These should show DIFFERENT pages and behave differently

function requireRoleGuard(requiredRole) {
  return async ({ request }) => {
    const user = await getUser();

    // Not logged in — send to login with return URL
    if (!user) {
      const returnTo = new URL(request.url).pathname;
      return redirect('/login?returnTo=' + encodeURIComponent(returnTo));
    }

    // Logged in but wrong role — send to "access denied" page
    if (!user.roles.includes(requiredRole)) {
      return redirect('/403');
    }

    return user;
  };
}

// 403 Page — explains the issue clearly
function ForbiddenPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Access Denied</h1>
      <p>
        You are logged in as <strong>{user?.email}</strong> but do not have
        permission to view this page.
      </p>
      <p>Contact your administrator if you believe this is a mistake.</p>
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
}

// useNavigate for programmatic redirect with state
function ProtectedAction() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAction = () => {
    if (!user) {
      navigate('/login', { state: { message: 'Please log in to continue' } });
      return;
    }
    performAction();
  };
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Client-Side Guards Are Not Security">
        Route guards in React are a UX improvement, not a security measure. A determined user can
        bypass any client-side guard by manipulating JavaScript. Always enforce authorization on
        your API server. The loader redirect simply prevents showing the page; the API must reject
        unauthorized requests regardless.
      </InfoBox>

      <InteractiveChallenge
        question={"Why is redirect() inside a loader preferred over a RequireAuth component for access control?"}
        options={[
          "Loaders run on the server so they are more secure",
          "The loader redirect runs before any component renders, preventing a flash of protected content",
          "RequireAuth components cannot access user state",
          "Loaders allow multiple redirects while components allow only one"
        ]}
        correctIndex={1}
        explanation={"A loader redirect executes before React renders any component. The browser never sees the protected component at all. RequireAuth components render briefly before checking auth — this can cause a flash of protected content or require extra loading states. Loader redirects are also easier to test since they are plain async functions."}
      />

      <InteractiveChallenge
        question={"What should the login page do with the 'from' location state after a successful login?"}
        options={[
          "Ignore it and always navigate to /dashboard",
          "Navigate to the saved location so the user returns to where they were trying to go",
          "Delete it from session storage",
          "Show it to the user as a confirmation message"
        ]}
        correctIndex={1}
        explanation={"When RequireAuth redirects an unauthenticated user, it saves the intended destination in location.state.from. After a successful login, the login component reads this state and navigates there using navigate(from, { replace: true }). The replace: true prevents the user from pressing Back and returning to the login page after logging in."}
      />
    </LessonLayout>
  );
}
