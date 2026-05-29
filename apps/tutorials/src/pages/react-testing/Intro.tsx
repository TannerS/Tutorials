import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="RTL Fundamentals"
      sectionId="react-testing"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react-testing/components', label: 'Testing Components' }}
    >
      <h2>The RTL Philosophy</h2>
      <p>
        React Testing Library (RTL) is built on one principle: <strong>test the way
        users interact with your app</strong>, not the implementation details. Users
        don't know about state variables, hooks, or component names — they see text,
        click buttons, and fill in forms. Your tests should do the same.
      </p>

      <InfoBox variant="tip" title="The Guiding Principle">
        "The more your tests resemble the way your software is used, the more
        confidence they can give you." — Kent C. Dodds. If a refactor doesn't
        change behavior, your tests should still pass.
      </InfoBox>

      <FlowChart
        title="RTL Testing Mental Model"
        chart={"graph LR\n  R[Render Component] --> Q[Query the DOM]\n  Q --> I[Interact via user-event]\n  I --> A[Assert on Output]\n  A --> C{Passes?}\n  C -->|Yes| D[Ship It]\n  C -->|No| F[Fix Component]"}
      />

      <h2>Project Setup</h2>
      <p>
        If you're using Create React App or Vite with the React template, most of
        this is preconfigured. Here's what you need:
      </p>

      <CodeBlock language="jsx" title="Install Dependencies">
{`# Core testing stack
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# If using Vite, you'll also need:
npm install --save-dev vitest jsdom @testing-library/jest-dom

# jest.config.js (CRA) or vitest.config.ts (Vite)
# Make sure testEnvironment is set to 'jsdom'`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Test Setup File (setupTests.js)">
{`// This runs before every test file
import '@testing-library/jest-dom';

// Optional: clean up after each test (RTL does this automatically)
// import { cleanup } from '@testing-library/react';
// afterEach(cleanup);`}
      </CodeBlock>

      <h2>The render Function</h2>
      <p>
        <code>render()</code> mounts your component into a virtual DOM (jsdom) and
        returns utilities for querying it. Always destructure <code>screen</code>
        from the import instead — it's bound to the latest render automatically.
      </p>

      <CodeBlock language="jsx" title="Basic render + screen">
{`import { render, screen } from '@testing-library/react';
import Greeting from './Greeting';

test('renders greeting message', () => {
  render(<Greeting name="Alice" />);

  // screen is the preferred way to query
  expect(screen.getByText('Hello, Alice!')).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Query Types: getBy, queryBy, findBy</h2>
      <p>
        RTL provides three categories of queries. Choosing the right one is critical
        for writing robust, non-flaky tests.
      </p>

      <table>
        <thead>
          <tr>
            <th>Query</th>
            <th>Returns</th>
            <th>Throws on 0?</th>
            <th>Throws on 2+?</th>
            <th>Async?</th>
            <th>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>getBy</code></td>
            <td>Element</td>
            <td>Yes</td>
            <td>Yes</td>
            <td>No</td>
            <td>Element must exist right now</td>
          </tr>
          <tr>
            <td><code>queryBy</code></td>
            <td>Element | null</td>
            <td>No</td>
            <td>Yes</td>
            <td>No</td>
            <td>Assert element does NOT exist</td>
          </tr>
          <tr>
            <td><code>findBy</code></td>
            <td>Promise&lt;Element&gt;</td>
            <td>Yes (rejects)</td>
            <td>Yes (rejects)</td>
            <td>Yes</td>
            <td>Element appears after async work</td>
          </tr>
          <tr>
            <td><code>getAllBy</code></td>
            <td>Element[]</td>
            <td>Yes</td>
            <td>No</td>
            <td>No</td>
            <td>Multiple elements must exist</td>
          </tr>
          <tr>
            <td><code>queryAllBy</code></td>
            <td>Element[]</td>
            <td>No (empty [])</td>
            <td>No</td>
            <td>No</td>
            <td>Check count or assert none</td>
          </tr>
          <tr>
            <td><code>findAllBy</code></td>
            <td>Promise&lt;Element[]&gt;</td>
            <td>Yes (rejects)</td>
            <td>No</td>
            <td>Yes</td>
            <td>Multiple elements after async</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="jsx" title="Query Type Examples">
{`// Element MUST exist — throws if missing
const heading = screen.getByRole('heading', { name: /welcome/i });

// Assert element does NOT exist — returns null
expect(screen.queryByText('Error')).not.toBeInTheDocument();

// Wait for element to appear (async) — use with await
const item = await screen.findByText('Loaded!');

// Multiple elements
const listItems = screen.getAllByRole('listitem');
expect(listItems).toHaveLength(3);`}
      </CodeBlock>

      <h2>Query Priority Guide</h2>
      <p>
        RTL recommends queries in a specific priority order. Prefer queries that
        reflect how users and assistive technology interact with the page:
      </p>

      <InfoBox variant="info" title="Query Priority (Most to Least Preferred)">
        <strong>1. getByRole</strong> — Accessible role (button, heading, textbox).
        Always try this first.<br />
        <strong>2. getByLabelText</strong> — Form fields with associated labels.<br />
        <strong>3. getByPlaceholderText</strong> — When no label exists.<br />
        <strong>4. getByText</strong> — Non-interactive elements by visible text.<br />
        <strong>5. getByDisplayValue</strong> — Current value of form inputs.<br />
        <strong>6. getByAltText</strong> — Images, area elements.<br />
        <strong>7. getByTitle</strong> — Title attribute (not widely used).<br />
        <strong>8. getByTestId</strong> — Last resort. Add data-testid when nothing else works.
      </InfoBox>

      <CodeBlock language="jsx" title="Query Priority in Practice">
{`// BEST: getByRole — semantic and accessible
screen.getByRole('button', { name: /submit/i });
screen.getByRole('heading', { level: 2, name: /profile/i });
screen.getByRole('textbox', { name: /email/i });

// GOOD: getByLabelText — great for forms
screen.getByLabelText(/password/i);

// OK: getByText — for non-interactive content
screen.getByText(/welcome back/i);

// LAST RESORT: getByTestId — when nothing else works
screen.getByTestId('custom-dropdown');`}
      </CodeBlock>

      <h2>user-event vs fireEvent</h2>
      <p>
        Always prefer <code>user-event</code> over <code>fireEvent</code>.
        user-event simulates real user interactions (focus, keydown, keyup, click)
        instead of just dispatching a single DOM event.
      </p>

      <CodeBlock language="jsx" title="user-event Setup and Usage">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

test('submits form with user credentials', async () => {
  const user = userEvent.setup();
  const handleSubmit = jest.fn();

  render(<LoginForm onSubmit={handleSubmit} />);

  // user-event simulates real typing (focus, keydown, input, keyup per char)
  await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
  await user.type(screen.getByLabelText(/password/i), 'secret123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'alice@test.com',
    password: 'secret123',
  });
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="fireEvent Is Low-Level">
        <code>fireEvent.click(button)</code> fires only the click event.
        <code>user.click(button)</code> fires pointerdown, mousedown, pointerup,
        mouseup, click, and focus — just like a real user. This catches more bugs.
      </InfoBox>

      <h2>debug() and within()</h2>
      <p>
        Two essential utilities when writing or debugging tests:
      </p>

      <CodeBlock language="jsx" title="debug() and within()">
{`import { render, screen, within } from '@testing-library/react';
import Dashboard from './Dashboard';

test('sidebar has navigation links', () => {
  render(<Dashboard />);

  // Print the current DOM to console (great for debugging)
  screen.debug();

  // Scope queries to a specific container
  const sidebar = screen.getByRole('navigation');
  const links = within(sidebar).getAllByRole('link');
  expect(links).toHaveLength(4);

  // debug a specific element
  screen.debug(sidebar);
});`}
      </CodeBlock>

      <h2>Cleanup</h2>
      <p>
        RTL automatically cleans up after each test when using Jest or Vitest with
        the standard setup file. If you're using a custom framework, call
        <code> cleanup()</code> in <code>afterEach</code>.
      </p>

      <CodeBlock language="jsx" title="Manual Cleanup (rarely needed)">
{`import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Which query should you use to assert that an error message does NOT appear on screen?"}
        options={[
          "getByText('Error')",
          "findByText('Error')",
          "queryByText('Error')",
          "getAllByText('Error')"
        ]}
        correctIndex={2}
        explanation={"queryBy returns null when the element is not found, so you can assert .not.toBeInTheDocument(). getBy would throw an error immediately if the element is missing."}
        language="jsx"
      />

      <h2>Common jest-dom Matchers</h2>
      <CodeBlock language="jsx" title="jest-dom Custom Matchers">
{`// Visibility and presence
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeEmptyDOMElement();

// Form state
expect(input).toBeDisabled();
expect(input).toBeEnabled();
expect(input).toBeRequired();
expect(input).toHaveValue('hello');
expect(checkbox).toBeChecked();

// Content and attributes
expect(element).toHaveTextContent(/welcome/i);
expect(element).toHaveAttribute('href', '/home');
expect(element).toHaveClass('active');
expect(element).toHaveStyle({ color: 'red' });

// Form validation
expect(input).toBeValid();
expect(input).toBeInvalid();`}
      </CodeBlock>

      <h2>Your First Complete Test</h2>
      <CodeBlock language="jsx" title="Counter.test.jsx — Putting It All Together">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

describe('Counter', () => {
  test('renders with initial count of 0', () => {
    render(<Counter />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  test('increments when + button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole('button', { name: /increment/i }));
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  test('decrements when - button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={5} />);

    await user.click(screen.getByRole('button', { name: /decrement/i }));
    expect(screen.getByText('Count: 4')).toBeInTheDocument();
  });

  test('does not go below 0', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole('button', { name: /decrement/i }));
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });
});`}
      </CodeBlock>
    </LessonLayout>
  );
}
