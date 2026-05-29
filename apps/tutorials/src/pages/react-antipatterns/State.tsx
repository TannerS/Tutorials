import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function State() {
  return (
    <LessonLayout
      title="State Anti-Patterns"
      sectionId="react-antipatterns"
      lessonIndex={1}
      prev={{ path: '/react-antipatterns/intro', label: 'Anti-Patterns Overview' }}
      next={{ path: '/react-antipatterns/effects', label: 'useEffect Anti-Patterns' }}
    >
      <p>
        State is the heart of any React application, but misusing it is one of the most
        common sources of bugs, unnecessary re-renders, and tangled code. This lesson
        walks through the seven most frequent state anti-patterns and shows you how to
        fix each one.
      </p>

      <FlowChart
        title="State Decision Tree — Do I Need This in State?"
        chart={"graph TD\nA[\"Do I need this value?\"] -->|Yes| B{\"Can it be derived from existing state or props?\"}\nA -->|No| Z[\"Don't store it at all\"]\nB -->|Yes| C[\"Compute it inline or with useMemo\"]\nB -->|No| D{\"Does changing it affect what renders?\"}\nD -->|Yes| E[\"Use useState or useReducer\"]\nD -->|No| F[\"Use useRef\"]\nE --> G{\"Is it shared across components?\"}\nG -->|No| H[\"Keep it local\"]\nG -->|Yes — siblings| I[\"Lift state to common parent\"]\nG -->|Yes — deep tree| J[\"Use Context or state library\"]"}
      />

      {/* ---- 1. Duplicating Derived State ---- */}
      <h2>1. Duplicating State (Derived State Stored Separately)</h2>

      <InfoBox variant="danger" title="The Problem">
        Storing a value in state that can be derived from other state or props creates
        two sources of truth. They inevitably drift out of sync and cause subtle bugs.
      </InfoBox>

      <CodeBlock language="jsx" title="❌ BAD — Duplicated derived state">
        {`function UserProfile({ user }) {
  const [fullName, setFullName] = useState(
    user.firstName + ' ' + user.lastName
  );

  // Bug: fullName is stale whenever the user prop changes
  // unless you add a useEffect to sync it — more code, more bugs.
  return <h1>{fullName}</h1>;
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Derive the value directly">
        {`function UserProfile({ user }) {
  // Computed on every render — always in sync, zero extra state.
  const fullName = user.firstName + ' ' + user.lastName;

  return <h1>{fullName}</h1>;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Rule of Thumb">
        If you can calculate a value from existing state or props, don't put it in
        state. Just compute it during render.
      </InfoBox>

      {/* ---- 2. State That Should Be Computed ---- */}
      <h2>2. State That Should Be Computed</h2>

      <p>
        A common variation of duplication is storing filtered or sorted lists in state
        when they should be derived with <code>useMemo</code> or computed inline.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Filtered list stored in state and synced with useEffect">
        {`function ProductList({ products }) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState(products);

  useEffect(() => {
    setFiltered(
      products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [products, query]);

  // BUG: For one render frame, "filtered" holds STALE data because
  // the effect runs AFTER render, not during it.

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {filtered.map(p => <ProductCard key={p.id} product={p} />)}
    </>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Derive with useMemo">
        {`function ProductList({ products }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ),
    [products, query]
  );

  // Always in sync, no stale frame, no extra state.

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {filtered.map(p => <ProductCard key={p.id} product={p} />)}
    </>
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="useMemo vs Inline Computation">
        Use <code>useMemo</code> when the computation is expensive (large lists,
        complex sorting). For cheap calculations, computing inline without
        <code> useMemo</code> is perfectly fine and keeps the code simpler.
      </InfoBox>

      <InfoBox variant="warning" title="Lazy Initialization — useState(fn) vs useState(fn())">
        If you ever legitimately need to compute an initial value for{' '}
        <code>useState</code>, always pass a <em>function</em>, not a function call.
        <br /><br />
        <strong>Why it matters:</strong> JavaScript evaluates arguments before calling
        a function. So <code>useState(expensiveComputation())</code> runs the computation
        on <em>every render</em> — React just throws the result away after mount.
        With <code>useState(() =&gt; expensiveComputation())</code>, React checks{' '}
        <code>typeof initialValue === 'function'</code>, calls it once on mount, and
        discards the new function reference on every re-render without ever invoking it.
        <br /><br />
        <strong>The new arrow function reference created each render is essentially
        free</strong> — the savings come from the function body never executing.

        <CodeBlock language="jsx" title="Lazy initialization">
          {`// ❌ expensiveComputation() runs on every render
const [data] = useState(expensiveComputation());

// ✅ expensiveComputation() runs once — React controls the call
const [data] = useState(() => expensiveComputation());`}
        </CodeBlock>
      </InfoBox>

      {/* ---- 3. Prop Drilling ---- */}
      <h2>3. Prop Drilling Instead of Context or Composition</h2>

      <p>
        Passing state through many intermediate components that don't use it
        creates fragile, hard-to-refactor code.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Prop drilling through layers">
        {`function App() {
  const [theme, setTheme] = useState('light');
  return <Dashboard theme={theme} setTheme={setTheme} />;
}

function Dashboard({ theme, setTheme }) {
  // Dashboard doesn't use theme — just forwards it.
  return <Sidebar theme={theme} setTheme={setTheme} />;
}

function Sidebar({ theme, setTheme }) {
  // Sidebar doesn't use theme either — just forwards it.
  return <ThemeToggle theme={theme} setTheme={setTheme} />;
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Use Context to skip intermediate layers">
        {`const ThemeContext = createContext();

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Dashboard />
    </ThemeContext.Provider>
  );
}

function Dashboard() {
  return <Sidebar />;
}

function Sidebar() {
  return <ThemeToggle />;
}

function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Context vs Composition">
        Before reaching for Context, consider component composition — passing
        components as <code>children</code> or using render props can often
        eliminate prop drilling without adding a provider.
      </InfoBox>

      {/* ---- 4. State for Non-Rendering Values ---- */}
      <h2>4. Using State for Values That Don't Affect Rendering</h2>

      <p>
        Values like timer IDs, previous values, or DOM measurements don't need to
        trigger re-renders. Using <code>useState</code> for them wastes cycles.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Timer ID stored in state causes needless re-renders">
        {`function Stopwatch() {
  const [time, setTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const start = () => {
    // Every setIntervalId call triggers a re-render for no visual change
    setIntervalId(setInterval(() => setTime(t => t + 1), 1000));
  };

  const stop = () => {
    clearInterval(intervalId);
    setIntervalId(null); // Another wasted re-render
  };

  return (
    <div>
      <span>{time}s</span>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Timer ID in a ref">
        {`function Stopwatch() {
  const [time, setTime] = useState(0);
  const intervalRef = useRef(null);

  const start = () => {
    intervalRef.current = setInterval(() => setTime(t => t + 1), 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  return (
    <div>
      <span>{time}s</span>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="useRef Cheat Sheet">
        Use <code>useRef</code> for timer IDs, previous prop/state snapshots, DOM
        element references, render counters, and any mutable value that should persist
        across renders without triggering them.
      </InfoBox>

      <InfoBox variant="warning" title="Timing Trap: useEffect Runs After the Render Returns">
        <p>
          React's render cycle has a specific order:
        </p>
        <ol>
          <li>Your component function runs top-to-bottom</li>
          <li>The function <strong>returns</strong> its JSX (the render is done)</li>
          <li>React commits changes to the DOM</li>
          <li><code>useEffect</code> fires — only now does <code>ref.current</code> update</li>
        </ol>
        <p>
          This means any value you read from <code>ref.current</code> during the render
          (steps 1–2) reflects the <em>previous</em> render's effect, not the current one.
          On the very first render, <code>ref.current</code> is still the initial value
          when the function returns.
        </p>
        <CodeBlock language="jsx" title="Timing trap — ref.current lags one render behind">
          {`function useSomeHook(value) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current = value; // ← runs AFTER the render returns
  });

  return ref.current; // ← runs DURING render — always one render behind
}
// First render:  value = "hello", but ref.current is still null
// Second render: value = "world", but ref.current is still "hello"`}
        </CodeBlock>
        <p>
          Think of <code>useEffect</code> as a postcard sent after the fact — the
          render already finished and handed back its result before the postcard arrives.
          If you need a value to be current <em>during</em> render, compute it inline or
          store it in state rather than relying on a ref updated by an effect.
        </p>
      </InfoBox>

      <FlowChart
        title="React Render Lifecycle — When Each Hook Fires"
        chart={"graph TD\nA[\"Trigger: mount, state change, or prop change\"] --> B[\"① Render Phase — component function runs\"]\nB --> C[\"useState / useReducer — read current state\"]\nC --> D[\"useContext — read subscribed context value\"]\nD --> E[\"useMemo / useCallback — recompute if deps changed\"]\nE --> F[\"useRef — .current is readable, but effect-updates from\\nthe previous render only\"]\nF --> G[\"Component returns JSX\"]\nG --> H[\"② Commit Phase — React patches the DOM\"]\nH --> I[\"useLayoutEffect cleanup from previous render\"]\nI --> J[\"③ useLayoutEffect fires — synchronous, before paint\"]\nJ --> K[\"Browser paints the screen\"]\nK --> L[\"useEffect cleanup from previous render\"]\nL --> M[\"④ useEffect fires — asynchronous, after paint\"]"}
      />

      <InfoBox variant="info" title="Hook Timing Cheat Sheet">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid currentColor', textAlign: 'left' }}>
              <th style={{ paddingBottom: '0.5rem', paddingRight: '1rem' }}>Hook</th>
              <th style={{ paddingBottom: '0.5rem', paddingRight: '1rem' }}>When it runs</th>
              <th style={{ paddingBottom: '0.5rem' }}>Key behaviour</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['useState / useReducer', 'During render', 'Reads current state. Setter calls are batched and schedule a re-render — they do not mutate immediately.'],
              ['useContext', 'During render', 'Reads the nearest provider value. Component re-renders whenever that value changes.'],
              ['useMemo / useCallback', 'During render', 'Recomputes only when dependencies change. Skipped entirely on re-renders where deps are unchanged.'],
              ['useRef', 'During render', '.current is readable, but any value written by a useEffect won\'t appear until the next render.'],
              ['useLayoutEffect', 'After commit, before paint', 'Synchronous. Runs after React updates the DOM but before the browser draws. Use for DOM measurements or mutations that need to be invisible to the user.'],
              ['useEffect', 'After paint', 'Asynchronous. Runs after the browser has painted. The safe default for data fetching, subscriptions, and side effects.'],
            ].map(([hook, when, behaviour]) => (
              <tr key={hook} style={{ borderBottom: '1px solid rgba(128,128,128,0.2)', verticalAlign: 'top' }}>
                <td style={{ padding: '0.5rem 1rem 0.5rem 0', whiteSpace: 'nowrap' }}><code>{hook}</code></td>
                <td style={{ padding: '0.5rem 1rem 0.5rem 0', whiteSpace: 'nowrap' }}>{when}</td>
                <td style={{ padding: '0.5rem 0' }}>{behaviour}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
          <strong>Cleanup order on re-render:</strong> React runs the <em>previous</em> render's
          cleanup (<code>return () =&gt; ...</code>) before firing the new effect — first{' '}
          <code>useLayoutEffect</code> cleanup, then <code>useEffect</code> cleanup.
          On unmount, both cleanups run in that same order with no new effect following.
        </p>
      </InfoBox>

      {/* ---- 5. Mutating State Directly ---- */}
      <h2>5. Mutating State Directly Instead of Immutable Updates</h2>

      <InfoBox variant="warning" title="React Relies on Immutability">
        React uses referential equality (<code>Object.is</code>) to detect state
        changes. Mutating an existing object or array keeps the same reference, so
        React skips the re-render and your UI goes stale.
      </InfoBox>

      <CodeBlock language="jsx" title="❌ BAD — Mutating an array in state">
        {`function TodoList() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    // WRONG: push mutates the existing array
    todos.push({ id: Date.now(), text, done: false });
    setTodos(todos); // Same reference — React won't re-render!
  };

  const toggleTodo = (id) => {
    // WRONG: mutating an object inside the array
    const todo = todos.find(t => t.id === id);
    todo.done = !todo.done;
    setTodos([...todos]); // Shallow copy hides the mutation but is fragile
  };

  return <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>;
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Immutable updates">
        {`function TodoList() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    setTodos(prev => [...prev, { id: Date.now(), text, done: false }]);
  };

  const toggleTodo = (id) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const removeTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  return <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>;
}`}
      </CodeBlock>

      {/* ---- 6. Single Mega-State Object ---- */}
      <h2>6. Single Mega-State Object vs Granular States</h2>

      <p>
        Cramming every piece of state into one giant object makes updates verbose,
        error-prone, and forces unnecessary re-renders of unrelated UI.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — One object to rule them all">
        {`function RegistrationForm() {
  const [state, setState] = useState({
    name: '',
    email: '',
    password: '',
    acceptedTerms: false,
    step: 1,
    errors: {},
    isSubmitting: false,
  });

  const handleNameChange = (e) => {
    // Must spread the entire object for every tiny update
    setState(prev => ({ ...prev, name: e.target.value }));
  };

  const handleEmailChange = (e) => {
    setState(prev => ({ ...prev, email: e.target.value }));
  };

  // ... repeated for every field — verbose and error-prone
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Granular state or useReducer">
        {`// Option A: Separate useState for independent values
function RegistrationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState(1);

  // Each setter is simple and only re-renders what depends on it.
}

// Option B: useReducer when transitions are complex
function RegistrationForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);

  return (
    <input
      value={state.name}
      onChange={e =>
        dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })
      }
    />
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="When a Single Object Is OK">
        A single state object is fine when the values always change together (e.g.,
        x/y coordinates) or when you manage them via <code>useReducer</code> with
        well-defined actions. The anti-pattern is dumping unrelated values into one
        blob managed with <code>useState</code>.
      </InfoBox>

      {/* ---- 7. Syncing State Between Components ---- */}
      <h2>7. Syncing State Between Components (Lift State Up)</h2>

      <p>
        When two sibling components need the same data, duplicating state in both and
        trying to keep them in sync is a recipe for bugs. Lift the state to their
        common parent instead.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Duplicated state in sibling components">
        {`function SearchInput() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}

function SearchResults() {
  const [query, setQuery] = useState('');
  // How does this stay in sync with SearchInput?
  // Answer: it doesn't — they are completely independent copies.
  const results = useSearch(query);
  return <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>;
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Single source of truth in the parent">
        {`function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <>
      <SearchInput query={query} onQueryChange={setQuery} />
      <SearchResults query={query} />
    </>
  );
}

function SearchInput({ query, onQueryChange }) {
  return (
    <input value={query} onChange={e => onQueryChange(e.target.value)} />
  );
}

function SearchResults({ query }) {
  const results = useSearch(query);
  return <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>;
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Single Source of Truth">
        Every piece of state should have exactly one owner. Other components either
        receive it as a prop, read it from Context, or derive it. Never duplicate it.
      </InfoBox>

      {/* ---- Flow Chart: Where State Lives ---- */}
      <FlowChart
        title="Choosing Where State Lives"
        chart={"graph TD\nA[\"Which components need this state?\"] --> B{\"Only one component?\"}\nB -->|Yes| C[\"Keep it local in that component\"]\nB -->|No| D{\"Siblings or parent-child?\"}\nD -->|Siblings| E[\"Lift state to their common parent\"]\nD -->|Deeply nested| F{\"Many layers between?\"}\nF -->|Yes| G[\"Use Context or a state library\"]\nF -->|No| H[\"Pass as props\"]"}
      />

      {/* ---- Interactive Challenges ---- */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"You need to track how many times a component has rendered for debugging. Which hook should you use?"}
        options={[
          'useState — increment a counter on every render',
          'useRef — mutate .current without triggering re-renders',
          'useEffect with a counter stored in state',
          'useMemo with an incrementing counter',
        ]}
        correctIndex={1}
        explanation="useRef is the correct choice because updating a ref does not trigger a re-render. Using useState would cause an infinite render loop — every state update triggers another render, which increments the counter, which triggers another render."
      />

      <InteractiveChallenge
        question={"A component stores a filteredUsers array in state and syncs it via useEffect whenever the users prop or searchTerm state changes. Which anti-patterns does this exhibit?"}
        options={[
          'Only prop drilling',
          'Duplicated derived state AND state that should be computed',
          'Mutating state directly',
          'Using state for non-rendering values',
        ]}
        correctIndex={1}
        explanation="Storing filteredUsers in state duplicates information that can be derived from users and searchTerm. The useEffect that syncs it is a symptom of derived-state duplication. The fix is to replace both the extra state and the effect with a useMemo or inline computation."
      />

      {/* ---- Summary ---- */}
      <h2>Summary</h2>

      <InfoBox variant="question" title="Quick Self-Check Before Adding State">
        Ask yourself these three questions before adding any new piece of state:
        (1) Can I compute this from existing state or props?
        (2) Does changing this value need to update the UI?
        (3) Is there already another component that owns this data?
        If the answer to any of these suggests you don't need new state — don't add it.
      </InfoBox>
    </LessonLayout>
  );
}
