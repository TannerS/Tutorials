import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Boot4() {
  return (
    <LessonLayout
      title="Boot 4 Novelties"
      sectionId="springboot"
      lessonIndex={13}
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
          Watch out for <em>pinning</em>: <code>synchronized</code> blocks and native
          calls pin the virtual thread to its carrier and defeat the point. Replace with
          <code>ReentrantLock</code> where it matters.
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
- Container density: 100x memory reduction per instance
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

      <h2>What Boot 4 Adds Over Boot 3</h2>
      <p>
        Boot 4 (2026) is more of a refinement than a revolution:
      </p>
      <ul>
        <li>
          <strong>Consolidated null-safety.</strong> Broader <code>@NullMarked</code>
          packages and improved IDE checks.
        </li>
        <li>
          <strong>More Kotlin coroutines integration</strong> in reactive contexts.
        </li>
        <li>
          <strong>Bean-registration API refinements</strong> (programmatic bean
          registration is cleaner).
        </li>
        <li>
          <strong>Structured concurrency helpers</strong> as it stabilizes in the JDK.
        </li>
        <li>
          Continued push on native images and AOT hint coverage.
        </li>
      </ul>

      <InfoBox variant="note" title="Version pinning in practice">
        <p>
          Most enterprise services target the Spring Boot version their organization
          standardizes on — often the latest LTS. Boot 3.x remains supported alongside
          Boot 4. All the patterns in this section work on both unless explicitly noted
          as Spring 6.1+.
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
        explanation="Enabling virtual threads (Java 21 + Boot 3.2+) lets the servlet container spin up a fresh virtual thread per request. Because virtual threads are cheap and scheduler-multiplexed onto a small number of carrier threads, waiting on I/O costs almost nothing. Bumping the platform-thread pool works up to ~500 threads; virtual threads scale into the tens of thousands. Just remember to replace 'synchronized' blocks with 'ReentrantLock' to avoid pinning."
      />
    </LessonLayout>
  );
}
