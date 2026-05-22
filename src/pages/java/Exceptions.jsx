import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaExceptions() {
  return (
    <LessonLayout
      title="Exception Handling"
      sectionId="java"
      lessonIndex={5}
      prev={{ path: "/java/generics", label: "Generics" }}
      next={{ path: "/java/streams", label: "Streams & Lambdas" }}
    >
      <p>Exceptions let you handle error conditions gracefully. Java uses a checked/unchecked model to distinguish between expected errors and programming bugs.</p>

      <FlowChart
        title="Exception Hierarchy"
        chart={"graph TD\n  A[Throwable] --> B[Error - JVM problems]\n  A --> C[Exception]\n  B --> D[OutOfMemoryError]\n  B --> E[StackOverflowError]\n  C --> F[RuntimeException - Unchecked]\n  C --> G[IOException - Checked]\n  F --> H[NullPointerException]\n  F --> I[IllegalArgumentException]\n  F --> J[ArrayIndexOutOfBoundsException]"}
      />

      <h2>Try-Catch-Finally</h2>
      <CodeBlock language="java" title="Exception Handling Blocks">
{`// Basic try-catch
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("Error: " + e.getMessage()); // / by zero
}

// Multiple catch blocks — most specific first!
try {
    String s = null;
    s.length();
} catch (NullPointerException e) {
    System.out.println("Null: " + e.getMessage());
} catch (RuntimeException e) {
    System.out.println("Runtime: " + e);
} catch (Exception e) {
    System.out.println("General: " + e);
} finally {
    System.out.println("Always runs (cleanup here)");
}

// Multi-catch (Java 7+) — handles multiple types the same way
try {
    parseAndLoad();
} catch (IOException | NumberFormatException e) {
    System.out.println("Parse or IO error: " + e.getMessage());
}

// throw — manually throw an exception
public void setAge(int age) {
    if (age < 0 || age > 150) {
        throw new IllegalArgumentException("Invalid age: " + age);
    }
    this.age = age;
}

// throws — declare checked exceptions in method signature
public void readFile(String path) throws IOException {
    // caller must handle or declare this exception
}`}
      </CodeBlock>

      <h2>Try-With-Resources</h2>
      <CodeBlock language="java" title="AutoCloseable Resources">
{`// Auto-closes anything implementing AutoCloseable
try (BufferedReader br = new BufferedReader(new FileReader("data.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    System.err.println("Error: " + e.getMessage());
}
// br is closed automatically here, even if exception occurs

// Multiple resources (closed in reverse order)
try (var conn = getConnection();
     var stmt = conn.prepareStatement("SELECT * FROM users");
     var rs   = stmt.executeQuery()) {
    while (rs.next()) System.out.println(rs.getString("name"));
} catch (SQLException e) {
    e.printStackTrace();
}`}
      </CodeBlock>

      <h2>Custom Exceptions</h2>
      <CodeBlock language="java" title="Creating Domain Exceptions">
{`// Custom checked exception
public class InsufficientFundsException extends Exception {
    private final double shortfall;
    public InsufficientFundsException(double shortfall) {
        super(String.format("Need %.2f more funds", shortfall));
        this.shortfall = shortfall;
    }
    public double getShortfall() { return shortfall; }
}

// Custom unchecked exception
public class InvalidOrderException extends RuntimeException {
    public InvalidOrderException(String msg) { super(msg); }
    public InvalidOrderException(String msg, Throwable cause) {
        super(msg, cause); // preserve original stack trace
    }
}

// Using custom exceptions
public class BankAccount {
    private double balance;
    public void withdraw(double amount) throws InsufficientFundsException {
        if (amount > balance)
            throw new InsufficientFundsException(amount - balance);
        balance -= amount;
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Best Practices">
        <p>Catch specific exceptions, not Exception. Always clean up resources. Never swallow exceptions silently (empty catch blocks). Include meaningful messages. Prefer unchecked exceptions for programming errors; use checked for recoverable conditions.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Which block always executes regardless of whether an exception is thrown or caught?"
        options={["catch", "try", "finally", "throws"]}
        correctIndex={2}
        explanation="The finally block always executes — whether the try completed normally, threw an exception (caught or not), or even if there's a return statement in try/catch. Used for critical cleanup like closing connections."
      />
    </LessonLayout>
  );
}
