import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function PatternsProxy() {
  return (
    <LessonLayout
      title="Proxy Pattern"
      sectionId="patterns"
      lessonIndex={6}
      prev={{ path: "/patterns/composite", label: "Composite Pattern" }}
      next={{ path: "/patterns/realworld", label: "Real-World Patterns" }}
    >
      <p>The Proxy pattern provides a surrogate or placeholder for another object to control access to it. The proxy implements the same interface as the real object, so clients can't tell the difference. Proxies add a layer of indirection for lazy initialization, access control, logging, caching, or remote communication.</p>

      <h2>Proxy Types</h2>

      <CodeBlock language="java" title="Virtual Proxy — Lazy Loading">
{`// Real object — expensive to create
public class HeavyReport {
    private final byte[] data;

    public HeavyReport(String reportId) {
        // Simulate expensive operation: DB query, PDF generation, etc.
        System.out.println("Loading report " + reportId + "...");
        this.data = loadFromDatabase(reportId);  // expensive!
    }
    public byte[] getData() { return data; }
}

// Proxy — same interface, defers creation until needed
public interface Report { byte[] getData(); }

public class LazyReportProxy implements Report {
    private final String reportId;
    private HeavyReport realReport;  // null until first access

    public LazyReportProxy(String reportId) {
        this.reportId = reportId;
        System.out.println("Proxy created for " + reportId + " (no load yet)");
    }

    public byte[] getData() {
        if (realReport == null) {
            realReport = new HeavyReport(reportId);  // load on first access only
        }
        return realReport.getData();
    }
}

// Client creates many reports cheaply, only loads what's actually accessed
List<Report> reports = List.of(
    new LazyReportProxy("Q1-2024"),  // not loaded
    new LazyReportProxy("Q2-2024"),  // not loaded
    new LazyReportProxy("Q3-2024")   // not loaded
);
byte[] data = reports.get(0).getData();  // Q1 loaded here, Q2/Q3 never loaded`}
      </CodeBlock>

      <CodeBlock language="java" title="Protection Proxy — Access Control">
{`public interface DocumentService {
    String getDocument(String docId);
    void updateDocument(String docId, String content);
    void deleteDocument(String docId);
}

public class RealDocumentService implements DocumentService {
    public String getDocument(String id)              { return "content of " + id; }
    public void updateDocument(String id, String c)   { System.out.println("Updated " + id); }
    public void deleteDocument(String id)             { System.out.println("Deleted " + id); }
}

// Proxy enforces authorization
public class SecureDocumentProxy implements DocumentService {
    private final DocumentService real;
    private final User currentUser;

    public SecureDocumentProxy(DocumentService real, User user) {
        this.real = real; this.currentUser = user;
    }

    public String getDocument(String id) {
        if (!currentUser.hasPermission("READ", id)) throw new AccessDeniedException();
        return real.getDocument(id);
    }
    public void updateDocument(String id, String content) {
        if (!currentUser.hasPermission("WRITE", id)) throw new AccessDeniedException();
        real.updateDocument(id, content);
    }
    public void deleteDocument(String id) {
        if (!currentUser.hasRole("ADMIN")) throw new AccessDeniedException();
        real.deleteDocument(id);
    }
}`}
      </CodeBlock>

      <FlowChart
        title="Proxy Pattern Flow"
        chart={"graph LR\n  A[Client] --> B[Proxy]\n  B --> C{Access Check}\n  C -- Allowed --> D[Real Subject]\n  C -- Denied --> E[Exception]\n  D --> F[Result]\n  F --> B\n  B --> A"}
      />

      <h2>Caching Proxy</h2>

      <CodeBlock language="java" title="Caching Proxy with Expiry">
{`public class CachingUserRepository implements UserRepository {
    private final UserRepository real;
    private final Map<Long, CacheEntry> cache = new ConcurrentHashMap<>();
    private final Duration ttl;

    public CachingUserRepository(UserRepository real, Duration ttl) {
        this.real = real; this.ttl = ttl;
    }

    public User findById(long id) {
        CacheEntry entry = cache.get(id);
        if (entry != null && !entry.isExpired()) {
            System.out.println("Cache HIT for user " + id);
            return entry.user;
        }
        System.out.println("Cache MISS for user " + id);
        User user = real.findById(id);
        cache.put(id, new CacheEntry(user, Instant.now().plus(ttl)));
        return user;
    }

    public void save(User user) {
        real.save(user);
        cache.remove(user.getId()); // invalidate on write
    }

    private record CacheEntry(User user, Instant expiresAt) {
        boolean isExpired() { return Instant.now().isAfter(expiresAt); }
    }
}`}
      </CodeBlock>

      <h2>Java Dynamic Proxy</h2>

      <CodeBlock language="java" title="Java Reflection — Dynamic Proxy">
{`// Java can create proxies at runtime without writing a class
import java.lang.reflect.*;

// Create a logging proxy for ANY interface
public class LoggingProxyFactory {
    @SuppressWarnings("unchecked")
    public static <T> T wrap(T target, Class<T> iface) {
        return (T) Proxy.newProxyInstance(
            iface.getClassLoader(),
            new Class[]{ iface },
            (proxy, method, args) -> {
                System.out.printf("→ %s(%s)%n", method.getName(),
                    args == null ? "" : Arrays.toString(args));
                long start = System.nanoTime();
                Object result = method.invoke(target, args);
                long ms = (System.nanoTime() - start) / 1_000_000;
                System.out.printf("← %s returned in %dms%n", method.getName(), ms);
                return result;
            }
        );
    }
}

// Usage
UserRepository logged = LoggingProxyFactory.wrap(
    new JpaUserRepository(), UserRepository.class);
User u = logged.findById(42);  // prints method entry/exit with timing`}
      </CodeBlock>

      <InfoBox variant="tip" title="Spring AOP is Proxy">
        <p>Spring's @Transactional, @Cacheable, @Async, and security annotations all work through the Proxy pattern (JDK dynamic proxies or CGLIB). When Spring creates a bean with these annotations, it wraps the bean in a proxy that intercepts method calls to add the cross-cutting behavior before/after delegating to the real method.</p>
      </InfoBox>

      <InteractiveChallenge
        question="How does Spring implement @Transactional behavior?"
        options={["It modifies the bytecode of your class", "It wraps your bean in a proxy that starts/commits transactions before/after method calls", "It requires you to extend a TransactionalBase class", "It uses AspectJ load-time weaving only"]}
        correctIndex={1}
        explanation="Spring uses the Proxy pattern for @Transactional. It creates a proxy (JDK dynamic proxy or CGLIB subclass) that intercepts calls to @Transactional methods, begins a transaction before the call, commits on success, and rolls back on exception — then delegates to your real method."
      />

    </LessonLayout>
  );
}
