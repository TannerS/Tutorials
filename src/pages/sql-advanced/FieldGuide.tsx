import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function SqlAdvancedFieldGuide() {
  return (
    <GuideLayout
      title="PostgreSQL"
      kicker="FIELD GUIDE"
      glyph="🗄️"
      tagline="Query shapes, index rules, schema patterns, and the concurrency traps you reach for daily — condensed from the four SQL Advanced lessons."
      meta={['PostgreSQL 12–18', 'verified through 18.6', '19 panels']}
      page="1 / 1"
      footer="This page is for recall. The reasoning, the worked examples, and the verified benchmarks live in the four lessons above it."
      prev={{ path: '/sql-advanced/advanced', label: 'Advanced SQL Patterns' }}
      next={null}
    >
      <GuidePanel n={1} title="Identity, Constraints & RETURNING" accent="blue" glyph="🆔" span={2}>
        <GuideCode>{`CREATE TABLE users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products
  ADD CONSTRAINT chk_price_positive CHECK (price > 0);

INSERT INTO orders (customer_id, total)
VALUES (1, 59.99)
RETURNING id, created_at;`}</GuideCode>
        <GuideDefs
          items={[
            ['GENERATED ALWAYS AS IDENTITY', 'prefer over SERIAL — SQL-standard, avoids sequence-ownership quirks'],
            ['Named constraints', 'chk_price_positive beats an auto-generated products_price_check in a log'],
            ['TIMESTAMPTZ', 'default everywhere — plain TIMESTAMP means "whatever timezone the writer assumed"'],
            ['RETURNING', 'skip the round-trip SELECT after INSERT/UPDATE/DELETE'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={2} title="Upsert & UPDATE ... FROM" accent="purple" glyph="🔀">
        <GuideCode>{`INSERT INTO users (email, name)
VALUES ('a@x.com', 'Alice')
ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name;

UPDATE employees e
SET department = d.new_name
FROM department_renames d
WHERE e.department = d.old_name;`}</GuideCode>
        <GuideRules
          items={[
            'EXCLUDED refers to the row that would have been inserted — no other engine spells upsert this way.',
            'ON CONFLICT for a single unique-key upsert; MERGE only for multiple WHEN-branches (see Advanced SQL Patterns).',
            'FROM lets an UPDATE join another table without a subquery.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={3} title="Filtering: WHERE vs HAVING" accent="green" glyph="🔎">
        <GuideCode>{`SELECT * FROM users WHERE email ILIKE '%@GMAIL.COM';

SELECT department, COUNT(*) senior_count
FROM employees
WHERE level = 'Senior'     -- filters ROWS
GROUP BY department
HAVING COUNT(*) > 5;        -- filters GROUPS

SELECT date_trunc('month', ordered_at) AS m, SUM(total)
FROM orders GROUP BY m;     -- alias OK here only`}</GuideCode>
        <GuideDefs
          items={[
            ['ILIKE', 'case-insensitive LIKE, Postgres-only — no LOWER() gymnastics needed'],
            ['WHERE / HAVING', 'WHERE runs before GROUP BY; filtering an aggregate is always HAVING'],
            ['GROUP BY alias/ordinal', 'a Postgres extension — legal in GROUP BY, never in WHERE or HAVING'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={4} title="FILTER & Set Operations" accent="amber" glyph="🧮">
        <GuideCode>{`SELECT department,
  COUNT(*) FILTER (WHERE level = 'Senior') AS seniors,
  COUNT(*) AS total
FROM employees GROUP BY department;

SELECT email FROM customers
UNION ALL              -- keeps dupes; default to this
SELECT email FROM leads;

SELECT id FROM customers
EXCEPT
SELECT customer_id FROM orders;`}</GuideCode>
        <GuideRules
          items={[
            'FILTER (WHERE ...) beats CASE-based conditional aggregation — works on any aggregate.',
            'Plain UNION dedups (a full sort/hash) — default to UNION ALL unless you need it.',
            'EXCEPT/INTERSECT compare IS NOT DISTINCT FROM — two NULLs match, unlike NOT IN.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={5} title="The NULL Traps" accent="pink" glyph="⚠️" span={2}>
        <GuideCode>{`-- If customers.id has ANY null, this returns ZERO rows
SELECT * FROM orders
WHERE customer_id NOT IN (SELECT id FROM customers);

SELECT * FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = o.customer_id
);

SELECT * FROM orders o
WHERE EXISTS (
  SELECT 1 FROM customers c
  WHERE c.id = o.customer_id AND c.region = 'US'
);`}</GuideCode>
        <GuideRules
          items={[
            "NOT IN (1, 2, NULL) evaluates to UNKNOWN for every row — arguably SQL's most dangerous trap. Always NOT EXISTS.",
            'Modern Postgres plans IN (subquery) and EXISTS identically — both become semi-joins. "EXISTS is faster" is Oracle-era folklore; pick on readability.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={6} title="Pagination & Row Constructors" accent="cyan" glyph="📄">
        <GuideCode>{`-- Keyset: seeks via the index instead of scan-and-discard
SELECT * FROM orders
WHERE (created_at, id) < (:last_ts, :last_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Scans and discards 100,000 rows before returning any
SELECT * FROM orders ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;`}</GuideCode>
        <GuideRules
          items={[
            'Tuple comparison (a, b) < (x, y) beats nested OR logic for compound cursors.',
            'OFFSET cost grows linearly with depth — past a few thousand rows, switch to keyset.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={7} title="TRUNCATE vs DELETE & Parameterize" accent="red" glyph="🧹">
        <GuideCode>{`DELETE FROM temp_imports;      -- row-by-row, leaves bloat for VACUUM
TRUNCATE TABLE temp_imports;   -- O(1); still transactional/rollback-able
TRUNCATE TABLE temp_imports RESTART IDENTITY;  -- sequences NOT reset otherwise

PREPARE find_user (text) AS
  SELECT id, email FROM users WHERE email = $1;`}</GuideCode>
        <GuideRules
          items={[
            'TRUNCATE IS transactional in Postgres (BEGIN; TRUNCATE; ROLLBACK restores the rows) but takes ACCESS EXCLUSIVE.',
            'Placeholders only bind VALUES — table/column names and ORDER BY direction need an allowlist, never string-building.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={8} title="Joins Recall" accent="blue" glyph="🔗" span={2}>
        <GuideCode>{`-- Anti-join: departments with NO employees
SELECT d.* FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
WHERE e.id IS NULL;

-- Diff two datasets
SELECT COALESCE(a.id, b.id) id, a.total, b.total
FROM system_a a
FULL OUTER JOIN system_b b ON a.id = b.id
WHERE a.id IS NULL OR b.id IS NULL OR a.total <> b.total;

-- WRONG: order total multiplied by item count
SELECT c.name, SUM(o.total)
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.name;`}</GuideCode>
        <GuideRules
          items={[
            'LEFT JOIN + WHERE right.id IS NULL is the standard anti-join shape.',
            'FULL OUTER JOIN keeps unmatched rows from both sides — the standard diff shape.',
            'A 1:N join before aggregating silently inflates SUM/COUNT — aggregate first, or join to a pre-aggregated subquery.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={9} title="Window Functions: Ranking & Ties" accent="purple" glyph="🏅">
        <GuideCode>{`WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY department ORDER BY salary DESC
  ) rn FROM employees
)
SELECT * FROM ranked WHERE rn <= 3;

-- salaries 500, 400, 400, 300, 200
ROW_NUMBER()  -- 1,2,3,4,5   arbitrary tiebreak
RANK()        -- 1,2,2,4,5   ties share, then SKIPS
DENSE_RANK()  -- 1,2,2,3,4   ties share, no gap`}</GuideCode>
        <GuideRules
          items={[
            'Top-N per group = ROW_NUMBER + filter WHERE rn <= N.',
            "ROW_NUMBER's tiebreak is non-deterministic without a unique column in ORDER BY — add one, or 'top 3' changes between refreshes.",
            'NTILE(4) over 10 rows gives buckets 3,3,2,2 — remainder to EARLIER buckets. Poor percentile on small partitions; use PERCENT_RANK()/CUME_DIST() instead.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={10} title="Window Functions: Frames & LAG/LEAD" accent="green" glyph="🪟">
        <GuideCode>{`SELECT month, revenue,
  revenue - LAG(revenue) OVER (ORDER BY month) AS mom_change
FROM monthly_revenue;

SELECT date, amount,
  SUM(amount) OVER (
    ORDER BY date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM transactions;`}</GuideCode>
        <GuideRules
          items={[
            'LAG/LEAD compare a row to a neighboring row without a self-join.',
            'Omit the frame and the default is RANGE, not ROWS — identical until ORDER BY has ties, then all tied peers enter at once. Spell out ROWS whenever duplicates are possible.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={11} title="CTEs & Recursive CTEs" accent="amber" glyph="🌳" span={2}>
        <GuideCode>{`WITH monthly AS (
  SELECT DATE_TRUNC('month', ordered_at) m, SUM(total) rev
  FROM orders GROUP BY 1
)
SELECT * FROM monthly WHERE rev < 1000;

WITH RECURSIVE org AS (
  SELECT id, manager_id, 1 depth FROM employees WHERE id = 100
  UNION ALL
  SELECT e.id, e.manager_id, o.depth + 1
  FROM employees e JOIN org o ON e.manager_id = o.id
)
SELECT * FROM org;

WITH moved AS (
  DELETE FROM orders WHERE status = 'done' RETURNING *
)
INSERT INTO orders_archive SELECT * FROM moved;`}</GuideCode>
        <GuideRules
          items={[
            'Base case UNION ALL recursive case; always cap depth (WHERE depth < N) or use 14+’s CYCLE clause.',
            'Postgres 12+ inlines single-use, non-recursive CTEs automatically — AS MATERIALIZED forces the old optimization fence.',
            'Writable CTEs chain DELETE/UPDATE/INSERT + RETURNING atomically — standard SQL CTEs are read-only; this is a Postgres extension.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={12} title="LATERAL, Pivot & GROUPING SETS" accent="pink" glyph="🧩" span={2}>
        <GuideCode>{`SELECT c.name, o.*
FROM customers c
CROSS JOIN LATERAL (
  SELECT * FROM orders o
  WHERE o.customer_id = c.id
  ORDER BY ordered_at DESC LIMIT 3
) o;

SELECT
  EXTRACT(QUARTER FROM ordered_at) q,
  SUM(total) FILTER (WHERE category = 'Elec') electronics,
  SUM(total) FILTER (WHERE category = 'Food') food
FROM orders GROUP BY 1;

SELECT department, level, COUNT(*)
FROM employees
GROUP BY GROUPING SETS (
  (department, level), (department), ()
);`}</GuideCode>
        <GuideRules
          items={[
            'LATERAL lets a FROM subquery reference an earlier table in the same FROM — the go-to for indexed top-N-per-group.',
            'No PIVOT keyword — FILTER-per-column inside one aggregate query is the idiomatic cross-tab.',
            'GROUPING SETS/ROLLUP compute several aggregation levels in one query; GROUPING(col) = 1 tells a rolled-up NULL from a real NULL.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={13} title="Schema Patterns" accent="cyan" glyph="🗂️" span={3}>
        <GuideCode>{`-- Soft delete: partial unique index lets a reused email pass
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE UNIQUE INDEX idx_users_email_active
  ON users (email) WHERE deleted_at IS NULL;

-- Multi-tenant: RLS as the database-enforced backstop
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant')::int);`}</GuideCode>
        <GuideDefs
          items={[
            ['3NF / BCNF', 'the practical OLTP target — denormalize deliberately for OLAP, not by accident'],
            ['Polymorphic FK anti-pattern', "a string + ID pair can't be enforced by the database — use a real join table per parent type"],
            ['EAV anti-pattern', 'loses types/constraints, chains self-joins — JSONB + GIN is the pragmatic middle ground'],
            ['Soft delete', 'a full-table UNIQUE would block reusing the email — a partial index scoped to active rows fixes it'],
            ['Multi-tenant isolation', 'default to shared schema + tenant_id + RLS; step up to schema- or database-per-tenant only for contractual isolation'],
            ['Event sourcing', 'append-only *_events table + sequence_number — current state is derived, not stored; snapshot periodically'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={14} title="Hierarchies & Indexing" accent="blue" glyph="⚡" span={2}>
        <GuideCode>{`-- Adjacency list: cheapest writes, needs a recursive CTE per read
CREATE TABLE categories (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id INT REFERENCES categories(id)
);

-- Composite index: equality columns first, range column LAST
-- WHERE status = ? AND customer_id = ? AND created_at > ?
CREATE INDEX idx_orders_lookup ON orders (status, customer_id, created_at);

-- Covering: leaf pages carry extra columns, no heap touch at all
CREATE INDEX idx_orders_covering ON orders (status, customer_id)
  INCLUDE (total, shipping_address);`}</GuideCode>
        <GuideRules
          items={[
            'ltree extension: fast indexed subtree/ancestor queries once adjacency-list reads get expensive on a deep tree.',
            'Left-prefix rule — (a,b,c) seeks for (a), (a,b), (a,b,c); design as if (b) or (c) alone cannot use it.',
            'Partial index (WHERE status = \'pending\') keeps the index a fraction of full-table size.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={15} title="Constraints Beyond UNIQUE" accent="purple" glyph="🔐" span={2}>
        <GuideCode>{`CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE bookings (
  room_id INT NOT NULL,
  during  TSTZRANGE NOT NULL,
  EXCLUDE USING GIST (room_id WITH =, during WITH &&)
);

-- PG15+: make NULLs collide instead of each being distinct
UNIQUE NULLS NOT DISTINCT (tenant_id, external_ref)

line_total NUMERIC(12,2)
  GENERATED ALWAYS AS (quantity * unit_price) STORED`}</GuideCode>
        <GuideRules
          items={[
            "EXCLUDE expresses 'no two overlapping ranges' — not an equality rule, so UNIQUE can't say it; race-proof unlike SELECT-then-INSERT.",
            'Pre-PG15: two partial unique indexes (WHERE col IS NULL / IS NOT NULL) substitute for NULLS NOT DISTINCT.',
            'PG18 made VIRTUAL the default generated-column kind — an omitted STORED now silently gives an unindexable virtual column. Write STORED explicitly.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={16} title="Transaction & Concurrency Gotchas" accent="red" glyph="🔒" span={3}>
        <GuideTable
          head={['Symptom', 'Cause', 'Fix']}
          rows={[
            ['Every statement after one failure also errors', 'A failed statement aborts the WHOLE transaction (stricter than MySQL)', 'ROLLBACK, or wrap risky statements in a SAVEPOINT'],
            ['Two identical SELECTs in one transaction disagree', 'READ COMMITTED (the default) takes a fresh snapshot every STATEMENT', 'REPEATABLE READ freezes one snapshot at the first statement'],
            ['Transaction randomly fails with error 40001', 'SERIALIZABLE (SSI) detected an unsafe concurrent pattern', 'Catch serialization_failure and retry — expected, not a bug'],
            ['Query randomly fails with error 40P01', 'Deadlock — two transactions acquired the same rows in different orders', 'SELECT ... ORDER BY id FOR UPDATE to lock rows in a consistent order first'],
          ]}
        />
        <GuideRules
          items={[
            'Postgres only implements three of the four standard isolation levels — READ UNCOMMITTED silently becomes READ COMMITTED, since MVCC makes dirty reads structurally impossible.',
            'The frozen snapshot under REPEATABLE READ/SERIALIZABLE is taken at the FIRST STATEMENT, not at BEGIN — an idle BEGIN still sees fresh data until you query.',
            'Full isolation-level and locking depth: the Transactions & Locking lesson.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={17} title="Operational Gotchas" accent="amber" glyph="🚧" span={3}>
        <GuideDefs
          items={[
            ['Missing FK index', 'Postgres auto-indexes the PK, never a FK — add it manually or joins/cascade deletes seq-scan'],
            ['TIMESTAMP vs TIMESTAMPTZ', 'plain TIMESTAMP means "whatever timezone the writer assumed" — default to TIMESTAMPTZ everywhere'],
            ['UPDATE never mutates in place', 'MVCC writes a brand-new row version even for col = col — normal, tune autovacuum on heavy-churn tables'],
            ['Transaction ID (XID) wraparound', '32-bit counter — watch age(datfrozenxid) on long-lived, high-write databases'],
            ['Index bloat', 'dead index entries from UPDATE/DELETE churn — REINDEX CONCURRENTLY, tune autovacuum on hot tables'],
            ['Identifier folding', 'unquoted names fold to lowercase; a quoted "Users" at CREATE forces quoting forever after — use snake_case'],
            ['RLS bypassed by owner', 'table owners and superusers skip row-level security by default — ALTER TABLE ... FORCE ROW LEVEL SECURITY'],
            ['Migration lock queue', 'statement_timeout alone does not stop DDL from queuing for a lock and blocking every reader behind it — set lock_timeout low on DDL'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={18} title="Diagnosing Performance" accent="pink" glyph="🩺" span={2}>
        <GuideCode>{`SELECT calls, total_exec_time, mean_exec_time, stddev_exec_time, query
FROM pg_stat_statements
ORDER BY total_exec_time DESC   -- NOT mean_exec_time
LIMIT 20;

-- ❌ wrapped column can't be seeked
WHERE lower(email) = 'a@x.com'
-- ✅ index the expression instead
CREATE INDEX ON users (lower(email));`}</GuideCode>
        <GuideRules
          items={[
            'Sort by total_exec_time, not mean — a 5ms query run 10M times costs more than a 2s report run twice a day.',
            'cost=A..B is startup..total in arbitrary planner units, not milliseconds — only comparable to rejected plans.',
            'actual time and rows are PER LOOP — rows=3 loops=10000 is 30,000 rows, not 3.',
            'PG18+: EXPLAIN ANALYZE enables BUFFERS implicitly (verified: 18.6 prints Buffers with no option given, 17.11 prints none).',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={19} title="What Do I Reach For?" accent="green" glyph="🧭" span={3}>
        <GuideTable
          head={['Need', 'Reach for']}
          rows={[
            ['New table’s primary key', 'id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY (UUID only when IDs must be unguessable/client-generated)'],
            ['Insert-or-update a row', 'ON CONFLICT for one unique key; MERGE only for multiple WHEN-branches'],
            ['Top-N per group', 'ROW_NUMBER + filter for N > 1; DISTINCT ON for N = 1; LATERAL + LIMIT at scale'],
            ['Page through a large result set', 'Keyset pagination past the first few pages; OFFSET only for shallow UI paging'],
            ['Model a hierarchy', 'Adjacency list + WITH RECURSIVE by default; ltree once you need fast subtree AND ancestor reads'],
            ['Store dynamic attributes', 'JSONB + GIN for genuinely variable metadata; real columns for anything filtered/sorted/joined often; never EAV'],
            ['Pick an index type', 'B-tree covers 90% of cases; GIN for arrays/JSONB/full-text; GiST for geometry/ranges; BRIN for huge, physically-ordered time-series'],
            ['Add text search', "tsvector GENERATED ALWAYS AS (...) STORED + GIN; reach for Elasticsearch/Typesense only for fuzzy search at real scale"],
            ['Table growing without bound', 'Range-partition by date once bulk delete/retention gets painful (tens of millions of rows and up)'],
            ['Handle concurrent updates', 'Optimistic (version column) when conflicts are rare; FOR UPDATE / NOWAIT / SKIP LOCKED when they are frequent'],
            ['Serialize something that isn’t a row', 'pg_advisory_xact_lock(hashtext(name)) — released automatically at COMMIT/ROLLBACK'],
            ['Fastest way to check if a query uses an index', 'EXPLAIN (ANALYZE, BUFFERS) — Seq Scan vs Index Scan'],
            ['Fastest way to bulk-load data', 'COPY, not batched INSERTs'],
            ['Add NOT NULL to a huge table without an outage (PG18+)', 'nullable → ADD CONSTRAINT ... NOT NULL col NOT VALID → backfill in batches → VALIDATE CONSTRAINT (only ShareUpdateExclusiveLock)'],
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}
