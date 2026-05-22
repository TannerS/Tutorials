import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RRFullapp() {
  return (
    <LessonLayout
      title="Full Application Example"
      sectionId="react-router"
      lessonIndex={6}
      prev={{ path: '/react-router/testing', label: 'Testing Routes' }}
      next={{ path: '/react-router/migration', label: 'v5 to v6 Migration' }}
    >
      <h2>Complete Router Architecture</h2>
      <p>
        This lesson assembles all React Router concepts — layouts, nested routes, loaders, actions,
        guards, error boundaries, and lazy loading — into a production-ready application structure.
        The router configuration becomes the single source of truth for your app's URL structure.
      </p>

      <FlowChart
        title="App Route Structure"
        chart={"graph TD\n  A[/ RootLayout] --> B[index LandingPage]\n  A --> C[/login LoginPage]\n  A --> D[/app requireAuth]\n  D --> E[AppLayout]\n  E --> F[index Dashboard]\n  E --> G[/orders OrdersLayout]\n  G --> H[index OrderList]\n  G --> I[/:id OrderDetail]\n  G --> J[/new NewOrder]\n  E --> K[/admin requireAdmin]\n  K --> L[AdminDashboard]\n  A --> M[* NotFound]"}
      />

      <CodeBlock language="jsx" title="Router Configuration — The Spine of the App">
{`// router.jsx — single source of truth for URL structure
import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';

// Eagerly loaded — critical first-render paths
import RootLayout    from './layouts/RootLayout';
import AppLayout     from './layouts/AppLayout';
import LandingPage   from './pages/LandingPage';
import LoginPage     from './pages/LoginPage';
import Dashboard     from './pages/Dashboard';
import NotFound      from './pages/NotFound';

// Lazily loaded — deferred until navigation
const OrdersLayout  = lazy(() => import('./layouts/OrdersLayout'));
const OrderList     = lazy(() => import('./pages/orders/OrderList'));
const OrderDetail   = lazy(() => import('./pages/orders/OrderDetail'));
const NewOrder      = lazy(() => import('./pages/orders/NewOrder'));
const AdminLayout   = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));

// Loaders and actions (co-located with their pages)
import { ordersLoader }    from './pages/orders/OrderList';
import { orderLoader }     from './pages/orders/OrderDetail';
import { createOrderAction } from './pages/orders/NewOrder';
import { profileLoader, updateProfileAction } from './pages/Profile';

// Guards
import { requireAuthLoader, requireAdminLoader } from './auth/loaders';

export const router = createBrowserRouter([
  {
    path: '/',
    id: 'root',                // id allows useRouteLoaderData('root')
    element: <RootLayout />,
    errorElement: <GlobalError />,  // catches anything not caught lower
    loader: rootLoader,             // fetches session/user for whole app

    children: [
      // Public routes
      { index: true, element: <LandingPage /> },
      { path: 'login',    element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      // Protected section — requireAuthLoader redirects unauthenticated users
      {
        path: 'app',
        id: 'app',
        loader: requireAuthLoader,   // runs before ANY child renders
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard />, loader: dashboardLoader },

          // Orders sub-section with its own layout
          {
            path: 'orders',
            element: <OrdersLayout />,
            children: [
              {
                index: true,
                element: <OrderList />,
                loader: ordersLoader,
              },
              {
                path: ':orderId',
                element: <OrderDetail />,
                loader: orderLoader,
                errorElement: <OrderError />,  // handles missing orders
              },
              {
                path: 'new',
                element: <NewOrder />,
                action: createOrderAction,      // handles form submission
              },
            ],
          },

          // Profile with inline loader+action
          {
            path: 'profile',
            element: <ProfilePage />,
            loader: profileLoader,
            action: updateProfileAction,
          },

          // Admin section — extra auth guard
          {
            path: 'admin',
            loader: requireAdminLoader,  // checks for admin role
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              {
                path: 'users',
                element: <UserManagement />,
                loader: usersLoader,
              },
            ],
          },
        ],
      },

      // Catch-all must be last
      { path: '*', element: <NotFound /> },
    ],
  },
]);`}
      </CodeBlock>

      <h2>Layout Components</h2>

      <CodeBlock language="jsx" title="Root and App Layouts">
{`// layouts/RootLayout.jsx
import { Outlet, ScrollRestoration, useNavigation } from 'react-router-dom';

export default function RootLayout() {
  const navigation = useNavigation();
  const isLoading = navigation.state !== 'idle';

  return (
    <html lang="en">
      <head>
        <title>My App</title>
      </head>
      <body>
        {/* Global loading bar during route transitions */}
        {isLoading && (
          <div className="fixed top-0 inset-x-0 h-1 bg-blue-500 animate-pulse z-50" />
        )}

        {/* Renders matched child route */}
        <Outlet />

        {/* Restores scroll position on back/forward navigation */}
        <ScrollRestoration />
      </body>
    </html>
  );
}

// layouts/AppLayout.jsx
import { Outlet, NavLink, useRouteLoaderData } from 'react-router-dom';

export default function AppLayout() {
  // Access the auth loader data from the parent 'app' route
  const { user } = useRouteLoaderData('app');

  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto p-6">
        {/* Suspense wraps lazy child routes */}
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function Sidebar({ user }) {
  return (
    <nav className="w-64 bg-gray-900 text-white p-4">
      <div className="mb-6">
        <p className="text-sm text-gray-400">Signed in as</p>
        <p className="font-semibold">{user.name}</p>
      </div>
      <ul>
        <li>
          {/* NavLink adds active class automatically */}
          <NavLink
            to="/app"
            end                        // only active on exact /app
            className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }
          >
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/app/orders"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            Orders
          </NavLink>
        </li>
        {user.role === 'admin' && (
          <li>
            <NavLink to="/app/admin" className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }>
              Admin
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}`}
      </CodeBlock>

      <h2>Co-located Loaders and Actions</h2>

      <CodeBlock language="jsx" title="pages/orders/OrderList.jsx — Loader Pattern">
{`// Co-locate loader with the component it feeds — export both from same file
import { useLoaderData, Link, Form } from 'react-router-dom';

// Named export: loader function (used in router config)
export async function ordersLoader({ request }) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? 'all';
  const page   = Number(url.searchParams.get('page') ?? '1');

  const { orders, totalPages } = await fetchOrders({ status, page });
  return { orders, totalPages, status, page };
}

// Default export: the component (also used in router config)
export default function OrderList() {
  const { orders, totalPages, status, page } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1>Orders</h1>
        <Link to="new" className="btn-primary">New Order</Link>
      </div>

      <select
        value={status}
        onChange={e => setSearchParams({ status: e.target.value, page: '1' })}
      >
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="shipped">Shipped</option>
      </select>

      {orders.map(order => (
        <Link key={order.id} to={order.id}>
          <OrderCard order={order} />
        </Link>
      ))}

      <Pagination current={page} total={totalPages} />
    </div>
  );
}

// pages/orders/NewOrder.jsx — Action pattern
export async function createOrderAction({ request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const errors = validateOrder(data);
  if (errors) return { errors };  // return errors — action data, no redirect

  const order = await createOrder(data);
  return redirect('/app/orders/' + order.id);  // redirect on success
}

export default function NewOrder() {
  const actionData = useActionData();  // gets return value from action
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">  {/* React Router Form — submits to action */}
      <h1>New Order</h1>

      {actionData?.errors?.general && (
        <div role="alert">{actionData.errors.general}</div>
      )}

      <label>
        Customer
        <input name="customerId" required />
        {actionData?.errors?.customerId && (
          <span>{actionData.errors.customerId}</span>
        )}
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Order'}
      </button>
    </Form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Router Architecture Tips">
        <p>
          Three key conventions for maintainable router architecture:
        </p>
        <ul>
          <li><strong>Co-locate</strong> loaders and actions with their component — export both from the same file as named exports</li>
          <li><strong>Use route IDs</strong> (<code>id: 'app'</code>) to access parent loader data anywhere in the tree via <code>useRouteLoaderData('app')</code> — eliminates prop drilling</li>
          <li><strong>Error boundaries at each level</strong> — root catches everything, individual routes show contextual errors (OrderError shows order-specific messaging)</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Where is the best place to put a loader for data needed by all authenticated routes?"
        options={[
          "In every individual child route's loader so each page fetches what it needs",
          "In the parent authenticated layout route's loader — children access it via useRouteLoaderData",
          "In a React Context provider wrapped around the entire router",
          "In localStorage, fetched once on app startup"
        ]}
        correctIndex={1}
        explanation="A parent route's loader runs before any child route renders. Auth data (like the current user) fetched in the parent AppLayout loader is available to all children via useRouteLoaderData('app'). This eliminates duplication: no need to fetch the current user in every child route. Give the parent route an id prop, then any descendant can call useRouteLoaderData('that-id') to access the data."
      />

      <InteractiveChallenge
        question="What is the difference between returning data and throwing a redirect from a loader?"
        options={[
          "They are identical — both send data to the component",
          "Returning data makes it available via useLoaderData; throwing redirect sends the user to a different URL before the component renders",
          "Throwing redirect only works in actions, not loaders",
          "Returning data causes a re-render; throwing redirect causes a full page reload"
        ]}
        correctIndex={1}
        explanation="A loader can return any serializable data — available to the component via useLoaderData(). A loader can also throw redirect('/login') to redirect the user before the component ever renders (useful for auth guards: check auth, redirect if not logged in). The redirect is thrown (not returned) so React Router can catch it and initiate the navigation before the route renders."
      />
    </LessonLayout>
  );
}
