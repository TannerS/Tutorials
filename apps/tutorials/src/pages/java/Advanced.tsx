import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Advanced() {
  return (
    <LessonLayout
      title="Advanced Java Features"
      sectionId="java"
      lessonIndex={9}
      prev={{ path: '/java/io', label: 'I/O & File Handling' }}
      next={null}
    >
      <h2>Modern Java Features</h2>
      <p>
        Java has evolved significantly since Java 8, with new releases every six months
        introducing powerful features that make the language more concise, expressive, and safe.
        This lesson covers the most impactful additions from Java 10 through Java 21.
      </p>

      <FlowChart
        title="Modern Java Feature Timeline"
        chart={"graph LR\nA[Java 10] --> B[var keyword]\nC[Java 13] --> D[Text Blocks]\nE[Java 14] --> F[Records]\nE --> G[Pattern Matching instanceof]\nH[Java 15] --> I[Sealed Classes]\nJ[Java 17 LTS] --> K[Pattern Matching switch]\nL[Java 21 LTS] --> M[Virtual Threads]\nL --> N[Record Patterns]"}
      />

      <h2>Local Variable Type Inference (var)</h2>
      <p>
        Introduced in Java 10, the <code>var</code> keyword lets the compiler infer the type of
        a local variable from its initializer. It reduces verbosity without sacrificing type
        safety — the variable is still strongly typed, the compiler just figures out the type
        for you.
      </p>

      <CodeBlock language="java" title="VarExamples.java">
{`import java.util.*;
import java.util.stream.*;

public class VarExamples {
    public static void main(String[] args) {
        // Before var: verbose type declarations
        HashMap<String, List<Integer>> oldWay = new HashMap<String, List<Integer>>();
        ArrayList<String> oldList = new ArrayList<String>();

        // With var: cleaner, type is inferred
        var scores = new HashMap<String, List<Integer>>();
        var names = new ArrayList<String>();
        var message = "Hello";    // inferred as String
        var count = 42;           // inferred as int
        var pi = 3.14159;         // inferred as double

        // Especially useful with complex generic types
        var entries = scores.entrySet();  // Set<Map.Entry<String, List<Integer>>>

        // Works in for loops
        var items = List.of("Apple", "Banana", "Cherry");
        for (var item : items) {
            System.out.println(item.toUpperCase());
        }

        // Works in try-with-resources
        try (var stream = items.stream()) {
            stream.forEach(System.out::println);
        }
    }

    // var CANNOT be used for:
    // - Method parameters: void foo(var x) // ERROR
    // - Return types: var foo() // ERROR
    // - Fields: var name = "Alice"; // ERROR (at class level)
    // - Without initializer: var x; // ERROR
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Use var">
        <p>
          Use <code>var</code> when the type is obvious from the right-hand side, such as
          constructor calls or factory methods. Avoid it when the type is not clear from context,
          as readability is more important than brevity. For example,{' '}
          <code>var result = computeValue()</code> is less clear than{' '}
          <code>String result = computeValue()</code>.
        </p>
      </InfoBox>

      <h2>Text Blocks</h2>
      <p>
        Text blocks (Java 13, finalized in Java 15) let you write multi-line strings without
        escape sequences or concatenation. They use triple-quote delimiters and preserve
        formatting.
      </p>

      <CodeBlock language="java" title="TextBlocks.java">
{`public class TextBlocks {
    public static void main(String[] args) {
        // Before text blocks: messy concatenation and escapes
        String oldJson = "{\\n" +
            "  \\"name\\": \\"Alice\\",\\n" +
            "  \\"age\\": 30,\\n" +
            "  \\"city\\": \\"Wonderland\\"\\n" +
            "}";

        // With text blocks: clean and readable
        String json = """
                {
                  "name": "Alice",
                  "age": 30,
                  "city": "Wonderland"
                }
                """;
        System.out.println(json);

        // SQL query
        String sql = """
                SELECT u.name, u.email, o.total
                FROM users u
                JOIN orders o ON u.id = o.user_id
                WHERE o.total > 100
                ORDER BY o.total DESC
                """;
        System.out.println(sql);

        // HTML template with formatting
        String html = """
                <html>
                  <body>
                    <h1>Welcome</h1>
                    <p>Hello, %s!</p>
                  </body>
                </html>
                """.formatted("Alice");
        System.out.println(html);
    }
}`}
      </CodeBlock>

      <h2>Records</h2>
      <p>
        Records (Java 14, finalized in Java 16) are a concise way to create immutable data
        classes. The compiler automatically generates the constructor, <code>equals()</code>,{' '}
        <code>hashCode()</code>, <code>toString()</code>, and accessor methods.
      </p>

      <CodeBlock language="java" title="RecordExamples.java">
{`// A record replaces 50+ lines of boilerplate with one line
public record Point(double x, double y) {}

public record Person(String name, int age, String email) {
    // Compact constructor for validation
    public Person {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be blank");
        }
        if (age < 0 || age > 150) {
            throw new IllegalArgumentException("Age must be 0-150");
        }
    }

    // You can add custom methods
    public String greeting() {
        return "Hi, I'm " + name + " (" + age + ")";
    }
}

// Records can implement interfaces
public record Range(int start, int end) implements Comparable<Range> {
    public Range {
        if (start > end) {
            throw new IllegalArgumentException("start must be <= end");
        }
    }

    public int length() {
        return end - start;
    }

    @Override
    public int compareTo(Range other) {
        return Integer.compare(this.length(), other.length());
    }
}

public class RecordDemo {
    public static void main(String[] args) {
        var point = new Point(3.0, 4.0);
        System.out.println(point);           // Point[x=3.0, y=4.0]
        System.out.println(point.x());       // 3.0 (accessor, not getX())
        System.out.println(point.y());       // 4.0

        var alice = new Person("Alice", 30, "alice@example.com");
        var bob = new Person("Alice", 30, "alice@example.com");
        System.out.println(alice.equals(bob)); // true (value-based equality)
        System.out.println(alice.greeting());

        var range = new Range(5, 10);
        System.out.println("Length: " + range.length()); // 5
    }
}`}
      </CodeBlock>

      <h2>Sealed Classes</h2>
      <p>
        Sealed classes (Java 15, finalized in Java 17) restrict which classes can extend them.
        This gives you full control over a class hierarchy and enables the compiler to check
        exhaustiveness in switch expressions.
      </p>

      <CodeBlock language="java" title="SealedClasses.java">
{`// Only Circle, Rectangle, and Triangle can extend Shape
public sealed class Shape permits Circle, Rectangle, Triangle {
    public abstract double area();
}

public final class Circle extends Shape {
    private final double radius;

    public Circle(double radius) { this.radius = radius; }

    @Override
    public double area() { return Math.PI * radius * radius; }

    public double radius() { return radius; }
}

public final class Rectangle extends Shape {
    private final double width, height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() { return width * height; }
}

public non-sealed class Triangle extends Shape {
    private final double base, height;

    public Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }

    @Override
    public double area() { return 0.5 * base * height; }
}

// Exhaustive pattern matching with sealed classes (Java 21)
public class SealedDemo {
    public static String describe(Shape shape) {
        return switch (shape) {
            case Circle c    -> "Circle with radius " + c.radius();
            case Rectangle r -> "Rectangle with area " + r.area();
            case Triangle t  -> "Triangle with area " + t.area();
            // No default needed — compiler knows all subtypes
        };
    }
}`}
      </CodeBlock>

      <h2>Pattern Matching</h2>
      <p>
        Pattern matching simplifies code that checks an object&apos;s type and then extracts
        data from it. Java has progressively added pattern matching to <code>instanceof</code>{' '}
        (Java 16) and <code>switch</code> (Java 21).
      </p>

      <CodeBlock language="java" title="PatternMatching.java">
{`public class PatternMatching {

    // Pattern matching for instanceof (Java 16)
    public static void printLength(Object obj) {
        // Before: cast after instanceof check
        if (obj instanceof String) {
            String s = (String) obj;
            System.out.println("String length: " + s.length());
        }

        // After: binding variable in instanceof
        if (obj instanceof String s) {
            System.out.println("String length: " + s.length());
        } else if (obj instanceof Integer i) {
            System.out.println("Integer value: " + i);
        } else if (obj instanceof List<?> list && !list.isEmpty()) {
            System.out.println("Non-empty list, size: " + list.size());
        }
    }

    // Pattern matching for switch (Java 21)
    public static String format(Object obj) {
        return switch (obj) {
            case Integer i when i > 0  -> "Positive integer: " + i;
            case Integer i             -> "Non-positive integer: " + i;
            case String s when s.isBlank() -> "Blank string";
            case String s              -> "String: " + s;
            case Double d              -> "Double: " + d;
            case int[] arr             -> "Int array of length " + arr.length;
            case null                  -> "null value";
            default                    -> "Unknown: " + obj.getClass().getSimpleName();
        };
    }

    // Record patterns (Java 21) — deconstruct records in patterns
    record Point(double x, double y) {}
    record Line(Point start, Point end) {}

    public static double lineLength(Line line) {
        if (line instanceof Line(Point(var x1, var y1), Point(var x2, var y2))) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }
        return 0;
    }

    public static void main(String[] args) {
        printLength("Hello");
        printLength(42);
        printLength(List.of(1, 2, 3));

        System.out.println(format(42));
        System.out.println(format("Java"));
        System.out.println(format(null));

        var line = new Line(new Point(0, 0), new Point(3, 4));
        System.out.println("Line length: " + lineLength(line)); // 5.0
    }
}`}
      </CodeBlock>

      <h3>Exhaustive Switch Over Sealed Hierarchies</h3>
      <p>
        The most powerful use of pattern matching for switch is over a sealed type. The
        compiler knows every possible subtype, so it can prove the switch is
        <em>exhaustive</em> — you don't need a <code>default</code> branch, and adding a
        new subtype forces every switch to be updated. This is the Java equivalent of
        TypeScript's discriminated-union exhaustiveness check.
      </p>
      <CodeBlock language="java" title="Sealed + switch = compile-checked exhaustiveness">
{`public sealed interface Shape permits Circle, Rectangle, Triangle {}

public record Circle(double radius)                       implements Shape {}
public record Rectangle(double width, double height)      implements Shape {}
public record Triangle(double base, double height)        implements Shape {}

// No default branch needed — the compiler proves every case is covered.
public static double area(Shape s) {
    return switch (s) {
        case Circle(double r)              -> Math.PI * r * r;
        case Rectangle(double w, double h) -> w * h;
        case Triangle(double b, double h)  -> 0.5 * b * h;
    };
}

// Add a new subtype:
// public record Ellipse(double a, double b) implements Shape {}
// ...and the switch above becomes a COMPILE ERROR until you handle Ellipse.
// The compiler is your regression net.`}
      </CodeBlock>

      <InfoBox variant="tip" title="This is the modern Visitor pattern">
        <p>
          Before sealed types + pattern matching, adding a "compute X for every shape"
          operation either violated the open-closed principle (edit every subclass) or
          required a Visitor. Sealed hierarchies + pattern matching give you the
          Visitor's benefits without the boilerplate — and the compiler tells you
          exactly which switches need updating when the hierarchy changes.
        </p>
      </InfoBox>

      <h3>When ordering matters — guarded patterns</h3>
      <CodeBlock language="java" title="Order-sensitive matching with 'when'">
{`public static String describe(Shape s) {
    return switch (s) {
        case Circle c when c.radius() == 0        -> "point";
        case Circle c when c.radius() < 1         -> "small circle";
        case Circle c                             -> "circle of radius " + c.radius();
        case Rectangle r when r.width() == r.height() -> "square";
        case Rectangle r                          -> "rectangle";
        case Triangle t                           -> "triangle";
    };
}

// Guarded patterns are tested in order. The compiler still requires
// exhaustiveness — every subtype must eventually be matched somewhere.`}
      </CodeBlock>

      <InfoBox variant="info" title="Java Module System (JPMS)">
        <p>
          Introduced in Java 9, the Java Platform Module System (JPMS) lets you organize code
          into modules with explicit dependency declarations and strong encapsulation. A module is
          defined by a <code>module-info.java</code> file that specifies which packages the
          module exports and which other modules it requires. While not all projects need custom
          modules, understanding them helps when working with the JDK itself, which is now fully
          modularized.
        </p>
      </InfoBox>

      <h2>Modules</h2>

      <CodeBlock language="java" title="module-info.java">
{`// module-info.java — placed at the root of a module's source tree
module com.myapp.core {
    // Packages this module makes available to other modules
    exports com.myapp.core.api;
    exports com.myapp.core.model;

    // Dependencies: modules this module needs
    requires java.logging;
    requires java.sql;

    // Transitive dependency
    requires transitive java.base;

    // Open package for reflection (needed by frameworks like Spring/Jackson)
    opens com.myapp.core.model to com.fasterxml.jackson.databind;
}

// Usage: compile and run with modules
// javac -d out --module-source-path src $(find src -name "*.java")
// java --module-path out -m com.myapp.core/com.myapp.core.Main`}
      </CodeBlock>

      <CodeBlock language="java" title="VirtualThreads.java">
{`// Virtual Threads (Java 21) — lightweight threads for high-throughput I/O
import java.util.concurrent.*;
import java.time.Duration;
import java.time.Instant;
import java.util.stream.IntStream;

public class VirtualThreads {
    public static void main(String[] args) throws Exception {
        Instant start = Instant.now();

        // Create 100,000 virtual threads — impossible with platform threads
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IntStream.range(0, 100_000).forEach(i -> {
                executor.submit(() -> {
                    Thread.sleep(Duration.ofSeconds(1));
                    return i;
                });
            });
        } // executor.close() waits for all tasks to complete

        Instant end = Instant.now();
        System.out.println("Completed 100K tasks in " +
            Duration.between(start, end).toMillis() + "ms");

        // Simple virtual thread creation
        Thread vThread = Thread.ofVirtual().name("my-vthread").start(() -> {
            System.out.println("Running on: " + Thread.currentThread());
        });
        vThread.join();

        // Virtual thread builder
        var factory = Thread.ofVirtual().name("worker-", 0).factory();
        try (var exec = Executors.newThreadPerTaskExecutor(factory)) {
            exec.submit(() -> System.out.println(Thread.currentThread().getName()));
            exec.submit(() -> System.out.println(Thread.currentThread().getName()));
        }
    }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Choosing the Right Java Version">
        <p>
          For production applications, use a Long-Term Support (LTS) release: Java 17 or Java 21
          are the current recommended choices. Java 17 gives you records, sealed classes, text
          blocks, and pattern matching for instanceof. Java 21 adds virtual threads, pattern
          matching in switch, record patterns, and sequenced collections. Both receive years of
          security updates and bug fixes.
        </p>
      </InfoBox>

      <h2>Sequenced Collections (Java 21)</h2>
      <p>
        Before Java 21, "get the first element" had a different method on every ordered
        collection: <code>list.get(0)</code>, <code>deque.getFirst()</code>,
        <code>sortedSet.first()</code>. Same for last, and neither had a clean reverse
        view. Java 21 introduced <code>SequencedCollection</code>,
        <code>SequencedSet</code>, and <code>SequencedMap</code> interfaces that unify
        this vocabulary across every ordered type.
      </p>
      <CodeBlock language="java" title="One vocabulary for every ordered collection">
{`// Before Java 21 — different method names, same idea
list.get(0);                    list.get(list.size() - 1);
deque.getFirst();               deque.getLast();
sortedSet.first();              sortedSet.last();
linkedHashMap.entrySet().iterator().next();   // no clean "last" at all

// Java 21 — one method name across all sequenced types
list.getFirst();                list.getLast();
deque.getFirst();               deque.getLast();
sortedSet.getFirst();           sortedSet.getLast();
linkedHashMap.firstEntry();     linkedHashMap.lastEntry();

// Add or remove from either end
list.addFirst(x);               list.addLast(y);
list.removeFirst();             list.removeLast();

// Reverse view — no copy, just a view onto the same data
SequencedCollection<Integer> reversed = list.reversed();
for (int x : reversed) { /* ... */ }`}
      </CodeBlock>

      <InfoBox variant="tip" title="Small feature, big cleanup">
        <p>
          The reason this matters isn't performance — it's the collapse of many
          collection-specific idioms into a single vocabulary. Streams, method
          references, and generic helper methods that operate on "an ordered
          collection" become simpler because <code>SequencedCollection</code> is the
          type you accept.
        </p>
      </InfoBox>

      <h2>Java Version Recap</h2>
      <CodeBlock language="text" title="LTS versions and their signature features">
{`Java 8   (2014, still LTS) — lambdas, streams, Optional, java.time
Java 11  (2018, LTS)       — var (local vars), String::lines, HTTP client
Java 17  (2021, LTS)       — records, sealed types, pattern matching instanceof,
                             text blocks, switch expressions
Java 21  (2023, LTS)       — virtual threads, pattern matching for switch,
                             record patterns, sequenced collections, ScopedValue (preview)
Java 25  (2025, LTS)       — refined structured concurrency, stable ScopedValue,
                             module import declarations, more pattern-matching depth

For any new codebase in 2026, target Java 21 or newer. Java 17 remains a safe
choice for existing services that don't need virtual threads yet.`}
      </CodeBlock>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="Which Java feature automatically generates equals(), hashCode(), toString(), and accessor methods for immutable data classes?"
        options={[
          "Sealed classes",
          "Text blocks",
          "Records",
          "The var keyword"
        ]}
        correctIndex={2}
        explanation="Records (introduced in Java 14, finalized in Java 16) are special classes designed for holding immutable data. The compiler automatically generates a constructor, accessor methods (e.g., name() instead of getName()), equals(), hashCode(), and toString() based on the record's components. This eliminates the boilerplate typically needed for simple data carrier classes."
      />
    </LessonLayout>
  );
}

export default Advanced;
