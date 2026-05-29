import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Singleton() {
  return (
    <LessonLayout
      title="Singleton & Factory Patterns"
      sectionId="patterns"
      lessonIndex={1}
      prev={{ path: '/patterns/intro', label: 'Patterns Overview' }}
      next={{ path: '/patterns/strategy', label: 'Strategy & Observer' }}
    >
      <h2>Singleton Pattern</h2>
      <p>
        Ensures a class has exactly one instance and provides a global point of access to it.
        Common use cases: connection pools, thread pools, caches, configuration objects, and loggers.
      </p>

      <FlowChart
        title="Singleton Pattern Structure"
        chart={"graph TD\n  A[Client A] --> S[Singleton Instance]\n  B[Client B] --> S\n  C[Client C] --> S\n  S --> D[\"- instance: Singleton\\n- Singleton()\\n+ getInstance(): Singleton\"]"}
      />

      <h3>Eager Initialization</h3>
      <CodeBlock language="java" title="Eager Singleton (Thread-Safe)" showLineNumbers={true}>
{`public class EagerSingleton {
    // Instance created at class loading time - guaranteed thread-safe
    private static final EagerSingleton INSTANCE = new EagerSingleton();

    private EagerSingleton() {
        // Prevent reflection-based instantiation
        if (INSTANCE != null) {
            throw new IllegalStateException("Already initialized");
        }
    }

    public static EagerSingleton getInstance() {
        return INSTANCE;
    }
}`}
      </CodeBlock>

      <h3>Double-Checked Locking</h3>
      <CodeBlock language="java" title="Lazy Singleton with Double-Checked Locking" showLineNumbers={true}>
{`public class LazySingleton {
    // volatile prevents instruction reordering issues
    private static volatile LazySingleton instance;

    private LazySingleton() {}

    public static LazySingleton getInstance() {
        if (instance == null) {                 // First check (no lock)
            synchronized (LazySingleton.class) {
                if (instance == null) {         // Second check (with lock)
                    instance = new LazySingleton();
                }
            }
        }
        return instance;
    }
}`}
      </CodeBlock>

      <h3>Enum Singleton (Recommended)</h3>
      <CodeBlock language="java" title="Enum Singleton - Joshua Bloch's Recommendation" showLineNumbers={true}>
{`// Effective Java Item 3: "A single-element enum is the best way
// to implement a singleton"
public enum DatabasePool {
    INSTANCE;

    private final HikariDataSource dataSource;

    DatabasePool() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://localhost:5432/mydb");
        config.setMaximumPoolSize(10);
        this.dataSource = new HikariDataSource(config);
    }

    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
}

// Usage:
Connection conn = DatabasePool.INSTANCE.getConnection();`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why Enum Singleton is Best">
        Enum singletons are inherently thread-safe, prevent reflection attacks, handle
        serialization automatically, and are concise. The JVM guarantees exactly one instance.
        This is the approach recommended by Joshua Bloch in Effective Java.
      </InfoBox>

      <h2>Factory Method Pattern</h2>
      <p>
        Defines an interface for creating objects but lets subclasses decide which class to instantiate.
        It promotes loose coupling by eliminating the need to bind application-specific classes into your code.
      </p>

      <FlowChart
        title="Factory Method Pattern Structure"
        chart={"graph TD\n  A[Client] --> B[Creator]\n  B --> C[ConcreteCreatorA]\n  B --> D[ConcreteCreatorB]\n  C --> E[ProductA]\n  D --> F[ProductB]\n  E --> G[Product Interface]\n  F --> G"}
      />

      <CodeBlock language="java" title="Factory Method - Notification System" showLineNumbers={true}>
{`// Product interface
public interface Notification {
    void send(String recipient, String message);
}

// Concrete products
public class EmailNotification implements Notification {
    public void send(String recipient, String message) {
        System.out.println("Email to " + recipient + ": " + message);
    }
}

public class SmsNotification implements Notification {
    public void send(String recipient, String message) {
        System.out.println("SMS to " + recipient + ": " + message);
    }
}

public class PushNotification implements Notification {
    public void send(String recipient, String message) {
        System.out.println("Push to " + recipient + ": " + message);
    }
}

// Factory
public class NotificationFactory {
    public static Notification create(String channel) {
        return switch (channel.toUpperCase()) {
            case "EMAIL" -> new EmailNotification();
            case "SMS"   -> new SmsNotification();
            case "PUSH"  -> new PushNotification();
            default -> throw new IllegalArgumentException(
                "Unknown channel: " + channel);
        };
    }
}

// Usage
Notification notif = NotificationFactory.create("EMAIL");
notif.send("user@example.com", "Your order shipped!");`}
      </CodeBlock>

      <h3>Abstract Factory</h3>
      <CodeBlock language="java" title="Abstract Factory - Cross-Platform UI" showLineNumbers={true}>
{`// Abstract products
public interface Button { void render(); }
public interface TextField { void render(); }

// Abstract factory
public interface UIFactory {
    Button createButton();
    TextField createTextField();
}

// Concrete factory: Material Design
public class MaterialUIFactory implements UIFactory {
    public Button createButton() { return new MaterialButton(); }
    public TextField createTextField() { return new MaterialTextField(); }
}

// Concrete factory: iOS style
public class CupertinoUIFactory implements UIFactory {
    public Button createButton() { return new CupertinoButton(); }
    public TextField createTextField() { return new CupertinoTextField(); }
}

// Client code - works with ANY factory
public class LoginForm {
    private final Button submitBtn;
    private final TextField emailField;

    public LoginForm(UIFactory factory) {
        this.submitBtn = factory.createButton();
        this.emailField = factory.createTextField();
    }

    public void render() {
        emailField.render();
        submitBtn.render();
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="When to Avoid Singleton">
        Singletons make unit testing difficult (global state), hide dependencies, and
        violate the Single Responsibility Principle. In modern Java, prefer dependency injection
        (Spring @Component with default singleton scope) over hand-rolled Singletons.
      </InfoBox>

      <InteractiveChallenge
        question="What problem does the 'volatile' keyword solve in the double-checked locking singleton?"
        options={[
          "It makes the variable thread-local",
          "It prevents instruction reordering that could expose a partially constructed object",
          "It locks the variable so only one thread can read it at a time",
          "It forces the variable to be stored on the heap instead of the stack"
        ]}
        correctIndex={1}
        explanation="Without volatile, the JVM may reorder instructions such that the reference is assigned before the constructor completes. Another thread could then see a non-null but partially constructed instance. The volatile keyword establishes a happens-before relationship preventing this reordering."
      />
    </LessonLayout>
  );
}
