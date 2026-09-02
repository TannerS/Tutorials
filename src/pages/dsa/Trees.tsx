import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function Trees() {
  return (
    <LessonLayout
      title="Trees & Binary Search Trees"
      sectionId="dsa"
      lessonIndex={5}
      prev={{ path: '/dsa/recursion-backtracking', label: 'Recursion & Backtracking' }}
      next={{ path: '/dsa/heaps', label: 'Heaps & Priority Queues, From Scratch' }}
    >
      <p>
        A tree is a hierarchy: one <strong>root</strong> node, and every other node reachable from it
        through exactly one path. A node with no children is a <strong>leaf</strong>. The
        <strong> height</strong> of a tree is the number of edges on the longest path from root down to
        a leaf. A <strong>binary tree</strong> restricts every node to at most two children, conventionally
        called <code>left</code> and <code>right</code>. Every array, list, or graph structure covered so
        far in this section has been linear — one thing after another. A tree is the first branching
        structure, and that branching is exactly what makes it powerful: a well-shaped binary tree turns an
        O(n) linear scan into an O(log n) search. The catch — and it is the entire point of this lesson —
        is that &quot;well-shaped&quot; is not automatic. It has to be earned, or proven.
      </p>

      <h2>The Node, and the Tree Everything Below Uses</h2>

      <p>
        A binary tree node is barely more than a struct: a value, and two references to other nodes (or{' '}
        <code>null</code>). Every example in this lesson — traversals, BST operations, the timing
        benchmark — runs against the exact same seven-node tree, built once here:
      </p>

      <FlowChart
        title="The Sample BST Used In Every Demo Below"
        chart={"graph TD\n  N50((50)) --> N30((30))\n  N50 --> N70((70))\n  N30 --> N20((20))\n  N30 --> N40((40))\n  N70 --> N60((60))\n  N70 --> N80((80))"}
      />

      <p>
        Note it already obeys the BST invariant covered in the next section: at every node, the left
        subtree is all smaller values and the right subtree is all larger values. That is not a coincidence
        — it is built with <code>insert()</code>, and insert is what maintains that property.
      </p>

      <h2>Traversal Order: Same Tree, Four Genuinely Different Sequences</h2>

      <p>
        &quot;Traverse the tree&quot; is not one operation — the order you visit the root relative to its
        children produces a different sequence every time, and each order exists because it solves a
        different real problem. The three depth-first orders differ only in <em>when</em> the current
        node is visited relative to its two recursive calls:
      </p>

      <CodeBlock language="java" title="TraversalDemo.java — Node + Three Recursive DFS Orders + One BFS Order">
{`import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class TraversalDemo {

    static class Node {
        int value;
        Node left, right;
        Node(int value) { this.value = value; }
    }

    // Build the fixed example tree:
    //            50
    //          /    \\
    //        30      70
    //       /  \\    /  \\
    //      20  40  60  80
    static Node buildSampleTree() {
        Node root = new Node(50);
        root.left = new Node(30);
        root.right = new Node(70);
        root.left.left = new Node(20);
        root.left.right = new Node(40);
        root.right.left = new Node(60);
        root.right.right = new Node(80);
        return root;
    }

    static void inOrder(Node node, List<Integer> out) {
        if (node == null) return;
        inOrder(node.left, out);   // 1. left subtree
        out.add(node.value);       // 2. this node
        inOrder(node.right, out);  // 3. right subtree
    }

    static void preOrder(Node node, List<Integer> out) {
        if (node == null) return;
        out.add(node.value);        // 1. this node
        preOrder(node.left, out);   // 2. left subtree
        preOrder(node.right, out);  // 3. right subtree
    }

    static void postOrder(Node node, List<Integer> out) {
        if (node == null) return;
        postOrder(node.left, out);   // 1. left subtree
        postOrder(node.right, out);  // 2. right subtree
        out.add(node.value);         // 3. this node
    }

    // Level-order (breadth-first): a real java.util.Queue, not recursion.
    static List<Integer> levelOrder(Node root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Queue<Node> queue = new ArrayDeque<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            Node current = queue.poll();
            out.add(current.value);
            if (current.left != null) queue.add(current.left);
            if (current.right != null) queue.add(current.right);
        }
        return out;
    }

    public static void main(String[] args) {
        Node root = buildSampleTree();

        List<Integer> in = new ArrayList<>();
        inOrder(root, in);
        System.out.println("In-order   (L, Root, R): " + in);

        List<Integer> pre = new ArrayList<>();
        preOrder(root, pre);
        System.out.println("Pre-order  (Root, L, R): " + pre);

        List<Integer> post = new ArrayList<>();
        postOrder(root, post);
        System.out.println("Post-order (L, R, Root): " + post);

        List<Integer> level = levelOrder(root);
        System.out.println("Level-order (BFS, Queue): " + level);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real Output — javac 26.0.1 + java, compiled and run">
{`$ javac TraversalDemo.java && java TraversalDemo
In-order   (L, Root, R): [20, 30, 40, 50, 60, 70, 80]
Pre-order  (Root, L, R): [50, 30, 20, 40, 70, 60, 80]
Post-order (L, R, Root): [20, 40, 30, 60, 80, 70, 50]
Level-order (BFS, Queue): [50, 30, 70, 20, 40, 60, 80]`}
      </CodeBlock>

      <p>
        Same seven nodes, four genuinely different sequences — this is not an abstract distinction, it is
        four different lists of integers, produced by moving three lines of code around. Each one has a job:
      </p>

      <InfoBox variant="info" title="Which Order, and Why">
        <p>
          <strong>In-order</strong> — on a BST specifically, this always yields values in sorted order
          (see the <code>[20, 30, 40, 50, 60, 70, 80]</code> above). It is the standard way to &quot;dump a
          BST sorted&quot; without a separate sort step.
        </p>
        <p>
          <strong>Pre-order</strong> — visits the root before its children, so it is the natural order for{' '}
          <em>serializing</em> a tree (write it out, then rebuild an identical tree by re-inserting in that
          same order) or for copying a tree top-down.
        </p>
        <p>
          <strong>Post-order</strong> — visits children before the parent, so it is the order used to{' '}
          <em>delete</em> or free a tree bottom-up: you never free a node before both its children are
          already gone.
        </p>
        <p>
          <strong>Level-order (BFS)</strong> — visits the tree rank by rank using a queue instead of the
          call stack. It is what you reach for when &quot;distance from the root&quot; matters — printing a
          tree level by level, or finding the shortest path in an unweighted tree.
        </p>
      </InfoBox>

      <h2>The Binary Search Tree Invariant, Precisely</h2>

      <p>
        A binary search tree is a binary tree with one additional rule enforced at{' '}
        <strong>every single node</strong>, not just the root: everything in that node&apos;s left subtree
        is smaller than it, and everything in that node&apos;s right subtree is larger than it. Applied
        recursively at every node, that rule is what makes an in-order traversal come out sorted, and it is
        what makes binary search possible at all — at each node you can discard an entire subtree without
        looking inside it.
      </p>

      <InfoBox variant="note" title="The Invariant, Stated Exactly">
        <p>
          For every node <code>N</code> in the tree: every value in <code>N.left</code>&apos;s subtree is
          smaller than <code>N.value</code>, and every value in <code>N.right</code>&apos;s subtree is
          larger than <code>N.value</code>. It is not enough for a node to be bigger than its immediate
          left child — the <em>entire</em> left subtree, all the way down, has to be smaller. A tree that
          violates this anywhere is not a BST, even if it looks like one at a glance.
        </p>
      </InfoBox>

      <p>
        Insert and search follow directly from the invariant: at each node, compare the target to the
        current value and go left or right, exactly like a decision tree. Delete is where the real work is
        — removing a node has to preserve the invariant for everything left behind, and there are three
        distinct cases depending on how many children the deleted node has:
      </p>

      <CodeBlock language="java" title="BSTDemo.java — insert / search / delete, all three delete cases">
{`import java.util.ArrayList;
import java.util.List;

public class BSTDemo {

    static class Node {
        int value;
        Node left, right;
        Node(int value) { this.value = value; }
    }

    static Node insert(Node node, int value) {
        if (node == null) return new Node(value);
        if (value < node.value) node.left = insert(node.left, value);
        else if (value > node.value) node.right = insert(node.right, value);
        // duplicates ignored
        return node;
    }

    static boolean search(Node node, int value) {
        if (node == null) return false;
        if (value == node.value) return true;
        return value < node.value ? search(node.left, value) : search(node.right, value);
    }

    // Smallest value in a subtree — the in-order successor's location.
    static int findMin(Node node) {
        while (node.left != null) node = node.left;
        return node.value;
    }

    static Node delete(Node node, int value) {
        if (node == null) return null;
        if (value < node.value) {
            node.left = delete(node.left, value);
        } else if (value > node.value) {
            node.right = delete(node.right, value);
        } else {
            // Found the node to delete.
            if (node.left == null && node.right == null) {
                return null;                 // Case 1: leaf — just remove it.
            }
            if (node.left == null) {
                return node.right;           // Case 2: only a right child.
            }
            if (node.right == null) {
                return node.left;            // Case 2: only a left child.
            }
            // Case 3: two children. Replace this node's value with its
            // in-order successor (smallest value in the right subtree),
            // then delete that successor from the right subtree. The
            // successor can never have a left child, so that recursive
            // delete always lands back in case 1 or case 2.
            int successorValue = findMin(node.right);
            node.value = successorValue;
            node.right = delete(node.right, successorValue);
        }
        return node;
    }

    static void inOrder(Node node, List<Integer> out) {
        if (node == null) return;
        inOrder(node.left, out);
        out.add(node.value);
        inOrder(node.right, out);
    }

    static boolean isSorted(List<Integer> list) {
        for (int i = 1; i < list.size(); i++) {
            if (list.get(i - 1) > list.get(i)) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        Node root = null;
        for (int v : new int[]{50, 30, 70, 20, 40, 60, 80}) {
            root = insert(root, v);
        }

        List<Integer> initial = new ArrayList<>();
        inOrder(root, initial);
        System.out.println("Initial in-order: " + initial);
        System.out.println("search(40): " + search(root, 40));
        System.out.println("search(99): " + search(root, 99));

        // Case 1: delete a leaf (20 has no children).
        root = delete(root, 20);
        List<Integer> afterLeaf = new ArrayList<>();
        inOrder(root, afterLeaf);
        System.out.println();
        System.out.println("After deleting leaf 20: " + afterLeaf + " | sorted=" + isSorted(afterLeaf));

        // Case 3: delete a two-child node. 70's children are 60 and 80;
        // its in-order successor is min(right subtree) = 80.
        root = delete(root, 70);
        List<Integer> afterTwoChild = new ArrayList<>();
        inOrder(root, afterTwoChild);
        System.out.println("After deleting two-child node 70: " + afterTwoChild
                + " | sorted=" + isSorted(afterTwoChild));
        System.out.println("search(70) after deletion (should be false): " + search(root, 70));
        System.out.println("search(80) after deletion (successor promoted): " + search(root, 80));

        // Case 2: delete a one-child node. 30's only remaining child is 40
        // (20 was already removed above).
        root = delete(root, 30);
        List<Integer> afterOneChild = new ArrayList<>();
        inOrder(root, afterOneChild);
        System.out.println("After deleting one-child node 30: " + afterOneChild
                + " | sorted=" + isSorted(afterOneChild));

        // Two-child deletion again, this time AT THE ROOT itself.
        root = delete(root, 50);
        List<Integer> afterRoot = new ArrayList<>();
        inOrder(root, afterRoot);
        System.out.println();
        System.out.println("After deleting two-child ROOT 50: " + afterRoot
                + " | sorted=" + isSorted(afterRoot));
        System.out.println("New root value: " + root.value);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real Output — javac 26.0.1 + java, compiled and run">
{`$ javac BSTDemo.java && java BSTDemo
Initial in-order: [20, 30, 40, 50, 60, 70, 80]
search(40): true
search(99): false

After deleting leaf 20: [30, 40, 50, 60, 70, 80] | sorted=true
After deleting two-child node 70: [30, 40, 50, 60, 80] | sorted=true
search(70) after deletion (should be false): false
search(80) after deletion (successor promoted): true
After deleting one-child node 30: [40, 50, 60, 80] | sorted=true

After deleting two-child ROOT 50: [40, 60, 80] | sorted=true
New root value: 60`}
      </CodeBlock>

      <p>
        The line that matters most there is the two-child case: deleting <code>70</code> (children{' '}
        <code>60</code> and <code>80</code>) leaves <code>[30, 40, 50, 60, 80]</code>, still perfectly
        sorted — <code>70</code>&apos;s in-order successor, <code>80</code>, moved up to take its place, and
        a follow-up <code>search(70)</code> correctly returns <code>false</code> while{' '}
        <code>80</code> is still findable. The same case is exercised again at the very end, deleting the
        root itself (<code>50</code>, with two children) and confirming the tree that is left behind — new
        root <code>60</code> — is still sorted in-order. That is not asserted from memory; it is the actual
        printed output of the code above, and <code>isSorted()</code> checked it programmatically after
        every single deletion.
      </p>

      <h2>The Part That Actually Matters: An Unbalanced BST Is O(n)</h2>

      <p>
        Every complexity claim made above — O(log n) search, insert, delete — has an unstated assumption
        baked into it: that the tree is roughly balanced, meaning its height is close to log₂(n). Nothing in
        the <code>insert()</code> code above enforces that. Insert simply walks left or right and attaches
        the new node wherever the invariant says it belongs. If the data arrives already sorted, every new
        value is larger than everything inserted so far, so every single insert attaches to the far right —
        the tree degenerates into what is structurally a linked list, just wearing a <code>Node</code> class
        with an unused <code>left</code> field. Search on a linked list is O(n). This is not a rare edge
        case; sorted or nearly-sorted input is common in real systems (timestamps, auto-increment IDs,
        already-sorted imports).
      </p>

      <p>
        This is provable, not just assertable — build the same 10,000 values into two BSTs, one inserted in
        sorted order and one inserted in random order, and time a search against each:
      </p>

      <CodeBlock language="java" title="DegradationDemo.java — sorted insert vs. random insert, same 10,000 values">
{`import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Queue;
import java.util.Random;

public class DegradationDemo {

    static class Node {
        int value;
        Node left, right;
        Node(int value) { this.value = value; }
    }

    // Iterative, not recursive: a sorted-order insert of 10,000 values makes
    // a tree 10,000 levels deep, and a recursive insert/search would blow the
    // call stack on exactly the case this demo needs to run.
    static Node insert(Node root, int value) {
        Node newNode = new Node(value);
        if (root == null) return newNode;
        Node cur = root;
        while (true) {
            if (value < cur.value) {
                if (cur.left == null) { cur.left = newNode; return root; }
                cur = cur.left;
            } else if (value > cur.value) {
                if (cur.right == null) { cur.right = newNode; return root; }
                cur = cur.right;
            } else {
                return root; // duplicate
            }
        }
    }

    static boolean search(Node root, int value) {
        Node cur = root;
        while (cur != null) {
            if (value == cur.value) return true;
            cur = value < cur.value ? cur.left : cur.right;
        }
        return false;
    }

    static int height(Node root) { // iterative BFS, same reasoning as insert()
        if (root == null) return 0;
        int h = 0;
        Queue<Node> queue = new ArrayDeque<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            h++;
            for (int i = 0; i < levelSize; i++) {
                Node cur = queue.poll();
                if (cur.left != null) queue.add(cur.left);
                if (cur.right != null) queue.add(cur.right);
            }
        }
        return h;
    }

    public static void main(String[] args) {
        int n = 10_000;

        Node sortedRoot = null;
        for (int i = 1; i <= n; i++) sortedRoot = insert(sortedRoot, i);

        List<Integer> shuffled = new ArrayList<>();
        for (int i = 1; i <= n; i++) shuffled.add(i);
        Collections.shuffle(shuffled, new Random(42)); // fixed seed, reproducible
        Node randomRoot = null;
        for (int v : shuffled) randomRoot = insert(randomRoot, v);

        System.out.println("n = " + n + " nodes in both trees");
        System.out.println("Sorted-insert tree height: " + height(sortedRoot));
        System.out.println("Random-insert tree height: " + height(randomRoot));
        System.out.println();

        int target = 9_999;      // near the bottom of the sorted chain
        int trials = 200_000;

        for (int i = 0; i < 20_000; i++) { // JIT warmup, both sides equally
            search(sortedRoot, target);
            search(randomRoot, target);
        }

        long sortedStart = System.nanoTime();
        for (int i = 0; i < trials; i++) search(sortedRoot, target);
        long sortedElapsed = System.nanoTime() - sortedStart;

        long randomStart = System.nanoTime();
        for (int i = 0; i < trials; i++) search(randomRoot, target);
        long randomElapsed = System.nanoTime() - randomStart;

        double sortedAvgNs = (double) sortedElapsed / trials;
        double randomAvgNs = (double) randomElapsed / trials;

        System.out.println("Searching for " + target + ", " + trials + " times each (post-warmup):");
        System.out.printf("  Sorted-insert BST:  total %d ms, avg %.1f ns/search%n",
                sortedElapsed / 1_000_000, sortedAvgNs);
        System.out.printf("  Random-insert BST:  total %d ms, avg %.1f ns/search%n",
                randomElapsed / 1_000_000, randomAvgNs);
        System.out.printf("  Sorted-tree search is %.1fx SLOWER%n", sortedAvgNs / randomAvgNs);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real Output — javac 26.0.1 + java, compiled and run (JDK 26.0.1, Apple Silicon)">
{`$ javac DegradationDemo.java && java DegradationDemo
n = 10000 nodes in both trees
Sorted-insert tree height: 10000
Random-insert tree height: 30

Searching for 9999, 200000 times each (post-warmup):
  Sorted-insert BST:  total 2403 ms, avg 12017.6 ns/search
  Random-insert BST:  total 1 ms, avg 9.6 ns/search
  Sorted-tree search is 1255.0x SLOWER`}
      </CodeBlock>

      <p>
        Both trees hold the exact same 10,000 integers. The sorted-insert tree has height{' '}
        <strong>10,000</strong> — every node has exactly one child, confirming it degenerated into a
        straight chain, since a perfectly degenerate binary &quot;tree&quot; of n nodes has height exactly
        n. The random-insert tree has height <strong>30</strong>, close to the theoretical ideal of{' '}
        ⌈log₂(10000)⌉&nbsp;=&nbsp;14 for a perfectly balanced tree (random insertion order does not produce
        a perfectly balanced tree, but it stays close — the expected height of a randomly-built BST is
        O(log n), not O(n)). Searching the sorted tree for a value near the bottom of the chain took over{' '}
        <strong>1,255 times</strong> longer per search than the identical search against the randomly-built
        tree, averaged over 200,000 trials with a JIT warmup applied equally to both. Repeating the run
        produces the same shape of result every time (heights identical since the shuffle seed is fixed;
        the timing ratio varies run to run but consistently lands in the 1,200x&ndash;1,500x range on this
        machine) — this is not a fluke, it is the O(n) vs. O(log n) gap showing up as a stopwatch number
        instead of an abstract exponent.
      </p>

      <InfoBox variant="danger" title="Unbalanced Is Not a Theoretical Concern">
        <p>
          &quot;BST search is O(log n)&quot; is true only for a balanced tree. A plain BST, built with the{' '}
          <code>insert()</code> shown above, gives you <strong>no such guarantee</strong> — it is only as
          balanced as the order the data happened to arrive in. Feed it sorted or nearly-sorted input
          (timestamps, auto-increment IDs, an already-sorted CSV import) and you silently get a linked list
          with extra bookkeeping, and O(n) operations everywhere the code assumes O(log n). This is the
          single most commonly glossed-over fact about BSTs, and the numbers above are why it matters: a{' '}
          1,255x slowdown on a 10,000-element structure is not a rounding error, it is the difference
          between a snappy lookup and a page that hangs.
        </p>
      </InfoBox>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Operation</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Balanced BST</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Unbalanced BST (worst case)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Search</td>
            <td style={{ padding: '0.75rem' }}>O(log n)</td>
            <td style={{ padding: '0.75rem' }}>O(n)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Insert</td>
            <td style={{ padding: '0.75rem' }}>O(log n)</td>
            <td style={{ padding: '0.75rem' }}>O(n)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Delete</td>
            <td style={{ padding: '0.75rem' }}>O(log n)</td>
            <td style={{ padding: '0.75rem' }}>O(n)</td>
          </tr>
        </tbody>
      </table>

      <h2>Self-Balancing Trees: AVL and Red-Black</h2>

      <p>
        The fix for the degradation above is to make the tree rebalance itself after every insert and
        delete, instead of trusting insertion order to be kind. Two classic designs do this differently:
      </p>

      <InfoBox variant="info" title="AVL vs. Red-Black — Same Goal, Different Trade-off">
        <p>
          <strong>AVL trees</strong> (Adelson-Velsky and Landis, 1962) enforce a strict rule at every node:
          the heights of its left and right subtrees may differ by at most 1. Any insert or delete that
          would violate this triggers <strong>rotations</strong> — local restructurings that restore the
          height balance in O(log n) time. Because the balance constraint is tight, AVL trees stay very
          close to the theoretical minimum height, which makes them slightly faster for lookup-heavy
          workloads, at the cost of doing more rotation work on every insert/delete.
        </p>
        <p>
          <strong>Red-Black trees</strong> (Bayer, 1972, under a different name; formalized later) enforce a
          looser rule via a color bit (red or black) on every node and a set of coloring invariants — no two
          red nodes in a row, every root-to-leaf path passes through the same number of black nodes — that
          together guarantee height never exceeds roughly 2&nbsp;&times;&nbsp;log₂(n). That looser balance
          means fewer rotations are needed on average during insert and delete, which is why Red-Black trees
          are the more common choice in language runtimes and standard libraries where insert/delete
          frequency matters as much as lookup speed.
        </p>
      </InfoBox>

      <p>
        Full rotation logic for either structure is a lesson of its own — the fact worth carrying forward
        from here is narrower and more useful day to day: <strong>you are almost certainly already using a
        Red-Black tree without writing any rotation code</strong>, because Java&apos;s own sorted collections
        are built on one.
      </p>

      <InfoBox variant="tip" title="Verified From JDK 26 Source (not assumed): TreeMap Is a Red-Black Tree">
        <p>
          This was checked directly against the JDK 26 source shipped in <code>lib/src.zip</code>, not
          recalled from memory. <code>java.base/java/util/TreeMap.java</code>&apos;s class-level Javadoc
          states, verbatim: <em>&quot;A Red-Black tree based NavigableMap implementation.&quot;</em> The
          source backs that up structurally, not just in a comment — it defines{' '}
          <code>private static final boolean RED = false</code> and{' '}
          <code>private static final boolean BLACK = true</code>, gives each internal{' '}
          <code>Entry&lt;K,V&gt;</code> a color field, and implements private{' '}
          <code>rotateLeft</code> / <code>rotateRight</code> methods invoked from{' '}
          <code>fixAfterInsertion</code> and <code>fixAfterDeletion</code> — this is the standard
          CLRS-style Red-Black tree rebalancing algorithm, referenced by name in the same Javadoc (
          <em>&quot;Algorithms are adaptations of those in Cormen, Leiserson, and Rivest&apos;s Introduction
          to Algorithms&quot;</em>). <code>TreeSet</code>&apos;s own Javadoc adds: <em>&quot;A NavigableSet
          implementation based on a TreeMap&quot;</em> — and its source field is literally{' '}
          <code>private transient NavigableMap&lt;E,Object&gt; m</code>. So <code>TreeSet</code> is not a
          second tree implementation; it is a <code>TreeMap</code> underneath, storing your elements as keys
          against a shared dummy value.
        </p>
      </InfoBox>

      <p>
        That backing structure is exactly what unlocks operations a <code>HashMap</code> cannot offer, since
        those operations require the keys to be stored in sorted order — a hash table has no such order to
        exploit:
      </p>

      <CodeBlock language="java" title="TreeMapDemo.java — floorKey / ceilingKey / firstKey / lastKey, for real">
{`import java.util.NavigableMap;
import java.util.TreeMap;

public class TreeMapDemo {
    public static void main(String[] args) {
        TreeMap<Integer, String> scores = new TreeMap<>();
        scores.put(72, "Chen");
        scores.put(95, "Okafor");
        scores.put(60, "Alvarez");
        scores.put(88, "Singh");
        scores.put(100, "Nakamura");
        scores.put(45, "Rossi");

        System.out.println("TreeMap contents (always sorted by key, no sort step needed): " + scores);

        System.out.println("firstKey()  = " + scores.firstKey() + " (" + scores.firstEntry().getValue() + ")");
        System.out.println("lastKey()   = " + scores.lastKey() + " (" + scores.lastEntry().getValue() + ")");

        int probe = 90;
        System.out.println();
        System.out.println("Probing around key " + probe + " (not present in the map):");
        System.out.println("floorKey(" + probe + ")   = " + scores.floorKey(probe) + "  (largest key <= " + probe + ")");
        System.out.println("ceilingKey(" + probe + ") = " + scores.ceilingKey(probe) + "  (smallest key >= " + probe + ")");
        System.out.println("lowerKey(" + probe + ")   = " + scores.lowerKey(probe) + "  (largest key < " + probe + ")");
        System.out.println("higherKey(" + probe + ")  = " + scores.higherKey(probe) + "  (smallest key > " + probe + ")");

        NavigableMap<Integer, String> honorRoll = scores.tailMap(88, true);
        System.out.println();
        System.out.println("tailMap(88, inclusive) — everyone scoring 88 or above: " + honorRoll);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real Output — javac 26.0.1 + java, compiled and run">
{`$ javac TreeMapDemo.java && java TreeMapDemo
TreeMap contents (always sorted by key, no sort step needed): {45=Rossi, 60=Alvarez, 72=Chen, 88=Singh, 95=Okafor, 100=Nakamura}
firstKey()  = 45 (Rossi)
lastKey()   = 100 (Nakamura)

Probing around key 90 (not present in the map):
floorKey(90)   = 88  (largest key <= 90)
ceilingKey(90) = 95  (smallest key >= 90)
lowerKey(90)   = 88  (largest key < 90)
higherKey(90)  = 95  (smallest key > 90)

tailMap(88, inclusive) — everyone scoring 88 or above: {88=Singh, 95=Okafor, 100=Nakamura}`}
      </CodeBlock>

      <p>
        Notice the map printed in sorted key order with no explicit sort call anywhere in the program — that
        is the in-order traversal of the underlying Red-Black tree, happening for free every time{' '}
        <code>toString()</code> or an iterator walks it. <code>floorKey(90)</code> and{' '}
        <code>ceilingKey(90)</code> answer &quot;nearest key below/above 90&quot; even though 90 is not a
        key in the map at all — that is a real tree walk down toward where 90 would belong, and it has no
        equivalent on a <code>HashMap</code>, which has no concept of &quot;near&quot; a key because it has
        no ordering to begin with.
      </p>

      <p>
        That is the practical &quot;when to use which&quot;: <code>HashMap</code>&apos;s O(1) average-case
        lookup, covered earlier in this site&apos;s Java collections material, is bought by giving up
        ordering entirely — reach for <code>TreeMap</code>/<code>TreeSet</code> the moment the problem needs
        sorted iteration, range queries, or nearest-neighbor lookups like <code>floorKey</code>/
        <code>ceilingKey</code>, and reach for <code>HashMap</code> the moment it doesn&apos;t and raw lookup
        speed is what matters.
      </p>

      <p>
        With traversal, the BST invariant, and the balance problem all concrete now, the next lesson widens
        the frame: a tree is just a connected, acyclic graph with a designated root — graphs relax every one
        of those constraints, and that is where BFS and DFS get their full generality.
      </p>
    </LessonLayout>
  );
}
