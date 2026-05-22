import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaSyntax() {
  return (
    <LessonLayout
      title="Java Syntax"
      sectionId="java"
      lessonIndex={1}
      prev={{ path: "/java/intro", label: "Introduction to Java" }}
      next={{ path: "/java/oop", label: "Object-Oriented Programming" }}
    >
      <p>Java is a statically-typed language — every variable must declare its type. This section covers primitives, operators, control flow, and strings.</p>

      <h2>Primitive Data Types</h2>
      <p>Java has 8 primitives. They store values directly (not as objects), making them fast and memory-efficient.</p>

      <CodeBlock language="java" title="Primitive Types">
{`// Integer types
byte   b = 127;           // 8-bit: -128 to 127
short  s = 32767;         // 16-bit: -32768 to 32767
int    i = 2_147_483_647; // 32-bit (most common integer type)
long   l = 99_999_999L;   // 64-bit, use L suffix

// Floating-point
float  f = 3.14f;         // 32-bit, use f suffix
double d = 3.14159265;    // 64-bit (default decimal type)

// Other
char    c = 'A';          // 16-bit Unicode character
boolean ok = true;        // true or false

// Wrapper classes (autoboxing)
Integer boxed = 42;       // autoboxed from int
int unboxed = boxed;      // auto-unboxed

// Useful constants
System.out.println(Integer.MAX_VALUE);  // 2147483647
System.out.println(Double.MAX_VALUE);   // 1.7976931348623157E308`}
      </CodeBlock>

      <h2>Variables and Constants</h2>
      <CodeBlock language="java" title="Variables and final constants">
{`int count = 0;
String name = "Alice";

// Type inference with var (Java 10+)
var list = new ArrayList<String>(); // compiler infers ArrayList<String>
var map  = new HashMap<String, Integer>();

// Constants: final + ALL_CAPS convention
final int MAX_RETRIES = 3;
final double TAX_RATE = 0.08;
final String APP_NAME = "MyApp";`}
      </CodeBlock>

      <h2>Operators</h2>
      <CodeBlock language="java" title="All Operator Categories">
{`int a = 10, b = 3;

// Arithmetic
System.out.println(a + b);  // 13
System.out.println(a - b);  // 7
System.out.println(a * b);  // 30
System.out.println(a / b);  // 3  (integer division truncates!)
System.out.println(a % b);  // 1  (remainder)

// Cast to get decimal
System.out.println((double) a / b); // 3.3333...

// Comparison → boolean
boolean eq = (a == b); // false
boolean gt = (a > b);  // true

// Logical (short-circuit)
boolean and = (a > 0 && b > 0);  // true
boolean or  = (a < 0 || b > 0);  // true
boolean not = !(a == b);          // true

// Compound assignment
a += 5;  a -= 2;  a *= 2;  a /= 3;  a %= 4;

// Ternary
String label = (a > 5) ? "big" : "small";`}
      </CodeBlock>

      <h2>Control Flow</h2>
      <CodeBlock language="java" title="If, Switch, For, While">
{`// if / else if / else
int score = 85;
if (score >= 90)      System.out.println("A");
else if (score >= 80) System.out.println("B");
else                  System.out.println("C");

// Switch expression (Java 14+, arrow syntax)
String grade = switch (score / 10) {
    case 10, 9 -> "A";
    case 8     -> "B";
    case 7     -> "C";
    default    -> "F";
};

// Standard for loop
for (int i = 0; i < 5; i++) System.out.print(i + " ");

// Enhanced for (for-each)
int[] nums = {1, 2, 3, 4, 5};
for (int n : nums) System.out.print(n + " ");

// While loop
int i = 0;
while (i < 5) { System.out.print(i++ + " "); }

// Do-while — always runs at least once
do {
    System.out.println("runs once");
} while (false);

// break and continue
for (int x = 0; x < 10; x++) {
    if (x == 3) continue; // skip 3
    if (x == 7) break;    // stop at 7
    System.out.print(x + " "); // 0 1 2 4 5 6
}`}
      </CodeBlock>

      <h2>String and StringBuilder</h2>
      <p>Strings are immutable in Java. For heavy manipulation use StringBuilder — it avoids creating many intermediate String objects.</p>

      <CodeBlock language="java" title="String Methods">
{`String s = "  Hello, World!  ";
s.trim();                  // "Hello, World!"
s.strip();                 // modern trim (handles Unicode spaces)
s.toUpperCase();           // "  HELLO, WORLD!  "
s.toLowerCase();           // "  hello, world!  "
s.contains("World");       // true
s.replace("World", "Java");// "  Hello, Java!  "
s.substring(2, 7);         // "Hello"
s.split(", ");             // ["  Hello", "World!  "]
s.startsWith("  H");       // true
s.isEmpty();               // false
s.isBlank();               // false
String.valueOf(42);        // "42"
String.format("Age: %d", 25); // "Age: 25"
"hello".equals("hello");   // true — ALWAYS use equals() not ==`}
      </CodeBlock>

      <CodeBlock language="java" title="StringBuilder for Performance">
{`// Bad: creates 1000 String objects
String result = "";
for (int i = 0; i < 1000; i++) result += i;

// Good: StringBuilder is mutable
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) sb.append(i).append(",");
sb.deleteCharAt(sb.length() - 1); // remove last comma
String finalStr = sb.toString();`}
      </CodeBlock>

      <InfoBox variant="warning" title="String Equality Trap">
        <p>Never use == to compare String values. It compares object references, not content. Use .equals() for case-sensitive comparison or .equalsIgnoreCase() for case-insensitive.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does 7 / 2 evaluate to in Java?"
        options={["3.5", "3", "4", "Compilation error"]}
        correctIndex={1}
        explanation="Java performs integer division when both operands are integers — the decimal part is truncated. 7 / 2 = 3. To get 3.5, cast one operand: (double)7 / 2 or 7.0 / 2."
      />

      <InteractiveChallenge
        question="Which method should you use to compare two String values in Java?"
        options={["==", ".compare()", ".equals()", ".same()"]}
        correctIndex={2}
        explanation=".equals() compares the actual content of two Strings. The == operator compares object references (memory addresses), which can give misleading results since String literals may or may not be the same object."
      />
    </LessonLayout>
  );
}
