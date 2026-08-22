import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Cheatsheet() {
  return (
    <LessonLayout
      title="📋 Spring Boot Cheat Sheet"
      sectionId="springboot"
      lessonIndex={18}
      prev={{ path: '/springboot/resilience', label: 'Resilience4j & Circuit Breakers' }}
      next={null}
    >
      <h2>Startup Failure Triage</h2>
      <CodeBlock language="text" title="Read the Description/Action block, not the stack trace">
{`"required a bean of type X that could not be found"
    -> X isn't annotated, OR it lives outside the package tree under your
       @SpringBootApplication class (component scan never saw it).

"required a single bean, but 2 were found"  (lists both)
    -> @Primary on the default, or @Qualifier at the injection point.

"Port 8080 was already in use"
    -> a previous run. lsof -i :8080, or --server.port=8081

"...form a cycle"  (with an ASCII diagram of the loop)
    -> extract the shared concern into a third bean. Don't set
       spring.main.allow-circular-references=true.

"No property 'emial' found for type 'Customer'"
    -> typo in a derived query method name; the message lists valid ones.

"There is no PasswordEncoder mapped for the id \\"null\\""
    -> stored hashes lack the {bcrypt} prefix DelegatingPasswordEncoder needs.

"Transaction silently rolled back because it has been marked as rollback-only"
    -> an inner REQUIRED method threw and you caught it. Use REQUIRES_NEW,
       noRollbackFor, or move the work out of the transaction.

--debug   prints the CONDITIONS EVALUATION REPORT: every auto-configuration
          with the condition that let it in (Positive) or kept it out
          (Negative). The answer to "why does this bean exist?".`}
      </CodeBlock>

      <h2>Stereotype Annotations</h2>
      <CodeBlock language="java" title="One-line reference">
{`@Component      Generic Spring-managed bean
@Service        Business logic layer
@Repository     Data access — auto exception translation
@Controller     Web layer (MVC view resolution)
@RestController @Controller + @ResponseBody (JSON out)
@Configuration  Defines @Bean methods; CGLIB-proxied for singleton semantics`}
      </CodeBlock>

      <h2>Dependency Injection</h2>
      <CodeBlock language="java" title="Constructor injection — the only default">
{`@Service
public class OrderService {
    private final OrderRepository orders;
    public OrderService(OrderRepository orders) { this.orders = orders; }
}

// Multiple candidates: @Qualifier or @Primary
public OrderService(@Qualifier("stripeGateway") PaymentGateway gw) { ... }

// Conditional beans:
@ConditionalOnProperty("features.notifications.enabled")
@ConditionalOnClass(name = "com.example.optional.Lib")
@ConditionalOnMissingBean(NotificationService.class)
//   ^ auto-configuration ONLY. On a component-scanned @Service the result
//     depends on registration order, so it silently works until it doesn't.
//     For your own beans use the inverse @ConditionalOnProperty instead.

// Collection injection (plugin pattern):
public Foo(List<Exporter> all) { ... }
public Foo(Map<String, Exporter> byName) { ... }

// Optional injection:
public Foo(Optional<Tracer> tracer) { ... }
public Foo(ObjectProvider<Alerter> alerter) { ... }`}
      </CodeBlock>

      <h2>Request Binding (Controllers)</h2>
      <CodeBlock language="java" title="Every request-binding annotation">
{`@PathVariable      URL path segment
@RequestParam      Query string
@RequestBody       JSON body (deserialized via Jackson)
@RequestHeader     Any request header
@CookieValue       Single cookie
@RequestPart       Multipart part (file uploads)
@ModelAttribute    Bind query string / form to POJO / record`}
      </CodeBlock>

      <h2>Bean Validation</h2>
      <CodeBlock language="java" title="Constraints you'll actually use">
{`@NotNull  @NotBlank  @NotEmpty          Presence
@Min(1)  @Max(999)  @Positive           Numbers
@Size(min=8, max=128)                   String / Collection length
@Pattern(regexp = "...")                Regex
@Email                                  Email format
@Past  @PastOrPresent  @Future          Temporal
@Valid                                  Cascade into nested object
@AssertTrue                             Custom method returns true

Apply with:
public UserDto create(@Valid @RequestBody CreateUserRequest req) { ... }`}
      </CodeBlock>

      <CodeBlock language="java" title="@Valid runs via TWO different machines — know which one you're in">
{`// 1. ARGUMENT RESOLVER (controllers only). No proxy. Runs during argument
//    resolution, so nothing can bypass it. Reliable.
public UserDto create(@Valid @RequestBody CreateUserRequest req) { ... }
//    Failure -> MethodArgumentNotValidException

// 2. AOP PROXY (everywhere else). Opt-in, and silent when you forget.
@Service
public class UserService {
    public void register(@Valid CreateUserRequest req) { ... }   // NO-OP
}
// Outside the web layer nothing resolves arguments. MethodValidationPost-
// Processor does the checking, and it only wraps classes marked @Validated:

@Service
@Validated                          // <- CLASS LEVEL. This turns it on.
public class UserService {
    public void register(@Valid CreateUserRequest req) { ... }   // checked
}
//    Failure -> ConstraintViolationException (a DIFFERENT type — needs its
//    own @ExceptionHandler or it becomes a 500)
//    And self-invocation bypasses it, exactly like @Transactional.

// @Valid    = Jakarta. Cascades into nested objects. Parameters + fields.
// @Validated = Spring. Carries validation GROUPS, and on a class switches
//              on method validation outside controllers.`}
      </CodeBlock>

      <h2>@Transactional</h2>
      <CodeBlock language="java" title="Propagation and rollback rules">
{`@Transactional                          // REQUIRED, rollback on RuntimeException
@Transactional(readOnly = true)         // for pure reads — enables optimizations
@Transactional(propagation = REQUIRES_NEW)   // suspend + start new tx
@Transactional(rollbackFor = MyChecked.class)
@Transactional(isolation = Isolation.SERIALIZABLE)

Traps:
- Self-invocation (this.method()) bypasses the proxy → annotation ignored.
- Non-public / final methods are ignored too — a subclass proxy can't
  override them. Same fact as self-invocation, other side of the coin.
- Checked exceptions do NOT roll back by default (RuntimeException + Error do).
- Never do HTTP or Kafka calls inside a request-path transaction (holds a
  DB connection for the length of the remote call).
- Inner REQUIRED method threw and you caught it? The shared tx is already
  marked rollback-only → UnexpectedRollbackException at commit.`}
      </CodeBlock>

      <h2>Repository Query Shapes</h2>
      <CodeBlock language="java" title="Spring Data JPA in five patterns">
{`Optional<Customer> findByEmailIgnoreCase(String email);        // derived
Page<Customer>     findByStatus(Status s, Pageable p);         // pageable
@Query("select c from Customer c where c.status = :s")         // JPQL
@Query(value = "SELECT * FROM customer WHERE ...", nativeQuery = true)  // native
@EntityGraph(attributePaths = { "customer", "items" })         // fixes N+1
List<Order>       findByStatus(OrderStatus s);

// Bulk update — bypasses the persistence context, so BOTH flags matter:
//   flushAutomatically  push pending changes down BEFORE the UPDATE runs
//   clearAutomatically  detach everything AFTER, or loaded entities keep
//                       stale values and write them back at commit
@Modifying(flushAutomatically = true, clearAutomatically = true)
@Query("update Order o set o.status = :s where o.id = :id")
int markStatus(@Param("s") Status s, @Param("id") UUID id);    // returns row count

// Escape hatch when a derived name is ambiguous: '_' spells the traversal
Optional<Order> findByAddress_ZipCode(String zip);`}
      </CodeBlock>

      <h2>Error Handling</h2>
      <CodeBlock language="java" title="Global handler with ProblemDetail">
{`@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ProblemDetail> handle(DomainException e, HttpServletRequest req) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(e.status(), e.getMessage());
        p.setTitle(e.code());
        p.setInstance(URI.create(req.getRequestURI()));
        p.setProperty("code", e.code());
        e.details().forEach(p::setProperty);
        return ResponseEntity.status(e.status()).body(p);
    }
}

# Enable auto-ProblemDetail for framework exceptions:
spring:
  mvc:
    problemdetails:
      enabled: true`}
      </CodeBlock>

      <h2>Security (JWT Resource Server)</h2>
      <CodeBlock language="java" title="Stateless bearer-token config">
{`@Bean
SecurityFilterChain chain(HttpSecurity http, JwtDecoder decoder) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/actuator/health/**", "/api/public/**").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(decoder)))
        .build();
}

// Method security
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasRole('ADMIN') or @ownerCheck.isOwner(#id, authentication.name)")`}
      </CodeBlock>

      <CodeBlock language="text" title="Where the chain sits — and what that rules out">
{`Tomcat -> DelegatingFilterProxy -> FilterChainProxy -> that chain's filters
       -> DispatcherServlet -> your controller

FilterChainProxy holds a LIST of SecurityFilterChain beans, walks them in
order, and uses the FIRST whose matcher accepts the request. FIRST MATCH
WINS — exactly one chain runs. Two chains with no securityMatcher and no
@Order means whichever sorts first swallows everything and the other is
silently dead.

Because the filters run BEFORE DispatcherServlet:
  * A 401/403 from a URL rule is produced before Spring MVC exists, so
    @RestControllerAdvice STRUCTURALLY CANNOT CATCH IT. Configure an
    AuthenticationEntryPoint / AccessDeniedHandler on the chain instead.
    (A 403 from @PreAuthorize IS inside MVC — an advice can catch that one.)
  * permitAll() does not mean "skip security". The request still traverses
    the whole chain; the authorization filter just votes to allow it, and
    an anonymous Authentication is still populated.

// Two policies in one app: scope + order them explicitly.
@Bean @Order(1) SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http.securityMatcher("/api/**") /* ... */ .build();
}
@Bean @Order(2) SecurityFilterChain ui(HttpSecurity http) throws Exception {
    return http /* everything else */ .build();
}`}
      </CodeBlock>

      <h2>Config</h2>
      <CodeBlock language="yaml" title="application.yml essentials">
{`spring:
  application:
    name: order-service
  datasource:
    url: \${DATABASE_URL}                    # required — fails startup if missing
    hikari:
      maximum-pool-size: 20
      leak-detection-threshold: 2000
  jpa:
    show-sql: false                          # true in dev only
    properties:
      hibernate.jdbc.batch_size: 50
  kafka:
    bootstrap-servers: \${KAFKA_BOOTSTRAP}
    producer.acks: all
    producer.properties.enable.idempotence: true
  threads.virtual.enabled: true              # Java 21 virtual threads
  mvc.problemdetails.enabled: true           # RFC 9457 responses
server:
  port: 8080
  shutdown: graceful
management:
  endpoints.web.exposure.include: health,info,metrics,prometheus,loggers
  endpoint.health.probes.enabled: true`}
      </CodeBlock>

      <h2>Config Imports & Profiles</h2>
      <CodeBlock language="yaml" title="spring.config.import and multi-document profiles">
{`spring:
  config:
    import:
      # Each FILE in the directory is a property: filename = key, contents = value.
      # Exactly how Kubernetes mounts a Secret/ConfigMap as a volume.
      - optional:configtree:/etc/secrets/
      - optional:configtree:/run/secrets/        # Docker/Compose secrets
      - optional:vault://

---
spring:
  config:
    activate:
      on-profile: prod          # modern key; in-document 'spring.profiles'
                                # was deprecated in 2.4 and REMOVED in 3.0
app:
  cache:
    ttl: PT10M

# Precedence, highest first:
#   devtools > @TestPropertySource > cmd-line args > SPRING_APPLICATION_JSON
#   > system props > OS env vars > application-{profile}.yml > application.yml
#   > @PropertySource > defaults`}
      </CodeBlock>

      <CodeBlock language="text" title="Relaxed binding — how an env var sets a dotted property">
{`Canonical form (use this in YAML):   app.catalog-api.max-retries

  app.catalog-api.max-retries     kebab-case   <- canonical
  app.catalogApi.maxRetries       camelCase
  app.catalog_api.max_retries     snake_case
  APP_CATALOG_API_MAX_RETRIES     upper snake  <- environment variables

THE ENV-VAR RULE, precisely: uppercase it, then replace every character
that is not a letter or digit with '_'. Dots AND dashes both become '_'.

  spring.datasource.url         ->  SPRING_DATASOURCE_URL
  spring.jpa.hibernate.ddl-auto ->  SPRING_JPA_HIBERNATE_DDLAUTO
  app.servers[0].host           ->  APP_SERVERS_0_HOST

  docker run -e SPRING_DATASOURCE_URL=jdbc:postgresql://db/orders my-app

!! @ConfigurationProperties GETS relaxed binding. @Value DOES NOT. !!
   Properties classes bind through the Binder, which tries every spelling
   above. @Value("\${...}") is a plain placeholder lookup against the
   Environment — the exact string you wrote, nothing else.

   @Value("\${app.maxRetries}") works locally where application.yml spells
   it maxRetries, then fails in prod where it arrives as APP_MAX_RETRIES.
   One more reason typed properties are the default, not a preference.

# Which source won? Ask the app:  /actuator/env/spring.datasource.url`}
      </CodeBlock>

      <h2>Type-Safe Config Property Class</h2>
      <CodeBlock language="java" title="@ConfigurationProperties on a record">
{`@ConfigurationProperties(prefix = "app.external.catalog-api")
@Validated
public record CatalogApiProperties(
        @NotBlank String baseUrl,
        @NotNull Duration timeout,
        @NotNull @Positive Integer maxRetries) { }

// Enable scanning
@SpringBootApplication
@ConfigurationPropertiesScan
public class Application { }`}
      </CodeBlock>

      <h2>Testing at Three Levels</h2>
      <CodeBlock language="java" title="Unit / slice / integration">
{`// Unit — no Spring
class OrderServiceTest {
    OrderService svc = new OrderService(mock(OrderRepository.class));
}

// Slice — @WebMvcTest / @DataJpaTest / @JsonTest
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService orders;
}

// Integration — full context + real dependencies via TestContainers
@Testcontainers @SpringBootTest
class OrderFlowIT {
    @Container @ServiceConnection                       // auto-wires datasource props
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:17-alpine");
}

// CONTEXT CACHING — the biggest lever on suite speed. A context is reused only
// if ALL of these match: @ContextConfiguration, @ActiveProfiles, properties,
// initializers, web environment, and the set of @MockitoBean definitions.
// => Put shared setup in ONE abstract base class and extend it. Inline
//    'properties = {...}' that differs per class forks a new context each time.
// => @DirtiesContext evicts the cache; use it only when truly unavoidable.
// Debug with: logging.level.org.springframework.test.context.cache=DEBUG`}
      </CodeBlock>

      <h2>Kafka Essentials</h2>
      <CodeBlock language="java" title="Producer / consumer minimum">
{`// Produce
kafka.send(new ProducerRecord<>("orders.placed.v1", orderId.toString(), event));

// Consume with manual ack
@KafkaListener(topics = "orders.placed.v1", groupId = "projector")
public void on(ConsumerRecord<String, OrderPlaced> r, Acknowledgment ack) {
    projection.apply(r.value());
    ack.acknowledge();
}

// DLT + retry
@Bean DefaultErrorHandler errorHandler(KafkaTemplate<Object,Object> tmpl) {
    var backoff = new ExponentialBackOffWithMaxRetries(5);
    return new DefaultErrorHandler(new DeadLetterPublishingRecoverer(tmpl), backoff);
}

Rules:
- Key on a stable business id → in-order per key.
- acks=all + enable.idempotence=true for producers.
- Idempotent consumers — Kafka is at-least-once.
- Transactional outbox for atomic DB + publish.`}
      </CodeBlock>

      <h2>Container Image</h2>
      <CodeBlock language="text" title="Buildpacks, or the layered Dockerfile">
{`# No Dockerfile needed — Boot builds a layered OCI image directly.
./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=myorg/app:1.0
./gradlew bootBuildImage --imageName=myorg/app:1.0

# The hand-written equivalent. The point is LAYER EXTRACTION: split the fat
# jar by how often each part changes so Docker caches the stable layers.
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /builder
COPY . .
RUN ./mvnw -DskipTests clean package
RUN cp target/*.jar application.jar
# Boot 3.3+ spelling. Boot 3.2 and earlier used -Djarmode=layertools.
RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted

FROM eclipse-temurin:21-jre
WORKDIR /application
# Least-frequently-changed FIRST, so a code-only change invalidates one COPY.
COPY --from=builder /builder/extracted/dependencies/ ./
COPY --from=builder /builder/extracted/spring-boot-loader/ ./
COPY --from=builder /builder/extracted/snapshot-dependencies/ ./
COPY --from=builder /builder/extracted/application/ ./
RUN useradd -r -u 1001 appuser
USER appuser
# This application.jar is NOT the fat jar — extraction rewrote it as a THIN
# jar whose manifest Class-Path points at the ./lib directory that landed in
# the dependencies layer. So plain 'java -jar' is correct; do NOT invoke
# JarLauncher, and do NOT copy the original fat jar in alongside it.
ENTRYPOINT ["java", "-jar", "application.jar"]

# Let the JVM see the cgroup limit: -XX:MaxRAMPercentage=75
# (the default ceiling is 25%). Never hardcode -Xmx in a container — it
# ignores the limit and is the usual cause of a pod being OOM-killed.`}
      </CodeBlock>

      <h2>Modern HTTP Clients</h2>
      <CodeBlock language="java" title="RestClient + @HttpExchange">
{`// Fluent, synchronous, replaces RestTemplate for new code
RestClient client = RestClient.create();
ProductDto p = client.get()
    .uri("https://catalog.example.com/products/{id}", id)
    .retrieve()
    .body(ProductDto.class);

// Declarative — best for external APIs with several endpoints
public interface CatalogApi {
    @GetExchange("/products/{id}")
    ProductDto get(@PathVariable String id);
}

CatalogApi api = HttpServiceProxyFactory
    .builderFor(RestClientAdapter.create(client))
    .build()
    .createClient(CatalogApi.class);`}
      </CodeBlock>

      <h2>Observability</h2>
      <CodeBlock language="java" title="One-liner instrumentation">
{`// Metric + trace in one call
Observation.createNotStarted("checkout.perform", observationRegistry)
    .lowCardinalityKeyValue("payment.method", method)
    .observe(() -> performCheckout(...));

// Structured logging with MDC / trace correlation
log.atInfo()
   .addKeyValue("orderId", order.id())
   .log("Order placed");

// Runtime log level change:
POST /actuator/loggers/com.example.orders  {"configuredLevel":"DEBUG"}`}
      </CodeBlock>

      <h2>Spring Boot 4 Deltas</h2>
      <CodeBlock language="text" title="What changes vs Boot 3">
{`Baseline    Java 17 min (21+ recommended) · Jakarta EE 11 · Framework 7
            Jackson 3: com.fasterxml.jackson -> tools.jackson,
            ObjectMapper immutable, built via JsonMapper.builder()

Modules     spring-boot-autoconfigure split per technology
            (spring-boot-webmvc, spring-boot-data-jpa, ...)
            spring.factories auto-config mechanism removed

Null-safety org.springframework.lang.Nullable -> JSpecify
            packages @NullMarked: non-null unless @Nullable`}
      </CodeBlock>
      <CodeBlock language="java" title="The four Boot 4 APIs worth memorising">
{`// 1. API versioning is first-class (no hand-rolled RequestCondition)
configurer.useRequestHeader("X-API-Version").addSupportedVersions("1.0","2.0");

@GetMapping(value = "/{id}", version = "1.1+")   // 1.1 and later
OrderV2 get(@PathVariable UUID id) { ... }

// 2. Retry/resilience moved into core — drop the spring-retry dependency
@EnableResilientMethods                       // replaces @EnableRetry
@Retryable(includes = ApiException.class,
           maxRetries = 3,                    // NOT maxAttempts (that's spring-retry);
                                              // counts retries AFTER the first call
           delay = 200, multiplier = 2.0, jitter = 50)   // backoff attrs inline
@ConcurrencyLimit(10)                         // cap in-flight calls
// Core Spring has NO @Recover — the last exception just propagates.

// 3. Declarative clients auto-register — no HttpServiceProxyFactory @Bean
@ImportHttpServices(group = "catalog", types = CatalogApi.class)
// spring.http.client.service.group.catalog.base-url: https://...

// 4. Programmatic, AOT-friendly bean registration
class TenantRegistrar implements BeanRegistrar {
    public void register(BeanRegistry registry, Environment env) {
        registry.registerBean("ds-" + t, DataSource.class,
            spec -> spec.supplier(ctx -> build(t)));
    }
}`}
      </CodeBlock>
      <InfoBox variant="tip" title="Upgrade effort, ranked">
        <p>
          Only two things actually cost time: the <strong>Jackson 3 package rename</strong>{' '}
          (find-and-replace, plus any code mutating a shared <code>ObjectMapper</code> after
          construction) and the <strong>module split</strong> if you maintain a custom starter.
          JSpecify, API versioning, <code>@Retryable</code>, and <code>BeanRegistrar</code> are
          all opt-in — upgrade first, adopt incrementally.
        </p>
      </InfoBox>

      <h2>WebFlux — Mono/Flux Quick Reference</h2>
      <CodeBlock language="java" title="Nothing runs until subscribed — and WebClient/the framework does that for you">
{`Mono<User> userMono = userRepo.findById(id);      // lazy — no query has run yet
Mono<User> withFallback = userMono
    .switchIfEmpty(Mono.error(new NotFoundException(id)))
    .doOnNext(u -> log.info("loaded {}", u.getId()));

@GetMapping("/users/{id}")
public Mono<User> getUser(@PathVariable String id) { return withFallback; }
// The controller returning a Mono is what triggers the eventual subscribe —
// you almost never call .subscribe() yourself in a web handler.`}
      </CodeBlock>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Type</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Emits</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Reactor equivalent of</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>{'Mono<T>'}</code></td>
            <td style={{ padding: '0.75rem' }}>0 or 1 item</td>
            <td style={{ padding: '0.75rem' }}><code>{'Optional<T>'}</code> / a single async result</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}><code>{'Flux<T>'}</code></td>
            <td style={{ padding: '0.75rem' }}>0..N items over time</td>
            <td style={{ padding: '0.75rem' }}>a <code>{'Stream<T>'}</code> that arrives asynchronously</td>
          </tr>
        </tbody>
      </table>
      <InfoBox variant="danger" title="WebFlux vs. Virtual Threads — the honest trade-off">
        <p>
          Both exist to serve high I/O-bound concurrency without exhausting a thread pool, and
          since Java 21 you genuinely get to pick. WebFlux needs the <em>entire</em> stack
          reactive end to end (R2DBC, not blocking JPA, or the benefit breaks silently) and has a
          real learning curve plus notoriously hard-to-read stack traces. Virtual threads +
          Spring MVC give you the same scalability with ordinary blocking code — the JPA/
          <code>RestTemplate</code> style you already know, unmodified, on a different{' '}
          <code>Thread</code> under the hood. Default to virtual threads for new services on
          Java 21+; reach for WebFlux specifically when you need Reactor's backpressure
          semantics or you're already deep in a reactive stack.
        </p>
      </InfoBox>

      <h2>Resilience4j Quick Reference</h2>
      <CodeBlock language="java" title="The annotation, and the fallback signature contract">
{`@CircuitBreaker(name = "paymentGateway", fallbackMethod = "chargeFallback")
public ChargeResult charge(ChargeRequest request) {
    return gatewayApi.charge(request);
}

// Same class, same params, PLUS exactly one trailing Throwable. Enforced by
// Resilience4j itself — get the signature wrong and it silently isn't found.
private ChargeResult chargeFallback(ChargeRequest request, Throwable t) {
    return ChargeResult.queued("Payment gateway unavailable: " + t.getMessage());
}`}
      </CodeBlock>
      <CodeBlock language="yaml" title="application.yml — the knobs that actually matter">
{`resilience4j.circuitbreaker.instances.paymentGateway:
  slidingWindowType: COUNT_BASED       # or TIME_BASED — "last N calls" vs "last N seconds"
  slidingWindowSize: 20
  minimumNumberOfCalls: 10             # won't OPEN until this many calls are recorded, ever
  failureRateThreshold: 50             # % of the window that must fail to trip OPEN
  waitDurationInOpenState: 30s         # how long before a single HALF_OPEN probe call`}
      </CodeBlock>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Pattern</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Protects against</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Use when</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>@CircuitBreaker</code></td>
            <td style={{ padding: '0.75rem' }}>Cascading failure — one dead dependency exhausting your whole thread pool</td>
            <td style={{ padding: '0.75rem' }}>Any call to a downstream that can hang or error repeatedly</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>@Retry</code></td>
            <td style={{ padding: '0.75rem' }}>Transient failures only</td>
            <td style={{ padding: '0.75rem' }}>The operation is idempotent — never retry a non-idempotent POST/charge</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>@RateLimiter</code></td>
            <td style={{ padding: '0.75rem' }}>Overwhelming a downstream (or your own service)</td>
            <td style={{ padding: '0.75rem' }}>A hard external quota, or protecting a fragile dependency</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}><code>@Bulkhead</code></td>
            <td style={{ padding: '0.75rem' }}>One slow dependency starving threads needed by unrelated requests</td>
            <td style={{ padding: '0.75rem' }}>Isolate a risky/slow call to its own bounded pool of concurrent calls</td>
          </tr>
        </tbody>
      </table>
      <InfoBox variant="warning" title="Composition order matters — outermost wraps innermost">
        <p>
          Stacking multiple annotations on one method applies them outside-in in the order
          listed. <code>@Retry</code> around <code>@CircuitBreaker</code> means each retry
          attempt is itself subject to the breaker — a fast-failing <code>OPEN</code> breaker
          can turn 3 retry attempts into 3 near-instant <code>CallNotPermittedException</code>s
          instead of 3 real network attempts. Getting the order backwards (breaker around retry)
          changes what the breaker's failure count actually measures — decide the order
          deliberately, don't leave it to annotation-declaration order by accident.
        </p>
      </InfoBox>

      <h2>The Self-Invocation Rule (One More Time)</h2>
      <InfoBox variant="danger" title="Applies to @Transactional, @Async, @Cacheable, @Retryable, @Timed, custom @Aspects">
        <p>
          Spring's proxy sits between callers and your bean. Calls from <em>inside</em>
          the same bean (<code>this.method()</code>) go straight to the target and bypass
          the proxy — every proxy-based annotation on that method is ignored.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Fixes:</strong> extract to a separate bean; inject self with
          <code>@Lazy</code>; use programmatic (<code>TransactionTemplate</code>).
        </p>
      </InfoBox>

      <h2>The Twelve Commandments</h2>
      <ol>
        <li>Constructor injection everywhere; fields <code>final</code>.</li>
        <li>Records for DTOs, plain classes for JPA entities.</li>
        <li>Throw domain exceptions; translate once in a
            <code>@RestControllerAdvice</code>.</li>
        <li>No HTTP / Kafka inside <code>@Transactional</code>.</li>
        <li>Idempotent Kafka consumers; at-least-once is the guarantee.</li>
        <li>Slice tests over full-context tests; TestContainers over H2 for JPA.</li>
        <li>Bearer-token API? Stateless + CSRF disabled. Cookie session? CSRF on.</li>
        <li>Log JSON, correlate with trace/request IDs, low-cardinality tags on
            metrics.</li>
        <li>Read <code>SHOW SQL</code> in dev; fix N+1 immediately.</li>
        <li><code>@ConfigurationProperties</code> + <code>@Validated</code> so bad config
            fails startup.</li>
        <li><code>ProblemDetail</code> for every 4xx/5xx body.</li>
        <li>Every service exposes <code>/actuator/health/liveness</code> and
            <code>/actuator/health/readiness</code> — no cascading readiness checks.</li>
      </ol>
    </LessonLayout>
  );
}
