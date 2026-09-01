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
        chart={"graph TD\n  subgraph W[\"Without a stored procedure\"]\n    A1[\"App sends SELECT\"] -->|\"round trip 1\"| A2[\"App decides:\\nenough stock?\"]\n    A2 --> A3[\"App sends UPDATE\"]\n    A3 -->|\"round trip 2\"| A4[\"App sends INSERT\"]\n    A4 -->|\"round trip 3\"| A5[\"Done\"]\n  end\n  subgraph S[\"With place_order(...)\"]\n    B1[\"App sends CALL place_order(...)\"] -->|\"round trip 1\"| B2[\"DB runs SELECT + UPDATE + INSERT\\nback-to-back, no network in between\"]\n    B2 --> B3[\"Done\"]\n  end\n  style A2 fill:#3b1a1a,stroke:#f87171\n  style A3 fill:#3b1a1a,stroke:#f87171\n  style A4 fill:#3b1a1a,stroke:#f87171\n  style B2 fill:#1a3329,stroke:#4ade80"}
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
          To make that work the procedure has to run with the privileges of whoever defined it
          (<code>SECURITY DEFINER</code>), so it can touch the tables it needs to even though the
          calling role can't touch them directly. That's a genuine, narrower attack surface than
          "the app's DB user can run arbitrary UPDATE against accounts" — but only if you also
          pin <code>search_path</code>. See the warning below; this is not optional.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="SECURITY DEFINER Without SET search_path Is a Privilege-Escalation Bug">
        <p>
          A <code>SECURITY DEFINER</code> function runs as its owner but resolves unqualified names
          using the <em>caller&#39;s</em> <code>search_path</code>. The caller controls that. So a role
          holding nothing but <code>EXECUTE</code> can create its own schema, put a decoy table in it,
          put that schema first on its path, and the privileged function will happily read — or write —
          the attacker&#39;s object instead of yours.
        </p>
        <CodeBlock language="sql" title="The Escalation, and the One Line That Stops It">
{`-- Attacker holds only EXECUTE on the function. They do this:
CREATE SCHEMA evil;
CREATE TABLE evil.accounts (id INT, balance NUMERIC);
INSERT INTO evil.accounts VALUES (1, 999999999);
SET search_path = evil, public;

CALL some_definer_procedure(1);   -- reads evil.accounts, not app.accounts

-- The fix is one clause on every SECURITY DEFINER routine:
CREATE OR REPLACE PROCEDURE transfer_funds(...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, pg_temp   -- resolved at definition time, not call time
AS $$ ... $$;`}
        </CodeBlock>
        <p>
          Always include <code>pg_temp</code> <strong>last</strong>. If a caller can create a temp
          table that shadows a name your function uses, and <code>pg_temp</code> is searched early,
          you have the same bug again. And the danger is not limited to tables — the same trick
          against a shadowed <em>function</em> or <em>operator</em> gives arbitrary code execution as
          the definer, which is why PostgreSQL&#39;s own documentation treats this as the default
          hazard of the feature rather than an edge case.
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

      <h2>Calling One From Application Code</h2>

      <p>
        The SQL above is only half the picture. The half that decides whether a team actually
        adopts stored procedures is what the calling code looks like &mdash; and where the{' '}
        <code>.sql</code> files live so they are not just something someone once typed into a
        psql prompt.
      </p>

      <InfoBox variant="tip" title="CALL a Procedure, SELECT a Function">
        <p>
          This trips people up constantly, so it is worth stating before any code: a{' '}
          <strong>procedure</strong> is invoked with <code>CALL name(args)</code> and returns
          nothing; a <strong>function</strong> is invoked inside a query with{' '}
          <code>SELECT name(args)</code> and returns a value. Verified against PostgreSQL 18.6:{' '}
          <code>CALL transfer_funds(1, 2, 100)</code> moved the money and returned no rows, while{' '}
          <code>SELECT account_balance(1)</code> returned <code>900</code>. Calling a procedure
          with <code>SELECT</code> is an error, and vice versa.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Spring Boot — three ways, in order of how often you want them">
{`// 1. JdbcTemplate — the plain one. Best default for a procedure that
//    just does work and returns nothing.
@Repository
public class TransferRepository {
    private final JdbcTemplate jdbc;

    public TransferRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void transfer(long from, long to, BigDecimal amount) {
        jdbc.update("CALL transfer_funds(?, ?, ?)", from, to, amount);
    }
}

// 2. Spring Data JPA @Procedure — least code when you already have a
//    repository for that aggregate. The name must match the DB object.
public interface AccountRepository extends JpaRepository<Account, Long> {

    @Procedure(procedureName = "transfer_funds")
    void transferFunds(@Param("from_acct") long fromAcct,
                       @Param("to_acct")   long toAcct,
                       @Param("amt")       BigDecimal amt);
}

// 3. SimpleJdbcCall — when there are OUT parameters or a returned
//    cursor to unpack. More ceremony, but it handles the mapping.
var call = new SimpleJdbcCall(jdbc)
        .withProcedureName("place_order")
        .declareParameters(
            new SqlParameter("p_customer", Types.BIGINT),
            new SqlParameter("p_sku",      Types.VARCHAR),
            new SqlOutParameter("p_order_id", Types.BIGINT));

Map<String, Object> out = call.execute(Map.of(
        "p_customer", customerId,
        "p_sku",      sku));
Long orderId = (Long) out.get("p_order_id");`}
      </CodeBlock>

      <InfoBox variant="warning" title="@Transactional Around a CALL Is Not Free">
        <p>
          If the procedure opens its own transaction (or issues <code>COMMIT</code> internally,
          which PL/pgSQL procedures are allowed to do and functions are not), and Spring has
          already started one, you get a conflict &mdash; Postgres will refuse with{' '}
          <em>invalid transaction termination</em>. Either let the procedure own the transaction
          and call it outside a Spring-managed one, or keep the procedure transaction-free and let{' '}
          <code>@Transactional</code> wrap it. Pick one; mixing them is where the confusing
          production failures come from.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Node — node-postgres">
{`// A procedure: CALL, no rows come back.
await pool.query('CALL transfer_funds($1, $2, $3)', [fromId, toId, amount]);

// A function: SELECT, and you read the value out of rows[0].
const { rows } = await pool.query('SELECT account_balance($1) AS balance', [acctId]);
const balance = rows[0].balance;

// Parameters are still bound, not interpolated — a stored procedure is
// NOT a substitute for parameterised queries. Building the CALL string
// with template literals reintroduces SQL injection at the call site.`}
      </CodeBlock>

      <h2>Where the Files Actually Live</h2>

      <p>
        A stored procedure that exists only in the production database is an outage waiting to
        happen: nobody can review it, nobody can diff it, and rebuilding a staging environment
        silently produces a different one. Treat these files exactly like application code &mdash;
        they belong in the repository, in version control, applied by a migration tool.
      </p>

      <CodeBlock language="text" title="Typical Spring Boot layout with Flyway">
{`src/main/resources/db/migration/
    V1__create_accounts.sql
    V2__create_transfer_funds_procedure.sql     <- the procedure lives here
    V3__add_absolute_cap_to_transfer.sql        <- a CHANGE is a NEW file
    V4__create_place_order_procedure.sql

# Liquibase is the same idea with different filenames:
src/main/resources/db/changelog/
    db.changelog-master.yaml
    changes/002-transfer-funds-procedure.sql

# Node projects: whatever your migration tool expects, e.g.
migrations/
    1712345678_create_transfer_funds.sql`}
      </CodeBlock>

      <InfoBox variant="tip" title="Write Them CREATE OR REPLACE, and Never Edit an Applied Migration">
        <p>
          Two rules make this workable. First, define routines with{' '}
          <code>CREATE OR REPLACE PROCEDURE</code> / <code>FUNCTION</code> so re-running is safe
          and the file always contains the <em>whole</em> current definition &mdash; a reviewer can
          read one file and know what the routine does, instead of replaying five diffs in their
          head.
        </p>
        <p>
          Second, once a migration has run anywhere you do not own, it is immutable. Flyway
          checksums applied migrations and will refuse to start if one changed underneath it, which
          is a feature. Changing a procedure means a <strong>new</strong> versioned file containing
          the new full definition. That also gives you an honest history: <code>git log</code> on
          the migrations directory is the change history of your database logic.
        </p>
        <p>
          One caveat worth knowing: because each change is a full replacement, procedure files
          produce noisy diffs. Some teams keep a mirrored{' '}
          <code>db/routines/transfer_funds.sql</code> holding only the latest definition purely so
          code review has something readable to diff, with the migration importing or duplicating
          it. That is a reasonable trade if your review process is suffering; it is not required.
        </p>
      </InfoBox>

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
