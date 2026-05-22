import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Transactions() {
  return (
    <LessonLayout
      title="Transactions & Locking"
      sectionId="sql"
      lessonIndex={5}
      prev={{ path: '/sql/design', label: 'Schema Design & Normalization' }}
      next={{ path: '/sql/cte', label: 'CTEs & Recursive Queries' }}
    >
      <p>Concurrency is where databases earn their keep. Understanding isolation levels, locking strategies, and MVCC is the difference between a system that works under load and one that deadlocks at 3 AM.</p>

      <h2>ACID Properties in Detail</h2>

      <InfoBox variant="info" title="ACID Properties">
        <p><strong>Atomicity:</strong> All or nothing. If any part fails, the entire transaction rolls back.</p>
        <p><strong>Consistency:</strong> Transactions move the DB from one valid state to another. Constraints are enforced.</p>
        <p><strong>Isolation:</strong> Concurrent transactions don't interfere with each other (degree depends on isolation level).</p>
        <p><strong>Durability:</strong> Once committed, data survives crashes. WAL (Write-Ahead Log) guarantees this.</p>
      </InfoBox>

      <h2>Transaction Basics: BEGIN, COMMIT, ROLLBACK</h2>

      <CodeBlock language="sql" title="Transaction Lifecycle" showLineNumbers={true}>
{`-- Basic transaction
BEGIN;
  INSERT INTO orders (customer_id, total) VALUES (1, 99.99);
  INSERT INTO order_items (order_id, product_id, qty) VALUES (currval('orders_id_seq'), 5, 2);
COMMIT;  -- both inserts succeed together

-- If something goes wrong, ROLLBACK undoes everything
BEGIN;
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;
  -- Oops, account 2 doesn't exist
ROLLBACK;  -- neither update persists

-- SAVEPOINT: partial rollback within a transaction
BEGIN;
  INSERT INTO orders (customer_id, total) VALUES (1, 50.00);
  SAVEPOINT before_bonus;

  UPDATE accounts SET balance = balance + 100 WHERE id = 1;
  -- Something went wrong with the bonus, but the order is fine
  ROLLBACK TO SAVEPOINT before_bonus;

  -- Order insert is still intact, bonus was rolled back
COMMIT;`}
      </CodeBlock>

      <FlowChart
        title="Transaction Lifecycle"
        chart={"graph TD\n  A[BEGIN] --> B{Execute Statements}\n  B --> C{Error?}\n  C -->|No| D[COMMIT]\n  C -->|Yes| E{SAVEPOINT?}\n  E -->|Yes| F[ROLLBACK TO SAVEPOINT]\n  E -->|No| G[ROLLBACK]\n  F --> B\n  D --> H[Changes Persisted]\n  G --> I[All Changes Undone]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style D fill:#1a3329,stroke:#4ade80\n  style G fill:#3b1a1a,stroke:#dc2626\n  style H fill:#1a3329,stroke:#4ade80\n  style I fill:#3b1a1a,stroke:#dc2626"}
      />

      <h2>Practical Example: Bank Transfer</h2>

      <CodeBlock language="sql" title="Bank Transfer — The Classic Transaction" showLineNumbers={true}>
{`-- Transfer $500 from account 1 to account 2
-- This MUST be atomic: both succeed or both fail

BEGIN;
  -- Step 1: Debit the sender
  UPDATE accounts
  SET balance = balance - 500.00
  WHERE id = 1 AND balance >= 500.00;  -- check sufficient funds

  -- Verify the debit happened (sufficient funds check)
  -- In application code: check that 1 row was affected
  -- If 0 rows affected -> insufficient funds -> ROLLBACK

  -- Step 2: Credit the receiver
  UPDATE accounts
  SET balance = balance + 500.00
  WHERE id = 2;

  -- Step 3: Record the transfer
  INSERT INTO transfers (from_account, to_account, amount, transferred_at)
  VALUES (1, 2, 500.00, NOW());

COMMIT;

-- Without a transaction, a crash between Step 1 and Step 2
-- would lose $500 forever. Atomicity prevents this.`}
      </CodeBlock>

      <h2>Isolation Levels & Anomalies</h2>

      <FlowChart
        title="Isolation Levels: What Each One Prevents"
        chart={"graph LR\n  subgraph \"READ UNCOMMITTED\"\n    RU[\"Prevents: nothing\"]\n  end\n  subgraph \"READ COMMITTED\"\n    RC[\"Prevents: dirty reads\"]\n  end\n  subgraph \"REPEATABLE READ\"\n    RR[\"Prevents: dirty reads +\\nnon-repeatable reads\"]\n  end\n  subgraph \"SERIALIZABLE\"\n    S[\"Prevents: all anomalies\\nincluding phantoms\"]\n  end\n  RU --> RC --> RR --> S\n  style RU fill:#3b1a1a,stroke:#dc2626\n  style RC fill:#3d2f14,stroke:#d97706\n  style RR fill:#1a2744,stroke:#5b9cf6\n  style S fill:#1a3329,stroke:#4ade80"}
      />

      <h3>The Three Anomalies Explained</h3>

      <InfoBox variant="danger" title="Dirty Read">
        <p>
          Reading data written by a transaction that hasn't committed yet. If that transaction
          rolls back, you've made decisions based on data that <em>never existed</em>.
          Prevented by: READ COMMITTED and above.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Non-Repeatable Read">
        <p>
          You read a row, another transaction modifies and commits it, then you re-read and get
          a <em>different value</em>. Your transaction sees inconsistent data within the same query session.
          Prevented by: REPEATABLE READ and above.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Phantom Read">
        <p>
          You query a set of rows (e.g., all pending orders), another transaction inserts a new matching
          row and commits, then you re-query and see an <em>extra row that wasn't there before</em>.
          Prevented by: SERIALIZABLE only (and PostgreSQL's REPEATABLE READ via snapshot isolation).
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="Isolation Anomalies Demonstrated" showLineNumbers={true}>
{`-- DIRTY READ (prevented by READ COMMITTED and above)
-- TX1: UPDATE accounts SET balance = 0 WHERE id = 1;  (not committed)
-- TX2: SELECT balance FROM accounts WHERE id = 1;      (sees 0 — wrong!)
-- TX1: ROLLBACK;
-- TX2 used data that never existed.

-- NON-REPEATABLE READ (prevented by REPEATABLE READ and above)
-- TX1: SELECT balance FROM accounts WHERE id = 1;  -> 1000
-- TX2: UPDATE accounts SET balance = 500 WHERE id = 1; COMMIT;
-- TX1: SELECT balance FROM accounts WHERE id = 1;  -> 500 (different!)

-- PHANTOM READ (prevented by SERIALIZABLE only)
-- TX1: SELECT COUNT(*) FROM orders WHERE status = 'pending';  -> 5
-- TX2: INSERT INTO orders (status) VALUES ('pending'); COMMIT;
-- TX1: SELECT COUNT(*) FROM orders WHERE status = 'pending';  -> 6 (phantom!)

-- Setting isolation level
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
  -- your queries here see a consistent snapshot
COMMIT;

-- PostgreSQL default is READ COMMITTED
-- MySQL InnoDB default is REPEATABLE READ`}
      </CodeBlock>

      <h2>Locking: Row-Level vs Table-Level</h2>

      <CodeBlock language="sql" title="Lock Types in PostgreSQL" showLineNumbers={true}>
{`-- ROW-LEVEL LOCKS (most common, least disruptive)
-- FOR UPDATE: exclusive row lock — blocks other FOR UPDATE and writes
SELECT * FROM inventory WHERE product_id = 42 FOR UPDATE;

-- FOR SHARE: shared row lock — blocks writes but allows other FOR SHARE
SELECT * FROM orders WHERE id = 100 FOR SHARE;

-- FOR NO KEY UPDATE: like FOR UPDATE but doesn't block FOR KEY SHARE
-- Useful when you're updating non-key columns
SELECT * FROM employees WHERE id = 1 FOR NO KEY UPDATE;

-- TABLE-LEVEL LOCKS (heavy, use sparingly)
LOCK TABLE inventory IN EXCLUSIVE MODE;  -- blocks all other access
LOCK TABLE inventory IN SHARE MODE;      -- blocks writes, allows reads

-- Lock modes from weakest to strongest:
-- ACCESS SHARE < ROW SHARE < ROW EXCLUSIVE < SHARE UPDATE EXCLUSIVE
-- < SHARE < SHARE ROW EXCLUSIVE < EXCLUSIVE < ACCESS EXCLUSIVE`}
      </CodeBlock>

      <h2>Locking Strategies</h2>

      <CodeBlock language="sql" title="Pessimistic vs Optimistic Locking" showLineNumbers={true}>
{`-- PESSIMISTIC LOCKING: lock the row, block other transactions
BEGIN;
  SELECT * FROM inventory
  WHERE product_id = 42
  FOR UPDATE;                    -- acquires row lock, others block here

  UPDATE inventory
  SET quantity = quantity - 1
  WHERE product_id = 42;
COMMIT;                          -- lock released

-- FOR UPDATE SKIP LOCKED: non-blocking queue pattern
-- "Give me one unprocessed job, skip any that are locked"
BEGIN;
  SELECT * FROM job_queue
  WHERE status = 'pending'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;       -- skip rows locked by other workers

  UPDATE job_queue SET status = 'processing' WHERE id = <selected_id>;
COMMIT;

-- OPTIMISTIC LOCKING: no locks, detect conflicts at write time
-- Add a version column
ALTER TABLE products ADD COLUMN version INT DEFAULT 1;

-- Read the current version
-- App reads: { id: 42, name: 'Widget', price: 9.99, version: 3 }

-- Update only if version hasn't changed
UPDATE products
SET price = 10.99, version = version + 1
WHERE id = 42 AND version = 3;  -- version check!

-- If 0 rows affected -> someone else modified it -> retry or error`}
      </CodeBlock>

      <h2>Deadlocks</h2>

      <p>
        A deadlock occurs when two or more transactions are each waiting for a lock held by the other.
        Neither can proceed — the database must detect and kill one of them.
      </p>

      <FlowChart
        title="Deadlock: TX1 and TX2 waiting on each other"
        chart={"graph LR\n  TX1[TX1: holds lock on Row A] -->|Waiting for Row B| TX2[TX2: holds lock on Row B]\n  TX2 -->|Waiting for Row A| TX1\n  style TX1 fill:#3b1a1a,stroke:#dc2626\n  style TX2 fill:#3b1a1a,stroke:#dc2626"}
      />

      <CodeBlock language="sql" title="Deadlock Example and Prevention" showLineNumbers={true}>
{`-- DEADLOCK SCENARIO:
-- TX1: BEGIN; UPDATE accounts SET balance = 100 WHERE id = 1; -- locks row 1
-- TX2: BEGIN; UPDATE accounts SET balance = 200 WHERE id = 2; -- locks row 2
-- TX1: UPDATE accounts SET balance = 300 WHERE id = 2; -- WAITS for TX2
-- TX2: UPDATE accounts SET balance = 400 WHERE id = 1; -- WAITS for TX1
-- DEADLOCK! PostgreSQL detects this and kills one transaction.

-- PREVENTION: Always lock rows in the same order
BEGIN;
  -- Sort IDs and always lock lower ID first
  UPDATE accounts SET balance = balance - 100
  WHERE id = LEAST(1, 2);  -- always lock the lower ID first
  UPDATE accounts SET balance = balance + 100
  WHERE id = GREATEST(1, 2);
COMMIT;

-- Set a lock timeout to fail fast
SET lock_timeout = '5s';  -- error after 5 seconds of waiting

-- Catch and retry deadlocks in application code:
-- PostgreSQL error code: 40P01 (deadlock_detected)
-- MySQL error: 1213 (ER_LOCK_DEADLOCK)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Deadlock Prevention Checklist">
        <p><strong>Always acquire locks in a consistent order.</strong> If TX1 locks row A then B, and TX2 locks B then A, deadlock occurs.</p>
        <p><strong>Keep transactions short.</strong> The longer you hold locks, the higher the deadlock probability.</p>
        <p><strong>Use lock timeouts:</strong> <code>SET lock_timeout = '5s';</code> to fail fast instead of blocking forever.</p>
        <p><strong>Detect and retry:</strong> Catch deadlock errors (PostgreSQL: error code 40P01) and retry the transaction.</p>
      </InfoBox>

      <h2>MVCC: How PostgreSQL Actually Works</h2>

      <InfoBox variant="note" title="Multi-Version Concurrency Control">
        <p>
          PostgreSQL doesn't use read locks. Instead, every row has hidden <code>xmin</code> and <code>xmax</code> fields
          tracking which transaction created/deleted it. Readers see a <strong>snapshot</strong> of the database at
          their transaction's start time. Writers create new row versions instead of overwriting. This means:
        </p>
        <p><strong>Readers never block writers. Writers never block readers.</strong></p>
        <p>
          The tradeoff: dead tuples accumulate and must be cleaned by <code>VACUUM</code>. Autovacuum
          handles this, but write-heavy tables may need tuning. Long-running transactions prevent
          cleanup of old versions — avoid holding transactions open for minutes/hours.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Two transactions run concurrently under REPEATABLE READ. TX1 reads all orders with status='pending' (gets 5 rows). TX2 inserts a new pending order and commits. TX1 re-reads pending orders. How many rows does TX1 see?"
        options={[
          '5 — snapshot is frozen at TX start',
          '6 — new committed data is always visible',
          'Error — conflict detected',
          'Depends on the database engine',
        ]}
        correctIndex={0}
        explanation="REPEATABLE READ guarantees a consistent snapshot from the start of the transaction. TX1 won't see TX2's insert — that's the whole point. This prevents non-repeatable reads. Note: this also prevents phantom reads in PostgreSQL's implementation (which uses snapshot isolation), though the SQL standard says REPEATABLE READ doesn't guarantee phantom prevention."
        language="sql"
      />

      <InteractiveChallenge
        question={"TX1 locks row A then requests row B. TX2 locks row B then requests row A. What happens?"}
        options={[
          'TX1 gets priority because it started first',
          'Both transactions succeed after a brief wait',
          'A deadlock occurs — the database kills one transaction',
          'Both transactions are rolled back',
        ]}
        correctIndex={2}
        explanation="This is a classic deadlock: each transaction holds a lock the other needs, and neither can proceed. The database's deadlock detector identifies the cycle and terminates one transaction (usually the one that has done less work), allowing the other to continue."
        language="sql"
      />

      <InteractiveChallenge
        question={"Which locking strategy should you use when conflicts are RARE and you want maximum throughput?"}
        options={[
          'Pessimistic locking with FOR UPDATE',
          'Table-level EXCLUSIVE lock',
          'Optimistic locking with a version column',
          'SERIALIZABLE isolation level',
        ]}
        correctIndex={2}
        explanation="Optimistic locking is ideal when conflicts are rare. It avoids acquiring locks entirely, allowing maximum concurrency. It only detects conflicts at write time via a version check. Pessimistic locking blocks other transactions preemptively, which reduces throughput when conflicts are infrequent."
        language="sql"
      />
    </LessonLayout>
  );
}
