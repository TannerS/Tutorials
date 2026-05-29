import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function CodingChallenges() {
  return (
    <LessonLayout
      title="Live Coding Challenges"
      sectionId="interview-prep"
      lessonIndex={3}
      prev={{ path: '/interview-prep/frontend', label: 'Frontend System Design' }}
      next={null}
    >

      {/* ── Part 1: Strategy ─────────────────────────────────────────────── */}
      <h2>Approaching Live Coding Interviews</h2>
      <p>
        Live coding is as much a communication exercise as a technical one. Interviewers
        want to see how you think — not just whether you can produce a correct answer in
        silence. Follow a repeatable process every time.
      </p>

      <FlowChart
        title="Live Coding Process"
        chart={"graph LR\n  A[Clarify Requirements] --> B[Talk Through Approach]\n  B --> C[Write Skeleton / Types]\n  C --> D[Implement Core Logic]\n  D --> E[Test Edge Cases]\n  E --> F[Discuss Trade-offs]"}
      />

      <InfoBox variant="tip" title="Communication Strategy">
        <ul>
          <li><strong>Narrate your thinking</strong> — say what you are about to do before you type it.</li>
          <li><strong>Ask one clarifying question at a time</strong> — rapid-fire questions feel unprepared.</li>
          <li><strong>State your assumptions out loud</strong> — e.g. "I'll assume IDs are unique strings."</li>
          <li><strong>Invite feedback early</strong> — "Does this direction make sense before I keep going?"</li>
        </ul>
      </InfoBox>

      <InfoBox variant="warning" title="Time Management">
        <ul>
          <li>Spend no more than <strong>2 minutes</strong> clarifying before you start coding.</li>
          <li>Build a <em>working rough draft</em> first — polish only if time allows.</li>
          <li>If you get stuck, say so and propose a fallback approach rather than going silent.</li>
          <li>Always leave 3–5 minutes to walk through edge cases at the end.</li>
        </ul>
      </InfoBox>

      {/* ── Part 2: Challenges ───────────────────────────────────────────── */}

      {/* 1 ── useDebounce */}
      <h2>1. useDebounce Hook</h2>
      <p>
        Debouncing delays an action until a burst of inputs has stopped. Classic uses:
        search-as-you-type, window resize, form auto-save.
      </p>
      <ul>
        <li>Accept a <code>value</code> and a <code>delay</code> in milliseconds.</li>
        <li>Return the debounced value — only updates after the delay has elapsed with no new value.</li>
        <li>Cancel the pending timer on every new value <em>and</em> on unmount.</li>
      </ul>
      <CodeBlock language="jsx" title="useDebounce.js">{`import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Cleanup: cancel timer if value changes before delay elapses
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`}</CodeBlock>
      <InfoBox variant="note" title="Key Decisions">
        The cleanup function returned from <code>useEffect</code> runs before the next effect and on
        unmount — this is what prevents stale timers from firing after the component is gone.
        Interviewers often probe whether you remember this cleanup step.
      </InfoBox>

      <InteractiveChallenge
        question={"In useDebounce, what happens if you omit the cleanup function (return () => clearTimeout(timer))?"}
        options={[
          "Nothing — React clears timers automatically on re-render",
          "The previous timer fires AND the new timer fires, causing double updates",
          "The hook throws a runtime error",
          "The debounced value never updates",
        ]}
        correctIndex={1}
        explanation={"Without cleanup, the old setTimeout is never cancelled. Both the old timer and the new timer eventually fire, leading to stale values being set and potential race conditions."}
      />

      {/* 2 ── useLocalStorage */}
      <h2>2. useLocalStorage Hook</h2>
      <p>
        Persists a state value to <code>localStorage</code>, surviving page refreshes.
        Must handle JSON serialization, missing keys, and SSR (where <code>window</code> is undefined).
      </p>
      <CodeBlock language="jsx" title="useLocalStorage.js">{`import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue; // SSR guard
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('useLocalStorage write error:', error);
    }
  };

  // Stay in sync across browser tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key && e.newValue !== null) {
        try { setStoredValue(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  return [storedValue, setValue];
}`}</CodeBlock>

      {/* 3 ── Toggle / Accordion */}
      <h2>3. Toggle / Accordion Component</h2>
      <p>
        Animated expand/collapse panels. Accessibility requires <code>aria-expanded</code>,
        <code>aria-controls</code>, and keyboard activation via <kbd>Enter</kbd> / <kbd>Space</kbd>.
      </p>
      <CodeBlock language="jsx" title="Accordion.jsx">{`import { useState, useId } from 'react';

function AccordionItem({ title, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const contentId = \`accordion-content-\${id}\`;
  const triggerId = \`accordion-trigger-\${id}\`;

  return (
    <div style={{ borderBottom: '1px solid #ddd' }}>
      <button
        id={triggerId}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen(prev => !prev)}
        style={{ width: '100%', textAlign: 'left', padding: '12px 16px',
                 background: 'none', border: 'none', cursor: 'pointer',
                 fontWeight: 600, fontSize: '1rem' }}
      >
        {title}
        <span aria-hidden style={{ float: 'right' }}>{open ? '▲' : '▼'}</span>
      </button>

      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        style={{
          overflow: 'hidden',
          maxHeight: open ? '500px' : '0',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div style={{ padding: '0 16px 16px' }}>{children}</div>
      </div>
    </div>
  );
}

export function Accordion({ items }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 4 }}>
      {items.map(item => (
        <AccordionItem key={item.id} title={item.title}>
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}`}</CodeBlock>

      {/* 4 ── Star Rating */}
      <h2>4. Star Rating Component</h2>
      <p>
        Hover to preview, click to commit. Keyboard accessible: arrow keys adjust value,
        <kbd>Enter</kbd>/<kbd>Space</kbd> confirm.
      </p>
      <CodeBlock language="jsx" title="StarRating.jsx">{`import { useState } from 'react';

export function StarRating({ max = 5, value = 0, onChange }) {
  const [hovered, setHovered] = useState(null);

  const display = hovered ?? value;

  return (
    <div
      role="radiogroup"
      aria-label="Star rating"
      style={{ display: 'flex', gap: 4, cursor: 'pointer' }}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          role="radio"
          aria-checked={value === star}
          aria-label={\`\${star} star\${star !== 1 ? 's' : ''}\`}
          tabIndex={0}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onKeyDown={e => {
            if (e.key === 'ArrowRight') onChange?.(Math.min(star + 1, max));
            if (e.key === 'ArrowLeft')  onChange?.(Math.max(star - 1, 1));
          }}
          style={{
            background: 'none', border: 'none', padding: 0,
            fontSize: '1.8rem',
            color: star <= display ? '#f5a623' : '#ccc',
            transition: 'color 0.15s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}`}</CodeBlock>

      <InteractiveChallenge
        question={"In the StarRating component, why is hovered ?? value used for display instead of hovered || value?"}
        options={[
          "They are equivalent — both handle null the same way",
          "?? only falls back when hovered is null or undefined, so a hovered value of 0 stars would still show correctly",
          "|| is not valid JavaScript in JSX",
          "?? is faster at runtime than ||",
        ]}
        correctIndex={1}
        explanation={"The nullish coalescing operator (??) only falls back to the right side when the left side is null or undefined. The logical OR (||) would also fall back for 0 (falsy), which would incorrectly show the committed value instead of a hover preview of 0 stars."}
      />

      {/* 5 ── Pagination */}
      <h2>5. Pagination Component</h2>
      <p>
        Renders page numbers with ellipsis for large ranges. Key algorithm: always show
        first/last, a window of siblings around the current page, and ellipsis gaps.
      </p>
      <CodeBlock language="jsx" title="Pagination.jsx">{`function getPageRange(current, total, siblings = 1) {
  const totalShown = siblings * 2 + 5; // first, last, current, 2 ellipsis, siblings

  if (total <= totalShown) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling  = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);
  const showLeftDots  = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  if (!showLeftDots && showRightDots) {
    const left = Array.from({ length: 3 + siblings * 2 }, (_, i) => i + 1);
    return [...left, '...', total];
  }
  if (showLeftDots && !showRightDots) {
    const right = Array.from({ length: 3 + siblings * 2 },
      (_, i) => total - (3 + siblings * 2) + i + 1);
    return [1, '...', ...right];
  }
  return [1, '...', ...Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  ), '...', total];
}

export function Pagination({ page, total, onPageChange }) {
  const pages = getPageRange(page, total);
  return (
    <nav aria-label="Pagination" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹ Prev</button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={\`ellipsis-\${i}\`} aria-hidden>…</span>
        ) : (
          <button
            key={p}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPageChange(p)}
            style={{ fontWeight: p === page ? 700 : 400 }}
          >
            {p}
          </button>
        )
      )}
      <button disabled={page === total} onClick={() => onPageChange(page + 1)}>Next ›</button>
    </nav>
  );
}`}</CodeBlock>

      {/* 6 ── Modal with Focus Trap */}
      <h2>6. Modal with Focus Trap</h2>
      <p>
        Portals render outside the React tree but inside the DOM. A focus trap keeps
        keyboard users inside the modal; pressing <kbd>Escape</kbd> or clicking the
        backdrop closes it.
      </p>
      <CodeBlock language="jsx" title="Modal.jsx">{`import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, children }) {
  const overlayRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement;

    // Focus first focusable element
    const first = overlayRef.current?.querySelector(FOCUSABLE);
    first?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const focusable = [...overlayRef.current.querySelectorAll(FOCUSABLE)];
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus(); // restore focus on close
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
               display: 'grid', placeItems: 'center', zIndex: 1000 }}
    >
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, minWidth: 320, maxWidth: '90vw' }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {children}
        <button onClick={onClose} style={{ marginTop: 16 }}>Close</button>
      </div>
    </div>,
    document.body
  );
}`}</CodeBlock>

      <InteractiveChallenge
        question={"Why does the Modal store previousFocusRef.current = document.activeElement before focusing inside the modal?"}
        options={[
          "To prevent the modal from opening twice",
          "So focus can be restored to the trigger element when the modal closes",
          "To ensure the modal backdrop is clickable",
          "React requires a ref to every DOM node used inside a portal",
        ]}
        correctIndex={1}
        explanation={"Returning focus to the element that opened the modal is a WCAG 2.1 accessibility requirement. Without it, keyboard and screen reader users lose their place in the page after closing the dialog."}
      />

      {/* 7 ── Multi-Select Dropdown */}
      <h2>7. Multi-Select Dropdown</h2>
      <p>
        Combines a text input (for filtering), a dropdown list, and chips for selected values.
        Keyboard: <kbd>↑</kbd>/<kbd>↓</kbd> navigate, <kbd>Enter</kbd> selects,
        <kbd>Backspace</kbd> removes the last chip.
      </p>
      <CodeBlock language="jsx" title="MultiSelect.jsx">{`import { useState, useRef } from 'react';

export function MultiSelect({ options = [], placeholder = 'Search...' }) {
  const [selected, setSelected] = useState([]);
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const [cursor, setCursor]     = useState(0);
  const inputRef = useRef(null);

  const filtered = options.filter(
    o => !selected.includes(o) && o.toLowerCase().includes(query.toLowerCase())
  );

  const add    = (opt) => { setSelected(s => [...s, opt]); setQuery(''); setCursor(0); };
  const remove = (opt) => setSelected(s => s.filter(x => x !== opt));

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') setCursor(c => Math.min(c + 1, filtered.length - 1));
    if (e.key === 'ArrowUp')   setCursor(c => Math.max(c - 1, 0));
    if (e.key === 'Enter' && filtered[cursor]) add(filtered[cursor]);
    if (e.key === 'Backspace' && !query && selected.length) {
      remove(selected[selected.length - 1]);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div style={{ position: 'relative', width: 320 }}>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 6,
                 border: '1px solid #ccc', borderRadius: 4, cursor: 'text' }}
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map(s => (
          <span key={s} style={{ background: '#e0e7ff', borderRadius: 12,
                                  padding: '2px 8px', fontSize: 13 }}>
            {s}
            <button onClick={() => remove(s)} style={{ marginLeft: 4, background: 'none',
                                                        border: 'none', cursor: 'pointer' }}>✕</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          placeholder={selected.length ? '' : placeholder}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          style={{ border: 'none', outline: 'none', flex: 1, minWidth: 80 }}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul role="listbox" style={{ position: 'absolute', top: '100%', left: 0, right: 0,
                                     background: '#fff', border: '1px solid #ccc',
                                     borderRadius: 4, listStyle: 'none', margin: 0,
                                     padding: 4, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
          {filtered.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={i === cursor}
              onMouseDown={() => add(opt)}
              style={{ padding: '6px 10px', borderRadius: 3, cursor: 'pointer',
                       background: i === cursor ? '#e0e7ff' : 'transparent' }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}`}</CodeBlock>

      {/* 8 ── useUndo */}
      <h2>8. useUndo Hook</h2>
      <p>
        Tracks past, present, and future state slices so any value can be undone and redone.
        Returns the current value plus <code>set</code>, <code>undo</code>, <code>redo</code>,
        <code>canUndo</code>, and <code>canRedo</code>.
      </p>
      <CodeBlock language="jsx" title="useUndo.js">{`import { useReducer, useCallback } from 'react';

const UNDO  = 'UNDO';
const REDO  = 'REDO';
const SET   = 'SET';
const RESET = 'RESET';

function reducer(state, action) {
  const { past, present, future } = state;
  switch (action.type) {
    case SET: {
      if (action.value === present) return state;
      return { past: [...past, present], present: action.value, future: [] };
    }
    case UNDO: {
      if (!past.length) return state;
      const previous = past[past.length - 1];
      return { past: past.slice(0, -1), present: previous, future: [present, ...future] };
    }
    case REDO: {
      if (!future.length) return state;
      const next = future[0];
      return { past: [...past, present], present: next, future: future.slice(1) };
    }
    case RESET:
      return { past: [], present: action.value, future: [] };
    default:
      return state;
  }
}

export function useUndo(initialValue) {
  const [{ past, present, future }, dispatch] = useReducer(reducer, {
    past: [], present: initialValue, future: [],
  });

  return {
    value:    present,
    canUndo:  past.length > 0,
    canRedo:  future.length > 0,
    set:      useCallback(v  => dispatch({ type: SET,   value: v }), []),
    undo:     useCallback(()  => dispatch({ type: UNDO  }), []),
    redo:     useCallback(()  => dispatch({ type: REDO  }), []),
    reset:    useCallback(v  => dispatch({ type: RESET, value: v }), []),
  };
}`}</CodeBlock>

      <InteractiveChallenge
        question={"In useUndo, why does the SET case return early (return state) when action.value === present?"}
        options={[
          "To avoid TypeErrors when comparing objects",
          "To prevent pushing a duplicate entry onto the past stack, which would use up undo slots unnecessarily",
          "useReducer requires a stable reference to trigger re-renders",
          "It prevents the future array from being cleared when nothing actually changed",
        ]}
        correctIndex={1}
        explanation={"If the value hasn't changed and we still push to past[], the user would waste an undo step reverting to the same state they are already in. The early return keeps the history clean and meaningful."}
      />

      {/* 9 ── Virtualized List */}
      <h2>9. Basic Virtualized List</h2>
      <p>
        Only renders the items visible in the viewport plus a small overscan buffer.
        Requires fixed-height rows. Production apps use <code>react-window</code> or
        <code>react-virtual</code> — but implementing it from scratch shows you understand
        the underlying math.
      </p>
      <CodeBlock language="jsx" title="VirtualList.jsx">{`import { useState, useRef, useCallback } from 'react';

export function VirtualList({ items, itemHeight = 48, containerHeight = 400, overscan = 3 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const totalHeight   = items.length * itemHeight;
  const visibleCount  = Math.ceil(containerHeight / itemHeight);
  const startIndex    = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex      = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
  const visibleItems  = items.slice(startIndex, endIndex + 1);
  const offsetY       = startIndex * itemHeight;

  const onScroll = useCallback((e) => setScrollTop(e.currentTarget.scrollTop), []);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      style={{ height: containerHeight, overflowY: 'auto', position: 'relative',
               border: '1px solid #ddd' }}
    >
      {/* Spacer that gives the scrollbar the correct total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          {visibleItems.map((item, i) => (
            <div
              key={startIndex + i}
              style={{ height: itemHeight, display: 'flex', alignItems: 'center',
                       padding: '0 16px', borderBottom: '1px solid #eee' }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Usage: render 10 000 rows with no performance issues
// <VirtualList items={Array.from({length:10000},(_,i)=>\`Row \${i+1}\`)} />`}</CodeBlock>

      {/* 10 ── Theme Provider */}
      <h2>10. Theme Provider with Context</h2>
      <p>
        A minimal but production-shaped theming system: a Context, a Provider that toggles
        between light and dark, and a <code>useTheme</code> hook. Uses CSS custom properties
        so the theme can cascade to plain CSS as well.
      </p>
      <CodeBlock language="jsx" title="ThemeProvider.jsx">{`import { createContext, useContext, useState, useEffect } from 'react';

// ── 1. Define themes ──────────────────────────────────────────────────────
const themes = {
  light: { '--bg': '#ffffff', '--fg': '#111827', '--primary': '#6366f1' },
  dark:  { '--bg': '#111827', '--fg': '#f9fafb', '--primary': '#818cf8' },
};

// ── 2. Create context (export so useTheme can live in other files) ────────
export const ThemeContext = createContext(null);

// ── 3. Provider ───────────────────────────────────────────────────────────
export function ThemeProvider({ children, defaultTheme = 'light' }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('theme') ?? defaultTheme
  );

  // Apply CSS variables to :root whenever mode changes
  useEffect(() => {
    const vars = themes[mode] ?? themes.light;
    Object.entries(vars).forEach(([k, v]) =>
      document.documentElement.style.setProperty(k, v)
    );
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggle = () => setMode(m => (m === 'light' ? 'dark' : 'light'));
  const set    = (newMode) => setMode(newMode);

  return (
    <ThemeContext.Provider value={{ mode, toggle, set }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── 4. Convenience hook ───────────────────────────────────────────────────
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

// ── 5. Usage ──────────────────────────────────────────────────────────────
// function App() {
//   return (
//     <ThemeProvider>
//       <Layout />
//     </ThemeProvider>
//   );
// }
//
// function Header() {
//   const { mode, toggle } = useTheme();
//   return (
//     <header style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
//       <button onClick={toggle}>Switch to {mode === 'light' ? 'dark' : 'light'}</button>
//     </header>
//   );
// }`}</CodeBlock>

      <InteractiveChallenge
        question={"Why does useTheme throw an error when ctx is null instead of returning a default value?"}
        options={[
          "Context cannot return null in React 18",
          "Failing loudly prevents subtle bugs where a component silently uses the wrong theme because it was rendered outside the provider",
          "It improves TypeScript inference",
          "React requires all hooks to throw errors when misused",
        ]}
        correctIndex={1}
        explanation={"Throwing an explicit error with a helpful message ('must be used inside ThemeProvider') surfaces the misconfiguration at development time. Silently falling back to defaults would hide the missing Provider and cause hard-to-diagnose theming bugs in production."}
      />

      {/* ── Part 3: Quick Reference ──────────────────────────────────────── */}
      <h2>Quick Reference: What Interviewers Look For</h2>

      <table>
        <thead>
          <tr>
            <th>Challenge Type</th>
            <th>Green Flags ✅</th>
            <th>Red Flags ❌</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Custom Hooks</td>
            <td>Cleanup in useEffect, correct deps array, generic API</td>
            <td>Missing cleanup, hard-coded values, no return type clarity</td>
          </tr>
          <tr>
            <td>UI Components</td>
            <td>aria-* attributes, keyboard events, focus management</td>
            <td>onClick-only, no keyboard, divs instead of buttons</td>
          </tr>
          <tr>
            <td>State Machines</td>
            <td>useReducer with action types, immutable updates</td>
            <td>Multiple useState flags that can contradict each other</td>
          </tr>
          <tr>
            <td>Performance</td>
            <td>useCallback/useMemo with justification, virtualisation</td>
            <td>Premature optimisation without measurement</td>
          </tr>
          <tr>
            <td>Context / Providers</td>
            <td>Separation of state and dispatch, guard hook</td>
            <td>Everything in one giant context, no error boundary</td>
          </tr>
          <tr>
            <td>Portals / DOM</td>
            <td>createPortal, focus trap, scroll lock</td>
            <td>Inline styles for critical layout without explanation</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="danger" title="Common Mistakes to Avoid">
        <ul>
          <li>
            <strong>Stale closures</strong> — using a value from state inside a <code>useEffect</code>
            or <code>setTimeout</code> without including it in the dependency array.
          </li>
          <li>
            <strong>Missing keys</strong> — using array index as a React key in lists that can be
            reordered or filtered.
          </li>
          <li>
            <strong>Object/array literals in JSX</strong> — <code>style={"{{}}"}</code> and
            prop={"{[]}"} create new references each render, breaking <code>React.memo</code>.
          </li>
          <li>
            <strong>Over-rendering context</strong> — a context with a large object updates every
            consumer on any field change; split into multiple contexts or use selectors.
          </li>
          <li>
            <strong>Forgetting <code>aria</code> attributes</strong> — interviewers at
            accessibility-focused companies will fail you for a modal with no <code>role="dialog"</code>.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="success" title="Final Tips">
        <p>
          The best candidates treat live coding like pair programming. They produce working,
          readable code while explaining trade-offs — not perfect code in silence. Before
          your interview, implement each challenge from memory, then review your solution
          against these examples to find gaps.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
