import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Goroutines() {
  return (
    <LessonLayout
      title="Goroutines: Beyond the Event Loop"
      sectionId="go"
      lessonIndex={9}
      prev={{ path: '/go/generics', label: 'Generics' }}
      next={{ path: '/go/channels', label: 'Channels & select' }}
    >
      <p>
        This is the lesson where your existing instincts stop helping and start hurting. Everything
        up to here — <a href="/go/syntax">syntax</a>, <a href="/go/pointers">value semantics</a>,{' '}
        <a href="/go/structs">structs</a>, <a href="/go/interfaces">interfaces</a>,{' '}
        <a href="/go/slices">slices</a>, <a href="/go/generics">generics</a> — transfers reasonably
        well from TypeScript or Java. Concurrency does not. If you have spent years in Node, three
        assumptions are so deeply wired that you no longer notice you are making them:
      </p>
      <ol>
        <li>There is <strong>one thread</strong>, so shared mutable state is never a race.</li>
        <li><strong>Blocking is a sin</strong>, because blocking stops the world.</li>
        <li>Concurrent work produces a <strong>handle</strong> — a promise you await.</li>
      </ol>
      <p>
        In Go, all three are false. Goroutines run genuinely in parallel across multiple OS threads,
        so a plain <code>counter++</code> from two goroutines will corrupt your data. Blocking is
        cheap, idiomatic, and the recommended default. And <code>go f()</code> returns{' '}
        <em>nothing</em> — there is no handle, no promise, no future, no join. That third one is
        usually the first real shock.
      </p>

      <InfoBox variant="danger" title="The one-sentence version">
        <p>
          Node gave you concurrency <em>without</em> parallelism, so you got safety for free and
          paid for it with the no-blocking rule. Go gives you concurrency <em>with</em> parallelism,
          so you get blocking for free and pay for it with real data races.
        </p>
      </InfoBox>

      <h2>What a Goroutine Actually Is</h2>

      <p>
        A goroutine is a function executing independently, with its own stack, scheduled by the Go
        runtime rather than by the OS. It starts with a stack of a couple of kilobytes that grows
        and shrinks on demand, and the runtime multiplexes many goroutines onto a small pool of
        real OS threads.
      </p>

      <p>
        That last clause is the whole design. Compare the three models you already have in your
        head:
      </p>

      <FlowChart
        title="Three concurrency models, side by side"
        chart={"graph TD\n  subgraph NODE[\"Node.js - one thread, cooperative\"]\n    N1[\"Task A await\"] --> NQ[\"Microtask / event queue\"]\n    N2[\"Task B await\"] --> NQ\n    N3[\"Task C await\"] --> NQ\n    NQ --> NT[\"THE single JS thread\"]\n    NT -->|\"any blocking call here\"| NX[\"Whole process stalls\"]\n  end\n  subgraph JAVA[\"Java platform threads - 1:1 with the OS\"]\n    J1[\"Thread 1 - ~1 MB stack\"] --> JK[\"OS scheduler\"]\n    J2[\"Thread 2 - ~1 MB stack\"] --> JK\n    J3[\"Thread N - ~1 MB stack\"] --> JK\n    JK --> JC[\"CPU cores\"]\n    JK -->|\"N in the thousands\"| JX[\"OutOfMemoryError\"]\n  end\n  subgraph GO[\"Go goroutines - M:N, runtime scheduled\"]\n    G1[\"goroutine 1 - 2 KB stack\"] --> GS[\"Go runtime scheduler\"]\n    G2[\"goroutine 2 - 2 KB stack\"] --> GS\n    G3[\"goroutine 100000 - 2 KB stack\"] --> GS\n    GS --> GT[\"GOMAXPROCS OS threads\"]\n    GT --> GC[\"CPU cores - genuinely parallel\"]\n  end"}
      />

      <p>
        The Go scheduler&apos;s internals are usually described with three letters, and they are
        worth knowing because the vocabulary shows up in every profiling tool and stack dump you
        will ever read:
      </p>

      <CodeBlock language="text" title="G, M, P">
{`G  goroutine  — your work. A stack, a program counter, and some state.
               Cheap: create and discard them freely.

M  machine    — a real OS thread. Expensive. The runtime creates these
               lazily and reuses them.

P  processor  — a scheduling context: a run queue of Gs plus the right to
               execute them. The number of Ps is GOMAXPROCS.

To run code, an M must hold a P. A P runs one G at a time and pulls the
next G from its local run queue (or steals from another P's queue, or
takes from the global queue).`}
      </CodeBlock>

      <FlowChart
        title="M:N multiplexing — thousands of Gs over GOMAXPROCS Ps"
        chart={"graph LR\n  RQ1[\"P1 local run queue<br/>G G G G\"] --> P1[\"P1\"]\n  RQ2[\"P2 local run queue<br/>G G G\"] --> P2[\"P2\"]\n  GQ[\"Global run queue<br/>overflow + new Gs\"] -.->|\"refill when local is empty\"| P1\n  GQ -.-> P2\n  RQ2 -.->|\"work stealing when P1 runs dry\"| P1\n  P1 --> M1[\"M1 - OS thread\"]\n  P2 --> M2[\"M2 - OS thread\"]\n  M1 --> CPU[\"CPU cores\"]\n  M2 --> CPU"}
      />

      <h2>Launching One: <code>go f()</code></h2>

      <p>
        The syntax is a single keyword in front of a call. Any call.
      </p>

      <CodeBlock language="go" title="Every shape of go statement">
{`// 1. A named function
go process(order)

// 2. A method call — the receiver is evaluated NOW, on the calling goroutine
go svc.Handle(req)

// 3. An anonymous function, which is what you will write most often
go func() {
    result := expensiveThing()
    save(result)
}()                      // note the trailing () — you are CALLING it

// 4. With arguments. Arguments are evaluated immediately, in the caller,
//    and copied into the new goroutine. Only the call itself is deferred.
go func(id int, name string) {
    log.Printf("%d %s", id, name)
}(order.ID, order.Name)

// 5. A closure over the surrounding scope. Legal, extremely common, and
//    the source of most concurrency bugs in Go — see the sync lesson.
total := 0
go func() { total++ }()  // DATA RACE, and the compiler will not stop you`}
      </CodeBlock>

      <InfoBox variant="warning" title="There is no handle. None.">
        <p>
          <code>go f()</code> is a <em>statement</em>, not an expression. It evaluates to nothing.
          You cannot assign it, you cannot await it, and a value the goroutine returns is silently
          discarded — <code>go doThing()</code> compiles fine even when{' '}
          <code>doThing() (Result, error)</code> returns an error you will never see.
        </p>
        <p>
          Coming from <code>const p = doThing()</code> in JavaScript or{' '}
          <code>Future&lt;T&gt; f = executor.submit(...)</code> in Java, this feels like something
          was taken away. It was, deliberately: coordination is a separate concern, handled
          explicitly by <a href="/go/channels">channels</a>,{' '}
          <a href="/go/sync">sync.WaitGroup</a>, or <code>errgroup</code>. One mechanism per job,
          none of them bolted onto the launch syntax.
        </p>
      </InfoBox>

      <h2><code>main</code> Returning Kills Everything</h2>

      <p>
        There is no &quot;wait for outstanding work&quot; phase at the end of a Go program. When{' '}
        <code>main</code> returns, the process exits and every other goroutine is terminated
        mid-instruction. No unwinding, no <code>defer</code>s, no cleanup.
      </p>

      <CodeBlock language="go" title="main.go — the classic first surprise">
{`package main

import "fmt"

func main() {
    go fmt.Println("from the goroutine")
    fmt.Println("from main")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5 darwin/arm64">
{`from main`}
      </CodeBlock>

      <p>
        The goroutine line is simply gone. <code>main</code> printed and returned before the
        scheduler ever got around to running the new goroutine. And because this is a race against
        the scheduler, it is not <em>reliably</em> gone — which is far worse than if it were:
      </p>

      <CodeBlock language="text" title="Measured, same machine, same binary">
{`Compiled binary, 50 runs:   the goroutine line printed 0 times.
Via 'go run', 160 runs:     the goroutine line printed 2 times.

So: usually absent, occasionally present. A test that asserts on this
passes 99% of the time.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Do not fix this with time.Sleep">
        <p>
          The reflex is <code>time.Sleep(100 * time.Millisecond)</code> at the end of{' '}
          <code>main</code>. It makes the output appear, which makes it feel solved. It is not: you
          have replaced a race with a slower race, and under load the sleep is too short. Use{' '}
          <a href="/go/sync"><code>sync.WaitGroup</code></a> for &quot;wait for N things to
          finish&quot; or a <a href="/go/channels">channel</a> for &quot;wait for a result&quot;.
          Every <code>time.Sleep</code> in production Go that is synchronising something is a bug
          waiting for a busy day.
        </p>
      </InfoBox>

      <h3>A panic in one goroutine kills the whole process</h3>

      <p>
        The flip side of &quot;no handle&quot; is &quot;no error channel back to the parent&quot;.
        An unrecovered panic in <em>any</em> goroutine takes the process down, and the launching
        goroutine&apos;s <code>recover()</code> cannot help — <code>recover</code> only works in
        the panicking goroutine&apos;s own stack.
      </p>

      <CodeBlock language="go" title="main.go — recover() in main does not protect a goroutine">
{`func main() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("main recovered:", r)    // never printed
        }
    }()

    go func() {
        panic("boom in a goroutine")
    }()

    time.Sleep(100 * time.Millisecond)
    fmt.Println("main finished normally")       // never printed
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, exit status 2">
{`panic: boom in a goroutine

goroutine 19 [running]:
main.main.func2()
	/.../p06/main.go:16 +0x2c
created by main.main in goroutine 1
	/.../p06/main.go:15 +0x40
exit status 2`}
      </CodeBlock>

      <p>
        Note <code>created by main.main in goroutine 1</code>. Go tracebacks tell you who launched
        the goroutine that died, which is the single most useful line in a production Go crash. The
        practical rule: <strong>any goroutine that runs untrusted or failure-prone work needs its
        own <code>defer recover()</code> at its top.</strong> That is the Go equivalent of wrapping
        an async task body in <code>try/catch</code> so one bad request does not take down the
        server.
      </p>

      <CodeBlock language="go" title="The per-goroutine safety net">
{`func safeGo(name string, f func()) {
    go func() {
        defer func() {
            if r := recover(); r != nil {
                log.Printf("goroutine %s panicked: %v\\n%s", name, r, debug.Stack())
            }
        }()
        f()
    }()
}`}
      </CodeBlock>

      <h2>Concurrency vs Parallelism, and <code>GOMAXPROCS</code></h2>

      <p>
        Rob Pike&apos;s formulation: <em>concurrency is about dealing with many things at once;
        parallelism is about doing many things at once.</em> Concurrency is a property of your
        program&apos;s structure. Parallelism is a property of the machine it runs on.
      </p>
      <p>
        Node gives you the first and not the second. Go gives you both, and the knob that controls
        how much of the second you get is <code>GOMAXPROCS</code>: the number of Ps, i.e. the
        maximum number of goroutines running <em>simultaneously</em>. You can read it, set it from
        the environment, or set it from code.
      </p>

      <CodeBlock language="go" title="main.go — CPU-bound work, 8 tasks">
{`var sink atomic.Uint64

// Serial, data-dependent arithmetic the compiler cannot vectorise away.
func burn(n int) uint64 {
    var x uint64 = 1
    for i := 0; i < n; i++ {
        x = x*6364136223846793005 + 1442695040888963407
        x ^= x >> 33
    }
    return x
}

func main() {
    const tasks, iters = 8, 300_000_000
    start := time.Now()
    var wg sync.WaitGroup
    for i := 0; i < tasks; i++ {
        wg.Add(1)
        go func() { defer wg.Done(); sink.Add(burn(iters)) }()
    }
    wg.Wait()
    fmt.Printf("GOMAXPROCS=%-2d  %d CPU-bound tasks took %v\\n",
        runtime.GOMAXPROCS(0), tasks, time.Since(start).Round(10*time.Millisecond))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, Apple silicon, 14 logical CPUs">
{`$ for g in 1 2 4 8 14; do GOMAXPROCS=$g ./bench; done
GOMAXPROCS=1   8 CPU-bound tasks took 3.54s
GOMAXPROCS=2   8 CPU-bound tasks took 1.87s
GOMAXPROCS=4   8 CPU-bound tasks took 950ms
GOMAXPROCS=8   8 CPU-bound tasks took 510ms
GOMAXPROCS=14  8 CPU-bound tasks took 520ms`}
      </CodeBlock>

      <p>
        Near-linear to 8, then flat — because there are only 8 tasks, so Ps 9 through 14 have
        nothing to do. The identical source code was concurrent in all five runs and parallel in
        four of them. <strong>Concurrency is what you wrote; parallelism is what you were
        given.</strong>
      </p>
      <p>
        This is also the clearest possible answer to &quot;is my Node code actually faster if I
        promise-all it?&quot; For CPU-bound work in Node, no — one thread is one thread,{' '}
        <code>Promise.all</code> over CPU work gains you nothing without{' '}
        <code>worker_threads</code>. In Go, the same structure gets a 7x speedup for free.
      </p>

      <InfoBox variant="info" title="How GOMAXPROCS is defaulted — and why 1.25 matters">
        <p>
          Verbatim from <code>go doc runtime.GOMAXPROCS</code> on the installed{' '}
          <strong>go1.25.5</strong> toolchain:
        </p>
        <CodeBlock language="text" title="go doc runtime.GOMAXPROCS (excerpt)">
{`If the GOMAXPROCS environment variable is set to a positive whole number,
GOMAXPROCS defaults to that value.

Otherwise, the Go runtime selects an appropriate default value from a
combination of
  - the number of logical CPUs on the machine,
  - the process's CPU affinity mask,
  - and, on Linux, the process's average CPU throughput limit based on
    cgroup CPU quota, if any.

If GODEBUG=containermaxprocs=0 is set and GOMAXPROCS is not set by the
environment variable, then GOMAXPROCS instead defaults to the value of
runtime.NumCPU. Note that GODEBUG=containermaxprocs=0 is default for
language version 1.24 and below.`}
        </CodeBlock>
        <p>
          Two things matter for a backend dev. First, the cgroup-aware default is <em>new</em>: Go
          1.25 added the <code>containermaxprocs</code> and <code>updatemaxprocs</code> GODEBUG
          settings, and the old <code>NumCPU</code> behaviour is still what you get when your{' '}
          <code>go.mod</code> declares language version 1.24 or below. Before that, a Go binary in
          a container with <code>cpu: &quot;2&quot;</code> on a 64-core node would happily set
          GOMAXPROCS to 64 and get throttled into the ground — which is exactly why the{' '}
          <code>automaxprocs</code> library existed. Second, the <em>language version in your
          go.mod gates the behaviour</em>, not the toolchain you compile with. That pattern repeats
          later in this section and it catches people out.
        </p>
        <p>
          Caveat on verification: the doc text above was read from the local go1.25.5 install, and
          the GOMAXPROCS numbers in the benchmark are real. The cgroup-quota path could not be
          exercised here, because this machine is darwin/arm64 and cgroups are Linux-only.
        </p>
      </InfoBox>

      <CodeBlock language="go" title="Reading and overriding it from code">
{`runtime.NumCPU()        // logical CPUs visible at process start — never changes
runtime.GOMAXPROCS(0)   // read the current setting without changing it
runtime.GOMAXPROCS(4)   // set it to 4; returns the PREVIOUS value
runtime.SetDefaultGOMAXPROCS()  // Go 1.25+: revert to the runtime's own default
                                // (and re-enable periodic auto-updating)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, 14 logical CPUs">
{`$ ./probe
NumCPU        = 14
GOMAXPROCS(0) = 14
GOMAXPROCS(4): was 14, now 4
after SetDefaultGOMAXPROCS(): 14

$ GOMAXPROCS=3 ./probe
NumCPU        = 14
GOMAXPROCS(0) = 3
GOMAXPROCS(4): was 3, now 4
after SetDefaultGOMAXPROCS(): 14      # note: it IGNORES the env var`}
      </CodeBlock>

      <p>
        That last line is a documented detail worth remembering —{' '}
        <code>SetDefaultGOMAXPROCS</code> reverts to the <em>runtime&apos;s</em> default,
        explicitly ignoring <code>GOMAXPROCS</code> from the environment. In application code you
        should almost never call any of these; leave the default alone and let the runtime track
        the container limit.
      </p>

      <h2>Why Blocking Is Fine Here and Fatal in Node</h2>

      <p>
        This is the inversion with the biggest day-to-day impact, because it changes how you write
        every function. In Node, the no-blocking rule is not style advice — it is load-bearing,
        because there is exactly one thread and a blocking call parks it. Here is that, measured:
      </p>

      <CodeBlock language="javascript" title="blocking.mjs — four real blocking syscalls in Node">
{`import { execSync } from 'node:child_process';

// A timer that wants to fire every 100ms while this happens.
let ticks = 0;
const timer = setInterval(() => { ticks++; }, 100);

const t0 = Date.now();
for (let i = 0; i < 4; i++) {
  execSync('sleep 0.5');            // blocking: nothing else in the process runs
}
const elapsed = Date.now() - t0;
clearInterval(timer);

console.log(\`4 x 'sleep 0.5' took \${elapsed} ms\`);
console.log(\`timer ticks during those \${elapsed} ms: \${ticks} (expected ~\${Math.floor(elapsed/100)})\`);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Node v25.2.1">
{`4 x 'sleep 0.5' took 2068 ms
timer ticks during those 2068 ms: 0 (expected ~20)`}
      </CodeBlock>

      <p>
        Fully serialised, and the event loop was <em>completely dead</em> for two seconds: zero of
        twenty expected timer ticks. In a server, those twenty ticks are twenty other
        users&apos; requests.
      </p>

      <CodeBlock language="go" title="main.go — the same four blocking syscalls in Go">
{`func main() {
    var ticks atomic.Int64
    stop := make(chan struct{})
    go func() {
        t := time.NewTicker(100 * time.Millisecond)
        defer t.Stop()
        for {
            select {
            case <-t.C:  ticks.Add(1)
            case <-stop: return
            }
        }
    }()

    start := time.Now()
    var wg sync.WaitGroup
    for i := 0; i < 4; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            _ = exec.Command("sleep", "0.5").Run()   // blocking. Idiomatic.
        }()
    }
    wg.Wait()
    elapsed := time.Since(start)
    close(stop)

    fmt.Printf("4 x 'sleep 0.5' took %v\\n", elapsed.Round(time.Millisecond))
    fmt.Printf("ticker ticks during that time: %d (expected ~%d)\\n",
        ticks.Load(), elapsed.Milliseconds()/100)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5 (two consecutive runs)">
{`4 x 'sleep 0.5' took 510ms
ticker ticks during that time: 5 (expected ~5)

4 x 'sleep 0.5' took 508ms
ticker ticks during that time: 5 (expected ~5)`}
      </CodeBlock>

      <p>
        510ms instead of 2068ms, and the ticker never missed a beat. Note what the Go version does
        <em>not</em> contain: no <code>async</code>, no <code>await</code>, no callback, no
        promise. Just four ordinary blocking calls in four goroutines.
      </p>

      <h3>What actually happens when a goroutine blocks</h3>

      <p>
        &quot;Blocking is cheap&quot; is not magic, and the mechanism differs by what you block on.
        There are three cases, and knowing which one you are in is the difference between a service
        that scales and one that mysteriously grows ten thousand OS threads.
      </p>

      <FlowChart
        title="Three kinds of blocking, three different costs"
        chart={"graph TD\n  B{\"A goroutine blocks on...\"}\n  B -->|\"channel, mutex, WaitGroup, sleep\"| C1[\"Runtime parks the G in userspace\"]\n  C1 --> C2[\"P immediately runs the next G\"]\n  C2 --> C3[\"Cost: ~0 extra OS threads\"]\n  B -->|\"network / file read via the stdlib\"| D1[\"FD registered with the netpoller - epoll / kqueue\"]\n  D1 --> D2[\"G parked, P immediately runs the next G\"]\n  D2 --> D3[\"Cost: ~0 extra OS threads\"]\n  B -->|\"raw blocking syscall or cgo call\"| E1[\"M is stuck inside the kernel\"]\n  E1 --> E2[\"sysmon detaches the P after ~20us and hands it to another M\"]\n  E2 --> E3[\"Cost: ONE OS THREAD per concurrent blocked call\"]"}
      />

      <CodeBlock language="go" title="main.go — measuring each case (abridged)">
{`// The threadcreate profile counts OS threads the runtime has EVER created,
// so this number is cumulative and never goes down.
func threadsCreated() int { return pprof.Lookup("threadcreate").Count() }

// A. 300 goroutines parked on a channel
for i := 0; i < 300; i++ { go func() { <-park }() }

// B. 300 goroutines blocked on network I/O against a 500ms local server
for i := 0; i < 300; i++ { go func() { client.Get(srv.URL) }() }

// C. 300 goroutines in a genuinely blocking syscall
for i := 0; i < 300; i++ {
    go func() {
        tv := syscall.NsecToTimeval(500 * 1e6)
        _ = syscall.Select(0, nil, nil, nil, &tv)   // not netpoller-able
    }()
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, GOMAXPROCS=14">
{`  at startup                                     threads created=5    goroutines=1
  A. 300 goroutines parked on a channel          threads created=8    goroutines=301
  B. 300 goroutines blocked on network I/O       threads created=16   goroutines=1502
  C. 300 goroutines in a blocking syscall        threads created=303  goroutines=301
     after C returned (count is cumulative)      threads created=307  goroutines=1

(Second run of the same binary gave 29 instead of 16 for case B; the
 startup, A and C figures were identical. B's connection-setup work is
 timing sensitive, the others are not.)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Read that table twice">
        <ul>
          <li>
            <strong>A: 8 threads for 300 blocked goroutines.</strong> Channel and mutex blocking is
            a userspace park. It costs a few hundred bytes of bookkeeping and nothing else.
          </li>
          <li>
            <strong>B: ~16 threads for 300 in-flight HTTP requests.</strong> This is the one that
            matters for servers. Every <code>net</code> and <code>os</code> file descriptor in the
            standard library is non-blocking under the hood and registered with
            epoll/kqueue. Your code <em>looks</em> blocking; the runtime is running an event loop
            for you. This is why &quot;just block&quot; is sound advice for Go web services. (The
            1502 goroutines are the client&apos;s and the in-process test server&apos;s own
            per-connection goroutines, not just the 300 I launched.)
          </li>
          <li>
            <strong>C: 303 threads for 300 blocked syscalls.</strong> A raw syscall the netpoller
            cannot handle — or any <strong>cgo</strong> call — pins its M inside the kernel. The
            runtime hands the P to a fresh M so your other goroutines keep running, but the thread
            count tracks your concurrent-blocked-syscall count one for one. This is the real
            mechanism behind &quot;cgo-heavy Go services use a surprising number of
            threads&quot;, and <code>runtime/debug.SetMaxThreads</code> (default 10,000) is the
            ceiling you will hit.
          </li>
        </ul>
      </InfoBox>

      <h2>The Punchline: 100,000 of Them</h2>

      <p>
        Time to put a number on &quot;cheap&quot;. The benchmark launches 100,000 goroutines that
        all park on a channel, so all 100,000 are alive simultaneously, then measures.
      </p>

      <CodeBlock language="go" title="main.go — 100,000 live goroutines">
{`const N = 100_000

func main() {
    var m0, m1 runtime.MemStats
    runtime.GC()
    runtime.ReadMemStats(&m0)

    var wg sync.WaitGroup
    release := make(chan struct{})

    start := time.Now()
    for i := 0; i < N; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            <-release                     // park here so all N are alive at once
        }()
    }
    launched := time.Since(start)

    for runtime.NumGoroutine() < N {      // wait until all N are really parked
        time.Sleep(time.Millisecond)
    }
    runtime.ReadMemStats(&m1)

    fmt.Printf("goroutines launched:   %d\\n", N)
    fmt.Printf("time to launch all:    %v\\n", launched)
    fmt.Printf("runtime.NumGoroutine(): %d\\n", runtime.NumGoroutine())
    fmt.Printf("heap in use:           %.1f MB (was %.1f MB)\\n",
        float64(m1.HeapInuse)/1e6, float64(m0.HeapInuse)/1e6)
    fmt.Printf("stacks from the OS:    %.1f MB (was %.1f MB)\\n",
        float64(m1.StackSys)/1e6, float64(m0.StackSys)/1e6)
    fmt.Printf("per-goroutine stack:   ~%.0f bytes\\n",
        float64(m1.StackSys-m0.StackSys)/float64(N))
    fmt.Printf("OS threads (GOMAXPROCS=%d)\\n", runtime.GOMAXPROCS(0))

    close(release)
    wg.Wait()
    fmt.Printf("all %d joined; now %d goroutine(s)\\n", N, runtime.NumGoroutine())
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, compiled binary under /usr/bin/time -l">
{`goroutines launched:   100000
time to launch all:    102.441458ms
runtime.NumGoroutine(): 100001
heap in use:           60.5 MB (was 0.5 MB)
stacks from the OS:    205.4 MB (was 0.3 MB)
per-goroutine stack:   ~2051 bytes
OS threads (GOMAXPROCS=14)
all 100000 joined; now 1 goroutine(s)

           273186816  maximum resident set size      # 273 MB RSS`}
      </CodeBlock>

      <p>
        <strong>100,000 live goroutines: 102 ms to create, ~2 KB of stack each, 273 MB RSS
        total.</strong> 2051 bytes is not a coincidence — the runtime&apos;s minimum goroutine
        stack is 2 KB, grown by copying when a goroutine needs more. A Java thread reserves
        hundreds of kilobytes to a megabyte up front and can never shrink.
      </p>

      <h3>The same 100,000, in Java and in Node</h3>

      <p>
        A comparison is only worth printing if it was actually run, so all three of these are real
        numbers from this machine.
      </p>

      <CodeBlock language="java" title="Threads100k.java — 100,000 platform threads">
{`final int N = 100_000;
CountDownLatch release = new CountDownLatch(1);
List<Thread> live = new ArrayList<>();
int created = 0;
try {
    for (int i = 0; i < N; i++) {
        Thread t = new Thread(() -> {
            try { release.await(); } catch (InterruptedException e) {}
        });
        t.start();
        live.add(t);
        created++;
    }
} catch (Throwable e) {
    System.out.println("DIED after creating " + created + " platform threads: " + e);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — java 26.0.1, same machine">
{`DIED after creating 12255 platform threads: java.lang.OutOfMemoryError:
  unable to create native thread: possibly out of memory or process/resource
  limits reached
created 12255 platform threads in 1558 ms

           967344128  maximum resident set size      # 967 MB RSS`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same program with Thread.startVirtualThread">
{`created 100000 virtual threads in 93 ms

           233832448  maximum resident set size      # 234 MB RSS`}
      </CodeBlock>

      <CodeBlock language="javascript" title="promises.mjs — 100,000 pending promises">
{`const N = 100_000;
const resolvers = [];
const ps = [];
for (let i = 0; i < N; i++) {
  ps.push(new Promise((res) => resolvers.push(res)));
}
// ... then resolve them all and await Promise.all(ps)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Node v25.2.1">
{`created 100000 pending promises in 9 ms
all settled; rss = 121 MB`}
      </CodeBlock>

      <CodeBlock language="text" title="All four, side by side">
{`                                    created       time     peak RSS   per unit
Go 1.25.5   100k goroutines         100,000      102 ms     273 MB    1.0 us / 2.7 KB
Java 26     100k platform threads    12,255 *   1558 ms     967 MB    127 us / 79 KB
Java 26     100k virtual threads    100,000       93 ms     234 MB    0.9 us / 2.3 KB
Node 25.2   100k pending promises   100,000        9 ms     121 MB    0.1 us / 1.2 KB

* OutOfMemoryError: unable to create native thread. It never reached 100k.
  "per unit" is this table's own figures divided by the count actually
  created, so the platform-thread row is per-thread-that-got-made.`}
      </CodeBlock>

      <InfoBox variant="note" title="The honest reading of that table">
        <p>
          <strong>Versus Java platform threads, goroutines win outright.</strong> The JVM could not
          even create the hundred thousand; it died at 12,255 after a second and a half and a
          gigabyte. That is the comparison that justifies &quot;goroutines are not threads&quot;,
          and it is why Java&apos;s thread-pool sizing intuition is wrong here by three orders of
          magnitude. A Java <code>ExecutorService</code> is sized to core count because threads are
          scarce; a goroutine is scarce the way a struct is scarce. Launching one per request, per
          connection, per item is normal, expected Go.
        </p>
        <p>
          <strong>Versus Java virtual threads it is a tie</strong> — 93 ms / 234 MB against 102 ms
          / 273 MB. Project Loom brought the JVM to essentially the same model. If you have read
          the <a href="/java/concurrency">Java Modern Concurrency lesson</a>, a goroutine is very close to
          a virtual thread: userspace-scheduled, cheap, blocking-friendly, one per task. The
          difference is maturity of the surroundings. Go has had this model since 2009, so{' '}
          <em>every</em> standard library call, every database driver, and every HTTP client is
          already written for it. On the JVM you are still checking whether a given library pins a
          carrier thread.
        </p>
        <p>
          <strong>Versus promises, the table is measuring the wrong thing on purpose.</strong>{' '}
          100,000 promises in 9 ms and 121 MB beat goroutines on both axes — because a promise is
          not an execution context. It has no stack, no program counter, and cannot run code or
          block; it is a callback registration with a result slot. Of course it is cheaper. The
          number you cannot get from the promise column is the one that matters: 100,000 promises
          cannot have 100,000 half-finished call stacks suspended inside them. 100,000 goroutines
          can, which is what lets you write the straight-line blocking code in the first place.
          Comparing them is comparing a <code>Promise</code> to a thread, not a slow thing to a
          fast thing.
        </p>
      </InfoBox>

      <h2>What Transfers, and What Does Not</h2>

      <CodeBlock language="text" title="Translating your existing instincts">
{`Node instinct                        In Go
-----------------------------------  -------------------------------------------
async function / await               Just write the blocking call.
Promise.all([a, b, c])               errgroup, or a WaitGroup + a results slice.
Promise handle to await later        Nothing. Use a channel if you need a result.
"never block the event loop"         Blocking is fine. Prefer it.
worker_threads for CPU work          Plain goroutines; GOMAXPROCS handles it.
AbortController                      context.Context  (see the context lesson)
Unhandled rejection crashes          Unrecovered panic crashes. Same severity,
                                     but recover() must be IN that goroutine.
One thread => no locks needed        FALSE. You need mutexes or atomics now.

Java instinct                        In Go
-----------------------------------  -------------------------------------------
new Thread(...)                      go f()  — measured below: 124x faster
                                     to create, 29x less memory each
Executors.newFixedThreadPool(N)      Usually nothing. Bound with a semaphore
                                     channel only when a DOWNSTREAM needs it.
Pool sized to availableProcessors()  Wrong unit. Size to the resource you are
                                     protecting, not to core count.
Future<T> / CompletableFuture        Channel, or errgroup for fork-join.
Thread.join()                        sync.WaitGroup.Wait()
synchronized                         sync.Mutex  (explicit Lock/Unlock)
volatile                             sync/atomic types
ThreadLocal                          Nothing equivalent. Pass a context.
InterruptedException / interrupt()   ctx.Done() — cooperative, never preemptive
Virtual threads (Java 21+)           The closest match. Nearly identical model.`}
      </CodeBlock>

      <InfoBox variant="warning" title="The sizing mistake, specifically">
        <p>
          The most common thing a Java developer writes in their first month of Go is a worker pool
          of <code>runtime.NumCPU()</code> goroutines to handle incoming work. It is not wrong so
          much as beside the point. You bound concurrency in Go for exactly one reason: because
          something <em>downstream</em> cannot take the load — a database connection pool, a
          rate-limited API, a disk. Bound it to <em>that</em> number, which has nothing to do with
          your core count, and use a <a href="/go/concurrency-patterns">semaphore channel or{' '}
          <code>errgroup.SetLimit</code></a> rather than a hand-rolled pool. For pure CPU-bound
          fan-out, <code>GOMAXPROCS</code> already is the limit; adding your own is redundant.
        </p>
      </InfoBox>

      <h2>Where to Look When It Goes Wrong</h2>

      <CodeBlock language="go" title="The four runtime calls worth memorising">
{`runtime.NumGoroutine()   // live goroutine count. Leak detection in one call.
runtime.NumCPU()         // logical CPUs seen at startup
runtime.GOMAXPROCS(0)    // current parallelism limit
runtime.Gosched()        // yield this P. You almost never need it; if you
                         // think you do, you probably want a channel.`}
      </CodeBlock>

      <CodeBlock language="bash" title="And the three commands">
{`go run -race ./...      # find data races. Use it in CI. See the sync lesson.
go vet ./...            # catches copied mutexes, bad loop captures, and more
kill -QUIT <pid>        # dump every goroutine's stack. The Go 'jstack'.`}
      </CodeBlock>

      <InfoBox variant="success" title="What you should now be able to say out loud">
        <ul>
          <li>
            A goroutine is a userspace-scheduled stack starting at 2 KB, multiplexed M:N onto{' '}
            <code>GOMAXPROCS</code> OS threads. It is not a thread and not a promise.
          </li>
          <li>
            <code>go f()</code> returns nothing. Coordination is a separate, explicit concern.
          </li>
          <li>
            <code>main</code> returning kills every goroutine instantly. Synchronise with a
            WaitGroup or a channel, never a sleep.
          </li>
          <li>
            An unrecovered panic anywhere kills the process, and <code>recover()</code> must live
            in the panicking goroutine.
          </li>
          <li>
            Concurrency is structure; parallelism is <code>GOMAXPROCS</code>. In Go you get both,
            which means you also get real data races — the subject of{' '}
            <a href="/go/sync">the sync lesson</a>.
          </li>
          <li>
            Blocking on a channel or on stdlib network I/O is free. Blocking in a raw syscall or
            cgo call costs one OS thread per concurrent call.
          </li>
        </ul>
      </InfoBox>

      <p>
        Next: the mechanism Go actually wants you to coordinate with —{' '}
        <a href="/go/channels">channels and <code>select</code></a>.
      </p>
    </LessonLayout>
  );
}
