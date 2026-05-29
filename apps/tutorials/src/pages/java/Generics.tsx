import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Generics() {
  return (
    <LessonLayout
      title="Generics & Type System"
      sectionId="java"
      lessonIndex={4}
      prev={{ path: '/java/collections', label: 'Collections Framework' }}
      next={{ path: '/java/exceptions', label: 'Exception Handling' }}
    >
      <h2>Why Generics?</h2>
      <p>
        Before generics were introduced in Java 5, collections stored objects as the generic{' '}
        <code>Object</code> type. This meant you had to cast objects when retrieving them, and
        type errors were only caught at runtime. Generics add compile-time type safety,
        eliminating the need for explicit casts and catching type mismatches before your code
        ever runs.
      </p>

      <CodeBlock language="java" title="BeforeAndAfterGenerics.java">
{`import java.util.ArrayList;
import java.util.List;

public class BeforeAndAfterGenerics {
    public static void main(String[] args) {
        // BEFORE generics (Java 1.4 style) — unsafe
        List oldList = new ArrayList();
        oldList.add("Hello");
        oldList.add(42); // no compile error, but this is a problem
        String s = (String) oldList.get(0); // explicit cast required
        // String s2 = (String) oldList.get(1); // ClassCastException at runtime!

        // AFTER generics (Java 5+) — type-safe
        List<String> newList = new ArrayList<>();
        newList.add("Hello");
        // newList.add(42); // COMPILE ERROR — caught immediately
        String safe = newList.get(0); // no cast needed
    }
}`}
      </CodeBlock>

      <FlowChart
        title="Generics Type Resolution"
        chart={"graph TD\nA[Generic Code Written] --> B[Compiler Checks Types]\nB --> C{Type Correct?}\nC -->|Yes| D[Type Erasure at Compile Time]\nC -->|No| E[Compile Error]\nD --> F[Bytecode with Object + Casts]\nF --> G[JVM Executes Safely]"}
      />

      <h2>Generic Classes</h2>
      <p>
        A generic class is defined with one or more type parameters in angle brackets. These
        parameters act as placeholders for actual types that are specified when creating an
        instance.
      </p>

      <CodeBlock language="java" title="GenericBox.java">
{`// T is a type parameter — a placeholder for any type
public class Box<T> {
    private T content;

    public Box(T content) {
        this.content = content;
    }

    public T getContent() {
        return content;
    }

    public void setContent(T content) {
        this.content = content;
    }

    @Override
    public String toString() {
        return "Box[" + content + "]";
    }
}

// Generic class with multiple type parameters
public class Pair<K, V> {
    private K key;
    private V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }

    public K getKey() { return key; }
    public V getValue() { return value; }

    @Override
    public String toString() {
        return "(" + key + ", " + value + ")";
    }
}

// Usage
public class GenericDemo {
    public static void main(String[] args) {
        Box<String> stringBox = new Box<>("Hello Generics");
        Box<Integer> intBox = new Box<>(42);
        Box<List<String>> listBox = new Box<>(List.of("a", "b", "c"));

        System.out.println(stringBox.getContent()); // String — no cast
        System.out.println(intBox.getContent());     // Integer — autoboxed

        Pair<String, Integer> entry = new Pair<>("Age", 25);
        System.out.println(entry); // (Age, 25)
    }
}`}
      </CodeBlock>

      <h2>Generic Methods</h2>
      <p>
        You can also define generic type parameters on individual methods, even if the class
        itself is not generic.
      </p>

      <CodeBlock language="java" title="GenericMethods.java">
{`import java.util.List;
import java.util.ArrayList;

public class GenericMethods {

    // Generic method: type parameter <T> declared before return type
    public static <T> void printArray(T[] array) {
        for (T element : array) {
            System.out.print(element + " ");
        }
        System.out.println();
    }

    // Generic method that returns a value
    public static <T> List<T> arrayToList(T[] array) {
        List<T> list = new ArrayList<>();
        for (T element : array) {
            list.add(element);
        }
        return list;
    }

    // Multiple type parameters
    public static <T, U> void printPair(T first, U second) {
        System.out.println("First: " + first + ", Second: " + second);
    }

    public static void main(String[] args) {
        Integer[] numbers = {1, 2, 3, 4, 5};
        String[] words = {"Hello", "World"};

        printArray(numbers); // Java infers T as Integer
        printArray(words);   // Java infers T as String

        List<Integer> numList = arrayToList(numbers);
        System.out.println(numList);

        printPair("Name", 42); // T=String, U=Integer
    }
}`}
      </CodeBlock>

      <h2>Bounded Type Parameters</h2>
      <p>
        Sometimes you want to restrict what types can be used with a generic. Bounded type
        parameters let you specify that a type must be a subclass of a particular class or
        implement a particular interface.
      </p>

      <CodeBlock language="java" title="BoundedTypes.java">
{`public class BoundedTypes {

    // Upper bound: T must be a Number or subclass of Number
    public static <T extends Number> double sum(List<T> list) {
        double total = 0;
        for (T element : list) {
            total += element.doubleValue(); // Number methods are available
        }
        return total;
    }

    // Multiple bounds: T must extend Comparable AND implement Serializable
    public static <T extends Comparable<T>> T findMax(List<T> list) {
        if (list.isEmpty()) throw new IllegalArgumentException("Empty list");
        T max = list.get(0);
        for (T element : list) {
            if (element.compareTo(max) > 0) {
                max = element;
            }
        }
        return max;
    }

    public static void main(String[] args) {
        List<Integer> ints = List.of(1, 2, 3, 4, 5);
        List<Double> doubles = List.of(1.5, 2.5, 3.5);

        System.out.println("Sum of ints: " + sum(ints));       // 15.0
        System.out.println("Sum of doubles: " + sum(doubles)); // 7.5
        System.out.println("Max int: " + findMax(ints));        // 5

        // sum(List.of("a", "b")); // COMPILE ERROR: String is not a Number
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Type Erasure">
        <p>
          Java generics use <strong>type erasure</strong> — the compiler enforces type constraints
          at compile time, then removes all generic type information from the bytecode. At
          runtime, a <code>List&lt;String&gt;</code> and a <code>List&lt;Integer&gt;</code> are
          both just <code>List</code>. This means you cannot use <code>instanceof</code> with
          generic types or create arrays of generic types directly.
        </p>
      </InfoBox>

      <h2>Wildcards and PECS</h2>
      <p>
        Wildcards (<code>?</code>) are used in generic type arguments when you want flexibility
        in what types a method accepts. The PECS principle (Producer Extends, Consumer Super)
        guides when to use each type of wildcard.
      </p>

      <CodeBlock language="java" title="Wildcards.java">
{`import java.util.List;
import java.util.ArrayList;

public class Wildcards {

    // Unbounded wildcard: accepts List of any type
    public static void printList(List<?> list) {
        for (Object element : list) {
            System.out.print(element + " ");
        }
        System.out.println();
    }

    // Upper-bounded wildcard (Producer Extends):
    // "Reads" from the list — the list PRODUCES Number values
    public static double sumAll(List<? extends Number> numbers) {
        double total = 0;
        for (Number n : numbers) {
            total += n.doubleValue();
        }
        return total;
        // numbers.add(42); // COMPILE ERROR — cannot add to "? extends"
    }

    // Lower-bounded wildcard (Consumer Super):
    // "Writes" to the list — the list CONSUMES Integer values
    public static void addNumbers(List<? super Integer> list) {
        list.add(1);
        list.add(2);
        list.add(3);
        // Integer n = list.get(0); // COMPILE ERROR — get returns Object
    }

    public static void main(String[] args) {
        List<Integer> ints = List.of(1, 2, 3);
        List<Double> doubles = List.of(1.5, 2.5);

        printList(ints);
        printList(doubles);

        System.out.println("Sum ints: " + sumAll(ints));
        System.out.println("Sum doubles: " + sumAll(doubles));

        List<Number> numbers = new ArrayList<>();
        addNumbers(numbers); // works: Number is super of Integer
        System.out.println("Numbers: " + numbers);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="PECS: Producer Extends, Consumer Super">
        <p>
          Use <code>? extends T</code> when you only <strong>read</strong> from a structure (it
          produces T values). Use <code>? super T</code> when you only <strong>write</strong> to
          a structure (it consumes T values). Use an exact type <code>T</code> when you both read
          and write. This principle is the key to writing flexible, reusable generic APIs.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="Given a method that needs to add Integer elements to a list parameter, which wildcard should you use?"
        options={[
          "List<? extends Integer>",
          "List<? super Integer>",
          "List<?>",
          "List<Object>"
        ]}
        correctIndex={1}
        explanation="According to the PECS principle (Producer Extends, Consumer Super), when a method needs to write (consume) values into a collection, you use '? super T'. Using '? extends Integer' would prevent adding elements. '<?>' is equivalent to '? extends Object' and also prevents adding. 'List<Object>' would work but is less flexible — it wouldn't accept List<Number>."
        code={"public static void addIntegers(List<? super Integer> list) {\n    list.add(1);\n    list.add(2);\n}"}
        language="java"
      />
    </LessonLayout>
  );
}

export default Generics;
