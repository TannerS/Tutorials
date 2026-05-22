import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function PatternsSingleton() {
  return (
    <LessonLayout
      title="Singleton Pattern"
      sectionId="patterns"
      lessonIndex={1}
      prev={{ path: "/patterns/intro", label: "Patterns Overview" }}
      next={{ path: "/patterns/strategy", label: "Strategy Pattern" }}
    >
      <p>The Singleton pattern ensures a class has exactly one instance and provides a global access point to it. It is used for resources that should be shared — configuration registries, connection pools, loggers, and caches — where multiple instances would cause bugs or waste resources.</p>

      <h2>Basic Singleton</h2>

      <CodeBlock language="java" title="Classic Singleton (not thread-safe)">
{`public class Config {
    private static Config instance;  // the single instance

    private final Map<String, String> props;

    // Private constructor prevents external instantiation
    private Config() {
        props = new HashMap<>();
        props.put("db.url", "jdbc:postgresql://localhost/mydb");
        props.put("app.name", "MyApp");
    }

    // Global access point
    public static Config getInstance() {
        if (instance == null) {
            instance = new Config();  // lazy initialization
        }
        return instance;
    }

    public String get(String key) { return props.get(key); }
}

// Usage
String url = Config.getInstance().get("db.url");`}
      </CodeBlock>

      <InfoBox variant="warning" title="Thread Safety">
        <p>The basic singleton is NOT thread-safe. Two threads could both see <code>instance == null</code> simultaneously and create two instances. Always use a thread-safe variant in multi-threaded applications.</p>
      </InfoBox>

      <h2>Thread-Safe Singleton Variants</h2>

      <CodeBlock language="java" title="Thread-Safe Singleton Options">
{`// Option 1: Eager initialization (simple, always creates instance)
public class EagerSingleton {
    private static final EagerSingleton INSTANCE = new EagerSingleton();
    private EagerSingleton() {}
    public static EagerSingleton getInstance() { return INSTANCE; }
}

// Option 2: Synchronized method (safe but slow — syncs on every call)
public class SyncSingleton {
    private static SyncSingleton instance;
    private SyncSingleton() {}
    public static synchronized SyncSingleton getInstance() {
        if (instance == null) instance = new SyncSingleton();
        return instance;
    }
}

// Option 3: Double-checked locking (fast after initialization)
public class DCLSingleton {
    private static volatile DCLSingleton instance;  // volatile is crucial!
    private DCLSingleton() {}
    public static DCLSingleton getInstance() {
        if (instance == null) {                      // first check (no sync)
            synchronized (DCLSingleton.class) {
                if (instance == null) {              // second check (with sync)
                    instance = new DCLSingleton();
                }
            }
        }
        return instance;
    }
}

// Option 4: Initialization-on-demand (best — lazy, thread-safe, no sync overhead)
public class HolderSingleton {
    private HolderSingleton() {}
    private static class Holder {
        static final HolderSingleton INSTANCE = new HolderSingleton();
    }
    public static HolderSingleton getInstance() { return Holder.INSTANCE; }
}

// Option 5: Enum singleton (Josh Bloch recommendation — handles serialization too)
public enum EnumSingleton {
    INSTANCE;
    public void doWork() { /* ... */ }
}`}
      </CodeBlock>

      <FlowChart
        title="Singleton Initialization Flow"
        chart={"graph TD\n  A[getInstance called] --> B{instance == null?}\n  B -- No --> C[Return existing instance]\n  B -- Yes --> D[Acquire lock]\n  D --> E{Still null?}\n  E -- No --> F[Release lock]\n  F --> C\n  E -- Yes --> G[Create instance]\n  G --> H[Release lock]\n  H --> C"}
      />

      <h2>Real-World Singleton: Connection Pool</h2>

      <CodeBlock language="java" title="Database Connection Pool Singleton">
{`public class ConnectionPool {
    private static volatile ConnectionPool instance;
    private final BlockingQueue<Connection> pool;
    private final int MAX_SIZE = 10;

    private ConnectionPool() {
        pool = new LinkedBlockingQueue<>(MAX_SIZE);
        for (int i = 0; i < MAX_SIZE; i++) {
            pool.offer(createConnection());
        }
    }

    public static ConnectionPool getInstance() {
        if (instance == null) {
            synchronized (ConnectionPool.class) {
                if (instance == null) {
                    instance = new ConnectionPool();
                }
            }
        }
        return instance;
    }

    public Connection acquire() throws InterruptedException {
        return pool.take();   // blocks if none available
    }

    public void release(Connection conn) {
        pool.offer(conn);
    }

    private Connection createConnection() {
        return DriverManager.getConnection("jdbc:postgresql://localhost/db",
                                           "user", "pass");
    }
}

// Usage — everyone shares the same pool
Connection conn = ConnectionPool.getInstance().acquire();
try {
    // use connection
} finally {
    ConnectionPool.getInstance().release(conn);
}`}
      </CodeBlock>

      <h2>Singleton in Spring</h2>
      <p>Spring beans are Singleton-scoped by default — Spring manages exactly one instance per ApplicationContext. This is why constructor injection is preferred over field injection: it makes the dependency explicit and enables testing without the Spring container.</p>

      <CodeBlock language="java" title="Spring Singleton Bean">
{`@Service  // @Scope("singleton") is implicit
public class CacheService {
    private final Map<String, Object> cache = new ConcurrentHashMap<>();

    public void put(String key, Object value) { cache.put(key, value); }
    public Object get(String key) { return cache.get(key); }
    public void evict(String key) { cache.remove(key); }
}

// Only ONE CacheService instance in the entire application context
// All components that inject it get the SAME object
@RestController
public class ProductController {
    private final CacheService cache;  // same instance as in OrderService
    public ProductController(CacheService cache) { this.cache = cache; }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Singleton vs Static">
        <p>A Singleton is not the same as a static class. Singletons can implement interfaces, be injected, be mocked in tests, and support lazy initialization. Static classes cannot be easily tested, extended, or replaced. Prefer Singleton (especially via Spring DI) over static utility classes for shared state.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Why is the volatile keyword required for the double-checked locking singleton?"
        options={["To make the field thread-local", "To prevent CPU caching of the instance reference across threads", "To make the assignment atomic", "To enable garbage collection"]}
        correctIndex={1}
        explanation="Without volatile, the JVM or CPU may reorder instructions, causing a thread to see a partially constructed object. volatile ensures that the write to 'instance' is visible to all threads immediately and that the constructor completes before the reference is published."
      />

    </LessonLayout>
  );
}
