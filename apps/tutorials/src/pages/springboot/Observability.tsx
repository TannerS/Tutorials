import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Observability() {
  return (
    <LessonLayout
      title="Observability"
      sectionId="springboot"
      lessonIndex={14}
      prev={{ path: '/springboot/boot4', label: 'Boot 4 Novelties' }}
      next={{ path: '/springboot/cheatsheet', label: 'Cheat Sheet' }}
    >
      <h2>The Three Pillars, Modernized</h2>
      <p>
        Observability is a superset of monitoring. Where monitoring tells you the app is
        down, observability tells you <em>why</em>. In Spring:
      </p>
      <ul>
        <li>
          <strong>Metrics</strong> — Micrometer captures counters, timers, and gauges;
          Actuator exposes them.
        </li>
        <li>
          <strong>Traces</strong> — Micrometer Tracing (or OpenTelemetry directly) records
          spans that cross service boundaries.
        </li>
        <li>
          <strong>Logs</strong> — SLF4J + Logback with MDC-based correlation. Preferably
          structured (JSON) so log aggregators can parse them.
        </li>
      </ul>
      <p>
        The Observation API introduced in Spring 6 unifies the metrics and tracing sides:
        one instrumentation call produces both.
      </p>

      <FlowChart
        title="Observability data flow"
        chart={"graph LR\nA[Service Code] --> B[Micrometer / Observation]\nB --> C[Metrics: Prometheus]\nB --> D[Traces: OTLP]\nA --> E[SLF4J]\nE --> F[Logback]\nF --> G[JSON logs to stdout]\nG --> H[Log aggregator]\nC --> I[Grafana / metrics]\nD --> J[Jaeger / traces]"}
      />

      <h2>Actuator — Enabling and Securing</h2>
      <CodeBlock language="yaml" title="application.yml — production-safe defaults">
{`management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
        exclude: env,configprops,beans,heapdump,threaddump
      base-path: /actuator
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when_authorized
    prometheus:
      access: read-only
  info:
    build:
      enabled: true
    git:
      enabled: true
      mode: simple
  server:
    port: 8081                  # expose management on its own port
    address: 0.0.0.0            # bind to platform network only via k8s policy`}
      </CodeBlock>

      <InfoBox variant="danger" title="What NOT to expose">
        <ul>
          <li><code>/actuator/env</code> — property dump; secrets leak here.</li>
          <li><code>/actuator/configprops</code> — same story, but structured.</li>
          <li><code>/actuator/heapdump</code> — dumps the JVM heap. Attackers love this.</li>
          <li><code>/actuator/beans</code> — full component graph. Ammunition for attacks.</li>
        </ul>
        <p>
          Either exclude them from exposure or require authentication (Spring Security
          filter chain on the management port).
        </p>
      </InfoBox>

      <h2>Micrometer — Metrics in Practice</h2>
      <p>
        <code>MeterRegistry</code> is the entry point. Three primary meter types:
      </p>
      <CodeBlock language="java" title="Counter, Timer, Gauge">
{`@Service
public class OrderService {

    private final MeterRegistry registry;
    private final Counter placedCounter;
    private final Timer placeTimer;

    public OrderService(MeterRegistry registry) {
        this.registry = registry;
        this.placedCounter = Counter.builder("orders.placed")
            .description("Total orders placed")
            .register(registry);
        this.placeTimer = Timer.builder("orders.place.duration")
            .publishPercentileHistogram()               // enables p50/p95/p99 in Prometheus
            .register(registry);

        // Gauge — a value sampled on scrape; provide the current value.
        Gauge.builder("orders.pending", this, OrderService::pendingCount)
            .description("Orders in pending state")
            .register(registry);
    }

    public Order place(NewOrderRequest req) {
        return placeTimer.record(() -> doPlace(req));
    }

    private Order doPlace(NewOrderRequest req) {
        // ...
        placedCounter.increment();
        return order;
    }

    private long pendingCount() { /* ... */ return 0; }
}`}
      </CodeBlock>

      <h3>Tags — the good, the bad, the cardinality-explosive</h3>
      <CodeBlock language="java" title="Low-cardinality tags only">
{`// GOOD — enum-like values, small fixed set.
registry.counter("orders.placed", "channel", channel.name()).increment();

// BAD — user IDs / UUIDs as tags. Prometheus creates a time series per unique tag
// combination. Millions of user IDs = millions of series = OOM.
registry.counter("orders.placed", "userId", user.id().toString()).increment();

// If you need per-user data, log it or send to an event store. Metrics are
// for aggregates over low-cardinality dimensions.`}
      </CodeBlock>

      <InfoBox variant="warning" title="The cardinality rule">
        <p>
          Tag values should be things like status codes, HTTP methods, endpoint names,
          error classes, and feature flags — bounded sets. Never IDs, tokens, emails, or
          anything user-supplied.
        </p>
      </InfoBox>

      <h2>The Observation API</h2>
      <p>
        Spring 6 introduced <code>Observation</code>, which unifies metrics and tracing.
        You emit one observation; both a metric and a span come out.
      </p>
      <CodeBlock language="java" title="Observation with metric and trace data">
{`@Service
public class CheckoutService {

    private final ObservationRegistry observations;
    public CheckoutService(ObservationRegistry observations) {
        this.observations = observations;
    }

    public Receipt checkout(Cart cart) {
        return Observation.createNotStarted("checkout.perform", observations)
            .lowCardinalityKeyValue("payment.method", cart.paymentMethod().name())
            .highCardinalityKeyValue("cart.id", cart.id().toString())
            .observe(() -> {
                // any exception here becomes an error tag on the observation
                return performCheckout(cart);
            });
    }
}`}
      </CodeBlock>
      <p>
        With <code>micrometer-tracing-bridge-otel</code> or
        <code>micrometer-tracing-bridge-brave</code> on the classpath, every observation
        also produces a span, and downstream calls automatically propagate the trace
        context via headers (<code>traceparent</code> for W3C).
      </p>

      <h2>Structured JSON Logs</h2>
      <p>
        Enterprises want machine-parseable logs. Set Logback to JSON output and every log
        line becomes a structured event.
      </p>
      <CodeBlock language="xml" title="logback-spring.xml — JSON with MDC fields">
{`<configuration>
  <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <includeMdcKeyName>traceId</includeMdcKeyName>
      <includeMdcKeyName>spanId</includeMdcKeyName>
      <includeMdcKeyName>requestId</includeMdcKeyName>
      <includeContext>false</includeContext>
      <customFields>{"service":"order-service","env":"\${SPRING_PROFILES_ACTIVE:-local}"}</customFields>
    </encoder>
  </appender>
  <root level="INFO">
    <appender-ref ref="STDOUT" />
  </root>
</configuration>`}
      </CodeBlock>

      <CodeBlock language="java" title="Adding structured fields inline">
{`log.atInfo()
   .addKeyValue("orderId", order.id())
   .addKeyValue("customer", customer.email())     // will be masked by the aspect (see AOP lesson)
   .addKeyValue("total", order.total())
   .log("Order placed");

// Or via MDC for request-scoped context:
try (var ignored = MDC.putCloseable("orderId", order.id().toString())) {
    log.info("Sending confirmation");
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="One log level per event type">
        <p>
          <strong>ERROR</strong>: something is broken and needs human attention. Pages
          the oncall. <br />
          <strong>WARN</strong>: unexpected but recoverable. Something to look at next
          business day. <br />
          <strong>INFO</strong>: a business-level event happened (order placed, user
          logged in). <br />
          <strong>DEBUG</strong>: developer detail, off in prod.
        </p>
      </InfoBox>

      <h2>OpenTelemetry Directly</h2>
      <p>
        If your organization standardizes on OpenTelemetry, you can point Spring's tracing
        bridge at it or use the OTel Java agent for zero-code instrumentation.
      </p>
      <CodeBlock language="yaml" title="Micrometer + OTel bridge config">
{`management:
  tracing:
    sampling:
      probability: 1.0                   # 100% in dev; a fraction in prod
  otlp:
    tracing:
      endpoint: http://otel-collector:4317
      transport: grpc
      timeout: 10s

# Or use the OTel Java agent (no code change; slower startup):
# -javaagent:opentelemetry-javaagent.jar
#   -Dotel.service.name=order-service
#   -Dotel.exporter.otlp.endpoint=http://otel-collector:4317`}
      </CodeBlock>

      <h2>Custom Health Indicators</h2>
      <CodeBlock language="java" title="Health check for a downstream API">
{`@Component
public class CatalogHealthIndicator implements HealthIndicator {

    private final CatalogApi client;
    public CatalogHealthIndicator(CatalogApi client) { this.client = client; }

    @Override
    public Health health() {
        try {
            client.ping();
            return Health.up().build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .withDetail("service", "catalog-api")
                .build();
        }
    }
}

// Kubernetes probes map to these separate endpoints:
//   /actuator/health/liveness   — pod is alive (don't restart)
//   /actuator/health/readiness  — pod can serve traffic (add to load balancer)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Beware the cascading health check">
        <p>
          A common mistake: <em>readiness</em> depends on every downstream being up.
          Then when one downstream flaps, every service marks itself unready, cascades
          into full outage. Readiness should report "I can accept traffic," not "I can
          serve every possible request perfectly."
        </p>
      </InfoBox>

      <h2>The Runtime Log Level Toggle</h2>
      <p>
        <code>/actuator/loggers</code> lets you change log levels at runtime without
        restarting. A lifesaver for debugging in prod.
      </p>
      <CodeBlock language="text" title="Change log level via HTTP">
{`# Read current level
curl -s http://localhost:8081/actuator/loggers/com.example.orders | jq
#   { "configuredLevel": "INFO", "effectiveLevel": "INFO" }

# Turn on DEBUG for one package for the next hour
curl -X POST http://localhost:8081/actuator/loggers/com.example.orders \\
     -H "Content-Type: application/json" \\
     -d '{"configuredLevel":"DEBUG"}'

# Revert
curl -X POST http://localhost:8081/actuator/loggers/com.example.orders \\
     -H "Content-Type: application/json" \\
     -d '{"configuredLevel":null}'`}
      </CodeBlock>

      <h2>The Golden Signals</h2>
      <InfoBox variant="tip" title="Four metrics you monitor before anything else">
        <ul>
          <li><strong>Latency</strong> — <code>http.server.requests</code> Timer, p50/p95/p99.</li>
          <li><strong>Traffic</strong> — request rate per endpoint.</li>
          <li><strong>Errors</strong> — 4xx and 5xx counts per endpoint. 4xx is client's
              problem; 5xx is yours.</li>
          <li><strong>Saturation</strong> — thread pool utilization, connection pool
              usage, GC pause time.</li>
        </ul>
        <p style={{ marginTop: '0.5rem' }}>
          Every dashboard should have these four for every service. Everything else is
          detail on top.
        </p>
      </InfoBox>

      <h2>Observability Checklist</h2>
      <InfoBox variant="success" title="Signs your app is observable">
        <ul>
          <li><code>/actuator/prometheus</code> is scraped, and the four golden signals
              have alerts.</li>
          <li>Distributed tracing is on, propagating <code>traceparent</code> across
              services.</li>
          <li>Logs are JSON with <code>traceId</code>, <code>spanId</code>, and
              <code>requestId</code> included on every line.</li>
          <li>Custom metrics use the Observation API, so metrics and spans stay in sync.</li>
          <li>Sensitive Actuator endpoints are disabled or authenticated.</li>
          <li>Kubernetes liveness and readiness probes point at
              <code>/actuator/health/liveness</code> and
              <code>/actuator/health/readiness</code>.</li>
          <li>The oncall can raise log levels for a package via
              <code>/actuator/loggers</code> without a redeploy.</li>
          <li>No high-cardinality tag values (IDs, tokens) show up in metrics.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Your Prometheus keeps OOM'ing after a service was updated. A quick look shows millions of time series named http_server_requests. Why?"
        options={[
          "You need to shard Prometheus horizontally",
          "The scrape interval is too short",
          "Someone added a high-cardinality tag (e.g., user ID, request ID, or path variable) to the metric. Every unique value creates a new time series.",
          "The retention period should be reduced"
        ]}
        correctIndex={2}
        explanation="This is the metric-cardinality trap. Prometheus stores a distinct time series for every unique combination of metric name + tag values. Tagging a request metric with a UUID request ID or path variable like /users/{id} means every request creates a new series, which is unbounded. Fix by removing the high-cardinality tag; if you need per-request insight, that data belongs in traces or structured logs, not metrics."
      />
    </LessonLayout>
  );
}
