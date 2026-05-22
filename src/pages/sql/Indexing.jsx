import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Indexing() {
  return (
    <LessonLayout
      title="Indexing & Performance"
      sectionId="sql"
      lessonIndex={3}
      prev={{ path: '/sql/window', label: 'Window Functions' }}
      next={{ path: '/sql/design', label: 'Schema Design & Normalization' }}
    >
      <p>Indexes are the difference between a query that takes 2ms and one that takes 20 seconds. Let's understand how they actually work, not just the CREATE INDEX syntax.</p>

      <h2>How Indexes Work Internally</h2>

      <p>
        Without an index, the database must perform a <strong>sequential scan</strong> — reading
        every single row in the table to find matches. An index is a separate data structure
        that maintains a sorted mapping from column values to row locations, enabling the
        database to jump directly to matching rows.
      </p>

      <h2>B-Tree Index Structure</h2>

      <p>Most database indexes are B-trees (or B+ trees). Understanding the structure explains why column order in composite indexes matters, and why some queries can't use an index.</p>

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

-- Partial index — only index rows matching a condition
CREATE INDEX idx_active_orders ON orders (customer_id, created_at)
WHERE status = 'active';
-- Much smaller, much faster for the common query pattern

-- Expression index — index on computed values
CREATE INDEX idx_orders_year ON orders (EXTRACT(YEAR FROM created_at));
-- Enables: WHERE EXTRACT(YEAR FROM created_at) = 2024

-- Case-insensitive search index
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
-- Enables: WHERE LOWER(email) = 'alice@example.com'

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
-- Enables: WHERE to_tsvector('english', content) @@ to_tsquery('indexing')

-- GiST index: geometric data, ranges, nearest-neighbor
CREATE INDEX idx_location ON stores USING gist (coordinates);
-- Enables: ORDER BY coordinates <-> point(40.7, -74.0) LIMIT 5

-- BRIN index: huge tables where data correlates with physical order
CREATE INDEX idx_logs_ts ON event_logs USING brin (created_at);
-- Tiny index for billions of rows (time-series data)`}
      </CodeBlock>

      <h2>When to Index — And When NOT To</h2>

      <InfoBox variant="tip" title="Index These Columns">
        <p><strong>Primary keys and foreign keys:</strong> PKs are indexed automatically. FKs are NOT — always add them manually.</p>
        <p><strong>Columns in WHERE clauses:</strong> Especially high-cardinality columns (many unique values).</p>
        <p><strong>Columns in JOIN conditions:</strong> Both sides of the ON clause benefit from indexes.</p>
        <p><strong>Columns in ORDER BY:</strong> Avoids expensive in-memory sorts.</p>
        <p><strong>Columns in GROUP BY:</strong> Can enable index-based grouping instead of hash aggregation.</p>
      </InfoBox>

      <InfoBox variant="warning" title="When NOT to Index">
        <p><strong>Small tables:</strong> Sequential scan is faster than index overhead for tables under ~10K rows.</p>
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
        A <strong>covering index</strong> includes all columns the query needs. The database
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
{`-- Find indexes that haven't been used since last stats reset
SELECT
  schemaname, tablename, indexname,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid NOT IN (
    SELECT conindid FROM pg_constraint  -- skip unique/pk constraints
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check index bloat (ratio of dead tuples)
SELECT
  schemaname, tablename, indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan AS scans,
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
          Frequent UPDATEs and DELETEs leave dead entries in indexes. Over time, an index can
          become 2-10x larger than necessary. Symptoms: degraded query performance, excessive
          disk usage. Fix with <code>REINDEX CONCURRENTLY</code> or <code>pg_repack</code>.
          Prevention: tune <code>autovacuum</code> settings on write-heavy tables.
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
