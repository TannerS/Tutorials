import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringDi() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java + Spring Boot 4 · Field Reference"
      title="Spring DI & Beans"
      tagline="Stereotypes, constructor injection, bean wiring, and the proxy gotcha that bites everyone once — condensed for offline study."
      meta={['Spring Boot 4', '13 patterns']}
      footerLabel="Personal study reference — Spring Boot"
      pageLabel="Java + Spring Field Guide · DI & Beans"
      prev={{ path: '/java-field-guide/concurrency', label: 'Concurrency & Virtual Threads' }}
      next={{ path: '/java-field-guide/spring-rest', label: 'Spring REST & Validation' }}
    >
      <PosterCard
        glyph="St"
        title={<>Stereotype<span className="dim"> annotations</span></>}
        language="java"
        code={`@Component               // generic Spring-managed bean
public class EmailValidator { }

@Service                 // business logic layer
public class UserService { }

@Repository              // data access — adds JDBC/JPA
public class UserRepository { }  // exception translation

@RestController           // @Controller + @ResponseBody
public class UserController { }`}
        caption="All four register the class as a bean the same way. @Repository is the one that truly differs — it translates driver exceptions into Spring's DataAccessException hierarchy."
      />

      <PosterCard
        glyph="Ci"
        title={<>Constructor injection<span className="dim"> — the default</span></>}
        language="java"
        code={`@Service
public class OrderService {
    private final OrderRepository orders;
    private final PaymentGateway payments;

    // @Autowired not required on the sole constructor
    // since Spring 4.3.
    public OrderService(OrderRepository orders,
                        PaymentGateway payments) {
        this.orders = orders;
        this.payments = payments;
    }
}`}
        caption="Makes dependencies explicit, allows final fields, and guarantees the bean is never partially constructed. Trivially unit-testable with plain mocks — no Spring context needed."
      />

      <PosterCard
        glyph="Fi"
        title={<>Field injection<span className="dim"> — avoid</span></>}
        language="java"
        code={`@Service
public class OrderService {
    @Autowired
    private OrderRepository orders;   // hides deps,
                                        // no final,
                                        // untestable
}                                      // without reflection`}
        caption="Works, but hides the dependency graph and prevents final fields. If you see field injection in a new codebase, treat it as a smell — constructor injection is the modern default."
      />

      <PosterCard
        glyph="Lb"
        title={<>Lombok<span className="dim"> @RequiredArgsConstructor</span></>}
        language="java"
        code={`@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orders;
    private final PaymentGateway payments;
    // Lombok generates the all-final-args constructor.
    // Same DI behavior, less boilerplate.
}`}
        caption="Drops the hand-written constructor. Optional — plain constructors work identically and skip the build-time annotation-processor dependency."
      />

      <PosterCard
        glyph="Bn"
        title={<>@Bean<span className="dim"> + @Configuration</span></>}
        language="java"
        code={`@Configuration
public class AppConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    // Method name becomes bean name unless
    // overridden with @Bean("name").
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory f) {
        return new RedisCacheManager(f);
    }
}`}
        caption="Use for beans that need custom construction, or third-party classes you can't annotate with @Component. Method parameters are injected from the container."
      />

      <PosterCard
        glyph="Cx"
        title={<>@Configuration<span className="dim"> proxy vs @Component</span></>}
        language="java"
        code={`// Full @Configuration classes are CGLIB-proxied so an
// intra-class @Bean call returns the SAME singleton.
// @Component as a config class loses that guarantee —
// calling one @Bean method from another makes a new
// instance instead of reusing the container's bean.`}
        caption="Use @Configuration (not @Component) for any class that composes beans internally by calling one @Bean method from another."
      />

      <PosterCard
        glyph="Ql"
        title={<>@Qualifier<span className="dim"> — name the bean</span></>}
        language="java"
        code={`@Service("stripeGateway")
public class StripePaymentGateway implements PaymentGateway { }

@Service("paypalGateway")
public class PaypalPaymentGateway implements PaymentGateway { }

@Service
public class CheckoutService {
    public CheckoutService(
            @Qualifier("stripeGateway") PaymentGateway gw) { }
}`}
        caption="Two beans implementing the same interface throw NoUniqueBeanDefinitionException. @Qualifier resolves the ambiguity at the exact injection site."
      />

      <PosterCard
        glyph="Pr"
        title={<>@Primary<span className="dim"> — the default choice</span></>}
        language="java"
        code={`@Service
@Primary
public class StripePaymentGateway implements PaymentGateway { }

@Service
public class PaypalPaymentGateway implements PaymentGateway { }

// Consumers with no qualifier get Stripe automatically.
// PayPal still reachable via @Qualifier("paypalPaymentGateway").`}
        caption="Marks the default implementation when multiple beans exist and most call sites don't care which one — a minority of call sites can still @Qualifier around it."
      />

      <PosterCard
        glyph="Co"
        title={<>@ConditionalOnProperty<span className="dim"> — feature toggle</span></>}
        language="java"
        code={`@Service
@ConditionalOnProperty(prefix = "features.notifications",
    name = "enabled", havingValue = "true")
public class RealNotificationService
        implements NotificationService { }

@Service
@ConditionalOnMissingBean(NotificationService.class)
public class NoopNotificationService
        implements NotificationService { }  // fallback`}
        caption="Beans exist or not based on runtime config — no if-branches in consumer code. The no-op fallback is wired in automatically whenever the real bean is absent."
      />

      <PosterCard
        glyph="Ls"
        title={<>Inject a List<span className="dim">&lt;T&gt; of every impl</span></>}
        language="java"
        code={`public interface DocumentExporter {
    String format();
}

@Service
public class ReportExportService {
    private final Map<String, DocumentExporter> exporters;

    // Spring injects every DocumentExporter bean found.
    // Adding a new exporter is zero code changes here.
    public ReportExportService(List<DocumentExporter> found) {
        this.exporters = found.stream()
            .collect(toMap(DocumentExporter::format, identity()));
    }
}`}
        caption="The DI-level strategy/plugin pattern. Spring collects every bean of a given type into a List or Map — a common enterprise idiom for extensible pipelines."
      />

      <PosterCard
        glyph="!"
        badge="Gotcha"
        title={<>Self-invocation<span className="dim"> bypasses the proxy</span></>}
        language="java"
        code={`@Service
public class ReportService {
    @Transactional
    public void generateBatch(List<Request> reqs) {
        for (var r : reqs) {
            this.generateOne(r);  // WRONG: bypasses proxy —
        }                        // REQUIRES_NEW is ignored
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateOne(Request r) { }
}`}
        caption="The single most common Spring gotcha. Spring adds AOP behavior (@Transactional, @Async, @Cacheable) via a proxy wrapping your bean — calling this.foo() from inside the class goes straight to the method, skipping the proxy entirely."
      />

      <PosterCard
        glyph="Fx"
        title={<>Fixing self-invocation<span className="dim"> — three ways</span></>}
        language="java"
        code={`// 1. Split into a separate bean (cleanest).
class BatchService {
    private final ReportService reportService;
    void run(List<Request> r) {
        r.forEach(reportService::generateOne); // via proxy
    }
}

// 2. Inject yourself with @Lazy (breaks the cycle).
public ReportService(@Lazy ReportService self) { this.self = self; }

// 3. AopContext.currentProxy() — needs exposeProxy=true. Last resort.`}
        caption="Extracting the inner call into a separate bean is usually the cleanest fix — it goes through the real proxy instead of a raw 'this' call."
      />

      <PosterCard
        glyph="Sc"
        title={<>Bean scopes<span className="dim"> — singleton vs prototype</span></>}
        language="java"
        code={`@Service                     // default — one instance
public class UserService { } // per ApplicationContext

@Scope("prototype")          // a new instance every
@Component                   // time the bean is requested
public class ReportBuilder { }

// Singleton injecting a prototype: only ONE prototype
// instance is ever created (at construction time).
// Use ObjectProvider or @Lookup for a fresh one per call.`}
        caption="Singleton is the default and covers almost everything. The prototype-in-singleton trap is the one to remember: without ObjectProvider or method injection you silently get a single shared instance."
      />

      <PosterQuickRef
        title="Which DI tool do I need?"
        rows={[
          { need: 'Wire a dependency', answer: 'Constructor injection — never field injection' },
          { need: 'Third-party class as a bean', answer: '@Bean inside @Configuration' },
          { need: 'Two beans, same interface', answer: '@Qualifier (specific) or @Primary (default)' },
          { need: 'Toggle a bean by config', answer: '@ConditionalOnProperty / @ConditionalOnMissingBean' },
          { need: 'Plugin / strategy pattern', answer: 'Inject List<T> or Map<String,T>' },
          { need: 'Optional dependency', answer: 'Optional<T> or ObjectProvider<T>' },
          { need: '@Transactional not firing', answer: 'Check for self-invocation via this.method()' },
          { need: 'Fresh instance per call', answer: '@Scope("prototype") + ObjectProvider, never plain inject' },
          { need: 'Circular bean dependency', answer: 'Extract shared concern into a third bean, or @Lazy' },
          { need: 'Init/teardown hooks', answer: '@PostConstruct / @PreDestroy' },
        ]}
      />
    </PosterLayout>
  );
}
