import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaAdvanced() {
  return (
    <LessonLayout
      title="Modern Java Features"
      sectionId="java"
      lessonIndex={9}
      prev={{ path: "/java/io", label: "I/O & NIO.2" }}
      next={null}
    >
      <p>Modern Java (17-21) added powerful features: records, sealed classes, pattern matching, switch expressions, and virtual threads — making code more concise and expressive.</p>

      <h2>Records (Java 16+)</h2>
      <p>Records are immutable data carriers. The compiler auto-generates constructor, accessors, equals, hashCode, and toString.</p>

      <CodeBlock language="java" title="Records">
{`// One-liner replaces 50+ lines of boilerplate!
public record Point(int x, int y) {}

Point p = new Point(3, 4);
System.out.println(p.x());  // 3 (accessor, NOT getX())
System.out.println(p.y());  // 4
System.out.println(p);      // Point[x=3, y=4]

// Records with custom logic
public record Range(int min, int max) {
    Range { // compact constructor — validation runs before assignment
        if (min > max) throw new IllegalArgumentException("min > max");
    }
    public int span() { return max - min; }
    public boolean contains(int v) { return v >= min && v <= max; }
}

// Records work great as DTOs and value objects
public record UserDTO(String id, String email, String name) {}

// Records are implicitly final — cannot be extended`}
      </CodeBlock>

      <h2>Sealed Classes (Java 17+)</h2>
      <CodeBlock language="java" title="Sealed Interfaces">
{`// sealed restricts which classes can implement/extend
public sealed interface Shape permits Circle, Rectangle, Triangle {}

public record Circle(double radius) implements Shape {}
public record Rectangle(double w, double h) implements Shape {}
public record Triangle(double base, double height) implements Shape {}

// Pattern matching switch is exhaustive — no default needed!
double area = switch (shape) {
    case Circle    c -> Math.PI * c.radius() * c.radius();
    case Rectangle r -> r.w() * r.h();
    case Triangle  t -> 0.5 * t.base() * t.height();
};`}
      </CodeBlock>

      <h2>Pattern Matching</h2>
      <CodeBlock language="java" title="Pattern Matching for instanceof and switch">
{`// Old verbose style
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.toUpperCase());
}

// Modern — pattern variable directly in instanceof
if (obj instanceof String s) {
    System.out.println(s.toUpperCase()); // s is in scope here
}

// With guard condition
if (obj instanceof String s && s.length() > 5) {
    System.out.println("Long: " + s);
}

// Pattern matching switch (Java 21)
String result = switch (obj) {
    case Integer i when i > 0 -> "Positive: " + i;
    case Integer i            -> "Non-positive: " + i;
    case String  s            -> "String: " + s;
    case null                 -> "null value";
    default                   -> "Other: " + obj;
};`}
      </CodeBlock>

      <h2>Switch Expressions (Java 14+)</h2>
      <CodeBlock language="java" title="Modern Switch">
{`// Arrow syntax — no fall-through, returns value
int day = 3;
String name = switch (day) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3 -> "Wednesday";
    case 4 -> "Thursday";
    case 5 -> "Friday";
    default -> "Weekend";
};

// yield for multi-line cases
String desc = switch (day) {
    case 1, 2, 3, 4, 5 -> {
        String d = getDayName(day);
        yield "Weekday: " + d;
    }
    default -> "Weekend";
};`}
      </CodeBlock>

      <h2>Virtual Threads (Java 21)</h2>
      <CodeBlock language="java" title="Virtual Threads for High Concurrency">
{`// Platform threads: limited to thousands (OS managed)
// Virtual threads: can create MILLIONS (JVM managed)

// Create and start a virtual thread
Thread vt = Thread.ofVirtual().name("my-vt").start(() -> {
    System.out.println("Running in virtual thread!");
});

// Best pattern: virtual thread per task executor
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        int taskId = i;
        executor.submit(() -> {
            // Blocking I/O is fine here — virtual threads park, not block
            Thread.sleep(100);
            return "task-" + taskId;
        });
    }
} // executor auto-closed, all tasks complete`}
      </CodeBlock>

      <InfoBox variant="tip" title="var Keyword">
        <p>var enables local variable type inference (Java 10+) — the type is still statically determined at compile time. Use it when the type is obvious from the right-hand side (var list = new ArrayList&lt;String&gt;()), but avoid it when clarity suffers.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is automatically generated for a Java record?"
        options={["Only a constructor", "Constructor, getters, setters, equals, hashCode", "Constructor, accessors (no getX prefix), equals, hashCode, and toString", "Everything in an interface"]}
        correctIndex={2}
        explanation="Java records auto-generate: a canonical constructor, accessor methods (named after the component, e.g., x() not getX()), equals() and hashCode() based on all components, and toString(). Records are immutable — there are no setters."
      />
    </LessonLayout>
  );
}
