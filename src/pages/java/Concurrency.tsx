import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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

      <h3>Pinning — the gotcha whose rules changed in Java 24</h3>
      <p>
        A <em>pinned</em> virtual thread is one the JVM cannot unmount from its carrier
        while it blocks. If enough virtual threads pin at once you exhaust the carrier
        pool and throughput collapses. The important thing to know in 2026 is that{' '}
        <strong>the main cause of pinning was removed in Java 24</strong>, so advice
        written for Java 21 is now half-obsolete.
      </p>

      <FlowChart
        title="N Virtual Threads, M Carrier Threads"
        chart={"graph LR\nA[N virtual threads] --> B{JVM Scheduler}\nB --> C[M carrier threads - real OS threads]\nC -->|blocks on ordinary I/O| D[Unmounts: carrier freed for another virtual thread]\nC -->|blocks while pinned - native frame, class init, or pre-Java-24 synchronized| E[Stays mounted: carrier stuck until unblocked]"}
      />

      <CodeBlock language="text" title="What actually pins, by JDK version">
{`Java 21-23   synchronized blocks/methods PIN across blocking calls.
             Native (JNI) frames PIN.
             -> The classic "replace synchronized with ReentrantLock" advice.

Java 24+     JEP 491 reimplemented object monitors so a virtual thread
             CAN unmount inside synchronized. synchronized no longer pins
             for ordinary blocking I/O.
             Still pins: native/JNI frames, and class-initializer (<clinit>)
             frames.

Java 25 LTS  Same as 24. Diagnose with the JFR event jdk.VirtualThreadPinned
             (-Djdk.tracePinnedThreads was removed in 24).`}
      </CodeBlock>
      <p>
        So the rule depends on the JDK you actually target:
      </p>
      <ul>
        <li><strong>On Java 21&ndash;23</strong> (still very common in production): replace{' '}
            <code>synchronized</code> with <code>ReentrantLock</code> anywhere a lock is
            held across I/O.</li>
        <li><strong>On Java 24+</strong>: <code>synchronized</code> is safe for virtual
            threads again. You no longer need to churn your locking code — though{' '}
            <code>ReentrantLock</code> is still the better tool when you want{' '}
            <code>tryLock</code>, timeouts, fairness, or multiple conditions.</li>
        <li><strong>Either way</strong>, holding <em>any</em> lock across a slow call is a
            throughput problem in its own right. Pinning was never the only reason to
            avoid it.</li>
      </ul>
      <CodeBlock language="java" title="Lock held across I/O — the shape that mattered">
{`// On Java 21-23 this pins the virtual thread to its carrier for the whole call.
// On Java 24+ it no longer pins — but it still serialises every caller behind
// one slow network round trip, which is the real bug.
public class Counter {
    private long count;
    public synchronized void inc() {
        externalCall();          // slow I/O while holding the monitor
        count++;
    }
}

// Better on every JDK: do the I/O outside the lock, and only guard the
// state mutation. Nothing is pinned and nothing is serialised unnecessarily.
public class Counter {
    private final AtomicLong count = new AtomicLong();
    public void inc() {
        externalCall();          // no lock held here
        count.incrementAndGet(); // the only part that needs to be atomic
    }
}`}
      </CodeBlock>
      <InfoBox variant="tip" title="Interview framing">
        <p>
          &ldquo;Virtual threads pin on <code>synchronized</code>&rdquo; is the answer
          everyone memorised from the Java 21 launch articles. Saying &ldquo;that was true
          through Java 23, and JEP 491 fixed it in 24 — now only native frames and class
          initializers pin&rdquo; signals that you have followed the platform rather than
          read one blog post.
        </p>
      </InfoBox>

      <h2>Structured Concurrency</h2>
      <p>
        Java 21 previewed <code>StructuredTaskScope</code>, and it is <em>still</em> a preview
        API — sixth preview in Java 26 (JEP 525). The idea: fork multiple subtasks in a
        lexical scope, join them, and if one fails, cancel the siblings. Cleaner than
        juggling <code>Future</code>s or <code>CompletableFuture</code> chains.
      </p>
      <CodeBlock language="java" title="Fork-and-join with automatic cancellation">
{`// Fetch three things in parallel; abort all if any fails.
public EnrichedOrder enrich(UUID orderId)
        throws InterruptedException, ExecutionException {   // throwIfFailed throws the latter
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
public InventoryDto anyMirror(String sku)
        throws InterruptedException, ExecutionException {   // result() throws the latter
    try (var scope = new StructuredTaskScope.ShutdownOnSuccess<InventoryDto>()) {
        scope.fork(() -> primaryClient.get(sku));
        scope.fork(() -> secondaryClient.get(sku));
        scope.join();
        return scope.result();
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The API changed in Java 25 — know both shapes">
        <p>
          <code>StructuredTaskScope</code> was substantially restructured in Java 25 (JEP 505),
          but it did <strong>not</strong> finalise there — it is still preview in 25 and 26.
          The <code>ShutdownOnFailure</code> / <code>ShutdownOnSuccess</code> subclasses shown
          above are the Java 21&ndash;24 form. From Java 25 the policy moved into a{' '}
          <code>Joiner</code> passed to a static <code>open()</code> factory, and{' '}
          <code>join()</code> itself returns the result and throws on failure:
        </p>
        <CodeBlock language="java" title="Java 25+ form (still preview)">
{`// All must succeed — replaces ShutdownOnFailure
try (var scope = StructuredTaskScope.open(Joiner.<Object>allSuccessfulOrThrow())) {
    var order    = scope.fork(() -> orderService.find(orderId));
    var customer = scope.fork(() -> customerService.forOrder(orderId));
    scope.join();                      // throws if any subtask failed
    return new EnrichedOrder(order.get(), customer.get());
}

// First success wins — replaces ShutdownOnSuccess
try (var scope = StructuredTaskScope.open(Joiner.<InventoryDto>anySuccessfulOrThrow())) {
    scope.fork(() -> primaryClient.get(sku));
    scope.fork(() -> secondaryClient.get(sku));
    return scope.join();               // returns the winning result directly
}`}
        </CodeBlock>
        <p>
          The concept is identical — fork in a scope, siblings cancelled on failure, deterministic
          close. Check which JDK your project targets before writing either form, and remember
          that <strong>every</strong> version to date needs <code>--enable-preview</code> at
          both compile and run time. On JDK 26 the import alone fails without it:{' '}
          <code>error: StructuredTaskScope is a preview API and is disabled by default</code>,
          and a class compiled with the flag but launched without it dies at load time with{' '}
          <code>UnsupportedClassVersionError: Preview features are not enabled … (class file
          version 70.65535)</code>. That <code>65535</code> minor version is the marker: preview
          class files only load on the same major JDK that produced them, so this is not
          something to ship in a library other teams consume.
        </p>
      </InfoBox>

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

      <InfoBox variant="warning" title="ScopedValue is final in Java 25 — preview before that">
        <p>
          <code>ScopedValue</code> previewed from Java 21 through 24 and was{' '}
          <strong>finalised in Java 25</strong> (JEP 506), so on Java 25+ it is ordinary API with
          no flags. On Java 21&ndash;24 you still need <code>--enable-preview</code>, and the shape
          of the API shifted during preview: the old static <code>ScopedValue.runWhere(...)</code>{' '}
          / <code>callWhere(...)</code> helpers were dropped in favour of the{' '}
          <code>where(...).run(...)</code> carrier form shown above.
        </p>
        <p>
          Existing services will keep using <code>ThreadLocal</code> for the foreseeable future —
          it is what Spring's <code>SecurityContextHolder</code> and MDC-based logging are built
          on — but for new code and new context variables, <code>ScopedValue</code> is the better
          default.
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

      <h3>Coordination primitives</h3>
      <p>
        Locks protect state. These protect <em>sequencing</em> — one thread waiting until others
        reach a point, or limiting how many run at once.
      </p>
      <CodeBlock language="java" title="Latches, semaphores, barriers">
{`// CountDownLatch — one-shot gate. "Wait until N things have happened."
CountDownLatch ready = new CountDownLatch(3);
for (var service : services) {
    Thread.startVirtualThread(() -> {
        service.warmUp();
        ready.countDown();          // never resets — a latch is single-use
    });
}
ready.await(30, TimeUnit.SECONDS);  // ALWAYS use the timeout overload
log.info("all services warm");

// Semaphore — bound concurrency against a resource that can't take unlimited load.
// This is how you protect a downstream API even while using unlimited vthreads.
Semaphore permits = new Semaphore(10);
public Response call(Request r) throws InterruptedException {
    permits.acquire();
    try {
        return legacyApi.send(r);   // at most 10 concurrent calls
    } finally {
        permits.release();          // release in finally, always
    }
}

// CyclicBarrier — reusable rendezvous. All parties wait for each other, then
// all proceed; the barrier resets for the next round. Useful for phased
// simulations and parallel iterative algorithms.
CyclicBarrier barrier = new CyclicBarrier(workerCount, () -> mergeResults());
// each worker: compute(); barrier.await();  // resumes when the last one arrives

// Phaser — a CyclicBarrier whose party count can change between phases.
// Rarely needed; reach for it only when workers join or drop out dynamically.`}
      </CodeBlock>

      <h2>The Java Memory Model — Why Bugs Are Invisible</h2>
      <p>
        The hardest concurrency bugs are not deadlocks; they are threads reading{' '}
        <em>stale</em> values and the program appearing to run fine for months. This happens
        because both the compiler and the CPU are allowed to reorder and cache your reads and
        writes. The Java Memory Model defines the exact rules for when one thread is guaranteed to
        see another thread&apos;s writes — the <strong>happens-before</strong> relationship.
      </p>
      <CodeBlock language="java" title="The classic visibility bug">
{`// BROKEN — this loop may never terminate, even after stop() is called.
public class Worker implements Runnable {
    private boolean running = true;      // no synchronization of any kind

    public void run() {
        while (running) { doWork(); }    // JIT may hoist the read out of the loop
    }
    public void stop() { running = false; }
}

// FIXED — volatile establishes happens-before between the write and the read.
private volatile boolean running = true;

// What volatile guarantees:
//   - Every read sees the most recent write (VISIBILITY)
//   - Reads/writes are not reordered across it (ORDERING)
// What volatile does NOT guarantee:
//   - ATOMICITY of compound actions. 'count++' is read-modify-write:
//     three steps, and volatile does not make them one.
private volatile int count;
count++;                                 // STILL a race condition

// For a counter, use an atomic type (single CAS instruction):
private final AtomicInteger count = new AtomicInteger();
count.incrementAndGet();`}
      </CodeBlock>
      <p>
        &quot;May never terminate&quot; sounds like a theoretical caveat, so here is the same
        program actually run on a current JDK. The worker spins on the flag; main clears it after
        half a second:
      </p>

      <CodeBlock language="java" title="Vis.java — run on JDK 26">
{`static boolean running = true;                       // NOT volatile

public static void main(String[] args) throws Exception {
    Thread t = new Thread(() -> {
        long n = 0;
        while (running) { n++; }
        System.out.println("worker exited after " + n + " iters");
    });
    t.start();
    Thread.sleep(500);
    running = false;
    System.out.println("main set running=false");
    t.join(3000);
    System.out.println(t.isAlive() ? "*** WORKER STILL RUNNING" : "worker terminated");
}

// Output:
//   main set running=false
//   *** WORKER STILL RUNNING
//
// The worker never exits. Not "exits late" — never. Change one word:

static volatile boolean running = true;

// Output:
//   main set running=false
//   worker exited after 2110180242 iters
//   worker terminated`}
      </CodeBlock>

      <p>
        Two billion iterations of a loop whose exit condition had already been set. The write
        genuinely happened — main printed its line — but the JIT, seeing a loop that never writes{' '}
        <code>running</code>, hoisted the read <em>out</em> of the loop and cached it in a
        register. There is no bug in the JIT here: absent a happens-before edge, nothing in the
        language required it to re-read the field, so it did not.
      </p>

      <InfoBox variant="note" title="What &quot;happens-before&quot; actually means">
        <p>
          The name is the single most misleading term in Java concurrency, because it sounds like
          a statement about time. It is not. Two events being ordered in wall-clock time — as they
          plainly were above, the write finished long before most of those reads — guarantees
          nothing at all.
        </p>
        <p>
          <strong>Happens-before is a visibility guarantee, not a chronology.</strong> Saying
          &quot;A happens-before B&quot; means: everything thread A had written before A is
          guaranteed to be visible to thread B at B, and the compiler and CPU are forbidden from
          reordering across that edge. Without such an edge between two threads, the JMM permits
          each to observe the other&apos;s writes in any order, or never.
        </p>
        <p>
          So the practical question is never &quot;did this happen first?&quot; It is{' '}
          <em>&quot;which edge connects these two threads?&quot;</em> If you cannot name one from
          the list below, you have a race — even if the code has run correctly for two years.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="The happens-before edges worth memorising">
        <ul>
          <li>
            <strong>Monitor lock:</strong> unlocking a monitor happens-before any later lock of the
            same monitor. Everything written inside a <code>synchronized</code> block is visible to
            the next thread that enters it.
          </li>
          <li>
            <strong>Volatile:</strong> a write to a volatile field happens-before every subsequent
            read of that field — <em>and</em> it publishes everything written before it.
          </li>
          <li>
            <strong>Thread start / join:</strong> everything a thread did before calling{' '}
            <code>t.start()</code> is visible to <code>t</code>; everything <code>t</code> did is
            visible after <code>t.join()</code> returns.
          </li>
          <li>
            <strong>Final fields:</strong> a properly-constructed object&apos;s <code>final</code>{' '}
            fields are visible to all threads without synchronization — which is why immutable
            objects are automatically thread-safe, and the strongest argument for records.
          </li>
          <li>
            <strong>Concurrent collections and executors:</strong> putting into a{' '}
            <code>BlockingQueue</code> or submitting to an <code>ExecutorService</code>{' '}
            happens-before the task takes/runs it. You do not need extra synchronization to hand
            data across these.
          </li>
        </ul>
      </InfoBox>
      <InfoBox variant="tip" title="The shortcut that avoids all of this">
        <p>
          Every rule above exists to manage <em>shared mutable</em> state. Remove the mutability
          and the rules stop applying: immutable objects (records, <code>List.of</code>,{' '}
          <code>final</code> fields) can be shared freely with zero synchronization and zero
          visibility risk. In practice, the most reliable concurrent Java is not clever locking —
          it is confining mutable state to a single thread and passing immutable snapshots between
          threads.
        </p>
      </InfoBox>

      <h2>Thread-Safe Collections</h2>
      <CodeBlock language="java" title="What to use instead of a synchronized ArrayList">
{`// Concurrent map — the workhorse
ConcurrentHashMap<String, Session> sessions = new ConcurrentHashMap<>();
sessions.computeIfAbsent(id, Session::create);   // atomic get-or-create

// merge is the atomic "upsert with a combining function"
ConcurrentHashMap<String, Integer> hits = new ConcurrentHashMap<>();
hits.merge(path, 1, Integer::sum);               // insert 1, or add 1 to what's there

// NOTE: the atomicity is per-operation. A get() followed by a put() is NOT
// atomic even on a ConcurrentHashMap — use compute/merge/putIfAbsent instead.

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
            <strong>Holding any lock across I/O.</strong> On Java 21&ndash;23 a{' '}
            <code>synchronized</code> block around a blocking call also <em>pins</em> the vthread
            and scale collapses; JEP 491 removed that in Java 24. But on every JDK it still
            serialises every caller behind one slow round trip, so move the I/O out of the lock
            rather than just swapping <code>synchronized</code> for <code>ReentrantLock</code>.
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
          <li>
            <strong>Lock-ordering deadlock.</strong> Thread A holds lock 1 and wants lock 2 while
            thread B holds lock 2 and wants lock 1 — both wait forever. The fix is a global
            ordering: every code path acquires locks in the same sequence (e.g. always by account
            id ascending). Where that is impractical, use{' '}
            <code>tryLock(timeout)</code> and back off. Diagnose with a thread dump —{' '}
            <code>jstack</code> detects and reports Java-level deadlocks explicitly.
          </li>
          <li>
            <strong>Calling out to unknown code while holding a lock.</strong> A callback,
            listener, or overridable method invoked inside a <code>synchronized</code> block can
            acquire another lock and deadlock you. Compute inside the lock, notify outside it.
          </li>
          <li>
            <strong>Double-checked locking without <code>volatile</code>.</strong> The classic
            lazy-init idiom is broken unless the field is <code>volatile</code>, because another
            thread can see a non-null but partially-constructed object. Prefer a static holder
            class or an <code>enum</code> singleton and skip the problem entirely.
          </li>
        </ul>
      </InfoBox>

      <h2>The Decision Tree</h2>
      <CodeBlock language="text" title="Which primitive for which job">
{`Task is I/O-bound (HTTP, DB, disk) ................... virtual thread per task
Task is CPU-bound (parallel compute) ................. fixed thread pool ~ CPU count
Coordinate N tasks that all must succeed ............. StructuredTaskScope + allSuccessfulOrThrow
                                                      (ShutdownOnFailure on Java 21-24)
Race N tasks, first success wins ..................... StructuredTaskScope + anySuccessfulOrThrow
                                                      (ShutdownOnSuccess on Java 21-24)
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
          <li>Pinning is not silently happening under load (JFR{' '}
              <code>jdk.VirtualThreadPinned</code> on Java 24+; on 21&ndash;23,{' '}
              <code>-Djdk.tracePinnedThreads=full</code>).</li>
        </ul>
      </InfoBox>

    </LessonLayout>
  );
}
