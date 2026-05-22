import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SqlWindow() {
  return (
    <LessonLayout
      title="Window Functions"
      sectionId="sql"
      lessonIndex={2}
      prev={{ path: "/sql/joins", label: "Joins & Subqueries" }}
      next={{ path: "/sql/indexing", label: "Indexing & Performance" }}
    >
      <p>Window functions perform calculations across a set of related rows without collapsing them into groups. They are one of SQL most powerful features for analytics.</p>

      <h2>Window Function Syntax</h2>
      <CodeBlock language="sql" title="OVER and PARTITION BY">
{`-- Syntax: function() OVER (PARTITION BY ... ORDER BY ... ROWS/RANGE ...)

-- Row number within each department
SELECT name, department, salary,
       ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM employees;

-- Running total of sales by date
SELECT date, amount,
       SUM(amount) OVER (ORDER BY date) as running_total
FROM sales;

-- Running total reset per month
SELECT date, amount,
       SUM(amount) OVER (
           PARTITION BY DATE_TRUNC('month', date)
           ORDER BY date
       ) as monthly_running_total
FROM sales;

-- Cumulative percentage
SELECT name, score,
       score / SUM(score) OVER () * 100 as pct_of_total
FROM test_results;`}
      </CodeBlock>

      <h2>Ranking Functions</h2>
      <CodeBlock language="sql" title="RANK, DENSE_RANK, NTILE">
{`-- ROW_NUMBER — unique sequential number (no ties)
-- RANK       — same rank for ties, gaps in numbers (1,1,3)
-- DENSE_RANK — same rank for ties, no gaps      (1,1,2)
-- PERCENT_RANK — rank as percentage 0.0 to 1.0

SELECT
    name, score,
    ROW_NUMBER()   OVER (ORDER BY score DESC) as row_num,
    RANK()         OVER (ORDER BY score DESC) as rank,
    DENSE_RANK()   OVER (ORDER BY score DESC) as dense_rank,
    NTILE(4)       OVER (ORDER BY score DESC) as quartile
FROM scores;

-- Get top-N per group (top 3 products per category)
WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) as rn
    FROM products
)
SELECT * FROM ranked WHERE rn <= 3;`}
      </CodeBlock>

      <h2>LAG and LEAD — Access Adjacent Rows</h2>
      <CodeBlock language="sql" title="LAG and LEAD">
{`-- LAG — previous row's value
-- LEAD — next row's value

SELECT date, revenue,
    LAG(revenue) OVER (ORDER BY date) as prev_day,
    LEAD(revenue) OVER (ORDER BY date) as next_day,
    revenue - LAG(revenue) OVER (ORDER BY date) as day_over_day_change,
    revenue / NULLIF(LAG(revenue) OVER (ORDER BY date), 0) - 1 as growth_rate
FROM daily_revenue;

-- Month-over-month comparison
SELECT month, revenue,
    LAG(revenue, 1) OVER (ORDER BY month) as prev_month,
    LAG(revenue, 12) OVER (ORDER BY month) as same_month_last_year
FROM monthly_revenue;`}
      </CodeBlock>

      <InfoBox variant="info" title="Window Frames">
        <p>ROWS BETWEEN defines the window frame: ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW (running total), ROWS BETWEEN 6 PRECEDING AND CURRENT ROW (7-day rolling average), ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING (full partition).</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between RANK() and DENSE_RANK()?"
        options={["They are identical", "RANK leaves gaps after ties (1,1,3); DENSE_RANK has no gaps (1,1,2)", "DENSE_RANK is faster", "RANK only works with numeric values"]}
        correctIndex={1}
        explanation="Both assign the same rank to tied rows. RANK() leaves gaps — if two rows tie for rank 1, the next row gets rank 3. DENSE_RANK() has no gaps — the next row after the tied pair gets rank 2. Use DENSE_RANK when you want consecutive rankings."
      />
    </LessonLayout>
  );
}
