import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function Database() {
  return (
    <LessonLayout
      title="Database Access Without an ORM"
      sectionId="go"
      lessonIndex={16}
      prev={{ path: '/go/http', label: 'HTTP Services with net/http' }}
      next={{ path: '/go/deploy', label: 'Project Layout, Build & Deploy' }}
    >
      <p>
        Coming from Node you probably reach for Prisma, TypeORM or Sequelize before writing a
        line of SQL. Coming from Java, Hibernate and JPA are so standard that{' '}
        <a href="/springboot/data">Spring Data</a> treats them as the default.
      </p>

      <p>
        Go's mainstream went the other way. The common stack is{' '}
        <strong><code>database/sql</code> plus SQL you wrote yourself</strong>, and that is not
        because the ecosystem lacks ORMs — GORM exists and is popular — but because the culture
        genuinely prefers the explicitness. Expect to write SQL here.
      </p>

      <InfoBox variant="info" title="Why the ORM-light culture persists">
        The usual arguments: SQL is already a good language for querying and an ORM's DSL is a
        lossy re-encoding of it; the N+1 query problem is invisible in ORM code and obvious in
        explicit queries; the mapping layer obscures what actually hits the database, which is
        the thing you profile. The usual counter-argument is equally real — you will write more
        boilerplate, and migrations and relations are genuinely more work by hand. It is a trade,
        not a free win, and <code>sqlc</code> (below) is the Go ecosystem's attempt to keep the
        explicitness while deleting the boilerplate.
      </InfoBox>

      <h2>The Shape of the Package</h2>

      <p>
        <code>database/sql</code> is a driver-agnostic layer — it provides connection pooling,
        statement handling and transactions, but knows nothing about any particular database. The
        driver is imported for its side effect of registering itself:
      </p>

      <CodeBlock language="go" title="Opening a pool">
{`import (
	"database/sql"
	_ "github.com/jackc/pgx/v5/stdlib"   // blank import: registers the driver
)

db, err := sql.Open("pgx", dsn)
if err != nil {
	return err
}
defer db.Close()

// sql.Open does NOT connect. It validates arguments and returns a lazy pool.
// Ping is what actually establishes a connection and tells you the DSN works.
if err := db.PingContext(ctx); err != nil {
	return fmt.Errorf("database unreachable: %w", err)
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="*sql.DB is a pool, not a connection">
        This trips up people from every background. <code>sql.Open</code> returns a handle to a{' '}
        <em>pool</em>, it is safe for concurrent use by many goroutines, and you create exactly
        one for your whole process and pass it around. Opening one per request is a serious
        performance bug. It is also lazy — if your DSN is wrong, <code>sql.Open</code> succeeds
        and the failure shows up later, which is why <code>PingContext</code> at startup is
        standard.
      </InfoBox>

      <h2>Querying, and the Two Things Everyone Forgets</h2>

      <p>
        Every call has a <code>Context</code> variant and you should use it exclusively —{' '}
        <code>QueryContext</code>, <code>QueryRowContext</code>, <code>ExecContext</code>. That
        is what makes a slow query cancellable when the client disconnects, per{' '}
        <a href="/go/context">the context lesson</a>.
      </p>

      <CodeBlock language="go" title="Multiple rows — note the two easy-to-miss lines">
{`rows, err := db.QueryContext(ctx, \`SELECT id, name FROM users ORDER BY id\`)
if err != nil {
	return nil, err
}
defer rows.Close()          // (1) ALWAYS — leaks a connection otherwise

var users []User
for rows.Next() {
	var u User
	if err := rows.Scan(&u.ID, &u.Name); err != nil {
		return nil, err
	}
	users = append(users, u)
}

// (2) rows.Next() returns false on error AND on clean completion.
//     Without this check, a mid-iteration failure silently looks like
//     "that's all the rows" and you return a short result set as success.
if err := rows.Err(); err != nil {
	return nil, err
}
return users, nil`}
      </CodeBlock>

      <p>
        Those two lines are the classic Go database bugs. Omitting <code>rows.Close()</code>{' '}
        leaks a pooled connection per call, and the symptom is a service that works under light
        load and deadlocks under real traffic once the pool is exhausted. Omitting{' '}
        <code>rows.Err()</code> turns a network failure halfway through a result set into a
        truncated list returned with <code>nil</code> error — a data-correctness bug that no test
        with a healthy database will ever catch.
      </p>

      <h2>Single Rows and the Missing-Row Case</h2>

      <CodeBlock language="go" title="QueryRow and sql.ErrNoRows">
{`var u User
err := db.QueryRowContext(ctx,
	\`SELECT id, name, email FROM users WHERE name = ?\`, "Ada",
).Scan(&u.ID, &u.Name, &u.Email)

if errors.Is(err, sql.ErrNoRows) {
	return nil, ErrUserNotFound     // "no rows" is usually NOT a server error
}
if err != nil {
	return nil, err                 // this one is
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — verified against SQLite">
{`ping ok; pool configured
rows inserted: 2
found: id=1 name=Ada email="ada@example.com" valid=true
missing row -> ErrNoRows: true
grace email valid=false (NULL handled)
iterated 2 rows; rows.Err()=<nil>
after rollback, total users: 2`}
      </CodeBlock>

      <p>
        Distinguishing <code>sql.ErrNoRows</code> from a real failure is what lets a handler
        return <strong>404</strong> instead of <strong>500</strong>. It is matched with{' '}
        <code>errors.Is</code> like any other sentinel — see{' '}
        <a href="/go/errors">Errors Are Values</a>.
      </p>

      <h2>NULL Is Not the Zero Value</h2>

      <p>
        SQL <code>NULL</code> does not map onto a Go zero value, and scanning a NULL into a plain{' '}
        <code>string</code> fails at runtime. The <code>sql.Null*</code> types carry the
        distinction:
      </p>

      <CodeBlock language="go" title="Nullable columns">
{`type User struct {
	ID    int64
	Name  string
	Email sql.NullString     // NOT string — this column is nullable
}

// After scanning a NULL:
//   u.Email.Valid  == false
//   u.Email.String == ""     ← indistinguishable from an empty string
//                              without checking Valid first

if u.Email.Valid {
	send(u.Email.String)
}`}
      </CodeBlock>

      <p>
        The verified run above shows both cases: Ada's email scanned with{' '}
        <code>valid=true</code>, Grace's NULL scanned with <code>valid=false</code>. Go 1.22
        added the generic <code>sql.Null[T]</code> if you prefer{' '}
        <code>sql.Null[string]</code> over the older named types.
      </p>

      <h2>Placeholders, Always</h2>

      <CodeBlock language="go" title="The only acceptable way to put a value in a query">
{`// ✓ The driver sends value and statement separately. Injection is impossible.
db.QueryContext(ctx, \`SELECT * FROM users WHERE email = $1\`, email)

// ✗ Never. Not with validation, not "just this once", not for an internal tool.
db.QueryContext(ctx, "SELECT * FROM users WHERE email = '" + email + "'")`}
      </CodeBlock>

      <InfoBox variant="danger" title="Placeholder syntax is driver-specific">
        PostgreSQL uses <code>$1, $2</code>; MySQL and SQLite use <code>?</code>; Oracle uses{' '}
        <code>:name</code>. This is a real portability seam — queries do not move between
        databases unchanged, and it is one of the few places an ORM genuinely buys you something.
        Note also that placeholders work for <em>values</em> only. A dynamic table or column name
        cannot be parameterised, so if you need one, validate it against an allow-list of known
        identifiers rather than interpolating user input.
      </InfoBox>

      <h2>Transactions</h2>

      <CodeBlock language="go" title="The defer-rollback idiom">
{`tx, err := db.BeginTx(ctx, nil)
if err != nil {
	return err
}
defer tx.Rollback()      // no-op if Commit already succeeded — safe to always defer

if _, err := tx.ExecContext(ctx, \`UPDATE accounts SET balance = balance - $1 WHERE id = $2\`,
	amount, from); err != nil {
	return err           // the deferred Rollback fires
}
if _, err := tx.ExecContext(ctx, \`UPDATE accounts SET balance = balance + $1 WHERE id = $2\`,
	amount, to); err != nil {
	return err
}

return tx.Commit()`}
      </CodeBlock>

      <p>
        <code>defer tx.Rollback()</code> immediately after <code>BeginTx</code> is the idiom
        worth memorising. After a successful <code>Commit</code> the rollback is a harmless
        no-op, so there is no branch to get wrong — and every early return, including a panic,
        unwinds the transaction correctly. The verified output above confirms the rollback left
        the table at its pre-transaction count.
      </p>

      <InfoBox variant="warning" title="A transaction holds one connection for its lifetime">
        Everything between <code>BeginTx</code> and <code>Commit</code> is pinned to a single
        pooled connection. Long transactions therefore starve the pool, and doing anything slow
        inside one — an HTTP call, say — blocks a connection other requests need. Keep
        transactions short and strictly database-only.
      </InfoBox>

      <h2>Pool Configuration</h2>

      <p>
        The defaults are not production settings, and this is something a Node developer has
        likely never had to think about:
      </p>

      <CodeBlock language="go" title="Settings worth being deliberate about">
{`db.SetMaxOpenConns(25)                  // default: UNLIMITED — can exhaust the server
db.SetMaxIdleConns(25)                  // default: 2 — too low; causes churn
db.SetConnMaxLifetime(30 * time.Minute) // default: forever — rotate for failover/LB
db.SetConnMaxIdleTime(5 * time.Minute)  // reclaim idle capacity`}
      </CodeBlock>

      <p>
        <code>SetMaxOpenConns</code> matters most: unlimited means a traffic spike opens
        connections until Postgres refuses them, converting a slow service into a hard outage.
        Set it below your database's limit divided by your replica count. And keep{' '}
        <code>MaxIdleConns</code> close to <code>MaxOpenConns</code> — the default of 2 means
        connections are constantly closed and reopened under load, which shows up as mysterious
        latency.
      </p>

      <h2>The Ecosystem, Honestly</h2>

      <CodeBlock language="text" title="What people actually reach for">
{`database/sql    stdlib. Driver-agnostic. Verbose but universal.

pgx             Postgres-specific driver. Faster than going through
                database/sql, supports Postgres types the generic
                interface cannot express. The default for new
                Postgres work; usable either standalone or as a
                database/sql driver.

sqlx            Thin layer over database/sql. Adds StructScan and
                named parameters, deletes most Scan boilerplate,
                changes nothing conceptually. Low-risk adoption.

sqlc            Generates type-safe Go from your .sql files at build
                time. You still write SQL; the mapping code is
                generated. Increasingly the favoured answer because
                it removes boilerplate without hiding the query.

GORM            A full ORM. Associations, migrations, hooks. Popular,
                and the usual criticism is the usual ORM criticism:
                the generated SQL is hard to predict and harder to
                tune. Reasonable for CRUD-shaped apps.`}
      </CodeBlock>

      <p>
        If you want the shortest path from a Node background: start with{' '}
        <code>database/sql</code> plus <code>pgx</code> so you understand the layer, then adopt{' '}
        <code>sqlc</code> once the <code>Scan</code> boilerplate starts to grate. Reaching
        straight for GORM because it resembles Prisma tends to mean fighting the ecosystem's
        conventions later.
      </p>

      <h2>Key Takeaways</h2>

      <p>
        <strong>Expect to write SQL</strong> — the Go mainstream is <code>database/sql</code>{' '}
        and hand-written queries, and the tooling assumes it.{' '}
        <strong><code>*sql.DB</code> is a concurrent pool, created once per process</strong>, and{' '}
        <code>sql.Open</code> does not connect, so ping at startup.{' '}
        <strong>Always <code>defer rows.Close()</code> and always check{' '}
        <code>rows.Err()</code></strong> — the first leaks connections, the second silently
        truncates result sets. <strong>Handle <code>sql.ErrNoRows</code> separately</strong> so
        missing rows become 404s rather than 500s. <strong>Use <code>sql.Null*</code> for
        nullable columns</strong>, because NULL is not the zero value.{' '}
        <strong>Placeholders for every value, no exceptions</strong>, and note the syntax is
        driver-specific. <strong><code>defer tx.Rollback()</code> right after{' '}
        <code>BeginTx</code></strong>. And <strong>configure the pool</strong> — the default of
        unlimited connections turns a spike into an outage.
      </p>

      <p>
        Next: <strong><a href="/go/deploy">Project Layout, Build &amp; Deploy</a></strong> — the
        last lesson, and the one that ships what you have built across these three. It is also
        where the claim <a href="/go/intro">the intro</a> opened this whole section with finally
        gets cashed out: the service you now have, handlers and SQL and pool configuration
        included, deploys as a single file with no runtime to install.
      </p>
    </LessonLayout>
  );
}
