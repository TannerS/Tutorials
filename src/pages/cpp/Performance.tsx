import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function Performance() {
  return (
    <LessonLayout
      title="Performance: Cache, Copies & Undefined Behaviour"
      sectionId="cpp"
      lessonIndex={19}
      prev={{ path: '/cpp/concurrency', label: 'Concurrency: Threads, Atomics & the Memory Model' }}
      next={{ path: '/cpp/tooling', label: 'Build Systems, Debugging & Sanitizers' }}
    >
      <p>
        In Node and on the JVM, performance is something that happens to you at runtime. The JIT
        watches your code, inlines what turns out to be hot, deoptimises when its guess was wrong,
        and a profiler attaches to a live process and tells you where the time went. You tune the
        shape of the code and the runtime does the rest.
      </p>

      <p>
        C++ makes every one of those decisions <strong>before the program runs</strong>, from the
        source plus the flags you passed. There is no profile feeding back in unless you build one
        deliberately, and <code>-O0</code> and <code>-O2</code> are not the same program in any
        useful sense — the <a href="/cpp/concurrency">previous lesson</a> ended on identical source
        printing <code>42</code> at one level and <code>0</code> at the other. That makes two things
        true at once. The compiler can do far more for you than a JIT can, and it can only do it if
        you let it; and your intuitions about what is fast are worth nothing here.
      </p>

      <InfoBox variant="warning" title="The governing rule: measure, never guess">
        <p>
          Every number on this page was produced on the machine from{' '}
          <a href="/cpp/intro">the intro</a> — Apple clang 21.0.0, <code>arm64-apple-darwin25.6.0</code>,
          an <strong>Apple M4 Pro</strong> (10 performance cores, 4 efficiency cores). Several of
          them contradicted what the first draft of this lesson expected, and those are flagged where
          they occur. Timings vary run to run; where that matters, every run is shown rather than a
          single number.
        </p>
      </InfoBox>

      <h2>What You Actually Have To Measure With</h2>

      <p>
        Before any advice, the honest tool inventory for macOS, probed rather than remembered:
      </p>

      <CodeBlock language="text" title="Real output — which profilers exist on this machine">
{`perf          not installed   (Linux-only; it is a kernel interface, not a program
                               that could be ported)
valgrind      not installed   (callgrind/cachegrind are the usual cache-profiling
                               answer and they are not available here)
gprof         not installed
xctrace       /usr/bin/xctrace exists, but:
              "xcode-select: error: tool 'xctrace' requires Xcode, but active
               developer directory '/Library/Developer/CommandLineTools' is a
               command line tools instance"
sample        /usr/bin/sample      WORKS   <- the one that works out of the box
leaks         /usr/bin/leaks       (used in the memory bugs lesson)
heap, vmmap, malloc_history, spindump, dtrace: present
llvm-profdata, llvm-cov: present (in the CommandLineTools bin directory)`}
      </CodeBlock>

      <p>
        So the ergonomic answer — <code>perf record</code> / <code>perf stat</code>, which is what
        every C++ performance article on the internet assumes — <strong>does not exist on
        macOS</strong>, and Instruments needs the full Xcode install, not just the command line
        tools. What you get instead is <code>sample</code>, a sampling profiler that ships with the
        OS. It is less capable than <code>perf</code> (no hardware counters, so no cache-miss or
        branch-miss numbers) but it answers the only question that matters most of the time:{' '}
        <em>where is the time going?</em>
      </p>

      <CodeBlock language="cpp" title="spin2.cpp — a deliberately lopsided program">
{`[[gnu::noinline]] long long hot_sum(const std::vector<int>& v) {
    long long s = 0;
    for (int x : v) s += (x % 7) * (x % 13);
    return s;
}
[[gnu::noinline]] long long cold_sum(const std::vector<int>& v) {
    return std::accumulate(v.begin(), v.end(), 0LL);
}
int main() {
    std::vector<int> v(5'000'000);
    std::iota(v.begin(), v.end(), 0);
    long long t = 0;
    for (int i = 0; i < 400; ++i) { t += hot_sum(v); if (i % 50 == 0) t += cold_sum(v); }
    std::printf("%lld\\n", t);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — ./spin2 & then sample <pid> 2, abridged to the call graph">
{`$ clang++ -std=c++23 -O2 -g spin2.cpp -o spin2
$ ./spin2 > /dev/null & SP=$!; sample $SP 2 -file sample_out.txt; wait $SP
Sampling process 77612 for 2 seconds with 1 millisecond of run time between samples

Call graph:
    305 Thread_12903890   DispatchQueue_1: com.apple.main-thread  (serial)
      305 start  (in dyld) + 6992  [0x1813c04e4]
        304 main  (in spin2) + 192  [0x1046ac9d0]  spin2.cpp:18
        + 304 hot_sum(std::vector<int> const&)  (in spin2) + 412,272,...  spin2.cpp:8
        1 main  (in spin2) + 220  [0x1046ac9ec]  spin2.cpp:18
          1 cold_sum(std::vector<int> const&)  (in spin2) + 124  spin2.cpp:12

Sort by top of stack, same collapsed (when >= 5):
        hot_sum(std::vector<int> const&)  (in spin2)        304`}
      </CodeBlock>

      <p>
        304 samples of 305 in <code>hot_sum</code>, one in <code>cold_sum</code>, with demangled C++
        names and <code>file:line</code> — which is all you need to know which function to look at.
        Two practical notes: build with <code>-g</code> even at <code>-O2</code> or you get
        addresses instead of lines, and <code>sample</code> has to be able to attach, which it
        refused to do when the target was launched from a hardened parent process (
        <code>sample cannot examine process ... try running with sudo</code>). Launched from a plain
        shell it worked every time.
      </p>

      <InfoBox variant="tip" title="Three cheaper measurements before you reach for a profiler">
        <p>
          <strong><code>std::chrono::steady_clock</code> around the suspect region.</strong> Every
          benchmark on this page is five runs of a hand-rolled timer, and that was enough to settle
          every question asked here.
        </p>
        <p>
          <strong><code>-Rpass=inline</code> and friends.</strong> Optimisation remarks tell you
          what the compiler decided, with its cost model exposed. Used further down.
        </p>
        <p>
          <strong><code>-S</code> and read the assembly.</strong> Deterministic, no timer noise, and
          for small functions it is the only way to see what the optimiser actually did. Also used
          repeatedly below.
        </p>
      </InfoBox>

      <h2>Cache Locality: The Number That Explains Most Surprises</h2>

      <p>
        One measurement underpins every layout decision in C++. The program below walks a buffer of
        growing size in two ways: a <strong>random cycle</strong>, where each load&apos;s address
        comes out of the previous load, and a <strong>sequential scan</strong> of the same buffer.
        Twenty million accesses either way, so the only variable is the access pattern.
      </p>

      <CodeBlock language="cpp" title="cache.cpp — the core of it">
{`// next[] holds a single random cycle visiting every slot exactly once,
// so the prefetcher cannot predict anything and every load depends on the last.
std::uint32_t idx = 0;
for (long long s = 0; s < steps; ++s) idx = next[idx];

// versus the same buffer, same number of loads, walked in order
for (long long i = 0; i < lim; ++i) sum += next[i];`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 cache.cpp, nanoseconds per access">
{`        KB        elems  random ns/acc     seq ns/acc
        16         4096           0.92           0.03
        64        16384           0.92           0.03
       128        32768           0.90           0.03     <- edge of L1d (128 KB)
       256        65536           3.58           0.03
       512       131072           4.88           0.03
      2048       524288           5.80           0.03
      8192      2097152           7.86           0.03
     16384      4194304          11.48           0.04     <- edge of L2 (16 MB)
     65536     16777216          83.96           0.08
    262144     67108864         114.73           0.05     <- DRAM`}
      </CodeBlock>

      <p>
        Three runs of that program agreed on the shape and disagreed on the detail: the 8 MB row
        read 15.31 / 7.88 / 7.86 ns and the 64 MB row read 106.86 / 73.11 / 83.96 ns across runs, so
        treat the large working sets as &ldquo;tens to a hundred-odd nanoseconds&rdquo; rather than a
        precise figure. The structure is not noise, though. Random access costs{' '}
        <strong>0.9 ns inside L1 and 115 ns out in DRAM — a factor of about 125</strong>, and the
        sequential scan of the same memory never moves off 0.03&ndash;0.08 ns per element no matter
        how big the buffer gets.
      </p>

      <FlowChart
        title="The memory hierarchy, with this machine's measured numbers"
        chart={
          'graph TD\n' +
          '  CPU["M4 Pro core<br/>~4 GHz, so ~0.25 ns per cycle"] --> L1\n' +
          '  L1["L1 data cache<br/>128 KB per performance core<br/>measured: 0.90 ns random access"] --> L2\n' +
          '  L2["L2 cache<br/>16 MB, shared by 5 cores<br/>measured: 3.6 ns at 256 KB<br/>rising to 11.5 ns at 16 MB"] --> DRAM\n' +
          '  DRAM["main memory<br/>48 GB<br/>measured: 84-115 ns random access"]\n' +
          '  L1 -.->|"transfers happen in<br/>128-BYTE cache lines<br/>hw.cachelinesize = 128,<br/>not the 64 you know from x86"| LINE["one line = 32 ints<br/>or 5 std::string headers"]\n' +
          '  DRAM -.->|"sequential access stays at<br/>0.03-0.08 ns/element at EVERY size:<br/>the prefetcher sees the pattern<br/>and the loads are independent"| PF["contiguity is worth<br/>up to ~2000x here"]\n' +
          '  style L1 fill:#1a3329,stroke:#4ade80\n' +
          '  style L2 fill:#3d2f14,stroke:#fb923c\n' +
          '  style DRAM fill:#3b1a1a,stroke:#f87171\n' +
          '  style PF fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <p>
        That 128-byte cache line is worth pausing on, because almost every tuning article you will
        read assumes 64. <code>sysctl hw.cachelinesize</code> on this machine reports{' '}
        <strong>128</strong>. It is the unit in which memory moves, so a struct that straddles a line
        boundary costs two fetches, and &ldquo;pad to the cache line&rdquo; advice tuned for x86
        wastes half the padding here.
      </p>

      <h2>Why <code>vector</code> Beats Node-Based Containers — And What The Real Variable Is</h2>

      <p>
        <a href="/cpp/containers">The containers lesson</a> measured{' '}
        <code>std::vector</code> against <code>std::list</code> directly and found 20&times; on a
        fresh list and 2,900&times; on a churned one. This lesson asks the question the other way
        round, because the layout a Java or Node developer reaches for instinctively is neither of
        those: it is <strong>an array of references to heap objects</strong>, which in C++ spells{' '}
        <code>std::vector&lt;std::unique_ptr&lt;T&gt;&gt;</code>.
      </p>

      <CodeBlock language="cpp" title="layout.cpp — 2,000,000 identical objects, five layouts, one traversal">
{`struct Order { int id; int qty; double price; Order* next = nullptr; };  // 24 bytes

std::vector<Order>                     values;         // contiguous values
std::vector<std::unique_ptr<Order>>     ptrs_inorder;  // allocated front to back
std::vector<std::unique_ptr<Order>>     ptrs_shuffled; // same objects, shuffled pointers
std::list<Order>                        nodes;         // node per element

// and the same shuffled objects linked through Order::next, so the address of
// the next object is only knowable after the current one has been loaded:
for (const Order* p = head; ...; p = p->next) s += p->qty;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 layout.cpp, five runs, milliseconds">
{`N = 2000000 Order objects (sizeof(Order) = 24)
layout                                   r1       r2       r3       r4       r5
vector<Order>                          0.62     0.53     0.51     0.48     0.48
vector<unique_ptr<Order>> in order     1.87     0.74     0.74     0.74     0.75
vector<unique_ptr<Order>> shuffled     5.43     4.58     4.53     4.60     4.60
list<Order>                            3.24     1.63     1.67     1.66     1.74
shuffled objects, DEPENDENT chase    159.58   156.43   156.47   164.45   155.79`}
      </CodeBlock>

      <InfoBox variant="note" title="This did not come out where the first draft expected">
        <p>
          The expectation was a smooth ladder: values fastest, pointers slower, shuffled pointers
          much slower, list worst. Two of those are wrong.
        </p>
        <p>
          <strong>The shuffled pointers cost 4.6 ms, not hundreds.</strong> Every one of those two
          million loads lands in a random spot of a 48 MB heap, and the sweep above says a random
          DRAM access costs ~100 ns — which would predict 200 ms. It took 4.6. The reason is that
          those loads are <strong>independent</strong>: the next address comes from the pointer
          array, which is contiguous, so the core can have dozens of misses outstanding at once.
          Latency is hidden by overlapping it.
        </p>
        <p>
          <strong>The dependent chase over the very same objects cost 156 ms</strong>, 34&times; the
          independent version and 330&times; the flat vector. Nothing about the data changed — only
          whether the address of the next load was already known. 156 ms / 2 M = 78 ns per element,
          which is the DRAM latency from the sweep, paid one at a time with no overlap.
        </p>
      </InfoBox>

      <p>
        So the rule people repeat — &ldquo;pointer chasing is slow&rdquo; — is true for a reason
        narrower and more useful than &ldquo;pointers are slow&rdquo;:
      </p>

      <ul>
        <li>
          <strong>Contiguous values win</strong> because one 128-byte line delivers five{' '}
          <code>Order</code>s and the prefetcher stays ahead of you. 0.48 ms for two million
          elements.
        </li>
        <li>
          <strong>Indirection you can pipeline is cheap.</strong>{' '}
          <code>vector&lt;unique_ptr&lt;T&gt;&gt;</code> traversed in allocation order cost 0.74 ms —
          1.5&times;, not 10&times;. If polymorphism (<a href="/cpp/inheritance">which needs
          pointers</a>) is what the design requires, this is an affordable price.
        </li>
        <li>
          <strong>Serialised indirection is catastrophic.</strong> The moment the next address can
          only be computed from the current object, you pay full memory latency per element with
          nothing to overlap it. That is what a linked list, a tree, or a &ldquo;next&rdquo; pointer
          through a churned heap is.
        </li>
        <li>
          <strong><code>std::list</code> at 1.64 ms looks fine here, and that is the trap</strong>{' '}
          the containers lesson dismantled: these nodes were allocated in traversal order and never
          churned. Shuffle the links and the same container measured 2,900&times; slower than a
          vector.
        </li>
      </ul>

      <h2>The Cost Of Copies, And How To Find The Accidental Ones</h2>

      <p>
        <a href="/cpp/intro">The intro</a> listed &ldquo;objects are handles to things&rdquo; as the
        instinct that costs the most. This is where it costs. A copy in Java is a pointer
        assignment; a copy in C++ runs a constructor and may allocate. The way to find out how many
        you are doing is not to reason about it — it is to instrument a type and count.
      </p>

      <CodeBlock language="cpp" title="copies.cpp — the whole technique">
{`struct Tracked {
    std::string payload;
    Tracked(const Tracked& o) : payload(o.payload)            { ++C.copy_ctor; }
    Tracked(Tracked&& o) noexcept : payload(std::move(o.payload)) { ++C.move_ctor; }
    Tracked& operator=(const Tracked& o) { payload = o.payload; ++C.copy_assign; return *this; }
    Tracked& operator=(Tracked&& o) noexcept { /* ... */ ++C.move_assign; return *this; }
};
// then run ordinary-looking code over a vector<Tracked> and a map<string, Tracked>
// of four elements each, resetting the counters between cases.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — four elements in each container">
{`by_cref(v[0])                                  copies=0  moves=0
by_value(v[0])                                 copies=1  moves=0
for (auto t : v)                               copies=4  moves=0
for (const auto& t : v)                        copies=0  moves=0
for (const pair<string, Tracked>& kv : m)      copies=4  moves=0
for (const auto& kv : m)                       copies=0  moves=0
for (const auto& [k, t] : m)                   copies=0  moves=0
auto f = [one] { ... }                         copies=1  moves=0
auto f = [&one] { ... }                        copies=0  moves=0
sink.push_back(one)                            copies=1  moves=0
sink.push_back(std::move(one))                 copies=0  moves=1
8 emplace_back, NO reserve (reallocation)      copies=0  moves=15
8 emplace_back, reserve(8)                     copies=0  moves=8`}
      </CodeBlock>

      <p>
        Line five is the one worth memorising, because it looks completely correct and is a copy of
        every element in the map. <code>std::map&lt;K, V&gt;::value_type</code> is{' '}
        <code>std::pair&lt;const K, V&gt;</code>, not <code>std::pair&lt;K, V&gt;</code>. Binding{' '}
        <code>const std::pair&lt;std::string, Tracked&gt;&amp;</code> to it cannot reference the
        element, so a temporary of the written-out type is materialised for each iteration — a
        reference that silently is not one. Write <code>const auto&amp;</code> or a structured
        binding and the count is zero.
      </p>

      <p>
        Now the detection question. Here is the only warning that fired, from a build with{' '}
        <code>-Wall -Wextra</code>:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra, the single diagnostic">
{`copies.cpp:58:49: warning: loop variable 'kv' of type
  'const std::pair<std::string, Tracked> &' binds to a temporary constructed
  from type 'reference' (aka 'pair<const std::string, Tracked> &')
  [-Wrange-loop-construct]
copies.cpp:58:10: note: use non-reference type 'std::pair<std::string, Tracked>' to
  make construction explicit or type 'const value_type &' to prevent copying
1 warning generated.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Verified: no warning flag at all catches the by-value range-for">
        <p>
          <code>-Wrange-loop-construct</code> is part of <code>-Wall</code> (not of{' '}
          <code>-Wextra</code>, and not on by default) and it catches the map trap — genuinely good
          news. It does <strong>not</strong> catch <code>for (auto t : v)</code> copying four{' '}
          <code>Tracked</code> objects, and neither does anything else: compiled with{' '}
          <code>-Weverything</code>, the entire file produced exactly two warnings, the one above
          plus an unrelated <code>-Wpoison-system-directories</code>. The by-value loop, the
          by-value parameter, the capturing lambda and the copying <code>push_back</code> are all
          silent at every warning level this compiler has.
        </p>
        <p>
          Which settles the method: <strong>finding accidental copies is a measurement, not a
          warning.</strong> Instrument the type that matters, or profile and look for{' '}
          <code>operator new</code> and the copy constructor in the output.
        </p>
      </InfoBox>

      <h2><code>const&amp;</code> Is Not Automatically Right</h2>

      <p>
        &ldquo;Pass by <code>const&amp;</code>&rdquo; is the first optimisation anyone learns in C++,
        and for a <code>std::string</code> or a <code>std::vector</code> it is correct. For a small
        trivially copyable type it inverts: a reference is a pointer, and a pointer forces the value
        through memory that it could have travelled in a register.
      </p>

      <CodeBlock language="cpp" title="smallparam.cpp">
{`struct Point { float x, y; };

[[gnu::noinline]] float dot_val(Point a, Point b)               { return a.x*b.x + a.y*b.y; }
[[gnu::noinline]] float dot_ref(const Point& a, const Point& b) { return a.x*b.x + a.y*b.y; }

float call_val(Point p, Point q) { return dot_val(p, q); }
float call_ref(Point p, Point q) { return dot_ref(p, q); }`}
      </CodeBlock>

      <CodeBlock language="asm" title="Real output — clang++ -std=c++23 -O2 -S, arm64, directives stripped">
{`dot_val:                       ; the two Points arrive in s0-s3
        fmul    s1, s1, s3
        fmadd   s0, s0, s2, s1
        ret

dot_ref:                       ; two addresses arrive in x0, x1
        ldp     s0, s1, [x0]   ; ...so the callee has to load them
        ldp     s2, s3, [x1]
        fmul    s1, s1, s3
        fmadd   s0, s0, s2, s1
        ret

call_val:                      ; nothing to do but jump
        b       dot_val

call_ref:                      ; and the CALLER has to build a frame and spill
        sub     sp, sp, #32
        stp     x29, x30, [sp, #16]
        add     x29, sp, #16
        stp     s0, s1, [sp, #8]      ; write p to the stack
        stp     s2, s3, [sp]          ; write q to the stack
        add     x0, sp, #8            ; take its address
        mov     x1, sp
        bl      dot_ref
        ldp     x29, x30, [sp, #16]
        add     sp, sp, #32
        ret`}
      </CodeBlock>

      <p>
        Two instructions and a tail call versus a stack frame, four stores, two address
        computations, a real call and a matching teardown. The arm64 calling convention passes a
        two-float struct in floating-point registers; <code>const Point&amp;</code> throws that away
        and demands an address, which has to point at memory, which means the value gets written out
        and read back for no reason.
      </p>

      <InfoBox variant="note" title="And yet: the wall-clock difference was unmeasurable">
        <p>
          Fifty million calls to each, four independent accumulators so the floating-point latency
          is not the bottleneck, five runs:
        </p>
        <CodeBlock language="text" title="Real output — milliseconds for 50,000,000 calls">
{`style              r1       r2       r3       r4       r5
by value         25.1     25.1     25.4     25.9     25.1
const&           25.2     25.1     25.1     25.4     25.2`}
        </CodeBlock>
        <p>
          Identical. The out-of-order core absorbs the extra stores completely at this call rate.
          Getting even that far took three attempts, and the two failures are the real lesson:
          attempt one accumulated into a single <code>float</code> and measured the 3-cycle add
          latency instead (33.5 ms for both). Attempt two hoisted four of the five timed calls out
          of the loop, because the function is pure and only the last result was used — four of five
          runs reported <code>0.0 ms</code>. <strong>An optimiser that can see through your
          benchmark will delete it.</strong>
        </p>
        <p>
          So the honest rule is not &ldquo;by value is faster&rdquo;. It is: for small trivially
          copyable types, by value produces strictly simpler code with no memory round trip and no
          aliasing to reason about, so prefer it — but do not expect a microbenchmark to reward you.
          The usual threshold is <strong>two pointers&apos; worth, roughly 16 bytes, and trivially
          copyable</strong>. Above that, or if copying runs a constructor,{' '}
          <code>const&amp;</code> again.
        </p>
      </InfoBox>

      <h2>What <code>-O2</code> Actually Does</h2>

      <p>
        The most important thing to understand about optimisation levels is that they are not a
        speed dial. They change what program you have. Here is a loop:
      </p>

      <CodeBlock language="cpp" title="opt.cpp">
{`int sum_to(int n) {
    int s = 0;
    for (int i = 1; i <= n; ++i) s += i;
    return s;
}`}
      </CodeBlock>

      <CodeBlock language="asm" title="Real output — clang++ -std=c++23 -O0 -S, arm64">
{`sum_to:
        sub     sp, sp, #16
        str     w0, [sp, #12]        ; n lives on the stack
        str     wzr, [sp, #8]        ; so does s
        mov     w8, #1
        str     w8, [sp, #4]         ; and i
        b       LBB0_1
LBB0_1:                              ; the loop re-loads everything every pass
        ldr     w8, [sp, #4]
        ldr     w9, [sp, #12]
        subs    w8, w8, w9
        b.gt    LBB0_4
        b       LBB0_2
LBB0_2:
        ldr     w9, [sp, #4]
        ldr     w8, [sp, #8]
        add     w8, w8, w9
        str     w8, [sp, #8]
        b       LBB0_3
LBB0_3:
        ldr     w8, [sp, #4]
        add     w8, w8, #1
        str     w8, [sp, #4]
        b       LBB0_1
LBB0_4:
        ldr     w0, [sp, #8]
        add     sp, sp, #16
        ret`}
      </CodeBlock>

      <CodeBlock language="asm" title="Real output — clang++ -std=c++23 -O2 -S, same source">
{`sum_to:
        subs    w8, w0, #1
        b.lt    LBB0_2
        sub     w9, w0, #2
        umull   x8, w8, w9           ; a multiply...
        lsr     x8, x8, #1           ; ...a shift...
        add     w8, w8, w0, lsl #1   ; ...and two adds.
        sub     w0, w8, #1
        ret
LBB0_2:
        mov     w0, #0
        ret`}
      </CodeBlock>

      <p>
        <strong>There is no loop.</strong> The optimiser recognised the summation and replaced it
        with the closed form — it turned an O(n) algorithm into an O(1) one. That is not a
        peephole tweak, it is a different asymptotic complexity, and here is what it is worth:
      </p>

      <CodeBlock language="text" title="Real output — 20,000 calls to sum_to with growing n, five runs each, ms">
{`-O0    120.16    92.05    91.17    91.29    90.63   total=6666666650000
-O1      0.01      0.01      0.01      0.01      0.01   total=6666666650000
-O2      0.01      0.01      0.01      0.01      0.01   total=6666666650000
-O3      0.01      0.01      0.01      0.01      0.01   total=6666666650000
-Os      0.02      0.01      0.01      0.01      0.01   total=6666666650000`}
      </CodeBlock>

      <p>
        Same answer, roughly four orders of magnitude apart. Two things follow.{' '}
        <strong>Never draw a performance conclusion from a <code>-O0</code> build</strong> — it is
        not slow-but-representative, it is a different algorithm. And <strong>the jump that matters
        is <code>-O0</code> to <code>-O1</code></strong>; the levels above it are refinements.{' '}
        <code>-O2</code> is the sane default, <code>-O3</code> mainly adds more aggressive
        vectorisation and unrolling (bigger code, occasionally faster), and <code>-Os</code> is{' '}
        <code>-O2</code> with the size-increasing transformations suppressed, which on a
        cache-bound program sometimes wins.
      </p>

      <h2>Inlining, And When It Happens</h2>

      <p>
        Inlining is the enabling optimisation: it is what lets constant propagation, dead code
        elimination and vectorisation see through a function boundary, which is why zero-cost
        abstraction in C++ is really &ldquo;abstraction the inliner can dissolve&rdquo;. It is a
        cost-model decision, and you can read the model&apos;s working:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -Rpass=inline, our function only">
{`inl.cpp:7:26: remark: '_ZL5scalei' inlined into
  '_Z5totalRKNSt3__16vectorIiNS_9allocatorIiEEEE'
  with (cost=-15025, threshold=337) at callsite total:2:26; [-Rpass=inline]
    7 |     for (int x : v) s += scale(x);

$ nm -a inl.o | grep -i scale
(no symbol named scale -- fully inlined away)`}
      </CodeBlock>

      <p>
        A negative cost against a threshold of 337: inlining this made the program{' '}
        <em>smaller</em>, because the call sequence cost more than the body. The same run also
        reported <code>vector::begin</code>, <code>vector::end</code>, the iterator comparison and
        the iterator increment all being inlined into the loop — which is the entire reason a
        range-<code>for</code> over a <code>vector</code> costs the same as an index loop.
      </p>

      <InfoBox variant="info" title="What controls it, and what the inline keyword is not">
        <p>
          <strong>The <code>inline</code> keyword is not an inlining request.</strong> It is a
          linkage rule — it permits multiple identical definitions across translation units, which
          is what lets a function live in a header without violating{' '}
          <a href="/cpp/compiling">the one-definition rule</a>. The optimiser ignores it as a hint.
        </p>
        <p>
          What actually matters: <strong>the body has to be visible</strong>. A function defined in
          another <code>.cpp</code> cannot be inlined unless you enable link-time optimisation
          (<code>-flto</code>), which is why header-only and template-heavy C++ optimises so well
          and why a virtual call through a base pointer usually cannot be inlined at all — the
          target is not known until runtime. If you need to force the issue in either direction,{' '}
          <code>[[gnu::always_inline]]</code> and <code>[[gnu::noinline]]</code> are the real
          levers; the latter is used throughout this lesson to keep benchmark functions from being
          optimised away.
        </p>
      </InfoBox>

      <h2>Undefined Behaviour Is An Optimisation Licence</h2>

      <p>
        This is the conceptual heart of the lesson, and it is the single idea that separates
        reasoning about C++ from reasoning about Java or JavaScript. The standard does not say
        &ldquo;undefined behaviour might crash&rdquo;. It says a program containing it has no
        defined meaning — and the compiler turns that into an <em>assumption</em>: UB cannot occur,
        therefore any code path that would require it to occur is unreachable, therefore it can be
        optimised on that basis.
      </p>

      <p>
        Four one-line functions, built at <code>-O2</code>. The only difference between each pair is
        whether the type&apos;s overflow is defined.
      </p>

      <CodeBlock language="cpp" title="half.cpp">
{`int      twice_then_half_signed(int x)        { return x * 2 / 2; }
unsigned twice_then_half_unsigned(unsigned x) { return x * 2 / 2; }
bool     always_true_signed(int x)            { return x + 1 > x; }
bool     always_true_unsigned(unsigned x)     { return x + 1 > x; }`}
      </CodeBlock>

      <CodeBlock language="asm" title="Real output — clang++ -std=c++23 -O2 -Wall -Wextra -S, arm64">
{`twice_then_half_signed:          ; signed overflow is UB, so x*2 cannot
        ret                      ; overflow, so this is the identity function.
                                 ; ZERO instructions.

twice_then_half_unsigned:        ; unsigned overflow is DEFINED to wrap, so
        and     w0, w0, #0x7fffffff   ; the top bit really is lost and the
        ret                           ; compiler must reproduce that.

always_true_signed:              ; x + 1 > x cannot be false without
        mov     w0, #1           ; overflow, and overflow cannot happen.
        ret

always_true_unsigned:            ; but it IS false when x == UINT_MAX,
        cmn     w0, #1           ; so the comparison has to be done.
        cset    w0, ne
        ret`}
      </CodeBlock>

      <p>
        Read that as the compiler reasoning, not as the compiler cheating. It was told that signed
        overflow does not occur in a valid program. Given that premise, <code>x * 2 / 2</code>{' '}
        <em>is</em> <code>x</code> and <code>x + 1 &gt; x</code> <em>is</em> <code>true</code>, and
        emitting anything more would be emitting dead code. The unsigned versions get no such
        premise, so they get real instructions. <strong>Identical expressions; the type decided what
        the program means.</strong>
      </p>

      <p>
        Now the same mechanism applied to a loop, where it changes the answer:
      </p>

      <CodeBlock language="cpp" title="ub.cpp — how many increments until this int goes negative?">
{`[[gnu::noinline]] int count_up(int start) {
    int n = 0;
    for (int i = start; i >= 0; ++i) ++n;   // the bound LOOKS complete
    return n;
}

int main() {
    std::printf("count_up returned %d\\n", count_up(INT_MAX - 2));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three optimisation levels, -Wall -Wextra, zero warnings from any of them">
{`$ clang++ -std=c++23 -Wall -Wextra -O0 ub.cpp -o ub && ./ub
count_up returned 3          <- wraps to INT_MIN, i >= 0 goes false, loop ends

$ clang++ -std=c++23 -Wall -Wextra -O1 ub.cpp -o ub && ./ub
count_up returned 0

$ clang++ -std=c++23 -Wall -Wextra -O2 ub.cpp -o ub && ./ub
count_up returned 0          <- exit 0. No crash, no hang, no diagnostic.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Follow the inference chain — it is short and every step is legal">
        <p>
          <strong>Step 1.</strong> <code>i</code> is <code>int</code>, so <code>++i</code> must never
          overflow. <strong>Step 2.</strong> If it never overflows, <code>i</code> starting at a
          non-negative value and only increasing means <code>i &gt;= 0</code> is always true.{' '}
          <strong>Step 3.</strong> Therefore the loop never exits. <strong>Step 4.</strong> An
          infinite loop with no side effects has no defined behaviour either (the forward-progress
          rule), so it can be deleted. <strong>Step 5.</strong> With the loop gone,{' '}
          <code>n</code> is still <code>0</code>.
        </p>
        <p>
          The first draft of this lesson predicted the <code>-O2</code> build would hang forever. It
          does not — it returns instantly with the wrong answer, which is worse, because a hang gets
          investigated.
        </p>
      </InfoBox>

      <FlowChart
        title="How one piece of UB becomes a silently wrong answer"
        chart={
          'graph TD\n' +
          '  SRC["for (int i = start; i >= 0; ++i) ++n;<br/>reviewed, tested, looks bounded"] --> ASM{"what does the<br/>standard promise<br/>about ++i ?"}\n' +
          '  ASM -->|"int: signed overflow is<br/>UNDEFINED, so assume it<br/>cannot happen"| INF["therefore i >= 0 always<br/>therefore the loop is infinite<br/>therefore it has no side effects<br/>therefore delete it"]\n' +
          '  ASM -->|"unsigned, or -fwrapv:<br/>wrapping is DEFINED"| KEEP["the loop must be emitted<br/>and must wrap"]\n' +
          '  INF --> OUT1["-O1 / -O2 print 0"]\n' +
          '  KEEP --> OUT2["-O0, or any level with -fwrapv,<br/>prints 3"]\n' +
          '  OUT1 --> SHIP["both builds exit 0.<br/>-Wall -Wextra: zero warnings.<br/>Debug tests pass; release is wrong."]\n' +
          '  OUT2 --> SHIP\n' +
          '  SHIP --> FIX["The only tool that found it:<br/>-fsanitize=undefined<br/>signed integer overflow:<br/>2147483647 + 1 cannot be<br/>represented in type int"]\n' +
          '  style INF fill:#3b1a1a,stroke:#f87171\n' +
          '  style OUT1 fill:#3b1a1a,stroke:#f87171\n' +
          '  style SHIP fill:#3d2f14,stroke:#fb923c\n' +
          '  style FIX fill:#1a3329,stroke:#4ade80'
        }
      />

      <CodeBlock language="text" title="Real output — the two things that fix it">
{`$ clang++ -std=c++23 -O2 -fwrapv ub.cpp -o ubw && ./ubw
count_up returned 3
    -fwrapv DEFINES signed wrapping, which removes the licence.
    The program is now well defined and the answer is stable across -O levels.

$ clang++ -std=c++23 -O2 -g -fsanitize=undefined ub.cpp -o ubu && ./ubu
start = INT_MAX - 2
ub.cpp:8:33: runtime error: signed integer overflow: 2147483647 + 1 cannot be
represented in type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior ub.cpp:8:33
count_up returned 3
    Caught identically at -O0, -O1 and -O2. Note exit status 0 -- UBSan
    reports and continues unless you add -fno-sanitize-recover=all.`}
      </CodeBlock>

      <p>
        Three consequences worth carrying around.{' '}
        <strong>UB is not a risk of crashing, it is a change to what your code compiles to</strong> —
        the null check deleted from the binary in{' '}
        <a href="/cpp/memory-bugs">the memory bugs lesson</a>, the race that printed{' '}
        <code>0</code> at <code>-O2</code> in <a href="/cpp/concurrency">the concurrency lesson</a>,
        and the loop deleted here are all the same mechanism.{' '}
        <strong>More optimisation exposes more of it</strong>, which is exactly why &ldquo;it works
        in debug&rdquo; is not evidence. And <strong>warnings will not find it</strong>: these
        builds were <code>-Wall -Wextra</code> clean. UBSan found it at every level; it belongs in
        CI, which is where <a href="/cpp/tooling">the next lesson</a> puts it.
      </p>

      <h2>The Attributes Worth Knowing</h2>

      <p>
        Three attributes get mentioned in every performance discussion. Two of them are weaker than
        advertised and one is genuinely valuable — and not for speed.
      </p>

      <CodeBlock language="cpp" title="attrs.cpp — a hint that agrees with the compiler's own guess">
{`void plain(int x)  { if (x < 0) { slow_path(); } else { fast_path(); } }
void hinted(int x) { if (x < 0) [[unlikely]] { slow_path(); }
                     else       [[likely]]   { fast_path(); } }`}
      </CodeBlock>

      <CodeBlock language="asm" title="Real output — clang++ -std=c++23 -O2 -S. The two functions are identical.">
{`plain:                          hinted:
        tbnz    w0, #31, LBB0_2         tbnz    w0, #31, LBB1_2
        b       fast_path               b       fast_path
LBB0_2:                         LBB1_2:
        b       slow_path               b       slow_path`}
      </CodeBlock>

      <p>
        Instruction for instruction the same: clang had already guessed that a{' '}
        <code>&lt; 0</code> test guards the error path. The attributes are not <em>inert</em>,
        though — give one that contradicts the compiler and the block layout flips:
      </p>

      <CodeBlock language="asm" title="Real output — the same branch with [[likely]] on the error path">
{`inverted:                        ; told the error path is the common one
        tbz     w0, #31, LBB0_2  ; so the puts() path is now the fall-through
        stp     x29, x30, [sp, #-16]!
        ...                      ; the whole puts() sequence, inline
        ret
LBB0_2:
        b       work             ; and the "unlikely" work() path is the jump

plain2:                          ; no hints: clang's own guess, the reverse
        tbnz    w0, #31, LBB1_2
        b       work             ; work() is the fall-through
LBB1_2:
        stp     x29, x30, [sp, #-16]!
        ...`}
      </CodeBlock>

      <p>
        So <code>[[likely]]</code> and <code>[[unlikely]]</code> affect{' '}
        <strong>basic block placement</strong> — which path falls through and stays in the
        instruction cache — and nothing else. They are worth adding where you know something the
        compiler cannot, such as a validation branch that fails once a month. They are worth
        nothing as decoration, and a wrong hint actively costs you.
      </p>

      <p>
        <code>[[nodiscard]]</code> is the one that earns its place, and it buys correctness rather
        than speed:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -fsyntax-only nd.cpp">
{`nd.cpp:10:5: warning: ignoring return value of function declared with
  'nodiscard' attribute [-Wunused-result]
   10 |     try_parse(s, n);        // return value ignored

nd.cpp:11:5: warning: ignoring return value of function declared with
  'nodiscard' attribute: the buffer is unchanged; use the returned copy
  [-Wunused-result]
   11 |     trimmed(s);             // return value ignored, with a reason

nd.cpp:12:5: warning: ignoring return value of function declared with
  'nodiscard' attribute [-Wunused-result]
   12 |     v.empty();              // std::vector::empty is [[nodiscard]] in libc++
3 warnings generated.`}
      </CodeBlock>

      <p>
        Three real diagnostics: a plain <code>[[nodiscard]]</code>, a C++20{' '}
        <code>[[nodiscard(&quot;reason&quot;)]]</code> whose text is printed verbatim, and libc++
        putting the attribute on its own <code>empty()</code> so that the classic{' '}
        <code>v.empty();</code>-instead-of-<code>v.clear();</code> typo is a warning rather than a
        silent no-op. Put it on anything whose return value <em>is</em> the result — error codes,{' '}
        <a href="/cpp/errors"><code>std::expected</code></a>, and every non-mutating query that
        looks like a command.
      </p>

      <h2>Moves And <code>reserve</code> In A Hot Path</h2>

      <p>
        <a href="/cpp/move-semantics">Move semantics</a> covered the mechanics. The question here is
        what it is worth. One million heap-allocated strings — 49 characters each, well past
        libc++&apos;s 22-character small-string buffer — copied or moved into a second vector, with
        the source rebuilt untimed before every run:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 hotpath.cpp, five runs, ms">
{`what                                             r1       r2       r3       r4       r5
reserve + push_back(s)        [copy]           23.6     21.1     17.0     17.3     17.3
reserve + push_back(move(s))  [move]            8.2      8.9      8.4      8.7      8.4
NO reserve + push_back(s)     [copy]           20.3     18.0     18.4     17.6     18.1
NO reserve + push_back(move(s)) [move]          8.7      9.2      8.8      9.2      8.5`}
      </CodeBlock>

      <p>
        <strong>Moving is about 2&times; copying</strong> — roughly 8.5 ms against 17.5 ms — and the
        gap is entirely the million <code>malloc</code>/<code>memcpy</code> pairs the copy does and
        the move does not. For a type that owns heap memory, in a loop, that is a real win for one
        keyword.
      </p>

      <InfoBox variant="warning" title="Expected and falsified: reserve() bought nothing here">
        <p>
          Look at rows 1 and 3. <code>reserve(1'000'000)</code> saved about 1 ms out of 18 — noise.
          That is not what <a href="/cpp/containers">the containers lesson</a> would lead you to
          expect, and the reason is specific: <code>std::string</code>&apos;s move constructor is{' '}
          <code>noexcept</code>, so each of the ~20 geometric reallocations <em>moves</em> the
          existing elements rather than copying them, and 20 bulk moves over a million 24-byte
          headers is cheap.
        </p>
        <p>
          Change either of those conditions and <code>reserve</code> matters again. Measured:
        </p>
        <CodeBlock language="text" title="Real output — res.cpp, three runs, ms">
{`what                                     r1       r2       r3
vector<int>, no reserve                16.3      7.6      6.5     (20,000,000 push_back)
vector<int>, reserve                    4.5      4.5      4.4
vector<Fragile>, no reserve            77.1     68.1     61.3     (2,000,000 push_back)
vector<Fragile>, reserve               33.2     31.0     27.8
is_nothrow_move_constructible_v<Fragile> = false`}
        </CodeBlock>
        <p>
          <code>vector&lt;int&gt;</code>: 1.5&times;, because reallocation means memcpying up to
          80 MB. <code>Fragile</code> is the same string-holding type with its move constructor
          written <em>without</em> <code>noexcept</code> — <strong>2.2&times;</strong>, because
          <code>std::vector</code> must fall back to copying every element on every growth to keep
          its exception guarantee. That is the <code>noexcept</code> result from{' '}
          <a href="/cpp/move-semantics">move semantics</a> showing up as wall-clock time.
        </p>
        <p>
          <code>reserve</code> remains free to write and still has a second, non-performance
          justification: it is the only way to keep pointers and iterators into a growing{' '}
          <code>vector</code> valid.
        </p>
      </InfoBox>

      <h2>The Honest Closing: Almost None Of This Is Where Your Time Goes</h2>

      <p>
        Everything above is real and most of it will never decide anything. The same lookup, three
        data structures, 20,000 queries against 20,000 elements, built at two optimisation levels:
      </p>

      <CodeBlock language="text" title="Real output — lookup.cpp at -O0 and -O2, two runs each">
{`######## built with -O0 ########
linear scan          94.15 ms  hits=9897
binary search          4.48 ms  hits=9897
hash set               0.69 ms  hits=9897
linear scan          68.69 ms       (second run)
binary search          4.41 ms
hash set               0.67 ms

######## built with -O2 ########
linear scan          97.72 ms  hits=9897
binary search          0.49 ms  hits=9897
hash set               0.10 ms  hits=9897
linear scan          68.13 ms       (second run)
binary search          0.44 ms
hash set               0.09 ms`}
      </CodeBlock>

      <p>
        <strong>The hash set compiled at <code>-O0</code> beat the linear scan compiled at{' '}
        <code>-O2</code> by about 100&times;.</strong> No attribute, no{' '}
        <code>const&amp;</code> decision, no cache-line padding and no optimisation level recovers a
        factor of 100 from the wrong data structure. Pick the structure first; the rest of this
        lesson is for after the profile says you need it.
      </p>

      <InfoBox variant="question" title="One more thing that surprised this lesson: the linear scan ignored -O2 entirely">
        <p>
          68 ms at <code>-O0</code> and 68 ms at <code>-O2</code>, for a loop over integers. That
          should be impossible — an unoptimised comparison loop ought to be several times slower.
          Checking the assembly instead of theorising:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -O2 -S on std::find over a vector<int>, filtered">
{`$ clang++ -std=c++23 -O2 -S -o - findasm.cpp | grep -E "bl "
        bl      _wmemchr`}
        </CodeBlock>
        <p>
          libc++ dispatches <code>std::find</code> over a contiguous range of 4-byte integers to{' '}
          <strong><code>wmemchr</code></strong> — a hand-vectorised routine inside libSystem. The
          loop is not in your translation unit at all, so your <code>-O</code> flag has nothing to
          say about it. Meanwhile <code>binary_search</code>, whose comparisons <em>are</em> your
          code, went from 4.4 ms to 0.44 ms with the same flag change. The optimiser matters exactly
          where the hot loop is code you compiled.
        </p>
      </InfoBox>

      <h2>Key Takeaways</h2>

      <p>
        <strong>Measure, never guess</strong> — and on macOS that means{' '}
        <code>/usr/bin/sample</code> (verified working, with demangled C++ frames and line numbers),
        because <code>perf</code>, <code>valgrind</code> and <code>gprof</code> are all absent and{' '}
        <code>xctrace</code> needs full Xcode. <strong>Contiguity is worth up to ~2000&times;</strong>:
        random access measured 0.9 ns in L1 and 115 ns in DRAM, while a sequential scan of the same
        memory stayed at 0.03&ndash;0.08 ns per element at every size. <strong>The expensive thing
        is not indirection, it is <em>serialised</em> indirection</strong> — the same two million
        shuffled objects cost 4.6 ms traversed through a contiguous pointer array and 156 ms chased
        through their own <code>next</code> pointers. <strong>Find accidental copies by
        instrumenting a type</strong>, because no warning level catches{' '}
        <code>for (auto x : v)</code>; do take the one warning you get —{' '}
        <code>-Wrange-loop-construct</code> in <code>-Wall</code> — seriously, since it catches the{' '}
        <code>pair&lt;const K, V&gt;</code> trap that copies every element of a map.{' '}
        <strong>Pass small trivially copyable types by value</strong>: the assembly is strictly
        simpler, even though 50 million calls could not tell the two apart.{' '}
        <strong><code>-O2</code> is not a speed dial</strong> — it replaced an O(n) loop with closed
        form here, 91 ms to 0.01 ms, so never benchmark at <code>-O0</code>.{' '}
        <strong>Undefined behaviour is an optimisation licence, not a crash risk</strong>: signed{' '}
        <code>x * 2 / 2</code> compiles to <code>ret</code> while the unsigned version must mask,
        and a loop with a bound that looked complete returned <code>3</code> at <code>-O0</code> and{' '}
        <code>0</code> at <code>-O2</code> with zero warnings — UBSan was the only thing that found
        it. <strong><code>[[nodiscard]]</code> is worth more than <code>[[likely]]</code></strong>,
        which only moves basic blocks and did nothing at all when it agreed with clang&apos;s own
        guess. <strong>Moving beat copying 2&times;</strong> on a million strings, while{' '}
        <code>reserve</code> saved nothing there and 2.2&times; on a type whose move was not{' '}
        <code>noexcept</code>. And <strong>the algorithm dominates everything above</strong>: a hash
        set at <code>-O0</code> was 100&times; faster than a linear scan at <code>-O2</code>.
      </p>

      <h2>Where This Leads</h2>
      <p>
        Every number on this page came from measuring rather than guessing, and three times now a
        sanitizer has been the only thing standing between a confident wrong answer and a shipped
        bug — <a href="/cpp/memory-bugs">the leak and the use-after-free</a>, the race in{' '}
        <a href="/cpp/concurrency">the previous lesson</a>, and the <code>-O2</code> loop on this
        one that returned <code>0</code> without a warning.
      </p>
      <p>
        <strong><a href="/cpp/tooling">Build Systems, Debugging &amp; Sanitizers</a></strong> is the
        last lesson, and it is the one that makes all of that routine instead of lucky: the warning
        flags worth turning on, the sanitizer builds worth keeping as separate CI jobs, enough CMake
        to structure a real project, and the debugger. It is the difference between knowing these
        bugs exist and having something that catches them for you.
      </p>
    </LessonLayout>
  );
}
