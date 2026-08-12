import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSchemaDesign() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="SQL · Field Reference"
      title="Schema Design Patterns"
      tagline="Normalization, indexing, and the shapes that recur in every real-world PostgreSQL schema."
      meta={['PostgreSQL 16', '12 patterns']}
      footerLabel="Personal study reference — PostgreSQL"
      pageLabel="SQL Field Guide · Schema Design Patterns"
      prev={{ path: '/sql-field-guide/advanced-queries', label: 'Advanced Queries' }}
      next={{ path: '/sql-field-guide/postgres-gotchas', label: 'Postgres Gotchas & Pitfalls' }}
    >
      <PosterCard
        glyph="3nf"
        title={<>3NF <span className="dim">the practical target</span></>}
        language="sql"
        code={`-- Every non-key column depends on the WHOLE key,
-- nothing but the key, so help you Codd.
CREATE TABLE orders (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id)
);`}
        caption="OLTP schemas: normalize to 3NF/BCNF for integrity and write performance. Denormalize deliberately for OLAP/reporting, not by accident."
      />

      <PosterCard
        glyph="Sd"
        title={<>Soft delete <span className="dim">partial unique index</span></>}
        language="sql"
        code={`ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX idx_users_email_active
  ON users (email) WHERE deleted_at IS NULL;`}
        caption="A partial unique index lets a soft-deleted row's email be reused by a new active row — full-table uniqueness would block that."
      />

      <PosterCard
        glyph="Au"
        title={<>Audit trigger <span className="dim">who changed what</span></>}
        language="sql"
        code={`CREATE TRIGGER trg_audit
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_products_change();`}
        caption="An append-only *_history table populated by a trigger gives you a full audit trail without changing app write code."
      />

      <PosterCard
        glyph="Poly"
        title={<>Polymorphic <span className="dim">avoid the anti-pattern</span></>}
        language="sql"
        code={`-- BAD: commentable_type + commentable_id, no real FK possible
-- GOOD: separate join tables per type, each with a real FK
CREATE TABLE post_comments (
  comment_id INT PRIMARY KEY REFERENCES comments(id),
  post_id INT NOT NULL REFERENCES posts(id)
);`}
        caption="A string + ID 'polymorphic FK' can never be enforced by the database. Per-type join tables keep real referential integrity."
      />

      <PosterCard
        glyph="Eav"
        title={<>EAV <span className="dim">the trap to avoid</span></>}
        language="sql"
        code={`-- BAD: entity_id, attribute_name, attribute_value (all TEXT)
-- GOOD: real columns + JSONB for genuinely dynamic fields
ALTER TABLE products ADD COLUMN custom_attrs JSONB DEFAULT '{}';
CREATE INDEX idx_products_attrs ON products USING GIN (custom_attrs);`}
        caption="EAV loses types and constraints and turns every multi-attribute filter into a chain of self-joins. JSONB is the pragmatic middle ground."
      />

      <PosterCard
        glyph="Adj"
        title={<>Adjacency list <span className="dim">simple trees</span></>}
        language="sql"
        code={`CREATE TABLE categories (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id INT REFERENCES categories(id)
);
-- traverse with WITH RECURSIVE`}
        caption="The default choice for hierarchical data — cheapest writes, needs a recursive CTE per subtree read."
      />

      <PosterCard
        glyph="Ltr"
        title={<>ltree <span className="dim">indexed tree paths</span></>}
        language="sql"
        code={`CREATE EXTENSION IF NOT EXISTS ltree;
ALTER TABLE categories ADD COLUMN path LTREE;
CREATE INDEX ON categories USING GIST (path);
-- SELECT * WHERE path <@ 'electronics.computers';`}
        caption="Postgres's purpose-built tree extension: fast indexed subtree/ancestor queries without nested-set's expensive renumbering on writes."
      />

      <PosterCard
        glyph="Idx"
        title={<>Composite index <span className="dim">column order</span></>}
        language="sql"
        code={`-- WHERE status = ? AND customer_id = ? AND created_at > ?
CREATE INDEX idx_orders_lookup
  ON orders (status, customer_id, created_at);
-- equality columns first, range column LAST`}
        caption="Left-prefix rule: a composite index on (a,b,c) serves queries on (a), (a,b), (a,b,c) — never (b) or (c) alone. Range columns must go last."
      />

      <PosterCard
        glyph="Pi"
        title={<>Partial index <span className="dim">smaller & faster</span></>}
        language="sql"
        code={`CREATE INDEX idx_orders_pending ON orders (created_at)
WHERE status = 'pending';`}
        caption="Indexing only the rows you actually query keeps the index tiny — a fraction of the size and I/O cost of a full-table index."
      />

      <PosterCard
        glyph="Ci"
        title={<>Covering index <span className="dim">index-only scan</span></>}
        language="sql"
        code={`CREATE INDEX idx_orders_covering
  ON orders (status, customer_id)
  INCLUDE (total, shipping_address);`}
        caption="INCLUDE adds columns to the leaf pages without affecting sort order — the query never touches the heap table at all."
      />

      <PosterCard
        glyph="Mt"
        title={<>Multi-tenant <span className="dim">RLS isolation</span></>}
        language="sql"
        code={`ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant')::int);`}
        caption="Row-Level Security is the database-enforced backstop for the inevitable missed WHERE tenant_id = ? in shared-schema multi-tenancy."
      />

      <PosterCard
        glyph="Es"
        title={<>Event sourcing <span className="dim">append-only log</span></>}
        language="sql"
        code={`CREATE TABLE order_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  sequence_number INT NOT NULL,
  UNIQUE (order_id, sequence_number)
);`}
        caption="Store every state transition as an immutable row; current state becomes a derived value, not the source of truth. Snapshot periodically."
      />

      <PosterQuickRef
        title="Which schema pattern do I need?"
        rows={[
          { need: 'Preserve rows without exposing them to normal queries', answer: 'deleted_at TIMESTAMPTZ + partial unique index + view' },
          { need: 'Track every historical change to a row', answer: 'AFTER trigger writing to an append-only *_history table' },
          { need: 'One entity type attaches to several parent types', answer: 'Separate join table per parent type, each with a real FK' },
          { need: 'Users need arbitrary custom fields', answer: 'JSONB column + GIN index, not an EAV table' },
          { need: 'Shallow-to-medium tree, frequent writes', answer: 'Adjacency list (parent_id) + recursive CTE' },
          { need: 'Deep tree, need fast subtree AND ancestor queries', answer: 'ltree extension' },
          { need: 'Index for a 3-column WHERE with one range filter', answer: 'Composite index, equality columns first, range last' },
          { need: 'Index only rows matching a common WHERE', answer: 'Partial index' },
          { need: 'SaaS app, thousands of tenants', answer: 'Shared schema + tenant_id + Row-Level Security' },
          { need: 'Need full audit trail + time travel on an entity', answer: 'Event-sourcing append-only table + periodic snapshots' },
        ]}
      />
    </PosterLayout>
  );
}
