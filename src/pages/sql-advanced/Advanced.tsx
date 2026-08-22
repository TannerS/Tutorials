import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Advanced() {
  return (
    <LessonLayout
      title="Advanced SQL Patterns"
      sectionId="sql-advanced"
      lessonIndex={3}
      prev={{ path: '/sql-advanced/stored-procedures', label: 'Stored Procedures' }}
      next={null}
    >
      <p>This is the grab bag of power techniques — patterns you reach for when standard queries hit a wall. Pivoting, JSON, LATERAL joins, upserts, full-text search, partitioning, and materialized views, all PostgreSQL-flavored.</p>

      <h2>Pivot & Unpivot</h2>

      <CodeBlock language="sql" title="Dynamic-Style Pivoting with FILTER / CASE" showLineNumbers={true}>
{`-- Pivot: rows to columns (cross-tab report)
-- "Revenue by product category per quarter"
SELECT
  EXTRACT(QUARTER FROM ordered_at) AS quarter,
  SUM(total) FILTER (WHERE category = 'Electronics') AS electronics,
  SUM(total) FILTER (WHERE category = 'Clothing') AS clothing,
  SUM(total) FILTER (WHERE category = 'Food') AS food,
  SUM(total) AS grand_total
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE ordered_at >= '2024-01-01'
GROUP BY 1
ORDER BY 1;

-- Unpivot: columns to rows (PostgreSQL VALUES + LATERAL)
SELECT order_id, metric_name, metric_value
FROM orders,
LATERAL (
  VALUES
    ('subtotal', subtotal),
    ('tax', tax_amount),
    ('shipping', shipping_cost),
    ('discount', discount_amount),
    ('total', total)
) AS metrics(metric_name, metric_value)
WHERE metric_value > 0;`}
      </CodeBlock>

      <h2>LATERAL Joins</h2>

      <FlowChart
        title="LATERAL JOIN: Correlated Subquery in FROM"
        chart={"graph LR\n  A[\"Outer row\"] --> B[\"LATERAL subquery\\ncan reference\\nouter columns\"]\n  B --> C[\"Joined result\"]\n  A2[\"Next outer row\"] --> B2[\"Re-evaluated\\nfor each row\"]\n  B2 --> C2[\"Joined result\"]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style B fill:#2a1f44,stroke:#a78bfa\n  style C fill:#1a3329,stroke:#4ade80\n  style A2 fill:#1a2744,stroke:#5b9cf6\n  style B2 fill:#2a1f44,stroke:#a78bfa\n  style C2 fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="sql" title="LATERAL JOIN Patterns" showLineNumbers={true}>
{`-- Top-N per group without window functions
-- "Last 3 orders per customer"
SELECT c.id, c.name, recent.*
FROM customers c
CROSS JOIN LATERAL (
  SELECT order_id, total, ordered_at
  FROM orders o
  WHERE o.customer_id = c.id    -- references outer table!
  ORDER BY ordered_at DESC
  LIMIT 3
) recent;

-- Dependent data generation
-- "For each user, compute their stats"
SELECT u.id, u.name, stats.*
FROM users u
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS order_count,
    COALESCE(SUM(total), 0) AS lifetime_value,
    MAX(ordered_at) AS last_order,
    CURRENT_DATE - MAX(ordered_at)::date AS days_since_last
  FROM orders
  WHERE user_id = u.id
) stats ON TRUE;  -- ON TRUE because LATERAL provides the correlation`}
      </CodeBlock>

      <InfoBox variant="tip" title="LATERAL vs Correlated Subquery">
        <p>
          LATERAL JOIN is to FROM what a correlated subquery is to SELECT/WHERE — but far more
          powerful because it can return multiple columns and multiple rows. The Postgres planner
          can often execute it more efficiently than the equivalent correlated subquery approach,
          especially when combined with an index that supports the inner ORDER BY + LIMIT.
        </p>
      </InfoBox>

      <h2>MERGE / Upsert</h2>

      <CodeBlock language="sql" title="Upsert Patterns Across Databases" showLineNumbers={true}>
{`-- PostgreSQL: INSERT ... ON CONFLICT (upsert)
INSERT INTO product_inventory (product_id, warehouse_id, quantity)
VALUES (42, 1, 100)
ON CONFLICT (product_id, warehouse_id)
DO UPDATE SET
  quantity = product_inventory.quantity + EXCLUDED.quantity,
  updated_at = NOW();

-- SQL Standard MERGE (PostgreSQL 15+)
MERGE INTO target_table t
USING source_table s ON t.id = s.id
WHEN MATCHED AND s.deleted = TRUE THEN
  DELETE
WHEN MATCHED THEN
  UPDATE SET                  -- target columns are NOT alias-qualified here:
    name = s.name,            --   "SET t.name = ..." is a syntax error
    price = s.price,
    updated_at = NOW()
WHEN NOT MATCHED THEN
  INSERT (id, name, price, created_at)
  VALUES (s.id, s.name, s.price, NOW());
-- WHEN clauses are evaluated top-down and the FIRST match wins, so the
-- narrow "MATCHED AND deleted" branch must come before the catch-all MATCHED.

-- Bulk upsert from staging table
INSERT INTO products (id, name, price, updated_at)
SELECT id, name, price, NOW()
FROM staging_products
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  updated_at = NOW()
WHERE products.price <> EXCLUDED.price  -- only update if changed
   OR products.name <> EXCLUDED.name;`}
      </CodeBlock>

      <InfoBox variant="tip" title="ON CONFLICT vs MERGE">
        <p>
          <code>ON CONFLICT</code> predates <code>MERGE</code> in Postgres (available since 9.5 vs
          15) and is still the better tool for a simple upsert on a single unique constraint — it's
          more concise. Reach for <code>MERGE</code> when you need conditional branching across
          multiple WHEN clauses (delete on one condition, update on another, insert otherwise) in a
          single statement, typically when syncing from a staging/source table.
        </p>
      </InfoBox>

      <h2>JSON Operations</h2>

      <CodeBlock language="sql" title="JSON Querying and Manipulation (PostgreSQL)" showLineNumbers={true}>
{`-- Store and query semi-structured data
CREATE TABLE events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,       -- always prefer JSONB over JSON: binary, indexable, faster
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast JSON lookups
CREATE INDEX idx_events_payload ON events USING GIN (payload);
CREATE INDEX idx_events_user ON events ((payload->>'user_id'));

-- Query JSON fields
SELECT
  payload->>'user_id' AS user_id,          -- ->> extracts as text
  payload->'metadata'->>'browser' AS browser,  -- -> extracts as jsonb, then ->> as text
  (payload->>'duration')::int AS duration_ms
FROM events
WHERE event_type = 'page_view'
  AND payload @> '{"page": "/checkout"}'  -- containment operator (uses GIN index)
  AND (payload->>'duration')::int > 5000;

-- jsonb_path_query / @? for JSONPath-style querying (Postgres 12+; the
-- SQL-standard JSON_EXISTS below does the same job on 17+)
SELECT * FROM events
WHERE payload @? '$.items[*] ? (@.price > 100)';

-- Aggregate JSON into arrays/objects
SELECT
  payload->>'user_id' AS user_id,
  JSONB_AGG(event_type ORDER BY created_at) AS event_sequence
FROM events
GROUP BY payload->>'user_id';

-- Careful: aggregates CANNOT be nested. This is a syntax error, not slow SQL:
--   JSONB_OBJECT_AGG(event_type, COUNT(*))
--   ERROR: aggregate function calls cannot be nested
-- Aggregate once in a subquery, then aggregate the result:
SELECT user_id, JSONB_OBJECT_AGG(event_type, n) AS event_counts
FROM (
  SELECT payload->>'user_id' AS user_id, event_type, COUNT(*) AS n
  FROM events
  GROUP BY 1, 2
) per_type
GROUP BY user_id;

-- Update a nested JSONB field in place without replacing the whole document
UPDATE events
SET payload = jsonb_set(payload, '{metadata,verified}', 'true')
WHERE id = 501;`}
      </CodeBlock>

      <InfoBox variant="warning" title="JSON vs JSONB">
        <p>
          <code>JSON</code> stores an exact text copy and re-parses it on every read — it preserves
          key order and duplicate keys but is otherwise strictly worse for querying.{' '}
          <code>JSONB</code> stores a decomposed binary format: faster to query, supports
          indexing (GIN), but doesn't preserve key order or whitespace. Default to{' '}
          <code>JSONB</code> unless you specifically need to preserve the original document byte-for-byte.
        </p>
      </InfoBox>

      <p>
        Everything above is Postgres&apos;s own JSON dialect, and it works on every version from 12
        onward. <strong>PostgreSQL 17 added the SQL-standard SQL/JSON functions</strong> —{' '}
        <code>JSON_TABLE</code>, <code>JSON_VALUE</code>, <code>JSON_QUERY</code> and{' '}
        <code>JSON_EXISTS</code>. They are not a rename of the operators; <code>JSON_TABLE</code> in
        particular does the one thing the arrow operators genuinely cannot, which is turn a nested
        array into ordinary rows and columns in a single expression:
      </p>

      <CodeBlock language="sql" title="SQL/JSON functions — PostgreSQL 17+ (verified on 18.6)" showLineNumbers={true}>
{`-- JSON_TABLE: shred a nested array into real, typed rows. This is now the
-- recommended way to go from one JSONB document to N relational rows.
SELECT e.id, jt.*
FROM events e,
     JSON_TABLE(e.payload, '$.items[*]'
       COLUMNS (
         idx   FOR ORDINALITY,          -- 1-based position within the array
         sku   text    PATH '$.sku',
         price numeric PATH '$.price',
         qty   int     PATH '$.qty'
       )) AS jt;
--  id | idx | sku | price | qty
-- ----+-----+-----+-------+-----
--   1 |   1 | A1  |   150 |   1
--   1 |   2 | B2  |    40 |   3
--   2 |   1 | C3  |   900 |   2

-- JSON_VALUE: one scalar, RETURNING a real type. Replaces the
-- (payload->>'user_id')::int cast-every-time pattern used above.
SELECT id, JSON_VALUE(payload, '$.user_id' RETURNING int) AS user_id FROM events;

-- ...and unlike a cast, it can be told what to do with bad data instead of
-- aborting the whole query:
SELECT JSON_VALUE('{"a":"notanumber"}'::jsonb, '$.a' RETURNING int DEFAULT -1 ON ERROR);
-- -> -1   (a plain ::int cast here raises 22P02 and kills the statement)

-- JSON_QUERY: extract a whole sub-document rather than a scalar
SELECT id, JSON_QUERY(payload, '$.items[0]') AS first_item FROM events;

-- JSON_EXISTS: the standard spelling of the @? operator
SELECT id, JSON_EXISTS(payload, '$.items[*] ? (@.price > 100)') AS has_big_item
FROM events;`}
      </CodeBlock>

      <InfoBox variant="warning" title="These are PG17+ only — check before you use them">
        <p>
          On PostgreSQL 16 and older every one of these is a{' '}
          <strong>syntax error</strong>, not a missing-function error (verified on 16.15:{' '}
          <code>ERROR: syntax error at or near &quot;RETURNING&quot;</code>), because the parser
          itself doesn&apos;t know the grammar. If you target 16, keep using{' '}
          <code>jsonb_array_elements()</code>/<code>jsonb_to_recordset()</code> for shredding and{' '}
          <code>-&gt;&gt;</code> plus a cast for scalars. The arrow and containment operators are not
          deprecated by any of this — <code>@&gt;</code> is still what a GIN index accelerates, and{' '}
          <code>-&gt;&gt;</code> is still the shortest way to pull one text field.
        </p>
      </InfoBox>

      <h2>Full-Text Search Basics</h2>

      <p>
        Postgres has a real full-text search engine built in — no need to reach for
        Elasticsearch for moderate-scale text search. It's built on two types:{' '}
        <code>tsvector</code> (a searchable, normalized document) and <code>tsquery</code> (a
        parsed search query), matched with the <code>@@</code> operator.
      </p>

      <CodeBlock language="sql" title="tsvector, tsquery, and Ranking" showLineNumbers={true}>
{`CREATE TABLE articles (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  search_vector TSVECTOR          -- precomputed, indexed search document
);

-- to_tsvector normalizes text: lowercases, strips stop words, stems ('running' -> 'run')
UPDATE articles
SET search_vector =
  setweight(to_tsvector('english', title), 'A') ||   -- title matches rank higher
  setweight(to_tsvector('english', body), 'B');

CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);

-- Keeping search_vector in sync on every write is mandatory — a stale vector
-- means the row silently stops matching. The built-in trigger does that:
CREATE TRIGGER trg_articles_tsvector
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, body);
-- BUT NOTE WHAT IT THROWS AWAY: tsvector_update_trigger just concatenates
-- to_tsvector() over the listed columns. It has no way to express setweight(),
-- so the very first UPDATE overwrites the weighted vector built above with an
-- UNWEIGHTED one — and ts_rank silently stops ranking title matches higher.
-- If you want weights, the trigger must be hand-written plpgsql, or (better)
-- use a generated column instead — see below.

-- Query: match "database" AND "index", either order, with stemming
SELECT id, title, ts_rank(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'database & index') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 10;

-- Natural-language style query parsing (handles "quoted phrases" and -exclusions)
SELECT id, title
FROM articles
WHERE search_vector @@ websearch_to_tsquery('english', '"query planning" -mysql');

-- Highlight matched terms in results
SELECT id, ts_headline('english', body, to_tsquery('english', 'index'))
FROM articles
WHERE search_vector @@ to_tsquery('english', 'index');`}
      </CodeBlock>

      <InfoBox variant="tip" title="Generated Columns Replace the Trigger — and Do More Than It Can">
        <p>
          Postgres 12+ generated columns keep the vector in sync with no trigger code at all,{' '}
          <em>and</em> they can carry the weighting that <code>tsvector_update_trigger</code>{' '}
          cannot — because <code>setweight</code>, <code>||</code> and the two-argument{' '}
          <code>to_tsvector(regconfig, text)</code> are all IMMUTABLE, which is exactly the
          requirement a generated column imposes. This is the version to reach for:
        </p>
        <p>
          <code>
            search_vector tsvector GENERATED ALWAYS AS ( setweight(to_tsvector('english',
            coalesce(title,'')), 'A') || setweight(to_tsvector('english', coalesce(body,'')), 'B')
            ) STORED
          </code>
        </p>
        <p>
          Two requirements that trip people up. The <code>coalesce()</code> calls are not optional
          padding — <code>||</code> propagates NULL, so one NULL <code>body</code> would blank the
          entire search vector for that row. And the language configuration must be a{' '}
          <strong>literal</strong>: the one-argument <code>to_tsvector(body)</code> reads the{' '}
          <code>default_text_search_config</code> GUC, which makes it merely STABLE, and Postgres
          rejects non-IMMUTABLE expressions in a generated column.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="When Full-Text Search Isn't Enough">
        <p>
          Postgres full-text search is genuinely good for tens of millions of rows with moderate
          query complexity — ranking, stemming, phrase search, and highlighting all work well. Reach
          for a dedicated search engine (Elasticsearch, Typesense, Meilisearch) when you need
          typo-tolerant fuzzy matching at scale, faceted search UIs, or search relevance tuning
          beyond what <code>ts_rank</code> offers. Don't reach for it by default — it's extra
          infrastructure to run and keep in sync.
        </p>
      </InfoBox>

      <h2>Table Partitioning</h2>

      <p>
        Partitioning splits one logical table into many physical pieces, transparent to queries.
        The classic use case: a huge, ever-growing table (events, logs, orders) where old data is
        queried rarely and can be dropped or archived in bulk.
      </p>

      <FlowChart
        title="Partitioned Table: Logical View vs Physical Storage"
        chart={"graph TD\n  P[\"orders (partitioned table)\\nqueries hit this\"] --> Q1[\"orders_2024_01\"]\n  P --> Q2[\"orders_2024_02\"]\n  P --> Q3[\"orders_2024_03\"]\n  P -.->|\"pruned if query\\ndoesn't need it\"| Q4[\"orders_2023_12\"]\n  style P fill:#1a2744,stroke:#5b9cf6\n  style Q1 fill:#1a3329,stroke:#4ade80\n  style Q2 fill:#1a3329,stroke:#4ade80\n  style Q3 fill:#1a3329,stroke:#4ade80\n  style Q4 fill:#3d2f14,stroke:#d97706"}
      />

      <CodeBlock language="sql" title="Range Partitioning by Date" showLineNumbers={true}>
{`-- The parent table declares the partition key but holds no rows itself
CREATE TABLE orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  customer_id INT NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, created_at)      -- partition key must be part of any unique constraint
) PARTITION BY RANGE (created_at);

-- Each partition is a real table Postgres routes rows into automatically
CREATE TABLE orders_2024_01 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE orders_2024_02 PARTITION OF orders
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- A DEFAULT partition catches anything that doesn't match another partition
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Queries with a filter on the partition key only scan relevant partitions
-- (this is "partition pruning" — check EXPLAIN to confirm it's happening)
EXPLAIN SELECT * FROM orders WHERE created_at >= '2024-02-01' AND created_at < '2024-02-15';
-- Should show: Seq Scan on orders_2024_02 only, other partitions pruned entirely

-- Dropping old data is instant — no DELETE, no VACUUM cleanup of billions of dead tuples
DROP TABLE orders_2023_11;  -- vs. DELETE FROM orders WHERE created_at < ... (slow, bloats indexes)`}
      </CodeBlock>

      <CodeBlock language="sql" title="List and Hash Partitioning" showLineNumbers={true}>
{`-- LIST partitioning: discrete known values (e.g. region, tenant tier)
CREATE TABLE customers (
  id INT NOT NULL,
  region VARCHAR(10) NOT NULL,
  name VARCHAR(200) NOT NULL
) PARTITION BY LIST (region);

CREATE TABLE customers_us PARTITION OF customers FOR VALUES IN ('US', 'CA');
CREATE TABLE customers_eu PARTITION OF customers FOR VALUES IN ('DE', 'FR', 'UK');

-- HASH partitioning: even distribution with no natural range/list key
-- Useful purely for spreading write load / parallelizing maintenance, not for pruning
CREATE TABLE sessions (
  id UUID NOT NULL,
  user_id INT NOT NULL,
  data JSONB
) PARTITION BY HASH (user_id);

CREATE TABLE sessions_p0 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_p1 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE sessions_p2 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE sessions_p3 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 3);`}
      </CodeBlock>

      <InfoBox variant="danger" title="Partitioning Gotchas">
        <p><strong>The partition key must be part of every unique/primary key.</strong> You can't have a global PRIMARY KEY(id) independent of the partition key — Postgres can't enforce uniqueness across partitions without it.</p>
        <p><strong>Foreign keys:</strong> a partitioned table can reference other tables, and (since PG 12) other tables can reference a partitioned table. The constraint is upstream of that: the referenced unique key must include the partition key, so you often cannot point an FK at the natural <code>id</code> alone.</p>
        <p><strong>Too many partitions hurts planning time.</strong> Thousands of partitions can slow down query planning itself. Hundreds is usually fine; low thousands needs care.</p>
        <p><strong>A DEFAULT partition is a trade, not a freebie.</strong> Without one, an insert that matches no partition errors outright. With one, that insert silently lands in the catch-all — and attaching a <em>new</em> partition afterwards must scan the entire default partition (holding a lock) to prove no row belongs in the new range. For a date-ranged table where you pre-create partitions on a schedule, letting the insert fail loudly is often the better signal. Note <code>HASH</code> partitioning has no DEFAULT partition at all — the modulus covers every value by construction.</p>
      </InfoBox>

      <InfoBox variant="tip" title="When to Partition">
        <p>
          Partitioning pays off once a table is large enough that maintenance (VACUUM, index
          rebuilds, bulk deletes) becomes painful on the whole table — commonly cited as tens of
          millions of rows and up, though it depends heavily on row size and access patterns. Below
          that, a good index usually beats the added complexity. The most common trigger is "we need
          to bulk-delete old data regularly" — <code>DROP TABLE</code> on an old partition is
          instant; <code>DELETE FROM ... WHERE</code> on a giant table is not.
        </p>
      </InfoBox>

      <h2>Materialized Views</h2>

      <CodeBlock language="sql" title="Materialized Views for Expensive Aggregations" showLineNumbers={true}>
{`-- Pre-compute an expensive dashboard query
CREATE MATERIALIZED VIEW mv_daily_metrics AS
SELECT
  DATE_TRUNC('day', ordered_at) AS day,
  COUNT(*) AS order_count,
  SUM(total) AS revenue,
  COUNT(DISTINCT customer_id) AS unique_customers,
  AVG(total) AS avg_order_value
FROM orders
GROUP BY 1
WITH DATA;  -- populate immediately

-- Index the materialized view like any table
CREATE UNIQUE INDEX idx_mv_daily_day ON mv_daily_metrics (day);

-- Refresh (full rebuild — blocks reads during refresh)
REFRESH MATERIALIZED VIEW mv_daily_metrics;

-- Concurrent refresh (doesn't block reads, requires a unique index)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_metrics;

-- Use it like a regular table
SELECT day, revenue, unique_customers
FROM mv_daily_metrics
WHERE day >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY day;`}
      </CodeBlock>

      <InfoBox variant="warning" title="Materialized View Staleness">
        <p>
          Materialized views are not auto-refreshed. You must refresh them manually or via a cron/scheduler.
          For near-real-time needs, consider: (1) <code>pg_cron</code> for periodic refresh, (2) trigger-based
          incremental updates, or (3) a dedicated analytics engine like ClickHouse or TimescaleDB.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="You need the last 5 orders per customer, for all 10,000 customers. Which approach is most efficient?"
        options={[
          'Correlated subquery in SELECT with LIMIT 5',
          'Window function with ROW_NUMBER + filter WHERE rn <= 5',
          'CROSS JOIN LATERAL with ORDER BY + LIMIT 5 (with proper index)',
          'Self-join with GROUP BY and HAVING',
        ]}
        correctIndex={2}
        explanation="LATERAL JOIN with an indexed ORDER BY + LIMIT is typically fastest for top-N-per-group queries. It performs an index scan for each outer row, fetching exactly 5 rows per customer. The window function approach must first assign row numbers to ALL orders, then filter — much more work if there are millions of orders. The LATERAL approach leverages the index to avoid reading unneeded rows."
        language="sql"
      />

      <InteractiveChallenge
        question="A 200-million-row events table needs old data deleted every month, and queries almost always filter on event_date. What's the most effective strategy?"
        options={[
          'Add a B-tree index on event_date and run DELETE ... WHERE event_date < ? monthly',
          'Range-partition the table by event_date and DROP old partitions instead of deleting',
          'Switch the primary key to a UUID',
          'Convert the table to use EAV so old rows are cheaper to remove',
        ]}
        correctIndex={1}
        explanation="Range partitioning by date lets you drop an entire month's partition instantly with DROP TABLE — no scanning, no index maintenance, no bloat from mass deletes. A plain DELETE on a 200M-row table, even with an index, still has to find and mark every matching row dead, bloating indexes and requiring vacuum afterward."
        language="sql"
      />

      <InteractiveChallenge
        question="Why default to JSONB over JSON for a column storing semi-structured data in PostgreSQL?"
        options={[
          'JSON is deprecated and will be removed',
          'JSONB stores a decomposed binary format that supports GIN indexing and faster queries, at the cost of not preserving key order',
          'JSON cannot store nested objects',
          'JSONB is required for full-text search'
        ]}
        correctIndex={1}
        explanation="JSON stores an exact text copy that must be reparsed on every access and preserves key order/duplicates. JSONB decomposes the document into a binary format once, enabling GIN indexing and much faster containment/path queries — the tradeoff is losing exact key ordering and whitespace, which is rarely needed."
        language="sql"
      />
    </LessonLayout>
  );
}
