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
      next={null}
    >
      <h2>Advanced Spring Boot Features</h2>
      <p>
        Beyond the fundamentals, Spring Boot offers a rich set of advanced features for
        building production-grade applications. This lesson covers Actuator for monitoring,
        caching, scheduling, async processing, application events, and Aspect-Oriented
        Programming (AOP).
      </p>

      <FlowChart
        title="Spring Boot Internals & Advanced Features"
        chart={"graph TD\nA[Spring Boot Application] --> B[Actuator]\nA --> C[Caching Layer]\nA --> D[Scheduling]\nA --> E[Async Processing]\nA --> F[Event System]\nA --> G[AOP / Aspects]\nB --> H[Health Checks]\nB --> I[Metrics / Prometheus]\nB --> J[Info Endpoint]\nC --> K[@Cacheable]\nC --> L[Cache Providers]\nD --> M[@Scheduled]\nE --> N[@Async]\nF --> O[ApplicationEvent]\nG --> P[Cross-Cutting Concerns]"}
      />

      <h3>Spring Boot Actuator</h3>
      <p>
        Actuator exposes production-ready endpoints for monitoring and managing your application.
        It provides health checks, metrics, environment details, and more. In production, you
        typically expose these behind a management port or secure them with Spring Security.
      </p>

      <CodeBlock language="java" title="ActuatorConfig.java">
{`// application.yml — Actuator configuration
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized
  info:
    env:
      enabled: true

// Custom Health Indicator
@Component
public class DatabaseHealthIndicator
        implements HealthIndicator {

    private final DataSource dataSource;

    public DatabaseHealthIndicator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                return Health.up()
                    .withDetail("database", "reachable")
                    .withDetail("latency", "< 2s")
                    .build();
            }
        } catch (SQLException e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
        return Health.down().build();
    }
}`}
      </CodeBlock>

      <h3>Caching with @Cacheable</h3>
      <p>
        Spring Boot provides a caching abstraction that works with various cache providers
        (Caffeine, Redis, EhCache). By annotating methods with <code>@Cacheable</code>,
        repeated calls with the same parameters return the cached result instead of
        executing the method again.
      </p>

      <CodeBlock language="java" title="CachingExample.java">
{`// Enable caching in your configuration
@SpringBootApplication
@EnableCaching
public class MyApp { }

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // Cache the result — subsequent calls with the same id
    // return the cached value without hitting the database
    @Cacheable(value = "products", key = "#id")
    public ProductDTO findById(Long id) {
        return productRepository.findById(id)
            .map(this::toDTO)
            .orElseThrow(() ->
                new ResourceNotFoundException("Product", id));
    }

    // Evict cache entry when product is updated
    @CacheEvict(value = "products", key = "#id")
    @Transactional
    public ProductDTO update(Long id, UpdateProductRequest req) {
        Product product = productRepository.findById(id)
            .orElseThrow(() ->
                new ResourceNotFoundException("Product", id));
        product.setName(req.name());
        product.setPrice(req.price());
        return toDTO(productRepository.save(product));
    }

    // Evict all entries in the cache
    @CacheEvict(value = "products", allEntries = true)
    @Scheduled(fixedRate = 3600000) // Every hour
    public void evictAllProductsCache() {
        // Cache is cleared by the annotation
    }
}`}
      </CodeBlock>

      <h3>Scheduling with @Scheduled</h3>
      <p>
        Spring Boot makes it easy to schedule recurring tasks using the <code>@Scheduled</code>
        annotation. Tasks can run at fixed intervals, with a fixed delay between completions,
        or on a cron schedule.
      </p>

      <CodeBlock language="java" title="ScheduledTasks.java">
{`@SpringBootApplication
@EnableScheduling
public class MyApp { }

@Component
public class ScheduledTasks {

    private final ReportService reportService;
    private final CleanupService cleanupService;

    public ScheduledTasks(ReportService reportService,
                          CleanupService cleanupService) {
        this.reportService = reportService;
        this.cleanupService = cleanupService;
    }

    // Run every 30 seconds
    @Scheduled(fixedRate = 30000)
    public void checkSystemHealth() {
        // Runs on a fixed schedule regardless of previous
        // execution duration
    }

    // Run 10 seconds after the previous execution completes
    @Scheduled(fixedDelay = 10000)
    public void processQueue() {
        // Waits for the previous run to finish before
        // starting the delay
    }

    // Cron expression: daily at 2:00 AM
    @Scheduled(cron = "0 0 2 * * ?")
    public void generateDailyReport() {
        reportService.generateDaily();
    }

    // Cron: every Monday at 6:00 AM
    @Scheduled(cron = "0 0 6 * * MON")
    public void weeklyCleanup() {
        cleanupService.removeExpiredSessions();
    }
}`}
      </CodeBlock>

      <h3>Async Processing with @Async</h3>
      <p>
        The <code>@Async</code> annotation lets you run methods asynchronously on a separate
        thread pool. This is useful for fire-and-forget operations like sending emails or
        processing background tasks that should not block the HTTP response.
      </p>

      <CodeBlock language="java" title="AsyncExample.java">
{`@SpringBootApplication
@EnableAsync
public class MyApp { }

@Configuration
public class AsyncConfig {

    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor =
            new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.initialize();
        return executor;
    }
}

@Service
public class NotificationService {

    private final EmailClient emailClient;

    public NotificationService(EmailClient emailClient) {
        this.emailClient = emailClient;
    }

    // Runs on a separate thread — caller does not wait
    @Async
    public void sendWelcomeEmail(String email, String name) {
        emailClient.send(email, "Welcome!",
            "Hello " + name + ", welcome to our platform!");
    }

    // Returns a Future so caller can optionally wait
    @Async
    public CompletableFuture<Report> generateReport(Long userId) {
        Report report = buildExpensiveReport(userId);
        return CompletableFuture.completedFuture(report);
    }
}`}
      </CodeBlock>

      <h3>Application Events</h3>
      <p>
        Spring provides an event system for decoupling components. One component publishes an
        event, and any number of listeners can react to it — without the publisher knowing
        about the listeners.
      </p>

      <CodeBlock language="java" title="EventSystem.java">
{`// Define a custom event
public class UserRegisteredEvent extends ApplicationEvent {
    private final User user;

    public UserRegisteredEvent(Object source, User user) {
        super(source);
        this.user = user;
    }

    public User getUser() { return user; }
}

// Publish the event
@Service
public class UserService {
    private final ApplicationEventPublisher eventPublisher;

    public UserService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public User register(CreateUserRequest request) {
        User user = createAndSaveUser(request);
        eventPublisher.publishEvent(
            new UserRegisteredEvent(this, user));
        return user;
    }
}

// Listen for the event
@Component
public class WelcomeEmailListener {

    private final NotificationService notificationService;

    public WelcomeEmailListener(NotificationService svc) {
        this.notificationService = svc;
    }

    @EventListener
    @Async
    public void onUserRegistered(UserRegisteredEvent event) {
        notificationService.sendWelcomeEmail(
            event.getUser().getEmail(),
            event.getUser().getDisplayName());
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Use AOP">
        <p>
          Aspect-Oriented Programming (AOP) is ideal for cross-cutting concerns — behavior that
          spans multiple classes but is not part of the core business logic. Common examples
          include logging, performance monitoring, security checks, transaction management, and
          retry logic. Spring uses AOP internally for <code>@Transactional</code>,
          <code>@Cacheable</code>, and <code>@Async</code>.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="LoggingAspect.java">
{`@Aspect
@Component
public class LoggingAspect {

    private static final Logger log =
        LoggerFactory.getLogger(LoggingAspect.class);

    // Log execution time for all service methods
    @Around("execution(* com.example.myapp.service.*.*(..))")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint)
            throws Throwable {
        long start = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;
            log.info("{} executed in {} ms", methodName, duration);
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("{} failed after {} ms: {}",
                      methodName, duration, e.getMessage());
            throw e;
        }
    }
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="Which annotation caches the return value of a method based on its parameters?"
        options={[
          "@Cached",
          "@Cacheable",
          "@CacheResult",
          "@EnableCaching"
        ]}
        correctIndex={1}
        explanation="@Cacheable caches the return value of a method. On subsequent calls with the same parameters, the cached result is returned without executing the method. @EnableCaching activates the caching infrastructure but does not cache any specific method. Use @CacheEvict to remove entries and @CachePut to always update the cache."
      />
    </LessonLayout>
  );
}
