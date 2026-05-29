import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Monitoring() {
  return (
    <LessonLayout
      title="Monitoring & Observability"
      sectionId="devops"
      lessonIndex={5}
      prev={{ path: '/devops/cloud', label: 'Cloud Basics (AWS/Azure)' }}
      next={null}
    >
      <h2>The Three Pillars of Observability</h2>
      <p>
        Observability is the ability to understand your system&apos;s internal state by examining
        its outputs. The three pillars work together to give you a complete picture.
      </p>

      <FlowChart
        title="Three Pillars of Observability"
        chart={"graph TD\nA[Observability] --> B[Logs]\nA --> C[Metrics]\nA --> D[Traces]\nB --> E[What happened - event records]\nC --> F[How much - numeric measurements]\nD --> G[How long - request flow across services]\nE --> H[ELK Stack / CloudWatch Logs / Loki]\nF --> I[Prometheus / CloudWatch Metrics / Datadog]\nG --> J[Jaeger / Zipkin / X-Ray]\nstyle A fill:#9C27B0,color:#fff\nstyle B fill:#4CAF50,color:#fff\nstyle C fill:#2196F3,color:#fff\nstyle D fill:#FF9800,color:#fff"}
      />

      <h2>Structured Logging</h2>
      <p>
        Structured logs use a consistent format (usually JSON) that can be easily parsed,
        searched, and aggregated. Always prefer structured over free-text logs.
      </p>

      <CodeBlock language="javascript" title="Node.js — Winston / Pino">
{`// Pino — the fastest Node.js logger
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: ['req.headers.authorization', 'password'],
});

// Structured log with context
logger.info({ userId: 'u-123', action: 'login', ip: '10.0.0.1' }, 'User logged in');
// Output: {"level":"info","time":1234567890,"userId":"u-123","action":"login","ip":"10.0.0.1","msg":"User logged in"}

// Child loggers inherit context
const reqLogger = logger.child({ requestId: 'req-abc-123', service: 'auth' });
reqLogger.info('Processing authentication');
reqLogger.error({ err: new Error('Token expired') }, 'Auth failed');

// Express middleware for request logging
import pinoHttp from 'pino-http';
app.use(pinoHttp({ logger }));`}
      </CodeBlock>

      <CodeBlock language="java" title="Java — SLF4J with Logback">
{`import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import net.logstash.logback.argument.StructuredArguments;
import static net.logstash.logback.argument.StructuredArguments.*;

public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public Order processOrder(OrderRequest request) {
        // Structured key-value pairs
        log.info("Processing order",
            kv("orderId", request.getId()),
            kv("userId", request.getUserId()),
            kv("amount", request.getAmount()));

        try {
            Order order = orderRepository.save(request);
            log.info("Order processed successfully",
                kv("orderId", order.getId()),
                kv("processingTimeMs", elapsed));
            return order;
        } catch (Exception e) {
            log.error("Order processing failed",
                kv("orderId", request.getId()),
                kv("error", e.getMessage()), e);
            throw e;
        }
    }
}`}
      </CodeBlock>

      <h2>Log Levels</h2>

      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>When to Use</th>
            <th>Examples</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>TRACE</strong></td>
            <td>Very detailed debugging (usually disabled)</td>
            <td>Method entry/exit, variable values</td>
          </tr>
          <tr>
            <td><strong>DEBUG</strong></td>
            <td>Diagnostic info for developers</td>
            <td>SQL queries, cache hits/misses, parsed config</td>
          </tr>
          <tr>
            <td><strong>INFO</strong></td>
            <td>Normal operational events</td>
            <td>Server started, request processed, job completed</td>
          </tr>
          <tr>
            <td><strong>WARN</strong></td>
            <td>Unexpected but recoverable situations</td>
            <td>Retry attempt, deprecated API called, high memory</td>
          </tr>
          <tr>
            <td><strong>ERROR</strong></td>
            <td>Failures that need attention</td>
            <td>Unhandled exception, external service down, data corruption</td>
          </tr>
          <tr>
            <td><strong>FATAL</strong></td>
            <td>Application cannot continue</td>
            <td>Database unreachable on startup, critical config missing</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Logging Anti-Patterns">
        <ul>
          <li>Never log sensitive data (passwords, tokens, PII, credit cards)</li>
          <li>Never log inside tight loops — it kills performance</li>
          <li>Don&apos;t log and throw — pick one or the exception gets logged twice</li>
          <li>Avoid string concatenation in log calls — use parameterized logging</li>
        </ul>
      </InfoBox>

      <h2>Metrics with Prometheus</h2>

      <CodeBlock language="javascript" title="Node.js — Prometheus Metrics">
{`import promClient from 'prom-client';

// Enable default metrics (CPU, memory, event loop)
promClient.collectDefaultMetrics({ prefix: 'myapp_' });

// Custom counter — track events
const requestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Custom histogram — track durations
const requestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

// Middleware to instrument all requests
app.use((req, res, next) => {
  const end = requestDuration.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    requestCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
    end();
  });
  next();
});

// Expose /metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});`}
      </CodeBlock>

      <CodeBlock language="java" title="Java — Micrometer Metrics (Spring Boot)">
{`// Spring Boot auto-configures Micrometer with Actuator
// application.yml:
// management:
//   endpoints:
//     web:
//       exposure:
//         include: health,info,prometheus
//   metrics:
//     export:
//       prometheus:
//         enabled: true

@Service
public class PaymentService {
    private final MeterRegistry registry;
    private final Counter paymentCounter;
    private final Timer paymentTimer;

    public PaymentService(MeterRegistry registry) {
        this.registry = registry;
        this.paymentCounter = Counter.builder("payments_total")
            .description("Total payment attempts")
            .tag("service", "payment")
            .register(registry);
        this.paymentTimer = Timer.builder("payment_processing_duration")
            .description("Payment processing time")
            .register(registry);
    }

    public PaymentResult process(PaymentRequest request) {
        return paymentTimer.record(() -> {
            paymentCounter.increment();
            // process payment...
            return result;
        });
    }
}`}
      </CodeBlock>

      <h2>Dashboards with Grafana</h2>

      <CodeBlock language="bash" title="Essential Dashboard Panels">
{`# RED Method for services (Rate, Errors, Duration):
# 1. Request Rate:     rate(http_requests_total[5m])
# 2. Error Rate:       rate(http_requests_total{status=~"5.."}[5m])
# 3. Duration (p99):   histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# USE Method for resources (Utilization, Saturation, Errors):
# 1. CPU Utilization:  100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
# 2. Memory Usage:     node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
# 3. Disk I/O:         rate(node_disk_io_time_seconds_total[5m])

# Business metrics:
# Orders per minute:   rate(orders_total[1m]) * 60
# Revenue:             sum(order_amount_total) by (product)
# Active users:        active_sessions_gauge`}
      </CodeBlock>

      <InfoBox variant="tip" title="RED and USE Methods">
        Use the <strong>RED method</strong> for request-driven services (APIs, web apps):
        Rate, Errors, Duration. Use the <strong>USE method</strong> for infrastructure resources
        (CPU, disk, network): Utilization, Saturation, Errors. Together they cover most
        monitoring needs.
      </InfoBox>

      <h2>Distributed Tracing</h2>
      <p>
        In microservices, a single user request can span dozens of services. Distributed tracing
        follows that request across service boundaries using a unique trace ID.
      </p>

      <FlowChart
        title="Distributed Trace Flow"
        chart={"graph LR\nA[Client Request] -->|traceId: abc-123| B[API Gateway]\nB -->|spanId: span-1| C[Auth Service]\nB -->|spanId: span-2| D[Order Service]\nD -->|spanId: span-3| E[Payment Service]\nD -->|spanId: span-4| F[Inventory Service]\nE -->|spanId: span-5| G[Bank API]\nstyle A fill:#2196F3,color:#fff\nstyle B fill:#4CAF50,color:#fff"}
      />

      <CodeBlock language="javascript" title="OpenTelemetry Setup (Node.js)">
{`// tracing.js — load before anything else
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  serviceName: 'order-service',
  traceExporter: new OTLPTraceExporter({
    url: 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
    }),
  ],
});

sdk.start();

// Custom spans for business logic
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

async function processOrder(order) {
  return tracer.startActiveSpan('processOrder', async (span) => {
    span.setAttribute('order.id', order.id);
    span.setAttribute('order.amount', order.amount);
    try {
      const result = await saveOrder(order);
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (err) {
      span.setStatus({ code: 2, message: err.message }); // ERROR
      throw err;
    } finally {
      span.end();
    }
  });
}`}
      </CodeBlock>

      <h2>Health Checks &amp; Readiness Probes</h2>

      <CodeBlock language="javascript" title="Health Check Endpoints">
{`// Liveness: is the process alive?
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Readiness: can it serve traffic?
app.get('/health/ready', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalApi: await checkExternalApi(),
  };
  
  const isReady = Object.values(checks).every(c => c.status === 'UP');
  res.status(isReady ? 200 : 503).json({ status: isReady ? 'UP' : 'DOWN', checks });
});

async function checkDatabase() {
  try {
    await db.query('SELECT 1');
    return { status: 'UP' };
  } catch (e) {
    return { status: 'DOWN', error: e.message };
  }
}`}
      </CodeBlock>

      <CodeBlock language="yaml" title="Kubernetes Probes">
{`spec:
  containers:
    - name: my-app
      livenessProbe:
        httpGet:
          path: /health/live
          port: 3000
        initialDelaySeconds: 15
        periodSeconds: 10
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
      startupProbe:
        httpGet:
          path: /health/live
          port: 3000
        failureThreshold: 30
        periodSeconds: 10`}
      </CodeBlock>

      <h2>SLOs, SLIs, and SLAs</h2>

      <table>
        <thead>
          <tr>
            <th>Term</th>
            <th>Definition</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SLI</strong> (Service Level Indicator)</td>
            <td>The metric you measure</td>
            <td>99.2% of requests complete in &lt; 200ms</td>
          </tr>
          <tr>
            <td><strong>SLO</strong> (Service Level Objective)</td>
            <td>Your internal target for an SLI</td>
            <td>99.9% availability over 30 days</td>
          </tr>
          <tr>
            <td><strong>SLA</strong> (Service Level Agreement)</td>
            <td>Contractual promise with consequences</td>
            <td>99.95% uptime or customer gets credits</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="Error Budgets">
        An error budget is the gap between your SLO and 100%. If your SLO is 99.9%, your error
        budget is 0.1% — about 43 minutes of downtime per month. While you have budget remaining,
        ship features fast. When the budget runs low, focus on reliability.
      </InfoBox>

      <h2>Alerting Best Practices</h2>

      <CodeBlock language="yaml" title="Prometheus Alerting Rules">
{`groups:
  - name: application-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 5% for 5 minutes"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "p95 latency exceeds 1 second"`}
      </CodeBlock>

      <InfoBox variant="danger" title="Alert Fatigue">
        Every alert should be actionable. If an alert fires and nobody needs to do anything,
        delete it. If it fires too often, fix the root cause or adjust the threshold. The goal
        is zero false-positive pages — every alert should represent a real problem worth waking
        someone up for.
      </InfoBox>

      <h2>On-Call Best Practices</h2>
      <ul>
        <li><strong>Runbooks:</strong> Every alert should link to a runbook with diagnosis and remediation steps</li>
        <li><strong>Escalation paths:</strong> Clear chain from primary on-call to team lead</li>
        <li><strong>Blameless postmortems:</strong> Focus on systemic causes, not individuals</li>
        <li><strong>Rotation fairness:</strong> Share the on-call burden equally across the team</li>
      </ul>

      <InteractiveChallenge
        question={"Your service's SLO is 99.9% availability over 30 days. How much downtime does your error budget allow?"}
        options={[
          "About 4.3 minutes per month",
          "About 43 minutes per month",
          "About 7.2 hours per month",
          "About 43 seconds per month"
        ]}
        correctIndex={1}
        explanation={"30 days = 43,200 minutes. An error budget of 0.1% (100% - 99.9%) gives you 43,200 * 0.001 = 43.2 minutes of allowed downtime per month. This budget guides the balance between feature velocity and reliability work."}
        language="bash"
      />
    </LessonLayout>
  );
}

export default function MonitoringPage() {
  return <Monitoring />;
}
