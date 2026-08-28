import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function TsqlIntro() {
  return (
    <LessonLayout
      title="T-SQL & Which Server You Are On"
      sectionId="tsql"
      lessonIndex={0}
      prev={null}
      next={{ path: '/tsql/core-queries', label: 'Core Queries — SELECT, TOP, Paging, NULLs' }}
    >
      <InfoBox variant="warning" title="⚠️ Version notice — this section targets an older SQL Server">
        <p>
          These lessons are written for <strong>Microsoft SQL Server 2016/2017 as the baseline</strong>,
          and everything was verified by running it against a real{' '}
          <strong>SQL Server 2019 (15.0.4480.2)</strong> instance. Anything newer than the baseline is
          marked inline as <strong>2017+</strong>, <strong>2019+</strong> or <strong>2022+</strong> so
          you can tell instantly whether you can use it.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>The current release is SQL Server 2025.</strong> The supported line runs 2016, 2017,
          2019, 2022, 2025 — <em>there is no SQL Server 2018</em>, which is a common mix-up because
          Azure SQL and the tooling ship on their own cadence. If you thought you were on 2018, you are
          almost certainly on 2017 or 2019. The next section tells you how to find out for certain.
        </p>
      </InfoBox>

      <p>
        <strong>T-SQL</strong> (Transact-SQL) is Microsoft&apos;s dialect of SQL. The{' '}
        <code>SELECT</code>/<code>FROM</code>/<code>WHERE</code> core is standard and will look
        familiar from any other database, but almost everything around it — the procedural language,
        the type system, string handling, and above all the concurrency model — is its own thing.
      </p>

      <InfoBox variant="note" title="Coming from the Postgres sections on this site?">
        <p>
          Four behaviours will catch you out, and all four are verified further down this page:
          string comparison is <strong>case-insensitive by default</strong>, integer division{' '}
          <strong>truncates</strong>, <code>&apos;a&apos; + NULL</code> is{' '}
          <strong>NULL</strong>, and a plain <code>SELECT</code> can{' '}
          <strong>block behind an uncommitted write</strong>. That last one is the big one and it
          gets its own lesson.
        </p>
      </InfoBox>

      <h2>Step 1: Find Out What You Are Actually Running</h2>

      <CodeBlock language="sql" title="Three ways, most detail first">
{`-- everything, as one banner string
SELECT @@VERSION;

-- the individual facts, which are easier to use in scripts
SELECT SERVERPROPERTY('ProductVersion') AS ver,
       SERVERPROPERTY('ProductLevel')   AS lvl,
       SERVERPROPERTY('Edition')        AS ed,
       SERVERPROPERTY('EngineEdition')  AS eng;

-- the compatibility level, which can differ from the engine version!
SELECT name, compatibility_level FROM sys.databases;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the server these lessons were verified against">
{`Microsoft SQL Server 2019 (RTM-CU32-GDR) (KB5102335) - 15.0.4480.2 (X64)
        Jun 18 2026 17:54:32
        Copyright (C) 2019 Microsoft Corporation

ver          | lvl | ed                         | eng
-------------|-----|----------------------------|----
15.0.4480.2  | RTM | Developer Edition (64-bit) | 3

name   | compatibility_level
-------|--------------------
master | 150
lab    | 150`}
      </CodeBlock>

      <h2>Reading the Version Number</h2>

      <CodeBlock language="text" title="Major version -> product name -> compatibility level">
{`ProductVersion   product              compat level
---------------  -------------------  ------------
13.x             SQL Server 2016      130
14.x             SQL Server 2017      140
15.x             SQL Server 2019      150      <- verified here
16.x             SQL Server 2022      160
17.x             SQL Server 2025      170

                 THERE IS NO 2018.

EngineEdition:  2 = Standard   3 = Enterprise/Developer
                5 = Azure SQL Database
                8 = Azure SQL Managed Instance`}
      </CodeBlock>

      <InfoBox variant="danger" title="The engine version and the compatibility level are different things">
        <p>
          A database restored from an old server keeps its old <code>compatibility_level</code>. You
          can be running the 2019 <em>engine</em> with a database pinned at level 130, which means the
          2019 query optimiser behaves like 2016 for that database. This is a real and common
          situation — it is how upgrades get done safely — and it explains the otherwise baffling case
          where a query is slow on a new server and fast on an old one, or where a feature that
          &quot;exists in your version&quot; behaves differently than the documentation says.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          If a feature is not behaving as documented, check the compatibility level before anything
          else.
        </p>
      </InfoBox>

      <h2>What You Can and Cannot Use</h2>

      <p>
        Since you may be on 2016, 2017 or 2019, here is the practical part. Each of these was executed
        against the 2019 instance — <strong>available</strong> means it ran, and{' '}
        <strong>not available</strong> means the server rejected it:
      </p>

      <CodeBlock language="text" title="Real output — feature probe on SQL Server 2019">
{`STRING_AGG            (2017+)   AVAILABLE
TRIM                  (2017+)   AVAILABLE
CONCAT_WS             (2017+)   AVAILABLE
APPROX_COUNT_DISTINCT (2019+)   AVAILABLE
IIF                   (2012+)   AVAILABLE
OFFSET/FETCH          (2012+)   AVAILABLE

GREATEST              (2022+)   NOT AVAILABLE
LEAST                 (2022+)   NOT AVAILABLE
GENERATE_SERIES       (2022+)   NOT AVAILABLE
DATE_BUCKET           (2022+)   NOT AVAILABLE`}
      </CodeBlock>

      <p>
        The boundary is clean. If you are on <strong>2017 or 2019</strong>, everything in the first
        block is yours. If you are on <strong>2016</strong>, you additionally lose{' '}
        <code>STRING_AGG</code>, <code>TRIM</code> and <code>CONCAT_WS</code> — and the workarounds
        for those (the <code>FOR XML PATH</code> string-concatenation trick, and{' '}
        <code>LTRIM(RTRIM(x))</code>) are the classic tell that a codebase predates 2017.
      </p>

      <h2>Four Things That Are Not Like Postgres</h2>

      <CodeBlock language="text" title="Real output — all four run on the 2019 instance">
{`-- 1. THE DEFAULT COLLATION IS CASE-INSENSITIVE
SELECT SERVERPROPERTY('Collation');
   SQL_Latin1_General_CP1_CI_AS
                          ^^ CI = Case Insensitive, AS = Accent Sensitive

SELECT CASE WHEN 'ABC' = 'abc' THEN 'EQUAL' ELSE 'not equal' END;
   EQUAL (case-INSENSITIVE)          -- in Postgres this is FALSE


-- 2. INTEGER DIVISION TRUNCATES
SELECT 7/2 AS int_div, 7.0/2 AS dec_div;
   int_div | dec_div
   3       | 3.500000


-- 3. + PROPAGATES NULL, CONCAT() DOES NOT
SELECT 'a' + NULL AS concat_op, CONCAT('a', NULL) AS concat_fn;
   concat_op | concat_fn
   NULL      | a


-- 4. = NULL IS NEVER TRUE (ANSI_NULLS is on and cannot practically be turned off)
   WHERE x = NULL     -> 0 rows
   WHERE x IS NULL    -> 1 row`}
      </CodeBlock>

      <InfoBox variant="warning" title="Case-insensitivity is the one that silently changes results">
        <p>
          <code>WHERE email = &apos;Bob@x.com&apos;</code> matches a stored{' '}
          <code>bob@x.com</code> on a default SQL Server install and does not match on Postgres. That
          is convenient right up until you port a query, migrate data, or rely on a unique constraint:
          under a CI collation, <code>&apos;Bob&apos;</code> and <code>&apos;bob&apos;</code>{' '}
          <strong>collide</strong> in a unique index. Two rows you expected to coexist cannot.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Collation is set per server, per database <em>and</em> per column, so a single query can mix
          them — which produces the notorious &quot;cannot resolve the collation conflict between ...
          and ... in the equal to operation&quot; error when you join two columns whose collations
          disagree.
        </p>
      </InfoBox>

      <h2>The Shape of the Section</h2>

      <FlowChart
        title="How the nine lessons build up"
        chart={"graph TD\n  A[\"1. version + dialect basics\"] --> B[\"2. core queries<br/>SELECT, TOP, paging, NULLs\"]\n  B --> C[\"3. joins & set operations\"]\n  C --> D[\"4. aggregation &<br/>window functions\"]\n  D --> E[\"5. modifying data<br/>OUTPUT, MERGE, upserts\"]\n  E --> F[\"6. procedures, functions,<br/>TRY/CATCH, dynamic SQL\"]\n  F --> G[\"7. transactions & locking<br/>the big one\"]\n  G --> H[\"8. indexing, SARGability,<br/>execution plans\"]\n  H --> I[\"9. cheat sheet\"]\n  style G fill:#3b1a1a,stroke:#f87171\n  style I fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        Lesson 7 is marked because it is the one that matters most if you are coming from Postgres.
        SQL Server&apos;s default isolation is <strong>lock-based</strong>, not snapshot-based, so
        readers and writers block each other in ways that simply do not happen in Postgres. It is the
        single most common source of production surprises on this engine, and it is fixable with one
        database setting.
      </p>

      <InteractiveChallenge
        question="A colleague says the app runs on 'SQL Server 2018'. SELECT @@VERSION reports 15.0.4480.2, but the application database reports compatibility_level 130. What is actually true?"
        options={[
          'It is SQL Server 2018 running in 2016 compatibility mode',
          'The engine is SQL Server 2019 (15.x); there is no 2018 release. The database is pinned to compatibility level 130, so it uses the 2016 optimiser behaviour despite the newer engine',
          'The version numbers conflict, so the install is corrupted',
          'compatibility_level 130 means the server is SQL Server 2013',
        ]}
        correctIndex={1}
        explanation={"There is no SQL Server 2018 — the line goes 2016 (13.x), 2017 (14.x), 2019 (15.x), 2022 (16.x), 2025 (17.x). A ProductVersion of 15.x is unambiguously 2019. The compatibility level is a separate, per-database setting: 130 corresponds to 2016, so this database asks the 2019 engine to behave like 2016 for query optimisation. That combination is completely normal — it is how a cautious upgrade is staged, moving the engine first and raising compatibility levels later once plans have been checked. It also matters practically: you get 2019's syntax surface, such as APPROX_COUNT_DISTINCT, while the optimiser follows the older rules."}
      />
    </LessonLayout>
  );
}

export default TsqlIntro;
