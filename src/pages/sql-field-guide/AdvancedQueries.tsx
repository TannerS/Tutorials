import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideAdvancedQueries() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="SQL · Field Reference"
      title="Advanced Queries"
      tagline="Joins, window functions, CTEs, and LATERAL — the toolkit for queries plain SELECTs can't express."
      meta={['PostgreSQL 17+', '13 patterns']}
      footerLabel="Personal study reference — PostgreSQL"
      pageLabel="SQL Field Guide · Advanced Queries"
      prev={{ path: '/sql-field-guide/basic-queries', label: 'Basic Queries' }}
      next={{ path: '/sql-field-guide/schema-design', label: 'Schema Design Patterns' }}
    >
      <PosterCard
        glyph="Lj"
        title={<>LEFT JOIN <span className="dim">anti-join</span></>}
        language="sql"
        code={`SELECT d.* FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
WHERE e.id IS NULL;   -- departments with NO employees`}
        caption="The anti-join pattern: LEFT JOIN then filter WHERE right.id IS NULL to find rows with no match on the other side."
      />

      <PosterCard
        glyph="Fj"
        title={<>FULL OUTER JOIN <span className="dim">reconciliation</span></>}
        language="sql"
        code={`SELECT COALESCE(a.id, b.id) id, a.total, b.total
FROM system_a a
FULL OUTER JOIN system_b b ON a.id = b.id
WHERE a.id IS NULL OR b.id IS NULL OR a.total <> b.total;`}
        caption="FULL OUTER JOIN keeps unmatched rows from both sides — the standard shape for diffing two datasets."
      />

      <PosterCard
        glyph="Rn"
        title={<>ROW_NUMBER <span className="dim">top-N per group</span></>}
        language="sql"
        code={`WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY department ORDER BY salary DESC
  ) rn FROM employees
)
SELECT * FROM ranked WHERE rn <= 3;`}
        caption="Window functions annotate every row instead of collapsing it — you keep every row and add a rank column alongside it."
      />

      <PosterCard
        glyph="Lg"
        title={<>LAG / LEAD <span className="dim">row comparison</span></>}
        language="sql"
        code={`SELECT month, revenue,
  revenue - LAG(revenue) OVER (ORDER BY month) AS mom_change
FROM monthly_revenue;`}
        caption="LAG/LEAD compare a row to a neighboring row without a self-join — the standard tool for period-over-period deltas."
      />

      <PosterCard
        glyph="Fr"
        title={<>Frame <span className="dim">running total</span></>}
        language="sql"
        code={`SELECT date, amount,
  SUM(amount) OVER (
    ORDER BY date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM transactions;`}
        caption="The frame clause controls which rows the window function sees. Without ORDER BY, the default frame is the whole partition."
      />

      <PosterCard
        glyph="Cte"
        title={<>CTE <span className="dim">named subqueries</span></>}
        language="sql"
        code={`WITH monthly AS (
  SELECT DATE_TRUNC('month', ordered_at) m, SUM(total) rev
  FROM orders GROUP BY 1
)
SELECT * FROM monthly WHERE rev < 1000;`}
        caption="CTEs turn a nested subquery pyramid into readable, named steps. Postgres 12+ inlines single-use CTEs automatically."
      />

      <PosterCard
        glyph="Rec"
        title={<>Recursive CTE <span className="dim">tree traversal</span></>}
        language="sql"
        code={`WITH RECURSIVE org AS (
  SELECT id, manager_id, 1 depth FROM employees WHERE id = 100
  UNION ALL
  SELECT e.id, e.manager_id, o.depth + 1
  FROM employees e JOIN org o ON e.manager_id = o.id
)
SELECT * FROM org;`}
        caption="Base case UNION ALL recursive case. Always cap depth (WHERE depth < N) or use Postgres 14+'s CYCLE clause to prevent infinite loops."
      />

      <PosterCard
        glyph="Wc"
        title={<>Writable CTE <span className="dim">atomic archive</span></>}
        language="sql"
        code={`WITH moved AS (
  DELETE FROM orders WHERE status = 'done'
  RETURNING *
)
INSERT INTO orders_archive SELECT * FROM moved;`}
        caption="Postgres-only: chain DELETE/UPDATE/INSERT with RETURNING inside a WITH clause for one atomic multi-step operation."
      />

      <PosterCard
        glyph="Lat"
        title={<>LATERAL <span className="dim">top-N join</span></>}
        language="sql"
        code={`SELECT c.name, o.*
FROM customers c
CROSS JOIN LATERAL (
  SELECT * FROM orders o
  WHERE o.customer_id = c.id
  ORDER BY ordered_at DESC LIMIT 3
) o;`}
        caption="LATERAL lets a subquery in FROM reference columns from an earlier table in the same FROM clause — ideal for indexed top-N-per-group."
      />

      <PosterCard
        glyph="Piv"
        title={<>Pivot <span className="dim">with FILTER</span></>}
        language="sql"
        code={`SELECT
  EXTRACT(QUARTER FROM ordered_at) q,
  SUM(total) FILTER (WHERE category = 'Elec') electronics,
  SUM(total) FILTER (WHERE category = 'Food') food
FROM orders GROUP BY 1;`}
        caption="No PIVOT keyword in Postgres — FILTER-per-column inside one aggregate query is the idiomatic cross-tab pattern."
      />

      <PosterCard
        glyph="Ez"
        title={<>EXISTS <span className="dim">vs</span> IN</>}
        language="sql"
        code={`SELECT * FROM orders o
WHERE EXISTS (
  SELECT 1 FROM customers c
  WHERE c.id = o.customer_id AND c.region = 'US'
);`}
        caption="Modern Postgres plans IN (subquery) and EXISTS identically — both become semi-joins. The 'EXISTS is faster' rule is Oracle-era folklore. Pick on readability; the one real reason to prefer NOT EXISTS over NOT IN is NULL correctness, not speed."
      />

      <PosterCard
        glyph="Gs"
        title={<>GROUPING SETS <span className="dim">multi-level rollup</span></>}
        language="sql"
        code={`SELECT department, level, COUNT(*)
FROM employees
GROUP BY GROUPING SETS (
  (department, level), (department), ()
);`}
        caption="One query computes department+level totals, department-only totals, AND a grand total — no UNION of three separate queries."
      />

      <PosterCard
        glyph="Rw"
        title={<>Row constructors <span className="dim">tiebreaker compare</span></>}
        language="sql"
        code={`SELECT * FROM orders
WHERE (created_at, id) < ('2024-06-01', 9000)
ORDER BY created_at DESC, id DESC;`}
        caption="Comparing a tuple (created_at, id) as a single unit is cleaner than nested OR logic for compound cursor comparisons."
      />

      <PosterQuickRef
        title="Which advanced query pattern do I need?"
        rows={[
          { need: 'Rows in A with no match in B', answer: 'LEFT JOIN B ... WHERE B.id IS NULL' },
          { need: 'Diff two datasets', answer: 'FULL OUTER JOIN + COALESCE' },
          { need: 'Top-N rows per group', answer: 'ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) + filter' },
          { need: 'Compare row to previous/next row', answer: 'LAG() / LEAD() OVER (ORDER BY ...)' },
          { need: 'Break a nested query into readable steps', answer: 'WITH ... AS (...) CTE' },
          { need: 'Traverse a tree or graph', answer: 'WITH RECURSIVE' },
          { need: 'Delete + insert atomically', answer: 'Writable CTE with RETURNING' },
          { need: 'Correlated per-row subquery returning multiple rows', answer: 'CROSS/LEFT JOIN LATERAL' },
          { need: 'Rows-to-columns report', answer: 'SUM(x) FILTER (WHERE ...) per column' },
          { need: 'Subtotals + grand total in one query', answer: 'GROUP BY GROUPING SETS / ROLLUP / CUBE' },
        ]}
      />
    </PosterLayout>
  );
}
