import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Proxy() {
  return (
    <LessonLayout
      title="Proxy & Chain of Responsibility"
      sectionId="patterns"
      lessonIndex={6}
      prev={{ path: '/patterns/composite', label: 'Composite & Facade' }}
      next={{ path: '/patterns/command', label: 'Command & Iterator' }}
    >
      <h2>Proxy Pattern</h2>
      <p>
        Provides a surrogate or placeholder for another object to control access to it.
        The proxy has the same interface as the real object, so clients can't tell the difference.
        Common variants: virtual proxy (lazy loading), protection proxy (access control),
        and caching proxy.
      </p>

      <FlowChart
        title="Proxy Pattern Structure"
        chart={"graph LR\n  A[Client] --> B[Proxy]\n  B -->|delegates to| C[RealSubject]\n  B -->|controls access| C\n  D[Subject Interface] --> B\n  D --> C"}
      />

      <CodeBlock language="java" title="Caching Proxy - Expensive Service Calls" showLineNumbers={true}>
{`// Subject interface
public interface ProductService {
    Product findById(String id);
    List<Product> search(String query);
}

// Real subject - hits the database
@Repository
public class ProductServiceImpl implements ProductService {
    private final JdbcTemplate jdbc;

    @Override
    public Product findById(String id) {
        return jdbc.queryForObject(
            "SELECT * FROM products WHERE id = ?",
            productRowMapper, id);
    }

    @Override
    public List<Product> search(String query) {
        return jdbc.query(
            "SELECT * FROM products WHERE name ILIKE ?",
            productRowMapper, "%" + query + "%");
    }
}

// Caching Proxy - same interface, adds caching behavior
public class CachingProductService implements ProductService {
    private final ProductService delegate;
    private final Cache<String, Product> cache;
    private final Cache<String, List<Product>> searchCache;

    public CachingProductService(ProductService delegate) {
        this.delegate = delegate;
        this.cache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(5))
            .build();
        this.searchCache = Caffeine.newBuilder()
            .maximumSize(1_000)
            .expireAfterWrite(Duration.ofMinutes(1))
            .build();
    }

    @Override
    public Product findById(String id) {
        return cache.get(id, delegate::findById); // Cache miss -> delegate
    }

    @Override
    public List<Product> search(String query) {
        return searchCache.get(query, delegate::search);
    }
}

// Client doesn't know it's using a proxy
ProductService service = new CachingProductService(new ProductServiceImpl(jdbc));
Product p = service.findById("prod-123"); // First call: hits DB
Product p2 = service.findById("prod-123"); // Second call: from cache`}
      </CodeBlock>

      <CodeBlock language="java" title="Protection Proxy - Access Control" showLineNumbers={true}>
{`// Protection Proxy - checks permissions before delegating
public class SecureDocumentService implements DocumentService {
    private final DocumentService delegate;
    private final SecurityContext securityContext;

    public SecureDocumentService(DocumentService delegate,
                                SecurityContext securityContext) {
        this.delegate = delegate;
        this.securityContext = securityContext;
    }

    @Override
    public Document getDocument(String id) {
        // Read access - most users allowed
        User user = securityContext.getCurrentUser();
        Document doc = delegate.getDocument(id);

        if (!doc.isPublic() && !user.hasPermission("DOCUMENT_READ")) {
            throw new AccessDeniedException(
                "User " + user.getId() + " cannot access document " + id);
        }
        return doc;
    }

    @Override
    public void deleteDocument(String id) {
        // Delete - admin only
        User user = securityContext.getCurrentUser();
        if (!user.hasRole(Role.ADMIN)) {
            throw new AccessDeniedException(
                "Only admins can delete documents");
        }
        delegate.deleteDocument(id);
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Proxy in Spring Boot">
        Spring uses proxies extensively! @Transactional, @Cacheable, @Async, and @Secured all work
        via dynamic proxies (JDK Proxy or CGLIB). When you annotate a method, Spring wraps your bean
        in a proxy that adds the cross-cutting behavior before/after your method runs.
      </InfoBox>

      <InfoBox variant="danger" title="Self-Invocation Silently Bypasses the Proxy">
        <p>
          Understanding that Spring&apos;s annotations <em>are</em> the Proxy pattern immediately
          explains the framework&apos;s most notorious gotcha — and it is a very common interview
          question precisely because it separates people who memorised the annotation from people who
          understand the mechanism.
        </p>
        <p>
          The proxy is a <strong>separate object wrapping your bean</strong>. Callers hold a reference
          to the proxy, so their calls are intercepted. But when one method of your bean calls another
          method <em>on itself</em>, that call goes through <code>this</code> — the real object, not
          the wrapper. The proxy is never involved, and the annotation does nothing at all. No error,
          no warning; the transaction or cache simply does not happen.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="The Self-Invocation Trap" showLineNumbers={true}>
{`@Service
public class OrderService {

    public void processAll(List<Order> orders) {
        for (Order order : orders) {
            // BROKEN: 'this.processOne(...)' bypasses the proxy entirely.
            // @Transactional is IGNORED -- no transaction is started.
            processOne(order);
        }
    }

    @Transactional
    public void processOne(Order order) { ... }
}

// FIX 1 (best): move the annotated method to a different bean, so the
// call crosses a real bean boundary and hits that bean's proxy.
@Service
public class OrderService {
    private final OrderProcessor processor;   // injected -> a PROXY

    public void processAll(List<Order> orders) {
        orders.forEach(processor::processOne); // intercepted correctly
    }
}

// FIX 2: inject the proxy into itself (works, but a design smell --
// it signals the class is doing two jobs).
@Service
public class OrderService {
    @Autowired @Lazy private OrderService self;

    public void processAll(List<Order> orders) {
        orders.forEach(self::processOne);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two More Consequences of the Proxy Mechanism">
        <p>
          <strong>Only <code>public</code> methods are intercepted.</strong> A{' '}
          <code>@Transactional</code> on a <code>private</code>, <code>protected</code>, or
          package-private method is silently ignored under JDK proxies, because there is nothing for
          the proxy to override.
        </p>
        <p>
          <strong><code>final</code> classes and methods cannot be proxied by CGLIB.</strong> CGLIB
          works by generating a <em>subclass</em>, so a <code>final</code> class cannot be subclassed
          and a <code>final</code> method cannot be overridden. This is why Kotlin — where classes are
          final by default — needs the <code>all-open</code> compiler plugin for Spring.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="When to Hand-Roll a Proxy vs. Just Use Spring">
        Reach for a hand-written proxy like <code>CachingProductService</code> when you need
        behavior Spring's annotations don't cover cleanly — per-key cache eviction logic,
        request-scoped access rules that depend on more than a role check, or code running outside
        a Spring context entirely (a library, a CLI tool). If you're already on Spring and the need
        is generic caching, transactions, retries, or auth checks, don't hand-roll it —{' '}
        <code>@Cacheable</code>, <code>@Transactional</code>, and <code>@Secured</code> are the
        same Proxy pattern with the wiring already done for you, and they're far less code to
        maintain.
      </InfoBox>

      <h2>Chain of Responsibility</h2>
      <p>
        Passes a request along a chain of handlers. Each handler decides either to process the
        request or pass it to the next handler in the chain. Think: servlet filters, Spring
        Security filter chain, middleware in web frameworks.
      </p>

      <FlowChart
        title="Chain of Responsibility Structure"
        chart={"graph LR\n  A[Request] --> B[Handler 1]\n  B -->|pass| C[Handler 2]\n  C -->|pass| D[Handler 3]\n  D -->|pass| E[Handler 4]\n  B -->|or handle| F[Response]\n  C -->|or handle| F\n  D -->|or handle| F\n  E -->|or handle| F"}
      />

      <CodeBlock language="java" title="Chain of Responsibility - Request Validation Pipeline" showLineNumbers={true}>
{`// Handler interface
public interface RequestHandler {
    void setNext(RequestHandler next);
    ApiResponse handle(ApiRequest request);
}

// Base handler with chaining logic
public abstract class BaseHandler implements RequestHandler {
    private RequestHandler next;

    @Override
    public void setNext(RequestHandler next) {
        this.next = next;
    }

    protected ApiResponse passToNext(ApiRequest request) {
        if (next != null) {
            return next.handle(request);
        }
        return ApiResponse.ok(); // End of chain
    }
}

// Concrete handlers
public class AuthenticationHandler extends BaseHandler {
    private final TokenService tokenService;

    @Override
    public ApiResponse handle(ApiRequest request) {
        String token = request.getHeader("Authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            return ApiResponse.unauthorized("Missing auth token");
        }

        User user = tokenService.validate(token.substring(7));
        if (user == null) {
            return ApiResponse.unauthorized("Invalid token");
        }

        request.setUser(user);
        return passToNext(request); // Authenticated - pass along
    }
}

public class RateLimitHandler extends BaseHandler {
    private final RateLimiter limiter;

    @Override
    public ApiResponse handle(ApiRequest request) {
        String clientId = request.getUser().getId();
        if (!limiter.tryAcquire(clientId)) {
            return ApiResponse.tooManyRequests("Rate limit exceeded");
        }
        return passToNext(request);
    }
}

public class ValidationHandler extends BaseHandler {
    @Override
    public ApiResponse handle(ApiRequest request) {
        List<String> errors = request.validate();
        if (!errors.isEmpty()) {
            return ApiResponse.badRequest(errors);
        }
        return passToNext(request);
    }
}

public class BusinessLogicHandler extends BaseHandler {
    @Override
    public ApiResponse handle(ApiRequest request) {
        // Actual business logic here
        Object result = processRequest(request);
        return ApiResponse.ok(result);
    }
}

// Assemble the chain
AuthenticationHandler auth = new AuthenticationHandler(tokenService);
RateLimitHandler rateLimit = new RateLimitHandler(limiter);
ValidationHandler validation = new ValidationHandler();
BusinessLogicHandler logic = new BusinessLogicHandler();

auth.setNext(rateLimit);
rateLimit.setNext(validation);
validation.setNext(logic);

// Process request through the chain
ApiResponse response = auth.handle(incomingRequest);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Chain vs Decorator">
        Chain of Responsibility and Decorator look similar (both wrap behavior), but differ in intent.
        Decorator always delegates to the wrapped object. Chain handlers can short-circuit — if
        authentication fails, validation never runs. This "fail fast" behavior is the key distinction.
      </InfoBox>

      <InteractiveChallenge
        question="In Spring Boot, which annotation creates a proxy that adds caching behavior to a method?"
        options={[
          "@Proxy",
          "@Cacheable",
          "@CacheProxy",
          "@Cached"
        ]}
        correctIndex={1}
        explanation="@Cacheable tells Spring to create a proxy around your bean. The proxy intercepts method calls, checks the cache first, and only calls the real method on a cache miss. This is the Proxy pattern implemented via Spring AOP."
      />
    </LessonLayout>
  );
}
