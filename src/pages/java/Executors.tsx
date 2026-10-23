import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ExecutorsLesson() {
  return (
    <LessonLayout
      title="Executors & Thread Pools"
      sectionId="java"
      lessonIndex={9}
      prev={{ path: '/java/threads', label: 'Threads & Shared State' }}
      next={{ path: '/java/concurrency', label: 'Modern Concurrency — Virtual Threads & the Memory Model' }}
    >
      <h2>The Four Gaps This Closes</h2>
      <p>
        The previous lesson ended with raw <code>Thread</code> failing at four things you need
        for any real workload. Keep them in view, because the API below is organised around
        exactly these four and nothing else:
      </p>
      <ol>
        <li><strong>No result.</strong> <code>Runnable.run()</code> returns <code>void</code>.</li>
        <li><strong>No error reporting.</strong> A thread that throws prints to stderr and dies;
            the code that started it is never told.</li>
        <li><strong>No bound.</strong> Nothing stops you creating ten thousand threads, and
            ten thousand threads cost about twenty times what the work does.</li>
        <li><strong>No lifecycle.</strong> No way to say &ldquo;stop accepting work, finish
            what is running, and tell me when you are done&rdquo;.</li>
      </ol>
      <p>
        The fix, shipped in Java 5 and essentially unchanged since, is to stop thinking in
        threads and start thinking in <strong>tasks</strong>. You write what needs doing. A
        separate object owns the threads and decides where it runs. That object is an{' '}
        <em>executor</em>, and this is the concurrency API you will actually meet at work: every
        Spring <code>@Async</code> method, every <code>@Scheduled</code> job, and every HTTP
        request your service handles is a task on a pool like the ones below.
      </p>

      <FlowChart
        title="Tasks in, pooled threads out"
        chart={"graph LR\nP[Your code: submit a task] --> Q[Work queue]\nQ --> W1[Worker thread 1]\nQ --> W2[Worker thread 2]\nQ --> W3[Worker thread 3]\nW1 --> R[Future holds result or exception]\nW2 --> R\nW3 --> R\nW1 -.->|idle: take next task| Q\nW2 -.->|idle: take next task| Q"}
      />

      <h2>The Three Types, and the Confusingly Named Fourth</h2>
      <ul>
        <li>
          <code>Executor</code> — one method, <code>void execute(Runnable)</code>. The bare
          abstraction: &ldquo;run this somewhere.&rdquo; You rarely name this type.
        </li>
        <li>
          <code>ExecutorService</code> — the one you use. Adds results
          (<code>submit</code>), bulk operations (<code>invokeAll</code>), and lifecycle
          (<code>shutdown</code>).
        </li>
        <li>
          <code>ScheduledExecutorService</code> — adds &ldquo;run this later&rdquo; and
          &ldquo;run this every N seconds&rdquo;.
        </li>
        <li>
          <code>Executors</code> — not a pool at all. A <code>static</code> factory class whose
          methods construct the three above. The plural <code>s</code> is the only thing
          distinguishing it from <code>Executor</code>, which trips up everyone once.
        </li>
      </ul>

      <h2>Your First Pool</h2>
      <p>
        Three worker threads, six tasks. Watch the thread names in the output — that is the
        whole point of a pool made visible.
      </p>

      <CodeBlock language="java" title="PoolReuse.java">
{`import java.util.concurrent.*;

public class PoolReuse {
    public static void main(String[] args) throws Exception {
        try (ExecutorService pool = Executors.newFixedThreadPool(3)) {
            for (int i = 1; i <= 6; i++) {
                int task = i;
                pool.submit(() -> {
                    System.out.println("task " + task + " on " + Thread.currentThread().getName());
                    try { Thread.sleep(100); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                });
            }
        }   // close() waits here until every submitted task has finished
        System.out.println("all six done, pool closed");
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1">
{`task 1 on pool-1-thread-1
task 2 on pool-1-thread-2
task 3 on pool-1-thread-3
task 4 on pool-1-thread-3
task 5 on pool-1-thread-2
task 6 on pool-1-thread-1
all six done, pool closed`}
      </CodeBlock>

      <p>
        Six tasks ran on three threads. Tasks 4, 5 and 6 reused the same threads as 1, 2 and 3
        once those went idle, which is the saving the benchmark in the last lesson measured:
        three thread creations instead of six, and it would still be three at six thousand
        tasks. Note also that the completion order is not the submission order — nothing about
        a pool preserves ordering, so never write code that depends on it.
      </p>

      <InfoBox variant="tip" title="try-with-resources on an executor is a Java 19+ convenience">
        <p>
          <code>ExecutorService</code> implements <code>AutoCloseable</code>, so a{' '}
          <code>try</code>-with-resources block calls <code>close()</code> for you, and{' '}
          <code>close()</code> means &ldquo;shut down, then block until all tasks finish&rdquo;.
          On Java 17 and earlier that interface is not there, and you must write the{' '}
          <code>shutdown()</code> / <code>awaitTermination()</code> pair by hand — covered
          below, and still what you will see in most existing codebases.
        </p>
      </InfoBox>

      <h2>Getting a Value Back: <code>Callable</code> and <code>Future</code></h2>
      <p>
        <code>Runnable</code> cannot return anything and cannot throw a checked exception.{' '}
        <code>Callable&lt;V&gt;</code> is the same idea with both fixed: its single method is{' '}
        <code>V call() throws Exception</code>.
      </p>
      <p>
        Submitting a <code>Callable</code> hands back a <code>Future&lt;V&gt;</code> — a
        receipt for a result that does not exist yet. <code>get()</code> blocks until it does.
      </p>

      <CodeBlock language="java" title="Shapes.java">
{`try (ExecutorService pool = Executors.newFixedThreadPool(3)) {

    // Callable<T> returns a value; Runnable returns nothing.
    Callable<Integer> job = () -> 21 * 2;
    System.out.println("single Future.get() -> " + pool.submit(job).get());

    // invokeAll: submit many, block until ALL are done, results in SUBMISSION order.
    List<Callable<String>> jobs = List.of(
            () -> { Thread.sleep(300); return "slow"; },
            () -> { Thread.sleep(100); return "medium"; },
            () -> "fast");
    long t0 = System.nanoTime();
    List<Future<String>> futures = pool.invokeAll(jobs);
    long ms = (System.nanoTime() - t0) / 1_000_000;
    List<String> results = new ArrayList<>();
    for (Future<String> f : futures) results.add(f.get());
    System.out.println("invokeAll -> " + results + "  in " + ms + " ms");

    // invokeAny: first successful result wins, the rest are cancelled.
    System.out.println("invokeAny -> " + pool.invokeAny(jobs));

    // Timeouts belong on get(), not on faith.
    Future<String> hang = pool.submit(() -> { Thread.sleep(5_000); return "never"; });
    try {
        hang.get(200, TimeUnit.MILLISECONDS);
    } catch (TimeoutException e) {
        System.out.println("get(200ms) -> TimeoutException; cancelled = " + hang.cancel(true));
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1">
{`single Future.get() -> 42
invokeAll -> [slow, medium, fast]  in 304 ms
invokeAny -> fast
get(200ms) -> TimeoutException; cancelled = true`}
      </CodeBlock>

      <p>
        Three details in that output are worth more than the API list. The{' '}
        <strong>304 ms</strong> is the slowest task, not the sum of all three — they really did
        run in parallel. The results came back <strong>[slow, medium, fast]</strong>, in
        submission order rather than completion order, which is what makes{' '}
        <code>invokeAll</code> safe to zip against your input list. And{' '}
        <code>get(200, MILLISECONDS)</code> threw rather than waiting five seconds, which is
        why the no-argument <code>get()</code> is a liability in service code: it will wait
        forever on a task that never returns, and the thread that called it is stuck too.
      </p>

      <InfoBox variant="warning" title="cancel(true) is a request, not a guarantee">
        <p>
          <code>cancel(true)</code> returned <code>true</code> above, which means only that the
          cancellation was <em>accepted</em>: the task had not finished, and the executor
          interrupted its thread. Whether the task actually stops is governed by the same
          cooperative rule as the previous lesson — a task sitting in <code>sleep()</code> or a
          blocking queue wakes with <code>InterruptedException</code>, but a task in a tight
          computation loop that never checks its interrupt flag keeps running to completion
          while <code>isCancelled()</code> reports <code>true</code>. Passing{' '}
          <code>false</code> is weaker still: it only prevents a task that has not started yet
          from starting.
        </p>
      </InfoBox>

      <h2>The Trap: <code>submit</code> Swallows Your Exceptions</h2>
      <p>
        This is the single most expensive thing to not know about executors, because it turns a
        crash into silence. <code>submit()</code> captures whatever the task throws inside the{' '}
        <code>Future</code>. If nobody calls <code>get()</code>, nobody ever learns the task
        failed. No log line, no stack trace, no stderr.
      </p>

      <CodeBlock language="java" title="Swallow.java">
{`try (ExecutorService pool = Executors.newFixedThreadPool(2)) {
    System.out.println("--- submit() ---");
    Future<?> f = pool.submit(() -> { throw new IllegalStateException("boom from submit"); });
    Thread.sleep(200);
    System.out.println("nothing printed above? the exception is inside the Future");

    System.out.println("--- future.get() ---");
    try {
        f.get();
    } catch (ExecutionException e) {
        System.out.println("get() threw " + e.getClass().getSimpleName()
                + ", cause = " + e.getCause());
    }

    System.out.println("--- execute() ---");
    pool.execute(() -> { throw new IllegalStateException("boom from execute"); });
    Thread.sleep(300);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1">
{`--- submit() ---
nothing printed above? the exception is inside the Future
--- future.get() ---
get() threw ExecutionException, cause = java.lang.IllegalStateException: boom from submit
--- execute() ---
Exception in thread "pool-1-thread-2" java.lang.IllegalStateException: boom from execute
	at Swallow.lambda$main$1(Swallow.java:20)
	at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1090)
	at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:614)
	at java.base/java.lang.Thread.run(Thread.java:1516)`}
      </CodeBlock>

      <p>
        Same pool, same exception type, two completely different outcomes. Under{' '}
        <code>submit()</code> nothing was printed at all — the <code>IllegalStateException</code>{' '}
        sat in the <code>Future</code> until <code>get()</code> was called, and had the code not
        called it, the failure would have left no trace anywhere in the process. Under{' '}
        <code>execute()</code> there is no <code>Future</code> to put it in, so it reached the
        thread's default uncaught-exception handler and printed.
      </p>
      <p>
        Note also what <code>get()</code> threw: not your <code>IllegalStateException</code> but
        an <code>ExecutionException</code> <em>wrapping</em> it. Your real failure is always one{' '}
        <code>getCause()</code> deeper than you expect, which matters when you write the catch
        block — <code>catch (IllegalStateException e)</code> around a <code>get()</code> never
        fires.
      </p>

      <InfoBox variant="danger" title="The three rules that follow from this">
        <ul>
          <li>
            <strong>Fire-and-forget work goes through <code>execute()</code>, not{' '}
            <code>submit()</code>.</strong> If you are discarding the <code>Future</code>, you
            are discarding your error reporting with it. Some static analysers flag an ignored{' '}
            <code>Future</code> for exactly this reason.
          </li>
          <li>
            <strong>If you do hold a <code>Future</code>, something must call{' '}
            <code>get()</code>.</strong> Collect them in a list and drain it; never submit in a
            loop and walk away.
          </li>
          <li>
            <strong>Wrap the task body in try/catch and log.</strong> The most robust pattern,
            and the only one that survives a future refactor from <code>execute</code> to{' '}
            <code>submit</code>:
          </li>
        </ul>
        <CodeBlock language="java" title="A task that cannot fail silently">
{`pool.execute(() -> {
    try {
        doWork();
    } catch (Exception e) {                 // not Throwable: leave Errors to the JVM
        log.error("work failed", e);        // the task's own failure is its own business
    }
});

// Belt and braces for a whole pool: give it a ThreadFactory whose threads
// have an uncaught-exception handler, so even a bug in your catch block logs.
ThreadFactory tf = r -> {
    Thread t = new Thread(r);
    t.setUncaughtExceptionHandler((thread, ex) -> log.error("uncaught in {}", thread.getName(), ex));
    return t;
};`}
        </CodeBlock>
      </InfoBox>

      <h2>Shutdown: The Part That Hangs Your Build</h2>
      <p>
        Pool threads created by <code>Executors</code> are <strong>non-daemon</strong>. From the
        last lesson's daemon rule, that has a direct consequence: a pool you never shut down
        keeps the JVM alive forever, even after <code>main</code> returns.
      </p>

      <CodeBlock language="java" title="NoShutdown.java — the whole program">
{`public static void main(String[] args) {
    ExecutorService pool = Executors.newFixedThreadPool(1);
    pool.submit(() -> System.out.println("task done"));
    System.out.println("main() is returning now");
    // no shutdown(), no close()
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real behaviour on java 26.0.1">
{`main() is returning now
task done
[STILL RUNNING after 8s - killed by the harness]`}
      </CodeBlock>

      <p>
        The work finished, <code>main</code> returned, and the process sat there. One idle
        worker thread held it open. This is the mechanism behind &ldquo;the test suite passes
        but the Gradle task never exits&rdquo; and &ldquo;the container does not stop on{' '}
        <code>SIGTERM</code>&rdquo;. Three methods control it:
      </p>

      <CodeBlock language="java" title="Lifecycle.java">
{`ExecutorService pool = Executors.newFixedThreadPool(2);
for (int i = 1; i <= 4; i++) { /* submit four 300ms tasks */ }

pool.shutdown();                                  // stop accepting; let queued work run
System.out.println("isShutdown=" + pool.isShutdown() + "  isTerminated=" + pool.isTerminated());
try {
    pool.submit(() -> System.out.println("late task"));
} catch (RejectedExecutionException e) {
    System.out.println("submit after shutdown -> RejectedExecutionException");
}
boolean done = pool.awaitTermination(5, TimeUnit.SECONDS);
System.out.println("awaitTermination returned " + done + "  isTerminated=" + pool.isTerminated());`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1">
{`isShutdown=true  isTerminated=false
submit after shutdown -> RejectedExecutionException
finished 2
finished 1
finished 4
finished 3
awaitTermination returned true  isTerminated=true`}
      </CodeBlock>

      <p>
        The two flags are not the same question, and the first two output lines show why.
        Immediately after <code>shutdown()</code>, <code>isShutdown()</code> is{' '}
        <code>true</code> — new work is refused — while <code>isTerminated()</code> is still{' '}
        <code>false</code>, because four tasks were still running. <code>shutdown()</code> does
        not wait; it only closes the door. <code>awaitTermination</code> is what waits, and its{' '}
        <code>boolean</code> return is the one people drop on the floor: <code>false</code>{' '}
        means the timeout expired with work still running, which is precisely when you need to
        know.
      </p>

      <CodeBlock language="java" title="The standard shutdown, correct on every JDK">
{`void shutdownGracefully(ExecutorService pool) {
    pool.shutdown();                                   // refuse new work, drain the queue
    try {
        if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
            pool.shutdownNow();                        // interrupt what is still running
            if (!pool.awaitTermination(10, TimeUnit.SECONDS)) {
                log.error("pool did not terminate; tasks are ignoring interrupts");
            }
        }
    } catch (InterruptedException e) {
        pool.shutdownNow();
        Thread.currentThread().interrupt();             // never swallow it
    }
}`}
      </CodeBlock>

      <p>
        <code>shutdownNow()</code> is the escalation: it discards the queue, returns the tasks
        that never ran, and <strong>interrupts</strong> the threads that are running. Interrupts
        again — so a task that swallows <code>InterruptedException</code> cannot be stopped by{' '}
        <code>shutdownNow()</code> either. That is the second time the same mistake has cost
        something concrete in two lessons.
      </p>

      <h2>What the Factory Methods Hide</h2>
      <p>
        Every pool from <code>Executors</code> is a <code>ThreadPoolExecutor</code> underneath,
        configured by six parameters. You should know them even if you keep using the
        factories, because the two most popular factories make opposite and dangerous choices
        about two of them.
      </p>

      <CodeBlock language="java" title="The real constructor">
{`new ThreadPoolExecutor(
    int corePoolSize,              // threads kept alive even when idle
    int maximumPoolSize,           // ceiling, and ONLY reached when the queue is full
    long keepAliveTime,            // how long a thread above core size may sit idle
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue,   // where tasks wait; its BOUND is the real policy
    ThreadFactory threadFactory,         // name your threads; set daemon flag; add handlers
    RejectedExecutionHandler handler);   // what to do when queue is full and max reached`}
      </CodeBlock>

      <InfoBox variant="warning" title="maximumPoolSize does nothing until the queue is full">
        <p>
          This is the counter-intuitive rule at the centre of pool tuning, and it is the reason
          most hand-tuned pools never behave as their author expected. A{' '}
          <code>ThreadPoolExecutor</code> grows in a strict order: it starts a new thread per
          task until <code>corePoolSize</code>, then <strong>queues</strong>, and only when the
          queue refuses a task does it create threads up to{' '}
          <code>maximumPoolSize</code>.
        </p>
        <p>
          So <code>core=2, max=50</code> with an <em>unbounded</em> queue is a pool of exactly
          two threads, forever. The 50 is unreachable, because the queue never fills. Setting a
          large maximum while leaving the default queue is a no-op that reads like capacity
          planning.
        </p>
      </InfoBox>

      <p>
        Here is what the two common factories actually construct, read back from the objects
        themselves rather than from the documentation:
      </p>

      <CodeBlock language="text" title="Real output on java 26.0.1, 14-core machine">
{`availableProcessors        = 14
ForkJoinPool.commonPool    = parallelism = 13
newFixedThreadPool(4):
   core=4 max=4 queue=LinkedBlockingQueue remainingCapacity=2147483647
newCachedThreadPool():
   core=0 max=2147483647 queue=SynchronousQueue keepAlive=60s`}
      </CodeBlock>

      <ul>
        <li>
          <strong><code>newFixedThreadPool(4)</code> bounds the threads and not the work.</strong>{' '}
          That <code>remainingCapacity</code> of 2,147,483,647 is{' '}
          <code>Integer.MAX_VALUE</code>: an effectively unbounded queue. Under sustained
          overload the queue grows until the heap does not fit it, and the service dies of{' '}
          <code>OutOfMemoryError</code> rather than shedding load. The symptom is a latency
          graph that climbs steadily for twenty minutes before the process disappears.
        </li>
        <li>
          <strong><code>newCachedThreadPool()</code> bounds the work and not the
          threads.</strong> A <code>SynchronousQueue</code> has no capacity at all, so every
          task that arrives with no idle thread available creates one — up to{' '}
          <code>Integer.MAX_VALUE</code> of them. Point this at a slow dependency and it will
          answer a traffic spike by creating thousands of threads, which is how you get{' '}
          <code>OutOfMemoryError: unable to create native thread</code>.
        </li>
      </ul>

      <p>
        Both failure modes have the same cause: nothing in either configuration ever says
        &ldquo;no&rdquo;. A bounded queue is what lets a pool say no, and saying no is what
        keeps a service alive under load.
      </p>

      <CodeBlock language="java" title="Bounded.java — a pool that refuses work">
{`ThreadPoolExecutor pool = new ThreadPoolExecutor(
        2, 2,                                  // core, max
        0L, TimeUnit.MILLISECONDS,
        new ArrayBlockingQueue<>(3),           // room for only 3 waiting tasks
        new ThreadPoolExecutor.AbortPolicy()); // default: throw when full

// submit ten 500ms tasks as fast as the loop can go`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1">
{`accepted task 1  (queue size now 0)
accepted task 2  (queue size now 0)
accepted task 3  (queue size now 1)
accepted task 4  (queue size now 2)
accepted task 5  (queue size now 3)
REJECTED task 6: java.util.concurrent.RejectedExecutionException
  capacity was 2 running + 3 queued = 5
ran task 1
ran task 2
ran task 3
ran task 4
ran task 5`}
      </CodeBlock>

      <p>
        Trace the queue size column and the mechanism is visible: tasks 1 and 2 went straight
        to the two core threads, so the queue stayed empty; tasks 3, 4 and 5 filled the
        three-slot queue; task 6 arrived with both threads busy and the queue full, and the
        pool threw. <strong>Total capacity is threads plus queue</strong> — five here — and a
        rejection at five is infinitely better than an <code>OutOfMemoryError</code> at
        five hundred thousand, because a rejection is something your caller can retry, shed, or
        report.
      </p>

      <CodeBlock language="text" title="The four rejection policies">
{`AbortPolicy          throw RejectedExecutionException. The default, and usually right:
                     the caller finds out and can decide.
CallerRunsPolicy     run the task on the calling thread. Natural backpressure - the
                     producer is busy doing the work, so it stops producing. Best
                     default for an internal pipeline you control.
DiscardPolicy        silently drop the task. Only for data you can genuinely lose,
                     such as sampled metrics. Silent is the problem.
DiscardOldestPolicy  drop the oldest queued task to make room. For "latest value
                     wins" feeds, such as a price tick or a UI refresh.`}
      </CodeBlock>

      <h3>How big should the pool be?</h3>
      <p>
        There is no formula that survives measurement, but there are two starting points that
        are right often enough to defend in review:
      </p>
      <ul>
        <li>
          <strong>CPU-bound work: about one thread per core.</strong>{' '}
          <code>Runtime.getRuntime().availableProcessors()</code>. More threads than cores does
          not create more compute; it adds context switching and cache pressure to the same
          amount of compute.
        </li>
        <li>
          <strong>I/O-bound work: cores &times; (1 + wait time / compute time).</strong> If a
          task waits 90ms on a database for every 10ms of work, the ratio is 9, so around ten
          threads per core keeps the cores busy. This is why the old advice &ldquo;200 threads
          for a web app&rdquo; was not absurd — the threads were nearly all idle.
        </li>
      </ul>
      <p>
        Treat both as a first guess to be checked against the actual metric that matters —
        queue depth and task latency under real load. And note that the second bullet is the
        calculation virtual threads delete entirely, which is the subject of the next lesson.
      </p>

      <InfoBox variant="tip" title="One pool per kind of work, never one pool for everything">
        <p>
          Sharing a single pool between fast and slow tasks means the slow ones starve the fast
          ones: twenty 30-second report jobs fill every thread, and the 5ms cache refresh that
          a user is waiting on sits behind them in the queue. This is <em>head-of-line
          blocking</em>, and it is the most common self-inflicted latency problem in Java
          services. Give each class of work its own pool so one can saturate without stalling
          the others — and name the threads with a <code>ThreadFactory</code>, because{' '}
          <code>pool-3-thread-7</code> tells you nothing in a thread dump at 3am while{' '}
          <code>report-export-7</code> tells you everything.
        </p>
      </InfoBox>

      <h2>Scheduled Work</h2>
      <p>
        <code>ScheduledExecutorService</code> adds delays and repetition. The two repeating
        methods differ in where the clock starts, which decides what happens when a run takes
        longer than the interval:
      </p>

      <CodeBlock language="java" title="Fixed rate vs fixed delay">
{`ScheduledExecutorService s = Executors.newSingleThreadScheduledExecutor();

// One-shot, after a delay.
s.schedule(() -> log.info("ran once"), 5, TimeUnit.SECONDS);

// Every 30s measured from each START. If a run takes 40s, the next is already
// late and begins immediately -- runs can bunch up behind a slow one.
s.scheduleAtFixedRate(this::publishMetrics, 0, 30, TimeUnit.SECONDS);

// 30s measured from each END. Guarantees a 30s gap between runs, so the
// effective period drifts with how long the work takes. Safer for anything
// whose duration varies -- polling a queue, syncing a remote resource.
s.scheduleWithFixedDelay(this::pollInbox, 0, 30, TimeUnit.SECONDS);`}
      </CodeBlock>

      <p>
        Both share a trap that is much worse than the choice between them. A repeating task that
        throws is <strong>not</strong> retried, logged, or reported — the schedule is silently
        cancelled and never runs again. The program keeps running, apparently fine.
      </p>

      <CodeBlock language="java" title="Scheduled.java — tick every 100ms, throw on tick 3">
{`ScheduledExecutorService s = Executors.newSingleThreadScheduledExecutor();
AtomicInteger runs = new AtomicInteger();

s.scheduleAtFixedRate(() -> {
    int n = runs.incrementAndGet();
    System.out.println("tick " + n);
    if (n == 3) throw new RuntimeException("transient failure on tick 3");
}, 0, 100, TimeUnit.MILLISECONDS);

Thread.sleep(1_000);                       // a full second: ~10 ticks expected
System.out.println("after 1s, total ticks = " + runs.get());`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1">
{`tick 1
tick 2
tick 3
after 1s, total ticks = 3`}
      </CodeBlock>

      <p>
        Ten ticks expected, three delivered, no exception printed anywhere. One transient
        failure permanently stopped a recurring job, and the only external evidence is a metric
        that flatlines. This is why <strong>every</strong> scheduled task body must be wrapped
        in its own try/catch — not for tidiness, but because the alternative is a job that dies
        quietly on its first bad day and stays dead until someone redeploys:
      </p>

      <CodeBlock language="java" title="A recurring task that survives a bad run">
{`s.scheduleAtFixedRate(() -> {
    try {
        publishMetrics();
    } catch (Exception e) {
        log.warn("metrics publish failed; will retry next tick", e);
    }
}, 0, 30, TimeUnit.SECONDS);`}
      </CodeBlock>

      <h2>The Pool You Did Not Create</h2>
      <p>
        One pool exists in every JVM whether you ask for it or not:{' '}
        <code>ForkJoinPool.commonPool()</code>. Its parallelism defaults to one less than your
        core count — 13 on the 14-core machine above — on the theory that the submitting thread
        helps out.
      </p>
      <p>
        You need to know it exists because two things use it by default:
      </p>
      <ul>
        <li>
          <code>parallelStream()</code> and <code>Arrays.parallelSort</code>, from the streams
          lesson.
        </li>
        <li>
          <code>CompletableFuture.supplyAsync(fn)</code> and friends, when you do not pass an
          executor.
        </li>
      </ul>

      <InfoBox variant="danger" title="Why blocking on the common pool is a whole-application outage">
        <p>
          The common pool is sized for CPU-bound work and shared by every library in your
          process. Put a blocking HTTP call in a <code>parallelStream</code> or an
          executor-less <code>CompletableFuture</code>, and a handful of slow requests occupy
          all 13 threads. Everything else that uses the common pool anywhere in the application
          now waits — including code in dependencies you have never read. The failure does not
          look like your bug, which is what makes it expensive.
        </p>
        <p>
          The rule is one line long: <strong>pass your own executor to every{' '}
          <code>*Async</code> call.</strong> Every one of them has an overload that takes one.
        </p>
        <CodeBlock language="java" title="The overload that matters">
{`// Wrong: runs on the shared common pool, blocking its CPU-sized threads on network I/O.
CompletableFuture.supplyAsync(() -> http.get(url));

// Right: your pool, your capacity, your failure domain.
CompletableFuture.supplyAsync(() -> http.get(url), httpExecutor);`}
        </CodeBlock>
      </InfoBox>

      <h2>Where You Will Meet This in Spring</h2>
      <p>
        You will configure executors far more often than you create them, because Spring Boot
        puts a pool behind several things that do not look like pools:
      </p>
      <CodeBlock language="text" title="Executors you are already using">
{`Incoming HTTP requests   Tomcat's own thread pool. server.tomcat.threads.max
                         (default 200) is a maximumPoolSize, and the queue in
                         front of it is server.tomcat.accept-count.

@Async methods           A Spring TaskExecutor, configured under
                         spring.task.execution.pool.*  -- core-size, max-size,
                         queue-capacity: the same three parameters as above.
                         The default queue capacity is Integer.MAX_VALUE, so the
                         unbounded-queue warning applies to it directly.

@Scheduled methods       A ScheduledExecutorService under
                         spring.task.scheduling.pool.size -- which defaults to 1.
                         One slow job therefore delays every other scheduled job
                         in the application.

@Transactional + @Async  A transaction is bound to a thread, so it does NOT
                         follow the task onto the pool. Covered in the Spring
                         transactions lesson.`}
      </CodeBlock>

      <p>
        The point of reading this lesson before touching those properties is that{' '}
        <code>spring.task.execution.pool.max-size</code> is the same{' '}
        <code>maximumPoolSize</code> that does nothing until the queue fills. Raising it while
        leaving <code>queue-capacity</code> at its default changes nothing at all, and that is
        a real afternoon lost if you do not know the growth order.
      </p>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="Signs an executor is being used correctly">
        <ul>
          <li>Every pool has a bounded queue, or a documented reason it does not.</li>
          <li>Every pool is shut down — try-with-resources, a <code>@PreDestroy</code>, or the{' '}
              <code>shutdown</code>/<code>awaitTermination</code>/<code>shutdownNow</code>{' '}
              ladder.</li>
          <li>No <code>Future</code> is created and then ignored; fire-and-forget uses{' '}
              <code>execute()</code>.</li>
          <li>Every task body, and especially every scheduled task body, catches and logs its
              own exceptions.</li>
          <li>Every <code>get()</code> in request-handling code has a timeout.</li>
          <li>Threads are named by a <code>ThreadFactory</code>, so a thread dump is readable.</li>
          <li>Slow work and fast work do not share a pool.</li>
          <li>No <code>*Async</code> call relies on the common <code>ForkJoinPool</code>.</li>
        </ul>
      </InfoBox>

      <h2>Where This Leads</h2>
      <p>
        Everything above exists because platform threads are expensive, so they have to be
        pooled, and pooling forces you to pick a size, a queue bound, and a rejection policy
        for every kind of work in the application. The next lesson,{' '}
        <strong>Modern Concurrency</strong>, is what happens when that premise stops holding:
        virtual threads are cheap enough to create one per task, which removes the sizing
        question for I/O-bound work entirely and makes several rules above obsolete. The ones
        that stay — bounded concurrency against a fragile dependency, never swallowing an
        interrupt, shared mutable state still losing updates — are the ones to carry across.
      </p>
    </LessonLayout>
  );
}
