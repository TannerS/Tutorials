import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Builder() {
  return (
    <LessonLayout
      title="Builder & Prototype Patterns"
      sectionId="patterns"
      lessonIndex={5}
      prev={{ path: '/patterns/decorator', label: 'Decorator & Adapter' }}
      next={{ path: '/patterns/composite', label: 'Composite & Facade' }}
    >
      <h2>Builder Pattern</h2>
      <p>
        Separates the construction of a complex object from its representation, allowing
        the same construction process to create different representations. Ideal when an object
        has many optional parameters or requires step-by-step construction.
      </p>

      <FlowChart
        title="Builder Pattern Structure"
        chart={"graph TD\n  A[Client] --> B[Builder]\n  B -->|step 1| C[set field A]\n  B -->|step 2| D[set field B]\n  B -->|step 3| E[set field C]\n  B -->|build| F[Immutable Product]\n  G[Director] -->|orchestrates| B"}
      />

      <CodeBlock language="java" title="Builder - Fluent API for Complex Object" showLineNumbers={true}>
{`public class HttpRequest {
    private final String method;
    private final String url;
    private final Map<String, String> headers;
    private final String body;
    private final Duration timeout;
    private final int retries;

    // Private constructor - only Builder can create instances
    private HttpRequest(Builder builder) {
        this.method = builder.method;
        this.url = builder.url;
        // COPY, don't wrap. Collections.unmodifiableMap() returns a
        // VIEW of the builder's map -- the caller still holds the
        // builder, so a later .header(...) call would mutate this
        // supposedly-immutable request. Map.copyOf takes a snapshot.
        this.headers = Map.copyOf(builder.headers);
        this.body = builder.body;
        this.timeout = builder.timeout;
        this.retries = builder.retries;
    }

    // Static factory method to get builder
    public static Builder builder(String method, String url) {
        return new Builder(method, url);
    }

    public static class Builder {
        // Required parameters
        private final String method;
        private final String url;

        // Optional parameters with defaults
        private Map<String, String> headers = new HashMap<>();
        private String body = null;
        private Duration timeout = Duration.ofSeconds(30);
        private int retries = 0;

        private Builder(String method, String url) {
            this.method = Objects.requireNonNull(method);
            this.url = Objects.requireNonNull(url);
        }

        public Builder header(String key, String value) {
            this.headers.put(key, value);
            return this; // Fluent API - return this for chaining
        }

        public Builder body(String body) {
            this.body = body;
            return this;
        }

        public Builder timeout(Duration timeout) {
            this.timeout = timeout;
            return this;
        }

        public Builder retries(int retries) {
            if (retries < 0) throw new IllegalArgumentException("Retries must be >= 0");
            this.retries = retries;
            return this;
        }

        public HttpRequest build() {
            // Validate state before building
            if (body != null && method.equals("GET")) {
                throw new IllegalStateException("GET requests cannot have a body");
            }
            return new HttpRequest(this);
        }
    }
}

// Usage - clean, readable, self-documenting
HttpRequest request = HttpRequest.builder("POST", "https://api.example.com/orders")
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer " + token)
    .body(orderJson)
    .timeout(Duration.ofSeconds(10))
    .retries(3)
    .build();`}
      </CodeBlock>

      <h3>Lombok @Builder</h3>
      <InfoBox variant="tip" title="Lombok Eliminates Boilerplate">
        In production code, you rarely write builders by hand. Lombok's @Builder annotation
        generates the entire builder pattern at compile time. Understanding the manual version
        is important for interviews, but use Lombok in real projects.
      </InfoBox>

      <CodeBlock language="java" title="Lombok @Builder - Zero Boilerplate" showLineNumbers={true}>
{`@Builder
@Value // Makes all fields private final, generates getters, equals, hashCode, toString
public class UserDto {
    String id;
    String email;
    String displayName;

    @Builder.Default
    Role role = Role.USER;

    @Builder.Default
    boolean active = true;

    @Singular  // Generates addPermission() for individual items
    List<String> permissions;
}

// Usage - identical API to hand-written builder
UserDto admin = UserDto.builder()
    .id("usr-123")
    .email("admin@company.com")
    .displayName("Admin User")
    .role(Role.ADMIN)
    .permission("READ")
    .permission("WRITE")
    .permission("DELETE")
    .build();

// Modify immutable objects with toBuilder()
UserDto deactivated = admin.toBuilder()
    .active(false)
    .build();`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Reach for Builder">
        Reach for Builder once a constructor collects roughly four or more parameters, or once
        some of them are optional — like <code>HttpRequest</code> above, where <code>method</code>{' '}
        and <code>url</code> are required but headers, body, timeout, and retries aren't. Without
        it you end up with "telescoping constructors" (five overloaded constructors covering every
        combination of optional args) or callers passing <code>null, null, false, 0, null</code>{' '}
        and hoping they got the positions right. If a type has two or three fields and no optional
        ones, a constructor or a Lombok <code>@Value</code> record is simpler — Builder is solving
        a readability/validation problem that doesn't exist yet at that size.
      </InfoBox>

      <h2>Prototype Pattern</h2>
      <p>
        Creates new objects by cloning an existing instance (prototype) rather than
        constructing from scratch. Useful when object creation is expensive or when you
        need copies with slight variations.
      </p>

      <FlowChart
        title="Prototype Pattern Structure"
        chart={"graph TD\n  A[Prototype Interface] -->|clone| B[ConcretePrototype]\n  C[Client] -->|requests clone| A\n  B --> D[Cloned Object 1]\n  B --> E[Cloned Object 2]\n  B --> F[Cloned Object 3]"}
      />

      <CodeBlock language="java" title="Prototype - Document Template System" showLineNumbers={true}>
{`public abstract class DocumentTemplate implements Cloneable {
    private String title;
    private String content;
    private List<String> sections;
    private Map<String, String> metadata;

    // Deep clone - critical for mutable fields
    @Override
    public DocumentTemplate clone() {
        try {
            DocumentTemplate copy = (DocumentTemplate) super.clone();
            // Deep copy mutable collections
            copy.sections = new ArrayList<>(this.sections);
            copy.metadata = new HashMap<>(this.metadata);
            return copy;
        } catch (CloneNotSupportedException e) {
            throw new AssertionError("Clone not supported", e);
        }
    }

    public abstract void customize(Map<String, String> params);
}

// Registry of prototypes
public class TemplateRegistry {
    private final Map<String, DocumentTemplate> templates = new HashMap<>();

    public void register(String key, DocumentTemplate template) {
        templates.put(key, template);
    }

    public DocumentTemplate create(String key) {
        DocumentTemplate prototype = templates.get(key);
        if (prototype == null) {
            throw new IllegalArgumentException("Unknown template: " + key);
        }
        return prototype.clone(); // Return a fresh copy
    }
}

// Usage
TemplateRegistry registry = new TemplateRegistry();
registry.register("invoice", new InvoiceTemplate());
registry.register("report", new ReportTemplate());

// Each call returns a new independent copy
DocumentTemplate myInvoice = registry.create("invoice");
myInvoice.customize(Map.of("customer", "Acme Corp", "amount", "$5,000"));`}
      </CodeBlock>

      <InfoBox variant="warning" title="Shallow vs Deep Clone">
        Java's Object.clone() performs a shallow copy by default. If your object contains mutable
        references (lists, maps, other objects), you MUST deep-copy them manually. Otherwise,
        clones will share mutable state — a common source of subtle bugs.
      </InfoBox>

      <InfoBox variant="tip" title="When to Reach for Prototype">
        Prototype is worth it when building an object from scratch is expensive — it needs a
        database read, a network call, or heavy computation to reach its default state — but you
        need many slightly-different copies of it. The <code>TemplateRegistry</code> above is the
        classic shape: load each document template once, then clone-and-customize per request
        instead of re-fetching it every time. It's also common for spawning near-identical game
        entities from a preconfigured prototype. If construction is cheap (a handful of field
        assignments), just call <code>new</code> again — cloning adds the shallow-vs-deep-copy
        risk above for no real savings.
      </InfoBox>

    </LessonLayout>
  );
}
