import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Nested() {
  return (
    <LessonLayout
      title="Nested Routes & Outlets"
      sectionId="react-router"
      lessonIndex={1}
      prev={{ path: '/react-router/intro', label: 'Setup & Core Concepts' }}
      next={{ path: '/react-router/data', label: 'Data Loading & Actions' }}
    >
      <p>
        Nested routes are React Router&apos;s superpower. Instead of every page
        being a standalone full-screen render, routes nest inside parent routes —
        the parent renders shared layout (nav, sidebar, footer) and an{' '}
        <code>&lt;Outlet /&gt;</code> that the child fills in. This mirrors how
        real UIs work: a dashboard shell stays put while the inner content swaps.
      </p>

      <FlowChart
        title="How Nested Routes Render"
        chart={"graph TD\nA[URL: /dashboard/settings] --> B[Match: / => RootLayout]\nB --> C[Match: /dashboard => DashboardLayout]\nC --> D[Match: /dashboard/settings => SettingsPage]\nB --> E[RootLayout renders Outlet]\nE --> F[DashboardLayout renders Outlet]\nF --> G[SettingsPage renders content]\nstyle A fill:#3b82f6,color:#fff\nstyle E fill:#8b5cf6,color:#fff\nstyle F fill:#8b5cf6,color:#fff\nstyle G fill:#10b981,color:#fff"}
      />

      <h2>The Outlet Component</h2>
      <p>
        <code>&lt;Outlet /&gt;</code> is a placeholder in a parent route&apos;s
        element. React Router fills it with whichever child route matches the
        current URL. Think of it like <code>{'{children}'}</code> but driven by
        the URL.
      </p>

      <CodeBlock language="jsx" title="Parent Layout with Outlet">
{`import { Outlet, NavLink } from 'react-router-dom';

function DashboardLayout() {
  return (
    <div className="dashboard">
      <nav className="sidebar">
        <NavLink to="/dashboard" end>Overview</NavLink>
        <NavLink to="/dashboard/analytics">Analytics</NavLink>
        <NavLink to="/dashboard/settings">Settings</NavLink>
      </nav>
      <main className="content">
        {/* Child route renders here */}
        <Outlet />
      </main>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The 'end' Prop on NavLink">
        Without <code>end</code>, a <code>&lt;NavLink to=&quot;/dashboard&quot;&gt;</code>{' '}
        stays active for <em>all</em> child routes like{' '}
        <code>/dashboard/analytics</code>. Add <code>end</code> to match only the
        exact path.
      </InfoBox>

      <h2>Nested Route Configuration</h2>
      <CodeBlock language="jsx" title="Config-Based Nested Routes">
{`import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RootError />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardOverview /> },
          { path: 'analytics', element: <Analytics /> },
          { path: 'settings', element: <Settings /> },
          {
            path: 'users',
            element: <UsersLayout />,
            children: [
              { index: true, element: <UsersList /> },
              { path: ':userId', element: <UserDetail /> },
              { path: ':userId/edit', element: <UserEdit /> },
            ],
          },
        ],
      },
    ],
  },
]);`}
      </CodeBlock>

      <h2>Index Routes</h2>
      <p>
        An <strong>index route</strong> is a child route with no path that renders
        when the parent&apos;s URL matches exactly. It&apos;s the &quot;default
        child&quot; — like <code>index.html</code> for a directory.
      </p>

      <CodeBlock language="jsx" title="Index Routes">
{`// When the user visits /dashboard (not /dashboard/anything-else),
// the index route renders inside DashboardLayout's Outlet
{
  path: 'dashboard',
  element: <DashboardLayout />,
  children: [
    // index: true — renders at /dashboard exactly
    { index: true, element: <DashboardHome /> },
    { path: 'settings', element: <Settings /> },
  ],
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Index Routes Cannot Have Children">
        An index route is a leaf — it cannot have its own <code>children</code>.
        If you need nested content under a path, use a regular route with a path
        instead of an index route.
      </InfoBox>

      <h2>Layout Routes (Pathless Routes)</h2>
      <p>
        A route without a <code>path</code> (but with an <code>element</code>)
        acts as a layout wrapper. It doesn&apos;t consume any URL segment — it
        just wraps its children with shared UI or context providers.
      </p>

      <CodeBlock language="jsx" title="Pathless Layout Route">
{`const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Pathless route — wraps children with AuthProvider
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'profile', element: <Profile /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
      // These routes are NOT wrapped by AuthenticatedLayout
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },
]);

function AuthenticatedLayout() {
  const user = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="authenticated-shell">
      <UserNav user={user} />
      <Outlet />
    </div>
  );
}`}
      </CodeBlock>

      <h2>Dynamic Segments</h2>
      <p>
        URL parameters are defined with a colon prefix (<code>:paramName</code>)
        and read with <code>useParams()</code>. They match any non-empty segment.
      </p>

      <CodeBlock language="jsx" title="Dynamic Segments">
{`// Route config
{ path: 'users/:userId', element: <UserProfile /> }
{ path: 'posts/:postId/comments/:commentId', element: <Comment /> }

// Component
import { useParams } from 'react-router-dom';

function UserProfile() {
  const { userId } = useParams();
  // /users/42 => userId === "42"
  // Note: params are always strings — parse if needed
  const id = Number(userId);

  return <h1>User #{id}</h1>;
}`}
      </CodeBlock>

      <h2>Optional Segments</h2>
      <p>
        Add a <code>?</code> after a segment to make it optional. The route
        matches with or without that segment.
      </p>

      <CodeBlock language="jsx" title="Optional Segments">
{`// Matches both /posts and /posts/en, /posts/es, etc.
{ path: 'posts/:lang?', element: <PostList /> }

function PostList() {
  const { lang } = useParams();
  // /posts       => lang === undefined
  // /posts/en    => lang === "en"
  const language = lang || 'en'; // default to English
  return <h1>Posts ({language})</h1>;
}`}
      </CodeBlock>

      <h2>Splat (Catch-All) Routes</h2>
      <p>
        A <code>*</code> segment matches everything after it. Access the matched
        portion with <code>useParams()['*']</code>.
      </p>

      <CodeBlock language="jsx" title="Splat Routes">
{`// Matches /files, /files/docs, /files/docs/2024/report.pdf, etc.
{ path: 'files/*', element: <FileBrowser /> }

function FileBrowser() {
  const params = useParams();
  const filePath = params['*'];
  // /files/docs/2024/report.pdf => filePath === "docs/2024/report.pdf"
  // /files                      => filePath === ""

  return <h1>Viewing: /{filePath || 'root'}</h1>;
}

// 404 catch-all (place last in your route config)
{ path: '*', element: <NotFound /> }`}
      </CodeBlock>

      <h2>Relative Paths</h2>
      <p>
        Links and route paths are relative to their parent by default. This keeps
        route configs portable — you can move an entire branch without rewriting
        all paths.
      </p>

      <CodeBlock language="jsx" title="Relative Links">
{`// Inside DashboardLayout (path: "/dashboard")
function DashboardLayout() {
  return (
    <nav>
      {/* These are relative to /dashboard */}
      <Link to="analytics">Analytics</Link>    {/* /dashboard/analytics */}
      <Link to="settings">Settings</Link>      {/* /dashboard/settings */}
      <Link to="..">Back to Home</Link>        {/* / (one level up) */}
      <Link to="../about">About</Link>         {/* /about */}
    </nav>
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Relative vs Absolute Paths">
        Paths starting with <code>/</code> are absolute — they match from the
        root. Paths without a leading slash are relative to the parent route.
        Prefer relative paths for portability. Use <code>..</code> to navigate up.
      </InfoBox>

      <h2>Passing Data Through Outlet Context</h2>
      <CodeBlock language="jsx" title="Outlet Context">
{`import { Outlet, useOutletContext } from 'react-router-dom';

// Parent passes data via context prop
function DashboardLayout() {
  const [theme, setTheme] = useState('light');

  return (
    <div>
      <Outlet context={{ theme, setTheme }} />
    </div>
  );
}

// Any child route can consume it
function Settings() {
  const { theme, setTheme } = useOutletContext();

  return (
    <label>
      Dark mode
      <input
        type="checkbox"
        checked={theme === 'dark'}
        onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    </label>
  );
}`}
      </CodeBlock>

      <h2>Complete Nested Layout Example</h2>
      <CodeBlock language="jsx" title="Full Nested Route Tree">
{`const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,         // top-level nav + footer
    errorElement: <GlobalError />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'about', element: <About /> },
      { path: 'login', element: <Login /> },
      {
        // Pathless layout — adds auth guard
        element: <RequireAuth />,
        children: [
          {
            path: 'app',
            element: <AppLayout />,    // sidebar + header
            children: [
              { index: true, element: <AppHome /> },
              {
                path: 'projects',
                element: <ProjectsLayout />,
                children: [
                  { index: true, element: <ProjectList /> },
                  { path: ':projectId', element: <ProjectDetail /> },
                  { path: ':projectId/settings', element: <ProjectSettings /> },
                ],
              },
              { path: 'settings', element: <UserSettings /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What renders inside an Outlet when the user visits /dashboard and you have { path: 'dashboard', element: <DashboardLayout />, children: [{ index: true, element: <Overview /> }, { path: 'stats', element: <Stats /> }] }?"}
        options={[
          "Nothing — the Outlet is empty",
          "Both Overview and Stats render",
          "Overview renders (the index route)",
          "DashboardLayout renders without any child",
        ]}
        correctIndex={2}
        explanation={"The index route (index: true) is the default child. When the URL matches the parent exactly (/dashboard), the index route's element renders inside the parent's Outlet."}
        language="jsx"
      />

      <FlowChart
        title="Route Matching Priority"
        chart={"graph TD\nA[URL segments to match] --> B{Exact static match?}\nB -->|Yes| C[Use static route]\nB -->|No| D{Dynamic :param match?}\nD -->|Yes| E[Use dynamic route]\nD -->|No| F{Splat * match?}\nF -->|Yes| G[Use splat route]\nF -->|No| H[404 - No match]\nstyle C fill:#10b981,color:#fff\nstyle E fill:#3b82f6,color:#fff\nstyle G fill:#f59e0b,color:#fff\nstyle H fill:#ef4444,color:#fff"}
      />
    </LessonLayout>
  );
}
