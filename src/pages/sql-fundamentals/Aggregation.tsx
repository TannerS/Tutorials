import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Aggregation() {
  return (
    <LessonLayout
      title="Aggregation & Window Functions"
      sectionId="sql-fundamentals"
      lessonIndex={2}
      prev={{ path: '/sql-fundamentals/joins', label: 'Joins & Subqueries' }}
      next={{ path: '/sql-design-patterns/design', label: 'Schema Design & Normalization' }}
    >
      <p>
        GROUP BY collapses rows into summaries. Window functions annotate every row with aggregate
        or ranking info <em>without</em> collapsing anything. You need both — this lesson covers
        the full toolkit for turning rows into insight, PostgreSQL-flavored throughout.
      </p>

      <h2>Aggregate Functions</h2>

      <CodeBlock language="sql" title="COUNT, SUM, AVG, MIN, MAX" showLineNumbers={true}>
{`-- Basic aggregates
SELECT
  COUNT(*)           AS total_employees,    -- counts all rows
  COUNT(manager_id)  AS has_manager,        -- counts non-NULL values
  SUM(salary)        AS total_payroll,
  AVG(salary)        AS avg_salary,
  MIN(salary)        AS lowest_salary,
  MAX(salary)        AS highest_salary
FROM employees;

-- Aggregates with GROUP BY
SELECT
  department,
  COUNT(*) AS headcount,
  ROUND(AVG(salary), 2) AS avg_salary,
  MAX(salary) - MIN(salary) AS salary_spread
FROM employees
GROUP BY department
ORDER BY headcount DESC;`}
      </CodeBlock>

      <h2>Why GROUP BY Forces the Aggregate Rule</h2>

      <p>
        Everyone learns the rule — <em>every column in the SELECT list must either appear in the
        GROUP BY or be wrapped in an aggregate</em> — and most people learn it by having Postgres
        shout it at them. The rule is not arbitrary bureaucracy, and once you see the mechanism you
        will never have to memorise it again.
      </p>

      <p>
        <code>GROUP BY</code> physically collapses many rows into one. After it runs, a group is not
        a row — it is a <em>bag</em> of rows sharing the grouping key. Ask for{' '}
        <code>department</code> and there is exactly one answer, because that is what defined the
        group. Ask for <code>salary</code> and there are five different answers with no reason to
        prefer any of them, so the question is meaningless. An aggregate is precisely a function
        that turns the whole bag into one value, which is why it is the only other thing allowed.
      </p>

      <CodeBlock language="sql" title="The rule, and what the error is really telling you" showLineNumbers={true}>
{`-- The 3 Engineering rows collapse to 1 group. Which salary should it print?
SELECT department, salary
FROM employees
GROUP BY department;
-- ERROR: column "employees.salary" must appear in the GROUP BY clause
--        or be used in an aggregate function
-- Read it as: "you asked a question that has five answers."

-- Both legal fixes just answer the question:
SELECT department, MAX(salary) FROM employees GROUP BY department;  -- pick one
SELECT department, salary      FROM employees GROUP BY department, salary;
                                                        -- ^ finer groups, so
                                                        --   salary IS the key

-- MySQL (with ONLY_FULL_GROUP_BY off) silently returns an ARBITRARY salary
-- here instead of erroring. That is not a friendlier database; it is the same
-- meaningless question with the error suppressed. Postgres is doing you a favour.

-- The one exception, and it follows from the same logic: group by a PRIMARY KEY
-- and every other column of that table is functionally dependent on it — one id
-- means exactly one name — so there is only ever one answer and Postgres allows it.
SELECT e.id, e.name, COUNT(o.id) AS order_count
FROM employees e
LEFT JOIN orders o ON o.employee_id = e.id
GROUP BY e.id;              -- e.name is legal: id is the PK of employees
-- Grouping by e.name instead would fail — a name is not guaranteed unique.`}
      </CodeBlock>

      <InfoBox variant="info" title="The same model explains WHERE vs HAVING, and the alias rule">
        <p>
          <code>WHERE</code> runs <em>before</em> the collapse, so it sees individual rows and can
          never see an aggregate — <code>WHERE COUNT(*) &gt; 5</code> is asking about a group that
          does not exist yet. <code>HAVING</code> runs <em>after</em>, so it sees groups and{' '}
          <em>only</em> groups, which is why it can use <code>COUNT(*)</code> and why filtering
          individual rows there is both wrong and slow.
        </p>
        <p>
          Put the row-level filter in <code>WHERE</code> every time it is possible. Rows removed
          before grouping are rows that never have to be hashed or sorted; the same predicate moved
          to <code>HAVING</code> does the aggregation work first and then throws the result away.
          Same answer, more work.
        </p>
        <p>
          And it explains the alias rule from the Quickstart lesson: <code>SELECT</code> is
          evaluated after <code>GROUP BY</code> and <code>HAVING</code>, so the alias those clauses
          would need does not exist yet. Repeat the expression, or wrap the whole thing in a CTE and
          filter the outer query.
        </p>
      </InfoBox>

      <h2>WHERE vs HAVING</h2>

      <CodeBlock language="sql" title="WHERE vs HAVING — Know the Difference" showLineNumbers={true}>
{`-- WHERE filters rows BEFORE grouping
-- HAVING filters groups AFTER aggregation

-- "Departments with more than 5 senior engineers"
SELECT department, COUNT(*) AS senior_count
FROM employees
WHERE level = 'Senior'        -- row-level filter (before GROUP BY)
GROUP BY department
HAVING COUNT(*) > 5           -- group-level filter (after GROUP BY)
ORDER BY senior_count DESC;

-- NOTE: do NOT write  WHERE level >= 'Senior'  to mean "Senior or above".
-- On a text column that is a LEXICOGRAPHIC comparison, not a seniority one:
-- it matches 'Senior' and 'Staff' but excludes 'Mid' and 'Principal'.
-- If levels are ordered, model the order explicitly — an INT rank column, or
-- a Postgres ENUM, which compares by declaration order rather than alphabet:
--   CREATE TYPE seniority AS ENUM ('Junior','Mid','Senior','Staff','Principal');
--   ... WHERE level >= 'Senior'::seniority   -- now genuinely means "or above"

-- Conditional aggregation (avoids multiple queries)
SELECT
  department,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE level = 'Senior') AS seniors,     -- PostgreSQL only
  SUM(CASE WHEN level = 'Senior' THEN 1 ELSE 0 END) AS seniors_compat  -- ANSI-portable
FROM employees
GROUP BY department;`}
      </CodeBlock>

      <InfoBox variant="tip" title="FILTER Clause">
        <p>
          PostgreSQL's <code>FILTER (WHERE ...)</code> is cleaner than CASE-based conditional
          aggregation and can be slightly faster. It works on any aggregate, including window
          aggregates. Prefer it whenever portability to other engines isn't a concern.
        </p>
      </InfoBox>

      <h2>GROUP BY Patterns</h2>

      <CodeBlock language="sql" title="GROUP BY with ROLLUP, CUBE, and GROUPING SETS" showLineNumbers={true}>
{`-- ROLLUP: subtotals + grand total (hierarchical)
SELECT department, level, COUNT(*), AVG(salary)
FROM employees
GROUP BY ROLLUP (department, level);
-- Produces: (dept, level), (dept, NULL), (NULL, NULL)

-- CUBE: all possible subtotal combinations
SELECT department, level, COUNT(*), AVG(salary)
FROM employees
GROUP BY CUBE (department, level);
-- Produces: (dept, level), (dept, NULL), (NULL, level), (NULL, NULL)

-- GROUPING SETS: explicit control over which groupings to compute
SELECT department, level, COUNT(*)
FROM employees
GROUP BY GROUPING SETS (
  (department, level),
  (department),
  ()
);
-- ROLLUP and CUBE are just shorthand for particular GROUPING SETS.
-- ROLLUP (a, b) == GROUPING SETS ((a,b), (a), ())
-- CUBE   (a, b) == GROUPING SETS ((a,b), (a), (b), ())
-- One pass over the table produces all of them, which is the whole point:
-- it beats UNION ALL-ing three separately-scanned queries together.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Subtotal rows are NULL — and so is missing data. GROUPING() tells them apart.">
        <p>
          A <code>ROLLUP</code> subtotal row marks the rolled-up column as <code>NULL</code>. But an
          employee with no recorded <code>level</code> also has <code>NULL</code> there. Both print
          identically, so a report can silently show a real &quot;unknown level&quot; group where
          the reader expects a subtotal — or the reverse.
        </p>
        <p>
          <code>GROUPING(col)</code> is the disambiguator: it returns <code>1</code> when the column
          was collapsed by the grouping set, <code>0</code> when the <code>NULL</code> is real data.
          Any ROLLUP/CUBE query destined for human eyes should label its rows with it.
        </p>
      </InfoBox>

      <CodeBlock language="sql" title="Labelling subtotal rows correctly" showLineNumbers={true}>
{`SELECT
  CASE WHEN GROUPING(department) = 1 THEN 'ALL DEPARTMENTS'
       ELSE COALESCE(department, '(unspecified)') END AS department,
  CASE WHEN GROUPING(level) = 1 THEN 'subtotal'
       ELSE COALESCE(level, '(unspecified)') END      AS level,
  COUNT(*) AS headcount
FROM employees
GROUP BY ROLLUP (department, level)
-- GROUPING() is an aggregate-context function, so it is legal in ORDER BY
-- and HAVING too. Sorting by it keeps subtotals under their detail rows
-- instead of scattering them alphabetically:
ORDER BY GROUPING(department), department, GROUPING(level), level;`}
      </CodeBlock>

      <h2>Window ≠ GROUP BY</h2>

      <FlowChart
        title="Window Function Processing Pipeline"
        chart={"graph TD\n  A[\"FROM / JOIN / WHERE\"] --> B[\"GROUP BY / HAVING\"]\n  B --> C[\"Window Function Evaluation\"]\n  C --> D[\"SELECT expressions\"]\n  D --> E[\"DISTINCT\"]\n  E --> F[\"ORDER BY\"]\n  F --> G[\"LIMIT / OFFSET\"]\n  C -- \"Partition the result set\" --> P[\"PARTITION BY\"]\n  P -- \"Order within partitions\" --> O[\"ORDER BY in OVER\"]\n  O -- \"Define the frame\" --> FR[\"ROWS/RANGE BETWEEN\"]\n  style C fill:#1a3329,stroke:#4ade80\n  style P fill:#1a2744,stroke:#5b9cf6\n  style O fill:#1a2744,stroke:#5b9cf6\n  style FR fill:#2a1f44,stroke:#a78bfa"}
      />

      <InfoBox variant="info" title="Window ≠ GROUP BY">
        <p>
          GROUP BY collapses rows. Window functions <strong>annotate</strong> rows. You get the
          original row count back, but each row carries aggregate/ranking info about its partition.
          Window functions execute after GROUP BY and HAVING, but before final SELECT evaluation.
        </p>
      </InfoBox>

      <h2>Ranking Functions</h2>

      <CodeBlock language="sql" title="ROW_NUMBER vs RANK vs DENSE_RANK vs NTILE" showLineNumbers={true}>
{`SELECT
  name,
  department,
  salary,
  ROW_NUMBER() OVER w AS row_num,    -- unique sequential: 1,2,3,4,5
  RANK()       OVER w AS rank,       -- gaps on ties:      1,2,2,4,5
  DENSE_RANK() OVER w AS dense_rank, -- no gaps:           1,2,2,3,4
  NTILE(4)     OVER w AS quartile    -- split into N equal-sized buckets
FROM employees
WINDOW w AS (PARTITION BY department ORDER BY salary DESC);

-- The three ranking functions differ ONLY in how they treat ties, and the
-- difference is invisible until there are ties — so test with ties:
--   salaries 500, 400, 400, 300, 200
--   ROW_NUMBER  1, 2, 3, 4, 5   arbitrary tiebreak; the two 400s get 2 and 3
--   RANK        1, 2, 2, 4, 5   ties share a rank, then rank SKIPS ("3rd place
--                               doesn't exist because two people took 2nd")
--   DENSE_RANK  1, 2, 2, 3, 4   ties share a rank, no gap
--
-- ROW_NUMBER's tiebreak is NON-DETERMINISTIC. Two runs of the same query can
-- assign 2 and 3 to different employees, so a "top 3 per department" report can
-- change between refreshes. Add a unique tiebreaker to make it stable:
--   ORDER BY salary DESC, id
--
-- NTILE(n) splits the partition into n buckets as evenly as possible. When the
-- row count doesn't divide evenly the REMAINDER GOES TO THE EARLIER BUCKETS:
-- NTILE(4) over 10 rows gives bucket sizes 3, 3, 2, 2 — not 2, 2, 3, 3. This is
-- why NTILE is a poor fit for true percentiles on small partitions; use
-- PERCENT_RANK() or CUME_DIST() when the exact cut point matters.

-- Top-N per group: "Top 3 earners per department"
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY department ORDER BY salary DESC
  ) AS rn
  FROM employees
)
SELECT * FROM ranked WHERE rn <= 3;`}
      </CodeBlock>

      <InfoBox variant="tip" title="DISTINCT ON vs ROW_NUMBER for Top-1-Per-Group">
        <p>
          If you only need the <em>single</em> top row per group (not top-N), Postgres's{' '}
          <code>SELECT DISTINCT ON (department) * FROM employees ORDER BY department, salary DESC</code>{' '}
          is more concise than a <code>ROW_NUMBER()</code> CTE. Reach for <code>ROW_NUMBER()</code>{' '}
          once N {'>'} 1, or when you need the rank value itself in the output.
        </p>
      </InfoBox>

      <h2>LAG, LEAD & Offset Functions</h2>

      <CodeBlock language="sql" title="Comparing Current Row to Previous/Next" showLineNumbers={true}>
{`-- Month-over-month revenue change
SELECT
  month,
  revenue,
  LAG(revenue, 1) OVER (ORDER BY month)  AS prev_month,
  revenue - LAG(revenue, 1) OVER (ORDER BY month) AS mom_change,
  ROUND(
    100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
    / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 2
  ) AS mom_pct_change,
  FIRST_VALUE(revenue) OVER (ORDER BY month) AS first_month_rev,
  LAST_VALUE(revenue)  OVER (
    ORDER BY month
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS last_month_rev
FROM monthly_revenue;

-- Session analysis: time between events
SELECT
  user_id,
  event_time,
  event_type,
  event_time - LAG(event_time) OVER (
    PARTITION BY user_id ORDER BY event_time
  ) AS time_since_last_event,
  LEAD(event_type) OVER (
    PARTITION BY user_id ORDER BY event_time
  ) AS next_action
FROM user_events;`}
      </CodeBlock>

      <InfoBox variant="warning" title="LAST_VALUE Trap">
        <p>
          When <code>OVER</code> has an <code>ORDER BY</code> and you don't write a frame, the
          default is <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> —{' '}
          <strong>RANGE</strong>, not ROWS. The frame therefore ends at the last row that{' '}
          <em>ties</em> with the current row on the ORDER BY expression, not at the current row
          itself. So <code>LAST_VALUE</code> with the default frame returns the current row's value
          (or its last peer), never the partition's true last value. You almost always want an
          explicit <code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code>.
        </p>
        <p>
          The RANGE-vs-ROWS distinction is invisible until there are ties, which is exactly why it
          bites in production. With rows <code>(d=1,10), (d=2,20), (d=2,30), (d=3,40)</code>,{' '}
          <code>SUM(amt) OVER (ORDER BY d)</code> gives <code>10, 60, 60, 100</code> — both{' '}
          <code>d=2</code> rows already include each other — while{' '}
          <code>SUM(amt) OVER (ORDER BY d ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)</code>{' '}
          gives <code>10, 30, 60, 100</code>. If you want a true row-by-row running total, say{' '}
          <code>ROWS</code> explicitly.
        </p>
      </InfoBox>

      <h2>Frame Specifications — The Deep Cut</h2>

      <p>The frame defines which rows within the partition the function operates over. This is where window functions become truly powerful.</p>

      <CodeBlock language="sql" title="Frame Specifications: ROWS vs RANGE vs GROUPS" showLineNumbers={true}>
{`-- Running total
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
    AS running_total
FROM transactions;

-- 7-day moving average (physical row-based)
SELECT date, amount,
  AVG(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    AS moving_avg_7day
FROM daily_sales;

-- RANGE: value-based frame (handles ties differently than ROWS)
-- "Sum of all transactions on the same date and before"
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
    AS running_total_by_date
FROM transactions;

-- GROUPS: frame counts PEER GROUPS (rows tied by ORDER BY) as single units --
-- not physical rows (ROWS) and not value distance (RANGE). Verified on 18.6
-- against a leaderboard(name, score) table: Alice/Bob=100, Carol=90,
-- Dave/Eve/Frank=80, Grace=70.
SELECT name, score,
  SUM(score) OVER (
    ORDER BY score DESC
    GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW
  ) AS tier_and_prior_tier
FROM leaderboard
ORDER BY score DESC, name;
--  name  | score | tier_and_prior_tier
-- -------+-------+----------------------
--  Alice |   100 |                  200   <- just the 100-tier (100+100); no earlier tier exists
--  Bob   |   100 |                  200   <- SAME value as Alice: GROUPS gives every tied row
--                                             the identical frame, because they're one peer group
--  Carol |    90 |                  290   <- 100-tier (200) + Carol's own 90-tier (90)
--  Dave  |    80 |                  330   <- 90-tier (90) + 80-tier (240) -- all three 80s agree
--  Eve   |    80 |                  330
--  Frank |    80 |                  330
--  Grace |    70 |                  310   <- 80-tier (240) + Grace's own 70-tier (70)
--
-- The same ROWS BETWEEN 1 PRECEDING AND CURRENT ROW on this data would instead
-- split ties by whatever arbitrary order the tied rows come back in. Reach for
-- GROUPS when "the previous DISTINCT value" is literally the question being
-- asked -- e.g. "this rank and the rank above it" -- regardless of how many
-- rows share each value. It's also the only offset frame of the three that
-- works on a non-numeric ORDER BY (text, for instance): RANGE's PRECEDING/
-- FOLLOWING offset requires a numeric/date/interval column to do arithmetic
-- on, which GROUPS never needs since it only counts distinct peer groups.

-- Percentage of department total
SELECT name, department, salary,
  ROUND(100.0 * salary / SUM(salary) OVER (PARTITION BY department), 2)
    AS pct_of_dept_total,
  ROUND(100.0 * salary / SUM(salary) OVER (), 2)
    AS pct_of_company_total
FROM employees;

-- Cumulative distribution
SELECT name, salary,
  CUME_DIST()    OVER (ORDER BY salary) AS cumulative_dist,
  PERCENT_RANK() OVER (ORDER BY salary) AS percent_rank
FROM employees;`}
      </CodeBlock>

      <InfoBox variant="tip" title="Named Windows for Readability">
        <p>
          When using the same window definition multiple times, use the <code>WINDOW</code> clause
          to name it: <code>WINDOW w AS (PARTITION BY dept ORDER BY salary DESC)</code>.
          Then reference it: <code>ROW_NUMBER() OVER w</code>. Cleaner and DRY.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
