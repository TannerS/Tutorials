import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Performance() {
  return (
    <LessonLayout
      title="Performance & Memoization"
      sectionId="react19"
      lessonIndex={5}
      prev={{ path: '/react19/context', label: 'Context & Composition' }}
      next={{ path: '/react19/react19', label: 'React 19 New Features' }}
    >
      <p>React is fast by default. Most performance issues come from unnecessary re-renders cascading through large trees, or expensive computations running on every render. Here's when and how to optimize.</p>

      <h2>When to Optimize</h2>

      <InfoBox variant="warning" title="The Golden Rule">
        <p><strong>Don't optimize prematurely.</strong> Measure first with React DevTools Profiler. A component re-rendering is not inherently a problem — React's diffing is fast. Optimize only when you can measure a performance issue: dropped frames, laggy interactions, or slow initial render.</p>
      </InfoBox>

      <FlowChart
        title="Performance Optimization Decision Flow"
        chart={"graph TD\n  A[Perceived performance issue?] --> B[Profile with React DevTools]\n  B --> C{Identify bottleneck}\n  C --> D[Expensive render computation] --> E[useMemo on computation]\n  C --> F[Child re-renders unnecessarily] --> G[React.memo + stable props]\n  C --> H[Large list rendering] --> I[Virtualization - TanStack Virtual]\n  C --> J[Large bundle size] --> K[Code splitting - lazy + Suspense]\n  C --> L[Slow initial load] --> M[SSR or Server Components]\n  G --> N{Props include callbacks?}\n  N -->|Yes| O[useCallback for stable refs]\n  N -->|No| P[React.memo is sufficient]"}
      />

      <h2>React.memo — Skipping Re-renders</h2>

      <InfoBox variant="note" title="📝 The Core Re-Render Rule">
        <p><strong>Without memo:</strong> Parent re-renders → child re-renders unconditionally. Doesn't matter if props changed or not.</p>
        <p><strong>With <code>React.memo</code>:</strong> Parent re-renders → React checks each prop with <code>Object.is</code> → if ALL props are the same reference → child <strong>skips</strong> the re-render. If any prop fails → child re-renders.</p>
        <p><code>React.memo</code> is literally just adding the "did props actually change?" gate that React doesn't do by default.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="React.memo Patterns" showLineNumbers>
{`// React.memo: skip re-render if props haven't changed (shallow compare)
const ExpensiveList = React.memo(function ExpensiveList({ items, onSelect }) {
  console.log('ExpensiveList rendered');
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});

// Parent must provide stable references for memo to work!
function Parent() {
  const [filter, setFilter] = useState('');
  const [items] = useState(generateItems());

  // Without useCallback, onSelect is new every render → memo useless
  const onSelect = useCallback((id) => {
    console.log('Selected:', id);
  }, []);

  // Without useMemo, filtered creates new array every render
  const filtered = useMemo(
    () => items.filter(i => i.name.includes(filter)),
    [items, filter]
  );

  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <ExpensiveList items={filtered} onSelect={onSelect} />
    </>
  );
}

// Custom comparison function (rare — use when shallow compare isn't enough)
const Chart = React.memo(
  function Chart({ data, config }) {
    // Expensive D3 rendering
    return <svg>{/* ... */}</svg>;
  },
  (prevProps, nextProps) => {
    // Return true to SKIP re-render (opposite of shouldComponentUpdate!)
    return (
      prevProps.data.length === nextProps.data.length &&
      prevProps.config.theme === nextProps.config.theme
    );
  }
);`}
      </CodeBlock>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: Does React.memo prevent itself or its children from re-rendering?</h3>

      <InfoBox variant="info" title="Short Answer: It prevents ITSELF — children benefit indirectly">
        <p><code>React.memo</code> wraps a component and says: <em>"Skip re-rendering me if my props haven't changed."</em> It does NOT directly protect children. But since the component itself didn't re-render, React never reaches its children — so they skip too.</p>
      </InfoBox>

      <CodeBlock language="text" title="The Gate Analogy">
{`Parent re-renders
  │
  ├─ <MemoChild onClick={stableRef} />
  │    Props unchanged → Object.is = true → 🚫 GATE HOLDS → skip
  │    └─ <GrandChild />  ← React never reaches here → skips too
  │
  ├─ <MemoChild onClick={unstableRef} />
  │    Props changed → Object.is = false → 🔓 GATE OPENS → re-renders
  │    └─ <GrandChild />  ← parent re-rendered → normal cascade kicks in
  │
  └─ <NormalChild />
       No gate at all → re-renders every time parent does
       └─ <GrandChild />  ← re-renders too (cascade)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Key Insight">
        <p>Think of <code>React.memo</code> as a <strong>gate on the component itself</strong>. If the gate holds (props unchanged), nothing below it runs. If the gate breaks (any prop changed), the entire subtree below cascades normally — just like any other re-render.</p>
      </InfoBox>

      <h3>How to wrap a component with React.memo</h3>

      <CodeBlock language="jsx" title="Two equivalent ways to apply memo" showLineNumbers>
{`// Option 1: Wrap the export (most common)
function UserCard({ name, avatar }) {
  return (
    <div>
      <img src={avatar} alt={name} />
      <span>{name}</span>
    </div>
  );
}
export default React.memo(UserCard);

// Option 2: Wrap inline (for components defined in the same file)
const UserCard = React.memo(function UserCard({ name, avatar }) {
  return (
    <div>
      <img src={avatar} alt={name} />
      <span>{name}</span>
    </div>
  );
});

// Both do the same thing:
// Before rendering UserCard, React checks:
//   Object.is(oldProps.name, newProps.name) &&
//   Object.is(oldProps.avatar, newProps.avatar)
// If ALL props pass → skip render. If ANY fails → re-render.`}
      </CodeBlock>

      <h3>Why not wrap every component in React.memo?</h3>

      <CodeBlock language="jsx" title="When memo HELPS vs HURTS" showLineNumbers>
{`// ✅ HELPS — expensive component with stable props
// Parent re-renders often, but Chart's data rarely changes
const Chart = React.memo(function Chart({ data }) {
  // Expensive SVG rendering...
  return <svg>...</svg>;
});

// ❌ UNNECESSARY — component whose props change every render anyway
// Memo adds comparison cost but never skips because items changes
const ItemList = React.memo(function ItemList({ items }) {
  return items.map(i => <li key={i.id}>{i.name}</li>);
});
// If parent always passes a new 'items' array, memo checks props
// every render, always gets false, and re-renders anyway.
// You paid for the comparison but got zero benefit.

// ❌ UNNECESSARY — leaf component that's cheap to render
// The comparison itself costs more than just re-rendering
const Label = React.memo(function Label({ text }) {
  return <span>{text}</span>;  // Re-rendering this is basically free
});`}
      </CodeBlock>

      <FlowChart title="Should You Use React.memo?" chart={"graph TD\n  A[Is the component expensive to render?] -->|No| B[Skip memo - re-rendering is cheap]\n  A -->|Yes| C[Do its props change rarely while parent re-renders often?]\n  C -->|No - props change every time| D[Skip memo - it will never skip]\n  C -->|Yes| E[Are all props stable references?]\n  E -->|No| F[Stabilize props first with useCallback and useMemo]\n  E -->|Yes| G[Use React.memo]\n  style B fill:#4caf50,color:#fff\n  style D fill:#ff9800,color:#fff\n  style F fill:#ff9800,color:#fff\n  style G fill:#2196f3,color:#fff"} />

      <InfoBox variant="warning" title="Memo + Context = No Protection">
        <p>Remember: <code>React.memo</code> only checks <strong>props</strong>. If a memoized component uses <code>useContext</code> and that context value changes, it <strong>will re-render regardless of memo</strong>. The gate only guards against prop changes — context bypasses it entirely.</p>
      </InfoBox>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: Why is <code>displayName</code> needed? What's the difference between arrow and named functions?</h3>

      <InfoBox variant="info" title="Short Answer: Named functions have a .name property — arrow functions don't">
        <p>React DevTools uses a function's <code>.name</code> property to label components in the tree. A named function like <code>function MyComponent()</code> automatically has <code>.name === "MyComponent"</code>. An arrow function <code>() =&gt; ...</code> is anonymous — it has no name, so DevTools shows "Anonymous".</p>
      </InfoBox>

      <CodeBlock language="text" title="What DevTools shows for each pattern">
{`// Pattern 1: Named function → DevTools reads .name automatically
React.memo(function MyComponent() {...})
  → DevTools: <Memo(MyComponent)>  ✅

// Pattern 2: Arrow function → anonymous, no .name
React.memo(({ name }) => <div>{name}</div>)
  → DevTools: <Memo(Anonymous)>    😵

// Pattern 3: Arrow function + displayName → manually fixes it
const MyComponent = React.memo(({ name }) => <div>{name}</div>);
MyComponent.displayName = 'MyComponent';
  → DevTools: <Memo(MyComponent)>  ✅ (but extra boilerplate)`}
      </CodeBlock>

      <h3>Arrow Function vs Named Function — The Real Differences</h3>

      <CodeBlock language="jsx" title="Side-by-side comparison" showLineNumbers>
{`// NAMED FUNCTION
// ✅ Has .name = "UserCard" automatically
// ✅ Shows up clearly in DevTools, error stack traces, and React warnings
// ✅ Can be hoisted (called before declaration in the file)
function UserCard({ name }) {
  return <div>{name}</div>;
}

// ARROW FUNCTION (assigned to const)
// ❌ The function itself is anonymous — no .name
// ❌ Stack traces show "anonymous" or the variable name (inconsistent)
// ❌ Cannot be hoisted (must be declared before use)
// ✅ Slightly shorter syntax
const UserCard = ({ name }) => {
  return <div>{name}</div>;
};

// IMPORTANT: When assigned to a const, modern JS engines
// INFER the name from the variable:
//   const UserCard = () => {} → UserCard.name === "UserCard"
// BUT this inference doesn't survive React.memo wrapping:
//   const Wrapped = React.memo(() => {}) → the inner fn is still anonymous
// That's why displayName is needed for memo'd arrow functions.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Best Practice: Just Use Named Functions">
        <p>Use <code>function MyComponent()</code> for React components. You get automatic naming in DevTools, clear stack traces, hoisting, and zero need for <code>displayName</code>. Save arrow functions for callbacks and inline logic — not component definitions.</p>
      </InfoBox>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: Why do inline objects/functions make React.memo useless?</h3>

      <InfoBox variant="danger" title="Short Answer: Every render creates new references — memo always sees changed props">
        <p>If you pass <code>{'{color: "red"}'}</code> or <code>{'() => doSomething()'}</code> directly in JSX, a <strong>new object/function is created every render</strong>. React.memo compares old vs new with <code>Object.is</code> — different reference = "changed" = re-render. The memo check never passes.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="❌ The Trap — memo does nothing here" showLineNumbers>
{`function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>

      {/* Every prop is inline = new reference every render */}
      <MemoizedList
        items={[1, 2, 3]}             // ❌ new array every render
        style={{ color: 'red' }}       // ❌ new object every render
        onSelect={(id) => log(id)}     // ❌ new function every render
      />

      {/* React.memo checks:
          Object.is([1,2,3], [1,2,3])           → false (different array)
          Object.is({color:'red'}, {color:'red'}) → false (different object)
          Object.is(fn, fn)                       → false (different function)

          ALL props fail → re-renders EVERY time.
          You paid for the comparison but got zero benefit. */}
    </>
  );
}

const MemoizedList = React.memo(function MemoizedList({ items, style, onSelect }) {
  console.log('MemoizedList rendered!');  // Fires EVERY time Parent renders
  return (
    <ul style={style}>
      {items.map(i => <li key={i} onClick={() => onSelect(i)}>{i}</li>)}
    </ul>
  );
});`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ The Fix — stabilize props in the parent" showLineNumbers>
{`function FixedParent() {
  const [count, setCount] = useState(0);

  // Stabilize with useMemo — same array reference across renders
  const items = useMemo(() => [1, 2, 3], []);

  // Stabilize with useMemo — same object reference
  const style = useMemo(() => ({ color: 'red' }), []);

  // Stabilize with useCallback — same function reference
  const handleSelect = useCallback((id) => {
    console.log('selected:', id);
  }, []);

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>

      {/* NOW memo works — all props are stable references */}
      <MemoizedList
        items={items}              // ✅ same ref (useMemo)
        style={style}              // ✅ same ref (useMemo)
        onSelect={handleSelect}    // ✅ same ref (useCallback)
      />
      {/* Parent re-renders from count change →
          React.memo checks props → all pass Object.is →
          MemoizedList SKIPS re-render ✅ */}
    </>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Rule: Memo on the child is only half the job">
        <p><code>React.memo</code> on the child component is <strong>necessary but not sufficient</strong>. The parent must also <strong>stabilize every prop</strong> it passes. Without both halves, you've added comparison overhead with zero benefit.</p>
      </InfoBox>

      <FlowChart title="Memo Effectiveness Checklist" chart={"graph TD\n  A[Want to prevent unnecessary re-renders?] --> B[Wrap child in React.memo]\n  B --> C{Are ALL props stable?}\n  C -->|Yes - primitives or memoized| D[Memo works - child skips re-render]\n  C -->|No - inline objects or functions| E[Memo is useless - re-renders every time]\n  E --> F[Fix: useMemo for objects and arrays]\n  E --> G[Fix: useCallback for functions]\n  F --> D\n  G --> D\n  style D fill:#4caf50,color:#fff\n  style E fill:#f44336,color:#fff"} />

      <h2>useMemo — When and When Not</h2>

      <p><code>useMemo</code> caches the <strong>result</strong> of a computation between renders. React stores the return value and only recalculates when one of the dependencies changes. It does NOT prevent renders — it prevents expensive work <em>during</em> a render.</p>

      <FlowChart
        title="Should I useMemo This?"
        chart={"graph TD\n  A[I have a value computed during render] --> B{Is the computation expensive?}\n  B -->|Yes| C[useMemo it]\n  B -->|No| D{Is the result passed as a prop to a React.memo child?}\n  D -->|Yes| C\n  D -->|No| E{Is the result a dependency of useEffect?}\n  E -->|Yes| C\n  E -->|No| F{Is it a context value consumed by many components?}\n  F -->|Yes| C\n  F -->|No| G[Skip useMemo - not worth the overhead]"}
      />

      <h3>When TO Use useMemo</h3>

      <CodeBlock language="jsx" title="Good Uses of useMemo" showLineNumbers>
{`// 1. Expensive computation — sorting/filtering large data
function SearchResults({ items, query }) {
  const filtered = useMemo(() => {
    // Imagine 10,000+ items — this is genuinely expensive
    return items
      .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, query]);

  return <ResultsList data={filtered} />;
}

// 2. Referential stability for React.memo children
function Dashboard({ rawData }) {
  // Without useMemo, chartData is a new object every render
  // and MemoizedChart would re-render despite React.memo
  const chartData = useMemo(() => ({
    labels: rawData.map(d => d.date),
    values: rawData.map(d => d.value),
    total: rawData.reduce((sum, d) => sum + d.value, 0),
  }), [rawData]);

  return <MemoizedChart data={chartData} />;
}

// 3. Stable context value — prevents ALL consumers from re-rendering
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Without useMemo, every state change in AuthProvider
  // re-renders EVERY useContext(AuthContext) consumer
  const value = useMemo(() => ({
    user,
    login: (credentials) => { /* ... */ },
    logout: () => setUser(null),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 4. Dependency of useEffect — prevents unnecessary effect runs
function UserProfile({ userId }) {
  const fetchOptions = useMemo(() => ({
    headers: { 'X-User': userId },
    cache: 'no-store',
  }), [userId]);

  useEffect(() => {
    fetch('/api/profile', fetchOptions).then(/* ... */);
  }, [fetchOptions]); // Stable reference = effect only runs when userId changes
}`}
      </CodeBlock>

      <h3>When NOT to Use useMemo — Anti-Patterns</h3>

      <CodeBlock language="jsx" title="useMemo Anti-Patterns — Do NOT Do These" showLineNumbers>
{`// BAD: Simple arithmetic — memo overhead exceeds computation cost
const doubled = useMemo(() => count * 2, [count]);
// GOOD: Just compute it
const doubled = count * 2;

// BAD: Primitives — compared by value anyway, memo adds nothing
const greeting = useMemo(() => \`Hello, \${name}!\`, [name]);
// GOOD: Just compute it
const greeting = \`Hello, \${name}!\`;

// BAD: Memoizing everything "just in case"
function Form({ label }) {
  const trimmed = useMemo(() => label.trim(), [label]);       // Pointless
  const upper = useMemo(() => label.toUpperCase(), [label]);   // Pointless
  const len = useMemo(() => label.length, [label]);            // Pointless
  // All of these are trivial — the memoization overhead is MORE
  // expensive than just computing the values directly
}

// BAD: No memo boundary downstream — stable reference helps nobody
function Parent() {
  // This useMemo is wasted — Child is NOT wrapped in React.memo,
  // so it re-renders every time Parent renders regardless
  const style = useMemo(() => ({ color: 'red', fontSize: 14 }), []);
  return <Child style={style} />;  // Child still re-renders!
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="useMemo Has a Cost">
        <p>Every <code>useMemo</code> call allocates a closure, stores the previous result, stores the dependency array, and runs <code>Object.is()</code> on each dependency every single render. For trivial computations, this bookkeeping is more expensive than just recomputing the value. Only memoize when the cost of recomputation or the cost of a downstream re-render is measurably higher than the cost of memoization.</p>
      </InfoBox>

      <h2>useCallback — When and When Not</h2>

      <p><code>useCallback</code> caches a <strong>function reference</strong> between renders. It is syntactic sugar: <code>useCallback(fn, deps)</code> is identical to <code>useMemo(() =&gt; fn, deps)</code>. It does NOT make the function faster — it just ensures the same function object is returned if deps haven't changed.</p>

      <h3>When TO Use useCallback</h3>

      <CodeBlock language="jsx" title="Good Uses of useCallback" showLineNumbers>
{`// 1. Passing callbacks to React.memo'd children (the PRIMARY use case)
function TodoApp() {
  const [todos, setTodos] = useState([]);

  // Without useCallback, this is a new function every render
  // and MemoizedTodoList re-renders even though todos didn't change
  const handleToggle = useCallback((id) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ));
  }, []);

  const handleDelete = useCallback((id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  return <MemoizedTodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />;
}

// 2. Callbacks used as useEffect dependencies in children
function SearchInput({ onSearch }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]); // If onSearch isn't stable, this effect re-runs every render!

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}

// Parent MUST stabilize onSearch:
function Parent() {
  const onSearch = useCallback((q) => {
    fetchResults(q);
  }, []);
  return <SearchInput onSearch={onSearch} />;
}

// 3. Custom hooks that return functions — consumers might depend on them
function useDebounce(callback, delay) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Returned function is stable — safe for consumers to use in deps
  return useCallback((...args) => {
    const timer = setTimeout(() => callbackRef.current(...args), delay);
    return () => clearTimeout(timer);
  }, [delay]);
}`}
      </CodeBlock>

      <h3>When NOT to Use useCallback — Anti-Patterns</h3>

      <CodeBlock language="jsx" title="useCallback Anti-Patterns — Do NOT Do These" showLineNumbers>
{`// BAD: Inline handler on a plain HTML element
// <button> is not memoized — stable reference helps nothing
function Counter() {
  const [count, setCount] = useState(0);

  // WASTEFUL — button doesn't care about reference stability
  const increment = useCallback(() => setCount(c => c + 1), []);
  return <button onClick={increment}>Count: {count}</button>;

  // GOOD: Just inline it
  // return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}

// BAD: Every function wrapped "just in case"
function UserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // WASTEFUL — these handlers are passed to <input>, not memo'd components
  const handleName = useCallback((e) => setName(e.target.value), []);
  const handleEmail = useCallback((e) => setEmail(e.target.value), []);

  return (
    <form>
      <input value={name} onChange={handleName} />
      <input value={email} onChange={handleEmail} />
    </form>
  );
}

// BAD: Deps change every render — useCallback recreates anyway
function ChatRoom({ messages }) {
  // messages changes every render, so this useCallback is pointless:
  // it recreates the function AND pays the comparison cost
  const getLatest = useCallback(() => {
    return messages[messages.length - 1];
  }, [messages]);  // New function every time messages changes
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Side-by-Side: useCallback That Helps vs. Pointless" showLineNumbers>
{`// === HELPS: Child is memoized, callback is stable ===
const MemoizedList = React.memo(function List({ items, onItemClick }) {
  return items.map(item => (
    <div key={item.id} onClick={() => onItemClick(item.id)}>{item.name}</div>
  ));
});

function GoodParent() {
  const [items] = useState(getItems());
  const [selected, setSelected] = useState(null);

  // useCallback keeps onItemClick stable across renders
  // React.memo on MemoizedList can now skip re-renders
  const onItemClick = useCallback((id) => setSelected(id), []);

  return (
    <>
      <p>Selected: {selected}</p>
      <MemoizedList items={items} onItemClick={onItemClick} />
    </>
  );
}

// === POINTLESS: Child is NOT memoized ===
function PlainList({ items, onItemClick }) {
  // No React.memo — re-renders every time parent renders regardless
  return items.map(item => (
    <div key={item.id} onClick={() => onItemClick(item.id)}>{item.name}</div>
  ));
}

function WastefulParent() {
  const [items] = useState(getItems());
  const [selected, setSelected] = useState(null);

  // useCallback is wasted effort — PlainList re-renders anyway
  const onItemClick = useCallback((id) => setSelected(id), []);

  return (
    <>
      <p>Selected: {selected}</p>
      <PlainList items={items} onItemClick={onItemClick} />
    </>
  );
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="useCallback Is NOT a Performance Optimization by Itself">
        <p><code>useCallback</code> does not make your function run faster. It only preserves referential identity. This is useful <strong>only</strong> when something downstream checks that identity — namely <code>React.memo</code>, <code>useEffect</code> deps, or <code>useMemo</code> deps. If nothing checks the reference, <code>useCallback</code> is pure overhead: you pay for the closure, the stored deps, and the shallow comparison — for zero benefit.</p>
      </InfoBox>

      <h2>The Memoization Cost</h2>

      <p>Memoization is <strong>not free</strong>. Every call to <code>useMemo</code> or <code>useCallback</code> requires React to:</p>
      <ol>
        <li>Store the previous return value (or function) in the fiber node</li>
        <li>Store the dependency array from the last render</li>
        <li>Run <code>Object.is()</code> on <strong>every</strong> dependency, every render</li>
        <li>Allocate a new closure for the factory function (useMemo) or the callback (useCallback)</li>
      </ol>
      <p>If dependencies change frequently, you pay <em>both</em> the comparison cost <em>and</em> the recomputation cost — making memoization strictly worse than not memoizing.</p>

      <CodeBlock language="jsx" title="When useMemo Is Slower Than Just Computing" showLineNumbers>
{`// SLOWER with useMemo — deps change almost every render
function LiveDashboard({ timestamp, value }) {
  // timestamp changes every second, so useMemo:
  // 1. Compares [timestamp, value] with previous deps (wasted work)
  // 2. Finds they changed
  // 3. Runs the computation anyway
  // 4. Stores the new result and new deps (extra memory)
  const formatted = useMemo(() => ({
    time: new Date(timestamp).toLocaleString(),
    display: value.toFixed(2),
  }), [timestamp, value]);

  // FASTER without useMemo — just compute it directly
  const formatted2 = {
    time: new Date(timestamp).toLocaleString(),
    display: value.toFixed(2),
  };
}

// THE BREAK-EVEN QUESTION:
// Is the work saved by skipping recomputation GREATER than
// the overhead of storing + comparing deps every render?
//
// For trivial operations: NO — skip the memo
// For expensive operations that skip often: YES — use the memo`}
      </CodeBlock>

      <InfoBox variant="info" title="The React Compiler Will Change This">
        <p>The React team is building the <strong>React Compiler</strong> (formerly React Forget), which automatically memoizes components and hooks at build time. When it ships, most manual <code>useMemo</code> and <code>useCallback</code> calls will become unnecessary. The compiler analyzes your code and inserts memoization only where it actually helps — something humans are notoriously bad at judging. Until then, follow the guidelines above: measure first, memoize only at proven bottlenecks.</p>
      </InfoBox>

      <h2>Common Memoization Mistakes</h2>

      <CodeBlock language="jsx" title="Anti-Pattern Gallery" showLineNumbers>
{`// MISTAKE 1: Memoized value with unstable dependency
function FilteredList({ items }) {
  // This filter function is created inline every render,
  // so the dep [items, isActive] changes every render,
  // and useMemo recomputes every time — totally wasted
  const isActive = (item) => item.status === 'active';
  const active = useMemo(() => items.filter(isActive), [items, isActive]);

  // FIX: Define the filter outside or inline the logic
  const active2 = useMemo(
    () => items.filter(item => item.status === 'active'),
    [items]
  );
}

// MISTAKE 2: useCallback without React.memo on the child
function Parent() {
  const [count, setCount] = useState(0);

  // Carefully stabilized callback...
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  // ...passed to a child that ISN'T memoized. Oops.
  return <Child onClick={handleClick} />;
  // Child re-renders every time Parent re-renders,
  // regardless of handleClick's stability
}

// MISTAKE 3: Memo boundary too high — component re-renders anyway
function App() {
  const [theme, setTheme] = useState('light');

  // Memoizing config is pointless — App re-renders on theme change,
  // and ExpensiveTree is rendered inline (no React.memo)
  const config = useMemo(() => ({ theme, debug: false }), [theme]);

  return (
    <div>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle
      </button>
      <ExpensiveTree config={config} />
    </div>
  );
  // FIX: Wrap ExpensiveTree in React.memo
  // const MemoizedTree = React.memo(ExpensiveTree);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Before Adding useMemo or useCallback, Verify This Checklist">
        <ol>
          <li><strong>Is there a React.memo boundary downstream?</strong> If not, referential stability of props is pointless — the child re-renders anyway.</li>
          <li><strong>Is the computation actually expensive?</strong> Profile it. If it takes less than 1ms, the memoization overhead likely exceeds the savings.</li>
          <li><strong>Do the dependencies actually stay stable between renders?</strong> If deps change every render, memoization is strictly worse — you pay comparison cost AND recomputation cost.</li>
          <li><strong>Are ALL the props to the memo'd child stable?</strong> One unstable prop defeats React.memo entirely — every prop must be stable.</li>
        </ol>
      </InfoBox>

      <InteractiveChallenge
        question="Which of these is a GOOD use of useMemo?"
        options={[
          "const doubled = useMemo(() => count * 2, [count])",
          "const greeting = useMemo(() => `Hello, ${name}!`, [name])",
          "const sorted = useMemo(() => bigArray.sort((a, b) => a.score - b.score), [bigArray])",
          "const len = useMemo(() => str.length, [str])"
        ]}
        correctIndex={2}
        explanation={"Sorting a large array is genuinely expensive — O(n log n) — and the result should be cached until the source data changes. The other three are trivial O(1) operations where useMemo overhead exceeds the computation cost. Remember: useMemo is for expensive work, not every expression."}
        language="jsx"
      />

      <InteractiveChallenge
        question={"You added useCallback to a handler passed to a child component, but the child still re-renders every time the parent renders. What is the most likely cause?"}
        options={[
          "useCallback is broken in your React version",
          "The child component is not wrapped in React.memo",
          "useCallback only works with class components",
          "You need to also wrap the handler in useMemo"
        ]}
        correctIndex={1}
        explanation={"useCallback stabilizes the function reference, but that only matters if something checks that reference. Without React.memo on the child, React re-renders it every time the parent renders — regardless of whether props changed. useCallback + React.memo work as a pair: useCallback keeps the prop stable, React.memo skips the render when props are unchanged."}
        language="jsx"
        code={"// The fix: wrap the child in React.memo\nconst MemoizedChild = React.memo(function Child({ onClick }) {\n  return <button onClick={onClick}>Click me</button>;\n});\n\n// Now useCallback in the parent actually prevents re-renders\nfunction Parent() {\n  const handleClick = useCallback(() => { /* ... */ }, []);\n  return <MemoizedChild onClick={handleClick} />;\n}"}
      />

      <h2>Code Splitting with lazy + Suspense</h2>

      <CodeBlock language="jsx" title="Dynamic Imports & Route-Based Splitting" showLineNumbers>
{`import { lazy, Suspense } from 'react';

// lazy() creates a component that loads its code on first render
const AdminPanel = lazy(() => import('./AdminPanel'));
const Analytics = lazy(() => import('./Analytics'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} /> {/* In main bundle */}
      <Route
        path="/admin"
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminPanel /> {/* Separate chunk, loaded on navigation */}
          </Suspense>
        }
      />
      <Route
        path="/analytics"
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <Analytics />
          </Suspense>
        }
      />
    </Routes>
  );
}

// Preloading: trigger load before user navigates
function NavLink({ to, component, children }) {
  const preload = () => component.preload?.(); // Vite/webpack support

  return (
    <Link
      to={to}
      onMouseEnter={preload}  // Start loading on hover
      onFocus={preload}       // Start loading on focus
    >
      {children}
    </Link>
  );
}

// Named exports with lazy (need wrapper)
const LazyNamed = lazy(() =>
  import('./module').then(mod => ({ default: mod.NamedExport }))
);`}
      </CodeBlock>

      <h2>Virtualization for Large Lists</h2>

      <CodeBlock language="jsx" title="TanStack Virtual Example" showLineNumbers>
{`import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,        // Could be 100,000+
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,     // Estimated row height in px
    overscan: 5,                // Extra items rendered outside viewport
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: \`\${virtualizer.getTotalSize()}px\`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: \`\${virtualRow.size}px\`,
              transform: \`translateY(\${virtualRow.start}px)\`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}

// Only ~20 DOM nodes exist at any time, regardless of list size
// Scrolling swaps content — massive performance win for 1000+ items`}
      </CodeBlock>

      <h2>Profiling Tips</h2>

      <InfoBox variant="tip" title="React DevTools Profiler Workflow">
        <p>1. Open React DevTools → Profiler tab. 2. Click record, perform the slow interaction, stop recording. 3. Look at the flamegraph — wide bars = slow renders. 4. Check "Why did this render?" for each component. 5. Gray bars = components that didn't re-render (good). 6. Focus on the widest/tallest bars first — optimize the bottleneck, not everything.</p>
      </InfoBox>

      <InteractiveChallenge
        question="You wrap a component in React.memo but it still re-renders every time its parent renders. What's the most likely cause?"
        options={[
          "React.memo doesn't work with function components",
          "A prop is an object/array/function created inline in the parent",
          "The component uses useState internally",
          "React.memo only works in production builds"
        ]}
        correctIndex={1}
        explanation="React.memo does a shallow comparison of props. If the parent creates a new object, array, or function on every render (e.g., `style={{color: 'red'}}` or `onClick={() => ...}`), the prop reference changes every time, making memo useless. Fix with useMemo/useCallback in the parent, or move the creation outside the component."
        language="jsx"
        code={"// Memo is useless here — options is new every render\n<MemoizedChild options={{ sort: 'asc' }} />\n\n// Fix: memoize in parent\nconst options = useMemo(() => ({ sort: 'asc' }), []);\n<MemoizedChild options={options} />"}
      />
    </LessonLayout>
  );
}
