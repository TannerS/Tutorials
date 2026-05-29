import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="Setup & Core Concepts"
      sectionId="react-router"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react-router/nested', label: 'Nested Routes & Outlets' }}
    >
      <p>
        React Router v7 is a full-featured routing library for React that handles
        URL-based navigation, nested layouts, data loading, and form handling. It
        ships as <code>react-router</code> (core) and <code>react-router-dom</code>{' '}
        (web bindings). v7 unifies the best ideas from Remix into the React Router
        API, giving you loaders, actions, and framework-level conventions right out
        of the box.
      </p>

      <h2>Installation</h2>
      <CodeBlock language="bash" title="Install React Router v7">
{`# New project — install the unified package
npm install react-router react-router-dom

# If upgrading from v6
npm install react-router@latest react-router-dom@latest`}
      </CodeBlock>

      <InfoBox variant="tip" title="v7 Package Structure">
        In v7, <code>react-router-dom</code> re-exports everything from{' '}
        <code>react-router</code>. You can import all hooks, components, and
        utilities from <code>react-router-dom</code> directly — no need to import
        from both packages.
      </InfoBox>

      <h2>Two Ways to Define Routes</h2>
      <p>
        React Router v7 supports two routing styles: the classic JSX-based{' '}
        <code>&lt;Routes&gt;</code> approach and the newer config-based{' '}
        <code>createBrowserRouter</code> approach. The config-based API unlocks
        loaders, actions, and error boundaries at the route level.
      </p>

      <h3>JSX-Based (Classic)</h3>
      <CodeBlock language="jsx" title="BrowserRouter + Routes (basic)">
{`import { BrowserRouter, Routes, Route } from 'react-router-dom';

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

      <h3>Config-Based (Recommended for v7)</h3>
      <CodeBlock language="jsx" title="createBrowserRouter + RouterProvider">
{`import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

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

      <InfoBox variant="info" title="When to Use Which?">
        Use <code>createBrowserRouter</code> for new projects — it enables loaders,
        actions, fetchers, and error boundaries at the route level.{' '}
        <code>BrowserRouter</code> still works but cannot leverage v7&apos;s data APIs.
      </InfoBox>

      <FlowChart
        title="How React Router Processes a URL"
        chart={"graph TD\nA[User clicks Link or types URL] --> B[Router matches URL to route tree]\nB --> C{Config-based router?}\nC -->|Yes| D[Run loader functions]\nC -->|No| E[Render matched element directly]\nD --> F[Provide data via useLoaderData]\nF --> G[Render matched route element]\nE --> G\nG --> H[Nested Outlets render children]\nstyle A fill:#3b82f6,color:#fff\nstyle D fill:#8b5cf6,color:#fff\nstyle G fill:#10b981,color:#fff"}
      />

      <h2>Navigation Components</h2>

      <h3>Link vs NavLink</h3>
      <CodeBlock language="jsx" title="Link and NavLink">
{`import { Link, NavLink } from 'react-router-dom';

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
{`import { useNavigate } from 'react-router-dom';

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
{`import { useParams } from 'react-router-dom';

// Route: /users/:userId/posts/:postId
function PostDetail() {
  const { userId, postId } = useParams();

  return <h1>Post {postId} by User {userId}</h1>;
}`}
      </CodeBlock>

      <h3>useSearchParams — Query String Management</h3>
      <CodeBlock language="jsx" title="useSearchParams">
{`import { useSearchParams } from 'react-router-dom';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'name';
  const filter = searchParams.get('filter') || '';

  const goToPage = (n) => {
    setSearchParams((prev) => {
      prev.set('page', String(n));
      return prev;
    });
  };

  const toggleSort = () => {
    setSearchParams({ page: '1', sort: sort === 'name' ? 'price' : 'name' });
  };

  return (
    <div>
      <p>Page {page}, sorted by {sort}</p>
      <button onClick={() => goToPage(page + 1)}>Next Page</button>
      <button onClick={toggleSort}>Toggle Sort</button>
    </div>
  );
}`}
      </CodeBlock>

      <h3>useLocation — Access Current Location</h3>
      <CodeBlock language="jsx" title="useLocation">
{`import { useLocation } from 'react-router-dom';

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
      <CodeBlock language="jsx" title="Complete App Setup (v7 Config-Based)">
{`import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
        question={"Which API should you use in React Router v7 to unlock loaders, actions, and route-level error boundaries?"}
        options={[
          "BrowserRouter with <Routes>",
          "createBrowserRouter with RouterProvider",
          "HashRouter with <Routes>",
          "StaticRouter with renderToString",
        ]}
        correctIndex={1}
        explanation={"createBrowserRouter is the config-based API that enables v7's data APIs — loaders, actions, fetchers, and errorElement. The classic BrowserRouter + <Routes> approach still works but cannot use these features."}
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
<RouterProvider router={router} />        // mount config-based router`}
      </CodeBlock>
    </LessonLayout>
  );
}
