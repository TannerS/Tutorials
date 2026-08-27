import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Cheatsheet() {
  return (
    <LessonLayout
      title="Java Cheat Sheet"
      sectionId="java"
      lessonIndex={16}
      prev={{ path: '/java/mockito', label: 'Mockito in Practice' }}
      next={null}
    >
      <p>
        A single-page reconciliation of the Java section&rsquo;s 14 lessons — every table and
        snippet below reflects what those lessons actually establish (and, where they measured
        something on a real JDK, the real numbers), not textbook Java restated from memory.
      </p>

      <h2>Primitives, Operators &amp; Control Flow</h2>
      <CodeBlock language="text" title="The eight primitives">
{`byte    8-bit   -128..127
short   16-bit  -32,768..32,767
int     32-bit  -2^31..2^31-1        (2_000_000 — underscores for readability)
long    64-bit  -2^63..2^63-1        (9_000_000_000L — L suffix REQUIRED)
float   32-bit  ~7 decimal digits    (3.14f — f suffix REQUIRED)
double  64-bit  ~15 decimal digits   (default for decimal literals)
char    16-bit  ONE UTF-16 code unit — NOT "a character". Emoji and many CJK
                extension characters take TWO chars (a surrogate pair).
                "a😀".length() == 3, but codePointCount(..) == 2.
boolean true/false only — no implicit int conversion (unlike C)`}
      </CodeBlock>

      <InfoBox variant="danger" title="Two numeric traps that bite everyone once">
        <p>
          <strong>Integer overflow is silent.</strong> <code>int</code> wraps at 2,147,483,647
          with no exception — <code>days * 24 * 60 * 60 * 1000</code> overflows past ~24 days.
          Use <code>long</code>, or <code>Math.addExact()</code>/<code>Math.multiplyExact()</code>{' '}
          which throw <code>ArithmeticException</code> instead of wrapping.
        </p>
        <p>
          <strong><code>double</code> cannot represent money.</strong> <code>0.1 + 0.2</code>{' '}
          is <code>0.30000000000000004</code>. Use <code>BigDecimal</code>, constructed from a{' '}
          <em>String</em> — <code>new BigDecimal(0.1)</code> just captures the same inaccurate
          binary value. <code>BigDecimal</code> is immutable (every op returns a new value, so{' '}
          <code>total.add(x)</code> alone is a no-op bug), division needs an explicit{' '}
          <code>RoundingMode</code> or it throws on a non-terminating result, and{' '}
          <code>equals()</code> compares scale too (<code>2.0</code> ≠ <code>2.00</code> —
          use <code>compareTo</code>).
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Autoboxing — the Integer cache trap">
{`Integer a = 127, b = 127;   Integer c = 128, d = 128;
a == b;         // true  — both hit the cached Integer.valueOf(-128..127)
c == d;         // false — outside the cache, valueOf allocates fresh objects
a.equals(b);    // true  — ALWAYS use equals() for wrapper comparison

Map<String, Integer> counts = new HashMap<>();
int n = counts.get("missing");   // compiles — then NPE: the invisible
                                 // .intValue() the compiler inserted runs on null
int n2 = counts.getOrDefault("missing", 0);   // the fix`}
      </CodeBlock>

      <CodeBlock language="text" title="Switch expressions (14+) vs switch statements">
{`String dayName = switch (day) {
    case 1, 7 -> "Weekend";           // comma-joined labels, no fall-through
    case 2, 3, 4, 5, 6 -> "Weekday";
    default -> "Invalid";
};
// 1. NO fall-through — a forgotten 'break' can't happen with arrows.
// 2. It's an EXPRESSION — assign it, return it.
// 3. EXHAUSTIVE when used as an expression — enum switch over all constants
//    needs no default; add a constant and every such switch becomes a
//    compile error until handled.
// Multi-statement branch: block + yield (not 'return').
// switch on a null selector throws NPE UNLESS you write 'case null ->' (21+).

var vs type inference:
  var x = 42;              // local variables only, needs an initializer
  var list = new ArrayList<String>();
  // ILLEGAL: fields, method params, return types, no-initializer declarations`}
      </CodeBlock>

      <h2>Strings</h2>
      <CodeBlock language="java" title="== vs equals, and why == sometimes 'works'">
{`String a = "java", b = "java";              // same pooled literal -> a == b is true
String c = new String("java");              // forces a new object  -> a == c is false
String e = "ja" + "va";                     // compile-time constant -> a == e is true
String part = "ja"; String f = part + "va"; // RUNTIME concat        -> a == f is false
a.equals(f);                                // true — the only question you meant to ask
"literal".equals(userInput);                // null-safe order: constant first

// == on ANY reference type asks "same object?", never "same contents?".
// It "works" on literals only because of string-pool interning — and that
// is exactly why it passes tests and fails on data read from a file/DB/network.`}
      </CodeBlock>

      <CodeBlock language="text" title="Everyday String methods">
{`s.trim()            ASCII whitespace only        s.strip()      Unicode-aware (11+), prefer
s.isEmpty()          length == 0                  s.isBlank()    empty or whitespace (11+)
s.split(",")         -> String[]                  String.join("-", "a","b")
s.repeat(3)          "ab" -> "ababab" (11+)        s.lines()      -> Stream<String> (11+)
"Hi %s".formatted(x) instance-method form (15+)    s.chars()      UTF-16 code UNITS as ints
"""text block"""     multi-line, no escaping (15+) s.codePoints() actual characters

StringBuilder: use in LOOPS — string += in a loop is O(n^2), a new object every
iteration. A single "a"+b+"c" expression is already compiler-optimized.
String.join(" ", words) / stream.collect(Collectors.joining(", ")) for one-shot joins.`}
      </CodeBlock>
      <h2>OOP Essentials</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Modifier</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Same class</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Same package</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Subclass, other package</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Everywhere</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>private</code></td>
            <td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>No</td>
            <td style={{ padding: '0.75rem' }}>No</td><td style={{ padding: '0.75rem' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><em>default</em> (none)</td>
            <td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}>No</td><td style={{ padding: '0.75rem' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>protected</code></td>
            <td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>public</code></td>
            <td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>Yes</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="text" title="Interface vs abstract class">
{`interface        Contract for UNRELATED classes to implement (Comparable, Serializable).
                 Fields are implicitly public static final. default methods (8+) allowed.
                 A class may implement MANY interfaces.

abstract class   Shared STATE or behavior among CLOSELY RELATED classes.
                 Can have constructors, instance fields, any access modifier.
                 A class may extend only ONE abstract class.
                 'abstract' controls whether it's instantiable — a sealed class that
                 declares abstract methods must itself be abstract (orthogonal concern).

Prefer composition over inheritance for "has-a"/"behaves-like": extending a concrete
class couples you to its INTERNAL call structure, not just its public contract
(the classic bug: overriding add() in a HashSet subclass double-counts, because
HashSet.addAll() calls add() internally). Mark classes final if not designed for extension.`}
      </CodeBlock>

      <InfoBox variant="danger" title="equals()/hashCode() — get this wrong and HashMap silently loses your data">
        <p>
          The contract, in three rules: (1) if <code>a.equals(b)</code> then{' '}
          <code>a.hashCode() == b.hashCode()</code> — always. (2) Equal hash codes do{' '}
          <em>not</em> imply equality (collisions are legal). (3) Both must be computed from
          fields that don&rsquo;t change while the object sits in a hash-based collection.
        </p>
        <p>
          Why it breaks silently: a <code>HashMap</code>/<code>HashSet</code> lookup hashes the
          key, picks <em>one bucket</em> from that hash, and only calls <code>equals()</code> on
          entries already in that bucket. Override <code>equals()</code> alone and inherit{' '}
          <code>Object.hashCode()</code> (identity-based) and two &ldquo;equal&rdquo; objects land
          in different buckets — <code>equals()</code> is never even reached.{' '}
          <code>set.add(x); set.contains(x)</code> on an <em>equal but distinct</em> instance
          returns <code>false</code>, <code>size()</code> silently grows past what
          &ldquo;unique&rdquo; should allow, and <code>remove()</code> can&rsquo;t find the entry
          either. Use <code>Objects.hash(fields...)</code>, or better, a <code>record</code>{' '}
          (generates both correctly from its components). Keys must be immutable — mutating a
          field <code>hashCode()</code> depends on after insertion strands the object in the wrong
          bucket permanently.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="@Override — an assertion the compiler checks, not what causes overriding">
{`class Dog extends Animal {
    public String toStr1ng() { return "Dog"; }        // typo — a brand-new method
    public boolean equals(Dog other) { return true; }  // overLOADS, not overRIDES
}
// Both compile silently without @Override and are silently broken.
// Add @Override to either and: "error: method does not override a method from its supertype"`}
      </CodeBlock>

      <CodeBlock language="text" title="Records &amp; sealed types (the modern default for data + hierarchies)">
{`record Point(double x, double y) {}
// Generates: canonical constructor, x()/y() accessors (not getX()), equals(),
// hashCode(), toString() — all from the components. Implicitly final; always
// extends java.lang.Record; cannot extend anything else.
//
// SHALLOW immutable only: a List/array component can still be mutated through
// the accessor. Fix in the compact constructor: members = List.copyOf(members);
// Array components break equals()/hashCode() (arrays use identity equality) —
// avoid array fields in records, or hand-write equals/hashCode with Arrays.*.

sealed interface Shape permits Circle, Rectangle, Triangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}
record Triangle(double base, double height) implements Shape {}

static double area(Shape s) {
    return switch (s) {                            // no default needed —
        case Circle(double r) -> Math.PI * r * r;      // compiler PROVES exhaustiveness.
        case Rectangle(double w, double h) -> w * h;   // Add a new permitted type and
        case Triangle(double b, double h) -> 0.5 * b * h; // every such switch becomes a
    };                                                  // compile error until updated.
}                                       // Java's answer to TS discriminated-union exhaustiveness.
// Every permitted subtype must be final, sealed, or non-sealed — no 4th option.
// instanceof pattern matching (16+): if (obj instanceof String s) — binds + casts in one.`}
      </CodeBlock>

      <CodeBlock language="text" title="Enums are real classes">
{`enum Status { PENDING, ACTIVE, SUSPENDED, CLOSED }     // values(), valueOf(), name(), ordinal()

enum Operation {                          // constant-specific method bodies
    PLUS("+")  { public double apply(double x, double y) { return x + y; } },
    MINUS("-") { public double apply(double x, double y) { return x - y; } };
    private final String symbol;
    Operation(String s) { this.symbol = s; }   // constructors implicitly private
    public abstract double apply(double x, double y);
}

// NEVER persist ordinal() — it's source-order position; reordering constants
// silently reinterprets every stored row. Persist name(), or an explicit code field.
// EnumMap/EnumSet: array/bitset-backed, dramatically faster than HashMap/HashSet
// for enum keys, iterate in declaration order. Always prefer for enum keys.`}
      </CodeBlock>
      <h2>Collections Framework</h2>
      <CodeBlock language="text" title="Complexity and when to reach for what">
{`ArrayList            get O(1)   add-at-end amortized O(1)   insert/remove-middle O(n)
                     Default List. Contiguous memory, cache-friendly iteration.

LinkedList           get O(n)   addFirst/addLast O(1)       remove-via-iterator O(1)
                     Rarely the right answer. Use ArrayDeque for queue/stack work —
                     insert/remove at an arbitrary INDEX is still O(n) (must walk to it);
                     only the link-rewiring itself is O(1).

ArrayDeque           addFirst/addLast/pollFirst/pollLast O(1)   no index access
                     Default Queue AND default Stack — faster than LinkedList,
                     faster than the legacy synchronized java.util.Stack/Vector.

HashMap / HashSet    get/put/contains O(1) average, O(log n) worst (treeified bins)
                     No ordering. Default Map/Set. Requires correct equals+hashCode.

LinkedHashMap/Set    Same as Hash*, plus predictable insertion order (small extra cost).
                     Also does LRU caches via accessOrder + removeEldestEntry.

TreeMap / TreeSet    get/put/contains O(log n), sorted, needs Comparable or Comparator.
                     Range queries: headMap, tailMap, subMap, floor, ceiling.

PriorityQueue        offer/poll O(log n), peek O(1). Heap — iteration order is NOT sorted;
                     only repeated poll() returns elements in order.

EnumMap / EnumSet    Array/bitset backed. Dramatically faster than HashMap/HashSet when
                     the key is an enum. Always prefer these for enum keys.

ConcurrentHashMap    Thread-safe, lock-striped. Use computeIfAbsent/merge for atomic
                     read-modify-write instead of get-then-put (which is NOT atomic
                     even on a ConcurrentHashMap).`}
      </CodeBlock>

      <CodeBlock language="java" title="ConcurrentModificationException — fail-fast, not guaranteed">
{`List<String> b = new ArrayList<>(List.of("a", "b", "c", "d"));
for (String s : b) {
    if (s.equals("c")) b.remove(s);   // removing the SECOND-TO-LAST element...
}
// ...throws NOTHING. remove() decrements size; hasNext() then compares cursor
// to the new size, finds them equal, and reports "done" — "d" is silently
// skipped. Remove "a" instead and you DO get ConcurrentModificationException.
// Use Iterator.remove() or list.removeIf(predicate) for safe removal during iteration.`}
      </CodeBlock>

      <CodeBlock language="text" title="Immutable vs unmodifiable vs fixed-size — three different things">
{`List.of(...) / Set.of(...) / Map.of(...)   TRULY immutable. Null-hostile (NPE on
                                            null element). Set.of/Map.of throw on
                                            duplicate keys.

Arrays.asList(arr)      FIXED-SIZE VIEW backed by the array. set() works and writes
                        THROUGH to arr; add()/remove() throw UnsupportedOperationException.

Collections.unmodifiableList(list)   An UNMODIFIABLE VIEW — rejects writes through
                                      itself, but the BACKING list can still change
                                      underneath you. A wrapper, not a copy.

List.copyOf(list)       Java 10+. A real, immutable COPY — the safe way to hand out
                        internal state. stream.toList() (16+) is also immutable;
                        Collectors.toList() makes no mutability guarantee (in
                        practice ArrayList) — ask for Collectors.toCollection(ArrayList::new)
                        if you need a list you will mutate.`}
      </CodeBlock>

      <CodeBlock language="java" title="Comparator composition (never subtract to compare)">
{`staff.sort(Comparator.comparing(Employee::dept)
                     .thenComparing(Employee::salary, Comparator.reverseOrder())
                     .thenComparing(Employee::name));
staff.sort(Comparator.comparingInt(Employee::salary));      // primitive-specialized, no boxing
staff.sort(Comparator.comparing(Employee::name, Comparator.nullsLast(Comparator.naturalOrder())));

// (a, b) -> a.value() - b.value()  is a REAL BUG: overflow flips the sign for
// large ints and can throw "Comparison method violates its general contract!".
// Always Integer.compare(a, b) or Comparator.comparingInt(...).`}
      </CodeBlock>
      <h2>Generics &amp; Type Erasure</h2>
      <CodeBlock language="java" title="What erasure actually costs you">
{`List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();
a.getClass() == b.getClass();     // true — ONE ArrayList class at runtime.
                                  // <String>/<Integer> is a compiler-only note.

// Compiler-enforced consequences of erasure:
// 1. Cannot instantiate a type parameter:        new T()                    // ERROR
// 2. Cannot create an array of parameterized type: new List<String>[10]     // ERROR
// 3. Cannot instanceof a parameterized type:      obj instanceof List<String>  // ERROR
//    (obj instanceof List<?> IS fine — unbounded wildcard)
// 4. Cannot overload on erased signature: process(List<String>) / process(List<Integer>) // ERROR
// 5. Cannot have a static field of the type parameter's type.
// 6. Cannot catch a type variable: catch (T e) {}                          // ERROR
//    (but "<T extends Throwable> void rethrow(T t) throws T { throw t; }" is fine)

// Type tokens carry T past erasure for APIs that need it at runtime:
<T> T readJson(String json, Class<T> type) { return mapper.readValue(json, type); }`}
      </CodeBlock>

      <InfoBox variant="tip" title="PECS: Producer Extends, Consumer Super">
        <p>
          Read a wildcard as &ldquo;one specific type I don&rsquo;t know&rdquo;, not
          &ldquo;any type&rdquo;. <code>List&lt;? extends Number&gt;</code> — reading is
          safe (whatever it is, it&rsquo;s at least a <code>Number</code>), writing is
          banned (you can&rsquo;t prove an <code>Integer</code> fits an unknown subtype).{' '}
          <code>List&lt;? super Integer&gt;</code> — writing is safe (an{' '}
          <code>Integer</code> fits any supertype), reading only gives you{' '}
          <code>Object</code>. Use <code>? extends T</code> when a structure only{' '}
          <strong>produces</strong> T for you, <code>? super T</code> when it only{' '}
          <strong>consumes</strong> T, and a plain <code>T</code> when you do both. Never
          put a wildcard on a return type. A copy method needs both at once:{' '}
          <code>&lt;T&gt; void copy(List&lt;? super T&gt; dest, List&lt;? extends T&gt; src)</code>.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Bounded &amp; intersection type parameters">
{`<T extends Number> double sum(List<T> list) { ... }               // upper bound
<T extends Comparable<T>> T max(List<T> list) { ... }              // self-referential
<T extends Comparable<T> & Serializable> T maxAndPersist(List<T> l) { ... }  // intersection:
    // at most one class bound, listed FIRST, then interfaces

// @SafeVarargs: legal only on static/final/private methods and constructors —
// asserts a generic varargs param (T... items) is only READ, never stored/exposed
// (heap pollution: the array's erased runtime type isn't actually T[]).`}
      </CodeBlock>

      <h2>Exception Handling</h2>
      <CodeBlock language="text" title="Checked vs unchecked vs Error">
{`Checked     extends Exception, not RuntimeException. Compiler FORCES catch-or-declare.
            IOException, SQLException. Use for recoverable conditions the caller can act on.

Unchecked   extends RuntimeException. Compiler does not require handling — usually a bug.
            NullPointerException, IllegalArgumentException, IllegalStateException,
            ClassCastException. Modern default for domain errors: Spring wraps SQLException
            in unchecked DataAccessException, JPA throws unchecked PersistenceException,
            JDK itself added UncheckedIOException — checked exceptions compose badly with
            lambdas, generics, and layer boundaries that can't actually recover.

Error       extends Error, not Exception. Don't catch — OutOfMemoryError, StackOverflowError.

IllegalArgumentException  a parameter's VALUE is bad
NullPointerException      a parameter was null   (Objects.requireNonNull throws this)
IllegalStateException     the OBJECT is in the wrong state for this call
UnsupportedOperationException  not implemented here`}
      </CodeBlock>

      <CodeBlock language="java" title="try-with-resources: closing order, suppressed exceptions">
{`try (var in = Files.newInputStream(src); var out = Files.newOutputStream(dst)) {
    in.transferTo(out);
}   // resources close in REVERSE declaration order: out.close() first, then in.close()

try (var conn = openConnection()) {
    conn.execute(query);      // throws QueryException
}                             // close() ALSO throws IOException
catch (Exception e) {
    // e is the QueryException (the real cause) — the close() failure is
    // attached, not lost: for (var s : e.getSuppressed()) { ... }
}
// A manual finally block gets this WRONG: the finally-block exception replaces
// the original, silently discarding the real cause. try-with-resources doesn't.
// A return/break/continue INSIDE finally also silently discards a propagating
// exception — keep finally to cleanup only, or use try-with-resources instead.`}
      </CodeBlock>

      <CodeBlock language="java" title="Exception chaining — preserve the cause, always">
{`// throw new ServiceException("context", e)                 -- keeps the cause (Caused by:)
// throw new ServiceException("context: " + e.getMessage())  -- LOSES it (looks similar in review!)
// A custom exception only supports chaining if it forwards to super(message, cause).

// Read a "Caused by:" chain BOTTOM-UP — the LAST one is the root cause;
// everything above is context added on the way out. "... N more" just means
// the JVM omitted frames already printed by the trace above it — nothing lost.`}
      </CodeBlock>

      <CodeBlock language="java" title="Checked exceptions in lambdas — the #1 modern friction point">
{`// Function/Supplier/Consumer declare NO throws clause, so a checked exception
// inside a lambda body simply does not compile:
paths.stream().map(p -> Files.readString(p)).toList();   // DOES NOT COMPILE (IOException)

// Fix: wrap at the boundary with the JDK's purpose-built unchecked wrapper.
paths.stream().map(p -> {
    try { return Files.readString(p); }
    catch (IOException e) { throw new UncheckedIOException(e); }
}).toList();
// Or extract a helper method, or a reusable "unchecked adapter", or just use a
// plain for loop (which CAN declare "throws IOException") when every element can fail.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never use exceptions for control flow">
        <p>
          Constructing an exception captures the entire call stack — often 100x the cost of
          a conditional. Using exceptions for expected outcomes (&ldquo;not found&rdquo;,
          &ldquo;validation failed&rdquo;) is both slow and misleading. Other traps: an empty{' '}
          <code>catch</code> block (silently swallows real bugs); catching{' '}
          <code>Throwable</code>/<code>Error</code>; <code>e.printStackTrace()</code>{' '}
          (invisible in structured logging); logging <em>and</em> rethrowing the same
          exception (duplicate traces for one failure).
        </p>
      </InfoBox>
      <h2>Streams &amp; Lambdas</h2>
      <CodeBlock language="text" title="Core functional interfaces (java.util.function)">
{`Predicate<T>          T -> boolean            .test(t)
Function<T,R>          T -> R                  .apply(t)     .andThen() .compose()
Consumer<T>             T -> void              .accept(t)
Supplier<T>              () -> T               .get()
UnaryOperator<T>       T -> T   (Function<T,T> specialization)
BinaryOperator<T>      (T,T) -> T
// @FunctionalInterface is optional but enforces "exactly one abstract method" at compile time.`}
      </CodeBlock>

      <CodeBlock language="text" title="Intermediate ops (lazy, return a Stream) vs terminal ops (trigger execution)">
{`Intermediate: filter map flatMap sorted distinct limit skip peek
              takeWhile / dropWhile (9+, assume an ORDERED stream)
Terminal:     forEach collect reduce count toList() anyMatch/allMatch/noneMatch
              findFirst/findAny min/max sum (primitive streams)

Nothing runs until a terminal op is called, and elements flow through the WHOLE
pipeline one at a time (not stage-by-stage) — filter().map().findFirst() on a
huge list can touch only a handful of elements. anyMatch/allMatch/findFirst
short-circuit; skip().limit() bounds intermediate work.

A stream can only be consumed ONCE — a second terminal op throws
IllegalStateException. peek() is a debugging tool, not general iteration: it
may not run at all if the pipeline short-circuits.`}
      </CodeBlock>

      <CodeBlock language="java" title="flatMap — nested-structure -> flat stream">
{`orders.stream().flatMap(o -> o.items().stream()).toList();          // Stream<List<Item>> -> Stream<Item>
ids.stream().map(repo::findById).flatMap(Optional::stream).toList(); // drop empty Optionals (9+)
suits.stream().flatMap(s -> ranks.stream().map(r -> r + " of " + s)).toList(); // cartesian product`}
      </CodeBlock>

      <CodeBlock language="java" title="The Collector toolkit">
{`Collectors.toMap(keyFn, valFn)                 // THROWS "Duplicate key" IllegalStateException
Collectors.toMap(keyFn, valFn, Double::sum)    // supply a merge fn whenever keys can collide
Collectors.groupingBy(Employee::dept, Collectors.counting())          // count per group
Collectors.groupingBy(Employee::dept, Collectors.summingDouble(Employee::salary))
Collectors.groupingBy(Employee::dept, Collectors.mapping(Employee::name, Collectors.toList()))
Collectors.groupingBy(Employee::dept, TreeMap::new, Collectors.toList())  // ordered groups
Collectors.partitioningBy(predicate)           // -> Map<Boolean, List<T>>, always both keys
Collectors.teeing(collectorA, collectorB, merger)   // (12+) two collectors, one pass
Collectors.joining(", ", "[", "]")

stream.toList()  vs  stream.collect(Collectors.toList())
   toList() (16+): UNMODIFIABLE, permits nulls. Collectors.toList(): mutability
   UNSPECIFIED (in practice ArrayList). Need a mutable result? Ask explicitly:
   Collectors.toCollection(ArrayList::new).`}
      </CodeBlock>

      <CodeBlock language="text" title="Gatherers (Java 24) — custom INTERMEDIATE operations, finally">
{`stream.gather(Gatherers.windowFixed(500))     // non-overlapping batches of N
stream.gather(Gatherers.windowSliding(7))     // overlapping windows — moving averages
stream.gather(Gatherers.fold(() -> "", (acc,s) -> acc+s))   // running reduction, lazy
stream.gather(Gatherers.scan(() -> 0, Integer::sum))        // like fold, EMITS every step
ids.stream().gather(Gatherers.mapConcurrent(10, id -> client.fetch(id))).toList()
   // runs up to 10 mappings concurrently on VIRTUAL THREADS, preserves encounter
   // order, propagates first failure + cancels the rest. Sequential stream op —
   // concurrency comes from the gatherer, not parallel().

Collector : terminal :: Gatherer : intermediate — write one when an operation is
genuinely STATEFUL ACROSS ELEMENTS (windowing, running totals, dedupe-by-key);
map/filter/flatMap still cover ordinary cases.`}
      </CodeBlock>

      <CodeBlock language="java" title="Primitive streams &amp; creation">
{`IntStream.rangeClosed(1, 100).sum();
words.stream().mapToInt(String::length).sum();          // object -> primitive
IntStream.range(0, 5).boxed().toList();                 // primitive -> object

Stream.of(...)  list.stream()  Arrays.stream(arr)  Stream.ofNullable(x)  Stream.empty()
Stream.iterate(1, n -> n < 100, n -> n * 3)              // self-bounding (9+)
Stream.iterate(1, n -> n * 2).limit(10)                  // infinite — MUST bound
Stream.generate(Math::random).limit(5)
try (var lines = Files.lines(path)) { ... }              // lazy, closes via try-with-resources`}
      </CodeBlock>

      <CodeBlock language="java" title="Parallel streams — measure first">
{`items.parallelStream().forEach(results::add);      // WRONG — ArrayList isn't thread-safe, race
List<String> r = items.parallelStream().map(this::render).toList();   // RIGHT — let the collector merge
items.parallelStream().forEach(System.out::println);        // no ordering guarantee
items.parallelStream().forEachOrdered(System.out::println); // preserves order, at a cost

// Runs on the shared common ForkJoinPool (~cores - 1). Blocking I/O in a parallel
// stream starves EVERY parallel stream in the JVM, including library-internal ones.
// Loses on small collections and poorly-splitting sources (LinkedList, Stream.iterate).
// For I/O fan-out, prefer virtual threads / Gatherers.mapConcurrent / StructuredTaskScope.`}
      </CodeBlock>
      <h2>Concurrency &amp; Threads</h2>
      <CodeBlock language="java" title="Virtual threads (21+) — the new I/O default">
{`Thread.startVirtualThread(() -> { ... });                       // one-off
Thread.ofVirtual().name("worker-", 1L).start(() -> { ... });    // builder

try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    urls.forEach(u -> executor.submit(() -> fetch(u)));
}   // close() waits for all submitted tasks. DON'T pool virtual threads —
    // one fresh vthread per task is the point; pooling re-introduces the
    // bottleneck the pool was designed to solve.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Virtual thread pinning — the rule flipped in Java 24">
        <p>
          A <em>pinned</em> virtual thread can&rsquo;t unmount from its carrier while
          blocked; enough pinning exhausts the carrier pool and throughput collapses.{' '}
          <strong>Java 21&ndash;23:</strong> a <code>synchronized</code> block held across
          a blocking call pins the vthread — the standard fix is{' '}
          <code>ReentrantLock</code> instead, or moving the I/O outside the lock.{' '}
          <strong>Java 24+ (JEP 491):</strong> object monitors were reimplemented so a
          virtual thread <em>can</em> unmount inside <code>synchronized</code> — it no
          longer pins for ordinary I/O. Only native/JNI frames and class-initializer (
          <code>&lt;clinit&gt;</code>) frames still pin. Either way, holding{' '}
          <em>any</em> lock across a slow call still serialises every caller behind one
          round trip — that was never only a pinning problem. Diagnose with the JFR event{' '}
          <code>jdk.VirtualThreadPinned</code> (Java 24+) or{' '}
          <code>-Djdk.tracePinnedThreads=full</code> (21&ndash;23, removed in 24).
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Structured concurrency — two API generations, both preview">
{`// Java 21-24 form: ShutdownOnFailure / ShutdownOnSuccess subclasses.
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var order = scope.fork(() -> orderService.find(id));
    var cust  = scope.fork(() -> customerService.forOrder(id));
    scope.join();
    scope.throwIfFailed();
    return new Enriched(order.get(), cust.get());
}   // if EITHER fork fails, the other is cancelled automatically.

// Java 25+ form (JEP 505, STILL preview in 25 and 26): policy moves into a
// Joiner passed to a static open() factory; join() returns the result directly.
try (var scope = StructuredTaskScope.open(Joiner.<Object>allSuccessfulOrThrow())) {
    var order = scope.fork(() -> orderService.find(id));
    scope.join();                 // throws if any subtask failed
    return order.get();
}
// EVERY version to date needs --enable-preview at both compile AND run time.`}
      </CodeBlock>

      <CodeBlock language="java" title="ScopedValue (21+, final in 25) vs ThreadLocal">
{`static final ScopedValue<UserId> USER = ScopedValue.newInstance();
ScopedValue.where(USER, req.authenticatedUser()).run(() -> serviceLayer.process(req));
// Immutable within the scope, lexically owned, children auto-inherit — bindings
// clear when run() returns, so nothing leaks. Prefer for NEW per-request context;
// ThreadLocal remains what Spring's SecurityContextHolder/MDC logging are built
// on, so it's not going away — just always clear it in finally if you must use it.`}
      </CodeBlock>

      <CodeBlock language="text" title="Which primitive for which job">
{`Task is I/O-bound (HTTP, DB, disk) ................... virtual thread per task
Task is CPU-bound (parallel compute) ................. fixed thread pool ~ CPU count
Coordinate N tasks that all must succeed ............. StructuredTaskScope + allSuccessfulOrThrow
Race N tasks, first success wins ..................... StructuredTaskScope + anySuccessfulOrThrow
Per-request immutable context (traceId, userId) ...... ScopedValue
Legacy per-thread mutable context .................... ThreadLocal (last resort)
Shared counter, low contention ....................... AtomicLong
Shared counter, high contention ...................... LongAdder
Read-heavy map ....................................... ConcurrentHashMap
Producer / consumer queue ............................ BlockingQueue implementations
Read-mostly, write-rarely list ....................... CopyOnWriteArrayList
Scheduled repeating task ............................. ScheduledExecutorService
Non-blocking composition ............................. CompletableFuture`}
      </CodeBlock>

      <CodeBlock language="java" title="CompletableFuture — still the right tool for lazy/non-blocking composition">
{`CompletableFuture.supplyAsync(() -> fetchUser(id))
    .thenApply(User::displayName)
    .exceptionally(t -> "unknown");
user.thenCombine(orders, Combined::new);        // two independent async calls, combine
CompletableFuture.allOf(f1, f2, f3).get();      // wait for many; rethrows a single failure`}
      </CodeBlock>

      <InfoBox variant="info" title="Happens-before edges worth memorizing">
        <p>
          The Java Memory Model lets the compiler/CPU reorder and cache reads/writes absent
          an explicit edge — a field write can be invisible to another thread <em>forever</em>,
          not just &ldquo;late&rdquo;. Edges that establish visibility: unlocking a monitor
          happens-before a later lock of the <em>same</em> monitor; a volatile write
          happens-before every later read of that field; everything before{' '}
          <code>t.start()</code> is visible to <code>t</code>, everything <code>t</code> did
          is visible after <code>t.join()</code>; a properly-constructed object&rsquo;s{' '}
          <code>final</code> fields are visible with no synchronization at all (why immutable
          objects/records are automatically thread-safe); putting into a{' '}
          <code>BlockingQueue</code> or submitting to an <code>ExecutorService</code>{' '}
          happens-before the task runs it. <code>volatile</code> guarantees visibility and
          ordering, <strong>not atomicity</strong> — <code>count++</code> on a{' '}
          <code>volatile int</code> is still a race; use an atomic type.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Traps that show up in concurrent Java code">
{`Pooling virtual threads                    Holding any lock across I/O (serialises callers
Blocking calls on the common ForkJoinPool   regardless of pinning)
ThreadLocal that's never cleared            Ignoring InterruptedException (always restore:
Lock-ordering deadlock (fix: global lock       Thread.currentThread().interrupt())
   acquisition order, or tryLock+backoff)   Double-checked locking without volatile
Calling unknown/overridable code while         (visible non-null but partially-constructed
   holding a lock                              object — use a static holder class instead)`}
      </CodeBlock>
      <h2>I/O &amp; File Handling</h2>
      <CodeBlock language="text" title="Classic java.io vs NIO.2 (Java 7+, recommended)">
{`Files.readString(path)              String, one call (11+)      vs new FileReader + loop
Files.readAllLines(path)            List<String>
Files.lines(path)                   Stream<String>, LAZY — close via try-with-resources
Files.writeString(path, s)          Files.write(path, lines)
Files.copy/move/delete/exists/size/isDirectory/createDirectories
Files.walk(root) / Files.find(root, depth, matcher)   recursive tree walk, both lazy streams
Path.of("a","b.txt")  vs  new File("a/b.txt")  — Path is the modern type`}
      </CodeBlock>

      <CodeBlock language="text" title="Buffering: measured, not assumed (JDK 26, 2.3 MB file)">
{`FileInputStream (unbuffered, byte-at-a-time syscalls):        669 ms
BufferedInputStream(FileInputStream):                           10 ms   <- 66x faster
FileReader (byte stream ALREADY decodes in 8KB internal blocks): 31 ms
BufferedReader(FileReader):                                      10 ms  <- only 3x

FileReader is not "unbuffered" the way FileInputStream is — its internal
StreamDecoder already reads in blocks. Buffer anyway: it's one wrapper, never
hurts, and BufferedReader adds readLine() which FileReader lacks entirely. The
"orders of magnitude" claim in most tutorials describes the BYTE-stream case.
A BufferedWriter also holds data in memory until flushed — try-with-resources
closes (and flushes) it; the manual finally version can lose unflushed data.`}
      </CodeBlock>

      <InfoBox variant="info" title="UTF-8 is the default since Java 18 (JEP 400)">
        <p>
          Before 18, no-charset APIs (<code>new FileReader(f)</code>,{' '}
          <code>new String(bytes)</code>) used the <em>platform</em> default —{' '}
          <code>windows-1252</code> on US Windows, <code>UTF-8</code> on Linux — so the same
          code produced different bytes on different machines. Since 18 it&rsquo;s UTF-8
          everywhere regardless of OS/locale. <code>System.out</code>/<code>System.err</code>{' '}
          still follow console encoding, not the file default. On 17 or older, pass{' '}
          <code>StandardCharsets.UTF_8</code> explicitly — still the most defensive habit
          either way.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="HTTP Client (11+)">
{`HttpClient client = HttpClient.newBuilder()          // immutable + thread-safe: build ONE, reuse
    .version(HttpClient.Version.HTTP_2).connectTimeout(Duration.ofSeconds(5)).build();
HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(10)).GET().build();
HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
res.statusCode();     // 4xx/5xx do NOT throw — always check yourself
client.sendAsync(req, HttpResponse.BodyHandlers.ofString());   // returns a CompletableFuture
// On 21+, prefer the blocking client.send(...) on a virtual thread over sendAsync —
// same scalability, real stack traces, ordinary try/catch.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Java serialization: deserializing untrusted data is remote code execution">
        <p>
          <code>ObjectInputStream.readObject()</code> constructs arbitrary classes named in
          the byte stream and runs their <code>readObject</code> methods before you can
          check the type — real CVE families (Apache Commons Collections gadget chains,
          etc.) exploit exactly this. <strong>Never deserialize data you don&rsquo;t
          control.</strong> Prefer JSON/Protobuf/Avro, which build a value from a schema
          instead of instantiating whatever the payload names. If you must keep it, install
          an allow-list <code>ObjectInputFilter</code> (JEP 290/415) — never a deny-list.
          A <code>record</code> deserializes through its canonical constructor, so compact-
          constructor validation actually runs — one more reason to model data as records.
        </p>
      </InfoBox>

      <h2>Optional</h2>
      <InfoBox variant="tip" title="The golden rule: return type only">
        <p>
          <code>Optional&lt;T&gt;</code> is a <strong>return-type contract</strong>, nothing
          more — never a field, a parameter, or a collection element. Return it when the
          caller genuinely can&rsquo;t know from context whether a result exists (a lookup:{' '}
          <code>findById</code>). Everywhere else use plain <code>T</code> (possibly null,
          documented) or the natural empty value (an empty <code>List</code>, never{' '}
          <code>Optional&lt;List&gt;</code>).
        </p>
      </InfoBox>

      <CodeBlock language="java" title="The six anti-patterns, condensed">
{`// 1. FIELD — Optional isn't Serializable, wastes memory, and every framework
//    (JPA/Jackson/Kryo) needs teaching about it one at a time. Store nullable T,
//    expose Optional only at the accessor: Optional<String> nickname() { return Optional.ofNullable(nickname); }
// 2. PARAMETER — search(Optional<String> id) pushes ceremony onto every caller and is
//    WORSE than null. Use overloads, or a criteria record when params explode.
// 3. Optional<List<T>> — an empty List already IS the empty state; two empty states to check.
// 4. .get() with no guard — throws NoSuchElementException, defeats the point. Use orElseThrow().
// 5. orElse(expensive()) — Java evaluates EVERY argument before the call, so
//    expensive() runs on EVERY invocation, even when the Optional is present.
//    orElseGet(this::expensive) only calls the Supplier if actually needed.
// 6. isPresent() + get() — the exact null-check-shaped code Optional exists to replace.
//    Use ifPresent(consumer) / map(fn).orElse(fallback) instead.`}
      </CodeBlock>

      <CodeBlock language="text" title="Optional API — only what you'll actually use">
{`Optional.of(v)            NPE if v is null — an assertion for "must not be null"
Optional.ofNullable(v)    safe wrap                    Optional.empty()
opt.orElse(fallback)      EAGER — fine for constants    opt.orElseGet(() -> compute())  LAZY
opt.orElseThrow()         (10+) NoSuchElementException, clearer name than get() — prefer it
opt.map(fn)  opt.flatMap(fn)  opt.filter(pred)  opt.or(() -> other)   (9+, stays in Optional)
opt.ifPresent(c)  opt.ifPresentOrElse(c, r)     (9+)
opt.stream()               (9+) 0-or-1-element stream — pairs with flatMap(Optional::stream)`}
      </CodeBlock>
      <h2>JVM Internals &amp; Garbage Collection</h2>
      <CodeBlock language="text" title="Memory regions and the flags that actually control each one">
{`Heap       every object from 'new' — shared across threads, the ONLY region GC manages.
           -Xmx (max) / -Xms (initial). Overflow: OutOfMemoryError: Java heap space.

Metaspace  class metadata (loaded Class objects, bytecode, constant pools) — NOT your
           objects. Native (off-heap) memory since Java 8 replaced PermGen; grows
           dynamically by default (MaxMetaspaceSize is effectively unlimited unless set,
           so a classloader leak looks like a native leak, not a heap one, until you
           check jcmd <pid> VM.metaspace). -XX:MaxMetaspaceSize.

Stack      PER-THREAD. One frame per in-flight method call, holding locals + return
           address; popped on return. -Xss. Overflow: StackOverflowError. Recursion
           depth is bounded by STACK size, not heap size — a service hitting
           StackOverflowError needs more -Xss, not more -Xmx; a classloader leak needs
           Metaspace attention, not heap. Conflating the three tunes a flag that can't
           possibly fix the symptom.`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Collector</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Status</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Model</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>G1</strong></td>
            <td style={{ padding: '0.75rem' }}>Default (ergonomic), no flags needed since Java 9</td>
            <td style={{ padding: '0.75rem' }}>Region-based; mostly-STW young pauses, mostly-concurrent old-gen marking, targets <code>MaxGCPauseMillis</code> (default 200ms) by letting the young gen float 5&ndash;60% of heap — NOT the fixed <code>NewRatio</code> 1:2 split Parallel/Serial GC use</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>ZGC</strong></td>
            <td style={{ padding: '0.75rem' }}>Production, non-experimental — <code>-XX:+UseZGC</code> alone</td>
            <td style={{ padding: '0.75rem' }}>Generational by default; nearly all work concurrent — measured STW phases were 0.001&ndash;0.016ms on JDK 26, genuinely sub-millisecond</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Shenandoah</strong></td>
            <td style={{ padding: '0.75rem' }}>Not a JDK-version question — a BUILD question: not compiled into Oracle&rsquo;s OpenJDK builds, but is in Red Hat/Eclipse Temurin</td>
            <td style={{ padding: '0.75rem' }}>Concurrent, low-pause alternative to ZGC</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="text" title="Stop-the-world, concretely (real G1 log, JDK 26)">
{`GC(0) Pause Young (Normal) (G1 Evacuation Pause) 5M->1M(10M) 0.298ms
// EVERY application thread in the JVM suspends for the pause duration —
// not just the thread that triggered it. No bytecode runs, no request is
// served, regardless of what each thread was doing. A 200ms G1 pause (the
// default pause-time TARGET) shows up as 200ms of added p99 latency across
// the WHOLE service simultaneously — a different failure shape than one slow request.

// JFR — built into every JDK since 11 (JEP 328), zero extra install:
java -XX:StartFlightRecording=filename=demo.jfr,duration=10s App
jcmd <pid> JFR.start name=liveDemo filename=live.jfr duration=5s   // attach to a LIVE process, no restart
jfr summary demo.jfr`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to actually touch any of this">
        <p>
          Almost never, for a typical service. Reaching for <code>-Xmx</code>, a collector
          switch, or GC flags <em>before</em> you have evidence is a textbook premature
          optimization. Workflow: notice a real symptom (latency spikes,{' '}
          <code>OutOfMemoryError</code>, throughput falling under load) → turn on{' '}
          <code>-Xlog:gc</code> or attach JFR → read what it says → then change one
          thing with a before/after log to prove it helped.
        </p>
      </InfoBox>

      <h2>Reflection &amp; Annotations</h2>
      <CodeBlock language="java" title="Class<?>, private access, and the module-system wall">
{`Class<?> c1 = someInstance.getClass();          // needs a live INSTANCE
Class<?> c2 = Class.forName("java.util.ArrayList");   // needs only a STRING — no
   // compile-time reference anywhere, and it RUNS the class's static initializer.
   // c1 == c2 when same class+loader: exactly ONE Class object is cached per pair.

Field f = clazz.getDeclaredField("balance");    // finds PRIVATE members too (Declared* variants)
f.canAccess(obj);                               // ask first — modern replacement for isAccessible()
f.setAccessible(true);                          // lifts the access CHECK; without it: IllegalAccessException
f.get(obj);  f.set(obj, value);                 // now legal

// Since Java 9 (JPMS): a SECOND, independent access layer on top of public/private.
// A named module must explicitly "opens" a package before setAccessible(true) works
// on it from outside the module — exports alone is NOT enough (exports grants normal
// compile-time access to public types only, not reflective access to internals).
// java.base does not open java.lang by default:
String.class.getDeclaredField("value").setAccessible(true);
// -> InaccessibleObjectException: module java.base does not "opens java.lang" to
//    unnamed module ... — fix: --add-opens java.base/java.lang=ALL-UNNAMED
// Your OWN classpath application classes (unnamed module) are unaffected by this —
// it only bites reflection into JDK internals or another strongly-encapsulated module.
// This is exactly what broke Mockito/Lombok/serialization libs on the Java 8->9 jump.`}
      </CodeBlock>

      <CodeBlock language="text" title="@Retention gates whether reflection can see an annotation AT ALL">
{`SOURCE   discarded by the compiler (@Override)                    getAnnotation() -> null
CLASS    kept in .class bytecode, NOT loaded by the JVM at runtime  getAnnotation() -> null
         (the default if @Retention is omitted!)
RUNTIME  loaded onto the Class/Method/Field object                 getAnnotation() -> the annotation

// Every framework annotation that drives runtime behavior is RUNTIME-retained:
// Spring's @Component/@Autowired, JUnit's @Test, Jackson's @JsonProperty. Without
// it, reflection genuinely cannot retrieve what the JVM never loaded.`}
      </CodeBlock>

      <InfoBox variant="info" title="Reflection is slower — measured, not just asserted">
        <p>
          <code>Method.invoke</code> goes through argument boxing and indirection the JIT
          can&rsquo;t inline the way it can a direct call site. A tight loop calling a
          trivial static method 50 million times after JIT warmup (JDK 26): direct call
          ~0.27&ndash;0.28 ns/call, reflective call ~4.6&ndash;5.85 ns/call —{' '}
          <strong>roughly 17&ndash;20x slower</strong>. The exact multiplier moves with
          JDK/hardware; the order of magnitude is durable. Irrelevant for a DI container
          doing it a few hundred times at startup — real for a per-request hot path
          (where <code>MethodHandle</code> or generated bytecode accessors take over).
        </p>
      </InfoBox>
      <h2>Build Tools: Maven &amp; Gradle</h2>
      <CodeBlock language="text" title="Maven lifecycle — fixed and ordered, every repo reads the same way">
{`validate -> compile -> test -> package -> verify -> install -> deploy
// mvn package runs every phase UP TO AND INCLUDING package, in order — not
// configurable per-project. mvn <phase> is the general pattern: mvn test,
// mvn install, etc. all run everything before that phase too.
// pom.xml = "Project Object Model". Maven "nearest wins" (by dependency-tree
// depth) when two branches disagree on a transitive dependency's version.`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Scope</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Compile classpath</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Runtime classpath</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Packaged</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>compile</code> (default)</td>
            <td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>Yes</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>test</code></td>
            <td style={{ padding: '0.75rem' }}>Test only</td><td style={{ padding: '0.75rem' }}>Test only</td><td style={{ padding: '0.75rem' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>provided</code> <span style={{ opacity: 0.7 }}>(servlet-api)</span></td>
            <td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>No</td><td style={{ padding: '0.75rem' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>runtime</code> <span style={{ opacity: 0.7 }}>(JDBC driver)</span></td>
            <td style={{ padding: '0.75rem' }}>No</td><td style={{ padding: '0.75rem' }}>Yes</td><td style={{ padding: '0.75rem' }}>Yes</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="text" title="Standard directory layout &amp; BOMs">
{`src/main/java        src/main/resources     src/test/java     src/test/resources
target/               build output — compiled classes, packaged JAR/WAR, reports

// A BOM (Bill of Materials) imported into <dependencyManagement> pins compatible
// versions for a whole library family — declare dependencies from it with NO
// <version>, and they all get the BOM's mutually-compatible choice. This is how
// spring-boot-dependencies keeps every Spring module in lockstep.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Gradle: api leaks to consumers, implementation does not">
        <p>
          Both configurations (from the <code>java-library</code> plugin) put a
          dependency on your own module&rsquo;s compile + runtime classpath — the
          difference is what happens to <strong>consumers</strong>.{' '}
          <code>api(dep)</code> becomes part of your module&rsquo;s public API: any
          project depending on your module gets that dependency on <em>its own</em>{' '}
          compile classpath transitively, whether it wants it or not.{' '}
          <code>implementation(dep)</code> stays internal — your code can use it, but
          consumers can&rsquo;t see or compile against it, even indirectly. This is
          also a build-speed lever: bumping an <code>implementation</code> dependency
          only recompiles your module; bumping an <code>api</code> dependency forces
          every downstream consumer to recompile too. Default to{' '}
          <code>implementation</code>; reach for <code>api</code> only when a
          dependency&rsquo;s type actually appears in your public method signatures.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Maven vs Gradle — when teams actually reach for which">
{`New Spring Boot project (start.spring.io)     Maven   — the Initializr default;
                                                        XML rigidity is a FEATURE
Android app                                    Gradle  — exclusively, no Maven path
Large multi-module monorepo                    Gradle  — incremental builds + build
                                                        cache (UP-TO-DATE task
                                                        skipping, shared-cache pulls)
                                                        have no first-party Maven
                                                        equivalent
Team wants one obvious way to do everything    Maven   — declarative XML resists
                                                        clever custom logic
Build needs real custom logic (codegen)        Gradle  — a real Kotlin/Groovy DSL
                                                        runs inside the build itself

Both read the same Maven Central and produce the same JARs — switching later is
a real project, but it's a rewrite of the build description, not your code.`}
      </CodeBlock>

      <h2>Testing: Test Doubles &amp; Mockito</h2>

      <CodeBlock language="text" title="The five test doubles (Meszaros), and what Mockito gives you">
{`dummy    passed to satisfy a signature, never used
stub     returns canned answers          -> when(x).thenReturn(y)
spy      a REAL object that records      -> spy(obj)  (calls real methods!)
mock     preprogrammed + verified        -> mock(X.class) + verify(...)
fake     a working lightweight impl      -> MOCKITO HAS NO FAKE.
         (in-memory repo, H2)               write it yourself - 30 lines
                                            beats stubbing it in 40 classes`}
      </CodeBlock>

      <CodeBlock language="java" title="The API, in one block">
{`@ExtendWith(MockitoExtension.class)          // JUnit 5
class OrderServiceTest {
    @Mock  EmailClient email;                 // a mock
    @Spy   AuditLog    audit = new AuditLog(); // a real object, recorded
    @InjectMocks OrderService svc;            // constructor-injected with the above

    @Test void t() {
        when(email.send(anyString())).thenReturn(true);      // stub
        when(x.get()).thenReturn(1, 2, 3);                   // consecutive returns
        when(x.get()).thenAnswer(inv -> inv.getArgument(0)); // dynamic

        doThrow(new IllegalStateException()).when(x).voidMethod();  // void methods
        doReturn(5).when(spyObj).realMethod();               // SPIES: use doReturn!

        svc.place(order);

        verify(email).send("a@b.c");
        verify(email, times(2)).send(any());
        verify(email, never()).send("x");
        verifyNoMoreInteractions(email);

        var cap = ArgumentCaptor.forClass(String.class);
        verify(email).send(cap.capture());
        assertEquals("a@b.c", cap.getValue());
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="The rules that produce confusing failures">
{`MATCHERS: all-or-nothing. If ONE argument uses a matcher, ALL must.
  when(svc.f("a", anyInt()))   -> InvalidUseOfMatchersException
                                  "3 matchers expected, 2 recorded"
  when(svc.f(eq("a"), anyInt()))  correct

  !! A matcher failure leaves Mockito's thread-local stack DIRTY, so the
     NEXT test class can fail with UnfinishedStubbingException pointing
     into the FIRST one. "Passes alone, fails in the suite" = look here.

SPIES call the real method during when(...):
  when(spy.get())  -> ACTUALLY RUNS get() first (can throw!)
  doReturn(v).when(spy).get()   -> safe, never runs it

STRICT STUBS (the default under MockitoExtension):
  an unused stub fails the test with UnnecessaryStubbingException,
  thrown AFTER the test body, in MockitoExtension.afterEach.
  lenient() on one stub, or @MockitoSettings(strictness = LENIENT).

@InjectMocks NPE: the stack trace shows only PRODUCTION frames
  ("because \\"this.email\\" is null") with no mention of Mockito -
  it means a dependency was not matched and stayed null.`}
      </CodeBlock>

      <CodeBlock language="text" title="Setup facts that bite">
{`mockito-inline is OBSOLETE. Last release 5.2.0 (2023-03-09) vs
  mockito-core 5.23.0 (2026-03-11). The inline mock-maker has been the
  DEFAULT since Mockito 5 - adding mockito-inline pins a stale engine.
  It is what enables mocking final classes/static methods:
      try (var m = mockStatic(Files.class)) { ... }   // scoped!

MODERN JDKs break Mockito's self-attach. On JDK 26 every run prints
  "Mockito is currently self-attaching to enable the inline-mock-maker.
   This will no longer work in future releases of the JDK"
  plus four JVM agent warnings. Fix - pass Mockito as a javaagent:
      maven-dependency-plugin (goal: properties)
      + surefire argLine: -javaagent:\${org.mockito:mockito-core:jar}

SPRING BOOT: @MockBean/@SpyBean deprecated in Boot 3.4, REMOVED in Boot 4
  -> @MockitoBean / @MockitoSpyBean
     (org.springframework.test.context.bean.override.mockito)`}
      </CodeBlock>

      <h2>Section Index</h2>
      <CodeBlock language="text" title="All 17 lessons, in reading order">
{`1.  Introduction to Java                    JVM/JDK/JRE, compilation, main()'s real rules
2.  Syntax & Data Types                     Primitives, autoboxing, Strings, control flow
3.  OOP Fundamentals                        Encapsulation, inheritance, @Override, enums
4.  Collections Framework                   List/Set/Map, equals+hashCode, Comparator
5.  Generics & Type System                  Erasure, wildcards, PECS
6.  Exception Handling                      Checked vs unchecked, try-with-resources, chaining
7.  Streams & Lambdas                       Functional interfaces, Collectors, Gatherers (24)
8.  Concurrency & Threads                   Virtual threads, pinning, structured concurrency
9.  I/O & File Handling                     NIO.2, buffering, HTTP client, serialization risk
10. Advanced Java Features                  var, records, sealed types, pattern matching
11. Optional — Best & Worst Practices       The golden rule + six anti-patterns
12. JVM Internals & Garbage Collection      Heap/Metaspace/Stack, G1 vs ZGC, stop-the-world
13. Reflection & Annotations                Class<?>, setAccessible, JPMS, @Retention
14. Build Tools: Maven & Gradle             Lifecycle/tasks, scopes, api vs implementation
15. Unit Testing Fundamentals               Dummies, stubs, spies, mocks, fakes
16. Mockito in Practice                     Matchers, strict stubs, captors, statics
17. This page`}
      </CodeBlock>
    </LessonLayout>
  );
}
