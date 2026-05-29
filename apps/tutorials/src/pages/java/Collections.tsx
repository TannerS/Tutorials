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
        // Best for: frequent insertions/deletions at beginning/middle
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
          is faster for iteration due to memory locality. Use <code>LinkedList</code> only when
          you frequently insert or remove elements at the beginning or middle of the list, since
          those operations are O(1) for LinkedList but O(n) for ArrayList. In practice, ArrayList
          is the better default choice for the vast majority of use cases.
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
          for-each loop — this throws a <code>ConcurrentModificationException</code>. Use an{' '}
          <code>Iterator</code> and its <code>remove()</code> method for safe removal during
          iteration, or use <code>removeIf()</code> for simple predicate-based removal.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

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
