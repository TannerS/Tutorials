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
        That ordering is why <code>WHERE COUNT(*) &gt; 1</code> is an error (the
        counts don&apos;t exist yet at step 2 — use <code>HAVING</code>), and why{' '}
        <code>ORDER BY total_spent</code> works on an alias that{' '}
        <code>WHERE total_spent &gt; 100</code> cannot see.
      </p>

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
    </LessonLayout>
  );
}
