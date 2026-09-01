import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Json() {
  return (
    <LessonLayout
      title="JSON, JSONB & Full-Text Search"
      sectionId="sql-design-patterns"
      lessonIndex={4}
      prev={{ path: '/sql-design-patterns/multi-tenancy', label: 'Multi-Tenancy & Event Sourcing' }}
      next={{ path: '/sql-design-patterns/views', label: 'Views, Partitioning & Extensions' }}
    >
      <p>
        Common Schema Design Patterns made the call already: JSONB is the pragmatic middle ground
        between rigid EAV and an ever-growing wide table, for the genuinely dynamic attributes that
        are mostly filtered as a whole rather than queried column-by-column. This lesson is the{' '}
        <em>how</em> — the operators, the indexing story, and Postgres's built-in full-text search
        engine, which covers a surprising amount of ground before you'd reach for Elasticsearch.
      </p>

      <h2>JSON vs JSONB</h2>

      <p>
        Postgres has carried two JSON types since 9.4, and the difference is not cosmetic — it's a
        storage-format decision with real consequences for querying, indexing, and what survives a
        round-trip.
      </p>

      <FlowChart
        title="Choosing JSON vs JSONB"
        chart={"graph TD\n  Q{\"Must preserve exact key order\\nand duplicate keys byte-for-byte,\\nand never filter/index inside it?\"} -->|\"Yes — rare\"| J[\"json\\ntext, reparsed on every read\"]\n  Q -->|\"No — the common case\"| JB[\"jsonb\\ndecomposed binary, indexable, faster\"]\n  style J fill:#3d2f14,stroke:#d97706\n  style JB fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="sql" title="Same input, two different types — verified on PostgreSQL 18.6" showLineNumbers={true}>
{`SELECT '{"b": 1, "a": 2, "a": 3}'::json;
--        {"b": 1, "a": 2, "a": 3}
-- json stores the exact text you gave it: original key order preserved,
-- BOTH "a" keys preserved. Nothing is normalized.

SELECT '{"b": 1, "a": 2, "a": 3}'::jsonb;
--        {"a": 3, "b": 1}
-- jsonb parses into a decomposed binary structure at write time: keys are
-- sorted, and duplicate keys collapse to the LAST value. This is not a bug —
-- it's the cost of a format that can be queried and indexed efficiently.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Default to JSONB — the reasons to pick JSON are narrow">
        <p>
          <strong>Storage:</strong> <code>json</code> stores the input text verbatim and reparses it
          on every access. <code>jsonb</code> stores a decomposed binary representation once, at
          write time — slightly more expensive to insert, much cheaper to query.
        </p>
        <p>
          <strong>Indexing:</strong> only <code>jsonb</code> supports GIN indexing for containment
          and key-existence queries (below). A <code>json</code> column can only be indexed via an
          expression index on a specific extracted path.
        </p>
        <p>
          <strong>Ordering:</strong> <code>json</code> is the only one that preserves original key
          order and duplicate keys. This matters almost exclusively when you must round-trip a
          document byte-for-byte (e.g. re-emitting exactly what an external API sent you) —{' '}
          not when the document is something your own application produced and controls the shape of.
        </p>
      </InfoBox>

      <h2>Core Operators</h2>

      <p>
        Everything below runs against one table, used for the rest of this lesson: a{' '}
        <code>documents</code> table with a JSONB metadata column, queried through the six operators
        that cover almost every real access pattern.
      </p>

      <CodeBlock language="sql" title="Setup table" showLineNumbers={true}>
{`CREATE TABLE documents (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'
);

INSERT INTO documents (title, body, metadata) VALUES
  ('Postgres Indexing Guide',
   'B-tree indexes speed up equality and range queries on large tables.',
   '{"author": "Jamie", "tags": ["postgres", "indexing"], "stats": {"views": 120, "likes": 8}}'),
  ('JSONB Deep Dive',
   'JSONB stores documents in a decomposed binary format for fast querying, and postgres indexes it well.',
   '{"author": "Alex", "tags": ["postgres", "json"], "stats": {"views": 340, "likes": 41}}');`}
      </CodeBlock>

      <CodeBlock language="sql" title="-> / ->> — one level deep, object or text — verified output" showLineNumbers={true}>
{`SELECT title, metadata->'author' AS author_jsonb, metadata->>'author' AS author_text
FROM documents;

--          title          | author_jsonb | author_text
-- -------------------------+--------------+-------------
--  Postgres Indexing Guide | "Jamie"      | Jamie
--  JSONB Deep Dive         | "Alex"       | Alex

-- -> returns jsonb (note the quotes: "Jamie" is a JSON string value).
-- ->> returns text, unwrapped. Use ->> as the last step before a comparison
-- or cast; use -> when you need to keep drilling into a nested object.`}
      </CodeBlock>

      <CodeBlock language="sql" title="#> / #>> — path-based, any depth — verified output" showLineNumbers={true}>
{`SELECT title, metadata#>'{stats,views}' AS views_jsonb, metadata#>>'{stats,views}' AS views_text
FROM documents;

--          title          | views_jsonb | views_text
-- -------------------------+-------------+------------
--  Postgres Indexing Guide | 120         | 120
--  JSONB Deep Dive         | 340         | 340

-- #> / #>> take a TEXT ARRAY path instead of chaining ->. Equivalent to
-- metadata->'stats'->'views' / metadata->'stats'->>'views', but reads
-- better once you're more than two levels deep.`}
      </CodeBlock>

      <CodeBlock language="sql" title="@> containment and ? key existence — verified output" showLineNumbers={true}>
{`-- @>: does the LEFT document contain the RIGHT one? This is the operator a
-- GIN index accelerates, and the one you reach for 90% of the time.
SELECT title FROM documents WHERE metadata @> '{"author": "Alex"}';
--       title
-- -----------------
--  JSONB Deep Dive

-- ?: does this top-level key exist?
SELECT title FROM documents WHERE metadata ? 'author';
--           title
-- -------------------------
--  Postgres Indexing Guide
--  JSONB Deep Dive

-- Related: ?| (any key in the array exists), ?& (all keys exist)
SELECT title FROM documents WHERE metadata ?| ARRAY['author', 'editor'];`}
      </CodeBlock>

      <h2>Building and Updating JSONB</h2>

      <CodeBlock language="sql" title="jsonb_set, jsonb_build_object, jsonb_agg — verified output" showLineNumbers={true}>
{`-- jsonb_set: update ONE nested field without rewriting the whole document.
-- Path is a text array; the new value must already be jsonb (cast a scalar
-- with ::jsonb, or wrap a plain string in double quotes).
UPDATE documents
SET metadata = jsonb_set(
  metadata, '{stats,views}',
  ((metadata#>>'{stats,views}')::int + 1)::text::jsonb
)
WHERE title = 'JSONB Deep Dive'
RETURNING title, metadata->'stats' AS stats;
--       title      |            stats
-- -----------------+-----------------------------
--  JSONB Deep Dive | {"likes": 41, "views": 341}

-- jsonb_build_object: construct a document from scratch out of scalar
-- columns — the shape you send back from an API without a separate DTO.
SELECT jsonb_build_object('title', title, 'author', metadata->>'author') AS doc_summary
FROM documents ORDER BY id;
--                        doc_summary
-- ---------------------------------------------------------
--  {"title": "Postgres Indexing Guide", "author": "Jamie"}
--  {"title": "JSONB Deep Dive", "author": "Alex"}

-- jsonb_agg: fold multiple rows into one JSON array — the standard way to
-- hand a whole result set back as a single JSON value.
SELECT jsonb_agg(
  jsonb_build_object('title', title, 'views', (metadata#>>'{stats,views}')::int)
  ORDER BY id
) AS docs
FROM documents;
--                                                docs
-- --------------------------------------------------------------------------------------------------
--  [{"title": "Postgres Indexing Guide", "views": 120}, {"title": "JSONB Deep Dive", "views": 340}]`}
      </CodeBlock>

      <InfoBox variant="tip" title="jsonb_agg needs ORDER BY inside the call, not after the query">
        <p>
          Once you're aggregating into a single JSON value there's no outer row order to <code>ORDER
          BY</code> anymore — the whole result collapses to one row. Order the array's contents with{' '}
          <code>jsonb_agg(expr ORDER BY ...)</code>, the same way you'd order <code>array_agg</code>{' '}
          or <code>string_agg</code>.
        </p>
      </InfoBox>

      <h2>Indexing JSONB — GIN and Operator Classes</h2>

      <p>
        A GIN index on a <code>jsonb</code> column indexes every key and value inside the document,
        which is what makes <code>@&gt;</code>, <code>?</code>, <code>?|</code> and <code>?&amp;</code>{' '}
        indexable at all — none of them are a simple sorted-comparison the way a B-tree condition is.
      </p>

      <CodeBlock language="sql" title="GIN on jsonb — verified EXPLAIN output" showLineNumbers={true}>
{`CREATE INDEX idx_documents_metadata ON documents USING gin (metadata);

EXPLAIN (COSTS OFF) SELECT title FROM documents WHERE metadata @> '{"author": "Alex"}';
--        QUERY PLAN
-- -----------------------------------------------------
--  Seq Scan on documents
--    Filter: (metadata @> '{"author": "Alex"}'::jsonb)
-- Two rows in the table — exactly the "small tables" case from the
-- Indexing lesson: the planner correctly decides a seq scan beats an index
-- lookup. Force the comparison to confirm the index actually works:

SET enable_seqscan = off;
EXPLAIN (COSTS OFF) SELECT title FROM documents WHERE metadata @> '{"author": "Alex"}';
--                       QUERY PLAN
-- ---------------------------------------------------------------
--  Bitmap Heap Scan on documents
--    Recheck Cond: (metadata @> '{"author": "Alex"}'::jsonb)
--    ->  Bitmap Index Scan on idx_documents_metadata
--          Index Cond: (metadata @> '{"author": "Alex"}'::jsonb)
-- (enable_seqscan is a diagnostic, never leave it off in production)`}
      </CodeBlock>

      <InfoBox variant="note" title="Two GIN operator classes — jsonb_ops (default) vs jsonb_path_ops">
        <p>
          Plain <code>USING gin (metadata)</code> uses the default <code>jsonb_ops</code> class,
          which indexes every key AND value and supports <code>@&gt;</code>, <code>?</code>,{' '}
          <code>?|</code> and <code>?&amp;</code>. <code>USING gin (metadata jsonb_path_ops)</code>{' '}
          builds a smaller, faster index over value paths only — but it supports <code>@&gt;</code>{' '}
          alone. Verified: with only a <code>jsonb_path_ops</code> index present and{' '}
          <code>enable_seqscan</code> off, a <code>?</code> query fell back to{' '}
          <code>Seq Scan ... Disabled: true</code> — there was genuinely no index it could use.
          Reach for <code>jsonb_path_ops</code> when your queries are exclusively containment checks
          and index size matters; keep the default when you also filter on bare key existence.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Indexing one path instead of the whole document">
        <p>
          If every query filters on the same single field, an expression index is smaller and faster
          than a full GIN index over the whole document:{' '}
          <code>CREATE INDEX ON documents ((metadata-&gt;&gt;'author'));</code> supports{' '}
          <code>WHERE metadata-&gt;&gt;'author' = 'Alex'</code> as an ordinary B-tree lookup. Reach
          for GIN when the filtered field varies query to query; reach for an expression index when
          it doesn't.
        </p>
      </InfoBox>

      <h2>Full-Text Search: tsvector, tsquery, and @@</h2>

      <p>
        Postgres's full-text search is built on two types — <code>tsvector</code> (a normalized,
        searchable document: lowercased, stop words stripped, words stemmed) and <code>tsquery</code>{' '}
        (a parsed search expression) — matched with the <code>@@</code> operator. Precomputing the{' '}
        <code>tsvector</code> as a generated column keeps it in sync automatically and, unlike a
        trigger, can carry per-field weighting.
      </p>

      <CodeBlock language="sql" title="Generated tsvector column, GIN index, ranked search — verified output" showLineNumbers={true}>
{`ALTER TABLE documents ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED;
-- coalesce() is not optional padding: || propagates NULL, so one NULL body
-- would blank the entire vector. Both to_tsvector calls take the language
-- config as a LITERAL — the one-argument form reads a session GUC, which
-- makes it merely STABLE, and a generated column requires IMMUTABLE.

CREATE INDEX idx_documents_search ON documents USING gin (search_vector);

SELECT title, ts_rank(search_vector, query) AS rank
FROM documents, to_tsquery('english', 'postgres & index') query
WHERE search_vector @@ query
ORDER BY rank DESC;
--           title          |    rank
-- -------------------------+------------
--  Postgres Indexing Guide | 0.99587005
-- Only one row: "JSONB Deep Dive"'s body never uses the word "index", so
-- the AND (&) query correctly excludes it. to_tsquery is strict about
-- syntax — websearch_to_tsquery (Advanced SQL Patterns) parses free-text
-- search boxes instead.`}
      </CodeBlock>

      <InfoBox variant="warning" title="A stale tsvector silently stops matching — there is no error">
        <p>
          A <code>tsvector</code> column that isn't kept in sync with the source text doesn't fail
          loudly — rows just stop appearing in search results, which is much harder to notice in
          production than an error would be. The generated-column approach above makes this
          structurally impossible: Postgres recomputes <code>search_vector</code> on every{' '}
          <code>INSERT</code>/<code>UPDATE</code> as part of the write itself, so there's no
          separate sync step to forget.
        </p>
      </InfoBox>

      <h2>Combining JSONB Metadata and Full-Text Search</h2>

      <p>
        The realistic case: filter on structured metadata, rank by relevance on the unstructured
        text, in one query. Both conditions hit their own GIN index.
      </p>

      <FlowChart
        title="One Query, Two GIN Indexes"
        chart={"graph TD\n  D[\"documents\"] --> M[\"idx_documents_metadata (GIN)\\nWHERE metadata @> '{\\\"tags\\\": [\\\"postgres\\\"]}'\"]\n  D --> S[\"idx_documents_search (GIN)\\nWHERE search_vector @@ query\"]\n  M --> C{\"AND — rows matching\\nBOTH conditions\"}\n  S --> C\n  C --> R[\"ORDER BY ts_rank(...) DESC\"]\n  style D fill:#1a2744,stroke:#5b9cf6\n  style M fill:#2a1f44,stroke:#a78bfa\n  style S fill:#2a1f44,stroke:#a78bfa\n  style C fill:#3d2f14,stroke:#d97706\n  style R fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="sql" title="Metadata filter + ranked full-text search together — verified output" showLineNumbers={true}>
{`SELECT title, ts_rank(search_vector, query) AS rank
FROM documents, to_tsquery('english', 'postgres') query
WHERE metadata @> '{"tags": ["postgres"]}'   -- structured filter, GIN on metadata
  AND search_vector @@ query                 -- ranked text match, GIN on search_vector
ORDER BY rank DESC;

--           title          |    rank
-- -------------------------+------------
--  Postgres Indexing Guide |  0.6079271
--  JSONB Deep Dive         | 0.24317084
-- Both rows are tagged "postgres" and both mention the word — ts_rank
-- separates them by term frequency/weighting, not just match/no-match.`}
      </CodeBlock>

      <InfoBox variant="info" title="Where the deeper material lives">
        <p>
          This lesson covers the operators and indexing you'll reach for daily. Advanced SQL
          Patterns goes further: PostgreSQL 17's SQL-standard <code>JSON_TABLE</code>,{' '}
          <code>JSON_VALUE</code>, <code>JSON_QUERY</code> and <code>JSON_EXISTS</code> (shredding a
          JSON array into rows in one expression, with typed error handling), JSONPath queries via{' '}
          <code>@?</code>, <code>websearch_to_tsquery</code> for parsing free-text search boxes, and{' '}
          <code>ts_headline</code> for highlighting matched terms in results.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A column stores exact API responses that must be re-emitted byte-for-byte later, preserving duplicate keys and original key order. Which type should you use?"
        options={[
          'jsonb, because it is always faster',
          'json, because it stores the input text verbatim without normalizing it',
          'Neither — store it as plain TEXT',
          'jsonb with a GIN index on the whole document',
        ]}
        correctIndex={1}
        explanation="json stores the exact text it was given and reparses it on read, so key order and duplicate keys survive round-trips. jsonb normalizes at write time — keys are sorted and duplicates collapse to the last value — which is the right tradeoff for querying and indexing, but wrong when byte-for-byte fidelity is the requirement."
        language="sql"
      />

      <InteractiveChallenge
        question="Queries against a jsonb column only ever use the containment operator (@>), and the index needs to be as small and fast as possible. Which index definition fits?"
        options={[
          'CREATE INDEX ON documents USING gin (metadata)',
          'CREATE INDEX ON documents USING gin (metadata jsonb_path_ops)',
          'CREATE INDEX ON documents USING btree (metadata)',
          'CREATE INDEX ON documents ((metadata::text))',
        ]}
        correctIndex={1}
        explanation="jsonb_path_ops indexes value paths only, producing a smaller, faster index — but it supports @> alone, not ?, ?| or ?&. The default jsonb_ops (plain USING gin (metadata)) supports all four operators but costs more index size for the ones you're not using. A B-tree can't index inside a jsonb document at all."
        language="sql"
      />
    </LessonLayout>
  );
}
