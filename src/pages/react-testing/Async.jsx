import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Async() {
  return (
    <LessonLayout
      title="Testing Async & APIs"
      sectionId="react-testing"
      lessonIndex={3}
      prev={{ path: '/react-testing/hooks', label: 'Testing Custom Hooks' }}
      next={{ path: '/react-testing/forms', label: 'Testing Forms & Routing' }}
    >
      <h2>Async Testing Fundamentals</h2>
      <p>
        Most real components fetch data, wait for timers, or respond to async events.
        RTL provides <code>findBy</code> queries and <code>waitFor</code> to handle
        these patterns without flaky timeouts or manual delays.
      </p>

      <FlowChart
        title="Async Component Test Flow"
        chart={"graph TD\n  R[Render component] --> L[Assert loading state]\n  L --> W[await findBy or waitFor]\n  W --> S{Success?}\n  S -->|Yes| D[Assert data rendered]\n  S -->|No| E[Assert error state]"}
      />

      <CodeBlock language="jsx" title="findBy vs waitFor">
{`import { render, screen, waitFor } from '@testing-library/react';
import UserList from './UserList';

// findBy — waits for an element to appear (preferred)
test('shows users after loading', async () => {
  render(<UserList />);
  const heading = await screen.findByRole('heading', { name: /users/i });
  expect(heading).toBeInTheDocument();
});

// waitFor — waits for an assertion to pass (when findBy isn't enough)
test('shows correct user count', async () => {
  render(<UserList />);
  await waitFor(() => {
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer findBy Over waitFor">
        <code>findBy</code> is syntactic sugar for <code>waitFor + getBy</code>.
        Use it when waiting for a single element. Use <code>waitFor</code> when
        you need to assert on multiple conditions or non-element checks.
      </InfoBox>

      <h2>Testing Loading → Success → Error</h2>

      <CodeBlock language="jsx" title="Full Async Lifecycle Test">
{`import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile';

// Mock the API module
jest.mock('./api', () => ({
  fetchUser: jest.fn(),
}));

import { fetchUser } from './api';

describe('UserProfile async states', () => {
  test('shows loading, then user data on success', async () => {
    fetchUser.mockResolvedValueOnce({ name: 'Alice', email: 'alice@test.com' });

    render(<UserProfile userId={1} />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();

    // Loading gone
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  test('shows error message on failure', async () => {
    fetchUser.mockRejectedValueOnce(new Error('Network error'));

    render(<UserProfile userId={1} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <h2>MSW (Mock Service Worker)</h2>
      <p>
        MSW intercepts network requests at the service worker level. Your
        component code stays untouched — no mocking fetch or axios. This is the
        gold standard for testing API interactions.
      </p>

      <CodeBlock language="jsx" title="MSW Setup">
{`// mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ id: Number(id), name: 'Alice' });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),

  http.delete('/api/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];`}
      </CodeBlock>

      <CodeBlock language="jsx" title="MSW Server Configuration">
{`// mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// setupTests.js
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());`}
      </CodeBlock>

      <InfoBox variant="info" title="onUnhandledRequest: 'error'">
        Setting this to <code>'error'</code> makes your test fail if a request
        goes out that no handler matches. This catches missing mocks early and
        prevents tests from accidentally hitting real APIs.
      </InfoBox>

      <CodeBlock language="jsx" title="Test with MSW">
{`import { render, screen } from '@testing-library/react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import UserList from './UserList';

test('renders users from API', async () => {
  render(<UserList />);

  expect(await screen.findByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('Bob')).toBeInTheDocument();
});

test('handles server error', async () => {
  // Override handler for this single test
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    })
  );

  render(<UserList />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /something went wrong/i
  );
});`}
      </CodeBlock>

      <h2>Mocking fetch Directly</h2>
      <p>
        When MSW is overkill (simple unit tests), you can mock fetch or axios directly.
      </p>

      <CodeBlock language="jsx" title="Mocking Global fetch">
{`beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('fetches and displays data', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [{ id: 1, name: 'Alice' }],
  });

  render(<UserList />);
  expect(await screen.findByText('Alice')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('/api/users');
});

test('handles fetch failure', async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

  render(<UserList />);
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Components That Fetch on Mount</h2>

      <CodeBlock language="jsx" title="Data Table Fetching Pattern">
{`import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';

// Using MSW handlers already defined for /api/products

describe('DataTable', () => {
  test('shows loading skeleton initially', () => {
    render(<DataTable endpoint="/api/products" />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  test('renders table rows after fetch', async () => {
    render(<DataTable endpoint="/api/products" />);

    const rows = await screen.findAllByRole('row');
    // +1 for header row
    expect(rows).toHaveLength(4); // 3 products + header
  });

  test('sorts by column when header is clicked', async () => {
    const user = userEvent.setup();
    render(<DataTable endpoint="/api/products" />);

    await screen.findByText('Widget A'); // Wait for data

    await user.click(screen.getByRole('columnheader', { name: /price/i }));

    const cells = screen.getAllByRole('cell');
    const prices = cells
      .filter((_, i) => i % 3 === 1) // price is 2nd column
      .map(c => c.textContent);

    // Verify sorted ascending
    expect(prices).toEqual([...prices].sort());
  });
});`}
      </CodeBlock>

      <h2>Testing Pagination</h2>

      <CodeBlock language="jsx" title="Paginated Data Fetching">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import PaginatedList from './PaginatedList';

const page1 = { items: [{ id: 1, name: 'Item 1' }], totalPages: 3, page: 1 };
const page2 = { items: [{ id: 2, name: 'Item 2' }], totalPages: 3, page: 2 };

beforeEach(() => {
  server.use(
    http.get('/api/items', ({ request }) => {
      const url = new URL(request.url);
      const page = url.searchParams.get('page');
      return HttpResponse.json(page === '2' ? page2 : page1);
    })
  );
});

test('navigates between pages', async () => {
  const user = userEvent.setup();
  render(<PaginatedList />);

  // Page 1
  expect(await screen.findByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

  // Go to page 2
  await user.click(screen.getByRole('button', { name: /next/i }));

  expect(await screen.findByText('Item 2')).toBeInTheDocument();
  expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Error Retry</h2>

      <CodeBlock language="jsx" title="Retry After Failure">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import UserProfile from './UserProfile';

test('retries fetch when retry button is clicked', async () => {
  const user = userEvent.setup();

  // First request fails
  server.use(
    http.get('/api/users/1', () => {
      return HttpResponse.json({ error: 'timeout' }, { status: 504 });
    })
  );

  render(<UserProfile userId={1} />);
  expect(await screen.findByRole('alert')).toBeInTheDocument();

  // Override to succeed on retry
  server.use(
    http.get('/api/users/1', () => {
      return HttpResponse.json({ id: 1, name: 'Alice' });
    })
  );

  await user.click(screen.getByRole('button', { name: /retry/i }));

  expect(await screen.findByText('Alice')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Jest Fake Timers for Debounce</h2>

      <CodeBlock language="jsx" title="Testing Debounced Search Input">
{`import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInput from './SearchInput';

describe('SearchInput with debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('debounces search callback', async () => {
    const onSearch = jest.fn();
    // advanceTimers tells user-event to advance fake timers
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<SearchInput onSearch={onSearch} debounceMs={300} />);

    await user.type(screen.getByRole('searchbox'), 'react');

    // Not called yet — still within debounce window
    expect(onSearch).not.toHaveBeenCalled();

    // Advance past debounce
    act(() => jest.advanceTimersByTime(300));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('react');
  });

  test('resets debounce on continued typing', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<SearchInput onSearch={onSearch} debounceMs={300} />);

    await user.type(screen.getByRole('searchbox'), 'rea');
    act(() => jest.advanceTimersByTime(200));
    await user.type(screen.getByRole('searchbox'), 'ct');
    act(() => jest.advanceTimersByTime(300));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('react');
  });
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="user-event and Fake Timers">
        When combining <code>userEvent.setup()</code> with <code>jest.useFakeTimers()</code>,
        pass <code>{"{ advanceTimers: jest.advanceTimersByTime }"}</code> to the setup options.
        Otherwise user-event's internal delays will hang because the fake timer
        never advances.
      </InfoBox>

      <InteractiveChallenge
        question={"What's the recommended way to mock API calls in React Testing Library tests?"}
        options={[
          "jest.mock() the fetch function in every test",
          "Use MSW to intercept requests at the network level",
          "Mock the component's props to skip the fetch entirely",
          "Use jest.spyOn(window, 'fetch')"
        ]}
        correctIndex={1}
        explanation={"MSW intercepts at the network layer, keeping your component code untouched. It tests the real fetch/axios calls your component makes, providing the highest confidence that your integration works correctly."}
        language="jsx"
      />

      <h2>MSW Handler Organization</h2>

      <CodeBlock language="jsx" title="Organizing Handlers by Feature">
{`// mocks/handlers/users.js
import { http, HttpResponse } from 'msw';

export const userHandlers = [
  http.get('/api/users', () =>
    HttpResponse.json([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])
  ),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),
];

// mocks/handlers/products.js
import { http, HttpResponse } from 'msw';

export const productHandlers = [
  http.get('/api/products', () =>
    HttpResponse.json([{ id: 1, name: 'Widget', price: 9.99 }])
  ),
];

// mocks/handlers/index.js
import { userHandlers } from './users';
import { productHandlers } from './products';

export const handlers = [...userHandlers, ...productHandlers];

// mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);`}
      </CodeBlock>

      <h2>Testing Optimistic Updates</h2>

      <CodeBlock language="jsx" title="Optimistic UI Test">
{`import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import TodoApp from './TodoApp';

test('optimistically adds todo then confirms', async () => {
  const user = userEvent.setup();
  server.use(
    http.post('/api/todos', async ({ request }) => {
      const body = await request.json();
      // Simulate slow server
      await new Promise(r => setTimeout(r, 200));
      return HttpResponse.json({ id: 99, ...body });
    })
  );

  render(<TodoApp />);
  await screen.findByRole('list'); // Wait for initial load

  await user.type(screen.getByLabelText(/new todo/i), 'Test optimistic');
  await user.click(screen.getByRole('button', { name: /add/i }));

  // Immediately visible (optimistic)
  expect(screen.getByText('Test optimistic')).toBeInTheDocument();

  // After server confirms, still there and no error
  await waitFor(() => {
    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
  });
  expect(screen.getByText('Test optimistic')).toBeInTheDocument();
});

test('reverts optimistic update on server error', async () => {
  const user = userEvent.setup();
  server.use(
    http.post('/api/todos', () => {
      return HttpResponse.json({ error: 'fail' }, { status: 500 });
    })
  );

  render(<TodoApp />);
  await screen.findByRole('list');

  await user.type(screen.getByLabelText(/new todo/i), 'Will fail');
  await user.click(screen.getByRole('button', { name: /add/i }));

  // Reverted after server error
  await waitFor(() => {
    expect(screen.queryByText('Will fail')).not.toBeInTheDocument();
  });
  expect(screen.getByRole('alert')).toHaveTextContent(/failed/i);
});`}
      </CodeBlock>

      <InfoBox variant="note" title="Async Test Timeout">
        By default, <code>findBy</code> and <code>waitFor</code> time out after
        1000ms. Override with <code>{"{ timeout: 3000 }"}</code> if your test needs
        more time. But if you regularly need long timeouts, your mock setup might be
        the problem.
      </InfoBox>
    </LessonLayout>
  );
}
