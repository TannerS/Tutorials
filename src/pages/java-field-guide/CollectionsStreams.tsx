import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaCollectionsStreams() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java · Field Reference"
      title="Collections & Streams"
      tagline="Which collection to reach for, and the stream/Collectors chains you'll write on repeat — condensed for offline study."
      meta={['Java 21+', '20 patterns']}
      footerLabel="Personal study reference — Java"
      pageLabel="Java Field Guide · Collections & Streams"
      prev={{ path: '/java-field-guide/oop-generics', label: 'OOP & Generics' }}
      next={{ path: '/java-field-guide/exceptions-io', label: 'Exceptions & I/O' }}
    >
      <PosterCard
        glyph="Ls"
        title={<>List<span className="dim"> — ArrayList vs LinkedList</span></>}
        language="java"
        code={`List<String> list = new ArrayList<>();       // O(1) get, resizable array
List<String> fixed = List.of("a", "b", "c"); // immutable

list.add("x"); list.get(0); list.remove("x");
list.stream().filter(s -> s.startsWith("a")).toList();`}
        caption="ArrayList wins almost every time — O(1) random access, compact memory. Reach for LinkedList only with heavy insert/remove at an iterator position, which is rare."
      />

      <PosterCard
        glyph="Set"
        title={<>Set<span className="dim"> — Hash / Linked / Tree</span></>}
        language="java"
        code={`Set<String> hash = new HashSet<>();          // O(1), no order
Set<String> linked = new LinkedHashSet<>();  // O(1), insertion order
Set<String> tree = new TreeSet<>();          // O(log n), sorted

var union = new HashSet<>(a); union.addAll(b);
var inter = new HashSet<>(a); inter.retainAll(b);`}
        caption="HashSet is the default. Use LinkedHashSet when iteration order matters for output, TreeSet when you need a sorted view."
      />

      <PosterCard
        glyph="Map"
        title={<>Map<span className="dim"> — Hash / Linked / Tree / Concurrent</span></>}
        language="java"
        code={`Map<String,Integer> hash = new HashMap<>();          // O(1), no order, null key ok
Map<String,Integer> linked = new LinkedHashMap<>();  // O(1), insertion order
Map<String,Integer> tree = new TreeMap<>();          // O(log n), key-sorted
Map<String,Integer> concurrent = new ConcurrentHashMap<>(); // thread-safe`}
        caption="Same decision tree as Set. Only ConcurrentHashMap is safe to share across threads without external locking — concurrent writes to a plain HashMap silently lose updates and can corrupt its internal state. (The notorious infinite loop on resize was a pre-Java-8 failure mode; the modern one is quieter and harder to spot.)"
      />

      <PosterCard
        glyph="hE"
        title={<>hashCode before equals<span className="dim"> — the lookup order</span></>}
        language="java"
        code={`// A hash lookup is TWO steps, and they run in this order:
//   1. hashCode()  decides WHICH BUCKET to look in
//   2. equals()    settles ties among the few entries found there

class BadPoint {                       // equals overridden, hashCode NOT
    @Override public boolean equals(Object o) { /* careful, correct */ }
    // inherits Object.hashCode() -> identity-derived, arbitrary
}

var set = new HashSet<BadPoint>();
set.add(new BadPoint(1, 2));
set.contains(new BadPoint(1, 2));   // false — and equals() NEVER RAN

// Worse than "lookups return false":
set.size();                 // 2 for two objects that are equals() — a Set
                            // no longer de-duplicates
map.put(key, v);            // twice -> two entries instead of a replace
set.remove(equalObject);    // can't find it -> leaks

// Reverse omission (hashCode without equals) is harmless but useless:
// right bucket, then Object.equals rejects on identity anyway.

// Mutating a hash-relevant field after insertion strands the object in the
// wrong bucket: unreachable by contains/remove, still visible when iterating.
// Keys must be immutable — which is why records make ideal keys.`}
        caption={<>Your carefully-written <code>equals()</code> is not being <em>overruled</em> — it is never reached, because a broken <code>hashCode</code> sends the lookup to the wrong bucket entirely. That is the whole reason the language ties the two methods together: they are one mechanism, and overriding either alone breaks it.</>}
      />

      <PosterCard
        glyph="Cp"
        title={<>Map<span className="dim"> compute patterns</span></>}
        language="java"
        code={`map.putIfAbsent("k", 0);
map.computeIfAbsent("k", key -> expensiveCalc(key));
map.computeIfPresent("k", (key, v) -> v + 1);
map.merge("k", 1, Integer::sum);   // increment or initialize to 1`}
        caption="merge is the one-liner for counters and accumulator maps — no manual containsKey check needed."
      />

      <PosterCard
        glyph="Dq"
        title={<>Deque<span className="dim"> as Stack / Queue</span></>}
        language="java"
        code={`Deque<String> stack = new ArrayDeque<>();
stack.push("a");   // addFirst
stack.pop();        // removeFirst

Deque<String> queue = new ArrayDeque<>();
queue.offer("a");   // addLast
queue.poll();        // removeFirst`}
        caption="ArrayDeque replaces both java.util.Stack and LinkedList for stack/queue use — no synchronization overhead and no per-element node allocation."
      />

      <PosterCard
        glyph="Im"
        title={<>Immutable Collections<span className="dim"> — Java 9+</span></>}
        language="java"
        code={`List<String> l = List.of("a", "b", "c");
Set<Integer> s = Set.of(1, 2, 3);          // throws if duplicates
Map<String, Integer> m = Map.of("a", 1, "b", 2);

// all throw UnsupportedOperationException on mutation
// to make mutable: new ArrayList<>(List.of(...))`}
        caption="Set.of and Map.of reject duplicate keys/elements at construction — a bug-catcher that HashSet/HashMap silently allow through."
      />

      <PosterCard
        glyph="Cr"
        title={<>Stream<span className="dim"> creation</span></>}
        language="java"
        code={`list.stream();
Stream.of("a", "b", "c");
IntStream.range(0, 10);            // 0..9
IntStream.rangeClosed(1, 10);      // 1..10
Files.lines(Path.of("data.txt"));  // Stream<String>, lazy`}
        caption="IntStream/DoubleStream/LongStream avoid boxing overhead for numeric pipelines — prefer them over Stream<Integer> when doing math."
      />

      <PosterCard
        glyph="Int"
        title={<>Intermediate<span className="dim"> operations (lazy)</span></>}
        language="java"
        code={`stream
  .filter(x -> x > 0)
  .map(x -> x * 2)
  .flatMap(list -> list.stream())   // flatten nested streams
  .distinct()
  .sorted()
  .limit(10);`}
        caption="All lazy — nothing runs until a terminal operation is called. flatMap is the tool for List<List<T>> → List<T>."
      />

      <PosterCard
        glyph="Trm"
        title={<>Terminal<span className="dim"> operations</span></>}
        language="java"
        code={`stream.count();                          // long
stream.reduce(0, Integer::sum);          // with identity, returns T
stream.reduce(Integer::sum);             // no identity, returns Optional<T>
stream.anyMatch(x -> x > 0);
stream.toList();                          // Java 16+, unmodifiable`}
        caption="Terminal ops trigger execution and consume the stream — call exactly one per pipeline."
      />

      <PosterCard
        glyph="Col"
        title={<>Collectors<span className="dim"> cheat sheet</span></>}
        language="java"
        code={`import static java.util.stream.Collectors.*;

.collect(groupingBy(Item::getCategory))                 // Map<Cat, List<Item>>
.collect(groupingBy(Item::getCategory, counting()))      // Map<Cat, Long>
.collect(partitioningBy(x -> x > 0))                     // Map<Boolean, List<T>>
.collect(joining(", ", "[", "]"))                         // "[a, b, c]"`}
        caption="groupingBy is the workhorse for building lookup maps; partitioningBy is the boolean-only special case that always returns exactly two keys, true and false."
      />

      <PosterCard
        glyph="Opt"
        title={<>Optional<span className="dim"> chaining</span></>}
        language="java"
        code={`Optional<String> opt = Optional.ofNullable(val);

opt.map(String::toUpperCase)
   .filter(s -> s.length() > 3)
   .orElseThrow(() -> new NotFoundException("missing"));

opt.ifPresentOrElse(System.out::println, () -> log.warn("empty"));`}
        caption="Chain map/filter instead of calling get() after isPresent() — Optional is designed for return types only, never as a field or parameter type."
      />

      <PosterCard
        glyph="!"
        title={<>Stream<span className="dim"> gotchas</span></>}
        language="java"
        code={`Stream<String> s = list.stream();
s.count();
s.forEach(System.out::println);  // ❌ IllegalStateException — already consumed

// ❌ side effects in map() are unsafe with parallel streams
list.stream().map(x -> { total += x; return x; });  // don't`}
        caption="A stream is single-use — build a fresh one per terminal operation. Keep map/filter pure; mutating shared state inside them breaks under parallel()."
      />

      <PosterCard
        glyph="Seq"
        title={<>Sequenced Collections<span className="dim"> — Java 21</span></>}
        language="java"
        code={`list.getFirst();  list.getLast();
list.addFirst(x); list.removeLast();

// reverse view — no copy, live over the same data
SequencedCollection<Integer> rev = list.reversed();`}
        caption="One shared first/last vocabulary for every ordered collection — List, Deque, LinkedHashSet, LinkedHashMap — instead of type-specific methods."
      />

      <PosterCard
        glyph="Gth"
        title={<>Gatherers<span className="dim"> — custom intermediate ops, Java 24</span></>}
        language="java"
        code={`import java.util.stream.Gatherers;

// batch into chunks of 500 (bulk DB writes / API calls)
.gather(Gatherers.windowFixed(500))

// overlapping windows — moving averages
.gather(Gatherers.windowSliding(7))

// running total: [1,2,3,4] -> [1,3,6,10]
.gather(Gatherers.scan(() -> 0, Integer::sum))

// bounded parallel I/O on virtual threads,
// encounter order preserved
.gather(Gatherers.mapConcurrent(10, id -> client.fetch(id)))`}
        caption="gather() is to intermediate operations what collect() is to terminal ones — finally a supported way to write stateful steps like windowing and running totals. mapConcurrent is the standout: bounded fan-out I/O on virtual threads, in order, in one line."
      />

      <PosterCard
        glyph="Rcp"
        title={<>Common Patterns<span className="dim"> — frequency & flatten</span></>}
        language="java"
        code={`Map<String, Long> freq = words.stream()
    .collect(groupingBy(Function.identity(), counting()));

List<String> flat = listOfLists.stream()
    .flatMap(Collection::stream)
    .toList();`}
        caption="The frequency-map and flatten recipes come up constantly — worth memorizing over re-deriving each time."
      />

      <PosterCard
        glyph="fM"
        title={<>flatMap<span className="dim"> — flatten nested</span></>}
        language="java"
        code={`// map gives Stream<List<T>>; flatMap splices them into one flat stream.
List<LineItem> all = orders.stream()
    .flatMap(order -> order.items().stream())
    .toList();

// Split text into words
lines.stream().flatMap(l -> Arrays.stream(l.split("\\\\s+"))).toList();

// Drop empties from a Stream<Optional<T>>  (Java 9+)
ids.stream().map(repo::findById).flatMap(Optional::stream).toList();

// Cartesian product — replaces the nested for loop
suits.stream().flatMap(s -> ranks.stream().map(r -> r + " of " + s)).toList();`}
        caption={<>Whenever a pipeline produces a <code>Stream&lt;List&lt;T&gt;&gt;</code> or you reach for a nested loop, <code>flatMap</code> is the operation. Each element maps to a stream, and all of them are concatenated.</>}
      />

      <PosterCard
        glyph="gBy"
        title={<>groupingBy<span className="dim"> — downstream collectors</span></>}
        language="java"
        code={`// Count / sum per group — the second arg is the DOWNSTREAM collector
groupingBy(Employee::dept, counting())
groupingBy(Employee::dept, summingDouble(Employee::salary))
groupingBy(Employee::dept, mapping(Employee::name, toList()))
groupingBy(Employee::dept, groupingBy(Employee::city))     // multi-level
groupingBy(Employee::dept, TreeMap::new, toList())         // ordered keys

// Top earner per group: maxBy returns Optional, collectingAndThen unwraps it
groupingBy(Employee::dept, collectingAndThen(
    maxBy(comparingDouble(Employee::salary)), Optional::orElseThrow))

// toMap THROWS on duplicate keys — supply a merge function
toMap(Employee::dept, Employee::salary, Double::sum)

// teeing (Java 12+) — two collectors, one pass, merged result
teeing(summingDouble(Employee::salary), counting(), PayrollSummary::new)`}
        caption={<>The two-arg <code>toMap</code> throws <code>IllegalStateException</code> on the first key collision — a bug that surfaces in production, not in tests. Always pass the merge function unless the key is a proven unique id.</>}
      />

      <PosterCard
        glyph="Lz"
        title={<>Laziness<span className="dim"> — and one-shot streams</span></>}
        language="java"
        code={`// Intermediate ops do NOTHING until a terminal op runs. Elements flow
// through the whole pipeline one at a time, not stage by stage.
names.stream().filter(expensive).map(alsoExpensive).findFirst();
// touches only elements until the first match — not the whole list

// Short-circuiting terminals: anyMatch allMatch noneMatch findFirst findAny
// Short-circuiting intermediates: limit skip takeWhile dropWhile

// A stream is CONSUMED ONCE.
Stream<String> s = list.stream();
s.count(); s.count();   // IllegalStateException: already operated upon

// peek() is a DEBUG tool — intermediate, may not run, may be elided.`}
        caption="A stream is a pipeline over a source, not a collection. To traverse twice, keep the source and call .stream() again."
      />

      <PosterCard
        glyph="i∥"
        title={<>Primitive &amp; parallel streams</>}
        language="java"
        code={`IntStream.range(0, 5)         // 0..4     — replaces the index for loop
IntStream.rangeClosed(1, 5)   // 1..5
words.stream().mapToInt(String::length).sum();   // object -> int, no boxing
IntStream.range(0, 5).boxed().toList();          // int -> object

// parallel: only for large, CPU-bound, side-effect-free pipelines
hugeList.parallelStream().mapToDouble(this::pureCompute).sum();

// WRONG — ArrayList is not thread-safe; corrupts non-deterministically
items.parallelStream().forEach(results::add);
// RIGHT — let the collector merge
items.parallelStream().map(this::render).toList();`}
        caption={<>Parallel streams share the common <code>ForkJoinPool</code>, so blocking I/O in one starves every other parallel stream in the JVM. For I/O fan-out use virtual threads instead.</>}
      />

      <PosterQuickRef
        title="Which collection/stream tool do I need?"
        rows={[
          { need: 'Ordered list, fast random access', answer: 'ArrayList' },
          { need: 'Unique elements, sorted', answer: 'TreeSet' },
          { need: 'Thread-safe map', answer: 'ConcurrentHashMap' },
          { need: 'contains() false on an equal object', answer: 'hashCode is missing/broken — equals never ran' },
          { need: 'Object stranded in a HashMap/Set', answer: 'A hash-relevant field mutated — keys must be immutable' },
          { need: 'Stack or FIFO queue', answer: 'ArrayDeque' },
          { need: 'Counter / accumulator map', answer: 'map.merge(k, 1, Integer::sum)' },
          { need: 'Group elements by key', answer: 'Collectors.groupingBy' },
          { need: 'Split into two buckets', answer: 'Collectors.partitioningBy' },
          { need: 'Nullable return value', answer: 'Optional<T> (return type only)' },
          { need: 'Flatten nested lists', answer: 'flatMap(Collection::stream)' },
          { need: 'First/last of any ordered collection', answer: 'getFirst() / getLast() (Java 21)' },
        ]}
      />
    </PosterLayout>
  );
}
