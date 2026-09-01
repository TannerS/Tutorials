import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Lifecycle() {
  return (
    <LessonLayout
      title="Component Lifecycle In Depth"
      sectionId="react18"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react18/lifecycle-sim', label: '🧪 Lifecycle Simulator' }}
    >
      <p>React components go through predictable phases. Understanding these phases—and the distinction between the <strong>render phase</strong> and <strong>commit phase</strong>—is critical for writing correct, performant code.</p>

      <h2>Render Phase vs Commit Phase</h2>

      <InfoBox variant="warning" title="Key Distinction">
        <p>The <strong>render phase</strong> is pure—React calls your component function (or class render method) to compute what the UI should look like. It may be called multiple times, paused, or aborted (especially with Concurrent features). <strong>Never put side effects here.</strong></p>
        <p>The <strong>commit phase</strong> is where React actually applies changes to the DOM and runs effects/lifecycle methods. This happens once per update and is synchronous.</p>
      </InfoBox>

      <FlowChart
        title="React Component Lifecycle Phases"
        chart={"graph TD\n  A[Component Created] --> B[Render Phase]\n  B --> C{Pure Computation}\n  C --> D[Create Virtual DOM]\n  D --> E[Diffing / Reconciliation]\n  E --> F[Commit Phase]\n  F --> G[Update Real DOM]\n  G --> H[Run useLayoutEffect]\n  H --> I[Browser Paints]\n  I --> J[Run useEffect]\n  J --> K{State/Props Change?}\n  K -->|Yes| B\n  K -->|No| L[Wait for Event]\n  L --> K\n  M[Unmount] --> N[Run Effect Cleanups]\n  K -->|Unmount| M"}
      />

      <h2>Class Lifecycle → Hooks Mapping</h2>

      <p>For senior devs migrating mental models from class components:</p>

      <CodeBlock language="jsx" title="Class Lifecycle Methods → Hook Equivalents" showLineNumbers>
{`// CLASS COMPONENT LIFECYCLE
class MyComponent extends React.Component {
  constructor(props) {
    // → useState initial value / useRef for instance vars
    this.state = { count: 0 };
    this.intervalRef = null;
  }

  componentDidMount() {
    // → useEffect with [] dependency array
    this.intervalRef = setInterval(() => {}, 1000);
  }

  componentDidUpdate(prevProps, prevState) {
    // → useEffect with specific dependencies
    if (prevProps.id !== this.props.id) {
      this.fetchData(this.props.id);
    }
  }

  componentWillUnmount() {
    // → useEffect cleanup function
    clearInterval(this.intervalRef);
  }

  shouldComponentUpdate(nextProps) {
    // → React.memo with comparator
    return nextProps.id !== this.props.id;
  }

  render() {
    return <div>{this.state.count}</div>;
  }
}

// FUNCTION COMPONENT EQUIVALENT
function MyComponent({ id }) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);

  // componentDidMount + componentWillUnmount
  useEffect(() => {
    intervalRef.current = setInterval(() => {}, 1000);
    return () => clearInterval(intervalRef.current); // cleanup
  }, []);

  // componentDidUpdate (for specific prop)
  useEffect(() => {
    fetchData(id);
  }, [id]);

  return <div>{count}</div>;
}

// shouldComponentUpdate equivalent
const MemoizedComponent = React.memo(MyComponent, (prev, next) => {
  return prev.id === next.id; // return true to SKIP re-render
});`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════════════════
          SECTION: What Triggers a Re-render?
          ══════════════════════════════════════════════════════════════ */}

      <h2>What Triggers a Re-render?</h2>

      <p>One of the most important things to internalize is <em>exactly</em> which operations cause React to re-render a component—and which ones silently do nothing. Getting this wrong leads to either stale UIs or unnecessary performance overhead.</p>

      <FlowChart
        title="Re-render Decision Tree"
        chart={"graph TD\n  A[Something happened] --> B{State setter called?}\n  B -->|Yes| C{New value different via Object.is?}\n  C -->|Yes| D[RE-RENDER]\n  C -->|No| E[Bail out - no re-render]\n  B -->|No| F{Context value changed?}\n  F -->|Yes| D\n  F -->|No| G{Parent re-rendered?}\n  G -->|Yes| H{Wrapped in React.memo?}\n  H -->|Yes| I{Props changed?}\n  I -->|Yes| D\n  I -->|No| E\n  H -->|No| D\n  G -->|No| E"}
      />

      <InfoBox variant="info" title="Things That TRIGGER Re-renders">
        <ul>
          <li><strong>useState setter</strong> called with a new value — React uses <code>Object.is</code> to compare. If it returns <code>false</code>, the component re-renders.</li>
          <li><strong>useReducer dispatch</strong> — when the reducer returns a new state object (referential inequality).</li>
          <li><strong>useContext</strong> — when the context value changes, EVERY consumer of that context re-renders, even through <code>React.memo</code> boundaries.</li>
          <li><strong>useSyncExternalStore</strong> — when the external store snapshot changes (compared via <code>Object.is</code>).</li>
          <li><strong>Parent re-renders</strong> — all children re-render by default (cascade behavior — see next section).</li>
          <li><strong>forceUpdate</strong> (class) or the <code>useReducer(x =&gt; x + 1, 0)</code> hack (function components).</li>
        </ul>
      </InfoBox>

      <InfoBox variant="warning" title="Things That Do NOT Trigger Re-renders">
        <ul>
          <li><strong>useRef</strong> — changing <code>.current</code> never causes a re-render. That is its entire purpose: mutable storage outside the render cycle.</li>
          <li><strong>useMemo</strong> — caches a computed value during render. It does not prevent or trigger renders.</li>
          <li><strong>useCallback</strong> — caches a function reference during render. It does not prevent or trigger renders.</li>
          <li><strong>useEffect / useLayoutEffect</strong> — these run AFTER render. They do not trigger it. However, if you call <code>setState</code> inside an effect, that schedules a NEW render.</li>
          <li><strong>Mutating state directly</strong> — e.g., <code>state.items.push(x)</code>. React does not see this mutation, so no re-render happens. This is a bug in your code, not a feature.</li>
        </ul>
      </InfoBox>

      <CodeBlock language="jsx" title="Re-render Triggers — Quick Reference" showLineNumbers>
{`function TriggerDemo() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState(['a', 'b']);
  const ref = useRef(0);

  // ✅ TRIGGERS re-render — new value
  const handleClick = () => setCount(count + 1);

  // ✅ TRIGGERS re-render — new array reference
  const handleAdd = () => setItems([...items, 'c']);

  // ❌ Does NOT trigger re-render — ref mutation is silent
  const handleRef = () => {
    ref.current += 1;
    console.log(ref.current); // Value updates, but UI won't show it
  };

  // ❌ Does NOT trigger re-render — same value, React bails out
  const handleSameValue = () => setCount(count); // Object.is(0, 0) → true

  // ❌ BUGGY — mutating existing state, React doesn't see it
  const handleMutate = () => {
    items.push('d');       // Mutates in place — no new reference
    setItems(items);       // Same reference! Object.is returns true → bail out
  };

  // ✅ Correct way to update arrays/objects — create new reference
  const handleCorrectMutate = () => {
    setItems(prev => [...prev, 'd']); // New array → new reference → re-render
  };

  return <div>Count: {count} | Items: {items.length}</div>;
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════════════════
          SECTION: The Re-render Cascade
          ══════════════════════════════════════════════════════════════ */}

      <h2>The Re-render Cascade</h2>

      <p>When a component re-renders, <strong>all of its children re-render too</strong>, regardless of whether their props changed. This is React's default behavior — it assumes rendering is cheap and relies on virtual DOM diffing to avoid unnecessary real DOM updates.</p>

      <FlowChart
        title="Re-render Cascade — Default Behavior"
        chart={"graph TD\n  A[Parent setState called] --> B[Parent re-renders]\n  B --> C[Child A re-renders]\n  B --> D[Child B re-renders]\n  C --> E[Grandchild A1 re-renders]\n  C --> F[Grandchild A2 re-renders]\n  D --> G[Grandchild B1 re-renders]\n  style A fill:#3b1a1a\n  style B fill:#3b1a1a\n  style C fill:#3b1a1a\n  style D fill:#3b1a1a\n  style E fill:#3b1a1a\n  style F fill:#3b1a1a\n  style G fill:#3b1a1a"}
      />

      <CodeBlock language="jsx" title="Cascade in Action — Watch the Console" showLineNumbers>
{`function Parent() {
  const [count, setCount] = useState(0);
  console.log('Parent rendered');

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child name="Alice" />       {/* Re-renders every time Parent does */}
      <MemoChild name="Bob" />     {/* Only re-renders if name changes */}
    </div>
  );
}

function Child({ name }) {
  console.log('Child rendered:', name);
  return <p>Hello, {name}</p>;
}

// React.memo creates a re-render boundary
const MemoChild = React.memo(function MemoChild({ name }) {
  console.log('MemoChild rendered:', name);
  return <p>Hello, {name}</p>;
});

// When you click the button:
// Console shows:
//   "Parent rendered"
//   "Child rendered: Alice"     ← re-renders even though name didn't change
//   (MemoChild does NOT log)   ← memo boundary blocks the cascade`}
      </CodeBlock>

      <InfoBox variant="danger" title="Context Punches Through React.memo — Preview">
        <p><code>React.memo</code> only checks props. It has no visibility into context: if a component reads a value via <code>useContext</code> and that value changes, the component re-renders <strong>regardless of memo</strong> — and that re-render cascades into its children exactly like any other. Combined with the fact that an unmemoized <code>{'{}'}</code> context value is a brand-new object reference on every provider render, this is the single biggest cause of "my app re-renders way more than it should" in real codebases.</p>
        <p style={{ marginBottom: 0 }}>The fix — splitting contexts by update frequency, memoizing the provider's value, separating state from dispatch — gets a full walkthrough (box-and-arrow diagrams, before/after code, a decision tree for which fix to reach for) once <code>useContext</code>, <code>useMemo</code>, and <code>useCallback</code> are introduced in depth: see <strong>Hooks Deep Dive</strong> and <strong>Context &amp; Composition</strong> later in this section. For now, the one sentence to carry forward is: <code>React.memo</code> stops the parent-to-child cascade; it does nothing to stop the context broadcast.</p>
      </InfoBox>

      <h2>🔑 What Does "Stable" and "Unstable" Actually Mean?</h2>

      <InfoBox variant="info" title="The Core Concept">
        <p>Every time your component re-renders, <strong>every line of code inside it runs again</strong>. React then asks one question about each value: <strong>"Did this change since last render?"</strong></p>
        <p>React answers using <code>Object.is(previousValue, currentValue)</code>:</p>
        <ul>
          <li><strong>Stable</strong> = <code>Object.is</code> returns <code>true</code> → React sees it as <strong>the same thing</strong> → skips work</li>
          <li><strong>Unstable</strong> = <code>Object.is</code> returns <code>false</code> → React sees it as a <strong>different thing</strong> → does work</li>
        </ul>
      </InfoBox>

      <InfoBox variant="warning" title="Unstable Does NOT Automatically Cause Re-renders">
        <p>This is the most common misconception. An unstable value only matters when <strong>something is checking it</strong>:</p>
        <ul>
          <li>In a <strong>dependency array</strong> (useEffect, useMemo, useCallback) → effect re-runs or value recalculates</li>
          <li>Passed as a <strong>prop to a React.memo child</strong> → that child re-renders</li>
          <li>Sitting in a variable <strong>nobody checks</strong> → nothing happens, it does not matter</li>
        </ul>
      </InfoBox>

      <CodeBlock language="jsx" title="When Instability Matters vs When It Doesn't" showLineNumbers>
{`function Parent() {
  const [count, setCount] = useState(0);

  // UNSTABLE — new function created every render
  const handleClick = () => setCount(c => c + 1);

  // Case 1: Normal child (NOT memoized)
  // The child re-renders anyway because Parent re-rendered.
  // So handleClick being unstable is IRRELEVANT — it changes nothing.
  return <NormalChild onClick={handleClick} />;
}

function Parent2() {
  const [count, setCount] = useState(0);

  // UNSTABLE — new function created every render
  const handleClick = () => setCount(c => c + 1);

  // Case 2: Memoized child
  // React.memo compares props: old handleClick !== new handleClick
  // So the child re-renders BECAUSE of the instability.
  // Fix: wrap handleClick in useCallback to make it stable.
  return <MemoizedChild onClick={handleClick} />;
}

function Parent3() {
  const [count, setCount] = useState(0);

  // UNSTABLE — new object every render
  const style = { color: 'red' };

  // Case 3: In a dependency array
  // useEffect sees old style !== new style → re-runs every render!
  useEffect(() => {
    console.log('Style changed!'); // Fires EVERY render, even though color is always 'red'
  }, [style]);

  // Fix: move the object outside the component, or useMemo it.
}`}
      </CodeBlock>

      <FlowChart title="Does Instability Matter Here?" chart={"graph TD\n  A[Is the value unstable?] -->|No - stable| B[No problem]\n  A -->|Yes - new ref each render| C[Is anything checking this value?]\n  C -->|In a dependency array| D[Effect/memo/callback re-runs every render]\n  C -->|Passed to React.memo child| E[Child re-renders despite memo]\n  C -->|Just a local variable| F[Does not matter - ignore it]\n  style B fill:#1a3329\n  style D fill:#3b1a1a\n  style E fill:#3b1a1a\n  style F fill:#1a3329"} />

      <h3>Why Are Some Things Stable?</h3>

      <InfoBox variant="note" title="React Guarantees Certain Values Never Change Reference">
        <p><code>setState</code> from <code>useState</code>, <code>dispatch</code> from <code>useReducer</code>, and the object returned by <code>useRef</code> are all guaranteed by React to keep the <strong>same reference across every render</strong> of a given component instance — you never need to memoize them yourself.</p>
        <p style={{ marginBottom: 0 }}>Everything <em>you</em> write inline during render — arrow functions, object literals, array literals — is a <strong>new reference every render</strong> unless you explicitly stabilize it with <code>useMemo</code>/<code>useCallback</code>. Exactly how React achieves that guarantee under the hood is covered in <strong>Hooks Deep Dive</strong>, right after hooks themselves are introduced properly.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Stable vs Unstable — What to Expect" showLineNumbers>
{`function MyComponent() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);

  // ✅ STABLE — guaranteed by React, same reference every render
  // setCount on render 1 === setCount on render 50 (literally same object)
  // setUser on render 1 === setUser on render 50

  // ❌ UNSTABLE — you created this, so it's a new function every render
  const handleClick = () => setCount(c => c + 1);
  // handleClick on render 1 !== handleClick on render 2 (different object)

  // ❌ UNSTABLE — new object literal every render
  const style = { color: 'red' };

  // ⚠️ PRIMITIVES — re-assigned every render, but "accidentally stable"
  const label = "Click me";
  // This line DOES run every render (the variable IS re-created and re-assigned).
  // But it doesn't matter because Object.is("Click me", "Click me") === true.
  // Primitives (strings, numbers, booleans) are compared by VALUE, not reference.
  // So dependency arrays and React.memo see no change → no re-render triggered.
  //
  // Compare to objects: Object.is({a:1}, {a:1}) === false (different references!)
  // That's why { color: 'red' } above is unstable — same content, different object.
}

// The same guarantee applies to useReducer's dispatch:
const [state, dispatch] = useReducer(reducer, initial);
// dispatch is ALSO stable — safe to pass to children without useCallback.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Practical Rule of Thumb">
        <p><strong>Stable (safe to omit from deps, safe to pass without useCallback):</strong> <code>setState</code> from useState, <code>dispatch</code> from useReducer, <code>ref</code> from useRef, and functions returned from <code>useCallback</code>.</p>
        <p><strong>Unstable (new reference every render):</strong> inline functions (<code>() =&gt; ...</code>), object/array literals (<code>{'{}'}</code>, <code>[]</code>), and any value computed during render without <code>useMemo</code>.</p>
      </InfoBox>

      <h2>Why Not Wrap Everything in React.memo?</h2>

      <p>If <code>React.memo</code> prevents unnecessary re-renders, why not just wrap <em>every</em> component? This is a common question — and the answer is nuanced.</p>

      <InfoBox variant="warning" title="React.memo Is Not Free">
        <p><strong>React.memo adds overhead on EVERY render:</strong> it must shallow-compare all previous props with all next props. For components that almost always receive new props (or that are cheap to render), the comparison cost exceeds the render cost you're trying to avoid.</p>
      </InfoBox>

      <FlowChart
        title="React.memo Cost-Benefit Analysis"
        chart={"graph TD\n  A[Without memo] --> B[Component re-renders]\n  B --> C[React diffs virtual DOM]\n  C --> D[No real DOM changes = fast]\n  E[With memo] --> F[Shallow compare ALL props]\n  F --> G{Props changed?}\n  G -->|No| H[Skip render - saved work]\n  G -->|Yes| I[Compare was wasted]\n  I --> B\n  style H fill:#1a3329\n  style I fill:#3b1a1a"}
      />

      <CodeBlock language="jsx" title="When React.memo Hurts More Than It Helps" showLineNumbers>
{`// ❌ BAD: memo on a trivial component that always gets new props
const Badge = React.memo(function Badge({ count, style, onClick }) {
  // This component renders in ~0.01ms — cheaper than the comparison
  return <span style={style} onClick={onClick}>{count}</span>;
});

// Parent creates new style object and onClick every render
// So memo runs comparison → finds props changed → renders anyway
// Result: SLOWER than without memo (comparison + render)
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <Badge
      count={count}
      style={{ color: 'red' }}          // ← new object every render!
      onClick={() => setCount(c => c + 1)}  // ← new function every render!
    />
  );
}

// ✅ GOOD: memo on an expensive component with stable props
const DataGrid = React.memo(function DataGrid({ rows, columns }) {
  // This component renders 10,000 cells — expensive!
  return (
    <table>
      {rows.map(row => (
        <tr key={row.id}>
          {columns.map(col => <td key={col}>{row[col]}</td>)}
        </tr>
      ))}
    </table>
  );
});

// Parent provides stable references
function Dashboard() {
  const [filter, setFilter] = useState('');
  const rows = useMemo(() => filterData(allData, filter), [filter]);
  const columns = useMemo(() => ['name', 'email', 'role'], []);

  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <DataGrid rows={rows} columns={columns} /> {/* ✅ Only re-renders when data changes */}
    </>
  );
}`}
      </CodeBlock>

      <h3>Wrapping the Component vs Wrapping the Export</h3>

      <p>There are two ways to apply <code>React.memo</code>, and they behave identically — it's purely a style choice:</p>

      <CodeBlock language="jsx" title="Two Ways to Apply React.memo" showLineNumbers>
{`// OPTION 1: Wrap the export (most common in codebases)
function MyComponent({ name, onSelect }) {
  return <div onClick={() => onSelect(name)}>{name}</div>;
}
export default React.memo(MyComponent);
// ✅ Component has a name in DevTools: "MyComponent"
// ✅ You can reference MyComponent without memo internally (for recursion, etc.)

// OPTION 2: Wrap the declaration directly
const MyComponent = React.memo(function MyComponent({ name, onSelect }) {
  return <div onClick={() => onSelect(name)}>{name}</div>;
});
export default MyComponent;
// ✅ Also has a name in DevTools: "MyComponent"
// ✅ Signals "this component is memoized" right at the declaration

// OPTION 3: Arrow function (loses name in DevTools without displayName)
const MyComponent = React.memo(({ name, onSelect }) => {
  return <div onClick={() => onSelect(name)}>{name}</div>;
});
MyComponent.displayName = 'MyComponent'; // ← need this for DevTools
export default MyComponent;
// ⚠️ Works but arrow function is anonymous without displayName

// ──────────────────────────────────────
// All three are FUNCTIONALLY IDENTICAL.
// The memo HOC wraps the component either way.
// Team convention determines which style to use.
// ──────────────────────────────────────`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Memo — The Decision Checklist">
        <p>Before adding <code>React.memo</code>, verify ALL of these:</p>
        <ul>
          <li>✅ The component re-renders often with the <strong>same props</strong></li>
          <li>✅ The component's render is <strong>expensive</strong> (complex DOM, heavy computation, large subtree)</li>
          <li>✅ The parent provides <strong>stable prop references</strong> (primitives, or objects/functions wrapped in useMemo/useCallback)</li>
          <li>❌ If props include inline objects/functions that aren't memoized, memo is <strong>useless</strong> — it will always find "changed" props</li>
          <li>❌ If the component is cheap to render (a few divs/spans), memo is <strong>slower</strong> than just re-rendering</li>
        </ul>
      </InfoBox>

      <InfoBox variant="info" title="The React Compiler Can Handle This — If Your Project Enables It">
        <p>The <strong>React Compiler</strong> (previously React Forget) automatically adds memoization where beneficial. It analyzes your code at build time and inserts the equivalent of memo/useMemo/useCallback only where they help, so manual <code>React.memo</code> becomes unnecessary for most cases.</p>
        <p style={{ marginBottom: 0 }}>It is not "upcoming" — it shipped 1.0 — but it is also <strong>not part of React 19</strong>. It is a separate build-time plugin (<code>babel-plugin-react-compiler</code>) on its own release track that a project opts into; upgrading React does not enable it. So check your build config before assuming it is on, and until it is, apply memo surgically — not everywhere.</p>
      </InfoBox>

      <h2>Hooks and the Render Cycle — Complete Reference</h2>

      <p>Every hook has a specific relationship with React's render cycle. Some run during the render phase, some after. Some can trigger re-renders, others never do. This table is your definitive reference.</p>

      <InfoBox variant="info" title="Hook Timing Reference">
        <ul>
          <li><strong>useState</strong> — Runs during: Render phase (initialization). Triggers re-render? <strong>Yes</strong> (when setter called with new value). Timing: Synchronous.</li>
          <li><strong>useReducer</strong> — Runs during: Render phase. Triggers re-render? <strong>Yes</strong> (when dispatch returns new state). Timing: Synchronous.</li>
          <li><strong>useRef</strong> — Runs during: Render phase (initialization). Triggers re-render? <strong>No, never</strong>. Timing: N/A.</li>
          <li><strong>useMemo</strong> — Runs during: Render phase. Triggers re-render? <strong>No</strong> (computes during render). Timing: Synchronous.</li>
          <li><strong>useCallback</strong> — Runs during: Render phase. Triggers re-render? <strong>No</strong> (returns cached function during render). Timing: Synchronous.</li>
          <li><strong>useContext</strong> — Runs during: Render phase. Triggers re-render? <strong>Yes</strong> (when context value changes). Timing: Synchronous.</li>
          <li><strong>useEffect</strong> — Runs during: After paint (commit phase). Triggers re-render? <strong>No*</strong> (but can call setState inside, which schedules one). Timing: Asynchronous.</li>
          <li><strong>useLayoutEffect</strong> — Runs during: Before paint (commit phase). Triggers re-render? <strong>No*</strong> (but can call setState inside). Timing: Synchronous.</li>
          <li><strong>useTransition</strong> — Runs during: Render phase. Triggers re-render? <strong>Yes</strong> (marks update as low priority). Timing: Async.</li>
          <li><strong>useDeferredValue</strong> — Runs during: Render phase. Triggers re-render? <strong>Yes</strong> (deferred, lower priority). Timing: Async.</li>
        </ul>
      </InfoBox>

      <InfoBox variant="warning" title="The Double-Render Trap: setState Inside useEffect">
        <p>When you call <code>setState</code> inside a <code>useEffect</code>, it schedules an <strong>additional re-render</strong>. This means the component renders twice: once for the original update, once for the effect's <code>setState</code>. This is a common performance trap — avoid setting state in effects when you can compute the value during render instead.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="The Double-Render Trap" showLineNumbers>
{`// ❌ BAD: causes double render on every items change
function BadItemCount({ items }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(items.length); // Triggers ANOTHER render!
  }, [items]);

  // Render sequence when items changes:
  // 1. Render with old count (stale for one frame)
  // 2. useEffect fires → setCount(items.length)
  // 3. Render AGAIN with new count
  return <p>Count: {count}</p>;
}

// ✅ GOOD: compute during render — no extra render needed
function GoodItemCount({ items }) {
  const count = items.length; // Derived state — always in sync, zero overhead
  return <p>Count: {count}</p>;
}

// ✅ ALSO GOOD: useMemo for expensive computations
function FilteredList({ items, query }) {
  const filtered = useMemo(
    () => items.filter(item => item.name.includes(query)),
    [items, query]
  );
  return <ul>{filtered.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════════════════
          SECTION: React.memo vs useMemo vs useCallback
          ══════════════════════════════════════════════════════════════ */}

      <h2>React.memo vs useMemo vs useCallback — Rendering Impact</h2>

      <p>These three are constantly confused. They have very different purposes and very different effects on rendering.</p>

      <InfoBox variant="info" title="The Three Memoization Tools">
        <ul>
          <li><strong>React.memo</strong> — Prevents a <em>component</em> from re-rendering. Wraps the component itself. Compares previous props to next props using shallow equality (or a custom comparator). This is the only one that actually <strong>skips rendering</strong>.</li>
          <li><strong>useMemo</strong> — Caches a <em>computed value</em> during render. The component still re-renders; useMemo just skips recomputing an expensive value if deps haven't changed. It runs during every render to check.</li>
          <li><strong>useCallback</strong> — Caches a <em>function reference</em> during render. The component still re-renders. The primary use case is passing stable function props to <code>React.memo</code>-wrapped children so their prop comparison succeeds.</li>
        </ul>
      </InfoBox>

      <InfoBox variant="tip" title="When useCallback Actually Helps">
        <p><code>useMemo</code> and <code>useCallback</code> run DURING every render to check if deps changed. They don't skip renders — they skip recomputation. Only <code>React.memo</code> (or <code>shouldComponentUpdate</code> in classes) actually prevents a component from re-rendering. <code>useCallback</code> is only useful when the cached function is passed as a prop to a <code>React.memo</code>-wrapped child — otherwise you are paying the cost of memoization with zero benefit.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="How the Three Work Together" showLineNumbers>
{`// The expensive child is wrapped in React.memo
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

function Parent() {
  const [query, setQuery] = useState('');
  const [items] = useState([{ id: 1, name: 'React' }, { id: 2, name: 'Vue' }]);

  // useMemo: cache the filtered result so we pass the same array reference
  const filtered = useMemo(
    () => items.filter(i => i.name.includes(query)),
    [items, query]
  );

  // useCallback: cache the function so ExpensiveList sees stable props
  const handleSelect = useCallback((id) => {
    console.log('Selected:', id);
  }, []);

  // Without useMemo + useCallback, ExpensiveList would re-render
  // on EVERY keystroke even though its data hasn't changed
  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ExpensiveList items={filtered} onSelect={handleSelect} />
    </div>
  );
}`}
      </CodeBlock>


      <h2>useEffect Execution Timing</h2>

      <InfoBox variant="tip" title="Effect Timing Nuance">
        <p><code>useEffect</code> runs <strong>after</strong> the browser paints. If you need to measure DOM or prevent visual flicker, use <code>useLayoutEffect</code> which runs synchronously after DOM mutations but before paint.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Effect Timing Demonstration" showLineNumbers>
{`function TimingDemo() {
  const [rect, setRect] = useState(null);
  const ref = useRef(null);

  // Runs AFTER paint — may cause flicker if you reposition elements
  useEffect(() => {
    console.log('useEffect: browser already painted');
  });

  // Runs BEFORE paint — blocks visual update until complete
  useLayoutEffect(() => {
    // Safe to measure and immediately adjust DOM
    const bounds = ref.current.getBoundingClientRect();
    setRect(bounds); // Won't cause visible flicker
  }, []);

  // Render phase — called during reconciliation (may run multiple times)
  console.log('Render: computing virtual DOM');

  return <div ref={ref}>Measured element</div>;
}

// Execution order on mount:
// 1. "Render: computing virtual DOM" (render phase)
// 2. DOM mutations applied (commit phase start)
// 3. useLayoutEffect fires (before paint)
// 4. Browser paints pixels
// 5. useEffect fires (after paint)`}
      </CodeBlock>

      <h2>Strict Mode Double-Invocation</h2>

      <p>In React 18+ development mode with StrictMode, React intentionally double-invokes render functions, effects, and cleanups to surface impure code. This catches bugs where effects aren't properly cleaning up.</p>

      <CodeBlock language="jsx" title="Why Strict Mode Breaks Naive Effects" showLineNumbers>
{`// BAD: This breaks under StrictMode double-invocation
function BrokenComponent() {
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/data', { signal: controller.signal });
    // Missing cleanup! Second invocation creates duplicate request
  }, []);
}

// GOOD: Proper cleanup handles double-invocation gracefully
function CorrectComponent() {
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!controller.signal.aborted) {
          // Only update if this effect instance is still active
          setData(data);
        }
      });
    return () => controller.abort(); // Cleanup cancels the request
  }, []);
}`}
      </CodeBlock>

    </LessonLayout>
  );
}
