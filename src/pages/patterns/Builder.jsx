import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function PatternsBuilder() {
  return (
    <LessonLayout
      title="Builder Pattern"
      sectionId="patterns"
      lessonIndex={4}
      prev={{ path: "/patterns/decorator", label: "Decorator Pattern" }}
      next={{ path: "/patterns/composite", label: "Composite Pattern" }}
    >
      <p>The Builder pattern separates the construction of a complex object from its representation. When an object has many optional parameters, telescoping constructors become unwieldy. Builder provides a fluent API that only sets what you need, with a final <code>build()</code> call to validate and create the object.</p>

      <h2>Telescoping Constructor Problem</h2>

      <CodeBlock language="java" title="Before Builder — Constructor Explosion">
{`// With 8 fields, you need constructors for every combo, or one giant one
class HttpRequest {
    HttpRequest(String url) { ... }
    HttpRequest(String url, String method) { ... }
    HttpRequest(String url, String method, Map<String,String> headers) { ... }
    HttpRequest(String url, String method, Map<String,String> headers, String body) { ... }
    // ... or one nightmare constructor:
    HttpRequest(String url, String method, Map<String,String> headers,
                String body, int timeout, boolean followRedirects,
                String contentType, boolean ssl) { ... }
    // Called as: new HttpRequest("http://...", "POST", null, "{}", 5000, true, "application/json", true)
    // Can you tell what 'true' means in position 6 vs 8? No.
}`}
      </CodeBlock>

      <CodeBlock language="java" title="After Builder — Fluent and Readable">
{`public class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final int timeoutMs;
    private final boolean followRedirects;
    private final String contentType;

    // Private — only Builder can call this
    private HttpRequest(Builder builder) {
        this.url             = builder.url;
        this.method          = builder.method;
        this.headers         = Collections.unmodifiableMap(builder.headers);
        this.body            = builder.body;
        this.timeoutMs       = builder.timeoutMs;
        this.followRedirects = builder.followRedirects;
        this.contentType     = builder.contentType;
    }

    public static class Builder {
        // Required
        private final String url;
        // Optional with defaults
        private String method          = "GET";
        private Map<String,String> headers = new HashMap<>();
        private String body            = null;
        private int timeoutMs          = 30_000;
        private boolean followRedirects = true;
        private String contentType     = "application/json";

        public Builder(String url) { this.url = url; }  // required param

        public Builder method(String m)          { this.method = m; return this; }
        public Builder header(String k, String v){ this.headers.put(k, v); return this; }
        public Builder body(String b)            { this.body = b; return this; }
        public Builder timeout(int ms)           { this.timeoutMs = ms; return this; }
        public Builder followRedirects(boolean f){ this.followRedirects = f; return this; }
        public Builder contentType(String ct)    { this.contentType = ct; return this; }

        public HttpRequest build() {
            if (url == null || url.isBlank()) throw new IllegalStateException("URL required");
            if (body != null && method.equals("GET")) throw new IllegalStateException("GET cannot have body");
            return new HttpRequest(this);
        }
    }
}

// Usage — clear, readable, only set what you need
HttpRequest request = new HttpRequest.Builder("https://api.example.com/orders")
    .method("POST")
    .header("Authorization", "Bearer " + token)
    .body("""{"item":"book","qty":2}""")
    .timeout(5_000)
    .build();`}
      </CodeBlock>

      <FlowChart
        title="Builder Construction Flow"
        chart={"graph LR\n  A[Client] --> B[Builder]\n  B --> C[set method]\n  B --> D[set headers]\n  B --> E[set body]\n  B --> F[set timeout]\n  C & D & E & F --> G[build]\n  G --> H[Validate]\n  H --> I[HttpRequest]"}
      />

      <h2>Lombok @Builder</h2>

      <CodeBlock language="java" title="Lombok @Builder (Zero Boilerplate)">
{`import lombok.Builder;
import lombok.Value;  // immutable @Data

@Value  // immutable: final fields, no setters
@Builder(toBuilder = true)  // generates Builder class
public class UserProfile {
    String userId;
    String displayName;
    String email;
    String avatarUrl;
    @Builder.Default
    boolean emailVerified = false;
    @Builder.Default
    Instant createdAt = Instant.now();
}

// Usage — Lombok generates the builder for you
UserProfile profile = UserProfile.builder()
    .userId("u-123")
    .displayName("Alice")
    .email("alice@example.com")
    .emailVerified(true)
    .build();

// toBuilder copies existing + overrides specific fields
UserProfile updated = profile.toBuilder()
    .displayName("Alice Smith")
    .build();`}
      </CodeBlock>

      <h2>Builder for Test Data</h2>

      <CodeBlock language="java" title="Test Object Builder">
{`// Test builders make test setup readable
public class OrderTestBuilder {
    private String orderId      = UUID.randomUUID().toString();
    private String customerId   = "customer-1";
    private List<OrderLine> lines = new ArrayList<>();
    private OrderStatus status  = OrderStatus.PENDING;
    private BigDecimal total    = BigDecimal.ZERO;

    public OrderTestBuilder withCustomer(String id) { this.customerId = id; return this; }
    public OrderTestBuilder withLine(String sku, int qty, double price) {
        lines.add(new OrderLine(sku, qty, price));
        total = total.add(BigDecimal.valueOf(qty * price));
        return this;
    }
    public OrderTestBuilder shipped() { this.status = OrderStatus.SHIPPED; return this; }

    public Order build() { return new Order(orderId, customerId, lines, status, total); }
}

// Test becomes a narrative
@Test void should_calculate_shipping_for_heavy_order() {
    Order order = new OrderTestBuilder()
        .withCustomer("vip-customer")
        .withLine("BOOK-1", 3, 15.99)
        .withLine("LAPTOP-1", 1, 999.99)
        .build();

    double shipping = shippingService.calculate(order);
    assertThat(shipping).isEqualTo(25.00);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Builder vs Factory">
        <p>Use Factory when the creation logic is simple and you want to hide which subclass to return. Use Builder when construction requires many parameters, optional fields, or multi-step validation. They are complementary: a Factory can use a Builder internally.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What problem does the Builder pattern primarily solve?"
        options={["Lazy initialization of expensive objects", "Telescoping constructors with many optional parameters", "Ensuring only one instance exists", "Converting between incompatible interfaces"]}
        correctIndex={1}
        explanation="Builder solves the telescoping constructor problem. When a class has many optional parameters, constructors become unreadable and error-prone. Builder provides a fluent step-by-step API and a final build() method that validates and constructs the object."
      />

    </LessonLayout>
  );
}
