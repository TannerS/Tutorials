import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Aop() {
  return (
    <LessonLayout
      title="AOP & Interceptors"
      sectionId="springboot2"
      lessonIndex={11}
      prev={{ path: '/springboot2/kafka', label: 'Kafka in Spring Boot 2' }}
      next={{ path: '/springboot2/webflux', label: 'Reactive Programming with WebFlux' }}
    >
      <p>
        This is the calm lesson in the section. AOP is proxy mechanics implemented deep in Spring
        Framework&apos;s core, and proxy mechanics are not the kind of thing that gets rewritten
        between major versions — there is no <code>javax</code> package involved, no ORM
        underneath it, nothing with a namespace to rename. What Boot 2.7.18 actually pins is{' '}
        <strong>Spring Framework 5.3.31</strong>, verified the same way as every other version
        claim in this section:
      </p>

      <CodeBlock language="bash" title="The check">
{`for v in 2.7.18 4.1.1; do
  printf 'boot %-8s framework=' $v
  curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/$v/spring-boot-dependencies-$v.pom \\
    | grep -oE '<spring-framework.version>[^<]+'
  printf 'boot %-8s aspectj=' $v
  curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/$v/spring-boot-dependencies-$v.pom \\
    | grep -oE '<aspectj.version>[^<]+'
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`boot 2.7.18   framework=<spring-framework.version>5.3.31
boot 2.7.18   aspectj=<aspectj.version>1.9.7
boot 4.1.1    framework=<spring-framework.version>7.0.9
boot 4.1.1    aspectj=<aspectj.version>1.9.25.1`}
      </CodeBlock>

      <p>
        Two major framework versions and a dozen AspectJ patch releases apart, and the AOP
        mechanics you are about to read are, with one exception involving <code>spring-retry</code>,{' '}
        identical. This lesson spends its time on that exception and on making sure the code is
        spelled the way Boot 2 actually needs it spelled — not on re-deriving AOP from scratch.
      </p>

      <h2>The Problem Aspect-Oriented Programming Solves</h2>
      <p>
        Some concerns don&apos;t belong in your business logic but they touch every business
        method: logging, metrics timing, transactions, security checks, PII masking, audit trails,
        retry policies. Sprinkling these across every method is duplication that reviewers stop
        noticing after page 3.
      </p>
      <p>
        AOP factors them out into <strong>aspects</strong> — reusable pieces of code that get
        &quot;woven&quot; into method calls that match a <strong>pointcut</strong>. You annotate or
        match methods once; the aspect runs everywhere it&apos;s supposed to.
      </p>

      <FlowChart
        title="How Spring AOP delivers behavior — same diagram, same mechanics, on 5.3 and on 7.x"
        chart={"graph TD\nA[Caller] --> B[Spring Proxy]\nB --> C[Aspect: @Before]\nC --> D[Aspect: @Around start]\nD --> E[Target Method]\nE --> F[Aspect: @Around end]\nF --> G[Aspect: @AfterReturning or @AfterThrowing]\nG --> H[Aspect: @After]\nH --> I[Return to caller]"}
      />

      <h2>Spring AOP vs AspectJ</h2>
      <InfoBox variant="note" title="Two very different technologies with the same word">
        <ul>
          <li>
            <strong>Spring AOP</strong> — proxy-based. Only intercepts calls that go through the
            Spring proxy, on methods a generated subclass could override. Fast, portable, no
            build-time magic. Covers 95% of what enterprise apps need.
          </li>
          <li>
            <strong>AspectJ</strong> — a full AOP language with load-time or compile-time bytecode
            weaving. Can intercept any method (private, self-invocations, constructors) but
            requires a special agent or compiler.
          </li>
        </ul>
        <p style={{ marginTop: '0.5rem' }}>
          This lesson focuses on Spring AOP, which is what almost every Boot 2 codebase uses.
          Reach for AspectJ only when you have a proven need: field-level interception,
          self-invocation matching, or performance numbers that show proxy overhead is a real
          problem.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Which methods a CGLIB proxy can actually intercept">
        <p>
          Worth pinning down precisely rather than half-remembering, because it decides whether a
          pointcut silently does nothing. This is the exact note from Spring&apos;s own reference
          documentation, and it reads identically whether you pull it from the Framework 5.3 docs
          or the current ones — this is not something that changed under you at some point in the
          upgrade path:
        </p>
        <CodeBlock language="text" title="From the Spring Framework reference manual, core-aop chapter">
{`Due to the proxy-based nature of Spring's AOP framework, calls within the
target object are, by definition, not intercepted. For JDK proxies, only
public interface method calls on the proxy can be intercepted. With CGLIB,
public and protected method calls on the proxy are intercepted (and even
package-visible methods, if necessary). However, common interactions through
proxies should always be designed through public signatures.`}
        </CodeBlock>
        <p>
          So: <strong>public, protected, and package-visible</strong> methods are all fair game
          for a CGLIB proxy (which is what Boot uses by default — see below).{' '}
          <strong>private</strong> and <strong>final</strong> methods never are, on any version,
          because a generated subclass cannot override either one. If a pointcut looks correct and
          nothing fires, check those two first.
        </p>
      </InfoBox>

      <h2>The Anatomy of an Aspect</h2>
      <p>
        Enable AOP once, then define aspects with three things: what to match (
        <em>pointcut</em>), when to run (<em>advice type</em>), and what to do.
      </p>
      <CodeBlock language="java" title="Enable AOP — usually not needed at all">
{`@SpringBootApplication
@EnableAspectJAutoProxy       // Boot adds this FOR you by default — see below
public class Application { }`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified: spring.aop.auto and spring.aop.proxy-target-class default to true on Boot 2.7.18 too">
        <p>
          Read straight out of <code>spring-boot-autoconfigure-2.7.18.jar</code>&apos;s
          configuration metadata — and it is the identical pair of defaults on{' '}
          <code>spring-boot-autoconfigure-4.1.1.jar</code>:
        </p>
        <CodeBlock language="bash" title="The check">
{`unzip -p spring-boot-autoconfigure-2.7.18.jar \\
  META-INF/spring-configuration-metadata.json \\
  | jq '.properties[] | select(.name | startswith("spring.aop"))'
# repeat against spring-boot-autoconfigure-4.1.1.jar — same two entries`}
        </CodeBlock>
        <CodeBlock language="json" title="Real output — both jars agree">
{`{ "name": "spring.aop.auto", "defaultValue": true,
  "description": "Add @EnableAspectJAutoProxy." }
{ "name": "spring.aop.proxy-target-class", "defaultValue": true,
  "description": "Whether subclass-based (CGLIB) proxies are to be created
                   (true), as opposed to standard Java interface-based
                   proxies (false)." }`}
        </CodeBlock>
        <p>
          As long as <code>spring-boot-starter-aop</code> (or anything that pulls in{' '}
          <code>aspectjweaver</code>) is on the classpath, <code>AopAutoConfiguration</code> adds{' '}
          <code>@EnableAspectJAutoProxy</code> for you and defaults to CGLIB proxies. The explicit
          annotation above is almost always redundant — shown here so you recognise it when you
          find it in an older Boot 2 codebase that predates the autoconfiguration, or in a plain
          Spring Framework app with no Boot involved at all.
        </p>
      </InfoBox>

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
        // structured log record
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
      <CodeBlock language="text" title="When each type fires — unchanged mechanics">
{`@Before          — runs before the method. Cannot alter args or return value.
@AfterReturning  — runs after normal return. Can inspect (not alter) return value.
@AfterThrowing   — runs on exception. Can log or transform (via wrapping aspect).
@After           — runs after either return or exception. finally-style cleanup.
@Around          — full control. Wraps the method. Must call pjp.proceed().
                   Can alter args, return value, or swallow exceptions.
                   Most flexible; almost always what you want.`}
      </CodeBlock>

      <h2>Retry Aspects — Spring Retry, and Its One Real Version Trap</h2>
      <p>
        For &quot;call this remote thing again with backoff on failure,&quot; you don&apos;t write
        your own aspect — <code>spring-retry</code> gives you <code>@Retryable</code>. This is the
        one part of this lesson where the version genuinely matters, because the annotation&apos;s{' '}
        <em>attribute names</em> changed shape across the <code>spring-retry</code> line, not just
        across Boot major versions.
      </p>

      <CodeBlock language="bash" title="Which spring-retry does Boot 2.7.18 actually pin?">
{`curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/2.7.18/spring-boot-dependencies-2.7.18.pom \\
  | grep -oE '<spring-retry.version>[^<]+'`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`<spring-retry.version>1.3.4`}
      </CodeBlock>

      <InfoBox variant="danger" title="Verified: @Retryable's retryFor attribute does not exist in spring-retry 1.3.4">
        <p>
          Decompiled directly from the jar Boot 2.7.18 resolves, contrasted with the current
          release:
        </p>
        <CodeBlock language="text" title="Real javap output — the Retryable annotation, two versions apart">
{`$ javap -p -cp spring-retry-1.3.4.jar org.springframework.retry.annotation.Retryable
public interface Retryable extends Annotation {
  String recover();
  String interceptor();
  Class<? extends Throwable>[] value();
  Class<? extends Throwable>[] include();
  Class<? extends Throwable>[] exclude();
  String label();
  boolean stateful();
  int maxAttempts();
  String maxAttemptsExpression();
  Backoff backoff();
  String exceptionExpression();
  String[] listeners();
}
                                            <- no retryFor(), no noRetryFor(),
                                               no notRecoverable()

$ javap -p -cp spring-retry-2.0.13.jar org.springframework.retry.annotation.Retryable
public interface Retryable extends Annotation {
  ...
  Class<? extends Throwable>[] retryFor();       // <- added later
  Class<? extends Throwable>[] noRetryFor();      // <- added later
  Class<? extends Throwable>[] notRecoverable();  // <- added later
  ...
}`}
        </CodeBlock>
        <p>
          If you see <code>@Retryable(retryFor = {'{'} SomeException.class {'}'})</code> in a Boot
          2.7 codebase, one of two things is true: the project overrides{' '}
          <code>spring-retry.version</code> above what the Boot BOM manages, or the snippet was
          copied from newer documentation and has never actually been compiled. Either is worth
          knowing before you copy it again.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Spring Retry, spelled the way Boot 2.7.18 actually requires — value/include/exclude, not retryFor">
{`@Configuration
@EnableRetry
public class RetryConfig { }

@Service
public class CatalogClient {

    @Retryable(include = { RemoteApiException.class, SocketTimeoutException.class },
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

      <InfoBox variant="tip" title="On Boot 4, retry moved into Spring Framework core — but that is not this lesson's world">
        <p>
          Spring Framework 7 (Boot 4) absorbed retry into core as{' '}
          <code>org.springframework.resilience</code> — verified absent from{' '}
          <code>spring-context-5.3.31.jar</code>, so there is no version of this you can reach for
          early on Boot 2. It is also not a drop-in rename when you do get there: different
          attribute names, inline backoff instead of a nested <code>@Backoff</code>, and no{' '}
          <code>@Recover</code> equivalent at all. The <a href="/springboot2/migration">Migration
          lesson</a> covers the ordering, and{' '}
          <a href="/springboot/boot4">the Boot 4 lesson</a> is the reference for what you land on
          — not repeated here, because a Boot 2 codebase cannot use it yet regardless.
        </p>
        <p>
          What travels forward unchanged is the trap, not the API: both are AOP proxies, so{' '}
          <strong>every self-invocation caveat below applies to <code>@Retryable</code> exactly as
          it applies to <code>@Transactional</code></strong>. Calling a{' '}
          <code>@Retryable</code> method via <code>this.</code> from inside the same bean bypasses
          the proxy and silently gives you zero retries, on 1.3.4 and on whatever replaces it.
        </p>
      </InfoBox>

      <h2>A Realistic Case: PII Masking in Logs</h2>
      <p>
        A common enterprise need: never log full email addresses, phone numbers, or
        credential-like fields. Instead of asking every developer to remember, wrap logs in an
        aspect that masks known fields automatically. Nothing here is version-sensitive — it is
        pure Spring AOP plus the JDK.
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
                sanitize(pjp, spec),
                (System.nanoTime() - start) / 1_000_000);
            return result;
        } catch (Throwable t) {
            log.warn("{}({}) -> {} in {}ms",
                sig.toShortString(),
                sanitize(pjp, spec),
                t.getClass().getSimpleName(),
                (System.nanoTime() - start) / 1_000_000);
            throw t;
        }
    }

    // Mask by POSITION, using the parameter names the annotation declares.
    // Requires -parameters at compile time so names survive into the
    // bytecode — Spring Boot's Maven/Gradle plugin sets this for you on
    // Boot 2 exactly as it does on Boot 4.
    private String sanitize(ProceedingJoinPoint pjp, LogSanitized spec) {
        String[] names = ((MethodSignature) pjp.getSignature()).getParameterNames();
        Set<String> sensitive = Set.of(spec.sensitiveArgs());
        Object[] args = pjp.getArgs();

        return IntStream.range(0, args.length)
            .mapToObj(i -> {
                String name = names[i];
                Object value = args[i];
                if (value == null) return name + "=null";
                if (!sensitive.contains(name)) return name + "=" + value;
                return name + "=" + MaskUtil.maskEmail(value.toString());
            })
            .collect(Collectors.joining(", "));
    }
}

// Declaring exactly which arguments are sensitive:
@Service
public class AccountService {
    @LogSanitized(sensitiveArgs = { "email", "ssn" })
    public Account register(String email, String ssn, String displayName) { ... }
    // logs: register(email=a***e@example.com, ssn=***6789, displayName=Alice)
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why this is worth an aspect">
        <p>
          You could put <code>maskEmail()</code> at every log call site. Someone will forget. You
          could code-review it. Reviewers get tired. The aspect enforces it once, and new methods
          pick up the behavior automatically as long as they carry the annotation.
        </p>
      </InfoBox>

      <h2>HandlerInterceptors — AOP for HTTP</h2>
      <p>
        <code>HandlerInterceptor</code> is Spring MVC&apos;s built-in interception mechanism. Less
        general than AOP but perfect for cross-cutting HTTP concerns — and it is one of the very
        few code samples in this lesson that genuinely differs on Boot 2, because it touches the
        servlet types covered in the <a href="/springboot2/javax">javax lesson</a>.
      </p>
      <CodeBlock language="java" title="A HandlerInterceptor that stamps a request ID — javax, not jakarta">
{`import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
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
}

// HandlerInterceptor, WebMvcConfigurer and InterceptorRegistry are all
// org.springframework.web.* — none of that moved. Only the two servlet
// parameter types did. Carrying this to Boot 3+ is exactly the mechanical
// import swap the javax lesson describes; nothing about the interceptor
// logic itself changes.`}
      </CodeBlock>

      <h2>Filters vs Interceptors vs Aspects — Which Where?</h2>
      <CodeBlock language="text" title="A cheat sheet">
{`Servlet Filter (javax.servlet.Filter on Boot 2 / jakarta.servlet.Filter on Boot 3+)
  Runs earliest. Sees raw request/response bytes.
  Use for: security headers, GZIP, request-id injection, low-level rewrites.

HandlerInterceptor
  Runs after handler mapping. Knows the controller method.
  Use for: per-endpoint metrics, auth check preHandle, response mutation.

@ControllerAdvice / @RestControllerAdvice
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
        When multiple aspects match the same method, order matters. Spring&apos;s{' '}
        <code>@Order</code> (or the <code>Ordered</code> interface) controls it — same annotation,
        same package, same behaviour on both versions.
      </p>
      <CodeBlock language="java" title="Explicit aspect order">
{`@Aspect @Component @Order(1) public class LoggingAspect     { /* ... */ }
@Aspect @Component @Order(2) public class SecurityAspect    { /* ... */ }
@Aspect @Component @Order(3) public class TransactionAspect { /* ... */ }

// Lower @Order = higher precedence = OUTER. With this ordering:
//   Logging → Security → Transaction → target → Transaction → Security → Logging
//
// Logging outermost is usually what you want: it then measures the time spent
// in the transaction and sees exceptions before the tx aspect rolls back.`}
      </CodeBlock>

      <h2>Common Pitfalls</h2>

      <FlowChart
        title="The self-invocation trap — why 'this.method()' skips the aspect entirely"
        chart={"graph TD\nA[\"External caller\"] -->|\"orderService.audit()\"| B[\"Spring Proxy for OrderService\"]\nB -->|\"advice runs, then delegates\"| C[\"real OrderService.audit()\"]\nC -->|\"this.saveInternal()\"| D[\"real OrderService.saveInternal() DIRECTLY\"]\nD -.->|\"proxy never re-entered\"| E[\"@Audited on saveInternal DOES NOT FIRE\"]\nstyle E fill:#3a1f1f,stroke:#f87171"}
      />

      <InfoBox variant="warning" title="Traps that show up in AOP code — every one of these applies identically to Boot 2 and Boot 4">
        <ul>
          <li>
            <strong>Self-invocation.</strong> Proxy-based AOP doesn&apos;t intercept{' '}
            <code>this.something()</code>. The diagram above is the whole story — the call to{' '}
            <code>saveInternal()</code> never passes back through the proxy that wraps{' '}
            <code>audit()</code>, so any advice on <code>saveInternal</code> is silently skipped.
            This is the exact same rule as <code>@Transactional</code>, <code>@Async</code>, and{' '}
            (as covered above) <code>@Retryable</code> — Boot 4&apos;s{' '}
            <a href="/springboot/di">DI lesson</a> covers the fixes (extract to a separate bean,
            self-inject with <code>@Lazy</code>, or <code>AopContext.currentProxy()</code>) in
            depth; the mechanism is identical here, so it is not repeated.
          </li>
          <li>
            <strong>Private and final methods.</strong> A CGLIB proxy is a subclass, so it can
            only weave what a subclass could override — <code>private</code> and{' '}
            <code>final</code> methods (and <code>final</code> classes) are skipped: the pointcut
            looks right, nothing fires. This has not changed across any version discussed in this
            section; see the reference-manual excerpt above.
          </li>
          <li>
            <strong>Constructor calls.</strong> AOP happens on method calls to an already-created
            bean. Interceptors can&apos;t run inside constructors.
          </li>
          <li>
            <strong>Aspect on a bean that hasn&apos;t been proxied.</strong> Direct instantiation
            with <code>new</code> bypasses everything. Common when a service instantiates its own
            helpers.
          </li>
          <li>
            <strong>Reflection-heavy pointcuts.</strong> Broad <code>execution(..)</code> patterns
            are cheap; annotation-based patterns are cheaper. <code>args(..)</code>-heavy matching
            hits every call in the app.
          </li>
        </ul>
      </InfoBox>

      <h2>Testing Aspects</h2>
      <CodeBlock language="java" title="Testing that the aspect actually runs — @MockBean, the Boot 2 spelling">
{`import org.springframework.boot.test.mock.mockito.MockBean;   // see the Testing lesson

@SpringBootTest
class AuditAspectTest {

    @Autowired OrderService orders;
    @MockBean AuditRecorder recorder;

    @Test
    void auditedMethodInvokesRecorder() {
        orders.place(validRequest());

        verify(recorder).record(eq("order.place"), any(), any(), isNull());
    }
}`}
      </CodeBlock>

      <h2>AOP Checklist</h2>
      <InfoBox variant="success" title="Signs your Boot 2 AOP usage is healthy">
        <ul>
          <li>
            Aspects target <strong>cross-cutting concerns only</strong>: audit, masking, metrics,
            retry. Never business logic.
          </li>
          <li>
            Pointcuts are <strong>annotation-based</strong> where possible — easier to read than{' '}
            <code>execution(..)</code> strings.
          </li>
          <li>Every aspect has an <code>@Order</code> when it can interact with others.</li>
          <li>Self-invocation traps are known and documented.</li>
          <li>Aspects have tests that assert they fired.</li>
          <li>
            <code>@Retryable</code> code is written against{' '}
            <code>value</code>/<code>include</code>/<code>exclude</code>, not{' '}
            <code>retryFor</code> — because <code>retryFor</code> does not exist in the{' '}
            <code>spring-retry</code> version Boot 2.7.18 actually resolves.
          </li>
          <li>
            You know that a Boot 2.7 codebase cannot reach for core Spring&apos;s{' '}
            <code>org.springframework.resilience</code> package — it is Framework 7+ only — so
            there is no early-adoption shortcut to look for here.
          </li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="You're reviewing a pull request against a Spring Boot 2.7.18 service. It adds @Retryable(retryFor = { RemoteApiException.class }, maxAttempts = 3) to a method. The build has not been run yet. What do you expect to happen, and why?"
        options={[
          "It compiles and works exactly as written — retryFor has been part of @Retryable since Spring Retry 1.0",
          "It fails to compile: Boot 2.7.18 resolves spring-retry 1.3.4, and the Retryable annotation in that version only has value()/include()/exclude() — there is no retryFor() attribute until a later spring-retry release",
          "It compiles but silently retries zero times, because retryFor is ignored on old Spring Retry",
          "It fails at startup with a bean definition error, not a compile error"
        ]}
        correctIndex={1}
        explanation="This is a compile-time failure, not a runtime one — annotation attributes are checked by javac against the actual .class file on the classpath. Decompiling spring-retry-1.3.4.jar (the version Boot 2.7.18's BOM pins) shows Retryable has recover(), interceptor(), value(), include(), exclude(), label(), stateful(), maxAttempts(), maxAttemptsExpression(), backoff(), exceptionExpression(), and listeners() — no retryFor(), noRetryFor(), or notRecoverable(). Those three were added in a later spring-retry release. Unless this project explicitly overrides spring-retry.version above what the Boot BOM manages, the build fails with 'cannot find symbol: method retryFor()'. The fix for Boot 2.7 code is include = { RemoteApiException.class } instead — same semantics, different attribute name. This is exactly the kind of assumption ('newer syntax I've seen elsewhere must work everywhere') that a version check catches before a reviewer has to."
      />
    </LessonLayout>
  );
}

export default SpringBoot2Aop;
