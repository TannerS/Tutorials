import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SqlDesign() {
  return (
    <LessonLayout
      title="Database Design"
      sectionId="sql"
      lessonIndex={4}
      prev={{ path: "/sql/indexing", label: "Indexing & Performance" }}
      next={{ path: "/sql/transactions", label: "Transactions & ACID" }}
    >
      <p>Good database design prevents data anomalies and enables efficient queries. Normalization is the formal process for eliminating redundancy.</p>

      <h2>Normal Forms</h2>
      <FlowChart
        title="Normalization Steps"
        chart={"graph LR\n  A[Raw Table] --> B[1NF - Atomic values]\n  B --> C[2NF - No partial deps]\n  C --> D[3NF - No transitive deps]\n  D --> E[BCNF - Stricter 3NF]\n  E --> F[4NF/5NF - Rare in practice]"}
      />

      <CodeBlock language="sql" title="Normalization Example">
{`-- UN-NORMALIZED: orders with repeated customer data (update anomaly!)
-- order_id | customer_name | customer_email | product | qty | price

-- 1NF: Atomic values — no lists or repeating groups
-- order_id | customer_id | product_id | qty | price (one row per item)

-- 2NF: No partial dependencies (all non-key columns depend on FULL key)
-- Orders(order_id, customer_id, ordered_at)
-- OrderItems(order_id, product_id, qty, price_at_time)
-- Customers(customer_id, name, email)

-- 3NF: No transitive dependencies
-- Products(product_id, name, price, category_id)
-- Categories(category_id, name, description)  -- not in Products!

-- Well-designed schema
CREATE TABLE customers (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    customer_id INT         NOT NULL REFERENCES customers(id),
    status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INT          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT          NOT NULL REFERENCES products(id),
    quantity   INT          NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL  -- snapshot of price at time of order
);`}
      </CodeBlock>

      <h2>Relationships and Keys</h2>
      <CodeBlock language="sql" title="Constraints and Relationships">
{`-- Primary key
id SERIAL PRIMARY KEY

-- Foreign key with cascades
order_id INT NOT NULL REFERENCES orders(id)
    ON DELETE CASCADE     -- delete order items when order deleted
    ON UPDATE CASCADE     -- propagate id changes

-- Other cascade options:
-- ON DELETE SET NULL    -- set FK to NULL when parent deleted
-- ON DELETE RESTRICT    -- prevent parent deletion if children exist (default)

-- Check constraint
age INT CHECK (age >= 0 AND age <= 150),
status VARCHAR CHECK (status IN ('active', 'inactive', 'suspended'))

-- Unique constraint
UNIQUE (user_id, product_id) -- composite unique

-- Many-to-many via junction table
CREATE TABLE user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Denormalize">
        <p>Normalize first, then denormalize if you measure performance problems. Common denormalization: storing computed aggregates (order_total, comment_count), duplicating columns to avoid expensive JOINs in read-heavy tables, or using JSON columns for truly variable data.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Which normal form eliminates transitive dependencies?"
        options={["1NF", "2NF", "3NF", "BCNF"]}
        correctIndex={2}
        explanation="Third Normal Form (3NF) requires that every non-key attribute depends ONLY on the primary key, not on other non-key attributes. Example: if Products has (product_id, category_id, category_name), category_name depends on category_id (not the PK) — that is a transitive dependency. Move category_name to a Categories table."
      />
    </LessonLayout>
  );
}
