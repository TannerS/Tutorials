import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function DsaCheatsheet() {
  return (
    <GuideLayout
      title="DSA"
      kicker="FIELD GUIDE"
      glyph="🧮"
      tagline="Data Structures & Algorithms — every complexity claim below was measured on this machine somewhere in the lessons that precede this page."
      meta={['JDK 26', '13 lessons', '15 panels']}
      page="1 / 1"
      footer="This page is for recall — the lessons in this section carry the reasoning, the diagrams and the worked examples. Nothing here is a textbook figure restated from memory."
      prev={{ path: '/dsa/patterns', label: 'Common Interview Patterns' }}
      next={null}
    >
      <GuidePanel n={1} title="Big-O — Growth Rates, Fastest to Slowest" accent="blue" glyph="📈" span={2}>
        <GuideTable
          head={['Notation', 'What it actually means', 'What produces it']}
          rows={[
            ['O(1)', 'constant — cost does not grow with input size', 'array index, hash table average case'],
            ['O(log n)', 'the remaining work roughly halves each step', 'binary search, balanced BST operations'],
            ['O(n)', 'cost scales 1:1 with input size', 'linear scan, single-pass hash table build'],
            ['O(n log n)', 'n copies of a log n process', 'merge sort, heap sort, well-implemented quicksort'],
            ['O(n²)', 'cost scales with the SQUARE of input size', 'bubble sort, naive nested-loop pair search, worst-case quicksort'],
            ['O(phi^n)', 'grows by a constant ~1.618× ratio every step', 'naive recursive Fibonacci, no memoization'],
          ]}
        />
        <GuideRules
          items={[
            'Big-O is an upper bound on GROWTH, not an exact operation count.',
            'Measured call-count ratio for naive Fibonacci was 2.618 = phi² every 2 steps of n, never 4.0 — "O(2^n)" is a true upper bound but not the tight one.',
            'Big-Omega = lower bound, Big-Theta = tight bound — casual use conflates all three under "Big-O."',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={2} title="Data Structure Operations — Real Measured Costs" accent="purple" glyph="🗃️" span={2}>
        <GuideTable
          head={['Structure', 'Access', 'Insert', 'The gotcha']}
          rows={[
            ['Array / ArrayList', 'O(1)', 'O(n) at head, O(1) amortized at tail', 'Resize grows 1.5×, not 2× (measured: 244 → 366) — most inserts fast, occasional O(n) copy'],
            ['Linked List', 'O(n)', 'O(1) at head/given node', 'java.util.LinkedList is doubly-linked, also a Deque'],
            ['BST (unbalanced)', 'O(log n) avg, O(n) worst', 'same', 'Sorted-order insert degenerates to a chain — measured 1,255× slower'],
            ['Hash Table', 'O(1) avg', 'O(1) avg', 'Negative hashCode() + naive % gives a negative index — real crash, fix is Math.floorMod'],
            ['PriorityQueue (heap)', 'O(1) peek', 'O(log n)', 'for-each is NOT sorted order — only repeated poll() is'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={3} title="Arrays & Sorting" accent="green" glyph="🔀" span={2}>
        <GuideCode>{`Naive Quicksort (pivot = last element), n=10,000:
  random input:         152,579 comparisons,  0.236 ms
  already-sorted input:  49,995,000 comparisons, 20.563 ms  <- exactly n(n-1)/2
  327.7x more comparisons, 87.1x slower wall-clock

Java's real Arrays.sort():
  int[] / primitives   -> dual-pivot Quicksort (NOT stable)
  Object[] / List      -> TimSort (stable -- documented "guaranteed stable")

Binary search on an UNSORTED array returns a false negative (-1) for a
value that IS present -- requires sorted input.
mid = low + (high-low)/2   -- NOT (low+high)/2, which can integer-
overflow for large arrays (Joshua Bloch, "Nearly All Binary Searches
and Mergesorts are Broken," 2006).`}</GuideCode>
        <GuideRules items={['The int[] vs Object[] sort-algorithm split is a real, common interview question.']} />
      </GuidePanel>

      <GuidePanel n={4} title="Linked Lists" accent="amber" glyph="🔗">
        <GuideDefs
          items={[
            ['singly-linked', 'one next pointer per node — O(n) access, O(1) insert at head'],
            ['doubly-linked', 'next + prev — java.util.LinkedList is this, and also a Deque'],
            ['cycle detection', "Floyd's Tortoise & Hare: slow +1 node/step, fast +2 — they meet iff there is a cycle, fast hits null iff there is not. O(1) space."],
            ['reversal', 'iterative, 3 pointers (prev/cur/next) — O(n) time, O(1) space, no recursion needed'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={5} title="Stacks & Queues" accent="pink" glyph="🥞">
        <GuideDefs
          items={[
            ['Stack (LIFO)', 'java.util.Stack is legacy and synchronized — prefer ArrayDeque as a stack'],
            ['Queue (FIFO)', 'ArrayDeque via offer()/poll() — amortized O(1) at both ends'],
            ['PriorityQueue', 'O(1) peek, O(log n) offer/poll — backed by a binary heap'],
          ]}
        />
        <GuideRules items={["for-each iteration is NOT sorted order — only repeated poll() is (verified: 1 2 3 5 9 8 7 vs poll's 1 2 3 5 7 8 9)."]} />
      </GuidePanel>

      <GuidePanel n={6} title="Recursion & Backtracking" accent="cyan" glyph="🔁">
        <GuideCode>{`No base case = StackOverflowError (measured on this machine):
  countDown(5) -> ... -> 10,980 calls -> StackOverflowError

Two things must BOTH be true:
  the recursive case moves TOWARD the base case
  the base case is reachable from every input`}</GuideCode>
        <GuideRules
          items={[
            'Backtracking = recursion + undo: choose a value, recurse into it, then undo the choice before trying the next one.',
            'Classic use: generate every subset/permutation — include an element, recurse, exclude it, recurse.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={7} title="Trees & Binary Search Trees" accent="red" glyph="🌳">
        <GuideDefs
          items={[
            ['BST invariant', 'every left subtree < node < every right subtree, recursively'],
            ['traversal orders', 'inorder / preorder / postorder (DFS shapes), level-order (BFS shape)'],
          ]}
        />
        <GuideCode>{`Sorted-order insert into an unbalanced BST degenerates into
a straight chain -- measured 1,255x slower than random-order insert.`}</GuideCode>
        <GuideRules items={['AVL / Red-Black trees rebalance on insert and delete to GUARANTEE O(log n) height — that is the fix for the chain case above.']} />
      </GuidePanel>

      <GuidePanel n={8} title="Heaps (Binary, Array-Backed)" accent="blue" glyph="🏔️">
        <GuideCode>{`children of index i:  2i + 1,  2i + 2
parent of index i:    (i - 1) / 2      -- integer division

No node objects, no pointers -- just index arithmetic.
insert (sift up) / extractMin (sift down): O(log n)
build-heap from n items: O(n) total (Floyd's algorithm),
  NOT O(n log n) from n separate inserts`}</GuideCode>
        <GuideRules
          items={[
            'This is exactly how java.util.PriorityQueue is implemented.',
            'Repeated extractMin over the whole heap is heapsort — O(n log n).',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={9} title="Tries (Prefix Trees)" accent="purple" glyph="🔤">
        <GuideDefs
          items={[
            ['a node', 'one character, not a whole word — the word lives in the PATH'],
            ['shared prefixes', '"cat" and "car" literally share the same c → a nodes'],
            ['search / insert', 'O(L), L = length of the word — one hop per character'],
          ]}
        />
        <GuideRules
          items={[
            "Not faster than a HashSet<String>'s O(1) average for a single lookup.",
            'Wins where a hash set cannot help at all: list every stored word starting with a given prefix.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={10} title="Graphs & Traversal" accent="green" glyph="🕸️">
        <GuideTable
          head={['Algorithm', 'Time', 'Use it for']}
          rows={[
            ['BFS', 'O(V + E)', 'Shortest path, UNWEIGHTED graph only'],
            ['DFS', 'O(V + E)', 'Reachability, connected components, cycle detection'],
            ['Dijkstra', 'O((V+E) log V)', 'Shortest path, weighted, NON-negative edges only'],
            ['Bellman-Ford', 'O(V × E)', 'Shortest path with negative edges, or detecting a negative cycle'],
          ]}
        />
        <GuideRules
          items={[
            'Directed-graph cycle detection needs an on-stack set (the current recursion path), not just a global visited set — a DAG can legitimately revisit a visited node via another path with no cycle.',
            'Topological sort is only valid on a DAG (no cycles).',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={11} title="Union-Find (Disjoint Set)" accent="amber" glyph="🧷">
        <GuideCode>{`parent[i] holds the parent of element i; a self-parent is a root.
find(x):    walk parent pointers to the root, THEN rewrite every
            visited node to point straight at it (path compression).
union(x, y): find both roots, splice one under the other.`}</GuideCode>
        <GuideRules
          items={[
            'Path compression + union by size/rank gives O(m × alpha(n)) total over m operations — alpha is the inverse Ackermann function, small enough to treat as near-O(1) per operation, not literally constant.',
            "Powers Kruskal's MST: sort edges by weight, skip any edge whose endpoints are already in the same set.",
          ]}
        />
      </GuidePanel>

      <GuidePanel n={12} title="Hashing" accent="pink" glyph="🧩">
        <GuideCode>{`Negative hashCode() + naive % gives a NEGATIVE array index --
real crash. Fix: Math.floorMod(hash, capacity).`}</GuideCode>
        <GuideRules
          items={[
            "Java's HashMap default: load factor 0.75, initial capacity 16.",
            'Once size > capacity × 0.75, the backing array DOUBLES and every entry is rehashed — an O(n) pause, but rare enough that amortized insert stays O(1) (same trick ArrayList growth uses).',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={13} title="Dynamic Programming" accent="cyan" glyph="🧠">
        <GuideCode>{`fib(40), naive recursive:     154.5 ms,        331,160,281 calls
fib(40), memoized (top-down):  36.6 microseconds,     79 calls
~4,200x faster from caching alone -- same algorithm, same base cases.`}</GuideCode>
        <GuideRules
          items={[
            'Recognize a DP problem: overlapping subproblems (same smaller call recurs) + optimal substructure (best answer built from best sub-answers).',
            '"Count the ways to..." or "min/max over a sequence" with an exponential naive approach are the tells.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={14} title="Interview Pattern → Recognition Signal" accent="red" glyph="🧭" span={2}>
        <GuideTable
          head={['Signal in the problem', 'Pattern']}
          rows={[
            ['Sorted array, find a pair/triple', 'Two Pointers'],
            ['Longest/shortest contiguous substring or subarray meeting a condition', 'Sliding Window'],
            ['Detect a cycle, find a middle element in one pass', 'Fast & Slow Pointers'],
            ['Overlapping ranges need combining', 'Merge Intervals (sort by start first)'],
            ['K largest/smallest/most-frequent, K << N', 'Top-K via a size-K heap'],
            ['Shortest path, unweighted graph', 'BFS'],
            ['Shortest path, weighted, non-negative edges', 'Dijkstra (negative weights → Bellman-Ford)'],
            ['Dependency/build ordering', 'Topological Sort (DAG only)'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={15} title="Section Index" accent="blue" glyph="📚" span={2}>
        <GuideCode>{`1.  Complexity Analysis: Big-O in Practice
2.  Arrays & Sorting Algorithms
3.  Linked Lists
4.  Stacks & Queues
5.  Recursion & Backtracking
6.  Trees & Binary Search Trees
7.  Heaps & Priority Queues, From Scratch
8.  Tries (Prefix Trees)
9.  Graphs & Graph Traversal
10. Union-Find & Minimum Spanning Trees
11. Hash Tables, Deep Dive
12. Dynamic Programming
13. Common Interview Patterns
14. This page`}</GuideCode>
      </GuidePanel>
    </GuideLayout>
  );
}
