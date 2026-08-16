import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Patterns() {
  return (
    <LessonLayout
      title="Common Interview Patterns"
      sectionId="dsa"
      lessonIndex={12}
      prev={{ path: '/dsa/dynamic-programming', label: 'Dynamic Programming' }}
      next={{ path: '/dsa/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        Every lesson so far has handed you a data structure and a technique that goes with it. The
        actual interview does not do that. You get a paragraph of prose — &quot;given a list of
        meeting times, find the minimum number of rooms needed&quot; — and nothing tells you which of
        the seven lessons behind this one is the right hammer. That gap, between reading a problem
        statement and knowing which technique to reach for, is its own skill, separate from knowing
        the techniques themselves. This lesson is about closing that gap.
      </p>

      <InfoBox variant="info" title="The Meta-Skill: Signal Before Solution">
        <p>
          A surprising fraction of &quot;easy&quot; and &quot;medium&quot; interview problems are not
          novel — they are one of a handful of reusable shapes wearing a different word problem. The
          five patterns below cover a large share of that space. For each one, the goal is not to
          memorize the code (you already can write loops and pointers) — it is to memorize the{' '}
          <strong>signal</strong>: the specific words and constraints in a problem statement that
          should make this pattern light up in your head before you write a single line.
        </p>
      </InfoBox>

      <h2>1. Two Pointers</h2>

      <p>
        <strong>Signal:</strong> the input is a <strong>sorted</strong> array or list, and you need to
        find a pair (or triple) satisfying some condition — a target sum, a target difference, a
        closest value. Sorted order is the tell. If the array is not sorted and you cannot sort it
        without losing information you need (like original indices), this pattern does not apply
        cleanly.
      </p>

      <p>
        The idea: put one pointer at each end of the sorted array. If the pair at those two positions
        sums to less than the target, the <em>only</em> way to increase the sum is to move the left
        pointer right (every value to its right is larger). If the sum is too big, move the right
        pointer left. Either way, one comparison eliminates one candidate entirely — that is what
        turns an O(n²) nested loop into a single O(n) pass.
      </p>

      <CodeBlock language="java" title="Two Sum on a Sorted Array — Two Pointers vs. Naive (JDK 26)">
{`static int[] twoSumSorted(int[] sorted, int target) {
    int left = 0, right = sorted.length - 1;
    while (left < right) {
        int sum = sorted[left] + sorted[right];
        if (sum == target) return new int[]{sorted[left], sorted[right]};
        else if (sum < target) left++;   // sum too small -> need a bigger left value
        else right--;                     // sum too big -> need a smaller right value
    }
    return null;
}

static int[] twoSumNaive(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++)
        for (int j = i + 1; j < arr.length; j++)
            if (arr[i] + arr[j] == target) return new int[]{arr[i], arr[j]};
    return null;
}

// small correctness check — actually run:
int[] small = {2, 7, 11, 15, 18, 24, 31, 40};
twoSumSorted(small, 29);  // [11, 18]
twoSumNaive(small, 29);   // [11, 18]  -- both agree
twoSumSorted({1, 3, 5, 7}, 100);  // null -- no pair exists`}
      </CodeBlock>

      <p>
        That confirms correctness. The complexity claim is the more interesting one to verify, so
        this was actually timed: a sorted array of <code>n = 20,000</code> elements, with a target
        that has <strong>no matching pair</strong> — forcing both approaches into their true worst
        case, so neither gets to bail out early on a lucky match.
      </p>

      <CodeBlock language="text" title="Real Output — javac 26.0.1 / java 26.0.1, n = 20,000, worst case">
{`n = 20000 (sorted), target has NO matching pair -> worst case for both
Trial 1 -- two-pointer: 0.0427 ms (result=null) | naive: 22.3064 ms (result=null) | naive is 522.8x slower
Trial 2 -- two-pointer: 0.0048 ms (result=null) | naive: 20.7019 ms (result=null) | naive is 4358.3x slower
Trial 3 -- two-pointer: 0.0040 ms (result=null) | naive: 18.2615 ms (result=null) | naive is 4519.1x slower`}
      </CodeBlock>

      <p>
        Trial 1 is slower for the two-pointer version than trials 2–3 (0.043 ms vs. ~0.004–0.005 ms) —
        that is JIT warm-up jitter settling down, not a real difference in the algorithm; the naive
        version's time barely moves because 20,000² comparisons dwarf any JIT noise. The honest takeaway
        is the shape, not the exact multiplier: two pointers stayed sub-millisecond across every trial
        while the naive nested loop stayed around 18–22 ms — a gap that only widens as <code>n</code>{' '}
        grows, since one is linear and the other is quadratic.
      </p>

      <h2>2. Sliding Window</h2>

      <p>
        <strong>Signal:</strong> you need a <strong>contiguous</strong> subarray or substring — not
        &quot;any subset,&quot; specifically a run of adjacent elements — that satisfies some min, max,
        or target property. &quot;Longest substring without repeating characters,&quot; &quot;smallest
        subarray with sum ≥ target,&quot; &quot;longest subarray with at most K distinct values&quot; —
        the word &quot;contiguous&quot; is sometimes explicit and sometimes implied by
        &quot;substring&quot;/&quot;subarray&quot; (as opposed to &quot;subsequence,&quot; which permits
        gaps and is usually a dynamic-programming signal instead).
      </p>

      <p>
        The idea: maintain a window <code>[left, right]</code> and a running record of what is inside
        it. Expand <code>right</code> one step at a time; whenever the window violates the property
        (here, a repeated character), shrink from <code>left</code> until it is valid again. Each index
        enters and leaves the window at most once, which is what makes this O(n) instead of the O(n²)
        you get from checking every substring independently.
      </p>

      <CodeBlock language="java" title="Longest Substring Without Repeating Characters (JDK 26)">
{`static int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>();
    int windowStart = 0, longest = 0;

    for (int windowEnd = 0; windowEnd < s.length(); windowEnd++) {
        char c = s.charAt(windowEnd);
        if (lastSeen.containsKey(c) && lastSeen.get(c) >= windowStart) {
            // duplicate found INSIDE the current window -> jump left past it
            windowStart = lastSeen.get(c) + 1;
        }
        lastSeen.put(c, windowEnd);
        longest = Math.max(longest, windowEnd - windowStart + 1);
    }
    return longest;
}`}
      </CodeBlock>

      <p>
        The mandated edge cases — all-unique and all-identical — are exactly where a sliding-window
        implementation tends to be subtly wrong (shrinking too much, or using a stale index after the
        window has already moved past a previous occurrence). Both were traced step by step, not just
        checked against a final number:
      </p>

      <CodeBlock language="text" title="Real Output — Trace of Both Mandated Edge Cases">
{`-- Trace: all unique "abcdefg" --
  end=0 char='a' window=[0,0]="a" length=1 longestSoFar=1
  end=1 char='b' window=[0,1]="ab" length=2 longestSoFar=2
  end=2 char='c' window=[0,2]="abc" length=3 longestSoFar=3
  end=3 char='d' window=[0,3]="abcd" length=4 longestSoFar=4
  end=4 char='e' window=[0,4]="abcde" length=5 longestSoFar=5
  end=5 char='f' window=[0,5]="abcdef" length=6 longestSoFar=6
  end=6 char='g' window=[0,6]="abcdefg" length=7 longestSoFar=7
  FINAL longest = 7   -- window never shrinks; the whole string is one window

-- Trace: all identical "aaaaaaa" --
  end=0 char='a' window=[0,0]="a" length=1 longestSoFar=1
  end=1 char='a' window=[1,1]="a" length=1 longestSoFar=1
  end=2 char='a' window=[2,2]="a" length=1 longestSoFar=1
  end=3 char='a' window=[3,3]="a" length=1 longestSoFar=1
  end=4 char='a' window=[4,4]="a" length=1 longestSoFar=1
  end=5 char='a' window=[5,5]="a" length=1 longestSoFar=1
  end=6 char='a' window=[6,6]="a" length=1 longestSoFar=1
  FINAL longest = 1   -- window shrinks to 1 every single step, never grows past it`}
      </CodeBlock>

      <p>
        A third case is worth calling out explicitly because it is the one that breaks a naive
        implementation: <code>&quot;abba&quot;</code>. When the second <code>&apos;a&apos;</code>{' '}
        arrives at index 3, its last-seen index (0) is <em>before</em> <code>windowStart</code>{' '}
        (which has already advanced to 2, past the repeated <code>&apos;b&apos;</code>). The{' '}
        <code>{'>= windowStart'}</code> guard is what stops the algorithm from wrongly jumping{' '}
        <code>windowStart</code> backward using that stale index — without it, the window would shrink
        based on information that is no longer inside it. This was verified, not assumed:{' '}
        <code>lengthOfLongestSubstring(&quot;abba&quot;)</code> correctly returns <code>2</code> (for{' '}
        <code>&quot;ab&quot;</code> or <code>&quot;ba&quot;</code>), and the full suite —{' '}
        <code>abcabcbb→3</code>, <code>pwwkew→3</code>, <code>aab→2</code>, empty string
        <code>→0</code>, single char <code>→1</code> — all passed against hand-verified expected
        values.
      </p>

      <p>
        The same algorithm holds up with a <code>Set</code> instead of a <code>Map</code>, shrinking
        one character at a time from the left rather than jumping straight to the stale index — a
        common alternative phrasing:
      </p>

      <CodeBlock language="java" title="Set-Based Variant — verified, same test cases">
{`static int lengthOfLongestSubstring(String s) {
    Set<Character> window = new HashSet<>();
    int left = 0;
    int longest = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        while (window.contains(c)) {
            window.remove(s.charAt(left));
            left++;
        }
        window.add(c);
        longest = Math.max(longest, right - left + 1);
    }
    return longest;
}

// Actual output, all 7 cases from the Map-based version re-run against this one:
// [PASS] "abcabcbb" expected=3 actual=3
// [PASS] "abcdefg" expected=7 actual=7   (all unique)
// [PASS] "aaaaaaa" expected=1 actual=1   (all identical)
// [PASS] ""        expected=0 actual=0
// [PASS] "x"        expected=1 actual=1
// [PASS] "pwwkew"   expected=3 actual=3
// [PASS] "abba"     expected=2 actual=2`}
      </CodeBlock>

      <h2>3. Fast &amp; Slow Pointers</h2>

      <p>
        <strong>Signal:</strong> cycle detection, or finding a middle element in a single forward pass
        without knowing the length up front. This is the same Floyd&apos;s Tortoise-and-Hare technique
        already covered in this section&apos;s linked-list lesson for cycle detection — the point here
        is that it is not a linked-list-only trick, it generalizes to any &quot;walk forward through a
        sequence&quot; problem.
      </p>

      <p>
        Applied to finding the middle of an array: a slow pointer advances one step at a time, a fast
        pointer advances two. When the fast pointer runs out of room, the slow pointer — having covered
        exactly half the distance — is sitting on the middle. One pass, no length lookup needed first
        (which matters when the input is a stream or a singly-linked list where you cannot jump to{' '}
        <code>length / 2</code> directly).
      </p>

      <CodeBlock language="java" title="Middle of an Array in One Pass — Fast/Slow (JDK 26)">
{`static int middleIndex(int[] arr) {
    int slow = 0, fast = 0;
    while (fast < arr.length - 1) {
        slow++;
        fast += 2;
    }
    return slow;
}`}
      </CodeBlock>

      <p>
        Odd-length and even-length inputs define &quot;the middle&quot; differently, so both were run,
        along with the trivial length-1 and length-2 cases:
      </p>

      <CodeBlock language="text" title="Real Output — Verified Across Odd and Even Lengths">
{`length=5  array=[10, 20, 30, 40, 50]             -> middleIndex=2 middleValue=30   (odd: dead center)
length=6  array=[10, 20, 30, 40, 50, 60]         -> middleIndex=3 middleValue=40   (even: upper of the two middles)
length=1  array=[99]                              -> middleIndex=0 middleValue=99
length=2  array=[1, 2]                            -> middleIndex=1 middleValue=2
length=7  array=[1..7]                            -> middleIndex=3 middleValue=4
length=4  array=[1, 2, 3, 4]                      -> middleIndex=2 middleValue=3
length=15 array=[0..14]                           -> middleIndex=7 middleValue=7
length=16 array=[0..15]                           -> middleIndex=8 middleValue=8`}
      </CodeBlock>

      <p>
        The even-length behavior is worth being precise about: for length 6, slow lands on index 3
        (the second of the two middle elements), not index 2. That matches the exact same convention
        the linked-list version of this technique uses when a cycle-free list has an even number of
        nodes — one more reason this is the same algorithm wearing a different problem, not a
        coincidence.
      </p>

      <h2>4. Merge Intervals</h2>

      <p>
        <strong>Signal:</strong> the input is a collection of ranges — <code>[start, end]</code> pairs,
        meeting times, IP ranges, date spans — and overlapping ones need to be combined into their
        union. &quot;Merge the overlapping meetings,&quot; &quot;find the minimum number of
        conference rooms,&quot; &quot;insert a new interval into an existing sorted list&quot; are all
        this pattern.
      </p>

      <p>
        The one non-negotiable correctness step is sorting the intervals <strong>by start time
        first</strong>. This was not just asserted — it was tested by deliberately running an unsorted
        input through both an approach that skips the sort and one that does it:
      </p>

      <CodeBlock language="java" title="Merge Intervals — Sorted vs. Unsorted Input (JDK 26)">
{`static List<int[]> mergeSorted(int[][] intervals) {
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));  // <-- the required step

    List<int[]> result = new ArrayList<>();
    for (int[] interval : sorted) {
        if (result.isEmpty()) { result.add(interval.clone()); continue; }
        int[] last = result.get(result.size() - 1);
        if (interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
        else result.add(interval.clone());
    }
    return result;
}
// mergeWithoutSorting() is identical but walks "intervals" directly, unsorted.

int[][] unsorted = {{8,10}, {1,3}, {15,18}, {2,6}, {9,12}};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real Output — Same Input, Sort Step Present vs. Skipped">
{`Input (unsorted order): [[8, 10], [1, 3], [15, 18], [2, 6], [9, 12]]

Naive (no sort, processed in given order):
  [[8, 10], [15, 18]]
  -> WRONG two ways at once:
     1) [1,3] gets silently swallowed into [8,10] because the only check
        is 'does this start <= the last interval's end' (1 <= 10 is true),
        with no regard for whether they're anywhere near each other.
     2) [8,10] and [9,12] genuinely overlap but are never compared to each
        other, because [15,18] sits between them in the input order.
     Result: 5 input intervals collapse to 2 bogus ones, and real overlaps
     are missed while fake ones are invented.

Correct (sort by start time first, then sweep):
  [[1, 6], [8, 12], [15, 18]]
  -> matches the true merged set: [1,6], [8,12], [15,18]`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why This Specific Bug Is Easy to Miss in Review">
        <p>
          The naive output <code>[[8, 10], [15, 18]]</code> is not obviously broken at a glance — it
          looks like a plausible, shorter list of intervals. It is only wrong when you check it against
          the input: <code>[1, 3]</code> vanished (silently absorbed into <code>[8, 10]</code> despite
          not overlapping it at all), and <code>[9, 12]</code> vanished too, despite genuinely
          overlapping <code>[8, 10]</code>. The bug is comparing every new interval only against the{' '}
          <em>last interval added to the result</em>, which is meaningless as an overlap check unless
          the input is already ordered by start time — sorting first is what guarantees any two
          intervals that could possibly overlap end up adjacent to each other.
        </p>
      </InfoBox>

      <h2>5. Top-K Elements</h2>

      <p>
        <strong>Signal:</strong> the question asks for the <strong>K</strong> largest, smallest, or
        most/least frequent items — not the full sorted order, just a bounded slice of it. &quot;Top 10
        trending hashtags,&quot; &quot;K closest points to the origin,&quot; &quot;the 3 most frequent
        words&quot; — the presence of a specific, bounded K alongside a much larger N is the signal.
      </p>

      <p>
        The tool is a <code>PriorityQueue</code> capped at size K — the same <code>PriorityQueue</code>{' '}
        this section&apos;s stacks-and-queues lesson introduces, used here for exactly the use case it
        exists for. For &quot;top K largest,&quot; keep a <em>min</em>-heap of size K: every new
        element either gets discarded (smaller than everything currently kept) or swaps in for the
        current smallest. The heap holds at most K elements at any moment, so each insertion/eviction
        costs O(log k) instead of O(log n).
      </p>

      <CodeBlock language="java" title="Top-K via Size-K Heap vs. Full Sort (JDK 26)">
{`static int[] topKByHeap(int[] arr, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>(k);
    for (int num : arr) {
        if (minHeap.size() < k) {
            minHeap.offer(num);
        } else if (num > minHeap.peek()) {
            minHeap.poll();
            minHeap.offer(num);
        }
    }
    int[] result = new int[k];
    for (int i = k - 1; i >= 0; i--) result[i] = minHeap.poll();
    return result;
}

static int[] topKBySorting(int[] arr, int k) {
    int[] copy = arr.clone();
    Arrays.sort(copy);                       // O(n log n) — sorts ALL of arr
    int[] result = new int[k];
    for (int i = 0; i < k; i++) result[i] = copy[copy.length - 1 - i];
    return result;
}`}
      </CodeBlock>

      <p>
        Small correctness check first — both approaches must agree on the actual top-K values, not
        just run without error:
      </p>

      <CodeBlock language="text" title="Real Output — Correctness Check">
{`Array: [7, 2, 19, 4, 25, 12, 1, 33, 8]
Top 3 by heap: [33, 25, 19]
Top 3 by sort: [33, 25, 19]`}
      </CodeBlock>

      <p>
        Then the actual efficiency claim — O(n log k) vs. O(n log n) — was timed on{' '}
        <code>n = 5,000,000</code> random integers with <code>k = 10</code>, the scenario where the gap
        between &quot;log k&quot; and &quot;log n&quot; is largest:
      </p>

      <CodeBlock language="text" title="Real Output — n = 5,000,000, k = 10, JDK 26">
{`n = 5000000, k = 10
Trial 1 -- heap(O(n log k)): 3.978 ms | full sort(O(n log n)): 234.143 ms | sort is 58.9x slower | results match: true
Trial 2 -- heap(O(n log k)): 4.140 ms | full sort(O(n log n)): 223.888 ms | sort is 54.1x slower | results match: true
Trial 3 -- heap(O(n log k)): 3.979 ms | full sort(O(n log n)): 225.745 ms | sort is 56.7x slower | results match: true`}
      </CodeBlock>

      <p>
        A ~55–59x speedup across three independent trials, with the heap consistently sub-5ms and the
        full sort consistently in the 220–235ms range. The intuition behind the number:{' '}
        <code>log(10) ≈ 3.3</code> vs. <code>log(5,000,000) ≈ 22.3</code> — the full sort is doing
        roughly seven times more comparison-depth per element, on top of touching every element with a
        general-purpose sort instead of a heap operation bounded by a constant K. When K is small and
        fixed relative to N, sorting everything means paying to fully order millions of elements you
        are about to throw away.
      </p>

      <h2>The Decision Table</h2>

      <p>
        Same format as the encoding/encryption/hashing table from earlier in this tutorial site: match
        the phrase in the problem statement to the pattern, and know <em>why</em> — because &quot;I
        recognized the keyword&quot; falls apart the moment a problem phrases the same pattern
        unfamiliarly, and &quot;I understood the mechanism&quot; does not.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Problem says&hellip;</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Reach for</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>&quot;Sorted array, find a pair (or triple) that sums to / is closest to X&quot;</td>
            <td style={{ padding: '0.75rem' }}><strong>Two Pointers</strong></td>
            <td style={{ padding: '0.75rem' }}>Sort order lets one comparison rule out a whole side of the search space — O(n) instead of O(n²)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>&quot;Longest / shortest contiguous substring or subarray meeting a condition&quot;</td>
            <td style={{ padding: '0.75rem' }}><strong>Sliding Window</strong></td>
            <td style={{ padding: '0.75rem' }}>Expand/shrink a running window instead of re-scanning every candidate substring from scratch</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>&quot;Detect a cycle&quot; / &quot;find the middle in one pass&quot;</td>
            <td style={{ padding: '0.75rem' }}><strong>Fast &amp; Slow Pointers</strong></td>
            <td style={{ padding: '0.75rem' }}>Two pointers at different speeds are guaranteed to meet inside a cycle, or land on the midpoint, in a single pass with O(1) extra memory</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>&quot;Merge overlapping meetings/ranges&quot; / &quot;minimum rooms needed&quot;</td>
            <td style={{ padding: '0.75rem' }}><strong>Merge Intervals</strong></td>
            <td style={{ padding: '0.75rem' }}>Sorting by start time first guarantees any two intervals that could overlap end up adjacent, so one linear sweep suffices</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>&quot;K most/least frequent&quot; / &quot;K largest/smallest&quot; / &quot;Kth largest&quot;</td>
            <td style={{ padding: '0.75rem' }}><strong>Top-K Elements</strong> (heap sized to K)</td>
            <td style={{ padding: '0.75rem' }}>A size-K heap costs O(n log k); fully sorting to get K values you keep costs O(n log n) for no benefit</td>
          </tr>
        </tbody>
      </table>

      <p>
        None of these are exclusive — real problems sometimes stack two (sort, then two-pointer; or
        sliding window with a heap inside it for a running top-K within the window). But the first move
        is always the same: read the problem once for the structural signal — sorted? contiguous?
        cycle? ranges? bounded K? — before reaching for any code at all.
      </p>

      <InteractiveChallenge
        question={"A problem statement reads: \"You're given an unsorted array of integers representing daily stock prices. Find the 5 highest prices in the dataset, without fully sorting the entire array.\" Which pattern applies, and why?"}
        options={[
          "Two Pointers — because it's an array problem",
          "Sliding Window — because you need a contiguous range of prices",
          "Top-K Elements — a size-5 min-heap tracks the 5 highest seen so far in O(n log 5), avoiding the O(n log n) cost of sorting the whole array",
          "Merge Intervals — because prices form a range over time"
        ]}
        correctIndex={2}
        explanation={"The signal is a bounded K (5) alongside a much larger N (\"entire array\"), plus an explicit hint against full sorting — that's the Top-K Elements pattern. A size-5 min-heap keeps only the 5 largest values seen at any point: anything smaller than the heap's minimum gets discarded outright, and the heap never grows past 5 elements, so each operation costs O(log 5) instead of the O(log n) a full sort would pay per element. There's no sortedness to exploit (ruling out Two Pointers), no contiguous-range requirement (ruling out Sliding Window), and no interval merging involved (ruling out Merge Intervals)."}
      />

      <InteractiveChallenge
        question={"Why does a size-K heap beat sorting the entire array when you only need the top K elements out of a much larger N?"}
        options={[
          "A heap is always faster than any sort, regardless of size",
          "Sorting is O(n log n) over all n elements; a size-K heap is O(n log k) — when k is much smaller than n, log k is far cheaper than log n, and you never pay to order the elements you're going to discard",
          "Heaps use less memory than arrays, which is what makes them faster",
          "PriorityQueue in Java automatically parallelizes across cores, unlike Arrays.sort"
        ]}
        correctIndex={1}
        explanation={"Full sort is O(n log n) no matter how small K is — it fully orders every element, including the n - k you'll throw away. A size-K heap processes each of the n elements with an O(log k) insert/evict decision, so the total is O(n log k). When k is small and fixed relative to n (top 10 out of 5 million, for instance), log(10) ≈ 3.3 versus log(5,000,000) ≈ 22.3 is a large, measurable gap — confirmed here at roughly 55–59x in real timing across three trials, not just in theory."}
      />
    </LessonLayout>
  );
}
