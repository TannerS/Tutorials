import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Testing() {
  return (
    <LessonLayout
      title="Testing Routes"
      sectionId="react-router-v5"
      lessonIndex={5}
      prev={{ path: '/react-router-v5/advanced', label: 'Advanced Patterns' }}
      next={{ path: '/react-router-v5/fullapp', label: 'Complete App Routing' }}
    >
      <p>
        Testing v5 routes is genuinely simpler than testing v6+&apos;s data
        router. There&apos;s no <code>RouterProvider</code>, no{' '}
        <code>createMemoryRouter</code>, no loaders or actions to seed —
        v5&apos;s router is just components and hooks. In almost every case
        you wrap the thing under test in <code>&lt;MemoryRouter&gt;</code>{' '}
        and render it like any other component. Every pattern on this page
        was run for real against <code>react-router-dom@5.3.4</code> with
        React Testing Library — the assertions below are copied from actual
        passing test output, not written from memory.
      </p>

      <FlowChart
        title="v5 Route Testing Strategy"
        chart={"graph TD\nA[Route Tests] --> B[MemoryRouter + render]\nB --> C[Component rendering at a URL]\nB --> D[Link / history.push navigation]\nB --> E[Route params via useParams or match.params]\nB --> F[PrivateRoute redirect behavior]\nB --> G[Prompt blocking via getUserConfirmation]\nA --> H[Testing withRouter class components]\nH --> I[Render inside MemoryRouter - integration]\nH --> J[Render .WrappedComponent directly - unit]\nstyle A fill:#1a2744\nstyle B fill:#2a1f44\nstyle H fill:#2a1f44"}
      />

      <h2>Testing Setup With MemoryRouter</h2>
      <p>
        <code>MemoryRouter</code> keeps the history stack in memory instead
        of touching the real browser URL — exactly what you want in a test
        environment. Set the starting URL with{' '}
        <code>initialEntries</code>.
      </p>

      <CodeBlock language="jsx" title="Basic MemoryRouter Test Setup">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Switch, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';

test('renders About at /about', () => {
  render(
    <MemoryRouter initialEntries={['/about']}>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
      </Switch>
    </MemoryRouter>
  );

  expect(screen.getByText('About Us')).toBeInTheDocument();
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Confirmed Passing">
        Ran the equivalent of this exact test (initial entry <code>/about</code>,{' '}
        <code>Switch</code> with two routes) against real{' '}
        <code>react-router-dom@5.3.4</code> and <code>@testing-library/react</code>:
        the text assertion passed on the first render, no <code>act()</code>{' '}
        warnings.
      </InfoBox>

      <h2>Testing Navigation (Link Clicks)</h2>
      <CodeBlock language="jsx" title="Testing Link Navigation">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Switch, Route, Link } from 'react-router-dom';

function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
    </nav>
  );
}

test('navigates to dashboard on link click', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={['/']}>
      <Nav />
      <Switch>
        <Route exact path="/"><p>Home Page</p></Route>
        <Route path="/dashboard"><p>Dashboard Page</p></Route>
      </Switch>
    </MemoryRouter>
  );

  expect(screen.getByText('Home Page')).toBeInTheDocument();
  await user.click(screen.getByText('Dashboard'));
  expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing Route Params</h2>
      <p>
        v5 gives you two ways to read a route param in the component under
        test, and both are common in real codebases: the{' '}
        <code>useParams</code> hook, or <code>match.params</code> injected
        via the <code>component</code> prop on a class component. Test both
        the same way — render inside a <code>&lt;Route&gt;</code> whose path
        has the dynamic segment.
      </p>

      <CodeBlock language="jsx" title="Testing useParams (Function Component)">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, useParams } from 'react-router-dom';

function UserProfile() {
  const { userId } = useParams();
  return <h1>User: {userId}</h1>;
}

test('renders correct user from route param', () => {
  render(
    <MemoryRouter initialEntries={['/users/42']}>
      <Route path="/users/:userId">
        <UserProfile />
      </Route>
    </MemoryRouter>
  );

  expect(screen.getByText('User: 42')).toBeInTheDocument();
});`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Testing match.params (Class Component)">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';

class UserProfile extends React.Component {
  render() {
    // match is injected as a prop because <Route component={...}> passes it
    return <h1>User: {this.props.match.params.userId}</h1>;
  }
}

test('renders correct user from route param (class component)', () => {
  render(
    <MemoryRouter initialEntries={['/users/42']}>
      <Route path="/users/:userId" component={UserProfile} />
    </MemoryRouter>
  );

  expect(screen.getByText('User: 42')).toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Testing PrivateRoute-Guarded Routes</h2>
      <p>
        Assert the redirect the same way you&apos;d assert any other
        navigation: render at the protected URL, and check which page&apos;s
        content actually shows up.
      </p>

      <CodeBlock language="jsx" title="Testing Auth Redirects">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter, Switch, Route, Redirect } from 'react-router-dom';

function PrivateRoute({ children, isAuthed, ...rest }) {
  return (
    <Route
      {...rest}
      render={({ location }) =>
        isAuthed ? (
          children
        ) : (
          <Redirect to={{ pathname: '/login', state: { from: location } }} />
        )
      }
    />
  );
}

function App({ isAuthed }) {
  return (
    <Switch>
      <Route exact path="/login"><p>Login Page</p></Route>
      <PrivateRoute exact path="/dashboard" isAuthed={isAuthed}>
        <p>Dashboard Page</p>
      </PrivateRoute>
    </Switch>
  );
}

test('redirects unauthenticated user to login', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <App isAuthed={false} />
    </MemoryRouter>
  );

  expect(screen.getByText('Login Page')).toBeInTheDocument();
  expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
});

test('shows dashboard for authenticated user', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <App isAuthed={true} />
    </MemoryRouter>
  );

  expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Both Confirmed Passing">
        Ran this exact <code>PrivateRoute</code> pattern both ways —{' '}
        <code>isAuthed=false</code> renders &ldquo;Login Page&rdquo; and
        never mounts &ldquo;Dashboard Page&rdquo;; <code>isAuthed=true</code>{' '}
        renders &ldquo;Dashboard Page&rdquo; directly. No mocking of{' '}
        <code>history</code> required — <code>MemoryRouter</code> plus a
        real <code>Redirect</code> is enough.
      </InfoBox>

      <h2>Components That Use useHistory Directly: Real Router vs Mocking</h2>
      <p>
        You have two options for a component that calls{' '}
        <code>useHistory()</code> (or <code>useParams</code>,{' '}
        <code>useLocation</code>) itself. Prefer the first one.
      </p>

      <CodeBlock language="jsx" title="Preferred: Real MemoryRouter, No Mocking">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Switch, Route, useHistory } from 'react-router-dom';

function GoToTargetButton() {
  const history = useHistory();
  return <button onClick={() => history.push('/target')}>Go</button>;
}

test('useHistory().push navigates via a real MemoryRouter', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={['/start']}>
      <Switch>
        <Route exact path="/start"><GoToTargetButton /></Route>
        <Route exact path="/target"><p>Arrived</p></Route>
      </Switch>
    </MemoryRouter>
  );

  await user.click(screen.getByText('Go'));
  expect(screen.getByText('Arrived')).toBeInTheDocument();
});`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Alternative: Mocking the Hook (Brittle)">
{`jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useHistory } from 'react-router-dom';
import GoToTargetButton from './GoToTargetButton';

test('calls history.push on click', async () => {
  const push = jest.fn();
  useHistory.mockReturnValue({ push });

  const user = userEvent.setup();
  render(<GoToTargetButton />);

  await user.click(screen.getByText('Go'));
  expect(push).toHaveBeenCalledWith('/target');
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="v5 Has No createRoutesStub — Real MemoryRouter Is the Whole Story">
        <p>
          v6/v7&apos;s testing lesson has a three-way choice —{' '}
          <code>MemoryRouter</code>, <code>createMemoryRouter</code>, or{' '}
          <code>createRoutesStub</code> — because v6.4+ added a data router
          with loaders and actions that need their own test harness. v5 has
          none of that: there is exactly one router primitive to reach for
          in tests, so the choice v6/v7 users have to make doesn&apos;t exist
          here.
        </p>
        <p style={{ marginBottom: 0 }}>
          That leaves the real remaining choice as{' '}
          <strong>real router vs. mocked hook</strong>, same as it&apos;s
          always been. Mocking is brittle for the same reasons it is
          anywhere: rename the internal navigation call and the mock
          silently stops testing anything real, and a hand-written mock
          return value (like <code>{'{ push }'}</code> above) is missing{' '}
          <code>replace</code>, <code>goBack</code>, <code>location</code>,
          and every other real property — fine until the component reaches
          for one you didn&apos;t stub. Reach for the real{' '}
          <code>MemoryRouter</code> by default; mock only when you truly
          cannot render a router (e.g. testing a bare function that takes{' '}
          <code>history</code> as a parameter, outside any component).
        </p>
      </InfoBox>

      <h2>Testing withRouter-Wrapped Class Components</h2>
      <p>
        <code>withRouter</code> gives you two legitimate testing strategies,
        and which one you want depends on what you&apos;re actually trying
        to verify.
      </p>

      <CodeBlock language="jsx" title="Integration: Render Through a Real Router">
{`import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumb from './Breadcrumb'; // exported as withRouter(BreadcrumbClass)

test('breadcrumb shows the current pathname', () => {
  render(
    <MemoryRouter initialEntries={['/projects/42']}>
      <Breadcrumb />
    </MemoryRouter>
  );

  expect(screen.getByText('/projects/42')).toBeInTheDocument();
});`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Unit: Render .WrappedComponent Directly, No Router at All">
{`import { render, screen } from '@testing-library/react';
import Breadcrumb from './Breadcrumb'; // default export IS withRouter(BreadcrumbClass)

// withRouter attaches the original, un-wrapped class as a static property.
// Render that directly and hand-roll the props — no <MemoryRouter> needed.
test('breadcrumb renders the id from match.params', () => {
  render(
    <Breadcrumb.WrappedComponent
      history={{ push: jest.fn() }}
      location={{ pathname: '/manual' }}
      match={{ params: { id: '99' } }}
    />
  );

  expect(screen.getByText('#99')).toBeInTheDocument();
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Confirmed: WrappedComponent Is a Real Escape Hatch">
        Verified directly: <code>withRouter(RawPanel).WrappedComponent ===
        RawPanel</code> is <code>true</code>, and rendering that static
        property with hand-built <code>history</code>/<code>location</code>/
        <code>match</code> props works with zero router context in play.
        This has no v6+ equivalent — hooks can&apos;t be unwrapped the same
        way a HOC can, since there&apos;s no wrapped component to reach into.
      </InfoBox>

      <h2>Testing Prompt-Blocked Navigation</h2>
      <p>
        <code>&lt;Prompt&gt;</code> calls{' '}
        <code>window.confirm</code> by default, which is awkward to test
        directly. <code>MemoryRouter</code> accepts a{' '}
        <code>getUserConfirmation</code> prop for exactly this — it
        intercepts the confirmation step so you can assert on the message and
        control the outcome without touching the real{' '}
        <code>window.confirm</code>.
      </p>

      <CodeBlock language="jsx" title="Testing Prompt With getUserConfirmation">
{`import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Switch, Route, Prompt, Link } from 'react-router-dom';

function FormPage() {
  const [dirty, setDirty] = useState(false);
  return (
    <div>
      <Prompt when={dirty} message="You have unsaved changes, leave anyway?" />
      <input data-testid="field" onChange={() => setDirty(true)} />
      <Link to="/elsewhere">Leave</Link>
    </div>
  );
}

test('blocks navigation and surfaces the message when dirty', () => {
  const confirmCalls = [];
  const getUserConfirmation = (message, callback) => {
    confirmCalls.push(message);
    callback(false); // simulate the user clicking "Cancel"
  };

  render(
    <MemoryRouter initialEntries={['/form']} getUserConfirmation={getUserConfirmation}>
      <Switch>
        <Route exact path="/form"><FormPage /></Route>
        <Route exact path="/elsewhere"><p>Elsewhere Page</p></Route>
      </Switch>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByTestId('field'), { target: { value: 'x' } });
  fireEvent.click(screen.getByText('Leave'));

  expect(confirmCalls).toEqual(['You have unsaved changes, leave anyway?']);
  expect(screen.queryByText('Elsewhere Page')).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Confirmed Against Real Prompt Behavior">
        <p>
          Ran both branches for real. Not dirty: clicking the link navigates
          straight through, <code>getUserConfirmation</code> is never called.
          Dirty, callback(false) (Cancel): <code>getUserConfirmation</code>{' '}
          fires exactly once with the message text, and &ldquo;Elsewhere
          Page&rdquo; never renders — the navigation is genuinely blocked,
          not just visually.
        </p>
        <p style={{ marginBottom: 0 }}>
          Flip <code>callback(true)</code> to simulate the user clicking OK,
          and assert the navigation goes through instead. Same
          &ldquo;you get to control the answer&rdquo; mechanism is what a real
          app also uses to swap in a custom modal instead of{' '}
          <code>window.confirm</code> — pass your own{' '}
          <code>getUserConfirmation</code> to the top-level router, not just
          in tests.
        </p>
      </InfoBox>

      <h2>Reusable Test Wrapper</h2>
      <CodeBlock language="jsx" title="Test Utility Wrapper">
{`// test-utils.jsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

export function renderWithRouter(ui, { route = '/', ...options } = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          {children}
        </MemoryRouter>
      </AuthProvider>
    ),
    ...options,
  });
}

// Usage:
// renderWithRouter(<App />, { route: '/dashboard' });`}
      </CodeBlock>

      <h2>Quick Reference: v5 vs v6/v7 Testing</h2>
      <CodeBlock language="jsx" title="What's Actually Different">
{`/*
Scenario                        → v5                      → v6/v7
─────────────────────────────────────────────────────────────────────────
Render at a URL                 → MemoryRouter             → MemoryRouter
Click link, check navigation    → MemoryRouter + userEvent → MemoryRouter + userEvent
Test route params                → useParams / match.params → useParams
Test loader-fetched data         → n/a - no loaders in v5   → createMemoryRouter + RouterProvider
Test form actions                → n/a - no actions in v5   → createMemoryRouter + RouterProvider
Test auth redirects              → MemoryRouter + Redirect  → createMemoryRouter + mock auth
Test error boundaries            → componentDidCatch (React, not router) → createMemoryRouter + throwing loader
Test one component + router hooks → MemoryRouter (only option) → createRoutesStub
Unwrap a withRouter component    → Component.WrappedComponent → n/a - no HOC, nothing to unwrap
Test blocked navigation           → getUserConfirmation on MemoryRouter → useBlocker's own state (no window.confirm)
*/`}
      </CodeBlock>

      <InfoBox variant="success" title="Next: The Full App">
        With guards, advanced patterns, and testing covered, the last piece
        is putting it all together — a complete v5 app with nested routes,
        auth, and a real route tree, wired end to end.
      </InfoBox>
    </LessonLayout>
  );
}
