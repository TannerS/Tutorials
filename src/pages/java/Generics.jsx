import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaGenerics() {
  return (
    <LessonLayout
      title="Generics"
      sectionId="java"
      lessonIndex={4}
      prev={{ path: "/java/collections", label: "Collections Framework" }}
      next={{ path: "/java/exceptions", label: "Exception Handling" }}
    >
      <p>Generics let you write type-safe code that works with any type, catching errors at compile time instead of runtime.</p>

      <h2>Why Generics?</h2>
      <CodeBlock language="java" title="Before vs After Generics">
{`// Before (Java 1.4) — unsafe raw types
List rawList = new ArrayList();
rawList.add("hello");
rawList.add(42);
String s = (String) rawList.get(1); // ClassCastException at runtime!

// With generics — compile-time safety
List<String> safeList = new ArrayList<>();
safeList.add("hello");
// safeList.add(42); // COMPILE ERROR
String s2 = safeList.get(0);  // no cast needed`}
      </CodeBlock>

      <h2>Generic Classes and Methods</h2>
      <CodeBlock language="java" title="Generic Box and Pair">
{`// Generic class
public class Box<T> {
    private T value;
    public Box(T value)  { this.value = value; }
    public T getValue()  { return value; }
    public void setValue(T v) { this.value = v; }
}

Box<String>  strBox = new Box<>("Hello");
Box<Integer> intBox = new Box<>(42);
System.out.println(strBox.getValue()); // Hello

// Generic method
public static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}
System.out.println(max(3, 7));           // 7
System.out.println(max("apple","mango")); // mango

// Multiple type parameters
public class Pair<A, B> {
    public final A first;
    public final B second;
    public Pair(A f, B s) { first = f; second = s; }
    @Override public String toString() { return "(" + first + ", " + second + ")"; }
}
Pair<String, Integer> p = new Pair<>("age", 30);
System.out.println(p); // (age, 30)`}
      </CodeBlock>

      <h2>Bounded Type Parameters and Wildcards</h2>
      <CodeBlock language="java" title="Bounds and Wildcards">
{`// Upper bound: T must be Number or a subtype
public static <T extends Number> double sum(List<T> list) {
    return list.stream().mapToDouble(Number::doubleValue).sum();
}
sum(List.of(1, 2, 3));    // works (Integer extends Number)
sum(List.of(1.5, 2.5));   // works (Double extends Number)

// Unbounded wildcard — read-only, unknown type
public static void printAll(List<?> list) {
    for (Object item : list) System.out.println(item);
}
printAll(List.of(1, "two", 3.0)); // works for any List

// Upper bounded wildcard (PECS: Producer Extends)
// Read FROM the list — use ? extends
public static double sumNumbers(List<? extends Number> list) {
    return list.stream().mapToDouble(Number::doubleValue).sum();
}

// Lower bounded wildcard (PECS: Consumer Super)
// Write TO the list — use ? super
public static void addIntegers(List<? super Integer> list) {
    list.add(1); list.add(2); list.add(3);
}
List<Number> nums = new ArrayList<>();
addIntegers(nums);  // works! Integer super-types include Number`}
      </CodeBlock>

      <InfoBox variant="note" title="Type Erasure">
        <p>Generic type information is erased at runtime — List&lt;String&gt; and List&lt;Integer&gt; are both just List at runtime. This is why you cannot use instanceof with generic types or create generic arrays directly (new T[] is illegal).</p>
      </InfoBox>

      <FlowChart
        title="PECS — Producer Extends, Consumer Super"
        chart={"graph LR\n  A[Operation Type] --> B{Reading or Writing?}\n  B --> |Reading from list| C[Use ? extends T]\n  B --> |Writing to list| D[Use ? super T]\n  B --> |Both| E[Use T directly]"}
      />

      <InteractiveChallenge
        question={"What does the diamond operator <> do?"}
        options={["Creates an empty collection", "Infers the generic type from the variable declaration", "Declares a wildcard type", "Specifies a lower bound"]}
        correctIndex={1}
        explanation={"The diamond operator <> triggers type inference — the compiler deduces the generic type from the variable's declared type. So new ArrayList<>() instead of new ArrayList<String>() when the variable is declared as List<String>."}
      />
    </LessonLayout>
  );
}
