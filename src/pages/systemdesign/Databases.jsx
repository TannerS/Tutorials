import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SysDatabases() {
  return (
    <LessonLayout
      title="Databases"
      sectionId="systemdesign"
      lessonIndex={3}
      prev={{ path: "/systemdesign/caching", label: "Caching" }}
      next={{ path: "/systemdesign/distributed", label: "Distributed Systems" }}
    >
      <p>
        Choosing the right database is one of the most consequential decisions in system design.
        The wrong choice can cripple performance at scale or make your data model unworkable.
        This lesson covers SQL vs NoSQL trade-offs, PostgreSQL internals, sharding, replication,
        and the principle of <strong>polyglot persistence</strong> — using multiple database types
        together, each for what it does best.
      </p>

      <FlowChart
        title="Database Selection Decision Tree"
        chart={"graph TD\n  A[What are your access patterns?] --> B{Complex JOINs or ACID?}\n  B -- Yes --> C[Relational: PostgreSQL / MySQL]\n  B -- No --> D{Document or flexible schema?}\n  D -- Yes --> E[Document: MongoDB / Firestore]\n  D -- No --> F{Simple key-value lookups?}\n  F -- Yes --> G[Key-Value: Redis / DynamoDB]\n  F -- No --> H{Time-series metrics?}\n  H -- Yes --> I[TimescaleDB / InfluxDB]\n  H -- No --> J{Wide-column analytics?}\n  J -- Yes --> K[Cassandra / HBase]\n  J -- No --> L[Graph: Neo4j / Amazon Neptune]"}
      />

      <h2>SQL vs NoSQL — The Real Trade-Offs</h2>
      <p>
        The SQL vs NoSQL debate is not about one being better. It is about matching the tool to
        the access patterns, consistency requirements, and scale of your system.
      </p>

      <InfoBox variant="note" title="When to Choose SQL (PostgreSQL / MySQL)">
        <ul>
          <li><strong>Complex relationships:</strong> Data has many-to-many relationships requiring JOINs (e-commerce, ERP, finance).</li>
          <li><strong>ACID transactions:</strong> You need guaranteed atomicity across multiple tables (payments, inventory updates).</li>
          <li><strong>Ad-hoc queries:</strong> Analysts need to run arbitrary SQL queries you did not anticipate at design time.</li>
          <li><strong>Strong consistency:</strong> Every read must see the latest committed write.</li>
          <li><strong>Mature tooling:</strong> You need migrations, ORMs, reporting tools, backups — the ecosystem is enormous.</li>
        </ul>
      </InfoBox>

      <InfoBox variant="note" title="When to Choose NoSQL">
        <ul>
          <li><strong>Massive write throughput:</strong> Cassandra handles millions of writes/second across a cluster with no single-master bottleneck.</li>
          <li><strong>Flexible / evolving schema:</strong> Each document can have different fields (MongoDB, Firestore).</li>
          <li><strong>Global distribution:</strong> DynamoDB and Cosmos DB offer multi-region active-active writes.</li>
          <li><strong>Simple access patterns:</strong> Always query by primary key or a known index — no ad-hoc queries.</li>
          <li><strong>Massive datasets:</strong> NoSQL stores scale horizontally by design; relational sharding is complex.</li>
        </ul>
      </InfoBox>

      <h2>PostgreSQL Internals — What Every Engineer Should Know</h2>

      <CodeBlock language="sql" title="MVCC — Multi-Version Concurrency Control">
{`-- PostgreSQL never overwrites rows in place.
-- Instead, it writes a new version of the row (tuple) with updated xmin/xmax
-- transaction IDs. Old versions are kept until VACUUM removes them.
-- This means: readers never block writers, writers never block readers.

-- Each row has hidden system columns:
-- xmin: transaction ID that created this row version
-- xmax: transaction ID that deleted/updated this row version (0 if current)
-- ctid:  physical location (page, offset) of the row

SELECT xmin, xmax, ctid, * FROM orders WHERE id = 42;
-- xmin=1500  xmax=0  ctid=(3,7)  id=42 status='pending'

-- After an UPDATE:
UPDATE orders SET status = 'shipped' WHERE id = 42;
-- Old row: xmin=1500 xmax=1750 ctid=(3,7)   -- marked deleted by txn 1750
-- New row: xmin=1750 xmax=0    ctid=(3,8)   -- new version created by txn 1750

-- VACUUM reclaims dead tuples (old row versions no longer visible to any txn)
VACUUM orders;            -- reclaim space, but doesn't shrink file
VACUUM FULL orders;       -- shrink file (takes exclusive lock — use with caution)
AUTOVACUUM runs automatically, but you may need to tune it for write-heavy tables.

-- ── WAL — Write-Ahead Log ───────────────────────────────────────
-- All changes are written to WAL (sequential log) BEFORE the data pages.
-- On crash, PostgreSQL replays WAL to recover to a consistent state.
-- WAL is also used for streaming replication (standby replicas replay WAL).

-- WAL configuration (postgresql.conf):
-- wal_level = replica          -- enables streaming replication
-- max_wal_senders = 10         -- max concurrent replication connections
-- synchronous_commit = on      -- wait for WAL to be flushed before returning
--   (set to 'off' for ~3x write throughput at cost of up to 600ms of data loss)

-- ── TRANSACTION ISOLATION LEVELS ────────────────────────────────
BEGIN ISOLATION LEVEL READ COMMITTED;     -- default; sees committed reads
BEGIN ISOLATION LEVEL REPEATABLE READ;    -- snapshot at txn start; no phantom reads
BEGIN ISOLATION LEVEL SERIALIZABLE;       -- full serializability; max protection

-- Check for lock waits
SELECT pid, wait_event_type, wait_event, query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';`}
      </CodeBlock>

      <CodeBlock language="sql" title="Indexing Strategies — Getting Performance Right">
{`-- ── B-TREE INDEX (default) ───────────────────────────────────────
-- Good for: equality (=), range (<, >, BETWEEN), ORDER BY, LIKE 'foo%'
CREATE INDEX CONCURRENTLY idx_orders_customer_created
  ON orders(customer_id, created_at DESC);
-- CONCURRENTLY = build without taking exclusive lock (safe in production)
-- Composite index rule: put equality columns first, range/sort column last

-- ── PARTIAL INDEX ────────────────────────────────────────────────
-- Indexes only rows matching a WHERE clause — smaller and faster
CREATE INDEX idx_orders_pending ON orders(created_at)
  WHERE status = 'pending';
-- Index is tiny: only unprocessed orders; perfect for "pending orders" queries

-- ── GIN INDEX (Generalized Inverted Index) ────────────────────────
-- Good for: full-text search, JSONB fields, arrays
CREATE INDEX idx_articles_search ON articles USING GIN(to_tsvector('english', body));
-- Query using index:
SELECT * FROM articles
WHERE to_tsvector('english', body) @@ plainto_tsquery('english', 'redis caching');

CREATE INDEX idx_products_attributes ON products USING GIN(attributes);
-- Query JSONB field (uses GIN index):
SELECT * FROM products WHERE attributes @> '{"color": "red", "size": "L"}';

-- ── BRIN INDEX (Block Range Index) ───────────────────────────────
-- Very small index for naturally-ordered data (timestamps, sequential IDs)
-- Each entry covers a range of data blocks (not individual rows)
CREATE INDEX idx_events_created_brin ON events USING BRIN(created_at);
-- Orders of magnitude smaller than B-tree; good for append-only time-series tables

-- ── EXPLAIN ANALYZE — find slow queries ─────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.*, c.email
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'pending'
  AND o.created_at > NOW() - INTERVAL '7 days'
ORDER BY o.created_at DESC
LIMIT 50;
-- Look for: "Seq Scan" on large tables (needs index), high cost nodes,
-- "rows=10000 actual rows=1" (bad estimate → stale statistics → run ANALYZE)`}
      </CodeBlock>

      <h2>Sharding Strategies</h2>
      <p>
        Sharding (horizontal partitioning) splits a single large dataset across multiple database
        servers. Each server owns a subset of the data. This is the primary way to scale writes
        beyond what a single database server can handle.
      </p>

      <CodeBlock language="python" title="Sharding Strategies — Range, Hash, Directory">
{`# ── RANGE SHARDING ───────────────────────────────────────────────
# Split by value range of the shard key.
# Pros: Simple; range queries stay on one shard; easy to add shards.
# Cons: Hot spots if data isn't uniformly distributed (e.g., recent IDs get all writes).

def get_shard_range(user_id: int) -> str:
    if user_id < 1_000_000:
        return "db-shard-0"  # users 0–999,999
    elif user_id < 2_000_000:
        return "db-shard-1"  # users 1M–1.99M
    else:
        return "db-shard-2"  # users 2M+

# ── HASH SHARDING ────────────────────────────────────────────────
# Hash the shard key modulo the number of shards.
# Pros: Even distribution; no hot spots (usually).
# Cons: Range queries span ALL shards; resharding requires moving ~all data.

import hashlib

def get_shard_hash(user_id: int, num_shards: int = 4) -> str:
    h = int(hashlib.md5(str(user_id).encode()).hexdigest(), 16)
    return f"db-shard-{h % num_shards}"

# ── CONSISTENT HASHING ───────────────────────────────────────────
# Maps shard keys to positions on a "ring". Adding/removing a shard
# only moves ~1/N of keys (vs all keys in plain hash sharding).
# Used by: Cassandra, DynamoDB, Memcached, Riak.

# ── DIRECTORY SHARDING ───────────────────────────────────────────
# A lookup table maps each key to its shard.
# Pros: Fully flexible; easy to rebalance; no algorithmic constraint.
# Cons: Lookup table becomes a bottleneck and single point of failure.

SHARD_MAP = {
    "user:1": "db-shard-0",
    "user:2": "db-shard-1",
    # ...
}

def get_shard_directory(user_id: int) -> str:
    shard = SHARD_MAP.get(f"user:{user_id}")
    if not shard:
        shard = assign_to_least_loaded_shard(user_id)
        SHARD_MAP[f"user:{user_id}"] = shard  # cache the assignment
    return shard

# ── CROSS-SHARD CHALLENGES ───────────────────────────────────────
# 1. JOINs across shards: must be done in application code (scatter-gather)
# 2. Distributed transactions: 2PC or saga pattern required
# 3. Auto-increment IDs: use snowflake IDs (timestamp + machineId + sequence)
#    to generate globally unique IDs without coordination

def snowflake_id(machine_id: int) -> int:
    import time
    epoch = 1420070400000  # custom epoch (Jan 1 2015)
    ts = int(time.time() * 1000) - epoch
    seq = next_sequence()  # per-machine sequence number, 12 bits
    return (ts << 22) | (machine_id << 12) | seq`}
      </CodeBlock>

      <h2>Replication Types</h2>

      <FlowChart
        title="Replication Topology"
        chart={"graph TD\n  A[Primary DB Write] --> B[Sync Replica 1]\n  A --> C[Async Replica 2]\n  A --> D[Async Replica 3 Read]\n  B -- failover --> E[New Primary]\n  D --> F[Read Traffic]"}
      />

      <CodeBlock language="yaml" title="Replication Strategies — Trade-Offs">
{`# ── SINGLE-LEADER REPLICATION ────────────────────────────────────
# One primary accepts writes; replicas follow via WAL/binlog streaming.
# PostgreSQL streaming replication example (postgresql.conf on primary):
primary:
  wal_level: replica
  max_wal_senders: 5
  synchronous_standby_names: ''  # '' = async; 'replica-1' = sync

# Async replication: primary commits without waiting for replica ACK.
#   Pros: Low write latency. Cons: Up to N seconds of data loss on primary failure.
# Sync replication: primary waits for at least one replica to confirm WAL write.
#   Pros: Zero data loss (RPO=0). Cons: Write latency includes network RTT to replica.

replica:
  primary_conninfo: 'host=primary-db port=5432 user=repl password=secret'
  recovery_target_timeline: latest
  hot_standby: on     # allows read queries on replica while replicating

# ── MULTI-LEADER REPLICATION ─────────────────────────────────────
# Multiple nodes accept writes. Used for multi-region active-active setups.
# Challenge: Write conflicts when two leaders update the same row.
# Conflict resolution strategies:
#   - Last-write-wins (LWW): highest timestamp wins — risk of data loss
#   - Application-level merge: application merges conflicting versions
#   - CRDTs: data structures that merge automatically (counters, sets)
# Used by: CockroachDB, Cassandra, DynamoDB Global Tables

# ── LEADERLESS REPLICATION ────────────────────────────────────────
# Any node accepts writes. Uses quorum reads and writes.
# Write quorum W + Read quorum R > N (total replicas) = strong consistency
# Cassandra example: replication_factor=3, consistency_level=QUORUM
#   Write: must succeed on ceil(3/2) = 2 nodes
#   Read:  must succeed on ceil(3/2) = 2 nodes
#   2 + 2 > 3: guaranteed to see the latest write`}
      </CodeBlock>

      <h2>Polyglot Persistence — Using Multiple Databases</h2>

      <InfoBox variant="tip" title="Real-World Polyglot Architecture">
        <p>
          Large systems rarely use just one database type. A typical e-commerce platform might use:
        </p>
        <ul>
          <li><strong>PostgreSQL</strong> — orders, payments, user accounts (ACID, complex queries)</li>
          <li><strong>Redis</strong> — sessions, carts, rate limiting, leaderboards (sub-millisecond latency)</li>
          <li><strong>Elasticsearch</strong> — product search, full-text queries, faceted filtering</li>
          <li><strong>Cassandra / DynamoDB</strong> — event logs, audit trails, recommendation data (massive write scale)</li>
          <li><strong>S3 / GCS</strong> — images, documents, large binary objects</li>
          <li><strong>TimescaleDB / InfluxDB</strong> — metrics, monitoring, time-series analytics</li>
        </ul>
        <p>
          The key is maintaining the source of truth in one place (usually the relational DB) and
          keeping other stores as derived views, synchronized via change data capture (CDC) or
          event streams.
        </p>
      </InfoBox>

      <h2>Time-Series Databases</h2>

      <CodeBlock language="sql" title="TimescaleDB — PostgreSQL Extension for Time-Series">
{`-- TimescaleDB extends PostgreSQL with automatic time partitioning ("chunks").
-- Each chunk covers a time range (e.g., 7 days). Queries only scan relevant chunks.
-- Compression can achieve 90%+ storage reduction on old data.

-- Create a hypertable (partitioned by time automatically)
CREATE TABLE metrics (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value       DOUBLE PRECISION
);

SELECT create_hypertable('metrics', 'time',
    chunk_time_interval => INTERVAL '1 day');

-- Add a secondary index on device_id for per-device queries
CREATE INDEX ON metrics (device_id, time DESC);

-- Insert — same as regular PostgreSQL
INSERT INTO metrics VALUES (NOW(), 'sensor-1', 'temperature', 23.4);

-- Time-bucketing aggregation — built-in function
SELECT time_bucket('1 hour', time) AS bucket,
       device_id,
       avg(value) AS avg_temp,
       max(value) AS max_temp,
       min(value) AS min_temp
FROM metrics
WHERE metric_name = 'temperature'
  AND time > NOW() - INTERVAL '24 hours'
GROUP BY bucket, device_id
ORDER BY bucket DESC;

-- Continuous aggregate — materialized and auto-refreshed
CREATE MATERIALIZED VIEW hourly_metrics
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS bucket,
       device_id,
       avg(value) AS avg_value
FROM metrics
GROUP BY bucket, device_id;

-- Compress chunks older than 7 days (saves 90%+ storage)
ALTER TABLE metrics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id'
);
SELECT add_compression_policy('metrics', INTERVAL '7 days');`}
      </CodeBlock>

      <h2>NewSQL — The Best of Both Worlds</h2>

      <CodeBlock language="sql" title="CockroachDB / Spanner — Distributed SQL">
{`-- NewSQL databases (CockroachDB, Google Spanner, TiDB) offer:
-- - Full SQL semantics and ACID transactions
-- - Horizontal scaling like NoSQL
-- - Automatic sharding and rebalancing
-- - Multi-region deployments with strong consistency
-- Trade-off: higher write latency due to distributed consensus (Raft/Paxos)

-- CockroachDB: standard PostgreSQL-compatible SQL
CREATE TABLE orders (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer   UUID NOT NULL,
    total      DECIMAL(10,2) NOT NULL,
    status     STRING DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_customer_created (customer, created_at DESC)
);

-- Multi-region table — data replicated across US, EU, APAC
ALTER TABLE orders SET LOCALITY REGIONAL BY ROW;

-- Serializable transactions across shards — no application-level 2PC needed
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 'alice';
  UPDATE accounts SET balance = balance + 100 WHERE id = 'bob';
COMMIT;
-- CockroachDB handles distributed coordination internally via Raft

-- When to use NewSQL vs traditional sharded SQL:
-- Use NewSQL: multi-region active-active, global user base, want SQL without sharding complexity
-- Use sharded SQL: very high throughput single-region, team familiar with manual sharding, cost-sensitive`}
      </CodeBlock>

      <InteractiveChallenge
        question="In PostgreSQL, what does MVCC (Multi-Version Concurrency Control) mean and why is it important?"
        options={[
          "Multiple database versions can be installed simultaneously",
          "PostgreSQL creates new row versions on update instead of overwriting, so readers never block writers and writers never block readers",
          "Multiple applications can connect to the same database concurrently",
          "The database maintains multiple backups of each table"
        ]}
        correctIndex={1}
        explanation={"MVCC means PostgreSQL never modifies rows in place. An UPDATE writes a new tuple with a new transaction ID (xmin), while the old tuple is kept with its xmax set to the updating transaction. Readers see a consistent snapshot as of their transaction start time, without acquiring locks. Writers create new versions without blocking readers. Old versions accumulate as 'dead tuples' until VACUUM reclaims them. This is why PostgreSQL can have high concurrent read/write throughput but requires regular VACUUM maintenance."}
      />

      <InteractiveChallenge
        question="Your application needs to store 10 billion IoT sensor readings per month, queried primarily by device and time range. Which database choice is most appropriate?"
        options={[
          "PostgreSQL with a single massive table and B-tree index on timestamp",
          "MongoDB, because the flexible schema can handle different sensor types",
          "TimescaleDB (PostgreSQL + automatic time partitioning) or Cassandra, partitioned by device_id and time",
          "Redis, because it has very low write latency"
        ]}
        correctIndex={2}
        explanation={"10 billion rows/month is a classic time-series workload. TimescaleDB automatically partitions ('chunks') the data by time, so range queries only scan relevant partitions. Cassandra partitions by device_id and uses a clustering key on time — queries for a device's readings in a time range are extremely fast. A plain PostgreSQL B-tree on a single table would be slow and require manual partitioning. MongoDB lacks automatic time-based partitioning. Redis does not have persistent ordered time-series semantics at this scale."}
      />
    </LessonLayout>
  );
}
