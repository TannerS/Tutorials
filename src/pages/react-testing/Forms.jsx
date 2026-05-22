import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RTForms() {
  return (
    <LessonLayout
      title="Testing Forms"
      sectionId="react-testing"
      lessonIndex={4}
      prev={{ path: '/react-testing/async', label: 'Async Testing' }}
      next={{ path: '/react-testing/patterns', label: 'Testing Patterns' }}
    >
      <h2>Testing Form Inputs and Submission</h2>
      <p>
        Form testing with RTL mimics real user behavior: type into fields, select options, check checkboxes,
        and submit. Always use <code>userEvent</code> over <code>fireEvent</code> for realistic interactions.
      </p>

      <CodeBlock language="jsx" title="Basic form test">
{`// LoginForm.jsx
function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form onSubmit={e => {
      e.preventDefault()
      onSubmit({ email, password })
    }}>
      <label>
        Email
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      <button type="submit">Log In</button>
    </form>
  )
}

// LoginForm.test.jsx
test('submits email and password', async () => {
  const user = userEvent.setup()
  const handleSubmit = vi.fn()

  render(<LoginForm onSubmit={handleSubmit} />)

  await user.type(screen.getByLabelText('Email'), 'alice@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret123')
  await user.click(screen.getByRole('button', { name: /log in/i }))

  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'alice@example.com',
    password: 'secret123',
  })
})`}
      </CodeBlock>

      <h2>Testing Form Validation</h2>

      <CodeBlock language="jsx" title="Validation error messages">
{`// RegistrationForm.jsx
function RegistrationForm({ onSubmit }) {
  const [errors, setErrors] = useState({})

  function validate(data) {
    const errs = {}
    if (!data.email.includes('@')) errs.email = 'Invalid email address'
    if (data.password.length < 8) errs.password = 'Password must be 8+ characters'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.target))
    const errs = validate(data)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input name="email" type="email" />
        {errors.email && <span role="alert">{errors.email}</span>}
      </label>
      <label>
        Password
        <input name="password" type="password" />
        {errors.password && <span role="alert">{errors.password}</span>}
      </label>
      <button type="submit">Register</button>
    </form>
  )
}

// Tests
test('shows email validation error', async () => {
  const user = userEvent.setup()
  render(<RegistrationForm onSubmit={vi.fn()} />)

  await user.type(screen.getByLabelText('Email'), 'notanemail')
  await user.click(screen.getByRole('button', { name: /register/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email address')
})

test('does not submit with invalid data', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<RegistrationForm onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText('Email'), 'bad')
  await user.click(screen.getByRole('button', { name: /register/i }))

  expect(onSubmit).not.toHaveBeenCalled()
})`}
      </CodeBlock>

      <h2>Testing Select, Checkbox, and Radio</h2>

      <CodeBlock language="jsx" title="Different input types">
{`function PreferencesForm({ onSave }) {
  return (
    <form onSubmit={e => {
      e.preventDefault()
      onSave(Object.fromEntries(new FormData(e.target)))
    }}>
      {/* Select */}
      <label>
        Country
        <select name="country">
          <option value="">Choose...</option>
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
        </select>
      </label>

      {/* Checkbox */}
      <label>
        <input type="checkbox" name="newsletter" />
        Subscribe to newsletter
      </label>

      {/* Radio group */}
      <fieldset>
        <legend>Theme</legend>
        <label><input type="radio" name="theme" value="light" /> Light</label>
        <label><input type="radio" name="theme" value="dark" /> Dark</label>
      </fieldset>

      <button type="submit">Save</button>
    </form>
  )
}

// Tests for each input type
test('selects country from dropdown', async () => {
  const user = userEvent.setup()
  render(<PreferencesForm onSave={vi.fn()} />)

  await user.selectOptions(screen.getByLabelText('Country'), 'us')
  expect(screen.getByLabelText('Country')).toHaveValue('us')
})

test('checks newsletter checkbox', async () => {
  const user = userEvent.setup()
  render(<PreferencesForm onSave={vi.fn()} />)

  const checkbox = screen.getByLabelText(/subscribe/i)
  expect(checkbox).not.toBeChecked()

  await user.click(checkbox)
  expect(checkbox).toBeChecked()
})

test('selects dark theme radio', async () => {
  const user = userEvent.setup()
  render(<PreferencesForm onSave={vi.fn()} />)

  await user.click(screen.getByLabelText('Dark'))
  expect(screen.getByLabelText('Dark')).toBeChecked()
  expect(screen.getByLabelText('Light')).not.toBeChecked()
})`}
      </CodeBlock>

      <h2>Testing File Inputs</h2>

      <CodeBlock language="jsx" title="File upload test">
{`function FileUpload({ onUpload }) {
  return (
    <div>
      <label>
        Upload file
        <input type="file" accept=".pdf,.png" onChange={e => onUpload(e.target.files[0])} />
      </label>
    </div>
  )
}

test('calls onUpload with selected file', async () => {
  const user = userEvent.setup()
  const onUpload = vi.fn()

  render(<FileUpload onUpload={onUpload} />)

  const file = new File(['hello'], 'test.pdf', { type: 'application/pdf' })
  const input = screen.getByLabelText(/upload file/i)

  await user.upload(input, file)

  expect(onUpload).toHaveBeenCalledWith(file)
  expect(input.files[0]).toBe(file)
  expect(input.files).toHaveLength(1)
})`}
      </CodeBlock>

      <h2>Testing React Hook Form</h2>

      <CodeBlock language="jsx" title="Testing with react-hook-form">
{`import { useForm } from 'react-hook-form'

function ContactForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
        Name
        <input {...register('name', { required: 'Name is required' })} />
        {errors.name && <p role="alert">{errors.name.message}</p>}
      </label>
      <label>
        Message
        <textarea
          {...register('message', { minLength: { value: 10, message: 'Too short' } })}
        />
        {errors.message && <p role="alert">{errors.message.message}</p>}
      </label>
      <button type="submit">Send</button>
    </form>
  )
}

test('shows required error for empty name', async () => {
  const user = userEvent.setup()
  render(<ContactForm onSubmit={vi.fn()} />)

  await user.click(screen.getByRole('button', { name: /send/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Name is required')
})

test('submits valid form', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<ContactForm onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText('Name'), 'Alice')
  await user.type(screen.getByLabelText('Message'), 'Hello, this is a test message.')
  await user.click(screen.getByRole('button', { name: /send/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Alice',
      message: 'Hello, this is a test message.',
    })
  })
})`}
      </CodeBlock>

      <InfoBox variant="note" title="Label Association">
        <p>
          Use <code>getByLabelText()</code> instead of <code>getByPlaceholderText()</code> or <code>getByTestId()</code>.
          This requires proper <code>&lt;label htmlFor&gt;</code> or wrapping <code>&lt;label&gt;</code> associations —
          which also improves real accessibility. Testing forces good a11y habits.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="How do you select a specific option in a select element using userEvent?"
        options={[
          "user.type(selectEl, 'option-value')",
          "user.selectOptions(selectEl, 'value')",
          "user.click(optionEl) after finding the option",
          "fireEvent.change(selectEl, { target: { value: 'value' } })"
        ]}
        correctIndex={1}
        explanation="userEvent.selectOptions(element, value) is the correct API for select elements. It simulates the full user interaction: focusing the select, opening the dropdown (mentally), and selecting the option. You can pass a string value, an array of values for multi-selects, or the option element itself."
      />

      <InteractiveChallenge
        question="When testing form submission, what is the best way to assert the submitted data?"
        options={[
          "Read the form's state directly from the component",
          "Pass a vi.fn() as onSubmit and assert it was called with the right arguments",
          "Check the DOM for values after submission",
          "Use a global variable set in the submit handler"
        ]}
        correctIndex={1}
        explanation="The cleanest approach is to pass a mock function (vi.fn() or jest.fn()) as the onSubmit prop and assert on what it was called with. This tests the contract between the form and its parent without coupling to internal state implementation. It also verifies that the data is correctly structured before sending to an API."
      />
    </LessonLayout>
  );
}
