import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function MultiTenancy() {
  return (
    <LessonLayout
      title="Multi-Tenancy & Event Sourcing"
      sectionId="sql-design-patterns"
      lessonIndex={3}
      prev={{ path: '/sql-design-patterns/schema-patterns', label: 'Common Schema Design Patterns' }}
      next={{ path: '/sql-advanced/transactions', label: 'Transactions & Locking' }}
    >
      <p>
        Two schema-level decisions that are painful to reverse once you're in production: how you
        isolate tenant data, and whether you store current state or the full history of changes
        that produced it. Both are architecture decisions dressed up as schema decisions.
      </p>

      <h2>Multi-Tenancy Patterns</h2>

      <p>
        "Multi-tenant" means one application instance serves many customers (tenants) whose data
        must never leak into each other's queries. PostgreSQL gives you three levels of isolation,
        trading operational simplicity against blast-radius and per-tenant customization.
      </p>

      <FlowChart
        title="Multi-Tenancy: Three Isolation Levels"
        chart={"graph TD\n  A[\"Shared Schema\\ntenant_id column\"] -->|\"More isolation,\\nmore ops overhead\"| B[\"Schema-per-Tenant\\none Postgres schema each\"]\n  B -->|\"More isolation,\\nmore ops overhead\"| C[\"Database-per-Tenant\\nseparate DB/cluster\"]\n  style A fill:#1a3329,stroke:#4ade80\n  style B fill:#1a2744,stroke:#5b9cf6\n  style C fill:#2a1f44,stroke:#a78bfa"}
      />

      <h3>Shared Schema — tenant_id on Every Table</h3>

      <CodeBlock language="sql" title="Shared Schema with Row-Level Security" showLineNumbers={true}>
{`CREATE TABLE orders (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id INT NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  total NUMERIC(10,2) NOT NULL
);

-- Every index that matters starts with tenant_id
CREATE INDEX idx_orders_tenant_created ON orders (tenant_id, created_at);

-- The dangerous part: app code MUST remember WHERE tenant_id = ? on every query.
-- One missed WHERE clause = a cross-tenant data leak. Postgres Row-Level Security
-- makes this a database guarantee instead of an app-code discipline problem.
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant')::int);

-- The app sets this once per connection/request; Postgres enforces it on
-- every SELECT/UPDATE/DELETE automatically, even for hand-written queries.
SET app.current_tenant = '42';
SELECT * FROM orders;  -- only tenant 42's rows, even without an explicit WHERE`}
      </CodeBlock>

      <InfoBox variant="tip" title="RLS Is the Safety Net, Not the Whole Strategy">
        <p>
          Row-Level Security doesn't replace indexing on <code>tenant_id</code> or careful query
          design — it's a database-enforced backstop for the inevitable missed{' '}
          <code>WHERE tenant_id = ?</code>. Combine both: explicit filtering for performance, RLS
          for the guarantee that a bug can't leak tenant B's rows into tenant A's response.
        </p>
      </InfoBox>

      <h3>Schema-per-Tenant</h3>

      <CodeBlock language="sql" title="One Postgres Schema per Tenant" showLineNumbers={true}>
{`-- Same table structure, replicated per tenant namespace
CREATE SCHEMA tenant_acme;
CREATE SCHEMA tenant_globex;

CREATE TABLE tenant_acme.orders   (id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, /* ... */);
CREATE TABLE tenant_globex.orders (id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, /* ... */);

-- App connects and sets search_path per request/tenant
SET search_path TO tenant_acme, public;
SELECT * FROM orders;  -- resolves to tenant_acme.orders, no tenant_id column needed

-- Migrations must now run once PER SCHEMA — this is the operational cost
-- (typically scripted: loop over pg_namespace and re-run the migration in each)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Schema-per-Tenant Doesn't Scale Past a Few Hundred Tenants">
        <p>
          Each schema means a full copy of every table, index, and constraint — Postgres's catalog
          overhead (pg_class, pg_attribute rows) grows linearly with tenant count, and migrations
          become an N-times-slower loop. This pattern shines for tens to low-hundreds of tenants
          that need genuine data isolation (e.g. regulated industries) without full database
          separation. Beyond that, shared-schema with RLS or database-per-tenant usually wins.
        </p>
      </InfoBox>

      <h3>Database-per-Tenant</h3>

      <InfoBox variant="info" title="When to Go This Far">
        <p>
          A fully separate database (or even separate Postgres instance/cluster) per tenant gives
          the strongest isolation: independent backup/restore, independent scaling, independent
          maintenance windows, and a tenant can be migrated or deleted by dropping one database.
          The cost is entirely operational — connection pooling across hundreds of databases,
          migration orchestration, and cross-tenant analytics all require dedicated tooling. Reserve
          this for large enterprise tenants with contractual isolation requirements, or genuinely
          small tenant counts (dozens, not thousands).
        </p>
      </InfoBox>

      <h2>Choosing a Multi-Tenancy Strategy</h2>

      <InfoBox variant="tip" title="Decision Guide">
        <p><strong>Shared schema + tenant_id + RLS:</strong> default choice for SaaS with hundreds to millions of tenants. Cheapest to operate, migrate, and scale.</p>
        <p><strong>Schema-per-tenant:</strong> mid-size B2B with dozens–hundreds of tenants, where "your data lives in its own namespace" is a sales/compliance requirement, and per-tenant schema customization is occasionally needed.</p>
        <p><strong>Database-per-tenant:</strong> enterprise tenants (dozens, not thousands) with hard isolation, independent SLAs, or regulatory data-residency requirements.</p>
      </InfoBox>

      <h2>Event-Sourcing-Style Append-Only Tables</h2>

      <p>
        Instead of storing only the current state of an entity (and overwriting it on every
        change), event sourcing stores every state <em>transition</em> as an immutable, append-only
        row. Current state becomes a derived value, not the source of truth.
      </p>

      <CodeBlock language="sql" title="Append-Only Event Log" showLineNumbers={true}>
{`CREATE TABLE order_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,       -- 'OrderPlaced', 'ItemAdded', 'OrderShipped', ...
  payload JSONB NOT NULL,                -- event-specific data
  sequence_number INT NOT NULL,          -- per-order ordering, gapless
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, sequence_number)     -- enforces strict per-order ordering
);

-- Rows are NEVER updated or deleted — only INSERTed. This is the entire contract.
INSERT INTO order_events (order_id, event_type, payload, sequence_number) VALUES
  (501, 'OrderPlaced',  '{"customer_id": 9, "total": 59.99}', 1),
  (501, 'ItemAdded',    '{"sku": "WIDGET-1", "qty": 2}',       2),
  (501, 'OrderShipped', '{"carrier": "UPS", "tracking": "1Z..."}', 3);

-- Current state is DERIVED by folding events, not stored directly
SELECT
  order_id,
  jsonb_object_agg(event_type, payload ORDER BY sequence_number) AS event_history,
  (array_agg(event_type ORDER BY sequence_number DESC))[1] AS latest_status
FROM order_events
WHERE order_id = 501
GROUP BY order_id;`}
      </CodeBlock>

      <CodeBlock language="sql" title="Snapshots — Avoid Replaying Millions of Events" showLineNumbers={true}>
{`-- Replaying every event for a long-lived entity gets slow. Snapshot periodically.
CREATE TABLE order_snapshots (
  order_id INT NOT NULL,
  as_of_sequence INT NOT NULL,
  state JSONB NOT NULL,                  -- fully materialized current state
  snapshotted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (order_id, as_of_sequence)
);

-- Rebuild current state: load latest snapshot, replay only events AFTER it
SELECT s.state, e.*
FROM order_snapshots s
LEFT JOIN order_events e
  ON e.order_id = s.order_id AND e.sequence_number > s.as_of_sequence
WHERE s.order_id = 501
ORDER BY s.as_of_sequence DESC, e.sequence_number
LIMIT 1000;  -- snapshot + only the small tail of events since it was taken`}
      </CodeBlock>

      <InfoBox variant="info" title="Why Bother? What You Get For Free">
        <p><strong>Full audit trail:</strong> every state transition is preserved by construction, not bolted on with triggers.</p>
        <p><strong>Time travel:</strong> "what did this order look like at 3pm yesterday" is just replaying events up to that timestamp.</p>
        <p><strong>Debuggability:</strong> reproducing a bug means replaying the exact event sequence that triggered it.</p>
        <p><strong>Multiple read models:</strong> the same event stream can be folded into different projections (a customer-facing view, an internal ops dashboard) without touching the source of truth.</p>
      </InfoBox>

      <InfoBox variant="warning" title="The Real Costs">
        <p>
          Every read either replays events (slow without snapshots) or requires maintaining
          separate materialized "read model" tables kept in sync with the event stream — which
          reintroduces the sync problem event sourcing was supposed to avoid. Schema evolution is
          hard: old events were written against an old shape of the world, and your event handlers
          must forever understand every historical event version. Use it for the specific
          subsystems where the audit trail and time-travel are genuinely valuable (billing,
          inventory, order lifecycle) — not as the default persistence strategy for your whole app.
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="Materialized Read Model Kept in Sync" showLineNumbers={true}>
{`-- The "current state" table most of the app actually queries against —
-- updated by a trigger or background process consuming order_events.
CREATE TABLE orders_current (
  order_id INT PRIMARY KEY,
  status VARCHAR(30) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  last_event_sequence INT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ordinary queries hit this table like any normal schema —
-- event sourcing stays an implementation detail behind it.
SELECT * FROM orders_current WHERE status = 'shipped';`}
      </CodeBlock>

      <InteractiveChallenge
        question="A SaaS product has thousands of small tenants and needs to add a new column to every tenant's data with minimal operational overhead. Which multi-tenancy strategy fits best?"
        options={[
          'Database-per-tenant',
          'Schema-per-tenant',
          'Shared schema with a tenant_id column and Row-Level Security',
          'EAV attributes table shared across tenants',
        ]}
        correctIndex={2}
        explanation="With thousands of tenants, schema-per-tenant and database-per-tenant both require running a migration once per tenant — that becomes an operational bottleneck at scale. Shared schema with tenant_id means one ALTER TABLE handles every tenant at once, and RLS keeps tenant data isolated at query time."
        language="sql"
      />

      <InteractiveChallenge
        question="In an event-sourced order system, why add a snapshots table instead of always replaying every event from the beginning?"
        options={[
          'Snapshots are required by the SQL standard for event sourcing',
          'Replaying millions of historical events to compute current state gets slow; a snapshot lets you replay only the tail since the last snapshot',
          'Snapshots replace the need for an append-only event table entirely',
          'Snapshots make events mutable so old ones can be corrected',
        ]}
        correctIndex={1}
        explanation="Snapshots are a performance optimization: instead of folding every event ever recorded for an entity, you load the most recent snapshot and only replay events after it. The event table remains the append-only source of truth; snapshots are a derived, disposable cache."
        language="sql"
      />
    </LessonLayout>
  );
}
