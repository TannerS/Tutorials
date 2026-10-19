import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function Context() {
  return (
    <LessonLayout
      title="Context: Cancellation & Deadlines"
      sectionId="go"
      lessonIndex={12}
      prev={{ path: '/go/sync', label: 'The sync Package — and When Not to Use Channels' }}
      next={{ path: '/go/concurrency-patterns', label: 'Concurrency Patterns & Failure Modes' }}
    >
      <p>
        Open almost any Go server codebase and you will notice that nearly every function takes{' '}
        <code>ctx context.Context</code> as its first parameter. It looks like ceremony. It is
        not — it is the mechanism that keeps a server from leaking goroutines every time a client
        hangs up, and the previous two lessons have left you with exactly the problem it solves.
      </p>

      <p>
        You now know how to <em>start</em> concurrent work (<a href="/go/goroutines">goroutines</a>),
        how to <em>communicate</em> with it (<a href="/go/channels">channels</a>), and how to{' '}
        <em>guard shared state</em> (<a href="/go/sync">sync</a>). What you have no way to do yet
        is <strong>stop</strong> work that is no longer wanted. Nothing in Go can kill a goroutine
        from the outside — there is no <code>goroutine.cancel()</code>, no equivalent of{' '}
        <code>Thread.interrupt()</code>. A goroutine exits when its function returns, and that is
        the only way.
      </p>

      <p>
        So cancellation in Go is necessarily <strong>cooperative</strong>: you hand the goroutine
        a signal it agrees to watch, and it returns on its own. <code>context.Context</code> is
        the standard shape of that signal.
      </p>

      <InfoBox variant="info" title="The Node bridge: AbortController">
        If you have used <code>AbortController</code> to cancel a <code>fetch</code>, you already
        have the concept. <code>ctx.Done()</code> is <code>signal</code>, <code>cancel()</code> is{' '}
        <code>abort()</code>, and <code>ctx.Err()</code> tells you which reason fired. The
        difference is cultural rather than technical: in Node an <code>AbortSignal</code> is
        something you reach for occasionally, while in Go a context is threaded through
        essentially every call that can block. The convention is strong enough that a function
        that <em>takes</em> a context and ignores it is considered a bug.
      </InfoBox>

      <h2>The Interface Is Four Methods</h2>

      <CodeBlock language="go" title="context.Context, in full">
{`type Context interface {
	Done() <-chan struct{}        // closed when this context is cancelled
	Err() error                   // WHY it was cancelled (nil if it wasn't)
	Deadline() (time.Time, bool)  // when it will expire, if ever
	Value(key any) any            // request-scoped data — use sparingly
}`}
      </CodeBlock>

      <p>
        <code>Done()</code> is the whole design. It returns a channel that is never written to,
        only <strong>closed</strong> — and from the channels lesson you know that closing a
        channel makes every receiver unblock immediately. That is how one <code>cancel()</code>{' '}
        call can wake up a hundred goroutines at once, with no bookkeeping and no broadcast
        mechanism.
      </p>

      <h2>The Shape Every Cancellable Function Has</h2>

      <p>
        Respecting a context means racing your real work against <code>ctx.Done()</code> in a{' '}
        <code>select</code>. That pattern is the entire technique:
      </p>

      <CodeBlock language="go" title="The canonical cancellable function">
{`func work(ctx context.Context, d time.Duration) error {
	select {
	case <-time.After(d):      // the real work finishes
		return nil
	case <-ctx.Done():         // ...or we're told to stop
		return ctx.Err()       // return WHY, don't invent your own error
	}
}`}
      </CodeBlock>

      <p>
        Three contexts, three outcomes — all three run below against the real runtime:
      </p>

      <CodeBlock language="go" title="Deriving contexts">
{`// 1. a deadline that fires before the work completes
ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
defer cancel()
err := work(ctx, 2*time.Second)

// 2. an explicit cancel from elsewhere
ctx2, cancel2 := context.WithCancel(context.Background())
go func() { time.Sleep(20 * time.Millisecond); cancel2() }()
err2 := work(ctx2, 2*time.Second)

// 3. the work wins the race
ctx3, cancel3 := context.WithTimeout(context.Background(), time.Second)
defer cancel3()
err3 := work(ctx3, 10*time.Millisecond)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, Go 1.25.5">
{`timeout case:  err=context deadline exceeded  DeadlineExceeded=true
cancel case:   err=context canceled            Canceled=true
success case:  err=<nil>                       ctx.Err()=<nil>`}
      </CodeBlock>

      <p>
        Note the two distinct sentinel errors. <code>context.DeadlineExceeded</code> means time
        ran out; <code>context.Canceled</code> means somebody called <code>cancel()</code>.
        Both are matched with <code>errors.Is</code>, exactly as{' '}
        <a href="/go/errors">Errors Are Values</a> described — and the distinction matters in
        practice, because a deadline usually warrants a 504 while a client cancellation usually
        warrants no response at all.
      </p>

      <InfoBox variant="danger" title="Always defer cancel() — even when a timeout will fire anyway">
        Every <code>WithCancel</code>/<code>WithTimeout</code>/<code>WithDeadline</code> returns a{' '}
        <code>cancel</code> function, and <strong>not calling it leaks</strong>. The parent
        context holds a reference to the child until it is cancelled, so a long-lived parent
        accumulates children for as long as the process runs. It is tempting to skip{' '}
        <code>defer cancel()</code> when a timeout is going to fire shortly anyway — don't.{' '}
        <code>go vet</code> flags the omission, and the leak is invisible until a profile shows
        it. Calling <code>cancel()</code> twice is explicitly safe, so there is never a reason to
        hesitate.
      </InfoBox>

      <h2>Propagation Is the Point</h2>

      <p>
        A context is not a flag you check once. It is a value you <em>pass down</em>, forming a
        tree that mirrors your call tree. Cancelling any node cancels its entire subtree,
        instantly and without the node knowing what is below it.
      </p>

      <FlowChart
        title="One cancel() Unwinds an Entire Call Tree"
        chart={
          'graph TD\n' +
          '  REQ["incoming HTTP request<br/>r.Context()"] --> H["handler"]\n' +
          '  H --> A["WithTimeout 2s<br/>database query"]\n' +
          '  H --> B["WithTimeout 500ms<br/>cache lookup"]\n' +
          '  A --> A1["rows.Scan loop<br/>checks ctx.Done()"]\n' +
          '  B --> B1["redis round-trip"]\n' +
          '  X["client disconnects"] -.->|"closes Done() at the root"| REQ\n' +
          '  REQ -.->|"every descendant unblocks at once"| A\n' +
          '  REQ -.->|" "| B\n' +
          '  A -.->|" "| A1\n' +
          '  B -.->|" "| B1\n' +
          '  style X fill:#3b1a1a,stroke:#f87171\n' +
          '  style REQ fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <p>
        The HTTP server wires the root of that tree up for you. Every{' '}
        <code>*http.Request</code> carries a context that is cancelled when the client goes away —
        which means a handler that respects it stops doing expensive work the instant nobody is
        listening for the answer. Verified against a real server:
      </p>

      <CodeBlock language="go" title="A handler that notices the client leaving">
{`srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	select {
	case <-time.After(3 * time.Second):
		done <- "handler finished normally"
	case <-r.Context().Done():
		done <- fmt.Sprintf("handler observed: %v", r.Context().Err())
	}
}))

// client gives up after 60ms
ctx, cancel := context.WithTimeout(context.Background(), 60*time.Millisecond)
defer cancel()
req, _ := http.NewRequestWithContext(ctx, "GET", srv.URL, nil)
_, err := http.DefaultClient.Do(req)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the handler really does find out">
{`client err: true
handler observed: context canceled`}
      </CodeBlock>

      <p>
        The handler was told to produce three seconds of work and abandoned it after sixty
        milliseconds, because the caller stopped caring. In a Node service the equivalent handler
        would typically run to completion and write to a dead socket.
      </p>

      <h2>What Happens When You Ignore It</h2>

      <p>
        The failure mode is a goroutine leak, and it is quiet. Goroutines blocked forever are not
        an error — the runtime is perfectly happy, memory just climbs. Here are a hundred
        goroutines parked on a channel nobody will ever send to:
      </p>

      <CodeBlock language="go" title="Leaking, deliberately">
{`before := runtime.NumGoroutine()
for i := 0; i < 100; i++ {
	go func() { <-make(chan struct{}) }()   // blocks forever, no ctx, no exit
}
time.Sleep(100 * time.Millisecond)
fmt.Printf("goroutines before=%d after=%d leaked=%d\\n",
	before, runtime.NumGoroutine(), runtime.NumGoroutine()-before)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`goroutines before=3 after=102 leaked=99`}
      </CodeBlock>

      <p>
        Ninety-nine goroutines that will never exit, never be collected, and never report
        anything. Now picture that loop being one per request. This is the single most common
        way Go services die slowly, and{' '}
        <a href="/go/concurrency-patterns">Concurrency Patterns &amp; Failure Modes</a> covers
        diagnosing it properly.
      </p>

      <h2>context.WithValue — Handle With Care</h2>

      <p>
        A context can also carry request-scoped values. This is the part of the API most often
        misused, so the guidance is deliberately narrow:
      </p>

      <CodeBlock language="go" title="Typed keys, and only for request scope">
{`// Unexported key type — prevents collisions with other packages that
// might also stash something under the string "requestID".
type ctxKey string

const requestIDKey ctxKey = "requestID"

ctx = context.WithValue(ctx, requestIDKey, "abc-123")

// Reading is untyped, so assert — and handle the miss.
if id, ok := ctx.Value(requestIDKey).(string); ok {
	log.Printf("request %s", id)
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Values are for things that cross cut, not for arguments">
        Legitimate: request ID, trace span, authenticated user — things every layer might want
        and no layer should have to thread manually. Illegitimate: anything your function
        actually needs to do its job. A value pulled from a context is untyped, invisible in the
        signature, and fails at runtime rather than compile time, so using it for a real
        parameter trades a compiler error for a production panic. If a function needs a{' '}
        <code>userID</code>, take a <code>userID string</code>.
      </InfoBox>

      <h2>Conventions Worth Following Exactly</h2>

      <CodeBlock language="text" title="The rules the standard library itself follows">
{`1. ctx is the FIRST parameter, always named ctx.
      func Fetch(ctx context.Context, id string) (*User, error)

2. Never store a Context in a struct field.
   Pass it per-call. A stored context outlives the
   operation it described.

3. Never pass a nil Context.
   Use context.TODO() if you genuinely don't have one yet —
   it is a marker that says "this needs revisiting".

4. context.Background() is the root. One per request,
   or per program for long-lived work.

5. If you accept a ctx, you MUST respect it.
   Taking one and ignoring it is worse than not taking one,
   because every caller now believes you are cancellable.`}
      </CodeBlock>

      <p>
        Rule 2 is the one people argue with, usually wanting to avoid threading a parameter
        through many layers. The reason it holds: a context describes <em>one operation's</em>{' '}
        lifetime. Stored in a struct, it silently applies to every later call through that struct —
        including ones made after it was cancelled, which then fail for reasons that make no sense
        at the call site.
      </p>

      <h2>Key Takeaways</h2>

      <p>
        <strong>Nothing can kill a goroutine from outside</strong>, so cancellation is cooperative
        and <code>ctx.Done()</code> is the agreed-upon signal — a channel that is closed, not
        written, so one <code>cancel()</code> wakes every waiter at once.{' '}
        <strong>Race your work against <code>ctx.Done()</code> in a <code>select</code></strong>{' '}
        and return <code>ctx.Err()</code>, which distinguishes a blown deadline from a real
        cancellation. <strong>Always <code>defer cancel()</code></strong> — skipping it leaks,{' '}
        <code>go vet</code> catches it, and double-cancelling is safe.{' '}
        <strong>Pass contexts down, never store them</strong>, and keep{' '}
        <code>WithValue</code> for cross-cutting request metadata rather than real arguments.
        And remember what it is all for: without it, every abandoned request leaves work running
        that nobody will ever read.
      </p>
    </LessonLayout>
  );
}
