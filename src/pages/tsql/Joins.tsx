import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
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
        Joins in T-SQL are standard SQL. Two things are worth a dedicated lesson: the{' '}
        <code>APPLY</code> operator, which is the T-SQL answer to a correlated join and has no
        equivalent in older standard SQL, and the legacy join syntax you will meet in any codebase
        that has been alive for more than a decade.
      </p>

      <h2>The Standard Joins</h2>

      <CodeBlock language="sql" title="Nothing surprising here">
{`SELECT e.name, d.budget
FROM      emp        AS e
JOIN      department AS d ON d.dept = e.dept    -- INNER is the default
LEFT JOIN audit      AS a ON a.emp_id = e.id
WHERE     d.budget > 1000;

-- FULL OUTER JOIN and CROSS JOIN exist and behave as expected.
-- INNER / OUTER are optional keywords: "LEFT JOIN" == "LEFT OUTER JOIN".`}
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
SELECT * FROM emp e, department d WHERE e.dept *= d.dept;

-- MODERN:
SELECT * FROM emp e LEFT JOIN department d ON e.dept = d.dept;`}
        </CodeBlock>
        <p style={{ marginTop: '0.5rem' }}>
          Comma-joins for <em>inner</em> joins (<code>FROM a, b WHERE a.x = b.x</code>) still work and
          are merely bad style. The outer variants are the dangerous ones.
        </p>
      </InfoBox>

      <h2>APPLY — The One You Actually Need to Learn</h2>

      <p>
        <code>CROSS APPLY</code> runs a subquery <em>once per row</em> of the left side, and lets that
        subquery reference the current row. If you know PostgreSQL, it is <code>LATERAL</code>. It is
        the cleanest way to express &quot;top N per group&quot;:
      </p>

      <CodeBlock language="sql" title="Highest-paid employee in each department">
{`SELECT d.dept, x.name, x.salary
FROM  (SELECT DISTINCT dept FROM emp) AS d
CROSS APPLY (
    SELECT TOP (1) name, salary
    FROM   emp AS e
    WHERE  e.dept = d.dept          -- <- references the outer row
    ORDER  BY e.salary DESC
) AS x;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — SQL Server 2019">
{`dept | name | salary
-----|------|-------
eng  | ann  | 100
ops  | dee  | 120`}
      </CodeBlock>

      <CodeBlock language="text" title="CROSS vs OUTER">
{`CROSS APPLY   drops the left row if the subquery returns nothing
              (behaves like an INNER JOIN)

OUTER APPLY   keeps the left row with NULLs
              (behaves like a LEFT JOIN)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Three jobs only APPLY does well">
        <p>
          <strong>1. Top-N-per-group</strong>, as above — the alternative is a windowed subquery,
          which is fine but reads worse when N is small.{' '}
          <strong>2. Calling a table-valued function per row</strong>, which a plain{' '}
          <code>JOIN</code> simply cannot do.{' '}
          <strong>3. Naming an intermediate expression</strong> so you can reuse it:
        </p>
        <CodeBlock language="sql" title="APPLY as a 'let' binding">
{`SELECT e.name, c.full_comp, c.full_comp * 0.1 AS bonus
FROM   emp AS e
CROSS APPLY (SELECT ISNULL(e.salary,0) + ISNULL(e.bonus,0) AS full_comp) AS c;
-- without APPLY you would repeat that expression in every column`}
        </CodeBlock>
      </InfoBox>

      <h2>Semi-Joins: EXISTS and IN</h2>

      <CodeBlock language="sql" title="Three ways to ask 'does a match exist?'">
{`-- EXISTS: the clearest, and NULL-safe
SELECT * FROM emp e
WHERE EXISTS (SELECT 1 FROM audit a WHERE a.emp_id = e.id);

-- IN: equivalent for a non-nullable column
SELECT * FROM emp WHERE id IN (SELECT emp_id FROM audit);

-- JOIN + DISTINCT: works, but DISTINCT is doing damage control
SELECT DISTINCT e.* FROM emp e JOIN audit a ON a.emp_id = e.id;`}
      </CodeBlock>

      <InfoBox variant="warning" title="NOT IN with a nullable column returns nothing">
        <p>
          This is the single most common NULL bug in SQL, and it is not specific to T-SQL — but it
          bites here too. If the subquery of a <code>NOT IN</code> yields even one NULL, the whole
          predicate evaluates to UNKNOWN for every row and the query returns <strong>zero
          rows</strong>.
        </p>
        <CodeBlock language="sql" title="Use NOT EXISTS instead">
{`-- BROKEN if audit.emp_id is nullable and contains any NULL:
SELECT * FROM emp WHERE id NOT IN (SELECT emp_id FROM audit);

-- CORRECT, and unaffected by NULLs:
SELECT * FROM emp e
WHERE NOT EXISTS (SELECT 1 FROM audit a WHERE a.emp_id = e.id);`}
        </CodeBlock>
        <p style={{ marginTop: '0.5rem' }}>
          The old &quot;EXISTS is faster than IN&quot; advice is Oracle-era folklore and does not
          describe modern SQL Server — the optimiser turns both into the same semi-join. Choose{' '}
          <code>NOT EXISTS</code> for <em>correctness</em>, not speed.
        </p>
      </InfoBox>

      <h2>Set Operators</h2>

      <CodeBlock language="text" title="UNION vs UNION ALL is a real performance decision">
{`UNION       combines and REMOVES DUPLICATES  -> requires a sort/hash
UNION ALL   combines, keeps everything        -> just concatenates

INTERSECT   rows in both
EXCEPT      rows in the first but not the second
            (Oracle spells this MINUS; T-SQL does not accept MINUS)

All of them treat NULL as EQUAL to NULL for dedup purposes, which is
the opposite of how = behaves. NULL = NULL is UNKNOWN, but UNION will
still collapse two NULL rows into one.`}
      </CodeBlock>

      <p>
        Default to <code>UNION ALL</code> unless you specifically need deduplication. Writing{' '}
        <code>UNION</code> out of habit asks the server to sort or hash the entire combined result to
        remove duplicates that frequently cannot exist in the first place.
      </p>

      <FlowChart
        title="Picking the right construct"
        chart={"graph TD\n  A[\"I need rows from another table\"] --> B{\"do I need its COLUMNS?\"}\n  B -->|\"no, just existence\"| C[\"EXISTS / NOT EXISTS\"]\n  B -->|\"yes\"| D{\"one match, or many?\"}\n  D -->|\"at most one\"| E[\"LEFT JOIN\"]\n  D -->|\"top N per row\"| F[\"CROSS / OUTER APPLY\"]\n  D -->|\"all of them\"| G[\"JOIN\"]\n  A --> H{\"stacking result SETS?\"}\n  H -->|\"duplicates impossible\"| I[\"UNION ALL\"]\n  H -->|\"must dedup\"| J[\"UNION\"]\n  style C fill:#1a3329,stroke:#4ade80\n  style F fill:#1a3329,stroke:#4ade80\n  style I fill:#1a3329,stroke:#4ade80\n  style J fill:#3d2f14"}
      />

      <InteractiveChallenge
        question="A query using NOT IN (SELECT manager_id FROM emp) suddenly returns zero rows after a new employee is added with a NULL manager_id. Why?"
        options={[
          'The new row broke the index on manager_id',
          'NOT IN against a list containing NULL evaluates to UNKNOWN for every row, so nothing qualifies — NOT EXISTS is the correct construct',
          'NOT IN has a row limit that was exceeded',
          'The subquery needs DISTINCT to work correctly',
        ]}
        correctIndex={1}
        explanation={"x NOT IN (a, b, NULL) expands to x <> a AND x <> b AND x <> NULL. That last comparison is UNKNOWN rather than TRUE or FALSE, and AND-ing anything with UNKNOWN can never produce TRUE — so every row is filtered out and the result is empty. Nothing errors, which is what makes it so confusing: the query worked yesterday and returns nothing today. NOT EXISTS uses a correlated existence check rather than an equality list, so a NULL row simply fails to match and the query behaves as intended. This is the strongest argument for preferring NOT EXISTS as a default habit."}
      />
    </LessonLayout>
  );
}

export default TsqlJoins;
