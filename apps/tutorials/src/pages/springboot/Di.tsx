import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Di() {
  return (
    <LessonLayout
      title="Dependency Injection & IoC"
      sectionId="springboot"
      lessonIndex={2}
      prev={{ path: '/springboot/setup', label: 'Project Setup & Structure' }}
      next={{ path: '/springboot/rest', label: 'Building REST APIs' }}
    >
      <h2>Inversion of Control (IoC) and Dependency Injection</h2>
      <p>
        Inversion of Control is a design principle where the control of object creation and
        lifecycle management is transferred from your application code to a framework or
        container. In Spring, the IoC container (also called the ApplicationContext) is
        responsible for creating objects (called beans), wiring their dependencies together,
        and managing their entire lifecycle.
      </p>
      <p>
        Dependency Injection (DI) is the mechanism through which IoC is achieved. Instead of a
        class creating its own dependencies with <code>new</code>, the container injects them
        automatically — either through the constructor, a setter method, or a field.
      </p>

      <FlowChart
        title="Spring IoC Container Flow"
        chart={"graph TD\nA[Application Starts] --> B[IoC Container Initializes]\nB --> C[Component Scan]\nC --> D[Discover @Component Classes]\nD --> E[Create Bean Instances]\nE --> F[Resolve Dependencies]\nF --> G[Inject Dependencies]\nG --> H[Call @PostConstruct]\nH --> I[Application Ready]\nI --> J[On Shutdown: @PreDestroy]"}
      />

      <h3>Stereotype Annotations</h3>
      <p>
        Spring provides several stereotype annotations that mark classes as Spring-managed beans.
        While they all register the class as a bean, they carry semantic meaning about the
        role of the class in your architecture.
      </p>

      <CodeBlock language="java" title="StereotypeAnnotations.java">
{`// @Component — generic Spring-managed bean
@Component
public class EmailValidator {
    public boolean isValid(String email) {
        return email != null && email.contains("@");
    }
}

// @Service — business logic layer
@Service
public class UserService {
    // Business logic goes here
}

// @Repository — data access layer (adds exception translation)
@Repository
public class UserRepository {
    // Database operations go here
}

// @Controller / @RestController — web layer
@RestController
public class UserController {
    // HTTP endpoint handlers go here
}`}
      </CodeBlock>

      <h3>Constructor Injection (Recommended)</h3>
      <p>
        Constructor injection is the recommended approach in Spring. It makes dependencies
        explicit, supports immutability via <code>final</code> fields, and ensures the bean
        is always in a valid state after construction.
      </p>

      <CodeBlock language="java" title="UserService.java">
{`@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailValidator emailValidator;
    private final PasswordEncoder passwordEncoder;

    // Constructor injection — Spring automatically injects dependencies.
    // @Autowired is optional on constructors since Spring 4.3
    // when there is only one constructor.
    public UserService(UserRepository userRepository,
                       EmailValidator emailValidator,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailValidator = emailValidator;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(String email, String password) {
        if (!emailValidator.isValid(email)) {
            throw new IllegalArgumentException("Invalid email");
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Avoid Field Injection">
        <p>
          While <code>@Autowired</code> on fields works, it is generally discouraged because
          it hides dependencies, makes classes harder to test (you cannot easily pass mocks
          without reflection), and prevents the use of <code>final</code> fields. Always
          prefer constructor injection for production code.
        </p>
      </InfoBox>

      <h3>@Bean and @Configuration</h3>
      <p>
        For beans that require custom instantiation logic, or for registering third-party classes
        as beans (classes you cannot annotate with <code>@Component</code>), use
        <code>@Bean</code> methods inside a <code>@Configuration</code> class.
      </p>

      <CodeBlock language="java" title="AppConfig.java">
{`@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(10))
            .build();
    }

    @Bean
    @Profile("dev")
    public DataSource devDataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .addScript("schema.sql")
            .build();
    }
}`}
      </CodeBlock>

      <h3>Bean Scopes and Lifecycle</h3>
      <p>
        By default, Spring beans are singletons — one instance shared across the entire
        application. Spring supports several other scopes for different use cases:
      </p>
      <ul>
        <li><strong>singleton</strong> (default): One instance per ApplicationContext</li>
        <li><strong>prototype</strong>: New instance each time the bean is requested</li>
        <li><strong>request</strong>: One instance per HTTP request (web apps only)</li>
        <li><strong>session</strong>: One instance per HTTP session (web apps only)</li>
      </ul>

      <CodeBlock language="java" title="BeanScopes.java">
{`@Component
@Scope("prototype")
public class ShoppingCart {
    private List<Item> items = new ArrayList<>();

    public void addItem(Item item) {
        items.add(item);
    }
}

@Component
public class AuditLogger {

    @PostConstruct
    public void init() {
        System.out.println("AuditLogger bean initialized");
    }

    @PreDestroy
    public void cleanup() {
        System.out.println("AuditLogger bean destroyed");
    }
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="Which injection method is recommended in modern Spring applications?"
        options={[
          "Field injection with @Autowired",
          "Setter injection with @Autowired",
          "Constructor injection",
          "Static factory methods"
        ]}
        correctIndex={2}
        explanation="Constructor injection is the recommended approach because it makes dependencies explicit, allows fields to be declared final (immutable), ensures the bean is never in a partially constructed state, and makes unit testing straightforward since you can simply pass mocks through the constructor."
      />
    </LessonLayout>
  );
}
