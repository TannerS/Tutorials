import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideRecipes() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Common Recipes"
      tagline="Copy-paste-ready hooks and components for the patterns that come up in almost every app — built on the effect-cleanup and ref patterns from earlier pages."
      meta={['React 19', '12 recipes']}
      footerLabel="Personal study reference — React 19"
      pageLabel="React 19 Field Guide · Recipes"
      prev={{ path: '/react-field-guide/state-management', label: 'State Management' }}
      next={{ path: '/react-field-guide/testing', label: 'Testing Quick Reference' }}
    >
      <PosterCard
        glyph="Db"
        title="Debounced Search Input"
        code={`function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id); // cancels the pending update if value changes again
  }, [value, delayMs]);

  return debounced;
}

// Usage: only fires a search request 300ms after typing stops
function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  useEffect(() => { if (debouncedQuery) searchApi(debouncedQuery); }, [debouncedQuery]);
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`}
        caption="Every keystroke schedules a timeout and cancels the previous one via cleanup — only the last keystroke in a burst survives long enough to fire. This is the same setTimeout-plus-cleanup shape used for any effect that reacts to fast-changing input."
      />

      <PosterCard
        glyph="Fe"
        title="Fetch With Loading & Error States"
        code={`function useFetch<T>(url: string) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: Error | null }>(
    { data: null, loading: true, error: null }
  );

  useEffect(() => {
    const controller = new AbortController();
    setState(s => ({ ...s, loading: true }));

    fetch(url, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(\`HTTP \${r.status}\`); return r.json(); })
      .then(data => setState({ data, loading: false, error: null }))
      .catch(err => {
        if (err.name !== 'AbortError') setState({ data: null, loading: false, error: err });
      });

    return () => controller.abort(); // cancels stale in-flight requests
  }, [url]);

  return state;
}`}
        caption="AbortController in the cleanup kills the in-flight request the moment url changes, so a slow response from the previous url can never overwrite fresher state — the same fix used for the userId race condition."
      />

      <PosterCard
        glyph="Is"
        title="Infinite Scroll"
        code={`function useInfiniteScroll(onLoadMore: () => void) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect(); // stop watching on unmount/re-run
  }, [onLoadMore]);

  return sentinelRef;
}

// Usage: <ul>{items.map(...)}<div ref={useInfiniteScroll(loadNextPage)} /></ul>`}
        caption="An IntersectionObserver watching a sentinel div at the bottom of the list fires onLoadMore the instant it scrolls into view — cheaper than a scroll listener since the browser only notifies on actual intersection changes."
      />

      <PosterCard
        glyph="Co"
        title="Click-Outside-to-Close"
        code={`function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onOutside]);

  return ref;
}

// Usage: const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
// <div ref={ref}>{open && <Dropdown />}</div>`}
        caption="Listens on document, not the element itself — a click anywhere outside ref.current's subtree closes it. Standard addEventListener-in-effect-with-cleanup shape; onOutside should be memoized or the listener re-attaches every render."
      />

      <PosterCard
        glyph="Kb"
        title="Keyboard Shortcut Hook"
        code={`function useKeyboardShortcut(key: string, handler: () => void, modifiers: { meta?: boolean } = {}) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler; // always latest — avoids re-attaching the listener

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const modOk = modifiers.meta ? (e.metaKey || e.ctrlKey) : true;
      if (e.key.toLowerCase() === key.toLowerCase() && modOk) {
        e.preventDefault();
        handlerRef.current();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, modifiers.meta]);
}

// useKeyboardShortcut('k', () => openCommandPalette(), { meta: true }); // Cmd/Ctrl+K`}
        caption="Stores the handler in a ref instead of the effect's dependency array — the listener is attached once per key/modifier combo, but always calls the current handler, avoiding the stale-closure bug from a handler captured on mount."
      />

      <PosterCard
        glyph="Ls"
        title="LocalStorage-Synced State Hook"
        code={`function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    // Lazy init — reading localStorage only runs once, on mount
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// const [theme, setTheme] = useLocalStorage('theme', 'dark');`}
        caption="useState's lazy initializer (a function, not a called value) means localStorage is only read once on mount, not on every render. The effect writes back whenever value changes, keeping the tab and storage in sync."
      />

      <PosterCard
        glyph="Pt"
        title="Portal-Based Modal"
        code={`import { createPortal } from 'react-dom';

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root')! // renders outside the app's DOM subtree
  );
}

// Usage: {isOpen && <Modal onClose={() => setIsOpen(false)}>...</Modal>}`}
        caption="createPortal renders into a DOM node outside the component tree's normal parent — escapes any ancestor's overflow:hidden or z-index stacking context while staying part of the same React tree for events and context."
      />

      <PosterCard
        glyph="Cp"
        title="Copy-to-Clipboard Hook"
        code={`function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetAfterMs);
    } catch {
      setCopied(false);
    }
  }, [resetAfterMs]);

  return { copied, copy };
}

// const { copied, copy } = useCopyToClipboard();
// <button onClick={() => copy(code)}>{copied ? 'Copied!' : 'Copy'}</button>`}
        caption="copy is wrapped in useCallback so it's a stable reference for any memoized button that receives it as a prop — the transient 'Copied!' state resets itself via a plain timeout, no cleanup needed since it's a one-shot UI flash."
      />

      <PosterCard
        glyph="Bp"
        title="Responsive Breakpoint Hook"
        code={`function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  }, [query]);

  const getSnapshot = () => window.matchMedia(query).matches;

  return useSyncExternalStore(subscribe, getSnapshot, () => false); // SSR fallback
}

// const isMobile = useMediaQuery('(max-width: 640px)');`}
        caption="useSyncExternalStore is the correct hook for subscribing to browser state like matchMedia — it's what stores like Redux use internally, and it guarantees the component tears from a mid-transition state correctly under concurrent rendering."
      />

      <PosterCard
        glyph="Pv"
        title="Previous-Value Hook"
        code={`function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value; // runs AFTER render, so during render ref still holds the old value
  });

  return ref.current;
}

// function Counter({ count }) {
//   const prevCount = usePrevious(count);
//   return <p>Now: {count}, before: {prevCount}</p>;
// }`}
        caption="The effect updating ref.current runs after render, so during the current render ref.current still holds last render's value — reading it in the render body gives you 'previous,' writing to it happens one tick later."
      />

      <PosterCard
        glyph="Rf"
        title={<>useLatest<span className="dim"> — the stale-closure escape hatch</span></>}
        code={`function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value; // updates synchronously on every render — no effect needed here
  return ref;
}

// Any timer/listener/socket callback set up once can still read fresh values:
function ChatRoom({ roomId, onMessage }) {
  const onMessageRef = useLatest(onMessage);
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('message', msg => onMessageRef.current(msg)); // always the latest onMessage
    return () => conn.disconnect();
  }, [roomId]); // onMessage intentionally NOT a dependency
}`}
        caption="Unlike usePrevious, this mutates ref.current directly in the render body (not an effect) so it's current immediately — the general-purpose fix for any long-lived callback (interval, socket, listener) that needs to read a value without re-subscribing when it changes."
      />

      <PosterCard
        glyph="Iv"
        title="Countdown / Interval Timer Hook"
        code={`function useCountdown(startSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(startSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft(prev => Math.max(prev - 1, 0)); // functional update — no stale closure
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft <= 0]); // only re-run when it crosses zero, not every second

  return secondsLeft;
}

// const secondsLeft = useCountdown(60);`}
        caption="The functional update form of setSecondsLeft means the interval callback never needs secondsLeft in its closure — this is the same fix as the classic setInterval stale-closure bug, kept inside a single reusable hook."
      />

      <PosterQuickRef
        title="Which recipe do I reach for?"
        rows={[
          { need: 'Search-as-you-type without spamming the API', answer: 'useDebouncedValue' },
          { need: 'Component needs data + loading + error UI', answer: 'useFetch (with AbortController)' },
          { need: 'Load more rows as the user scrolls', answer: 'useInfiniteScroll (IntersectionObserver)' },
          { need: 'Dropdown/menu should close on outside click', answer: 'useClickOutside' },
          { need: 'Cmd/Ctrl+K style shortcuts', answer: 'useKeyboardShortcut' },
          { need: 'Persist a value across reloads', answer: 'useLocalStorage' },
          { need: 'Modal must escape a parent\'s overflow/z-index', answer: 'createPortal' },
          { need: 'Long-lived callback needs the freshest prop/state', answer: 'useLatest' },
          { need: 'Read last render\'s value of something', answer: 'usePrevious' },
          { need: 'Component must react to viewport size', answer: 'useMediaQuery (useSyncExternalStore)' },
        ]}
      />
    </PosterLayout>
  );
}
