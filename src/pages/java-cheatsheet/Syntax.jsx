import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaCSyntax() {
  return (
    <LessonLayout
      title="Java Syntax Cheat Sheet"
      sectionId="java-cheatsheet"
      lessonIndex={0}
      prev={{ path: "/auth/security", label: "Security Best Practices" }}
      next={{ path: "/java-cheatsheet/collections", label: "Collections Cheat Sheet" }}
    >
      <p>Quick reference for Java syntax essentials — types, control flow, classes, and modern Java features.</p>

      <h2>Primitives and Types</h2>
      <CodeBlock language="java" title="Types Quick Reference">
{`// Primitives
byte   b = 127;           // 8-bit  (-128 to 127)
short  s = 32767;         // 16-bit
int    i = 2_147_483_647; // 32-bit (underscores allowed)
long   l = 9_000_000_000L;// 64-bit (L suffix)
float  f = 3.14f;         // 32-bit float (f suffix)
double d = 3.14159265;    // 64-bit (default decimal)
char   c = 'A';           // 16-bit Unicode
boolean ok = true;

// Wrapper types (autoboxing)
Integer n = 42;           // auto-boxed from int
int     x = n;            // auto-unboxed

// String (immutable)
String s1 = "Hello";
String s2 = s1 + " World";          // creates new String
String s3 = String.format("Hi %s, you are %d", "Alice", 30);
String s4 = "Alice".repeat(3);      // AliceAliceAlice
String s5 = "  hello  ".strip();    // "hello" (Unicode-aware trim)
boolean eq = "abc".equals("abc");   // always use equals, not ==

// Text blocks (Java 15+)
String json = """
    {
      "name": "Alice",
      "age": 30
    }
    """;

// var (local type inference, Java 10+)
var list = new ArrayList<String>();  // inferred as ArrayList<String>
var map  = Map.of("key", "value");`}
      </CodeBlock>

      <CodeBlock language="java" title="Control Flow">
{`// Enhanced switch (Java 14+)
String day = "MON";
int numLetters = switch (day) {
    case "MON", "FRI", "SUN" -> 6;
    case "TUE"               -> 7;
    case "THU", "SAT"        -> 8;
    case "WED"               -> 9;
    default -> throw new IllegalArgumentException(day);
};

// Pattern matching instanceof (Java 16+)
Object obj = "Hello";
if (obj instanceof String s && s.length() > 3) {
    System.out.println(s.toUpperCase());  // s is String here
}

// Records (Java 16+) — immutable data carriers
public record Point(int x, int y) {
    // Compact constructor for validation
    Point {
        if (x < 0 || y < 0) throw new IllegalArgumentException("Negative coords");
    }
    double distance() { return Math.sqrt(x*x + y*y); }
}
Point p = new Point(3, 4);
System.out.println(p.x());           // 3
System.out.println(p.distance());    // 5.0

// Sealed classes (Java 17+)
public sealed interface Shape permits Circle, Rectangle, Triangle {}
public record Circle(double radius) implements Shape {}
public record Rectangle(double w, double h) implements Shape {}
double area = switch (shape) {
    case Circle c    -> Math.PI * c.radius() * c.radius();
    case Rectangle r -> r.w() * r.h();
    case Triangle t  -> 0.5 * t.base() * t.height();
};`}
      </CodeBlock>

      <InfoBox variant="tip" title="Modern Java (17-21) Quick Wins">
        <p>Records replace data classes (no Lombok needed). Sealed classes replace complex type hierarchies. Pattern matching switch replaces instanceof chains. Text blocks replace string concatenation for multi-line strings. Virtual threads (Java 21) replace reactive programming for I/O-heavy code.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the key advantage of Java records over regular classes for data transfer objects?"
        options={["Records are faster at runtime", "Records automatically generate constructor, getters, equals, hashCode, and toString", "Records support inheritance", "Records can be serialized more efficiently"]}
        correctIndex={1}
        explanation="Records generate all boilerplate automatically: a canonical constructor, accessor methods (no 'get' prefix), equals/hashCode based on all components, and a toString. They're immutable by default. This replaces entire Lombok @Value/@Data annotations or 30+ lines of manual boilerplate."
      />

    </LessonLayout>
  );
}
