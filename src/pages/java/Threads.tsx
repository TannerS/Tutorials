import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Threads() {
  return (
    <LessonLayout
      title="Threads & Shared State"
      sectionId="java"
      lessonIndex={8}
      prev={{ path: '/java/optional', label: 'Optional — Best & Worst Practices' }}
      next={{ path: '/java/executors', label: 'Executors & Thread Pools' }}
    >
      <h2>Where This Sits</h2>
      <p>
        Every line of Java you have written in this section so far ran on one thread. The
        streams lesson hinted at a second one — <code>parallelStream()</code> — and then
        told you to use it sparingly without saying what it actually starts. This lesson is
        that missing piece: what a thread is in Java, how to start one, and the one category
        of bug that makes concurrent code different from everything else you have debugged.
      </p>
      <p>
        It is the first of three. This lesson covers raw threads and what goes wrong when
        two of them touch the same data. The next covers <code>ExecutorService</code> — the
        API you will actually use at work, because almost nobody writes{' '}
        <code>new Thread(...)</code> directly. The third covers what changed in Java 21 and
        later, once you know what it changed <em>from</em>.
      </p>

      <InfoBox variant="note" title="If you are coming from Node or Python">
        <p>
          This is the biggest mental shift in the language, bigger than types or classes. In
          Node, two pieces of your JavaScript never execute at the same instant: the event
          loop runs one callback to completion before picking up the next, so a half-finished
          update to a shared object is never visible to anyone. <code>async</code> code
          interleaves at <code>await</code> points you can see.
        </p>
        <p>
          In Java, two threads run your code <em>simultaneously</em>, on different CPU cores,
          against the same objects on the same heap — and they can interleave between any two
          machine instructions, including in the middle of a single <code>x++</code>. Nothing
          in the syntax marks where that can happen. Everything below follows from that one
          fact.
        </p>
      </InfoBox>

      <h2>What a Thread Actually Is</h2>
      <p>
        A thread is one call stack plus the bookkeeping to run it: a program counter, a set
        of registers, and a stack of frames for the methods currently executing. The
        operating system schedules threads onto CPU cores. A JVM always has several running —
        your <code>main</code>, plus JVM-internal ones for garbage collection and JIT
        compilation.
      </p>
      <p>
        The division of memory is the part that matters for correctness, and you already met
        it in the syntax lesson under stack and heap:
      </p>
      <ul>
        <li>
          <strong>Each thread gets its own stack.</strong> Local variables and method
          parameters live there. No other thread can see them. Local variables are therefore
          thread-safe for free — this is worth remembering, because it is the cheapest
          correctness tool you have.
        </li>
        <li>
          <strong>All threads share one heap.</strong> Every object, every array, every
          field — including <code>static</code> fields — is visible to all of them at once.
          This is where the bugs live.
        </li>
      </ul>

      <FlowChart
        title="One heap, many stacks"
        chart={"graph TD\nsubgraph JVM\nH[Shared heap: all objects, arrays, static fields]\nS1[Thread main - own stack]\nS2[Thread worker-1 - own stack]\nS3[Thread worker-2 - own stack]\nend\nS1 --> H\nS2 --> H\nS3 --> H"}
      />

      <h2>Starting One</h2>
      <p>
        A thread needs a body of work. That body is a <code>Runnable</code>: a functional
        interface with one method, <code>void run()</code>, so a lambda works. You hand it to
        a <code>Thread</code> and call <code>start()</code>.
      </p>
      <p>
        The single most common beginner mistake is calling <code>run()</code> instead of{' '}
        <code>start()</code>. Both compile. Only one of them starts a thread — <code>run()</code>{' '}
        is just a method call on the current thread, like any other.
      </p>

      <CodeBlock language="java" title="StartVsRun.java">
{`public class StartVsRun {
    public static void main(String[] args) throws InterruptedException {
        Runnable job = () -> System.out.println("  job ran on: " + Thread.currentThread().getName());

        System.out.println("calling run():");
        new Thread(job, "worker-1").run();      // NOT a new thread

        System.out.println("calling start():");
        Thread t = new Thread(job, "worker-2");
        t.start();                              // a real new thread
        t.join();                               // wait for it to finish

        System.out.println("main thread is: " + Thread.currentThread().getName());
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1">
{`calling run():
  job ran on: main
calling start():
  job ran on: worker-2
main thread is: main`}
      </CodeBlock>

      <p>
        The thread name in the output is the proof. Under <code>run()</code> the job printed{' '}
        <code>main</code>: the <code>Thread</code> object was created and then ignored, and the
        work happened inline. Under <code>start()</code> it printed <code>worker-2</code>,
        because the JVM asked the OS for a thread and ran the body there. A code reviewer
        cannot catch this by reading types — both calls return <code>void</code> — so it is
        worth burning in now: <strong><code>start()</code> is the only thing that starts a
        thread.</strong>
      </p>
      <p>
        <code>join()</code> is the other half. Calling <code>t.join()</code> blocks the
        calling thread until <code>t</code> finishes. Without it, <code>main</code> would race
        ahead and probably print its line first. Threads do not return values and do not
        propagate exceptions to whoever started them, so <code>join()</code> plus a shared
        field is the only way raw threads can hand anything back — which is clumsy enough
        that it motivates the entire next lesson.
      </p>

      <h2>Daemon Threads: Who Keeps the JVM Alive</h2>
      <p>
        The JVM exits when the last <em>non-daemon</em> thread finishes — not when{' '}
        <code>main</code> returns. A thread you start is non-daemon by default, so a stray
        worker will hold the whole process open. Marking it a daemon flips that: the JVM will
        shut down and take the thread with it.
      </p>

      <CodeBlock language="java" title="Daemon.java">
{`Thread housekeeping = new Thread(() -> {
    while (true) {
        System.out.println("  housekeeping tick");
        try { Thread.sleep(200); } catch (InterruptedException e) { return; }
    }
}, "housekeeping");
housekeeping.setDaemon(true);          // must be set BEFORE start()
housekeeping.start();

Thread.sleep(500);
System.out.println("main returning; JVM will exit even though housekeeping loops forever");`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1">
{`  housekeeping tick
  housekeeping tick
  housekeeping tick
main returning; JVM will exit even though housekeeping loops forever
[JVM exited on its own, code 0]`}
      </CodeBlock>

      <p>
        Drop the <code>setDaemon(true)</code> line and that same program never exits — the
        infinite loop is a non-daemon thread, so the JVM waits for it forever. This is the
        mechanism behind a class of &ldquo;my service will not stop in CI&rdquo; reports, and
        you will meet it again in the next lesson, where thread pools create non-daemon
        threads for you.
      </p>

      <h2>The Bug That Makes Concurrency Different</h2>
      <p>
        Here is a program with no exceptions, no I/O, no library calls, and no obvious
        mistake. Two threads each add one to a shared counter a hundred thousand times. The
        answer is arithmetically certain: 200,000.
      </p>

      <CodeBlock language="java" title="Race.java">
{`public class Race {
    static int count = 0;                 // plain int, shared, no protection

    public static void main(String[] args) throws InterruptedException {
        Thread a = new Thread(() -> { for (int i = 0; i < 100_000; i++) count++; });
        Thread b = new Thread(() -> { for (int i = 0; i < 100_000; i++) count++; });
        a.start(); b.start();
        a.join();  b.join();
        System.out.println("expected 200000, got " + count);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1 — five consecutive runs">
{`expected 200000, got 151518
expected 200000, got 182158
expected 200000, got 116489
expected 200000, got 138312
expected 200000, got 135742`}
      </CodeBlock>

      <p>
        Roughly a third of the increments vanished, and a different number vanished each run.
        Read that output again, because it is the whole reason concurrency gets its own
        lessons: <strong>the program is wrong, it never throws, and it gives a different wrong
        answer every time.</strong> There is no stack trace to search for and no failing
        assertion unless you wrote one. In production this shape shows up as a counter that
        drifts, a balance that is slightly off, or a cache with an entry that should not be
        there.
      </p>

      <h3>Why increments disappear</h3>
      <p>
        <code>count++</code> looks like one step because it is one token. It is three: read
        the field into a register, add one, write it back. Two threads can read the same value
        before either writes, and then both write the same result — two increments, one net
        change. That is a <strong>lost update</strong>, and it needs no exotic timing; it
        happens constantly, which is why a third of the work disappeared rather than a
        rounding error's worth.
      </p>

      <FlowChart
        title="Two threads, one lost increment"
        chart={"sequenceDiagram\nparticipant A as Thread A\nparticipant M as count in heap\nparticipant B as Thread B\nNote over M: count = 41\nA->>M: read 41\nB->>M: read 41\nA->>A: 41 + 1 = 42\nB->>B: 41 + 1 = 42\nA->>M: write 42\nB->>M: write 42\nNote over M: count = 42, not 43"}
      />

      <InfoBox variant="warning" title="&ldquo;It worked on my machine&rdquo; is expected here, not reassuring">
        <p>
          Whether the interleaving above happens depends on core count, cache behaviour, how
          long the loop body takes, and what else the machine is doing. The same code can pass
          ten thousand times on a laptop and fail within a minute on a loaded production box
          with more cores. A race condition that does not reproduce is not a race condition
          you have ruled out — it is one you cannot see yet. This is why the fix is reasoning
          about the code rather than testing until it looks fine.
        </p>
      </InfoBox>

      <h2>Fix 1: <code>synchronized</code></h2>
      <p>
        Every Java object carries a hidden lock, called its <em>monitor</em>. The{' '}
        <code>synchronized</code> keyword acquires it on entry and releases it on exit,
        including when the block exits by throwing. While one thread holds a monitor, any
        other thread that tries to enter a block synchronized on the <em>same</em> object
        waits.
      </p>
      <p>
        That turns the read-add-write trio into one indivisible step — <em>atomic</em>, in
        the sense that no other thread can observe it half-done.
      </p>

      <CodeBlock language="java" title="Three places synchronized can go">
{`// 1. A block, locking an object you choose. The most explicit form.
private static final Object LOCK = new Object();
static void bump() {
    synchronized (LOCK) { count++; }
}

// 2. An instance method: locks 'this'.
public synchronized void deposit(long amount) { balance += amount; }

// 3. A static method: locks the Class object, NOT any instance.
public static synchronized void bumpGlobal() { total++; }`}
      </CodeBlock>

      <InfoBox variant="danger" title="The lock is an object, not a line of code">
        <p>
          Two <code>synchronized</code> blocks only exclude each other if they lock the{' '}
          <em>same object</em>. This is the detail that makes broken code look correct:
        </p>
        <ul>
          <li>
            A <code>synchronized</code> instance method on two different instances locks two
            different monitors and provides no mutual exclusion at all. Guarding a{' '}
            <code>static</code> field with an instance method is therefore useless.
          </li>
          <li>
            A <code>synchronized</code> static method and a <code>synchronized</code> instance
            method in the same class lock different things — the <code>Class</code> object and
            an instance — so they run concurrently.
          </li>
          <li>
            Never lock on something another class can also lock, and never on a field you
            reassign: the lock moves out from under the thread holding it. A{' '}
            <code>private static final Object</code> you own avoids both problems. Locking a
            boxed <code>Integer</code> or an interned <code>String</code> is the classic
            version of this bug, because the JVM hands the same cached instance to unrelated
            code.
          </li>
        </ul>
      </InfoBox>

      <h2>Fix 2: An Atomic Type</h2>
      <p>
        For a single variable, a lock is heavier than you need. The{' '}
        <code>java.util.concurrent.atomic</code> classes wrap one value and expose operations
        the CPU can perform as a single uninterruptible instruction —{' '}
        <em>compare-and-swap</em>. No thread ever blocks; a thread that loses the race retries
        against the new value.
      </p>

      <CodeBlock language="java" title="Fixed.java — both fixes, same program">
{`import java.util.concurrent.atomic.AtomicInteger;

public class Fixed {
    static int plain = 0;
    static final Object LOCK = new Object();
    static final AtomicInteger atomic = new AtomicInteger();

    static void bumpSynchronized() { synchronized (LOCK) { plain++; } }

    public static void main(String[] args) throws InterruptedException {
        Thread a = new Thread(() -> { for (int i = 0; i < 100_000; i++) bumpSynchronized(); });
        Thread b = new Thread(() -> { for (int i = 0; i < 100_000; i++) bumpSynchronized(); });
        a.start(); b.start(); a.join(); b.join();
        System.out.println("synchronized: " + plain);

        Thread c = new Thread(() -> { for (int i = 0; i < 100_000; i++) atomic.incrementAndGet(); });
        Thread d = new Thread(() -> { for (int i = 0; i < 100_000; i++) atomic.incrementAndGet(); });
        c.start(); d.start(); c.join(); d.join();
        System.out.println("AtomicInteger: " + atomic.get());
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1 — three consecutive runs">
{`synchronized: 200000
AtomicInteger: 200000
synchronized: 200000
AtomicInteger: 200000
synchronized: 200000
AtomicInteger: 200000`}
      </CodeBlock>

      <p>
        Both are now exact, every run. Prefer the atomic type when the shared state is one
        number or one reference, because it says exactly what is protected and cannot be
        accidentally bypassed by code that forgets the lock. Prefer{' '}
        <code>synchronized</code> (or a <code>ReentrantLock</code>, covered two lessons on)
        when a single operation has to keep <em>two or more</em> fields consistent with each
        other — two separate atomics cannot be updated as one step.
      </p>

      <h2>Fix 3: Have Nothing to Protect</h2>
      <p>
        Both fixes above manage shared mutable state. The third option removes it, and it is
        the one that scales to real codebases, because it cannot be got wrong later by someone
        who did not read this lesson.
      </p>
      <ul>
        <li>
          <strong>Confine the state to one thread.</strong> Locals and method parameters are
          per-stack and unreachable from anywhere else. A worker that owns its own{' '}
          <code>ArrayList</code> and returns it at the end needs no synchronization.
        </li>
        <li>
          <strong>Share immutable data instead.</strong> A <code>record</code>, a{' '}
          <code>List.of(...)</code>, or a class with only <code>final</code> fields has no
          writes after construction, so there is no interleaving to protect against. This is
          the strongest practical argument for records, and why the modern-features lesson
          puts them first.
        </li>
        <li>
          <strong>Hand data off rather than sharing it.</strong> Put a message on a queue, let
          one consumer own it. The next lesson's executors work this way, and so does every
          Kafka consumer you will write.
        </li>
      </ul>

      <InfoBox variant="info" title="There is a second failure mode, and it is worse">
        <p>
          Lost updates are the <em>visible</em> half of the problem: the work interleaves
          badly. The other half is <strong>visibility</strong> — a thread writing a field and
          another thread simply never seeing the new value, because the compiler kept it in a
          register or the CPU kept it in a core-local cache. That one cannot be fixed by
          making operations atomic, needs <code>volatile</code> or a lock to establish an
          ordering guarantee, and has a verified demo in the{' '}
          <strong>Modern Concurrency</strong> lesson under the Java Memory Model. Know that it
          exists before you write your first <code>boolean running</code> shutdown flag,
          because that flag is the exact shape that breaks.
        </p>
      </InfoBox>

      <h2>Stopping a Thread: Interruption</h2>
      <p>
        There is no safe way to kill a thread. <code>Thread.stop()</code> existed and was
        deprecated for roughly two decades, because throwing an exception into a thread at an
        arbitrary instruction can leave objects half-updated while releasing the locks that
        were protecting them — the result is corrupt state with no error anywhere. It was then
        degraded to throw <code>UnsupportedOperationException</code>, and has since been
        removed from the API entirely. On a current JDK the call does not even compile:
      </p>

      <CodeBlock language="text" title="Real javac output on java 26.0.1">
{`StopTest.java:6: error: cannot find symbol
        try { t.stop(); } catch (Throwable e) { ... }
               ^
  symbol:   method stop()
  location: variable t of type Thread
1 error`}
      </CodeBlock>

      <p>
        So cancellation in Java is <strong>cooperative</strong>: you ask, and the thread is
        responsible for noticing. That is not a limitation to work around — it is the only
        design under which a thread can stop at a point where its own invariants hold.
      </p>
      <p>
        <code>t.interrupt()</code> sets that flag. A thread blocked in{' '}
        <code>sleep()</code>, <code>wait()</code>, <code>join()</code>, or most blocking queue
        operations wakes immediately with an <code>InterruptedException</code>. A thread busy
        computing sees nothing until it checks <code>Thread.currentThread().isInterrupted()</code>{' '}
        itself.
      </p>

      <CodeBlock language="java" title="Interrupts.java">
{`Thread worker = new Thread(() -> {
    try {
        while (true) {
            System.out.println("  working...");
            Thread.sleep(200);
        }
    } catch (InterruptedException e) {
        // Interrupted while sleeping: the flag was CLEARED by sleep() throwing.
        System.out.println("  interrupted; flag is now " + Thread.currentThread().isInterrupted());
        Thread.currentThread().interrupt();          // restore it
        System.out.println("  flag restored to " + Thread.currentThread().isInterrupted());
    }
    System.out.println("  worker exiting cleanly");
}, "worker");

worker.start();
Thread.sleep(500);
System.out.println("main: calling worker.interrupt()");
worker.interrupt();
worker.join();
System.out.println("main: worker is " + worker.getState());`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1">
{`  working...
  working...
  working...
main: calling worker.interrupt()
  interrupted; flag is now false
  flag restored to true
  worker exiting cleanly
main: worker is TERMINATED`}
      </CodeBlock>

      <p>
        Look at the two middle lines, because they explain a rule that otherwise sounds like
        superstition. When <code>sleep()</code> threw, it <em>cleared</em> the interrupt flag —
        so inside the <code>catch</code> block, <code>isInterrupted()</code> reported{' '}
        <code>false</code>. The thread had been asked to stop and no longer had any record of
        it.
      </p>

      <InfoBox variant="danger" title="Why swallowing InterruptedException is a real bug">
        <p>
          This is the single most common concurrency mistake in business code, and now you can
          see what it costs:
        </p>
        <CodeBlock language="java" title="The empty catch block">
{`try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    // ignore  <-- the cancellation request is now gone forever
}`}
        </CodeBlock>
        <p>
          The flag was cleared by the throw and the catch discarded the exception, so no code
          further up the stack can ever learn that someone asked this thread to stop. A graceful
          shutdown then hangs until something kills the process. Do one of two things, always:
          let <code>InterruptedException</code> propagate by declaring it on your method, or —
          if you cannot, usually because you are implementing <code>Runnable.run()</code>,
          which declares no checked exceptions — call{' '}
          <code>Thread.currentThread().interrupt()</code> to put the flag back, as the demo
          does, and then return.
        </p>
      </InfoBox>

      <h2>Thread States</h2>
      <p>
        <code>Thread.getState()</code> returns one of six values, and the same names appear in
        every thread dump you will ever read — so this is less trivia than it looks. When a
        production JVM is wedged, the fix usually starts with &ldquo;which state are the
        threads in?&rdquo;
      </p>

      <FlowChart
        title="The six thread states"
        chart={"stateDiagram-v2\n[*] --> NEW: constructed\nNEW --> RUNNABLE: start\nRUNNABLE --> BLOCKED: waiting for a monitor\nBLOCKED --> RUNNABLE: lock acquired\nRUNNABLE --> WAITING: wait or join with no timeout\nWAITING --> RUNNABLE: notify or target finished\nRUNNABLE --> TIMED_WAITING: sleep or timed wait\nTIMED_WAITING --> RUNNABLE: timeout or notify\nRUNNABLE --> TERMINATED: run returned or threw\nTERMINATED --> [*]"}
      />

      <CodeBlock language="text" title="How to read them in a thread dump">
{`NEW             created, start() not called yet. A thread you can still configure.
RUNNABLE        eligible to run. NOTE: also covers blocked-in-native-I/O, so a
                RUNNABLE thread is not necessarily burning CPU.
BLOCKED         waiting to acquire a monitor someone else holds. Many threads
                BLOCKED on the same lock = a contention bottleneck.
WAITING         parked indefinitely in wait(), join(), or park(). Needs another
                thread to act. Many threads WAITING forever = a likely deadlock.
TIMED_WAITING   same, but with a deadline: sleep(), wait(ms), poll(timeout).
TERMINATED      run() has returned or thrown. A Thread cannot be restarted;
                calling start() again throws IllegalThreadStateException.`}
      </CodeBlock>

      <p>
        Note what the last line rules out: a <code>Thread</code> object is single-use. Every
        task needs a brand new one — which brings us to why you will almost never write{' '}
        <code>new Thread</code> again.
      </p>

      <h2>Why Raw Threads Do Not Survive Contact With Real Work</h2>
      <p>
        A Java thread is not a cheap object. Each one is a real OS thread with its own stack
        reserved up front (commonly 512KB to 1MB of address space), and creating one is a
        system call. Here is the cost of ten thousand empty tasks, done both ways:
      </p>

      <CodeBlock language="java" title="PoolCost.java">
{`static final int N = 10_000;

// Way 1: one new Thread per task
Thread[] ts = new Thread[N];
for (int i = 0; i < N; i++) ts[i] = new Thread(() -> {});
for (Thread t : ts) t.start();
for (Thread t : ts) t.join();

// Way 2: hand the same tasks to a pool of 8 reusable threads
try (ExecutorService pool = Executors.newFixedThreadPool(8)) {
    for (int i = 0; i < N; i++) pool.submit(() -> {});
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output on java 26.0.1 — three consecutive runs">
{`10000 empty tasks
  one new Thread each: 252 ms
  fixed pool of 8:     14 ms

10000 empty tasks
  one new Thread each: 257 ms
  fixed pool of 8:     12 ms

10000 empty tasks
  one new Thread each: 254 ms
  fixed pool of 8:     12 ms`}
      </CodeBlock>

      <p>
        About twenty times slower, and the tasks did nothing at all — every millisecond of
        that 254 is pure thread creation and teardown. Scale the count up instead of the work
        and it stops being a performance question: tens of thousands of simultaneous platform
        threads exhaust memory and the program dies with{' '}
        <code>OutOfMemoryError: unable to create native thread</code>.
      </p>
      <p>
        Cost is only half of it. Raw <code>Thread</code> also gives you no way to return a
        value, no way to see an exception (a thread that throws prints to stderr and dies —
        nobody is notified), no limit on how many you create, and no lifecycle to shut down.
        Every one of those gaps is filled by the same API, which is the subject of the next
        lesson.
      </p>

      <h2>What to Carry Forward</h2>
      <InfoBox variant="success" title="The five things that matter from this lesson">
        <ul>
          <li>
            <strong>Threads share the heap and nothing else.</strong> Locals are safe by
            construction; fields and statics are the risk surface.
          </li>
          <li>
            <strong><code>start()</code>, never <code>run()</code>.</strong> Both compile;
            only one is concurrent.
          </li>
          <li>
            <strong>Unprotected shared mutable state silently loses work.</strong> Not an
            exception, not a crash — a wrong number that differs every run.
          </li>
          <li>
            <strong>Pick the smallest fix that holds:</strong> no sharing &gt; immutable
            sharing &gt; one atomic &gt; a lock. Reach for a lock when several fields must
            change together.
          </li>
          <li>
            <strong>Never swallow <code>InterruptedException</code>.</strong> Propagate it, or
            restore the flag with <code>Thread.currentThread().interrupt()</code>.
          </li>
        </ul>
      </InfoBox>

      <h2>Where This Leads</h2>
      <p>
        You now know what a thread is and what breaks when two of them share a field. What you
        do not have is a sane way to run work on them: no result values, no error reporting,
        no bound on concurrency, no shutdown. The next lesson, <strong>Executors &amp; Thread
        Pools</strong>, is the API that supplies all four, and it is the one you will see in
        every Spring service you open — <code>@Async</code>, <code>@Scheduled</code>, and the
        servlet container's request handling are all thread pools underneath. After that,{' '}
        <strong>Modern Concurrency</strong> revisits all of it with virtual threads, where the
        cost numbers above change completely but the lost-update bug does not.
      </p>
    </LessonLayout>
  );
}
