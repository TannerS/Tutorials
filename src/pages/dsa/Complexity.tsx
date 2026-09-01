import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Complexity() {
  return (
    <LessonLayout
      title="Complexity Analysis: Big-O in Practice"
      sectionId="dsa"
      lessonIndex={0}
      prev={null}
      next={{ path: '/dsa/arrays-sorting', label: 'Arrays & Sorting Algorithms' }}
    >
      <p>
        Every algorithm lesson that follows this one leans on the vocabulary in this page, and interview
        panels lean on it even harder — &quot;what&apos;s the time complexity&quot; is close to a
        universal opener. It is also the topic developers are sloppiest about, because the shorthand
        (&quot;it&apos;s O(n)&quot;) is so convenient that the precise meaning underneath it erodes. This
        lesson does not assert a single growth-rate claim from memory — every number below was produced by
        compiling and running real Java against the installed JDK (<code>26.0.1</code>) and pasting the
        actual console output, plus one measurement of Java&apos;s real <code>ArrayList</code> internals
        via reflection. Where the numbers came out messier than the textbook curve, that mess is shown too,
        with the real explanation for it.
      </p>

      <h2>The Intuition First, Before Any Notation</h2>

      <p>
        Before a single symbol: imagine looking up &quot;Smith&quot; in a phone book versus finding one
        particular receipt in a shoebox of loose, unsorted paper. In the phone book you flip open to
        roughly the middle, see whether you overshot or undershot, and repeat on whichever half is left —
        a handful of flips gets you there even in a book with a million names, because each flip throws
        away half of what remains. In the shoebox there is no such shortcut: nothing is in order, so the
        only honest strategy is checking receipts one at a time until you find it or run out. Double the
        receipts and the worst-case search roughly doubles too; double the phone book and you barely add
        one more flip. That gap — how the <em>work</em> grows as the <em>pile</em> grows — is exactly what
        the notation below exists to measure precisely.
      </p>

      <CodeBlock language="text" title="The shape of each growth rate, at a glance (schematic sketch, not measured data)">
{`work
required
  ^                                                        #   O(n^2)  -- doubling the input
  |                                                #             roughly QUADRUPLES the work
  |                                        #
  |                                #
  |                        #                                +   O(n)    -- doubling the input
  |                #                                +             roughly DOUBLES the work
  |        #                                +
  |    #                        +
  |o o o o o o o o o o o o o o o o o o o o o o o o o o o o  O(log n) -- doubling the input barely
  |                                                              adds one more step (the phone book)
  |-------------------------------------------------------  O(1)    -- flat: same cost no matter
  +-------------------------------------------------------->            the input size (array index)
    small input                                    large input (n)`}
      </CodeBlock>

      <p>
        That is the whole intuition, before any proof: O(1) and O(log n) barely notice the pile getting
        bigger, O(n) feels it directly, and O(n²) gets punished hard. The rest of this lesson puts exact,
        measured numbers behind that shape — starting with what the notation is actually promising.
      </p>

      <InfoBox variant="warning" title="The Sloppy Habit This Lesson Won't Repeat">
        <p>
          In casual conversation and most interviews, &quot;Big-O&quot; gets used as a catch-all for
          three <em>different</em> things: an upper bound, a lower bound, and a tight bound. They have
          different names — <strong>O</strong>, <strong>Ω</strong> (Omega), and <strong>Θ</strong> (Theta)
          — and conflating them is so common that most engineers have never seen them separated. This
          lesson uses the correct one deliberately, and calls out the moments where casual usage would
          have blurred them.
        </p>
      </InfoBox>

      <h2>What Big-O Actually Means</h2>

      <p>
        <strong>Big-O describes how an algorithm&apos;s cost grows as the input grows — not how many
        operations it performs for a specific input.</strong> Formally, f(n) = O(g(n)) means there exist
        positive constants c and n₀ such that f(n) ≤ c·g(n) for every n ≥ n₀. That reads abstractly until
        you plug in real numbers, so before going any further: take <strong>f(n) = 3n + 20</strong> and
        claim it is O(n) — i.e. g(n) = n. The definition says that claim is true only if <em>some</em>{' '}
        c and n₀ actually make <code>3n + 20 ≤ c·n</code> hold for every n from n₀ onward. Pick{' '}
        <strong>c = 4</strong> and <strong>n₀ = 20</strong> and check it directly:
      </p>

      <CodeBlock language="text" title="Checking f(n) = 3n + 20 is O(n), with c = 4 and n₀ = 20">
{`claim: 3n + 20 <= 4n   for every n >= 20
     <=>   20 <= n         (subtract 3n from both sides)

n = 20:    3(20) + 20 = 80   <=   4(20) = 80    true (equal — the boundary case)
n = 30:    3(30) + 20 = 110  <=   4(30) = 120   true
n = 100:   3(100) + 20 = 320 <=   4(100) = 400  true
n = 19:    3(19) + 20 = 77   <=   4(19) = 76    FALSE — this is exactly why n0 = 20 is required,
                                                  not "for all n >= 1"`}
      </CodeBlock>

      <p>
        That is the entire proof obligation of &quot;O(n)&quot;, worked with real numbers instead of left
        abstract: find one constant multiplier (c = 4) and one starting point (n₀ = 20) past which the
        straight line <code>4n</code> stays on top of <code>3n + 20</code> forever. It doesn&apos;t have to
        hold for small n (n = 19 fails above, and that&apos;s fine — the definition only requires n ≥ n₀),
        and c and n₀ are not unique — c = 5, n₀ = 10 also works, and so do infinitely many other pairs. Big-O
        only claims that <em>at least one</em> such pair exists. Two things fall out of that definition
        that casual usage routinely drops:
      </p>

      <p>
        <strong>1. Constants and lower-order terms are thrown away on purpose.</strong> An algorithm that
        does exactly <code>3n + 20</code> comparisons and one that does exactly <code>0.1n</code> comparisons
        are both O(n) — Big-O is making a claim about the <em>shape</em> of the growth curve (linear, in
        both cases) as n gets large, not the exact count at any particular n. &quot;O(n)&quot; does not mean
        &quot;n operations.&quot; It means <strong>the operation count scales linearly with n</strong>,
        whatever the multiplier happens to be.
      </p>

      <p>
        <strong>2. Big-O is an upper bound, and upper bounds are not unique.</strong> Linear search over an
        unsorted array of n elements does at most n comparisons in the worst case, so its tight bound is
        Θ(n). But n ≤ n² for every n ≥ 1 — which means it is also <em>technically true</em>, if completely
        unhelpful, to say linear search is O(n²). The definition of O only requires <em>some</em> constant
        multiple of g(n) to dominate f(n) eventually; it never requires g(n) to be the smallest such
        function. By convention, engineers always state the <em>tightest</em> true bound they can — but
        &quot;O(n²)&quot; for a linear-search loop is not a lie, it is just a useless truth. Understanding
        why it&apos;s technically valid is what separates &quot;memorized O(n)&quot; from actually
        understanding the definition.
      </p>

      <h2>Big-O vs Big-Omega vs Big-Theta</h2>

      <InfoBox variant="tip" title="Read This Before the Table: You Will Almost Never Write Ω or Θ Again">
        <p>
          Set expectations up front so the three symbols below don&apos;t feel like three things to
          memorize equally hard: <strong>every complexity table in every lesson after this one uses plain
          O() only.</strong> Ω and Θ exist here for completeness and because &quot;what&apos;s the actual
          difference between O, Ω, and Θ&quot; is a real interview vocabulary question — being able to
          say &quot;binary search is Θ(log n), not just O(log n), because log n is both an upper{' '}
          <em>and</em> a lower bound on its worst case&quot; signals real understanding. But day to day,
          in this course and in the industry, &quot;Big-O&quot; is used loosely to mean &quot;the tight
          bound,&quot; and nobody will blink if you say O(n log n) instead of Θ(n log n) for merge sort.
          Learn the distinction once, here — then let it go and use O() like everyone else does.
        </p>
      </InfoBox>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Notation</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Bound type</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Plain meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>O(g(n))</strong></td>
            <td style={{ padding: '0.75rem' }}>Upper bound</td>
            <td style={{ padding: '0.75rem' }}>Grows <em>no faster than</em> g(n). &quot;It won&apos;t be worse than this.&quot;</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Ω(g(n))</strong></td>
            <td style={{ padding: '0.75rem' }}>Lower bound</td>
            <td style={{ padding: '0.75rem' }}>Grows <em>no slower than</em> g(n). &quot;It won&apos;t be better than this.&quot;</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Θ(g(n))</strong></td>
            <td style={{ padding: '0.75rem' }}>Tight bound</td>
            <td style={{ padding: '0.75rem' }}>Both O(g(n)) <em>and</em> Ω(g(n)) — grows <em>exactly</em> at this rate, up to constants.</td>
          </tr>
        </tbody>
      </table>

      <p>
        A subtlety that trips people up even after they know the three symbols: O, Ω, and Θ describe{' '}
        <strong>a specific function</strong> — usually &quot;worst-case running time as a function of
        n&quot; — not &quot;the algorithm&quot; as one monolithic fact. Binary search&apos;s{' '}
        <strong>worst-case</strong> comparison count is Θ(log n). Its <strong>best case</strong> (the
        target happens to be the first element it checks) is Θ(1). Both statements are correct and are not
        in tension, because they are bounding two different functions — best-case cost and worst-case
        cost — of the same algorithm. When someone says &quot;binary search is O(log n)&quot; with no
        qualifier, they mean the worst case by convention, and worst-case O(log n) here happens to equal
        worst-case Θ(log n), because log n is genuinely the tightest bound, not just <em>a</em> true one.
      </p>

      <h2>The Standard Complexity Classes, Measured</h2>

      <p>
        In increasing order of growth, the classes that come up constantly in interviews and in this
        section:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Class</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Canonical example</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--accent-amber)' }}>Ops at n=10</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--accent-amber)' }}>Ops at n=40</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>O(1)</td>
            <td style={{ padding: '0.75rem' }}>Array index access</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>1</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>1</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>O(log n)</td>
            <td style={{ padding: '0.75rem' }}>Binary search</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>~3.3</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>~5.3</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>O(n)</td>
            <td style={{ padding: '0.75rem' }}>Linear scan</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>10</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>40</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>O(n log n)</td>
            <td style={{ padding: '0.75rem' }}>Merge sort (next lesson)</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>~33.2</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>~212.9</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>O(n²)</td>
            <td style={{ padding: '0.75rem' }}>Nested-loop pair sum</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>100</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>1,600</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>O(2ⁿ)</td>
            <td style={{ padding: '0.75rem' }}>Naive recursive Fibonacci</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>1,024</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>~1.1 trillion</td>
          </tr>
        </tbody>
      </table>

      <p>
        Those right two columns are plain math (log₂10 ≈ 3.32, etc.), not a claim to take on faith. The
        point of the table is the shape: at n=10 every class is in the same ballpark; by n=40 the O(2ⁿ)
        column has already left the others behind by nine orders of magnitude. Here is the empirical half —
        four of these classes, actually implemented and timed in Java at increasing n:
      </p>

      <CodeBlock language="java" title="GrowthRates.java — the four hot loops being timed">
{`// O(1): index access, repeated many times so the duration is measurable
static long constantOp(int[] arr, long reps) {
    long start = System.nanoTime();
    long sink = 0;
    int n = arr.length;
    for (long i = 0; i < reps; i++) sink += arr[(int) (i % n)];
    return System.nanoTime() - start;
}

// O(log n): binary search, overflow-safe midpoint
static int binarySearch(int[] a, int target) {
    int low = 0, high = a.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (a[mid] == target) return mid;
        else if (a[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

// O(n): linear scan, worst case — value absent, forces a full pass
static long linearScanOp(int[] arr) {
    long start = System.nanoTime();
    int target = -1;
    for (int i = 0; i < arr.length; i++) if (arr[i] == target) break;
    return System.nanoTime() - start;
}

// O(n^2): brute-force pair-sum count, no hashing shortcut
static long quadraticOp(int[] arr, int target) {
    long start = System.nanoTime();
    int count = 0, n = arr.length;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (arr[i] + arr[j] == target) count++;
    return System.nanoTime() - start;
}`}
      </CodeBlock>

      <p>
        Each size below is the <strong>minimum of several timed runs after a dedicated JIT warm-up
        phase</strong> — an early version of this benchmark warmed up each method with a single call, and
        the results were dominated by HotSpot compilation noise (a run at n=1,000 measured slower than
        n=2,000 for the O(n²) case, which is impossible if the timing is measuring the algorithm and not
        the JIT). Minimum-of-N after real warm-up is standard practice for exactly this reason. Real
        output, JDK 26.0.1, this machine:
      </p>

      <CodeBlock language="text" title="Real console output — O(1) and O(n) side by side">
{`=== O(1): array index access, min of 7 runs of 20,000,000 reps each ===
n=     1,000  best-of-7 total=   10.14 ms  avg/op=0.507 ns
n=    10,000  best-of-7 total=   10.10 ms  avg/op=0.505 ns
n=   100,000  best-of-7 total=   10.28 ms  avg/op=0.514 ns
n= 1,000,000  best-of-7 total=   10.28 ms  avg/op=0.514 ns
n=10,000,000  best-of-7 total=    9.67 ms  avg/op=0.483 ns

=== O(n): linear scan, worst case, min of 9 runs per size ===
n=      1,000  best-of-9=   0.0002 ms  ns/element=0.166
n=     10,000  best-of-9=   0.0012 ms  ns/element=0.121
n=    100,000  best-of-9=   0.0122 ms  ns/element=0.122
n=  1,000,000  best-of-9=   0.1194 ms  ns/element=0.119
n= 10,000,000  best-of-9=   1.0543 ms  ns/element=0.105
n=100,000,000  best-of-9=  11.2122 ms  ns/element=0.112`}
      </CodeBlock>

      <p>
        O(1) is the easy one to confirm: per-operation cost sits flat at ~0.5 ns whether the array has
        1,000 elements or 10,000,000 — the defining property of a constant bound is that the line is{' '}
        <em>flat</em> against n. O(n) shows the other signature: the per-element cost (ns/element) stays
        roughly constant across five orders of magnitude of n, which is exactly what &quot;total time scales
        linearly with n&quot; looks like empirically — n going from 1,000 to 100,000,000 (100,000×) took the
        total time from 0.0002 ms to 11.21 ms, a ~56,000× increase, in the right ballpark given that the
        smallest runs are close to the timer&apos;s noise floor.
      </p>

      <CodeBlock language="text" title="Real console output — O(n²), min of 5 runs per size">
{`=== O(n^2): brute-force pair-sum count, min of 5 runs per size ===
n=     1,000  best-of-5=     0.066 ms  time/n^2=0.06633 ns
n=     2,000  best-of-5=     0.251 ms  time/n^2=0.06280 ns
n=     4,000  best-of-5=     0.980 ms  time/n^2=0.06126 ns
n=     8,000  best-of-5=     3.416 ms  time/n^2=0.05338 ns
n=    16,000  best-of-5=    15.062 ms  time/n^2=0.05883 ns`}
      </CodeBlock>

      <p>
        <code>time / n²</code> stays inside a tight 0.053–0.066 ns band across a 16× range of n — the
        signature of quadratic growth is that dividing out n² makes the ratio flat, the same way dividing
        out n made the O(n) ratio flat above. Put another way: each time n doubles, time roughly
        quadruples — 1,000→2,000 is a 3.80× time increase, 4,000→8,000 is 3.49×, 8,000→16,000 is 4.41×, all
        clustered around the 4× a doubling of n predicts for n².
      </p>

      <InfoBox variant="note" title="Where the O(log n) Data Got Interesting">
        <p>
          Timing binary search by wall clock did <em>not</em> produce a clean log curve — average time per
          search rose from 7.4 ns (n=1,000) to 50.6 ns (n=10,000,000), a ~6.8× increase, while log₂(n) only
          grows ~2.3× over that same range. The <em>operation count</em> tells a completely different, much
          cleaner story. Counting the exact number of comparison steps in the worst case (target absent)
          instead of timing wall-clock:
        </p>
        <CodeBlock language="text" title="Exact comparison-step count vs. floor(log2(n))+1">
{`n=      1,000  actual worst-case steps= 10   floor(log2(n))+1=10   match
n=     10,000  actual worst-case steps= 14   floor(log2(n))+1=14   match
n=    100,000  actual worst-case steps= 17   floor(log2(n))+1=17   match
n=  1,000,000  actual worst-case steps= 20   floor(log2(n))+1=20   match
n= 10,000,000  actual worst-case steps= 24   floor(log2(n))+1=24   match
n=100,000,000  actual worst-case steps= 27   floor(log2(n))+1=27   match`}
        </CodeBlock>
        <p>
          Not &quot;close to&quot; log₂(n) — <strong>exactly</strong> floor(log₂(n))+1, on every size. That
          number is found by brute force, not sampling: for each n the program runs the search once for{' '}
          <em>every</em> absent target (all the odd values that fall in the gaps of an all-even array,
          including one below the first element and one above the last) and keeps the maximum step count.
          The best case among absent targets is one step lower, so a search that stops a level early is
          possible — but the worst case never exceeds the formula and always reaches it. The same
          exhaustive check for every n from 1 to 5,000 also matches the formula with no exceptions.
          This is the cleanest illustration in this lesson of the point made at
          the top: <strong>Big-O predicts operation-count growth, not wall-clock time.</strong> The step
          count grows exactly as the formula predicts; wall-clock time additionally depends on hardware —
          here, cache locality. A 1,000-element <code>int[]</code> (4 KB) fits entirely in L1 cache, so
          every probe is essentially free; a 10,000,000-element array (40 MB) does not, so large-n binary
          search pays real cache-miss latency on each jump. Big-O deliberately abstracts that away — which
          is exactly why it is not the same thing as a stopwatch.
        </p>
      </InfoBox>

      <p>
        Last one — naive recursive Fibonacci is routinely called &quot;O(2ⁿ)&quot; in casual conversation.
        It is a true upper bound, but is it the <em>tight</em> one? Measuring the real call count settles
        it:
      </p>

      <CodeBlock language="java" title="ExponentialFib.java">
{`static long calls = 0;
static long fib(int n) {
    calls++;
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real console output — call-count growth ratio every 2 steps of n">
{`fib(20)=       6,765  calls=        21,891  time=    0.124 ms
fib(22)=      17,711  calls=        57,313  time=    0.073 ms  calls-ratio-vs-prev(n-2)=2.618
fib(24)=      46,368  calls=       150,049  time=    0.142 ms  calls-ratio-vs-prev(n-2)=2.618
fib(28)=     317,811  calls=     1,028,457  time=    0.935 ms  calls-ratio-vs-prev(n-2)=2.618
fib(32)=   2,178,309  calls=     7,049,155  time=    6.678 ms  calls-ratio-vs-prev(n-2)=2.618
fib(36)=  14,930,352  calls=    48,315,633  time=   47.413 ms  calls-ratio-vs-prev(n-2)=2.618
fib(40)= 102,334,155  calls=   331,160,281  time=  324.166 ms  calls-ratio-vs-prev(n-2)=2.618

phi^2 = 2.618  (expected ratio every 2 steps if growth is Theta(phi^n))
2^2   = 4.000  (expected ratio every 2 steps if growth were tightly O(2^n))`}
      </CodeBlock>

      <p>
        The call count grows by a factor of <strong>2.618 every 2 steps of n, to three decimal places,
        every single time</strong> — not 4.0. 2.618 is φ² where φ = (1+√5)/2 ≈ 1.618, the golden ratio.
        Naive Fibonacci&apos;s tight bound is <strong>Θ(φⁿ)</strong>, not Θ(2ⁿ) — φ ≈ 1.618 is genuinely
        smaller than 2. &quot;O(2ⁿ)&quot; is still a true statement (φⁿ ≤ 2ⁿ for all n ≥ 0, so it is a valid
        upper bound), but it is the same situation as linear search being &quot;technically O(n²)&quot;
        from earlier — true, and not the tightest available answer. This is precisely the O-vs-Θ distinction
        from the earlier section, showing up in one of the most commonly memorized complexity facts in
        interview prep.
      </p>

      <h2>Space Complexity</h2>

      <p>
        Space complexity counts the <strong>extra</strong> memory an algorithm uses beyond the input itself
        — auxiliary data structures, and (the part that is easy to forget) the call stack. Recursive code
        that never allocates an array or a list can still be O(n) in space, because every pending call
        keeps a stack frame alive until it returns. A recursive sum looks clean on the page; it is not free:
      </p>

      <CodeBlock language="java" title="RecursionSpace.java">
{`static long recursiveSum(int n) {
    if (n == 0) return 0;
    return n + recursiveSum(n - 1); // the '+' is pending -> this frame stays on the stack
}

static long iterativeSum(int n) {
    long sum = 0;
    for (int i = 1; i <= n; i++) sum += i; // one variable, reused every iteration
    return sum;
}`}
      </CodeBlock>

      <p>
        <code>recursiveSum</code> cannot add <code>n</code> to the result of <code>recursiveSum(n - 1)</code>{' '}
        until that inner call returns, so all n frames are simultaneously alive at the deepest point of the
        recursion — O(n) auxiliary space. <code>iterativeSum</code> reuses one <code>long</code> the entire
        time — O(1). Both compute the identical result; only the memory profile differs. Proving the
        difference is real, not theoretical, means finding the JVM&apos;s actual default stack limit and
        showing recursion dies there while iteration does not:
      </p>

      <CodeBlock language="text" title="Real console output">
{`=== Correctness check: recursive vs iterative agree ===
n=     0  recursiveSum=0  iterativeSum=0  match=true
n=10,000  recursiveSum=50,005,000  iterativeSum=50,005,000  match=true

=== Empirically find the default JVM stack's max recursion depth ===
StackOverflowError after 32,775 nested calls

=== recursiveSum at/near that depth ===
recursiveSum(16,387) succeeded -> 134,275,078
recursiveSum(98,325) -> StackOverflowError (n exceeds max stack depth)

=== iterativeSum at the SAME large n: no stack growth, just a loop ===
iterativeSum(98,325) succeeded -> 4,833,951,975  (O(1) auxiliary space: one 'sum' variable)
iterativeSum(500,000,000) succeeded -> 125,000,000,250,000,000  (still just one variable)`}
      </CodeBlock>

      <p>
        On this JVM, with the default thread stack size, unbounded recursion dies at 32,775 nested calls —
        every time, deterministically, because each frame consumes a fixed slice of a fixed-size stack.{' '}
        <code>recursiveSum(98,325)</code> throws <code>StackOverflowError</code>;{' '}
        <code>iterativeSum(98,325)</code>, and even <code>iterativeSum(500,000,000)</code>, complete
        instantly with no growth in memory use at all. That gap <em>is</em> O(n) vs O(1) space, made
        concrete instead of asserted.
      </p>

      <InfoBox variant="info" title="No, the JVM Doesn't Optimize This Away">
        <p>
          Some languages (Scheme, and Scala for direct self-tail-calls via <code>@tailrec</code>) perform
          tail-call optimization, reusing the current frame instead of pushing a new one. The JVM does{' '}
          <strong>not</strong> do this in general — <code>javac</code> compiles a tail-recursive-looking
          Java method to bytecode that still pushes a new frame per call, which is exactly why the
          measurement above overflows at a fixed depth instead of running forever. If a recursive Java
          solution needs to handle deep inputs, either convert it to an explicit loop or carry your own
          heap-allocated stack (an <code>ArrayDeque</code> works well) instead of the call stack.
        </p>
      </InfoBox>

      <h2>Amortized Complexity: Why <code>ArrayList.add()</code> Is O(1)</h2>

      <p>
        <code>ArrayList</code> is backed by a plain array. Most calls to <code>add()</code> just write into
        the next open slot — O(1). But when the backing array is full, <code>add()</code> has to allocate a
        larger array and copy every existing element into it — an O(n) operation. Calling something
        &quot;O(1)&quot; when it is occasionally O(n) sounds like a contradiction; <strong>amortized</strong>{' '}
        analysis is the resolution — it bounds the <em>average</em> cost per operation over a long sequence
        of operations, not the worst-case cost of any single one.
      </p>

      <p>
        Rather than trust the commonly repeated &quot;it doubles the array&quot; claim, this reads Java&apos;s
        actual growth factor directly off the live object, using reflection on <code>ArrayList</code>&apos;s
        private <code>elementData</code> field to catch the exact moment every resize happens:
      </p>

      <CodeBlock language="java" title="AmortizedArrayList.java — detecting real resizes via reflection">
{`Field dataField = ArrayList.class.getDeclaredField("elementData");
dataField.setAccessible(true);

int prevCapacity = ((Object[]) dataField.get(list)).length;
for (int i = 0; i < n; i++) {
    long start = System.nanoTime();
    list.add(i);
    durations[i] = System.nanoTime() - start;

    int newCapacity = ((Object[]) dataField.get(list)).length;
    if (newCapacity != prevCapacity) {
        // record index i, prevCapacity -> newCapacity as a real resize event
        prevCapacity = newCapacity;
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real console output — actual internal resize events">
{`resize # 1 at add-call index       0 : capacity      0 ->     10  (x0.000)
resize # 2 at add-call index      10 : capacity     10 ->     15  (x1.500)
resize # 3 at add-call index      15 : capacity     15 ->     22  (x1.467)
resize # 9 at add-call index     163 : capacity    163 ->    244  (x1.497)
resize #14 at add-call index   1,234 : capacity  1,234 ->  1,851  (x1.500)
resize #19 at add-call index   9,369 : capacity  9,369 -> 14,053  (x1.500)
resize #24 at add-call index  71,140 : capacity  71,140 -> 106,710  (x1.500)
resize #27 at add-call index 240,097 : capacity 240,097 -> 360,145  (x1.500)
Total resizes in 300,000 add() calls: 27`}
      </CodeBlock>

      <p>
        That settles a genuinely common interview-adjacent mix-up: Java&apos;s <code>ArrayList</code> does{' '}
        <strong>not</strong> double its capacity on resize. The real, measured, converging factor is{' '}
        <strong>1.5×</strong> (<code>newCapacity = oldCapacity + (oldCapacity &gt;&gt; 1)</code> in the JDK
        source — an old capacity of 244 became 366, not 488). Doubling (2×) is what other languages&apos;
        dynamic arrays use — C++&apos;s <code>std::vector</code> commonly doubles, and it is an extremely
        common assumption to carry over into Java without checking. Whether the factor is 1.5 or 2 does not
        change the O(1) amortized conclusion, but it changes the exact numbers, and stating it correctly is
        the difference between reciting a fact and having actually looked.
      </p>

      <CodeBlock language="text" title="Real console output — timing distribution across 300,000 add() calls">
{`Total time for 300,000 add() calls: 8.726 ms
Average (amortized) time per add(): 29.09 ns
Slowest single add() call: 1,642,625 ns, at index 160,065
Calls under 100 ns: 298,989 out of 300,000 (99.663%)`}
      </CodeBlock>

      <p>
        99.663% of calls finished in under 100 ns; the single slowest call — index 160,065, which lines up
        exactly with the resize from capacity 160,065 to 240,097 in the reflection log — took 1,642,625 ns,
        roughly <strong>56,000× slower</strong> than the typical call, because that one call had to copy
        160,065 references into a freshly allocated array. Despite that spike, the average over all 300,000
        calls is 29.09 ns — this is amortized O(1) directly measured, not asserted.
      </p>

      <p>
        The math behind why this generalizes: with a growth factor r &gt; 1, the total cost of every resize
        up through reaching size n is proportional to n + n/r + n/r² + &hellip; — a geometric series bounded
        above by n·r/(r&minus;1), which is O(n). Spread that O(n) total resize cost over the n{' '}
        <code>add()</code> calls that got you there, and each call&apos;s <em>share</em> of the resize cost
        is O(1), on top of the O(1) cost of the write itself. That is the whole proof: occasional expensive
        operations are fine, amortized-wise, as long as they get proportionally rarer fast enough that
        their total cost stays linear in the number of operations — exactly what a 1.5× (or 2×) growth
        factor guarantees and what a fixed +1-slot growth strategy would <em>not</em> guarantee (that would
        make every single <code>add()</code> an O(n) resize, and the true amortized cost would be O(n), not
        O(1)).
      </p>

      <h2>Complexity Classes at a Glance</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Working with&hellip;</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Safe complexity ceiling</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>n &le; ~20 (fixed config, small combinations)</td>
            <td style={{ padding: '0.75rem' }}>O(2ⁿ) is often fine</td>
            <td style={{ padding: '0.75rem' }}>2²⁰ ≈ 1,000,000 — still fast in absolute terms at this n</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>n up to ~10,000 (one request&apos;s working set)</td>
            <td style={{ padding: '0.75rem' }}>O(n²) is usually fine</td>
            <td style={{ padding: '0.75rem' }}>10,000² = 10⁸ ops — sub-second on modern hardware</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>n ~ 1,000,000 (in-memory dataset)</td>
            <td style={{ padding: '0.75rem' }}>Need O(n log n) or better</td>
            <td style={{ padding: '0.75rem' }}>1,000,000² = 10¹²; n log n ≈ 2×10⁷ — the gap is the whole story</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>n in the hundreds of millions+ (large-scale)</td>
            <td style={{ padding: '0.75rem' }}>Need O(n) or O(log n)</td>
            <td style={{ padding: '0.75rem' }}>Even O(n log n)&apos;s constant factor starts to matter at this scale</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>A long-running sequence of insertions (e.g. building a list)</td>
            <td style={{ padding: '0.75rem' }}>Judge by amortized cost, not any single call&apos;s worst case</td>
            <td style={{ padding: '0.75rem' }}>Occasional O(n) resizes are fine if they get rare fast enough — see <code>ArrayList</code> above</td>
          </tr>
        </tbody>
      </table>

      <p>
        The next lesson puts O(n log n) and O(n²) under the same kind of scrutiny — timing real sort
        implementations, including the exact input that makes Quicksort&apos;s worst case happen in
        practice, not just in theory.
      </p>

      <InteractiveChallenge
        question={"A function is described as \"O(n).\" Which statement is the most accurate interpretation?"}
        options={[
          "The function always performs exactly n operations, no more and no less",
          "The function's operation count grows linearly as n grows, though the exact count could be 0.5n, 3n + 20, or any other linear expression",
          "The function performs at most n² operations",
          "The function is faster than any O(log n) function for all n"
        ]}
        correctIndex={1}
        explanation={"Big-O describes the growth trend, not an exact operation count — that's the single most common misconception about the notation. O(n) means the operation count scales linearly as n grows; the constant multiplier and lower-order terms are deliberately dropped because they don't change the shape of the curve. (Option C is also technically true for many O(n) functions since n <= n^2, but it's a looser, less useful bound — not what 'O(n)' is asserting.)"}
      />

      <InteractiveChallenge
        question={"Naive recursive Fibonacci is commonly called \"O(2^n).\" This lesson measured its real call-count growth ratio at exactly 2.618 every 2 steps of n — not 4.0. What does that tell you?"}
        options={[
          "The O(2^n) claim is simply wrong and should never be used",
          "2.618 = phi^2, so the tight bound is actually Theta(phi^n) where phi ~ 1.618 (the golden ratio) — O(2^n) is still a technically true, but looser, upper bound",
          "The measurement was flawed because JIT warm-up wasn't long enough",
          "Fibonacci's complexity depends on the specific JVM being used"
        ]}
        correctIndex={1}
        explanation={"O(2^n) is a valid upper bound for naive Fibonacci (phi^n <= 2^n for all n, since phi ~ 1.618 < 2), but it isn't the tightest one. The measured ratio of 2.618 per 2 steps matches phi^2 precisely, meaning the true growth rate is Theta(phi^n). This is the same O-vs-Theta gap as linear search being 'technically O(n^2)' -- both true, neither the tightest available statement."}
      />
    </LessonLayout>
  );
}
