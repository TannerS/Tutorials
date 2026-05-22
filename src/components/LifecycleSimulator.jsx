import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, useContext, createContext, memo } from 'react';

const LogContext = createContext(null);

function timestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
}

const LOG_COLORS = {
  render:  '#22d3ee',
  mount:   '#4ade80',
  update:  '#5b9cf6',
  layout:  '#a78bfa',
  memo:    '#fbbf24',
  cleanup: '#f87171',
};

const LogPanel = memo(function LogPanel({ logs }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  return (
    <div style={{
      flex: 1, background: '#0f1117', borderRadius: '8px',
      border: '1px solid #2a2e42', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '0.5rem 0.75rem', background: '#161822',
        borderBottom: '1px solid #2a2e42', fontSize: '0.75rem',
        color: '#9399b2', fontWeight: 600,
      }}>Event Log ({logs.length})</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ color: LOG_COLORS[log.type] || '#e4e6f0', marginBottom: '2px', lineHeight: 1.4 }}>
            <span style={{ color: '#6c7293' }}>[{log.time}] </span>
            <span style={{ color: '#9399b2' }}>{log.component} </span>
            {log.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
});

function ChildDemo({ value, label }) {
  const pushLog = useContext(LogContext);
  const [input, setInput] = useState('');

  pushLog({ type: 'render', component: label, message: `render (value=${value})` });

  useLayoutEffect(() => {
    pushLog({ type: 'layout', component: label, message: 'useLayoutEffect fired' });
    return () => pushLog({ type: 'cleanup', component: label, message: 'useLayoutEffect cleanup' });
  }, [value]);

  useEffect(() => {
    pushLog({ type: 'mount', component: label, message: 'mounted (useEffect [])' });
    return () => pushLog({ type: 'cleanup', component: label, message: 'unmounted (cleanup)' });
  }, []);

  useEffect(() => {
    pushLog({ type: 'update', component: label, message: `value changed → ${value}` });
  }, [value]);

  const derived = useMemo(() => {
    pushLog({ type: 'memo', component: label, message: `useMemo recalculated: value*2=${value * 2}` });
    return value * 2;
  }, [value]);

  return (
    <div style={{
      background: '#1a1d2e', border: '1px solid #2a2e42',
      borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#5b9cf6', fontWeight: 600, marginBottom: '0.5rem' }}>
        {label} (value={value}, derived={derived})
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type to trigger re-render..."
        style={{
          background: '#252a3f', border: '1px solid #2a2e42', borderRadius: '4px',
          padding: '4px 8px', color: '#e4e6f0', fontSize: '0.75rem',
          fontFamily: 'inherit', width: '100%', outline: 'none',
        }}
      />
    </div>
  );
}

function ParentDemo({ childProp }) {
  const pushLog = useContext(LogContext);
  const [count, setCount] = useState(0);
  const [, setForce] = useState(0);

  pushLog({ type: 'render', component: 'Parent', message: `render (count=${count}, childProp=${childProp})` });

  useLayoutEffect(() => {
    pushLog({ type: 'layout', component: 'Parent', message: 'useLayoutEffect fired' });
  }, [count]);

  useEffect(() => {
    pushLog({ type: 'mount', component: 'Parent', message: 'mounted' });
    return () => pushLog({ type: 'cleanup', component: 'Parent', message: 'unmounted' });
  }, []);

  useEffect(() => {
    pushLog({ type: 'update', component: 'Parent', message: `count changed → ${count}` });
  }, [count]);

  const handleIncrement = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <div style={{
      background: '#161822', border: '1px solid #2a2e42',
      borderRadius: '8px', padding: '0.75rem',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600, marginBottom: '0.5rem' }}>
        Parent (count={count})
      </div>
      <button onClick={handleIncrement} style={btnStyle('#a78bfa')}>+ Increment Count</button>
      <button onClick={() => setForce(f => f + 1)} style={btnStyle('#22d3ee')}>⚡ Force Re-render</button>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: `${color}20`, border: `1px solid ${color}`,
    color, borderRadius: '4px', padding: '4px 10px',
    cursor: 'pointer', fontSize: '0.72rem', margin: '2px',
    fontFamily: 'inherit', transition: 'background 0.15s',
  };
}

export default function LifecycleSimulator() {
  const [logs, setLogs] = useState([]);
  const [showChildA, setShowChildA] = useState(true);
  const [showChildB, setShowChildB] = useState(false);
  const [childProp, setChildProp] = useState(0);
  const pendingRef = useRef([]);
  const flushRef = useRef(null);

  const pushLog = useCallback((entry) => {
    const logEntry = { ...entry, time: timestamp() };
    console.log(`[${logEntry.time}] ${logEntry.component}: ${logEntry.message}`);
    pendingRef.current.push(logEntry);
    if (!flushRef.current) {
      flushRef.current = setTimeout(() => {
        setLogs(prev => {
          const next = [...prev, ...pendingRef.current].slice(-200);
          pendingRef.current = [];
          flushRef.current = null;
          return next;
        });
      }, 50);
    }
  }, []);

  return (
    <LogContext.Provider value={pushLog}>
      <div style={{
        background: '#12141e', borderRadius: '12px',
        border: '1px solid #2a2e42', overflow: 'hidden', margin: '1.5rem 0',
      }}>
        {/* Header */}
        <div style={{
          background: '#1a1d2e', padding: '0.75rem 1rem',
          borderBottom: '1px solid #2a2e42',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '1rem' }}>⚛️</span>
          <span style={{ fontWeight: 600, color: '#22d3ee', fontSize: '0.9rem' }}>React Lifecycle Simulator</span>
          <span style={{ fontSize: '0.75rem', color: '#6c7293', marginLeft: 'auto' }}>Interact to see real lifecycle events</span>
        </div>

        {/* Controls */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #2a2e42', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          <button onClick={() => setShowChildA(true)} style={btnStyle('#4ade80')}>Mount Child A</button>
          <button onClick={() => setShowChildA(false)} style={btnStyle('#f87171')}>Unmount Child A</button>
          <button onClick={() => setChildProp(p => p + 1)} style={btnStyle('#fbbf24')}>Update Child Props</button>
          <button onClick={() => setShowChildB(b => !b)} style={btnStyle('#a78bfa')}>Toggle Child B</button>
          <button onClick={() => setLogs([])} style={btnStyle('#6c7293')}>Clear Log</button>
        </div>

        {/* Body: split layout */}
        <div style={{ display: 'flex', gap: '0', minHeight: '300px' }}>
          {/* Component tree */}
          <div style={{ flex: '0 0 45%', padding: '0.75rem', borderRight: '1px solid #2a2e42' }}>
            <div style={{ fontSize: '0.72rem', color: '#9399b2', marginBottom: '0.5rem', fontWeight: 600 }}>
              LIVE COMPONENT TREE
            </div>
            <ParentDemo childProp={childProp} />
            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px dashed #2a2e42' }}>
              {showChildA && <ChildDemo value={childProp} label="Child A" />}
              {showChildB && <ChildDemo value={childProp * 2} label="Child B" />}
              {!showChildA && !showChildB && (
                <div style={{ fontSize: '0.75rem', color: '#6c7293', padding: '0.5rem' }}>No children mounted</div>
              )}
            </div>
          </div>

          {/* Log panel */}
          <div style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.72rem', color: '#9399b2', marginBottom: '0.5rem', fontWeight: 600 }}>
              EVENT LOG
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {Object.entries(LOG_COLORS).map(([type, color]) => (
                <span key={type} style={{ fontSize: '0.65rem', color, background: `${color}15`, padding: '2px 6px', borderRadius: '4px' }}>
                  {type}
                </span>
              ))}
            </div>
            <LogPanel logs={logs} />
          </div>
        </div>
      </div>
    </LogContext.Provider>
  );
}
