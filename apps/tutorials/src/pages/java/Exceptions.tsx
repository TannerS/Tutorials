import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Exceptions() {
  return (
    <LessonLayout
      title="Exception Handling"
      sectionId="java"
      lessonIndex={5}
      prev={{ path: '/java/generics', label: 'Generics & Type System' }}
      next={{ path: '/java/streams', label: 'Streams & Lambdas' }}
    >
      <h2>What Are Exceptions?</h2>
      <p>
        An exception is an event that disrupts the normal flow of a program&apos;s execution.
        Java uses exceptions to handle errors and other exceptional conditions in a structured
        way. Instead of returning error codes (as in C), Java throws exception objects that
        contain information about what went wrong, where it happened, and the call stack at the
        time of the error.
      </p>

      <FlowChart
        title="Exception Class Hierarchy"
        chart={"graph TD\nA[Throwable] --> B[Error]\nA --> C[Exception]\nB --> D[OutOfMemoryError]\nB --> E[StackOverflowError]\nC --> F[RuntimeException]\nC --> G[IOException]\nC --> H[SQLException]\nF --> I[NullPointerException]\nF --> J[ArrayIndexOutOfBoundsException]\nF --> K[IllegalArgumentException]\nF --> L[ClassCastException]"}
      />

      <h2>Checked vs Unchecked Exceptions</h2>
      <p>
        Java divides exceptions into two categories:
      </p>
      <ul>
        <li>
          <strong>Checked exceptions</strong> — Subclasses of <code>Exception</code> (but not{' '}
          <code>RuntimeException</code>). The compiler requires you to either catch them or
          declare them with <code>throws</code>. Examples: <code>IOException</code>,{' '}
          <code>SQLException</code>, <code>FileNotFoundException</code>.
        </li>
        <li>
          <strong>Unchecked exceptions</strong> — Subclasses of <code>RuntimeException</code>.
          The compiler does not require you to handle them. They usually indicate programming
          bugs. Examples: <code>NullPointerException</code>,{' '}
          <code>ArrayIndexOutOfBoundsException</code>, <code>IllegalArgumentException</code>.
        </li>
        <li>
          <strong>Errors</strong> — Subclasses of <code>Error</code>. These represent serious
          problems that applications should not try to catch (e.g., <code>OutOfMemoryError</code>
          ).
        </li>
      </ul>

      <InfoBox variant="info" title="When to Use Which?">
        <p>
          Use <strong>checked exceptions</strong> for recoverable conditions where the caller can
          reasonably be expected to handle the error (e.g., file not found, network timeout). Use{' '}
          <strong>unchecked exceptions</strong> for programming errors and precondition violations
          (e.g., null arguments, invalid index). As a general rule, if a caller can reasonably
          recover from the error, make it checked; otherwise, make it unchecked.
        </p>
      </InfoBox>

      <h2>Try-Catch-Finally</h2>
      <p>
        The basic exception handling mechanism uses <code>try</code>, <code>catch</code>, and
        optionally <code>finally</code> blocks:
      </p>

      <CodeBlock language="java" title="TryCatchExample.java">
{`import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

public class TryCatchExample {
    public static void main(String[] args) {
        // Basic try-catch
        try {
            int result = 10 / 0;
            System.out.println("Result: " + result); // never reached
        } catch (ArithmeticException e) {
            System.out.println("Error: " + e.getMessage());
        }

        // Multiple catch blocks (order matters — most specific first)
        try {
            int[] numbers = {1, 2, 3};
            System.out.println(numbers[5]);
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Array index error: " + e.getMessage());
        } catch (RuntimeException e) {
            System.out.println("Runtime error: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("General error: " + e.getMessage());
        }

        // Multi-catch (Java 7+): catching multiple exception types in one block
        try {
            String text = null;
            text.length(); // throws NullPointerException
        } catch (NullPointerException | IllegalArgumentException e) {
            System.out.println("Caught: " + e.getClass().getSimpleName());
        }

        // Try-catch-finally
        Scanner scanner = null;
        try {
            scanner = new Scanner(new File("data.txt"));
            String line = scanner.nextLine();
            System.out.println("Read: " + line);
        } catch (FileNotFoundException e) {
            System.out.println("File not found: " + e.getMessage());
        } finally {
            // Always executes, whether exception occurred or not
            if (scanner != null) {
                scanner.close();
                System.out.println("Scanner closed in finally block.");
            }
        }
    }
}`}
      </CodeBlock>

      <h2>Try-With-Resources</h2>
      <p>
        Java 7 introduced try-with-resources, which automatically closes resources that implement
        the <code>AutoCloseable</code> interface. This eliminates the need for explicit{' '}
        <code>finally</code> blocks for resource cleanup and prevents resource leak bugs.
      </p>

      <CodeBlock language="java" title="TryWithResources.java">
{`import java.io.*;

public class TryWithResources {
    public static void main(String[] args) {
        // Try-with-resources: resources are automatically closed
        try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (FileNotFoundException e) {
            System.out.println("File not found: " + e.getMessage());
        } catch (IOException e) {
            System.out.println("Error reading file: " + e.getMessage());
        }
        // reader is automatically closed here, even if an exception occurs

        // Multiple resources
        try (
            FileInputStream input = new FileInputStream("source.txt");
            FileOutputStream output = new FileOutputStream("dest.txt")
        ) {
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = input.read(buffer)) != -1) {
                output.write(buffer, 0, bytesRead);
            }
            System.out.println("File copied successfully.");
        } catch (IOException e) {
            System.out.println("I/O error: " + e.getMessage());
        }
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Always Prefer Try-With-Resources">
        <p>
          Whenever you work with resources that need to be closed (files, database connections,
          network sockets), use try-with-resources instead of manual <code>finally</code> blocks.
          It is shorter, clearer, and eliminates a whole category of resource leak bugs. Any class
          that implements <code>AutoCloseable</code> or <code>Closeable</code> can be used with
          this pattern.
        </p>
      </InfoBox>

      <h3>Suppressed Exceptions</h3>
      <p>
        Try-with-resources solves a subtle problem the manual <code>finally</code> version gets
        wrong. If the body throws <em>and</em> <code>close()</code> also throws, the manual version
        loses the original exception — the one from <code>finally</code> wins and the real cause
        vanishes. Try-with-resources keeps the body&apos;s exception as primary and attaches the
        close failure as a <strong>suppressed</strong> exception.
      </p>

      <CodeBlock language="java" title="SuppressedExceptions.java">
{`try (var connection = openConnection()) {
    connection.execute(query);      // throws QueryException
}                                   // close() then throws IOException
catch (Exception e) {
    // e is the QueryException — the one you actually care about.
    log.error("query failed", e);

    // The close() failure is not lost, just demoted.
    for (Throwable suppressed : e.getSuppressed()) {
        log.warn("also failed while closing", suppressed);
    }
}

// Resources close in REVERSE declaration order — like nested try blocks.
try (var in = Files.newInputStream(src);
     var out = Files.newOutputStream(dst)) {
    in.transferTo(out);
}   // out.close() runs first, then in.close()

// Java 9+: an effectively-final resource declared outside can be used directly.
var reader = new BufferedReader(new FileReader("data.txt"));
try (reader) {
    reader.lines().forEach(System.out::println);
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Never return from a finally block">
        <p>
          A <code>return</code>, <code>break</code>, or <code>continue</code> inside{' '}
          <code>finally</code> <em>discards</em> any exception that was propagating — the method
          returns normally and the error disappears with no trace. Many static analysers flag this
          precisely because it silently destroys evidence. Keep <code>finally</code> blocks to
          cleanup only, or better, replace them with try-with-resources.
        </p>
      </InfoBox>

      <h2>Fail Fast: Validating Preconditions</h2>
      <p>
        The cheapest exception to debug is the one thrown at the boundary where bad data entered,
        not fifteen frames later when something dereferences it. Java 14 also made the most common
        failure dramatically easier to read.
      </p>

      <CodeBlock language="java" title="Preconditions.java">
{`import static java.util.Objects.requireNonNull;

public class OrderService {
    private final OrderRepository repository;

    public OrderService(OrderRepository repository) {
        // Fails at construction with a named message, not at first use with a bare NPE.
        this.repository = requireNonNull(repository, "repository must not be null");
    }

    public Order place(String customerId, int quantity) {
        requireNonNull(customerId, "customerId");
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive, was " + quantity);
        }
        ...
    }
}

// Choosing the right unchecked exception says what went wrong:
//   IllegalArgumentException  — a parameter's VALUE is unacceptable
//   NullPointerException      — a parameter was null (requireNonNull throws this)
//   IllegalStateException     — the OBJECT is in the wrong state for this call
//   UnsupportedOperationException — this operation is not implemented here

// Range checks with meaningful messages, no hand-rolled ifs:
Objects.checkIndex(i, list.size());
Objects.requireNonNullElse(value, fallback);
Objects.requireNonNullElseGet(value, this::computeFallback);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Helpful NullPointerException messages (Java 14+)">
        <p>
          The old <code>NullPointerException</code> told you the line but not <em>which</em> thing
          on it was null — agony on a line like{' '}
          <code>a.getB().getC().getD()</code>. Since Java 14, and enabled by default since Java 15,
          the JVM reconstructs the exact expression:
        </p>
        <p>
          <code>
            Cannot invoke &quot;C.getD()&quot; because the return value of &quot;B.getC()&quot; is
            null
          </code>
        </p>
        <p>
          If you are on an older JVM or see the message missing, enable it explicitly with{' '}
          <code>-XX:+ShowCodeDetailsInExceptionMessages</code>. This one flag removes most of the
          reason people used to write defensive null checks purely for diagnosability.
        </p>
      </InfoBox>

      <h2>Throwing Exceptions and Custom Exceptions</h2>

      <CodeBlock language="java" title="CustomExceptions.java">
{`// Custom checked exception
public class InsufficientFundsException extends Exception {
    private final double amount;
    private final double balance;

    public InsufficientFundsException(double amount, double balance) {
        super("Cannot withdraw $" + amount + " — balance is only $" + balance);
        this.amount = amount;
        this.balance = balance;
    }

    public double getAmount() { return amount; }
    public double getBalance() { return balance; }
}

// Custom unchecked exception
public class InvalidAccountException extends RuntimeException {
    public InvalidAccountException(String accountId) {
        super("Account not found: " + accountId);
    }
}

// Using custom exceptions
public class BankAccount {
    private String id;
    private double balance;

    public BankAccount(String id, double initialBalance) {
        if (initialBalance < 0) {
            throw new IllegalArgumentException("Initial balance cannot be negative");
        }
        this.id = id;
        this.balance = initialBalance;
    }

    public void withdraw(double amount) throws InsufficientFundsException {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (amount > balance) {
            throw new InsufficientFundsException(amount, balance);
        }
        balance -= amount;
    }

    public double getBalance() { return balance; }
}

// Client code
public class BankDemo {
    public static void main(String[] args) {
        BankAccount account = new BankAccount("ACC-001", 100.0);

        try {
            account.withdraw(50.0);
            System.out.println("Withdrew $50. Balance: $" + account.getBalance());

            account.withdraw(75.0); // this will throw
        } catch (InsufficientFundsException e) {
            System.out.println("Transaction failed: " + e.getMessage());
            System.out.println("Tried: $" + e.getAmount());
            System.out.println("Available: $" + e.getBalance());
        }
    }
}`}
      </CodeBlock>

      <h2>Best Practices</h2>

      <CodeBlock language="java" title="ExceptionBestPractices.java">
{`public class ExceptionBestPractices {

    // 1. Be specific — catch the most specific exception type
    public void goodCatching() {
        try {
            // risky operation
        } catch (FileNotFoundException e) {
            // handle specific case
        } catch (IOException e) {
            // handle broader I/O case
        }
        // AVOID: catch (Exception e) — too broad
    }

    // 2. Don't swallow exceptions silently
    public void badPractice() {
        try {
            // risky operation
        } catch (Exception e) {
            // BAD: empty catch block — you lose all error information
        }
    }

    // 3. Log or rethrow — don't do both
    public void goodPractice() throws ServiceException {
        try {
            // risky operation
        } catch (IOException e) {
            throw new ServiceException("Failed to process data", e);
        }
    }

    // 4. Use exception chaining to preserve the original cause
    public void chainedException() {
        try {
            // database operation
        } catch (SQLException e) {
            throw new DataAccessException("Query failed", e);
        }
    }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never Catch and Ignore">
        <p>
          An empty <code>catch</code> block is one of the worst anti-patterns in Java. It
          silently swallows errors, making bugs extremely hard to diagnose. At minimum, log the
          exception. Better yet, handle it appropriately or rethrow it wrapped in a more
          meaningful exception with context about what operation failed.
        </p>
      </InfoBox>

      <h2>Checked Exceptions and Lambdas</h2>
      <p>
        This is the single most common friction point in modern Java, and you will hit it the
        moment you combine the Stream API with I/O. The built-in functional interfaces
        (<code>Function</code>, <code>Supplier</code>, <code>Consumer</code>) declare no{' '}
        <code>throws</code> clause, so a lambda body simply <em>cannot</em> throw a checked
        exception.
      </p>

      <CodeBlock language="java" title="CheckedExceptionsInLambdas.java">
{`// DOES NOT COMPILE — Files.readString throws IOException, but
// Function.apply declares no checked exceptions.
List<String> contents = paths.stream()
    .map(p -> Files.readString(p))
    .toList();

// Option 1 (usually best): wrap into an unchecked exception at the boundary.
List<String> contents = paths.stream()
    .map(p -> {
        try {
            return Files.readString(p);
        } catch (IOException e) {
            throw new UncheckedIOException(e);   // purpose-built JDK wrapper
        }
    })
    .toList();

// Option 2: extract a helper so the pipeline stays readable.
private String readOrThrow(Path p) {
    try {
        return Files.readString(p);
    } catch (IOException e) {
        throw new UncheckedIOException("could not read " + p, e);
    }
}
List<String> contents = paths.stream().map(this::readOrThrow).toList();

// Option 3: a reusable "throwing function" adapter.
@FunctionalInterface
interface ThrowingFunction<T, R> {
    R apply(T t) throws Exception;
}

static <T, R> Function<T, R> unchecked(ThrowingFunction<T, R> f) {
    return t -> {
        try {
            return f.apply(t);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    };
}
List<String> contents = paths.stream().map(unchecked(Files::readString)).toList();

// Option 4: don't use a stream. A plain for loop can declare 'throws IOException'
// and is often the clearest answer when every element can genuinely fail.`}
      </CodeBlock>

      <InfoBox variant="note" title="The industry has moved toward unchecked">
        <p>
          Checked exceptions were designed so callers could not ignore recoverable failures. In
          practice they compose badly — with lambdas, with generics, and across layer boundaries
          where the caller has no ability to recover and just rethrows. Most modern frameworks
          reflect this: Spring wraps every <code>SQLException</code> in its unchecked{' '}
          <code>DataAccessException</code> hierarchy, JPA throws unchecked{' '}
          <code>PersistenceException</code>, and the JDK itself added{' '}
          <code>UncheckedIOException</code>.
        </p>
        <p>
          A workable modern default: use <strong>unchecked</strong> exceptions for your own domain
          errors, make them carry enough context to act on (an error code, the offending id), and
          handle them centrally at the boundary — which for a web service means a single{' '}
          <code>@ControllerAdvice</code>, covered in the Spring Boot error-handling lesson.
        </p>
      </InfoBox>

      <h2>Performance and Anti-Patterns</h2>
      <InfoBox variant="danger" title="Never use exceptions for control flow">
        <p>
          Constructing an exception captures the entire call stack, which is the expensive part —
          often 100x the cost of a simple conditional. Using exceptions for expected outcomes
          (&quot;not found&quot;, &quot;end of input&quot;, &quot;validation failed on a form&quot;)
          is both slow and misleading to the next reader. Return an{' '}
          <code>Optional</code>, a result object, or a boolean instead, and reserve exceptions for
          the genuinely exceptional.
        </p>
        <p>
          Other traps worth naming: catching <code>Throwable</code> or <code>Error</code> (you
          cannot meaningfully recover from <code>OutOfMemoryError</code>, and catching it hides
          it); catching an exception only to <code>e.printStackTrace()</code> (goes to stderr,
          invisible in structured logging); logging <em>and</em> rethrowing the same exception
          (produces duplicate stack traces in the log for one failure); and losing the cause by
          writing <code>throw new ServiceException(e.getMessage())</code> instead of{' '}
          <code>throw new ServiceException(&quot;context&quot;, e)</code>.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="What happens if a checked exception is thrown inside a method but not caught or declared in the method signature?"
        options={[
          "The program handles it automatically at runtime",
          "The JVM catches it and logs a warning",
          "The code does not compile",
          "The exception is silently ignored"
        ]}
        correctIndex={2}
        explanation="Checked exceptions MUST be either caught with a try-catch block or declared in the method signature using the 'throws' keyword. If you do neither, the Java compiler produces an error. This is the key difference between checked and unchecked exceptions — the compiler enforces handling of checked exceptions."
      />
    </LessonLayout>
  );
}

export default Exceptions;
