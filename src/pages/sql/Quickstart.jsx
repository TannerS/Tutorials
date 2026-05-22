import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Quickstart() {
  return (
    <LessonLayout
      title="SQL Quick Refresher"
      sectionId="sql"
      lessonIndex={0}
      prev={null}
      next={{ path: '/sql/joins', label: 'Joins & Subqueries' }}
    >
      <p>You know SQL. Let's speed-run the fundamentals so we share a common vocabulary, then get to the good stuff.</p>

      <h2>Table Creation & Constraints</h2>

      <CodeBlock language="sql" title="CREATE TABLE — Data Types and Constraints" showLineNumbers={true}>
{`-- Create a table with common data types and constraints
CREATE TABLE employees (
  id          SERIAL PRIMARY KEY,           -- auto-incrementing PK
  name        VARCHAR(100) NOT NULL,        -- variable-length string, required
  email       VARCHAR(255) UNIQUE NOT NULL, -- must be unique across table
  department  VARCHAR(50) DEFAULT 'Unassigned',
  salary      NUMERIC(10,2) CHECK (salary > 0),  -- must be positive
  hire_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active   BOOLEAN DEFAULT TRUE,
  manager_id  INT REFERENCES employees(id)  -- self-referencing FK
);

-- Separate constraint syntax for composite keys
CREATE TABLE order_items (
  order_id    INT NOT NULL REFERENCES orders(id),
  product_id  INT NOT NULL REFERENCES products(id),
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id)       -- composite primary key
);

-- ALTER TABLE: modify existing tables
ALTER TABLE employees ADD COLUMN phone VARCHAR(20);
ALTER TABLE employees ALTER COLUMN department SET NOT NULL;
ALTER TABLE employees DROP COLUMN IF EXISTS phone;

-- DROP TABLE (with dependency handling)
DROP TABLE IF EXISTS order_items;          -- safe drop
DROP TABLE IF EXISTS orders CASCADE;       -- drops dependent objects too`}
      </CodeBlock>

      <InfoBox variant="tip" title="Constraint Naming Convention">
        <p>
          Name your constraints explicitly: <code>CONSTRAINT chk_salary_positive CHECK (salary {'>'} 0)</code>.
          Auto-generated names like <code>employees_salary_check</code> are harder to debug when violations occur.
        </p>
      </InfoBox>

      <h2>The Big Four: CRUD</h2>

      <CodeBlock language="sql" title="INSERT — Single, Bulk, and Conflict Handling" showLineNumbers={true}>
{`-- INSERT: single row
INSERT INTO employees (name, email, department, salary)
VALUES ('Alice', 'alice@example.com', 'Engineering', 130000);

-- INSERT: bulk insert
INSERT INTO employees (name, email, department, salary)
VALUES
  ('Bob',   'bob@example.com',   'Sales',       95000),
  ('Carol', 'carol@example.com', 'Engineering', 140000),
  ('Dave',  'dave@example.com',  'Marketing',   88000);

-- INSERT ... ON CONFLICT (upsert — PostgreSQL)
INSERT INTO employees (email, name, salary)
VALUES ('alice@example.com', 'Alice Smith', 135000)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name, salary = EXCLUDED.salary;

-- INSERT ... SELECT (copy from another table)
INSERT INTO archived_employees (name, email, department)
SELECT name, email, department
FROM employees
WHERE is_active = FALSE;`}
      </CodeBlock>

      <CodeBlock language="sql" title="SELECT — Filtering, Sorting, and Limiting" showLineNumbers={true}>
{`-- WHERE with comparison operators
SELECT * FROM employees WHERE salary > 100000;
SELECT * FROM employees WHERE department = 'Engineering';

-- AND / OR / NOT
SELECT * FROM employees
WHERE department = 'Engineering' AND salary > 100000;

SELECT * FROM employees
WHERE department = 'Sales' OR department = 'Marketing';

-- IN — shorthand for multiple OR conditions
SELECT * FROM employees
WHERE department IN ('Engineering', 'Sales', 'Marketing');

-- BETWEEN — inclusive range
SELECT * FROM employees
WHERE salary BETWEEN 80000 AND 120000;

-- LIKE — pattern matching (% = any chars, _ = single char)
SELECT * FROM employees WHERE name LIKE 'A%';       -- starts with A
SELECT * FROM employees WHERE email LIKE '%@gmail%'; -- contains @gmail

-- IS NULL / IS NOT NULL
SELECT * FROM employees WHERE manager_id IS NULL;    -- top-level managers

-- DISTINCT — remove duplicates
SELECT DISTINCT department FROM employees;

-- ORDER BY with multiple columns
SELECT * FROM employees
ORDER BY department ASC, salary DESC;

-- LIMIT and OFFSET
SELECT * FROM employees
ORDER BY salary DESC
LIMIT 10 OFFSET 20;  -- skip 20, take 10 (page 3 of 10-per-page)`}
      </CodeBlock>

      <CodeBlock language="sql" title="UPDATE and DELETE" showLineNumbers={true}>
{`-- UPDATE with a subquery
UPDATE employees
SET salary = salary * 1.10
WHERE department IN (
  SELECT department FROM departments WHERE budget_increase = TRUE
);

-- UPDATE with FROM clause (PostgreSQL) — join-based update
UPDATE employees e
SET department = d.new_name
FROM department_renames d
WHERE e.department = d.old_name;

-- DELETE with JOIN (PostgreSQL syntax)
DELETE FROM audit_logs a
USING employees e
WHERE a.employee_id = e.id
  AND e.terminated_date < CURRENT_DATE - INTERVAL '1 year';

-- DELETE all rows (truncate is faster for full wipe)
DELETE FROM temp_imports;          -- logged, can rollback
TRUNCATE TABLE temp_imports;       -- unlogged, instant, resets sequences`}
      </CodeBlock>

      <h2>Aggregate Functions</h2>

      <CodeBlock language="sql" title="COUNT, SUM, AVG, MIN, MAX" showLineNumbers={true}>
{`-- Basic aggregates
SELECT
  COUNT(*)           AS total_employees,    -- counts all rows
  COUNT(manager_id)  AS has_manager,        -- counts non-NULL values
  SUM(salary)        AS total_payroll,
  AVG(salary)        AS avg_salary,
  MIN(salary)        AS lowest_salary,
  MAX(salary)        AS highest_salary
FROM employees;

-- Aggregates with GROUP BY
SELECT
  department,
  COUNT(*) AS headcount,
  ROUND(AVG(salary), 2) AS avg_salary,
  MAX(salary) - MIN(salary) AS salary_spread
FROM employees
GROUP BY department
ORDER BY headcount DESC;`}
      </CodeBlock>

      <h2>SQL Logical Execution Order</h2>

      <p>
        This is the single most important thing to internalize. SQL does <strong>not</strong> execute
        top-to-bottom like your code reads. The logical processing order determines what aliases are
        visible where, and why you can't use a SELECT alias in WHERE.
      </p>

      <FlowChart
        title="SQL Logical Execution Order (not syntax order)"
        chart={"graph TD\n  A[\"1. FROM / JOIN\"] --> B[\"2. WHERE\"]\n  B --> C[\"3. GROUP BY\"]\n  C --> D[\"4. HAVING\"]\n  D --> E[\"5. SELECT\"]\n  E --> F[\"6. DISTINCT\"]\n  F --> G[\"7. ORDER BY\"]\n  G --> H[\"8. LIMIT / OFFSET\"]\n  style A fill:#1a3329,stroke:#4ade80\n  style E fill:#1a2744,stroke:#5b9cf6\n  style G fill:#2a1f44,stroke:#a78bfa"}
      />

      <InfoBox variant="warning" title="The Classic Gotcha">
        <p>
          You can't reference a SELECT alias in WHERE or GROUP BY (in standard SQL) because SELECT
          runs <em>after</em> those clauses. MySQL lets you get away with it in GROUP BY — PostgreSQL
          does not. Always use the original expression or a CTE/subquery if you need to filter on a
          computed column.
        </p>
      </InfoBox>

      <h2>Filtering & Aggregation Patterns</h2>

      <CodeBlock language="sql" title="WHERE vs HAVING — Know the Difference" showLineNumbers={true}>
{`-- WHERE filters rows BEFORE grouping
-- HAVING filters groups AFTER aggregation

-- "Departments with more than 5 senior engineers"
SELECT department, COUNT(*) AS senior_count
FROM employees
WHERE level >= 'Senior'       -- row-level filter (before GROUP BY)
GROUP BY department
HAVING COUNT(*) > 5           -- group-level filter (after GROUP BY)
ORDER BY senior_count DESC;

-- Conditional aggregation (avoids multiple queries)
SELECT
  department,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE level = 'Senior') AS seniors,     -- PostgreSQL
  SUM(CASE WHEN level = 'Senior' THEN 1 ELSE 0 END) AS seniors_compat  -- ANSI
FROM employees
GROUP BY department;`}
      </CodeBlock>

      <InfoBox variant="tip" title="FILTER Clause">
        <p>
          PostgreSQL's <code>FILTER (WHERE ...)</code> is cleaner than CASE-based conditional
          aggregation and can be slightly faster. If you're on Postgres, prefer it.
        </p>
      </InfoBox>

      <h2>GROUP BY Patterns</h2>

      <CodeBlock language="sql" title="GROUP BY with ROLLUP, CUBE, and GROUPING SETS" showLineNumbers={true}>
{`-- ROLLUP: subtotals + grand total (hierarchical)
SELECT department, level, COUNT(*), AVG(salary)
FROM employees
GROUP BY ROLLUP (department, level);
-- Produces: (dept, level), (dept, NULL), (NULL, NULL)

-- CUBE: all possible subtotal combinations
SELECT department, level, COUNT(*), AVG(salary)
FROM employees
GROUP BY CUBE (department, level);
-- Produces: (dept, level), (dept, NULL), (NULL, level), (NULL, NULL)

-- GROUPING SETS: explicit control over which groupings to compute
SELECT department, level, COUNT(*)
FROM employees
GROUP BY GROUPING SETS (
  (department, level),
  (department),
  ()
);`}
      </CodeBlock>

      <h2>OFFSET Pagination Is Broken at Scale</h2>

      <CodeBlock language="sql" title="Keyset (Cursor) Pagination vs OFFSET" showLineNumbers={true}>
{`-- BAD: OFFSET-based pagination (scans and discards N rows)
SELECT * FROM orders
ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;  -- DB must process 100,020 rows

-- GOOD: Keyset pagination (seeks directly via index)
SELECT * FROM orders
WHERE created_at < '2024-01-15T10:30:00Z'  -- last seen value
ORDER BY created_at DESC
LIMIT 20;

-- For non-unique sort columns, use a tiebreaker
SELECT * FROM orders
WHERE (created_at, id) < ('2024-01-15T10:30:00Z', 98765)
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
      </CodeBlock>

      <InteractiveChallenge
        question="Given the SQL logical execution order, which clause can legally reference a column alias defined in SELECT?"
        options={[
          'WHERE',
          'GROUP BY',
          'HAVING',
          'ORDER BY',
        ]}
        correctIndex={3}
        explanation="ORDER BY is processed after SELECT, so it can reference SELECT aliases. WHERE, GROUP BY, and HAVING all execute before SELECT in the logical order."
        language="sql"
      />

      <InteractiveChallenge
        question={"What does INSERT ... ON CONFLICT DO UPDATE (upsert) do when the target row already exists?"}
        options={[
          'Throws a duplicate key error',
          'Silently ignores the insert',
          'Updates the existing row with the new values',
          'Deletes the old row and inserts the new one',
        ]}
        correctIndex={2}
        explanation="ON CONFLICT DO UPDATE performs an upsert: if the row already exists (conflict on a unique constraint), it updates the existing row with the values from the EXCLUDED pseudo-table instead of raising an error."
        language="sql"
      />

      <InteractiveChallenge
        question={"Which aggregate function counts only non-NULL values in a column?"}
        options={[
          'COUNT(*)',
          'COUNT(column_name)',
          'SUM(column_name)',
          'COUNT(DISTINCT column_name)',
        ]}
        correctIndex={1}
        explanation="COUNT(column_name) counts only non-NULL values in that column. COUNT(*) counts all rows regardless of NULLs. COUNT(DISTINCT column_name) counts unique non-NULL values. SUM adds values, it doesn't count them."
        language="sql"
      />
    </LessonLayout>
  );
}
