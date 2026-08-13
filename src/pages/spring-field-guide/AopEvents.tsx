import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringAopEvents() {
  return (
    <PosterLayout
      accent="emerald"
      eyebrow="Spring Boot 4 · Field Reference"
      title="AOP & Async Events"
      tagline="Writing aspects that actually weave, async execution, application events, and @Cacheable — the positive mechanics, gotchas live on the Gotchas page."
      meta={['Spring Boot 4', '12 patterns']}
      footerLabel="Personal study reference — Spring Boot"
      pageLabel="Spring Field Guide · AOP & Async Events"
      prev={{ path: '/spring-field-guide/spring-security', label: 'Spring Security' }}
      next={{ path: '/spring-field-guide/spring-testing', label: 'Spring Testing' }}
    >
      <PosterCard
        glyph="Vs"
        title={<>Spring AOP<span className="dim"> vs AspectJ</span></>}
        language="text"
        code={`Spring AOP   Proxy-based. Only PUBLIC methods called through
             the Spring proxy. Fast, no build-time magic.
             Covers 95% of enterprise needs.

AspectJ      Full AOP language, compile/load-time bytecode
             weaving. Can intercept private methods and
             self-invocations too — needs a special agent.

Default to Spring AOP. Reach for AspectJ only with a proven
need: field interception, self-invocation matching, measured
proxy overhead.`}
        caption="Two technologies sharing a name. Almost everything on this page is Spring AOP — proxy-based, which is why self-invocation and private methods can't be woven (see the Gotchas page)."
      />

      <PosterCard
        glyph="An"
        title={<>Annotation-based pointcut<span className="dim"> — the clean style</span></>}
        language="java"
        code={`@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited { String value() default ""; }

@Aspect
@Component
public class AuditAspect {
    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint pjp, Audited audited)
            throws Throwable {
        var start = Instant.now();
        try {
            Object result = pjp.proceed();
            record(audited.value(), pjp, start, null);
            return result;
        } catch (Throwable t) {
            record(audited.value(), pjp, start, t);
            throw t;
        }
    }
}
// Usage: @Audited("order.place") on any method, anywhere.`}
        caption="Define a marker annotation, match on it with @annotation(...), and any method anywhere in the app opts in just by wearing the annotation — the readable, idiomatic pointcut style."
      />

      <PosterCard
        glyph="Pk"
        title={<>Package/type pointcut<span className="dim"> — execution() + @within</span></>}
        language="java"
        code={`@Aspect
@Component
public class ServiceLayerLogging {

    @Pointcut("execution(* com.example..service..*.*(..)) " +
              "&& @within(org.springframework.stereotype.Service)")
    public void anyServiceMethod() { }

    @Around("anyServiceMethod()")
    public Object logExceptions(ProceedingJoinPoint pjp) throws Throwable {
        try { return pjp.proceed(); }
        catch (Exception e) {
            log.error("Exception in {}: {}",
                pjp.getSignature().toShortString(), e.getMessage());
            throw e;
        }
    }
}`}
        caption="Blanket coverage without touching every class — matches every method under a package that's also annotated @Service. Broader and more reflection-heavy than annotation matching, so keep it scoped."
      />

      <PosterCard
        glyph="Ad"
        title={<>Advice types<span className="dim"> — when each fires</span></>}
        language="text"
        code={`@Before          before the method. Can't alter args/return.
@AfterReturning  after normal return. Can inspect (not alter) result.
@AfterThrowing   on exception. Log or transform via a wrapping aspect.
@After           after return OR exception. finally-style cleanup.
@Around          full control — wraps the call, must invoke
                 pjp.proceed(). Can alter args/return/swallow errors.
                 Most flexible; almost always what you want.`}
        caption="Default to @Around unless you specifically need the simplicity of one of the others — it's the only advice type that can change what the caller actually receives."
      />

      <PosterCard
        glyph="Or"
        title={<>Aspect ordering<span className="dim"> — @Order</span></>}
        language="java"
        code={`@Aspect @Component @Order(1) public class TransactionAspect { }
@Aspect @Component @Order(2) public class SecurityAspect    { }
@Aspect @Component @Order(3) public class LoggingAspect     { }

// Lower @Order = outer. Call order becomes:
//   Logging -> Security -> Transaction -> target
//   -> Transaction -> Security -> Logging`}
        caption="When multiple aspects (including built-ins like @Transactional) match the same method, @Order controls nesting — without it, ordering is unspecified and can flip between builds."
      />

      <PosterCard
        glyph="Fi"
        title={<>Filters vs Interceptors vs Aspects<span className="dim"></span></>}
        language="text"
        code={`Servlet Filter        Earliest. Raw request/response bytes.
                       Security headers, GZIP, request-id injection.
HandlerInterceptor     After handler mapping; knows the controller
                       method. Per-endpoint metrics, auth preHandle.
@RestControllerAdvice  Exception boundary; can wrap response bodies.
@Aspect                Any bean method via proxy. Service-layer
                       concerns: auditing, masking, custom retries.

Rule: choose the LEAST intrusive tool that covers the case.
HTTP concern -> Filter/Interceptor. Service concern -> Aspect.`}
        caption="Picking the wrong layer is a common review comment — an @Aspect for something that's purely an HTTP header concern is over-engineering; a Filter can't see your service-layer method signatures."
      />

      <PosterCard
        glyph="As"
        title={<>@Async<span className="dim"> — two flavors + a real executor</span></>}
        language="java"
        code={`@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean("emailExecutor")
    public Executor emailExecutor() {
        var ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(4); ex.setMaxPoolSize(8); ex.setQueueCapacity(500);
        ex.setTaskDecorator(new ContextPropagatingTaskDecorator());
        ex.initialize();
        return ex;
    }
}

@Service
public class WelcomeMailer {
    @Async("emailExecutor")                          // fire-and-forget
    public void sendWelcome(User user) { }

    @Async("emailExecutor")                          // awaitable
    public CompletableFuture<Void> sendReceipt(Order o) {
        return CompletableFuture.completedFuture(null);
    }
}`}
        caption="Always name an explicit executor bean — the default SimpleAsyncTaskExecutor spins up an unbounded thread per call, no pooling, no backpressure."
      />

      <PosterCard
        glyph="!"
        badge="Gotcha"
        title={<>@Async traps<span className="dim"> beyond self-invocation</span></>}
        language="text"
        code={`Return type must be void or CompletableFuture<T>.
  A plain object return type silently gives the caller null.

MDC / SecurityContext / RequestContext don't propagate.
  The async thread has no correlation id, no authenticated
  user, no locale — unless a TaskDecorator captures and
  restores them before invocation.`}
        caption="These bite even when self-invocation isn't the issue — a service method returning a DTO instead of CompletableFuture<DTO> compiles clean and returns null to every caller."
      />

      <PosterCard
        glyph="Ev"
        title={<>Application events<span className="dim"> — in-process pub/sub</span></>}
        language="java"
        code={`public record OrderPlacedEvent(UUID orderId, String email, Instant at) { }

@Service
public class OrderService {
    private final ApplicationEventPublisher publisher;

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
    @EventListener                    // runs SYNCHRONOUSLY, same thread
    public void onOrderPlaced(OrderPlacedEvent e) { }  // throws -> rolls back tx!
}`}
        caption="Decouples side effects from the primary flow — but plain @EventListener runs inside the publishing transaction by default, so a failing listener rolls back the order save too."
      />

      <PosterCard
        glyph="Tc"
        title={<>@TransactionalEventListener<span className="dim"> — the safer default</span></>}
        language="java"
        code={`@Component
public class EmailListener {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("emailExecutor")           // combine so it doesn't block the caller
    public void onOrderPlaced(OrderPlacedEvent event) {
        // Only runs once the order is safely committed.
        // A failure here can't undo the order.
    }
}`}
        caption="Fires only after the publishing transaction commits — a failed email send can no longer un-place an order. Almost always what you actually want over plain @EventListener."
      />

      <PosterCard
        glyph="Ch"
        title={<>@Cacheable<span className="dim"> family</span></>}
        language="java"
        code={`@SpringBootApplication
@EnableCaching
public class Application { }

@Service
public class CustomerService {
    @Cacheable(cacheNames = "customerById", key = "#id")
    public CustomerDto findById(UUID id) { }

    @CacheEvict(cacheNames = "customerById", key = "#id")
    public void update(UUID id, UpdateRequest req) { }

    @CachePut(cacheNames = "customerById", key = "#result.id()")
    public CustomerDto refreshFromSource(UUID id) { }   // updates AND caches
}
// spring.cache.type: simple | caffeine | redis`}
        caption="@Cacheable skips the method on a hit, @CacheEvict removes an entry, @CachePut always runs the method and replaces the cache entry with its result — pick by whether you need the method to execute."
      />

      <PosterCard
        glyph="Rt"
        title={<>Spring Retry<span className="dim"> — @Retryable</span></>}
        language="java"
        code={`@Configuration
@EnableRetry
public class RetryConfig { }

@Service
public class CatalogClient {
    @Retryable(retryFor = { RemoteApiException.class },
               maxAttempts = 4,
               backoff = @Backoff(delay = 200, multiplier = 2.0, maxDelay = 5000))
    public ProductDto get(String id) {
        return http.get("/products/" + id, ProductDto.class);
    }

    @Recover
    public ProductDto recoverGet(RemoteApiException e, String id) {
        return ProductDto.unavailable(id);
    }
}`}
        caption="Don't hand-roll a retry aspect for the common case — spring-retry gives you exponential backoff and a typed @Recover fallback declaratively, same proxy mechanism as everything else here."
      />

      <PosterCard
        glyph="Rz"
        title={<>Boot 4 resilience<span className="dim"> — retry moved into core</span></>}
        language="java"
        code={`// No spring-retry dependency on Boot 4 / Framework 7.
// Package: org.springframework.resilience
@EnableResilientMethods          // replaces @EnableRetry
@Configuration
class ResilienceConfig { }

@Service
public class CatalogClient {
    // backoff attributes are inline, not a nested @Backoff
    // and it's maxRetries (retries AFTER the first call), NOT maxAttempts
    @Retryable(includes = RemoteApiException.class,
               maxRetries = 3,
               delay = 200, multiplier = 2.0, maxDelay = 5000, jitter = 50)
    public ProductDto get(String id) { ... }

    // NO @Recover — core Spring has no fallback method. The last
    // exception propagates; catch it at the call site instead.

    @ConcurrencyLimit(10)        // no spring-retry equivalent
    public Report generate(ReportRequest req) { ... }
}`}
        caption="Not a drop-in rename of spring-retry: maxRetries replaces maxAttempts, includes replaces retryFor, backoff is flattened — and @Recover does not exist in core Spring, so exhausted retries just rethrow. Still proxy-based, so self-invocation silently gives you zero retries, and neither is a circuit breaker (that's Resilience4j)."
      />

      <PosterQuickRef
        title="Which AOP/async/event tool do I need?"
        rows={[
          { need: 'Cross-cutting concern, own annotation', answer: '@Aspect + @Around on @annotation(marker)' },
          { need: 'Blanket coverage across a package', answer: 'execution(..) + @within(...) pointcut' },
          { need: 'Need the return value or to swallow errors', answer: '@Around — the only advice type that can' },
          { need: 'Multiple aspects on one method', answer: '@Order — lower runs outermost' },
          { need: 'Purely an HTTP-layer concern', answer: 'Filter or HandlerInterceptor, not @Aspect' },
          { need: 'Non-blocking method call', answer: '@Async with a named, bounded executor' },
          { need: 'Async method silently returns null', answer: 'Return type must be void/CompletableFuture' },
          { need: 'Decouple a side effect', answer: 'ApplicationEventPublisher + @EventListener' },
          { need: "Side effect shouldn't roll back the tx", answer: '@TransactionalEventListener(AFTER_COMMIT)' },
          { need: 'Cache a slow read', answer: '@Cacheable — evict with @CacheEvict on writes' },
          { need: 'Retry a flaky remote call', answer: '@Retryable + @Recover, not a hand-rolled aspect' },
          { need: 'Retry on Boot 4', answer: 'Core org.springframework.resilience — drop the spring-retry dep' },
          { need: 'Cap in-flight calls to a fragile dependency', answer: '@ConcurrencyLimit (Boot 4)' },
        ]}
      />
    </PosterLayout>
  );
}
