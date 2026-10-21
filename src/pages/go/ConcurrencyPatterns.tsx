import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function ConcurrencyPatterns() {
  return (
    <LessonLayout
      title="Concurrency Patterns & Failure Modes"
      sectionId="go"
      lessonIndex={13}
      prev={{ path: '/go/context', label: 'Context: Cancellation & Deadlines' }}
      next={{ path: '/go/testing', label: 'Testing Without a Framework' }}
    >
      <p>
        You now have all four primitives: <a href="/go/goroutines">goroutines</a> to start work,{' '}
        <a href="/go/channels">channels</a> to move values between them,{' '}
        <a href="/go/sync">sync</a> to guard shared state, and{' '}
        <a href="/go/context">context</a> to stop work that is no longer wanted. This lesson is
        about assembling them — and, more usefully, about the specific ways the assembly goes
        wrong.
      </p>

      <p>
        The failure modes matter more than the patterns. The patterns you can look up; the
        failures are quiet, and several of them look like a healthy program right up until the
        memory graph bends.
      </p>

      <h2>Pattern: Worker Pool</h2>

      <p>
        The workhorse. Bound the number of concurrent workers, feed them from one channel,
        collect into another. Coming from Node, this is the thing you would reach for{' '}
        <code>p-limit</code> or a queue library to do — in Go it is about fifteen lines of
        standard library.
      </p>

      <CodeBlock language="go" title="A bounded pool of N workers">
{`func workerPool(jobs []int, n int) []int {
	in := make(chan int)
	out := make(chan int, len(jobs))   // buffered so workers never block on send

	var wg sync.WaitGroup
	for w := 0; w < n; w++ {
		wg.Add(1)                       // Add BEFORE the goroutine starts
		go func() {
			defer wg.Done()
			for j := range in {         // drains until 'in' is closed
				out <- j * j
			}
		}()
	}

	go func() {                         // feeder: close 'in' to signal "no more work"
		for _, j := range jobs {
			in <- j
		}
		close(in)
	}()

	wg.Wait()                           // all workers have returned
	close(out)                          // now safe to close — nobody will send again

	var res []int
	for v := range out {
		res = append(res, v)
	}
	return res
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — 8 jobs, 3 workers">
{`worker pool results count: 8`}
      </CodeBlock>

      <p>
        Three things in that code are load-bearing and easy to get wrong.{' '}
        <code>wg.Add(1)</code> is outside the goroutine — inside, it races with{' '}
        <code>wg.Wait()</code> and the pool can finish before it starts. The feeder runs in its
        own goroutine, because sending to an unbuffered channel blocks and the workers cannot
        start consuming until the function reaches them. And <code>close(out)</code> happens
        after <code>wg.Wait()</code>, because closing a channel that a worker might still send on
        is an immediate panic.
      </p>

      <InfoBox variant="tip" title="Who closes a channel">
        The sender closes, never the receiver, and only when no further sends can happen. With
        multiple senders, nobody can safely close on their own — coordinate with a{' '}
        <code>WaitGroup</code> as above, so the close happens once, after all of them are done.
      </InfoBox>

      <h2>Pattern: errgroup — What You Actually Want Most of the Time</h2>

      <p>
        The raw <code>WaitGroup</code> has a gap: it has no concept of failure. If one worker
        fails, the others keep going and you have no channel to report it on.{' '}
        <code>golang.org/x/sync/errgroup</code> fills that gap, and it is the closest thing Go
        has to <code>Promise.all</code> — with the addition that the first failure{' '}
        <strong>cancels the rest</strong>.
      </p>

      <CodeBlock language="go" title="First error wins, siblings are cancelled">
{`g, ctx := errgroup.WithContext(context.Background())

for i := 0; i < 3; i++ {
	g.Go(func() error {
		if i == 1 {
			return errors.New("task 1 failed")    // this cancels ctx for everyone
		}
		select {
		case <-time.After(2 * time.Second):       // would take 2s...
			return nil
		case <-ctx.Done():                        // ...but gets cancelled first
			return ctx.Err()
		}
	})
}

err := g.Wait()   // returns the FIRST non-nil error`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — note the elapsed time">
{`errgroup err=task 1 failed  elapsed<500ms=true`}
      </CodeBlock>

      <p>
        The two sibling tasks each asked for two seconds of work, and the whole group returned in
        under half a second, because the failure cancelled the context they were selecting on.
        That is the behaviour you want from parallel I/O: stop paying for results you have
        already decided to discard.
      </p>

      <InfoBox variant="note" title="The siblings still have to cooperate">
        <code>errgroup</code> cancels the context — it cannot stop a goroutine that does not
        watch it. A task that ignores <code>ctx.Done()</code> runs to completion regardless, and
        <code>g.Wait()</code> blocks until it does. Same rule as{' '}
        <a href="/go/context">the context lesson</a>: cancellation is cooperative, always.
      </InfoBox>

      <h2>Pattern: Bounded Concurrency With a Semaphore Channel</h2>

      <p>
        When you want to run N things but only K at a time, and a full worker pool is more
        structure than you need, a buffered channel works as a counting semaphore:
      </p>

      <CodeBlock language="go" title="At most K in flight">
{`sem := make(chan struct{}, 10)   // capacity IS the concurrency limit
var wg sync.WaitGroup

for _, url := range urls {
	wg.Add(1)
	go func() {
		defer wg.Done()
		sem <- struct{}{}          // acquire — blocks when 10 are in flight
		defer func() { <-sem }()   // release
		fetch(url)
	}()
}
wg.Wait()`}
      </CodeBlock>

      <p>
        <code>struct{}</code> is the idiomatic element type because it occupies zero bytes — the
        channel is pure signalling, the values carry nothing.
      </p>

      <h2>Pattern: Pipeline</h2>

      <FlowChart
        title="Stages Connected by Channels, Cancelled as One"
        chart={
          'graph LR\n' +
          '  SRC["generate()<br/>emits values"] -->|"&lt;-chan int"| SQ["square()<br/>transforms"]\n' +
          '  SQ -->|"&lt;-chan int"| FIL["filter()<br/>drops some"]\n' +
          '  FIL -->|"&lt;-chan int"| SINK["main<br/>consumes"]\n' +
          '  CTX["ctx.Done()"] -.->|"every stage selects on it"| SRC\n' +
          '  CTX -.->|" "| SQ\n' +
          '  CTX -.->|" "| FIL\n' +
          '  style CTX fill:#3b1a1a,stroke:#f87171\n' +
          '  style SINK fill:#1a3329,stroke:#4ade80'
        }
      />

      <p>
        Each stage takes a receive-only channel and returns one. The critical detail is that{' '}
        <em>every</em> stage must select on <code>ctx.Done()</code> — if the consumer stops
        reading and a stage does not watch for cancellation, that stage blocks on its send
        forever, which is the leak in the next section.
      </p>

      <CodeBlock language="go" title="One stage, correctly written">
{`func square(ctx context.Context, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)              // ALWAYS close your own output
		for v := range in {
			select {
			case out <- v * v:        // normal path
			case <-ctx.Done():        // consumer gave up — leave
				return
			}
		}
	}()
	return out
}`}
      </CodeBlock>

      <h2>Failure Mode 1: Goroutine Leaks</h2>

      <p>
        The most common and the most insidious, because a leaked goroutine is not an error. The
        runtime is content, nothing logs, and memory simply grows. Here is the same fifty
        goroutines with and without a cancellation path:
      </p>

      <CodeBlock language="go" title="Measuring it directly">
{`before := runtime.NumGoroutine()

ctx, cancel := context.WithCancel(context.Background())
for i := 0; i < 50; i++ {
	go func() { <-ctx.Done() }()      // exits when cancelled
}
time.Sleep(50 * time.Millisecond)
during := runtime.NumGoroutine()

cancel()                              // the cleanup
time.Sleep(100 * time.Millisecond)
after := runtime.NumGoroutine()`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — back to baseline">
{`goroutines before=1 during=51 after-cancel=1`}
      </CodeBlock>

      <p>
        Fifty up, fifty cleanly gone. Replace <code>&lt;-ctx.Done()</code> with a receive on a
        channel nobody will ever send to, and the final number stays at 51 forever — which, in a
        handler running once per request, is a leak with a slope.
      </p>

      <InfoBox variant="warning" title="How to actually catch these">
        <code>runtime.NumGoroutine()</code> around a test is the cheap check — assert the count
        returns to baseline. For real services, expose <code>net/http/pprof</code> and read{' '}
        <code>/debug/pprof/goroutine?debug=1</code>, which prints every live goroutine grouped by
        stack. A leak shows up as thousands of goroutines parked on the same line of your code,
        which usually identifies the bug immediately. <code>go.uber.org/goleak</code> automates
        the test-time version.
      </InfoBox>

      <h2>Failure Mode 2: Deadlock</h2>

      <p>
        Go detects the total case — when <em>every</em> goroutine is blocked — and kills the
        program rather than hanging:
      </p>

      <CodeBlock language="go" title="Unbuffered send with nobody receiving">
{`ch := make(chan int)   // unbuffered
ch <- 1                // blocks forever: a send needs a ready receiver`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`fatal error: all goroutines are asleep - deadlock!

goroutine 1 [chan send]:
main.main()
	/.../dead.go:5 +0x34
exit status 2`}
      </CodeBlock>

      <p>
        Read the bracketed state — <code>[chan send]</code> — it tells you exactly what the
        goroutine was waiting on. Common values are <code>chan send</code>,{' '}
        <code>chan receive</code>, <code>select</code>, and <code>sync.Mutex.Lock</code>.
      </p>

      <InfoBox variant="danger" title="The detector only fires when EVERYTHING is asleep">
        This is a much weaker guarantee than it looks. If a single goroutine is still doing
        something — a ticker, a background poller, an idle HTTP server — the runtime sees a
        live program and says nothing, while your handler goroutines pile up blocked forever. In
        a real server the deadlock detector essentially never fires. It is a development
        convenience, not a safety net.
      </InfoBox>

      <h2>Failure Mode 3: Loop Variable Capture (Mostly Historical)</h2>

      <p>
        You will find a great deal of advice telling you to write <code>i := i</code> at the top
        of a loop body before launching a goroutine. On modern Go that advice is obsolete, and
        knowing why saves you from cargo-culting it.
      </p>

      <p>
        Before Go 1.22, a <code>for</code> loop created <strong>one</strong> variable that every
        iteration updated — so goroutines capturing it all saw whatever value it held when they
        finally ran, typically the final one. Go 1.22 changed loops to create a{' '}
        <strong>new variable per iteration</strong>. Verified on this toolchain by taking the
        address each time around:
      </p>

      <CodeBlock language="go" title="Counting distinct addresses of the loop variable">
{`addrs := map[string]bool{}
for i := 0; i < 3; i++ {
	addrs[fmt.Sprintf("%p", &i)] = true
}
fmt.Printf("distinct addresses of i across 3 iterations: %d\\n", len(addrs))`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Go 1.25.5">
{`distinct addresses of i across 3 iterations: 3`}
      </CodeBlock>

      <p>
        Three iterations, three distinct variables. The closure capture bug cannot occur. A
        goroutine-launching loop with no <code>i := i</code> shadow now produces{' '}
        <code>[0 1 2 3 4]</code> rather than the classic <code>[5 5 5 5 5]</code>.
      </p>

      <InfoBox variant="note" title="One claim I could not reproduce, stated honestly">
        The official Go blog says the new semantics are <em>gated on the <code>go</code> directive
        in go.mod</em> — a module declaring <code>go 1.21</code> or earlier should keep the old
        per-loop variable. I tried to demonstrate that: modules declaring <code>go 1.21</code> and
        even <code>go 1.16</code>, plus <code>GOEXPERIMENT=noloopvar</code>, all still produced
        three distinct addresses on Go 1.25.5, with <code>go list</code> confirming the directive
        was being read. So I could not reproduce the legacy behaviour on this toolchain and will
        not claim to have. The practical guidance is unaffected: on any Go you are likely to run
        today, write the loop without the shadow — and when you meet <code>i := i</code> in an
        older codebase, recognise it as a fix for a problem that no longer exists rather than
        something to imitate.
      </InfoBox>

      <h2>Failure Mode 4: WaitGroup Misuse</h2>

      <CodeBlock language="go" title="Two bugs that look harmless">
{`// ✗ Add inside the goroutine — races with Wait().
//   Wait() may run before any Add() lands and return immediately.
for _, j := range jobs {
	go func() { wg.Add(1); defer wg.Done(); work(j) }()
}

// ✓ Add before the goroutine starts.
for _, j := range jobs {
	wg.Add(1)
	go func() { defer wg.Done(); work(j) }()
}

// ✗ Passing a WaitGroup by value copies it — Done() decrements the COPY,
//   and Wait() on the original blocks forever. go vet catches this.
func worker(wg sync.WaitGroup) { defer wg.Done() }

// ✓ Pass the pointer.
func worker(wg *sync.WaitGroup) { defer wg.Done() }`}
      </CodeBlock>

      <p>
        The copy bug is the same value-semantics issue from{' '}
        <a href="/go/pointers">Pointers &amp; Value Semantics</a> — a <code>WaitGroup</code> is a
        struct, so passing it copies it. <code>go vet</code> reports this one reliably, which is
        a good argument for running it in CI.
      </p>

      <h2>The Review Checklist</h2>

      <CodeBlock language="text" title="What to look for in concurrent Go">
{`GOROUTINE LIFETIME
  □ Every goroutine has a guaranteed exit path.
  □ Anything long-lived selects on ctx.Done().
  □ Tests assert runtime.NumGoroutine() returns to baseline.

CHANNELS
  □ The sender closes, and only after all sends are done.
  □ Every pipeline stage closes its own output (defer close).
  □ Sends in a stage select on ctx.Done() too.

SHARED STATE
  □ CI runs go test -race. Not optional.
  □ go vet runs in CI (catches copied mutexes/WaitGroups).
  □ wg.Add is outside the goroutine.
  □ WaitGroups and Mutexes are passed by pointer.

CANCELLATION
  □ ctx is the first parameter and is actually respected.
  □ Every WithCancel/WithTimeout has a defer cancel().
  □ Errors returned on cancel are ctx.Err(), not invented.`}
      </CodeBlock>

      <h2>Key Takeaways</h2>

      <p>
        <strong>Reach for <code>errgroup</code> before a hand-rolled WaitGroup</strong> when
        tasks can fail — first error wins and siblings get cancelled, which is almost always what
        you meant. <strong>Bound your concurrency</strong>: a worker pool or a semaphore channel,
        never an unbounded <code>go</code> per item.{' '}
        <strong>Goroutine leaks are the default failure</strong>, silent and slope-shaped —
        measure with <code>NumGoroutine()</code> in tests and <code>pprof</code> in production.{' '}
        <strong>The deadlock detector only fires when every goroutine is asleep</strong>, so it
        will not save a real server. <strong>Loop-variable shadowing is obsolete</strong> on
        modern Go. And <strong>run <code>-race</code> and <code>go vet</code> in CI</strong> —
        between them they catch most of what is on that checklist before review does.
      </p>

      <p>
        That closes the concurrency block — <a href="/go/goroutines">goroutines</a>,{' '}
        <a href="/go/channels">channels</a>, <a href="/go/sync">sync</a>,{' '}
        <a href="/go/context">context</a>, and the patterns and failures above. Read that last
        takeaway again, though, because it is the hinge: the two tools that catch goroutine leaks
        and data races are flags you have to actually run.
      </p>
      <p>
        Next: <strong><a href="/go/testing">Testing Without a Framework</a></strong>, which is where{' '}
        <code>-race</code> stops being advice and becomes part of the build. It is also the shortest
        distance between this section and your day job — the runner, assertions, coverage,
        benchmarks and the fuzzer are already installed, and the conventional Go project has zero
        testing dependencies. The three lessons after it (
        <a href="/go/http">HTTP</a>, <a href="/go/database">databases</a>,{' '}
        <a href="/go/deploy">build and deploy</a>) are a small real service, built with everything
        up to this point.
      </p>
    </LessonLayout>
  );
}
