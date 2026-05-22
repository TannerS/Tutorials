import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RRNested() {
  return (
    <LessonLayout
      title="Nested Routes"
      sectionId="react-router"
      lessonIndex={1}
      prev={{ path: "/react-router/intro", label: "Introduction" }}
      next={{ path: "/react-router/data", label: "Data Loading" }}
    >
      <p>
        Nested routes let you build hierarchical URL structures that mirror your UI hierarchy.
        A parent route renders a layout; child routes render their content into the parent's{' '}
        <code>Outlet</code>. This enables shared navigation, sidebars, and layouts without repetition.
      </p>

      <FlowChart
        title="Nested Route URL to Component Mapping"
        chart={"graph TD\n  A[/ RootLayout] --> B[/dashboard DashboardLayout]\n  A --> C[/about AboutPage]\n  B --> D[index DashboardHome]\n  B --> E[/dashboard/analytics Analytics]\n  B --> F[/dashboard/settings SettingsLayout]\n  F --> G[index GeneralSettings]\n  F --> H[/dashboard/settings/profile Profile]\n  F --> I[/dashboard/settings/security Security]"}
      />

      <h2>Basic Nested Route Structure</h2>

      <CodeBlock language="jsx" title="Defining and Rendering Nested Routes">
{`import { createBrowserRouter, RouterProvider, Outlet, Link } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,        // renders nav + <Outlet />
    children: [
      { index: true, element: <Home /> },       // matches "/"
      { path: 'about', element: <About /> },
      {
        path: 'dashboard',
        element: <DashboardLayout />,           // renders sidebar + <Outlet />
        children: [
          { index: true, element: <DashboardHome /> }, // matches "/dashboard"
          { path: 'analytics', element: <Analytics /> },
          {
            path: 'settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <GeneralSettings /> },
              { path: 'profile', element: <Profile /> },
              { path: 'security', element: <Security /> },
            ],
          },
        ],
      },
    ],
  },
]);

// Each layout renders <Outlet /> where children should appear
function RootLayout() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/about">About</Link>
      </nav>
      <main>
        <Outlet /> {/* Dashboard or About or Home renders here */}
      </main>
    </>
  );
}

function DashboardLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <aside>
        <Link to="/dashboard">Overview</Link>
        <Link to="/dashboard/analytics">Analytics</Link>
        <Link to="/dashboard/settings">Settings</Link>
      </aside>
      <section>
        <Outlet /> {/* DashboardHome, Analytics, or SettingsLayout renders here */}
      </section>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Nested URL Parameters</h2>
      <p>
        URL parameters accumulate as you go deeper. A child route has access to all params defined
        in ancestor route paths via a single <code>useParams()</code> call.
      </p>

      <CodeBlock language="jsx" title="Nested URL Params with useParams">
{`// Route definition — parameters accumulate down the tree
const router = createBrowserRouter([
  {
    path: '/orgs/:orgId',
    element: <OrgLayout />,
    children: [
      { index: true, element: <OrgHome /> },
      {
        path: 'repos/:repoId',
        element: <RepoLayout />,
        children: [
          { index: true, element: <RepoHome /> },
          { path: 'issues/:issueId', element: <IssueDetail /> },
        ],
      },
    ],
  },
]);

// URL: /orgs/acme/repos/my-app/issues/42
function IssueDetail() {
  const { orgId, repoId, issueId } = useParams();
  // orgId   = "acme"
  // repoId  = "my-app"
  // issueId = "42"
  // ALL ancestor params are available — no prop drilling needed
  return <h1>Issue #{issueId} in {orgId}/{repoId}</h1>;
}

// Relative paths in child routes — no leading slash
function RepoLayout() {
  const { orgId, repoId } = useParams();
  return (
    <div>
      <nav>
        {/* Relative links — resolved against current route path */}
        <Link to="">Overview</Link>
        <Link to="issues">Issues</Link>
        {/* Absolute link — starts with / */}
        <Link to={'/orgs/' + orgId}>Back to Org</Link>
      </nav>
      <Outlet />
    </div>
  );
}`}
      </CodeBlock>

      <h2>Index Routes — Default Child Content</h2>
      <p>
        An index route renders when the parent path matches exactly. It acts as the default content
        for a layout — eliminating the empty-Outlet problem.
      </p>

      <CodeBlock language="jsx" title="Index Routes as Default Child">
{`// Without index route: visiting /settings shows an EMPTY SettingsLayout
// With index route: visiting /settings shows GeneralSettings inside SettingsLayout

// Using object syntax (createBrowserRouter)
{
  path: 'settings',
  element: <SettingsLayout />,
  children: [
    { index: true, element: <GeneralSettings /> }, // renders at /settings
    { path: 'profile', element: <Profile /> },      // renders at /settings/profile
    { path: 'security', element: <Security /> },    // renders at /settings/security
  ],
}

// Using JSX syntax (<Routes>/<Route>)
<Route path="settings" element={<SettingsLayout />}>
  <Route index element={<GeneralSettings />} />
  <Route path="profile" element={<Profile />} />
  <Route path="security" element={<Security />} />
</Route>

// SettingsLayout — the index element renders into this Outlet at /settings
function SettingsLayout() {
  return (
    <div>
      <nav>
        <NavLink to="" end>General</NavLink>
        <NavLink to="profile">Profile</NavLink>
        <NavLink to="security">Security</NavLink>
      </nav>
      <Outlet /> {/* GeneralSettings, Profile, or Security renders here */}
    </div>
  );
}`}
      </CodeBlock>

      <h2>Pathless Layout Routes</h2>
      <p>
        A route without a <code>path</code> acts as a layout wrapper — it contributes shared UI or
        logic without changing the URL. This is the recommended pattern for auth guards.
      </p>

      <CodeBlock language="jsx" title="Pathless Layout Routes for Auth Grouping">
{`const router = createBrowserRouter([
  // Pathless route — wraps protected pages, no URL segment added
  {
    element: <AuthenticatedLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/profile', element: <Profile /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  // Public routes — outside the auth layout
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/', element: <LandingPage /> },
]);

function AuthenticatedLayout() {
  const { user } = useAuth();
  // Redirects BEFORE rendering children — no flash of protected content
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <main>
        <Outlet /> {/* Dashboard, Profile, or Settings renders here */}
      </main>
    </div>
  );
}`}
      </CodeBlock>

      <h2>useOutletContext — Passing Data to Children</h2>

      <CodeBlock language="jsx" title="useOutletContext for Sharing Data Down the Tree">
{`import { Outlet, useOutletContext } from 'react-router-dom';

// Parent layout passes shared data to all child routes
function DashboardLayout() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications(user.id).then(setNotifications);
  }, [user.id]);

  return (
    <div>
      <header>Welcome, {user.name}</header>
      {/* Pass data as context to all child routes via Outlet */}
      <Outlet context={{ user, notifications, setNotifications }} />
    </div>
  );
}

// Any child route can consume the context
function Analytics() {
  // No props needed — no prop drilling — no global state
  const { user, notifications } = useOutletContext();
  return (
    <div>
      <h2>Analytics for {user.name}</h2>
      <p>{notifications.length} unread notifications</p>
    </div>
  );
}

// Best practice: export a typed hook for the context
export function useDashboard() {
  const ctx = useOutletContext();
  if (!ctx) throw new Error('useDashboard must be used inside DashboardLayout');
  return ctx;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Relative vs Absolute Paths in Nested Routes">
        Inside a nested route, <code>Link to=""</code> links to the current route's exact path.
        <code>Link to="child"</code> appends to the current path. A leading <code>/</code> always
        makes a path absolute from the root. Use relative paths when building reusable route subtrees
        that might be mounted at different parent paths.
      </InfoBox>

      <InteractiveChallenge
        question={"What renders inside a DashboardLayout's <Outlet /> when the URL is exactly /dashboard?"}
        options={[
          "Nothing — Outlet only renders when a child path beyond /dashboard is matched",
          "The DashboardLayout itself renders again recursively",
          "The index route's element renders",
          "A 404 page renders automatically"
        ]}
        correctIndex={2}
        explanation={"When the URL matches the parent path exactly (/dashboard), the index route renders inside the Outlet. An index route is declared with index: true and serves as the default child. Without an index route, the Outlet renders nothing at the parent path — leaving a blank content area."}
      />

      <InteractiveChallenge
        question={"What is the purpose of a pathless layout route (a route object with no path property)?"}
        options={[
          "It renders a 404 page for unmatched routes",
          "It wraps a group of routes with shared UI or logic without adding a URL segment",
          "It replaces BrowserRouter when no URL is needed",
          "It makes all child routes render simultaneously"
        ]}
        correctIndex={1}
        explanation={"A pathless layout route has an element but no path. It wraps child routes in shared UI — like a sidebar or an auth check — without adding any URL segment. The children still have their own paths. This is the recommended pattern for grouping protected routes under a single auth guard."}
      />
    </LessonLayout>
  );
}
