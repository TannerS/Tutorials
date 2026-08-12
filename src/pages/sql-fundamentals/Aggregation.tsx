import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
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

      <h2>WHERE vs HAVING</h2>

      <CodeBlock language="sql" title="WHERE vs HAVING — Know the Difference" showLineNumbers={true}>
{`-- WHERE filters rows BEFORE grouping
-- HAVING filters groups AFTER aggregation

-- "Departments with more than 5 senior engineers"
SELECT department, COUNT(*) AS senior_count
FROM employees
WHERE level >= 'Senior'       -- row-level filter (before GROUP BY)
GROUP BY department
HAVING COUNT(*) > 5           -- group-level filter (after GROUP BY)
ORDER BY senior_count DESC;

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
);`}
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
  NTILE(4)     OVER w AS quartile    -- split into N buckets
FROM employees
WINDOW w AS (PARTITION BY department ORDER BY salary DESC);

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
          The default frame is <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>.
          So <code>LAST_VALUE</code> with the default frame just returns the current row's value — useless.
          You almost always need <code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code>.
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

      <InteractiveChallenge
        question="What is the default frame specification when you use ORDER BY inside OVER()?"
        options={[
          'ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING',
          'RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW',
          'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW',
          'RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING',
        ]}
        correctIndex={1}
        explanation="When ORDER BY is specified, the default frame is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. Note it's RANGE, not ROWS — meaning ties are included. Without ORDER BY, the default is the entire partition."
        language="sql"
      />

      <InteractiveChallenge
        question="Which aggregate function counts only non-NULL values in a column?"
        options={[
          'COUNT(*)',
          'COUNT(column_name)',
          'SUM(column_name)',
          'COUNT(DISTINCT column_name)',
        ]}
        correctIndex={1}
        explanation="COUNT(column_name) counts only non-NULL values in that column. COUNT(*) counts all rows regardless of NULLs. COUNT(DISTINCT column_name) counts unique non-NULL values. SUM adds values, it doesn't count them."
        language="sql"
      />
    </LessonLayout>
  );
}
