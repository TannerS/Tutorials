import { useEffect, useMemo, useState } from 'react';
import CodeBlock from './CodeBlock';

interface TsModule {
  transpileModule: (input: string, opts: unknown) => { outputText: string; diagnostics?: unknown[] };
  ScriptTarget: Record<string, number>;
  ModuleKind: Record<string, number>;
  JsxEmit: Record<string, number>;
  flattenDiagnosticMessageText: (msg: unknown, newline: string) => string;
}

interface Target {
  key: string;
  label: string;
  year: string;
}

const TARGETS: Target[] = [
  { key: 'ES3', label: 'ES3', year: '1999' },
  { key: 'ES5', label: 'ES5', year: '2009' },
  { key: 'ES2015', label: 'ES2015 (ES6)', year: '2015' },
  { key: 'ES2016', label: 'ES2016 (ES7)', year: '2016' },
  { key: 'ES2017', label: 'ES2017', year: '2017' },
  { key: 'ES2018', label: 'ES2018', year: '2018' },
  { key: 'ES2019', label: 'ES2019', year: '2019' },
  { key: 'ES2020', label: 'ES2020', year: '2020' },
  { key: 'ES2021', label: 'ES2021', year: '2021' },
  { key: 'ES2022', label: 'ES2022', year: '2022' },
  { key: 'ES2023', label: 'ES2023', year: '2023' },
  { key: 'ES2024', label: 'ES2024', year: '2024' },
  { key: 'ES2025', label: 'ES2025', year: '2025' },
  { key: 'ESNext', label: 'ESNext', year: 'no downleveling' },
];

interface JsxRuntime {
  key: 'React' | 'ReactJSX';
  label: string;
  blurb: string;
}

const RUNTIMES: JsxRuntime[] = [
  { key: 'React', label: 'Classic (React.createElement)', blurb: 'Pre-React-17. Every file needs "import React" in scope.' },
  { key: 'ReactJSX', label: 'Automatic (jsx-runtime)', blurb: 'React 17+ default. Auto-imports jsx()/jsxs() — no "import React" needed just for JSX.' },
];

interface Snippet {
  id: string;
  title: string;
  code: string;
}

const SNIPPETS: Snippet[] = [
  {
    id: 'basic',
    title: 'Basic Component',
    code: `function Greeting({ name }) {
  return <h1 className="title">Hello, {name}!</h1>;
}`,
  },
  {
    id: 'conditional',
    title: 'Conditional Rendering',
    code: `function Status({ isOnline }) {
  return (
    <div>
      {isOnline ? <span>🟢 Online</span> : <span>⚪ Offline</span>}
      {isOnline && <p>Last seen just now</p>}
    </div>
  );
}`,
  },
  {
    id: 'list',
    title: 'List Rendering',
    code: `function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}`,
  },
  {
    id: 'events',
    title: 'Event Handlers',
    code: `function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}`,
  },
  {
    id: 'fragment',
    title: 'Fragments',
    code: `function Row() {
  return (
    <>
      <td>Ada</td>
      <td>Lovelace</td>
    </>
  );
}`,
  },
  {
    id: 'spread',
    title: 'Prop Spreading & Children',
    code: `function Card({ children, ...rest }) {
  return (
    <div className="card" {...rest}>
      {children}
    </div>
  );
}`,
  },
];

export default function JsxCompilerPlayground() {
  const [ts, setTs] = useState<TsModule | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snippetId, setSnippetId] = useState<string>(SNIPPETS[0]!.id);
  const [source, setSource] = useState<string>(SNIPPETS[0]!.code);
  const [target, setTarget] = useState<string>('ES2022');
  const [runtime, setRuntime] = useState<JsxRuntime['key']>('ReactJSX');

  useEffect(() => {
    let cancelled = false;
    import('typescript')
      .then((mod) => {
        if (!cancelled) setTs((mod.default ?? mod) as unknown as TsModule);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load the TypeScript compiler. Check your connection and reload.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSnippetChange = (id: string) => {
    const snippet = SNIPPETS.find((s) => s.id === id);
    if (!snippet) return;
    setSnippetId(id);
    setSource(snippet.code);
  };

  const { output, error } = useMemo(() => {
    if (!ts) return { output: '', error: null };
    try {
      const result = ts.transpileModule(source, {
        fileName: 'input.tsx',
        compilerOptions: {
          target: ts.ScriptTarget[target],
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit[runtime],
          reportDiagnostics: true,
        },
        reportDiagnostics: true,
      });
      const diagnostics = (result.diagnostics ?? []) as Array<{ messageText: unknown }>;
      if (diagnostics.length > 0) {
        const message = diagnostics
          .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
          .join('\n');
        return { output: result.outputText, error: message };
      }
      return { output: result.outputText, error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Compilation failed.' };
    }
  }, [ts, source, target, runtime]);

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

        <label style={labelStyle}>
          JSX runtime
          <select value={runtime} onChange={(e) => setRuntime(e.target.value as JsxRuntime['key'])} style={selectStyle}>
            {RUNTIMES.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </label>

        <label style={{ ...labelStyle, marginLeft: 'auto' }}>
          Compile to
          <select value={target} onChange={(e) => setTarget(e.target.value)} style={selectStyle}>
            {TARGETS.map((t) => (
              <option key={t.key} value={t.key}>{t.label} — {t.year}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{
        padding: '0.5rem 1.1rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        {RUNTIMES.find((r) => r.key === runtime)?.blurb}
      </div>

      <div className="js-playground-split">
        <div style={{ background: 'var(--bg-secondary)' }}>
          <div style={panelLabelStyle}>Source (JSX)</div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            style={textareaStyle}
          />
        </div>
        <div style={{ background: 'var(--bg-secondary)' }}>
          <div style={panelLabelStyle}>
            Compiled output — {TARGETS.find((t) => t.key === target)?.label}, {runtime === 'React' ? 'classic' : 'automatic'} runtime
          </div>
          {loadError ? (
            <div style={{ padding: '1rem', color: 'var(--accent-red, #ef4444)', fontSize: '0.85rem' }}>{loadError}</div>
          ) : !ts ? (
            <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading the TypeScript compiler…</div>
          ) : (
            <CodeBlock language="javascript" showLineNumbers={false} code={output || '// (empty output)'} />
          )}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1.1rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--accent-red-bg, #3b1a1a)',
          color: 'var(--accent-red, #f87171)',
          fontSize: '0.8rem',
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: 'pre-wrap',
        }}>
          {error}
        </div>
      )}
    </div>
  );
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
  minWidth: '220px',
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
  minHeight: '320px',
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
