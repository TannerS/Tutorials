import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function TsqlIndexing() {
  return (
    <LessonLayout
      title="Indexing, SARGability & Execution Plans"
      sectionId="tsql"
      lessonIndex={7}
      prev={{ path: '/tsql/transactions', label: 'Transactions, Isolation & Locking' }}
      next={{ path: '/tsql/cheatsheet', label: '📋 T-SQL Cheat Sheet' }}
    >
      <p>
        An index only helps if the optimiser can <em>seek</em> on it. Most &quot;the index is not
        being used&quot; problems are not missing indexes at all — they are queries written in a shape
        that makes a seek impossible. This lesson is mostly about that shape, measured on a real
        server.
      </p>

      <h2>Clustered vs Nonclustered</h2>

      <CodeBlock language="text" title="The one structural idea you have to hold">
{`CLUSTERED INDEX     IS the table. The rows are stored in its key order.
                    ONE per table. A PRIMARY KEY becomes clustered by
                    default, which is a choice, not a law.

NONCLUSTERED INDEX  A separate structure: the key columns, plus a
                    pointer back to the clustered index (or a RID if the
                    table is a heap). Up to 999 per table.

HEAP                A table with NO clustered index. Rows sit wherever.
                    Almost always wrong for an OLTP table.

*** THE KEY LOOKUP ***
A nonclustered index that does not contain every column the query needs
must jump back to the clustered index for each matching row. That jump
is a KEY LOOKUP, and it is why an index can exist, be used, and still be
slow. Past roughly a few percent of the table, the optimiser gives up on
the lookups and scans instead.`}
      </CodeBlock>

      <CodeBlock language="sql" title="INCLUDE eliminates the lookup">
{`-- seeks on code, but must look up 'created' for every match
CREATE INDEX ix_cust_code ON cust(code);

-- COVERING: everything the query needs is in the index, no lookup
CREATE INDEX ix_cust_code ON cust(code) INCLUDE (created);`}
      </CodeBlock>

      <p>
        Included columns live only in the index leaf, so they add size but not key-ordering overhead.
        Putting a column in <code>INCLUDE</code> makes it <em>retrievable</em>; putting it in the key
        makes it <em>searchable and sortable</em>. Filter and join columns go in the key; columns you
        only <code>SELECT</code> go in <code>INCLUDE</code>.
      </p>

      <h2>SARGability — Measured</h2>

      <p>
        A predicate is <strong>SARGable</strong> (Search ARGument-able) if the engine can use it to
        navigate an index. Here is the same lookup, on the same 20,000-row indexed table, written
        three ways. The numbers are real <code>SET STATISTICS IO</code> output:
      </p>

      <CodeBlock language="text" title="Real output — SQL Server 2019, 20,000 rows, index on code VARCHAR(20)">
{`A.  WHERE code = 'C0000500'          logical reads:  2     <- index SEEK
B.  WHERE code = N'C0000500'         logical reads: 57     <- index SCAN
C.  WHERE LEFT(code,8) = 'C0000500'  logical reads: 57     <- index SCAN`}
      </CodeBlock>

      <InfoBox variant="danger" title="B is the one that will happen to you, and nobody wrote a cast">
        <p>
          The only difference between A and B is the <code>N</code> prefix, making the literal{' '}
          <code>NVARCHAR</code> instead of <code>VARCHAR</code>. Comparing <code>NVARCHAR</code> to a{' '}
          <code>VARCHAR</code> column forces an implicit conversion of <em>the column</em>, which
          destroys the seek — 28x more reads on a small table, and the gap widens with size.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          This matters because <strong>many ORMs and drivers send strings as{' '}
          <code>NVARCHAR</code> by default</strong>. .NET&apos;s <code>SqlClient</code> does it unless
          the parameter type is set explicitly. So a query that seeks perfectly in SSMS scans in
          production, and the source code contains no cast to explain it. Check the plan for a{' '}
          <code>CONVERT_IMPLICIT</code> warning on the column side.
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="The non-SARGable patterns, and their rewrites">
{`-- function on the column
WHERE YEAR(created) = 2026
WHERE created >= '2026-01-01' AND created < '2027-01-01'    -- seekable

WHERE LEFT(code, 3) = 'ABC'
WHERE code LIKE 'ABC%'                                       -- seekable

-- leading wildcard: never seekable on a normal index
WHERE name LIKE '%smith'          -- full-text index or a reversed
                                  -- computed column is the real answer

-- arithmetic on the column
WHERE salary * 12 > 100000
WHERE salary > 100000 / 12                                   -- seekable

-- implicit conversion by type mismatch
WHERE varchar_col = 12345         -- number vs string: converts the COLUMN
WHERE varchar_col = '12345'                                  -- seekable

-- ISNULL / COALESCE wrapping the column
WHERE ISNULL(dept, 'none') = 'eng'
WHERE dept = 'eng' OR dept IS NULL                           -- seekable`}
      </CodeBlock>

      <InfoBox variant="tip" title="The rule, in one line">
        <p>
          <strong>Keep the indexed column bare on one side of the operator.</strong> Anything wrapped
          around it — a function, arithmetic, or an implicit conversion the engine inserts for you —
          means the engine must compute the expression for every row before it can compare, and
          computing per row is exactly what a scan is.
        </p>
      </InfoBox>

      <h2>Reading a Plan</h2>

      <CodeBlock language="sql" title="How to look">
{`SET STATISTICS IO ON;      -- logical reads = pages touched. The metric
SET STATISTICS TIME ON;    -- CPU and elapsed

SET SHOWPLAN_XML ON;       -- estimated plan, without running it
-- or press Ctrl+M in SSMS for the ACTUAL plan (run it, keep the plan)`}
      </CodeBlock>

      <CodeBlock language="text" title="What the operators mean">
{`Index Seek          navigates the B-tree. What you want.
Index Scan          reads every leaf page of the index.
Clustered Index Scan = a full table scan, wearing a nicer name.
Key Lookup          the jump back for missing columns. Fix with INCLUDE.
Sort                often removable by indexing in the ORDER BY order.
Hash Match          fine for big joins, suspicious for small ones —
                    frequently means a missing index on the join column.

*** THE FIRST THING TO CHECK ***
Compare ESTIMATED vs ACTUAL row counts on each operator. A large gap
means the statistics are stale or the predicate is unguessable, and a
bad estimate is the root cause of most bad plans. Fix the estimate
before you add an index:
    UPDATE STATISTICS dbo.cust WITH FULLSCAN;

Scans are not automatically bad. Scanning a 200-row lookup table is
correct. A scan on a 50-million-row table to return 3 rows is not.`}
      </CodeBlock>

      <h2>Parameter Sniffing</h2>

      <p>
        SQL Server compiles a procedure&apos;s plan using the parameter values from the{' '}
        <em>first</em> execution, then reuses that plan. When the data is skewed, the plan that suits
        the first caller can be terrible for the next one.
      </p>

      <CodeBlock language="text" title="The classic shape">
{`EXEC usp_GetOrders @country = 'LI';    -- 12 rows    -> plan: index seek + lookups
EXEC usp_GetOrders @country = 'US';    -- 8M rows    -> REUSES the seek plan
                                       --                8M key lookups. Hours.

Same procedure, same code, wildly different runtime depending on WHICH
call compiled the plan. It "randomly" gets slow after a restart or a
statistics update, because a different caller warmed the cache.`}
      </CodeBlock>

      <CodeBlock language="sql" title="The options, cheapest first">
{`-- 1. recompile just this statement (per-call cost, best plan every time)
SELECT ... FROM orders WHERE country = @country OPTION (RECOMPILE);

-- 2. compile for a typical value, always
OPTION (OPTIMIZE FOR (@country = 'US'))

-- 3. compile for the average, ignoring the sniffed value
OPTION (OPTIMIZE FOR UNKNOWN)

-- 4. copy the parameter into a local variable
--    (disables sniffing; the estimate becomes the density average)
DECLARE @c VARCHAR(2) = @country;   -- then use @c
--    Widely used, and it is really OPTIMIZE FOR UNKNOWN in disguise.`}
      </CodeBlock>

      <FlowChart
        title="Diagnosing a slow query, in order"
        chart={"graph TD\n  A[\"query is slow\"] --> B[\"look at the ACTUAL plan\"]\n  B --> C{\"estimated vs actual<br/>rows: big gap?\"}\n  C -->|\"yes\"| D[\"stale statistics or<br/>parameter sniffing\"]\n  C -->|\"no\"| E{\"seek or scan?\"}\n  E -->|\"scan on a big table\"| F{\"is the column bare<br/>in the predicate?\"}\n  F -->|\"no\"| G[\"NOT SARGable<br/>rewrite the predicate\"]\n  F -->|\"yes\"| H[\"missing index\"]\n  E -->|\"seek + many<br/>key lookups\"| I[\"add INCLUDE columns\"]\n  style G fill:#3b1a1a,stroke:#f87171\n  style D fill:#3d2f14\n  style I fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="warning" title="Do not blindly apply the missing-index suggestions">
        <p>
          SSMS and <code>sys.dm_db_missing_index_details</code> propose indexes based on individual
          queries in isolation. They ignore write cost, they ignore indexes you already have that
          nearly match, and they frequently suggest wide <code>INCLUDE</code> lists that duplicate a
          large fraction of the table. Every index has to be maintained on every insert, update and
          delete. Treat the suggestions as evidence about which columns are being filtered, not as
          instructions.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A query seeks perfectly when you run it in SSMS but scans when the .NET application runs the identical query. The plan for the app's version shows CONVERT_IMPLICIT on the indexed column. What is happening?"
        options={[
          'The application connects as a different user with different permissions',
          "The driver sends the string parameter as NVARCHAR while the column is VARCHAR, so the engine implicitly converts the column and the seek becomes a scan — set the parameter's SqlDbType explicitly, or make the column NVARCHAR",
          'The application is missing an index hint',
          "The application's transaction isolation level prevents index usage",
        ]}
        correctIndex={1}
        explanation={"CONVERT_IMPLICIT on the column side is the fingerprint of this problem. .NET's SqlClient sends strings as NVARCHAR unless the parameter type is set explicitly, and since NVARCHAR has higher datatype precedence than VARCHAR, the engine converts the COLUMN rather than the parameter. Converting the column means computing an expression per row, which forecloses the seek. It is measurable: on a 20,000-row indexed table, the VARCHAR literal cost 2 logical reads and the NVARCHAR literal cost 57. The fix is to specify SqlDbType.VarChar on the parameter, or to make the column NVARCHAR so the types agree. Note the diagnostic trap here — running the query by hand in SSMS types the literal as VARCHAR and looks fine, so the problem is invisible unless you inspect the plan the application actually gets."}
      />
    </LessonLayout>
  );
}

export default TsqlIndexing;
