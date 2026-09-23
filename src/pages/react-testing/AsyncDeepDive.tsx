import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function AsyncDeepDive() {
  return (
    <LessonLayout
      title="Waiting, act(), and Async Failure Modes"
      sectionId="react-testing"
      lessonIndex={4}
      prev={{ path: '/react-testing/async', label: 'Testing Async & APIs' }}
      next={{ path: '/react-testing/forms', label: 'Testing Forms & Routing' }}
    >
      <p>
        The previous lesson, <em>Testing Async &amp; APIs</em>, showed you <strong>which</strong>{' '}
        tool to reach for: <code>findBy</code> to wait for an element, <code>waitFor</code> for
        everything else, MSW at the network boundary. This lesson is the layer underneath. It
        answers the question you actually hit at the keyboard:{' '}
        <em>&ldquo;my assertion ran before the thing appeared — why, and what is{' '}
        <code>await</code> really doing?&rdquo;</em>
      </p>
      <p>
        Everything below was run against a real toolchain rather than recalled:{' '}
        <strong>Jest 30.5.2</strong>, <strong>jest-environment-jsdom 30.5.2</strong>,{' '}
        <strong>@testing-library/react 16.3.3</strong> (which brings{' '}
        <strong>@testing-library/dom 10.4.2</strong>),{' '}
        <strong>@testing-library/user-event 14.6.7</strong>,{' '}
        <strong>@testing-library/jest-dom 7.0.1</strong>,{' '}
        <strong>React 19.3.0</strong>, <strong>ts-jest 29.4.12</strong>, on Node 25.2.1. Two
        things the common folklore gets wrong turned up in the process, and they are called out
        where they land.
      </p>

      <h2>Why the Assertion Fires Too Early</h2>
      <p>
        Start with the component that causes the problem. Nothing about it is unusual — a
        fetch in an effect, a loading string until the data lands.
      </p>

      <CodeBlock language="jsx" title="The component and the test that fails">
{`function Profile() {
  const [name, setName] = useState(null);
  useEffect(() => {
    // A promise. It could be fetch(); here it is the simplest possible one,
    // already resolved, so no network and no timer are involved at all.
    Promise.resolve('Alice').then(setName);
  }, []);
  return <p>{name ? \`Hello, \${name}\` : 'Loading...'}</p>;
}

test('shows the name', () => {
  render(<Profile />);
  expect(screen.getByText('Hello, Alice')).toBeInTheDocument();   // throws
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — the getByText on the line after render()">
{`Unable to find an element with the text: Hello, Alice. This could be because the
text is broken up by multiple elements. In this case, you can provide a function
for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <p>
      Loading...
    </p>
  </div>
</body>`}
      </CodeBlock>

      <p>
        The DOM dump is the whole story: at the instant your assertion ran, the paragraph said{' '}
        <code>Loading...</code>. Note that the promise was <em>already resolved</em> when the
        effect created it. Even so, the DOM is not updated. Two separate deferrals are stacked
        on top of each other, and it is worth pulling them apart.
      </p>

      <FlowChart
        title="Where your assertion lands relative to the re-render"
        chart={"graph TD\n  A[\"Test calls render()\"] --> B[\"React mounts the tree and runs effects<br/>synchronously, inside act()\"]\n  B --> C[\"render() RETURNS<br/>DOM = 'Loading...'\"]\n  C --> D[\"getByText('Hello, Alice') runs HERE<br/>and throws\"]\n  C --> E[\"the MICROTASK queue drains\"]\n  E --> F[\".then(setName) runs<br/>setState is called\"]\n  F --> G[\"React SCHEDULES a re-render.<br/>It does NOT commit one yet.\"]\n  G --> H[\"a later TASK runs the scheduled work\"]\n  H --> I[\"component re-renders and commits<br/>DOM = 'Hello, Alice'\"]\n  style D fill:#3b1a1a,stroke:#f87171\n  style I fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        <strong>Deferral one: the promise.</strong> <code>render()</code> is synchronous. It
        mounts, it runs your effects, and it returns — all before the next line of your test
        executes. Your effect called <code>.then(setName)</code>, but a <code>.then</code>{' '}
        callback never runs synchronously, even on an already-resolved promise. It is queued as
        a <em>microtask</em>, and microtasks only run once the currently executing JavaScript
        stack empties out. Your test function is still on that stack.
      </p>
      <p>
        <strong>Deferral two: the commit.</strong> This is the part that surprises people, so
        it is worth instrumenting. The component and the test below log at every boundary;{' '}
        <code>console.error</code> is captured into the same stream so the ordering is
        unambiguous.
      </p>

      <CodeBlock language="jsx" title="The instrumented version">
{`function Profile() {
  const [name, setName] = useState(null);
  log(\`    render() body runs, name = \${JSON.stringify(name)}\`);
  useEffect(() => {
    log('    effect runs, calls the promise');
    Promise.resolve('Alice').then((n) => {
      log('    .then callback runs -> setName("Alice")');
      setName(n);
    });
  }, []);
  return <p>{name ? \`Hello, \${name}\` : 'Loading...'}</p>;
}

test('exact tick-by-tick sequence', async () => {
  log('1. calling render()');
  render(<Profile />);
  log(\`2. render() returned. DOM = \${JSON.stringify(document.body.textContent)}\`);

  for (let i = 1; i <= 6; i++) {
    await Promise.resolve();                       // yield one microtask
    log(\`3.\${i} after microtask #\${i}. DOM = \${JSON.stringify(document.body.textContent)}\`);
  }

  await new Promise((r) => setTimeout(r, 0));      // yield one task
  log(\`4. after setTimeout(0) macrotask. DOM = \${JSON.stringify(document.body.textContent)}\`);
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — the real tick-by-tick trace">
{`1. calling render()
    render() body runs, name = null
    effect runs, calls the promise
2. render() returned. DOM = "Loading..."
    .then callback runs -> setName("Alice")
    [console.error] An update to %s inside a test was not wrapped in act(...).
3.1 after microtask #1. DOM = "Loading..."
3.2 after microtask #2. DOM = "Loading..."
3.3 after microtask #3. DOM = "Loading..."
3.4 after microtask #4. DOM = "Loading..."
3.5 after microtask #5. DOM = "Loading..."
3.6 after microtask #6. DOM = "Loading..."
    render() body runs, name = "Alice"
4. after setTimeout(0) macrotask. DOM = "Hello, Alice"`}
      </CodeBlock>

      <p>
        Read line by line, that trace says something quite specific:
      </p>
      <ul>
        <li>
          The effect ran <em>before</em> <code>render()</code> returned. Effects are not the
          thing you are waiting for.
        </li>
        <li>
          <code>setName</code> was called on the very <strong>first microtask</strong> after{' '}
          <code>render()</code> returned — earlier than most people assume.
        </li>
        <li>
          <strong>And then nothing happened for six more microtasks.</strong> The state was
          updated; the DOM was not. React <em>scheduled</em> the re-render rather than
          performing it, and that scheduled work runs in a later <em>task</em>, not in the
          microtask that called <code>setState</code>.
        </li>
        <li>
          The component body only re-ran when the test yielded to the timer queue.
        </li>
      </ul>

      <InfoBox variant="danger" title="&ldquo;Just await a tick&rdquo; Is the Wrong Mental Model">
        <p>
          The folk fix for this bug is to sprinkle in <code>await Promise.resolve()</code> or{' '}
          <code>await null</code>. Run in isolation, one render per test, here is what each
          strategy actually produces:
        </p>
        <CodeBlock language="text" title="Actual output — one render per test, so nothing leaks between cases">
{`1. 10 microtasks                      -> "Loading..."
2. setTimeout(0), no microtasks first  -> "Hello, Alice"
3. 2 microtasks then setTimeout(0)     -> "Hello, Alice"
4. setTimeout(0) x2                    -> "Hello, Alice"
5. await act(async () => {})           -> "Hello, Alice"`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Ten microtasks in a row are not enough, because the commit is not waiting on a
          microtask. And the cases that <em>do</em> work only work by accident of ordering — an
          extra pending promise in the chain, a slower mock, a <code>setState</code> inside a{' '}
          <code>useEffect</code> that runs after the first commit, and the same line stops
          being enough. That is precisely the shape of a flaky test. The waiting primitives
          exist so you never have to reason about tick counts at all.
        </p>
      </InfoBox>

      <h2>The Three Waiting Primitives</h2>
      <p>
        Everything RTL offers for waiting reduces to three functions. Picking the wrong one is
        the single most common cause of a test that passes while proving nothing.
      </p>

      <table>
        <thead>
          <tr>
            <th>Primitive</th>
            <th>Waits for</th>
            <th>Resolves with</th>
            <th>Fails when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>findBy*</code></td>
            <td>one element to <strong>appear</strong></td>
            <td>the element</td>
            <td>0 matches at timeout, or 2+ matches</td>
          </tr>
          <tr>
            <td><code>findAllBy*</code></td>
            <td><strong>at least one</strong> match to appear</td>
            <td>an array</td>
            <td>0 matches at timeout</td>
          </tr>
          <tr>
            <td><code>waitFor(cb)</code></td>
            <td>an arbitrary <strong>assertion</strong> to stop throwing</td>
            <td>whatever <code>cb</code> returns</td>
            <td><code>cb</code> still throwing at timeout</td>
          </tr>
          <tr>
            <td><code>waitForElementToBeRemoved</code></td>
            <td>a known element to <strong>disappear</strong></td>
            <td><code>undefined</code></td>
            <td>still present at timeout, <em>or absent up front</em></td>
          </tr>
        </tbody>
      </table>

      <p>
        <code>findBy*</code> is not a separate mechanism — it is literally{' '}
        <code>waitFor</code> wrapped around <code>getBy*</code>. Prefer it for the single-element
        case; the <em>Best Practices &amp; Anti-Patterns</em> lesson has the full argument for
        why, including the measurement showing the two are indistinguishable on timing and
        error text.
      </p>

      <h3>findAllBy resolves at the FIRST match, not the last</h3>
      <p>
        This one bites when a list fills in progressively. Given a component that appends one
        item every 30ms:
      </p>

      <CodeBlock language="jsx" title="The count trap">
{`// A list that appends 'Alice', then 'Bob', then 'Carol' at 30/60/90ms.
render(<DripList />);

const items = await screen.findAllByRole('listitem');
expect(items).toHaveLength(3);   // <-- fails`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`A: findAllByRole resolved with 1 item(s): [ 'Alice' ]`}
      </CodeBlock>

      <p>
        <code>findAllBy*</code> is <code>waitFor</code> + <code>getAllBy*</code>, and{' '}
        <code>getAllBy*</code> is satisfied by a single match. The moment one{' '}
        <code>&lt;li&gt;</code> exists, the promise resolves. If the <em>count</em> is what you
        care about, the count has to be inside the retried callback:
      </p>

      <CodeBlock language="jsx" title="The fix — put the condition you actually mean inside waitFor">
{`const items = await waitFor(() => {
  const els = screen.getAllByRole('listitem');
  expect(els).toHaveLength(3);
  return els;                    // waitFor resolves with the callback's return value
});`}
      </CodeBlock>

      <h3>Disappearance: why not.toBeInTheDocument is a trap</h3>
      <p>
        There is no <code>findBy</code> for absence, so the natural move is to wrap a negative
        assertion in <code>waitFor</code>. It does not work, and it fails in the worst possible
        direction — by passing.
      </p>

      <CodeBlock language="jsx" title="Two tests that both pass, and neither should reassure you">
{`// (a) The spinner was never rendered by this component at all.
render(<Static />);
await waitFor(() => {
  expect(screen.queryByText('a spinner that was never rendered')).not.toBeInTheDocument();
});

// (b) The spinner appears at 60ms. We assert it is "gone" at t=0.
render(<LateSpinner />);
await waitFor(() => {
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`C: PASSED in 2ms — asserting the absence of something that never existed
D: "spinner is gone" PASSED in 2ms — but it had not even arrived yet
D: ...and 60ms later the spinner IS in the document: true`}
      </CodeBlock>

      <p>
        Both passed in 2ms. <code>waitFor</code> resolves the first time its callback does not
        throw, and &ldquo;not in the document&rdquo; is true on the very first check — before
        the spinner has had any chance to render. The assertion is not wrong so much as{' '}
        <em>vacuous</em>: it would keep passing if you deleted the spinner, deleted the fetch,
        or deleted the component. Use the tool built for the job:
      </p>

      <CodeBlock language="jsx" title="waitForElementToBeRemoved — presence is proved first">
{`render(<UserList />);

// Element form: grab it while it is there, then wait for that node to detach.
const spinner = screen.getByRole('status');
await waitForElementToBeRemoved(spinner);

// Callback form: re-queried on every poll. Use queryBy, not getBy.
await waitForElementToBeRemoved(() => screen.queryByRole('status'));`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — the four outcomes, all real">
{`# it was there and then went away (data lands at 40ms)
E: waitForElementToBeRemoved resolved in 43ms; status still present? false

# it was never there — throws IMMEDIATELY, in 0ms, name = Error
G: The element(s) given to waitForElementToBeRemoved are already removed.
   waitForElementToBeRemoved requires that the element(s) exist(s) before
   waiting for removal.

# callback form with getBy instead of queryBy — getBy throws before the guard runs
H: Unable to find an accessible element with the role "status"
H: name = TestingLibraryElementError

# it was there and never left
I: timed out after 1001ms: Timed out in waitForElementToBeRemoved.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why the &ldquo;already removed&rdquo; Error Is a Feature">
        <p>
          That immediate throw in <strong>G</strong> is the entire reason to prefer this
          function. It performs a presence check <em>before</em> it starts waiting, so a test
          that never had a spinner fails loudly in 0ms instead of passing silently in 2ms. It
          converts the vacuous-assertion bug into a real failure.
        </p>
        <p style={{ marginBottom: 0 }}>
          The other reliable pattern is to <strong>wait for the positive replacement</strong>:{' '}
          <code>await screen.findByText(&apos;Alice&apos;)</code> proves the load finished, and{' '}
          <em>then</em> a single plain{' '}
          <code>expect(screen.queryByRole(&apos;status&apos;)).not.toBeInTheDocument()</code>{' '}
          means something, because you know the state it is describing has actually been
          reached.
        </p>
      </InfoBox>

      <h2>How waitFor Actually Works</h2>
      <p>
        <code>waitFor</code> is not magic and it does not understand your promises. It is a
        retry loop with a stopwatch, and almost every misuse follows from not knowing that.
      </p>

      <FlowChart
        title="The waitFor retry loop"
        chart={"graph TD\n  S[\"await waitFor(cb)\"] --> T[\"arm a timeout timer<br/>timeout = getConfig().asyncUtilTimeout = 1000ms\"]\n  T --> U[\"run cb() immediately\"]\n  U --> V{\"did cb throw?\"}\n  V -->|no| W[\"resolve with cb's return value\"]\n  V -->|yes| X[\"swallow it, stash as lastError\"]\n  X --> Y[\"wait for the next trigger:<br/>a DOM mutation, OR the 50ms interval\"]\n  Y --> Z{\"has the timeout fired?\"}\n  Z -->|no| U\n  Z -->|yes| AA[\"reject with lastError<br/>plus a prettyDOM dump\"]\n  style W fill:#1a3329,stroke:#4ade80\n  style AA fill:#3b1a1a,stroke:#f87171\n  style X fill:#3d2f14,stroke:#fb923c"}
      />

      <p>
        Measured against a callback that can never pass, with the defaults untouched:
      </p>

      <CodeBlock language="text" title="Actual output — one waitFor against an element that never appears">
{`A: default timeout -> callback ran 20 times over 1016ms
A: call timestamps (ms): 1, 52, 103, 154, 206, 258, 311, 363, 415, 467,
                         518, 570, 621, 673, 725, 777, 829, 881, 933, 985

B: interval 200 -> callback ran 5 times over 1004ms
C: passing callback -> ran 1 time(s) in 3ms
D: resolved after 2 call(s) in 80ms; stamps: 0, 48   (data arrived at 40ms)`}
      </CodeBlock>

      <p>
        So the verified defaults are a <strong>1000ms timeout</strong> and a{' '}
        <strong>50ms polling interval</strong> — twenty attempts, the first one immediate.
        Two details that are easy to get wrong:
      </p>
      <ul>
        <li>
          The timeout is a global you can change: <code>getConfig().asyncUtilTimeout</code> is{' '}
          <code>1000</code>, and <code>configure(...)</code> moves it. The{' '}
          <strong>interval is not</strong> — there is no <code>asyncUtilInterval</code> key in
          the config object (verified: the full key list is{' '}
          <code>asyncUtilTimeout, asyncWrapper, computedStyleSupportsPseudoElements,
          defaultHidden, defaultIgnore, eventWrapper, getElementError, reactStrictMode,
          showOriginalStackTrace, testIdAttribute, throwSuggestions,
          unstable_advanceTimersWrapper</code>). <code>interval</code> is a per-call option
          only.
        </li>
        <li>
          Polling is the <em>fallback</em>, not the primary trigger. <code>waitFor</code> also
          attaches a <code>MutationObserver</code> to the container watching{' '}
          <code>childList</code>, <code>attributes</code>, <code>characterData</code> and{' '}
          <code>subtree</code>. Case <strong>D</strong> proves it: data landed at 40ms and the
          second check ran at 48ms, ahead of the 50ms tick. In practice your waits resolve as
          soon as the DOM changes, which is why a well-written async test costs single-digit
          milliseconds rather than a polling interval.
        </li>
      </ul>

      <h3>The consequence: a waitFor callback must be an assertion that can fail</h3>
      <p>
        Look again at the decision in the middle of that diagram. <code>waitFor</code> has
        exactly one way to know whether it is done: <strong>did the callback throw?</strong> It
        has no other channel. Everything that follows is a corollary.
      </p>

      <CodeBlock language="text" title="Actual output — callbacks that cannot fail resolve instantly">
{`E: await waitFor(() => {}) resolved in 1ms
G: waitFor(() => screen.queryByText('not here')) resolved in 1ms with: null`}
      </CodeBlock>

      <p>
        An empty callback never throws, so it is a 1ms no-op. A bare <code>queryBy*</code>{' '}
        never throws either — it returns <code>null</code>, <code>waitFor</code> treats that as
        success, and resolves <em>with</em> <code>null</code>. Both of these appear in real
        codebases as &ldquo;let React settle&rdquo; incantations, and both assert precisely
        nothing. (The <em>Best Practices</em> lesson catalogues these as anti-patterns; what
        matters here is <em>why</em> the mechanism permits them.)
      </p>
      <p>
        The other corollary is the dangerous one. A callback that <em>is</em> retried gets
        retried <strong>in full</strong> — including anything in it that is not an assertion.
      </p>

      <CodeBlock language="jsx" title="WRONG — a click inside the retried callback">
{`const onRetry = jest.fn();
render(<Retry onRetry={onRetry} />);

await waitFor(async () => {
  await user.click(screen.getByRole('button', { name: /retry/i }));
  expect(screen.getByText('Done')).toBeInTheDocument();   // never appears
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — four consecutive runs of the same test">
{`A: onRetry was called 20 time(s) from ONE waitFor
A: onRetry was called 19 time(s) from ONE waitFor
A: onRetry was called 19 time(s) from ONE waitFor
A: onRetry was called 19 time(s) from ONE waitFor

# a plain non-async side effect in the same position: 20 times, every run
B: the side effect ran 20 time(s)`}
      </CodeBlock>

      <p>
        One <code>waitFor</code>, nineteen or twenty clicks, and the count is not even stable
        between runs. If that button fires a request, you have just sent twenty requests; if it
        submits a form, you have twenty submissions; if the test later asserts{' '}
        <code>toHaveBeenCalledTimes(1)</code> it fails for a reason that has nothing to do with
        your component.
      </p>

      <CodeBlock language="jsx" title="RIGHT — the side effect goes on the line above">
{`await user.click(screen.getByRole('button', { name: /retry/i }));
await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));

// or, better still, when you are waiting for an element:
await user.click(screen.getByRole('button', { name: /retry/i }));
expect(await screen.findByText('Done')).toBeInTheDocument();`}
      </CodeBlock>

      <InfoBox variant="info" title="An Async waitFor Callback Does Not Poll Faster — It Polls Slower">
        <p>
          <code>waitFor</code> detects a returned thenable and will not start a second attempt
          while the first is pending. A callback that awaits something for 120ms therefore runs
          on a ~170ms cadence, not a 50ms one:
        </p>
        <CodeBlock language="text" title="Actual output — a callback that awaits 120ms internally">
{`C: slow async callback ran 7 time(s) in 1001ms
C: stamps: 0, 152, 306, 459, 611, 763, 917`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Seven attempts instead of twenty inside the same 1000ms budget. This is another
          reason to keep the callback to one cheap synchronous assertion: an expensive one eats
          your retry budget, and the test starts failing on slow CI machines with an error that
          looks like a product bug.
        </p>
      </InfoBox>

      <h2>act(), and How It Interacts With Waiting</h2>
      <p>
        The <em>Best Practices &amp; Anti-Patterns</em> lesson explains what the{' '}
        <code>act()</code> warning means and why the fix is almost never to write{' '}
        <code>act()</code> — read that first if the message itself is what is confusing you.
        What is left, and what belongs here, is the mechanical relationship between{' '}
        <code>act</code> and the waiting primitives.
      </p>
      <p>
        <strong>Why you rarely write it: RTL installs it for you, in two places.</strong> Both
        are observable in the config object at runtime:
      </p>

      <CodeBlock language="jsx" title="You can just print them">
{`import { getConfig } from '@testing-library/react';

console.log(String(getConfig().eventWrapper));
console.log(String(getConfig().asyncWrapper));`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — RTL's own wrappers, truncated as printed">
{`# eventWrapper, with whitespace collapsed and cut at 160 chars:
cb => { if (inEventWrapper) { return cb(); } inEventWrapper = true; try { let result; (0, _actCompat.default)(() => { result = cb(); }); return result; } finall

# asyncWrapper, first 200 chars:
async cb => {
    const previousActEnvironment = (0, _actCompat.getIsReactActEnvironment)();
    (0, _actCompat.setReactActEnvironment)(false);
    try {
      const result = await cb();
      // Drai`}
      </CodeBlock>

      <p>
        The <code>(0, _actCompat.default)(...)</code> spelling is just how the transpiler emits
        a call to an imported default — read it as <code>act(...)</code>. So{' '}
        <code>eventWrapper</code> literally runs your event inside <code>act()</code>, which is
        why <code>fireEvent.click</code> produces an updated DOM on the very next line.
        Verified: <code>&quot;count 1&quot;</code> immediately after the click, with{' '}
        <strong>zero</strong> act warnings.
      </p>
      <p>
        <code>asyncWrapper</code> is the interesting one. It deliberately turns the act
        environment <em>off</em> for the duration of the wait, then drains the queue afterwards
        — which is what lets <code>await waitFor(...)</code> and{' '}
        <code>await screen.findBy...</code> sit through a real promise resolution without
        tripping the warning. Verified: <strong>0 act warnings</strong> for the failing{' '}
        <code>Profile</code> test from the top of this lesson, once the assertion is{' '}
        <code>await screen.findByText(&apos;Hello, Alice&apos;)</code>.
      </p>

      <h3>Where the auto-wrapping stops: timers</h3>
      <p>
        Nothing wraps <code>jest.advanceTimersByTime</code>. It is a Jest API; Testing Library
        never sees the call. So when a timer fires a <code>setState</code>, that update lands
        outside any act window, and React schedules it without committing:
      </p>

      <CodeBlock language="jsx" title="The same 40ms timer, three ways">
{`// A: no wrapper at all
render(<UserList delay={40} />);
jest.advanceTimersByTime(40);

// B: the sync wrapper
render(<UserList delay={40} />);
act(() => { jest.advanceTimersByTime(40); });

// C: the async wrapper — required if the timer callback awaits anything
render(<UserList delay={40} />);
await act(async () => { await jest.advanceTimersByTimeAsync(40); });`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`A: items after bare advanceTimersByTime = 0
A: console.error calls = 1  ->  An update to UserList inside a test was not wrapped in act(...).
B: items = 3, console.error calls = 0
C: items = 3, console.error calls = 0`}
      </CodeBlock>

      <p>
        Case <strong>A</strong> is the whole lesson in three lines: the timer fired, your state
        updated, and <code>screen</code> still shows zero items. The warning is not noise — it
        is telling you the DOM you are about to assert against is stale. And this is not fixed
        by using the async timer APIs; they are still Jest APIs:
      </p>

      <CodeBlock language="text" title="Actual output — a toast that self-dismisses at 5000ms, advanced with and without act">
{`# await jest.advanceTimersByTimeAsync(5000) on its own:
D: alert still present? true, console.error calls = 1
D: An update to Toast inside a test was not wrapped in act(...).

# await act(async () => { await jest.advanceTimersByTimeAsync(5000); }):
E: alert still present? false, console.error calls = 0`}
      </CodeBlock>

      <table>
        <thead>
          <tr>
            <th>Situation</th>
            <th>Do you write <code>act()</code>?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>render</code>, <code>fireEvent</code>, <code>await user.*</code></td>
            <td>No — <code>eventWrapper</code> already did</td>
          </tr>
          <tr>
            <td><code>await waitFor</code>, <code>await findBy*</code>, <code>waitForElementToBeRemoved</code></td>
            <td>No — <code>asyncWrapper</code> already did</td>
          </tr>
          <tr>
            <td>Advancing fake timers past a <code>setState</code></td>
            <td><strong>Yes</strong> — <code>act(() =&gt; jest.advanceTimersByTime(n))</code></td>
          </tr>
          <tr>
            <td>Advancing timers where the callback awaits something</td>
            <td><strong>Yes</strong> — <code>await act(async () =&gt; {'{'} await jest.advanceTimersByTimeAsync(n); {'}'})</code></td>
          </tr>
          <tr>
            <td>Calling a setter returned by <code>renderHook</code> directly</td>
            <td><strong>Yes</strong> — this is the canonical hand-written case</td>
          </tr>
          <tr>
            <td>An update that lands after the test ends</td>
            <td>No — <code>await</code> the settled state, or clean up in the effect</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="text" title="Actual output — the renderHook case, measured">
{`F: count after an unwrapped increment() = 0
F: console.error calls = 1  ->  An update to TestComponent inside a test was not wrapped in act(...).
F: count after act(() => increment())   = 2`}
      </CodeBlock>

      <InfoBox variant="note" title="Note the 2, Not the 1">
        <p style={{ marginBottom: 0 }}>
          The unwrapped <code>increment()</code> did not vanish — it was scheduled. Wrapping the{' '}
          <em>second</em> call in <code>act()</code> flushed both, so the count went from a
          stale <code>0</code> straight to <code>2</code>. A missing <code>act()</code> around a
          hook setter does not lose the update; it defers it into whatever flushes next, which
          is how one test&apos;s state update ends up corrupting the next test&apos;s
          assertions. <code>await waitFor(() =&gt; expect(result.current.count).toBe(1))</code>{' '}
          also works here (verified), because <code>asyncWrapper</code> drains the queue — but{' '}
          <code>act()</code> says what you mean.
        </p>
      </InfoBox>

      <h2>Fake Timers and Waiting</h2>
      <p>
        This is where the received wisdom is wrong, so it is worth stating the verified result
        before the explanation. <strong>Under Jest, <code>jest.useFakeTimers()</code> does not
        make <code>waitFor</code> hang.</strong> The advice you will find about deadlocked
        polling under frozen clocks is real, but it describes runners that lack a{' '}
        <code>jest</code> global. Testing Library detects Jest&apos;s fake timers and drives the
        clock itself.
      </p>

      <CodeBlock language="text" title="Actual output — how the detection works and what it returns">
{`typeof jest                           = object
setTimeout._isMockFunction            = undefined      # the legacy check
hasOwnProperty(setTimeout, 'clock')   = true           # the modern check
jestFakeTimersAreEnabled()            = true`}
      </CodeBlock>

      <FlowChart
        title="waitFor's two modes"
        chart={"graph TD\n  A[\"waitFor(cb) called\"] --> B{\"jestFakeTimersAreEnabled()?\"}\n  B -->|\"false — real timers\"| C[\"setInterval(check, 50)<br/>+ a MutationObserver on the container\"]\n  C --> D[\"spends up to 1000ms of REAL time\"]\n  B -->|\"true — Jest fake timers\"| E[\"loop: jest.advanceTimersByTime(50)<br/>then run cb, until done\"]\n  E --> F[\"spends ~0 REAL time,<br/>up to 1000ms of FAKE time\"]\n  F --> G[\"...which can fire YOUR pending timers\"]\n  style D fill:#1a2744,stroke:#5b9cf6\n  style G fill:#3d2f14,stroke:#fb923c"}
      />

      <p>
        Under fake timers, <code>waitFor</code> stops polling the wall clock and starts{' '}
        <em>pushing</em> the fake one forward 50ms at a time. The numbers make the difference
        vivid. Real elapsed time is measured with a <code>Date.now</code> reference captured
        before <code>useFakeTimers()</code> installed the fake <code>Date</code>:
      </p>

      <CodeBlock language="text" title="Actual output — real time vs fake time under jest.useFakeTimers()">
{`A: REAL elapsed = 10ms | FAKE clock advanced = 1000ms | callback ran 20 times
B: REAL elapsed = 1ms | FAKE clock advanced = 0ms
C: resolved 3 items | REAL elapsed = 16ms | FAKE clock advanced = 50ms

# A = a waitFor that times out
# B = a waitFor that passes on its first check
# C = a findBy against data that arrives on a 40ms timer`}
      </CodeBlock>

      <p>
        Three things fall out of those numbers. A wait that <strong>times out</strong> still
        runs its full twenty attempts, but it spends 10ms of your life and{' '}
        <strong>a full fake second</strong> doing it. A wait that <strong>succeeds
        immediately</strong> moves the fake clock not at all. And a wait that succeeds{' '}
        <em>after</em> a timer advances the clock by exactly as much as it needed — 50ms, one
        interval, to clear a 40ms delay.
      </p>

      <h3>The real footgun: a retrying waitFor fast-forwards your clock</h3>
      <p>
        Read that <code>FAKE clock advanced = 1000ms</code> line again and think about what
        else is sitting on that clock. You carefully did not advance past your 300ms debounce.
        Then you wrote an assertion that happened to be wrong, and <code>waitFor</code> spent
        your entire fake second reaching its timeout.
      </p>

      <CodeBlock language="jsx" title="The setup — nothing here looks wrong">
{`jest.useFakeTimers();
const onSearch = jest.fn();
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
render(<Widget onSearch={onSearch} />);          // debounces onSearch by 300ms

await user.type(screen.getByLabelText('Search'), 'react');
// correct so far: the debounce has NOT fired.

await waitFor(() => {
  expect(screen.getByText('3 results')).toBeInTheDocument();   // typo, or the
});                                                            // wrong string`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`C: right after typing, onSearch calls = 0 | fake clock +0
C: after the failing waitFor, onSearch calls = 1 | fake clock advanced 1000ms
C: onSearch was called with [ [ 'react' ] ]`}
      </CodeBlock>

      <p>
        The debounce fired inside the <code>waitFor</code>. If the next line had been{' '}
        <code>expect(onSearch).not.toHaveBeenCalled()</code>, you would be staring at a failure
        in a component that is behaving perfectly. The symptom is almost impossible to reason
        about backwards — a timer fired &ldquo;on its own&rdquo; during an assertion — which is
        why it is worth knowing the mechanism. The corollary: a <code>waitFor</code> that{' '}
        <em>passes</em> on its first check advances the clock 0ms and is entirely safe, so this
        only bites you on a test that is already failing for another reason.
      </p>

      <h3>The same mechanism, used deliberately</h3>
      <p>
        Because the timeout is denominated in fake milliseconds, it costs no real time — which
        makes it a legitimate tool. A toast that dismisses itself after 5 seconds:
      </p>

      <CodeBlock language="jsx" title="Waiting past a 5s timer without waiting 5 seconds">
{`jest.useFakeTimers();
render(<Toast ms={5000} />);
const alert = screen.getByRole('alert');

await waitForElementToBeRemoved(alert);                    // default 1000ms budget
await waitForElementToBeRemoved(alert, { timeout: 6000 }); // enough fake room`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`E4: FAILED after fake clock +1000ms: Timed out in waitForElementToBeRemoved.
E5: resolved. fake clock advanced 5000 ms`}
      </CodeBlock>

      <p>
        A <code>{'{ timeout: 6000 }'}</code> that would be a six-second penalty on real timers
        is free here. Which is worth remembering the next time a fake-timer test times out: the
        fix may be a larger <em>waitFor</em> budget rather than a larger Jest budget.
      </p>

      <h3>user-event is the thing that genuinely hangs</h3>
      <p>
        <code>waitFor</code> knows about Jest&apos;s fake timers. <code>user-event</code> does
        not — it schedules its own inter-keystroke delays with <code>setTimeout</code>, and if
        nothing advances the clock, those timers never fire.
      </p>

      <CodeBlock language="jsx" title="The hang">
{`jest.useFakeTimers();
const user = userEvent.setup();                  // no advanceTimers
render(<SearchInput onSearch={onSearch} debounceMs={300} />);
await user.type(screen.getByLabelText('Search'), 'react');   // never resolves`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — it does not fail, it stops">
{`● user-event + fake timers › B: user.type WITHOUT advanceTimers — does it hang?

  thrown: "Exceeded timeout of 30000 ms for a test.
  Add a timeout value to this test to increase the timeout, if this is a
  long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

# 30000, not 5000, only because that file had raised it with jest.setTimeout(30000)
# to prove the hang was unbounded rather than merely slow.`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Guard Timer Froze Too">
        <p style={{ marginBottom: 0 }}>
          That test wrapped the <code>user.type</code> in a{' '}
          <code>Promise.race</code> against a 60-second <code>setTimeout</code> so it could
          report &ldquo;HUNG&rdquo; cleanly. The guard never fired — because{' '}
          <code>setTimeout</code> is the thing that is faked. Only Jest&apos;s own per-test
          timeout, which runs outside the fake clock, stopped it. If a test under fake timers
          hangs until the Jest timeout with no useful message, an unadvanced{' '}
          <code>user-event</code> delay is the first thing to check.
        </p>
      </InfoBox>

      <p>
        There are two correct wirings. The option signature, read from{' '}
        <code>@testing-library/user-event</code> 14.6.7&apos;s own type definitions, is{' '}
        <code>advanceTimers?: ((delay: number) =&gt; Promise&lt;void&gt;) | ((delay: number)
        =&gt; void)</code>, documented with <code>@example jest.advanceTimersByTime</code> —
        so you pass the function itself, uncalled.
      </p>

      <CodeBlock language="jsx" title="Both wirings, both verified">
{`// (1) Let user-event drive the fake clock for its own delays.
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

// (2) Or switch its delays off entirely — there is then nothing to advance.
const user = userEvent.setup({ delay: null });

// Either way, YOUR timers are still yours to control:
await user.type(screen.getByLabelText('Search'), 'react');
expect(onSearch).not.toHaveBeenCalled();          // debounce intact
act(() => { jest.advanceTimersByTime(300); });
expect(onSearch).toHaveBeenCalledWith('react');`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`# (1) advanceTimers: jest.advanceTimersByTime
C: typed ok. REAL 15ms, FAKE +0ms, value = react
C: onSearch calls before advancing = 0
C: onSearch calls after advanceTimersByTime(300) = 1 [ [ 'react' ] ]

# (2) delay: null
D: delay:null -> REAL 4ms, FAKE +0ms, value = react`}
      </CodeBlock>

      <p>
        Note <code>FAKE +0ms</code> in both. Wiring <code>advanceTimers</code> costs you nothing
        in determinism: it lets user-event&apos;s internal delays through without touching your
        debounce, which still will not fire until you advance it on purpose. The{' '}
        <em>Testing Async &amp; APIs</em> lesson has the full debounce examples built on this
        setup.
      </p>

      <InfoBox variant="danger" title="Never Swap Clocks Mid-Wait">
        <p>
          <code>waitFor</code> checks which mode it is in on every iteration, and changing
          clocks underneath it aborts the wait with a dedicated error. Captured verbatim:
        </p>
        <CodeBlock language="text" title="Actual output">
{`Changed from using fake timers to real timers while using waitFor. This is not
allowed and will result in very strange behavior. Please ensure you're awaiting
all async things your test is doing before changing to real timers. For more
info, please go to https://github.com/testing-library/dom-testing-library/issues/830`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          The usual cause is an <code>afterEach(() =&gt; jest.useRealTimers())</code> running
          while a wait from a missing <code>await</code> is still in flight — so this error is
          often a symptom of a forgotten <code>await</code> somewhere above it rather than a
          problem with the cleanup hook. The mirror-image message exists too, for real → fake.
        </p>
      </InfoBox>

      <h2>Timeouts, and Reading the Error Dump</h2>
      <p>
        There are two independent timeouts in play and they fail with completely different
        messages. Telling them apart is the fastest diagnostic you have.
      </p>

      <table>
        <thead>
          <tr>
            <th>Timeout</th>
            <th>Default</th>
            <th>Raise it with</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>One <code>waitFor</code> / <code>findBy</code></td>
            <td><strong>1000ms</strong></td>
            <td><code>{'{ timeout: 3000 }'}</code> as the options argument</td>
          </tr>
          <tr>
            <td>Every RTL wait in the run</td>
            <td><strong>1000ms</strong></td>
            <td><code>{"configure({ asyncUtilTimeout: 3000 })"}</code> in your setup file</td>
          </tr>
          <tr>
            <td>One Jest test</td>
            <td><strong>5000ms</strong></td>
            <td>a third argument: <code>test(&apos;...&apos;, fn, 10000)</code></td>
          </tr>
          <tr>
            <td>Every test in a file</td>
            <td><strong>5000ms</strong></td>
            <td><code>jest.setTimeout(10000)</code> at the top of the file</td>
          </tr>
          <tr>
            <td>Every test in the project</td>
            <td><strong>5000ms</strong></td>
            <td><code>testTimeout</code> in <code>jest.config.js</code></td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="jsx" title="Where the options argument goes — findBy takes THREE arguments">
{`// waitFor: second argument
await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 3000 });

// findBy*: query options second, waitFor options THIRD. This is the one
// people get wrong — { timeout } in slot two is read as a query option
// and silently ignored.
await screen.findByRole('button', { name: /save/i }, { timeout: 2500 });
await screen.findByText('Alice', undefined, { timeout: 2500 });

// waitForElementToBeRemoved: second argument
await waitForElementToBeRemoved(alert, { timeout: 6000 });`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — each override measured">
{`B: findBy with { timeout: 2500 } rejected after 2504ms

C: getConfig().asyncUtilTimeout = 2000
C: waitFor rejected after 2002ms

# and the Jest timeout, with nothing overridden anywhere:
thrown: "Exceeded timeout of 5000 ms for a test.
Add a timeout value to this test to increase the timeout, if this is a
long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."`}
      </CodeBlock>

      <InfoBox variant="question" title="Which Timeout Fired?">
        <p style={{ marginBottom: 0 }}>
          <strong>&ldquo;Exceeded timeout of 5000 ms for a test&rdquo;</strong> is Jest, and it
          means your test function never returned — something is hanging, not failing. Look for
          an unadvanced fake timer or a promise nothing resolves.{' '}
          <strong>&ldquo;Unable to find...&rdquo; or a matcher failure with a DOM dump</strong>{' '}
          after roughly 1000ms is RTL, and it means the wait <em>completed</em> and the
          condition was never met. The first is a plumbing problem; the second is a real
          assertion failure and the dump tells you what the DOM looked like.
        </p>
      </InfoBox>

      <h3>What the dump is actually showing you</h3>
      <p>
        When <code>waitFor</code> times out it does not invent an error. It rejects with{' '}
        <strong>the last error its callback threw</strong>, then appends a{' '}
        <code>prettyDOM</code> render of the container. So the top of the message is your own
        assertion failing on its twentieth attempt:
      </p>

      <CodeBlock language="text" title="Actual output — waitFor timing out on a length assertion">
{`expect(received).toHaveLength(expected)

Expected length: 99
Received length: 3
Received array:  [<li>Alice</li>, <li>Bob</li>, <li>Carol</li>]

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <ul>
        <li>
          Alice
        </li>
        ...`}
      </CodeBlock>

      <p>
        Two things to read off it. <strong>One:</strong> &ldquo;Received length: 3&rdquo; is the
        state of the world at timeout, so the DOM was not empty and not still loading — the
        expectation was simply wrong. <strong>Two:</strong> a <code>findBy*</code> timeout prints
        the dump <em>twice</em>, once from the query&apos;s own error and once from{' '}
        <code>waitFor</code> wrapping it. That is expected, not a bug in your setup.
      </p>

      <CodeBlock language="text" title="Actual output — a findBy timeout, in full">
{`# rejected after 1007ms, error name = TestingLibraryElementError

Unable to find role="button" and name \`/save/i\`

Ignored nodes: comments, script, style
<body>
  <div>
    <p>
      Nothing here ever changes
    </p>
  </div>
</body>

Ignored nodes: comments, script, style
<body>
  <div>
    <p>
      Nothing here ever changes
    </p>
  </div>
</body>`}
      </CodeBlock>

      <InfoBox variant="note" title="And When You See &ldquo;Timed out in waitFor.&rdquo; With No Assertion Above It">
        <p>
          The generic message appears when <code>waitFor</code> reaches its deadline with{' '}
          <em>no stashed error at all</em>. Working out when that actually happens is worth a
          measurement, because the intuitive answer — &ldquo;my callback never threw&rdquo; — is
          wrong. A callback that never throws <strong>resolves</strong>; it never gets as far as
          the timeout:
        </p>
        <CodeBlock language="text" title="Actual output — four callbacks, four outcomes">
{`A: RESOLVED in 3ms (never times out)          # await waitFor(() => {})
E: RESOLVED in 6ms with null (never times out) # waitFor(() => screen.queryByText('nope'))

C: rejected after 1002ms: my own error         # an async callback that throws
B: rejected after 1011ms                       # a callback returning a promise
B: message ===>                                # that NEVER settles
Timed out in waitFor.

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <p>
        static
      </p>
    </div>
  </body>
<=== end`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          So <code>Timed out in waitFor.</code> means something quite specific: your callback
          returned a <strong>promise that has not settled</strong>. Recall that{' '}
          <code>waitFor</code> will not start a new attempt while one is pending, so a single
          hung promise inside the callback burns the entire budget without any assertion ever
          being evaluated. When you see this message, look for an <code>await</code> inside the
          callback — of a request with no handler, a mock that was never given a resolved value,
          or a fake timer nothing advanced.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Raising a Timeout Is Almost Never the Fix">
        <p style={{ marginBottom: 0 }}>
          A correctly mocked async test resolves on a DOM mutation, in single-digit
          milliseconds — case <strong>D</strong> earlier finished in 80ms only because the
          fixture deliberately waited 40ms. If you need 5000ms, the wait is not slow; it is
          waiting for something that is never going to happen. Reach for{' '}
          <code>screen.debug()</code> and the dump before reaching for{' '}
          <code>{'{ timeout }'}</code>. The honest exceptions are real network calls (which
          you should be mocking) and a deliberately long fake-timer budget, where the cost is
          zero.
        </p>
      </InfoBox>

      <h2>The Flake Catalogue</h2>
      <p>
        Seven failure modes, in roughly the order you will meet them. Every symptom column
        below is a real observed behaviour from the runs above, not a prediction.
      </p>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Symptom</th>
            <th>Cause</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              <em>&ldquo;Unable to find...&rdquo;</em> and the dump shows the loading state
            </td>
            <td>
              <code>getBy*</code> on the line after <code>render()</code>; the commit lands a
              task later
            </td>
            <td><code>expect(await screen.findByText(...))</code></td>
          </tr>
          <tr>
            <td>2</td>
            <td>
              Test passes but asserts nothing; sometimes a later test fails instead
            </td>
            <td>
              missing <code>await</code> on a <code>findBy</code> — the pending promise is
              truthy
            </td>
            <td>
              add the <code>await</code>; turn on <code>await-async-queries</code> (see the
              lint note below)
            </td>
          </tr>
          <tr>
            <td>3</td>
            <td>An absence assertion that has never once failed</td>
            <td>
              <code>not.toBeInTheDocument()</code> inside <code>waitFor</code> passes on the
              first check
            </td>
            <td>
              <code>waitForElementToBeRemoved</code>, or wait for the positive replacement then
              assert once
            </td>
          </tr>
          <tr>
            <td>4</td>
            <td>
              <code>toHaveBeenCalledTimes(1)</code> fails with a count near 20
            </td>
            <td>a side effect inside a retried <code>waitFor</code> callback</td>
            <td>move the side effect to the line above; keep one assertion in the callback</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Timeout at ~1000ms on a condition that looks correct</td>
            <td>waiting on something nothing will ever change</td>
            <td>read the dump — it shows the real state; check the mock actually resolved</td>
          </tr>
          <tr>
            <td>6</td>
            <td><em>&ldquo;Exceeded timeout of 5000 ms for a test&rdquo;</em>, no other output</td>
            <td>
              <code>user-event</code> under fake timers with no <code>advanceTimers</code>
            </td>
            <td>
              <code>{"userEvent.setup({ advanceTimers: jest.advanceTimersByTime })"}</code> or{' '}
              <code>{"{ delay: null }"}</code>
            </td>
          </tr>
          <tr>
            <td>7</td>
            <td>A spy fires &ldquo;by itself&rdquo; during an unrelated assertion</td>
            <td>
              a retrying <code>waitFor</code> advanced the fake clock 1000ms and ran your
              pending timer
            </td>
            <td>
              fix the failing assertion; assert timer effects immediately after an explicit{' '}
              <code>advanceTimersByTime</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Two of these deserve a closer look</h3>
      <p>
        <strong>Number 2 is the worst bug in the list</strong>, because it is invisible. An
        un-awaited <code>findBy</code> is a <code>Promise</code>, and a <code>Promise</code> is
        truthy:
      </p>

      <CodeBlock language="text" title="Actual output — what an un-awaited findBy actually is">
{`typeof result        = object
constructor          = Promise
truthy?              = true
is it an element?    = false

expect(result).toBeTruthy() PASSED against a pending promise`}
      </CodeBlock>

      <p>
        The saving grace is that <code>toBeInTheDocument</code> refuses to play along, so the
        habit of asserting rather than truthiness-checking catches it:
      </p>

      <CodeBlock language="text" title="Actual output — expect(promise).toBeInTheDocument()">
{`expect(received).toBeInTheDocument()

received value must be an HTMLElement or an SVGElement.
Received has type:  object
Received has value: Promise {}`}
      </CodeBlock>

      <p>
        Where it turns genuinely confusing is the rejection. The same bug — one test with{' '}
        <code>expect(screen.findByRole(&apos;button&apos;)).toBeTruthy()</code> and no{' '}
        <code>await</code> — was run in two files that differ only in how long the{' '}
        <em>other</em> tests take:
      </p>

      <CodeBlock language="text" title="Actual output — the same bug, two different verdicts">
{`# File A: the rest of the file finishes in under a second.
#         The bug is completely invisible.
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total

# File B: a later test happens to run for 1.5s, so the rejection lands mid-run.
FAIL ./09-leak.test.tsx
  ● 1. missing await on a findBy that will never resolve

    Unable to find role="button" and name \`/save/i\`
    ...
      >  9 |   expect(screen.findByRole('button', { name: /save/i })).toBeTruthy();

Tests:       1 failed, 1 passed, 2 total`}
      </CodeBlock>

      <p>
        Jest 30 <em>does</em> attribute the rejection back to the correct line — Testing Library
        captures a stack trace at call time specifically so it can — but only if the process is
        still alive when the 1000ms timeout expires. Add a fast mock or delete an unrelated test
        and the failure disappears without the bug being fixed. Which is why this particular bug
        is best handled by a linter rather than by discipline — it catches at author time
        something the runner reports non-deterministically.
      </p>

      <InfoBox variant="tip" title="Four Lint Rules That Cover Most of This Lesson">
        <p>
          <code>eslint-plugin-testing-library</code> (verified against 7.16.2) ships rules that
          map one-to-one onto the failure modes above. Adding them is cheaper than remembering
          any of this:
        </p>
        <ul>
          <li>
            <code>await-async-queries</code> and <code>await-async-utils</code> — the missing{' '}
            <code>await</code> on a <code>findBy</code> or a <code>waitFor</code>{' '}
            <em>(flake 2)</em>
          </li>
          <li>
            <code>no-wait-for-side-effects</code> — a click or a fetch inside a retried callback{' '}
            <em>(flake 4)</em>
          </li>
          <li>
            <code>prefer-query-by-disappearance</code> — pushes you off{' '}
            <code>waitFor(() =&gt; expect(queryBy...).not.toBeInTheDocument())</code>{' '}
            <em>(flake 3)</em>
          </li>
          <li>
            <code>no-wait-for-multiple-assertions</code> and <code>no-unnecessary-act</code> —
            the two habits that make a wait hard to reason about
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          <code>prefer-find-by</code>, mentioned in the <em>Best Practices</em> lesson, comes
          from the same plugin and autofixes <code>waitFor</code> + <code>getBy</code> into{' '}
          <code>findBy</code>.
        </p>
      </InfoBox>

      <p>
        <strong>Number 5, meanwhile, has the most readable error in the whole surface</strong>{' '}
        once you know to trust it. Waiting on a spy that is never called:
      </p>

      <CodeBlock language="text" title="Actual output — waitFor on a spy that is never called">
{`# rejected after 1001ms
expect(jest.fn()).toHaveBeenCalled()

Expected number of calls: >= 1
Received number of calls:    0

Ignored nodes: comments, script, style
...`}
      </CodeBlock>

      <p>
        &ldquo;Received number of calls: 0&rdquo; after a full second of retries is not a timing
        problem. Nothing was ever going to call it. The DOM dump underneath will usually show
        you why — a disabled button, an unrendered branch, a mock that rejected into an error
        state you were not looking at.
      </p>

      <h2>The Decision, Compressed</h2>
      <p>
        When you are mid-test and unsure which tool you want, it comes down to four questions:
      </p>

      <FlowChart
        title="Which waiting primitive"
        chart={"graph TD\n  A[\"I need to assert something<br/>that is not true yet\"] --> B{\"Am I waiting for<br/>an element to appear?\"}\n  B -->|\"yes, exactly one\"| C[\"await screen.findBy*\"]\n  B -->|\"yes, one or more\"| D[\"await screen.findAllBy*<br/>(resolves at the FIRST match)\"]\n  B -->|\"no\"| E{\"Am I waiting for<br/>something to disappear?\"}\n  E -->|yes| F[\"waitForElementToBeRemoved<br/>(it proves presence first)\"]\n  E -->|no| G{\"Is it a spy call,<br/>a count, an attribute?\"}\n  G -->|yes| H[\"await waitFor with ONE<br/>assertion, no side effects\"]\n  G -->|\"no — it is a timer\"| I[\"act(() => jest.advanceTimersByTime(n))<br/>then assert synchronously\"]\n  style C fill:#1a3329,stroke:#4ade80\n  style D fill:#1a3329,stroke:#4ade80\n  style F fill:#1a2744,stroke:#5b9cf6\n  style H fill:#1a2744,stroke:#5b9cf6\n  style I fill:#2a1f44,stroke:#a78bfa"}
      />

      <InfoBox variant="success" title="The Four Sentences Worth Memorising">
        <ol style={{ marginBottom: 0, paddingLeft: '1.25rem' }}>
          <li>
            <code>render()</code> is synchronous, and React commits an async state update in a
            later <em>task</em> — so no number of microtasks will save you, and nothing but a
            waiting primitive is reliable.
          </li>
          <li>
            <code>waitFor</code> retries its callback every 50ms (or on any DOM mutation) for
            1000ms and resolves the first time it <strong>does not throw</strong> — so the
            callback must be a cheap assertion that is genuinely capable of failing, and
            nothing else.
          </li>
          <li>
            RTL wraps <code>render</code>, events and every wait in <code>act()</code> for you;
            the gap is <strong>timers</strong>, where you wrap{' '}
            <code>jest.advanceTimersByTime</code> yourself or assert against a stale DOM.
          </li>
          <li>
            Under Jest, fake timers do not freeze <code>waitFor</code> — they make it advance
            your clock by up to 1000ms. The thing that actually hangs is{' '}
            <code>user-event</code> without <code>advanceTimers</code>.
          </li>
        </ol>
      </InfoBox>

      <p>
        The field guide at the end of this section is the recall sheet for the signatures and
        error strings. This lesson is the model you use when the error string is not enough.
      </p>
    </LessonLayout>
  );
}
