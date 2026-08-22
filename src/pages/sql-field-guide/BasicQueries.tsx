import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideBasicQueries() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="SQL · Field Reference"
      title="Basic Queries"
      tagline="Table creation, CRUD, and filtering — the PostgreSQL syntax you reach for every single day."
      meta={['PostgreSQL 18+', '14 patterns']}
      footerLabel="Personal study reference — PostgreSQL"
      pageLabel="SQL Field Guide · Basic Queries"
      prev={null}
      next={{ path: '/sql-field-guide/advanced-queries', label: 'Advanced Queries' }}
    >
      <PosterCard
        glyph="Id"
        title={<>IDENTITY <span className="dim">primary keys</span></>}
        language="sql"
        code={`CREATE TABLE users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`}
        caption="Prefer GENERATED ALWAYS AS IDENTITY over SERIAL for new tables — it's the SQL-standard way and avoids SERIAL's sequence-ownership quirks."
      />

      <PosterCard
        glyph="Cs"
        title={<>CHECK <span className="dim">constraints</span></>}
        language="sql"
        code={`ALTER TABLE products
  ADD CONSTRAINT chk_price_positive
  CHECK (price > 0);`}
        caption="Name constraints explicitly — an auto-generated name like products_price_check is painful to find in a wall of error logs."
      />

      <PosterCard
        glyph="Up"
        title={<>ON CONFLICT <span className="dim">upsert</span></>}
        language="sql"
        code={`INSERT INTO users (email, name)
VALUES ('a@x.com', 'Alice')
ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name;`}
        caption="Postgres-only. EXCLUDED refers to the row that would have been inserted — no other database spells upsert this way."
      />

      <PosterCard
        glyph="Rt"
        title={<>RETURNING <span className="dim">clause</span></>}
        language="sql"
        code={`INSERT INTO orders (customer_id, total)
VALUES (1, 59.99)
RETURNING id, created_at;`}
        caption="Skip the round-trip SELECT after an INSERT/UPDATE/DELETE — get generated values back in the same statement."
      />

      <PosterCard
        glyph="Il"
        title={<>ILIKE <span className="dim">case-insensitive</span></>}
        language="sql"
        code={`SELECT * FROM users
WHERE email ILIKE '%@GMAIL.COM';`}
        caption="LIKE is case-sensitive; ILIKE is Postgres's case-insensitive variant. No LOWER() gymnastics needed for simple matches."
      />

      <PosterCard
        glyph="Do"
        title={<>DISTINCT ON <span className="dim">top-1-per-group</span></>}
        language="sql"
        code={`SELECT DISTINCT ON (customer_id) *
FROM orders
ORDER BY customer_id, created_at DESC;`}
        caption="Postgres-only shortcut for 'latest row per group' — no window function or subquery needed for the N=1 case."
      />

      <PosterCard
        glyph="Wh"
        title={<>WHERE <span className="dim">vs</span> HAVING</>}
        language="sql"
        code={`SELECT department, COUNT(*) senior_count
FROM employees
WHERE level = 'Senior'    -- filters ROWS
GROUP BY department
HAVING COUNT(*) > 5;       -- filters GROUPS

-- Aliases: ORDER BY always sees them; WHERE and HAVING never do.
-- GROUP BY is the Postgres exception — it ACCEPTS an output alias
-- (and an ordinal) as a non-standard extension:
SELECT date_trunc('month', ordered_at) AS m, SUM(total)
FROM orders GROUP BY m;    -- equally legal: GROUP BY 1
-- On a name clash, GROUP BY resolves to the INPUT column.`}
        caption="WHERE runs before GROUP BY; HAVING runs after. Filtering on an aggregate always means HAVING, never WHERE. The one crack in the tidy 'aliases don't exist yet' story: Postgres does accept a SELECT alias or ordinal in GROUP BY — just never in WHERE or HAVING."
      />

      <PosterCard
        glyph="Ft"
        title={<>FILTER <span className="dim">conditional aggregates</span></>}
        language="sql"
        code={`SELECT department,
  COUNT(*) FILTER (WHERE level = 'Senior') AS seniors,
  COUNT(*) AS total
FROM employees
GROUP BY department;`}
        caption="Postgres's FILTER (WHERE ...) beats CASE-based conditional aggregation for readability — works on any aggregate function."
      />

      <PosterCard
        glyph="Ex"
        title={<>NOT EXISTS <span className="dim">over NOT IN</span></>}
        language="sql"
        code={`SELECT * FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = o.customer_id
);`}
        caption="NOT IN silently returns zero rows if the subquery contains even one NULL. NOT EXISTS handles NULLs correctly — always."
      />

      <PosterCard
        glyph="Ks"
        title={<>Keyset <span className="dim">pagination</span></>}
        language="sql"
        code={`SELECT * FROM orders
WHERE (created_at, id) < (:last_ts, :last_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;`}
        caption="OFFSET 100000 forces the DB to scan and discard 100K rows. Keyset pagination seeks directly via the index instead."
      />

      <PosterCard
        glyph="Up2"
        title={<>UPDATE <span className="dim">... FROM</span></>}
        language="sql"
        code={`UPDATE employees e
SET department = d.new_name
FROM department_renames d
WHERE e.department = d.old_name;`}
        caption="Postgres's join-based UPDATE syntax — the FROM clause lets you update one table based on another without a subquery."
      />

      <PosterCard
        glyph="Tr"
        title={<>TRUNCATE <span className="dim">vs</span> DELETE</>}
        language="sql"
        code={`DELETE FROM temp_imports;     -- row-by-row, leaves bloat for VACUUM
TRUNCATE TABLE temp_imports;  -- O(1); still transactional, still rollback-able

-- Sequences are NOT reset unless you ask:
TRUNCATE TABLE temp_imports RESTART IDENTITY;`}
        caption="For a full-table wipe TRUNCATE is dramatically faster — it deallocates pages instead of marking rows dead. Two myths: in Postgres it IS transactional (BEGIN; TRUNCATE; ROLLBACK; restores the rows), and it does NOT reset IDENTITY/SERIAL without RESTART IDENTITY. It does take an ACCESS EXCLUSIVE lock."
      />

      <PosterCard
        glyph="Set"
        title={<>UNION / INTERSECT <span className="dim">/ EXCEPT</span></>}
        language="sql"
        code={`-- Joins add COLUMNS. Set operations stack ROWS.
SELECT email FROM customers
UNION ALL                 -- keeps duplicates; no dedup pass. Default to this.
SELECT email FROM leads;

SELECT id FROM customers
EXCEPT                    -- in the first query, not the second
SELECT customer_id FROM orders;`}
        caption="Plain UNION deduplicates, which costs a full sort/hash — use UNION ALL unless you actually need it. EXCEPT/INTERSECT compare with IS NOT DISTINCT FROM, so two NULLs match: that makes EXCEPT a NULL-safe anti-join where NOT IN is not."
      />

      <PosterCard
        glyph="Prm"
        title={<>Parameterize <span className="dim">— never concatenate</span></>}
        language="sql"
        code={`-- Input:  ' OR '1'='1     concatenated into the query string:
SELECT * FROM users WHERE email = '' OR '1'='1';  -- returns EVERY user

-- Parameterized: query and values travel separately, so input
-- can never become syntax.
PREPARE find_user (text) AS
  SELECT id, email FROM users WHERE email = $1;`}
        caption="Placeholders only work for VALUES. Table names, column names and ORDER BY direction cannot be parameterized — validate those against an allowlist you control, never by escaping. An ORM's raw-query escape hatch reintroduces the whole risk."
      />

      <PosterQuickRef
        title="Which basic query pattern do I need?"
        rows={[
          { need: 'Auto-incrementing primary key', answer: 'id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY' },
          { need: 'Insert-or-update in one statement', answer: 'INSERT ... ON CONFLICT (col) DO UPDATE SET ...' },
          { need: 'Get generated ID back after INSERT', answer: 'INSERT ... RETURNING id' },
          { need: 'Case-insensitive text match', answer: 'ILIKE' },
          { need: 'Latest row per group', answer: 'SELECT DISTINCT ON (group_col) * ORDER BY group_col, ts DESC' },
          { need: 'Filter after aggregation', answer: 'HAVING, never WHERE' },
          { need: 'Group by a computed SELECT expression', answer: 'Postgres accepts the alias or ordinal in GROUP BY (never in WHERE/HAVING)' },
          { need: 'Conditional COUNT/SUM', answer: 'COUNT(*) FILTER (WHERE condition)' },
          { need: '"Not in this list" that handles NULLs safely', answer: 'NOT EXISTS, never NOT IN' },
          { need: 'Paginate past page 100 efficiently', answer: 'Keyset pagination, not OFFSET' },
          { need: 'Wipe an entire table fast', answer: 'TRUNCATE TABLE (add RESTART IDENTITY to reset sequences)' },
          { need: 'Stack two result sets on top of each other', answer: 'UNION ALL (plain UNION only when you need the dedup)' },
          { need: 'Safely put user input into a query', answer: 'Parameter placeholders; allowlist for identifiers' },
        ]}
      />
    </PosterLayout>
  );
}
