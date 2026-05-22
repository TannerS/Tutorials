import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysdesignMessaging() {
  return (
    <LessonLayout
      title="Messaging Systems"
      sectionId="systemdesign"
      lessonIndex={5}
      prev={{ path: "/systemdesign/distributed", label: "Distributed Systems" }}
      next={{ path: "/systemdesign/interview", label: "System Design Interview" }}
    >
      <p>Message queues and event streaming platforms decouple producers from consumers, enable async processing, and provide backpressure. Key systems: RabbitMQ (task queues), Kafka (event streaming), Redis Streams.</p>
      <FlowChart title="Message Queue vs Event Stream" chart={"graph TD\n  A[Producer] --> B[Message Queue RabbitMQ]\n  B --> C[Consumer 1 - message deleted after consume]\n  A --> D[Event Stream Kafka]\n  D --> E[Consumer Group A]\n  D --> F[Consumer Group B]\n  D --> G[Consumer Group C - all read same events]"} />
      <CodeBlock language="java" title="Kafka Producer and Consumer Patterns">
{`// Kafka producer — reliable delivery
@Service
public class EventPublisher {
    private final KafkaTemplate<String, Object> template;

    public CompletableFuture<SendResult<String, Object>> publish(
            String topic, String key, Object event) {
        return template.send(topic, key, event)
            .thenApply(result -> {
                log.info("Published to {}-{} offset {}",
                    result.getRecordMetadata().topic(),
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());
                return result;
            })
            .exceptionally(ex -> {
                log.error("Failed to publish to {}", topic, ex);
                throw new RuntimeException("Publish failed", ex);
            });
    }
}

// Consumer with manual acknowledgment and error handling
@KafkaListener(
    topics = "order-events",
    groupId = "inventory-service",
    containerFactory = "kafkaListenerContainerFactory"
)
public void handleOrderEvent(
        @Payload OrderEvent event,
        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
        @Header(KafkaHeaders.OFFSET) long offset,
        Acknowledgment ack) {
    try {
        inventoryService.processOrder(event);
        ack.acknowledge();  // commit offset only on success
    } catch (RetryableException e) {
        log.warn("Retryable error for order {}", event.getOrderId());
        // Don't ack — will be retried
    } catch (NonRetryableException e) {
        log.error("Non-retryable error, sending to DLQ: {}", event.getOrderId());
        deadLetterQueue.send(event);
        ack.acknowledge();  // ack to prevent infinite retry
    }
}`}
      </CodeBlock>
      <InteractiveChallenge
        question="What is the key difference between a message queue (RabbitMQ) and an event log (Kafka)?"
        options={["Kafka is faster than RabbitMQ", "Message queues delete messages after consumption; Kafka retains events for all consumers independently", "RabbitMQ supports more message types", "Kafka only works with Java consumers"]}
        correctIndex={1}
        explanation="Message queues (RabbitMQ, SQS): messages are consumed once and deleted — like a work queue distributing tasks to workers. Event logs (Kafka): events are retained and each consumer group reads independently from its own offset — multiple services can independently process the same events, and you can replay history."
      />

    </LessonLayout>
  );
}
