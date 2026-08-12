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
  sku UUID DEFAULT gen_random_uuid()    -- UUID PK/alt-key, no sequence contention
);

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
currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$')

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
