import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
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
        plus the two T-SQL-specific traps: how aggregates treat NULL, and the frame clause that
        silently changes what your running total means.
      </p>

      <h2>Aggregates and NULL</h2>

      <CodeBlock language="text" title="The rule that explains most 'wrong total' bugs">
{`COUNT(*)        counts ROWS            — includes rows where everything is NULL
COUNT(col)      counts NON-NULL values — silently skips NULLs
COUNT(DISTINCT col)  non-null distinct values

SUM / AVG / MIN / MAX all IGNORE NULLs.

*** AVG IS THE DANGEROUS ONE ***
AVG(salary) over (100, NULL, 80) = 90, not 60.
The NULL row is not treated as zero — it is excluded from BOTH the sum
and the count. If you want NULL to count as zero, say so:
    AVG(ISNULL(salary, 0))

SUM over zero rows returns NULL, not 0. Wrap it:
    ISNULL(SUM(x), 0)`}
      </CodeBlock>

      <h2>GROUP BY, HAVING, and the Order of Operations</h2>

      <CodeBlock language="sql" title="WHERE filters rows; HAVING filters groups">
{`SELECT   dept, COUNT(*) AS headcount, AVG(salary) AS avg_salary
FROM     emp
WHERE    salary IS NOT NULL        -- before grouping, per row
GROUP BY dept
HAVING   COUNT(*) > 2              -- after grouping, per group
ORDER BY avg_salary DESC;`}
      </CodeBlock>

      <CodeBlock language="text" title="Logical processing order — why you cannot use an alias in WHERE">
{`FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY

SELECT is evaluated almost LAST, so a column alias defined there does
not exist yet in WHERE, GROUP BY or HAVING:

    SELECT salary * 12 AS annual FROM emp WHERE annual > 1000;
    -- Msg 207: Invalid column name 'annual'

ORDER BY is the exception — it runs after SELECT, so aliases DO work
there. That asymmetry is not a quirk to memorise; it falls directly
out of the processing order.`}
      </CodeBlock>

      <h2>Window Functions</h2>

      <p>
        A window function computes across a set of rows <em>without collapsing them</em>. That is the
        whole idea: <code>GROUP BY</code> gives you one row per group, <code>OVER()</code> keeps every
        row and attaches the group-level answer to each one.
      </p>

      <CodeBlock language="sql" title="The three families">
{`-- RANKING
ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)  -- 1,2,3,4 always
RANK()       OVER (PARTITION BY dept ORDER BY salary DESC)  -- 1,2,2,4  (gaps)
DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC)  -- 1,2,2,3  (no gaps)
NTILE(4)     OVER (ORDER BY salary)                          -- quartiles

-- AGGREGATE, applied as a window
SUM(salary)   OVER (PARTITION BY dept)              -- dept total on every row
AVG(salary)   OVER (PARTITION BY dept)
COUNT(*)      OVER ()                               -- grand total row count

-- OFFSET / positional
LAG(salary, 1)  OVER (ORDER BY hired)   -- previous row's value
LEAD(salary, 1) OVER (ORDER BY hired)   -- next row's value
FIRST_VALUE(salary) OVER (PARTITION BY dept ORDER BY salary DESC)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Deduplication is the killer app for ROW_NUMBER">
        <p>
          The single most useful window pattern in day-to-day work — keep one row per key, delete the
          rest, with full control over which one survives:
        </p>
        <CodeBlock language="sql" title="Delete duplicates, keeping the newest">
{`WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created DESC) AS rn
  FROM   users
)
DELETE FROM ranked WHERE rn > 1;
-- yes, you can DELETE from a CTE in T-SQL; it deletes from the base table`}
        </CodeBlock>
      </InfoBox>

      <h2>The Frame Clause — Where Running Totals Go Wrong</h2>

      <p>
        When a window function has an <code>ORDER BY</code> inside <code>OVER()</code>, a{' '}
        <strong>frame</strong> applies. The default frame is not what most people assume, and it
        produces a subtly wrong running total whenever there are ties.
      </p>

      <CodeBlock language="text" title="The default when you write ORDER BY inside OVER()">
{`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW

"CURRENT ROW" under RANGE means every row with the SAME ORDER BY VALUE,
not the current physical row. So with tied values, all tied rows get the
SAME running total — the total INCLUDING all of their peers.

What you almost always want:

ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW

Under ROWS, "current row" means the current physical row, so each tied
row gets its own incremental total.`}
      </CodeBlock>

      <CodeBlock language="sql" title="Say ROWS explicitly">
{`SELECT name, salary,
       SUM(salary) OVER (ORDER BY salary
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                        ) AS running_total
FROM emp;`}
      </CodeBlock>

      <InfoBox variant="warning" title="RANGE is also slower">
        <p>
          Beyond correctness, <code>RANGE</code> frames often force a less efficient plan than{' '}
          <code>ROWS</code>, because the engine has to look ahead for peer rows rather than
          accumulating as it goes. Writing <code>ROWS</code> explicitly is both more correct for
          running totals and generally faster. Getting a running total that is right except on tied
          values is a genuinely hard bug to spot in testing, because test data rarely has ties.
        </p>
      </InfoBox>

      <h2>Grouping Extensions</h2>

      <CodeBlock language="sql" title="Subtotals without UNION ALL">
{`-- subtotal per dept, plus a grand total row
SELECT dept, SUM(salary) AS total
FROM   emp
GROUP  BY ROLLUP(dept);

-- every combination of the grouping columns
GROUP BY CUBE(dept, title);

-- exactly the combinations you name
GROUP BY GROUPING SETS ((dept), (title), ());

-- tell a real NULL apart from a "this is a subtotal row" NULL:
SELECT dept, GROUPING(dept) AS is_subtotal, SUM(salary) AS total
FROM   emp GROUP BY ROLLUP(dept);
-- GROUPING() returns 1 for the aggregated (subtotal) rows`}
      </CodeBlock>

      <h2>Version Notes</h2>

      <CodeBlock language="text" title="What is available when">
{`window functions with PARTITION BY        2005+
ROWS/RANGE frame clause, LAG/LEAD          2012+
OFFSET/FETCH                               2012+
STRING_AGG (with WITHIN GROUP ordering)    2017+
APPROX_COUNT_DISTINCT                      2019+
                                           (HyperLogLog, ~2% error,
                                           for dashboards not billing)
GREATEST / LEAST                           2022+  (NOT on 2019)

Before STRING_AGG, aggregate string concatenation was the FOR XML PATH
trick — see the core-queries lesson for why to replace it.`}
      </CodeBlock>

      <InteractiveChallenge
        question="A running total over a column with duplicate values gives every tied row the same total, jumping past the intermediate values. The OVER clause reads OVER (ORDER BY amount). What fixes it?"
        options={[
          'Add PARTITION BY to the OVER clause',
          "Add an explicit frame: ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW — the default is RANGE, whose CURRENT ROW means 'all rows with this same value'",
          'Switch from SUM to a correlated subquery',
          'Add DISTINCT to the outer SELECT',
        ]}
        correctIndex={1}
        explanation={"Writing ORDER BY inside OVER() without a frame clause silently applies RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. Under RANGE, 'current row' is defined by VALUE rather than position, so all rows sharing the same amount are peers and every one of them receives the total that includes the whole peer group. Specifying ROWS instead makes 'current row' positional, so each row accumulates individually. This is worth building into your habits: always write the frame explicitly for running totals, because the bug is invisible in test data without ties and appears the moment real data has them."}
      />
    </LessonLayout>
  );
}

export default TsqlAggregation;
