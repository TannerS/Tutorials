import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SqlQuickstart() {
  return (
    <LessonLayout
      title="SQL Quickstart"
      sectionId="sql"
      lessonIndex={0}
      prev={null}
      next={{ path: "/sql/joins", label: "Joins & Subqueries" }}
    >
      <p>A rapid SQL refresher covering the most common operations you will use daily.</p>

      <h2>Basic SELECT</h2>
      <CodeBlock language="sql" title="SELECT Patterns">
{`-- Select all columns
SELECT * FROM users;

-- Select specific columns
SELECT id, name, email FROM users;

-- Filter with WHERE
SELECT * FROM users WHERE active = true AND age > 18;

-- Pattern matching
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- NULL checks
SELECT * FROM orders WHERE shipped_at IS NULL;
SELECT * FROM orders WHERE shipped_at IS NOT NULL;

-- Sorting
SELECT * FROM products ORDER BY price DESC, name ASC;

-- Limit and offset (pagination)
SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 20;

-- Distinct values
SELECT DISTINCT category FROM products;`}
      </CodeBlock>

      <h2>Aggregation and Grouping</h2>
      <CodeBlock language="sql" title="GROUP BY and HAVING">
{`-- Aggregate functions
SELECT COUNT(*), AVG(price), MIN(price), MAX(price), SUM(quantity)
FROM order_items;

-- Group by category
SELECT category, COUNT(*) as count, AVG(price) as avg_price
FROM products
GROUP BY category
ORDER BY avg_price DESC;

-- HAVING — filter groups (WHERE filters rows, HAVING filters groups)
SELECT category, COUNT(*) as count
FROM products
GROUP BY category
HAVING COUNT(*) > 5;  -- only categories with more than 5 products

-- Conditional aggregation
SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count
FROM users;`}
      </CodeBlock>

      <h2>INSERT, UPDATE, DELETE</h2>
      <CodeBlock language="sql" title="Data Modification">
{`-- INSERT single row
INSERT INTO users (name, email, age) VALUES ('Alice', 'alice@test.com', 30);

-- INSERT multiple rows
INSERT INTO products (name, price, category)
VALUES
    ('Widget A', 9.99, 'widgets'),
    ('Widget B', 14.99, 'widgets');

-- INSERT with SELECT
INSERT INTO archive_users SELECT * FROM users WHERE active = false;

-- UPDATE
UPDATE users SET email = 'newemail@test.com' WHERE id = 42;

-- UPDATE with JOIN (PostgreSQL)
UPDATE orders o
SET total = o.total * 0.9
FROM users u
WHERE o.user_id = u.id AND u.is_vip = true;

-- DELETE
DELETE FROM sessions WHERE expires_at < NOW();

-- UPSERT (INSERT or UPDATE on conflict)
INSERT INTO preferences (user_id, key, value)
VALUES (1, 'theme', 'dark')
ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value;`}
      </CodeBlock>

      <InfoBox variant="tip" title="Always Use WHERE with UPDATE/DELETE">
        <p>Running UPDATE or DELETE without a WHERE clause affects ALL rows. Always test your WHERE clause with a SELECT first, and use transactions for risky operations so you can ROLLBACK if something goes wrong.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between WHERE and HAVING?"
        options={["They are identical", "WHERE filters individual rows before grouping; HAVING filters groups after GROUP BY", "HAVING is for JOINs only", "WHERE only works with SELECT"]}
        correctIndex={1}
        explanation="WHERE filters rows before they are grouped (before GROUP BY runs). HAVING filters the resulting groups after GROUP BY. You cannot use aggregate functions like COUNT() in WHERE — use HAVING instead."
      />
    </LessonLayout>
  );
}
