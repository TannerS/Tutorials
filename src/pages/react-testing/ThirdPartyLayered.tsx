import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ThirdPartyLayered() {
  return (
    <LessonLayout
      title="Testing Layered & Third-Party Components"
      sectionId="react-testing"
      lessonIndex={8}
      prev={{ path: '/react-testing/best-practices', label: 'Best Practices & Anti-Patterns' }}
      next={{ path: '/react-testing/cheatsheet', label: '📋 React Testing Field Guide' }}
    >
      <p>
        Everything so far has tested components you wrote, two or three layers deep, made
        of DOM you control. Real application code is not like that. A screen is a
        container that owns state, four or five layers of wrappers between it and the
        thing you actually clicked, a global store nobody passes as a prop, and somewhere
        in the middle a 408-export data grid that measures itself against a viewport
        jsdom does not have.
      </p>
      <p>
        This lesson is about that. It assumes the earlier lessons: basic event handlers,
        props and context providers come from <em>Testing Components</em>; the custom
        render utility, data factories and page-object pattern come from{' '}
        <em>Testing Patterns &amp; CI</em>; the query ladder and the general anti-pattern
        catalogue come from <em>Best Practices &amp; Anti-Patterns</em>. None of that is
        repeated here. What is here is the decision-making those lessons do not cover, and
        a pile of measurements from actually running the thing.
      </p>

      <InfoBox variant="note" title="Every Number on This Page Was Measured">
        <p>
          Nothing below is from memory or from a library&apos;s marketing page. A scratch
          project was built and every claim executed against it. Several things I expected
          turned out to be false, and where that happened the page says so rather than
          repeating the folklore.
        </p>
        <CodeBlock language="text" title="The toolchain every output on this page came from">
{`node                        25.2.1
jest                        30.5.2
jest-environment-jsdom      30.5.2   (jsdom 26.1.0)
babel-jest                  30.5.2
@testing-library/react      16.3.3
@testing-library/user-event 14.6.7
@testing-library/jest-dom   7.0.1
react / react-dom           19.3.0
zustand                     5.0.15
ag-grid-community           36.2.0
ag-grid-react               36.2.0`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          The transform is <code>babel-jest</code> rather than <code>ts-jest</code>, because{' '}
          <code>ts-jest@29.4.12</code> still declares a peer ceiling of{' '}
          <code>{'typescript ">=4.3 <7"'}</code> while TypeScript is now at 7.0.2 — the{' '}
          <a href="/react-testing/intro">RTL Fundamentals</a> setup lesson has the two
          failure shapes and what to do about them.
        </p>
      </InfoBox>

      <h2>The Core Decision: Mock the Library, or Render It</h2>
      <p>
        This is the spine of the lesson, and it is not a style preference — get it wrong in
        either direction and the test is worthless. The honest framing is not
        &ldquo;mocking is bad&rdquo;. It is:{' '}
        <strong>a mock replaces a contract with your belief about that contract.</strong>{' '}
        That trade is sometimes excellent value and sometimes catastrophic, and which one
        depends entirely on what the test is trying to prove.
      </p>

      <FlowChart
        title="Mock it, or render it for real?"
        chart={"graph TD\n  A[\"You need a third-party component<br/>inside the tree under test\"] --> B{\"What is this test<br/>actually about?\"}\n  B -->|\"The library's own behaviour<br/>sorting, filtering, editing\"| X[\"Do not write this test.<br/>It is their suite, not yours.\"]\n  B -->|\"YOUR integration with it\"| C{\"Does it render DOM<br/>you can query?\"}\n  B -->|\"YOUR logic around it\"| M1[\"Mock it.<br/>Keep the props wiring live.\"]\n  C -->|\"No: canvas, WebGL,<br/>or a measured viewport\"| M2[\"Mock it.<br/>jsdom cannot produce the output.\"]\n  C -->|\"Yes, accessible roles\"| D{\"Does it work in jsdom<br/>once you await it?\"}\n  D -->|\"Yes\"| R[\"Render it for real.<br/>Assert on roles.\"]\n  D -->|\"Only with global shims<br/>(fake ResizeObserver, matchMedia)<br/>and fake timers everywhere\"| M3[\"Mock it.<br/>The shims are the untested part.\"]\n  style R fill:#1a3329,stroke:#4ade80\n  style X fill:#3b1a1a,stroke:#f87171\n  style M1 fill:#1a2744,stroke:#5b9cf6\n  style M2 fill:#1a2744,stroke:#5b9cf6\n  style M3 fill:#1a2744,stroke:#5b9cf6"}
      />

      <table>
        <thead>
          <tr>
            <th>Render it for real when&hellip;</th>
            <th>Mock it when&hellip;</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>It emits accessible DOM — <code>grid</code>, <code>row</code>, <code>gridcell</code>, <code>columnheader</code>, <code>option</code>, <code>dialog</code></td>
            <td>It draws to <code>&lt;canvas&gt;</code> or WebGL. jsdom has no 2D context, so there is literally nothing to assert on</td>
          </tr>
          <tr>
            <td>The question is &ldquo;did <em>my</em> config reach it?&rdquo; — column definitions, option lists, validation rules</td>
            <td>The question is about your own logic and the widget is just the trigger for it</td>
          </tr>
          <tr>
            <td>The question is &ldquo;did <em>its</em> callback reach <em>my</em> state?&rdquo;</td>
            <td>It needs geometry that jsdom refuses to produce and degrades to nothing usable rather than to a smaller version</td>
          </tr>
          <tr>
            <td>You are willing to <code>await</code>, because most of these libraries commit DOM asynchronously</td>
            <td>Making it work needs so many global shims that the shims become the thing under test</td>
          </tr>
          <tr>
            <td>It is the component the user is actually operating in this journey</td>
            <td>It is genuinely, measurably slow — <strong>measure this, do not assume it</strong> (the AG Grid timings below hold up, but only to about 600 rows, and the thing that decides it is not the one people expect)</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="The Third Option Everyone Forgets">
        <p style={{ marginBottom: 0 }}>
          There is a case that is neither: <strong>do not write the test</strong>. If the
          assertion is &ldquo;the grid sorts when I click the header&rdquo;, you are testing
          AG Grid. They have a bigger test suite for that than you will ever write, and your
          version of it breaks on every upgrade for reasons that are not bugs. Anti-pattern
          #10 in <em>Best Practices</em> is the general form of this; here it is the most
          common single mistake, because a heavy widget makes it feel like there must be
          something worth asserting.
        </p>
      </InfoBox>

      <h2>Testing Across Many Layers</h2>
      <p>
        A container owns some state. Five components down, a button changes it. Where do you
        point <code>render()</code>? There are two failure modes, and they are opposites, so
        you cannot avoid one by leaning harder away from the other.
      </p>

      <FlowChart
        title="Where to point render() in a deep tree"
        chart={"graph TD\n  P[\"Page\"] --> C[\"ListContainer<br/><b>owns the state</b>\"]\n  C --> R[\"Row\"]\n  R --> B[\"RowBody\"]\n  B --> A[\"RowActions<br/><b>the button lives here</b>\"]\n  C -.->|\"render here:<br/>real children, one state machine,<br/>failures still localise\"| G[\"THE PRACTICAL MIDDLE\"]\n  A -.->|\"render here too, separately:<br/>props in, callback out\"| L[\"LEAF UNIT TEST\"]\n  P -.->|\"render here and everything<br/>fails together, forever\"| T[\"TOO BROAD\"]\n  style G fill:#1a3329,stroke:#4ade80\n  style L fill:#1a3329,stroke:#4ade80\n  style T fill:#3b1a1a,stroke:#f87171\n  style C fill:#1a2744,stroke:#5b9cf6\n  style A fill:#1a2744,stroke:#5b9cf6"}
      />

      <h3>Trap 1: Mocking the Layers in Between</h3>
      <p>
        The instinct is to stub the intermediate components &ldquo;to keep the test
        focused&rdquo;. Here is what that actually costs. The component under test has a
        real bug — the leaf passes <code>row.name</code> where the container expects an id:
      </p>

      <CodeBlock language="jsx" title="RowActions.jsx — the bug is on the onClick line">
{`// RowActions.jsx
export default function RowActions({ row, onArchive }) {
  return <button onClick={() => onArchive(row.name)}>Archive {row.name}</button>;
  //                                       ^^^^^^^^ should be row.id
}

// Row.jsx — the intermediate layer
import RowActions from './RowActions';

export default function Row({ row, onArchive }) {
  return (
    <li>
      <span>{row.name}</span>
      <RowActions row={row} onArchive={onArchive} />
    </li>
  );
}

// RowList.jsx — the layer that owns the state
import { useState } from 'react';
import Row from './Row';

export default function RowList({ rows }) {
  const [archivedIds, setArchivedIds] = useState([]);
  const visible = rows.filter((r) => !archivedIds.includes(r.id));
  return (
    <div>
      <ul>
        {visible.map((r) => (
          <Row key={r.id} row={r} onArchive={(id) => setArchivedIds((a) => [...a, id])} />
        ))}
      </ul>
      <p>Showing {visible.length} of {rows.length}</p>
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="The over-mocked version — the test body is identical in both files">
{`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RowList from './RowList';

const rows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];

// "Just stubbing the middle layer so the test stays focused."
jest.mock('./Row', () => ({
  __esModule: true,
  default: ({ row, onArchive }) => (
    <li>
      <span>{row.name}</span>
      <button onClick={() => onArchive(row.id)}>Archive {row.name}</button>
    </li>
  ),
}));

test('archiving a row removes it from the list', async () => {
  const user = userEvent.setup();
  render(<RowList rows={rows} />);
  expect(screen.getByText('Showing 2 of 2')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /archive alice/i }));
  expect(screen.getByText('Showing 1 of 2')).toBeInTheDocument();
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — same assertions, with and without the mock">
{`$ npx jest src/overmock-passes.test.jsx      # jest.mock('./Row')

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total


$ npx jest src/overmock-real.test.jsx        # identical test, real children

FAIL src/overmock-real.test.jsx
  ● archiving a row removes it from the list

    TestingLibraryElementError: Unable to find an element with the text:
    Showing 1 of 2.
      ...
      <p>
        Showing
        2
        of
        2
      </p>

      13 |   expect(screen.getByText('Showing 2 of 2')).toBeInTheDocument();
      14 |   await user.click(screen.getByRole('button', { name: /archive alice/i }));
    > 15 |   expect(screen.getByText('Showing 1 of 2')).toBeInTheDocument();`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> the stub re-implemented the exact line that was broken. The
        mock was written by someone who knew what the code was <em>supposed</em> to do, so
        of course it did that. The passing test asserts that
        &ldquo;<code>setArchivedIds</code> filters by id when handed an id&rdquo; — a fact
        about <code>Array.prototype.filter</code>. Every mocked intermediate layer is a
        place a bug can hide, and the deeper the tree, the more of them there are.
      </p>

      <h3>Trap 2: The Full-Tree Test Whose Failures Mean Nothing</h3>
      <p>
        Over-correcting produces the other problem. Render the whole page, click through
        four features, and you get one test that goes red for thirty different causes. Look
        at the failure above again: it tells you a paragraph did not say{' '}
        <code>Showing 1 of 2</code>. It does <em>not</em> tell you that{' '}
        <code>RowActions</code> passed the wrong argument. With three layers that is a short
        hunt. With a page, a router, a query client and a grid in the tree, it is an
        afternoon — and the test will be quarantined within a month.
      </p>
      <p>
        That is the real argument for <em>also</em> having the leaf test. Same bug, pointed
        at the leaf:
      </p>

      <CodeBlock language="jsx" title="The leaf test — props in, callback out">
{`import RowActions from './RowActions';

test('calls onArchive with the row id', async () => {
  const user = userEvent.setup();
  const onArchive = jest.fn();

  render(<RowActions row={{ id: 1, name: 'Alice' }} onArchive={onArchive} />);
  await user.click(screen.getByRole('button', { name: /archive alice/i }));

  expect(onArchive).toHaveBeenCalledWith(1);
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — the leaf test names the bug">
{`FAIL src/leaf-catches.test.jsx
  ● calls onArchive with the row id

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1
    Received: "Alice"

    Number of calls: 1`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Practical Rule">
        <p style={{ marginBottom: 0 }}>
          <strong>Render from the layer that owns the state, and let every child be
          real.</strong> That is one integrated behaviour per test, with a blast radius small
          enough to debug. Then add leaf tests only where the leaf has logic of its own worth
          pinning — argument shapes, formatting, conditional rendering, disabled states. The
          intermediate layers get tested for free, by being executed, which is the only kind
          of coverage worth having.
        </p>
      </InfoBox>

      <table>
        <thead>
          <tr>
            <th>Situation</th>
            <th>Point <code>render()</code> at&hellip;</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A click five layers down changes container state</td>
            <td>The container. Assert the visible consequence.</td>
          </tr>
          <tr>
            <td>A leaf has real logic — formatting, argument shaping, conditional output</td>
            <td>The leaf, with a <code>jest.fn()</code>. This is what unit tests are for.</td>
          </tr>
          <tr>
            <td>State lives in a store, not a prop</td>
            <td>Any subtree that reads it. Seed the store, assert the UI. No provider needed.</td>
          </tr>
          <tr>
            <td>A pure layout wrapper with no behaviour</td>
            <td>Nothing. It is exercised by its children&apos;s tests.</td>
          </tr>
          <tr>
            <td>A journey crossing several features and routes</td>
            <td>One or two of these total, at the page. Treat them as smoke tests — broad checks that the wiring holds together at all — not as the suite.</td>
          </tr>
        </tbody>
      </table>

      <h2>Click Handlers, Six Ways</h2>
      <p>
        In a layered codebase the same conceptual click arrives by half a dozen different
        routes, and people reach for <code>jest.fn()</code> by reflex for all of them. That
        reflex is right about twice. The rule that decides it:
      </p>

      <InfoBox variant="danger" title="When Is a Spy the Right Assertion?">
        <p>
          <code>expect(fn).toHaveBeenCalled()</code> is correct when the function is a{' '}
          <strong>boundary you are deliberately standing in for</strong> — a prop the
          component under test does not own and whose effect is therefore invisible from
          inside the render. In a leaf unit test, <code>onArchive</code> is exactly that:
          calling it <em>is</em> the component&apos;s entire observable output.
        </p>
        <p style={{ marginBottom: 0 }}>
          It is wrong the moment the effect <em>is</em> visible. If the handler is wired to
          real state and the row disappears, then <code>toHaveBeenCalled</code> proves
          strictly less than <code>not.toBeInTheDocument()</code> — it passes when the
          handler runs and then throws, when the state update is dropped, when the reducer
          mangles the payload. Same effort, weaker guarantee, and it breaks if you refactor
          the prop&apos;s name or arity.{' '}
          <strong>Spy at a mocked boundary; assert on the DOM everywhere else.</strong>
        </p>
      </InfoBox>

      <FlowChart
        title="Six routes from a click to your state — and what each one lets you assert"
        chart={"graph LR\n  CLICK([\"user.click\"]) --> P1[\"1. prop drilled<br/>through N layers\"]\n  CLICK --> P2[\"2. inline arrow<br/>in JSX\"]\n  CLICK --> P3[\"3. from context\"]\n  CLICK --> P4[\"4. Zustand action<br/>in a deep child\"]\n  CLICK --> P5[\"5. render prop:<br/>you pass a FUNCTION as children<br/>and it hands you the handler\"]\n  CLICK --> P6[\"6. library callback<br/>onCellClicked\"]\n  P1 --> UI[\"Assert the UI change<br/>render from the state owner\"]\n  P2 --> UI\n  P3 --> UI\n  P4 --> UI\n  P5 --> UI\n  P6 --> UI\n  P1 -.->|\"leaf test only\"| SPY[\"Assert the spy<br/>real mocked boundary\"]\n  P5 -.->|\"argument shape\"| SPY\n  P6 -.->|\"when the grid is mocked\"| SPY\n  style UI fill:#1a3329,stroke:#4ade80\n  style SPY fill:#1a2744,stroke:#5b9cf6"}
      />

      <h3>1 &amp; 2 &mdash; Drilled Through N Layers, and Inline in JSX</h3>
      <p>
        These are the same test, which is the point: an inline{' '}
        <code>{'onClick={() => setX(1)}'}</code> has no name and no identity, so there is
        nothing to spy on even if you wanted to. Drive it through the DOM and the drilled
        case works identically — which means a refactor from one to the other does not touch
        the test.
      </p>

      <CodeBlock language="jsx" title="Both variants, tested the same way — all assertions below pass">
{`// Handler drilled DrilledList -> DrilledRow -> RowBody -> RowActions
test('archiving hides the row and bumps the counter', async () => {
  const user = userEvent.setup();
  render(<DrilledList rows={rows} />);          // the layer that owns the state

  expect(screen.getByText('Archived: 0')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /archive alice/i }));

  // The assertion is the outcome, not the mechanism.
  expect(screen.queryByRole('button', { name: /archive alice/i })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /archive bob/i })).toBeInTheDocument();
  expect(screen.getByText('Archived: 1')).toBeInTheDocument();
});

// The leaf, separately — here the spy IS the contract
test('RowActions reports the row id', async () => {
  const user = userEvent.setup();
  const onArchive = jest.fn();
  render(<RowActions row={rows[0]} onArchive={onArchive} />);
  await user.click(screen.getByRole('button', { name: /archive alice/i }));
  expect(onArchive).toHaveBeenCalledTimes(1);
  expect(onArchive).toHaveBeenCalledWith(1);
});`}
      </CodeBlock>

      <h3>3 &mdash; A Handler That Comes From Context</h3>
      <p>
        Do not mock the provider and do not reach for <code>useContext</code> in the test.
        Render the real provider — it is your code, and it holds the state the handler
        mutates. <em>Testing Components</em> covers the all-providers wrapper; the only extra
        point here is that the provider is usually the right{' '}
        <code>render()</code> target, because it is the state owner.
      </p>

      <CodeBlock language="jsx" title="Real provider, assert the consequence — passes">
{`test('archiving through context updates the shared count', async () => {
  const user = userEvent.setup();
  render(
    <ArchiveProvider>
      {rows.map((r) => <ContextRowActions key={r.id} row={r} />)}
    </ArchiveProvider>
  );

  expect(screen.getByText('Archived via context: 0')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /archive bob/i }));
  expect(screen.getByText('Archived via context: 1')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /archive bob/i })).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Tempting Shortcut That Ruins the Test">
        Passing a hand-built value into the real provider —{' '}
        <code>{'<ArchiveContext.Provider value={{ archive: jest.fn() }}>'}</code> — looks
        like a clean seam and is the context version of Trap 1. You have replaced the
        provider&apos;s reducer with a stub, so the test can no longer fail when the reducer
        is wrong. Seed the provider with <em>initial state</em> instead (an{' '}
        <code>initialUser</code> / <code>initialItems</code> prop) and let its own logic run.
      </InfoBox>

      <h3>4 &mdash; An Action Living in a Zustand Store</h3>
      <p>
        A deep child calls <code>useSelectionStore((s) =&gt; s.toggle)</code>. Nothing was
        passed to it; there is no prop to spy on and no provider to wrap. This is the case
        that pushes people toward mocking the store module, and it is the case where that is
        least necessary — the store is trivially seedable and the UI is trivially assertable.
        Full treatment in the next section; the shape of the test is:
      </p>

      <CodeBlock language="jsx" title="No provider, no spy — seed or drive the store and read the DOM (passes)">
{`test('selecting rows updates the toolbar and enables Clear', async () => {
  const user = userEvent.setup();
  render(<SelectionPanel rows={rows} />);   // <SelectionToolbar/> + <MiddleLayer/> -> <DeepCheckbox/>

  await user.click(screen.getByRole('checkbox', { name: 'Alice' }));
  await user.click(screen.getByRole('checkbox', { name: 'Bob' }));
  expect(screen.getByText('2 selected')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /clear selection/i }));
  expect(screen.getByText('0 selected')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /clear selection/i })).toBeDisabled();
});`}
      </CodeBlock>
      <p>
        Note what that test proves in one pass: the deep child reached the action, the action
        mutated the store correctly, the toolbar&apos;s selector re-subscribed, and the
        disabled state derives from the count. A{' '}
        <code>expect(toggle).toHaveBeenCalledWith(1)</code> against a mocked store proves the
        first of those four and nothing else.
      </p>

      <h3>5 &mdash; Render Prop / Children-as-a-Function</h3>
      <p>
        Here the handler travels <em>up</em>: the wrapper hands it to a function you supply.
        Two legitimate tests, and they answer different questions.
      </p>

      <CodeBlock language="jsx" title="Both of these pass">
{`// (a) Behaviour: supply a realistic child and drive it. Prefer this one.
test('toggling through the render prop opens the panel', async () => {
  const user = userEvent.setup();
  render(
    <Expandable>
      {({ open, toggle }) => (
        <button onClick={toggle} aria-expanded={open}>Details</button>
      )}
    </Expandable>
  );

  const btn = screen.getByRole('button', { name: 'Details' });
  expect(btn).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText('Detail panel')).not.toBeInTheDocument();

  await user.click(btn);
  expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('Detail panel')).toBeInTheDocument();
});

// (b) Contract: the child function IS the public API, so its arguments are fair game.
test('passes open state and a toggle function to its child', async () => {
  const user = userEvent.setup();
  const childSpy = jest.fn(({ toggle }) => <button onClick={toggle}>Details</button>);
  render(<Expandable>{childSpy}</Expandable>);

  expect(childSpy).toHaveBeenLastCalledWith({ open: false, toggle: expect.any(Function) });
  await user.click(screen.getByRole('button', { name: 'Details' }));
  expect(childSpy).toHaveBeenLastCalledWith({ open: true, toggle: expect.any(Function) });
});`}
      </CodeBlock>

      <InfoBox variant="danger" title="Use toHaveBeenLastCalledWith, Never toHaveBeenCalledTimes">
        <p style={{ marginBottom: 0 }}>
          In the run above, <code>childSpy.mock.calls.length</code> was exactly{' '}
          <strong>2</strong> — but that number is a property of React&apos;s scheduler, not of
          your component. Turn on StrictMode, upgrade React, add a concurrent re-render, and
          it changes without any behaviour changing.{' '}
          <code>toHaveBeenCalledTimes(2)</code> on a render-prop child is a guaranteed future
          false failure; <code>toHaveBeenLastCalledWith</code> asserts the thing you actually
          care about.
        </p>
      </InfoBox>

      <h3>6 &mdash; A Handler on a Third-Party Component&apos;s Own Callback API</h3>
      <p>
        <code>onCellClicked</code>, <code>onSelectionChanged</code>,{' '}
        <code>onNodeExpand</code> — you hand the library a function and it decides when to
        call it. Both sides of the decision tree apply, and they produce genuinely different
        tests:
      </p>
      <ul>
        <li>
          <strong>Grid rendered for real:</strong> click a real cell and assert{' '}
          <em>your</em> consequence. You are proving the whole chain — that your{' '}
          <code>columnDefs</code> produced a clickable cell, that the library invoked your
          callback, and that your state update landed.
        </li>
        <li>
          <strong>Grid mocked:</strong> now the callback <em>is</em> the boundary, and
          invoking it is your mock&apos;s job. A spy is defensible here — but it is still
          better to have the mock call the callback and assert the resulting UI, because that
          keeps your reducer in the test. See &ldquo;How to mock it well&rdquo; below.
        </li>
      </ul>

      <CodeBlock language="jsx" title="Real grid: click a cell, assert your panel (passes — 4/4 in the lab)">
{`test('clicking a cell opens the detail panel', async () => {
  const user = userEvent.setup();
  render(<UserGrid users={users} />);

  // findBy, not getBy — AG Grid commits its rows asynchronously. See below.
  await user.click(await screen.findByRole('gridcell', { name: 'Alice' }));

  const detail = await screen.findByRole('complementary', { name: 'User detail' });
  expect(within(detail).getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
  expect(within(detail).getByText('Sales')).toBeInTheDocument();
  expect(screen.queryByText(/select a row/i)).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Zustand</h2>
      <p>
        Zustand is pleasant to test for one structural reason and dangerous to test for
        another. The pleasant part: a store is a plain module export, so a test can read and
        write it directly with no provider and no React. The dangerous part is the same
        sentence. <strong>A module-scoped store is module-scoped state, and Jest keeps a
        module registry per test <em>file</em>, not per test.</strong> Every test in the file
        shares one store.
      </p>

      <h3>The Leak, Demonstrated</h3>
      <p>
        Two tests. Neither is unreasonable. There is no reset. The suite is honest about what
        happens:
      </p>

      <CodeBlock language="jsx" title="Two tests, one module-scoped store, no reset">
{`import { SelectionPanel } from './app/layers';

test('1: selecting a row updates the count', async () => {
  const user = userEvent.setup();
  render(<SelectionPanel rows={rows} />);
  expect(screen.getByText('0 selected')).toBeInTheDocument();
  await user.click(screen.getByRole('checkbox', { name: 'Alice' }));
  expect(screen.getByText('1 selected')).toBeInTheDocument();
});

test('2: a fresh render starts with nothing selected', () => {
  render(<SelectionPanel rows={rows} />);
  expect(screen.getByText('0 selected')).toBeInTheDocument();
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — Jest 30.5.2, Zustand 5.0.15">
{`FAIL src/zustand-leak.test.jsx
  ● 2: a fresh render starts with nothing selected

    TestingLibraryElementError: Unable to find an element with the text:
    0 selected.

    <body>
      <div>
        <div>
          <div>
            <p>
              1
              selected
            </p>
            ...
            <label>
              <input
                checked=""
                type="checkbox"
              />
              Alice
            </label>

Tests:       1 failed, 1 passed, 2 total`}
      </CodeBlock>
      <p>
        Alice is <em>still checked</em> in a test that never clicked her. Note the failure
        mode carefully: it is order-dependent, so it survives a green local run and appears
        when someone reorders the file, adds <code>.only</code>, enables retries, or shards
        across workers. This is anti-pattern #9 from <em>Best Practices</em> — shared mutable
        state between tests — except the shared state is invisible, because nothing in the
        test file mentions it.
      </p>

      <h3>Reset Pattern A: <code>beforeEach</code> + <code>setState</code></h3>
      <p>
        Explicit, local, and has no moving parts. Zustand 5 gives you{' '}
        <code>getInitialState()</code>, so you do not have to maintain a duplicate copy of
        the initial state in the test file.
      </p>

      <CodeBlock language="jsx" title="The per-file reset — 5/5 passing in the lab">
{`import { useSelectionStore } from './app/selectionStore';

// Captured once, at import time, before any test has touched the store.
const initialState = useSelectionStore.getInitialState();

beforeEach(() => {
  // act() because live components are subscribed; without it React 19 warns.
  act(() => {
    useSelectionStore.setState(initialState, true);   // true = replace, not merge
  });
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — what getInitialState() contains">
{`getInitialState keys: clear,count,selectedIds,toggle
selectedIds:          []
typeof toggle:        function`}
      </CodeBlock>
      <p>
        The actions are in there, which is exactly why <code>getInitialState()</code> is the
        right source and a hand-written literal is not:
      </p>

      <CodeBlock language="jsx" title="The trap — replace:true with only the data keys">
{`beforeEach(() => {
  useSelectionStore.setState({ selectedIds: [] }, true);   // wipes toggle and clear
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — the render survives, the click does not">
{`state keys after reset: selectedIds
render survived. Now click the checkbox:

  console.error
    TypeError: toggle is not a function
        at onChange (src/app/layers.jsx:51:65)
        at executeDispatch (node_modules/react-dom/cjs/react-dom-client.development.js:20804:9)
        ...`}
      </CodeBlock>
      <p>
        Worth dwelling on: the <em>render</em> passed. Selectors returning{' '}
        <code>undefined</code> are harmless until something calls them, so this blows up on
        interaction, in a different test, with a stack trace that points at your component
        and not at the <code>beforeEach</code> that caused it. Either pass{' '}
        <code>getInitialState()</code>, or drop <code>replace</code> and merge:{' '}
        <code>setState({'{ selectedIds: [] }'})</code>.
      </p>

      <h3>Reset Pattern B: <code>__mocks__/zustand.ts</code>, the Auto-Reset</h3>
      <p>
        This is the pattern in Zustand&apos;s own testing guide (repo path{' '}
        <code>docs/learn/guides/testing.md</code>). It shadows the <code>zustand</code>{' '}
        module, wraps <code>create</code> and <code>createStore</code> so every store
        registers a reset function as it is created, and runs them all in a global{' '}
        <code>afterEach</code>. You write it once and never think about resets again.
      </p>
      <p>
        It is the densest thing on this page, and it is meant to be copied rather than
        understood line by line — but copy-paste you cannot audit is how a silent auto-reset
        happens, so here is what each part is doing:
      </p>
      <ul>
        <li>
          <code>export * from &apos;zustand&apos;</code> re-exports everything unchanged, then
          the explicit <code>export const create</code> below <em>shadows</em> just that one
          name. Middleware, <code>useStore</code> and the rest pass straight through.
        </li>
        <li>
          <code>jest.requireActual</code> reaches past the mock to the real module, so the
          wrapper wraps Zustand&apos;s genuine <code>create</code> and not the shadowed one it
          is in the middle of defining.
        </li>
        <li>
          Each wrapper calls the real <code>create</code>, grabs{' '}
          <code>getInitialState()</code> while it is still pristine, and pushes a closure that
          restores it into <code>storeResetFns</code>. The <code>afterEach</code> at the bottom
          runs the whole set.
        </li>
      </ul>
      <p>
        The <code>typeof stateCreator === &apos;function&apos;</code> branch handles Zustand&apos;s
        two call shapes. <code>create(fn)</code> passes the state creator directly;{' '}
        <strong>curried</strong> <code>create&lt;T&gt;()(fn)</code> — the form TypeScript users
        need, where the first call takes no argument purely so the generic can be supplied and
        the second call takes the creator — passes <code>undefined</code> first, so the wrapper
        hands back <code>createUncurried</code> for the second call to invoke. The two{' '}
        <code>as typeof</code> casts exist only because that union is not expressible in a
        single signature; they do nothing at runtime.
      </p>

      <CodeBlock language="typescript" title="__mocks__/zustand.ts — Zustand's documented Jest version">
{`// __mocks__/zustand.ts
import { act } from '@testing-library/react'
import type * as ZustandExportedTypes from 'zustand'
export * from 'zustand'

const { create: actualCreate, createStore: actualCreateStore } =
  jest.requireActual<typeof ZustandExportedTypes>('zustand')

export const storeResetFns = new Set<() => void>()

const createUncurried = <T,>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getInitialState()
  storeResetFns.add(() => { store.setState(initialState, true) })
  return store
}

export const create = (<T,>(stateCreator: ZustandExportedTypes.StateCreator<T>) =>
  // supports the curried form: create<T>()(fn)
  typeof stateCreator === 'function' ? createUncurried(stateCreator) : createUncurried
) as typeof ZustandExportedTypes.create

const createStoreUncurried = <T,>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
  const store = actualCreateStore(stateCreator)
  const initialState = store.getInitialState()
  storeResetFns.add(() => { store.setState(initialState, true) })
  return store
}

export const createStore = (<T,>(stateCreator: ZustandExportedTypes.StateCreator<T>) =>
  typeof stateCreator === 'function' ? createStoreUncurried(stateCreator) : createStoreUncurried
) as typeof ZustandExportedTypes.createStore

afterEach(() => {
  act(() => { storeResetFns.forEach((resetFn) => resetFn()) })
})`}
      </CodeBlock>

      <InfoBox variant="success" title="Verified: It Works, Exactly as Documented">
        <p>
          Four tests in a file with <strong>no <code>beforeEach</code></strong> and{' '}
          <strong>no <code>jest.mock(&apos;zustand&apos;)</code> call anywhere</strong>:
        </p>
        <CodeBlock language="text" title="Actual output — the file that needed no reset code">
{`$ npx jest src/zustand-automock.test.jsx

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Stronger proof: the leaking file from earlier was re-run{' '}
          <em>with not one character changed</em>, purely because{' '}
          <code>__mocks__/zustand.ts</code> now existed — <code>2 passed, 2 total</code>. Jest
          picks up a <code>__mocks__</code> folder adjacent to <code>node_modules</code>{' '}
          automatically for node&nbsp;modules, which is why no <code>jest.mock()</code> call is
          needed. Note the two consequences of that: the mock is{' '}
          <strong>global to the whole project</strong>, and <code>__mocks__</code> must sit
          where Jest&apos;s <code>roots</code> will find it.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="Verified Gotcha: Subpath Imports Escape the Mock">
        <p>
          The mock shadows the <code>zustand</code> specifier only. A store built from a
          subpath — <code>import {'{ createStore }'} from &apos;zustand/vanilla&apos;</code>,
          which is common for stores shared with non-React code — is a different module
          request and is never registered:
        </p>
        <CodeBlock language="text" title="Actual output — auto-reset in place, store still leaks">
{`SUBPATH: count at the start of test 2 = 1

  ● 2: is it reset by the __mocks__/zustand auto-reset?
    Expected: 0
    Received: 1

Tests: 1 failed, 1 passed, 2 total`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Fixes: import <code>createStore</code> from <code>&apos;zustand&apos;</code>{' '}
          (it is re-exported), add a matching <code>__mocks__/zustand/vanilla.ts</code>, or
          reset that store explicitly. The general lesson is worth more than the specific
          fix: <strong>an auto-reset you cannot see is an auto-reset you will not notice
          failing.</strong> Prove it works on day one by writing the two-test leak file above
          and watching it pass.
        </p>
      </InfoBox>

      <h3>Which Reset Pattern?</h3>
      <table>
        <thead>
          <tr>
            <th></th>
            <th><code>beforeEach</code> + <code>setState</code></th>
            <th><code>__mocks__/zustand</code></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Setup cost</td>
            <td>3 lines, in every file that touches a store</td>
            <td>One file, once, project-wide</td>
          </tr>
          <tr>
            <td>Failure mode</td>
            <td>You forget it in a new file</td>
            <td>Silent on subpaths and on stores created inside a component</td>
          </tr>
          <tr>
            <td>Visibility</td>
            <td>Obvious in the file you are reading</td>
            <td>Invisible; a new joiner will not know it exists</td>
          </tr>
          <tr>
            <td>Middleware (<code>persist</code>, <code>devtools</code>)</td>
            <td>Unaffected — you are calling the real store</td>
            <td>Unaffected — it wraps <code>create</code>, not the middleware</td>
          </tr>
          <tr>
            <td>Good fit for</td>
            <td>A few stores, or when you want per-test seeded states anyway</td>
            <td>Many stores across many files</td>
          </tr>
        </tbody>
      </table>
      <p>
        They compose, and the belt-and-braces combination is defensible: the auto-reset as
        the floor, an explicit <code>beforeEach</code> in files where you are <em>seeding</em>{' '}
        a specific state rather than just clearing.
      </p>

      <h3>Selecting a Slice, and Testing the Store Without React</h3>
      <p>
        Two more things fall out of the store being a plain object. First, seeding: to test a
        component that selects a slice, set the slice and render. No provider, no wrapper, no
        mock.
      </p>

      <CodeBlock language="jsx" title="Seed the slice, assert the derived UI">
{`test('the toolbar reflects a pre-selected state', () => {
  act(() => { useSelectionStore.setState({ selectedIds: [1, 2, 3] }); });   // merge, keeps actions

  render(<SelectionToolbar />);
  expect(screen.getByText('3 selected')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /clear selection/i })).toBeEnabled();
});`}
      </CodeBlock>
      <p>
        Second, the store&apos;s own logic does not need a component at all. Reducer-shaped
        edge cases — toggling twice, deduplication, ordering — belong here, where they run in
        microseconds and the failure message is about data:
      </p>

      <CodeBlock language="jsx" title="Store logic, no React, no render (passes)">
{`test('toggle is idempotent in pairs', () => {
  const { toggle } = useSelectionStore.getState();

  toggle(1);
  toggle(2);
  toggle(1);            // toggles 1 back off

  expect(useSelectionStore.getState().selectedIds).toEqual([2]);
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="Destructure Actions, Never State">
        <p style={{ marginBottom: 0 }}>
          <code>const {'{ toggle }'} = useSelectionStore.getState()</code> is safe because
          actions are stable identities. <code>const {'{ selectedIds }'} = ...getState()</code>{' '}
          is a <em>snapshot</em>, and will still be the old array after your action runs —
          producing a test that fails with a diff that makes no sense. Always re-read through{' '}
          <code>getState()</code> at assertion time, as above.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="What About Mocking the Store Module?">
        <p style={{ marginBottom: 0 }}>
          <code>jest.mock(&apos;./selectionStore&apos;)</code> comes up constantly and is
          almost always the wrong tool: the store is <em>your</em> code, mocking it triggers
          Trap 1 at global scope, and the setup is longer than just calling{' '}
          <code>setState</code>. There is one narrow legitimate case — a store whose actions
          fire network requests or navigation you cannot let run. Mock the boundary those
          actions call (MSW for the fetch, per <em>Testing Async &amp; APIs</em>), not the
          store.
        </p>
      </InfoBox>

      <h2>AG Grid: The Worked Heavy-Third-Party Example</h2>
      <p>
        AG Grid is the hardest realistic case in a React codebase: hundreds of exports, a{' '}
        <strong>virtualised</strong> renderer — only the handful of rows near the viewport
        ever exist as DOM elements, however many rows you handed it — absolutely-positioned
        rows, and a layout engine that measures the viewport. jsdom has no layout engine.
        Received wisdom says mock it and move on.
        Received wisdom is roughly half right, and the half that is wrong is not the half
        people expect. Here is what actually happens.
      </p>

      <h3>Finding 1: It Renders — But Not Synchronously</h3>
      <p>
        The single most common AG Grid test failure is a <code>getByRole</code> that runs
        before the grid has committed anything:
      </p>

      <CodeBlock language="text" title="Actual output — a 3-row grid, measured immediately vs after awaiting">
{`SYNC  (straight after render)   rows: 0   gridcells: 0   Alice? false
ASYNC (after findByText('Alice')) rows: 4   gridcells: 6   columnheaders: 2`}
      </CodeBlock>
      <p>
        Four <code>role=&quot;row&quot;</code> for three data rows: AG Grid marks the header
        row as a row too. Six <code>gridcell</code> = 3 &times; 2. So the first rule is
        simply: <strong>every AG Grid test starts with an <code>await</code>.</strong>{' '}
        <code>await screen.findByRole(&apos;gridcell&apos;, {'{ name: \'Alice\' }'})</code> as
        the first line, then synchronous <code>getBy</code> queries afterwards.
      </p>

      <h3>Finding 2: Virtualization Is Real, and Row Count Is Not Row Data</h3>

      <CodeBlock language="text" title="Actual output — ag-grid-community 36.2.0, 1000 rows, jsdom 26.1.0">
{`VIRT: rowData length                 : 1000
VIRT: aria-rowcount on the grid       : 1001
VIRT: getAllByRole("row").length      : 12
VIRT: getAllByRole("gridcell").length : 22
VIRT: queryByText("User 20")          : false
VIRT: ag-root-wrapper clientHeight    : 0`}
      </CodeBlock>
      <p>
        One thousand rows of data; eleven of them in the DOM, plus the header. Row 20 does
        not exist. So <code>expect(screen.getAllByRole(&apos;row&apos;)).toHaveLength(1001)</code>{' '}
        can never pass, and no amount of waiting changes it — jsdom reports{' '}
        <code>clientHeight: 0</code> for everything, so the grid draws the smallest buffer it
        can and stops.
      </p>

      <InfoBox variant="danger" title="Two Workarounds That Do Not Work">
        <p>
          <strong>An explicit container height does nothing.</strong> I expected the usual
          advice — &ldquo;wrap it in a div with a height&rdquo; — to matter. It does not, in
          jsdom. A 3-row grid rendered with <em>no</em> wrapper at all produced the identical{' '}
          <code>4 rows / 6 gridcells / Alice found</code>, because jsdom computes zero height
          for the styled wrapper too. Keep the height for the browser; do not expect it to
          buy you anything in a test.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong><code>domLayout=&quot;autoHeight&quot;</code> does not help either.</strong>{' '}
          It is the natural guess, since autoHeight is meant to size to content. Measured
          with 1000 rows: still <code>12</code> rows in the DOM and{' '}
          <code>User 999</code> absent. If you need to assert on a row that is not in the
          viewport buffer, mock the grid or restructure the assertion — do not go looking for
          a grid option that fixes it.
        </p>
      </InfoBox>

      <p>What <em>is</em> assertable, and worth asserting:</p>
      <ul>
        <li>
          <strong>Your <code>columnDefs</code> reached it.</strong>{' '}
          <code>getByRole(&apos;columnheader&apos;, {'{ name: \'Department\' }'})</code> —
          this catches a typo&apos;d <code>headerName</code> or a column lost to a bad{' '}
          <code>useMemo</code> dependency.
        </li>
        <li>
          <strong>The total, from <code>aria-rowcount</code>.</strong> It reported{' '}
          <code>1001</code> for 1000 rows — the grid&apos;s own count, header included. A
          decent proxy for &ldquo;did all my data arrive&rdquo; when the rows themselves are
          virtualised away.
        </li>
        <li>
          <strong>Specific cells, by role and name.</strong>{' '}
          <code>getByRole(&apos;gridcell&apos;, {'{ name: \'Alice\' }'})</code> works and is
          stable across upgrades, unlike any <code>.ag-cell</code> selector.
        </li>
        <li>
          <strong>Your cell renderers ran.</strong> See Finding 5.
        </li>
        <li>
          <strong>Your callbacks moved your state.</strong> The whole point.
        </li>
      </ul>

      <h3>Finding 3: The Click Target Trap</h3>
      <p>
        This one costs people an afternoon, and it is not AG Grid&apos;s fault — it is how
        DOM events work. AG Grid puts its sort listener on an inner{' '}
        <code>.ag-header-cell-label</code> element, while <code>role=&quot;columnheader&quot;</code>{' '}
        is on the outer cell. Events bubble <em>up</em>, so clicking the parent never reaches
        a child&apos;s listener:
      </p>

      <CodeBlock language="text" title="Actual output — two clicks on the same visual header">
{`CLICK-TARGET: user.click(columnheader)        -> aria-sort = none
CLICK-TARGET: user.click(text inside header)  -> aria-sort = ascending`}
      </CodeBlock>
      <p>
        The first one throws nothing, warns nothing, and logs nothing. It simply does not
        sort, and whatever you assert next fails for a reason that looks like a grid bug.
        The fix is a <code>within</code>:
      </p>

      <CodeBlock language="jsx" title="Click the label text, not the columnheader container">
{`const header = () => screen.getByRole('columnheader', { name: /name/i });

await user.click(within(header()).getByText('Name'));
await waitFor(() => expect(header()).toHaveAttribute('aria-sort', 'ascending'));`}
      </CodeBlock>

      <h3>Finding 4: DOM Order Is Not Visual Order</h3>
      <p>
        The worst trap on this page, because the naive assertion produces a{' '}
        <em>passing</em> test that means the opposite of what you think. AG Grid recycles row
        elements and repositions them with <code>transform: translateY()</code>. After a
        sort, the DOM has not been reordered at all:
      </p>

      <CodeBlock language="text" title='Actual output — after sorting the Name column ascending'>
{`ORDER: getAllByRole("row") order      : ["Carla","Alice","Bob"]     <- unchanged!
ORDER: sorted by row-index attribute  : ["Alice","Bob","Carla"]     <- what the user sees

ORDER: row-index of each DOM row:
  [["Carla","2","translateY(84px)"],
   ["Alice","0","translateY(0px)"],
   ["Bob",  "1","translateY(42px)"]]`}
      </CodeBlock>

      <FlowChart
        title="The same three rows, in two different orders at once"
        chart={"graph LR\n  A[\"<b>DOM order</b><br/>what getAllByRole('row') hands you<br/>―――――――――――<br/>rows[0] = Carla<br/>rows[1] = Alice<br/>rows[2] = Bob\"]\n  B[\"<b>Painted order</b><br/>what the user sees<br/>―――――――――――<br/>top: Alice<br/>middle: Bob<br/>bottom: Carla\"]\n  A -->|\"the SAME three elements.<br/>AG Grid never reordered the DOM;<br/>it moved them with translateY()<br/>and put the position in row-index\"| B\n  A --> X[\"rows[0] is Carla,<br/>and Carla is the BOTTOM row.<br/><br/>expect(rows[0]).toHaveTextContent('Carla')<br/>PASSES — and records the opposite<br/>of the sort you meant to assert.\"]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style B fill:#1a3329,stroke:#4ade80\n  style X fill:#3b1a1a,stroke:#f87171"}
      />

      <p>
        So <code>getAllByRole(&apos;row&apos;)[0]</code> is <strong>not</strong> the top row.
        That breaks any <em>page object</em> — the helper class from{' '}
        <em>Testing Patterns &amp; CI</em> that wraps a screen&apos;s queries behind named
        methods so tests never touch <code>screen</code> directly — that indexes into{' '}
        <code>rows[0]</code>. The <code>DataGridPage</code> example in that lesson does exactly
        this; it is written for a plain <code>&lt;table&gt;</code> and is correct there, and is
        wrong for AG Grid. Read the position from the attribute AG Grid maintains for it:
      </p>

      <CodeBlock language="jsx" title="Visual order helper for an AG Grid page object">
{`// row-index is 0-based and excludes the header; aria-rowindex is 1-based and includes it.
const visualOrder = () =>
  screen.getAllByRole('row')
    .filter((r) => r.getAttribute('row-index') !== null)      // drops the header row
    .sort((a, b) => Number(a.getAttribute('row-index')) - Number(b.getAttribute('row-index')))
    .map((r) => within(r).getAllByRole('gridcell')[0].textContent);`}
      </CodeBlock>

      <InfoBox variant="question" title="But Should You Assert Sort Order At All?">
        <p style={{ marginBottom: 0 }}>
          Mostly no — that is AG Grid&apos;s sort, and the helper above is a lot of machinery
          to test someone else&apos;s code. It earns its place when <em>you</em> supplied the
          ordering: a custom <code>comparator</code>, a <code>valueGetter</code> that sorts
          on a derived field, a &ldquo;pinned to top&rdquo; rule. Then the thing being tested
          is your comparator, and the grid is just the mechanism that runs it. Write it for
          that; do not write it for <code>sortable: true</code>.
        </p>
      </InfoBox>

      <h3>Finding 5: The Highest-Value AG Grid Test Has No Grid In It</h3>
      <p>
        A cell renderer is a React component that receives <code>{'{ value, data, ... }'}</code>.
        Nothing about it requires a grid, and it is usually where your actual logic lives —
        formatting, thresholds, badges, action buttons. Test it directly. This is the cheapest
        and most durable grid-related test you will write, and it should be the bulk of them:
      </p>

      <CodeBlock language="jsx" title="StatusCell.test.jsx — 3/3 passing, 0.38s, no AG Grid import">
{`import StatusCell from './app/StatusCell';

test('renders Active for an active user', () => {
  render(<StatusCell value="active" data={{ overdue: false }} />);
  expect(screen.getByRole('status')).toHaveTextContent('Active');
  expect(screen.getByRole('status')).toHaveAttribute('data-state', 'active');
});

test('renders Suspended and flags overdue', () => {
  render(<StatusCell value="suspended" data={{ overdue: true }} />);
  expect(screen.getByRole('status')).toHaveTextContent('Suspended (overdue)');
});

test('survives a missing data object', () => {
  render(<StatusCell value="active" />);          // AG Grid will do this to you
  expect(screen.getByRole('status')).toHaveTextContent('Active');
});`}
      </CodeBlock>
      <p>
        Then <em>one</em> test through the real grid confirms the wiring — that this renderer
        is attached to the column you think it is. Verified in the lab:
      </p>

      <CodeBlock language="jsx" title="One integration test for the wiring (passes)">
{`test('the cell renderer runs inside the real grid', async () => {
  render(<UserGrid users={users} />);
  await screen.findByRole('gridcell', { name: 'Carla' });

  expect(screen.getAllByRole('status').map((s) => s.textContent))
    .toEqual(['Active', 'Suspended (overdue)', 'Active']);
});`}
      </CodeBlock>

      <h3>Finding 6: Module Registration Is Not Mandatory — Register Anyway</h3>
      <p>
        AG Grid v33 made module registration mandatory, and the common advice is that a test
        will not render without{' '}
        <code>ModuleRegistry.registerModules([AllCommunityModule])</code>. On{' '}
        <strong>36.2.0 that is false</strong>: with no registration anywhere in the file the
        grid still rendered (<code>4 rows / 6 gridcells</code>), still sorted, still fired{' '}
        <code>onCellClicked</code>, and logged nothing at either point a test would look
        (Finding 8 is about what turns up if you keep looking). Features that{' '}
        <em>do</em> live in a separate module — <code>pagination</code> is the one you will
        hit first — fail as a <code>console.error</code> rather than a throw, so the test
        carries on and dies later on a missing panel, with a URL-encoded error code as the
        only clue:
      </p>

      <CodeBlock language="text" title="Actual output — console.error from an unregistered feature">
{`AG Grid: error #200 Visit https://www.ag-grid.com/react-data-grid/errors/200
  ?_version_=36.2.0&gridId=5&gridScoped=false&rowModelType=clientSide
  &moduleName=Pagination&reasonOrId=%60pagination%60...
Alternatively register the ValidationModule to see the full message in the console.`}
      </CodeBlock>
      <p>
        So the conclusion is the boring one, for a reason that is not the usual one: register
        in your setup file, not because the grid needs it to render but because{' '}
        <em>which</em> features need a module changes between releases and the failure mode is
        a silent log line. It also changes two other things measured on this page — the DOM
        gets about a third bigger (Anti-Pattern 3), and the idle <code>act()</code> warnings in
        Finding 8 go away.
      </p>

      <CodeBlock language="javascript" title="jest.setup.js — verified: a 30-row grid at paginationPageSize 20 then reports '1 to 20 of 30', console.error count 0">
{`require('@testing-library/jest-dom');

// Registered once per test file, because setupFilesAfterEnv shares each file's
// module registry.
const { AllCommunityModule, ModuleRegistry } = require('ag-grid-community');
ModuleRegistry.registerModules([AllCommunityModule]);`}
      </CodeBlock>

      <InfoBox variant="info" title="Also Verified: No Global Shims Were Needed">
        <p style={{ marginBottom: 0 }}>
          jsdom 26.1.0 under <code>jest-environment-jsdom</code> 30.5.2 provides{' '}
          <code>requestAnimationFrame</code> but has <strong>no</strong>{' '}
          <code>ResizeObserver</code>, <code>IntersectionObserver</code>,{' '}
          <code>matchMedia</code> or <code>Element.prototype.scrollIntoView</code> — the{' '}
          <em>shims</em> the decision tree at the top of this page warns about, fake globals
          you install in a setup file so a library stops crashing. AG Grid 36.2.0 rendered
          anyway, with zero of them. If you are carrying a{' '}
          <code>ResizeObserver</code> polyfill in your setup file for the grid&apos;s benefit,
          try deleting it and see whether anything notices — and if something does need a
          shim, remember that the shim is now an untested assumption living in every test.
        </p>
      </InfoBox>

      <h3>Finding 7: The Grid Model Updates Before the DOM Does</h3>
      <p>
        A quick filter applied through the grid API takes effect in the model immediately,
        and in the DOM a long time later. Sampled at intervals after{' '}
        <code>setGridOption(&apos;quickFilterText&apos;, &apos;Eng&apos;)</code> on a 3-row
        grid:
      </p>

      <CodeBlock language="text" title="Actual output — model vs DOM, sampled">
{`before filter:  DOM = ["Carla","Eng","Alice","Sales","Bob","Eng"]

+0ms    -> getDisplayedRowCount()=2   DOM = ["Carla","Eng","Alice","Sales","Bob","Eng"]
+20ms   -> getDisplayedRowCount()=2   DOM = ["Carla","Eng","Alice","Sales","Bob","Eng"]
+100ms  -> getDisplayedRowCount()=2   DOM = ["Carla","Eng","Alice","Sales","Bob","Eng"]
+300ms  -> getDisplayedRowCount()=2   DOM = ["Carla","Eng","Alice","Sales","Bob","Eng"]
+600ms  -> getDisplayedRowCount()=2   DOM = ["Carla","Eng","Bob","Eng"]

# and with waitFor instead of fixed sleeps, same grid, separate run:
U: DOM caught up after ~416 ms`}
      </CodeBlock>
      <p>
        Two lessons. First, a hand-rolled <code>await sleep(100)</code> would have
        &ldquo;worked&rdquo; on nobody&apos;s machine and flaked on everybody&apos;s —{' '}
        <code>waitFor</code> / <code>findBy</code> is not a style preference here, it is the
        only thing that works. Second, an assertion against{' '}
        <code>api.getDisplayedRowCount()</code> passes 400ms before the user could see
        anything. That is testing the library&apos;s internals; assert on the DOM, which is
        what the user gets.
      </p>

      <h3>Finding 8: Yes, It Does Emit act() Warnings — Just Not Where You Look</h3>
      <p>
        The obvious thing to check after Finding 7 is whether a grid that commits rows 400ms
        late trips React&apos;s <code>act()</code> warning. Sample it at the two moments a test
        would naturally sample it — straight after the <code>findBy</code>, and straight after
        a click — and the answer is a clean no. Keep the process alive a little longer and the
        answer changes:
      </p>

      <CodeBlock language="text" title="Actual output — console.error count, same 3-row grid, three runs each">
{`UNREGISTERED, plain render + sort:
  at findByText('Alice')     : 0
  after clicking the header  : 0
  after idling 1000ms        : 2   <- "An update to GridBodyComp inside a test
                                       was not wrapped in act(...)"  @ ~585ms

REGISTERED (AllCommunityModule in setupFilesAfterEnv), same test:
  after idling 1000ms        : 0

REGISTERED, driven through the API:
  api.setGridOption('quickFilterText', 'Eng')
  by the time waitFor resolved : 3   <- "An update to RowComp ..."  @ ~60ms`}
      </CodeBlock>
      <p>
        Three things follow. First, the earlier findings that report{' '}
        <code>console.error count = 0</code> are accurate <em>at the point they sample</em>,
        and that is exactly the shape of the problem: a grid whose work outlives your
        assertions produces warnings your assertions cannot see. Second, registering the
        modules removes the idle ones — one more reason for the setup file in Finding 6.
        Third, and least convenient: <code>setGridOption</code>, the very API Finding 7
        recommends for driving a filter, warns immediately and every time, because that update
        originates inside AG Grid rather than inside anything RTL wraps.
      </p>

      <InfoBox variant="warning" title="Do Not Reach for act() to Silence These">
        <p style={{ marginBottom: 0 }}>
          The reflex — wrap <code>setGridOption</code> in <code>act()</code> — is the wrong
          fix here for the same reason it is usually the wrong fix, and{' '}
          <a href="/react-testing/async-deep-dive">Waiting, act(), and Async Failure Modes</a>{' '}
          works through why in detail; that treatment is not repeated here. The short version
          for this page: these warnings are <code>console.error</code> calls, not failures, so
          a normal suite goes green with noise in the log. They only bite if your setup makes{' '}
          <code>console.error</code> fatal — a common CI hardening — in which case scope the
          allowance to the grid rather than deleting the rule, and budget for the fact that a
          third-party widget with its own scheduler will keep producing them.
        </p>
      </InfoBox>

      <h3>When to Mock It Instead — and What Actually Costs the Time</h3>
      <p>
        &ldquo;Mock AG Grid because it is slow in jsdom&rdquo; is the standard reason, and it
        is true up to a point that is further away than you would guess. Ten
        render + <code>await findByText(&apos;User 0&apos;)</code> + <code>cleanup</code>{' '}
        cycles of the same three-column component, real grid versus a table-shaped mock, each
        row measured in its own Jest process:
      </p>

      <table>
        <thead>
          <tr>
            <th>Rows</th>
            <th>Real <code>AgGridReact</code></th>
            <th>Table-shaped mock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>5</td>
            <td>313&nbsp;ms</td>
            <td><strong>37&nbsp;ms</strong></td>
            <td>mock ~8&times; faster</td>
          </tr>
          <tr>
            <td>200</td>
            <td>340&nbsp;ms</td>
            <td><strong>172&nbsp;ms</strong></td>
            <td>mock ~2&times; faster</td>
          </tr>
          <tr>
            <td>400</td>
            <td>362&nbsp;ms</td>
            <td><strong>279&nbsp;ms</strong></td>
            <td></td>
          </tr>
          <tr>
            <td>600</td>
            <td><strong>338&nbsp;ms</strong></td>
            <td>377&nbsp;ms</td>
            <td>they cross about here</td>
          </tr>
          <tr>
            <td>800</td>
            <td><strong>343&nbsp;ms</strong></td>
            <td>499&nbsp;ms</td>
            <td></td>
          </tr>
          <tr>
            <td>1000</td>
            <td><strong>342&nbsp;ms</strong></td>
            <td>585&nbsp;ms</td>
            <td>mock ~1.7&times; <em>slower</em></td>
          </tr>
        </tbody>
      </table>
      <p>
        Two shapes, and both are exactly what virtualisation predicts. The real grid is{' '}
        <strong>flat</strong> — 313ms at 5 rows and 342ms at 1000, because it only ever builds
        the dozen rows near the viewport. The mock is <strong>linear</strong>, because it
        renders every row you give it. They cross somewhere around 600 rows on this machine,
        and the exact crossover will move on yours; the shapes will not. At the fixture sizes
        a test has any business using — tens of rows, not hundreds — the mock is several times
        faster, which is the received wisdom, arrived at honestly.
      </p>

      <InfoBox variant="danger" title="The Real Trap Is the Query, Not the Render">
        <p>
          Re-run the identical matrix changing only the first line of each test — from{' '}
          <code>findByText(&apos;User 0&apos;)</code> to{' '}
          <code>findByRole(&apos;cell&apos;, {'{ name: \'User 0\' }'})</code>, the query this
          very page has been recommending — and the 200-row row flips over:
        </p>
        <CodeBlock language="text" title="Actual output — same fixtures, same renders, only the query differs">
{`10 render + await + cleanup cycles, 3 columns

rows   REAL findByText   MOCK findByText   REAL findByRole+name   MOCK findByRole+name
   5        313 ms             37 ms              324 ms                  81 ms
 200        340 ms            172 ms              400 ms                 666 ms`}
        </CodeBlock>
        <p>
          Nothing about React changed. Split one of those cycles into its two halves and the
          cause is unambiguous:
        </p>
        <CodeBlock language="text" title="Actual output — mocked 200-row fixture, render time vs query time">
{`                    render    query    total
findByText            96 ms    49 ms    145 ms
findByRole + name     60 ms   522 ms    582 ms`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          <code>getByRole</code> with a <code>name</code> option computes the{' '}
          <strong>accessible name of every element that matched the role</strong> before it can
          filter. The real grid has virtualised its 200 rows down to 33{' '}
          <code>gridcell</code>s, so that is 33 name computations. The mock renders all 200
          rows, so it is 600. Per single warm query on this machine: 1.93ms against the real
          grid, 24.58ms against the mock, 124.56ms against a 1000-row mock with 3000 cells.
        </p>
      </InfoBox>

      <p>
        So there are two conclusions, and the second is the one that transfers beyond AG Grid:
      </p>
      <ul>
        <li>
          <strong>Mock it for speed only up to a point, and measure where your point is.</strong>{' '}
          Below the crossover the mock wins by a lot; above it the real grid&apos;s
          virtualisation wins and a big mocked fixture is the slowest thing on the board. If
          you mock, keep the fixture small — you were never asserting on row 700 anyway.
        </li>
        <li>
          <strong>In a large mocked DOM, prefer <code>findByText</code> or{' '}
          <code>findByTestId</code> over <code>getByRole({'{ name }'})</code>.</strong> The
          role-plus-name query is the right default everywhere else on this page and in{' '}
          <em>Best Practices</em>, and it stays the right default for the real grid, where the
          candidate set is small by construction. The cost is linear in the number of
          candidates, so it is specifically the combination{' '}
          <em>mock that renders everything</em> + <em>name-filtered role query</em> that hurts
          — and it was the only reason the mock ever looked slow.
        </li>
      </ul>

      <h3>How to Mock It Well</h3>
      <p>
        The bad mock is <code>{'jest.mock(\'ag-grid-react\', () => ({ AgGridReact: () => <div /> }))'}</code>.
        It is a black hole: your <code>columnDefs</code> are never read, your cell renderers
        never run, your <code>onCellClicked</code> is never called, and every test that
        touches the grid becomes a test of your loading state. A good mock is a{' '}
        <strong>minimal honest implementation of the props you actually use</strong> — it
        renders a real semantic table from <code>columnDefs</code>, invokes your{' '}
        <code>cellRenderer</code>, and calls <code>onCellClicked</code> with an
        AG-Grid-shaped event.
      </p>

      <CodeBlock language="jsx" title="A mock that still exercises your wiring — 4/4 passing">
{`jest.mock('ag-grid-react', () => ({
  AgGridReact: ({ rowData = [], columnDefs = [], onCellClicked }) => (
    <table>
      <thead>
        <tr>
          {columnDefs.map((c) => (
            <th key={c.field} scope="col">{c.headerName ?? c.field}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rowData.map((row, rowIndex) => (
          <tr key={row.id ?? rowIndex}>
            {columnDefs.map((c) => {
              const value = row[c.field];
              const Renderer = c.cellRenderer;
              return (
                <td
                  key={c.field}
                  onClick={() =>
                    onCellClicked?.({ data: row, value, colDef: c, rowIndex, node: { data: row } })
                  }
                >
                  {Renderer ? <Renderer value={value} data={row} /> : String(value ?? '')}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));`}
      </CodeBlock>
      <p>
        What that buys you, verified: <code>columnheader</code> queries still work (so a
        typo&apos;d <code>headerName</code> still fails the test), your real{' '}
        <code>StatusCell</code> still runs and still produced{' '}
        <code>[&apos;Active&apos;, &apos;Suspended (overdue)&apos;, &apos;Active&apos;]</code> —
        the same three entries the real grid gave in Finding 5 — clicking a cell
        still opens your detail panel, and it is all synchronous — no{' '}
        <code>findBy</code>, no 400ms DOM lag. Plus every row is present:{' '}
        <code>1001 role=&quot;row&quot;</code> for 1000 rows, with{' '}
        <code>User 999</code> queryable. Note the roles change from{' '}
        <code>gridcell</code> to <code>cell</code> because a real{' '}
        <code>&lt;table&gt;</code> is not a <code>role=&quot;grid&quot;</code>; keep the
        difference behind a page object so your tests do not have to know which mode they are
        in.
      </p>

      <InfoBox variant="info" title="How Much of the Event Does Your Mock Need?">
        <p>
          Enough to satisfy your own handler and no more. For reference, the real event a
          click produced on 36.2.0, captured with <code>Object.keys(e).sort()</code>:
        </p>
        <CodeBlock language="text" title="Actual output — keys on the onCellClicked event">
{`api, colDef, column, context, data, event, eventPath,
isEventHandlingSuppressed, node, rowIndex, rowPinned, type, value

e.value          = 'Carla'
e.data           = { id: 1, name: 'Carla', dept: 'Eng' }
e.colDef.field   = 'name'
e.rowIndex       = 0`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          If your handler only reads <code>e.data</code>, supply <code>data</code> — a mock
          that reproduces <code>api</code> is a mock you now have to maintain against
          someone else&apos;s release notes. But do read this list once, because it tells you
          which fields <em>exist</em>: a handler reaching for <code>e.node.data</code> when it
          could use <code>e.data</code> is extra surface for no reason.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Scope the Mock to the File, Not the Project">
        <p style={{ marginBottom: 0 }}>
          Use <code>jest.mock(&apos;ag-grid-react&apos;, factory)</code> inside the test files
          that want it. Do <em>not</em> put this in{' '}
          <code>__mocks__/ag-grid-react.jsx</code> the way you did for Zustand: a root{' '}
          <code>__mocks__</code> entry for a node&nbsp;module applies automatically and
          project-wide, which would silently delete your real-grid integration tests. The two
          libraries want opposite treatment, and the reason is the same fact about Jest.
        </p>
      </InfoBox>

      <h3>The Shape of a Grid Test Suite That Works</h3>
      <FlowChart
        title="Where the grid-related tests should live"
        chart={"graph TD\n  A[\"A screen with AG Grid in it\"] --> B[\"Cell renderers, value formatters,<br/>comparators: many tests,<br/>rendered directly, no grid\"]\n  A --> C[\"YOUR logic around the grid:<br/>toolbar, filters, detail panel<br/>-> mock the grid, keep props live\"]\n  A --> D[\"Integration: 2-4 tests<br/>real grid, awaited<br/>columnDefs arrived + callback wired\"]\n  A --> E[\"Sorting, filtering, editing,<br/>virtual scrolling<br/>AG Grid's own suite\"]\n  style B fill:#1a3329,stroke:#4ade80\n  style C fill:#1a3329,stroke:#4ade80\n  style D fill:#1a2744,stroke:#5b9cf6\n  style E fill:#3b1a1a,stroke:#f87171"}
      />

      <h2>Anti-Patterns Specific to This Topic</h2>

      <h3>1. Mocking the Thing Under Test</h3>
      <CodeBlock language="jsx" title="WRONG">
{`// UserGrid.test.jsx
jest.mock('./UserGrid');            // ...testing what, exactly?

// or, one level subtler:
jest.mock('./RowActions');          // the component whose bug you are hunting`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> obvious stated baldly, easy to reach by accident in a deep
        tree. The test for layer N must not mock layer N+1 when the behaviour under test{' '}
        <em>passes through</em> layer N+1. The over-mocking demonstration earlier is this
        anti-pattern with real output attached: identical assertions, green on a broken
        component.
      </p>

      <h3>2. Asserting on Library Internals or CSS Classes</h3>
      <CodeBlock language="jsx" title="WRONG">
{`expect(container.querySelector('.ag-row-selected')).toBeInTheDocument();
expect(container.querySelectorAll('.ag-cell')).toHaveLength(6);
expect(wrapper.find('AgGridReact').props().rowData).toHaveLength(3);
expect(api.getDisplayedRowCount()).toBe(2);       // model, not DOM — see Finding 7`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT">
{`expect(screen.getByRole('row', { name: /alice/i })).toHaveAttribute('aria-selected', 'true');
expect(screen.getAllByRole('gridcell')).toHaveLength(6);
expect(await screen.findByRole('gridcell', { name: 'Alice' })).toBeInTheDocument();
await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument());`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> the 3&times;2 grid in the lab contained{' '}
        <strong>136 distinct <code>ag-*</code> class tokens</strong> with{' '}
        <code>AllCommunityModule</code> registered, and 96 without it — the count is a
        function of which modules you loaded, which is itself a detail you do not control.
        None of them is in AG
        Grid&apos;s public API, and a minor upgrade can rename any of them without a changelog
        entry, because from their side nothing observable changed. The roles —{' '}
        <code>grid</code>, <code>row</code>, <code>gridcell</code>,{' '}
        <code>columnheader</code>, <code>aria-sort</code>, <code>aria-rowcount</code> — are
        standard, are what a screen-reader user gets, and are the same query you would write
        against any other grid library. This is the query ladder from{' '}
        <em>Best Practices</em> applied to a subtree you do not own, where it matters most,
        because you are not the one who decides when the markup changes.
      </p>

      <InfoBox variant="tip" title="Verified: aria-selected Really Is There — With One Config Catch">
        <p>
          That first &ldquo;RIGHT&rdquo; line is not aspirational. Measured on 36.2.0 with{' '}
          <code>{'rowSelection={{ mode: \'singleRow\', enableClickSelection: true }}'}</code>:{' '}
          the row reads <code>aria-selected=&quot;false&quot;</code> before the click and{' '}
          <code>&quot;true&quot;</code> after, the sibling row stays <code>&quot;false&quot;</code>,
          and <code>getByRole(&apos;row&apos;, {'{ name: /alice/i }'})</code> resolves to
          exactly one element — so you never need <code>.ag-row-selected</code>.
        </p>
        <p style={{ marginBottom: 0 }}>
          The catch, which cost a probe run: in modern AG Grid,{' '}
          <code>{'rowSelection={{ mode: \'singleRow\' }}'}</code> alone does{' '}
          <strong>not</strong> select on a cell click — <code>enableClickSelection</code>{' '}
          defaults to off, and selection happens through the checkbox column. Without it the
          click is a silent no-op and your test times out on a row that never becomes
          selected. Via the checkbox works too, and the checkboxes have real accessible names:{' '}
          <code>&quot;Press Space to toggle row selection (unchecked)&quot;</code>.
        </p>
      </InfoBox>

      <h3>3. Snapshotting a Third-Party Subtree</h3>
      <CodeBlock language="jsx" title="WRONG">
{`const { container } = render(<UserGrid users={users} />);
expect(container).toMatchSnapshot();`}
      </CodeBlock>
      <CodeBlock language="text" title="Actual output — what you just committed, for a THREE-row, two-column grid">
{`                                    no modules   AllCommunityModule registered
chars of HTML in the subtree      :     11,961         ~15,940
DOM elements                      :         99             138
distinct ag-* class tokens        :         96             136`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> 16KB of someone else&apos;s markup, per snapshot, that no
        reviewer will ever read — and note it is 16KB only because the setup file from Finding
        6 registered the modules; the same grid is 12KB without them, so <em>adding a module
        you do not use rewrites every grid snapshot in the repo</em>. (The character count is
        the one figure that drifts run to run by a few dozen, because the grid&apos;s instance
        id is embedded in the markup. Element and token counts are stable.) It churns on every
        AG Grid upgrade and on inline styles like{' '}
        <code>translateY(84px)</code> that shift when a default row height changes — so the
        only reviewable response is <code>-u</code>, which means the snapshot never fails for
        a real reason. Worse, it is <em>order-sensitive</em> and DOM order is not visual order
        (Finding 4), so it cannot even detect the sort change it appears to be recording.
        Anti-pattern #3 in <em>Best Practices</em> covers snapshots generally; a third-party
        subtree is the worst possible thing to point one at.
      </p>

      <h3>4. A Suite That Passes Because Everything Is Mocked</h3>
      <CodeBlock language="jsx" title="WRONG — genuinely seen in the wild">
{`jest.mock('ag-grid-react');            // auto-mock: renders nothing
jest.mock('../stores/selectionStore');
jest.mock('./GridToolbar');
jest.mock('./DetailPanel');

test('renders the user grid screen', () => {
  render(<UserGridScreen />);
  expect(screen.getByRole('heading', { name: /team/i })).toBeInTheDocument();
});`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> that asserts your <code>&lt;h2&gt;</code> exists. Note the first
        line especially: <code>jest.mock(spec)</code> with <em>no factory</em> is an{' '}
        <strong>automock</strong> — Jest replaces every export with a <code>jest.fn()</code>{' '}
        returning <code>undefined</code>, so <code>AgGridReact</code> becomes a component that
        renders nothing, silently and with no import error to notice. Every
        interesting thing on the screen has been replaced by a stub, and the test will stay
        green through a deleted grid, a broken store and an empty detail panel. It also{' '}
        <em>looks</em> like coverage in a report, which is the real danger — see
        &ldquo;Coverage Is a Signal, Not a Target&rdquo; in <em>Best Practices</em>. The test
        for a screen like that should mock exactly one thing (the grid, or the network) and
        run everything else.
      </p>

      <h3>5. Asserting a Spy Where the DOM Was Right There</h3>
      <CodeBlock language="jsx" title="WRONG">
{`const onArchive = jest.fn();
render(<RowList rows={rows} onArchive={onArchive} />);
await user.click(screen.getByRole('button', { name: /archive alice/i }));
expect(onArchive).toHaveBeenCalledWith(1);          // ...and then what happened?`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT">
{`render(<RowList rows={rows} />);                    // real handler, real state
await user.click(screen.getByRole('button', { name: /archive alice/i }));
expect(screen.queryByRole('button', { name: /archive alice/i })).not.toBeInTheDocument();
expect(screen.getByText('Showing 1 of 2')).toBeInTheDocument();`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> the spy version passes when the handler throws immediately
        after, when the state setter is never called, and when the list re-renders with the
        wrong row removed. The DOM version cannot. Keep the spy for the leaf test and for
        genuine boundaries — a callback you hand to a <em>mocked</em> library, a prop on a
        component that owns no state. Everywhere else, the DOM is both easier to write and a
        stronger claim.
      </p>

      <h2>The Checklist</h2>
      <CodeBlock language="text" title="Reviewing a test for a layered or third-party-heavy component">
{`LAYERS
  [ ] render() points at the component that OWNS the state being changed
  [ ] no jest.mock() on a component the behaviour under test passes through
  [ ] the assertion is a DOM consequence, not a spy, unless the spy is a real boundary
  [ ] leaf tests exist for leaves with logic of their own — and only those

STORE
  [ ] state is reset between tests: beforeEach + getInitialState(), or __mocks__/zustand
  [ ] the reset has been PROVEN to work — a deliberate two-test leak file passed
  [ ] replace:true resets include the actions, not just the data keys
  [ ] stores from subpath imports (zustand/vanilla) are covered too
  [ ] reducer edge cases are tested on the store directly, without React

THIRD-PARTY WIDGET
  [ ] the first query is an await (findBy / waitFor) — it does not render synchronously
  [ ] queries use roles, never .library-class-names
  [ ] ...except inside a big MOCKED fixture, where getByRole({ name }) is the
      slow path — findByText / findByTestId there instead
  [ ] no assertion on total row count when the widget virtualises
  [ ] row order read from the attribute, not from getAllByRole order
  [ ] clicks target the element that carries the listener, not its aria container
  [ ] mocks implement the props you use: columnDefs, cellRenderer, the callbacks
  [ ] widget-wide mocks are per-file, not in a root __mocks__/ folder
  [ ] no snapshot contains a single line of the library's markup`}
      </CodeBlock>

      <InfoBox variant="success" title="The One Sentence">
        <p style={{ marginBottom: 0 }}>
          <strong>Mock only what jsdom or your own sanity genuinely cannot run, render from
          the layer that owns the state, and assert the consequence a user could see.</strong>{' '}
          Every rule on this page is that sentence applied to a specific obstacle — five
          layers of wrappers, a store nobody passed down, or a grid that measures a viewport
          that does not exist. And when you are unsure whether the library behaves the way
          you assume in jsdom: <code>console.log</code> the counts and find out. Everything on
          this page that contradicts the received wisdom was found that way.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
