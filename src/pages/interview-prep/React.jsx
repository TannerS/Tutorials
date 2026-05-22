import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactInterview() {
  return (
    <LessonLayout
      title="React Interview Questions"
      sectionId="interview-prep"
      lessonIndex={0}
      prev={null}
      next={{ path: '/interview-prep/typescript', label: 'TypeScript Interview Questions' }}
    >
      {/* 1. Virtual DOM ─────────────────────────────────────────────────── */}
      <h2>1. Virtual DOM and Reconciliation</h2>
      <p>
        The Virtual DOM is a lightweight JS representation of the real DOM kept in memory. On
        every render React diffs the new virtual tree against the previous one using an{' '}
        <strong>O(n) heuristic algorithm</strong>: elements of different types produce entirely
        different trees, and developers signal stable identity with the <code>key</code> prop.
      </p>
      <CodeBlock language="jsx" title="How React diffs virtual trees">{`// Only the text node is patched — not the whole tree
const prev = <div><span>Hello</span></div>;
const next = <div><span>World</span></div>;

// Type change → React destroys Counter, mounts a fresh <input>
const a = <div><Counter /></div>;
const b = <div><input /></div>;

// Same type → React reconciles only changed props, recurses into children
const c = <Button color="blue">Save</Button>;
const d = <Button color="red">Save</Button>; // Only 'color' is patched`}</CodeBlock>

      <InteractiveChallenge
        question={"What time complexity does React's reconciliation algorithm achieve?"}
        options={["O(n³)", "O(n²)", "O(n log n)", "O(n)"]}
        correctIndex={3}
        explanation={"React uses two heuristics — element-type comparison and the key prop — to reduce the naive O(n³) tree-diff to O(n), making reconciliation practical for large component trees."}
        language="jsx"
      />

      {/* 2. Fiber ───────────────────────────────────────────────────────── */}
      <h2>2. React Fiber Architecture</h2>
      <p>
        Fiber (React 16) rewrote the reconciler to be <em>interruptible</em>. The old Stack
        reconciler processed the entire tree synchronously, blocking the main thread for
        hundreds of milliseconds on large updates. Fiber breaks work into small units — one
        per React element — so the scheduler can pause, prioritise, or abort between units.
        React 18 added <strong>Lanes</strong>, a bitmask priority model powering{' '}
        <code>startTransition</code> and concurrent rendering.
      </p>
      <FlowChart
        title="Fiber Work Loop"
        chart={"graph TD\n  A[scheduleUpdateOnFiber] --> B[Render Phase — interruptible]\n  B --> C[beginWork — recurse down]\n  C --> D[completeWork — bubble up]\n  D --> E{More units?}\n  E -->|Yes — yield to browser| C\n  E -->|No| F[Commit Phase — synchronous]\n  F --> G[DOM mutations]\n  F --> H[useLayoutEffect]\n  F --> I[useEffect queued async]"}
      />
      <InfoBox variant="tip" title="startTransition">
        Wrap non-urgent updates in <code>startTransition</code> to mark them as interruptible.
        React defers them in favour of urgent interactions like typing, keeping the UI
        responsive during expensive re-renders.
      </InfoBox>

      {/* 3. Rules of Hooks ──────────────────────────────────────────────── */}
      <h2>3. Rules of Hooks</h2>
      <p>
        React tracks hook state via a <strong>singly-linked list</strong> on the fiber node.
        The list is built during the first render and replayed in the same order every time.
        Skipping a hook call (via a conditional) desynchronises the list — React reads the
        wrong state slot for every hook that follows.
      </p>
      <CodeBlock language="jsx" title="Why hooks cannot be conditional">{`// ❌ BAD — conditional hook breaks the linked list
function Bad({ show }) {
  if (show) {
    const [count, setCount] = useState(0); // Slot 0 only sometimes
  }
  const [name, setName] = useState('');    // Slot 0 OR 1 — unpredictable
}

// ✅ GOOD — unconditional calls, conditional usage
function Good({ show }) {
  const [count, setCount] = useState(0); // Always slot 0
  const [name, setName]   = useState(''); // Always slot 1
  const display = show ? count : null;   // Use conditionally, not the call

  if (!name) return <Spinner />; // Early return is fine — AFTER all hooks
}`}</CodeBlock>
      <InfoBox variant="warning" title="eslint-plugin-react-hooks">
        The <code>rules-of-hooks</code> and <code>exhaustive-deps</code> ESLint rules catch
        violations at lint time. Install them in every React project.
      </InfoBox>

      {/* 4. useState vs useReducer ──────────────────────────────────────── */}
      <h2>4. useState vs useReducer</h2>
      <p>
        Use <code>useState</code> for isolated, simple values. Reach for{' '}
        <code>useReducer</code> when multiple state fields change together, transitions are
        complex, or you want co-located, testable reducer logic.
      </p>
      <CodeBlock language="jsx" title="useReducer for multi-step form state">{`const init = { name: '', email: '', status: 'idle', error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value };
    case 'SUBMIT':    return { ...state, status: 'loading', error: null };
    case 'SUCCESS':   return { ...state, status: 'success' };
    case 'ERROR':     return { ...state, status: 'error', error: action.msg };
    default:          return state;
  }
}

function ContactForm() {
  const [state, dispatch] = useReducer(reducer, init);

  const onChange = (e) =>
    dispatch({ type: 'SET_FIELD', field: e.target.name, value: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT' });
    try   { await api.post('/contact', state); dispatch({ type: 'SUCCESS' }); }
    catch (err) { dispatch({ type: 'ERROR', msg: err.message }); }
  };

  return (
    <form onSubmit={onSubmit}>
      <input name="name" value={state.name} onChange={onChange} />
      {state.error && <p>{state.error}</p>}
      <button disabled={state.status === 'loading'}>Send</button>
    </form>
  );
}`}</CodeBlock>

      <InteractiveChallenge
        question={"When should you prefer useReducer over useState?"}
        options={[
          "Always — useReducer is strictly more powerful",
          "When state is a single boolean",
          "When state has multiple sub-values or transition logic is complex",
          "Only when using TypeScript"
        ]}
        correctIndex={2}
        explanation={"useReducer shines when multiple state fields change together, or when transitions are complex enough that a pure reducer function improves readability and makes logic independently testable."}
        language="jsx"
      />

      {/* 5. useEffect deps ──────────────────────────────────────────────── */}
      <h2>5. useEffect Dependency Array</h2>
      <p>
        Omitting a dependency causes a <strong>stale closure</strong> — the effect captures
        an old value. Including an object or function literal causes an{' '}
        <strong>infinite loop</strong> because those references are recreated on every render.
      </p>
      <CodeBlock language="jsx" title="Stale closure bug and two correct fixes">{`// ❌ BUG — interval captures count = 0 forever (missing dep)
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, []); // 'count' is stale

// ✅ FIX 1 — add count to deps (interval re-created each change)
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]);

// ✅ FIX 2 — functional updater (no dep needed, no stale closure)
useEffect(() => {
  const id = setInterval(() => setCount(prev => prev + 1), 1000);
  return () => clearInterval(id);
}, []);

// ❌ INFINITE LOOP — object literal is new ref every render
useEffect(() => { fetchData(opts); }, [{ page }]); // New object each render!
// ✅ FIX — use the primitive value as dep
useEffect(() => { fetchData({ page }); }, [page]);`}</CodeBlock>

      {/* 6. memo / useMemo / useCallback ────────────────────────────────── */}
      <h2>6. React.memo vs useMemo vs useCallback</h2>
      <p>
        Three different levels of memoization: <code>React.memo</code> wraps a{' '}
        <em>component</em>, <code>useMemo</code> caches a <em>computed value</em>, and{' '}
        <code>useCallback</code> caches a <em>function reference</em> (useMemo where the
        factory returns a function).
      </p>
      <CodeBlock language="jsx" title="All three working together">{`// React.memo — skips re-render when props are shallowly equal
const SortedList = React.memo(({ items, onSelect }) => (
  <ul>{items.map(i => <li key={i.id} onClick={() => onSelect(i.id)}>{i.name}</li>)}</ul>
));

function Parent({ data, onSelect }) {
  // useMemo — only re-sort when 'data' reference changes
  const sorted = useMemo(
    () => [...data].sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  );
  // useCallback — stable ref so SortedList.memo comparison passes
  const handleSelect = useCallback((id) => onSelect(id), [onSelect]);

  return <SortedList items={sorted} onSelect={handleSelect} />;
}
// ⚠️  Don't over-memoize — measure first. Memoization itself has cost.`}</CodeBlock>
      <InfoBox variant="warning" title="When NOT to memoize">
        Memoization adds allocation overhead and code noise. Apply it only where profiling
        shows measurable re-render cost — not as a default defensive pattern.
      </InfoBox>

      {/* 7. Context performance ─────────────────────────────────────────── */}
      <h2>7. Context API Performance</h2>
      <p>
        Every consumer re-renders when the context <em>value reference</em> changes — even
        if the consumer only reads a field that didn't change. The fix is to split contexts
        by update frequency.
      </p>
      <CodeBlock language="jsx" title="Split contexts to prevent unnecessary re-renders">{`// ❌ PROBLEM — changing theme re-renders every consumer including UserAvatar
const AppCtx = createContext();
function App() {
  const [user, setUser]   = useState(null);
  const [theme, setTheme] = useState('light');
  return <AppCtx.Provider value={{ user, setUser, theme, setTheme }}><Tree /></AppCtx.Provider>;
}

// ✅ FIX — separate contexts; theme consumers don't re-render on user change
const UserCtx  = createContext();
const ThemeCtx = createContext();
function App() {
  const [user, setUser]   = useState(null);
  const [theme, setTheme] = useState('light');
  return (
    <UserCtx.Provider value={{ user, setUser }}>
      <ThemeCtx.Provider value={{ theme, setTheme }}>
        <Tree />
      </ThemeCtx.Provider>
    </UserCtx.Provider>
  );
}`}</CodeBlock>

      {/* 8. Controlled vs Uncontrolled ──────────────────────────────────── */}
      <h2>8. Controlled vs Uncontrolled Components</h2>
      <p>
        In a <strong>controlled</strong> component React state is the single source of truth.
        In an <strong>uncontrolled</strong> component the DOM owns the value; you pull it via
        a ref. Uncontrolled inputs suit file pickers and non-React library integrations.
      </p>
      <CodeBlock language="jsx" title="Both patterns side-by-side">{`// Controlled — React drives the value on every keystroke
function ControlledInput() {
  const [val, setVal] = useState('');
  return <input value={val} onChange={(e) => setVal(e.target.value)} />;
}

// Uncontrolled — DOM owns the value, ref reads it on demand
function UncontrolledInput() {
  const ref = useRef(null);
  const onSubmit = () => console.log(ref.current.value);
  return (
    <>
      <input ref={ref} defaultValue="" />
      <button onClick={onSubmit}>Submit</button>
    </>
  );
}`}</CodeBlock>

      <InteractiveChallenge
        question={"Which pattern best supports cross-field validation (e.g. confirm-password must match password)?"}
        options={[
          "Uncontrolled — refs are faster",
          "Controlled — both values live in state and can be compared on every change",
          "Both are equally suited",
          "Neither — always use a form library"
        ]}
        correctIndex={1}
        explanation={"Controlled components store every field's current value in state, so cross-field validation is a simple state comparison on every change. Uncontrolled components require imperative ref reads which makes this awkward."}
        language="jsx"
      />

      {/* 9. Key Prop ────────────────────────────────────────────────────── */}
      <h2>9. The key Prop</h2>
      <p>
        React uses <code>key</code> to decide whether a list item should be <em>updated</em>{' '}
        or <em>replaced</em>. A bad key strategy produces subtle state bugs.
      </p>
      <CodeBlock language="jsx" title="Key prop pitfalls and the correct pattern">{`// ❌ Index as key — inserting at the front shifts all keys
// React thinks existing inputs changed, not that a new one appeared
people.map((name, i) => <TextInput key={i} defaultValue={name} />);

// ❌ Random key — remounts every component on every render
people.map((name) => <TextInput key={Math.random()} defaultValue={name} />);

// ✅ Stable unique ID from data
users.map((u) => <TextInput key={u.id} defaultValue={u.name} />);

// ✅ Intentional reset trick — changing key forces unmount + fresh mount
<ProfileForm key={selectedUserId} userId={selectedUserId} />`}</CodeBlock>

      {/* 10. Error Boundaries ───────────────────────────────────────────── */}
      <h2>10. Error Boundaries</h2>
      <p>
        Error boundaries are class components that catch render-time errors in their child
        tree. <code>getDerivedStateFromError</code> runs during render to show a fallback;{' '}
        <code>componentDidCatch</code> runs after commit and is the right place for logging.
      </p>
      <CodeBlock language="jsx" title="Production-ready ErrorBoundary">{`class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true }; // Render fallback on next paint
  }

  componentDidCatch(error, info) {
    reportToSentry(error, { componentStack: info.componentStack });
  }

  render() {
    return this.state.hasError
      ? (this.props.fallback ?? <h2>Something went wrong.</h2>)
      : this.props.children;
  }
}

// Granular boundaries limit blast radius
function App() {
  return (
    <ErrorBoundary fallback={<AppError />}>
      <Header />
      <ErrorBoundary fallback={<WidgetError />}>
        <RevenueWidget />   {/* won't crash Header if it throws */}
      </ErrorBoundary>
    </ErrorBoundary>
  );
}`}</CodeBlock>

      {/* 11. React 19 ───────────────────────────────────────────────────── */}
      <h2>11. React 19 Features</h2>
      <p>
        React 19 (stable Dec 2024) introduces <code>use()</code>, Server Actions,{' '}
        <code>useActionState</code>, and the React Compiler — each targeting a different pain
        point in the data-fetching and optimisation story.
      </p>
      <CodeBlock language="jsx" title="React 19 key features">{`// 1. use() — read a promise inline during render (Suspense-powered)
import { use } from 'react';
function UserCard({ userPromise }) {
  const user = use(userPromise); // Suspends until resolved
  return <h1>{user.name}</h1>;
}

// 2. Server Actions — async functions that run on the server
async function save(formData) {
  'use server';
  await db.users.update({ name: formData.get('name') });
}
function ProfileForm() {
  return <form action={save}><input name="name" /><button>Save</button></form>;
}

// 3. useActionState — pending/error state for async actions
const [state, formAction, isPending] = useActionState(save, null);

// 4. React Compiler — auto-inserts useMemo/useCallback via static analysis
// You write plain React; the compiler handles memoisation.`}</CodeBlock>

      {/* 12. Suspense / Lazy ────────────────────────────────────────────── */}
      <h2>12. Suspense and Lazy Loading</h2>
      <p>
        <code>React.lazy</code> enables route-level code splitting — the chunk for a lazy
        component downloads only when React first tries to render it. Nested{' '}
        <code>Suspense</code> boundaries give granular, declarative loading states.
      </p>
      <CodeBlock language="jsx" title="Lazy loading with nested Suspense boundaries">{`const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports   = lazy(() => import('./pages/Reports'));

function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports"   element={<Reports />} />
      </Routes>
    </Suspense>
  );
}

// Nested boundaries — each section can suspend independently
function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardHeader />
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />      {/* suspends independently of table */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <TransactionsTable />
      </Suspense>
    </Suspense>
  );
}`}</CodeBlock>

      {/* 13. Custom Hooks ───────────────────────────────────────────────── */}
      <h2>13. Custom Hook Patterns</h2>
      <p>
        Custom hooks extract stateful logic into reusable functions without adding wrapper
        components. They must start with <code>use</code> so the linter can enforce the Rules
        of Hooks on them. Return a <em>tuple</em> for a single primary value; return a{' '}
        <em>named object</em> when exposing many values.
      </p>
      <CodeBlock language="jsx" title="useDebounce custom hook">{`function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // Cancel on value/delay change
  }, [value, delay]);

  return debounced; // Single value — return directly (not as object)
}

// Consumer
function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery    = useDebounce(query, 500);

  useEffect(() => {
    if (!debouncedQuery) return;
    fetch(\`/api/search?q=\${encodeURIComponent(debouncedQuery)}\`)
      .then(r => r.json()).then(setResults);
  }, [debouncedQuery]); // Only fires 500 ms after the user stops typing

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}`}</CodeBlock>

      {/* 14. State location ─────────────────────────────────────────────── */}
      <h2>14. Lifting State vs Composition vs Context</h2>
      <p>
        Use this decision tree when deciding where state should live. Try the simplest
        option first before introducing Context or a state-management library.
      </p>
      <FlowChart
        title="Where Should State Live?"
        chart={"graph TD\n  A[Needed in multiple components?] -->|No| B[Keep it local]\n  A -->|Yes| C[Components close in the tree?]\n  C -->|Yes| D[Lift to common ancestor]\n  C -->|No| E[Deep prop drilling?]\n  E -->|No| D\n  E -->|Yes| F[Changes frequently?]\n  F -->|Yes| G[Zustand / Jotai / Redux]\n  F -->|No| H[React Context]"}
      />
      <InfoBox variant="info" title="Composition Before Context">
        Passing JSX as <code>children</code> or render props often eliminates prop drilling
        entirely — no Context overhead, no extra provider wrapping needed.
      </InfoBox>

      {/* 15. Render Props vs HOC vs Hooks ───────────────────────────────── */}
      <h2>15. Render Props vs HOCs vs Hooks</h2>
      <p>
        Three patterns for reusing stateful logic — the same mouse-position problem solved
        three ways, showing React's evolution from 2016 to today.
      </p>
      <CodeBlock language="jsx" title="Mouse-position tracking in all three patterns">{`// 1. RENDER PROPS (2016) — caller controls rendering via a function prop
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };
  move = (e) => this.setState({ x: e.clientX, y: e.clientY });
  render() {
    return <div onMouseMove={this.move}>{this.props.render(this.state)}</div>;
  }
}
// Usage: <MouseTracker render={({ x, y }) => <p>{x}, {y}</p>} />
// Drawback: "wrapper hell" — nested Trackers create deeply indented JSX

// 2. HOC (2017) — injects behaviour as props via a wrapping component
const withMouse = (Wrapped) => (props) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      <Wrapped {...props} mousePos={pos} />
    </div>
  );
};
// Usage: const EnhancedChart = withMouse(Chart);
// Drawback: prop-name collisions; opaque DevTools component tree

// 3. CUSTOM HOOK (2019+) — pure logic, no wrapper component at all
function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);
  return pos;
}
// Usage: const { x, y } = useMouse(); — cleanest; composes with other hooks`}</CodeBlock>

      <InteractiveChallenge
        question={"Why did custom hooks largely replace HOCs and Render Props?"}
        options={[
          "Hooks execute faster at runtime than HOC wrappers",
          "Hooks avoid wrapper nesting, have no prop-collision risk, and compose via simple function calls",
          "HOCs and Render Props were officially removed in React 17",
          "Hooks only work with functional components, which are always faster"
        ]}
        correctIndex={1}
        explanation={"Hooks eliminate 'wrapper hell' visible in DevTools, avoid prop-name collisions between multiple HOCs, and compose cleanly by calling multiple hooks in sequence — all without adding any extra DOM nodes or component layers."}
        language="jsx"
      />

    </LessonLayout>
  );
}
