import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Testing() {
  return (
    <LessonLayout
      title="Testing Routes"
      sectionId="react-router"
      lessonIndex={5}
      prev={{ path: '/react-router/advanced', label: 'Advanced Patterns' }}
      next={{ path: '/react-router/fullapp', label: 'Complete App Routing' }}
    >
      <p>
        Testing routes is essential for ensuring navigation, data loading, and
        access control work correctly. React Router provides{' '}
        <code>MemoryRouter</code> and <code>createMemoryRouter</code> for test
        environments where there is no real browser history.
      </p>

      <FlowChart
        title="Route Testing Strategy"
        chart={"graph TD\nA[Route Tests] --> B[Unit Tests]\nA --> C[Integration Tests]\nB --> D[Test individual components with mocked hooks]\nC --> E[Test full navigation flows with MemoryRouter]\nC --> F[Test loaders and actions in isolation]\nC --> G[Test protected routes with auth context]\nstyle A fill:#3b82f6,color:#fff\nstyle B fill:#8b5cf6,color:#fff\nstyle C fill:#8b5cf6,color:#fff"}
      />

      <h2>Testing Setup with MemoryRouter</h2>
      <p>
        <code>MemoryRouter</code> keeps the history stack in memory — perfect for
        tests. You control the initial URL via <code>initialEntries</code>.
      </p>

      <CodeBlock language="jsx" title="Basic MemoryRouter Test Setup">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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
      <p>
        Use <code>userEvent</code> to click links and verify that the correct
        page renders after navigation.
      </p>

      <CodeBlock language="jsx" title="Testing Link Navigation">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';

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
      <CodeBlock language="jsx" title="Testing Dynamic Route Segments">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';

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
        With <code>createMemoryRouter</code> you can test the full data API —
        loaders, actions, and error boundaries — just as the real router runs
        them.
      </p>

      <CodeBlock language="jsx" title="Testing Loaders with createMemoryRouter">
{`import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

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

      <CodeBlock language="jsx" title="Testing Actions with Form Submission">
{`import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter, RouterProvider,
  useLoaderData, useActionData, Form,
} from 'react-router-dom';

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

  const router = createMemoryRouter(routes, {
    initialEntries: ['/contact'],
  });

  render(<RouterProvider router={router} />);

  await user.type(screen.getByPlaceholderText('Email'), 'a@b.com');
  await user.click(screen.getByText('Submit'));

  await waitFor(() => {
    expect(screen.getByText('Submitted!')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="createMemoryRouter vs MemoryRouter">
        Use <code>createMemoryRouter</code> when you need to test loaders, actions,
        or error boundaries. Use <code>MemoryRouter</code> for simpler tests that
        only need component rendering and link navigation.
      </InfoBox>

      <h2>Testing Protected Routes</h2>
      <CodeBlock language="jsx" title="Testing Auth Redirects">
{`import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, redirect } from 'react-router-dom';

function requireAuth() {
  const user = getStoredUser(); // your auth helper
  if (!user) throw redirect('/login');
  return user;
}

test('redirects unauthenticated user to login', async () => {
  // Mock: no user stored
  jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

  const routes = [
    { path: '/login', element: <p>Login Page</p> },
    {
      path: '/dashboard',
      loader: requireAuth,
      element: <p>Dashboard</p>,
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ['/dashboard'],
  });

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
    {
      path: '/dashboard',
      loader: requireAuth,
      element: <p>Dashboard</p>,
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ['/dashboard'],
  });

  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <h2>Testing Error Boundaries</h2>
      <CodeBlock language="jsx" title="Testing errorElement Rendering">
{`import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useRouteError } from 'react-router-dom';

function ErrorPage() {
  const error = useRouteError();
  return <p>Error: {error.message}</p>;
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

  const router = createMemoryRouter(routes, {
    initialEntries: ['/broken'],
  });

  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText('Error: Server is down')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <h2>Reusable Test Wrapper</h2>
      <p>
        Create a utility function to reduce boilerplate across all your route
        tests. It wraps components with <code>MemoryRouter</code> and any
        providers your app needs (auth context, theme, etc.).
      </p>

      <CodeBlock language="jsx" title="Test Utility Wrapper">
{`// test-utils.jsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

export function renderWithRouter(ui, { route = '/', ...options } = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          {children}
        </MemoryRouter>
      </AuthProvider>
    ),
    ...options,
  });
}

// Usage in tests:
// import { renderWithRouter } from './test-utils';
// renderWithRouter(<App />, { route: '/dashboard' });`}
      </CodeBlock>

      <h2>Mocking Router Hooks</h2>
      <p>
        For unit-testing a component in isolation, you can mock React Router
        hooks instead of rendering a full router tree.
      </p>

      <CodeBlock language="jsx" title="Mocking useNavigate, useParams, useLocation">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the entire module
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

import { useNavigate, useParams, useLocation } from 'react-router-dom';
import UserProfile from './UserProfile';

test('calls navigate on button click', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  useParams.mockReturnValue({ id: '7' });
  useLocation.mockReturnValue({ pathname: '/users/7' });

  const user = userEvent.setup();
  render(<UserProfile />);

  await user.click(screen.getByText('Go Back'));
  expect(navigate).toHaveBeenCalledWith(-1);
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="Prefer Integration Tests">
        Mocking hooks is brittle — if the component switches from{' '}
        <code>useNavigate</code> to <code>&lt;Link&gt;</code>, your mock breaks
        even though the behavior is the same. Prefer <code>MemoryRouter</code>{' '}
        integration tests and reserve hook mocks for truly isolated unit tests.
      </InfoBox>

      <InteractiveChallenge
        question={"Which router should you use when testing loaders and actions?"}
        options={[
          "BrowserRouter with a test URL",
          "MemoryRouter with initialEntries",
          "createMemoryRouter with RouterProvider",
          "StaticRouter for server-side tests only",
        ]}
        correctIndex={2}
        explanation={"createMemoryRouter supports the full data API — loaders, actions, and errorElement — just like createBrowserRouter. MemoryRouter only supports component rendering and navigation. Use createMemoryRouter + RouterProvider when you need to test data loading or form actions."}
        language="jsx"
      />

      <h2>Quick Reference: Test Pattern Cheat Sheet</h2>
      <CodeBlock language="jsx" title="When to Use Which Testing Pattern">
{`/*
Scenario                        → Pattern
───────────────────────────────────────────────────
Render at specific URL          → MemoryRouter + initialEntries
Click link, check navigation    → MemoryRouter + userEvent.click
Test route params               → MemoryRouter with param in URL
Test loader data                → createMemoryRouter + RouterProvider
Test form actions               → createMemoryRouter + RouterProvider
Test auth redirects             → createMemoryRouter + mock auth
Test error boundaries           → createMemoryRouter + throwing loader
Isolated component test         → jest.mock('react-router-dom')
Reusable across test files      → Custom renderWithRouter utility
*/`}
      </CodeBlock>
    </LessonLayout>
  );
}
