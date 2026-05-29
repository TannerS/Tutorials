import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Syntax() {
  return (
    <LessonLayout
      title="Syntax & Types Quick Ref"
      sectionId="java-cheatsheet"
      lessonIndex={0}
      prev={null}
      next={{ path: '/java-cheatsheet/collections', label: 'Collections Cheat Sheet' }}
    >
      {/* ───── PRIMITIVES TABLE ───── */}
      <h2>Primitives at a Glance</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Size</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Range / Values</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Default</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Wrapper</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['byte', '8-bit', '-128 to 127', '0', 'Byte'],
            ['short', '16-bit', '-32,768 to 32,767', '0', 'Short'],
            ['int', '32-bit', '-2³¹ to 2³¹-1', '0', 'Integer'],
            ['long', '64-bit', '-2⁶³ to 2⁶³-1', '0L', 'Long'],
            ['float', '32-bit', '±3.4e38 (~7 digits)', '0.0f', 'Float'],
            ['double', '64-bit', '±1.7e308 (~15 digits)', '0.0d', 'Double'],
            ['char', '16-bit', "0 to 65,535 (Unicode)", "'\\u0000'", 'Character'],
            ['boolean', '1-bit*', 'true / false', 'false', 'Boolean'],
          ].map(([type, size, range, def, wrapper]) => (
            <tr key={type} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontFamily: 'monospace', color: '#5b9cf6' }}>{type}</td>
              <td style={{ padding: '6px' }}>{size}</td>
              <td style={{ padding: '6px' }}>{range}</td>
              <td style={{ padding: '6px', fontFamily: 'monospace' }}>{def}</td>
              <td style={{ padding: '6px', fontFamily: 'monospace' }}>{wrapper}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <InfoBox variant="tip" title="Numeric Literals">
        Underscores in literals: <code>1_000_000</code>, <code>0xFF_EC_DE</code>, <code>0b1010_0001</code>.
        Hex = <code>0x</code>, Binary = <code>0b</code>, Octal = <code>0</code> prefix.
      </InfoBox>

      {/* ───── TYPE CASTING ───── */}
      <h2>Type Casting</h2>
      <CodeBlock language="java" title="Widening (implicit) vs Narrowing (explicit)">{
`// Widening — no data loss, automatic
int i = 42;
long l = i;        // int → long
double d = l;      // long → double

// Narrowing — possible data loss, requires cast
double pi = 3.14159;
int truncated = (int) pi;          // 3
byte b = (byte) 300;               // 44 (overflow!)

// Parsing strings
int n = Integer.parseInt("42");
double x = Double.parseDouble("3.14");
String s = String.valueOf(42);     // "42"`
      }</CodeBlock>

      {/* ───── VAR KEYWORD ───── */}
      <h2>Local Variable Type Inference (var)</h2>
      <CodeBlock language="java" title="var — Java 10+">{
`var list = new ArrayList<String>();   // ArrayList<String>
var map = Map.of("a", 1, "b", 2);    // Map<String, Integer>
var stream = list.stream();           // Stream<String>

// ❌ Cannot use var for:
// var x;              — no initializer
// var arr = {1,2,3};  — array initializer
// var fn = (x) -> x;  — lambda without target type
// Fields, parameters, return types`
      }</CodeBlock>

      {/* ───── STRING METHODS ───── */}
      <h2>String Methods Cheat Sheet</h2>
      <CodeBlock language="java" title="Essential String Operations">{
`String s = "Hello, World!";

// Query
s.length()              // 13
s.isEmpty()             // false
s.isBlank()             // false (Java 11)
s.charAt(0)             // 'H'
s.indexOf("World")      // 7
s.contains("World")     // true
s.startsWith("Hello")   // true
s.matches("Hello.*")    // true (regex)

// Transform
s.toLowerCase()         // "hello, world!"
s.toUpperCase()         // "HELLO, WORLD!"
s.trim()                // strips ASCII whitespace
s.strip()               // strips Unicode whitespace (Java 11)
s.substring(0, 5)       // "Hello"
s.replace("World", "Java")  // "Hello, Java!"
s.replaceAll("\\\\w+", "*")  // "*, *!"
s.split(", ")           // ["Hello", "World!"]

// Java 11+
"  hi  ".strip()            // "hi"
"  hi  ".stripLeading()     // "hi  "
"abc".repeat(3)             // "abcabcabc"
"a\\nb\\nc".lines().toList() // [a, b, c]

// Formatting
String.format("Name: %s, Age: %d", name, age);
"Name: %s, Age: %d".formatted(name, age); // Java 15+`
      }</CodeBlock>

      {/* ───── TEXT BLOCKS ───── */}
      <h2>Text Blocks (Java 13+)</h2>
      <CodeBlock language="java" title="Multi-line Strings">{
`String json = """
        {
            "name": "Java",
            "version": 21
        }
        """;

String html = """
        <html>
            <body>
                <p>Hello</p>
            </body>
        </html>
        """;

// Incidental whitespace stripped from left margin
// Trailing \\s preserves trailing spaces on a line`
      }</CodeBlock>

      {/* ───── CONTROL FLOW ───── */}
      <h2>Control Flow</h2>
      <CodeBlock language="java" title="if / switch / loops">{
`// Enhanced switch (Java 14+) — expression form
String tier = switch (score) {
    case 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100 -> "A";
    case 80, 81, 82, 83, 84, 85, 86, 87, 88, 89       -> "B";
    default -> {
        if (score >= 70) yield "C";
        else yield "F";
    }
};

// Pattern matching switch (Java 17+)
String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0  -> "Positive int: " + i;
        case String s              -> "String len=" + s.length();
        case null                  -> "null";
        default                    -> "Other: " + obj;
    };
}

// Loops — quick ref
for (int i = 0; i < n; i++) { }     // classic
for (var item : collection) { }      // enhanced for-each
while (condition) { }                 // while
do { } while (condition);             // do-while`
      }</CodeBlock>

      {/* ───── OPERATORS TABLE ───── */}
      <h2>Operators Precedence (high → low)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Category</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Operators</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Postfix', 'expr++  expr--'],
            ['Unary', '++expr  --expr  +  -  ~  !'],
            ['Multiplicative', '*  /  %'],
            ['Additive', '+  -'],
            ['Shift', '<<  >>  >>>'],
            ['Relational', '<  >  <=  >=  instanceof'],
            ['Equality', '==  !='],
            ['Bitwise AND', '&'],
            ['Bitwise XOR', '^'],
            ['Bitwise OR', '|'],
            ['Logical AND', '&&'],
            ['Logical OR', '||'],
            ['Ternary', '? :'],
            ['Assignment', '=  +=  -=  *=  /=  %=  etc.'],
          ].map(([cat, ops]) => (
            <tr key={cat} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>{cat}</td>
              <td style={{ padding: '6px', fontFamily: 'monospace' }}>{ops}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <InfoBox variant="warning" title="instanceof Pattern Matching">
        Java 16+ eliminates the need for explicit casts after <code>instanceof</code>:
        <code>if (obj instanceof String s)</code> — <code>s</code> is already cast.
      </InfoBox>

      {/* ───── RECORDS ───── */}
      <h2>Records (Java 16+)</h2>
      <CodeBlock language="java" title="Immutable data carriers">{
`// Compact declaration — auto-generates constructor, getters, equals, hashCode, toString
record Point(int x, int y) {}

// Usage
var p = new Point(3, 4);
p.x()    // 3  (accessor, not getX)
p.y()    // 4

// Custom compact constructor for validation
record Range(int lo, int hi) {
    Range {  // no parameter list = compact constructor
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
    }
}

// Records can implement interfaces, have static fields/methods
record NamedPoint(String name, int x, int y) implements Serializable {
    static final NamedPoint ORIGIN = new NamedPoint("origin", 0, 0);
}`
      }</CodeBlock>

      {/* ───── SEALED CLASSES ───── */}
      <h2>Sealed Classes (Java 17+)</h2>
      <CodeBlock language="java" title="Restricting class hierarchies">{
`// Only listed subclasses can extend
sealed interface Shape permits Circle, Rectangle, Triangle {}

record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
final class Triangle implements Shape {
    double base, height;
}

// Exhaustive pattern matching — no default needed
double area(Shape s) {
    return switch (s) {
        case Circle c    -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.w() * r.h();
        case Triangle t  -> 0.5 * t.base * t.height;
    };
}`
      }</CodeBlock>

      {/* ───── CHALLENGE ───── */}
      <InteractiveChallenge
        question={"What does `var x = 10;` infer the type as?"}
        options={["long", "int", "Integer", "Number"]}
        correctIndex={1}
        explanation={"Integer literals without L suffix default to int. var infers the exact type of the initializer, so it becomes int, not Integer (no autoboxing)."}
        language="java"
      />

      <InteractiveChallenge
        question={"Which is NOT true about Java records?"}
        options={[
          "Records auto-generate equals/hashCode/toString",
          "Record components are final by default",
          "Records can extend other classes",
          "Records can implement interfaces"
        ]}
        correctIndex={2}
        explanation={"Records implicitly extend java.lang.Record and cannot extend any other class. They can implement interfaces."}
        language="java"
      />
    </LessonLayout>
  );
}

export default function SyntaxPage() {
  return <Syntax />;
}
