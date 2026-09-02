import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function ObservabilityThreePillars() {
  return (
    <LessonLayout
      title="The Three Pillars: Metrics, Logs, Traces"
      sectionId="observability"
      lessonIndex={0}
      prev={null}
      next={{ path: '/observability/slos', label: 'SLIs, SLOs & Error Budgets' }}
    >
      <p>
        &quot;Observability&quot; gets thrown around as a synonym for &quot;we have a dashboard,&quot;
        and that habit hides a real architectural question: when something breaks at 2am, which of
        your telemetry systems can actually answer &quot;what happened, where, and why&quot;? The
        standard mental model splits the answer into three data types — <strong>metrics</strong>,{' '}
        <strong>logs</strong>, and <strong>traces</strong> — each good at a different question and
        each blind to the questions the other two answer well. This lesson is framework-agnostic: it's
        the architectural discipline underneath any stack. Where you'd actually flip the switches for
        this in a Java service — Actuator endpoints, Micrometer meters, structured Logback output — is
        the <strong>Spring Boot Observability</strong> lesson; this one is about the shape of the
        problem those tools implement.
      </p>

      <InfoBox variant="note" title="Where &quot;Three Pillars&quot; Comes From">
        <p>
          The specific phrase <strong>&quot;three pillars of observability&quot;</strong> is most
          commonly attributed to Cindy Sridharan's 2018 O'Reilly report{' '}
          <em>Distributed Systems Observability</em>, which framed metrics, logs, and traces as
          separate telemetry types with distinct cost/detail tradeoffs. The underlying idea — that
          these three signals overlap but each has a role the others don't cover — was already
          circulating before that: Peter Bourgon's February 2017 post{' '}
          <em>&quot;Metrics, tracing, and logging&quot;</em>, written after that year's Distributed
          Tracing Summit, made the same three-way split with a Venn diagram. So treat &quot;three
          pillars&quot; as an industry mental model that got a durable name around 2017–2018, not a
          single person's invention. It's also not uncontested — Honeycomb's Charity Majors has
          argued publicly (most pointedly in a 2025 post literally titled &quot;The Pillar Is a
          Lie&quot;) that splitting telemetry into three storage silos throws away the relationships
          between them, and that wide structured events are a better foundation. Both views are worth
          knowing: the three-pillars split is a useful way to learn what each signal is for, even if
          modern tooling increasingly blurs the walls between them — see the note at the end of this
          lesson.
        </p>
      </InfoBox>

      <h2>Metrics — Numeric, Aggregated, Cheap</h2>

      <p>
        A metric is a number attached to a timestamp: a request count, a latency value, a queue
        depth, a percentage. Metrics get stored as time series — the same named value sampled
        repeatedly — and because each data point is just a number plus a few low-cardinality labels
        (endpoint, status code, region), they're extremely cheap to store and query even at massive
        scale. That cheapness is what makes them the right tool for two jobs: dashboards you glance at
        to answer &quot;is something wrong right now,&quot; and alerting rules that fire when a
        threshold is crossed.
      </p>

      <CodeBlock language="text" title="What a metric actually looks like">
{`http_requests_error_rate{service="checkout"} @ 14:00 = 0.4%
http_requests_error_rate{service="checkout"} @ 14:01 = 0.5%
http_requests_error_rate{service="checkout"} @ 14:02 = 0.6%
http_requests_error_rate{service="checkout"} @ 14:14 = 11.8%   <- alert fires
http_requests_error_rate{service="checkout"} @ 14:15 = 12.1%

That's the entire payload: a name, a handful of labels, a number, a time.
No request bodies, no stack traces, no per-user detail — which is exactly
why a year of this data is gigabytes, not terabytes.`}
      </CodeBlock>

      <p>
        A metric can tell you the checkout service's error rate jumped from 0.5% to 12% at 14:14.
        It cannot tell you why. It has thrown away every detail that would explain the spike — which
        requests failed, what exception was thrown, which user or which downstream call was involved
        — because throwing that detail away is the entire reason it's cheap enough to keep forever
        and query in milliseconds. That's not a shortcoming to fix; it's the design tradeoff that
        makes metrics viable at scale.
      </p>

      <h2>Logs — Discrete, Detailed, Expensive</h2>

      <p>
        A log is a timestamped record of one discrete event, usually with unbounded, free-form
        detail attached — a stack trace, a request payload, a user ID, a SQL statement. Where a
        metric collapses a million requests into one number, a log keeps every one of those million
        requests as a separate record. That's the tradeoff in the other direction: logs are where you
        find out <em>exactly</em> what happened for one specific failing request, at the cost of
        volume that scales linearly with traffic — a busy service can produce more log data per day
        than a year of its own metrics.
      </p>

      <CodeBlock language="json" title="What a log actually looks like">
{`{
  "timestamp": "2026-08-14T14:14:07.331Z",
  "level": "ERROR",
  "service": "checkout",
  "requestId": "a1b2c3d4",
  "userId": "u_88213",
  "message": "Payment authorization failed",
  "exception": "PaymentGatewayTimeoutException",
  "stackTrace": "at com.example.payments.GatewayClient.authorize(GatewayClient.java:142)\\n  at com.example.checkout.CheckoutService.charge(CheckoutService.java:58)\\n  ...",
  "downstreamHost": "payments-gateway-7.internal",
  "latencyMs": 30042
}`}
      </CodeBlock>

      <p>
        This one record answers the question the metric couldn't: request <code>a1b2c3d4</code>{' '}
        failed because the payment gateway didn't respond within 30 seconds. But a log answers that
        question for <em>one</em> request at a time. It can't tell you, on its own, whether this was
        an isolated blip or the first of ten thousand identical failures — that's an aggregate
        question, and aggregating over raw logs at scale is exactly the expensive thing metrics exist
        to avoid.
      </p>

      <h2>Traces — One Request's Path Across Services</h2>

      <p>
        A trace follows a single request as it crosses service boundaries, recording how long it
        spent in each hop. A trace is made of <strong>spans</strong> — one span per unit of work
        (an HTTP call, a database query, a downstream service invocation) — linked together by a
        shared trace ID so the whole journey can be reassembled and viewed as a timeline. This is the
        tool for distributed-systems latency: in a monolith, &quot;where did the time go&quot; is a
        profiler question; once a request fans out across five services, neither a metric nor a
        single log line can show you which hop actually ate the time.
      </p>

      <CodeBlock language="text" title="What a trace actually looks like — one request, five hops">
{`Trace a1b2c3d4  (total: 420ms)
├─ span: api-gateway              0ms   -> 420ms  (420ms)
│  └─ span: checkout-service      8ms   -> 415ms  (407ms)
│     ├─ span: inventory-service  12ms  -> 45ms    (33ms)
│     ├─ span: pricing-service    46ms  -> 61ms    (15ms)
│     └─ span: payment-service    62ms  -> 412ms  (350ms)   <- here
│        └─ span: card-network    70ms  -> 405ms  (335ms)   <- and here

The other four hops together cost 68ms. The payment-service call to the
card network cost 335ms — that's where 80% of the 420ms total actually went.`}
      </CodeBlock>

      <p>
        A metric would have told you checkout latency's p99 crept up this week. A log from the
        payment service would show one slow call, with no way to tell you it was on the critical path
        of a user-facing checkout request at all. Only the trace shows both facts at once: this
        specific request was slow, and specifically because of the card-network hop inside
        payment-service — not the gateway, not inventory, not pricing.
      </p>

      <h2>The Same Incident, Through Each Pillar</h2>

      <p>
        Put an outage through all three and the difference sharpens. Say checkout error rates spike
        at 2:14pm:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Pillar</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Answers well</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Cannot answer</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Metrics</strong></td>
            <td style={{ padding: '0.75rem' }}>Error rate jumped from 0.5% to 12% at 14:14 — something is wrong, right now</td>
            <td style={{ padding: '0.75rem' }}>Why. Which requests. Which user. Which line of code.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Logs</strong></td>
            <td style={{ padding: '0.75rem' }}>Request a1b2c3d4 threw PaymentGatewayTimeoutException at line 142 with a 30s timeout</td>
            <td style={{ padding: '0.75rem' }}>Whether this is 1 request or 50,000. The aggregate pattern.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Traces</strong></td>
            <td style={{ padding: '0.75rem' }}>This request spent 335 of its 420ms specifically inside the card-network hop of payment-service</td>
            <td style={{ padding: '0.75rem' }}>The full stack trace or exception detail for that hop. The aggregate error rate across all users.</td>
          </tr>
        </tbody>
      </table>

      <p>
        In practice you use all three in sequence: the metric's alert tells you <em>something</em>{' '}
        broke at 14:14; a handful of traces from that window show <em>where</em> in the call graph the
        time or errors concentrated; the logs for the specific slow span give you the exact exception
        to act on. Each pillar hands off to the next — none of them replaces the other two.
      </p>

      <InfoBox variant="warning" title="The Walls Are Blurrier Than the Diagram Suggests">
        <p>
          Treat &quot;three separate pillars&quot; as a teaching model, not a technical law. Modern
          tooling increasingly collapses the boundaries: structured logs (like the JSON example above)
          get indexed and queried in ways that look a lot like metrics — &quot;count of ERROR-level
          logs where <code>service=checkout</code>, grouped by minute&quot; is a metrics-shaped query
          running against log data. Trace spans commonly carry log-like events and get correlated with
          log lines via a shared <code>traceId</code>, so you can jump from a slow span straight to
          the log record it produced. Some newer platforms (Honeycomb's &quot;wide events&quot; model
          is the most vocal example) skip the three-way split entirely and store one arbitrarily wide
          structured record per request, deriving metric- and trace-like views from it on query. The
          three-pillars split is still a solid way to learn what each signal type is <em>for</em> — just
          don't mistake it for a permanent architectural wall.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="There Is a Fourth Signal Arriving: Continuous Profiling">
        <p>
          If the three-pillar split is a teaching model rather than a law, it is worth knowing what is
          being added to it. <strong>Profiles</strong> — continuous, always-on CPU and memory
          profiling of production processes — are being standardised as a fourth OpenTelemetry signal,
          with an OTLP wire format alongside traces, metrics and logs.
        </p>
        <p>
          It fills a gap the other three genuinely cannot. A trace tells you the 340ms was spent
          inside <code>payment-service</code>, and stops there — the span is the smallest unit it
          knows about. Profiles tell you which <em>functions</em> burned that CPU, down to the line,
          continuously, in production, at overhead low enough to leave switched on. That is the
          question &quot;where did the time go <em>inside</em> the slow span&quot; that otherwise ends
          with someone trying to reproduce it locally with a profiler attached.
        </p>
        <p>
          Status matters here, so be precise about it: profiles are the <em>least</em> mature signal.
          The specification and OTLP format are still moving, and SDK support is thin — Java is in
          development and most languages have nothing yet, while traces and metrics are stable almost
          everywhere. Vendor-specific continuous profilers (Pyroscope/Grafana, Datadog, Elastic,
          Polar Signals) are production-ready today; the OpenTelemetry-native, vendor-neutral version
          is not there yet. Know it is coming, check its current status before planning around it,
          and do not let &quot;there are four signals now&quot; imply they are equally usable.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
