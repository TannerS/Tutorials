import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Advanced() {
  return (
    <LessonLayout
      title="Advanced SQL Patterns"
      sectionId="sql"
      lessonIndex={7}
      prev={{ path: '/sql/cte', label: 'CTEs & Recursive Queries' }}
      next={null}
    >
      <p>This is the grab bag of power techniques — patterns you reach for when standard queries hit a wall. Pivoting, JSON, lateral joins, upserts, temporal data, and materialized views.</p>

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
          powerful because it can return multiple columns and multiple rows. The optimizer can often
          execute it more efficiently than the equivalent correlated subquery approach.
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

-- SQL Standard MERGE (PostgreSQL 15+, SQL Server, Oracle)
MERGE INTO target_table t
USING source_table s ON t.id = s.id
WHEN MATCHED AND s.deleted = TRUE THEN
  DELETE
WHEN MATCHED THEN
  UPDATE SET
    t.name = s.name,
    t.price = s.price,
    t.updated_at = NOW()
WHEN NOT MATCHED THEN
  INSERT (id, name, price, created_at)
  VALUES (s.id, s.name, s.price, NOW());

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

      <h2>JSON Operations</h2>

      <CodeBlock language="sql" title="JSON Querying and Manipulation (PostgreSQL)" showLineNumbers={true}>
{`-- Store and query semi-structured data
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast JSON lookups
CREATE INDEX idx_events_payload ON events USING GIN (payload);
CREATE INDEX idx_events_user ON events ((payload->>'user_id'));

-- Query JSON fields
SELECT
  payload->>'user_id' AS user_id,
  payload->'metadata'->>'browser' AS browser,
  (payload->>'duration')::int AS duration_ms
FROM events
WHERE event_type = 'page_view'
  AND payload @> '{"page": "/checkout"}'  -- containment operator (uses GIN index)
  AND (payload->>'duration')::int > 5000;

-- Aggregate JSON into arrays/objects
SELECT
  payload->>'user_id' AS user_id,
  JSONB_AGG(event_type ORDER BY created_at) AS event_sequence,
  JSONB_OBJECT_AGG(event_type, COUNT(*)) AS event_counts
FROM events
GROUP BY payload->>'user_id';`}
      </CodeBlock>

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

-- Index the materialized view
CREATE UNIQUE INDEX idx_mv_daily_day ON mv_daily_metrics (day);

-- Refresh (full rebuild — blocks reads during refresh)
REFRESH MATERIALIZED VIEW mv_daily_metrics;

-- Concurrent refresh (doesn't block reads, requires unique index)
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
          For near-real-time needs, consider: (1) pg_cron for periodic refresh, (2) trigger-based
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
    </LessonLayout>
  );
}
