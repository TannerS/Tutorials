import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Databases() {
  return (
    <LessonLayout
      title="Database Design &amp; Scaling"
      sectionId="systemdesign"
      lessonIndex={3}
      prev={{ path: '/systemdesign/caching', label: 'Caching Strategies' }}
      next={{ path: '/systemdesign/distributed', label: 'Distributed Systems' }}
    >
      {/* ===== Section 1: SQL vs NoSQL ===== */}
      <h2>SQL vs NoSQL</h2>
      <p>
        One of the most fundamental decisions in system design is choosing between SQL
        and NoSQL databases. Each paradigm has distinct strengths, and the right choice
        depends on your data model, consistency requirements, and scaling needs.
      </p>

      <h3>Comparison Table</h3>
      <table>
        <thead>
          <tr>
            <th>Aspect</th>
            <th>SQL (Relational)</th>
            <th>NoSQL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Data Model</td>
            <td>Tables with rows &amp; columns</td>
            <td>Document, key-value, column-family, or graph</td>
          </tr>
          <tr>
            <td>Schema</td>
            <td>Fixed schema, enforced by DB</td>
            <td>Flexible / schema-less</td>
          </tr>
          <tr>
            <td>Scaling</td>
            <td>Primarily vertical (scale up)</td>
            <td>Primarily horizontal (scale out)</td>
          </tr>
          <tr>
            <td>ACID</td>
            <td>Full ACID support</td>
            <td>Varies — often eventual consistency</td>
          </tr>
          <tr>
            <td>Query Language</td>
            <td>SQL (standardized)</td>
            <td>Database-specific APIs or query languages</td>
          </tr>
          <tr>
            <td>Joins</td>
            <td>Native multi-table joins</td>
            <td>Generally no joins — denormalized data</td>
          </tr>
          <tr>
            <td>Examples</td>
            <td>PostgreSQL, MySQL, Oracle, SQL Server</td>
            <td>MongoDB, Redis, Cassandra, Neo4j</td>
          </tr>
        </tbody>
      </table>

      <h3>When to Use SQL</h3>
      <ul>
        <li>Complex queries with joins across multiple entities</li>
        <li>Strong consistency and transactional guarantees (banking, e-commerce orders)</li>
        <li>Well-defined, stable schema that rarely changes</li>
        <li>Relational data with many-to-many relationships</li>
        <li>Regulatory requirements demanding ACID compliance</li>
      </ul>

      <h3>When to Use NoSQL</h3>
      <ul>
        <li>Rapidly evolving schema or semi-structured data</li>
        <li>Massive write throughput requirements</li>
        <li>Horizontal scaling across many nodes</li>
        <li>Low-latency reads on simple key-based lookups</li>
        <li>Hierarchical or nested data that maps poorly to tables</li>
      </ul>

      <h3>Types of NoSQL Databases</h3>
      <p>
        NoSQL is not a single technology — it is a family of database paradigms, each
        optimized for different access patterns:
      </p>
      <ul>
        <li>
          <strong>Document Stores (MongoDB, CouchDB):</strong> Store data as JSON-like
          documents. Great for content management, catalogs, and user profiles where
          each record can have a different structure.
        </li>
        <li>
          <strong>Key-Value Stores (Redis, DynamoDB):</strong> Simple key-to-value
          mappings with extremely fast reads and writes. Ideal for caching, session
          storage, and real-time leaderboards.
        </li>
        <li>
          <strong>Column-Family Stores (Cassandra, HBase):</strong> Organize data by
          columns rather than rows. Excellent for time-series data, analytics, and
          write-heavy workloads at massive scale.
        </li>
        <li>
          <strong>Graph Databases (Neo4j, Amazon Neptune):</strong> Model data as
          nodes and edges. Perfect for social networks, recommendation engines, and
          fraud detection where relationships are the primary query target.
        </li>
      </ul>

      <InfoBox type="tip" title="Choosing the Right Database">
        In system design interviews, don&apos;t default to one database type. Start by
        understanding the data model, read/write ratio, consistency requirements, and
        scale expectations. Then justify your choice. Using multiple databases in a
        single system (polyglot persistence) is common and often the correct answer.
      </InfoBox>

      {/* ===== Section 2: ACID Properties ===== */}
      <h2>ACID Properties</h2>
      <p>
        ACID is a set of properties that guarantee database transactions are processed
        reliably. Understanding ACID is essential for designing systems where data
        integrity is non-negotiable.
      </p>

      <h3>Atomicity</h3>
      <p>
        A transaction is treated as a single, indivisible unit. Either all operations
        within the transaction succeed, or none of them do. If any part fails, the
        entire transaction is rolled back to its previous state. Think of transferring
        money between accounts — you never want to debit one account without crediting
        the other.
      </p>

      <h3>Consistency</h3>
      <p>
        A transaction brings the database from one valid state to another valid state.
        All data integrity constraints, foreign keys, and business rules are satisfied
        before and after the transaction. The database never enters a state that violates
        its own rules.
      </p>

      <h3>Isolation</h3>
      <p>
        Concurrent transactions execute as if they were running sequentially. One
        transaction cannot see the intermediate results of another. Isolation levels
        (Read Uncommitted, Read Committed, Repeatable Read, Serializable) let you
        trade strictness for performance.
      </p>

      <h3>Durability</h3>
      <p>
        Once a transaction is committed, the changes are permanent — even if the
        system crashes immediately afterward. This is typically achieved through
        write-ahead logging (WAL) and flushing data to non-volatile storage.
      </p>

      <InfoBox type="warning" title="ACID in Financial Systems">
        Financial applications (banking, payments, trading) require strict ACID
        guarantees. A failure in atomicity could cause money to vanish or appear from
        nowhere. A failure in durability could lose confirmed transactions. Never
        compromise on ACID for financial data.
      </InfoBox>

      <CodeBlock
        language="sql"
        title="SQL Transaction Example"
        code={`-- Transfer $500 from Account A to Account B
BEGIN TRANSACTION;

UPDATE accounts
SET balance = balance - 500
WHERE account_id = 'A'
  AND balance >= 500;  -- Prevent overdraft

UPDATE accounts
SET balance = balance + 500
WHERE account_id = 'B';

-- Record the transfer
INSERT INTO transfers (from_acct, to_acct, amount, created_at)
VALUES ('A', 'B', 500, NOW());

-- If all three statements succeed, commit
COMMIT;

-- If any statement fails, the DB rolls back all changes
-- ROLLBACK;`}
      />

      {/* ===== Section 3: BASE Properties ===== */}
      <h2>BASE Properties</h2>
      <p>
        BASE is the counterpart to ACID, commonly associated with NoSQL and distributed
        systems. BASE trades strong consistency for availability and partition tolerance.
      </p>

      <h3>Basically Available</h3>
      <p>
        The system guarantees availability as defined by the CAP theorem. Every request
        receives a response — though the data may not be the most recent version.
        The system prioritizes staying online over returning perfectly accurate data.
      </p>

      <h3>Soft State</h3>
      <p>
        The state of the system may change over time, even without new input. This is
        because data is being propagated across replicas asynchronously. The system is
        always in flux until all replicas converge.
      </p>

      <h3>Eventually Consistent</h3>
      <p>
        Given enough time without new updates, all replicas will converge to the same
        value. The system does not guarantee immediate consistency after a write, but
        it will become consistent eventually — typically within milliseconds to seconds.
      </p>

      <h3>ACID vs BASE</h3>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>ACID</th>
            <th>BASE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Consistency</td>
            <td>Strong — immediate</td>
            <td>Eventual — delayed</td>
          </tr>
          <tr>
            <td>Availability</td>
            <td>May sacrifice availability for consistency</td>
            <td>Prioritizes availability</td>
          </tr>
          <tr>
            <td>Performance</td>
            <td>Slower due to locking &amp; coordination</td>
            <td>Faster due to relaxed guarantees</td>
          </tr>
          <tr>
            <td>Use Cases</td>
            <td>Banking, inventory, booking systems</td>
            <td>Social feeds, analytics, caching layers</td>
          </tr>
          <tr>
            <td>Scaling</td>
            <td>Harder to scale horizontally</td>
            <td>Designed for horizontal scaling</td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>When BASE is acceptable:</strong> Social media timelines (seeing a post
        a few seconds late is fine), product view counts (approximate counts are okay),
        DNS propagation, search engine indexing, and analytics dashboards where real-time
        precision is not critical.
      </p>

      {/* ===== Section 4: Database Indexing Deep Dive ===== */}
      <h2>Database Indexing Deep Dive</h2>
      <p>
        An index is a data structure that improves the speed of data retrieval at the
        cost of additional storage and slower writes. Without indexes, the database must
        perform a full table scan — reading every row to find matches. With the right
        indexes, queries that once scanned millions of rows can return results in
        milliseconds.
      </p>

      <h3>B-Tree Indexes</h3>
      <p>
        B-Tree (balanced tree) indexes are the default index type in most relational
        databases. They maintain sorted data in a tree structure where each node can
        have multiple children. This makes them efficient for:
      </p>
      <ul>
        <li>Equality lookups: <code>WHERE id = 42</code></li>
        <li>Range queries: <code>WHERE created_at &gt; &apos;2024-01-01&apos;</code></li>
        <li>Sorting: <code>ORDER BY last_name</code></li>
        <li>Prefix matching: <code>WHERE name LIKE &apos;John%&apos;</code></li>
      </ul>
      <p>
        B-Trees have O(log n) lookup time and keep data balanced, ensuring consistent
        performance regardless of data distribution.
      </p>

      <h3>Hash Indexes</h3>
      <p>
        Hash indexes use a hash function to map keys directly to locations. They provide
        O(1) lookups for exact-match queries but cannot support range queries, sorting,
        or partial matching. Use hash indexes when you only need equality comparisons
        and want the fastest possible lookups.
      </p>

      <h3>Composite Indexes</h3>
      <p>
        A composite (multi-column) index covers multiple columns. The order of columns
        in a composite index is critical — the index can only be used efficiently when
        queries filter on a <strong>leftmost prefix</strong> of the indexed columns.
      </p>
      <p>
        For example, an index on <code>(country, city, zip_code)</code> can accelerate
        queries filtering by <code>country</code> alone, <code>country + city</code>,
        or all three columns. But it <strong>cannot</strong> efficiently serve a query
        filtering only by <code>city</code> or <code>zip_code</code> because those are
        not leftmost prefixes.
      </p>

      <CodeBlock
        language="sql"
        title="Index Examples"
        code={`-- Single-column index for fast user lookups by email
CREATE INDEX idx_users_email ON users (email);

-- Composite index: column order matters!
-- This index supports queries on (status), (status, created_at),
-- and (status, created_at, priority) — but NOT (created_at) alone.
CREATE INDEX idx_orders_status_date ON orders (status, created_at, priority);

-- Unique index enforces uniqueness AND speeds up lookups
CREATE UNIQUE INDEX idx_users_username ON users (username);

-- Partial index: only index active users (PostgreSQL)
CREATE INDEX idx_active_users ON users (email)
WHERE is_active = true;

-- Covering index: includes extra columns to avoid table lookups
CREATE INDEX idx_orders_covering ON orders (customer_id)
INCLUDE (total_amount, status);

-- Check existing indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders';

-- Analyze query plan to verify index usage
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE status = 'pending'
  AND created_at > '2024-01-01'
ORDER BY created_at DESC;`}
      />

      <InfoBox type="warning" title="The Danger of Over-Indexing">
        Every index slows down INSERT, UPDATE, and DELETE operations because the index
        must be updated alongside the data. Indexes also consume disk space. A table
        with 10 indexes will have significantly slower write performance than one with
        2. Only create indexes that serve actual query patterns. Use EXPLAIN ANALYZE
        to verify your indexes are being used — unused indexes are pure overhead.
      </InfoBox>

      <InteractiveChallenge
        question={"You have a query: SELECT * FROM orders WHERE customer_id = 123 AND status = 'shipped' ORDER BY created_at DESC. Which composite index best supports this query?"}
        options={[
          'CREATE INDEX idx ON orders (created_at, customer_id, status)',
          'CREATE INDEX idx ON orders (customer_id, status, created_at)',
          'CREATE INDEX idx ON orders (status, created_at, customer_id)',
          'CREATE INDEX idx ON orders (customer_id, created_at, status)',
        ]}
        correctIndex={1}
        explanation={"The optimal index is (customer_id, status, created_at). Equality columns (customer_id, status) should come first, followed by the sort column (created_at). This lets the database seek directly to the matching customer_id + status combination and then scan the index in order for created_at DESC, avoiding a separate sort step. Putting created_at first would waste the index's sorted structure on a column that isn't filtered by equality."}
      />

      {/* ===== Section 5: Sharding Strategies ===== */}
      <h2>Sharding Strategies</h2>
      <p>
        Sharding (horizontal partitioning) distributes data across multiple database
        nodes. Each shard holds a subset of the total data. Sharding is necessary when
        a single database server can no longer handle the data volume, write throughput,
        or query load.
      </p>

      <h3>Hash-Based Sharding</h3>
      <p>
        Apply a hash function to the shard key (e.g., <code>hash(user_id) % num_shards</code>)
        to determine which shard stores the data. This distributes data evenly across
        shards but makes range queries difficult because adjacent keys may land on
        different shards. Adding or removing shards requires rehashing (consistent
        hashing mitigates this).
      </p>

      <h3>Range-Based Sharding</h3>
      <p>
        Partition data by ranges of the shard key. For example, users A–M go to shard 1,
        N–Z go to shard 2. This preserves data locality and supports efficient range
        queries, but can lead to hotspots if certain ranges receive disproportionate
        traffic.
      </p>

      <h3>Directory-Based Sharding</h3>
      <p>
        Maintain a lookup table (directory) that maps each shard key to its shard. This
        is the most flexible approach — you can move data between shards without changing
        the algorithm. However, the directory itself becomes a single point of failure
        and a potential bottleneck.
      </p>

      <FlowChart
        title="Hash-Based Sharding Architecture"
        chart={`graph TD
    Client[Client Request] --> Router[Shard Router]
    Router --> Hash[Hash Function]
    Hash --> Decision{hash mod N}
    Decision -->|mod 0| S0[Shard 0\nUsers 0-hash]
    Decision -->|mod 1| S1[Shard 1\nUsers 1-hash]
    Decision -->|mod 2| S2[Shard 2\nUsers 2-hash]
    S0 --> R0[Replica 0]
    S1 --> R1[Replica 1]
    S2 --> R2[Replica 2]`}
      />

      <h3>Choosing a Good Shard Key</h3>
      <p>
        The shard key determines how data is distributed. A good shard key should:
      </p>
      <ul>
        <li><strong>High cardinality:</strong> Many distinct values to distribute data evenly</li>
        <li><strong>Even distribution:</strong> Avoid keys that cluster (e.g., country code in a US-heavy app)</li>
        <li><strong>Query alignment:</strong> Most queries should target a single shard, not scatter across all shards</li>
        <li><strong>Immutability:</strong> Changing a shard key requires moving data between shards — very expensive</li>
      </ul>

      <h3>Resharding Challenges</h3>
      <p>
        When you need to add or remove shards, existing data must be redistributed. This
        is complex and risky:
      </p>
      <ul>
        <li>Data migration can take hours or days for large datasets</li>
        <li>The system must handle reads and writes during migration</li>
        <li>Consistent hashing reduces the amount of data moved but adds complexity</li>
        <li>Virtual shards (mapping many virtual shards to fewer physical nodes) make future resharding easier</li>
      </ul>

      <InfoBox type="tip" title="Preventing Hotspots">
        Hotspots occur when one shard receives disproportionate traffic. Common causes
        include poor shard key selection (e.g., sharding by date puts all current writes
        on one shard), celebrity users generating massive read traffic, or sequential
        IDs that cluster new data on the latest shard. Mitigations include adding a
        random suffix to shard keys, using consistent hashing with virtual nodes, or
        splitting hot shards.
      </InfoBox>

      {/* ===== Section 6: Replication ===== */}
      <h2>Replication</h2>
      <p>
        Replication copies data across multiple database servers to improve availability,
        fault tolerance, and read performance. If one server goes down, replicas ensure
        the data is still accessible.
      </p>

      <h3>Primary-Replica Replication</h3>
      <p>
        One primary node handles all writes. Replica nodes receive copies of the data
        and serve read traffic. This is the most common replication topology. If the
        primary fails, a replica can be promoted to take over. The trade-off is that
        replicas may serve slightly stale data if replication is asynchronous.
      </p>

      <h3>Multi-Primary Replication</h3>
      <p>
        Multiple nodes accept writes, and changes are synchronized between them. This
        improves write availability and supports multi-region deployments. However, it
        introduces write conflicts — two primaries may update the same record simultaneously.
        Conflict resolution strategies include last-write-wins, application-level
        merging, or CRDTs (Conflict-free Replicated Data Types).
      </p>

      <FlowChart
        title="Primary-Replica Replication Topology"
        chart={`graph TD
    App[Application] --> LB[Load Balancer]
    LB -->|Writes| Primary[Primary Node]
    LB -->|Reads| R1[Replica 1]
    LB -->|Reads| R2[Replica 2]
    LB -->|Reads| R3[Replica 3]
    Primary -->|Replication Stream| R1
    Primary -->|Replication Stream| R2
    Primary -->|Replication Stream| R3
    Primary -->|WAL| WAL[Write-Ahead Log]`}
      />

      <h3>Synchronous vs Asynchronous Replication</h3>
      <table>
        <thead>
          <tr>
            <th>Aspect</th>
            <th>Synchronous</th>
            <th>Asynchronous</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Write latency</td>
            <td>Higher — waits for replica acknowledgment</td>
            <td>Lower — returns immediately after primary write</td>
          </tr>
          <tr>
            <td>Data safety</td>
            <td>No data loss on primary failure</td>
            <td>Potential data loss of unreplicated writes</td>
          </tr>
          <tr>
            <td>Availability</td>
            <td>Reduced — replica failure blocks writes</td>
            <td>Higher — replica failure does not block writes</td>
          </tr>
          <tr>
            <td>Common in</td>
            <td>Financial systems, critical data</td>
            <td>Most web applications, analytics</td>
          </tr>
        </tbody>
      </table>

      <h3>Replication Lag &amp; Its Consequences</h3>
      <p>
        In asynchronous replication, there is always a delay between when data is written
        to the primary and when it appears on replicas. This replication lag can cause:
      </p>
      <ul>
        <li>
          <strong>Read-after-write inconsistency:</strong> A user writes data, then
          immediately reads from a replica that hasn&apos;t received the update yet.
          Solution: route reads to the primary for a short window after writes.
        </li>
        <li>
          <strong>Monotonic read violations:</strong> A user sees newer data, then
          refreshes and sees older data because a different replica served the request.
          Solution: pin users to a specific replica (sticky sessions).
        </li>
        <li>
          <strong>Causal ordering issues:</strong> A reply to a comment appears before
          the comment itself because they were replicated at different speeds.
          Solution: use logical timestamps or version vectors.
        </li>
      </ul>

      {/* ===== Section 7: Denormalization ===== */}
      <h2>Denormalization</h2>
      <p>
        Normalization eliminates data redundancy by splitting data into multiple related
        tables. Denormalization intentionally introduces redundancy to optimize read
        performance by reducing the number of joins needed to serve a query.
      </p>

      <h3>Why Denormalize?</h3>
      <p>
        In a fully normalized schema, displaying a user&apos;s order history might require
        joining 5 tables: users, orders, order_items, products, and addresses. At scale
        with millions of rows, these joins become expensive. Denormalization pre-computes
        and stores the joined result, trading storage space and write complexity for
        dramatically faster reads.
      </p>

      <h3>Trade-offs</h3>
      <table>
        <thead>
          <tr>
            <th>Aspect</th>
            <th>Normalized</th>
            <th>Denormalized</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Read performance</td>
            <td>Slower — multiple joins</td>
            <td>Faster — single table scan</td>
          </tr>
          <tr>
            <td>Write performance</td>
            <td>Faster — update one place</td>
            <td>Slower — update many copies</td>
          </tr>
          <tr>
            <td>Data consistency</td>
            <td>Strong — single source of truth</td>
            <td>Risk of inconsistency across copies</td>
          </tr>
          <tr>
            <td>Storage</td>
            <td>Minimal — no redundancy</td>
            <td>Higher — duplicated data</td>
          </tr>
          <tr>
            <td>Schema complexity</td>
            <td>More tables, more joins</td>
            <td>Fewer tables, wider rows</td>
          </tr>
        </tbody>
      </table>

      <h3>When to Denormalize</h3>
      <ul>
        <li>Read-heavy workloads where query latency is critical</li>
        <li>Data that is read far more often than it is written</li>
        <li>Reporting and analytics dashboards</li>
        <li>Caching layers where pre-computed results are stored</li>
        <li>NoSQL databases that don&apos;t support joins natively</li>
      </ul>

      <InfoBox type="info" title="Denormalization in Interviews">
        Interviewers often expect you to start with a normalized schema and then
        selectively denormalize based on access patterns. Show that you understand the
        trade-offs: explain which queries drive the denormalization, how you&apos;ll keep
        the denormalized data consistent (e.g., background sync jobs, change data
        capture), and what happens if the source of truth and the denormalized copy
        diverge.
      </InfoBox>

      <CodeBlock
        language="sql"
        title="Denormalization Example"
        code={`-- Normalized: requires a 3-table join for order display
SELECT o.id, o.total, u.name, u.email, a.city, a.state
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN addresses a ON o.shipping_address_id = a.id
WHERE o.user_id = 42;

-- Denormalized: single table with embedded data
-- Faster reads, but user_name/user_email must be
-- updated everywhere if the user changes their profile.
CREATE TABLE order_details_denormalized (
    order_id      INT PRIMARY KEY,
    order_total   DECIMAL(10,2),
    user_id       INT,
    user_name     VARCHAR(100),
    user_email    VARCHAR(255),
    ship_city     VARCHAR(100),
    ship_state    VARCHAR(50),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Single fast query, no joins needed
SELECT * FROM order_details_denormalized
WHERE user_id = 42;`}
      />

      {/* ===== Section 8: Advanced Database Topics ===== */}
      <h2>Advanced Database Topics</h2>

      <h3>Database per Service Pattern</h3>
      <p>
        In a microservices architecture, each service owns its own database. No service
        accesses another service&apos;s database directly — all communication happens
        through APIs or events. This provides strong encapsulation and lets each service
        choose the database technology best suited to its needs (polyglot persistence).
      </p>
      <ul>
        <li><strong>Benefits:</strong> Independent scaling, independent deployment, technology freedom, fault isolation</li>
        <li><strong>Challenges:</strong> Distributed transactions, data consistency across services, more complex queries that span services</li>
        <li><strong>Patterns to manage:</strong> Saga pattern for distributed transactions, CQRS for cross-service queries, event sourcing for audit trails</li>
      </ul>

      <h3>Materialized Views</h3>
      <p>
        A materialized view is a precomputed query result stored as a physical table.
        Unlike regular views (which execute the query each time), materialized views
        cache the result and refresh periodically or on demand. They are excellent for
        expensive aggregation queries on dashboards or reporting systems.
      </p>

      <CodeBlock
        language="sql"
        title="Materialized View Example"
        code={`-- Create a materialized view for daily sales summary
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT
    DATE(order_date) AS sale_date,
    product_category,
    COUNT(*) AS total_orders,
    SUM(amount) AS total_revenue,
    AVG(amount) AS avg_order_value
FROM orders
JOIN products ON orders.product_id = products.id
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(order_date), product_category;

-- Create an index on the materialized view
CREATE INDEX idx_sales_date ON daily_sales_summary (sale_date);

-- Fast query against precomputed data
SELECT * FROM daily_sales_summary
WHERE sale_date = '2024-06-15';

-- Refresh when underlying data changes
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;`}
      />

      <h3>Time-Series Databases</h3>
      <p>
        Time-series databases (InfluxDB, TimescaleDB, QuestDB) are optimized for
        timestamped data that is written sequentially and queried by time ranges.
        Use cases include:
      </p>
      <ul>
        <li>Infrastructure monitoring (CPU, memory, network metrics)</li>
        <li>IoT sensor data (temperature, pressure, location)</li>
        <li>Financial market data (stock prices, trade volumes)</li>
        <li>Application performance monitoring (response times, error rates)</li>
      </ul>
      <p>
        These databases optimize for high write throughput, efficient time-range queries,
        and automatic data retention policies (e.g., downsample data older than 30 days,
        delete data older than 1 year).
      </p>

      <h3>Graph Databases</h3>
      <p>
        Graph databases (Neo4j, Amazon Neptune, JanusGraph) excel when relationships
        between entities are the primary concern. They store data as nodes (entities)
        and edges (relationships) and support efficient traversal queries.
      </p>
      <ul>
        <li><strong>Social networks:</strong> Friends of friends, mutual connections, influence scoring</li>
        <li><strong>Recommendation engines:</strong> Users who bought X also bought Y</li>
        <li><strong>Fraud detection:</strong> Tracing suspicious transaction chains across accounts</li>
        <li><strong>Knowledge graphs:</strong> Modeling complex domain relationships (medical, legal)</li>
      </ul>
      <p>
        A query like &quot;find all friends of friends within 3 degrees of separation&quot; that
        would require complex recursive joins in SQL is a simple, fast traversal in a
        graph database.
      </p>

      <h3>NewSQL Databases</h3>
      <p>
        NewSQL databases (CockroachDB, TiDB, Google Spanner, YugabyteDB) combine the
        horizontal scalability of NoSQL with the strong consistency and SQL interface
        of traditional relational databases. They aim to provide the best of both worlds:
      </p>
      <ul>
        <li>Full SQL support with familiar query syntax</li>
        <li>ACID transactions across distributed nodes</li>
        <li>Horizontal scaling by adding more nodes</li>
        <li>Automatic sharding and rebalancing</li>
        <li>High availability with automatic failover</li>
      </ul>
      <p>
        The trade-off is higher latency per query (due to distributed consensus
        protocols like Raft or Paxos) and operational complexity. NewSQL is ideal when
        you need SQL semantics at NoSQL scale — for example, a global e-commerce
        platform that requires both strong consistency and geographic distribution.
      </p>

      <InfoBox type="tip" title="Database Selection in System Design Interviews">
        When an interviewer asks you to design a system, walk through this decision
        framework: (1) What is the data model — relational, hierarchical, graph?
        (2) What is the read/write ratio? (3) What consistency level is required?
        (4) What scale are we targeting? (5) Are there specific query patterns —
        time-series, full-text search, traversals? Match your answers to the right
        database category and name specific technologies.
      </InfoBox>

      <InteractiveChallenge
        question={"You are designing a social media platform that needs to store user profiles, posts, and friend relationships. The system must support friend-of-friend queries, news feed generation, and real-time notifications. Which database strategy is most appropriate?"}
        options={[
          'Single PostgreSQL instance for everything',
          'MongoDB for all data with embedded documents',
          'PostgreSQL for profiles and posts, Neo4j for friend graph, Redis for caching and notifications',
          'Cassandra for all data with denormalized tables',
        ]}
        correctIndex={2}
        explanation={"Polyglot persistence is the best approach here. PostgreSQL handles structured user and post data with ACID transactions. Neo4j efficiently traverses friend relationships for friend-of-friend queries and recommendations. Redis provides low-latency caching for news feeds and pub/sub for real-time notifications. Each database is used for what it does best, rather than forcing one technology to handle all access patterns."}
      />
    </LessonLayout>
  );
}
