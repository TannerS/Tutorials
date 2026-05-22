import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysScaling() {
  return (
    <LessonLayout
      title="Scaling Patterns"
      sectionId="systemdesign"
      lessonIndex={1}
      prev={{ path: '/systemdesign/intro', label: 'System Design Fundamentals' }}
      next={{ path: '/systemdesign/caching', label: 'Caching Strategies' }}
    >
      <h2>Vertical vs Horizontal Scaling</h2>
      <p>
        Scaling is how you handle growing traffic. Vertical scaling makes one machine bigger;
        horizontal scaling adds more machines. Real systems use both at different layers.
      </p>

      <FlowChart
        title="Scaling Decision Tree"
        chart={"graph TD\n  A[Traffic Growing] --> B{Single server at capacity?}\n  B -- Yes --> C{Can upgrade hardware cheaply?}\n  C -- Yes --> D[Vertical Scale - bigger machine]\n  C -- No --> E[Horizontal Scale - add servers]\n  D --> F{Still hitting limits?}\n  F -- Yes --> E\n  E --> G[Add Load Balancer]\n  G --> H[Stateless App Servers]\n  H --> I{DB becoming bottleneck?}\n  I -- Yes --> J[Read Replicas + Caching]\n  J --> K{Still bottleneck?}\n  K -- Yes --> L[Sharding]"}
      />

      <CodeBlock language="markdown" title="Vertical vs Horizontal Comparison">
{`## Vertical Scaling (Scale Up)
# Add CPU, RAM, faster disk to existing machine
# ✓ Simple — no code changes, no distributed complexity
# ✓ No network overhead between components
# ✗ Hardware ceiling — can't add infinite RAM
# ✗ Single point of failure
# ✗ Expensive at the top end (diminishing returns)
# Best for: databases (initially), stateful workloads

## Horizontal Scaling (Scale Out)
# Add more identical machines
# ✓ Theoretically unlimited — just add more nodes
# ✓ High availability — one machine dies, others continue
# ✓ Commodity hardware is cheap
# ✗ Requires stateless application design
# ✗ Distributed systems complexity
# Best for: application servers, stateless services

## Practical Path
# 1. Optimize first (indexes, caching, query tuning) — often 10-100x gain
# 2. Vertical scale the DB (bigger machine, more RAM)
# 3. Horizontal scale app servers (easy, stateless)
# 4. Add read replicas + caching for DB reads
# 5. Shard only when you've exhausted everything else`}
      </CodeBlock>

      <h2>Load Balancing</h2>

      <CodeBlock language="markdown" title="Load Balancing Algorithms">
{`## Round Robin
# Requests cycle: server 1 → 2 → 3 → 1 → 2 → 3...
# ✓ Simple, even distribution for identical servers
# ✗ Ignores server load — may overload slow/busy server

## Weighted Round Robin
# Proportional distribution based on server capacity
# Server A (16 cores) = 2x traffic vs Server B (8 cores)
# Use when: heterogeneous fleet sizes

## Least Connections
# New request → server with fewest active connections
# ✓ Handles long-lived connections well (WebSockets, uploads)
# ✓ Naturally avoids slow servers
# Use when: request duration varies widely

## IP Hash (Sticky Sessions)
# Same client IP always routed to same server
# ✓ Required when server holds session state in memory
# ✗ Uneven distribution if IP distribution is skewed
# Better alternative: store sessions in Redis → use round robin

## Health Checks
# Load balancer pings /health every 10s
# Unhealthy server removed from rotation immediately
# Essential: prevents routing to crashed servers

## Layer 4 vs Layer 7
# L4 (Transport): routes by IP + port — very fast, no parsing
# L7 (Application): routes by URL path, headers, cookies
# L7 example: /api/* → API servers, /static/* → file servers
# AWS: NLB = L4, ALB = L7`}
      </CodeBlock>

      <FlowChart
        title="Load Balancer with Health Checks"
        chart={"graph LR\n  A[Users] --> B[DNS Round Robin]\n  B --> C[Load Balancer A - active]\n  B --> D[Load Balancer B - standby]\n  C --> E[App Server 1 - healthy]\n  C --> F[App Server 2 - healthy]\n  C --> G[App Server 3 - unhealthy - removed]\n  E --> H[Redis - sessions]\n  F --> H\n  E --> I[Primary DB]\n  F --> I\n  I --> J[Read Replica]"}
      />

      <h2>Database Scaling</h2>

      <CodeBlock language="markdown" title="Database Scaling Stages">
{`## Stage 1: Query Optimization (free — do this first)
# EXPLAIN ANALYZE every slow query
# Add indexes on columns used in WHERE, JOIN, ORDER BY
# Fix N+1: fetch in one query instead of N+1 round trips
# Use covering indexes to avoid table scans
# PostgreSQL: pg_stat_statements shows most expensive queries

## Stage 2: Vertical Scaling
# More RAM → bigger buffer pool → more data fits in memory
# PostgreSQL: shared_buffers = 25% of RAM
# Faster CPU and NVMe SSD reduce I/O wait
# Single machine can handle millions of req/sec for many workloads

## Stage 3: Connection Pooling
# Each PostgreSQL connection = OS process (~5MB RAM)
# 1000 simultaneous connections = 5GB just for connection overhead
# PgBouncer (external) or HikariCP (Java) pools connections
# Apps share a small pool (e.g., 20 DB connections for 500 app threads)

## Stage 4: Read Replicas
# Primary handles writes, replicas handle reads
# Async replication: replica lags 0-100ms behind primary
# Use for: reports, search, feeds, anything tolerating stale data
# Beware: read-your-own-writes requires routing to primary
# PostgreSQL: streaming replication; MySQL: built-in replication

## Stage 5: Caching (separate lesson)
# Redis in front of DB reduces read load 90%+
# Most social media queries read the same popular data

## Stage 6: Sharding (last resort)
# Horizontal partitioning: split rows across multiple DB nodes
# Choose shard key carefully — determines data distribution
# Drawback: no cross-shard JOINs, no distributed transactions
# PostgreSQL: Citus extension; MySQL: Vitess (used by YouTube)`}
      </CodeBlock>

      <h2>Consistent Hashing</h2>
      <p>
        Consistent hashing solves the resharding problem: when you add or remove a node, only a
        small fraction of keys need to move.
      </p>

      <CodeBlock language="java" title="Why Consistent Hashing Matters">
{`// Naive approach: hash(key) % numNodes
// Adding node changes numNodes → almost every key remaps
// For a cache: every miss hits the database → thundering herd

// Example: 3 nodes → hash(key) % 3
// User 100 → node 1, User 200 → node 0, User 300 → node 2
// Add 4th node → hash(key) % 4 → ALL keys move to different nodes!

// Consistent Hashing:
// 1. Nodes and keys placed on a ring (0 to 2^32-1)
// 2. Key routes to next clockwise node
// 3. Adding a node only takes keys from its predecessor

// Example: nodes A, B, C on ring at positions 0, 120, 240 degrees
// Adding node D at 60 degrees → only keys between 0-60 move from A to D
// ~1/4 of keys move instead of 100%

// Virtual nodes (vnodes) solve uneven distribution:
// Each physical node has 100-150 virtual positions on the ring
// Better balance, easier addition/removal of nodes
// Used by: Cassandra (256 vnodes/node by default), Amazon Dynamo

// Code concept:
TreeMap<Long, String> ring = new TreeMap<>();
// Add nodes with multiple vnodes each
for (String node : nodes) {
    for (int i = 0; i < 150; i++) {
        long hash = hash(node + ":" + i);
        ring.put(hash, node);
    }
}
// Route key to node
public String getNode(String key) {
    long hash = hash(key);
    Map.Entry<Long, String> entry = ring.ceilingEntry(hash);
    return entry != null ? entry.getValue() : ring.firstEntry().getValue();
}`}
      </CodeBlock>

      <h2>CDN (Content Delivery Network)</h2>

      <CodeBlock language="markdown" title="CDN Strategy">
{`## What CDN Solves
# Problem: server in US, user in Japan → 150ms latency for every asset
# Solution: CDN has edge servers in 100+ cities
# Japanese user connects to Tokyo edge → 5ms to download JS/CSS/images
# Origin server only serves traffic for cache misses

## What to Put on CDN
# ✓ Static assets: JS, CSS, fonts, images (huge win)
# ✓ User uploads: profile photos, video thumbnails
# ✓ Public API responses with caching headers
# ✗ Private/authenticated content (can't cache per-user)
# ✗ Highly dynamic data (real-time prices, live scores)

## Cache Control Headers
# Immutable assets (content-hashed filenames):
Cache-Control: public, max-age=31536000, immutable
# Dynamic but cacheable:
Cache-Control: public, max-age=300, stale-while-revalidate=60
# Never cache:
Cache-Control: private, no-cache, no-store

## CDN Cache Invalidation
# Content hashing: bundle.a1b2c3.js → change = new filename
# Purge API: CloudFront has an invalidation API (slow, ~15s)
# Version prefix: /v2/images/ vs /v1/images/
# S3 + CloudFront: push new file → old requests still get old file
# until TTL expires or you invalidate

## Key CDN Providers
# Cloudflare: + DDoS protection + Workers at edge
# AWS CloudFront: deep AWS integration, Lambda@Edge
# Fastly: programmable, instant purge, used by GitHub/Stripe`}
      </CodeBlock>

      <h2>Auto-Scaling</h2>

      <FlowChart
        title="Auto-Scaling Flow"
        chart={"graph TD\n  A[Metrics Collected] --> B{CPU > 70% for 5min?}\n  B -- Yes --> C[Launch new instances]\n  C --> D[2-3 min warm-up]\n  D --> E[Add to load balancer]\n  B -- No --> F{CPU < 30% for 10min?}\n  F -- Yes --> G[Drain connections]\n  G --> H[Remove instance]\n  F -- No --> I[No action]"}
      />

      <CodeBlock language="yaml" title="Auto-Scaling Configuration">
{`# AWS Auto Scaling Group
MinSize: 2         # minimum for HA — never go below this
MaxSize: 20        # cost ceiling
DesiredCapacity: 4 # starting size

# Scale Out Policy (add capacity)
Trigger: CPUUtilization > 70% (5-minute average)
Action: +2 instances
Cooldown: 300 seconds (wait 5 min before scaling again)

# Scale In Policy (remove capacity)
Trigger: CPUUtilization < 30% (10-minute average)
Action: -1 instance (conservative — scale in slowly)
Cooldown: 300 seconds

# Better alternatives to CPU:
# Request count per instance — more direct for web servers
# Queue depth — perfect for async workers
# p99 latency — most user-centric metric

# Warm-up problem:
# New instance takes 2-3 minutes to boot + load JVM/node_modules
# Add health check grace period (300s) to avoid premature termination
# Pre-warm for predictable spikes (Black Friday, product launches)

# Scale-in protection:
# Mark instances "protected" during long-running jobs
# Drain connections first (connection draining: 30s)
# Use lifecycle hooks for graceful shutdown`}
      </CodeBlock>

      <h2>Rate Limiting</h2>

      <CodeBlock language="java" title="Rate Limiting Algorithms">
{`// TOKEN BUCKET — most common for APIs
// Bucket holds N tokens, refills at rate R tokens/sec
// Request consumes 1 token; reject if empty
// ✓ Allows legitimate bursts (up to bucket size)
// ✓ Smooth average over time
// Used by: Stripe, GitHub, most REST APIs

// SLIDING WINDOW — most accurate
// Keep log of request timestamps per user in sorted set
// Count requests in last 60 seconds; reject if over limit
// ✓ No boundary burst problem (fixed window weakness)
// ✗ Memory-intensive at high scale

// FIXED WINDOW COUNTER — simplest but has edge case
// Increment counter; reset every minute
// ✗ Allows 2× limit: 100 at 0:59 + 100 at 1:00 = 200 in 2 seconds

// Redis-based distributed rate limiting:
String key = "rate:" + userId + ":" + (System.currentTimeMillis() / 60000);
Long count = redis.incr(key);
if (count == 1) redis.expire(key, 60); // set TTL on first request
if (count > MAX_REQUESTS_PER_MINUTE) {
    response.setHeader("Retry-After", "60");
    return 429; // Too Many Requests
}

// Response headers (tell clients how to behave):
// X-RateLimit-Limit: 100     (your limit)
// X-RateLimit-Remaining: 45  (requests left)
// X-RateLimit-Reset: 1716001260  (Unix timestamp of reset)
// Retry-After: 30             (seconds to wait when limited)`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Thundering Herd Problem">
        <p>
          When a popular cache key expires, thousands of simultaneous requests all miss and hit the
          database. Solutions: (1) <strong>Mutex lock</strong> — one request regenerates the cache;
          others wait or return stale. (2) <strong>Jitter on TTL</strong> — add random offset
          (e.g., TTL = 3600 ± 300s) so related keys don't expire simultaneously.
          (3) <strong>Cache warming</strong> — regenerate before expiry in a background job.
          (4) <strong>Probabilistic early expiration</strong> (XFetch) — randomly refresh a fraction
          of time before expiry based on computation cost.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Your app has 1000 concurrent users and a PostgreSQL database. You're seeing slow queries. What should you do FIRST?"
        options={[
          "Immediately add read replicas",
          "Switch to a NoSQL database",
          "Run EXPLAIN ANALYZE on slow queries and add missing indexes",
          "Shard the database across multiple nodes"
        ]}
        correctIndex={2}
        explanation="Query optimization is always first — it's free and often reduces load by 10-100x. Use EXPLAIN ANALYZE to find missing indexes, N+1 query patterns, and sequential scans. A well-indexed query that takes 1ms is 1000x cheaper than a 1s full table scan, even at high concurrency. Only after optimization should you consider read replicas, caching, or sharding."
      />

      <InteractiveChallenge
        question="What problem does consistent hashing solve compared to hash(key) % numNodes?"
        options={[
          "Consistent hashing is faster to compute",
          "When a node is added/removed, only ~1/N of keys need to move instead of almost all keys",
          "Consistent hashing prevents hotspot keys",
          "Consistent hashing supports range queries"
        ]}
        correctIndex={1}
        explanation="With hash(key) % N, changing N (adding/removing a server) remaps almost every key to a different node. For a distributed cache, this means a massive cache miss storm — every request falls through to the database simultaneously. Consistent hashing places nodes on a virtual ring; adding a node only takes keys from its immediate predecessor (~1/N of total keys), leaving the rest untouched. This is why Cassandra, DynamoDB, and Memcached use it."
      />
    </LessonLayout>
  );
}
