import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function SpringBootCheatsheet() {
  return (
    <GuideLayout
      title="SPRING BOOT 4"
      kicker="FIELD GUIDE"
      glyph="🍃"
      tagline="Dependency injection, data access, AOP, security and resilience — plus every Boot 4 delta that costs real migration time."
      meta={['Spring Boot 4', 'Jakarta EE 11 · Framework 7', '20 panels']}
      page="1 / 1"
      footer="This page is for recall. The lessons in this section carry the reasoning, the worked examples, and the full migration story to Boot 4."
      prev={{ path: '/springboot/resilience', label: 'Resilience4j & Circuit Breakers' }}
      next={null}
    >
      <GuidePanel n={1} title="Startup Failure Triage" accent="blue" glyph="🚑">
        <GuideDefs
          items={[
            ['required a bean of type X', "not annotated, or lives outside the @SpringBootApplication package tree — component scan never saw it"],
            ['required a single bean, but 2 were found', '@Primary on the default, or @Qualifier at the injection point'],
            ['Port 8080 was already in use', 'a previous run — lsof -i :8080, or --server.port=8081'],
            ['"...form a cycle" (ASCII loop in the log)', "extract the shared concern into a third bean — don't set spring.main.allow-circular-references=true"],
            ["No property 'emial' found for type 'Customer'", 'typo in a derived query method — the message lists the valid property names'],
            ['no PasswordEncoder mapped for the id "null"', 'stored hashes lack the {bcrypt} prefix DelegatingPasswordEncoder needs'],
            ["Failed to bind properties under 'app.x'", '@ConfigurationProperties + @Validated doing its job — fix the yaml, do not loosen the annotation'],
            ['tx marked as rollback-only', 'an inner REQUIRED method threw and you caught it — use REQUIRES_NEW, noRollbackFor, or move the work out'],
          ]}
        />
        <GuideRules items={['--debug prints the CONDITIONS EVALUATION REPORT — every auto-configuration with the condition that let it in (Positive) or kept it out (Negative). The answer to "why does this bean exist?".']} />
      </GuidePanel>

      <GuidePanel n={2} title="Stereotype Annotations" accent="purple" glyph="🏷️">
        <GuideDefs
          items={[
            ['@Component', 'generic Spring-managed bean'],
            ['@Service', 'business logic layer'],
            ['@Repository', 'data access — auto exception translation'],
            ['@Controller', 'web layer (MVC view resolution)'],
            ['@RestController', '@Controller + @ResponseBody (JSON out)'],
            ['@Configuration', 'defines @Bean methods; CGLIB-proxied for singleton semantics'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={3} title="Dependency Injection" accent="green" glyph="🧷">
        <GuideCode>{`@Service
public class OrderService {
    private final OrderRepository orders;
    public OrderService(OrderRepository orders) { this.orders = orders; }
}

// Multiple candidates: @Qualifier or @Primary
public OrderService(@Qualifier("stripeGateway") PaymentGateway gw) { ... }

// Collection injection (plugin pattern)
public Foo(List<Exporter> all) { ... }
public Foo(Map<String, Exporter> byName) { ... }

// Optional injection
public Foo(Optional<Tracer> tracer) { ... }
public Foo(ObjectProvider<Alerter> alerter) { ... }`}</GuideCode>
        <GuideRules items={[
          "@ConditionalOnProperty / @ConditionalOnClass / @ConditionalOnMissingBean are for auto-configuration. On a component-scanned @Service the result depends on registration order, so it silently works until it doesn't — use the inverse @ConditionalOnProperty on your own beans instead.",
          'A full @Configuration class is CGLIB-proxied, so one @Bean method calling another returns the SAME container-managed singleton. @Component as a config class loses that guarantee — the intra-class call makes a fresh instance instead of reusing the bean.',
          'Singleton injecting @Scope("prototype"): only ONE prototype instance is ever created, at construction time. Use ObjectProvider<T> or @Lookup for a genuinely fresh instance per call.',
          '@PostConstruct / @PreDestroy — init and teardown hooks, each run exactly once around the bean lifecycle.',
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Request Binding" accent="amber" glyph="🎯">
        <GuideDefs
          items={[
            ['@PathVariable', 'URL path segment'],
            ['@RequestParam', 'query string'],
            ['@RequestBody', 'JSON body (deserialized via Jackson)'],
            ['@RequestHeader', 'any request header'],
            ['@CookieValue', 'single cookie'],
            ['@RequestPart', 'multipart part (file uploads)'],
            ['@ModelAttribute', 'bind query string / form to POJO / record'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={5} title="Validation & Error Handling" accent="pink" glyph="✅" span={2}>
        <GuideDefs
          items={[
            ['@NotNull / @NotBlank / @NotEmpty', 'presence'],
            ['@Min / @Max / @Positive', 'numeric bounds'],
            ['@Size(min, max)', 'string / collection length'],
            ['@Pattern(regexp) / @Email', 'regex / email format'],
            ['@Past / @PastOrPresent / @Future', 'temporal'],
          ]}
        />
        <GuideCode>{`// Controller — argument resolver, no proxy, cannot be bypassed
public UserDto create(@Valid @RequestBody CreateUserRequest req) { ... }
// failure -> MethodArgumentNotValidException

// Service — @Valid alone is a silent NO-OP; @Validated switches on the AOP proxy
@Service @Validated
public class UserService {
    public void register(@Valid CreateUserRequest req) { ... }   // now checked
}
// failure -> ConstraintViolationException (needs its own @ExceptionHandler)

// Global translation — one place, every domain exception
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ProblemDetail> handle(DomainException e, HttpServletRequest req) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(e.status(), e.getMessage());
        p.setTitle(e.code());
        return ResponseEntity.status(e.status()).body(p);
    }
}
// spring.mvc.problemdetails.enabled: true  enables it for framework exceptions too`}</GuideCode>
        <GuideTable
          head={['Status', 'Use it when']}
          rows={[
            ['400 Bad Request', 'malformed body or failed field validation'],
            ['401 Unauthorized', 'NOT authenticated — misnamed, it really means "unauthenticated"'],
            ['403 Forbidden', 'authenticated, but not authorized for this resource'],
            ['404 Not Found', "resource doesn't exist"],
            ['409 Conflict', 'duplicate key or a concurrent-write conflict'],
            ['422 Unprocessable Entity', 'well-formed input that violates a business rule'],
          ]}
        />
        <GuideRules items={[
          '@Valid = Jakarta, cascades into nested objects. @Validated = Spring, carries validation groups and — on a class — turns on method validation outside controllers.',
          'Self-invocation bypasses the @Validated proxy, same rule as @Transactional. Outside the web layer, nothing gets checked unless the class carries @Validated.',
          '400 vs 422 is the pair people get wrong most: 400 is a malformed shape, 422 is well-formed input that fails a business rule.',
          'Never let a driver exception (JDBC, HTTP client) escape to the handler — catch it at the repository/client boundary and re-throw as a domain exception.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="@Transactional & Self-Invocation" accent="cyan" glyph="🔁" span={3}>
        <GuideCode>{`@Transactional                                // REQUIRED, rollback on RuntimeException
@Transactional(readOnly = true)               // pure reads — enables optimizations
@Transactional(propagation = REQUIRES_NEW)    // suspend + start new tx
@Transactional(rollbackFor = MyChecked.class)
@Transactional(isolation = Isolation.SERIALIZABLE)`}</GuideCode>
        <GuideTable
          head={['Propagation', 'Behavior']}
          rows={[
            ['REQUIRED (default)', 'join the existing tx, else start one — 99% of methods'],
            ['REQUIRES_NEW', 'suspend + always start a new one — takes a 2nd connection, pool-exhaustion risk in a loop'],
            ['SUPPORTS', 'join if a tx exists, else run without one'],
            ['NOT_SUPPORTED', 'suspend the current tx, run with none — long reports'],
            ['MANDATORY', 'throw if no tx is active'],
            ['NESTED', 'JDBC savepoint — rollback undoes only this segment'],
          ]}
        />
        <GuideTable
          head={['Isolation', 'Behavior']}
          rows={[
            ['READ_UNCOMMITTED', 'sees dirty writes — never use'],
            ['READ_COMMITTED', 'sees only committed data — Postgres / Oracle default'],
            ['REPEATABLE_READ', 'same read = same result within the tx — MySQL InnoDB default'],
            ['SERIALIZABLE', 'fully sequential — strictest, most contention'],
          ]}
        />
        <GuideRules items={[
          'Self-invocation (this.method()) bypasses the proxy — the annotation is silently ignored. Same rule for @Async, @Cacheable, @Retryable, @Timed and custom @Aspects.',
          'Non-public / final methods are ignored for the same reason — a subclass proxy cannot override them.',
          'Checked exceptions do NOT roll back by default — only RuntimeException and Error do.',
          'Never do HTTP or Kafka calls inside a request-path transaction — it holds a DB connection for the length of the remote call.',
          'Inner REQUIRED method threw and you caught it? The shared tx is already marked rollback-only -> UnexpectedRollbackException at commit.',
          'Fixes for self-invocation: extract to a separate bean, inject self with @Lazy, or go programmatic with TransactionTemplate.',
          'Higher isolation trades throughput for safety and is rarely the first move — for a concurrent-write conflict, @Version (optimistic locking) usually beats reaching for SERIALIZABLE.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="AOP, Async & Events" accent="red" glyph="🎭" span={3}>
        <GuideDefs
          items={[
            ['@Before', 'before the method — cannot alter args or return'],
            ['@AfterReturning', 'after a normal return — can inspect, not alter, the result'],
            ['@AfterThrowing', 'on exception — log or transform via a wrapping aspect'],
            ['@After', 'after return OR exception — finally-style cleanup'],
            ['@Around', 'full control — must call pjp.proceed(); the only type that can alter args/return/swallow errors'],
          ]}
        />
        <GuideCode>{`@Async("emailExecutor")                       // fire-and-forget (void)
public void sendWelcome(User user) { }
@Async("emailExecutor")                       // awaitable
public CompletableFuture<Void> sendReceipt(Order o) { ... }
// A non-void, non-CompletableFuture return type compiles clean and
// silently hands every caller null.

publisher.publishEvent(new OrderPlacedEvent(order.id(), req.email(), Instant.now()));

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
@Async("emailExecutor")
public void onOrderPlaced(OrderPlacedEvent e) { }
// plain @EventListener runs SYNCHRONOUSLY on the publisher's thread and
// INSIDE its transaction — a failing listener rolls back the order too.

@Cacheable(cacheNames = "customerById", key = "#id")
public CustomerDto findById(UUID id) { }
@CacheEvict(cacheNames = "customerById", key = "#id")
public void update(UUID id, UpdateRequest req) { }
@CachePut(cacheNames = "customerById", key = "#result.id()")
public CustomerDto refresh(UUID id) { }   // always runs, replaces the entry`}</GuideCode>
        <GuideRules items={[
          "Spring AOP is proxy-based and covers ~95% of enterprise needs — public methods, called through the proxy, no build step. AspectJ weaves at compile/load time and can reach private methods and self-invocation, at the cost of a build-time agent.",
          '@Order controls aspect nesting when several match one method — built-ins like @Transactional included. The LOWEST number is OUTERMOST, easy to get backwards.',
          'CGLIB proxies are subclasses, so they can only weave overridable methods — private and final methods (and final classes) silently do nothing, no error, no warning. protected and package-private methods are fine since Framework 6.0.',
          "MDC, SecurityContext, and request attributes don't cross onto an @Async thread by default — a correlation id or authenticated user vanishes unless a TaskDecorator restores them.",
          'Prefer @TransactionalEventListener(AFTER_COMMIT) over plain @EventListener for side effects — the plain form runs inside the publishing transaction, so a failing listener can roll back the write that triggered it.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Repository Query Shapes" accent="blue" glyph="🗂️">
        <GuideCode>{`Optional<Customer> findByEmailIgnoreCase(String email);        // derived
Page<Customer>     findByStatus(Status s, Pageable p);         // pageable
@Query("select c from Customer c where c.status = :s")         // JPQL
@Query(value = "SELECT * FROM customer WHERE ...", nativeQuery = true)
@EntityGraph(attributePaths = { "customer", "items" })         // fixes N+1

@Modifying(flushAutomatically = true, clearAutomatically = true)
@Query("update Order o set o.status = :s where o.id = :id")
int markStatus(@Param("s") Status s, @Param("id") UUID id);    // returns row count

Optional<Order> findByAddress_ZipCode(String zip);   // '_' spells the traversal`}</GuideCode>
        <GuideRules items={[
          'Bulk @Modifying updates bypass the persistence context — flushAutomatically pushes pending changes down BEFORE the UPDATE runs; clearAutomatically detaches everything AFTER, or loaded entities keep stale values and overwrite them at commit.',
          'Rule of thumb on derived queries: once the method name would be longer than the JPQL, write the JPQL — a chained findByXAndYAndZIn name is the world’s worst DSL.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Entity Modeling & Optimistic Locking" accent="purple" glyph="🧬" span={2}>
        <GuideCode>{`@Entity
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)     // NEVER the ORDINAL default —
    private CustomerStatus status;   // reordering values corrupts old rows

    @Version                          // optimistic locking
    private Long version;

    protected Customer() { }          // JPA needs a no-arg constructor
}

// Two clients read the same row, both write — the second commit throws
// OptimisticLockException (Spring: ObjectOptimisticLockingFailureException).
@Retryable(retryFor = ObjectOptimisticLockingFailureException.class, maxAttempts = 3)
public Order applyDiscount(UUID id, BigDecimal pct) {
    return self.applyDiscountTx(id, pct);   // retry OUTSIDE the tx
}
@Transactional
Order applyDiscountTx(UUID id, BigDecimal pct) { }`}</GuideCode>
        <GuideTable
          head={['Return type', 'Cost']}
          rows={[
            ['Page<T>', '2 queries — adds a SELECT count(*); use only when you display a total'],
            ['Slice<T>', "1 query — fetches limit+1 rows to know if there's a next page"],
            ['List<T>', '1 query, no paging metadata at all'],
          ]}
        />
        <GuideRules items={[
          'Records can’t be entities — JPA needs a no-arg constructor and mutable state for lazy-loading proxies. Records are for DTOs/projections, plain classes for entities.',
          'A loop that looks like one query can be N+1: each row’s lazy @ManyToOne/@OneToMany triggers its own SELECT on first access — 1000 rows can mean 2001 queries. Fix with @EntityGraph or JOIN FETCH; avoid FetchType.EAGER, it just relocates the N+1 to every load site.',
          'Keep the @Retryable retry OUTSIDE the @Transactional method — if the retry annotation ends up the inner advice, every retry reuses the same already-rolled-back transaction and fails identically.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Security — Filter Chain & JWT" accent="green" glyph="🔐" span={2}>
        <GuideCode>{`@Bean
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
@PreAuthorize("hasRole('ADMIN')")

// Two policies in one app — scope + order them explicitly
@Bean @Order(1) SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http.securityMatcher("/api/**") /* ... */ .build();
}
@Bean @Order(2) SecurityFilterChain ui(HttpSecurity http) throws Exception {
    return http /* everything else */ .build();
}`}</GuideCode>
        <GuideRules items={[
          "Filters run BEFORE DispatcherServlet exists — a 401/403 from a URL rule structurally cannot be caught by @RestControllerAdvice. Configure an AuthenticationEntryPoint / AccessDeniedHandler on the chain instead. A 403 from @PreAuthorize IS inside MVC, so an advice CAN catch that one.",
          'FilterChainProxy holds a list of SecurityFilterChain beans and runs the FIRST whose matcher accepts the request — exactly one chain runs. No securityMatcher and no @Order means whichever sorts first silently swallows everything.',
          'permitAll() does not skip security — the request still traverses the whole chain; the authorization filter just votes to allow it, and an anonymous Authentication is still populated.',
          "Bearer-token API: STATELESS + csrf disabled — a header token is never auto-attached cross-origin, so there is nothing to forge. Cookie-session SPA: keep CSRF on and use csrf.spa() (Security 7) — the widely-copied CookieCsrfTokenRepository.withHttpOnlyFalse() line alone still 403s, because the default handler expects an encoded token where the cookie holds a raw one.",
          'CORS must be wired through a CorsConfigurationSource bean, not just WebMvcConfigurer — otherwise Spring Security can reject the OPTIONS preflight before MVC’s CORS support ever runs.',
          'PasswordEncoderFactories.createDelegatingPasswordEncoder() stores hashes as "{bcrypt}..." — tags the algorithm so you can migrate to Argon2id/PBKDF2 later without a global rehash.',
          '@PreAuthorize is proxy-based AOP too — the self-invocation trap covered in the AOP panel applies here just the same.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Config — YAML, Imports, Profiles & Relaxed Binding" accent="amber" glyph="⚙️" span={3}>
        <GuideCode>{`spring:
  application.name: order-service
  datasource.url: \${DATABASE_URL}        # required — fails startup if missing
  jpa.hibernate.ddl-auto: validate
  threads.virtual.enabled: true           # Java 21 virtual threads
  config.import:
    - optional:configtree:/etc/secrets/   # one file per property
---
spring.config.activate.on-profile: prod   # in-document 'spring.profiles' removed in 3.0
app.cache.ttl: PT10M

@ConfigurationProperties(prefix = "app.external.catalog-api")
@Validated
public record CatalogApiProperties(
        @NotBlank String baseUrl,
        @NotNull Duration timeout,
        @NotNull @Positive Integer maxRetries) { }

@SpringBootApplication
@ConfigurationPropertiesScan
public class Application { }`}</GuideCode>
        <GuideTable
          head={['Spelling', 'Example']}
          rows={[
            ['kebab-case — canonical, write this in YAML', 'app.catalog-api.max-retries'],
            ['camelCase', 'app.catalogApi.maxRetries'],
            ['snake_case', 'app.catalog_api.max_retries'],
            ['UPPER_SNAKE — environment variables', 'APP_CATALOG_API_MAX_RETRIES'],
          ]}
        />
        <GuideDefs
          items={[
            ['${var}', 'required — startup fails if missing'],
            ['${var:default}', 'fallback value if missing'],
            ['${random.uuid} / ${random.int(10,100)}', 'generated at startup'],
          ]}
        />
        <GuideRules items={[
          'Env var rule: uppercase the key, then replace every character that is not a letter or digit with _. Dots AND dashes both become _.',
          'Precedence, highest first: devtools > @TestPropertySource > cmd-line args > system props > OS env vars > application-{profile}.yml > application.yml > defaults.',
          'configtree: treats each FILE in a directory as one property — filename is the key, contents are the value. Exactly how Kubernetes mounts a Secret/ConfigMap as a volume.',
          '@ConfigurationProperties binds through the Binder and gets every spelling above. @Value("${...}") is a plain placeholder lookup against the Environment — the exact string you wrote, nothing else. One more reason typed properties are the default, not a preference.',
          'Which source actually won? Ask the app: /actuator/env/spring.datasource.url',
          '@Profile("prod") / @Profile("!prod") swaps an entire bean implementation by environment — the negation form avoids listing every non-prod profile.',
          'Profiles are for genuinely different modes (dev/test/prod). A canary/region/feature matrix multiplies profile names combinatorially — reach for @ConditionalOnProperty for toggles instead.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Testing at Three Levels" accent="pink" glyph="🧪" span={2}>
        <GuideCode>{`// Unit — no Spring
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
    @Container @ServiceConnection                 // auto-wires datasource props
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:17-alpine");
}`}</GuideCode>
        <GuideRules items={[
          'Context caching is the biggest lever on suite speed — a context is reused only if @ContextConfiguration, @ActiveProfiles, properties, initializers, web environment AND the set of @MockitoBean definitions all match.',
          'Put shared setup in ONE abstract base class and extend it. Inline properties = {...} that differs per class forks a new context every time.',
          '@DirtiesContext evicts the cache — use it only when truly unavoidable.',
          'Debug context reuse with: logging.level.org.springframework.test.context.cache=DEBUG',
          '@MockBean was deprecated in Boot 3.4 and REMOVED in Boot 4 — use @MockitoBean (Spring Framework 6.2+) to replace a bean inside the context; on Boot 4 the migration is mandatory, not optional.',
          'H2 lies about production: case-insensitive collations, JSON/array columns, window functions, and CTE semantics all differ from Postgres. A @DataJpaTest can pass on H2 and fail on the real engine — reach for TestContainers past trivial CRUD.',
        ]} />
      </GuidePanel>

      <GuidePanel n={13} title="Integration — Kafka & HTTP Clients" accent="cyan" glyph="📡" span={3}>
        <GuideCode>{`// Produce
kafka.send(new ProducerRecord<>("orders.placed.v1", orderId.toString(), event));

// Consume with manual ack
@KafkaListener(topics = "orders.placed.v1", groupId = "projector")
public void on(ConsumerRecord<String, OrderPlaced> r, Acknowledgment ack) {
    projection.apply(r.value());
    ack.acknowledge();
}

// Fluent HTTP client — replaces RestTemplate for new code
ProductDto p = RestClient.create().get()
    .uri("https://catalog.example.com/products/{id}", id)
    .retrieve().body(ProductDto.class);

// Declarative — best for external APIs with several endpoints
public interface CatalogApi {
    @GetExchange("/products/{id}")
    ProductDto get(@PathVariable String id);
}`}</GuideCode>
        <GuideRules items={[
          'Key Kafka messages on a stable business id -> in-order per key. acks=all + enable.idempotence=true for producers; consumers must be idempotent — Kafka is at-least-once.',
          'DLT + retry: new DefaultErrorHandler(new DeadLetterPublishingRecoverer(kafkaTemplate), backoff) as a @Bean.',
          'ErrorHandlingDeserializer wraps the real key/value deserializer — a malformed message crashes a plain deserializer BEFORE your listener sees it and loops forever on the same offset; the wrapper turns that into a normal error the DLT handler can route.',
          'Transactional outbox for atomic DB write + publish — you cannot atomically commit to Postgres and publish to Kafka, since they are different systems.',
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="Observability — Actuator, Micrometer & Tracing" accent="red" glyph="📊" span={2}>
        <GuideCode>{`management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
        exclude: env,configprops,beans,heapdump,threaddump

// Metric + trace in one call
Observation.createNotStarted("checkout.perform", observationRegistry)
    .lowCardinalityKeyValue("payment.method", method)
    .observe(() -> performCheckout(...));

// Runtime log level change — no redeploy
POST /actuator/loggers/com.example.orders  {"configuredLevel":"DEBUG"}`}</GuideCode>
        <GuideTable
          head={['Meter', 'Use for']}
          rows={[
            ['Counter', 'totals that only go up (orders placed)'],
            ['Timer', 'durations, with percentile histograms (p50/p95/p99)'],
            ['Gauge', 'a sampled current value — pending count, queue depth'],
          ]}
        />
        <GuideRules items={[
          '/actuator/env, /configprops, /heapdump, and /beans leak secrets, the full resolved config, and heap contents — excluding them (or moving management to a platform-only port) is the default posture, not an afterthought.',
          'Prometheus stores one time series per unique tag-value combination. Tags must be bounded sets (status codes, feature flags) — IDs, tokens, and emails belong in traces or logs, never metric tags.',
          'Every replica of a horizontally-scaled service runs its own copy of @Scheduled — there is no built-in coordination. 5 replicas means a "nightly" job runs 5 times unless you add a distributed lock (Shedlock) or move it to an external scheduler.',
        ]} />
      </GuidePanel>

      <GuidePanel n={15} title="Container Image" accent="blue" glyph="📦" span={2}>
        <GuideCode>{`# No Dockerfile needed — Boot builds a layered OCI image directly
./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=myorg/app:1.0

# Hand-written equivalent — the point is LAYER EXTRACTION
FROM eclipse-temurin:21-jdk AS builder
COPY . .
RUN ./mvnw -DskipTests clean package
RUN cp target/*.jar application.jar
RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted
# Boot 3.3+ spelling — 3.2 and earlier used -Djarmode=layertools

FROM eclipse-temurin:21-jre
# Least-frequently-changed layer FIRST, so a code-only change invalidates one COPY
COPY --from=builder /builder/extracted/dependencies/ ./
COPY --from=builder /builder/extracted/spring-boot-loader/ ./
COPY --from=builder /builder/extracted/snapshot-dependencies/ ./
COPY --from=builder /builder/extracted/application/ ./
ENTRYPOINT ["java", "-jar", "application.jar"]`}</GuideCode>
        <GuideRules items={[
          'This application.jar is NOT the fat jar — extraction rewrote it as a THIN jar whose manifest Class-Path points at the ./lib directory in the dependencies layer. Plain java -jar is correct; do not invoke JarLauncher or copy the original fat jar in alongside it.',
          'Let the JVM see the cgroup limit: -XX:MaxRAMPercentage=75 (the default ceiling is 25%). Never hardcode -Xmx in a container — it ignores the limit and is the usual cause of an OOM-killed pod.',
        ]} />
      </GuidePanel>

      <GuidePanel n={16} title="Spring Boot 4 Deltas" accent="purple" glyph="🆕" span={2}>
        <GuideDefs
          items={[
            ['Baseline', 'Java 17 min (21+ recommended) · Jakarta EE 11 · Framework 7'],
            ['Jackson 3', 'com.fasterxml.jackson -> tools.jackson; ObjectMapper is immutable, built via JsonMapper.builder()'],
            ['Modules', 'spring-boot-autoconfigure split per technology (spring-boot-webmvc, spring-boot-data-jpa, ...); spring.factories mechanism removed'],
            ['Null-safety', 'org.springframework.lang.Nullable -> JSpecify; @NullMarked packages are non-null unless @Nullable'],
          ]}
        />
        <GuideCode>{`// 1. API versioning is first-class
configurer.useRequestHeader("X-API-Version").addSupportedVersions("1.0","2.0");
@GetMapping(value = "/{id}", version = "1.1+")   // 1.1 and later

// 2. Retry/resilience moved into core — drop spring-retry
@EnableResilientMethods                     // replaces @EnableRetry
@Retryable(includes = ApiException.class,
           maxRetries = 3,                  // NOT maxAttempts — counts retries AFTER the first call
           delay = 200, multiplier = 2.0, jitter = 50)
@ConcurrencyLimit(10)
// Core Spring has NO @Recover — the last exception just propagates.

// 3. Declarative clients auto-register — no HttpServiceProxyFactory @Bean
@ImportHttpServices(group = "catalog", types = CatalogApi.class)

// 4. Programmatic, AOT-friendly bean registration
class TenantRegistrar implements BeanRegistrar {
    public void register(BeanRegistry registry, Environment env) {
        registry.registerBean("ds-" + t, DataSource.class,
            spec -> spec.supplier(ctx -> build(t)));
    }
}`}</GuideCode>
        <GuideTable
          head={['Boot 2 / pre-3', 'Boot 3/4']}
          rows={[
            ['javax.*', 'jakarta.*'],
            ['WebSecurityConfigurerAdapter', 'SecurityFilterChain @Bean'],
            ['@MockBean (deprecated 3.4, removed in Boot 4)', '@MockitoBean (Framework 6.2+)'],
            ['antMatchers(...)', 'requestMatchers(...)'],
            ['Sleuth', 'Micrometer Tracing'],
            ['RestTemplate (still works)', 'RestClient for new call sites'],
          ]}
        />
        <GuideRules items={[
          'Only two things actually cost time on a Boot 3->4 upgrade: the Jackson 3 package rename (find-and-replace, plus any code mutating a shared ObjectMapper after construction) and the module split if you maintain a custom starter.',
          'JSpecify, API versioning, @Retryable and BeanRegistrar are all opt-in — upgrade first, adopt incrementally.',
          'The rename table above is the single page worth memorizing before touching a Boot 2 codebase — every row silently compiles-but-warns or outright breaks on upgrade.',
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="JVM & Concurrency" accent="green" glyph="🧵" span={2}>
        <GuideCode>{`spring.threads.virtual.enabled: true   // one line — big win for I/O-bound MVC

// Java 21-23: synchronized pins the virtual thread during I/O —
// the carrier can't be reused by another vthread while blocked.
public synchronized void inc() { externalCall(); count++; }   // pinned

// Java 24+ (JEP 491): synchronized unmounts fine; remaining pin
// sites are native/JNI frames and class initializers.
// Portable fix either way: keep I/O outside the lock.

// Structured concurrency (JDK preview — JEP 505 in 25, JEP 525 in 26)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var order    = scope.fork(() -> orders.byId(orderId));
    var customer = scope.fork(() -> customers.forOrder(orderId));
    scope.join();
    scope.throwIfFailed();
    return new EnrichedOrder(order.get(), customer.get());
}`}</GuideCode>
        <GuideRules items={[
          "Virtual threads speed up I/O-bound work by letting the servlet container hold thousands of requests waiting on I/O; they don't speed up CPU-bound work — that still wants platform threads.",
          'Check your target JDK before citing the pinning fix: swapping synchronized for ReentrantLock matters on Java 21-23, and is largely moot on Java 24+ after JEP 491.',
          'Spring has no direct StructuredTaskScope integration yet — it is used as plain Java inside a service method, not a Spring-managed abstraction.',
          './mvnw -Pnative native:compile (GraalVM) trades ~5s JVM startup for ~50ms and cuts memory from hundreds of MB to tens — worth it for serverless/CLI/container density, not for long-running services where the JIT wins on sustained throughput.',
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="WebFlux — Mono/Flux" accent="amber" glyph="🌊" span={2}>
        <GuideCode>{`Mono<User> userMono = userRepo.findById(id);      // lazy — no query has run yet
Mono<User> withFallback = userMono
    .switchIfEmpty(Mono.error(new NotFoundException(id)))
    .doOnNext(u -> log.info("loaded {}", u.getId()));

@GetMapping("/users/{id}")
public Mono<User> getUser(@PathVariable String id) { return withFallback; }
// returning the Mono is what triggers the eventual subscribe —
// you almost never call .subscribe() yourself in a web handler`}</GuideCode>
        <GuideTable
          head={['Type', 'Emits', 'Reactor equivalent of']}
          rows={[
            ['Mono<T>', '0 or 1 item', 'Optional<T> / a single async result'],
            ['Flux<T>', '0..N items over time', 'a Stream<T> that arrives asynchronously'],
          ]}
        />
        <GuideRules items={[
          'WebFlux needs the ENTIRE stack reactive end to end (R2DBC, not blocking JPA) or the benefit breaks silently — plus a real learning curve and hard-to-read stack traces.',
          'Virtual threads + Spring MVC give the same I/O-bound scalability with ordinary blocking code — the JPA / RestTemplate style you already know, on a different Thread under the hood.',
          'Default to virtual threads for new services on Java 21+; reach for WebFlux specifically when you need backpressure semantics or are already deep in a reactive stack.',
        ]} />
      </GuidePanel>

      <GuidePanel n={19} title="Resilience4j Quick Reference" accent="pink" glyph="🛡️" span={2}>
        <GuideCode>{`@CircuitBreaker(name = "paymentGateway", fallbackMethod = "chargeFallback")
public ChargeResult charge(ChargeRequest request) {
    return gatewayApi.charge(request);
}
// Same class, same params, PLUS exactly one trailing Throwable — enforced by
// Resilience4j itself. Get the signature wrong and it silently isn't found.
private ChargeResult chargeFallback(ChargeRequest request, Throwable t) {
    return ChargeResult.queued("Payment gateway unavailable: " + t.getMessage());
}

resilience4j.circuitbreaker.instances.paymentGateway:
  slidingWindowType: COUNT_BASED       # or TIME_BASED
  failureRateThreshold: 50             # % of the window that must fail to trip OPEN
  waitDurationInOpenState: 30s         # before a single HALF_OPEN probe call`}</GuideCode>
        <GuideTable
          head={['Pattern', 'Protects against']}
          rows={[
            ['@CircuitBreaker', 'cascading failure — one dead dependency exhausting your whole thread pool'],
            ['@Retry', 'transient failures — only for idempotent operations'],
            ['@RateLimiter', 'overwhelming a downstream (or your own service)'],
            ['@Bulkhead', 'one slow dependency starving threads needed by unrelated requests'],
          ]}
        />
        <GuideRules items={[
          'Stacking annotations applies them outside-in in the order listed. @Retry around @CircuitBreaker means each retry is itself subject to the breaker — a fast-failing OPEN breaker can turn 3 retries into 3 near-instant CallNotPermittedExceptions instead of 3 real network attempts.',
          'Getting the order backwards (breaker around retry) changes what the breaker actually measures — decide the order deliberately.',
        ]} />
      </GuidePanel>

      <GuidePanel n={20} title="The Twelve Commandments" accent="cyan" glyph="📜" span={3}>
        <GuideRules items={[
          'Constructor injection everywhere; fields final.',
          'Records for DTOs, plain classes for JPA entities.',
          'Throw domain exceptions; translate once in a @RestControllerAdvice.',
          'No HTTP / Kafka calls inside @Transactional.',
          'Idempotent Kafka consumers — at-least-once is the guarantee.',
          'Slice tests over full-context tests; TestContainers over H2 for JPA.',
          'Bearer-token API? Stateless + CSRF disabled. Cookie session? CSRF on.',
          'Log JSON, correlate with trace/request IDs, low-cardinality tags on metrics.',
          'Read SHOW SQL in dev; fix N+1 immediately.',
          '@ConfigurationProperties + @Validated so bad config fails startup.',
          'ProblemDetail for every 4xx/5xx body.',
          'Every service exposes /actuator/health/liveness and /actuator/health/readiness — no cascading readiness checks.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
