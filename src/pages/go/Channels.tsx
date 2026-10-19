import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Channels() {
  return (
    <LessonLayout
      title="Channels & select"
      sectionId="go"
      lessonIndex={10}
      prev={{ path: '/go/goroutines', label: 'Goroutines: Beyond the Event Loop' }}
      next={{ path: '/go/sync', label: 'The sync Package — and When Not to Use Channels' }}
    >
      <p>
        The <a href="/go/goroutines">previous lesson</a> ended on a cliffhanger:{' '}
        <code>go f()</code> hands you nothing, so how do you get a result back? The answer is a
        channel — a typed, synchronised conduit between goroutines. This is the piece Node and Java
        have no close equivalent of. The nearest things are a one-item{' '}
        <code>BlockingQueue</code> in Java, or an async generator in JavaScript, and neither
        prepares you for the part that trips everyone up: by default,{' '}
        <strong>a channel send blocks until someone receives it.</strong>
      </p>

      <h2>The Mechanics</h2>

      <CodeBlock language="go" title="Declaring, sending, receiving">
{`// A channel is a typed value you make, not a struct you construct.
ch := make(chan int)          // unbuffered: capacity 0
buf := make(chan int, 10)     // buffered:   capacity 10
var nilCh chan int            // nil — usable in select, panics on close

ch <- 42                      // send: the arrow points INTO the channel
v := <-ch                     // receive: the arrow points OUT of it
<-ch                          // receive and discard

v, ok := <-ch                 // comma-ok: ok is false iff the channel is
                              // closed AND drained

close(ch)                     // no more sends will happen
len(buf)                      // items currently queued
cap(buf)                      // capacity — 0 for an unbuffered channel`}
      </CodeBlock>

      <p>
        Channels are reference types: the zero value is <code>nil</code> and{' '}
        <code>make</code> is mandatory. Copying a channel value copies the reference, so passing a
        channel to a function gives both sides the same channel — unlike a slice or a map, there is
        no aliasing subtlety to worry about.
      </p>

      <h2>Unbuffered: A Rendezvous, Not a Queue</h2>

      <p>
        An unbuffered channel has no storage. A send does not &quot;put a value in&quot; and carry
        on; it parks the sending goroutine until a receiver shows up, and then hands the value
        directly across. The two goroutines meet. That is the whole semantics, and it is where the
        intuition from queues, event emitters, and <code>postMessage</code> fails hardest.
      </p>

      <FlowChart
        title="Unbuffered send: the sender waits for the receiver"
        chart={"sequenceDiagram\n    participant S as Sender goroutine\n    participant C as Unbuffered channel\n    participant R as Receiver goroutine\n    S->>C: ch <- \"hello\"\n    Note over S: PARKED - the send has not completed\n    Note over R: busy doing something else for 300ms\n    R->>C: v := <-ch\n    C-->>R: \"hello\" handed over directly\n    Note over S: unparked, send completes\n    Note over S,R: Both resume. Order of what they print next is NOT defined."}
      />

      <CodeBlock language="go" title="main.go — proving the send blocks">
{`func main() {
    start := time.Now()
    at := func(what string) {
        fmt.Printf("%5.0fms  %s\\n", float64(time.Since(start).Microseconds())/1000, what)
    }

    ch := make(chan string)      // unbuffered

    go func() {
        at("receiver: sleeping 300ms before it even tries to receive")
        time.Sleep(300 * time.Millisecond)
        v := <-ch
        at("receiver: got " + v)
    }()

    at("sender: about to send")
    ch <- "hello"                // blocks until the receiver is ready
    at("sender: send completed")

    time.Sleep(50 * time.Millisecond)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`    0ms  sender: about to send
    0ms  receiver: sleeping 300ms before it even tries to receive
  301ms  receiver: got hello
  301ms  sender: send completed`}
      </CodeBlock>

      <InfoBox variant="warning" title="The last two lines swap between runs — on purpose">
        <p>
          Eight consecutive runs of the compiled binary gave the final pair in this order:
        </p>
        <CodeBlock language="text" title="Last two lines, 8 runs">
{`run 1:  receiver: got hello  |  sender: send completed
run 2:  sender: send completed  |  receiver: got hello
run 3:  sender: send completed  |  receiver: got hello
run 4:  sender: send completed  |  receiver: got hello
run 5:  receiver: got hello  |  sender: send completed
run 6:  sender: send completed  |  receiver: got hello
run 7:  receiver: got hello  |  sender: send completed
run 8:  sender: send completed  |  receiver: got hello`}
        </CodeBlock>
        <p>
          The <em>handoff</em> is a synchronisation point — both goroutines are provably past it.
          What happens <em>after</em> it is two goroutines racing to the next statement, and the
          scheduler decides. Expect this everywhere in this section: any output involving more than
          one goroutine has a stated ordering only where a channel, mutex or WaitGroup forces one.
        </p>
      </InfoBox>

      <h3>With nobody listening, it is a deadlock</h3>

      <CodeBlock language="go" title="main.go">
{`func main() {
    ch := make(chan int)     // unbuffered
    fmt.Println("sending on an unbuffered channel with no receiver...")
    ch <- 1
    fmt.Println("never reached")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, exit status 2">
{`sending on an unbuffered channel with no receiver...
fatal error: all goroutines are asleep - deadlock!

goroutine 1 [chan send]:
main.main()
	/.../d01/main.go:8 +0x70
exit status 2`}
      </CodeBlock>

      <p>
        This is the single most common first-week Go error, and the message is better than it
        looks. <code>goroutine 1 [chan send]</code> names the exact state the goroutine is stuck
        in. The runtime noticed that <em>every</em> goroutine in the process was asleep, concluded
        nothing could ever make progress, and killed the program rather than hanging. That
        detection has an important limit, covered in{' '}
        <a href="/go/concurrency-patterns">the failure-modes lesson</a>: it only fires when{' '}
        <strong>all</strong> goroutines are blocked. One live ticker and the same bug hangs
        silently forever.
      </p>

      <h2>Buffered: Capacity Decouples Them</h2>

      <p>
        A buffered channel lets a sender run ahead by up to <code>cap</code> items before it has to
        wait. The send blocks only when the buffer is full; the receive blocks only when it is
        empty.
      </p>

      <FlowChart
        title="Send and receive blocking rules"
        chart={"graph TD\n  S{\"ch <- v\"} --> S1{\"cap == 0 ?\"}\n  S1 -->|yes, unbuffered| S2{\"receiver already waiting ?\"}\n  S2 -->|yes| S3[\"hand over directly, both continue\"]\n  S2 -->|no| S4[\"BLOCK until one arrives\"]\n  S1 -->|no, buffered| S5{\"len < cap ?\"}\n  S5 -->|yes| S6[\"copy into the buffer, continue immediately\"]\n  S5 -->|no, full| S7[\"BLOCK until a receive frees a slot\"]\n  R{\"v := <-ch\"} --> R1{\"len > 0 ?\"}\n  R1 -->|yes| R2[\"take the oldest item, continue\"]\n  R1 -->|no| R3{\"channel closed ?\"}\n  R3 -->|yes| R4[\"return the ZERO VALUE immediately, ok=false\"]\n  R3 -->|no| R5[\"BLOCK until a send or a close\"]"}
      />

      <CodeBlock language="go" title="main.go — capacity 2, third send blocks">
{`ch := make(chan int, 2)

go func() {
    time.Sleep(300 * time.Millisecond)
    at("receiver: draining one, len=%d cap=%d", len(ch), cap(ch))
    <-ch
}()

ch <- 1
at("sent 1 (no receiver needed) len=%d cap=%d", len(ch), cap(ch))
ch <- 2
at("sent 2 (buffer now full) len=%d cap=%d", len(ch), cap(ch))
ch <- 3   // blocks: buffer full, must wait for a receive
at("sent 3 (only after the receiver drained one)")`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`    0ms  sent 1 (no receiver needed) len=1 cap=2
    0ms  sent 2 (buffer now full) len=2 cap=2
  300ms  receiver: draining one, len=2 cap=2
  301ms  sent 3 (only after the receiver drained one)`}
      </CodeBlock>

      <InfoBox variant="tip" title="How to choose a capacity">
        <p>
          Not &quot;whatever makes the deadlock go away&quot;. The capacity is a design decision
          about <em>backpressure</em>, and there are really only three defensible answers:
        </p>
        <ul>
          <li>
            <strong>0 (unbuffered).</strong> The default, and the right choice when you want the
            producer to feel the consumer&apos;s pace. It gives you the strongest guarantee: once
            the send returns, the value has definitely been received.
          </li>
          <li>
            <strong>Exactly N, where N is a known count.</strong> &quot;I will launch 5 workers
            and each sends exactly one result&quot; &rarr; <code>make(chan R, 5)</code>. This
            guarantees no sender can ever block, which is how you prevent a{' '}
            <a href="/go/concurrency-patterns">goroutine leak</a> when the receiver gives up early.
          </li>
          <li>
            <strong>A deliberate small buffer to smooth bursts</strong> — e.g. a 100-slot log
            queue so a momentary flush stall does not stall request handling. Pick the number from
            how much burst you are willing to buffer, and be clear about what happens when it fills.
          </li>
        </ul>
        <p>
          A large buffer is not &quot;safer&quot;. It converts a visible deadlock into an
          invisible memory leak and hides producer/consumer imbalance until production traffic
          finds it.
        </p>
      </InfoBox>

      <h2>Closing, <code>range</code>, and Comma-Ok</h2>

      <p>
        <code>close(ch)</code> does not free anything and does not discard buffered items. It is a
        one-way flag meaning <em>no more values will be sent</em>. Receivers can still drain
        everything already in the buffer, and after that every receive returns the element type&apos;s
        zero value immediately, forever.
      </p>

      <CodeBlock language="go" title="main.go">
{`ch := make(chan int, 3)
ch <- 10
ch <- 20
close(ch)

// 1. range stops cleanly when the channel is closed and drained.
for v := range ch {
    fmt.Println("range got", v)
}

// 2. Receiving from a closed, drained channel returns the zero value
//    IMMEDIATELY and forever. It does not block and does not panic.
v, ok := <-ch
fmt.Printf("after close+drain: v=%d ok=%t\\n", v, ok)
v, ok = <-ch
fmt.Printf("and again:         v=%d ok=%t\\n", v, ok)

// 3. The comma-ok form is how you tell "zero value that was sent"
//    apart from "channel closed".
ch2 := make(chan int, 1)
ch2 <- 0                      // a real, deliberate zero
v, ok = <-ch2
fmt.Printf("genuine zero sent: v=%d ok=%t\\n", v, ok)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`range got 10
range got 20
after close+drain: v=0 ok=false
and again:         v=0 ok=false
genuine zero sent: v=0 ok=true`}
      </CodeBlock>

      <p>
        That last pair is why comma-ok exists. A bare <code>v := &lt;-ch</code> on an{' '}
        <code>int</code> channel cannot distinguish &quot;someone sent 0&quot; from &quot;the
        channel is finished&quot;. Any loop that reads until some sentinel value needs{' '}
        <code>ok</code>, not a value comparison.
      </p>

      <h3>Forgetting to close turns <code>range</code> into a deadlock</h3>

      <CodeBlock language="text" title="Real output — same program with close(ch) removed">
{`ranging over a channel that is never closed...
got 1
got 2
fatal error: all goroutines are asleep - deadlock!

goroutine 1 [chan receive]:
main.main()
	/.../c11/main.go:11 +0xe4
exit status 2`}
      </CodeBlock>

      <p>
        <code>for range ch</code> means &quot;until closed&quot;, not &quot;until empty&quot;.
        There is no way to ask a channel &quot;are you done?&quot; other than closing it.
      </p>

      <h2>Who Closes? The Sender. Always.</h2>

      <p>
        This is the one ownership rule in the whole topic, and following it mechanically removes an
        entire class of bug:
      </p>

      <InfoBox variant="danger" title="The rule">
        <p>
          <strong>The goroutine that sends is the goroutine that closes.</strong> A receiver must
          never close a channel it reads from, and if there are multiple senders, none of them may
          close it — you need separate coordination (a <code>WaitGroup</code> and one closer
          goroutine, or a separate <code>done</code> channel) to decide when the last send has
          happened.
        </p>
      </InfoBox>

      <p>
        The rule exists because closing is not idempotent and sending after a close is fatal. All
        three illegal operations panic, and they are unrecoverable in practice because they fire on
        whichever goroutine happens to touch the channel:
      </p>

      <CodeBlock language="text" title="Real output — three separate programs, go1.25.5, each exit status 2">
{`$ go run ./c04                             # ch := make(chan int, 1); close(ch); ch <- 1
about to send on a closed channel
panic: send on closed channel

goroutine 1 [running]:
main.main()
	/.../c04/main.go:9 +0x74

$ go run ./c05                             # close(ch) twice
about to close an already-closed channel
panic: close of closed channel

goroutine 1 [running]:
main.main()
	/.../c05/main.go:9 +0x6c

$ go run ./c06                             # var ch chan int; close(ch)
about to close a nil channel
panic: close of nil channel

goroutine 1 [running]:
main.main()
	/.../c06/main.go:8 +0x54`}
      </CodeBlock>

      <p>
        Note the asymmetry, because it is the whole reason for the rule: <strong>receiving from a
        closed channel is perfectly legal and useful; sending to one is a panic.</strong> So the
        sender is the only party that can know when it is safe, and the receiver has no legitimate
        need to close anything.
      </p>

      <h3>Directional channel types enforce it at compile time</h3>

      <CodeBlock language="go" title="Let the type system hold the rule for you">
{`// chan<- T  send-only (the arrow points into the channel)
// <-chan T  receive-only
func produce(out chan<- int) { out <- 1; close(out) }   // can send and close
func consume(in <-chan int)  { for v := range in { _ = v } }

// A generator returns a receive-only channel, so callers physically cannot
// close it or send to it.
func gen(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)                 // the sender closes
        for _, n := range nums { out <- n }
    }()
    return out
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real compiler output — go1.25.5, attempting to break the rule">
{`// func consume(ch <-chan int) { <-ch; ch <- 1; close(ch) }

c09/main.go:5:2: invalid operation: cannot send to receive-only channel
                 <-chan int ch (variable of type <-chan int)
c09/main.go:6:8: invalid operation: cannot close receive-only channel ch
                 (variable of type <-chan int)`}
      </CodeBlock>

      <p>
        A bidirectional <code>chan T</code> converts implicitly to either directional form, so
        this costs nothing at the call site. Use directional types in every function signature that
        takes a channel; it documents the data flow and makes the illegal case a compile error
        rather than a 3 a.m. panic.
      </p>

      <h3><code>close</code> is also a broadcast</h3>

      <p>
        A send wakes exactly one receiver. A <code>close</code> wakes <em>all</em> of them. That is
        the mechanism behind every <code>done</code> channel and, underneath,{' '}
        <a href="/go/context"><code>context.Context</code></a>.
      </p>

      <CodeBlock language="go" title="main.go — one close, fifty wakeups">
{`done := make(chan struct{})
var woke atomic.Int64
var wg sync.WaitGroup
for i := 0; i < 50; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        <-done                // all 50 block here
        woke.Add(1)
    }()
}
time.Sleep(100 * time.Millisecond)
fmt.Println("before close, woken =", woke.Load())
close(done)                   // ONE close wakes all 50
wg.Wait()
fmt.Println("after close,  woken =", woke.Load())`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`before close, woken = 0
after close,  woken = 50`}
      </CodeBlock>

      <p>
        <code>chan struct{}</code> is the idiomatic signal channel: <code>struct{}</code> occupies
        zero bytes, so the channel carries pure &quot;something happened&quot; with no payload.
        You will see <code>close(done)</code> far more often than <code>done &lt;- struct{}{}</code>,
        precisely because close is the broadcast.
      </p>

      <h2><code>select</code>: Waiting on Several Things</h2>

      <p>
        <code>select</code> is to channels what <code>switch</code> is to values, except the cases
        are channel operations and it blocks until one of them can proceed. If several are ready it
        picks one <strong>uniformly at random</strong>.
      </p>

      <CodeBlock language="go" title="main.go — both cases always ready, 1000 iterations">
{`a := make(chan string, 1000)
b := make(chan string, 1000)
for i := 0; i < 1000; i++ { a <- "a"; b <- "b" }

counts := map[string]int{}
for i := 0; i < 1000; i++ {
    select {                 // BOTH cases are always ready
    case v := <-a: counts[v]++
    case v := <-b: counts[v]++
    }
}
fmt.Printf("1000 selects with both cases ready: a=%d b=%d\\n", counts["a"], counts["b"])`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, three consecutive runs">
{`1000 selects with both cases ready: a=475 b=525
1000 selects with both cases ready: a=480 b=520
1000 selects with both cases ready: a=496 b=504`}
      </CodeBlock>

      <InfoBox variant="warning" title="Randomisation is a feature, and it is load-bearing">
        <p>
          Coming from <code>switch</code>, you expect the first matching case to win. If{' '}
          <code>select</code> worked that way, a busy high-priority channel would starve every case
          below it forever — and worse, your program&apos;s behaviour would silently depend on the
          order you happened to write the cases in.
        </p>
        <p>
          The practical consequence is that <strong><code>select</code> cannot express
          priority.</strong> &quot;Drain the work channel, but check the shutdown channel
          first&quot; is not a thing you can write directly. The standard workaround is a nested
          non-blocking check:
        </p>
        <CodeBlock language="go" title="Giving one case priority">
{`for {
    // Priority pass: is shutdown pending? Non-blocking.
    select {
    case <-done:
        return
    default:
    }
    // Normal pass.
    select {
    case job := <-work:
        process(job)
    case <-done:
        return
    }
}`}
        </CodeBlock>
      </InfoBox>

      <h3><code>default</code>: the non-blocking escape hatch</h3>

      <CodeBlock language="go" title="Four things select does">
{`// 1. default makes a select never block.
select {
case v := <-empty:
    fmt.Println("got", v)
default:
    fmt.Println("default: nothing ready, moving on immediately")
}

// 2. A timeout. time.After returns a channel that fires once, later.
select {
case v := <-slow:
    fmt.Println("result:", v)
case <-time.After(200 * time.Millisecond):
    fmt.Println("timed out")
}

// 3. A nil channel case is NEVER ready, so it disables that branch.
var disabled chan int
select {
case v := <-disabled:  fmt.Println("impossible:", v)
case v := <-live:      fmt.Println("live case won with", v)
}

// 4. A non-blocking send — drop the message rather than block.
//    This is how you build a lossy metrics or log channel.
select {
case metrics <- sample:
default:
    dropped.Add(1)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`default: nothing ready, moving on immediately
timed out after 200ms
nil-channel case skipped; live case won with 42`}
      </CodeBlock>

      <InfoBox variant="danger" title="default inside a bare for loop is a busy-wait">
        <p>
          <code>for &#123; select &#123; case ...: default: &#125; &#125;</code> with nothing
          blocking in it will spin a CPU core at 100%. If you find yourself adding{' '}
          <code>default</code> to make a loop &quot;not hang&quot;, the loop probably wanted to
          block. Use <code>default</code> for a single point-in-time poll, not as a loop condition.
        </p>
      </InfoBox>

      <h3>Nil channels: switching a case off mid-loop</h3>

      <p>
        A nil channel blocks forever on both send and receive. On its own that is just a bug —{' '}
        and the runtime even labels it specifically:
      </p>

      <CodeBlock language="text" title="Real output — var ch chan int; <-ch">
{`receiving from a nil channel...
fatal error: all goroutines are asleep - deadlock!

goroutine 1 [chan receive (nil chan)]:    # note the (nil chan) annotation
main.main()
	/.../c12/main.go:8 +0x58
exit status 2`}
      </CodeBlock>

      <p>
        Inside a <code>select</code>, though, &quot;never ready&quot; is exactly the behaviour you
        want for a case you are finished with. Assigning <code>nil</code> to a channel variable
        retires its branch. This matters because a <em>closed</em> channel is the opposite: it is{' '}
        <em>always</em> ready, so a closed case left in a loop spins forever.
      </p>

      <CodeBlock language="go" title="main.go — retiring cases as they complete">
{`src := make(chan int, 3)
src <- 1
src <- 2
close(src)
done := time.After(300 * time.Millisecond)

for src != nil || done != nil {
    select {
    case v, ok := <-src:
        if !ok {
            fmt.Println("src closed -> setting src = nil to stop re-selecting it")
            src = nil        // without this, a closed channel is ALWAYS ready: busy loop
            continue
        }
        fmt.Println("src:", v)
    case <-done:
        fmt.Println("done fired -> setting done = nil")
        done = nil
    }
}
fmt.Println("loop exited cleanly")`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`src: 1
src: 2
src closed -> setting src = nil to stop re-selecting it
done fired -> setting done = nil
loop exited cleanly`}
      </CodeBlock>

      <CodeBlock language="text" title="Channel state cheat table — commit this to memory">
{`                  nil channel      open+empty     open+full/ready   closed
------------------------------------------------------------------------------
send      ch<-v   blocks forever   blocks or ok   blocks            PANIC
receive   <-ch    blocks forever   blocks         returns a value   zero, ok=false
close(ch)         PANIC            ok             ok                PANIC
len / cap         0 / 0            n / cap        n / cap           n / cap
in a select       case never runs  case waits     case can run      case ALWAYS runs`}
      </CodeBlock>

      <h2>Timeouts, and the <code>time.After</code> Footnote</h2>

      <CodeBlock language="go" title="The three timeout shapes">
{`// 1. One-shot timeout. Simple and correct for a single wait.
select {
case res := <-work:
    return res, nil
case <-time.After(2 * time.Second):
    return zero, errors.New("timeout")
}

// 2. Inside a hot loop, prefer a reused Timer. Each time.After allocates a
//    Timer that is not collectable until it fires.
timer := time.NewTimer(2 * time.Second)
defer timer.Stop()
for {
    timer.Reset(2 * time.Second)
    select {
    case res := <-work:
        return res, nil
    case <-timer.C:
        return zero, errors.New("timeout")
    }
}

// 3. In real server code, neither. Use a context, so the deadline
//    propagates to every call below you instead of stopping here.
select {
case res := <-work:
    return res, nil
case <-ctx.Done():
    return zero, ctx.Err()
}`}
      </CodeBlock>

      <InfoBox variant="note" title="A version detail on time.After">
        <p>
          You will find older advice that <code>time.After</code> in a loop is a memory leak,
          because the underlying <code>Timer</code> stayed alive until it fired even if nobody was
          listening. <strong>Go 1.23 changed the timer implementation</strong> so that an unreferenced{' '}
          <code>Timer</code> or <code>Ticker</code> becomes eligible for garbage collection
          immediately, without needing to have fired or been stopped. That removed the leak
          specifically; it did not remove the allocation, so a reused <code>time.Timer</code> is
          still the better choice in a hot loop.
        </p>
        <p>
          That behaviour is gated on the <code>go</code> line in your <code>go.mod</code> being 1.23
          or later — the same language-version gating you saw with <code>GOMAXPROCS</code>{' '}
          in <a href="/go/goroutines">the goroutines lesson</a>. This note is from the Go release
          documentation rather than measured here; proving a negative about GC behaviour is not
          something a short program does honestly.
        </p>
      </InfoBox>

      <h2>&quot;Share Memory By Communicating&quot;</h2>

      <p>
        The slogan from the Go team is: <em>do not communicate by sharing memory; share memory by
        communicating.</em> The practical content is <strong>ownership transfer</strong>. Instead
        of two goroutines locking a shared buffer, one goroutine owns the buffer, sends it down a
        channel, and <em>stops touching it</em>. At any moment exactly one goroutine can reach the
        data, so there is nothing to protect.
      </p>

      <CodeBlock language="go" title="main.go — request/response, no shared state at all">
{`type req struct {
    n     int
    reply chan int      // the caller supplies the channel its answer comes back on
}

reqs := make(chan req)
go func() {             // the owner of the computation
    for r := range reqs {
        r.reply <- r.n * r.n
    }
}()

for _, n := range []int{3, 4, 5} {
    reply := make(chan int, 1)
    reqs <- req{n: n, reply: reply}
    fmt.Printf("%d squared = %d\\n", n, <-reply)
}
close(reqs)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`3 squared = 9
4 squared = 16
5 squared = 25`}
      </CodeBlock>

      <p>
        Note the <code>reply</code> channel has capacity 1. That is the &quot;exactly N known
        sends&quot; rule from earlier: the server can always complete its send even if the caller
        has wandered off, so the server goroutine can never be stranded.
      </p>

      <h3>The compiler will not enforce the transfer</h3>

      <p>
        &quot;Share memory by communicating&quot; is a discipline, not a guarantee. Sending a
        pointer down a channel does not revoke the sender&apos;s access to it:
      </p>

      <CodeBlock language="go" title="main.go — ownership transferred, then violated">
{`type Buf struct{ data []byte }

ch := make(chan *Buf)
go func() {                     // consumer: now the sole owner
    for b := range ch {
        b.data = append(b.data, 'X')
    }
}()

b := &Buf{data: []byte("hello")}
ch <- b                         // ownership transferred...
b.data[0] = 'H'                 // ...and then violated
close(ch)
wg.Wait()
fmt.Println(string(b.data))`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go run ./c10
HelloX                                   # looks perfectly fine

$ go run -race ./c10
==================
WARNING: DATA RACE
Read at 0x00c00000e030 by main goroutine:
  main.main()
      /.../c10/main.go:24 +0x19c

Previous write at 0x00c00000e030 by goroutine 7:
  main.main.func1()
      /.../c10/main.go:18 +0x10c

Goroutine 7 (running) created at:
  main.main()
      /.../c10/main.go:15 +0xf8
==================
HelloX

(5 consecutive runs under -race: 5 for 5 reported the race.)`}
      </CodeBlock>

      <p>
        The plain build printed the &quot;right&quot; answer. Only the race detector saw the
        problem. The habit to build: <strong>once you send a pointer, treat the variable as
        dead.</strong> Where you can, send values rather than pointers, or re-assign{' '}
        <code>b = nil</code> after the send so a later use is a visible nil panic rather than an
        invisible race.
      </p>

      <h2>When Channels Are the Wrong Tool</h2>

      <p>
        This needs saying before you read the next lesson, because &quot;Go prefers channels&quot;
        gets over-applied badly. Channels are for <strong>transferring ownership</strong> and{' '}
        <strong>coordinating</strong> — moving a value from one goroutine to another, signalling
        that something happened, bounding concurrency, fanning work out and results back. They are
        not a general-purpose replacement for a lock.
      </p>

      <FlowChart
        title="Channel or mutex?"
        chart={"graph TD\n  Q{\"What am I actually doing?\"}\n  Q -->|\"moving a value from goroutine A to goroutine B\"| CH[\"CHANNEL\"]\n  Q -->|\"signalling that something happened or should stop\"| CH2[\"CHANNEL - close for broadcast\"]\n  Q -->|\"limiting how many things run at once\"| CH3[\"CHANNEL as a semaphore\"]\n  Q -->|\"waiting for N goroutines to finish\"| WG[\"sync.WaitGroup\"]\n  Q -->|\"guarding a counter, map, cache or struct field\"| MU[\"sync.Mutex or sync/atomic\"]\n  Q -->|\"initialise exactly once\"| ON[\"sync.Once\"]\n  MU --> W[\"Using a channel here is a classic beginner mistake:<br/>slower, more code, and harder to read\"]"}
      />

      <p>
        The measured version of that warning — a channel-guarded counter is roughly{' '}
        <strong>2.3x slower than a mutex and 4.5x slower than an atomic</strong> on this machine —
        is in <a href="/go/sync">the next lesson</a>, along with the data race it is usually
        reached for to avoid.
      </p>

      <InfoBox variant="success" title="Channel checklist">
        <ul>
          <li>Default to unbuffered. Buffer only for a reason you can state.</li>
          <li>The sender closes. If there are many senders, add a WaitGroup and one closer.</li>
          <li>Use <code>chan&lt;-</code> / <code>&lt;-chan</code> in every signature.</li>
          <li>
            Use comma-ok, not a sentinel value, to detect the end of a stream.
          </li>
          <li>
            <code>close(done)</code> for broadcast; <code>chan struct{}</code> for pure signals.
          </li>
          <li>
            Every send in a long-lived goroutine should be in a <code>select</code> with{' '}
            <code>ctx.Done()</code>, or it is a leak waiting to happen.
          </li>
          <li>
            <code>select</code> is random, not prioritised. Nil a case to retire it; never leave a
            closed case in a loop.
          </li>
          <li>
            If you are protecting a field rather than moving a value, you want a mutex.
          </li>
        </ul>
      </InfoBox>

      <p>
        Next: <a href="/go/sync">the sync package</a> — mutexes, WaitGroups, atomics, a real data
        race caught by <code>go run -race</code>, and the cases where reaching for a channel is
        actively the wrong call.
      </p>
    </LessonLayout>
  );
}
