import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Di() {
  return (
    <LessonLayout
      title="Dependency Injection & IoC"
      sectionId="springboot2"
      lessonIndex={2}
      prev={{ path: '/springboot2/javax', label: 'The javax World — Namespace, JPA, Servlets' }}
      next={{ path: '/springboot2/rest', label: 'Building REST APIs' }}
    >
      <p>
        Good news first, for once: dependency injection is the part of this section where{' '}
        <strong>almost nothing changed.</strong> Constructor injection is constructor injection.
        A singleton is a singleton. The <code>ApplicationContext</code> resolves the same graph
        the same way whether it is running on Spring Framework 5.3 or 7.x. If you already know
        Boot 4&apos;s IoC container, you already know this one.
      </p>

      <p>
        What this lesson is actually for is the handful of places where that isn&apos;t quite
        true — a lifecycle annotation that comes from a different package than you&apos;d guess,
        a testing annotation that hasn&apos;t been renamed yet because the thing it would be
        renamed <em>to</em> doesn&apos;t exist on this Framework version, and one very specific
        &quot;this looks like it should be new in Boot 3, but it isn&apos;t&quot; trap. Everything
        else below is here for completeness and to give you real, compiling Boot 2.7.18 code
        rather than code with the imports quietly swapped.
      </p>

      <h2>Inversion of Control, Unchanged</h2>
      <p>
        Spring&apos;s IoC container — the <code>ApplicationContext</code> — creates your beans,
        resolves their dependencies, wires them together, and manages their lifecycle. That
        sentence describes Boot 2.7 and Boot 4 equally. The container implementation Boot 2.7
        boots is Spring Framework&apos;s, same as always; only the version number differs.
      </p>

      <FlowChart
        title="Spring IoC Container Flow — identical on 5.3 and on 7.x"
        chart={"graph TD\nA[Application Starts] --> B[IoC Container Initializes]\nB --> C[Component Scan]\nC --> D[Discover @Component Classes]\nD --> E[Instantiate Beans]\nE --> F[Resolve Dependencies]\nF --> G[Inject Dependencies]\nG --> H[Call javax.annotation.PostConstruct]\nH --> I[Application Ready]\nI --> J[On Shutdown: javax.annotation.PreDestroy]\nstyle H fill:#3a2f1a,stroke:#fbbf24\nstyle J fill:#3a2f1a,stroke:#fbbf24"}
      />

      <p>
        Two boxes are highlighted on purpose — they are the one genuinely different label in the
        whole diagram, and it is worth understanding exactly why before moving on.
      </p>

      <h2>@PostConstruct and @PreDestroy Come From javax.annotation</h2>

      <p>
        This is the one DI-adjacent fact from the <a href="/springboot2/javax">javax lesson</a>{' '}
        that is worth repeating here rather than just linking to, because it is easy to miss:
        the lifecycle annotations every Spring developer uses constantly are not Spring&apos;s
        own. They are JSR-250 &quot;Common Annotations&quot;, and on Boot 2.7 they live in{' '}
        <code>javax.annotation</code>, not <code>jakarta.annotation</code>. Verified straight out
        of the published Spring Framework jar that Boot 2.7.18 actually resolves:
      </p>

      <CodeBlock language="bash" title="What CommonAnnotationBeanPostProcessor — Spring's own @PostConstruct handler — imports">
{`unzip -p spring-context-5.3.31.jar \\
  org/springframework/context/annotation/CommonAnnotationBeanPostProcessor.class \\
  | strings | grep -oE '(javax|jakarta)/annotation/(PostConstruct|PreDestroy|Resource)' | sort -u`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Spring Framework 5.3.31, the version Boot 2.7.18 resolves">
{`javax/annotation/PostConstruct
javax/annotation/PreDestroy
javax/annotation/Resource`}
      </CodeBlock>

      <InfoBox variant="warning" title="But the Maven coordinate already says jakarta — this is not a typo">
        <p>
          Run <code>mvn dependency:tree</code> on a bare <code>spring-boot-starter</code> project
          pinned to 2.7.18 and the annotation processor jar resolves as{' '}
          <code>jakarta.annotation:jakarta.annotation-api:1.3.5</code> — confirmed by actually
          running it:
        </p>
        <CodeBlock language="text" title="Real output — mvn dependency:tree against spring-boot-starter-parent 2.7.18">
{`[INFO]    +- jakarta.annotation:jakarta.annotation-api:jar:1.3.5:compile`}
        </CodeBlock>
        <p>
          That looks like a contradiction until you remember the framing from the javax lesson:
          Jakarta EE 8 was a <strong>byte-identical re-release</strong> of Java EE 8 under Eclipse
          Foundation branding — new group ID, same package names. Unzip that exact jar and the
          class files inside are still <code>javax/annotation/PostConstruct.class</code>:
        </p>
        <CodeBlock language="text" title="Real output — unzip -l jakarta.annotation-api-1.3.5.jar">
{`430  08-02-2019 11:08   javax/annotation/PreDestroy.class
436  08-02-2019 11:08   javax/annotation/PostConstruct.class`}
        </CodeBlock>
        <p>
          So on Boot 2.7: import <code>javax.annotation.PostConstruct</code> in your Java source
          — that is the class that actually exists on the classpath — even though the jar
          providing it has &quot;jakarta&quot; in its coordinates. Boot 3+ is the release where
          both the coordinate <em>and</em> the package finally agree, on{' '}
          <code>jakarta.annotation.PostConstruct</code>.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Lifecycle hooks — Boot 2.7, real imports">
{`import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.springframework.stereotype.Component;

@Component
public class BackgroundWorker {

    // Runs after DI is complete but before the bean is used.
    @PostConstruct
    public void init() {
        // warm caches, validate config, register listeners
    }

    // Runs on graceful shutdown (SIGTERM, context.close()).
    @PreDestroy
    public void teardown() {
        // close connections, flush queues
    }
}

// For beans you can't annotate (third-party classes), the XML-free
// alternative hasn't changed either — same @Bean attributes, same effect.
// @Bean(initMethod = "...", destroyMethod = "...")`}
      </CodeBlock>

      <InfoBox variant="note" title="Why this even matters if the annotation 'just works' either way">
        <p>
          It matters the moment you upgrade the JDK independently of Spring, which is a real and
          common sequencing choice (see the <a href="/springboot2/intro">intro lesson</a>&apos;s
          three-jump breakdown). <code>javax.annotation.*</code> shipped inside the JDK itself
          through Java 8, via the now-removed <code>java.xml.ws.annotation</code> module — and was
          stripped from the JDK entirely starting Java 11. A Boot 2.7 app on Java 8 could
          historically get away with <em>not</em> declaring the annotation dependency explicitly,
          because the JDK provided it. On Java 11+ that free ride is gone, and it is{' '}
          <code>spring-boot-starter</code>&apos;s own transitive pull of{' '}
          <code>jakarta.annotation-api</code> (the javax-classes-in-a-jakarta-jar shown above)
          that is quietly doing the job instead. You will not notice this until you meet a stray
          module that excludes it.
        </p>
      </InfoBox>

      <h2>Stereotype Annotations — No Change</h2>
      <p>
        <code>@Component</code>, <code>@Service</code>, <code>@Repository</code>,{' '}
        <code>@Controller</code>/<code>@RestController</code> — same package (
        <code>org.springframework.stereotype</code> and{' '}
        <code>org.springframework.web.bind.annotation</code>), same semantics, same{' '}
        <code>@Repository</code> exception-translation behavior, on both Boot 2.7 and Boot 4.
        Nothing to migrate here, ever.
      </p>

      <CodeBlock language="java" title="Stereotypes — identical code, either version">
{`@Component
public class EmailValidator { /* ... */ }

@Service
public class UserService { /* ... */ }

// Adds automatic PersistenceExceptionTranslation — JDBC/JPA driver
// exceptions become Spring's DataAccessException hierarchy. Unchanged.
@Repository
public class UserRepository { /* ... */ }

@RestController
public class UserController { /* ... */ }`}
      </CodeBlock>

      <h2>Constructor Injection (The One True Way, Since Long Before Boot 2.7)</h2>
      <p>
        <code>@Autowired</code> has been optional on the sole constructor since Spring{' '}
        <strong>4.3</strong> — five major Spring Boot releases before 2.7 existed. If you are
        reading a Boot 2 codebase and see <code>@Autowired</code> on every constructor, that is a
        team&apos;s style choice or a habit carried from Spring 3, not something the framework
        required at the time.
      </p>

      <CodeBlock language="java" title="Constructor injection — Boot 2.7, same as Boot 4">
{`@Service
public class OrderService {

    private final OrderRepository orders;
    private final PaymentGateway payments;
    private final NotificationService notifications;

    // @Autowired not required — single constructor, inferred since Spring 4.3.
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

// Unit test — no Spring context, no reflection. This has never depended
// on which Boot version is on the classpath.
class OrderServiceTest {
    @Test
    void placesOrder() {
        OrderRepository orders = mock(OrderRepository.class);
        PaymentGateway payments = mock(PaymentGateway.class);
        NotificationService notifications = mock(NotificationService.class);
        OrderService svc = new OrderService(orders, payments, notifications);

        svc.place(new NewOrderRequest(/* ... */));

        verify(payments).charge(any(), any());
    }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Field injection is exactly as bad an idea here as on Boot 4">
        <p>
          <code>@Autowired</code> on a field compiles and works on 2.7 too — it hides
          dependencies, blocks <code>final</code>, and makes the class untestable without
          reflection. If you inherit a Boot 2 codebase full of field injection, that is not a
          Boot-2-era convention you need to preserve out of respect for the version; it was always
          the wrong call, on every Spring version this section covers.
        </p>
      </InfoBox>

      <h2>@Bean and @Configuration</h2>
      <p>
        For beans that need custom construction, or third-party classes you can&apos;t annotate,
        <code>@Bean</code> methods inside a <code>@Configuration</code> class work exactly as they
        do on Boot 4. The one thing to watch is reaching for a Boot 3.1+ type by habit —{' '}
        <code>RestClient</code> does not exist on Framework 5.3, so a Boot 2.7{' '}
        <code>@Bean</code> factory for an HTTP client returns a <code>RestTemplate</code> instead.
        More on that in the <a href="/springboot2/rest">REST lesson</a>.
      </p>

      <CodeBlock language="java" title="@Bean methods — Boot 2.7">
{`@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    // Not RestClient.Builder — that type is Spring Framework 6.1+.
    // On 2.7 this is a RestTemplateBuilder, auto-configured by Boot.
    @Bean
    public RestTemplate externalApiClient(RestTemplateBuilder builder) {
        return builder
            .rootUri("https://api.example.com")
            .defaultHeader("Accept", "application/json")
            .build();
    }

    // Method parameters are still injected from the container.
    // The method name is still the bean name unless overridden with @Bean("name").
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory).build();
    }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="@Configuration proxies vs @Component — unchanged">
        <p>
          Full <code>@Configuration</code> classes are still CGLIB-proxied so intra-class{' '}
          <code>@Bean</code> calls return the singleton rather than a fresh instance. Use a bare{' '}
          <code>@Component</code> as a config class on 2.7 and you lose that guarantee exactly as
          you would on Boot 4 — a call from one <code>@Bean</code> method to another creates a new
          instance instead of returning the managed one.
        </p>
      </InfoBox>

      <h2>@Qualifier and @Primary — No Change</h2>
      <p>
        When two beans implement the same interface, Spring 5.3 resolves the ambiguity exactly
        the way Spring 7 does.
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

@Service
public class CheckoutService {
    private final PaymentGateway gateway;

    public CheckoutService(PaymentGateway gateway) {
        this.gateway = gateway; // Stripe wins.
    }
}`}
      </CodeBlock>

      <h2>Conditional Beans</h2>
      <p>
        <code>@ConditionalOnProperty</code>, <code>@ConditionalOnClass</code>,{' '}
        <code>@ConditionalOnMissingBean</code>, <code>@Profile</code> — all present, all behaving
        identically on 2.7. The rule that decides which conditions are safe on a plain{' '}
        component-scanned class versus which belong on a <code>@Bean</code> method inside a real
        auto-configuration is a fact about <em>when in the startup sequence the condition is
        evaluated</em>, and that sequencing has not changed between Framework 5.3 and 7.
      </p>

      <CodeBlock language="java" title="@ConditionalOnProperty — the workhorse, unchanged">
{`// Created only if features.notifications.enabled=true. Missing or any
// other value: skipped entirely.
@Service
@ConditionalOnProperty(prefix = "features.notifications", name = "enabled",
                       havingValue = "true", matchIfMissing = false)
public class RealNotificationService implements NotificationService { /* ... */ }

// The exact inverse condition — precisely one of the two beans always exists.
@Service
@ConditionalOnProperty(prefix = "features.notifications", name = "enabled",
                       havingValue = "false", matchIfMissing = true)
public class NoopNotificationService implements NotificationService {
    public void send(Notification n) { /* no-op */ }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="The @ConditionalOnMissingBean trap is the same trap">
        <p>
          <code>@ConditionalOnMissingBean</code> can only see beans already registered{' '}
          <strong>at the moment it is evaluated</strong>, and component-scan registration order is
          not guaranteed. That has been true since long before 2.7 and remains true on Boot 4 —
          this is not something either version fixed. Use mutually exclusive{' '}
          <code>@ConditionalOnProperty</code> pairs on your own component-scanned beans, and
          reserve <code>@ConditionalOnMissingBean</code> for <code>@Bean</code> methods inside a
          real auto-configuration, where Boot guarantees the ordering.
        </p>
      </InfoBox>

      <h2>Injecting Collections and Optional Dependencies</h2>
      <p>
        <code>List&lt;T&gt;</code>/<code>Map&lt;String,T&gt;</code> injection of every matching
        bean, <code>java.util.Optional&lt;T&gt;</code>, and <code>ObjectProvider&lt;T&gt;</code>{' '}
        (added in Spring 4.3, so present for the entire Boot 2.x line) all work identically here.
      </p>

      <CodeBlock language="java" title="Plugin pattern via List injection — unchanged">
{`public interface DocumentExporter {
    String format();
    byte[] export(Report r);
}

@Component class CsvExporter  implements DocumentExporter { /* ... */ }
@Component class PdfExporter  implements DocumentExporter { /* ... */ }
@Component class XlsxExporter implements DocumentExporter { /* ... */ }

@Service
public class ReportExportService {

    private final Map<String, DocumentExporter> exporters;

    public ReportExportService(List<DocumentExporter> found) {
        this.exporters = found.stream()
            .collect(Collectors.toMap(DocumentExporter::format, Function.identity()));
    }

    public byte[] export(Report r, String format) {
        DocumentExporter exporter = exporters.get(format);
        if (exporter == null) throw new UnsupportedFormatException(format);
        return exporter.export(r);
    }
}`}
      </CodeBlock>

      <h2>The Self-Invocation Trap — Same Mechanism</h2>
      <p>
        This is arguably the single most common Spring gotcha, and the mechanism behind it —
        <code>@Transactional</code>, <code>@Async</code>, <code>@Cacheable</code>, and every other
        AOP-driven annotation are applied via a <strong>proxy wrapping your bean</strong> — has not
        changed. Calling <code>this.foo()</code> from inside the bean bypasses that proxy on 2.7
        exactly as it does on 7.
      </p>

      <CodeBlock language="java" title="The bug every Spring developer writes once, on every version">
{`@Service
public class ReportService {

    @Transactional
    public void generateBatch(List<ReportRequest> requests) {
        // WRONG on Boot 2.7 AND Boot 4 — this.generateOne() bypasses the
        // proxy, so @Transactional on generateOne is silently ignored.
        for (ReportRequest req : requests) {
            this.generateOne(req);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateOne(ReportRequest req) { /* ... */ }
}

// Fix: extract into a separate bean and call THROUGH it, or inject the
// bean into itself with @Lazy. Same three options as Boot 4 — see that
// section of the main Spring Boot course if you need the full writeup.`}
      </CodeBlock>

      <h2>Circular Dependencies — Refused By Default Since 2.6, Not a Boot 3 Fix</h2>
      <p>
        Here is a genuine trap in the opposite direction from most of this section: people who
        learned Spring on Boot 3+ sometimes assume that refusing circular bean dependencies at
        startup was part of the Boot 3 cleanup. It was not — it landed two releases{' '}
        <em>before</em> that, in Boot <strong>2.6</strong>, and 2.7.18 inherits it. Confirmed
        straight from the property metadata inside the real jar:
      </p>

      <CodeBlock language="bash" title="The check">
{`unzip -p spring-boot-2.7.18.jar META-INF/spring-configuration-metadata.json \\
  | jq '.properties[] | select(.name == "spring.main.allow-circular-references")'`}
      </CodeBlock>

      <CodeBlock language="json" title="Real output — Boot 2.7.18">
{`{
  "name": "spring.main.allow-circular-references",
  "type": "java.lang.Boolean",
  "description": "Whether to allow circular references between beans and automatically try to resolve them.",
  "sourceType": "org.springframework.boot.SpringApplication",
  "defaultValue": false
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="So what actually is different about a Boot 2.7 codebase here?">
        <p>
          Nothing about the <em>default</em> behavior — only about what you might find in an{' '}
          <strong>older</strong> Boot 2 codebase that predates 2.6, or one that was upgraded and
          picked up a leftover <code>spring.main.allow-circular-references=true</code> to keep a
          legacy cycle working rather than fixing the design. That property still exists and still
          works on 2.7.18; it is not deprecated the way the properties in the{' '}
          <a href="/springboot2/data">data lesson</a> are. If you find it set to <code>true</code>{' '}
          in a Boot 2 <code>application.yml</code>, treat it as a marked location — someone chose
          not to untangle a cycle, and the note is still legible for exactly that reason.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Resolving one for real — same three options as Boot 4">
{`// Fix #1 — the real fix: extract shared logic into a third bean.
// A cycle is usually a design smell, not a wiring problem.

// Fix #2 — @Lazy on one side. Spring injects a proxy resolved on first use.
@Service
class A {
    private final B b;
    public A(@Lazy B b) { this.b = b; }
}

// Fix #3 — setter injection on one side. Breaks the constructor cycle;
// loses immutability. Least favored, same as on Boot 4.`}
      </CodeBlock>

      <h2>Bean Scopes — No Change</h2>
      <ul>
        <li><strong>singleton</strong> (default) — one instance per context</li>
        <li><strong>prototype</strong> — a new instance every time the bean is requested</li>
        <li><strong>request</strong> — one instance per HTTP request (web apps)</li>
        <li><strong>session</strong> — one instance per HTTP session (web apps)</li>
        <li><strong>application</strong> — one instance per <code>ServletContext</code></li>
      </ul>

      <InfoBox variant="warning" title="Prototype beans in a singleton — same injection trap">
        <p>
          If a singleton <code>@Service</code> injects a <code>@Scope(&quot;prototype&quot;)</code>{' '}
          bean directly, only one prototype instance is ever created — at the singleton&apos;s own
          construction. Get a fresh prototype per call with <code>ObjectProvider</code> or{' '}
          <code>@Lookup</code> method injection, exactly as on Boot 4.
        </p>
      </InfoBox>

      <h2>Component Scanning — And the One Annotation Boot 4 Readers Sometimes Assume Is New</h2>
      <p>
        <code>@SpringBootApplication</code>&apos;s implicit <code>@ComponentScan</code> of the
        current package and sub-packages is unchanged. So is{' '}
        <code>@ConfigurationPropertiesScan</code> — worth calling out specifically, because it{' '}
        <em>feels</em> like a modern addition and is not. It shipped in Boot{' '}
        <strong>2.2</strong>, present in every 2.7.18 jar:
      </p>

      <CodeBlock language="bash" title="The check">
{`unzip -l spring-boot-2.7.18.jar | grep ConfigurationPropertiesScan`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`1001  11-23-2023 07:17   org/springframework/boot/context/properties/ConfigurationPropertiesScan.class
8052  11-23-2023 07:17   org/springframework/boot/context/properties/ConfigurationPropertiesScanRegistrar.class`}
      </CodeBlock>

      <CodeBlock language="java" title="Restricting or extending the scan — identical on both versions">
{`@SpringBootApplication(scanBasePackages = { "com.example.core", "com.example.web" })
public class Application { /* ... */ }

@ComponentScan(
    basePackages = "com.example",
    includeFilters = @Filter(type = FilterType.ANNOTATION, classes = FeatureBean.class),
    excludeFilters = @Filter(type = FilterType.REGEX, pattern = ".*\\.legacy\\..*")
)
public class ScanConfig { }`}
      </CodeBlock>

      <p>
        See the <a href="/springboot2/config">config lesson</a> for the record-vs-class-with-
        constructor binding distinction — <code>@ConfigurationPropertiesScan</code> picks up both
        the same way on 2.7.18, verified there against a live app.
      </p>

      <h2>Testing DI — @MockBean, Not @MockitoBean</h2>
      <p>
        This is the one place in this lesson where writing Boot-4-style code against Boot 2.7
        genuinely fails to compile, and it runs in the opposite direction from what you might
        expect: it is not that Boot 2 is missing something Boot 4 has — it is that a Boot 4
        habit imports something that <strong>does not exist yet</strong> on Framework 5.3.
      </p>

      <CodeBlock language="bash" title="The check — does spring-test 5.3.31 have @MockitoBean?">
{`unzip -l spring-test-5.3.31.jar | grep -i MockitoBean
echo "exit=$?"`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`exit=1
(no match — the class is not in the jar)`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why: @MockitoBean is a Framework 6.2+ type, and 2.7.18 resolves Framework 5.3.31">
        <p>
          <code>@MockitoBean</code>/<code>@MockitoSpyBean</code> live in{' '}
          <strong>Spring Framework</strong> (not Boot), added in <strong>6.2</strong>. Boot 2.7.18
          is pinned to Framework 5.3.31 for its entire life — there is no patch release that moves
          it forward, because Framework is part of the locked version set the{' '}
          <a href="/springboot2/intro">intro lesson</a> described. On 2.7, the correct — and only
          — annotation is <code>@MockBean</code>, from{' '}
          <code>org.springframework.boot.test.mock.mockito</code>. It is not deprecated on this
          version; it is simply the current tool. Don&apos;t rewrite it in a Boot 2 codebase on
          the assumption it&apos;s legacy — it becomes legacy only once <em>that codebase</em>{' '}
          reaches Framework 6.2 (Boot 3.4+).
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Three levels of DI testing — Boot 2.7 imports">
{`// Level 1 — plain unit test. No Spring anywhere. Identical on every version.
class OrderServiceTest {
    @Test void placesOrder() {
        OrderService svc = new OrderService(mock(OrderRepository.class),
                                            mock(PaymentGateway.class),
                                            mock(NotificationService.class));
        // ...
    }
}

// Level 2 — slice test. Loads only the web layer.
import org.springframework.boot.test.mock.mockito.MockBean;   // NOT @MockitoBean

@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockBean OrderService orderService;
    @Test void createsOrder() throws Exception { /* ... */ }
}

// Level 3 — full integration test. Slow; use sparingly. Unchanged.
@SpringBootTest
class ApplicationSmokeTest {
    @Autowired ApplicationContext ctx;
    @Test void contextLoads() { assertNotNull(ctx); }
}`}
      </CodeBlock>

      <h2>Real-World DI Checklist</h2>
      <InfoBox variant="success" title="What good DI looks like in a Boot 2.7 codebase">
        <ul>
          <li>Constructor injection everywhere; every field <code>final</code> — same bar as Boot 4.</li>
          <li>Lifecycle hooks import <code>javax.annotation.PostConstruct</code> /{' '}
              <code>javax.annotation.PreDestroy</code>, not <code>jakarta.annotation.*</code>.</li>
          <li>No self-invocation of <code>@Transactional</code>/<code>@Async</code>/<code>@Cacheable</code> methods.</li>
          <li>Slice tests use <code>@MockBean</code>, not <code>@MockitoBean</code> — the latter will not compile.</li>
          <li>Conditional beans use <code>@ConditionalOnProperty</code> for feature toggling in
              application code; <code>@ConditionalOnMissingBean</code> stays inside real auto-configuration.</li>
          <li>If you see <code>spring.main.allow-circular-references=true</code>, treat it as a
              flagged, unresolved design problem — it is not a Boot-2-only relic, it is an opt-out
              of a default that has existed since 2.6.</li>
          <li>
            <code>@Bean</code> factories for outbound HTTP return <code>RestTemplate</code>, not{' '}
            <code>RestClient</code> — that type doesn&apos;t exist until Framework 6.1. Full detail
            in the <a href="/springboot2/rest">next lesson</a>.
          </li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="A Boot 2.7.18 project fails to compile with 'cannot find symbol: class MockitoBean' after a developer copies a slice test from a Boot 4 codebase. What's actually wrong?"
        options={[
          "A missing spring-boot-starter-test dependency in the pom",
          "@MockitoBean is a Spring Framework 6.2+ type; Boot 2.7.18 resolves Framework 5.3.31, which doesn't contain that class at all — the fix is @MockBean, not a missing dependency",
          "The test class needs @ExtendWith(SpringExtension.class) added manually",
          "MockitoBean was renamed to MockBean in a later 2.7.x patch and the developer used the old name"
        ]}
        correctIndex={1}
        explanation="This runs backwards from most Boot 2 -> Boot 4 traps: it isn't that Boot 2 lost something, it's that Boot 4 gained something that doesn't exist yet on the Framework version 2.7.18 is locked to. @MockitoBean and @MockitoSpyBean live in Spring Framework itself (not Boot), added in Framework 6.2. Boot 2.7.18 resolves Framework 5.3.31 for its entire supported life -- there's no patch that moves it forward, because the Framework/Security/Hibernate versions are a locked set per Boot minor line. spring-test-5.3.31.jar simply doesn't contain the class -- confirmed by unzip -l. The correct, current, non-deprecated annotation on 2.7 is @MockBean from org.springframework.boot.test.mock.mockito. Option 4 has the direction backwards -- MockBean is the original, MockitoBean is the newer replacement, and the replacement only exists starting Framework 6.2 / Boot 3.4."
      />

      <InteractiveChallenge
        question="You're reviewing a Boot 2.7 codebase and find spring.main.allow-circular-references=true in application.yml. A colleague says 'that's just an old Boot 2 thing, Boot 3 fixed it.' Is that accurate?"
        options={[
          "Yes -- circular reference refusal was introduced in Boot 3.0 as part of the Framework 6 cleanup",
          "No -- Spring Boot has always silently allowed circular references via setter injection; the property is a new Boot 3 addition to explicitly enable the old behavior",
          "No -- refusing circular references by default shipped in Boot 2.6, two releases before 2.7; the property already existed and already defaulted to false on 2.7.18. Finding it set to true means someone deliberately opted out of that default, not that they're on an old version that lacks it",
          "Yes, but only for beans wired through @Autowired fields -- constructor-injected cycles were always rejected"
        ]}
        correctIndex={2}
        explanation="Confirmed directly from spring-boot-2.7.18.jar's own configuration metadata: spring.main.allow-circular-references has defaultValue: false on 2.7.18, exactly as it does on Boot 4. The refuse-by-default behavior landed in Boot 2.6 -- a full minor release before 2.7, and years before Boot 3. So finding this property set to true in a Boot 2.7 codebase doesn't mean the app predates the fix; it means somebody hit a real cycle, chose not to redesign around it, and explicitly re-enabled the legacy behavior. That is worth flagging in review on ANY version, including Boot 4, where the same property with the same default still exists."
      />
    </LessonLayout>
  );
}

export default SpringBoot2Di;
