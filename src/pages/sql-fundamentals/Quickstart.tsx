import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Quickstart() {
  return (
    <LessonLayout
      title="SQL Quick Refresher"
      sectionId="sql-fundamentals"
      lessonIndex={0}
      prev={null}
      next={{ path: '/sql-fundamentals/joins', label: 'Joins & Subqueries' }}
    >

      <InfoBox variant="note" title="🐘 Dialect notice — these lessons are PostgreSQL">
        <p>
          This section is written for <strong>PostgreSQL</strong>, and the behaviour described was
          verified against <strong>PostgreSQL 18.x</strong>. Most of the SQL here is standard and
          transfers directly, but the specifics do not: the type system,{' '}
          <code>ON CONFLICT</code>, <code>RETURNING</code>, <code>generate_series</code>, MVCC and
          the isolation-level behaviour are all Postgres.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          On SQL Server, Oracle or MySQL the equivalent feature usually exists under a different
          name and with different edge cases — for example <code>MERGE</code> or{' '}
          <code>INSERT ... ON DUPLICATE KEY UPDATE</code> instead of <code>ON CONFLICT</code>, and
          a lock-based rather than snapshot-based <code>REPEATABLE READ</code>. Where a feature is
          version-gated, the lesson says so inline (for instance the <code>CYCLE</code> clause
          being Postgres 14+).
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          If you work in <strong>Microsoft SQL Server</strong>, that dialect has its own section:{' '}
          <a href="/tsql/intro">T-SQL (SQL Server)</a>. It is not a translation of these pages — the
          concurrency model, the NULL sort order and the collation defaults genuinely differ, and{' '}
          <a href="/tsql/transactions">Transactions, Isolation &amp; Locking</a> covers the one that
          surprises Postgres users most: on SQL Server a plain <code>SELECT</code> can block behind
          an uncommitted write.
        </p>
      </InfoBox>
      <p>
        You know SQL. Let's speed-run the fundamentals so we share a common vocabulary, then get to
        the good stuff. Everything here is <strong>PostgreSQL-flavored</strong> — where Postgres
        diverges from generic ANSI SQL (and it diverges a lot), that's called out explicitly.
      </p>

      <h2>Table Creation & Constraints</h2>

      <CodeBlock language="sql" title="CREATE TABLE — Data Types and Constraints" showLineNumbers={true}>
{`-- Create a table with common data types and constraints
CREATE TABLE employees (
  id          SERIAL PRIMARY KEY,           -- auto-incrementing PK (classic Postgres idiom)
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

      <InfoBox variant="tip" title="SERIAL vs GENERATED ... AS IDENTITY">
        <p>
          <code>SERIAL</code> is a Postgres-only convenience that creates a hidden sequence and a
          DEFAULT — but it's not part of the SQL standard, doesn't play well with permissions, and
          survives table renames awkwardly. Since Postgres 10, prefer the standard-compliant identity
          column instead: <code>id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY</code>. New schemas
          should reach for <code>IDENTITY</code>; you'll still see <code>SERIAL</code> everywhere in
          the wild, so know both.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Constraint Naming Convention">
        <p>
          Name your constraints explicitly: <code>CONSTRAINT chk_salary_positive CHECK (salary {'>'} 0)</code>.
          Auto-generated names like <code>employees_salary_check</code> are harder to debug when violations occur.
        </p>
      </InfoBox>

      <h2>The Big Four: CRUD</h2>

      <CodeBlock language="sql" title="INSERT — Single, Bulk, Conflict Handling, and RETURNING" showLineNumbers={true}>
{`-- INSERT: single row
INSERT INTO employees (name, email, department, salary)
VALUES ('Alice', 'alice@example.com', 'Engineering', 130000);

-- INSERT: bulk insert
INSERT INTO employees (name, email, department, salary)
VALUES
  ('Bob',   'bob@example.com',   'Sales',       95000),
  ('Carol', 'carol@example.com', 'Engineering', 140000),
  ('Dave',  'dave@example.com',  'Marketing',   88000);

-- INSERT ... ON CONFLICT (upsert — PostgreSQL only, no ANSI equivalent)
INSERT INTO employees (email, name, salary)
VALUES ('alice@example.com', 'Alice Smith', 135000)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name, salary = EXCLUDED.salary;

-- INSERT ... SELECT (copy from another table)
INSERT INTO archived_employees (name, email, department)
SELECT name, email, department
FROM employees
WHERE is_active = FALSE;

-- RETURNING — get back the row(s) you just wrote, no round trip needed
-- (PostgreSQL / SQL Server OUTPUT-style feature; MySQL has no equivalent)
INSERT INTO employees (name, email, department, salary)
VALUES ('Eve', 'eve@example.com', 'Engineering', 125000)
RETURNING id, hire_date;`}
      </CodeBlock>

      <InfoBox variant="tip" title="RETURNING Saves a Round Trip">
        <p>
          <code>RETURNING</code> works on <code>INSERT</code>, <code>UPDATE</code>, and{' '}
          <code>DELETE</code>. Instead of inserting a row and then issuing a second{' '}
          <code>SELECT</code> to fetch the generated ID or default values, get them back in the same
          statement: <code>INSERT ... RETURNING id</code>. This is a Postgres-flavored feature — most
          web frameworks' ORMs lean on it heavily.
        </p>
      </InfoBox>

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

-- LIKE / ILIKE — pattern matching (% = any chars, _ = single char)
SELECT * FROM employees WHERE name LIKE 'A%';        -- starts with A, case-sensitive
SELECT * FROM employees WHERE email ILIKE '%@GMAIL%'; -- case-insensitive (Postgres only)

-- IS NULL / IS NOT NULL
SELECT * FROM employees WHERE manager_id IS NULL;    -- top-level managers

-- DISTINCT and DISTINCT ON — the latter is Postgres-only
SELECT DISTINCT department FROM employees;
SELECT DISTINCT ON (department) *                    -- one row per department
FROM employees
ORDER BY department, salary DESC;                    -- highest earner per dept

-- ORDER BY with multiple columns
SELECT * FROM employees
ORDER BY department ASC, salary DESC;

-- LIMIT and OFFSET
SELECT * FROM employees
ORDER BY salary DESC
LIMIT 10 OFFSET 20;  -- skip 20, take 10 (page 3 of 10-per-page)`}
      </CodeBlock>

      <InfoBox variant="tip" title="DISTINCT ON — a Postgres Superpower">
        <p>
          <code>DISTINCT ON (column)</code> keeps the first row per distinct value of{' '}
          <code>column</code>, according to <code>ORDER BY</code>. It's the cleanest way to write
          "top 1 per group" without a window function or subquery — but it's Postgres-only, so it
          won't port to MySQL or SQL Server.
        </p>
      </InfoBox>

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

-- DELETE with USING (PostgreSQL's join syntax for DELETE)
DELETE FROM audit_logs a
USING employees e
WHERE a.employee_id = e.id
  AND e.terminated_date < CURRENT_DATE - INTERVAL '1 year';

-- DELETE all rows (truncate is much faster for a full wipe)
DELETE FROM temp_imports;          -- scans and marks every row dead; leaves bloat for VACUUM
TRUNCATE TABLE temp_imports;       -- deallocates the whole file; O(1) regardless of row count

-- Two things people get wrong about TRUNCATE in Postgres:
--  1. It IS transactional and WAL-logged. BEGIN; TRUNCATE t; ROLLBACK; restores
--     the rows. (That is Postgres — in Oracle/MySQL, TRUNCATE is DDL that commits.)
--  2. It does NOT reset IDENTITY/SERIAL sequences unless you ask:
TRUNCATE TABLE temp_imports RESTART IDENTITY;

-- It also takes an ACCESS EXCLUSIVE lock (blocks even SELECTs) and will refuse
-- to run if another table's FK references it, unless you opt in:
TRUNCATE TABLE orders, order_items RESTART IDENTITY CASCADE;

-- UPDATE ... RETURNING to see exactly what changed
UPDATE employees
SET salary = salary * 1.05
WHERE department = 'Engineering'
RETURNING id, name, salary;`}
      </CodeBlock>

      <h2>Never Build SQL by Concatenating Strings</h2>

      <p>
        Every query above is written by hand, but in an application the values come from users.
        The moment you paste a value into a query string you have created an SQL injection
        vulnerability — and injection has sat near the top of the OWASP list for two decades not
        because it is subtle, but because string concatenation is so convenient.
      </p>

      <CodeBlock language="sql" title="What the database actually receives" showLineNumbers={true}>
{`-- The application builds:  "SELECT * FROM users WHERE email = '" + input + "'"
-- A normal user submits:   alice@example.com
SELECT * FROM users WHERE email = 'alice@example.com';

-- An attacker submits:     ' OR '1'='1
SELECT * FROM users WHERE email = '' OR '1'='1';   -- returns EVERY user

-- Or worse:                '; DROP TABLE users; --
SELECT * FROM users WHERE email = ''; DROP TABLE users; --';

-- Escaping quotes yourself does not save you. Numeric contexts have no quotes
-- to escape, multi-byte encodings have historically defeated escape routines,
-- and you only have to forget once.`}
      </CodeBlock>

      <CodeBlock language="sql" title="Parameterized queries — the actual fix" showLineNumbers={true}>
{`-- A parameterized (prepared) statement sends the QUERY and the VALUES over
-- separate channels. The parser sees the placeholders before it ever sees the
-- data, so user input can never become SQL syntax. It is structurally
-- impossible to inject, not merely filtered.

PREPARE find_user (text) AS
  SELECT id, email, status FROM users WHERE email = $1;

EXECUTE find_user('anything '' OR 1=1 --');   -- treated as a literal string

-- In application code this is the default API everywhere:
--   JDBC        ps = conn.prepareStatement("... WHERE email = ?");
--                ps.setString(1, email);
--   Spring      jdbcClient.sql("... WHERE email = :email").param("email", email)
--   Spring Data @Query("... where u.email = :email")  + @Param("email", ...)
--
-- Bonus: the database can cache the plan for a repeated prepared statement,
-- so parameterization is usually FASTER than concatenation as well.`}
      </CodeBlock>

      <InfoBox variant="danger" title="The parts you cannot parameterize">
        <p>
          Placeholders only work for <em>values</em>. You cannot parameterize a table name, a
          column name, or the direction of an <code>ORDER BY</code> — so a &quot;sort by any
          column&quot; feature is exactly where injection sneaks back in. The rule for identifiers
          is to <strong>validate against an allowlist</strong> you control, never to escape user
          input:
        </p>
        <p>
          <code>
            String col = Set.of(&quot;created_at&quot;, &quot;total&quot;,
            &quot;status&quot;).contains(input) ? input : &quot;created_at&quot;;
          </code>
        </p>
        <p>
          Two more habits worth keeping: give the application&apos;s database user only the
          privileges it needs (no <code>DROP</code>, no <code>SUPERUSER</code>) so a successful
          injection is contained, and remember that an ORM does not make you safe by itself — any
          raw-SQL or native-query escape hatch reintroduces the same risk.
        </p>
      </InfoBox>

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
          In standard SQL you can't reference a SELECT alias in <code>WHERE</code>,{' '}
          <code>GROUP BY</code>, or <code>HAVING</code>, because SELECT is processed{' '}
          <em>after</em> all three. <code>ORDER BY</code> runs after SELECT, so it is the one
          clause where the alias is always legal.
        </p>
        <p>
          PostgreSQL adds one extension worth knowing precisely: it <strong>does</strong> accept an
          output-column name in <code>GROUP BY</code> (and an ordinal position, e.g.{' '}
          <code>GROUP BY 1</code>) — that is why <code>GROUP BY 1, 2</code> appears all over this
          site. It still does <em>not</em> accept aliases in <code>WHERE</code> or{' '}
          <code>HAVING</code>. Note the resolution rule: if a name matches both an input column and
          an output alias, <code>GROUP BY</code> picks the <em>input</em> column, so shadowing a
          real column name with an alias is a good way to confuse yourself.
        </p>
        <p>
          To filter on a computed column, repeat the expression or — better — wrap it in a CTE or
          subquery and filter the outer query. That works everywhere and stays readable.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Logical order is a meaning, not a plan">
        <p>
          One clarification that saves a lot of confusion later. The order above defines what a
          query <strong>means</strong> — which names are visible where, and what the result must be.
          It is emphatically <em>not</em> a description of what the database does at runtime.
        </p>
        <p>
          SQL is declarative: you state the result you want, and the planner is free to compute it
          any way that produces the same answer. It routinely reorders joins, pushes a{' '}
          <code>WHERE</code> predicate down into an index so filtered rows are never read at all,
          evaluates <code>LIMIT</code> early enough to stop a scan after twenty rows, and skips{' '}
          <code>ORDER BY</code> entirely when an index already returns rows in that order. A{' '}
          <code>LIMIT 10</code> on a billion-row table does not sort a billion rows first, even
          though the logical order says sorting happens before limiting.
        </p>
        <p>
          Keep the two models separate and both become useful: <strong>logical order answers
          &quot;why is this query illegal / why is this alias not visible&quot;</strong>, and{' '}
          <strong><code>EXPLAIN</code> answers &quot;why is this query slow&quot;</strong>. Reading
          plans is covered in the Indexing lesson.
        </p>
      </InfoBox>

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

-- For non-unique sort columns, use a tiebreaker (Postgres row-value comparison)
SELECT * FROM orders
WHERE (created_at, id) < ('2024-01-15T10:30:00Z', 98765)
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
      </CodeBlock>

      <InfoBox variant="info" title="Row-value comparison is lexicographic, not column-by-column AND">
        <p>
          <code>(created_at, id) &lt; (x, y)</code> does <strong>not</strong> mean{' '}
          <code>created_at &lt; x AND id &lt; y</code>. It compares like a tuple (the same rule
          Python or a dictionary sort uses): compare <code>created_at</code> to <code>x</code>{' '}
          first; if they differ, that decides the result and <code>id</code> is never even looked
          at; only if <code>created_at</code> equals <code>x</code> does it fall through to compare{' '}
          <code>id</code> to <code>y</code>.
        </p>
        <p>
          That is exactly why it works as a pagination cursor. Most rows differ on{' '}
          <code>created_at</code> alone and the comparison stops there. The <code>id</code>{' '}
          column only matters for the rare case of two rows sharing the same{' '}
          <code>created_at</code> — which is precisely the tie a single-column{' '}
          <code>WHERE created_at &lt; ...</code> cursor would otherwise skip or duplicate across
          pages.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Given the SQL logical execution order, which clause can reference a SELECT column alias in standard SQL — and in every engine?"
        options={[
          'WHERE',
          'GROUP BY',
          'HAVING',
          'ORDER BY',
        ]}
        correctIndex={3}
        explanation="ORDER BY is processed after SELECT, so it can always reference SELECT aliases. WHERE, GROUP BY, and HAVING all execute before SELECT in the logical order. Postgres-specific footnote: Postgres additionally accepts an output-column name or ordinal (GROUP BY 1) in GROUP BY as a non-standard extension — but never in WHERE or HAVING."
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
        question={"Why prefer GENERATED ALWAYS AS IDENTITY over SERIAL for new Postgres schemas?"}
        options={[
          'IDENTITY is faster at insert time',
          'IDENTITY is SQL-standard syntax and integrates more cleanly with permissions and table renames',
          'SERIAL was removed in Postgres 15',
          'IDENTITY supports UUID types and SERIAL does not',
        ]}
        correctIndex={1}
        explanation="SERIAL is Postgres-specific sugar that creates a sequence and default behind the scenes, but it's non-standard and has quirks around ownership and renaming. GENERATED ALWAYS AS IDENTITY is the SQL-standard way to get the same auto-increment behavior, available since Postgres 10."
        language="sql"
      />
    </LessonLayout>
  );
}
