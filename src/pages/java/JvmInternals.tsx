import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function JvmInternals() {
  return (
    <LessonLayout
      title="JVM Internals & Garbage Collection"
      sectionId="java"
      lessonIndex={11}
      prev={{ path: '/java/optional', label: 'Optional — Best & Worst Practices' }}
      next={{ path: '/java/reflection', label: 'Reflection & Annotations' }}
    >
      <p>
        Most application code never needs any of this. Then one day a service starts pausing for
        two seconds under load, or <code>-Xmx</code> gets bumped &quot;just in case&quot; without
        anyone checking whether memory was the actual problem, and suddenly you need to know what
        the heap, Metaspace, and stack actually are &mdash; not the Java 8-era diagram everyone
        half-remembers. Everything below was run against the JDK actually installed on this
        machine (<code>java 26.0.1</code>, Oracle build), because GC defaults and flag names have
        genuinely changed release to release and &quot;I read that once&quot; is how outdated
        advice spreads.
      </p>

      <h2>Where Memory Actually Lives: Heap, Metaspace, Stack</h2>
      <p>
        The JVM splits memory into a few distinct regions, and they are not interchangeable &mdash;
        each is sized, collected, and can overflow independently of the others.
      </p>
      <p>
        <strong>The heap</strong> is where every object you create with <code>new</code> lives &mdash;
        instances, arrays, boxed values that escape the JIT&apos;s ability to keep them in a
        register. It is shared across all threads and it is the only region the garbage collector
        manages. <strong>Metaspace</strong> holds class metadata &mdash; the loaded{' '}
        <code>Class</code> objects, method bytecode, constant pools &mdash; not your application
        objects. <strong>The stack</strong> is per-thread: every method call pushes a frame holding
        that call&apos;s local variables and the return address, and the frame is popped when the
        method returns. Recursion depth is bounded by stack size, not heap size, which is easy to
        verify directly rather than take on faith.
      </p>

      <CodeBlock language="java" title="StackDemo.java — proving frames (and their locals) live on the stack">
{`public class StackDemo {
    static int depth = 0;
    public static void main(String[] args) {
        try {
            recurse(1);
        } catch (StackOverflowError e) {
            System.out.println("StackOverflowError at depth " + depth);
        }
    }
    static void recurse(int n) {
        int localA = n;          // a local variable — lives in THIS frame
        long localB = n * 2L;    // another local — same frame
        depth = n;
        recurse(n + 1);
        if (localA + localB == -1) System.out.println("never"); // keep locals live
    }
}`}
      </CodeBlock>

      <p>
        Run the same class three times, changing only <code>-Xss</code> (the per-thread stack size
        flag) and nothing about the heap:
      </p>

      <CodeBlock language="text" title="Real output — depth to overflow scales with -Xss, not -Xmx">
{`$ java StackDemo                    # default -Xss
StackOverflowError at depth 22896

$ java -Xss256k StackDemo           # smaller stack -> overflows much sooner
StackOverflowError at depth 1109

$ java -Xss8m StackDemo             # bigger stack -> goes much deeper
StackOverflowError at depth 141398`}
      </CodeBlock>

      <p>
        A ~32x change in <code>-Xss</code> produced roughly a 128x change in max recursion depth,
        and the heap was never touched. That is the stack, concretely: a bounded region of frames,
        one per in-flight method call, per thread.
      </p>

      <p>
        Which flags actually control which region is not something to guess at &mdash; the JVM
        will tell you, via <code>java -X</code>:
      </p>

      <CodeBlock language="text" title="java -X — real output, the non-standard-options help text">
{`    -Xms<size>        set minimum and initial Java heap size
    -Xmx<size>        set maximum Java heap size
    -Xss<size>        set java thread stack size`}
      </CodeBlock>

      <p>
        So <code>-Xmx</code>/<code>-Xms</code> govern the heap only. They do not touch Metaspace or
        the per-thread stacks &mdash; those have their own flags (<code>-XX:MaxMetaspaceSize</code>{' '}
        and <code>-Xss</code> respectively). A service that&apos;s hitting{' '}
        <code>StackOverflowError</code> under deep recursion needs more <code>-Xss</code>, not more{' '}
        <code>-Xmx</code>; a service leaking classloaders needs Metaspace attention, not heap.
        Conflating the three is a common source of tuning a flag that can&apos;t possibly fix the
        symptom.
      </p>

      <InfoBox variant="note" title="PermGen is gone — verified, not assumed">
        <p>
          Pre-Java 8, class metadata lived in PermGen, a fixed-size region inside the heap that was
          a constant source of <code>OutOfMemoryError: PermGen space</code>. Java 8 replaced it with
          Metaspace, which allocates from native (off-heap) memory and grows dynamically by default
          instead of hitting a hard wall. On this JDK, the old flag is simply gone rather than
          silently ignored:
        </p>
        <CodeBlock language="text" title="Real output — the pre-Java-8 flag no longer exists">
{`$ java -XX:PermSize=64m -version
Unrecognized VM option 'PermSize=64m'
Error: Could not create the Java Virtual Machine.

$ java -XX:+PrintFlagsFinal -version | grep -i metaspacesize
size_t MaxMetaspaceSize    = 18446744073709551615   {product} {default}
size_t MetaspaceSize       = 22020096                {product} {default}`}
        </CodeBlock>
        <p>
          <code>MaxMetaspaceSize</code> defaulting to (effectively) unlimited is itself worth
          knowing: an unbounded classloader leak now grows native memory instead of throwing a
          heap error, which can look like a native memory leak rather than a Java one until you
          check <code>jcmd &lt;pid&gt; VM.metaspace</code>.
        </p>
      </InfoBox>

      <h2>The Young/Old Split Isn&apos;t the Fixed Ratio the Old Docs Describe</h2>
      <p>
        The heap is further divided into a young generation (where objects are born, and where
        most objects die almost immediately &mdash; the &quot;most objects are garbage young&quot;
        generational hypothesis) and an old generation (objects that survive several young
        collections get promoted, i.e. <em>tenured</em>, here). That part of the mental model still
        holds. What doesn&apos;t hold is the fixed 1:2 young:old ratio a lot of Java 8-era material
        teaches as universal &mdash; that&apos;s <code>NewRatio</code>, and it is a{' '}
        <em>Parallel/Serial GC</em> concept. G1, the default collector today, does not use it:
      </p>

      <CodeBlock language="text" title="Real output — G1's young generation is adaptive, not a static ratio">
{`$ java -XX:+PrintFlagsFinal -version | grep -iE "G1NewSizePercent|G1MaxNewSizePercent|MaxGCPauseMillis"
uint   G1MaxNewSizePercent = 60    {experimental} {default}
uint   G1NewSizePercent    = 5     {experimental} {default}
uintx  MaxGCPauseMillis    = 200   {product}      {default}`}
      </CodeBlock>

      <p>
        G1 lets the young generation float between 5% and 60% of the heap, resizing it after every
        collection to try to hit a 200ms pause-time target. Under light allocation pressure it
        shrinks the young gen; under heavy pressure it grows it (up to that 60% ceiling) to keep
        pauses near the target. There is no fixed split to memorize &mdash; it is a live control
        loop, which is also why two runs of the same program can show different young-gen sizes in
        their GC logs.
      </p>

      <h2>Which Collector Is Actually Default, Here, Now</h2>
      <p>
        &quot;G1 is the default collector&quot; is true, but it has been true since Java 9 and it
        is worth re-confirming rather than repeating from memory five major versions later:
      </p>

      <CodeBlock language="text" title="Real output — java -XX:+PrintFlagsFinal -version | grep, JDK 26.0.1">
{`bool UseEpsilonGC     = false   {experimental} {default}
bool UseG1GC          = true    {product}      {ergonomic}
bool UseParallelGC    = false   {product}      {default}
bool UseSerialGC      = false   {product}      {default}
bool UseShenandoahGC  = false   {product}      {default}
bool UseZGC           = false   {product}      {default}`}
      </CodeBlock>

      <p>
        <code>{`{ergonomic}`}</code> on <code>UseG1GC</code> is the tell &mdash; every other collector
        shows <code>{`{default}`}</code>, meaning &quot;this is the compiled-in default value,&quot;
        while G1&apos;s value was chosen at startup by the JVM&apos;s ergonomics logic (based on
        available CPUs and memory) rather than hard-coded. On a small/constrained environment the
        ergonomic choice can differ. G1 remains the collector you get with no flags on typical
        server hardware, confirmed on JDK 26.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Collector</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Status on JDK 26</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Model</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>G1</strong></td>
            <td style={{ padding: '0.75rem' }}>Default (ergonomic), no flags needed</td>
            <td style={{ padding: '0.75rem' }}>Region-based (8MB regions here); mostly-STW young pauses, mostly-concurrent old-gen marking, targets a pause-time goal</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>ZGC</strong></td>
            <td style={{ padding: '0.75rem' }}>Production, not experimental &mdash; <code>-XX:+UseZGC</code> alone, no unlock flag required</td>
            <td style={{ padding: '0.75rem' }}>Region-based, generational by default (Minor/Major collections); nearly all work concurrent, STW phases measured in microseconds &mdash; verified below</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Shenandoah</strong></td>
            <td style={{ padding: '0.75rem' }}>Spec&apos;d into OpenJDK; <em>not compiled into this Oracle build</em> (see below)</td>
            <td style={{ padding: '0.75rem' }}>Concurrent, low-pause alternative to ZGC; ships in Red Hat/Eclipse Temurin builds</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Shenandoah is a build-configuration question, not a JDK-version question">
        <p>
          Passing <code>-XX:+UseShenandoahGC</code> on this machine&apos;s JDK fails outright:
        </p>
        <CodeBlock language="text" title="Real output">
{`$ java -XX:+UseShenandoahGC -version
Error occurred during initialization of VM
Option -XX:+UseShenandoahGC not supported`}
        </CodeBlock>
        <p>
          This isn&apos;t a JDK 26 removal &mdash; it&apos;s that Oracle&apos;s official OpenJDK
          builds have historically not compiled Shenandoah in, while Red Hat&apos;s builds and
          Eclipse Temurin do. If a project&apos;s runbook says &quot;use Shenandoah,&quot; check
          which JDK <em>distribution</em> is actually deployed before assuming the flag will work.
        </p>
      </InfoBox>

      <h2>A Real GC Log, Not a Diagram</h2>
      <p>
        Talking about young-generation collections abstractly is less convincing than watching
        one happen. This program allocates 2 million short-lived 8KB objects and keeps no
        reference to any of them, so they should die in the young generation almost immediately:
      </p>

      <CodeBlock language="java" title="GarbageDemo.java">
{`import java.util.ArrayList;
import java.util.List;

public class GarbageDemo {
    record Blob(byte[] data, long id) {}

    public static void main(String[] args) throws Exception {
        long total = 0;
        for (int i = 0; i < 2_000_000; i++) {
            Blob b = new Blob(new byte[8 * 1024], i);
            total += b.data().length;
        }
        System.out.println("done, total bytes allocated (approx): " + total);
    }
}`}
      </CodeBlock>

      <p>
        Run with a small heap so G1 has to collect frequently, and <code>-Xlog:gc</code> &mdash;
        the current unified-logging flag. The old <code>-XX:+PrintGCDetails</code> flag still
        parses, but it now prints a deprecation warning telling you what replaced it, rather than
        silently doing nothing:
      </p>

      <CodeBlock language="text" title="Real output — java -XX:+PrintGCDetails -version">
{`[0.002s][warning][gc] -XX:+PrintGCDetails is deprecated. Will use -Xlog:gc* instead.
[0.009s][info   ][gc     ] Using G1`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — java -Xmx64m -Xlog:gc GarbageDemo (trimmed)">
{`[0.005s][info][gc] Using G1
[0.020s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 5M->1M(10M) 0.298ms
[0.020s][info][gc] GC(1) Pause Young (Normal) (G1 Evacuation Pause) 4M->1M(10M) 0.148ms
[0.020s][info][gc] GC(2) Pause Young (Normal) (G1 Evacuation Pause) 4M->1M(30M) 0.172ms
[0.022s][info][gc] GC(3) Pause Young (Normal) (G1 Evacuation Pause) 18M->1M(30M) 0.164ms
...
[0.056s][info][gc] GC(33) Pause Young (Normal) (G1 Evacuation Pause) 38M->1M(64M) 0.092ms
[0.057s][info][gc] GC(34) Pause Young (Normal) (G1 Evacuation Pause) 38M->1M(64M) 0.096ms
...
done, total bytes allocated (approx): 16384000000`}
      </CodeBlock>

      <p>
        47 young collections ran in about 60ms of wall time for a completely unremarkable loop.
        Each line is one full stop-the-world pause: heap usage collapses from the number on the
        left (e.g. <code>38M</code>) down to almost nothing (<code>1M</code>) as every live object
        &mdash; here, essentially none &mdash; is copied out of the young regions and everything
        else is reclaimed in one shot.
      </p>

      <h2>What &quot;Stop-the-World&quot; Actually Means</h2>
      <p>
        It is not an abstract phrase &mdash; the log above <em>is</em> the evidence. During each{' '}
        <code>Pause Young</code> line, every application thread in the JVM is suspended, not just
        the thread that happened to trigger the collection. No bytecode runs, no lock is acquired,
        no request is served, for the duration printed at the end of the line (here, ~0.07&ndash;0.3ms
        each). The GC needs the object graph to hold still while it decides what&apos;s reachable
        and copies survivors, so it stops every thread rather than risk a thread mutating a
        reference mid-scan.
      </p>
      <p>
        The reason this matters in production and not just in a demo: those pause durations are
        per-thread-blocking wall-clock time added to <em>every</em> in-flight request, regardless
        of which thread was doing GC work. A 200ms G1 pause (the default pause-time target from
        earlier) shows up as 200ms of added p99 latency across the whole service simultaneously,
        which is a very different failure shape than one slow request.
      </p>

      <h2>ZGC&apos;s Sub-Millisecond Claim, Verified Rather Than Quoted</h2>
      <p>
        ZGC&apos;s pitch is sub-millisecond pauses regardless of heap size, by doing almost all
        marking and relocation work concurrently with the application and keeping only tiny,
        fixed-cost phases as actual stop-the-world pauses. That is a specific, checkable claim, so
        here it is checked &mdash; same demo program, <code>-XX:+UseZGC</code>, with the GC phase
        logging turned on:
      </p>

      <CodeBlock language="text" title="Real output — java -XX:+UseZGC -Xlog:gc,gc+phases=debug -Xmx256m GarbageDemo">
{`[0.062s][info][gc,phases] GC(0) Y: Pause Mark Start (Major) 0.016ms
[0.063s][info][gc,phases] GC(0) Y: Pause Mark End 0.003ms
[0.063s][info][gc,phases] GC(0) Y: Pause Relocate Start 0.001ms
[0.063s][info][gc,phases] GC(0) O: Pause Mark End 0.002ms
[0.063s][info][gc,phases] GC(0) O: Pause Relocate Start 0.001ms
[0.067s][info][gc,phases] GC(1) Y: Pause Mark Start (Major) 0.003ms
[0.068s][info][gc,phases] GC(1) Y: Pause Mark End 0.002ms
[0.068s][info][gc,phases] GC(1) Y: Pause Relocate Start 0.001ms`}
      </CodeBlock>

      <p>
        Every actual stop-the-world phase measured between 0.001ms and 0.016ms &mdash; genuinely
        sub-millisecond, on this JDK, on this machine, not a vendor claim taken on faith. The
        <code>Using The Z Garbage Collector</code> startup line and the <code>Minor</code>/
        <code>Major Collection</code> terminology (as opposed to a separate opt-in flag) also
        confirm ZGC now runs in <em>generational</em> mode by default here &mdash; younger objects
        are collected separately from older ones, the same generational hypothesis G1 relies on,
        which is what made ZGC&apos;s throughput competitive with G1 instead of just low-pause.
        And unlike Shenandoah above, <code>-XX:+UseZGC</code> required no unlock flag at all on
        this build &mdash; it is a fully supported, non-experimental option.
      </p>

      <h2>JFR &mdash; Built Into the JDK, No Download</h2>
      <p>
        JDK Flight Recorder was an Oracle-JDK-only commercial feature until it was open-sourced
        into OpenJDK itself (JEP 328, landing in Java 11); every JDK since ships it for free, with
        near-zero overhead when idle. Two ways to prove it needs nothing extra: start a recording
        at JVM launch, or attach to an already-running process.
      </p>

      <CodeBlock language="text" title="Real output — recording from launch, then summarizing the file">
{`$ java -XX:StartFlightRecording=filename=demo.jfr,duration=10s GarbageDemo
[0.203s][info][jfr,startup] Started recording 1. The result will be written to:
[0.203s][info][jfr,startup] /path/to/demo.jfr
done, total bytes allocated (approx): 16384000000

$ jfr summary demo.jfr
 Event Type                     Count  Size (bytes)
======================================================
 jdk.GCPhaseParallel             1644         37893
 jdk.G1HeapSummary                 20           450
 jdk.GCHeapSummary                 20           731
 jdk.G1GarbageCollection           10           111
 ...`}
      </CodeBlock>

      <p>
        And attaching to a process that&apos;s already running &mdash; no restart, no agent to
        install, just <code>jcmd</code> talking to a live JVM over its attach API:
      </p>

      <CodeBlock language="text" title="Real output — java LongRunner &, then jcmd against its PID">
{`$ java LongRunner &
started with pid 67075

$ jcmd 67075 JFR.start name=liveDemo filename=live.jfr duration=5s
67075:
Started recording 1. The result will be written to:
/path/to/live.jfr

$ jcmd 67075 JFR.check
67075:
Recording 1: name=liveDemo duration=5s (running)`}
      </CodeBlock>

      <p>
        Both commands worked with nothing installed beyond the JDK itself. In production, the{' '}
        <code>jcmd</code> path is the one worth remembering: it lets you pull a profile from a
        live, already-running service without a restart, which matters when the problem you&apos;re
        chasing only reproduces under real traffic.
      </p>

      <h2>Tiered JIT Compilation, Briefly</h2>
      <p>
        Every method starts running interpreted &mdash; slow, but with zero warm-up cost. As the
        JVM notices a method getting called often (&quot;hot&quot;), it compiles it, and it does
        so in tiers rather than jumping straight to the most aggressive optimizer: the C1
        (&quot;client&quot;) compiler produces decent machine code quickly, and C2
        (&quot;server&quot;) produces highly optimized code slowly, using profiling data gathered
        while C1&apos;s output was running. This is why a JVM process is measurably slower in its
        first seconds and speeds up under sustained load &mdash; it is progressively recompiling
        its own hot paths. The terminology is current: <code>TieredCompilation=true</code> and{' '}
        <code>TieredStopAtLevel=4</code> (level 4 is full C2) are both still the real default flag
        names and values on JDK 26, confirmed the same way as everything above, via{' '}
        <code>-XX:+PrintFlagsFinal</code>. This is also why short-lived CLI tools and compact
        source-file scripts never reach C2&apos;s best output &mdash; they finish before tiering
        gets there, which is fine, because C1-tier code is still far faster than pure
        interpretation.
      </p>

      <InfoBox variant="tip" title="When you actually need to touch any of this">
        <p>
          Almost never, for a typical Spring Boot service. Reaching for <code>-Xmx</code> tweaks,
          a collector switch, or GC flags <em>before</em> you have evidence of a problem is a
          textbook premature optimization &mdash; you are guessing at a fix for a symptom you
          haven&apos;t measured. The actual workflow: notice a real symptom (latency spikes,{' '}
          <code>OutOfMemoryError</code>, throughput falling under load), turn on{' '}
          <code>-Xlog:gc</code> or attach a profiler via JFR, and read what it says before changing
          anything. If the log shows frequent full GCs or pauses near your latency budget, you now
          have a specific, evidenced reason to raise heap, pick a different collector, or fix an
          allocation hot path &mdash; and a before/after log to prove the change helped. Tuning
          without that log is just moving flags around and hoping.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="During a G1 'Pause Young' stop-the-world collection, what is actually blocked?"
        options={[
          "Only the thread that triggered the garbage collection — other threads keep running normally",
          "Only threads currently allocating new objects; threads doing pure computation are unaffected",
          "Every application thread in the JVM is suspended for the duration of the pause, regardless of what each thread was doing",
          "Only I/O operations are paused; CPU-bound work continues uninterrupted"
        ]}
        correctIndex={2}
        explanation="Stop-the-world means exactly that: every application thread is suspended so the collector can scan and move objects without the object graph changing underneath it. It doesn't matter whether a given thread was allocating, computing, or idle — all of them stop for the pause's full duration. That's why a GC pause shows up as added latency across every concurrent request at once, not just the one 'unlucky' thread that happened to trigger the collection."
      />
    </LessonLayout>
  );
}
