import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function BrowserEventLoop() {
  return (
    <LessonLayout
      title="The Event Loop & Rendering Pipeline"
      sectionId="browser-runtime"
      lessonIndex={2}
      prev={{ path: '/browser-runtime/events', label: 'Events, Phases & Delegation' }}
      next={{ path: '/browser-runtime/observers', label: 'Intersection, Resize & Mutation Observers' }}
    >
      <p>
        JavaScript in the browser runs on <strong>one thread</strong>, and that thread
        also does layout, paint, and your event handlers. Every &quot;why is the UI
        frozen&quot; and &quot;why did this run in that order&quot; question comes back
        to how that one thread is scheduled.
      </p>
      <p>
        The <a href="/javascript/async">Asynchronous JavaScript</a> lesson covers promises
        themselves. This is the browser-specific half: where rendering fits, and what
        &quot;blocking&quot; actually means.
      </p>

      <h2>The Ordering, Measured</h2>
      <CodeBlock language="javascript" title="Five things scheduled at once">
{`console.log('1 sync start');
setTimeout(() => console.log('5 setTimeout 0 (macrotask)'), 0);
requestAnimationFrame(() => console.log('rAF (before paint)'));
Promise.resolve().then(() => console.log('3 promise.then (microtask)'));
queueMicrotask(() => console.log('4 queueMicrotask'));
console.log('2 sync end');`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Chromium 149">
{`1 sync start
2 sync end
3 promise.then (microtask)
4 queueMicrotask
5 setTimeout 0 (macrotask)
rAF (before paint)`}
      </CodeBlock>

      <p>The rule the first five lines demonstrate:</p>
      <ol>
        <li>
          <strong>All synchronous code runs first.</strong> Nothing async interleaves with
          it — there is no preemption on this thread.
        </li>
        <li>
          <strong>Then the entire microtask queue drains</strong> — promise callbacks,{' '}
          <code>queueMicrotask</code>, <code>MutationObserver</code>. All of it, before
          anything else.
        </li>
        <li>
          <strong>Then one macrotask</strong> — a timer, an event, a network callback.
          Then microtasks drain again. Then the next macrotask.
        </li>
      </ol>

      <InfoBox variant="warning" title="rAF's position is not fixed — do not memorise it">
        <p>
          In the run above <code>requestAnimationFrame</code> landed last, after the
          timer. That is not a rule. <code>rAF</code> is tied to the{' '}
          <strong>next paint</strong>, so where it falls relative to a{' '}
          <code>setTimeout(…, 0)</code> depends on where in the frame you happened to
          schedule it, and whether the tab is painting at all (a background tab stops
          firing rAF entirely).
        </p>
        <p style={{ marginBottom: 0 }}>
          The reliable framing is the only one worth learning:{' '}
          <strong><code>rAF</code> runs just before the browser paints.</strong> That is
          why it is the right place to apply a visual change and the wrong place for
          anything else.
        </p>
      </InfoBox>

      <h2>Microtasks Can Starve the Frame</h2>
      <p>
        Because the microtask queue drains <em>completely</em> before the loop continues, a
        microtask that queues another microtask never lets the browser move on:
      </p>

      <CodeBlock language="javascript" title="The starvation shape">
{`let n = 0;
setTimeout(() => console.log('macrotask ran after ' + n + ' microtasks'), 0);

const chain = () => { if (++n < 5) queueMicrotask(chain); };
queueMicrotask(chain);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the timer waited for the whole chain">
{`macrotask ran after 5 microtasks`}
      </CodeBlock>

      <p>
        With a bound of 5 that is harmless. Remove the bound and the page hangs — no
        paint, no input, no timers, forever. An unbounded promise chain is one of the few
        ways to lock a tab that looks nothing like an infinite loop.
      </p>

      <h2>Where Rendering Fits</h2>
      <FlowChart
        title="One turn of the loop"
        chart={"graph TD\n  A[\"run one macrotask\\n(timer, event, network callback)\"] --> B[\"drain ALL microtasks\"]\n  B --> C{\"is it time to paint?\"}\n  C -->|no| A\n  C -->|yes| D[\"requestAnimationFrame callbacks\"]\n  D --> E[\"style -> layout -> paint -> composite\"]\n  E --> F[\"requestIdleCallback\\n(only if time is left over)\"]\n  F --> A\n  style B fill:#2a1f44,stroke:#a78bfa\n  style E fill:#1a3329,stroke:#4ade80\n  style F fill:#3d2f14,stroke:#d97706"}
      />

      <p>
        The browser targets 60 frames per second, which gives it{' '}
        <strong>about 16.7ms per frame</strong> to run your JavaScript <em>and</em> do
        style, layout, paint and composite. Anything over ~50ms on the main thread is
        classified as a <strong>long task</strong> and is what makes a page feel
        unresponsive — the thread cannot answer a click while it is busy.
      </p>

      <CodeBlock language="javascript" title="The four scheduling primitives, and what each is for">
{`setTimeout(fn, 0)        // "soon, as a macrotask". Clamped to ~4ms after
                         // 5 nested calls. Not a frame-accurate tool.

queueMicrotask(fn)       // "before anything else happens". For state that
                         // must settle before the next paint.

requestAnimationFrame(fn)  // "just before the next paint". The ONLY correct
                           // place to apply a visual change in a loop.

requestIdleCallback(fn)  // "when the browser has nothing better to do".
                         // For genuinely optional work — prefetching,
                         // analytics flushing. May never run.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Yielding to the main thread">
        <p>
          If you must do heavy work on the main thread, break it into chunks and yield
          between them so the browser can paint and respond to input:
        </p>
        <CodeBlock language="javascript" title="The yield pattern">
{`// A plain await does NOT yield to the browser — a promise continuation
// is a MICROTASK, so the frame is still blocked.
await Promise.resolve();      // does nothing useful here

// setTimeout(…, 0) yields a real macrotask boundary, so paint can happen.
const yieldToBrowser = () => new Promise(r => setTimeout(r, 0));

for (const chunk of chunks) {
  process(chunk);
  await yieldToBrowser();     // the page stays responsive
}

// Newer, where available: scheduler.yield() — same idea, better priority.`}
        </CodeBlock>
      </InfoBox>

      <InfoBox variant="danger" title="The mistake this lesson exists to prevent">
        <p>
          &quot;Make it async so it does not block&quot; is false if the work itself is
          synchronous. <code>async</code>/<code>await</code> does not move anything to
          another thread — it only changes <em>when</em> the work runs on the same one.
          Wrapping a 2-second sorting loop in an <code>async</code> function still freezes
          the tab for 2 seconds.
        </p>
        <p style={{ marginBottom: 0 }}>
          Genuinely offloading work means a <strong>Web Worker</strong>, which is a real
          second thread with no DOM access and structured-clone message passing. Chunking
          plus yielding is the cheaper option when a worker is overkill.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="How this shows up in React">
        <p style={{ marginBottom: 0 }}>
          React&apos;s concurrent features are built on exactly this model.{' '}
          <code>useTransition</code> marks an update as interruptible so React can yield
          between chunks of rendering instead of blocking the frame, and{' '}
          <code>useDeferredValue</code> lets an expensive subtree lag behind an input. Both
          are solving &quot;do not spend 200ms on one macrotask&quot; — see{' '}
          <a href="/react18/performance">Performance &amp; Memoization</a>.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
