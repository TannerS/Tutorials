import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function FromScratchScheduler() {
  return (
    <LessonLayout
      title="Build a Task Scheduler"
      sectionId="from-scratch"
      lessonIndex={1}
      prev={{ path: '/from-scratch/intro', label: 'Why Build the Thing You Already Use' }}
      next={{ path: '/from-scratch/storage', label: 'Build a Key-Value Store with a Write-Ahead Log' }}
    >
      <p>
        A scheduler decides <em>which work runs, on which thread, in what order</em>. That is the
        whole job. Once you have built one, <code>ExecutorService</code>, <code>@Async</code>,{' '}
        <code>@Scheduled</code>, and the reason virtual threads exist all stop being separate
        things you memorised and become one thing you understand.
      </p>

      <p>
        Everything below was compiled and run on the machine that wrote this lesson — JDK 26.0.1,
        14 cores. Timings are hardware-specific; the <em>shapes</em> are not.
      </p>

      <h2>Step 1: A Thread Per Task</h2>

      <p>
        The simplest scheduler possible: for each task, make a thread. No queue, no pool, no
        policy.
      </p>

      <CodeBlock language="java" title="The naive version">
{`for (int i = 0; i < TASKS; i++) {
    new Thread(task).start();
}`}
      </CodeBlock>

      <p>
        Everyone is told this is wrong. It is worth finding out <em>why</em>, because the honest
        answer is &quot;it depends&quot;, and the way it depends is the entire design space of a
        scheduler.
      </p>

      <h2>Step 2: A Worker Pool Over a Queue</h2>

      <p>
        The alternative: a fixed number of worker threads, all pulling from a shared queue. This
        is <code>ExecutorService</code> in about forty lines.
      </p>

      <CodeBlock language="java" title="MiniPool.java — the whole idea">
{`class MiniPool {
    private final BlockingQueue<Runnable> queue = new LinkedBlockingQueue<>();
    private final List<Thread> workers = new ArrayList<>();
    private volatile boolean running = true;

    MiniPool(int n) {
        for (int i = 0; i < n; i++) {
            Thread w = new Thread(() -> {
                while (running) {
                    try {
                        // poll, not take: a timeout lets the worker notice
                        // shutdown instead of blocking on an empty queue forever
                        Runnable r = queue.poll(50, TimeUnit.MILLISECONDS);
                        if (r != null) r.run();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
            });
            w.start();
            workers.add(w);
        }
    }

    void submit(Runnable r) { queue.offer(r); }

    void shutdown() throws InterruptedException {
        running = false;
        for (Thread w : workers) w.join();
    }
}`}
      </CodeBlock>

      <FlowChart
        title="The Shape of Every Thread Pool"
        chart={"graph LR\n  P[Producer calls submit] --> Q[[BlockingQueue]]\n  Q --> W1[Worker 1]\n  Q --> W2[Worker 2]\n  Q --> W3[Worker N]\n  W1 --> R[run task]\n  W2 --> R\n  W3 --> R\n  style Q fill:#1a2744\n  style R fill:#1a3329"}
      />

      <h2>Which One Is Faster? Both.</h2>

      <p>
        Run 10,000 <strong>CPU-bound</strong> tasks — a tight arithmetic loop, no blocking —
        through each:
      </p>

      <CodeBlock language="text" title="Real output — CPU-bound work, JDK 26.0.1, 14 cores">
{`tasks=10000

thread-per-task :   241 ms
worker pool (14):     7 ms

=> pool is 34x faster, on 14 threads instead of 10000`}
      </CodeBlock>

      <p>
        That is the result everybody expects, and it is why &quot;use a pool&quot; became the rule.
        The threads cost more to create than the work costs to do.
      </p>

      <p>
        Now change one thing. Same task count, but each task <strong>blocks</strong> for 50ms —
        which is what a task waiting on a database or an HTTP call actually does:
      </p>

      <CodeBlock language="text" title="Real output — 5,000 tasks, each blocking 50ms">
{`thread-per-task (platform) :   282 ms   peak platform threads 1663
fixed pool of 14           : 19451 ms   peak platform threads 20
virtual thread per task    :    76 ms   peak platform threads 22

  ideal floor for a fixed pool = TASKS/threads * BLOCK_MS = 17850 ms`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Pool Is 69x Slower Here — And It Is Not a Bug">
        <p>
          Fourteen workers can only be inside a 50ms sleep fourteen at a time. Five thousand tasks
          divided by fourteen workers, times 50ms, is <strong>17.85 seconds</strong> — and the
          measured 19.45s lands almost exactly on that floor. The pool is behaving perfectly. It
          is <em>sized</em> for the wrong workload.
        </p>
        <p>
          This is the thing the &quot;always use a pool&quot; advice hides. A pool sized to your
          core count is correct for CPU-bound work and catastrophic for blocking work, because a
          blocked thread is not using a core — it is just occupying a worker slot.
        </p>
      </InfoBox>

      <p>
        And there is the reason virtual threads exist, in one line of that output: 5,000 concurrent
        blocking tasks, finished in 76ms, on <strong>22 platform threads</strong>. A virtual thread
        that blocks unmounts from its carrier, so blocking stops costing you a thread.
      </p>

      <h2>Step 3: The Queue Decides More Than You Think</h2>

      <p>
        <code>MiniPool</code> above used a <code>LinkedBlockingQueue</code> with no capacity — an{' '}
        <strong>unbounded</strong> queue. That single default choice decides what your service does
        under overload.
      </p>

      <CodeBlock language="text" title="What each queue does when work arrives faster than it drains">
{`unbounded queue     submit() always succeeds. The queue grows. Latency
                    climbs without limit. Eventually: OutOfMemoryError.
                    The failure arrives late and looks like a memory leak.

bounded queue       submit() blocks or is rejected once full. The caller
                    finds out immediately. Backpressure reaches the client
                    while you can still do something about it.`}
      </CodeBlock>

      <InfoBox variant="danger" title="The Spring Boot Default That Catches People">
        <p>
          Spring Boot&apos;s auto-configured <code>applicationTaskExecutor</code> is a{' '}
          <code>ThreadPoolTaskExecutor</code> with a core size of 8 and an effectively{' '}
          <strong>unbounded queue</strong>. Because the pool only grows past its core size when the
          queue is <em>full</em>, and that queue never fills, <code>max-size</code> is never
          reached. Work silently backs up behind eight threads.
        </p>
        <p>
          The symptom is a service that gets slower and slower under load without erroring — the
          worst kind of failure, because nothing alerts. Set{' '}
          <code>spring.task.execution.pool.queue-capacity</code> to something finite and the pool
          can actually grow, and callers learn about overload. See{' '}
          <a href="/springboot/advanced">Advanced Topics</a> for the Spring-side detail.
        </p>
      </InfoBox>

      <h2>Step 4: Priorities, and the Bill They Come With</h2>

      <p>
        Swap the queue for a <code>PriorityBlockingQueue</code> and tasks come out in priority
        order rather than arrival order. That is a two-line change with a consequence people
        discover in production.
      </p>

      <CodeBlock language="java" title="Priority ordering">
{`record Job(int prio, String name) implements Comparable<Job> {
    public int compareTo(Job o) { return Integer.compare(prio, o.prio); }
}

PriorityBlockingQueue<Job> queue = new PriorityBlockingQueue<>();`}
      </CodeBlock>

      <p>
        Queue 50 high-priority jobs, add one low-priority job, then keep feeding high-priority work
        slightly faster than the worker drains it — which is exactly what a busy system does:
      </p>

      <CodeBlock language="text" title="Real output — 1 second of draining">
{`drained 341 tasks in 1s
LOW ran at: never (starved)
queue still holding: 375`}
      </CodeBlock>

      <p>
        The low-priority task was submitted <em>before</em> 4,950 of the tasks that overtook it,
        and it never ran. It will never run for as long as high-priority work keeps arriving. That
        is <strong>starvation</strong>, and a plain priority queue has no defence against it.
      </p>

      <FlowChart
        title="Task Lifecycle — and Where Starvation Lives"
        chart={"graph TD\n  S[submitted] --> Q{queue type?}\n  Q -->|FIFO| F[waits behind earlier tasks<br/>bounded wait]\n  Q -->|priority| P[waits behind ALL higher priority<br/>unbounded wait]\n  F --> R[running]\n  P --> R\n  P -.starvation.-> P\n  R --> D[done]\n  R --> E[threw]\n  style P fill:#3b1a1a\n  style R fill:#1a3329\n  style D fill:#1a2744"}
      />

      <p>
        The real fix is <strong>ageing</strong>: raise a task&apos;s effective priority the longer
        it waits, so anything eventually reaches the front. Every production scheduler that offers
        priorities does some version of this — and it is why &quot;just add priorities&quot; is
        rarely as cheap as it sounds.
      </p>

      <h2>Step 5: Running Something Later</h2>

      <p>
        <code>@Scheduled</code> and <code>ScheduledExecutorService</code> need one more primitive:
        a queue ordered by <em>time</em> rather than priority. <code>DelayQueue</code> is exactly
        that — an element is only available once its delay has elapsed.
      </p>

      <CodeBlock language="java" title="A scheduled task in one type">
{`record DelayedTask(Runnable body, long runAtNanos) implements Delayed {
    public long getDelay(TimeUnit u) {
        return u.convert(runAtNanos - System.nanoTime(), TimeUnit.NANOSECONDS);
    }
    public int compareTo(Delayed o) {
        return Long.compare(getDelay(TimeUnit.NANOSECONDS), o.getDelay(TimeUnit.NANOSECONDS));
    }
}

DelayQueue<DelayedTask> timers = new DelayQueue<>();
// worker: timers.take() blocks until the earliest task is actually due`}
      </CodeBlock>

      <p>
        At large scale a <code>DelayQueue</code>&apos;s per-insert <code>O(log n)</code> becomes the
        bottleneck, and schedulers switch to a <strong>timing wheel</strong> — buckets by time
        slot, <code>O(1)</code> insert. That is what Kafka and Netty use for their timers.
      </p>

      <h2>Step 6: Shutdown Is Where Work Gets Lost</h2>

      <CodeBlock language="text" title="The two shutdowns, and what each costs">
{`shutdown()      stop accepting new work, finish what is queued.
                Graceful. Can hang if a task never returns.

shutdownNow()   stop accepting, drain the queue, interrupt running
                threads. Returns the tasks that never ran — and if you
                ignore that return value, that work is simply gone.

The usual correct shape:
    pool.shutdown();
    if (!pool.awaitTermination(30, SECONDS)) {
        List<Runnable> dropped = pool.shutdownNow();   // <- do something
        log.warn("dropped {} queued tasks", dropped.size());
    }`}
      </CodeBlock>

      <InfoBox variant="tip" title="Interruption Is Cooperative">
        <p>
          <code>shutdownNow()</code> interrupts worker threads, but interruption is a{' '}
          <em>request</em>. A task sitting in a tight CPU loop that never checks{' '}
          <code>Thread.interrupted()</code> and never calls a blocking method will keep running to
          completion. That is why <code>awaitTermination</code> can time out, and why swallowing{' '}
          <code>InterruptedException</code> without restoring the flag is a real bug rather than
          a style nit — see <a href="/java/concurrency">Concurrency &amp; Threads</a>.
        </p>
      </InfoBox>

      <h2>What You Just Built, In Real Names</h2>

      <CodeBlock language="text" title="Every piece maps to something you already use">
{`your queue + workers        ->  ExecutorService / ThreadPoolExecutor
queue capacity choice       ->  spring.task.execution.pool.queue-capacity
PriorityBlockingQueue       ->  priority scheduling (and its starvation)
DelayQueue / timing wheel   ->  ScheduledExecutorService, @Scheduled
submit() returning a handle ->  Future / CompletableFuture
worker unmounts on block    ->  virtual threads (JEP 444)
graceful vs forced stop     ->  shutdown() vs shutdownNow()`}
      </CodeBlock>

      <h2>What This Toy Does Not Do</h2>

      <CodeBlock language="text" title="Named honestly, so you know what you skipped">
{`work stealing         per-worker deques with stealing on empty
                      (ForkJoinPool) — better cache locality
ageing                the actual fix for priority starvation
rejection policies    CallerRuns / Abort / Discard when bounded+full
metrics               queue depth and wait time are THE numbers you
                      need in production, and this has neither
cancellation          Future.cancel, and honouring it mid-task
affinity / fairness   pinning work, or guaranteeing per-tenant shares`}
      </CodeBlock>

      <p>
        Queue depth deserves the last word. A pool with a healthy thread count and a queue that
        keeps growing is a service that is already failing — it just has not noticed yet. That
        single metric is worth more than any amount of tuning, and it is the one thing this
        forty-line scheduler cannot tell you.
      </p>
    </LessonLayout>
  );
}

export default FromScratchScheduler;
