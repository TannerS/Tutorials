import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function JsEvents() {
  return (
    <LessonLayout
      title="Events & EventEmitter in Node"
      sectionId="javascript"
      lessonIndex={6}
      prev={{ path: '/javascript/modules', label: 'Modules & Tooling' }}
      next={{ path: '/javascript/error-handling', label: 'Error Handling' }}
    >
      <p>
        Node is built on events. Streams, HTTP servers, child processes and{' '}
        <code>process</code> itself are all <code>EventEmitter</code>s, so the pattern is
        not optional — you are already using it. It is also the exact same shape as a
        message broker, one process smaller, which makes it the cheapest way to understand
        event-driven architecture before any infrastructure is involved.
      </p>
      <p>Every output below was run on Node 26.</p>

      <h2>The Whole API</h2>
      <CodeBlock language="javascript" title="Four methods do almost everything">
{`import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();

emitter.on('order.placed', (order) => { /* … */ });   // subscribe
emitter.once('ready', () => { /* … */ });             // subscribe, auto-remove
emitter.emit('order.placed', order);                   // publish
emitter.off('order.placed', handler);                  // unsubscribe

// Occasionally useful:
emitter.listenerCount('order.placed');
emitter.eventNames();
emitter.prependListener('x', fn);        // run before existing listeners
emitter.removeAllListeners('x');`}
      </CodeBlock>

      <h2>Listeners Are Synchronous — This Surprises People</h2>
      <p>
        <code>emit()</code> is <strong>not</strong> a queue, a task, or a microtask. It is a{' '}
        <code>for</code> loop that calls your listeners right now, in registration order,
        before <code>emit()</code> returns.
      </p>
      <CodeBlock language="text" title="Real output — Node 26">
{`order.push('before emit');
emitter.emit('x');          // two listeners registered
order.push('after emit');

["before emit", "first", "second", "after emit"]
//              ^^^^^^^^^^^^^^^^^ both ran INSIDE the emit() call`}
      </CodeBlock>
      <p>Three consequences worth holding onto:</p>
      <ul>
        <li>
          A slow listener blocks the emitter. Ten listeners each doing 20ms of work makes{' '}
          <code>emit()</code> take 200ms, on the main thread.
        </li>
        <li>
          <code>emit()</code> returns a <strong>boolean</strong> — whether anyone was
          listening. Measured: <code>true</code> with a listener, <code>false</code>{' '}
          without. It does not tell you anything succeeded.
        </li>
        <li>
          A listener that <strong>throws takes down the emit</strong>. Measured: the
          exception propagates out of <code>emit()</code> and{' '}
          <strong>later listeners never run</strong>. Wrap risky listener bodies in their
          own try/catch.
        </li>
      </ul>

      <InfoBox variant="danger" title="The 'error' event is special — and it crashes the process">
        <p>
          <code>'error'</code> is the one event name Node treats differently. Emit it with
          no listener attached and it is <strong>thrown</strong>, which for an unhandled
          throw in Node means the process exits.
        </p>
        <CodeBlock language="text" title="Real output">
{`emitter.emit('error', new Error('boom'))
  with NO 'error' listener   ->  THREW Error: boom
  with an 'error' listener   ->  handled, no throw`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          So every long-lived emitter you create needs an <code>'error'</code> listener,
          even an empty-ish one that logs. This is also why a stream error you forget to
          handle kills a Node server — streams are emitters.
        </p>
      </InfoBox>

      <h2>Removal Is by Identity, and Forgetting Leaks</h2>
      <CodeBlock language="text" title="Real output — off() needs the same function reference">
{`emitter.on('t', () => {});
emitter.off('t', () => {});      // a DIFFERENT function object
  listenerCount('t')  ->  1      // removed nothing

const h = () => {};
emitter.on('u', h);
emitter.off('u', h);             // same reference
  listenerCount('u')  ->  0      // removed`}
      </CodeBlock>
      <p>
        Exactly the same rule as <code>removeEventListener</code> in the browser (see{' '}
        <a href="/browser-runtime/events">Events, Phases &amp; Delegation</a>). An
        inline arrow can never be removed, because you no longer have a reference to it.
      </p>

      <InfoBox variant="warning" title="MaxListenersExceededWarning is a leak detector, not a limit">
        <p>
          Add an eleventh listener for the same event on one emitter and Node prints a
          warning. It is not an error and nothing stops working — it is Node guessing you
          forgot to remove something in a loop.
        </p>
        <CodeBlock language="text" title="Real output — the exact warning">
{`(node:43865) MaxListenersExceededWarning: Possible EventEmitter memory leak
detected. 11 leaky listeners added to [EventEmitter]. MaxListeners is 10.
Use emitter.setMaxListeners() to increase limit

EventEmitter.defaultMaxListeners  ->  10`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          If you genuinely need more, <code>setMaxListeners(n)</code> on that emitter.
          Raising <code>defaultMaxListeners</code> globally just hides future leaks.
        </p>
      </InfoBox>

      <h2>The Promise Form</h2>
      <CodeBlock language="javascript" title="events.once() — await an event">
{`import { once, on } from 'node:events';

const [value] = await once(emitter, 'ready');   // resolves with the emit args
// measured: emitting ('ready', 42) resolved with 42

// It rejects if the emitter emits 'error' first, which is usually what
// you want — no silent hang.

// And an async iterator for streams of events:
for await (const [msg] of on(emitter, 'message')) {
  handle(msg);
}

// With an AbortSignal, so it can be cancelled:
await once(emitter, 'ready', { signal: AbortSignal.timeout(5000) });`}
      </CodeBlock>
      <CodeBlock language="text" title="Real output — aborting a pending once()">
{`const ac = new AbortController();
const p  = once(emitter, 'never', { signal: ac.signal });
ac.abort();
await p;
  -> rejected with  name: "AbortError"   code: "ABORT_ERR"`}
      </CodeBlock>
      <p>
        That is the shape to reach for whenever you are waiting on an event that might
        never arrive. Without a signal or a timeout, <code>await once(...)</code> hangs
        forever and the process looks alive while doing nothing.
      </p>

      <h2>Async Listeners Are a Trap</h2>
      <p>
        <code>emit()</code> calls each listener and ignores the return value. If your
        listener is <code>async</code>, the promise it returns is dropped on the floor — so
        a rejection does <strong>not</strong> become an <code>'error'</code> event, it
        becomes an unhandled rejection:
      </p>
      <CodeBlock language="text" title="Real output — Node 26, an async listener that throws">
{`const plain = new EventEmitter();
plain.on('go', async () => { throw new Error('async boom'); });
plain.emit('go');
  -> [unhandledRejection] async boom        <- NOT the 'error' event

const captured = new EventEmitter({ captureRejections: true });
captured.on('go',    async () => { throw new Error('async boom 2'); });
captured.on('error', (e) => console.log('[error event]', e.message));
captured.emit('go');
  -> [error event] async boom 2             <- routed properly`}
      </CodeBlock>
      <InfoBox variant="warning" title="Two rules for async listeners">
        <ul style={{ marginBottom: 0 }}>
          <li>
            Construct the emitter with{' '}
            <code>new EventEmitter(&#123; captureRejections: true &#125;)</code> so a
            rejected listener reaches your <code>'error'</code> handler instead of the
            process-wide <code>unhandledRejection</code> hook.
          </li>
          <li>
            Do not expect <code>emit()</code> to wait. It returns as soon as the last
            listener has been <em>called</em>, not when the async work finishes — so{' '}
            <code>emit()</code> is never a way to run a pipeline in order. If you need
            sequencing, you need a return value, which means a function call, not an event.
          </li>
        </ul>
      </InfoBox>

      <h2>Ordering and Introspection</h2>
      <CodeBlock language="text" title="Real output — the bits you reach for while debugging">
{`// Listeners run in REGISTRATION order; prependListener jumps the queue.
pre.on('t', ...)              // "registered-first"
pre.prependListener('t', ...) // "prepended"
pre.emit('t')
  -> ["prepended", "registered-first"]

// Who is listening to what — useful when hunting a leak.
i.listenerCount('x')        ->  2
i.eventNames()              ->  [ 'x' ]
getEventListeners(i, 'x')   ->  2 entries   (from node:events)`}
      </CodeBlock>
      <InfoBox variant="note" title="EventEmitter vs the standard EventTarget">
        <p>
          Node also ships the browser&apos;s <code>EventTarget</code>, and they are not
          interchangeable. <code>addEventListener</code> handlers take a single{' '}
          <code>Event</code> object rather than spread arguments, there is no{' '}
          <code>'error'</code> convention, and a throwing listener behaves differently:
        </p>
        <CodeBlock language="text" title="Real output — a listener that throws">
{`EventEmitter.emit()        -> throws SYNCHRONOUSLY, at the call site
EventTarget.dispatchEvent() -> does NOT throw; the error is re-raised on
                               process.nextTick as an uncaught exception`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Use <code>EventEmitter</code> for Node-internal code — it is what streams and
          servers speak. Use <code>EventTarget</code> when the same code has to run in a
          browser, or when you want <code>AbortSignal</code>-based removal.{' '}
          <code>setMaxListeners(n, target)</code> from <code>node:events</code> accepts
          either kind.
        </p>
      </InfoBox>

      <h2>One Instance, One Set of Listeners</h2>
      <p>
        This is the thing that trips everyone: listeners live on <em>the object</em>. A new{' '}
        <code>EventEmitter</code> is connected to nothing, no matter what event names it
        uses.
      </p>

      <CodeBlock language="javascript" title="bus.js — the shared-instance pattern">
{`// bus.js  — Node caches modules, so this runs ONCE per process
import { EventEmitter } from 'node:events';
export default new EventEmitter();

// serviceA.js
import bus from './bus.js';
bus.on('order.placed', (o) => console.log('A received:', o.id));

// serviceB.js — no import of serviceA anywhere
import bus from './bus.js';
bus.emit('order.placed', { id: 'ord_1' });`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Node 26, three modules importing bus.js">
{`[bus.mjs evaluated]        <- printed ONCE, despite three imports
A received: ord_1          <- B reached A through the shared module

// And a separate instance really is separate:
const other = new EventEmitter();
bus.listenerCount('order.placed')    ->  1
other.listenerCount('order.placed')  ->  1
bus === other                        ->  false`}
      </CodeBlock>

      <InfoBox variant="tip" title="Module caching is what makes it a singleton">
        <p style={{ marginBottom: 0 }}>
          Node evaluates a module once per process and hands every later import the same
          exports object — proved above by <code>[bus.mjs evaluated]</code> printing a
          single time. That is the entire mechanism. The alternative, if you dislike
          module-level singletons, is to extend <code>EventEmitter</code> in a service
          class and inject the instance — same idea, explicit wiring.
        </p>
      </InfoBox>

      <h2>Where This Stops Working</h2>
      <p>
        An <code>EventEmitter</code> is <strong>in-process</strong>. Two Node processes,
        two containers, or two pods share nothing. The moment you scale past one process,
        half your events vanish — and they vanish silently, because{' '}
        <code>emit()</code> returning <code>false</code> is not an error.
      </p>
      <p>
        It is also <strong>fire-and-forget with no memory</strong>: a listener registered
        after the emit misses it forever, a crash loses anything in flight, and there is no
        retry.
      </p>

      <h2>The Bridge: Same Pattern, Broker as the Shared Instance</h2>
      <p>
        This is the payoff. Going distributed does not change the shape of your code — it
        changes <em>what the shared instance is</em>. Your <code>bus.js</code> becomes an
        exchange or a topic.
      </p>

      <FlowChart
        title="The same pattern at two scales"
        chart={"graph TD\n  subgraph one [\"ONE PROCESS\"]\n    A1[\"serviceA\\nbus.on('order.placed')\"] --- B1[(\"bus.js\\nshared EventEmitter\")]\n    C1[\"serviceB\\nbus.emit('order.placed')\"] --- B1\n  end\n  subgraph many [\"MANY PROCESSES\"]\n    A2[\"inventory-svc\\nconsume(queue)\"] --- B2[(\"broker exchange / topic\\nthe shared instance\")]\n    C2[\"orders-svc\\npublish(exchange, key)\"] --- B2\n    D2[\"email-svc\\nconsume(queue)\"] --- B2\n  end\n  one -->|\"same shape,\\nout of process\"| many\n  style B1 fill:#1a2744,stroke:#5b9cf6\n  style B2 fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="javascript" title="Line for line">
{`// in-process                          // with a broker (RabbitMQ)
bus.emit('order.placed', order)        channel.publish('orders', 'order.placed',
                                         Buffer.from(JSON.stringify(order)))

bus.on('order.placed', handler)        await channel.assertQueue('inventory-svc')
                                       await channel.bindQueue('inventory-svc',
                                               'orders', 'order.placed')
                                       channel.consume('inventory-svc', handler)`}
      </CodeBlock>

      <InfoBox variant="danger" title="The one mapping that is NOT one-to-one">
        <p>
          With an emitter, three <code>on()</code> calls for the same event means{' '}
          <strong>all three run</strong>. With a broker, three consumers on{' '}
          <strong>one queue</strong> means <strong>only one gets each message</strong> —
          that is round-robin load balancing, not broadcast.
        </p>
        <CodeBlock language="text" title="The translation">
{`EventEmitter                     Broker
3 listeners on one emitter   ->  3 QUEUES bound to the exchange
  all 3 run                        all 3 run           (fan-out)

                                 3 CONSUMERS on 1 QUEUE
                                   one runs per message (competing consumers)`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          So: <strong>one queue per service</strong>, and scale that service by adding
          consumers to <em>its</em> queue. The broker side — exchange types, acks,
          dead-letter queues, the outbox pattern — is covered in{' '}
          <a href="/systemdesign/messaging">Message Queues &amp; Streaming</a> and{' '}
          <a href="/microservices/events">Event-Driven Architecture</a>.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="What else changes when you cross the process boundary">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Payloads get serialised.</strong> No object references, no closures, no
            passing a database handle. If it does not survive{' '}
            <code>JSON.stringify</code>, it cannot go.
          </li>
          <li>
            <strong>Listeners become durable.</strong> If a consumer is down when the event
            fires, the message waits in its queue. An emitter listener that was not
            registered simply misses it forever — this is the real upgrade.
          </li>
          <li>
            <strong>Delivery needs acknowledgement.</strong> A crash before{' '}
            <code>ack</code> means redelivery, which is exactly why consumers must be
            idempotent.
          </li>
          <li>
            <strong>Errors stop being local.</strong> No try/catch around{' '}
            <code>emit</code>; a failing message needs a dead-letter queue or it retries
            forever.
          </li>
        </ul>
      </InfoBox>

      <h2>Emitters You Already Use</h2>
      <CodeBlock language="javascript" title="Most of Node's async surface is this one pattern">
{`server.on('request', handler);        // http.Server
stream.on('data', chunk => {});        // every Readable
stream.on('error', err => {});         // ALWAYS attach this one
stream.on('end', () => {});
child.on('exit', code => {});          // child_process
process.on('unhandledRejection', fn);
process.on('SIGTERM', fn);             // graceful shutdown

// Streams are emitters with BACKPRESSURE on top: .pipe() watches the
// return value of .write() and pauses the source when the destination
// is full. That is the part a plain emitter has no answer for — an
// emitter will happily fire faster than listeners can keep up.`}
      </CodeBlock>
    </LessonLayout>
  );
}
