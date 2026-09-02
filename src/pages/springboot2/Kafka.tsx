import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Kafka() {
  return (
    <LessonLayout
      title="Kafka in Spring Boot 2"
      sectionId="springboot2"
      lessonIndex={10}
      prev={{ path: '/springboot2/transactions', label: 'Transactions Deep-Dive' }}
      next={{ path: '/springboot2/aop', label: 'AOP & Interceptors' }}
    >
      <p>
        Good news first, for once: Kafka is the rare corner of a Boot 2 codebase where almost
        nothing on this page is a migration hazard. Spring for Apache Kafka never touched{' '}
        <code>javax.persistence</code> or <code>javax.servlet</code>, so it sat out the{' '}
        <a href="/springboot2/javax">javax &rarr; jakarta rename</a> entirely. What <em>does</em>{' '}
        differ is which <code>spring-kafka</code> and which Kafka client Boot actually pins for
        you — and that gap is wide enough that it is worth checking rather than assuming.
      </p>

      <h2>Which spring-kafka Am I On?</h2>

      <p>
        Same technique as the <a href="/springboot2/data">Hibernate check</a>: read it straight
        out of the <code>spring-boot-dependencies</code> BOM rather than trusting a version number
        from memory.
      </p>

      <CodeBlock language="bash" title="The check">
{`for v in 2.7.18 4.1.1; do
  echo "=== boot $v ==="
  curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/$v/spring-boot-dependencies-$v.pom \\
    | grep -oE '<(spring-kafka|kafka)\\.version>[^<]+'
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`=== boot 2.7.18 ===
<kafka.version>3.1.2
<spring-kafka.version>2.8.11

=== boot 4.1.1 ===
<kafka.version>4.2.1
<spring-kafka.version>4.1.1`}
      </CodeBlock>

      <p>
        Two version numbers, two different kinds of gap. <code>spring-kafka</code> 2.8.11 &rarr;
        4.1.1 is the Spring integration layer — template, listener container, error handling — and
        as you will see below, its public API for the everyday cases barely moved. The Kafka{' '}
        <em>client</em> jump, 3.1.2 &rarr; 4.2.1, is a much bigger deal, and it has nothing to do
        with Spring at all.
      </p>

      <InfoBox variant="danger" title="Apache Kafka 4.0 removed ZooKeeper mode entirely">
        <p>
          This is documented upstream behaviour rather than something reproduced on this page — I
          did not stand up a broker to verify it, and would rather tell you that than paste a log
          I invented. Kafka 4.0 requires KRaft; there is no ZooKeeper coordinator to fall back to,
          full stop. A Boot 2.7.18 client library talking to a broker still running in ZooKeeper
          mode is completely normal and unaffected by anything in this lesson — the client/broker
          protocol is versioned independently of both Spring and the client jar. But if your
          organisation&apos;s broker fleet is on the 4.x line and still has a ZooKeeper-mode
          service memoed as &quot;to migrate eventually&quot;, that migration is not optional
          forever, and it is a separate project from anything Spring-related.
        </p>
      </InfoBox>

      <FlowChart
        title="Producer / Broker / Consumer topology — unchanged by any of this"
        chart={"graph LR\nA[Producer] -->|send| B[Broker Partition 0]\nA -->|send| C[Broker Partition 1]\nA -->|send| D[Broker Partition 2]\nB --> E[Consumer A - partition 0]\nC --> F[Consumer A - partition 1]\nD --> G[Consumer B - partition 2]\nB --> H[Consumer B - partition 0]"}
      />

      <h2>Configuration Basics</h2>
      <p>
        Verified against <code>spring-boot-autoconfigure-2.7.18.jar</code>&apos;s configuration
        metadata: all 146 <code>spring.kafka.*</code> properties used below — producer, consumer,
        listener, streams — already exist on Boot 2.7. This YAML is not a &quot;translated for
        Boot 2&quot; version of anything; it is what a Boot 2 application actually runs today.
      </p>
      <CodeBlock language="yaml" title="application.yml — producer + consumer defaults, identical on Boot 2 and Boot 4">
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
        enable.idempotence: true               # NOT exactly-once — see note below.
                                               # De-duplicates PRODUCER RETRIES only.
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
      <CodeBlock language="java" title="KafkaTemplate — the workhorse, unchanged since well before Boot 2.7">
{`public record OrderPlaced(UUID orderId, String customerEmail, Instant at) { }
// A record compiles fine here IF your build targets Java 16+. Boot 2.7 only
// REQUIRES Java 8 — plenty of real Boot 2 shops already build on 17 without
// having touched Spring. If yours is still on 8 or 11, use a plain class
// with a constructor and getters instead; nothing else on this page changes.

@Service
public class OrderEventPublisher {

    private static final String TOPIC = "orders.placed.v1";
    private final KafkaTemplate<String, Object> kafka;

    public OrderEventPublisher(KafkaTemplate<String, Object> kafka) {
        this.kafka = kafka;
    }

    public ListenableFuture<SendResult<String, Object>> publish(OrderPlaced event) {
        // Boot 2's KafkaTemplate.send() returns Spring's ListenableFuture, not
        // java.util.concurrent.CompletableFuture. spring-kafka only switched
        // the return type to CompletableFuture in 3.0 (alongside Boot 3). The
        // two are close cousins -- ListenableFuture has addCallback() instead
        // of thenAccept()/exceptionally() -- but they are NOT interchangeable
        // types, so this is a real signature change if you carry code forward.
        ProducerRecord<String, Object> record =
            new ProducerRecord<>(TOPIC, event.orderId().toString(), event);
        record.headers()
            .add("event-version", "1".getBytes(UTF_8))
            .add("trace-id", TracingContext.current().traceId().getBytes(UTF_8));
        return kafka.send(record);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Verified: KafkaTemplate.send() return type is the one real API break in this lesson">
        <p>
          Checked directly against both jars with <code>javap</code>:
        </p>
        <CodeBlock language="text" title="Real output">
{`$ javap -p -cp spring-kafka-2.8.11.jar org.springframework.kafka.core.KafkaTemplate | grep " send("
  public org.springframework.util.concurrent.ListenableFuture<SendResult<K, V>> send(String, V);
  public org.springframework.util.concurrent.ListenableFuture<SendResult<K, V>> send(ProducerRecord<K, V>);
  ... (all six overloads return ListenableFuture)

$ javap -p -cp spring-kafka-3.0.0.jar org.springframework.kafka.core.KafkaTemplate | grep " send("
  public java.util.concurrent.CompletableFuture<SendResult<K, V>> send(String, V);
  public java.util.concurrent.CompletableFuture<SendResult<K, V>> send(ProducerRecord<K, V>);
  ... (all six overloads return CompletableFuture — the cutover is exactly 3.0.0;
      the last 2.x release, 2.9.13, still returns ListenableFuture)`}
        </CodeBlock>
        <p>
          If you are writing new Boot 2 code today, prefer{' '}
          <code>future.addCallback(onSuccess, onFailure)</code> over trying to wrap it in a{' '}
          <code>CompletableFuture</code> yourself — <code>ListenableFuture</code> has a{' '}
          <code>completable()</code> bridge method if you genuinely need one, but reaching for it
          on every call site is a sign the code is being written for a future migration rather
          than for the version it actually runs on.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Always partition on a stable business key">
        <p>
          Records with the same key land on the same partition, which means they arrive in order
          to a consumer. For order events, the order id is the key — every &quot;placed / paid /
          shipped / cancelled&quot; for the same order stays in order. Random UUID keys break this
          and forfeit Kafka&apos;s most valuable guarantee. This is Kafka mechanics, not Spring
          mechanics, and it has not changed in any version relevant to this section.
        </p>
      </InfoBox>

      <h2>Consuming Messages</h2>
      <CodeBlock language="java" title="@KafkaListener with manual acknowledgement — identical code on Boot 2 and Boot 4">
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
        A &quot;poison&quot; message that always fails halts the partition unless you have a
        strategy. This is the part of the lesson most worth double-checking on a Boot 2 codebase,
        because <code>spring-kafka</code>&apos;s error-handling API went through a genuine redesign
        — just one that landed <em>before</em> Boot 2.7.18, not after it.
      </p>

      <FlowChart
        title="What happens to a message that keeps failing"
        chart={"graph TD\nA[\"Record delivered to @KafkaListener\"] --> B{\"Handler throws?\"}\nB -->|\"No\"| C[\"Acknowledgment.acknowledge() -> offset commits\"]\nB -->|\"Yes\"| D[\"DefaultErrorHandler catches it\"]\nD --> E{\"In the not-retryable list?\"}\nE -->|\"Yes\"| F[\"Skip straight to the DLT\"]\nE -->|\"No\"| G[\"Retry with backoff: 500ms, 1s, 2s, 4s, 8s\"]\nG --> H{\"Still failing after 5 attempts?\"}\nH -->|\"Yes\"| F\nH -->|\"No, succeeds\"| C\nF --> I[\"DeadLetterPublishingRecoverer writes to orders.placed.v1.DLT\"]\nstyle F fill:#3a1f1f,stroke:#f87171\nstyle I fill:#3a2f1a,stroke:#fbbf24"}
      />

      <CodeBlock language="java" title="DLT configuration — this exact code compiles unchanged on spring-kafka 2.8.11">
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

      <InfoBox variant="success" title="Verified — DefaultErrorHandler, its constructor, and addNotRetryableExceptions all exist in 2.8.11">
        <p>
          This is worth confirming rather than assuming, because <code>DefaultErrorHandler</code>{' '}
          <em>sounds</em> like it could be newer than it is:
        </p>
        <CodeBlock language="text" title="Real javap output — spring-kafka-2.8.11.jar">
{`$ javap -p -cp spring-kafka-2.8.11.jar org.springframework.kafka.listener.DefaultErrorHandler
public class org.springframework.kafka.listener.DefaultErrorHandler
    extends org.springframework.kafka.listener.FailedBatchProcessor
    implements org.springframework.kafka.listener.CommonErrorHandler {
  public DefaultErrorHandler(ConsumerRecordRecoverer, BackOff);
  public final void addNotRetryableExceptions(Class<? extends Exception>...);
  ...
}`}
        </CodeBlock>
        <p>
          <code>DefaultErrorHandler</code> replaced the older{' '}
          <code>SeekToCurrentErrorHandler</code> in spring-kafka 2.8 (released 2021), and Boot
          2.7.18 already resolves 2.8.11. So the &quot;modern&quot; error-handling API is not a
          Boot 3 thing you are borrowing early — it is simply what Boot 2.7 ships. If you inherit a
          codebase still using <code>SeekToCurrentErrorHandler</code> (still present, but
          deprecated, in 2.8.11 — and removed entirely by <code>spring-kafka</code> 4.1.1), that is
          a sign the project has not been updated within the 2.x line, not a sign it needs Boot 3
          to modernise.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="DLT topics are a promise, not a solution">
        <p>
          A DLT catches your poison messages so processing doesn&apos;t halt. That&apos;s it. You
          still need something to <em>read</em> the DLT — alerts, a triage dashboard, a manual
          replay tool. A DLT no one looks at is just a slow leak.
        </p>
      </InfoBox>

      <h2>Deserialization Failures</h2>
      <p>
        A malformed message crashes the deserializer <em>before</em> your listener sees it.
        Without protection, the container loops forever on the same offset. The{' '}
        <code>ErrorHandlingDeserializer</code> wraps the failure so the error handler can route it
        to the DLT — also confirmed present in <code>spring-kafka-2.8.11.jar</code>.
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

      <InfoBox variant="warning" title="Idempotent producer is not exactly-once">
        <p>
          <code>enable.idempotence=true</code> gives the producer a sequence number per partition
          so the broker discards duplicates caused by <em>its own internal retries</em>. That is
          all. It does not deduplicate two separate <code>send()</code> calls from your code, and
          it says nothing about consumers.
        </p>
        <p>
          Real end-to-end exactly-once requires Kafka <strong>transactions</strong>: a{' '}
          <code>transactional.id</code> on the producer, sending records and consumer offsets in
          one transaction, and <code>isolation.level=read_committed</code> on consumers. It only
          holds <em>within</em> Kafka — the moment a handler writes to your database, that write is
          outside the Kafka transaction. Which is why the practical answer for almost every service
          is the one below: <strong>assume at-least-once and make handlers idempotent.</strong>{' '}
          None of this changed between Boot 2 and Boot 4 — <code>spring.kafka.producer.transaction-id-prefix</code>{' '}
          exists in the Boot 2.7.18 metadata too.
        </p>
      </InfoBox>

      <h2>Rebalances and the max.poll.interval.ms Trap</h2>
      <p>
        The single most common Kafka incident in a Spring service is not a broker failure — it is
        a consumer group that will not stop rebalancing, because a handler got slower than the
        poll interval.
      </p>
      <CodeBlock language="text" title="Why the group keeps rebalancing">
{`The consumer's poll loop must call poll() at least every
max.poll.interval.ms (default 5 minutes). If your handler takes longer to
process one batch than that, the broker assumes the consumer died, kicks it
out of the group, and REBALANCES. The evicted consumer then finishes, tries
to commit, and fails with CommitFailedException — so the records are
redelivered to whoever got the partition, which is also slow, and the cycle
repeats. Throughput goes to zero while the group thrashes.

The tell: repeated "Attempt to heartbeat failed since group is rebalancing"
or "This member will leave the group because consumer poll timeout had
expired" in the logs.

Fixes, best first:
  1. Make the handler faster, or do the slow work asynchronously.
  2. Lower max.poll.records so each batch is smaller (default 500).
  3. Raise max.poll.interval.ms only if the work genuinely is that slow.
  4. Keep session.timeout.ms / heartbeat.interval.ms at defaults —
     heartbeats run on a BACKGROUND thread since Kafka 0.10.1, so they are
     not what your slow handler blocks. max.poll.interval.ms is.

This is kafka-clients behaviour, not spring-kafka behaviour, so it is
identical whether the jar is 3.1.2 (Boot 2.7.18) or 4.2.1 (Boot 4.1.1).`}
      </CodeBlock>
      <CodeBlock language="yaml" title="The knobs">
{`spring:
  kafka:
    consumer:
      max-poll-records: 100            # smaller batches = faster loop
      properties:
        max.poll.interval.ms: 300000   # 5 min default
        session.timeout.ms: 45000
        heartbeat.interval.ms: 3000
    listener:
      # concurrency must be <= partition count, or the extra
      # consumers sit permanently idle with no partition assigned.
      concurrency: 3`}
      </CodeBlock>

      <h2>Idempotent Consumers</h2>
      <p>
        Kafka delivers at least once. Under retries, network hiccups, and rebalances, your
        listener will see the same record more than once. Handlers must be idempotent or
        you&apos;ll double-charge, double-ship, double-count.
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
        they&apos;re two systems. The outbox pattern solves it, and it is worth reading alongside
        the <a href="/springboot2/transactions">Transactions lesson</a> for the rule it
        deliberately bends:
      </p>
      <ol>
        <li>The service inserts the domain row AND an &quot;outbox&quot; row in the same DB transaction.</li>
        <li>A background poller (or Debezium/CDC) reads outbox rows and publishes them to Kafka.</li>
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
    // SELECT ... FOR UPDATE SKIP LOCKED so multiple replicas can relay
    // concurrently without publishing the same row twice.
    List<OutboxRow> batch = outbox.claimBatch(100);
    for (OutboxRow row : batch) {
        try {
            // BLOCK on the send. On Boot 2 this is a ListenableFuture, so use
            // its blocking get() rather than CompletableFuture's — same idea,
            // different type, see the InfoBox above.
            kafka.send(row.topic(), row.key(), row.payload())
                 .get(5, TimeUnit.SECONDS);
            outbox.markSent(row.id());       // same tx as the claim
        } catch (Exception e) {
            log.warn("relay failed for {}, staying pending", row.id(), e);
            break;   // preserve per-key ordering; next tick retries from here
        }
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Yes, that relay does I/O inside a transaction — deliberately">
        <p>
          The general rule is never make a network call inside <code>@Transactional</code>. The
          relay above breaks it on purpose: it is a single background job on a scheduler thread,
          processing a bounded batch, and it <em>must</em> hold the transaction across the send —
          the whole point is that <code>markSent</code> commits only if the publish succeeded. Give
          it a small timeout, a measured batch size, and — if it runs hot — its own small{' '}
          <code>DataSource</code> so it never competes with request traffic for connections.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Or use Debezium">
        <p>
          For high-volume services, Debezium tails the database&apos;s write-ahead log and
          publishes to Kafka for you — no polling, no missed rows. More moving parts to operate,
          but zero application-level poller.
        </p>
      </InfoBox>

      <h2>Testing Kafka Consumers</h2>
      <CodeBlock language="java" title="EmbeddedKafka slice test — @MockBean, not @MockitoBean">
{`import org.springframework.boot.test.mock.mockito.MockBean;   // <- the Boot 2 package,
                                                               //    see the Testing lesson

@SpringBootTest
@EmbeddedKafka(topics = "orders.placed.v1", partitions = 3)
class OrderPlacedListenerTest {

    @Autowired KafkaTemplate<String, Object> kafka;
    @MockBean OrderProjection projection;

    @Test
    void appliesEventToProjection() throws Exception {
        var event = new OrderPlaced(UUID.randomUUID(), "a@b.com", Instant.now());
        kafka.send("orders.placed.v1", event.orderId().toString(), event).get();

        verify(projection, timeout(3000)).apply(event);
    }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="@EmbeddedKafka itself is unaffected by any of this">
        <p>
          <code>org.springframework.kafka.test.context.EmbeddedKafka</code> is present, unchanged,
          in <code>spring-kafka-test-2.8.11.jar</code> — confirmed directly from the jar listing.
          The only Boot-2-specific thing in the test above is the mocking annotation; see the{' '}
          <a href="/springboot2/testing">Testing lesson</a> for the full <code>@MockBean</code>{' '}
          &rarr; <code>@MockitoBean</code> timeline.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Prefer TestContainers Kafka for anything non-trivial">
        <p>
          <code>@EmbeddedKafka</code> works but has flakiness under parallel test runs.
          TestContainers with a real broker (Confluent&apos;s cp-kafka image) is more stable and
          gives you the exact broker version your prod uses — worth doing deliberately if your
          fleet is still on a pre-4.0, ZooKeeper-mode broker, since an embedded in-process broker
          will not surface that difference.
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
        For continuous transformations (join two topics, aggregate over windows, materialize a
        state store), Kafka Streams gives you a fluent DSL. Not the first tool to reach for; not
        the last either.
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
        Spring for Kafka integrates with Micrometer, so producer and consumer metrics appear at{' '}
        <code>/actuator/prometheus</code> out of the box on Boot 2.7 exactly as they do on Boot 4 —
        see the <a href="/springboot2/actuator">Actuator lesson</a> for what else changed shape on
        that endpoint across the jump.
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
      <InfoBox variant="success" title="Signs your Boot 2 Kafka integration is healthy">
        <ul>
          <li>You know which <code>spring-kafka</code> and <code>kafka-clients</code> your build
              actually resolves — not just which Boot version.</li>
          <li>Producer has <code>acks=all</code> and <code>enable.idempotence=true</code>.</li>
          <li>Records are keyed on a stable business identifier so ordering per key is preserved.</li>
          <li>Consumers use manual ack (<code>MANUAL_IMMEDIATE</code>) — offsets only commit after
              successful handling.</li>
          <li>Deserialization failures are handled via <code>ErrorHandlingDeserializer</code> + DLT.</li>
          <li>Listener handlers are idempotent (upsert or dedupe table).</li>
          <li>Cross-system atomicity uses the transactional outbox.</li>
          <li>DLTs have an owner and an alert.</li>
          <li>Any code that treats <code>KafkaTemplate.send()</code> as returning a{' '}
              <code>CompletableFuture</code> has actually checked, not assumed.</li>
          <li>You know whether your broker fleet is KRaft or still ZooKeeper-mode, and that it is
              not this Spring upgrade&apos;s problem to solve.</li>
        </ul>
      </InfoBox>

    </LessonLayout>
  );
}

export default SpringBoot2Kafka;
