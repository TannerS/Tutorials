import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Syntax() {
  return (
    <LessonLayout
      title="Syntax & Data Types"
      sectionId="java"
      lessonIndex={1}
      prev={{ path: '/java/intro', label: 'Introduction to Java' }}
      next={{ path: '/java/oop', label: 'OOP Fundamentals' }}
    >
      <h2>Variables and Data Types</h2>
      <p>
        In Java, every variable must be declared with a specific type before it can be used. Java
        is a <strong>statically-typed</strong> language, meaning the compiler checks types at
        compile time rather than at runtime. This catches many errors early in the development
        process.
      </p>

      <h3>Primitive Data Types</h3>
      <p>
        Java has eight primitive data types that serve as the building blocks for data
        manipulation:
      </p>

      <FlowChart
        title="Java Primitive Type Hierarchy"
        chart={"graph TD\nA[Primitive Types] --> B[Numeric]\nA --> C[Boolean]\nB --> D[Integer Types]\nB --> E[Floating Point]\nD --> F[byte 8-bit]\nD --> G[short 16-bit]\nD --> H[int 32-bit]\nD --> I[long 64-bit]\nE --> J[float 32-bit]\nE --> K[double 64-bit]\nA --> L[Character]\nL --> M[char 16-bit]"}
      />

      <CodeBlock language="java" title="PrimitiveTypes.java">
{`public class PrimitiveTypes {
    public static void main(String[] args) {
        // Integer types
        byte smallNumber = 127;           // -128 to 127
        short mediumNumber = 32000;       // -32,768 to 32,767
        int number = 2_000_000;           // -2^31 to 2^31-1 (underscores for readability)
        long bigNumber = 9_000_000_000L;  // -2^63 to 2^63-1 (L suffix required)

        // Floating point types
        float decimal = 3.14f;            // ~7 decimal digits (f suffix required)
        double preciseDecimal = 3.14159;  // ~15 decimal digits (default for decimals)

        // Character type
        char letter = 'A';               // Single 16-bit Unicode character
        char unicodeChar = '\\u0041';     // Unicode representation of 'A'

        // Boolean type
        boolean isJavaFun = true;         // true or false only

        System.out.println("byte: " + smallNumber);
        System.out.println("int: " + number);
        System.out.println("long: " + bigNumber);
        System.out.println("double: " + preciseDecimal);
        System.out.println("char: " + letter);
        System.out.println("boolean: " + isJavaFun);
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Primitive vs Reference Types">
        <p>
          Primitive types store actual values directly in memory, making them fast and efficient.
          Reference types (like <code>String</code>, arrays, and objects) store a reference
          (memory address) that points to the actual data on the heap. Java also provides wrapper
          classes (<code>Integer</code>, <code>Double</code>, etc.) that let you treat primitives
          as objects when needed — this is called <strong>autoboxing</strong>.
        </p>
      </InfoBox>

      <h2>Variables and Constants</h2>
      <p>
        Variables can be declared, initialized, and reassigned. Constants are declared with the{' '}
        <code>final</code> keyword and cannot be changed after initialization.
      </p>

      <CodeBlock language="java" title="VariablesAndConstants.java">
{`public class VariablesAndConstants {
    public static void main(String[] args) {
        // Variable declaration and initialization
        String greeting = "Hello";
        int count = 10;

        // Reassignment is allowed for variables
        greeting = "Hi there";
        count = 20;

        // Constants use the 'final' keyword
        final double PI = 3.14159265;
        final String APP_NAME = "My Java App";
        // PI = 3.14; // ERROR: cannot assign a value to final variable

        // Type inference with 'var' (Java 10+)
        var message = "Java infers this is a String";
        var value = 42;  // inferred as int

        System.out.println(greeting + ", count is " + count);
        System.out.println("PI = " + PI);
        System.out.println(message);
    }
}`}
      </CodeBlock>

      <h2>Operators</h2>
      <p>
        Java provides a rich set of operators for performing calculations, comparisons, and
        logical operations:
      </p>

      <CodeBlock language="java" title="Operators.java">
{`public class Operators {
    public static void main(String[] args) {
        // Arithmetic operators
        int a = 10, b = 3;
        System.out.println("a + b = " + (a + b));   // 13
        System.out.println("a - b = " + (a - b));   // 7
        System.out.println("a * b = " + (a * b));   // 30
        System.out.println("a / b = " + (a / b));   // 3 (integer division)
        System.out.println("a % b = " + (a % b));   // 1 (remainder)

        // Comparison operators
        System.out.println("a == b: " + (a == b));   // false
        System.out.println("a != b: " + (a != b));   // true
        System.out.println("a > b: " + (a > b));     // true

        // Logical operators
        boolean x = true, y = false;
        System.out.println("x && y: " + (x && y));   // false (AND)
        System.out.println("x || y: " + (x || y));   // true (OR)
        System.out.println("!x: " + (!x));            // false (NOT)

        // Increment and decrement
        int counter = 5;
        System.out.println("counter++: " + counter++); // prints 5, then increments
        System.out.println("++counter: " + (++counter)); // increments, then prints 7

        // Compound assignment
        int total = 100;
        total += 50;  // total = total + 50
        total -= 20;  // total = total - 20
        total *= 2;   // total = total * 2
        System.out.println("total: " + total); // 260
    }
}`}
      </CodeBlock>

      <h2>Control Flow</h2>
      <h3>If/Else Statements</h3>

      <CodeBlock language="java" title="ControlFlow.java">
{`public class ControlFlow {
    public static void main(String[] args) {
        int score = 85;

        // If-else chain
        if (score >= 90) {
            System.out.println("Grade: A");
        } else if (score >= 80) {
            System.out.println("Grade: B");
        } else if (score >= 70) {
            System.out.println("Grade: C");
        } else {
            System.out.println("Grade: F");
        }

        // Ternary operator (compact if-else)
        String result = (score >= 60) ? "Pass" : "Fail";
        System.out.println("Result: " + result);

        // Switch statement (traditional)
        int day = 3;
        switch (day) {
            case 1: System.out.println("Monday"); break;
            case 2: System.out.println("Tuesday"); break;
            case 3: System.out.println("Wednesday"); break;
            default: System.out.println("Other day"); break;
        }

        // Switch expression (Java 14+)
        String dayName = switch (day) {
            case 1 -> "Monday";
            case 2 -> "Tuesday";
            case 3 -> "Wednesday";
            case 4 -> "Thursday";
            case 5 -> "Friday";
            default -> "Weekend";
        };
        System.out.println("Day: " + dayName);
    }
}`}
      </CodeBlock>

      <h3>Loops</h3>

      <CodeBlock language="java" title="Loops.java">
{`public class Loops {
    public static void main(String[] args) {
        // For loop
        System.out.println("For loop:");
        for (int i = 0; i < 5; i++) {
            System.out.println("  i = " + i);
        }

        // While loop
        System.out.println("While loop:");
        int count = 0;
        while (count < 3) {
            System.out.println("  count = " + count);
            count++;
        }

        // Do-while loop (executes at least once)
        System.out.println("Do-while loop:");
        int num = 10;
        do {
            System.out.println("  num = " + num);
            num--;
        } while (num > 7);

        // Enhanced for-each loop
        String[] fruits = {"Apple", "Banana", "Cherry"};
        System.out.println("For-each loop:");
        for (String fruit : fruits) {
            System.out.println("  " + fruit);
        }

        // Break and continue
        System.out.println("Break and continue:");
        for (int i = 0; i < 10; i++) {
            if (i == 3) continue; // skip 3
            if (i == 7) break;    // stop at 7
            System.out.println("  i = " + i);
        }
    }
}`}
      </CodeBlock>

      <h2>Arrays</h2>
      <p>
        Arrays are fixed-size containers that hold elements of a single type. They are indexed
        starting at 0.
      </p>

      <CodeBlock language="java" title="Arrays.java">
{`import java.util.Arrays;

public class ArrayExamples {
    public static void main(String[] args) {
        // Declare and initialize
        int[] numbers = {10, 20, 30, 40, 50};
        String[] names = new String[3];
        names[0] = "Alice";
        names[1] = "Bob";
        names[2] = "Charlie";

        // Access and modify
        System.out.println("First number: " + numbers[0]);
        System.out.println("Array length: " + numbers.length);
        numbers[2] = 99;

        // Iterate with for-each
        for (int n : numbers) {
            System.out.print(n + " ");
        }
        System.out.println();

        // Useful Arrays utility methods
        int[] data = {5, 2, 8, 1, 9};
        Arrays.sort(data);
        System.out.println("Sorted: " + Arrays.toString(data));

        int index = Arrays.binarySearch(data, 8);
        System.out.println("Index of 8: " + index);

        // Multi-dimensional arrays
        int[][] matrix = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        System.out.println("matrix[1][2] = " + matrix[1][2]); // 6
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="ArrayIndexOutOfBoundsException">
        <p>
          Accessing an array with an invalid index (negative or greater than or equal to the
          array length) throws an <code>ArrayIndexOutOfBoundsException</code> at runtime. Always
          check bounds before accessing array elements, especially when the index comes from user
          input or calculations.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="What is the output of the following code?\n\nint x = 10;\nint y = 3;\nSystem.out.println(x / y);"
        options={[
          "3.33",
          "3",
          "3.0",
          "Compilation error"
        ]}
        correctIndex={1}
        explanation="When both operands are integers, Java performs integer division, which truncates the decimal part. So 10 / 3 = 3 (not 3.33). To get a decimal result, at least one operand must be a floating-point type: (double) x / y would give 3.3333..."
        code={"int x = 10;\nint y = 3;\nSystem.out.println(x / y);"}
        language="java"
      />
    </LessonLayout>
  );
}

export default Syntax;
