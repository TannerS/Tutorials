import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';
import SqlPlaygroundWidget from '../../components/SqlPlayground';

export default function SqlPlaygroundLesson() {
  return (
    <LessonLayout
      title="🗄️ SQL Playground"
      sectionId="playground"
      lessonIndex={5}
      prev={{ path: '/playground/sass-playground', label: 'Sass/SCSS Playground' }}
      next={null}
    >
      <p>
        This is a real SQLite database — the actual SQLite engine, compiled to
        WebAssembly, running in this tab. It is seeded with two small tables and
        it is fully mutable: <code>INSERT</code>, <code>UPDATE</code>,{' '}
        <code>DELETE</code>, and <code>CREATE TABLE</code> all work, and the
        results stick until you reset or reload.
      </p>

      <InfoBox variant="note" title="In-memory, private, and disposable">
        <p>
          The database lives in your browser&apos;s memory only. Nothing is sent
          anywhere, nothing is saved, and every reload starts from the same seed
          data — so you can drop a table without consequence. Queries only run
          when you press <strong>Run query</strong> (or <kbd>⌘/Ctrl</kbd> +{' '}
          <kbd>Enter</kbd>), deliberately: auto-running on every keystroke would
          re-execute an <code>INSERT</code> on every character you typed.
        </p>
      </InfoBox>

      <h2>The schema</h2>
      <CodeBlock language="sql" title="Seed schema">
{`CREATE TABLE users (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  signup_date TEXT    NOT NULL
);

CREATE TABLE orders (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  product    TEXT    NOT NULL,
  amount     REAL    NOT NULL,
  created_at TEXT    NOT NULL
);`}
      </CodeBlock>
      <p>
        Six users, eight orders. One user (Margaret Hamilton) deliberately has no
        orders at all, so you can see the difference a <code>LEFT JOIN</code>{' '}
        makes.
      </p>

      <h2>Playground</h2>
      <SqlPlaygroundWidget />

      <h2>The execution order that explains most SQL confusion</h2>
      <p>
        SQL is written in one order and evaluated in a different one. Almost every
        &quot;why can&apos;t I do that?&quot; question dissolves once you know the
        real sequence:
      </p>
      <ol>
        <li><code>FROM</code> / <code>JOIN</code> — assemble the rows</li>
        <li><code>WHERE</code> — filter individual rows</li>
        <li><code>GROUP BY</code> — collapse rows into groups</li>
        <li><code>HAVING</code> — filter the groups</li>
        <li><code>SELECT</code> — pick and compute the output columns (aliases exist only from here on)</li>
        <li><code>ORDER BY</code> — sort</li>
        <li><code>LIMIT</code> — take the top slice</li>
      </ol>
      <p>
        That ordering is why <code>WHERE COUNT(*) &gt; 1</code> is an error — the
        counts don&apos;t exist yet at step 2, so you need <code>HAVING</code>. Try it
        in the playground: SQLite answers with{' '}
        <code>misuse of aggregate: COUNT()</code>.
      </p>

      <InfoBox variant="warning" title="SQLite is more permissive about aliases than the standard">
        <p>
          The usual companion rule is &quot;you can <code>ORDER BY</code> a{' '}
          <code>SELECT</code> alias but you can&apos;t <code>WHERE</code> on one,&quot;
          because <code>WHERE</code> runs before <code>SELECT</code> computes the
          aliases. That is true in PostgreSQL and SQL Server — and{' '}
          <strong>not</strong> true here. SQLite (like MySQL) accepts{' '}
          <code>SELECT amount AS total FROM orders WHERE total &gt; 100</code> as a
          convenience extension, and it runs fine in this playground.
        </p>
        <p>
          Worth knowing because it cuts both ways: a query you develop against
          SQLite or MySQL can fail with{' '}
          <code>column &quot;total&quot; does not exist</code> the moment it reaches
          Postgres. The portable fix is to repeat the expression in the{' '}
          <code>WHERE</code>, or wrap the query in a subquery/CTE so the alias
          genuinely exists by the time you filter on it.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="JOIN vs. LEFT JOIN, in one experiment">
        <p>
          Load the <strong>GROUP BY</strong> example, delete the{' '}
          <code>HAVING COUNT(o.id) &gt; 0</code> line, and run it. Margaret appears
          with <code>order_count = 0</code> and a <code>NULL</code> total, because{' '}
          <code>LEFT JOIN</code> keeps every row from the left table whether or not
          it matched. Now change <code>LEFT JOIN</code> to plain <code>JOIN</code>{' '}
          and run again — she vanishes entirely. An inner join silently drops
          unmatched rows, which is the single most common way a report ends up
          quietly under-counting.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="COUNT(*) vs COUNT(column)">
        <p>
          <code>COUNT(*)</code> counts <em>rows</em>. <code>COUNT(o.id)</code>{' '}
          counts <strong>non-NULL values</strong> of that column. On a{' '}
          <code>LEFT JOIN</code> that distinction is the whole ballgame: for
          Margaret, <code>COUNT(*)</code> returns 1 (there is one output row, all
          of its order columns NULL) while <code>COUNT(o.id)</code> correctly
          returns 0. Swap them in the playground and watch the number change.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="What a window function does that GROUP BY can't">
        <p>
          Example 5 introduces CTEs, <code>ROW_NUMBER()</code>, <code>PARTITION BY</code>{' '}
          and <code>OVER</code> all at once, which is a lot. Take it apart in two runs.
        </p>
        <p>
          First, see the CTE&apos;s own contents by removing the filter — run just the{' '}
          inner query, selecting <code>rank_in_group</code> too. All <strong>eight</strong>{' '}
          order rows come back, still one row per order, but each now carries its user&apos;s{' '}
          <code>user_total</code> beside it: Grace&apos;s three orders each show{' '}
          <code>637.95</code>. Nothing was collapsed. That is the definition of a window
          function — it computes <em>across</em> a group of rows while leaving those rows
          intact.
        </p>
        <p>
          Now contrast: <code>SELECT u.name, SUM(o.amount) … GROUP BY u.id</code> returns{' '}
          <strong>five</strong> rows and the product names are simply gone — aggregation
          destroyed the detail to produce the total. Both queries compute the same sums;
          only the window version can show you a total and the individual order that
          produced it on the same line. That is also why the outer{' '}
          <code>WHERE rank_in_group = 1</code> has to live outside the CTE:{' '}
          <code>ROW_NUMBER()</code> is assigned at <code>SELECT</code> time, so there is no
          rank to filter on until the CTE has finished.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
