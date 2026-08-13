import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SchemaPatterns() {
  return (
    <LessonLayout
      title="Common Schema Design Patterns"
      sectionId="sql-design-patterns"
      lessonIndex={2}
      prev={{ path: '/sql-design-patterns/indexing', label: 'Indexing & Performance' }}
      next={{ path: '/sql-design-patterns/multi-tenancy', label: 'Multi-Tenancy & Event Sourcing' }}
    >
      <p>
        Beyond normal forms, most production schemas repeat the same handful of shapes: soft
        deletes, audit trails, "this row can belong to different kinds of things," and trees.
        Here's the PostgreSQL-idiomatic way to build each — and the anti-pattern to avoid.
      </p>

      <h2>Soft Deletes</h2>

      <p>
        Hard-deleting rows loses history and breaks foreign keys that still reference them. Soft
        deletes mark a row as gone without physically removing it.
      </p>

      <CodeBlock language="sql" title="Soft Delete with a Nullable Timestamp" showLineNumbers={true}>
{`ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- "Delete" a user
UPDATE users SET deleted_at = NOW() WHERE id = 42;

-- Every query must now filter it out — easy to forget!
SELECT * FROM users WHERE deleted_at IS NULL;

-- Enforce uniqueness only among ACTIVE rows (partial unique index)
CREATE UNIQUE INDEX idx_users_email_active
  ON users (email)
  WHERE deleted_at IS NULL;
-- Same email can be reused after the original account is soft-deleted

-- A view that hides the flag entirely so app code can't forget the filter
CREATE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;`}
      </CodeBlock>

      <InfoBox variant="warning" title="Soft Deletes Leak Into Every Query">
        <p>
          The biggest risk with soft deletes isn't the schema — it's the app code forgetting{' '}
          <code>WHERE deleted_at IS NULL</code> somewhere and leaking "deleted" rows into a report
          or an API response. Prefer a dedicated view (or a row-level security policy) that bakes
          the filter in, rather than trusting every call site to remember it. Also index the
          partial-unique constraints (above) so soft-deleted rows don't block reuse of unique
          values like email or username.
        </p>
      </InfoBox>

      <h2>Audit / History Tables</h2>

      <p>
        When you need to know <em>who changed what, and when</em> — not just the current state —
        pair the live table with an append-only history table, populated by a trigger.
      </p>

      <CodeBlock language="sql" title="Trigger-Based Audit History" showLineNumbers={true}>
{`CREATE TABLE products (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- History table: one row per change, never updated or deleted
CREATE TABLE products_history (
  history_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('I','U','D')),
                                       -- TEXT + CHECK, not CHAR(1): CHAR
                                       -- blank-pads and the padding surprises
                                       -- you in comparisons later
  changed_by TEXT,                     -- app-set via SET LOCAL / session var
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_products_change() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO products_history (product_id, name, price, operation, changed_by)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.name, OLD.name),
    COALESCE(NEW.price, OLD.price),
    LEFT(TG_OP, 1),
    current_setting('app.current_user', TRUE)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_audit
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_products_change();

-- "What did this row look like as of last Tuesday?"
SELECT * FROM products_history
WHERE product_id = 42 AND changed_at <= '2024-06-11'
ORDER BY changed_at DESC
LIMIT 1;`}
      </CodeBlock>

      <InfoBox variant="tip" title="Alternative: Range Types for System-Versioned History">
        <p>
          Instead of a separate history table, some schemas keep every version in one table with a{' '}
          <code>valid_range TSTZRANGE</code> column and a <code>GiST</code> exclusion constraint
          preventing overlapping ranges for the same entity — a lightweight version of SQL:2011
          temporal tables. It's more elegant for point-in-time queries but harder to reason about
          than "current table + append-only history table."
        </p>
      </InfoBox>

      <h2>Polymorphic Associations vs Proper Join Tables</h2>

      <p>
        "Comments can belong to a Post <em>or</em> a Photo <em>or</em> a Video" is the classic case
        that tempts a polymorphic foreign key. Resist it.
      </p>

      <CodeBlock language="sql" title="The Polymorphic Anti-Pattern" showLineNumbers={true}>
{`-- ANTI-PATTERN: commentable_type + commentable_id, no real FK possible
CREATE TABLE comments (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  commentable_type VARCHAR(20) NOT NULL,  -- 'post', 'photo', 'video' — a string, not a type
  commentable_id INT NOT NULL,            -- references posts.id OR photos.id OR videos.id
  body TEXT NOT NULL
);
-- The database CANNOT enforce that commentable_id actually exists in the right table.
-- REFERENCES is impossible here because the target table varies per row.
-- Orphaned comments after a delete are silent — nothing errors.`}
      </CodeBlock>

      <CodeBlock language="sql" title="Fix 1: Separate Join Tables Per Type" showLineNumbers={true}>
{`CREATE TABLE comments (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE post_comments (
  comment_id INT PRIMARY KEY REFERENCES comments(id) ON DELETE CASCADE,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE photo_comments (
  comment_id INT PRIMARY KEY REFERENCES comments(id) ON DELETE CASCADE,
  photo_id INT NOT NULL REFERENCES photos(id) ON DELETE CASCADE
);
-- Real foreign keys, real cascade behavior, real referential integrity.
-- Slightly more tables, zero orphan risk.`}
      </CodeBlock>

      <CodeBlock language="sql" title="Fix 2: Shared Supertype Table" showLineNumbers={true}>
{`-- When posts/photos/videos share enough shape, model the shared identity explicitly
CREATE TABLE commentables (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('post', 'photo', 'video'))
);

CREATE TABLE posts (
  id INT PRIMARY KEY REFERENCES commentables(id),
  title VARCHAR(200) NOT NULL
);

CREATE TABLE photos (
  id INT PRIMARY KEY REFERENCES commentables(id),
  url TEXT NOT NULL
);

CREATE TABLE comments (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  commentable_id INT NOT NULL REFERENCES commentables(id) ON DELETE CASCADE,
  body TEXT NOT NULL
);
-- One real FK on comments, and commentables.kind tells you which child table to join.
-- Best when the "polymorphic" set is closed and unlikely to grow often.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why the Anti-Pattern Persists Anyway">
        <p>
          Polymorphic associations are common in Rails/ActiveRecord-style ORMs because the ORM
          enforces the relationship in application code and the pattern is easy to add a new type
          to. The tradeoff is real: you're trading database-enforced integrity for schema
          flexibility. That's sometimes a legitimate call for a fast-moving app — just make it
          consciously, and add a periodic reconciliation job to catch orphans, since the database
          won't.
        </p>
      </InfoBox>

      <h2>The EAV Anti-Pattern</h2>

      <p>
        Entity-Attribute-Value modeling — storing every "column" as a row instead of a real
        column — shows up when requirements say "users need arbitrary custom fields." It looks
        flexible. It is usually a mistake.
      </p>

      <CodeBlock language="sql" title="EAV: What It Looks Like" showLineNumbers={true}>
{`-- ANTI-PATTERN: every attribute is a row, not a column
CREATE TABLE entity_attributes (
  entity_id INT NOT NULL,
  attribute_name VARCHAR(50) NOT NULL,
  attribute_value TEXT NOT NULL          -- everything is a string!
);

-- "Products with color = red AND size = large" becomes a self-join per attribute
SELECT e1.entity_id
FROM entity_attributes e1
JOIN entity_attributes e2 ON e1.entity_id = e2.entity_id
WHERE e1.attribute_name = 'color' AND e1.attribute_value = 'red'
  AND e2.attribute_name = 'size'  AND e2.attribute_value = 'large';
-- Adding a third filter means a third self-join. No types, no CHECK constraints,
-- no foreign keys on values, terrible query plans, and NULL vs "missing" is ambiguous.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why EAV Hurts">
        <p>
          You lose column types (everything is text, cast at read time), you lose constraints
          (nothing stops <code>attribute_name = 'colour'</code> as a typo-duplicate of{' '}
          <code>'color'</code>), and every multi-attribute query becomes a chain of self-joins that
          the planner can't optimize well. It also makes reporting and BI tooling nearly unusable
          without a pivot step first.
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="Fix: JSONB for Truly Dynamic Attributes" showLineNumbers={true}>
{`-- Real columns for anything you filter/sort/join on regularly.
-- JSONB for the genuinely dynamic, rarely-queried-individually stuff.
CREATE TABLE products (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,      -- real column: filtered/sorted constantly
  price NUMERIC(10,2) NOT NULL,        -- real column: needs numeric comparisons
  custom_attributes JSONB DEFAULT '{}' -- dynamic: color, size, material, whatever
);

CREATE INDEX idx_products_attrs ON products USING GIN (custom_attributes);

-- Still queryable, and the GIN index makes it fast
SELECT * FROM products
WHERE custom_attributes @> '{"color": "red", "size": "large"}';`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Rule of Thumb">
        <p>
          If an attribute is queried, filtered, or joined on frequently — it's a real column. If
          it's genuinely per-tenant/per-product arbitrary metadata that's mostly just displayed,
          JSONB is the pragmatic middle ground between rigid EAV and an ever-growing wide table.
        </p>
      </InfoBox>

      <h2>Hierarchical Data</h2>

      <p>Trees show up everywhere: categories, org charts, comment threads, file systems. Postgres gives you three real options.</p>

      <FlowChart
        title="Hierarchical Data: Three Approaches"
        chart={"graph TD\n  Q{\"How deep? How often\\ndoes structure change?\\nNeed subtree queries?\"} -->|\"Simple, shallow,\\nfrequent writes\"| AL[\"Adjacency List\\nparent_id column\"]\n  Q -->|\"Deep reads,\\nrare writes\"| NS[\"Nested Set\\nleft/right bounds\"]\n  Q -->|\"Deep trees,\\nfrequent moves,\\nPostgres available\"| LT[\"ltree extension\\npath-based\"]\n  style AL fill:#1a3329,stroke:#4ade80\n  style NS fill:#3d2f14,stroke:#d97706\n  style LT fill:#1a2744,stroke:#5b9cf6"}
      />

      <CodeBlock language="sql" title="Adjacency List — Simple, Recursive CTE for Traversal" showLineNumbers={true}>
{`CREATE TABLE categories (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INT REFERENCES categories(id)
);

-- Get the full subtree under 'Electronics'
WITH RECURSIVE subtree AS (
  SELECT id, name, parent_id, 1 AS depth
  FROM categories WHERE name = 'Electronics'
  UNION ALL
  SELECT c.id, c.name, c.parent_id, s.depth + 1
  FROM categories c
  JOIN subtree s ON c.parent_id = s.id
)
SELECT * FROM subtree ORDER BY depth;
-- Simplest to write and update (INSERT/move a node = one UPDATE).
-- Downside: every subtree read needs a recursive CTE.`}
      </CodeBlock>

      <CodeBlock language="sql" title="Nested Set — Fast Subtree Reads, Expensive Writes" showLineNumbers={true}>
{`CREATE TABLE categories_nested (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  lft INT NOT NULL,
  rgt INT NOT NULL
);

-- Entire subtree in ONE query, no recursion — this is the payoff
SELECT * FROM categories_nested
WHERE lft BETWEEN (SELECT lft FROM categories_nested WHERE name = 'Electronics')
              AND (SELECT rgt FROM categories_nested WHERE name = 'Electronics')
ORDER BY lft;

-- The cost: inserting a node means renumbering lft/rgt for every node
-- to the right of the insertion point. Fine for read-heavy, rarely-changing
-- trees (site nav, taxonomy). Painful for trees that reorganize often.`}
      </CodeBlock>

      <CodeBlock language="sql" title="ltree — Postgres's Purpose-Built Extension" showLineNumbers={true}>
{`CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE categories_ltree (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  path LTREE NOT NULL           -- e.g. 'electronics.computers.laptops'
);

CREATE INDEX idx_categories_path ON categories_ltree USING GIST (path);

-- Subtree query: fast, indexed, no recursion
SELECT * FROM categories_ltree WHERE path <@ 'electronics.computers';

-- Ancestors of a node
SELECT * FROM categories_ltree WHERE path @> 'electronics.computers.laptops';

-- Pattern matching against the tree structure
SELECT * FROM categories_ltree WHERE path ~ 'electronics.*.laptops';

-- Moving a subtree: rewrite the path prefix for every descendant (one UPDATE)
UPDATE categories_ltree
SET path = 'appliances' || subpath(path, 1)
WHERE path <@ 'electronics.computers';`}
      </CodeBlock>

      <InfoBox variant="tip" title="Which One to Reach For">
        <p>
          <strong>Adjacency list:</strong> default choice — simplest schema, cheapest writes, fine
          for shallow-to-medium trees where you're comfortable with a recursive CTE per query.{' '}
          <strong>Nested set:</strong> when subtree reads vastly outnumber writes and the tree is
          fairly static (nav menus, taxonomies). <strong>ltree:</strong> when you're already on
          Postgres, need both fast subtree/ancestor queries <em>and</em> reasonably frequent
          restructuring — it's the best of both worlds if you can take the extension dependency.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A comments table needs to attach to posts, photos, or videos. Which approach gives the database real referential integrity (no orphaned comments possible)?"
        options={[
          'A single commentable_type VARCHAR + commentable_id INT with no foreign key',
          'Separate join tables (post_comments, photo_comments, ...) each with a real REFERENCES constraint',
          'Store the target table name and ID as a JSON blob',
          'A trigger that periodically checks for orphans',
        ]}
        correctIndex={1}
        explanation="Only a real REFERENCES constraint lets the database itself guarantee the referenced row exists and cascades correctly on delete. A polymorphic type+id column can't have a single FK target, and periodic orphan checks are a detection mechanism, not prevention."
        language="sql"
      />

      <InteractiveChallenge
        question="Which hierarchical data strategy makes 'read the entire subtree' a single non-recursive query but makes inserting a new node expensive?"
        options={[
          'Adjacency list (parent_id column)',
          'Nested set (lft/rgt bounds)',
          'ltree extension',
          'EAV attributes table',
        ]}
        correctIndex={1}
        explanation="Nested set encodes tree position as left/right numeric bounds, so subtree reads are a single BETWEEN query. The cost is that inserting or moving a node requires renumbering lft/rgt for every node to its right — expensive on frequently-changing trees."
        language="sql"
      />
    </LessonLayout>
  );
}
