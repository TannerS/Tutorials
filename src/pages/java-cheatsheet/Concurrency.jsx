import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Concurrency() {
  return (
    <LessonLayout
      title="Concurrency Quick Ref"
      sectionId="java-cheatsheet"
      lessonIndex={3}
      prev={{ path: '/java-cheatsheet/streams', label: 'Streams & Lambdas Ref' }}
      next={{ path: '/java-cheatsheet/annotations', label: 'Annotations & Common APIs' }}
    >
      {/* ───── THREAD CREATION ───── */}
      <h2>Thread Creation — 3 Ways</h2>
      <CodeBlock language="java" title="Thread vs Runnable vs Callable">{
`// 1. Extend Thread (avoid — couples logic to threading)
class MyThread extends Thread {
    public void run() { System.out.println("running"); }
}
new MyThread().start();

// 2. Implement Runnable (preferred for fire-and-forget)
Runnable task = () -> System.out.println("running");
new Thread(task).start();

// 3. Implement Callable<T> (returns a value, can throw)
Callable<Integer> calc = () -> {
    Thread.sleep(1000);
    return 42;
};
ExecutorService exec = Executors.newSingleThreadExecutor();
Future<Integer> future = exec.submit(calc);
int result = future.get();  // blocks until done
exec.shutdown();`
      }</CodeBlock>

      {/* ───── EXECUTOR TYPES ───── */}
      <h2>ExecutorService Types</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Factory Method</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Pool Type</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Use When</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['newFixedThreadPool(n)', 'Fixed n threads', 'Known, bounded concurrency'],
            ['newCachedThreadPool()', 'Grows/shrinks on demand', 'Many short-lived tasks'],
            ['newSingleThreadExecutor()', '1 thread, queued', 'Sequential background work'],
            ['newScheduledThreadPool(n)', 'Fixed, supports delay/repeat', 'Cron-like tasks'],
            ['newVirtualThreadPerTaskExecutor()', 'Virtual threads (Java 21+)', 'High-concurrency I/O'],
            ['newWorkStealingPool()', 'ForkJoinPool', 'CPU-bound parallel work'],
          ].map(([method, type, use]) => (
            <tr key={method} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontFamily: 'monospace', color: '#5b9cf6' }}>{method}</td>
              <td style={{ padding: '6px' }}>{type}</td>
              <td style={{ padding: '6px' }}>{use}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CodeBlock language="java" title="Executor lifecycle">{
`ExecutorService exec = Executors.newFixedThreadPool(4);
try {
    List<Future<String>> futures = exec.invokeAll(tasks); // submit all
    String first = exec.invokeAny(tasks);                 // first to complete
} finally {
    exec.shutdown();                          // no new tasks, finish existing
    exec.awaitTermination(30, TimeUnit.SECONDS);
    // exec.shutdownNow();                   // interrupt all running tasks
}`
      }</CodeBlock>

      {/* ───── SYNCHRONIZATION ───── */}
      <h2>Synchronization</h2>
      <CodeBlock language="java" title="synchronized, volatile, locks">{
`// synchronized method
public synchronized void increment() { count++; }

// synchronized block — finer granularity
public void update() {
    synchronized (this) {
        count++;
    }
}
// Can synchronize on any object
private final Object lock = new Object();
synchronized (lock) { /* critical section */ }

// volatile — visibility guarantee, no atomicity
private volatile boolean running = true;
// Thread 1: running = false;  → Thread 2 sees the change immediately
// ❌ volatile does NOT make count++ atomic

// ReentrantLock — more control than synchronized
private final ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // critical section
} finally {
    lock.unlock();  // always in finally!
}

// tryLock — non-blocking
if (lock.tryLock(1, TimeUnit.SECONDS)) {
    try { /* work */ }
    finally { lock.unlock(); }
} else {
    // couldn't acquire lock
}

// ReadWriteLock — multiple readers, single writer
ReadWriteLock rwLock = new ReentrantReadWriteLock();
rwLock.readLock().lock();   // shared read access
rwLock.writeLock().lock();  // exclusive write access`
      }</CodeBlock>

      {/* ───── ATOMIC TYPES ───── */}
      <h2>Atomic Types</h2>
      <CodeBlock language="java" title="Lock-free thread safety">{
`// java.util.concurrent.atomic
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();       // ++counter (atomic)
counter.getAndIncrement();       // counter++ (atomic)
counter.addAndGet(5);            // counter += 5
counter.compareAndSet(5, 10);    // CAS: if 5, set to 10
counter.updateAndGet(x -> x * 2); // atomic transform

// Other atomic types
AtomicLong longCounter = new AtomicLong();
AtomicBoolean flag = new AtomicBoolean(false);
AtomicReference<String> ref = new AtomicReference<>("init");
ref.compareAndSet("init", "updated");

// LongAdder — better than AtomicLong under high contention
LongAdder adder = new LongAdder();
adder.increment();
adder.add(10);
adder.sum();  // get current total`
      }</CodeBlock>

      {/* ───── COMPLETABLE FUTURE ───── */}
      <h2>CompletableFuture API</h2>
      <FlowChart
        title="Chaining Async Operations"
        chart={"graph LR\n  A[\"supplyAsync\\n(start task)\"]-->B[\"thenApply\\n(transform result)\"]\n  B-->C[\"thenCompose\\n(chain async)\"]\n  C-->D[\"thenAccept\\n(consume result)\"]\n  D-->E[\"exceptionally\\n(handle error)\"]"}
      />

      <CodeBlock language="java" title="CompletableFuture cheat sheet">{
`// Create
CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> fetchData());
CompletableFuture<Void> cfRun = CompletableFuture.runAsync(() -> doWork());
CompletableFuture<String> cfVal = CompletableFuture.completedFuture("done");

// Transform result (sync)
cf.thenApply(s -> s.toUpperCase())          // CF<String>

// Chain another async call
cf.thenCompose(s -> fetchMore(s))           // CF<T> (flatMap)

// Consume result
cf.thenAccept(System.out::println)          // CF<Void>
cf.thenRun(() -> cleanup())                 // CF<Void>, ignores result

// Combine two futures
cf1.thenCombine(cf2, (a, b) -> a + b)      // CF<R>
cf1.thenAcceptBoth(cf2, (a, b) -> save(a, b))

// Run after either completes
cf1.applyToEither(cf2, s -> s.toUpperCase())
cf1.acceptEither(cf2, System.out::println)

// Error handling
cf.exceptionally(ex -> "fallback")          // recover from exception
cf.handle((result, ex) -> {                 // handle both cases
    if (ex != null) return "error";
    return result;
})
cf.whenComplete((result, ex) -> {           // side-effect, doesn't transform
    if (ex != null) log.error("Failed", ex);
})`
      }</CodeBlock>

      <CodeBlock language="java" title="Combining multiple futures">{
`List<CompletableFuture<String>> futures = urls.stream()
    .map(url -> CompletableFuture.supplyAsync(() -> fetch(url)))
    .toList();

// Wait for ALL to complete
CompletableFuture<Void> allDone = CompletableFuture.allOf(
    futures.toArray(CompletableFuture[]::new)
);
allDone.thenRun(() -> {
    List<String> results = futures.stream()
        .map(CompletableFuture::join)  // safe here — all done
        .toList();
});

// Wait for FIRST to complete
CompletableFuture<Object> anyDone = CompletableFuture.anyOf(
    futures.toArray(CompletableFuture[]::new)
);

// Timeout (Java 9+)
cf.orTimeout(5, TimeUnit.SECONDS)          // throws on timeout
cf.completeOnTimeout("default", 5, TimeUnit.SECONDS)  // fallback`
      }</CodeBlock>

      {/* ───── THREAD-SAFE COLLECTIONS ───── */}
      <h2>Thread-Safe Collections</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Class</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Mechanism</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Best For</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['ConcurrentHashMap', 'Segment locks (fine-grained)', 'High-concurrency maps'],
            ['CopyOnWriteArrayList', 'Copy array on write', 'Read-heavy, rare writes'],
            ['CopyOnWriteArraySet', 'Copy array on write', 'Read-heavy, small sets'],
            ['ConcurrentLinkedQueue', 'Lock-free (CAS)', 'Non-blocking FIFO queue'],
            ['BlockingQueue (various)', 'Lock-based blocking', 'Producer-consumer pattern'],
            ['ConcurrentSkipListMap', 'Lock-free skip list', 'Sorted concurrent map'],
          ].map(([cls, mechanism, best]) => (
            <tr key={cls} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontFamily: 'monospace', color: '#5b9cf6' }}>{cls}</td>
              <td style={{ padding: '6px' }}>{mechanism}</td>
              <td style={{ padding: '6px' }}>{best}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CodeBlock language="java" title="BlockingQueue — Producer-Consumer">{
`BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);

// Producer thread
queue.put(task);         // blocks if full

// Consumer thread
Task t = queue.take();   // blocks if empty

// Non-blocking variants
queue.offer(task);       // false if full
queue.poll();            // null if empty
queue.offer(task, 1, TimeUnit.SECONDS);  // with timeout`
      }</CodeBlock>

      {/* ───── COMMON PITFALLS ───── */}
      <h2>Common Pitfalls</h2>
      <InfoBox variant="danger" title="Deadlock">
        Two threads each hold a lock the other needs.
        Prevention: always acquire locks in a consistent global order.
      </InfoBox>

      <CodeBlock language="java" title="Deadlock example">{
`// ❌ DEADLOCK — inconsistent lock order
// Thread 1: lock(A) → lock(B)
// Thread 2: lock(B) → lock(A)

// ✅ FIX — always lock in same order
synchronized (lockA) {
    synchronized (lockB) { /* ... */ }
}`
      }</CodeBlock>

      <InfoBox variant="warning" title="Race Condition">
        Multiple threads read-modify-write without synchronization.
        Fix: use <code>synchronized</code>, <code>AtomicXxx</code>, or <code>Lock</code>.
      </InfoBox>

      <InfoBox variant="note" title="Starvation">
        A thread never gets CPU time because higher-priority threads monopolize.
        Fix: use fair locks (<code>new ReentrantLock(true)</code>) or
        <code>Thread.yield()</code>.
      </InfoBox>

      {/* ───── VIRTUAL THREADS ───── */}
      <h2>Virtual Threads (Java 21+)</h2>
      <CodeBlock language="java" title="Project Loom">{
`// Create virtual thread
Thread.startVirtualThread(() -> doWork());

// Via builder
Thread vt = Thread.ofVirtual().name("vt-", 0).start(() -> doWork());

// Via executor — one virtual thread per task
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i ->
        exec.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        })
    );
}
// Key: virtual threads are cheap (millions possible)
// Best for: I/O-bound tasks. NOT for CPU-bound computation.
// Don't pool virtual threads — just create new ones.`
      }</CodeBlock>

      {/* ───── CHALLENGES ───── */}
      <InteractiveChallenge
        question={"What does volatile guarantee in Java?"}
        options={[
          "Atomicity of compound operations",
          "Visibility of changes across threads",
          "Mutual exclusion",
          "Thread-safe collections"
        ]}
        correctIndex={1}
        explanation={"volatile guarantees visibility — when one thread writes a volatile variable, the new value is immediately visible to all other threads. It does NOT guarantee atomicity of compound operations like count++."}
        language="java"
      />

      <InteractiveChallenge
        question={"What does CompletableFuture.thenCompose() do?"}
        options={[
          "Combines two independent futures",
          "Chains an async operation that returns CompletableFuture (flatMap)",
          "Applies a synchronous function to the result",
          "Runs a side-effect after completion"
        ]}
        correctIndex={1}
        explanation={"thenCompose is the async flatMap — it takes a function that returns a CompletableFuture and flattens the result, avoiding CompletableFuture<CompletableFuture<T>>. thenApply is the synchronous map, thenCombine combines two independent futures."}
        language="java"
      />
    </LessonLayout>
  );
}

export default function ConcurrencyPage() {
  return <Concurrency />;
}
