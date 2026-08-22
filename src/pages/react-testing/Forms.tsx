import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Forms() {
  return (
    <LessonLayout
      title="Testing Forms & Routing"
      sectionId="react-testing"
      lessonIndex={4}
      prev={{ path: '/react-testing/async', label: 'Testing Async & APIs' }}
      next={{ path: '/react-testing/patterns', label: 'Testing Patterns & CI' }}
    >
      <h2>Testing Form Inputs</h2>
      <p>
        Forms are the primary way users send data in your app. RTL gives you
        everything you need to fill in, validate, and submit forms the way a
        real user would.
      </p>

      <CodeBlock language="jsx" title="Text, Checkbox, Radio, Select, Textarea">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsForm from './SettingsForm';

describe('SettingsForm inputs', () => {
  test('fills in text input', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    const nameInput = screen.getByLabelText(/display name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice');
    expect(nameInput).toHaveValue('Alice');
  });

  test('toggles checkbox', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    const checkbox = screen.getByRole('checkbox', { name: /dark mode/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('selects radio option', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    const radio = screen.getByRole('radio', { name: /weekly/i });
    await user.click(radio);
    expect(radio).toBeChecked();

    // Other options unchecked
    expect(screen.getByRole('radio', { name: /daily/i })).not.toBeChecked();
  });

  test('selects dropdown option', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    // selectOptions matches on the option's VALUE, not its visible label.
    // For <option value="es">Spanish</option> you pass 'es', not 'Spanish'.
    await user.selectOptions(
      screen.getByRole('combobox', { name: /language/i }),
      'es'
    );
    expect(screen.getByRole('combobox', { name: /language/i })).toHaveValue('es');

    // To select by the visible label instead, pass the option element:
    // await user.selectOptions(select, screen.getByRole('option', { name: 'Spanish' }));
  });

  test('fills in textarea', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    const bio = screen.getByLabelText(/bio/i);
    await user.type(bio, 'Senior developer who loves testing.');
    expect(bio).toHaveValue('Senior developer who loves testing.');
  });
});`}
      </CodeBlock>

      <h2>Testing Form Validation</h2>

      <CodeBlock language="jsx" title="Required, Pattern, and Custom Validation">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationForm from './RegistrationForm';

describe('RegistrationForm validation', () => {
  test('shows required error when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test('shows email format error', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  test('shows password strength error', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test('shows password mismatch error', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different1!');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('clears errors when user corrects input', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Use Accessible Error Patterns">
        Link error messages to inputs with <code>aria-describedby</code> and use
        <code>role="alert"</code> for validation errors. This makes both your
        app and your tests more accessible. Query errors with
        <code>getByRole('alert')</code>.
      </InfoBox>

      <h2>Testing Form Submission</h2>

      <CodeBlock language="jsx" title="Submit Handler and Disable State">
{`import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';

test('submits form data and shows success', async () => {
  const user = userEvent.setup();
  const handleSubmit = jest.fn().mockResolvedValue({ ok: true });

  render(<ContactForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText(/name/i), 'Alice');
  await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
  await user.type(screen.getByLabelText(/message/i), 'Hello!');
  await user.click(screen.getByRole('button', { name: /send/i }));

  expect(handleSubmit).toHaveBeenCalledWith({
    name: 'Alice',
    email: 'alice@test.com',
    message: 'Hello!',
  });

  // Success message after resolution
  await waitFor(() => {
    expect(screen.getByText(/message sent/i)).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <InfoBox variant="danger" title="Asserting the 'submitting' State Is a Classic Flake">
        <p>
          It is tempting to add{' '}
          <code>expect(screen.getByRole(&apos;button&apos;, {"{ name: /sending/i }"})).toBeDisabled()</code>{' '}
          right after the click. It will usually fail. <code>await user.click(...)</code>{' '}
          wraps the interaction in <code>act()</code>, which flushes pending microtasks —
          so an <code>onSubmit</code> stubbed with <code>mockResolvedValue</code> has
          already resolved and the button is back to &quot;Send&quot; before your
          assertion runs.
        </p>
        <p style={{ marginBottom: 0 }}>
          If you genuinely need to assert the in-flight state, hold the promise open so
          you control when it settles.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Asserting an in-flight state deterministically">
{`import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('disables the button while the request is in flight', async () => {
  const user = userEvent.setup();

  // A promise WE resolve, so the pending state can't race us.
  let resolveSubmit;
  const handleSubmit = jest.fn(
    () => new Promise((resolve) => { resolveSubmit = resolve; })
  );

  render(<ContactForm onSubmit={handleSubmit} />);
  await user.type(screen.getByLabelText(/name/i), 'Alice');
  await user.click(screen.getByRole('button', { name: /send/i }));

  // Still pending — the button is in its submitting state.
  expect(await screen.findByRole('button', { name: /sending/i })).toBeDisabled();

  // Now let it finish.
  await act(async () => { resolveSubmit({ ok: true }); });
  expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Controlled vs Uncontrolled Forms</h2>

      <CodeBlock language="jsx" title="Controlled and Uncontrolled Patterns">
{`// Controlled: component manages value via state
test('controlled input updates on change', async () => {
  const user = userEvent.setup();
  render(<ControlledInput />);

  const input = screen.getByLabelText(/name/i);
  await user.type(input, 'Alice');
  expect(input).toHaveValue('Alice');
});

// Uncontrolled: value read from DOM ref on submit
test('uncontrolled form reads value on submit', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(<UncontrolledForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/name/i), 'Bob');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bob' }));
});`}
      </CodeBlock>

      <h2>Testing React Hook Form</h2>

      <CodeBlock language="jsx" title="React Hook Form Integration Test">
{`import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutForm from './CheckoutForm';

describe('CheckoutForm (React Hook Form)', () => {
  test('validates required fields on blur', async () => {
    const user = userEvent.setup();
    render(<CheckoutForm onSubmit={jest.fn()} />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.click(emailInput);
    await user.tab(); // Blur triggers validation

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  test('submits valid form data', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<CheckoutForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/card number/i), '4242424242424242');
    await user.type(screen.getByLabelText(/expiry/i), '12/25');
    await user.type(screen.getByLabelText(/cvc/i), '123');
    await user.click(screen.getByRole('button', { name: /pay/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'alice@test.com',
        cardNumber: '4242424242424242',
        expiry: '12/25',
        cvc: '123',
      });
    });
  });
});`}
      </CodeBlock>

      <h2>Testing Multi-Step Forms</h2>

      <CodeBlock language="jsx" title="Wizard Form Navigation">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WizardForm from './WizardForm';

describe('WizardForm', () => {
  test('progresses through steps', async () => {
    const user = userEvent.setup();
    render(<WizardForm onSubmit={jest.fn()} />);

    // Step 1: Personal Info
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/name/i), 'Alice');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Address
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/city/i), 'Portland');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: Review
    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Portland')).toBeInTheDocument();
  });

  test('can go back to previous step', async () => {
    const user = userEvent.setup();
    render(<WizardForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText(/name/i), 'Alice');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));

    // Data preserved
    expect(screen.getByLabelText(/name/i)).toHaveValue('Alice');
  });
});`}
      </CodeBlock>

      <InfoBox variant="info" title="Testing File Upload Inputs">
        Use <code>user.upload()</code> from user-event to simulate file selection.
        Create a <code>File</code> object with <code>new File(['content'], 'name.txt',
        {"{ type: 'text/plain' }"})</code> and pass it to the upload method.
      </InfoBox>

      <CodeBlock language="jsx" title="Testing File Upload">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from './FileUploader';

test('uploads a file', async () => {
  const user = userEvent.setup();
  const onUpload = jest.fn();
  render(<FileUploader onUpload={onUpload} />);

  const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
  const input = screen.getByLabelText(/upload file/i);

  await user.upload(input, file);

  expect(input.files[0]).toBe(file);
  expect(input.files).toHaveLength(1);
});

test('rejects files over size limit', async () => {
  const user = userEvent.setup();
  render(<FileUploader maxSizeMB={1} onUpload={jest.fn()} />);

  const bigFile = new File(['x'.repeat(2_000_000)], 'big.txt', {
    type: 'text/plain',
  });

  await user.upload(screen.getByLabelText(/upload file/i), bigFile);
  expect(screen.getByText(/file too large/i)).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing React Router</h2>

      <FlowChart
        title="Router Testing Strategy"
        chart={"graph LR\n  M[MemoryRouter] --> R[Set initialEntries]\n  R --> RN[Render Routes]\n  RN --> A[Assert correct page]\n  A --> N[Simulate navigation]\n  N --> A2[Assert new page]"}
      />

      <CodeBlock language="jsx" title="Testing Route Rendering with MemoryRouter">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';

test('renders home page at /', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: /home/i })).toBeInTheDocument();
});

test('renders about page at /about', () => {
  render(
    <MemoryRouter initialEntries={['/about']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
});

test('renders 404 for unknown routes', () => {
  render(
    <MemoryRouter initialEntries={['/does-not-exist']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/page not found/i)).toBeInTheDocument();
});`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Testing Navigation">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';

test('navigates to about page when link is clicked', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  await user.click(screen.getByRole('link', { name: /about/i }));
  expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
});`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Testing Route Params and Query Strings">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import UserPage from './UserPage';

test('renders user page with route params', () => {
  render(
    <MemoryRouter initialEntries={['/users/42']}>
      <Routes>
        <Route path="/users/:userId" element={<UserPage />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText(/user #42/i)).toBeInTheDocument();
});

test('reads query string parameters', () => {
  render(
    <MemoryRouter initialEntries={['/search?q=react&page=2']}>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByRole('searchbox')).toHaveValue('react');
  expect(screen.getByText(/page 2/i)).toBeInTheDocument();
});`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Testing Redirects">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';

test('redirects unauthenticated users to login', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <App isAuthenticated={false} />
    </MemoryRouter>
  );

  // Should be on login page, not dashboard
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <InteractiveChallenge
        question={"When testing a component that uses useParams() from React Router, what should you wrap it with in your test?"}
        options={[
          "BrowserRouter with a manually set URL",
          "MemoryRouter with initialEntries matching the route pattern",
          "StaticRouter from react-router/dom",
          "Just mock useParams with jest.mock()"
        ]}
        correctIndex={1}
        explanation={"MemoryRouter with initialEntries is the standard approach for testing routed components. It lets you set the initial URL without needing a real browser environment, and it works with useParams, useSearchParams, and all other router hooks."}
        language="jsx"
      />

      <h2>Complete Example: Login Form</h2>

      <CodeBlock language="jsx" title="LoginForm.test.jsx — Validation + Submit + Redirect">
{`import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );

describe('LoginForm', () => {
  test('shows validation errors for empty submit', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test('shows error for invalid credentials', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'badpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /invalid credentials/i
    );
  });

  test('redirects to dashboard on success', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/password/i), 'correct-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  // NOTE: no "disables button while submitting" test here — see the warning
  // above. With a fast/auto-resolving mock the submit finishes inside the
  // awaited click, so that assertion races. Assert it only when you control
  // when the promise settles.
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="Don't Mock the Router">
        Avoid mocking <code>useNavigate</code> or <code>useParams</code> directly.
        Instead, wrap your component in <code>MemoryRouter</code> and test the
        actual navigation behavior. Mocking router internals is fragile and
        doesn't test real behavior.
      </InfoBox>

      <InfoBox variant="danger" title="MemoryRouter Only Covers Half of React Router 7">
        <p>
          Everything above uses <code>MemoryRouter</code> wrapped around{' '}
          <code>&lt;Routes&gt;</code>, which is the right tool for the{' '}
          <strong>declarative</strong> API. It does <em>not</em> work for the{' '}
          <strong>data</strong> API. A component that calls{' '}
          <code>useLoaderData</code>, <code>useActionData</code>,{' '}
          <code>useNavigation</code>, or renders <code>&lt;Form&gt;</code> will throw
          inside a <code>MemoryRouter</code> — those hooks require a data router, and
          the error message (&ldquo;useLoaderData must be used within a data
          router&rdquo;) is easy to misread as a missing provider.
        </p>
        <p style={{ marginBottom: 0 }}>
          For those, build the router the same way your app does and render it
          through <code>RouterProvider</code>:
        </p>
        <CodeBlock language="jsx" title="Testing a route that has a loader">
          {`import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const router = createMemoryRouter(
  [{ path: '/users/:id', element: <UserPage />, loader: userLoader }],
  { initialEntries: ['/users/42'] },   // note: an OPTION here, not a prop
);

render(<RouterProvider router={router} />);
expect(await screen.findByText(/user #42/i)).toBeInTheDocument();`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Note where <code>initialEntries</code> moved: it is a prop on{' '}
          <code>MemoryRouter</code> but an option in the second argument of{' '}
          <code>createMemoryRouter</code>. The <strong>Testing Routes</strong> lesson
          in the React Router section covers loaders, actions, and error boundaries in
          full.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
