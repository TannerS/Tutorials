import { useEffect, useRef, useState } from 'react';

interface Diagnostic {
  start: number;
  length: number;
  line: number;
  character: number;
  message: string;
  category: 'error' | 'warning' | 'suggestion';
}

interface Snippet {
  id: string;
  title: string;
  code: string;
}

const SNIPPETS: Snippet[] = [
  {
    id: 'clean',
    title: '✅ Clean — no errors',
    code: `function greet(name: string): string {
  return \`Hello, \${name.toUpperCase()}!\`;
}

console.log(greet("Ada"));`,
  },
  {
    id: 'arg-mismatch',
    title: 'Wrong argument type',
    code: `function square(n: number): number {
  return n * n;
}

square("4");`,
  },
  {
    id: 'null-unhandled',
    title: 'Possibly null/undefined',
    code: `function findUser(id: number): { name: string } | undefined {
  const users = [{ name: "Ada" }, { name: "Grace" }];
  return users[id];
}

const user = findUser(5);
console.log(user.name);`,
  },
  {
    id: 'missing-property',
    title: 'Object missing a required property',
    code: `interface Config {
  host: string;
  port: number;
  retries: number;
}

const config: Config = {
  host: "localhost",
  port: 8080,
};`,
  },
  {
    id: 'generic-constraint',
    title: 'Generic constraint violation',
    code: `function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

longest("hello", 42);`,
  },
  {
    id: 'scratch',
    title: '📝 Blank — write your own',
    code: `// Write TypeScript here and see real type errors as you type.
`,
  },
];

const CATEGORY_STYLE: Record<Diagnostic['category'], { color: string; label: string }> = {
  error: { color: 'var(--accent-red, #f87171)', label: 'Error' },
  warning: { color: 'var(--accent-amber, #f59e0b)', label: 'Warning' },
  suggestion: { color: 'var(--accent-blue, #5b9cf6)', label: 'Suggestion' },
};

export default function TsTypeChecker() {
  const [status, setStatus] = useState<'loading-compiler' | 'loading-libs' | 'ready' | 'error'>('loading-compiler');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snippetId, setSnippetId] = useState(SNIPPETS[0]!.id);
  const [source, setSource] = useState(SNIPPETS[0]!.code);
  const [strict, setStrict] = useState(true);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // These hold live, mutable TS objects (a language service, its module refs,
  // and the fetched lib.d.ts map) — not React state, since re-rendering
  // shouldn't recreate them, and rebuilding the environment reuses the
  // already-fetched fsMap rather than hitting the CDN again.
  const envRef = useRef<any>(null);
  const tsRef = useRef<any>(null);
  const vfsRef = useRef<any>(null);
  const fsMapRef = useRef<any>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  function rebuildEnv(strictMode: boolean, currentSource: string) {
    const ts = tsRef.current;
    const vfs = vfsRef.current;
    const fsMap = fsMapRef.current;
    if (!ts || !vfs || !fsMap) return;
    const compilerOptions = {
      target: ts.ScriptTarget.ES2022,
      lib: ['ES2022', 'DOM'],
      module: ts.ModuleKind.ESNext,
      strict: strictMode,
    };
    fsMap.set('/index.ts', currentSource);
    const system = vfs.createSystem(fsMap);
    envRef.current = vfs.createVirtualTypeScriptEnvironment(system, ['/index.ts'], ts, compilerOptions);
    runDiagnostics();
  }

  // One-time setup: load the compiler, then fetch lib.d.ts files (cached in
  // localStorage after the first visit) and build the virtual environment.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tsMod, vfsMod] = await Promise.all([import('typescript'), import('@typescript/vfs')]);
        if (cancelled) return;
        const ts = (tsMod.default ?? tsMod) as any;
        const vfs = vfsMod as any;
        tsRef.current = ts;
        vfsRef.current = vfs;
        setStatus('loading-libs');

        const fsMap = await vfs.createDefaultMapFromCDN(
          { target: ts.ScriptTarget.ES2022, lib: ['ES2022', 'DOM'] },
          ts.version,
          true,
          ts,
        );
        if (cancelled) return;
        fsMapRef.current = fsMap;
        rebuildEnv(strict, source);
        setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e instanceof Error ? e.message : 'Could not load the TypeScript compiler.');
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runDiagnostics() {
    const ts = tsRef.current;
    const env = envRef.current;
    if (!ts || !env) return;
    const raw = [
      ...env.languageService.getSyntacticDiagnostics('/index.ts'),
      ...env.languageService.getSemanticDiagnostics('/index.ts'),
    ];
    const sourceFile = env.getSourceFile('/index.ts');
    const mapped: Diagnostic[] = raw
      .filter((d: any) => typeof d.start === 'number' && typeof d.length === 'number')
      .map((d: any) => {
        const pos = sourceFile ? ts.getLineAndCharacterOfPosition(sourceFile, d.start) : { line: 0, character: 0 };
        const category: Diagnostic['category'] =
          d.category === ts.DiagnosticCategory.Error ? 'error'
          : d.category === ts.DiagnosticCategory.Warning ? 'warning'
          : 'suggestion';
        return {
          start: d.start,
          length: d.length,
          line: pos.line + 1,
          character: pos.character + 1,
          message: ts.flattenDiagnosticMessageText(d.messageText, ' '),
          category,
        };
      })
      .sort((a: Diagnostic, b: Diagnostic) => a.start - b.start);
    setDiagnostics(mapped);
  }

  // Re-run type-checking whenever the source or strict-mode toggle changes,
  // debounced since full semantic checking is heavier than plain transpiling.
  useEffect(() => {
    if (status !== 'ready' || !envRef.current) return;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      envRef.current.updateFile('/index.ts', source);
      runDiagnostics();
    }, 250);
    return () => window.clearTimeout(debounceRef.current);
  }, [source, status]);

  // Strict mode is a compilerOption fixed at environment-creation time, so
  // toggling it rebuilds the environment (reusing the already-fetched lib
  // map — no new network request).
  useEffect(() => {
    if (status !== 'ready') return;
    rebuildEnv(strict, source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strict]);

  const handleSnippetChange = (id: string) => {
    const snippet = SNIPPETS.find((s) => s.id === id);
    if (!snippet) return;
    setSnippetId(id);
    setSource(snippet.code);
  };

  const jumpToDiagnostic = (d: Diagnostic) => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(d.start, d.start + d.length);
  };

  const errorCount = diagnostics.filter((d) => d.category === 'error').length;

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
        alignItems: 'center',
      }}>
        <label style={labelStyle}>
          Load example
          <select value={snippetId} onChange={(e) => handleSnippetChange(e.target.value)} style={selectStyle}>
            {SNIPPETS.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </label>

        <label style={{ ...labelStyle, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
          <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
          Strict mode
        </label>

        <span style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: status !== 'ready' ? 'var(--text-secondary)' : errorCount > 0 ? 'var(--accent-red, #f87171)' : 'var(--accent-green, #4ade80)',
        }}>
          {status === 'loading-compiler' && 'Loading compiler…'}
          {status === 'loading-libs' && 'Fetching type definitions…'}
          {status === 'error' && 'Failed to load'}
          {status === 'ready' && (errorCount > 0 ? `${errorCount} error${errorCount === 1 ? '' : 's'}` : 'No errors')}
        </span>
      </div>

      <div className="js-playground-split">
        <div style={{ background: 'var(--bg-secondary)' }}>
          <div style={panelLabelStyle}>Source (TypeScript)</div>
          <textarea
            ref={textareaRef}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            disabled={status === 'error'}
            style={textareaStyle}
          />
        </div>
        <div style={{ background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
          <div style={panelLabelStyle}>Diagnostics</div>
          {status === 'error' ? (
            <div style={{ padding: '1rem', color: 'var(--accent-red, #f87171)', fontSize: '0.85rem' }}>{errorMessage}</div>
          ) : status !== 'ready' ? (
            <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {status === 'loading-compiler' ? 'Loading the TypeScript compiler…' : 'Fetching lib.d.ts files from the TypeScript CDN (cached after first load)…'}
            </div>
          ) : diagnostics.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--accent-green, #4ade80)', fontSize: '0.85rem' }}>No errors or warnings. ✅</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: '0.5rem', overflowY: 'auto', maxHeight: '340px' }}>
              {diagnostics.map((d, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => jumpToDiagnostic(d)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `3px solid ${CATEGORY_STYLE[d.category].color}`,
                      borderRadius: '6px',
                      padding: '0.5rem 0.7rem',
                      marginBottom: '0.4rem',
                      cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.78rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ color: CATEGORY_STYLE[d.category].color, fontWeight: 700 }}>
                      {CATEGORY_STYLE[d.category].label}
                    </span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>Ln {d.line}, Col {d.character}</span>
                    <div style={{ marginTop: '0.2rem' }}>{d.message}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
  minWidth: '260px',
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
  minHeight: '340px',
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
