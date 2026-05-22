import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysdesignScaling() {
  return (
    <LessonLayout
      title="Scaling Patterns"
      sectionId="systemdesign"
      lessonIndex={1}
      prev={{ path: "/systemdesign/intro", label: "System Design Fundamentals" }}
      next={{ path: "/systemdesign/caching", label: "Caching Strategies" }}
    >
      <p>Scaling means handling growing load. Vertical scaling (bigger machine) is simple but has limits. Horizontal scaling (more machines) is complex but unlimited. Most modern systems use horizontal scaling with load balancers.</p>
      <FlowChart title="Scaling Architecture" chart={"graph LR\n  A[Clients] --> B[Load Balancer]\n  B --> C[App Server 1]\n  B --> D[App Server 2]\n  B --> E[App Server 3]\n  C & D & E --> F[Primary DB]\n  F --> G[Read Replica 1]\n  F --> H[Read Replica 2]\n  C & D & E --> I[Redis Cache]"} />
      <CodeBlock language="java" title="Horizontal Scaling Patterns">
{`// STATELESS APPLICATION — key for horizontal scaling
// BAD: state in application server memory
@RestController
public class CartController {
    private final Map<String,Cart> carts = new HashMap<>(); // server-local!
    // If request goes to Server 2, cart is gone!
}

// GOOD: state externalized to Redis
@RestController
public class CartController {
    private final RedisTemplate<String,Cart> redis;
    public Cart getCart(String userId) { return redis.opsForValue().get("cart:" + userId); }
    public void updateCart(String userId, Cart cart) { redis.opsForValue().set("cart:" + userId, cart, Duration.ofHours(24)); }
}

// DATABASE READ SCALING with read replicas
@Configuration
public class DataSourceConfig {
    @Primary
    @Bean public DataSource writeDataSource() { return createDS("primary-host"); }
    @Bean public DataSource readDataSource()  { return createDS("replica-host"); }
}

@Service
public class ProductService {
    @Transactional(readOnly = true)  // Spring routes to read replica
    public List<Product> findAll() { return repo.findAll(); }

    @Transactional  // routes to primary
    public Product create(Product p) { return repo.save(p); }
}`}
      </CodeBlock>
      <InteractiveChallenge
        question="Why must application servers be stateless to enable horizontal scaling?"
        options={["Stateless servers use less memory", "Stateless servers can be replaced without data loss, and any server can handle any request regardless of which server handled prior requests", "Stateless servers are faster", "Load balancers only work with stateless servers"]}
        correctIndex={1}
        explanation="If a server holds session state in memory, a user whose request goes to a different server after the first request will lose their session. Stateless design externalizes all state (sessions, carts, user data) to shared stores (Redis, databases). Any server can then handle any request, enabling free addition/removal of servers."
      />

    </LessonLayout>
  );
}
