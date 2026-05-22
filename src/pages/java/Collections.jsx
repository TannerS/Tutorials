import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaCollections() {
  return (
    <LessonLayout
      title="Collections Framework"
      sectionId="java"
      lessonIndex={3}
      prev={{ path: "/java/oop", label: "Object-Oriented Programming" }}
      next={{ path: "/java/generics", label: "Generics" }}
    >
      <p>The Java Collections Framework provides interfaces and implementations for storing groups of objects. Choosing the right collection is critical for performance.</p>

      <FlowChart
        title="Collections Framework Hierarchy"
        chart={"graph TD\n  A[Iterable] --> B[Collection]\n  B --> C[List]\n  B --> D[Set]\n  B --> E[Queue]\n  C --> F[ArrayList]\n  C --> G[LinkedList]\n  D --> H[HashSet]\n  D --> I[TreeSet]\n  E --> J[PriorityQueue]\n  K[Map - separate] --> L[HashMap]\n  K --> M[TreeMap]\n  K --> N[LinkedHashMap]"}
      />

      <h2>List — Ordered, Allows Duplicates</h2>
      <CodeBlock language="java" title="ArrayList and LinkedList">
{`List<String> list = new ArrayList<>();
list.add("Apple");
list.add("Banana");
list.add("Cherry");
list.add(1, "Avocado");       // insert at index 1
list.remove("Banana");        // remove by value
list.remove(0);               // remove by index

System.out.println(list.get(0));        // first element
System.out.println(list.size());        // 2
System.out.println(list.contains("Cherry")); // true
System.out.println(list.indexOf("Cherry"));  // 1

// Iterate
list.forEach(System.out::println);

// Sort
Collections.sort(list);
list.sort(String::compareTo);
list.sort(Comparator.comparingInt(String::length));

// Immutable list (Java 9+)
List<String> immutable = List.of("a", "b", "c");

// LinkedList — efficient add/remove at ends (use as queue/deque)
LinkedList<String> deque = new LinkedList<>();
deque.addFirst("front");
deque.addLast("back");
deque.removeFirst();`}
      </CodeBlock>

      <h2>Set — No Duplicates</h2>
      <CodeBlock language="java" title="HashSet, TreeSet, LinkedHashSet">
{`// HashSet — O(1) operations, no ordering
Set<String> hashSet = new HashSet<>();
hashSet.add("banana");
hashSet.add("apple");
hashSet.add("banana"); // ignored — duplicate
System.out.println(hashSet.size()); // 2

// TreeSet — sorted, O(log n)
Set<Integer> treeSet = new TreeSet<>();
treeSet.add(5); treeSet.add(1); treeSet.add(3);
System.out.println(treeSet); // [1, 3, 5]
System.out.println(((TreeSet<Integer>)treeSet).first()); // 1

// LinkedHashSet — insertion order
Set<String> linked = new LinkedHashSet<>();
linked.add("c"); linked.add("a"); linked.add("b");
System.out.println(linked); // [c, a, b]

// Set operations
Set<Integer> a = new HashSet<>(Set.of(1, 2, 3, 4));
Set<Integer> b = new HashSet<>(Set.of(3, 4, 5, 6));
a.retainAll(b);  // intersection: {3, 4}
a.addAll(b);     // union
a.removeAll(b);  // difference`}
      </CodeBlock>

      <h2>Map — Key-Value Pairs</h2>
      <CodeBlock language="java" title="HashMap and Map Operations">
{`Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 95);
scores.put("Bob", 87);
scores.put("Charlie", 92);
scores.putIfAbsent("Alice", 99); // won't overwrite existing

System.out.println(scores.get("Alice"));          // 95
System.out.println(scores.getOrDefault("Dan", 0));// 0
System.out.println(scores.containsKey("Bob"));    // true

scores.remove("Bob");

// Iterate entries
for (Map.Entry<String, Integer> e : scores.entrySet()) {
    System.out.println(e.getKey() + " -> " + e.getValue());
}

// Functional updates (Java 8+)
scores.merge("Alice", 5, Integer::sum); // 95 + 5 = 100
scores.compute("Charlie", (k, v) -> v + 1);
scores.replaceAll((k, v) -> v + 10);

// TreeMap — sorted by key
Map<String, Integer> sorted = new TreeMap<>(scores);

// Immutable (Java 9+)
Map<String, Integer> fixed = Map.of("a", 1, "b", 2);`}
      </CodeBlock>

      <h2>Queue and Deque</h2>
      <CodeBlock language="java" title="Queue and PriorityQueue">
{`// Queue — FIFO
Queue<String> queue = new LinkedList<>();
queue.offer("first");
queue.offer("second");
System.out.println(queue.peek()); // "first" (no remove)
System.out.println(queue.poll()); // "first" (removes it)

// PriorityQueue — min-heap
PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.offer(5); pq.offer(1); pq.offer(3);
System.out.println(pq.poll()); // 1 (smallest)

// Custom priority
PriorityQueue<String> byLen = new PriorityQueue<>(Comparator.comparingInt(String::length));

// ArrayDeque — stack or queue (faster than LinkedList)
Deque<String> stack = new ArrayDeque<>();
stack.push("first"); stack.push("second");
System.out.println(stack.pop()); // "second" (LIFO)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Quick Selection Guide">
        <p>ArrayList for general ordered lists. LinkedList when inserting/removing at ends frequently. HashSet for fast membership checks. TreeSet for sorted unique elements. HashMap for fast key-value lookup. TreeMap for sorted keys. PriorityQueue for task scheduling. ArrayDeque as a general-purpose stack/queue.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Which collection guarantees sorted order of elements?"
        options={["ArrayList", "HashSet", "TreeSet", "LinkedList"]}
        correctIndex={2}
        explanation="TreeSet stores elements in natural sorted order (or by Comparator). HashSet has no ordering guarantee. ArrayList and LinkedList maintain insertion order but don't sort automatically."
      />

      <InteractiveChallenge
        question="What happens when you add a duplicate to a HashSet?"
        options={["It throws an exception", "It replaces the existing element", "The duplicate is silently ignored", "It adds the duplicate at the end"]}
        correctIndex={2}
        explanation="HashSet silently ignores duplicate additions — the add() method returns false but throws no exception. The set remains unchanged. This behavior is core to the Set contract: no duplicates allowed."
      />
    </LessonLayout>
  );
}
