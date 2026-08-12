import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Fullapp() {
  return (
    <LessonLayout
      title="Complete App Routing"
      sectionId="react-router"
      lessonIndex={6}
      prev={{ path: '/react-router/testing', label: 'Testing Routes' }}
      next={{ path: '/react-router/migration', label: 'Migration Guide (v5→v7)' }}
    >
      <p>
        Let&apos;s build a complete routing structure for a production-style app.
        We&apos;ll combine every pattern from the previous lessons — nested
        layouts, loaders, protected routes, error boundaries, and loading
        states — into a cohesive architecture.
      </p>

      <FlowChart
        title="Application Route Tree"
        chart={"graph TD\nR[Root Layout] --> H[/ Home]\nR --> A[/about]\nR --> P[/pricing]\nR --> AUTH[/login & /register & /forgot-password]\nR --> DASH[/dashboard - Protected Layout]\nDASH --> DO[/dashboard Overview]\nDASH --> DP[/dashboard/profile]\nDASH --> DS[/dashboard/settings]\nDASH --> DU[/dashboard/users/:id]\nR --> NF[* 404 Catch-All]\nstyle R fill:#3b82f6,color:#fff\nstyle DASH fill:#8b5cf6,color:#fff\nstyle NF fill:#ef4444,color:#fff"}
      />

      <h2>Step 1: Root Layout</h2>
      <p>
        The root layout renders the global navigation bar and an{' '}
        <code>&lt;Outlet /&gt;</code> for child routes. Every page in the app
        shares this shell.
      </p>

      <CodeBlock language="jsx" title="layouts/RootLayout.jsx">
{`import { Outlet, NavLink, ScrollRestoration, useNavigation } from 'react-router-dom';

export default function RootLayout() {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="app">
      <header>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
      </header>

      {isLoading && <div className="global-loading-bar" />}

      <main>
        <Outlet />
      </main>

      <footer>© 2024 My App</footer>
      <ScrollRestoration />
    </div>
  );
}`}
      </CodeBlock>

      <h2>Step 2: Public Pages</h2>
      <CodeBlock language="jsx" title="pages/Home.jsx, About.jsx, Pricing.jsx">
{`// pages/Home.jsx
export default function Home() {
  return (
    <div>
      <h1>Welcome</h1>
      <p>This is the public home page.</p>
    </div>
  );
}

// pages/About.jsx
export default function About() {
  return <h1>About Us</h1>;
}

// pages/Pricing.jsx
export function loader() {
  return fetch('/api/plans').then((r) => r.json());
}

export default function Pricing() {
  const plans = useLoaderData();
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

      <h2>Step 3: Auth Routes</h2>
      <CodeBlock language="jsx" title="pages/Login.jsx (with action)">
{`import { Form, useActionData, useNavigation, redirect } from 'react-router-dom';

export async function action({ request }) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  const res = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) return { error: 'Invalid credentials' };

  const user = await res.json();
  localStorage.setItem('user', JSON.stringify(user));

  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';
  return redirect(returnTo);
}

export default function Login() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div>
      <h1>Log In</h1>
      {actionData?.error && <p className="error">{actionData.error}</p>}
      <Form method="post">
        <input name="email" type="email" required placeholder="Email" />
        <input name="password" type="password" required placeholder="Password" />
        <button disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </Form>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Step 4: Protected Route Wrapper</h2>
      <CodeBlock language="jsx" title="components/ProtectedRoute.jsx">
{`import { redirect } from 'react-router-dom';

// Use as a loader guard — prevents render entirely
export function requireAuth({ request }) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    const url = new URL(request.url);
    throw redirect(\`/login?returnTo=\${encodeURIComponent(url.pathname)}\`);
  }
  return user;
}`}
      </CodeBlock>

      <h2>Step 5: Dashboard Layout with Sidebar</h2>
      <CodeBlock language="jsx" title="layouts/DashboardLayout.jsx">
{`import { Outlet, NavLink, useNavigation } from 'react-router-dom';

export default function DashboardLayout() {
  const navigation = useNavigation();

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <NavLink to="/dashboard" end>Overview</NavLink>
        <NavLink to="/dashboard/profile">Profile</NavLink>
        <NavLink to="/dashboard/settings">Settings</NavLink>
      </aside>

      <section className="dashboard-content">
        {navigation.state === 'loading'
          ? <div className="spinner">Loading...</div>
          : <Outlet />
        }
      </section>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Step 6: Dashboard Sub-Routes</h2>
      <CodeBlock language="jsx" title="Dashboard Pages">
{`// pages/dashboard/Overview.jsx
export function loader() {
  return fetch('/api/dashboard/stats').then((r) => r.json());
}

export default function Overview() {
  const stats = useLoaderData();
  return <h2>Dashboard — {stats.totalUsers} users</h2>;
}

// pages/dashboard/Profile.jsx
export default function Profile() {
  const user = useRouteLoaderData('dashboard');
  return <h2>Profile: {user.name}</h2>;
}

// pages/dashboard/Settings.jsx
export default function Settings() {
  return <h2>Settings</h2>;
}

// pages/dashboard/UserDetail.jsx
export function loader({ params }) {
  return fetch(\`/api/users/\${params.id}\`).then((r) => {
    if (!r.ok) throw new Response('User not found', { status: 404 });
    return r.json();
  });
}

export default function UserDetail() {
  const user = useLoaderData();
  return <h2>{user.name} — {user.email}</h2>;
}`}
      </CodeBlock>

      <h2>Step 7: Error Boundaries</h2>
      <CodeBlock language="jsx" title="Error Boundaries per Section">
{`import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

// Root-level error boundary
export function RootError() {
  const error = useRouteError();
  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p>{error?.message || 'Unknown error'}</p>
      <Link to="/">Go Home</Link>
    </div>
  );
}

// Dashboard-specific error boundary
export function DashboardError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div>
        <h2>Not Found</h2>
        <p>That dashboard page does not exist.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Dashboard Error</h2>
      <p>{error?.message || 'Failed to load dashboard data'}</p>
    </div>
  );
}

// 404 catch-all page
export function NotFound() {
  return (
    <div>
      <h1>404 — Page Not Found</h1>
      <Link to="/">Return Home</Link>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Step 8: Full Router Configuration</h2>
      <p>
        Now we assemble every piece into a single{' '}
        <code>createBrowserRouter</code> config. This is the complete route map
        for the application.
      </p>

      <CodeBlock language="jsx" title="router.jsx — Complete Configuration">
{`import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { requireAuth } from './components/ProtectedRoute';
import { RootError, DashboardError, NotFound } from './components/ErrorPages';

import Home from './pages/Home';
import About from './pages/About';
import Pricing, { loader as pricingLoader } from './pages/Pricing';
import Login, { action as loginAction } from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Overview, { loader as overviewLoader } from './pages/dashboard/Overview';
import Profile from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';
import UserDetail, { loader as userLoader } from './pages/dashboard/UserDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RootError />,
    children: [
      // Public routes
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'pricing', element: <Pricing />, loader: pricingLoader },

      // Auth routes (public, redirect if logged in)
      { path: 'login', element: <Login />, action: loginAction },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },

      // Protected dashboard routes
      {
        path: 'dashboard',
        id: 'dashboard',
        element: <DashboardLayout />,
        loader: requireAuth,           // gate the entire section
        errorElement: <DashboardError />,
        children: [
          { index: true, element: <Overview />, loader: overviewLoader },
          { path: 'profile', element: <Profile /> },
          { path: 'settings', element: <Settings /> },
          { path: 'users/:id', element: <UserDetail />, loader: userLoader },
        ],
      },

      // 404 catch-all
      { path: '*', element: <NotFound /> },
    ],
  },
]);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Route id for useRouteLoaderData">
        Adding <code>id: &quot;dashboard&quot;</code> to the dashboard route lets any
        child access the parent&apos;s loader data via{' '}
        <code>useRouteLoaderData(&quot;dashboard&quot;)</code> — handy for sharing
        the authenticated user object without prop drilling.
      </InfoBox>

      <h2>Step 9: App Entry Point</h2>
      <CodeBlock language="jsx" title="main.jsx">
{`import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider
      router={router}
      fallbackElement={<div className="app-spinner">Loading app...</div>}
    />
  </StrictMode>
);`}
      </CodeBlock>

      <h2>Code Organization</h2>
      <CodeBlock language="jsx" title="Recommended Folder Structure">
{`/*
src/
├── main.jsx                    Entry point
├── router.jsx                  createBrowserRouter config
├── layouts/
│   ├── RootLayout.jsx          Global shell (nav + footer + Outlet)
│   └── DashboardLayout.jsx     Sidebar + Outlet for /dashboard/*
├── pages/
│   ├── Home.jsx
│   ├── About.jsx
│   ├── Pricing.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── ForgotPassword.jsx
│   └── dashboard/
│       ├── Overview.jsx
│       ├── Profile.jsx
│       ├── Settings.jsx
│       └── UserDetail.jsx
├── components/
│   ├── ProtectedRoute.jsx      requireAuth loader guard
│   └── ErrorPages.jsx          RootError, DashboardError, NotFound
└── lib/
    └── api.js                  Fetch helpers shared by loaders
*/`}
      </CodeBlock>

      <InfoBox variant="info" title="Why a Separate router.jsx?">
        Keeping the router config in its own file makes it easy to import into
        tests (<code>createMemoryRouter</code> with the same route array) and
        keeps <code>main.jsx</code> clean.
      </InfoBox>

      <InteractiveChallenge
        question={"Where should ScrollRestoration be placed in a React Router v7 app?"}
        options={[
          "In main.jsx, above RouterProvider",
          "In the root layout component, after all content",
          "In every page component that needs scroll behavior",
          "In the router config as a route property",
        ]}
        correctIndex={1}
        explanation={"ScrollRestoration should be placed once, inside your root layout component, after all rendered content. It uses sessionStorage to track scroll positions and automatically restores them during back/forward navigation. It only works with createBrowserRouter."}
        language="jsx"
      />

      <h2>Loading States with useNavigation</h2>
      <CodeBlock language="jsx" title="Global and Local Loading Indicators">
{`import { useNavigation } from 'react-router-dom';

// Global loading bar (in RootLayout)
function GlobalLoadingBar() {
  const navigation = useNavigation();
  if (navigation.state === 'idle') return null;

  return (
    <div className="loading-bar">
      {navigation.state === 'loading' && 'Loading page...'}
      {navigation.state === 'submitting' && 'Submitting form...'}
    </div>
  );
}

// navigation.state values:
// "idle"       — nothing happening
// "loading"    — a loader is running (GET navigation)
// "submitting" — an action is running (POST/PUT/DELETE)`}
      </CodeBlock>

      <InfoBox variant="success" title="Full App Complete">
        You now have a production-ready routing architecture: public pages, auth
        flows with redirect, a protected dashboard with nested layouts, error
        boundaries scoped to each section, loading indicators, and a clean file
        organization. This pattern scales from small apps to large SPAs.
      </InfoBox>
    </LessonLayout>
  );
}
