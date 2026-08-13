import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaSyntax() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java · Field Reference"
      title="Modern Java Syntax"
      tagline="Primitives and variables through records, sealed types, and pattern matching — the language fundamentals plus the Java 21+ idioms that replaced the Java 8 you remember."
      meta={['Java 21+', '24 features']}
      footerLabel="Personal study reference — Java"
      pageLabel="Java Field Guide · Syntax"
      prev={null}
      next={{ path: '/java-field-guide/oop-generics', label: 'OOP & Generics' }}
    >
      <PosterCard
        glyph="mn"
        title={<>main<span className="dim"> — the Java 25 launcher protocol</span></>}
        language="java"
        code={`// The launcher takes ANY non-private method named main returning void.
// Four candidate forms — but precedence is BY ARITY FIRST, not by static:
static void main(String[] args)    // the classic
       void main(String[] args)    // instance
static void main()
       void main()                 // instance, no args

// main(String[]) ALWAYS wins over main() — even when the String[] form is
// an inherited instance method and main() is declared right here.
// static and instance at the SAME arity can't coexist: that is a compile
// error ("method main(String[]) is already defined").

// So forgetting 'static' no longer stops it launching:
public class App {
    App() { }                 // instance form -> launcher constructs you first,
                              // so a non-private NO-ARG ctor is required
    void main() { IO.println("runs"); }     // not even public
}
// java App.java  ->  runs

// Compact source file (Java 25) — no class declaration at all:
void main() { IO.println("Hello"); }`}
        caption={<>Before Java 25 a mistyped signature still <em>compiled</em> — it was a perfectly legal method, just not the one the launcher wanted — and only failed at <code>java</code> time. The relaxed rules exist mainly so compact source files work; keep writing <code>public static void main(String[] args)</code> in real code, because that is what every IDE, codebase, and reviewer expects.</>}
      />

      <PosterCard
        glyph="int"
        title={<>Primitives<span className="dim"> — sizes, ranges, defaults</span></>}
        language="java"
        code={`// 8 primitives. Sizes are fixed on every JVM. No unsigned types.
// type    size   range                        field default
byte      1 byte  -128 .. 127                  0
short     2 byte  -32,768 .. 32,767            0
int       4 byte  ~ +/-2.1 billion             0
long      8 byte  ~ +/-9.2 quintillion         0L
float     4 byte  ~7 decimal digits            0.0f
double    8 byte  ~16 decimal digits           0.0d
char      2 byte  0 .. 65,535 (UTF-16 unit)    '\\u0000'
boolean   JVM-dep true / false                 false

Integer.MAX_VALUE   Long.MIN_VALUE   Double.MAX_VALUE   // limits live on wrappers

int million = 1_000_000;        // underscores are legal digit separators
long big    = 10_000_000_000L;  // without the L this is an int literal -> error
float f     = 1.5f;             // without the f it is a double literal -> error

// Autoboxing: the compiler inserts int <-> Integer conversions for you
Integer a = 127, b = 127;   a == b;   // true  — cached range -128..127
Integer x = 128, y = 128;   x == y;   // false — two objects. Use .equals()
int n = someInteger;                   // NullPointerException if it is null

// char is a UTF-16 CODE UNIT, not "a Unicode character". Anything above
// U+FFFF (emoji, rarer CJK) is TWO chars — a surrogate pair.
"😀".length()             // 2   <- chars, not characters
"😀".codePointCount(0, 2) // 1   <- actual characters
"😀".chars().count()      // 2   code UNITS as ints
"😀".codePoints().count() // 1   code POINTS — the one you usually want`}
        caption={<>Defaults only apply to fields and array elements — a local variable has no default and must be assigned before use or it won&apos;t compile. Two traps live here: the <code>Integer</code> cache makes <code>==</code> look correct up to 127 and silently wrong at 128, and unboxing a <code>null</code> wrapper throws an NPE on a line with no visible dereference. Prefer primitives in hot code; every wrapper is a heap object.</>}
      />

      <PosterCard
        glyph="x="
        title={<>Variables<span className="dim"> — declaration, final, scope</span></>}
        language="java"
        code={`int count = 0;                  // local — no default, assign before use
final int MAX = 100;             // cannot be reassigned
static final int LIMIT = 500;    // class constant, SCREAMING_SNAKE by convention

class User {
    private String name;              // instance field — defaults to null
    private static int instances;     // static field — one copy for the class
    void rename(String name) {        // parameter SHADOWS the field
        this.name = name;             // 'this.' disambiguates
    }
}

// final binds the REFERENCE, not the object's contents
final List<String> names = new ArrayList<>();
names.add("a");                  // fine — the list itself is still mutable
// names = new ArrayList<>();    // compile error — cannot reassign

// Scope ends at the closing brace it was declared in
for (int i = 0; i < 3; i++) { }
// i is not visible here`}
        caption={<>Declare locals <code>final</code> (or just never reassign them) — an &quot;effectively final&quot; local is the only kind a lambda or inner class can capture. Fields get zero/false/null automatically; locals deliberately do not, so the compiler can catch a forgotten assignment.</>}
      />

      <PosterCard
        glyph="var"
        title={<>var<span className="dim"> — Java 10+</span></>}
        language="java"
        code={`var list = new ArrayList<String>();   // ArrayList<String>
var map = Map.of("a", 1, "b", 2);     // Map<String, Integer>

// cannot use var for:
// fields, parameters, return types, or with no initializer`}
        caption="Infers the exact type from the initializer — never Object, never a supertype. Restricted to local variables that have an initializer."
      />

      <PosterCard
        glyph="+-"
        title={<>Operators<span className="dim"> — and precedence traps</span></>}
        language="java"
        code={`7 / 2        // 3   — int division TRUNCATES. Use 7 / 2.0 for 3.5
-7 % 2       // -1  — % takes the sign of the LEFT operand
i++          // post: use the old value, then increment
++i          // pre:  increment, then use the new value

&&  ||  !    // SHORT-CIRCUIT — the right side may never be evaluated
&   |   ^    // no short-circuit on booleans; bitwise on integers
if (s != null && s.isEmpty())   // safe;  a single '&' here would NPE

~x           // bitwise NOT
x << 1       // * 2
x >> 1       // / 2, sign-extending (keeps negatives negative)
x >>> 1      // unsigned shift, always fills with 0 (there is no <<< — only >>>)

cond ? a : b                     // ternary — an expression, not a statement
byte b = 10;  b += 300;          // COMPILES: compound assign hides a narrowing cast
// b = b + 300;                  // same thing spelled out — compile error

// Precedence, high to low:
// unary  >  * / %  >  + -  >  << >>  >  < >  >  == !=  >  &  >  ^  >  |
//        >  &&  >  ||  >  ?:  >  = += -=
"sum: " + 1 + 2      // "sum: 12" — '+' is left-associative, not summed first
"sum: " + (1 + 2)    // "sum: 3"  — parenthesise when mixing concat and math
1 + 2 << 3           // (1+2)<<3 = 24 — '+' binds tighter than '<<'`}
        caption={<>Two traps do most of the damage: integer division silently truncating (<code>sum / count</code> before any cast to double), and compound assignment (<code>+=</code>) inserting an implicit narrowing cast that the equivalent long-hand would reject. When precedence isn&apos;t obvious at a glance, add parentheses — the compiler doesn&apos;t charge for them.</>}
      />

      <PosterCard
        glyph="(T)"
        title={<>Casting<span className="dim"> — widening &amp; narrowing</span></>}
        language="java"
        code={`// WIDENING — implicit, no cast needed, cannot lose magnitude
byte -> short -> int -> long -> float -> double
         char -> int
int i = 100;   long l = i;   double d = l;

// NARROWING — explicit cast required, silently discards data
double price = 9.99;
int whole = (int) price;      // 9  — truncates toward zero, never rounds
long big = 300L;
byte b = (byte) big;          // 44 — keeps the low 8 bits, wraps
int rounded = Math.round(9.99f);   // 10 — round, don't cast, if you meant that

// The classic average bug — cast BEFORE the division, not after
double avg  = (double) sum / count;    // right
double bad  = (double) (sum / count);  // wrong — divides as ints first

// Reference casts are checked at RUNTIME, not compile time
Object o = "text";
String s = (String) o;                  // fine
Integer n = (Integer) o;                // ClassCastException
if (o instanceof Integer num) { }       // guard first (Java 16+ pattern)

// Text <-> number conversions
int p = Integer.parseInt("42");         // NumberFormatException on bad input
String t = String.valueOf(42);          // null-safe, unlike 42 + ""`}
        caption={<>Widening is automatic because it can&apos;t lose information; every narrowing conversion needs a cast, which is you telling the compiler you accept the truncation. A cast never rounds — reach for <code>Math.round</code>, <code>Math.floorDiv</code>, or <code>BigDecimal</code> when the arithmetic actually matters.</>}
      />

      <PosterCard
        glyph="{}"
        title={<>Control flow<span className="dim"> — if / loops / break</span></>}
        language="java"
        code={`if (x > 0) { ... } else if (x < 0) { ... } else { ... }

for (int i = 0; i < n; i++) { }     // classic — when you need the index
for (var item : items) { }           // enhanced for — arrays and any Iterable
while (cond) { }                     // may run zero times
do { } while (cond);                 // always runs at least once

break;      // leave the nearest loop or switch
continue;   // skip to the next iteration

outer:
for (var row : grid) {
    for (var cell : row) {
        if (cell == target) break outer;   // labelled break exits BOTH loops
    }
}

// Mutating a collection inside an enhanced for -> ConcurrentModificationException
for (var s : list) if (s.isBlank()) list.remove(s);   // WRONG
list.removeIf(String::isBlank);                        // RIGHT

// if with no braces binds only the NEXT statement — always use braces
if (ready) start(); log("started");   // log() runs unconditionally`}
        caption={<>The enhanced for is the default: it can&apos;t run off the end of the collection and it reads as intent rather than arithmetic. Keep the classic three-part form only when you genuinely need the index, a stride, or reverse iteration.</>}
      />

      <PosterCard
        glyph="[]"
        title={<>Arrays<span className="dim"> — fixed length, zero-based</span></>}
        language="java"
        code={`int[] nums = new int[5];              // zero-filled: [0, 0, 0, 0, 0]
int[] init = {1, 2, 3};                // literal — declaration only
String[] names = new String[]{"a"};    // literal usable anywhere

nums.length      // FIELD, no parentheses (String uses the method .length())
nums[0] = 10;    // 0-based; nums[5] -> ArrayIndexOutOfBoundsException

int[][] grid = new int[3][4];          // array of arrays — rows may differ in length

Arrays.sort(nums);
Arrays.fill(nums, 7);
Arrays.toString(nums);        // "[1, 2, 3]" — println(nums) prints "[I@6d06d69c"
Arrays.deepToString(grid);    // for nested arrays
Arrays.equals(a, b);          // element-wise; a == b compares references
Arrays.copyOf(nums, 10);      // arrays are FIXED length — "resize" means copy

List<String> fixed = Arrays.asList(names);          // fixed-size VIEW, writes through
List<String> real  = new ArrayList<>(fixed);        // independent, resizable`}
        caption={<>Arrays are fixed-length and covariant (which is why <code>Object[] o = new String[3]</code> compiles and then throws at runtime); a <code>List</code> is resizable and invariant. Use an array for primitives in hot code or when an API demands one — otherwise reach for <code>List</code>.</>}
      />

      <PosterCard
        glyph="TB"
        title={<>Text Blocks<span className="dim"> — Java 13+</span></>}
        language="java"
        code={`String json = """
        {
            "name": "Java",
            "version": 21
        }
        """;

// incidental left-margin whitespace is stripped automatically`}
        caption={<>Multi-line strings without escaping every quote. The closing <code>&quot;&quot;&quot;</code> position sets the left-margin indent that gets stripped.</>}
      />

      <PosterCard
        glyph="Rec"
        title={<>record<span className="dim"> — Java 16+</span></>}
        language="java"
        code={`record Point(int x, int y) {}

var p = new Point(3, 4);
p.x();   // 3 — accessor, not getX()
p.y();   // 4

record NamedPoint(String name, int x, int y) implements Serializable {}

// "Records are immutable" means the REFERENCE is final — nothing more.
record Team(String name, List<String> members) {}
var roster = new ArrayList<>(List.of("Ada"));
var t = new Team("eng", roster);
roster.add("Alan");        // t is now Team[name=eng, members=[Ada, Alan]]
t.members().add("Grace");  // and the accessor is a second way in

// Defensive copy in the compact constructor closes BOTH leaks:
record SafeTeam(String name, List<String> members) {
    SafeTeam { members = List.copyOf(members); }   // copies AND makes it unmodifiable
}`}
        caption={<>Auto-generates a canonical constructor, accessors, <code>equals</code>/<code>hashCode</code>, and <code>toString</code>. Records implicitly extend <code>java.lang.Record</code>, so they can&apos;t extend anything else. Immutability is <strong>shallow</strong>: a mutable component leaks both through the constructor argument and back out through the accessor — copy it in the compact constructor. (<code>List.copyOf</code> rejects nulls; use <code>Collections.unmodifiableList(new ArrayList&lt;&gt;(x))</code> if null elements are legal.)</>}
      />

      <PosterCard
        glyph="Val"
        title={<>Compact Constructor<span className="dim"> (validation)</span></>}
        language="java"
        code={`record Range(int lo, int hi) {
    Range {  // no parameter list = compact constructor
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
    }
}`}
        caption="Runs before field assignment, so it's the place to validate or normalize inputs without repeating the full parameter list."
      />

      <PosterCard
        glyph="Se"
        title={<>sealed<span className="dim"> interface / class — Java 17+</span></>}
        language="java"
        code={`sealed interface Shape permits Circle, Rectangle, Triangle {}

record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
final class Triangle implements Shape { double base, height; }`}
        caption="Restricts which classes may implement the type — that's what lets a switch over Shape be exhaustive without a default branch."
      />

      <PosterCard
        glyph="Sw"
        title={<>switch<span className="dim"> expression — Java 14+</span></>}
        language="java"
        code={`String tier = switch (score) {
    case 90, 91, 92 -> "A";
    case 80, 81, 82 -> "B";
    default -> {
        if (score >= 70) yield "C";
        else yield "F";
    }
};`}
        caption="The arrow form doesn't fall through and returns a value directly. Use yield only inside a brace block when a branch needs more than one expression."
      />

      <PosterCard
        glyph="PM"
        title={<>Pattern Matching<span className="dim"> switch — Java 21</span></>}
        language="java"
        code={`String describe(Object o) {
    return switch (o) {
        case null                  -> "null";
        case Integer i when i < 0  -> "negative int: " + i;
        case Integer i              -> "int: " + i;
        case String s                -> "string: " + s;
        default                       -> o.getClass().getSimpleName();
    };
}`}
        caption={<>Type patterns bind a typed variable per branch, and <code>when</code> adds a guard clause. <code>case null</code> must be explicit — switching on a null Object still NPEs without it.</>}
      />

      <PosterCard
        glyph="RP"
        title={<>Record Patterns<span className="dim"> (deconstruction) — Java 21</span></>}
        language="java"
        code={`record Point(double x, double y) {}
record Line(Point start, Point end) {}

double lengthOf(Line line) {
    return switch (line) {
        case Line(Point(var x1, var y1), Point(var x2, var y2)) ->
            Math.hypot(x2 - x1, y2 - y1);
    };
}`}
        caption="Deconstructs nested records directly in the case label — no manual .start().x() chains. Exhaustive over a sealed hierarchy with no default needed."
      />

      <PosterCard
        glyph="Io"
        title={<>instanceof<span className="dim"> pattern — Java 16+</span></>}
        language="java"
        code={`if (obj instanceof String s) {
    System.out.println(s.length());  // s already cast
}

if (obj instanceof String s && s.length() > 3) {
    // pattern variable usable in the && chain too
}`}
        caption="Eliminates the explicit cast after a successful instanceof check. The pattern variable is only in scope where the compiler can prove the match succeeded."
      />

      <PosterCard
        glyph="TWR"
        title={<>try-with-resources<span className="dim">()</span></>}
        language="java"
        code={`try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) System.out.println(line);
} catch (IOException e) {
    System.out.println("Error reading file: " + e.getMessage());
}
// reader.close() called automatically, even on exception`}
        caption="Any AutoCloseable declared in the parens gets closed in reverse order automatically. Prefer this over manual finally blocks — shorter and can't leak."
      />

      <PosterCard
        glyph="@O"
        title={<>@Override<span className="dim"> &amp; </span>@FunctionalInterface</>}
        language="java"
        code={`@Override
public String toString() { return "MyClass"; }

@FunctionalInterface
interface Transformer<T, R> {
    R transform(T input);   // only ONE abstract method allowed
}`}
        caption="@Override catches typos in method signatures at compile time instead of silently creating an overload. @FunctionalInterface locks an interface to one abstract method so it stays lambda-compatible."
      />

      <PosterCard
        glyph="@C"
        title={<>Custom Annotation<span className="dim"> definition</span></>}
        language="java"
        code={`@Retention(RetentionPolicy.RUNTIME)   // available via reflection
@Target(ElementType.METHOD)
public @interface Cacheable {
    String key() default "";
    int ttlSeconds() default 300;
}

@Cacheable(key = "users", ttlSeconds = 600)
public List<User> getUsers() { /* ... */ }`}
        caption={<>RUNTIME retention is required if anything reads the annotation via reflection — <code>CLASS</code> (the default) is invisible at runtime.</>}
      />

      <PosterCard
        glyph="Lo"
        title={<>Lombok<span className="dim"> @Data / @Builder</span></>}
        language="java"
        code={`@Data @Builder
@NoArgsConstructor @AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
}

UserDto u = UserDto.builder().id(1L).name("Alice").build();`}
        caption="Generates getters/setters/equals/hashCode/toString/builder at compile time. Avoid @Data on JPA @Entity classes — equals/hashCode over lazy-loaded fields can trigger unwanted fetches."
      />

      <PosterCard
        glyph="Str"
        title={<>String<span className="dim"> — immutable, and StringBuilder</span></>}
        language="java"
        code={`s.toUpperCase();          // returns a NEW string — s is unchanged
a == b                    // compares REFERENCES (true only via interning)
a.equals(b)               // compares CONTENTS — always use this
"java".equals(input)      // constant first = null-safe

"  x  ".strip()           // Unicode-aware (Java 11+); prefer over trim()
"   ".isBlank()           // Java 11+   |   "ab".repeat(3)   |   s.lines()
"Hi %s, %d".formatted(n, age)          // Java 15+ instance form
String.join("-", parts)   |   stream.collect(joining(", ", "[", "]"))

// WRONG in a loop — new String every iteration, O(n^2)
for (var w : words) result += w;
// RIGHT — one mutable buffer, O(n)
var sb = new StringBuilder(); for (var w : words) sb.append(w);`}
        caption={<>The compiler already optimises concatenation within a <em>single</em> expression, so <code>StringBuilder</code> is only needed for loops and conditional building. <code>StringBuffer</code> is the synchronized legacy version — you almost never want it.</>}
      />

      <PosterCard
        glyph="Pl"
        title={<>String pool<span className="dim"> — why == sometimes works</span></>}
        language="java"
        code={`// The JVM keeps a POOL of unique string objects. Every literal in your
// source resolves to the SAME object — safe only because strings are
// immutable. So == ("same object?") accidentally answers "same text?".

String a = "java";
String b = "java";             // a == b  -> TRUE   same pooled literal
String c = new String("java"); // a == c  -> false  'new' forces a fresh object
String d = c.intern();         // a == d  -> TRUE   intern() returns the pooled one

String e = "ja" + "va";        // a == e  -> TRUE   both operands are compile-time
                               //                   constants, so javac folds it
String part = "ja";
String f = part + "va";        // a == f  -> FALSE  built at RUNTIME = new object
a.equals(f);                   //         -> true   the question you meant to ask

// This is exactly why == "works" in every toy example and then fails the
// moment the string comes from a file, a request, or a StringBuilder.`}
        caption={<>Literals are pooled, runtime-built strings are not — so <code>==</code> passes on hardcoded test data and fails on real input. There is no version of this you can rely on: use <code>equals</code>, and put the constant first (<code>&quot;java&quot;.equals(input)</code>) so a null input can&apos;t NPE.</>}
      />

      <PosterCard
        glyph="0.1"
        title={<>Numeric traps<span className="dim"> — overflow &amp; BigDecimal</span></>}
        language="java"
        code={`Integer.MAX_VALUE + 1     // silently wraps to Integer.MIN_VALUE
Math.addExact(a, b)       // throws ArithmeticException instead of wrapping
int ms = days*24*60*60*1000;   // overflows past 24 days — use long

0.1 + 0.2                 // 0.30000000000000004 — never use double for money

new BigDecimal("0.1")     // String constructor — ALWAYS
new BigDecimal(0.1)       // captures the same inaccurate binary value

total.add(x);             // IMMUTABLE — result discarded, no-op bug
total = total.add(x);     // correct
total.divide(d, 2, RoundingMode.HALF_UP);   // division NEEDS a rounding mode

new BigDecimal("2.0").equals(new BigDecimal("2.00"))    // false — scale differs
new BigDecimal("2.0").compareTo(new BigDecimal("2.00")) // 0 — use this`}
        caption="Integer overflow is silent and floating point cannot represent most decimal fractions. Both produce bugs that pass every test with small numbers."
      />

      <PosterCard
        glyph="yld"
        title={<>switch expression<span className="dim"> — yield &amp; multi-label</span></>}
        language="java"
        code={`// Arrow form: no fall-through, produces a value, must be EXHAUSTIVE.
int days = switch (month) {
    case JAN, MAR, MAY, JUL, AUG, OCT, DEC -> 31;
    case APR, JUN, SEP, NOV                -> 30;
    case FEB                               -> isLeap ? 29 : 28;
};   // no default needed — every enum constant is covered

// Multi-statement branch: block + 'yield' (not 'return')
String s = switch (status) {
    case FAILED -> {
        log.error("failed");
        yield "failed: " + lastError;
    }
    default -> "unknown";
};

// Statement form with arrows — no value, no break
switch (cmd) { case START -> svc.start(); default -> log.warn("?"); }`}
        caption="Add an enum constant and every exhaustive switch over it becomes a compile error until you handle it — the compiler becomes your regression net."
      />

      <PosterQuickRef
        title="Which modern syntax do I need?"
        rows={[
          { need: 'Entry point the launcher will find', answer: 'Any non-private void main; main(String[]) beats main()' },
          { need: 'Whole number, normal range', answer: 'int (long past +/-2.1 billion)' },
          { need: 'Money or exact decimals', answer: 'BigDecimal — never float/double' },
          { need: 'Compare two Integers', answer: '.equals() — == only caches -128..127' },
          { need: 'Compare two Strings', answer: '.equals() — == only works on pooled literals' },
          { need: 'Count real characters, not chars', answer: 'codePoints() — char is a UTF-16 code unit' },
          { need: 'Constant that never changes', answer: 'static final, SCREAMING_SNAKE' },
          { need: 'Stop a variable being reassigned', answer: 'final (the object can still mutate)' },
          { need: 'Divide two ints and keep the fraction', answer: '(double) sum / count — cast first' },
          { need: 'Shrink a wider numeric type', answer: 'explicit cast (T) — truncates, never rounds' },
          { need: 'Loop over a collection or array', answer: 'enhanced for (var x : xs)' },
          { need: 'Remove while looping', answer: 'list.removeIf(...), not for + remove' },
          { need: 'Exit two nested loops at once', answer: 'labelled break outer;' },
          { need: 'Print an array readably', answer: 'Arrays.toString / deepToString' },
          { need: 'Immutable data carrier', answer: 'record (shallow — copy mutable components)' },
          { need: 'Closed type hierarchy', answer: 'sealed interface/class + permits' },
          { need: 'Type-safe branch on a value', answer: 'switch pattern matching' },
          { need: 'Deconstruct nested records', answer: 'record patterns' },
          { need: 'Cast after a type check', answer: 'instanceof pattern (Java 16+)' },
          { need: 'Multi-line string literal', answer: 'text block """ """' },
          { need: 'Infer a local variable type', answer: 'var' },
          { need: 'Auto-close a resource', answer: 'try-with-resources' },
          { need: 'Catch bad @Override signatures', answer: '@Override' },
          { need: 'Boilerplate getters/setters/builder', answer: 'Lombok @Data / @Builder' },
        ]}
      />
    </PosterLayout>
  );
}
