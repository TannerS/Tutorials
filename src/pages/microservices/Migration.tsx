import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Migration() {
  return (
    <LessonLayout
      title="Migration & Decomposition"
      sectionId="microservices"
      lessonIndex={7}
      prev={{ path: '/microservices/containers', label: 'Containers & Kubernetes' }}
      next={null}
    >
      <h2>Migrating from Monolith to Microservices</h2>
      <p>
        Most successful microservices architectures were extracted from monoliths — not designed
        from scratch. Migration is a gradual process that should be driven by concrete business
        needs: independent scaling, team autonomy, or technology diversity. Never migrate for the
        sake of &quot;being microservices.&quot;
      </p>

      <InfoBox variant="warning" title="Common Mistake: Big Bang Rewrite">
        The biggest migration mistake is the &quot;big bang rewrite&quot; — stopping all feature development
        to rewrite the entire monolith as microservices. This fails almost every time because: it takes
        longer than expected, business requirements change during the rewrite, and you end up maintaining
        two systems. Use the Strangler Fig pattern for incremental migration instead.
      </InfoBox>

      <h2>The Strangler Fig Pattern</h2>
      <p>
        Named after the strangler fig tree that gradually envelops its host, this pattern incrementally
        migrates a monolith by routing traffic one feature at a time to new services. The monolith
        gradually shrinks until it can be decommissioned.
      </p>

      <FlowChart
        title="Strangler Fig — Phase by Phase"
        chart={"graph TD\n  subgraph Phase 1 - Start\n    P1[Proxy] -->|All traffic| Mono1[Monolith]\n    Mono1 --> DB1[(Monolith DB)]\n  end\n  subgraph Phase 2 - First Extraction\n    P2[Proxy] -->|/auth/*| Auth[New Auth Service]\n    P2 -->|Everything else| Mono2[Monolith]\n    Auth --> AuthDB[(Auth DB)]\n    Mono2 --> DB2[(Monolith DB)]\n  end\n  subgraph Phase 3 - More Extractions\n    P3[Proxy] -->|/auth/*| Auth2[Auth Service]\n    P3 -->|/orders/*| Order[Order Service]\n    P3 -->|/payments/*| Pay[Payment Service]\n    P3 -->|Everything else| Mono3[Shrinking Monolith]\n  end\n  style Auth fill:#10b981,color:#fff\n  style Auth2 fill:#10b981,color:#fff\n  style Order fill:#10b981,color:#fff\n  style Pay fill:#10b981,color:#fff\n  style Mono3 fill:#f59e0b,color:#fff"}
      />

      <h3>Step-by-Step Migration Strategy</h3>

      <FlowChart
        title="Migration Playbook"
        chart={"graph TD\n  S1[1. Add Proxy Layer] --> S2[2. Identify Service Boundaries]\n  S2 --> S3[3. Extract First Service]\n  S3 --> S4[4. Migrate Data]\n  S4 --> S5[5. Route Traffic]\n  S5 --> S6[6. Verify and Monitor]\n  S6 --> S7{More to extract?}\n  S7 -->|Yes| S2\n  S7 -->|No| S8[8. Decommission Monolith]\n  style S1 fill:#6366f1,color:#fff\n  style S3 fill:#3b82f6,color:#fff\n  style S5 fill:#10b981,color:#fff\n  style S8 fill:#ef4444,color:#fff"}
      />

      <CodeBlock language="yaml" title="Nginx Proxy — Strangler Fig Router">
{`# Phase 1: All traffic goes to monolith
upstream monolith {
  server monolith-app:8080;
}

# Phase 2: Auth traffic goes to new service
upstream auth_service {
  server auth-service:8080;
}

# Phase 3: Orders traffic goes to new service
upstream order_service {
  server order-service:8080;
}

server {
  listen 80;

  # New services — extracted from monolith
  location /api/v1/auth/ {
    proxy_pass http://auth_service;
    proxy_set_header X-Request-ID $request_id;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /api/v1/orders/ {
    proxy_pass http://order_service;
    proxy_set_header X-Request-ID $request_id;
  }

  # Everything else — still handled by monolith
  location / {
    proxy_pass http://monolith;
    proxy_set_header X-Request-ID $request_id;
  }
}`}
      </CodeBlock>

      <h2>Domain-Driven Design (DDD) for Service Boundaries</h2>
      <p>
        The hardest part of microservices is not the technology — it is finding the right service
        boundaries. Get this wrong and you end up with a distributed monolith. Domain-Driven Design
        (DDD) provides the tools to identify natural boundaries in your system.
      </p>

      <h3>Bounded Contexts</h3>
      <p>
        A bounded context is a boundary within which a particular domain model is defined and
        applicable. Different bounded contexts may use the same word (e.g., &quot;Account&quot;) to mean
        completely different things — and that is fine. Each bounded context maps to one microservice.
      </p>

      <FlowChart
        title="Bounded Contexts — E-Commerce Example"
        chart={"graph TD\n  subgraph Sales Context\n    SC[Customer = buyer with cart]\n    SC --> SO[Order = items + pricing]\n  end\n  subgraph Shipping Context\n    ShC[Customer = delivery address]\n    ShC --> ShO[Order = package + tracking]\n  end\n  subgraph Billing Context\n    BC[Customer = payment method]\n    BC --> BO[Order = invoice + payment]\n  end\n  subgraph Catalog Context\n    CC[Product = name + description + images]\n  end\n  style SC fill:#3b82f6,color:#fff\n  style ShC fill:#10b981,color:#fff\n  style BC fill:#f59e0b,color:#fff\n  style CC fill:#8b5cf6,color:#fff"}
      />

      <InfoBox variant="info" title="Context Mapping">
        Notice how &quot;Customer&quot; means different things in each context: in Sales, it is a buyer with a
        shopping cart. In Shipping, it is a delivery address. In Billing, it is a payment method.
        These are different models of the same real-world entity — and they should be in separate
        services with separate databases.
      </InfoBox>

      <h3>Event Storming — Finding Boundaries</h3>
      <p>
        Event Storming is a collaborative workshop technique for discovering domain events, commands,
        aggregates, and bounded contexts. It is the most effective way to find microservice boundaries.
      </p>

      <CodeBlock language="text" title="Event Storming — Discovery Process">
{`Step 1: Discover Domain Events (orange sticky notes)
  → OrderPlaced, PaymentProcessed, ItemShipped, UserRegistered,
    InventoryReserved, RefundIssued, ReviewSubmitted

Step 2: Identify Commands (blue sticky notes)
  → PlaceOrder, ProcessPayment, ShipItem, RegisterUser,
    ReserveInventory, IssueRefund, SubmitReview

Step 3: Group into Aggregates (yellow sticky notes)
  → Order (PlaceOrder, CancelOrder)
  → Payment (ProcessPayment, IssueRefund)
  → Shipment (ShipItem, TrackShipment)
  → User (RegisterUser, UpdateProfile)
  → Inventory (ReserveStock, ReleaseStock)

Step 4: Draw Bounded Context Boundaries
  → Events that frequently interact = same context
  → Events that rarely interact = different contexts
  → Look for language differences (same word, different meaning)

Step 5: Map to Microservices
  → Each bounded context = one microservice
  → Each microservice = own database + own team`}
      </CodeBlock>

      <h2>Decomposition Strategies</h2>
      <p>
        There are several strategies for decomposing a monolith. The best approach depends on your
        monolith&apos;s structure and your business priorities.
      </p>

      <h3>1. Decompose by Business Capability</h3>
      <p>
        The most recommended approach. Identify business capabilities (what the business does) and
        create a service for each. This aligns with Conway&apos;s Law — the system architecture mirrors
        the organization structure.
      </p>

      <CodeBlock language="text" title="Decomposition by Business Capability">
{`E-Commerce Business Capabilities:
├── Product Management    → Catalog Service
│   ├── Product CRUD
│   ├── Categories
│   └── Pricing rules
├── Order Management      → Order Service
│   ├── Shopping cart
│   ├── Checkout flow
│   └── Order history
├── Payment Processing    → Payment Service
│   ├── Credit cards
│   ├── PayPal / Stripe
│   └── Refunds
├── Inventory Management  → Inventory Service
│   ├── Stock levels
│   ├── Warehouses
│   └── Replenishment
├── Shipping & Delivery   → Shipping Service
│   ├── Carrier selection
│   ├── Tracking
│   └── Returns
└── User Management       → User Service
    ├── Authentication
    ├── Profiles
    └── Preferences`}
      </CodeBlock>

      <h3>2. Decompose by Subdomain (DDD)</h3>
      <p>
        Use DDD to identify core, supporting, and generic subdomains:
      </p>
      <ul>
        <li><strong>Core subdomain</strong> — your competitive advantage. Build custom. Invest the best engineers. (e.g., recommendation engine, pricing algorithm)</li>
        <li><strong>Supporting subdomain</strong> — necessary but not differentiating. Build or buy. (e.g., order management, inventory)</li>
        <li><strong>Generic subdomain</strong> — commodity. Buy off-the-shelf. (e.g., auth, email, payments via Stripe)</li>
      </ul>

      <h3>3. Decompose by Change Frequency</h3>
      <p>
        Extract the parts that change most frequently. If your pricing engine changes weekly but
        your user management changes quarterly, extracting the pricing engine lets that team deploy
        independently without risking the stable user management code.
      </p>

      <h2>The Modular Monolith as Stepping Stone</h2>
      <p>
        Before jumping to microservices, refactor your monolith into a modular monolith. This gives
        you clear boundaries and module APIs without the distributed systems complexity. Each module
        can later be extracted into a service.
      </p>

      <FlowChart
        title="Modular Monolith → Microservices Path"
        chart={"graph LR\n  A[Spaghetti Monolith] --> B[Modular Monolith]\n  B --> C[Extract First Service]\n  C --> D[Extract More Services]\n  D --> E[Microservices]\n  style A fill:#ef4444,color:#fff\n  style B fill:#f59e0b,color:#fff\n  style C fill:#3b82f6,color:#fff\n  style D fill:#6366f1,color:#fff\n  style E fill:#10b981,color:#fff"}
      />

      <CodeBlock language="typescript" title="Modular Monolith — Module Interfaces">
{`// Step 1: Define clear module interfaces
// Each module exposes ONLY its public API

// orders/index.ts — public API
export interface OrderModule {
  createOrder(request: CreateOrderRequest): Promise<OrderDTO>;
  getOrder(orderId: string): Promise<OrderDTO | null>;
  getOrdersByCustomer(customerId: string): Promise<OrderDTO[]>;
  cancelOrder(orderId: string): Promise<void>;
}

// payments/index.ts — public API
export interface PaymentModule {
  processPayment(orderId: string, amount: number): Promise<PaymentDTO>;
  refundPayment(paymentId: string): Promise<void>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

// Step 2: Modules communicate ONLY through these interfaces
// The calling code uses dependency injection
class CheckoutService {
  constructor(
    private orderModule: OrderModule,
    private paymentModule: PaymentModule,
  ) {}

  async checkout(request: CheckoutRequest): Promise<CheckoutResult> {
    const order = await this.orderModule.createOrder(request);
    const payment = await this.paymentModule.processPayment(
      order.id, order.total
    );
    return { orderId: order.id, paymentId: payment.id };
  }
}

// Step 3: When ready to extract, replace the in-process module
// with an HTTP client that implements the same interface
class OrderModuleHttpClient implements OrderModule {
  constructor(private baseUrl: string) {}

  async createOrder(request: CreateOrderRequest): Promise<OrderDTO> {
    const { data } = await axios.post(
      \`\${this.baseUrl}/api/orders\`, request
    );
    return data;
  }

  async getOrder(orderId: string): Promise<OrderDTO | null> {
    try {
      const { data } = await axios.get(
        \`\${this.baseUrl}/api/orders/\${orderId}\`
      );
      return data;
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }
  // ... other methods follow the same pattern
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Interface Trick">
        When your modular monolith modules communicate through interfaces, extracting a service is
        just replacing the in-process implementation with an HTTP client that implements the same
        interface. The calling code does not change at all. This makes migration safe and reversible.
      </InfoBox>

      <h2>Common Migration Mistakes</h2>

      <CodeBlock language="text" title="Anti-Patterns to Avoid">
{`❌ Big Bang Rewrite
   Stop everything, rewrite from scratch, deploy all at once.
   → Fails 90% of the time. Takes 2-3x longer than estimated.

❌ Shared Database
   Extract services but keep them pointing at the same database.
   → Creates a distributed monolith. Services cannot evolve independently.

❌ Splitting Too Small
   Creating a service for every entity (UserService, AddressService,
   PhoneNumberService).
   → Nano-services create massive overhead for no benefit.

❌ Ignoring Data Migration
   Moving code to a new service but leaving data in the monolith DB.
   → The new service is still coupled to the monolith.

❌ No Proxy/Router Layer
   Clients call services directly — every extraction changes client code.
   → Use an API gateway or reverse proxy from day one.

❌ Migrating Without Tests
   Extracting code without comprehensive integration tests.
   → You cannot verify the extraction preserved behavior.

✅ CORRECT APPROACH:
✅ Incremental extraction (Strangler Fig)
✅ Start with the easiest, most independent module
✅ Proxy layer from day one
✅ Each service owns its own database
✅ Comprehensive integration tests before and after extraction
✅ Feature flags for gradual traffic shifting
✅ Rollback plan for every extraction`}
      </CodeBlock>

      <h2>Migration Checklist</h2>

      <table>
        <thead>
          <tr>
            <th>Phase</th>
            <th>Tasks</th>
            <th>Verify</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Prepare</strong></td>
            <td>Add proxy layer, write integration tests, identify boundaries</td>
            <td>Tests pass, proxy routes all traffic to monolith</td>
          </tr>
          <tr>
            <td><strong>Extract</strong></td>
            <td>Build new service, implement API, migrate data</td>
            <td>Service works standalone with its own DB</td>
          </tr>
          <tr>
            <td><strong>Route</strong></td>
            <td>Update proxy to route traffic to new service</td>
            <td>Feature flags or canary deployment for gradual rollout</td>
          </tr>
          <tr>
            <td><strong>Verify</strong></td>
            <td>Monitor error rates, latency, data consistency</td>
            <td>Error rate same or lower, latency acceptable</td>
          </tr>
          <tr>
            <td><strong>Clean</strong></td>
            <td>Remove extracted code from monolith, clean DB</td>
            <td>Monolith still works without the extracted feature</td>
          </tr>
        </tbody>
      </table>

      <h2>Real-World Migration Timeline</h2>

      <CodeBlock language="text" title="Migration Timeline — E-Commerce Platform">
{`Month 1-2: Preparation
├── Add Nginx reverse proxy in front of monolith
├── Write integration tests for all critical paths
├── Run Event Storming workshop — identify 6 bounded contexts
├── Set up Kubernetes cluster and CI/CD pipeline
└── Choose first extraction target: Auth (low risk, clear boundary)

Month 3-4: Extract Auth Service
├── Build Auth Service (Node.js + Redis)
├── Implement same API contract as monolith auth endpoints
├── Migrate user data to Auth Service database
├── Route /auth/* traffic through proxy to new service
├── Monitor for 2 weeks — compare error rates
└── Remove auth code from monolith

Month 5-6: Extract Payment Service
├── Build Payment Service (strict PCI compliance needs)
├── Use message queue for async order → payment communication
├── Implement saga for order creation flow
└── Gradual rollout with feature flags

Month 7-9: Extract Order and Inventory Services
├── More complex — these have many dependencies
├── Use Transactional Outbox for reliable event publishing
├── Implement CQRS for order views (high read traffic)
└── Performance testing before and after

Month 10-12: Extract remaining and decommission
├── Extract Catalog and Notification services
├── Gradually shift all traffic away from monolith
├── Decommission monolith
└── Full microservices running in production`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You are migrating a monolith and need to pick the first service to extract. Which is the best candidate?"}
        options={[
          'The most complex module with the most dependencies',
          'A simple, well-bounded module with few dependencies (e.g., auth)',
          'The core business logic that generates the most revenue',
          'A module that is rarely used or changed'
        ]}
        correctIndex={1}
        explanation={"Start with a simple, well-bounded module that has few dependencies on other modules. Auth is a classic first extraction because it has clear boundaries, a well-defined API, and other services depend on it but it does not depend on many services. This lets you prove the extraction process and infrastructure before tackling more complex extractions."}
      />

      <InteractiveChallenge
        question={"In a modular monolith, how should modules communicate with each other?"}
        options={[
          "Direct database queries to each other's tables",
          'Shared global state and singletons',
          'Through well-defined interfaces / public APIs',
          'Through a shared message queue'
        ]}
        correctIndex={2}
        explanation={"Modules in a modular monolith should communicate ONLY through well-defined interfaces (public APIs). This is the key principle that makes later extraction to microservices possible — when you extract a module to its own service, you simply replace the in-process implementation with an HTTP client that implements the same interface. Direct database access creates tight coupling that prevents extraction."}
      />

      <h2>Summary</h2>

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>Use the Strangler Fig pattern — incrementally extract, never big bang rewrite</li>
          <li>DDD Bounded Contexts are the best tool for finding service boundaries</li>
          <li>Event Storming workshops discover domain events, commands, and boundaries collaboratively</li>
          <li>Start with a modular monolith — define clear module interfaces first</li>
          <li>Extract the simplest, most independent module first (typically auth or notifications)</li>
          <li>Each extracted service must own its own database — no shared databases</li>
          <li>Always have a proxy/router layer so extraction does not change client code</li>
          <li>Write comprehensive integration tests before extraction to verify preserved behavior</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
