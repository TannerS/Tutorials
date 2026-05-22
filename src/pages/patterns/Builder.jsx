import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Builder() {
  return (
    <LessonLayout
      title="Builder & Prototype Patterns"
      sectionId="patterns"
      lessonIndex={4}
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
        this.headers = Collections.unmodifiableMap(builder.headers);
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

      <InteractiveChallenge
        question="Why does the Builder pattern make the constructed object immutable (all fields final, no setters)?"
        options={[
          "To save memory by allowing the JVM to optimize field storage",
          "To ensure thread safety and prevent invalid state after construction",
          "Because Java requires final fields when using inner classes",
          "To make serialization with Jackson easier"
        ]}
        correctIndex={1}
        explanation="The Builder validates all constraints during build(), guaranteeing the object is in a valid state. Making it immutable ensures no one can put it into an invalid state later. This also makes the object inherently thread-safe — it can be shared across threads without synchronization."
      />
    </LessonLayout>
  );
}
