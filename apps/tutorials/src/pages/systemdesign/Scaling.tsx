import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Scaling() {
  return (
    <LessonLayout
      title="Scaling &amp; Load Balancing"
      sectionId="systemdesign"
      lessonIndex={1}
      prev={{ path: '/systemdesign/intro', label: 'System Design Fundamentals' }}
      next={{ path: '/systemdesign/caching', label: 'Caching Strategies' }}
    >
      {/* ==================== SECTION 1 ==================== */}
      <h2>Vertical vs Horizontal Scaling</h2>

      <p>
        Scaling is how we increase a system&apos;s capacity to handle more load.
        There are two fundamental approaches: <strong>vertical scaling</strong>{' '}
        (scaling up) and <strong>horizontal scaling</strong> (scaling out). Every
        architecture decision about growth starts here.
      </p>

      <h3>Vertical Scaling (Scale Up)</h3>
      <p>
        Vertical scaling means adding more power to an existing machine &mdash; more
        CPU cores, more RAM, faster disks, or better network cards. It&apos;s the
        simplest path because your application code doesn&apos;t need to change.
      </p>
      <ul>
        <li><strong>Pros:</strong> Simple to implement, no code changes required, no distributed system complexity</li>
        <li><strong>Cons:</strong> Hardware limits (you can&apos;t add infinite RAM), single point of failure, expensive at the high end, usually requires downtime for upgrades</li>
      </ul>

      <h3>Horizontal Scaling (Scale Out)</h3>
      <p>
        Horizontal scaling means adding more machines to your pool. Instead of one
        beefy server, you run many smaller servers behind a load balancer. This is
        the approach most large-scale systems use.
      </p>
      <ul>
        <li><strong>Pros:</strong> Virtually unlimited scaling, better fault tolerance, cost-effective with commodity hardware, no downtime for adding capacity</li>
        <li><strong>Cons:</strong> Requires distributed system design, data consistency challenges, more complex deployment and monitoring</li>
      </ul>

      <h3>Comparison Table</h3>
      <table>
        <thead>
          <tr>
            <th>Factor</th>
            <th>Vertical Scaling</th>
            <th>Horizontal Scaling</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cost curve</td>
            <td>Exponential (premium hardware)</td>
            <td>Linear (commodity hardware)</td>
          </tr>
          <tr>
            <td>Complexity</td>
            <td>Low</td>
            <td>High</td>
          </tr>
          <tr>
            <td>Upper limit</td>
            <td>Bounded by hardware</td>
            <td>Virtually unlimited</td>
          </tr>
          <tr>
            <td>Downtime risk</td>
            <td>Requires downtime for upgrades</td>
            <td>Zero-downtime scaling</td>
          </tr>
          <tr>
            <td>Fault tolerance</td>
            <td>Single point of failure</td>
            <td>Built-in redundancy</td>
          </tr>
          <tr>
            <td>Data consistency</td>
            <td>Simple (single node)</td>
            <td>Requires coordination</td>
          </tr>
        </tbody>
      </table>

      <FlowChart
        title="Vertical vs Horizontal Scaling"
        chart={"graph TD\n  A[Current Server<br/>2 CPU / 4GB RAM] -->|Vertical Scale| B[Bigger Server<br/>16 CPU / 64GB RAM]\n  A -->|Horizontal Scale| C[Server 1<br/>2 CPU / 4GB RAM]\n  A -->|Horizontal Scale| D[Server 2<br/>2 CPU / 4GB RAM]\n  A -->|Horizontal Scale| E[Server 3<br/>2 CPU / 4GB RAM]\n  C --- F[Load Balancer]\n  D --- F\n  E --- F"}
      />

      <InfoBox variant="tip" title="When to Use Each">
        Start with vertical scaling for simplicity. Switch to horizontal scaling
        when you hit hardware limits, need fault tolerance, or require
        zero-downtime deployments. Most production systems use a hybrid: vertically
        scale each node to a cost-effective sweet spot, then scale horizontally.
      </InfoBox>

      {/* ==================== SECTION 2 ==================== */}
      <h2>Load Balancing</h2>

      <p>
        A <strong>load balancer</strong> distributes incoming network traffic across
        multiple servers. It&apos;s the cornerstone of horizontal scaling &mdash;
        without it, you can&apos;t effectively use multiple backend servers.
      </p>
      <p>
        Load balancers improve availability by routing traffic away from unhealthy
        servers, increase throughput by parallelizing work, and reduce latency by
        directing users to the least-loaded server.
      </p>

      <h3>Load Balancing Algorithms</h3>

      <p><strong>1. Round Robin</strong></p>
      <p>
        Requests are distributed sequentially across servers. Server 1 gets the
        first request, Server 2 gets the second, and so on. Simple but assumes all
        servers have equal capacity and all requests are equally expensive.
      </p>

      <p><strong>2. Weighted Round Robin</strong></p>
      <p>
        Like Round Robin but assigns weights to servers based on their capacity. A
        server with weight 3 receives three times more requests than one with weight
        1. Useful when servers have different hardware specs.
      </p>

      <p><strong>3. Least Connections</strong></p>
      <p>
        Routes traffic to the server with the fewest active connections. Better than
        Round Robin for long-lived connections like WebSockets or when request
        processing times vary significantly.
      </p>

      <p><strong>4. IP Hash</strong></p>
      <p>
        Hashes the client&apos;s IP address to determine which server receives the
        request. Ensures the same client always reaches the same server, providing a
        form of session persistence without sticky sessions.
      </p>

      <p><strong>5. Least Response Time</strong></p>
      <p>
        Combines least connections with the fastest response time. Routes to the
        server that is both least busy and responding quickest. Best for optimizing
        end-user experience.
      </p>

      <FlowChart
        title="Load Balancer Distributing Traffic"
        chart={"graph TD\n  U1[User 1] --> LB[Load Balancer]\n  U2[User 2] --> LB\n  U3[User 3] --> LB\n  U4[User 4] --> LB\n  LB -->|Round Robin| S1[Server 1]\n  LB -->|Least Conn| S2[Server 2]\n  LB -->|Weighted| S3[Server 3]\n  S1 --> DB[(Database)]\n  S2 --> DB\n  S3 --> DB"}
      />

      <h3>Layer 4 vs Layer 7 Load Balancing</h3>

      <p>
        Load balancers can operate at different layers of the OSI model, and the
        layer determines what information is available for routing decisions.
      </p>

      <p><strong>Layer 4 (Transport Layer)</strong></p>
      <ul>
        <li>Routes based on IP address and TCP/UDP port</li>
        <li>Cannot inspect packet contents</li>
        <li>Very fast &mdash; minimal processing overhead</li>
        <li>Good for simple TCP load balancing (databases, non-HTTP services)</li>
      </ul>

      <p><strong>Layer 7 (Application Layer)</strong></p>
      <ul>
        <li>Routes based on HTTP headers, URL paths, cookies, or request body</li>
        <li>Can make intelligent routing decisions (send /api to API servers, /static to CDN)</li>
        <li>Supports SSL termination, compression, and caching</li>
        <li>Higher overhead but much more flexible</li>
      </ul>

      <InfoBox variant="info" title="Health Checks">
        Load balancers continuously perform health checks on backend servers.
        A <strong>passive health check</strong> monitors responses from real traffic
        and removes servers that return errors. An <strong>active health check</strong>{' '}
        sends periodic probe requests (e.g., GET /health) to each server. Always
        implement a dedicated health endpoint that checks database connectivity, disk
        space, and other critical dependencies.
      </InfoBox>

      {/* ==================== SECTION 3 ==================== */}
      <h2>Reverse Proxy</h2>

      <p>
        A <strong>reverse proxy</strong> sits between clients and your backend
        servers, forwarding client requests to the appropriate server. While a
        load balancer is technically a type of reverse proxy, the term usually
        refers to a broader set of features.
      </p>

      <h3>Forward Proxy vs Reverse Proxy</h3>
      <ul>
        <li>
          <strong>Forward proxy:</strong> Sits in front of <em>clients</em>.
          Clients send requests to the proxy, which forwards them to the internet.
          Used for privacy, filtering, and caching on the client side.
        </li>
        <li>
          <strong>Reverse proxy:</strong> Sits in front of <em>servers</em>.
          Clients send requests to the proxy, which forwards them to backend
          servers. Used for load balancing, security, and performance.
        </li>
      </ul>

      <h3>Key Benefits</h3>
      <ul>
        <li><strong>Security:</strong> Hides backend server IPs and topology from clients</li>
        <li><strong>SSL termination:</strong> Handles HTTPS encryption/decryption so backends only deal with HTTP</li>
        <li><strong>Compression:</strong> Compresses responses (gzip/brotli) before sending to clients</li>
        <li><strong>Caching:</strong> Caches static content and even dynamic responses to reduce backend load</li>
        <li><strong>Rate limiting:</strong> Throttles abusive clients before they hit your application</li>
      </ul>

      <h3>Nginx Reverse Proxy Configuration</h3>

      <CodeBlock
        language="nginx"
        title="Basic Nginx Reverse Proxy"
        code={`upstream backend_servers {
    # Define backend server pool
    server 10.0.0.1:8080 weight=3;
    server 10.0.0.2:8080 weight=2;
    server 10.0.0.3:8080 weight=1;

    # Health check: mark as down after 3 failures
    # and retry after 30 seconds
    server 10.0.0.4:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl;
    server_name api.example.com;

    # SSL termination
    ssl_certificate     /etc/ssl/certs/api.crt;
    ssl_certificate_key /etc/ssl/private/api.key;

    # Gzip compression
    gzip on;
    gzip_types application/json text/plain text/css;

    # Proxy to backend pool
    location / {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static file caching
    location /static/ {
        root /var/www;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}`}
      />

      {/* ==================== SECTION 4 ==================== */}
      <h2>Auto-Scaling</h2>

      <p>
        Auto-scaling automatically adjusts the number of running instances based on
        current demand. Instead of manually provisioning servers, the system reacts
        to load in real time &mdash; scaling out when traffic spikes and scaling in
        when it drops, optimizing both performance and cost.
      </p>

      <h3>Scaling Policies</h3>

      <p><strong>CPU-Based Scaling</strong></p>
      <p>
        The most common policy. Add instances when average CPU utilization across
        the group exceeds a threshold (e.g., 70%) and remove them when it drops
        below another threshold (e.g., 30%). Simple but can be misleading for
        I/O-bound workloads.
      </p>

      <p><strong>Request-Based Scaling</strong></p>
      <p>
        Scale based on the number of requests per instance. If each instance can
        handle 1,000 requests per second, and traffic is 4,500 RPS, scale to 5
        instances. More predictable than CPU-based for web workloads.
      </p>

      <p><strong>Schedule-Based Scaling</strong></p>
      <p>
        Pre-scale based on known traffic patterns. If you know traffic peaks at
        9 AM every weekday, schedule a scale-out at 8:45 AM. Combine with reactive
        policies for unexpected spikes.
      </p>

      <h3>Cool-Down Periods</h3>
      <p>
        After a scaling action, the system enters a cool-down period (typically
        5&ndash;10 minutes) during which no additional scaling happens. This prevents
        thrashing &mdash; rapid scale-out and scale-in cycles caused by metrics
        oscillating around the threshold. Without cool-down, you can end up
        launching and terminating instances repeatedly.
      </p>

      <InfoBox variant="tip" title="Right-Size Before Auto-Scaling">
        Before configuring auto-scaling, make sure each instance is properly sized.
        Running 20 micro instances when 4 medium instances would suffice wastes money
        on overhead and complicates coordination. Profile your application, choose the
        right instance type for your workload (CPU-optimized, memory-optimized, etc.),
        then layer auto-scaling on top.
      </InfoBox>

      {/* ==================== SECTION 5 ==================== */}
      <h2>Stateless vs Stateful Services</h2>

      <p>
        The distinction between stateless and stateful services is one of the most
        important concepts in scalable architecture. It directly determines how
        easily your system can scale horizontally.
      </p>

      <h3>Stateless Services</h3>
      <p>
        A stateless service treats each request independently. No client context is
        stored on the server between requests. Any instance can handle any request
        from any user. This makes horizontal scaling trivial &mdash; just add more
        instances behind the load balancer.
      </p>

      <h3>Stateful Services</h3>
      <p>
        A stateful service maintains client-specific data in memory (e.g., user
        sessions, WebSocket connections, in-memory caches). Requests from a
        particular client must reach the same server. This creates coupling between
        clients and servers, making scaling and failover harder.
      </p>

      <h3>Session Management Strategies</h3>

      <p><strong>Sticky Sessions (Session Affinity)</strong></p>
      <p>
        The load balancer routes all requests from a user to the same server using a
        cookie or IP hash. Simple but creates uneven load distribution and failover
        problems &mdash; if the server goes down, the session is lost.
      </p>

      <p><strong>External Session Store</strong></p>
      <p>
        Store session data in a shared external system like Redis or Memcached. Any
        server can retrieve any user&apos;s session. This is the preferred approach
        for horizontally scaled systems because it decouples session state from
        individual servers.
      </p>

      <FlowChart
        title="Stateless Architecture with External Session Store"
        chart={"graph TD\n  Client[Client with Session Token] --> LB[Load Balancer]\n  LB --> S1[App Server 1]\n  LB --> S2[App Server 2]\n  LB --> S3[App Server 3]\n  S1 --> Redis[(Redis Session Store)]\n  S2 --> Redis\n  S3 --> Redis\n  S1 --> DB[(Primary Database)]\n  S2 --> DB\n  S3 --> DB"}
      />

      <InteractiveChallenge
        question={"Your e-commerce application stores shopping cart data in server memory. During a deployment, one server is restarted and several users lose their carts. How would you redesign this to be stateless?"}
        options={[
          "Use sticky sessions so users always hit the same server",
          "Move cart data to an external store like Redis and reference it via a session token",
          "Increase server memory so carts are never evicted",
          "Store cart data in browser cookies only"
        ]}
        correctIndex={1}
        explanation={"Moving cart data to an external store like Redis makes the application servers stateless. Any server can retrieve any user's cart via the session token. Sticky sessions don't solve the restart problem, cookies have size limits and security concerns, and more memory doesn't prevent data loss on restart."}
      />

      {/* ==================== SECTION 6 ==================== */}
      <h2>CDN (Content Delivery Network)</h2>

      <p>
        A CDN is a geographically distributed network of servers that caches and
        delivers content from locations closer to end users. By reducing the physical
        distance between user and server, CDNs dramatically lower latency, reduce
        origin server load, and improve availability.
      </p>

      <h3>Push vs Pull CDN</h3>

      <p><strong>Push CDN</strong></p>
      <p>
        You proactively upload content to the CDN. You control exactly what is cached
        and when it expires. Best for sites with content that changes infrequently
        (e.g., marketing sites, documentation). Lower traffic but higher maintenance.
      </p>

      <p><strong>Pull CDN</strong></p>
      <p>
        The CDN fetches content from your origin server on the first request, then
        caches it. Subsequent requests are served from the edge. Best for sites with
        heavy traffic and frequently changing content. Less maintenance but the first
        request per edge location hits your origin.
      </p>

      <FlowChart
        title="How a CDN Serves Content"
        chart={"graph TD\n  U[User in Tokyo] --> E[Edge Server - Tokyo]\n  E -->|Cache HIT| R1[Return Cached Content]\n  E -->|Cache MISS| O[Origin Server - US West]\n  O --> E2[Cache at Edge]\n  E2 --> R2[Return Content to User]\n  U2[User in London] --> E3[Edge Server - London]\n  E3 -->|Cache HIT| R3[Return Cached Content]"}
      />

      <h3>When to Use a CDN</h3>
      <ul>
        <li>Static assets: images, CSS, JavaScript, fonts, videos</li>
        <li>API responses that are cacheable (e.g., product catalogs, public data)</li>
        <li>Any content served to a geographically distributed audience</li>
        <li>Protection against DDoS attacks (CDN absorbs traffic at the edge)</li>
      </ul>

      <h3>Cache Invalidation in CDNs</h3>
      <p>
        One of the hardest problems in distributed systems. Common strategies include:
      </p>
      <ul>
        <li>
          <strong>TTL-based expiration:</strong> Set a Time-To-Live on cached content.
          After expiration, the edge re-fetches from origin.
        </li>
        <li>
          <strong>Versioned URLs:</strong> Append a hash or version to file names
          (e.g., <code>app.a1b2c3.js</code>). New deploys use new URLs, so old
          cached versions are irrelevant.
        </li>
        <li>
          <strong>Purge API:</strong> Manually or programmatically invalidate
          specific URLs or cache tags when content changes.
        </li>
        <li>
          <strong>Stale-while-revalidate:</strong> Serve stale content immediately
          while asynchronously fetching the latest version in the background.
        </li>
      </ul>

      <InfoBox variant="warning" title="CDN Cache Invalidation Gotcha">
        Purging a CDN cache across all edge locations takes time &mdash; sometimes
        minutes. For critical updates, combine TTL-based expiration with versioned
        URLs. Never rely solely on purge APIs for time-sensitive content changes.
      </InfoBox>

      {/* ==================== SECTION 7 ==================== */}
      <h2>Database Read Replicas</h2>

      <p>
        Most web applications are read-heavy: 80&ndash;90% of database operations
        are reads. <strong>Read replicas</strong> let you scale read throughput by
        replicating data from a primary (master) database to one or more secondary
        (replica) databases.
      </p>

      <h3>Master-Replica Replication</h3>
      <p>
        The primary database handles all write operations. Changes are asynchronously
        (or synchronously) replicated to read replicas. Application servers direct
        write queries to the primary and read queries to replicas, distributing the
        read load.
      </p>
      <ul>
        <li><strong>Asynchronous replication:</strong> Faster writes, but replicas may lag behind the primary by milliseconds to seconds</li>
        <li><strong>Synchronous replication:</strong> Replicas are always up-to-date, but writes are slower because they wait for replica acknowledgment</li>
      </ul>

      <h3>Read/Write Splitting</h3>
      <p>
        Your application or a database proxy routes queries based on type. INSERT,
        UPDATE, and DELETE go to the primary. SELECT queries go to replicas. Many
        ORMs and database proxies (like ProxySQL or PgBouncer) support this
        natively.
      </p>

      <h3>Replication Lag Considerations</h3>
      <p>
        With asynchronous replication, a user might write data and then immediately
        read it from a replica that hasn&apos;t received the update yet. Common
        solutions:
      </p>
      <ul>
        <li><strong>Read-your-own-writes:</strong> After a write, route the user&apos;s subsequent reads to the primary for a short window</li>
        <li><strong>Monotonic reads:</strong> Ensure a user always reads from the same replica so they never see data go &quot;backward&quot;</li>
        <li><strong>Causal consistency:</strong> Track dependencies between operations and ensure replicas serve them in order</li>
      </ul>

      <InfoBox variant="info" title="Replica Promotion">
        If the primary database fails, a read replica can be promoted to become the
        new primary. This is the foundation of database high availability. Tools like
        PostgreSQL&apos;s pg_auto_failover or MySQL Group Replication automate this
        process.
      </InfoBox>

      {/* ==================== SECTION 8 ==================== */}
      <h2>Rate Limiting</h2>

      <p>
        Rate limiting controls how many requests a client can make within a given
        time window. It protects your system from abuse, prevents resource
        exhaustion, and ensures fair usage across all clients.
      </p>

      <h3>Why Rate Limiting Matters</h3>
      <ul>
        <li>Prevents denial-of-service attacks (intentional or accidental)</li>
        <li>Protects downstream services from being overwhelmed</li>
        <li>Enforces API usage quotas for billing tiers</li>
        <li>Ensures fair resource allocation among clients</li>
        <li>Controls cost when using pay-per-request external APIs</li>
      </ul>

      <h3>Token Bucket Algorithm</h3>
      <p>
        Imagine a bucket that holds tokens. Tokens are added at a fixed rate (e.g.,
        10 per second). Each request consumes one token. If the bucket is empty, the
        request is rejected or queued. The bucket has a maximum capacity, allowing
        short bursts of traffic up to the bucket size.
      </p>
      <ul>
        <li>Allows bursts up to the bucket capacity</li>
        <li>Smooth average rate over time</li>
        <li>Simple to implement and understand</li>
        <li>Used by AWS API Gateway, Stripe, and many others</li>
      </ul>

      <h3>Sliding Window Algorithm</h3>
      <p>
        Tracks requests in a rolling time window. Unlike a fixed window (which
        resets at interval boundaries), a sliding window continuously moves forward.
        This prevents the &quot;boundary burst&quot; problem where a client sends
        the max requests at the end of one window and the start of the next,
        effectively doubling their rate.
      </p>

      <h3>Rate Limiter Implementation</h3>

      <CodeBlock
        language="python"
        title="Token Bucket Rate Limiter"
        code={`import time

class TokenBucketRateLimiter:
    def __init__(self, rate, capacity):
        """
        rate: tokens added per second
        capacity: maximum burst size
        """
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_refill = time.time()

    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        new_tokens = elapsed * self.rate
        self.tokens = min(self.capacity, self.tokens + new_tokens)
        self.last_refill = now

    def allow_request(self):
        self._refill()
        if self.tokens >= 1:
            self.tokens -= 1
            return True   # Request allowed
        return False      # Rate limited (HTTP 429)

# Usage: allow 100 requests/sec with burst of 150
limiter = TokenBucketRateLimiter(rate=100, capacity=150)

for i in range(200):
    if limiter.allow_request():
        print(f"Request {i}: allowed")
    else:
        print(f"Request {i}: rate limited")`}
      />

      <InfoBox variant="tip" title="Distributed Rate Limiting">
        When running multiple application instances, each instance needs access to a
        shared counter. Use Redis with atomic INCR and EXPIRE commands to implement
        distributed rate limiting. The sliding window log or sliding window counter
        approach in Redis handles this efficiently at scale.
      </InfoBox>

      <InteractiveChallenge
        question={"Your API allows 100 requests per minute per API key. A client sends 60 requests in the last 10 seconds of minute 1 and 60 requests in the first 10 seconds of minute 2. With a fixed-window counter, what happens?"}
        options={[
          "All 120 requests are rejected because the total exceeds 100",
          "All 120 requests are allowed because each window only sees 60",
          "The first 100 requests are allowed and the rest are rejected",
          "Only the 60 requests in minute 2 are rejected"
        ]}
        correctIndex={1}
        explanation={"This is the classic fixed-window boundary burst problem. Each minute window independently counts 60 requests, both under the 100 limit. The client effectively gets 120 requests in a 20-second span. A sliding window algorithm solves this by considering overlapping time windows."}
      />
    </LessonLayout>
  );
}
