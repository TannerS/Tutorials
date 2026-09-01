import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Fullapp() {
  return (
    <LessonLayout
      title="Complete App Routing"
      sectionId="react-router-v8"
      lessonIndex={6}
      prev={{ path: '/react-router-v8/testing', label: 'Testing Routes' }}
      next={{ path: '/react-router-v8/migration', label: 'Migration Guide (v7→v8)' }}
    >
      <p>
        Let&apos;s build a complete routing structure for a production-style app on{' '}
        <strong>React Router v8</strong>. We&apos;ll combine every pattern from the
        previous lessons — nested layouts, loaders, actions, and error boundaries —
        with the one piece that&apos;s genuinely new since v7: <strong>middleware</strong>.
        It shipped behind a future flag in v7.9 and is stable and always-on as of{' '}
        <code>react-router@8.0.0</code>, so it&apos;s the idiomatic way to guard routes
        and share request-scoped data in a current-day v8 app.
      </p>

      <InfoBox variant="info" title="This Lesson Assumes v8, Not v7">
        Every import below comes from <code>react-router</code> or{' '}
        <code>react-router/dom</code> — there is no <code>react-router-dom</code> package
        in v8, it was removed entirely. If you&apos;re coming from a v7 codebase and want
        the full list of what changed and why, that&apos;s the next lesson:{' '}
        <strong>Migration Guide (v7→v8)</strong>. This lesson is deliberately just &ldquo;here&apos;s
        what a current app looks like,&rdquo; not a diff.
      </InfoBox>

      <FlowChart
        title="Application Route Tree"
        chart={"graph TD\nR[Root Layout] --> H[\"/ Home\"]\nR --> A[\"/about\"]\nR --> P[\"/pricing\"]\nR --> AUTH[\"/login & /register & /forgot-password\"]\nR --> DASH[\"/dashboard - Protected Layout (middleware)\"]\nDASH --> DO[\"/dashboard Overview\"]\nDASH --> DP[\"/dashboard/profile\"]\nDASH --> DS[\"/dashboard/settings\"]\nDASH --> DU[\"/dashboard/users/:id\"]\nR --> NF[* 404 Catch-All]\nstyle R fill:#1a2744\nstyle DASH fill:#2a1f44\nstyle NF fill:#3b1a1a"}
      />

      <h2>Step 1: Root Layout</h2>
      <p>
        The root layout renders the global navigation bar and an{' '}
        <code>&lt;Outlet /&gt;</code> for child routes. Every page in the app
        shares this shell — unchanged from v7.
      </p>

      <CodeBlock language="jsx" title="layouts/RootLayout.jsx">
{`import { Outlet, NavLink, ScrollRestoration, useNavigation } from 'react-router';

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

      <footer>© 2026 My App</footer>
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
{`import { Form, useActionData, useNavigation, redirect } from 'react-router';

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

      <p>
        The action sets an HTTP-only session cookie server-side on a real backend
        (never <code>localStorage</code> — see the <strong>Auth Guards</strong> lesson
        for why). What v8 changes is how the <em>rest of the app</em> finds out who is
        logged in: instead of every protected loader re-checking the session, one piece
        of middleware checks it once and hands the result down.
      </p>

      <h2>Step 4: The Guard, as Middleware</h2>
      <p>
        A loader-level guard — <code>throw redirect(&apos;/login&apos;)</code> inside a{' '}
        <code>loader</code> — still works in v8 and is the right tool for a single
        route. Middleware earns its keep when <em>several</em> routes need the same
        check, or need to share something the check produces (the user object, a
        request-scoped DB connection, a logger) without threading it through every
        loader&apos;s arguments by hand.
      </p>

      <CodeBlock language="jsx" title="context.js — a typed slot, shared by middleware and loaders">
{`import { createContext } from 'react-router';

// Holds whatever authMiddleware puts in it. The default is what every loader
// sees if the middleware is skipped entirely (e.g. a route with no guard).
export const userContext = createContext(null);`}
      </CodeBlock>

      <CodeBlock language="jsx" title="middleware/auth.js">
{`import { redirect } from 'react-router';
import { userContext } from '../context';

// Runs BEFORE any loader on this route or its children.
export async function authMiddleware({ request, context }) {
  const user = await getSessionUser(request); // reads the session cookie
  if (!user) {
    const url = new URL(request.url);
    throw redirect(\`/login?returnTo=\${encodeURIComponent(url.pathname)}\`);
  }
  context.set(userContext, user); // now visible to every descendant loader
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Middleware Runs Top-Down, Then Bottom-Up">
        <p>
          Middleware on a matched route tree runs in a nested chain: root first, then
          each parent down to the leaf, <em>then</em> the loaders, then back up through
          the same middleware in reverse. Attaching <code>authMiddleware</code> to{' '}
          <code>/dashboard</code> means it runs once per navigation into that subtree —
          not once per loader — and every loader under it, at any depth, can call{' '}
          <code>context.get(userContext)</code> without re-checking the session.
        </p>
        <p style={{ marginBottom: 0 }}>
          It throws a <code>redirect</code> just like a loader guard would, and for the
          same reason: throwing aborts the navigation before any loader below it — or
          the component itself — ever runs.
        </p>
      </InfoBox>

      <FlowChart
        title="Middleware Order for GET /dashboard/settings"
        chart={"graph TD\nRS[Root middleware starts] --> DS1[dashboard middleware starts - authMiddleware]\nDS1 --> L[Loaders run for matched routes]\nL --> DS2[dashboard middleware resumes after next]\nDS2 --> RS2[Root middleware resumes after next]\nRS2 --> DONE[Response ready, component renders]\nstyle DS1 fill:#2a1f44\nstyle DS2 fill:#2a1f44\nstyle L fill:#1a3329"}
      />

      <h2>Step 5: Dashboard Layout with Sidebar</h2>
      <CodeBlock language="jsx" title="layouts/DashboardLayout.jsx">
{`import { Outlet, NavLink, useNavigation } from 'react-router';

export default function DashboardLayout() {
  const navigation = useNavigation();

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <NavLink to="/dashboard" end>Overview</NavLink>
        <NavLink to="/dashboard/profile">Profile</NavLink>
        <NavLink to="/dashboard/settings">Settings</NavLink>
      </aside>

      {/* Keep the Outlet MOUNTED and dim it while the next route loads.
          Do NOT swap it out for a spinner — see the note below. */}
      <section
        className="dashboard-content"
        style={{
          opacity: navigation.state === 'loading' ? 0.6 : 1,
          transition: 'opacity 150ms',
        }}
      >
        <Outlet />
      </section>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why Not <spinner> : <Outlet /> — the Instinct to Resist">
        <p>
          The obvious version of that block is{' '}
          <code>{'navigation.state === \'loading\' ? <Spinner /> : <Outlet />'}</code>.
          It is worth understanding why that is the wrong shape, because it throws away
          the main thing the data router bought you.
        </p>
        <ul>
          <li>
            <strong>It unmounts the current page.</strong> The user is reading
            Overview, clicks Settings, and Overview vanishes instantly — replaced by a
            spinner, then Settings. Every navigation becomes a blank flash.
          </li>
          <li>
            <strong>Local state in the subtree is destroyed.</strong> Unmounting
            discards scroll position, expanded rows, and any in-progress input in the
            outgoing route.
          </li>
          <li>
            <strong><code>navigation.state</code> is global, not scoped.</strong> It
            is <code>'loading'</code> for <em>any</em> pending navigation in the app —
            so a click in the top-level nav somewhere else entirely also blanks the
            dashboard on the way out.
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          Dimming, a top progress bar, or <code>NavLink</code>&apos;s{' '}
          <code>isPending</code> flag all signal &ldquo;working on it&rdquo; without
          destroying anything. Reserve a real replacement spinner for the{' '}
          <em>first</em> paint, where there is genuinely nothing to keep —{' '}
          <code>HydrateFallback</code> covers that case.
        </p>
      </InfoBox>

      <h2>Step 6: Dashboard Sub-Routes</h2>
      <p>
        Because <code>authMiddleware</code> already put the user on{' '}
        <code>context</code>, none of these loaders re-fetch or re-decode the session —
        they just read it.
      </p>
      <CodeBlock language="jsx" title="Dashboard Pages">
{`// pages/dashboard/Overview.jsx
import { userContext } from '../../context';

export function loader({ context }) {
  const user = context.get(userContext);
  return fetch(\`/api/dashboard/stats?userId=\${user.id}\`).then((r) => r.json());
}

export default function Overview() {
  const stats = useLoaderData();
  return <h2>Dashboard — {stats.totalUsers} users</h2>;
}

// pages/dashboard/Profile.jsx
export function loader({ context }) {
  return { user: context.get(userContext) };
}

export default function Profile() {
  const { user } = useLoaderData();
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
{`import { useRouteError, isRouteErrorResponse, Link } from 'react-router';

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

      <InfoBox variant="note" title="Errors Thrown From Middleware Land Here Too">
        A <code>redirect</code> thrown from <code>authMiddleware</code> is a
        navigation, not an error, so it never reaches <code>errorElement</code>. But
        any <em>other</em> exception thrown from middleware — a database call that
        fails, a malformed request — bubbles to the nearest{' '}
        <code>errorElement</code> exactly like a loader or action throw does.
      </InfoBox>

      <h2>Step 8: Full Router Configuration</h2>
      <p>
        Now we assemble every piece into a single{' '}
        <code>createBrowserRouter</code> config, including a router-level{' '}
        <code>getContext</code> that seeds every navigation with a fresh logger —
        useful for anything you want available even on routes with no middleware of
        their own.
      </p>

      <CodeBlock language="jsx" title="router.jsx — Complete Configuration">
{`import { createBrowserRouter, RouterContextProvider, createContext } from 'react-router';
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { authMiddleware } from './middleware/auth';
import { RootError, DashboardError, NotFound } from './components/ErrorPages';

import Home from './pages/Home';
import About from './pages/About';
import Pricing, { loader as pricingLoader } from './pages/Pricing';
import Login, { action as loginAction } from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Overview, { loader as overviewLoader } from './pages/dashboard/Overview';
import Profile, { loader as profileLoader } from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';
import UserDetail, { loader as userLoader } from './pages/dashboard/UserDetail';

export const loggerContext = createContext();

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <RootError />,
      children: [
        // Public routes
        { index: true, element: <Home /> },
        { path: 'about', element: <About /> },
        { path: 'pricing', element: <Pricing />, loader: pricingLoader },

        // Auth routes (public)
        { path: 'login', element: <Login />, action: loginAction },
        { path: 'register', element: <Register /> },
        { path: 'forgot-password', element: <ForgotPassword /> },

        // Protected dashboard routes — one middleware guards the whole subtree
        {
          path: 'dashboard',
          id: 'dashboard',
          element: <DashboardLayout />,
          middleware: [authMiddleware],
          errorElement: <DashboardError />,
          children: [
            { index: true, element: <Overview />, loader: overviewLoader },
            { path: 'profile', element: <Profile />, loader: profileLoader },
            { path: 'settings', element: <Settings /> },
            { path: 'users/:id', element: <UserDetail />, loader: userLoader },
          ],
        },

        // 404 catch-all
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    getContext() {
      const context = new RouterContextProvider();
      context.set(loggerContext, createLogger());
      return context;
    },
  },
);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Route id for useRouteLoaderData">
        Adding <code>id: &quot;dashboard&quot;</code> to the dashboard route still
        works the same as v7 — any child can read the parent&apos;s loader data via{' '}
        <code>useRouteLoaderData(&quot;dashboard&quot;)</code>. Middleware context and{' '}
        <code>useRouteLoaderData</code> solve different problems: context carries data{' '}
        <em>into</em> loaders/actions before they run; <code>useRouteLoaderData</code>{' '}
        reads data a loader already returned, from a component.
      </InfoBox>

      <h2>Step 9: App Entry Point</h2>
      <CodeBlock language="jsx" title="main.jsx">
{`import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { router } from './router';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);`}
      </CodeBlock>

      <InfoBox variant="warning" title="react-router-dom Is Gone">
        <code>RouterProvider</code> and <code>HydratedRouter</code> come from{' '}
        <code>react-router/dom</code>; everything else — hooks, components,{' '}
        <code>createBrowserRouter</code>, <code>redirect</code>,{' '}
        <code>createContext</code> — comes from the bare <code>react-router</code>{' '}
        package. If you still have a <code>react-router-dom</code> import anywhere,
        it will fail to resolve on v8: that package&apos;s <code>latest</code>{' '}
        dist-tag is frozen at <code>7.18.3</code> and no v8 release was ever
        published for it. Full details in the next lesson.
      </InfoBox>

      <CodeBlock language="jsx" title="router.jsx — HydrateFallback (unchanged from v7)">
{`function AppSpinner() {
  return <div className="app-spinner">Loading app...</div>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RootError />,
    HydrateFallback: AppSpinner,      // shown during initial hydration
    children: [ /* ...as above... */ ],
  },
]);`}
      </CodeBlock>

      <h2>Code Organization</h2>
      <CodeBlock language="jsx" title="Recommended Folder Structure">
{`/*
src/
├── main.jsx                    Entry point
├── router.jsx                  createBrowserRouter config + getContext
├── context.js                  createContext() slots shared across the app
├── layouts/
│   ├── RootLayout.jsx          Global shell (nav + footer + Outlet)
│   └── DashboardLayout.jsx     Sidebar + Outlet for /dashboard/*
├── middleware/
│   └── auth.js                 authMiddleware — the guard for /dashboard/*
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
│   └── ErrorPages.jsx          RootError, DashboardError, NotFound
└── lib/
    └── api.js                  Fetch helpers shared by loaders
*/`}
      </CodeBlock>

      <InfoBox variant="info" title="Why a Separate router.jsx?">
        Keeping the router config in its own file makes it easy to import into
        tests (<code>createMemoryRouter</code> with the same route array, same{' '}
        <code>getContext</code>) and keeps <code>main.jsx</code> clean.
      </InfoBox>

      <InteractiveChallenge
        question={
          "The /dashboard route has middleware: [authMiddleware], which calls " +
          "context.set(userContext, user). A request comes in for /dashboard/settings. " +
          "Which loaders can read context.get(userContext)?"
        }
        options={[
          "Only the dashboard route's own loader",
          "The dashboard loader and the settings loader — any loader nested under the route the middleware is attached to",
          "Every loader in the entire router, regardless of which route it belongs to",
          "No loader — context set during middleware is discarded once the middleware function returns",
        ]}
        correctIndex={1}
        explanation={"Middleware runs top-down before the matched leaf's loaders execute, and anything written to context during that pass is visible to every loader and action nested under (and including) the route the middleware is attached to. Routes outside that subtree — Home, Pricing, Login — never see it, because their branch of the tree never ran authMiddleware."}
        language="jsx"
      />

      <h2>Loading States with useNavigation</h2>
      <CodeBlock language="jsx" title="Global and Local Loading Indicators">
{`import { useNavigation } from 'react-router';

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

// navigation.state values (unchanged from v7):
// "idle"       — nothing happening
// "loading"    — a loader is running (GET navigation)
// "submitting" — an action is running (POST/PUT/DELETE)`}
      </CodeBlock>

      <InfoBox variant="success" title="Full App Complete">
        You now have a production-ready v8 routing architecture: public pages, auth
        flows with redirect, a protected dashboard guarded by middleware instead of a
        loader repeated on every route, error boundaries scoped to each section,
        loading indicators, and a clean file organization. This pattern scales from
        small apps to large SPAs.
      </InfoBox>
    </LessonLayout>
  );
}
