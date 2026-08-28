import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function TsqlCoreQueries() {
  return (
    <LessonLayout
      title="Core Queries — SELECT, TOP, Paging, NULLs"
      sectionId="tsql"
      lessonIndex={1}
      prev={{ path: '/tsql/intro', label: 'T-SQL & Which Server You Are On' }}
      next={{ path: '/tsql/joins', label: 'Joins & Set Operations' }}
    >
      <p>
        The <code>SELECT</code> core is standard SQL. This lesson is about the places where T-SQL
        differs from what you would write elsewhere. Every example ran against{' '}
        <strong>WideWorldImportersDW</strong> on SQL Server 2019.
      </p>

      <h2>House Style</h2>

      <CodeBlock language="sql" title="The conventions used throughout this section">
{`USE [WideWorldImportersDW];
GO

SELECT
     [c].[City Key]
    ,[c].[City]
    ,[c].[State Province]
    ,[c].[Latest Recorded Population]
FROM [Dimension].[City] AS [c]
WHERE [c].[Sales Territory] = N'Mideast';`}
      </CodeBlock>

      <CodeBlock language="text" title="Why each convention is there">
{`[Brackets]        delimit identifiers. MANDATORY when a name contains a
                  SPACE - and warehouse columns routinely do:
                  [City Key], [State Province], [Total Excluding Tax].

Leading commas    the comma starts the line. Adding or removing a column
                  touches ONE line, and the most common SELECT-list typo
                  - a trailing comma before FROM - becomes hard to write.

[Schema].[Object] always qualify. An unqualified name resolves against
                  the caller's default schema, so the same query can mean
                  different things for different users. It also lets the
                  engine reuse a cached plan.

N'literal'        the N prefix makes a string NVARCHAR (Unicode). Without
                  it the literal is VARCHAR. See the indexing lesson for
                  why that distinction can cost you an index seek.

USE [db]; GO      GO is not T-SQL. It is a BATCH SEPARATOR understood by
                  SSMS and sqlcmd, not by the server.`}
      </CodeBlock>

      <h2>TOP — SQL Server&apos;s LIMIT</h2>

      <CodeBlock language="sql" title="TOP goes at the front, not the end">
{`SELECT TOP (5)
     [c].[City]
    ,[c].[State Province]
    ,[c].[Latest Recorded Population]
FROM [Dimension].[City] AS [c]
WHERE [c].[Valid To] = '9999-12-31 23:59:59.9999999'
ORDER BY [c].[Latest Recorded Population] DESC;

-- parentheses are optional for a literal but REQUIRED for a variable
DECLARE @Top INT = 5;
SELECT TOP (@Top) [City] FROM [Dimension].[City] ORDER BY [City Key];

SELECT TOP (10) PERCENT ...        -- a proportion
SELECT TOP (3) WITH TIES ...       -- do not cut arbitrarily through ties`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`City        | State Province | Latest Recorded Population
------------|----------------|---------------------------
New York    | New York       | 8175133
Los Angeles | California     | 3792621
Los Angeles | California     | 3792621
Chicago     | Illinois       | 2695598
Brooklyn    | New York       | 2565635`}
      </CodeBlock>

      <InfoBox variant="warning" title="TOP without ORDER BY returns an arbitrary set">
        <p>
          <code>SELECT TOP (10) ...</code> with no <code>ORDER BY</code> is not &quot;the first ten
          rows&quot; — there is no such thing. It is whichever ten the engine finds cheapest to
          produce, which changes when an index is added, statistics update, or the plan goes
          parallel. Stable enough in testing to look right; unstable enough to break in production.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Los Angeles appearing twice above is not a TOP bug — it is the slowly-changing dimension
          described in the views lesson. The table holds one row per <em>version</em> of a city.
        </p>
      </InfoBox>

      <h2>Paging: OFFSET / FETCH</h2>

      <CodeBlock language="sql" title="The standard-SQL pager, available since 2012">
{`SELECT
     [c].[City Key]
    ,[c].[City]
FROM [Dimension].[City] AS [c]
ORDER BY [c].[City Key]              -- MANDATORY
OFFSET 20 ROWS
FETCH NEXT 10 ROWS ONLY;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same statement without ORDER BY">
{`Msg 102, Level 15, State 1 — Incorrect syntax near 'OFFSET'.
Msg 153, Level 15, State 2 — Invalid usage of the option NEXT in the FETCH statement.`}
      </CodeBlock>

      <p>
        The parser rejects it outright. That is a deliberate improvement over <code>TOP</code>:
        paging without a deterministic order is always a bug, so the syntax refuses to express it.
      </p>

      <InfoBox variant="tip" title="OFFSET gets slower the deeper you page">
        <p>
          <code>OFFSET 100000 ROWS</code> makes the server produce and discard 100,000 rows before
          returning anything. For deep paging use <strong>keyset pagination</strong> — carry the last
          key you saw and filter on it, which stays flat regardless of depth:
        </p>
        <CodeBlock language="sql" title="Keyset paging">
{`SELECT TOP (10)
     [c].[City Key]
    ,[c].[City]
FROM [Dimension].[City] AS [c]
WHERE [c].[City Key] > @LastCityKeySeen
ORDER BY [c].[City Key];`}
        </CodeBlock>
      </InfoBox>

      <h2>NULLs Sort First</h2>

      <CodeBlock language="text" title="Real output — ORDER BY [Annual Salary] ASC">
{`Employee Key | Annual Salary
-------------|--------------
2            | NULL            <- NULL comes FIRST ascending
3            | 80000
1            | 100000
5            | 100000
4            | 120000`}
      </CodeBlock>

      <InfoBox variant="danger" title="This is the opposite of PostgreSQL">
        <p>
          SQL Server treats NULL as lower than every value, so <code>ASC</code> puts NULLs first and{' '}
          <code>DESC</code> puts them last. Postgres does the reverse by default. A query ported
          between the two returns the same rows in a different order, which silently changes what
          &quot;the top row&quot; is.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          T-SQL has <strong>no <code>NULLS LAST</code> clause</strong> — that is Postgres-only syntax
          and will not parse. Sort on a computed flag instead:
        </p>
        <CodeBlock language="sql" title="Emulating NULLS LAST">
{`ORDER BY
     CASE WHEN [e].[Annual Salary] IS NULL THEN 1 ELSE 0 END
    ,[e].[Annual Salary] ASC;`}
        </CodeBlock>
      </InfoBox>

      <h2>ISNULL vs COALESCE — Not Interchangeable</h2>

      <CodeBlock language="text" title="Real output — the same substitution, two functions">
{`SELECT
     ISNULL  (CAST(NULL AS NVARCHAR(2)), N'Not provided') AS [ISNULL Result]
    ,COALESCE(CAST(NULL AS NVARCHAR(2)), N'Not provided') AS [COALESCE Result];

ISNULL Result | COALESCE Result
--------------|----------------
No            | Not provided
^^
truncated to NVARCHAR(2) — no error, no warning`}
      </CodeBlock>

      <p>
        <code>ISNULL</code> forces its result into the data type of the <em>first</em> argument, so a
        replacement value that does not fit is silently cut. <code>COALESCE</code> follows standard
        type-precedence rules and returns the whole string. There are other differences —{' '}
        <code>COALESCE</code> is standard SQL, takes any number of arguments, and expands into a{' '}
        <code>CASE</code> expression (so a subquery argument may be evaluated twice), while{' '}
        <code>ISNULL</code> is a two-argument T-SQL extension evaluated once. Practical rule:{' '}
        <strong>default to <code>COALESCE</code></strong>.
      </p>

      <h2>LEN Lies About Trailing Spaces</h2>

      <CodeBlock language="text" title="Real output">
{`SELECT
     LEN('ab   ')        AS [Len]        -- 2   trailing spaces IGNORED
    ,DATALENGTH('ab   ') AS [DataLen]    -- 5   bytes, spaces counted
    ,LEN(N'ab')          AS [LenN]       -- 2   characters
    ,DATALENGTH(N'ab')   AS [DataLenN];  -- 4   bytes — NVARCHAR is 2/char`}
      </CodeBlock>

      <p>
        <code>LEN</code> excludes trailing spaces, which surprises everyone once. Use{' '}
        <code>DATALENGTH</code> when you care about storage, and note it returns{' '}
        <strong>bytes</strong>, not characters — so an <code>NVARCHAR</code> reports double.
      </p>

      <h2>VARCHAR vs NVARCHAR</h2>

      <CodeBlock language="text" title="A distinction that does not exist in Postgres">
{`VARCHAR(n)    1 byte per char, limited to the collation's code page
NVARCHAR(n)   2 bytes per char, full Unicode
N'literal'    the N prefix makes a literal NVARCHAR
VARCHAR(MAX) / NVARCHAR(MAX)   up to 2GB, stored off-row

Postgres has ONE text type and it is always Unicode. Here the choice is
real, per column, and expensive to change later.

*** THE PERFORMANCE TRAP (conditional - see the indexing lesson) ***
Comparing an NVARCHAR parameter to a VARCHAR column forces an implicit
conversion OF THE COLUMN. Whether that costs you the index seek depends
on the COLLATION:
    SQL_* collation (legacy)   -> seek LOST     2 vs 57 logical reads
    Windows collation          -> seek survives 2 vs  2
Most drivers send strings as NVARCHAR by default, so this happens with
no cast written anywhere. Set SqlDbType explicitly and it never arises.`}
      </CodeBlock>

      <h2>String Functions, With Version Gates</h2>

      <CodeBlock language="sql" title="What you can use depends on your version">
{`-- available across the whole supported line
LEFT / RIGHT / SUBSTRING / REPLACE / UPPER / LOWER / CHARINDEX / STUFF
CONCAT([a], [b], [c])          -- NULL-safe, unlike +
IIF(<cond>, [a], [b])          -- 2012+
FORMAT([x], 'yyyy-MM-dd')      -- flexible but SLOW; avoid on big sets

-- 2016+
STRING_SPLIT(@csv, ',')        -- no ordinal column until 2022

-- 2017+
TRIM([x])                      -- before 2017: LTRIM(RTRIM([x]))
STRING_AGG([x], ',')           -- before 2017: the FOR XML PATH trick
CONCAT_WS('-', [a], [b])

-- 2022+ ONLY — NOT available on 2019
GREATEST / LEAST / GENERATE_SERIES / DATE_BUCKET`}
      </CodeBlock>

      <InfoBox variant="note" title="Spotting a pre-2017 codebase">
        <p>
          If you find{' '}
          <code>STUFF((SELECT &apos;,&apos; + [col] ... FOR XML PATH(&apos;&apos;)), 1, 1, &apos;&apos;)</code>,
          that is string aggregation written before <code>STRING_AGG</code> existed. Worth replacing
          on sight if you are on 2017+: it is slower, far harder to read, and it{' '}
          <strong>XML-escapes characters like <code>&amp;</code> and <code>&lt;</code> in your
          data</strong> — a correctness bug, not just an aesthetic one.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default TsqlCoreQueries;
