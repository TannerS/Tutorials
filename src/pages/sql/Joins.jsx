import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SqlJoins() {
  return (
    <LessonLayout
      title="Joins & Subqueries"
      sectionId="sql"
      lessonIndex={1}
      prev={{ path: "/sql/quickstart", label: "SQL Quickstart" }}
      next={{ path: "/sql/window", label: "Window Functions" }}
    >
      <p>JOINs combine rows from multiple tables. Understanding the different types is essential for working with relational databases.</p>

      <FlowChart
        title="SQL JOIN Types"
        chart={"graph TD\n  A[INNER JOIN] --> B[Only matching rows in both]\n  C[LEFT JOIN] --> D[All from left + matching right]\n  E[RIGHT JOIN] --> F[All from right + matching left]\n  G[FULL OUTER JOIN] --> H[All from both tables]\n  I[CROSS JOIN] --> J[Cartesian product]"}
      />

      <h2>JOIN Types</h2>
      <CodeBlock language="sql" title="All JOIN Types">
{`-- INNER JOIN — only rows with matches in both tables
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN — all users, even if they have no orders
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.name;

-- Find users with NO orders
SELECT u.name
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;

-- Multiple JOINs
SELECT u.name, p.name as product, oi.quantity
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.created_at > NOW() - INTERVAL '7 days';

-- Self-join (employees with their manager)
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;`}
      </CodeBlock>

      <h2>Subqueries</h2>
      <CodeBlock language="sql" title="Subqueries and EXISTS">
{`-- Scalar subquery (returns single value)
SELECT name, salary,
       (SELECT AVG(salary) FROM employees) as avg_salary
FROM employees;

-- IN subquery
SELECT name FROM users
WHERE id IN (SELECT DISTINCT user_id FROM orders WHERE total > 100);

-- NOT IN subquery (watch for NULLs!)
SELECT name FROM users
WHERE id NOT IN (SELECT user_id FROM orders WHERE user_id IS NOT NULL);

-- EXISTS — faster than IN for large datasets
SELECT name FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 100
);

-- NOT EXISTS — users who never ordered
SELECT name FROM users u
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- Correlated subquery (references outer query)
SELECT name, salary
FROM employees e
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE department = e.department  -- references outer e.department
);`}
      </CodeBlock>

      <InfoBox variant="tip" title="JOIN vs Subquery Performance">
        <p>JOINs are usually faster than equivalent subqueries because the query optimizer can choose better execution plans. Use EXISTS instead of IN for correlated subqueries — EXISTS stops at the first match while IN computes the full set.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does a LEFT JOIN return when there is no matching row on the right side?"
        options={["It excludes that row entirely", "NULL values for all right-table columns", "An error", "Zero for numeric columns"]}
        correctIndex={1}
        explanation="A LEFT JOIN returns all rows from the left table. When no matching row exists in the right table, all columns from the right table are filled with NULL. This is how you find rows that do NOT have a related record — check WHERE right_table.id IS NULL."
      />
    </LessonLayout>
  );
}
