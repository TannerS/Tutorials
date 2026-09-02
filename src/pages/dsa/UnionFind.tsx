import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function UnionFind() {
  return (
    <LessonLayout
      title="Union-Find & Minimum Spanning Trees"
      sectionId="dsa"
      lessonIndex={9}
      prev={{ path: '/dsa/graphs', label: 'Graphs & Graph Traversal' }}
      next={{ path: '/dsa/hashing', label: 'Hash Tables, Deep Dive' }}
    >
      <p>
        The previous lesson treated a graph as nodes connected by edges and walked every node with
        BFS, DFS, and friends. This lesson is narrower on purpose: it is about one specific question
        that comes up constantly when working with undirected graphs &mdash; <strong>&quot;are these
        two things already connected, directly or indirectly?&quot;</strong> &mdash; and a data
        structure, Union-Find, built to answer that question almost instantly, over and over, even as
        the graph keeps growing. The second half of this lesson then uses Union-Find to solve a real
        graph problem: finding the cheapest way to connect a whole set of nodes together. As with
        every lesson in this section, nothing here is asserted from memory &mdash; every array
        dump and every algorithm run below is real console output from Java compiled and executed
        against the installed JDK (<code>26.0.1</code>) on this machine.
      </p>

      <h2>The Problem, in Plain Language First</h2>

      <p>
        Imagine a room full of people who arrive as total strangers and gradually make friends.
        At any moment, the room is split into <strong>friend groups</strong> &mdash; clusters of
        people who are connected to each other, directly or through a chain of mutual friends.
        Two things happen over and over as the party goes on:
      </p>

      <p>
        <strong>&quot;Are Ann and Gus in the same friend group?&quot;</strong> &mdash; this is a{' '}
        <strong>find</strong> query: are these two people (or nodes, or elements) already connected?
      </p>

      <p>
        <strong>&quot;Ann and Gus just became friends &mdash; merge their two groups into one.&quot;</strong>{' '}
        &mdash; this is a <strong>union</strong> operation: two previously separate groups become
        a single group.
      </p>

      <p>
        The naive way to answer &quot;are these two connected?&quot; is to run a traversal &mdash;
        BFS or DFS from the previous lesson &mdash; and check if you reach the other node. That
        works, but it walks the <em>entire</em> connected component every single time you ask,
        which is wasteful if you are going to ask this question thousands of times as the groups
        keep changing. Union-Find answers both questions in almost constant time each, no full
        walk required. Here is five friend groups in a room, before anyone new becomes friends:
      </p>

      <FlowChart
        title="Five Separate Friend Groups (Disjoint Sets) — Before"
        chart={"graph LR\n  subgraph g1[\"Group 1\"]\n    Ann((Ann))\n    Bo((Bo))\n  end\n  subgraph g2[\"Group 2\"]\n    Cy((Cy))\n    Dee((Dee))\n    Eli((Eli))\n  end\n  subgraph g3[\"Group 3\"]\n    Fay((Fay))\n  end\n  subgraph g4[\"Group 4\"]\n    Gus((Gus))\n    Hana((Hana))\n  end\n  subgraph g5[\"Group 5\"]\n    Ivy((Ivy))\n    Jax((Jax))\n  end"}
      />

      <p>
        Now Bo and Gus become friends. That is a single <code>union(Bo, Gus)</code> call, and it
        merges <em>all</em> of Group 1 with <em>all</em> of Group 4 in one step &mdash; not just Bo
        and Gus personally, everyone already connected to either of them:
      </p>

      <FlowChart
        title="After union(Bo, Gus) — Groups 1 and 4 Merge Into One"
        chart={"graph LR\n  subgraph g14[\"Group 1 + 4 (merged)\"]\n    Ann((Ann))\n    Bo((Bo))\n    Gus((Gus))\n    Hana((Hana))\n  end\n  subgraph g2[\"Group 2\"]\n    Cy((Cy))\n    Dee((Dee))\n    Eli((Eli))\n  end\n  subgraph g3[\"Group 3\"]\n    Fay((Fay))\n  end\n  subgraph g5[\"Group 5\"]\n    Ivy((Ivy))\n    Jax((Jax))\n  end"}
      />

      <p>
        Five groups became four. Ann and Hana were never introduced to each other, but they are now
        in the same group, because both are connected to Bo and Gus respectively, and Bo and Gus are
        now connected. That is the entire idea. Everything below is just making &quot;are these
        connected&quot; and &quot;merge these two groups&quot; fast to compute.
      </p>

      <h2>Implementing It: One Array, Two Operations</h2>

      <p>
        Union-Find (also called Disjoint Set Union, or DSU) represents every group with a{' '}
        <strong>tree</strong>, and every tree with just one array: <code>parent[i]</code> holds the
        parent of element <code>i</code>. An element whose parent is <em>itself</em> is a{' '}
        <strong>root</strong> &mdash; and the root is what identifies the whole group. Two elements
        are in the same group exactly when walking up their parent pointers lands on the same root.
        That is <code>find()</code>. <code>union(x, y)</code> just finds both roots and points one
        root at the other, splicing the two trees into one.
      </p>

      <CodeBlock language="java" title="DSUNaive.java — find() with path compression, plain union()">
{`static class DSUNaive {
    int[] parent;
    DSUNaive(int n) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i; // everyone starts as their own group
    }
    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // walk up to the root, THEN rewire on the way back
        }
        return parent[x];
    }
    void union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX != rootY) parent[rootX] = rootY; // splice one tree under the other's root
    }
}`}
      </CodeBlock>

      <p>
        Read <code>find()</code> in two passes. The recursive call <code>find(parent[x])</code>{' '}
        alone, with no assignment, is the whole idea in its plainest form: keep following{' '}
        <code>parent</code> pointers until you hit a node that is its own parent, and that is the
        root. The assignment wrapped around it &mdash; <code>parent[x] = find(parent[x])</code> —
        is the optimization called <strong>path compression</strong>: while the recursion is
        unwinding back down the chain it just walked, every one of those nodes gets its{' '}
        <code>parent</code> pointer rewritten to point <em>directly at the root</em>, instead of at
        whatever it pointed to before. The next time anyone asks <code>find()</code> about any of
        those nodes, the walk is one hop, not a chain. That claim is exactly what the next section
        proves with a real before/after array dump, not just an assertion.
      </p>

      <h2>Proving Path Compression Actually Works</h2>

      <p>
        To see path compression do something, first a tree that is <em>tall</em> is needed &mdash;
        a straight chain is the worst case, since walking it takes one hop per link. A deliberately
        adversarial sequence of <code>union()</code> calls builds exactly that: union each new
        element onto the <em>previous</em> element, one at a time, so nothing ever gets attached
        directly to a shallow root:
      </p>

      <CodeBlock language="java" title="Building a worst-case chain on purpose">
{`int n = 7; // elements 0..6
DSUNaive dsu = new DSUNaive(n);
for (int i = 0; i < n - 1; i++) {
    dsu.union(i, i + 1); // union(0,1), union(1,2), union(2,3), ... union(5,6)
}`}
      </CodeBlock>

      <p>
        Every one of those calls attaches the current chain&apos;s root under a brand-new element
        before that element has any children of its own, so the chain gets one link taller every
        time instead of staying flat. Real output, printed straight from the <code>parent</code>{' '}
        array &mdash; read each entry as <code>index-&gt;parent</code>:
      </p>

      <CodeBlock language="text" title="Real console output — the array, before touching find()">
{`Chain built via union(0,1), union(1,2), union(2,3), union(3,4), union(4,5), union(5,6)
BEFORE find(0): [0->1, 1->2, 2->3, 3->4, 4->5, 5->6, 6->6]
Hops from node 0 to root, walked manually without compression logic: 6`}
      </CodeBlock>

      <p>
        Node 0 points at 1, which points at 2, which points at 3&hellip; all the way up to 6, which
        points at itself &mdash; a straight six-link chain, exactly the tall structure the
        adversarial union order was built to produce. Now a single call, <code>find(0)</code>, walks
        that chain to find the root <em>and</em> triggers path compression on the way back down the
        recursion:
      </p>

      <CodeBlock language="text" title="Real console output — same array, immediately after ONE find(0) call">
{`find(0) returned root = 6
AFTER find(0): [0->6, 1->6, 2->6, 3->6, 4->6, 5->6, 6->6]
Hops from node 0 to root, after path compression: 1`}
      </CodeBlock>

      <p>
        Every node that was on the path from 0 to the root &mdash; not just node 0 &mdash; now
        points <em>directly</em> at root 6. One <code>find()</code> call flattened the entire
        six-link chain into six one-hop pointers. Call <code>find()</code> on any of those nodes
        again and it now resolves in a single step instead of retracing the old chain. This is the
        concrete payoff: path compression does not just speed up the one call that happened to
        trigger it, it permanently flattens the structure for every future call on every node it
        touched.
      </p>

      <InfoBox variant="tip" title="Union by Size, Briefly">
        <p>
          Path compression fixes tall trees <em>after</em> they happen. The other standard
          optimization, <strong>union by size</strong> (or the closely related union by rank), tries
          to stop them from forming in the first place: when merging two groups, always attach the{' '}
          <em>smaller</em> tree underneath the <em>larger</em> tree&apos;s root, rather than
          picking a direction arbitrarily. Left unchecked, the naive <code>union()</code> above can
          be forced into a straight chain, as just demonstrated &mdash; union by size makes that
          worst case essentially unreachable, because a tree can only grow taller by merging with
          a tree at least as large as itself, which can only happen a logarithmic number of times.
          Combined, path compression and union by size are the standard production pairing, used
          in the <code>DSU</code> class below and for the rest of this lesson.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="DSU.java — path compression + union by size, used from here on">
{`static class DSU {
    int[] parent;
    int[] size;
    DSU(int n) {
        parent = new int[n];
        size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }
    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // path compression
        }
        return parent[x];
    }
    // returns false if x and y were already in the same set (union was a no-op)
    boolean union(int x, int y) {
        int rootX = find(x), rootY = find(y);
        if (rootX == rootY) return false;
        if (size[rootX] < size[rootY]) { int t = rootX; rootX = rootY; rootY = t; }
        parent[rootY] = rootX;   // attach the smaller tree under the larger tree's root
        size[rootX] += size[rootY];
        return true;
    }
    boolean connected(int x, int y) { return find(x) == find(y); }
}`}
      </CodeBlock>

      <p>
        With both optimizations in place, the precise, well-established result (Tarjan, 1975) is
        that a sequence of <code>m</code> Union-Find operations on <code>n</code> elements runs in{' '}
        <strong>O(m &middot; &alpha;(n))</strong> total, where &alpha; is the{' '}
        <strong>inverse Ackermann function</strong> &mdash; a function that grows so slowly that{' '}
        <strong>&alpha;(n) is at most 4 for any n that could ever physically be represented</strong>{' '}
        (the Ackermann function itself grows so explosively fast that its inverse is, for every
        practical purpose, a small constant). That is the precise version of the informal claim
        &quot;Union-Find is basically O(1) per operation&quot; &mdash; not literally constant in the
        strict mathematical sense, but so close to it that no input size that could ever exist
        would tell the difference.
      </p>

      <h2>Part 2: Minimum Spanning Trees — The Cheapest Way to Connect Everything</h2>

      <p>
        Now a genuinely different-sounding problem, on the same kind of graph the previous lesson
        introduced &mdash; nodes and undirected edges, except now each edge has a cost. Picture a
        handful of towns and the cost to lay direct cable between various pairs of them. Not every
        pair needs a direct cable &mdash; a town just needs to be <em>reachable</em> from every
        other town, possibly by routing through others. The question: <strong>what is the
        cheapest set of cables that connects every town to every other town?</strong> That
        cheapest connecting set is called a <strong>Minimum Spanning Tree</strong> (MST) &mdash;{' '}
        <em>spanning</em> because it reaches every node, <em>tree</em> because a cheapest connecting
        set never contains a cycle (a cycle means at least one cable could be removed for free
        without disconnecting anything, so it was never part of the cheapest answer).
      </p>

      <p>
        Six towns, eight candidate cable routes, each with a cost:
      </p>

      <FlowChart
        title="Candidate Cable Routes and Their Costs"
        chart={"graph LR\n  A((A)) ---|4| B((B))\n  A ---|2| C((C))\n  B ---|1| C\n  B ---|5| D((D))\n  C ---|8| D\n  D ---|3| E((E))\n  D ---|6| F((F))\n  E ---|1| F"}
      />

      <p>
        And the cheapest way to connect all six &mdash; the Minimum Spanning Tree this lesson
        derives below, five edges instead of eight, still reaching every town, no cycles:
      </p>

      <FlowChart
        title="The Minimum Spanning Tree — Fewer Edges, Still Fully Connected"
        chart={"graph LR\n  A((A)) ---|2| C((C))\n  B((B)) ---|1| C\n  B ---|5| D((D))\n  D ---|3| E((E))\n  E ---|1| F((F))"}
      />

      <h2>Kruskal&apos;s Algorithm: The Greedy Idea</h2>

      <p>
        Kruskal&apos;s algorithm builds that second diagram with a strategy that sounds almost too
        simple to work: <strong>sort every edge cheapest-first, then walk the sorted list adding
        each edge to the MST &mdash; unless that edge would connect two towns that are already
        connected, in which case skip it.</strong> Skipping is required because an edge between two
        already-connected towns would create a cycle &mdash; a strictly wasted cable, since those
        towns can already reach each other. Taking the cheapest edges first and skipping only the
        ones that create a cycle turns out to always produce the cheapest possible fully-connected
        set (the greedy-exchange proof is the classic argument for why this works, and is out of
        scope here, but the mechanics are what matters for using it).
      </p>

      <p>
        And this is exactly where Part 1 pays off: <strong>&quot;are these two towns already
        connected?&quot; is precisely the <code>find()</code> query from Union-Find</strong>, and
        &quot;connect them&quot; is precisely <code>union()</code>. Each town is an element; each
        group of mutually-reachable towns is a Union-Find set; &quot;would this edge create a
        cycle&quot; is just &quot;are these two roots already the same root.&quot; No traversal
        needed on every edge check &mdash; just the near-O(1) operations from Part 1, run once per
        candidate edge.
      </p>

      <CodeBlock language="java" title="Kruskal.java — using the DSU class from Part 1">
{`String[] names = {"A", "B", "C", "D", "E", "F"};
int[][] edges = {
    {0, 1, 4}, // A-B
    {0, 2, 2}, // A-C
    {1, 2, 1}, // B-C
    {1, 3, 5}, // B-D
    {2, 3, 8}, // C-D
    {3, 4, 3}, // D-E
    {3, 5, 6}, // D-F
    {4, 5, 1}, // E-F
};

Integer[] order = new Integer[edges.length];
for (int i = 0; i < order.length; i++) order[i] = i;
Arrays.sort(order, (a, b) -> edges[a][2] - edges[b][2]); // cheapest edge first

DSU dsu = new DSU(names.length);
List<int[]> mstEdges = new ArrayList<>();
int totalWeight = 0;

for (int idx : order) {
    int[] e = edges[idx];
    int u = e[0], v = e[1], w = e[2];
    if (!dsu.connected(u, v)) {       // find(): same group already?
        dsu.union(u, v);              // union(): merge the two groups
        mstEdges.add(e);
        totalWeight += w;
    }
    // else: skip -- u and v already connected, adding this edge would create a cycle
}`}
      </CodeBlock>

      <p>
        Run against the eight candidate edges above, real output:
      </p>

      <CodeBlock language="text" title="Real console output — every edge, in sorted order, ADD or SKIP">
{`Edges sorted by weight ascending:
  B-C weight=1
  E-F weight=1
  A-C weight=2
  D-E weight=3
  A-B weight=4
  B-D weight=5
  D-F weight=6
  C-D weight=8

Processing edges in sorted order:
  ADD   B-C (w=1) -- running total=1
  ADD   E-F (w=1) -- running total=2
  ADD   A-C (w=2) -- running total=4
  ADD   D-E (w=3) -- running total=7
  SKIP  A-B (w=4) -- A and B already connected, would create a cycle
  ADD   B-D (w=5) -- running total=12
  SKIP  D-F (w=6) -- D and F already connected, would create a cycle
  SKIP  C-D (w=8) -- C and D already connected, would create a cycle

Final MST edge set:
  B-C (weight 1)
  E-F (weight 1)
  A-C (weight 2)
  D-E (weight 3)
  B-D (weight 5)
Total MST weight = 12
Edge count = 5 (should be nodes-1 = 5)
All 6 nodes connected after MST edges only: true`}
      </CodeBlock>

      <p>
        Checked by hand against the two diagrams above: the five <code>ADD</code> lines &mdash;{' '}
        B-C, E-F, A-C, D-E, B-D &mdash; are exactly the five edges drawn in the &quot;Minimum
        Spanning Tree&quot; diagram, and 1 + 1 + 2 + 3 + 5 = <strong>12</strong>, matching{' '}
        <code>Total MST weight = 12</code> exactly. The three <code>SKIP</code> lines are worth
        tracing too, since they are where Union-Find is doing the actual work: by the time A-B
        (weight 4) comes up, A and B are already in the same group &mdash; A joined B-C&apos;s group
        through the A-C edge two steps earlier &mdash; so adding A-B would only create a cycle
        inside a group that is already fully connected, and it is correctly skipped. Same story for
        D-F and C-D, both processed after their endpoints were already joined through cheaper
        routes. Six towns need exactly five edges to connect with no cycles (a tree on{' '}
        <code>n</code> nodes always has <code>n - 1</code> edges), and the output&apos;s edge count
        confirms it landed on exactly five.
      </p>

    </LessonLayout>
  );
}
