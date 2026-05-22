import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function MicroservicesPatterns() {
  return (
    <LessonLayout
      title="Microservices Patterns"
      sectionId="microservices"
      lessonIndex={1}
      prev={{ path: "/microservices/intro", label: "Microservices Introduction" }}
      next={{ path: "/microservices/communication", label: "Communication Patterns" }}
    >
      <p>Several architectural patterns address the challenges of microservices: API Gateway, Circuit Breaker, Saga, CQRS, and Event Sourcing. Each solves a specific distributed system problem.</p>

      <h2>API Gateway</h2>

      <FlowChart
        title="API Gateway Pattern"
        chart={"graph LR\n  A[Client] --> B[API Gateway]\n  B --> C[Auth Service]\n  B --> D[Order Service]\n  B --> E[Product Service]\n  B --> F[User Service]\n  B -- rate limit --> G[Rate Limiter]\n  B -- cache --> H[Cache]"}
      />

      <CodeBlock language="yaml" title="Spring Cloud Gateway Configuration">
{`# API Gateway routes in application.yml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service        # lb:// = load-balanced via Eureka
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1
            - name: CircuitBreaker
              args:
                name: userService
                fallbackUri: forward:/fallback/users

        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20`}
      </CodeBlock>

      <h2>Circuit Breaker</h2>

      <CodeBlock language="java" title="Circuit Breaker with Resilience4j">
{`// Prevents cascade failures — if User service is down, fail fast
@Service
public class OrderService {
    private final UserServiceClient userClient;

    @CircuitBreaker(name = "userService", fallbackMethod = "getUserFallback")
    @Retry(name = "userService")
    @TimeLimiter(name = "userService")
    public UserDto getUser(Long userId) {
        return userClient.getUser(userId);
    }

    // Called when circuit is open or all retries exhausted
    public UserDto getUserFallback(Long userId, Exception ex) {
        log.warn("User service unavailable for {}, using fallback", userId);
        return UserDto.anonymous();  // graceful degradation
    }
}

# application.yml — circuit breaker config
resilience4j:
  circuitbreaker:
    instances:
      userService:
        slidingWindowSize: 10
        failureRateThreshold: 50        # open if 50% of 10 calls fail
        waitDurationInOpenState: 10000  # wait 10s before half-open
        permittedNumberOfCallsInHalfOpenState: 3`}
      </CodeBlock>

      <h2>Saga Pattern for Distributed Transactions</h2>

      <CodeBlock language="java" title="Choreography-Based Saga">
{`// Each service reacts to events and publishes compensating events on failure
// No central coordinator — services choreograph themselves

// Step 1: Order service creates order, publishes event
@Service
public class OrderService {
    public void createOrder(CreateOrderRequest req) {
        Order order = new Order(req, OrderStatus.PENDING);
        orderRepo.save(order);
        eventBus.publish(new OrderCreatedEvent(order.getId(), order.getUserId(), order.getTotal()));
    }

    @EventListener
    public void onPaymentFailed(PaymentFailedEvent event) {
        orderRepo.findById(event.getOrderId())
            .ifPresent(o -> { o.setStatus(CANCELLED); orderRepo.save(o); });
        // Compensating transaction
    }
}

// Step 2: Payment service listens, processes payment
@Service
public class PaymentService {
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        try {
            processPayment(event.getUserId(), event.getTotal());
            eventBus.publish(new PaymentSucceededEvent(event.getOrderId()));
        } catch (PaymentException e) {
            eventBus.publish(new PaymentFailedEvent(event.getOrderId(), e.getMessage()));
        }
    }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="CQRS — Command Query Responsibility Segregation">
        <p>CQRS separates the write model (Commands — create/update/delete) from the read model (Queries — optimized for reads, possibly denormalized). This allows independent scaling of reads and writes and enables optimized read models tailored to specific UI needs.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What problem does the Circuit Breaker pattern solve in microservices?"
        options={["Ensures database transactions span multiple services", "Prevents cascade failures by failing fast when a downstream service is unavailable", "Routes requests to the correct service", "Synchronizes data between service databases"]}
        correctIndex={1}
        explanation="Circuit Breaker prevents cascade failures. Without it, when Service B is slow or down, Service A's threads pile up waiting, eventually exhausting its thread pool and causing A to fail too. Circuit Breaker detects failure and opens the circuit, returning errors immediately without waiting — protecting A."
      />

    </LessonLayout>
  );
}
