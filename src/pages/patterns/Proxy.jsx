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
      next={{ path: '/patterns/realworld', label: 'Real-World Applications' }}
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
