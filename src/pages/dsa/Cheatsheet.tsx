import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function Cheatsheet() {
  return (
    <LessonLayout
      title="📋 Cheat Sheet"
      sectionId="dsa"
      lessonIndex={13}
      prev={{ path: '/dsa/patterns', label: 'Common Interview Patterns' }}
      next={null}
    >
      <p>
        A single-page reconciliation of every complexity claim and empirical result from this
        section. Every number below was actually measured on this machine (JDK 26) somewhere in
        the nine lessons that precede this one — nothing here is a textbook figure restated from
        memory.
      </p>

      <h2>Complexity Classes, Fastest to Slowest</h2>

      <CodeBlock language="text" title="Growth rate, and what actually produces it">
{`O(1)        array index, hash table average case
O(log n)    binary search, balanced BST operations
O(n)        linear scan, single-pass hash table build
O(n log n)  merge sort, heap sort, well-implemented quicksort
O(n²)       bubble sort, naive nested-loop pair search, worst-case quicksort
O(2^n)      naive recursive Fibonacci (no memoization)

Big-O is an upper bound on GROWTH, not an exact operation count.
Big-Omega = lower bound, Big-Theta = tight bound — most casual use
conflates all three under "Big-O."`}
      </CodeBlock>

      <h2>Data Structure Operations — Real Measured Costs</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Structure</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Access</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Insert</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>The gotcha</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Array / ArrayList</strong></td>
            <td style={{ padding: '0.75rem' }}>O(1)</td>
            <td style={{ padding: '0.75rem' }}>O(n) at head, O(1) amortized at tail</td>
            <td style={{ padding: '0.75rem' }}>Resize doubling — most inserts fast, occasional O(n) copy</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Linked List</strong></td>
            <td style={{ padding: '0.75rem' }}>O(n)</td>
            <td style={{ padding: '0.75rem' }}>O(1) at head/given node</td>
            <td style={{ padding: '0.75rem' }}>java.util.LinkedList is doubly-linked, also a Deque</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>BST (unbalanced)</strong></td>
            <td style={{ padding: '0.75rem' }}>O(log n) avg, <strong>O(n) worst</strong></td>
            <td style={{ padding: '0.75rem' }}>same</td>
            <td style={{ padding: '0.75rem' }}>Sorted-order insert degenerates to a chain — measured <strong>1,255x slower</strong></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Hash Table</strong></td>
            <td style={{ padding: '0.75rem' }}>O(1) avg</td>
            <td style={{ padding: '0.75rem' }}>O(1) avg</td>
            <td style={{ padding: '0.75rem' }}>Negative hashCode() + naive % gives a negative array index — real crash, real fix is <code>Math.floorMod</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>PriorityQueue (heap)</strong></td>
            <td style={{ padding: '0.75rem' }}>O(1) peek</td>
            <td style={{ padding: '0.75rem' }}>O(log n)</td>
            <td style={{ padding: '0.75rem' }}>for-each iteration is NOT sorted order — only repeated poll() is (verified: <code>1 2 3 5 9 8 7</code> vs poll's <code>1 2 3 5 7 8 9</code>)</td>
          </tr>
        </tbody>
      </table>

      <h2>Sorting — Verified Behavior</h2>

      <CodeBlock language="text" title="What actually happens, measured">
{`Naive Quicksort (pivot = last element), n=10,000:
  random input:        152,579 comparisons, 0.236 ms
  already-sorted input: 49,995,000 comparisons, 20.563 ms  <- exactly n(n-1)/2
  327.7x more comparisons, 87.1x slower wall-clock

Java's real Arrays.sort():
  int[] / primitives   -> dual-pivot Quicksort (NOT stable, doesn't need to be)
  Object[] / List      -> TimSort (stable — verified against JDK 26's own
                           @implNote source comment: "guaranteed stable")
  This asymmetry is a real, common interview question.

Binary search on an UNSORTED array: returns a false negative (-1) for a
value that IS present — verified, not just asserted. Requires sorted input.
Use mid = low + (high-low)/2, not (low+high)/2 — the latter can integer-
overflow for large arrays (see Joshua Bloch's "Nearly All Binary Searches
and Mergesorts are Broken," 2006).`}
      </CodeBlock>

      <h2>Dynamic Programming — The One Number That Matters</h2>

      <CodeBlock language="text" title="Naive vs memoized fib(40) — measured, not estimated">
{`Naive recursive:    154.5 ms,  331,160,281 calls (= 2*F(41)-1, exact)
Memoized (top-down): 36.6 microseconds,  79 calls
~4,200x faster from caching alone — same algorithm, same base cases.

Recognize a DP problem: overlapping subproblems (same smaller call
recurs) + optimal substructure (optimal answer built from optimal
sub-answers). "Count the ways to..." / "min or max over a sequence" with
an exponential naive approach are the real tells.`}
      </CodeBlock>

      <h2>Interview Pattern → Recognition Signal</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Signal in the problem</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Pattern</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Sorted array, find a pair/triple</td>
            <td style={{ padding: '0.75rem' }}>Two Pointers</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Longest/shortest contiguous substring or subarray meeting a condition</td>
            <td style={{ padding: '0.75rem' }}>Sliding Window</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Detect a cycle, find a middle element in one pass</td>
            <td style={{ padding: '0.75rem' }}>Fast &amp; Slow Pointers</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Overlapping ranges need combining</td>
            <td style={{ padding: '0.75rem' }}>Merge Intervals (sort by start FIRST)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>K largest/smallest/most-frequent, K &lt;&lt; N</td>
            <td style={{ padding: '0.75rem' }}>Top-K via a size-K heap</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Shortest path, unweighted graph</td>
            <td style={{ padding: '0.75rem' }}>BFS</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Shortest path, weighted, non-negative edges</td>
            <td style={{ padding: '0.75rem' }}>Dijkstra (breaks with negative weights — use Bellman-Ford)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Dependency/build ordering</td>
            <td style={{ padding: '0.75rem' }}>Topological Sort (DAG only)</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="The One Subtle Graph Bug Worth Remembering">
        <p>
          Cycle detection in a <strong>directed</strong> graph needs to track nodes in the current
          recursion path ("on stack"), not just a global visited set — a directed graph can
          legitimately revisit an already-visited node via a different path with no cycle
          (verified with a real diamond-shaped DAG: naive global-visited detection reported a
          false cycle; the on-stack version correctly reported none).
        </p>
      </InfoBox>

      <h2>Section Index</h2>

      <CodeBlock language="text" title="All 10 lessons, in reading order">
{`1. Complexity Analysis: Big-O in Practice     O(1) through O(2^n), empirically measured
2. Arrays & Sorting Algorithms                Bubble/Merge/Quick, Arrays.sort() internals
3. Linked Lists                               Singly/doubly, cycle detection, reversal
4. Stacks & Queues                            Stack vs ArrayDeque, PriorityQueue's real order
5. Trees & Binary Search Trees                BST invariant, the 1,255x degradation
6. Graphs & Graph Traversal                   BFS/DFS, directed vs undirected cycles, Dijkstra
7. Hash Tables, Deep Dive                     From scratch, the negative-hashCode crash
8. Dynamic Programming                        Naive vs memoized, the 4,200x speedup
9. Common Interview Patterns                  The recognition-signal meta-skill
10. This page`}
      </CodeBlock>
    </LessonLayout>
  );
}
