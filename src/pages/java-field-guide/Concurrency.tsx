import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaConcurrency() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java · Field Reference"
      title="Concurrency & Virtual Threads"
      tagline="Threads, locks, virtual threads, and the pitfalls that actually bite in production — condensed for offline study."
      meta={['Java 21+', '14 patterns']}
      footerLabel="Personal study reference — Java"
      pageLabel="Java Field Guide · Concurrency"
      prev={{ path: '/java-field-guide/exceptions-io', label: 'Exceptions & I/O' }}
      next={{ path: '/java-field-guide/gotchas', label: 'Gotchas & Pitfalls' }}
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
        title={<>Pinning Gotcha<span className="dim"> — rules changed in Java 24</span></>}
        language="java"
        code={`// Java 21-23: synchronized PINS the vthread to its OS carrier thread
synchronized (lock) {
    blockingIoCall();   // carrier can't be reused while pinned
}
// Fix on 21-23: ReentrantLock, which unmounts correctly.

// Java 24+ (JEP 491): synchronized no longer pins.
// Still pins: native/JNI frames, class initializers.

// Diagnose: JFR event jdk.VirtualThreadPinned on 24+
//           -Djdk.tracePinnedThreads=full on 21-23 (removed in 24)`}
        caption="Through Java 23 this was the #1 virtual-thread trap and the origin of 'always replace synchronized with ReentrantLock'. JEP 491 fixed it in Java 24, so that advice is now stale — but holding any lock across a slow call still serialises every caller, which is the real bug on every JDK."
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

      <PosterCard
        glyph="hb"
        title={<>happens-before<span className="dim"> — the memory model</span></>}
        language="java"
        code={`// BROKEN — the loop may never terminate. The JIT can hoist the read.
private boolean running = true;
while (running) { work(); }          // no synchronization = no guarantee

private volatile boolean running = true;   // FIXED: visibility + ordering

// volatile does NOT give atomicity — count++ is read-modify-write.
private volatile int count;  count++;      // STILL a race
private final AtomicInteger count;  count.incrementAndGet();   // correct

// The edges worth memorising:
//   unlock(m)         happens-before  the next lock(m)
//   volatile write    happens-before  every later read of that field
//   t.start()         happens-before  everything t does
//   everything t does happens-before  t.join() returning
//   final fields of a properly-constructed object: visible with NO sync
//   put to a BlockingQueue / submit to an Executor happens-before the take/run`}
        caption="Stale reads, not deadlocks, are the concurrency bugs that survive for months. Every rule here exists to manage shared MUTABLE state — immutable objects and records sidestep all of it."
      />

      <PosterCard
        glyph="Ltc"
        title={<>Latches, semaphores, barriers</>}
        language="java"
        code={`// CountDownLatch — one-shot gate. "Wait until N things happened."
CountDownLatch ready = new CountDownLatch(3);
ready.countDown();                       // never resets — single use
ready.await(30, TimeUnit.SECONDS);       // ALWAYS use the timeout overload

// Semaphore — bound concurrency against a fragile downstream.
// This is how you protect an API while still using unlimited vthreads.
Semaphore permits = new Semaphore(10);
permits.acquire();
try { legacyApi.send(r); } finally { permits.release(); }   // release in finally

// CyclicBarrier — reusable rendezvous; resets for the next phase.
CyclicBarrier barrier = new CyclicBarrier(workers, () -> mergeResults());
barrier.await();`}
        caption="Locks protect state; these protect sequencing. A latch counts down once and stays down — use a CyclicBarrier when the rendezvous repeats."
      />

      <PosterCard
        glyph="STS"
        title={<>StructuredTaskScope<span className="dim"> — API changed in Java 25</span></>}
        language="java"
        code={`// Java 21-24 (preview, needs --enable-preview)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var a = scope.fork(() -> svcA.get());
    var b = scope.fork(() -> svcB.get());
    scope.join();
    scope.throwIfFailed();
    return new Result(a.get(), b.get());
}

// Java 25 (final) — policy moved into a Joiner passed to open()
try (var scope = StructuredTaskScope.open(Joiner.<Object>allSuccessfulOrThrow())) {
    var a = scope.fork(() -> svcA.get());
    var b = scope.fork(() -> svcB.get());
    scope.join();                    // throws if any subtask failed
    return new Result(a.get(), b.get());
}
// First-success race: Joiner.anySuccessfulResultOrThrow() — join() returns it.`}
        caption="Same concept in both: fork in a lexical scope, siblings cancelled on failure, deterministic close, no leaked tasks. Check which JDK your project targets before writing either form."
      />

      <PosterCard
        glyph="Lk!"
        title={<>Deadlock<span className="dim"> — and the near misses</span></>}
        language="java"
        code={`// A holds lock1 wants lock2; B holds lock2 wants lock1. Both wait forever.
// FIX: a global lock ORDER — always acquire by id ascending.
var first  = a.id() < b.id() ? a : b;
var second = a.id() < b.id() ? b : a;
synchronized (first) { synchronized (second) { transfer(a, b); } }

// Or back off instead of blocking:
if (!lock.tryLock(2, TimeUnit.SECONDS)) throw new BusyException();

// Related traps:
//   calling a callback / overridable method WHILE holding a lock
//   double-checked locking without volatile (partially-constructed object)
//   jstack detects and reports Java-level deadlocks explicitly`}
        caption="Compute inside the lock, notify outside it. For lazy singletons, a static holder class or an enum sidesteps double-checked locking entirely."
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
