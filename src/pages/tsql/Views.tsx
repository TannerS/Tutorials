import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function TsqlViews() {
  return (
    <LessonLayout
      title="Views, Reusable SQL & Numbers Tables"
      sectionId="tsql"
      lessonIndex={5}
      prev={{ path: '/tsql/modifying-data', label: 'Modifying Data — OUTPUT, MERGE, Upserts' }}
      next={{ path: '/tsql/programmability', label: 'Stored Procedures, Functions & Error Handling' }}
    >
      <p>
        A view is a stored <code>SELECT</code> that behaves like a table. It stores no data — the
        query runs every time you reference it. Everything on this page was executed against a
        restored copy of <strong>WideWorldImportersDW</strong> on SQL Server 2019.
      </p>

      <h2>The Shape</h2>

      <CodeBlock language="sql" title="A view in the standard house style">
{`USE [WideWorldImportersDW];
GO

CREATE OR ALTER VIEW [dbo].[VW_City] AS
SELECT
     [City Key]
    ,[City]
    ,[State Province]
    ,[Country]
    ,[Continent]
    ,[Sales Territory]
    ,[Region]
    ,[Subregion]
    ,[Latest Recorded Population]
FROM [Dimension].[City];`}
      </CodeBlock>

      <CodeBlock language="text" title="Conventions in that script, and why each one is there">
{`USE [db]; GO      sets the database context. GO is NOT T-SQL - it is a
                  BATCH SEPARATOR understood by SSMS and sqlcmd, not by
                  the server. CREATE VIEW must be the first statement in
                  its batch, so the GO after USE is REQUIRED, not style.

[Brackets]        delimit identifiers. MANDATORY here, because the column
                  names contain SPACES: [City Key], [State Province].
                  Without brackets the parser sees two identifiers.

Leading commas    ,[City] at the START of each line. Adding or removing a
                  column touches one line, and a trailing comma before
                  FROM - the most common SELECT-list typo - becomes hard
                  to write by accident.

[Schema].[Object] always qualify. Unqualified names resolve against the
                  caller's default schema, so the same view can mean
                  different things for different users.

CREATE OR ALTER   2016 SP1+. Before that you needed the
                  IF OBJECT_ID(...) IS NOT NULL DROP ... GO CREATE ...
                  dance, which loses permissions on the object.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — SELECT from the view">
{`SELECT TOP (4) [City], [State Province], [Sales Territory],
               [Latest Recorded Population]
FROM   [dbo].[VW_City]
WHERE  [Latest Recorded Population] > 0
ORDER  BY [Latest Recorded Population] DESC;

City        | State Province | Sales Territory | Latest Recorded Population
------------|----------------|-----------------|---------------------------
New York    | New York       | Mideast         | 8175133
New York    | New York       | Mideast         | 8175133
New York    | New York       | Mideast         | 8175133
Los Angeles | California     | Far West        | 3792621`}
      </CodeBlock>

      <h2>⚠️ New York Three Times — What the View Hides</h2>

      <p>
        That output is not a mistake in the data. <code>[Dimension].[City]</code> is a{' '}
        <strong>Type 2 slowly-changing dimension</strong>: when an attribute changes, the warehouse
        closes the old row and inserts a new one, so a single real-world city has one row per version
        of its history.
      </p>

      <CodeBlock language="text" title="Real output — the same city, three versions">
{`SELECT [City Key], [WWI City ID], [City], [Valid From], [Valid To]
FROM   [Dimension].[City]
WHERE  [City] = 'New York' AND [State Province] = 'New York';

City Key | WWI City ID | City     | Valid From          | Valid To
---------|-------------|----------|---------------------|---------------------------
34212    | 24161       | New York | 2013-01-01 00:00:00 | 2013-01-01 00:02:00
53531    | 24161       | New York | 2013-01-01 00:02:00 | 2013-07-01 16:00:00
78403    | 24161       | New York | 2013-07-01 16:00:00 | 9999-12-31 23:59:59.9999999
                                                          ^^^^ the OPEN row = current`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the scale of it">
{`SELECT COUNT(*) AS all_rows, COUNT(DISTINCT [WWI City ID]) AS distinct_cities
FROM   [Dimension].[City];

all_rows | distinct_cities
---------|----------------
116295   | 37941`}
      </CodeBlock>

      <InfoBox variant="danger" title="The view omits [Valid From] and [Valid To] — so consumers cannot tell">
        <p>
          <code>VW_City</code> selects nine columns and neither validity column is among them. Anyone
          querying the view sees 116,295 rows representing 37,941 cities, with no way to know that
          duplicates are versions rather than data errors. A{' '}
          <code>COUNT(*)</code> over it is wrong. A join from a fact table on{' '}
          <code>[City]</code> rather than <code>[City Key]</code>{' '}
          <strong>multiplies every fact row by the number of versions</strong> — inflating sums
          silently, and by a different factor per city.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          This is the single most valuable thing to know about a Type 2 dimension: joins must use
          the surrogate key (<code>[City Key]</code>), which identifies one <em>version</em>, and
          never the natural key or the name.
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="Two safer views — say which one you mean">
{`-- CURRENT rows only: one row per city, safe to count and to look up by name
CREATE OR ALTER VIEW [dbo].[VW_City_Current] AS
SELECT
     [City Key]
    ,[WWI City ID]
    ,[City]
    ,[State Province]
    ,[Sales Territory]
    ,[Latest Recorded Population]
FROM [Dimension].[City]
WHERE [Valid To] = '9999-12-31 23:59:59.9999999';

-- FULL history, but with the validity columns EXPOSED so nobody is misled
CREATE OR ALTER VIEW [dbo].[VW_City_History] AS
SELECT
     [City Key]
    ,[WWI City ID]
    ,[City]
    ,[Sales Territory]
    ,[Valid From]
    ,[Valid To]
FROM [Dimension].[City];`}
      </CodeBlock>

      <h2>What Views Do and Do Not Do</h2>

      <CodeBlock language="text" title="The honest summary">
{`A view DOES:
  - name a query so it is written once and read everywhere
  - hide schema detail and restrict columns (a security boundary)
  - present a stable interface while the tables underneath change

A view DOES NOT:
  - store any data. The query runs on every reference.
  - make anything faster on its own. A view over a slow query is a
    slow query with a shorter name.
  - accept parameters. If you need an argument, you want an INLINE
    TABLE-VALUED FUNCTION - see the next lesson. It is "a view with
    parameters" and it optimises the same way.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Nested views are the classic warehouse performance trap">
        <p>
          A view built on a view built on a view is expanded by the optimiser into one enormous
          query. Each layer looks reasonable in isolation, and the combined statement can join thirty
          tables to return three columns — because layer two needed one column from a table that
          layer four also joins. The plan is unreadable and the optimiser starts making bad
          estimates.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Check what a view really touches before trusting it:
        </p>
        <CodeBlock language="sql" title="What does this view actually depend on?">
{`SELECT DISTINCT
     [referenced_schema_name]
    ,[referenced_entity_name]
FROM sys.dm_sql_referenced_entities('dbo.VW_City', 'OBJECT');

-- and the definition of any view, function or procedure:
SELECT [definition] FROM sys.sql_modules
WHERE [object_id] = OBJECT_ID('dbo.VW_City');`}
        </CodeBlock>
      </InfoBox>

      <h2>SCHEMABINDING and Indexed Views</h2>

      <CodeBlock language="sql" title="The one case where a view DOES store data">
{`CREATE OR ALTER VIEW [dbo].[VW_SalesByTerritory]
WITH SCHEMABINDING              -- required for an indexed view
AS
SELECT
     [c].[Sales Territory]
    ,COUNT_BIG(*)        AS [Sale Count]      -- COUNT_BIG, not COUNT
    ,SUM([s].[Profit])   AS [Total Profit]
FROM [Fact].[Sale] AS [s]
INNER JOIN [Dimension].[City] AS [c]
        ON [c].[City Key] = [s].[City Key]
GROUP BY [c].[Sales Territory];
GO

-- THIS is what materialises it:
CREATE UNIQUE CLUSTERED INDEX [IX_VW_SalesByTerritory]
    ON [dbo].[VW_SalesByTerritory]([Sales Territory]);`}
      </CodeBlock>

      <CodeBlock language="text" title="The rules, and the cost">
{`SCHEMABINDING means the view is LOCKED to the tables underneath: you
cannot ALTER or DROP a referenced column without dropping the view
first. That is the point - the index would otherwise go stale.

Requirements are strict: two-part names ([Schema].[Object]) everywhere,
no SELECT *, COUNT_BIG(*) instead of COUNT(*), no outer joins, no
subqueries, deterministic expressions only.

THE COST: an indexed view is maintained SYNCHRONOUSLY. Every INSERT,
UPDATE and DELETE on Fact.Sale now also updates this aggregate, inside
the same transaction. You are trading write throughput for read speed.
In a warehouse loaded overnight that is usually a good trade. In an
OLTP hot path it usually is not.`}
      </CodeBlock>

      <h2>Numbers (Tally) Tables</h2>

      <p>
        A numbers table is a single column holding 1, 2, 3, … N. It sounds trivial and it replaces
        whole categories of loop. The standard way to build one uses cascading CTEs that{' '}
        <strong>square the row count at each level</strong>:
      </p>

      <CodeBlock language="sql" title="The cascading-CTE numbers table">
{`CREATE TABLE [dbo].[Numbers]
(
     [Num] INT NOT NULL
    ,CONSTRAINT [PK_Numbers] PRIMARY KEY CLUSTERED([Num])
);
GO

-- 262,144 rows
;WITH N1([C]) AS (SELECT 0 UNION ALL SELECT 0)
,N2([C]) AS (SELECT 0 FROM N1 AS [T1] CROSS JOIN N1 AS [T2])
,N3([C]) AS (SELECT 0 FROM N2 AS [T1] CROSS JOIN N2 AS [T2])
,N4([C]) AS (SELECT 0 FROM N3 AS [T1] CROSS JOIN N3 AS [T2])
,N6([C]) AS (SELECT 0 FROM N4 AS [T1] CROSS JOIN N4 AS [T2]
                                      CROSS JOIN N2 AS [T3])
,Nums([Num]) AS (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) FROM N6)
INSERT INTO [dbo].[Numbers]([Num])
SELECT [Num] FROM Nums;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — counted at every level">
{`N1 = SELECT 0 UNION ALL SELECT 0        2 rows
N2 = N1 x N1                            4
N3 = N2 x N2                           16
N4 = N3 x N3                          256
N6 = N4 x N4 x N2  (256 x 256 x 4)    262,144

SELECT COUNT(*), MIN([Num]), MAX([Num]) FROM [dbo].[Numbers];
  262144 | 1 | 262144`}
      </CodeBlock>

      <CodeBlock language="text" title="The pieces of syntax, one at a time">
{`;WITH             the LEADING SEMICOLON is defensive. WITH must be the
                  first statement in a batch, so if the previous
                  statement was not terminated you get a syntax error.
                  The ; terminates whatever came before. It is a
                  workaround for not ending statements with semicolons.

N1([C])           names the CTE's output column [C] in the header rather
                  than aliasing inside the SELECT.

SELECT 0          the VALUE is irrelevant. Only the ROW COUNT matters.

CROSS JOIN        no ON clause: every row against every row. Joining a
                  CTE to ITSELF squares its row count, which is why four
                  short definitions reach a quarter of a million rows.

ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
                  "number these rows, I do not care about order."
                  (SELECT NULL) is a constant, so the optimiser knows
                  there is no meaningful ordering and skips the SORT.
                  Ordering by a real column here would cost a sort of
                  262,144 rows for nothing.

PRIMARY KEY CLUSTERED([Num])
                  stores the table physically in Num order, so
                  WHERE [Num] BETWEEN 1 AND 1000 is a range SEEK.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Watch for a dead CTE in copies of this script">
        <p>
          Versions of this idiom circulate with an <code>N5</code> defined as{' '}
          <code>N4 CROSS JOIN N4</code> that is then <strong>never referenced</strong> — the final
          level is built from <code>N4</code>, <code>N4</code> and <code>N2</code>. Deleting{' '}
          <code>N5</code> entirely produces the identical 262,144 rows, verified. An unreferenced CTE
          is never executed so it costs nothing at runtime, but it misleads the next person reading
          the script into thinking there are six levels of doubling when there are five.
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="What you actually use it for">
{`-- 1. A GAPLESS DATE SERIES - the classic reporting need. Without this
--    a day with no sales is simply missing from your report.
SELECT DATEADD(DAY, [n].[Num] - 1, '2026-01-01') AS [Date]
FROM   [dbo].[Numbers] AS [n]
WHERE  [n].[Num] <= DATEDIFF(DAY, '2026-01-01', '2026-12-31') + 1;

-- 2. GAP FILLING: every territory x every month, even the empty ones
SELECT [t].[Sales Territory], [d].[Date], ISNULL([s].[Total], 0) AS [Total]
FROM   @Territories AS [t]
CROSS JOIN @Dates    AS [d]
LEFT  JOIN @Sales    AS [s]
       ON [s].[Sales Territory] = [t].[Sales Territory]
      AND [s].[Date]            = [d].[Date];

-- 3. EXPANDING A RANGE into one row per unit
SELECT [o].[OrderId], [n].[Num] AS [UnitNumber]
FROM   [dbo].[Orders] AS [o]
INNER JOIN [dbo].[Numbers] AS [n]
        ON [n].[Num] <= [o].[Quantity];

-- 4. SPLITTING A DELIMITED STRING (before STRING_SPLIT, 2016+)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why this beats a WHILE loop">
        <p>
          Every one of those could be written as a <code>WHILE</code> loop that inserts one row per
          iteration. The loop performs N separate statements with N transactions&apos; worth of
          overhead; the numbers table turns the same work into <em>one</em> set-based statement the
          optimiser can parallelise. It is the clearest example in T-SQL of replacing procedural
          thinking with set-based thinking, which is the shift that makes the biggest difference to
          performance on this engine.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Build it once as a permanent table with a clustered primary key. Regenerating it inside
          every query with CTEs works, but a real table with an index is faster and reads better.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default TsqlViews;
