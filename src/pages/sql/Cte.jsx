import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Cte() {
  return (
    <LessonLayout
      title="CTEs & Recursive Queries"
      sectionId="sql"
      lessonIndex={6}
      prev={{ path: '/sql/transactions', label: 'Transactions & Locking' }}
      next={{ path: '/sql/advanced', label: 'Advanced SQL Patterns' }}
    >
      <p>Common Table Expressions make complex queries readable. Recursive CTEs unlock hierarchical data traversal — org charts, category trees, bill of materials — all in pure SQL.</p>

      <h2>CTE Fundamentals</h2>

      <CodeBlock language="sql" title="CTEs: Named Subqueries for Readability" showLineNumbers={true}>
{`-- Basic CTE: break a complex query into logical steps
WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', ordered_at) AS month,
    SUM(total) AS revenue
  FROM orders
  WHERE ordered_at >= '2024-01-01'
  GROUP BY 1
),
monthly_with_growth AS (
  SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
    ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
      / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 2) AS growth_pct
  FROM monthly_revenue
)
SELECT * FROM monthly_with_growth
WHERE growth_pct < 0  -- months with declining revenue
ORDER BY month;

-- Multiple CTEs referencing each other
WITH active_users AS (
  SELECT DISTINCT user_id
  FROM events
  WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
),
user_spend AS (
  SELECT u.user_id, SUM(o.total) AS total_spend
  FROM active_users u
  JOIN orders o ON o.user_id = u.user_id
  GROUP BY u.user_id
)
SELECT
  CASE
    WHEN total_spend >= 1000 THEN 'whale'
    WHEN total_spend >= 100 THEN 'regular'
    ELSE 'casual'
  END AS segment,
  COUNT(*) AS user_count,
  ROUND(AVG(total_spend), 2) AS avg_spend
FROM user_spend
GROUP BY 1;`}
      </CodeBlock>

      <h2>Recursive CTEs</h2>

      <FlowChart
        title="Recursive CTE Execution Model"
        chart={"graph TD\n  A[\"Base Case: anchor query\"] --> B[\"Working Table\\ncontains anchor results\"]\n  B --> C{\"Recursive member:\\njoin working table\"}\n  C -->|\"Produces rows\"| D[\"Append to result +\\nreplace working table\"]\n  D --> C\n  C -->|\"No new rows\"| E[\"Return complete\\nresult set\"]\n  style A fill:#1a3329,stroke:#4ade80\n  style B fill:#1a2744,stroke:#5b9cf6\n  style C fill:#2a1f44,stroke:#a78bfa\n  style E fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="sql" title="Org Chart Traversal with Recursive CTE" showLineNumbers={true}>
{`-- Org chart: find all reports under a manager (any depth)
WITH RECURSIVE org_tree AS (
  -- Base case: start with the target manager
  SELECT id, name, manager_id, 1 AS depth, ARRAY[name] AS path
  FROM employees
  WHERE id = 100  -- CEO or target manager

  UNION ALL

  -- Recursive step: find direct reports of current level
  SELECT e.id, e.name, e.manager_id, t.depth + 1,
         t.path || e.name
  FROM employees e
  JOIN org_tree t ON e.manager_id = t.id
  WHERE t.depth < 10  -- safety limit to prevent infinite recursion
)
SELECT
  depth,
  REPEAT('  ', depth - 1) || name AS indented_name,
  ARRAY_TO_STRING(path, ' > ') AS reporting_chain
FROM org_tree
ORDER BY path;

-- Bill of materials: recursive cost rollup
WITH RECURSIVE bom AS (
  -- Base: leaf components (no sub-parts)
  SELECT part_id, parent_id, part_name, quantity, unit_cost,
         unit_cost AS total_cost, 1 AS level
  FROM parts
  WHERE part_id = 'BIKE-001'  -- top-level assembly

  UNION ALL

  SELECT p.part_id, p.parent_id, p.part_name, p.quantity, p.unit_cost,
         p.unit_cost * p.quantity AS total_cost, b.level + 1
  FROM parts p
  JOIN bom b ON p.parent_id = b.part_id
)
SELECT level, part_name, quantity, unit_cost,
       SUM(total_cost) OVER () AS assembly_total_cost
FROM bom
ORDER BY level, part_name;`}
      </CodeBlock>

      <InfoBox variant="danger" title="Infinite Recursion Protection">
        <p>
          Always add a depth/level counter and a <code>WHERE depth &lt; N</code> guard. Without it,
          a single cycle in your data (employee A reports to B, B reports to A) will run forever
          until the DB kills it. PostgreSQL has no built-in recursion limit for CTEs.
        </p>
        <p>
          For graph data with cycles, track visited nodes: <code>WHERE e.id != ALL(visited_ids)</code>
          using an array accumulator.
        </p>
      </InfoBox>

      <h2>Graph Queries & Path Finding</h2>

      <CodeBlock language="sql" title="Shortest Path in a Graph with Recursive CTE" showLineNumbers={true}>
{`-- Find shortest path between two nodes in a graph
WITH RECURSIVE paths AS (
  SELECT
    target_node AS current,
    ARRAY[source_node, target_node] AS path,
    weight AS total_weight
  FROM edges
  WHERE source_node = 'A'

  UNION ALL

  SELECT
    e.target_node,
    p.path || e.target_node,
    p.total_weight + e.weight
  FROM paths p
  JOIN edges e ON e.source_node = p.current
  WHERE e.target_node != ALL(p.path)  -- prevent cycles
    AND ARRAY_LENGTH(p.path, 1) < 20  -- max path length
)
SELECT path, total_weight
FROM paths
WHERE current = 'Z'
ORDER BY total_weight
LIMIT 1;

-- Generate a date series (recursive alternative to generate_series)
WITH RECURSIVE dates AS (
  SELECT DATE '2024-01-01' AS d
  UNION ALL
  SELECT d + INTERVAL '1 day'
  FROM dates
  WHERE d < DATE '2024-12-31'
)
SELECT d FROM dates;`}
      </CodeBlock>

      <InfoBox variant="tip" title="Materialized vs Non-Materialized CTEs">
        <p>
          <strong>PostgreSQL 12+:</strong> CTEs are now inlined (not materialized) by default if they're
          referenced only once and aren't recursive. Use <code>AS MATERIALIZED</code> to force
          materialization (useful as an optimization fence), or <code>AS NOT MATERIALIZED</code>
          to force inlining.
        </p>
        <p>
          <strong>MySQL 8.0:</strong> Non-recursive CTEs are always inlined as derived tables. Recursive CTEs
          are always materialized. You don't get a choice.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="In a recursive CTE with UNION ALL, what happens if the recursive member produces a row that was already in a previous iteration?"
        options={[
          'The row is automatically deduplicated',
          'The row is included again, potentially causing infinite recursion',
          'The database throws an error',
          'The row is included but marked as a duplicate',
        ]}
        correctIndex={1}
        explanation="UNION ALL does not deduplicate. If the recursive member produces a previously-seen row, it will be processed again in the next iteration, potentially causing infinite recursion. Use UNION (which deduplicates) or add explicit cycle detection with an array of visited nodes. PostgreSQL 14+ also offers CYCLE detection syntax."
        language="sql"
      />
    </LessonLayout>
  );
}
