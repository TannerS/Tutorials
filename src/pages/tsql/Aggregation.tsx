import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function TsqlAggregation() {
  return (
    <LessonLayout
      title="Aggregation & Window Functions"
      sectionId="tsql"
      lessonIndex={3}
      prev={{ path: '/tsql/joins', label: 'Joins & Set Operations' }}
      next={{ path: '/tsql/modifying-data', label: 'Modifying Data — OUTPUT, MERGE, Upserts' }}
    >
      <p>
        Aggregation is standard; window functions are where the leverage is. This lesson covers both,
        plus the two T-SQL traps: how aggregates treat NULL, and the frame clause that silently
        changes what your running total means. Examples run against{' '}
        <strong>WideWorldImportersDW</strong>.
      </p>

      <h2>Aggregates and NULL</h2>

      <CodeBlock language="text" title="The rule that explains most 'wrong total' bugs">
{`COUNT(*)             counts ROWS            — including all-NULL rows
COUNT([col])         counts NON-NULL values — silently skips NULLs
COUNT(DISTINCT [col])  non-null distinct values

SUM / AVG / MIN / MAX all IGNORE NULLs.

*** AVG IS THE DANGEROUS ONE ***
AVG over (100, NULL, 80) = 90, not 60. The NULL row is not treated as
zero — it is excluded from BOTH the sum and the count. If you want NULL
to count as zero, say so:  AVG(ISNULL([Annual Salary], 0))

SUM over zero rows returns NULL, not 0. Wrap it:
    ISNULL(SUM([Profit]), 0)`}
      </CodeBlock>

      <h2>GROUP BY, HAVING, and the Order of Operations</h2>

      <CodeBlock language="sql" title="WHERE filters rows; HAVING filters groups">
{`SELECT
     [c].[Sales Territory]
    ,COUNT(*)                              AS [Sale Count]
    ,CAST(SUM([s].[Profit]) AS DECIMAL(18,2)) AS [Total Profit]
FROM [Fact].[Sale] AS [s]
INNER JOIN [Dimension].[City] AS [c]
        ON [c].[City Key] = [s].[City Key]
WHERE [s].[Profit] IS NOT NULL            -- before grouping, per row
GROUP BY [c].[Sales Territory]
HAVING COUNT(*) > 1000                    -- after grouping, per group
ORDER BY [Total Profit] DESC;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — top 5 territories by profit">
{`Sales Territory | Sale Count | Total Profit
----------------|------------|-------------
Southeast       | 50520      | 18994984.65
Mideast         | 33763      | 12843350.00
Southwest       | 31756      | 11922901.75
Plains          | 31039      | 11596968.65
Great Lakes     | 26599      | 10046782.10`}
      </CodeBlock>

      <CodeBlock language="text" title="Logical processing order — why you cannot use an alias in WHERE">
{`FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY

SELECT is evaluated almost LAST, so an alias defined there does not yet
exist in WHERE, GROUP BY or HAVING:

    SELECT [Profit] * 12 AS [Annual] FROM [Fact].[Sale]
    WHERE [Annual] > 1000;
    -- Msg 207: Invalid column name 'Annual'

ORDER BY is the exception — it runs after SELECT, so aliases DO work
there. That asymmetry is not a quirk to memorise; it falls straight out
of the processing order.`}
      </CodeBlock>

      <h2>Window Functions</h2>

      <p>
        A window function computes across a set of rows <em>without collapsing them</em>.{' '}
        <code>GROUP BY</code> gives one row per group; <code>OVER()</code> keeps every row and
        attaches the group-level answer to each.
      </p>

      <CodeBlock language="sql" title="The three families">
{`-- RANKING
ROW_NUMBER() OVER (PARTITION BY [Sales Territory] ORDER BY [Profit] DESC)
RANK()       OVER (...)   -- 1,2,2,4  (gaps)
DENSE_RANK() OVER (...)   -- 1,2,2,3  (no gaps)
NTILE(4)     OVER (ORDER BY [Profit])

-- AGGREGATE, applied as a window
SUM([Profit])   OVER (PARTITION BY [Sales Territory])   -- total on every row
AVG([Profit])   OVER (PARTITION BY [Sales Territory])
COUNT(*)        OVER ()                                 -- grand total

-- OFFSET / positional
LAG([Profit], 1)  OVER (ORDER BY [Invoice Date Key])
LEAD([Profit], 1) OVER (ORDER BY [Invoice Date Key])
FIRST_VALUE([Profit]) OVER (PARTITION BY [Sales Territory]
                            ORDER BY [Profit] DESC)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Deduplication is the killer app for ROW_NUMBER">
        <p>
          Keep one row per key, delete the rest, with full control over which one survives:
        </p>
        <CodeBlock language="sql" title="Delete duplicates, keeping the newest">
{`WITH [Ranked] AS
(
    SELECT
         [City Key]
        ,ROW_NUMBER() OVER (PARTITION BY [WWI City ID]
                            ORDER BY [Valid From] DESC) AS [rn]
    FROM [Dimension].[City]
)
DELETE FROM [Ranked] WHERE [rn] > 1;
-- yes, you can DELETE from a CTE in T-SQL; it deletes from the base table`}
        </CodeBlock>
      </InfoBox>

      <h2>The Frame Clause — Where Running Totals Go Wrong</h2>

      <p>
        When a window function has an <code>ORDER BY</code> inside <code>OVER()</code>, a{' '}
        <strong>frame</strong> applies. The default is not what most people assume, and it produces a
        subtly wrong running total whenever there are ties.
      </p>

      <CodeBlock language="text" title="The default when you write ORDER BY inside OVER()">
{`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW

"CURRENT ROW" under RANGE means every row with the SAME ORDER BY VALUE,
not the current physical row. So with tied values, all tied rows get the
SAME running total — the total INCLUDING all of their peers.

What you almost always want:

ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW

Under ROWS, "current row" means the current PHYSICAL row, so each tied
row gets its own incremental total.`}
      </CodeBlock>

      <CodeBlock language="sql" title="Say ROWS explicitly">
{`SELECT
     [s].[Sale Key]
    ,[s].[Profit]
    ,SUM([s].[Profit]) OVER (ORDER BY [s].[Sale Key]
                             ROWS BETWEEN UNBOUNDED PRECEDING
                                      AND CURRENT ROW) AS [Running Total]
FROM [Fact].[Sale] AS [s];`}
      </CodeBlock>

      <InfoBox variant="warning" title="RANGE is also slower">
        <p>
          Beyond correctness, <code>RANGE</code> frames often force a less efficient plan than{' '}
          <code>ROWS</code>, because the engine must look ahead for peer rows rather than
          accumulating as it goes. Writing <code>ROWS</code> explicitly is both more correct for
          running totals and generally faster. A running total that is right except on tied values is
          genuinely hard to spot in testing, because test data rarely has ties.
        </p>
      </InfoBox>

      <h2>Grouping Extensions</h2>

      <CodeBlock language="sql" title="Subtotals without UNION ALL">
{`-- subtotal per territory, plus a grand total row
SELECT
     [c].[Sales Territory]
    ,SUM([s].[Profit]) AS [Total Profit]
FROM [Fact].[Sale] AS [s]
INNER JOIN [Dimension].[City] AS [c]
        ON [c].[City Key] = [s].[City Key]
GROUP BY ROLLUP([c].[Sales Territory]);

-- every combination of the grouping columns
GROUP BY CUBE([c].[Sales Territory], [c].[Country]);

-- exactly the combinations you name
GROUP BY GROUPING SETS (([c].[Sales Territory]), ([c].[Country]), ());

-- tell a real NULL apart from a "this is a subtotal row" NULL:
SELECT
     [c].[Sales Territory]
    ,GROUPING([c].[Sales Territory]) AS [Is Subtotal]
    ,SUM([s].[Profit])               AS [Total Profit]
FROM ...
GROUP BY ROLLUP([c].[Sales Territory]);
-- GROUPING() returns 1 on the aggregated rows`}
      </CodeBlock>

      <h2>Version Notes</h2>

      <CodeBlock language="text" title="What is available when">
{`window functions with PARTITION BY        2005+
ROWS/RANGE frame clause, LAG/LEAD          2012+
OFFSET/FETCH                               2012+
STRING_AGG (with WITHIN GROUP ordering)    2017+
APPROX_COUNT_DISTINCT                      2019+
                                           (HyperLogLog, ~2% error —
                                           for dashboards, not billing)
GREATEST / LEAST                           2022+  (NOT on 2019)

Before STRING_AGG, aggregate string concatenation was the FOR XML PATH
trick — see the core-queries lesson for why to replace it.`}
      </CodeBlock>
    </LessonLayout>
  );
}

export default TsqlAggregation;
