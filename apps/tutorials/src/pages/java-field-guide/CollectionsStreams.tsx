import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaCollectionsStreams() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java + Spring Boot 4 · Field Reference"
      title="Collections & Streams"
      tagline="Which collection to reach for, and the stream/Collectors chains you'll write on repeat — condensed for offline study."
      meta={['Java 21+', '14 patterns']}
      footerLabel="Personal study reference — Java"
      pageLabel="Java + Spring Field Guide · Collections & Streams"
      prev={{ path: '/java-field-guide/syntax', label: 'Modern Java Syntax' }}
      next={{ path: '/java-field-guide/concurrency', label: 'Concurrency & Virtual Threads' }}
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
        caption="Same decision tree as Set. Only ConcurrentHashMap is safe to share across threads without external locking — HashMap under concurrent writes can infinite-loop."
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

      <PosterQuickRef
        title="Which collection/stream tool do I need?"
        rows={[
          { need: 'Ordered list, fast random access', answer: 'ArrayList' },
          { need: 'Unique elements, sorted', answer: 'TreeSet' },
          { need: 'Thread-safe map', answer: 'ConcurrentHashMap' },
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
