import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Collections() {
  return (
    <LessonLayout
      title="Collections Cheat Sheet"
      sectionId="java-cheatsheet"
      lessonIndex={1}
      prev={{ path: '/java-cheatsheet/syntax', label: 'Syntax & Types Quick Ref' }}
      next={{ path: '/java-cheatsheet/streams', label: 'Streams & Lambdas Ref' }}
    >
      {/* ───── HIERARCHY ───── */}
      <h2>Collection Hierarchy</h2>
      <FlowChart
        title="java.util.Collection Family"
        chart={"graph TD\n  Iterable-->Collection\n  Collection-->List\n  Collection-->Set\n  Collection-->Queue\n  List-->ArrayList\n  List-->LinkedList\n  List-->Vector\n  Set-->HashSet\n  Set-->LinkedHashSet\n  Set-->SortedSet\n  SortedSet-->TreeSet\n  Queue-->PriorityQueue\n  Queue-->Deque\n  Deque-->ArrayDeque\n  Deque-->LinkedList2[LinkedList]\n  Map_Interface[Map]-->HashMap\n  Map_Interface-->LinkedHashMap\n  Map_Interface-->SortedMap\n  SortedMap-->TreeMap\n  Map_Interface-->ConcurrentHashMap"}
      />

      <InfoBox variant="info" title="Map is NOT a Collection">
        <code>Map</code> does not extend <code>Collection</code>. It&apos;s a separate hierarchy
        with its own methods (<code>put</code>, <code>get</code>, <code>entrySet</code>).
      </InfoBox>

      {/* ───── LIST ───── */}
      <h2>List Implementations</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Feature</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>ArrayList</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>LinkedList</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Backing structure', 'Resizable array', 'Doubly-linked list'],
            ['get(i)', 'O(1)', 'O(n)'],
            ['add(end)', 'O(1) amortized', 'O(1)'],
            ['add(i, e)', 'O(n)', 'O(1) if at iterator'],
            ['remove(i)', 'O(n)', 'O(1) if at iterator'],
            ['Memory', 'Compact', 'Extra node overhead'],
            ['Use when', 'Random access, most cases', 'Frequent insert/remove at ends'],
          ].map(([feat, al, ll]) => (
            <tr key={feat} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>{feat}</td>
              <td style={{ padding: '6px' }}>{al}</td>
              <td style={{ padding: '6px' }}>{ll}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CodeBlock language="java" title="List Operations">{
`// Creation
List<String> list = new ArrayList<>();
List<String> fixed = List.of("a", "b", "c");           // immutable
List<String> copy  = List.copyOf(existingList);         // immutable copy
List<String> mutable = new ArrayList<>(List.of("a"));   // mutable from immutable

// Common ops
list.add("x");             list.add(0, "front");
list.get(0);               list.set(0, "new");
list.remove("x");          list.remove(0);
list.contains("x");        list.indexOf("x");
list.size();               list.isEmpty();
list.sort(Comparator.naturalOrder());
list.subList(0, 2);        // view, not copy

// Iteration
list.forEach(System.out::println);
for (var item : list) { /* ... */ }
list.stream().filter(s -> s.startsWith("a")).toList();`
      }</CodeBlock>

      {/* ───── SET ───── */}
      <h2>Set Implementations</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Feature</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>HashSet</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>LinkedHashSet</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>TreeSet</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Order', 'None', 'Insertion order', 'Sorted (natural/comparator)'],
            ['add/remove/contains', 'O(1)', 'O(1)', 'O(log n)'],
            ['Null allowed?', 'Yes (one)', 'Yes (one)', 'No (comparator issue)'],
            ['Backing', 'HashMap', 'LinkedHashMap', 'Red-black tree'],
          ].map(([feat, hs, lhs, ts]) => (
            <tr key={feat} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>{feat}</td>
              <td style={{ padding: '6px' }}>{hs}</td>
              <td style={{ padding: '6px' }}>{lhs}</td>
              <td style={{ padding: '6px' }}>{ts}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CodeBlock language="java" title="Set Operations">{
`Set<String> set = new HashSet<>();
Set<String> immut = Set.of("a", "b", "c"); // immutable, no dupes allowed

// Set algebra
Set<String> a = Set.of("x", "y", "z");
Set<String> b = Set.of("y", "z", "w");

var union = new HashSet<>(a);  union.addAll(b);      // [x,y,z,w]
var inter = new HashSet<>(a);  inter.retainAll(b);    // [y,z]
var diff  = new HashSet<>(a);  diff.removeAll(b);     // [x]`
      }</CodeBlock>

      {/* ───── MAP ───── */}
      <h2>Map Implementations</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Feature</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>HashMap</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>LinkedHashMap</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>TreeMap</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>ConcurrentHashMap</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Order', 'None', 'Insertion', 'Key-sorted', 'None'],
            ['get/put', 'O(1)', 'O(1)', 'O(log n)', 'O(1)'],
            ['Null key?', 'Yes', 'Yes', 'No', 'No'],
            ['Thread-safe?', 'No', 'No', 'No', 'Yes'],
          ].map(([feat, hm, lhm, tm, chm]) => (
            <tr key={feat} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>{feat}</td>
              <td style={{ padding: '6px' }}>{hm}</td>
              <td style={{ padding: '6px' }}>{lhm}</td>
              <td style={{ padding: '6px' }}>{tm}</td>
              <td style={{ padding: '6px' }}>{chm}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CodeBlock language="java" title="Map Operations">{
`Map<String, Integer> map = new HashMap<>();
Map<String, Integer> immut = Map.of("a", 1, "b", 2);
Map<String, Integer> entries = Map.ofEntries(
    Map.entry("a", 1), Map.entry("b", 2) // >10 entries
);

// CRUD
map.put("key", 1);
map.get("key");                    // 1 or null
map.getOrDefault("missing", 0);   // 0
map.containsKey("key");
map.remove("key");

// Compute patterns
map.putIfAbsent("k", 0);
map.computeIfAbsent("k", k -> expensiveCalc(k));
map.computeIfPresent("k", (k, v) -> v + 1);
map.merge("k", 1, Integer::sum);  // increment or init to 1

// Iteration
map.forEach((k, v) -> System.out.println(k + "=" + v));
for (var entry : map.entrySet()) {
    entry.getKey(); entry.getValue();
}
map.keySet();   map.values();   map.entrySet();`
      }</CodeBlock>

      {/* ───── QUEUE / DEQUE ───── */}
      <h2>Queue &amp; Deque</h2>
      <CodeBlock language="java" title="Queue / Deque Quick Reference">{
`// Queue (FIFO) — prefer ArrayDeque over LinkedList
Queue<String> q = new ArrayDeque<>();
q.offer("a");   // add to tail (returns false if full)
q.poll();        // remove from head (null if empty)
q.peek();        // look at head (null if empty)

// PriorityQueue — min-heap by default
Queue<Integer> pq = new PriorityQueue<>();
pq.offer(3); pq.offer(1); pq.offer(2);
pq.poll();  // 1 (smallest first)

// Max-heap
Queue<Integer> maxPq = new PriorityQueue<>(Comparator.reverseOrder());

// Deque (double-ended)
Deque<String> deque = new ArrayDeque<>();
deque.offerFirst("front");   deque.offerLast("back");
deque.pollFirst();           deque.pollLast();
deque.peekFirst();           deque.peekLast();

// Use Deque as Stack (prefer over java.util.Stack)
Deque<String> stack = new ArrayDeque<>();
stack.push("a");   // addFirst
stack.pop();       // removeFirst
stack.peek();      // peekFirst`
      }</CodeBlock>

      <InfoBox variant="tip" title="ArrayDeque vs LinkedList">
        <code>ArrayDeque</code> is faster than <code>LinkedList</code> for both queue and stack use.
        It has no node overhead and better cache locality. Only use <code>LinkedList</code> if you need
        null elements (ArrayDeque forbids them).
      </InfoBox>

      {/* ───── DECISION TABLE ───── */}
      <h2>When to Use What</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Need</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Use</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Ordered list, fast random access', 'ArrayList'],
            ['Unique elements, no order', 'HashSet'],
            ['Unique elements, sorted', 'TreeSet'],
            ['Unique elements, insertion order', 'LinkedHashSet'],
            ['Key-value, fast lookup', 'HashMap'],
            ['Key-value, sorted keys', 'TreeMap'],
            ['Key-value, insertion order', 'LinkedHashMap'],
            ['Thread-safe map', 'ConcurrentHashMap'],
            ['FIFO queue', 'ArrayDeque'],
            ['Priority queue (min/max)', 'PriorityQueue'],
            ['Stack (LIFO)', 'ArrayDeque (push/pop)'],
            ['Immutable list/set/map', 'List.of / Set.of / Map.of'],
          ].map(([need, use]) => (
            <tr key={need} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px' }}>{need}</td>
              <td style={{ padding: '6px', fontFamily: 'monospace', color: '#5b9cf6' }}>{use}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ───── COLLECTIONS UTILITY ───── */}
      <h2>Collections Utility Methods</h2>
      <CodeBlock language="java" title="java.util.Collections">{
`Collections.sort(list);
Collections.sort(list, Comparator.reverseOrder());
Collections.reverse(list);
Collections.shuffle(list);
Collections.frequency(list, "target");       // count occurrences
Collections.disjoint(list1, list2);          // true if no common elements
Collections.min(collection);
Collections.max(collection, comparator);

// Thread-safe wrappers (legacy — prefer Concurrent* classes)
List<String> syncList = Collections.synchronizedList(new ArrayList<>());
Map<K,V> syncMap = Collections.synchronizedMap(new HashMap<>());

// Immutable wrappers (throw UnsupportedOperationException on mutation)
List<String> unmod = Collections.unmodifiableList(list);
// Java 10+ prefer: List.copyOf(list)`
      }</CodeBlock>

      {/* ───── IMMUTABLE COLLECTIONS ───── */}
      <h2>Immutable Collections (Java 9+)</h2>
      <CodeBlock language="java" title="Factory methods">{
`// List.of — up to 10 elements, or varargs
List<String> l = List.of("a", "b", "c");

// Set.of — no duplicates allowed, throws IllegalArgumentException
Set<Integer> s = Set.of(1, 2, 3);

// Map.of — up to 10 key-value pairs
Map<String, Integer> m = Map.of("a", 1, "b", 2);

// Map.ofEntries — unlimited entries
Map<String, Integer> m2 = Map.ofEntries(
    entry("a", 1), entry("b", 2), entry("c", 3)
);

// All throw UnsupportedOperationException on add/put/remove
// All disallow null keys and values
// To convert to mutable: new ArrayList<>(List.of(...))`
      }</CodeBlock>

      {/* ───── CHALLENGE ───── */}
      <InteractiveChallenge
        question={"What is the time complexity of HashMap.get() in the average case?"}
        options={["O(n)", "O(log n)", "O(1)", "O(n log n)"]}
        correctIndex={2}
        explanation={"HashMap uses hash-based bucket lookup giving O(1) average case. Worst case is O(log n) since Java 8 (buckets convert to trees when they grow large), previously O(n)."}
        language="java"
      />

      <InteractiveChallenge
        question={"Which collection should you use as a Stack in modern Java?"}
        options={["java.util.Stack", "LinkedList", "ArrayDeque", "Vector"]}
        correctIndex={2}
        explanation={"ArrayDeque is the recommended Stack implementation. java.util.Stack extends Vector and is synchronized — unnecessary overhead for most cases. ArrayDeque has better performance due to array-based storage."}
        language="java"
      />
    </LessonLayout>
  );
}

export default function CollectionsPage() {
  return <Collections />;
}
