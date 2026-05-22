import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Patterns() {
  return (
    <LessonLayout
      title="Core Microservices Patterns (10)"
      sectionId="microservices"
      lessonIndex={1}
      prev={{ path: '/microservices/intro', label: 'Monolith vs Microservices' }}
      next={{ path: '/microservices/communication', label: 'Service Communication' }}
    >
      <h2>The 10 Essential Patterns</h2>
      <p>
        These 10 design patterns form the backbone of every production microservices architecture.
        Understanding when and why to apply each pattern is critical for building reliable
        distributed systems.
      </p>

      <FlowChart
        title="Microservices Pattern Map"
        chart={"graph TD\n  A[Microservices Patterns] --> B[Communication]\n  A --> C[Resilience]\n  A --> D[Data]\n  A --> E[Migration]\n  A --> F[Infrastructure]\n  B --> B1[API Gateway]\n  B --> B2[Sync - REST/gRPC]\n  B --> B3[Async - MQ/Events]\n  C --> C1[Circuit Breaker]\n  D --> D1[Database per Service]\n  D --> D2[Saga Pattern]\n  D --> D3[Event Sourcing]\n  D --> D4[CQRS]\n  E --> E1[Strangler Fig]\n  F --> F1[Sidecar / Service Mesh]"}
      />

      <h2>1. API Gateway</h2>
      <p>
        The API Gateway is a single entry point for all client requests. It routes requests to the
        appropriate microservice and centralizes cross-cutting concerns like authentication, logging,
        rate limiting, and response caching.
      </p>

      <FlowChart
        title="API Gateway Pattern"
        chart={"graph LR\n  Web[Web App] --> GW[API Gateway]\n  Mobile[Mobile App] --> GW\n  Third[3rd Party] --> GW\n  GW -->|/auth/*| Auth[Auth Service]\n  GW -->|/orders/*| Orders[Order Service]\n  GW -->|/products/*| Catalog[Catalog Service]\n  GW -->|/users/*| Users[User Service]\n  GW -.->|Cross-cutting| CC[Auth + Rate Limit + Logging + Caching]"}
      />

      <InfoBox variant="info" title="API Gateway Responsibilities">
        <ul>
          <li><strong>Request routing</strong> — route to correct downstream service</li>
          <li><strong>Authentication</strong> — validate JWT/API keys before forwarding</li>
          <li><strong>Rate limiting</strong> — protect services from abuse</li>
          <li><strong>Response caching</strong> — cache GET responses to reduce load</li>
          <li><strong>Request aggregation</strong> — combine multiple service calls into one response (BFF)</li>
          <li><strong>Protocol translation</strong> — REST to gRPC, WebSocket to HTTP</li>
        </ul>
      </InfoBox>

      <CodeBlock language="yaml" title="Kong API Gateway Configuration">
{`services:
  - name: order-service
    url: http://order-service:8080
    routes:
      - name: orders-route
        paths: ["/api/v1/orders"]
        methods: ["GET", "POST", "PUT"]
    plugins:
      - name: jwt           # Validate JWT tokens
      - name: rate-limiting  # 100 requests/minute
        config:
          minute: 100
      - name: cors
        config:
          origins: ["https://myapp.com"]
      - name: request-transformer
        config:
          add:
            headers: ["X-Request-ID:$(uuid)"]`}
      </CodeBlock>

      <p><strong>Tools:</strong> Kong, AWS API Gateway, Nginx, Envoy, Spring Cloud Gateway, Traefik</p>

      <h2>2. Synchronous Communication (REST/gRPC)</h2>
      <p>
        In synchronous communication, the caller sends a request and <strong>waits</strong> for a response.
        This is the simplest communication pattern but creates temporal coupling — both services
        must be available at the same time.
      </p>

      <CodeBlock language="typescript" title="REST vs gRPC Comparison">
{`// REST — HTTP/JSON (human-readable, widely supported)
// GET /api/orders/123
// Response: { "id": 123, "status": "shipped", "total": 49.99 }

// gRPC — HTTP/2 + Protobuf (binary, high performance)
// Proto definition:
// service OrderService {
//   rpc GetOrder(OrderRequest) returns (OrderResponse);
// }

// When to use REST:
// ✅ Public-facing APIs (browsers, third parties)
// ✅ Simple CRUD operations
// ✅ Wide language/tool support needed

// When to use gRPC:
// ✅ Service-to-service (internal) communication
// ✅ High-throughput, low-latency requirements
// ✅ Streaming data (bidirectional streams)
// ✅ Strict API contracts with code generation`}
      </CodeBlock>

      <h2>3. Async Communication (Message Queue/Event Bus)</h2>
      <p>
        In asynchronous communication, the producer publishes a message and moves on — it does not
        wait for a response. Consumers process messages independently. This decouples services
        in both time and availability.
      </p>

      <FlowChart
        title="Async Communication — Fire and Forget"
        chart={"graph LR\n  OrderSvc[Order Service] -->|Publish| MQ[Message Queue]\n  MQ -->|Subscribe| PaySvc[Payment Service]\n  MQ -->|Subscribe| InvSvc[Inventory Service]\n  MQ -->|Subscribe| NotifSvc[Notification Service]\n  style MQ fill:#f59e0b,color:#fff"}
      />

      <InfoBox variant="tip" title="When to Use Async">
        Use async communication when the producer does not need an immediate response, when you
        want to decouple services, or when the work can be processed later. Examples: sending emails,
        processing images, updating search indexes, analytics events.
      </InfoBox>

      <h2>4. Circuit Breaker</h2>
      <p>
        The Circuit Breaker pattern wraps downstream calls and monitors failures. When failures
        exceed a threshold, the circuit &quot;opens&quot; and immediately returns an error or fallback
        without calling the downstream service — preventing cascading failures.
      </p>

      <FlowChart
        title="Circuit Breaker States"
        chart={"graph LR\n  CLOSED[CLOSED - Requests pass through] -->|Failure threshold exceeded| OPEN[OPEN - Requests fail fast]\n  OPEN -->|Timeout expires| HALF[HALF-OPEN - Test with limited requests]\n  HALF -->|Test succeeds| CLOSED\n  HALF -->|Test fails| OPEN\n  style CLOSED fill:#10b981,color:#fff\n  style OPEN fill:#ef4444,color:#fff\n  style HALF fill:#f59e0b,color:#fff"}
      />

      <CodeBlock language="java" title="Circuit Breaker with Resilience4j">
{`@Service
public class PaymentService {

    @CircuitBreaker(name = "paymentGateway", fallbackMethod = "fallback")
    @Retry(name = "paymentGateway", fallbackMethod = "fallback")
    @TimeLimiter(name = "paymentGateway")
    public CompletableFuture<PaymentResult> processPayment(PaymentRequest req) {
        return CompletableFuture.supplyAsync(() ->
            paymentGatewayClient.charge(req)  // external call
        );
    }

    // Fallback when circuit is open or retries exhausted
    public CompletableFuture<PaymentResult> fallback(PaymentRequest req, Throwable t) {
        log.warn("Payment gateway unavailable, queuing for retry: {}", t.getMessage());
        paymentRetryQueue.enqueue(req);  // queue for later processing
        return CompletableFuture.completedFuture(
            PaymentResult.pending("Payment queued — will process shortly")
        );
    }
}

// application.yml
// resilience4j.circuitbreaker:
//   instances:
//     paymentGateway:
//       slidingWindowSize: 10
//       failureRateThreshold: 50
//       waitDurationInOpenState: 30s
//       permittedNumberOfCallsInHalfOpenState: 3`}
      </CodeBlock>

      <p><strong>Tools:</strong> Resilience4j (Java), Hystrix (legacy), Polly (.NET), opossum (Node.js)</p>

      <h2>5. Saga Pattern</h2>
      <p>
        The Saga pattern manages distributed transactions across multiple services. Instead of a
        single ACID transaction, a saga is a sequence of local transactions where each service
        publishes an event that triggers the next step. If any step fails, compensating transactions
        undo the previous steps.
      </p>

      <FlowChart
        title="Saga — Choreography vs Orchestration"
        chart={"graph TD\n  subgraph Choreography\n    O1[Order Service] -->|OrderCreated event| P1[Payment Service]\n    P1 -->|PaymentCompleted event| I1[Inventory Service]\n    I1 -->|StockReserved event| S1[Shipping Service]\n  end\n  subgraph Orchestration\n    Orch[Saga Orchestrator] -->|1. Create Order| O2[Order Service]\n    Orch -->|2. Process Payment| P2[Payment Service]\n    Orch -->|3. Reserve Stock| I2[Inventory Service]\n    Orch -->|4. Ship Order| S2[Shipping Service]\n  end"}
      />

      <InfoBox variant="note" title="Choreography vs Orchestration">
        <strong>Choreography:</strong> Each service listens for events and reacts. No central coordinator.
        Simpler but harder to trace the overall flow. Best for 2-4 steps.
        <br /><br />
        <strong>Orchestration:</strong> A central orchestrator tells each service what to do and when.
        Easier to understand, monitor, and modify. Best for 4+ steps or complex flows.
      </InfoBox>

      <h2>6. Database per Service</h2>
      <p>
        Each microservice owns its own database. No other service may query another service&apos;s
        database directly. If service A needs data from service B, it must go through service B&apos;s API.
        This ensures loose coupling and allows each service to choose the best database technology
        for its needs.
      </p>

      <CodeBlock language="text" title="Database per Service — Right and Wrong">
{`✅ CORRECT: Each service owns its database
Order Service   → PostgreSQL (relational, ACID transactions)
Product Service → MongoDB (flexible schema, catalog data)
Search Service  → Elasticsearch (full-text search)
Session Service → Redis (fast key-value, TTL)
Analytics       → ClickHouse (columnar, time-series)

❌ WRONG: Shared database
Order Service   ──┐
Product Service ──┼──→ Single PostgreSQL ← tight coupling!
Search Service  ──┘

❌ WRONG: Direct database access
Order Service → SELECT * FROM products WHERE id = 123
                 ↑ This is a direct query to Product DB!
                 ↑ Use Product Service API instead!`}
      </CodeBlock>

      <h2>7. Event Sourcing</h2>
      <p>
        Instead of storing the current state of an entity, Event Sourcing stores a sequence of
        state-changing events. The current state is derived by replaying all events from the
        beginning. This provides a complete audit trail and enables powerful features like
        time-travel debugging and event replay.
      </p>

      <CodeBlock language="typescript" title="Event Sourcing Example">
{`// Instead of storing: { balance: 150 }
// Store the events that led to that state:

const events = [
  { type: 'AccountCreated', data: { accountId: 'A1', owner: 'Alice' }, timestamp: '2024-01-01' },
  { type: 'MoneyDeposited', data: { accountId: 'A1', amount: 200 }, timestamp: '2024-01-02' },
  { type: 'MoneyWithdrawn', data: { accountId: 'A1', amount: 50 }, timestamp: '2024-01-03' },
];

// Replay events to get current state:
function replay(events: DomainEvent[]): AccountState {
  return events.reduce((state, event) => {
    switch (event.type) {
      case 'AccountCreated': return { ...state, balance: 0, owner: event.data.owner };
      case 'MoneyDeposited': return { ...state, balance: state.balance + event.data.amount };
      case 'MoneyWithdrawn': return { ...state, balance: state.balance - event.data.amount };
      default: return state;
    }
  }, {} as AccountState);
}
// Result: { balance: 150, owner: 'Alice' }`}
      </CodeBlock>

      <h2>8. CQRS (Command Query Responsibility Segregation)</h2>
      <p>
        CQRS splits the read and write models of your application. Commands change state (write),
        queries return data (read). Each side can be optimized independently — the write model
        for consistency and validation, the read model for fast queries and projections.
      </p>

      <FlowChart
        title="CQRS Architecture"
        chart={"graph LR\n  Client[Client] --> CMD[Command API]\n  Client --> QRY[Query API]\n  CMD -->|Write| WDB[(Write DB - Normalized)]\n  WDB -->|Events| SYNC[Event Sync]\n  SYNC -->|Project| RDB[(Read DB - Denormalized)]\n  QRY -->|Read| RDB\n  style CMD fill:#ef4444,color:#fff\n  style QRY fill:#10b981,color:#fff"}
      />

      <h2>9. Strangler Fig</h2>
      <p>
        The Strangler Fig pattern incrementally migrates a monolith to microservices by routing
        traffic one feature at a time to new services. Like the strangler fig tree that gradually
        envelops its host, the new system gradually replaces the old one until the monolith can
        be decommissioned.
      </p>

      <FlowChart
        title="Strangler Fig Migration"
        chart={"graph LR\n  Proxy[Proxy / Router] -->|/auth/*| New1[New Auth Service]\n  Proxy -->|/orders/*| New2[New Order Service]\n  Proxy -->|Everything else| Old[Legacy Monolith]\n  style New1 fill:#10b981,color:#fff\n  style New2 fill:#10b981,color:#fff\n  style Old fill:#ef4444,color:#fff"}
      />

      <h2>10. Sidecar / Service Mesh</h2>
      <p>
        The Sidecar pattern deploys a helper container alongside each service that handles
        cross-cutting concerns: mTLS, retries, circuit breaking, observability, and traffic
        management. A Service Mesh is a collection of sidecars managed by a control plane.
      </p>

      <FlowChart
        title="Service Mesh Architecture"
        chart={"graph TD\n  CP[Control Plane - Istiod] -.->|Config| P1[Envoy Proxy]\n  CP -.->|Config| P2[Envoy Proxy]\n  CP -.->|Config| P3[Envoy Proxy]\n  subgraph Pod A\n    SvcA[Service A] --- P1\n  end\n  subgraph Pod B\n    SvcB[Service B] --- P2\n  end\n  subgraph Pod C\n    SvcC[Service C] --- P3\n  end\n  P1 <-->|mTLS| P2\n  P2 <-->|mTLS| P3"}
      />

      <p><strong>Tools:</strong> Istio, Linkerd, Consul Connect, AWS App Mesh</p>

      <InfoBox variant="info" title="Service Mesh Handles">
        <ul>
          <li><strong>mTLS</strong> — automatic encryption between all services</li>
          <li><strong>Retries &amp; Timeouts</strong> — configurable per-route retry policies</li>
          <li><strong>Circuit Breaking</strong> — built-in circuit breaker in the sidecar</li>
          <li><strong>Observability</strong> — distributed tracing, metrics, and access logs</li>
          <li><strong>Traffic Management</strong> — canary deploys, A/B testing, blue-green</li>
        </ul>
      </InfoBox>

      <h2>Quick Reference — When to Use Each Pattern</h2>

      <table>
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Use When</th>
            <th>Avoid When</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>API Gateway</td>
            <td>Multiple clients, cross-cutting concerns</td>
            <td>Single internal service</td>
          </tr>
          <tr>
            <td>Sync (REST/gRPC)</td>
            <td>Immediate response needed</td>
            <td>Long-running tasks, fire-and-forget</td>
          </tr>
          <tr>
            <td>Async (MQ/Events)</td>
            <td>Decoupling, eventual consistency OK</td>
            <td>User needs immediate confirmation</td>
          </tr>
          <tr>
            <td>Circuit Breaker</td>
            <td>Calling unreliable external services</td>
            <td>Internal calls you fully control</td>
          </tr>
          <tr>
            <td>Saga</td>
            <td>Distributed transactions across services</td>
            <td>Can use a single DB transaction</td>
          </tr>
          <tr>
            <td>DB per Service</td>
            <td>Always — this is a core principle</td>
            <td>Never skip this (avoids distributed monolith)</td>
          </tr>
          <tr>
            <td>Event Sourcing</td>
            <td>Audit trails, undo/replay, complex domains</td>
            <td>Simple CRUD, adds complexity</td>
          </tr>
          <tr>
            <td>CQRS</td>
            <td>Different read/write patterns, high read load</td>
            <td>Simple apps with balanced read/write</td>
          </tr>
          <tr>
            <td>Strangler Fig</td>
            <td>Migrating from monolith incrementally</td>
            <td>Greenfield projects</td>
          </tr>
          <tr>
            <td>Sidecar/Mesh</td>
            <td>Many services, need uniform cross-cutting</td>
            <td>Few services, adds infrastructure cost</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"Your order service needs to call the payment gateway, which has 10% downtime. What pattern prevents cascading failures?"}
        options={[
          'API Gateway',
          'Circuit Breaker',
          'Saga Pattern',
          'Event Sourcing'
        ]}
        correctIndex={1}
        explanation={"The Circuit Breaker pattern wraps the unreliable downstream call. When failures exceed a threshold, the circuit opens and requests fail fast with a fallback response, preventing the order service from being blocked by the payment gateway's downtime."}
      />

      <InteractiveChallenge
        question={"You need to ensure that creating an order, processing payment, and reserving inventory either all succeed or all roll back — but these are in separate services. Which pattern?"}
        options={[
          'Database per Service',
          'CQRS',
          'Saga Pattern',
          'Strangler Fig'
        ]}
        correctIndex={2}
        explanation={"The Saga pattern manages distributed transactions across multiple services using a sequence of local transactions with compensating transactions for rollback. Each step publishes an event that triggers the next step, and if any step fails, compensating transactions undo the previous steps."}
      />

      <h2>Combined Architecture</h2>

      <FlowChart
        title="All Patterns Working Together"
        chart={"graph TD\n  Client[Clients] --> GW[API Gateway - Auth, Rate Limit]\n  GW -->|REST| OrderSvc[Order Service]\n  GW -->|REST| CatalogSvc[Catalog Service]\n  OrderSvc -->|Circuit Breaker| PaySvc[Payment Service]\n  OrderSvc -->|Saga Event| MQ[Message Queue]\n  MQ --> InvSvc[Inventory Service]\n  MQ --> NotifSvc[Notification Service]\n  CatalogSvc -->|CQRS Read| ReadDB[(Read Replica)]\n  CatalogSvc -->|CQRS Write| WriteDB[(Write DB)]\n  WriteDB -->|Events| ES[Event Store]\n  OrderSvc --- SP1[Sidecar Proxy]\n  PaySvc --- SP2[Sidecar Proxy]\n  SP1 <-->|mTLS| SP2"}
      />

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>API Gateway centralizes cross-cutting concerns at the edge</li>
          <li>Circuit Breaker prevents cascading failures</li>
          <li>Saga manages distributed transactions without 2PC</li>
          <li>Database per Service is a non-negotiable principle</li>
          <li>Event Sourcing gives you a complete audit trail</li>
          <li>CQRS optimizes reads and writes independently</li>
          <li>Strangler Fig enables gradual migration</li>
          <li>Service Mesh handles infrastructure concerns transparently</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
