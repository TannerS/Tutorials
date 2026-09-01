import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Observability() {
  return (
    <LessonLayout
      title="Observability"
      sectionId="springboot2"
      lessonIndex={14}
      prev={{ path: '/springboot2/resilience', label: 'Resilience4j & Circuit Breakers' }}
      next={{ path: '/springboot2/actuator', label: 'Actuator & Metrics Before the Rename' }}
    >
      <p>
        &quot;Observability&quot; on a Boot 2.7.18 service is not one framework feature — it is
        three separately-glued-together libraries, each with its own configuration, its own
        failure modes, and no compiler connecting them. That is the actual difference from Boot
        3/4, and it is a bigger difference than any property rename: Boot 3 did not just move
        where the settings live, it shipped a genuinely new abstraction (the{' '}
        <code>Observation</code> API) that Boot 2&apos;s dependency set cannot produce, no matter
        how you configure it.
      </p>

      <p>
        This lesson is the wide-angle view — what metrics, traces and logs looked like on a real
        Boot 2.7 service, and which of those pieces survive the jump. The{' '}
        <a href="/springboot2/actuator">next lesson</a> is the close-up: the specific Actuator
        endpoints that got renamed, JMX defaults, and <code>/env</code> sanitization. Read this one
        first if you have not touched a Boot 2 service&apos;s monitoring before; skip ahead if you
        already know your way around Actuator and just need the metrics/tracing story.
      </p>

      <h2>The Shape of the Story</h2>

      <p>
        Every claim on this page about what exists in which release is checked against the real{' '}
        <code>spring-boot-dependencies</code> BOM and the real published jars — not memory. Start
        with the headline number:
      </p>

      <CodeBlock language="bash" title="What Micrometer version does each Boot release actually bundle?">
{`for v in 2.7.18 3.0.13; do
  printf '  boot %-8s : ' $v
  curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/$v/spring-boot-dependencies-$v.pom \\
    | grep -oE '<micrometer.version>[^<]+' | head -1
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`  boot 2.7.18  : <micrometer.version>1.9.17
  boot 3.0.13  : <micrometer.version>1.10.13`}
      </CodeBlock>

      <p>
        1.9 versus 1.10 looks like an unremarkable patch jump. It is not. Micrometer 1.10 is the
        release that introduced the <code>Observation</code> API and, alongside it, Micrometer
        Tracing — the module that replaced Spring Cloud Sleuth. Boot 2.7.18 is permanently pinned
        below that line.
      </p>

      <FlowChart
        title="The observability stack: Boot 2.7 vs Boot 3+"
        chart={"graph TD\nA[\"checkoutService.checkout(cart)\"] --> B{\"Boot 2.7 or Boot 3+?\"}\nB -->|\"Boot 2.7\"| C[\"Metrics: MeterRegistry (Micrometer 1.9)\"]\nB -->|\"Boot 2.7\"| D[\"Tracing: Spring Cloud Sleuth + Brave -> Zipkin\"]\nB -->|\"Boot 2.7\"| E[\"Logs: Sleuth injects traceId/spanId into MDC\"]\nC -.->|\"no shared abstraction, no compiler link\"| D\nD -.-> E\nB -->|\"Boot 3+\"| F[\"Observation API (Micrometer 1.10+)\"]\nF --> G[\"Metric: MeterRegistry\"]\nF --> H[\"Span: Micrometer Tracing bridge (brave or otel)\"]\nF --> I[\"Logs: same bridge adds traceId/spanId to MDC\"]\nstyle D fill:#3a2f1a,stroke:#fbbf24\nstyle F fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="note" title="What did NOT change">
        <p>
          <code>MeterRegistry</code>, <code>Counter</code>, <code>Timer</code> and{' '}
          <code>Gauge</code> are Micrometer core, and Micrometer core&apos;s day-to-day API has
          been stable since well before Boot 2.7. If you already know how to instrument a Boot 4
          service with plain meters, that code is portable as-is. Nothing below repeats that
          — it covers what is actually different: tracing, and the API that unifies metrics and
          tracing into one call.
        </p>
      </InfoBox>

      <h2>Metrics: Portable, With One Manual Step</h2>

      <CodeBlock language="java" title="This code is identical on Boot 2.7 and Boot 4">
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

// The cardinality rule outlives every version change: every distinct
// combination of tag values is a separate time series. Tag with channel,
// region, status — bounded sets. Never a userId, orderId or token.`}
      </CodeBlock>

      <p>
        The rename that <em>does</em> bite in this area is the export-property namespace for
        Prometheus and every other registry (<code>management.metrics.export.prometheus.*</code>{' '}
        &rarr; <code>management.prometheus.metrics.export.*</code>). That is Actuator-endpoint
        territory and the <a href="/springboot2/actuator">Actuator lesson</a> covers it in full,
        including the fact that Boot 3.5&apos;s properties migrator no longer reports it. It is
        mentioned here only so you know it is not forgotten, not repeated.
      </p>

      <h2>The Observation API Does Not Exist on Boot 2.7 — Verified</h2>

      <p>
        This is not a deprecation, and it is not something you can work around by bumping a
        version property. The module that defines <code>Observation</code> did not exist yet when
        Micrometer 1.9 shipped:
      </p>

      <CodeBlock language="bash" title="Does micrometer-observation even exist at the version Boot 2.7 pins?">
{`$ curl -s -o /dev/null -w '%{http_code}\\n' \\
    https://repo1.maven.org/maven2/io/micrometer/micrometer-observation/1.9.17/micrometer-observation-1.9.17.jar
404

$ curl -s -o /dev/null -w '%{http_code}\\n' \\
    https://repo1.maven.org/maven2/io/micrometer/micrometer-observation/1.10.13/micrometer-observation-1.10.13.jar
200`}
      </CodeBlock>

      <p>
        Not deprecated, not empty — <strong>the artifact returns 404</strong>. Micrometer split
        Observation into its own module starting at 1.10.0. There is nothing to depend on before
        that, in any Micrometer 1.9.x release, from any Boot BOM.
      </p>

      <InfoBox variant="warning" title="&quot;Just override micrometer.version&quot; does not get you there either">
        <p>
          Spring Boot lets you override a managed version, so it is tempting to set{' '}
          <code>&lt;micrometer.version&gt;1.12.x&lt;/micrometer.version&gt;</code> in a Boot 2.7
          project and assume the rest follows. The jar resolves and compiles. What you do not get
          is the auto-configuration that wires <code>ObservationRegistry</code> into Spring MVC
          filters, <code>RestTemplate</code>/<code>WebClient</code> interceptors and JDBC — that
          plumbing lives in <code>spring-boot-actuator-autoconfigure</code>, and Boot 2.7&apos;s
          copy of that jar was built before the abstraction existed. Checked directly:
        </p>
        <CodeBlock language="bash" title="Counting ObservationAutoConfiguration classes in each Boot release">
{`for v in 2.7.18 3.0.13; do
  printf 'boot %-8s ObservationAutoConfiguration classes: ' $v
  unzip -l spring-boot-actuator-autoconfigure-$v.jar \\
    | grep -c 'ObservationAutoConfiguration.class'
done`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output">
{`boot 2.7.18   ObservationAutoConfiguration classes: 0
boot 3.0.13   ObservationAutoConfiguration classes: 5`}
        </CodeBlock>
        <p>
          A raised <code>micrometer.version</code> gets you a jar with no autoconfiguration behind
          it — dead weight, not a feature. The Observation API is a Boot-3-and-up capability, full
          stop.
        </p>
      </InfoBox>

      <p>
        What that means in practice: on Boot 2.7, a metric and a trace for the same operation are{' '}
        <strong>two separate instrumentation calls</strong>, written by hand, with nothing checking
        that they agree.
      </p>

      <FlowChart
        title="One request, three disconnected instrumentation calls (Boot 2.7)"
        chart={"graph TD\nA[\"checkoutService.checkout(cart)\"] --> B[\"Timer.builder(...).record(...) -- YOU write this\"]\nA --> C[\"tracer.nextSpan().name(...).start() -- YOU write this too, separately\"]\nA --> D[\"log.info(...) -- traceId/spanId already in MDC via Sleuth\"]\nB --> E[\"Metric lands in MeterRegistry -> /actuator/prometheus\"]\nC --> F[\"Span reported to Zipkin over HTTP\"]\nD --> G[\"Log line to stdout\"]\nE -.->|\"correlated only by a human reading two dashboards\"| F\nstyle B fill:#1a2744,stroke:#5b9cf6\nstyle C fill:#1a2744,stroke:#5b9cf6\nstyle E fill:#3a2f1a,stroke:#fbbf24\nstyle F fill:#3a2f1a,stroke:#fbbf24"}
      />

      <CodeBlock language="java" title="Boot 2.7 — the metric and the span are two unrelated calls">
{`@Service
public class CheckoutService {

    private final Timer duration;
    private final Tracer tracer;   // brave.Tracer, from Spring Cloud Sleuth

    public CheckoutService(MeterRegistry registry, Tracer tracer) {
        this.duration = Timer.builder("checkout.duration").register(registry);
        this.tracer = tracer;
    }

    public Receipt checkout(Cart cart) {
        Span span = tracer.nextSpan().name("checkout").start();
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            return duration.record(() -> doCheckout(cart));
        } finally {
            span.end();
        }
    }
}
// Nothing enforces that the timer and the span measure the same window,
// or that a failure path records both. Get the try/finally wrong once
// and metrics and traces quietly disagree.`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3/4 — one call produces both">
{`public Receipt checkout(Cart cart) {
    return Observation.createNotStarted("checkout.perform", observations)
        .lowCardinalityKeyValue("payment.method", cart.paymentMethod().name())
        .observe(() -> doCheckout(cart));
}
// Any exception here becomes an error tag on BOTH the metric and the span,
// automatically, because they are the same instrumentation event.`}
      </CodeBlock>

      <h2>Distributed Tracing: Spring Cloud Sleuth, Not Micrometer Tracing</h2>

      <p>
        Boot&apos;s own dependency BOM has nothing to say about tracing on the 2.x line — no
        Brave, no Zipkin reporter, no OpenTelemetry. On Boot 3 that same BOM pulls all three in
        directly:
      </p>

      <CodeBlock language="bash" title="Searching each BOM for any tracing-related managed dependency">
{`for v in 2.7.18 3.0.13; do
  echo "=== boot $v ==="
  curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/$v/spring-boot-dependencies-$v.pom \\
    | grep -oE '<(micrometer-tracing|brave|opentelemetry)\\.version>[^<]+'
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`=== boot 2.7.18 ===
   (no output — none of these properties exist in the BOM)
=== boot 3.0.13 ===
<brave.version>5.14.1
<micrometer-tracing.version>1.0.12
<opentelemetry.version>1.19.0`}
      </CodeBlock>

      <p>
        On Boot 2.7, tracing is an opt-in you bring from an entirely separate release train:{' '}
        <strong>Spring Cloud</strong>, via <code>spring-cloud-starter-sleuth</code> and, if you
        export to Zipkin, <code>spring-cloud-sleuth-zipkin</code>. It is versioned by the Spring
        Cloud BOM, not the Spring Boot BOM, and the two have to be paired correctly.
      </p>

      <CodeBlock language="xml" title="The dependency shape — a second BOM, not a starter Boot already manages">
{`<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-dependencies</artifactId>
      <version>2021.0.9</version>   <!-- the train that pairs with Boot 2.6.x/2.7.x -->
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-sleuth</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-sleuth-zipkin</artifactId>
  </dependency>
</dependencies>`}
      </CodeBlock>

      <CodeBlock language="properties" title="The properties that actually exist in spring-cloud-sleuth-zipkin's metadata">
{`spring.sleuth.sampler.probability=0.1   # 0.0-1.0. 1.0 in dev, a fraction in prod.
spring.sleuth.sampler.rate=100          # alternative: N traces/sec, good for low-traffic paths
spring.zipkin.base-url=http://zipkin:9411
spring.zipkin.service.name=orders-service`}
      </CodeBlock>

      <InfoBox variant="danger" title="Sleuth is not going anywhere it stayed to receive a fix">
        <p>
          Every claim about Sleuth&apos;s own support timeline in this section comes straight from
          Spring&apos;s project API, the same source the{' '}
          <a href="/springboot2/intro">intro lesson</a> used for Boot itself:
        </p>
        <CodeBlock language="bash" title="Ask the Spring project API">
{`curl -s https://api.spring.io/projects/spring-cloud-sleuth/generations \\
  | jq -r '._embedded.generations[]
           | [.name, .initialReleaseDate, .ossSupportEndDate, .commercialSupportEndDate,
              (.linkedGenerations["spring-boot"] // [] | join("/"))]
           | @tsv' \\
  | column -t`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output (run 2026-08-24)">
{`NAME    RELEASED    OSS_ENDS    COMMERCIAL_ENDS  LINKED SPRING BOOT
2.0.x   2018-03-31  2019-03-31  2020-06-30       2.0.x
2.1.x   2018-10-31  2019-10-31  2021-01-31       2.1.x
2.2.x   2019-11-30  2021-05-31  2022-08-31       2.2.x/2.3.x
3.0.x   2020-12-31  2022-05-31  2023-08-31       2.4.x/2.5.x
3.1.x   2021-12-31  2023-06-30  2029-06-30       2.6.x/2.7.x`}
        </CodeBlock>
        <p>
          Sleuth 3.1.x is the generation paired with Boot 2.6/2.7 — and notice its OSS and
          commercial end dates are <strong>identical</strong> to Boot 2.7&apos;s own, from the{' '}
          <a href="/springboot2/intro">intro lesson</a>&apos;s table. Broadcom bundles the support
          window for the paired Spring Cloud train together with Boot itself. There will be no 3.2
          — the project&apos;s own README says as much: &quot;the core of this project got moved
          to Micrometer Tracing.&quot; If your Boot 2 service traces requests, it depends on a
          library whose last release shipped in February 2024.
        </p>
      </InfoBox>

      <h2>Log Correlation: Verified Straight From the Jar</h2>

      <p>
        One thing Sleuth does that feels like magic until you read the bytecode: add it to the
        classpath, change no configuration, and log lines start looking like{' '}
        <code>INFO [orders-service,4bf92f3577b34da6,00f067aa0ba902b7] ... order placed</code>. The
        bracketed part is the service name, trace id and span id. Here is where that comes from —
        an <code>EnvironmentPostProcessor</code> that runs before your own configuration is even
        read:
      </p>

      <CodeBlock language="bash" title="Reading it out of spring-cloud-sleuth-autoconfigure-3.1.10.jar">
{`unzip -p spring-cloud-sleuth-autoconfigure-3.1.10.jar \\
  org/springframework/cloud/sleuth/autoconfig/TraceEnvironmentPostProcessor.class \\
  > TraceEnvironmentPostProcessor.class
javap -c -p -classpath . TraceEnvironmentPostProcessor`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output (trimmed to the relevant instructions)">
{`class org.springframework.cloud.sleuth.autoconfig.TraceEnvironmentPostProcessor
    implements org.springframework.boot.env.EnvironmentPostProcessor {

  public void postProcessEnvironment(ConfigurableEnvironment, SpringApplication);
    Code:
         9: ldc    #4   // String spring.sleuth.enabled
        11: ldc    #5   // String true
        21: ifeq   92    (skip the block below if sleuth is disabled)
        25: ldc    #8   // String spring.sleuth.default-logging-pattern-enabled
        27: ldc    #5   // String true
        37: ifeq   51    (skip if the default pattern is turned off)
        41: ldc    #9   // String logging.pattern.level
        43: ldc    #10  // String %5p [\${spring.zipkin.service.name:\${spring.application.name:}},%X{traceId:-},%X{spanId:-}]
        45: invokeinterface Map.put:(Object;Object;)Object;`}
      </CodeBlock>

      <p>
        In one paragraph: with <code>spring.sleuth.enabled=true</code> (the default once the
        starter is on the classpath) and{' '}
        <code>spring.sleuth.default-logging-pattern-enabled=true</code> (also the default), Sleuth
        sets <code>logging.pattern.level</code> to a Logback pattern that reads two SLF4J MDC keys
        — <code>traceId</code> and <code>spanId</code> — via the standard{' '}
        <code>%X{'{'}key{'}'}</code> accessor. It also populates those MDC keys itself, by
        decorating Brave&apos;s current-trace-context. Nothing in your code writes to MDC; the
        library does both halves.
      </p>

      <InfoBox variant="tip" title="The field names are the one thing that survives the migration">
        <p>
          Micrometer Tracing&apos;s SLF4J bridge on Boot 3/4 populates MDC under the{' '}
          <em>same</em> keys, <code>traceId</code> and <code>spanId</code> — see the main Boot
          section&apos;s{' '}
          <a href="/springboot/observability">Observability lesson</a>, whose Logback config
          includes exactly those two <code>includeMdcKeyName</code> entries. So a JSON log
          pipeline or a Kibana/Loki query built around those field names keeps working across the
          migration even though the mechanism producing them — a hand-rolled property from an
          <code>EnvironmentPostProcessor</code> versus a first-class bridge — is completely
          different underneath.
        </p>
      </InfoBox>

      <h2>Health, Exposure, and What Actually Stayed the Same</h2>

      <p>
        Everything about health indicators, readiness/liveness probe groups, and the default web
        exposure list (<code>health</code>, <code>info</code>) is unchanged in mechanism between
        Boot 2.2 and Boot 4 — Sleuth and the Observation API are the parts of this story that
        moved; Actuator&apos;s own health machinery did not. The{' '}
        <a href="/springboot2/actuator">next lesson</a> covers that machinery, plus the parts that{' '}
        <em>did</em> rename — <code>httptrace</code> &rarr; <code>httpexchanges</code>, the JMX
        exposure default, and the stricter <code>/env</code> sanitization — in full, with side by
        side output from both versions. It is not repeated here.
      </p>

      <h2>What Changes When You Migrate</h2>

      <CodeBlock language="text" title="The observability delta, end to end">
{`Metrics       Micrometer 1.9 (MeterRegistry/Counter/Timer/Gauge)
                  -> Micrometer 1.10+ (same types, same API — portable as-is)

Instrumentation  Two manual calls: Timer.record(...) AND tracer.nextSpan(...)
                  -> One call: Observation.createNotStarted(...).observe(...)

Tracing library  Spring Cloud Sleuth (Brave) + spring-cloud-sleuth-zipkin
                  -> Micrometer Tracing + micrometer-tracing-bridge-brave
                     (or -bridge-otel), built into Boot's own BOM

Config prefix    spring.sleuth.*  /  spring.zipkin.*
                  -> management.tracing.*  /  management.zipkin.tracing.*

Log correlation  Sleuth writes logging.pattern.level for you, reads MDC
                  traceId/spanId that Brave's decorator populates
                  -> Micrometer Tracing's SLF4J bridge populates the SAME
                     MDC keys; you still own the Logback pattern/encoder

Governing BOM    A second BOM (Spring Cloud) that must be version-paired
                 with your Boot version by hand
                  -> One BOM (Spring Boot itself)`}
      </CodeBlock>

      <p>
        None of this is optional busywork — it is the largest genuinely new capability in the
        whole 2&nbsp;&rarr;&nbsp;3 jump, not a rename with a find-and-replace fix. Budget it as
        its own piece of work, same as the{' '}
        <a href="/springboot2/javax">javax rename</a> or the{' '}
        <a href="/springboot2/data">Hibernate 5&nbsp;&rarr;&nbsp;6 change</a>, and see the{' '}
        <a href="/springboot2/migration">migration lesson</a> for where it sits in the overall
        sequence.
      </p>

      <InfoBox variant="success" title="Checklist for the observability migration">
        <ul>
          <li>
            <strong>Do not try to get the Observation API on Boot 2.7</strong> by overriding{' '}
            <code>micrometer.version</code>. Verified above: the autoconfiguration that wires it
            into Spring MVC and your HTTP clients is not in Boot 2.7&apos;s jar, at any Micrometer
            version.
          </li>
          <li>
            <strong>Inventory every place metrics and tracing are recorded separately</strong> —{' '}
            <code>Timer.record(...)</code> next to a hand-written{' '}
            <code>tracer.nextSpan(...)</code>. These collapse into one{' '}
            <code>Observation</code> call during the migration; find them first so the rewrite is
            planned, not discovered file by file.
          </li>
          <li>
            <strong>Confirm your Spring Cloud train is actually paired with your Boot version</strong>{' '}
            before touching anything — Sleuth 3.1.x pairs with Boot 2.6/2.7. An older Sleuth train
            against 2.7 is a second, unrelated compatibility problem.
          </li>
          <li>
            <strong>Grep dashboards and log queries for <code>traceId</code>/<code>spanId</code>
            field names</strong> before assuming they will keep working — they do, but verify it
            against your actual log pipeline rather than trusting that on faith.
          </li>
          <li>
            <strong>Do not let Sleuth&apos;s February 2024 last release slide.</strong> It is not
            maintained, and unlike Boot 2.7 itself there is no independent commercial-support
            purchase for Sleuth specifically — it rides on the same Broadcom subscription as Boot.
          </li>
          <li>
            <strong>Read the <a href="/springboot2/actuator">Actuator lesson</a> next</strong> for
            the endpoint-level renames this page deliberately left out.
          </li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="A teammate wants Micrometer's Observation API on your Spring Boot 2.7.18 service without upgrading Boot. Their plan: set <micrometer.version>1.12.5</micrometer.version> in the POM and start using ObservationRegistry. What actually happens?"
        options={[
          "It works exactly like Boot 3 — Observation calls produce both metrics and spans",
          "The build fails immediately because Micrometer 1.12 requires Java 17",
          "The jars resolve and the code compiles, but Spring MVC, RestTemplate/WebClient and JDBC never get instrumented automatically, because that auto-configuration lives in spring-boot-actuator-autoconfigure, and Boot 2.7's copy has zero ObservationAutoConfiguration classes",
          "Spring Boot's dependency management blocks any micrometer.version override above 1.9.x"
        ]}
        correctIndex={2}
        explanation="Micrometer's Java artifacts don't require Java 17, and Boot's dependency management explicitly allows overriding a managed version, so options 2 and 4 are both invented. The jar resolves fine — that's exactly what makes this trap convincing. What you don't get is the plumbing: verified directly by listing ObservationAutoConfiguration classes inside spring-boot-actuator-autoconfigure for both releases, Boot 2.7.18's jar has zero and Boot 3.0.13's has five. That autoconfiguration is what wires an ObservationRegistry into the web filter chain, the HTTP clients and JDBC — without it you have a registry bean and nothing feeding it. Raising micrometer.version alone gets you a newer jar with no autoconfiguration behind it; the Observation API is a Boot-3-and-up capability, not a dependency-version toggle."
      />

      <InteractiveChallenge
        question="You open a Boot 2.7.18 service's logs and see 'INFO [orders-service,4bf92f3577b34da6,00f067aa0ba902b7] ... order placed' — nobody wrote a custom Logback pattern and nobody calls MDC.put anywhere in the codebase. Where does the bracketed part come from?"
        options={[
          "Boot 2.7's default Logback starter always adds trace correlation to console output",
          "spring-cloud-starter-sleuth's TraceEnvironmentPostProcessor sets logging.pattern.level to a pattern reading MDC keys traceId/spanId (via %X{key}), and separately populates those same MDC keys by decorating Brave's trace context — both defaults, both on once the starter is present",
          "The Actuator /loggers endpoint was used to configure this pattern at runtime",
          "It is coming from the Observation API's default logging integration"
        ]}
        correctIndex={1}
        explanation="Verified by disassembling TraceEnvironmentPostProcessor.class from spring-cloud-sleuth-autoconfigure-3.1.10.jar: with spring.sleuth.enabled=true and spring.sleuth.default-logging-pattern-enabled=true — both defaults once the starter is on the classpath — the postProcessEnvironment method sets logging.pattern.level to a literal string containing %X{traceId:-} and %X{spanId:-}, the standard SLF4J/Logback MDC accessor syntax. That only produces real values because Sleuth also decorates Brave's CurrentTraceContext to write those same two MDC keys on every span. Option 1 is wrong because plain Logback has no concept of a trace id — it needs something populating MDC, which is Sleuth's job, not the logging framework's. Option 4 doesn't apply here: the Observation API doesn't exist in Micrometer 1.9, which is what Boot 2.7.18 ships. Option 3 describes a real endpoint (runtime log level changes) that has nothing to do with the pattern layout."
      />
    </LessonLayout>
  );
}

export default SpringBoot2Observability;
