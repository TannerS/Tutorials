import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaCCollections() {
  return (
    <LessonLayout
      title="Collections Cheat Sheet"
      sectionId="java-cheatsheet"
      lessonIndex={1}
      prev={{ path: "/java-cheatsheet/syntax", label: "Java Syntax Cheat Sheet" }}
      next={{ path: "/java-cheatsheet/streams", label: "Streams Cheat Sheet" }}
    >
      <p>Quick reference for Java Collections Framework — choosing the right collection, key operations, and performance characteristics.</p>

      <h2>Collection Hierarchy</h2>
      <FlowChart
        title="Collections Hierarchy"
        chart={"graph TD\n  A[Collection] --> B[List]\n  A --> C[Set]\n  A --> D[Queue]\n  B --> E[ArrayList]\n  B --> F[LinkedList]\n  C --> G[HashSet]\n  C --> H[TreeSet]\n  C --> I[LinkedHashSet]\n  D --> J[PriorityQueue]\n  K[Map] --> L[HashMap]\n  K --> M[TreeMap]\n  K --> N[LinkedHashMap]"}
      />

      <CodeBlock language="java" title="Collection Selection Guide">
{`// LIST — ordered, duplicates allowed
ArrayList<String> al  = new ArrayList<>();   // fast random access O(1), slow insert middle O(n)
LinkedList<String> ll = new LinkedList<>();   // fast insert/delete at ends O(1), slow access O(n)
List<String> immutable = List.of("a","b","c"); // Java 9+, truly immutable

// SET — unique elements
HashSet<String>       hs = new HashSet<>();        // O(1) add/contains, no order
LinkedHashSet<String> ls = new LinkedHashSet<>();  // O(1), insertion order preserved
TreeSet<String>       ts = new TreeSet<>();        // O(log n), sorted order

// MAP — key-value pairs
HashMap<String,Integer>       hm = new HashMap<>();       // O(1) get/put, no order
LinkedHashMap<String,Integer> lm = new LinkedHashMap<>(); // O(1), insertion order
TreeMap<String,Integer>       tm = new TreeMap<>();        // O(log n), sorted by key
Map<String,Integer> immutable2   = Map.of("a",1,"b",2);  // immutable, Java 9+

// QUEUE / DEQUE
PriorityQueue<Integer> pq = new PriorityQueue<>();        // min-heap by default
ArrayDeque<String>     dq = new ArrayDeque<>();           // fast stack/queue, prefer over Stack

// Thread-safe collections
ConcurrentHashMap<String,Integer> chm = new ConcurrentHashMap<>();
CopyOnWriteArrayList<String>      cow = new CopyOnWriteArrayList<>();
BlockingQueue<Task> bq = new LinkedBlockingQueue<>(100);`}
      </CodeBlock>

      <CodeBlock language="java" title="Essential Operations">
{`List<String> names = new ArrayList<>(List.of("Charlie","Alice","Bob"));

// Sort
Collections.sort(names);                           // mutates, natural order
names.sort(Comparator.naturalOrder());             // same
names.sort(Comparator.comparingInt(String::length) // by length then alpha
           .thenComparing(Comparator.naturalOrder()));

// Search
int idx    = Collections.binarySearch(names, "Alice"); // requires sorted list
boolean has = names.contains("Bob");

// Bulk ops
List<String> copy    = new ArrayList<>(names);
List<String> sub     = names.subList(0, 2);      // view, not copy
List<String> unmod   = Collections.unmodifiableList(names);
List<String> reversed = names.reversed();        // Java 21+

// Map patterns
Map<String,Integer> scores = new HashMap<>();
scores.put("Alice", 95);
scores.putIfAbsent("Alice", 0);                  // only if key absent
scores.merge("Alice", 5, Integer::sum);          // add 5 to existing
scores.computeIfAbsent("Bob", k -> 0);           // compute if missing
int score = scores.getOrDefault("Carol", 0);     // safe get

// Frequency / grouping
Map<String,Long> freq = names.stream()
    .collect(Collectors.groupingBy(s -> s, Collectors.counting()));`}
      </CodeBlock>

      <InteractiveChallenge
        question="When should you use LinkedHashMap instead of HashMap?"
        options={["When you need O(log n) sorted key access", "When you need to preserve insertion order while maintaining O(1) performance", "When thread safety is required", "When keys are integers"]}
        correctIndex={1}
        explanation="LinkedHashMap maintains insertion order (or access order with the LRU constructor) while keeping O(1) get/put performance. Use it when you need predictable iteration order — e.g., building an ordered JSON object, implementing an LRU cache, or anywhere order matters but sorting overhead is unacceptable."
      />

    </LessonLayout>
  );
}
