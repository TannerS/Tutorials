import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Hooks() {
  return (
    <LessonLayout
      title="All Hooks Reference"
      sectionId="react-cheatsheet"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react-cheatsheet/patterns', label: 'Component Patterns' }}
    >
      <p>Every React hook at a glance — signatures, return types, and copy-paste examples. React 19 hooks included.</p>

      <FlowChart
        title="Hook Categories"
        chart={"graph LR\n  S[State] --> useState & useReducer & useActionState\n  C[Context] --> useContext\n  R[Refs] --> useRef & useImperativeHandle\n  E[Effects] --> useEffect & useLayoutEffect & useInsertionEffect\n  P[Performance] --> useMemo & useCallback\n  T[Transitions] --> useTransition & useDeferredValue\n  U[Utilities] --> useId & useSyncExternalStore\n  N[React 19] --> useFormStatus & useOptimistic & use"}
      />

      {/* ── State Hooks ──────────────────────────────────── */}
      <h2>useState</h2>
      <CodeBlock language="jsx" title="useState">
{`const [state, setState] = useState(initialValue);
const [state, setState] = useState(() => expensiveComputation()); // lazy init

// Functional updates (use when next state depends on prev)
setState(prev => prev + 1);

// Object state — always spread
setState(prev => ({ ...prev, name: 'new' }));

// Array state
setState(prev => [...prev, newItem]);          // add
setState(prev => prev.filter(x => x.id !== id)); // remove
setState(prev => prev.map(x => x.id === id ? { ...x, done: true } : x)); // update`}
      </CodeBlock>

      <h2>useReducer</h2>
      <CodeBlock language="jsx" title="useReducer">
{`const [state, dispatch] = useReducer(reducer, initialState);
const [state, dispatch] = useReducer(reducer, initialArg, init); // lazy init

function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'set':       return { count: action.payload };
    default:          throw new Error('Unknown action: ' + action.type);
  }
}

dispatch({ type: 'increment' });
dispatch({ type: 'set', payload: 42 });`}
      </CodeBlock>

      <h2>useContext</h2>
      <CodeBlock language="jsx" title="useContext">
{`const ThemeCtx = createContext('light');

// Provider
<ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>

// Consumer
const theme = useContext(ThemeCtx); // returns current value`}
      </CodeBlock>

      {/* ── Effect Hooks ─────────────────────────────────── */}
      <InfoBox variant="tip" title="Effect Timing — Three Hooks, Three Moments">
        <p><strong>useEffect</strong> — runs after paint (non-blocking). Use for fetching, subscriptions, logging. This is the default.</p>
        <p><strong>useLayoutEffect</strong> — runs before paint (blocking). Use only when you need to read or correct the DOM before the user sees it.</p>
        <p><strong>useInsertionEffect</strong> — runs before DOM mutations. CSS-in-JS libraries only — you will almost never use this directly.</p>
      </InfoBox>

      <h2>useEffect</h2>
      <CodeBlock language="jsx" title="useEffect Patterns">
{`// Run on every render
useEffect(() => { /* ... */ });

// Run once on mount
useEffect(() => { /* ... */ }, []);

// Run when deps change
useEffect(() => { /* ... */ }, [a, b]);

// Cleanup (runs before next effect and on unmount)
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

// Abort fetch on unmount
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(r => r.json()).then(setData);
  return () => ctrl.abort();
}, [url]);`}
      </CodeBlock>

      <h2>useLayoutEffect</h2>

      <InfoBox variant="info" title='What "Synchronous" Actually Means Here'>
        <p>React's render cycle is already synchronous — it diffs the tree and mutates the DOM in one JS execution block. The distinction is about <strong>when the browser gets control back</strong>.</p>
        <p><code>useLayoutEffect</code> fires before the browser has a chance to paint — still inside that same JS block. <code>useEffect</code> is intentionally deferred: React schedules it to run <em>after</em> the browser has painted, in a later task. That's the "async" part — not async like a Promise, but the user has already seen the new render before it fires.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Render Cycle Sequence">
{`// The actual sequence:
// 1. React renders (diffs the tree)
// 2. React mutates the DOM
// 3. useLayoutEffect fires  ← same JS block, browser hasn't painted yet
// 4. Browser paints         ← browser gets control back here
// 5. useEffect fires        ← separate task, after the user sees the update

// Why this matters — position/size corrections:
// useEffect — user briefly sees the wrong state, then it jumps (flash)
useEffect(() => {
  ref.current.style.left = computePosition(); // runs after paint — visible flash!
}, []);

// useLayoutEffect — correction happens before paint, user never sees wrong state
useLayoutEffect(() => {
  ref.current.style.left = computePosition(); // runs before paint — no flash
}, []);`}
      </CodeBlock>

      <CodeBlock language="jsx" title="useLayoutEffect — Common Patterns">
{`// Measure DOM before browser paints
useLayoutEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  setHeight(height);
}, []);

// Sync scroll position before paint
useLayoutEffect(() => {
  ref.current.scrollTop = savedScrollPosition;
}, [savedScrollPosition]);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Prefer useEffect by Default">
        <p><code>useLayoutEffect</code> blocks the browser from painting until it finishes — use it only when you need to read or mutate the DOM before the user sees anything. For data fetching, subscriptions, logging, or anything that doesn't touch layout, stick with <code>useEffect</code>.</p>
      </InfoBox>

      {/* ── Ref Hooks ────────────────────────────────────── */}
      <h2>useRef</h2>
      <CodeBlock language="jsx" title="useRef">
{`const ref = useRef(initialValue); // { current: initialValue }

// DOM ref
<input ref={ref} />
ref.current.focus();

// Mutable value (no re-render on change)
const countRef = useRef(0);
countRef.current += 1;

// Previous value pattern
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; });
  return ref.current;
}`}
      </CodeBlock>

      <h2>useImperativeHandle</h2>

      <InfoBox variant="info" title="What It Does">
        <p>By default, a ref on a component gives the parent nothing — refs don't pierce component boundaries. <code>forwardRef</code> passes the ref through, but then the parent gets the raw DOM node. <code>useImperativeHandle</code> lets you replace that with a custom object of your choosing — the parent gets exactly the methods you expose and nothing else.</p>
        <p>The methods work via <strong>closure</strong> — they close over the component's internal refs and state, so the parent is one step removed and never touches internals directly.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="useImperativeHandle">
{`const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();                     // internal ref — parent never sees this
  const [isDisabled, setIsDisabled] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => !isDisabled && inputRef.current.focus(), // closes over state
    clear: () => { inputRef.current.value = ''; },
    disable: () => setIsDisabled(true),                   // closes over setState
  }), [isDisabled]); // re-run when deps change

  return <input ref={inputRef} disabled={isDisabled} />;
});

// Parent usage
const ref = useRef();
<FancyInput ref={ref} />
ref.current.focus();   // ✅ works — calls the closure
ref.current.value;     // undefined — deliberately hidden`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Reach for It">
        <p>It's a fairly rare hook. Best fits: design system components exposing <code>open()</code>/<code>close()</code>, focus management on complex input wrappers, animation controls (<code>play()</code>/<code>pause()</code>), and video/audio players. If you find yourself using it frequently, the component API could likely be redesigned with props instead.</p>
      </InfoBox>

      {/* ── Performance Hooks ────────────────────────────── */}
      <h2>useMemo &amp; useCallback</h2>
      <CodeBlock language="jsx" title="useMemo & useCallback">
{`// Cache expensive computation
const sorted = useMemo(() => items.sort(compareFn), [items]);

// Cache function reference (for child props / deps)
const handleClick = useCallback((id) => {
  setItems(prev => prev.filter(x => x.id !== id));
}, []); // stable reference across renders

// useCallback(fn, deps) === useMemo(() => fn, deps)`}
      </CodeBlock>

      {/* ── Transition Hooks ─────────────────────────────── */}
      <h2>useTransition</h2>
      <CodeBlock language="jsx" title="useTransition">
{`const [isPending, startTransition] = useTransition();

function handleSearch(e) {
  const value = e.target.value;
  setInput(value);                          // urgent — updates immediately
  startTransition(() => {
    setFilteredResults(filterData(value));  // low-priority — React can interrupt this
  });
}

// isPending is true while the transition is in progress
{isPending && <Spinner />}`}
      </CodeBlock>

      <h2>useDeferredValue</h2>

      <InfoBox variant="info" title="useDeferredValue vs usePrevious vs Debouncing">
        <p><strong>usePrevious (useRef)</strong> — gives you the value from the last completed render. It's always one render stale, used to compare before/after.</p>
        <p><strong>useDeferredValue</strong> — gives you the current value, but lets React lag behind rendering it. Not about the past — about rendering priority. Once React finishes the expensive work, the deferred value catches up.</p>
        <p><strong>Debouncing</strong> — a plain JS pattern (not a React hook) that delays a function call until the user stops typing. Reduces how often work happens. You'd often combine debouncing (for the API call) with <code>useDeferredValue</code> (to keep the UI snappy while results render).</p>
      </InfoBox>

      <CodeBlock language="jsx" title="useDeferredValue">
{`const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);

// query updates immediately (input stays responsive)
// deferredQuery catches up whenever React has spare time
// ExpensiveList only re-renders at low priority
return (
  <>
    <input value={query} onChange={e => setQuery(e.target.value)} />
    <ExpensiveList filter={deferredQuery} />
  </>
);`}
      </CodeBlock>

      {/* ── Utility Hooks ────────────────────────────────── */}
      <h2>useId</h2>

      <InfoBox variant="info" title="No Backend — Pure React Runtime">
        <p><code>useId</code> has no database, no network, no external sync. It's a deterministic counter baked into React's rendering engine. The server and client both traverse the component tree in the same order, so they independently arrive at the same counter values — like two people counting on their fingers and always agreeing on what "5" means.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="useId — Accessibility & SSR-safe IDs">
{`// IDs are GLOBALLY unique across the entire React tree — not just per component
function PasswordField() {
  const id = useId(); // e.g. ":r0:"
  return (
    <>
      <label htmlFor={id}>Password</label>
      <input id={id} type="password" />
    </>
  );
}

// Multiple calls in the same component each get their own unique ID
function Form() {
  const nameId  = useId(); // ":r0:"
  const emailId = useId(); // ":r1:"
  return (
    <>
      <label htmlFor={nameId}>Name</label>
      <input id={nameId} />
      <label htmlFor={emailId}>Email</label>
      <input id={emailId} />
    </>
  );
}

// Two instances of the same component also get different IDs
// <Form />  →  nameId: ":r0:", emailId: ":r1:"
// <Form />  →  nameId: ":r2:", emailId: ":r3:"  (counter keeps incrementing)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Multiple React Roots — Use identifierPrefix">
        <p>If you have multiple independent React apps on the same page, each root starts its own counter from 0 and will generate conflicting IDs (<code>:r0:</code>, <code>:r1:</code>…). Fix this with <code>identifierPrefix</code>.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="identifierPrefix — Namespacing Multiple Roots">
{`createRoot(container, { identifierPrefix: 'my-app' });
// IDs become :my-app-r0:, :my-app-r1:, etc.`}
      </CodeBlock>

      <InfoBox variant="tip" title="What useId is NOT for">
        <p>Don't use it for list <code>key</code> props, anything that needs to be globally unique across users/sessions, or IDs that must stay stable if the component moves position in the tree. For those, use your data's own ID from the database.</p>
      </InfoBox>

      <h2>useSyncExternalStore</h2>

      <InfoBox variant="info" title="Why This Hook Exists">
        <p>In React 18's concurrent rendering, React can render a component multiple times before committing. If an external store updates mid-render, different parts of the UI could read different values — a "tearing" problem. <code>useSyncExternalStore</code> tells React: after every render, verify <code>getSnapshot</code> still returns the same value. If not, throw out the render and try again.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="useSyncExternalStore — Signature">
{`const snapshot = useSyncExternalStore(
  subscribe,          // (callback) => unsubscribe — called when store changes
  getSnapshot,        // () => currentValue — what to render
  getServerSnapshot   // () => serverValue  — SSR fallback (optional)
);`}
      </CodeBlock>

      <CodeBlock language="jsx" title="useSyncExternalStore — Window Width Example">
{`function useWindowWidth() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerWidth,  // client snapshot
    () => 1024                // server fallback
  );
}

function MyComponent() {
  const width = useWindowWidth();
  return <p>Window is {width}px wide</p>;
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="getSnapshot Must Be Referentially Stable">
        <p>If <code>getSnapshot</code> returns a new object on every call, React sees the value as "always changed" and will loop infinitely. Return primitives or cache the reference.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="getSnapshot — Stable vs Unstable">
{`// ❌ Bad — new object every call → infinite re-render loop
getSnapshot = () => ({ count: store.count });

// ✅ Good — primitive (stable by value)
getSnapshot = () => store.count;

// ✅ Good — same reference when data hasn't changed
let lastSnapshot = null;
getSnapshot = () => {
  const next = store.getState();
  if (!lastSnapshot || !shallowEqual(lastSnapshot, next)) lastSnapshot = next;
  return lastSnapshot;
};`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Use It">
        <p>Reach for this hook when data lives <strong>outside React</strong>, changes over time, and needs to trigger re-renders safely. Event listeners are the most common app-dev case — <code>resize</code>, <code>online</code>/<code>offline</code>, <code>storage</code>, media queries, WebSocket state. It also covers plain JS pub/sub objects and RxJS streams.</p>
        <p>The practical signal: if you're writing <code>useEffect + useState</code> just to subscribe to something external, this is the cleaner replacement. Redux, Zustand, and Jotai all use it internally so you rarely wire it up yourself — but it's the right tool any time you're connecting a browser API directly to React.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Common Real-World Use Cases">
{`// ✅ Online/offline status
const isOnline = useSyncExternalStore(
  (cb) => { window.addEventListener('online', cb); window.addEventListener('offline', cb); return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); }; },
  () => navigator.onLine,
  () => true
);

// ✅ localStorage value (synced across tabs)
const theme = useSyncExternalStore(
  (cb) => { window.addEventListener('storage', cb); return () => window.removeEventListener('storage', cb); },
  () => localStorage.getItem('theme') ?? 'light',
  () => 'light'
);

// ✅ Media query match
const isMobile = useSyncExternalStore(
  (cb) => { const mq = window.matchMedia('(max-width: 768px)'); mq.addEventListener('change', cb); return () => mq.removeEventListener('change', cb); },
  () => window.matchMedia('(max-width: 768px)').matches,
  () => false
);

// ❌ Don't reach for this when useState/useEffect is already clean enough
// useEffect + useState is fine when tearing isn't a concern (non-concurrent)`}
      </CodeBlock>

      {/* ── React 19 Hooks ───────────────────────────────── */}
      <h2>React 19 Hooks</h2>

      <InfoBox variant="info" title="React 19 — New Hooks">
        <p><strong>useActionState</strong> replaces useFormState. Works with server &amp; client actions.</p>
        <p><strong>useFormStatus</strong> reads parent form submission status.</p>
        <p><strong>useOptimistic</strong> optimistic UI updates during async actions.</p>
        <p><strong>use()</strong> reads promises &amp; context (can be called conditionally!).</p>
      </InfoBox>

      <CodeBlock language="jsx" title="useActionState (React 19)">
{`// Signature: useActionState(actionFn, initialState, permalink?)
const [state, formAction, isPending] = useActionState(
  async (prevState, formData) => {
    const res = await saveUser(formData);
    if (res.error) return { error: res.error };
    return { success: true };
  },
  { error: null }
);

<form action={formAction}>
  <input name="email" />
  <button disabled={isPending}>Save</button>
  {state.error && <p>{state.error}</p>}
</form>`}
      </CodeBlock>

      <CodeBlock language="jsx" title="useFormStatus & useOptimistic">
{`// useFormStatus — must be inside a <form>
function SubmitBtn() {
  const { pending, data, method } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
}

// useOptimistic — instant UI feedback
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (current, newItem) => [...current, { ...newItem, sending: true }]
);

async function send(formData) {
  addOptimistic({ text: formData.get('text') });
  await saveToServer(formData);
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="use() — Promise & Context">
{`// Read a promise (suspends until resolved)
function UserName({ userPromise }) {
  const user = use(userPromise); // works inside if/try blocks!
  return <span>{user.name}</span>;
}

// Read context (replaces useContext, can be conditional)
function Panel({ showTheme }) {
  if (showTheme) {
    const theme = use(ThemeContext);
    return <div className={theme}>...</div>;
  }
  return <div>default</div>;
}`}
      </CodeBlock>

      {/* ── Quick Comparison ─────────────────────────────── */}
      <h2>When to Use Which Hook</h2>
      <CodeBlock language="jsx" title="Quick Decision Guide">
{`// Need component state?      → useState (simple), useReducer (complex)
// Need side effects?         → useEffect (most), useLayoutEffect (DOM measure)
// Need a stable reference?   → useRef
// Need to skip re-renders?   → useMemo (values), useCallback (functions)
// Need shared state?         → useContext + Provider
// Need smooth transitions?   → useTransition (action), useDeferredValue (value)
// Need unique IDs?           → useId
// Need form handling?        → useActionState + useFormStatus (React 19)
// Need optimistic updates?   → useOptimistic (React 19)
// Need to read a promise?    → use() (React 19)`}
      </CodeBlock>

      {/* ── Custom Hook Template ─────────────────────────── */}
      <h2>Custom Hook Template</h2>
      <CodeBlock language="jsx" title="Custom Hook Pattern">
{`// Convention: always start with "use"
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue]; // same API as useState
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What happens if you call useState inside a condition?"}
        options={[
          "It works fine, React handles it",
          "React throws an error — hooks must be called in the same order every render",
          "It works but causes a memory leak",
          "The state resets on every render"
        ]}
        correctIndex={1}
        explanation={"React tracks hooks by call order using a linked list on the fiber node. Conditional hooks break this mapping, causing state mismatches. This is the #1 Rule of Hooks."}
        language="jsx"
      />
    </LessonLayout>
  );
}

export default Hooks;
