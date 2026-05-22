import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Recipes() {
  return (
    <LessonLayout
      title="Common Recipes"
      sectionId="react-cheatsheet"
      lessonIndex={4}
      prev={{ path: '/react-cheatsheet/styling', label: 'Styling Approaches' }}
      next={null}
    >
      <p>Copy-paste recipes for everyday React patterns. Each one is self-contained and production-ready.</p>

      <FlowChart
        title="Recipe Index"
        chart={"graph LR\n  A[Recipes] --> B[Debounced Search]\n  A --> C[Infinite Scroll]\n  A --> D[Dark Mode]\n  A --> E[Click Outside]\n  A --> F[Keyboard Shortcuts]\n  A --> G[Local Storage]\n  A --> H[Fetch Hook]\n  A --> I[Portal Modal]\n  A --> J[Breakpoint Hook]\n  A --> K[Copy to Clipboard]\n  A --> L[Drag & Drop]"}
      />

      {/* ── 1. Debounced Search ──────────────────────────── */}
      <h2>Debounced Search Input</h2>
      <CodeBlock language="jsx" title="useDebounce + Search">
{`function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function SearchBar({ onResults }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);

  useEffect(() => {
    if (!debounced.trim()) return onResults([]);
    const ctrl = new AbortController();
    fetch(\`/api/search?q=\${encodeURIComponent(debounced)}\`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(onResults)
      .catch(() => {});
    return () => ctrl.abort();
  }, [debounced, onResults]);

  return <input value={query} onChange={e => setQuery(e.target.value)}
    placeholder="Search..." />;
}`}
      </CodeBlock>

      {/* ── 2. Infinite Scroll ───────────────────────────── */}
      <h2>Infinite Scroll</h2>
      <CodeBlock language="jsx" title="IntersectionObserver Hook">
{`function useIntersection(ref, options) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, options]);
  return isIntersecting;
}

function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef();
  const isVisible = useIntersection(sentinelRef, { threshold: 0.1 });

  useEffect(() => {
    if (!isVisible || !hasMore) return;
    fetch(\`/api/items?page=\${page}\`)
      .then(r => r.json())
      .then(data => {
        setItems(prev => [...prev, ...data.items]);
        setHasMore(data.hasMore);
        setPage(prev => prev + 1);
      });
  }, [isVisible, hasMore, page]);

  return (
    <div>
      {items.map(item => <div key={item.id}>{item.name}</div>)}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
}`}
      </CodeBlock>

      {/* ── 3. Dark Mode ─────────────────────────────────── */}
      <h2>Dark Mode Toggle</h2>
      <CodeBlock language="jsx" title="Dark Mode with System Preference">
{`function useDarkMode() {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('theme', mode);
  }, [mode]);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!localStorage.getItem('theme')) setMode(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = () => setMode(prev => prev === 'dark' ? 'light' : 'dark');
  return { mode, toggle, setMode };
}

// CSS: [data-theme="dark"] { --bg: #111; --text: #eee; }`}
      </CodeBlock>

      {/* ── 4. Click Outside ─────────────────────────────── */}
      <h2>Click Outside to Close</h2>
      <CodeBlock language="jsx" title="useClickOutside">
{`function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

function Dropdown({ onClose, children }) {
  const ref = useRef();
  useClickOutside(ref, onClose);
  return <div ref={ref} className="dropdown">{children}</div>;
}`}
      </CodeBlock>

      {/* ── 5. Keyboard Shortcuts ────────────────────────── */}
      <h2>Keyboard Shortcuts Hook</h2>
      <CodeBlock language="jsx" title="useKeyboardShortcut">
{`function useKeyboardShortcut(keyCombo, callback, deps = []) {
  useEffect(() => {
    const handler = (e) => {
      const keys = keyCombo.toLowerCase().split('+');
      const modifiers = {
        ctrl: e.ctrlKey || e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey,
      };
      const mainKey = keys.filter(k => !['ctrl', 'shift', 'alt', 'meta'].includes(k))[0];
      const modMatch = keys.every(k =>
        ['ctrl', 'meta'].includes(k) ? modifiers.ctrl :
        k === 'shift' ? modifiers.shift :
        k === 'alt' ? modifiers.alt :
        e.key.toLowerCase() === k
      );
      if (modMatch && e.key.toLowerCase() === mainKey) {
        e.preventDefault();
        callback(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyCombo, callback, ...deps]);
}

// Usage
useKeyboardShortcut('ctrl+k', () => setSearchOpen(true));
useKeyboardShortcut('Escape', () => setSearchOpen(false));`}
      </CodeBlock>

      {/* ── 6. Local Storage ─────────────────────────────── */}
      <h2>Local Storage State Hook</h2>
      <CodeBlock language="jsx" title="useLocalStorage">
{`function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* quota exceeded */ }
  }, [key, value]);

  const remove = () => {
    localStorage.removeItem(key);
    setValue(initialValue);
  };

  return [value, setValue, remove];
}

// Usage — same API as useState
const [prefs, setPrefs] = useLocalStorage('prefs', { lang: 'en' });`}
      </CodeBlock>

      {/* ── 7. Fetch Hook ────────────────────────────────── */}
      <h2>Fetch with Loading / Error States</h2>
      <CodeBlock language="jsx" title="useFetch">
{`function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!url) return;
    const ctrl = new AbortController();
    setState({ data: null, loading: true, error: null });

    fetch(url, { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
        return r.json();
      })
      .then(data => setState({ data, loading: false, error: null }))
      .catch(err => {
        if (err.name !== 'AbortError')
          setState({ data: null, loading: false, error: err.message });
      });

    return () => ctrl.abort();
  }, [url]);

  return state;
}

// Usage
function UserProfile({ id }) {
  const { data, loading, error } = useFetch(\`/api/users/\${id}\`);
  if (loading) return <Spinner />;
  if (error)   return <ErrorMsg message={error} />;
  return <h1>{data.name}</h1>;
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Production Considerations">
        <p>For real apps, prefer <strong>TanStack Query</strong> (React Query) or <strong>SWR</strong> over a raw useFetch hook. They handle caching, deduplication, revalidation, pagination, and mutations out of the box.</p>
      </InfoBox>

      {/* ── 8. Portal Modal ──────────────────────────────── */}
      <h2>Portal-Based Modal</h2>
      <CodeBlock language="jsx" title="Modal with createPortal">
{`import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}
      role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// Usage
const [open, setOpen] = useState(false);
<button onClick={() => setOpen(true)}>Open</button>
<Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm">
  <p>Are you sure?</p>
</Modal>`}
      </CodeBlock>

      {/* ── 9. Responsive Breakpoint ─────────────────────── */}
      <h2>Responsive Breakpoint Hook</h2>
      <CodeBlock language="jsx" title="useMediaQuery & useBreakpoint">
{`function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

function useBreakpoint() {
  const isMobile  = useMediaQuery('(max-width: 639px)');
  const isTablet   = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isDesktop  = useMediaQuery('(min-width: 1024px)');
  return { isMobile, isTablet, isDesktop };
}

// Usage
const { isMobile } = useBreakpoint();
return isMobile ? <MobileNav /> : <DesktopNav />;`}
      </CodeBlock>

      {/* ── 10. Copy to Clipboard ────────────────────────── */}
      <h2>Copy to Clipboard</h2>
      <CodeBlock language="jsx" title="useCopyToClipboard">
{`function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetDelay);
      return true;
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), resetDelay);
      return true;
    }
  }, [resetDelay]);

  return { copy, copied };
}

// Usage
const { copy, copied } = useCopyToClipboard();
<button onClick={() => copy(code)}>{copied ? '✓ Copied!' : 'Copy'}</button>`}
      </CodeBlock>

      {/* ── 11. Drag and Drop ────────────────────────────── */}
      <h2>Drag &amp; Drop Basics</h2>
      <CodeBlock language="jsx" title="Native HTML Drag & Drop">
{`function DragList({ items: initial }) {
  const [items, setItems] = useState(initial);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const handleDragStart = (index) => { dragItem.current = index; };
  const handleDragEnter = (index) => { dragOver.current = index; };

  const handleDragEnd = () => {
    const next = [...items];
    const [moved] = next.splice(dragItem.current, 1);
    next.splice(dragOver.current, 0, moved);
    dragItem.current = null;
    dragOver.current = null;
    setItems(next);
  };

  return (
    <ul>
      {items.map((item, i) => (
        <li key={item.id} draggable
          onDragStart={() => handleDragStart(i)}
          onDragEnter={() => handleDragEnter(i)}
          onDragEnd={handleDragEnd}
          onDragOver={e => e.preventDefault()}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}

// For complex DnD, use @dnd-kit/core or react-beautiful-dnd`}
      </CodeBlock>

      <InfoBox variant="tip" title="Recipe Tips">
        <p>All hooks above follow the same pattern: encapsulate browser APIs + state + cleanup in a reusable hook. Extract any repeated logic into a <code>use*</code> hook — it&apos;s the React way.</p>
      </InfoBox>

      <InteractiveChallenge
        question={"Why does the useFetch hook call AbortController.abort() in its cleanup?"}
        options={[
          "To cancel pending requests when the URL changes or component unmounts",
          "To improve SEO by reducing server load",
          "To prevent the browser from caching responses",
          "To clear the response body from memory"
        ]}
        correctIndex={0}
        explanation={"Without abort(), a slow fetch could complete after the component unmounts or after the URL changes, causing setState on an unmounted component (a React warning) or overwriting data from a newer request."}
        language="jsx"
      />
    </LessonLayout>
  );
}

export default Recipes;
