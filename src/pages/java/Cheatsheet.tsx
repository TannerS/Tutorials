import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function JavaCheatsheet() {
  return (
    <GuideLayout
      title="JAVA"
      kicker="FIELD GUIDE"
      glyph="☕"
      tagline="Modern Java — syntax, OOP, collections, streams, concurrency, and the traps that survive code review."
      meta={['Java 17 / 21 / 25 LTS', '24 panels']}
      page="1 / 1"
      footer="This page is for recall. The lessons in this section carry the reasoning, the benchmarks and the worked examples."
      prev={{ path: '/java/mockito', label: 'Mockito in Practice' }}
      next={null}
    >
      <GuidePanel n={1} title="Types & Equality" accent="blue" glyph="🔤">
        <GuideCode>{`String a = "hi", b = "hi";
a == b        // true  — interned literals, an accident
a.equals(b)   // true  — the only correct test

Integer x = 127, y = 127;   x == y  // true  (cached -128..127)
Integer p = 128, q = 128;   p == q  // FALSE — outside the cache`}</GuideCode>
        <GuideRules items={[
          '== compares references for objects, values for primitives.',
          'Autoboxing in a loop allocates — use int, not Integer, for counters.',
          'Override equals and hashCode TOGETHER, or HashMap silently misbehaves.',
          'A hash lookup is two steps: hashCode() picks the bucket, then equals() breaks ties inside it — a broken hashCode means equals() never even runs.',
          'A hash-relevant field mutated after insertion strands the object in the wrong bucket, unreachable by contains/remove — keys should be immutable.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Primitives, Casting & Operators" accent="purple" glyph="🔢" span={2}>
        <GuideTable
          head={['Type', 'Size', 'Range / notes']}
          rows={[
            ['byte', '1 byte', '-128..127'],
            ['short', '2 byte', '-32,768..32,767'],
            ['int', '4 byte', '~±2.1 billion — the default whole-number type'],
            ['long', '8 byte', '~±9.2 quintillion — suffix with L'],
            ['float', '4 byte', '~7 digits — suffix with f'],
            ['double', '8 byte', '~16 digits — the default decimal type'],
            ['char', '2 byte', 'UTF-16 code unit, 0..65,535'],
            ['boolean', 'JVM-dependent', 'true / false only'],
          ]}
        />
        <GuideCode>{`int million = 1_000_000;             // underscores are legal digit separators
long big = 10_000_000_000L;           // no L -> compiles as an int literal, overflows
var list = new ArrayList<String>();   // var infers the EXACT type — never Object

7 / 2                 // 3   — int division truncates; use 7 / 2.0 for 3.5
-7 % 2                 // -1  — % takes the sign of the LEFT operand
x >>> 1                 // unsigned shift, fills with 0 (no <<< — only >>>)
if (s != null && s.isEmpty())   // short-circuit; a single '&' here would NPE

byte b = 10; b += 300;             // COMPILES — += hides an implicit narrowing cast
double avg = (double) sum / count;       // cast BEFORE dividing, not after
Integer.MAX_VALUE + 1                    // wraps silently to MIN_VALUE`}</GuideCode>
        <GuideRules items={[
          'Locals have no default value and must be assigned before use — only fields and array elements zero automatically.',
          'A lambda or anonymous class can only capture a local that is final or effectively final (never reassigned after init).',
          'Narrowing needs an explicit cast and truncates rather than rounds — reach for Math.round or BigDecimal when the arithmetic matters.',
          'var is restricted to locals with an initializer — not fields, parameters, or return types.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Strings — Immutability & Text Blocks" accent="green" glyph="🔡">
        <GuideCode>{`s.toUpperCase();              // returns a NEW string — s itself is unchanged
"java".equals(input);         // constant first — null-safe if input is null

var sb = new StringBuilder();
for (var w : words) sb.append(w);      // O(n) — += in a loop is O(n^2)

"  x  ".strip();  "   ".isBlank();  "ab".repeat(3);  "Hi %s".formatted(n);

String json = """
    {"lang": "Java"}
    """;   // text block — no escaped quotes; closing """ sets the stripped margin`}</GuideCode>
        <GuideRules items={[
          'char is a UTF-16 code unit, not "a character" — an emoji or rare CJK glyph is two chars; count real characters with codePoints().',
          'The compiler already optimizes concatenation within a single expression — StringBuilder only earns its keep inside a loop.',
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="OOP Fundamentals" accent="amber" glyph="🏛️" span={2}>
        <GuideDefs
          items={[
            ['this(...)', 'first statement only — delegates to another constructor in the same class'],
            ['super(...)', 'first statement only — must run before the subclass adds its own state'],
            ['overriding', 'same signature; resolved at RUNTIME by the actual class of the object'],
            ['overloading', 'different parameters; resolved at COMPILE time by the arguments passed'],
          ]}
        />
        <GuideCode>{`public class Dog extends Animal {
    public Dog(String name) { super(name); }      // must be the first statement
}

public interface Drawable {
    void draw();                                    // implementers must provide
    default void erase() { System.out.println("erasing"); }  // free since Java 8
}

Shape[] shapes = { new Circle(5), new Square(4) };
for (Shape s : shapes) System.out.println(s.area());    // area() dispatches per actual type`}</GuideCode>
        <GuideRules items={[
          'A class extends at most one class but implements any number of interfaces — reach for abstract class only when subclasses share state or a constructor.',
          'Extending a class you do not control couples you to its internals, not just its contract — HashSet.addAll() calling its own add() internally is the classic fragile-base-class trap. Prefer implementing the interface and delegating to a field.',
          'Nested class: default to static (no hidden reference to the enclosing instance); use a plain inner class only when it genuinely needs state from the enclosing instance.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Annotations & Lombok" accent="pink" glyph="🏷️">
        <GuideCode>{`@Override                            // catches a typo'd signature at compile time
public String toString() { ... }

@FunctionalInterface                  // locks the interface to ONE abstract method
interface Transformer<T, R> { R transform(T in); }

@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD)
public @interface Cacheable { String key() default ""; }

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserDto { private Long id; private String name; }`}</GuideCode>
        <GuideRules items={[
          'RUNTIME retention is required for anything read via reflection — CLASS (the default) is invisible at runtime.',
          'Avoid @Data on a JPA @Entity — generated equals/hashCode over a lazy-loaded association can trigger an unwanted fetch.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Generics & Erasure" accent="cyan" glyph="🔣">
        <GuideCode>{`// PECS — Producer Extends, Consumer Super
void copy(List<? extends T> src, List<? super T> dst)

List<String> l = new ArrayList<>();
l.getClass() == new ArrayList<Integer>().getClass();  // true — erased`}</GuideCode>
        <GuideRules items={[
          'Generics are erased at runtime: no new T[], no instanceof List<String>.',
          'That erasure is what broke Mockito and serialization libraries on the Java 8 → 9 jump.',
          'Arrays are covariant and unsound: Object[] o = new String[3] compiles, then o[0]=42 throws ArrayStoreException at runtime. Generics are invariant instead — List<Object> l = new ArrayList<String>() fails to COMPILE, catching the same mistake earlier.',
          'Multiple bounds: <T extends Number & Comparable<T>> — at most one class bound, and it comes first.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="enum — State & Behavior" accent="red" glyph="🔘">
        <GuideCode>{`public enum Operation {
    PLUS("+")  { public double apply(double a, double b) { return a + b; } },
    TIMES("*") { public double apply(double a, double b) { return a * b; } };

    private final String symbol;
    Operation(String symbol) { this.symbol = symbol; }
    public abstract double apply(double a, double b);
}

Status.values();          // all constants, declaration order
Status.valueOf("OPEN");   // IllegalArgumentException if unknown`}</GuideCode>
        <GuideRules items={[
          'A Java enum is a real class — fields, constructors, per-constant method bodies, interfaces. Constants are JVM singletons, so == is safe.',
          'Never persist ordinal() — reordering constants reinterprets every stored row. JPA: @Enumerated(EnumType.STRING), never the ORDINAL default.',
          'EnumMap / EnumSet are array-backed and faster than HashMap/HashSet for enum keys.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Records, Sealed, Pattern Matching" accent="blue" glyph="🧩">
        <GuideCode>{`record Point(int x, int y) {
    Point { if (x < 0) throw new IllegalArgumentException(); }  // compact ctor
}

sealed interface Shape permits Circle, Square {}

// switch pattern matching + record deconstruction (21+)
String d = switch (shape) {
    case Circle c when c.r() > 10 -> "big circle";
    case Circle(double r)         -> "circle " + r;
    case Square s                 -> "square";
};`}</GuideCode>
        <GuideRules items={[
          'Records give you equals, hashCode, toString and accessors — final and shallowly immutable.',
          'sealed + switch gives EXHAUSTIVENESS: the compiler fails if you miss a case.',
          '"Immutable" is shallow — a mutable component (e.g. a List) leaks through both the constructor argument and the accessor. Copy it in the compact constructor: members = List.copyOf(members).',
          'case null must be explicit in a pattern-matching switch — switching on a null Object still NPEs without it.',
          'Every direct permitted subtype of a sealed type must declare final, sealed, or non-sealed — omitting it is a compile error.',
          'switch expressions must be exhaustive and arrow branches do not fall through; use yield (not return) inside a brace block that needs more than one statement.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Collections — Pick One" accent="purple" glyph="📚" span={2}>
        <GuideTable
          head={['Need', 'Use', 'Notes']}
          rows={[
            ['ordered, indexed', 'ArrayList', 'O(1) get, O(n) insert-in-middle'],
            ['heavy insert/remove at ends', 'ArrayDeque', 'beats LinkedList in practice'],
            ['unique', 'HashSet', 'needs equals + hashCode'],
            ['unique, sorted', 'TreeSet', 'needs Comparable or a Comparator'],
            ['key → value', 'HashMap', 'null key allowed, unordered'],
            ['insertion order kept', 'LinkedHashMap', 'also does LRU via removeEldest'],
            ['concurrent', 'ConcurrentHashMap', 'never Hashtable'],
          ]}
        />
        <GuideCode>{`map.computeIfAbsent("k", key -> new ArrayList<>());
map.merge("k", 1, Integer::sum);        // increment-or-init counter

Deque<String> stack = new ArrayDeque<>();
stack.push("a"); stack.pop();            // LIFO
stack.offer("a"); stack.poll();          // FIFO queue, same class`}</GuideCode>
        <GuideRules items={[
          'List.of / Map.of return IMMUTABLE collections — add() throws UnsupportedOperationException.',
          'Arrays.asList is fixed-size and writes through to the array.',
          'Removing from a list while iterating throws ConcurrentModificationException — use Iterator.remove or removeIf.',
          'Set.of / Map.of throw on duplicate keys or elements at construction — a bug HashSet/HashMap let straight through.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Streams" accent="green" glyph="🌊">
        <GuideCode>{`var byDept = staff.stream()
    .filter(e -> e.salary() > 50_000)
    .collect(Collectors.groupingBy(Employee::dept,
             Collectors.counting()));

IntStream.range(0, 10).sum();
list.stream().mapToInt(Integer::intValue).average().orElse(0);`}</GuideCode>
        <GuideRules items={[
          'A stream is consumed once — reusing one throws IllegalStateException.',
          'Nothing runs until a TERMINAL operation (collect, forEach, reduce, count).',
          'parallelStream() helps only for big, CPU-bound, side-effect-free work. It uses the common ForkJoinPool — never block inside it.',
          'peek() is for debugging; the JIT may skip it entirely.',
          'flatMap turns a Stream<List<T>> into a flat Stream<T> — the fix for a nested for loop or a Stream<Optional<T>>.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Advanced Collections & Streams (21+)" accent="amber" glyph="🚀" span={2}>
        <GuideCode>{`list.getFirst(); list.getLast();              // SequencedCollection, Java 21
list.reversed();                                // live reverse view, no copy

groupingBy(Employee::dept, counting())                       // Map<Dept, Long>
groupingBy(Employee::dept, mapping(Employee::name, toList()))
toMap(Employee::dept, Employee::salary, Double::sum)          // merge fn REQUIRED

.gather(Gatherers.windowFixed(500))             // Java 24 — batch into chunks
.gather(Gatherers.mapConcurrent(10, id -> client.fetch(id)))  // bounded fan-out`}</GuideCode>
        <GuideRules items={[
          'The two-arg Collectors.toMap throws on the first duplicate key — always pass a merge function unless the key is a proven unique id.',
          'getFirst/getLast/reversed give List, Deque, LinkedHashSet and LinkedHashMap one shared vocabulary instead of type-specific methods.',
          'Gatherers are to intermediate stream operations what collect() is to terminal ones — a supported way to write windowing/running-total steps.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Optional" accent="pink" glyph="❓" span={2}>
        <GuideCode>{`opt.map(User::name).orElse("anon");
opt.orElseGet(() -> expensive());   // lazy — prefer for costly defaults
opt.orElseThrow(() -> new NotFound());
opt.ifPresentOrElse(this::use, this::miss);`}</GuideCode>
        <GuideRules items={[
          'A RETURN type. Never a field, never a parameter, never in a DTO — it is not Serializable.',
          'opt.get() without isPresent is the anti-pattern Optional exists to remove.',
          'Never return null from a method declared Optional.',
          'orElse(x) evaluates x unconditionally, even when the Optional is present — orElseGet(supplier) is the lazy version; use it whenever the default is expensive to build.',
          'Optional.of(v) throws immediately if v is null — that is not a safety net. Use Optional.ofNullable for anything that might be null.',
          'Do not wrap a type that already has an empty state (List, Set, Map, String) in Optional — return the empty collection instead of forcing callers to unwrap twice.',
        ]} />
      </GuidePanel>

      <GuidePanel n={13} title="Exceptions" accent="cyan" glyph="🚨" span={2}>
        <GuideDefs
          items={[
            ['checked', 'extends Exception — must be declared or caught'],
            ['unchecked', 'extends RuntimeException — programming errors'],
            ['Error', 'OutOfMemoryError etc. — do not catch'],
          ]}
        />
        <GuideCode>{`try (var in = Files.newInputStream(p)) { ... }   // auto-close, reverse order

catch (IOException | SQLException e) { ... }     // multi-catch
throw new AppException("context", e);            // ALWAYS chain the cause`}</GuideCode>
        <GuideCode>{`// Stack traces read BOTTOM-UP in time; the topmost frame that is YOUR
// code is where to look, not the JDK internals above it.
// "Caused by:" blocks read TOP-DOWN instead — the LAST one is the root cause.

Objects.requireNonNull(repo, "repository");   // fail at the boundary, name the param
// IllegalArgumentException: bad VALUE.  NullPointerException: null.  IllegalStateException: wrong STATE.

paths.stream().map(p -> {                      // checked exceptions do not compose
    try { return Files.readString(p); }         // with lambdas — wrap them
    catch (IOException e) { throw new UncheckedIOException(e); }
});`}</GuideCode>
        <GuideRules items={[
          'Never swallow: catch (Exception e) {} destroys the evidence.',
          'A return inside finally discards a pending exception. Never do it.',
          'try-with-resources keeps the exception from the body as primary and attaches any close()-time failure as e.getSuppressed() — a hand-written finally block silently loses one of the two.',
          'Checked exceptions do not compose with lambdas/streams — wrap in UncheckedIOException (or extract a helper) rather than fighting the functional interface signature.',
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="Files & I/O" accent="red" glyph="📁">
        <GuideCode>{`Path p = Path.of("data", "in.txt");
String s   = Files.readString(p);
List<String> ls = Files.readAllLines(p);
try (var lines = Files.lines(p)) { ... }   // STREAM: must be closed

var client = HttpClient.newHttpClient();
client.send(req, BodyHandlers.ofString());`}</GuideCode>
        <GuideRules items={[
          'Files.lines returns a stream holding an OS handle — always in try-with-resources.',
          'Java serialization is a deserialization-gadget risk. Prefer JSON.',
          'UTF-8 has been the JVM default charset since Java 18 (JEP 400) — before that it followed the OS platform default, so the same code produced different bytes on Windows vs Linux. Passing StandardCharsets.UTF_8 explicitly works on every version.',
        ]} />
      </GuidePanel>

      <GuidePanel n={15} title="Dates & Money" accent="blue" glyph="📅">
        <GuideDefs
          items={[
            ['LocalDate', 'a date, no time, no zone'],
            ['LocalDateTime', 'date+time, NO zone — not an instant'],
            ['Instant', 'a point on the UTC timeline — store this'],
            ['ZonedDateTime', 'instant + zone rules, for display'],
            ['BigDecimal', 'money. Never double.'],
          ]}
        />
        <GuideCode>{`new BigDecimal("0.1")   // correct
BigDecimal.valueOf(0.1) // ok
new BigDecimal(0.1)     // 0.1000000000000000055511151231257827
a.compareTo(b) == 0     // equals() also compares SCALE`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={16} title="Concurrency Fundamentals" accent="purple" glyph="🧵" span={2}>
        <GuideDefs
          items={[
            ['Runnable / Callable', 'unit of work — Callable returns a value, submitted to an ExecutorService for a Future'],
            ['synchronized', 'mutual exclusion AND visibility on entry/exit of the block'],
            ['volatile', 'visibility only, NOT atomicity — count++ under volatile is still a race'],
          ]}
        />
        <GuideCode>{`ExecutorService exec = Executors.newFixedThreadPool(4);    // known, bounded work
Executors.newVirtualThreadPerTaskExecutor();                 // I/O-heavy, unbounded (21+)

Future<Integer> f = exec.submit(() -> compute());
f.get();                        // blocks until done

try { exec.invokeAll(tasks); }
finally {
    exec.shutdown();                        // stop accepting new tasks
    exec.awaitTermination(30, TimeUnit.SECONDS);
}`}</GuideCode>
        <GuideRules items={[
          'shutdown() does not block — pair it with awaitTermination or your code moves on while tasks are still running.',
          'volatile guarantees every thread sees the latest write; it does NOT make a read-modify-write like count++ atomic — that still needs synchronized or an Atomic type.',
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="Locks, Atomics & CompletableFuture" accent="green" glyph="🔒" span={2}>
        <GuideCode>{`lock.lock();
try { /* critical section */ } finally { lock.unlock(); }   // ALWAYS in finally

AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();               // atomic, lock-free
LongAdder adder = new LongAdder();       // less write-contention than AtomicLong

CompletableFuture.supplyAsync(this::fetchData)
    .thenApply(String::toUpperCase)      // sync map
    .thenCompose(this::fetchMore)        // async flatMap — chains another future
    .exceptionally(ex -> "fallback")
    .thenAccept(System.out::println);`}</GuideCode>
        <GuideRules items={[
          'ReentrantLock adds tryLock/timeouts/fairness over synchronized — but unlike synchronized, an exception does NOT auto-release it, so unlock() has to live in finally.',
          'thenApply where you needed thenCompose leaves you with a CompletableFuture<CompletableFuture<T>> — thenApply is the sync map, thenCompose is the async chain.',
          'join()/get() only belong inside a callback after allOf/anyOf completes — calling either earlier just blocks the calling thread.',
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="Concurrency — The Modern Shape" accent="amber" glyph="⚡" span={2}>
        <GuideCode>{`// Virtual threads (21+): cheap, for BLOCKING work
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    tasks.forEach(t -> ex.submit(t));
}   // close() waits for all

// Platform pool: for CPU-bound work, sized to cores
var pool = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());`}</GuideCode>
        <GuideRules items={[
          'Virtual threads help BLOCKING workloads. For CPU-bound work they do nothing — the cores are still the limit.',
          'A bounded pool blocked on I/O is a hard ceiling: fill every thread and the next request simply waits.',
          'Through Java 23, synchronized held across blocking I/O PINNED a virtual thread to its carrier; JEP 491 fixed that in Java 24, so "swap synchronized for ReentrantLock" is now stale advice on 24+ — but holding any lock across a slow call still serializes every caller, on any JDK.',
          'Prefer ConcurrentHashMap / AtomicInteger over synchronized blocks for simple shared state.',
          'Virtual threads are meant to be created and discarded per task, never pooled — wrapping them in a sized Executors.newFixedThreadPool reintroduces the exact queueing bottleneck they remove.',
          'StructuredTaskScope (fork siblings, cancel the group on first failure, deterministic close) is still preview through at least Java 26 — needs --enable-preview at compile and run time.',
        ]} />
      </GuidePanel>

      <GuidePanel n={19} title="Concurrency Pitfalls" accent="pink" glyph="💥" span={2}>
        <GuideCode>{`// DEADLOCK — inconsistent lock order. Fix: always acquire by a global order.
var first  = a.id() < b.id() ? a : b;
var second = a.id() < b.id() ? b : a;
synchronized (first) { synchronized (second) { transfer(a, b); } }

// RACE — check-then-act needs the WHOLE sequence under the lock, not just the write.
synchronized (this) { if (balance >= amount) balance -= amount; }

BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);
queue.put(task);        // producer — blocks if full
Task t = queue.take();  // consumer — blocks if empty`}</GuideCode>
        <GuideRules items={[
          'happens-before is a visibility guarantee, not a chronology — with no edge between two threads, the JIT and CPU may reorder and cache freely, and a reader can see a stale value forever even though the write already ran.',
          'Edges worth memorising: unlock(m) happens-before the next lock(m); a volatile write happens-before every later read of it; t.start() happens-before everything t does; everything t does happens-before t.join() returning.',
          'A latch (CountDownLatch) counts down once and stays down; reach for CyclicBarrier when the same rendezvous repeats.',
        ]} />
      </GuidePanel>

      <GuidePanel n={20} title="Test Doubles" accent="cyan" glyph="🎭">
        <GuideDefs
          items={[
            ['dummy', 'passed to satisfy a signature, never used'],
            ['stub', 'canned answers — when(x).thenReturn(y)'],
            ['spy', 'a REAL object that records — calls real methods!'],
            ['mock', 'preprogrammed + verified'],
            ['fake', 'a working lightweight impl — MOCKITO HAS NONE'],
          ]}
        />
        <GuideRules items={[
          'A 30-line in-memory fake often beats stubbing the same repository in forty test classes.',
        ]} />
      </GuidePanel>

      <GuidePanel n={21} title="Mockito" accent="red" glyph="🧪" span={2}>
        <GuideCode>{`@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock EmailClient email;
    @Spy  AuditLog audit = new AuditLog();
    @InjectMocks OrderService svc;

    @Test void t() {
        when(email.send(anyString())).thenReturn(true);
        doReturn(5).when(spyObj).realMethod();   // SPIES: doReturn, not when
        svc.place(order);
        verify(email).send("a@b.c");
        verify(email, never()).send("x");
    }
}`}</GuideCode>
        <GuideRules items={[
          'Matchers are all-or-nothing: one matcher means every argument must be one. Use eq() for the literals.',
          'A matcher failure leaves the thread-local stack dirty, so the NEXT test class fails pointing into the first. "Passes alone, fails in the suite" = look here.',
          'when(spy.get()) actually RUNS get() first. doReturn(v).when(spy).get() does not.',
          'Strict stubs: an unused stub fails the test AFTER the body, from MockitoExtension.afterEach.',
          'mockito-inline is obsolete — the inline mock-maker has been default since Mockito 5.',
          'Spring Boot: @MockBean → @MockitoBean (deprecated 3.4, removed in Boot 4).',
        ]} />
      </GuidePanel>

      <GuidePanel n={22} title="JVM & Memory" accent="blue" glyph="⚙️">
        <GuideDefs
          items={[
            ['Heap', 'objects — sized with -Xmx / -Xms'],
            ['Metaspace', 'class metadata — native memory, not heap'],
            ['Stack', 'frames and locals, per thread'],
            ['G1', 'the default collector; ZGC for low pause'],
          ]}
        />
        <GuideRules items={[
          'A memory leak in Java is an unintended REFERENCE — usually a static collection that only grows.',
          'In a container, set -XX:MaxRAMPercentage rather than a fixed -Xmx.',
        ]} />
      </GuidePanel>

      <GuidePanel n={23} title="Versions & Build" accent="purple" glyph="🏗️">
        <GuideTable
          head={['Release', 'Brought']}
          rows={[
            ['8', 'lambdas, streams, Optional'],
            ['11 LTS', 'var, HttpClient'],
            ['17 LTS', 'records, sealed, switch expressions'],
            ['21 LTS', 'virtual threads, pattern matching for switch'],
            ['25 LTS', 'current LTS line'],
          ]}
        />
        <GuideCode>{`mvn dependency:tree -Dincludes=group:artifact
./gradlew dependencyInsight --dependency x --configuration runtimeClasspath`}</GuideCode>
        <GuideRules items={[
          'Gradle: api leaks a dependency to consumers, implementation does not. Prefer implementation.',
          'Java 25 relaxed the launcher protocol: any non-private void main (static or instance, with or without String[]) compiles and runs via java File.java; keep public static void main(String[] args) in real code, since that is what every IDE and reviewer expects.',
        ]} />
      </GuidePanel>

      <GuidePanel n={24} title="Modern JDK Gotcha" accent="green" glyph="⚠️">
        <GuideRules items={[
          'On recent JDKs Mockito prints a self-attach warning plus JVM agent warnings on every run.',
          'Fix: maven-dependency-plugin (goal: properties) + surefire argLine -javaagent:${org.mockito:mockito-core:jar}',
          'Unrelated to your test code — it is the inline mock-maker attaching itself.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
