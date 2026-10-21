import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

const cellStyle = { padding: '0.75rem' } as const;
const rowStyle = { borderBottom: '1px solid var(--border-color)' } as const;
const headStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  color: 'var(--accent-amber)',
};

function Intro() {
  return (
    <LessonLayout
      title="Go From a Node Backend: What Changes"
      sectionId="go"
      lessonIndex={0}
      prev={null}
      next={{ path: '/go/setup', label: 'Setup, Modules & the Toolchain' }}
    >
      <p>
        You already know how to build a backend. You know HTTP, connection pools, graceful
        shutdown, structured logs, the difference between a timeout and a deadline. None of that
        changes. So this section is not going to explain what a variable is.
      </p>
      <p>
        What it <em>is</em> going to do is point at the specific places where instincts you built
        in Node, Java, and C++ are actively wrong in Go — because Go contradicts all three, and
        the contradictions are the interesting part. The single-threaded event loop you learned to
        protect at all costs? Go has no event loop and blocking is cheap. The class hierarchy you
        reach for in Java? There are no classes and no inheritance. The manual memory discipline
        from C++? There is a garbage collector, but no VM and no runtime to install. Each of those
        is a small re-wiring, and each one is worth doing deliberately rather than discovering at
        3am.
      </p>

      <InfoBox variant="note" title="Versions, and what was actually run">
        <p>
          Go <strong>1.27.3</strong> is the current stable release. Every command and output block
          in this section was executed on this machine against the locally installed toolchain,
          which is <strong>go1.25.5 darwin/arm64</strong> (Apple M4 Pro, 14 logical CPUs) — so when
          you see an output block, that is genuinely what 1.25.5 printed, not what 1.27.3 would be
          expected to print. Where the two differ in a way that matters, it is called out. The{' '}
          <a href="/go/setup">setup lesson</a> covers how Go&apos;s toolchain-switching mechanism
          makes the gap between &quot;what I installed&quot; and &quot;what the build uses&quot;
          much less painful than it sounds.
        </p>
      </InfoBox>

      <h2>The Deploy Artifact Is One File</h2>
      <p>
        Start here, because for a Node developer this is the headline and everything else is
        detail. A Go program compiles to a single native executable with no external runtime
        dependency. Not a bundle. Not a bundle plus a runtime. One file.
      </p>

      <CodeBlock language="go" title="main.go">
{`package main

import "fmt"

func main() {
	fmt.Println("Hello from a single static binary")
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Terminal">
{`go mod init example.com/hello
go build -o hello .
ls -lh hello
./hello`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5 darwin/arm64">
{`go: creating new go.mod: module example.com/hello
go: to add module requirements and sums:
	go mod tidy
-rwxr-xr-x@ 1 you  staff   2.3M Oct  9 16:39 hello
Hello from a single static binary`}
      </CodeBlock>

      <p>
        2.3 MB, and that 2.3 MB includes the garbage collector, the goroutine scheduler, the
        runtime type information, and the parts of the standard library this program touched. There
        is no <code>node_modules</code> next to it. There is no interpreter it needs to find on the
        target machine. Copy that file to a Linux box with nothing installed on it and it runs.
      </p>

      <h3>The same thing, as a container image</h3>
      <p>
        Here is the comparison that actually lands. Two services, both exposing{' '}
        <code>GET /healthz</code> returning <code>{'{"status":"ok"}'}</code>. One in Go on the
        standard library, one in Node on Express. Both images were built and both were curled to
        confirm they work.
      </p>

      <CodeBlock language="docker" title="Dockerfile — the Go service">
{`# ---- build stage ----
FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /healthz .

# ---- runtime stage: nothing but the binary ----
FROM scratch
COPY --from=build /healthz /healthz
EXPOSE 8080
ENTRYPOINT ["/healthz"]`}
      </CodeBlock>

      <p>
        <code>FROM scratch</code> means literally an empty image. No distro, no libc, no shell, no
        package manager, no CVE surface from any of them. There is one file in that image.
      </p>

      <CodeBlock language="text" title="Real output — docker 29.1.2, both images built --platform linux/arm64">
{`$ docker images --format '{{.Repository}}:{{.Tag}}  {{.Size}}'
node-healthz:alpine  255MB
go-healthz:scratch   7.7MB

$ docker history go-healthz:scratch --format '{{.CreatedBy}}  ->  {{.Size}}'
ENTRYPOINT ["/healthz"]          ->  0B
EXPOSE [8080/tcp]                ->  0B
COPY /healthz /healthz # buildkit  ->  5.45MB

$ docker run -d --rm -p 8111:8080 go-healthz:scratch
$ curl -s -i http://localhost:8111/healthz | head -3
HTTP/1.1 200 OK
Content-Type: application/json
Date: Fri, 09 Oct 2026 21:54:12 GMT`}
      </CodeBlock>

      <FlowChart
        title="What you actually ship — measured, not estimated"
        chart={"graph TD\nA[\"your app source\"] --> N[\"Node: npm ci + node runtime\"]\nA --> G[\"Go: go build\"]\nN --> N1[\"node_modules<br/>65 packages, 3.7 MB\"]\nN --> N2[\"node binary<br/>122 MB\"]\nN1 --> N3[\"deployable image<br/>255 MB (node:24-alpine)\"]\nN2 --> N3\nG --> G1[\"one executable<br/>5.45 MB, nothing else needed\"]\nG1 --> G2[\"deployable image<br/>7.7 MB (FROM scratch)\"]\nstyle N3 fill:#3b1a1a,stroke:#f87171\nstyle G2 fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        Those numbers are all real. The Express image is <code>node:24-alpine</code> (Node
        v24.21.0 inside) plus an <code>npm install --omit=dev</code> of{' '}
        <code>express@^5.3.0</code>, which resolved to express 5.3.0 and pulled{' '}
        <strong>65 packages, 3.7 MB</strong> of <code>node_modules</code>. The Go image&apos;s one
        layer is the binary at 5,439,672 bytes. The gap is not 65 packages versus zero — it is
        mostly that Node&apos;s deploy artifact has to include Node, and Node on this machine is a
        122 MB executable before you add a single dependency.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Concern</th>
            <th style={headStyle}>Node</th>
            <th style={headStyle}>Java</th>
            <th style={headStyle}>Go</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Deploy artifact</td>
            <td style={cellStyle}>source + <code>node_modules</code> + runtime</td>
            <td style={cellStyle}>fat JAR + a JRE (or a <code>jlink</code> image)</td>
            <td style={cellStyle}>one executable</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Runtime on the target host</td>
            <td style={cellStyle}>Node, matching major version</td>
            <td style={cellStyle}>a JVM</td>
            <td style={cellStyle}>none</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Install step at deploy time</td>
            <td style={cellStyle}><code>npm ci</code></td>
            <td style={cellStyle}>none (deps are in the JAR)</td>
            <td style={cellStyle}>none</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Startup</td>
            <td style={cellStyle}>interpret + JIT warmup</td>
            <td style={cellStyle}>JVM boot + classload + JIT warmup</td>
            <td style={cellStyle}><code>exec</code>, already machine code</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Build target</td>
            <td style={cellStyle}>platform-independent source</td>
            <td style={cellStyle}>platform-independent bytecode</td>
            <td style={cellStyle}>one specific GOOS/GOARCH per build</td>
          </tr>
        </tbody>
      </table>

      <p>
        That last row is the trade. Java bought portability by shipping bytecode and requiring a
        JVM; Node bought it by shipping source and requiring an interpreter. Go pays for the
        single-file artifact by making you pick a target at build time — and then makes picking a
        target nearly free, which is the{' '}
        <a href="/go/setup">cross-compilation story in the next lesson</a>.
      </p>

      <h2>No VM, No Interpreter, No Warmup</h2>
      <p>
        Coming from Java this is the bigger shock than the file count. There is no bytecode and no
        intermediate representation that survives the build. <code>go build</code> produces machine
        code for exactly one operating system and CPU architecture, and the Go runtime — scheduler,
        garbage collector, map and channel and slice implementations — is <em>linked into your
        binary</em> as ordinary compiled code.
      </p>

      <FlowChart
        title="Go build and execution — the whole pipeline"
        chart={"graph TD\nA[\"main.go\"] --> B[\"go build\"]\nB --> C[\"machine code for one GOOS/GOARCH\"]\nC --> D[\"Go runtime linked in:<br/>scheduler, GC, map/chan/slice internals\"]\nD --> E[\"single executable\"]\nE --> F[\"exec directly:<br/>no VM, no interpreter, no JIT warmup\"]\nstyle E fill:#1a2744,stroke:#5b9cf6"}
      />

      <p>
        Practical consequences you will feel in week one:
      </p>
      <ul>
        <li>
          <strong>There is no warmup.</strong> Your first request is as fast as your ten-thousandth.
          No JIT tiering, no &quot;let it run for 30 seconds before you benchmark it.&quot; This is
          why Go is so common in serverless and CLI tools, where a JVM&apos;s startup cost is fatal.
        </li>
        <li>
          <strong>Peak throughput is usually lower than a warmed-up JVM.</strong> Be honest about
          this. HotSpot&apos;s JIT can profile your actual running code and optimize more
          aggressively than any ahead-of-time compiler. Go trades a slice of peak performance for
          predictability and startup.
        </li>
        <li>
          <strong>Compilation is fast enough to be part of your edit loop.</strong> Measured on this
          machine, for the <code>net/http</code> + <code>encoding/json</code> service used above:
        </li>
      </ul>

      <CodeBlock language="text" title="Real output — /usr/bin/time -p go build, go1.25.5">
{`$ go clean -cache          # force a full rebuild of net/http, crypto/tls, everything
$ /usr/bin/time -p go build -o /dev/null .
real 3.62
user 11.85

$ /usr/bin/time -p go build -o /dev/null .    # warm cache, no changes
real 0.37

$ touch main.go && /usr/bin/time -p go build -o /dev/null .
real 0.31`}
      </CodeBlock>

      <p>
        Note <code>user 11.85</code> against <code>real 3.62</code> on the cold build: the compiler
        parallelises across packages, so it burned 11.85 CPU-seconds in 3.62 wall-clock seconds.
        After that the build cache (<code>GOCACHE</code>) makes an incremental rebuild of a
        single-package service a third of a second.
      </p>

      <InfoBox variant="warning" title="&quot;Static binary&quot; is true on Linux and only mostly true on macOS">
        <p>
          This is the kind of thing a tutorial repeats until it becomes folklore, so it is worth
          actually checking. The Linux cross-compile really is statically linked:
        </p>
        <CodeBlock language="text" title="Real output — file(1) on a cross-compiled binary">
{`$ GOOS=linux GOARCH=amd64 go build -o hello-linux . && file hello-linux
hello-linux: ELF 64-bit LSB executable, x86-64, version 1 (SYSV),
  statically linked, BuildID[sha1]=bdf4221c..., with debug_info, not stripped`}
        </CodeBlock>
        <p>
          The native macOS build is not, and setting <code>CGO_ENABLED=0</code> does not change
          that:
        </p>
        <CodeBlock language="text" title="Real output — otool -L, with and without cgo">
{`$ go build -o hello . && otool -L hello
hello:
	/usr/lib/libSystem.B.dylib (compatibility version 0.0.0, current version 0.0.0)
	/usr/lib/libresolv.9.dylib (compatibility version 0.0.0, current version 0.0.0)

$ CGO_ENABLED=0 go build -o hello-nocgo . && otool -L hello-nocgo
hello-nocgo:
	/usr/lib/libSystem.B.dylib (compatibility version 0.0.0, current version 0.0.0)
	/usr/lib/libresolv.9.dylib (compatibility version 0.0.0, current version 0.0.0)`}
        </CodeBlock>
        <p>
          The darwin port issues system calls through <code>libSystem</code> rather than raw{' '}
          <code>syscall</code> instructions, so that dependency is unconditional. It does not matter
          in practice — <code>libSystem</code> is on every Mac — but &quot;Go always produces a fully
          static binary&quot; is not a true sentence, and it is the Linux build you are shipping
          anyway.
        </p>
      </InfoBox>

      <h2>Garbage Collected, but Nothing Like the JVM</h2>
      <p>
        Go has a GC, so the C++ instinct to track ownership is off duty. But if your mental model of
        a GC comes from the JVM — generations, survivor spaces, a choice of five collectors, a
        folder of flags — Go&apos;s is deliberately almost featureless. It is a concurrent,
        tri-color, mark-and-sweep collector that is <strong>not generational and not
        compacting</strong>, tuned for short pauses rather than peak throughput, and its public
        tuning surface is essentially one knob: <code>GOGC</code> (the percentage the heap may grow
        before the next cycle, default 100) plus <code>GOMEMLIMIT</code> for a soft ceiling.
      </p>
      <p>
        Here is a program that allocates a 2,000,000-node linked list, drops it, and asks the
        runtime what that cost:
      </p>

      <CodeBlock language="go" title="gcdemo/main.go (abridged — the reporting is runtime.MemStats)">
{`type node struct {
	payload [128]byte
	next    *node
}

func main() {
	var sink *node
	for range 2_000_000 {
		sink = &node{next: sink} // escapes, so it is genuinely heap-allocated
	}

	var peak runtime.MemStats
	runtime.ReadMemStats(&peak)

	sink = nil
	runtime.GC()

	var after runtime.MemStats
	runtime.ReadMemStats(&after)
	// ... print TotalAlloc, HeapAlloc, NumGC, PauseTotalNs, max(PauseNs) ...
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, compiled binary (not `go run`)">
{`build time:                 98ms
total allocated over run:   275 MB
heap at peak:               275 MB
heap after dropping + GC:   0.2 MB
GC cycles:                  6
total stop-the-world pause: 0.13 ms across all cycles
worst single pause:         0.052 ms`}
      </CodeBlock>

      <p>
        Six collection cycles over 275 MB of churn, and <strong>0.13 ms of stop-the-world time in
        total</strong> — worst individual pause 52 microseconds. No flags were set. That is the
        pitch: you do not tune this, and you mostly do not think about it.
      </p>

      <InfoBox variant="tip" title="A measurement trap worth knowing about">
        <p>
          The first version of that demo reported <code>GC cycles: 0</code> and 0.2 MB allocated,
          which is wrong-looking enough to be worth chasing. Two separate causes, both instructive:
        </p>
        <ul>
          <li>
            The loop body was <code>_ = &amp;node{'{}'}</code>. The pointer never escaped, so{' '}
            <strong>escape analysis</strong> put it on the stack and the heap allocation simply did
            not happen. Go does this constantly and silently; it is why &quot;taking a pointer
            allocates&quot; is not a reliable rule. <code>go build -gcflags=-m</code> will tell you
            what escaped.
          </li>
          <li>
            Running it as <code>GODEBUG=gctrace=1 go run .</code> prints GC traces for{' '}
            <em>the <code>go</code> command&apos;s own process too</em>, because the environment
            variable applies to every Go program in the pipeline — and the <code>go</code> tool is
            itself written in Go. Build the binary first, then run the binary, or you will attribute
            the compiler&apos;s garbage to your program.
          </li>
        </ul>
      </InfoBox>

      <h2>Goroutines: The Thing You Spend Your Life Avoiding in Node Is Free Here</h2>
      <p>
        This is the section that matters most, so it gets a real experiment rather than an analogy.
      </p>
      <p>
        In Node, there is one thread running your JavaScript. Blocking it is the cardinal sin,
        which is why the entire ecosystem is built around not doing it: every I/O API has a callback
        or promise form, <code>fs.readFileSync</code> exists mainly as a trap, and any CPU-bound
        work has to be exiled to a worker thread or a child process. Function colouring —{' '}
        <code>async</code> functions can only be awaited by other <code>async</code> functions — is
        downstream of that one constraint.
      </p>
      <p>
        Go deletes the constraint. There is no event loop. Every request handler runs on its own{' '}
        <strong>goroutine</strong>, and the runtime multiplexes many goroutines onto a small pool of
        OS threads. When a goroutine blocks, the scheduler parks it and runs a different one on that
        thread. So blocking code is the <em>normal</em> code, and there is no{' '}
        <code>async</code> keyword because there is nothing to mark.
      </p>

      <h3>The experiment</h3>
      <p>
        Two servers, same shape. <code>/slow</code> does two seconds of genuinely synchronous
        CPU-bound work (a tight loop, nothing that yields on purpose). <code>/fast</code> returns
        immediately. Fire one request at <code>/slow</code>, then — from an{' '}
        <strong>external</strong> client, so the measurement is not itself affected — hit{' '}
        <code>/fast</code> five times and record the latency.
      </p>

      <CodeBlock language="go" title="Go: the blocking handler">
{`func burnCPU(d time.Duration) uint64 {
	var x uint64
	deadline := time.Now().Add(d)
	for time.Now().Before(deadline) {
		for i := 0; i < 1_000_000; i++ {
			x += uint64(i)
		}
	}
	return x
}

func main() {
	http.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
		burnCPU(2 * time.Second) // no channels, no yielding, deliberately rude
		fmt.Fprintln(w, "slow done")
	})
	http.HandleFunc("/fast", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "fast done")
	})
	_ = http.ListenAndServe(":8098", nil)
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Node: the same handler">
{`function burnCPU(ms) {
  let x = 0;
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) { for (let i = 0; i < 1_000_000; i++) x += i; }
  return x;
}

http.createServer((req, res) => {
  if (req.url === '/slow') { burnCPU(2000); res.end('slow done\\n'); }
  else { res.end('fast done\\n'); }
}).listen(8099);`}
      </CodeBlock>

      <CodeBlock language="bash" title="The probe — identical against both servers">
{`curl -s -o /dev/null http://localhost:$PORT/slow &   # fire the blocking request
sleep 0.1
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "  /fast #$i: %{time_total}s\\n" http://localhost:$PORT/fast
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Node v25.2.1">
{`  /fast #1: 1.922551s
  /fast #2: 0.001070s
  /fast #3: 0.001065s
  /fast #4: 0.001048s
  /fast #5: 0.001084s`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, default GOMAXPROCS (14)">
{`  /fast #1: 0.000962s
  /fast #2: 0.000751s
  /fast #3: 0.000836s
  /fast #4: 0.000539s
  /fast #5: 0.000820s`}
      </CodeBlock>

      <p>
        A skeptic should immediately object: of course Go won, it had 14 cores and Node had one
        thread. Fair. So run Go under the same constraint —{' '}
        <code>GOMAXPROCS=1</code> allows exactly one OS thread to execute Go code at a time, which
        is as close to Node&apos;s model as Go gets:
      </p>

      <CodeBlock language="text" title="Real output — go1.25.5, GOMAXPROCS=1">
{`  /fast #1: 0.004292s
  /fast #2: 0.014877s
  /fast #3: 0.015757s
  /fast #4: 0.014839s
  /fast #5: 0.015433s`}
      </CodeBlock>

      <p>
        Degraded — 15 ms instead of 0.8 ms, because it is now genuinely sharing one thread with a
        CPU-bound goroutine — but <strong>served</strong>. Node: 1.92 seconds. Go with one thread:
        15 milliseconds. That is roughly a 125&times; difference under the same hardware constraint,
        and the reason is <strong>asynchronous preemption</strong>: since Go 1.14 the runtime can
        interrupt a goroutine that is not cooperating (via a signal, at roughly 10 ms intervals) and
        schedule something else. JavaScript has no equivalent, because a JS function that does not
        return cannot be taken off the thread.
      </p>

      <FlowChart
        title="The same blocking handler, two runtime models — measured"
        chart={"graph TD\nR[\"Request hits a handler that does<br/>2 s of synchronous CPU work\"] --> Q{\"Runtime model\"}\nQ -->|\"Node: one event loop\"| N1[\"handler runs on THE thread\"]\nN1 --> N2[\"loop cannot turn\"]\nN2 --> N3[\"every other request, timer and I/O callback waits\"]\nN3 --> N4[\"measured: unrelated /fast took 1.92 s\"]\nQ -->|\"Go: one goroutine per request\"| G1[\"handler runs on its own goroutine\"]\nG1 --> G2[\"scheduler preempts it after ~10 ms\"]\nG2 --> G3[\"other goroutines keep being scheduled\"]\nG3 --> G4[\"measured: unrelated /fast took 15 ms<br/>even with GOMAXPROCS=1\"]\nstyle N4 fill:#3b1a1a,stroke:#f87171\nstyle G4 fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="danger" title="How I nearly published a wrong number here">
        <p>
          The first version of the Node measurement used an in-process client:{' '}
          <code>fetch(&apos;/slow&apos;)</code>, then <code>await setTimeout(50)</code>, then five
          awaited <code>fetch(&apos;/fast&apos;)</code> calls, all inside the same process as the
          server. It reported <code>/fast</code> answering in <strong>1&ndash;3 ms</strong>, which
          looks like Node handling the blocking handler just fine.
        </p>
        <p>
          Adding timestamps showed what actually happened:
        </p>
        <CodeBlock language="text" title="Real output — the instrumented Node run">
{`t+   1ms listening
t+  11ms handler ENTER /slow
t+2011ms handler EXIT  /slow
t+2013ms woke from 50ms sleep     <-- a 50ms timer, fired 2 seconds late
t+2015ms /slow response received
t+2015ms handler ENTER /fast
t+2016ms /fast #1 answered in 3ms`}
        </CodeBlock>
        <p>
          The 50 ms <code>setTimeout</code> did not fire until <strong>t+2013ms</strong>. The client
          was on the same blocked event loop as the server, so it could not even{' '}
          <em>send</em> the <code>/fast</code> request during the stall, let alone time it. The
          &quot;1 ms&quot; was real and completely meaningless. Hence the external{' '}
          <code>curl</code> probe above. If you take one methodological habit from this section:
          when you benchmark a thing that blocks, never measure it from inside the thing.
        </p>
      </InfoBox>

      <h3>How cheap is a goroutine, concretely?</h3>
      <p>
        Spawn 100,000 of them, park every one on a channel receive, ask the runtime what it cost,
        then release them all:
      </p>

      <CodeBlock language="go" title="goroutines/main.go">
{`const n = 100_000

release := make(chan struct{})
var wg sync.WaitGroup
wg.Add(n)

var before runtime.MemStats
runtime.ReadMemStats(&before)

for i := 0; i < n; i++ {
	go func() {
		defer wg.Done()
		<-release                         // parked: costs no thread, no CPU
		time.Sleep(10 * time.Millisecond) // a genuinely blocking call
	}()
}

for runtime.NumGoroutine() < n+1 { // wait until all n are actually alive
	runtime.Gosched()
}

var peak runtime.MemStats
runtime.ReadMemStats(&peak)
// ... report StackInuse and HeapInuse deltas ...

start := time.Now()
close(release)
wg.Wait()
fmt.Printf("all woke + slept 10ms + exited in: %v\\n", time.Since(start).Round(time.Millisecond))`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, 14 logical CPUs (one run; the final timing varies by tens of ms between runs)">
{`goroutines alive: 100001
GOMAXPROCS:       14
stacks:           195.7 MB  (2051 bytes/goroutine)
heap:             57.1 MB   (599 bytes/goroutine)
all woke + slept 10ms + exited in: 142ms`}
      </CodeBlock>

      <p>
        <strong>2,051 bytes of stack per goroutine.</strong> That is the famous &quot;goroutines
        start with a 2 KB stack&quot; claim, measured rather than quoted. A Java platform thread
        reserves about 1 MB of stack by default and is a kernel-scheduled OS thread; 100,000 of them
        is not a thing you do. (Java&apos;s virtual threads, from Java 21, are the JVM arriving at
        the same design — if you know those, goroutines will feel familiar, with channels in place
        of structured concurrency.) The stacks grow on demand, so deep recursion still works; they
        just do not <em>start</em> big.
      </p>

      <InfoBox variant="warning" title="What is still your problem">
        <p>
          Cheap concurrency is not free correctness. Node&apos;s single thread gave you something
          real: your JavaScript could not race with itself, so shared mutable state was safe by
          construction. Go hands that guarantee back to you. Two goroutines touching the same map
          will corrupt it, and Go&apos;s own runtime will usually crash the process with{' '}
          <code>concurrent map writes</code> rather than let you continue. The{' '}
          <code>-race</code> detector exists because this is the main new class of bug you are
          taking on. Channels, <code>sync.Mutex</code>, and <code>context</code> get their own
          lessons later in this section.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="GOMAXPROCS changed in Go 1.25 — and it changed in your favour">
        <p>
          Straight from the local toolchain&apos;s own documentation (<code>go doc
          runtime.GOMAXPROCS</code> on go1.25.5), the default is now derived from
        </p>
        <CodeBlock language="text" title="Real output — go doc runtime.GOMAXPROCS, go1.25.5">
{`      - the number of logical CPUs on the machine,
      - the process's CPU affinity mask,
      - and, on Linux, the process's average CPU throughput limit based on
        cgroup CPU quota, if any.

    If GODEBUG=containermaxprocs=0 is set and GOMAXPROCS is not set by the
    environment variable, then GOMAXPROCS instead defaults to the value of
    runtime.NumCPU. Note that GODEBUG=containermaxprocs=0 is default for
    language version 1.24 and below.`}
        </CodeBlock>
        <p>
          Translated: on Go 1.25+, a container with a 2-CPU quota on a 64-core host gets{' '}
          <code>GOMAXPROCS=2</code> automatically. Before 1.25 it got 64, oversubscribed the quota,
          and got throttled — the same bug Java had before it became container-aware, and the
          reason <code>automaxprocs</code> existed as a third-party library. Note the cgroup part is
          Linux-only, which is exactly where your containers run.
        </p>
      </InfoBox>

      <h2>Static Typing After TypeScript</h2>
      <p>
        If you have been writing TypeScript, the adjustment is smaller than you expect and
        different than you expect. Go&apos;s type system is far less expressive than TS&apos;s —
        no union types, no mapped or conditional types, no discriminated unions with exhaustiveness
        checking — but it is enforced by the thing that produces your binary, not by a separate tool
        you can skip. There is no <code>any</code> escape hatch that silences the compiler, no{' '}
        <code>// @ts-ignore</code>, and no possibility of a type-check-clean build that still has
        TypeScript errors, because there is only one build.
      </p>
      <p>
        The practical shape of it: the compiler rejects a lot of things JavaScript would happily
        coerce.
      </p>

      <CodeBlock language="go" title="main.go — four separate things JS would allow">
{`package main

import "fmt"

func main() {
	var count int = 3
	var ratio float64 = 1.5

	fmt.Println(count * ratio) // mixed numeric types

	var id string = 7 // number into a string

	if count {} // truthiness
	fmt.Println(id)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`# example.com/typeerrs
./main.go:9:14: invalid operation: count * ratio (mismatched types int and float64)
./main.go:11:18: cannot use 7 (untyped int constant) as string value in variable declaration
./main.go:13:5: non-boolean condition in if statement`}
      </CodeBlock>

      <p>
        And the one that genuinely startles everyone on day one — unused imports and unused local
        variables are not warnings, they are <strong>compile errors</strong>:
      </p>

      <CodeBlock language="go" title="main.go">
{`package main

import (
	"fmt"
	"os"
)

func main() {
	hostname := "localhost"
	fmt.Println("starting")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`# example.com/unused
./main.go:5:2: "os" imported and not used
./main.go:9:2: declared and not used: hostname`}
      </CodeBlock>

      <p>
        This feels hostile for about two days and then you stop noticing, because your editor
        removes unused imports on save. The payoff is that no Go codebase anywhere accumulates dead
        imports or orphaned variables, and the dependency graph in <code>go.mod</code> stays an
        accurate description of what the program uses. It is the same philosophy as{' '}
        <code>gofmt</code>: remove the possibility of the mess rather than lint for it.
      </p>

      <h2>The Standard Library Is the Framework</h2>
      <p>
        Go&apos;s standard library is unusually complete, and that single fact explains most of why
        Go dependency trees are tiny. It is not that Go developers are more disciplined; it is that
        there is less to depend on.
      </p>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go list std | wc -l
     349
$ go list std | grep -v internal | wc -l
     188
$ go list std | grep -v internal | cut -d/ -f1 | sort -u
archive bufio bytes cmp compress container context crypto database debug embed
encoding errors expvar flag fmt go hash html image index io iter log maps math
mime net os path plugin reflect regexp runtime slices sort strconv strings
structs sync syscall testing text time unicode unique unsafe weak`}
      </CodeBlock>

      <p>
        188 importable packages. In that list: a production HTTP/1.1 and HTTP/2 server and client (
        <code>net/http</code>), TLS (<code>crypto/tls</code>), JSON (<code>encoding/json</code>), a
        SQL abstraction layer (<code>database/sql</code>), auto-escaping HTML templates (
        <code>html/template</code>), structured logging (<code>log/slog</code>), a test runner with
        benchmarking, fuzzing, and coverage built in (<code>testing</code>), and an HTTP test
        harness (<code>net/http/httptest</code>). In Node, every one of those is an npm package.
      </p>
      <p>
        Here is a real service with request routing, path parameters, JSON encoding, structured
        logging, and a read timeout — and its complete dependency manifest:
      </p>

      <CodeBlock language="go" title="server/main.go">
{`package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

type health struct {
	Status string    \`json:"status"\`
	Uptime string    \`json:"uptime"\`
	At     time.Time \`json:"at"\`
}

func main() {
	start := time.Now()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(health{
			Status: "ok",
			Uptime: time.Since(start).Round(time.Second).String(),
			At:     time.Now().UTC(),
		})
	})
	mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
		slog.Info("lookup", "id", r.PathValue("id"))
		_, _ = w.Write([]byte("user " + r.PathValue("id")))
	})

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
	slog.Info("listening", "addr", srv.Addr)
	_ = srv.ListenAndServe()
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go mod tidy then go list, go1.25.5">
{`$ go mod tidy && cat go.mod
module example.com/server

go 1.25.5

$ go list -m all
example.com/server

$ ls
go.mod  main.go`}
      </CodeBlock>

      <p>
        No <code>require</code> block. No <code>go.sum</code> — there is nothing to checksum. Two
        files. And it works:
      </p>

      <CodeBlock language="text" title="Real output — the server running, curled">
{`$ go build -o server . && ls -lh server
-rwxr-xr-x@ 1 you  staff   7.7M Oct  9 16:41 server

$ curl -s -i http://localhost:8080/healthz
HTTP/1.1 200 OK
Content-Type: application/json
Date: Fri, 09 Oct 2026 21:41:08 GMT
Content-Length: 65

{"status":"ok","uptime":"1s","at":"2026-10-09T21:41:08.631933Z"}

$ curl -s http://localhost:8080/users/42
user 42

$ curl -s -i -X POST http://localhost:8080/healthz | head -3
HTTP/1.1 405 Method Not Allowed
Allow: GET, HEAD
Content-Type: text/plain; charset=utf-8

# server's own stderr:
2026/10/09 16:41:07 INFO listening addr=:8080
2026/10/09 16:41:08 INFO lookup id=42`}
      </CodeBlock>

      <p>
        The <code>&quot;GET /healthz&quot;</code> and <code>&quot;GET /users/{'{id}'}&quot;</code>{' '}
        patterns, method matching, the automatic <code>405</code> with a correct{' '}
        <code>Allow</code> header, and <code>r.PathValue</code> are all standard-library{' '}
        <code>http.ServeMux</code> — added in Go 1.22. If you read a Go tutorial written before
        2024 it will tell you that you need <code>gorilla/mux</code> or <code>chi</code> for path
        parameters. You do not, for a basic service. (You might still want <code>chi</code> for
        middleware ergonomics on something large, and that is a legitimate choice, not a failure.)
      </p>
      <p>
        For contrast, the Express version of this same endpoint:{' '}
        <strong>65 packages, 3.7 MB</strong>, as measured earlier. Neither number is a moral
        judgement. But a dependency you do not have is a dependency you do not audit, patch,
        pin, or get paged about.
      </p>

      <h2>When Not To Reach for Go</h2>
      <p>
        Go is a sharp, narrow tool, and a tutorial that only sells it is not useful to you when
        you are the person in the room making a technology call. Concrete reasons to pick something
        else:
      </p>
      <ul>
        <li>
          <strong>You want an expressive type system.</strong> Coming from TypeScript you will miss
          union types, discriminated unions, exhaustive <code>switch</code> checking, and mapped
          types daily. Go has generics (since 1.18) but they are intentionally limited — type
          parameters on functions and types only, never on methods:
          <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`./main.go:6:23: syntax error: method must have no type parameters`}
          </CodeBlock>
          That rules out fluent generic APIs that are routine in Java, C#, and TS. If your domain
          genuinely wants algebraic data types and pattern matching, Go will fight you; Rust,
          Kotlin, or Scala will not.
        </li>
        <li>
          <strong>You are doing anything heavily numeric or data-science-shaped.</strong> No operator
          overloading, no array broadcasting, and nothing resembling NumPy, pandas, Spark, or the
          JVM&apos;s data ecosystem. Python and Java own this and it is not close.
        </li>
        <li>
          <strong>You want to run it in a browser.</strong> Go compiles to WebAssembly, but it drags
          its runtime along. The same hello-world from the top of this lesson:
          <CodeBlock language="text" title="Real output — go1.25.5">
{`$ GOOS=js GOARCH=wasm go build -o hello.wasm .            && ls -lh hello.wasm
-rwxr-xr-x@ 1 you  staff   2.4M Oct  9 17:04 hello.wasm
$ GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o hello-stripped.wasm . && ls -lh hello-stripped.wasm
-rwxr-xr-x@ 1 you  staff   2.3M Oct  9 17:04 hello-stripped.wasm`}
          </CodeBlock>
          2.3 MB stripped to print one line. Keep using TypeScript on the front end. (Go&apos;s{' '}
          <code>GOOS=wasip1</code> target, 2.4 MB here, is for server-side WASM runtimes and is a
          more reasonable fit.)
        </li>
        <li>
          <strong>You want a batteries-included application framework.</strong> There is no Spring,
          no Rails, no NestJS. No annotation-driven dependency injection, no AOP, no JPA. The
          idiomatic Go answer is &quot;pass the dependency into the constructor function
          yourself,&quot; which is great for comprehensibility and tedious if you are used to{' '}
          <code>@Autowired</code> doing it. If your team&apos;s productivity is built on
          Spring&apos;s conventions, moving to Go is a real cost, not a free upgrade.
        </li>
        <li>
          <strong>You find explicit error handling intolerable.</strong> There are no exceptions.
          Every failure is a returned value you check, which means roughly one{' '}
          <code>if err != nil</code> per call that can fail. It is genuinely more typing than a
          try/catch block, and the Go team has repeatedly declined to add sugar for it. Some people
          find the explicitness clarifying; some find it noise. You should know which you are before
          you commit a team to it.
        </li>
        <li>
          <strong>Your workload is CPU-bound number crunching where peak matters more than
          latency.</strong> A warmed-up JVM or a C++/Rust build will usually beat Go. Go&apos;s win
          is concurrency, startup, operational simplicity, and compile speed.
        </li>
      </ul>
      <p>
        What Go is unusually good at: network services, API gateways and proxies, CLI tools,
        anything where you want a small container and fast start, and anything where a large team
        needs to read each other&apos;s code without arguing about style. That is not a coincidence
        — it is a language designed at Google for exactly those jobs.
      </p>

      <h2>Where This Section Goes Next</h2>
      <p>
        Next up is <a href="/go/setup">Setup, Modules &amp; the Toolchain</a>, which covers{' '}
        <code>go.mod</code> against <code>package.json</code>, why <code>GOPATH</code> confusion is
        a historical artifact you can ignore, the <code>/v2</code> import path suffix that will
        surprise you coming from npm, and cross-compilation. Then{' '}
        <a href="/go/syntax">Syntax, Types &amp; Zero Values</a>, which is where the
        &quot;there is no <code>undefined</code>&quot; claim gets demonstrated rather than asserted.
        Structs, methods, and composition — the &quot;no classes, no inheritance&quot; lesson for
        the Java half of your brain — follow in{' '}
        <a href="/go/structs">Structs, Methods &amp; Composition</a>.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          One thing worth sitting with: the Node experiment above showed a 50 ms timer firing two
          seconds late. Every piece of defensive architecture you have ever built in Node — worker
          threads, job queues for CPU work, splitting a service so one slow endpoint cannot starve
          the others, <code>setImmediate</code> to yield mid-loop — exists because of that one
          behaviour. As you read the rest of this section, keep asking which of those patterns you
          are carrying for a reason that no longer applies. Some of them still matter (a queue is
          still a queue). Several of them do not.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Intro;
