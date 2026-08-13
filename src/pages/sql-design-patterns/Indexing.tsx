import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Indexing() {
  return (
    <LessonLayout
      title="Indexing & Performance"
      sectionId="sql-design-patterns"
      lessonIndex={1}
      prev={{ path: '/sql-design-patterns/design', label: 'Schema Design & Normalization' }}
      next={{ path: '/sql-design-patterns/schema-patterns', label: 'Common Schema Design Patterns' }}
    >
      <p>Indexes are the difference between a query that takes 2ms and one that takes 20 seconds. Let's understand how they actually work in PostgreSQL, not just the CREATE INDEX syntax.</p>

      <h2>How Indexes Work Internally</h2>

      <p>
        Without an index, Postgres must perform a <strong>sequential scan</strong> — reading
        every single row in the table to find matches. An index is a separate data structure
        that maintains a sorted mapping from column values to row locations, enabling the
        database to jump directly to matching rows.
      </p>

      <h2>B-Tree Index Structure</h2>

      <p>Postgres's default index type is a B-tree. Understanding the structure explains why column order in composite indexes matters, and why some queries can't use an index.</p>

      <FlowChart
        title="B-Tree Index Lookup: Finding salary = 75000"
        chart={"graph TD\n  R[\"Root Node: 50000 | 100000\"] -->|\"< 50000\"| L[\"Leaf: 25000 | 35000 | 42000\"]\n  R -->|\"50000-100000\"| M[\"Leaf: 55000 | 75000 | 88000\"]\n  R -->|\"> 100000\"| H[\"Leaf: 120000 | 140000 | 180000\"]\n  M -->|\"Found!\"| V[\"Row pointer -> heap tuple\"]\n  L -.->|\"Leaf chain\"| M\n  M -.->|\"Leaf chain\"| H\n  style R fill:#2a1f44,stroke:#a78bfa\n  style M fill:#1a3329,stroke:#4ade80\n  style V fill:#1a2744,stroke:#5b9cf6"}
      />

      <InfoBox variant="info" title="B-Tree Key Properties">
        <p><strong>O(log n) lookups:</strong> A table with 1 billion rows needs only ~30 node traversals.</p>
        <p><strong>Sorted:</strong> Supports range scans (<code>WHERE salary BETWEEN 50K AND 100K</code>), ORDER BY, and MIN/MAX efficiently.</p>
        <p><strong>Leaf chain:</strong> Leaves are linked, so range scans walk the chain without revisiting the tree.</p>
        <p><strong>Left-prefix rule:</strong> A composite index on (a, b, c) supports queries on (a), (a, b), or (a, b, c) — but NOT (b) or (c) alone.</p>
      </InfoBox>

      <h2>CREATE INDEX Syntax</h2>

      <CodeBlock language="sql" title="Index Creation — All the Variations" showLineNumbers={true}>
{`-- Basic B-tree index (default type)
CREATE INDEX idx_employees_email ON employees (email);

-- Unique index — enforces uniqueness as a side effect
CREATE UNIQUE INDEX idx_employees_email_uniq ON employees (email);

-- Composite index — column order is critical
CREATE INDEX idx_orders_status_date ON orders (status, created_at);

-- Partial index — only index rows matching a condition (Postgres feature, no MySQL equivalent)
CREATE INDEX idx_active_orders ON orders (customer_id, created_at)
WHERE status = 'active';
-- Much smaller, much faster for the common query pattern

-- Expression index — index on computed values.
-- The expression MUST be IMMUTABLE. This is the classic failure:
--   CREATE INDEX idx_orders_year ON orders (EXTRACT(YEAR FROM created_at));
--   ERROR: functions in index expression must be marked IMMUTABLE
-- ...because created_at is TIMESTAMPTZ and the year depends on the session's
-- TimeZone setting, making the extract merely STABLE. Pin the zone to make it
-- immutable again:
CREATE INDEX idx_orders_year
  ON orders (EXTRACT(YEAR FROM created_at AT TIME ZONE 'UTC'));
-- Enables: WHERE EXTRACT(YEAR FROM created_at AT TIME ZONE 'UTC') = 2024
--
-- But for a whole-year filter, DON'T index the expression at all. A plain
-- B-tree on created_at answers it with a range scan, and stays useful for
-- every other time window you'll ever ask for:
CREATE INDEX idx_orders_created_at ON orders (created_at);
-- WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
-- Expression indexes earn their place when the expression is NOT rewritable
-- as a range — LOWER(), a JSONB path, a computed score.

-- Case-insensitive search index (LOWER is immutable, so this is fine)
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
-- Enables: WHERE LOWER(email) = 'alice@example.com'
-- The query must use the SAME expression, character for character, or the
-- planner will not match it to the index.

-- Concurrent index creation (doesn't lock the table)
CREATE INDEX CONCURRENTLY idx_big_table_col ON big_table (col);
-- Takes longer but doesn't block writes — essential for production`}
      </CodeBlock>

      <h2>Index Types (PostgreSQL)</h2>

      <FlowChart
        title="Choosing the Right Index Type"
        chart={"graph TD\n  Q{What kind of query?} -->|Equality, range, sorting| BT[B-tree - Default]\n  Q -->|Equality only| H[Hash Index]\n  Q -->|Full-text search, arrays, JSONB| GIN[GIN - Generalized Inverted]\n  Q -->|Geometric, range types, nearest-neighbor| GIST[GiST - Generalized Search Tree]\n  Q -->|Correlation with physical order| BRIN[BRIN - Block Range]\n  style BT fill:#1a3329,stroke:#4ade80\n  style GIN fill:#1a2744,stroke:#5b9cf6\n  style GIST fill:#2a1f44,stroke:#a78bfa\n  style H fill:#3d2f14,stroke:#d97706\n  style BRIN fill:#3d2f14,stroke:#d97706"}
      />

      <CodeBlock language="sql" title="Index Types Beyond B-tree" showLineNumbers={true}>
{`-- Hash index: equality checks only, smaller than B-tree
CREATE INDEX idx_users_hash ON users USING hash (session_token);
-- Only supports: WHERE session_token = 'abc123'
-- Does NOT support: range, sorting, or partial matches

-- GIN index: for arrays, JSONB, full-text search
CREATE INDEX idx_tags ON articles USING gin (tags);
-- Enables: WHERE tags @> ARRAY['sql', 'postgres']

CREATE INDEX idx_doc_search ON documents
USING gin (to_tsvector('english', content));
-- Enables: WHERE to_tsvector('english', content) @@ to_tsquery('english', 'indexing')
-- Pass the config explicitly on BOTH sides. The 1-arg to_tsvector(content)
-- reads default_text_search_config, which makes it STABLE — Postgres will
-- refuse to build the index on it at all.

-- GiST index: geometric data, ranges, nearest-neighbor
CREATE INDEX idx_location ON stores USING gist (coordinates);
-- Enables: ORDER BY coordinates <-> point(40.7, -74.0) LIMIT 5

-- BRIN index: huge tables where data correlates with physical order
CREATE INDEX idx_logs_ts ON event_logs USING brin (created_at);
-- Tiny index for billions of rows (time-series data)`}
      </CodeBlock>

      <h2>When to Index — And When NOT To</h2>

      <InfoBox variant="tip" title="Index These Columns">
        <p><strong>Primary keys and foreign keys:</strong> PKs are indexed automatically. FKs are NOT — Postgres never auto-indexes them, always add manually.</p>
        <p><strong>Columns in WHERE clauses:</strong> Especially high-cardinality columns (many unique values).</p>
        <p><strong>Columns in JOIN conditions:</strong> Both sides of the ON clause benefit from indexes.</p>
        <p><strong>Columns in ORDER BY:</strong> Avoids expensive in-memory sorts.</p>
        <p><strong>Columns in GROUP BY:</strong> Can enable index-based grouping instead of hash aggregation.</p>
      </InfoBox>

      <InfoBox variant="warning" title="When NOT to Index">
        <p><strong>Small tables:</strong> Once a table fits in a handful of pages, a sequential scan beats the index lookup and the planner will ignore your index anyway. The threshold is far lower than people assume — think hundreds of rows, not the ~10K figure that gets repeated. Don't guess: <code>EXPLAIN</code> tells you what the planner actually chose.</p>
        <p><strong>Low selectivity columns:</strong> A boolean column with 50/50 distribution — the index won't help.</p>
        <p><strong>Write-heavy tables:</strong> Every INSERT/UPDATE/DELETE must also update every index. Audit/log tables often shouldn't have many indexes.</p>
        <p><strong>Columns you never filter/join/sort on:</strong> Sounds obvious, but audit your existing indexes — dead indexes waste write performance.</p>
      </InfoBox>

      <h2>Composite Index Strategy</h2>

      <CodeBlock language="sql" title="Composite Index Column Order Matters" showLineNumbers={true}>
{`-- Given this query pattern:
SELECT * FROM orders
WHERE status = 'shipped'
  AND customer_id = 12345
  AND created_at > '2024-01-01';

-- GOOD: equality columns first, range column last
CREATE INDEX idx_orders_lookup
  ON orders (status, customer_id, created_at);

-- BAD: range column in the middle breaks the rest
CREATE INDEX idx_orders_bad
  ON orders (status, created_at, customer_id);
-- customer_id can't use the index after a range scan on created_at`}
      </CodeBlock>

      <h2>Covering Indexes</h2>

      <p>
        A <strong>covering index</strong> includes all columns the query needs. Postgres
        can satisfy the entire query from the index alone — it never touches the heap table.
        This is called an <strong>index-only scan</strong> and is the fastest possible access pattern.
      </p>

      <CodeBlock language="sql" title="Covering Index — Index-Only Scan" showLineNumbers={true}>
{`-- The query only needs: status, customer_id, created_at, total
-- INCLUDE adds columns to the leaf pages without affecting sort order
CREATE INDEX idx_orders_covering
  ON orders (status, customer_id, created_at)
  INCLUDE (total, shipping_address);

-- Now this query never reads the heap table:
SELECT customer_id, created_at, total
FROM orders
WHERE status = 'shipped' AND customer_id = 12345;
-- EXPLAIN will show: "Index Only Scan"`}
      </CodeBlock>

      <h2>Reading EXPLAIN ANALYZE</h2>

      <CodeBlock language="sql" title="EXPLAIN ANALYZE: What to Look For" showLineNumbers={true}>
{`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders
WHERE customer_id = 12345 AND status = 'shipped';

-- Key things in the output:
--
-- Seq Scan on orders    <- FULL TABLE SCAN (usually bad for large tables)
--   Filter: ...         <- filtering happened AFTER reading rows (wasteful)
--   Rows Removed: 9999  <- 9999 rows read but discarded
--
-- Index Scan using idx_orders_customer on orders  <- GOOD
--   Index Cond: (customer_id = 12345)             <- filter pushed to index
--   Buffers: shared hit=4                         <- only 4 pages read
--
-- Bitmap Index Scan     <- index builds a bitmap, then heap fetches matching rows
--                          Good for medium selectivity (1-20% of table)
--
-- Index Only Scan       <- BEST: all data from index, no heap access
--   Heap Fetches: 0     <- confirms no heap reads needed`}
      </CodeBlock>

      <InfoBox variant="tip" title="Reading EXPLAIN Output Tips">
        <p><strong>Actual vs estimated rows:</strong> If <code>rows=1000</code> but <code>actual rows=500000</code>, your statistics are stale. Run <code>ANALYZE tablename;</code>.</p>
        <p><strong>Buffers shared hit vs read:</strong> Hits come from cache (fast), reads come from disk (slow). High read counts mean your working set exceeds available memory.</p>
        <p><strong>Sort Method: external merge:</strong> The sort spilled to disk — add more <code>work_mem</code> or an index to avoid sorting.</p>
      </InfoBox>

      <h2>Index Maintenance & Bloat</h2>

      <CodeBlock language="sql" title="Index Health Monitoring" showLineNumbers={true}>
{`-- Find indexes that haven't been used since the last stats reset.
-- NOTE the column names: pg_stat_user_indexes exposes relname/indexrelname,
-- NOT tablename/indexname. (Those belong to the pg_indexes VIEW — mixing the
-- two up is the usual reason this query errors with "column does not exist".)
SELECT
  schemaname,
  relname      AS table_name,
  indexrelname AS index_name,
  idx_scan     AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid NOT IN (
    SELECT conindid FROM pg_constraint WHERE conindid <> 0  -- skip unique/pk
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- Biggest indexes by size, with their usage — read the two together.
-- (This is size + traffic, NOT a bloat measurement: Postgres core has no
-- cheap exact bloat figure. For real bloat estimates use the pgstattuple
-- extension — pgstatindex('idx_name') reports avg_leaf_density — or one of
-- the well-known bloat-estimate queries.)
SELECT
  schemaname,
  relname      AS table_name,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan     AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Rebuild a bloated index without locking
REINDEX INDEX CONCURRENTLY idx_orders_lookup;

-- Check if your query uses the index you expect
EXPLAIN (ANALYZE, COSTS OFF)
SELECT * FROM orders WHERE customer_id = 42;`}
      </CodeBlock>

      <InfoBox variant="warning" title="Index Bloat">
        <p>
          Frequent UPDATEs and DELETEs leave dead entries in indexes because Postgres's MVCC model
          never overwrites rows in place. Over time, an index can become 2-10x larger than
          necessary. Symptoms: degraded query performance, excessive disk usage. Fix with{' '}
          <code>REINDEX CONCURRENTLY</code> or <code>pg_repack</code>. Prevention: tune{' '}
          <code>autovacuum</code> settings on write-heavy tables.
        </p>
      </InfoBox>

      <h2>Finding the Slow Queries in the First Place</h2>
      <p>
        Everything above assumes you already know <em>which</em> query to fix. In production you
        usually don&apos;t. <code>pg_stat_statements</code> is the extension that answers it — it
        aggregates every executed statement by normalised shape, so you can rank by total time
        rather than guessing from anecdotes.
      </p>

      <CodeBlock language="sql" title="pg_stat_statements — the first thing to enable" showLineNumbers={true}>
{`-- One-time setup. Requires a restart because it needs shared memory:
--   postgresql.conf: shared_preload_libraries = 'pg_stat_statements'
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- The query that matters: biggest total time consumers.
-- Sort by total_exec_time, NOT mean_exec_time — a 5ms query run
-- 10 million times hurts far more than a 2s report run twice a day.
SELECT
  calls,
  round(total_exec_time::numeric, 1)          AS total_ms,
  round(mean_exec_time::numeric, 2)           AS mean_ms,
  round(stddev_exec_time::numeric, 2)         AS stddev_ms,
  rows,
  query
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 20;

-- Cache hit ratio per statement: low ratio => going to disk.
SELECT
  round(100.0 * shared_blks_hit
        / nullif(shared_blks_hit + shared_blks_read, 0), 1) AS cache_hit_pct,
  calls, query
FROM pg_stat_statements
ORDER BY shared_blks_read DESC
LIMIT 10;

-- Reset the counters after a deploy so you measure the new code.
SELECT pg_stat_statements_reset();

-- Currently running queries, longest first — for "the site is down NOW".
SELECT pid, now() - query_start AS duration, state, wait_event_type, query
FROM pg_stat_activity
WHERE state <> 'idle' AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- Cancel politely; terminate only if that fails.
SELECT pg_cancel_backend(12345);
SELECT pg_terminate_backend(12345);`}
      </CodeBlock>

      <InfoBox variant="tip" title="High stddev is the signal people miss">
        <p>
          A query with a 5 ms mean and a 900 ms standard deviation is not a healthy query — it is
          two different queries wearing the same shape, usually because one parameter value hits a
          selective index and another triggers a sequential scan. Mean latency hides this
          completely; that is why the query above selects <code>stddev_exec_time</code> alongside
          the mean. Chase the outliers, not the average.
        </p>
      </InfoBox>

      <h2>Timeouts — The Safety Net Around DDL</h2>
      <p>
        <code>CREATE INDEX CONCURRENTLY</code> avoids holding a write lock, but plenty of other
        migrations still need a brief <code>ACCESS EXCLUSIVE</code> lock. The danger is not the
        lock itself — it is that acquiring it <em>queues behind</em> a long-running transaction,
        and every subsequent query then queues behind <em>you</em>. A migration that should take
        1 ms takes the site down for 10 minutes. Timeouts are the fix.
      </p>

      <CodeBlock language="sql" title="Making migrations fail instead of taking the site down" showLineNumbers={true}>
{`-- Wait at most 3s to ACQUIRE a lock, then give up and error.
-- Retrying a failed migration is cheap; a lock queue outage is not.
SET lock_timeout = '3s';

-- Cap how long the statement itself may run.
SET statement_timeout = '30s';

ALTER TABLE orders ADD COLUMN notes text;   -- fast: no table rewrite

-- Sensible permanent defaults, set per role rather than globally:
ALTER ROLE app_web  SET statement_timeout = '15s';   -- web requests
ALTER ROLE migrator SET lock_timeout      = '3s';    -- schema changes
-- Leave batch/analytics roles with a longer or zero timeout.

-- Kill abandoned open transactions that block VACUUM and hold locks.
ALTER ROLE app_web SET idle_in_transaction_session_timeout = '30s';

-- CONCURRENTLY cannot run inside a transaction block, and on failure
-- leaves an INVALID index behind that you must drop before retrying:
SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
DROP INDEX CONCURRENTLY idx_orders_lookup;`}
      </CodeBlock>

      <InfoBox variant="danger" title="statement_timeout does not cover lock waiting the way you'd expect">
        <p>
          These are two different clocks. <code>lock_timeout</code> bounds how long you wait{' '}
          <em>to acquire</em> a lock; <code>statement_timeout</code> bounds total statement
          execution. Set only <code>statement_timeout</code> and a migration can still sit in the
          lock queue blocking every reader behind it for the whole timeout window. For DDL, set{' '}
          <code>lock_timeout</code> low and aggressively — failing fast and retrying is almost
          always the right behaviour.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="You have a composite index on (a, b, c). Which WHERE clause can fully utilize this index?"
        options={[
          'WHERE b = 1 AND c = 2',
          'WHERE a = 1 AND c = 2',
          'WHERE c = 1 AND b = 2 AND a = 3',
          'WHERE b = 1',
        ]}
        correctIndex={2}
        explanation="The optimizer can reorder equality conditions, so WHERE c=1 AND b=2 AND a=3 is equivalent to WHERE a=3 AND b=2 AND c=1, which matches the full index prefix. Option B only uses column 'a' from the index (skips b). Options A and D can't use the index at all because they don't include the leftmost column 'a'."
        language="sql"
      />

      <h2>Index Strategy Cheat Sheet</h2>

      <CodeBlock language="sql" title="Common Index Patterns" showLineNumbers={true}>
{`-- 1. Foreign key indexes (NOT automatic in PostgreSQL!)
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);

-- 2. Partial index for common queries on status
CREATE INDEX idx_orders_pending ON orders (created_at)
WHERE status = 'pending';
-- Tiny index, only for the rows you actually query

-- 3. Multi-column index for a dashboard query
-- SELECT * FROM orders WHERE customer_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX idx_orders_cust_status_date ON orders (customer_id, status, created_at DESC);

-- 4. Covering index to avoid heap access
CREATE INDEX idx_products_category ON products (category_id)
INCLUDE (name, price);
-- Index-only scan for: SELECT name, price FROM products WHERE category_id = 5

-- 5. Conditional unique index
CREATE UNIQUE INDEX idx_users_active_email ON users (email)
WHERE is_deleted = FALSE;
-- Allows duplicate emails for deleted users, unique for active ones`}
      </CodeBlock>

      <InfoBox variant="tip" title="Index Naming Convention">
        <p>
          Use a consistent naming pattern: <code>idx_tablename_column1_column2</code>.
          For partial indexes add the condition: <code>idx_orders_pending_date</code>.
          This makes it easy to identify what each index does when reviewing EXPLAIN output
          or monitoring unused indexes.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"Your EXPLAIN output shows: Seq Scan on orders, Filter: customer_id = 42, Rows Removed by Filter: 999,958. What does this tell you?"}
        options={[
          'The query is optimally using an index',
          'The table has no index on customer_id — add one',
          'The index exists but the table is too small to use it',
          'The query returned 999,958 rows',
        ]}
        correctIndex={1}
        explanation="A Seq Scan with a Filter and nearly a million Rows Removed means the database read the entire table and discarded most rows. This is a textbook case for adding an index on customer_id. The query is doing far more I/O than necessary."
        language="sql"
      />

      <InteractiveChallenge
        question={"Which PostgreSQL index type would you use for full-text search on a document content column?"}
        options={[
          'B-tree',
          'Hash',
          'GIN',
          'BRIN',
        ]}
        correctIndex={2}
        explanation="GIN (Generalized Inverted Index) is designed for full-text search, arrays, and JSONB. It creates an inverted index mapping each word/token to the rows that contain it. B-tree can't efficiently search within text content, Hash only supports equality, and BRIN is for physically ordered data."
        language="sql"
      />
    </LessonLayout>
  );
}
