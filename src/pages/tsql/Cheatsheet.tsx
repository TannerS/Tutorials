import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

function TsqlCheatsheet() {
  return (
    <GuideLayout
      title="T-SQL"
      kicker="FIELD GUIDE"
      glyph="🗄️"
      tagline="Microsoft SQL Server — everything measured on a real 2019 instance (15.0.4480.2)."
      meta={['SQL Server 2016+', 'verified on 2019', '15 panels']}
      page="1 / 1"
      footer="Every figure here came from running the statement, not from documentation. The lessons in this section carry the reasoning; this page is the recall sheet."
      prev={{ path: '/tsql/indexing', label: 'Indexing, SARGability & Execution Plans' }}
      next={null}
    >
      <GuidePanel n={1} title="House Style" accent="blue" glyph="✍️" span={2}>
        <GuideCode>{`USE [WideWorldImportersDW];
GO

CREATE OR ALTER VIEW [dbo].[VW_City] AS
SELECT
     [City Key]
    ,[City]
    ,[State Province]
FROM [Dimension].[City];`}</GuideCode>
        <GuideDefs
          items={[
            ['[brackets]', 'mandatory when a name has a space — [City Key]'],
            ['leading ,', 'add/remove a column touches one line'],
            ['[Schema].[Obj]', 'always qualify; unqualified resolves per-user'],
            ["N'literal'", 'the N prefix makes it NVARCHAR (Unicode)'],
            ['GO', 'batch separator for SSMS/sqlcmd — not T-SQL'],
            ['CREATE OR ALTER', '2016 SP1+. Keeps permissions; DROP loses them'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={2} title="Which Server Am I On?" accent="purple" glyph="🔎">
        <GuideCode>{`SELECT @@VERSION;
SELECT SERVERPROPERTY('ProductVersion');
SELECT [name], [compatibility_level]
FROM sys.databases;`}</GuideCode>
        <GuideTable
          head={['Version', 'Product', 'Compat']}
          rows={[
            ['13.x', '2016', '130'],
            ['14.x', '2017', '140'],
            ['15.x', '2019', '150'],
            ['16.x', '2022', '160'],
            ['17.x', '2025', '170'],
          ]}
        />
        <GuideRules items={['There is NO SQL Server 2018.', 'Compatibility level is per-database and can lag the engine — a 2019 engine at level 130 uses 2016 optimiser behaviour.']} />
      </GuidePanel>

      <GuidePanel n={3} title="Feature Gates (measured on 2019)" accent="green" glyph="🚦">
        <GuideDefs
          items={[
            ['STRING_AGG', '2017+  ✔ available'],
            ['TRIM', '2017+  ✔ available'],
            ['CONCAT_WS', '2017+  ✔ available'],
            ['APPROX_COUNT_DISTINCT', '2019+  ✔ available'],
            ['STRING_SPLIT', '2016+  ✔ (no ordinal until 2022)'],
            ['GREATEST / LEAST', '2022+  ✘ NOT on 2019'],
            ['GENERATE_SERIES', '2022+  ✘ NOT on 2019'],
            ['DATE_BUCKET', '2022+  ✘ NOT on 2019'],
          ]}
        />
        <GuideRules items={['Pre-2017 tells: LTRIM(RTRIM(x)) and the FOR XML PATH concat trick — which also XML-escapes & and < in your data.']} />
      </GuidePanel>

      <GuidePanel n={4} title="⚠ Not Like PostgreSQL" accent="red" glyph="⚠️" span={2}>
        <GuideTable
          head={['Behaviour', 'SQL Server', 'PostgreSQL']}
          rows={[
            ["'ABC' = 'abc'", 'TRUE — default collation is CI', 'FALSE'],
            ['ORDER BY x ASC', 'NULLs FIRST', 'NULLs LAST'],
            ['NULLS LAST clause', 'does not exist', 'supported'],
            ['7 / 2', '3 (int division)', '3'],
            ["'a' + NULL", 'NULL', 'ERROR — no + for text'],
            ['SELECT vs writer', 'CAN BLOCK', 'never blocks'],
            ['text types', 'VARCHAR vs NVARCHAR', 'one type, Unicode'],
          ]}
        />
        <GuideRules items={["Case-insensitive default means 'Bob' and 'bob' COLLIDE in a unique index.", "Emulate NULLS LAST: ORDER BY CASE WHEN x IS NULL THEN 1 ELSE 0 END, x", "PostgreSQL has no + for text — it's || only. 'a' + NULL raises operator does not exist."]} />
      </GuidePanel>

      <GuidePanel n={5} title="Core Queries" accent="cyan" glyph="🔤">
        <GuideCode>{`SELECT TOP (10) ... ORDER BY [x] DESC;
SELECT TOP (@n) ...      -- parens required
SELECT TOP (3) WITH TIES ...

ORDER BY [Id]
OFFSET 20 ROWS
FETCH NEXT 10 ROWS ONLY;   -- ORDER BY MANDATORY`}</GuideCode>
        <GuideRules items={['TOP without ORDER BY returns an arbitrary set.', 'Deep OFFSET is slow — prefer keyset: WHERE [Id] > @Last.']} />
      </GuidePanel>

      <GuidePanel n={6} title="NULL Traps" accent="amber" glyph="⭕">
        <GuideCode>{`ISNULL(CAST(NULL AS NVARCHAR(2)), N'Not provided')
  -> 'No'          -- truncated to the FIRST arg's type!
COALESCE(...)      -> 'Not provided'

WHERE x NOT IN (SELECT ...)  -- any NULL => ZERO ROWS
WHERE NOT EXISTS (...)       -- correct`}</GuideCode>
        <GuideDefs
          items={[
            ['COALESCE', 'standard, n-ary, no truncation — the default choice'],
            ['LEN', "ignores TRAILING spaces: LEN('ab   ') = 2"],
            ['DATALENGTH', "BYTES not chars: DATALENGTH(N'ab') = 4"],
            ['AVG', 'ignores NULLs — (100, NULL, 80) averages to 90'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={7} title="APPLY — the LATERAL of T-SQL" accent="purple" glyph="🔗">
        <GuideCode>{`SELECT [t].[Sales Territory], [x].[City]
FROM (SELECT DISTINCT [Sales Territory]
      FROM [Dimension].[City]) AS [t]
CROSS APPLY (
    SELECT TOP (1) [c].[City]
    FROM [Dimension].[City] AS [c]
    WHERE [c].[Sales Territory] = [t].[Sales Territory]
    ORDER BY [c].[Latest Recorded Population] DESC
) AS [x];`}</GuideCode>
        <GuideDefs items={[['CROSS APPLY', 'drops the left row if empty (inner)'], ['OUTER APPLY', 'keeps it with NULLs (left)']]} />
      </GuidePanel>

      <GuidePanel n={8} title="⚠ Slowly-Changing Dimensions" accent="red" glyph="🕰️">
        <GuideCode>{`-- 116,295 rows, only 37,941 distinct cities.
-- 'New York' exists 3 times.

ON [c].[City Key] = [s].[City Key]   -- CORRECT
ON [c].[City]     = [s].[City Name]  -- MULTIPLIES facts`}</GuideCode>
        <GuideRules items={['Join on the SURROGATE key — it identifies one version.', 'Current row = [Valid To] = 9999-12-31 23:59:59.9999999', 'A view omitting [Valid From]/[Valid To] hides this from consumers entirely.']} />
      </GuidePanel>

      <GuidePanel n={9} title="Window Functions" accent="green" glyph="🪟">
        <GuideCode>{`ROW_NUMBER() OVER (PARTITION BY [Dept]
                   ORDER BY [Profit] DESC)

SUM([x]) OVER (ORDER BY [k]
  ROWS BETWEEN UNBOUNDED PRECEDING
           AND CURRENT ROW)   -- say ROWS!`}</GuideCode>
        <GuideDefs
          items={[
            ['RANK', '1,2,2,4 — gaps'],
            ['DENSE_RANK', '1,2,2,3 — no gaps'],
            ['default frame', 'RANGE — tied rows share one total. A bug you cannot see without ties in test data.'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={10} title="Modifying Data" accent="cyan" glyph="✏️">
        <GuideCode>{`UPDATE [dbo].[Account]
SET    [Balance] = [Balance] + 1
OUTPUT deleted.[Balance] AS [Old]
      ,inserted.[Balance] AS [New]
WHERE  [Id] = 3;`}</GuideCode>
        <GuideDefs
          items={[
            ['SCOPE_IDENTITY()', 'correct — this scope'],
            ['@@IDENTITY', 'WRONG if a trigger inserts elsewhere'],
            ['OUTPUT inserted', 'best — works for multi-row inserts'],
            ['MERGE', 'concurrency bugs; needs HOLDLOCK. Prefer UPDATE + INSERT.'],
            ['TRUNCATE', 'resets identity, skips triggers, IS transactional'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={11} title="Objects & Where They Live" accent="blue" glyph="📦">
        <GuideCode>{`SELECT [definition] FROM sys.sql_modules
WHERE [object_id] = OBJECT_ID('dbo.usp_X');

SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.usp_X'));`}</GuideCode>
        <GuideDefs
          items={[
            ['VIEW', 'no parameters, stores no data'],
            ['INLINE TVF', '"a view with parameters" — the good one'],
            ['scalar UDF', 'per-row; below compat 150 forces SERIAL plans'],
            ['SCHEMABINDING', 'required for an indexed view; COUNT_BIG(*)'],
          ]}
        />
        <GuideRules items={['CREATE OR ALTER is stored back as "CREATE   PROCEDURE" — OR ALTER is blanked, so a repo-vs-database diff shows a phantom change.']} />
      </GuidePanel>

      <GuidePanel n={12} title="Procedures & Errors" accent="amber" glyph="🧩">
        <GuideCode>{`CREATE OR ALTER PROCEDURE [dbo].[usp_Name]
     @Param NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        ...
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;`}</GuideCode>
        <GuideRules items={['THROW preserves number, message and line. RAISERROR loses them.', 'SELECT @v = col with no rows KEEPS the old value. SET @v = (SELECT..) is stricter.', 'sp_executesql parameterises values, never identifiers — use QUOTENAME.']} />
      </GuidePanel>

      <GuidePanel n={13} title="🔒 Isolation — The Big One" accent="red" glyph="🔒" span={2}>
        <GuideCode>{`-- RCSI (Read Committed Snapshot Isolation) OFF (the default):
A: BEGIN TRAN; UPDATE [Account] SET [Balance]=200 ...  (holds)
B: SELECT [Balance] FROM [Account] WHERE [Id]=1;
   -> Msg 1222 — Lock request time out. Reader waited 8s.

ALTER DATABASE [db]
  SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;

-- RCSI ON: same test -> Balance = 100, returned in 0s.`}</GuideCode>
        <GuideTable
          head={['Level', 'Dirty', 'Non-rep', 'Phantom']}
          rows={[
            ['READ UNCOMMITTED', 'yes', 'yes', 'yes'],
            ['READ COMMITTED ←', 'no', 'yes', 'yes'],
            ['REPEATABLE READ', 'no', 'no', 'yes'],
            ['SERIALIZABLE', 'no', 'no', 'no'],
            ['SNAPSHOT', 'no', 'no', 'no'],
          ]}
        />
        <GuideRules items={['READ COMMITTED has TWO implementations: locking (RCSI off) or versioning (RCSI on). Same name, different behaviour.', 'NOLOCK is not a performance hint — a scan can MISS rows or read one TWICE during page splits.', 'Deadlock = error 1205. Prevent with consistent table ordering; mitigate by retrying.']} />
      </GuidePanel>

      <GuidePanel n={14} title="Indexing & SARGability" accent="green" glyph="⚡" span={2}>
        <GuideCode>{`WHERE [Customer Code] = 'C0000500'          ->  2 reads  SEEK
WHERE LEFT([Customer Code],8) = 'C0000500'  -> 57 reads  SCAN

-- The NVARCHAR trap is COLLATION-DEPENDENT:
Latin1_General_100_CI_AS (Windows)   2 vs  2 reads  SEEK
SQL_Latin1_General_CP1_CI_AS (SQL)   2 vs 57 reads  SCAN`}</GuideCode>
        <GuideTable
          head={['Non-SARGable', 'Rewrite']}
          rows={[
            ['YEAR([d]) = 2026', "[d] >= '2026-01-01' AND [d] < '2027-01-01'"],
            ["LEFT([c],3) = 'ABC'", "[c] LIKE 'ABC%'"],
            ['[t] * 12 > 100000', '[t] > 100000/12'],
            ['[c] = 12345', "[c] = '12345'"],
            ["ISNULL([d],'x') = 'y'", "[d] = 'y'   -- default 'x' != target: OR IS NULL would be WRONG"],
            ["ISNULL([d],'y') = 'y'", "[d] = 'y' OR [d] IS NULL   -- only valid because default = target"],
          ]}
        />
        <GuideRules items={['Keep the indexed column BARE on one side of the operator.', "ISNULL(col,default)=target only becomes 'OR col IS NULL' when default equals target — otherwise NULL rows can never match and the OR silently changes the result.", 'Check estimated vs actual rows FIRST — a big gap means stale stats or parameter sniffing, not a missing index.', 'Fixes for sniffing: OPTION (RECOMPILE) / OPTIMIZE FOR / OPTIMIZE FOR UNKNOWN.']} />
      </GuidePanel>

      <GuidePanel n={15} title="Numbers (Tally) Table" accent="purple" glyph="🔢" span={2}>
        <GuideCode>{`;WITH N1([C]) AS (SELECT 0 UNION ALL SELECT 0)          --      2
,N2([C]) AS (SELECT 0 FROM N1 [T1] CROSS JOIN N1 [T2])  --      4
,N3([C]) AS (SELECT 0 FROM N2 [T1] CROSS JOIN N2 [T2])  --     16
,N4([C]) AS (SELECT 0 FROM N3 [T1] CROSS JOIN N3 [T2])  --    256
,N6([C]) AS (SELECT 0 FROM N4 [T1] CROSS JOIN N4 [T2]
                                   CROSS JOIN N2 [T3])  -- 262,144
,Nums([Num]) AS (SELECT ROW_NUMBER()
                 OVER (ORDER BY (SELECT NULL)) FROM N6)
INSERT INTO [dbo].[Numbers]([Num]) SELECT [Num] FROM Nums;`}</GuideCode>
        <GuideDefs
          items={[
            [';WITH', 'leading semicolon terminates whatever came before'],
            ['SELECT 0', 'the value is irrelevant — only the row COUNT matters'],
            ['CROSS JOIN', 'joining a CTE to itself SQUARES its row count'],
            ['ORDER BY (SELECT NULL)', 'number rows without paying for a sort'],
          ]}
        />
        <GuideRules items={['Uses: date series, gap filling, expanding a range into one row per unit, splitting strings.', 'Replaces a WHILE loop with one set-based statement.', 'Copies of this script often carry a dead N5 that nothing references.']} />
      </GuidePanel>
    </GuideLayout>
  );
}

export default TsqlCheatsheet;
