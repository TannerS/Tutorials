import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function MicroservicesComm() {
  return (
    <LessonLayout
      title="Communication Patterns"
      sectionId="microservices"
      lessonIndex={2}
      prev={{ path: "/microservices/patterns", label: "Microservices Patterns" }}
      next={{ path: "/microservices/data", label: "Data Management" }}
    >
      <p>Microservices communicate via synchronous (HTTP/gRPC) or asynchronous (message queues) channels. Choosing the right communication style is critical — synchronous is simpler but creates tight coupling; asynchronous is resilient but more complex.</p>

      <h2>Synchronous: REST vs gRPC</h2>

      <CodeBlock language="java" title="REST Client with WebClient">
{`// Spring WebFlux WebClient — non-blocking HTTP
@Component
public class ProductServiceClient {
    private final WebClient client;

    public ProductServiceClient(WebClient.Builder builder,
                                @Value("${services.product.url}") String url) {
        this.client = builder.baseUrl(url)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    public Mono<ProductDto> getProduct(String productId) {
        return client.get()
            .uri("/api/products/{id}", productId)
            .retrieve()
            .onStatus(HttpStatus::is4xxClientError, r -> Mono.error(new ProductNotFoundException(productId)))
            .onStatus(HttpStatus::is5xxServerError, r -> Mono.error(new ServiceUnavailableException()))
            .bodyToMono(ProductDto.class)
            .timeout(Duration.ofSeconds(3))
            .retryWhen(Retry.backoff(3, Duration.ofMillis(500)));
    }
}`}
      </CodeBlock>

      <h2>Asynchronous: Message-Driven</h2>

      <CodeBlock language="java" title="Kafka Producer and Consumer">
{`// Producer — Order service publishes events
@Service
public class OrderEventPublisher {
    private final KafkaTemplate<String, Object> kafka;

    public void orderPlaced(Order order) {
        OrderPlacedEvent event = new OrderPlacedEvent(
            order.getId(), order.getUserId(), order.getItems(), Instant.now()
        );
        kafka.send("order-events", order.getId().toString(), event)
             .addCallback(
                 result -> log.info("Published order event: {}", order.getId()),
                 ex     -> log.error("Failed to publish order event", ex)
             );
    }
}

// Consumer — Notification service handles events independently
@Component
public class NotificationConsumer {
    @KafkaListener(topics = "order-events", groupId = "notification-service")
    public void handleOrderPlaced(OrderPlacedEvent event,
                                  Acknowledgment ack) {
        try {
            emailService.sendOrderConfirmation(event.getUserId(), event.getOrderId());
            ack.acknowledge();  // commit offset only on success
        } catch (Exception e) {
            log.error("Failed to process event {}", event.getOrderId(), e);
            // Don't ack — message will be retried
        }
    }
}`}
      </CodeBlock>

      <FlowChart
        title="Sync vs Async Communication"
        chart={"graph TD\n  A[Communication Need] --> B{Real-time response required?}\n  B -- Yes --> C[Synchronous REST or gRPC]\n  B -- No --> D[Asynchronous messaging]\n  C --> E{High throughput?}\n  E -- Yes --> F[gRPC]\n  E -- No --> G[REST]\n  D --> H{Simple queue?}\n  H -- Yes --> I[RabbitMQ]\n  H -- No --> J[Kafka - ordered log]"}
      />

      <InfoBox variant="tip" title="Idempotency is Essential">
        <p>In async systems, messages can be delivered more than once (at-least-once delivery). Design consumers to be idempotent — processing the same message twice produces the same result. Use an idempotency key (typically the event ID) and check if it has already been processed before acting.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the key advantage of asynchronous messaging over synchronous HTTP calls between microservices?"
        options={["It is always faster", "Services are decoupled — the producer does not wait for the consumer, and the consumer can be unavailable temporarily", "It provides stronger consistency guarantees", "It requires less infrastructure"]}
        correctIndex={1}
        explanation="Async messaging decouples services in time. The producer publishes a message and continues — it doesn't care if the consumer is slow or temporarily down. Messages queue up and are processed when the consumer recovers. This provides resilience and temporal decoupling at the cost of eventual consistency."
      />

    </LessonLayout>
  );
}
