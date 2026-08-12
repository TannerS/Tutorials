import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Streams() {
  return (
    <LessonLayout
      title="Streams & Lambdas"
      sectionId="java"
      lessonIndex={6}
      prev={{ path: '/java/exceptions', label: 'Exception Handling' }}
      next={{ path: '/java/concurrency', label: 'Concurrency & Threads' }}
    >
      <h2>Lambda Expressions</h2>
      <p>
        Introduced in Java 8, lambda expressions allow you to write concise, anonymous functions.
        They enable a more functional style of programming in Java, reducing boilerplate code
        dramatically — especially when working with collections and the Stream API.
      </p>
      <p>
        A lambda expression has the form: <code>(parameters) -&gt; expression</code> or{' '}
        <code>(parameters) -&gt; {'{ statements }'}</code>.
      </p>

      <CodeBlock language="java" title="LambdaBasics.java">
{`import java.util.Arrays;
import java.util.List;
import java.util.Comparator;
import java.util.function.Predicate;

public class LambdaBasics {
    public static void main(String[] args) {
        // Before lambdas: anonymous inner class
        Comparator<String> oldWay = new Comparator<String>() {
            @Override
            public int compare(String a, String b) {
                return a.length() - b.length();
            }
        };

        // With lambda: same behavior, much shorter
        Comparator<String> newWay = (a, b) -> a.length() - b.length();

        List<String> names = Arrays.asList("Charlie", "Alice", "Bob", "Dave");
        names.sort(newWay);
        System.out.println("Sorted by length: " + names);

        // Lambda with method reference (even shorter)
        names.sort(Comparator.naturalOrder());
        System.out.println("Alphabetical: " + names);

        // Lambda in forEach
        names.forEach(name -> System.out.println("Hello, " + name));

        // Method reference (shorthand for lambda)
        names.forEach(System.out::println);

        // Storing lambdas in functional interface variables
        Predicate<String> isLong = s -> s.length() > 4;
        System.out.println("Is 'Alice' long? " + isLong.test("Alice")); // true
        System.out.println("Is 'Bob' long? " + isLong.test("Bob"));     // false
    }
}`}
      </CodeBlock>

      <h2>Functional Interfaces</h2>
      <p>
        A functional interface is an interface with exactly one abstract method. Lambda
        expressions are implementations of functional interfaces. Java provides many built-in
        functional interfaces in the <code>java.util.function</code> package.
      </p>

      <CodeBlock language="java" title="FunctionalInterfaces.java">
{`import java.util.function.*;
import java.util.List;

public class FunctionalInterfaces {
    public static void main(String[] args) {
        // Predicate<T>: takes T, returns boolean
        Predicate<Integer> isEven = n -> n % 2 == 0;
        System.out.println("4 is even: " + isEven.test(4));

        // Function<T, R>: takes T, returns R
        Function<String, Integer> length = String::length;
        System.out.println("Length of 'Java': " + length.apply("Java"));

        // Consumer<T>: takes T, returns nothing
        Consumer<String> printer = s -> System.out.println(">> " + s);
        printer.accept("Hello from Consumer");

        // Supplier<T>: takes nothing, returns T
        Supplier<Double> randomValue = Math::random;
        System.out.println("Random: " + randomValue.get());

        // UnaryOperator<T>: takes T, returns T (special case of Function)
        UnaryOperator<String> toUpper = String::toUpperCase;
        System.out.println(toUpper.apply("hello")); // HELLO

        // BinaryOperator<T>: takes (T, T), returns T
        BinaryOperator<Integer> add = Integer::sum;
        System.out.println("3 + 5 = " + add.apply(3, 5));

        // Composing functions
        Function<Integer, Integer> doubleIt = n -> n * 2;
        Function<Integer, Integer> addTen = n -> n + 10;

        Function<Integer, Integer> doubleThenAdd = doubleIt.andThen(addTen);
        System.out.println("doubleThenAdd(5): " + doubleThenAdd.apply(5)); // 20

        Function<Integer, Integer> addThenDouble = doubleIt.compose(addTen);
        System.out.println("addThenDouble(5): " + addThenDouble.apply(5)); // 30
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="@FunctionalInterface Annotation">
        <p>
          The <code>@FunctionalInterface</code> annotation is optional but recommended when
          creating your own functional interfaces. It tells the compiler to enforce that the
          interface has exactly one abstract method. If someone accidentally adds a second
          abstract method, the compiler produces an error.
        </p>
      </InfoBox>

      <h2>The Stream API</h2>
      <p>
        The Stream API provides a declarative way to process sequences of elements. Instead of
        writing loops with mutable state, you describe <em>what</em> you want using a pipeline
        of operations.
      </p>

      <FlowChart
        title="Stream Pipeline"
        chart={"graph LR\nA[Data Source] --> B[stream]\nB --> C[filter]\nC --> D[map]\nD --> E[sorted]\nE --> F[collect]\nF --> G[Result]"}
      />

      <CodeBlock language="java" title="StreamBasics.java">
{`import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class StreamBasics {
    public static void main(String[] args) {
        List<String> names = Arrays.asList(
            "Alice", "Bob", "Charlie", "Dave", "Eve", "Frank"
        );

        // Filter: keep only names longer than 3 characters
        List<String> longNames = names.stream()
            .filter(name -> name.length() > 3)
            .collect(Collectors.toList());
        System.out.println("Long names: " + longNames);

        // Map: transform each element
        List<String> upperNames = names.stream()
            .map(String::toUpperCase)
            .collect(Collectors.toList());
        System.out.println("Uppercase: " + upperNames);

        // Chain multiple operations
        List<String> result = names.stream()
            .filter(name -> name.length() > 3)     // keep long names
            .map(String::toUpperCase)                // convert to uppercase
            .sorted()                                // sort alphabetically
            .collect(Collectors.toList());
        System.out.println("Filtered + mapped + sorted: " + result);

        // Count
        long count = names.stream()
            .filter(name -> name.startsWith("A") || name.startsWith("E"))
            .count();
        System.out.println("Names starting with A or E: " + count);

        // Find first match
        names.stream()
            .filter(name -> name.length() == 3)
            .findFirst()
            .ifPresent(name -> System.out.println("First 3-letter name: " + name));
    }
}`}
      </CodeBlock>

      <h2>Laziness and Short-Circuiting</h2>
      <p>
        A stream pipeline is built from <strong>intermediate</strong> operations (which return
        another stream and do nothing on their own) and exactly one{' '}
        <strong>terminal</strong> operation (which triggers the work). Nothing runs until the
        terminal operation is called, and elements flow through the whole pipeline one at a time
        rather than stage by stage. This is why <code>filter().map().findFirst()</code> over a
        million-element list can touch only a handful of elements.
      </p>

      <CodeBlock language="java" title="Laziness.java">
{`// Nothing prints. No terminal operation, so nothing runs at all.
Stream<String> lazy = names.stream()
    .filter(n -> { System.out.println("filter " + n); return n.length() > 3; })
    .map(n -> { System.out.println("map " + n); return n.toUpperCase(); });

// Add a terminal operation and the pipeline executes — element by element.
lazy.findFirst();
// Output:
//   filter Alice
//   map Alice          <- "Alice" passes filter, is mapped, findFirst is satisfied
// "Bob", "Charlie", ... are never examined at all.

// Short-circuiting terminal operations stop early:
boolean any   = numbers.stream().anyMatch(n -> n > 100);   // stops at first match
boolean all   = numbers.stream().allMatch(n -> n > 0);     // stops at first failure
boolean none  = numbers.stream().noneMatch(String::isBlank);
Optional<Integer> first = numbers.stream().filter(n -> n > 5).findFirst();

// Short-circuiting INTERMEDIATE operations bound the work:
List<Integer> page = numbers.stream().skip(20).limit(10).toList();`}
      </CodeBlock>

      <InfoBox variant="warning" title="A stream can only be consumed once">
        <p>
          Calling a second terminal operation on the same stream throws{' '}
          <code>IllegalStateException: stream has already been operated upon or closed</code>. A
          stream is a pipeline over a source, not a collection — if you need to traverse twice,
          keep the source collection and call <code>.stream()</code> again. This is also why{' '}
          <code>peek()</code> is a debugging tool, not a general-purpose &quot;do something to
          each element&quot; operation: it is intermediate, so it may not run at all if the
          pipeline short-circuits, and the JDK is explicitly allowed to elide it.
        </p>
      </InfoBox>

      <h2>flatMap — Flattening Nested Structures</h2>
      <p>
        <code>map</code> converts each element into exactly one output element.{' '}
        <code>flatMap</code> converts each element into a <em>stream</em> of output elements and
        splices them all into one flat stream. Whenever you find yourself with a{' '}
        <code>Stream&lt;List&lt;T&gt;&gt;</code> or nested loops, <code>flatMap</code> is the
        operation you want.
      </p>

      <CodeBlock language="java" title="FlatMap.java">
{`record LineItem(String sku, int quantity) {}
record Order(String id, List<LineItem> items) {}

List<Order> orders = loadOrders();

// map gives you a Stream<List<LineItem>> — still nested, rarely what you want.
Stream<List<LineItem>> nested = orders.stream().map(Order::items);

// flatMap splices the inner streams into one flat Stream<LineItem>.
List<LineItem> allItems = orders.stream()
    .flatMap(order -> order.items().stream())
    .toList();

// Now aggregation across ALL orders is a one-liner.
int totalUnits = orders.stream()
    .flatMap(order -> order.items().stream())
    .mapToInt(LineItem::quantity)
    .sum();

// Splitting text into words — the classic case.
List<String> words = lines.stream()
    .flatMap(line -> Arrays.stream(line.split("\\\\s+")))
    .filter(w -> !w.isBlank())
    .toList();

// Dropping empties from a Stream<Optional<T>> (Java 9+).
List<Customer> found = ids.stream()
    .map(repository::findById)      // Stream<Optional<Customer>>
    .flatMap(Optional::stream)      // Stream<Customer>, empties dropped
    .toList();

// Cartesian product — flatMap replaces the nested for loop.
List<String> pairs = suits.stream()
    .flatMap(suit -> ranks.stream().map(rank -> rank + " of " + suit))
    .toList();`}
      </CodeBlock>

      <h2>Reduce and Collect</h2>

      <CodeBlock language="java" title="ReduceAndCollect.java">
{`import java.util.*;
import java.util.stream.*;

public class ReduceAndCollect {
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // reduce: combine all elements into a single value
        int sum = numbers.stream()
            .reduce(0, Integer::sum);
        System.out.println("Sum: " + sum); // 55

        Optional<Integer> max = numbers.stream()
            .reduce(Integer::max);
        max.ifPresent(m -> System.out.println("Max: " + m)); // 10

        // Collecting to different data structures
        Set<Integer> evenSet = numbers.stream()
            .filter(n -> n % 2 == 0)
            .collect(Collectors.toSet());
        System.out.println("Even numbers set: " + evenSet);

        String joined = numbers.stream()
            .map(String::valueOf)
            .collect(Collectors.joining(", ", "[", "]"));
        System.out.println("Joined: " + joined); // [1, 2, 3, ..., 10]

        // Grouping
        List<String> words = List.of("hello", "world", "hi", "hey", "wow", "java");
        Map<Character, List<String>> grouped = words.stream()
            .collect(Collectors.groupingBy(w -> w.charAt(0)));
        System.out.println("Grouped by first letter: " + grouped);

        // Partitioning
        Map<Boolean, List<Integer>> partitioned = numbers.stream()
            .collect(Collectors.partitioningBy(n -> n > 5));
        System.out.println("Greater than 5: " + partitioned.get(true));
        System.out.println("Not greater than 5: " + partitioned.get(false));

        // Statistics
        IntSummaryStatistics stats = numbers.stream()
            .mapToInt(Integer::intValue)
            .summaryStatistics();
        System.out.println("Count: " + stats.getCount());
        System.out.println("Sum: " + stats.getSum());
        System.out.println("Average: " + stats.getAverage());
        System.out.println("Min: " + stats.getMin());
        System.out.println("Max: " + stats.getMax());
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer .toList() over .collect(Collectors.toList())">
        <p>
          Since Java 16, <code>stream.toList()</code> is the shortest way to finish a pipeline.
          There is one behavioural difference worth knowing:{' '}
          <code>toList()</code> returns an <strong>unmodifiable</strong> list (and permits nulls),
          while <code>Collectors.toList()</code> makes no guarantee about mutability — in practice
          it hands you an <code>ArrayList</code>. If you need a list you will mutate afterwards,
          ask for it explicitly with <code>Collectors.toCollection(ArrayList::new)</code> rather
          than relying on the unspecified behaviour.
        </p>
      </InfoBox>

      <h2>The Collector Toolkit</h2>
      <p>
        <code>groupingBy</code> and <code>partitioningBy</code> both accept a second{' '}
        <em>downstream</em> collector that decides what to do with each group, instead of
        defaulting to &quot;collect into a list&quot;. Composing collectors this way replaces most
        of the manual map-building code you would otherwise write.
      </p>

      <CodeBlock language="java" title="Collectors.java">
{`record Employee(String name, String department, String city, double salary) {}

List<Employee> staff = loadStaff();

// toMap — key mapper, value mapper. Throws on duplicate keys!
Map<String, Double> salaryByName = staff.stream()
    .collect(Collectors.toMap(Employee::name, Employee::salary));

// toMap with a merge function — required whenever keys can collide.
Map<String, Double> totalByDept = staff.stream()
    .collect(Collectors.toMap(Employee::department, Employee::salary, Double::sum));

// groupingBy with a DOWNSTREAM collector: count per group.
Map<String, Long> headcount = staff.stream()
    .collect(Collectors.groupingBy(Employee::department, Collectors.counting()));

// Sum / average per group.
Map<String, Double> payroll = staff.stream()
    .collect(Collectors.groupingBy(Employee::department,
             Collectors.summingDouble(Employee::salary)));

// mapping — transform elements before they land in the group.
Map<String, List<String>> namesByDept = staff.stream()
    .collect(Collectors.groupingBy(Employee::department,
             Collectors.mapping(Employee::name, Collectors.toList())));

// Multi-level grouping — the downstream collector is another groupingBy.
Map<String, Map<String, List<Employee>>> byDeptThenCity = staff.stream()
    .collect(Collectors.groupingBy(Employee::department,
             Collectors.groupingBy(Employee::city)));

// Pick the top earner per department. maxBy returns Optional, so the value
// type is Optional<Employee>; collectingAndThen unwraps it.
Map<String, Employee> topEarner = staff.stream()
    .collect(Collectors.groupingBy(Employee::department,
             Collectors.collectingAndThen(
                 Collectors.maxBy(Comparator.comparingDouble(Employee::salary)),
                 Optional::orElseThrow)));

// Preserve group order with a TreeMap (groupingBy uses HashMap by default).
Map<String, List<Employee>> ordered = staff.stream()
    .collect(Collectors.groupingBy(Employee::department, TreeMap::new,
             Collectors.toList()));

// teeing (Java 12+) — run TWO collectors over one pass and merge the results.
record PayrollSummary(double total, long count) {}
PayrollSummary summary = staff.stream()
    .collect(Collectors.teeing(
        Collectors.summingDouble(Employee::salary),
        Collectors.counting(),
        PayrollSummary::new));`}
      </CodeBlock>

      <InfoBox variant="danger" title="Collectors.toMap throws on duplicate keys">
        <p>
          The two-argument <code>Collectors.toMap</code> throws{' '}
          <code>IllegalStateException: Duplicate key</code> the moment two elements produce the
          same key — a failure that typically shows up in production rather than in tests, because
          test fixtures rarely contain collisions. Unless the key is a proven unique identifier,
          always supply the third merge-function argument. A second trap: the value mapper must
          not return <code>null</code>, or <code>toMap</code> throws{' '}
          <code>NullPointerException</code> even though <code>HashMap</code> itself allows null
          values.
        </p>
      </InfoBox>

      <h2>Gatherers — Custom Intermediate Operations (Java 24)</h2>
      <p>
        For a decade the Stream API had an asymmetry: <code>Collector</code> let you write your
        own <em>terminal</em> operation, but there was no way to write your own{' '}
        <em>intermediate</em> one. If you wanted a sliding window, a running total, or
        &ldquo;take elements until the sum exceeds N,&rdquo; you dropped out of the stream and
        wrote a loop. <code>Gatherer</code> (JEP 485, preview in 22&ndash;23,{' '}
        <strong>final in Java 24</strong>) closes that gap: <code>gather()</code> is to
        intermediate operations what <code>collect()</code> is to terminal ones.
      </p>

      <CodeBlock language="java" title="The five built-in gatherers">
{`import java.util.stream.Gatherers;

// windowFixed — batch into non-overlapping chunks of N.
// The classic use: chunk records for a batched DB write or API call.
List<List<Order>> batches = orders.stream()
    .gather(Gatherers.windowFixed(500))
    .toList();

// windowSliding — overlapping windows of N. Moving averages, trend detection.
List<Double> movingAvg = prices.stream()
    .gather(Gatherers.windowSliding(7))
    .map(w -> w.stream().mapToDouble(Double::doubleValue).average().orElse(0))
    .toList();

// fold — a running reduction to a single value (terminal-like, but lazy).
Optional<String> joined = Stream.of("a", "b", "c")
    .gather(Gatherers.fold(() -> "", (acc, s) -> acc + s))
    .findFirst();                                  // "abc"

// scan — like fold, but EMITS each intermediate result.
List<Integer> runningTotal = Stream.of(1, 2, 3, 4)
    .gather(Gatherers.scan(() -> 0, Integer::sum))
    .toList();                                     // [1, 3, 6, 10]

// mapConcurrent — run N mappings in parallel on virtual threads,
// preserving encounter order. Ideal for fan-out I/O.
List<ProductDto> products = ids.stream()
    .gather(Gatherers.mapConcurrent(10, id -> catalogClient.fetch(id)))
    .toList();`}
      </CodeBlock>

      <InfoBox variant="tip" title="mapConcurrent is the one you'll reach for at work">
        <p>
          Fanning out 200 HTTP calls with bounded concurrency used to mean an{' '}
          <code>ExecutorService</code>, a list of <code>Future</code>s, and manual result
          ordering. <code>Gatherers.mapConcurrent(10, fn)</code> does it in one line: it runs at
          most 10 tasks at a time on <em>virtual threads</em>, preserves encounter order, and
          propagates the first exception while cancelling the rest. Note it is a{' '}
          <strong>sequential</strong> stream operation — the concurrency comes from the gatherer,
          not from <code>parallel()</code>, so you keep deterministic ordering.
        </p>
      </InfoBox>

      <p>
        Writing your own is worth seeing once, because it explains the shape. A gatherer is an
        initializer (optional state), an integrator (called per element, returns{' '}
        <code>false</code> to short-circuit), and an optional finisher:
      </p>

      <CodeBlock language="java" title="A custom gatherer: distinctBy(keyExtractor)">
{`// Stream has distinct() (uses equals) but no distinctBy(). Now you can add it.
static <T, K> Gatherer<T, ?, T> distinctBy(Function<? super T, ? extends K> key) {
    return Gatherer.ofSequential(
        HashSet::new,                              // initializer: the state
        (seen, element, downstream) -> {           // integrator: per element
            if (seen.add(key.apply(element))) {
                return downstream.push(element);   // false => downstream is done
            }
            return true;                           // keep going
        });
}

List<Employee> onePerDept = staff.stream()
    .gather(distinctBy(Employee::department))
    .toList();

// takeWhileCumulativeSum — genuinely impossible with plain takeWhile,
// because takeWhile's predicate is stateless by contract.
static Gatherer<Integer, ?, Integer> takeUntilSumExceeds(int limit) {
    return Gatherer.ofSequential(
        () -> new int[1],
        (total, element, downstream) -> {
            total[0] += element;
            if (total[0] > limit) return false;    // short-circuit the stream
            return downstream.push(element);
        });
}`}
      </CodeBlock>

      <InfoBox variant="note" title="When NOT to bother">
        <p>
          Most pipelines never need a custom gatherer — <code>map</code>/<code>filter</code>/
          <code>flatMap</code> cover the ordinary cases, and a plain loop is clearer than a
          gatherer you wrote for one call site. Reach for <code>Gatherer</code> when the
          operation is genuinely <em>stateful across elements</em> (windowing, running totals,
          dedupe-by-key) and you want it reusable across pipelines. Reach for the built-in{' '}
          <code>Gatherers</code> factories freely — those are just better than the loops they
          replace.
        </p>
      </InfoBox>

      <h2>Primitive Streams</h2>
      <p>
        <code>Stream&lt;Integer&gt;</code> boxes every element. For numeric work, the primitive
        specialisations <code>IntStream</code>, <code>LongStream</code>, and{' '}
        <code>DoubleStream</code> avoid that cost and add numeric terminal operations that the
        generic <code>Stream</code> does not have.
      </p>

      <CodeBlock language="java" title="PrimitiveStreams.java">
{`// Ranges — the idiomatic replacement for an index-based for loop.
IntStream.range(0, 5).forEach(System.out::println);        // 0,1,2,3,4
IntStream.rangeClosed(1, 5).forEach(System.out::println);  // 1,2,3,4,5

// Numeric terminals that only exist on primitive streams.
int sum          = IntStream.rangeClosed(1, 100).sum();
OptionalDouble avg = IntStream.of(3, 1, 4, 1, 5).average();
OptionalInt max    = IntStream.of(3, 1, 4, 1, 5).max();

// Crossing between object and primitive streams.
int totalLength = words.stream().mapToInt(String::length).sum();   // object -> int
List<Integer> boxed = IntStream.range(0, 5).boxed().toList();      // int -> object
IntStream chars = "hello".chars();                                 // String -> int stream

// Careful: "hello".chars() yields int code points, not chars.
String upper = "hello".chars()
    .mapToObj(c -> String.valueOf((char) c))
    .map(String::toUpperCase)
    .collect(Collectors.joining());`}
      </CodeBlock>

      <h2>Creating Streams</h2>

      <CodeBlock language="java" title="StreamSources.java">
{`// From known values or a collection
Stream<String> a = Stream.of("x", "y", "z");
Stream<String> b = list.stream();
Stream<String> c = Arrays.stream(array);

// From a single possibly-null value (Java 9+) — 0 or 1 element
Stream<String> d = Stream.ofNullable(maybeNull);

// Empty
Stream<String> e = Stream.empty();

// INFINITE streams — must be bounded with limit() or takeWhile()
Stream.iterate(1, n -> n * 2).limit(10).forEach(System.out::println);   // powers of 2
Stream.generate(Math::random).limit(5).forEach(System.out::println);

// Three-argument iterate (Java 9+) — a for loop as a stream, self-bounding
Stream.iterate(1, n -> n < 100, n -> n * 3).forEach(System.out::println);

// takeWhile / dropWhile (Java 9+) — stop or skip based on a predicate
// rather than a fixed count. Both assume the stream is ORDERED.
List<Integer> ascending = numbers.stream().takeWhile(n -> n < 50).toList();
List<Integer> rest      = numbers.stream().dropWhile(n -> n < 50).toList();

// From a file, lazily — closes the underlying handle via try-with-resources
try (Stream<String> lines = Files.lines(Path.of("data.txt"))) {
    lines.filter(l -> !l.isBlank()).forEach(System.out::println);
}`}
      </CodeBlock>

      <h2>Parallel Streams — Use Sparingly</h2>
      <p>
        Adding <code>.parallel()</code> (or calling <code>.parallelStream()</code>) splits the
        work across the common <code>ForkJoinPool</code>. It is a single-word change that can
        speed a pipeline up — or silently make it slower and less correct.
      </p>

      <CodeBlock language="java" title="ParallelStreams.java">
{`// Reasonable use: large dataset, CPU-bound work, no shared mutable state.
double total = hugeList.parallelStream()
    .mapToDouble(this::expensivePureComputation)
    .sum();

// WRONG — the shared ArrayList is not thread-safe. Results are corrupted
// or an exception is thrown, non-deterministically.
List<String> results = new ArrayList<>();
items.parallelStream().forEach(results::add);       // race condition

// RIGHT — let the collector handle the merging.
List<String> results = items.parallelStream().map(this::render).toList();

// WRONG — forEach gives no ordering guarantee in parallel.
items.parallelStream().forEach(System.out::println);
// RIGHT — forEachOrdered preserves encounter order (at a cost).
items.parallelStream().forEachOrdered(System.out::println);`}
      </CodeBlock>

      <InfoBox variant="warning" title="When NOT to go parallel">
        <p>
          Parallel streams run on the shared common <code>ForkJoinPool</code>, sized to
          &quot;available processors minus one&quot;. Putting <strong>blocking I/O</strong> in a
          parallel stream starves that pool for every other parallel stream in the JVM — including
          ones inside libraries you did not write. Parallelism also loses money on small
          collections (the split/merge overhead dominates), on sources that split poorly
          (<code>LinkedList</code>, <code>Stream.iterate</code>), and on any pipeline whose
          operations are order-dependent or stateful. The rule of thumb: measure first, and for
          I/O-bound fan-out use virtual threads or <code>StructuredTaskScope</code> instead — see
          the Concurrency lesson.
        </p>
      </InfoBox>

      <h2>Optional</h2>
      <p>
        <code>Optional&lt;T&gt;</code> is a container that may or may not hold a value. It was
        introduced to help eliminate <code>NullPointerException</code> and make APIs more
        explicit about when a value might be absent. It shows up here because stream terminals
        like <code>findFirst</code>, <code>max</code>, and <code>reduce</code> all return one.
      </p>
      <InfoBox variant="note" title="Optional has a dedicated lesson">
        <p>
          What follows is the API tour you need to read stream results. The rules for{' '}
          <em>designing</em> with Optional — where it belongs in a signature, the six anti-patterns
          that show up in real codebases, and how it interacts with records and JPA — are covered
          in depth in the <strong>Optional — Best and Worst Practices</strong> lesson at the end
          of this section.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="OptionalExamples.java">
{`import java.util.Optional;
import java.util.List;

public class OptionalExamples {
    public static void main(String[] args) {
        // Creating Optionals
        Optional<String> present = Optional.of("Hello");
        Optional<String> empty = Optional.empty();
        Optional<String> nullable = Optional.ofNullable(null); // becomes empty

        // Checking and retrieving values
        System.out.println("present isPresent: " + present.isPresent()); // true
        System.out.println("empty isEmpty: " + empty.isEmpty());         // true

        // ifPresent: execute action only if value exists
        present.ifPresent(val -> System.out.println("Value: " + val));

        // orElse: provide a default value
        String result1 = empty.orElse("default");
        System.out.println("orElse: " + result1); // "default"

        // orElseGet: lazy default (computed only if needed)
        String result2 = empty.orElseGet(() -> "computed default");
        System.out.println("orElseGet: " + result2);

        // orElseThrow: throw if empty
        try {
            String result3 = empty.orElseThrow(
                () -> new IllegalStateException("Value is required")
            );
        } catch (IllegalStateException e) {
            System.out.println("Caught: " + e.getMessage());
        }

        // map and flatMap: transform the value if present
        Optional<Integer> length = present.map(String::length);
        System.out.println("Length: " + length.orElse(0)); // 5

        // Chaining with streams
        List<String> names = List.of("Alice", "Bob", "Charlie");
        Optional<String> found = names.stream()
            .filter(name -> name.startsWith("B"))
            .findFirst();
        String greeting = found
            .map(name -> "Hello, " + name + "!")
            .orElse("Nobody found");
        System.out.println(greeting); // Hello, Bob!
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Optional Anti-Patterns">
        <p>
          Avoid using <code>Optional</code> for class fields, method parameters, or collections.
          It is designed for method return types where a value might be absent. Never call{' '}
          <code>.get()</code> without first checking <code>.isPresent()</code> — instead, use{' '}
          <code>orElse()</code>, <code>ifPresent()</code>, or <code>map()</code> for safer and
          more expressive code.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="What does the following stream expression return?"
        options={[
          "15",
          "120",
          "150",
          "60"
        ]}
        correctIndex={1}
        explanation="Step by step: filter(n > 2) keeps [3, 4, 5]. Then map(n * 10) transforms to [30, 40, 50]. Finally reduce(0, Integer::sum) adds them: 0 + 30 + 40 + 50 = 120."
        code={"List.of(1,2,3,4,5).stream()\n  .filter(n -> n > 2)\n  .map(n -> n * 10)\n  .reduce(0, Integer::sum)"}
        language="java"
      />
    </LessonLayout>
  );
}

export default Streams;
