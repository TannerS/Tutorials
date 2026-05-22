import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SqlCte() {
  return (
    <LessonLayout
      title="CTEs & Recursive Queries"
      sectionId="sql"
      lessonIndex={6}
      prev={{ path: "/sql/transactions", label: "Transactions & ACID" }}
      next={{ path: "/sql/advanced", label: "Advanced SQL" }}
    >
      <p>Common Table Expressions (CTEs) make complex queries readable and enable recursive queries for hierarchical data.</p>

      <h2>Basic CTEs</h2>
      <CodeBlock language="sql" title="WITH Clause">
{`-- CTE replaces a subquery with a named, readable block
WITH expensive_orders AS (
    SELECT user_id, SUM(total) as lifetime_value
    FROM orders
    WHERE status = 'completed'
    GROUP BY user_id
    HAVING SUM(total) > 1000
),
user_info AS (
    SELECT id, name, email FROM users WHERE active = true
)
SELECT u.name, u.email, e.lifetime_value
FROM user_info u
JOIN expensive_orders e ON u.id = e.user_id
ORDER BY e.lifetime_value DESC;

-- Multiple CTEs chained
WITH monthly_sales AS (
    SELECT DATE_TRUNC('month', created_at) as month,
           SUM(total) as revenue
    FROM orders GROUP BY 1
),
growth AS (
    SELECT month, revenue,
           LAG(revenue) OVER (ORDER BY month) as prev_month
    FROM monthly_sales
)
SELECT month, revenue,
       ROUND((revenue - prev_month) / prev_month * 100, 2) as growth_pct
FROM growth;`}
      </CodeBlock>

      <h2>Recursive CTEs</h2>
      <CodeBlock language="sql" title="Recursive Queries for Hierarchies">
{`-- Org chart: find all reports under manager_id = 1
WITH RECURSIVE org_tree AS (
    -- Base case: start with the manager
    SELECT id, name, manager_id, 1 as level
    FROM employees
    WHERE id = 1

    UNION ALL

    -- Recursive case: find employees reporting to current level
    SELECT e.id, e.name, e.manager_id, t.level + 1
    FROM employees e
    JOIN org_tree t ON e.manager_id = t.id
)
SELECT level, REPEAT('  ', level-1) || name as name
FROM org_tree
ORDER BY level, name;

-- Path accumulation: show full path to each employee
WITH RECURSIVE paths AS (
    SELECT id, name, manager_id, CAST(name AS TEXT) as path
    FROM employees WHERE manager_id IS NULL

    UNION ALL

    SELECT e.id, e.name, e.manager_id, p.path || ' > ' || e.name
    FROM employees e
    JOIN paths p ON e.manager_id = p.id
)
SELECT name, path FROM paths;`}
      </CodeBlock>

      <InfoBox variant="tip" title="CTE vs Subquery vs Temp Table">
        <p>CTEs improve readability and allow recursive queries. In PostgreSQL 12+, CTEs are inlined by default (same performance as subqueries). Use a temp table when you need to index the intermediate result or reuse it multiple times in complex queries.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What makes a recursive CTE work?"
        options={["The RECURSIVE keyword alone", "A base case (non-recursive) UNION ALL with a recursive case that references the CTE", "Using a stored procedure", "Joins with self-referencing foreign keys"]}
        correctIndex={1}
        explanation="A recursive CTE requires: (1) a non-recursive base case that seeds the initial result set, (2) UNION ALL, (3) a recursive term that references the CTE name itself and adds new rows. Recursion stops when no new rows are added. Always include a termination condition to avoid infinite loops."
      />
    </LessonLayout>
  );
}
