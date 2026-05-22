import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaStreams() {
  return (
    <LessonLayout
      title="Streams & Lambdas"
      sectionId="java"
      lessonIndex={6}
      prev={{ path: "/java/exceptions", label: "Exception Handling" }}
      next={{ path: "/java/concurrency", label: "Concurrency" }}
    >
      <p>Java 8 lambdas and the Stream API enable functional-style collection processing — filter, transform, and aggregate data with readable, composable pipelines.</p>

      <h2>Lambda Expressions</h2>
      <CodeBlock language="java" title="Lambda Syntax and Method References">
{`// Lambda syntax: (params) -> expression or { body }
Runnable r = () -> System.out.println("Hello!");
Comparator<String> byLen = (a, b) -> a.length() - b.length();
Predicate<Integer> isEven = n -> n % 2 == 0;

// Method references — shorthand for lambdas
Consumer<String>   print     = System.out::println;    // instance::method
Function<String,Integer> len = String::length;          // Class::instanceMethod
Function<String,Integer> parseInt = Integer::parseInt;  // Class::staticMethod
Supplier<List<String>> newList = ArrayList::new;       // Class::new`}
      </CodeBlock>

      <h2>Functional Interfaces</h2>
      <CodeBlock language="java" title="java.util.function interfaces">
{`import java.util.function.*;

Predicate<String>  isLong   = s -> s.length() > 5;
Function<String,Integer> toLen = String::length;
Consumer<String>   logger   = s -> System.out.println("[LOG] " + s);
Supplier<String>   greeting = () -> "Hello, World!";

// Composition
Predicate<String> isLongUpper = isLong.and(s -> s.equals(s.toUpperCase()));
Function<String,String> trimUpper = ((Function<String,String>)String::trim).andThen(String::toUpperCase);

// BiFunction
BiFunction<String,Integer,String> repeat = (s, n) -> s.repeat(n);
System.out.println(repeat.apply("ha", 3)); // hahaha`}
      </CodeBlock>

      <h2>Stream API</h2>
      <CodeBlock language="java" title="Stream Pipeline Patterns">
{`List<String> names = List.of("Alice","Bob","Charlie","Diana","Eve");

// filter → map → collect
List<String> longUpperNames = names.stream()
    .filter(n -> n.length() > 3)
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());

// Terminal: count, sum, average, min, max
long count = names.stream().filter(n -> n.startsWith("A")).count();
OptionalDouble avg = names.stream().mapToInt(String::length).average();

// reduce
int total = IntStream.rangeClosed(1, 10).reduce(0, Integer::sum); // 55

// Collectors
Map<Integer,List<String>> grouped = names.stream()
    .collect(Collectors.groupingBy(String::length));
String joined = names.stream().collect(Collectors.joining(", ")); // Alice, Bob...

// flatMap
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4));
List<Integer> flat = nested.stream().flatMap(List::stream).collect(Collectors.toList());

// anyMatch / allMatch / noneMatch / findFirst
boolean anyLong = names.stream().anyMatch(n -> n.length() > 5); // true (Charlie)
Optional<String> first = names.stream().filter(n -> n.startsWith("D")).findFirst();`}
      </CodeBlock>

      <h2>Optional</h2>
      <CodeBlock language="java" title="Optional to Avoid NullPointerException">
{`Optional<String> present = Optional.of("value");
Optional<String> empty   = Optional.empty();
Optional<String> maybe   = Optional.ofNullable(possiblyNull);

present.isPresent();         // true
present.get();               // "value" (throws if empty — avoid direct get)
present.orElse("default");   // "value"
empty.orElse("default");     // "default"
empty.orElseGet(() -> compute()); // lazy default
empty.orElseThrow(() -> new RuntimeException("Not found"));

// Transform
Optional<Integer> len = present.map(String::length); // Optional[5]
present.ifPresent(System.out::println);               // prints value

// Chain (avoids NPE cascade)
String city = getUser()
    .map(User::getAddress)
    .map(Address::getCity)
    .orElse("Unknown");`}
      </CodeBlock>

      <InfoBox variant="tip" title="Streams vs Loops">
        <p>Streams are not always faster than loops. For simple operations, a traditional loop may be faster. Use streams when readability and expressiveness matter, or when you can leverage parallelStream() for genuinely parallel-safe operations on large datasets.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between map() and flatMap() in streams?"
        options={["They are identical", "map() transforms each element; flatMap() transforms and flattens nested collections", "flatMap() is faster than map()", "map() is for numbers only"]}
        correctIndex={1}
        explanation="map() applies a function to each element, returning a stream of the same size. flatMap() applies a function that returns a stream for each element, then flattens all those streams into one. Use flatMap() when each element should produce zero or more output elements."
      />
    </LessonLayout>
  );
}
