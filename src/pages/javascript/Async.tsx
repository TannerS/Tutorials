import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function JsAsync() {
  return (
    <LessonLayout
      title="Asynchronous JavaScript"
      sectionId="javascript"
      lessonIndex={4}
      prev={{ path: '/javascript/arrays-iterables', label: 'Arrays, Destructuring & Iterables' }}
      next={{ path: '/javascript/modules', label: 'Modules & Tooling' }}
    >
      {/* ── The Async Problem ── */}
      <h2>The Async Problem</h2>
      <p>
        JavaScript runs on a <strong>single thread</strong> &mdash; one call stack, one thing
        executing at a time. That is a deliberate simplification: no locks, no race conditions
        between threads, no shared-memory bugs. But a huge amount of what a program does &mdash;
        reading a file, querying a database, waiting for a network response, waiting for a timer
        &mdash; takes real wall-clock time during which there is nothing useful for the CPU to
        compute. If the single thread just <em>blocked</em> while waiting, the whole program
        (in a browser: the whole page, including scrolling and clicks) would freeze for every
        slow operation.
      </p>
      <p>
        JavaScript&apos;s answer is to never block the thread on I/O. Instead, the engine hands
        the slow operation off to the surrounding environment (the browser&apos;s Web APIs, or
        Node&apos;s C++/libuv bindings), keeps running other code, and gets notified with a
        callback when the result is ready. Everything in this lesson &mdash; callbacks, Promises,
        <code>async</code>/<code>await</code>, the event loop &mdash; is different layers of
        machinery built on top of that one idea: <em>start the slow thing, keep going, get
        called back later.</em>
      </p>

      {/* ── Callbacks and Callback Hell ── */}
      <h2>Callbacks and &quot;Callback Hell&quot;</h2>
      <p>
        The original mechanism is just passing a function to be called later. It works, and for
        one async step it&apos;s perfectly readable. The trouble starts when one async result is
        needed to kick off the next one, and the next one after that &mdash; each dependent step
        has to be nested <em>inside</em> the callback of the step before it, because that&apos;s
        the only place the previous result is in scope.
      </p>
      <CodeBlock language="javascript" title="Verified — three chained async steps via callbacks, node v25">
{`function getUser(id, cb) {
  setTimeout(() => cb(null, { id, name: 'Ada' }), 10);
}
function getOrders(userId, cb) {
  setTimeout(() => cb(null, [{ id: 1, total: 42 }]), 10);
}
function getOrderDetails(orderId, cb) {
  setTimeout(() => cb(null, { id: orderId, items: ['widget'] }), 10);
}

getUser(1, (err, user) => {
  if (err) return console.error(err);
  console.log('user:', user);
  getOrders(user.id, (err, orders) => {
    if (err) return console.error(err);
    console.log('orders:', orders);
    getOrderDetails(orders[0].id, (err, details) => {
      if (err) return console.error(err);
      console.log('details:', details);
      console.log('--- callback hell chain complete ---');
    });
  });
});

// Verified output:
// user: { id: 1, name: 'Ada' }
// orders: [ { id: 1, total: 42 } ]
// details: { id: 1, items: [ 'widget' ] }
// --- callback hell chain complete ---`}
      </CodeBlock>
      <p>
        Every level of nesting is a new indent, a new closure, and a new place that has to
        remember to check <code>err</code> and bail out correctly &mdash; the &quot;pyramid of
        doom.&quot; Forget one <code>if (err) return</code> and an error silently falls through
        to code that assumes success. This exact shape, and the pain of it, is the reason
        Promises exist.
      </p>

      <InfoBox variant="warning" title="Why callback hell is a design problem, not just an indentation problem">
        <p>
          The visual pyramid is the symptom people notice first, but the real cost is that error
          handling is duplicated at every level and composition is manual. There is no single
          place to say &quot;if anything in this chain fails, do X&quot; &mdash; you write that
          check three times, by hand, and it&apos;s easy to get one of them wrong.
        </p>
      </InfoBox>

      {/* ── Promises ── */}
      <h2>Promises</h2>
      <p>
        A <strong>Promise</strong> is an object that represents a value that doesn&apos;t exist
        yet, but will (or will fail to). Instead of handing the next step a callback directly,
        the async function hands back a Promise, and you attach callbacks <em>to that object</em>{' '}
        &mdash; which is what makes chaining and centralized error handling possible.
      </p>

      <h3>Three states, one transition</h3>
      <p>
        Every Promise starts <strong>pending</strong> and can move to exactly one of two final
        states, exactly once:
      </p>
      <ul>
        <li><strong>pending</strong> &mdash; not yet resolved or rejected; the initial state.</li>
        <li><strong>fulfilled</strong> &mdash; the operation succeeded; the promise has a value.</li>
        <li><strong>rejected</strong> &mdash; the operation failed; the promise has a reason (usually an <code>Error</code>).</li>
      </ul>
      <p>
        Fulfilled and rejected are collectively called <strong>settled</strong>. The transition
        is a one-way door: once a Promise settles, it is locked to that state and that value
        forever. Calling <code>resolve</code> or <code>reject</code> again after the first call
        is simply ignored &mdash; not an error, not a second event, nothing.
      </p>
      <CodeBlock language="javascript" title="Verified — a promise settles exactly once, node v25">
{`const p = new Promise((resolve, reject) => {
  resolve('first');
  resolve('second');           // ignored — already settled
  reject(new Error('third'));  // also ignored
});

const result = await p;
console.log('settled value:', result);

// Verified output:
// settled value: first`}
      </CodeBlock>

      <InfoBox variant="note" title="Immutability is the whole point">
        <p>
          Because a settled Promise can never change state or value again, every{' '}
          <code>.then()</code> you attach &mdash; now, or five minutes from now, before or after
          it settles &mdash; sees the exact same outcome. That&apos;s what makes a Promise safe
          to pass around and hand to multiple consumers, unlike a raw callback which only fires
          for whoever happened to be holding it at the right moment.
        </p>
      </InfoBox>

      <h3>Chaining with .then / .catch / .finally</h3>
      <p>
        <code>.then(onFulfilled, onRejected)</code> attaches callbacks and returns a{' '}
        <em>new</em> Promise, which is what makes chaining work: whatever you <code>return</code>{' '}
        from inside a <code>.then</code> becomes the fulfilled value of that new Promise (and if
        you return a Promise, the chain waits on it). <code>.catch(fn)</code> is shorthand for{' '}
        <code>.then(undefined, fn)</code> &mdash; it catches a rejection from{' '}
        <em>any point earlier in the chain</em>, not just the immediately preceding link. Throwing
        inside a <code>.then</code> skips straight past any remaining <code>.then</code> callbacks
        to the nearest downstream <code>.catch</code>. <code>.finally(fn)</code> runs regardless
        of outcome and doesn&apos;t receive the value or reason at all &mdash; it&apos;s for
        cleanup, not data.
      </p>
      <CodeBlock language="javascript" title="Verified — throw jumps to .catch, chain continues after recovery, node v25">
{`function fetchUser(id) {
  return Promise.resolve({ id, name: 'Grace' });
}

fetchUser(1)
  .then((user) => {
    console.log('step 1, got user:', user.name);
    throw new Error('boom in step 1');
  })
  .then((user) => {
    // skipped entirely — a throw jumps straight to the nearest .catch
    console.log('step 2 (should be skipped)');
    return user;
  })
  .catch((err) => {
    console.log('caught downstream:', err.message);
    return 'recovered';
  })
  .then((value) => {
    console.log('step 3, chain continues with:', value);
  })
  .finally(() => {
    console.log('finally always runs');
  });

// Verified output:
// step 1, got user: Grace
// caught downstream: boom in step 1
// step 3, chain continues with: recovered
// finally always runs`}
      </CodeBlock>

      <InfoBox variant="tip" title="A .catch after the last .then is not optional in practice">
        <p>
          A Promise chain with no <code>.catch</code> anywhere doesn&apos;t fail silently &mdash;
          it produces an <strong>unhandled promise rejection</strong>, which Node logs (and can be
          configured to crash the process on) and browsers surface as a console warning. Always
          terminate a chain you&apos;re not awaiting with a <code>.catch</code>.
        </p>
      </InfoBox>

      {/* ── Promise Combinators ── */}
      <h2>Promise Combinators: all, allSettled, race, any</h2>
      <p>
        Real programs usually kick off several independent async operations at once and need to
        combine their outcomes. There are four built-in combinators, and they differ in exactly{' '}
        <em>which</em> settlements they wait for and <em>how</em> they react to a rejection. The
        difference is not cosmetic &mdash; picking the wrong one silently throws away data or
        fails faster than you meant it to.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Combinator</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Settles when</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>On a rejection</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <td style={{ padding: '0.5rem' }}><code>Promise.all</code></td>
            <td style={{ padding: '0.5rem' }}>Every input fulfills</td>
            <td style={{ padding: '0.5rem' }}>Rejects immediately with the first reason — other results are lost</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <td style={{ padding: '0.5rem' }}><code>Promise.allSettled</code></td>
            <td style={{ padding: '0.5rem' }}>Every input settles (either way)</td>
            <td style={{ padding: '0.5rem' }}>Never rejects — reports each outcome individually</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <td style={{ padding: '0.5rem' }}><code>Promise.race</code></td>
            <td style={{ padding: '0.5rem' }}>The first input settles, win or lose</td>
            <td style={{ padding: '0.5rem' }}>Rejects if the first to settle was a rejection</td>
          </tr>
          <tr>
            <td style={{ padding: '0.5rem' }}><code>Promise.any</code></td>
            <td style={{ padding: '0.5rem' }}>The first input fulfills</td>
            <td style={{ padding: '0.5rem' }}>Rejects only if ALL inputs reject, with an AggregateError</td>
          </tr>
        </tbody>
      </table>

      <p>
        Here is the behavioral difference that matters most &mdash; <code>all</code> vs{' '}
        <code>allSettled</code> &mdash; on the exact same pair of promises: one resolves after
        50ms, the other rejects after 10ms.
      </p>
      <CodeBlock language="javascript" title="Verified — Promise.all vs Promise.allSettled, same inputs, node v25">
{`const resolves = new Promise((resolve) => setTimeout(() => resolve('ok from A'), 50));
const rejects  = new Promise((_, reject) => setTimeout(() => reject(new Error('B failed')), 10));

// Promise.all — bails the instant ANY input rejects
try {
  const result = await Promise.all([resolves, rejects]);
  console.log('all resolved:', result);
} catch (err) {
  console.log('all rejected immediately with:', err.message);
}
// all rejected immediately with: B failed
// — note: this fires at ~10ms. 'resolves' was still pending, and its
//   eventual value is simply thrown away. Promise.all never sees it.

// Promise.allSettled — always waits for every input to settle
// (fresh promises here — the ones above already settled)
const resolves2 = new Promise((resolve) => setTimeout(() => resolve('ok from A'), 50));
const rejects2  = new Promise((_, reject) => setTimeout(() => reject(new Error('B failed')), 10));

const settled = await Promise.allSettled([resolves2, rejects2]);
for (const outcome of settled) {
  if (outcome.status === 'fulfilled') console.log('fulfilled:', outcome.value);
  else console.log('rejected:', outcome.reason.message);
}
// fulfilled: ok from A
// rejected: B failed
// — this took the full ~50ms (it waited for the slower one), and BOTH
//   outcomes are visible, tagged by status.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Promise.all + one rejection = lost data, not just a lost race">
        <p>
          The critical detail in that output: <code>resolves</code> would have succeeded with{' '}
          <code>&apos;ok from A&apos;</code> forty milliseconds later, but <code>Promise.all</code>{' '}
          rejected the moment <code>rejects</code> failed and threw that pending result away
          entirely &mdash; there is no way to recover it from the rejected <code>all()</code>{' '}
          call. If you need to know the outcome of <em>every</em> operation &mdash; e.g. &quot;save
          these five records, tell me which ones failed&quot; &mdash; reach for{' '}
          <code>allSettled</code>, not <code>all</code>.
        </p>
      </InfoBox>

      <p>
        <code>race</code> and <code>any</code> are both about &quot;whichever finishes first,&quot;
        but they disagree on whether a rejection counts as finishing:
      </p>
      <CodeBlock language="javascript" title="Verified — Promise.race takes the first settlement, Promise.any wants the first fulfillment, node v25">
{`const fastFail = new Promise((_, reject) => setTimeout(() => reject(new Error('fast fail')), 10));
const slowOk   = new Promise((resolve) => setTimeout(() => resolve('slow ok'), 50));

// race — the FIRST to settle wins, even if that settlement is a rejection
try {
  await Promise.race([fastFail, slowOk]);
} catch (err) {
  console.log('race rejected:', err.message);
}
// race rejected: fast fail

// any — ignores rejections, waits for the first FULFILLMENT
const anyResult = await Promise.any([fastFail, slowOk]);
console.log('any result:', anyResult);
// any result: slow ok

// any where EVERY input rejects — throws a single AggregateError
try {
  await Promise.any([
    Promise.reject(new Error('e1')),
    Promise.reject(new Error('e2')),
  ]);
} catch (err) {
  console.log(err.name, err.errors.map((e) => e.message));
}
// AggregateError [ 'e1', 'e2' ]`}
      </CodeBlock>

      <InfoBox variant="tip" title="Rule of thumb for picking one">
        <p>
          <code>all</code> &mdash; &quot;I need every result, and any single failure should abort
          the whole batch.&quot; <code>allSettled</code> &mdash; &quot;I need every outcome,
          success or failure, and one failing shouldn&apos;t hide the rest.&quot; <code>race</code>{' '}
          &mdash; &quot;first to respond wins, I don&apos;t care which&quot; (e.g. a timeout race
          against a fetch). <code>any</code> &mdash; &quot;try several sources, give me the first
          one that actually works&quot; (e.g. several mirrors of the same resource).
        </p>
      </InfoBox>

      {/* ── async/await ── */}
      <h2>async/await: Sugar Over Promises</h2>
      <p>
        <code>async</code>/<code>await</code> doesn&apos;t add new async capability &mdash; every{' '}
        <code>async function</code> still returns a Promise, and <code>await</code> is just a
        pause-and-resume instruction for consuming one. What it changes is the <em>shape</em> of
        the code: a chain of <code>.then()</code> callbacks becomes straight-line code that reads
        top to bottom, with ordinary <code>try</code>/<code>catch</code> for errors instead of{' '}
        <code>.catch()</code>.
      </p>
      <CodeBlock language="javascript" title="Verified — async/await and its desugared .then() equivalent, identical output, node v25">
{`function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// async/await version
async function withAwait() {
  console.log('withAwait: start');
  const a = await delay(10, 'A');
  console.log('withAwait: got', a);
  const b = await delay(10, 'B');
  console.log('withAwait: got', b);
  return a + '-' + b;
}

// the exact desugared equivalent — a .then() chain
function withThen() {
  console.log('withThen: start');
  return delay(10, 'A').then((a) => {
    console.log('withThen: got', a);
    return delay(10, 'B').then((b) => {
      console.log('withThen: got', b);
      return a + '-' + b;
    });
  });
}

console.log('withAwait result:', await withAwait());
console.log('withThen result:', await withThen());

// Verified output:
// withAwait: start
// withAwait: got A
// withAwait: got B
// withAwait result: A-B
// withThen: start
// withThen: got A
// withThen: got B
// withThen result: A-B`}
      </CodeBlock>
      <p>
        Line for line: <code>await delay(10, &apos;A&apos;)</code> is exactly &quot;call{' '}
        <code>.then()</code> on this promise, and treat everything after this line as the
        callback.&quot; <code>async function</code> is exactly &quot;wrap the return value in{' '}
        <code>Promise.resolve()</code>, and turn any thrown error into a rejected promise instead
        of an uncaught exception.&quot; A <code>try</code>/<code>catch</code> around an{' '}
        <code>await</code> is exactly a <code>.catch()</code> on that link of the chain.
      </p>

      <InfoBox variant="warning" title="await is sequential by default — that can silently cost you">
        <p>
          Each <code>await</code> pauses <em>that function</em> until its promise settles before
          moving to the next line. If two awaited operations don&apos;t depend on each other,
          awaiting them one after another serializes work that could have run concurrently.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Verified — sequential vs parallel awaits, real elapsed time, node v25">
{`function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Sequential — each await blocks the next from starting
console.time('sequential');
const a = await delay(100, 'a');
const b = await delay(100, 'b');   // doesn't start until 'a' resolves
console.timeEnd('sequential');
// sequential: ~204ms  (roughly 100 + 100 — fully serial)

// Parallel — start both timers before awaiting either
console.time('parallel');
const [c, d] = await Promise.all([delay(100, 'c'), delay(100, 'd')]);
console.timeEnd('parallel');
// parallel: ~101ms  (roughly 100 — both timers ran concurrently)`}
      </CodeBlock>
      <p>
        Both operations take 100ms whether you run them one after another or together &mdash;
        the difference is only in whether the <em>second</em> one is even allowed to start before
        the first finishes. Kick off independent async work first, collect the promises, then{' '}
        <code>await Promise.all(...)</code> on all of them together.
      </p>

      {/* ── The Event Loop ── */}
      <h2>The Event Loop</h2>
      <p>
        Everything above &mdash; when a <code>.then</code> callback actually runs, why a resolved
        Promise can still &quot;lose&quot; to a <code>setTimeout(fn, 0)</code> in some orderings
        but never the other way around &mdash; is governed by one mechanism: the{' '}
        <strong>event loop</strong>. There are four pieces on the board.
      </p>
      <ul>
        <li>
          <strong>Call stack</strong> &mdash; where synchronous code actually executes, one frame
          at a time. As long as anything is on the stack, nothing else runs.
        </li>
        <li>
          <strong>Web APIs / Node APIs</strong> &mdash; the environment outside the JS engine
          (timers, network, file system) that does the actual waiting, off the main thread.
        </li>
        <li>
          <strong>Macrotask queue</strong> (a.k.a. the &quot;task queue&quot;) &mdash; where a
          completed <code>setTimeout</code>/<code>setInterval</code> callback, an I/O callback, or
          a UI event handler waits its turn.
        </li>
        <li>
          <strong>Microtask queue</strong> &mdash; where Promise callbacks (<code>.then</code>,{' '}
          <code>.catch</code>, <code>.finally</code>, an <code>await</code> resuming) and{' '}
          <code>queueMicrotask</code> callbacks wait their turn.
        </li>
      </ul>
      <p>
        The loop&apos;s rule is simple to state and easy to get wrong intuitively: whenever the
        call stack empties, drain the <strong>entire</strong> microtask queue &mdash; including
        any new microtasks that got queued <em>while</em> draining &mdash; before touching the
        macrotask queue at all. Only once the microtask queue is completely empty does the loop
        pull exactly <strong>one</strong> task from the macrotask queue, run it to completion, and
        repeat the whole cycle.
      </p>

      <FlowChart
        title="The event loop, one cycle"
        chart={"graph TD\n  A[Call Stack] -- calls async API --> B[Web APIs / Node APIs]\n  B -- timer fires / IO completes --> C[Macrotask Queue: setTimeout, setInterval, I/O]\n  A -- .then/.catch/.finally, await resumes --> D[Microtask Queue: Promise callbacks]\n  A --> E{Call Stack empty?}\n  E -- No --> A\n  E -- Yes --> F[Drain entire Microtask Queue, incl. newly queued ones]\n  F -- queue fully empty --> G[Pull exactly ONE task from Macrotask Queue]\n  G --> A\n  C -.-> G"}
      />

      <h3>The classic ordering demo</h3>
      <p>
        This one snippet is worth memorizing because it packs in every rule above: synchronous
        code always runs first, a microtask always beats a macrotask, and that holds even for a{' '}
        <code>setTimeout</code> with a delay of zero.
      </p>
      <CodeBlock language="javascript" title="Verified — the classic ordering demo, node v25">
{`console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// Verified output:
// 1
// 4
// 3
// 2`}
      </CodeBlock>
      <p>
        Walking it: <code>&apos;1&apos;</code> logs immediately (synchronous). The{' '}
        <code>setTimeout</code> call itself is synchronous &mdash; it just registers a timer with
        the Web/Node API and returns instantly &mdash; so its callback isn&apos;t run yet, it&apos;s
        scheduled for the macrotask queue once ~0ms elapses. <code>Promise.resolve().then(...)</code>{' '}
        is already-settled, so its callback goes straight into the microtask queue. Then{' '}
        <code>&apos;4&apos;</code> logs (still synchronous, still the same top-level run). Only
        now is the call stack empty: the loop drains the microtask queue first, so{' '}
        <code>&apos;3&apos;</code> logs. Only after the microtask queue is empty does the loop
        finally pull the timer callback off the macrotask queue, so <code>&apos;2&apos;</code>{' '}
        logs last &mdash; even though it was scheduled before the promise callback.
      </p>

      <h3>Microtasks fully drain — even ones queued mid-drain</h3>
      <p>
        The &quot;entire queue, including newly queued microtasks&quot; part isn&apos;t a minor
        footnote &mdash; it means a chain of chained <code>.then()</code> calls, no matter how
        long, always finishes completely before a single already-pending <code>setTimeout(fn, 0)</code>{' '}
        gets to run.
      </p>
      <CodeBlock language="javascript" title="Verified — a microtask that queues another microtask still beats the 0ms timer, node v25">
{`console.log('script start');

setTimeout(() => console.log('macrotask (setTimeout 0)'), 0);

Promise.resolve()
  .then(() => {
    console.log('microtask 1');
    return Promise.resolve();
  })
  .then(() => {
    console.log('microtask 2 (chained from microtask 1)');
  });

Promise.resolve().then(() => console.log('microtask 3'));

console.log('script end');

// Verified output:
// script start
// script end
// microtask 1
// microtask 3
// microtask 2 (chained from microtask 1)
// macrotask (setTimeout 0)`}
      </CodeBlock>
      <p>
        &quot;microtask 2&quot; was not even in the queue yet when the drain started &mdash; it
        only got queued as a side effect of running &quot;microtask 1.&quot; It still runs before
        the timer, because the loop keeps draining until the microtask queue is <em>actually</em>{' '}
        empty, not just &quot;empty as of when we started looking.&quot;
      </p>

      <InfoBox variant="danger" title="The load-bearing fact: microtasks always drain before the next macrotask">
        <p>
          No amount of promise chaining can be &quot;overtaken&quot; by a pending{' '}
          <code>setTimeout(fn, 0)</code> &mdash; not even a long chain, not even one that keeps
          scheduling more microtasks as it goes. This is also the mechanism behind a real
          performance footgun: a recursive chain of <code>.then()</code> calls that never stops
          queueing new microtasks can starve the macrotask queue indefinitely, freezing timers
          and I/O callbacks even though the call stack looks &quot;empty&quot; between each step.
        </p>
      </InfoBox>

      {/* ── Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

    </LessonLayout>
  );
}
