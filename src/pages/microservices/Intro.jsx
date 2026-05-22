import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="Monolith vs Microservices"
      sectionId="microservices"
      lessonIndex={0}
      prev={null}
      next={{ path: '/microservices/patterns', label: 'Core Patterns (10)' }}
    >
      <h2>What Are Microservices?</h2>
      <p>
        Microservices architecture is an approach where an application is built as a collection of
        small, independently deployable services, each running in its own process and communicating
        via lightweight mechanisms (usually HTTP/REST or messaging). Each service is built around a
        specific business capability and can be developed, deployed, and scaled independently.
      </p>

      <InfoBox variant="info" title="Key Insight">
        Microservices are not about size — they are about independence. A microservice owns its own
        data, can be deployed without coordinating with other services, and can be rewritten without
        affecting the rest of the system. The &quot;micro&quot; refers to scope of responsibility, not lines of code.
      </InfoBox>

      <h2>The Monolith</h2>
      <p>
        A monolithic application is deployed as a single unit. All the business logic, data access,
        and UI live in one codebase, share one database, and are deployed together. Monoliths are
        the natural starting point for most applications — and that is perfectly fine.
      </p>

      <FlowChart
        title="Monolithic Architecture"
        chart={"graph TD\n  Client[Client Browser] --> LB[Load Balancer]\n  LB --> App[Monolith Application]\n  App --> Auth[Auth Module]\n  App --> Orders[Orders Module]\n  App --> Payments[Payments Module]\n  App --> Inventory[Inventory Module]\n  Auth --> DB[(Single Database)]\n  Orders --> DB\n  Payments --> DB\n  Inventory --> DB"}
      />

      <h3>Monolith Pros</h3>
      <ul>
        <li><strong>Simple development</strong> — one codebase, one IDE, easy to understand end-to-end</li>
        <li><strong>Simple deployment</strong> — deploy one artifact (WAR, JAR, Docker image)</li>
        <li><strong>Simple testing</strong> — end-to-end tests run in one process</li>
        <li><strong>Fast internal calls</strong> — in-process method calls, no network latency</li>
        <li><strong>Single database</strong> — ACID transactions, JOINs across all data</li>
        <li><strong>Easy debugging</strong> — one log, one stack trace, one debugger session</li>
      </ul>

      <h3>Monolith Cons</h3>
      <ul>
        <li><strong>Scales as a whole</strong> — cannot scale individual components independently</li>
        <li><strong>Deployment risk</strong> — one bug can take down the entire application</li>
        <li><strong>Tech stack locked</strong> — entire app must use the same language/framework</li>
        <li><strong>Team coupling</strong> — large teams stepping on each other, merge conflicts</li>
        <li><strong>Slow builds</strong> — as the codebase grows, build and test times increase</li>
      </ul>

      <h2>Microservices Architecture</h2>

      <FlowChart
        title="Microservices Architecture"
        chart={"graph TD\n  Client[Client Browser] --> GW[API Gateway]\n  GW --> AuthSvc[Auth Service]\n  GW --> OrderSvc[Order Service]\n  GW --> PaySvc[Payment Service]\n  GW --> InvSvc[Inventory Service]\n  AuthSvc --> AuthDB[(Auth DB)]\n  OrderSvc --> OrderDB[(Order DB)]\n  PaySvc --> PayDB[(Payment DB)]\n  InvSvc --> InvDB[(Inventory DB)]\n  OrderSvc -->|async| MQ[Message Queue]\n  MQ --> PaySvc\n  MQ --> InvSvc"}
      />

      <h3>Microservices Pros</h3>
      <ul>
        <li><strong>Independent deployment</strong> — deploy services without touching others</li>
        <li><strong>Independent scaling</strong> — scale hot services (e.g., search) without scaling everything</li>
        <li><strong>Isolated failures</strong> — one service crashing does not take down the system</li>
        <li><strong>Team autonomy</strong> — each team owns a service end-to-end</li>
        <li><strong>Technology diversity</strong> — use the best tool for each job (Java for one service, Node for another)</li>
        <li><strong>Faster CI/CD</strong> — small services build and deploy quickly</li>
      </ul>

      <h3>Microservices Cons</h3>
      <ul>
        <li><strong>Network complexity</strong> — every call is a network call (latency, failures)</li>
        <li><strong>Distributed transactions</strong> — no ACID across services, need sagas</li>
        <li><strong>Operational overhead</strong> — more services to monitor, deploy, and debug</li>
        <li><strong>Data consistency</strong> — eventual consistency is harder to reason about</li>
        <li><strong>Testing complexity</strong> — integration tests require running multiple services</li>
      </ul>

      <InfoBox variant="warning" title="Distributed Systems Tax">
        Every microservice you add increases operational complexity. You now need: service discovery,
        distributed tracing, centralized logging, circuit breakers, API gateways, container orchestration,
        and a mature CI/CD pipeline. If your team cannot operate this infrastructure, microservices
        will slow you down, not speed you up.
      </InfoBox>

      <h2>The Architecture Spectrum</h2>
      <p>
        Architecture is not binary. There is a spectrum from monolith to full microservices, and
        most successful systems live somewhere in the middle. The key is to move along this spectrum
        as your needs evolve.
      </p>

      <FlowChart
        title="The Architecture Spectrum"
        chart={"graph LR\n  A[Monolith] --> B[Modular Monolith]\n  B --> C[Mini-Services]\n  C --> D[Full Microservices]\n  style A fill:#ef4444,color:#fff\n  style B fill:#f59e0b,color:#fff\n  style C fill:#3b82f6,color:#fff\n  style D fill:#10b981,color:#fff"}
      />

      <h3>1. Monolith</h3>
      <p>
        Single deployable unit. All code in one repo, one process, one database.
        Great for startups and small teams building their MVP.
      </p>

      <h3>2. Modular Monolith</h3>
      <p>
        Still one deployable unit, but internally organized into well-defined modules with clear
        boundaries and APIs between them. Each module owns its own database tables. This gives you
        many benefits of microservices (clear boundaries, team ownership) without the operational cost.
      </p>

      <CodeBlock language="java" title="Modular Monolith — Clear Module Boundaries">
{`// Each module exposes a public API — other modules ONLY use this interface
// Module: orders
public interface OrderModule {
    OrderDTO createOrder(CreateOrderRequest request);
    OrderDTO getOrder(UUID orderId);
    List<OrderDTO> getOrdersByCustomer(UUID customerId);
}

// Module: inventory
public interface InventoryModule {
    boolean reserveStock(UUID productId, int quantity);
    void releaseStock(UUID productId, int quantity);
    StockDTO getStock(UUID productId);
}

// Internal implementation is hidden — other modules cannot access it
// ❌ NEVER: orderRepository.findByCustomerId() from inventory module
// ✅ ALWAYS: orderModule.getOrdersByCustomer() via the public interface`}
      </CodeBlock>

      <h3>3. Mini-Services</h3>
      <p>
        A few coarser-grained services (3-8), each owning a domain. Not as granular as full
        microservices, but independently deployable. Good middle ground for medium teams.
      </p>

      <h3>4. Full Microservices</h3>
      <p>
        Fine-grained services (10-100+), each owning a single bounded context. Requires mature
        DevOps, container orchestration, and distributed systems expertise.
      </p>

      <InfoBox variant="tip" title="Start Monolith, Extract Later">
        The most successful microservices architectures were extracted from monoliths — not designed
        from scratch. Start with a modular monolith, identify the seams, and extract services only
        when you have a concrete reason (scaling, team autonomy, technology needs).
      </InfoBox>

      <h2>Decision Framework</h2>
      <p>
        Use this framework to decide where on the spectrum your application should be. The answer
        depends on your team, your domain, and your operational maturity.
      </p>

      <FlowChart
        title="When to Use Microservices — Decision Tree"
        chart={"graph TD\n  Start[Should I use Microservices?] --> Q1{Team size > 10?}\n  Q1 -->|No| Mono[Start with Modular Monolith]\n  Q1 -->|Yes| Q2{Domain well understood?}\n  Q2 -->|No| Mono\n  Q2 -->|Yes| Q3{DevOps maturity high?}\n  Q3 -->|No| Q4[Build DevOps first]\n  Q3 -->|Yes| Q5{Need independent scaling?}\n  Q5 -->|No| Mini[Consider Mini-Services]\n  Q5 -->|Yes| Q6{Need tech stack diversity?}\n  Q6 -->|No| Mini\n  Q6 -->|Yes| Micro[Go Microservices]\n  style Mono fill:#f59e0b,color:#fff\n  style Mini fill:#3b82f6,color:#fff\n  style Micro fill:#10b981,color:#fff\n  style Q4 fill:#ef4444,color:#fff"}
      />

      <h3>Key Decision Factors</h3>
      <table>
        <thead>
          <tr>
            <th>Factor</th>
            <th>Monolith</th>
            <th>Microservices</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Team Size</td>
            <td>1-10 developers</td>
            <td>10+ developers, multiple teams</td>
          </tr>
          <tr>
            <td>Domain Knowledge</td>
            <td>Still exploring / unclear boundaries</td>
            <td>Well-understood bounded contexts</td>
          </tr>
          <tr>
            <td>Scaling Needs</td>
            <td>Uniform load across features</td>
            <td>Hot spots needing independent scale</td>
          </tr>
          <tr>
            <td>Deploy Frequency</td>
            <td>Weekly or less</td>
            <td>Multiple times per day per team</td>
          </tr>
          <tr>
            <td>DevOps Maturity</td>
            <td>Manual or simple CI/CD</td>
            <td>Full CI/CD, monitoring, container orchestration</td>
          </tr>
          <tr>
            <td>Tech Diversity</td>
            <td>Single stack is sufficient</td>
            <td>Different services need different tech</td>
          </tr>
        </tbody>
      </table>

      <h2>Real-World Example: E-Commerce Platform</h2>

      <CodeBlock language="text" title="Architecture Evolution Timeline">
{`Year 1 — Startup (3 developers)
├── Monolith: Rails app with PostgreSQL
├── Features: products, cart, checkout, basic auth
└── Deploy: Heroku, single dyno

Year 2 — Growing (8 developers)
├── Modular Monolith: clear module boundaries
├── Modules: auth, catalog, orders, payments, shipping
├── Each module has its own schema/tables
└── Deploy: AWS EC2, single deploy pipeline

Year 3 — Scale (20 developers, 4 teams)
├── Extract first service: Search (Elasticsearch)
├── Extract second service: Payments (PCI compliance)
├── Rest remains modular monolith
└── Deploy: ECS with 3 services

Year 5 — Full Microservices (50 developers, 8 teams)
├── Services: auth, catalog, search, orders, payments,
│   shipping, notifications, recommendations
├── Infrastructure: Kubernetes, Kafka, service mesh
└── Deploy: GitOps, each team deploys independently`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Your startup has 5 developers, an unclear domain, and no DevOps team. Which architecture should you choose?"}
        options={[
          'Full microservices for future scalability',
          'Modular monolith with clear boundaries',
          'Mini-services with 5 separate deployments',
          'Serverless functions for each endpoint'
        ]}
        correctIndex={1}
        explanation={"A modular monolith gives you clear boundaries and team ownership without the operational overhead of distributed systems. With 5 developers and an unclear domain, you would spend more time on infrastructure than on building features. Start simple, extract later when you have concrete reasons."}
      />

      <h2>Common Anti-Patterns</h2>

      <InfoBox variant="danger" title="Distributed Monolith">
        The worst of both worlds: you have the complexity of microservices (network calls, distributed
        debugging, separate deployments) but the coupling of a monolith (services must be deployed
        together, shared databases, synchronous chains). This happens when you split by technical layer
        instead of business capability, or when services share a database.
      </InfoBox>

      <CodeBlock language="text" title="Distributed Monolith — Warning Signs">
{`❌ Services share a database
❌ Deploying service A requires deploying service B
❌ Circular dependencies between services
❌ One team owns multiple services that always change together
❌ Every request hits 5+ services synchronously
❌ A single service failure cascades to all other services

✅ Healthy Microservices Look Like:
✅ Each service owns its database
✅ Services deploy independently on their own schedule
✅ Teams own services end-to-end (dev, test, deploy, monitor)
✅ Async communication for non-critical paths
✅ Circuit breakers prevent cascade failures`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What is the biggest risk when migrating from a monolith to microservices?"}
        options={[
          'Choosing the wrong programming language',
          'Creating a distributed monolith',
          'Using too many databases',
          'Having too many API endpoints'
        ]}
        correctIndex={1}
        explanation={"A distributed monolith gives you all the complexity of microservices (network calls, distributed debugging, multiple deployments) with none of the benefits (independent deployment, isolated failures, team autonomy). This is the most common failure mode and happens when services are tightly coupled, share databases, or must be deployed together."}
      />

      <h2>Summary</h2>

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>Microservices are about independence — not size</li>
          <li>Architecture is a spectrum: Monolith → Modular Monolith → Mini-Services → Full Micro</li>
          <li>Start with a modular monolith and extract services when you have concrete reasons</li>
          <li>Key decision factors: team size, domain maturity, scaling needs, DevOps maturity</li>
          <li>Avoid the distributed monolith anti-pattern at all costs</li>
          <li>The best architecture is the one your team can operate effectively</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
