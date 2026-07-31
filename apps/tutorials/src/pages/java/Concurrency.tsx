import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Concurrency() {
  return (
    <LessonLayout
      title="Concurrency & Threads"
      sectionId="java"
      lessonIndex={7}
      prev={{ path: '/java/streams', label: 'Streams & Lambdas' }}
      next={{ path: '/java/io', label: 'I/O & File Handling' }}
    >
      <h2>The Landscape in 2026</h2>
      <p>
        Concurrency in Java looked broadly the same from 2004 (Java 5's
        <code>java.util.concurrent</code>) until 2023, when Java 21 shipped virtual
        threads as a stable feature. The mental model has shifted: <em>write blocking
        code</em>, run each request on its own virtual thread, and the JVM multiplexes
        thousands of them onto a handful of OS threads. Traditional platform threads,
        <code>ExecutorService</code>, and <code>CompletableFuture</code> still exist and
        are still useful — but they're no longer the default answer for I/O-bound work.
      </p>

      <FlowChart
        title="Which tool for which job"
        chart={"graph TD\nA[What's your workload?] --> B{I/O bound?}\nB -->|Yes| C[Virtual threads: blocking code, one thread per task]\nB -->|CPU bound| D[Platform threads / ForkJoinPool]\nA --> E{Need to coordinate related tasks?}\nE -->|Yes| F[StructuredTaskScope Java 21+]\nA --> G{Need shared per-request context?}\nG -->|Yes, immutable| H[ScopedValue]\nG -->|Mutable, legacy| I[ThreadLocal]"}
      />

      <h2>Virtual Threads — The New Default (Java 21+)</h2>
      <p>
        A virtual thread is a thread that isn't tied to an OS thread. The JVM schedules
        many virtual threads onto a small number of carrier (platform) threads. When a
        virtual thread blocks on I/O, the JVM unmounts it from its carrier and reuses
        the carrier for other work.
      </p>
      <p>
        Practical implication: <strong>you can hold tens of thousands of blocked threads
        simultaneously</strong> without exhausting OS resources. This changes the shape
        of "correct" concurrent code — you no longer need callback-heavy or reactive
        pipelines to handle high concurrency for I/O work.
      </p>

      <CodeBlock language="java" title="Creating virtual threads — three shapes">
{`// 1. One-off virtual thread
Thread.startVirtualThread(() -> {
    log.info("hello from a virtual thread");
});

// 2. Builder for more control
Thread t = Thread.ofVirtual()
    .name("worker-", 1L)
    .start(() -> { /* ... */ });
t.join();

// 3. An executor that spawns a fresh virtual thread per task.
// This is what modern application code should reach for.
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i ->
        executor.submit(() -> httpClient.get("/item/" + i))
    );
    // executor.close() waits for all submitted tasks to finish.
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Virtual threads are cheap; don't pool them">
        <p>
          Reflex from the platform-thread era: create a thread pool of N workers, submit
          tasks. For virtual threads, drop the pool. Every task gets its own fresh virtual
          thread; the JVM manages the actual OS resources. Pooling virtual threads defeats
          the point and just re-introduces the queue-management problems the pool was
          designed to solve.
        </p>
      </InfoBox>

      <h3>Pinning — the one gotcha you must know</h3>
      <p>
        A virtual thread that hits <code>synchronized</code> or a native call is
        <em>pinned</em> to its carrier — the JVM can't unmount it. If enough virtual
        threads pin at once, you exhaust the carrier pool and everything slows down. Two
        rules:
      </p>
      <ul>
        <li>Replace <code>synchronized</code> with <code>ReentrantLock</code> where
            contention is likely.</li>
        <li>Diagnose pinning with <code>-Djdk.tracePinnedThreads=full</code> — the JVM
            logs every pin site with a stack trace.</li>
      </ul>
      <CodeBlock language="java" title="Avoid pinning inside virtual threads">
{`// Pinned: synchronized block runs while the virtual thread is I/O-blocked.
public class Counter {
    private long count;
    public synchronized void inc() {
        externalCall();          // I/O inside synchronized — pins the vthread
        count++;
    }
}

// Fixed with ReentrantLock — unmount happens across the I/O call.
public class Counter {
    private final ReentrantLock lock = new ReentrantLock();
    private long count;
    public void inc() {
        lock.lock();
        try {
            externalCall();
            count++;
        } finally {
            lock.unlock();
        }
    }
}`}
      </CodeBlock>

      <h2>Structured Concurrency</h2>
      <p>
        Java 21 previewed <code>StructuredTaskScope</code> (still evolving through Java
        23). The idea: fork multiple subtasks in a lexical scope, join them, and if one
        fails, cancel the siblings. Cleaner than juggling <code>Future</code>s or
        <code>CompletableFuture</code> chains.
      </p>
      <CodeBlock language="java" title="Fork-and-join with automatic cancellation">
{`// Fetch three things in parallel; abort all if any fails.
public EnrichedOrder enrich(UUID orderId) throws InterruptedException {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        var orderTask    = scope.fork(() -> orderService.find(orderId));
        var customerTask = scope.fork(() -> customerService.forOrder(orderId));
        var paymentTask  = scope.fork(() -> paymentService.forOrder(orderId));

        scope.join();               // wait for all
        scope.throwIfFailed();      // rethrow if any failed

        return new EnrichedOrder(orderTask.get(), customerTask.get(), paymentTask.get());
    }
}

// If the customer service throws, order and payment tasks are cancelled automatically.
// The scope closes deterministically, so nothing leaks across the try boundary.`}
      </CodeBlock>

      <CodeBlock language="java" title="ShutdownOnSuccess — first result wins">
{`// Race two mirrors; use whichever returns first.
public InventoryDto anyMirror(String sku) throws InterruptedException {
    try (var scope = new StructuredTaskScope.ShutdownOnSuccess<InventoryDto>()) {
        scope.fork(() -> primaryClient.get(sku));
        scope.fork(() -> secondaryClient.get(sku));
        scope.join();
        return scope.result();
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why structured concurrency matters">
        <p>
          Before, coordinating multiple async operations meant tracking
          <code>Future</code>s manually, handling partial failures by hand, and hoping no
          background task outlived its context. Structured concurrency makes the parent's
          scope the boundary — all forked work either completes or is cancelled when the
          scope closes. No leaked tasks, no orphaned resources, and stack traces that
          actually connect the parent to the failure.
        </p>
      </InfoBox>

      <h2>ScopedValue — The Modern Replacement for ThreadLocal</h2>
      <p>
        <code>ThreadLocal</code> is a mutable per-thread bag of variables. It works but
        has real problems: memory leaks (values pinned to threads for the thread's
        lifetime), unclear ownership, and awkward inheritance to child threads.
        <code>ScopedValue</code> (Java 21+) fixes all three: values are <em>immutable</em>
        within a scope, ownership is lexical, and children automatically see their
        parent's bindings.
      </p>
      <CodeBlock language="java" title="Per-request context, no ThreadLocal leaks">
{`public class RequestContext {
    public static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();
    public static final ScopedValue<UserId>  USER      = ScopedValue.newInstance();
}

// At the request boundary
public void handle(HttpRequest req) {
    ScopedValue.where(RequestContext.REQUEST_ID, req.header("X-Request-Id"))
               .where(RequestContext.USER,       req.authenticatedUser())
               .run(() -> serviceLayer.process(req));
    // After run() returns, the bindings are cleared — nothing leaks.
}

// Downstream code — read via .get(), no explicit passing
public class AuditService {
    public void record(String action) {
        String reqId = RequestContext.REQUEST_ID.get();
        UserId user  = RequestContext.USER.get();
        log.info("[{}] {} by {}", reqId, action, user);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="ScopedValue is still incubating">
        <p>
          As of Java 21 it's a preview/incubator API, stabilizing around Java 25. On
          Java 21 today, guard with <code>--enable-preview</code>. Existing services will
          keep using <code>ThreadLocal</code> for the foreseeable future — but for new
          code and new context variables, <code>ScopedValue</code> is the better default.
        </p>
      </InfoBox>

      <h2>CompletableFuture — Still Useful, Different Role</h2>
      <p>
        Before virtual threads, <code>CompletableFuture</code> was the primary way to
        compose async work without blocking threads. It's still relevant for pipelines
        where you want lazy composition, non-blocking APIs, or explicit executor
        control — but for straightforward "call three services in parallel, wait for
        all", structured concurrency is now clearer.
      </p>
      <CodeBlock language="java" title="CompletableFuture patterns still worth knowing">
{`// Chain: transform, chain, combine
CompletableFuture<String> f = CompletableFuture
    .supplyAsync(() -> fetchUser(id))
    .thenApply(User::displayName)
    .exceptionally(t -> "unknown");

// Two independent async calls, combine when both done
CompletableFuture<UserDto> user = CompletableFuture.supplyAsync(() -> userSvc.find(id));
CompletableFuture<OrderDto> orders = CompletableFuture.supplyAsync(() -> orderSvc.forUser(id));
CompletableFuture<Combined> both = user.thenCombine(orders, Combined::new);

// Fire-and-forget with a specific executor
CompletableFuture.runAsync(() -> auditor.record(action), auditorExecutor);

// allOf — wait for many
CompletableFuture<Void> all = CompletableFuture.allOf(f1, f2, f3);
all.get();  // rethrows any single failure`}
      </CodeBlock>

      <h2>ExecutorService — When You Still Reach For It</h2>
      <ul>
        <li>You need a <strong>bounded queue</strong> and rejection behavior
            (<code>ThreadPoolExecutor</code>).</li>
        <li>You have <strong>CPU-bound</strong> work and need parallelism scaled to
            available cores.</li>
        <li>You need <strong>scheduling</strong> semantics
            (<code>ScheduledExecutorService</code>).</li>
      </ul>
      <CodeBlock language="java" title="Modern executor patterns">
{`// I/O-bound — virtual thread per task, no pool sizing needed
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    urls.forEach(u -> exec.submit(() -> fetch(u)));
}

// CPU-bound — sized to cores
try (var exec = Executors.newFixedThreadPool(
        Runtime.getRuntime().availableProcessors())) {
    matrices.forEach(m -> exec.submit(() -> compute(m)));
}

// Scheduled — recurring background task
try (var scheduler = Executors.newSingleThreadScheduledExecutor()) {
    scheduler.scheduleAtFixedRate(this::flushMetrics, 0, 30, TimeUnit.SECONDS);
    Thread.sleep(Duration.ofMinutes(5));
}`}
      </CodeBlock>

      <h2>Synchronization Primitives</h2>
      <CodeBlock language="java" title="ReentrantLock — richer than synchronized">
{`private final ReentrantLock lock = new ReentrantLock();

public void doThing() {
    // Try with timeout — synchronized can't do this
    try {
        if (!lock.tryLock(2, TimeUnit.SECONDS)) {
            throw new BusyException("could not acquire lock");
        }
    } catch (InterruptedException ie) {
        Thread.currentThread().interrupt();
        throw new RuntimeException(ie);
    }
    try {
        // critical section
    } finally {
        lock.unlock();
    }
}

// Read-heavy workloads — many readers, few writers
private final ReadWriteLock rw = new ReentrantReadWriteLock();
public V read(K key) {
    rw.readLock().lock();
    try { return map.get(key); } finally { rw.readLock().unlock(); }
}
public void write(K k, V v) {
    rw.writeLock().lock();
    try { map.put(k, v); } finally { rw.writeLock().unlock(); }
}`}
      </CodeBlock>

      <h3>Atomic types for lock-free counters</h3>
      <CodeBlock language="java" title="Atomic primitives">
{`// Simple counters
AtomicLong    requests   = new AtomicLong();
AtomicInteger active     = new AtomicInteger();
AtomicReference<Config> configRef = new AtomicReference<>(initial);

requests.incrementAndGet();
active.updateAndGet(n -> Math.max(0, n - 1));
configRef.compareAndSet(old, next);

// High-contention counters — thread-local accumulators, cheaper than AtomicLong
LongAdder totalBytes = new LongAdder();
totalBytes.add(n);
long snapshot = totalBytes.sum();`}
      </CodeBlock>

      <h2>Thread-Safe Collections</h2>
      <CodeBlock language="java" title="What to use instead of a synchronized ArrayList">
{`// Concurrent map — the workhorse
ConcurrentHashMap<String, Session> sessions = new ConcurrentHashMap<>();
sessions.computeIfAbsent(id, Session::create);
sessions.merge(id, 1, Integer::sum);

// Concurrent queue — bounded, blocking
BlockingQueue<Task> queue = new ArrayBlockingQueue<>(1000);
queue.put(task);        // blocks if full
Task next = queue.take(); // blocks if empty

// Copy-on-write list — many reads, few writes; readers never block
List<Listener> listeners = new CopyOnWriteArrayList<>();

// Traditional synchronized wrappers are almost always the wrong choice
// — they lock the whole collection for every operation.`}
      </CodeBlock>

      <h2>Common Pitfalls</h2>
      <InfoBox variant="danger" title="Traps that show up in concurrent Java code">
        <ul>
          <li>
            <strong>Pooling virtual threads.</strong> They are meant to be created and
            discarded per task. Pooling them re-introduces the bottleneck they were
            designed to remove.
          </li>
          <li>
            <strong><code>synchronized</code> around I/O in virtual threads.</strong>
            Pins the vthread; scale collapses. Prefer <code>ReentrantLock</code>.
          </li>
          <li>
            <strong>Blocking calls inside <code>CompletableFuture</code> chains that use
            the common ForkJoinPool.</strong> Starves the pool for other work. Always
            supply an explicit executor for I/O-heavy chains.
          </li>
          <li>
            <strong>ThreadLocal that never gets cleared.</strong> A leak per request.
            Prefer <code>ScopedValue</code>. If you must use ThreadLocal, always
            <code>try/finally</code> to remove it.
          </li>
          <li>
            <strong>Sharing mutable state via <code>volatile</code>.</strong>
            <code>volatile</code> guarantees visibility but not atomicity. Read-modify-write
            still needs <code>synchronized</code>, atomics, or locks.
          </li>
          <li>
            <strong>Ignoring <code>InterruptedException</code>.</strong> Catching and
            swallowing loses cancellation semantics. Always restore the interrupt with
            <code>Thread.currentThread().interrupt()</code>.
          </li>
        </ul>
      </InfoBox>

      <h2>The Decision Tree</h2>
      <CodeBlock language="text" title="Which primitive for which job">
{`Task is I/O-bound (HTTP, DB, disk) ................... virtual thread per task
Task is CPU-bound (parallel compute) ................. fixed thread pool ~ CPU count
Coordinate N tasks that all must succeed ............. StructuredTaskScope.ShutdownOnFailure
Race N tasks, first success wins ..................... StructuredTaskScope.ShutdownOnSuccess
Per-request immutable context (traceId, userId) ...... ScopedValue
Legacy per-thread mutable context .................... ThreadLocal (last resort)
Shared counter, low contention ....................... AtomicLong
Shared counter, high contention ...................... LongAdder
Read-heavy map ....................................... ConcurrentHashMap
Producer / consumer queue ............................ BlockingQueue implementations
Read-mostly, write-rarely list ....................... CopyOnWriteArrayList
Scheduled repeating task ............................. ScheduledExecutorService
Non-blocking composition ............................. CompletableFuture`}
      </CodeBlock>

      <h2>Concurrency Checklist</h2>
      <InfoBox variant="success" title="Signs your concurrent code is healthy">
        <ul>
          <li>I/O-bound servers use virtual threads; no fixed pool sized to "expected
              concurrency".</li>
          <li>No <code>synchronized</code> block wraps an I/O call.</li>
          <li>Coordinated concurrent work uses <code>StructuredTaskScope</code>, not
              hand-rolled Future juggling.</li>
          <li>Per-request context lives in <code>ScopedValue</code> for new code;
              <code>ThreadLocal</code> only where needed for legacy interop, and always
              cleared in <code>finally</code>.</li>
          <li>Every <code>InterruptedException</code> either propagates or restores
              the interrupt.</li>
          <li>Concurrent collections chosen deliberately — not
              <code>Collections.synchronizedMap</code>.</li>
          <li>Pinning is not silently happening under load
              (<code>-Djdk.tracePinnedThreads</code> in dev).</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Your Spring Boot service enables spring.threads.virtual.enabled=true and moves all servlet requests to virtual threads. Under load, latency actually gets WORSE. jstack shows dozens of virtual threads pinned to a small number of carrier threads. What's the fix?"
        options={[
          "Increase the number of platform carrier threads with -Djdk.virtualThreadScheduler.parallelism",
          "Add a virtual thread pool with a fixed size",
          "Find the synchronized blocks or native calls that pin virtual threads during I/O and replace synchronized with ReentrantLock",
          "Disable virtual threads and go back to platform threads"
        ]}
        correctIndex={2}
        explanation="Pinning is what happens when a virtual thread hits a synchronized block or a native call while trying to yield during I/O — the JVM can't unmount it from the carrier. Under high concurrency, the small carrier-thread pool gets stuck holding pinned virtual threads and the whole system stalls. The fix is to eliminate pinning at the source: replace synchronized blocks with ReentrantLock (which supports unmounting) around I/O calls. Increasing carrier threads is a band-aid; pooling defeats the point of virtual threads."
      />
    </LessonLayout>
  );
}
