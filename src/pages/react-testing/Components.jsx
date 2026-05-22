import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Components() {
  return (
    <LessonLayout
      title="Testing Components"
      sectionId="react-testing"
      lessonIndex={1}
      prev={{ path: '/react-testing/intro', label: 'RTL Fundamentals' }}
      next={{ path: '/react-testing/hooks', label: 'Testing Custom Hooks' }}
    >
      <h2>Testing Rendering Output</h2>
      <p>
        The most basic test verifies a component renders the right content. Render
        it, then query for what the user should see.
      </p>

      <CodeBlock language="jsx" title="Testing Basic Rendering">
{`import { render, screen } from '@testing-library/react';
import PageHeader from './PageHeader';

test('renders the title and subtitle', () => {
  render(<PageHeader title="Dashboard" subtitle="Welcome back" />);

  expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Props</h2>
      <p>
        Test that different prop combinations produce the expected output. Focus
        on what changes visually, not internal state.
      </p>

      <CodeBlock language="jsx" title="Testing Prop Variations">
{`import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  test('renders label text', () => {
    render(<Badge label="New" />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  test('applies variant class for styling', () => {
    render(<Badge label="Error" variant="danger" />);
    expect(screen.getByText('Error')).toHaveClass('badge-danger');
  });

  test('renders default variant when none provided', () => {
    render(<Badge label="Info" />);
    expect(screen.getByText('Info')).toHaveClass('badge-default');
  });
});`}
      </CodeBlock>

      <h2>Conditional Rendering</h2>

      <CodeBlock language="jsx" title="Testing Conditional Display">
{`import { render, screen } from '@testing-library/react';
import Alert from './Alert';

describe('Alert', () => {
  test('shows message when visible is true', () => {
    render(<Alert message="Saved!" visible={true} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Saved!');
  });

  test('does not render when visible is false', () => {
    render(<Alert message="Saved!" visible={false} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('shows close button only when dismissible', () => {
    render(<Alert message="Note" visible={true} dismissible={true} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="queryBy for Absence Assertions">
        Use <code>queryByRole</code> / <code>queryByText</code> to assert something
        is NOT rendered. <code>getBy</code> throws immediately if the element is
        missing, which isn't what you want for negative assertions.
      </InfoBox>

      <h2>Testing Lists</h2>

      <CodeBlock language="jsx" title="Testing Rendered Lists">
{`import { render, screen } from '@testing-library/react';
import TodoList from './TodoList';

const items = [
  { id: 1, text: 'Buy milk', done: false },
  { id: 2, text: 'Write tests', done: true },
  { id: 3, text: 'Deploy app', done: false },
];

test('renders all todo items', () => {
  render(<TodoList items={items} />);
  const listItems = screen.getAllByRole('listitem');
  expect(listItems).toHaveLength(3);
});

test('shows completed items with strikethrough', () => {
  render(<TodoList items={items} />);
  expect(screen.getByText('Write tests')).toHaveStyle({
    textDecoration: 'line-through',
  });
});

test('renders empty state when no items', () => {
  render(<TodoList items={[]} />);
  expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Event Handlers</h2>

      <FlowChart
        title="Event Testing Flow"
        chart={"graph LR\n  R[Render with mock handler] --> F[Find interactive element]\n  F --> I[Simulate user action]\n  I --> A[Assert handler called]\n  A --> V[Verify call arguments]"}
      />

      <CodeBlock language="jsx" title="Testing Click, Type, and Select Events">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from './TaskForm';

describe('TaskForm events', () => {
  test('calls onAdd when button is clicked', async () => {
    const user = userEvent.setup();
    const handleAdd = jest.fn();
    render(<TaskForm onAdd={handleAdd} />);

    await user.type(screen.getByLabelText(/task name/i), 'New task');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd).toHaveBeenCalledWith('New task');
  });

  test('handles select change', async () => {
    const user = userEvent.setup();
    const handleFilter = jest.fn();
    render(<TaskForm onFilterChange={handleFilter} />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: /priority/i }),
      'high'
    );

    expect(handleFilter).toHaveBeenCalledWith('high');
  });

  test('clears input after submission', async () => {
    const user = userEvent.setup();
    render(<TaskForm onAdd={jest.fn()} />);

    const input = screen.getByLabelText(/task name/i);
    await user.type(input, 'New task');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(input).toHaveValue('');
  });
});`}
      </CodeBlock>

      <h2>Testing State Changes</h2>

      <CodeBlock language="jsx" title="Testing Component State Transitions">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TogglePanel from './TogglePanel';

test('toggles content visibility on button click', async () => {
  const user = userEvent.setup();
  render(<TogglePanel title="Details" content="Hidden content" />);

  // Initially hidden
  expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();

  // Click to expand
  await user.click(screen.getByRole('button', { name: /show details/i }));
  expect(screen.getByText('Hidden content')).toBeInTheDocument();

  // Click to collapse
  await user.click(screen.getByRole('button', { name: /hide details/i }));
  expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Error and Loading States</h2>

      <CodeBlock language="jsx" title="Error and Loading States">
{`import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile';

test('shows loading spinner while data is fetching', () => {
  render(<UserProfile isLoading={true} user={null} error={null} />);

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.queryByRole('heading')).not.toBeInTheDocument();
});

test('shows error message on failure', () => {
  render(<UserProfile isLoading={false} user={null} error="Network error" />);

  expect(screen.getByRole('alert')).toHaveTextContent('Network error');
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
});

test('renders user data on success', () => {
  const user = { name: 'Alice', email: 'alice@example.com' };
  render(<UserProfile isLoading={false} user={user} error={null} />);

  expect(screen.getByRole('heading', { name: /alice/i })).toBeInTheDocument();
  expect(screen.getByText('alice@example.com')).toBeInTheDocument();
});`}
      </CodeBlock>

      <InfoBox variant="info" title="Snapshot Testing: Use Sparingly">
        Snapshot tests (<code>toMatchSnapshot()</code>) capture the rendered output
        and compare it to a stored file. They're useful for detecting unintentional
        changes but are brittle and create noisy diffs. Prefer explicit assertions
        over snapshots for most cases.
      </InfoBox>

      <h2>Testing with Context Providers</h2>
      <p>
        Components that consume React Context need providers in tests. Create a
        custom render wrapper that includes all your app's providers.
      </p>

      <CodeBlock language="jsx" title="Custom Render with Providers">
{`// test-utils.jsx
import { render } from '@testing-library/react';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';

const AllProviders = ({ children }) => (
  <ThemeProvider initialTheme="light">
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
);

const customRender = (ui, options) =>
  render(ui, { wrapper: AllProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Using Custom Render">
{`// UserAvatar.test.jsx
import { render, screen } from '../test-utils'; // NOT @testing-library/react
import UserAvatar from './UserAvatar';

test('shows user initial from auth context', () => {
  render(<UserAvatar />);
  expect(screen.getByText('A')).toBeInTheDocument(); // First letter of user name
});`}
      </CodeBlock>

      <h2>Testing Components with Children</h2>

      <CodeBlock language="jsx" title="Testing Composition and Children">
{`import { render, screen } from '@testing-library/react';
import Card from './Card';

test('renders children inside card', () => {
  render(
    <Card>
      <h2>Card Title</h2>
      <p>Card body content</p>
    </Card>
  );

  expect(screen.getByRole('heading', { name: /card title/i })).toBeInTheDocument();
  expect(screen.getByText(/card body content/i)).toBeInTheDocument();
});

test('renders header and footer slots', () => {
  render(
    <Card
      header={<span>Custom Header</span>}
      footer={<button>Action</button>}
    >
      Body
    </Card>
  );

  expect(screen.getByText('Custom Header')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
});`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You need to test that clicking a delete button calls the onDelete handler with the item's ID. Which approach is best?"}
        options={[
          "Check that the component's internal state changes",
          "Spy on the component's useState call",
          "Pass a jest.fn() as onDelete, click the button, assert toHaveBeenCalledWith(id)",
          "Use a snapshot test to compare before and after"
        ]}
        correctIndex={2}
        explanation={"RTL encourages testing observable behavior. Pass a mock function, simulate the user action, and assert the callback was called with the correct arguments. Never reach into implementation details like internal state."}
        language="jsx"
      />

      <h2>Complete Example: UserCard</h2>

      <CodeBlock language="jsx" title="UserCard.test.jsx — Full Test Suite">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserCard from './UserCard';

const defaultUser = {
  id: 1,
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'Admin',
  avatar: '/avatars/alice.png',
};

describe('UserCard', () => {
  test('renders user information', () => {
    render(<UserCard user={defaultUser} />);

    expect(screen.getByRole('heading', { name: /alice johnson/i })).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /alice johnson/i })).toHaveAttribute(
      'src', '/avatars/alice.png'
    );
  });

  test('shows edit button for admin users', () => {
    render(<UserCard user={defaultUser} canEdit={true} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  test('hides edit button for read-only users', () => {
    render(<UserCard user={defaultUser} canEdit={false} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  test('calls onEdit with user id when edit is clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = jest.fn();

    render(<UserCard user={defaultUser} canEdit={true} onEdit={handleEdit} />);
    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(handleEdit).toHaveBeenCalledWith(1);
  });

  test('renders fallback avatar when none provided', () => {
    const userWithoutAvatar = { ...defaultUser, avatar: null };
    render(<UserCard user={userWithoutAvatar} />);

    expect(screen.getByText('AJ')).toBeInTheDocument(); // Initials fallback
  });
});`}
      </CodeBlock>

      <h2>Complete Example: SearchBar</h2>

      <CodeBlock language="jsx" title="SearchBar.test.jsx — Full Test Suite">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  test('renders with placeholder text', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('calls onSearch with query on submit', async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);

    await user.type(screen.getByRole('searchbox'), 'react testing');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(handleSearch).toHaveBeenCalledWith('react testing');
  });

  test('submits on Enter key', async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);

    await user.type(screen.getByRole('searchbox'), 'hooks{enter}');
    expect(handleSearch).toHaveBeenCalledWith('hooks');
  });

  test('does not submit empty query', async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);

    await user.click(screen.getByRole('button', { name: /search/i }));
    expect(handleSearch).not.toHaveBeenCalled();
  });

  test('clears input after search', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={jest.fn()} clearOnSubmit />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'query');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(input).toHaveValue('');
  });

  test('shows clear button when input has value', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={jest.fn()} />);

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'test');
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="Avoid Testing Implementation Details">
        Don't test internal state values, hook calls, or component instance methods.
        If you refactor from <code>useState</code> to <code>useReducer</code>,
        your tests should not break — because the user-facing behavior hasn't changed.
      </InfoBox>
    </LessonLayout>
  );
}
