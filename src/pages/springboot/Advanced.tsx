import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Advanced() {
  return (
    <LessonLayout
      title="Advanced Topics"
      sectionId="springboot"
      lessonIndex={9}
      prev={{ path: '/springboot/error', label: 'Error Handling & Validation' }}
      next={{ path: '/springboot/transactions', label: 'Transactions Deep-Dive' }}
    >
      <h2>Beyond the Basics</h2>
      <p>
        This lesson covers the smaller-but-important features every non-trivial service
        eventually reaches for: scheduling, async execution, application events, caching,
        and a lightning-tour of Actuator and AOP. The last two get dedicated deep-dive
        lessons — <em>Observability</em> and <em>AOP & Interceptors</em>.
      </p>

      <FlowChart
        title="Advanced feature map"
        chart={"graph TD\nA[Spring Boot App] --> B[@Scheduled]\nA --> C[@Async]\nA --> D[Application Events]\nA --> E[@Cacheable]\nA --> F[Actuator]\nA --> G[AOP / Aspects]\nF -.dedicated.-> H[Observability lesson]\nG -.dedicated.-> I[AOP & Interceptors lesson]"}
      />

      <h2>Scheduled Tasks — @Scheduled</h2>
      <p>
        Fire a method on a fixed rate, fixed delay, or cron expression. Trivial to write,
        surprisingly full of foot-guns at scale.
      </p>

      <CodeBlock language="java" title="The three shapes of @Scheduled">
{`@Configuration
@EnableScheduling
public class SchedulingConfig { }

@Component
public class Housekeeping {

    // Fixed rate — starts every 60 seconds, regardless of how long the previous run took.
    // If the previous run is still executing, the next fires anyway (subject to pool size).
    @Scheduled(fixedRate = 60_000)
    public void cleanupTempFiles() { /* ... */ }

    // Fixed delay — waits N ms AFTER the previous run completes.
    // The safe default when runs may overlap or backpressure the DB.
    @Scheduled(fixedDelay = 60_000)
    public void computeStatistics() { /* ... */ }

    // Cron — six-field expression with support for timezones.
    @Scheduled(cron = "0 15 3 * * *", zone = "America/Los_Angeles")
    public void nightlyReindex() { /* ... */ }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The default scheduler pool has ONE thread">
        <p>
          Every <code>@Scheduled</code> method runs on a single-threaded
          <code>ScheduledTaskScheduler</code> unless you configure otherwise. A slow job
          blocks every other job. Configure a proper pool:
        </p>
      </InfoBox>
      <CodeBlock language="java" title="A sane scheduler configuration">
{`@Configuration
@EnableScheduling
public class SchedulingConfig implements SchedulingConfigurer {
    @Override
    public void configureTasks(ScheduledTaskRegistrar registrar) {
        var executor = Executors.newScheduledThreadPool(
            4, Thread.ofVirtual().name("scheduled-", 1L).factory());
        registrar.setScheduler(executor);
    }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Scheduled tasks in a multi-instance deployment">
        <p>
          Every replica of your service runs its own <code>@Scheduled</code> methods. If you
          have 5 replicas, the nightly reindex runs 5 times. For most jobs, either:
        </p>
        <ul>
          <li>Use distributed locking (Shedlock is the go-to library — one row in a DB
              acts as the shared mutex).</li>
          <li>Move the job to a real scheduler (Kubernetes CronJob, cloud scheduler)
              that runs against your API rather than inside the pod.</li>
        </ul>
      </InfoBox>

      <h2>Async Execution — @Async</h2>
      <p>
        Non-blocking method invocation. The method returns immediately (or gives you a
        <code>CompletableFuture</code>); the work runs on a Spring-managed executor.
      </p>

      <CodeBlock language="java" title="Async methods, two flavors">
{`@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean("emailExecutor")
    public Executor emailExecutor() {
        var executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("email-");
        // Task decorator preserves MDC / trace context across threads.
        executor.setTaskDecorator(new ContextPropagatingTaskDecorator());
        executor.initialize();
        return executor;
    }
}

@Service
public class WelcomeMailer {

    // Fire-and-forget. Return type must be void or CompletableFuture.
    @Async("emailExecutor")
    public void sendWelcome(User user) { /* ... */ }

    // Awaitable — caller can chain further work.
    @Async("emailExecutor")
    public CompletableFuture<Void> sendReceipt(Order order) {
        // ... slow work
        return CompletableFuture.completedFuture(null);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Three traps every @Async user hits eventually">
        <ul>
          <li>
            <strong>Self-invocation.</strong> Calling <code>this.asyncMethod()</code>
            bypasses the proxy — the annotation is silently ignored (same story as
            <code>@Transactional</code>).
          </li>
          <li>
            <strong>Return type must be <code>void</code> or <code>CompletableFuture</code>.</strong>
            An <code>@Async</code> method returning a plain object gives you
            <code>null</code>. Silent bug.
          </li>
          <li>
            <strong>MDC / SecurityContext / RequestContext don't propagate by default.</strong>
            The async thread has no correlation ID, no authenticated user, no locale. Use
            a <code>TaskDecorator</code> that captures and restores these before invocation.
          </li>
        </ul>
      </InfoBox>

      <h2>Application Events</h2>
      <p>
        In-process pub/sub. Emit an event when something happens; other beans listen
        without either side knowing about each other. Great for decoupling side effects
        from the primary flow.
      </p>

      <CodeBlock language="java" title="Publishing and listening">
{`public record OrderPlacedEvent(UUID orderId, String customerEmail, Instant at) { }

@Service
public class OrderService {
    private final ApplicationEventPublisher publisher;
    private final OrderRepository orders;

    public OrderService(ApplicationEventPublisher publisher, OrderRepository orders) {
        this.publisher = publisher;
        this.orders = orders;
    }

    @Transactional
    public Order place(NewOrderRequest req) {
        Order order = orders.save(Order.from(req));
        publisher.publishEvent(
            new OrderPlacedEvent(order.id(), req.email(), Instant.now()));
        return order;
    }
}

@Component
public class EmailListener {

    // Runs synchronously in the same thread as the publisher by default.
    @EventListener
    public void onOrderPlaced(OrderPlacedEvent event) {
        // send email — WARNING: if this throws, it rolls back the transaction!
    }
}`}
      </CodeBlock>

      <h3>@TransactionalEventListener — the safer default</h3>
      <p>
        Ordinary <code>@EventListener</code> runs <em>inside</em> the publishing transaction.
        If the listener fails, the whole transaction rolls back. Almost always the wrong
        default — you don't want a failed email to un-place an order.
      </p>
      <CodeBlock language="java" title="Fire the listener AFTER the transaction commits">
{`@Component
public class EmailListener {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("emailExecutor")           // combine with @Async so it doesn't block the caller
    public void onOrderPlaced(OrderPlacedEvent event) {
        // Only runs after the order is safely committed.
        // Failure here doesn't affect the order.
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Events for cross-cutting, not for main flow">
        <p>
          Events shine for cross-cutting side effects: audit logs, metrics, notifications,
          cache invalidation. They're a poor tool for the main business flow, where a
          direct method call gives you a clearer stack trace and easier reasoning about
          ordering. If you find yourself relying on event <em>ordering</em>, you've
          reinvented a queue in-process — reach for actual Kafka.
        </p>
      </InfoBox>

      <h2>Caching — @Cacheable</h2>
      <p>
        Method-level caching with pluggable backends (in-memory, Redis, Caffeine).
      </p>
      <CodeBlock language="java" title="Enabling caches">
{`@SpringBootApplication
@EnableCaching
public class Application { /* ... */ }

@Service
public class CustomerService {

    // First call executes; subsequent calls with the same key return the cached value.
    @Cacheable(cacheNames = "customerById", key = "#id")
    public CustomerDto findById(UUID id) { /* ... */ }

    // Evict when the underlying data changes.
    @CacheEvict(cacheNames = "customerById", key = "#id")
    public void update(UUID id, UpdateRequest req) { /* ... */ }

    // Update AND cache — the return value replaces the cache entry.
    @CachePut(cacheNames = "customerById", key = "#result.id()")
    public CustomerDto refreshFromSource(UUID id) { /* ... */ }
}`}
      </CodeBlock>

      <CodeBlock language="yaml" title="Configuring cache providers">
{`# Simple in-memory (default) — fine for a single instance
spring:
  cache:
    type: simple

# Caffeine — high-performance in-process
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=10000,expireAfterWrite=10m

# Redis — shared across replicas
spring:
  cache:
    type: redis
    redis:
      time-to-live: 10m
      key-prefix: "myapp:"
      cache-null-values: false`}
      </CodeBlock>

      <InfoBox variant="warning" title="Cache gotchas that always come up in code review">
        <ul>
          <li>Self-invocation trap — same rule as everything else AOP.</li>
          <li>Caching <code>null</code> returns is off by default in Redis; on for
              Simple/Caffeine. Set <code>cache-null-values</code> deliberately.</li>
          <li>Cache keys derived from mutable objects break when the object changes.
              Use a stable key (primitive or record).</li>
          <li>Cross-service cache invalidation is hard — if you cache in service A and
              service B changes the row, A doesn't know. Prefer short TTLs unless you have
              a real invalidation channel.</li>
        </ul>
      </InfoBox>

      <h2>Actuator — Quick Tour</h2>
      <p>
        Spring Boot Actuator exposes operational endpoints. The <em>Observability</em>
        lesson covers this in depth; the essentials:
      </p>
      <CodeBlock language="yaml" title="Endpoints and access">
{`management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
      base-path: /actuator
  endpoint:
    health:
      probes:
        enabled: true            # separate /health/liveness and /health/readiness
      show-details: when_authorized
    metrics:
      access: read-only          # Boot 3.4+ style
  server:
    port: 8081                   # optional: expose management on a different port

# The core endpoints:
#   /actuator/health          — up/down for load balancer
#   /actuator/health/liveness — is the pod alive? (Kubernetes)
#   /actuator/health/readiness— can the pod serve traffic?
#   /actuator/info            — build info, git commit
#   /actuator/metrics         — Micrometer meter dump
#   /actuator/prometheus      — Prometheus scrape endpoint
#   /actuator/loggers         — inspect and CHANGE log levels at runtime`}
      </CodeBlock>

      <InfoBox variant="danger" title="Don't expose everything in production">
        <p>
          Endpoints like <code>/actuator/env</code>, <code>/actuator/configprops</code>,
          <code>/actuator/beans</code>, and <code>/actuator/heapdump</code> leak sensitive
          info. Either don't expose them, or serve management on a separate port that only
          the platform network can reach.
        </p>
      </InfoBox>

      <h3>Custom health indicators</h3>
      <CodeBlock language="java" title="Add your own health check">
{`@Component
public class CatalogApiHealthIndicator implements HealthIndicator {

    private final CatalogClient client;
    public CatalogApiHealthIndicator(CatalogClient client) { this.client = client; }

    @Override
    public Health health() {
        try {
            client.ping();
            return Health.up().build();
        } catch (Exception e) {
            return Health.down().withDetail("error", e.getMessage()).build();
        }
    }
}`}
      </CodeBlock>

      <h2>AOP — Quick Tour</h2>
      <p>
        Aspect-Oriented Programming lets you weave cross-cutting logic (logging, timing,
        security checks) into methods without modifying them. The <em>AOP & Interceptors</em>
        lesson goes deep; here's the shape.
      </p>
      <CodeBlock language="java" title="A timing aspect">
{`@Aspect
@Component
public class TimingAspect {

    @Around("@annotation(Timed)")
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();
        } finally {
            long nanos = System.nanoTime() - start;
            Metrics.timer("method.duration",
                "method", pjp.getSignature().toShortString()).record(nanos, NANOSECONDS);
        }
    }
}

@Target(ElementType.METHOD) @Retention(RetentionPolicy.RUNTIME)
public @interface Timed { }

// Now any method annotated @Timed is measured automatically.
@Service
public class ReportService {
    @Timed
    public byte[] generate(ReportRequest req) { /* ... */ }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer built-in features to hand-rolled AOP">
        <p>
          Spring already provides aspects for <code>@Transactional</code>,
          <code>@Async</code>, <code>@Cacheable</code>, and <code>@Timed</code>
          (via Micrometer). Roll your own when you have a genuinely custom concern:
          audit logging with structured fields, PII redaction, tenant scoping.
        </p>
      </InfoBox>

      <h2>Startup Profiling with ApplicationRunner and CommandLineRunner</h2>
      <p>
        Sometimes you want to run code after the context is up but before requests are
        served: warm caches, seed data, sanity-check a downstream, run a data migration.
      </p>
      <CodeBlock language="java" title="Runners are ordered and can fail startup">
{`@Component
public class CacheWarmer implements ApplicationRunner {

    private final PriceService prices;
    public CacheWarmer(PriceService prices) { this.prices = prices; }

    @Override
    public void run(ApplicationArguments args) {
        prices.warmTopN(1000);   // block startup until done
    }
}

// Prefer ApplicationRunner over CommandLineRunner — it gives you parsed args,
// not the raw String[]. Both accept @Order for ordering multiple runners.`}
      </CodeBlock>

      <h2>Where to Go From Here</h2>
      <p>
        Each of the following gets its own lesson in this section:
      </p>
      <ul>
        <li><strong>Transactions Deep-Dive</strong> — propagation, isolation, rollback rules,
            and the traps that eat production data.</li>
        <li><strong>Kafka in Spring</strong> — producers, consumers, container factories,
            error handling, and idempotence.</li>
        <li><strong>AOP & Interceptors</strong> — proxies vs bytecode weaving, ordering
            aspects, cross-cutting patterns like PII masking.</li>
        <li><strong>Observability</strong> — Micrometer, Observation API, structured logging,
            OpenTelemetry.</li>
        <li><strong>Boot 4 Novelties</strong> — RestClient, <code>@HttpExchange</code>,
            virtual threads, ProblemDetail, structured concurrency.</li>
      </ul>

      <InteractiveChallenge
        question="You annotate a service method with @Async and call it from another method in the same class with this.doWorkAsync(). It runs synchronously — why?"
        options={[
          "@Async only works on public methods; check the visibility",
          "You forgot @EnableAsync on a @Configuration class",
          "Self-invocation via 'this' bypasses the Spring AOP proxy, so the @Async annotation is silently ignored",
          "The default executor pool is exhausted"
        ]}
        correctIndex={2}
        explanation="Same self-invocation trap that plagues @Transactional, @Cacheable, and every other proxy-based annotation. Spring's async behavior lives in a proxy that wraps your bean. Calls through 'this' go directly to the underlying method, bypassing the proxy. Fix by moving the call out of the class (into a caller), injecting the bean into itself with @Lazy, or restructuring so the async method is on a separate service."
      />
    </LessonLayout>
  );
}
