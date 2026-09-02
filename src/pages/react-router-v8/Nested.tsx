import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Nested() {
  return (
    <LessonLayout
      title="Nested Routes & Outlets"
      sectionId="react-router-v8"
      lessonIndex={1}
      prev={{ path: '/react-router-v8/intro', label: 'Setup & Core Concepts' }}
      next={{ path: '/react-router-v8/data', label: 'Data Loading & Actions' }}
    >
      <p>
        Nested routing is core v6+ architecture, and nothing in the v8 changelog
        touches it — <code>&lt;Outlet /&gt;</code>, index routes, pathless layout
        routes, dynamic segments, splats, and the route-ranking algorithm all work
        exactly as they did in v7. This lesson covers that unchanged foundation, then
        adds the one genuinely v8-specific wrinkle: how the new default-on
        middleware chain nests the same way your routes do.
      </p>

      <FlowChart
        title="How Nested Routes Render"
        chart={"graph TD\nA[URL: /dashboard/settings] --> B[Match: / => RootLayout]\nB --> C[Match: /dashboard => DashboardLayout]\nC --> D[Match: /dashboard/settings => SettingsPage]\nB --> E[RootLayout renders Outlet]\nE --> F[DashboardLayout renders Outlet]\nF --> G[SettingsPage renders content]\nstyle A fill:#1a2744\nstyle E fill:#2a1f44\nstyle F fill:#2a1f44\nstyle G fill:#1a3329"}
      />

      <h2>The Outlet Component</h2>
      <p>
        <code>&lt;Outlet /&gt;</code> is a placeholder in a parent route&apos;s
        element. React Router fills it with whichever child route matches the
        current URL. Think of it like <code>{'{children}'}</code> but driven by
        the URL.
      </p>

      <CodeBlock language="jsx" title="Parent Layout with Outlet">
{`import { Outlet, NavLink } from 'react-router';

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
{`import { createBrowserRouter } from 'react-router';

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
      // Pathless route — wraps children with an auth check
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

      <h2>v8: Middleware Cascades the Same Way Outlets Do</h2>
      <p>
        The pathless layout route above is a render-time guard — it renders,
        checks <code>useAuth()</code>, and bails to a redirect if there&apos;s no
        user. It works, and it still works in v8. But v8&apos;s always-on
        middleware gives you a second option that runs the check{' '}
        <em>before</em> anything renders at all, attached directly to the route
        tree instead of to a wrapper component. And because a route&apos;s{' '}
        <code>middleware</code> array applies to every route nested beneath it,
        it follows the exact same parent-to-child inheritance you already know
        from <code>&lt;Outlet /&gt;</code> — attach it once at{' '}
        <code>/dashboard</code>, and <code>/dashboard/settings</code>,{' '}
        <code>/dashboard/users/:userId</code>, and everything else under that
        branch inherit it automatically.
      </p>

      <CodeBlock language="jsx" title="Auth as middleware instead of a wrapper component">
{`import { redirect } from 'react-router';
import { userContext } from './context';

async function requireAuth({ context }, next) {
  const user = await getUser();
  if (!user) throw redirect('/login');
  context.set(userContext, user);
  await next();
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardLayout />,
        middleware: [requireAuth],      // <-- guards this route AND every child below
        children: [
          { index: true, element: <DashboardOverview /> },
          { path: 'settings', element: <Settings /> },   // inherits requireAuth
          {
            path: 'users',
            element: <UsersLayout />,
            children: [
              // still inherits requireAuth, two levels down
              { path: ':userId', element: <UserDetail /> },
            ],
          },
        ],
      },
      { path: 'login', element: <Login /> },
    ],
  },
]);`}
      </CodeBlock>

      <InfoBox variant="info" title="Which One Should You Use?">
        <p style={{ marginBottom: 0 }}>
          Neither replaces the other outright. The pathless-layout pattern is
          simpler to reach for if you&apos;re not already using loaders anywhere
          in the branch, and it&apos;s identical in v7 and v8. Middleware is the
          better fit once you have loaders on those routes anyway — it runs
          before the loader instead of racing it, and it hands data down through{' '}
          <code>context</code> instead of a separate <code>useAuth()</code> call
          each component has to remember to make. Either way, the guard shown
          here is still a client-side UX nicety, not server-side security — see
          the auth guards lesson in the v7 section for why that distinction
          matters for interviews.
        </p>
      </InfoBox>

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
import { useParams } from 'react-router';

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

// 404 catch-all. Conventionally written last for readability — but its
// POSITION does not affect matching (see the note below).
{ path: '*', element: <NotFound /> }`}
      </CodeBlock>

      <InfoBox variant="success" title="Route Order Still Does Not Matter">
        <p>
          This is v6+ architecture and v8 hasn&apos;t touched it: React Router
          scores every route that could match and picks the <em>most specific</em>{' '}
          one, wherever it sits in the array. Static segments outrank dynamic{' '}
          <code>:params</code>, which outrank splats.
        </p>
        <CodeBlock language="jsx" title="Both orderings behave identically">
          {`// '*' first — still correct. /users/42 matches ':userId', not '*'.
children: [
  { path: '*', element: <NotFound /> },
  { path: 'users/:userId', element: <UserDetail /> },
  { path: 'users/new', element: <NewUser /> },   // wins over :userId for /users/new
]`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          <code>/users/new</code> beats <code>/users/:userId</code> automatically
          — you never place it first on purpose. React Router v8&apos;s v7.x/8.x
          patch releases fixed a couple of edge-case ranking bugs (dynamic
          params with static file-extension suffixes, and consecutive optional
          static segments), but the ranking algorithm itself is unchanged. Keep
          writing <code>*</code> last as a readability convention; it is still
          not load-bearing.
        </p>
      </InfoBox>

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
{`import { Outlet, useOutletContext } from 'react-router';

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

      <InfoBox variant="note" title="Don't Confuse Outlet Context With Router Context">
        <code>useOutletContext()</code> above and the <code>context</code>{' '}
        parameter middleware/loaders receive are two unrelated mechanisms that
        happen to share a name. Outlet context is a React-level prop passed from
        a parent <em>component</em> to whatever renders in its{' '}
        <code>&lt;Outlet /&gt;</code> — it only exists on the client and only
        while that component is mounted. Router context (<code>RouterContextProvider</code>,{' '}
        <code>context.get</code>/<code>context.set</code>) is a router-level
        object threaded through middleware, loaders, and actions for a single
        request/navigation, and it exists in v8 whether or not you use
        middleware at all.
      </InfoBox>

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
        path: 'app',
        element: <AppLayout />,        // sidebar + header
        middleware: [requireAuth],     // guards this branch, v8-style
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
      { path: '*', element: <NotFound /> },
    ],
  },
]);`}
      </CodeBlock>

      <FlowChart
        title="Route Matching Priority"
        chart={"graph TD\nA[URL segments to match] --> B{Exact static match?}\nB -->|Yes| C[Use static route]\nB -->|No| D{Dynamic :param match?}\nD -->|Yes| E[Use dynamic route]\nD -->|No| F{Splat * match?}\nF -->|Yes| G[Use splat route]\nF -->|No| H[404 - No match]\nstyle C fill:#1a3329\nstyle E fill:#1a2744\nstyle G fill:#3d2f14\nstyle H fill:#3b1a1a"}
      />
    </LessonLayout>
  );
}
