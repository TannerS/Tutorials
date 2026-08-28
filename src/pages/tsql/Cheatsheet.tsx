import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function TsqlCheatsheet() {
  return (
    <LessonLayout
      title="📋 T-SQL Cheat Sheet"
      sectionId="tsql"
      lessonIndex={9}
      prev={{ path: '/tsql/indexing', label: 'Indexing, SARGability & Execution Plans' }}
      next={null}
    >
      <p>
        Everything in this section, condensed. Every measured figure came from running the statement
        against a real <strong>SQL Server 2019 (15.0.4480.2)</strong> instance with{' '}
        <strong>WideWorldImportersDW</strong> restored.
      </p>

      <h2>House Style</h2>
      <CodeBlock language="sql" title="The conventions used throughout">
{`USE [WideWorldImportersDW];
GO

CREATE OR ALTER VIEW [dbo].[VW_City] AS
SELECT
     [City Key]
    ,[City]
    ,[State Province]
    ,[Sales Territory]
FROM [Dimension].[City];

[Brackets]        mandatory when a name has a SPACE — warehouse columns
                  routinely do: [City Key], [Total Excluding Tax]
Leading commas    add/remove a column = one line changed
[Schema].[Object] always qualify; unqualified names resolve per-user
N'literal'        the N prefix makes it NVARCHAR (Unicode)
GO                a BATCH SEPARATOR for SSMS/sqlcmd — not T-SQL, the
                  server never sees it. Required before CREATE VIEW.
CREATE OR ALTER   2016 SP1+. Keeps object identity AND permissions;
                  DROP + CREATE loses every GRANT.`}
      </CodeBlock>

      <h2>Versions</h2>
      <CodeBlock language="text" title="Which server am I on?">
{`SELECT @@VERSION;
SELECT SERVERPROPERTY('ProductVersion'), SERVERPROPERTY('Edition');
SELECT [name], [compatibility_level] FROM sys.databases;

13.x = 2016 (130)   14.x = 2017 (140)   15.x = 2019 (150)
16.x = 2022 (160)   17.x = 2025 (170)

*** THERE IS NO SQL SERVER 2018. ***

COMPATIBILITY LEVEL is per-database and can lag the engine. A 2019
engine running a database at level 130 uses 2016 optimiser behaviour —
including NO scalar UDF inlining. Check it before believing a feature
"exists in your version".`}
      </CodeBlock>

      <CodeBlock language="text" title="Feature availability — measured on 2019">
{`AVAILABLE on 2019:
  STRING_AGG, TRIM, CONCAT_WS         2017+
  APPROX_COUNT_DISTINCT               2019+
  IIF, OFFSET/FETCH, CONCAT, FORMAT   2012+
  STRING_SPLIT                        2016+

NOT AVAILABLE on 2019 (need 2022+):
  GREATEST, LEAST, GENERATE_SERIES, DATE_BUCKET

On 2016 you additionally lose STRING_AGG / TRIM / CONCAT_WS.
Tells for a pre-2017 codebase:
  LTRIM(RTRIM([x]))                      instead of TRIM([x])
  STUFF((SELECT ',' + [c] ... FOR XML PATH('')), 1, 1, '')
                                         instead of STRING_AGG
  (FOR XML PATH also XML-escapes & and < in your data — a real bug)`}
      </CodeBlock>

      <h2>⚠️ Not Like PostgreSQL</h2>
      <CodeBlock language="text" title="All verified">
{`COLLATION      server default SQL_Latin1_General_CP1_CI_AS = CASE INSENSITIVE
               'ABC' = 'abc'  ->  TRUE
               => 'Bob' and 'bob' COLLIDE in a unique index

NULL ORDER     ORDER BY [x] ASC puts NULLs FIRST  (Postgres: last)
               T-SQL has NO "NULLS LAST" clause. Emulate:
               ORDER BY CASE WHEN [x] IS NULL THEN 1 ELSE 0 END, [x]

INT DIVISION   7/2 = 3        7.0/2 = 3.500000

NULL CONCAT    'a' + NULL = NULL        CONCAT('a',NULL) = 'a'

READS BLOCK    a plain SELECT can block behind an uncommitted UPDATE
               (see isolation below — this is the big one)

TYPES          VARCHAR (1 byte, code page) vs NVARCHAR (2 bytes, Unicode)
               Postgres has one text type. Here it is per column.`}
      </CodeBlock>

      <h2>Queries</h2>
      <CodeBlock language="sql" title="The shapes you write daily">
{`SELECT TOP (10) ... ORDER BY [x] DESC;      -- TOP goes at the FRONT
SELECT TOP (@n) ...                         -- parens REQUIRED for a variable
SELECT TOP (3) WITH TIES ...                -- do not cut through ties

ORDER BY [Id] OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;  -- ORDER BY MANDATORY
-- deep paging is slow; prefer keyset: WHERE [Id] > @Last ORDER BY [Id]

-- top-N per group: CROSS APPLY is SQL Server's LATERAL
SELECT [t].[Sales Territory], [x].[City]
FROM (SELECT DISTINCT [Sales Territory] FROM [Dimension].[City]) AS [t]
CROSS APPLY (SELECT TOP (1) [c].[City]
             FROM [Dimension].[City] AS [c]
             WHERE [c].[Sales Territory] = [t].[Sales Territory]
             ORDER BY [c].[Latest Recorded Population] DESC) AS [x];
-- CROSS APPLY = inner       OUTER APPLY = left

ISNULL([a],[b])    forces b into a's TYPE — CAN TRUNCATE SILENTLY:
                   ISNULL(CAST(NULL AS NVARCHAR(2)), N'Not provided')
                   -> 'No'
COALESCE([a],[b])  standard, n-ary, no truncation.  DEFAULT TO THIS.

LEN('ab   ') = 2          (ignores TRAILING spaces)
DATALENGTH('ab   ') = 5   DATALENGTH(N'ab') = 4   (BYTES, not chars)

NOT IN (subquery with any NULL) -> ZERO ROWS. Always use NOT EXISTS.
UNION dedups (costs a sort); UNION ALL concatenates. Default to ALL.

LEGACY: *= and =* are the pre-1992 outer joins. REMOVED. Replace.`}
      </CodeBlock>

      <h2>⚠️ Slowly-Changing Dimensions</h2>
      <CodeBlock language="text" title="Measured on Dimension.City">
{`116,295 rows   but only   37,941 distinct [WWI City ID]
New York exists 3 times, with different [Valid From]/[Valid To] windows.
The current version is the row with [Valid To] = '9999-12-31 23:59:59.9999999'

*** JOIN ON THE SURROGATE KEY ***
  ON [c].[City Key] = [s].[City Key]        one version. CORRECT.
  ON [c].[City]     = [s].[City Name]       matches EVERY version —
                                            multiplies your facts.

Nothing errors. Totals are just too big, by a different factor per city.
A view that omits [Valid From]/[Valid To] hides this from its consumers
entirely — which is what VW_City above does.`}
      </CodeBlock>

      <h2>Window Functions</h2>
      <CodeBlock language="sql" title="And the frame trap">
{`ROW_NUMBER() OVER (PARTITION BY [Sales Territory] ORDER BY [Profit] DESC)
RANK()       -- 1,2,2,4 (gaps)     DENSE_RANK()  -- 1,2,2,3 (no gaps)
LAG([x],1) / LEAD([x],1) OVER (ORDER BY [t])

*** THE DEFAULT FRAME IS WRONG FOR RUNNING TOTALS ***
ORDER BY inside OVER() silently applies
    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
where "current row" means ALL ROWS WITH THE SAME VALUE, so tied rows all
get the same total. Always write it explicitly:
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
(ROWS is also faster. The bug is invisible without ties in test data.)

Dedup — you CAN delete from a CTE:
WITH [R] AS (SELECT [City Key],
                    ROW_NUMBER() OVER (PARTITION BY [WWI City ID]
                                       ORDER BY [Valid From] DESC) AS [rn]
             FROM [Dimension].[City])
DELETE FROM [R] WHERE [rn] > 1;

AVG ignores NULLs — AVG over (100, NULL, 80) is 90, NOT 60.
SUM over zero rows is NULL, not 0. Wrap: ISNULL(SUM([x]), 0)
Logical order: FROM > WHERE > GROUP BY > HAVING > SELECT > ORDER BY
  (so a SELECT alias works in ORDER BY but NOT in WHERE)`}
      </CodeBlock>

      <h2>Modifying Data</h2>
      <CodeBlock language="sql" title="OUTPUT is the good one">
{`UPDATE [dbo].[Account]
SET    [Balance] = [Balance] + 1
OUTPUT deleted.[Id], deleted.[Balance] AS [Old], inserted.[Balance] AS [New]
WHERE  [Id] = 3;
--  Id | Old | New
--   3 | 80  | 81

-- atomic queue claim: no race, no explicit transaction
UPDATE TOP (10) [dbo].[JobQueue]
SET    [Status] = N'processing'
OUTPUT inserted.[Job Id], inserted.[Payload]
WHERE  [Status] = N'pending';

IDENTITY:
  SCOPE_IDENTITY()      correct — this scope
  @@IDENTITY            WRONG if a TRIGGER inserts elsewhere: returns the
                        trigger's id. Classic production bug.
  OUTPUT inserted.[Id]  best — unambiguous, works for MULTI-ROW inserts

UPDATE ... FROM whose join matches MULTIPLE source rows updates once with
an ARBITRARY winner, silently. Verify the source is unique first.

MERGE: reads well, long history of concurrency bugs, needs WITH (HOLDLOCK),
       and "NOT MATCHED BY SOURCE THEN DELETE" hits the WHOLE TABLE.
       Prefer UPDATE + INSERT in a transaction.

TRUNCATE resets the identity seed, skips triggers, and IS transactional.
Large deletes: DELETE TOP (5000) in a WHILE loop.`}
      </CodeBlock>

      <h2>Objects: Views, Functions, Procedures</h2>
      <CodeBlock language="sql" title="Where the code lives, and how to see it">
{`SELECT [definition] FROM sys.sql_modules
WHERE [object_id] = OBJECT_ID('dbo.usp_GetSalesByTerritory');

SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.usp_GetSalesByTerritory'));

SELECT [s].[name] + '.' + [o].[name], [o].[type_desc], [o].[modify_date]
FROM sys.objects AS [o]
INNER JOIN sys.schemas AS [s] ON [s].[schema_id] = [o].[schema_id]
WHERE [o].[type] IN ('P','V','FN','IF','TF') AND [o].[is_ms_shipped] = 0;

-- what does a view really depend on?
SELECT * FROM sys.dm_sql_referenced_entities('dbo.VW_City','OBJECT');

*** GOTCHA: deploy with CREATE OR ALTER and the STORED text reads
    "CREATE   PROCEDURE" — OR ALTER is blanked to spaces. So a naive
    diff of database-vs-repo shows a change that is not a change. ***

SOURCE CONTROL for something that is not a file:
  STATE-BASED    SSDT / .sqlproj / DACPAC. One file per object = desired
                 state; SqlPackage generates the diff at deploy time.
  MIGRATION      Flyway / Liquibase / DbUp. Ordered scripts, run once.
                 Flyway REPEATABLE migrations (R__ prefix) + CREATE OR
                 ALTER is the natural home for procs/views/functions.

FUNCTIONS — the performance cliff:
  scalar UDF           per-row; below compat 150 also forces the whole
                       query SINGLE-THREADED. Avoid in SELECT lists.
  multi-statement TVF  optimiser cannot see inside. Bad estimates.
  INLINE TVF           RETURNS TABLE AS RETURN (SELECT ...)  <- THE GOOD ONE
                       "a view with parameters". Use with CROSS APPLY.

A VIEW cannot take parameters. If you need one, you want an inline TVF.
INDEXED VIEW: WITH SCHEMABINDING + a UNIQUE CLUSTERED INDEX. Uses
COUNT_BIG(*), no outer joins, and is maintained SYNCHRONOUSLY on every
write to the base tables.`}
      </CodeBlock>

      <h2>Procedures & Error Handling</h2>
      <CodeBlock language="sql" title="The template worth memorising">
{`CREATE OR ALTER PROCEDURE [dbo].[usp_Name]
     @Param    NVARCHAR(100)
    ,@RowCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;      -- always
    SET XACT_ABORT ON;   -- always, if it writes

    BEGIN TRY
        BEGIN TRANSACTION;
            ...
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;           -- preserves number, message AND line
    END CATCH
END;
GO

THROW      2012+, faithful re-raise.  USE THIS.
RAISERROR  legacy; a bare re-raise LOSES the original error number and
           reports its own line.

SELECT @v = [col] FROM [t]   -- no rows -> @v KEEPS ITS OLD VALUE
SET @v = (SELECT [col]...)   -- no rows -> NULL; many rows -> ERROR

DYNAMIC SQL — never concatenate values:
EXEC sys.sp_executesql
     N'SELECT [City] FROM [Dimension].[City] WHERE [Sales Territory]=@p'
    ,N'@p NVARCHAR(100)', @p = @Territory;
Identifiers cannot be parameterised — use QUOTENAME() and validate
against sys.tables.`}
      </CodeBlock>

      <h2>🔒 Transactions & Isolation — The Big One</h2>

      <InfoBox variant="danger" title="Measured: a plain SELECT blocked 8s and then failed">
        <p>
          Default SQL Server is <strong>lock-based</strong>, so readers and writers block each other.
          On a fresh database <code>is_read_committed_snapshot_on = 0</code>.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Real output — the same test, before and after RCSI">
{`RCSI OFF (the default):
   A: BEGIN TRANSACTION; UPDATE [dbo].[Account] SET [Balance]=200 ... (holds)
   B: SELECT [Balance] FROM [dbo].[Account] WHERE [Id]=1;
   -> Msg 1222, Level 16 — Lock request time out period exceeded.
      reader returned after 9s

ALTER DATABASE [lab] SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;

RCSI ON:
   same test -> Balance = 100 (last committed), returned after 0s

Cost: row versions live in TEMPDB (+14 bytes/row). Semantics change —
read-then-write logic that relied on blocking now needs UPDLOCK.
WITH ROLLBACK IMMEDIATE kills existing connections.`}
      </CodeBlock>

      <CodeBlock language="text" title="Isolation levels and NOLOCK">
{`                    dirty  non-repeat  phantom
READ UNCOMMITTED     YES      YES        YES     = WITH (NOLOCK)
READ COMMITTED        no      YES        YES     <- DEFAULT
REPEATABLE READ       no       no        YES
SERIALIZABLE          no       no         no
SNAPSHOT              no       no         no     versioned

READ COMMITTED has TWO implementations chosen by the RCSI setting:
locking (blocks) or versioning (does not). Same name, different behaviour.

*** NOLOCK IS NOT A PERFORMANCE HINT ***
Beyond dirty reads, a NOLOCK scan can MISS ROWS THAT EXIST or READ THE
SAME ROW TWICE when page splits move data mid-scan. A wrong COUNT(*) on
a table nobody deleted from. NOLOCK everywhere = a workaround for
blocking that RCSI fixes properly.

DEADLOCK = error 1205. Prevent by touching tables in a CONSISTENT ORDER.
Deadlocks are normal under load: catch 1205 and RETRY with backoff.

SELECT [r].[session_id], [r].[blocking_session_id], [r].[wait_type], [t].[text]
FROM sys.dm_exec_requests AS [r]
CROSS APPLY sys.dm_exec_sql_text([r].[sql_handle]) AS [t]
WHERE [r].[blocking_session_id] <> 0;
LCK_M_S waits = readers queuing behind writers = turn on RCSI.`}
      </CodeBlock>

      <h2>Indexing & SARGability</h2>
      <CodeBlock language="text" title="Measured: 20,000 rows, index on [Customer Code] VARCHAR(20)">
{`WHERE [Customer Code] = 'C0000500'            logical reads:  2   SEEK
WHERE LEFT([Customer Code],8) = 'C0000500'    logical reads: 57   SCAN

*** THE NVARCHAR TRAP IS COLLATION-DEPENDENT ***
The usual advice — "an NVARCHAR parameter against a VARCHAR column kills
the seek" — is only true on SOME collations. Measured:

  collation                             = 'C..'     = N'C..'
  Latin1_General_100_CI_AS  (Windows)    2 reads     2 reads   SEEK
  SQL_Latin1_General_CP1_CI_AS   (SQL)   2 reads    57 reads   SCAN

Windows collations convert order-preservingly, so the seek survives.
SQL_* collations (the legacy family, and the DEFAULT on many installs)
do not. The same app code is fast against one database and slow against
another ON THE SAME SERVER.

  SELECT SERVERPROPERTY('Collation');
  SELECT [name], [collation_name] FROM sys.databases;

Fix either way: set SqlDbType.VarChar explicitly in .NET.
Look for CONVERT_IMPLICIT on the COLUMN side of the plan.`}
      </CodeBlock>

      <CodeBlock language="sql" title="Non-SARGable -> SARGable">
{`YEAR([Invoice Date]) = 2026   ->  [Invoice Date] >= '2026-01-01'
                                  AND [Invoice Date] < '2027-01-01'
LEFT([Code],3) = 'ABC'        ->  [Code] LIKE 'ABC%'
[Total] * 12 > 100000         ->  [Total] > 100000/12
[Code] = 12345                ->  [Code] = '12345'
ISNULL([Dept],'none') = 'x'   ->  [Dept] = 'x' OR [Dept] IS NULL
[City] LIKE '%burg'           ->  not seekable; full-text or a reversed
                                  computed column

RULE: keep the indexed column BARE on one side of the operator.`}
      </CodeBlock>

      <CodeBlock language="text" title="Plans and parameter sniffing">
{`SET STATISTICS IO ON;    -- logical reads = pages touched. The metric.

Index Seek            good          Key Lookup   add INCLUDE columns
Clustered Index Scan  = table scan  Hash Match   check the join column
FIRST CHECK: estimated vs actual rows. A big gap = stale stats or
sniffing. Fix the ESTIMATE before adding indexes:
    UPDATE STATISTICS [dbo].[t] WITH FULLSCAN;

PARAMETER SNIFFING: the plan is compiled for the FIRST parameter values
and reused. Skewed data => a plan that suits one caller ruins another.
  OPTION (RECOMPILE)                best plan every call, per-call cost
  OPTION (OPTIMIZE FOR (@p = ...))  compile for a typical value
  OPTION (OPTIMIZE FOR UNKNOWN)     density average
  local variable copy               the same thing, by accident

Do NOT blindly apply missing-index suggestions: they ignore write cost
and existing near-matches, and often propose huge INCLUDE lists.`}
      </CodeBlock>

      <h2>Numbers (Tally) Table</h2>
      <CodeBlock language="sql" title="Cascading CTEs — each level squares the row count">
{`;WITH N1([C]) AS (SELECT 0 UNION ALL SELECT 0)          --      2
,N2([C]) AS (SELECT 0 FROM N1 AS [T1] CROSS JOIN N1 AS [T2])  --      4
,N3([C]) AS (SELECT 0 FROM N2 AS [T1] CROSS JOIN N2 AS [T2])  --     16
,N4([C]) AS (SELECT 0 FROM N3 AS [T1] CROSS JOIN N3 AS [T2])  --    256
,N6([C]) AS (SELECT 0 FROM N4 AS [T1] CROSS JOIN N4 AS [T2]
                                      CROSS JOIN N2 AS [T3])  -- 262,144
,Nums([Num]) AS (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) FROM N6)
INSERT INTO [dbo].[Numbers]([Num]) SELECT [Num] FROM Nums;

;WITH                     leading semicolon: WITH must start a batch, so
                          this terminates whatever came before
N1([C])                   names the CTE's output column
SELECT 0                  the VALUE is irrelevant; only the COUNT matters
ORDER BY (SELECT NULL)    "number these, I do not care about order" —
                          a constant, so the optimiser SKIPS the sort
PRIMARY KEY CLUSTERED     makes BETWEEN a range SEEK

Watch for a dead N5 in copies of this script: N6 uses N4/N4/N2, so an
N5 defined as N4 x N4 is never referenced. Verified — deleting it gives
the identical 262,144 rows.

USES: date series, gap filling, expanding a range into one row per unit,
splitting strings. Replaces a WHILE loop with one set-based statement.`}
      </CodeBlock>

      <h2>Section Index</h2>
      <CodeBlock language="text" title="All 10 lessons">
{` 1. T-SQL & Which Server You Are On      versions, collation, NULL basics
 2. Core Queries                         TOP, paging, NULLs, ISNULL trap
 3. Joins & Set Operations               APPLY, NOT EXISTS, SCD joins
 4. Aggregation & Window Functions       frames, ROLLUP, dedup
 5. Modifying Data                       OUTPUT, identity, why not MERGE
 6. Views, Reusable SQL & Numbers Tables views, SCHEMABINDING, tally
 7. Procedures, Functions & Errors       TRY/CATCH, UDF cliff, dynamic SQL
 8. Transactions, Isolation & Locking    RCSI. Read this one.
 9. Indexing, SARGability & Plans        the 2-vs-57 reads measurement
10. This cheat sheet

The PostgreSQL material is separate: SQL Fundamentals, SQL Design
Patterns, SQL Advanced, and the SQL Field Guide.`}
      </CodeBlock>

      <InfoBox variant="tip" title="If you remember only four things">
        <p>
          <strong>1.</strong> Turn on <code>READ_COMMITTED_SNAPSHOT</code> — it is why your reads
          block. <strong>2.</strong> Join a slowly-changing dimension on the{' '}
          <em>surrogate</em> key, or you multiply your facts.{' '}
          <strong>3.</strong> Keep the indexed column bare in the predicate.{' '}
          <strong>4.</strong> Default collation is case-insensitive, so{' '}
          <code>&apos;Bob&apos;</code> and <code>&apos;bob&apos;</code> collide in a unique index.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default TsqlCheatsheet;
