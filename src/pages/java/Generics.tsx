import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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

      <p>
        &quot;All generic type information is removed&quot; is a strong claim, so it is worth
        proving rather than believing. Ask two differently-parameterised lists what class they
        are:
      </p>

      <CodeBlock language="java" title="Erasure, observed">
{`List<String>  a = new ArrayList<>();
List<Integer> b = new ArrayList<>();

a.getClass() == b.getClass();     // true
a.getClass().getName();           // "java.util.ArrayList"  — no <String> anywhere

// There is exactly ONE ArrayList class at runtime. <String> is a note the
// compiler keeps for itself and then throws away.`}
      </CodeBlock>

      <p>
        The second half of erasure — &quot;the compiler inserts casts at the call sites&quot; — is
        just as observable. Sneak a wrong value past the compiler using a raw reference, and watch
        where the failure surfaces:
      </p>

      <CodeBlock language="java" title="Where the hidden cast lives">
{`List<String> a = new ArrayList<>();

List raw = a;          // raw type — compiler downgrades to a warning
raw.add(42);           // succeeds! nothing at runtime knows this list is "of String"
a.size();              // 1 — the Integer really is in there

String s = a.get(0);   // ClassCastException: class java.lang.Integer cannot be
                       // cast to class java.lang.String

// Note WHERE it blew up. Nothing in your source casts anything on that line —
// a.get(0) is declared to return String. The cast is the one javac inserted
// for you, and it is the only runtime type checking generics get.`}
      </CodeBlock>

      <InfoBox variant="note" title="Why Java did it this way">
        <p>
          Erasure exists for <strong>migration compatibility</strong>. Generics arrived in Java 5,
          fifteen years into the language&apos;s life, and every existing{' '}
          <code>List</code> in every compiled library had to keep working. Erasing to the same
          bytecode a Java 1.4 compiler produced meant generic and non-generic code could
          interoperate freely, and old <code>.class</code> files kept running untouched.
        </p>
        <p>
          The price is everything in the next section. C# made the opposite choice — reified
          generics, where <code>List&lt;string&gt;</code> is a genuinely distinct runtime type —
          and paid for it by breaking compatibility. Knowing which trade-off Java took is what
          makes the restrictions below feel like consequences rather than arbitrary rules.
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

    // 6. Cannot CATCH a type variable — the JVM needs a real class to match.
    // catch (T e) { }                                 // COMPILE ERROR
    // ...but you CAN declare "throws T" and rethrow a T you were handed:
    //    <T extends Throwable> void rethrow(T t) throws T { throw t; }
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

      <h3>Why PECS Is True (and why the mnemonic is the wrong way round to learn it)</h3>
      <p>
        PECS is easy to recite and easy to apply backwards, because &quot;producer&quot; and
        &quot;consumer&quot; are named from the <em>collection&apos;s</em> point of view, not
        yours. Derive it instead — it takes one idea. Read a wildcard as{' '}
        <strong>&quot;some one specific type I don&apos;t know&quot;</strong>, not &quot;any
        type&quot;. Every restriction follows from that.
      </p>

      <p>
        <strong><code>? extends Number</code> — an unknown subtype.</strong> The parameter might be
        a <code>List&lt;Integer&gt;</code>, a <code>List&lt;Double&gt;</code>, or a{' '}
        <code>List&lt;Number&gt;</code>. The compiler does not know which one, only that whatever
        it is sits at or below <code>Number</code>.
      </p>
      <ul>
        <li>
          <em>Reading is safe.</em> Whatever comes out is at least a <code>Number</code>, because
          every candidate type is a <code>Number</code>. So <code>get</code> works.
        </li>
        <li>
          <em>Writing is not.</em> If you could <code>add(1)</code> and the caller passed a{' '}
          <code>List&lt;Double&gt;</code>, you would have put an <code>Integer</code> into it —
          exactly the corruption that invariance exists to prevent. So <code>add</code> is banned.
        </li>
      </ul>

      <p>
        <strong><code>? super Integer</code> — an unknown supertype.</strong> It might be a{' '}
        <code>List&lt;Integer&gt;</code>, a <code>List&lt;Number&gt;</code>, or a{' '}
        <code>List&lt;Object&gt;</code>. Now everything inverts:
      </p>
      <ul>
        <li>
          <em>Writing is safe.</em> An <code>Integer</code> can be stored in any of those, because
          an <code>Integer</code> <em>is</em> an <code>Integer</code>, a <code>Number</code>, and
          an <code>Object</code>. So <code>add</code> works.
        </li>
        <li>
          <em>Reading gives you almost nothing.</em> The list might be a{' '}
          <code>List&lt;Object&gt;</code>, so the only thing the compiler can promise about an
          element is that it is an <code>Object</code>. So <code>get</code> compiles but returns{' '}
          <code>Object</code>.
        </li>
      </ul>

      <p>
        The compiler even names the unknown type when it rejects you. It invents a fresh
        &quot;capture&quot; variable for it, and once you can read these messages they stop being
        cryptic:
      </p>

      <CodeBlock language="java" title="The actual javac errors">
{`static void readOnly(List<? extends Number> src) {
    Number n = src.get(0);            // fine
    src.add(Integer.valueOf(1));      // error
}
// error: incompatible types: Integer cannot be converted to CAP#1
//   where CAP#1 is a fresh type-variable:
//     CAP#1 extends Number from capture of ? extends Number

static void writeOnly(List<? super Integer> dst) {
    dst.add(1);                       // fine
    Integer i = dst.get(0);           // error
}
// error: incompatible types: CAP#1 cannot be converted to Integer
//   where CAP#1 is a fresh type-variable:
//     CAP#1 extends Object super: Integer from capture of ? super Integer

// CAP#1 IS "the one specific type I don't know". Read it that way and both
// errors say the obvious thing: you cannot prove an Integer fits into an
// unknown subtype, and you cannot prove an unknown supertype is an Integer.`}
      </CodeBlock>

      <InfoBox variant="info" title="One signature that uses both">
        <p>
          The clearest real example is a copy method, where one list is read and the other is
          written — so it needs both wildcards at once:
        </p>
        <CodeBlock language="java" title="Both halves of PECS in one place">
{`public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (int i = 0; i < src.size(); i++) {
        dest.set(i, src.get(i));       // read from src, write into dest
    }
}

// src PRODUCES T values  -> ? extends T
// dest CONSUMES T values -> ? super T

// The payoff is flexibility that the naive signature copy(List<T>, List<T>)
// would refuse:
List<Object> dest = new ArrayList<>(...);
List<Integer> src = List.of(1, 2, 3);
copy(dest, src);        // T = Integer; Object is a supertype. Compiles.`}
        </CodeBlock>
        <p>
          One thing wildcards never help with: a parameter you both read <em>and</em> write needs
          a plain <code>T</code>. And there is no point putting a wildcard on a{' '}
          <strong>return</strong> type — it forces every caller to deal with the same unknown
          type you refused to pin down.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

    </LessonLayout>
  );
}

export default Generics;
