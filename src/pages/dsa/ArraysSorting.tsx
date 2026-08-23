import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import FlowChart from '../../components/FlowChart';

export default function ArraysSorting() {
  return (
    <LessonLayout
      title="Arrays & Sorting Algorithms"
      sectionId="dsa"
      lessonIndex={1}
      prev={{ path: '/dsa/complexity', label: 'Complexity Analysis: Big-O in Practice' }}
      next={{ path: '/dsa/linked-lists', label: 'Linked Lists' }}
    >
      <p>
        The previous lesson built the vocabulary — O, Ω, Θ, amortized cost, the difference between an
        operation count and a stopwatch reading. This one spends that vocabulary on the algorithms that
        show up constantly in both interviews and production code: the three sorts everyone can half-recite
        (Bubble, Merge, Quicksort), what Java&apos;s own <code>Arrays.sort()</code> actually runs under the
        hood, and the two correctness properties of binary search that are easy to get wrong even after
        you&apos;ve implemented it a dozen times. As with the last lesson, claims that can be checked were
        checked — against real, compiled Java on the installed JDK (<code>26.0.1</code>), or against the
        actual JDK source (not a summary of it, the literal <code>@implNote</code> text) where the fastest
        path to certainty was reading the source instead of re-deriving it empirically.
      </p>

      <h2>The Picture First: What an Array Actually Is</h2>

      <p>
        Strip away the syntax and an array is just a row of fixed-size slots sitting next to each other in
        memory, each one numbered starting at 0. That numbering is <em>why</em> <code>arr[2]</code> is O(1)
        &mdash; the computer does not search for slot 2, it computes an address directly (start address + 2
        &times; slot size) and jumps straight there:
      </p>

      <CodeBlock language="text" title="An array is contiguous, numbered slots -- nothing more">
{`index:    0     1     2     3
        +-----+-----+-----+-----+
value:  |  5  |  2  |  8  |  1  |
        +-----+-----+-----+-----+

arr[2] reads slot 2 directly: "start address + 2 slots" -> one jump, no searching -> O(1)`}
      </CodeBlock>

      <p>
        Insertion is where that flat, convenient picture stops being free. There is no gap between slots to
        squeeze a new value into &mdash; inserting at the <strong>front</strong> means every existing
        element has to physically move one slot to the right first, just to open up index 0:
      </p>

      <CodeBlock language="text" title="Inserting 9 at the front: everyone else has to shift right first">
{`BEFORE -- 4 elements, want to insert 9 at index 0:

index:    0     1     2     3
        +-----+-----+-----+-----+
value:  |  5  |  2  |  8  |  1  |
        +-----+-----+-----+-----+

STEP 1 -- shift every element one slot right to open up index 0
          (idx 3 -> 4, idx 2 -> 3, idx 1 -> 2, idx 0 -> 1)
          4 elements already in the array = 4 moves, before the new value is even written

STEP 2 -- write 9 into the now-empty index 0:

index:    0     1     2     3     4
        +-----+-----+-----+-----+-----+
value:  |  9  |  5  |  2  |  8  |  1  |
        +-----+-----+-----+-----+-----+

n elements already in the array -> up to n moves for ONE front insert -> O(n), every time.`}
      </CodeBlock>

      <p>
        That shift is not a sloppy implementation detail that a smarter array could avoid &mdash; it is
        forced by what &quot;contiguous, numbered slots&quot; means. A meaningful chunk of the sorting
        algorithms below spend their effort managing exactly this cost.
      </p>

      <p>
        &quot;Sorting&quot; itself just means rearranging those same slots so the values read out in order:
      </p>

      <FlowChart
        title="What sorting means, before any specific algorithm"
        chart={"graph LR\n  A[Unsorted: 5, 2, 8, 1] -->|sort| B[Sorted: 1, 2, 5, 8]\n  style A fill:#3b1a1a\n  style B fill:#1a3329"}
      />

      <p>
        Every algorithm below &mdash; Bubble, Merge, Quicksort &mdash; is a different strategy for getting
        from the left box to the right one, and they differ enormously in <em>how much work</em> that
        rearranging costs as the array grows, which is exactly what the complexity table below measures.
      </p>

      <h2>Bubble, Merge, and Quicksort: The Complexity Cheat Sheet</h2>

      <p>
        These three are the canonical teaching sorts, and interview panels expect you to know all six cells
        of this table cold, plus the <em>reason</em> behind each one — reciting &quot;Quicksort is O(n log
        n)&quot; without knowing when that stops being true is a common tell.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Algorithm</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Best</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Average</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Worst</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Space</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Stable?</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Bubble sort</td>
            <td style={{ padding: '0.75rem' }}>O(n)</td>
            <td style={{ padding: '0.75rem' }}>O(n&sup2;)</td>
            <td style={{ padding: '0.75rem' }}>O(n&sup2;)</td>
            <td style={{ padding: '0.75rem' }}>O(1)</td>
            <td style={{ padding: '0.75rem' }}>Yes</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Merge sort</td>
            <td style={{ padding: '0.75rem' }}>O(n log n)</td>
            <td style={{ padding: '0.75rem' }}>O(n log n)</td>
            <td style={{ padding: '0.75rem' }}>O(n log n)</td>
            <td style={{ padding: '0.75rem' }}>O(n)</td>
            <td style={{ padding: '0.75rem' }}>Yes</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Quicksort (naive, single pivot)</td>
            <td style={{ padding: '0.75rem' }}>O(n log n)</td>
            <td style={{ padding: '0.75rem' }}>O(n log n)</td>
            <td style={{ padding: '0.75rem' }}>O(n&sup2;)</td>
            <td style={{ padding: '0.75rem' }}>O(log n) avg / O(n) worst</td>
            <td style={{ padding: '0.75rem' }}>No</td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>Bubble sort</strong> repeatedly walks the array swapping adjacent out-of-order pairs. The
        best case, O(n), is not a rounding error — with the standard &quot;did we swap anything this
        pass?&quot; flag, a single O(n) pass over an already-sorted array does zero swaps and exits
        immediately. Drop that flag and the best case silently becomes O(n&sup2;) again, because the loop
        keeps making passes it no longer needs. It never swaps two elements that compare equal, so it is
        stable by construction, and it sorts in place: O(1) extra space.
      </p>

      <CodeBlock language="java" title="Bubble sort — the early-exit flag is what makes the best case real">
{`static void bubbleSort(int[] a) {
    int n = a.length;
    for (int pass = 0; pass < n - 1; pass++) {
        boolean swapped = false;
        for (int i = 0; i < n - 1 - pass; i++) {
            if (a[i] > a[i + 1]) {
                int tmp = a[i]; a[i] = a[i + 1]; a[i + 1] = tmp;
                swapped = true;
            }
        }
        if (!swapped) break; // already sorted -> stop early, this is the O(n) best case
    }
}`}
      </CodeBlock>

      <p>
        <strong>Merge sort</strong> splits the array in half recursively, sorts each half, and merges the
        two sorted halves back together. Its defining property is that <strong>every</strong> case —
        best, average, worst — is O(n log n); there is no adversarial input that degrades it, because the
        split is always exactly in half regardless of the data&apos;s order. That guarantee costs memory:
        the merge step needs an auxiliary array to write the merged result into before copying it back, so
        merge sort is O(n) space, not in-place. It is stable as long as the merge step breaks ties by
        preferring the left half&apos;s element when the two compare equal.
      </p>

      <CodeBlock language="java" title="Merge sort — O(n log n) guaranteed, O(n) auxiliary space">
{`static void mergeSort(int[] a, int lo, int hi) {
    if (hi - lo <= 1) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, lo, mid);
    mergeSort(a, mid, hi);
    merge(a, lo, mid, hi);
}

static void merge(int[] a, int lo, int mid, int hi) {
    int[] tmp = new int[hi - lo]; // <- the O(n) auxiliary space
    int i = lo, j = mid, k = 0;
    while (i < mid && j < hi) tmp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++]; // '<=' -> stable
    while (i < mid) tmp[k++] = a[i++];
    while (j < hi) tmp[k++] = a[j++];
    System.arraycopy(tmp, 0, a, lo, tmp.length);
}`}
      </CodeBlock>

      <p>
        <strong>Quicksort</strong> picks a pivot, partitions the array into &quot;less than pivot&quot; and
        &quot;greater than pivot&quot;, and recurses on each side. When the pivot lands near the median,
        each recursive call handles roughly half the data, giving the same O(n log n) shape as merge sort —
        without needing a second array, since partitioning happens in place. That in-place partitioning is
        also exactly why naive Quicksort is <strong>not stable</strong>: partitioning swaps elements across
        the array based on comparisons to the pivot, and there is nothing in that process that protects the
        relative order of two elements that compare equal. The next section is the case that actually
        matters in practice: what happens when the pivot does <em>not</em> land near the median.
      </p>

      <h2>Quicksort&apos;s Worst Case, Proven Not Asserted</h2>

      <p>
        &quot;Quicksort degrades to O(n&sup2;) on sorted input&quot; is one of the most repeated facts in
        DSA prep, and also one of the least often actually watched happening. Here is a textbook Lomuto-
        partition Quicksort — pivot is always the last element of the range, which is the single most
        common &quot;naive&quot; choice — run on two 10,000-element inputs: one random, one already sorted
        ascending.
      </p>

      <CodeBlock language="java" title="QuicksortDemo.java — naive Quicksort, pivot = last element">
{`static long comparisons;

static void quicksort(int[] a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partition(a, lo, hi);
    quicksort(a, lo, p - 1);
    quicksort(a, p + 1, hi);
}

static int partition(int[] a, int lo, int hi) {
    int pivot = a[hi];       // naive: always the last element of the range
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        comparisons++;
        if (a[j] < pivot) {
            i++;
            int tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
    }
    int tmp = a[i + 1]; a[i + 1] = a[hi]; a[hi] = tmp;
    return i + 1;
}`}
      </CodeBlock>

      <p>
        Comparisons are counted directly (deterministic, immune to JIT/timer noise) alongside best-of-7
        wall-clock timing after a JIT warm-up pass on disposable data — the same methodology the previous
        lesson used, for the same reason. Real output, JDK 26.0.1, this machine:
      </p>

      <CodeBlock language="text" title="Real console output — random input vs. already-sorted input, n=10,000">
{`n = 10,000
Random input:         best-of-7 comparisons=152,579  time=0.236 ms
Already-sorted input:  best-of-7 comparisons=49,995,000  time=20.563 ms
Ratio: 327.7x more comparisons, 87.1x slower wall-clock
Reference: n*log2(n) = 132,877    n*(n-1)/2 = 49,995,000`}
      </CodeBlock>

      <p>
        The already-sorted run did <strong>exactly</strong> 49,995,000 comparisons — which is exactly n(n
        &minus;1)/2 for n=10,000, the closed form for &quot;every element compared against every other
        element,&quot; i.e. the textbook O(n&sup2;) worst case, hit precisely, not approximately. The
        mechanism is visible in the partition code above: on ascending input, <code>a[hi]</code> is always
        the <em>largest</em> remaining element, so every partition splits the range into &quot;everything
        (size n&minus;1)&quot; and &quot;nothing (size 0).&quot; Instead of the depth halving each level
        (log n levels), it shrinks by exactly one element each level (n levels) — that single change in
        partition balance is the entire gap between O(n log n) and O(n&sup2;). The random-input run&apos;s
        152,579 comparisons land in the same order of magnitude as n log&#8322;n = 132,877 (real Quicksort
        does roughly 1.39&times;n&thinsp;log&#8322;n comparisons on average, not exactly n&thinsp;log&#8322;n
        — the constant factor is not 1, only the growth shape matches), while the sorted-input run is over
        <strong> 300&times;</strong> that count on identically-sized input. Same algorithm, same n,
        two-orders-of-magnitude different cost — driven entirely by which n values happened to already be in
        order.
      </p>

      <InfoBox variant="warning" title="The Second Cost: Recursion Depth">
        <p>
          A balanced partition recurses to depth O(log n). The degenerate (n&minus;1, 0) split above
          recurses to depth O(n) instead — for n=10,000 that is up to ~9,999 nested <code>quicksort</code>{' '}
          calls sitting on the stack simultaneously, not the ~14 a balanced split would need. The previous
          lesson measured this JVM&apos;s default stack overflowing at 32,775 nested frames for a specific
          method (<code>recursiveSum</code>); that exact number does not transfer to <code>quicksort</code>{' '}
          — different methods have different frame sizes, so the actual ceiling here differs — but the
          mechanism is identical: a naive last-element-pivot Quicksort run on a large enough already-sorted
          array recurses deeply enough to risk a real <code>StackOverflowError</code>, on top of the
          O(n&sup2;) time cost. A balanced-recursion sort never approaches that risk at any n a real program
          would hit.
        </p>
      </InfoBox>

      <h2>What <code>Arrays.sort()</code> Actually Does</h2>

      <p>
        The naive implementation above is what you write on a whiteboard. It is <strong>not</strong> what
        <code>java.util.Arrays.sort()</code> runs — Java ships two genuinely different algorithms behind
        the same method name, chosen by overload, and the split is precise enough to be worth reading
        straight from the JDK 26 source rather than trusting a half-remembered summary.
      </p>

      <CodeBlock language="text" title="JDK 26 source — java.util.Arrays.sort(int[]), @implNote">
{`@implNote The sorting algorithm is a Dual-Pivot Quicksort
by Vladimir Yaroslavskiy, Jon Bentley, and Joshua Bloch. This algorithm
offers O(n log(n)) performance on all data sets, and is typically
faster than traditional (one-pivot) Quicksort implementations.

-- java.util.Arrays.sort(int[] a), line 99: DualPivotQuicksort.sort(a, 0, 0, a.length);`}
      </CodeBlock>

      <CodeBlock language="text" title="JDK 26 source — java.util.Arrays.sort(Object[]), @implNote">
{`This sort is guaranteed to be *stable*: equal elements will
not be reordered as a result of the sort.

Implementation note: This implementation is a stable, adaptive,
iterative mergesort that requires far fewer than n lg(n) comparisons
when the input array is partially sorted [...]

-- java.util.Arrays.sort(Object[] a), line 1038: ComparableTimSort.sort(a, 0, a.length, null, 0, 0);
-- The implementation was adapted from Tim Peters's list sort for Python (TimSort).`}
      </CodeBlock>

      <p>
        So: <strong>primitive arrays</strong> (<code>int[]</code>, <code>long[]</code>,{' '}
        <code>double[]</code>, etc.) sort with a <strong>dual-pivot Quicksort</strong>; <strong>object
        arrays</strong> (anything implementing <code>Comparable</code>, or sorted with a{' '}
        <code>Comparator</code>) sort with <strong>TimSort</strong>, adapted from Python&apos;s list sort.
        The reason for the split is not arbitrary — it tracks exactly the property that matters for each
        case. Primitives have no identity beyond their value: two <code>int</code>s that both equal 5 are
        completely indistinguishable, so &quot;did the sort preserve their relative order&quot; is not a
        meaningful question, and Quicksort&apos;s in-place, no-extra-array partitioning is free to be the
        priority. Objects that compare equal under a <code>Comparator</code> can still carry different
        data — two <code>Player</code> records with the same score are not interchangeable — so preserving
        their original relative order is an actual, user-visible correctness property, and the JDK
        documents the object overload as <strong>&quot;guaranteed to be stable&quot;</strong> for exactly
        that reason. (A deprecated <code>java.util.Arrays.useLegacyMergeSort</code> system property can
        force the old, non-adaptive mergesort path instead — not something to reach for, but worth knowing
        it exists if you ever see it in a stack trace or a very old codebase.)
      </p>

      <InfoBox variant="info" title="Dual-Pivot Quicksort Is Not the Naive Version Above">
        <p>
          The JDK 26 source&apos;s <code>DualPivotQuicksort.java</code> class comment states outright that
          the algorithm also invokes <strong>mixed insertion sort</strong> for small partitions, and{' '}
          <strong>merging of runs</strong> — detecting already-sorted or already-descending stretches of
          the input and taking advantage of them — plus a heap-sort fallback for pathological cases. That
          is precisely the hybrid machinery the toy implementation earlier in this lesson does not have,
          and precisely why &quot;sorted input causes O(n&sup2;)&quot; is a real risk for a hand-rolled
          single-pivot Quicksort but not the specific failure mode you should expect from calling{' '}
          <code>Arrays.sort()</code> on a real JDK. The two are the same <em>family</em> of algorithm, not
          the same implementation.
        </p>
      </InfoBox>

      <p>
        The stability difference is checkable directly: sort an array of records that share a sort key and
        confirm the original relative order survives.
      </p>

      <CodeBlock language="java" title="StabilityDemo.java — TimSort via Arrays.sort(Object[])">
{`record Player(String name, int score, int originalIndex) {}

Player[] players = {
    new Player("Alice", 50, 0), new Player("Bob",   90, 1),
    new Player("Carol", 50, 2), new Player("Dave",  90, 3),
    new Player("Eve",   50, 4),
};

Arrays.sort(players, Comparator.comparingInt(Player::score)); // Object[] overload -> TimSort`}
      </CodeBlock>

      <CodeBlock language="text" title="Real console output">
{`Sorted by score (TimSort, Object[] overload):
  Alice score=50 originalIndex=0
  Carol score=50 originalIndex=2
  Eve score=50 originalIndex=4
  Bob score=90 originalIndex=1
  Dave score=90 originalIndex=3
Relative order preserved within equal-score groups: true`}
      </CodeBlock>

      <p>
        Within the score=50 group, Alice/Carol/Eve come out in exactly their original index order
        (0, 2, 4); within score=90, Bob/Dave stay in original order (1, 3). Nothing enforces that in the
        code above except the algorithm&apos;s own stability guarantee — the <code>Comparator</code> only
        knows about <code>score</code>, it never even looks at <code>originalIndex</code>.
      </p>

      <h2>Binary Search: Two Correctness Traps</h2>

      <p>
        The previous lesson used binary search as its O(log n) example and measured its step-count growth;
        this lesson is not re-deriving that — the two things worth adding here are both about{' '}
        <strong>correctness</strong>, not growth rate.
      </p>

      <p>
        <strong>1. The midpoint formula.</strong> The naive midpoint calculation, <code>mid = (low +
        high) / 2</code>, has a real, historically-documented bug: if <code>low + high</code> exceeds{' '}
        <code>Integer.MAX_VALUE</code>, it silently overflows into a negative number before the division
        ever runs, corrupting <code>mid</code>. This is not a hypothetical — Joshua Bloch (co-author of
        the dual-pivot Quicksort cited above) wrote a well-known 2006 Google Research blog post,{' '}
        <em>&quot;Nearly All Binary Searches and Mergesorts are Broken,&quot;</em> documenting that this
        exact bug had been sitting unnoticed in the JDK&apos;s own <code>Arrays.binarySearch</code> and{' '}
        <code>Collections.binarySearch</code> for years, triggerable on arrays large enough to push{' '}
        <code>low + high</code> past 2&sup3;&sup9;&thinsp;&minus;&thinsp;1. The fix, used throughout both
        this lesson and the previous one, avoids the addition entirely:
      </p>

      <CodeBlock language="java" title="Overflow-safe midpoint">
{`int mid = low + (high - low) / 2; // (high - low) can't overflow if low <= high; neither can adding it to low`}
      </CodeBlock>

      <p>
        <code>high - low</code> is bounded by the array length, so it can never itself overflow, and adding
        it to <code>low</code> can never exceed <code>high</code> — the result stays safely inside a valid
        index range regardless of how large <code>low</code> and <code>high</code> individually are.
      </p>

      <p>
        <strong>2. Binary search assumes sorted input — and does not check.</strong> The algorithm&apos;s
        correctness proof depends entirely on the invariant that discarding one half of the range can never
        discard the target, and that invariant only holds if the array is actually sorted. On unsorted
        input, the loop still runs, still terminates, and still returns <em>something</em> — it just is not
        guaranteed to be correct, and it fails silently rather than throwing. Concretely, with{' '}
        <code>a = [5, 1, 4, 2, 8]</code> and <code>target = 2</code>:
      </p>

      <CodeBlock language="text" title="Real console output — binary search on unsorted input">
{`array=[5, 1, 4, 2, 8] target=2 binarySearch result=-1 (actual index of 2 is 3)`}
      </CodeBlock>

      <p>
        2 is in the array, at index 3 — and the search reports it missing. The trace shows why: at{' '}
        <code>mid=2</code>, <code>a[2]=4</code>, and since 4 &gt; 2 the algorithm discards the{' '}
        <em>right</em> half (indices 3&ndash;4) — exactly where 2 was sitting — because it trusts that
        everything right of a larger element must be larger still. On sorted input that trust is valid; on
        this input it is not, and there is no check in the algorithm that would ever catch the difference.
        This is precisely why &quot;is this array sorted?&quot; is a legitimate, non-pedantic first question
        to ask before reaching for binary search over a linear scan.
      </p>

      <h2>Decision Table</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Scenario</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Reach for</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Small n (roughly &lt;50) or already nearly sorted</td>
            <td style={{ padding: '0.75rem' }}><strong>Insertion sort</strong></td>
            <td style={{ padding: '0.75rem' }}>Close to its O(n) best case; recursion/partition overhead of Quicksort/merge sort isn&apos;t worth paying — this is exactly why DualPivotQuicksort itself falls back to it for small partitions</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Sorting primitives (<code>int[]</code>, <code>double[]</code>, &hellip;), stability is meaningless</td>
            <td style={{ padding: '0.75rem' }}><strong><code>Arrays.sort(int[])</code></strong> (dual-pivot Quicksort)</td>
            <td style={{ padding: '0.75rem' }}>In-place, cache-friendly, hybrid heuristics guard against the classic pathological inputs</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Sorting objects, or original relative order among equal keys must survive (e.g. sort by name, then stably re-sort by score)</td>
            <td style={{ padding: '0.75rem' }}><strong><code>Arrays.sort(Object[])</code> / <code>List.sort()</code></strong> (TimSort)</td>
            <td style={{ padding: '0.75rem' }}>Documented, guaranteed stable — equal elements never get reordered</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Worst-case time matters more than average time (real-time constraints, adversarial input possible)</td>
            <td style={{ padding: '0.75rem' }}><strong>Merge sort</strong></td>
            <td style={{ padding: '0.75rem' }}>O(n log n) in <em>every</em> case, no input can degrade it &mdash; the cost is O(n) auxiliary memory, not time</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Memory-constrained, average-case time is acceptable</td>
            <td style={{ padding: '0.75rem' }}><strong>Quicksort (in-place)</strong></td>
            <td style={{ padding: '0.75rem' }}>O(log n) average auxiliary space (recursion stack only) vs. merge sort&apos;s O(n)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Many repeated lookups against a static dataset</td>
            <td style={{ padding: '0.75rem' }}><strong>Sort once, then binary search</strong></td>
            <td style={{ padding: '0.75rem' }}>Pay O(n log n) a single time; every lookup after that is O(log n) instead of O(n) &mdash; but only if the data is genuinely sorted first</td>
          </tr>
        </tbody>
      </table>

      <p>
        The next lesson moves from arrays to structures built out of individually-allocated nodes — linked
        lists — where several of the trade-offs above flip: no more contiguous-memory cache advantage, but
        O(1) insertion/removal at a known position, which no array-based structure can offer without an
        O(n) shift.
      </p>

      <InteractiveChallenge
        question={"A naive single-pivot Quicksort (pivot = last element) is run on an array that is already sorted in ascending order. What actually happens, and why?"}
        options={[
          "It runs faster than on random input, since the array is already in the correct order",
          "It degrades to O(n^2): the pivot (always the largest remaining element) puts every element on one side of the partition, so the recursion depth becomes O(n) instead of O(log n) and total comparisons approach n(n-1)/2",
          "It throws an exception, since Quicksort requires unsorted input to function",
          "It still runs in O(n log n) because Quicksort's average case dominates regardless of input order"
        ]}
        correctIndex={1}
        explanation={"With pivot = last element on ascending input, the pivot is always the largest value remaining in the range, so partition() puts everything else on the 'less than' side and nothing on the 'greater than' side -- an (n-1, 0) split every single level instead of a balanced (n/2, n/2) split. That turns log n recursion levels into n recursion levels, and the measured comparison count for n=10,000 landed at exactly 49,995,000 -- precisely n(n-1)/2, the closed form for the O(n^2) worst case. Java's actual Arrays.sort(int[]) avoids this specific trigger via run-detection and other heuristics that this naive textbook implementation doesn't have."}
      />
    </LessonLayout>
  );
}
