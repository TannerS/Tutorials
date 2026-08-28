import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function TsqlProgrammability() {
  return (
    <LessonLayout
      title="Stored Procedures, Functions & Error Handling"
      sectionId="tsql"
      lessonIndex={5}
      prev={{ path: '/tsql/modifying-data', label: 'Modifying Data — OUTPUT, MERGE, Upserts' }}
      next={{ path: '/tsql/transactions', label: 'Transactions, Isolation & Locking' }}
    >
      <p>
        This is where T-SQL stops resembling other dialects. SQL Server&apos;s procedural language is
        built into the query language rather than bolted on as a separate one — there is no{' '}
        <code>$$ ... $$</code> body and no <code>PL/pgSQL</code>. A stored procedure is just a batch
        of T-SQL with a name.
      </p>

      <h2>Variables and Control Flow</h2>

      <CodeBlock language="sql" title="The basics">
{`DECLARE @count INT = 0;
DECLARE @name  VARCHAR(50);

SET    @count = 10;                              -- one value
SELECT @name  = name FROM emp WHERE id = 1;      -- assign from a query

IF @count > 5
    PRINT 'big';
ELSE
    PRINT 'small';

WHILE @count > 0
BEGIN
    SET @count = @count - 1;
END

-- BEGIN/END is the block delimiter. IF only governs ONE statement
-- without it, which is the same footgun as a brace-less if in C.`}
      </CodeBlock>

      <InfoBox variant="warning" title="SELECT @var = ... silently does nothing if no rows match">
        <p>
          If the query returns no rows, the variable keeps its <em>previous</em> value — it is not set
          to NULL. If it returns many rows, the variable ends up holding the last one, arbitrarily,
          with no error. <code>SET @var = (SELECT ...)</code> is stricter: it assigns NULL when there
          are no rows and <strong>raises an error</strong> when there is more than one. Prefer{' '}
          <code>SET</code> unless you specifically want the loose behaviour.
        </p>
      </InfoBox>

      <h2>Stored Procedures</h2>

      <CodeBlock language="sql" title="Parameters, defaults, and output">
{`CREATE OR ALTER PROCEDURE dbo.usp_GetEmployees   -- CREATE OR ALTER: 2016 SP1+
    @dept      VARCHAR(10),
    @min_sal   INT = 0,                          -- default value
    @row_count INT OUTPUT                        -- output parameter
AS
BEGIN
    SET NOCOUNT ON;          -- suppress "(n rows affected)" chatter

    SELECT id, name, salary
    FROM   emp
    WHERE  dept = @dept
      AND  salary >= @min_sal;

    SET @row_count = @@ROWCOUNT;
END;
GO

DECLARE @n INT;
EXEC dbo.usp_GetEmployees @dept = 'eng', @row_count = @n OUTPUT;
SELECT @n AS rows_returned;`}
      </CodeBlock>

      <InfoBox variant="tip" title="SET NOCOUNT ON belongs in every procedure">
        <p>
          Without it, each statement sends a &quot;(n rows affected)&quot; message to the client. In a
          procedure with a loop that is thousands of extra network round trips, and some client
          libraries mistake those messages for result sets. It costs one line and it is pure upside.
        </p>
      </InfoBox>

      <h2>Functions — And Why They Can Destroy Performance</h2>

      <CodeBlock language="text" title="Three kinds, wildly different performance">
{`SCALAR function              returns one value
  CREATE FUNCTION f(@x INT) RETURNS INT AS BEGIN ... RETURN @y END
  *** Called PER ROW. Before SQL Server 2019 this also FORCED THE WHOLE
      QUERY TO RUN SINGLE-THREADED. Death on large tables. ***
  2019+ can inline some of them automatically (compat level 150).

MULTI-STATEMENT table function   returns a @table variable
  RETURNS @t TABLE (...) AS BEGIN INSERT INTO @t ... RETURN END
  *** The optimiser cannot see inside. Pre-2017 it assumed 1 row,
      2017+ uses interleaved execution to estimate better. Still slow. ***

INLINE table function            a single RETURN (SELECT ...)
  RETURNS TABLE AS RETURN (SELECT ...)
  *** THE GOOD ONE. Expanded into the calling query like a view, fully
      optimisable, parallelisable. Use this shape whenever you can. ***`}
      </CodeBlock>

      <CodeBlock language="sql" title="Rewrite a scalar function as an inline table function">
{`-- SLOW: scalar, runs per row
CREATE FUNCTION dbo.fnTax(@amt MONEY) RETURNS MONEY
AS BEGIN RETURN @amt * 0.2 END;

SELECT id, dbo.fnTax(amount) FROM orders;      -- per-row call

-- FAST: inline table-valued, expanded into the plan
CREATE FUNCTION dbo.fnTax2(@amt MONEY)
RETURNS TABLE
AS RETURN (SELECT @amt * 0.2 AS tax);

SELECT o.id, t.tax
FROM   orders AS o
CROSS APPLY dbo.fnTax2(o.amount) AS t;`}
      </CodeBlock>

      <p>
        This is the T-SQL performance lesson that catches out developers from application languages
        most often. Extracting a repeated calculation into a function is good practice everywhere
        else; in T-SQL, doing it with a <em>scalar</em> function can turn a parallel plan into a
        single-threaded per-row loop.
      </p>

      <h2>Error Handling</h2>

      <CodeBlock language="sql" title="TRY / CATCH, and why XACT_ABORT matters">
{`SET XACT_ABORT ON;      -- any error aborts the whole transaction

BEGIN TRY
    BEGIN TRAN;
        UPDATE account SET bal = bal - 100 WHERE id = 1;
        UPDATE account SET bal = bal + 100 WHERE id = 2;
    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRAN;

    THROW;      -- rethrow the original error, preserving line + number
END CATCH;`}
      </CodeBlock>

      <InfoBox variant="danger" title="Without XACT_ABORT ON, some errors leave the transaction open">
        <p>
          SQL Server&apos;s error severity model is not uniform. Some errors abort the batch, some
          abort only the statement and <em>continue</em>, and some leave the transaction in a
          doomed-but-open state. If control reaches your <code>CATCH</code> and you do not check{' '}
          <code>XACT_STATE()</code>, you can attempt to commit a transaction that can only be rolled
          back — or leak an open transaction holding locks.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <code>SET XACT_ABORT ON</code> makes the behaviour consistent: any error dooms the
          transaction. Put it at the top of every procedure that writes data.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="THROW vs RAISERROR">
{`THROW           2012+. Re-raises with the ORIGINAL error number, message
                and line. Always severity 16. Statement before it must be
                terminated with a semicolon. USE THIS.

RAISERROR       Legacy. Lets you pick severity and format the message,
                but a bare re-raise LOSES the original error number and
                reports the line of the RAISERROR itself, which makes
                production stack traces useless.

THROW 51000, 'Custom message', 1;    -- custom errors need number >= 50000`}
      </CodeBlock>

      <h2>Dynamic SQL — The Injection Boundary</h2>

      <CodeBlock language="sql" title="One of these is a vulnerability">
{`-- *** SQL INJECTION. Never do this. ***
DECLARE @sql NVARCHAR(MAX) =
    N'SELECT * FROM emp WHERE dept = ''' + @dept + '''';
EXEC(@sql);
-- @dept = "x''; DROP TABLE emp; --" and it is over

-- CORRECT: parameterised, values never touch the SQL text
DECLARE @sql NVARCHAR(MAX) = N'SELECT * FROM emp WHERE dept = @p_dept';
EXEC sp_executesql @sql,
     N'@p_dept VARCHAR(10)',
     @p_dept = @dept;`}
      </CodeBlock>

      <InfoBox variant="warning" title="Identifiers cannot be parameterised">
        <p>
          <code>sp_executesql</code> parameterises <em>values</em>, not table or column names. If you
          must build an identifier dynamically, you cannot pass it as a parameter — you have to
          validate it. <code>QUOTENAME()</code> is the tool: it brackets and escapes an identifier
          safely.
        </p>
        <CodeBlock language="sql" title="Dynamic table name, done safely">
{`DECLARE @sql NVARCHAR(MAX) =
    N'SELECT * FROM ' + QUOTENAME(@table_name) + N' WHERE id = @p_id';
EXEC sp_executesql @sql, N'@p_id INT', @p_id = @id;`}
        </CodeBlock>
        <p style={{ marginTop: '0.5rem' }}>
          Better still, validate <code>@table_name</code> against{' '}
          <code>sys.tables</code> first, so only a real table name can ever reach the string.
        </p>
      </InfoBox>

      <FlowChart
        title="Which programmable object to reach for"
        chart={"graph TD\n  A[\"I want to reuse some logic\"] --> B{\"does it return a row set?\"}\n  B -->|\"no, a single value\"| C{\"used in a SELECT list<br/>over many rows?\"}\n  C -->|\"yes\"| D[\"inline TVF + CROSS APPLY<br/>NOT a scalar function\"]\n  C -->|\"no, once per call\"| E[\"scalar function is fine\"]\n  B -->|\"yes\"| F{\"can it be ONE select?\"}\n  F -->|\"yes\"| G[\"INLINE table function<br/>optimiser sees through it\"]\n  F -->|\"no, needs logic\"| H[\"stored procedure\"]\n  style D fill:#1a3329,stroke:#4ade80\n  style G fill:#1a3329,stroke:#4ade80\n  style H fill:#1a2744,stroke:#5b9cf6"}
      />

      <InteractiveChallenge
        question="A nightly job over 5 million rows went from 4 minutes to 90 minutes after a developer refactored a repeated CASE expression into a scalar user-defined function. The server is on compatibility level 130. Why?"
        options={[
          'The function needs an index',
          'Scalar UDFs are invoked once per row and, below compatibility level 150, also force the entire query to run single-threaded — the refactor removed parallelism and added 5 million calls',
          'The function is recompiling on every call because of parameter sniffing',
          'Scalar functions always run inside an implicit transaction',
        ]}
        correctIndex={1}
        explanation={"A scalar UDF is evaluated per row rather than folded into the plan, so this added five million invocations. The larger effect is that before scalar UDF inlining — introduced in SQL Server 2019 and only active at compatibility level 150 — the presence of a scalar UDF made the whole query plan serial, discarding parallelism the 4-minute version was relying on. Note the compatibility level detail: this server could be running the 2019 engine and still get the old behaviour, because inlining follows the database's compatibility level rather than the engine version. The fix is to inline the expression, or express it as an inline table-valued function used through CROSS APPLY, which the optimiser can see through."}
      />
    </LessonLayout>
  );
}

export default TsqlProgrammability;
