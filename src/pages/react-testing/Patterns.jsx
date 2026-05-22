import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Patterns() {
  return (
    <LessonLayout
      title="Testing Patterns & CI"
      sectionId="react-testing"
      lessonIndex={5}
      prev={{ path: '/react-testing/forms', label: 'Testing Forms & Routing' }}
      next={null}
    >
      <h2>Custom Render Utility</h2>
      <p>
        Most apps have providers (theme, auth, router, query client). Create a
        custom render that wraps every test automatically so you never forget one.
      </p>

      <CodeBlock language="jsx" title="test-utils.jsx — The All-Providers Wrapper">
{`import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export function renderWithProviders(ui, {
  queryClient = createTestQueryClient(),
  route = '/',
  user = null,
  ...renderOptions
} = {}) {
  window.history.pushState({}, 'Test', route);

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={user}>
          <ThemeProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export everything from RTL
export * from '@testing-library/react';
export { renderWithProviders as render };`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Using Custom Render in Tests">
{`// Import from YOUR test-utils, not @testing-library/react
import { render, screen } from '../test-utils';
import Dashboard from './Dashboard';

test('shows dashboard for authenticated user', () => {
  render(<Dashboard />, {
    user: { id: 1, name: 'Alice', role: 'admin' },
    route: '/dashboard',
  });

  expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  expect(screen.getByText(/alice/i)).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Test Data Factories</h2>
      <p>
        Hardcoded mock data becomes a maintenance nightmare. Build factories that
        generate realistic test data with sensible defaults and easy overrides.
      </p>

      <CodeBlock language="jsx" title="Test Data Factories">
{`// factories.js
let nextId = 1;

export function buildUser(overrides = {}) {
  const id = nextId++;
  return {
    id,
    name: \`User \${id}\`,
    email: \`user\${id}@test.com\`,
    role: 'viewer',
    avatar: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildProduct(overrides = {}) {
  const id = nextId++;
  return {
    id,
    name: \`Product \${id}\`,
    price: parseFloat((Math.random() * 100).toFixed(2)),
    category: 'general',
    inStock: true,
    ...overrides,
  };
}

// Usage in tests
import { buildUser, buildProduct } from '../factories';

const admin = buildUser({ role: 'admin', name: 'Alice' });
const expensiveItem = buildProduct({ price: 999.99, name: 'Premium Widget' });
const outOfStock = buildProduct({ inStock: false });`}
      </CodeBlock>

      <InfoBox variant="tip" title="Factory Benefits">
        Factories make tests self-documenting. When you see
        <code>buildUser({"{ role: 'admin' }"})</code>, the override tells you exactly
        what matters for this test. Everything else is just realistic filler data.
      </InfoBox>

      <h2>Page Object Pattern</h2>
      <p>
        For complex components with many interactions, encapsulate queries and
        actions in a page object. This DRYs up your tests and makes them read
        like user stories.
      </p>

      <CodeBlock language="jsx" title="Page Object for DataGrid">
{`// DataGrid.page.js
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export class DataGridPage {
  user = userEvent.setup();

  get table() {
    return screen.getByRole('table');
  }

  get rows() {
    return within(this.table).getAllByRole('row').slice(1); // skip header
  }

  get headerCells() {
    return within(this.table).getAllByRole('columnheader');
  }

  getCell(rowIndex, colIndex) {
    const row = this.rows[rowIndex];
    return within(row).getAllByRole('cell')[colIndex];
  }

  async sortBy(columnName) {
    const header = screen.getByRole('columnheader', { name: new RegExp(columnName, 'i') });
    await this.user.click(header);
  }

  async search(query) {
    await this.user.type(screen.getByRole('searchbox'), query);
  }

  async selectRow(index) {
    const checkbox = within(this.rows[index]).getByRole('checkbox');
    await this.user.click(checkbox);
  }

  async deleteSelected() {
    await this.user.click(screen.getByRole('button', { name: /delete/i }));
  }
}

// DataGrid.test.jsx
import { render } from '../test-utils';
import DataGrid from './DataGrid';
import { DataGridPage } from './DataGrid.page';

test('sorts rows by name', async () => {
  render(<DataGrid data={testData} />);
  const page = new DataGridPage();

  await page.sortBy('name');
  expect(page.getCell(0, 0)).toHaveTextContent('Alice');
});

test('deletes selected rows', async () => {
  render(<DataGrid data={testData} />);
  const page = new DataGridPage();

  await page.selectRow(0);
  await page.selectRow(2);
  await page.deleteSelected();

  expect(page.rows).toHaveLength(testData.length - 2);
});`}
      </CodeBlock>

      <h2>Testing Error Boundaries</h2>

      <CodeBlock language="jsx" title="Error Boundary Test">
{`import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Component that throws
const ThrowingComponent = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('Boom!');
  return <div>All good</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;
  beforeAll(() => { console.error = jest.fn(); });
  afterAll(() => { console.error = originalError; });

  test('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  test('renders fallback UI on error', () => {
    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('All good')).not.toBeInTheDocument();
  });

  test('calls onError callback', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError} fallback={<div>Error</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Boom!' }),
      expect.any(Object) // errorInfo
    );
  });
});`}
      </CodeBlock>

      <h2>Testing Portals and Modals</h2>

      <CodeBlock language="jsx" title="Modal/Portal Test">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

// Ensure portal root exists
beforeEach(() => {
  const portalRoot = document.createElement('div');
  portalRoot.setAttribute('id', 'modal-root');
  document.body.appendChild(portalRoot);
});

afterEach(() => {
  document.getElementById('modal-root')?.remove();
});

describe('Modal', () => {
  test('renders content in portal', () => {
    render(<Modal isOpen={true}><p>Modal content</p></Modal>);

    // Content is in the DOM even though it's in a portal
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<Modal isOpen={false}><p>Hidden</p></Modal>);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  test('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose}><p>Content</p></Modal>);

    await user.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  test('closes on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose}><p>Content</p></Modal>);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});`}
      </CodeBlock>

      <h2>Accessibility Testing with jest-axe</h2>

      <CodeBlock language="jsx" title="Automated a11y Checks">
{`import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LoginForm from './LoginForm';
import Navigation from './Navigation';

expect.extend(toHaveNoViolations);

test('LoginForm has no accessibility violations', async () => {
  const { container } = render(<LoginForm onSubmit={jest.fn()} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('Navigation has no accessibility violations', async () => {
  const { container } = render(<Navigation items={navItems} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});`}
      </CodeBlock>

      <InfoBox variant="info" title="jest-axe Catches Common Issues">
        jest-axe checks for missing alt text, bad color contrast, missing form labels,
        incorrect ARIA attributes, and more. It won't catch everything (keyboard navigation
        needs manual testing), but it's a great automated baseline.
      </InfoBox>

      <h2>Code Coverage Configuration</h2>

      <CodeBlock language="jsx" title="jest.config.js — Coverage Settings">
{`// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.{js,tsx}',
    '!src/reportWebVitals.js',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/mocks/**',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'clover'],
};

// Run: npx jest --coverage`}
      </CodeBlock>

      <h2>CI Pipeline for Tests</h2>

      <CodeBlock language="jsx" title=".github/workflows/test.yml">
{`name: Test Suite
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Run Tests with Coverage
        run: npx jest --coverage --ci --maxWorkers=2

      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/lcov-report/

      - name: Check Coverage Thresholds
        run: npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'`}
      </CodeBlock>

      <h2>Test File Organization</h2>

      <FlowChart
        title="Recommended File Structure"
        chart={"graph TD\n  S[src/] --> C[components/]\n  S --> H[hooks/]\n  S --> P[pages/]\n  S --> M[mocks/]\n  S --> TU[test-utils.jsx]\n  S --> F[factories.js]\n  C --> CF[Button/]\n  CF --> CFI[Button.jsx]\n  CF --> CFT[Button.test.jsx]\n  M --> MH[handlers/]\n  M --> MS[server.js]"}
      />

      <CodeBlock language="jsx" title="Naming Conventions">
{`// Co-locate tests with source files
src/
  components/
    Button/
      Button.jsx
      Button.test.jsx        // Unit tests
      Button.stories.jsx     // Storybook (optional)
    DataGrid/
      DataGrid.jsx
      DataGrid.test.jsx
      DataGrid.page.js       // Page object (complex components)
  hooks/
    useAuth.js
    useAuth.test.js
  pages/
    Dashboard.jsx
    Dashboard.test.jsx
  mocks/
    handlers/
      users.js
      products.js
      index.js
    server.js
  test-utils.jsx              // Custom render
  factories.js                // Test data builders`}
      </CodeBlock>

      <h2>When to Mock vs Use Real Implementations</h2>

      <table>
        <thead>
          <tr>
            <th>Mock It</th>
            <th>Use Real</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Network requests (use MSW)</td>
            <td>React state and hooks</td>
          </tr>
          <tr>
            <td>Timers (jest.useFakeTimers)</td>
            <td>Context providers (wrap in test)</td>
          </tr>
          <tr>
            <td>Random/Date values</td>
            <td>React Router (use MemoryRouter)</td>
          </tr>
          <tr>
            <td>Browser APIs (localStorage, IntersectionObserver)</td>
            <td>Child components (test integration)</td>
          </tr>
          <tr>
            <td>Heavy third-party libs (chart libraries)</td>
            <td>Form libraries (React Hook Form)</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"Which of these is a test smell (anti-pattern) you should avoid?"}
        options={[
          "Using getByRole to query elements",
          "Testing the component after a user clicks a button",
          "Checking internal component state with wrapper.state()",
          "Using a custom render that includes providers"
        ]}
        correctIndex={2}
        explanation={"Accessing internal component state (wrapper.state()) is an implementation detail. RTL doesn't even support it. Test what the user sees and interacts with, not internal state variables."}
        language="jsx"
      />

      <h2>Test Smell Anti-Patterns</h2>

      <CodeBlock language="jsx" title="Anti-Patterns to Avoid">
{`// BAD: Testing implementation details
test('sets isOpen state to true', () => {
  // Don't check internal state — check what the USER sees
  expect(component.state.isOpen).toBe(true); // WRONG
});

// BAD: Snapshot everything
test('renders correctly', () => {
  const { container } = render(<Dashboard />);
  expect(container).toMatchSnapshot(); // Too broad — any change breaks it
});

// BAD: Testing library internals
test('calls useEffect', () => {
  const spy = jest.spyOn(React, 'useEffect'); // Don't spy on React
});

// BAD: Overly specific queries
screen.getByTestId('submit-btn'); // Use getByRole('button', { name: /submit/i })

// BAD: Testing styles directly
expect(element).toHaveStyle({ color: '#3b82f6' }); // Fragile — test behavior not pixels

// GOOD: Test user-observable behavior
test('shows success message after form submission', async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.type(screen.getByLabelText(/email/i), 'a@b.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByText(/success/i)).toBeInTheDocument();
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Golden Rule of Test Smells">
        If your test breaks when you refactor without changing behavior, it's
        testing implementation details. Rewrite it to test what the user sees.
        A good test survives refactoring from class to functional components,
        from useState to useReducer, and from fetch to axios.
      </InfoBox>

      <h2>Complete Test Suite Structure</h2>

      <CodeBlock language="jsx" title="Full Feature Test Suite — UserManagement">
{`// UserManagement.test.jsx
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { buildUser } from '../factories';
import UserManagement from './UserManagement';

const users = [
  buildUser({ name: 'Alice', role: 'admin' }),
  buildUser({ name: 'Bob', role: 'viewer' }),
  buildUser({ name: 'Charlie', role: 'editor' }),
];

beforeEach(() => {
  server.use(
    http.get('/api/users', () => HttpResponse.json(users)),
    http.delete('/api/users/:id', () => new HttpResponse(null, { status: 204 }))
  );
});

describe('UserManagement', () => {
  describe('rendering', () => {
    test('shows loading state', () => {
      render(<UserManagement />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('renders user list', async () => {
      render(<UserManagement />);
      expect(await screen.findByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    test('filters by search query', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      await screen.findByText('Alice');

      await user.type(screen.getByRole('searchbox'), 'ali');
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    test('filters by role', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      await screen.findByText('Alice');

      await user.selectOptions(
        screen.getByRole('combobox', { name: /role/i }),
        'admin'
      );
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });
  });

  describe('deletion', () => {
    test('removes user after confirmation', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);
      await screen.findByText('Bob');

      // Click delete on Bob's row
      const bobRow = screen.getByText('Bob').closest('tr');
      await user.click(
        within(bobRow).getByRole('button', { name: /delete/i })
      );

      // Confirm dialog
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    test('shows error when fetch fails', async () => {
      server.use(
        http.get('/api/users', () =>
          HttpResponse.json({ error: 'Server down' }, { status: 500 })
        )
      );

      render(<UserManagement />);
      expect(await screen.findByRole('alert')).toHaveTextContent(/server down/i);
    });
  });
});`}
      </CodeBlock>

      <InfoBox variant="success" title="You Made It!">
        You now have a complete toolkit for testing React applications: RTL
        fundamentals, component testing, hook testing, async patterns, forms,
        routing, and production-ready patterns. The key takeaway: always test
        behavior, never implementation.
      </InfoBox>
    </LessonLayout>
  );
}
