import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Graphs() {
  return (
    <LessonLayout
      title="Graphs & Graph Traversal"
      sectionId="dsa"
      lessonIndex={5}
      prev={{ path: '/dsa/trees', label: 'Trees & Binary Search Trees' }}
      next={{ path: '/dsa/hashing', label: 'Hash Tables, Deep Dive' }}
    >
      <p>
        A tree is a graph with rules bolted on: exactly one path between any two nodes, no cycles,
        one root to traverse down from. Drop those rules and you get a plain graph &mdash; nodes
        (vertices) connected by edges, no promise of a root, no promise against cycles, and often
        more than one path between two nodes. That extra freedom is why graphs model almost
        everything a tree can&apos;t: road networks, social connections, build dependencies,
        service call graphs, game maps. It also means &quot;the&quot; traversal order stops being a
        single fixed thing &mdash; the same graph, traversed the same direction, can come out in a
        different order depending on the mechanics of how you traverse it. That last claim sounds
        like hand-waving, so this lesson doesn&apos;t just assert it &mdash; every algorithm below
        was actually implemented and run against JDK 26, and the DFS section shows the real,
        verified case where two &quot;equivalent&quot; implementations produce different output.
      </p>

      <p>
        Every code sample in this lesson runs against the same 6-node example graph, so you can
        compare representations and algorithms against one mental picture instead of a new diagram
        every section:
      </p>

      <FlowChart
        title="The Example Graph — Reused for Every Section Below"
        chart={"graph LR\n  N0((0)) --- N1((1))\n  N0 --- N2((2))\n  N1 --- N3((3))\n  N2 --- N3\n  N2 --- N4((4))\n  N3 --- N4\n  N4 --- N5((5))"}
      />

      <h2>Two Representations of the Same Graph</h2>

      <p>
        There are two standard ways to store a graph in memory, and interview candidates who only
        know one of them tend to pick the wrong tool under pressure. Both are implemented below
        against the exact graph above, so you can compare their output directly.
      </p>

      <CodeBlock language="java" title="Adjacency List — Map<Integer, List<Integer>>">
{`static Map<Integer, List<Integer>> buildAdjacencyList() {
    Map<Integer, List<Integer>> adj = new HashMap<>();
    for (int i = 0; i < 6; i++) adj.put(i, new ArrayList<>());

    int[][] edges = {{0,1},{0,2},{1,3},{2,3},{2,4},{3,4},{4,5}};
    for (int[] e : edges) {
        adj.get(e[0]).add(e[1]);
        adj.get(e[1]).add(e[0]); // undirected: record both directions
    }
    return adj;
}

// Output:
//   0 -> [1, 2]
//   1 -> [0, 3]
//   2 -> [0, 3, 4]
//   3 -> [1, 2, 4]
//   4 -> [2, 3, 5]
//   5 -> [4]`}
      </CodeBlock>

      <CodeBlock language="java" title="Adjacency Matrix — int[V][V]">
{`static int[][] buildAdjacencyMatrix() {
    int[][] matrix = new int[6][6];
    int[][] edges = {{0,1},{0,2},{1,3},{2,3},{2,4},{3,4},{4,5}};
    for (int[] e : edges) {
        matrix[e[0]][e[1]] = 1;
        matrix[e[1]][e[0]] = 1;
    }
    return matrix;
}

// Output (row i, column j; 1 = edge exists):
//       0 1 2 3 4 5
//     0 0 1 1 0 0 0
//     1 1 0 0 1 0 0
//     2 1 0 0 1 1 0
//     3 0 1 1 0 1 0
//     4 0 0 1 1 0 1
//     5 0 0 0 0 1 0

// Edge-existence check is now O(1) array indexing instead of an O(degree) list scan:
matrix[1][3] == 1   // true  — is 1-3 an edge?
matrix[1][4] == 1   // false — is 1-4 an edge?`}
      </CodeBlock>

      <InfoBox variant="tip" title="Which One Do You Reach For?">
        <p>
          <strong>Adjacency list</strong> is the practical default for almost everything you&apos;ll
          build or get asked about &mdash; real-world graphs are sparse (a social network has
          billions of nodes but each person follows a tiny fraction of them), and a list only pays
          for edges that actually exist. This lesson&apos;s graph has 6 nodes and 7 edges: the list
          stores 14 entries total (7 edges &times; 2 directions), the matrix allocates 36 cells
          whether the edges exist or not.
        </p>
        <p>
          <strong>Adjacency matrix</strong> earns its keep when the graph is dense (edges approach
          V&sup2;) or when you need repeated O(1) &quot;is there an edge between X and Y&quot;
          checks and can afford O(V&sup2;) memory to get them &mdash; Floyd-Warshall (all-pairs
          shortest path) is the classic algorithm built around this trade-off.
        </p>
      </InfoBox>

      <h2>Breadth-First Search (BFS)</h2>

      <p>
        BFS explores level by level: visit every neighbor at distance 1 before touching anything at
        distance 2. That requires a <strong>Queue</strong> (FIFO), not a stack &mdash; you finish
        processing everything you already enqueued before the newly-discovered nodes get their
        turn.
      </p>

      <CodeBlock language="java" title="BFS.java — Real Queue, Run Against the Example Graph">
{`static List<Integer> bfs(Map<Integer, List<Integer>> adj, int start) {
    List<Integer> order = new ArrayList<>();
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();

    queue.offer(start);
    visited.add(start);

    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int neighbor : adj.get(node)) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.offer(neighbor);
            }
        }
    }
    return order;
}

bfs(adj, 0);
// Output: [0, 1, 2, 3, 4, 5]`}
      </CodeBlock>

      <p>
        That order isn&apos;t a coincidence of node numbering &mdash; it&apos;s BFS peeling off one
        full level at a time: <code>{'{0}'}</code> at distance 0, <code>{'{1, 2}'}</code> at distance
        1, <code>{'{3, 4}'}</code> at distance 2, <code>{'{5}'}</code> at distance 3. Tracking the hop
        count at which each node first gets discovered proves it:
      </p>

      <CodeBlock language="java" title="BFS Hop-Count Tracking, With a Manual Cross-Check">
{`static Map<Integer, Integer> bfsDistances(Map<Integer, List<Integer>> adj, int start) {
    Map<Integer, Integer> dist = new HashMap<>();
    Queue<Integer> queue = new LinkedList<>();
    dist.put(start, 0);
    queue.offer(start);

    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : adj.get(node)) {
            if (!dist.containsKey(neighbor)) {
                dist.put(neighbor, dist.get(node) + 1);
                queue.offer(neighbor);
            }
        }
    }
    return dist;
}

// Output:
//   node 0 : 0 hops
//   node 1 : 1 hops
//   node 2 : 1 hops
//   node 3 : 2 hops
//   node 4 : 2 hops
//   node 5 : 3 hops
//
// Manual check: shortest path 0->5 by inspection is 0-2-4-5 (3 edges).
// BFS reported distance for 5: 3   <- matches`}
      </CodeBlock>

      <InfoBox variant="info" title="Why BFS Guarantees Shortest Path (Unweighted Only)">
        <p>
          BFS is the right tool for <strong>shortest path in an unweighted graph</strong>, and the
          guarantee follows directly from the level-by-level order: every node at distance{' '}
          <em>k</em> gets enqueued only after every node at distance <em>k&minus;1</em> has already
          been fully processed. So the very first time BFS reaches a node, it has necessarily done
          so by the fewest possible hops &mdash; there is no unexplored shorter route sitting in the
          queue, because anything shorter would have been at an earlier level and already been
          dequeued. This breaks the instant edges have different weights, because &quot;fewest
          hops&quot; and &quot;lowest total weight&quot; stop being the same question &mdash; that&apos;s
          exactly the gap Dijkstra&apos;s algorithm fills further down.
        </p>
      </InfoBox>

      <h2>Depth-First Search (DFS): Recursive vs. Iterative</h2>

      <p>
        DFS commits to one path as deep as it goes before backtracking, which is naturally expressed
        with a stack &mdash; either an implicit one (the call stack, via recursion) or an explicit
        one you manage yourself with a <code>Deque</code>. The two are usually presented as
        interchangeable. They are not automatically the same, and this is worth actually checking
        rather than assuming: a recursive call visits a node&apos;s first unvisited neighbor{' '}
        <em>immediately</em>, while a loop that pushes all of a node&apos;s neighbors onto a stack
        and then pops has its visitation order flipped, because a stack reverses whatever order you
        pushed in.
      </p>

      <CodeBlock language="java" title="DFS.java — Recursive, Plain Iterative, and Reversed-Push Iterative">
{`// Recursive: visits the call stack's implicit ordering
static void dfsHelper(Map<Integer, List<Integer>> adj, int node,
                       Set<Integer> visited, List<Integer> order) {
    visited.add(node);
    order.add(node);
    for (int neighbor : adj.get(node)) {
        if (!visited.contains(neighbor)) {
            dfsHelper(adj, neighbor, visited, order);
        }
    }
}

// Iterative, naive: push neighbors in list order (NOT reversed), mark visited on pop
static List<Integer> dfsIterative(Map<Integer, List<Integer>> adj, int start) {
    List<Integer> order = new ArrayList<>();
    Set<Integer> visited = new HashSet<>();
    Deque<Integer> stack = new ArrayDeque<>();

    stack.push(start);
    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited.contains(node)) continue;
        visited.add(node);
        order.add(node);
        for (int neighbor : adj.get(node)) {
            if (!visited.contains(neighbor)) stack.push(neighbor);
        }
    }
    return order;
}

// Iterative, reversed-push: push neighbors back-to-front so the stack's
// reversal cancels out and the pop order matches the push-intent order
static List<Integer> dfsIterativeReversed(Map<Integer, List<Integer>> adj, int start) {
    List<Integer> order = new ArrayList<>();
    Set<Integer> visited = new HashSet<>();
    Deque<Integer> stack = new ArrayDeque<>();

    stack.push(start);
    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited.contains(node)) continue;
        visited.add(node);
        order.add(node);
        List<Integer> neighbors = adj.get(node);
        for (int i = neighbors.size() - 1; i >= 0; i--) {
            int neighbor = neighbors.get(i);
            if (!visited.contains(neighbor)) stack.push(neighbor);
        }
    }
    return order;
}

// Output, all three run from node 0 on the example graph:
//   recursive:                     [0, 1, 3, 2, 4, 5]
//   iterative, plain Stack:        [0, 2, 4, 5, 3, 1]
//   iterative, reversed push:      [0, 1, 3, 2, 4, 5]
//
//   Recursive == plain iterative?            false
//   Recursive == reversed-push iterative?    true`}
      </CodeBlock>

      <InfoBox variant="warning" title="Verified, Not Assumed: Recursive and Iterative DFS Can Diverge">
        <p>
          Run against the example graph, the plain iterative version genuinely produces a different
          order than the recursive one &mdash; <code>[0, 2, 4, 5, 3, 1]</code> instead of{' '}
          <code>[0, 1, 3, 2, 4, 5]</code>. Both are completely valid DFS traversals (every node is
          visited exactly once, and the algorithm always commits depth-first before backtracking),
          so if a problem&apos;s test cases check <em>which</em> valid DFS order came out &mdash;
          rather than just membership or reachability &mdash; a from-scratch iterative rewrite of a
          recursive reference solution can fail for a reason that has nothing to do with a logic
          bug. If you need the iterative version to match recursive output exactly, push neighbors
          in reverse order, as the third function above does. For most interview problems (cycle
          detection, connected components, path existence) the specific order never matters and this
          is a non-issue &mdash; it only bites when an order-sensitive check is involved.
        </p>
      </InfoBox>

      <h2>Cycle Detection: Undirected vs. Directed</h2>

      <p>
        This is the single most commonly-botched distinction in graph interview questions, and it
        is not a pedantic technicality &mdash; the two cases require genuinely different algorithms,
        proven below with a real counterexample where treating them the same way produces a wrong
        answer.
      </p>

      <h3>Undirected: Track Visited, Watch for Non-Parent Revisits</h3>

      <p>
        In an undirected graph, every edge is automatically a &quot;there and back&quot; &mdash;
        visiting neighbor B from A always lets you immediately walk back to A. So a naive
        &quot;have I seen this node before&quot; check would flag every single edge as a cycle. The
        fix is simple: track the parent you arrived from, and only call it a cycle if you reach an
        already-visited node that <em>isn&apos;t</em> that parent.
      </p>

      <CodeBlock language="java" title="Undirected Cycle Detection">
{`static boolean hasCycleUndirected(Map<Integer, List<Integer>> adj, int numNodes) {
    Set<Integer> visited = new HashSet<>();
    for (int i = 0; i < numNodes; i++) {
        if (!visited.contains(i) && dfsUndirected(adj, i, -1, visited)) return true;
    }
    return false;
}

static boolean dfsUndirected(Map<Integer, List<Integer>> adj, int node, int parent, Set<Integer> visited) {
    visited.add(node);
    for (int neighbor : adj.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor)) {
            if (dfsUndirected(adj, neighbor, node, visited)) return true;
        } else if (neighbor != parent) {
            return true; // revisited a node that isn't where we just came from
        }
    }
    return false;
}

// Tree (0-1, 0-2, 1-3, 1-4, 2-5), no cycle
hasCycleUndirected(tree, 6);              // Output: false

// The example graph (0-1,0-2,1-3,2-3,2-4,3-4,4-5) — has a cycle 0-1-3-2-0
hasCycleUndirected(exampleGraph, 6);      // Output: true`}
      </CodeBlock>

      <h3>Directed: Global &quot;Visited&quot; Is Not Enough</h3>

      <p>
        A directed graph can legitimately revisit an already-fully-explored node through a different
        path, with zero cycle involved &mdash; a diamond shape (two different routes converging on
        the same downstream node) is the simplest example. If cycle detection only tracks a global
        &quot;have I ever seen this node&quot; set, that convergence looks identical to a real
        cycle. The fix is tracking a second set: which nodes are on the <em>current</em> recursion
        path (&quot;on stack&quot;), not just which nodes have ever been visited. A back-edge to a
        node that&apos;s on the current path is a real cycle; a forward/cross-edge to a node that
        was visited and fully finished on a <em>different</em> branch is not.
      </p>

      <FlowChart
        title="Diamond — Revisits Node 3, But Is NOT a Cycle"
        chart={"graph LR\n  D0((0)) --> D1((1))\n  D0 --> D2((2))\n  D1 --> D3((3))\n  D2 --> D3"}
      />

      <CodeBlock language="java" title="Directed Cycle Detection — Naive (Wrong) vs. Correct (visited + onStack)">
{`// NAIVE — only tracks global "visited". This is the common bug.
static boolean dfsDirectedNaive(Map<Integer, List<Integer>> adj, int node, Set<Integer> visited) {
    visited.add(node);
    for (int neighbor : adj.getOrDefault(node, List.of())) {
        if (visited.contains(neighbor)) return true; // BUG: doesn't check "on current path"
        if (dfsDirectedNaive(adj, neighbor, visited)) return true;
    }
    return false;
}

// CORRECT — tracks visited (globally done) AND onStack (current recursion path)
static boolean dfsDirectedCorrect(Map<Integer, List<Integer>> adj, int node,
                                   Set<Integer> visited, Set<Integer> onStack) {
    visited.add(node);
    onStack.add(node);
    for (int neighbor : adj.getOrDefault(node, List.of())) {
        if (onStack.contains(neighbor)) return true; // ancestor on THIS path -> real cycle
        if (!visited.contains(neighbor)) {
            if (dfsDirectedCorrect(adj, neighbor, visited, onStack)) return true;
        }
        // visited but not onStack -> already finished via another branch, not a cycle
    }
    onStack.remove(node); // leaving this node's subtree, take it off the current path
    return false;
}

// Diamond: 0->1, 0->2, 1->3, 2->3 — node 3 is reached twice, but there is NO cycle
hasCycleDirectedNaive(diamond, 4);     // Output: true   <- WRONG, should be false
hasCycleDirectedCorrect(diamond, 4);   // Output: false  <- correct

// Real cycle: 0->1->2->0, plus a non-cycle branch 2->3
hasCycleDirectedNaive(trueCycle, 4);    // Output: true   <- correct here, but for the wrong reason
hasCycleDirectedCorrect(trueCycle, 4);  // Output: true   <- correct`}
      </CodeBlock>

      <InfoBox variant="danger" title="Real, Verified Proof the Distinction Matters">
        <p>
          This isn&apos;t theoretical hedging &mdash; run against the diamond graph above, the naive
          global-visited check returns <code>true</code> (reports a cycle where there is none), and
          the visited+onStack version correctly returns <code>false</code>. Both versions agree on
          the graph that actually has a cycle, which is exactly what makes the naive bug dangerous:
          it passes any test case built only from graphs that either have an obvious cycle or have
          no repeated node visits at all. It only breaks on the specific shape that shows up
          constantly in real dependency graphs &mdash; a node with two upstream dependents that both
          eventually feed into the same downstream node.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"A directed graph has edges 0->1, 0->2, 1->3, 2->3. Node 3 is reached via two different paths (0-1-3 and 0-2-3) during a DFS. Does this graph contain a cycle, and why does a cycle-detection algorithm that only tracks a global \"visited\" set get this wrong?"}
        options={[
          "Yes, it has a cycle — node 3 being visited twice proves a cycle exists",
          "No cycle exists. A global-visited-only check incorrectly flags it as a cycle because it can't distinguish \"revisiting a node on the current recursion path\" (a real cycle) from \"reaching an already-finished node via a different branch\" (just a converging path, common in DAGs)",
          "No cycle exists, and the global-visited-only check gets it right — the bug only shows up in undirected graphs",
          "It depends on which node the DFS starts from"
        ]}
        correctIndex={1}
        explanation={"This is the diamond shape: 0 branches to 1 and 2, both of which lead to 3. Node 3 is visited twice, but never while it's an ancestor of itself on the current path — by the time DFS reaches 3 via 2, the 1-3 branch has already fully finished and backtracked. Directed-graph cycle detection needs a second set (\"onStack\", the current recursion path) in addition to the global \"visited\" set — a cycle only exists if you reach a node that is currently on that path, i.e. an ancestor of the node you're standing on, not merely a node you've seen at some point before. Undirected cycle detection doesn't need onStack because it tracks the immediate parent instead, which is enough there since every edge is bidirectional."}
      />

      <h2>Dijkstra&apos;s Algorithm: Shortest Path in a Weighted Graph</h2>

      <p>
        BFS finds shortest paths by hop count, which only means &quot;shortest&quot; when every edge
        costs the same. The moment edges carry different weights &mdash; flight prices, network
        latency, road distances &mdash; the fewest-hops path and the cheapest-total-weight path can
        be different paths entirely, and you need Dijkstra&apos;s algorithm. It greedily finalizes
        the closest not-yet-finalized node on every step, using the same <code>PriorityQueue</code>{' '}
        covered in the Stacks &amp; Queues lesson &mdash; here it always pops whichever discovered
        node currently has the smallest known distance, instead of insertion order.
      </p>

      <FlowChart
        title="Small Weighted Graph for Dijkstra"
        chart={"graph LR\n  W0((0)) ---|4| W1((1))\n  W0 ---|1| W2((2))\n  W2 ---|2| W1\n  W1 ---|5| W3((3))\n  W2 ---|8| W3\n  W2 ---|10| W4((4))\n  W3 ---|2| W4"}
      />

      <CodeBlock language="java" title="Dijkstra.java — PriorityQueue-Based, Run and Verified Manually">
{`static int[] dijkstra(Map<Integer, List<Edge>> adj, int source, int numNodes) {
    int[] dist = new int[numNodes];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
    pq.offer(new int[]{source, 0});
    Set<Integer> finalized = new HashSet<>();

    while (!pq.isEmpty()) {
        int[] current = pq.poll();
        int node = current[0], d = current[1];

        if (finalized.contains(node)) continue; // stale entry, a shorter one already won
        finalized.add(node);

        for (Edge edge : adj.get(node)) {
            if (finalized.contains(edge.to)) continue;
            int newDist = d + edge.weight;
            if (newDist < dist[edge.to]) {
                dist[edge.to] = newDist;
                pq.offer(new int[]{edge.to, newDist});
            }
        }
    }
    return dist;
}

// Graph: 0-1 (4), 0-2 (1), 2-1 (2), 1-3 (5), 2-3 (8), 2-4 (10), 3-4 (2)
dijkstra(adj, 0, 5);
// Output:
//   0 -> 0 : 0
//   0 -> 1 : 3
//   0 -> 2 : 1
//   0 -> 3 : 8
//   0 -> 4 : 10
//
// Manual verification:
//   0->2 direct edge weight 1                       -> dist[2] = 1   (matches)
//   0->2->1 = 1+2 = 3, beats direct 0->1 = 4         -> dist[1] = 3   (matches)
//   0->2->1->3 = 1+2+5 = 8, beats 0->2->3 = 9        -> dist[3] = 8   (matches)
//   0->2->1->3->4 = 1+2+5+2 = 10, beats 0->2->4 = 11 -> dist[4] = 10  (matches)`}
      </CodeBlock>

      <p>
        Every reported distance matches a hand-traced path through the graph &mdash; Dijkstra found
        the two-hop route through node 2 was cheaper than the direct edge in both cases, exactly as
        the manual check predicts.
      </p>

      <InfoBox variant="danger" title="Dijkstra Breaks With Negative Edge Weights — Proven, Not Just Stated">
        <p>
          Dijkstra&apos;s core assumption is that once a node is popped and finalized, its distance
          can never improve later &mdash; every remaining edge weight is non-negative, so no future
          discovery can undercut a distance that&apos;s already the smallest in the queue. A negative
          edge weight breaks that assumption directly. Proof, not just a claim: on the directed graph{' '}
          <code>0-&gt;1 (weight 1)</code>, <code>0-&gt;2 (weight 2)</code>,{' '}
          <code>2-&gt;1 (weight -10)</code>, the true shortest path 0&rarr;1 is via 0-2-1, costing{' '}
          <code>2 + (-10) = -8</code>. But node 1 (distance 1) is popped and finalized before node 2
          (distance 2) is even processed, since 1 &lt; 2. Once finalized, Dijkstra never revisits
          node 1&apos;s distance &mdash; running the exact algorithm above against this graph reports{' '}
          <code>dist[1] = 1</code>, not <code>-8</code>. That&apos;s a wrong answer, produced by
          correctly-implemented Dijkstra, purely because of one negative edge. The algorithm that
          handles negative weights correctly (as long as there&apos;s no negative <em>cycle</em>,
          which would make &quot;shortest path&quot; undefined — you could loop it forever to keep
          decreasing cost) is <strong>Bellman-Ford</strong>, which relaxes every edge V&minus;1 times
          instead of greedily finalizing nodes.
        </p>
      </InfoBox>

      <h2>Topological Sort: Ordering a DAG</h2>

      <p>
        Topological sort produces a linear ordering of a <strong>DAG</strong> (Directed Acyclic
        Graph) such that every edge A&rarr;B places A before B in the output &mdash; it&apos;s only
        defined when the graph has no cycles, because a cycle would demand that some node comes both
        before and after another. This is the algorithm behind build systems (compile dependencies
        before the things that depend on them) and course prerequisite scheduling. The
        implementation below uses <strong>Kahn&apos;s algorithm</strong>: repeatedly peel off nodes
        whose in-degree has dropped to zero, using a queue.
      </p>

      <FlowChart
        title="Course Prerequisites — A DAG"
        chart={"graph TD\n  IP[Intro to Programming] --> DS[Data Structures]\n  DS --> ALG[Algorithms]\n  DS --> DB[Databases]\n  DM[Discrete Math] --> ALG\n  ALG --> AA[Advanced Algorithms]\n  DB --> AA"}
      />

      <CodeBlock language="java" title="TopoSort.java — Kahn's Algorithm, Run on a Real Dependency Graph">
{`static List<String> topoSort(Map<String, List<String>> adj) {
    Map<String, Integer> inDegree = new HashMap<>();
    for (String node : adj.keySet()) inDegree.put(node, 0);
    for (String node : adj.keySet()) {
        for (String neighbor : adj.get(node)) {
            inDegree.merge(neighbor, 1, Integer::sum);
        }
    }

    Queue<String> queue = new LinkedList<>();
    for (String node : inDegree.keySet()) {
        if (inDegree.get(node) == 0) queue.offer(node);
    }

    List<String> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        String node = queue.poll();
        order.add(node);
        for (String neighbor : adj.getOrDefault(node, List.of())) {
            inDegree.merge(neighbor, -1, Integer::sum);
            if (inDegree.get(neighbor) == 0) queue.offer(neighbor);
        }
    }

    if (order.size() != adj.size()) {
        throw new IllegalStateException("Graph has a cycle — no valid topological order exists");
    }
    return order;
}

// Edges: Intro->DataStructures, DataStructures->Algorithms, DataStructures->Databases,
//        DiscreteMath->Algorithms, Algorithms->AdvancedAlgorithms, Databases->AdvancedAlgorithms
topoSort(prereqs);
// Output:
//   Intro to Programming
//   Discrete Math
//   Data Structures
//   Algorithms
//   Databases
//   Advanced Algorithms
//
// Verified: for every prerequisite edge A->B, A's position in the output is
// before B's position. Checked programmatically against all 6 edges: true.

// Feeding it a cycle (A->B->C->A) instead:
topoSort(cyclicGraph);
// Output: threw IllegalStateException: Graph has a cycle — no valid topological order exists`}
      </CodeBlock>

      <p>
        Notice <code>Discrete Math</code> lands right after <code>Intro to Programming</code>{' '}
        instead of at the very front &mdash; Kahn&apos;s algorithm processes the queue in FIFO order,
        and both nodes had in-degree 0 from the start, so which one enqueues first is just a
        function of iteration order over the map&apos;s keys. Topological sort guarantees{' '}
        <em>a</em> valid ordering, not a unique one &mdash; several different orderings can all
        legitimately satisfy every dependency edge, and this run happens to land on one of them.
      </p>

      <h2>Complexity Summary</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Algorithm</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Time</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Use it for</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>BFS</td>
            <td style={{ padding: '0.75rem' }}>O(V + E)</td>
            <td style={{ padding: '0.75rem' }}>Shortest path, unweighted graph only</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>DFS (recursive or iterative)</td>
            <td style={{ padding: '0.75rem' }}>O(V + E)</td>
            <td style={{ padding: '0.75rem' }}>Reachability, connected components, cycle detection, path existence</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Cycle detection (undirected)</td>
            <td style={{ padding: '0.75rem' }}>O(V + E)</td>
            <td style={{ padding: '0.75rem' }}>DFS + parent tracking</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Cycle detection (directed)</td>
            <td style={{ padding: '0.75rem' }}>O(V + E)</td>
            <td style={{ padding: '0.75rem' }}>DFS + visited AND onStack tracking</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Dijkstra</td>
            <td style={{ padding: '0.75rem' }}>O((V + E) log V) with a binary-heap PriorityQueue</td>
            <td style={{ padding: '0.75rem' }}>Shortest path, weighted graph, non-negative weights only</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Bellman-Ford (named, not implemented above)</td>
            <td style={{ padding: '0.75rem' }}>O(V &times; E)</td>
            <td style={{ padding: '0.75rem' }}>Shortest path with negative edges, or detecting negative cycles</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Topological sort (Kahn&apos;s)</td>
            <td style={{ padding: '0.75rem' }}>O(V + E)</td>
            <td style={{ padding: '0.75rem' }}>Dependency ordering on a DAG &mdash; undefined if a cycle exists</td>
          </tr>
        </tbody>
      </table>

      <p>
        Graphs are the last general-purpose traversal structure in this section &mdash; the next
        lesson moves from &quot;how do I walk a structure&quot; to &quot;how do I look something up
        in it instantly,&quot; going deep on how a hash table turns a key into a bucket and what
        actually happens when two keys collide.
      </p>
    </LessonLayout>
  );
}
