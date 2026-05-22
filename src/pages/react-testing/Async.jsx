import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RTAsync() {
  return (
    <LessonLayout
      title="Async Testing"
      sectionId="react-testing"
      lessonIndex={3}
      prev={{ path: '/react-testing/hooks', label: 'Testing Custom Hooks' }}
      next={{ path: '/react-testing/forms', label: 'Testing Forms' }}
    >
      <h2>Async Testing in React</h2>
      <p>
        Many React components fetch data, show loading states, then display results or errors.
        Testing async behavior requires waiting for DOM updates after promises resolve.
      </p>

      <h2>waitFor and findBy Queries</h2>

      <CodeBlock language="jsx" title="waitFor vs findBy">
{`import { render, screen, waitFor } from '@testing-library/react'

// findBy* — async version of getBy* (uses polling + waitFor internally)
// Best for: asserting that something APPEARS
const heading = await screen.findByRole('heading', { name: /users/i })

// waitFor — poll until assertion stops throwing
// Best for: asserting state changes, multiple conditions, disappearance
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})

// waitFor with multiple assertions (all must pass)
await waitFor(() => {
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  expect(screen.getByRole('list')).toBeInTheDocument()
})

// waitForElementToBeRemoved — waits for element to disappear
await waitForElementToBeRemoved(() => screen.queryByText('Loading...'))

// Default timeout is 1000ms, interval is 50ms
await waitFor(
  () => expect(screen.getByText('Done')).toBeInTheDocument(),
  { timeout: 3000, interval: 100 }
)`}
      </CodeBlock>

      <h2>Mocking fetch with vi.fn()</h2>

      <CodeBlock language="jsx" title="Mocking global fetch">
{`// UserList.jsx
function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p role="alert">Error: {error}</p>
  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  )
}

// UserList.test.jsx
beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.resetAllMocks()
})

test('shows loading then users', async () => {
  global.fetch.mockResolvedValueOnce({
    json: () => Promise.resolve([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]),
  })

  render(<UserList />)

  // Loading state is immediate
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  // Wait for data to load
  await waitForElementToBeRemoved(() => screen.queryByText('Loading...'))

  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByText('Alice')).toBeInTheDocument()
})

test('shows error on fetch failure', async () => {
  global.fetch.mockRejectedValueOnce(new Error('Network error'))

  render(<UserList />)

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Network error')
  })
})`}
      </CodeBlock>

      <h2>Mock Service Worker (MSW)</h2>
      <p>
        MSW intercepts network requests at the service worker level, letting you test with realistic HTTP
        behavior without touching the production fetch code.
      </p>

      <CodeBlock language="bash" title="MSW setup">
{`npm install --save-dev msw

# For Node.js (Vitest / Jest):
# No service worker needed — uses Node.js http interceptor`}
      </CodeBlock>

      <CodeBlock language="jsx" title="MSW handlers and server">
{`// src/mocks/handlers.js
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 3, ...body }, { status: 201 })
  }),

  http.get('/api/users/:id', ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    return HttpResponse.json({ id: params.id, name: 'User ' + params.id })
  }),
]

// src/mocks/server.js
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// src/test/setup.ts
import { server } from '../mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())   // reset overrides between tests
afterAll(() => server.close())`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Using MSW in tests">
{`import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

test('renders user list', async () => {
  render(<UserList />)

  await screen.findByText('Alice')
  expect(screen.getByText('Bob')).toBeInTheDocument()
})

test('handles server error', async () => {
  // Override handler for this test only
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    })
  )

  render(<UserList />)

  await screen.findByRole('alert')
  expect(screen.getByRole('alert')).toHaveTextContent(/error/i)
})

test('handles network error', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.error()  // simulates network failure
    })
  )

  render(<UserList />)
  await screen.findByRole('alert')
})`}
      </CodeBlock>

      <h2>Testing Loading and Success States</h2>

      <CodeBlock language="jsx" title="Three-state component test">
{`// Profile.jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(data => { setUser(data); setStatus('success') })
      .catch(() => setStatus('error'))
  }, [userId])

  if (status === 'loading') return <div aria-busy="true">Loading...</div>
  if (status === 'error') return <div role="alert">Failed to load profile</div>
  return <div><h1>{user.name}</h1><p>{user.email}</p></div>
}

// Profile.test.jsx
test('loading → success flow', async () => {
  render(<Profile userId={1} />)

  // Loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  expect(screen.getByRole('generic', { busy: true })).toBeInTheDocument()

  // Success state (MSW returns data)
  await screen.findByRole('heading', { name: 'Alice' })
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
})`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer MSW Over vi.fn() for fetch">
        <p>
          vi.fn() mocking of fetch is fragile — your test couples to the exact fetch call signature.
          MSW mocks at the network level, letting your component use fetch, axios, or any HTTP library
          while keeping tests realistic and decoupled from implementation.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between findByText() and waitFor(() => getByText())?"
        options={[
          "findByText is for synchronous elements, waitFor is for async",
          "They are equivalent — findByText is syntactic sugar over waitFor + getByText",
          "findByText waits forever, waitFor times out after 1 second",
          "waitFor can only be used with queryBy queries"
        ]}
        correctIndex={1}
        explanation="findByText('...') is exactly equivalent to waitFor(() => getByText('...')). findBy* variants are syntactic sugar that combine waiting with querying. Use findBy* for simpler cases (waiting for a single element to appear) and waitFor() for complex assertions involving multiple elements or conditions."
      />

      <InteractiveChallenge
        question="What does server.resetHandlers() do in an MSW test suite?"
        options={[
          "Shuts down the MSW server between tests",
          "Removes all handlers including the base handlers",
          "Removes only the handlers added with server.use() in individual tests",
          "Resets all request counts to zero"
        ]}
        correctIndex={2}
        explanation="server.resetHandlers() removes only the override handlers added with server.use() during a test — it does NOT affect the base handlers from setupServer(...handlers). This is typically called in afterEach() to restore default behavior between tests. To remove all handlers including base ones, use server.close() or server.restoreHandlers()."
      />
    </LessonLayout>
  );
}
