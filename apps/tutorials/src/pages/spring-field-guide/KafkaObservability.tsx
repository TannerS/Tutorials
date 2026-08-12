import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringKafkaObservability() {
  return (
    <PosterLayout
      accent="emerald"
      eyebrow="Spring Boot 4 · Field Reference"
      title="Kafka & Observability"
      tagline="Producers, consumers, dead-letter handling, and the Actuator/Micrometer setup that tells you why something broke — condensed for offline study."
      meta={['Spring Boot 4', '13 patterns']}
      footerLabel="Personal study reference — Spring Boot"
      pageLabel="Spring Field Guide · Kafka & Observability"
      prev={{ path: '/spring-field-guide/spring-testing', label: 'Spring Testing' }}
      next={{ path: '/spring-field-guide/boot4', label: 'Spring Boot 4 Novelties' }}
    >
      <PosterCard
        glyph="Pr"
        title={<>Producer config<span className="dim"> — durability defaults</span></>}
        language="yaml"
        code={`spring:
  kafka:
    bootstrap-servers: \${KAFKA_BOOTSTRAP:localhost:9092}
    producer:
      key-serializer: ...StringSerializer
      value-serializer: ...JsonSerializer
      acks: all                        # wait for all in-sync replicas
      retries: 5
      properties:
        enable.idempotence: true       # exactly-once producer semantics
        compression.type: zstd`}
        caption="acks=all + enable.idempotence=true is the pair that prevents silent message loss and duplicate sends on retry — treat it as the non-negotiable starting config for anything that matters."
      />

      <PosterCard
        glyph="Kt"
        title={<>KafkaTemplate<span className="dim"> — producing on a stable key</span></>}
        language="java"
        code={`@Service
public class OrderEventPublisher {
    private static final String TOPIC = "orders.placed.v1";
    private final KafkaTemplate<String, Object> kafka;

    public CompletableFuture<SendResult<String, Object>> publish(OrderPlaced e) {
        var record = new ProducerRecord<String, Object>(
            TOPIC, e.orderId().toString(), e);      // key = business id
        record.headers().add("event-version", "1".getBytes(UTF_8));
        return kafka.send(record);
    }
}`}
        caption="Records with the same key land on the same partition and arrive in order. Key on the order id, not a random UUID — a random key forfeits Kafka's ordering guarantee for that entity."
      />

      <PosterCard
        glyph="Kl"
        title={<>@KafkaListener<span className="dim"> — manual acknowledgment</span></>}
        language="java"
        code={`@KafkaListener(topics = "orders.placed.v1", groupId = "order-projector")
public void onPlaced(ConsumerRecord<String, OrderPlaced> record,
                     Acknowledgment ack) {
    try {
        projection.apply(record.value());
        ack.acknowledge();          // commit offset AFTER success
    } catch (Exception e) {
        log.error("Failed to process {}; not acking", record.key(), e);
        throw e;                    // triggers the configured error handler
    }
}
// listener.ack-mode: MANUAL_IMMEDIATE`}
        caption="With manual ack, a crash mid-processing means the broker redelivers — nothing is silently lost. Auto-commit before the handler runs is the config that loses messages under failure."
      />

      <PosterCard
        glyph="Dl"
        title={<>Dead-letter topics<span className="dim"> — poison-message handling</span></>}
        language="java"
        code={`@Bean
public DefaultErrorHandler errorHandler(KafkaTemplate<Object,Object> template) {
    var backoff = new ExponentialBackOffWithMaxRetries(5);
    backoff.setInitialInterval(500);
    backoff.setMultiplier(2.0);

    var recoverer = new DeadLetterPublishingRecoverer(template);
    var handler = new DefaultErrorHandler(recoverer, backoff);
    handler.addNotRetryableExceptions(DeserializationException.class);
    return handler;
}`}
        caption="Without this, one malformed record that always throws halts the whole partition forever. Retries with backoff, then routes to <topic>.DLT — but a DLT no one alerts on is just a slow leak."
      />

      <PosterCard
        glyph="Ed"
        title={<>ErrorHandlingDeserializer<span className="dim"></span></>}
        language="yaml"
        code={`spring:
  kafka:
    consumer:
      key-deserializer: ...ErrorHandlingDeserializer
      value-deserializer: ...ErrorHandlingDeserializer
      properties:
        spring.deserializer.key.delegate.class: ...StringDeserializer
        spring.deserializer.value.delegate.class: ...JsonDeserializer`}
        caption="A malformed message crashes plain deserializers BEFORE your listener even sees it, looping forever on the same offset. This wrapper turns that crash into a normal error the DLT handler can route."
      />

      <PosterCard
        glyph="!"
        badge="Gotcha"
        title={<>Idempotent consumers<span className="dim"> — at-least-once, always</span></>}
        language="java"
        code={`// Kafka delivers AT LEAST ONCE. Retries and rebalances mean
// your listener WILL see the same record more than once.
@Transactional
public void apply(OrderPlaced event) {
    // upsert — inserting the same event id twice is a no-op
    projections.upsert(event.orderId(), event.at(), event.customerEmail());
}`}
        caption="This isn't an edge case to guard against — it's the delivery guarantee working as designed. Every handler must be idempotent (upsert on business key, or a dedupe table) or you double-charge / double-ship."
      />

      <PosterCard
        glyph="Ox"
        title={<>Transactional outbox<span className="dim"> — atomic DB + Kafka</span></>}
        language="java"
        code={`@Transactional
public Order place(NewOrderRequest req) {
    Order o = orders.save(Order.from(req));
    outbox.enqueue("orders.placed.v1", o.id().toString(),
                   new OrderPlaced(o.id(), req.email(), Instant.now()));
    return o;                    // same DB tx — atomic with the save
}

@Scheduled(fixedDelayString = "\${outbox.poll-ms:200}")
public void relay() {           // separate poller publishes pending rows
    outbox.claimBatch(100).forEach(row ->
        kafka.send(row.topic(), row.key(), row.payload())
            .whenComplete((r, ex) -> { if (ex == null) outbox.markSent(row.id()); }));
}`}
        caption="You can't atomically commit to Postgres and publish to Kafka — they're different systems. The outbox row commits in the same DB transaction as the domain row; a poller relays it after the fact."
      />

      <PosterCard
        glyph="Ex"
        title={<>Actuator exposure<span className="dim"> — safe defaults</span></>}
        language="yaml"
        code={`management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
        exclude: env,configprops,beans,heapdump,threaddump
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when_authorized
  server:
    port: 8081            # management on its own port`}
        caption="/actuator/env, /configprops, /heapdump, and /beans leak secrets, the full config, and the JVM heap. Excluding them (or moving management to a platform-only port) is the default posture, not an afterthought."
      />

      <PosterCard
        glyph="Mm"
        title={<>Micrometer meters<span className="dim"> — Counter, Timer, Gauge</span></>}
        language="java"
        code={`private final Counter placedCounter = Counter.builder("orders.placed")
    .description("Total orders placed").register(registry);

private final Timer placeTimer = Timer.builder("orders.place.duration")
    .publishPercentileHistogram()          // enables p50/p95/p99
    .register(registry);

Gauge.builder("orders.pending", this, OrderService::pendingCount)
    .register(registry);                   // sampled value, not pushed

public Order place(NewOrderRequest req) {
    return placeTimer.record(() -> doPlace(req));
}`}
        caption="Counter for totals, Timer for durations with percentile histograms, Gauge for a sampled current value (pending count, queue depth) — the three meter types that cover almost every metric need."
      />

      <PosterCard
        glyph="Cd"
        title={<>Tag cardinality<span className="dim"> — the rule that prevents OOM</span></>}
        language="java"
        code={`// GOOD — enum-like, small fixed set of values.
registry.counter("orders.placed", "channel", channel.name()).increment();

// BAD — a new time series per unique user id. Millions of users
// = millions of series = Prometheus OOM.
registry.counter("orders.placed", "userId", user.id().toString());`}
        caption="Prometheus stores one time series per unique tag-value combination. Tags must be bounded sets (status codes, methods, feature flags) — IDs, tokens, and emails belong in traces or logs, never metric tags."
      />

      <PosterCard
        glyph="Hi"
        title={<>Custom HealthIndicator<span className="dim"></span></>}
        language="java"
        code={`@Component
public class CatalogHealthIndicator implements HealthIndicator {
    private final CatalogApi client;

    public Health health() {
        try {
            client.ping();
            return Health.up().build();
        } catch (Exception e) {
            return Health.down().withDetail("error", e.getMessage()).build();
        }
    }
}
// K8s: /actuator/health/liveness vs /actuator/health/readiness`}
        caption="Readiness should mean 'I can accept traffic,' not 'every downstream is healthy' — making readiness depend on every dependency turns one flapping downstream into a cascading full outage."
      />

      <PosterCard
        glyph="Tr"
        title={<>Distributed tracing<span className="dim"> — OTLP + traceparent</span></>}
        language="yaml"
        code={`management:
  tracing:
    sampling:
      probability: 1.0        # 100% in dev; a fraction in prod
  otlp:
    tracing:
      endpoint: http://otel-collector:4317
      transport: grpc`}
        caption="With micrometer-tracing-bridge-otel on the classpath, every Observation also produces a span, and the traceparent (W3C) header propagates automatically across outbound HTTP and Kafka calls."
      />

      <PosterCard
        glyph="Lv"
        title={<>Runtime log level toggle<span className="dim"> — /actuator/loggers</span></>}
        language="text"
        code={`# Read current level
curl -s http://localhost:8081/actuator/loggers/com.example.orders

# Turn on DEBUG without a redeploy
curl -X POST .../actuator/loggers/com.example.orders \\
     -H "Content-Type: application/json" \\
     -d '{"configuredLevel":"DEBUG"}'`}
        caption="Changing a package's log level at runtime — no restart, no redeploy — is one of Actuator's highest-leverage features for debugging a live production incident."
      />

      <PosterQuickRef
        title="Which Kafka/observability tool do I need?"
        rows={[
          { need: 'Prevent message loss on send', answer: 'acks=all + enable.idempotence=true' },
          { need: 'Keep per-entity events in order', answer: 'Key on a stable business id, never a random UUID' },
          { need: 'Offset commits only after success', answer: 'Manual Acknowledgment, ack-mode MANUAL_IMMEDIATE' },
          { need: 'A record that always fails', answer: 'DefaultErrorHandler + DeadLetterPublishingRecoverer' },
          { need: 'Malformed message loops forever', answer: 'ErrorHandlingDeserializer' },
          { need: 'Same event processed twice', answer: 'Idempotent handler — upsert or dedupe table' },
          { need: 'Atomic DB write + Kafka publish', answer: 'Transactional outbox, not a distributed tx' },
          { need: 'Actuator leaking secrets', answer: 'Exclude env/configprops/heapdump/beans' },
          { need: 'Metric blows up Prometheus memory', answer: 'Remove the high-cardinality tag (IDs, tokens)' },
          { need: 'One dependency down = everyone unready', answer: 'Decouple readiness from every downstream check' },
          { need: 'Debug a live incident without redeploying', answer: 'POST /actuator/loggers to raise the level' },
        ]}
      />
    </PosterLayout>
  );
}
