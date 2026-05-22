import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringDi() {
  return (
    <LessonLayout
      title="Dependency Injection"
      sectionId="springboot"
      lessonIndex={2}
      prev={{ path: "/springboot/setup", label: "Project Setup" }}
      next={{ path: "/springboot/rest", label: "Building REST APIs" }}
    >
      <p>Dependency Injection (DI) and Inversion of Control (IoC) are the foundation of Spring. Spring manages object creation and wiring — you declare what you need, Spring provides it.</p>

      <FlowChart
        title="IoC Container Flow"
        chart={"graph TD\n  A[You declare beans] --> B[Spring IoC Container]\n  B --> C[Creates instances]\n  B --> D[Wires dependencies]\n  B --> E[Manages lifecycle]\n  C --> F[Your application]"}
      />

      <h2>Stereotype Annotations</h2>
      <CodeBlock language="java" title="@Component, @Service, @Repository, @Controller">
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
    // Spring will inject this automatically
    private final UserRepository userRepo;
    private final EmailValidator validator;

    // Constructor injection (PREFERRED — explicit, testable)
    public UserService(UserRepository userRepo, EmailValidator validator) {
        this.userRepo = userRepo;
        this.validator = validator;
    }

    public User createUser(String email, String name) {
        if (!validator.isValid(email))
            throw new IllegalArgumentException("Invalid email");
        return userRepo.save(new User(email, name));
    }
}

// @Repository — data access layer
// Spring adds exception translation (SQLException -> DataAccessException)
@Repository
public interface UserRepository extends JpaRepository<User, Long> {}

// @RestController — HTTP layer
@RestController
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService; // constructor injection
    }
}`}
      </CodeBlock>

      <h2>@Bean and @Configuration</h2>
      <CodeBlock language="java" title="Manual Bean Definition">
{`@Configuration  // Marks this as a source of bean definitions
public class AppConfig {

    // @Bean — manually create and configure a bean
    @Bean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .build();
    }

    // @Bean with dependency injection
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(10))
            .build();
    }
}`}
      </CodeBlock>

      <h2>Bean Scopes and @Qualifier</h2>
      <CodeBlock language="java" title="Scopes and Qualifier">
{`// Default scope is singleton — one instance per application context
@Service
@Scope("singleton") // default, not needed explicitly
public class CacheService { ... }

// Prototype — new instance every time it is requested
@Component
@Scope("prototype")
public class RequestContext { ... }

// @Qualifier — disambiguate when multiple beans match a type
@Component("emailNotifier")
public class EmailNotificationService implements NotificationService { ... }

@Component("smsNotifier")
public class SmsNotificationService implements NotificationService { ... }

@Service
public class AlertService {
    private final NotificationService notifier;

    public AlertService(@Qualifier("emailNotifier") NotificationService notifier) {
        this.notifier = notifier;
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Constructor Injection is Best">
        <p>Prefer constructor injection over @Autowired field injection. Constructor injection makes dependencies explicit, works without Spring in tests, prevents circular dependencies at startup, and lets you use final fields.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Which injection style is preferred in modern Spring Boot applications?"
        options={["Field injection with @Autowired", "Setter injection", "Constructor injection", "XML-based injection"]}
        correctIndex={2}
        explanation="Constructor injection is preferred. It makes dependencies explicit (visible in the constructor signature), allows fields to be final (immutable), works in unit tests without Spring context, and detects circular dependencies at startup."
      />
    </LessonLayout>
  );
}
