import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Sync() {
  return (
    <LessonLayout
      title="The sync Package — and When Not to Use Channels"
      sectionId="go"
      lessonIndex={11}
      prev={{ path: '/go/channels', label: 'Channels & select' }}
      next={{ path: '/go/context', label: 'Context: Cancellation & Deadlines' }}
    >
      <p>
        The <a href="/go/channels">channels lesson</a> ended with a warning, and this lesson is the
        corrective. &quot;Go prefers channels&quot; is true in a narrow sense and badly
        over-applied. The distinction is one sentence long and worth memorising before you read
        anything else on this page:
      </p>

      <InfoBox variant="danger" title="The whole lesson in one line">
        <p>
          <strong>A channel transfers ownership and coordinates. A mutex protects shared
          state.</strong> If a value is <em>moving</em> from goroutine A to goroutine B, that is a
          channel. If several goroutines all need to <em>touch the same field</em>, that is a
          mutex or an atomic. Reaching for a channel to guard a counter is the classic beginner
          mistake: more code, harder to read, and — measured at the end of this lesson —{' '}
          <strong>~2.2x slower than the mutex under contention and ~38x slower
          uncontended</strong>.
        </p>
      </InfoBox>

      <p>
        Everything here exists because of the inversion from{' '}
        <a href="/go/goroutines">the goroutines lesson</a>: goroutines run genuinely in parallel, so
        shared mutable state is a real hazard rather than a theoretical one. If you are coming from
        Node, this is the single biggest behavioural change in the language, and it is worth seeing
        both halves of it run.
      </p>

      <h2>First, Why You Never Had To Think About This in Node</h2>

      <p>
        A thousand concurrent tasks, each incrementing one shared variable a thousand times. In
        Node, this is not a trick question:
      </p>

      <CodeBlock language="javascript" title="nodecount.mjs">
{`// The exact same shape as the Go program below: 1000 concurrent tasks,
// 1000 increments each, on one shared variable.
let n = 0;

async function worker() {
  for (let j = 0; j < 1000; j++) {
    n++;                       // no lock. Cannot race. Ever.
  }
}

const tasks = [];
for (let i = 0; i < 1000; i++) tasks.push(worker());
await Promise.all(tasks);
console.log('want 1000000, got', n);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Node v25.2.1, five consecutive runs">
{`want 1000000, got 1000000
want 1000000, got 1000000
want 1000000, got 1000000
want 1000000, got 1000000
want 1000000, got 1000000`}
      </CodeBlock>

      <p>
        Exactly right, every time, with no synchronisation at all. That is not luck and it is not
        the JIT being clever — it is the event loop. Only one of those tasks is ever executing,{' '}
        <code>n++</code> runs to completion before anything else gets a turn, and a data race is
        not expressible. The years you have spent not writing locks were years of the runtime
        making locks unnecessary.
      </p>

      <h2>The Same Program in Go</h2>

      <CodeBlock language="go" title="main.go — no lock, 1000 goroutines">
{`type Counter struct {
    n int
}

func (c *Counter) Inc() { c.n++ }

func main() {
    c := &Counter{}
    var wg sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := 0; j < 1000; j++ {
                c.Inc()
            }
        }()
    }
    wg.Wait()
    fmt.Println("want 1000000, got", c.n)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5 darwin/arm64, five consecutive runs">
{`want 1000000, got 475804
want 1000000, got 330686
want 1000000, got 345286
want 1000000, got 366452
want 1000000, got 367602`}
      </CodeBlock>

      <p>
        Between half and two thirds of the increments vanished, and the number is different every
        run. It compiled without a warning. There is no exception, no error value, no log line —
        just a wrong answer, silently, forever.
      </p>

      <p>
        The reason is that <code>c.n++</code> is not one operation. It is a load, an add, and a
        store, and two cores can interleave them:
      </p>

      <FlowChart
        title="What a lost update actually looks like"
        chart={"sequenceDiagram\n    participant A as goroutine A on core 1\n    participant M as RAM - the variable n\n    participant B as goroutine B on core 2\n    Note over M: n == 41\n    A->>M: LOAD n\n    M-->>A: 41\n    B->>M: LOAD n\n    M-->>B: 41\n    Note over A: register = 41 + 1 = 42\n    Note over B: register = 41 + 1 = 42\n    A->>M: STORE 42\n    B->>M: STORE 42\n    Note over M: n == 42 - two increments, one counted\n    Note over A,B: c.n++ is three machine steps, not one. Nothing is protecting them."}
      />

      <InfoBox variant="note" title="If you have written C++, you already know this half">
        <p>
          The mechanism is identical to a non-<code>atomic</code> <code>int</code> shared between{' '}
          <code>std::thread</code>s, and the Go memory model is deliberately close to the C++11
          one. What is <em>not</em> the same is the tooling: Go ships the race detector in the
          toolchain and a plain <code>go run -race</code> turns it on. No separate build of
          TSan, no instrumented libc.
        </p>
      </InfoBox>

      <h2><code>go run -race</code>: The Most Valuable Flag in Go</h2>

      <p>
        The race detector instruments every memory access and every synchronisation operation, then
        reports any pair of accesses to the same address that are not ordered by a happens-before
        relationship. Run the broken counter under it:
      </p>

      <CodeBlock language="text" title="Real output — go run -race ./y01, go1.25.5 (first of two reported races, abridged paths)">
{`==================
WARNING: DATA RACE
Read at 0x00c0000ae018 by goroutine 9:
  main.(*Counter).Inc()
      /.../y01/main.go:12 +0x90
  main.main.func1()
      /.../y01/main.go:22 +0x8c

Previous write at 0x00c0000ae018 by goroutine 8:
  main.(*Counter).Inc()
      /.../y01/main.go:12 +0xa0
  main.main.func1()
      /.../y01/main.go:22 +0x8c

Goroutine 9 (running) created at:
  main.main()
      /.../y01/main.go:19 +0x6c

Goroutine 8 (finished) created at:
  main.main()
      /.../y01/main.go:19 +0x6c
==================
want 1000000, got 511889
Found 2 data race(s)
exit status 66`}
      </CodeBlock>

      <p>
        Read that report structurally, because you will read a lot of them. It names{' '}
        <strong>the address</strong>, <strong>both accesses</strong> with full stacks, and —
        uniquely useful — <strong>where each goroutine was created</strong>. The last part is what
        turns &quot;something races&quot; into &quot;line 19 launches it&quot;. Note{' '}
        <code>exit status 66</code>: a detected race makes the process fail, which is exactly what
        you want in CI.
      </p>

      <InfoBox variant="warning" title="What the race detector can and cannot do">
        <ul>
          <li>
            <strong>It only reports races it actually observes.</strong> A code path that did not
            execute, or an interleaving that did not happen on this run, is not reported. It finds
            no races in untested code. Run it against your real test suite, not a toy main.
          </li>
          <li>
            <strong>It has no false positives.</strong> If it reports a race, there is a race. That
            is unusual and valuable — treat every report as a bug, never as noise.
          </li>
          <li>
            <strong>It is expensive.</strong> Measured here on the lock-heavy fixed version of this
            same program (one million mutex round-trips), <code>/usr/bin/time -l</code> on the
            compiled binaries: <strong>0.29s / 8.0 MB RSS plain versus 2.03s / 349 MB RSS with{' '}
            <code>-race</code></strong> — 7x the wall time and 44x the memory. A lock-heavy
            microbenchmark is close to the worst case, but the shape is right. So:{' '}
            <code>go test -race ./...</code> in CI, not <code>-race</code> in production. (Though a
            single canary instance built with <code>-race</code> is a legitimate tactic for a bug
            you cannot reproduce.)
          </li>
          <li>
            <strong>It cannot see logical races.</strong> Two correctly-locked operations that
            should have been one operation is a bug the detector will never mention. There is a
            measured example of exactly that in the atomics section below.
          </li>
        </ul>
      </InfoBox>

      <h3>Maps get a second, louder detector</h3>

      <p>
        Concurrent writes to a built-in map are so corrupting that the runtime checks for them
        unconditionally, even without <code>-race</code>:
      </p>

      <CodeBlock language="go" title="main.go — eight goroutines writing one unguarded map">
{`m := map[int]int{}
var wg sync.WaitGroup
for i := 0; i < 8; i++ {
    wg.Go(func() {
        for j := 0; j < 100000; j++ {
            m[j] = j            // unguarded concurrent map write
        }
    })
}
wg.Wait()
fmt.Println("len =", len(m))`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, plain go run, no -race (3 of 3 runs identical)">
{`fatal error: concurrent map writes

goroutine 14 [running]:
internal/runtime/maps.fatal({0x102b013c0?, 0x0?})
	/usr/local/go/src/runtime/panic.go:1046 +0x20
main.main.func1()
	/.../y15/main.go:14 +0x3c
sync.(*WaitGroup).Go.func1()`}
      </CodeBlock>

      <p>
        Two details matter. It says <strong><code>fatal error</code>, not <code>panic</code></strong>
        {' '}— a fatal error is not recoverable, so no <code>defer recover()</code> anywhere will
        save the process. And it fired on all three runs without the race detector, which makes it
        the one data race in Go you are likely to find in development rather than in production.
        The flip side: concurrent map <em>reads</em> are fine, and a read racing a write is{' '}
        <em>not</em> reliably caught by this check — only by <code>-race</code>.
      </p>

      <h2><code>sync.Mutex</code></h2>

      <p>
        A mutex makes a region of code mutually exclusive. The zero value is a ready-to-use
        unlocked mutex, so there is no constructor and no initialisation step.
      </p>

      <CodeBlock language="go" title="main.go — the fix">
{`type Counter struct {
    mu sync.Mutex
    n  int
}

func (c *Counter) Inc() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.n++
}

// Reading needs the lock too. "I am only reading" is still a data race.
func (c *Counter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.n
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, three plain runs then once under -race">
{`$ go run ./y02
want 1000000, got 1000000
want 1000000, got 1000000
want 1000000, got 1000000

$ go run -race ./y02; echo $?
want 1000000, got 1000000
0`}
      </CodeBlock>

      <p>
        Note <code>Value()</code>. The commonest incomplete fix is to lock the writes and leave the
        reads bare, on the theory that a read cannot corrupt anything. It can: the reader may
        observe a half-written value, and more importantly the compiler and CPU are entitled to
        reorder and cache an unsynchronised read however they like. <strong>Every access to a
        guarded field goes through the lock, including reads.</strong>
      </p>

      <h3>The surface is four methods</h3>

      <CodeBlock language="go" title="All of sync.Mutex and sync.RWMutex">
{`var mu sync.Mutex
mu.Lock()                 // block until acquired
mu.Unlock()               // release
if mu.TryLock() {         // Go 1.18+: acquire or give up immediately.
    defer mu.Unlock()     // Rarely the right tool; usually a design smell.
}

var rw sync.RWMutex
rw.Lock()   / rw.Unlock()    // writer: exclusive
rw.RLock()  / rw.RUnlock()   // reader: shared with other readers
rw.TryLock() / rw.TryRLock()
rw.RLocker()                 // returns a sync.Locker whose Lock() is RLock()`}
      </CodeBlock>

      <InfoBox variant="tip" title="Use defer, with one exception">
        <p>
          <code>defer mu.Unlock()</code> on the line after <code>mu.Lock()</code> is the default,
          because it survives every early <code>return</code> and every panic in between. The one
          case for unlocking manually is when the critical section is a small part of a long
          function and you want to release the lock before doing slow work:
        </p>
        <CodeBlock language="go" title="Manual unlock to keep the critical section short">
{`func (c *Cache) Refresh(k string) error {
    c.mu.Lock()
    stale := c.entries[k].age > time.Hour
    c.mu.Unlock()                      // release BEFORE the network call

    if !stale {
        return nil
    }
    v, err := fetchFromUpstream(k)     // slow. Holding a lock here would
    if err != nil {                    // serialise every caller.
        return err
    }

    c.mu.Lock()
    defer c.mu.Unlock()
    c.entries[k] = v
    return nil
}`}
        </CodeBlock>
        <p>
          The rule of thumb: <strong>never make a network call, a disk call, or a channel send
          while holding a lock.</strong> That is how a mutex turns into a service-wide stall, and
          it is how two locks turn into a deadlock.
        </p>
      </InfoBox>

      <h3>A Go mutex is not reentrant. Java&apos;s <code>synchronized</code> is.</h3>

      <p>
        This one catches Java developers in week one, and it does so loudly. In Java, a monitor is
        held by a <em>thread</em>, and a thread that already holds it can re-enter freely:
      </p>

      <CodeBlock language="java" title="Reentrant.java">
{`public class Reentrant {
    private int balance = 100;

    public synchronized int balance() {
        return balance;
    }

    public synchronized void deposit(int n) {
        System.out.println("deposit holds the monitor; calling balance()...");
        balance = balance() + n;   // re-enters the SAME monitor
    }

    public static void main(String[] args) {
        Reentrant a = new Reentrant();
        a.deposit(50);
        System.out.println("fine: balance = " + a.balance());
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — java 26.0.1">
{`deposit holds the monitor; calling balance()...
fine: balance = 150`}
      </CodeBlock>

      <p>The structurally identical Go program does not work:</p>

      <CodeBlock language="go" title="main.go">
{`type Account struct {
    mu      sync.Mutex
    balance int
}

func (a *Account) Balance() int {
    a.mu.Lock()
    defer a.mu.Unlock()
    return a.balance
}

// BUG: Deposit holds the lock, then calls Balance, which tries to take it again.
func (a *Account) Deposit(n int) {
    a.mu.Lock()
    defer a.mu.Unlock()
    fmt.Println("Deposit holds the lock; calling Balance()...")
    a.balance = a.Balance() + n
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, exit status 2">
{`Deposit holds the lock; calling Balance()...
fatal error: all goroutines are asleep - deadlock!

goroutine 1 [sync.Mutex.Lock]:
internal/sync.runtime_SemacquireMutex(0x1400010ee18?, 0x88?, 0x2d?)
	/usr/local/go/src/runtime/sema.go:95 +0x28
internal/sync.(*Mutex).lockSlow(0x140000ae010)
	/usr/local/go/src/internal/sync/mutex.go:149 +0x170
sync.(*Mutex).Lock(...)
	/usr/local/go/src/sync/mutex.go:46
main.(*Account).Balance(0x140000ae010)
	/.../y13/main.go:14 +0x78
main.(*Account).Deposit(0x140000ae010, 0x32)
	/.../y13/main.go:24 +0xd4
main.main()
	/.../y13/main.go:29 +0x38
exit status 2`}
      </CodeBlock>

      <p>
        A Go mutex has <strong>no owner</strong>. It is a token, not a thread-associated monitor, so
        the runtime cannot know that the goroutine asking for it is the one that already has it. The
        standard fix is the one you would use in C++ too: split each guarded method into a public
        locking wrapper and an unexported method that assumes the lock is already held.
      </p>

      <CodeBlock language="go" title="The locked/unlocked method pair">
{`// Exported: takes the lock, delegates.
func (a *Account) Balance() int {
    a.mu.Lock()
    defer a.mu.Unlock()
    return a.balanceLocked()
}

func (a *Account) Deposit(n int) {
    a.mu.Lock()
    defer a.mu.Unlock()
    a.balance = a.balanceLocked() + n
}

// The "Locked" suffix is the convention. It means: the caller MUST
// already hold a.mu. Never call this from outside the type.
func (a *Account) balanceLocked() int { return a.balance }`}
      </CodeBlock>

      <p>
        The no-owner property has a positive side too, and it is something Java&apos;s{' '}
        <code>synchronized</code> simply cannot express: one goroutine may lock a mutex and a{' '}
        <em>different</em> goroutine may unlock it.
      </p>

      <CodeBlock language="go" title="main.go — locked in main, unlocked elsewhere">
{`var mu sync.Mutex

mu.Lock()
go func() {
    time.Sleep(50 * time.Millisecond)
    fmt.Println("a DIFFERENT goroutine is unlocking it")
    mu.Unlock()
}()
start := time.Now()
mu.Lock()                        // blocks until the other goroutine unlocks
fmt.Printf("main re-acquired it after %v\\n", time.Since(start).Round(10*time.Millisecond))
mu.Unlock()

fmt.Println("about to unlock an already-unlocked mutex")
mu.Unlock()
fmt.Println("never reached")`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`a DIFFERENT goroutine is unlocking it
main re-acquired it after 50ms
about to unlock an already-unlocked mutex
fatal error: sync: unlock of unlocked mutex

goroutine 1 [running]:
internal/sync.fatal({0x102825042?, 0x2a?})
	/usr/local/go/src/runtime/panic.go:1056 +0x20
internal/sync.(*Mutex).unlockSlow(0x14000092020, 0xffffffff)
	/usr/local/go/src/internal/sync/mutex.go:204 +0x38`}
      </CodeBlock>

      <p>
        And that second half is the cost of the same property: because the mutex does not know who
        holds it, an unbalanced <code>Unlock</code> is only detectable as{' '}
        <code>fatal error: sync: unlock of unlocked mutex</code> at runtime. Another reason to use{' '}
        <code>defer</code>.
      </p>

      <h2>Where To Put the Lock</h2>

      <p>
        A mutex is only useful if it is impossible to bypass, and Go gives you exactly the tool for
        that: unexported fields. Put the mutex and the data it guards in the same struct, keep both
        unexported, and expose methods. That is the entire technique.
      </p>

      <FlowChart
        title="A correctly guarded type — the lock cannot be bypassed"
        chart={"graph TD\n  C1[\"caller goroutine 1\"] --> G1[\"Get(k) (string, bool)\"]\n  C2[\"caller goroutine 2\"] --> S1[\"Set(k, v)\"]\n  C3[\"caller goroutine 3\"] --> S1\n  subgraph PKG[\"package cache - the lock is an implementation detail\"]\n    G1 --> MU[\"mu sync.RWMutex<br/>unexported\"]\n    S1 --> MU\n    MU -.->|\"guards, and only ever this\"| D[\"entries map[string]string<br/>unexported\"]\n  end\n  D -.-> X[\"Callers cannot reach entries at all:<br/>it is unexported, so the lock cannot be bypassed.<br/>This is the whole technique.\"]"}
      />

      <CodeBlock language="go" title="cache.go — the shape to copy">
{`// Cache is safe for concurrent use. The mutex and the map are both
// unexported, so callers physically cannot bypass the lock.
type Cache struct {
    mu      sync.RWMutex
    entries map[string]string
}

func NewCache() *Cache {
    return &Cache{entries: make(map[string]string)}
}

func (c *Cache) Get(k string) (string, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    v, ok := c.entries[k]
    return v, ok
}

func (c *Cache) Set(k, v string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.entries[k] = v
}

// Len needs the read lock too. "Just reading" is still a race.
func (c *Cache) Len() int {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return len(c.entries)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — 200 goroutines hammering it, go1.25.5">
{`$ go vet ./y14; echo $?
0
$ go run -race ./y14; echo $?
len = 50
0`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two leaks of the guarantee to watch for">
        <p>
          The pattern breaks the moment a method hands out something that aliases the guarded data.
          Both of these look harmless and both reintroduce the race:
        </p>
        <CodeBlock language="go" title="Returning a reference to guarded state">
{`// BAD: the caller now holds the same map the lock was protecting.
func (c *Cache) All() map[string]string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.entries                 // alias escapes with no lock attached
}

// BAD: same problem via a slice. See the slices lesson on aliasing.
func (c *Cache) Keys() []string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.keys                    // backing array escapes
}

// GOOD: return a copy, or a callback that runs under the lock.
func (c *Cache) Snapshot() map[string]string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    out := make(map[string]string, len(c.entries))
    for k, v := range c.entries {
        out[k] = v
    }
    return out
}`}
        </CodeBlock>
        <p>
          The <a href="/go/slices">aliasing traps from the slices and maps lesson</a> are not
          separate knowledge from concurrency — under a mutex they become race conditions. The same
          goes for returning a <code>*T</code> to a guarded struct.
        </p>
      </InfoBox>

      <h2><code>sync.RWMutex</code>: Readers in Parallel</h2>

      <p>
        An <code>RWMutex</code> allows any number of concurrent <code>RLock</code> holders, or
        exactly one <code>Lock</code> holder, never both. If reads dominate and each read is more
        than a few nanoseconds, the difference is dramatic:
      </p>

      <CodeBlock language="go" title="main.go — 8 readers, 50ms of read work each">
{`// A. plain Mutex: readers serialise
var mu sync.Mutex
for i := 0; i < 8; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        mu.Lock()
        time.Sleep(work)             // stand-in for a read
        mu.Unlock()
    }()
}

// B. RWMutex: readers overlap
var rw sync.RWMutex
for i := 0; i < 8; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        rw.RLock()
        time.Sleep(work)
        rw.RUnlock()
    }()
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, two consecutive runs">
{`Mutex:   8 readers x 50ms of read work took 408ms
RWMutex: 8 readers x 50ms of read work took 51ms

Mutex:   8 readers x 50ms of read work took 407ms
RWMutex: 8 readers x 50ms of read work took 50ms`}
      </CodeBlock>

      <p>
        8x, which is the number of readers — they all overlapped. That is the best case for{' '}
        <code>RWMutex</code>, and it is the shape of a config struct or a lookup table read by
        every request handler.
      </p>

      <InfoBox variant="warning" title="RWMutex is not a free upgrade">
        <ul>
          <li>
            <strong>It is slower than <code>Mutex</code> when uncontended.</strong> Measured below:
            4.5 ns/op versus 2.0 ns/op for an uncontended write. There is more bookkeeping. If your
            critical section is <code>n++</code>, <code>RWMutex</code> is a pessimisation.
          </li>
          <li>
            <strong>The crossover is not where you think.</strong> It needs both a read-heavy mix{' '}
            <em>and</em> critical sections long enough for overlap to pay for the extra atomics.
            For a map lookup under light contention, a plain <code>Mutex</code> often wins. Measure.
          </li>
          <li>
            <strong><code>RLock</code> is not reentrant either</strong>, and recursive read-locking
            can deadlock: if a writer is queued between your outer and inner <code>RLock</code>,
            the inner one waits for the writer and the writer waits for your outer one.
          </li>
          <li>
            <strong>Do not upgrade a lock.</strong> There is no <code>RLock</code>-to-<code>Lock</code>
            {' '}promotion. <code>RUnlock</code> then <code>Lock</code> means the state can change
            in between, so re-check your condition after acquiring the write lock.
          </li>
        </ul>
      </InfoBox>

      <h2>Copying a Mutex Is a Silent Bug — and <code>go vet</code> Catches It</h2>

      <p>
        <code>sync.Mutex</code> is a struct value. Copying it copies the lock state, producing two
        independent locks that protect nothing. Combined with Go&apos;s value receivers — see{' '}
        <a href="/go/pointers">pointers and value semantics</a> — this is very easy to do by
        accident:
      </p>

      <CodeBlock language="go" title="main.go — three copies, three bugs">
{`type Counter struct {
    mu sync.Mutex
    n  int
}

// BUG 1: value receiver. Each call locks a COPY of the mutex and
// increments a COPY of n.
func (c Counter) IncByValue() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.n++
}

// BUG 2: taking the struct by value copies the lock.
func report(c Counter) {
    fmt.Println("report sees n =", c.n)
}

func main() {
    c := Counter{}
    // ... 100 goroutines calling c.IncByValue() ...
    report(c)                        // BUG 3: the call site copies it
    fmt.Println("want 100, got", c.n)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go vet ./y04; echo $?
# goconc/y04
# [goconc/y04]
y04/main.go:15:9: IncByValue passes lock by value: goconc/y04.Counter contains sync.Mutex
y04/main.go:22:15: report passes lock by value: goconc/y04.Counter contains sync.Mutex
y04/main.go:37:9: call of report copies lock value: goconc/y04.Counter contains sync.Mutex
1

$ go run ./y04
report sees n = 0
want 100, got 0

$ go run -race ./y04; echo $?       # the race detector finds NOTHING
report sees n = 0
want 100, got 0
0`}
      </CodeBlock>

      <InfoBox variant="danger" title="This is the case -race cannot help with">
        <p>
          Every goroutine locked and mutated its own private copy, so there is no concurrent access
          to a shared address and therefore <em>no data race to detect</em>. The program is
          deterministically, quietly wrong: <code>got 0</code>, every time, under{' '}
          <code>-race</code> and without it.
        </p>
        <p>
          <code>go vet</code>&apos;s <code>copylocks</code> analyser is the only thing that finds
          it, and it is why <strong><code>go vet ./...</code> belongs in CI next to{' '}
          <code>go test -race ./...</code></strong>. They catch disjoint sets of bugs.{' '}
          <code>go test</code> runs a subset of vet automatically;{' '}
          <code>go run</code> and <code>go build</code> do not.
        </p>
        <p>
          The mechanical rule that avoids the whole class:{' '}
          <strong>a struct containing a mutex is always used through a pointer.</strong> Pointer
          receivers on every method, <code>*T</code> in every signature, and never embed it in
          something that gets copied — including as a map value, since{' '}
          <code>m[k].mu.Lock()</code> is not even addressable.
        </p>
      </InfoBox>

      <h2><code>sync.WaitGroup</code>: Waiting for N Things</h2>

      <p>
        A <code>WaitGroup</code> is a counter with a &quot;block until zero&quot; operation. It is
        the direct replacement for <code>Thread.join()</code> in a loop, and for the structural
        role of <code>Promise.all</code> — though not its result-collecting role, which it does not
        do at all.
      </p>

      <FlowChart
        title="WaitGroup is one counter and three operations"
        chart={"graph LR\n  A[\"var wg sync.WaitGroup<br/>counter = 0\"] -->|\"wg.Add(3) in the PARENT, before go\"| B[\"counter = 3\"]\n  B --> C[\"three goroutines running\"]\n  C -->|\"defer wg.Done()\"| D[\"counter = 2\"]\n  D -->|\"defer wg.Done()\"| E[\"counter = 1\"]\n  E -->|\"defer wg.Done()\"| F[\"counter = 0\"]\n  F --> G[\"every goroutine blocked in Wait() is released\"]\n  B -.->|\"main calls wg.Wait()\"| H[\"main parks until the counter reaches 0\"]\n  H --> G"}
      />

      <CodeBlock language="go" title="The classic form, and the Go 1.25 form">
{`// The form you will see in every codebase written before 2025.
var wg sync.WaitGroup
for _, job := range jobs {
    wg.Add(1)
    go func() {
        defer wg.Done()        // defer, so a panic still decrements
        process(job)
    }()
}
wg.Wait()

// Go 1.25 added (*WaitGroup).Go, which does Add(1), launches, and
// defers Done() for you. Same semantics, three fewer ways to get it wrong.
var wg2 sync.WaitGroup
for _, job := range jobs {
    wg2.Go(func() { process(job) })
}
wg2.Wait()`}
      </CodeBlock>

      <InfoBox variant="info" title="wg.Go and the go.mod version gate">
        <p>
          <code>(*sync.WaitGroup).Go</code> is new in Go 1.25. Unlike a <em>language</em> feature,
          a new standard-library method is not rejected by the compiler when your{' '}
          <code>go.mod</code> declares an older language version — but <code>go vet</code> is. Both
          halves measured on the installed go1.25.5 toolchain with{' '}
          <code>go 1.24</code> in <code>go.mod</code>:
        </p>
        <CodeBlock language="text" title="Real output — module declares go 1.24, toolchain is go1.25.5">
{`$ go run .
hi                              # compiles and runs fine

$ go vet ./...
# old124
./main.go:10:5: sync.Go requires go1.25 or later (module is go1.24)`}
        </CodeBlock>
        <p>
          That is vet&apos;s <code>stdversion</code> analyser, and it is the reason{' '}
          <code>go vet</code> is the gate that actually protects you from shipping a symbol your
          declared minimum Go cannot provide. The same language-version gating showed up for{' '}
          <code>GOMAXPROCS</code> in <a href="/go/goroutines">the goroutines lesson</a> and{' '}
          <code>time.After</code> in <a href="/go/channels">the channels lesson</a>. If you are on
          an older toolchain, write the <code>Add</code>/<code>Done</code> form; it is not going
          anywhere.
        </p>
      </InfoBox>

      <h3>The misuse: <code>Add</code> inside the goroutine</h3>

      <p>
        This is the most common <code>WaitGroup</code> bug and it reads as completely reasonable —
        the <code>Add</code> is right next to the work it is counting.
      </p>

      <CodeBlock language="go" title="main.go — wrong">
{`var wg sync.WaitGroup
var done atomic.Int64

for i := 0; i < 100; i++ {
    go func() {
        wg.Add(1)              // WRONG: main may reach Wait() before this runs
        defer wg.Done()
        done.Add(1)
    }()
}
wg.Wait()
fmt.Printf("Wait() returned after %d of 100 tasks finished\\n", done.Load())`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, 60 runs of the compiled binary">
{`  18 runs:  Wait() returned after 86 of 100 tasks finished
   9 runs:  Wait() returned after 90 of 100 tasks finished
   6 runs:  Wait() returned after 91 of 100 tasks finished
   5 runs:  Wait() returned after 95 of 100 tasks finished
   4 runs:  Wait() returned after 93 of 100 tasks finished
   4 runs:  Wait() returned after 70 of 100 tasks finished
   ...  (13 further distinct values between 76 and 99)

Not one of the 60 runs reached 100.`}
      </CodeBlock>

      <p>
        <code>Wait()</code> saw the counter at zero before most of the goroutines had been scheduled
        at all, so it returned immediately. In a real program this means the results slice is
        partly empty, or the shutdown proceeds while handlers are still running — a bug that
        reproduces in production under load and never on your laptop.
      </p>

      <InfoBox variant="tip" title="-race turns some of it into a loud failure">
        <p>
          The race detector instruments <code>WaitGroup</code>, and the runtime has an explicit
          assertion for this case. Measured on the same program:
        </p>
        <CodeBlock language="text" title="Real output — go1.25.5">
{`plain binary:  'WaitGroup misuse' panic in   0 of 100 runs   (silently wrong instead)
-race binary:  'WARNING: DATA RACE' in        9 of  20 runs
-race binary:  'WaitGroup misuse' panic in    3 of  40 runs

panic: sync: WaitGroup misuse: Add called concurrently with Wait

goroutine 100 [running]:
sync.(*WaitGroup).Add(0xc0000aa030, 0xffffffffffffffff)
	/usr/local/go/src/sync/waitgroup.go:132 +0x240
sync.(*WaitGroup).Done(0xc0000aa030)
	/usr/local/go/src/sync/waitgroup.go:156 +0x30
main.main.func1()
	/.../y03/main.go:18 +0x80
created by main.main in goroutine 1
	/.../y03/main.go:14 +0x70`}
        </CodeBlock>
        <p>
          Note how differently the two builds behave. The plain binary never once reported anything
          — not in 100 runs — while silently returning a wrong count in all 60 of the runs measured
          above. The instrumented binary complained on roughly half. That contrast is the argument
          for <code>-race</code> in CI, in a single table.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="WaitGroup rules">
{`1. Add() runs in the goroutine that calls Wait(), BEFORE 'go'.
   Or: use wg.Go and the question cannot arise.
2. Done() goes in a defer, so a panic in the body still decrements.
3. Never copy a WaitGroup. Pass *sync.WaitGroup; go vet enforces it.
4. Reuse is legal but fragile: a new Add must not race a pending Wait.
   Prefer a fresh WaitGroup per batch.
5. A WaitGroup carries no result and no error. If you need either,
   you want a channel or errgroup - see the patterns lesson.
6. Add(-1) is legal and equals Done(). Going negative panics:
   "sync: negative WaitGroup counter".`}
      </CodeBlock>

      <h2><code>sync.Once</code>: Exactly Once, Even Under a Stampede</h2>

      <p>
        <code>Once.Do(f)</code> runs <code>f</code> exactly once across all goroutines, for the
        life of the <code>Once</code>. Every other caller <em>blocks until that first call
        returns</em> — which is the part that makes it more than an atomic boolean.
      </p>

      <CodeBlock language="go" title="main.go — 50 goroutines, one dial">
{`var (
    initCalls atomic.Int64
    once      sync.Once
    conn      string
)

func connect() {
    initCalls.Add(1)
    time.Sleep(100 * time.Millisecond)   // pretend this is a real dial
    conn = "db-connection-1"
}

func Conn() string {
    once.Do(connect)
    return conn
}

// ... 50 goroutines all call Conn() at once ...`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`50 goroutines called Conn(); connect() ran 1 time(s)
all 50 returned after 100ms (one 100ms dial, not fifty)
conn = db-connection-1`}
      </CodeBlock>

      <p>
        If <code>Once</code> had used a compare-and-swap and returned, forty-nine goroutines would
        have raced ahead and read an empty <code>conn</code>. Instead they parked. That makes{' '}
        <code>Once</code> the correct answer to the cache-stampede problem, and the direct
        equivalent of a double-checked-locking holder class in Java or a memoised{' '}
        <code>Promise</code> in Node.
      </p>

      <CodeBlock language="go" title="Go 1.21 added three wrappers you will prefer">
{`// sync.OnceFunc(f)        -> func()
// sync.OnceValue(f)       -> func() T
// sync.OnceValues(f)      -> func() (T, error)

var lazyPort = sync.OnceValue(func() int {
    return 5432
})

var lazyCfg = sync.OnceValues(func() (string, error) {
    return "", errors.New("config missing")
})

// Call sites are plain function calls — no Once variable in scope to
// accidentally copy, and the lazy value cannot be read before init.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`5432 5432 5432
OnceValues cached the error too: config missing / config missing
the two helpers ran their functions 2 times total`}
      </CodeBlock>

      <InfoBox variant="warning" title="Once caches failure permanently">
        <p>
          Look at that second line. <code>OnceValues</code> ran the function once, it failed, and
          every subsequent call returns the <em>same cached error</em> forever — and plain{' '}
          <code>Once.Do</code> behaves the same way: the function is considered done even if it
          panicked or errored, and it will never be retried. There is no <code>Reset</code>.
        </p>
        <p>
          So <code>Once</code> is right for initialisation that <em>cannot</em> fail, or where
          permanent failure is the correct outcome (a malformed config at boot). For anything
          retryable — dialling a database, fetching a token — you want a mutex plus an
          explicit &quot;have I succeeded yet&quot; flag, or{' '}
          <a href="/go/concurrency-patterns"><code>golang.org/x/sync/singleflight</code></a>.
        </p>
      </InfoBox>

      <h2><code>sync.Map</code>: Narrower Than People Think</h2>

      <p>
        Everyone finds <code>sync.Map</code> while looking for &quot;a thread-safe map&quot; and
        most of them should not use it. Here is the package documentation, verbatim from the
        installed go1.25.5 toolchain:
      </p>

      <CodeBlock language="text" title="go doc sync.Map (excerpt) — go1.25.5">
{`Map is like a Go map[any]any but is safe for concurrent use by multiple
goroutines without additional locking or coordination. Loads, stores,
and deletes run in amortized constant time.

The Map type is specialized. Most code should use a plain Go map instead,
with separate locking or coordination, for better type safety and to make it
easier to maintain other invariants along with the map content.

The Map type is optimized for two common use cases: (1) when the entry for
a given key is only ever written once but read many times, as in caches
that only grow, or (2) when multiple goroutines read, write, and overwrite
entries for disjoint sets of keys. In these two cases, use of a Map may
significantly reduce lock contention compared to a Go map paired with a
separate Mutex or RWMutex.`}
      </CodeBlock>

      <p>
        &quot;Most code should use a plain Go map instead&quot; is the standard library telling you
        the default. But notice <em>why</em> it says so: &quot;for better type safety and to make it
        easier to maintain other invariants&quot;. It does not say &quot;because it is slow&quot;.
        That distinction matters, because the performance folklore is out of date.
      </p>

      <CodeBlock language="go" title="bench_test.go — 1024 pre-populated string keys, 14 goroutines">
{`// RWMutex-guarded plain map vs sync.Map, three access patterns:
//   ReadHeavy: 99% Load / 1% Store, keys cycled    -> sync.Map's case (1)
//   Mixed:     50% Load / 50% Store, keys cycled   -> close to case (2)
//   HotKey:    50/50 on ONE shared key             -> neither case`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test -bench=. -benchtime=2s -cpu=14, go1.25.5, Apple M4 Pro">
{`BenchmarkReadHeavy_RWMutex-14    	57819715	        40.49 ns/op
BenchmarkReadHeavy_SyncMap-14    	966547064	         2.559 ns/op     16x faster
BenchmarkMixed_RWMutex-14        	42190724	        59.57 ns/op
BenchmarkMixed_SyncMap-14        	100000000	        20.86 ns/op      2.9x faster
BenchmarkHotKey_RWMutex-14       	50607465	        43.84 ns/op
BenchmarkHotKey_SyncMap-14       	32612368	        77.66 ns/op     1.8x SLOWER`}
      </CodeBlock>

      <InfoBox variant="note" title="What those numbers do and do not say">
        <p>
          On this machine and this toolchain, <code>sync.Map</code> was{' '}
          <strong>substantially faster in both patterns the documentation describes</strong>, and
          lost only when every goroutine fought over a single key — which is precisely the case the
          docs exclude. If you have read older advice that <code>sync.Map</code> is simply slow,
          treat it with suspicion, because the implementation has changed. On the installed
          go1.25.5, <code>internal/buildcfg</code> has <code>SyncHashTrieMap: true</code> in the
          baseline experiment set, so <code>sync.Map</code> is the concurrent hash-trie version
          and that is what the numbers above measured. Rebuilding with the older read/dirty
          implementation moves them:
        </p>
        <CodeBlock language="text" title="Real output — same benchmark, two implementations, go1.25.5">
{`$ go test -bench=SyncMap -benchtime=2s -cpu=14 ./y10
BenchmarkReadHeavy_SyncMap-14    	741163555	         2.965 ns/op
BenchmarkMixed_SyncMap-14        	122354908	        19.41 ns/op

$ GOEXPERIMENT=nosynchashtriemap go test -bench=SyncMap -benchtime=2s -cpu=14 ./y10
BenchmarkReadHeavy_SyncMap-14    	631033779	         3.985 ns/op
BenchmarkMixed_SyncMap-14        	196981854	        11.23 ns/op`}
        </CodeBlock>
        <p>
          Which is a useful reminder on its own: the old implementation was actually{' '}
          <em>faster</em> on the mixed workload here and slower on the read-heavy one. Do not carry
          a performance claim about <code>sync.Map</code> across Go releases. Measure on your
          toolchain, with your access pattern.
        </p>
        <p>
          So the reason to default to a plain map plus a mutex is not speed. It is:
        </p>
        <ul>
          <li>
            <strong>No type safety.</strong> Keys and values are <code>any</code>. Every{' '}
            <code>Load</code> ends in a type assertion, and every <code>Store</code> of a
            non-pointer allocates to box the value. With <a href="/go/generics">generics</a> in the
            language this feels especially archaic.
          </li>
          <li>
            <strong>No invariants.</strong> You cannot hold the lock across two operations, because
            there is no lock to hold. &quot;Increment this entry&quot; is a{' '}
            <code>CompareAndSwap</code> retry loop. &quot;Update these two entries together&quot;
            is impossible.
          </li>
          <li>
            <strong>No <code>len</code>.</strong> There is no <code>Len</code> method, and{' '}
            <code>Range</code> is explicitly not a consistent snapshot — entries added or deleted
            during a <code>Range</code> may or may not be visited.
          </li>
          <li>
            <strong>Must not be copied after first use</strong>, like every other{' '}
            <code>sync</code> type. <code>go vet</code> enforces it.
          </li>
        </ul>
        <p>
          The honest decision rule: reach for <code>sync.Map</code> when you have a{' '}
          <em>measured</em> contention problem on a map whose access pattern is one of the two
          documented cases. Otherwise write the fifteen lines of <code>Cache</code> from earlier in
          this lesson, which is typed, auditable, and extensible.
        </p>
      </InfoBox>

      <h2><code>sync/atomic</code>: One Word, No Lock</h2>

      <p>
        Atomics make a single machine word read-modify-write indivisibly, using a CPU instruction
        rather than a lock. Since Go 1.19 you should always use the <em>types</em>, not the older
        free functions:
      </p>

      <CodeBlock language="go" title="The atomic types — prefer these">
{`var hits atomic.Int64
hits.Add(1)
hits.Load()
hits.Store(0)
hits.Swap(99)                      // returns the previous value
hits.CompareAndSwap(old, new)      // returns swapped bool

// The full set on go1.25.5: Bool, Int32, Int64, Uint32, Uint64,
// Uintptr, Pointer[T], Value. Every zero value is ready to use, and
// every one is correctly aligned on 32-bit platforms by construction.

// The pre-1.19 free-function API. Still works, still everywhere in
// older code, but easier to misuse:
var n int64
atomic.AddInt64(&n, 1)             // nothing stops you writing n++ by
n2 := atomic.LoadInt64(&n)         // mistake two lines later, and on
                                   // 32-bit platforms you had to
                                   // guarantee 8-byte alignment yourself.`}
      </CodeBlock>

      <p>
        Coming from Java, <code>atomic.Int64</code> is <code>AtomicLong</code> and{' '}
        <code>atomic.Bool</code> is a <code>volatile boolean</code> with the read-modify-write
        operations attached. Coming from C++, it is <code>std::atomic&lt;T&gt;</code> with
        sequential consistency and no way to ask for weaker ordering — Go deliberately offers no
        relaxed or acquire/release variants.
      </p>

      <h3><code>atomic.Pointer[T]</code>: swapping a whole struct</h3>

      <p>
        The pattern that earns atomics their place in server code is a hot-read, rare-write value
        like a config or a routing table. You swap the <em>pointer</em>, so readers always see a
        complete, immutable snapshot and never take a lock at all.
      </p>

      <CodeBlock language="go" title="main.go — 8 readers, 1M reads each, one live config swap">
{`type Config struct {
    MaxConns int
    Region   string
}

var cfg atomic.Pointer[Config]

func main() {
    cfg.Store(&Config{MaxConns: 10, Region: "us-east-1"})

    var wg sync.WaitGroup
    start := make(chan struct{})
    for i := 0; i < 8; i++ {
        wg.Go(func() {
            <-start
            for j := 0; j < 1_000_000; j++ {
                c := cfg.Load()
                // A torn read would show one field updated and not the other.
                if (c.MaxConns == 10) != (c.Region == "us-east-1") {
                    panic("torn Config observed")
                }
            }
        })
    }

    close(start)
    time.Sleep(2 * time.Millisecond)                      // let readers get going
    cfg.Store(&Config{MaxConns: 99, Region: "eu-west-1"}) // the whole swap, atomically
    wg.Wait()
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run -race, go1.25.5 (counts vary run to run; the last four lines do not)">
{`readers saw the old config 7137 times, the new one 7992863 times
never once a torn Config
CAS 5->6: true n = 6
CAS 5->7: false n = 6
Swap(42) returned: 6 n = 42
zero value of atomic.Bool: false`}
      </CodeBlock>

      <p>
        Eight million lock-free reads, race-detector clean, and the switchover point is wherever
        the scheduler happened to put it — the old/new split was 7137/7992863 on this run and a
        different pair on every other. The requirement that makes it work:{' '}
        <strong><code>Config</code> is treated as immutable.</strong> Nobody mutates a{' '}
        <code>Config</code> after storing it; a change means building a new one and swapping. Break
        that and you are back to a data race, with no lock anywhere to add.
      </p>

      <h3>The trap: atomic fields do not add up to an atomic snapshot</h3>

      <p>
        This is the logical race the detector cannot see, and it is worth a measurement because the
        intuition is so strong that &quot;all the fields are atomic&quot; means &quot;the struct is
        safe&quot;.
      </p>

      <CodeBlock language="go" title="main.go — every access is atomic, and the invariant still breaks">
{`type Stats struct {
    ok    atomic.Int64
    fail  atomic.Int64
    total atomic.Int64
}

func (s *Stats) RecordOK() {
    s.ok.Add(1)      // atomic
    s.total.Add(1)   // also atomic -- but not atomic TOGETHER
}

// An observer reads all three and checks ok + fail == total.
t := s.total.Load()
o := s.ok.Load()
f := s.fail.Load()
if o+f != t {
    inconsistent++
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, three plain runs plus one under -race">
{`$ go run ./y11                   # three runs
observer did  4409794 reads, saw an inconsistent snapshot  4377090 times (99.3%)
observer did  3516448 reads, saw an inconsistent snapshot  3457619 times (98.3%)
observer did 10821571 reads, saw an inconsistent snapshot 10788833 times (99.7%)

$ go run -race ./y11; echo $?    # NOT ONE RACE REPORTED
observer did    39028 reads, saw an inconsistent snapshot    38708 times (99.2%)
0

final: ok=1600000 fail=0 total=1600000  (consistent at rest: true)`}
      </CodeBlock>

      <InfoBox variant="danger" title="Atomic means no torn word. It does not mean no torn invariant.">
        <p>
          98–99% of the observer&apos;s reads saw a <code>Stats</code> that violated its own
          invariant, and the race detector was perfectly happy because every individual access was
          properly synchronised. The observer got through 90–280x fewer reads under{' '}
          <code>-race</code> purely because instrumentation slows it down — but the{' '}
          <em>rate</em> of inconsistency barely moved.
        </p>
        <p>
          The moment two pieces of state have a relationship, you need one critical section over
          both, which means a mutex. The decision is not &quot;is this field small&quot;, it is{' '}
          <strong>&quot;how much state has to change indivisibly&quot;</strong>. One word: atomic.
          More than one word: mutex.
        </p>
      </InfoBox>

      <h2>The Measurement From the Channels Lesson</h2>

      <p>
        <a href="/go/channels">The channels lesson</a> promised a number for the
        channel-guarded-counter antipattern. Here is the whole comparison — the same logical
        operation (increment a shared counter) expressed five ways, benchmarked uncontended and at
        full parallelism.
      </p>

      <CodeBlock language="go" title="bench_test.go — five ways to increment one counter">
{`// 1. atomic
var n atomic.Int64
n.Add(1)

// 2. mutex
mu.Lock(); n++; mu.Unlock()

// 3. RWMutex used for a write
mu.Lock(); n++; mu.Unlock()

// 4. channel as a mutex: a capacity-1 buffered channel as a token
sem <- struct{}{}; n++; <-sem

// 5. owner goroutine: "share memory by communicating", applied to a counter.
//    Benchmarked with a 64-slot buffer and unbuffered.
go func() { for range incs { n++ } }()
incs <- struct{}{}

// All five run under b.RunParallel, so -cpu=14 means 14 goroutines
// contending, and -cpu=1 means no contention at all.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test -bench=. -benchtime=2s, go1.25.5, Apple M4 Pro, 14 logical CPUs">
{`                                 -cpu=1            -cpu=14
                                 (uncontended)     (14 goroutines contending)
                                 one run   range   one run   range over 5 runs
BenchmarkAtomic                   1.654    1.64-1.72    51.29    30.9-52.0
BenchmarkMutex                    1.901    1.89-1.90    99.51    86.5-105.0
BenchmarkRWMutexWrite             4.268    4.26-4.28    62.23    53.2-62.2
BenchmarkChannelAsMutex          14.90    14.50-14.90  100.6     95.3-103.9
BenchmarkChannelOwner (buf 64)   18.73    18.73-19.26   83.12    83.1-90.6
BenchmarkChannelOwnerUnbuf       71.87    71.87-75.33  220.5    213.1-240.8

All figures ns/op. The uncontended column is stable to within 2%; the
contended column is a saturated microbenchmark and wanders, so the
range matters more than any single number.`}
      </CodeBlock>

      <p>
        The headline from <a href="/go/channels">the previous lesson</a> is the bottom row against
        rows one and two. At full contention the unbuffered owner-goroutine channel cost{' '}
        <strong>2.0–2.5x the mutex</strong> and <strong>4.2–4.8x the atomic</strong> across those
        five runs (one run produced an anomalously fast 30.9 ns atomic figure, which pushes that
        single ratio to 7.1 — the reason the range is quoted rather than one run). Uncontended,
        where the measurement is far more stable, it cost <strong>38x the mutex</strong>. Three
        further things in that table are worth your attention:
      </p>
      <ul>
        <li>
          <strong>Uncontended, a mutex is almost free</strong> — 1.90 ns, within 15% of the
          atomic. An uncontended <code>sync.Mutex</code> is a single successful
          compare-and-swap. The &quot;locks are slow&quot; instinct from Java, where an inflated
          monitor is genuinely expensive, does not transfer.
        </li>
        <li>
          <strong>Contention is the whole cost, for everything.</strong> Every row got 3–52x worse
          from the left column to the right one. The cheapest synchronisation is always the
          synchronisation you designed away — by sharding the counter, by giving each worker a
          local tally and summing at the end, or by not sharing the state in the first place.
        </li>
        <li>
          <strong><code>RWMutexWrite</code> beating <code>Mutex</code> at 14-way contention is
          real but do not generalise it.</strong> It reproduced on all five runs, and it is an
          artefact of how the two primitives queue waiters at saturation on this CPU. The column
          that reflects the actual work each one does is the uncontended one, where{' '}
          <code>RWMutex</code> costs 2.25x the plain <code>Mutex</code>. A microbenchmark at
          saturation measures the queueing discipline, not the primitive.
        </li>
      </ul>

      <InfoBox variant="question" title="So is the channel version ever right?">
        <p>
          Yes — when the goroutine on the other end is doing something a lock cannot express. If the
          owner goroutine batches the increments and flushes to a database every second, or
          serialises access to a resource that genuinely must be touched by one goroutine (a cgo
          library with thread-affinity, a single UART), then the channel is buying you something
          real and 220 ns is irrelevant.
        </p>
        <p>
          What is never right is using a channel because you heard that locks are un-Go-like. The
          Go standard library is full of mutexes. <code>net/http</code>, <code>database/sql</code>,
          and the runtime itself use them heavily. &quot;Share memory by communicating&quot; is
          advice about <em>ownership</em>, not a ban on <code>sync</code>.
        </p>
      </InfoBox>

      <h2>Picking the Primitive</h2>

      <FlowChart
        title="Which sync primitive — by the shape of the shared state"
        chart={"graph TD\n  Q{\"What is the shared thing?\"}\n  Q -->|\"one int, bool or pointer, no related state\"| AT[\"sync/atomic<br/>Int64, Bool, Pointer[T]\"]\n  Q -->|\"two or more fields that must agree\"| MU[\"sync.Mutex\"]\n  Q -->|\"a struct read far more often than written\"| RW[\"sync.RWMutex<br/>RLock for readers\"]\n  Q -->|\"something built exactly once, lazily\"| ON[\"sync.Once / OnceValue\"]\n  Q -->|\"a cache of write-once keys, or disjoint keys per goroutine\"| SM[\"sync.Map\"]\n  Q -->|\"a map with any other access pattern\"| MU\n  Q -->|\"nothing is shared - a value is MOVING from A to B\"| CH[\"channel\"]\n  AT --> W1[\"Atomic per field is not an atomic snapshot<br/>of several fields\"]\n  SM --> W2[\"Keys and values are 'any': no type safety,<br/>no Len, Range is not a snapshot\"]\n  CH --> W3[\"See the channels lesson\"]"}
      />

      <CodeBlock language="text" title="Translating what you already know">
{`Java                              Go
--------------------------------  ------------------------------------------
synchronized method/block         sync.Mutex + Lock/defer Unlock
                                  NOT reentrant. Split into Locked helpers.
ReentrantLock                     No equivalent. Restructure the code.
ReentrantReadWriteLock            sync.RWMutex
volatile int                      atomic.Int32 / atomic.Int64
AtomicLong / AtomicReference      atomic.Int64 / atomic.Pointer[T]
ConcurrentHashMap                 map + sync.RWMutex (default), or sync.Map
                                  if the access pattern matches the docs
CountDownLatch(n) + await()       sync.WaitGroup + Add(n)/Done()/Wait()
Thread.join() in a loop           sync.WaitGroup, or wg.Go (Go 1.25+)
static holder idiom / DCL         sync.Once, sync.OnceValue
Condition / wait+notify           sync.Cond (rare), or a channel
Collections.synchronizedMap       Nothing. Guard it yourself.
ThreadLocal                       Nothing. Pass a context explicitly.

Node                              Go
--------------------------------  ------------------------------------------
"I never needed a lock"           You need one now. This is the big change.
Promise.all for structure         sync.WaitGroup (no results) or errgroup
Promise.all for results           errgroup + a pre-sized slice, or a channel
A memoised promise                sync.Once / sync.OnceValue
Atomics on a SharedArrayBuffer    sync/atomic - the closest thing you had
process-wide mutable module state Still module state, but now racy.
                                  Guard every exported mutable package var.`}
      </CodeBlock>

      <InfoBox variant="info" title="The two sync types this lesson skipped">
        <ul>
          <li>
            <strong><code>sync.Cond</code></strong> — a condition variable, for &quot;wait until
            this predicate becomes true&quot;. It exists, it is correct, and it is almost always
            out-competed by a channel, which composes with <code>select</code> and{' '}
            <code>ctx.Done()</code> while <code>Cond.Wait()</code> does not. It has no timeout and
            is not cancellable. If you think you need one, write the channel version first.
          </li>
          <li>
            <strong><code>sync.Pool</code></strong> — a free list of reusable objects to cut GC
            pressure, used in <code>fmt</code>, <code>encoding/json</code> and{' '}
            <code>net/http</code>. It is a performance tool, not a correctness tool: entries may
            vanish at any GC, so it can only hold values you are happy to reconstruct. It belongs
            with profiling, and it is covered in the{' '}
            <a href="/go/cheatsheet">Go field guide</a> rather than here.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="success" title="What you should now be able to say out loud">
        <ul>
          <li>
            A channel moves a value and coordinates. A mutex protects state. Picking the wrong one
            is a design error, and the channel-as-a-lock version measured 2.0–2.5x slower than the
            mutex under contention and 38x slower uncontended.
          </li>
          <li>
            <code>c.n++</code> from two goroutines loses updates — measured at 33–48% of a million
            increments surviving, different every run. Node could never do this to you; Go will,
            silently.
          </li>
          <li>
            <code>go test -race ./...</code> and <code>go vet ./...</code> both belong in CI. They
            catch disjoint bugs: the detector cannot see a copied mutex, and vet cannot see an
            unguarded field.
          </li>
          <li>
            Every access to guarded state takes the lock, reads included. Keep the mutex and its
            data unexported in the same struct, and never return an alias to the guarded data.
          </li>
          <li>
            A Go mutex is not reentrant and has no owner. Use the{' '}
            <code>Method</code>/<code>methodLocked</code> pair; never hold a lock across I/O.
          </li>
          <li>
            <code>wg.Add</code> goes in the parent before <code>go</code>, or use{' '}
            <code>wg.Go</code> on Go 1.25+ and stop thinking about it.
          </li>
          <li>
            <code>Once</code> blocks the stampede and caches failure permanently.
          </li>
          <li>
            Atomics guarantee no torn word, not a consistent multi-field snapshot — measured at
            99% inconsistent reads with every access atomic and zero races reported.
          </li>
        </ul>
      </InfoBox>

      <p>
        Next: the piece that ties the last three lessons together.{' '}
        <a href="/go/context"><code>context.Context</code></a> is how a cancellation signal — a
        closed channel, underneath — travels down a whole call tree, and it is the reason a Go
        server can abandon work the instant the client hangs up.
      </p>
    </LessonLayout>
  );
}
