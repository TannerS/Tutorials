import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="Setup & Core Concepts"
      sectionId="react-router-v8"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react-router-v8/nested', label: 'Nested Routes & Outlets' }}
    >
      <p>
        React Router v8 shipped on June 17, 2026 — the first release under the
        project&apos;s new Open Governance model, which commits to a yearly major
        release cadence timed to Node&apos;s LTS schedule. The latest patch as of
        this writing is 8.3.1. If you already know v7, the headline is reassuring:
        v8&apos;s stated design goal is to make major releases &ldquo;boring&rdquo;
        by shipping breaking changes ahead of time behind future flags, so upgrading
        is mostly a matter of deleting flags you had already turned on. Everything
        in this lesson is verified against the official changelog and npm registry,
        not assumed from v7 knowledge.
      </p>

      <h2>What Actually Changed in v8</h2>
      <InfoBox variant="warning" title="Verified Changes, v7 → v8">
        <ul>
          <li>
            <strong><code>react-router-dom</code> is gone — for real this time.</strong>{' '}
            v7 kept it around as a three-line re-export shim so v6 imports kept
            working. v8 deletes the package outright: there is no{' '}
            <code>react-router-dom@8</code> on npm at all — its <code>latest</code>{' '}
            dist-tag is still <code>7.18.3</code>, frozen where v7 left it.
          </li>
          <li>
            <strong>Baseline floors were raised.</strong> v8 requires Node{' '}
            22.22.0+, React 19.2.7+, and Vite 7+, and the published package is{' '}
            <strong>ESM-only</strong> (no more CJS build). The library&apos;s own{' '}
            <code>tsconfig</code> target moved from ES2020 to ES2022.
          </li>
          <li>
            <strong>The deprecated <code>data</code> field is finally removed</strong>{' '}
            from the <code>meta</code> API surface. v7 let you read loader data in a{' '}
            <code>meta()</code> function via a <code>data</code> property (with a
            deprecation warning); v8 removes it. Use <code>loaderData</code> instead
            — on <code>MetaArgs</code>, on each entry in <code>MetaArgs.matches</code>,
            and on <code>UIMatch</code> (what <code>useMatches()</code> returns).
          </li>
          <li>
            <strong>Middleware is always on.</strong> The <code>future.v8_middleware</code>{' '}
            flag is gone because its behavior is now unconditional. The{' '}
            <code>context</code> argument passed to every <code>loader</code>,{' '}
            <code>action</code>, and middleware function is now guaranteed to be a{' '}
            <code>RouterContextProvider</code> instance — a custom server&apos;s{' '}
            <code>getLoadContext</code> can no longer return a plain object.
          </li>
          <li>
            <strong>A handful of other <code>future.v8_*</code> flags were adopted as
            defaults</strong> — trailing-slash-aware data requests, pass-through of
            the raw <code>request</code> to loaders/actions, the Vite Environment
            API, and <code>splitRouteModules</code> (promoted from a future flag to a
            top-level config option, default <code>true</code>). These mostly affect
            Framework Mode/SSR builds, not the client-side patterns this section
            teaches.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="success" title="What Did NOT Change">
        <p style={{ marginBottom: 0 }}>
          Every API in this lesson and the next — <code>&lt;BrowserRouter&gt;</code>,{' '}
          <code>&lt;Routes&gt;</code>, <code>&lt;Route&gt;</code>,{' '}
          <code>createBrowserRouter</code>, <code>RouterProvider</code>,{' '}
          <code>&lt;Outlet /&gt;</code>, <code>&lt;Link&gt;</code>,{' '}
          <code>&lt;NavLink&gt;</code>, <code>useNavigate</code>,{' '}
          <code>useParams</code>, <code>useSearchParams</code>, and{' '}
          <code>useLocation</code> — is byte-for-byte the same API you&apos;d write
          in v7. Nothing in the official changelog touches route matching, nested
          routing, or these hooks. If you&apos;re coming from the v7 section, most of
          this lesson will read as confirmation, not new material — that&apos;s the
          point of a &ldquo;boring&rdquo; major release.
        </p>
      </InfoBox>

      <h2>Installation</h2>
      <CodeBlock language="bash" title="Install React Router v8">
{`# New project — one package, same as v7
npm install react-router@8

# If upgrading from v7
npm install react-router@latest`}
      </CodeBlock>

      <InfoBox variant="note" title="This Repo Runs v7, Not v8">
        <p style={{ marginBottom: 0 }}>
          This project is pinned to <code>react-router@^7.16.0</code>, and its React
          version (19.2.6) is one patch behind v8&apos;s 19.2.7+ floor — so v8 isn&apos;t
          installed here, and this lesson is study material, not a description of
          this codebase. (Its Vite version, 8.0.14, already clears v8&apos;s Vite 7+
          requirement.) Everything below is verified against the official React
          Router changelog and the npm registry, not against a local install.
        </p>
      </InfoBox>

      <h2>Two Ways to Define Routes</h2>
      <p>
        Unchanged from v7: React Router still supports the classic JSX-based{' '}
        <code>&lt;Routes&gt;</code> approach and the config-based{' '}
        <code>createBrowserRouter</code> approach. The config-based API is still
        what unlocks loaders, actions, middleware, and error boundaries at the route
        level.
      </p>

      <h3>JSX-Based (Classic)</h3>
      <CodeBlock language="jsx" title="BrowserRouter + Routes (basic)">
{`import { BrowserRouter, Routes, Route } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}`}
      </CodeBlock>

      <h3>Config-Based (Recommended)</h3>
      <CodeBlock language="jsx" title="createBrowserRouter + RouterProvider">
{`import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      {
        path: 'users/:id',
        element: <UserProfile />,
        loader: userLoader,      // data loading!
        errorElement: <UserError />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Vocabulary: loader, action, fetcher, middleware">
        <p>
          Three of these carry over unchanged from v7. The fourth,{' '}
          <strong>middleware</strong>, is the one genuinely new default-on concept in
          v8.
        </p>
        <ul>
          <li>
            <strong>loader</strong> — a <em>read</em>. Runs before the route&apos;s
            component renders; the return value reaches the component via{' '}
            <code>useLoaderData()</code>. No <code>isLoading</code> flag, no{' '}
            <code>useEffect</code> needed.
          </li>
          <li>
            <strong>action</strong> — a <em>write</em>. Runs when a{' '}
            <code>&lt;Form&gt;</code> on that route is submitted; React Router
            re-runs the loaders on screen afterward so the UI reflects the change.
          </li>
          <li>
            <strong>fetcher</strong> — calls a loader or action{' '}
            <em>without navigating</em>: a mark-as-read button, an autosave, a like
            button.
          </li>
          <li>
            <strong>middleware</strong> — code that runs <em>around</em> a route&apos;s
            loader/action, before and after. Attach an array to a route&apos;s{' '}
            <code>middleware</code> field and it wraps every loader/action in that
            route and its children — the same nesting rules as <code>&lt;Outlet /&gt;</code>{' '}
            apply to middleware too. It&apos;s covered in detail below.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="info" title="When to Use Which?">
        Use <code>createBrowserRouter</code> for new projects — it enables loaders,
        actions, fetchers, middleware, and error boundaries at the route level.{' '}
        <code>BrowserRouter</code> still works but cannot leverage any of the data
        APIs.
      </InfoBox>

      <FlowChart
        title="How React Router v8 Processes a URL"
        chart={"graph TD\nA[User clicks Link or types URL] --> B[Router matches URL to route tree]\nB --> C{Config-based router?}\nC -->|No| E[Render matched element directly]\nC -->|Yes| D[Run middleware top-down, each awaits next]\nD --> L[Run loader at the matched route]\nL --> M[Middleware resumes bottom-up after next resolves]\nM --> F[Provide data via useLoaderData / context]\nF --> G[Render matched route element]\nE --> G\nG --> H[Nested Outlets render children]\nstyle A fill:#1a2744\nstyle D fill:#2a1f44\nstyle M fill:#2a1f44\nstyle G fill:#1a3329"}
      />

      <h2>Middleware Is Always On (v8)</h2>
      <p>
        In v7 this was opt-in behind <code>future.v8_middleware</code>. In v8 it&apos;s
        just how the router works — every request runs through a (possibly empty)
        middleware chain before its loader/action executes. The example below is
        adapted from React Router&apos;s official Data Mode middleware guide.
      </p>
      <p>
        First, create a typed context key. This is how middleware hands data down
        to loaders and actions without threading it through every function
        signature by hand:
      </p>
      <CodeBlock language="jsx" title="Create a context key">
{`import { createContext } from 'react-router';

export const userContext = createContext(null); // default value: no user`}
      </CodeBlock>
      <p>
        Then attach middleware to route objects with a <code>middleware</code>{' '}
        array. Each function receives <code>{'{ request, context }'}</code> and a{' '}
        <code>next</code> callback — call <code>await next()</code> to continue down
        the chain, and anything after that line runs on the way back up, once the
        loader (and any deeper middleware) has resolved:
      </p>
      <CodeBlock language="jsx" title="Attach middleware to routes">
{`import { redirect } from 'react-router';
import { userContext } from './context';

// Runs for / and every nested route beneath it
async function timingMiddleware({ context }, next) {
  const start = performance.now();
  await next();
  console.log(\`Navigation took \${performance.now() - start}ms\`);
}

// Runs only for /dashboard and its children — nests the same way Outlets do
async function authMiddleware({ context }, next) {
  const user = await getUser();
  if (!user) {
    throw redirect('/login');
  }
  context.set(userContext, user);
  await next();
}

const routes = [
  {
    path: '/',
    middleware: [timingMiddleware],
    Component: Root,
    children: [
      {
        path: 'dashboard',
        middleware: [authMiddleware],
        loader: dashboardLoader,
        Component: Dashboard,
      },
      { path: 'login', Component: Login },
    ],
  },
];

// The loader reads whatever middleware stashed in context
async function dashboardLoader({ context }) {
  const user = context.get(userContext);
  const profile = await getProfile(user);
  return { profile };
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="This Replaces a Familiar v7 Pattern">
        If you&apos;ve written a <code>requireAuth(request)</code> helper you call
        manually at the top of every protected loader, middleware is the same idea
        formalized: instead of remembering to call the helper in each loader, you
        attach it once to the parent route and every nested route inherits it
        automatically — the same inheritance <code>&lt;Outlet /&gt;</code> gives you
        for UI. The manual-helper pattern still works in v8 (nothing forces you to
        adopt middleware), but new code tends to reach for this instead.
      </InfoBox>

      <h2>Navigation Components</h2>

      <h3>Link vs NavLink</h3>
      <CodeBlock language="jsx" title="Link and NavLink">
{`import { Link, NavLink } from 'react-router';

// Basic link — renders an <a> tag, prevents full-page reload
<Link to="/dashboard">Dashboard</Link>

// Relative link (relative to current route)
<Link to="settings">Settings</Link>

// Link with state
<Link to="/login" state={{ from: '/dashboard' }}>Login</Link>

// NavLink — adds active/pending class automatically
<NavLink
  to="/dashboard"
  className={({ isActive, isPending }) =>
    isActive ? 'nav-active' : isPending ? 'nav-pending' : ''
  }
>
  Dashboard
</NavLink>

// NavLink with inline style
<NavLink
  to="/profile"
  style={({ isActive }) => ({
    fontWeight: isActive ? 'bold' : 'normal',
    color: isActive ? '#3b82f6' : '#888',
  })}
>
  Profile
</NavLink>`}
      </CodeBlock>

      <InfoBox variant="warning" title="Never Use Anchor Tags for Internal Navigation">
        Using <code>&lt;a href=&quot;/dashboard&quot;&gt;</code> causes a full page
        reload, wiping all React state. Always use <code>&lt;Link&gt;</code> or{' '}
        <code>&lt;NavLink&gt;</code> for internal routes.
      </InfoBox>

      <h2>Essential Hooks</h2>

      <h3>useNavigate — Programmatic Navigation</h3>
      <CodeBlock language="jsx" title="useNavigate">
{`import { useNavigate } from 'react-router';

function LoginForm() {
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    await authService.login(credentials);

    // Navigate to dashboard
    navigate('/dashboard');

    // Navigate with replace (no back-button entry)
    navigate('/dashboard', { replace: true });

    // Navigate with state
    navigate('/dashboard', { state: { welcomeBack: true } });

    // Go back
    navigate(-1);

    // Go forward
    navigate(1);
  };

  return <form onSubmit={handleLogin}>...</form>;
}`}
      </CodeBlock>

      <h3>useParams — Read URL Parameters</h3>
      <CodeBlock language="jsx" title="useParams">
{`import { useParams } from 'react-router';

// Route: /users/:userId/posts/:postId
function PostDetail() {
  const { userId, postId } = useParams();

  return <h1>Post {postId} by User {userId}</h1>;
}`}
      </CodeBlock>

      <h3>useSearchParams — Query String Management</h3>
      <CodeBlock language="jsx" title="useSearchParams">
{`import { useSearchParams } from 'react-router';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'name';

  const goToPage = (n) => {
    setSearchParams((prev) => {
      prev.set('page', String(n));
      return prev;
    });
  };

  return (
    <div>
      <p>Page {page}, sorted by {sort}</p>
      <button onClick={() => goToPage(page + 1)}>Next Page</button>
    </div>
  );
}`}
      </CodeBlock>

      <h3>useLocation — Access Current Location</h3>
      <CodeBlock language="jsx" title="useLocation">
{`import { useLocation } from 'react-router';

function Breadcrumb() {
  const location = useLocation();
  // location.pathname  => "/users/42/posts"
  // location.search    => "?sort=date"
  // location.hash      => "#comments"
  // location.state     => { from: '/dashboard' }
  // location.key       => unique key for this entry

  return <span>You are at: {location.pathname}</span>;
}`}
      </CodeBlock>

      <h2>Putting It All Together</h2>
      <CodeBlock language="jsx" title="Complete App Setup (v8, Config-Based)">
{`import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import About from './pages/About';
import UserProfile, { loader as userLoader } from './pages/UserProfile';
import ErrorPage from './pages/ErrorPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      {
        path: 'users/:id',
        element: <UserProfile />,
        loader: userLoader,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You have a v7 project that imports Link, useNavigate, and RouterProvider from 'react-router-dom'. What's the minimum change required to run on React Router v8?"}
        options={[
          "No change needed — react-router-dom still works in v8",
          "Swap the RouterProvider import to 'react-router/dom' and everything else to 'react-router' — react-router-dom is gone in v8",
          "Rewrite the whole app using createBrowserRouter — BrowserRouter was removed",
          "Install both react-router and react-router-dom side by side",
        ]}
        correctIndex={1}
        explanation={"react-router-dom is fully removed in v8 — there is no v8 release of it on npm. RouterProvider and HydratedRouter come from 'react-router/dom'; everything else (Link, useNavigate, Routes, Route, etc.) comes from 'react-router' itself, exactly as in v7 — the only difference is that the react-router-dom re-export shim that used to paper over the wrong import is now gone."}
        language="jsx"
      />

      <h2>Quick Reference</h2>
      <CodeBlock language="jsx" title="Hook & Component Cheat Sheet">
{`// Navigation
<Link to="/path">Click</Link>           // declarative
<NavLink to="/path">Click</NavLink>     // with active state
navigate('/path')                         // imperative

// Reading URL data
const { id } = useParams();              // /users/:id
const [params, setParams] = useSearchParams(); // ?key=val
const location = useLocation();           // full location object

// Router setup
createBrowserRouter(routes)               // config-based (recommended)
<BrowserRouter>                           // JSX-based (classic)
<RouterProvider router={router} />        // mount config-based router

// v8-specific
import { RouterProvider } from 'react-router/dom';  // NOT react-router-dom (removed)
{ middleware: [authMiddleware], ... }     // runs before/after loader, inherits down children
context.get(someContext) / context.set(someContext, value)  // inside loader/action/middleware`}
      </CodeBlock>
    </LessonLayout>
  );
}
