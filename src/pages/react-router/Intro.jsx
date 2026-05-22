import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RRIntro() {
  return (
    <LessonLayout
      title="React Router Introduction"
      sectionId="react-router"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react-router/nested', label: 'Nested Routes' }}
    >
      <h2>What Is Client-Side Routing?</h2>
      <p>
        React Router enables navigation between pages without full browser reloads.
        The URL changes, but only the components that need to change re-render — giving you
        the speed of a single-page application with the UX of traditional multi-page navigation.
      </p>

      <FlowChart
        title="Routing Architecture"
        chart={"graph LR\n  A[URL Change] --> B[React Router]\n  B --> C{Match route?}\n  C -- Yes --> D[Render matched component]\n  C -- No --> E[Render 404 component]\n  D --> F[Update browser history]\n  F --> G[Back/Forward works]"}
      />

      <h2>Setup and Basic Usage</h2>

      <CodeBlock language="jsx" title="React Router v7 Setup">
{`// Installation
// npm install react-router-dom

// main.jsx — wrap app in BrowserRouter
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// App.jsx — define routes
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/users/:userId" element={<UserProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}`}
      </CodeBlock>

      <h2>Link, NavLink, and Navigation</h2>

      <CodeBlock language="jsx" title="Navigation Components">
{`import { Link, NavLink, useNavigate } from 'react-router-dom';

// Link — basic navigation, replaces <a href>
// Does NOT cause full page reload — uses History API
function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/users/123">User Profile</Link>

      {/* Open in new tab */}
      <Link to="/help" target="_blank" rel="noopener noreferrer">Help</Link>

      {/* Relative link (from current route) */}
      <Link to="../settings">Settings</Link>
    </nav>
  );
}

// NavLink — like Link but adds active class/style when route matches
function Nav() {
  return (
    <nav>
      <NavLink
        to="/"
        end             // 'end' means only match exact "/" not "/anything"
        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
      >
        Home
      </NavLink>

      <NavLink
        to="/dashboard"
        style={({ isActive, isPending }) => ({
          color: isActive ? '#3b82f6' : '#6b7280',
          fontWeight: isActive ? 700 : 400,
          opacity: isPending ? 0.7 : 1,   // during loading state
        })}
      >
        Dashboard
      </NavLink>
    </nav>
  );
}

// useNavigate — programmatic navigation (after form submit, etc.)
function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData);
    navigate('/dashboard');              // go to dashboard
    navigate('/dashboard', { replace: true }); // no back button history
    navigate(-1);                        // go back
    navigate(2);                         // go forward 2
  };
}`}
      </CodeBlock>

      <h2>Reading URL Parameters</h2>

      <CodeBlock language="jsx" title="URL Params, Location, and Search Params">
{`import { useParams, useLocation, useSearchParams } from 'react-router-dom';

// useParams — read dynamic segments from URL
// Route: <Route path="/users/:userId/posts/:postId" element={<Post />} />
function Post() {
  const { userId, postId } = useParams();
  // URL: /users/42/posts/99 → { userId: '42', postId: '99' }
  // Note: params are always strings — parseInt() if you need numbers
  return <div>User {userId}, Post {postId}</div>;
}

// useLocation — read current URL details
function CurrentRoute() {
  const location = useLocation();
  // location.pathname = '/users/42'
  // location.search   = '?tab=posts&page=2'
  // location.hash     = '#comments'
  // location.state    = data passed via navigate('/path', { state: {...} })
  return <div>You are at: {location.pathname}</div>;
}

// useSearchParams — read/write query string (?key=value)
// Best for: filters, search, pagination (URL = shareable/bookmarkable)
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const sort = searchParams.get('sort') ?? 'newest';

  const updateFilter = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set(key, value);
      if (key !== 'page') next.set('page', '1'); // reset page on filter change
      return next;
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={e => updateFilter('q', e.target.value)}
        placeholder="Search products..."
      />
      <select value={sort} onChange={e => updateFilter('sort', e.target.value)}>
        <option value="newest">Newest</option>
        <option value="price">Price</option>
      </select>
      {/* URL updates: ?q=laptop&sort=price&page=1 */}
    </div>
  );
}`}
      </CodeBlock>

      <h2>Router Types</h2>

      <CodeBlock language="jsx" title="Which Router to Use">
{`// BrowserRouter — uses HTML5 History API (most common)
// URLs look like: /dashboard, /users/42
// Requires server config: all paths must serve index.html
// Apache: FallbackResource /index.html
// Nginx:  try_files $uri /index.html;
// Use: production web apps
import { BrowserRouter } from 'react-router-dom';

// HashRouter — uses URL hash (#) for routing
// URLs look like: /#/dashboard, /#/users/42
// Hash never sent to server — no server config needed
// ✗ Worse SEO, ✗ can't use # for in-page anchors
// Use: static file hosting without server config (GitHub Pages)
import { HashRouter } from 'react-router-dom';

// MemoryRouter — keeps history in memory (no URL)
// Use: unit tests (jsdom has no real URL), non-browser environments
import { MemoryRouter } from 'react-router-dom';
// In tests:
function renderWithRouter(ui, { initialEntries = ['/'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
}

// createBrowserRouter (v6.4+) — enables data loading APIs
// Needed for: loader, action, defer, errorElement features
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
const router = createBrowserRouter([
  { path: '/', element: <Home />, loader: homeLoader },
  { path: '/users/:id', element: <User />, loader: userLoader },
]);
function App() {
  return <RouterProvider router={router} />;
}`}
      </CodeBlock>

      <h2>Index Routes and Catch-All</h2>

      <CodeBlock language="jsx" title="Index and 404 Routes">
{`// Index route — default child when parent path is matched exactly
<Routes>
  <Route path="/dashboard" element={<DashboardLayout />}>
    <Route index element={<DashboardHome />} />        {/* /dashboard */}
    <Route path="analytics" element={<Analytics />} /> {/* /dashboard/analytics */}
    <Route path="settings" element={<Settings />} />   {/* /dashboard/settings */}
  </Route>
</Routes>

// Without index, navigating to /dashboard renders DashboardLayout
// with an empty Outlet — no content visible.
// With index, /dashboard shows DashboardHome inside the layout.

// Catch-all route for 404 pages (must be last)
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="*" element={<NotFound />} />  {/* matches everything else */}
</Routes>

function NotFound() {
  const location = useLocation();
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>404 — Page Not Found</h1>
      <p>No page found at: {location.pathname}</p>
      <Link to="/">← Go Home</Link>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="React Router v7 vs v6">
        <p>
          React Router v7 merges with Remix. Key additions: <code>createBrowserRouter</code> for
          data-loading APIs (loaders/actions), <code>defer</code> for streaming, and
          <code>errorElement</code> for inline error boundaries per route. The JSX-based
          <code>Routes + Route</code> API still works and is fine for most apps. Use the data API
          when you want server-style data loading with Suspense and streaming.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between Link and a regular anchor tag in React Router?"
        options={[
          "There is no difference — both cause a full page reload",
          "Link uses the History API to navigate without a full page reload",
          "Link only works for internal routes; anchors work for everything",
          "Link automatically adds active CSS classes"
        ]}
        correctIndex={1}
        explanation="React Router's Link component uses the HTML5 History API (pushState) to change the URL and render the matching component without a full page reload. A regular <a href> causes a full HTTP request, browser reload, and loss of application state. Link is essential for SPA navigation — it's what makes React Router fast. NavLink is Link + active class/style based on current route."
      />

      <InteractiveChallenge
        question="When should you use useSearchParams vs useParams for reading URL data?"
        options={[
          "useParams for everything; useSearchParams is deprecated",
          "useParams for dynamic segments (/users/:id); useSearchParams for query strings (?page=2)",
          "useSearchParams for required values; useParams for optional values",
          "They are identical — both read URL segments"
        ]}
        correctIndex={1}
        explanation="useParams reads dynamic path segments defined in the Route path (/users/:userId → { userId: '42' }). useSearchParams reads query string parameters (?q=react&page=2). Use useParams when the segment is part of the resource identity (which user?). Use useSearchParams for filters, sorting, pagination, and anything that should be optional or bookmarkable. Search params don't affect which route matches — they're extra context."
      />
    </LessonLayout>
  );
}
