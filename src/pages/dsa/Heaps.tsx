import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Heaps() {
  return (
    <LessonLayout
      title="Heaps & Priority Queues, From Scratch"
      sectionId="dsa"
      lessonIndex={6}
      prev={{ path: '/dsa/trees', label: 'Trees & Binary Search Trees' }}
      next={{ path: '/dsa/tries', label: 'Tries (Prefix Trees)' }}
    >
      <p>
        A heap is a tree that makes exactly <strong>one</strong> promise, and keeps it religiously: the
        smallest value (or the largest, depending on which flavor you build) is always sitting at the top,
        ready to grab in O(1). That is the entire idea. A heap does <strong>not</strong> promise that
        everything else is in order — just that the top is right. Think of it like the front of a line at
        school organized by height: the shortest kid in class always stands at the very front of that
        specific line, but nobody promised the rest of the line is sorted by height behind them — the
        2nd-shortest kid could easily be standing near the back. &quot;The top item is correct&quot; and
        &quot;the whole structure is sorted&quot; are two very different guarantees, and a heap only makes
        the first one. The Stacks &amp; Queues lesson already showed a symptom of this — a real{' '}
        <code>PriorityQueue</code>&apos;s for-each iteration coming out <em>not</em> sorted while{' '}
        <code>poll()</code> comes out perfectly sorted — without explaining why. This lesson builds a heap
        from nothing so that &quot;why&quot; stops being mysterious.
      </p>

      <h2>The Tree Picture: One Promise, Kept at Every Level</h2>

      <p>
        Here is a small min-heap holding seven numbers, drawn as an actual tree. A{' '}
        <strong>min-heap</strong> means the rule is &quot;every parent is less than or equal to its
        children&quot; (a <strong>max-heap</strong> just flips that to &quot;greater than or equal
        to&quot; — everything else about how it works is identical):
      </p>

      <FlowChart
        title="A 7-Node Min-Heap (the same example used for the rest of this lesson)"
        chart={"graph TD\n  N2((2)) --> N5((5))\n  N2 --> N3((3))\n  N5 --> N8((8))\n  N5 --> N9((9))\n  N3 --> N6((6))\n  N3 --> N7((7))"}
      />

      <p>
        Check the promise, edge by edge: 2 ≤ 5 and 2 ≤ 3 (root to its two children), 5 ≤ 8 and 5 ≤ 9 (the
        left subtree), 3 ≤ 6 and 3 ≤ 7 (the right subtree). Every single parent-child pair obeys the rule.
        Now look at what is <em>not</em> guaranteed: 5 and 3 are siblings — both children of the root — and
        5 is bigger than 3. That is completely legal; the heap property never said anything about siblings.
        Same for 8 and 6: they are &quot;cousins&quot; sitting at the same depth in different subtrees, and
        8 is bigger than 6, also completely legal. The only relationship a heap actually enforces is along
        direct parent-to-child edges. Everything else — left vs. right, cousins, nodes at the same depth —
        is free to land in any order.
      </p>

      <InfoBox variant="tip" title="The One Rule to Remember">
        <p>
          <strong>Heap property = parent vs. its own children, and nothing else.</strong> It is a much
          weaker (and much cheaper to maintain) promise than &quot;fully sorted.&quot; That weakness is a
          feature: it is exactly what makes inserting and removing fast, as the rest of this lesson shows.
        </p>
      </InfoBox>

      <h2>The Array Trick: No Pointers, Just Index Math</h2>

      <p>
        Here is the detail that surprises people learning this for the first time: a binary heap is
        essentially never built out of node objects with left/right pointers, the way the previous lesson&apos;s
        binary trees were. It is stored as one plain array. The &quot;tree&quot; above is really just a
        convenient way to <em>picture</em> the array — the actual data structure is flat. Reading the same
        seven values left to right, level by level (root first, then the next level, then the next), gives
        the array <code>[2, 5, 3, 8, 9, 6, 7]</code>. Laid out with its parent/child relationships drawn on
        top of it:
      </p>

      <FlowChart
        title="The Same Heap, Stored as a Flat Array (solid = array order, dashed = real parent -> child link)"
        chart={"graph LR\n  A0[\"index 0 = 2\"] --> A1[\"index 1 = 5\"] --> A2[\"index 2 = 3\"] --> A3[\"index 3 = 8\"] --> A4[\"index 4 = 9\"] --> A5[\"index 5 = 6\"] --> A6[\"index 6 = 7\"]\n  A0-.->|\"parent of\"| A2\n  A1-.->|\"parent of\"| A3\n  A1-.->|\"parent of\"| A4\n  A2-.->|\"parent of\"| A5\n  A2-.->|\"parent of\"| A6"}
      />

      <p>
        The solid arrows are just &quot;the next slot in memory&quot; — that is all an array is. The dashed
        arrows are the <em>real</em> tree relationships, and notice most of them jump clean over one or more
        cells (index 1 is the parent of index 3, skipping right past index 2). There are no pointer fields
        anywhere making those jumps happen. They happen because of one small piece of arithmetic, applied to
        an index:
      </p>

      <ul>
        <li>The children of the node at index <code>i</code> live at <code>2i + 1</code> and <code>2i + 2</code>.</li>
        <li>The parent of the node at index <code>i</code> lives at <code>(i - 1) / 2</code>, using integer division (the fractional part is thrown away).</li>
      </ul>

      <p>
        That is the entire &quot;trick.&quot; No node objects, no left/right references to maintain — just
        two small formulas. Before trusting that claim, it is worth checking it against the exact diagram
        above instead of taking it on faith:
      </p>

      <CodeBlock language="java" title="HeapIndexMath.java — checking the formula against the drawn diagram">
{`int[] heap = {2, 5, 3, 8, 9, 6, 7}; // exactly the array from the diagram above

// Node 5 lives at index 1. The diagram says its children are 8 and 9.
int leftChild  = heap[2 * 1 + 1]; // index 3
int rightChild = heap[2 * 1 + 2]; // index 4
System.out.println("children of 5 (index 1): " + leftChild + ", " + rightChild);

// Node 3 lives at index 2. The diagram says its children are 6 and 7.
System.out.println("children of 3 (index 2): " + heap[2 * 2 + 1] + ", " + heap[2 * 2 + 2]);

// Node 6 lives at index 5. The diagram says its parent is 3.
System.out.println("parent of 6 (index 5): " + heap[(5 - 1) / 2]);`}
      </CodeBlock>

      <p>Run for real against JDK 26.0.1:</p>

      <CodeBlock language="text" title="Real Output">
{`children of 5 (index 1): 8, 9
children of 3 (index 2): 6, 7
parent of 6 (index 5): 3`}
      </CodeBlock>

      <p>
        Exactly what the diagram shows, produced from nothing but arithmetic on the index — no traversal, no
        pointer chasing, just <code>2i + 1</code>, <code>2i + 2</code>, and <code>(i - 1) / 2</code>. That is
        why array-backed heaps are so cheap: moving between a node and its parent or children is an O(1)
        index calculation, not a pointer dereference.
      </p>

      <h2>Insert: Add at the End, Then Sift Up</h2>

      <p>
        Inserting a new value into the heap works in two simple steps. First, drop the new value into the
        very next open slot at the <em>end</em> of the array — that is the one spot guaranteed not to break
        the tree&apos;s shape. Then let it &quot;bubble up&quot; toward the root: compare it to its parent,
        and if it is smaller, swap them. Keep comparing-and-swapping with the new parent until either the
        value finds a parent that is smaller than it, or it reaches the root. That bubbling-up process is
        called <strong>sift-up</strong> (also &quot;bubble-up&quot; or &quot;percolate-up&quot;).
      </p>

      <CodeBlock language="java" title="MinHeap.java — insert() and siftUp()">
{`private final List<Integer> arr = new ArrayList<>();

private int parentOf(int i) { return (i - 1) / 2; }

public void insert(int value) {
    arr.add(value);                 // 1. add at the very end
    siftUp(arr.size() - 1);         // 2. bubble it up until the heap property holds
}

private void siftUp(int i) {
    while (i > 0 && arr.get(i) < arr.get(parentOf(i))) {
        swap(i, parentOf(i));
        i = parentOf(i);
    }
}`}
      </CodeBlock>

      <h2>Remove the Minimum: Sift Down</h2>

      <p>
        Removing the minimum is almost the mirror image, but with one extra move that trips people up the
        first time they see it. The minimum is always the root (index 0), so grab that value to return. Then
        — instead of just leaving a hole — take the <strong>last</strong> element in the array, move it into
        the now-empty root slot, and shrink the array by one. That new root is very likely too big to belong
        there, so let it &quot;sink down&quot;: compare it against its two children, swap with whichever
        child is <em>smaller</em> (never the bigger one — that would break the promise the other direction),
        and keep going until it lands on a spot where it is smaller than both children, or it has no
        children left. That is <strong>sift-down</strong>.
      </p>

      <CodeBlock language="java" title="MinHeap.java — extractMin() and siftDown()">
{`private int leftOf(int i)  { return 2 * i + 1; }
private int rightOf(int i) { return 2 * i + 2; }

public int extractMin() {
    int min = arr.get(0);
    int last = arr.remove(arr.size() - 1);   // pull the last element out
    if (!arr.isEmpty()) {
        arr.set(0, last);                    // move it to the root
        siftDown(0);                         // bubble it down until the heap property holds
    }
    return min;
}

private void siftDown(int i) {
    int size = arr.size();
    while (true) {
        int left = leftOf(i), right = rightOf(i), smallest = i;
        if (left < size && arr.get(left) < arr.get(smallest)) smallest = left;
        if (right < size && arr.get(right) < arr.get(smallest)) smallest = right;
        if (smallest == i) break;   // both children are already >= this node -- done
        swap(i, smallest);
        i = smallest;
    }
}`}
      </CodeBlock>

      <p>
        Both operations only ever move a value along one root-to-leaf path, and a heap holding n elements
        has a height of about log₂(n) — so each insert and each extractMin costs O(log n), not O(n). Now the
        proof this actually works: insert ten values in a scrambled order, print the raw array after each
        insert so the &quot;not sorted, just heap-shaped&quot; property is visible, then extract the minimum
        repeatedly and check whether the extraction order is actually sorted:
      </p>

      <CodeBlock language="text" title="Real Output — JDK 26.0.1, inserting 5, 1, 8, 2, 9, 3, 7, 0, 6, 4">
{`=== insert() one at a time, printing raw array after each ===
insert(5) -> raw array: [5]
insert(1) -> raw array: [1, 5]
insert(8) -> raw array: [1, 5, 8]
insert(2) -> raw array: [1, 2, 8, 5]
insert(9) -> raw array: [1, 2, 8, 5, 9]
insert(3) -> raw array: [1, 2, 3, 5, 9, 8]
insert(7) -> raw array: [1, 2, 3, 5, 9, 8, 7]
insert(0) -> raw array: [0, 1, 3, 2, 9, 8, 7, 5]
insert(6) -> raw array: [0, 1, 3, 2, 9, 8, 7, 5, 6]
insert(4) -> raw array: [0, 1, 3, 2, 4, 8, 7, 5, 6, 9]

Note the raw array is NOT sorted -- only the heap property holds (parent <= children).

=== extractMin() repeatedly ===
extractMin() -> 0   (remaining raw array: [1, 2, 3, 5, 4, 8, 7, 9, 6])
extractMin() -> 1   (remaining raw array: [2, 4, 3, 5, 6, 8, 7, 9])
extractMin() -> 2   (remaining raw array: [3, 4, 7, 5, 6, 8, 9])
extractMin() -> 3   (remaining raw array: [4, 5, 7, 9, 6, 8])
extractMin() -> 4   (remaining raw array: [5, 6, 7, 9, 8])
extractMin() -> 5   (remaining raw array: [6, 8, 7, 9])
extractMin() -> 6   (remaining raw array: [7, 8, 9])
extractMin() -> 7   (remaining raw array: [8, 9])
extractMin() -> 8   (remaining raw array: [9])
extractMin() -> 9   (remaining raw array: [])

Full extraction sequence: 0 1 2 3 4 5 6 7 8 9
Is that sequence sorted ascending? true`}
      </CodeBlock>

      <p>
        Look at the raw array right after the tenth insert — <code>[0, 1, 3, 2, 4, 8, 7, 5, 6, 9]</code> —
        and notice it is nowhere close to sorted (<code>4</code> sits before <code>8</code>, but also before{' '}
        <code>2</code> which is smaller than both). That is expected: sift-up only ever fixes the one path
        from the new leaf up to the root, not the whole array. Yet draining that same messy array with{' '}
        <code>extractMin()</code> ten times in a row produced <code>0 1 2 3 4 5 6 7 8 9</code> — perfectly
        sorted, every time, because sift-down repairs the heap property completely after every single
        removal. This is, in fact, a legitimate O(n log n) sorting algorithm (&quot;heapsort&quot;, in its
        heap-as-a-priority-queue form) — it just does its sorting one <code>extractMin()</code> at a time
        instead of all at once.
      </p>

      <h2>Build-Heap in O(n): The Classic Surprise</h2>

      <p>
        One more result worth stating precisely, because the naive analysis gets it wrong. If you already
        have n unsorted elements sitting in a plain array and you want to turn that array into a valid heap,
        you do <strong>not</strong> need to call <code>insert()</code> n times. Inserting one at a time costs
        O(n log n) total, because each of the n inserts can cost up to O(log n). But there is a smarter way —
        start from the last non-leaf node and walk backward to the root, calling <code>siftDown()</code> at
        each position — and that whole process is O(n), not O(n log n). It is a real, classic result (due to
        Robert Floyd in 1964): most nodes near the bottom of the tree are close to being leaves already, so
        most of those sift-downs are cheap, and the few sift-downs that are expensive (near the root) are
        rare — the math works out to a linear total, not a linearithmic one.
      </p>

      <InfoBox variant="note" title="Straight From the JDK 26 Source">
        <p>
          This isn&apos;t a claim taken on faith — it&apos;s the actual comment sitting above{' '}
          <code>PriorityQueue</code>&apos;s private <code>heapify()</code> method in{' '}
          <code>java.base/java/util/PriorityQueue.java</code>, read directly out of this machine&apos;s JDK
          26 <code>src.zip</code>: <em>&quot;Establishes the heap invariant (described above) in the entire
          tree, assuming nothing about the order of the elements prior to the call. This classic algorithm
          due to Floyd (1964) is known to be O(size).&quot;</em> Tracing the call chain confirms it is really
          used: <code>PriorityQueue</code>&apos;s constructor that takes a plain <code>Collection</code>{' '}
          calls <code>initFromCollection(c)</code>, which copies the elements into the backing array
          as-is and then calls <code>heapify()</code> — the exact bottom-up, start-from-the-last-non-leaf
          algorithm described above. That is why <code>new PriorityQueue&lt;&gt;(existingCollection)</code>{' '}
          is the efficient way to turn a bunch of values into a priority queue, rather than looping and
          calling <code>add()</code> once per element.
        </p>
      </InfoBox>

      <h2>The Payoff: This Is Literally <code>java.util.PriorityQueue</code></h2>

      <p>
        Every piece above — the array-backed storage, the <code>2i+1</code> / <code>2i+2</code> /{' '}
        <code>(i-1)/2</code> index math, sift-up on insert, sift-down on removal — is not &quot;heap theory
        that resembles <code>PriorityQueue</code>.&quot; It is exactly, mechanically, what{' '}
        <code>java.util.PriorityQueue</code> does internally, down to the method names (its private methods
        are actually called <code>siftUp</code> and <code>siftDown</code> in the JDK source). Its{' '}
        <code>add()</code>/<code>offer()</code> is this lesson&apos;s <code>insert()</code>. Its{' '}
        <code>poll()</code> is this lesson&apos;s <code>extractMin()</code>. And its for-each iterator just
        walks the backing array from index 0 to the end, in raw storage order — the exact same order this
        lesson showed is <em>not</em> fully sorted, only heap-shaped. That is the entire explanation behind
        the behavior the Stacks &amp; Queues lesson demonstrated but didn&apos;t derive: a for-each loop over
        a real <code>PriorityQueue</code> prints something that starts sorted-looking and then visibly
        breaks order, while repeated <code>poll()</code> calls on the same queue come out perfectly sorted
        — because <code>poll()</code> re-runs sift-down after every single removal, and a for-each loop
        never touches the heap at all.
      </p>

      <InteractiveChallenge
        question={
          "Using the min-heap from this lesson (root 2; left child 5 with children 8 and 9; right child 3 " +
          "with children 6 and 7), which statement is the heap actually guaranteed to satisfy?"
        }
        options={[
          "5 must be less than or equal to 3, since they're both one level below the root",
          "9 must be greater than or equal to 5, since 5 is 9's direct parent",
          "8 must be less than or equal to 6, since both sit two levels down in the tree",
          "Reading the underlying array left to right must produce ascending order",
        ]}
        correctIndex={1}
        explanation={
          "The heap property is a parent-vs-its-own-children promise, edge by edge -- nothing more. 5 <= 9 " +
          "holds because 5 is 9's direct parent, so that relationship IS guaranteed. But 5 and 3 are " +
          "siblings (both children of the root, with 5 > 3), and 8 and 6 are cousins (same depth, " +
          "different subtrees, with 8 > 6) -- neither pair has any guaranteed order, because neither pair " +
          "is connected by a direct parent-child edge. And the array is never claimed to be fully sorted " +
          "-- that's exactly why a for-each over a real java.util.PriorityQueue doesn't come out sorted, " +
          "even though poll() always does."
        }
      />
    </LessonLayout>
  );
}
