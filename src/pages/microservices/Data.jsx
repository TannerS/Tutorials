import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Data() {
  return (
    <LessonLayout
      title="Data Patterns & CQRS"
      sectionId="microservices"
      lessonIndex={3}
      prev={{ path: '/microservices/communication', label: 'Service Communication' }}
      next={{ path: '/microservices/scaling', label: 'Scaling Strategies' }}
    >
      <h2>Data Management in Microservices</h2>
      <p>
        Data management is the hardest part of microservices. In a monolith, you have one database
        with ACID transactions and JOINs across all your data. In microservices, each service owns
        its data, and you must deal with eventual consistency, distributed transactions, and data
        synchronization.
      </p>

      <FlowChart
        title="Data Patterns Landscape"
        chart={"graph TD\n  A[Data Patterns] --> B[Database per Service]\n  A --> C[Event Sourcing]\n  A --> D[CQRS]\n  A --> E[Saga Pattern]\n  B --> B1[Polyglot Persistence]\n  C --> C1[Event Store]\n  C --> C2[Projections]\n  D --> D1[Command Model]\n  D --> D2[Query Model]\n  E --> E1[Choreography]\n  E --> E2[Orchestration]"}
      />

      <h2>Database per Service</h2>
      <p>
        This is the foundational data pattern in microservices. Each service owns its database, and
        no other service may access it directly. This ensures loose coupling — you can change your
        database schema, switch database technologies, or scale your database without affecting
        other services.
      </p>

      <FlowChart
        title="Database per Service — Polyglot Persistence"
        chart={"graph TD\n  OrderSvc[Order Service] --> PG[(PostgreSQL)]\n  CatalogSvc[Catalog Service] --> Mongo[(MongoDB)]\n  SearchSvc[Search Service] --> ES[(Elasticsearch)]\n  SessionSvc[Session Service] --> Redis[(Redis)]\n  AnalyticsSvc[Analytics Service] --> CH[(ClickHouse)]\n  style PG fill:#336791,color:#fff\n  style Mongo fill:#47A248,color:#fff\n  style ES fill:#FEC514,color:#000\n  style Redis fill:#DC382D,color:#fff\n  style CH fill:#FFCC00,color:#000"}
      />

      <InfoBox variant="info" title="Polyglot Persistence">
        With database per service, each service can choose the best database for its needs.
        Orders need ACID transactions → PostgreSQL. Product catalog needs flexible schema → MongoDB.
        Search needs full-text indexing → Elasticsearch. Sessions need fast TTL-based storage → Redis.
        This is called Polyglot Persistence.
      </InfoBox>

      <CodeBlock language="typescript" title="Service API Boundary — No Direct DB Access">
{`// ❌ WRONG: Order service directly queries product database
class OrderService {
  async createOrder(items: OrderItem[]) {
    // Direct query to another service's database!
    const products = await productDb.query(
      'SELECT * FROM products WHERE id = ANY($1)', [items.map(i => i.productId)]
    );
    // This creates tight coupling!
  }
}

// ✅ CORRECT: Order service calls product service API
class OrderService {
  constructor(private productClient: ProductServiceClient) {}

  async createOrder(items: OrderItem[]) {
    // Call product service via its API
    const products = await Promise.all(
      items.map(item => this.productClient.getProduct(item.productId))
    );

    // Validate prices, stock, etc.
    const validatedItems = items.map((item, i) => ({
      ...item,
      price: products[i].price,  // use authoritative price from product service
      name: products[i].name,
    }));

    // Save order with own database
    return this.orderRepository.save({
      items: validatedItems,
      total: validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      status: 'PENDING',
    });
  }
}`}
      </CodeBlock>

      <h2>Event Sourcing Deep Dive</h2>
      <p>
        Event Sourcing stores every state change as an immutable event. Instead of updating a row
        in the database, you append a new event. The current state is derived by replaying all events
        from the beginning (or from a snapshot).
      </p>

      <FlowChart
        title="Event Sourcing — State Reconstruction"
        chart={"graph LR\n  E1[AccountCreated] --> E2[MoneyDeposited $200]\n  E2 --> E3[MoneyWithdrawn $50]\n  E3 --> E4[MoneyDeposited $100]\n  E4 --> E5[MoneyWithdrawn $30]\n  E5 --> State[Current State: $220]\n  style E1 fill:#3b82f6,color:#fff\n  style E2 fill:#10b981,color:#fff\n  style E3 fill:#ef4444,color:#fff\n  style E4 fill:#10b981,color:#fff\n  style E5 fill:#ef4444,color:#fff\n  style State fill:#8b5cf6,color:#fff"}
      />

      <CodeBlock language="typescript" title="Event Sourcing — Full Implementation">
{`// Domain Events — immutable facts
interface DomainEvent {
  eventId: string;
  aggregateId: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  version: number;
}

// Event Store — append-only
class EventStore {
  private events: Map<string, DomainEvent[]> = new Map();

  async append(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    const existing = this.events.get(aggregateId) || [];

    // Optimistic concurrency check
    if (existing.length !== expectedVersion) {
      throw new ConcurrencyError(
        \`Expected version \${expectedVersion}, but found \${existing.length}\`
      );
    }

    this.events.set(aggregateId, [...existing, ...events]);
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    return this.events.get(aggregateId) || [];
  }
}

// Aggregate — applies events to build state
class BankAccount {
  private balance = 0;
  private owner = '';
  private version = 0;
  private uncommittedEvents: DomainEvent[] = [];

  // Rebuild state from events
  static fromEvents(events: DomainEvent[]): BankAccount {
    const account = new BankAccount();
    events.forEach(event => account.apply(event));
    return account;
  }

  // Command: deposit money
  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.addEvent('MoneyDeposited', { amount });
  }

  // Command: withdraw money
  withdraw(amount: number): void {
    if (amount > this.balance) throw new Error('Insufficient funds');
    this.addEvent('MoneyWithdrawn', { amount });
  }

  // Apply event to state (pure function)
  private apply(event: DomainEvent): void {
    switch (event.type) {
      case 'AccountCreated':
        this.owner = event.data.owner as string;
        this.balance = 0;
        break;
      case 'MoneyDeposited':
        this.balance += event.data.amount as number;
        break;
      case 'MoneyWithdrawn':
        this.balance -= event.data.amount as number;
        break;
    }
    this.version = event.version;
  }

  private addEvent(type: string, data: Record<string, unknown>): void {
    const event: DomainEvent = {
      eventId: crypto.randomUUID(),
      aggregateId: this.owner,
      type,
      data,
      timestamp: new Date(),
      version: this.version + this.uncommittedEvents.length + 1,
    };
    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] { return this.uncommittedEvents; }
  getBalance(): number { return this.balance; }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Use Event Sourcing">
        <ul>
          <li><strong>Audit trails</strong> — financial systems, compliance, regulatory requirements</li>
          <li><strong>Temporal queries</strong> — what was the account balance on March 15?</li>
          <li><strong>Event replay</strong> — rebuild read models, fix bugs retroactively</li>
          <li><strong>Complex domains</strong> — DDD aggregates with rich business rules</li>
        </ul>
        <strong>Avoid when:</strong> simple CRUD applications, the added complexity is not justified.
      </InfoBox>

      <h2>CQRS Deep Dive</h2>
      <p>
        CQRS (Command Query Responsibility Segregation) derives from the CQS (Command-Query Separation)
        principle: a method should either change state (command) or return data (query) — never both.
        CQRS applies this at the architectural level by splitting the read and write sides of your
        application.
      </p>

      <h3>Commands vs Queries</h3>
      <CodeBlock language="typescript" title="CQS Principle — Commands and Queries">
{`// COMMANDS — change state, return void (or just an ID)
interface Command {}

class CreateOrderCommand implements Command {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItemDTO[],
  ) {}
}

class CancelOrderCommand implements Command {
  constructor(public readonly orderId: string) {}
}

// QUERIES — return data, no side effects
interface Query<T> {}

class GetOrderQuery implements Query<OrderDTO> {
  constructor(public readonly orderId: string) {}
}

class GetOrdersByCustomerQuery implements Query<OrderDTO[]> {
  constructor(
    public readonly customerId: string,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}

// Command Handler — writes to write model
class CreateOrderHandler {
  async execute(cmd: CreateOrderCommand): Promise<string> {
    const order = Order.create(cmd.customerId, cmd.items);
    await this.writeRepository.save(order);
    await this.eventBus.publish(new OrderCreatedEvent(order));
    return order.id;  // only return the ID
  }
}

// Query Handler — reads from read model
class GetOrderHandler {
  async execute(query: GetOrderQuery): Promise<OrderDTO> {
    return this.readRepository.findById(query.orderId);
  }
}`}
      </CodeBlock>

      <h3>Three Levels of CQRS</h3>

      <FlowChart
        title="CQRS — Three Levels of Separation"
        chart={"graph TD\n  subgraph Level 1 - Same DB Split Services\n    CMD1[Command Service] --> DB1[(Single DB)]\n    QRY1[Query Service] --> DB1\n  end\n  subgraph Level 2 - Same DB Split Models\n    CMD2[Command Service] --> WT[Write Tables]\n    QRY2[Query Service] --> RT[Read Views]\n    WT --> DB2[(Single DB)]\n    RT --> DB2\n  end\n  subgraph Level 3 - Separate DBs\n    CMD3[Command Service] --> WDB[(Write DB)]\n    WDB -->|Events| SYNC[Event Sync]\n    SYNC --> RDB[(Read DB)]\n    QRY3[Query Service] --> RDB\n  end"}
      />

      <InfoBox variant="note" title="Choosing Your CQRS Level">
        <strong>Level 1:</strong> Simple separation of command and query code paths. Same database.
        Low risk, easy to implement. Start here.
        <br /><br />
        <strong>Level 2:</strong> Same database but with separate write tables (normalized) and read
        views/materialized views (denormalized). Good balance of consistency and read performance.
        <br /><br />
        <strong>Level 3:</strong> Completely separate databases. Write DB optimized for consistency
        (PostgreSQL), read DB optimized for queries (Elasticsearch, Redis). Events synchronize them.
        Introduces eventual consistency — only use when Level 2 is not sufficient.
      </InfoBox>

      <CodeBlock language="typescript" title="CQRS Level 3 — Separate Read/Write Models">
{`// Write side — normalized, optimized for consistency
// PostgreSQL tables: orders, order_items, payments
class OrderWriteRepository {
  async save(order: Order): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert('orders', {
        id: order.id,
        customer_id: order.customerId,
        status: order.status,
        total: order.total,
        created_at: order.createdAt,
      });
      for (const item of order.items) {
        await tx.insert('order_items', {
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
        });
      }
    });
  }
}

// Read side — denormalized, optimized for fast queries
// Elasticsearch index: order_views (single document per order)
class OrderReadRepository {
  async findById(id: string): Promise<OrderDTO | null> {
    const doc = await this.elastic.get({ index: 'order_views', id });
    return doc ? this.toDTO(doc) : null;
  }

  async findByCustomer(customerId: string, page: number): Promise<OrderDTO[]> {
    const result = await this.elastic.search({
      index: 'order_views',
      body: {
        query: { term: { customer_id: customerId } },
        sort: [{ created_at: 'desc' }],
        from: page * 20,
        size: 20,
      },
    });
    return result.hits.hits.map(hit => this.toDTO(hit._source));
  }
}

// Event handler — syncs write DB → read DB
class OrderProjectionHandler {
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.elastic.index({
      index: 'order_views',
      id: event.orderId,
      body: {
        order_id: event.orderId,
        customer_id: event.customerId,
        customer_name: event.customerName,  // denormalized!
        items: event.items,                  // embedded array
        total: event.total,
        status: 'CREATED',
        created_at: event.timestamp,
      },
    });
  }

  async onOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
    await this.elastic.update({
      index: 'order_views',
      id: event.orderId,
      body: { doc: { status: event.newStatus, updated_at: event.timestamp } },
    });
  }
}`}
      </CodeBlock>

      <h2>Saga Pattern — Distributed Transactions</h2>
      <p>
        When a business operation spans multiple services, you cannot use a single database
        transaction. The Saga pattern breaks the operation into a sequence of local transactions,
        each publishing an event that triggers the next step. If any step fails, compensating
        transactions undo the previous steps.
      </p>

      <h3>Choreography Saga</h3>
      <p>
        Each service listens for events and decides what to do next. No central coordinator.
        Simple for 2-4 steps but becomes hard to follow with more steps.
      </p>

      <FlowChart
        title="Saga Choreography — Order Flow"
        chart={"graph LR\n  O[Order Service] -->|OrderCreated| P[Payment Service]\n  P -->|PaymentCompleted| I[Inventory Service]\n  I -->|StockReserved| S[Shipping Service]\n  S -->|ShipmentCreated| O\n  P -->|PaymentFailed| O\n  I -->|StockUnavailable| P\n  style O fill:#3b82f6,color:#fff\n  style P fill:#10b981,color:#fff\n  style I fill:#f59e0b,color:#fff\n  style S fill:#8b5cf6,color:#fff"}
      />

      <h3>Orchestration Saga</h3>
      <p>
        A central orchestrator coordinates the saga. It tells each service what to do and handles
        compensation if any step fails. Easier to understand, test, and monitor.
      </p>

      <CodeBlock language="typescript" title="Saga Orchestrator — Order Processing">
{`class CreateOrderSaga {
  private steps: SagaStep[] = [
    {
      name: 'createOrder',
      action: (ctx) => this.orderService.create(ctx.order),
      compensate: (ctx) => this.orderService.cancel(ctx.orderId),
    },
    {
      name: 'processPayment',
      action: (ctx) => this.paymentService.charge(ctx.orderId, ctx.total),
      compensate: (ctx) => this.paymentService.refund(ctx.paymentId),
    },
    {
      name: 'reserveInventory',
      action: (ctx) => this.inventoryService.reserve(ctx.items),
      compensate: (ctx) => this.inventoryService.release(ctx.items),
    },
    {
      name: 'scheduleShipping',
      action: (ctx) => this.shippingService.schedule(ctx.orderId, ctx.address),
      compensate: (ctx) => this.shippingService.cancel(ctx.shipmentId),
    },
  ];

  async execute(orderRequest: CreateOrderRequest): Promise<OrderResult> {
    const ctx: SagaContext = { order: orderRequest };
    const completedSteps: SagaStep[] = [];

    for (const step of this.steps) {
      try {
        console.log(\`Executing step: \${step.name}\`);
        const result = await step.action(ctx);
        Object.assign(ctx, result);  // merge result into context
        completedSteps.push(step);
      } catch (error) {
        console.error(\`Step \${step.name} failed: \${error.message}\`);
        // Compensate in reverse order
        for (const completed of completedSteps.reverse()) {
          try {
            console.log(\`Compensating: \${completed.name}\`);
            await completed.compensate(ctx);
          } catch (compError) {
            console.error(\`Compensation failed for \${completed.name}\`, compError);
            // Log for manual intervention
          }
        }
        throw new SagaFailedError(step.name, error);
      }
    }

    return { orderId: ctx.orderId, status: 'CONFIRMED' };
  }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Saga Pitfalls">
        <ul>
          <li><strong>Compensating transactions must be idempotent</strong> — they may be retried</li>
          <li><strong>Some actions cannot be compensated</strong> — you cannot un-send an email or un-charge a credit card (you can only refund)</li>
          <li><strong>Eventual consistency</strong> — during the saga, the system is in an inconsistent state (order exists but payment not processed yet)</li>
          <li><strong>Observability is critical</strong> — you need saga status tracking and dead letter queues</li>
        </ul>
      </InfoBox>

      <h2>Data Consistency Patterns</h2>

      <table>
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Consistency</th>
            <th>Use When</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Transactional Outbox</td>
            <td>At-least-once delivery</td>
            <td>Writing to DB and publishing events atomically</td>
          </tr>
          <tr>
            <td>Change Data Capture (CDC)</td>
            <td>Near real-time sync</td>
            <td>Syncing data between services via DB log tailing</td>
          </tr>
          <tr>
            <td>Saga</td>
            <td>Eventual</td>
            <td>Distributed transactions across services</td>
          </tr>
          <tr>
            <td>Event Sourcing</td>
            <td>Strong (per aggregate)</td>
            <td>Audit trails, complex domain logic, temporal queries</td>
          </tr>
          <tr>
            <td>CQRS</td>
            <td>Eventual (read model lag)</td>
            <td>Different read/write optimization needs</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="typescript" title="Transactional Outbox Pattern">
{`// Problem: writing to DB and publishing to Kafka is not atomic.
// If the app crashes after DB write but before Kafka publish,
// the event is lost.

// Solution: write the event to an outbox table in the SAME transaction
class OrderService {
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    return this.db.transaction(async (tx) => {
      // 1. Save order
      const order = await tx.insert('orders', { ...request, status: 'CREATED' });

      // 2. Save event to outbox table (same transaction!)
      await tx.insert('outbox_events', {
        id: crypto.randomUUID(),
        aggregate_type: 'Order',
        aggregate_id: order.id,
        event_type: 'OrderCreated',
        payload: JSON.stringify({ orderId: order.id, items: request.items }),
        created_at: new Date(),
        published: false,
      });

      return order;
    });
  }
}

// Separate process: poll outbox table and publish to Kafka
// (or use CDC / Debezium to stream outbox changes automatically)`}
      </CodeBlock>

      <InteractiveChallenge
        question={"In CQRS Level 3, the read model shows stale data for a few milliseconds after a write. What is this called?"}
        options={[
          'Strong consistency',
          'Causal consistency',
          'Eventual consistency',
          'Linearizability'
        ]}
        correctIndex={2}
        explanation={"In CQRS Level 3 with separate read and write databases, there is a delay between when data is written and when it appears in the read model. This is eventual consistency — the read model will eventually catch up, but there is a window where it shows stale data. This is the tradeoff for having optimized read models."}
      />

      <InteractiveChallenge
        question={"What is the key advantage of the Transactional Outbox pattern over publishing events directly to Kafka?"}
        options={[
          'It is faster than direct publishing',
          'It guarantees at-least-once delivery by making DB write and event publish atomic',
          'It eliminates the need for a message broker',
          'It provides exactly-once delivery'
        ]}
        correctIndex={1}
        explanation={"The Transactional Outbox pattern writes the event to an outbox table in the SAME database transaction as the business data. This guarantees that if the data is written, the event is also written — atomically. A separate process then publishes the outbox events to Kafka, ensuring at-least-once delivery."}
      />

      <h2>Summary</h2>

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>Database per Service is non-negotiable — never query another service&apos;s DB</li>
          <li>Event Sourcing stores events, not state — enables audit trails and temporal queries</li>
          <li>CQRS has 3 levels — start with Level 1, escalate only when needed</li>
          <li>Commands change state (return void); Queries return data (no side effects)</li>
          <li>Sagas manage distributed transactions — prefer orchestration for complex flows</li>
          <li>Transactional Outbox ensures atomic DB writes + event publishing</li>
          <li>Embrace eventual consistency — it is the price of independent services</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
