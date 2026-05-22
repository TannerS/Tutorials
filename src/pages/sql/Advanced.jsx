import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SqlAdvanced() {
  return (
    <LessonLayout
      title="Advanced SQL"
      sectionId="sql"
      lessonIndex={7}
      prev={{ path: "/sql/cte", label: "CTEs & Recursive Queries" }}
      next={null}
    >
      <p>Advanced SQL features: materialized views, stored procedures, triggers, JSON operations, and query optimization techniques.</p>

      <h2>Materialized Views</h2>
      <CodeBlock language="sql" title="Materialized View for Performance">
{`-- Materialized view stores query results on disk (unlike regular views)
CREATE MATERIALIZED VIEW monthly_revenue AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    SUM(total)  as revenue,
    COUNT(*)    as order_count,
    AVG(total)  as avg_order_value
FROM orders
WHERE status = 'completed'
GROUP BY 1
ORDER BY 1;

-- Create index on materialized view for fast lookups
CREATE INDEX ON monthly_revenue(month);

-- Refresh when source data changes
REFRESH MATERIALIZED VIEW monthly_revenue;

-- Non-blocking refresh (PostgreSQL — allows reads during refresh)
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_revenue;`}
      </CodeBlock>

      <h2>JSON Operations</h2>
      <CodeBlock language="sql" title="PostgreSQL JSON/JSONB">
{`-- JSONB is binary JSON — faster for querying, indexable
CREATE TABLE events (
    id      SERIAL PRIMARY KEY,
    type    VARCHAR(50),
    payload JSONB
);

INSERT INTO events (type, payload) VALUES
    ('user.signup', '{"name":"Alice","email":"alice@test.com","country":"US"}'),
    ('order.placed', '{"total":99.99,"items":[{"id":1,"qty":2}]}');

-- Extract JSON field
SELECT payload->>'name' FROM events WHERE type = 'user.signup';
-- -> returns JSON, ->> returns text

-- Nested access
SELECT payload->'items'->0->>'id' FROM events WHERE type = 'order.placed';

-- WHERE on JSON field
SELECT * FROM events WHERE payload->>'country' = 'US';

-- JSON index (makes JSON queries fast)
CREATE INDEX ON events USING GIN (payload);

-- Contains operator
SELECT * FROM events WHERE payload @> '{"country":"US"}'::jsonb;`}
      </CodeBlock>

      <h2>Stored Procedures and Functions</h2>
      <CodeBlock language="sql" title="PL/pgSQL Functions">
{`-- Function that returns a value
CREATE OR REPLACE FUNCTION get_user_order_count(user_id_param INT)
RETURNS INT AS $$
    SELECT COUNT(*) FROM orders WHERE user_id = user_id_param;
$$ LANGUAGE SQL;

-- PL/pgSQL function with logic
CREATE OR REPLACE FUNCTION apply_discount(order_id_param INT, pct NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    current_total NUMERIC;
    new_total NUMERIC;
BEGIN
    SELECT total INTO current_total FROM orders WHERE id = order_id_param;
    new_total := current_total * (1 - pct/100);
    UPDATE orders SET total = new_total WHERE id = order_id_param;
    RETURN new_total;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT apply_discount(42, 10.0); -- apply 10% discount to order 42`}
      </CodeBlock>

      <InfoBox variant="tip" title="EXPLAIN vs EXPLAIN ANALYZE">
        <p>Use EXPLAIN to see the query plan without running it. Use EXPLAIN ANALYZE BUFFERS to see actual execution times and buffer cache hits. Look for Seq Scans on large tables, high cost estimates, and large row estimate differences as optimization targets.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the key advantage of a Materialized View over a regular View?"
        options={["Materialized views auto-update in real time", "Materialized views store results on disk and can be indexed, making them much faster to query", "Regular views cannot use GROUP BY", "Materialized views use less storage"]}
        correctIndex={1}
        explanation="A regular view is just a stored query — it runs the underlying query every time you SELECT from it. A materialized view pre-computes and stores the results on disk. You can add indexes to it and query it instantly. The trade-off is that you must REFRESH it when source data changes."
      />
    </LessonLayout>
  );
}
