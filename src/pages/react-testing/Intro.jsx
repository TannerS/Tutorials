import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RTIntro() {
  return (
    <LessonLayout
      title="RTL & Testing Philosophy"
      sectionId="react-testing"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react-testing/components', label: 'Testing Components' }}
    >
      <h2>React Testing Library Philosophy</h2>
      <p>
        React Testing Library (RTL) is built around one guiding principle: test your app the way users use it.
        Query by accessible roles and labels, fire user events, and assert on what appears in the DOM.
      </p>

      <InfoBox variant="tip" title="The Guiding Principle">
        <p>
          "The more your tests resemble the way your software is used, the more confidence they can give you."
          — Kent C. Dodds, creator of RTL
        </p>
      </InfoBox>

      <FlowChart
        title="Testing Library Query Priority"
        chart={"graph TD\n  A[Find an Element] --> B[By Role - getByRole]\n  B --> C[By Label - getByLabelText]\n  C --> D[By Placeholder]\n  D --> E[By Text - getByText]\n  E --> F[By DisplayValue]\n  F --> G[By AltText]\n  G --> H[By Title]\n  H --> I[By TestId - last resort]"}
      />

      <h2>Setup</h2>

      <CodeBlock language="bash" title="Installation">
{`npm install --save-dev @testing-library/react @testing-library/user-event
npm install --save-dev @testing-library/jest-dom vitest jsdom

# Or with Jest
npm install --save-dev @testing-library/react @testing-library/user-event
npm install --save-dev @testing-library/jest-dom jest jest-environment-jsdom`}
      </CodeBlock>

      <CodeBlock language="typescript" title="vitest.config.ts">
{`import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})`}
      </CodeBlock>

      <CodeBlock language="typescript" title="src/test/setup.ts">
{`import '@testing-library/jest-dom'

// Extend Vitest's expect with RTL matchers:
// toBeInTheDocument, toHaveValue, toBeDisabled, etc.`}
      </CodeBlock>

      <h2>Core Queries</h2>

      <CodeBlock language="jsx" title="Query variants">
{`import { render, screen } from '@testing-library/react'

// getBy* — throws if not found or multiple found
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByText('Hello World')
screen.getByTestId('my-element')    // last resort

// queryBy* — returns null if not found (good for asserting absence)
screen.queryByText('Error message')  // won't throw

// findBy* — returns a Promise (for async elements)
await screen.findByText('Data loaded')
await screen.findByRole('alert')

// All variants — getAll, queryAll, findAll
screen.getAllByRole('listitem')
screen.queryAllByText(/item/i)
await screen.findAllByRole('option')`}
      </CodeBlock>

      <h2>user-event vs fireEvent</h2>
      <p>
        Prefer <code>@testing-library/user-event</code> over <code>fireEvent</code>.
        user-event simulates real browser interactions (focus, pointerdown, keydown, input, keyup, click).
        fireEvent fires a single synthetic event, missing the interaction chain.
      </p>

      <CodeBlock language="jsx" title="user-event setup and usage">
{`import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('user types into input', async () => {
  // Always create userEvent instance with setup()
  const user = userEvent.setup()

  render(<LoginForm />)

  // user-event is async — await every interaction
  await user.type(screen.getByLabelText('Email'), 'alice@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret123')
  await user.click(screen.getByRole('button', { name: /log in/i }))

  // Assert result
  expect(screen.getByText('Welcome, Alice!')).toBeInTheDocument()
})`}
      </CodeBlock>

      <h2>Common RTL Matchers</h2>

      <CodeBlock language="jsx" title="jest-dom matchers">
{`// Presence
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()

// Visibility
expect(element).toBeVisible()
expect(element).not.toBeVisible()

// State
expect(button).toBeDisabled()
expect(checkbox).toBeChecked()

// Value
expect(input).toHaveValue('hello')
expect(select).toHaveValue('option-1')

// Text content
expect(el).toHaveTextContent('Hello')
expect(el).toHaveTextContent(/hello/i)

// Attributes
expect(el).toHaveAttribute('aria-label', 'Close')
expect(el).toHaveClass('active')

// Focus
expect(input).toHaveFocus()`}
      </CodeBlock>

      <h2>Render and Cleanup</h2>

      <CodeBlock language="jsx" title="render() and cleanup">
{`import { render, screen, cleanup } from '@testing-library/react'

// render() returns useful utilities
const { container, rerender, unmount, debug } = render(<Component />)

// Debug the current DOM
screen.debug()                    // print DOM to console
screen.debug(screen.getByRole('form'))

// Re-render with new props
rerender(<Component value={42} />)

// Cleanup happens automatically after each test
// (if using vitest globals or jest)
// Manual cleanup if needed:
afterEach(() => cleanup())

// Render with providers
function renderWithProviders(ui, { store, ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="Which query should you use to assert that an element does NOT appear in the DOM?"
        options={["getByText — it throws when element is absent", "queryByText — returns null when not found", "findByText — resolves when element disappears", "screen.missing() — a custom matcher"]}
        correctIndex={1}
        explanation="queryBy* variants return null when the element is not found instead of throwing. This makes them ideal for assertions like: expect(screen.queryByText('Error')).not.toBeInTheDocument(). getBy* would throw before your assertion runs. findBy* is for async elements that eventually appear."
      />

      <InteractiveChallenge
        question="Why should you prefer user-event over fireEvent for simulating user interactions?"
        options={[
          "user-event is faster and reduces test runtime",
          "user-event simulates the full event chain a real browser fires",
          "fireEvent does not work with React Testing Library",
          "user-event automatically mocks all API calls"
        ]}
        correctIndex={1}
        explanation="user-event simulates realistic browser behavior — clicking a button fires pointerdown, pointerup, click in sequence, and typing fires focus, keydown, keypress, input, keyup for each character. fireEvent only dispatches a single synthetic event. Tests using user-event catch more real-world bugs like components that only respond to specific events in the chain."
      />
    </LessonLayout>
  );
}
