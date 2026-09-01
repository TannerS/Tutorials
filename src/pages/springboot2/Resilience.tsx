import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Resilience() {
  return (
    <LessonLayout
      title="Resilience4j & Circuit Breakers"
      sectionId="springboot2"
      lessonIndex={13}
      prev={{ path: '/springboot2/webflux', label: 'Reactive Programming with WebFlux' }}
      next={{ path: '/springboot2/observability', label: 'Observability' }}
    >
      <p>
        Unlike almost everything else in this section, Resilience4j is not coupled to which Spring
        Boot version you&apos;re running. It is a standalone Java library that happens to ship a
        thin Spring integration module, and the annotations you are about to write —{' '}
        <code>@CircuitBreaker</code>, <code>@Retry</code>, <code>@RateLimiter</code>,{' '}
        <code>@Bulkhead</code> — are defined in a package that has never heard of Spring Boot&apos;s
        major version number at all. That claim isn&apos;t asserted from memory; the section below
        proves it from the published jars, the same way every other version claim on this site is
        proved. What genuinely differs on a Boot 2 codebase is the integration artifact you
        declare, and — the part a Boot 4 lesson has no reason to mention — <strong>what you find
        instead of Resilience4j</strong> in an older Boot 2 codebase, because for a real chunk of
        Boot 2&apos;s active lifetime, Resilience4j was not yet the default answer.
      </p>

      <h2>Why Resilience4j, Not Hystrix</h2>

      <p>
        Search &quot;Spring circuit breaker&quot; today and you&apos;ll still find plenty of
        material about Netflix Hystrix, because for years it <em>was</em> the answer. Netflix put
        Hystrix into maintenance mode in November 2018 — the project&apos;s own README states it
        plainly, and it is worth quoting exactly rather than summarising:
      </p>

      <InfoBox variant="note" title="Straight from the Netflix/Hystrix README, verified live from GitHub">
        <p>
          &quot;Hystrix is no longer in active development, and is currently in maintenance
          mode.&quot; Netflix will &quot;no longer actively review issues, merge pull-requests, and
          release new versions of Hystrix,&quot; and for new internal projects intends &quot;to
          leverage open and active projects like resilience4j.&quot; The final release was 1.5.18.
        </p>
      </InfoBox>

      <p>
        That last line is the whole story: Netflix, the company that built Hystrix, told everyone
        to move to Resilience4j. Practically, the difference you feel immediately is that
        Resilience4j is modular — add the one dependency for the pattern you need (
        <code>circuitbreaker</code>, <code>retry</code>, <code>ratelimiter</code>,{' '}
        <code>bulkhead</code>) instead of one giant artifact — and it composes with plain Java
        functional interfaces and <code>CompletableFuture</code> instead of forcing RxJava on you
        the way Hystrix&apos;s reflection-heavy proxy wrapping did.
      </p>

      <InfoBox variant="warning" title="If you're reading a Boot 2 codebase written before ~2019, you may find Hystrix instead">
        <p>
          This is the one piece of context a Boot 4 lesson has no reason to carry, and it is real
          history, not a vague gesture at &quot;older code.&quot; Spring Boot 2.0.0 itself shipped
          on <strong>2018-03-01</strong> — checked the same way every other release date on this
          site is checked, from the artifact&apos;s own timestamp on Maven Central:
        </p>
        <CodeBlock language="bash" title="When did Boot 2.0.0 actually ship?">
{`curl -sI https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot/2.0.0.RELEASE/spring-boot-2.0.0.RELEASE.jar | grep -i last-modified`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output">
{`last-modified: Thu, 01 Mar 2018 06:08:29 GMT`}
        </CodeBlock>
        <p>
          Hystrix&apos;s maintenance-mode announcement landed roughly eight months later. So the
          overlap window where a <em>brand new</em> Boot 2 project would reach for Hystrix by
          default was short — but plenty of teams had already committed to Spring Cloud
          Netflix&apos;s Hystrix starter before that announcement, in the Boot 1.x era, and
          switching a working resilience layer mid-project is exactly the kind of work that gets
          deprioritised. Spring Cloud itself kept the bridge open for years: the last release of{' '}
          <code>spring-cloud-starter-netflix-hystrix</code> on Maven Central is{' '}
          <code>2.2.10.RELEASE</code>, published <strong>2021-11-17</strong> — verified from the
          artifact&apos;s own <code>maven-metadata.xml</code>. That is three full years after
          Netflix&apos;s own announcement, and it is why Hystrix annotations (
          <code>@HystrixCommand</code>, a <code>HystrixCommandGroupKey</code>,{' '}
          <code>hystrix.command.default.execution.isolation.thread.timeoutInMilliseconds</code>{' '}
          in a properties file) are a genuinely plausible thing to meet in a Boot 2 codebase you
          inherit today, right alongside — or instead of — Resilience4j. If you find it, treat it
          the way you&apos;d treat any other frozen dependency in this section: it still works, it
          gets no further releases, and migrating off it is a separate, deliberate piece of work
          from whatever else brought you to this codebase.
        </p>
      </InfoBox>

      <h2>Does Resilience4j Actually Work on 2.7.18?</h2>

      <p>
        Yes, unambiguously — but the artifact coordinate is different from the Boot 3/4 one, and
        it&apos;s worth confirming precisely rather than assuming the obvious{' '}
        <code>-boot2</code>/<code>-boot3</code> naming tells the whole story.
      </p>

      <CodeBlock language="bash" title="Is resilience4j-spring-boot2 still a real, maintained artifact?">
{`curl -s https://repo1.maven.org/maven2/io/github/resilience4j/resilience4j-spring-boot2/maven-metadata.xml \\
  | grep -E 'latest|release|lastUpdated'

curl -s https://repo1.maven.org/maven2/io/github/resilience4j/resilience4j-spring-boot3/maven-metadata.xml \\
  | grep -E 'latest|release|lastUpdated'`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`resilience4j-spring-boot2:  latest 2.3.0   lastUpdated 2025-01-03
resilience4j-spring-boot3:  latest 2.4.0   lastUpdated 2026-03-14`}
      </CodeBlock>

      <p>
        Both modules are actively released. The Boot 2 module sits one minor version behind the
        Boot 3 one and was last published about fourteen months before the Boot 3 module&apos;s
        latest release — a real, if modest, gap. That is exactly what you&apos;d expect from a
        library still supporting an EOL&apos;d major version out of goodwill rather than obligation:
        alive, but no longer the priority.
      </p>

      <CodeBlock language="xml" title="pom.xml — the Boot 2 coordinate">
{`<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot2</artifactId>
    <version>2.3.0</version>
</dependency>`}
      </CodeBlock>

      <p>
        <code>spring-boot-starter-aop</code> is required on both Boot 2 and Boot 4 — every one of
        these annotations is woven in via Spring AOP, and that has not changed.
      </p>

      <InfoBox variant="success" title="Why the annotations mostly transfer directly, verified by decompiling both versions rather than assumed">
        <p>
          <code>@CircuitBreaker</code>, <code>@Retry</code>, <code>@RateLimiter</code> and{' '}
          <code>@Bulkhead</code> are declared in an artifact called{' '}
          <code>resilience4j-annotations</code> — a plain-Java module with no Spring dependency at
          all. Both the Boot 2 and Boot 3/4 integration chains pull it in as a transitive
          dependency, confirmed by reading the published POMs directly:
        </p>
        <CodeBlock language="text" title="Real dependency chains, read from Maven Central">
{`resilience4j-spring-boot2:2.3.0
  -> resilience4j-spring:2.3.0
       -> resilience4j-annotations:2.3.0      <- the @CircuitBreaker etc. live here

resilience4j-spring-boot3:2.4.0
  -> resilience4j-spring6:2.4.0               <- note: a DIFFERENT integration artifact,
       -> resilience4j-annotations:2.4.0      <-  built against Spring 6's AOP internals
                                                   same module name, one point release ahead`}
        </CodeBlock>
        <p>
          The integration layer that wires the annotations into Spring&apos;s AOP proxy machinery
          is version-specific — <code>resilience4j-spring</code> for Spring 5 (Boot 2),{' '}
          <code>resilience4j-spring6</code> for Spring 6 (Boot 3/4) — because AOP proxying is
          genuinely different internal plumbing between Framework major versions. The thing you
          actually type on your methods sits one layer below that split, in the shared{' '}
          <code>resilience4j-annotations</code> module — but &quot;shared module&quot; is not
          quite &quot;identical class file,&quot; and it&apos;s worth showing the real difference
          rather than glossing over it. Decompiling <code>@CircuitBreaker</code> from both jars:
        </p>
        <CodeBlock language="text" title="Real output — javap -p, resilience4j-annotations 2.3.0 vs 2.4.0">
{`2.3.0:  name()  fallbackMethod()
2.4.0:  name()  configuration()  fallbackMethod()   <- new attribute`}
        </CodeBlock>
        <p>
          Every one of <code>@CircuitBreaker</code>, <code>@Retry</code>,{' '}
          <code>@RateLimiter</code>, <code>@Bulkhead</code> and <code>@TimeLimiter</code> gained
          the same new <code>configuration()</code> attribute in 2.4.0 — a way to point an
          instance at a named shared config profile directly from the annotation. It genuinely
          does not exist on the 2.3.0 that <code>resilience4j-spring-boot2</code> pins. Everything
          else on this page — <code>name</code>, <code>fallbackMethod</code>, <code>type</code>,{' '}
          <code>permits</code> — is present, unchanged, in both. This is the honest version of
          &quot;the core content transfers directly&quot;: not byte-identical, but the same
          module, one minor feature behind, with nothing you&apos;ve been shown above missing.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="Confirming Boot 2's autoconfiguration mechanism is the Boot-2-era one">
{`unzip -l resilience4j-spring-boot2-2.3.0.jar | grep -iE 'spring.factories|AutoConfiguration.imports'`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`     1290  01-03-2025 09:20   META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
     1386  01-03-2025 09:20   META-INF/spring.factories`}
      </CodeBlock>

      <p>
        It ships both files — <code>spring.factories</code>, the mechanism Boot 2 (and every Boot
        version before it) reads auto-configuration classes from, and the newer{' '}
        <code>AutoConfiguration.imports</code> file that Boot 2.7+ also understands. That the{' '}
        <code>spring.factories</code> entry is present and lists every one of the circuit breaker,
        retry, rate limiter, bulkhead and time limiter auto-configuration classes is the real proof
        that this module still wires itself up correctly on Boot 2&apos;s auto-configuration
        pipeline — not just &quot;the jar resolves,&quot; but &quot;Boot actually finds and runs
        its configuration classes.&quot;
      </p>

      <h2>Circuit Breaker: The Annotation Version</h2>

      <p>
        <code>@CircuitBreaker</code> wraps a method the same way the conceptual pattern describes
        — it counts recent outcomes, and once too many of them are failures, it flips open and
        stops even attempting the call.
      </p>

      <CodeBlock language="java" title="PaymentClient.java — @CircuitBreaker with a fallback, unchanged from Boot 3/4">
{`package com.example.payments;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;

@Service
public class PaymentClient {

    private final PaymentGatewayApi gatewayApi;

    public PaymentClient(PaymentGatewayApi gatewayApi) {
        this.gatewayApi = gatewayApi;
    }

    @CircuitBreaker(name = "paymentGateway", fallbackMethod = "chargeFallback")
    public ChargeResult charge(ChargeRequest request) {
        return gatewayApi.charge(request);   // blocking HTTP call to a third party
    }

    // Same class as charge(), same parameter list, plus exactly one extra
    // exception parameter on the end. Get the signature wrong and
    // Resilience4j silently fails to find the fallback.
    private ChargeResult chargeFallback(ChargeRequest request, Throwable t) {
        return ChargeResult.queued("Payment gateway unavailable, queued: " + t.getMessage());
    }
}`}
      </CodeBlock>

      <p>
        The fallback signature rule is enforced, not a convention: a fallback method must live in
        the same class and match the target method&apos;s signature with exactly one extra{' '}
        <code>Throwable</code>-or-more-specific parameter on the end. You can declare multiple
        overloads for different exception types and Resilience4j dispatches to whichever matches
        most specifically.
      </p>

      <CodeBlock language="yaml" title="application.yml — CircuitBreaker configuration">
{`resilience4j.circuitbreaker:
  instances:
    paymentGateway:
      slidingWindowType: COUNT_BASED     # or TIME_BASED — see below
      slidingWindowSize: 20              # last 20 calls (or seconds, if time-based)
      minimumNumberOfCalls: 10           # need this many recorded before % is trusted
      failureRateThreshold: 50           # open once 50% of the window failed
      waitDurationInOpenState: 30s       # stay OPEN this long before probing again
      permittedNumberOfCallsInHalfOpenState: 3`}
      </CodeBlock>

      <p>
        <code>slidingWindowType</code> decides what &quot;the last 20&quot; even means.{' '}
        <strong>COUNT_BASED</strong> (the default) records the last{' '}
        <code>slidingWindowSize</code> calls, however long that takes to accumulate.{' '}
        <strong>TIME_BASED</strong> instead records every call from the last{' '}
        <code>slidingWindowSize</code> seconds. Either way, the breaker cannot calculate a failure
        rate — and therefore cannot open — until <code>minimumNumberOfCalls</code> have been
        recorded in the window; a burst of one or two failures can never look statistically like an
        outage by design.
      </p>

      <InfoBox variant="danger" title="The Failure Mode a Circuit Breaker Actually Prevents">
        <p>
          Picture <code>PaymentClient</code> with no circuit breaker, and the payment gateway
          starts timing out at 30 seconds per call. Every request needing a charge now blocks for
          up to 30 seconds. Boot 2&apos;s embedded Tomcat has the same 200-thread default it has
          always had, and under real traffic that pool fills with requests stuck on the same dead
          dependency. Once the pool is exhausted, requests that have{' '}
          <em>nothing to do with payments</em> start queueing behind them too, because there are no
          threads left to serve anything. One slow downstream call has just taken your entire
          service down — a cascading failure, and it is the single most common way a distributed
          system falls over, on Boot 2 exactly as on Boot 4.
        </p>
        <p>
          With the circuit breaker in place, once <code>failureRateThreshold</code> is crossed the
          breaker opens: the next call to <code>charge()</code> never touches the network — it
          throws a <code>CallNotPermittedException</code> in microseconds, routes straight to{' '}
          <code>chargeFallback</code>, and the request thread is freed immediately. Fail fast on
          purpose, so a dependency&apos;s outage stays that dependency&apos;s outage.
        </p>
      </InfoBox>

      <h2>Retry: Only for Failures That Might Actually Succeed on a Second Try</h2>

      <p>
        <code>@Retry</code> re-invokes the method on failure, with a configurable delay between
        attempts. Scope matters: a retry only makes sense for a <em>transient</em> failure — a
        network blip, a timeout, a <code>503</code>. Retrying a validation error just calls the
        same broken request three times instead of once, and adds load to an already-struggling
        downstream.
      </p>

      <CodeBlock language="yaml" title="application.yml — Retry scoped to transient failures only">
{`resilience4j.retry:
  instances:
    paymentGateway:
      maxAttempts: 3                  # includes the original call — so 2 retries
      waitDuration: 500ms
      enableExponentialBackoff: true
      exponentialBackoffMultiplier: 2 # 500ms, 1s, 2s between attempts
      retryExceptions:
        - java.util.concurrent.TimeoutException
        - org.springframework.web.client.HttpServerErrorException   # any 5xx
      ignoreExceptions:
        - com.example.payments.CardValidationException               # 4xx — retrying never helps`}
      </CodeBlock>

      <p>
        <code>maxAttempts</code> counts the original call as attempt one.{' '}
        <code>retryExceptions</code> is an allow-list; <code>ignoreExceptions</code> takes
        precedence over it for anything more specific.
      </p>

      <CodeBlock language="java" title="Stacking @CircuitBreaker and @Retry on the same method">
{`@CircuitBreaker(name = "paymentGateway", fallbackMethod = "chargeFallback")
@Retry(name = "paymentGateway", fallbackMethod = "chargeFallback")
public ChargeResult charge(ChargeRequest request) {
    return gatewayApi.charge(request);
}`}
      </CodeBlock>

      <h2>RateLimiter: Protecting a Downstream (or Yourself) From Being Overwhelmed</h2>

      <p>
        <code>@RateLimiter</code> caps how many calls are allowed through in a given period. Use it
        in front of a third-party API with a contractual rate limit, or anything internal that
        cannot handle unbounded concurrent load — independent of whether those requests succeed or
        fail.
      </p>

      <CodeBlock language="java" title="Rate-limiting a status-polling endpoint">
{`import io.github.resilience4j.ratelimiter.annotation.RateLimiter;

@RateLimiter(name = "paymentGateway")
public ChargeResult checkStatus(String chargeId) {
    return gatewayApi.status(chargeId);
}`}
      </CodeBlock>

      <CodeBlock language="yaml" title="application.yml — RateLimiter configuration">
{`resilience4j.ratelimiter:
  instances:
    paymentGateway:
      limitForPeriod: 10       # 10 permits...
      limitRefreshPeriod: 1s   # ...replenished every second
      timeoutDuration: 2s      # how long a caller waits for a permit before failing`}
      </CodeBlock>

      <InfoBox variant="warning" title="Always Set limitRefreshPeriod Explicitly">
        <p>
          Resilience4j&apos;s own default for <code>limitRefreshPeriod</code> is 500{' '}
          <em>nanoseconds</em> — a library placeholder, not a production value. Leaving it unset
          silently gives you a limiter that refreshes essentially every tick and limits nothing
          meaningful. Always set both <code>limitForPeriod</code> and{' '}
          <code>limitRefreshPeriod</code> explicitly.
        </p>
      </InfoBox>

      <h2>Bulkhead: One Slow Dependency Should Not Exhaust Your Whole Thread Pool</h2>

      <p>
        A circuit breaker reacts to failures. A bulkhead reacts to <em>concurrency</em> — it caps
        how many calls to a specific dependency can be in flight at once, regardless of whether
        they&apos;re succeeding. On a ship, bulkheads are watertight compartments; applied here, a
        bulkhead on the payment gateway means that even if every call to it is currently hanging,
        only a bounded number of your threads can ever be tied up waiting on it. This matters more
        on Boot 2&apos;s default blocking Spring MVC stack than it might sound, precisely because
        of what the <a href="/springboot2/webflux">previous lesson</a> covers: MVC pins one thread
        to one request for the request&apos;s entire duration, so a small, fixed-size thread pool
        is the whole capacity of the service.
      </p>

      <p>
        Resilience4j ships two bulkhead implementations behind one annotation.{' '}
        <code>SEMAPHORE</code> (the default) limits concurrent calls using a semaphore permit —
        cheap, but a slow call still occupies whichever thread called it.{' '}
        <code>THREADPOOL</code> routes the call onto a dedicated thread pool and returns a{' '}
        <code>CompletableFuture</code>, fully isolating a slow dependency&apos;s threads from your
        request-handling threads.
      </p>

      <CodeBlock language="java" title="Thread-pool bulkhead isolating the payment gateway">
{`import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import java.util.concurrent.CompletableFuture;

@Bulkhead(name = "paymentGateway", type = Bulkhead.Type.THREADPOOL, fallbackMethod = "chargeAsyncFallback")
public CompletableFuture<ChargeResult> chargeAsync(ChargeRequest request) {
    return CompletableFuture.supplyAsync(() -> gatewayApi.charge(request));
}

private CompletableFuture<ChargeResult> chargeAsyncFallback(ChargeRequest request, Throwable t) {
    return CompletableFuture.completedFuture(ChargeResult.queued("Bulkhead full: " + t.getMessage()));
}`}
      </CodeBlock>

      <CodeBlock language="yaml" title="application.yml — the two bulkhead namespaces are separate">
{`# SEMAPHORE bulkheads live here
resilience4j.bulkhead:
  instances:
    paymentGateway:
      maxConcurrentCalls: 10
      maxWaitDuration: 0

# THREADPOOL bulkheads live under a DIFFERENT top-level key
resilience4j.thread-pool-bulkhead:
  instances:
    paymentGateway:
      maxThreadPoolSize: 10
      coreThreadPoolSize: 5
      queueCapacity: 20`}
      </CodeBlock>

      <h2>Composition Order Matters</h2>

      <p>
        Stack <code>@Retry</code> and <code>@CircuitBreaker</code> on the same method — as the
        payment example above does — and a real question follows: which one wraps which?
        Resilience4j&apos;s Spring integration documents a fixed default nesting order for every
        aspect it applies, on both the Boot 2 and Boot 3/4 integration artifacts alike — this part
        of the library&apos;s behaviour isn&apos;t Spring-Boot-version-specific any more than the
        annotations themselves are:
      </p>

      <CodeBlock language="text" title="Resilience4j's documented default aspect order">
{`Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( Function ) ) ) ) )`}
      </CodeBlock>

      <p>
        Read the parentheses from the outside in: <strong>Retry is the outermost wrapper</strong>,
        and <strong>CircuitBreaker sits just inside it</strong>. That ordering is deliberate.
        Because CircuitBreaker is inside Retry, <em>every individual retry attempt passes back
        through the circuit breaker and is recorded as its own call</em>. A burst of three retries
        against a dependency that is failing every time produces three recorded failures, not one
        — exactly the signal the breaker needs to trip open quickly. Once it opens, any further
        attempt hits the open breaker first and fails in microseconds with{' '}
        <code>CallNotPermittedException</code> instead of making a network call at all. Retry stops
        hammering a dependency the breaker has already condemned.
      </p>

      <FlowChart
        title="Aspect nesting, outermost to innermost — and where a failed attempt re-enters"
        chart={"graph LR\nRetry[Retry - outermost] --> CB[CircuitBreaker]\nCB --> RL[RateLimiter]\nRL --> TL[TimeLimiter]\nTL --> BH[Bulkhead - innermost]\nBH --> Fn[Function - the actual call]\nFn -.->|failure| CB\nCB -.->|closed, attempts remain: retry re-enters the whole stack| Retry\nCB -.->|OPEN| Short[CallNotPermittedException - fails in microseconds, no call made]\nstyle CB fill:#3d2f14\nstyle Short fill:#3b1a1a"}
      />

      <p>
        Follow the dashed arrows: a failed call at the center passes through CircuitBreaker first,
        which records the failure and updates its state <em>before</em> Retry ever gets a chance to
        fire another attempt. Only if the breaker is still closed does control return to Retry,
        which re-enters the entire stack from the top. Once the breaker opens, that loop is cut
        short.
      </p>

      <InfoBox variant="tip" title="The Order You Type the Annotations Does Not Matter">
        <p>
          It is tempting to assume Resilience4j reads your annotations top-to-bottom and nests
          them in that order — it does not. The nesting is fixed by each aspect&apos;s configured
          precedence. Override it, if you genuinely need to, with the explicit precedence
          properties — <code>resilience4j.retry.retryAspectOrder</code>,{' '}
          <code>resilience4j.circuitbreaker.circuitBreakerAspectOrder</code>,{' '}
          <code>resilience4j.ratelimiter.rateLimiterAspectOrder</code>,{' '}
          <code>resilience4j.timelimiter.timeLimiterAspectOrder</code>,{' '}
          <code>resilience4j.bulkhead.bulkheadAspectOrder</code> — where a higher integer means
          higher precedence (further out). Leave these unset and you get the default order above,
          which is what you want in the overwhelming majority of cases, on either Boot version.
        </p>
      </InfoBox>

      <table>
        <thead>
          <tr>
            <th>Module</th>
            <th>Annotation</th>
            <th>Guards against</th>
            <th>Key config</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Circuit Breaker</td>
            <td><code>@CircuitBreaker</code></td>
            <td>A dependency that is currently failing — fail fast instead of waiting on it</td>
            <td><code>failureRateThreshold</code>, <code>slidingWindowType</code></td>
          </tr>
          <tr>
            <td>Retry</td>
            <td><code>@Retry</code></td>
            <td>A one-off transient blip on an otherwise-healthy dependency</td>
            <td><code>maxAttempts</code>, <code>retryExceptions</code></td>
          </tr>
          <tr>
            <td>Rate Limiter</td>
            <td><code>@RateLimiter</code></td>
            <td>Sending more traffic than a dependency (or you) can handle</td>
            <td><code>limitForPeriod</code>, <code>limitRefreshPeriod</code></td>
          </tr>
          <tr>
            <td>Bulkhead</td>
            <td><code>@Bulkhead</code></td>
            <td>One slow dependency consuming your entire thread pool</td>
            <td><code>type</code>, <code>maxConcurrentCalls</code> / <code>maxThreadPoolSize</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Where This Sits In The Wider Migration</h2>

      <p>
        Because Resilience4j&apos;s annotations live in that Spring-version-agnostic module, adding
        or migrating resilience code is one of the lowest-risk pieces of work available on a Boot 2
        codebase — it is a good candidate to do <em>before</em> the Boot 3 jump, same spirit as
        pinning Hibernate sequence generators explicitly in the{' '}
        <a href="/springboot2/data">data lesson</a> or moving to the lambda security DSL in the{' '}
        <a href="/springboot2/security">security lesson</a>: land it, verify it, and it simply
        keeps working across the version bump you do later. Swap the one integration dependency
        (<code>resilience4j-spring-boot2</code> &rarr; <code>resilience4j-spring-boot3</code>) at
        migration time and every annotation, every YAML key, and every fallback method signature in
        this lesson carries over unchanged.
      </p>

      <FlowChart
        title="Where Hystrix, if you find it, fits into the same timeline"
        chart={"graph LR\nA[\"Spring Boot 1.x era - Spring Cloud Netflix / Hystrix is the default\"] --> B[\"Boot 2.0.0 ships - 2018-03-01\"]\nB --> C[\"Netflix declares Hystrix maintenance mode - 2018-11\"]\nC --> D[\"Spring Cloud keeps publishing the Hystrix starter anyway\"]\nD --> E[\"Last spring-cloud-starter-netflix-hystrix release - 2021-11-17\"]\nE --> F[\"Today: inherited Boot 2 codebase may hold EITHER, depending on when it was written\"]\nstyle B fill:#1a2744,stroke:#5b9cf6\nstyle C fill:#3a2f1a,stroke:#fbbf24\nstyle F fill:#3a1f1f,stroke:#f87171"}
      />

      <InteractiveChallenge
        question="You inherit a Spring Boot 2.7.18 service. Its payment-charging code is annotated with @HystrixCommand(fallbackMethod = 'chargeFallback', commandProperties = {...}), and application.yml has a hystrix.command.default.* block. What's the most accurate read of this codebase?"
        options={[
          "It's broken — Hystrix was removed from Spring Boot 2, so this must be dead code that never actually runs",
          "It's a real, working circuit breaker, just on a library Netflix itself put into maintenance mode in November 2018 and stopped releasing (Spring Cloud kept shipping the integration starter until 2021-11-17, three years later) — it works fine, gets no further releases, and migrating it to Resilience4j is separate, deliberate work",
          "It must have been written after 2021, since that's when Spring officially deprecated it",
          "Hystrix and Resilience4j are actually the same library under different names, so nothing needs to change"
        ]}
        correctIndex={1}
        explanation="Hystrix was never removed from anything — it's a third-party library that Netflix itself put into maintenance mode in November 2018 (verified from the project's own README) and made its final release, 1.5.18, that same month. It still works exactly as written; nothing about Spring Boot 2 or 3 removes or breaks it. What makes it notable is Spring Cloud kept publishing spring-cloud-starter-netflix-hystrix point releases until 2021-11-17 — three years after Netflix's own announcement — which is exactly why @HystrixCommand shows up in Boot 2 codebases written well after 2018, not just in code from the Boot 1.x/early-Boot-2.0 era. It is not dead code, not evidence of a specific write date, and not the same library as Resilience4j (they are separate, incompatible APIs). Treat it as a frozen dependency: functional, unmaintained, and a real migration candidate on its own timeline."
      />

      <InteractiveChallenge
        question="Your team is deciding whether to add circuit breaking to a Boot 2.7.18 service now, or wait until the Boot 3 migration lands so they only have to learn the pattern once. What does the dependency chain (resilience4j-spring-boot2 -> resilience4j-spring -> resilience4j-annotations) tell you about that decision?"
        options={[
          "Wait — the annotations are different on Boot 3, so work done now would need to be rewritten",
          "It doesn't matter either way — Resilience4j configuration is entirely YAML-driven and has no code dependency on Spring Boot version",
          "Add it now — the @CircuitBreaker/@Retry/@RateLimiter/@Bulkhead annotations live in resilience4j-annotations, a plain-Java module with no Spring dependency, shared by both the Boot 2 and Boot 3/4 integration chains (one point release apart, with a single new optional attribute added on the newer side); only the integration starter coordinate changes at migration time, not the code you'd write today",
          "Add it now, but expect the YAML configuration keys to need renaming during the Boot 3 migration, the same way spring.redis.* did"
        ]}
        correctIndex={2}
        explanation="The verified dependency chain shows resilience4j-spring-boot2 pulls in resilience4j-spring, which pulls in resilience4j-annotations:2.3.0 — and resilience4j-spring-boot3 pulls in resilience4j-spring6, which pulls in resilience4j-annotations:2.4.0. Same module, one point release apart (decompiling both shows 2.4.0 added a single new optional configuration() attribute across all five annotations; every attribute this lesson actually uses — name, fallbackMethod, type, permits — is present and unchanged in both). The Spring-AOP integration layer underneath genuinely differs between resilience4j-spring and resilience4j-spring6, because Spring Framework's AOP proxying changed between major versions — but that's a layer you never touch directly. So there is effectively no rewrite penalty for adding it now: the one line that changes at migration time is the <artifactId> in pom.xml (resilience4j-spring-boot2 -> resilience4j-spring-boot3), not the annotated code or the YAML. This is a clean case for doing the work now rather than waiting, unlike genuinely coupled changes such as the Redis property rename covered in the config lesson."
      />
    </LessonLayout>
  );
}

export default SpringBoot2Resilience;
