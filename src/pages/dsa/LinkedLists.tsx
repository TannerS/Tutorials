import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function LinkedLists() {
  return (
    <LessonLayout
      title="Linked Lists"
      sectionId="dsa"
      lessonIndex={2}
      prev={{ path: '/dsa/arrays-sorting', label: 'Arrays & Sorting Algorithms' }}
      next={{ path: '/dsa/stacks-queues', label: 'Stacks & Queues' }}
    >
      <p>
        An array (and <code>ArrayList</code>) packs its elements into one contiguous block of memory —
        that&apos;s what makes <code>get(i)</code> O(1): the runtime computes <code>base + i * elementSize</code>{' '}
        and jumps straight there. A linked list throws that contiguity away on purpose. Every element
        (a <strong>node</strong>) is its own small heap allocation holding a value and a pointer to the
        next node. There is no <code>base + i * elementSize</code> shortcut — to reach element 5 you walk
        the chain from the head, one <code>next</code> at a time. That sounds like a pure downside, and for
        random access it is. But giving up contiguity is exactly what buys O(1) insertion and removal at
        the ends, no shifting required, which is the trade this entire lesson is about. Every claim below —
        every Big-O, every &quot;this is what Java actually does&quot; — was compiled and run against a real
        JDK 26 install, not recalled from memory.
      </p>

      <InfoBox variant="info" title="The Core Idea">
        <p>
          A linked list is a chain of independent objects held together by pointers, not by physical
          adjacency. <strong>Singly-linked</strong>: each node knows only what comes <em>after</em> it.{' '}
          <strong>Doubly-linked</strong>: each node also knows what comes <em>before</em> it. That one extra
          pointer per node is the entire difference between the two data structures in this lesson, and it
          changes what&apos;s O(1) and what isn&apos;t.
        </p>
      </InfoBox>

      <h2>1. The Singly-Linked List — Node, Head, and Three Kinds of Insert</h2>

      <p>
        The entire data structure is two small pieces: a <code>Node</code> holding a <code>value</code> and
        a <code>next</code> reference, and a <code>head</code> pointer marking where the chain starts. Below
        is a complete, runnable implementation with insert-at-head, two versions of insert-at-tail (the
        point of this section), delete-by-value, and a traversal — compiled and executed for real.
      </p>

      <CodeBlock language="java" title="SinglyLinkedList.java — Node, Head, Insert (Both Ways), Delete, Traverse">
{`import java.util.NoSuchElementException;

/**
 * A from-scratch singly-linked list. Demonstrates:
 *  - insertAtHead: O(1)
 *  - insertAtTailNaive: O(n) — must walk the whole list to find the last node
 *  - insertAtTail: O(1) — because we maintain a \`tail\` pointer
 *  - delete(value): O(n) — must walk to find the node (and its predecessor)
 *  - traverse/print
 */
public class SinglyLinkedList {

    // Node class: value + next pointer. This is the entire building block.
    static class Node {
        int value;
        Node next;
        Node(int value) { this.value = value; }
    }

    private Node head;
    private Node tail; // maintained pointer — this is what makes tail-insert O(1)
    private int size;

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }

    // O(1): just point the new node at the old head, move head.
    public void insertAtHead(int value) {
        Node n = new Node(value);
        n.next = head;
        head = n;
        if (tail == null) tail = n; // list was empty, new node is also the tail
        size++;
    }

    // O(n): no tail pointer, so we must walk every node to find the last one.
    public void insertAtTailNaive(int value) {
        Node n = new Node(value);
        if (head == null) {
            head = n;
            size++;
            return;
        }
        Node cur = head;
        while (cur.next != null) { // walks all n-1 existing nodes
            cur = cur.next;
        }
        cur.next = n;
        size++;
    }

    // O(1): tail pointer already references the last node, so no walk is needed.
    public void insertAtTail(int value) {
        Node n = new Node(value);
        if (tail == null) {
            head = n;
            tail = n;
        } else {
            tail.next = n;
            tail = n;
        }
        size++;
    }

    // O(n): must walk to find the target node and remember its predecessor
    // so the predecessor's \`next\` can be re-pointed around the removed node.
    public boolean delete(int value) {
        if (head == null) return false;

        if (head.value == value) {
            head = head.next;
            size--;
            if (head == null) tail = null; // list is now empty
            return true;
        }

        Node prev = head;
        Node cur = head.next;
        while (cur != null) {
            if (cur.value == value) {
                prev.next = cur.next;
                if (cur == tail) tail = prev; // deleted the last node, fix tail
                size--;
                return true;
            }
            prev = cur;
            cur = cur.next;
        }
        return false; // value not found
    }

    public void traverseAndPrint() {
        StringBuilder sb = new StringBuilder("[");
        Node cur = head;
        while (cur != null) {
            sb.append(cur.value);
            if (cur.next != null) sb.append(" -> ");
            cur = cur.next;
        }
        sb.append("]");
        System.out.println(sb);
    }

    public static void main(String[] args) {
        System.out.println("=== insertAtHead (O(1)) ===");
        SinglyLinkedList headList = new SinglyLinkedList();
        for (int i = 1; i <= 5; i++) headList.insertAtHead(i);
        headList.traverseAndPrint(); // expect 5 -> 4 -> 3 -> 2 -> 1 (each insert lands in front)

        System.out.println("\\n=== insertAtTailNaive (O(n) each call, no tail pointer) ===");
        SinglyLinkedList naiveTailList = new SinglyLinkedList();
        for (int i = 1; i <= 5; i++) naiveTailList.insertAtTailNaive(i);
        naiveTailList.traverseAndPrint(); // expect 1 -> 2 -> 3 -> 4 -> 5

        System.out.println("\\n=== insertAtTail (O(1) each call, maintained tail pointer) ===");
        SinglyLinkedList tailList = new SinglyLinkedList();
        for (int i = 1; i <= 5; i++) tailList.insertAtTail(i);
        tailList.traverseAndPrint(); // expect 1 -> 2 -> 3 -> 4 -> 5

        System.out.println("\\n=== delete ===");
        System.out.println("Before delete: ");
        tailList.traverseAndPrint();
        System.out.println("delete(3) -> " + tailList.delete(3));
        System.out.println("delete(1) [head] -> " + tailList.delete(1));
        System.out.println("delete(5) [tail] -> " + tailList.delete(5));
        System.out.println("delete(99) [not present] -> " + tailList.delete(99));
        System.out.println("After deletes: ");
        tailList.traverseAndPrint(); // expect [2 -> 4]
        System.out.println("size = " + tailList.size());
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac SinglyLinkedList.java && java SinglyLinkedList — Actual output (JDK 26.0.1)">
{`=== insertAtHead (O(1)) ===
[5 -> 4 -> 3 -> 2 -> 1]

=== insertAtTailNaive (O(n) each call, no tail pointer) ===
[1 -> 2 -> 3 -> 4 -> 5]

=== insertAtTail (O(1) each call, maintained tail pointer) ===
[1 -> 2 -> 3 -> 4 -> 5]

=== delete ===
Before delete:
[1 -> 2 -> 3 -> 4 -> 5]
delete(3) -> true
delete(1) [head] -> true
delete(5) [tail] -> true
delete(99) [not present] -> false
After deletes:
[2 -> 4]
size = 2`}
      </CodeBlock>

      <p>
        Notice <code>insertAtHead</code> is genuinely O(1) with no caveats — it needs exactly one field
        write plus a pointer swap, regardless of how long the list already is. Tail insertion is where the
        design decision lives: <code>insertAtTailNaive</code> walks every existing node just to find the
        last one, so the tenth insert costs 9 hops before it does any real work — O(n) per call.{' '}
        <code>insertAtTail</code> sidesteps that entirely by keeping a <code>tail</code> field that always
        points at the last node, turning the same operation into O(1). The trade-off isn&apos;t free: every
        method that can change what the last node is — inserting at tail, deleting the tail node, deleting
        from an empty list — now has to remember to keep <code>tail</code> in sync, which is exactly the
        bookkeeping you can see in <code>delete()</code> above (<code>if (cur == tail) tail = prev;</code>).
        Forget one of those updates and <code>tail</code> silently goes stale, which is why real
        implementations centralize it carefully rather than leaving it as an afterthought.
      </p>

      <InfoBox variant="tip" title="This Is Exactly Why java.util.LinkedList Keeps Both first and last">
        <p>
          This isn&apos;t a toy simplification — it&apos;s the actual reason <code>java.util.LinkedList</code>{' '}
          maintains both a <code>first</code> and a <code>last</code> field internally (confirmed from its
          real JDK source further down this lesson). Without a maintained tail reference,{' '}
          <code>addLast</code> would be O(n) instead of the O(1) the JDK actually delivers.
        </p>
      </InfoBox>

      <h2>2. Doubly-Linked Lists — Trading a Pointer for O(1) Removal</h2>

      <p>
        Add one field — <code>prev</code> — and every node can now look both directions. That single
        addition changes what&apos;s cheap: if you already hold a direct reference to a node (not just its
        value), you can unlink it in O(1), because the node itself tells you both its predecessor and its
        successor. Compare that to the singly-linked list&apos;s <code>delete(value)</code> above, which had
        to walk from <code>head</code> tracking a <code>prev</code> variable by hand — O(n) — purely because
        a singly-linked node has no way to answer &quot;what comes before me?&quot; on its own.
      </p>

      <CodeBlock language="java" title="DoublyLinkedList.java — prev + next, O(1) Removal Given a Node Reference">
{`/**
 * Doubly-linked list: each node also has a \`prev\` pointer.
 * Demonstrates: O(1) removal given a direct node reference (no scanning needed,
 * because the node itself tells you its predecessor via \`prev\`).
 */
public class DoublyLinkedList {

    static class Node {
        int value;
        Node prev;
        Node next;
        Node(int value) { this.value = value; }
    }

    private Node head;
    private Node tail;
    private int size;

    public int size() { return size; }

    public Node insertAtTail(int value) {
        Node n = new Node(value);
        if (tail == null) {
            head = n;
            tail = n;
        } else {
            n.prev = tail;
            tail.next = n;
            tail = n;
        }
        size++;
        return n; // return the node so callers can hold a direct reference
    }

    // O(1): given the node itself, we already have prev and next — no scan required.
    public void removeNode(Node n) {
        if (n.prev != null) {
            n.prev.next = n.next;
        } else {
            head = n.next; // n was head
        }
        if (n.next != null) {
            n.next.prev = n.prev;
        } else {
            tail = n.prev; // n was tail
        }
        n.prev = null;
        n.next = null;
        size--;
    }

    public void traverseForwardAndPrint() {
        StringBuilder sb = new StringBuilder("[");
        Node cur = head;
        while (cur != null) {
            sb.append(cur.value);
            if (cur.next != null) sb.append(" <-> ");
            cur = cur.next;
        }
        sb.append("]");
        System.out.println(sb);
    }

    public void traverseBackwardAndPrint() {
        StringBuilder sb = new StringBuilder("[");
        Node cur = tail;
        while (cur != null) {
            sb.append(cur.value);
            if (cur.prev != null) sb.append(" <-> ");
            cur = cur.prev;
        }
        sb.append("]");
        System.out.println(sb);
    }

    public static void main(String[] args) {
        DoublyLinkedList dll = new DoublyLinkedList();
        Node n10 = dll.insertAtTail(10);
        Node n20 = dll.insertAtTail(20);
        Node n30 = dll.insertAtTail(30);
        Node n40 = dll.insertAtTail(40);
        Node n50 = dll.insertAtTail(50);

        System.out.println("Forward:  ");
        dll.traverseForwardAndPrint();  // [10 <-> 20 <-> 30 <-> 40 <-> 50]
        System.out.println("Backward: ");
        dll.traverseBackwardAndPrint(); // [50 <-> 40 <-> 30 <-> 20 <-> 10]

        System.out.println("\\nremoveNode(n30) — O(1): we hold n30 directly, no scan needed");
        dll.removeNode(n30);
        dll.traverseForwardAndPrint(); // [10 <-> 20 <-> 40 <-> 50]

        System.out.println("\\nremoveNode(n10) [head] — O(1)");
        dll.removeNode(n10);
        dll.traverseForwardAndPrint(); // [20 <-> 40 <-> 50]

        System.out.println("\\nremoveNode(n50) [tail] — O(1)");
        dll.removeNode(n50);
        dll.traverseForwardAndPrint(); // [20 <-> 40]
        System.out.println("size = " + dll.size());
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac DoublyLinkedList.java && java DoublyLinkedList — Actual output (JDK 26.0.1)">
{`Forward:
[10 <-> 20 <-> 30 <-> 40 <-> 50]
Backward:
[50 <-> 40 <-> 30 <-> 20 <-> 10]

removeNode(n30) — O(1): we hold n30 directly, no scan needed
[10 <-> 20 <-> 40 <-> 50]

removeNode(n10) [head] — O(1)
[20 <-> 40 <-> 50]

removeNode(n50) [tail] — O(1)
[20 <-> 40]
size = 2`}
      </CodeBlock>

      <p>
        <code>removeNode(n30)</code> never touches <code>head</code>, never scans anything — it reads{' '}
        <code>n30.prev</code> and <code>n30.next</code> directly off the node it was handed and re-points
        two pointers. That&apos;s the entire justification for the extra <code>prev</code> field: it&apos;s
        precisely what an LRU cache implementation exploits (a <code>HashMap&lt;Key, Node&gt;</code> gives
        O(1) lookup of the node, and the doubly-linked list gives O(1) removal of that exact node to update
        recency) — a singly-linked list could give you O(1) lookup too, but removal would degrade back to
        O(n) since finding the predecessor still requires a scan from <code>head</code>.
      </p>

      <InfoBox variant="note" title="The Trick Question: Delete a Node Given Only a Reference to It (No Head)">
        <p>
          A classic interview twist: you&apos;re handed a node in a <em>singly</em>-linked list — not the
          head, just that one node — and asked to delete it, with no way to walk from the head to find its
          predecessor. You can&apos;t relink a predecessor you can&apos;t reach. The trick: copy the{' '}
          <em>next</em> node&apos;s value into the current node, then splice the next node out instead. The
          node you were given effectively &quot;becomes&quot; its successor. It fails on exactly one case —
          the given node is the last one, since there&apos;s nothing after it to copy forward.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="DeleteGivenNodeOnly.java — The &quot;No Head Access&quot; Trick">
{`static boolean deleteGivenNode(Node node) {
    if (node == null || node.next == null) {
        return false; // can't do this trick on the tail node
    }
    node.value = node.next.value;
    node.next = node.next.next;
    return true;
}

// n1 -> n2 -> n3 -> n4 -> n5, deleteGivenNode(n3) called holding ONLY n3:
//   n3.value becomes n4.value (4), n3.next becomes n4.next (n5)
//   result: n1 -> n2 -> 4 -> n5, i.e. [1 -> 2 -> 4 -> 5]`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac DeleteGivenNodeOnly.java && java DeleteGivenNodeOnly — Actual output (JDK 26.0.1)">
{`Before: [1 -> 2 -> 3 -> 4 -> 5]
deleteGivenNode(n3) [holding only n3, no head] -> true
After:  [1 -> 2 -> 4 -> 5]
deleteGivenNode(n5) [the tail node] -> false
(false, as expected — nothing to copy forward from)`}
      </CodeBlock>

      <h2>3. The Classic Interview Problem — Cycle Detection</h2>

      <p>
        Ask &quot;how do you detect a cycle in a linked list&quot; in an interview and there are two answers.
        The easy one: walk the list holding a <code>HashSet</code> of every node you&apos;ve visited; if you
        ever see a node twice, there&apos;s a cycle. That works, but it&apos;s O(n) <em>extra</em> memory. The
        answer that actually gets asked for is <strong>Floyd&apos;s Tortoise and Hare</strong>: two pointers,
        <code>slow</code> moving one node per step and <code>fast</code> moving two, no extra memory at all.
      </p>

      <p>
        <strong>Why this works</strong>, not just that it does: think of the gap between <code>fast</code>{' '}
        and <code>slow</code> as a single number that changes every step. Each iteration, <code>slow</code>{' '}
        advances by 1 and <code>fast</code> advances by 2, so <code>fast</code> gains exactly one node on{' '}
        <code>slow</code> per step, relative to it. If the list has no cycle, <code>fast</code> simply runs
        off the end and hits <code>null</code> — there&apos;s nowhere for it to loop back to. But if there{' '}
        <em>is</em> a cycle, once both pointers are inside it, that steady one-node-per-step gain means the
        gap between them shrinks by exactly 1 every iteration, and a strictly-shrinking-by-1 gap inside a
        loop of finite length cannot skip over zero — it must hit exactly 0 within at most the cycle&apos;s
        length in steps. A gap of 0 means <code>slow == fast</code>: the fast pointer has &quot;lapped&quot;
        the slow one, same as a faster runner lapping a slower one on a circular track. That&apos;s the
        entire proof — no cycle means <code>fast</code> reaches <code>null</code>, a cycle means the gap
        must eventually hit zero.
      </p>

      <CodeBlock language="java" title="CycleDetection.java — Floyd's Tortoise and Hare, Against a Real Cycle and a Real Non-Cycle">
{`/**
 * Floyd's Tortoise and Hare — cycle detection in a linked list.
 * Also builds an actual cyclic list (last node points back into the middle)
 * and an actual non-cyclic list, and runs the detector against both.
 */
public class CycleDetection {

    static class Node {
        int value;
        Node next;
        Node(int value) { this.value = value; }
    }

    // slow moves 1 node/step, fast moves 2 nodes/step.
    // If there's no cycle, fast hits null and we return false.
    // If there IS a cycle, fast eventually equals slow again.
    static boolean hasCycle(Node head) {
        Node slow = head;
        Node fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
                return true;
            }
        }
        return false;
    }

    public static void main(String[] args) {
        // Build a list WITH a cycle: 1 -> 2 -> 3 -> 4 -> 5 -> back to 3
        Node a1 = new Node(1);
        Node a2 = new Node(2);
        Node a3 = new Node(3);
        Node a4 = new Node(4);
        Node a5 = new Node(5);
        a1.next = a2;
        a2.next = a3;
        a3.next = a4;
        a4.next = a5;
        a5.next = a3; // <-- cycle: 5 points back to 3, not to null

        System.out.println("Cyclic list (1->2->3->4->5->back to 3): hasCycle = " + hasCycle(a1));

        // Build a list with NO cycle: 1 -> 2 -> 3 -> 4 -> 5 -> null
        Node b1 = new Node(1);
        Node b2 = new Node(2);
        Node b3 = new Node(3);
        Node b4 = new Node(4);
        Node b5 = new Node(5);
        b1.next = b2;
        b2.next = b3;
        b3.next = b4;
        b4.next = b5; // b5.next stays null

        System.out.println("Acyclic list (1->2->3->4->5->null): hasCycle = " + hasCycle(b1));

        // Edge cases
        System.out.println("Empty list (null head): hasCycle = " + hasCycle(null));
        Node single = new Node(42);
        System.out.println("Single node, no self-loop: hasCycle = " + hasCycle(single));
        single.next = single; // self-loop
        System.out.println("Single node, self-loop: hasCycle = " + hasCycle(single));
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac CycleDetection.java && java CycleDetection — Actual output (JDK 26.0.1)">
{`Cyclic list (1->2->3->4->5->back to 3): hasCycle = true
Acyclic list (1->2->3->4->5->null): hasCycle = false
Empty list (null head): hasCycle = false
Single node, no self-loop: hasCycle = false
Single node, self-loop: hasCycle = true`}
      </CodeBlock>

      <p>
        Every case lines up with the reasoning above: the genuinely cyclic list (node 5 wired back to node
        3) reports <code>true</code>; the structurally identical-looking but properly <code>null</code>
        -terminated list reports <code>false</code>; and the edge cases — an empty list, a single node with
        no self-loop, and a single node that points to itself — all resolve exactly as they should. This is{' '}
        <strong>LeetCode 141</strong> (and its harder sibling, 142, which finds where the cycle starts) —
        one of the most-asked linked-list questions there is, precisely because a correct answer requires
        explaining <em>why</em> the two-pointer gap must close, not just reciting the pointer-speed trick.
      </p>

      <h2>4. Reversing a Linked List — Iteratively, O(1) Space</h2>

      <p>
        The other list question that comes up constantly. A recursive solution is a few lines shorter but
        costs O(n) stack frames — one per node, which can blow the stack on a long list. The iterative
        version below uses three pointers (<code>prev</code>, <code>cur</code>, and a temporary to hold{' '}
        <code>cur.next</code> before it gets overwritten) and does the whole reversal in O(n) time with O(1)
        extra space, no matter how long the list is.
      </p>

      <CodeBlock language="java" title="ReverseList.java — Iterative Reversal, Three Pointers, O(1) Space">
{`/**
 * Iteratively reverse a singly-linked list in O(n) time, O(1) extra space —
 * no recursion, no auxiliary list, just re-pointing \`next\` as we walk.
 */
public class ReverseList {

    static class Node {
        int value;
        Node next;
        Node(int value) { this.value = value; }
    }

    static Node reverse(Node head) {
        Node prev = null;
        Node cur = head;
        while (cur != null) {
            Node nextTemp = cur.next; // save before we overwrite it
            cur.next = prev;          // reverse the pointer
            prev = cur;                // advance prev
            cur = nextTemp;             // advance cur
        }
        return prev; // prev is the new head
    }

    static void print(Node head) {
        StringBuilder sb = new StringBuilder("[");
        Node cur = head;
        while (cur != null) {
            sb.append(cur.value);
            if (cur.next != null) sb.append(" -> ");
            cur = cur.next;
        }
        sb.append("]");
        System.out.println(sb);
    }

    static Node build(int... values) {
        Node head = null, tail = null;
        for (int v : values) {
            Node n = new Node(v);
            if (head == null) { head = n; tail = n; }
            else { tail.next = n; tail = n; }
        }
        return head;
    }

    public static void main(String[] args) {
        Node list = build(1, 2, 3, 4, 5);
        System.out.print("Original: ");
        print(list);

        Node reversed = reverse(list);
        System.out.print("Reversed: ");
        print(reversed); // expect [5 -> 4 -> 3 -> 2 -> 1]

        // Round-trip check: reverse it again, should be back to original order
        Node roundTrip = reverse(reversed);
        System.out.print("Reversed again (round-trip): ");
        print(roundTrip); // expect [1 -> 2 -> 3 -> 4 -> 5]

        // Edge cases
        System.out.print("Reverse empty list: ");
        print(reverse(null)); // expect []
        System.out.print("Reverse single-node list: ");
        print(reverse(build(99))); // expect [99]
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac ReverseList.java && java ReverseList — Actual output (JDK 26.0.1)">
{`Original: [1 -> 2 -> 3 -> 4 -> 5]
Reversed: [5 -> 4 -> 3 -> 2 -> 1]
Reversed again (round-trip): [1 -> 2 -> 3 -> 4 -> 5]
Reverse empty list: []
Reverse single-node list: [99]`}
      </CodeBlock>

      <p>
        Reversing twice returns the original order, confirming the operation is its own inverse, and both
        edge cases (empty list, single node) fall out of the loop correctly without any special-casing —
        the <code>while (cur != null)</code> guard alone handles them.
      </p>

      <h2>5. Linked List vs ArrayList — the Honest Comparison</h2>

      <p>
        Neither structure is strictly better — they win at opposite operations, and the numbers below are
        measured, not estimated.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Operation</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>ArrayList (array-backed)</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>LinkedList (doubly-linked)</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Random access <code>get(i)</code></td>
            <td style={{ padding: '0.75rem' }}><strong>O(1)</strong></td>
            <td style={{ padding: '0.75rem' }}>O(n)</td>
            <td style={{ padding: '0.75rem' }}>Array does index arithmetic; linked list must walk from an end</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Insert/remove at head</td>
            <td style={{ padding: '0.75rem' }}>O(n) — shifts every element</td>
            <td style={{ padding: '0.75rem' }}><strong>O(1)</strong></td>
            <td style={{ padding: '0.75rem' }}>Array must slide everything right one slot; linked list just relinks a pointer</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Insert/remove at tail</td>
            <td style={{ padding: '0.75rem' }}>O(1) amortized</td>
            <td style={{ padding: '0.75rem' }}>O(1) (with a maintained tail pointer)</td>
            <td style={{ padding: '0.75rem' }}>Both are O(1) here — ArrayList&apos;s doubling strategy amortizes resize cost</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Remove given a direct reference/iterator to the node</td>
            <td style={{ padding: '0.75rem' }}>O(n) — still shifts</td>
            <td style={{ padding: '0.75rem' }}><strong>O(1)</strong></td>
            <td style={{ padding: '0.75rem' }}>See Section 2 — no scan needed once you already hold the node</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Cache locality</td>
            <td style={{ padding: '0.75rem' }}><strong>Excellent</strong> — contiguous memory</td>
            <td style={{ padding: '0.75rem' }}>Poor — nodes scattered across the heap</td>
            <td style={{ padding: '0.75rem' }}>Sequential array reads hit the CPU cache; pointer-chasing mostly doesn&apos;t</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Memory per element (measured, see below)</td>
            <td style={{ padding: '0.75rem' }}><strong>~20 bytes/element</strong></td>
            <td style={{ padding: '0.75rem' }}>~40 bytes/element</td>
            <td style={{ padding: '0.75rem' }}>Every LinkedList element pays for a whole Node object (header + 2 pointers) on top of the boxed value</td>
          </tr>
        </tbody>
      </table>

      <p>
        The head-insertion row is the one worth actually measuring rather than trusting on faith. Below,{' '}
        <code>ArrayList.add(0, x)</code> is timed against <code>LinkedList.addFirst(x)</code> at increasing{' '}
        <code>n</code>, after a JIT warmup run so the JIT has already compiled both hot loops before the
        clock starts:
      </p>

      <CodeBlock language="java" title="HeadInsertBenchmark.java — ArrayList.add(0,x) vs LinkedList.addFirst(x), Timed">
{`import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;

/**
 * Real timing comparison: inserting at index 0 repeatedly.
 *   ArrayList.add(0, x)  -> must shift every existing element right by one: O(n) per call
 *   LinkedList.addFirst(x) -> just relinks the head node: O(1) per call
 * Verifies:
 *   - java.util.LinkedList implements both List and Deque
 */
public class HeadInsertBenchmark {

    static long timeArrayListHeadInsert(int n) {
        List<Integer> list = new ArrayList<>();
        long start = System.nanoTime();
        for (int i = 0; i < n; i++) {
            list.add(0, i); // shifts all current elements right
        }
        long end = System.nanoTime();
        return (end - start) / 1_000; // microseconds
    }

    static long timeLinkedListHeadInsert(int n) {
        LinkedList<Integer> list = new LinkedList<>();
        long start = System.nanoTime();
        for (int i = 0; i < n; i++) {
            list.addFirst(i); // O(1) relink
        }
        long end = System.nanoTime();
        return (end - start) / 1_000; // microseconds
    }

    public static void main(String[] args) {
        // Confirm java.util.LinkedList's dual interface implementation
        LinkedList<Integer> ll = new LinkedList<>();
        System.out.println("java.util.LinkedList instanceof List: " + (ll instanceof List));
        System.out.println("java.util.LinkedList instanceof Deque: " + (ll instanceof Deque));
        Class<?> llClass = LinkedList.class;
        System.out.print("Declared interfaces on java.util.LinkedList: ");
        for (Class<?> iface : llClass.getInterfaces()) {
            System.out.print(iface.getSimpleName() + " ");
        }
        System.out.println();

        System.out.println();
        System.out.println("Warmup (JIT) runs, discarded...");
        timeArrayListHeadInsert(20_000);
        timeLinkedListHeadInsert(20_000);

        int[] sizes = {20_000, 50_000, 100_000, 200_000};
        System.out.println();
        System.out.printf("%-10s %-26s %-26s%n", "n", "ArrayList.add(0,x) us", "LinkedList.addFirst us");
        for (int n : sizes) {
            long alTime = timeArrayListHeadInsert(n);
            long llTime = timeLinkedListHeadInsert(n);
            System.out.printf("%-10d %-26d %-26d%n", n, alTime, llTime);
        }
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac HeadInsertBenchmark.java && java HeadInsertBenchmark — Actual output (JDK 26.0.1)">
{`java.util.LinkedList instanceof List: true
java.util.LinkedList instanceof Deque: true
Declared interfaces on java.util.LinkedList: List Deque Cloneable Serializable

Warmup (JIT) runs, discarded...

n          ArrayList.add(0,x) us      LinkedList.addFirst us
20000      11348                      570
50000      80041                      883
100000     347821                     1381
200000     1389900                    2639                      `}
      </CodeBlock>

      <p>
        That&apos;s the O(n)-per-call cost showing up exactly as predicted: doubling <code>n</code> from
        100,000 to 200,000 roughly <em>quadruples</em> <code>ArrayList.add(0, x)</code>&apos;s total time
        (347,821μs → 1,389,900μs), because each of the twice-as-many inserts also has to shift a list that&apos;s
        twice as long — that&apos;s O(n) work done O(n) times, i.e. O(n²) total. <code>LinkedList.addFirst</code>{' '}
        barely moves (570μs → 2,639μs, roughly linear with <code>n</code>, as expected for O(1) work done{' '}
        <code>n</code> times). By 200,000 head-inserts, <code>ArrayList</code> is over <strong>500× slower</strong>{' '}
        than <code>LinkedList</code> for this specific access pattern — and this was run twice for
        consistency, with the same shape both times.
      </p>

      <p>
        The memory row is a real measurement too, not a guessed byte count — <code>Runtime.totalMemory()
        </code> minus <code>freeMemory()</code>, before and after populating each list with one million{' '}
        <code>Integer</code>s, forcing a GC in between:
      </p>

      <CodeBlock language="text" title="$ java -Xmx2g MemoryOverhead — Actual output (JDK 26.0.1, approximate via Runtime, not a profiler)">
{`n = 1000000 Integer elements in each list
ArrayList<Integer>  approx heap used: 20563936 bytes (20 bytes/element avg)
LinkedList<Integer> approx heap used: 40530384 bytes (40 bytes/element avg)
sizes: 1000000 / 1000000`}
      </CodeBlock>

      <p>
        Roughly 2× the memory per element, which lines up with the node structure itself: an{' '}
        <code>ArrayList</code> slot is one reference into the backing array pointing at the shared boxed{' '}
        <code>Integer</code>; a <code>LinkedList</code> element pays for that same boxed{' '}
        <code>Integer</code> <em>plus</em> an entire <code>Node</code> object — its own object header and
        two reference fields (<code>next</code>, <code>prev</code>) — just to hold the pointers that make
        O(1) insertion possible. This was measured with <code>Runtime</code>, not a proper allocation
        profiler, so treat it as an order-of-magnitude figure rather than a precise byte count — but it
        reproduced consistently (~20 vs ~40 bytes/element) across repeated runs.
      </p>

      <p>
        And <code>java.util.LinkedList</code> really is doubly-linked — not an implementation detail you
        have to take on faith, here&apos;s its actual node class and class declaration straight from the
        JDK 26 source (<code>java.base/java/util/LinkedList.java</code>, extracted from <code>src.zip</code>{' '}
        in this JDK install):
      </p>

      <CodeBlock language="java" title="java.util.LinkedList — Real JDK 26 Source, Unmodified">
{`public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
{
    // ...

    private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;

        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }
}`}
      </CodeBlock>

      <p>
        <code>prev</code>, <code>item</code>, <code>next</code> — the exact same shape as the{' '}
        <code>DoublyLinkedList</code> built by hand in Section 2. And the class declaration confirms the
        other half of the claim: <code>implements List&lt;E&gt;, Deque&lt;E&gt;</code>, which is exactly
        what the <code>instanceof</code> checks in the benchmark output above verified at runtime —{' '}
        <code>java.util.LinkedList</code> is simultaneously a general-purpose <code>List</code> and a{' '}
        double-ended queue.
      </p>

      <InfoBox variant="warning" title="So Which One Should You Actually Reach For?">
        <p>
          Despite everything above, <strong><code>ArrayList</code> is the right default</strong> for most
          code, and this isn&apos;t a contradiction of the numbers — it&apos;s what they actually imply.
          Most real workloads read far more than they insert-at-head, and <code>ArrayList</code>&apos;s O(1)
          random access plus better cache locality and lower memory overhead win in that common case.
          Reach for <code>LinkedList</code> specifically when the access pattern is genuinely
          head/tail-heavy or removal-via-iterator-heavy — a work queue, a deque, an LRU cache&apos;s
          eviction list — not as a general-purpose default. In modern Java, that usually means{' '}
          <code>ArrayDeque</code> even more than <code>LinkedList</code>; the next lesson covers exactly
          why.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"Floyd's Tortoise and Hare uses a slow pointer (1 step) and a fast pointer (2 steps). Why does this guarantee detecting a cycle, rather than the fast pointer just skipping past the slow one forever?"}
        options={[
          "It doesn't actually guarantee detection — it only works for small lists",
          "The fast pointer gains exactly one node on the slow pointer per step, so once both are inside the cycle, the gap between them shrinks by 1 every iteration and must hit exactly zero — it can't jump over zero",
          "The algorithm relies on the JVM garbage collector to detect the cycle first",
          "It works because the fast pointer always visits every node before the slow pointer does"
        ]}
        correctIndex={1}
        explanation={"The relative speed between the two pointers is constant: fast always closes the gap by exactly one node per step. Outside a cycle that's irrelevant because fast just runs off the end to null. Inside a cycle, a gap that shrinks by exactly 1 each step, within a loop of finite length, cannot skip over 0 — it must land on 0 within at most one full loop of steps, which is the moment slow == fast. That's a mathematical guarantee, not a heuristic, which is why the algorithm needs no extra memory to work correctly."}
      />
    </LessonLayout>
  );
}
