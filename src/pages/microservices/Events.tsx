import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Events() {
  return (
    <LessonLayout
      title="Event-Driven Architecture"
      sectionId="microservices"
      lessonIndex={5}
      prev={{ path: '/microservices/scaling', label: 'Scaling Strategies' }}
      next={{ path: '/microservices/containers', label: 'Containers & Kubernetes' }}
    >
      <h2>What Is Event-Driven Architecture?</h2>
      <p>
        Event-Driven Architecture (EDA) is a design paradigm where the flow of the program is
        determined by events — immutable facts that something happened. Services communicate by
        producing and consuming events, rather than directly calling each other. This fundamentally
        decouples producers from consumers.
      </p>

      <InfoBox variant="info" title="What Is an Event?">
        An event is an immutable fact that something happened in the past. Events are always named in
        past tense: <strong>UserRegistered</strong>, <strong>OrderPlaced</strong>,
        <strong> PaymentCompleted</strong>, <strong>ItemShipped</strong>. The producer does not know
        or care who consumes the event — it simply publishes the fact.
      </InfoBox>

      <FlowChart
        title="Traditional vs Event-Driven"
        chart={"graph TD\n  subgraph Traditional - Direct Coupling\n    O1[Order Service] -->|HTTP call| P1[Payment Service]\n    O1 -->|HTTP call| I1[Inventory Service]\n    O1 -->|HTTP call| N1[Notification Service]\n  end\n  subgraph Event-Driven - Decoupled\n    O2[Order Service] -->|OrderPlaced event| EB[Event Bus]\n    EB --> P2[Payment Service]\n    EB --> I2[Inventory Service]\n    EB --> N2[Notification Service]\n    EB --> A2[Analytics Service]\n  end"}
      />

      <h3>Why Events?</h3>
      <ul>
        <li><strong>Decoupling</strong> — the producer does not know about consumers. Adding a new consumer (e.g., analytics) requires zero changes to the producer.</li>
        <li><strong>Resilience</strong> — if a consumer is down, events are buffered and processed when it recovers.</li>
        <li><strong>Scalability</strong> — consumers can scale independently based on their processing load.</li>
        <li><strong>Audit trail</strong> — events are immutable records of what happened.</li>
        <li><strong>Temporal decoupling</strong> — producer and consumer do not need to be available at the same time.</li>
      </ul>

      <h2>Event Structure</h2>

      <CodeBlock language="typescript" title="Well-Structured Event">
{`interface DomainEvent {
  // Identity
  eventId: string;          // unique ID for idempotency
  correlationId: string;    // trace across services
  causationId: string;      // which event/command caused this

  // Type
  eventType: string;        // e.g., "OrderPlaced"
  aggregateType: string;    // e.g., "Order"
  aggregateId: string;      // e.g., "order-123"

  // Data
  data: Record<string, unknown>;  // the event payload
  metadata: {
    userId: string;         // who triggered it
    timestamp: string;      // when it happened (ISO 8601)
    version: number;        // schema version for evolution
  };
}

// Example event:
const orderPlacedEvent: DomainEvent = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  correlationId: 'req-abc-123',
  causationId: 'cmd-create-order-456',
  eventType: 'OrderPlaced',
  aggregateType: 'Order',
  aggregateId: 'order-789',
  data: {
    customerId: 'cust-001',
    items: [
      { productId: 'prod-42', quantity: 2, price: 29.99 },
    ],
    total: 59.98,
    shippingAddress: { city: 'Seattle', state: 'WA', zip: '98101' },
  },
  metadata: {
    userId: 'user-001',
    timestamp: '2024-01-15T10:30:00Z',
    version: 1,
  },
};`}
      </CodeBlock>

      <h2>RabbitMQ — Traditional Message Queue</h2>
      <p>
        RabbitMQ is a message broker that implements the AMQP (Advanced Message Queuing Protocol).
        It excels at routing messages with flexible patterns and is ideal for task queues where
        messages are processed once and then deleted.
      </p>

      <FlowChart
        title="RabbitMQ Architecture"
        chart={"graph LR\n  P[Producer] --> E[Exchange]\n  E -->|Routing Key: order.created| Q1[Queue: payment-processor]\n  E -->|Routing Key: order.created| Q2[Queue: inventory-manager]\n  E -->|Routing Key: order.*| Q3[Queue: audit-logger]\n  Q1 --> C1[Payment Consumer]\n  Q2 --> C2[Inventory Consumer]\n  Q3 --> C3[Audit Consumer]\n  style E fill:#3d2f14"}
      />

      <h3>RabbitMQ Exchange Types</h3>
      <table>
        <thead>
          <tr>
            <th>Exchange Type</th>
            <th>Routing</th>
            <th>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Direct</strong></td>
            <td>Exact routing key match</td>
            <td>Specific message routing</td>
          </tr>
          <tr>
            <td><strong>Topic</strong></td>
            <td>Wildcard routing key (*, #)</td>
            <td>Pattern-based routing (order.*, payment.#)</td>
          </tr>
          <tr>
            <td><strong>Fanout</strong></td>
            <td>Broadcast to all queues</td>
            <td>All consumers get every message</td>
          </tr>
          <tr>
            <td><strong>Headers</strong></td>
            <td>Message header matching</td>
            <td>Complex routing rules</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="javascript" title="RabbitMQ — Producer with Retry and DLQ">
{`const amqp = require('amqplib');

async function setupRabbitMQ() {
  const conn = await amqp.connect('amqp://rabbitmq:5672');
  const channel = await conn.createChannel();

  // Main exchange
  await channel.assertExchange('orders', 'topic', { durable: true });

  // Dead Letter Exchange — terminal failures land here for a human to look at
  await channel.assertExchange('dlx', 'direct', { durable: true });
  await channel.assertQueue('dead-letter-queue', {
    durable: true,
    arguments: { 'x-message-ttl': 86400000 },  // keep failures 24 hours
  });
  await channel.bindQueue('dead-letter-queue', 'dlx', '');

  // Retry queue — NOTHING consumes this. Messages park here until their
  // per-message TTL expires, at which point RabbitMQ dead-letters them back
  // onto the main exchange. This is how you get a retry that survives a
  // consumer restart; an in-process setTimeout loses every pending retry.
  await channel.assertQueue('payment-processor.retry', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'orders',
      'x-dead-letter-routing-key': 'order.created',
    },
  });

  await channel.assertQueue('payment-processor', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx',       // where nack(requeue=false) sends it
      'x-dead-letter-routing-key': '',
      // NOTE: RabbitMQ has no 'x-max-retries' argument — counting attempts is
      // the consumer's job (below). Quorum queues do offer x-delivery-limit.
    },
  });
  await channel.bindQueue('payment-processor', 'orders', 'order.created');

  return channel;
}

async function publishEvent(channel, event) {
  channel.publish(
    'orders',
    \`order.\${event.eventType.toLowerCase()}\`,
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,              // survive broker restart
      messageId: event.eventId,      // for deduplication
      timestamp: Date.now(),
      headers: {
        'x-correlation-id': event.correlationId,
        'x-retry-count': 0,
      },
    }
  );
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="RabbitMQ — Consumer with Error Handling">
{`async function startConsumer(channel) {
  channel.prefetch(10);  // process 10 messages concurrently

  channel.consume('payment-processor', async (msg) => {
    const event = JSON.parse(msg.content.toString());
    const retryCount = msg.properties.headers?.['x-retry-count'] ?? 0;

    try {
      console.log(\`Processing \${event.eventType}: \${event.aggregateId}\`);
      await processPayment(event);
      channel.ack(msg);  // success — remove from queue
    } catch (error) {
      console.error(\`Failed to process: \${error.message}\`);

      if (retryCount < 3) {
        // Exponential backoff via the retry queue's per-message TTL.
        // 'expiration' must be a STRING of milliseconds — a number is ignored.
        const delay = Math.pow(2, retryCount) * 1000;
        channel.sendToQueue('payment-processor.retry', msg.content, {
          ...msg.properties,
          expiration: String(delay),
          headers: { ...msg.properties.headers, 'x-retry-count': retryCount + 1 },
        });
        channel.ack(msg);  // ack the original — the retry copy now owns it
      } else {
        // Max retries exceeded — requeue=false routes it to the DLX
        channel.nack(msg, false, false);
      }
    }
  });
}`}
      </CodeBlock>

      <h2>Apache Kafka — Distributed Event Streaming</h2>
      <p>
        Kafka is a distributed event streaming platform. Unlike RabbitMQ, Kafka retains messages
        in a durable, ordered log. Messages are not deleted after consumption — multiple consumers
        can read the same messages, and consumers can replay from any point.
      </p>

      <FlowChart
        title="Kafka Architecture"
        chart={"graph TD\n  P1[Producer 1] --> T[Topic: order-events]\n  P2[Producer 2] --> T\n  T --> PA[Partition 0]\n  T --> PB[Partition 1]\n  T --> PC[Partition 2]\n  PA --> CG1A[Consumer Group A - Instance 1]\n  PB --> CG1B[Consumer Group A - Instance 2]\n  PC --> CG1C[Consumer Group A - Instance 3]\n  PA --> CG2A[Consumer Group B - Instance 1]\n  PB --> CG2A\n  PC --> CG2A\n  style T fill:#3b1a1a"}
      />

      <h3>Kafka Key Concepts</h3>
      <InfoBox variant="note" title="Kafka Terminology">
        <ul>
          <li><strong>Topic</strong> — a named stream of events (like a database table)</li>
          <li><strong>Partition</strong> — a topic is split into partitions for parallelism. Events with the same key go to the same partition (ordering guarantee)</li>
          <li><strong>Offset</strong> — each message in a partition has a sequential number. Consumers track their position by offset.</li>
          <li><strong>Consumer Group</strong> — a group of consumers that share the work. Each partition is consumed by exactly one consumer in the group.</li>
          <li><strong>Retention</strong> — messages are retained for a configurable period (days/weeks/forever), not deleted after consumption.</li>
        </ul>
      </InfoBox>

      <CodeBlock language="javascript" title="Kafka Producer — Node.js (kafkajs)">
{`const { Kafka, CompressionTypes } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka-1:9092', 'kafka-2:9092', 'kafka-3:9092'],
  retry: { retries: 5, initialRetryTime: 300 },
});

const producer = kafka.producer({
  // Idempotent producer: the broker de-duplicates PRODUCER RETRIES using a
  // producer ID + per-partition sequence number. That is NOT end-to-end
  // exactly-once — it only stops a retried send from appending twice. A
  // consumer can still see the same event twice after a rebalance, so
  // consumers must STILL be idempotent (see the consumer below).
  idempotent: true,
  // kafkajs THROWS at producer creation if idempotent is true and this is > 1
  // ("Idempotent producer requires maxInFlightRequests to be <= 1").
  // Leaving the default of 5 here means the service will not start.
  maxInFlightRequests: 1,
});

// Connect ONCE at startup — not per message. Calling connect() on every
// publish adds a round trip to the hot path.
async function start() {
  await producer.connect();
}

async function publishOrderEvent(order) {
  await producer.send({
    topic: 'order-events',
    compression: CompressionTypes.Snappy,  // compress for throughput
    messages: [{
      // Key determines partition — same customer always same partition
      key: order.customerId,
      value: JSON.stringify({
        // The per-event unique ID — this, NOT the correlation ID, is what
        // consumers de-duplicate on. One request (one correlationId) routinely
        // produces several distinct events.
        eventId: crypto.randomUUID(),
        eventType: 'OrderPlaced',
        aggregateId: order.id,
        data: {
          customerId: order.customerId,
          items: order.items,
          total: order.total,
        },
        timestamp: new Date().toISOString(),
      }),
      headers: {
        'correlation-id': order.correlationId,  // trace ID — shared by many events
        'event-type': 'OrderPlaced',
      },
    }],
  });
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Kafka Consumer — With Idempotency">
{`const consumer = kafka.consumer({
  groupId: 'payment-service',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topics: ['order-events'],
    fromBeginning: false,
  });

  await consumer.run({
    // Fan out across 3 partitions at once. Within ONE partition, eachMessage
    // still runs strictly one message at a time, so per-key ordering holds.
    partitionsConsumedConcurrently: 3,

    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());

      // De-duplicate on the EVENT id. Using the correlation ID here is a
      // classic bug: one request produces many events that share a
      // correlation ID, so the 2nd, 3rd... events would be silently dropped.
      const { eventId } = event;

      // Claim the event ATOMICALLY. A plain EXISTS-then-SETEX has a race:
      // two consumers can both see "not processed" and both charge the card.
      // SET NX returns null if another worker already claimed this eventId.
      //
      // NOTE THE TTL. The claim is SHORT (2 minutes -- comfortably longer
      // than the worst-case processing time, far shorter than the retention
      // window). If this process is SIGKILLed after claiming and before
      // finishing, the claim expires and the redelivery genuinely reprocesses.
      // Claiming for 7 days up front looks safer and is the opposite: a crash
      // in that window means every redelivery is skipped as a "duplicate" and
      // the payment is silently never taken. See the box below.
      const CLAIM_TTL = 120;
      const DONE_TTL = 604800;   // 7 days -- only applied AFTER success
      const claimed = await redis.set(\`processed:\${eventId}\`, 'claimed', 'NX', 'EX', CLAIM_TTL);
      if (!claimed) {
        console.log(\`Skipping duplicate event: \${eventId}\`);
        return;
      }

      try {
        switch (event.eventType) {
          case 'OrderPlaced':
            await processPayment(event.data);
            break;
          case 'OrderCancelled':
            await refundPayment(event.data);
            break;
        }
        // Promote the short claim to a long-lived tombstone ONLY once the
        // side effect has actually happened. Everything between the SET NX
        // and this line is the crash window, and the CLAIM_TTL is what
        // bounds it.
        await redis.set(\`processed:\${eventId}\`, 'done', 'EX', DONE_TTL);
      } catch (error) {
        console.error(\`Error processing event: \${error.message}\`);
        // Release the claim so the retry is not swallowed as a "duplicate".
        await redis.del(\`processed:\${eventId}\`);
        throw error;  // the client will redeliver
      }
    },
  });
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="The Crash Window Between Claiming and Processing">
        <p>
          The <code>SET NX EX</code> above really is atomic — two workers cannot both win the claim,
          and that part of the pattern is sound. But atomicity of the <em>claim</em> is not atomicity
          of <em>claim + side effect</em>, and the gap between them is where this design leaks.
        </p>
        <p>
          Trace a <code>SIGKILL</code> — OOM killer, pod eviction, node failure — landing after the
          claim succeeds and before <code>processPayment</code> completes. The <code>catch</code>{' '}
          never runs, so the claim is never released. Kafka redelivers the message (the offset was
          never committed), the new consumer executes <code>SET NX</code>, sees the orphaned claim,
          logs <code>Skipping duplicate event</code>, and returns. The event is now <strong>lost for
          the entire TTL</strong>. With the 7-day TTL this pattern is usually written with, that means
          lost forever in practice: nothing retries a week later, and the failure is completely
          silent — no exception, no dead-letter, just a payment that never happened and a log line
          that says everything is fine.
        </p>
        <p>
          The version above bounds that window with a short claim TTL, promoted to a long tombstone
          only after success. A crash costs you a redelivery delay of at most{' '}
          <code>CLAIM_TTL</code>, not the event. The cost is a real trade-off, not a free win: if
          processing ever exceeds the claim TTL, the claim expires while the first worker is still
          running and a redelivery <em>can</em> double-process. Pick a TTL well above your p99.9
          handler duration and alert on handlers that approach it.
        </p>
        <p>
          <strong>The stronger fix is to stop using a separate store.</strong> Redis and your
          database cannot commit together, so any two-store version has some window. Write the{' '}
          <code>event_id</code> into a <code>processed_events</code> table with a primary-key
          constraint <em>in the same database transaction</em> as the business effect. Then
          &quot;did I process this&quot; and &quot;did the effect happen&quot; are the same fact and
          cannot disagree: a duplicate hits the PK violation and you skip it; a crash rolls back both.
          Reserve the Redis version for effects that are not database writes, and know that you are
          choosing a bounded window rather than eliminating one.
        </p>
        <p>
          This is the concrete reason &quot;exactly-once&quot; is better said as{' '}
          <em>at-least-once delivery plus an idempotent consumer</em>. The delivery is genuinely
          at-least-once; the &quot;exactly&quot; is something your handler earns, and it is only as
          good as where the dedup record is stored.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="kafkajs Is Unmaintained — Use It to Learn, Not to Ship">
        <p>
          The examples on this page use <code>kafkajs</code> because its API is the clearest way to
          teach producer and consumer semantics, and it is still what most tutorials and existing
          codebases show. It has had no release since February 2023 and is not officially maintained.
        </p>
        <p>
          For new services, use <strong><code>@confluentinc/kafka-javascript</code></strong> —
          Confluent&apos;s GA client, built on <code>librdkafka</code>, with commercial support. It
          ships a deliberately KafkaJS-compatible surface, so the code above ports with an import
          change: <code>require(&#39;@confluentinc/kafka-javascript&#39;).KafkaJS</code> in place of{' '}
          <code>require(&#39;kafkajs&#39;)</code>. Everything this lesson teaches about idempotent
          producers, partition ordering and consumer-side dedup applies unchanged.
        </p>
      </InfoBox>

      <h2>RabbitMQ vs Kafka — Head-to-Head</h2>

      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>RabbitMQ</th>
            <th>Kafka</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Model</td>
            <td>Message Queue (messages deleted after ACK)</td>
            <td>Event Log (messages retained)</td>
          </tr>
          <tr>
            <td>Delivery</td>
            <td>Push-based (broker pushes to consumer)</td>
            <td>Pull-based (consumer pulls from broker)</td>
          </tr>
          <tr>
            <td>Ordering</td>
            <td>Per-queue ordering</td>
            <td>Per-partition ordering</td>
          </tr>
          <tr>
            <td>Throughput</td>
            <td>~50K msg/sec per node</td>
            <td>~1M msg/sec per node</td>
          </tr>
          <tr>
            <td>Replay</td>
            <td>Not with classic queues (deleted after ack); possible with RabbitMQ Streams</td>
            <td>Yes — consumer can seek to any offset</td>
          </tr>
          <tr>
            <td>Multiple Consumers</td>
            <td>Competing consumers (one processes each message)</td>
            <td>Consumer groups (each group gets all messages)</td>
          </tr>
          <tr>
            <td>Routing</td>
            <td>Flexible (exchanges, routing keys, wildcards)</td>
            <td>Topic-based (no complex routing)</td>
          </tr>
          <tr>
            <td>Dead Letter Queue</td>
            <td>Built-in DLQ support</td>
            <td>Must implement manually</td>
          </tr>
          <tr>
            <td>Protocol</td>
            <td>AMQP</td>
            <td>Custom binary protocol</td>
          </tr>
        </tbody>
      </table>

      <h3>When to Use Each</h3>

      <FlowChart
        title="RabbitMQ vs Kafka Decision Guide"
        chart={"graph TD\n  Start[Choose a Message Broker] --> Q1{Need event replay?}\n  Q1 -->|Yes| Kafka[Use Kafka]\n  Q1 -->|No| Q2{Multiple consumer groups for same events?}\n  Q2 -->|Yes| Kafka\n  Q2 -->|No| Q3{Need complex routing?}\n  Q3 -->|Yes| Rabbit[Use RabbitMQ]\n  Q3 -->|No| Q4{High throughput > 100K msg/sec?}\n  Q4 -->|Yes| Kafka\n  Q4 -->|No| Q5{Simple task queue / job processing?}\n  Q5 -->|Yes| Rabbit\n  Q5 -->|No| Either[Either works]\n  style Kafka fill:#3b1a1a\n  style Rabbit fill:#3d2f14"}
      />

      <InfoBox variant="tip" title="Quick Decision Guide">
        <strong>Use RabbitMQ for:</strong> task queues, email sending, image processing, job
        scheduling — work items that should be processed once and deleted.
        <br /><br />
        <strong>Use Kafka for:</strong> high-throughput event streaming, multiple consumers needing
        the same events, event replay for rebuilding state, audit logs, real-time analytics,
        stream processing.
      </InfoBox>

      <h2>Event-Driven Patterns</h2>

      <h3>Event Notification</h3>
      <p>
        The simplest EDA pattern. An event carries minimal data — just enough to notify consumers
        that something happened. Consumers call back for full details if needed.
      </p>

      <CodeBlock language="typescript" title="Event Notification vs Event-Carried State Transfer">
{`// Event Notification — minimal data, consumers call back
// Pros: small events, single source of truth
// Cons: consumers must call back, coupling via callbacks
const notification = {
  eventType: 'OrderPlaced',
  data: { orderId: 'order-123' },  // just the ID
};

// Event-Carried State Transfer — full data in the event
// Pros: consumers don't need to call back, fully decoupled
// Cons: larger events, data may be stale
const stateTransfer = {
  eventType: 'OrderPlaced',
  data: {
    orderId: 'order-123',
    customerId: 'cust-001',
    customerName: 'Alice Smith',        // denormalized
    customerEmail: 'alice@example.com', // denormalized
    items: [
      { productId: 'prod-42', name: 'Widget', quantity: 2, price: 29.99 },
    ],
    total: 59.98,
    shippingAddress: { city: 'Seattle', state: 'WA' },
  },
};
// Prefer Event-Carried State Transfer for true decoupling`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You need to process uploaded images — resize, generate thumbnails, and apply filters. Each image should be processed exactly once. Which broker?"}
        options={[
          'Kafka — for its high throughput',
          'RabbitMQ — task queue with competing consumers',
          'Redis Pub/Sub — for speed',
          'Direct HTTP calls between services'
        ]}
        correctIndex={1}
        explanation={"Image processing is a classic task queue use case: each image is a job that should be processed exactly once and then removed from the queue. RabbitMQ excels at this with competing consumers, acknowledgments, dead-letter queues for failures, and prefetch for back-pressure control."}
      />

      <InteractiveChallenge
        question={"Your analytics team wants to replay all order events from the past year to build a new dashboard. Your notification team wants the same events in real-time. Which broker?"}
        options={[
          'RabbitMQ — it supports multiple queues',
          'Kafka — event retention and multiple consumer groups',
          'Redis Streams — for real-time processing',
          'Amazon SQS — for managed queuing'
        ]}
        correctIndex={1}
        explanation={"Kafka retains events for a configurable period (or forever). The analytics team can create a consumer group and replay from the beginning of the topic, while the notification team runs its own consumer group processing events in real-time. A classic RabbitMQ queue deletes messages after acknowledgment, so it cannot do this. (RabbitMQ Streams, added in 3.9, is a log-structured queue type that does support offset-based replay — but for a year of retention at this scale, Kafka is still the natural fit.)"}
      />

      <h2>Summary</h2>

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>Events are immutable facts in past tense: UserRegistered, OrderPlaced</li>
          <li>EDA decouples producers from consumers — adding consumers requires no producer changes</li>
          <li>RabbitMQ: message queue, push-based, messages deleted after ACK, flexible routing, DLQ</li>
          <li>Kafka: event log, pull-based, messages retained, partitioned, high throughput, replay</li>
          <li>RabbitMQ for task queues (process once); Kafka for event streaming (retain and replay)</li>
          <li>Always design for idempotency — consumers may process the same event more than once</li>
          <li>Include correlationId in every event for distributed tracing</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
