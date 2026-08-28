import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function TsqlTransactions() {
  return (
    <LessonLayout
      title="Transactions, Isolation & Locking"
      sectionId="tsql"
      lessonIndex={6}
      prev={{ path: '/tsql/programmability', label: 'Stored Procedures, Functions & Error Handling' }}
      next={{ path: '/tsql/indexing', label: 'Indexing, SARGability & Execution Plans' }}
    >
      <p>
        This is the most important lesson in the section. SQL Server&apos;s default concurrency model
        is <strong>pessimistic and lock-based</strong>, not snapshot-based like PostgreSQL. That one
        difference produces most of the production surprises people hit on this engine, and it is
        fixable with a single database setting that many installations never turn on.
      </p>

      <p>Everything below was run against a real SQL Server 2019 instance.</p>

      <h2>The Demonstration</h2>

      <p>
        A fresh database. One session opens a transaction, updates a row, and holds it. A second
        session simply <em>reads</em> that row — no transaction, no hints, an ordinary{' '}
        <code>SELECT</code>:
      </p>

      <CodeBlock language="sql" title="Session A — holds an uncommitted write">
{`BEGIN TRAN;
    UPDATE acct SET bal = 200 WHERE id = 1;
    WAITFOR DELAY '00:00:12';
ROLLBACK;`}
      </CodeBlock>

      <CodeBlock language="sql" title="Session B — just wants to read">
{`SET LOCK_TIMEOUT 8000;          -- give up after 8 seconds
SELECT bal FROM acct WHERE id = 1;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — default settings">
{`Msg 1222, Level 16, State 51 — Lock request time out period exceeded.

  reader returned after 9s`}
      </CodeBlock>

      <InfoBox variant="danger" title="A read was blocked by a write, then failed">
        <p>
          In PostgreSQL this cannot happen. Readers never block writers and writers never block
          readers, because a reader sees a consistent snapshot of committed data. On SQL Server with
          default settings, the reader needs a shared lock on the row, the writer holds an exclusive
          lock on it, and the reader waits — indefinitely, unless a lock timeout is set.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          This is why a long-running write transaction on SQL Server takes the application down rather
          than merely slowing it. Every reader queues behind it.
        </p>
      </InfoBox>

      <h2>The Fix: READ_COMMITTED_SNAPSHOT</h2>

      <CodeBlock language="text" title="Real output — the default on a new database">
{`SELECT name, is_read_committed_snapshot_on, snapshot_isolation_state_desc
FROM sys.databases WHERE name = 'lab';

name | rcsi | snapshot_iso
-----|------|-------------
lab  | 0    | OFF            <- OFF by default. This is the problem.`}
      </CodeBlock>

      <CodeBlock language="sql" title="One statement changes the whole model">
{`ALTER DATABASE lab SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the identical test, with RCSI on">
{`(writer again holds an uncommitted UPDATE setting bal = 999)

bal
---
100          <- the last COMMITTED value

  reader returned after 0s`}
      </CodeBlock>

      <p>
        Instant, and it read the pre-update value — exactly what Postgres would have done. With RCSI
        on, readers under the default isolation level use row versions from tempdb instead of taking
        shared locks. Reads stop blocking and stop being blocked.
      </p>

      <InfoBox variant="warning" title="What RCSI costs you">
        <p>
          Row versions live in <strong>tempdb</strong>, so tempdb gets busier and needs to be sized
          and placed accordingly. Each row also carries a 14-byte version pointer, so tables grow
          slightly. And the semantics genuinely change: a reader now sees a snapshot rather than the
          absolute latest committed state, so read-then-write logic that silently relied on blocking
          for correctness must be made explicit with <code>UPDLOCK</code> or an equivalent.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <code>WITH ROLLBACK IMMEDIATE</code> kills existing connections to take the required
          database lock. Do not run it casually on a live system.
        </p>
      </InfoBox>

      <h2>The Isolation Levels</h2>

      <CodeBlock language="text" title="What each one prevents">
{`                    dirty   non-repeatable   phantom
                    read    read              read
READ UNCOMMITTED     YES        YES            YES     reads garbage
READ COMMITTED        no        YES            YES     <- the DEFAULT
REPEATABLE READ       no         no            YES
SERIALIZABLE          no         no             no     range locks
SNAPSHOT              no         no             no     versioned, no locks

SET TRANSACTION ISOLATION LEVEL READ COMMITTED;   -- per session

READ COMMITTED has TWO implementations, chosen by the database setting:
  RCSI off  -> locking. Readers take shared locks and can block.
  RCSI on   -> versioning. Readers see a snapshot. No blocking.
Same name, same code, completely different concurrency behaviour.`}
      </CodeBlock>

      <InfoBox variant="danger" title="NOLOCK is not a performance hint">
        <p>
          <code>WITH (NOLOCK)</code> — equivalent to READ UNCOMMITTED — is extremely common in
          production T-SQL and is almost always a mistake. It does not just risk reading uncommitted
          data that later rolls back. Because it ignores locks entirely, a scan can <strong>miss rows
          that exist</strong> or <strong>read the same row twice</strong> when page splits move data
          during the read. You can get a wrong <code>COUNT(*)</code> on a table nobody deleted from.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          If <code>NOLOCK</code> is sprinkled through a codebase, it is nearly always a workaround for
          blocking that RCSI would fix properly. Turn on RCSI and remove the hints.
        </p>
      </InfoBox>

      <h2>Deadlocks</h2>

      <FlowChart
        title="The classic deadlock, and why ordering fixes it"
        chart={"graph TD\n  A[\"Session 1<br/>locks row A\"] --> B[\"Session 1 wants row B\"]\n  C[\"Session 2<br/>locks row B\"] --> D[\"Session 2 wants row A\"]\n  B -.->|\"waits on\"| C\n  D -.->|\"waits on\"| A\n  B --> E[\"DEADLOCK<br/>SQL Server kills the<br/>cheaper transaction\"]\n  D --> E\n  E --> F[\"Msg 1205<br/>chosen as the deadlock victim\"]\n  style E fill:#3b1a1a,stroke:#f87171\n  style F fill:#3b1a1a,stroke:#f87171"}
      />

      <CodeBlock language="text" title="Handling them">
{`Error 1205 — "Transaction was deadlocked on resources with another
process and has been chosen as the deadlock victim."

THE PREVENTION: always touch tables in the SAME ORDER everywhere.
Most application deadlocks are two code paths that update the same two
tables in opposite order.

THE MITIGATION: deadlocks are NORMAL under load. A victim transaction is
rolled back cleanly, so the correct response is to RETRY it. Catch 1205
specifically and retry with a short backoff:

  BEGIN CATCH
      IF ERROR_NUMBER() = 1205 AND @attempt < 3
      BEGIN
          ROLLBACK; WAITFOR DELAY '00:00:00.100';
          -- retry
      END
      ELSE THROW;
  END CATCH`}
      </CodeBlock>

      <h2>Diagnosing Blocking Live</h2>

      <CodeBlock language="sql" title="Who is blocking whom, right now">
{`SELECT r.session_id, r.blocking_session_id, r.wait_type, r.wait_time,
       r.status, t.text AS running_sql
FROM   sys.dm_exec_requests AS r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) AS t
WHERE  r.blocking_session_id <> 0;

-- what is the head blocker actually doing?
DBCC INPUTBUFFER(<that blocking_session_id>);

-- open transactions, oldest first — a long one is usually the culprit
SELECT * FROM sys.dm_tran_active_transactions
ORDER BY transaction_begin_time;`}
      </CodeBlock>

      <InfoBox variant="tip" title="Keep transactions short, and never wait on a human">
        <p>
          The most common cause of severe blocking is a transaction opened before some slow work — an
          API call, a file write, or worst of all a user confirmation dialog — and committed after.
          Locks are held the entire time. Read the data, close the transaction, do the slow thing,
          then open a second short transaction to write, checking that the row has not changed since.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Your SQL Server app slows to a crawl under load. Reports time out, and developers have been adding WITH (NOLOCK) to fix it. sys.dm_exec_requests shows many sessions with a non-zero blocking_session_id and LCK_M_S waits. What is the correct fix?"
        options={[
          'Continue adding NOLOCK — it is the standard solution for this',
          'Enable READ_COMMITTED_SNAPSHOT so readers use row versions instead of shared locks, then remove the NOLOCK hints and shorten the long write transactions',
          'Raise the isolation level to SERIALIZABLE for consistency',
          'Add more indexes to make the reports faster',
        ]}
        correctIndex={1}
        explanation={"LCK_M_S is a wait for a shared lock — readers queuing behind writers, which is the signature failure of lock-based READ COMMITTED. NOLOCK does make the symptom disappear, which is exactly why it spreads, but it buys that by permitting dirty reads and, less well known, missed or duplicated rows during scans that encounter page splits. RCSI addresses the actual cause: readers take row versions from tempdb instead of shared locks, so they neither block nor get blocked, without giving up read consistency. Budget for tempdb load, and separately hunt down the long-running write transactions, since RCSI stops readers from suffering but does not make a five-minute write transaction acceptable. SERIALIZABLE would take MORE locks and make it worse."}
      />
    </LessonLayout>
  );
}

export default TsqlTransactions;
