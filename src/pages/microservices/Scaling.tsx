import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Scaling() {
  return (
    <LessonLayout
      title="Scaling Strategies"
      sectionId="microservices"
      lessonIndex={4}
      prev={{ path: '/microservices/data', label: 'Data Patterns & CQRS' }}
      next={{ path: '/microservices/events', label: 'Event-Driven Architecture' }}
    >
      <h2>Why Scaling Matters</h2>
      <p>
        Scaling is the ability to handle increased load by adding resources. In microservices,
        each service can be scaled independently based on its own demand — the search service
        might need 20 instances while the admin service needs only 2. This is one of the primary
        advantages of microservices over monoliths.
      </p>

      <h2>Vertical vs Horizontal Scaling</h2>

      <FlowChart
        title="Vertical vs Horizontal Scaling"
        chart={"graph TD\n  subgraph Vertical - Scale Up\n    V1[Small Server 2 CPU 4GB] --> V2[Big Server 16 CPU 64GB]\n    V2 --> V3[Huge Server 64 CPU 256GB]\n  end\n  subgraph Horizontal - Scale Out\n    LB[Load Balancer] --> H1[Instance 1]\n    LB --> H2[Instance 2]\n    LB --> H3[Instance 3]\n    LB --> H4[Instance N...]\n  end\n  style V3 fill:#3b1a1a\n  style LB fill:#1a3329"}
      />

      <h3>Vertical Scaling (Scale Up)</h3>
      <ul>
        <li><strong>What:</strong> Add more CPU, RAM, or faster disks to the existing machine</li>
        <li><strong>Pros:</strong> No code changes needed, simple to implement, no distributed complexity</li>
        <li><strong>Cons:</strong> Single point of failure, hardware ceiling (you cannot buy a machine with 10,000 CPUs), expensive at the high end</li>
        <li><strong>Best for:</strong> Databases (vertical first), quick wins, small applications</li>
      </ul>

      <h3>Horizontal Scaling (Scale Out)</h3>
      <ul>
        <li><strong>What:</strong> Add more machines running the same service behind a load balancer</li>
        <li><strong>Pros:</strong> Practically unlimited scale, redundancy (no single point of failure), cost-effective with commodity hardware</li>
        <li><strong>Cons:</strong> Application must be stateless, adds distributed complexity, requires load balancer and service discovery</li>
        <li><strong>Best for:</strong> Stateless application services, web servers, API servers</li>
      </ul>

      <InfoBox variant="warning" title="Stateless Requirement">
        To scale horizontally, your service must be stateless — it cannot store session data, file
        uploads, or cache in local memory. Any request can hit any instance. Move state to external
        stores: sessions → Redis, files → S3, cache → Redis/Memcached.
      </InfoBox>

      <h2>The Practical Scaling Playbook</h2>
      <p>
        Follow this step-by-step playbook when you need to scale. Do not skip steps or jump straight
        to sharding — each step should be exhausted before moving to the next.
      </p>

      <FlowChart
        title="Scaling Playbook — Step by Step"
        chart={"graph TD\n  S1[1. Measure and Profile] --> S2[2. Vertical Scale First]\n  S2 --> S3[3. Make App Stateless]\n  S3 --> S4[4. Add Load Balancer]\n  S4 --> S5[5. Configure Auto-Scaling]\n  S5 --> S6[6. Scale Database Separately]\n  style S1 fill:#1a2744\n  style S2 fill:#2a1f44\n  style S3 fill:#2a1f44\n  style S4 fill:#1a2744\n  style S5 fill:#1a3329\n  style S6 fill:#1a3329"}
      />

      <h3>Step 1: Measure and Profile</h3>
      <p>
        Before scaling anything, measure. Identify the bottleneck. Is it CPU? Memory? Database queries?
        Network I/O? Scaling the wrong thing wastes money and does not improve performance.
      </p>

      <CodeBlock language="bash" title="Identifying Bottlenecks">
{`# CPU profiling — find hot functions
$ node --prof app.js
$ node --prof-process isolate-*.log > profile.txt

# Memory profiling
$ node --inspect app.js  # then use Chrome DevTools

# APM tools for production:
# - Datadog APM — distributed tracing across services
# - New Relic — application performance monitoring
# - Jaeger / Zipkin — open-source distributed tracing

# Key metrics to track:
# - Request latency (p50, p95, p99)
# - Error rate (4xx, 5xx)
# - Throughput (requests/second)
# - CPU and memory utilization
# - Database query time and connection pool usage`}
      </CodeBlock>

      <h3>Step 2: Vertical Scale First</h3>
      <p>
        The simplest scaling strategy: upgrade your machine. This is especially effective for
        databases and can buy you months or years of headroom with zero code changes.
      </p>

      <CodeBlock language="hcl" title="AWS RDS — Vertical Scaling Example">
{`# Before: db.t3.medium (2 vCPU, 4GB RAM) — $50/month
# After:  db.r6g.xlarge (4 vCPU, 32GB RAM) — $250/month
# Result: 8x more memory for caching, 2x more CPU

# Terraform example:
resource "aws_db_instance" "main" {
  identifier     = "order-service-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.xlarge"  # upgrade here
  allocated_storage = 100
  max_allocated_storage = 500  # auto-grow storage

  # Enable Performance Insights for query profiling
  performance_insights_enabled = true
  performance_insights_retention_period = 7
}`}
      </CodeBlock>

      <h3>Step 3: Make the Application Stateless</h3>

      <CodeBlock language="typescript" title="Making a Service Stateless">
{`// ❌ STATEFUL — stores session in local memory
// If load balancer sends next request to a different instance, session is lost
const sessions = new Map();  // in-memory!
app.post('/login', (req, res) => {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { userId: req.body.userId });
  res.cookie('session', sessionId);
});

// ✅ STATELESS — stores session in Redis (external state store)
const redis = new Redis('redis://redis-cluster:6379');
app.post('/login', async (req, res) => {
  const sessionId = crypto.randomUUID();
  await redis.setex(\`session:\${sessionId}\`, 3600, JSON.stringify({
    userId: req.body.userId,
  }));
  res.cookie('session', sessionId);
});

// ✅ STATELESS — use JWT (no server-side state at all)
app.post('/login', async (req, res) => {
  const user = await authenticateUser(req.body);
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token });
});`}
      </CodeBlock>

      <h3>Step 4: Add a Load Balancer</h3>

      <FlowChart
        title="Load Balancing Strategies"
        chart={"graph TD\n  Client[Clients] --> LB[Load Balancer]\n  LB -->|Round Robin| I1[Instance 1]\n  LB -->|Round Robin| I2[Instance 2]\n  LB -->|Round Robin| I3[Instance 3]\n  LB -.-> HC[Health Checks]\n  HC --> I1\n  HC --> I2\n  HC --> I3"}
      />

      <h3>Load Balancing Algorithms</h3>
      <table>
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>How It Works</th>
            <th>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Round Robin</td>
            <td>Requests distributed sequentially</td>
            <td>Uniform instances, general purpose</td>
          </tr>
          <tr>
            <td>Least Connections</td>
            <td>Routes to instance with fewest active connections</td>
            <td>Variable request durations</td>
          </tr>
          <tr>
            <td>Weighted Round Robin</td>
            <td>Higher-capacity instances get more requests</td>
            <td>Mixed instance sizes</td>
          </tr>
          <tr>
            <td>IP Hash</td>
            <td>Same client IP always routes to same instance</td>
            <td>Session affinity (sticky sessions)</td>
          </tr>
          <tr>
            <td>Random</td>
            <td>Random instance selection</td>
            <td>Simple, works well at scale</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="yaml" title="Kubernetes Service — Built-in Load Balancing">
{`# Kubernetes Service acts as a load balancer for pods
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP  # internal load balancer

---
# Deployment — defines the pods to load balance across
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3  # 3 instances behind the service
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: order-service
          image: myregistry/order-service:v1.2.3
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10`}
      </CodeBlock>

      <h3>Step 5: Configure Auto-Scaling</h3>

      <CodeBlock language="yaml" title="Kubernetes Horizontal Pod Autoscaler">
{`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
    # Scale based on CPU utilization
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  # scale up when CPU > 70%
    # Scale based on memory
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    # Scale based on custom metric (requests per second)
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"  # scale when > 100 RPS per pod
  behavior:
    # Scale UP fast: react immediately, and allow doubling every 15s.
    # (stabilizationWindowSeconds: 0 is the Kubernetes default here —
    # raising it would make scale-up SLOWER, which is the wrong direction.)
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    # Scale DOWN slow: wait 5 minutes of sustained low load, then shed
    # at most 25% of the pods every 2 minutes.
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 25
          periodSeconds: 120`}
      </CodeBlock>

      <InfoBox variant="tip" title="Auto-Scaling Best Practices">
        <ul>
          <li>Set <code>minReplicas</code> to at least 2 for high availability</li>
          <li>Scale up aggressively (fast), scale down conservatively (slow) — a burst of traffic that is under-served costs users, a few extra pods for five minutes costs cents</li>
          <li>Put the long <code>stabilizationWindowSeconds</code> on <code>scaleDown</code>, not <code>scaleUp</code> — that is what stops flapping. Lengthening the scale-up window just delays your response to load</li>
          <li>Use readiness probes so new pods only receive traffic when ready</li>
          <li>Test auto-scaling with load testing tools (k6, Locust, Artillery)</li>
        </ul>
      </InfoBox>

      <h2>Database Scaling Strategies</h2>
      <p>
        Databases are the hardest component to scale. Unlike stateless application servers, databases
        hold state and must maintain consistency. Follow this progression:
      </p>

      <FlowChart
        title="Database Scaling Progression"
        chart={"graph LR\n  A[1. Vertical Scale] --> B[2. Read Replicas]\n  B --> C[3. Connection Pooling]\n  C --> D[4. Caching Layer]\n  D --> E[5. Sharding - Last Resort]\n  style A fill:#1a3329\n  style B fill:#1a2744\n  style C fill:#1a2744\n  style D fill:#2a1f44\n  style E fill:#3b1a1a"}
      />

      <h3>1. Vertical Scale</h3>
      <p>
        Same first move as the application tier, and it goes further for a database than for
        anything else: more RAM means a larger buffer pool, so the working set stays in memory and
        the disk stops being the bottleneck. A single instance resize is a maintenance-window
        reboot with zero application changes, and it is fully reversible. Exhaust it before adding
        moving parts — the <code>db.t3.medium</code> → <code>db.r6g.xlarge</code> jump shown
        earlier is often a year of headroom for a few hundred dollars a month.
      </p>

      <h3>2. Read Replicas</h3>
      <p>
        Most applications are read-heavy (80-95% reads). Create read replicas that receive
        changes from the primary via replication. Route reads to replicas, writes to primary.
      </p>

      <CodeBlock language="typescript" title="Read Replica Routing">
{`import { Pool } from 'pg';

const writePool = new Pool({
  host: 'db-primary.internal',
  port: 5432,
  database: 'orders',
  max: 20,
});

const readPool = new Pool({
  host: 'db-replica.internal',
  port: 5432,
  database: 'orders',
  max: 50,  // more connections for reads
});

class OrderRepository {
  // Writes always go to primary
  async createOrder(order: Order): Promise<Order> {
    const result = await writePool.query(
      'INSERT INTO orders (customer_id, total, status) VALUES ($1, $2, $3) RETURNING *',
      [order.customerId, order.total, 'PENDING']
    );
    return result.rows[0];
  }

  // Reads go to replica (slight lag is acceptable)
  async getOrders(customerId: string): Promise<Order[]> {
    const result = await readPool.query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );
    return result.rows;
  }

  // Read-after-write: use primary to avoid stale data
  async getOrderById(id: string): Promise<Order | null> {
    const result = await writePool.query(
      'SELECT * FROM orders WHERE id = $1', [id]
    );
    return result.rows[0] || null;
  }
}`}
      </CodeBlock>

      <h3>3. Connection Pooling</h3>

      <CodeBlock language="text" title="PgBouncer — Connection Pooling">
{`# Without PgBouncer:
# 20 pods x 20 connections each = 400 database connections
# PostgreSQL max_connections default: 100 → overwhelmed!

# With PgBouncer:
# 20 pods x 20 connections → PgBouncer (400 client connections)
# PgBouncer → PostgreSQL (20 server connections)
# Transaction pooling: connections returned after each transaction

# pgbouncer.ini
[databases]
orders = host=db-primary port=5432 dbname=orders

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
server_idle_timeout = 300`}
      </CodeBlock>

      <h3>4. Caching Layer</h3>

      <CodeBlock language="typescript" title="Redis Cache-Aside Pattern">
{`class CachedProductRepository {
  constructor(
    private db: Pool,
    private redis: Redis,
  ) {}

  async getProduct(id: string): Promise<Product | null> {
    // 1. Check cache first
    const cached = await this.redis.get(\`product:\${id}\`);
    if (cached) return JSON.parse(cached);  // cache HIT

    // 2. Cache miss — query database
    const result = await this.db.query(
      'SELECT * FROM products WHERE id = $1', [id]
    );
    const product = result.rows[0] || null;

    // 3. Store in cache with TTL
    if (product) {
      await this.redis.setex(\`product:\${id}\`, 300, JSON.stringify(product));
    }

    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    await this.db.query(
      'UPDATE products SET name = $1, price = $2 WHERE id = $3',
      [updates.name, updates.price, id]
    );
    await this.redis.del(\`product:\${id}\`);  // invalidate cache
  }
}`}
      </CodeBlock>

      <h3>5. Sharding (Last Resort)</h3>

      <InfoBox variant="danger" title="Sharding Is Complex">
        Sharding splits your data across multiple database instances by a shard key (e.g., customer_id).
        It is the most complex scaling strategy and introduces significant operational challenges:
        cross-shard queries, rebalancing, and application-level routing. Exhaust all other options first.
      </InfoBox>

      <CodeBlock language="text" title="Sharding Strategy">
{`# Shard by customer_id (hash-based)
# Shard 0: customer_id % 4 == 0 → db-shard-0
# Shard 1: customer_id % 4 == 1 → db-shard-1
# Shard 2: customer_id % 4 == 2 → db-shard-2
# Shard 3: customer_id % 4 == 3 → db-shard-3

# Good shard keys:
# ✅ customer_id — queries are usually per-customer, so a read
#    touches exactly one shard
# ✅ tenant_id — multi-tenant SaaS
# ✅ region — geographic sharding

# Bad shard keys:
# ❌ order_id — no locality for customer queries. "All orders for
#    customer X" has to fan out to every shard and merge.
# ❌ created_at / auto-increment id, WITH RANGE SHARDING — every new
#    row lands in the newest range, so one shard takes 100% of writes
#    while the others idle. (Under the hash scheme above these two
#    spread writes evenly — the problem is the range split, not the
#    column. Monotonic keys and range sharding are what don't mix.)
# ❌ a key you cannot query by — if most reads filter on something
#    other than the shard key, every read fans out and you have paid
#    for sharding without getting the benefit.`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Your Node.js API is slow under load. CPU is at 30%, memory at 40%, but p99 latency is 2 seconds. Where is the bottleneck most likely?"}
        options={[
          'CPU — need bigger machine',
          'Memory — need more RAM',
          'Database — slow queries or connection exhaustion',
          'Network — need better bandwidth'
        ]}
        correctIndex={2}
        explanation={"Low CPU and memory utilization combined with high latency strongly suggests the bottleneck is I/O bound — most likely slow database queries or connection pool exhaustion. The application is spending most of its time waiting for the database to respond. Profile your queries, add indexes, and check your connection pool settings."}
      />

      <InteractiveChallenge
        question={"What is the correct order for the database scaling playbook?"}
        options={[
          'Sharding → Caching → Read Replicas → Vertical',
          'Vertical → Read Replicas → Connection Pooling → Caching → Sharding',
          'Caching → Vertical → Sharding → Read Replicas',
          'Read Replicas → Sharding → Caching → Vertical'
        ]}
        correctIndex={1}
        explanation={"Always start with the simplest option: vertical scaling (bigger machine, zero code changes). Then add read replicas for read-heavy workloads. Connection pooling reduces connection overhead. Caching reduces database load. Sharding is the last resort due to its complexity."}
      />

      <h2>Summary</h2>

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>Vertical scaling first — no code changes, buys you time</li>
          <li>Horizontal scaling requires stateless services — externalize all state</li>
          <li>Measure before scaling — profile to find the actual bottleneck</li>
          <li>Use Kubernetes HPA for auto-scaling with CPU/memory/custom metrics</li>
          <li>Database scaling: vertical → read replicas → connection pooling → caching → sharding</li>
          <li>Sharding is the last resort — exhaust all other options first</li>
          <li>Scale up aggressively, scale down conservatively to prevent flapping</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
