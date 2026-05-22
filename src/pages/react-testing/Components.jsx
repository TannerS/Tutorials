import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RTComponents() {
  return (
    <LessonLayout
      title="Testing Components"
      sectionId="react-testing"
      lessonIndex={1}
      prev={{ path: '/react-testing/intro', label: 'RTL & Testing Philosophy' }}
      next={{ path: '/react-testing/hooks', label: 'Testing Custom Hooks' }}
    >
      <h2>Testing Component Props and Rendering</h2>
      <p>
        Testing components means verifying that they render the right output for given props and
        respond correctly to user interactions. Focus on behavior visible to the user, not implementation details.
      </p>

      <CodeBlock language="jsx" title="Basic component test">
{`// Button.jsx
function Button({ label, onClick, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}

// Button.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

test('renders label text', () => {
  render(<Button label="Submit" onClick={() => {}} />)
  expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
})

test('calls onClick when clicked', async () => {
  const user = userEvent.setup()
  const handleClick = vi.fn()   // jest.fn() in Jest

  render(<Button label="Submit" onClick={handleClick} />)
  await user.click(screen.getByRole('button'))

  expect(handleClick).toHaveBeenCalledTimes(1)
})

test('is disabled when disabled prop is true', () => {
  render(<Button label="Submit" onClick={() => {}} disabled />)
  expect(screen.getByRole('button')).toBeDisabled()
})`}
      </CodeBlock>

      <h2>Conditional Rendering</h2>

      <CodeBlock language="jsx" title="Testing show/hide logic">
{`// Alert.jsx
function Alert({ type, message, dismissable = false, onDismiss }) {
  if (!message) return null
  return (
    <div role="alert" data-type={type}>
      {message}
      {dismissable && (
        <button onClick={onDismiss} aria-label="Dismiss alert">×</button>
      )}
    </div>
  )
}

// Alert.test.jsx
test('renders nothing when message is empty', () => {
  render(<Alert type="info" message="" />)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('renders message text', () => {
  render(<Alert type="error" message="Something went wrong" />)
  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
})

test('shows dismiss button when dismissable', () => {
  render(<Alert type="info" message="Note" dismissable onDismiss={() => {}} />)
  expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
})

test('does not show dismiss button by default', () => {
  render(<Alert type="info" message="Note" />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})`}
      </CodeBlock>

      <h2>Testing State Changes</h2>

      <CodeBlock language="jsx" title="Counter component test">
{`// Counter.jsx
function Counter({ initial = 0 }) {
  const [count, setCount] = useState(initial)
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

// Counter.test.jsx
test('starts at initial value', () => {
  render(<Counter initial={5} />)
  expect(screen.getByTestId('count')).toHaveTextContent('5')
})

test('increments on click', async () => {
  const user = userEvent.setup()
  render(<Counter />)

  await user.click(screen.getByRole('button', { name: 'Increment' }))
  expect(screen.getByTestId('count')).toHaveTextContent('1')

  await user.click(screen.getByRole('button', { name: 'Increment' }))
  expect(screen.getByTestId('count')).toHaveTextContent('2')
})

test('resets to zero', async () => {
  const user = userEvent.setup()
  render(<Counter initial={10} />)

  await user.click(screen.getByRole('button', { name: 'Reset' }))
  expect(screen.getByTestId('count')).toHaveTextContent('0')
})`}
      </CodeBlock>

      <h2>Snapshot Testing</h2>
      <p>
        Snapshot tests capture the rendered output and alert you to unexpected changes. Use sparingly —
        large snapshots are brittle. Prefer targeted assertions about specific elements.
      </p>

      <CodeBlock language="jsx" title="Snapshot testing">
{`import { render } from '@testing-library/react'

test('matches snapshot', () => {
  const { container } = render(<Badge label="New" color="blue" />)
  expect(container.firstChild).toMatchSnapshot()
})

// Generated __snapshots__/Badge.test.jsx.snap:
// exports['matches snapshot 1'] = '
// <span
//   class="badge badge--blue"
// >
//   New
// </span>
// '

// Update snapshots when intentionally changing output:
// vitest --update-snapshots
// jest --updateSnapshot

// Inline snapshot (recommended for small outputs)
test('matches inline snapshot', () => {
  const { container } = render(<Badge label="New" color="blue" />)
  expect(container.firstChild).toMatchInlineSnapshot(\`
    <span class="badge badge--blue">New</span>
  \`)
})`}
      </CodeBlock>

      <InfoBox variant="warning" title="Snapshot Anti-Patterns">
        <p>Avoid snapshots of entire page layouts — they break constantly and provide little signal.
        Use snapshots for: small UI components with stable markup, serialized data structures, or CSS-in-JS class name generation.</p>
      </InfoBox>

      <h2>Testing with Context Providers</h2>

      <CodeBlock language="jsx" title="Wrapping with providers">
{`// ThemeContext.jsx
const ThemeContext = createContext('light')

// ThemedButton.jsx
function ThemedButton({ label }) {
  const theme = useContext(ThemeContext)
  return <button className={theme}>{label}</button>
}

// ThemedButton.test.jsx — provide context in render
test('applies dark theme class', () => {
  render(
    <ThemeContext.Provider value="dark">
      <ThemedButton label="Click" />
    </ThemeContext.Provider>
  )
  expect(screen.getByRole('button')).toHaveClass('dark')
})

// Custom render helper for reuse
function renderWithTheme(ui, theme = 'light') {
  return render(
    <ThemeContext.Provider value={theme}>{ui}</ThemeContext.Provider>
  )
}

test('uses custom render helper', () => {
  renderWithTheme(<ThemedButton label="Click" />, 'dark')
  expect(screen.getByRole('button')).toHaveClass('dark')
})`}
      </CodeBlock>

      <h2>Testing Lists and Tables</h2>

      <CodeBlock language="jsx" title="Testing list rendering">
{`function UserList({ users }) {
  if (users.length === 0) return <p>No users found</p>
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name} — {user.email}</li>
      ))}
    </ul>
  )
}

test('renders empty state', () => {
  render(<UserList users={[]} />)
  expect(screen.getByText('No users found')).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})

test('renders all users', () => {
  const users = [
    { id: 1, name: 'Alice', email: 'alice@test.com' },
    { id: 2, name: 'Bob', email: 'bob@test.com' },
  ]
  render(<UserList users={users} />)

  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('Alice')
  expect(items[1]).toHaveTextContent('Bob')
})`}
      </CodeBlock>

      <InteractiveChallenge
        question="What is the recommended way to test that a component does NOT render a specific element?"
        options={[
          "Use getByText and wrap in try/catch",
          "Use queryByText and assert it equals null or use .not.toBeInTheDocument()",
          "Use findByText with a timeout of 0",
          "Check the component's state directly with useState"
        ]}
        correctIndex={1}
        explanation="queryBy* queries return null instead of throwing when the element is absent, making them perfect for negative assertions. Use: expect(screen.queryByText('Error')).not.toBeInTheDocument() or expect(screen.queryByText('Error')).toBeNull(). The getBy* variant would throw an error before your assertion even runs."
      />

      <InteractiveChallenge
        question="When should you use snapshot testing vs targeted assertions?"
        options={[
          "Always use snapshots — they catch all regressions",
          "Always use targeted assertions — snapshots are never useful",
          "Snapshots for small stable components, targeted assertions for behavior and logic",
          "Use snapshots in CI and targeted assertions locally"
        ]}
        correctIndex={2}
        explanation="Snapshots are useful for small, stable UI components where you want to detect any unintended markup change. However, large snapshots are brittle and hard to review — every refactor breaks them with no meaningful signal. Targeted assertions (getByRole, toHaveTextContent, toBeDisabled) describe intent and survive refactoring better."
      />
    </LessonLayout>
  );
}
