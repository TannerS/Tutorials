import { useCallback, useEffect, useRef, useState } from 'react';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { Database, QueryExecResult, SqlJsStatic } from 'sql.js';

// Seeded into a fresh in-memory SQLite database on load (and on every reset).
// Small on purpose — big enough for real JOINs and GROUP BYs, small enough
// that you can hold the whole dataset in your head while writing a query.
const SEED_SQL = `
CREATE TABLE users (
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
);

INSERT INTO users (id, name, email, signup_date) VALUES
  (1, 'Ada Lovelace',       'ada@example.com',       '2023-01-14'),
  (2, 'Grace Hopper',       'grace@example.com',     '2023-02-02'),
  (3, 'Alan Turing',        'alan@example.com',      '2023-03-19'),
  (4, 'Katherine Johnson',  'katherine@example.com', '2023-05-07'),
  (5, 'Linus Torvalds',     'linus@example.com',     '2024-01-23'),
  (6, 'Margaret Hamilton',  'margaret@example.com',  '2024-04-11');

INSERT INTO orders (id, user_id, product, amount, created_at) VALUES
  (1, 1, 'Mechanical Keyboard',         149.99, '2024-01-05'),
  (2, 1, 'USB-C Hub',                    59.50, '2024-02-11'),
  (3, 2, 'Standing Desk',               429.00, '2024-01-22'),
  (4, 2, 'Monitor Arm',                  89.95, '2024-03-02'),
  (5, 2, 'Webcam',                      119.00, '2024-06-14'),
  (6, 3, 'Noise-Cancelling Headphones', 279.00, '2024-02-28'),
  (7, 4, 'Ergonomic Chair',             540.00, '2024-04-09'),
  (8, 5, 'Laptop Stand',                 39.99, '2024-07-30');
`;

interface Snippet {
  id: string;
  title: string;
  blurb: string;
  sql: string;
}

const SNIPPETS: Snippet[] = [
  {
    id: 'select-all',
    title: '1. SELECT — read a whole table',
    blurb: 'SELECT * grabs every column. Fine while exploring; name your columns in real code so the result set does not change under you when the schema does.',
    sql: `SELECT * FROM users;`,
  },
  {
    id: 'where',
    title: '2. WHERE + ORDER BY — filter and sort',
    blurb: 'WHERE filters rows before they are returned; ORDER BY sorts what survives. Note SQLite lets you WHERE on a SELECT alias as a convenience extension — PostgreSQL rejects that, so do not rely on it.',
    sql: `SELECT product, amount, created_at
FROM orders
WHERE amount > 100
ORDER BY amount DESC;`,
  },
  {
    id: 'join',
    title: '3. JOIN — combine two tables',
    blurb: 'The ON clause states how the two tables relate. Omit it (or make it always-true) and you get a cartesian product — all 8 orders times all 6 users, 48 rows. Try deleting the ON clause and running it.',
    sql: `SELECT
  u.name,
  o.product,
  o.amount
FROM orders AS o
JOIN users AS u ON u.id = o.user_id
ORDER BY u.name, o.amount DESC;`,
  },
  {
    id: 'group-by',
    title: '4. GROUP BY — aggregate per user',
    blurb: 'LEFT JOIN keeps users with no orders; HAVING filters on the aggregate (WHERE cannot, because it runs before grouping). Drop the HAVING to see Margaret appear with a count of 0.',
    sql: `SELECT
  u.name,
  COUNT(o.id)              AS order_count,
  ROUND(SUM(o.amount), 2)  AS total_spent,
  ROUND(AVG(o.amount), 2)  AS avg_order
FROM users AS u
LEFT JOIN orders AS o ON o.user_id = u.id
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC;`,
  },
  {
    id: 'cte-window',
    title: '5. CTE + window function — biggest order per user',
    blurb: 'A window function computes across a set of rows without collapsing them, so each row keeps its detail AND gets the group-level number.',
    sql: `WITH ranked AS (
  SELECT
    u.name,
    o.product,
    o.amount,
    ROW_NUMBER() OVER (PARTITION BY o.user_id ORDER BY o.amount DESC) AS rank_in_group,
    SUM(o.amount)  OVER (PARTITION BY o.user_id)                      AS user_total
  FROM orders AS o
  JOIN users AS u ON u.id = o.user_id
)
SELECT name, product, amount, user_total
FROM ranked
WHERE rank_in_group = 1
ORDER BY user_total DESC;`,
  },
  {
    id: 'insert',
    title: '6. INSERT — the database is really live',
    blurb: 'Run this twice and you will insert the row twice — this is a real, mutable database, not a canned response. Reset to get back to the seed data.',
    sql: `INSERT INTO orders (user_id, product, amount, created_at)
VALUES (6, 'Apollo Guidance Manual', 74.25, '2024-08-01');

SELECT u.name, o.product, o.amount
FROM orders AS o
JOIN users AS u ON u.id = o.user_id
WHERE u.name = 'Margaret Hamilton';`,
  },
];

type Status = 'loading' | 'ready' | 'error';

export default function SqlPlayground() {
  const [status, setStatus] = useState<Status>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snippetId, setSnippetId] = useState(SNIPPETS[0]!.id);
  const [query, setQuery] = useState(SNIPPETS[0]!.sql);
  const [results, setResults] = useState<QueryExecResult[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // The live SQLite handle and its constructor live in refs — they're mutable
  // WASM objects, and re-rendering must not recreate the database.
  const dbRef = useRef<Database | null>(null);
  const sqlRef = useRef<SqlJsStatic | null>(null);

  const runQuery = useCallback((sql: string) => {
    const db = dbRef.current;
    if (!db) return;
    try {
      const res = db.exec(sql);
      setResults(res);
      setQueryError(null);
      setNotice(
        res.length === 0
          ? `Statement executed — ${db.getRowsModified()} row(s) modified. No result set to display.`
          : null,
      );
    } catch (e) {
      setResults([]);
      setNotice(null);
      setQueryError(e instanceof Error ? e.message : 'Query failed.');
    }
  }, []);

  const seedDatabase = useCallback(() => {
    const SQL = sqlRef.current;
    if (!SQL) return;
    dbRef.current?.close();
    const db = new SQL.Database();
    db.run(SEED_SQL);
    dbRef.current = db;
  }, []);

  // SQLite is a ~1.5 MB WASM binary plus its JS loader, so both are pulled in
  // on demand rather than imported at the top of the file. Two stages: load
  // the module, then build and seed the database.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const SQL = await loadSqlJs();
        if (cancelled) return;
        sqlRef.current = SQL;
        seedDatabase();
        runQuery(SNIPPETS[0]!.sql);
        setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Could not load SQLite.');
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
      dbRef.current?.close();
      dbRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSnippetChange = (id: string) => {
    const snippet = SNIPPETS.find((s) => s.id === id);
    if (!snippet) return;
    setSnippetId(id);
    setQuery(snippet.sql);
  };

  const handleReset = () => {
    seedDatabase();
    setNotice('Database reset to the original seed data.');
    setResults([]);
    setQueryError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery(query);
    }
  };

  const activeSnippet = SNIPPETS.find((s) => s.id === snippetId);

  return (
    <div className="interactive-embed" style={{
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      background: 'var(--bg-secondary)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.85rem 1.1rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'flex-end',
      }}>
        <label style={labelStyle}>
          Load example
          <select value={snippetId} onChange={(e) => handleSnippetChange(e.target.value)} style={selectStyle}>
            {SNIPPETS.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </label>

        <button type="button" onClick={() => runQuery(query)} disabled={status !== 'ready'} style={runButtonStyle}>
          ▶ Run query <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>(⌘/Ctrl + ⏎)</span>
        </button>

        <button type="button" onClick={handleReset} disabled={status !== 'ready'} style={resetButtonStyle}>
          ↺ Reset data
        </button>

        <span style={{
          marginLeft: 'auto',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: status === 'error' ? 'var(--accent-red, #f87171)' : 'var(--text-secondary)',
        }}>
          {status === 'loading' && 'Loading SQLite (WASM)…'}
          {status === 'error' && 'Failed to load'}
          {status === 'ready' && 'SQLite ready — in-memory'}
        </span>
      </div>

      {activeSnippet && (
        <div style={{
          padding: '0.5rem 1.1rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}>
          {activeSnippet.blurb}
        </div>
      )}

      <div className="js-playground-split">
        <div style={{ background: 'var(--bg-secondary)' }}>
          <div style={panelLabelStyle}>Query (SQL)</div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            disabled={status === 'error'}
            style={textareaStyle}
          />
        </div>

        <div style={{ background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
          <div style={panelLabelStyle}>Results</div>
          <div style={{ padding: '0 1rem 1rem', overflowX: 'auto', flex: 1 }}>
            {status === 'error' ? (
              <p style={{ color: 'var(--accent-red, #f87171)', fontSize: '0.85rem' }}>{loadError}</p>
            ) : status === 'loading' ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Downloading and starting the SQLite WASM engine…
              </p>
            ) : queryError ? (
              <pre style={{
                margin: 0,
                padding: '0.75rem 0.9rem',
                borderRadius: '8px',
                background: 'var(--accent-red-bg, #3b1a1a)',
                color: 'var(--accent-red, #f87171)',
                fontSize: '0.8rem',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'pre-wrap',
              }}>
                SQL error: {queryError}
              </pre>
            ) : (
              <>
                {notice && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 0 }}>{notice}</p>
                )}
                {results.map((r, i) => (
                  <ResultTable key={i} result={r} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultTable({ result }: { result: QueryExecResult }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          fontSize: '0.8rem',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <thead>
            <tr>
              {result.columns.map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left',
                    padding: '0.45rem 0.6rem',
                    borderBottom: '2px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.values.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderBottom: '1px solid var(--border-color)',
                      color: cell === null ? 'var(--text-secondary)' : 'var(--text-primary)',
                      fontStyle: cell === null ? 'italic' : 'normal',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cell === null ? 'NULL' : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        {result.values.length} row{result.values.length === 1 ? '' : 's'}
      </p>
    </div>
  );
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  const mod = await import('sql.js');
  const initSqlJs = mod.default ?? (mod as unknown as typeof mod.default);
  return initSqlJs({ locateFile: () => wasmUrl });
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  fontSize: '0.78rem',
  color: 'var(--text-secondary)',
};

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  padding: '0.4rem 0.6rem',
  fontSize: '0.85rem',
  minWidth: '300px',
};

const runButtonStyle: React.CSSProperties = {
  background: 'var(--accent-green, #22c55e)',
  color: '#04210f',
  border: 'none',
  borderRadius: '6px',
  padding: '0.45rem 0.9rem',
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer',
};

const resetButtonStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  padding: '0.45rem 0.9rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const panelLabelStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '360px',
  resize: 'vertical',
  padding: '0 1rem 1rem',
  background: 'transparent',
  color: 'var(--text-primary)',
  border: 'none',
  outline: 'none',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.85rem',
  lineHeight: 1.6,
  boxSizing: 'border-box',
};
