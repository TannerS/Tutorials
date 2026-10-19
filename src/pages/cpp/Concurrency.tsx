import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function Concurrency() {
  return (
    <LessonLayout
      title="Concurrency: Threads, Atomics & the Memory Model"
      sectionId="cpp"
      lessonIndex={18}
      prev={{ path: '/cpp/errors', label: 'Error Handling: Exceptions, noexcept & expected' }}
      next={{ path: '/cpp/performance', label: 'Performance: Cache, Copies & Undefined Behaviour' }}
    >
      <p>
        One sentence carries this entire lesson, and it is the sharpest difference between C++ and
        both languages you know well: <strong>a data race in C++ is undefined behaviour, not a
        wrong answer.</strong>
      </p>

      <p>
        In Java, unsynchronised access gives you a stale or torn value — bad, but bounded. In Go,
        the race detector flags it and the program keeps its semantics. In C++ the standard says
        your program has <em>no meaning at all</em>, and the optimiser is permitted to assume the
        race cannot happen. That assumption is not theoretical. This lesson demonstrates it
        producing a different answer at <code>-O2</code> than at <code>-O0</code>, from identical
        source.
      </p>

      <h2>Starting Threads — Use jthread</h2>

      <CodeBlock language="cpp" title="std::thread's trap, and the C++20 fix">
{`// ✗ std::thread: if it is destroyed while still joinable, the destructor
//   calls std::terminate(). Not a leak, not a detach — the process dies.
{
    std::thread t(work);
}   // <- terminate() here. An early return or a throw does the same.

// ✓ std::jthread (C++20): joins in its destructor. RAII applied to threads.
{
    std::jthread t(work);
}   // <- joins cleanly, including on an exception`}
      </CodeBlock>

      <p>
        This is <a href="/cpp/raii">RAII</a> arriving late to the threading API. A{' '}
        <code>std::thread</code> obliges you to call <code>join()</code> or{' '}
        <code>detach()</code> on every path out of the scope, including the ones exceptions take —
        exactly the discipline RAII exists to eliminate. Use <code>jthread</code> unless you have a
        reason not to.
      </p>

      <CodeBlock language="cpp" title="jthread also gives you cooperative cancellation">
{`std::jthread worker([](std::stop_token st) {
    while (!st.stop_requested()) {
        do_a_chunk_of_work();
    }
});
// worker.request_stop() is called automatically by the destructor,
// then it joins. Same cooperative model as Go's context.`}
      </CodeBlock>

      <InfoBox variant="info" title="The Go comparison is close, and the difference is instructive">
        <p>
          <code>stop_token</code> is the same cooperative idea as{' '}
          <a href="/go/context">Go's <code>context.Context</code></a> — nothing kills a thread from
          outside, so the thread agrees to check a flag. What Go does not have is{' '}
          <code>jthread</code>'s destructor guarantee: a goroutine whose function never returns
          leaks silently, whereas a <code>jthread</code> going out of scope always requests stop and
          waits. C++ gives you the stronger structural guarantee here, because it has destructors
          and Go does not.
        </p>
      </InfoBox>

      <h2>A Real Race, and What It Costs</h2>

      <CodeBlock language="cpp" title="Two threads, one unguarded counter">
{`int counter = 0;
void bump() { for (int i = 0; i < 100000; ++i) ++counter; }

std::thread a(bump), b(bump);
a.join(); b.join();
// expected 200000`}
      </CodeBlock>

      <p>
        <strong>ThreadSanitizer works on this platform</strong> — verified, unlike LeakSanitizer
        from <a href="/cpp/memory-bugs">the memory bugs lesson</a>, which does not exist here. It
        catches this at both <code>-O0</code> and <code>-O2</code>:
      </p>

      <CodeBlock language="bash" title="Real output">
{`$ clang++ -std=c++23 -fsanitize=thread -g race.cpp -o race && ./race
WARNING: ThreadSanitizer: data race (pid=60779)
SUMMARY: ThreadSanitizer: data race race.cpp:4 in bump()`}
      </CodeBlock>

      <p>
        The fix is a mutex or an atomic. But the counter is the <em>easy</em> case, because the
        wrong answer is visibly wrong. The next one is worse.
      </p>

      <h2>The Demonstration That Should Change How You Think</h2>

      <p>
        A worker publishes a value and sets a flag; the main thread spins until the flag is set,
        then reads the value. The flag is a plain <code>bool</code> — the bug. This pattern looks
        correct, and in Java with a <code>volatile</code> flag it would be:
      </p>

      <CodeBlock language="cpp" title="spin.cpp — the flag is not atomic">
{`bool ready = false;        // <- the bug
int  payload = 0;

std::thread w([]{
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    payload = 42;
    ready = true;
});

while (!ready) { }         // spin
std::printf("saw payload = %d\\n", payload);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — identical source, two optimisation levels">
{`$ clang++ -std=c++23 -O0 spin.cpp -o sp && ./sp
saw payload = 42          <- correct, by luck

$ clang++ -std=c++23 -O2 spin.cpp -o sp && ./sp
saw payload = 0           <- WRONG ANSWER. No crash. No warning.`}
      </CodeBlock>

      <InfoBox variant="danger" title="This is what undefined behaviour actually means">
        <p>
          The program did not crash, did not hang, and did not report anything. It printed a
          confidently wrong number — and only when optimised. Every test you ran in a debug build
          passed. The bug appears when you ship.
        </p>
        <p>
          This is why &ldquo;it worked on my machine&rdquo; carries no weight in C++. The compiler
          is permitted to assume no data race exists, so it reorders and caches freely around the
          unsynchronised access. Your debug build and your release build are not running the same
          program in any meaningful sense.
        </p>
      </InfoBox>

      <p>
        TSan catches it at <code>-O2</code> — one warning, pointing at the racing line — and the
        fix is one word:
      </p>

      <CodeBlock language="text" title="Real output — the atomic fix, both levels">
{`std::atomic<bool> ready{false};   // the only change

-O0 -> saw payload = 42
-O2 -> saw payload = 42`}
      </CodeBlock>

      <p>
        <code>std::atomic</code> does two things, and the second is the one people miss. It makes
        the access indivisible, and it establishes an <strong>ordering relationship</strong>:
        everything the writer did before the release-store is guaranteed visible to a reader that
        observes it. That is what makes <code>payload</code> readable, even though{' '}
        <code>payload</code> itself is not atomic.
      </p>

      <h2>Mutexes</h2>

      <CodeBlock language="cpp" title="Never lock by hand">
{`std::mutex m;

// ✗ an early return or a throw leaks the lock forever
m.lock(); do_work(); m.unlock();

// ✓ RAII — unlocks on every path out, exceptions included
{ std::lock_guard lk(m); do_work(); }

// unique_lock when you need to unlock early or hand it to a condition_variable
std::unique_lock lk(m);

// scoped_lock for MULTIPLE mutexes — takes them in a deadlock-free order
std::scoped_lock both(m1, m2);`}
      </CodeBlock>

      <FlowChart
        title="Deadlock: Two Locks, Two Orders"
        chart={
          'graph TD\n' +
          '  subgraph bad["✗ inconsistent order"]\n' +
          '    T1["thread 1<br/>lock A, then B"] --> A1["holds A<br/>waits for B"]\n' +
          '    T2["thread 2<br/>lock B, then A"] --> B1["holds B<br/>waits for A"]\n' +
          '    A1 -.->|"neither can proceed"| B1\n' +
          '  end\n' +
          '  subgraph good["✓ scoped_lock"]\n' +
          '    S["std::scoped_lock lk(A, B)<br/>in BOTH threads"] --> OK["takes them in a<br/>consistent internal order"]\n' +
          '  end\n' +
          '  style A1 fill:#3b1a1a,stroke:#f87171\n' +
          '  style B1 fill:#3b1a1a,stroke:#f87171\n' +
          '  style OK fill:#1a3329,stroke:#4ade80'
        }
      />

      <p>
        Two threads taking the same two mutexes in opposite orders deadlock. The classic advice is
        &ldquo;always lock in a consistent global order&rdquo;, which is correct and hard to
        enforce across a codebase. <code>std::scoped_lock</code> with multiple mutexes solves it
        structurally — it uses a deadlock-avoiding algorithm internally, so you cannot get the
        order wrong.
      </p>

      <h2>Memory Orderings</h2>

      <p>
        Every atomic operation takes an optional ordering. The default is the strongest, and it is
        the right default:
      </p>

      <CodeBlock language="text" title="What each one buys you">
{`seq_cst   (default) Total global order all threads agree on.
                    Slowest, and almost always what you want.

acquire   On a LOAD.  Nothing after it can be reordered before it.
release   On a STORE. Nothing before it can be reordered after it.
                    Paired, they give the writer-publishes /
                    reader-observes guarantee the spin example needed.

relaxed   Atomicity ONLY. No ordering whatsoever. Correct for a
                    statistics counter nobody synchronises on;
                    wrong for almost everything else.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Do not reach for relaxed to go faster">
        <p>
          Weakening an ordering is a measurable micro-optimisation that buys you a category of bug
          which is non-deterministic, architecture-dependent, and may be invisible on x86 while
          breaking on ARM — the two have genuinely different memory models. Note that this machine
          is arm64, so code validated only on an x86 CI runner has not been tested where it is
          weakest.
        </p>
        <p>
          Use <code>seq_cst</code>. If a profile proves an atomic is your bottleneck, that is the
          moment to learn acquire/release properly — not before.
        </p>
      </InfoBox>

      <h2>condition_variable</h2>

      <CodeBlock language="cpp" title="Always use the predicate overload">
{`std::mutex m;
std::condition_variable cv;
bool ready = false;

// waiter
{
    std::unique_lock lk(m);
    cv.wait(lk, []{ return ready; });   // predicate form — re-checks on wake
    // ...
}

// notifier
{
    std::lock_guard lk(m);
    ready = true;
}
cv.notify_one();`}
      </CodeBlock>

      <p>
        The predicate overload is not a convenience. <code>wait</code> is permitted to return
        without any notification at all — a <strong>spurious wakeup</strong> — so the bare{' '}
        <code>cv.wait(lk)</code> must be wrapped in a <code>while</code> loop re-checking the
        condition. The predicate form is that loop, written correctly for you.
      </p>

      <h2>Futures and async</h2>

      <CodeBlock language="cpp" title="The one-shot result channel — and its famous trap">
{`auto fut = std::async(std::launch::async, compute);
int result = fut.get();     // blocks until ready; rethrows any exception

// ⚠ The future returned by std::async BLOCKS IN ITS DESTRUCTOR until the
//   task completes. So this is NOT fire-and-forget — it is sequential:
std::async(std::launch::async, slow_task);   // temporary destroyed here
std::async(std::launch::async, slow_task);   // ...so this waits for it`}
      </CodeBlock>

      <p>
        That destructor behaviour is specific to <code>std::async</code>'s future and surprises
        nearly everyone. Discarding the return value turns parallel code into sequential code
        silently. If you want independent tasks, keep the futures alive in a container, or use{' '}
        <code>jthread</code>.
      </p>

      <h2>C++20 Coordination Primitives</h2>

      <CodeBlock language="cpp" title="latch, barrier, semaphore">
{`std::latch done{3};              // single-use countdown
done.count_down();               // from each worker
done.wait();                     // main thread blocks until zero

std::barrier sync{4};            // REUSABLE — all 4 arrive, then all proceed
sync.arrive_and_wait();          // next phase begins together

std::counting_semaphore<10> slots{10};   // bound concurrency
slots.acquire();  /* work */  slots.release();`}
      </CodeBlock>

      <p>
        <code>latch</code> is one-shot, <code>barrier</code> resets for the next round — that is
        the only difference worth remembering. The semaphore is the same bounded-concurrency
        pattern as <a href="/go/concurrency-patterns">Go's buffered-channel semaphore</a>.
      </p>

      <h2>Key Takeaways</h2>

      <p>
        <strong>A data race is undefined behaviour</strong>, not a wrong answer — demonstrated here
        as the same source printing <code>42</code> at <code>-O0</code> and <code>0</code> at{' '}
        <code>-O2</code>, with no crash and no warning. <strong>Use <code>jthread</code></strong>;{' '}
        a <code>std::thread</code> destroyed while joinable calls <code>terminate</code>.{' '}
        <strong>Never lock by hand</strong> — <code>lock_guard</code> for one mutex,{' '}
        <code>scoped_lock</code> for several, which also makes deadlock-by-ordering impossible.{' '}
        <strong>ThreadSanitizer works on this platform</strong> and caught every race in this
        lesson at both optimisation levels — put <code>-fsanitize=thread</code> in CI.{' '}
        <strong>Default to <code>seq_cst</code></strong> and treat weaker orderings as a profiled
        optimisation, remembering that ARM and x86 differ exactly where you are least likely to
        test. And <strong>use the predicate form of <code>cv.wait</code></strong>, because spurious
        wakeups are real.
      </p>
    </LessonLayout>
  );
}
