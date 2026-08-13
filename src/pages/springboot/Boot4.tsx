import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Boot4() {
  return (
    <LessonLayout
      title="Boot 4 Novelties"
      sectionId="springboot"
      lessonIndex={14}
      prev={{ path: '/springboot/aop', label: 'AOP & Interceptors' }}
      next={{ path: '/springboot/observability', label: 'Observability' }}
    >
      <h2>Spring 6 and Boot 3/4 in a Sentence</h2>
      <p>
        Spring 6 (bundled by Boot 3/4) is the biggest release since Spring 3: Jakarta EE 9+
        (<code>javax</code> → <code>jakarta</code>), Java 17 minimum, RFC 7807
        Problem Details as first-class, a new declarative HTTP client, an Observation API
        that unifies metrics + tracing, virtual thread support, and native compilation with
        GraalVM AOT. This page is a tour of the pieces you'll actually use day-to-day.
      </p>

      <h2>RestClient — The Modern Synchronous HTTP Client</h2>
      <p>
        <code>RestClient</code> (Spring 6.1+) is the successor to <code>RestTemplate</code>.
        Same programming model (synchronous), but a fluent, WebClient-like API.
      </p>
      <CodeBlock language="java" title="RestClient in practice">
{`@Configuration
public class HttpConfig {

    @Bean
    public RestClient catalogClient(RestClient.Builder builder) {
        return builder
            .baseUrl("https://catalog.example.com")
            .defaultHeader("Accept", "application/json")
            .defaultStatusHandler(HttpStatusCode::is5xxServerError,
                (req, res) -> { throw new UpstreamException(res.getStatusCode()); })
            .requestInterceptor((req, body, ex) -> {
                req.getHeaders().set("X-Trace-Id", TracingContext.current().traceId());
                return ex.execute(req, body);
            })
            .build();
    }
}

@Service
public class CatalogService {
    private final RestClient client;
    public CatalogService(RestClient catalogClient) { this.client = catalogClient; }

    public ProductDto get(String id) {
        return client.get()
            .uri("/products/{id}", id)
            .retrieve()
            .body(ProductDto.class);
    }

    public Page<ProductDto> search(String q, int page, int size) {
        return client.get()
            .uri(uri -> uri.path("/products")
                .queryParam("q", q).queryParam("page", page).queryParam("size", size)
                .build())
            .retrieve()
            .body(new ParameterizedTypeReference<>() { });
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Migration from RestTemplate is a one-hour job">
        <p>
          Existing <code>RestTemplate</code> code works forever — it's not being removed —
          but every new call site should be <code>RestClient</code>. The APIs map almost
          1:1 with a nicer builder. Interceptors, message converters, and status handlers
          all carry over conceptually.
        </p>
      </InfoBox>

      <h2>@HttpExchange — Declarative HTTP Clients</h2>
      <p>
        Define an interface with mapping annotations; Spring generates the implementation.
        Same idea as Feign/Retrofit but built into Spring.
      </p>
      <CodeBlock language="java" title="A declarative catalog client">
{`public interface CatalogApi {

    @GetExchange("/products/{id}")
    ProductDto get(@PathVariable String id);

    @GetExchange("/products")
    Page<ProductDto> search(@RequestParam String q,
                            @RequestParam int page,
                            @RequestParam int size);

    @PostExchange("/products")
    ProductDto create(@RequestBody CreateProduct payload);

    @PutExchange("/products/{id}")
    void update(@PathVariable String id, @RequestBody UpdateProduct payload);

    @DeleteExchange("/products/{id}")
    void delete(@PathVariable String id);
}

@Configuration
class CatalogClientConfig {

    @Bean
    public CatalogApi catalogApi(RestClient.Builder builder) {
        RestClient client = builder.baseUrl("https://catalog.example.com").build();
        return HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(client))
            .build()
            .createClient(CatalogApi.class);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to reach for declarative clients">
        <p>
          For any external service where you consume 3+ endpoints, declarative clients
          are cleaner than repeating <code>client.get().uri()...</code>. They also test
          well — mock the interface, done. Below that threshold, <code>RestClient</code>
          direct is fine.
        </p>
      </InfoBox>

      <h2>ProblemDetail — RFC 7807 as First-Class</h2>
      <p>
        Covered in depth in the Error Handling lesson. The point here: Boot 3+ ships
        <code>ProblemDetail</code> support out of the box. Enable it and Spring MVC
        exceptions automatically produce
        <code>application/problem+json</code> responses without you writing a handler.
      </p>
      <CodeBlock language="yaml" title="Enable built-in problem details">
{`spring:
  mvc:
    problemdetails:
      enabled: true`}
      </CodeBlock>

      <h2>Virtual Threads — Java 21 in Spring</h2>
      <p>
        A one-line change turns your Spring MVC dispatcher into a virtual-thread executor,
        which is a big deal for I/O-bound services (most Spring MVC apps).
      </p>
      <CodeBlock language="yaml" title="Enable virtual threads for MVC + scheduling">
{`spring:
  threads:
    virtual:
      enabled: true`}
      </CodeBlock>
      <CodeBlock language="java" title="Or configure directly">
{`@Bean
public TomcatProtocolHandlerCustomizer<?> protocolHandlerCustomizer() {
    return protocolHandler -> protocolHandler.setExecutor(
        Executors.newVirtualThreadPerTaskExecutor());
}

@Bean
public AsyncTaskExecutor applicationTaskExecutor() {
    return new TaskExecutorAdapter(Executors.newVirtualThreadPerTaskExecutor());
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Virtual threads are for I/O, not for CPU">
        <p>
          Virtual threads make it cheap to hold thousands of threads simultaneously
          <em>waiting</em> on I/O — perfect for a service that calls other services,
          runs SQL, or reads Kafka. They don't magically make CPU-bound work faster; use
          platform threads or the ForkJoin pool for parallel compute.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <em>Pinning</em> advice depends on your JDK. Through Java 23,{' '}
          <code>synchronized</code> held across a blocking call pinned the virtual thread to
          its carrier — the origin of the &ldquo;replace <code>synchronized</code> with{' '}
          <code>ReentrantLock</code>&rdquo; rule. <strong>Java 24&apos;s JEP 491 removed
          that limitation</strong>, so on Java 24/25 only native (JNI) frames and class
          initializers still pin. Either way, don&apos;t hold a lock across a downstream
          call: it serialises every caller regardless of pinning.
        </p>
      </InfoBox>

      <h2>Observation API — One Instrumentation Point, Metrics + Tracing</h2>
      <p>
        Micrometer's Observation API replaces the old split between metrics and tracing.
        You write one <code>Observation</code>; both pipelines get data.
      </p>
      <CodeBlock language="java" title="Observation-instrumented method">
{`@Service
public class ReportService {
    private final ObservationRegistry registry;
    public ReportService(ObservationRegistry registry) { this.registry = registry; }

    public byte[] generate(ReportRequest req) {
        return Observation.createNotStarted("report.generate", registry)
            .lowCardinalityKeyValue("format", req.format().name())
            .highCardinalityKeyValue("customerId", req.customerId().toString())
            .observe(() -> renderer.render(req));
    }
}`}
      </CodeBlock>
      <p>
        Instrumentation library adapters bridge this to Micrometer (metrics), OpenTelemetry
        (spans), and Boot's Actuator dashboards. See the Observability lesson.
      </p>

      <h2>Structured Concurrency (Java 21+, Preview)</h2>
      <p>
        Java 21 previewed <code>StructuredTaskScope</code> and Java 23 continues to iterate.
        The idea: fork multiple subtasks, join them, cancel siblings if one fails — all
        with lexical scoping and structured error handling. Spring doesn't have direct
        support yet, but you can use it inside services.
      </p>
      <CodeBlock language="java" title="Structured concurrency (Java 21 preview API)">
{`@Service
public class OrderEnrichmentService {

    public EnrichedOrder enrich(UUID orderId) throws InterruptedException {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            var order    = scope.fork(() -> orders.byId(orderId));
            var customer = scope.fork(() -> customers.forOrder(orderId));
            var payment  = scope.fork(() -> payments.forOrder(orderId));

            scope.join();
            scope.throwIfFailed();

            return new EnrichedOrder(order.get(), customer.get(), payment.get());
        }
    }
}`}
      </CodeBlock>
      <InfoBox variant="warning" title="This API was restructured in Java 25">
        <p>
          The <code>ShutdownOnFailure</code> subclass form above is the Java 21&ndash;24 preview
          API and requires <code>--enable-preview</code>. Java 25 finalised{' '}
          <code>StructuredTaskScope</code> with a different shape:{' '}
          <code>StructuredTaskScope.open(Joiner.allSuccessfulOrThrow())</code>, where{' '}
          <code>join()</code> returns the result and throws on failure. If your service targets
          Java 25 use that form — see the Java Concurrency lesson for both side by side.
        </p>
      </InfoBox>

      <h2>AOT and Native Image (GraalVM)</h2>
      <p>
        Boot 3+ supports ahead-of-time compilation to a native binary via GraalVM.
        Startup drops from ~5 seconds to ~50 milliseconds; memory from hundreds of MB to
        tens. The trade: reflection and dynamic proxies must be declared upfront (Spring
        does most of this for you), some libraries don't work, and build times are longer.
      </p>
      <CodeBlock language="text" title="Native image at a glance">
{`# Build (requires GraalVM installed)
./mvnw -Pnative native:compile

# What Spring does behind the scenes
- Runs an AOT processing pass that discovers your reflection, resources, and proxies.
- Emits hints (spring-aot-generated) so GraalVM can pre-solve dynamic behavior.
- Third-party libraries with hint files "just work"; others may need manual hints.

# When to use it
- Serverless / lambda deployment where startup latency matters
- Container density: roughly 5-10x lower resident memory per instance
- Command-line utilities where JVM warmup is a tax

# When not to
- Long-running services on real VMs: JIT eventually beats native for throughput
- Anything relying on reflection-heavy libraries without native support`}
      </CodeBlock>

      <h2>Removed / Renamed in Boot 3+</h2>
      <CodeBlock language="text" title="Migration cheatsheet from Boot 2 → 3+">
{`javax.*                    -> jakarta.*
javax.persistence          -> jakarta.persistence
javax.servlet              -> jakarta.servlet
javax.validation           -> jakarta.validation

WebSecurityConfigurerAdapter (removed)
                           -> SecurityFilterChain @Bean
                              (see Security lesson)

@MockBean (deprecated in 3.4)
                           -> @MockitoBean (Spring 6.2)

RestTemplate (still works, not removed)
                           -> RestClient for new code

Boot 2 authorizeRequests(auth -> auth.antMatchers(...))
                           -> authorizeHttpRequests(a -> a.requestMatchers(...))

Micrometer Tracing replaces Sleuth
Micrometer Observation API replaces manual metric-only instrumentation`}
      </CodeBlock>

      <h2>What Boot 4 Actually Changes Over Boot 3</h2>
      <p>
        Boot 4 (built on Spring Framework 7) is not a <code>javax</code>→<code>jakarta</code>-scale
        rewrite, but it is more than a version bump. These are the changes that affect real code.
      </p>

      <h3>1. The baseline moved</h3>
      <CodeBlock language="text" title="Platform requirements">
{`Java          17 minimum (21+ strongly recommended — virtual threads, and the
              runtime the framework is tuned against)
Jakarta EE    EE 11 APIs (Servlet 6.1, JPA 3.2, Bean Validation 3.1)
Spring        Framework 7.0
Jackson       Jackson 3 is the new baseline — the package root changed from
              com.fasterxml.jackson to tools.jackson, and ObjectMapper is now
              immutable and built via JsonMapper.builder(). Boot still supports
              Jackson 2 on the classpath during migration, but new code should
              target 3.
Kotlin        Kotlin 2.x`}
      </CodeBlock>

      <h3>2. The module layout was split apart</h3>
      <p>
        This is the change most likely to touch your build file. In Boot 3, essentially every
        auto-configuration lived in one giant <code>spring-boot-autoconfigure</code> jar. Boot 4
        breaks that into per-technology modules, so an app pulls in auto-configuration only for
        what it actually uses. Starters mostly shield you from this — but if you depended on
        <code>spring-boot-autoconfigure</code> directly, or wrote your own starter, you will need
        to update coordinates.
      </p>
      <CodeBlock language="text" title="Module restructure">
{`Boot 3:  org.springframework.boot:spring-boot-autoconfigure   (everything)

Boot 4:  org.springframework.boot:spring-boot-web-server
         org.springframework.boot:spring-boot-webmvc
         org.springframework.boot:spring-boot-data-jpa
         org.springframework.boot:spring-boot-security
         ...one module per technology

Also removed: the legacy META-INF/spring.factories mechanism for
auto-configuration. Everything now uses
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
(which has been the preferred form since Boot 2.7).`}
      </CodeBlock>

      <h3>3. Null-safety standardised on JSpecify</h3>
      <p>
        Spring&apos;s home-grown <code>org.springframework.lang.Nullable</code> is replaced by the
        vendor-neutral <strong>JSpecify</strong> annotations. Packages are{' '}
        <code>@NullMarked</code> by default, meaning every type is non-null unless explicitly
        marked <code>@Nullable</code>. The practical payoff is that IntelliJ and the Kotlin
        compiler can now flag a null-safety violation against Spring APIs at compile time instead
        of at runtime.
      </p>
      <CodeBlock language="java" title="JSpecify null-marking">
{`// package-info.java — everything in this package is non-null by default
@NullMarked
package com.example.orders;

import org.jspecify.annotations.NullMarked;

// Now @Nullable is the exception that stands out, and tooling enforces it.
import org.jspecify.annotations.Nullable;

public interface OrderRepository {
    Order require(UUID id);              // guaranteed non-null
    @Nullable Order findRaw(UUID id);    // explicitly may be null
}`}
      </CodeBlock>

      <h3>4. API versioning is built into the framework</h3>
      <p>
        Previously every team hand-rolled versioning with URL prefixes or a custom{' '}
        <code>RequestCondition</code>. Framework 7 makes the version a first-class mapping
        attribute, resolvable from a header, a query parameter, a media type, or the path.
      </p>
      <CodeBlock language="java" title="Versioned endpoints">
{`@Configuration
public class ApiVersionConfig implements WebMvcConfigurer {
    @Override
    public void configureApiVersioning(ApiVersionConfigurer configurer) {
        configurer.useRequestHeader("X-API-Version")
                  .addSupportedVersions("1.0", "1.1", "2.0");
    }
}

@RestController
@RequestMapping("/orders")
public class OrderController {

    @GetMapping(value = "/{id}", version = "1.0")
    OrderV1 getV1(@PathVariable UUID id) { ... }

    // "1.1+" means this handles 1.1 and every later version until one
    // explicitly supersedes it — no duplicated mappings per release.
    @GetMapping(value = "/{id}", version = "1.1+")
    OrderV2 getV2(@PathVariable UUID id) { ... }
}`}
      </CodeBlock>

      <h3>5. Resilience annotations moved into core Spring</h3>
      <p>
        Retry and concurrency limiting no longer require the separate Spring Retry project. The
        <code>org.springframework.resilience</code> package ships <code>@Retryable</code> and{' '}
        <code>@ConcurrencyLimit</code> as core, AOP-backed annotations.
      </p>
      <InfoBox variant="warning" title="This is NOT the Spring Retry API — the attributes differ">
        <p>
          Core Spring&apos;s <code>@Retryable</code> and the long-standing Spring Retry
          project&apos;s <code>@Retryable</code> have the same simple name and different members.
          Importing the wrong one compiles and then behaves unexpectedly. The differences that
          catch people:
        </p>
        <ul>
          <li>
            Core Spring uses <code>maxRetries</code> (retries <em>after</em> the first call);
            Spring Retry uses <code>maxAttempts</code> (total calls, including the first).
          </li>
          <li>
            Core Spring uses <code>includes</code>/<code>excludes</code>; Spring Retry uses{' '}
            <code>retryFor</code>/<code>noRetryFor</code>.
          </li>
          <li>
            Backoff is flat attributes (<code>delay</code>, <code>multiplier</code>,{' '}
            <code>jitter</code>, <code>maxDelay</code>) in core Spring; Spring Retry nests them in{' '}
            <code>@Backoff</code>.
          </li>
          <li>
            <strong>Core Spring has no <code>@Recover</code>.</strong> When retries are exhausted
            the last exception simply propagates — catch it at the call site, or use a{' '}
            <code>MethodRetryEvent</code> listener for observability. <code>@Recover</code>{' '}
            fallback methods remain a Spring Retry feature only.
          </li>
        </ul>
      </InfoBox>
      <CodeBlock language="java" title="Built-in retry and concurrency limiting">
{`@EnableResilientMethods            // switches on the supporting AOP infrastructure
@Configuration
class ResilienceConfig { }

@Service
public class PaymentGateway {

    // NOTE the attribute is maxRetries, NOT maxAttempts (that is Spring Retry).
    // maxRetries counts retries AFTER the first call: 3 here = up to 4 calls.
    // Defaults: maxRetries = 3, delay = 1000ms, multiplier = 1.0, retry on ANY
    // exception — so always narrow it with includes/excludes.
    @Retryable(includes = TransientGatewayException.class,
               maxRetries = 3,
               delay = 200, multiplier = 2.0, maxDelay = 5000,
               jitter = 50)          // spreads retries, avoids a thundering herd
    public Receipt charge(Payment payment) {
        return client.post(payment);
    }

    // Cap in-flight calls to a fragile downstream, without a thread pool.
    @ConcurrencyLimit(10)
    public Report generate(ReportRequest req) { ... }

    // @ConcurrencyLimit(1) gives you lock-like mutual exclusion on a method.
}`}
      </CodeBlock>

      <h3>6. Programmatic bean registration with BeanRegistrar</h3>
      <p>
        <code>BeanRegistrar</code> gives you a supported, AOT-friendly way to register beans
        conditionally in code — replacing the reflection-heavy{' '}
        <code>BeanDefinitionRegistryPostProcessor</code> pattern, which native images struggled
        with.
      </p>
      <CodeBlock language="java" title="BeanRegistrar">
{`class TenantRegistrar implements BeanRegistrar {
    @Override
    public void register(BeanRegistry registry, Environment env) {
        for (String tenant : env.getRequiredProperty("app.tenants").split(",")) {
            registry.registerBean("dataSource-" + tenant, DataSource.class,
                spec -> spec.supplier(ctx -> buildDataSource(tenant)));
        }
    }
}

@Configuration
@Import(TenantRegistrar.class)
class TenantConfig { }`}
      </CodeBlock>

      <h3>7. Declarative HTTP clients get auto-registration</h3>
      <p>
        The <code>@HttpExchange</code> interfaces shown earlier no longer need a hand-written{' '}
        <code>HttpServiceProxyFactory</code> <code>@Bean</code> each — Boot 4 can discover and
        register them, with base URLs bound from configuration properties.
      </p>
      <CodeBlock language="java" title="Auto-registered HTTP service clients">
{`@Configuration
@ImportHttpServices(group = "catalog", types = CatalogApi.class)
class HttpClientConfig { }`}
      </CodeBlock>
      <CodeBlock language="yaml" title="...with the base URL in configuration">
{`spring:
  http:
    client:
      service:
        group:
          catalog:
            base-url: https://catalog.example.com`}
      </CodeBlock>

      <InfoBox variant="note" title="Migration reality check">
        <p>
          Boot 3.x remains supported alongside Boot 4, and almost every pattern in this section
          works on both. The two upgrade steps that actually take time are the{' '}
          <strong>Jackson 3 package rename</strong> (a find-and-replace across imports, plus any
          code that mutated a shared <code>ObjectMapper</code> after construction) and the{' '}
          <strong>module split</strong> if you maintain a custom starter. Everything else —
          JSpecify, API versioning, <code>@Retryable</code>, <code>BeanRegistrar</code> — is
          opt-in, so you can upgrade first and adopt them incrementally.
        </p>
      </InfoBox>

      <h2>Novelties Checklist</h2>
      <InfoBox variant="success" title="Signs your Spring code targets the modern stack">
        <ul>
          <li>New HTTP call sites use <code>RestClient</code>, not
              <code>RestTemplate</code>.</li>
          <li>3+ endpoint external APIs are wrapped as <code>@HttpExchange</code> interfaces.</li>
          <li><code>ProblemDetail</code> is on for automatic RFC 7807 error responses.</li>
          <li>Virtual threads are enabled for I/O-bound web workloads.</li>
          <li>Cross-cutting instrumentation uses the Observation API, not raw
              <code>Timer</code> + <code>Span</code> pairs.</li>
          <li>Test doubles use <code>@MockitoBean</code>, not deprecated
              <code>@MockBean</code>.</li>
          <li>All packages import <code>jakarta.*</code> — no lingering
              <code>javax.*</code>.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Your Spring MVC app makes 50 downstream HTTP calls per request and is thread-pool bound. What single Boot 3+ setting most helps?"
        options={[
          "spring.datasource.hikari.maximum-pool-size: 200",
          "server.tomcat.threads.max: 500",
          "spring.threads.virtual.enabled: true — virtual threads let the servlet container hold thousands of concurrent requests waiting on I/O without pinning platform threads",
          "management.metrics.enable.jvm: true"
        ]}
        correctIndex={2}
        explanation="Enabling virtual threads (Java 21 + Boot 3.2+) lets the servlet container spin up a fresh virtual thread per request. Because virtual threads are cheap and scheduler-multiplexed onto a small number of carrier threads, waiting on I/O costs almost nothing. Bumping the platform-thread pool works up to ~500 threads; virtual threads scale into the tens of thousands. One caveat worth stating precisely: on Java 21-23 a 'synchronized' block held across I/O pins the virtual thread to its carrier, so prefer 'ReentrantLock' there; Java 24's JEP 491 removed that restriction, leaving only native/JNI and class-initializer frames as pin sites."
      />
    </LessonLayout>
  );
}
