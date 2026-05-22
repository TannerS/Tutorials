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
      <h2>Effect Hooks</h2>

      <InfoBox variant="tip" title="Effect Timing">
        <p><strong>useEffect</strong> — runs after paint (non-blocking). Most common.</p>
        <p><strong>useLayoutEffect</strong> — runs before paint (blocking). Use for DOM measurements.</p>
        <p><strong>useInsertionEffect</strong> — runs before DOM mutations. CSS-in-JS libraries only.</p>
      </InfoBox>

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

      <CodeBlock language="jsx" title="useLayoutEffect">
{`// Measure DOM before browser paints
useLayoutEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  setHeight(height);
}, []);`}
      </CodeBlock>

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
      <CodeBlock language="jsx" title="useImperativeHandle">
{`const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    scrollIntoView: () => inputRef.current.scrollIntoView(),
  }));
  return <input ref={inputRef} />;
});

// Parent: ref.current.focus()`}
      </CodeBlock>

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
      <h2>useTransition &amp; useDeferredValue</h2>
      <CodeBlock language="jsx" title="useTransition">
{`const [isPending, startTransition] = useTransition();

function handleSearch(e) {
  const value = e.target.value;
  setInput(value);                     // urgent update
  startTransition(() => {
    setFilteredResults(filterData(value)); // low-priority
  });
}

// useDeferredValue — defer a value
const deferredQuery = useDeferredValue(query);
// UI stays responsive; deferredQuery lags behind query`}
      </CodeBlock>

      {/* ── Utility Hooks ────────────────────────────────── */}
      <h2>useId &amp; useSyncExternalStore</h2>
      <CodeBlock language="jsx" title="useId & useSyncExternalStore">
{`// Unique ID for accessibility attributes
const id = useId();
<label htmlFor={id}>Email</label>
<input id={id} type="email" />

// Subscribe to external store (Redux, Zustand, browser APIs)
const width = useSyncExternalStore(
  (callback) => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  },
  () => window.innerWidth,           // getSnapshot (client)
  () => 1024                          // getServerSnapshot (SSR)
);`}
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
