import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysIntro() {
  return (
    <LessonLayout
      title="System Design Fundamentals"
      sectionId="systemdesign"
      lessonIndex={0}
      prev={{ path: '/devops/monitoring', label: 'Monitoring' }}
      next={{ path: '/systemdesign/scaling', label: 'Scaling Patterns' }}
    >
      <h2>What Is System Design?</h2>
      <p>
        System design is the process of defining the architecture, components, data flows, and
        trade-offs for a large-scale distributed system. Unlike algorithm problems with a single
        correct answer, system design is open-ended — there are always trade-offs between
        consistency, availability, latency, cost, and complexity.
      </p>

      <FlowChart
        title="System Design Interview Framework"
        chart={"graph TD\n  A[1. Clarify Requirements] --> B[2. Estimate Scale]\n  B --> C[3. Define API]\n  C --> D[4. Data Model]\n  D --> E[5. High-Level Architecture]\n  E --> F[6. Deep Dive Components]\n  F --> G[7. Identify Bottlenecks]\n  G --> H[8. Discuss Trade-offs]"}
      />

      <h2>Step 1: Requirements Gathering</h2>
      <p>
        Always clarify before designing. Split into functional (what the system does) and
        non-functional (how well it does it) requirements.
      </p>

      <CodeBlock language="markdown" title="Requirements Template">
{`## Functional Requirements (what the system does)
- Users can post short messages (≤280 chars)
- Users can follow other users
- Users see a timeline of followed users' posts
- Users can like and repost messages

## Non-Functional Requirements (how well)
- 100M DAU (Daily Active Users)
- Read-heavy: 10:1 read-to-write ratio
- Timeline must load < 200ms
- 99.99% availability (< 52 min downtime/year)
- Posts are durable — never lose data
- System must handle celebrity accounts (100M followers)

## Out of Scope (explicitly excluded)
- DMs, video uploads, ads, analytics dashboard

## Scale Estimates
- 100M DAU × 10 requests/day = 1B req/day
- 1B / 86,400 sec = ~11,600 req/sec avg
- Peak (5× average) = ~58,000 req/sec
- Writes: 10% of traffic = ~1,160 writes/sec
- Storage: 100M × 1KB/day = 100GB/day`}
      </CodeBlock>

      <h2>The Numbers Every Engineer Should Know</h2>

      <CodeBlock language="bash" title="Latency Numbers (approximate)">
{`# Latency reference — memorize these for interviews
L1 cache reference:           0.5 ns
Branch misprediction:           5 ns
L2 cache reference:             7 ns
Mutex lock/unlock:             25 ns
Main memory (RAM):            100 ns
Compress 1KB with Snappy:   10,000 ns  (10 μs)
Send 2KB over 1Gbps network: 20,000 ns  (20 μs)
Read 1MB from RAM:           250,000 ns (250 μs)
Round trip in same DC:       500,000 ns (0.5 ms)
SSD random read:           1,000,000 ns (1 ms)
Read 1MB from SSD:         1,000,000 ns (1 ms)
HDD disk seek:            10,000,000 ns (10 ms)
Read 1MB from network:    10,000,000 ns (10 ms)
Send packet CA → Netherlands → CA: 150 ms

# Key takeaways:
# - RAM is 20× faster than SSD
# - SSD is 10× faster than HDD
# - Same-DC network is cheap (0.5ms) — use it
# - Cross-region calls (150ms) are expensive — avoid in hot path`}
      </CodeBlock>

      <CodeBlock language="bash" title="Throughput and Storage Estimates">
{`# Throughput baselines (single node, well-tuned)
MySQL writes:          ~1,000 writes/sec  (with indexes)
MySQL reads:          ~10,000 reads/sec
PostgreSQL:           similar to MySQL
Redis:               ~100,000 ops/sec   (single thread!)
Kafka:             ~1,000,000 msgs/sec  (batch writes)
Nginx (static files): ~10,000 req/sec

# Storage sizing
1 char  = 1 byte  (ASCII)
1 tweet (280 chars) ≈ 280 bytes + metadata ≈ 1 KB
1 profile photo = 200 KB (compressed)
1 minute HD video = 100 MB
1 hour HD video = 1 GB

# Quick formula: Users × Actions/day × Size/action
# Twitter timeline: 100M users × 10 reads/day × 1KB = 1TB reads/day
# Uber GPS updates: 1M rides × 1 update/5s × 50B = 10MB/sec writes

# Time conversions
1 day = 86,400 seconds ≈ 100,000 sec (useful approximation)
1 week = 604,800 sec ≈ 600,000 sec
1 year = 31,536,000 sec ≈ 30 million sec

# Divide by 100,000 to get req/sec from req/day
# 1 billion requests/day = 10,000 req/sec`}
      </CodeBlock>

      <h2>CAP Theorem</h2>
      <p>
        In a distributed system with network partitions (which always occur in practice), you must
        choose between Consistency and Availability.
      </p>

      <FlowChart
        title="CAP Theorem Trade-offs"
        chart={"graph TD\n  A[CAP Theorem] --> B[Consistency]\n  A --> C[Availability]\n  A --> D[Partition Tolerance]\n  D --> E[Always required in distributed systems]\n  B --> F[CP Systems]\n  C --> G[AP Systems]\n  F --> H[HBase, ZooKeeper, etcd]\n  G --> I[Cassandra, DynamoDB, CouchDB]"}
      />

      <CodeBlock language="markdown" title="CAP Decision Guide">
{`## CP (Consistency + Partition Tolerance)
# What: Every read gets the most recent write OR an error
# When to choose: Financial systems, inventory, anything money-related
# Trade-off: Might return errors during partitions
# Examples: HBase, ZooKeeper, etcd, traditional SQL with leader election

## AP (Availability + Partition Tolerance)
# What: System always responds, but data might be stale
# When to choose: Social media, caching, search, anything where
#                 slightly stale data is acceptable
# Trade-off: Eventual consistency — writes propagate asynchronously
# Examples: Cassandra, DynamoDB, CouchDB, DNS

## PACELC extension (more realistic than CAP):
# During Partition: choose between A and C
# Else (normal operation): choose between Latency and Consistency

# HBase:  PA/EC (choose Consistency over Availability and Latency)
# Dynamo: PA/EL (choose Availability and Latency over Consistency)
# MySQL:  PC/EC (choose Consistency in both scenarios)`}
      </CodeBlock>

      <h2>Consistency Models</h2>

      <CodeBlock language="markdown" title="Consistency Spectrum">
{`## Strong Consistency
# Every read sees the latest write.
# Implementation: synchronous replication, leader-based writes
# Cost: higher latency, lower availability
# Use: banking, inventory, anything with money

## Eventual Consistency
# Writes propagate asynchronously — all nodes converge given time.
# Implementation: async replication, gossip protocol
# Cost: reads may return stale data
# Use: social media likes, DNS, Amazon shopping cart

## Read-Your-Writes (Session Consistency)
# After a write, the same user always sees their own write.
# Implementation: route user reads to same replica, or wait for
#                 replication confirmation before returning to user
# Use: profile updates, settings changes

## Monotonic Read Consistency
# A user never sees data go "backwards in time" across reads.
# Implementation: sticky sessions to same replica
# Use: event feeds, comment threads

## Causal Consistency
# Causally related writes are seen in order.
# "Alice commented on Bob's post" — viewers see the post before the comment.
# Implementation: vector clocks, logical timestamps`}
      </CodeBlock>

      <h2>High-Level Architecture Patterns</h2>

      <FlowChart
        title="Three-Tier Architecture"
        chart={"graph LR\n  A[Client Browser or App] --> B[Load Balancer]\n  B --> C[App Server 1]\n  B --> D[App Server 2]\n  B --> E[App Server N]\n  C --> F[Cache Layer - Redis]\n  D --> F\n  E --> F\n  F --> G[Primary DB]\n  G --> H[Read Replica 1]\n  G --> I[Read Replica 2]"}
      />

      <CodeBlock language="markdown" title="Architecture Decision Checklist">
{`## When you receive a system design question, ask:

### Read vs Write Ratio
# Read-heavy (10:1+): add caching, read replicas
# Write-heavy: focus on queue, partitioning, write-optimized DB
# Both high: separate read and write paths (CQRS)

### Data Access Pattern
# Key-value lookups → Redis, DynamoDB
# Complex queries / joins → PostgreSQL, MySQL
# Full-text search → Elasticsearch
# Time-series → InfluxDB, TimescaleDB
# Graph relationships → Neo4j, Amazon Neptune
# Blob storage → S3, GCS

### Consistency Requirements
# Money / inventory → strong consistency, SQL, transactions
# Social / recommendations → eventual consistency fine
# Config / coordination → ZooKeeper, etcd (CP systems)

### Traffic Pattern
# Uniform → simple horizontal scaling
# Spiky (flash sales, viral) → autoscaling + queues to absorb bursts
# Geographical → CDN + multi-region deployment

### Data Size
# < 1TB → single node PostgreSQL is fine
# 1-10TB → read replicas + connection pooling
# > 10TB → sharding or switch to distributed DB`}
      </CodeBlock>

      <h2>Database Selection</h2>

      <CodeBlock language="markdown" title="Database Selection Guide">
{`## Relational (SQL)
# Best for: transactions, complex queries, referential integrity
# PostgreSQL:  full-featured, JSON support, best for most apps
# MySQL:       slightly faster for simple reads, huge ecosystem
# SQLite:      embedded, perfect for dev/mobile, not distributed

## Document (NoSQL)
# Best for: flexible schemas, nested data, content management
# MongoDB:     rich queries, good for moderate scale
# DynamoDB:    serverless, predictable performance at scale, AWS-native
# Firestore:   realtime sync, perfect for mobile/collaborative apps

## Column (Wide-Column)
# Best for: time-series, IoT, write-heavy, massive scale
# Cassandra:   masterless, linearly scalable, tunable consistency
# HBase:       Hadoop ecosystem, strong consistency

## Key-Value
# Best for: caching, sessions, counters, leaderboards
# Redis:       in-memory, data structures, pub/sub, single-threaded
# Memcached:   simpler, multi-threaded cache

## Search
# Best for: full-text search, faceted filtering, log analysis
# Elasticsearch: inverted index, powerful aggregations, ELK stack
# Typesense:     simpler, faster for pure search

## Graph
# Best for: social networks, fraud detection, recommendations
# Neo4j:     Cypher query language, mature
# Neptune:   AWS managed, multiple query languages`}
      </CodeBlock>

      <h2>Core Design Principles</h2>

      <CodeBlock language="markdown" title="System Design Principles">
{`## Single Points of Failure (SPOF)
# Every component should have a backup.
# Load balancers: at least 2 (active-passive or active-active)
# Databases: primary + replicas
# App servers: stateless — any can die without data loss

## Stateless Application Servers
# Store no session data in memory — put it in Redis or DB.
# Any server can handle any request — horizontal scaling is trivial.
# Servers can crash and restart without data loss.

## Idempotency
# Clients should be able to retry safely.
# POST /payments with idempotency-key header — same key = same result
# Critical for: payments, email sending, order placement

## Back-pressure
# When downstream is slow, signal upstream to slow down.
# Without: queue grows unbounded, memory exhausted, crash
# With: producer slows, system degrades gracefully

## Circuit Breaker Pattern
# When a dependency fails repeatedly, "open" the circuit.
# Return cached data or a graceful fallback immediately.
# After timeout, try again ("half-open") — if success, close circuit.
# Prevents cascading failures across microservices.

## Bulkhead Pattern
# Isolate resources (thread pools, DB connections) per service.
# One misbehaving service can't consume resources for others.
# Named after ship compartments that prevent total flooding.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Interview Framework: RESHADED">
        <p>
          Use <strong>RESHADED</strong> to structure system design answers: <strong>R</strong>equirements →
          <strong>E</strong>stimation → <strong>S</strong>torage → <strong>H</strong>igh-level design →
          <strong>A</strong>PI → <strong>D</strong>ata model → <strong>E</strong>valuate bottlenecks →
          <strong>D</strong>eep dive. This keeps your answer structured and ensures you cover all aspects
          interviewers look for.
        </p>
      </InfoBox>

      <h2>Reliability Concepts</h2>

      <CodeBlock language="markdown" title="SLI / SLO / SLA Definitions">
{`## SLI (Service Level Indicator)
# The actual metric you measure.
# Examples:
#   - Request success rate = successful_requests / total_requests
#   - p99 latency = 99th percentile response time
#   - Availability = uptime / total_time

## SLO (Service Level Objective)
# The target you set for an SLI.
# Examples:
#   - Success rate SLO: 99.9%
#   - p99 latency SLO: < 200ms
#   - Availability SLO: 99.95%

## SLA (Service Level Agreement)
# The contractual promise to customers, usually with penalties.
# SLA is usually weaker than internal SLO to leave buffer.
# Example: SLA = 99.9% → internal SLO = 99.95%

## Error Budgets
# If SLO = 99.9%, error budget = 0.1% = 8.7 hours/year
# Use it deliberately for deployments, experiments, maintenance
# When budget exhausted: freeze new features, focus on reliability

## Availability Table
# 99%    = 3.65 days downtime/year
# 99.9%  = 8.77 hours downtime/year   ("three nines")
# 99.99% = 52.6 minutes downtime/year ("four nines")
# 99.999%= 5.26 minutes downtime/year ("five nines")`}
      </CodeBlock>

      <h2>Back-of-Envelope Calculation Practice</h2>

      <CodeBlock language="markdown" title="Instagram-Scale Estimation">
{`## Instagram Scale Estimation

### Users
# 1 billion registered, 500M DAU
# 100M photos uploaded/day (upload-heavy, but read is 10x)

### Storage
# Average photo: 100 KB (after compression)
# 100M photos/day × 100KB = 10TB/day
# 10 years: 10TB × 3650 days = 36.5 PB for photos
# Add thumbnail (5KB) + metadata (1KB): ~35TB/day total

### Bandwidth
# Read: 500M DAU × 20 photos/day = 10B photo reads/day
# 10B reads/day / 86,400 s = 115,000 reads/sec
# 115,000 × 100KB = 11.5 GB/sec outbound
# With CDN: 99% hits → origin only serves 115 MB/sec

### API Design
# POST /photos           — upload
# GET  /photos/{id}      — get photo metadata
# GET  /users/{id}/feed  — get timeline
# POST /likes/{photoId}  — like a photo

### High-Level Architecture
# CDN: serve photos (99% cache hit rate)
# Object Store (S3): actual photo storage
# App Servers: stateless, handle API requests
# Feed Service: pre-computed timelines in Redis
# DB: PostgreSQL for metadata, follows, likes
# Queue: async photo processing (thumbnails, filters)
# Cache: Redis for hot timelines, user sessions`}
      </CodeBlock>

      <InteractiveChallenge
        question="A URL shortener gets 100 million new URLs per day and 10 billion reads per day. What is the read-to-write ratio?"
        options={["1:1", "10:1", "100:1", "1000:1"]}
        correctIndex={2}
        explanation="10 billion reads / 100 million writes = 100:1. This is extremely read-heavy, which means the system design should prioritize read performance: heavy caching (Redis), CDN for geographic distribution, and multiple read replicas. The write path is simple enough (generate short code, store mapping) that a single master DB handles it fine initially."
      />

      <InteractiveChallenge
        question="What is the key insight of the CAP theorem for real-world distributed systems?"
        options={[
          "You can achieve all three properties with enough engineering",
          "Since network partitions always happen, you must choose between Consistency and Availability",
          "Partition tolerance is optional for small systems",
          "Consistency and Availability are always mutually exclusive even without partitions"
        ]}
        correctIndex={1}
        explanation="Network partitions (nodes becoming unreachable) are inevitable in any distributed system — hardware fails, networks split, cables get cut. Since P (partition tolerance) is non-negotiable in practice, the real choice is C vs A: do you return an error (CP) or stale data (AP) when a partition occurs? The right choice depends on your domain: banking needs CP, social media can use AP."
      />
    </LessonLayout>
  );
}
