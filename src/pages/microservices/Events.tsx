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
        chart={"graph LR\n  P[Producer] --> E[Exchange]\n  E -->|Routing Key: order.created| Q1[Queue: payment-processor]\n  E -->|Routing Key: order.created| Q2[Queue: inventory-manager]\n  E -->|Routing Key: order.*| Q3[Queue: audit-logger]\n  Q1 --> C1[Payment Consumer]\n  Q2 --> C2[Inventory Consumer]\n  Q3 --> C3[Audit Consumer]\n  style E fill:#FF6600,color:#fff"}
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

  // Dead Letter Exchange — for failed messages
  await channel.assertExchange('dlx', 'direct', { durable: true });
  await channel.assertQueue('dead-letter-queue', {
    durable: true,
    arguments: { 'x-message-ttl': 86400000 },  // retain for 24 hours
  });
  await channel.bindQueue('dead-letter-queue', 'dlx', '');

  // Main exchange and queue
  await channel.assertExchange('orders', 'topic', { durable: true });
  await channel.assertQueue('payment-processor', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx',       // send failed messages here
      'x-dead-letter-routing-key': '',
      'x-max-retries': 3,                     // max retry attempts
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
    const retryCount = msg.properties.headers['x-retry-count'] || 0;

    try {
      console.log(\`Processing \${event.eventType}: \${event.aggregateId}\`);
      await processPayment(event);
      channel.ack(msg);  // success — remove from queue
    } catch (error) {
      console.error(\`Failed to process: \${error.message}\`);

      if (retryCount < 3) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          channel.publish('orders', 'order.created',
            msg.content,
            {
              ...msg.properties,
              headers: { ...msg.properties.headers, 'x-retry-count': retryCount + 1 },
            }
          );
          channel.ack(msg);
        }, delay);
      } else {
        // Max retries exceeded — send to Dead Letter Queue
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
        chart={"graph TD\n  P1[Producer 1] --> T[Topic: order-events]\n  P2[Producer 2] --> T\n  T --> PA[Partition 0]\n  T --> PB[Partition 1]\n  T --> PC[Partition 2]\n  PA --> CG1A[Consumer Group A - Instance 1]\n  PB --> CG1B[Consumer Group A - Instance 2]\n  PC --> CG1C[Consumer Group A - Instance 3]\n  PA --> CG2A[Consumer Group B - Instance 1]\n  PB --> CG2A\n  PC --> CG2A\n  style T fill:#231F20,color:#fff"}
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
  idempotent: true,                    // exactly-once semantics
  maxInFlightRequests: 5,
  transactionalId: 'order-producer',   // for transactions
});

async function publishOrderEvent(order) {
  await producer.connect();

  await producer.send({
    topic: 'order-events',
    compression: CompressionTypes.Snappy,  // compress for throughput
    messages: [{
      // Key determines partition — same customer always same partition
      key: order.customerId,
      value: JSON.stringify({
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
        'correlation-id': order.correlationId,
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
    // Process one message at a time per partition
    partitionsConsumedConcurrently: 3,

    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      const eventId = message.headers['correlation-id']?.toString();

      // Idempotency check — skip already-processed events
      const alreadyProcessed = await redis.exists(\`processed:\${eventId}\`);
      if (alreadyProcessed) {
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

        // Mark as processed (with 7-day TTL)
        await redis.setex(\`processed:\${eventId}\`, 604800, '1');
      } catch (error) {
        console.error(\`Error processing event: \${error.message}\`);
        throw error;  // kafkajs will retry
      }
    },
  });
}`}
      </CodeBlock>

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
            <td>No — messages deleted after consumption</td>
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
        chart={"graph TD\n  Start[Choose a Message Broker] --> Q1{Need event replay?}\n  Q1 -->|Yes| Kafka[Use Kafka]\n  Q1 -->|No| Q2{Multiple consumer groups for same events?}\n  Q2 -->|Yes| Kafka\n  Q2 -->|No| Q3{Need complex routing?}\n  Q3 -->|Yes| Rabbit[Use RabbitMQ]\n  Q3 -->|No| Q4{High throughput > 100K msg/sec?}\n  Q4 -->|Yes| Kafka\n  Q4 -->|No| Q5{Simple task queue / job processing?}\n  Q5 -->|Yes| Rabbit\n  Q5 -->|No| Either[Either works]\n  style Kafka fill:#231F20,color:#fff\n  style Rabbit fill:#FF6600,color:#fff"}
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
        explanation={"Kafka retains events for a configurable period (or forever). The analytics team can create a consumer group and replay from the beginning of the topic, while the notification team runs its own consumer group processing events in real-time. RabbitMQ deletes messages after acknowledgment, so replay is not possible."}
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
