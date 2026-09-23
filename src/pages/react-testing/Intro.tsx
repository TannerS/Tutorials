import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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
        Vite's React template does <em>not</em> ship a test runner — you add one yourself,
        and this section uses <strong>Jest</strong>. Internalise one thing before you
        start: <strong>Jest never reads your <code>vite.config.ts</code></strong>. It is a
        second, independent pipeline with its own module resolution and its own transform,
        so every job Vite was quietly doing for you — compiling TSX, turning a CSS import
        into an object, turning an SVG import into a URL string — has to be declared again
        in <code>jest.config.js</code>. Nearly every first-run failure in a Vite project is
        one of those three.
      </p>

      <FlowChart
        title="What Jest Does With One Test File"
        chart={"graph TD\n  T[npx jest] --> E[\"testEnvironment: jsdom<br/>window and document exist\"]\n  E --> S[\"setupFilesAfterEnv<br/>src/setupTests.ts\"]\n  S --> F[Load Counter.test.tsx]\n  F --> I{Import matched by moduleNameMapper?}\n  I -->|Yes| M[Swap in the stub module]\n  I -->|No| P{Inside node_modules?}\n  P -->|Yes| G[\"transformIgnorePatterns<br/>skipped, used as-is\"]\n  P -->|No| X[\"transform: babel-jest<br/>TSX to CommonJS\"]\n  M --> R[Run the test body]\n  G --> R\n  X --> R\n  style R fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        Four packages, four jobs. The runner, a DOM for it to render into, a TypeScript
        transform, and Testing Library itself.
      </p>

      <CodeBlock language="bash" title="Install Dependencies">
{`# The runner. Since Jest 28 the jsdom environment is a SEPARATE package —
# 'npm i -D jest' alone leaves testEnvironment: 'jsdom' unresolvable.
npm install -D jest jest-environment-jsdom

# TypeScript transform (Jest does not read vite.config.ts, so it needs its own).
# babel-jest, NOT ts-jest — see the version warning below before you pick.
npm install -D babel-jest @babel/core @babel/preset-env \\
               @babel/preset-react @babel/preset-typescript @types/jest

# Testing Library: renderer, custom matchers, interaction simulation
npm install -D @testing-library/react \\
               @testing-library/jest-dom \\
               @testing-library/user-event

# Stubs CSS / CSS-Module imports with a self-referencing object
npm install -D identity-obj-proxy`}
      </CodeBlock>

      <CodeBlock language="javascript" title="jest.config.js">
{`// A Vite project's package.json has "type": "module", so THIS FILE IS ESM —
// 'export default', not 'module.exports'. Naming it jest.config.ts instead
// fails with "'ts-node' is required for the TypeScript configuration files"
// unless you add ts-node; jest.config.cjs is the escape hatch if you want CJS.
export default {
  // Needs the jest-environment-jsdom package installed above.
  testEnvironment: 'jsdom',

  // setupFilesAfterEnv — AfterEnv, not AfterEach. Jest prints
  // "Unknown option ... probably a typing mistake" and ignores the key,
  // so the symptom is a missing matcher, not a config error.
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // babel-jest is Jest's built-in default transform, so this entry is only
  // needed if you override it elsewhere. It picks up babel.config.cjs.
  transform: {
    '^.+\\\\.[jt]sx?$': 'babel-jest',
  },

  // Vite resolves these natively; Jest hands them to the JS parser and dies
  // on the first '{'. Map them to stubs instead.
  moduleNameMapper: {
    '\\\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\\\.(svg|png|jpe?g|gif|webp|avif|woff2?)$': '<rootDir>/src/fileMock.ts',
  },
};`}
      </CodeBlock>

      <CodeBlock language="javascript" title="babel.config.cjs">
{`// .cjs, because package.json says "type": "module" and Babel's config loader
// expects CommonJS here. preset-typescript STRIPS types rather than checking
// them — that is the real trade below.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],  // no 'import React' needed
    '@babel/preset-typescript',
  ],
};`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why babel-jest and not ts-jest — a real version wall">
        <p>
          Most Jest+TypeScript guides reach for <code>ts-jest</code>. Today that will
          either fail outright or silently downgrade your compiler, because{' '}
          <code>ts-jest@29.4.12</code> declares its TypeScript peer as{' '}
          <code>&gt;=4.3 &lt;7</code>, and TypeScript is now <strong>7.0.2</strong>.
          Both outcomes were reproduced against the live registry:
        </p>
        <p>
          On an <strong>existing</strong> project already on TypeScript 7,{' '}
          <code>npm install -D ts-jest</code> hard-fails with{' '}
          <code>npm error code ERESOLVE</code> —{' '}
          <em>&quot;Could not resolve dependency: peer typescript@&quot;&gt;=4.3 &lt;7&quot;
          from ts-jest@29.4.12&quot;</em>. On a <strong>fresh</strong> project,{' '}
          <code>npm install -D ts-jest typescript</code> appears to succeed but quietly
          installs <code>typescript@6.0.3</code> — the newest version still under the
          ceiling — so you end up a major version behind without being told.
        </p>
        <p>
          <code>babel-jest</code> has no such constraint: the exact stack above installed
          and ran green against <code>typescript@7.0.2</code>. The trade is that
          preset-typescript only strips types, so Jest will not typecheck your tests —
          run <code>tsc --noEmit</code> in CI for that, which is the better split anyway
          since it keeps the test run fast.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="src/fileMock.ts and src/setupTests.ts">
{`// src/fileMock.ts — stands in for every image and font import
export default 'test-file-stub';


// src/setupTests.ts — runs once per test file, after the environment is up.
// Registers toBeInTheDocument(), toHaveValue(), toBeDisabled(), etc.
import '@testing-library/jest-dom';

// The bare path is the current one. '@testing-library/jest-dom/extend-expect'
// was removed — jest-dom 7 has no such export, and tsc reports
// "TS2882: Cannot find module or type declarations for side-effect import".
//
// The bare import needs a global 'expect' to attach to, which Jest provides by
// default. If you set injectGlobals: false it throws
// "ReferenceError: expect is not defined" — use the subpath instead:
//   import '@testing-library/jest-dom/jest-globals';`}
      </CodeBlock>

      <p>
        With a <code>Counter.tsx</code> that imports both a CSS Module and an SVG, and a
        two-test <code>Counter.test.tsx</code> beside it, that config gives:
      </p>

      <CodeBlock language="text" title="Actual output — npx jest (Jest 30.5.2, babel-jest 30.5.2, RTL 16.3.3)">
{`Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        4.817 s
Ran all test suites.

# Re-run, with Jest's cache warm:
Time:        0.401 s, estimated 3 s`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Four Failures You Will Hit First — and Their Exact Error Strings">
        <p>
          Each of these was produced by deleting one piece of the config above and
          rerunning. Learn the strings; they are the fastest route from symptom to cause.
        </p>
        <ul>
          <li>
            <strong>No <code>jest-environment-jsdom</code>:</strong>{' '}
            <em>&ldquo;Test environment jest-environment-jsdom cannot be found&rdquo;</em>,
            followed by Jest's own hint — <em>&ldquo;As of Jest 28
            &lsquo;jest-environment-jsdom&rsquo; is no longer shipped by default, make sure
            to install it separately.&rdquo;</em>
          </li>
          <li>
            <strong>No <code>moduleNameMapper</code>:</strong>{' '}
            <em>&ldquo;Jest encountered an unexpected token&rdquo;</em> pointing at your
            stylesheet, with <code>SyntaxError: Unexpected token &apos;.&apos;</code> under
            a caret on the first CSS selector. Jest tried to run the CSS as JavaScript.
          </li>
          <li>
            <strong><code>setupFilesAfterEach</code> instead of{' '}
            <code>setupFilesAfterEnv</code>:</strong> a{' '}
            <em>Validation Warning: Unknown option</em>, then{' '}
            <code>TypeError: expect(...).toBeInTheDocument is not a function</code>. The
            setup file simply never ran.
          </li>
          <li>
            <strong>An ESM-only dependency:</strong>{' '}
            <em>&ldquo;Must use import to load ES Module&rdquo;</em>. Jest's test
            environment requires CommonJS, and <code>transformIgnorePatterns</code> defaults
            to skipping all of <code>node_modules</code>. Opt the one offender back in with
            a negative lookahead —{' '}
            <code>transformIgnorePatterns: ['/node_modules/(?!(nanoid)/)']</code> — and give
            it a transform that matches <code>.js</code>, since the{' '}
            <code>^.+\.tsx?$</code> pattern above will not touch it.
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          One more, specific to type-checking: because <code>tsc</code> really checks types, a
          CSS-Module or SVG import fails with{' '}
          <code>TS2307: Cannot find module &apos;./Counter.module.css&apos;</code> even
          once <code>moduleNameMapper</code> has fixed the <em>runtime</em>. The mapper
          satisfies the loader, not the compiler. The ambient declarations you need already
          ship with Vite — keep the generated{' '}
          <code>src/vite-env.d.ts</code> containing{' '}
          <code>{'/// <reference types="vite/client" />'}</code> inside your{' '}
          <code>tsconfig.json</code>'s <code>include</code>.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="ts-jest or babel-jest? Both Work — They Fail Differently">
        <p>
          Jest supports two TypeScript transforms and the choice is a real one.{' '}
          <code>ts-jest</code> runs the compiler, so type errors fail the test run — a test
          that passes proves the types line up too. <code>babel-jest</code> with{' '}
          <code>@babel/preset-typescript</code> only <em>strips</em> the annotations. It is
          measurably faster and never argues with your tsconfig, but it will happily run a
          file <code>tsc</code> would reject, so you need{' '}
          <code>tsc --noEmit</code> wired into CI separately.
        </p>
        <p style={{ marginBottom: 0 }}>
          This section standardises on <code>babel-jest</code>, and the deciding factor is
          availability rather than preference: <code>ts-jest</code> is pinned to the
          compiler&apos;s internal API and lags new TypeScript majors, so on TypeScript 7 it
          cannot be installed at all (see the version wall above). Babel never loads the
          compiler, so it is indifferent to which major you are on. If you are pinned to
          TypeScript 6 or earlier and want type-checked test runs, <code>ts-jest</code> is a
          reasonable choice — swap the transform to{' '}
          <code>{"{ '^.+\\\\.tsx?$': 'ts-jest' }"}</code> and drop the Babel packages.
          Everything else in this config stays identical.
        </p>
      </InfoBox>

      <h2>The render Function</h2>
      <p>
        <code>render()</code> mounts your component into a virtual DOM (jsdom) and
        returns an object of query utilities scoped to that render. You can use
        those, but prefer <code>screen</code>, imported directly from the library:
        its queries run against <code>document.body</code>, so there is nothing to
        destructure, nothing to thread through helper functions, and no stale
        reference if a test renders more than once. The RTL docs treat{' '}
        <code>screen</code> as the default for exactly this reason.
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

      <InfoBox variant="note" title="Vocabulary: What jest.fn() Actually Is">
        <p>
          That <code>jest.fn()</code> above appeared without introduction, and the
          words around it get used loosely everywhere you will read about testing.
          The umbrella term is <strong>test double</strong> — any stand-in you put in
          place of a real dependency, the way a stunt double stands in for an actor.
          The varieties worth distinguishing:
        </p>
        <ul>
          <li>
            <strong>Stub</strong> — returns canned answers. It exists so the code
            under test can run.{' '}
            <code>jest.fn().mockReturnValue(42)</code>.
          </li>
          <li>
            <strong>Spy</strong> — records how it was called (arguments, call count)
            while leaving behaviour alone. <code>jest.spyOn(obj, 'method')</code>{' '}
            wraps a <em>real</em> method so it still runs, but you can now assert on
            it.
          </li>
          <li>
            <strong>Mock</strong> — strictly, a double you assert{' '}
            <em>against</em>: the expectation of how it should be called is part of
            the test. <code>expect(handleSubmit).toHaveBeenCalledWith(...)</code> is
            using the double as a mock.
          </li>
          <li>
            <strong>Fake</strong> — a real, working implementation that is simply
            unsuitable for production: an in-memory database, or MSW standing in for
            your HTTP API.
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          In practice <code>jest.fn()</code> is all four at
          once — it records calls <em>and</em> can be given a return value — which is
          why nobody is careful about the terms. Interviewers do ask for the spy/mock
          distinction, though, and the short answer is: <strong>a spy observes, a mock
          asserts.</strong> The RTL-specific guidance is to reach for doubles as
          rarely as you can. Every double is a claim that the real thing behaves a
          certain way, and that claim is not itself tested.
        </p>
      </InfoBox>

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
        RTL unmounts everything it rendered after each test automatically — it registers
        its own <code>afterEach</code> on import, so under Jest's default{' '}
        <code>injectGlobals: true</code> there is nothing for you to wire up. Two tests
        that each call <code>render()</code> see only their own DOM. The one case that
        needs the manual call is <code>injectGlobals: false</code>, where there is no
        global <code>afterEach</code> for RTL to find.
      </p>

      <CodeBlock language="jsx" title="Manual Cleanup (rarely needed)">
{`import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});`}
      </CodeBlock>

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
