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

      <h2>Optional</h2>
      <p>
        <code>Optional&lt;T&gt;</code> is a container that may or may not hold a value. It was
        introduced to help eliminate <code>NullPointerException</code> and make APIs more
        explicit about when a value might be absent.
      </p>

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
        question="What does the following stream expression return?\n\nList.of(1,2,3,4,5).stream()\n  .filter(n -> n > 2)\n  .map(n -> n * 10)\n  .reduce(0, Integer::sum)"
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
