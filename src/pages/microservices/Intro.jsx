import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function MicroservicesIntro() {
  return (
    <LessonLayout
      title="Microservices Introduction"
      sectionId="microservices"
      lessonIndex={0}
      prev={{ path: "/react-antipatterns/bestpractices", label: "React Best Practices" }}
      next={{ path: "/microservices/patterns", label: "Microservices Patterns" }}
    >
      <p>Microservices is an architectural style where an application is built as a collection of small, independently deployable services, each owning its own data and communicating over networks. Contrast with a monolith, where all functionality is deployed as a single unit.</p>

      <h2>Monolith vs Microservices</h2>

      <FlowChart
        title="Monolith vs Microservices Architecture"
        chart={"graph TD\n  A[Monolith] --> B[UI Layer]\n  A --> C[Business Logic]\n  A --> D[Data Layer]\n  A --> E[Single DB]\n  F[Microservices] --> G[User Service]\n  F --> H[Order Service]\n  F --> I[Payment Service]\n  G --> J[Users DB]\n  H --> K[Orders DB]\n  I --> L[Payments DB]"}
      />

      <CodeBlock language="java" title="Microservice — Spring Boot Example">
{`// Each microservice is its own Spring Boot application
@SpringBootApplication
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}

// Owns its own domain — orders only
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;
    private final UserServiceClient userClient;  // HTTP client to User service

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(@RequestBody CreateOrderRequest req) {
        // Verify user exists via HTTP call to User service
        UserDto user = userClient.getUser(req.getUserId());
        if (user == null) return ResponseEntity.badRequest().build();

        Order order = orderService.create(req.getUserId(), req.getItems());
        return ResponseEntity.status(201).body(OrderDto.from(order));
    }
}

// application.yml — each service has its own config
server:
  port: 8082
spring:
  application:
    name: order-service
  datasource:
    url: jdbc:postgresql://localhost:5432/orders_db  # owns its own DB!`}
      </CodeBlock>

      <h2>When to Use Microservices</h2>
      <p>Microservices add operational complexity. Use them when: teams are large enough (Conway's Law — architecture mirrors org structure), independent scaling is needed, services have clearly different scaling profiles, or independent deployment of parts is a business requirement. For most startups and small teams, a well-structured monolith is simpler and faster to develop.</p>

      <InfoBox variant="warning" title="Distributed System Fallacies">
        <p>The network is NOT reliable. Latency is NOT zero. Bandwidth is NOT infinite. Services WILL fail. These 8 fallacies of distributed computing mean microservices require circuit breakers, retries, timeouts, and eventual consistency patterns that add significant complexity compared to a monolith.</p>
      </InfoBox>

      <CodeBlock language="java" title="Service Discovery with Eureka">
{`// Register service with Eureka
@SpringBootApplication
@EnableEurekaClient
public class OrderService { ... }

# application.yml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true

// Call other services by name, not hardcoded URL
@FeignClient(name = "user-service")  // resolved via Eureka
public interface UserServiceClient {
    @GetMapping("/api/users/{id}")
    UserDto getUser(@PathVariable Long id);
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="What is the key rule about data ownership in microservices?"
        options={["All services share one central database", "Each service owns its own database and other services cannot query it directly", "Services use a shared read replica for queries", "Data is stored in a global cache accessible by all services"]}
        correctIndex={1}
        explanation="Database-per-service is a core microservices pattern. Each service owns its data exclusively — other services must request it via the service's API, not by querying the database directly. This ensures loose coupling; changing a service's data schema won't break other services."
      />

    </LessonLayout>
  );
}
