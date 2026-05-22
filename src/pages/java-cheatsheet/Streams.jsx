import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaCStreams() {
  return (
    <LessonLayout
      title="Streams Cheat Sheet"
      sectionId="java-cheatsheet"
      lessonIndex={2}
      prev={{ path: "/java-cheatsheet/collections", label: "Collections Cheat Sheet" }}
      next={{ path: "/java-cheatsheet/concurrency", label: "Concurrency Cheat Sheet" }}
    >
      <p>Quick reference for Java Streams API — transforming, filtering, and aggregating collections declaratively.</p>

      <h2>Stream Pipeline</h2>
      <CodeBlock language="java" title="Complete Streams Reference">
{`List<Employee> employees = getEmployees();

// === INTERMEDIATE OPS (lazy, return Stream) ===
employees.stream()
  .filter(e -> e.getSalary() > 50_000)           // predicate
  .map(Employee::getName)                         // transform T → R
  .mapToInt(String::length)                       // T → int (IntStream)
  .flatMap(e -> e.getSkills().stream())           // T → Stream<R> (flatten)
  .distinct()                                     // remove duplicates
  .sorted()                                       // natural order
  .sorted(Comparator.comparing(Employee::getName)) // custom order
  .limit(10)                                      // first 10
  .skip(5)                                        // skip first 5
  .peek(e -> log.debug("Processing: {}", e))      // side-effect (debug)
  .takeWhile(e -> e.getSalary() < 100_000)        // stop when false (Java 9)
  .dropWhile(e -> e.getSalary() < 50_000);        // skip while true (Java 9)

// === TERMINAL OPS (eager, consume stream) ===
long   count     = stream.count();
Optional<E> min  = stream.min(Comparator.comparing(Employee::getSalary));
Optional<E> max  = stream.max(Comparator.comparing(Employee::getSalary));
Optional<E> any  = stream.findAny();
Optional<E> first= stream.findFirst();
boolean any2     = stream.anyMatch(e -> e.getSalary() > 100_000);
boolean all      = stream.allMatch(e -> e.isActive());
boolean none     = stream.noneMatch(e -> e.isActive());

// Collect to collections
List<String>          list = stream.collect(Collectors.toList());
Set<String>           set  = stream.collect(Collectors.toSet());
Map<String,Employee>  map  = stream.collect(Collectors.toMap(
                               Employee::getId, e -> e));

// Grouping
Map<Department, List<Employee>> byDept =
    stream.collect(Collectors.groupingBy(Employee::getDepartment));

Map<Department, Long> countByDept =
    stream.collect(Collectors.groupingBy(
        Employee::getDepartment, Collectors.counting()));

Map<Department, Double> avgSalary =
    stream.collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.averagingDouble(Employee::getSalary)));

// Partitioning (binary grouping)
Map<Boolean, List<Employee>> seniorJunior =
    stream.collect(Collectors.partitioningBy(e -> e.getYearsExp() >= 5));

// String joining
String names = stream.map(Employee::getName)
    .collect(Collectors.joining(", ", "[", "]"));  // [Alice, Bob, Charlie]

// Statistics
IntSummaryStatistics stats = stream.mapToInt(Employee::getSalary)
    .summaryStatistics();
// stats.getMin(), getMax(), getAverage(), getSum(), getCount()`}
      </CodeBlock>

      <InfoBox variant="tip" title="Stream vs Loop">
        <p>Use streams for declarative data transformation pipelines — they communicate intent clearly. Use loops when you need early exit logic (break), index access, checked exceptions without wrapping, or when performance profiling shows streams are a bottleneck. Parallel streams (parallelStream()) only help for CPU-bound work on large datasets — measure before using.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between map() and flatMap() in Java Streams?"
        options={["map() is for primitives, flatMap() is for objects", "map() transforms each element to one element; flatMap() transforms each element to a stream and flattens the result", "flatMap() is faster than map()", "map() returns Optional, flatMap() returns a value"]}
        correctIndex={1}
        explanation="map() is a one-to-one transformation: each element becomes exactly one new element. flatMap() is a one-to-many transformation: each element becomes a Stream, and all those streams are flattened into one. Use flatMap() when transforming to a collection/Optional and you want to flatten — e.g., getting all skills from a list of employees."
      />

    </LessonLayout>
  );
}
