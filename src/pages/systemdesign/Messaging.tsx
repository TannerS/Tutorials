import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Messaging() {
  return (
    <LessonLayout
      title="Message Queues &amp; Streaming"
      sectionId="systemdesign"
      lessonIndex={5}
      prev={{ path: '/systemdesign/distributed', label: 'Distributed Systems' }}
      next={{ path: '/systemdesign/interview', label: 'System Design Interviews' }}
    >
      {/* ───────────────────────────────────────────────
          Section 1 – Message Queue Fundamentals
      ─────────────────────────────────────────────── */}
      <h2>Message Queue Fundamentals</h2>

      <p>
        A <strong>message queue</strong> is a middleware component that enables asynchronous
        communication between services. Instead of calling another service directly and waiting
        for a response, the sender places a message on a queue and continues its work. A separate
        consumer picks up the message and processes it independently.
      </p>

      <h3>Why Use Message Queues?</h3>
      <ul>
        <li>
          <strong>Decoupling</strong> &mdash; Producers and consumers evolve independently. The
          producer doesn&apos;t need to know who consumes the message or how many consumers exist.
        </li>
        <li>
          <strong>Asynchronous Processing</strong> &mdash; Long-running tasks (image resizing,
          email sending, report generation) can be offloaded so the main request path stays fast.
        </li>
        <li>
          <strong>Load Leveling</strong> &mdash; Queues absorb traffic spikes. Even if 10,000
          requests arrive in one second, consumers process them at a sustainable rate.
        </li>
        <li>
          <strong>Reliability</strong> &mdash; Messages persist in the broker until acknowledged.
          If a consumer crashes, the message is redelivered to another consumer.
        </li>
        <li>
          <strong>Scalability</strong> &mdash; You can add more consumers to increase throughput
          without changing the producer at all.
        </li>
      </ul>

      <h3>Key Concepts</h3>
      <ul>
        <li><strong>Producer</strong> &mdash; The service that creates and sends messages.</li>
        <li><strong>Consumer</strong> &mdash; The service that receives and processes messages.</li>
        <li><strong>Broker</strong> &mdash; The middleware server that stores and routes messages (e.g., RabbitMQ, Kafka).</li>
        <li><strong>Queue</strong> &mdash; A named buffer that holds messages until consumed.</li>
        <li><strong>Topic</strong> &mdash; A logical channel for categorizing messages (especially in pub/sub systems).</li>
        <li><strong>Partition</strong> &mdash; A subdivision of a topic that enables parallel processing (Kafka concept).</li>
      </ul>

      <FlowChart
        title="Basic Message Queue Architecture"
        chart={"graph LR\n  P1[Producer A] -->|publish| Q[Message Queue / Broker]\n  P2[Producer B] -->|publish| Q\n  Q -->|deliver| C1[Consumer 1]\n  Q -->|deliver| C2[Consumer 2]\n  Q -->|deliver| C3[Consumer 3]"}
      />

      <InfoBox title="When to Use Message Queues">
        <p>Consider a message queue when you need to:</p>
        <ul>
          <li>Decouple services so they can be deployed and scaled independently</li>
          <li>Handle bursty traffic without overwhelming downstream services</li>
          <li>Guarantee that work will eventually be processed even if consumers are temporarily down</li>
          <li>Fan out events to multiple consumers</li>
          <li>Implement retry logic with exponential backoff</li>
        </ul>
        <p>
          <strong>Don&apos;t</strong> use a queue when you need a synchronous request/response &mdash;
          REST or gRPC is simpler in that case.
        </p>
      </InfoBox>

      {/* ───────────────────────────────────────────────
          Section 2 – Point-to-Point vs Pub/Sub
      ─────────────────────────────────────────────── */}
      <h2>Point-to-Point vs Pub/Sub</h2>

      <p>
        There are two fundamental messaging patterns. Understanding the difference is critical for
        system design interviews.
      </p>

      <h3>Point-to-Point (Competing Consumers)</h3>
      <p>
        Each message is delivered to <strong>exactly one consumer</strong>. Multiple consumers may
        listen on the same queue, but the broker ensures only one receives each message. This is
        ideal for distributing work across a pool of workers.
      </p>
      <ul>
        <li>Example: Order processing &mdash; each order should be handled by exactly one worker.</li>
        <li>Consumers compete for messages, hence &quot;competing consumers&quot; pattern.</li>
        <li>RabbitMQ queues use this model by default.</li>
      </ul>

      <h3>Publish/Subscribe (Fan-Out)</h3>
      <p>
        Each message is delivered to <strong>all subscribed consumer groups</strong>. The producer
        publishes to a topic, and every subscriber receives a copy. This is ideal when multiple
        systems need to react to the same event.
      </p>
      <ul>
        <li>Example: A &quot;user signed up&quot; event triggers email, analytics, and provisioning services simultaneously.</li>
        <li>Kafka uses this model natively with consumer groups.</li>
        <li>RabbitMQ achieves this with fanout exchanges.</li>
      </ul>

      <FlowChart
        title="Point-to-Point vs Pub/Sub"
        chart={"graph TD\n  subgraph Point-to-Point\n    PA[Producer] --> QA[Queue]\n    QA -->|msg 1| CA1[Consumer A]\n    QA -->|msg 2| CA2[Consumer B]\n    QA -->|msg 3| CA3[Consumer C]\n  end\n  subgraph Pub/Sub\n    PB[Producer] --> TB[Topic]\n    TB -->|copy| CB1[Email Service]\n    TB -->|copy| CB2[Analytics Service]\n    TB -->|copy| CB3[Audit Service]\n  end"}
      />

      <h3>Choosing Between Them</h3>
      <table>
        <thead>
          <tr>
            <th>Criteria</th>
            <th>Point-to-Point</th>
            <th>Pub/Sub</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Message delivery</td>
            <td>One consumer per message</td>
            <td>All subscribers get a copy</td>
          </tr>
          <tr>
            <td>Use case</td>
            <td>Task distribution</td>
            <td>Event broadcasting</td>
          </tr>
          <tr>
            <td>Scaling</td>
            <td>Add more competing consumers</td>
            <td>Each subscriber scales independently</td>
          </tr>
          <tr>
            <td>Example</td>
            <td>Job queues, order processing</td>
            <td>Event notifications, data pipelines</td>
          </tr>
        </tbody>
      </table>

      {/* ───────────────────────────────────────────────
          Section 3 – RabbitMQ Overview
      ─────────────────────────────────────────────── */}
      <h2>RabbitMQ Overview</h2>

      <p>
        <strong>RabbitMQ</strong> is an open-source message broker that implements the
        Advanced Message Queuing Protocol (AMQP). It is one of the most widely deployed
        message brokers and excels at traditional task-queue workloads.
      </p>

      <h3>AMQP Protocol Basics</h3>
      <p>
        AMQP defines a wire-level protocol for message-oriented middleware. Key AMQP concepts
        used in RabbitMQ:
      </p>
      <ul>
        <li><strong>Connection</strong> &mdash; A TCP connection between your application and the broker.</li>
        <li><strong>Channel</strong> &mdash; A virtual connection inside a TCP connection. Most operations happen on channels.</li>
        <li><strong>Exchange</strong> &mdash; Receives messages from producers and routes them to queues based on rules.</li>
        <li><strong>Queue</strong> &mdash; Stores messages until a consumer picks them up.</li>
        <li><strong>Binding</strong> &mdash; A rule that links an exchange to a queue, optionally with a routing key.</li>
      </ul>

      <h3>Exchange Types</h3>
      <ul>
        <li>
          <strong>Direct</strong> &mdash; Routes messages to queues whose binding key exactly
          matches the message&apos;s routing key. Use for point-to-point routing.
        </li>
        <li>
          <strong>Topic</strong> &mdash; Routes messages using wildcard pattern matching on the
          routing key (e.g., <code>orders.*.created</code>). Use for flexible pub/sub.
        </li>
        <li>
          <strong>Fanout</strong> &mdash; Broadcasts every message to all bound queues, ignoring
          routing keys. Use for pure fan-out.
        </li>
        <li>
          <strong>Headers</strong> &mdash; Routes based on message header attributes rather than
          routing keys. Rarely used in practice.
        </li>
      </ul>

      <FlowChart
        title="RabbitMQ Architecture"
        chart={"graph LR\n  P[Producer] -->|publish with routing key| E[Exchange]\n  E -->|binding: key=orders| Q1[Orders Queue]\n  E -->|binding: key=emails| Q2[Email Queue]\n  E -->|binding: key=logs| Q3[Log Queue]\n  Q1 --> C1[Order Consumer]\n  Q2 --> C2[Email Consumer]\n  Q3 --> C3[Log Consumer]"}
      />

      <h3>Message Acknowledgment</h3>
      <p>
        RabbitMQ supports manual and automatic acknowledgment. With <strong>manual ack</strong>,
        a consumer explicitly tells the broker it has finished processing. If the consumer crashes
        before acking, the message is requeued and delivered to another consumer. This is essential
        for reliability.
      </p>
      <ul>
        <li><strong>ack</strong> &mdash; Message processed successfully; remove from queue.</li>
        <li><strong>nack / reject</strong> &mdash; Message processing failed; requeue or send to DLQ.</li>
        <li><strong>Prefetch count</strong> &mdash; Limits how many unacked messages a consumer holds, preventing overload.</li>
      </ul>

      <CodeBlock
        title="RabbitMQ Producer / Consumer (Node.js pseudocode)"
        language="javascript"
        code={`// ─── Producer ───
const amqp = require('amqplib');

async function publishOrder(order) {
  const conn = await amqp.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  await ch.assertExchange('orders_exchange', 'direct', { durable: true });

  ch.publish(
    'orders_exchange',
    'order.created',            // routing key
    Buffer.from(JSON.stringify(order)),
    { persistent: true }        // survive broker restart
  );

  console.log('Order published:', order.id);
  await ch.close();
  await conn.close();
}

// ─── Consumer ───
async function consumeOrders() {
  const conn = await amqp.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  await ch.assertExchange('orders_exchange', 'direct', { durable: true });
  const q = await ch.assertQueue('orders_queue', { durable: true });
  await ch.bindQueue(q.queue, 'orders_exchange', 'order.created');

  ch.prefetch(10);  // process up to 10 messages concurrently

  ch.consume(q.queue, async (msg) => {
    try {
      const order = JSON.parse(msg.content.toString());
      await processOrder(order);
      ch.ack(msg);           // success → acknowledge
    } catch (err) {
      ch.nack(msg, false, true);  // failure → requeue
    }
  });
}`}
      />

      <InfoBox title="RabbitMQ Strengths">
        <p>
          RabbitMQ is an excellent choice for <strong>task queues</strong> and workloads that need:
        </p>
        <ul>
          <li>Complex routing logic (topic exchanges, header-based routing)</li>
          <li>Per-message acknowledgment and redelivery</li>
          <li>Priority queues</li>
          <li>Low-latency delivery of individual messages</li>
          <li>Mature plugin ecosystem (delayed messages, shovel, federation)</li>
        </ul>
      </InfoBox>

      {/* ───────────────────────────────────────────────
          Section 4 – Apache Kafka Overview
      ─────────────────────────────────────────────── */}
      <h2>Apache Kafka Overview</h2>

      <p>
        <strong>Apache Kafka</strong> is a distributed event streaming platform designed for
        high-throughput, fault-tolerant, real-time data pipelines. Unlike traditional message
        brokers, Kafka stores messages as an <strong>immutable, ordered log</strong>.
      </p>

      <h3>Kafka Architecture</h3>
      <ul>
        <li>
          <strong>Broker</strong> &mdash; A Kafka server. A cluster typically runs 3+ brokers
          for fault tolerance.
        </li>
        <li>
          <strong>Topic</strong> &mdash; A named category of messages (e.g., &quot;orders&quot;,
          &quot;page-views&quot;).
        </li>
        <li>
          <strong>Partition</strong> &mdash; Each topic is split into one or more partitions.
          Each partition is an ordered, append-only log stored on a single broker.
        </li>
        <li>
          <strong>Replication</strong> &mdash; Each partition is replicated across multiple
          brokers. One replica is the <em>leader</em>; the others are <em>followers</em>.
        </li>
        <li>
          <strong>Consumer Group</strong> &mdash; A logical group of consumers. Kafka assigns
          each partition to exactly one consumer within a group, enabling parallel processing.
        </li>
        <li>
          <strong>Offset</strong> &mdash; A monotonically increasing integer that identifies
          each message&apos;s position within a partition. Consumers track their own offsets.
        </li>
      </ul>

      <h3>How Partitions Enable Parallelism</h3>
      <p>
        If a topic has 6 partitions and a consumer group has 3 consumers, each consumer reads
        from 2 partitions. Messages within a partition are always processed in order. Messages
        across partitions have no ordering guarantee.
      </p>
      <p>
        The <strong>partition key</strong> (e.g., user ID) determines which partition a message
        lands in. All messages with the same key go to the same partition, guaranteeing ordering
        per key.
      </p>

      <h3>Consumer Group Rebalancing</h3>
      <p>
        When a consumer joins or leaves a group, Kafka triggers a <strong>rebalance</strong> to
        redistribute partitions. During rebalance, consumption pauses briefly. Key rebalance
        strategies:
      </p>
      <ul>
        <li><strong>Eager</strong> &mdash; All partitions revoked, then reassigned. Simple but causes a full stop.</li>
        <li><strong>Cooperative (Incremental)</strong> &mdash; Only affected partitions are revoked. Less disruption.</li>
      </ul>

      <FlowChart
        title="Kafka Architecture"
        chart={"graph TD\n  P1[Producer 1] --> T[Topic: orders]\n  P2[Producer 2] --> T\n  T --> Part0[Partition 0]\n  T --> Part1[Partition 1]\n  T --> Part2[Partition 2]\n  subgraph Consumer Group A\n    Part0 --> CGA1[Consumer A1]\n    Part1 --> CGA2[Consumer A2]\n    Part2 --> CGA3[Consumer A3]\n  end\n  subgraph Consumer Group B\n    Part0 --> CGB1[Consumer B1]\n    Part1 --> CGB1\n    Part2 --> CGB2[Consumer B2]\n  end"}
      />

      <h3>Log-Based Storage</h3>
      <p>
        Unlike RabbitMQ, which deletes messages after acknowledgment, Kafka retains messages
        in a commit log for a configurable period. This enables:
      </p>
      <ul>
        <li><strong>Replay</strong> &mdash; Consumers can re-read past messages by resetting their offset.</li>
        <li><strong>Multiple consumer groups</strong> &mdash; Each group maintains its own offset; consuming is non-destructive.</li>
        <li><strong>Audit trail</strong> &mdash; The log is a durable, ordered record of everything that happened.</li>
      </ul>

      <h3>Retention Policies</h3>
      <ul>
        <li><strong>Time-based</strong> &mdash; Delete messages older than N hours/days (default 7 days).</li>
        <li><strong>Size-based</strong> &mdash; Delete oldest messages when partition exceeds N bytes.</li>
        <li><strong>Compaction</strong> &mdash; Keep only the latest message per key. Ideal for changelogs.</li>
      </ul>

      <CodeBlock
        title="Kafka Producer / Consumer (Node.js pseudocode)"
        language="javascript"
        code={`// ─── Producer ───
const { Kafka } = require('kafkajs');

const kafka    = new Kafka({ brokers: ['broker1:9092', 'broker2:9092'] });
const producer = kafka.producer();

async function publishOrder(order) {
  await producer.connect();
  await producer.send({
    topic: 'orders',
    messages: [
      {
        key:   order.userId,            // partition key
        value: JSON.stringify(order),
        headers: { source: 'checkout-service' },
      },
    ],
  });
}

// ─── Consumer ───
const consumer = kafka.consumer({ groupId: 'order-processing' });

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'orders', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const order = JSON.parse(message.value.toString());
      console.log(
        \`Partition \${partition} | Offset \${message.offset} | Order \${order.id}\`
      );
      await processOrder(order);
      // Offsets are auto-committed periodically by default.
      // For manual control, use commitOffsets().
    },
  });
}`}
      />

      {/* ───────────────────────────────────────────────
          Section 5 – RabbitMQ vs Kafka
      ─────────────────────────────────────────────── */}
      <h2>RabbitMQ vs Kafka Comparison</h2>

      <p>
        This is one of the most common system design interview questions. The key insight is
        that RabbitMQ and Kafka solve <strong>different problems</strong>. They are not
        interchangeable.
      </p>

      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>RabbitMQ</th>
            <th>Kafka</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Message model</td>
            <td>Queue &mdash; messages deleted after ack</td>
            <td>Log &mdash; messages retained by policy</td>
          </tr>
          <tr>
            <td>Ordering</td>
            <td>Per-queue FIFO (single consumer)</td>
            <td>Per-partition ordering</td>
          </tr>
          <tr>
            <td>Throughput</td>
            <td>Tens of thousands msg/s per node</td>
            <td>Millions of msg/s per cluster</td>
          </tr>
          <tr>
            <td>Message retention</td>
            <td>Deleted after consumption</td>
            <td>Retained for configured duration</td>
          </tr>
          <tr>
            <td>Consumer model</td>
            <td>Push-based (broker delivers to consumer)</td>
            <td>Pull-based (consumer polls broker)</td>
          </tr>
          <tr>
            <td>Replay</td>
            <td>Not supported</td>
            <td>Consumer resets offset to replay</td>
          </tr>
          <tr>
            <td>Routing</td>
            <td>Rich (exchanges, bindings, routing keys)</td>
            <td>Simple (topic + partition key)</td>
          </tr>
          <tr>
            <td>Delivery guarantee</td>
            <td>At-least-once, at-most-once</td>
            <td>At-least-once, exactly-once (with txns)</td>
          </tr>
          <tr>
            <td>Best for</td>
            <td>Task queues, RPC, complex routing</td>
            <td>Event streaming, data pipelines, logs</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"Your e-commerce platform needs to process 500K checkout events per second and allow the analytics team to replay last week's data. Which broker should you choose and why?"}
        options={[
          'RabbitMQ — it has better routing and per-message acknowledgment',
          'Kafka — it handles high throughput and supports replay via offset reset',
          'Either would work — they have equivalent throughput',
          'Neither — you need a dedicated streaming framework like Flink',
        ]}
        correctIndex={1}
        explanation={"Kafka is designed for exactly this scenario. Its log-based storage allows replay by resetting consumer offsets, and its partitioned architecture handles millions of messages per second. RabbitMQ deletes messages after consumption, making replay impossible, and its throughput ceiling is significantly lower."}
      />

      {/* ───────────────────────────────────────────────
          Section 6 – Event Sourcing
      ─────────────────────────────────────────────── */}
      <h2>Event Sourcing</h2>

      <p>
        <strong>Event sourcing</strong> is an architectural pattern where the state of an entity
        is derived from a sequence of <em>events</em> rather than stored as a mutable row in a
        database. Instead of updating a record in place, you append a new event describing what
        happened.
      </p>

      <h3>How It Works</h3>
      <ol>
        <li>
          <strong>Command received</strong> &mdash; A user action (e.g., &quot;add item to cart&quot;)
          generates a command.
        </li>
        <li>
          <strong>Event produced</strong> &mdash; The command handler validates the action and
          produces an immutable event: <code>ItemAddedToCart</code>.
        </li>
        <li>
          <strong>Event stored</strong> &mdash; The event is appended to an <em>event store</em>
          (an append-only log).
        </li>
        <li>
          <strong>State rebuilt</strong> &mdash; The current state is computed by replaying all
          events for that entity from the beginning.
        </li>
      </ol>

      <h3>Benefits</h3>
      <ul>
        <li><strong>Complete audit trail</strong> &mdash; Every state change is recorded. You can answer &quot;how did we get here?&quot;</li>
        <li><strong>Temporal queries</strong> &mdash; Reconstruct the state at any point in time.</li>
        <li><strong>Debugging</strong> &mdash; Replay events to reproduce bugs exactly.</li>
        <li><strong>Decoupling</strong> &mdash; Events can be published to other services via a message broker.</li>
      </ul>

      <h3>Challenges</h3>
      <ul>
        <li><strong>Event schema evolution</strong> &mdash; Changing event shapes over time requires versioning and upcasting.</li>
        <li><strong>Replay performance</strong> &mdash; Long event streams require snapshots to avoid replaying thousands of events.</li>
        <li><strong>Eventual consistency</strong> &mdash; Read models may lag behind the event store.</li>
        <li><strong>Complexity</strong> &mdash; Significantly more complex than simple CRUD.</li>
      </ul>

      <FlowChart
        title="Event Sourcing Architecture"
        chart={"graph LR\n  CMD[Command] --> AH[Aggregate Handler]\n  AH -->|validate and produce| EV[Event]\n  EV --> ES[Event Store - Append Only Log]\n  ES -->|replay events| STATE[Current State]\n  ES -->|publish| BUS[Event Bus]\n  BUS --> PROJ[Read Model Projection]\n  BUS --> NOTIFY[Notification Service]\n  BUS --> ANALYTICS[Analytics Service]"}
      />

      {/* ───────────────────────────────────────────────
          Section 7 – CQRS
      ─────────────────────────────────────────────── */}
      <h2>CQRS &mdash; Command Query Responsibility Segregation</h2>

      <p>
        <strong>CQRS</strong> separates the <em>write model</em> (commands that change state)
        from the <em>read model</em> (queries that return data). Each side can use a different
        data store, schema, and scaling strategy optimized for its workload.
      </p>

      <h3>How CQRS Works with Event Sourcing</h3>
      <ol>
        <li>A <strong>command</strong> (e.g., &quot;place order&quot;) is sent to the write side.</li>
        <li>The write side validates the command, produces <strong>events</strong>, and stores them in the event store.</li>
        <li>Events are published to a message broker.</li>
        <li>
          One or more <strong>projectors</strong> consume the events and update denormalized
          <strong>read models</strong> (optimized views, materialized tables, search indexes).
        </li>
        <li>Queries hit the read models directly &mdash; fast and optimized for the specific query pattern.</li>
      </ol>

      <FlowChart
        title="CQRS Architecture"
        chart={"graph TD\n  U[User] -->|command| WS[Write Side / Command Handler]\n  WS --> ES[Event Store]\n  ES -->|events| MB[Message Broker]\n  MB --> P1[Projector: Order List View]\n  MB --> P2[Projector: Search Index]\n  MB --> P3[Projector: Analytics Cube]\n  P1 --> RM1[SQL Read DB]\n  P2 --> RM2[Elasticsearch]\n  P3 --> RM3[Data Warehouse]\n  U -->|query| QS[Query Side]\n  QS --> RM1\n  QS --> RM2\n  QS --> RM3"}
      />

      <h3>When to Use CQRS</h3>
      <ul>
        <li>Read and write workloads have very different performance characteristics</li>
        <li>You need different data models for reading vs writing (e.g., normalized for writes, denormalized for reads)</li>
        <li>The system requires complex queries that don&apos;t map well to the write model&apos;s schema</li>
        <li>Read and write sides need independent scaling</li>
      </ul>

      <h3>When NOT to Use CQRS</h3>
      <ul>
        <li>Simple CRUD applications with straightforward queries</li>
        <li>Small teams that can&apos;t absorb the added operational complexity</li>
        <li>Domains where strong consistency between read and write is required immediately</li>
      </ul>

      <InfoBox title="CQRS Adds Complexity" variant="warning">
        <p>
          CQRS introduces <strong>eventual consistency</strong> between the write and read sides.
          After a command is processed, the read model may take milliseconds to seconds to update.
          This is fine for most use cases (dashboards, lists, search) but problematic for scenarios
          where the user expects to see their change immediately.
        </p>
        <p>
          A common mitigation is <strong>read-your-writes consistency</strong>: after a write,
          redirect the user to a page that reads directly from the write model (or the event
          store) rather than the eventually-consistent read model.
        </p>
      </InfoBox>

      {/* ───────────────────────────────────────────────
          Section 8 – Reliability Patterns
      ─────────────────────────────────────────────── */}
      <h2>Reliability Patterns</h2>

      <p>
        Building reliable messaging systems requires handling failures gracefully. Here are the
        most important patterns to know for system design interviews.
      </p>

      <h3>Dead Letter Queues (DLQ)</h3>
      <p>
        A <strong>dead letter queue</strong> is a special queue where messages are sent when they
        cannot be processed successfully after a configured number of retries. This prevents
        &quot;poison pill&quot; messages from blocking the main queue indefinitely.
      </p>
      <ul>
        <li>Consumer fails to process a message 3 times &rarr; message moves to DLQ</li>
        <li>Operations team monitors the DLQ and investigates failures</li>
        <li>Messages can be replayed from the DLQ after the bug is fixed</li>
      </ul>

      <h3>Delivery Semantics</h3>
      <table>
        <thead>
          <tr>
            <th>Semantic</th>
            <th>Description</th>
            <th>Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>At-most-once</strong></td>
            <td>Message delivered zero or one time. Fire and forget.</td>
            <td>May lose messages. Fastest.</td>
          </tr>
          <tr>
            <td><strong>At-least-once</strong></td>
            <td>Message delivered one or more times. Retry on failure.</td>
            <td>May produce duplicates. Most common.</td>
          </tr>
          <tr>
            <td><strong>Exactly-once</strong></td>
            <td>Message delivered exactly one time. No loss, no duplicates.</td>
            <td>Hardest to achieve. Requires idempotent processing or transactions.</td>
          </tr>
        </tbody>
      </table>

      <h3>Exactly-Once: Idempotent Consumers</h3>
      <p>
        True exactly-once delivery is extremely difficult at the infrastructure level. The
        practical approach is <strong>at-least-once delivery + idempotent consumers</strong>.
        An idempotent consumer produces the same result whether a message is processed once or
        multiple times.
      </p>
      <ul>
        <li>Assign a unique <strong>message ID</strong> (idempotency key) to each message</li>
        <li>Before processing, check if the ID has already been processed (e.g., in a database table)</li>
        <li>If already processed, skip; otherwise, process and record the ID atomically</li>
      </ul>

      <h3>Message Ordering Guarantees</h3>
      <ul>
        <li><strong>RabbitMQ</strong> &mdash; FIFO within a single queue (one consumer). No ordering with competing consumers.</li>
        <li><strong>Kafka</strong> &mdash; Strict ordering within a partition. Use the same partition key for messages that must be ordered (e.g., all events for a user go to the same partition).</li>
        <li><strong>Cross-partition</strong> &mdash; No ordering guarantee. If global ordering is needed, use a single partition (sacrificing parallelism).</li>
      </ul>

      <h3>Backpressure Handling</h3>
      <p>
        When consumers are slower than producers, the queue grows unboundedly. Strategies to
        handle backpressure:
      </p>
      <ul>
        <li><strong>Prefetch / flow control</strong> &mdash; Limit how many messages a consumer receives before acking (RabbitMQ prefetch).</li>
        <li><strong>Consumer auto-scaling</strong> &mdash; Spin up more consumers when queue depth exceeds a threshold.</li>
        <li><strong>Producer throttling</strong> &mdash; Slow down or reject new messages when the broker is overloaded.</li>
        <li><strong>Bounded queues</strong> &mdash; Set a max queue size; reject or drop messages when full.</li>
      </ul>

      <InfoBox title="Exactly-Once Is Hard" variant="warning">
        <p>
          In distributed systems, <strong>exactly-once delivery</strong> is one of the hardest
          guarantees to achieve. Network partitions, consumer crashes, and duplicate sends all
          conspire against it. Kafka supports exactly-once semantics via idempotent producers
          and transactional APIs, but this comes with a throughput cost.
        </p>
        <p>
          In interviews, the best answer is: &quot;We use at-least-once delivery and make our
          consumers idempotent. This gives us effectively exactly-once processing without the
          complexity of distributed transactions.&quot;
        </p>
      </InfoBox>

      {/* ───────────────────────────────────────────────
          Section 9 – Use Cases
      ─────────────────────────────────────────────── */}
      <h2>Real-World Use Cases</h2>

      <h3>1. Order Processing Pipeline</h3>
      <p>
        An e-commerce platform publishes an <code>OrderPlaced</code> event to Kafka. Multiple
        consumer groups react independently:
      </p>
      <ul>
        <li><strong>Payment Service</strong> &mdash; Charges the customer&apos;s card</li>
        <li><strong>Inventory Service</strong> &mdash; Reserves stock</li>
        <li><strong>Notification Service</strong> &mdash; Sends order confirmation email</li>
        <li><strong>Analytics Service</strong> &mdash; Updates real-time dashboards</li>
      </ul>

      <h3>2. Notification System</h3>
      <p>
        A notification service uses RabbitMQ with priority queues. High-priority notifications
        (security alerts, password resets) are processed before low-priority ones (marketing
        emails). Dead letter queues catch messages that fail due to invalid email addresses.
      </p>

      <h3>3. Analytics Event Pipeline</h3>
      <p>
        Web and mobile clients send clickstream events to a Kafka topic. Events flow through
        a stream processing layer (Kafka Streams or Flink) for real-time aggregation, then
        into a data warehouse for batch analytics. The log-based model allows the data team
        to replay events when they change their aggregation logic.
      </p>

      <h3>4. Log Aggregation</h3>
      <p>
        Hundreds of microservices publish structured logs to a Kafka topic. A consumer group
        writes logs to Elasticsearch for searching, another archives them to S3 for long-term
        storage, and a third feeds a monitoring system that triggers alerts on error rate spikes.
      </p>

      <InteractiveChallenge
        question={"You're designing a notification system that sends emails, push notifications, and SMS. Each notification type has different processing logic and failure modes. Which pattern should you use?"}
        options={[
          'Single queue with a router that inspects message type',
          'Topic exchange with routing keys per notification type, separate queues and consumers for each',
          'Single Kafka topic with one consumer group',
          'Direct HTTP calls between services',
        ]}
        correctIndex={1}
        explanation={"A topic exchange with separate queues per notification type gives you independent scaling, failure isolation, and the ability to add new notification channels without modifying existing consumers. If emails are slow, only the email queue backs up — push and SMS continue unaffected. Direct HTTP calls would create tight coupling and no retry capability."}
      />

      <h3>Summary Cheat Sheet</h3>
      <table>
        <thead>
          <tr>
            <th>Concept</th>
            <th>Key Takeaway</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Message Queue</td>
            <td>Async communication via a broker; decouples producers and consumers</td>
          </tr>
          <tr>
            <td>Point-to-Point</td>
            <td>One consumer per message; competing consumers pattern</td>
          </tr>
          <tr>
            <td>Pub/Sub</td>
            <td>All subscribers receive a copy; fan-out pattern</td>
          </tr>
          <tr>
            <td>RabbitMQ</td>
            <td>AMQP broker; exchanges + queues; great for task queues &amp; complex routing</td>
          </tr>
          <tr>
            <td>Kafka</td>
            <td>Distributed log; topics + partitions; great for streaming &amp; high throughput</td>
          </tr>
          <tr>
            <td>Event Sourcing</td>
            <td>Store events, not current state; replay to rebuild</td>
          </tr>
          <tr>
            <td>CQRS</td>
            <td>Separate read &amp; write models; optimize each independently</td>
          </tr>
          <tr>
            <td>DLQ</td>
            <td>Catch poison-pill messages after retry exhaustion</td>
          </tr>
          <tr>
            <td>Idempotency</td>
            <td>Process duplicates safely; at-least-once + idempotent = effectively exactly-once</td>
          </tr>
        </tbody>
      </table>
    </LessonLayout>
  );
}
