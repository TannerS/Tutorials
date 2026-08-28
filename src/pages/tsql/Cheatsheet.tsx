import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function TsqlCheatsheet() {
  return (
    <LessonLayout
      title="📋 T-SQL Cheat Sheet"
      sectionId="tsql"
      lessonIndex={8}
      prev={{ path: '/tsql/indexing', label: 'Indexing, SARGability & Execution Plans' }}
      next={null}
    >
      <p>
        Everything in this section, condensed. Every measured figure here came from running the
        statement against a real <strong>SQL Server 2019 (15.0.4480.2)</strong> instance.
      </p>

      <h2>Which Version Am I On?</h2>
      <CodeBlock language="sql" title="And what the answer means">
{`SELECT @@VERSION;
SELECT SERVERPROPERTY('ProductVersion'), SERVERPROPERTY('Edition');
SELECT name, compatibility_level FROM sys.databases;

13.x = 2016 (130)   14.x = 2017 (140)   15.x = 2019 (150)
16.x = 2022 (160)   17.x = 2025 (170)

*** THERE IS NO SQL SERVER 2018. ***

The COMPATIBILITY LEVEL is per-database and can lag the engine. A 2019
engine running a database at level 130 uses 2016 optimiser behaviour —
including NO scalar UDF inlining. Check it before believing a feature
"exists in your version".`}
      </CodeBlock>

      <h2>Feature Availability (measured on 2019)</h2>
      <CodeBlock language="text" title="What ran, and what the server rejected">
{`AVAILABLE on 2019:
  STRING_AGG, TRIM, CONCAT_WS         2017+
  APPROX_COUNT_DISTINCT               2019+
  IIF, OFFSET/FETCH, CONCAT, FORMAT   2012+
  STRING_SPLIT                        2016+

NOT AVAILABLE on 2019 (need 2022+):
  GREATEST, LEAST, GENERATE_SERIES, DATE_BUCKET

On 2016 you additionally lose STRING_AGG / TRIM / CONCAT_WS.
The tells for a pre-2017 codebase:
  LTRIM(RTRIM(x))                        instead of TRIM(x)
  STUFF((SELECT ',' + c ... FOR XML PATH('')), 1, 1, '')
                                         instead of STRING_AGG
  (and FOR XML PATH XML-escapes & and < in your data — a real bug)`}
      </CodeBlock>

      <h2>⚠️ Not Like PostgreSQL</h2>
      <CodeBlock language="text" title="All verified on 2019">
{`COLLATION      default SQL_Latin1_General_CP1_CI_AS  = CASE INSENSITIVE
               'ABC' = 'abc'  ->  TRUE
               => 'Bob' and 'bob' COLLIDE in a unique index

NULL ORDER     ORDER BY x ASC puts NULLs FIRST  (Postgres: last)
               T-SQL has NO "NULLS LAST" clause. Emulate:
               ORDER BY CASE WHEN x IS NULL THEN 1 ELSE 0 END, x

INT DIVISION   7/2 = 3        7.0/2 = 3.500000

NULL CONCAT    'a' + NULL = NULL        CONCAT('a',NULL) = 'a'

READS BLOCK    a plain SELECT can block behind an uncommitted UPDATE
               (see the isolation section — this is the big one)

TYPES          VARCHAR (1 byte, code page) vs NVARCHAR (2 bytes, Unicode)
               Postgres has one text type. This choice is per column and
               getting it wrong costs you index seeks.`}
      </CodeBlock>

      <h2>Queries</h2>
      <CodeBlock language="sql" title="The shapes you write daily">
{`SELECT TOP (10) ... ORDER BY x DESC;         -- TOP goes at the FRONT
SELECT TOP (@n) ...                          -- parens REQUIRED for a variable
SELECT TOP (3) WITH TIES ... ORDER BY x;     -- do not cut through ties

ORDER BY id OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;   -- ORDER BY MANDATORY
-- deep paging is slow; prefer keyset:  WHERE id > @last ORDER BY id

-- top-N per group: CROSS APPLY is SQL Server's LATERAL
SELECT d.dept, x.name FROM (SELECT DISTINCT dept FROM emp) d
CROSS APPLY (SELECT TOP (1) name FROM emp e
             WHERE e.dept = d.dept ORDER BY e.salary DESC) x;

-- CROSS APPLY = inner        OUTER APPLY = left

ISNULL(a,b)    forces b into a's TYPE — CAN TRUNCATE SILENTLY:
               ISNULL(CAST(NULL AS VARCHAR(2)), 'abcdef') -> 'ab'
COALESCE(a,b)  standard, n-ary, no truncation.  DEFAULT TO THIS.

LEN('ab   ') = 2       (ignores TRAILING spaces)
DATALENGTH('ab   ') = 5    DATALENGTH(N'ab') = 4   (BYTES, not chars)

NOT IN (subquery with any NULL) -> ZERO ROWS. Always use NOT EXISTS.
UNION dedups (costs a sort); UNION ALL just concatenates. Default to ALL.`}
      </CodeBlock>

      <h2>Window Functions</h2>
      <CodeBlock language="sql" title="And the frame trap">
{`ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)  -- 1,2,3,4
RANK()        -- 1,2,2,4 (gaps)      DENSE_RANK()  -- 1,2,2,3 (no gaps)
LAG(x,1) / LEAD(x,1) OVER (ORDER BY t)

*** THE DEFAULT FRAME IS WRONG FOR RUNNING TOTALS ***
Writing ORDER BY inside OVER() silently applies
    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
where "current row" means ALL ROWS WITH THE SAME VALUE, so tied rows all
get the same total. Always write it explicitly:
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
(ROWS is also generally faster. The bug is invisible without ties.)

Dedup pattern — you CAN delete from a CTE:
WITH r AS (SELECT id, ROW_NUMBER() OVER (PARTITION BY email
                                         ORDER BY created DESC) rn
           FROM users)
DELETE FROM r WHERE rn > 1;

AVG ignores NULLs — AVG over (100, NULL, 80) is 90, NOT 60.
SUM over zero rows is NULL, not 0. Wrap: ISNULL(SUM(x), 0)`}
      </CodeBlock>

      <h2>Modifying Data</h2>
      <CodeBlock language="sql" title="OUTPUT is the good one">
{`UPDATE emp SET salary = salary + 1
OUTPUT deleted.id, deleted.salary AS old_sal, inserted.salary AS new_sal
WHERE id = 3;
--  id | old_sal | new_sal
--   3 | 80      | 81

-- atomic queue claim: no race, no explicit transaction
UPDATE TOP (10) job_queue SET status='processing'
OUTPUT inserted.id, inserted.payload WHERE status='pending';

IDENTITY:
  SCOPE_IDENTITY()   correct — this scope
  @@IDENTITY         WRONG if a TRIGGER inserts elsewhere: returns the
                     trigger's id. Classic production bug.
  OUTPUT inserted.id best — unambiguous, and works for MULTI-ROW inserts

UPDATE ... FROM with a join matching MULTIPLE source rows updates once
with an ARBITRARY winner, silently. Check the source is unique first.

MERGE: reads well, has a long history of concurrency bugs, needs
       WITH (HOLDLOCK) to be safe, and "NOT MATCHED BY SOURCE THEN DELETE"
       applies to the WHOLE TABLE. Prefer UPDATE + INSERT in a transaction.

TRUNCATE resets the identity seed, skips triggers, and IS transactional
(it can be rolled back — unlike MySQL).
Large deletes: DELETE TOP (5000) in a WHILE loop.`}
      </CodeBlock>

      <h2>Procedures, Functions, Errors</h2>
      <CodeBlock language="sql" title="The template worth memorising">
{`CREATE OR ALTER PROCEDURE dbo.usp_Name @p INT, @out INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;      -- always
    SET XACT_ABORT ON;   -- always, if it writes

    BEGIN TRY
        BEGIN TRAN;
            ...
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRAN;
        THROW;           -- preserves error number, message AND line
    END CATCH
END;

THROW      2012+, re-raises faithfully.        USE THIS.
RAISERROR  legacy; a bare re-raise LOSES the original error number
           and reports its own line.

FUNCTIONS — the performance cliff:
  scalar UDF           per-row; below compat 150 it also forces the whole
                       query SINGLE-THREADED. Avoid in SELECT lists.
  multi-statement TVF  optimiser cannot see inside. Bad estimates.
  INLINE TVF           RETURNS TABLE AS RETURN (SELECT ...)  <- THE GOOD ONE
                       Expanded into the plan. Use with CROSS APPLY.

SELECT @v = col FROM t   -- no rows -> @v KEEPS ITS OLD VALUE (no error)
SET @v = (SELECT col...) -- no rows -> NULL; many rows -> ERROR. Stricter.

DYNAMIC SQL — never concatenate values:
EXEC sp_executesql N'SELECT * FROM emp WHERE dept=@d',
     N'@d VARCHAR(10)', @d = @dept;
Identifiers cannot be parameterised — use QUOTENAME(@name) and validate
against sys.tables.`}
      </CodeBlock>

      <h2>🔒 Transactions & Isolation — The Big One</h2>

      <InfoBox variant="danger" title="Measured: a plain SELECT blocked for 8s and then failed">
        <p>
          Default SQL Server is <strong>lock-based</strong>, so readers and writers block each other.
          On a fresh database, <code>is_read_committed_snapshot_on = 0</code>.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Real output — the same test, before and after RCSI">
{`RCSI OFF (the default):
   session A: BEGIN TRAN; UPDATE acct SET bal=200 WHERE id=1;  (holds)
   session B: SELECT bal FROM acct WHERE id=1;
   -> Msg 1222, Level 16 — Lock request time out period exceeded.
      reader returned after 9s

ALTER DATABASE lab SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;

RCSI ON:
   same test
   -> bal = 100   (last committed value)
      reader returned after 0s

Cost: row versions live in TEMPDB (+14 bytes/row). Semantics change —
read-then-write logic that relied on blocking now needs UPDLOCK.
WITH ROLLBACK IMMEDIATE kills existing connections. Not for casual use.`}
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
a table nobody deleted from. If NOLOCK is everywhere in a codebase, it is
a workaround for blocking that RCSI fixes properly.

DEADLOCK = error 1205. Prevent by touching tables in a CONSISTENT ORDER.
Deadlocks are normal under load: catch 1205 and RETRY with backoff.`}
      </CodeBlock>

      <CodeBlock language="sql" title="Who is blocking whom, right now">
{`SELECT r.session_id, r.blocking_session_id, r.wait_type, r.wait_time,
       t.text
FROM   sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE  r.blocking_session_id <> 0;

DBCC INPUTBUFFER(<blocking_session_id>);
SELECT * FROM sys.dm_tran_active_transactions ORDER BY transaction_begin_time;

LCK_M_S waits = readers queuing behind writers = turn on RCSI.`}
      </CodeBlock>

      <h2>Indexing & SARGability</h2>
      <CodeBlock language="text" title="Measured: 20,000 rows, index on code VARCHAR(20)">
{`WHERE code = 'C0000500'            logical reads:  2   <- SEEK
WHERE code = N'C0000500'           logical reads: 57   <- SCAN (28x)
WHERE LEFT(code,8) = 'C0000500'    logical reads: 57   <- SCAN

The N'' case is the one that WILL happen to you: .NET SqlClient and many
ORMs send strings as NVARCHAR by default. NVARCHAR outranks VARCHAR in
datatype precedence, so the engine converts THE COLUMN and the seek dies.
Look for CONVERT_IMPLICIT on the column side of the plan.
Fix: set SqlDbType.VarChar explicitly, or make the column NVARCHAR.
NOTE: running the query by hand in SSMS types the literal as VARCHAR and
looks FINE — the problem is invisible unless you read the app's plan.`}
      </CodeBlock>

      <CodeBlock language="sql" title="Non-SARGable -> SARGable">
{`YEAR(created) = 2026        ->  created >= '2026-01-01'
                                AND created < '2027-01-01'
LEFT(code,3) = 'ABC'        ->  code LIKE 'ABC%'
salary * 12 > 100000        ->  salary > 100000/12
varchar_col = 12345         ->  varchar_col = '12345'
ISNULL(dept,'none') = 'eng' ->  dept = 'eng' OR dept IS NULL
name LIKE '%smith'          ->  not seekable; full-text or a reversed
                                computed column

RULE: keep the indexed column BARE on one side of the operator.`}
      </CodeBlock>

      <CodeBlock language="text" title="Plans and parameter sniffing">
{`SET STATISTICS IO ON;    -- logical reads = pages touched. The metric.

Index Seek           good           Key Lookup   add INCLUDE columns
Clustered Index Scan = table scan   Hash Match   check the join column
FIRST CHECK: estimated vs actual rows. A big gap means stale stats or
sniffing — fix the ESTIMATE before adding indexes.
    UPDATE STATISTICS dbo.t WITH FULLSCAN;

PARAMETER SNIFFING: the plan is compiled for the FIRST parameter values
and reused. Skewed data => a plan that suits one caller ruins another.
  OPTION (RECOMPILE)              best plan every call, per-call cost
  OPTION (OPTIMIZE FOR (@p='US')) compile for a typical value
  OPTION (OPTIMIZE FOR UNKNOWN)   use the density average
  local variable copy             the same thing, by accident

Do NOT blindly apply missing-index suggestions: they ignore write cost
and existing near-matches, and often propose huge INCLUDE lists.`}
      </CodeBlock>

      <h2>Section Index</h2>
      <CodeBlock language="text" title="All 9 lessons">
{`1. T-SQL & Which Server You Are On      versions, collation, NULL basics
2. Core Queries                         TOP, paging, NULLs, ISNULL trap
3. Joins & Set Operations               APPLY, NOT EXISTS, UNION ALL
4. Aggregation & Window Functions       frames, ROLLUP, dedup
5. Modifying Data                       OUTPUT, identity, why not MERGE
6. Procedures, Functions & Errors       TRY/CATCH, UDF cliff, dynamic SQL
7. Transactions, Isolation & Locking    RCSI. Read this one.
8. Indexing, SARGability & Plans        the 2-vs-57 reads measurement
9. This cheat sheet

The PostgreSQL material is separate: SQL Fundamentals, SQL Design
Patterns, SQL Advanced, and the SQL Field Guide.`}
      </CodeBlock>

      <InfoBox variant="tip" title="If you remember only three things">
        <p>
          <strong>1.</strong> Turn on <code>READ_COMMITTED_SNAPSHOT</code> — it is why your reads
          block. <strong>2.</strong> Keep the indexed column bare in the predicate, and watch for{' '}
          <code>NVARCHAR</code> parameters against <code>VARCHAR</code> columns.{' '}
          <strong>3.</strong> Default collation is case-insensitive, so{' '}
          <code>&apos;Bob&apos;</code> and <code>&apos;bob&apos;</code> collide in a unique index.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default TsqlCheatsheet;
