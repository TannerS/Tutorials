import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Design() {
  return (
    <LessonLayout
      title="Schema Design & Normalization"
      sectionId="sql"
      lessonIndex={4}
      prev={{ path: '/sql/indexing', label: 'Indexing & Performance' }}
      next={{ path: '/sql/transactions', label: 'Transactions & Locking' }}
    >
      <p>Good schema design is the foundation that makes or breaks everything downstream — query performance, data integrity, and maintainability. Let's go beyond "just normalize it."</p>

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

-- AFTER: 3NF — each fact stored once
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  city_id INT REFERENCES cities(id)
);

CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  state VARCHAR(2) NOT NULL,
  UNIQUE (name, state)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL
);`}
      </CodeBlock>

      <h2>Star Schema for Analytics</h2>

      <CodeBlock language="sql" title="Star Schema: Fact + Dimension Tables" showLineNumbers={true}>
{`-- Fact table: granular events, foreign keys to dimensions, measures
CREATE TABLE fact_sales (
  sale_id BIGSERIAL PRIMARY KEY,
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
  product_key SERIAL PRIMARY KEY,
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

      <h2>Naming Conventions That Scale</h2>

      <InfoBox variant="tip" title="Battle-Tested Naming Rules">
        <p><strong>Tables:</strong> Plural snake_case (<code>order_items</code>, not <code>OrderItem</code>). Matches SQL conventions.</p>
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
