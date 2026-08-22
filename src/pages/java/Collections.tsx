import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Collections() {
  return (
    <LessonLayout
      title="Collections Framework"
      sectionId="java"
      lessonIndex={3}
      prev={{ path: '/java/oop', label: 'OOP Fundamentals' }}
      next={{ path: '/java/generics', label: 'Generics & Type System' }}
    >
      <h2>Java Collections Framework</h2>
      <p>
        The Java Collections Framework provides a unified architecture for storing and
        manipulating groups of objects. It includes interfaces, implementations, and algorithms
        that make working with data structures much easier than using raw arrays. Collections
        are dynamically sized and provide powerful operations for searching, sorting, and
        transforming data.
      </p>

      <FlowChart
        title="Collections Interface Hierarchy"
        chart={"graph TD\nA[Iterable] --> B[Collection]\nB --> C[List]\nB --> D[Set]\nB --> E[Queue]\nC --> F[ArrayList]\nC --> G[LinkedList]\nD --> H[HashSet]\nD --> I[TreeSet]\nD --> J[LinkedHashSet]\nE --> K[PriorityQueue]\nE --> L[ArrayDeque]\nM[Map] --> N[HashMap]\nM --> O[TreeMap]\nM --> P[LinkedHashMap]"}
      />

      <h2>List Interface</h2>
      <p>
        A <code>List</code> is an ordered collection that allows duplicate elements. You can
        access elements by their integer index. The two most common implementations are{' '}
        <code>ArrayList</code> and <code>LinkedList</code>.
      </p>

      <CodeBlock language="java" title="ListExamples.java">
{`import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Collections;

public class ListExamples {
    public static void main(String[] args) {
        // ArrayList: backed by a resizable array
        // Best for: random access, iteration
        List<String> fruits = new ArrayList<>();
        fruits.add("Apple");
        fruits.add("Banana");
        fruits.add("Cherry");
        fruits.add("Apple"); // duplicates are allowed

        System.out.println("Fruits: " + fruits);
        System.out.println("First: " + fruits.get(0));
        System.out.println("Size: " + fruits.size());
        System.out.println("Contains Banana: " + fruits.contains("Banana"));

        // Insert at index
        fruits.add(1, "Blueberry");
        System.out.println("After insert: " + fruits);

        // Remove by value and by index
        fruits.remove("Apple");      // removes first occurrence
        fruits.remove(0);            // removes element at index 0
        System.out.println("After removals: " + fruits);

        // Sort and search
        Collections.sort(fruits);
        System.out.println("Sorted: " + fruits);

        // LinkedList: doubly-linked list implementation
        // Best for: frequent insertions/deletions at the ENDS (or via an
        // Iterator already positioned there) — not at an arbitrary index
        LinkedList<Integer> numbers = new LinkedList<>();
        numbers.add(10);
        numbers.add(20);
        numbers.addFirst(5);     // add at beginning — O(1)
        numbers.addLast(30);     // add at end — O(1)

        System.out.println("LinkedList: " + numbers);
        System.out.println("First: " + numbers.getFirst());
        System.out.println("Last: " + numbers.getLast());

        numbers.removeFirst();
        System.out.println("After removeFirst: " + numbers);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="ArrayList vs LinkedList">
        <p>
          Use <code>ArrayList</code> for most cases — it provides O(1) random access by index and
          is faster for iteration due to memory locality. <code>LinkedList</code> is only O(1) for
          work at the <em>ends</em> (<code>addFirst</code>/<code>removeFirst</code>) or through an{' '}
          <code>Iterator</code> that is already positioned. Inserting or removing at an arbitrary
          index is still O(n), because the list has to be walked to reach that position first —
          only the link-rewiring is cheap, not the search. So LinkedList does not beat ArrayList
          &quot;in the middle&quot;; in practice ArrayList is the better default almost every
          time, and <code>ArrayDeque</code> beats LinkedList for end-based work.
        </p>
      </InfoBox>

      <h2>Set Interface</h2>
      <p>
        A <code>Set</code> is a collection that does not allow duplicate elements. It models the
        mathematical set abstraction.
      </p>

      <CodeBlock language="java" title="SetExamples.java">
{`import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.TreeSet;
import java.util.Set;

public class SetExamples {
    public static void main(String[] args) {
        // HashSet: no ordering guarantee, fastest operations
        Set<String> hashSet = new HashSet<>();
        hashSet.add("Dog");
        hashSet.add("Cat");
        hashSet.add("Bird");
        hashSet.add("Dog"); // duplicate — silently ignored
        System.out.println("HashSet: " + hashSet); // order may vary

        // LinkedHashSet: maintains insertion order
        Set<String> linkedSet = new LinkedHashSet<>();
        linkedSet.add("Dog");
        linkedSet.add("Cat");
        linkedSet.add("Bird");
        System.out.println("LinkedHashSet: " + linkedSet); // insertion order

        // TreeSet: sorted order (natural ordering or custom comparator)
        Set<Integer> treeSet = new TreeSet<>();
        treeSet.add(30);
        treeSet.add(10);
        treeSet.add(20);
        treeSet.add(10); // duplicate ignored
        System.out.println("TreeSet: " + treeSet); // [10, 20, 30]

        // Set operations
        Set<Integer> setA = new HashSet<>(Set.of(1, 2, 3, 4, 5));
        Set<Integer> setB = new HashSet<>(Set.of(4, 5, 6, 7, 8));

        // Union
        Set<Integer> union = new HashSet<>(setA);
        union.addAll(setB);
        System.out.println("Union: " + union);

        // Intersection
        Set<Integer> intersection = new HashSet<>(setA);
        intersection.retainAll(setB);
        System.out.println("Intersection: " + intersection);

        // Difference
        Set<Integer> difference = new HashSet<>(setA);
        difference.removeAll(setB);
        System.out.println("Difference: " + difference);
    }
}`}
      </CodeBlock>

      <h2>Map Interface</h2>
      <p>
        A <code>Map</code> stores key-value pairs. Each key is unique, and each key maps to
        exactly one value. Maps are not part of the <code>Collection</code> interface but are a
        core part of the Collections Framework.
      </p>

      <CodeBlock language="java" title="MapExamples.java">
{`import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.TreeMap;
import java.util.Map;

public class MapExamples {
    public static void main(String[] args) {
        // HashMap: no ordering, fastest for lookup/insert
        Map<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 95);
        scores.put("Bob", 87);
        scores.put("Charlie", 92);
        scores.put("Alice", 98); // overwrites existing value for "Alice"

        System.out.println("Scores: " + scores);
        System.out.println("Alice's score: " + scores.get("Alice"));
        System.out.println("Contains Bob: " + scores.containsKey("Bob"));
        System.out.println("Size: " + scores.size());

        // getOrDefault — avoid null when key is missing
        int daveScore = scores.getOrDefault("Dave", 0);
        System.out.println("Dave's score: " + daveScore);

        // putIfAbsent — only inserts if key is not already present
        scores.putIfAbsent("Dave", 78);
        scores.putIfAbsent("Alice", 50); // Alice exists, so this is ignored

        // Iterating over a Map
        System.out.println("\\nAll entries:");
        for (Map.Entry<String, Integer> entry : scores.entrySet()) {
            System.out.println("  " + entry.getKey() + " -> " + entry.getValue());
        }

        // Iterate over keys only
        for (String name : scores.keySet()) {
            System.out.println("  Student: " + name);
        }

        // TreeMap: sorted by keys
        Map<String, Integer> sortedScores = new TreeMap<>(scores);
        System.out.println("\\nSorted by name: " + sortedScores);

        // Remove and replace
        scores.remove("Bob");
        scores.replace("Charlie", 92, 95); // only replaces if current value matches
        System.out.println("After modifications: " + scores);
    }
}`}
      </CodeBlock>

      <h2>Iterating Collections</h2>

      <CodeBlock language="java" title="IterationPatterns.java">
{`import java.util.List;
import java.util.Iterator;

public class IterationPatterns {
    public static void main(String[] args) {
        List<String> items = List.of("Alpha", "Bravo", "Charlie", "Delta");

        // 1. Enhanced for-each loop (most common)
        for (String item : items) {
            System.out.println(item);
        }

        // 2. Traditional for loop with index
        for (int i = 0; i < items.size(); i++) {
            System.out.println(i + ": " + items.get(i));
        }

        // 3. Iterator (useful when you need to remove during iteration)
        List<String> mutable = new java.util.ArrayList<>(items);
        Iterator<String> it = mutable.iterator();
        while (it.hasNext()) {
            String value = it.next();
            if (value.startsWith("C")) {
                it.remove(); // safe removal during iteration
            }
        }
        System.out.println("After removal: " + mutable);

        // 4. forEach with lambda (Java 8+)
        items.forEach(item -> System.out.println("Lambda: " + item));

        // 5. forEach with method reference
        items.forEach(System.out::println);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="ConcurrentModificationException">
        <p>
          Never modify a collection (add or remove elements) while iterating over it with a
          for-each loop — it normally throws a <code>ConcurrentModificationException</code>. Use an{' '}
          <code>Iterator</code> and its <code>remove()</code> method for safe removal during
          iteration, or use <code>removeIf()</code> for simple predicate-based removal.
        </p>
        <p>
          The detection is <strong>fail-fast, not guaranteed</strong>, and the gap is worth knowing
          because it is the dangerous case. Removing the <em>second-to-last</em> element of an{' '}
          <code>ArrayList</code> throws nothing at all: <code>remove</code> decrements the size,{' '}
          <code>hasNext()</code> compares cursor to the new size, finds them equal and reports the
          loop is finished — so the check that would have thrown never runs, and the last element
          is silently skipped.
        </p>
        <CodeBlock language="java" title="Verified on JDK 26 — no exception, and 'd' is never visited">
{`List<String> b = new ArrayList<>(List.of("a", "b", "c", "d"));
for (String s : b) {
    if (s.equals("c")) b.remove(s);   // second-to-last
}
// No ConcurrentModificationException. b == [a, b, d]

// Remove "a" instead and you DO get ConcurrentModificationException.`}
        </CodeBlock>
      </InfoBox>

      <h2>Queue and Deque</h2>
      <p>
        A <code>Queue</code> models FIFO (first-in, first-out) access; a <code>Deque</code>{' '}
        (&quot;double-ended queue&quot;) allows adds and removes at both ends, so it works as
        both a queue and a stack. <code>ArrayDeque</code> is the default choice for both —
        it is faster than <code>LinkedList</code> and faster than the legacy{' '}
        <code>Stack</code> class.
      </p>

      <CodeBlock language="java" title="QueueAndDeque.java">
{`import java.util.*;

public class QueueAndDeque {
    public static void main(String[] args) {
        // Queue — FIFO. Prefer the offer/poll/peek family: they return a
        // sentinel instead of throwing when the queue is empty or full.
        Queue<String> queue = new ArrayDeque<>();
        queue.offer("first");
        queue.offer("second");
        System.out.println(queue.peek());  // "first" — look, don't remove
        System.out.println(queue.poll());  // "first" — remove and return
        System.out.println(queue.poll());  // "second"
        System.out.println(queue.poll());  // null — empty, no exception

        // add/remove/element throw instead of returning null:
        // queue.remove();  // NoSuchElementException on an empty queue

        // Deque as a stack — LIFO. Use this, NOT java.util.Stack.
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1);      // == addFirst
        stack.push(2);
        System.out.println(stack.pop());   // 2 == removeFirst

        // PriorityQueue — always polls the "smallest" element by the comparator.
        // NOT sorted when you iterate or print it; only poll() order is ordered.
        Queue<Task> byPriority = new PriorityQueue<>(
            Comparator.comparingInt(Task::priority));
        byPriority.offer(new Task("low", 10));
        byPriority.offer(new Task("urgent", 1));
        System.out.println(byPriority.poll().name());  // "urgent"
    }

    record Task(String name, int priority) {}
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Stack and Vector are legacy">
        <p>
          <code>java.util.Stack</code> extends <code>Vector</code>, which synchronizes every
          method — you pay for locking you almost never need, and its iteration order is
          bottom-to-top, which surprises everyone. Use <code>ArrayDeque</code> for stacks and{' '}
          <code>ArrayList</code> instead of <code>Vector</code>. Same for{' '}
          <code>Hashtable</code>: use <code>HashMap</code>, or{' '}
          <code>ConcurrentHashMap</code> if you genuinely need thread safety.
        </p>
      </InfoBox>

      <h2>equals() and hashCode() — The Contract</h2>
      <p>
        <code>HashMap</code>, <code>HashSet</code>, and <code>LinkedHashSet</code> locate
        elements by hash code first and only then compare with <code>equals()</code>. If your
        class breaks the contract between those two methods, hash-based collections silently
        lose your data — <code>contains()</code> returns false for an object that is
        &quot;in&quot; the set. This is one of the most common real-world Java bugs and a
        near-guaranteed interview question.
      </p>
      <InfoBox variant="danger" title="The contract, in three rules">
        <ul>
          <li>If <code>a.equals(b)</code>, then <code>a.hashCode() == b.hashCode()</code>{' '}
              — <strong>always</strong>.</li>
          <li>Equal hash codes do <em>not</em> imply equality (collisions are legal and
              normal).</li>
          <li>Both must be computed from fields that <strong>do not change</strong> while the
              object is in a hash-based collection.</li>
        </ul>
      </InfoBox>

      <CodeBlock language="java" title="EqualsHashCode.java">
{`import java.util.*;

public class EqualsHashCode {

    // BROKEN — equals overridden, hashCode not. Compiles fine, fails at runtime.
    static class BadPoint {
        final int x, y;
        BadPoint(int x, int y) { this.x = x; this.y = y; }

        @Override public boolean equals(Object o) {
            return o instanceof BadPoint p && p.x == x && p.y == y;
        }
        // no hashCode() — inherits Object's identity hash
    }

    // CORRECT — both overridden, from the same fields.
    static final class GoodPoint {
        private final int x, y;
        GoodPoint(int x, int y) { this.x = x; this.y = y; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            // Pattern matching for instanceof (Java 16+) handles null AND the cast.
            return o instanceof GoodPoint p && p.x == x && p.y == y;
        }

        @Override public int hashCode() {
            return Objects.hash(x, y);   // varargs helper; handles nulls
        }

        @Override public String toString() {
            return "GoodPoint[" + x + ", " + y + "]";
        }
    }

    // BEST — a record generates equals, hashCode, and toString from its
    // components, correctly and consistently. Reach for this first.
    record BestPoint(int x, int y) {}

    public static void main(String[] args) {
        Set<BadPoint> bad = new HashSet<>();
        bad.add(new BadPoint(1, 2));
        System.out.println(bad.contains(new BadPoint(1, 2)));  // false !!

        Set<GoodPoint> good = new HashSet<>();
        good.add(new GoodPoint(1, 2));
        System.out.println(good.contains(new GoodPoint(1, 2))); // true

        Set<BestPoint> best = new HashSet<>();
        best.add(new BestPoint(1, 2));
        System.out.println(best.contains(new BestPoint(1, 2))); // true
    }
}`}
      </CodeBlock>

      <h3>Why <code>contains</code> returns false: what happens inside the HashMap</h3>
      <p>
        That <code>false</code> is worth more than the rule that predicts it. &quot;Always
        override <code>hashCode</code> when you override <code>equals</code>&quot; is memorisable
        but forgettable; the mechanism is neither. Here is what a{' '}
        <code>HashSet</code>/<code>HashMap</code> actually does on every lookup.
      </p>
      <p>
        The map holds an array of buckets — 16 of them by default. To find a key it does three
        things, <strong>in this order</strong>:
      </p>
      <ol>
        <li>
          Call <code>key.hashCode()</code> and stir the bits (<code>h ^ (h &gt;&gt;&gt; 16)</code>,
          so that high bits influence the result), giving a <em>stored hash</em>.
        </li>
        <li>
          Take that hash modulo the table size to pick <strong>one bucket</strong>, and look only
          inside it. This is the whole point of a hash table — it is what makes lookup O(1)
          instead of a scan of every element.
        </li>
        <li>
          Walk that bucket&apos;s entries. For each one, compare the <em>stored hash</em> first,
          and only call <code>equals()</code> if the hashes match.
        </li>
      </ol>
      <p>
        Now put <code>BadPoint</code> through it. It inherits <code>Object.hashCode()</code>, which
        is derived from object identity, so two distinct-but-equal instances produce two unrelated
        numbers:
      </p>

      <CodeBlock language="java" title="The two hash codes of two equal objects">
{`BadPoint a = new BadPoint(1, 2);
BadPoint b = new BadPoint(1, 2);

a.equals(b);      // true          — your equals() says they are the same
a.hashCode();     // 293907205     — identity-derived, arbitrary
b.hashCode();     // 1794717576    — a completely unrelated number

// (exact values vary per object and per run — that is precisely the problem)`}
      </CodeBlock>

      <p>
        Step 1 produces a different hash for <code>b</code> than was stored for <code>a</code>.
        Step 2 therefore usually probes a different bucket entirely — and even when the two
        collide into the <em>same</em> bucket by luck, step 3 rejects the entry on the stored-hash
        comparison before it ever reaches <code>equals()</code>.
      </p>
      <p>
        Which leads to the detail that makes the whole thing click. Put a print statement inside{' '}
        <code>BadPoint.equals</code> and run the lookup:
      </p>

      <CodeBlock language="java" title="Your equals() is never called at all">
{`@Override public boolean equals(Object o) {
    System.out.println("   >> equals() was called");
    return o instanceof BadPoint p && p.x == x && p.y == y;
}

Set<BadPoint> set = new HashSet<>();
set.add(new BadPoint(1, 2));
System.out.println(set.contains(new BadPoint(1, 2)));

// Output:
//   false
//
// That is the ENTIRE output. ">> equals() was called" never prints.`}
      </CodeBlock>

      <InfoBox variant="danger" title="The consequence people miss">
        <p>
          The carefully written <code>equals()</code> is not being <em>overruled</em> — it is
          never reached. <code>hashCode()</code> decides <em>where to look</em>, and{' '}
          <code>equals()</code> only settles ties among the handful of entries found there. Get
          the first one wrong and the second never gets a turn.
        </p>
        <p>
          So the failure is worse than &quot;lookups return false&quot;. A{' '}
          <code>HashSet</code> will happily store both objects — <code>size()</code> becomes 2 for
          two objects that are <code>equals()</code> to each other, breaking the one guarantee a
          Set exists to provide. <code>map.put(key, v)</code> twice creates two entries instead of
          replacing one. And <code>remove()</code> cannot find the object either, so it leaks.
        </p>
        <p>
          This also explains why the reverse omission is harmless-but-useless: overriding{' '}
          <code>hashCode</code> without <code>equals</code> sends equal-valued objects to the
          right bucket, where <code>Object.equals</code> then rejects them on identity anyway.
          The two methods are one mechanism, which is why the language ties them together.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="Mutable keys are a data-loss bug">
        <p>
          If you put an object into a <code>HashSet</code> or use it as a{' '}
          <code>HashMap</code> key and then mutate a field that <code>hashCode()</code>{' '}
          depends on, the object lands in the wrong bucket. It becomes unreachable — you
          cannot find it, and you cannot remove it, but it still occupies memory and still
          shows up when you iterate. <strong>Keys should be immutable.</strong> Records are
          ideal keys for exactly this reason.
        </p>
      </InfoBox>

      <h2>Sorting with Comparator</h2>
      <p>
        <code>Comparable</code> defines a type&apos;s single <em>natural</em> ordering
        (implemented on the class itself). <code>Comparator</code> defines any number of
        external orderings, and since Java 8 you build them by composition rather than by
        writing <code>compare()</code> by hand.
      </p>

      <CodeBlock language="java" title="Comparators.java">
{`import java.util.*;

record Employee(String name, String dept, int salary, LocalDate hiredOn) {}

List<Employee> staff = new ArrayList<>(...);

// Single key
staff.sort(Comparator.comparing(Employee::name));

// Descending
staff.sort(Comparator.comparing(Employee::salary).reversed());

// Multi-key: department ascending, then salary descending, then name
staff.sort(Comparator.comparing(Employee::dept)
                     .thenComparing(Employee::salary, Comparator.reverseOrder())
                     .thenComparing(Employee::name));

// Primitive-specialized variants avoid boxing on every comparison
staff.sort(Comparator.comparingInt(Employee::salary));

// Null-safe: decide whether nulls sort first or last
staff.sort(Comparator.comparing(Employee::name,
        Comparator.nullsLast(Comparator.naturalOrder())));

// Case-insensitive strings
names.sort(String.CASE_INSENSITIVE_ORDER);

// Natural ordering comes from Comparable
record Version(int major, int minor) implements Comparable<Version> {
    @Override public int compareTo(Version o) {
        return Comparator.comparingInt(Version::major)
                         .thenComparingInt(Version::minor)
                         .compare(this, o);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Never subtract to compare">
        <p>
          <code>(a, b) -&gt; a.value() - b.value()</code> looks harmless and is a real bug:
          subtracting two large ints overflows and flips the sign, so the sort silently
          produces wrong order (and can throw{' '}
          <code>&quot;Comparison method violates its general contract!&quot;</code>). Always
          use <code>Integer.compare(a, b)</code> or{' '}
          <code>Comparator.comparingInt(...)</code>.
        </p>
      </InfoBox>

      <h2>Immutable and Unmodifiable Collections</h2>
      <p>
        Three different things are easy to confuse here, and the differences bite in real
        code:
      </p>

      <CodeBlock language="java" title="Immutability.java">
{`// 1. List.of / Set.of / Map.of (Java 9+) — truly IMMUTABLE.
//    Also: null-hostile (throws NPE on a null element) and Set.of/Map.of
//    throw IllegalArgumentException on duplicate keys.
List<String> immutable = List.of("a", "b");
// immutable.add("c");        // UnsupportedOperationException
// List.of("a", null);        // NullPointerException

// 2. Arrays.asList — FIXED-SIZE VIEW backed by the array. You can set(),
//    you cannot add() or remove(), and writes pass through to the array.
String[] arr = {"a", "b"};
List<String> view = Arrays.asList(arr);
view.set(0, "z");             // legal — and arr[0] is now "z" too
// view.add("c");             // UnsupportedOperationException

// 3. Collections.unmodifiableList — an UNMODIFIABLE VIEW of a mutable list.
//    The view rejects writes, but the underlying list can still change
//    underneath you. This is a wrapper, not a copy.
List<String> backing = new ArrayList<>(List.of("a"));
List<String> ro = Collections.unmodifiableList(backing);
backing.add("b");
System.out.println(ro);       // [a, b] — the "unmodifiable" view changed!

// Defensive copy — the safe way to hand out internal state.
List<String> safe = List.copyOf(backing);   // Java 10+, real copy, immutable

// Collecting a stream to an immutable list (Java 16+)
List<String> collected = stream.toList();          // immutable
List<String> mutableResult = stream.collect(Collectors.toCollection(ArrayList::new));`}
      </CodeBlock>

      <h2>Choosing an Implementation</h2>
      <CodeBlock language="text" title="Complexity and when to reach for what">
{`ArrayList            get O(1)   add-at-end amortized O(1)   insert/remove-middle O(n)
                     Default List. Contiguous memory, cache-friendly iteration.

LinkedList           get O(n)   addFirst/addLast O(1)       remove-via-iterator O(1)
                     Rarely the right answer. Use ArrayDeque for queue/stack work.

ArrayDeque           addFirst/addLast/pollFirst/pollLast O(1)   no index access
                     Default Queue AND default Stack.

HashMap / HashSet    get/put/contains O(1) average, O(log n) worst (treeified bins)
                     No ordering. Default Map/Set. Requires correct equals+hashCode.

LinkedHashMap/Set    Same as Hash*, plus predictable insertion order (small extra cost).
                     Also does LRU caches via accessOrder + removeEldestEntry.

TreeMap / TreeSet    get/put/contains O(log n), sorted, needs Comparable or Comparator.
                     Gives you range queries: headMap, tailMap, subMap, floor, ceiling.

PriorityQueue        offer/poll O(log n), peek O(1). Heap — iteration order is NOT sorted.

EnumMap / EnumSet    Array/bitset backed. Dramatically faster than HashMap/HashSet when
                     the key is an enum. Always prefer these for enum keys.

ConcurrentHashMap    Thread-safe, lock-striped. Use computeIfAbsent/merge for atomic
                     read-modify-write instead of get-then-put.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Sizing matters more than you'd think">
        <p>
          <code>new ArrayList&lt;&gt;()</code> and <code>new HashMap&lt;&gt;()</code> start
          small and rehash/regrow as they fill. If you know roughly how many elements you
          will add, pass the capacity: <code>new ArrayList&lt;&gt;(expectedSize)</code> or{' '}
          <code>HashMap.newHashMap(expectedSize)</code> (Java 19+, which accounts for the
          load factor so you don&apos;t have to compute{' '}
          <code>size / 0.75 + 1</code> yourself).
        </p>
      </InfoBox>

      <InfoBox variant="note" title="Java 21 unified the &quot;first/last&quot; vocabulary">
        <p>
          Sequenced collections (<code>SequencedCollection</code>,{' '}
          <code>SequencedSet</code>, <code>SequencedMap</code>) give every ordered type the
          same <code>getFirst()</code>, <code>getLast()</code>, <code>addFirst()</code>,{' '}
          <code>addLast()</code>, and <code>reversed()</code> methods — so{' '}
          <code>list.getFirst()</code> replaces <code>list.get(0)</code>. See the{' '}
          <em>Advanced Java Features</em> lesson for the full picture.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="You add an object to a HashSet, then change a field that its hashCode() is computed from. What happens?"
        options={[
          "The set automatically rehashes the object into the correct bucket",
          "The object becomes unreachable — contains() and remove() fail, but it still appears when you iterate",
          "The set throws ConcurrentModificationException on the next operation",
          "Nothing — HashSet caches the hash code at insertion time and keeps using it"
        ]}
        correctIndex={1}
        explanation="HashSet places the object in a bucket derived from its hash code at insertion time. Mutating a hash-relevant field changes what hashCode() returns, so lookups now probe a different bucket than the one holding the object. contains() and remove() both fail, yet iteration still walks every bucket and finds it — a genuinely confusing bug. The rule: keys and set elements must be immutable in their hash-relevant fields. Records are ideal here because their components are final."
      />

      <InteractiveChallenge
        question="Which collection should you use if you need unique elements stored in sorted order?"
        options={[
          "ArrayList",
          "HashSet",
          "TreeSet",
          "LinkedHashMap"
        ]}
        correctIndex={2}
        explanation="TreeSet implements the Set interface (unique elements) and stores elements in sorted order using their natural ordering or a custom Comparator. HashSet provides uniqueness but no ordering. ArrayList allows duplicates. LinkedHashMap is a Map, not a Set, and maintains insertion order of key-value pairs."
      />
    </LessonLayout>
  );
}

export default Collections;
