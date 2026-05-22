import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringAdvanced() {
  return (
    <LessonLayout
      title="Advanced Spring Boot"
      sectionId="springboot"
      lessonIndex={9}
      prev={{ path: "/springboot/error", label: "Error Handling" }}
      next={null}
    >
      <p>Advanced Spring Boot features: AOP, caching, scheduling, async execution, actuator metrics, and application events.</p>

      <h2>AOP — Aspect-Oriented Programming</h2>
      <CodeBlock language="java" title="Cross-Cutting Concerns with AOP">
{`@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    // Pointcut: all methods in service package
    @Pointcut("execution(* com.example.service.*.*(..))")
    private void serviceMethods() {}

    // Before advice — runs before method
    @Before("serviceMethods()")
    public void logEntry(JoinPoint jp) {
        log.info("Calling {} with args: {}", jp.getSignature(), jp.getArgs());
    }

    // Around advice — wraps method execution
    @Around("serviceMethods()")
    public Object measureTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = pjp.proceed();  // call the actual method
        long elapsed = System.currentTimeMillis() - start;
        log.info("{} took {}ms", pjp.getSignature(), elapsed);
        return result;
    }
}`}
      </CodeBlock>

      <h2>Caching</h2>
      <CodeBlock language="java" title="Spring Cache Abstraction">
{`@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users", "products");
        // Or: RedisCacheManager.create(redisConnectionFactory());
    }
}

@Service
public class ProductService {

    @Cacheable("products")  // cache result; use id as key
    public Product findById(Long id) {
        return productRepo.findById(id).orElseThrow();
    }

    @CachePut(value = "products", key = "#product.id")  // update cache
    public Product update(Product product) {
        return productRepo.save(product);
    }

    @CacheEvict(value = "products", key = "#id")  // remove from cache
    public void delete(Long id) {
        productRepo.deleteById(id);
    }

    @CacheEvict(value = "products", allEntries = true)  // clear all
    public void clearCache() {}
}`}
      </CodeBlock>

      <h2>Scheduling and Async</h2>
      <CodeBlock language="java" title="@Scheduled and @Async">
{`@SpringBootApplication
@EnableScheduling
@EnableAsync
public class MyApp { ... }

@Component
public class ReportScheduler {

    @Scheduled(cron = "0 0 8 * * MON-FRI")  // 8am weekdays
    public void generateDailyReport() {
        System.out.println("Generating daily report...");
    }

    @Scheduled(fixedDelay = 5000)   // 5 seconds after last run completes
    @Scheduled(fixedRate = 10000)   // every 10 seconds regardless of completion
    public void cleanup() { ... }
}

@Service
public class EmailService {

    @Async  // run this method in a thread pool, caller gets a Future
    public CompletableFuture<Void> sendWelcomeEmail(String to) {
        // Long-running email sending
        emailClient.send(to, "Welcome!");
        return CompletableFuture.completedFuture(null);
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Spring Boot Actuator">
        <p>Add spring-boot-starter-actuator for production-ready monitoring endpoints: /actuator/health, /actuator/metrics, /actuator/info, /actuator/env. Integrates with Prometheus and Grafana for metrics dashboards. Secure these endpoints in production.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does @Cacheable do when called with the same argument twice?"
        options={["Throws an exception on the second call", "Runs the method twice and caches the last result", "Returns the cached result on the second call without executing the method", "It has no effect"]}
        correctIndex={2}
        explanation="@Cacheable intercepts the method call, checks the cache for the key (default: method arguments), and returns the cached value if found — completely skipping method execution. Only on a cache miss does it execute the method and store the result."
      />
    </LessonLayout>
  );
}
