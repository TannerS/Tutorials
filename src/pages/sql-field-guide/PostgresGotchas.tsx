import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuidePostgresGotchas() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="SQL · Field Reference"
      title="Postgres Gotchas & Pitfalls"
      tagline="The traps that don't show up until production — NULLs, MVCC, locking, and silent data loss."
      meta={['PostgreSQL 17+', '15 pitfalls']}
      footerLabel="Personal study reference — PostgreSQL"
      pageLabel="SQL Field Guide · Postgres Gotchas & Pitfalls"
      prev={{ path: '/sql-field-guide/schema-design', label: 'Schema Design Patterns' }}
      next={{ path: '/sql-field-guide/quick-reference', label: 'Quick Reference' }}
    >
      <PosterCard
        glyph="!In"
        title={<>NOT IN <span className="dim">+ NULL = silent 0 rows</span></>}
        language="sql"
        code={`-- If customers.id has ANY null, this returns ZERO rows
SELECT * FROM orders
WHERE customer_id NOT IN (SELECT id FROM customers);
-- fix: NOT EXISTS instead`}
        caption="NOT IN (1, 2, NULL) evaluates to UNKNOWN for every row. This is arguably SQL's most dangerous trap — always use NOT EXISTS."
      />

      <PosterCard
        glyph="Dup"
        title={<>1:N join <span className="dim">inflates SUM</span></>}
        language="sql"
        code={`-- WRONG: order total multiplied by item count
SELECT c.name, SUM(o.total)
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.name;`}
        caption="Joining orders to order_items duplicates each order row per item — aggregate BEFORE joining, or the SUM silently inflates."
      />

      <PosterCard
        glyph="Abr"
        title={<>Aborted transaction <span className="dim">poisons the block</span></>}
        language="sql"
        code={`BEGIN;
  INSERT INTO a VALUES (1);  -- fails, e.g. constraint violation
  INSERT INTO b VALUES (2);  -- ERROR: current transaction is aborted
COMMIT;                       -- ROLLBACK happens anyway`}
        caption="Unlike MySQL, one failed statement poisons the ENTIRE Postgres transaction — every later statement errors until ROLLBACK, unless you used a SAVEPOINT."
      />

      <PosterCard
        glyph="Ser"
        title={<>SERIALIZABLE <span className="dim">can abort — must retry</span></>}
        language="sql"
        code={`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- (SET TRANSACTION ... only works INSIDE a transaction block,
--  before the first query. On its own it just warns and no-ops.)
-- app code MUST catch error 40001 (serialization_failure)
-- and retry the whole transaction`}
        caption="Postgres implements SERIALIZABLE via SSI: it aborts transactions it detects as unsafe, rather than silently corrupting data. Retrying is expected, not a bug."
      />

      <PosterCard
        glyph="Upd"
        title={<>UPDATE <span className="dim">never mutates in place</span></>}
        language="sql"
        code={`-- Every UPDATE writes a whole NEW row version (MVCC)
-- and marks the old one dead — even UPDATE t SET col = col
UPDATE big_table SET status = status;  -- still costs a full write`}
        caption="MVCC means UPDATE always creates a new tuple and updates every index, even for a logical no-op. Heavy UPDATE churn bloats tables — tune autovacuum."
      />

      <PosterCard
        glyph="Fk"
        title={<>Missing FK indexes <span className="dim">not automatic</span></>}
        language="sql"
        code={`-- Postgres indexes the PRIMARY KEY automatically.
-- It NEVER auto-indexes foreign keys — you must:
CREATE INDEX idx_orders_customer_id ON orders (customer_id);`}
        caption="A missing index on a foreign key column means every join and every ON DELETE CASCADE check does a sequential scan."
      />

      <PosterCard
        glyph="Ts"
        title={<>TIMESTAMP <span className="dim">without time zone</span></>}
        language="sql"
        code={`-- BAD: silently means 'whatever timezone the writer assumed'
created_at TIMESTAMP
-- GOOD: normalized to UTC internally, converted on read
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`}
        caption="Default to TIMESTAMPTZ everywhere. Plain TIMESTAMP is a recurring source of off-by-N-hours bugs across services in different timezones."
      />

      <PosterCard
        glyph="Dl"
        title={<>Deadlock <span className="dim">inconsistent lock order</span></>}
        language="sql"
        code={`-- TX1 locks row 1 then wants row 2; TX2 locks row 2 then wants row 1
-- FIX: take both locks up front, ordered by id, THEN do the work
SELECT id FROM accounts WHERE id IN (:from, :to)
ORDER BY id FOR UPDATE;

UPDATE accounts SET balance = balance - 100 WHERE id = :from;
UPDATE accounts SET balance = balance + 100 WHERE id = :to;`}
        caption="Deadlocks (error 40P01) happen when transactions acquire the same rows in different orders. Order the LOCKING, never the money — debiting LEAST(a,b) runs a transfer from 7 to 3 backwards."
      />

      <PosterCard
        glyph="Xid"
        title={<>Transaction ID wraparound</>}
        language="sql"
        code={`-- Monitor on long-lived, high-write databases:
SELECT datname, age(datfrozenxid) FROM pg_database
ORDER BY age(datfrozenxid) DESC;`}
        caption="Postgres's 32-bit XID counter can wrap around on ancient un-vacuumed tables, making committed rows look like they vanished. Watch datfrozenxid age."
      />

      <PosterCard
        glyph="Off"
        title={<>OFFSET <span className="dim">pagination collapse</span></>}
        language="sql"
        code={`-- Scans and discards 100,000 rows before returning any
SELECT * FROM orders ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;`}
        caption="OFFSET cost grows linearly with page depth. Past a few thousand rows, switch to keyset (cursor) pagination — it stays O(log n) via the index."
      />

      <PosterCard
        glyph="Bl"
        title={<>Index bloat <span className="dim">from MVCC churn</span></>}
        language="sql"
        code={`-- Symptom: index 2-10x larger than the data warrants
REINDEX INDEX CONCURRENTLY idx_orders_lookup;
-- prevention: tune autovacuum on write-heavy tables`}
        caption="Frequent UPDATE/DELETE leaves dead index entries that autovacuum must reclaim. Under-tuned autovacuum on hot tables lets bloat run away."
      />

      <PosterCard
        glyph="Case"
        title={<>Identifier folding <span className="dim">unquoted = lowercase</span></>}
        language="sql"
        code={`CREATE TABLE "Users" (id INT);   -- must ALWAYS be quoted now
SELECT * FROM Users;              -- ERROR: relation "users" does not exist`}
        caption="Unquoted identifiers are folded to lowercase. A quoted mixed-case table name at creation time forces every future reference to be quoted identically — just use snake_case."
      />

      <PosterCard
        glyph="Rls"
        title={<>RLS <span className="dim">bypassed by table owner</span></>}
        language="sql"
        code={`-- Table owners and superusers BYPASS row-level security by default!
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
-- forces policies to apply even to the table owner's own connection`}
        caption="Row-Level Security policies are silently skipped for the table owner unless you add FORCE ROW LEVEL SECURITY — a common false sense of isolation."
      />

      <PosterCard
        glyph="Lk"
        title={<>Migration lock queue <span className="dim">takes the site down</span></>}
        language="sql"
        code={`-- The ALTER waits behind one long transaction...
-- ...and EVERY later query then waits behind the ALTER.
SET lock_timeout = '3s';       -- time waiting TO ACQUIRE a lock
SET statement_timeout = '30s'; -- time the statement may RUN

ALTER TABLE orders ADD COLUMN notes text;

-- Permanent guardrails, per role:
ALTER ROLE app_web  SET statement_timeout = '15s';
ALTER ROLE migrator SET lock_timeout      = '3s';
ALTER ROLE app_web  SET idle_in_transaction_session_timeout = '30s';`}
        caption="These are two different clocks: statement_timeout alone does NOT stop a migration from sitting in the lock queue blocking every reader behind it. Set lock_timeout low on DDL — failing fast and retrying beats an outage."
      />

      <PosterCard
        glyph="Pss"
        title={<>Finding the slow query <span className="dim">— rank by total, not mean</span></>}
        language="sql"
        code={`CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT calls, total_exec_time, mean_exec_time,
       stddev_exec_time, query
FROM pg_stat_statements
ORDER BY total_exec_time DESC   -- NOT mean_exec_time
LIMIT 20;

-- "The site is down NOW": what's running?
SELECT pid, now() - query_start AS duration, wait_event_type, query
FROM pg_stat_activity WHERE state <> 'idle'
ORDER BY duration DESC;`}
        caption="A 5ms query run 10 million times costs more than a 2s report run twice a day — always sort by total_exec_time. High stddev means one query shape hits two different plans, and the mean hides it entirely."
      />

      <PosterQuickRef
        title="What's actually going wrong here?"
        rows={[
          { need: 'NOT IN subquery returns nothing unexpectedly', answer: 'The subquery contains a NULL — switch to NOT EXISTS' },
          { need: 'SUM() looks way too high', answer: 'A 1:N join duplicated rows before aggregation — aggregate first' },
          { need: "Every statement after one failure errors too", answer: 'The transaction is aborted — ROLLBACK or use a SAVEPOINT' },
          { need: 'Transaction randomly fails with error 40001', answer: 'SERIALIZABLE conflict — catch it and retry, this is expected' },
          { need: 'A "no-op" UPDATE is surprisingly expensive', answer: 'MVCC writes a new row version regardless — normal, tune autovacuum' },
          { need: 'A join or cascade delete is a sequential scan', answer: 'Foreign keys are not auto-indexed — add the index manually' },
          { need: 'Times are off by a fixed number of hours', answer: 'Column is TIMESTAMP, not TIMESTAMPTZ' },
          { need: 'Query randomly fails with error 40P01', answer: 'Deadlock — enforce a consistent lock acquisition order' },
          { need: 'Deep pagination pages get slower and slower', answer: 'OFFSET-based paging — switch to keyset pagination' },
          { need: 'RLS policy exists but data still leaks for one user', answer: 'That connection is the table owner — add FORCE ROW LEVEL SECURITY' },
          { need: 'A trivial migration froze the whole app', answer: 'DDL queued for a lock and everything queued behind it — SET lock_timeout' },
          { need: "Don't know which query to optimize", answer: 'pg_stat_statements ordered by total_exec_time' },
          { need: 'Query is usually fast but sometimes very slow', answer: 'High stddev_exec_time — one shape, two plans; check parameter selectivity' },
        ]}
      />
    </PosterLayout>
  );
}
