import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SqlTransactions() {
  return (
    <LessonLayout
      title="Transactions & ACID"
      sectionId="sql"
      lessonIndex={5}
      prev={{ path: "/sql/design", label: "Database Design" }}
      next={{ path: "/sql/cte", label: "CTEs & Recursive Queries" }}
    >
      <p>Transactions ensure database operations are reliable and consistent. ACID properties define what makes a transaction safe.</p>

      <FlowChart
        title="ACID Properties"
        chart={"graph TD\n  A[ACID] --> B[Atomicity - all or nothing]\n  A --> C[Consistency - valid state always]\n  A --> D[Isolation - concurrent txns separate]\n  A --> E[Durability - committed = permanent]"}
      />

      <h2>Transaction Basics</h2>
      <CodeBlock language="sql" title="Transaction Control">
{`-- Explicit transaction
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- both updates committed together

-- Rollback on error
BEGIN;
    INSERT INTO orders (customer_id, total) VALUES (42, 150.00);
    -- Something went wrong!
ROLLBACK; -- undo everything in this transaction

-- Savepoints — partial rollback
BEGIN;
    INSERT INTO A ...;
    SAVEPOINT sp1;
    INSERT INTO B ...;
    -- B failed, but keep A
    ROLLBACK TO SAVEPOINT sp1;
    -- continue with A committed
COMMIT;`}
      </CodeBlock>

      <h2>Isolation Levels</h2>
      <CodeBlock language="sql" title="Isolation Levels and Read Phenomena">
{`-- READ UNCOMMITTED — can see dirty reads (avoid in production)
-- READ COMMITTED   — default in PostgreSQL; no dirty reads
-- REPEATABLE READ  — same SELECT returns same rows within transaction
-- SERIALIZABLE     — strongest; transactions execute as if sequential

-- Set isolation level
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
...
COMMIT;

-- Dirty read:    reading uncommitted data from another transaction
-- Non-repeatable read: re-reading a row and getting different data (updated)
-- Phantom read:  re-running a query and getting new rows (inserted)

-- Isolation level   | Dirty Read | Non-repeatable | Phantom
-- READ UNCOMMITTED  | possible   | possible       | possible
-- READ COMMITTED    | prevented  | possible       | possible
-- REPEATABLE READ   | prevented  | prevented      | possible
-- SERIALIZABLE      | prevented  | prevented      | prevented`}
      </CodeBlock>

      <InfoBox variant="warning" title="Deadlocks">
        <p>Deadlocks happen when transaction A holds lock X and waits for lock Y, while transaction B holds lock Y and waits for lock X. The database detects deadlocks and kills one transaction. Prevent them by: accessing tables in consistent order, keeping transactions short, and using SELECT FOR UPDATE SKIP LOCKED for queue processing.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does ROLLBACK do?"
        options={["Commits the transaction permanently", "Undoes all changes made since BEGIN", "Saves a snapshot of the current state", "Restarts the database"]}
        correctIndex={1}
        explanation="ROLLBACK undoes all SQL statements executed since the BEGIN of the current transaction. It restores the database to the state it was in before the transaction started. Use it when an error occurs and you want to discard partial changes."
      />
    </LessonLayout>
  );
}
