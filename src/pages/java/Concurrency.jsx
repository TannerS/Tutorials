import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaConcurrency() {
  return (
    <LessonLayout
      title="Concurrency"
      sectionId="java"
      lessonIndex={7}
      prev={{ path: "/java/streams", label: "Streams & Lambdas" }}
      next={{ path: "/java/io", label: "I/O & NIO.2" }}
    >
      <p>Concurrency lets programs do multiple things at once. Java provides threads, synchronization, high-level concurrency utilities, and virtual threads (Java 21).</p>

      <FlowChart
        title="Thread Lifecycle"
        chart={"graph LR\n  A[NEW] --> B[RUNNABLE]\n  B --> C[RUNNING]\n  C --> D[BLOCKED]\n  C --> E[WAITING]\n  C --> F[TIMED WAITING]\n  D --> B\n  E --> B\n  F --> B\n  C --> G[TERMINATED]"}
      />

      <h2>Creating Threads</h2>
      <CodeBlock language="java" title="Thread Creation Options">
{`// Option 1: Extend Thread (not preferred)
class MyThread extends Thread {
    @Override public void run() {
        System.out.println("Running: " + getName());
    }
}

// Option 2: Implement Runnable (better — separates task from thread)
Runnable task = () -> System.out.println("Task: " + Thread.currentThread().getName());
Thread t = new Thread(task, "worker-1");
t.start(); // NEVER call t.run() directly — that runs in current thread!

// Option 3: ExecutorService (production best practice)
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<String> future = pool.submit(() -> {
    Thread.sleep(100);
    return "result";
});
System.out.println(future.get()); // blocks until done
pool.shutdown();`}
      </CodeBlock>

      <h2>Synchronization</h2>
      <CodeBlock language="java" title="Preventing Race Conditions">
{`// Race condition — count will be < 1000 without sync
public class Counter {
    private int count = 0;

    // synchronized: only one thread can execute this at a time
    public synchronized void increment() { count++; }

    // synchronized block — finer control
    public void add(int n) {
        synchronized (this) { count += n; }
    }
}

// volatile — ensures all threads see the latest value (visibility only)
public class RunFlag {
    private volatile boolean running = true;
    public void stop() { running = false; }
    public void run() { while (running) { /* work */ } }
}

// ReentrantLock — more flexible than synchronized
private final ReentrantLock lock = new ReentrantLock();
public void safeOp() {
    lock.lock();
    try { /* critical section */ }
    finally { lock.unlock(); } // ALWAYS unlock in finally
}

// Atomic classes — lock-free thread safety
private final AtomicInteger atomicCount = new AtomicInteger(0);
atomicCount.incrementAndGet();
atomicCount.compareAndSet(5, 10); // update only if current == 5`}
      </CodeBlock>

      <h2>CompletableFuture (Async)</h2>
      <CodeBlock language="java" title="Async Pipelines">
{`// Async pipeline — non-blocking
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> fetchFromDB())        // async, returns value
    .thenApply(data -> processData(data))    // sync transform
    .thenApplyAsync(r -> callAPI(r))         // async transform
    .exceptionally(ex -> "Error: " + ex.getMessage());

cf.thenAccept(System.out::println);

// Combine multiple futures
CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> "World");
CompletableFuture<String> combined = f1.thenCombine(f2, (a,b) -> a + " " + b);
System.out.println(combined.get()); // Hello World

// Wait for all
CompletableFuture.allOf(f1, f2).thenRun(() -> System.out.println("All done"));

// Wait for any
CompletableFuture.anyOf(f1, f2).thenAccept(r -> System.out.println("First: " + r));`}
      </CodeBlock>

      <InfoBox variant="warning" title="Avoid Deadlocks">
        <p>Deadlocks occur when two threads each hold a lock and wait for the other's lock. Prevent them by always acquiring locks in a consistent order, using tryLock() with timeouts, and keeping synchronized blocks as short as possible.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between calling thread.run() vs thread.start()?"
        options={["They do the same thing", "start() creates a new thread and calls run() in it; run() executes in the current thread", "run() is faster", "start() is deprecated"]}
        correctIndex={1}
        explanation="start() launches a new OS thread and the JVM calls run() in it concurrently. Calling run() directly executes the code in the current thread synchronously — no new thread is created. Always use start() to get actual concurrent execution."
      />
    </LessonLayout>
  );
}
