import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideBoot4() {
  return (
    <PosterLayout
      accent="emerald"
      eyebrow="Spring Boot 4 · Field Reference"
      title="Spring Boot 4 Novelties"
      tagline="RestClient, declarative HTTP clients, virtual threads, and everything renamed since Boot 2 — condensed for offline study."
      meta={['Boot 4', '11 features']}
      footerLabel="Personal study reference — Spring Boot 4"
      pageLabel="Spring Field Guide · Boot 4 Novelties"
      prev={{ path: '/spring-field-guide/kafka-observability', label: 'Kafka & Observability' }}
      next={{ path: '/spring-field-guide/gotchas', label: 'Gotchas & Pitfalls' }}
    >
      <PosterCard
        glyph="Rc"
        title={<>RestClient<span className="dim"> — replaces RestTemplate</span></>}
        language="java"
        code={`@Bean
public RestClient catalogClient(RestClient.Builder builder) {
    return builder
        .baseUrl("https://catalog.example.com")
        .defaultHeader("Accept", "application/json")
        .build();
}

ProductDto p = client.get()
    .uri("/products/{id}", id)
    .retrieve()
    .body(ProductDto.class);`}
        caption="RestClient (Spring 6.1+) is synchronous like RestTemplate but with a fluent, WebClient-like builder. RestTemplate still works; new call sites should use RestClient."
      />

      <PosterCard
        glyph="Hx"
        title={<>@HttpExchange<span className="dim"> — declarative clients</span></>}
        language="java"
        code={`public interface CatalogApi {
    @GetExchange("/products/{id}")
    ProductDto get(@PathVariable String id);

    @PostExchange("/products")
    ProductDto create(@RequestBody CreateProduct payload);
}

CatalogApi api = HttpServiceProxyFactory
    .builderFor(RestClientAdapter.create(client))
    .build()
    .createClient(CatalogApi.class);`}
        caption="Define an interface with mapping annotations; Spring generates the implementation — same idea as Feign, built in. Worth it once you consume 3+ endpoints on a service."
      />

      <PosterCard
        glyph="Pd"
        title={<>ProblemDetail<span className="dim"> — RFC 7807 built-in</span></>}
        language="yaml"
        code={`spring:
  mvc:
    problemdetails:
      enabled: true

# Now unhandled Spring MVC exceptions automatically
# produce application/problem+json — no handler needed.`}
        caption="Boot 3+ ships ProblemDetail out of the box. Flip this flag and framework exceptions get a standard RFC 7807 body without writing a @RestControllerAdvice."
      />

      <PosterCard
        glyph="Vt"
        title={<>Virtual threads<span className="dim"> — one-line enable</span></>}
        language="yaml"
        code={`spring:
  threads:
    virtual:
      enabled: true

# Turns the MVC dispatcher into a virtual-thread executor —
# big win for I/O-bound services (most Spring MVC apps).`}
        caption="A single property lets the servlet container hold thousands of concurrent requests waiting on I/O. Doesn't speed up CPU-bound work — that still wants platform threads."
      />

      <PosterCard
        glyph="Pn"
        title={<>Virtual thread pinning<span className="dim"> — JDK-dependent</span></>}
        language="java"
        code={`// Java 21-23: synchronized pins the vthread during I/O.
public synchronized void inc() {
    externalCall();   // pinned — carrier can't be reused
    count++;
}

// Java 24+ (JEP 491): synchronized unmounts fine.
// Remaining pin sites: native/JNI, class initializers.

// Portable fix — keep I/O outside the lock entirely.
externalCall();
count.incrementAndGet();`}
        caption="The familiar 'replace synchronized with ReentrantLock' rule applies to Java 21-23; JEP 491 removed monitor pinning in Java 24. Check your target JDK before citing it — and note that holding a lock across a downstream call is a throughput problem either way."
      />

      <PosterCard
        glyph="Ob"
        title={<>Observation API<span className="dim"> — metrics + tracing</span></>}
        language="java"
        code={`public byte[] generate(ReportRequest req) {
    return Observation.createNotStarted("report.generate", registry)
        .lowCardinalityKeyValue("format", req.format().name())
        .highCardinalityKeyValue("customerId", req.customerId().toString())
        .observe(() -> renderer.render(req));
}`}
        caption="Micrometer's Observation API replaces the old split between metrics and tracing — one instrumentation call feeds both Micrometer meters and OpenTelemetry spans."
      />

      <PosterCard
        glyph="Sc"
        title={<>Structured concurrency<span className="dim"> (Java 21+ preview)</span></>}
        language="java"
        code={`public EnrichedOrder enrich(UUID orderId) throws InterruptedException {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        var order    = scope.fork(() -> orders.byId(orderId));
        var customer = scope.fork(() -> customers.forOrder(orderId));

        scope.join();
        scope.throwIfFailed();
        return new EnrichedOrder(order.get(), customer.get());
    }
}`}
        caption="Forks subtasks in a lexical scope; if one fails, siblings are cancelled automatically. Spring has no direct integration yet — you use it inside services as plain Java."
      />

      <PosterCard
        glyph="Na"
        title={<>Native image<span className="dim"> (GraalVM AOT)</span></>}
        language="text"
        code={`./mvnw -Pnative native:compile

Startup: ~5s -> ~50ms.  Memory: hundreds of MB -> tens.
Use for: serverless/lambda, container density, CLI tools.
Skip for: long-running VM services (JIT wins on throughput
long-term), reflection-heavy libs without native support.`}
        caption="Boot's AOT processing pass discovers your reflection, resources, and proxies and emits hints so GraalVM can precompute what would normally be dynamic."
      />

      <PosterCard
        glyph="Mg"
        title={<>Boot 2 to Boot 3/4 renames<span className="dim"></span></>}
        language="text"
        code={`javax.*                       -> jakarta.*
WebSecurityConfigurerAdapter  -> SecurityFilterChain @Bean
@MockBean (deprecated 3.4,    -> @MockitoBean (6.2+)
           REMOVED in Boot 4)
RestTemplate (not removed)    -> RestClient for new code
antMatchers(...)              -> requestMatchers(...)
Sleuth                        -> Micrometer Tracing`}
        caption="The single page worth memorizing before touching a Boot 2 codebase — every one of these silently compiles-but-warns or outright breaks on upgrade."
      />

      <PosterCard
        glyph="B4"
        title={<>What Boot 4 adds over Boot 3<span className="dim"></span></>}
        language="text"
        code={`- Consolidated null-safety: broader @NullMarked packages
- Deeper Kotlin coroutines integration (reactive contexts)
- Cleaner programmatic bean-registration API
- Structured concurrency helpers as the JDK API stabilizes
- Continued native-image / AOT hint coverage`}
        caption="Boot 4 (2026) is a refinement, not a revolution — most patterns on this page work identically on Boot 3.x, which remains supported alongside it."
      />

      <PosterCard
        glyph="Se"
        title={<>Platform baseline<span className="dim"> — which Framework ships with which Boot</span></>}
        language="text"
        code={`Boot 3.x  ->  Spring Framework 6.x  |  Jakarta EE 9+
Boot 4.x  ->  Spring Framework 7.0  |  Jakarta EE 11
                                        (Servlet 6.1, JPA 3.2)

Both: Java 17 MINIMUM (Java 21+ to use virtual threads)
Boot 4 also moves to Jackson 3 (com.fasterxml.jackson
-> tools.jackson) and Kotlin 2.x.`}
        caption="Boot 3 and Boot 4 are built on DIFFERENT Framework majors — 6 and 7 respectively. The JDK floor is 17 for both, but spring.threads.virtual.enabled needs Java 21."
      />

      <PosterQuickRef
        title="Boot 4 at a glance"
        rows={[
          { need: 'New synchronous HTTP call site', answer: 'RestClient, not RestTemplate' },
          { need: '3+ endpoint external API', answer: '@HttpExchange declarative interface' },
          { need: 'Standard error body', answer: 'spring.mvc.problemdetails.enabled: true' },
          { need: 'Scale I/O-bound MVC app', answer: 'spring.threads.virtual.enabled: true' },
          { need: 'Avoid vthread pinning (Java 21-23)', answer: 'Keep I/O outside the lock; ReentrantLock over synchronized' },
          { need: 'Avoid vthread pinning (Java 24+)', answer: 'Mostly solved by JEP 491 — only native/JNI frames pin' },
          { need: 'One call, metrics + tracing', answer: 'Observation API' },
          { need: 'Fork/join with auto-cancel', answer: 'StructuredTaskScope (final in Java 25; preview 21-24)' },
          { need: 'Fast cold start', answer: 'GraalVM native image via ./mvnw -Pnative' },
          { need: 'Test double bean', answer: '@MockitoBean — @MockBean was REMOVED in Boot 4' },
        ]}
      />
    </PosterLayout>
  );
}
