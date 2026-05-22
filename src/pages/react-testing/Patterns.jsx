import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RTPatterns() {
  return (
    <LessonLayout
      title="Testing Patterns"
      sectionId="react-testing"
      lessonIndex={5}
      prev={{ path: '/react-testing/forms', label: 'Testing Forms' }}
      next={null}
    >
      <h2>Custom Render Function</h2>
      <p>
        A custom render helper wraps your component in all the providers it needs (Router, Store, Theme, etc.)
        so every test gets a realistic environment without boilerplate.
      </p>

      <CodeBlock language="jsx" title="Custom render with all providers">
{`// src/test/utils.jsx
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider } from './ThemeContext'
import { createStore } from '../store'

function AllProviders({ children, initialState }) {
  const store = createStore(initialState)
  return (
    <BrowserRouter>
      <Provider store={store}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </Provider>
    </BrowserRouter>
  )
}

function customRender(ui, { initialState = {}, ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return <AllProviders initialState={initialState}>{children}</AllProviders>
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Usage in tests:
import { render, screen } from '../test/utils'  // NOT from @testing-library/react

test('ProfilePage shows username', async () => {
  render(<ProfilePage />, {
    initialState: { auth: { user: { name: 'Alice' } } }
  })
  expect(await screen.findByText('Alice')).toBeInTheDocument()
})`}
      </CodeBlock>

      <h2>Testing with Mock Timers</h2>

      <CodeBlock language="jsx" title="Fake timers for debounce and timeouts">
{`// Debounce component
function SearchInput({ onSearch }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 500)
    return () => clearTimeout(timer)
  }, [query, onSearch])

  return <input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search" />
}

// Test with fake timers
test('debounces search calls', async () => {
  vi.useFakeTimers()
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  const onSearch = vi.fn()

  render(<SearchInput onSearch={onSearch} />)

  await user.type(screen.getByLabelText('Search'), 'hello')

  // Not called yet — debounce pending
  expect(onSearch).not.toHaveBeenCalled()

  // Advance timers past debounce window
  act(() => { vi.advanceTimersByTime(500) })

  expect(onSearch).toHaveBeenCalledWith('hello')
  expect(onSearch).toHaveBeenCalledTimes(1)  // not once per keystroke

  vi.useRealTimers()
})`}
      </CodeBlock>

      <h2>Testing Router Navigation</h2>

      <CodeBlock language="jsx" title="Testing with MemoryRouter">
{`import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Nav component with links
function Nav() {
  return (
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
    </nav>
  )
}

// Page components
const Home = () => <h1>Home Page</h1>
const About = () => <h1>About Page</h1>

test('navigates to about page', async () => {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/home']}>
      <Nav />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </MemoryRouter>
  )

  expect(screen.getByRole('heading', { name: 'Home Page' })).toBeInTheDocument()

  await user.click(screen.getByRole('link', { name: 'About' }))

  expect(screen.getByRole('heading', { name: 'About Page' })).toBeInTheDocument()
})

// Test current route
test('highlights active nav item', () => {
  render(
    <MemoryRouter initialEntries={['/about']}>
      <NavWithActive />
    </MemoryRouter>
  )
  expect(screen.getByRole('link', { name: 'About' })).toHaveClass('active')
})`}
      </CodeBlock>

      <h2>Organizing Tests</h2>

      <CodeBlock language="jsx" title="describe blocks and test grouping">
{`// Prefer colocation — put test files next to source files
// src/components/Button/
//   Button.jsx
//   Button.test.jsx     <- colocated
//   Button.module.css

// Or in __tests__ subdirectory
// src/components/__tests__/Button.test.jsx

// Group related tests with describe
describe('Button', () => {
  describe('rendering', () => {
    test('renders with label', () => { /* ... */ })
    test('renders disabled state', () => { /* ... */ })
  })

  describe('interaction', () => {
    test('calls onClick on click', async () => { /* ... */ })
    test('does not call onClick when disabled', async () => { /* ... */ })
  })
})

// Shared setup with beforeEach
describe('UserProfile', () => {
  let user
  beforeEach(() => {
    user = userEvent.setup()
  })

  test('...', async () => { await user.click(/* ... */) })
})`}
      </CodeBlock>

      <h2>Coverage Configuration</h2>

      <CodeBlock language="typescript" title="vitest.config.ts with coverage">
{`import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',               // or 'istanbul'
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})`}
      </CodeBlock>

      <CodeBlock language="bash" title="Running tests">
{`# Run all tests
npx vitest

# Run with coverage
npx vitest --coverage

# Run in watch mode (dev)
npx vitest --watch

# Run specific file
npx vitest src/components/Button.test.jsx

# Run tests matching pattern
npx vitest -t "submits form"

# Update snapshots
npx vitest --update-snapshots`}
      </CodeBlock>

      <h2>CI/CD Test Configuration</h2>

      <CodeBlock language="yaml" title=".github/workflows/test.yml">
{`name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --run --coverage
      - uses: codecov/codecov-action@v4
        with:
          file: coverage/lcov.info`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Testing Trophy">
        <p>
          Kent C. Dodds advocates the Testing Trophy over the Testing Pyramid for frontend:
          a small base of static analysis (TypeScript + ESLint), a medium layer of integration tests (RTL),
          a small layer of unit tests (pure functions), and a small top layer of E2E tests.
          RTL integration tests give the highest ROI for React apps.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the main benefit of creating a custom render function in your test utilities?"
        options={[
          "It makes tests run faster by skipping provider initialization",
          "It reduces boilerplate and ensures every test gets the full provider context",
          "It prevents tests from sharing state between runs",
          "It automatically mocks all context values"
        ]}
        correctIndex={1}
        explanation="A custom render helper ensures every test component renders inside all the providers it needs (Router, Redux store, Theme, etc.) without repeating that setup in every test. It also allows you to pass initial state or configuration to set up specific scenarios, making tests cleaner and more maintainable."
      />

      <InteractiveChallenge
        question="When should you use vi.useFakeTimers() in a test?"
        options={[
          "Always — fake timers make all tests deterministic",
          "When testing components that use setTimeout, setInterval, or debounce",
          "When testing async data fetching",
          "When you want to speed up slow tests"
        ]}
        correctIndex={1}
        explanation="Fake timers are specifically useful for components that use time-based mechanisms: setTimeout, setInterval, debounce, or animation delays. They let you control time programmatically (vi.advanceTimersByTime(500)) instead of actually waiting. For async data fetching (fetch, API calls), use waitFor or MSW instead."
      />
    </LessonLayout>
  );
}
