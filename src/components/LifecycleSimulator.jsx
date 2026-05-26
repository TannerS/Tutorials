import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
  createContext,
  useContext,
  memo,
} from 'react';

/* ─── colour palette ─── */
const COLORS = {
  render:  '#22d3ee',
  mount:   '#4ade80',
  update:  '#5b9cf6',
  layout:  '#a78bfa',
  memo:    '#fbbf24',
  cleanup: '#f87171',
};

const LEGEND = [
  { emoji: '🔄', label: 'Render',  color: COLORS.render  },
  { emoji: '✅', label: 'Mount',   color: COLORS.mount   },
  { emoji: '📦', label: 'Update',  color: COLORS.update  },
  { emoji: '📐', label: 'Layout',  color: COLORS.layout  },
  { emoji: '🧮', label: 'Memo',    color: COLORS.memo    },
  { emoji: '🧹', label: 'Cleanup', color: COLORS.cleanup },
];

const MAX_LOG = 200;

/* ─── context ─── */
const LogContext = createContext(null);

function colorFor(msg) {
  if (msg.startsWith('🧹')) return COLORS.cleanup;
  if (msg.startsWith('📐')) return COLORS.layout;
  if (msg.startsWith('✅')) return COLORS.mount;
  if (msg.startsWith('📦')) return COLORS.update;
  if (msg.startsWith('🧮')) return COLORS.memo;
  return COLORS.render;
}

function ts() {
  const d = new Date();
  const pad2 = (n) => String(n).padStart(2, '0');
  const pad3 = (n) => String(n).padStart(3, '0');
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${pad3(d.getMilliseconds())}`;
}

/* ────────────────────────────────────────────
   ChildDemo
   ──────────────────────────────────────────── */
function ChildDemo({ label, value }) {
  const log = useContext(LogContext);
  const renderCount = useRef(0);
  const [name, setName] = useState('');

  renderCount.current += 1;
  log(`🔄 ${label}: Render phase (prop: ${value}, renders: ${renderCount.current})`);

  const computed = useMemo(() => {
    log(`🧮 ${label}: useMemo computed (value × 2)`);
    return value * 2;
  }, [value, label, log]);

  useEffect(() => {
    log(`✅ ${label}: useEffect [mounted]`, true);
    return () => log(`🧹 ${label}: cleanup [unmounting]`, true);
  }, [label, log]);

  useEffect(() => {
    log(`📦 ${label}: useEffect [prop changed → ${value}]`, true);
    return () => log(`🧹 ${label}: cleanup [prop effect]`, true);
  }, [value, label, log]);

  useLayoutEffect(() => {
    log(`📐 ${label}: useLayoutEffect`, true);
    return () => log(`🧹 ${label}: layoutEffect cleanup`, true);
  }, [label, log]);

  return (
    <div style={styles.childCard}>
      <div style={styles.childHeader}>{label}</div>
      <p style={styles.childText}>
        Prop value: <strong style={{ color: COLORS.update }}>{value}</strong>
        {' · '}Computed: <strong style={{ color: COLORS.memo }}>{computed}</strong>
        {' · '}Renders: <strong style={{ color: COLORS.render }}>{renderCount.current}</strong>
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.8rem', color: '#8b8fa3' }}>Local state:</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="type here…"
          style={styles.input}
        />
        {name && <span style={{ color: '#e4e6f0', fontSize: '0.85rem' }}>→ {name}</span>}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   ParentDemo
   ──────────────────────────────────────────── */
function ParentDemo({ childMounted, childProp, secondChildMounted, count, log }) {
  log(`🔄 Parent: Render phase (count: ${count})`);

  useEffect(() => {
    log('✅ Parent: useEffect [mounted]', true);
    return () => log('🧹 Parent: cleanup [unmounting]', true);
  }, [log]);

  useEffect(() => {
    log(`📦 Parent: useEffect [count changed → ${count}]`, true);
    return () => log('🧹 Parent: cleanup [count effect]', true);
  }, [count, log]);

  useLayoutEffect(() => {
    log('📐 Parent: useLayoutEffect [layout measured]', true);
    return () => log('🧹 Parent: layoutEffect cleanup', true);
  }, [log]);

  return (
    <div style={styles.parentCard}>
      <div style={styles.parentHeader}>
        Parent Component <span style={{ color: COLORS.render }}>count = {count}</span>
      </div>
      {childMounted && <ChildDemo label="Child A" value={childProp} />}
      {secondChildMounted && <ChildDemo label="Child B" value={childProp + 10} />}
      {!childMounted && !secondChildMounted && (
        <p style={{ color: '#555b72', fontStyle: 'italic', margin: '1rem 0' }}>
          No children mounted — click "Mount Child" to begin.
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   LogPanel
   ──────────────────────────────────────────── */
const LogPanel = memo(function LogPanel({ entries }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div style={styles.logPanel}>
      <div style={styles.logHeader}>📋 Event Log ({entries.length})</div>
      <div style={styles.logScroll} ref={scrollRef}>
        {entries.length === 0 && (
          <p style={{ color: '#555b72', textAlign: 'center', padding: '2rem 0' }}>
            Interact with the controls to see lifecycle events…
          </p>
        )}
        {entries.map((e, i) => (
          <div key={i} style={{ ...styles.logEntry, color: e.color }}>
            <span style={styles.logTs}>{e.time}</span> {e.msg}
          </div>
        ))}
      </div>
    </div>
  );
});

/* ────────────────────────────────────────────
   LifecycleSimulator  (default export)
   ──────────────────────────────────────────── */
export default function LifecycleSimulator() {
  const [childMounted, setChildMounted] = useState(false);
  const [secondChild, setSecondChild] = useState(false);
  const [count, setCount] = useState(0);
  const [childProp, setChildProp] = useState(1);
  const [, setTick] = useState(0);

  const logRef = useRef([]);

  const pushLog = useCallback((msg, flush = false) => {
    const entry = { time: ts(), msg, color: colorFor(msg) };
    logRef.current = [...logRef.current.slice(-(MAX_LOG - 1)), entry];
    console.log(`[Lifecycle] ${entry.time}  ${msg}`);
    // Only trigger a re-render when flush=true (effects & handlers).
    // Render-phase calls (default) just write to the ref — the next
    // committed render will pick them up, avoiding an infinite loop.
    if (flush) setTick((t) => t + 1);
  }, []);

  /* ─── button handlers ─── */
  const handleMount = () => {
    if (childMounted) return;
    pushLog('── 🟢 Action: Mount Child ──');
    setChildMounted(true);
  };
  const handleUnmount = () => {
    if (!childMounted) return;
    pushLog('── 🔴 Action: Unmount Child ──');
    setChildMounted(false);
  };
  const handleParentUpdate = () => {
    pushLog('── 🟡 Action: Update Parent State ──');
    setCount((c) => c + 1);
  };
  const handleChildProp = () => {
    pushLog('── 🔵 Action: Update Child Props ──');
    setChildProp((p) => p + 1);
  };
  const handleForce = () => {
    pushLog('── ⚡ Action: Force Re-render ──');
    setTick((t) => t + 1);
    setCount((c) => c); // identity update still triggers render in dev mode
  };
  const handleClear = () => {
    logRef.current = [];
    setTick((t) => t + 1);
  };
  const handleToggleSecond = () => {
    pushLog(`── ${secondChild ? '🔴' : '🟢'} Action: Toggle Second Child ──`);
    setSecondChild((s) => !s);
  };

  const buttons = [
    { label: '🟢 Mount Child',       onClick: handleMount,        disabled: childMounted },
    { label: '🔴 Unmount Child',     onClick: handleUnmount,      disabled: !childMounted },
    { label: '🟡 Update Parent',     onClick: handleParentUpdate                          },
    { label: '🔵 Update Child Props', onClick: handleChildProp                            },
    { label: '⚡ Force Re-render',   onClick: handleForce                                 },
    { label: '👥 Toggle 2nd Child',  onClick: handleToggleSecond                          },
    { label: '🗑️ Clear Log',         onClick: handleClear                                 },
  ];

  return (
    <LogContext.Provider value={pushLog}>
      <div style={styles.wrapper}>
        {/* ─── Title ─── */}
        <h2 style={styles.title}>⚛️ React Lifecycle Simulator</h2>
        <p style={styles.subtitle}>
          Click the buttons and watch real lifecycle hooks fire in the log panel →
        </p>

        {/* ─── Legend ─── */}
        <div style={styles.legend}>
          {LEGEND.map((l) => (
            <span key={l.label} style={{ ...styles.legendItem, color: l.color }}>
              {l.emoji} {l.label}
            </span>
          ))}
        </div>

        {/* ─── Control panel ─── */}
        <div style={styles.controls}>
          {buttons.map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              disabled={b.disabled}
              style={{
                ...styles.btn,
                ...(b.disabled ? styles.btnDisabled : {}),
              }}
              onMouseEnter={(e) => {
                if (!b.disabled) e.currentTarget.style.filter = 'brightness(1.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* ─── Main split ─── */}
        <div style={styles.split}>
          {/* Left: live area */}
          <div style={styles.liveArea}>
            <div style={styles.liveHeader}>🖥️ Live Component Tree</div>
            <ParentDemo
              childMounted={childMounted}
              childProp={childProp}
              secondChildMounted={secondChild}
              count={count}
              log={pushLog}
            />
          </div>

          {/* Right: log */}
          <LogPanel entries={logRef.current} />
        </div>
      </div>
    </LogContext.Provider>
  );
}

/* ────────────────────────────────────────────
   Inline styles
   ──────────────────────────────────────────── */
const styles = {
  wrapper: {
    background: '#0f1117',
    color: '#e4e6f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '1.5rem',
    borderRadius: '12px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    margin: '0 0 0.25rem',
    fontSize: '1.5rem',
    color: '#e4e6f0',
  },
  subtitle: {
    margin: '0 0 0.75rem',
    fontSize: '0.9rem',
    color: '#8b8fa3',
  },

  /* legend */
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginBottom: '1rem',
    padding: '0.5rem 0.75rem',
    background: '#161824',
    borderRadius: '8px',
    border: '1px solid #2a2e42',
    fontSize: '0.8rem',
  },
  legendItem: {
    whiteSpace: 'nowrap',
  },

  /* controls */
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  btn: {
    background: '#252a3f',
    color: '#e4e6f0',
    border: '1px solid #2a2e42',
    borderRadius: '6px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'filter 0.15s',
    whiteSpace: 'nowrap',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },

  /* split layout */
  split: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  liveArea: {
    flex: '1 1 340px',
    minWidth: 0,
    background: '#161824',
    borderRadius: '10px',
    border: '1px solid #2a2e42',
    padding: '1rem',
  },
  liveHeader: {
    fontWeight: 600,
    fontSize: '0.95rem',
    marginBottom: '0.75rem',
    color: '#c0c3d4',
  },

  /* parent / child cards */
  parentCard: {
    background: '#1c1f30',
    border: '1px solid #2a2e42',
    borderRadius: '8px',
    padding: '0.75rem',
  },
  parentHeader: {
    fontWeight: 600,
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  childCard: {
    background: '#22253a',
    border: '1px solid #2f3350',
    borderRadius: '8px',
    padding: '0.6rem 0.75rem',
    marginTop: '0.5rem',
  },
  childHeader: {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#a78bfa',
    marginBottom: '0.35rem',
  },
  childText: {
    margin: '0 0 0.4rem',
    fontSize: '0.82rem',
    color: '#c0c3d4',
  },
  input: {
    background: '#161824',
    color: '#e4e6f0',
    border: '1px solid #2a2e42',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.82rem',
    outline: 'none',
    width: '120px',
  },

  /* log panel */
  logPanel: {
    flex: '1 1 380px',
    minWidth: 0,
    background: '#0d0f16',
    borderRadius: '10px',
    border: '1px solid #2a2e42',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '520px',
  },
  logHeader: {
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #2a2e42',
    color: '#c0c3d4',
    flexShrink: 0,
  },
  logScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem 0.75rem',
  },
  logEntry: {
    fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
    fontSize: '0.78rem',
    lineHeight: '1.65',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  logTs: {
    color: '#555b72',
    marginRight: '0.5rem',
  },
};
