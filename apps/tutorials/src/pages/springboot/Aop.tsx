import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Aop() {
  return (
    <LessonLayout
      title="AOP & Interceptors"
      sectionId="springboot"
      lessonIndex={12}
      prev={{ path: '/springboot/kafka', label: 'Kafka in Spring' }}
      next={{ path: '/springboot/boot4', label: 'Boot 4 Novelties' }}
    >
      <h2>The Problem Aspect-Oriented Programming Solves</h2>
      <p>
        Some concerns don't belong in your business logic but they touch every business
        method: logging, metrics timing, transactions, security checks, PII masking,
        audit trails, retry policies. Sprinkling these across every method is duplication
        that reviewers stop noticing after page 3.
      </p>
      <p>
        AOP factors them out into <strong>aspects</strong> — reusable pieces of code that
        get "woven" into method calls that match a <strong>pointcut</strong>. You annotate
        or match methods once; the aspect runs everywhere it's supposed to.
      </p>

      <FlowChart
        title="How Spring AOP delivers behavior"
        chart={"graph TD\nA[Caller] --> B[Spring Proxy]\nB --> C[Aspect: @Before]\nC --> D[Aspect: @Around start]\nD --> E[Target Method]\nE --> F[Aspect: @Around end]\nF --> G[Aspect: @AfterReturning or @AfterThrowing]\nG --> H[Aspect: @After]\nH --> I[Return to caller]"}
      />

      <h2>Spring AOP vs AspectJ</h2>
      <InfoBox variant="note" title="Two very different technologies with the same word">
        <ul>
          <li>
            <strong>Spring AOP</strong> — proxy-based. Only intercepts <em>public</em>
            method calls that go through the Spring proxy. Fast, portable, no build-time
            magic. Covers 95% of what enterprise apps need.
          </li>
          <li>
            <strong>AspectJ</strong> — a full AOP language with load-time or compile-time
            bytecode weaving. Can intercept any method (private, self-invocations,
            constructors) but requires a special agent or compiler.
          </li>
        </ul>
        <p style={{ marginTop: '0.5rem' }}>
          This lesson focuses on Spring AOP. Reach for AspectJ only when you have a
          proven need: field-level interception, self-invocation matching, or performance
          numbers that show proxy overhead is a real problem.
        </p>
      </InfoBox>

      <h2>The Anatomy of an Aspect</h2>
      <p>
        Enable AOP once, then define aspects with three things: what to match
        (<em>pointcut</em>), when to run (<em>advice type</em>), and what to do.
      </p>
      <CodeBlock language="java" title="Enable AOP">
{`@SpringBootApplication
@EnableAspectJAutoProxy       // usually already enabled by Spring Boot
public class Application { }`}
      </CodeBlock>

      <h2>Pointcut Expressions</h2>
      <p>
        Pointcuts pick which method invocations the aspect matches. Two idiomatic styles:
        annotation-based and package-based.
      </p>
      <CodeBlock language="java" title="Annotation-based pointcut — the cleanest style">
{`// A marker annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited { String value() default ""; }

@Aspect
@Component
public class AuditAspect {

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint pjp, Audited audited) throws Throwable {
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

    private void record(String action, ProceedingJoinPoint pjp,
                        Instant start, Throwable outcome) {
        // structured log record — see Observability lesson
    }
}

// Usage anywhere in the app:
@Service
public class OrderService {
    @Audited("order.place")
    public Order place(NewOrderRequest req) { /* ... */ }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Package or type-based pointcut">
{`@Aspect
@Component
public class ServiceLayerLogging {

    // Match every method in any class under com.example.**.service with @Service.
    @Pointcut("execution(* com.example..service..*.*(..)) && @within(org.springframework.stereotype.Service)")
    public void anyServiceMethod() { }

    @Around("anyServiceMethod()")
    public Object logExceptions(ProceedingJoinPoint pjp) throws Throwable {
        try {
            return pjp.proceed();
        } catch (Exception e) {
            log.error("Exception in {}: {}",
                pjp.getSignature().toShortString(), e.getMessage());
            throw e;
        }
    }
}`}
      </CodeBlock>

      <h2>Advice Types</h2>
      <CodeBlock language="text" title="When each type fires">
{`@Before          — runs before the method. Cannot alter args or return value.
@AfterReturning  — runs after normal return. Can inspect (not alter) return value.
@AfterThrowing   — runs on exception. Can log or transform (via wrapping aspect).
@After           — runs after either return or exception. finally-style cleanup.
@Around          — full control. Wraps the method. Must call pjp.proceed().
                   Can alter args, return value, or swallow exceptions.
                   Most flexible; almost always what you want.`}
      </CodeBlock>

      <h2>A Realistic Case: PII Masking in Logs</h2>
      <p>
        A common enterprise need: never log full email addresses, phone numbers, or
        credential-like fields. Instead of asking every developer to remember, wrap logs
        in an aspect that masks known fields automatically.
      </p>
      <CodeBlock language="java" title="Structured logging with automatic PII masking">
{`@Target({ ElementType.METHOD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface LogSanitized {
    String[] sensitiveArgs() default {};
}

public final class MaskUtil {
    private MaskUtil() { }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        int at = email.indexOf('@');
        String local = email.substring(0, at);
        String domain = email.substring(at);
        return (local.length() <= 2 ? "*".repeat(local.length())
                                    : local.charAt(0) + "***" + local.charAt(local.length() - 1))
             + domain;
    }
    public static String maskLast4(String s) {
        if (s == null || s.length() < 5) return "****";
        return "***" + s.substring(s.length() - 4);
    }
}

@Aspect
@Component
public class LogSanitizingAspect {

    @Around("@annotation(spec)")
    public Object aroundSanitized(ProceedingJoinPoint pjp, LogSanitized spec) throws Throwable {
        Signature sig = pjp.getSignature();
        long start = System.nanoTime();
        try {
            Object result = pjp.proceed();
            log.info("{}({}) -> ok in {}ms",
                sig.toShortString(),
                sanitize(pjp.getArgs(), spec),
                (System.nanoTime() - start) / 1_000_000);
            return result;
        } catch (Throwable t) {
            log.warn("{}({}) -> {} in {}ms",
                sig.toShortString(),
                sanitize(pjp.getArgs(), spec),
                t.getClass().getSimpleName(),
                (System.nanoTime() - start) / 1_000_000);
            throw t;
        }
    }

    private String sanitize(Object[] args, LogSanitized spec) {
        return Arrays.stream(args)
            .map(a -> a == null ? "null" : shortenIfEmail(a))
            .collect(Collectors.joining(", "));
    }

    private String shortenIfEmail(Object v) {
        String s = v.toString();
        return s.contains("@") ? MaskUtil.maskEmail(s) : s;
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why this is worth an aspect">
        <p>
          You could put <code>maskEmail()</code> at every log call site. Someone will forget.
          You could code-review it. Reviewers get tired. The aspect enforces it once, and
          new methods pick up the behavior automatically as long as they carry the
          annotation.
        </p>
      </InfoBox>

      <h2>Retry Aspects — Spring Retry</h2>
      <p>
        For "call this remote thing again with backoff on failure," you don't need to write
        your own aspect — <code>spring-retry</code> gives you <code>@Retryable</code>.
      </p>
      <CodeBlock language="java" title="Spring Retry annotations">
{`@Configuration
@EnableRetry
public class RetryConfig { }

@Service
public class CatalogClient {

    @Retryable(retryFor = { RemoteApiException.class, SocketTimeoutException.class },
               maxAttempts = 4,
               backoff = @Backoff(delay = 200, multiplier = 2.0, maxDelay = 5000))
    public ProductDto get(String id) {
        return http.get("/products/" + id, ProductDto.class);
    }

    @Recover
    public ProductDto recoverGet(RemoteApiException e, String id) {
        log.warn("catalog get exhausted retries for {}", id);
        return ProductDto.unavailable(id);
    }
}`}
      </CodeBlock>

      <h2>HandlerInterceptors — AOP for HTTP</h2>
      <p>
        <code>HandlerInterceptor</code> is Spring MVC's built-in interception mechanism.
        Less general than AOP but perfect for cross-cutting HTTP concerns.
      </p>
      <CodeBlock language="java" title="A HandlerInterceptor that stamps a request ID">
{`@Component
public class RequestIdInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        String requestId = req.getHeader("X-Request-Id");
        if (requestId == null) requestId = UUID.randomUUID().toString();
        MDC.put("requestId", requestId);           // available in every log line
        res.setHeader("X-Request-Id", requestId);
        req.setAttribute("startNanos", System.nanoTime());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res,
                                Object handler, Exception ex) {
        long durationNanos = System.nanoTime() - (Long) req.getAttribute("startNanos");
        Metrics.timer("http.server.duration",
            "uri", req.getRequestURI(),
            "status", String.valueOf(res.getStatus()))
            .record(durationNanos, TimeUnit.NANOSECONDS);
        MDC.clear();
    }
}

@Configuration
class WebMvcConfig implements WebMvcConfigurer {
    private final RequestIdInterceptor requestId;
    WebMvcConfig(RequestIdInterceptor r) { this.requestId = r; }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(requestId).addPathPatterns("/api/**");
    }
}`}
      </CodeBlock>

      <h2>Filters vs Interceptors vs Aspects — Which Where?</h2>
      <CodeBlock language="text" title="A cheat sheet">
{`Servlet Filter (jakarta.servlet.Filter)
  Runs earliest. Sees raw request/response bytes.
  Use for: security headers, GZIP, request-id injection, low-level rewrites.

HandlerInterceptor
  Runs after handler mapping. Knows the controller method.
  Use for: per-endpoint metrics, auth check preHandle, response mutation.

@RestControllerAdvice
  Runs at the exception boundary and can wrap response bodies.
  Use for: global error handling, envelope wrapping.

Spring AOP @Aspect
  Runs on any bean method (via proxy).
  Use for: cross-cutting service-layer concerns — auditing, PII masking, metrics
  on non-HTTP paths, custom retries.

Rule of thumb: choose the LEAST intrusive tool that covers the case.
HTTP concern? Filter or interceptor. Service concern? Aspect.`}
      </CodeBlock>

      <h2>Aspect Ordering</h2>
      <p>
        When multiple aspects match the same method, order matters. Spring's
        <code>@Order</code> (or <code>Ordered</code> interface) controls it.
      </p>
      <CodeBlock language="java" title="Explicit aspect order">
{`@Aspect @Component @Order(1) public class TransactionAspect { /* ... */ }
@Aspect @Component @Order(2) public class SecurityAspect    { /* ... */ }
@Aspect @Component @Order(3) public class LoggingAspect     { /* ... */ }

// Lower @Order = outer. With this ordering:
//   Logging → Security → Transaction → target → Transaction → Security → Logging`}
      </CodeBlock>

      <h2>Common Pitfalls</h2>
      <InfoBox variant="warning" title="Traps that show up in AOP code">
        <ul>
          <li><strong>Self-invocation.</strong> Proxy-based AOP doesn't intercept
              <code>this.something()</code>. Same rule as
              <code>@Transactional</code>.</li>
          <li><strong>Private methods.</strong> Spring AOP only weaves public methods
              (final classes are also skipped). Pointcut looks right; nothing fires.</li>
          <li><strong>Constructor calls.</strong> AOP happens on method calls to an
              already-created bean. Interceptors can't run inside constructors.</li>
          <li><strong>Aspect on a bean that hasn't been proxied.</strong> Direct
              instantiation with <code>new</code> bypasses everything. Common when a
              service instantiates its own helpers.</li>
          <li><strong>Reflection-heavy pointcuts.</strong> Broad <code>execution(..)</code>
              patterns are cheap; annotation-based patterns are cheaper.
              <code>args(..)</code>-heavy matching hits every call in the app.</li>
        </ul>
      </InfoBox>

      <h2>Testing Aspects</h2>
      <CodeBlock language="java" title="Testing that the aspect actually runs">
{`@SpringBootTest
class AuditAspectTest {

    @Autowired OrderService orders;
    @MockitoBean AuditRecorder recorder;

    @Test
    void auditedMethodInvokesRecorder() {
        orders.place(validRequest());

        verify(recorder).record(eq("order.place"), any(), any(), isNull());
    }
}`}
      </CodeBlock>

      <h2>AOP Checklist</h2>
      <InfoBox variant="success" title="Signs your AOP usage is healthy">
        <ul>
          <li>Aspects target <strong>cross-cutting concerns only</strong>: audit,
              masking, metrics, retry. Never business logic.</li>
          <li>Pointcuts are <strong>annotation-based</strong> where possible — easier to
              read than <code>execution(..)</code> strings.</li>
          <li>Every aspect has an <code>@Order</code> when it can interact with others.</li>
          <li>Self-invocation traps are known and documented.</li>
          <li>Aspects have tests that assert they fired.</li>
          <li>You use <strong>built-in aspects</strong> (<code>@Transactional</code>,
              <code>@Cacheable</code>, <code>@Retryable</code>, <code>@Timed</code>)
              before writing your own.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="You add an @Aspect that logs every method annotated @Audited. It fires when other beans call methods on OrderService, but NOT when OrderService.audit() calls this.saveInternal() which is also annotated @Audited. Why?"
        options={[
          "@Aspect requires @EnableAspectJAutoProxy to be added explicitly",
          "The pointcut expression is wrong",
          "Spring AOP is proxy-based — self-invocation via 'this' bypasses the proxy, so the aspect doesn't fire on internal calls",
          "@Audited must be on the interface, not the implementation"
        ]}
        correctIndex={2}
        explanation="Spring AOP intercepts method calls that go through the proxy Spring creates around your bean. Calls with 'this.' skip the proxy and go straight to the underlying object, so annotations on the target method are ignored. To make it fire, either restructure so the call comes from outside (a separate bean), inject the bean into itself (with @Lazy to break the circular dependency), or switch to AspectJ load-time weaving which intercepts direct calls too. This is the same trap that plagues @Transactional, @Async, and @Cacheable."
      />
    </LessonLayout>
  );
}
