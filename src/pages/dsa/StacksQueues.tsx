import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function StacksQueues() {
  return (
    <LessonLayout
      title="Stacks & Queues"
      sectionId="dsa"
      lessonIndex={3}
      prev={{ path: '/dsa/linked-lists', label: 'Linked Lists' }}
      next={{ path: '/dsa/recursion-backtracking', label: 'Recursion & Backtracking' }}
    >
      <p>
        Stacks and queues are the same idea — a linear sequence of elements — with opposite rules for
        which end you're allowed to touch. A stack is <strong>LIFO</strong> (last in, first out): you push
        and pop from the same end, like a stack of plates. A queue is <strong>FIFO</strong> (first in,
        first out): you add at one end and remove from the other, like a checkout line. Java's collections
        library has more than one way to implement each, and picking the wrong one is a common interview
        tell — this lesson covers which types to actually reach for, plus the one behavior around{' '}
        <code>PriorityQueue</code> that trips up almost everyone the first time they hit it.
      </p>

      <h2>Picture It First: Plates and a Line of People</h2>

      <p>
        Before any code, two physical analogies cover both structures completely. A stack is a stack of
        plates: you can only ever add or remove the plate on <em>top</em>. To get to the plate at the
        bottom, you&apos;d have to remove every plate above it first — there&apos;s no reaching in from the
        side.
      </p>

      <FlowChart
        title="Stack (LIFO) — push(4) Adds to the Top, pop() Removes From the Top"
        chart={"graph LR\n  subgraph Before push 4\n    TOP1[top] --> S3[3] --> S2[2] --> S1[1]\n  end\n  subgraph After push 4\n    TOP2[top] --> S4[4 NEW] --> S3b[3] --> S2b[2] --> S1b[1]\n  end"}
      />

      <p>
        <code>pop()</code> is just that arrow in reverse — it removes plate 4 and hands it to you, and the
        stack is back to 3-2-1 with 3 on top again. Last plate on is always the first plate off:{' '}
        <strong>LIFO</strong>.
      </p>

      <p>
        A queue is a checkout line instead: people join at the <em>back</em> and get served from the{' '}
        <em>front</em> — the opposite ends. Whoever has been waiting longest is served next, no matter how
        many people have joined behind them since.
      </p>

      <FlowChart
        title="Queue (FIFO) — enqueue() Joins the Back, dequeue() Leaves From the Front"
        chart={"graph LR\n  subgraph Before enqueue Dave\n    FRONT1[front] --> A1[Alice] --> B1[Bob] --> C1[Carol]\n  end\n  subgraph After enqueue Dave\n    FRONT2[front] --> A2[Alice] --> B2[Bob] --> C2[Carol] --> D2[Dave NEW]\n  end"}
      />

      <p>
        <code>dequeue()</code> removes from the <em>front</em> of that same line — Alice, not Dave — since
        she&apos;s been waiting the longest. That&apos;s the whole difference from a stack: a stack adds and
        removes at the same end, a queue adds and removes at opposite ends. Everything below is that same
        pair of rules implemented with Java&apos;s real collection types.
      </p>

      <h2>Stack (LIFO): Stack vs ArrayDeque</h2>

      <p>
        <code>java.util.Stack</code> has been in the JDK since 1.0, and it looks like the obvious choice
        for a stack — it's even named <code>Stack</code>. It's also a design mistake preserved for
        backward compatibility: <code>Stack</code> extends <code>Vector</code>, which means every push and
        pop is synchronized (a throughput cost almost nobody wants) and it inherits <code>Vector</code>'s
        full list API, so nothing stops you from calling <code>get(0)</code> or <code>insertElementAt()</code>{' '}
        and violating the LIFO contract the class is supposed to enforce. Oracle's own Javadoc for{' '}
        <code>Stack</code> says as much: <em>&quot;A more complete and consistent set of LIFO stack
        operations is provided by the Deque interface and its implementations, which should be used in
        preference to this class.&quot;</em> That's not a style opinion — it's the documented
        recommendation from the class's own maintainers.
      </p>

      <p>
        <code>ArrayDeque</code> is the modern replacement: unsynchronized (fast, and you add your own
        locking if you actually need thread safety), backed by a resizable array, and it only exposes
        deque operations — there's no accidental random-access escape hatch. Both work as a stack; only
        one is the recommended way to get there.
      </p>

      <CodeBlock language="java" title="Stack vs ArrayDeque as a Stack">
{`import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Stack;

// The legacy way — works, but synchronized and Vector-based
Stack<Integer> legacyStack = new Stack<>();
legacyStack.push(1);
legacyStack.push(2);
legacyStack.push(3);
System.out.println(legacyStack.pop()); // 3 — last in, first out
System.out.println(legacyStack.peek()); // 2 — look without removing

// The recommended way — ArrayDeque used as a stack
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);
stack.push(2);
stack.push(3);
System.out.println(stack.pop());  // 3
System.out.println(stack.peek()); // 2`}
      </CodeBlock>

      <InfoBox variant="info" title="Straight From the Javadoc">
        <p>
          <code>java.util.Stack</code>'s own documentation tells you not to use it:{' '}
          <em>&quot;A more complete and consistent set of LIFO stack operations is provided by the Deque
          interface and its implementations, which should be used in preference to this class.&quot;</em>{' '}
          If you see <code>new Stack&lt;&gt;()</code> in a code review, that's worth a comment — not
          because it's broken, but because the JDK itself points at something better.
        </p>
      </InfoBox>

      <h2>Queue (FIFO): ArrayDeque via offer()/poll()</h2>

      <p>
        For a queue, skip <code>LinkedList</code> even though it implements the <code>Queue</code>{' '}
        interface and technically works — <code>ArrayDeque</code> is faster in practice because it avoids
        the per-node object allocation a linked structure requires, and it has no capacity restriction like
        the array-backed <code>ArrayBlockingQueue</code> would. The idiomatic pair of methods is{' '}
        <code>offer()</code> to add at the tail and <code>poll()</code> to remove from the head — both
        return a sentinel (<code>false</code> / <code>null</code>) instead of throwing when the operation
        can't succeed, which is usually what you want over the throwing <code>add()</code>/<code>remove()</code>{' '}
        pair.
      </p>

      <CodeBlock language="java" title="ArrayDeque as a Queue">
{`import java.util.ArrayDeque;
import java.util.Queue;

Queue<String> queue = new ArrayDeque<>();
queue.offer("first");
queue.offer("second");
queue.offer("third");

System.out.println(queue.poll()); // "first"  — first in, first out
System.out.println(queue.poll()); // "second"
System.out.println(queue.peek()); // "third" — look without removing`}
      </CodeBlock>

      <p>
        <code>LinkedList</code> also implements <code>Queue</code> (and <code>Deque</code>), so you'll see
        it in older code and it isn't wrong — just rarely the best default now that <code>ArrayDeque</code>{' '}
        covers the same ground with better cache locality and less allocation overhead.
      </p>

      <h2>Real Application: Valid Parentheses Matching</h2>

      <p>
        The canonical stack interview problem: given a string of brackets, determine whether every opening
        bracket has a matching closing bracket in the right order. The stack tracks &quot;what am I still
        waiting to close&quot; — push on every opener, and on every closer, pop and check it matches what's
        on top. If the stack is empty when you need to pop, or nonempty at the end, the string is invalid.
      </p>

      <CodeBlock language="java" title="isValid() — Bracket Matching With a Stack">
{`static boolean isValid(String s) {
    ArrayDeque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') {
            stack.push(c);
        } else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if ((c == ')' && top != '(') ||
                (c == ']' && top != '[') ||
                (c == '}' && top != '{')) {
                return false;
            }
        }
    }
    return stack.isEmpty();
}`}
      </CodeBlock>

      <p>Run against one valid and one invalid string, on JDK 26:</p>

      <CodeBlock language="text" title="Real Output">
{`{[()()]} -> true
{[(])} -> false`}
      </CodeBlock>

      <p>
        The invalid case is the instructive one: <code>{'{[(])}'}</code> has balanced bracket{' '}
        <em>counts</em> — three of each type — but the order is wrong. When the algorithm hits{' '}
        <code>]</code>, the top of the stack is <code>(</code>, not <code>[</code>, so it returns{' '}
        <code>false</code> immediately. Counting brackets is not the same problem as matching them; the
        stack is what encodes the nesting order that counting throws away.
      </p>

      <h2>PriorityQueue Iteration Order — The Part Everyone Gets Wrong</h2>

      <p>
        <code>PriorityQueue</code> keeps its elements ordered by priority (natural ordering, or a{' '}
        <code>Comparator</code> you supply) — but only through <code>poll()</code>, which always returns
        the smallest remaining element. It's tempting to assume that means the queue's internal storage is
        fully sorted, and that a for-each loop over it will print elements in sorted order too. It won't.
      </p>

      <p>
        Internally, <code>PriorityQueue</code> is a <strong>binary heap</strong> stored in an array. A heap
        only guarantees a much weaker property than full sorting: every parent is ≤ its children. That's
        enough to make <code>peek()</code>/<code>poll()</code> cheap and correct, but the array underneath
        is not sorted — and <code>iterator()</code> walks the array in its raw internal order, not priority
        order. This is documented behavior, not a bug: the Javadoc for <code>PriorityQueue.iterator()</code>{' '}
        explicitly states <em>&quot;the iterator does not guarantee to traverse the elements of the priority
        queue in any particular order.&quot;</em>
      </p>

      <CodeBlock language="java" title="for-each vs poll() on the Same PriorityQueue">
{`PriorityQueue<Integer> pq = new PriorityQueue<>();
int[] values = {5, 1, 8, 2, 9, 3, 7};
for (int v : values) pq.offer(v);

System.out.print("for-each iteration order: ");
for (int v : pq) {
    System.out.print(v + " ");
}
System.out.println();

System.out.print("poll() order: ");
while (!pq.isEmpty()) {
    System.out.print(pq.poll() + " ");
}`}
      </CodeBlock>

      <p>Real output, run on JDK 26 with the insertion order <code>5 1 8 2 9 3 7</code>:</p>

      <CodeBlock language="text" title="Real Output">
{`for-each iteration order: 1 2 3 5 9 8 7
poll() order: 1 2 3 5 7 8 9 `}
      </CodeBlock>

      <p>
        <code>poll()</code> comes out perfectly sorted, exactly as expected. The for-each order —{' '}
        <code>1 2 3 5 9 8 7</code> — starts sorted-looking (heap property puts the minimum first) and then
        visibly breaks: <code>9</code> comes before <code>8</code> and <code>7</code>. That's the heap's
        array layout leaking through the iterator, not a sorted sequence. If you need elements in priority
        order, you must drain the queue with <code>poll()</code> — iterating with a for-each (or calling{' '}
        <code>toString()</code>, which uses the same iterator) gives you heap-internal order, and that
        order is explicitly unspecified by the API contract, not just &quot;happens to look odd here.&quot;
      </p>

      <InfoBox variant="warning" title="Don't Iterate a PriorityQueue Expecting Sorted Output">
        <p>
          This bites people in code review and in interviews. A for-each loop over a{' '}
          <code>PriorityQueue</code>, or printing it directly, does <strong>not</strong> yield sorted
          order — only repeated <code>poll()</code> calls do. If you need a sorted snapshot without
          destroying the queue, copy it into a new <code>PriorityQueue</code> (or a list, then sort) and
          drain the copy.
        </p>
      </InfoBox>

      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Interface</th>
            <th>Ordering Guarantee</th>
            <th>Use When</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ArrayDeque</code> (as stack)</td>
            <td><code>Deque</code></td>
            <td>LIFO via <code>push</code>/<code>pop</code></td>
            <td>Any stack use case — the modern default</td>
          </tr>
          <tr>
            <td><code>java.util.Stack</code></td>
            <td><code>List</code> (extends <code>Vector</code>)</td>
            <td>LIFO via <code>push</code>/<code>pop</code></td>
            <td>Legacy code only — Javadoc recommends against new use</td>
          </tr>
          <tr>
            <td><code>ArrayDeque</code> (as queue)</td>
            <td><code>Queue</code></td>
            <td>FIFO via <code>offer</code>/<code>poll</code></td>
            <td>Any queue use case — faster than <code>LinkedList</code></td>
          </tr>
          <tr>
            <td><code>LinkedList</code></td>
            <td><code>Deque</code>, <code>Queue</code>, <code>List</code></td>
            <td>FIFO via <code>offer</code>/<code>poll</code></td>
            <td>Rarely the best choice now — more allocation overhead</td>
          </tr>
          <tr>
            <td><code>PriorityQueue</code></td>
            <td><code>Queue</code></td>
            <td>Sorted only via repeated <code>poll()</code> — iteration order is unspecified</td>
            <td>&quot;Give me the smallest/largest remaining item&quot; problems</td>
          </tr>
        </tbody>
      </table>

    </LessonLayout>
  );
}
