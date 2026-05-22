import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RRTesting() {
  return (
    <LessonLayout
      title="Testing Routes"
      sectionId="react-router"
      lessonIndex={5}
      prev={{ path: '/react-router/advanced', label: 'Advanced Routing' }}
      next={{ path: '/react-router/fullapp', label: 'Full Application Example' }}
    >
      <h2>Why Route Testing Is Different</h2>
      <p>
        Components that use React Router hooks (<code>useParams</code>, <code>useNavigate</code>,
        <code>useLocation</code>) must be rendered inside a router context. Tests also need to
        control the initial URL, verify navigation happened, and test loaders and actions.
        React Router provides dedicated test utilities for all of these scenarios.
      </p>

      <FlowChart
        title="Testing Router Scenarios"
        chart={"graph TD\n  A[Test type] --> B[Component uses hooks]\n  A --> C[Has loaders or actions]\n  A --> D[Tests navigation]\n  B --> E[MemoryRouter wrapper]\n  C --> F[createMemoryRouter]\n  D --> G[Assert URL changed]"}
      />

      <CodeBlock language="jsx" title="renderWithRouter — Test Helper">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Helper: render a component inside a MemoryRouter at any path
function renderWithRouter(ui, { path = '/', route = '/', routes = [] } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
        {routes.map(r => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
    </MemoryRouter>
  );
}

// ── SIMPLE: component using useParams ────────────────────────────
function UserProfile() {
  const { userId } = useParams();
  return <h1>Profile for user {userId}</h1>;
}

test('renders user ID from URL', () => {
  renderWithRouter(<UserProfile />, {
    path: '/users/:userId',
    route: '/users/42',
  });
  expect(screen.getByRole('heading')).toHaveTextContent('Profile for user 42');
});

// ── LOCATION STATE ────────────────────────────────────────────────
function BackLink() {
  const location = useLocation();
  const from = location.state?.from ?? '/';
  return <a href={from}>← Back</a>;
}

test('renders correct back link from location state', () => {
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/product/1', state: { from: '/search?q=react' } }]}
    >
      <Routes>
        <Route path="/product/:id" element={<BackLink />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute(
    'href',
    '/search?q=react'
  );
});`}
      </CodeBlock>

      <h2>Testing Navigation</h2>

      <CodeBlock language="jsx" title="Asserting Navigation Happens">
{`import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Test that clicking causes navigation
test('clicking product navigates to detail page', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={['/products']}>
      <Routes>
        <Route path="/products"     element={<ProductList />} />
        <Route path="/products/:id" element={<div>Product Detail</div>} />
      </Routes>
    </MemoryRouter>
  );

  // Assert we start at the list
  expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument();

  // Click the first product link
  await user.click(screen.getByRole('link', { name: 'View Widget' }));

  // Assert navigation happened (new page content visible)
  await waitFor(() => {
    expect(screen.getByText('Product Detail')).toBeInTheDocument();
  });
});

// Test programmatic navigation with useNavigate
function LoginForm({ onLogin }) {
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogin();
    navigate('/dashboard');
  };
  return <form onSubmit={handleSubmit}><button type="submit">Login</button></form>;
}

test('navigates to dashboard after login', async () => {
  const user = userEvent.setup();
  const mockLogin = vi.fn().mockResolvedValue(true);

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login"     element={<LoginForm onLogin={mockLogin} />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );

  await user.click(screen.getByRole('button', { name: 'Login' }));

  await waitFor(() => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <h2>Testing Loaders and Actions</h2>

      <CodeBlock language="jsx" title="createMemoryRouter for Data Router Tests">
{`import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// createMemoryRouter supports loaders, actions, and errorElement
// Use it when your component depends on useLoaderData() or useActionData()

// ── TEST A LOADER ─────────────────────────────────────────────────
test('renders product from loader data', async () => {
  const mockProduct = { id: '42', name: 'Test Book', price: 29.99, inStock: true };

  const router = createMemoryRouter([
    {
      path: '/products/:id',
      element: <ProductDetail />,
      // Inject test data directly — no real API call
      loader: () => mockProduct,
    },
  ], {
    initialEntries: ['/products/42'],
  });

  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Test Book' })).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
  });
});

// ── TEST AN ACTION ────────────────────────────────────────────────
test('submitting form calls action and redirects', async () => {
  const user = userEvent.setup();
  const mockCreate = vi.fn().mockResolvedValue({ id: 'NEW-1' });

  const router = createMemoryRouter([
    {
      path: '/products/new',
      element: <NewProductForm />,
      action: async ({ request }) => {
        const data = Object.fromEntries(await request.formData());
        return mockCreate(data);
      },
    },
    {
      path: '/products/NEW-1',
      element: <div>Product created!</div>,
    },
  ], {
    initialEntries: ['/products/new'],
  });

  render(<RouterProvider router={router} />);

  await user.type(screen.getByLabelText('Product name'), 'My New Widget');
  await user.type(screen.getByLabelText('Price'), '39.99');
  await user.click(screen.getByRole('button', { name: 'Create product' }));

  await waitFor(() => {
    expect(screen.getByText('Product created!')).toBeInTheDocument();
  });
  expect(mockCreate).toHaveBeenCalledWith({
    name: 'My New Widget',
    price: '39.99',
  });
});

// ── TEST ERROR STATES ─────────────────────────────────────────────
test('shows 404 when product not found', async () => {
  const router = createMemoryRouter([
    {
      path: '/products/:id',
      element: <ProductDetail />,
      errorElement: <div>Product not found</div>,
      loader: () => {
        throw new Response('Not Found', { status: 404 });
      },
    },
  ], {
    initialEntries: ['/products/999'],
  });

  render(<RouterProvider router={router} />);

  await waitFor(() => {
    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <h2>Testing Search Params</h2>

      <CodeBlock language="jsx" title="Testing useSearchParams">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  return (
    <div>
      <input
        value={query}
        onChange={e => setSearchParams({ q: e.target.value })}
        placeholder="Search..."
        aria-label="Search"
      />
      <p>Results for: {query}</p>
    </div>
  );
}

// Test with initial search params in the URL
test('reads initial search params from URL', () => {
  render(
    <MemoryRouter initialEntries={['/search?q=react+hooks']}>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByLabelText('Search')).toHaveValue('react hooks');
  expect(screen.getByText('Results for: react hooks')).toBeInTheDocument();
});

test('updates URL when user types', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/search']}>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </MemoryRouter>
  );

  await user.type(screen.getByLabelText('Search'), 'typescript');
  expect(screen.getByText('Results for: typescript')).toBeInTheDocument();
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="MemoryRouter vs createMemoryRouter">
        <p>
          Use <code>MemoryRouter</code> for components that use URL hooks but do NOT use
          loaders/actions — it is simpler and pairs naturally with <code>{'<Routes><Route/></Routes>'}</code>.
          Use <code>createMemoryRouter</code> with <code>{'<RouterProvider>'}</code> when your route
          has a <code>loader</code>, <code>action</code>, or <code>errorElement</code> — these
          only work with the data router API. Mixing them (MemoryRouter with loader routes) silently
          ignores the loader.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Why use MemoryRouter instead of BrowserRouter in unit tests?"
        options={[
          "MemoryRouter renders significantly faster than BrowserRouter",
          "MemoryRouter keeps history in memory — no real browser URL bar needed, making tests hermetic and runnable in Node.js/jsdom",
          "BrowserRouter does not work with React Testing Library at all",
          "MemoryRouter automatically cleans up after each test"
        ]}
        correctIndex={1}
        explanation="BrowserRouter relies on the browser's History API and actual URL bar, which do not exist in Node.js/jsdom (the test environment). MemoryRouter stores routing state in an in-memory array. You can set initialEntries to start at any URL, including routes with params and search params. Each test starts with a fresh memory history, so tests are independent and portable."
      />

      <InteractiveChallenge
        question="When should you use createMemoryRouter instead of MemoryRouter in tests?"
        options={[
          "Always — createMemoryRouter is the modern API for all tests",
          "When the route has a loader, action, or errorElement that needs to be tested",
          "When you need to test multiple routes in a single test",
          "createMemoryRouter is only needed for TypeScript projects"
        ]}
        correctIndex={1}
        explanation="Loaders, actions, and errorElement only work with the data router API (createBrowserRouter/createMemoryRouter + RouterProvider). If you wrap a route with a loader in MemoryRouter, the loader silently does not run. Use createMemoryRouter when you need to test that a loader fetches data correctly, that an action processes a form submission, or that errors from loaders trigger the errorElement."
      />
    </LessonLayout>
  );
}
