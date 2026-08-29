import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function JavaCheatsheet() {
  return (
    <GuideLayout
      title="JAVA"
      kicker="FIELD GUIDE"
      glyph="☕"
      tagline="Modern Java — collections, streams, concurrency, and the traps that survive code review."
      meta={['Java 17 / 21 / 25 LTS', '15 panels']}
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
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Collections — Pick One" accent="green" glyph="📚" span={2}>
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
        <GuideRules items={[
          'List.of / Map.of return IMMUTABLE collections — add() throws UnsupportedOperationException.',
          'Arrays.asList is fixed-size and writes through to the array.',
          'Removing from a list while iterating throws ConcurrentModificationException — use Iterator.remove or removeIf.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Streams" accent="cyan" glyph="🌊">
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
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Optional" accent="amber" glyph="❓">
        <GuideCode>{`opt.map(User::name).orElse("anon");
opt.orElseGet(() -> expensive());   // lazy — prefer for costly defaults
opt.orElseThrow(() -> new NotFound());
opt.ifPresentOrElse(this::use, this::miss);`}</GuideCode>
        <GuideRules items={[
          'A RETURN type. Never a field, never a parameter, never in a DTO — it is not Serializable.',
          'opt.get() without isPresent is the anti-pattern Optional exists to remove.',
          'Never return null from a method declared Optional.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Records, Sealed, Pattern Matching" accent="purple" glyph="🧩">
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
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Exceptions" accent="red" glyph="🚨">
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
        <GuideRules items={[
          'Never swallow: catch (Exception e) {} destroys the evidence.',
          'A return inside finally discards a pending exception. Never do it.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Generics & Erasure" accent="blue" glyph="🔣">
        <GuideCode>{`// PECS — Producer Extends, Consumer Super
void copy(List<? extends T> src, List<? super T> dst)

List<String> l = new ArrayList<>();
l.getClass() == new ArrayList<Integer>().getClass();  // true — erased`}</GuideCode>
        <GuideRules items={[
          'Generics are erased at runtime: no new T[], no instanceof List<String>.',
          'That erasure is what broke Mockito and serialization libraries on the Java 8 → 9 jump.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Concurrency — The Modern Shape" accent="pink" glyph="🧵" span={2}>
        <GuideCode>{`// Virtual threads (21+): cheap, for BLOCKING work
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    tasks.forEach(t -> ex.submit(t));
}   // close() waits for all

// Platform pool: for CPU-bound work, sized to cores
var pool = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());`}</GuideCode>
        <GuideRules items={[
          'Virtual threads help BLOCKING workloads. For CPU-bound work they do nothing — the cores are still the limit.',
          'A bounded pool blocked on I/O is a hard ceiling: fill every thread and the next request simply waits.',
          'synchronized can PIN a virtual thread to its carrier — prefer ReentrantLock in hot paths.',
          'Prefer ConcurrentHashMap / AtomicInteger over synchronized blocks for simple shared state.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Test Doubles" accent="green" glyph="🎭">
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

      <GuidePanel n={10} title="Mockito" accent="amber" glyph="🧪" span={2}>
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

      <GuidePanel n={11} title="Files & I/O" accent="cyan" glyph="📁">
        <GuideCode>{`Path p = Path.of("data", "in.txt");
String s   = Files.readString(p);
List<String> ls = Files.readAllLines(p);
try (var lines = Files.lines(p)) { ... }   // STREAM: must be closed

var client = HttpClient.newHttpClient();
client.send(req, BodyHandlers.ofString());`}</GuideCode>
        <GuideRules items={[
          'Files.lines returns a stream holding an OS handle — always in try-with-resources.',
          'Java serialization is a deserialization-gadget risk. Prefer JSON.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Dates & Money" accent="purple" glyph="📅">
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

      <GuidePanel n={13} title="JVM & Memory" accent="red" glyph="⚙️">
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

      <GuidePanel n={14} title="Versions & Build" accent="blue" glyph="🏗️">
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
        <GuideRules items={['Gradle: api leaks a dependency to consumers, implementation does not. Prefer implementation.']} />
      </GuidePanel>

      <GuidePanel n={15} title="Modern JDK Gotcha" accent="amber" glyph="⚠️">
        <GuideRules items={[
          'On recent JDKs Mockito prints a self-attach warning plus JVM agent warnings on every run.',
          'Fix: maven-dependency-plugin (goal: properties) + surefire argLine -javaagent:${org.mockito:mockito-core:jar}',
          'Unrelated to your test code — it is the inline mock-maker attaching itself.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
