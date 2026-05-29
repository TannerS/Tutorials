# Broken Spring Boot Demo — Master Cheat Sheet

For each `FIXME:` tag, here's what's wrong, **why it matters**, and **multiple ways
to fix it**. Pick what teaches you the most.

> Tip: as you fix each one, write a one-line note in the FIXME explaining the
> trade-off you picked.

---

## SB4 — Spring Boot 4 features

### SB4-1 · Virtual threads not enabled
**Why:** Every blocking JDBC call pins a platform thread. With virtual threads (Loom)
the JVM can suspend the thread while it waits, so a server with 200 platform threads
can serve thousands of concurrent blocking requests.

**Fix:** in `application.yml`:
```yaml
spring:
  threads:
    virtual:
      enabled: true
```

That's literally it for Tomcat. Verify with a thread dump:
```bash
curl http://localhost:8081/actuator/threaddump | jq '.threads[].name' | head
# expect names like "VirtualThread[#42]/runnable@ForkJoinPool-1-worker-3"
```

Caveats:
- ThreadLocal-heavy libraries (a few JDBC drivers, some logging MDC patterns) can
  leak more than before. Test under load before flipping in production.
- @Async still uses platform threads unless you wire a virtual-thread executor.

### SB4-2 · Native image untested
**Fix:**
```bash
mvn -Pnative -DskipTests native:compile
./target/broken-shop
```
Output: a single ~50MB native binary that boots in ~50ms. Useful for CLI/cron-style
jobs or container cold starts.

---

## ARCH / DI — Layering and DI

### ARCH-1 · Controller injects repository directly
**Fix:** delete the repository field from the controller and use only the service.
The service decides whether/how to talk to the repository.

### ARCH-2 · Controller doing repository work
**Fix:** move `productRepository.findAll()` into `productService.listAll()`. Then
also map to a DTO in the service so the controller has nothing to think about.

### DI-1 · Field injection
**Fix:** constructor injection (immutable, testable, fails at startup if a bean is
missing instead of at first call):
```java
@Service
public class OrderService {
  private final OrderRepository orderRepository;
  private final ProductRepository productRepository;
  private final InventoryService inventoryService;

  public OrderService(OrderRepository or, ProductRepository pr, InventoryService is) {
    this.orderRepository = or;
    this.productRepository = pr;
    this.inventoryService = is;
  }
}
```

### DI-2 · `new InventoryService()`
**Fix:** annotate `InventoryService` with `@Service` and inject it. Then `@Transactional`
and any AOP on InventoryService finally fire.

### DI-3 · Missing `@Service` on `InventoryService`
**Fix:** add `@Service`. Pairs with DI-2.

---

## TX — Transactions

### TX-1 · `placeOrder` not transactional
**Fix:**
```java
@Transactional
public Order placeOrder(...) { ... }
```
- Inventory decrement + order save now succeed or roll back together.
- Failure mode to test: throw inside the loop after one product is decremented.
  Before fix: inventory mutated, no order. After fix: nothing changed.

### TX-2 · Read methods not marked `readOnly`
**Fix:** `@Transactional(readOnly = true)` on `getById`, `listOrders`, etc. Hibernate
skips dirty-checking, some DBs route to read replicas.

### TX-3 · `productService.create` not transactional
**Fix:** wrap in `@Transactional`. Currently fine *only* because `save()` opens its own.

---

## PERF — Performance

### PERF-1..PERF-4 · EAGER everywhere → N+1
**Fix:**
- Switch all `fetch = FetchType.EAGER` to `LAZY` (the default for @ManyToOne, but
  set explicitly for @OneToMany).
- For "load product with reviews", use `@EntityGraph(attributePaths = "reviews")`
  on the repository method.
- OR use a JPQL `JOIN FETCH`:
  ```java
  @Query("select distinct p from Product p left join fetch p.reviews where p.id = :id")
  Optional<Product> findByIdWithReviews(@Param("id") Long id);
  ```
- Verify with `spring.jpa.properties.hibernate.generate_statistics=true` and look
  for `Statistics: N queries`.

### PERF-5 · `findById` in a loop in `placeOrder`
**Fix:**
```java
List<Product> products = productRepository.findAllById(productIdToQty.keySet());
Map<Long, Product> byId = products.stream().collect(toMap(Product::getId, identity()));
```
One query instead of N.

---

## MODEL — Modeling

### MODEL-1 · Entities exposed via JSON
**Fix:** Java records as DTOs:
```java
public record ProductDto(Long id, String name, BigDecimal price, int stock, List<ReviewDto> reviews) {
  public static ProductDto from(Product p) {
    return new ProductDto(
      p.getId(),
      p.getName(),
      p.getPrice(),
      p.getStock(),
      p.getReviews().stream().map(ReviewDto::from).toList()
    );
  }
}
public record ReviewDto(Long id, int rating, String comment) {
  public static ReviewDto from(Review r) {
    return new ReviewDto(r.getId(), r.getRating(), r.getComment());
  }
}
```
Records give you: immutability, equals/hashCode, accessors, deconstruction in
pattern matching. Use them everywhere DTOs used to be POJOs.

### MODEL-2 · No validation on entities (or on the DTOs once you have them)
```java
public record CreateProductRequest(
  @NotBlank @Size(max = 200) String name,
  @NotNull @DecimalMin("0.00") BigDecimal price,
  @PositiveOrZero int stock
) {}
```
Pair with `@Valid` on the controller (VALID-2).

### MODEL-3 · Money modeling
**Options:**
- Stick with BigDecimal everywhere, document the rounding rule.
- Add a `Money` value object (record): `Money(BigDecimal amount, Currency currency)`.
- Joda-Money library if you go multi-currency.

### MODEL-4 · equals/hashCode
**Fix:**
```java
@Override public boolean equals(Object o) {
  if (this == o) return true;
  if (!(o instanceof Product other)) return false;
  return id != null && id.equals(other.id);
}
@Override public int hashCode() { return getClass().hashCode(); }
```
The "use the class's hash, not the id's hash" trick handles proxies and pre-persist
objects without violating the equals/hashCode contract.

### MODEL-7 · String status
**Fix:**
```java
public enum OrderStatus { PENDING, PAID, SHIPPED, CANCELLED }

@Enumerated(EnumType.STRING)
private OrderStatus status;
```
Now the switch in `describeStatus` becomes exhaustive (PATTERN-1).

---

## REPO — Repository design

### REPO-1 · Returning entities to controllers
See MODEL-1 + use Spring Data **interface projections** for read-heavy endpoints:
```java
public interface ProductSummary {
  Long getId();
  String getName();
  BigDecimal getPrice();
}
List<ProductSummary> findBy();   // Spring builds the SELECT for just these columns
```

### REPO-2 · No `@EntityGraph`
```java
@EntityGraph(attributePaths = "reviews")
Optional<Product> findById(Long id);
```

### REPO-3 · No pagination
```java
Page<Product> findAll(Pageable pageable);
```
Then:
```java
@GetMapping
public Page<ProductDto> list(@PageableDefault(size = 20) Pageable pageable) { ... }
```

### REPO-4 · Case-sensitive search
**Fix:**
```java
List<Product> findByNameContainingIgnoreCase(String name);
```
Or for full-text: PostgreSQL `tsvector` + a native query, or Elasticsearch.

---

## REST — REST design

### REST-1 · `/product` (singular)
**Fix:** `/products`. Plural is the convention for collections; singular is fine
for non-resource endpoints (`/login`, `/health`).

### REST-2 · No API version
**Fix:** `/api/v1/products`. Cheap insurance — when v2 ships, v1 keeps working.

### REST-3 · Inconsistent response shapes
**Options:**
- Stop wrapping: return DTO directly, status code carries success/failure.
- Envelope: `record ApiResponse<T>(T data, ApiError error)` — useful when you need
  partial-success or warnings.

### REST-4 · Returning entity
See MODEL-1.

### REST-5 · 200 null instead of 404
**Fix:**
```java
public ProductDto byId(@PathVariable Long id) {
  return service.getById(id)
    .map(ProductDto::from)
    .orElseThrow(() -> new ProductNotFoundException(id));
}
```
Pair with ERR-3.

### REST-6 · POST without Location header
```java
@PostMapping
public ResponseEntity<ProductDto> create(@Valid @RequestBody CreateProductRequest req) {
  Product saved = service.create(req);
  URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{id}").buildAndExpand(saved.getId()).toUri();
  return ResponseEntity.created(location).body(ProductDto.from(saved));
}
```

### REST-7 · DELETE returns void
**Fix:**
```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id) {
  service.delete(id);
  return ResponseEntity.noContent().build();   // 204
}
```

### REST-8 · Raw Map request body
**Fix:** the `OrderRequest` record shown in the FIXME. Use `Map<@Positive Long, @Positive Integer>`
with bean-validation on map entries (yes, supported).

### REST-9 · No pagination/auth on /orders
Combine REPO-3 (pagination) with SECURITY-1 (Spring Security, restrict to user's own
orders).

---

## VALID — Validation

### VALID-1 · No stock check in `placeOrder`
**Fix:** in `OrderService.placeOrder` before decrementing:
```java
if (product.getStock() < qty) {
  throw new InsufficientStockException(product.getId(), product.getStock(), qty);
}
```

### VALID-2 · No `@Valid` on `POST /product`
**Fix:** `@Valid @RequestBody CreateProductRequest req`. Spring will throw
`MethodArgumentNotValidException` for any failure, which the next FIXME handles.

---

## ERR — Error handling

### ERR-1 · `.orElseThrow()` no-arg
**Fix:** define and throw a domain exception:
```java
public class ProductNotFoundException extends RuntimeException {
  private final Long productId;
  public ProductNotFoundException(Long id) { super("Product " + id + " not found"); this.productId = id; }
  public Long getProductId() { return productId; }
}
```

### ERR-2 · Returning null
**Fix:** return `Optional<Product>` and let the controller throw the domain exception.

### ERR-3 · Old-school String body
**Fix:** ProblemDetail (RFC 7807) is the SB4 standard:
```java
@ExceptionHandler(ProductNotFoundException.class)
public ProblemDetail handle(ProductNotFoundException ex) {
  ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
  pd.setType(URI.create("https://brokenshop/errors/product-not-found"));
  pd.setProperty("productId", ex.getProductId());
  return pd;
}
```
Response (auto-serialized with `Content-Type: application/problem+json`):
```json
{
  "type": "https://brokenshop/errors/product-not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Product 9999 not found",
  "productId": 9999
}
```

### ERR-4 · Catching JDK exception for domain concept
Falls out of ERR-1 + ERR-3.

### ERR-5 · No validation/parse handlers
**Fix:** SB4 already returns ProblemDetail for `MethodArgumentNotValidException` if
you don't override it. But to add field-level details:
```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
  ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
  pd.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
    .map(fe -> Map.of("field", fe.getField(), "message", fe.getDefaultMessage()))
    .toList());
  return pd;
}
```

### ERR-6 · Catching `Exception`
**Fix:** delete the handler — Spring's default handler produces a ProblemDetail with
500 already. If you must keep it, at least `log.error("Unhandled", ex)` first.

---

## SECURITY — Security

### SECURITY-1 · No auth at all
**Fix:** Add `spring-boot-starter-security`. Minimal config:
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
  @Bean SecurityFilterChain chain(HttpSecurity http) throws Exception {
    return http
      .csrf(c -> c.disable())   // for the JSON API; keep CSRF for cookie-based apps
      .authorizeHttpRequests(a -> a
        .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
        .anyRequest().authenticated())
      .httpBasic(Customizer.withDefaults())
      .build();
  }
}
```
Then `@PreAuthorize("hasRole('ADMIN')")` on DELETE.

---

## CONFIG — Configuration

### CONFIG-1 · `ddl-auto: update`
**Fix:** add Flyway:
```xml
<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-core</artifactId>
</dependency>
```
Switch to `ddl-auto: validate` and put schema in `src/main/resources/db/migration/V1__init.sql`.

### CONFIG-2 · `show-sql` always on
**Fix:**
```yaml
spring:
  jpa:
    show-sql: false
logging.level.org.hibernate.SQL: DEBUG    # only when you need it locally
```

### CONFIG-3 · No profiles
**Fix:** create `application-dev.yml` and `application-prod.yml`, run with
`--spring.profiles.active=dev`.

### CONFIG-4 · Hardcoded config values
**Fix:** environment variables + `${...}` placeholders, or 1Password CLI / Vault.

### CONFIG-5 · Scattered `@Value`
**Fix:**
```java
@ConfigurationProperties(prefix = "shop")
@Validated
public record ShopProperties(
  @DecimalMin("0.00") BigDecimal taxRate,
  @Positive int defaultPageSize
) {}

@Configuration
@EnableConfigurationProperties(ShopProperties.class)
public class ShopConfig {}
```
Now in `application.yml`:
```yaml
shop:
  tax-rate: 0.07
  default-page-size: 20
```
And in any service: `public ProductService(ShopProperties props) { ... }`.

---

## PATTERN — Java 21 patterns

### PATTERN-1 · Old-style if/equals chain
After MODEL-7 (real enum), this becomes:
```java
public String describeStatus(Order order) {
  return switch (order.getStatus()) {
    case PENDING   -> "Awaiting payment";
    case PAID      -> "Ready to ship";
    case SHIPPED   -> "On its way";
    case CANCELLED -> "Cancelled";
    case null      -> "Unknown";   // null-pattern, Java 21
    // no default needed — enum is exhaustive
  };
}
```

### PATTERN-2 · Mutating without validating
```java
public void decrementStock(Product product, int qty) {
  if (qty <= 0) throw new IllegalArgumentException("qty must be positive");
  if (product.getStock() < qty) throw new InsufficientStockException(product.getId(), product.getStock(), qty);
  product.setStock(product.getStock() - qty);
}
```

---

## SEED — Data loading

### SEED-1 · Seed runs every boot
**Options:**
- `@Profile("dev")` on the bean.
- `data.sql` in `src/main/resources` (runs once after schema creation when
  `spring.sql.init.mode=always`).
- Flyway migration V001__seed_demo_data.sql, only applied when `spring.flyway.locations`
  includes a dev folder.

---

## TS — Java type safety

### TS-1 · Unchecked cast in `OrderController.placeOrder`
Falls out of REST-8 (use OrderRequest record).

---

## CACHE — Caching

### CACHE-1 / CACHE-2 · Hand-rolled cache in `PricingService`
Use `@Cacheable` + Caffeine:
```java
@Service
@EnableCaching
public class PricingService {
  @Cacheable(value = "pricing", key = "#product.id")
  public BigDecimal calculate(Product product) { ... }
}
```
```yaml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=10000,expireAfterWrite=10m
```
Add `@EnableCaching` to your application class (or a `@Configuration` class).
Use the product **id** as the key — never the proxy object.

---

## CONCURRENCY — Concurrency

### CONCURRENCY-1 · `HashMap` shared across threads
Either:
- Replace with `ConcurrentHashMap`.
- Better: dump the manual cache, use `@Cacheable` (see CACHE-1).

---

## ASYNC — Async / blocking

### ASYNC-1 · Synchronous email in order path
Three options, in order of complexity:

**A. `@Async` + thread pool:**
```java
@EnableAsync
@Configuration
public class AsyncConfig implements AsyncConfigurer {
  @Override public Executor getAsyncExecutor() {
    return new ThreadPoolTaskExecutor(); // or virtual-thread executor in SB4
  }
}

@Async
public void sendConfirmation(Order order) { ... }
```

**B. Spring events (preferred for "after order placed"):**
```java
// in OrderService
applicationEventPublisher.publishEvent(new OrderPlacedEvent(saved.getId()));

// elsewhere
@Async
@EventListener
public void onOrderPlaced(OrderPlacedEvent ev) {
  // load + email
}
```

**C. `@TransactionalEventListener(AFTER_COMMIT)` — only fires after DB commit:**
```java
@Async
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onOrderPlaced(OrderPlacedEvent ev) { ... }
```
This is the *correct* answer if you want at-least-once email-after-commit semantics
(combine with an outbox table for at-least-once delivery to external systems).

### ASYNC-2 · `Thread.sleep` pinning a platform thread
Becomes a non-issue after SB4-1 (virtual threads enabled).

### ASYNC-3 · Silent @Async exceptions
```java
@Override
public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
  return (ex, method, params) -> log.error("async {} failed", method.getName(), ex);
}
```

---

## LOG — Logging

### LOG-1 / LOG-2 · `System.out.println` in services
```java
private static final Logger log = LoggerFactory.getLogger(PricingService.class);
log.debug("Cache miss for product {}", productId);
```
Why:
- Levels (`trace/debug/info/warn/error`) configurable per package at runtime.
- Structured output goes to your log aggregator.
- Parameterized messages (`{}`) avoid string concat when the level is disabled.

In production, configure structured JSON logging:
```yaml
logging:
  structured:
    format:
      console: ecs   # Elastic Common Schema — works with Kibana
```
(Or use Logback's JSON encoder.)

---

## BUG — Outright bugs

### BUG-1 · Tax compounded twice in `PricingService`
```java
BigDecimal withTax = product.getPrice().multiply(BigDecimal.ONE.add(TAX))
                             .setScale(2, RoundingMode.HALF_UP);
```

### BUG-2 · Swallowed `InterruptedException`
```java
catch (InterruptedException e) {
  Thread.currentThread().interrupt();          // restore the interrupt flag
  throw new RuntimeException("interrupted", e); // or surface a domain exception
}
```

---

## TEST — Testing

### TEST-1 · Test asserts buggy value
Once BUG-1 is fixed, update the expectation to `$13.90` (or whatever your tax math
yields). Lesson: a green test isn't necessarily a correct test.

### TEST-2 · Wrong package
```
src/test/java/com/tutorials/brokenshop/service/PricingServiceTest.java
```

### TEST-3 · No integration coverage
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class ProductControllerIT {
  @Autowired MockMvc mvc;

  @Test
  void getMissingProductReturns404() throws Exception {
    mvc.perform(get("/api/v1/products/9999"))
       .andExpect(status().isNotFound())
       .andExpect(jsonPath("$.title").value("Not Found"));
  }
}
```

### TEST-4 · Switch to Testcontainers + Postgres
```java
@Testcontainers
@SpringBootTest
class OrderIntegrationTest {
  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", postgres::getJdbcUrl);
    r.add("spring.datasource.username", postgres::getUsername);
    r.add("spring.datasource.password", postgres::getPassword);
  }
  // ...
}
```

---

## Stretch goals (after the FIXMEs)

- Replace H2 with PostgreSQL via Testcontainers for tests.
- Add `spring-boot-starter-actuator` and explore `/actuator/health`, `/info`, `/metrics`.
- Add Micrometer + Prometheus, scrape locally.
- Write integration tests with `@SpringBootTest` + `@AutoConfigureMockMvc` and the
  new RestClient-based test slices in SB4.
- Try the new `HttpExchange` interface client to call an external API instead of
  `RestTemplate`.
- Add an event-driven flow with `ApplicationEventPublisher` (order placed → email service).
- Migrate from H2 + Hibernate to **R2DBC** + reactive (and compare — virtual threads
  usually beat reactive for blocking-heavy workloads now).
