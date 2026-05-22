import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SqlIndexing() {
  return (
    <LessonLayout
      title="Indexing & Performance"
      sectionId="sql"
      lessonIndex={3}
      prev={{ path: "/sql/window", label: "Window Functions" }}
      next={{ path: "/sql/design", label: "Database Design" }}
    >
      <p>Indexes dramatically speed up queries by creating efficient data structures. Understanding when and how to index is crucial for database performance.</p>

      <h2>How Indexes Work</h2>
      <FlowChart
        title="Table Scan vs Index Scan"
        chart={"graph TD\n  A[Query WHERE email = x] --> B{Index on email?}\n  B --> |No| C[Full table scan - O-n]\n  B --> |Yes| D[B-tree lookup - O-log-n]\n  D --> E[Jump directly to row]"}
      />

      <h2>Creating Indexes</h2>
      <CodeBlock language="sql" title="Index Types and Creation">
{`-- Basic index
CREATE INDEX idx_users_email ON users(email);

-- Unique index (also enforces uniqueness constraint)
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Composite index (order matters! — most selective column first)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- Partial index (indexes only a subset of rows)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Expression index
CREATE INDEX idx_lower_email ON users(LOWER(email));
-- Enables: WHERE LOWER(email) = 'alice@test.com'

-- Covering index (includes extra columns to avoid table lookup)
CREATE INDEX idx_orders_covering ON orders(user_id)
    INCLUDE (total, created_at, status); -- PostgreSQL

-- Check existing indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users';`}
      </CodeBlock>

      <h2>EXPLAIN ANALYZE</h2>
      <CodeBlock language="sql" title="Query Execution Plans">
{`-- EXPLAIN — shows the plan without executing
EXPLAIN SELECT * FROM users WHERE email = 'alice@test.com';
-- Seq Scan (bad!) or Index Scan (good!)

-- EXPLAIN ANALYZE — executes and shows actual timings
EXPLAIN ANALYZE SELECT u.name, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.name;

-- Key things to look for:
-- "Seq Scan" on large tables → needs an index
-- "Nested Loop" with large tables → consider JOIN order
-- High "Rows Removed by Filter" → index not selective enough
-- High actual vs estimated rows → stale statistics (ANALYZE table)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Too Many Indexes">
        <p>Indexes speed up reads but slow down writes (INSERT/UPDATE/DELETE must update all indexes). Do not index every column. Index columns in WHERE clauses, JOIN conditions, and ORDER BY that are queried on large tables. Remove unused indexes.</p>
      </InfoBox>

      <InteractiveChallenge
        question="For a composite index on (user_id, created_at), which query benefits from it?"
        options={["WHERE created_at > x", "WHERE user_id = 1 AND created_at > x", "WHERE created_at > x AND user_id = 1", "Both B and C"]}
        correctIndex={3}
        explanation="Both B and C benefit from the composite index because the query optimizer can reorder conditions. The leading column (user_id) must be present for the index to be used efficiently. A query on only created_at would NOT use this index (or would use it inefficiently)."
      />
    </LessonLayout>
  );
}
