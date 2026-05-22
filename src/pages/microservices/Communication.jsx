import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Communication() {
  return (
    <LessonLayout
      title="Service Communication"
      sectionId="microservices"
      lessonIndex={2}
      prev={{ path: '/microservices/patterns', label: 'Core Patterns (10)' }}
      next={{ path: '/microservices/data', label: 'Data Patterns & CQRS' }}
    >
      <h2>How Services Talk to Each Other</h2>
      <p>
        In a monolith, components communicate via in-process method calls — fast, reliable, and
        transactional. In microservices, every call crosses a network boundary. This fundamentally
        changes how you design communication: you must handle latency, partial failures, serialization,
        and service discovery.
      </p>

      <FlowChart
        title="Communication Patterns Overview"
        chart={"graph TD\n  A[Service Communication] --> B[Synchronous]\n  A --> C[Asynchronous]\n  B --> B1[REST - HTTP/JSON]\n  B --> B2[gRPC - HTTP/2 Protobuf]\n  B --> B3[GraphQL]\n  C --> C1[Message Queue - Point-to-Point]\n  C --> C2[Event Bus - Pub/Sub]\n  C --> C3[Event Streaming - Kafka]"}
      />

      <h2>Synchronous Communication</h2>
      <p>
        The caller sends a request and <strong>blocks</strong> until it receives a response. Both the
        caller and callee must be available at the same time. This is the simplest pattern but creates
        temporal coupling.
      </p>

      <InfoBox variant="warning" title="The Synchronous Chain Problem">
        If Service A calls Service B, which calls Service C, which calls Service D — you have a
        synchronous chain. The availability of the entire chain is the product of individual
        availabilities: 99.9% × 99.9% × 99.9% = 99.7%. Each additional hop reduces overall reliability
        and increases latency.
      </InfoBox>

      <h3>REST (HTTP/JSON)</h3>
      <p>
        The most common communication protocol for microservices. Uses standard HTTP methods (GET, POST,
        PUT, DELETE) with JSON payloads. Human-readable, widely supported, and easy to debug.
      </p>

      <CodeBlock language="javascript" title="REST Client — Node.js with Axios + Retry">
{`const axios = require('axios');
const axiosRetry = require('axios-retry');

// Configure retry for transient failures
const orderClient = axios.create({
  baseURL: 'http://order-service:8080/api/v1',
  timeout: 5000,  // 5 second timeout
  headers: { 'Content-Type': 'application/json' },
});

axiosRetry(orderClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,  // 1s, 2s, 4s
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 503,
});

// Usage
async function getOrder(orderId) {
  try {
    const { data } = await orderClient.get(\`/orders/\${orderId}\`);
    return data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;  // Order not found
    }
    throw new Error(\`Failed to fetch order: \${error.message}\`);
  }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="REST Server — Spring Boot Controller">
{`@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrder(@PathVariable UUID id) {
        return orderService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        OrderDTO order = orderService.createOrder(request);
        URI location = URI.create("/api/v1/orders/" + order.getId());
        return ResponseEntity.created(location).body(order);
    }
}`}
      </CodeBlock>

      <h3>gRPC (HTTP/2 + Protocol Buffers)</h3>
      <p>
        gRPC uses Protocol Buffers for serialization (binary, compact) and HTTP/2 for transport
        (multiplexing, bidirectional streaming). It is significantly faster than REST for
        service-to-service communication and generates strongly-typed client/server code.
      </p>

      <CodeBlock language="protobuf" title="gRPC Proto Definition">
{`syntax = "proto3";

package orders;

service OrderService {
  // Unary RPC — request/response
  rpc GetOrder(GetOrderRequest) returns (OrderResponse);
  rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);

  // Server streaming — real-time order updates
  rpc StreamOrderUpdates(OrderSubscription) returns (stream OrderEvent);

  // Bidirectional streaming
  rpc BulkProcessOrders(stream CreateOrderRequest) returns (stream OrderResponse);
}

message GetOrderRequest {
  string order_id = 1;
}

message CreateOrderRequest {
  string customer_id = 1;
  repeated OrderItem items = 2;
}

message OrderItem {
  string product_id = 1;
  int32 quantity = 2;
  double price = 3;
}

message OrderResponse {
  string order_id = 1;
  string status = 2;
  double total = 3;
  string created_at = 4;
}`}
      </CodeBlock>

      <CodeBlock language="java" title="gRPC Server Implementation — Java">
{`@GrpcService
public class OrderGrpcService extends OrderServiceGrpc.OrderServiceImplBase {

    private final OrderService orderService;

    @Override
    public void getOrder(GetOrderRequest request,
                         StreamObserver<OrderResponse> observer) {
        orderService.findById(request.getOrderId())
            .ifPresentOrElse(
                order -> {
                    observer.onNext(toProto(order));
                    observer.onCompleted();
                },
                () -> observer.onError(
                    Status.NOT_FOUND
                        .withDescription("Order not found: " + request.getOrderId())
                        .asRuntimeException()
                )
            );
    }

    @Override
    public void streamOrderUpdates(OrderSubscription sub,
                                    StreamObserver<OrderEvent> observer) {
        // Server streaming — push updates in real time
        orderEventBus.subscribe(sub.getCustomerId(), event -> {
            observer.onNext(toEventProto(event));
        });
    }
}`}
      </CodeBlock>

      <h3>REST vs gRPC Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>REST</th>
            <th>gRPC</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Protocol</td>
            <td>HTTP/1.1 (or HTTP/2)</td>
            <td>HTTP/2</td>
          </tr>
          <tr>
            <td>Serialization</td>
            <td>JSON (text, ~3-10x larger)</td>
            <td>Protobuf (binary, compact)</td>
          </tr>
          <tr>
            <td>Performance</td>
            <td>Good</td>
            <td>Excellent (7-10x faster)</td>
          </tr>
          <tr>
            <td>Streaming</td>
            <td>Requires WebSockets or SSE</td>
            <td>Native bidirectional streaming</td>
          </tr>
          <tr>
            <td>Code Generation</td>
            <td>Optional (OpenAPI)</td>
            <td>Built-in (proto compiler)</td>
          </tr>
          <tr>
            <td>Browser Support</td>
            <td>Native</td>
            <td>Requires grpc-web proxy</td>
          </tr>
          <tr>
            <td>Debugging</td>
            <td>Easy (curl, Postman)</td>
            <td>Harder (grpcurl, BloomRPC)</td>
          </tr>
          <tr>
            <td>Best For</td>
            <td>Public APIs, web clients</td>
            <td>Internal service-to-service</td>
          </tr>
        </tbody>
      </table>

      <h2>Asynchronous Communication</h2>
      <p>
        In async communication, the producer publishes a message and does not wait for a response.
        This decouples services in time (consumer processes later) and availability (consumer can
        be down temporarily).
      </p>

      <FlowChart
        title="Async Patterns"
        chart={"graph TD\n  subgraph Point-to-Point Queue\n    P1[Producer] --> Q1[Queue]\n    Q1 --> C1[Single Consumer]\n  end\n  subgraph Pub/Sub Topic\n    P2[Producer] --> T1[Topic]\n    T1 --> C2[Consumer A]\n    T1 --> C3[Consumer B]\n    T1 --> C4[Consumer C]\n  end\n  subgraph Event Streaming\n    P3[Producer] --> K1[Kafka Topic / Partitions]\n    K1 --> CG1[Consumer Group A]\n    K1 --> CG2[Consumer Group B]\n  end"}
      />

      <h3>Message Queue Pattern (RabbitMQ)</h3>

      <CodeBlock language="javascript" title="RabbitMQ Producer — Node.js">
{`const amqp = require('amqplib');

async function publishOrderEvent(order) {
  const conn = await amqp.connect('amqp://rabbitmq:5672');
  const channel = await conn.createChannel();

  // Declare a durable exchange (survives broker restart)
  await channel.assertExchange('orders', 'topic', { durable: true });

  const event = {
    type: 'OrderCreated',
    data: { orderId: order.id, customerId: order.customerId, total: order.total },
    timestamp: new Date().toISOString(),
    correlationId: uuid(),
  };

  channel.publish(
    'orders',                        // exchange
    'order.created',                 // routing key
    Buffer.from(JSON.stringify(event)),
    { persistent: true, messageId: uuid() }  // survive broker restart
  );

  console.log('Published OrderCreated event:', order.id);
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="RabbitMQ Consumer — Node.js">
{`async function consumeOrderEvents() {
  const conn = await amqp.connect('amqp://rabbitmq:5672');
  const channel = await conn.createChannel();

  await channel.assertExchange('orders', 'topic', { durable: true });
  const q = await channel.assertQueue('payment-processor', { durable: true });
  await channel.bindQueue(q.queue, 'orders', 'order.created');

  // Prefetch: process 1 message at a time (back-pressure)
  channel.prefetch(1);

  channel.consume(q.queue, async (msg) => {
    const event = JSON.parse(msg.content.toString());
    try {
      await processPayment(event.data);
      channel.ack(msg);  // acknowledge — message removed from queue
    } catch (error) {
      console.error('Payment failed:', error);
      // Negative ack — requeue for retry (or send to DLQ)
      channel.nack(msg, false, false);
    }
  });
}`}
      </CodeBlock>

      <h3>Event Streaming Pattern (Kafka)</h3>

      <CodeBlock language="javascript" title="Kafka Producer — Node.js">
{`const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka-1:9092', 'kafka-2:9092', 'kafka-3:9092'],
});

const producer = kafka.producer({
  idempotent: true,  // exactly-once delivery
});

async function publishOrderEvent(order) {
  await producer.connect();
  await producer.send({
    topic: 'order-events',
    messages: [{
      key: order.customerId,  // same customer → same partition → ordering
      value: JSON.stringify({
        type: 'OrderCreated',
        data: order,
        timestamp: Date.now(),
      }),
      headers: { correlationId: uuid() },
    }],
  });
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Kafka Consumer — Node.js">
{`const consumer = kafka.consumer({ groupId: 'payment-service' });

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      const correlationId = message.headers.correlationId?.toString();

      console.log(\`Processing \${event.type} from partition \${partition}\`);

      switch (event.type) {
        case 'OrderCreated':
          await processPayment(event.data, correlationId);
          break;
        case 'OrderCancelled':
          await refundPayment(event.data, correlationId);
          break;
      }
      // Offset committed automatically after successful processing
    },
  });
}`}
      </CodeBlock>

      <h2>Service Discovery</h2>
      <p>
        In a dynamic environment where services scale up and down, you need a way for services to
        find each other. Service discovery solves this by maintaining a registry of available service
        instances and their locations.
      </p>

      <FlowChart
        title="Service Discovery — Client-Side vs Server-Side"
        chart={"graph TD\n  subgraph Client-Side Discovery\n    A1[Service A] -->|1. Query| R1[Service Registry]\n    R1 -->|2. Return instances| A1\n    A1 -->|3. Direct call| B1a[Service B - Instance 1]\n    A1 -->|3. Direct call| B1b[Service B - Instance 2]\n  end\n  subgraph Server-Side Discovery\n    A2[Service A] -->|1. Call| LB[Load Balancer]\n    LB -->|2. Query| R2[Service Registry]\n    LB -->|3. Route| B2a[Service B - Instance 1]\n    LB -->|3. Route| B2b[Service B - Instance 2]\n  end"}
      />

      <InfoBox variant="tip" title="Kubernetes DNS — Built-in Service Discovery">
        In Kubernetes, every Service gets a DNS name automatically:
        <code>order-service.default.svc.cluster.local</code>. You do not need a separate service
        registry — Kubernetes handles it via CoreDNS and Endpoints. This is why K8s is the default
        platform for microservices.
      </InfoBox>

      <h2>Communication Pattern Decision Guide</h2>

      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Pattern</th>
            <th>Rationale</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>User views order details</td>
            <td>Sync REST</td>
            <td>User needs immediate response</td>
          </tr>
          <tr>
            <td>Send confirmation email</td>
            <td>Async MQ</td>
            <td>User does not wait for email delivery</td>
          </tr>
          <tr>
            <td>Internal high-throughput data exchange</td>
            <td>gRPC</td>
            <td>Binary serialization, streaming, performance</td>
          </tr>
          <tr>
            <td>Order updates to multiple services</td>
            <td>Kafka Pub/Sub</td>
            <td>Multiple consumers, event replay, ordering</td>
          </tr>
          <tr>
            <td>Image/video processing</td>
            <td>Async MQ (RabbitMQ)</td>
            <td>Long-running task, process once, delete</td>
          </tr>
          <tr>
            <td>Real-time price updates</td>
            <td>gRPC streaming or Kafka</td>
            <td>Continuous data flow, low latency</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"Your order service needs to notify the payment, inventory, and notification services after an order is placed. The user should see order confirmation immediately. Which communication pattern?"}
        options={[
          'Synchronous REST calls to all three services',
          'gRPC streaming to all three services',
          'Publish an event to a message queue, let services subscribe',
          'GraphQL mutation that calls all services'
        ]}
        correctIndex={2}
        explanation={"Publishing an async event decouples the order service from downstream services. The order service confirms the order immediately, and the payment, inventory, and notification services process the event independently. If one is slow or temporarily down, the others are unaffected."}
      />

      <InteractiveChallenge
        question={"When is gRPC a better choice than REST for service-to-service communication?"}
        options={[
          'When you need browser support',
          'When you need high throughput with binary serialization and streaming',
          'When debugging with curl is a priority',
          'When your services are written in different languages'
        ]}
        correctIndex={1}
        explanation={"gRPC excels at service-to-service communication with its binary Protobuf serialization (7-10x faster), HTTP/2 multiplexing, native bidirectional streaming, and auto-generated typed clients. It does support multiple languages (option D), but REST does too — the real advantage is performance and streaming."}
      />

      <h2>Summary</h2>

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>Synchronous (REST/gRPC): caller waits — use when immediate response is needed</li>
          <li>Asynchronous (MQ/Events): fire and forget — use for decoupling and resilience</li>
          <li>REST for public APIs and browser clients; gRPC for internal service-to-service</li>
          <li>RabbitMQ for task queues (process once); Kafka for event streaming (retain + replay)</li>
          <li>Avoid long synchronous chains — use async where possible to improve resilience</li>
          <li>Kubernetes provides built-in service discovery via DNS</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
