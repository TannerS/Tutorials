import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function TsqlIndexing() {
  return (
    <LessonLayout
      title="Indexing, SARGability & Execution Plans"
      sectionId="tsql"
      lessonIndex={8}
      prev={{ path: '/tsql/transactions', label: 'Transactions, Isolation & Locking' }}
      next={{ path: '/tsql/cheatsheet', label: '📋 T-SQL Cheat Sheet' }}
    >
      <p>
        An index only helps if the optimiser can <em>seek</em> on it. Most &quot;the index is not
        being used&quot; problems are not missing indexes — they are queries written in a shape that
        makes a seek impossible. Everything below was measured on SQL Server 2019.
      </p>

      <h2>Clustered vs Nonclustered</h2>

      <CodeBlock language="text" title="The one structural idea you have to hold">
{`CLUSTERED INDEX     IS the table. Rows are stored in its key order.
                    ONE per table. A PRIMARY KEY becomes clustered by
                    default, which is a choice, not a law.

NONCLUSTERED INDEX  A separate structure: the key columns plus a pointer
                    back to the clustered index (or a RID for a heap).

HEAP                A table with NO clustered index. Rows sit wherever.
                    Almost always wrong for an OLTP table.

*** THE KEY LOOKUP ***
A nonclustered index that does not contain every column the query needs
must jump back to the clustered index for each matching row. That jump
is a KEY LOOKUP, and it is why an index can exist, be used, and still be
slow. Past a few percent of the table the optimiser abandons the lookups
and scans instead.`}
      </CodeBlock>

      <CodeBlock language="sql" title="INCLUDE eliminates the lookup">
{`-- seeks on the code, but looks up [Valid From] for every match
CREATE INDEX [IX_CustomerCode_Code]
    ON [dbo].[CustomerCode]([Customer Code]);

-- COVERING: everything the query needs is in the index, no lookup
CREATE INDEX [IX_CustomerCode_Code]
    ON [dbo].[CustomerCode]([Customer Code])
    INCLUDE ([Valid From]);`}
      </CodeBlock>

      <p>
        Included columns live only in the index leaf, so they add size but no key-ordering overhead.{' '}
        <code>INCLUDE</code> makes a column <em>retrievable</em>; the key makes it{' '}
        <em>searchable and sortable</em>. Filter and join columns go in the key; columns you only{' '}
        <code>SELECT</code> go in <code>INCLUDE</code>.
      </p>

      <h2>SARGability — Measured</h2>

      <p>
        A predicate is <strong>SARGable</strong> (Search ARGument-able) if the engine can use it to
        navigate an index. Same lookup, same 20,000-row indexed table, two shapes — real{' '}
        <code>SET STATISTICS IO</code> output:
      </p>

      <CodeBlock language="text" title="Real output — index on [Customer Code] VARCHAR(20)">
{`A.  WHERE [Customer Code] = 'C0000500'             logical reads:  2   SEEK
B.  WHERE LEFT([Customer Code],8) = 'C0000500'     logical reads: 57   SCAN`}
      </CodeBlock>

      <p>
        Wrapping the column in <code>LEFT()</code> costs 28x the reads on a small table, and the gap
        widens with size. The engine must compute the expression for every row before it can compare
        — and computing per row is exactly what a scan is.
      </p>

      <h2>The NVARCHAR Trap — And When It Actually Fires</h2>

      <p>
        The widely repeated rule is &quot;comparing an <code>NVARCHAR</code> parameter to a{' '}
        <code>VARCHAR</code> column destroys the seek.&quot; That is <strong>only true under some
        collations</strong>, which is worth knowing before you go rewriting queries. Two identical
        tables, differing only in the column&apos;s collation:
      </p>

      <CodeBlock language="text" title="Real output — the same query against two collations">
{`collation                             = 'C0000500'    = N'C0000500'
------------------------------------- --------------- ----------------
Latin1_General_100_CI_AS   (Windows)    2 reads         2 reads   SEEK
SQL_Latin1_General_CP1_CI_AS    (SQL)   2 reads        57 reads   SCAN`}
      </CodeBlock>

      <InfoBox variant="danger" title="It depends on whether the collation is a SQL one or a Windows one">
        <p>
          Under a <strong>Windows</strong> collation (any name not starting <code>SQL_</code>) the{' '}
          <code>VARCHAR</code>-to-<code>NVARCHAR</code> conversion preserves sort order, so the
          engine can still seek. Under a <strong>SQL</strong> collation (names beginning{' '}
          <code>SQL_</code>, the legacy family) the two sort orders do not correspond, the conversion
          is not order-preserving, and the seek is lost.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          This matters because <code>SQL_Latin1_General_CP1_CI_AS</code> is the{' '}
          <strong>default on many installations</strong> — it is the server default on the instance
          used for these lessons — while databases created more recently, including{' '}
          <code>WideWorldImportersDW</code> (<code>Latin1_General_100_CI_AS</code>), use Windows
          collations. The same application code can therefore be fast against one database and slow
          against another <em>on the same server</em>.
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="Find out which you are on">
{`SELECT SERVERPROPERTY('Collation') AS [Server Collation];

SELECT [name], [collation_name]
FROM   sys.databases;

-- per column — collation can be overridden at column level
SELECT [name], [collation_name]
FROM   sys.columns
WHERE  [object_id] = OBJECT_ID('dbo.CustomerCode');`}
      </CodeBlock>

      <p>
        Regardless of collation the fix in application code is the same and costs nothing: set the
        parameter type explicitly (<code>SqlDbType.VarChar</code> in .NET) so the types match. Most
        drivers send strings as <code>NVARCHAR</code> by default, so on a SQL-collation database a
        query that seeks perfectly in SSMS — where you typed the literal without an <code>N</code> —
        can scan in production, with no cast anywhere in the source to explain it. Look for{' '}
        <code>CONVERT_IMPLICIT</code> on the column side of the plan.
      </p>

      <h2>Non-SARGable Patterns and Their Rewrites</h2>

      <CodeBlock language="sql" title="Keep the indexed column bare on one side">
{`-- function on the column
WHERE YEAR([Invoice Date]) = 2026
WHERE [Invoice Date] >= '2026-01-01'
  AND [Invoice Date] <  '2027-01-01'                     -- seekable

WHERE LEFT([Customer Code], 3) = 'ABC'
WHERE [Customer Code] LIKE 'ABC%'                        -- seekable

-- leading wildcard: never seekable on a normal index
WHERE [City] LIKE '%burg'      -- full-text index, or a reversed
                               -- computed column, is the real answer

-- arithmetic on the column
WHERE [Total Excluding Tax] * 12 > 100000
WHERE [Total Excluding Tax] > 100000 / 12                -- seekable

-- implicit conversion by type mismatch
WHERE [Customer Code] = 12345      -- number vs string: converts the COLUMN
WHERE [Customer Code] = '12345'                          -- seekable

-- ISNULL / COALESCE wrapping the column
WHERE ISNULL([Sales Territory], N'none') = N'Mideast'
WHERE [Sales Territory] = N'Mideast'
   OR [Sales Territory] IS NULL                          -- seekable`}
      </CodeBlock>

      <h2>Reading a Plan</h2>

      <CodeBlock language="sql" title="How to look">
{`SET STATISTICS IO ON;      -- logical reads = pages touched. The metric.
SET STATISTICS TIME ON;    -- CPU and elapsed

SET SHOWPLAN_TEXT ON;      -- estimated plan without running it
-- or Ctrl+M in SSMS for the ACTUAL plan (runs it, keeps the plan)`}
      </CodeBlock>

      <CodeBlock language="text" title="What the operators mean">
{`Index Seek           navigates the B-tree. What you want.
Index Scan           reads every leaf page of the index.
Clustered Index Scan a full table scan wearing a nicer name.
Key Lookup           the jump back for missing columns. Fix with INCLUDE.
Sort                 often removable by indexing in the ORDER BY order.
Hash Match           fine for big joins, suspicious for small ones —
                     frequently a missing index on the join column.

*** THE FIRST THING TO CHECK ***
Compare ESTIMATED vs ACTUAL row counts on each operator. A large gap
means stale statistics or an unguessable predicate, and a bad estimate
is the root cause of most bad plans. Fix the ESTIMATE before adding an
index:
    UPDATE STATISTICS [dbo].[CustomerCode] WITH FULLSCAN;

Scans are not automatically bad. Scanning a 200-row lookup table is
correct. Scanning 50 million rows to return 3 is not.`}
      </CodeBlock>

      <h2>Parameter Sniffing</h2>

      <p>
        SQL Server compiles a procedure&apos;s plan using the parameter values from the{' '}
        <em>first</em> execution, then reuses it. With skewed data, the plan that suits the first
        caller can be terrible for the next.
      </p>

      <CodeBlock language="text" title="The classic shape">
{`EXEC [dbo].[usp_GetSalesByTerritory] @SalesTerritory = N'External';
     -- a handful of rows -> plan: index seek + key lookups

EXEC [dbo].[usp_GetSalesByTerritory] @SalesTerritory = N'Southeast';
     -- 50,520 rows -> REUSES the seek plan. 50,520 key lookups.

Same procedure, same code, wildly different runtime depending on WHICH
call compiled the plan. It "randomly" gets slow after a restart or a
statistics update, because a different caller warmed the cache.`}
      </CodeBlock>

      <CodeBlock language="sql" title="The options">
{`-- recompile this statement every call: best plan, per-call cost
SELECT ... FROM [Fact].[Sale] WHERE ... OPTION (RECOMPILE);

-- compile for a typical value, always
OPTION (OPTIMIZE FOR (@SalesTerritory = N'Southeast'))

-- compile for the density average, ignoring the sniffed value
OPTION (OPTIMIZE FOR UNKNOWN)

-- copy the parameter into a local variable: disables sniffing.
-- Widely used, and it is OPTIMIZE FOR UNKNOWN in disguise.
DECLARE @T NVARCHAR(100) = @SalesTerritory;   -- then use @T`}
      </CodeBlock>

      <FlowChart
        title="Diagnosing a slow query, in order"
        chart={"graph TD\n  A[\"query is slow\"] --> B[\"look at the ACTUAL plan\"]\n  B --> C{\"estimated vs actual<br/>rows: big gap?\"}\n  C -->|\"yes\"| D[\"stale statistics or<br/>parameter sniffing\"]\n  C -->|\"no\"| E{\"seek or scan?\"}\n  E -->|\"scan on a big table\"| F{\"is the column bare<br/>in the predicate?\"}\n  F -->|\"no\"| G[\"NOT SARGable<br/>rewrite the predicate\"]\n  F -->|\"yes\"| H[\"missing index\"]\n  E -->|\"seek + many<br/>key lookups\"| I[\"add INCLUDE columns\"]\n  style G fill:#3b1a1a,stroke:#f87171\n  style D fill:#3d2f14\n  style I fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="warning" title="Do not blindly apply missing-index suggestions">
        <p>
          SSMS and <code>sys.dm_db_missing_index_details</code> propose indexes from individual
          queries in isolation. They ignore write cost, ignore near-matching indexes you already
          have, and frequently suggest wide <code>INCLUDE</code> lists that duplicate a large part of
          the table. Every index is maintained on every insert, update and delete. Treat the
          suggestions as evidence about which columns are filtered, not as instructions.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default TsqlIndexing;
