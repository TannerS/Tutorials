import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Testing() {
  return (
    <LessonLayout
      title="Testing Routes"
      sectionId="react-router-v8"
      lessonIndex={5}
      prev={{ path: '/react-router-v8/advanced', label: 'Advanced Patterns' }}
      next={{ path: '/react-router-v8/fullapp', label: 'Complete App Routing' }}
    >
      <p>
        Testing routes means testing navigation, data loading, and — as of the
        middleware coverage in the previous lesson — the middleware/context chain
        that now sits in front of most loaders and actions. Almost every pattern
        below is identical to v7: <code>MemoryRouter</code> for simple rendering
        and navigation tests, <code>createMemoryRouter</code> for the full data
        API, and <code>createRoutesStub</code> for isolating a single component.
        The two things that actually differ under v8 are covered as they come up:
        testing the always-on middleware chain, and one import-path trap left
        over from the <code>react-router-dom</code> removal.
      </p>

      <InfoBox variant="warning" title="Before You Write a Single Test: Check Your Module Resolution">
        <p style={{ marginBottom: 0 }}>
          React Router 8 is <strong>ESM-only</strong> and <code>react-router-dom</code> no
          longer exists as a package. If your test suite (or a component under test)
          still imports from <code>react-router-dom</code>, it will fail to resolve —
          not a subtle runtime bug, a hard module-not-found error. Swap those imports to{' '}
          <code>react-router/dom</code> (for <code>RouterProvider</code>,{' '}
          <code>HydratedRouter</code>) and <code>react-router</code> (everything else)
          before debugging anything else. If you're on a CJS-transform Jest config rather
          than Vitest or a Jest ESM setup, confirm it can load ESM-only packages at all —
          this is a real and common source of "works in the browser, fails in Jest" reports
          after upgrading past v7.
        </p>
      </InfoBox>

      <FlowChart
        title="Route Testing Strategy (v8)"
        chart={"graph TD\nA[Route Tests] --> B[Unit Tests]\nA --> C[Integration Tests]\nB --> D[Test individual components with mocked hooks]\nC --> E[Test full navigation flows with MemoryRouter]\nC --> F[Test loaders and actions in isolation]\nC --> G[Test middleware / context chain]\nC --> H[Test protected routes with auth middleware]\nstyle A fill:#1a2744\nstyle B fill:#2a1f44\nstyle C fill:#2a1f44\nstyle G fill:#2a1f44"}
      />

      <h2>Testing Setup with MemoryRouter</h2>
      <p>
        <code>MemoryRouter</code> keeps the history stack in memory — no
        middleware, no loaders, just component rendering and navigation. Unchanged
        from v7; still imported from <code>react-router</code>.
      </p>

      <CodeBlock language="tsx" title="Basic MemoryRouter Test Setup">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import Home from './pages/Home';
import About from './pages/About';

test('renders Home at /', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('Welcome Home')).toBeInTheDocument();
});

test('renders About at /about', () => {
  render(
    <MemoryRouter initialEntries={['/about']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('About Us')).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Navigation</h2>
      <CodeBlock language="tsx" title="Testing Link Navigation">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router';

function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
    </nav>
  );
}

test('navigates to dashboard on link click', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={['/']}>
      <Nav />
      <Routes>
        <Route path="/" element={<p>Home Page</p>} />
        <Route path="/dashboard" element={<p>Dashboard Page</p>} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('Home Page')).toBeInTheDocument();
  await user.click(screen.getByText('Dashboard'));
  expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Route Params</h2>
      <CodeBlock language="tsx" title="Testing Dynamic Route Segments">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router';

function UserProfile() {
  const { userId } = useParams();
  return <h1>User: {userId}</h1>;
}

test('renders correct user from route param', () => {
  render(
    <MemoryRouter initialEntries={['/users/42']}>
      <Routes>
        <Route path="/users/:userId" element={<UserProfile />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('User: 42')).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Loaders and Actions</h2>
      <p>
        <code>createMemoryRouter</code> exercises the full data API — loaders,
        actions, middleware, and error boundaries — the same way the real router
        runs them. <code>RouterProvider</code> now must come from{' '}
        <code>react-router/dom</code> (it always did in Framework/Data Mode; there
        is just no more <code>react-router-dom</code> fallback if you had it
        importing from there by habit).
      </p>

      <CodeBlock language="tsx" title="Testing Loaders with createMemoryRouter">
{`import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, useLoaderData } from 'react-router';
import { RouterProvider } from 'react-router/dom';

function Dashboard() {
  const data = useLoaderData();
  return <h1>{data.title}</h1>;
}

test('loader provides data to component', async () => {
  const routes = [
    {
      path: '/dashboard',
      element: <Dashboard />,
      loader: () => ({ title: 'My Dashboard' }),
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ['/dashboard'],
  });

  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText('My Dashboard')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Testing Actions with Form Submission">
{`import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, useActionData, Form } from 'react-router';
import { RouterProvider } from 'react-router/dom';

function ContactPage() {
  const actionData = useActionData();
  return (
    <div>
      <Form method="post">
        <input name="email" placeholder="Email" />
        <button type="submit">Submit</button>
      </Form>
      {actionData?.success && <p>Submitted!</p>}
    </div>
  );
}

test('action processes form and returns data', async () => {
  const user = userEvent.setup();
  const routes = [
    {
      path: '/contact',
      element: <ContactPage />,
      action: async ({ request }) => {
        const formData = await request.formData();
        return { success: true, email: formData.get('email') };
      },
    },
  ];

  const router = createMemoryRouter(routes, { initialEntries: ['/contact'] });
  render(<RouterProvider router={router} />);

  await user.type(screen.getByPlaceholderText('Email'), 'a@b.com');
  await user.click(screen.getByText('Submit'));

  await waitFor(() => {
    expect(screen.getByText('Submitted!')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <h2>Testing the Middleware Chain</h2>
      <p>
        Because middleware is always on in v8, any route with a{' '}
        <code>middleware</code> array will run it during a test the same way it
        runs in the browser — no extra setup needed. Give <code>createMemoryRouter</code>{' '}
        real (or fake) middleware and assert on what it produces: a redirect, or a
        value it wrote into context that a loader then reads back out.
      </p>

      <CodeBlock language="tsx" title="Testing middleware writes context, loader reads it">
{`import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, createContext, redirect, useLoaderData } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const userContext = createContext<{ name: string } | null>(null);

async function authMiddleware({ context }: any) {
  // Stand-in for a real session lookup — the point under test is that
  // whatever the middleware decides, the loader downstream sees it.
  const user = { name: 'Ada' };
  if (!user) throw redirect('/login');
  context.set(userContext, user);
}

function Dashboard() {
  const data = useLoaderData() as { greeting: string };
  return <h1>{data.greeting}</h1>;
}

test('loader reads the value middleware wrote to context', async () => {
  const routes = [
    { path: '/login', element: <p>Login Page</p> },
    {
      path: '/dashboard',
      middleware: [authMiddleware],
      loader: ({ context }: any) => ({
        greeting: \`Welcome, \${context.get(userContext).name}\`,
      }),
      element: <Dashboard />,
    },
  ];

  const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText('Welcome, Ada')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Seeding context up front with getContext instead of a middleware">
{`import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, createContext, RouterContextProvider, useLoaderData } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const sessionContext = createContext<{ userId: string } | null>(null);

function Dashboard() {
  const data = useLoaderData() as { userId: string };
  return <h1>User: {data.userId}</h1>;
}

test('getContext seeds every loader without needing a middleware in the test', async () => {
  const routes = [
    {
      path: '/dashboard',
      loader: ({ context }: any) => ({
        userId: context.get(sessionContext)!.userId,
      }),
      element: <Dashboard />,
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ['/dashboard'],
    // Bypasses the real auth middleware entirely — useful when the test
    // is about the loader/component, not about auth itself.
    getContext() {
      const context = new RouterContextProvider();
      context.set(sessionContext, { userId: 'test-user-1' });
      return context;
    },
  });

  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText(/test-user-1/)).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Two Ways to Get Context Into a Test — Pick Based on What You're Testing">
        <p>
          Run the <strong>real middleware</strong> (first example) when the
          middleware&apos;s own logic — the redirect, the decision, the shape of
          what it writes — is what the test is verifying.
        </p>
        <p style={{ marginBottom: 0 }}>
          Use <strong><code>getContext</code></strong> (second example) to seed
          the value directly when the middleware itself is already tested
          elsewhere and this test is really about the loader or component that
          consumes the context. It's the context-chain equivalent of{' '}
          <code>createRoutesStub</code>&apos;s <code>hydrationData</code> below —
          skip re-running upstream work you've already covered.
        </p>
      </InfoBox>

      <h2>Testing Protected Routes (Middleware-Based Redirect)</h2>
      <CodeBlock language="tsx" title="Testing an Auth Redirect Thrown from Middleware">
{`import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, redirect } from 'react-router';
import { RouterProvider } from 'react-router/dom';

function requireAuth({ context }: any) {
  const user = getStoredUser(); // your auth helper
  if (!user) throw redirect('/login');
  context.set(userContext, user);
}

test('redirects unauthenticated user to login', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

  const routes = [
    { path: '/login', element: <p>Login Page</p> },
    { path: '/dashboard', middleware: [requireAuth], element: <p>Dashboard</p> },
  ];

  const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

test('shows dashboard for authenticated user', async () => {
  jest.spyOn(Storage.prototype, 'getItem')
    .mockReturnValue(JSON.stringify({ name: 'Alice' }));

  const routes = [
    { path: '/login', element: <p>Login Page</p> },
    { path: '/dashboard', middleware: [requireAuth], element: <p>Dashboard</p> },
  ];

  const router = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });
  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <InfoBox variant="note" title="Loader-Based Guards Still Work Too">
        Nothing about v8 requires moving an existing <code>loader</code>-based{' '}
        <code>throw redirect(...)</code> guard to middleware — both are fully
        supported, and the test above works identically if you rename{' '}
        <code>middleware: [requireAuth]</code> to <code>loader: requireAuth</code>.
        Reach for middleware when the same check needs to guard several sibling or
        nested routes without repeating it in every one of their loaders.
      </InfoBox>

      <h2>Testing Error Boundaries</h2>
      <CodeBlock language="tsx" title="Testing ErrorBoundary Rendering (loader or middleware throw)">
{`import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, useRouteError } from 'react-router';
import { RouterProvider } from 'react-router/dom';

function ErrorPage() {
  const error = useRouteError();
  return <p>Error: {(error as Error).message}</p>;
}

test('displays error boundary when loader throws', async () => {
  const routes = [
    {
      path: '/broken',
      loader: () => { throw new Error('Server is down'); },
      element: <p>Should not render</p>,
      errorElement: <ErrorPage />,
    },
  ];

  const router = createMemoryRouter(routes, { initialEntries: ['/broken'] });
  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText('Error: Server is down')).toBeInTheDocument();
  });
});

test('displays error boundary when middleware throws', async () => {
  const routes = [
    {
      path: '/broken',
      middleware: [() => { throw new Error('Auth service down'); }],
      element: <p>Should not render</p>,
      errorElement: <ErrorPage />,
    },
  ];

  const router = createMemoryRouter(routes, { initialEntries: ['/broken'] });
  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText('Error: Auth service down')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <h2>createRoutesStub — Testing a Component in Isolation</h2>
      <p>
        <code>createRoutesStub</code> tests <em>one component</em> that uses
        router hooks (<code>useLoaderData</code>, <code>useActionData</code>,{' '}
        <code>useNavigate</code>) without assembling a whole router. Its signature
        is <code>{`createRoutesStub(routes, context?)`}</code> — the second,
        optional argument takes a <code>RouterContextProvider</code> directly,
        which is how v8 wires stubbed context into middleware, loaders, and
        actions.
      </p>

      <CodeBlock language="tsx" title="createRoutesStub with a stubbed action">
{`import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import LoginForm from './LoginForm';

test('shows the validation error the action returns', async () => {
  const user = userEvent.setup();

  // Stub routes use Component / ErrorBoundary / HydrateFallback,
  // NOT element / errorElement.
  const Stub = createRoutesStub([
    {
      path: '/login',
      Component: LoginForm,
      action: async () => ({ errors: { email: 'Email is required' } }),
    },
  ]);

  render(<Stub initialEntries={['/login']} />);

  await user.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => {
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Passing a pre-built RouterContextProvider as the stub's context">
{`import { render, screen } from '@testing-library/react';
import { createRoutesStub, createContext, RouterContextProvider } from 'react-router';
import Dashboard from './Dashboard';

const userContext = createContext<{ name: string } | null>(null);

test('component reads a value seeded directly into context', () => {
  const context = new RouterContextProvider();
  context.set(userContext, { name: 'Ada' });

  const Stub = createRoutesStub(
    [
      {
        path: '/dashboard',
        Component: Dashboard,
        loader: ({ context }) => ({ name: context.get(userContext)!.name }),
      },
    ],
    context, // 👈 second arg — no future flag needed, unlike pre-v8
  );

  render(<Stub initialEntries={['/dashboard']} />);
  expect(screen.getByText(/Ada/)).toBeInTheDocument();
});`}
      </CodeBlock>

      <InfoBox variant="info" title="One Concrete v8 Simplification in createRoutesStub">
        <p style={{ marginBottom: 0 }}>
          In v7, testing a middleware-aware component with{' '}
          <code>createRoutesStub</code> required{' '}
          <code>{`<RoutesStub future={{ v8_middleware: true }} />`}</code> to get
          the <code>context</code> argument typed correctly. In v8 that prop and
          flag are gone — <code>context</code> is unconditionally a{' '}
          <code>RouterContextProvider</code>, so the stub just works. If you're
          porting v7 tests, deleting that <code>future</code> prop is a safe,
          mechanical cleanup step.
        </p>
      </InfoBox>

      <CodeBlock language="tsx" title="Seeding loader data without running the loader">
{`// hydrationData pre-populates loader/action data, keyed by ROUTE ID.
const Stub = createRoutesStub([
  {
    id: 'contact',
    path: '/contact',
    Component: ContactPage,
    loader: () => ({ locale: 'en-US' }),
  },
]);

render(
  <Stub
    initialEntries={['/contact']}
    hydrationData={{ loaderData: { contact: { locale: 'en-US' } } }}
  />
);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Which of the three do I reach for?">
        <p>
          <strong>MemoryRouter</strong> — component rendering and link navigation
          only; no loaders, actions, or middleware.
        </p>
        <p>
          <strong>createMemoryRouter</strong> — you are testing the routing
          itself: real route tree, real loaders/actions/middleware, error
          boundaries, redirects.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>createRoutesStub</strong> — you are testing one component that
          needs router context, and the loader/action/middleware are fixtures.
          Pass a pre-built <code>RouterContextProvider</code> as the second
          argument when the component reads from context.
        </p>
      </InfoBox>

      <h2>Reusable Test Wrapper</h2>
      <CodeBlock language="tsx" title="Test Utility Wrapper">
{`// test-utils.tsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext';

export function renderWithRouter(ui: React.ReactElement, { route = '/', ...options } = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AuthProvider>
    ),
    ...options,
  });
}

// Usage:
// renderWithRouter(<App />, { route: '/dashboard' });`}
      </CodeBlock>

      <h2>Mocking Router Hooks</h2>
      <CodeBlock language="tsx" title="Mocking useNavigate, useParams, useLocation">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

import { useNavigate, useParams, useLocation } from 'react-router';
import UserProfile from './UserProfile';

test('calls navigate on button click', async () => {
  const navigate = jest.fn();
  (useNavigate as jest.Mock).mockReturnValue(navigate);
  (useParams as jest.Mock).mockReturnValue({ id: '7' });
  (useLocation as jest.Mock).mockReturnValue({ pathname: '/users/7' });

  const user = userEvent.setup();
  render(<UserProfile />);

  await user.click(screen.getByText('Go Back'));
  expect(navigate).toHaveBeenCalledWith(-1);
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="Prefer Integration Tests — createRoutesStub Has Mostly Replaced This">
        <p style={{ marginBottom: 0 }}>
          Mocking hooks is brittle and unchanged in its downsides since v7: it
          pins the test to <em>how</em> a component navigates rather than{' '}
          <em>that</em> it navigates, and hand-built mock return values (like the{' '}
          <code>useLocation</code> mock above, missing <code>search</code>,{' '}
          <code>hash</code>, <code>state</code>, <code>key</code>) can silently
          drift from what the real router provides. <code>createRoutesStub</code>{' '}
          gives you real hooks backed by a real (if tiny) router — including real
          middleware/context now that it takes a <code>RouterContextProvider</code>{' '}
          directly — for about the same setup cost. Reach for <code>jest.mock</code>{' '}
          only when you genuinely cannot render a router at all.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"You're testing a route with a middleware array using createMemoryRouter. What do you need to add to make the middleware run, compared to a v7 setup with future.v8_middleware disabled?"}
        options={[
          "Nothing — middleware always runs in v8, no future flag required",
          "Pass future={{ v8_middleware: true }} to createMemoryRouter",
          "Wrap the test in an unstable_MiddlewareProvider",
          "Middleware cannot be tested with createMemoryRouter, only createRoutesStub",
        ]}
        correctIndex={0}
        explanation={"React Router 8 removed the future.v8_middleware flag entirely — middleware is unconditionally enabled, so createMemoryRouter runs any middleware array on a route exactly as the browser would, with no opt-in flag or extra provider needed. The same applies to createRoutesStub, which used to need a future prop for typed context and no longer does."}
        language="tsx"
      />

      <h2>Quick Reference: Test Pattern Cheat Sheet</h2>
      <CodeBlock language="text" title="When to Use Which Testing Pattern">
{`Scenario                         → Pattern
────────────────────────────────────────────────────────────
Render at specific URL           → MemoryRouter + initialEntries
Click link, check navigation     → MemoryRouter + userEvent.click
Test route params                → MemoryRouter with param in URL
Test loader data                 → createMemoryRouter + RouterProvider
Test form actions                → createMemoryRouter + RouterProvider
Test middleware writes context   → createMemoryRouter + real middleware
Test loader reading context only → createMemoryRouter + getContext
Test auth redirects (middleware) → createMemoryRouter + middleware array
Test error boundaries            → createMemoryRouter + throwing loader/middleware
One component + stub loader      → createRoutesStub
One component + stubbed context  → createRoutesStub(routes, context)
Seed loader data, skip fetching  → createRoutesStub + hydrationData
Isolated component test          → createRoutesStub  (jest.mock only in legacy code)
Reusable across test files       → Custom renderWithRouter utility`}
      </CodeBlock>
    </LessonLayout>
  );
}
