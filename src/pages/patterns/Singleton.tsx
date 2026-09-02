import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Singleton() {
  return (
    <LessonLayout
      title="Singleton & Factory Patterns"
      sectionId="patterns"
      lessonIndex={1}
      prev={{ path: '/patterns/intro', label: 'Patterns Overview' }}
      next={{ path: '/patterns/abstract-factory', label: 'Abstract Factory' }}
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
      <p>
        The JVM and CPU are normally free to reorder independent instructions for performance —
        the constructor&apos;s field writes and the assignment of <code>instance</code> are two
        separate steps that could otherwise complete out of order. <code>volatile</code> forbids
        that reordering specifically around this write, which is what establishes a{' '}
        <strong>happens-before relationship</strong>: everything written before the volatile
        write (here, the fully-constructed object) is guaranteed visible to any thread that reads
        <code> instance</code> after.
      </p>
      <CodeBlock language="java" title="Lazy Singleton with Double-Checked Locking" showLineNumbers={true}>
{`public class LazySingleton {
    // volatile prevents instruction reordering: without it, another thread
    // could see a non-null 'instance' whose constructor hasn't finished yet
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

      <InfoBox variant="tip" title="When to Reach for Singleton">
        Reach for Singleton when a resource is genuinely expensive to create and must be
        coordinated across the whole process — a HikariCP connection pool, a thread pool, or an
        in-memory cache of reference data loaded once at startup. The test: would creating a
        second instance be wasteful or actively wrong (e.g. two connection pools fighting over
        the same DB max-connections limit)? If yes, Singleton fits. If you're just trying to avoid
        passing a dependency around, that's not a Singleton problem — it's a dependency injection
        problem, and Spring's default singleton-scoped beans already solve it without any of the
        hand-rolled thread-safety code above.
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

      <InfoBox variant="warning" title="First: &quot;Simple Factory&quot; Is Not the Factory Method Pattern">
        <p>
          This trips up a lot of people, and interviewers ask it deliberately. The thing most
          codebases call &quot;the factory&quot; — one static method with a switch that returns a
          concrete type — is <strong>Simple Factory</strong>, an idiom that does not appear in the GoF
          book at all. It is useful and you should know it, but it is not Factory Method.
        </p>
        <p>
          <strong>Factory Method</strong> (the actual GoF pattern, shown in the diagram above) puts the
          creation step in an <em>overridable method on a Creator class</em>. Subclasses decide what to
          instantiate, and the base class&apos;s algorithm calls that method without knowing the answer.
          The decision moves to <em>which subclass you are</em>, not to a switch statement.
        </p>
        <p>
          Both are below, in that order, so you can see the difference.
        </p>
      </InfoBox>

      <h4>Simple Factory (the common idiom)</h4>

      <CodeBlock language="java" title="Simple Factory - Notification System" showLineNumbers={true}>
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

// Simple Factory: ONE class centralising the switch.
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
notif.send("user@example.com", "Your order shipped!");

// NOTE: adding a channel means EDITING this switch, so Simple Factory
// does not satisfy the Open/Closed Principle. What it does buy you is
// a single place where that decision lives, instead of the same
// if/else copy-pasted across twenty call sites. That is often enough.`}
      </CodeBlock>

      <h4>Factory Method (the GoF pattern)</h4>

      <CodeBlock language="java" title="Factory Method - Subclass Decides the Product" showLineNumbers={true}>
{`// The Creator defines the ALGORITHM and leaves a hole for the product.
public abstract class NotificationDispatcher {

    // The factory method: subclasses fill this in.
    protected abstract Notification createNotification();

    // Template of shared behaviour. Note it never names a concrete
    // product — that is the whole point.
    public final void dispatch(String recipient, String message) {
        Notification notification = createNotification();
        auditLog.record("dispatching via " + notification.getClass());
        notification.send(recipient, message);
        metrics.increment("notifications.sent");
    }
}

// Each ConcreteCreator answers the question one way.
public class EmailDispatcher extends NotificationDispatcher {
    @Override
    protected Notification createNotification() {
        return new EmailNotification(smtpConfig);
    }
}

public class SmsDispatcher extends NotificationDispatcher {
    @Override
    protected Notification createNotification() {
        return new SmsNotification(twilioClient);
    }
}

// Adding a push channel = adding ONE new subclass.
// No existing file is edited — this version IS open/closed.
public class PushDispatcher extends NotificationDispatcher {
    @Override
    protected Notification createNotification() {
        return new PushNotification(firebaseClient);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Choosing Between Them">
        <p>
          <strong>Simple Factory</strong> is the right default. Use it the moment a plain constructor
          call would need an if/else or a switch to pick a concrete class — especially when the choice
          is driven by runtime data (a channel string from a request, a feature flag, a plugin name in
          a config file). Centralising that switch in one place is a genuine win even though it is not
          a GoF pattern.
        </p>
        <p>
          <strong>Factory Method</strong> earns its extra ceremony only when there is <em>shared
          surrounding algorithm</em> that varies solely in which object it works with — the{' '}
          <code>dispatch()</code> method above. If you would end up with subclasses whose only content
          is a one-line <code>create()</code> override and nothing else, you have written a more
          verbose Simple Factory.
        </p>
        <p>
          <strong>In Spring,</strong> both are frequently displaced entirely: inject a{' '}
          <code>Map&lt;String, Notification&gt;</code> and Spring populates it with every bean keyed by
          name, or inject a <code>List</code> and select with a <code>supports()</code> predicate as in
          the Strategy lesson. If there is only ever one implementation, skip all of this —{' '}
          <code>new SimpleGreeter()</code> is not a smell, it is just object creation.
        </p>
      </InfoBox>

      <h3>The Third One: Abstract Factory</h3>
      <InfoBox variant="note" title="Covered in Full in the Next Lesson">
        <p>
          There is a third member of this family, and it is the one interviewers use to separate
          people who memorised pattern names from people who have used them.{' '}
          <strong>Abstract Factory</strong> creates <em>families</em> of related objects that have
          to stay consistent with each other — a Material button must always pair with a Material
          text field, never a Cupertino one; a Postgres query builder must never be paired with a
          SQL Server paginator.
        </p>
        <p>
          The short version of the distinction: both patterns above deal with <em>one</em> product
          type. Factory Method varies it by subclassing the creator. Abstract Factory varies an
          entire <em>set</em> of products at once, by which factory object you hold — composition,
          not inheritance.
        </p>
        <p>
          It gets its own lesson because that distinction, the family constraint, and the way
          Spring&apos;s <code>@Configuration</code> classes quietly replace the hand-rolled
          version all need room:{' '}
          <a href="/patterns/abstract-factory">Abstract Factory Pattern →</a>
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="When to Avoid Singleton">
        Singletons make unit testing difficult (global state), hide dependencies, and
        violate the Single Responsibility Principle. In modern Java, prefer dependency injection
        (Spring @Component with default singleton scope) over hand-rolled Singletons.
      </InfoBox>

    </LessonLayout>
  );
}
