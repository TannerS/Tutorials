import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function TsqlJoins() {
  return (
    <LessonLayout
      title="Joins & Set Operations"
      sectionId="tsql"
      lessonIndex={2}
      prev={{ path: '/tsql/core-queries', label: 'Core Queries — SELECT, TOP, Paging, NULLs' }}
      next={{ path: '/tsql/aggregation', label: 'Aggregation & Window Functions' }}
    >
      <p>
        Joins in T-SQL are standard SQL. Two things earn a dedicated lesson: the{' '}
        <code>APPLY</code> operator, which is the T-SQL answer to a correlated join, and the legacy
        join syntax you will meet in any codebase older than a decade. Examples run against{' '}
        <strong>WideWorldImportersDW</strong>.
      </p>

      <h2>The Standard Joins</h2>

      <CodeBlock language="sql" title="Nothing surprising here">
{`SELECT
     [c].[Sales Territory]
    ,[c].[City]
    ,[s].[Total Excluding Tax]
FROM [Fact].[Sale] AS [s]
INNER JOIN [Dimension].[City] AS [c]
        ON [c].[City Key] = [s].[City Key]
LEFT  JOIN [Dimension].[Customer] AS [cu]
        ON [cu].[Customer Key] = [s].[Customer Key]
WHERE [c].[Sales Territory] = N'Mideast';

-- INNER / OUTER are optional keywords: LEFT JOIN == LEFT OUTER JOIN.
-- FULL OUTER JOIN and CROSS JOIN exist and behave as expected.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never use the old comma-join syntax for outer joins">
        <p>
          You will find <code>*=</code> and <code>=*</code> in old T-SQL. They are the pre-1992 outer
          join operators, they are <strong>removed</strong> from modern compatibility levels, and
          their semantics were ambiguous even when they worked — a <code>WHERE</code> predicate could
          silently turn the outer join into an inner one.
        </p>
        <CodeBlock language="sql" title="Old vs modern">
{`-- LEGACY, do not write, replace on sight:
SELECT * FROM [Fact].[Sale] [s], [Dimension].[City] [c]
WHERE [s].[City Key] *= [c].[City Key];

-- MODERN:
SELECT *
FROM [Fact].[Sale] AS [s]
LEFT JOIN [Dimension].[City] AS [c]
       ON [c].[City Key] = [s].[City Key];`}
        </CodeBlock>
        <p style={{ marginTop: '0.5rem' }}>
          Comma-joins for <em>inner</em> joins still work and are merely bad style. The outer
          variants are the dangerous ones.
        </p>
      </InfoBox>

      <h2>⚠️ Join a Slowly-Changing Dimension on the Surrogate Key</h2>

      <p>
        This is the single most costly join mistake in a warehouse.{' '}
        <code>[Dimension].[City]</code> holds one row per <em>version</em> of a city — 116,295 rows
        for 37,941 real cities, as measured in the views lesson. Joining on anything but{' '}
        <code>[City Key]</code> multiplies your facts:
      </p>

      <CodeBlock language="sql" title="Right and wrong">
{`-- CORRECT: [City Key] identifies ONE version. One fact row, one match.
INNER JOIN [Dimension].[City] AS [c]
        ON [c].[City Key] = [s].[City Key]

-- WRONG: matches EVERY historical version of that city.
-- New York has 3 versions, so its facts are counted 3 times.
INNER JOIN [Dimension].[City] AS [c]
        ON [c].[City] = [s].[City Name]

-- If you must join on the natural key, pin it to the current version:
INNER JOIN [Dimension].[City] AS [c]
        ON [c].[WWI City ID] = [s].[WWI City ID]
       AND [c].[Valid To]    = '9999-12-31 23:59:59.9999999'`}
      </CodeBlock>

      <p>
        Nothing errors. The totals are simply too large, by a different factor for each city, which
        is why this survives review and gets caught weeks later by someone reconciling a report.
      </p>

      <h2>APPLY — The One You Actually Need to Learn</h2>

      <p>
        <code>CROSS APPLY</code> runs a subquery <em>once per row</em> of the left side and lets that
        subquery reference the current row. If you know PostgreSQL, it is <code>LATERAL</code>. It is
        the cleanest expression of &quot;top N per group&quot;:
      </p>

      <CodeBlock language="sql" title="Most populous city in each sales territory">
{`SELECT
     [t].[Sales Territory]
    ,[x].[City]
    ,[x].[Latest Recorded Population]
FROM (SELECT DISTINCT [Sales Territory] FROM [Dimension].[City]) AS [t]
CROSS APPLY
(
    SELECT TOP (1)
         [c].[City]
        ,[c].[Latest Recorded Population]
    FROM [Dimension].[City] AS [c]
    WHERE [c].[Sales Territory] = [t].[Sales Territory]    -- the outer row
    ORDER BY [c].[Latest Recorded Population] DESC
) AS [x];`}
      </CodeBlock>

      <CodeBlock language="text" title="CROSS vs OUTER">
{`CROSS APPLY   drops the left row if the subquery returns nothing
              (behaves like an INNER JOIN)

OUTER APPLY   keeps the left row with NULLs
              (behaves like a LEFT JOIN)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Three jobs only APPLY does well">
        <p>
          <strong>1. Top-N-per-group</strong>, as above.{' '}
          <strong>2. Calling a table-valued function per row</strong>, which a plain{' '}
          <code>JOIN</code> cannot do at all.{' '}
          <strong>3. Naming an intermediate expression</strong> so you can reuse it in the same
          SELECT:
        </p>
        <CodeBlock language="sql" title="APPLY as a 'let' binding">
{`SELECT
     [s].[Sale Key]
    ,[m].[Margin]
    ,[m].[Margin] * 100 AS [Margin Percent]
FROM [Fact].[Sale] AS [s]
CROSS APPLY
(
    SELECT CASE WHEN [s].[Total Excluding Tax] = 0 THEN 0
                ELSE [s].[Profit] / [s].[Total Excluding Tax] END AS [Margin]
) AS [m];
-- without APPLY you would repeat that CASE in every column`}
        </CodeBlock>
      </InfoBox>

      <h2>Semi-Joins: EXISTS and IN</h2>

      <p>
        A <strong>semi-join</strong> answers &quot;does a match exist?&quot; instead of &quot;give me
        the matching columns.&quot; The difference from a regular join is row count: a regular{' '}
        <code>JOIN</code> returns the outer row <em>once per matching inner row</em> — three matches on
        the inner side means three output rows. A semi-join returns each outer row{' '}
        <strong>at most once</strong>, no matter how many inner-side rows match. <code>EXISTS</code> and{' '}
        <code>IN</code> are both semi-joins: they test for a match and stop, they never multiply rows.
      </p>

      <CodeBlock language="sql" title="Three ways to ask 'does a match exist?'">
{`-- EXISTS: the clearest, and NULL-safe
SELECT [c].[City]
FROM   [Dimension].[City] AS [c]
WHERE  EXISTS (SELECT 1 FROM [Fact].[Sale] AS [s]
               WHERE [s].[City Key] = [c].[City Key]);

-- IN: equivalent for a non-nullable column
SELECT [City] FROM [Dimension].[City]
WHERE [City Key] IN (SELECT [City Key] FROM [Fact].[Sale]);

-- JOIN + DISTINCT: works, but DISTINCT is doing damage control
SELECT DISTINCT [c].[City]
FROM [Dimension].[City] AS [c]
INNER JOIN [Fact].[Sale] AS [s] ON [s].[City Key] = [c].[City Key];`}
      </CodeBlock>

      <InfoBox variant="danger" title="NOT IN with a nullable column returns nothing">
        <p>
          If the subquery of a <code>NOT IN</code> yields even one NULL, the predicate evaluates to
          UNKNOWN for every row and the query returns <strong>zero rows</strong>. Nothing errors — it
          worked yesterday and returns nothing today.
        </p>
        <CodeBlock language="sql" title="Use NOT EXISTS instead">
{`-- BROKEN if [City Key] is nullable and contains any NULL:
SELECT [City] FROM [Dimension].[City]
WHERE [City Key] NOT IN (SELECT [City Key] FROM [Fact].[Sale]);

-- CORRECT, and unaffected by NULLs:
SELECT [c].[City]
FROM   [Dimension].[City] AS [c]
WHERE  NOT EXISTS (SELECT 1 FROM [Fact].[Sale] AS [s]
                   WHERE [s].[City Key] = [c].[City Key]);`}
        </CodeBlock>
        <p style={{ marginTop: '0.5rem' }}>
          <code>x NOT IN (a, b, NULL)</code> expands to{' '}
          <code>x &lt;&gt; a AND x &lt;&gt; b AND x &lt;&gt; NULL</code>, and that last comparison is
          UNKNOWN — AND-ing anything with UNKNOWN can never be TRUE. The old &quot;EXISTS is faster
          than IN&quot; advice is Oracle-era folklore; the optimiser turns both into the same
          semi-join. Choose <code>NOT EXISTS</code> for <em>correctness</em>, not speed.
        </p>
      </InfoBox>

      <h2>Set Operators</h2>

      <CodeBlock language="text" title="UNION vs UNION ALL is a real performance decision">
{`UNION       combines and REMOVES DUPLICATES  -> requires a sort or hash
UNION ALL   combines, keeps everything        -> just concatenates

INTERSECT   rows in both
EXCEPT      rows in the first but not the second
            (Oracle spells this MINUS; T-SQL does not accept MINUS)

All of them treat NULL as EQUAL to NULL for dedup purposes, which is the
opposite of how = behaves: NULL = NULL is UNKNOWN, but UNION collapses
two NULL rows into one.

Default to UNION ALL. Writing UNION out of habit asks the server to sort
or hash the whole combined result to remove duplicates that frequently
cannot exist.`}
      </CodeBlock>

      <FlowChart
        title="Picking the right construct"
        chart={"graph TD\n  A[\"I need rows from another table\"] --> B{\"do I need its COLUMNS?\"}\n  B -->|\"no, just existence\"| C[\"EXISTS / NOT EXISTS\"]\n  B -->|\"yes\"| D{\"one match, or many?\"}\n  D -->|\"at most one\"| E[\"LEFT JOIN\"]\n  D -->|\"top N per row\"| F[\"CROSS / OUTER APPLY\"]\n  D -->|\"all of them\"| G[\"JOIN\"]\n  A --> H{\"stacking result SETS?\"}\n  H -->|\"duplicates impossible\"| I[\"UNION ALL\"]\n  H -->|\"must dedup\"| J[\"UNION\"]\n  style C fill:#1a3329,stroke:#4ade80\n  style F fill:#1a3329,stroke:#4ade80\n  style I fill:#1a3329,stroke:#4ade80\n  style J fill:#3d2f14"}
      />
    </LessonLayout>
  );
}

export default TsqlJoins;
