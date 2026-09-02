import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Views() {
  return (
    <LessonLayout
      title="Views, Partitioning & Extensions"
      sectionId="sql-design-patterns"
      lessonIndex={5}
      prev={{ path: '/sql-design-patterns/json', label: 'JSON, JSONB & Full-Text Search' }}
      next={{ path: '/sql-advanced/transactions', label: 'Transactions & Locking' }}
    >
      <p>
        Three more tools that don't fit neatly under "indexing" or "schema patterns" but that you'll
        reach for constantly once tables get large or query logic gets repetitive: naming a query so
        app code doesn't repeat it, splitting one huge table into manageable physical pieces, and
        pulling in functionality Postgres core doesn't ship with by default. All three are
        genuinely load-bearing, everyday PostgreSQL — not exotica.
      </p>

      <h2>Standard Views — Naming a Query</h2>

      <p>
        A view is a stored query with a name. It has no storage of its own — every time you{' '}
        <code>SELECT</code> from it, Postgres substitutes the underlying query and plans/executes
        that instead. Common Schema Design Patterns already used one for exactly this reason: hiding{' '}
        <code>WHERE deleted_at IS NULL</code> behind an <code>active_users</code> view so app code
        can't forget the filter.
      </p>

      <CodeBlock language="sql" title="CREATE VIEW — basics and the CREATE OR REPLACE limit" showLineNumbers={true}>
{`CREATE VIEW recent_documents AS
SELECT id, title, metadata->>'author' AS author
FROM documents
ORDER BY id DESC;

SELECT * FROM recent_documents;   -- queried exactly like a table

-- Change the definition later without dropping dependent objects:
CREATE OR REPLACE VIEW recent_documents AS
SELECT id, title, metadata->>'author' AS author, metadata->>'tags' AS tags   -- OK: appended a column
FROM documents
ORDER BY id DESC;

-- Verified on PostgreSQL 18.6 — this is a hard error, not a warning:
CREATE OR REPLACE VIEW recent_documents AS
SELECT id, title FROM documents;
-- ERROR: cannot drop columns from view
-- CREATE OR REPLACE may only ADD columns at the end. Renaming, reordering,
-- or removing an existing output column requires DROP VIEW ... first
-- (which fails loudly if anything else depends on it — find out with
-- SELECT * FROM pg_depend WHERE refobjid = 'recent_documents'::regclass).`}
      </CodeBlock>

      <InfoBox variant="danger" title="Views silently bypass Row-Level Security — verified against Multi-Tenancy's RLS setup">
        <p>
          A view runs with its <strong>owner's</strong> privileges by default, the same way a{' '}
          <code>SECURITY DEFINER</code> function does — not the privileges of whoever queries it.
          Reproduced: an RLS-protected <code>orders</code> table with{' '}
          <code>FORCE ROW LEVEL SECURITY</code> correctly filtered a direct query from a non-owning
          role to only its tenant's row. A plain view over the same table, queried by that same role
          with that same tenant setting, returned <strong>every tenant's rows</strong> — the view's
          owner (who created it, typically during migrations) has no tenant, so no policy filtered
          anything.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          The fix, verified on the same setup: <code>ALTER VIEW recent_documents SET
          (security_invoker = true);</code> — a PostgreSQL 15+ option that makes the view run with
          the <em>querying</em> user's privileges instead of the owner's. With it set, the same query
          correctly returned only the calling tenant's row. If you put views in front of any
          RLS-protected table, set this explicitly — the default is the unsafe one.
        </p>
      </InfoBox>

      <h2>Materialized Views — Caching a Query's Result</h2>

      <p>
        A materialized view looks similar but is the opposite tradeoff: it <em>does</em> have its own
        storage. The query runs once, at creation or refresh time, and every read afterward just
        scans the stored result — fast, but stale until the next refresh.
      </p>

      <FlowChart
        title="View vs Materialized View"
        chart={"graph TD\n  Q{\"Can results be a periodic\\nsnapshot, or must every read\\nbe byte-fresh?\"} -->|\"Always fresh —\\nit's just a saved query\"| V[\"VIEW\\nno storage, re-runs\\nthe query every read\"]\n  Q -->|\"OK to be stale,\\nread speed matters\"| MV[\"MATERIALIZED VIEW\\nstores the result,\\nrefreshed on demand\"]\n  style V fill:#1a2744,stroke:#5b9cf6\n  style MV fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="sql" title="CREATE MATERIALIZED VIEW and refresh strategies" showLineNumbers={true}>
{`CREATE MATERIALIZED VIEW mv_doc_stats AS
SELECT
  metadata->>'author' AS author,
  COUNT(*) AS doc_count,
  SUM((metadata#>>'{stats,views}')::int) AS total_views
FROM documents
GROUP BY 1
WITH DATA;   -- populate immediately (WITH NO DATA leaves it empty and unqueryable until refreshed)

SELECT * FROM mv_doc_stats;   -- reads the STORED snapshot, not a live query

-- Default refresh: full rebuild, takes ACCESS EXCLUSIVE — blocks reads for
-- its duration (see the lock hierarchy in Transactions & Locking).
REFRESH MATERIALIZED VIEW mv_doc_stats;

-- CONCURRENTLY avoids the lock: it builds the new result set alongside the
-- old one and swaps, so reads continue against the old data mid-refresh.`}
      </CodeBlock>

      <InfoBox variant="warning" title="REFRESH ... CONCURRENTLY requires a unique index — verified error">
        <p>
          Attempting a concurrent refresh without one fails immediately, and the error names the
          exact fix (reproduced on 18.6):
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <code>ERROR: cannot refresh materialized view "public.mv_doc_stats" concurrently</code>
          <br />
          <code>HINT: Create a unique index with no WHERE clause on one or more columns of the
          materialized view.</code>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          The reason isn't arbitrary: a concurrent refresh diffs the freshly computed result against
          the stored one row-by-row (an <code>UPDATE</code>/<code>INSERT</code>/<code>DELETE</code>{' '}
          against the existing data, not a wholesale replace), and diffing needs a way to identify
          "the same row" between old and new — exactly what a unique index provides.
        </p>
        <CodeBlock language="sql" title="Fixed — verified on PostgreSQL 18.6">
{`CREATE UNIQUE INDEX idx_mv_doc_stats_author ON mv_doc_stats (author);
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doc_stats;   -- succeeds, no lock`}
        </CodeBlock>
      </InfoBox>

      <InfoBox variant="info" title="Materialized views are never auto-refreshed">
        <p>
          There's no built-in trigger-on-write or TTL — you refresh on a schedule (<code>pg_cron</code>,
          an external job) or in response to an event. Advanced SQL Patterns covers the incremental
          and trigger-based alternatives for when a periodic full refresh isn't fast enough.
        </p>
      </InfoBox>

      <h2>Table Partitioning</h2>

      <p>
        Partitioning splits one logical table into many physical pieces — transparent to queries,
        which still address the parent table by name. It earns its complexity once a table is large
        enough that maintenance (bulk deletes, index rebuilds, VACUUM) becomes painful on the whole
        thing at once — commonly cited as tens of millions of rows and up.
      </p>

      <FlowChart
        title="Partition Pruning: the Planner Skips What It Doesn't Need"
        chart={"graph TD\n  Query[\"WHERE requested_at >= '2026-02-01'\\nAND requested_at < '2026-03-01'\"] --> Planner{\"Planner checks\\neach partition's range\"}\n  Planner -->|\"outside range — SKIPPED\"| Jan[\"api_request_logs_2026_01\"]\n  Planner -->|\"matches — SCANNED\"| Feb[\"api_request_logs_2026_02\"]\n  Planner -->|\"outside range — SKIPPED\"| Mar[\"api_request_logs_2026_03\"]\n  style Query fill:#1a2744,stroke:#5b9cf6\n  style Feb fill:#1a3329,stroke:#4ade80\n  style Jan fill:#3d2f14,stroke:#d97706\n  style Mar fill:#3d2f14,stroke:#d97706"}
      />

      <CodeBlock language="sql" title="RANGE partitioning — verified pruning on PostgreSQL 18.6" showLineNumbers={true}>
{`CREATE TABLE api_request_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  path TEXT NOT NULL,
  status_code INT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, requested_at)      -- the partition key must be part of any unique constraint
) PARTITION BY RANGE (requested_at);

CREATE TABLE api_request_logs_2026_01 PARTITION OF api_request_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE api_request_logs_2026_02 PARTITION OF api_request_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE api_request_logs_2026_03 PARTITION OF api_request_logs
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

EXPLAIN (COSTS OFF) SELECT * FROM api_request_logs
WHERE requested_at >= '2026-02-01' AND requested_at < '2026-03-01';

--                                QUERY PLAN
-- ------------------------------------------------------------------------
--  Seq Scan on api_request_logs_2026_02 api_request_logs
--    Filter: ((requested_at >= '2026-02-01 00:00:00+00'::...)
--          AND (requested_at < '2026-03-01 00:00:00+00'::...))
-- Only the February partition appears in the plan — January and March
-- were pruned before execution, not filtered out afterward.

-- Bulk retention becomes instant metadata operation, not a row-by-row delete:
DROP TABLE api_request_logs_2026_01;   -- vs. DELETE FROM ... WHERE requested_at < ... (slow, bloats indexes)`}
      </CodeBlock>

      <CodeBlock language="sql" title="LIST and HASH partitioning — verified" showLineNumbers={true}>
{`-- LIST: discrete known values (region, status, tenant tier)
CREATE TABLE support_tickets (
  id INT NOT NULL,
  region TEXT NOT NULL,
  subject TEXT NOT NULL
) PARTITION BY LIST (region);

CREATE TABLE support_tickets_na    PARTITION OF support_tickets FOR VALUES IN ('US', 'CA', 'MX');
CREATE TABLE support_tickets_eu    PARTITION OF support_tickets FOR VALUES IN ('DE', 'FR', 'ES');
CREATE TABLE support_tickets_other PARTITION OF support_tickets DEFAULT;   -- catches anything else

INSERT INTO support_tickets VALUES (1, 'US', 'billing'), (2, 'DE', 'login issue'), (3, 'JP', 'shipping');
SELECT tableoid::regclass, * FROM support_tickets;
--        tableoid        | id | region |   subject
-- -----------------------+----+--------+-------------
--  support_tickets_na    |  1 | US     | billing
--  support_tickets_eu    |  2 | DE     | login issue
--  support_tickets_other |  3 | JP     | shipping     -- routed to DEFAULT, no matching list

-- HASH: even distribution, no natural range/list key — for spreading write
-- load, not for pruning (a query on user_id still has to check every partition)
CREATE TABLE user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id INT NOT NULL,
  data JSONB
) PARTITION BY HASH (user_id);

CREATE TABLE user_sessions_p0 PARTITION OF user_sessions FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE user_sessions_p1 PARTITION OF user_sessions FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE user_sessions_p2 PARTITION OF user_sessions FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE user_sessions_p3 PARTITION OF user_sessions FOR VALUES WITH (MODULUS 4, REMAINDER 3);
-- Verified with 8 rows (user_id 1..8): landed 1/3/1/3 across the 4 partitions —
-- HASH does NOT guarantee a perfectly even split at small N, only that the
-- distribution is deterministic and converges to even at scale.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Rule of thumb for which strategy">
        <p><strong>RANGE:</strong> time-series data (logs, orders, events) where old partitions get dropped or archived wholesale — by far the most common case.</p>
        <p><strong>LIST:</strong> a small, known set of discrete values you naturally query one at a time (region, tenant tier, status).</p>
        <p><strong>HASH:</strong> no natural partition key, but you still want to split write/vacuum load across smaller physical tables.</p>
      </InfoBox>

      <InfoBox variant="note" title="The deeper gotchas live in Advanced SQL Patterns">
        <p>
          This lesson covers why and how to partition. Advanced SQL Patterns covers the sharper
          edges once you're actually running one: why a <code>DEFAULT</code> partition is a trade,
          not a freebie (attaching a new range partition afterward must scan the whole default to
          prove no row belongs there), the foreign-key constraint that the partition key must be
          part of any unique key it references, and why planning time itself degrades once you're
          into the thousands of partitions.
        </p>
      </InfoBox>

      <h2>Extensions</h2>

      <p>
        <code>CREATE EXTENSION</code> pulls in functionality Postgres core doesn't ship with — some
        extensions (like <code>pg_trgm</code> and <code>pgcrypto</code> below) ship in every
        standard Postgres install and are one command away; others (like PostGIS) are separate
        packages that must be installed at the OS/image level first. Check what's available on your
        instance with <code>SELECT * FROM pg_available_extensions;</code>.
      </p>

      <CodeBlock language="sql" title="pg_trgm — fuzzy text matching, verified output" showLineNumbers={true}>
{`CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram similarity: breaks strings into 3-character chunks and compares overlap
SELECT similarity('login issue', 'loging isue');   -- 0.6  (typo'd but clearly related)

CREATE INDEX idx_tickets_subject_trgm ON support_tickets USING gin (subject gin_trgm_ops);

-- % is the "similar enough" operator, backed by the trigram index above
SELECT subject FROM support_tickets WHERE subject % 'loging isue';
--    subject
-- -------------
--  login issue

-- Also powers fast, indexed ILIKE '%substring%' — a plain B-tree can't seek
-- a leading wildcard, but gin_trgm_ops can.`}
      </CodeBlock>

      <CodeBlock language="sql" title="pgcrypto and uuid-ossp — verified, and a common stale assumption corrected" showLineNumbers={true}>
{`CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Password hashing: bcrypt via crypt() + gen_salt()
SELECT crypt('mypassword', gen_salt('bf')) AS hashed;
--                            hashed
-- --------------------------------------------------------------
--  $2a$06$2/QSoy9AlYJejMQnU4rOD.9mz5jlYKRlDSZUw/gF.Xxe6UQmW7kkW

-- Verify later:  SELECT (stored_hash = crypt('attempt', stored_hash));

-- gen_random_uuid() does NOT require pgcrypto or uuid-ossp on modern
-- Postgres — verified by dropping pgcrypto entirely and calling it again:
DROP EXTENSION pgcrypto;
SELECT gen_random_uuid();   -- still works — it's a CORE function since PostgreSQL 13
CREATE EXTENSION pgcrypto;  -- (re-add it for the crypto functions above)

-- uuid-ossp is legacy: its ONLY remaining reason to install is v1
-- (MAC+timestamp-based) or v3/v5 (namespace-based) UUIDs, which core still
-- doesn't provide:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_generate_v1(), uuid_generate_v4();
-- If all you need is a random UUID, gen_random_uuid() in core is enough —
-- don't add uuid-ossp just for that.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Correcting a common assumption: pgcrypto is not 'the UUID extension'">
        <p>
          It's easy to carry forward the older advice that generating a UUID primary key in Postgres
          means installing <code>pgcrypto</code> (for <code>gen_random_uuid()</code>) or{' '}
          <code>uuid-ossp</code> (for <code>uuid_generate_v4()</code>). That was true before
          PostgreSQL 13 promoted <code>gen_random_uuid()</code> into core — verified above by
          dropping <code>pgcrypto</code> and calling it anyway. Today, reach for{' '}
          <code>pgcrypto</code> for what it's actually for: password hashing (<code>crypt</code>/
          <code>gen_salt</code>), digests (<code>digest</code>, <code>hmac</code>), and symmetric
          encryption (<code>pgp_sym_encrypt</code>/<code>decrypt</code>). Reach for{' '}
          <code>uuid-ossp</code> only if you specifically need namespace- or MAC-based UUID variants
          (v1/v3/v5) that core doesn't generate.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="pg_stat_statements and PostGIS — the other two you'll hear about constantly">
        <p>
          <strong>pg_stat_statements</strong> aggregates every executed statement by normalized
          shape so you can rank by total time instead of guessing — it's the first thing to enable
          in any production database. It gets the full treatment, including the{' '}
          <code>shared_preload_libraries</code> restart requirement and the queries you'll actually
          run against it, in{' '}
          <a href="/sql-design-patterns/indexing">Indexing &amp; Performance</a>.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>PostGIS</strong> is the flagship example of the other kind of extension: genuinely
          popular and production-grade (geometry/geography types, spatial <code>GiST</code>{' '}
          indexing, distance and containment queries), but not part of the standard Postgres
          package — it ships as a separate install (e.g. the <code>postgis/postgis</code> Docker
          image, or an OS package) that must be present before <code>CREATE EXTENSION postgis</code>{' '}
          will even find it. Confirmed against the standard <code>postgres:18</code> image used to
          verify this lesson: PostGIS does not appear in <code>pg_available_extensions</code> at
          all, unlike <code>pg_trgm</code>, <code>pgcrypto</code> and <code>uuid-ossp</code>, which
          do.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
