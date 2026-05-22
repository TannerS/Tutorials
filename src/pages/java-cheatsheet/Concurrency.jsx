import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaCConcurrency() {
  return (
    <LessonLayout
      title="Concurrency Cheat Sheet"
      sectionId="java-cheatsheet"
      lessonIndex={3}
      prev={{ path: "/java-cheatsheet/streams", label: "Streams Cheat Sheet" }}
      next={{ path: "/java-cheatsheet/annotations", label: "Annotations Cheat Sheet" }}
    >
      <p>Quick reference for Java concurrency — threads, synchronization, the java.util.concurrent package, and virtual threads.</p>

      <h2>Core Concurrency Tools</h2>
      <CodeBlock language="java" title="Concurrency Quick Reference">
{`// === CREATING THREADS ===
// Option 1: Runnable (no return value)
Thread t = new Thread(() -> System.out.println("Running"));
t.start();

// Option 2: Callable + Future (has return value)
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> future = pool.submit(() -> heavyComputation());
Integer result = future.get(5, TimeUnit.SECONDS); // blocking get with timeout
pool.shutdown();

// Option 3: CompletableFuture (non-blocking chaining)
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> fetchUser(id))             // runs async
    .thenApply(user -> user.getName())            // transform result
    .thenCombine(CompletableFuture.supplyAsync(
        () -> fetchOrders(id)), (name, orders) -> // combine two futures
        name + " has " + orders.size() + " orders")
    .exceptionally(ex -> "Error: " + ex.getMessage())  // handle errors
    .whenComplete((result2, ex) -> log.info("Done"));

// Option 4: Virtual threads (Java 21) — one per task, no pool needed
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> blockingOperation());   // cheap! millions possible
}

// === SYNCHRONIZATION ===
// synchronized method
public synchronized void increment() { count++; }

// synchronized block (prefer — smaller critical section)
private final Object lock = new Object();
public void increment() {
    synchronized (lock) { count++; }
}

// ReentrantLock (more flexible — try-lock, timed lock)
private final ReentrantLock lock = new ReentrantLock();
public void increment() {
    lock.lock();
    try { count++; }
    finally { lock.unlock(); }
}

// ReadWriteLock (concurrent reads, exclusive writes)
private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
public String read()          { rwLock.readLock().lock(); try { return data; } finally { rwLock.readLock().unlock(); } }
public void  write(String d)  { rwLock.writeLock().lock(); try { data = d; } finally { rwLock.writeLock().unlock(); } }

// === ATOMIC TYPES (lock-free) ===
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();              // atomic ++
counter.compareAndSet(5, 10);          // CAS: if 5, set to 10
LongAdder adder = new LongAdder();     // better than AtomicLong under high contention`}
      </CodeBlock>

      <InfoBox variant="note" title="Virtual Threads vs Platform Threads">
        <p>Platform threads are OS threads — creating thousands is expensive. Virtual threads (Java 21) are lightweight JVM-managed threads — you can create millions. Virtual threads block cheaply (JVM parks them, not the OS thread). Use virtual threads for I/O-bound work; use platform threads with ForkJoinPool for CPU-bound parallel computation.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does AtomicInteger.compareAndSet(expected, update) do?"
        options={["Sets the value to update if current value equals expected, atomically without locking", "Compares two AtomicIntegers and updates both", "Sets a new value and returns whether it changed", "Locks the value while checking"]}
        correctIndex={0}
        explanation="compareAndSet (CAS — Compare-And-Swap) atomically checks if the current value equals expected; if so, it sets the value to update and returns true. If not, it leaves the value unchanged and returns false. This is the foundation of lock-free algorithms — no OS lock needed, just a single atomic CPU instruction."
      />

    </LessonLayout>
  );
}
