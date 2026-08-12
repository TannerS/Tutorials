import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaConcurrency() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java + Spring Boot 4 · Field Reference"
      title="Concurrency & Virtual Threads"
      tagline="Threads, locks, virtual threads, and the pitfalls that actually bite in production — condensed for offline study."
      meta={['Java 21+', '14 patterns']}
      footerLabel="Personal study reference — Java"
      pageLabel="Java + Spring Field Guide · Concurrency"
      prev={{ path: '/java-field-guide/collections-streams', label: 'Collections & Streams' }}
      next={{ path: '/java-field-guide/spring-di', label: 'Spring DI & Beans' }}
    >
      <PosterCard
        glyph="Th"
        title={<>Thread<span className="dim"> / Runnable / Callable</span></>}
        language="java"
        code={`Runnable task = () -> System.out.println("running");
new Thread(task).start();

Callable<Integer> calc = () -> { Thread.sleep(1000); return 42; };
ExecutorService exec = Executors.newSingleThreadExecutor();
Future<Integer> future = exec.submit(calc);
int result = future.get();  // blocks until done`}
        caption="Prefer Runnable/Callable submitted to an ExecutorService over extending Thread — it decouples the work from the threading mechanism and gives you a Future."
      />

      <PosterCard
        glyph="Ex"
        title={<>ExecutorService<span className="dim"> types</span></>}
        language="java"
        code={`Executors.newFixedThreadPool(4);                  // known, bounded concurrency
Executors.newCachedThreadPool();                  // many short-lived tasks
Executors.newScheduledThreadPool(2);              // cron-like, delayed/repeating
Executors.newVirtualThreadPerTaskExecutor();      // high-concurrency I/O (21+)`}
        caption="Match the pool to the workload. Virtual-thread-per-task is the new default for I/O-heavy services — it doesn't need pool sizing at all."
      />

      <PosterCard
        glyph="Lc"
        title={<>Executor<span className="dim"> lifecycle</span></>}
        language="java"
        code={`ExecutorService exec = Executors.newFixedThreadPool(4);
try {
    List<Future<String>> futures = exec.invokeAll(tasks);
} finally {
    exec.shutdown();                              // no new tasks, finish existing
    exec.awaitTermination(30, TimeUnit.SECONDS);
    // exec.shutdownNow();  // interrupts all running tasks
}`}
        caption="shutdown() alone doesn't block — pair it with awaitTermination or tasks may still be running when your finally block exits."
      />

      <PosterCard
        glyph="Sy"
        title={<>synchronized<span className="dim"> method / block</span></>}
        language="java"
        code={`public synchronized void increment() { count++; }

private final Object lock = new Object();
public void update() {
    synchronized (lock) { count++; }
}`}
        caption="Guarantees both mutual exclusion and visibility. Prefer synchronizing on a dedicated private lock object over `this` to avoid external code locking on you."
      />

      <PosterCard
        glyph="Vl"
        title={<>volatile<span className="dim"> — visibility, not atomicity</span></>}
        language="java"
        code={`private volatile boolean running = true;

// Thread 1: running = false;
// Thread 2 sees the change immediately — no caching/reordering

// ❌ volatile does NOT make count++ atomic`}
        caption="volatile guarantees visibility, not atomicity — a compound read-modify-write like count++ still needs synchronized or AtomicInteger."
      />

      <PosterCard
        glyph="RL"
        title={<>ReentrantLock<span className="dim">()</span></>}
        language="java"
        code={`private final ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // critical section
} finally {
    lock.unlock();  // always in finally!
}

if (lock.tryLock(1, TimeUnit.SECONDS)) { /* ... */ }`}
        caption="Gives you tryLock/timeouts and fairness that synchronized can't — but unlike synchronized, an exception won't auto-release it, so unlock() must live in finally."
      />

      <PosterCard
        glyph="At"
        title={<>Atomic Types<span className="dim"> &amp; LongAdder</span></>}
        language="java"
        code={`AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();          // atomic ++counter
counter.compareAndSet(5, 10);       // CAS
counter.updateAndGet(x -> x * 2);

LongAdder adder = new LongAdder();  // better under high contention than AtomicLong
adder.increment();`}
        caption="Lock-free thread safety for single values. Reach for LongAdder over AtomicLong when many threads hammer the same counter — it trades read cost for less write contention."
      />

      <PosterCard
        glyph="VT"
        title={<>Virtual Threads<span className="dim"> — Java 21+</span></>}
        language="java"
        code={`Thread.startVirtualThread(() -> doWork());

try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> exec.submit(() -> process(i)));
}
// millions possible — don't pool them, just create new ones`}
        caption="Virtual threads are cheap enough to use one per task. They help I/O-bound workloads; they don't speed up CPU-bound work since that's still limited by core count."
      />

      <PosterCard
        glyph="Pin"
        title={<>Pinning Gotcha<span className="dim"> — synchronized + virtual threads</span></>}
        language="java"
        code={`// GOTCHA: synchronized pins a virtual thread to its OS carrier thread
synchronized (lock) {
    blockingIoCall();   // carrier thread can't be reused while pinned
}

// Fix: use ReentrantLock around I/O instead of synchronized
// Diagnose with -Djdk.tracePinnedThreads=full`}
        caption="Pinning defeats the whole point of virtual threads — the carrier is stuck for the duration. Swap synchronized for ReentrantLock in code paths that also block on I/O."
      />

      <PosterCard
        glyph="CF"
        title={<>CompletableFuture<span className="dim"> create &amp; transform</span></>}
        language="java"
        code={`CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> fetchData());

cf.thenApply(s -> s.toUpperCase())      // sync transform
  .thenCompose(s -> fetchMore(s))       // chain another async call (flatMap)
  .exceptionally(ex -> "fallback")      // recover from failure
  .thenAccept(System.out::println);     // consume, CF<Void>`}
        caption="thenApply is the sync map, thenCompose is the async flatMap — using thenApply where you need thenCompose leaves you with a nested CompletableFuture<CompletableFuture<T>>."
      />

      <PosterCard
        glyph="All"
        title={<>CompletableFuture<span className="dim"> combining</span></>}
        language="java"
        code={`CompletableFuture<Void> allDone = CompletableFuture.allOf(
    futures.toArray(CompletableFuture[]::new)
);
allDone.thenRun(() -> {
    List<String> results = futures.stream()
        .map(CompletableFuture::join)  // safe here — all done
        .toList();
});`}
        caption="join() only belongs inside a callback that runs after allOf/anyOf completes — calling it earlier blocks the calling thread just like get()."
      />

      <PosterCard
        glyph="Dl"
        title={<>Deadlock<span className="dim"> pitfall</span></>}
        language="java"
        code={`// ❌ DEADLOCK — inconsistent lock order
// Thread 1: lock(A) → lock(B)
// Thread 2: lock(B) → lock(A)

// ✅ FIX — always acquire locks in the same global order
synchronized (lockA) {
    synchronized (lockB) { /* ... */ }
}`}
        caption="Two threads each holding a lock the other needs. The only reliable fix is a consistent global lock-acquisition order, not clever timing."
      />

      <PosterCard
        glyph="Rc"
        title={<>Race Condition<span className="dim"> pitfall</span></>}
        language="java"
        code={`// ❌ RACE — read-modify-write without synchronization
if (balance >= amount) {
    balance -= amount;   // another thread can interleave here
}

// ✅ FIX
synchronized (this) {
    if (balance >= amount) balance -= amount;
}`}
        caption="Any check-then-act sequence on shared mutable state needs the whole sequence — not just the write — inside the lock."
      />

      <PosterCard
        glyph="BQ"
        title={<>BlockingQueue<span className="dim"> — producer/consumer</span></>}
        language="java"
        code={`BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);

queue.put(task);         // producer — blocks if full
Task t = queue.take();   // consumer — blocks if empty

queue.offer(task, 1, TimeUnit.SECONDS);  // bounded wait instead of forever`}
        caption="put/take block indefinitely by design — that's what makes them the standard building block for producer-consumer pipelines without manual wait/notify."
      />

      <PosterQuickRef
        title="Which concurrency tool do I need?"
        rows={[
          { need: 'Fire-and-forget task', answer: 'Runnable + ExecutorService' },
          { need: 'Task that returns a value', answer: 'Callable<T> + Future' },
          { need: 'High-concurrency I/O', answer: 'Virtual threads (newVirtualThreadPerTaskExecutor)' },
          { need: 'Simple mutual exclusion', answer: 'synchronized' },
          { need: 'Lock with timeout/fairness', answer: 'ReentrantLock' },
          { need: 'Single-value thread-safe counter', answer: 'AtomicInteger / LongAdder' },
          { need: 'Chain async calls', answer: 'CompletableFuture.thenCompose' },
          { need: 'Producer-consumer pipeline', answer: 'BlockingQueue' },
          { need: 'Blocking call inside a virtual thread', answer: 'avoid synchronized — use ReentrantLock' },
          { need: 'Wait for several async tasks', answer: 'CompletableFuture.allOf' },
        ]}
      />
    </PosterLayout>
  );
}
