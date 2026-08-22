import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function ObservabilityTracing() {
  return (
    <LessonLayout
      title="Distributed Tracing Design"
      sectionId="observability"
      lessonIndex={2}
      prev={{ path: '/observability/slos', label: 'SLIs, SLOs & Error Budgets' }}
      next={{ path: '/observability/incidents', label: 'Alerting & Incident Response' }}
    >
      <p>
        Traces already showed up as the third pillar alongside metrics and logs — the record of a
        single request's journey. This lesson opens that record up: what it's actually made of, how it
        survives a hop across a network boundary without falling apart, and why no production system
        traces every single request. None of this is exotic. It's a widely standardized, widely
        documented part of running microservices at any real scale, and getting the vocabulary precise
        is what makes a trace viewer readable instead of a wall of colored bars.
      </p>

      <h2>A Trace Is a Tree of Spans</h2>

      <p>
        A <strong>trace</strong> represents one request's entire journey — from the moment it hits your
        API gateway to the moment a response goes back out, no matter how many services it touches along
        the way. A <strong>span</strong> is one unit of work inside that journey: one service call, one
        database query, one call to a downstream API. A single trace is normally made of many spans.
      </p>

      <InfoBox variant="info" title="Trace vs Span">
        <p><strong>Trace</strong> — the whole request, end to end, identified by one shared trace ID that every span in it carries.</p>
        <p><strong>Span</strong> — one unit of work within that trace, with its own span ID, a start time, a duration, and a pointer to its parent span's ID.</p>
      </InfoBox>

      <p>
        That parent pointer is what turns a flat list of spans into a tree. The span for handling the
        whole HTTP request is the root; the span for the database query it triggers is a child of that
        root; if that query itself triggers a call to another service, that call is a child of the
        query's span, and so on. Every span except the root has exactly one parent, and a parent can have
        any number of children — sequential, parallel, or a mix.
      </p>

      <FlowChart
        title="One Trace, Five Spans — Where Did 180ms Go?"
        chart={"graph TD\n  A[\"Span: API Gateway (root)\\n0ms-180ms\"] --> B[\"Span: Order Service\\n10ms-170ms\"]\n  B --> C[\"Span: Inventory DB query\\n20ms-50ms\"]\n  B --> D[\"Span: Payment Service call\\n55ms-165ms\"]\n  D --> E[\"Span: Payment DB query\\n60ms-160ms\"]\n  style E fill:#3b1a1a,stroke:#f87171"}
      />

      <p>
        This is the entire point of tracing that metrics and logs can't give you on their own: it shows
        you <em>where in a chain of microservice calls the latency actually lives</em>. In the tree
        above, the root span takes 180ms, but almost none of that time is spent in the API gateway or
        the order service themselves — it's spent waiting on the payment DB query, which alone eats 100
        of the 180ms. When spans run sequentially, one waiting on the next, the parent's duration is
        roughly the sum of its children's durations. When a service fires off two downstream calls in
        parallel, their spans overlap in time, and the parent's duration is closer to the longest of the
        two, not their sum. A trace viewer draws this as a waterfall specifically so that overlap versus
        sequence — and therefore the true critical path — is visible at a glance instead of something
        you have to reconstruct from log timestamps by hand.
      </p>

      <h2>Trace Context Propagation</h2>

      <p>
        None of this works unless the trace ID (and the current span's ID, so the next span knows its
        parent) survives every network hop. A service can't infer that its incoming request is part of a
        larger trace — it has to be told, and the only way to tell it is to attach that information to
        the outbound call itself, typically as HTTP headers that get forwarded from service to service.
        This is <strong>trace context propagation</strong>, and for years every vendor did it differently
        — Zipkin's B3 headers (<code>X-B3-TraceId</code>, <code>X-B3-SpanId</code>,{' '}
        <code>X-B3-ParentSpanId</code>, <code>X-B3-Sampled</code>) were one widely used scheme among
        several incompatible ones.
      </p>

      <p>
        That's settled now. The <strong>W3C Trace Context</strong> specification — a W3C Recommendation
        since November 2021 — defines two standard headers that OpenTelemetry and every major tracing
        vendor propagate by default: <code>traceparent</code> and <code>tracestate</code>.
      </p>

      <CodeBlock language="text" title="A Real traceparent Header (from the W3C spec)">
{`traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  │                                │                │
             │  │                                │                └─ trace-flags (01 = sampled)
             │  │                                └─ parent-id (this span's ID, 16 hex chars / 8 bytes)
             │  └─ trace-id (the whole trace's ID, 32 hex chars / 16 bytes)
             └─ version (currently always 00)

tracestate: congo=t61rcWkgMzE`}
      </CodeBlock>

      <p>
        <code>traceparent</code> carries the fields every backend needs to stitch spans into one trace:
        version, trace ID, the ID of the span that made this call (which becomes the new span's parent
        ID), and flags including whether this trace was sampled. <code>tracestate</code> is a companion,
        optional header for vendor-specific extensions that ride alongside without needing to be
        understood by every hop. A service receiving a request reads <code>traceparent</code>, creates
        its own span as a child of the incoming <code>parent-id</code>, and forwards a{' '}
        <em>new</em> <code>traceparent</code> — same trace ID, its own span ID as the new parent-id — on
        every call it makes downstream. Break that chain anywhere and the trace splits into two
        disconnected pieces.
      </p>

      <h2>Sampling: You Can't (Usually) Trace Everything</h2>

      <p>
        Recording, exporting, and storing a full trace for every single request is often too expensive
        at real production volume — the storage and network overhead scales with total request count,
        not with how interesting any given request turned out to be. So most systems{' '}
        <strong>sample</strong>: they keep a subset of traces and discard the rest. Which subset, and
        when that decision gets made, is a real trade-off with two well-documented strategies.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Strategy</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>When the decision is made</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Head-based</strong></td>
            <td style={{ padding: '0.75rem' }}>At the start of the trace, before any span exists (e.g. roll a die for a flat 1% keep-rate)</td>
            <td style={{ padding: '0.75rem' }}>Cheap and simple — no buffering, no coordination. But the decision is blind to outcome, so it will just as often throw away the rare 8-second outlier as a routine 20ms request.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Tail-based</strong></td>
            <td style={{ padding: '0.75rem' }}>After the whole trace finishes, once every span's outcome is known</td>
            <td style={{ padding: '0.75rem' }}>Can apply real rules — &quot;keep every trace with an error, keep every trace over 2s&quot; — catching exactly the traces worth looking at. Costs more: every span of every in-flight trace has to be buffered somewhere until the trace completes and the keep/drop call can be made.</td>
          </tr>
        </tbody>
      </table>

      <p>
        Neither one is universally &quot;correct.&quot; Head-based sampling is the common default because
        it's simple and needs no special infrastructure; tail-based sampling is what you reach for once
        &quot;we have traces&quot; stops being enough and you specifically need &quot;we have traces of
        the requests that actually went wrong.&quot;
      </p>

      <h2>Seeing a Real Parent and Child Span</h2>

      <p>
        Everything above is easiest to trust once you've watched it happen. This is a real
        OpenTelemetry program — installed from npm (<code>@opentelemetry/api</code>,{' '}
        <code>@opentelemetry/sdk-trace-node</code>, <code>@opentelemetry/sdk-trace-base</code>, version
        1.9.1 / 2.10.0) and actually executed with Node — that creates one parent span for a checkout
        request and one child span for the database query inside it, then exports both to the console.
      </p>

      <CodeBlock language="javascript" title="trace-demo.js (Node.js — actually run)">
{`const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { trace } = require('@opentelemetry/api');

const provider = new NodeTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
});
provider.register();

const tracer = trace.getTracer('checkout-service');

// One trace: a checkout request. The parent span is the whole request;
// the child span is one unit of work inside it (a DB query).
tracer.startActiveSpan('POST /checkout', (parentSpan) => {
  // Stable semantic-convention names. The pre-1.0 spellings you will
  // still see everywhere -- http.method, db.system, db.statement -- were
  // renamed when semconv stabilised. http.route was NOT renamed.
  parentSpan.setAttribute('http.request.method', 'POST');
  parentSpan.setAttribute('http.route', '/checkout');

  tracer.startActiveSpan('SELECT inventory', (childSpan) => {
    childSpan.setAttribute('db.system.name', 'postgresql');
    childSpan.setAttribute('db.query.text', 'SELECT qty FROM inventory WHERE sku = ?');

    const start = Date.now();
    while (Date.now() - start < 30) { /* simulate the DB call taking ~30ms */ }

    childSpan.end();
  });

  parentSpan.end();
});`}
      </CodeBlock>

      <p>
        Run with <code>node trace-demo.js</code>, the built-in <code>ConsoleSpanExporter</code> prints
        each span as it ends. Here is the real output, trimmed to the fields that matter (the full output
        also includes <code>resource</code>, <code>instrumentationScope</code>, <code>status</code>,{' '}
        <code>events</code>, and <code>links</code> on every span):
      </p>

      <CodeBlock language="text" title="Actual Console Output">
{`// child span — 'SELECT inventory' — ends first
{
  traceId: '87f6cf608107afd0dd86afb6cc9a3b20',
  parentSpanContext: { spanId: 'd953432aeedd9ccd', ... },
  name: 'SELECT inventory',
  id: '770208cc7d4b618d',
  duration: 29986.333,   // microseconds ≈ 30.0ms
  attributes: {
    'db.system.name': 'postgresql',
    'db.query.text': 'SELECT qty FROM inventory WHERE sku = ?'
  }
}

// parent span — 'POST /checkout' — ends after its child
{
  traceId: '87f6cf608107afd0dd86afb6cc9a3b20',
  parentSpanContext: undefined,   // this is the root — no parent
  name: 'POST /checkout',
  id: 'd953432aeedd9ccd',
  duration: 31034.292,   // microseconds ≈ 31.0ms
  attributes: { 'http.request.method': 'POST', 'http.route': '/checkout' }
}`}
      </CodeBlock>

      <p>
        Every claim from earlier in this lesson is sitting right there in real output. Both spans share
        the same <code>traceId</code> — that's what makes them one trace. The child's{' '}
        <code>parentSpanContext.spanId</code> (<code>d953432aeedd9ccd</code>) is exactly the parent's own{' '}
        <code>id</code> — that's the parent-child pointer that builds the tree. And the durations show
        the DB query (29,986.333&nbsp;μs) accounting for nearly all of the parent's total wall-clock time
        (31,034.292&nbsp;μs) — in a real service, that's the signal that tells you the latency isn't in your
        HTTP handling, it's in that query.
      </p>

      <InfoBox variant="warning" title="Attribute Names Changed When Semantic Conventions Stabilised">
        <p>
          Span names are yours to choose; attribute <em>keys</em> are not, and getting them right is
          the whole point of instrumenting. OpenTelemetry&apos;s value is that a dashboard, a
          sampling rule or a backend&apos;s auto-generated service map can work on any service in any
          language, and that only holds if everyone spells the keys the same way. That agreement is
          the <strong>semantic conventions</strong>.
        </p>
        <p>
          Several of the most common keys were renamed on the way to a stable 1.0 semconv. The old
          spellings are still what most tutorials, blog posts and older code use, so you will meet
          both:
        </p>
        <table>
          <thead>
            <tr>
              <th>Pre-stabilization</th>
              <th>Stable</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>http.method</code></td>
              <td><code>http.request.method</code></td>
            </tr>
            <tr>
              <td><code>db.system</code></td>
              <td><code>db.system.name</code></td>
            </tr>
            <tr>
              <td><code>db.statement</code></td>
              <td><code>db.query.text</code></td>
            </tr>
            <tr>
              <td><code>http.route</code></td>
              <td><code>http.route</code> — unchanged, do not &quot;fix&quot; it</td>
            </tr>
          </tbody>
        </table>
        <p>
          Nothing breaks loudly when you use the old names — the span exports fine and shows up in
          your backend. What breaks is quiet and worse: a query filtering on{' '}
          <code>http.request.method</code> silently misses every span emitted with{' '}
          <code>http.method</code>, so half your traffic vanishes from a dashboard that looks
          perfectly healthy. If you are migrating a fleet gradually, the OTel Collector&apos;s
          transform processor can rewrite the old keys to the new ones at ingest so your queries only
          have to know one spelling.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Same Thing in Java (opentelemetry-api / opentelemetry-sdk 1.44.1 — also actually run)">
{`Tracer tracer = openTelemetrySdk.getTracer("checkout-service");

Span parentSpan = tracer.spanBuilder("POST /checkout").startSpan();
parentSpan.setAttribute("http.request.method", "POST");
parentSpan.setAttribute("http.route", "/checkout");
try (Scope parentScope = parentSpan.makeCurrent()) {

    Span childSpan = tracer.spanBuilder("SELECT inventory").startSpan();
    childSpan.setAttribute("db.system.name", "postgresql");
    try (Scope childScope = childSpan.makeCurrent()) {
        Thread.sleep(30); // simulate the DB call
    } finally {
        childSpan.end();
    }

} finally {
    parentSpan.end();
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual Output — Same traceId, Parent's spanId Reused as Child's Parent">
{`INFO: 'SELECT inventory' : c9e715b3b6f3e6a3fc0a309ea3f5bb8b 8f5e41ffea6f9db2 INTERNAL ...
parent traceId = c9e715b3b6f3e6a3fc0a309ea3f5bb8b
parent spanId  = 09d4c75ecf903c8a
child  traceId = c9e715b3b6f3e6a3fc0a309ea3f5bb8b
child  spanId  = 8f5e41ffea6f9db2
INFO: 'POST /checkout' : c9e715b3b6f3e6a3fc0a309ea3f5bb8b 09d4c75ecf903c8a INTERNAL ...`}
      </CodeBlock>

      <p>
        Java's built-in <code>LoggingSpanExporter</code> is terser than Node's{' '}
        <code>ConsoleSpanExporter</code> — its log line only prints the trace ID and the span's own ID,
        not its parent's ID — so the parent-child link was printed explicitly here via
        <code> getSpanContext()</code> instead of relying on the exporter's own formatting. That's a
        real difference between two specific exporters, not a difference in what the tracing model
        captures: both languages' SDKs store the full parent-child relationship internally, and a real
        backend like Jaeger or Zipkin reconstructs the same tree from either one.
      </p>

      <InteractiveChallenge
        question={"Your system uses head-based sampling at a flat 1% rate. A chain of five downstream calls occasionally spikes to 8 seconds, but you can never find a trace of it happening. What's the most direct explanation, and what would actually fix it?"}
        options={[
          "The sampling implementation is broken — you should sample 100% of requests instead",
          "Head-based sampling decides whether to keep a trace before anything about its outcome is known, so a blind 1% draw will rarely land on a rare 8s outlier by chance — tail-based sampling (keep everything over, say, 2s) would catch it because it decides after seeing the duration",
          "Traces don't record latency information, only which services were called",
          "This is unrelated to sampling — check whether the span exporter is configured correctly"
        ]}
        correctIndex={1}
        explanation={"This is exactly the trade-off head-based sampling makes: the keep/drop decision happens at the start of the trace, before any span exists, so it can't be conditioned on how the trace turns out. A rare, interesting outlier gets the same 1% chance of being kept as a routine fast request — meaning it usually isn't. Tail-based sampling buffers the whole trace and decides after it completes, so a rule like \"keep all errors and all traces over 2s\" reliably captures exactly the outliers that matter, at the cost of buffering every in-flight trace's spans until it finishes."}
      />
    </LessonLayout>
  );
}
