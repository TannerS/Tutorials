import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Actuator() {
  return (
    <LessonLayout
      title="Actuator & Metrics Before the Rename"
      sectionId="springboot2"
      lessonIndex={15}
      prev={{ path: '/springboot2/observability', label: 'Observability' }}
      next={{ path: '/springboot2/migration', label: 'Migrating 2 → 3 → 4, In Order' }}
    >
      <p>
        Actuator is the part of a Boot 2 app that your <em>operations</em> depend on — dashboards,
        Kubernetes probes, alerting rules, scrape configs. That makes its changes at the
        2&nbsp;→&nbsp;3 line unusually expensive: a rename here does not break your build, it
        breaks a Grafana panel or a readiness probe, and it does so after deploy.
      </p>
      <p>
        Every output on this page was produced by running a Spring Boot 2.7.18 app and a Spring
        Boot 3.5.16 app side by side and curling them.
      </p>

      <h2>1. httptrace Became httpexchanges</h2>
      <p>
        The endpoint that records recent HTTP request/response pairs was renamed wholesale — the
        endpoint id, the repository interface, its in-memory implementation, and the package all
        changed at once.
      </p>

      <CodeBlock language="text" title="The full rename">
{`ENDPOINT
  /actuator/httptrace              ->  /actuator/httpexchanges
  management...exposure.include=httptrace  ->  ...include=httpexchanges

TYPES
  HttpTraceRepository              ->  HttpExchangeRepository
  InMemoryHttpTraceRepository      ->  InMemoryHttpExchangeRepository
  HttpTrace                        ->  HttpExchange

PACKAGE
  org.springframework.boot.actuate.trace.http
        ->  org.springframework.boot.actuate.web.exchanges

PROPERTIES
  management.trace.http.*          ->  management.httpexchanges.*`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 2 — the bean you must declare (see the warning below)">
{`import org.springframework.boot.actuate.trace.http.HttpTraceRepository;
import org.springframework.boot.actuate.trace.http.InMemoryHttpTraceRepository;

@Bean
public HttpTraceRepository httpTraceRepository() {
    return new InMemoryHttpTraceRepository();
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3+ — the same bean, renamed">
{`import org.springframework.boot.actuate.web.exchanges.HttpExchangeRepository;
import org.springframework.boot.actuate.web.exchanges.InMemoryHttpExchangeRepository;

@Bean
public HttpExchangeRepository httpExchangeRepository() {
    return new InMemoryHttpExchangeRepository();
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Since Boot 2.2, the endpoint does nothing without that bean">
        <p>
          Boot 2.0 and 2.1 auto-configured an <code>InMemoryHttpTraceRepository</code> for you.
          Boot 2.2 stopped, precisely because an unbounded-ish in-memory buffer of request and
          response headers is a memory and privacy liability to enable by default. From 2.2 onward
          you must publish the bean yourself, or the endpoint is simply not there.
        </p>
        <p>
          Practical consequence when reading legacy code: if you find{' '}
          <code>httptrace</code> in an <code>exposure.include</code> list but no repository bean
          anywhere, the endpoint has been dead since whenever that app was upgraded past 2.2, and
          nobody noticed. That is your evidence that nothing actually depends on it — which makes
          the migration decision easy.
        </p>
      </InfoBox>

      <h3>Proof, from both versions</h3>
      <CodeBlock language="text" title="Boot 2.7.18 — /actuator/httptrace, real response (truncated)">
{`$ curl -s http://localhost:8099/actuator/httptrace
{
    "traces": [
        {
            "timestamp": "2026-08-24T23:27:02.325649Z",
            "principal": null,
            "session": null,
            "request": {
                "method": "GET",
                "uri": "http://localhost:8099/actuator",
                "headers": {
                    "host": ["localhost:8099"],
                    "user-agent": ["curl/8.7.1"],
                    "accept": ["*/*"]
                },
                "remoteAddress": null
            },
            "response": {
                "status": 200,
                "headers": {
                    "Transfer-Encoding": ["chunked"],
                    "Date": ["Mon, 24 Aug 2026 23:27:02 GMT"],
                    "Content-Type": ["application/vnd.spring-boot.actuator.v3+json"]
                }
            },
            "timeTaken": 1
        },
        ...
    ]
}

$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8099/actuator/httpexchanges
404`}
      </CodeBlock>

      <CodeBlock language="text" title="Boot 3.5.16 — exactly reversed">
{`$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8097/actuator/httptrace
404
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8097/actuator/httpexchanges
200`}
      </CodeBlock>

      <InfoBox variant="danger" title="The 404 is the whole problem">
        <p>
          Notice what does <em>not</em> happen on Boot 3: there is no error, no warning, no
          startup failure. <code>httptrace</code> in your exposure list is not rejected — it is
          just an id that matches no endpoint, so the path returns 404. Anything scraping or
          probing that URL silently starts failing on the first deploy after the upgrade.
        </p>
      </InfoBox>

      <h2>2. JMX Exposure — and a Default That Confuses Everyone</h2>
      <p>
        The documented change is that Boot 3 exposes only the <code>health</code> endpoint over
        JMX, where Boot 2 exposed everything. That is true, and here it is measured — but there is
        a prior default that means most people never observe it.
      </p>

      <CodeBlock language="text" title="Measured by querying each app's own MBeanServer at startup">
{`# Boot 2.7.18, with spring.jmx.enabled=true
JMX-EXPOSED-ENDPOINTS: [Beans, Caches, Conditions, Configprops, Env, Health,
                        Httptrace, Info, Loggers, Mappings, Metrics,
                        Scheduledtasks, Threaddump]

# Boot 3.5.16, with spring.jmx.enabled=true
JMX-EXPOSED-ENDPOINTS: [Health]`}
      </CodeBlock>

      <p>
        Thirteen endpoints versus one. The relevant properties and their defaults:
      </p>

      <CodeBlock language="text" title="The two defaults, and which one bites first">
{`management.endpoints.jmx.exposure.include
    Boot 2:  *          (everything)
    Boot 3+: health     (only health)

spring.jmx.enabled
    Boot 2.0 / 2.1:  true
    Boot 2.2+:       FALSE
    Boot 3 / 4:      false`}
      </CodeBlock>

      <InfoBox variant="note" title="Verified: with stock defaults, Boot 2.7 exposes NOTHING over JMX">
        <p>
          The same Boot 2.7.18 app, started <em>without</em>{' '}
          <code>spring.jmx.enabled=true</code>, reported:
        </p>
        <CodeBlock language="text" title="Boot 2.7.18, default configuration">
{`JMX-EXPOSED-ENDPOINTS: []`}
        </CodeBlock>
        <p>
          Because <code>spring.jmx.enabled</code> has defaulted to <code>false</code> since Boot
          2.2, the <code>management.endpoints.jmx.exposure.include=*</code> default never gets a
          chance to matter. So the honest version of &quot;Boot 2 exposed everything over JMX&quot;
          is: <strong>it exposed everything if you had turned JMX on at all</strong>, which since
          2.2 has required an explicit opt-in.
        </p>
        <p>
          Why you still care: if the app you are migrating is one of the ones that <em>did</em>{' '}
          opt in — usually an older app with a JMX-based monitoring agent or a JConsole runbook —
          then the upgrade takes it from thirteen endpoints to one, and your monitoring goes blind
          without any error. That is a small population of apps, but they are exactly the apps
          that have been running since Boot 2.0.
        </p>
      </InfoBox>

      <CodeBlock language="yaml" title="Restoring the Boot 2 behaviour, if you genuinely need it">
{`spring:
  jmx:
    enabled: true
management:
  endpoints:
    jmx:
      exposure:
        include: "*"    # explicit opt-in on Boot 3+; quote the asterisk in YAML`}
      </CodeBlock>

      <h2>3. Sanitization on /env and /configprops Got Much Stricter</h2>
      <p>
        This is the change most likely to make you think something is broken, because the endpoint
        works perfectly and returns data that looks wrong.
      </p>

      <p>
        The same two properties, on both versions. <code>app.api-token</code> has a
        secret-sounding name; <code>app.plain-setting</code> does not:
      </p>

      <CodeBlock language="properties" title="application.properties, identical on both apps">
{`app.api-token=super-secret-value
app.plain-setting=visible-value`}
      </CodeBlock>

      <CodeBlock language="text" title="Boot 2.7.18 — key-pattern sanitization">
{`$ curl -s localhost:8099/actuator/env/app.api-token
"property": {
    "source": "Config resource 'class path resource [application.properties]' ...",
    "value": "******"
}

$ curl -s localhost:8099/actuator/env/app.plain-setting
"property": {
    "source": "Config resource 'class path resource [application.properties]' ...",
    "value": "visible-value"          <-- shown in full
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Boot 3.5.16 — everything is masked">
{`$ curl -s localhost:8097/actuator/env/app.api-token
{'source': "Config resource 'class path resource [application.properties]' ...",
 'value': '******'}

$ curl -s localhost:8097/actuator/env/app.plain-setting
{'source': "Config resource 'class path resource [application.properties]' ...",
 'value': '******'}          <-- ALSO masked, despite an innocuous name`}
      </CodeBlock>

      <InfoBox variant="tip" title="What actually changed, and why it is an improvement">
        <p>
          Boot 2 guessed. It sanitized values whose <em>key matched a keyword pattern</em> —{' '}
          <code>password</code>, <code>secret</code>, <code>key</code>, <code>token</code>,{' '}
          <code>credentials</code>, <code>vcap_services</code> and friends, configurable via{' '}
          <code>management.endpoint.env.keys-to-sanitize</code>. A secret named{' '}
          <code>app.stripe-pk</code> or <code>app.db-conn</code> sailed straight through.
        </p>
        <p>
          Boot 3 stopped guessing: <code>/env</code> and <code>/configprops</code> mask{' '}
          <strong>everything</strong> by default and you opt back in. That is the same design move
          Spring Security made with request matchers — replace a heuristic that is wrong in the
          dangerous direction with an explicit choice.
        </p>
      </InfoBox>

      <CodeBlock language="yaml" title="Opting back in on Boot 3+ — deliberately, per endpoint">
{`management:
  endpoint:
    env:
      show-values: WHEN_AUTHORIZED    # NEVER (default) | ALWAYS | WHEN_AUTHORIZED
    configprops:
      show-values: WHEN_AUTHORIZED

# WHEN_AUTHORIZED is the setting you want: values are shown only to a caller
# the endpoint considers authorized (by the roles in
# management.endpoint.env.roles). ALWAYS shows them to anyone who can reach
# the endpoint, which — combined with an exposure list that includes env —
# is how config leaks happen.`}
      </CodeBlock>

      <h2>4. Exposure: The Property You Will Always Be Setting</h2>
      <p>
        Unchanged in mechanism, and the defaults are conservative in both versions. Over the web,
        only <code>health</code> (and, on Boot 2, <code>info</code>) is exposed unless you say
        otherwise.
      </p>

      <CodeBlock language="text" title="Verified — Boot 2.7.18 restricted to the Boot 2 default set">
{`$ curl -s http://localhost:8095/actuator
['health', 'health-path', 'info', 'self']`}
      </CodeBlock>

      <CodeBlock language="yaml" title="A realistic production exposure list — same syntax on Boot 2 and Boot 4">
{`management:
  endpoints:
    web:
      base-path: /actuator            # change it if it is internet-adjacent
      exposure:
        include: health,info,metrics,prometheus,loggers
        exclude: env,configprops,beans,threaddump,heapdump
  endpoint:
    health:
      show-details: when-authorized   # never | when-authorized | always
      probes:
        enabled: true                 # adds /health/liveness and /health/readiness
  server:
    port: 9090                        # actuator on a SEPARATE port — see below`}
      </CodeBlock>

      <InfoBox variant="danger" title="include: '*' is the single most common Actuator mistake">
        <p>
          It exposes <code>/actuator/heapdump</code> (a downloadable dump of your entire heap —
          every credential and token in memory), <code>/actuator/env</code>,{' '}
          <code>/actuator/threaddump</code> and <code>/actuator/loggers</code> (writable: an
          attacker can turn on DEBUG logging everywhere). <code>exclude</code> wins over{' '}
          <code>include</code>, so if you inherit <code>include: &quot;*&quot;</code> and cannot
          immediately audit it, an <code>exclude</code> list is a legitimate emergency brake.
        </p>
        <p>
          The stronger fix is <code>management.server.port</code> — a different port entirely, so
          the endpoints are not reachable from wherever your application traffic arrives. Combine
          it with a firewall or network policy and the exposure argument mostly goes away.
        </p>
      </InfoBox>

      <h2>5. Health Indicators and Custom Contributors</h2>
      <p>
        Unchanged between Boot 2 and Boot 4 in every way that matters — the interface, the
        registration, the naming convention and the aggregation rules are identical. This section
        is a reference for reading Boot 2 code, not a migration item.
      </p>

      <CodeBlock language="java" title="A custom indicator — identical on Boot 2 and Boot 4">
{`import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class QueueHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        return Health.up().withDetail("pendingMessages", 3).build();
    }
}

// NAMING: the bean name minus a trailing "HealthIndicator" becomes the key
// in the JSON. QueueHealthIndicator -> "queue". This is why the class name
// matters more than usual.

// Failure shapes:
//   Health.down().withException(e).build()
//   Health.outOfService().build()
//   Health.unknown().build()`}
      </CodeBlock>

      <CodeBlock language="text" title="Real /actuator/health from the Boot 2.7.18 app (show-details: always)">
{`{
    "status": "UP",
    "components": {
        "diskSpace": {
            "status": "UP",
            "details": {
                "total": 994662584320,
                "free": 766182494208,
                "threshold": 10485760,
                "exists": true
            }
        },
        "ping": { "status": "UP" },
        "queue": {
            "status": "UP",
            "details": { "pendingMessages": 3 }
        }
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The aggregation rule that causes cascading outages">
        <p>
          The top-level <code>status</code> is the <em>worst</em> status among all contributors.
          One <code>DOWN</code> indicator makes the whole endpoint <code>DOWN</code>, which returns
          HTTP 503, which fails your Kubernetes readiness probe, which removes the pod from the
          load balancer.
        </p>
        <p>
          So a health indicator that checks a <strong>downstream service</strong> is a loaded gun:
          when that downstream has a blip, every one of your pods reports unready simultaneously
          and you have converted someone else&apos;s partial outage into your own total one. Check
          only what you own and cannot serve traffic without. Put downstream checks on a{' '}
          <em>separate group</em> that no probe consumes.
        </p>
      </InfoBox>

      <CodeBlock language="yaml" title="Health groups — Boot 2.2+, and the right way to keep probes honest">
{`management:
  endpoint:
    health:
      probes:
        enabled: true
      group:
        readiness:
          include: db, redis          # things we cannot serve without
        liveness:
          include: livenessState      # only "is the JVM wedged"
        deep:
          include: db, redis, paymentGateway, catalogService
          # ^ the diagnostic view. Exposed for humans and dashboards,
          #   consumed by NO probe. This is where downstream checks belong.

# Resulting endpoints:
#   /actuator/health/liveness    -> restart me if this fails
#   /actuator/health/readiness   -> stop sending me traffic if this fails
#   /actuator/health/deep`}
      </CodeBlock>

      <h2>6. Micrometer on Boot 2</h2>
      <p>
        Micrometer is the metrics facade in both. The API you write day to day —{' '}
        <code>MeterRegistry</code>, <code>Counter</code>, <code>Timer</code>, <code>Gauge</code>,{' '}
        <code>@Timed</code> — is the same. What is genuinely different is everything around{' '}
        <em>tracing</em>.
      </p>

      <CodeBlock language="java" title="Custom metrics — this code is portable as-is">
{`@Service
public class CheckoutService {

    private final Counter completed;
    private final Timer   duration;

    public CheckoutService(MeterRegistry registry) {
        this.completed = Counter.builder("checkout.completed")
                .description("Completed checkouts")
                .tag("channel", "web")
                .register(registry);
        this.duration = Timer.builder("checkout.duration")
                .publishPercentileHistogram()
                .register(registry);
    }

    public Receipt checkout(Cart cart) {
        return duration.record(() -> {
            Receipt r = doCheckout(cart);
            completed.increment();
            return r;
        });
    }
}

// TAG CARDINALITY is the rule that outlives every version change: every
// distinct combination of tag values is a separate time series. Tagging
// with a userId or an orderId will take down your metrics backend.
// Tag with channel, region, status, outcome — bounded sets.`}
      </CodeBlock>

      <CodeBlock language="text" title="The Prometheus property rename (Boot 2 → Boot 3)">
{`management.metrics.export.prometheus.enabled
        ->  management.prometheus.metrics.export.enabled
management.metrics.export.prometheus.step
        ->  management.prometheus.metrics.export.step

The pattern: management.metrics.export.<product>.*
          -> management.<product>.metrics.export.*
...and the same reshuffle applies to every other registry (datadog, influx,
newrelic, graphite, ...).

The /actuator/prometheus ENDPOINT PATH is unchanged, so your scrape config
survives — it is only these properties that move.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Boot 3.5's migrator does NOT report this rename — verified">
        <p>
          Fed <code>management.metrics.export.prometheus.enabled</code> and{' '}
          <code>.step</code>, Spring Boot <strong>3.0.13</strong> reported both with their
          replacements. Spring Boot <strong>3.5.16</strong>, given identical input, produced{' '}
          <em>no migrator output at all</em> — the deprecation metadata for this rename has since
          been pruned.
        </p>
        <p>
          This is the strongest practical argument for stepping through an early 3.x rather than
          jumping 2.7 straight to the newest 3.5: the tool that finds your renamed properties only
          knows about renames that are still recent. See the Config lesson for the full comparison.
        </p>
      </InfoBox>

      <FlowChart
        title="Tracing: the Boot 2 stack and its Boot 3 replacement"
        chart={"graph TD\nA[Boot 2 app needs distributed tracing] --> B[Spring Cloud Sleuth]\nB --> C[brave / OpenZipkin instrumentation]\nB --> D[Sleuth adds traceId and spanId to MDC]\nE[Boot 3 / 4 app] --> F[Micrometer Tracing]\nF --> G[Bridge: brave OR OpenTelemetry]\nF --> H[Observation API: one call yields metric AND span]\nB -.->|Sleuth is END OF LIFE. Not ported to Boot 3.| F"}
      />

      <InfoBox variant="danger" title="Spring Cloud Sleuth is a hard stop, not a rename">
        <p>
          If the Boot 2 app you are migrating does distributed tracing, it almost certainly uses{' '}
          <strong>Spring Cloud Sleuth</strong>. Sleuth was <em>not</em> ported to Boot 3 — its
          functionality moved into <strong>Micrometer Tracing</strong>, and the Sleuth project
          itself is end-of-life. This is not a package rename you can find-and-replace; it is a
          dependency swap plus a configuration rewrite.
        </p>
        <p>
          Budget for it explicitly during the 2&nbsp;→&nbsp;3 leg. The good news is that what you
          get on the other side is better: Micrometer&apos;s <code>Observation</code> API produces
          a metric <em>and</em> a span from a single instrumentation call, which is the pattern the
          main Spring Boot section&apos;s Observability lesson teaches.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="What replaces what">
{`Boot 2                                  Boot 3 / 4
------------------------------------    -----------------------------------
spring-cloud-starter-sleuth             micrometer-tracing-bridge-brave
                                          (or -bridge-otel)
spring-cloud-sleuth-zipkin              zipkin-reporter-brave
spring.sleuth.sampler.probability       management.tracing.sampling.probability
spring.zipkin.base-url                  management.zipkin.tracing.endpoint

Micrometer 1.x (metrics only)           Micrometer 1.10+ (metrics + tracing +
                                          the Observation API)
[no equivalent]                         Observation.createNotStarted(...)`}
      </CodeBlock>

      <InfoBox variant="success" title="Actuator checklist for the 2 → 3 leg">
        <ul>
          <li>
            Grep your dashboards, alert rules and probe definitions for{' '}
            <code>httptrace</code> — the code change is easy, finding the{' '}
            <em>consumers</em> is the actual work.
          </li>
          <li>
            Rename <code>HttpTraceRepository</code> / <code>InMemoryHttpTraceRepository</code> and
            fix the package, or delete the bean entirely if nothing consumed it.
          </li>
          <li>
            Expect <code>/env</code> and <code>/configprops</code> to return{' '}
            <code>******</code> for everything; set <code>show-values: WHEN_AUTHORIZED</code> if
            you rely on them for debugging.
          </li>
          <li>
            If you use JMX, set <code>management.endpoints.jmx.exposure.include</code> explicitly —
            the default drops from everything to <code>health</code>.
          </li>
          <li>
            Move <code>management.metrics.export.&lt;product&gt;.*</code> to{' '}
            <code>management.&lt;product&gt;.metrics.export.*</code>. Do not trust a clean 3.5
            migrator run for this one.
          </li>
          <li>
            <strong>Plan the Sleuth → Micrometer Tracing swap as its own piece of work.</strong>{' '}
            It is the largest observability item in the whole migration.
          </li>
          <li>
            While you are in here: check no readiness probe depends on a downstream health check.
          </li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}

export default SpringBoot2Actuator;
