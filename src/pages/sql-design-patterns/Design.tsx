import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Design() {
  return (
    <LessonLayout
      title="Schema Design & Normalization"
      sectionId="sql-design-patterns"
      lessonIndex={0}
      prev={{ path: '/sql-fundamentals/aggregation', label: 'Aggregation & Window Functions' }}
      next={{ path: '/sql-design-patterns/indexing', label: 'Indexing & Performance' }}
    >
      <p>Good schema design is the foundation that makes or breaks everything downstream — query performance, data integrity, and maintainability. Let's go beyond "just normalize it," using PostgreSQL's type system throughout.</p>

      <h2>Normalization Decision Tree</h2>

      <FlowChart
        title="Normalization Levels: When to Stop"
        chart={"graph TD\n  START[\"Raw Table\"] --> NF1{\"All values atomic?\\nNo repeating groups?\"}\n  NF1 -->|No| FIX1[\"Split into 1NF\"]\n  NF1 -->|Yes| NF2{\"Every non-key column\\ndepends on FULL PK?\"}\n  NF2 -->|No| FIX2[\"Split partial deps -> 2NF\"]\n  NF2 -->|Yes| NF3{\"No transitive\\ndependencies?\"}\n  NF3 -->|No| FIX3[\"Extract transitive deps -> 3NF\"]\n  NF3 -->|Yes| BCNF{\"Every determinant\\nis a candidate key?\"}\n  BCNF -->|No| FIX4[\"Decompose -> BCNF\"]\n  BCNF -->|Yes| STOP[\"3NF/BCNF is enough\\nfor most OLTP systems\"]\n  STOP --> MAYBE[\"4NF/5NF: only for\\nmulti-valued dependencies\"]\n  style START fill:#2a1f44,stroke:#a78bfa\n  style STOP fill:#1a3329,stroke:#4ade80\n  style MAYBE fill:#3d2f14,stroke:#d97706"}
      />

      <InfoBox variant="tip" title="The Practical Rule">
        <p>
          <strong>OLTP systems:</strong> Normalize to 3NF/BCNF. Data integrity and write performance are king.
        </p>
        <p>
          <strong>OLAP / analytics:</strong> Denormalize strategically. Read performance and query simplicity matter more than avoiding redundancy.
        </p>
        <p>
          <strong>4NF/5NF</strong> address multi-valued and join dependencies. If you've never hit a 4NF violation, you probably don't need it. They matter in academic schemas and complex scheduling/assignment domains.
        </p>
      </InfoBox>

      <h2>What Normalization Is Actually For</h2>

      <p>
        The normal forms are usually taught as a checklist to satisfy, which makes them feel like
        homework. They are better understood as <em>consequences</em> of one idea: every fact should
        be stored in exactly one place. Store a fact twice and the two copies can disagree, and
        &quot;can disagree&quot; always eventually means &quot;does disagree.&quot;
      </p>

      <p>
        The vocabulary you need first is the <strong>functional dependency</strong>, written{' '}
        <code>A → B</code> and read &quot;A determines B&quot;: if you know the value of A, there is
        exactly one possible value of B. <code>order_id → customer_email</code> holds — one order
        has one customer email. <code>customer_email → order_id</code> does not — one customer can
        have many orders. Every normal form below is a rule about <em>which</em> functional
        dependencies are allowed to live in a table, and each one exists to kill a specific,
        nameable failure.
      </p>

      <InfoBox variant="danger" title="The three anomalies — the actual damage">
        <p>
          Look at <code>orders_bad</code> in the next code block, where every order row carries the
          customer&apos;s name, email, and city.
        </p>
        <p>
          <strong>Update anomaly.</strong> A customer changes their email. That fact is duplicated
          across all 400 of their order rows, so the update must touch all 400 — and if it touches
          399, the database now holds two contradictory emails for one person with nothing to say
          which is right.
        </p>
        <p>
          <strong>Insert anomaly.</strong> You cannot record a customer who has not ordered yet.
          There is no row to put them in; the only place customer facts live is inside an order. You
          would have to invent a fake order, which then pollutes every revenue report.
        </p>
        <p>
          <strong>Delete anomaly.</strong> Deleting a customer&apos;s last order deletes the
          customer. The fact &quot;this person exists and lives in Denver&quot; had no independent
          home, so removing an unrelated fact destroyed it. This is the one that silently loses real
          data.
        </p>
        <p>
          Splitting customers into their own table fixes all three at once, and that is the entire
          argument. The normal forms are just a systematic way of finding where this is about to
          happen to you.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="The forms, stated as dependency rules">
        <p>
          <strong>1NF — values are atomic.</strong> One cell holds one value, not{' '}
          <code>&apos;Widget x3, Gadget x1&apos;</code> and not a comma-separated list of IDs.
          Violate it and you cannot filter, join, or constrain the contents without string surgery.
        </p>
        <p>
          <strong>2NF — no partial dependencies.</strong> A <em>partial</em> dependency is a non-key
          column determined by only <em>part</em> of a composite primary key. With PK{' '}
          <code>(student_id, course_id)</code>, a column determined by <code>course_id</code> alone
          is partial — it will be repeated once per student on that course. Only relevant when the
          key is composite; a single-column key cannot have partial dependencies.
        </p>
        <p>
          <strong>3NF — no transitive dependencies.</strong> A <em>transitive</em> dependency is a
          non-key column determined by <em>another non-key column</em>:{' '}
          <code>order_id → customer_city → customer_state</code>. The state is really a fact about
          the city, not about the order, so it belongs in a cities table. The classic mnemonic:
          every non-key column must depend on <strong>the key, the whole key, and nothing but the
          key</strong> — which is 1NF, 2NF and 3NF respectively.
        </p>
        <p>
          <strong>BCNF — every determinant is a candidate key.</strong> The tightening of 3NF for
          the rare case where a non-key column determines part of a key. If you have never
          knowingly hit it, that is normal; 3NF catches almost everything in practice.
        </p>
      </InfoBox>

      <h2>Normalization by Example</h2>

      <CodeBlock language="sql" title="From Denormalized Mess to 3NF" showLineNumbers={true}>
{`-- BEFORE: Unnormalized (violates 1NF, 2NF, 3NF)
CREATE TABLE orders_bad (
  order_id INT,
  customer_name VARCHAR(100),    -- duplicated per order
  customer_email VARCHAR(100),   -- duplicated per order
  customer_city VARCHAR(50),     -- transitive: city -> state
  customer_state VARCHAR(2),
  items TEXT,                    -- "Widget x3, Gadget x1" (not atomic!)
  total DECIMAL
);

-- AFTER: 3NF — each fact stored once, using IDENTITY (not SERIAL)
CREATE TABLE customers (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  city_id INT REFERENCES cities(id)
);

CREATE TABLE cities (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  state VARCHAR(2) NOT NULL,
  UNIQUE (name, state)
);

CREATE TABLE orders (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- always TIMESTAMPTZ, never bare TIMESTAMP
  total DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_items (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL
);`}
      </CodeBlock>

      <InfoBox variant="warning" title="TIMESTAMP vs TIMESTAMPTZ">
        <p>
          Postgres's plain <code>TIMESTAMP</code> stores wall-clock time with no timezone
          information — it silently means whatever timezone the writer assumed. <code>TIMESTAMPTZ</code>{' '}
          normalizes everything to UTC internally and converts to the client's session timezone on
          read. Default to <code>TIMESTAMPTZ</code> for every column unless you have a specific
          reason not to (e.g. storing a "wall clock" appointment time independent of timezone).
        </p>
      </InfoBox>

      <h2>Star Schema for Analytics</h2>

      <CodeBlock language="sql" title="Star Schema: Fact + Dimension Tables" showLineNumbers={true}>
{`-- Fact table: granular events, foreign keys to dimensions, measures
CREATE TABLE fact_sales (
  sale_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date_key INT NOT NULL REFERENCES dim_date(date_key),
  product_key INT NOT NULL REFERENCES dim_product(product_key),
  store_key INT NOT NULL REFERENCES dim_store(store_key),
  customer_key INT NOT NULL REFERENCES dim_customer(customer_key),
  -- Measures (the numbers you aggregate)
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL
);

-- Dimension table: descriptive attributes, intentionally denormalized
CREATE TABLE dim_product (
  product_key INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id VARCHAR(20) NOT NULL,   -- natural key
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),          -- denormalized! (snowflake would normalize this)
  brand VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  -- SCD Type 2 fields for tracking changes over time
  valid_from DATE NOT NULL,
  valid_to DATE DEFAULT '9999-12-31',
  is_current BOOLEAN DEFAULT TRUE
);

-- Date dimension: pre-populated, enables powerful time-based queries
CREATE TABLE dim_date (
  date_key INT PRIMARY KEY,          -- YYYYMMDD format
  full_date DATE NOT NULL,
  day_of_week INT,
  day_name VARCHAR(10),
  month INT,
  month_name VARCHAR(10),
  quarter INT,
  year INT,
  is_weekend BOOLEAN,
  is_holiday BOOLEAN
);

-- Query becomes simple: no complex joins needed
SELECT
  d.year, d.quarter, p.category,
  SUM(f.total_amount) AS revenue,
  COUNT(DISTINCT f.customer_key) AS unique_customers
FROM fact_sales f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_product p ON f.product_key = p.product_key
WHERE d.year = 2024 AND p.is_current = TRUE
GROUP BY d.year, d.quarter, p.category
ORDER BY d.quarter, revenue DESC;`}
      </CodeBlock>

      <InfoBox variant="note" title="Star vs Snowflake">
        <p>
          <strong>Star schema:</strong> Dimensions are flat/denormalized. Fewer joins, faster queries, simpler SQL. Preferred for most data warehouses.
        </p>
        <p>
          <strong>Snowflake schema:</strong> Dimensions are normalized into sub-dimensions (product → category → department). Saves storage, adds join complexity. Use only when dimension tables are very large or frequently updated.
        </p>
      </InfoBox>

      <h2>Postgres Column Types Worth Knowing</h2>

      <CodeBlock language="sql" title="Native Types That Replace Extra Tables/Columns" showLineNumbers={true}>
{`CREATE TABLE products (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  tags TEXT[],                          -- array: no join table needed for simple tags
  attributes JSONB,                     -- semi-structured product attributes
  price_range NUMRANGE,                 -- range type: e.g. '[10.00,25.00)'
  available_from DATERANGE,
  sku UUID DEFAULT gen_random_uuid()    -- built in since PG13; no pgcrypto needed
);

-- On UUID keys: gen_random_uuid() is v4 — uniformly RANDOM. As a PRIMARY KEY
-- on a big table that is a real cost: every insert lands on a different B-tree
-- page, so the index loses write locality and the cache hit rate collapses.
-- UUID v7 is time-ordered, so inserts append to the right-hand edge like a
-- sequence while staying globally unique and client-generatable:
  id UUID PRIMARY KEY DEFAULT uuidv7()  -- built in as of PG18
-- On PG17 and older, generate v7 in the application (most languages have a
-- library) or use a small SQL function. Reach for UUIDs when IDs must be
-- unguessable or minted outside the database — otherwise IDENTITY is smaller
-- (8 bytes vs 16) and faster.

-- Query an array column
SELECT * FROM products WHERE tags @> ARRAY['clearance'];

-- Query a range column: "is this price in the promo window?"
SELECT * FROM products WHERE price_range @> 19.99::numeric;`}
      </CodeBlock>

      <InfoBox variant="tip" title="Arrays and JSONB Are Not Excuses to Skip Normalization">
        <p>
          Postgres's array and JSONB columns are genuinely useful for small, denormalized,
          rarely-queried-independently data (tags, flexible metadata). They are <strong>not</strong>{' '}
          a substitute for a proper join table when the "many" side needs its own identity,
          constraints, or independent querying — see the EAV anti-pattern discussion in the next
          lesson for where this line gets crossed.
        </p>
      </InfoBox>

      <h2>Constraints Most People Never Reach For</h2>

      <p>
        Everyone knows <code>NOT NULL</code>, <code>UNIQUE</code>, <code>CHECK</code> and foreign
        keys. Postgres has three more that remove whole categories of application code — each one
        turns a rule you were enforcing in Java into a rule the database enforces for every writer,
        forever.
      </p>

      <CodeBlock language="sql" title="GENERATED columns — derived data that cannot drift" showLineNumbers={true}>
{`-- A STORED generated column is computed on write and kept on disk. It can
-- never disagree with its inputs, because you are not allowed to write it.
CREATE TABLE order_items (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quantity    INT     NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL,
  line_total  NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

INSERT INTO order_items (quantity, unit_price) VALUES (3, 9.99);
-- line_total is 29.97 automatically. Writing to it directly is an ERROR,
-- which is the point: there is no code path that can put it out of sync.

-- Index them like any column — this is how you index a JSONB field with a
-- proper type instead of casting in every WHERE clause:
CREATE TABLE events (
  payload  JSONB NOT NULL,
  user_id  INT GENERATED ALWAYS AS ((payload->>'user_id')::int) STORED
);
CREATE INDEX ON events (user_id);

-- RULES: the expression must be IMMUTABLE, may reference only the CURRENT row
-- (no subqueries, no other tables), and cannot reference another generated
-- column.

-- ALWAYS WRITE THE STORAGE KEYWORD. PG12-17 accepted STORED only and made it
-- mandatory. PG18 added VIRTUAL (computed on read, zero disk) and made VIRTUAL
-- the DEFAULT, so an omitted keyword changes meaning across a major upgrade:
CREATE TABLE t (q INT, p NUMERIC, total NUMERIC GENERATED ALWAYS AS (q*p));
-- PG17: ERROR: syntax error at or near ")"   <- the keyword was required
-- PG18: accepted, and 'total' is VIRTUAL

-- That matters because a VIRTUAL column CANNOT BE INDEXED:
CREATE INDEX ON t (total);
-- ERROR: indexes on virtual generated columns are not supported
-- (verified on 18.6). So: STORED when you will index it or read it far more
-- often than you write it; VIRTUAL to skip the disk cost; a plain VIEW when
-- the expression isn't per-row. Never leave it to the default.`}
      </CodeBlock>

      <CodeBlock language="sql" title="EXCLUSION constraints — UNIQUE for things that aren't equality" showLineNumbers={true}>
{`-- "No two bookings for the same room may OVERLAP IN TIME."
-- UNIQUE can't express this: no two rows are equal, they merely intersect.
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- needed to mix = with &&

CREATE TABLE bookings (
  id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id   INT NOT NULL,
  during    TSTZRANGE NOT NULL,
  cancelled BOOLEAN NOT NULL DEFAULT FALSE,

  -- Read it as: reject a new row if there EXISTS a row where
  -- room_id = room_id AND during && during (&& = "ranges overlap").
  EXCLUDE USING GIST (
    room_id WITH =,
    during  WITH &&
  ) WHERE (NOT cancelled)          -- exclusion constraints can be partial too
);

INSERT INTO bookings (room_id, during)
VALUES (1, '[2026-03-01 09:00, 2026-03-01 11:00)');

INSERT INTO bookings (room_id, during)
VALUES (1, '[2026-03-01 10:00, 2026-03-01 12:00)');
-- ERROR: conflicting key value violates exclusion constraint

-- This is genuinely race-proof. The equivalent "SELECT to check for overlap,
-- then INSERT" in application code is NOT: two concurrent requests both see
-- no conflict and both insert. Doing it in the constraint is the only version
-- that holds under concurrency without an explicit lock.
-- Mind the range bounds: '[)' (inclusive-exclusive) is what you almost always
-- want, so a booking ending at 11:00 doesn't collide with one starting at 11:00.`}
      </CodeBlock>

      <CodeBlock language="sql" title="NULLS NOT DISTINCT — fixing UNIQUE's blind spot (PG15+)" showLineNumbers={true}>
{`-- By default, UNIQUE treats every NULL as distinct from every other NULL,
-- so a "unique" column happily accepts unlimited NULL rows:
CREATE TABLE contacts (email TEXT UNIQUE, tenant_id INT);
INSERT INTO contacts VALUES (NULL, 1), (NULL, 1), (NULL, 1);   -- all accepted!
DROP TABLE contacts;

-- PG15+ lets you say what you usually meant: NULLs collide with each other.
CREATE TABLE contacts (
  email     TEXT,
  tenant_id INT NOT NULL,
  UNIQUE NULLS NOT DISTINCT (email, tenant_id)
);
INSERT INTO contacts VALUES (NULL, 1);
INSERT INTO contacts VALUES (NULL, 1);   -- ERROR: duplicate key value

-- Where this actually bites: a nullable column in a composite unique key.
-- The same shape, on a table syncing rows from an external system:
CREATE TABLE crm_contacts (
  tenant_id    INT  NOT NULL,
  external_ref TEXT,                      -- NULL for manually-created rows
  UNIQUE (tenant_id, external_ref)        -- looks safe, isn't
);
-- Because every NULL is distinct from every other NULL, that constraint lets
-- ONE tenant accumulate unlimited NULL-ref rows. The duplicate data shows up
-- months later in a report rather than at insert time.
--
-- Before PG15 the workaround was two partial unique indexes: one for the rows
-- that have a ref, one that permits at most a single NULL-ref row per tenant.
CREATE UNIQUE INDEX ON crm_contacts (tenant_id, external_ref)
  WHERE external_ref IS NOT NULL;
CREATE UNIQUE INDEX ON crm_contacts (tenant_id)
  WHERE external_ref IS NULL;
-- From PG15 that whole pair collapses to:
--   UNIQUE NULLS NOT DISTINCT (tenant_id, external_ref)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why Push These Down Into the Schema">
        <p>
          Each of these replaces a rule that would otherwise live in application code — and
          application-code rules hold only for the code paths that remember them. The nightly
          import script, the admin console, the psql session someone opens during an incident, and
          next year's second service all write to the same tables. A constraint is the only kind of
          rule that applies to all of them.
        </p>
        <p>
          The concurrency argument is stronger still. &quot;Check, then write&quot; in application
          code is a race condition by construction: two requests can both pass the check before
          either writes. <code>EXCLUDE</code>, <code>UNIQUE</code>, and{' '}
          <code>ON CONFLICT</code> are the versions that survive concurrency, because the check and
          the write are the same operation.
        </p>
      </InfoBox>

      <h2>Getting Time and Money Right</h2>
      <p>
        Two type choices cause more production incidents than every exotic Postgres feature
        combined, and both look harmless in a <code>CREATE TABLE</code> review.
      </p>

      <CodeBlock language="sql" title="timestamptz vs timestamp" showLineNumbers={true}>
{`-- WRONG for almost every application: "timestamp without time zone".
-- It stores wall-clock digits with no zone attached. Two rows written at the
-- same instant from servers in different regions compare as different times,
-- and nothing in the database can tell you which is right.
created_at TIMESTAMP        -- alias for TIMESTAMP WITHOUT TIME ZONE

-- RIGHT: TIMESTAMPTZ. Despite the name it does NOT store a time zone.
-- It normalizes the input to UTC on write and renders it in the session's
-- TimeZone setting on read. One unambiguous instant, always.
created_at TIMESTAMPTZ NOT NULL DEFAULT now()

-- Both are 8 bytes. TIMESTAMPTZ is not more expensive.

-- Reading in a specific zone, without changing storage:
SELECT created_at AT TIME ZONE 'America/Chicago' FROM orders;

-- Use plain DATE or TIMESTAMP only for genuinely zone-less concepts:
--   a birthday, a store's "opens at 09:00" local rule, a fiscal calendar date.

-- Watch the function you default with:
now()                       -- TIMESTAMPTZ, transaction start time. Use this.
current_timestamp           -- same as now()
clock_timestamp()           -- actual wall clock, CHANGES within a transaction
statement_timestamp()       -- start of the current statement`}
      </CodeBlock>

      <InfoBox variant="warning" title="The interval trap that follows from this">
        <p>
          Once storage is correct, arithmetic still needs care. Adding{' '}
          <code>INTERVAL &apos;1 day&apos;</code> to a <code>TIMESTAMPTZ</code> adds one{' '}
          <em>calendar</em> day in the session time zone, which is 23 or 25 hours across a
          daylight-saving boundary; <code>INTERVAL &apos;24 hours&apos;</code> always adds exactly
          24 hours. They are different operations and both are sometimes what you want — &quot;the
          same time tomorrow&quot; is the first, &quot;a day&apos;s worth of elapsed time&quot; is
          the second. Bugs here surface twice a year, which makes them memorable.
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="Never store money in a float" showLineNumbers={true}>
{`-- WRONG. Binary floating point cannot represent 0.1 exactly, so sums drift.
price REAL              -- 4-byte float
price DOUBLE PRECISION  -- 8-byte float
price MONEY             -- also avoid: locale-dependent formatting, fixed to
                        -- the server's lc_monetary, awkward to work with

-- RIGHT: exact decimal arithmetic.
price NUMERIC(12, 2) NOT NULL CHECK (price >= 0)
--            |   +-- scale: digits after the decimal point
--            +------ precision: total significant digits

-- Demonstration of why:
SELECT 0.1::float8 + 0.2::float8;    -- 0.30000000000000004
SELECT 0.1::numeric + 0.2::numeric;  -- 0.3

-- The common alternative: store minor units as an integer.
-- Immune to rounding by construction, and maps to a Java long.
amount_cents BIGINT NOT NULL

-- If you store cents, ALWAYS store the currency too. A bare number is
-- meaningless the moment a second currency appears.
-- (TEXT, not CHAR(3) — see the note below on why CHAR's blank padding bites.)
currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$')

-- NUMERIC without a precision is legal and stores arbitrary precision, but
-- it accepts anything — including the 17-decimal-place result of a bad
-- division. Constrain it explicitly.`}
      </CodeBlock>

      <InfoBox variant="info" title="Text types, and the one that isn't a trap">
        <p>
          In Postgres, <code>TEXT</code>, <code>VARCHAR(n)</code>, and{' '}
          <code>VARCHAR</code> are the same type with the same storage and the same performance —{' '}
          <code>VARCHAR(n)</code> just adds a length check. There is no efficiency argument for
          picking a length limit, so pick one only when the limit is a genuine business rule.
          Prefer <code>TEXT</code> plus an explicit{' '}
          <code>CHECK (length(col) &lt;= 200)</code>, which is easier to change later: altering a{' '}
          <code>VARCHAR</code> length rewrites the table on older versions, while dropping and
          re-adding a <code>CHECK</code> does not.
        </p>
        <p>
          Avoid <code>CHAR(n)</code> entirely — it blank-pads to the declared length, and those
          trailing spaces then surprise you in comparisons and concatenations. For
          case-insensitive columns such as email, either store them normalized to lower case with
          a <code>UNIQUE</code> index on <code>lower(email)</code>, or use the{' '}
          <code>citext</code> extension.
        </p>
      </InfoBox>

      <h2>Naming Conventions That Scale</h2>

      <InfoBox variant="tip" title="Battle-Tested Naming Rules">
        <p><strong>Tables:</strong> Plural snake_case (<code>order_items</code>, not <code>OrderItem</code>). Matches Postgres's default lowercase folding — quoting mixed-case identifiers everywhere is a constant papercut.</p>
        <p><strong>Primary keys:</strong> <code>id</code> (in the table) or <code>table_id</code> (as foreign key). Be consistent.</p>
        <p><strong>Timestamps:</strong> Use <code>_at</code> suffix: <code>created_at</code>, <code>updated_at</code>, <code>deleted_at</code>.</p>
        <p><strong>Booleans:</strong> Use <code>is_</code> or <code>has_</code> prefix: <code>is_active</code>, <code>has_verified_email</code>.</p>
        <p><strong>Indexes:</strong> <code>idx_tablename_columns</code>. Foreign keys: <code>fk_tablename_reference</code>.</p>
      </InfoBox>

      <InteractiveChallenge
        question="A table has columns: (student_id, course_id, instructor_name, instructor_office). The PK is (student_id, course_id). instructor_office depends on instructor_name, which depends on course_id. What is the highest normal form this table satisfies?"
        options={[
          '1NF',
          '2NF',
          '3NF',
          'BCNF',
        ]}
        correctIndex={0}
        explanation="instructor_name depends on course_id alone (partial dependency on the composite PK), which violates 2NF. And instructor_office depends on instructor_name (transitive dependency), which violates 3NF. Since it violates 2NF, the highest form it satisfies is 1NF."
        language="sql"
      />
    </LessonLayout>
  );
}
