import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Resilience() {
  return (
    <LessonLayout
      title="Resilience4j & Circuit Breakers"
      sectionId="springboot"
      lessonIndex={17}
      prev={{ path: '/springboot/webflux', label: 'Reactive Programming with WebFlux' }}
      next={{ path: '/springboot/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        The microservices patterns lesson already covered <em>what</em> a circuit breaker is —
        closed, open, half-open, the failure threshold that flips the switch. This lesson skips
        that theory and goes straight to the part that actually shows up in a Spring codebase:
        how to wire circuit breaking, retries, rate limiting, and bulkheads into real service code
        with Resilience4j, and — the part almost every tutorial gets hand-wavy about — what
        happens when you stack more than one of these on the same method.
      </p>

      <h2>Why Resilience4j, Not Hystrix</h2>

      <p>
        If you search for &quot;Spring circuit breaker&quot; you will still find plenty of
        material about Netflix Hystrix, because for years it <em>was</em> the answer. It no longer
        is, and it is worth knowing precisely why rather than just repeating &quot;Hystrix is
        old.&quot; Netflix put Hystrix into maintenance mode in November 2018 — the project&apos;s
        own README states it plainly:
      </p>

      <InfoBox variant="note" title="Straight From the Netflix/Hystrix README">
        <p>
          &quot;Hystrix is no longer in active development, and is currently in maintenance
          mode.&quot; Netflix will &quot;no longer actively review issues, merge pull-requests, and
          release new versions of Hystrix,&quot; and for new internal projects intends &quot;to
          leverage open and active projects like resilience4j.&quot; The final release was 1.5.18.
        </p>
      </InfoBox>

      <p>
        That last line is the whole story: Netflix, the company that built Hystrix, told everyone
        to move to Resilience4j. The reasons line up with what you would guess from the timing —
        Hystrix predates Java 8 lambdas and was built around RxJava and reflection-heavy proxy
        wrapping; Resilience4j&apos;s own project description calls it &quot;a lightweight fault
        tolerance library designed for functional programming&quot; that &quot;provides
        higher-order functions (decorators) to enhance any functional interface, lambda expression
        or method reference.&quot; Practically, that means two things you will feel immediately:
        it is modular (add the one dependency for the pattern you need — <code>circuitbreaker</code>,{' '}
        <code>retry</code>, <code>ratelimiter</code>, <code>bulkhead</code> — instead of one giant
        artifact), and it composes with plain Java functional interfaces and{' '}
        <code>CompletableFuture</code> instead of forcing RxJava on you. It is also still actively
        released — the current stable line sits at 2.4.x on Maven Central as of this writing, with
        regular releases, which is the opposite of Hystrix&apos;s frozen 1.5.18.
      </p>

      <h2>Circuit Breaker: The Annotation Version</h2>

      <p>
        <code>@CircuitBreaker</code> wraps a method the same way the conceptual pattern describes —
        it counts recent outcomes, and once too many of them are failures, it flips open and stops
        even attempting the call. The two things worth being precise about are the sliding window
        and the fallback method&apos;s required shape.
      </p>

      <CodeBlock language="java" title="PaymentClient.java — @CircuitBreaker with a fallback">
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
    // exception parameter on the end. That is the entire contract — get the
    // signature wrong and Resilience4j silently fails to find the fallback.
    private ChargeResult chargeFallback(ChargeRequest request, Throwable t) {
        return ChargeResult.queued("Payment gateway unavailable, queued: " + t.getMessage());
    }
}`}
      </CodeBlock>

      <p>
        The fallback signature rule is not a convention, it is enforced: Resilience4j&apos;s own
        docs state that &quot;a fallback method should be placed in the same class and must have
        the same method signature with just ONE extra target exception parameter.&quot; You can
        also declare multiple overloads for different exception types (a{' '}
        <code>TimeoutException</code>-specific one and a general <code>Throwable</code> catch-all)
        and Resilience4j dispatches to whichever one most specifically matches what was actually
        thrown — the compiled example above does exactly that.
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
        <strong>COUNT_BASED</strong> (the default) records the last <code>slidingWindowSize</code>{' '}
        calls, however long that takes to accumulate — fine for steady traffic, misleading for a
        low-traffic endpoint where 20 calls might span an hour and mix in a stale outage.{' '}
        <strong>TIME_BASED</strong> instead records every call from the last{' '}
        <code>slidingWindowSize</code> seconds, so the window always reflects &quot;right
        now&quot; regardless of volume. Either way, the breaker will not calculate a failure rate —
        and therefore cannot open — until <code>minimumNumberOfCalls</code> have been recorded in
        the current window; 9 failures out of 9 calls will not trip a breaker configured with{' '}
        <code>minimumNumberOfCalls: 10</code>, by design, so a burst of exactly one or two failed
        requests can never look statistically like an outage.
      </p>

      <InfoBox variant="danger" title="The Failure Mode a Circuit Breaker Actually Prevents">
        <p>
          Picture <code>PaymentClient</code> with no circuit breaker at all, and the payment
          gateway starts timing out at 30 seconds per call. Every incoming request to{' '}
          <em>your</em> service that needs a charge now blocks for up to 30 seconds waiting on a
          dependency that is not coming back. Your service has a finite thread pool — Tomcat&apos;s
          default is 200 threads — and under real traffic that pool fills with requests all stuck
          waiting on the same dead dependency. Once the pool is exhausted, requests that have{' '}
          <em>nothing to do with payments</em> — a health check, a product page, an unrelated
          endpoint — start queuing behind them too, because there are no threads left to serve
          anything. One slow downstream call has just taken your entire service down. This is a
          cascading failure, and it is the single most common way a distributed system falls over.
        </p>
        <p>
          With the circuit breaker in place, once <code>failureRateThreshold</code> is crossed the
          breaker opens: the next call to <code>charge()</code> never touches the network at all —
          it throws a <code>CallNotPermittedException</code> in microseconds, Resilience4j routes
          straight to <code>chargeFallback</code>, and the request thread is freed immediately. Your
          service degrades — payments queue instead of processing instantly — but it stays up for
          everything else. That is the entire value proposition of this lesson in one sentence:
          fail fast on purpose, so a dependency&apos;s outage stays that dependency&apos;s outage.
        </p>
      </InfoBox>

      <h2>Retry: Only for Failures That Might Actually Succeed on a Second Try</h2>

      <p>
        <code>@Retry</code> re-invokes the method on failure, with a configurable delay between
        attempts. The part that is easy to get wrong is scope: a retry only makes sense for a{' '}
        <em>transient</em> failure — a network blip, a request timeout, a <code>503</code> the
        gateway returned because it was momentarily overloaded. Retrying a validation error (a bad
        card number, a malformed request) does nothing but call the same broken request three
        times instead of once, and if the downstream is already struggling, that tripling of load
        is actively harmful. Resilience4j scopes this explicitly with{' '}
        <code>retryExceptions</code>/<code>ignoreExceptions</code>, and it is worth actually using
        them rather than leaving retry wide open to every <code>Exception</code>.
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
        - com.example.payments.CardValidationException               # 4xx — retrying a bad card number never helps`}
      </CodeBlock>

      <p>
        <code>maxAttempts</code> counts the original call as attempt one, so{' '}
        <code>maxAttempts: 3</code> means the original call plus 2 retries, not 3 retries.{' '}
        <code>retryExceptions</code> is an allow-list — only exceptions assignable to one of these
        types are retried at all — and <code>ignoreExceptions</code> takes precedence over it for
        anything more specific that should be excluded even if a supertype matched.
        Composing this with the circuit breaker from the section above is exactly the combination
        the next section is about.
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
        <code>@RateLimiter</code> caps how many calls are allowed through in a given period,
        rejecting (or making the caller wait, up to a timeout) once the cap is hit. Use it in front
        of a third-party API with a contractual rate limit, or in front of anything internal you
        know cannot handle unbounded concurrent load — it is the pattern for &quot;don&apos;t send
        more than N requests per second,&quot; independent of whether those requests are succeeding
        or failing.
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
          <em>nanoseconds</em> — a value that only makes sense as a library placeholder, not
          something you would ever run in production. Leaving it unset silently gives you a limiter
          that refreshes essentially every tick and does not actually limit anything meaningful.
          Always set both <code>limitForPeriod</code> and <code>limitRefreshPeriod</code>{' '}
          explicitly for every instance.
        </p>
      </InfoBox>

      <h2>Bulkhead: One Slow Dependency Should Not Exhaust Your Whole Thread Pool</h2>

      <p>
        A circuit breaker reacts to failures. A bulkhead reacts to <em>concurrency</em> — it caps
        how many calls to a specific dependency can be in flight at once, full stop, regardless of
        whether those calls are succeeding. The name is the metaphor: on a ship, bulkheads are
        watertight compartments, so a hull breach in one compartment floods that compartment and
        nowhere else. Applied to your service, a bulkhead on the payment gateway means that even if
        every single call to it is currently hanging (not yet failed, not yet timed out — just
        slow), only a bounded number of your threads can ever be tied up waiting on it at once. The
        rest of your thread pool stays free to serve every other endpoint.
      </p>

      <p>
        Resilience4j ships two bulkhead implementations behind one annotation. The default,{' '}
        <code>SEMAPHORE</code>, limits concurrent calls on the calling thread using a semaphore
        permit — cheap, but a slow call still occupies whichever thread called it.{' '}
        <code>THREADPOOL</code> instead routes the call onto a dedicated, separately-sized thread
        pool and returns a <code>CompletableFuture</code>, fully isolating a slow dependency&apos;s
        threads from your request-handling threads.
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

      <p>
        This matters more in a traditional blocking Spring MVC app than it might sound, precisely
        because of what the Reactive Programming with WebFlux lesson covers: MVC pins one thread to
        one request for the request&apos;s entire duration, so a small, fixed-size thread pool is
        the whole capacity of the service, and a bulkhead is often the only thing standing between
        one flaky dependency and that pool hitting zero.
      </p>

      <h2>Composition Order Matters</h2>

      <p>
        Stack <code>@Retry</code> and <code>@CircuitBreaker</code> on the same method — as the
        payment example above does — and a real question follows: which one wraps which? Resilience4j&apos;s
        Spring integration documents a fixed default nesting order for every aspect it applies:
      </p>

      <CodeBlock language="text" title="Resilience4j's documented default aspect order">
{`Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( Function ) ) ) ) )`}
      </CodeBlock>

      <p>
        Read the parentheses from the outside in: <strong>Retry is the outermost wrapper</strong>,
        and <strong>CircuitBreaker sits just inside it</strong> — closer to the actual call than
        Retry is. That ordering is deliberate, and it is the one that actually protects you.
        Because CircuitBreaker is inside Retry, <em>every individual retry attempt passes back
        through the circuit breaker and is recorded as its own call</em>. A burst of three retries
        against a dependency that is failing every time produces three recorded failures, not one —
        which is exactly the signal the breaker needs to trip open quickly. And once it does open,
        any further attempt (later in the same retry loop, or on the next incoming request) hits
        the open breaker first and fails in microseconds with <code>CallNotPermittedException</code>{' '}
        instead of making a network call at all. Retry stops hammering a dependency that the
        breaker has already condemned. Had the nesting been reversed — CircuitBreaker outside,
        Retry inside — an entire 3-attempt retry sequence would look like a single call to the
        breaker, diluting the failure signal and letting retries keep pounding a dead dependency for
        far longer before the breaker had enough evidence to open.
      </p>

      <FlowChart
        title="Aspect nesting, outermost to innermost — and where a failed attempt re-enters"
        chart={"graph LR\nRetry[Retry - outermost] --> CB[CircuitBreaker]\nCB --> RL[RateLimiter]\nRL --> TL[TimeLimiter]\nTL --> BH[Bulkhead - innermost]\nBH --> Fn[Function - the actual call]\nFn -.->|failure| CB\nCB -.->|closed, attempts remain: retry re-enters the whole stack| Retry\nCB -.->|OPEN| Short[CallNotPermittedException - fails in microseconds, no call made]\nstyle CB fill:#3d2f14\nstyle Short fill:#3b1a1a"}
      />

      <p>
        Follow the dashed arrows: a failed call at the center does not go straight back out to
        Retry. It first passes through CircuitBreaker, which records the failure and updates its
        state <em>before</em> Retry ever gets a chance to fire off another attempt. Only if the
        breaker is still closed does control return all the way out to Retry, which then re-enters
        the entire stack — CircuitBreaker, RateLimiter, TimeLimiter, Bulkhead — from the top, exactly
        as if it were a brand-new call. Once the breaker opens, that loop is cut short: CircuitBreaker
        diverts straight to <code>CallNotPermittedException</code> instead, and Retry never gets to
        try again.
      </p>

      <InfoBox variant="tip" title="The Order You Type the Annotations Does Not Matter">
        <p>
          It is tempting to assume Resilience4j reads your annotations top-to-bottom and nests them
          in that order — it does not. The nesting above is fixed by each aspect&apos;s configured
          precedence, not by where you physically place <code>@CircuitBreaker</code> versus{' '}
          <code>@Retry</code> in your source file. If you need to override the default for a
          specific reason, Resilience4j exposes explicit precedence properties —{' '}
          <code>resilience4j.retry.retryAspectOrder</code>,{' '}
          <code>resilience4j.circuitbreaker.circuitBreakerAspectOrder</code>,{' '}
          <code>resilience4j.ratelimiter.rateLimiterAspectOrder</code>,{' '}
          <code>resilience4j.timelimiter.timeLimiterAspectOrder</code>,{' '}
          <code>resilience4j.bulkhead.bulkheadAspectOrder</code> — where a higher integer value
          means higher precedence (further out). Leave these unset and you get the default order
          above, which is the order you want in the overwhelming majority of cases.
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

      <InteractiveChallenge
        question={"You stack @Retry and @CircuitBreaker on the same Resilience4j-annotated method, using the same instance name and default configuration. Which one ends up as the outer wrapper, and why does that matter?"}
        options={[
          "@CircuitBreaker is outer, so an entire multi-attempt retry sequence only ever counts as one call toward the failure rate",
          "@Retry is outer and @CircuitBreaker is inner — so each individual retry attempt passes back through the breaker and is recorded separately, letting the breaker trip mid-sequence and short-circuit any further attempts",
          "Whichever annotation is written first (higher up) in the source code becomes the outer wrapper",
          "It doesn't matter — Resilience4j runs all aspects concurrently on separate threads"
        ]}
        correctIndex={1}
        explanation={"Resilience4j's documented default nesting is Retry(CircuitBreaker(RateLimiter(TimeLimiter(Bulkhead(Function))))) — Retry outermost, CircuitBreaker just inside it. Because the breaker sits closer to the actual call, every retry attempt is recorded as its own success or failure, so a burst of failing retries is exactly what trips the breaker open — and once open, further attempts fail in microseconds with CallNotPermittedException instead of hammering a dead dependency. Annotation order in your source file has no effect on this; the nesting is controlled by each aspect's precedence, overridable only via the *AspectOrder properties."}
      />
    </LessonLayout>
  );
}
