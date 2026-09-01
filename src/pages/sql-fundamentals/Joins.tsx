import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Joins() {
  return (
    <LessonLayout
      title="Joins & Subqueries"
      sectionId="sql-fundamentals"
      lessonIndex={1}
      prev={{ path: '/sql-fundamentals/quickstart', label: 'SQL Quick Refresher' }}
      next={{ path: '/sql-fundamentals/aggregation', label: 'Aggregation & Window Functions' }}
    >
      <p>You use INNER and LEFT JOIN daily. Let's nail down the full taxonomy, then go deep on subquery patterns and the EXISTS vs IN debate — all in PostgreSQL syntax.</p>

      <h2>Join Types at a Glance</h2>

      <FlowChart
        title="Join Types — Set Relationship Overview"
        chart={"graph LR\n  subgraph \"INNER JOIN\"\n    I[\"A ∩ B\"]\n  end\n  subgraph \"LEFT JOIN\"\n    L[\"All A + matched B\"]\n  end\n  subgraph \"RIGHT JOIN\"\n    R[\"All B + matched A\"]\n  end\n  subgraph \"FULL OUTER JOIN\"\n    F[\"All A + All B\"]\n  end\n  subgraph \"CROSS JOIN\"\n    C[\"A × B cartesian\"]\n  end\n  subgraph \"SELF JOIN\"\n    S[\"A joined to A\"]\n  end\n  style I fill:#1a3329,stroke:#4ade80\n  style L fill:#1a2744,stroke:#5b9cf6\n  style R fill:#1a2744,stroke:#5b9cf6\n  style F fill:#2a1f44,stroke:#a78bfa\n  style C fill:#3d2f14,stroke:#d97706\n  style S fill:#3d2f14,stroke:#d97706"}
      />

      <h2>INNER JOIN — Only Matching Rows</h2>

      <p>
        INNER JOIN returns only rows where the join condition is met in <strong>both</strong> tables.
        If an employee has no department match, they disappear from the result.
      </p>

      <FlowChart
        title="INNER JOIN: employees ∩ departments"
        chart={"graph LR\n  A[employees table] --> J{ON e.dept_id = d.id}\n  B[departments table] --> J\n  J --> R[Only matched rows]\n  style J fill:#1a3329,stroke:#4ade80\n  style R fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="sql" title="INNER JOIN — Employees with Their Departments" showLineNumbers={true}>
{`-- Basic INNER JOIN
SELECT e.name, e.salary, d.department_name, d.location
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- Equivalent using WHERE (old syntax — avoid for clarity)
SELECT e.name, d.department_name
FROM employees e, departments d
WHERE e.department_id = d.id;  -- implicit join, harder to read`}
      </CodeBlock>

      <h2>LEFT JOIN — All Left Rows, Matched Right</h2>

      <p>
        LEFT JOIN keeps every row from the left table. If there's no match in the right table,
        you get NULLs for the right-side columns. This is the workhorse for "find all X with optional Y."
      </p>

      <FlowChart
        title="LEFT JOIN: All employees, departments if matched"
        chart={"graph LR\n  A[employees - ALL rows kept] --> J{ON e.dept_id = d.id}\n  B[departments - matched only] --> J\n  J --> R[All employees + NULL if no dept]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style R fill:#1a2744,stroke:#5b9cf6"}
      />

      <CodeBlock language="sql" title="LEFT JOIN — Find Employees Without a Department" showLineNumbers={true}>
{`-- All employees, with department info where available
SELECT e.name, d.department_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- Find "orphan" employees (no department assigned)
SELECT e.name, e.email
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE d.id IS NULL;  -- only rows where right side didn't match`}
      </CodeBlock>

      <h2>RIGHT JOIN & FULL OUTER JOIN</h2>

      <CodeBlock language="sql" title="RIGHT JOIN and FULL OUTER JOIN" showLineNumbers={true}>
{`-- RIGHT JOIN: mirror of LEFT — keeps all right-side rows
-- (Rarely used — just swap table order and use LEFT JOIN)
SELECT e.name, d.department_name
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;
-- Shows all departments, even those with no employees

-- FULL OUTER JOIN: keep everything from both sides
-- Perfect for data reconciliation
SELECT
  COALESCE(a.order_id, b.order_id) AS order_id,
  a.total AS system_a_total,
  b.total AS system_b_total,
  CASE
    WHEN a.order_id IS NULL THEN 'Missing in A'
    WHEN b.order_id IS NULL THEN 'Missing in B'
    WHEN a.total <> b.total THEN 'Amount mismatch'
    ELSE 'OK'
  END AS status
FROM system_a_orders a
FULL OUTER JOIN system_b_orders b ON a.order_id = b.order_id
WHERE a.order_id IS NULL OR b.order_id IS NULL OR a.total <> b.total;`}
      </CodeBlock>

      <h2>CROSS JOIN — Cartesian Product</h2>

      <CodeBlock language="sql" title="CROSS JOIN — Every Combination" showLineNumbers={true}>
{`-- CROSS JOIN: every combination (useful for generating grids)
-- generate_series is a Postgres set-returning function, not ANSI SQL
SELECT d.date, p.product_id
FROM generate_series('2024-01-01'::date, '2024-12-31', '1 day') AS d(date)
CROSS JOIN products p;
-- Result: one row per product per day — perfect for filling gaps in reports

-- Practical use: generate a calendar with all statuses
SELECT c.date, s.status_name, COALESCE(o.cnt, 0) AS order_count
FROM calendar_dates c
CROSS JOIN order_statuses s
LEFT JOIN (
  SELECT DATE(created_at) AS d, status, COUNT(*) AS cnt
  FROM orders GROUP BY 1, 2
) o ON o.d = c.date AND o.status = s.status_name;`}
      </CodeBlock>

      <h2>Self JOIN — Joining a Table to Itself</h2>

      <CodeBlock language="sql" title="Self JOIN — Employee/Manager Hierarchy" showLineNumbers={true}>
{`-- Self JOIN: comparing rows within the same table
-- "Find employees who earn more than their manager"
SELECT
  e.name  AS employee,
  e.salary AS emp_salary,
  m.name  AS manager,
  m.salary AS mgr_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;

-- Find the full reporting chain (recursive self-join via CTE)
WITH RECURSIVE org_chart AS (
  -- Base: top-level managers (no manager)
  SELECT id, name, manager_id, 1 AS depth, name::text AS chain
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive: join each employee to their manager in the chain
  SELECT e.id, e.name, e.manager_id, oc.depth + 1,
         oc.chain || ' > ' || e.name
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT name, depth, chain FROM org_chart ORDER BY chain;`}
      </CodeBlock>

      <h2>Multiple JOINs in One Query</h2>

      <CodeBlock language="sql" title="Chaining Multiple JOINs" showLineNumbers={true}>
{`-- Three-table join: orders + customers + products
SELECT
  c.name AS customer,
  o.order_date,
  p.product_name,
  oi.quantity,
  oi.unit_price * oi.quantity AS line_total
FROM orders o
JOIN customers c      ON o.customer_id = c.id
JOIN order_items oi   ON oi.order_id = o.id
JOIN products p       ON oi.product_id = p.id
WHERE o.order_date >= '2024-01-01'
ORDER BY o.order_date DESC, c.name;

-- Mixing JOIN types in one query
SELECT
  d.department_name,
  e.name,
  p.project_name           -- NULL if employee has no project
FROM departments d
JOIN employees e         ON e.department_id = d.id        -- INNER: must have dept
LEFT JOIN project_assignments pa ON pa.employee_id = e.id -- LEFT: project optional
LEFT JOIN projects p     ON pa.project_id = p.id;`}
      </CodeBlock>

      <h2>Set Operations — Combining Rows Instead of Columns</h2>
      <p>
        A join widens the result: it adds columns from another table. A <strong>set
        operation</strong> stacks results vertically: it combines rows from two queries that
        already have the same shape. Both queries must return the same number of columns with
        compatible types; the column names come from the first query.
      </p>

      <CodeBlock language="sql" title="UNION, INTERSECT, EXCEPT" showLineNumbers={true}>
{`-- UNION — all rows from both, DUPLICATES REMOVED.
-- The dedup requires a sort or hash over the whole result: it is not free.
SELECT email FROM customers
UNION
SELECT email FROM leads;

-- UNION ALL — all rows from both, duplicates KEPT. No dedup step.
-- Default to this. Only use plain UNION when you actually need dedup,
-- and know you're paying for it.
SELECT 'order' AS source, id, created_at FROM orders
UNION ALL
SELECT 'refund' AS source, id, created_at FROM refunds
ORDER BY created_at DESC;      -- ORDER BY applies to the COMBINED result

-- INTERSECT — rows present in BOTH queries.
-- "Customers who are also on the newsletter list"
SELECT email FROM customers
INTERSECT
SELECT email FROM newsletter_subscribers;

-- EXCEPT — rows in the first query but NOT the second. (Called MINUS in Oracle.)
-- "Customers who have never ordered"
SELECT id FROM customers
EXCEPT
SELECT customer_id FROM orders;`}
      </CodeBlock>

      <InfoBox variant="tip" title="EXCEPT handles NULLs the way you'd hope — NOT IN doesn't">
        <p>
          <code>EXCEPT</code> and <code>INTERSECT</code> compare rows using{' '}
          <em>IS NOT DISTINCT FROM</em> semantics, so two NULLs count as matching. That makes{' '}
          <code>EXCEPT</code> a safe drop-in for the anti-join pattern where{' '}
          <code>NOT IN</code> silently returns zero rows if the subquery contains a single NULL —
          the trap covered in the EXISTS vs IN section below.
        </p>
        <p>
          They also deduplicate by default (<code>INTERSECT ALL</code> and{' '}
          <code>EXCEPT ALL</code> preserve duplicate counts), and for large inputs a{' '}
          <code>LEFT JOIN ... WHERE right.id IS NULL</code> or{' '}
          <code>NOT EXISTS</code> usually plans better than <code>EXCEPT</code>. Reach for set
          operations when they express the intent most clearly; check{' '}
          <code>EXPLAIN</code> when the tables get big.
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="The practical use: diffing two tables" showLineNumbers={true}>
{`-- "What changed between the staging table and production?"
-- Rows that differ in EITHER direction, labelled.
-- NOTE: EXCEPT ALL, not EXCEPT — see the warning below.
(SELECT 'only_in_new' AS side, * FROM staging_products
 EXCEPT ALL
 SELECT 'only_in_new', * FROM products)
UNION ALL
(SELECT 'only_in_old' AS side, * FROM products
 EXCEPT ALL
 SELECT 'only_in_old', * FROM staging_products);

-- Verifying a migration produced identical data: this should report 0.
SELECT count(*) FROM (
  (SELECT * FROM old_table EXCEPT ALL SELECT * FROM new_table)
  UNION ALL
  (SELECT * FROM new_table EXCEPT ALL SELECT * FROM old_table)
) diff;`}
      </CodeBlock>

      <InfoBox variant="danger" title="Use EXCEPT ALL for Diffs — Plain EXCEPT Reports Clean on Dirty Data">
        <p>
          <code>EXCEPT</code> deduplicates before comparing, so it cannot see a difference in how
          many times a row appears. Given <code>old_table</code> = <code>(1,&apos;a&apos;), (1,&apos;a&apos;), (2,&apos;b&apos;)</code>
          and <code>new_table</code> = <code>(1,&apos;a&apos;), (2,&apos;b&apos;)</code> — three rows versus two,
          demonstrably not identical — the plain <code>EXCEPT</code> version returns <strong>0</strong>
          and declares the migration clean. <code>EXCEPT ALL</code> returns 1 and correctly flags it.
        </p>
        <p>
          A verification query that passes on data it should reject is worse than no verification at
          all, because it is the thing you point at when someone asks whether the migration was
          checked. Reach for <code>EXCEPT ALL</code> any time the question is &quot;are these two
          result sets the same&quot;, and keep plain <code>EXCEPT</code> for genuine set subtraction
          where duplicates are noise.
        </p>
      </InfoBox>

      <h2>JOIN vs Subquery — When to Use Each</h2>

      <InfoBox variant="info" title="JOIN vs Subquery Decision Guide">
        <p><strong>Use JOIN when:</strong> You need columns from both tables in the output, or you're combining data from multiple sources.</p>
        <p><strong>Use subquery when:</strong> You need to filter based on another table's data but don't need its columns, or you need aggregated values for comparison.</p>
        <p><strong>Use EXISTS when:</strong> You're checking for the existence of related rows and the condition is correlated to the outer row.</p>
        <p><strong>Performance:</strong> The "EXISTS is faster than IN" rule you'll hear repeated is Oracle-era folklore that does not describe modern Postgres. The planner turns both into a <strong>semi-join</strong> and costs them identically — a semi-join checks whether a matching row exists on the other side, returning each outer row at most once no matter how many inner-side rows match. That's exactly what EXISTS/IN mean in plain English, so there's nothing extra for the planner to do by rewriting one into the other. Write whichever reads more clearly; the one genuine reason to prefer <code>NOT EXISTS</code> over <code>NOT IN</code> is <em>correctness</em> around NULLs, not speed.</p>
      </InfoBox>

      <h2>Common JOIN Mistakes</h2>

      <InfoBox variant="danger" title="Mistakes That Will Ruin Your Data">
        <p><strong>Missing ON clause → Cartesian product:</strong> If you accidentally write <code>FROM a, b</code> without a WHERE or use <code>CROSS JOIN</code> unintentionally, you get every possible row combination. A 10K × 10K table produces 100M rows.</p>
        <p><strong>Joining on wrong column:</strong> <code>ON a.id = b.id</code> when you meant <code>ON a.id = b.a_id</code>. Always double-check join conditions.</p>
        <p><strong>Duplicate rows from 1:N joins:</strong> Joining orders to order_items multiplies your order rows. If you then SUM(order.total), you get inflated numbers. <strong>Aggregate before joining</strong> — and note that <code>DISTINCT</code> is <em>not</em> an alternative fix here. Two different orders that happen to share a total are collapsed into one by <code>SUM(DISTINCT total)</code>, which trades a visible 3&times; overcount for a silent undercount. With one customer holding two &#36;100 orders: the truth is 200, the buggy join gives 600, and the <code>DISTINCT</code> &quot;fix&quot; gives 100.</p>
        <p><strong>NULL in join columns:</strong> <code>NULL = NULL</code> is <code>UNKNOWN</code> in SQL, not <code>TRUE</code>. Rows with NULL join keys never match in an INNER or LEFT JOIN ON clause. Postgres's <code>IS NOT DISTINCT FROM</code> treats NULLs as equal if you actually need that.</p>
      </InfoBox>

      <CodeBlock language="sql" title="The Duplicate Row Trap" showLineNumbers={true}>
{`-- BUG: SUM is inflated because orders are duplicated per item
SELECT c.name, SUM(o.total) AS wrong_total
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id  -- 1:N causes duplicates
GROUP BY c.name;

-- FIX: aggregate in a subquery first, then join
SELECT c.name, o_agg.total_spent
FROM customers c
JOIN (
  SELECT customer_id, SUM(total) AS total_spent
  FROM orders
  GROUP BY customer_id
) o_agg ON o_agg.customer_id = c.id;`}
      </CodeBlock>

      <h2>Subquery Taxonomy</h2>

      <InfoBox variant="info" title="Four Types of Subqueries">
        <p><strong>Scalar:</strong> Returns a single value. Use in SELECT or WHERE. Example: <code>(SELECT MAX(salary) FROM employees)</code></p>
        <p><strong>Row:</strong> Returns a single row. Compare with row constructors: <code>WHERE (dept, level) = (SELECT ...)</code></p>
        <p><strong>Table:</strong> Returns a result set. Use in FROM as a derived table or with IN/ANY/ALL.</p>
        <p><strong>Correlated:</strong> References the outer query. Re-executed for each outer row — the performance trap.</p>
      </InfoBox>

      <CodeBlock language="sql" title="Correlated Subquery vs JOIN — Same Result, Different Cost" showLineNumbers={true}>
{`-- Correlated subquery (runs once PER outer row — O(n*m) potential)
SELECT e.name, e.salary,
  (SELECT AVG(salary) FROM employees e2
   WHERE e2.department = e.department) AS dept_avg
FROM employees e;

-- Equivalent JOIN approach (one scan of each table)
SELECT e.name, e.salary, d.dept_avg
FROM employees e
JOIN (
  SELECT department, AVG(salary) AS dept_avg
  FROM employees
  GROUP BY department
) d ON e.department = d.department;

-- Modern approach: window function (single pass)
SELECT name, salary,
  AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;`}
      </CodeBlock>

      <h2>EXISTS vs IN — The Real Difference</h2>

      <CodeBlock language="sql" title="EXISTS vs IN Performance Characteristics" showLineNumbers={true}>
{`-- These two are SEMANTICALLY different but PLAN the same in modern Postgres:
-- the planner rewrites both into the same semi-join (defined above), then picks
-- a physical join strategy based on cost (explained when we get to reading
-- query plans). Check EXPLAIN before "optimizing" one into the other.

-- IN (subquery)
SELECT * FROM orders
WHERE customer_id IN (
  SELECT id FROM customers WHERE region = 'US'
);

-- EXISTS (correlated) — same plan, same result HERE
SELECT * FROM orders o
WHERE EXISTS (
  SELECT 1 FROM customers c
  WHERE c.id = o.customer_id AND c.region = 'US'
);

-- NOT IN has a NULL trap! If subquery returns ANY null, result is empty
SELECT * FROM orders
WHERE customer_id NOT IN (
  SELECT id FROM customers  -- if any id is NULL, ZERO rows returned!
);

-- NOT EXISTS handles NULLs correctly — always prefer it
SELECT * FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = o.customer_id
);`}
      </CodeBlock>

      <InfoBox variant="danger" title="NOT IN + NULL = Silent Data Loss">
        <p>
          <code>NOT IN (1, 2, NULL)</code> evaluates to UNKNOWN for every row, returning zero results.
          This is one of SQL's most dangerous traps. Always use <code>NOT EXISTS</code> or add
          <code>WHERE id IS NOT NULL</code> to the subquery.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="You have a query: SELECT * FROM orders WHERE customer_id NOT IN (SELECT id FROM customers). The customers table has a row where id IS NULL. How many rows will this query return?"
        options={[
          'All orders with no matching customer',
          'All orders',
          'Zero rows',
          'Only orders where customer_id is NULL',
        ]}
        correctIndex={2}
        explanation="When NOT IN encounters a NULL in the subquery result, every comparison becomes UNKNOWN (not TRUE), so no rows satisfy the condition. This is why NOT EXISTS is always safer than NOT IN."
        language="sql"
      />

      <InteractiveChallenge
        question={"You join employees (10 rows) to order_items (5 items per order, 3 orders per employee). How many rows does the result set contain?"}
        options={[
          '10 rows',
          '15 rows',
          '50 rows',
          '150 rows',
        ]}
        correctIndex={3}
        explanation="Each employee has 3 orders, each order has 5 items. So each employee generates 3 x 5 = 15 rows. With 10 employees: 10 x 15 = 150 rows. This is the 1:N join multiplication trap — always be aware of how joins affect row counts."
        language="sql"
      />

      <InteractiveChallenge
        question={"Which JOIN type should you use to find all departments that have NO employees?"}
        options={[
          'INNER JOIN departments d ON e.department_id = d.id',
          'LEFT JOIN departments d ON e.department_id = d.id WHERE e.id IS NULL',
          'departments d LEFT JOIN employees e ON e.department_id = d.id WHERE e.id IS NULL',
          'CROSS JOIN between departments and employees',
        ]}
        correctIndex={2}
        explanation="You need departments as the LEFT (driving) table, LEFT JOIN to employees, then filter WHERE e.id IS NULL to keep only departments with no matching employee. Option B has the tables reversed — it would find employees without departments."
        language="sql"
      />
    </LessonLayout>
  );
}
