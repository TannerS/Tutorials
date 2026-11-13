import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Leaks() {
  return (
    <LessonLayout
      title="Leaking Tests: What Survives, and What Keeps Jest Alive"
      sectionId="react-testing"
      lessonIndex={9}
      prev={{ path: '/react-testing/async-deep-dive', label: 'Waiting, act(), and Async Failure Modes' }}
      next={{ path: '/react-testing/forms', label: 'Testing Forms & Routing' }}
    >
      <p>
        &ldquo;The test is leaking&rdquo; gets said about four unrelated problems that
        share nothing but a vocabulary. One of them hangs your terminal, one of them
        makes an innocent test fail, one of them fills the log with <code>act()</code>{' '}
        warnings while the suite stays green, and one of them runs CI out of memory three
        hundred files later. The fixes do not overlap, and the diagnostic you reach for
        first depends entirely on which one you have.
      </p>
      <p>
        So this lesson starts by separating them, and then measures each one — including
        two pieces of extremely common advice that turn out to be false.
      </p>

      <InfoBox variant="note" title="The toolchain every transcript below came from">
        <p style={{ marginBottom: 0 }}>
          <strong>Jest 30.5.2</strong>, <strong>jest-environment-jsdom 30.5.2</strong>{' '}
          (bundling jsdom 26), <strong>@testing-library/react 16.3.3</strong>,{' '}
          <strong>@testing-library/jest-dom 7.0.1</strong>,{' '}
          <strong>React 19.3.1</strong> and <strong>babel-jest 30.5.2</strong> on Node
          25.2.1 — the stack this section standardises on in{' '}
          <a href="/react-testing/intro">RTL Fundamentals</a>. Every output block is a
          real run, including the ones where nothing happened.
        </p>
      </InfoBox>

      <FlowChart
        title="Which leak do you have?"
        chart={"graph TD\n  S{\"what is the symptom?\"} --> A[\"the command never returns,\\nor CI prints 'worker process\\nhas failed to exit gracefully'\"]\n  S --> B[\"a test fails that you\\ndid not touch\"]\n  S --> C[\"pages of act() warnings,\\nsuite still green\"]\n  S --> D[\"CI runs out of memory\\nafter N files\"]\n  A --> A2[\"FAMILY 4: a NODE handle is open.\\n--detectOpenHandles\"]\n  B --> B2[\"FAMILY 1 or 2: state crossed\\na test boundary.\\nrun it alone, then --randomize\"]\n  C --> C2[\"FAMILY 3: async outlived the test.\\nread the BOTTOM of the stack\"]\n  D --> D2[\"FAMILY 4 again: a handle is\\nretaining the whole environment.\\n--logHeapUsage WITH --expose-gc\"]\n  style A2 fill:#3b1a1a,stroke:#f87171\n  style B2 fill:#3d2f14,stroke:#d97706\n  style C2 fill:#13293d,stroke:#38bdf8\n  style D2 fill:#3b1a1a,stroke:#f87171"}
      />

      <h2>Family 1: A Test That Fails Because of Another Test</h2>
      <p>
        This is the one that costs the most hours, because the failure arrives with a
        stack trace pointing at innocent code. Here is the whole bug — a component that
        fetches after a short delay and does not clean up:
      </p>

      <CodeBlock language="jsx" title="The component and the two tests">
{`const api = jest.fn(async (who) => \`hi \${who}\`);   // a suite-wide mock

function Greeter({ who }) {
  const [msg, setMsg] = useState('...');
  useEffect(() => {
    const id = setTimeout(() => { api(who).then(setMsg); }, 20);
    void id;                      // <- never cleared. That is the whole bug.
  }, [who]);
  return <p>{msg}</p>;
}

test('A: mounts and leaves immediately', () => {
  render(<Greeter who="alice" />);
  expect(screen.getByText('...')).toBeInTheDocument();
  // ends here, with 20ms still on the clock
});

test('B: an innocent test that counts the calls', async () => {
  render(<Greeter who="bob" />);
  expect(await screen.findByText('hi bob')).toBeInTheDocument();
  expect(api).toHaveBeenCalledTimes(1);
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the whole file">
{`FAIL t/07-cross-test.test.tsx
  ● B: an innocent test that counts the calls

    expect(jest.fn()).toHaveBeenCalledTimes(expected)

    Expected number of calls: 1
    Received number of calls: 2

    > 27 |   expect(api).toHaveBeenCalledTimes(1);

Tests:       1 failed, 1 passed, 2 total`}
      </CodeBlock>

      <p>
        Test A passed. Test B failed. Test B is correct, and the line Jest points at is
        correct too — there really were two calls. The second one is test A&apos;s timer
        firing twenty milliseconds into test B. Everything you need to fix it is in a
        test that Jest reported as passing.
      </p>

      <h3>The fingerprint: it passes alone</h3>
      <p>
        Before investigating anything, run the failing test by itself. One of two things
        happens, and they mean completely different things:
      </p>

      <CodeBlock language="text" title="Real output — the same file, test B only">
{`$ npx jest t/07 -t "innocent"

Tests:       1 skipped, 1 passed, 2 total`}
      </CodeBlock>

      <p>
        <strong>Passes alone, fails in company = a leak, and the failing test is not the
        leaking one.</strong> Stop reading the failing test; it is the victim. Fails
        alone too, and you have an ordinary bug in the test you are looking at. This
        single check decides which half of the suite to investigate, and it takes five
        seconds.
      </p>

      <h3>Finding the culprit: <code>--randomize</code></h3>
      <p>
        Jest 30 can shuffle the order of tests within a file, with a reproducible seed.
        That turns &ldquo;is this suite order-dependent?&rdquo; into a measurement rather
        than an argument. Six seeds against the file above:
      </p>

      <CodeBlock language="text" title="Real output — npx jest t/07 --randomize --seed=N">
{`seed 1: Tests:       1 failed, 1 passed, 2 total
seed 2: Tests:       2 passed, 2 total
seed 3: Tests:       1 failed, 1 passed, 2 total
seed 4: Tests:       2 passed, 2 total
seed 5: Tests:       1 failed, 1 passed, 2 total
seed 6: Tests:       2 passed, 2 total`}
      </CodeBlock>

      <p>
        Three seeds fail, three pass — because when B happens to run first there is no
        stray call yet. This is worth internalising in both directions. It is a quick way
        to prove a leak exists and to bisect which pairing triggers it. It is also the
        reason a suite full of leaks can sit green for months and then &ldquo;break&rdquo;
        when someone adds an unrelated test in the middle of the file: nothing broke, the
        ordering changed. If a suite only passes in one order, it is already broken.
      </p>

      <h3>The fix, and a popular non-fix</h3>
      <p>
        The real fix is in the component&apos;s effect, not in the test: cancel the work
        and ignore a result that arrives after unmount.
      </p>

      <CodeBlock language="jsx" title="The same component with cleanup">
{`useEffect(() => {
  let live = true;
  const id = setTimeout(() => {
    api(who).then((m) => { if (live) setMsg(m); });
  }, 20);
  return () => { live = false; clearTimeout(id); };
}, [who]);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — with the cleanup">
{`Tests:       2 passed, 2 total`}
      </CodeBlock>

      <p>
        Both halves of that cleanup earn their place: <code>clearTimeout</code> stops
        work that has not started, and the <code>live</code> flag discards a response for
        a request already in flight. For a real <code>fetch</code> the first half is{' '}
        <code>AbortController</code>; the second half is still needed, because aborting
        does not un-send a request that is already on the wire.
      </p>
      <p>
        Now the non-fix. The reflex when a mock&apos;s call count is wrong is to reset
        mocks between tests. It does not help here, and it is worth seeing the result
        rather than reasoning about it:
      </p>

      <CodeBlock language="text" title="Real output — the leaky file with --clearMocks">
{`$ npx jest t/07 --clearMocks

    Expected number of calls: 1
    Received number of calls: 2

Tests:       1 failed, 1 passed, 2 total`}
      </CodeBlock>

      <p>
        Identical failure. <code>clearMocks</code> runs <em>between</em> tests, and the
        stray call happens <em>during</em> test B, after the reset. Resetting state
        between tests can only undo what already happened; it has no power over work that
        is still queued. That is the dividing line between family 1 and family 2, and the
        reason <code>clearAllMocks</code>/<code>resetModules</code> in a global{' '}
        <code>afterEach</code> is not the general answer to cross-test failures people
        hope it is.
      </p>

      <h2>Family 2: State That Survives the Cleanup</h2>
      <p>
        RTL&apos;s automatic cleanup is the reason most suites get away with no teardown
        at all, so it is worth knowing precisely what it does. This is the whole function
        from <code>@testing-library/react</code> 16.3.3:
      </p>

      <CodeBlock language="javascript" title="@testing-library/react 16.3.3 — dist/pure.js">
{`function cleanup() {
  mountedRootEntries.forEach(({root, container}) => {
    act(() => { root.unmount(); });
    if (container.parentNode === document.body) {
      document.body.removeChild(container);
    }
  });
  mountedRootEntries.length = 0;
  mountedContainers.clear();
}`}
      </CodeBlock>

      <p>
        Two actions: unmount each root that <code>render()</code> created (inside{' '}
        <code>act</code>, so your effect cleanups run), and remove the container{' '}
        <em>if RTL is the one who put it in the body</em>. That is all. It is registered
        in an <code>afterEach</code> automatically unless{' '}
        <code>process.env.RTL_SKIP_AUTO_CLEANUP</code> is set.
      </p>
      <p>
        Turning it off shows what it is protecting you from — three tests, each rendering
        the same heading:
      </p>

      <CodeBlock language="text" title="Real output — RTL_SKIP_AUTO_CLEANUP=true">
{`FAIL t/09-cleanup.test.tsx
  ● B: renders the same heading

    TestingLibraryElementError: Found multiple elements with the role "heading"
    and name "Dashboard"

# and by the third test:
  console.log
    document.body children: 3
    body HTML: <div><h1>Dashboard</h1></div><div><h1>Dashboard</h1></div><div><h1>Dashboard</h1></div>`}
      </CodeBlock>

      <p>
        Without cleanup, every <code>render()</code> stacks another container in{' '}
        <code>document.body</code> and <code>screen</code> queries the lot — because{' '}
        <code>screen</code> is bound to <code>document.body</code>, not to your render.
        <em> Found multiple elements</em> in an otherwise sane test is nearly always this.
      </p>

      <h3>The three things cleanup does not touch</h3>
      <p>
        Read that function again and the gaps are obvious. It unmounts React trees. It
        does not know about timers, module state, or anything your code appended to the
        document itself.
      </p>

      <CodeBlock language="jsx" title="A widget that mounts itself outside your tree">
{`// Stands in for any tooltip layer, toast host, modal root or chart overlay.
function WidgetHost() {
  useEffect(() => {
    const layer = document.createElement('div');
    layer.setAttribute('role', 'status');
    layer.textContent = 'Saved';
    document.body.appendChild(layer);
    // no removal on unmount
  }, []);
  return <p>editor</p>;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — and look at the verdict on test B">
{`console.log
  body HTML at the start of B: <div role="status">Saved</div><div><p>a different screen entirely</p></div>

Tests:       2 passed, 2 total`}
      </CodeBlock>

      <p>
        Test B rendered a completely different screen, asserted{' '}
        <code>expect(screen.getByRole(&apos;status&apos;)).toBeInTheDocument()</code>,
        and <strong>passed</strong> — against the previous test&apos;s leftovers. A false
        pass is strictly worse than a failure: it means an assertion in your suite is no
        longer attached to anything, and nobody will notice until the feature it was
        guarding is deleted and the test keeps passing.
      </p>

      <InfoBox variant="danger" title="The jsdom quirk that makes a leaked DOM even stranger">
        <p>
          Once two subtrees with the same <code>id</code> are in the document, scoped id
          lookups stop working. Measured on jsdom 29.1.1, with two{' '}
          <code>&lt;p id=&quot;dup&quot;&gt;</code> in two different divs:
        </p>
        <CodeBlock language="text" title="Real output — jsdom 29.1.1">
{`B.querySelector("#dup")           -> null
B.querySelector("p")              -> second
B.querySelectorAll("#dup").length -> 1`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          <code>querySelector</code> returns <code>null</code> for an element that{' '}
          <code>querySelectorAll</code> finds, inside the same container — the fast path
          for <code>#id</code> consults the document-wide id map and then fails the
          containment check. Per spec both should match the descendant. The lesson is not
          to memorise the quirk: it is that a leaked DOM produces failures that look
          nothing like &ldquo;a leaked DOM&rdquo;, so when a query returns{' '}
          <code>null</code> for something you can see in the dump, print{' '}
          <code>document.body.innerHTML</code> before anything else.
        </p>
      </InfoBox>

      <h3><code>render()</code> in <code>beforeAll</code></h3>
      <p>
        This one is worth its own mention because the code looks like an optimisation and
        the failure looks like a broken query. Cleanup runs after{' '}
        <em>every</em> test, so a tree mounted once in <code>beforeAll</code> exists for
        exactly one of them:
      </p>

      <CodeBlock language="text" title="Real output — render() hoisted into beforeAll">
{`PASS/FAIL t/13-before-all.test.tsx
  ✓ A: finds the field (4 ms)
  ✕ B: finds the field again

    TestingLibraryElementError: Unable to find a label with the text of: Query

    Ignored nodes: comments, script, style
    <body />`}
      </CodeBlock>

      <p>
        The dump is the tell: <code>&lt;body /&gt;</code>, empty. The query is fine, the
        label is fine — there is simply no DOM. <code>beforeEach</code> is the fix, and
        the cost of re-rendering per test is far lower than people assume. If setup is
        genuinely expensive, hoist the <em>data</em> into <code>beforeAll</code> and keep{' '}
        <code>render()</code> in <code>beforeEach</code>.
      </p>

      <h3>Fake timers, which cleanup knows nothing about</h3>
      <p>
        <code>jest.useFakeTimers()</code> replaces the environment&apos;s clock and stays
        replaced for the rest of the file. Nothing in RTL restores it:
      </p>

      <CodeBlock language="jsx" title="Two tests, one clock">
{`test('A: uses fake timers and forgets to restore them', () => {
  jest.useFakeTimers();
  render(<p>a</p>);
  expect(screen.getByText('a')).toBeInTheDocument();
});

test('B: an ordinary async test', async () => {
  render(<p>b</p>);
  await new Promise((r) => setTimeout(r, 10));   // 10 milliseconds
  expect(screen.getByText('b')).toBeInTheDocument();
}, 3000);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — and then the same file with one afterEach added">
{`# as written:
    Cause:
        thrown: "Exceeded timeout of 3000 ms for a test.

        >  9 | test('B: an ordinary async test', async () => {
          11 |   await new Promise((r) => setTimeout(r, 10));

Tests:       1 failed, 1 passed, 2 total

# with afterEach(() => { jest.useRealTimers(); }):
  ✓ A: uses fake timers and the hook restores them (9 ms)
  ✓ B: an ordinary async test (12 ms)
Tests:       2 passed, 2 total`}
      </CodeBlock>

      <p>
        A ten-millisecond sleep that times out after three seconds is the signature. The
        clock never advanced because test A&apos;s fake timers were still installed, so
        the promise never settled. <code>afterEach(() =&gt; jest.useRealTimers())</code>{' '}
        belongs in the setup file of any suite that uses fake timers anywhere — twelve
        milliseconds instead of a timeout, from one line.
      </p>

      <h3>What actually resets, and when</h3>
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>Between tests</th>
            <th>Between test files</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>React trees rendered by RTL, and their containers</td>
            <td>yes — auto <code>cleanup()</code></td>
            <td>yes</td>
          </tr>
          <tr>
            <td>Anything your code appended to <code>document.body</code></td>
            <td><strong>no</strong></td>
            <td>yes (new jsdom)</td>
          </tr>
          <tr>
            <td>
              <code>document.title</code>, <code>body</code> classes, focus,{' '}
              <code>localStorage</code>
            </td>
            <td><strong>no</strong></td>
            <td>yes (new jsdom)</td>
          </tr>
          <tr>
            <td>Fake timers, pending timers</td>
            <td><strong>no</strong></td>
            <td>yes (disposed at teardown)</td>
          </tr>
          <tr>
            <td>Module-level variables, singleton stores, caches</td>
            <td><strong>no</strong></td>
            <td>yes (fresh module registry)</td>
          </tr>
          <tr>
            <td>
              <code>jest.fn()</code> call history
            </td>
            <td>
              only with <code>clearMocks</code> / <code>resetMocks</code> /{' '}
              <code>restoreMocks</code>
            </td>
            <td>yes</td>
          </tr>
        </tbody>
      </table>
      <p>
        The right-hand column is why &ldquo;it passes when I run that file on its
        own&rdquo; is so common: a test <em>file</em> is a real isolation boundary — new
        jsdom, new module registry — and a test is not. It is also why putting each
        scenario in its own file &ldquo;fixes&rdquo; leaks while leaving the bug in the
        product code, where it will reappear as a real memory leak in the browser.
      </p>

      <h2>Family 3: Async That Outlives the Test</h2>
      <p>
        The purest form of &ldquo;leaking async&rdquo;: the test finished, and work it
        started did not. Three things can happen, and which one you get depends on
        whether the component is still mounted and whether the continuation is jsdom&apos;s
        or Node&apos;s.
      </p>

      <h3>1. Silence — and that is the problem</h3>
      <p>
        A component fetches, the test returns immediately, RTL unmounts it, and twenty
        milliseconds later the promise resolves and calls <code>setState</code> on a tree
        that is gone:
      </p>

      <CodeBlock language="text" title="Real output — React 19.3.1, a setState after unmount">
{`Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total`}
      </CodeBlock>

      <p>
        Nothing. No warning at all. React 18 deliberately removed the old{' '}
        <em>&ldquo;Can&apos;t perform a React state update on an unmounted
        component&rdquo;</em> warning because it fired on correct code too often, and
        React 19 has not brought it back: an update to an unmounted fiber is simply
        dropped. So the most common leak in a React suite is <strong>completely
        silent</strong> — RTL unmounted the component, which suppressed the only warning
        that used to point at it, while the request still went out and the mock was still
        called. That is exactly the family 1 failure from earlier, viewed from the other
        end.
      </p>

      <h3>2. The <code>act()</code> warning, attributed to the wrong test</h3>
      <p>
        If the late work updates something that is <em>still</em> mounted — a
        module-level store that a later test subscribes to, a leaked interval driving a
        singleton — React does warn. Here a poller started in test A keeps bumping a
        store that test B&apos;s component is subscribed to:
      </p>

      <CodeBlock language="text" title="Real output — printed while test B runs">
{`console.error
  An update to Badge inside a test was not wrapped in act(...).

  When testing, code that causes React state updates should be wrapped into act(...):
  …
    > 21 |   useEffect(() => store.subscribe(() => setN(store.get())), []);

    at dispatchSetState (node_modules/react-dom/cjs/react-dom-client.development.js:9513:7)
    at t/14-act-warning.test.tsx:21:41
    at Object.bump (t/14-act-warning.test.tsx:11:15)
    at t/14-act-warning.test.tsx:27:27
    at Timeout.task [as _onTimeout] (node_modules/jsdom/lib/jsdom/browser/Window.js:579:19)

PASS t/14-act-warning.test.tsx
  ✓ A: starts a poller and leaves (9 ms)
  ✓ B: an unrelated slow test that mounts the same badge (151 ms)

Tests:       2 passed, 2 total`}
      </CodeBlock>

      <p>
        Four of those warnings, 133 lines of console output, and the suite is{' '}
        <strong>green</strong>. Nobody fails a build on it, so it accumulates until the
        log is unreadable and people start filtering <code>console.error</code> — which
        is how a suite ends up unable to report real problems.
      </p>
      <p>
        The diagnostic is in the part of the stack everybody skips. Read it{' '}
        <strong>bottom-up</strong>:
      </p>
      <ul>
        <li>
          <code>Timeout.task … jsdom/browser/Window.js</code> — the update was driven by
          a <strong>timer</strong>, not by anything the current test did. Were this the
          test&apos;s own doing, the bottom frame would be the test body.
        </li>
        <li>
          The frame directly above it, <code>t/14-…test.tsx:27</code>, is{' '}
          <strong>line 27 — inside test A</strong>, where the interval was created. The
          warning prints during test B and names the leaking line in test A.
        </li>
        <li>
          The top frames (<code>dispatchSetState</code>, your <code>useEffect</code>) are
          the victim, and they are the only part most people read.
        </li>
      </ul>

      <h3>3. The torn-down environment</h3>
      <p>
        When a late continuation survives the end of the whole <em>file</em>, Jest has
        already disposed of the environment it was running in:
      </p>

      <CodeBlock language="text" title="Real output — a node-level timer that fires after the file ends">
{`Tests:       1 passed, 1 total
Ran all test suites matching t/12.

ReferenceError: You are trying to \`require\` a file after the Jest environment has
been torn down. From t/12-torn-down-node.test.tsx.

    >  10 |       const mod = await import('./helper');

      at Timeout._onTimeout (t/12-torn-down-node.test.tsx:10:19)

>>> jest exited: code=1`}
      </CodeBlock>

      <p>
        Note the sequence: <strong>1 passed</strong>, then a crash,{' '}
        <strong>then exit code 1</strong>. A green test report and a red build, with the
        error arriving after the summary — which is why it gets scrolled past in CI logs.
        The message is the most useful one in this whole lesson, though, because it names
        the file, and the stack names the line.
      </p>

      <h2>Family 4: The Process-Level Leak</h2>
      <p>
        Now the one with the most folklore attached. The universal advice when{' '}
        <em>&ldquo;Jest did not exit&rdquo;</em> appears is to go looking for a{' '}
        <code>setInterval</code> in a component with no cleanup. Here is that exact
        component, measured:
      </p>

      <CodeBlock language="jsx" title="The component everyone blames">
{`function Clock() {
  const [n, setN] = useState(0);
  useEffect(() => {
    setInterval(() => setN((x) => x + 1), 50);   // no cleanup, deliberately
  }, []);
  return <p>ticks: {n}</p>;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — npx jest t/01 --detectOpenHandles">
{`Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total

>>> jest exited: code=0 signal=null after 0.9s`}
      </CodeBlock>

      <p>
        <strong>Zero open handles, clean exit, nine-tenths of a second.</strong> The
        leaked interval did not keep Jest alive, and <code>--detectOpenHandles</code> had
        nothing to report. The reason is in the environment&apos;s own teardown — this is
        the whole of it, from <code>@jest/environment-jsdom-abstract</code> 30.5.2:
      </p>

      <CodeBlock language="javascript" title="@jest/environment-jsdom-abstract 30.5.2 — teardown()">
{`async teardown() {
  if (this.fakeTimers)       { this.fakeTimers.dispose(); }
  if (this.fakeTimersModern) { this.fakeTimersModern.dispose(); }
  if (this.global != null) {
    if (this.errorEventListener) {
      this.global.removeEventListener('error', this.errorEventListener);
    }
    this.global.close();        // <- jsdom's window.close(): every timer dies
  }
  …
}`}
      </CodeBlock>

      <p>
        <code>window.close()</code> stops jsdom&apos;s timer queue. Under{' '}
        <code>testEnvironment: jsdom</code>, <code>setInterval</code> in your component{' '}
        <em>is</em> jsdom&apos;s, so the environment takes it with it. Change one thing —
        take the timer from Node instead of from the window — and the outcome inverts:
      </p>

      <CodeBlock language="text" title="Real output — the same test, with a timer from node:timers">
{`Tests:       1 passed, 1 total

Jest has detected the following 1 open handle potentially keeping Jest from exiting:

  ●  Timeout

    > 5 |   nodeSetInterval(() => {}, 50);
        |                  ^

      at Object.<anonymous> (t/04-node-timer.test.tsx:5:18)

>>> KILLED by the harness after 12s — jest had not exited.`}
      </CodeBlock>

      <p>
        So the rule is not &ldquo;clear your intervals&rdquo; (do that anyway — it is a
        real browser leak and it causes the family 1 and 3 failures above). The rule for{' '}
        <em>this</em> symptom is narrower and much more useful:
      </p>

      <InfoBox variant="tip" title="&ldquo;Jest did not exit&rdquo; means a NODE handle is open">
        <p>
          Under the jsdom environment, anything the window owns is cleaned up for you.
          What hangs the process is a handle outside jsdom&apos;s reach — and the list is
          short enough to check by hand:
        </p>
        <ul>
          <li>an HTTP server you started and never closed (MSW&apos;s node server, a stub API)</li>
          <li>a database pool or client: <code>pg</code>, <code>mongodb</code>, <code>redis</code></li>
          <li>a real socket or <code>WebSocket</code>, <code>fs.watch</code>, a <code>child_process</code></li>
          <li>
            a timer taken from <code>node:timers</code>, or captured from the real{' '}
            <code>globalThis</code> by a library before jsdom was installed
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          If none of those appear in the test file, the handle came from a module it
          imported. <code>--detectOpenHandles</code> will name the line.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Real output — --detectOpenHandles on an unclosed server">
{`Jest has detected the following 1 open handle potentially keeping Jest from exiting:

  ●  TCPSERVERWRAP

       6 | test('a test that opens a server and never closes it', async () => {
       7 |   const server = net.createServer();
    >  8 |   await new Promise((res) => server.listen(0, res));
         |                                           ^
       9 |   render(<p>hello</p>);

      at children (t/03-node-handle.test.tsx:8:43)`}
      </CodeBlock>

      <p>
        The handle class names the culprit: <code>TCPSERVERWRAP</code> is a listening
        socket, <code>Timeout</code> a timer, <code>FSREQCALLBACK</code> file I/O. And
        the frame is the exact line. The flag is worth the two notes that follow, though.
      </p>

      <h3>The same leak has two completely different outcomes</h3>
      <p>
        Whether Jest ran your files in-band or in worker processes decides what a Node
        handle does to the run. Both of these are the same leak:
      </p>

      <CodeBlock language="text" title="Real output — in-band (few/fast files, or --detectOpenHandles, or --runInBand)">
{`Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Ran all test suites matching t/03.
Jest did not exit one second after the test run has completed.

'This usually means that there are asynchronous operations that weren't stopped in
your tests. Consider running Jest with \`--detectOpenHandles\` to troubleshoot this issue.

>>> KILLED by the harness after 12s — jest had not exited.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — with workers (4 slower files, --maxWorkers=2)">
{`A worker process has failed to exit gracefully and has been force exited. This is
likely caused by tests leaking due to improper teardown. Try running with
--detectOpenHandles to find leaks. Active timers can also cause this, ensure that
.unref() was called on them.

Test Suites: 4 passed, 4 total
Tests:       4 passed, 4 total

>>> jest exited: code=0 signal=null after 4.2s`}
      </CodeBlock>

      <p>
        In-band, Jest prints a warning and then <strong>waits forever</strong> — the
        process never exits, so CI kills it on a job timeout and reports something
        unhelpful like &ldquo;no output for 10 minutes&rdquo;. With workers, Jest force-kills
        the worker, prints a different warning, and <strong>exits 0 with a green
        suite</strong>. Same bug, opposite outcomes, and nothing in either message says
        which test file did it.
      </p>
      <p>
        That also explains a confusing pair of observations people report: it hangs
        locally but passes in CI (or the reverse), and{' '}
        <code>--detectOpenHandles</code> &ldquo;changes the behaviour&rdquo; — it does,
        because it implies <code>--runInBand</code>. And <code>--forceExit</code>, often
        added to make the hang go away, converts the first outcome into the second: the
        leak is still there, you have only stopped being told about it. Use it to unblock
        a release, never as a resting state.
      </p>

      <h3><code>--detectLeaks</code>: narrow, experimental, and it works</h3>
      <CodeBlock language="text" title="Real output — npx jest t/slow-leak --detectLeaks">
{`FAIL t/slow-leak.test.tsx
  ● Test suite failed to run

    EXPERIMENTAL FEATURE!
    Your test suite is leaking memory. Please ensure all references are cleaned.

    There is a number of things that can leak memory:
      - Async operations that have not finished (e.g. fs.readFile).
      - Timers not properly mocked (e.g. setInterval, setTimeout).
      - Keeping references to the global scope.

Test Suites: 1 failed, 1 total
Tests:       0 total`}
      </CodeBlock>

      <p>
        It garbage-collects the environment after each file and fails the file if it
        survived. Worth running occasionally to localise a leak to a file, with two
        caveats: the failure is reported at suite level with{' '}
        <strong><code>Tests: 0 total</code></strong>, so at a glance it reads like a
        config error rather than a leak; and it is still marked experimental, so it does
        not belong in a required CI gate.
      </p>

      <h3>Heap growth, and why <code>--logHeapUsage</code> alone tells you nothing</h3>
      <p>
        A Node handle that captures a closure over the jsdom window keeps the whole
        environment alive after the file is done — document, fibers, every DOM node. That
        is the mechanism behind &ldquo;CI dies after 300 test files&rdquo;. Six identical
        files, each rendering a 4,000-row list, run two ways:
      </p>

      <CodeBlock language="text" title="Real output — six files, --logHeapUsage --runInBand, NO --expose-gc">
{`# clean                                   # leaky
PASS heap-clean-6 (130 MB heap size)      PASS heap-leak-6 (139 MB heap size)
PASS heap-clean-5 (169 MB heap size)      PASS heap-leak-5 (176 MB heap size)
PASS heap-clean-1 (201 MB heap size)      PASS heap-leak-4 (210 MB heap size)
PASS heap-clean-2 (228 MB heap size)      PASS heap-leak-3 (239 MB heap size)
PASS heap-clean-3 (256 MB heap size)      PASS heap-leak-2 (225 MB heap size)
PASS heap-clean-4 (232 MB heap size)      PASS heap-leak-1 (261 MB heap size)`}
      </CodeBlock>

      <p>
        Both climb from ~130MB to ~260MB. The column is useless: V8 grows the heap
        lazily and collects when it feels like it, so a healthy suite and a leaking one
        look the same. Now the identical runs with <code>--expose-gc</code>, which makes
        Jest force a collection before each measurement:
      </p>

      <CodeBlock language="text" title="Real output — node --expose-gc ./node_modules/jest/bin/jest.js … --logHeapUsage --runInBand">
{`# clean                                   # leaky
PASS heap-clean-6 ( 88 MB heap size)      PASS heap-leak-6 ( 88 MB heap size)
PASS heap-clean-5 (108 MB heap size)      PASS heap-leak-2 (108 MB heap size)
PASS heap-clean-4 (107 MB heap size)      PASS heap-leak-5 (125 MB heap size)
PASS heap-clean-1 (108 MB heap size)      PASS heap-leak-1 (141 MB heap size)
PASS heap-clean-2 (108 MB heap size)      PASS heap-leak-4 (158 MB heap size)
PASS heap-clean-3 (124 MB heap size)      PASS heap-leak-3 (174 MB heap size)`}
      </CodeBlock>

      <p>
        The clean run is <strong>flat</strong> — 108MB, file after file. The leaking run
        climbs <strong>monotonically, about 17MB per file</strong>, which is roughly one
        retained jsdom environment plus its 4,000 rows. Extrapolate that to a few hundred
        files and the worker dies. The flag only works with its two companions, exactly
        as <code>jest --help</code> says and exactly as everyone ignores:{' '}
        <code>--runInBand</code> and <code>--expose-gc</code>.
      </p>

      <InfoBox variant="note" title="workerIdleMemoryLimit: a tourniquet, not a fix">
        <p style={{ marginBottom: 0 }}>
          <code>workerIdleMemoryLimit: &apos;512MB&apos;</code> in{' '}
          <code>jest.config.js</code> restarts a worker once it exceeds the limit between
          files. It is a legitimate way to keep a large suite green while you fix the
          underlying leak, and it is the right call when the leak is in a dependency you
          do not control. It is not in <code>jest --help</code> for 30.5.2 — it is a
          config option — but it is accepted on the CLI too. Reach for it after
          measuring, not instead of measuring: a suite that needs it is paying worker
          startup cost repeatedly.
        </p>
      </InfoBox>

      <h2>The Setup File That Prevents Most of This</h2>
      <p>
        Almost everything above is prevented by a handful of lines in the file your{' '}
        <code>setupFilesAfterEnv</code> already points at, plus one habit in component
        code.
      </p>

      <CodeBlock language="javascript" title="src/setupTests.ts">
{`import '@testing-library/jest-dom';

// RTL's auto-cleanup covers React trees. These cover the rest.
afterEach(() => {
  jest.useRealTimers();     // a fake clock in one test must not reach the next
  jest.clearAllMocks();     // call history only; see the caveat below
});

// If a suite-wide network mock is in play, close it exactly once:
// afterAll(() => server.close());   // MSW — its node server IS a Node handle`}
      </CodeBlock>

      <p>
        The caveat on <code>clearAllMocks</code> is the one measured in family 1: it
        tidies <em>history</em>, and it cannot cancel work that is still queued. It makes
        the suite easier to reason about; it does not fix a leak.
      </p>
      <p>
        The habit, which is the actual fix for most of this page: <strong>every effect
        that starts something returns a function that stops it</strong>. A timer gets{' '}
        <code>clearTimeout</code>/<code>clearInterval</code>, a request gets an{' '}
        <code>AbortController</code>, a subscription gets its unsubscribe, a listener
        gets <code>removeEventListener</code>, and anything appended to{' '}
        <code>document.body</code> gets removed. Each of those is also a real leak in the
        browser — the test suite is just the first place it becomes visible, because a
        test suite mounts and unmounts a component a hundred times in a second and your
        users do not.
      </p>

      <h2>The Diagnostic, Compressed</h2>
      <table>
        <thead>
          <tr>
            <th>Symptom</th>
            <th>Family</th>
            <th>First move</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A test fails; it passes when run with <code>-t</code> alone</td>
            <td>1 / 2</td>
            <td>
              <code>--randomize --seed=N</code> to confirm order dependence, then read
              the tests <em>before</em> it
            </td>
          </tr>
          <tr>
            <td><em>Found multiple elements</em> in a sane-looking query</td>
            <td>2</td>
            <td>
              print <code>document.body.innerHTML</code>; check nothing disabled
              auto-cleanup
            </td>
          </tr>
          <tr>
            <td>
              <em>Unable to find…</em> and the dump shows <code>&lt;body /&gt;</code>
            </td>
            <td>2</td>
            <td>
              a <code>render()</code> in <code>beforeAll</code>, or a missing{' '}
              <code>await</code>
            </td>
          </tr>
          <tr>
            <td>A short <code>await</code> times out at the test timeout</td>
            <td>2</td>
            <td>
              fake timers left installed by an earlier test —{' '}
              <code>afterEach(jest.useRealTimers)</code>
            </td>
          </tr>
          <tr>
            <td>Pages of <code>act()</code> warnings, suite green</td>
            <td>3</td>
            <td>read the bottom of the stack: it names the test that started it</td>
          </tr>
          <tr>
            <td><em>…after the Jest environment has been torn down</em></td>
            <td>3</td>
            <td>the message names the file; the stack names the line</td>
          </tr>
          <tr>
            <td><em>Jest did not exit one second after…</em> (hangs)</td>
            <td>4</td>
            <td>
              <code>--detectOpenHandles</code>; look for servers, pools, sockets,{' '}
              <code>node:timers</code>
            </td>
          </tr>
          <tr>
            <td><em>A worker process has failed to exit gracefully</em></td>
            <td>4</td>
            <td>
              same cause, exit code 0 — do not let the green tick fool you
            </td>
          </tr>
          <tr>
            <td>CI out of memory after N files</td>
            <td>4</td>
            <td>
              <code>--logHeapUsage --runInBand</code> <strong>with</strong>{' '}
              <code>--expose-gc</code>; flat is healthy, monotonic is a leak
            </td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="One environment quirk, in case your output looks different">
        <p style={{ marginBottom: 0 }}>
          Jest 30 swaps in a quieter reporter when it detects it is running under an AI
          coding agent — <code>AI_AGENT</code>, <code>CLAUDECODE</code>,{' '}
          <code>CURSOR_AGENT</code>, <code>GEMINI_CLI</code>,{' '}
          <code>CODEX_SANDBOX</code> and friends, checked by name in{' '}
          <code>@jest/core</code> 30.5.2. It prints failures but suppresses the per-file{' '}
          <code>PASS</code> lines — and the heap figures ride on those lines, so{' '}
          <code>--logHeapUsage</code> appears to do nothing. If you are missing output
          this lesson shows, add <code>--reporters=default</code>. (That is how the heap
          tables above were produced.)
        </p>
      </InfoBox>

      <p>
        The related failure modes that are about <em>waiting</em> rather than leaking —
        missing <code>await</code>, vacuous absence assertions, <code>waitFor</code>{' '}
        advancing a fake clock — live next door in{' '}
        <a href="/react-testing/async-deep-dive">Waiting, act(), and Async Failure
        Modes</a>. And if the phrase &ldquo;virtual DOM&rdquo; in this context is doing
        more harm than good, <a href="/react18/virtual-dom">The Virtual DOM, Fibers &amp;
        Reconciliation</a> separates it from jsdom, which is a real DOM and the thing
        every query on this page actually ran against.
      </p>
    </LessonLayout>
  );
}
