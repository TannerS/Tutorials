import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideQuickReference() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="SQL · Field Reference"
      title="What Do I Reach For?"
      tagline="A decision-first cheat sheet — the PostgreSQL tool for each recurring job, in one place."
      meta={['PostgreSQL 17+', '13 decisions']}
      footerLabel="Personal study reference — PostgreSQL"
      pageLabel="SQL Field Guide · What Do I Reach For?"
      prev={{ path: '/sql-field-guide/postgres-gotchas', label: 'Postgres Gotchas & Pitfalls' }}
      next={null}
    >
      <PosterCard
        glyph="Pk"
        title={<>New table's <span className="dim">primary key</span></>}
        language="sql"
        code={`id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`}
        caption="Reach for IDENTITY over SERIAL for anything new. Reach for UUID (gen_random_uuid()) only when IDs must be unguessable or generated client-side."
      />

      <PosterCard
        glyph="Up"
        title={<>Insert-or-update <span className="dim">a row</span></>}
        language="sql"
        code={`INSERT INTO t (...) VALUES (...)
ON CONFLICT (unique_col) DO UPDATE SET ...;`}
        caption="ON CONFLICT for a single unique-key upsert. Reach for MERGE only when you need multiple WHEN-branches (delete/update/insert) in one statement."
      />

      <PosterCard
        glyph="TopN"
        title={<>Top-N per group</>}
        language="sql"
        code={`ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC)
-- N = 1 only: DISTINCT ON (g) ... ORDER BY g, x DESC`}
        caption="ROW_NUMBER + filter for N > 1. DISTINCT ON for exactly the top row. LATERAL + LIMIT when you also need it index-efficient at scale."
      />

      <PosterCard
        glyph="Pg"
        title={<>Page through <span className="dim">a large result set</span></>}
        language="sql"
        code={`WHERE (sort_col, id) < (:last_val, :last_id)
ORDER BY sort_col DESC, id DESC LIMIT 20`}
        caption="Keyset pagination past the first few pages. OFFSET is fine for small, shallow, UI-only pagination — never for APIs or deep pages."
      />

      <PosterCard
        glyph="Tree"
        title={<>Model a <span className="dim">hierarchy</span></>}
        language="sql"
        code={`-- default: parent_id + WITH RECURSIVE
-- deep + fast subtree/ancestor reads: ltree extension
-- static, read-heavy, rare writes: nested set (lft/rgt)`}
        caption="Start with adjacency list. Reach for ltree once you need fast indexed subtree AND ancestor queries. Nested set only for near-static trees."
      />

      <PosterCard
        glyph="Dyn"
        title={<>Store <span className="dim">dynamic attributes</span></>}
        language="sql"
        code={`custom_attrs JSONB DEFAULT '{}'
CREATE INDEX ... USING GIN (custom_attrs)`}
        caption="JSONB + GIN for genuinely per-row-variable metadata. Real typed columns for anything filtered/sorted/joined on often. Never EAV."
      />

      <PosterCard
        glyph="Idx"
        title={<>Pick an <span className="dim">index type</span></>}
        language="sql"
        code={`-- equality/range/sort: B-tree (default)
-- arrays, JSONB, full-text: GIN
-- geometry, ranges, nearest-neighbor: GiST
-- huge + physically ordered (time-series): BRIN`}
        caption="B-tree covers 90% of cases. Reach for GIN the moment you're querying inside an array or JSONB column, or doing full-text search."
      />

      <PosterCard
        glyph="Search"
        title={<>Add <span className="dim">text search</span></>}
        language="sql"
        code={`search_vector TSVECTOR GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(body ,'')), 'B')
) STORED;
CREATE INDEX ... USING GIN (search_vector);`}
        caption="Postgres full-text search handles tens of millions of rows fine. The coalesce() is required — || propagates NULL, so one NULL body would blank the whole vector. The config must be a literal ('english'), since the 1-arg to_tsvector is only STABLE and generated columns demand IMMUTABLE. Reach for Elasticsearch/Typesense only for fuzzy/typo-tolerant search at real scale."
      />

      <PosterCard
        glyph="Big"
        title={<>Table growing <span className="dim">without bound</span></>}
        language="sql"
        code={`CREATE TABLE events (...) PARTITION BY RANGE (created_at);
-- DROP TABLE events_2023_11;  -- instant bulk delete`}
        caption="Range-partition by date once bulk deletes/retention become painful. Below tens of millions of rows, a good index usually beats the complexity."
      />

      <PosterCard
        glyph="Con"
        title={<>Handle <span className="dim">concurrent updates</span></>}
        language="sql"
        code={`-- rare conflicts, high throughput: optimistic (version column)
UPDATE t SET price = ?, version = version + 1
WHERE id = ? AND version = ?;   -- 0 rows updated = someone beat you

-- frequent conflicts: pessimistic. Then choose HOW it fails:
SELECT ... FOR UPDATE;              -- block until free (or lock_timeout)
SELECT ... FOR UPDATE NOWAIT;       -- error 55P03 immediately
SELECT ... FOR UPDATE SKIP LOCKED;  -- omit locked rows silently`}
        caption="Default to optimistic locking (a version column) when conflicts are rare. NOWAIT when 'someone else is editing this' is an answer you can put in front of the user right now. SKIP LOCKED for work queues only — it returns a deliberately incomplete set, so never reach for it where the row count has to be correct."
      />

      <PosterCard
        glyph="Adv"
        title={<>Serialize something <span className="dim">that isn&apos;t a row</span></>}
        language="sql"
        code={`BEGIN;
  -- released automatically at COMMIT/ROLLBACK — impossible to leak
  SELECT pg_advisory_xact_lock(hashtext('nightly-billing'));
  -- ... only one worker in the fleet is inside this block ...
COMMIT;

-- a cron that should SKIP rather than pile up: TRUE if acquired
SELECT pg_try_advisory_xact_lock(hashtext('nightly-billing'));`}
        caption="Advisory locks are named 64-bit mutexes Postgres tracks but attaches no meaning to — the distributed lock you already have, without adding Redis. Two jobs: single-runner enforcement, and locking a row that doesn't exist yet (FOR UPDATE can't lock what isn't there, so it can't serialize check-then-insert). Prefer the _xact_ variants: a session-scoped lock rides a pooled connection into the next request."
      />

      <PosterCard
        glyph="Ten"
        title={<>Isolate <span className="dim">tenant data</span></>}
        language="sql"
        code={`-- thousands of tenants: shared schema + tenant_id + RLS
-- dozens-hundreds, compliance need: schema-per-tenant
-- enterprise, hard isolation: database-per-tenant`}
        caption="Default to shared schema + Row-Level Security. Only step up to schema- or database-per-tenant when isolation is a contractual/regulatory requirement."
      />

      <PosterCard
        glyph="Hist"
        title={<>Need <span className="dim">full change history</span></>}
        language="sql"
        code={`-- occasional audit need: trigger -> append-only *_history table
-- history IS the product: event-sourcing append-only log
--   + periodic snapshots for fast current-state reads`}
        caption="A trigger-fed history table covers most audit requirements cheaply. Reach for full event sourcing only when time-travel/replay is a core feature, not an afterthought."
      />

      <PosterQuickRef
        title="One-line answers to the question you'll ask most"
        rows={[
          { need: 'Fastest way to check if a query uses an index', answer: 'EXPLAIN (ANALYZE, BUFFERS) — look for Seq Scan vs Index Scan' },
          { need: 'Fastest way to find an unused index', answer: 'SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0' },
          { need: 'Fastest way to bulk-load data', answer: 'COPY, not batched INSERTs' },
          { need: 'Safest way to add a NOT NULL column to a huge table', answer: 'Add nullable, backfill in batches, add a NOT VALID CHECK (col IS NOT NULL), VALIDATE it, then SET NOT NULL — PG12+ sees the proven CHECK and skips the full-table scan' },
          { need: 'Adding a column with a default to a huge table', answer: 'Safe since PG11 — a non-volatile DEFAULT is stored in the catalog, no table rewrite' },
          { need: 'Safest way to change isolation level app-wide', answer: "Don't — set it per-transaction only where the anomaly actually matters" },
          { need: 'How to avoid the N+1 query problem in Postgres', answer: 'LATERAL join or a single window-function query instead of one query per row' },
          { need: 'Only one instance may run this job', answer: 'pg_try_advisory_xact_lock(hashtext(name)) — exit quietly on FALSE' },
          { need: 'Pull jobs off a queue table with N workers', answer: 'FOR UPDATE SKIP LOCKED' },
          { need: 'Fail fast instead of blocking on a locked row', answer: 'FOR UPDATE NOWAIT — raises 55P03 immediately' },
        ]}
      />
    </PosterLayout>
  );
}
