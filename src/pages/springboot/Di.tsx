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
        container. In Spring, the IoC container (called the <code>ApplicationContext</code>) is
        responsible for creating objects (called beans), wiring their dependencies together,
        and managing their entire lifecycle.
      </p>
      <p>
        Dependency Injection (DI) is the mechanism through which IoC is achieved. Instead of a
        class creating its own dependencies with <code>new</code>, the container injects them
        automatically — through the constructor, a setter, or a field.
      </p>

      <FlowChart
        title="Spring IoC Container Flow"
        chart={"graph TD\nA[Application Starts] --> B[IoC Container Initializes]\nB --> C[Component Scan]\nC --> D[Discover @Component Classes]\nD --> E[Instantiate Beans]\nE --> F[Resolve Dependencies]\nF --> G[Inject Dependencies]\nG --> H[Call @PostConstruct / afterPropertiesSet]\nH --> I[Application Ready]\nI --> J[On Shutdown: @PreDestroy]"}
      />

      <h2>Stereotype Annotations</h2>
      <p>
        Spring's stereotype annotations mark classes as Spring-managed beans. They all register
        the class the same way — the differences are semantic (documenting the role) and
        the extra behavior Spring wires around them.
      </p>

      <CodeBlock language="java" title="Stereotype annotations">
{`// @Component — generic Spring-managed bean
@Component
public class EmailValidator { /* ... */ }

// @Service — business-logic layer (identical to @Component today
// but reserved for services; some tooling and AOP conventions expect it)
@Service
public class UserService { /* ... */ }

// @Repository — data-access layer. Adds automatic PersistenceExceptionTranslation,
// converting JDBC / JPA driver exceptions to Spring's DataAccessException hierarchy.
@Repository
public class UserRepository { /* ... */ }

// @Controller / @RestController — web layer.
// @RestController = @Controller + @ResponseBody, so every method return value
// is serialized directly (no view resolution).
@RestController
public class UserController { /* ... */ }`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why the distinction if they behave the same?">
        <p>
          Two reasons. <strong>1)</strong> <code>@Repository</code> genuinely differs — it
          adds JDBC/JPA exception translation. <strong>2)</strong> Everything else is a
          convention that tools rely on: AOP pointcuts often target
          <code>@Service</code> classes; component-scan filters can include/exclude by
          stereotype; code review is easier when the annotation announces intent.
        </p>
      </InfoBox>

      <h2>Constructor Injection (The One True Way)</h2>
      <p>
        Modern Spring codebases use <strong>constructor injection</strong>. It makes
        dependencies explicit, allows <code>final</code> fields, guarantees the bean is
        never in a partially-constructed state, and — crucially — makes unit testing
        trivial without any Spring context.
      </p>

      <CodeBlock language="java" title="Constructor injection — the modern default">
{`@Service
public class OrderService {

    private final OrderRepository orders;
    private final PaymentGateway payments;
    private final NotificationService notifications;

    // @Autowired is not required on the sole constructor since Spring 4.3.
    public OrderService(OrderRepository orders,
                        PaymentGateway payments,
                        NotificationService notifications) {
        this.orders = orders;
        this.payments = payments;
        this.notifications = notifications;
    }

    public Order place(NewOrderRequest req) {
        Order order = orders.save(Order.from(req));
        payments.charge(order.total(), req.card());
        notifications.orderPlaced(order);
        return order;
    }
}

// Unit test — no Spring context needed, no reflection, no @MockitoBean.
class OrderServiceTest {
    @Test
    void placesOrder() {
        var orders = mock(OrderRepository.class);
        var payments = mock(PaymentGateway.class);
        var notifications = mock(NotificationService.class);
        var svc = new OrderService(orders, payments, notifications);

        svc.place(new NewOrderRequest(/*...*/));

        verify(payments).charge(any(), any());
    }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never use field injection in production code">
        <p>
          <code>@Autowired</code> on fields works, but it hides dependencies, prevents
          <code>final</code>, and makes classes untestable without reflection. Setter injection
          is fine for genuinely optional dependencies but rare in practice. If you see field
          injection in a new codebase, treat it as a smell.
        </p>
      </InfoBox>

      <h3>Lombok + Spring: the one-line variant</h3>
      <p>
        With Lombok, you can drop the boilerplate constructor entirely. This is common but
        optional — plain constructors work identically and don't require a build-time
        annotation processor.
      </p>
      <CodeBlock language="java" title="Lombok @RequiredArgsConstructor">
{`@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orders;
    private final PaymentGateway payments;
    private final NotificationService notifications;
    // Lombok generates a constructor with all final fields.
    // Same DI behavior; less code; a build dep you now depend on.
}`}
      </CodeBlock>

      <h2>@Bean and @Configuration</h2>
      <p>
        For beans that need custom construction — or for third-party classes you can't
        annotate with <code>@Component</code> — declare <code>@Bean</code> methods inside
        a <code>@Configuration</code> class.
      </p>

      <CodeBlock language="java" title="@Bean methods in a @Configuration class">
{`@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public RestClient externalApiClient(RestClient.Builder builder) {
        return builder
            .baseUrl("https://api.example.com")
            .defaultHeader("Accept", "application/json")
            .build();
    }

    // Method parameters are injected from the container.
    // The method name becomes the bean name unless overridden with @Bean("name").
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        return new RedisCacheManager(factory);
    }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="@Configuration proxies vs @Component">
        <p>
          Full <code>@Configuration</code> classes are CGLIB-proxied so that intra-class
          <code>@Bean</code> calls return the singleton, not a fresh instance. If you use
          <code>@Component</code> as a config class, that guarantee is gone —
          calling one <code>@Bean</code> method from another creates a new instance.
          Use <code>@Configuration</code> for anything that composes beans internally.
        </p>
      </InfoBox>

      <h2>Multiple Beans of the Same Type — @Qualifier and @Primary</h2>
      <p>
        When two or more beans implement the same interface, Spring can't decide which one
        to inject. You get a <code>NoUniqueBeanDefinitionException</code>. Two annotations
        resolve this.
      </p>

      <CodeBlock language="java" title="@Qualifier: name the exact bean at the injection site">
{`public interface PaymentGateway {
    void charge(Money amount, Card card);
}

@Service("stripeGateway")
public class StripePaymentGateway implements PaymentGateway { /* ... */ }

@Service("paypalGateway")
public class PaypalPaymentGateway implements PaymentGateway { /* ... */ }

@Service
public class CheckoutService {

    private final PaymentGateway gateway;

    // The @Qualifier resolves the ambiguity — inject the Stripe bean specifically.
    public CheckoutService(@Qualifier("stripeGateway") PaymentGateway gateway) {
        this.gateway = gateway;
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="@Primary: default when no qualifier is given">
{`@Service
@Primary
public class StripePaymentGateway implements PaymentGateway { /* ... */ }

@Service
public class PaypalPaymentGateway implements PaymentGateway { /* ... */ }

// Now consumers without a qualifier get Stripe automatically.
// PayPal is still injectable via @Qualifier("paypalPaymentGateway").
@Service
public class CheckoutService {
    private final PaymentGateway gateway;

    public CheckoutService(PaymentGateway gateway) {
        this.gateway = gateway; // Stripe wins.
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Custom qualifier annotations for readability">
        <p>
          For projects with many implementations, define your own qualifier annotations.
          The type system becomes self-documenting — no more magic-string bean names.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="A meta-annotation as a qualifier">
{`@Qualifier
@Target({ ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface Stripe { }

@Service
@Stripe
public class StripePaymentGateway implements PaymentGateway { /* ... */ }

@Service
public class CheckoutService {
    public CheckoutService(@Stripe PaymentGateway gateway) { /* ... */ }
}`}
      </CodeBlock>

      <h2>Conditional Beans — Wiring Based on Config or Environment</h2>
      <p>
        This is one of Spring Boot's most powerful features. Beans can exist or not exist
        based on runtime configuration — no code changes required to turn features on and off.
      </p>

      <CodeBlock language="java" title="@ConditionalOnProperty — the workhorse">
{`// This bean is only created if 'features.notifications.enabled=true' in
// application.yml (or any property source). If the property is missing
// or set to any other value, this bean is skipped entirely.
@Service
@ConditionalOnProperty(prefix = "features.notifications", name = "enabled",
                       havingValue = "true", matchIfMissing = false)
public class RealNotificationService implements NotificationService { /* ... */ }

// Fallback: exists when the real one doesn't. Injected consumers get whichever
// is present — no null checks, no if-statements in the consumers.
@Service
@ConditionalOnMissingBean(NotificationService.class)
public class NoopNotificationService implements NotificationService {
    public void send(Notification n) { /* no-op */ }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Other conditional annotations">
{`// Only when a specific class is on the classpath (e.g. optional dep)
@ConditionalOnClass(name = "com.example.optional.SomeLib")
public class OptionalLibIntegration { /* ... */ }

// Only when a Spring profile is active
@Component
@Profile("dev")
public class InMemoryEventStore implements EventStore { /* ... */ }

// Combine multiple conditions
@Bean
@ConditionalOnProperty("features.cache.enabled")
@ConditionalOnMissingBean(CacheManager.class)
public CacheManager defaultCacheManager() { /* ... */ }`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why this matters in enterprise Spring">
        <p>
          Large services often ship with Kafka, Redis, and integration features that must be
          togglable per environment. Conditional beans let you write clean code where the
          consumer never knows a feature is disabled — the bean simply isn't there, and
          Spring wires the no-op fallback in its place. No feature-flag branching in your
          service code.
        </p>
      </InfoBox>

      <h2>Injecting Collections and Optional Dependencies</h2>
      <p>
        Spring can inject every bean of a given type as a <code>List</code> or <code>Map</code>.
        This is the foundation of the <strong>strategy / plugin pattern</strong> at the DI level —
        a common enterprise idiom.
      </p>

      <CodeBlock language="java" title="Inject every implementation as a List">
{`public interface DocumentExporter {
    String format();          // "csv", "pdf", "xlsx"
    byte[] export(Report r);
}

@Component class CsvExporter  implements DocumentExporter { /* ... */ }
@Component class PdfExporter  implements DocumentExporter { /* ... */ }
@Component class XlsxExporter implements DocumentExporter { /* ... */ }

@Service
public class ReportExportService {

    // Spring injects every DocumentExporter bean it finds.
    // Adding a new one is now zero code changes here.
    private final Map<String, DocumentExporter> exporters;

    // Map key = bean name. Custom keys via a small init helper:
    public ReportExportService(List<DocumentExporter> found) {
        this.exporters = found.stream()
            .collect(toMap(DocumentExporter::format, identity()));
    }

    public byte[] export(Report r, String format) {
        var exporter = exporters.get(format);
        if (exporter == null) throw new UnsupportedFormatException(format);
        return exporter.export(r);
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Optional dependencies — three ways">
{`@Service
public class MetricsService {

    // Way 1: java.util.Optional — clear intent, no null.
    private final Optional<TracingClient> tracing;

    public MetricsService(Optional<TracingClient> tracing) {
        this.tracing = tracing;
    }

    // Way 2: ObjectProvider — lazy, avoids early bean resolution.
    // Best when the dependency is genuinely optional and expensive to create.
    private final ObjectProvider<AlertingClient> alerting;

    public MetricsService(ObjectProvider<AlertingClient> alerting) {
        this.alerting = alerting;
    }

    void reportError(Exception e) {
        alerting.ifAvailable(client -> client.notify(e));
    }
}`}
      </CodeBlock>

      <h2>The Self-Invocation Trap</h2>
      <p>
        This is arguably the single most common Spring gotcha and it underlies bugs in
        <code>@Transactional</code>, <code>@Async</code>, <code>@Cacheable</code>, and any
        other AOP-driven annotation. Understanding it once inoculates you against a whole
        class of mysterious bugs.
      </p>

      <InfoBox variant="warning" title="The rule in one line">
        <p>
          Spring adds AOP behavior via a <strong>proxy that wraps your bean</strong>.
          When code inside the bean calls its own methods with <code>this.foo()</code>, it
          bypasses the proxy — so the annotation is silently ignored.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="The bug that every Spring developer writes once">
{`@Service
public class ReportService {

    // Intended: each report generation runs in its own transaction.
    @Transactional
    public void generateBatch(List<ReportRequest> requests) {
        // WRONG — this.generateOne() goes directly to the method,
        // NOT through the proxy. The @Transactional on generateOne is ignored.
        // Everything runs in a single implicit transaction (or none).
        for (var req : requests) {
            this.generateOne(req);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateOne(ReportRequest req) { /* ... */ }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Three ways to fix it">
{`// Option 1: split into separate beans (usually the cleanest).
@Service
class BatchService {
    private final ReportService reportService;
    public BatchService(ReportService r) { this.reportService = r; }

    public void generateBatch(List<ReportRequest> requests) {
        requests.forEach(reportService::generateOne); // via proxy — works
    }
}

// Option 2: inject yourself. Ugly but explicit.
@Service
public class ReportService {
    private final ReportService self;
    public ReportService(@Lazy ReportService self) { this.self = self; }

    @Transactional
    public void generateBatch(List<ReportRequest> requests) {
        for (var req : requests) self.generateOne(req); // via proxy
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateOne(ReportRequest req) { /* ... */ }
}

// Option 3: obtain the proxy from AopContext (requires exposeProxy=true).
// Least favored — couples you to AOP internals.
((ReportService) AopContext.currentProxy()).generateOne(req);`}
      </CodeBlock>

      <h2>Circular Dependencies</h2>
      <p>
        Bean A needs Bean B and Bean B needs Bean A. Spring Boot 2.6+ refuses this by default
        — the app fails to start. Older Spring quietly worked around it via setter or field
        injection, which frequently produced half-initialized beans and race conditions.
      </p>

      <CodeBlock language="java" title="How to actually resolve a circular dep">
{`// Symptom: application fails to start with
//   "The dependencies of some of the beans in the application context form a cycle"

// Fix #1 — the real fix: extract the shared logic into a third bean.
// Nine times out of ten, a cycle indicates a design smell where two collaborators
// share a concern that should live somewhere else.

// Fix #2 — @Lazy on one side. Spring injects a proxy resolved on first use.
@Service
class A {
    private final B b;
    public A(@Lazy B b) { this.b = b; }
}

// Fix #3 — setter injection on one side (breaks the constructor cycle).
// Not recommended; loses immutability and clarity.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Circular deps are a design signal, not a technical problem">
        <p>
          If two services depend on each other, ask: what concept lives in both of them?
          Extract that. If <code>OrderService</code> needs <code>InventoryService</code>
          which needs <code>OrderService</code> back to check reservation validity, the
          <em>reservation</em> is a concept of its own — pull it into
          <code>ReservationService</code> and both original services depend on it.
        </p>
      </InfoBox>

      <h2>Bean Scopes and Lifecycle</h2>
      <p>
        By default, Spring beans are singletons — one instance shared across the entire
        <code>ApplicationContext</code>. Other scopes exist but are used sparingly.
      </p>
      <ul>
        <li><strong>singleton</strong> (default) — one instance per context</li>
        <li><strong>prototype</strong> — a new instance every time the bean is requested</li>
        <li><strong>request</strong> — one instance per HTTP request (web apps)</li>
        <li><strong>session</strong> — one instance per HTTP session (web apps)</li>
        <li><strong>application</strong> — one instance per <code>ServletContext</code></li>
      </ul>

      <CodeBlock language="java" title="Lifecycle hooks">
{`@Component
public class BackgroundWorker {

    // Runs after DI is complete but before the bean is used.
    // Do initial validation, warm caches, register listeners.
    @PostConstruct
    public void init() {
        // ...
    }

    // Runs on graceful shutdown (SIGTERM, context.close()).
    // Release resources: close connections, flush queues.
    @PreDestroy
    public void teardown() {
        // ...
    }
}

// For beans you can't annotate (e.g. third-party classes),
// use the @Bean(initMethod = "...", destroyMethod = "...") form.
@Bean(initMethod = "connect", destroyMethod = "close")
public MyClient myClient() { return new MyClient(config); }`}
      </CodeBlock>

      <InfoBox variant="warning" title="Prototype beans in a singleton — the injection trap">
        <p>
          If a singleton <code>@Service</code> injects a <code>@Scope("prototype")</code>
          bean, only one prototype instance is ever created (at the singleton's construction).
          To get a fresh prototype per method call, inject <code>ObjectProvider</code> or use
          method injection (<code>@Lookup</code>).
        </p>
      </InfoBox>

      <h2>Aware Interfaces — When You Need the Container Itself</h2>
      <p>
        Occasionally you need direct access to Spring's plumbing: the bean's own name, the
        <code>ApplicationContext</code>, or the environment. Spring exposes these via
        <em>Aware</em> interfaces. Use them rarely — usually a targeted injection is cleaner.
      </p>
      <CodeBlock language="java" title="Aware interfaces (sparingly)">
{`@Component
public class ContextInspector
        implements ApplicationContextAware, EnvironmentAware, BeanNameAware {

    private ApplicationContext ctx;
    private Environment env;
    private String beanName;

    public void setApplicationContext(ApplicationContext ctx) { this.ctx = ctx; }
    public void setEnvironment(Environment env)                { this.env = env;   }
    public void setBeanName(String name)                       { this.beanName = name; }
}

// In practice: inject Environment or the specific bean instead — cleaner test story.`}
      </CodeBlock>

      <h2>Component Scanning</h2>
      <p>
        Spring Boot's <code>@SpringBootApplication</code> is a meta-annotation that includes
        <code>@ComponentScan</code> pointed at the current package and all sub-packages.
        Keep your main class at the top of the package tree — everything under it gets scanned.
      </p>

      <CodeBlock language="java" title="Restricting or extending the scan">
{`@SpringBootApplication(scanBasePackages = { "com.example.core", "com.example.web" })
public class Application { /* ... */ }

// Filter: include only beans matching a naming or annotation pattern
@ComponentScan(
    basePackages = "com.example",
    includeFilters = @Filter(type = FilterType.ANNOTATION, classes = FeatureBean.class),
    excludeFilters = @Filter(type = FilterType.REGEX, pattern = ".*\\.legacy\\..*")
)
public class ScanConfig { }`}
      </CodeBlock>

      <h2>Testing DI</h2>
      <p>
        Constructor injection makes unit tests almost free of Spring. Slice tests
        (<code>@WebMvcTest</code>, <code>@DataJpaTest</code>) load only the parts of the
        context they need. Full <code>@SpringBootTest</code> is a last resort.
      </p>

      <CodeBlock language="java" title="Three levels of DI testing">
{`// Level 1 — plain unit test. No Spring anywhere.
class OrderServiceTest {
    @Test void placesOrder() {
        var svc = new OrderService(mock(OrderRepository.class),
                                   mock(PaymentGateway.class),
                                   mock(NotificationService.class));
        // ...
    }
}

// Level 2 — slice test. Loads only the web layer.
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService orderService; // Spring 6.2+
    @Test void createsOrder() throws Exception { /* ... */ }
}

// Level 3 — full integration test. Slow; use sparingly.
@SpringBootTest
class ApplicationSmokeTest {
    @Autowired ApplicationContext ctx;
    @Test void contextLoads() { assertNotNull(ctx); }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="@MockBean is deprecated in Spring Boot 3.4+">
        <p>
          Use <code>@MockitoBean</code> (Spring 6.2+) instead. Same behavior, better
          integration with Mockito's lifecycle, and it's the going-forward API.
        </p>
      </InfoBox>

      <h2>Real-World DI Checklist</h2>
      <InfoBox variant="success" title="What good DI looks like in production Spring">
        <ul>
          <li>Constructor injection everywhere; every field <code>final</code>.</li>
          <li>No field injection outside of test scaffolding.</li>
          <li>No self-invocation of <code>@Transactional</code> / <code>@Async</code> /
              <code>@Cacheable</code> methods.</li>
          <li>Conditional beans (<code>@ConditionalOnProperty</code>) for feature toggling —
              no runtime <code>if</code>s in consumers.</li>
          <li>Multiple implementations disambiguated with <code>@Qualifier</code> or
              a custom qualifier annotation, not with bean names as magic strings.</li>
          <li>Plugin patterns via <code>List&lt;T&gt;</code> or <code>Map&lt;String,T&gt;</code>
              injection — never a hand-rolled registry.</li>
          <li>Slice tests where possible; full <code>@SpringBootTest</code> only for smoke.</li>
          <li>Optional deps use <code>Optional&lt;T&gt;</code> or <code>ObjectProvider&lt;T&gt;</code>,
              never <code>@Nullable</code> field injection.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="You add @Transactional to method B in service A, but changes aren't being rolled back on error when method A calls this.B(). Why?"
        options={[
          "You forgot @EnableTransactionManagement on your config class",
          "@Transactional doesn't work on private methods, which B must be",
          "Self-invocation via 'this' bypasses the Spring AOP proxy, so the transaction annotation is silently ignored",
          "You need to set propagation = REQUIRES_NEW explicitly"
        ]}
        correctIndex={2}
        explanation="This is the self-invocation trap — the single most common Spring gotcha. Spring adds transactional behavior via a proxy that wraps your bean. When code inside the bean calls its own methods with 'this.b()', it bypasses that proxy. Fix by extracting method B into a separate service, injecting the bean into itself (with @Lazy to break the cycle), or restructuring so the call comes from outside."
      />
    </LessonLayout>
  );
}
