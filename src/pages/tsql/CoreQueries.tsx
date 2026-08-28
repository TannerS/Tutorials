import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
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
        The <code>SELECT</code> core is standard SQL and needs no introduction. This lesson is about
        the places where T-SQL differs from what you would write elsewhere — and every example was run
        against a real SQL Server 2019 instance, on this table:
      </p>

      <CodeBlock language="sql" title="The sample table used throughout">
{`CREATE TABLE emp (
  id     INT,
  name   VARCHAR(20),
  dept   VARCHAR(10),
  salary INT NULL
);
INSERT INTO emp VALUES
  (1,'ann','eng',100), (2,'bob','eng',NULL), (3,'cid','ops', 80),
  (4,'dee','ops',120), (5,'eve','eng',100);`}
      </CodeBlock>

      <h2>TOP — SQL Server&apos;s LIMIT</h2>

      <CodeBlock language="sql" title="TOP goes at the front, not the end">
{`SELECT TOP (10) * FROM emp ORDER BY salary DESC;   -- LIMIT 10
SELECT TOP (10) PERCENT * FROM emp ORDER BY salary DESC;
SELECT TOP (3) WITH TIES * FROM emp ORDER BY salary DESC;

-- parentheses are optional for a literal but REQUIRED for a variable:
DECLARE @n INT = 5;
SELECT TOP (@n) * FROM emp ORDER BY id;`}
      </CodeBlock>

      <InfoBox variant="warning" title="TOP without ORDER BY returns an arbitrary set">
        <p>
          <code>SELECT TOP (10) * FROM emp</code> with no <code>ORDER BY</code> is not &quot;the first
          ten rows&quot; — there is no such thing. It is whichever ten rows the engine finds
          cheapest to produce, which can change when an index is added, statistics update, or the plan
          goes parallel. It is stable enough in testing to look correct and unstable enough to break
          in production.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <code>WITH TIES</code> is the fix for the related problem: without it,{' '}
          <code>TOP (3)</code> over tied values cuts arbitrarily through the tie.
        </p>
      </InfoBox>

      <h2>Paging: OFFSET / FETCH</h2>

      <CodeBlock language="sql" title="The standard-SQL pager, available since 2012">
{`SELECT id, name
FROM   emp
ORDER  BY id                    -- MANDATORY
OFFSET 20 ROWS
FETCH  NEXT 10 ROWS ONLY;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same query without ORDER BY">
{`SELECT id FROM emp OFFSET 1 ROWS FETCH NEXT 2 ROWS ONLY;

Msg 102, Level 15, State 1 — Incorrect syntax near 'OFFSET'.
Msg 153, Level 15, State 2 — Invalid usage of the option NEXT in the FETCH statement.`}
      </CodeBlock>

      <p>
        <code>ORDER BY</code> is not optional here — the parser rejects the statement outright. That
        is a deliberate improvement over <code>TOP</code>: paging without a deterministic order is
        always a bug, so the syntax refuses to express it.
      </p>

      <InfoBox variant="tip" title="OFFSET gets slower the deeper you page">
        <p>
          <code>OFFSET 100000 ROWS</code> makes the server produce and discard 100,000 rows before
          returning anything. For deep paging use <strong>keyset pagination</strong> instead — carry
          the last key you saw and filter on it:
        </p>
        <CodeBlock language="sql" title="Keyset paging stays flat">
{`SELECT TOP (10) id, name
FROM   emp
WHERE  id > @last_id_seen
ORDER  BY id;`}
        </CodeBlock>
      </InfoBox>

      <h2>NULLs Sort First</h2>

      <CodeBlock language="text" title="Real output — ORDER BY salary ASC">
{`id | salary
---|-------
 2 | NULL      <- NULL comes FIRST in ascending order
 3 | 80
 1 | 100
 5 | 100
 4 | 120`}
      </CodeBlock>

      <InfoBox variant="danger" title="This is the opposite of PostgreSQL">
        <p>
          SQL Server treats NULL as lower than every value, so <code>ORDER BY x ASC</code> puts NULLs
          first and <code>DESC</code> puts them last. Postgres does the reverse by default — NULLs
          sort <em>last</em> ascending. A query ported between the two returns the same rows in a
          different order, which silently changes what &quot;the top row&quot; is.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Worse, T-SQL has <strong>no <code>NULLS LAST</code> clause</strong> — that is Postgres-only
          syntax and will not parse. You have to sort on a computed flag:
        </p>
        <CodeBlock language="sql" title="Emulating NULLS LAST in T-SQL">
{`ORDER BY CASE WHEN salary IS NULL THEN 1 ELSE 0 END, salary ASC;`}
        </CodeBlock>
      </InfoBox>

      <h2>ISNULL vs COALESCE — Not Interchangeable</h2>

      <p>
        These look like synonyms and are not. <code>ISNULL</code> forces the result into the data type
        of its <em>first</em> argument, which can silently truncate the replacement value:
      </p>

      <CodeBlock language="text" title="Real output — the same substitution, two functions">
{`SELECT ISNULL  (CAST(NULL AS VARCHAR(2)), 'abcdef') AS isnull_res,
       COALESCE(CAST(NULL AS VARCHAR(2)), 'abcdef') AS coalesce_res;

isnull_res | coalesce_res
-----------|-------------
ab         | abcdef
^^
truncated to VARCHAR(2) — no error, no warning`}
      </CodeBlock>

      <p>
        <code>COALESCE</code> follows standard type-precedence rules and returns the full string.
        There are other differences — <code>COALESCE</code> is standard SQL, takes any number of
        arguments, and is expanded into a <code>CASE</code> expression (so a subquery argument may be
        evaluated twice), while <code>ISNULL</code> is a two-argument T-SQL extension evaluated once.
        The practical rule: <strong>default to <code>COALESCE</code></strong>, and reach for{' '}
        <code>ISNULL</code> only when you specifically want its type-coercion behaviour.
      </p>

      <h2>LEN Lies About Trailing Spaces</h2>

      <CodeBlock language="text" title="Real output">
{`SELECT LEN('ab   ')        AS len_fn,     -- 2   trailing spaces IGNORED
       DATALENGTH('ab   ') AS datalen,    -- 5   bytes, spaces counted
       LEN(N'ab')          AS len_n,      -- 2   characters
       DATALENGTH(N'ab')   AS datalen_n;  -- 4   bytes — NVARCHAR is 2/char`}
      </CodeBlock>

      <p>
        <code>LEN</code> returns the length <em>excluding trailing spaces</em>, which surprises
        everyone once. Use <code>DATALENGTH</code> when you care about storage, and note that it
        returns <strong>bytes</strong>, not characters — so an <code>NVARCHAR</code> string reports
        double what you might expect.
      </p>

      <h2>VARCHAR vs NVARCHAR</h2>

      <CodeBlock language="text" title="The distinction that does not exist in Postgres">
{`VARCHAR(n)    1 byte per char, limited to the code page of the collation
NVARCHAR(n)   2 bytes per char, full Unicode
N'literal'    the N prefix makes a literal NVARCHAR

VARCHAR(MAX) / NVARCHAR(MAX)   up to 2GB, stored off-row

Postgres has ONE text type and it is always Unicode. On SQL Server the
choice is real, it is per column, and getting it wrong is expensive to
change later.

*** THE PERFORMANCE TRAP ***
Comparing an NVARCHAR parameter to a VARCHAR column forces an implicit
conversion, and that conversion can prevent an index seek. Many ORMs and
drivers send strings as NVARCHAR by default, so this happens without
anyone writing a cast. Covered in the indexing lesson.`}
      </CodeBlock>

      <h2>String Functions, With Version Gates</h2>

      <CodeBlock language="sql" title="What you can use depends on your version">
{`-- available everywhere in the supported line
LEFT/RIGHT/SUBSTRING/REPLACE/UPPER/LOWER/CHARINDEX/PATINDEX/STUFF
CONCAT(a, b, c)          -- NULL-safe, unlike +
IIF(cond, a, b)          -- 2012+
FORMAT(x, 'yyyy-MM-dd')  -- flexible but SLOW; avoid in large result sets

-- 2017+
TRIM(x)                  -- before 2017: LTRIM(RTRIM(x))
STRING_AGG(x, ',')       -- before 2017: the FOR XML PATH trick
CONCAT_WS('-', a, b, c)

-- 2016+
STRING_SPLIT(x, ',')     -- returns a table; no ordinal column until 2022

-- NOT available before 2022
GREATEST / LEAST / GENERATE_SERIES / DATE_BUCKET`}
      </CodeBlock>

      <InfoBox variant="note" title="Spotting a pre-2017 codebase">
        <p>
          If you find <code>STUFF((SELECT &apos;,&apos; + col FROM ... FOR XML PATH(&apos;&apos;)), 1, 1, &apos;&apos;)</code>{' '}
          anywhere, that is string aggregation written before <code>STRING_AGG</code> existed. It
          still works, and it is worth replacing on sight if you are on 2017 or later — it is slower,
          much harder to read, and it XML-escapes characters like <code>&amp;</code> and{' '}
          <code>&lt;</code> in your data, which is a genuine correctness bug rather than just an
          aesthetic one.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A reporting query uses ISNULL(middle_name, 'Not provided') where middle_name is VARCHAR(10). The report shows 'Not provi' for everyone missing a middle name. What happened?"
        options={[
          'The report tool truncated the column for display',
          "ISNULL forces the result into the first argument's type, VARCHAR(10), so the 13-character replacement was silently truncated — COALESCE would have returned it in full",
          'The column needs to be NVARCHAR to hold that string',
          'The default collation truncated the value',
        ]}
        correctIndex={1}
        explanation={"ISNULL returns its result in the data type of the first argument. Here that is VARCHAR(10), so 'Not provided' (12 characters) is cut to 'Not provi' — with no error and no warning, which is what makes it dangerous. COALESCE follows standard type-precedence rules instead and would return the whole string. This is the practical reason to default to COALESCE: it is standard SQL, it takes more than two arguments, and it does not silently reshape your data to fit the first column you happened to name."}
      />
    </LessonLayout>
  );
}

export default TsqlCoreQueries;
