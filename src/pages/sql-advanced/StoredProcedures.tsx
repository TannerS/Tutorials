import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function StoredProcedures() {
  return (
    <LessonLayout
      title="Stored Procedures"
      sectionId="sql-advanced"
      lessonIndex={2}
      prev={{ path: '/sql-advanced/cte', label: 'CTEs & Recursive Queries' }}
      next={{ path: '/sql-advanced/advanced', label: 'Advanced SQL Patterns' }}
    >
      <p>
        A stored procedure is a named, precompiled block of SQL — with parameters, variables, and
        control flow — that lives and runs inside the database server itself. Instead of an
        application sending a full query string over the network every time, it sends a short
        invocation (<code>CALL proc_name(...)</code>) and the database does the rest. The main
        reason anyone reaches for one isn't mysticism about "business logic in the database" — it's
        that the whole block runs as <em>one</em> network round trip instead of several.
      </p>

      <h2>What a Stored Procedure Actually Is</h2>

      <p>
        In PostgreSQL, a stored procedure is written in a procedural language — almost always
        PL/pgSQL, the dialect used throughout this lesson (Postgres also supports PL/Python,
        PL/Perl, and others, but PL/pgSQL is the default and by far the most common). It's compiled
        once, cached by the server, and invoked by name and argument list rather than resent as
        text every call.
      </p>

      <CodeBlock language="sql" title="Minimal Stored Procedure" showLineNumbers={true}>
{`CREATE OR REPLACE PROCEDURE greet(p_name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'Hello, %!', p_name;
END;
$$;

-- Postgres invokes procedures with CALL (SQL Server uses EXEC / EXECUTE instead)
CALL greet('Ada');
-- NOTICE:  Hello, Ada!`}
      </CodeBlock>

      <p>
        The <code>$$ ... $$</code> pair is <strong>dollar-quoting</strong> — Postgres's way of
        writing a string literal (here, the procedure body) without having to escape every single
        quote inside it. You'll see it in every procedure and function body in this lesson.
      </p>

      <h2>The Real Reason: One Round Trip Instead of N</h2>

      <p>
        Say your app needs to place an order. Done naively from application code, that's three
        separate statements, each its own trip to the database:
      </p>

      <CodeBlock language="sql" title="Three Statements = Three Round Trips" showLineNumbers={true}>
{`-- Round trip 1: app sends this, waits for the network + DB to respond
SELECT quantity FROM inventory WHERE product_id = 42;
-- app receives the result, decides in its own code that there's enough stock

-- Round trip 2: app sends this, waits again
UPDATE inventory SET quantity = quantity - 2 WHERE product_id = 42;

-- Round trip 3: app sends this, waits again
INSERT INTO orders (customer_id, product_id, quantity, ordered_at)
VALUES (55, 42, 2, NOW());`}
      </CodeBlock>

      <p>
        Every one of those is a full round trip: app → network → DB → network → app. Wrap the same
        three statements in a stored procedure and the app makes <strong>one</strong> call; the
        SELECT, UPDATE, and INSERT all happen back-to-back inside the database server with zero
        network hops between them:
      </p>

      <CodeBlock language="sql" title="One Procedure = One Round Trip" showLineNumbers={true}>
{`CREATE OR REPLACE PROCEDURE place_order(
  p_product_id  INT,
  p_customer_id INT,
  p_quantity    INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_available INT;
BEGIN
  SELECT quantity INTO v_available
  FROM inventory
  WHERE product_id = p_product_id
  FOR UPDATE;                          -- lock the row for the rest of this transaction

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'No such product: %', p_product_id;
  END IF;

  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product % (have %, need %)',
      p_product_id, v_available, p_quantity;
  END IF;

  UPDATE inventory
  SET quantity = quantity - p_quantity
  WHERE product_id = p_product_id;

  INSERT INTO orders (customer_id, product_id, quantity, ordered_at)
  VALUES (p_customer_id, p_product_id, p_quantity, NOW());
END;
$$;

-- The app now makes exactly one call:
CALL place_order(42, 55, 2);`}
      </CodeBlock>

      <FlowChart
        title="Three Round Trips vs. One"
        chart={"graph TD\n  subgraph W[\"Without a stored procedure\"]\n    A1[\"App sends SELECT\"] -->|\"round trip 1\"| A2[\"App decides:\\nenough stock?\"]\n    A2 --> A3[\"App sends UPDATE\"]\n    A3 -->|\"round trip 2\"| A4[\"App sends INSERT\"]\n    A4 -->|\"round trip 3\"| A5[\"Done\"]\n  end\n  subgraph S[\"With place_order(...)\"]\n    B1[\"App sends CALL place_order(...)\"] -->|\"round trip 1\"| B2[\"DB runs SELECT + UPDATE + INSERT\\nback-to-back, no network in between\"]\n    B2 --> B3[\"Done\"]\n  end\n  style A2 fill:#3a1f1f,stroke:#f87171\n  style A3 fill:#3a1f1f,stroke:#f87171\n  style A4 fill:#3a1f1f,stroke:#f87171\n  style B2 fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        Quantify it: a single round trip on a fast local network is roughly 2–5ms; from an app
        server to a database in a different region it can be an order of magnitude worse. Three
        round trips instead of one doesn't matter for a single request in isolation, but under
        real load — thousands of these per second — it's a real, measurable difference in both
        latency and the number of open connections/threads tied up waiting on the network. It also
        shrinks the window between the SELECT and the UPDATE where a concurrent request could read
        the same stock count and oversell it.
      </p>

      <InfoBox variant="warning" title="A Procedure Alone Doesn't Guarantee Atomicity">
        <p>
          Notice <code>place_order</code> above never says <code>BEGIN</code> / <code>COMMIT</code>.
          When you <code>CALL</code> a procedure outside of an explicit transaction, Postgres treats
          the whole call as one implicit transaction — so in this example it happens to be atomic
          as a side effect of autocommit, not because "stored procedure" inherently means "atomic."
          If this same logic were split across multiple statements sent from the app instead, or if
          the procedure were called from inside a larger transaction alongside other work, you'd
          need to reason about transaction boundaries explicitly. Don't assume a procedure is safe
          under concurrency just because it's a procedure — pair it with proper transaction and
          locking discipline (see the <a href="/sql-advanced/transactions">Transactions & Locking</a>{' '}
          lesson). The <code>FOR UPDATE</code> row lock above is doing real work here, not the mere
          fact that this is a procedure.
        </p>
      </InfoBox>

      <h2>Other Real Reasons to Reach for Them</h2>

      <p>Round-trip reduction is the headline, but a few other reasons are genuinely worth knowing — each with a real trade-off attached, not just a bullet point:</p>

      <InfoBox variant="info" title="Centralizing Business Logic">
        <p>
          If two or three different services all hit the same database and all need to apply the
          same "decrement stock, but never below zero" rule, putting that rule in one procedure
          means every caller gets the same behavior for free instead of each service reimplementing
          it (and inevitably drifting apart). The trade-off: that logic now lives somewhere your
          application-layer tooling — your IDE, your test suite, your code review — mostly can't
          see.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Reduced Network Payload">
        <p>
          For logic-heavy operations that would otherwise mean shipping a lot of data back to the
          app just to compute something and ship a result back down, doing the computation next to
          the data can mean sending less over the wire. This matters less than it used to now that
          most app servers and databases live close together in the same cloud region, but it's
          still real for genuinely data-heavy batch operations.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="A Real Security Boundary">
        <p>
          You can grant an application's database role permission to <em>execute</em> a specific
          procedure without granting it direct <code>SELECT</code> or <code>UPDATE</code> on the
          underlying tables at all:
        </p>
        <CodeBlock language="sql" title="EXECUTE Without Table Access">
{`-- app_role can run this one bounded operation...
GRANT EXECUTE ON PROCEDURE transfer_funds(INT, INT, NUMERIC) TO app_role;

-- ...without ever being granted broad access to the tables it touches
REVOKE ALL ON accounts, transfer_log FROM app_role;`}
        </CodeBlock>
        <p>
          The procedure itself typically runs with the privileges of whoever defined it
          (<code>SECURITY DEFINER</code>), so it can touch the tables it needs to even though the
          calling role can't touch them directly. That's a genuine, narrower attack surface than
          "the app's DB user can run arbitrary UPDATE against accounts."
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Cached Execution Plans">
        <p>
          Some databases cache a procedure's execution plan across calls, which can save
          re-planning overhead for a very frequently run, identical operation. In PostgreSQL this
          benefit is modest and session-scoped (plans are cached per-session, and Postgres will
          still replan if statistics change enough to matter) — it's a real but minor factor, not
          the main event.
        </p>
      </InfoBox>

      <h2>The Honest Downsides</h2>

      <p>
        None of the above makes stored procedures a default choice, and it's worth being direct
        about why the industry has drifted away from leaning on them heavily:
      </p>

      <ul>
        <li>
          <strong>Split business logic is a real maintainability cost.</strong> Once some of your
          rules live in application code and some live in the database, a reviewer has to check two
          places to understand what actually happens on "place an order." Procedures are harder to
          version alongside application code, harder to code-review in a normal PR diff, and it's
          easy for the database logic to drift out of sync with what app-layer developers believe
          is happening.
        </li>
        <li>
          <strong>Vendor lock-in.</strong> Standard SQL queries are broadly portable across
          databases. Procedural extensions are not: PL/pgSQL (PostgreSQL), T-SQL (SQL Server), and
          PL/SQL (Oracle) are three different languages with different syntax, different control
          flow, and no compatibility with each other. A procedure written for Postgres has to be
          rewritten, not just ported, to run on SQL Server.
        </li>
        <li>
          <strong>Harder to test and debug.</strong> There's no normal debugger to step through a
          procedure the way you would application code. Unit testing it means either standing up a
          real database in your test suite or accepting weaker coverage than the rest of your
          codebase gets.
        </li>
        <li>
          <strong>It's not the default anymore.</strong> Fifteen to twenty years ago, pushing logic
          into stored procedures was a common default, partly to minimize round trips when networks
          were slower and connection pooling was less mature. Modern practice — especially in
          microservices-style architectures — leans toward keeping business logic in the
          application layer and treating the database as storage plus transactions, precisely to
          avoid the split-logic problem above. Stored procedures are still a real, valid tool for
          the specific cases in this lesson, not an unambiguous best practice to reach for by
          default.
        </li>
      </ul>

      <h2>A Concrete Example: Transferring Funds</h2>

      <p>
        This example ties the round-trip point and the atomicity point together: check a balance,
        debit one account, credit another, log the transfer — all as one call, with an{' '}
        <code>EXCEPTION</code> block to roll back cleanly if anything goes wrong partway through.
      </p>

      <CodeBlock language="sql" title="transfer_funds — Checked, Atomic, One Call" showLineNumbers={true}>
{`CREATE OR REPLACE PROCEDURE transfer_funds(
  p_from_account INT,
  p_to_account   INT,
  p_amount       NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_from_balance NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive, got %', p_amount;
  END IF;

  -- Lock the source row so a concurrent transfer can't read a stale balance
  -- and both transfers pass the balance check against the same starting number.
  SELECT balance INTO v_from_balance
  FROM accounts
  WHERE id = p_from_account
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source account % does not exist', p_from_account;
  END IF;

  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in account % (has %, needs %)',
      p_from_account, v_from_balance, p_amount;
  END IF;

  UPDATE accounts SET balance = balance - p_amount WHERE id = p_from_account;

  UPDATE accounts SET balance = balance + p_amount WHERE id = p_to_account;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination account % does not exist', p_to_account;
  END IF;

  INSERT INTO transfer_log (from_account, to_account, amount, transferred_at)
  VALUES (p_from_account, p_to_account, p_amount, NOW());

EXCEPTION
  WHEN OTHERS THEN
    -- Any RAISE EXCEPTION above (or any other error) lands here. Postgres has
    -- already rolled back every change made inside this block since it began —
    -- neither UPDATE and no INSERT took effect. We log why, then re-raise so
    -- the error still propagates to the caller instead of being swallowed.
    RAISE NOTICE 'Transfer failed: %', SQLERRM;
    RAISE;
END;
$$;

-- The app makes exactly one call for the entire operation:
CALL transfer_funds(1, 2, 250.00);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why the EXCEPTION Block Is Safe Here">
        <p>
          In PL/pgSQL, a <code>BEGIN ... EXCEPTION ... END</code> block acts like an implicit
          savepoint: if an error is caught by the <code>EXCEPTION</code> clause, every change to
          the database made inside that block since it started is automatically rolled back before
          the exception handler runs. That's what makes the debit-then-credit sequence above safe —
          if the destination account doesn't exist, the debit that already ran is undone, not left
          half-applied. This is genuine atomicity, but it's coming from PL/pgSQL's block semantics,
          not from "it's a stored procedure" in the abstract — the same guarantee applies to
          functions and to plain <code>BEGIN...EXCEPTION...END</code> blocks anywhere in PL/pgSQL.
        </p>
      </InfoBox>

      <h2>Stored Functions vs. Stored Procedures</h2>

      <p>
        Postgres draws a real distinction between the two, worth knowing but secondary to
        everything above:
      </p>

      <ul>
        <li>
          A <strong>function</strong> (<code>CREATE FUNCTION</code>) returns a value and can be
          used inside a query — <code>SELECT my_func(id) FROM ...</code>, in a <code>WHERE</code>{' '}
          clause, and so on.
        </li>
        <li>
          A <strong>procedure</strong> (<code>CREATE PROCEDURE</code>) is invoked with{' '}
          <code>CALL</code> and historically couldn't return a value the same way. Modern Postgres
          (11+) lets procedures declare <code>OUT</code> parameters to hand values back to the
          caller, and — uniquely among the two — a procedure called directly (not nested inside a
          function or an explicit transaction block) can issue its own{' '}
          <code>COMMIT</code>/<code>ROLLBACK</code>, which functions can never do.
        </li>
      </ul>

      <CodeBlock language="sql" title="A Function, for Comparison" showLineNumbers={true}>
{`CREATE OR REPLACE FUNCTION account_balance(p_account_id INT)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT balance INTO v_balance FROM accounts WHERE id = p_account_id;
  RETURN v_balance;
END;
$$;

-- Usable directly inside a query — this is the key difference from a procedure:
SELECT id, account_balance(id) AS balance
FROM accounts
WHERE account_balance(id) > 1000;`}
      </CodeBlock>

      <InteractiveChallenge
        question="An app currently does a SELECT to check inventory, an UPDATE to decrement it, and an INSERT to record the order — three separate calls to the database. What is the primary, measurable benefit of moving this into a single stored procedure call?"
        options={[
          'The SQL runs faster inside the database engine itself',
          'It reduces three network round trips to one, cutting latency and shrinking the window for a race condition between steps',
          'It automatically makes the three statements portable to any other database',
          'It removes the need for any transaction or locking logic',
        ]}
        correctIndex={1}
        explanation="The core win is round-trip reduction: one CALL instead of three separate statement round trips, which matters under real load and also narrows (but does not by itself eliminate) the window where a concurrent request could interleave between the SELECT and the UPDATE. It doesn't inherently make anything faster at the SQL-execution level, doesn't improve portability (the opposite, in fact — see vendor lock-in), and still needs proper locking/transaction discipline to be safe under concurrency."
        language="sql"
      />

      <InteractiveChallenge
        question="Why is PL/pgSQL, T-SQL, and PL/SQL being three different, incompatible languages a genuine downside of stored procedures?"
        options={[
          'It means stored procedures run slower than equivalent application code',
          'Standard SQL queries port across databases fairly well, but procedural logic written in one dialect has to be rewritten, not just ported, for a different database engine',
          'It means you cannot use stored procedures with an ORM',
          'It only affects performance, not portability',
        ]}
        correctIndex={1}
        explanation="This is the vendor lock-in problem: plain SQL queries are close to portable across engines, but PL/pgSQL (Postgres), T-SQL (SQL Server), and PL/SQL (Oracle) are separate procedural languages. Business logic written as a stored procedure in one has to be rewritten from scratch to run on another, which is a real cost if you ever need to change database vendors."
        language="sql"
      />
    </LessonLayout>
  );
}
