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

    // Self-referential bound: T must be comparable to its own type
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

      <h3>Intersection Bounds — Requiring Several Types at Once</h3>
      <p>
        A type parameter can have <em>multiple</em> bounds joined with <code>&amp;</code>. At most
        one may be a class, and if there is one it must come first; the rest are interfaces. The
        type parameter then has every member of every bound available.
      </p>

      <CodeBlock language="java" title="IntersectionBounds.java">
{`// T must be BOTH Comparable AND Serializable.
public static <T extends Comparable<T> & Serializable> T maxAndPersist(List<T> items) {
    T max = items.get(0);
    for (T item : items) {
        if (item.compareTo(max) > 0) max = item;   // from Comparable
    }
    serialize(max);                                 // legal because T is Serializable
    return max;
}

// Class bound first, then interfaces.
public static <T extends Number & Comparable<T> & Serializable> void audit(T value) { }

// A common real-world shape: "anything that is both a source and closeable"
public static <T extends Iterable<String> & AutoCloseable> void drain(T source)
        throws Exception {
    try (source) {
        for (String line : source) process(line);
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Type Erasure">
        <p>
          Java generics use <strong>type erasure</strong> — the compiler enforces type constraints
          at compile time, then removes all generic type information from the bytecode. At
          runtime, a <code>List&lt;String&gt;</code> and a <code>List&lt;Integer&gt;</code> are
          both just <code>List</code>. The compiler replaces each type variable with its leftmost
          bound (<code>Object</code> if unbounded) and inserts casts at the call sites.
        </p>
      </InfoBox>

      <h3>What Erasure Actually Costs You</h3>
      <p>
        Erasure is not an academic footnote — it produces a specific list of things the compiler
        will refuse to let you write. Knowing them saves hours of confusion.
      </p>

      <CodeBlock language="java" title="ErasureConsequences.java">
{`public class ErasureConsequences<T> {

    // 1. Cannot instantiate a type parameter.
    // T value = new T();                 // COMPILE ERROR
    // Workaround: pass a factory.
    public T create(Supplier<T> factory) { return factory.get(); }

    // 2. Cannot create an array of a parameterized type.
    // List<String>[] arrays = new List<String>[10];   // COMPILE ERROR
    // Workaround: use a List<List<String>> instead.

    // 3. Cannot use instanceof with a parameterized type.
    // if (obj instanceof List<String>) { }            // COMPILE ERROR
    if (obj instanceof List<?> list) { }               // OK — unbounded wildcard

    // 4. Cannot overload on erased signatures — both erase to process(List).
    // void process(List<String> l) { }
    // void process(List<Integer> l) { }               // COMPILE ERROR: same erasure

    // 5. Cannot have a static field of the type parameter's type.
    // private static T shared;                        // COMPILE ERROR

    // 6. Cannot catch or throw a generic exception type.
    // catch (T e) { }                                 // COMPILE ERROR
    // ...but you CAN declare "throws T" on a method.
}`}
      </CodeBlock>

      <h3>Class Literals as Type Tokens</h3>
      <p>
        Because the type is gone at runtime, APIs that genuinely need it (deserializers, DI
        containers, JDBC mappers) ask you to hand it over explicitly as a{' '}
        <code>Class&lt;T&gt;</code>. This is the <strong>type token</strong> idiom, and you will
        see it constantly in Spring and Jackson.
      </p>

      <CodeBlock language="java" title="TypeTokens.java">
{`// The type token carries T into runtime, where erasure removed it.
public <T> T readJson(String json, Class<T> type) {
    return objectMapper.readValue(json, type);
}

Customer c = readJson(body, Customer.class);

// A heterogeneous container: each key's type guarantees its value's type.
public class TypeSafeRegistry {
    private final Map<Class<?>, Object> store = new HashMap<>();

    public <T> void put(Class<T> type, T instance) {
        store.put(type, type.cast(instance));   // cast() re-checks at runtime
    }

    public <T> T get(Class<T> type) {
        return type.cast(store.get(type));      // safe unchecked-free retrieval
    }
}

// Class<T> can't express nested generics (there is no List<String>.class).
// Jackson solves that with a "super type token" — an anonymous subclass whose
// generic superclass IS reachable by reflection:
List<Customer> customers =
    objectMapper.readValue(json, new TypeReference<List<Customer>>() {});`}
      </CodeBlock>

      <InfoBox variant="warning" title="Heap pollution and @SafeVarargs">
        <p>
          A generic varargs parameter (<code>T... items</code>) is compiled to an array of the
          erased type, so the compiler cannot guarantee it holds only <code>T</code> values — this
          is called <strong>heap pollution</strong>, and it produces an &quot;unchecked generic
          array creation&quot; warning at every call site. If your method only <em>reads</em> the
          varargs array and never stores it or exposes it, annotate it with{' '}
          <code>@SafeVarargs</code> to assert that and silence the warning. The annotation is only
          legal on methods that cannot be overridden: <code>static</code>, <code>final</code>, or{' '}
          <code>private</code> methods, and constructors.
        </p>
      </InfoBox>

      <h2>Invariance — Why Wildcards Exist At All</h2>
      <p>
        Arrays in Java are <strong>covariant</strong>: a <code>String[]</code> is usable as an{' '}
        <code>Object[]</code>. That was a deliberate but unsound choice — it lets you write code
        that compiles and then fails at runtime. Generics fixed it by being{' '}
        <strong>invariant</strong>: a <code>List&lt;String&gt;</code> is <em>not</em> a{' '}
        <code>List&lt;Object&gt;</code>, even though <code>String</code> is an{' '}
        <code>Object</code>.
      </p>

      <CodeBlock language="java" title="Invariance.java">
{`// Arrays are covariant — and unsound.
Object[] objects = new String[3];    // compiles fine
objects[0] = 42;                     // ArrayStoreException at RUNTIME

// Generics are invariant — the same mistake is caught at compile time.
List<Object> list = new ArrayList<String>();   // COMPILE ERROR
// If this were allowed, list.add(42) would corrupt a List<String>.

// Invariance is safe but rigid: this method only accepts List<Number>,
// not List<Integer> or List<Double>, even though both hold Numbers.
void sumStrict(List<Number> numbers) { }
// sumStrict(List.of(1, 2, 3));       // COMPILE ERROR — List<Integer> != List<Number>

// Wildcards are the release valve that restores the flexibility
// WITHOUT giving up the safety.
void sumFlexible(List<? extends Number> numbers) { }
sumFlexible(List.of(1, 2, 3));        // OK`}
      </CodeBlock>

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
