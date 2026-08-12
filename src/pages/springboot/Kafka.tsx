import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Kafka() {
  return (
    <LessonLayout
      title="Kafka in Spring"
      sectionId="springboot"
      lessonIndex={11}
      prev={{ path: '/springboot/transactions', label: 'Transactions Deep-Dive' }}
      next={{ path: '/springboot/aop', label: 'AOP & Interceptors' }}
    >
      <h2>Kafka in One Paragraph</h2>
      <p>
        Apache Kafka is a distributed append-only log organized into topics. Producers write
        records; consumers read them, tracking their own position (the <em>offset</em>).
        Kafka is durable, partitioned for parallelism, and retains messages long enough for
        multiple consumers with different needs to catch up independently. Spring for Apache
        Kafka wraps the Java client with template + listener abstractions, error handling,
        transactions, and integration with Spring Boot's config.
      </p>

      <FlowChart
        title="Producer / Broker / Consumer topology"
        chart={"graph LR\nA[Producer] -->|send| B[Broker Partition 0]\nA -->|send| C[Broker Partition 1]\nA -->|send| D[Broker Partition 2]\nB --> E[Consumer A - partition 0]\nC --> F[Consumer A - partition 1]\nD --> G[Consumer B - partition 2]\nB --> H[Consumer B - partition 0]"}
      />

      <h2>Configuration Basics</h2>
      <CodeBlock language="yaml" title="application.yml — producer + consumer defaults">
{`spring:
  kafka:
    bootstrap-servers: \${KAFKA_BOOTSTRAP:localhost:9092}
    client-id: order-service
    producer:
      key-serializer:   org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all                                # wait for all in-sync replicas
      retries: 5
      properties:
        enable.idempotence: true               # exactly-once producer semantics
        max.in.flight.requests.per.connection: 5
        compression.type: zstd
    consumer:
      group-id: order-service
      key-deserializer:   org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      auto-offset-reset: earliest
      enable-auto-commit: false                # commit manually or via container
      properties:
        spring.json.trusted.packages: com.example.events
        spring.deserializer.value.delegate.class: >
          org.springframework.kafka.support.serializer.JsonDeserializer
    listener:
      ack-mode: MANUAL_IMMEDIATE               # commit only after successful handling
      concurrency: 3                           # threads per @KafkaListener`}
      </CodeBlock>

      <h2>Producing Messages</h2>
      <CodeBlock language="java" title="KafkaTemplate — the workhorse">
{`public record OrderPlaced(UUID orderId, String customerEmail, Instant at) { }

@Service
public class OrderEventPublisher {

    private static final String TOPIC = "orders.placed.v1";
    private final KafkaTemplate<String, Object> kafka;

    public OrderEventPublisher(KafkaTemplate<String, Object> kafka) {
        this.kafka = kafka;
    }

    public CompletableFuture<SendResult<String, Object>> publish(OrderPlaced event) {
        ProducerRecord<String, Object> record =
            new ProducerRecord<>(TOPIC, event.orderId().toString(), event);
        record.headers()
            .add("event-version", "1".getBytes(UTF_8))
            .add("trace-id", TracingContext.current().traceId().getBytes(UTF_8));
        return kafka.send(record);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Always partition on a stable business key">
        <p>
          Records with the same key land on the same partition, which means they arrive
          in order to a consumer. For order events, the order id is the key — every
          "placed / paid / shipped / cancelled" for the same order stays in order. Random
          UUID keys break this and forfeit Kafka's most valuable guarantee.
        </p>
      </InfoBox>

      <h2>Consuming Messages</h2>
      <CodeBlock language="java" title="@KafkaListener with manual acknowledgement">
{`@Component
public class OrderPlacedListener {

    private static final Logger log = LoggerFactory.getLogger(OrderPlacedListener.class);
    private final OrderProjection projection;

    public OrderPlacedListener(OrderProjection projection) {
        this.projection = projection;
    }

    @KafkaListener(topics = "orders.placed.v1", groupId = "order-projector")
    public void onPlaced(ConsumerRecord<String, OrderPlaced> record, Acknowledgment ack) {
        try {
            projection.apply(record.value());
            ack.acknowledge();                      // commit offset AFTER successful handling
        } catch (Exception e) {
            log.error("Failed to process order {}; not acking", record.key(), e);
            // no ack -> broker will redeliver after session timeout
            throw e;                                // triggers configured error handler
        }
    }
}`}
      </CodeBlock>

      <h2>Error Handling and Dead-Letter Topics</h2>
      <p>
        A "poison" message that always fails halts the partition unless you have a
        strategy. Spring Kafka's <code>DefaultErrorHandler</code> retries with backoff,
        then routes the failing record to a dead-letter topic.
      </p>
      <CodeBlock language="java" title="DLT configuration">
{`@Configuration
public class KafkaErrorConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
        // Retry with exponential backoff: 500ms, 1s, 2s, 4s, 8s, then send to DLT.
        var backoff = new ExponentialBackOffWithMaxRetries(5);
        backoff.setInitialInterval(500);
        backoff.setMultiplier(2.0);

        // DLT publisher — writes failed records to "<original-topic>.DLT"
        var recoverer = new DeadLetterPublishingRecoverer(template);
        var handler = new DefaultErrorHandler(recoverer, backoff);

        // Don't retry unrecoverable exceptions — send them to the DLT immediately.
        handler.addNotRetryableExceptions(DeserializationException.class,
                                          IllegalArgumentException.class);
        return handler;
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="DLT topics are a promise, not a solution">
        <p>
          A DLT catches your poison messages so processing doesn't halt. That's it.
          You still need something to <em>read</em> the DLT — alerts, a triage dashboard,
          a manual replay tool. A DLT no one looks at is just a slow leak.
        </p>
      </InfoBox>

      <h2>Deserialization Failures</h2>
      <p>
        A malformed message crashes the deserializer <em>before</em> your listener sees it.
        Without protection, the container loops forever on the same offset. The
        <code>ErrorHandlingDeserializer</code> wraps the failure so the error handler can
        route it to the DLT.
      </p>
      <CodeBlock language="yaml" title="Deserializer chain in application.yml">
{`spring:
  kafka:
    consumer:
      key-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.key.delegate.class:  >
          org.apache.kafka.common.serialization.StringDeserializer
        spring.deserializer.value.delegate.class: >
          org.springframework.kafka.support.serializer.JsonDeserializer`}
      </CodeBlock>

      <h2>Idempotent Consumers</h2>
      <p>
        Kafka delivers at least once. Under retries, network hiccups, and rebalances,
        your listener will see the same record more than once. Handlers must be idempotent
        or you'll double-charge, double-ship, double-count.
      </p>
      <CodeBlock language="java" title="Idempotency by upsert on a business key">
{`@Transactional
public void apply(OrderPlaced event) {
    // MERGE / UPSERT — inserting the same event id twice is a no-op.
    projections.upsert(event.orderId(), event.at(), event.customerEmail());
}

// Or, for events where "already seen" matters:
@Transactional
public void apply(OrderPlaced event) {
    if (processed.exists(event.orderId(), "orderPlaced")) return;
    projections.insert(event);
    processed.mark(event.orderId(), "orderPlaced");
}`}
      </CodeBlock>

      <h2>Transactional Outbox</h2>
      <p>
        You cannot atomically save to the DB and publish to Kafka in a single transaction —
        they're two systems. The outbox pattern solves it:
      </p>
      <ol>
        <li>The service inserts the domain row AND an "outbox" row in the same DB
            transaction.</li>
        <li>A background poller (or Debezium/CDC) reads outbox rows and publishes them to
            Kafka.</li>
        <li>On successful publish, the outbox row is marked sent (or deleted).</li>
      </ol>
      <CodeBlock language="java" title="Outbox sketch">
{`@Transactional
public Order place(NewOrderRequest req) {
    Order o = orders.save(Order.from(req));
    outbox.enqueue("orders.placed.v1", o.id().toString(),
                   new OrderPlaced(o.id(), req.email(), Instant.now()));
    return o;
}

@Scheduled(fixedDelayString = "\${outbox.poll-ms:200}")
@Transactional
public void relay() {
    List<OutboxRow> batch = outbox.claimBatch(100);
    for (OutboxRow row : batch) {
        kafka.send(row.topic(), row.key(), row.payload())
            .whenComplete((res, ex) -> {
                if (ex == null) outbox.markSent(row.id());
                // failures stay pending — next tick retries.
            });
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Or use Debezium">
        <p>
          For high-volume services, Debezium tails the database's write-ahead log and
          publishes to Kafka for you — no polling, no missed rows. More moving parts to
          operate, but zero application-level poller.
        </p>
      </InfoBox>

      <h2>Testing Kafka Consumers</h2>
      <CodeBlock language="java" title="EmbeddedKafka slice test">
{`@SpringBootTest
@EmbeddedKafka(topics = "orders.placed.v1", partitions = 3)
class OrderPlacedListenerTest {

    @Autowired KafkaTemplate<String, Object> kafka;
    @MockitoBean OrderProjection projection;

    @Test
    void appliesEventToProjection() throws Exception {
        var event = new OrderPlaced(UUID.randomUUID(), "a@b.com", Instant.now());
        kafka.send("orders.placed.v1", event.orderId().toString(), event).get();

        verify(projection, timeout(3000)).apply(event);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer TestContainers Kafka for anything non-trivial">
        <p>
          <code>@EmbeddedKafka</code> works but has flakiness under parallel test runs.
          TestContainers with a real broker (Confluent's cp-kafka image) is more stable
          and gives you the exact broker version your prod uses.
        </p>
      </InfoBox>

      <h2>Container Factories — When You Need Multiple Consumers</h2>
      <p>
        Different topics often need different concurrency, batch sizes, or error handling.
        Container factories let you define these per-listener.
      </p>
      <CodeBlock language="java" title="Custom container factory for a batch listener">
{`@Bean
public ConcurrentKafkaListenerContainerFactory<String, Metric> metricsBatchFactory(
        ConsumerFactory<String, Metric> cf) {
    var factory = new ConcurrentKafkaListenerContainerFactory<String, Metric>();
    factory.setConsumerFactory(cf);
    factory.setBatchListener(true);
    factory.setConcurrency(6);
    factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.BATCH);
    return factory;
}

@KafkaListener(topics = "metrics", containerFactory = "metricsBatchFactory")
public void ingest(List<ConsumerRecord<String, Metric>> batch) { /* ... */ }`}
      </CodeBlock>

      <h2>Kafka Streams — When Simple Consumers Aren't Enough</h2>
      <p>
        For continuous transformations (join two topics, aggregate over windows, materialize
        a state store), Kafka Streams gives you a fluent DSL. Not the first tool to reach
        for; not the last either.
      </p>
      <CodeBlock language="java" title="A minimal Streams topology">
{`@Component
public class OrderEnrichmentTopology {
    @Autowired
    public void topology(StreamsBuilder builder) {
        KStream<String, OrderPlaced> orders = builder.stream("orders.placed.v1");
        GlobalKTable<String, Customer> customers = builder.globalTable("customers");

        KStream<String, EnrichedOrder> enriched = orders
            .join(customers,
                  (orderKey, order) -> order.customerId().toString(),
                  EnrichedOrder::of);

        enriched.to("orders.enriched.v1");
    }
}`}
      </CodeBlock>

      <h2>Observability for Kafka</h2>
      <p>
        Spring for Kafka integrates with Micrometer, so producer and consumer metrics
        appear at <code>/actuator/prometheus</code> out of the box:
      </p>
      <CodeBlock language="text" title="Metrics you'll actually monitor">
{`kafka_consumer_records_lag                 Records not yet consumed per partition.
kafka_consumer_records_lag_max             Maximum lag across all partitions.
kafka_consumer_bytes_consumed_total        Throughput.
kafka_producer_record_send_total           How much your service produces.
kafka_producer_record_error_total          Failed sends.

Alert on: lag_max > threshold, error_total delta > 0 sustained, consumer_group
membership changes (rebalance storm indicator).`}
      </CodeBlock>

      <h2>Kafka Checklist</h2>
      <InfoBox variant="success" title="Signs your Kafka integration is healthy">
        <ul>
          <li>Producer has <code>acks=all</code> and <code>enable.idempotence=true</code>.</li>
          <li>Records are keyed on a stable business identifier so ordering per key is
              preserved.</li>
          <li>Consumers use manual ack (<code>MANUAL_IMMEDIATE</code>) — offsets only
              commit after successful handling.</li>
          <li>Deserialization failures are handled via
              <code>ErrorHandlingDeserializer</code> + DLT.</li>
          <li>Listener handlers are idempotent (upsert or dedupe table).</li>
          <li>Cross-system atomicity uses the transactional outbox.</li>
          <li>DLTs have an owner and an alert.</li>
          <li>Kafka metrics ship to Prometheus and lag is alarmed.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Your consumer occasionally processes the same event twice, causing duplicate side effects. What's the correct response?"
        options={[
          "Configure enable.auto.commit=true so offsets commit before the handler runs",
          "Set isolation.level=read_committed on the consumer",
          "Make the handler idempotent — Kafka delivers at least once by design, so double delivery is expected under retries and rebalances. Idempotency (upsert on a business key or a dedupe table) is the only safe response.",
          "Increase max.poll.records so each poll processes more at once"
        ]}
        correctIndex={2}
        explanation="Kafka guarantees at-least-once delivery. Rebalances, network hiccups, and consumer restarts all cause the same offset to be re-read. Auto-commit BEFORE the handler runs makes the problem worse (loses messages on failure), not better. The only safe design is idempotent handlers — usually an UPSERT or a 'processed events' dedupe table keyed by business id + event type."
      />
    </LessonLayout>
  );
}
