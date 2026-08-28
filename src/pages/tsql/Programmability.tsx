import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function TsqlProgrammability() {
  return (
    <LessonLayout
      title="Stored Procedures, Functions & Error Handling"
      sectionId="tsql"
      lessonIndex={6}
      prev={{ path: '/tsql/views', label: 'Views, Reusable SQL & Numbers Tables' }}
      next={{ path: '/tsql/transactions', label: 'Transactions, Isolation & Locking' }}
    >
      <p>
        SQL Server&apos;s procedural language is built into the query language rather than bolted on
        as a separate one — there is no <code>$$ ... $$</code> body and no <code>PL/pgSQL</code>. A
        stored procedure is a batch of T-SQL with a name, stored inside the database. Everything here
        was run against <strong>WideWorldImportersDW</strong> on SQL Server 2019.
      </p>

      <h2>Where the Code Actually Lives</h2>

      <p>
        This is the part that surprises people coming from application development. A procedure is
        not a file. The text you executed is parsed, and the source is kept in a system catalog
        inside the database itself:
      </p>

      <CodeBlock language="sql" title="Reading a procedure's source back out">
{`SELECT [definition]
FROM   sys.sql_modules
WHERE  [object_id] = OBJECT_ID('dbo.usp_GetSalesByTerritory');

-- the same thing, as a scalar
SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.usp_GetSalesByTerritory'));

-- everything programmable in the database, and when it last changed
SELECT
     [s].[name] + '.' + [o].[name] AS [Object]
    ,[o].[type_desc]
    ,[o].[modify_date]
FROM sys.objects AS [o]
INNER JOIN sys.schemas AS [s]
        ON [s].[schema_id] = [o].[schema_id]
WHERE [o].[type] IN ('P','V','FN','IF','TF')
  AND [o].[is_ms_shipped] = 0
ORDER BY [o].[modify_date] DESC;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — from the restored sample database">
{`LEN(definition) = 524

Object                                     | type_desc                        | modify_date
-------------------------------------------|----------------------------------|-------------------
Integration.GenerateDateDimensionColumns   | SQL_INLINE_TABLE_VALUED_FUNCTION | 2026-08-28 02:42:39
Integration.PopulateDateDimensionForYear   | SQL_STORED_PROCEDURE             | 2016-06-06 12:35:45
Integration.GetLastETLCutoffTime           | SQL_STORED_PROCEDURE             | 2016-06-06 12:35:45
Sequences.ReseedAllSequences               | SQL_STORED_PROCEDURE             | 2016-06-06 12:35:41`}
      </CodeBlock>

      <InfoBox variant="warning" title="What you read back is not byte-identical to what you deployed">
        <p>
          Deploy a procedure with <code>CREATE OR ALTER PROCEDURE</code> and then read{' '}
          <code>sys.sql_modules</code>, and the stored text begins{' '}
          <code>CREATE&nbsp;&nbsp;&nbsp;PROCEDURE</code> — the words <code>OR ALTER</code> are
          replaced by spaces. Verified on 2019.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          That matters if you ever diff &quot;what is in the database&quot; against &quot;what is in
          source control&quot;: the two differ on that line even when nothing has actually changed.
          Schema-comparison tools know this; hand-rolled scripts usually do not.
        </p>
      </InfoBox>

      <h2>Source Control for Something That Lives in a Database</h2>

      <CodeBlock language="text" title="The two established approaches">
{`1. STATE-BASED  (SSDT / .sqlproj / DACPAC — the Microsoft way)
   The repo holds ONE .sql file per object, each a CREATE statement.
   That is the DESIRED STATE. At deploy time SqlPackage compares the
   repo against the live database and GENERATES the difference.

     + the repo mirrors the database: one file per proc, easy to diff
     + no accumulating pile of migration scripts
     - generated migrations can surprise you, and destructive changes
       need care (it may decide to drop a column)

     sqlpackage /Action:Publish /SourceFile:db.dacpac \\
                /TargetConnectionString:"..."

2. MIGRATION-BASED  (Flyway, Liquibase, DbUp, EF Core migrations)
   The repo holds an ORDERED list of change scripts, each run once and
   recorded in a tracking table.

     + you control exactly what runs, and in what order
     + the identical script runs in dev, test and production
     - an object's history is scattered across many files; to see the
       current procedure you read the newest script that touched it

   Flyway calls these REPEATABLE migrations (R__ prefix): re-applied
   whenever the file's checksum changes. Combined with CREATE OR ALTER
   that is the natural home for procedures, views and functions —
   R__usp_GetSalesByTerritory.sql holding the CREATE OR ALTER.`}
      </CodeBlock>

      <InfoBox variant="tip" title="CREATE OR ALTER is what makes either approach pleasant">
        <p>
          Before SQL Server 2016 SP1 you wrote the{' '}
          <code>IF OBJECT_ID(...) IS NOT NULL DROP PROCEDURE ...</code>, then <code>GO</code>, then{' '}
          <code>CREATE PROCEDURE ...</code> dance. Dropping and recreating{' '}
          <strong>loses every permission granted on the object</strong>, so deployments had to
          re-grant them afterwards — and forgetting was a routine cause of outages.{' '}
          <code>CREATE OR ALTER</code> preserves the object identity and its permissions, and it is
          idempotent, so the same script is safe to run repeatedly.
        </p>
      </InfoBox>

      <h2>A Procedure in House Style</h2>

      <CodeBlock language="sql" title="The template worth copying">
{`USE [WideWorldImportersDW];
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_GetSalesByTerritory]
     @SalesTerritory NVARCHAR(100)
    ,@MinProfit      DECIMAL(18,2) = 0        -- default value
    ,@RowCount       INT OUTPUT               -- output parameter
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
         [c].[Sales Territory]
        ,COUNT(*)          AS [Sale Count]
        ,SUM([s].[Profit]) AS [Total Profit]
    FROM [Fact].[Sale] AS [s]
    INNER JOIN [Dimension].[City] AS [c]
            ON [c].[City Key] = [s].[City Key]
    WHERE [c].[Sales Territory] = @SalesTerritory
    GROUP BY [c].[Sales Territory]
    HAVING SUM([s].[Profit]) >= @MinProfit;

    SET @RowCount = @@ROWCOUNT;
END;
GO`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — calling it">
{`DECLARE @n INT;
EXEC [dbo].[usp_GetSalesByTerritory]
     @SalesTerritory = N'Southeast'
    ,@RowCount       = @n OUTPUT;
SELECT @n AS [rows_returned];

Sales Territory | Sale Count | Total Profit
----------------|------------|-------------
Southeast       | 50520      | 18994984.65

rows_returned
-------------
1`}
      </CodeBlock>

      <InfoBox variant="tip" title="SET NOCOUNT ON belongs in every procedure">
        <p>
          Without it, every statement sends a &quot;(n rows affected)&quot; message to the client. In
          a procedure with a loop that is thousands of extra network round trips, and some client
          libraries mistake those messages for result sets. One line, pure upside.
        </p>
      </InfoBox>

      <h2>Calling a Procedure From Application Code</h2>

      <CodeBlock language="csharp" title="ADO.NET — the shape everything else wraps">
{`using var conn = new SqlConnection(connectionString);
using var cmd  = new SqlCommand("dbo.usp_GetSalesByTerritory", conn)
{
    CommandType = CommandType.StoredProcedure   // NOT CommandType.Text
};

// Set the DB type EXPLICITLY. If you do not, the driver infers NVARCHAR,
// which can silently break an index seek against a VARCHAR column.
cmd.Parameters.Add("@SalesTerritory", SqlDbType.NVarChar, 100).Value = territory;

var rowCount = new SqlParameter("@RowCount", SqlDbType.Int)
{
    Direction = ParameterDirection.Output
};
cmd.Parameters.Add(rowCount);

await conn.OpenAsync();
using var reader = await cmd.ExecuteReaderAsync();
while (await reader.ReadAsync()) { /* read the result set */ }

// Output parameters are only populated AFTER the reader is closed —
// the value arrives in the final TDS packet.
reader.Close();
int affected = (int)rowCount.Value;`}
      </CodeBlock>

      <CodeBlock language="csharp" title="Dapper and EF Core">
{`// Dapper
var rows = await conn.QueryAsync<TerritorySales>(
    "dbo.usp_GetSalesByTerritory",
    new { SalesTerritory = territory },
    commandType: CommandType.StoredProcedure);

// EF Core — mapped to an entity or keyless type
var rows = await db.TerritorySales
    .FromSqlInterpolated($"EXEC dbo.usp_GetSalesByTerritory {territory}")
    .ToListAsync();

// EF Core — no result set (an INSERT/UPDATE proc)
await db.Database.ExecuteSqlInterpolatedAsync(
    $"EXEC dbo.usp_ArchiveSales {cutoffDate}");`}
      </CodeBlock>

      <InfoBox variant="danger" title="Two traps in that C# that cost real time">
        <p>
          <strong>1. Output parameters are empty until the reader is closed.</strong> The value
          travels in the last packet, after the rows. Reading <code>rowCount.Value</code> while the
          reader is still open gives you <code>DBNull</code>, and the usual reaction is to assume the
          procedure is broken.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>2. Not setting <code>SqlDbType</code> can cost index seeks.</strong>{' '}
          <code>SqlClient</code> infers <code>NVARCHAR</code> for .NET strings. Against a{' '}
          <code>VARCHAR</code> column that forces an implicit conversion of the column — and on a
          database using a <code>SQL_*</code> collation that turns a seek into a scan, measured at 2
          logical reads versus 57. On a Windows collation the seek survives, so the same code is fast
          against one database and slow against another (see the indexing lesson). The C# contains no
          cast either way, so nothing in the source explains the difference.
        </p>
      </InfoBox>

      <h2>Variables and Control Flow</h2>

      <CodeBlock language="sql" title="The basics">
{`DECLARE @Count INT = 0;
DECLARE @Name  NVARCHAR(100);

SET    @Count = 10;                                        -- one value
SELECT @Name  = [City]
FROM   [Dimension].[City]
WHERE  [City Key] = 34212;                                 -- from a query

IF @Count > 5
    PRINT 'big';
ELSE
    PRINT 'small';

WHILE @Count > 0
BEGIN
    SET @Count = @Count - 1;
END

-- BEGIN/END is the block delimiter. Without it IF governs only ONE
-- statement — the same footgun as a brace-less if in C.`}
      </CodeBlock>

      <InfoBox variant="warning" title="SELECT @var = ... silently does nothing when no rows match">
        <p>
          If the query returns no rows the variable keeps its <em>previous</em> value — it is not set
          to NULL. If it returns many rows the variable ends up holding the last one, arbitrarily,
          with no error. <code>SET @v = (SELECT ...)</code> is stricter: NULL when there are no rows,
          and a <strong>hard error</strong> when there is more than one. Prefer <code>SET</code>{' '}
          unless you specifically want the loose behaviour.
        </p>
      </InfoBox>

      <h2>Functions — And the Performance Cliff</h2>

      <CodeBlock language="text" title="Three kinds, wildly different performance">
{`SCALAR function                  returns one value
  CREATE FUNCTION f(@x INT) RETURNS INT AS BEGIN ... RETURN @y END
  *** Called PER ROW. Below compatibility level 150 it also forces the
      WHOLE QUERY TO RUN SINGLE-THREADED. Death on a fact table. ***
  2019+ at compat 150 can inline some of them automatically.

MULTI-STATEMENT table function   returns a @table variable
  RETURNS @t TABLE (...) AS BEGIN INSERT INTO @t ... RETURN END
  *** The optimiser cannot see inside. Pre-2017 it assumed 1 row;
      2017+ uses interleaved execution to estimate better. Still slow. ***

INLINE table function            a single RETURN (SELECT ...)
  RETURNS TABLE AS RETURN (SELECT ...)
  *** THE GOOD ONE. Expanded into the calling query like a view, fully
      optimisable and parallelisable. It is "a view with parameters". ***`}
      </CodeBlock>

      <CodeBlock language="sql" title="Rewriting a scalar function as an inline table function">
{`-- SLOW: scalar, evaluated once per row
CREATE OR ALTER FUNCTION [dbo].[fnMargin]
(
     @Profit DECIMAL(18,2)
    ,@Total  DECIMAL(18,2)
)
RETURNS DECIMAL(9,4)
AS
BEGIN
    RETURN CASE WHEN @Total = 0 THEN 0 ELSE @Profit / @Total END;
END;
GO

-- FAST: inline table-valued, expanded into the plan
CREATE OR ALTER FUNCTION [dbo].[fnMargin2]
(
     @Profit DECIMAL(18,2)
    ,@Total  DECIMAL(18,2)
)
RETURNS TABLE
AS
RETURN
(
    SELECT CASE WHEN @Total = 0 THEN 0
                ELSE @Profit / @Total END AS [Margin]
);
GO

SELECT
     [s].[Sale Key]
    ,[m].[Margin]
FROM [Fact].[Sale] AS [s]
CROSS APPLY [dbo].[fnMargin2]([s].[Profit], [s].[Total Excluding Tax]) AS [m];`}
      </CodeBlock>

      <p>
        Extracting a repeated calculation into a function is good practice in every other language.
        In T-SQL, doing it with a <em>scalar</em> function can turn a parallel plan into a
        single-threaded per-row loop. The inline table-valued form gives you the reuse without the
        penalty.
      </p>

      <h2>Error Handling</h2>

      <CodeBlock language="sql" title="TRY / CATCH, and why XACT_ABORT matters">
{`SET XACT_ABORT ON;      -- any error dooms the whole transaction

BEGIN TRY
    BEGIN TRANSACTION;

        UPDATE [dbo].[Account] SET [Balance] = [Balance] - 100 WHERE [Id] = 1;
        UPDATE [dbo].[Account] SET [Balance] = [Balance] + 100 WHERE [Id] = 2;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;    -- rethrow, preserving the original number, message and line
END CATCH;`}
      </CodeBlock>

      <InfoBox variant="danger" title="Without XACT_ABORT ON, some errors leave the transaction open">
        <p>
          SQL Server&apos;s severity model is not uniform: some errors abort the batch, some abort
          only the statement and <em>continue</em>, and some leave the transaction doomed but open.
          If control reaches your <code>CATCH</code> and you do not test <code>XACT_STATE()</code>,
          you can try to commit a transaction that can only be rolled back — or leak an open
          transaction holding locks until the connection dies.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="THROW vs RAISERROR">
{`THROW      2012+. Re-raises with the ORIGINAL error number, message and
           line. Always severity 16. The preceding statement must end
           with a semicolon. USE THIS.

RAISERROR  Legacy. Lets you choose severity and format the message, but a
           bare re-raise LOSES the original error number and reports the
           line of the RAISERROR itself — so production logs point at the
           error handler instead of the error.

THROW 51000, 'Custom message', 1;   -- custom numbers must be >= 50000`}
      </CodeBlock>

      <h2>Dynamic SQL</h2>

      <CodeBlock language="sql" title="One of these is a vulnerability">
{`-- *** SQL INJECTION. Never. ***
DECLARE @Sql NVARCHAR(MAX) =
    N'SELECT * FROM [Dimension].[City] WHERE [Sales Territory] = '''
    + @Territory + '''';
EXEC(@Sql);

-- CORRECT: parameterised. Values never become part of the SQL text.
DECLARE @Sql NVARCHAR(MAX) =
    N'SELECT [City Key], [City]
      FROM   [Dimension].[City]
      WHERE  [Sales Territory] = @pTerritory;';

EXEC sys.sp_executesql
     @Sql
    ,N'@pTerritory NVARCHAR(100)'
    ,@pTerritory = @Territory;`}
      </CodeBlock>

      <InfoBox variant="warning" title="Identifiers cannot be parameterised">
        <p>
          <code>sp_executesql</code> parameterises <em>values</em>, not table or column names. For a
          dynamic identifier you must validate instead — <code>QUOTENAME()</code> brackets and
          escapes it safely, and checking it against <code>sys.tables</code> first is better still.
          A second benefit of <code>sp_executesql</code> over <code>EXEC()</code>: because the
          statement text is stable, its plan is cached and reused rather than compiled afresh for
          every distinct value.
        </p>
      </InfoBox>

      <FlowChart
        title="Which programmable object to reach for"
        chart={"graph TD\n  A[\"I want to reuse some SQL\"] --> B{\"does it need<br/>parameters?\"}\n  B -->|\"no\"| C[\"VIEW\"]\n  B -->|\"yes\"| D{\"does it return<br/>a row set?\"}\n  D -->|\"yes, one SELECT\"| E[\"INLINE table function<br/>a view with parameters\"]\n  D -->|\"yes, needs logic\"| F[\"STORED PROCEDURE\"]\n  D -->|\"no, a single value\"| G{\"used across<br/>many rows?\"}\n  G -->|\"yes\"| H[\"inline TVF + CROSS APPLY<br/>NOT a scalar function\"]\n  G -->|\"no\"| I[\"scalar function is fine\"]\n  style C fill:#1a3329,stroke:#4ade80\n  style E fill:#1a3329,stroke:#4ade80\n  style H fill:#1a3329,stroke:#4ade80\n  style F fill:#1a2744,stroke:#5b9cf6"}
      />
    </LessonLayout>
  );
}

export default TsqlProgrammability;
