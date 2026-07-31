import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Cheatsheet() {
  return (
    <LessonLayout
      title="Cheat Sheet"
      sectionId="springboot"
      lessonIndex={15}
      prev={{ path: '/springboot/observability', label: 'Observability' }}
      next={null}
    >
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
@ConditionalOnMissingBean(NotificationService.class)
@ConditionalOnClass(name = "com.example.optional.Lib")

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

      <h2>@Transactional</h2>
      <CodeBlock language="java" title="Propagation and rollback rules">
{`@Transactional                          // REQUIRED, rollback on RuntimeException
@Transactional(readOnly = true)         // for pure reads — enables optimizations
@Transactional(propagation = REQUIRES_NEW)   // suspend + start new tx
@Transactional(rollbackFor = MyChecked.class)
@Transactional(isolation = Isolation.SERIALIZABLE)

Traps:
- Self-invocation (this.method()) bypasses the proxy → annotation ignored.
- Checked exceptions do NOT roll back by default.
- Never do HTTP or Kafka calls inside a transaction (holds a DB connection).`}
      </CodeBlock>

      <h2>Repository Query Shapes</h2>
      <CodeBlock language="java" title="Spring Data JPA in five patterns">
{`Optional<Customer> findByEmailIgnoreCase(String email);        // derived
Page<Customer>     findByStatus(Status s, Pageable p);         // pageable
@Query("select c from Customer c where c.status = :s")         // JPQL
@Query(value = "SELECT * FROM customer WHERE ...", nativeQuery = true)  // native
@EntityGraph(attributePaths = { "customer", "items" })         // fixes N+1
List<Order>       findByStatus(OrderStatus s);
@Modifying @Query("update Order set status = :s where id = :id")
int markStatus(@Param("s") Status s, @Param("id") UUID id);    // bulk update`}
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
  mvc.problemdetails.enabled: true           # RFC 7807 responses
server:
  port: 8080
  shutdown: graceful
management:
  endpoints.web.exposure.include: health,info,metrics,prometheus,loggers
  endpoint.health.probes.enabled: true`}
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
    @Container static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");
    @DynamicPropertySource static void ds(DynamicPropertyRegistry r) { ... }
}`}
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
