import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Streams() {
  return (
    <LessonLayout
      title="Streams & Lambdas Ref"
      sectionId="java-cheatsheet"
      lessonIndex={2}
      prev={{ path: '/java-cheatsheet/collections', label: 'Collections Cheat Sheet' }}
      next={{ path: '/java-cheatsheet/concurrency', label: 'Concurrency Quick Ref' }}
    >
      {/* ───── LAMBDA SYNTAX ───── */}
      <h2>Lambda Syntax Variations</h2>
      <CodeBlock language="java" title="All the ways to write a lambda">{
`// Full form
(String a, String b) -> { return a.compareTo(b); }

// Inferred types
(a, b) -> { return a.compareTo(b); }

// Single expression — no braces, implicit return
(a, b) -> a.compareTo(b)

// Single parameter — no parens needed
x -> x * 2

// No parameters
() -> System.out.println("hello")

// Multi-statement body — braces + explicit return
(x, y) -> {
    int sum = x + y;
    return sum * 2;
}

// Common functional interfaces
Runnable         r = () -> doWork();
Supplier<T>      s = () -> new Widget();
Consumer<T>      c = item -> process(item);
Function<T,R>    f = x -> x.toString();
Predicate<T>     p = x -> x > 0;
BiFunction<T,U,R> bf = (a, b) -> a + b;
UnaryOperator<T> uo = x -> x.toUpperCase();
BinaryOperator<T> bo = (a, b) -> a + b;`
      }</CodeBlock>

      {/* ───── METHOD REFERENCES ───── */}
      <h2>Method References (4 Types)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Syntax</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Lambda Equivalent</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Static method', 'Integer::parseInt', 's -> Integer.parseInt(s)'],
            ['Instance method (bound)', 'str::toUpperCase', '() -> str.toUpperCase()'],
            ['Instance method (unbound)', 'String::toUpperCase', 's -> s.toUpperCase()'],
            ['Constructor', 'ArrayList::new', '() -> new ArrayList<>()'],
          ].map(([type, syntax, lambda]) => (
            <tr key={type} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px' }}>{type}</td>
              <td style={{ padding: '6px', fontFamily: 'monospace', color: '#5b9cf6' }}>{syntax}</td>
              <td style={{ padding: '6px', fontFamily: 'monospace' }}>{lambda}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ───── STREAM PIPELINE ───── */}
      <h2>Stream Pipeline</h2>
      <FlowChart
        title="Source → Intermediate → Terminal"
        chart={"graph LR\n  Source[\"Source\\n.stream()\\n.of()\\n.generate()\"]-->Intermediate[\"Intermediate\\nfilter/map/flatMap\\nsorted/distinct\\npeek/limit/skip\"]\n  Intermediate-->Terminal[\"Terminal\\nforEach/collect\\nreduce/count\\nmin/max/findFirst\\nanyMatch/allMatch\"]"}
      />

      <InfoBox variant="warning" title="Streams are single-use">
        A stream cannot be reused after a terminal operation. Calling a terminal op on an
        already-consumed stream throws <code>IllegalStateException</code>.
      </InfoBox>

      {/* ───── CREATION ───── */}
      <h2>Stream Creation</h2>
      <CodeBlock language="java" title="Ways to get a Stream">{
`// From collection
list.stream()
set.stream()

// From values
Stream.of("a", "b", "c")
Stream.empty()

// From array
Arrays.stream(arr)
Arrays.stream(arr, 0, 3)     // sub-array

// Infinite streams
Stream.generate(Math::random)        // Supplier
Stream.iterate(0, n -> n + 2)        // 0, 2, 4, 6, ...
Stream.iterate(0, n -> n < 100, n -> n + 2)  // bounded (Java 9)

// Primitive streams
IntStream.range(0, 10)               // 0..9
IntStream.rangeClosed(1, 10)          // 1..10
IntStream.of(1, 2, 3)
"hello".chars()                      // IntStream of char values

// From other sources
Files.lines(Path.of("data.txt"))     // Stream<String>
Pattern.compile(",").splitAsStream(str)
new Random().ints(10, 0, 100)        // 10 random ints [0,100)`
      }</CodeBlock>

      {/* ───── INTERMEDIATE OPS ───── */}
      <h2>Intermediate Operations (lazy)</h2>
      <CodeBlock language="java" title="Transform the pipeline">{
`stream
  .filter(x -> x > 0)                 // keep matching elements
  .map(x -> x * 2)                    // transform each element
  .flatMap(list -> list.stream())      // flatten nested streams
  .distinct()                          // remove duplicates (by equals)
  .sorted()                            // natural order
  .sorted(Comparator.reverseOrder())   // custom order
  .peek(System.out::println)           // debug side-effect (don't mutate!)
  .limit(10)                           // take first N
  .skip(5)                             // skip first N
  .takeWhile(x -> x < 100)            // stop when predicate fails (Java 9)
  .dropWhile(x -> x < 10)             // skip until predicate fails (Java 9)

// mapToXxx — convert to primitive stream
stream.mapToInt(String::length)        // IntStream
stream.mapToDouble(x -> x.getPrice())  // DoubleStream`
      }</CodeBlock>

      {/* ───── TERMINAL OPS ───── */}
      <h2>Terminal Operations</h2>
      <CodeBlock language="java" title="Trigger pipeline execution">{
`// Iteration
stream.forEach(System.out::println);
stream.forEachOrdered(System.out::println); // respects encounter order

// Aggregation
stream.count()                         // long
stream.min(Comparator.naturalOrder())  // Optional<T>
stream.max(Comparator.naturalOrder())  // Optional<T>

// Reduction
stream.reduce(0, Integer::sum)         // with identity
stream.reduce(Integer::sum)            // Optional<T>

// Searching
stream.findFirst()                     // Optional<T>
stream.findAny()                       // Optional<T> (non-deterministic in parallel)

// Matching
stream.anyMatch(x -> x > 0)           // true if any match
stream.allMatch(x -> x > 0)           // true if all match
stream.noneMatch(x -> x < 0)          // true if none match

// Collection
stream.toList()                        // Java 16+ (unmodifiable)
stream.toArray()                       // Object[]
stream.toArray(String[]::new)          // String[]

// IntStream / DoubleStream extras
intStream.sum()
intStream.average()                    // OptionalDouble
intStream.summaryStatistics()          // count, sum, min, avg, max`
      }</CodeBlock>

      {/* ───── COLLECTORS ───── */}
      <h2>Collectors Cheat Sheet</h2>
      <CodeBlock language="java" title="import static java.util.stream.Collectors.*">{
`// Basic collection
.collect(toList())                     // ArrayList (mutable)
.collect(toUnmodifiableList())         // unmodifiable List
.collect(toSet())                      // HashSet
.collect(toUnmodifiableSet())

// To Map
.collect(toMap(
    Item::getId,                       // key mapper
    Item::getName                      // value mapper
))
.collect(toMap(
    Item::getId, Item::getName,
    (v1, v2) -> v1                     // merge function for dupes
))

// Grouping
.collect(groupingBy(Item::getCategory))             // Map<Cat, List<Item>>
.collect(groupingBy(Item::getCategory, counting())) // Map<Cat, Long>
.collect(groupingBy(
    Item::getCategory,
    summingDouble(Item::getPrice)                    // Map<Cat, Double>
))

// Partitioning (boolean split)
.collect(partitioningBy(x -> x > 0))  // Map<Boolean, List<T>>

// Joining strings
.collect(joining())                    // concatenate
.collect(joining(", "))                // with delimiter
.collect(joining(", ", "[", "]"))      // prefix + suffix

// Statistics
.collect(summarizingInt(Item::getQty)) // IntSummaryStatistics

// Downstream collectors
.collect(groupingBy(
    Item::getCategory,
    mapping(Item::getName, toList())   // transform before collecting
))`
      }</CodeBlock>

      {/* ───── OPTIONAL ───── */}
      <h2>Optional API</h2>
      <CodeBlock language="java" title="Avoid NullPointerException">{
`// Creation
Optional<String> opt = Optional.of("hello");         // non-null
Optional<String> maybe = Optional.ofNullable(val);   // nullable
Optional<String> empty = Optional.empty();

// Query
opt.isPresent()            // true/false
opt.isEmpty()              // Java 11+

// Extract
opt.get()                  // throws if empty — avoid!
opt.orElse("default")      // fallback value
opt.orElseGet(() -> calc()) // lazy fallback
opt.orElseThrow()          // throws NoSuchElementException
opt.orElseThrow(() -> new CustomException("msg"))

// Transform (chainable)
opt.map(String::toUpperCase)          // Optional<String>
opt.flatMap(this::findById)           // avoids Optional<Optional<T>>
opt.filter(s -> s.length() > 3)       // empty if predicate fails

// Conditional
opt.ifPresent(System.out::println);
opt.ifPresentOrElse(                   // Java 9
    System.out::println,
    () -> System.out.println("empty")
);

// Stream interop (Java 9)
opt.stream()               // Stream of 0 or 1 elements
opt.or(() -> Optional.of("fallback"))  // chain Optionals`
      }</CodeBlock>

      <InfoBox variant="danger" title="Optional Anti-patterns">
        Never use <code>Optional</code> as a field type, method parameter, or in collections.
        It&apos;s designed for return types only. Don&apos;t call <code>.get()</code> without
        checking <code>.isPresent()</code> — use <code>orElse</code> / <code>orElseThrow</code> instead.
      </InfoBox>

      {/* ───── PARALLEL STREAMS ───── */}
      <h2>Parallel Streams</h2>
      <CodeBlock language="java" title="When to go parallel">{
`// Convert to parallel
list.parallelStream()
stream.parallel()

// Check
stream.isParallel()

// Convert back
stream.sequential()

// Force ordered processing in parallel
parallelStream.forEachOrdered(System.out::println);`
      }</CodeBlock>

      <InfoBox variant="warning" title="Parallel Stream Cautions">
        Use parallel only when: (1) large dataset (&gt;10K elements), (2) stateless operations,
        (3) CPU-bound (not I/O), (4) no shared mutable state. Uses ForkJoinPool.commonPool() —
        can starve other parallel work.
      </InfoBox>

      {/* ───── COMMON PATTERNS ───── */}
      <h2>Common Stream Patterns</h2>
      <CodeBlock language="java" title="Recipes">{
`// Frequency map
Map<String, Long> freq = words.stream()
    .collect(groupingBy(Function.identity(), counting()));

// Flatten nested lists
List<String> flat = listOfLists.stream()
    .flatMap(Collection::stream)
    .toList();

// Find max by property
Optional<Employee> richest = employees.stream()
    .max(Comparator.comparingDouble(Employee::getSalary));

// String from stream
String csv = items.stream()
    .map(Item::getName)
    .collect(joining(", "));

// Index-based mapping (when you need the index)
IntStream.range(0, list.size())
    .mapToObj(i -> i + ": " + list.get(i))
    .toList();

// Distinct by property (no built-in, use workaround)
items.stream()
    .collect(toMap(Item::getId, Function.identity(), (a, b) -> a))
    .values();`
      }</CodeBlock>

      {/* ───── CHALLENGES ───── */}
      <InteractiveChallenge
        question={"Which operation is a terminal operation?"}
        options={["filter()", "map()", "sorted()", "collect()"]}
        correctIndex={3}
        explanation={"collect() triggers pipeline execution and produces a result. filter(), map(), and sorted() are all intermediate operations — they are lazy and do nothing until a terminal operation is called."}
        language="java"
      />

      <InteractiveChallenge
        question={"What does Stream.of(1,2,3).reduce(10, Integer::sum) return?"}
        options={["6", "16", "10", "Optional[16]"]}
        correctIndex={1}
        explanation={"reduce with an identity value returns T (not Optional). The identity 10 is the starting accumulator, so it computes 10+1+2+3 = 16."}
        language="java"
      />
    </LessonLayout>
  );
}

export default function StreamsPage() {
  return <Streams />;
}
