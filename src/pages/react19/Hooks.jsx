import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Hooks() {
  return (
    <LessonLayout
      title="Hooks Deep Dive"
      sectionId="react19"
      lessonIndex={1}
      prev={{ path: '/react19/lifecycle-sim', label: '🧪 Lifecycle Simulator' }}
      next={{ path: '/react19/state', label: 'State Management Patterns' }}
    >
      <p>Hooks are functions that let you "hook into" React's state and lifecycle from function components. Let's go beyond the basics into nuances that trip up even experienced developers.</p>

      <h2>Rules of Hooks — The Why</h2>

      <InfoBox variant="danger" title="Rules of Hooks (and Why They Exist)">
        <p><strong>1. Only call hooks at the top level</strong> — React relies on call order to associate state with hook calls. Conditionals/loops break this mapping.</p>
        <p><strong>2. Only call hooks from React functions</strong> — Components or custom hooks. This ensures the hook is bound to a component's fiber node.</p>
        <p>Internally, React stores hooks as a linked list on the fiber. Each render, it walks the list in order. If the order changes, hooks get mismatched with their stored state.</p>
      </InfoBox>

      <FlowChart
        title="How React Tracks Hooks Internally"
        chart={"graph LR\n  A[Fiber Node] --> B[Hook 0: useState]\n  B --> C[Hook 1: useEffect]\n  C --> D[Hook 2: useMemo]\n  D --> E[Hook 3: useCallback]\n  E --> F[null - end]\n  G[Re-render] --> H[Walk list in same order]\n  H --> I[Match each call to stored state]"}
      />

      <h2>useState — Beyond the Basics</h2>

      <CodeBlock language="jsx" title="useState Nuances" showLineNumbers>
{`// Lazy initialization — function only called on FIRST render
const [data, setData] = useState(() => {
  return JSON.parse(localStorage.getItem('expensive-data'));
});

// Functional updates — use when new state depends on previous
const increment = () => {
  // BAD: stale closure if called multiple times in same event
  setCount(count + 1);
  setCount(count + 1); // Still uses same 'count' value!

  // GOOD: functional update always has latest state
  setCount(prev => prev + 1);
  setCount(prev => prev + 1); // Correctly increments twice
};

// Object state — always spread previous state
const [form, setForm] = useState({ name: '', email: '' });
const updateName = (name) => setForm(prev => ({ ...prev, name }));

// Bail out optimization: if setState receives same value (Object.is),
// React bails out of re-rendering children (but may still re-render
// the component itself before bailing out)
setCount(42); // If count is already 42, children won't re-render`}
      </CodeBlock>

      <InfoBox variant="warning" title="⚠️ useState Traps to Watch For">
        <p><strong>Lazy initialization:</strong> <code>useState(expensiveFn())</code> runs the function every render — wrap with <code>() =&gt;</code> to only run once. See the deep dive below.</p>
        <p><strong>Functional updates:</strong> <code>setCount(count + 1)</code> twice in one handler only increments once — use <code>setCount(prev =&gt; prev + 1)</code>. See the deep dive below.</p>
      </InfoBox>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: Can I use useState instead of useMemo to create stable references?</h3>

      <InfoBox variant="info" title="Short Answer: Yes — useState values are stable too">
        <p><code>useState</code> stores its initial value in the fiber on mount and returns the <strong>same reference</strong> every render (until you call the setter). So <code>const [items] = useState([1, 2, 3])</code> gives you a stable array — just like <code>useMemo</code> would.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Both produce stable references" showLineNumbers>
{`// OPTION A: useMemo — "computed/derived value"
const items = useMemo(() => [1, 2, 3], []);
const style = useMemo(() => ({ color: 'red' }), []);

// OPTION B: useState — "stored value"
const [items] = useState([1, 2, 3]);
const [style] = useState({ color: 'red' });

// Both work! Both give you the same reference across renders.
// The difference is INTENT, not behavior:`}
      </CodeBlock>

      <h3>When to use which</h3>

      <CodeBlock language="jsx" title="Choose based on intent" showLineNumbers>
{`// ✅ useState — the value might change later via user interaction
const [filters, setFilters] = useState({ status: 'active', sort: 'name' });
// Later: setFilters({ status: 'inactive', sort: 'date' })

// ✅ useMemo — the value is derived/computed from other things
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// ✅ useMemo — the value depends on props or other state
const chartData = useMemo(
  () => rawData.map(d => ({ x: d.date, y: d.value })),
  [rawData]
);

// ❌ WRONG: useState for a derived value
// This stores a stale snapshot — it won't update when rawData changes!
const [chartData] = useState(rawData.map(d => ({ x: d.date, y: d.value })));`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Rule">
        <ul>
          <li><strong>useState</strong> — value that lives independently and might change via setter</li>
          <li><strong>useMemo</strong> — value that is derived from or depends on other values</li>
          <li>Both produce stable references. Pick based on <strong>intent</strong>, not stability.</li>
        </ul>
      </InfoBox>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: Does useState's default value re-calculate every render?</h3>

      <InfoBox variant="warning" title="It depends on which form you use">
        <p><strong>Direct value</strong> — YES, the expression evaluates every render (wasteful).<br/>
        <strong>Lazy initializer (arrow function)</strong> — NO, React only calls it on the first render.</p>
      </InfoBox>

      <h3>The Trap: Direct Value</h3>

      <CodeBlock language="jsx" title="❌ Expensive computation runs EVERY render">{`// JavaScript evaluates arguments BEFORE calling the function.
// So JSON.parse(...) runs every render — useState just ignores
// the result after the first render. The damage is already done.

const [data, setData] = useState(
  JSON.parse(localStorage.getItem('expensive-data'))
);

// What actually happens on each render:
// 1. JS evaluates JSON.parse(localStorage.getItem(...))  ← RUNS
// 2. Result is passed to useState(result)
// 3. useState sees "I already have state" → ignores the argument
// 4. Returns existing [data, setData]
// Net effect: expensive work for nothing on re-renders`}</CodeBlock>

      <h3>The Fix: Lazy Initializer</h3>

      <CodeBlock language="jsx" title="✅ Function only called on FIRST render">{`// Pass a FUNCTION instead of a value.
// React checks: is the argument a function?
//   - First render: YES → call it, use return value as initial state
//   - Re-renders: YES → but DON'T call it, skip entirely

const [data, setData] = useState(() => {
  return JSON.parse(localStorage.getItem('expensive-data'));
});

// What actually happens:
// FIRST RENDER:
//   1. JS evaluates () => ...   ← just creates a function ref (cheap)
//   2. useState sees a function → calls it → gets initial value
//   3. Returns [data, setData]
//
// RE-RENDERS:
//   1. JS evaluates () => ...   ← creates function ref (cheap)
//   2. useState sees "I already have state" → NEVER calls the function
//   3. Returns existing [data, setData]`}</CodeBlock>

      <h3>Why Does This Happen?</h3>

      <InfoBox variant="info" title="It's Just JavaScript — Not React Magic">
        <p>This isn't a React quirk — it's how function arguments work in any language:</p>
        <code>useState(expensiveThing())</code> — JS calls <code>expensiveThing()</code> first, then passes the <em>result</em> to useState.<br/>
        <code>useState(() =&gt; expensiveThing())</code> — JS passes the <em>function reference</em> to useState. React decides when (and if) to call it.
      </InfoBox>

      <h3>All Three Forms Compared</h3>

      <CodeBlock language="jsx" title="The three forms of useState initialization">{`// FORM 1: Direct value — ❌ recalculates every render
useState(someLongComputation())
// JS calls someLongComputation() immediately as an argument
// useState receives the RESULT, ignores it after first render
// But the computation already ran — wasted work

// FORM 2: Arrow wrapper — ✅ runs once
useState(() => someLongComputation())
// JS passes the arrow function as a reference (cheap)
// React calls it on mount, never again

// FORM 3: Direct function reference — ✅ runs once (same as Form 2)
useState(someLongComputation)  // note: NO parentheses!
// JS passes the function itself (not its return value)
// React does typeof === 'function' → calls it on mount
// Identical behavior to Form 2

// When to use which:
useState(loadDefaults)                   // Form 3: clean, no args needed
useState(() => computeGrid(100, 100))    // Form 2: need to pass arguments
useState(0)                              // Form 1: fine for cheap primitives`}</CodeBlock>

      <FlowChart title="Decision: Lazy Initializer Needed?" chart={"graph TD\n  A[What is your initial state value?] --> B{Is it expensive to compute?}\n  B -->|No - simple value| C[Just pass it directly]\n  C --> D[\"useState(0) or useState('')\"]\n  B -->|Yes - computation needed| E{Does the function need arguments?}\n  E -->|No args| F[Pass function directly]\n  F --> G[\"useState(myFunction)\"]\n  E -->|Needs args| H[Wrap in arrow function]\n  H --> I[\"useState(() => myFn(arg1, arg2))\"]\n  style D fill:#4caf50,color:#fff\n  style G fill:#4caf50,color:#fff\n  style I fill:#4caf50,color:#fff"} />

      <h3>Common Cases That Need Lazy Initialization</h3>

      <CodeBlock language="jsx" title="When to use the lazy pattern">{`// ✅ Reading from localStorage
const [prefs, setPrefs] = useState(() =>
  JSON.parse(localStorage.getItem('prefs')) || {}
);

// ✅ Expensive initial computation
const [matrix, setMatrix] = useState(() =>
  generateLargeMatrix(1000, 1000)
);

// ✅ Direct function reference (no args needed)
const [config, setConfig] = useState(loadConfig);

// ❌ DON'T need lazy init for primitives — they're cheap
const [count, setCount] = useState(0);
const [name, setName] = useState('');
const [isOpen, setIsOpen] = useState(false);
const [items, setItems] = useState([]);`}</CodeBlock>

      <InfoBox variant="danger" title="Gotcha: Don't Confuse With useEffect">
        <p>Lazy initialization runs <strong>synchronously during the first render</strong> — it blocks painting. If your initialization is truly slow (e.g., heavy computation), the user may see a delay on mount. For <em>async</em> work (API calls), use <code>useEffect</code> instead — never put async logic in the lazy initializer.</p>
      </InfoBox>

      <InteractiveChallenge
        question={"What's the difference between useState(getValue()) and useState(() => getValue())?"}
        options={[
          "No difference — both only run getValue on the first render",
          "The first runs getValue every render but only uses it once; the second only runs it once",
          "The first is faster because there's no wrapper function overhead",
          "The second is only needed for async initialization"
        ]}
        correctIndex={1}
        explanation={"useState(getValue()) evaluates getValue() on every render as a regular function argument — useState just ignores the result after mount. useState(() => getValue()) passes a function that React only invokes on the first render, avoiding unnecessary computation on re-renders."}
      />

      <h3>💡 "But wait — isn't the arrow function a new reference each render?"</h3>

      <p>
        Yes! <code>() =&gt; someLongComputation()</code> creates a <strong>new function object</strong> every
        render. But it doesn't matter — React never compares it.
      </p>

      <InfoBox variant="info" title="useState doesn't use reference comparison">
        <p>This is fundamentally different from dependency arrays:</p>
        <ul>
          <li><strong>Dependency arrays:</strong> "Is this the SAME reference as last time?" → <code>Object.is()</code></li>
          <li><strong>useState initializer:</strong> "Do I ALREADY have state?" → simple yes/no boolean check</li>
        </ul>
        <p>The reference identity of the initializer is <strong>completely irrelevant</strong>.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="React's two internal code paths (simplified)">
{`// FIRST RENDER — mountState is called
function mountState(initialArg) {
  const hook = createNewHook();

  // Only time React inspects the argument:
  const value = typeof initialArg === 'function'
    ? initialArg()   // Call it once → use return value
    : initialArg;    // Use it directly

  hook.state = value;
  return [hook.state, hook.dispatch];
}

// EVERY RE-RENDER — updateState is called (different function!)
function updateState(initialArg) {
  const hook = getExistingHook();    // already has .state
  // initialArg is NEVER READ here — the parameter exists but is dead code
  return [hook.state, hook.dispatch];
}`}
      </CodeBlock>

      <p>
        On re-renders, React calls a <strong>completely different code path</strong> that doesn't even
        have logic to inspect the argument. It's like a birth certificate — checked once at creation,
        then your identity is your state slot forever after.
      </p>

      <h3>The Cost Comparison</h3>

      <CodeBlock language="text" title="What actually happens on each re-render">
{`┌─────────────────────────────┬──────────────────────────────────┬────────────────────┐
│ Approach                    │ What JS does before useState     │ Cost per re-render │
├─────────────────────────────┼──────────────────────────────────┼────────────────────┤
│ useState(heavy())           │ Calls heavy(), passes result     │ Expensive          │
│ useState(() => heavy())     │ Creates tiny closure, passes it  │ ~Free              │
└─────────────────────────────┴──────────────────────────────────┴────────────────────┘

Both get IGNORED by React on re-renders. Same behavior.
The only difference is what JavaScript does BEFORE handing the argument over.

With useState(heavy()):     The damage is already done — JS ran it.
With useState(() => heavy()): JS only built a cheap pointer. Nothing ran.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The One-Sentence Summary">
        <p>The lazy initializer isn't about giving React a stable reference — it's about <strong>preventing JavaScript from running the expensive thing</strong> as an argument before React even gets a say.</p>
      </InfoBox>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: Why doesn't calling setState twice with the same value work?</h3>

      <p>
        You've probably seen code like this and expected <code>count</code> to increase by 2:
      </p>

      <CodeBlock language="jsx" title="The Trap — Calling setState Twice">
{`const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(count + 1);  // expects 1
  setCount(count + 1);  // expects 2... but still 1!
};`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why This Happens">
        <p>
          This isn't a React bug — it's how <strong>JavaScript closures</strong> work combined with <strong>React's batching</strong>.
        </p>
        <p>
          When your component renders with <code>count = 0</code>, the <code>handleClick</code> function
          captures <code>count</code> as a <strong>constant snapshot</strong> in its closure. Inside that
          function, <code>count</code> is <code>0</code> and will <em>always</em> be <code>0</code> —
          it cannot change until the component re-renders and creates a new closure.
        </p>
      </InfoBox>

      <h3>Step-by-Step: What Actually Happens</h3>

      <CodeBlock language="jsx" title="Tracing the Execution">
{`// React renders. count is 0. This is a const — frozen in this closure.
const [count, setCount] = useState(0);

const handleClick = () => {
  // count is 0 in this closure. Period.
  setCount(count + 1);  // setCount(0 + 1) → queues update to 1
  setCount(count + 1);  // setCount(0 + 1) → queues update to 1 (same!)

  // React batches both updates. Final state: 1, not 2.
};`}
      </CodeBlock>

      <FlowChart
        title="Direct Value vs Functional Update"
        chart={"graph TD\n  A[count = 0 captured in closure] --> B[setCount - count + 1 -]\n  B --> C[Queues: set to 1]\n  C --> D[setCount - count + 1 - again]\n  D --> E[Queues: set to 1 - same count!]\n  E --> F[React batches: last value wins = 1]\n  style A fill:#1e3a5f,stroke:#4fc3f7,color:#e0e0e0\n  style F fill:#5c1a1a,stroke:#ef5350,color:#e0e0e0"}
      />

      <h3>The Fix: Functional Updates</h3>

      <p>
        Functional updates bypass the closure entirely. Instead of passing a value,
        you pass a <strong>function</strong> that receives the latest pending state:
      </p>

      <CodeBlock language="jsx" title="Functional Updates — Always Correct">
{`const handleClick = () => {
  setCount(prev => prev + 1);  // React passes 0 → returns 1
  setCount(prev => prev + 1);  // React passes 1 → returns 2  ✓

  // React chains the updaters. Final state: 2
};`}
      </CodeBlock>

      <FlowChart
        title="Functional Update Chain"
        chart={"graph TD\n  A[setCount - prev => prev + 1 -] --> B[React passes prev = 0]\n  B --> C[Returns 1]\n  C --> D[setCount - prev => prev + 1 -]\n  D --> E[React passes prev = 1]\n  E --> F[Returns 2]\n  F --> G[React applies final state: 2]\n  style A fill:#1e3a5f,stroke:#4fc3f7,color:#e0e0e0\n  style G fill:#1a3a1a,stroke:#66bb6a,color:#e0e0e0"}
      />

      <InfoBox variant="tip" title="The Rule">
        <p>
          <strong>Use functional updates whenever new state depends on previous state.</strong>
        </p>
        <p>
          <code>setCount(prev =&gt; prev + 1)</code> — React feeds you the latest value.<br />
          <code>setCount(count + 1)</code> — you're using a stale snapshot from the closure.
        </p>
      </InfoBox>

      <h3>Why It's Not "Stale" in the Traditional Sense</h3>

      <p>
        The word "stale" is misleading here. The closure isn't outdated due to a timing bug —
        it's working <em>exactly</em> as JavaScript closures are designed to work.
        When a function is created, it captures the variables from its surrounding scope <em>at that moment</em>.
        <code>count</code> is a <code>const</code> assigned during render — it literally cannot change.
      </p>

      <CodeBlock language="jsx" title="Mental Model — It's Just JavaScript">
{`// This is what React effectively does each render:
function MyComponent() {
  const count = 0;  // <-- this is a const. It's 0. Done.

  const handleClick = () => {
    console.log(count);  // Always 0 in this render's closure
    console.log(count);  // Still 0
  };

  // On NEXT render, a NEW closure is created with count = 1
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"If count is 5, what is the result of calling setCount(count + 1) three times in the same handler?"}
        options={[
          "8 — it increments three times",
          "6 — all three calls use the same snapshot of count (5), so they all set state to 6",
          "7 — the first one works, the others are ignored",
          "It throws an error — you can't call setState multiple times"
        ]}
        correctIndex={1}
        explanation={"All three calls capture count = 5 from the closure. Each call evaluates to setCount(5 + 1) = setCount(6). React batches them and the final state is 6, not 8. Use setCount(prev => prev + 1) three times to get 8."}
      />

      <hr />
      <h3>💡 Deep Dive: How does React chain functional updates internally?</h3>

      <p>
        When you call <code>setCount(prev =&gt; prev + 1)</code> twice, state doesn't change on either line.
        <strong>Nothing mutates during your handler.</strong> React <em>queues</em> the updater functions
        and processes them later during the re-render.
      </p>

      <CodeBlock language="jsx" title="What Actually Happens — Step by Step">
{`// Your handler runs:
const handleClick = () => {
  setCount(prev => prev + 1);  // → queues updater #1
  setCount(prev => prev + 1);  // → queues updater #2
  // State is still 0 here. Nothing changed yet.
  // Your handler finishes. React takes over.
};

// Later, React processes the update queue:
//   pendingState = 0        (current committed state)
//   updater #1: fn(0) → 1   (pendingState is now 1)
//   updater #2: fn(1) → 2   (pendingState is now 2)
//   Final state: 2 → triggers re-render`}
      </CodeBlock>

      <p>
        Internally, it's essentially <code>Array.reduce</code> — React feeds each updater's
        return value as the next updater's <code>prev</code>:
      </p>

      <CodeBlock language="jsx" title="Simplified React Internals — Update Queue Processing">
{`// This is roughly what React does when processing setState calls:
function processUpdateQueue(fiber) {
  const queue = fiber.updateQueue;    // [fn1, fn2, ...]
  let pendingState = fiber.memoizedState;  // current state: 0

  for (const updater of queue) {
    if (typeof updater === 'function') {
      pendingState = updater(pendingState);  // chain through
    } else {
      pendingState = updater;  // direct value: setCount(5)
    }
  }

  fiber.memoizedState = pendingState;  // commit final result
}

// With our two updaters:
//   pendingState = 0
//   pendingState = (prev => prev + 1)(0) → 1
//   pendingState = (prev => prev + 1)(1) → 2
//   fiber.memoizedState = 2  ✓`}
      </CodeBlock>

      <FlowChart
        title="Update Queue Processing Pipeline"
        chart={"graph LR\n  A[Handler calls setCount twice] --> B[Queue: fn1, fn2]\n  B --> C[React drains queue]\n  C --> D[pending = 0]\n  D --> E[fn1: 0 to 1]\n  E --> F[fn2: 1 to 2]\n  F --> G[Commit state = 2]\n  G --> H[Re-render with count = 2]\n  style A fill:#1e3a5f,stroke:#4fc3f7,color:#e0e0e0\n  style G fill:#1a3a1a,stroke:#66bb6a,color:#e0e0e0\n  style H fill:#1a3a1a,stroke:#66bb6a,color:#e0e0e0"}
      />

      <InfoBox variant="info" title="Key Takeaway">
        <p>
          <code>setCount</code> doesn't mutate anything — it <strong>enqueues</strong>.
          React processes the queue later, chaining <code>prev</code> values through each
          function like a pipeline. That's why functional updates always have the latest
          state — they're not reading from a closure, they're receiving from the chain.
        </p>
      </InfoBox>

      <InfoBox variant="question" title="But what about direct values mixed in?">
        <p>
          If you mix functional updates with direct values, the direct value <strong>resets the chain</strong>:
        </p>
        <pre><code>{`setCount(prev => prev + 1);  // 0 → 1
setCount(42);                // pendingState = 42 (ignores chain)
setCount(prev => prev + 1);  // 42 → 43
// Final state: 43`}</code></pre>
        <p>
          Direct values act like <code>pendingState = value</code> — they overwrite
          whatever the chain built so far.
        </p>
      </InfoBox>

      <h2>useRef — More Than DOM References</h2>

      <CodeBlock language="jsx" title="useRef Patterns" showLineNumbers>
{`// Pattern 1: Mutable instance variable (persists across renders, no re-render on change)
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  // Update ref on every render so interval always calls latest callback
  useLayoutEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Pattern 2: Previous value tracking
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value; // Updates AFTER render, so returns previous
  });
  return ref.current;
}

// Pattern 3: Stable callback without useCallback dependency churn
function useStableCallback(fn) {
  const ref = useRef(fn);
  ref.current = fn; // Always fresh
  // Return stable reference that delegates to latest fn
  return useRef((...args) => ref.current(...args)).current;
}`}
      </CodeBlock>

      <hr />
      <h3>💡 Deep Dive: Understanding the three useRef patterns above</h3>

      <h4>Pattern 1: Why useLayoutEffect for updating the ref?</h4>

      <p>
        The <code>useInterval</code> hook needs the interval callback to always reference the <em>latest</em> version of the function.
        The question is: <strong>when</strong> do you update <code>savedCallback.current</code>?
      </p>

      <CodeBlock language="jsx" title="Timing — useLayoutEffect vs useEffect">
{`// The render timeline:
// Render → DOM commit → useLayoutEffect (sync) → Paint → useEffect (async)
//                        ↑ ref updated HERE              ↑ if you updated HERE...
//                                                          an interval tick could
//                                                          fire BETWEEN commit and
//                                                          effect with a stale ref

// useLayoutEffect guarantees:
//   "The ref is updated BEFORE anything async can read it"
//
// For most cases useEffect would work fine — interval ticks are ~16ms+
// But useLayoutEffect closes the gap to ZERO. It's a correctness guarantee.`}
      </CodeBlock>

      <FlowChart
        title="Render Timeline — Where Can Interval Fire?"
        chart={"graph LR\n  A[Render] --> B[DOM Commit]\n  B --> C[useLayoutEffect - ref updated]\n  C --> D[Browser Paint]\n  D --> E[useEffect runs]\n  D --> F[Interval tick can fire here]\n  style C fill:#1a3a1a,stroke:#66bb6a,color:#e0e0e0\n  style F fill:#5c1a1a,stroke:#ef5350,color:#e0e0e0"}
      />

      <h4>Pattern 2: usePrevious — timing is everything</h4>

      <p>
        The trick is that <code>useEffect</code> runs <em>after</em> the render returns. So <code>ref.current</code>
        is returned to the caller <strong>before</strong> the effect updates it:
      </p>

      <CodeBlock language="jsx" title="usePrevious — Step by Step Trace">
{`function usePrevious(value) {
  const ref = useRef();      // Persists across renders
  useEffect(() => {
    ref.current = value;     // Runs AFTER return — updates for NEXT render
  });
  return ref.current;        // Returns what was set LAST render
}

// Trace:
// Render 1: value = "A"
//   → return ref.current → undefined (nothing set yet)
//   → AFTER render: effect runs, sets ref.current = "A"
//
// Render 2: value = "B"
//   → return ref.current → "A" (set by render 1's effect)
//   → AFTER render: effect runs, sets ref.current = "B"
//
// Render 3: value = "C"
//   → return ref.current → "B" (always one behind!)
//
// The effect always runs AFTER the return.
// So ref.current always holds the PREVIOUS render's value.`}
      </CodeBlock>

      <CodeBlock language="jsx" title="usePrevious — How a Component Uses It">
{`function PriceDisplay({ price }) {
  const prevPrice = usePrevious(price);
  //    ^^^^^^^^^ 
  //    On first render: undefined (no previous yet)
  //    On re-renders: whatever 'price' was LAST render

  const direction = prevPrice === undefined
    ? 'neutral'
    : price > prevPrice ? 'up' : price < prevPrice ? 'down' : 'same';

  return (
    <div className={\`price \${direction}\`}>
      <span>\${price}</span>
      {prevPrice !== undefined && (
        <small>was \${prevPrice}</small>
      )}
      {direction === 'up' && ' 📈'}
      {direction === 'down' && ' 📉'}
    </div>
  );
}

// Usage:
// <PriceDisplay price={42} />
//   Render 1: price=42, prevPrice=undefined → "neutral"
//   (parent re-renders with price=45)
//   Render 2: price=45, prevPrice=42 → "up 📈"
//   (parent re-renders with price=40)
//   Render 3: price=40, prevPrice=45 → "down 📉"

// Another common use: detecting if a specific prop changed
function UserProfile({ userId }) {
  const prevUserId = usePrevious(userId);

  useEffect(() => {
    if (prevUserId !== undefined && prevUserId !== userId) {
      // userId CHANGED — reset local state, refetch, etc.
      console.log(\`Switched from user \${prevUserId} to \${userId}\`);
    }
  }, [userId, prevUserId]);

  return <div>User: {userId}</div>;
}`}
      </CodeBlock>

      <h4>Pattern 3: useStableCallback — two refs, two jobs</h4>

      <p>
        This is the trickiest pattern. The goal: create a callback with a <strong>stable identity</strong>
        (never changes reference) that always calls the <strong>latest version</strong> of your function.
      </p>

      <CodeBlock language="jsx" title="useStableCallback — Annotated Line by Line">
{`function useStableCallback(fn) {
  // Ref #1: A "box" that always holds the latest fn
  const ref = useRef(fn);
  ref.current = fn;  // Update synchronously every render (cheap)

  // Ref #2: A wrapper function created ONCE (useRef = stable)
  // When called, it looks up ref.current AT CALL TIME (not creation time)
  return useRef((...args) => ref.current(...args)).current;
  //     ^^^^^^                ^^^^^^^^^^^
  //     created once          reads latest fn when actually invoked
}

// Why two refs?
// - ref (inner): holds the actual fn, updated every render
// - useRef(wrapper) (outer): holds the stable wrapper, created once
//
// The wrapper's identity NEVER changes (same useRef across renders)
// But when you CALL it, it does ref.current(...args) — which is
// whatever fn was on the most recent render.

// USE CASE:
function Parent() {
  const [count, setCount] = useState(0);
  
  // This handler uses 'count' from closure — changes every render
  const handleClick = () => console.log(count);
  
  // Stable version: same reference forever, but always logs latest count
  const stableClick = useStableCallback(handleClick);
  
  // Safe to pass to memoized child — won't cause re-renders
  return <MemoizedChild onClick={stableClick} />;
}`}
      </CodeBlock>

      <FlowChart
        title="useStableCallback — How It Works"
        chart={"graph TD\n  A[Every render: ref.current = fn] --> B[Wrapper function reads ref.current]\n  B --> C[Wrapper identity never changes]\n  C --> D[Safe for dependency arrays]\n  C --> E[Safe for React.memo children]\n  B --> F[But always calls LATEST fn]\n  style C fill:#1a3a1a,stroke:#66bb6a,color:#e0e0e0\n  style F fill:#1a3a1a,stroke:#66bb6a,color:#e0e0e0\n  style A fill:#1e3a5f,stroke:#4fc3f7,color:#e0e0e0"}
      />

      <InfoBox variant="tip" title="When to Use Each Pattern">
        <ul>
          <li><strong>useLayoutEffect + ref</strong> — when async code (timers, subscriptions) must always see the latest value with zero gap</li>
          <li><strong>usePrevious</strong> — when you need to compare current vs previous value (animations, "changed since last render" checks)</li>
          <li><strong>useStableCallback</strong> — when you need a stable function reference that won't break <code>React.memo</code> or dependency arrays, but must always use fresh closure values</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question={"In usePrevious, why does useEffect (not useLayoutEffect) matter?"}
        options={[
          "useEffect is faster than useLayoutEffect",
          "useEffect runs AFTER the return, so ref.current still holds the previous value when read",
          "useLayoutEffect would cause an infinite loop",
          "useEffect batches multiple updates together"
        ]}
        correctIndex={1}
        explanation={"useEffect runs after render completes. So when the component reads ref.current during render, the effect hasn't updated it yet — it still holds the value from the PREVIOUS render's effect. That's the whole trick."}
      />

      <h2>useReducer — When useState Isn't Enough</h2>

      <CodeBlock language="jsx" title="useReducer for Complex State Logic" showLineNumbers>
{`// When state transitions have complex logic or multiple sub-values
const initialState = { status: 'idle', data: null, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, status: 'loading', error: null };
    case 'FETCH_SUCCESS':
      return { status: 'success', data: action.payload, error: null };
    case 'FETCH_ERROR':
      return { status: 'error', data: null, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      throw new Error(\`Unhandled action: \${action.type}\`);
  }
}

function DataFetcher({ url }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'FETCH_START' });

    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(data => dispatch({ type: 'FETCH_SUCCESS', payload: data }))
      .catch(err => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'FETCH_ERROR', payload: err.message });
        }
      });

    return () => controller.abort();
  }, [url]);

  // dispatch is stable — safe to pass to children without memo concerns
  return <ChildComponent dispatch={dispatch} data={state.data} />;
}`}
      </CodeBlock>

      <FlowChart
        title="useState vs useReducer — Decision Tree"
        chart={"graph TD\n  A[Need component state?] --> B{How many state variables?}\n  B -->|1-2 independent values| C[useState]\n  B -->|3+ related values| D{Do they update together?}\n  D -->|Yes| E[useReducer]\n  D -->|No| F[Multiple useState calls]\n  A --> G{Complex transition logic?}\n  G -->|Yes| E\n  G -->|No| C\n  A --> H{Next state depends on previous?}\n  H -->|Often| E\n  H -->|Rarely| I[useState with functional updates]\n  A --> J{Need to pass updater to deep children?}\n  J -->|Yes| K[useReducer - dispatch is stable]\n  J -->|No| C"}
      />

      <InfoBox variant="info" title="When to Reach for useReducer">
        <p><strong>Use useState when:</strong> You have 1-2 independent state values with simple updates (toggles, counters, form inputs).</p>
        <p><strong>Use useReducer when:</strong></p>
        <ul>
          <li><strong>Related state values</strong> — e.g. <code>{'{status, data, error}'}</code> that must stay in sync. A reducer guarantees they update atomically.</li>
          <li><strong>Complex transition logic</strong> — when the next state depends on the current state AND the type of action (like a state machine).</li>
          <li><strong>Multiple action types</strong> — instead of 5 setter functions, you dispatch named actions that are self-documenting.</li>
          <li><strong>Passing updater to children</strong> — <code>dispatch</code> is referentially stable (never changes), so passing it to children won't break <code>React.memo</code>. No need for <code>useCallback</code>.</li>
          <li><strong>Testing</strong> — reducers are pure functions. You can unit test them outside React: <code>expect(reducer(state, action)).toEqual(newState)</code>.</li>
        </ul>
      </InfoBox>

      <CodeBlock language="jsx" title="useState vs useReducer — Side by Side" showLineNumbers>
{`// ❌ useState: gets messy with related state
function FormWithState() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);     // Easy to forget one of these
    setErrors({});
    try {
      await submitForm({ name, email });
      setIsSubmitted(true);    // What if this runs but setIsSubmitting doesn't?
      setIsSubmitting(false);
    } catch (e) {
      setErrors(e.errors);
      setIsSubmitting(false);  // Duplicated logic
    }
  };
}

// ✅ useReducer: all transitions in one place, impossible states prevented
function formReducer(state, action) {
  switch (action.type) {
    case 'SUBMIT':
      return { ...state, isSubmitting: true, errors: {} };
    case 'SUCCESS':
      return { ...state, isSubmitting: false, isSubmitted: true };
    case 'ERROR':
      return { ...state, isSubmitting: false, errors: action.errors };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

function FormWithReducer() {
  const [state, dispatch] = useReducer(formReducer, {
    name: '', email: '', errors: {}, isSubmitting: false, isSubmitted: false,
  });

  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT' });
    try {
      await submitForm({ name: state.name, email: state.email });
      dispatch({ type: 'SUCCESS' });
    } catch (e) {
      dispatch({ type: 'ERROR', errors: e.errors });
    }
  };
  // Bonus: formReducer is a pure function — easy to unit test!
}`}
      </CodeBlock>

      <hr />
      <h3>💡 Deep Dive: Do multiple setState calls cause multiple re-renders?</h3>

      <p>
        Looking at the <code>FormWithState</code> example above, you might wonder: do <code>setIsSubmitting</code>,
        <code>setErrors</code>, <code>setIsSubmitted</code>, and <code>setIsSubmitting</code> each trigger their own re-render?
      </p>

      <p>
        <strong>No</strong> — since React 18, all setState calls within the same synchronous block are <strong>automatically batched</strong>.
        But the <code>await</code> keyword splits the handler into two batches:
      </p>

      <CodeBlock language="jsx" title="Batching With Async/Await — Two Renders, Not Four">
{`const handleSubmit = async () => {
  // ─── Batch 1: synchronous block before await ───
  setIsSubmitting(true);   // queued
  setErrors({});           // queued
  // → React re-renders ONCE (isSubmitting=true, errors={})

  await submitForm({ name, email });
  // ↑ await yields to the event loop — Batch 1 is flushed

  // ─── Batch 2: after await resumes ───
  setIsSubmitted(true);    // queued
  setIsSubmitting(false);  // queued
  // → React re-renders ONCE (isSubmitted=true, isSubmitting=false)
};
// Total: 2 renders instead of 4`}
      </CodeBlock>

      <FlowChart
        title="Batching Timeline"
        chart={"graph LR\n  A[setIsSubmitting true] --> B[setErrors empty]\n  B --> C[Render 1]\n  C --> D[await submitForm...]\n  D --> E[setIsSubmitted true]\n  E --> F[setIsSubmitting false]\n  F --> G[Render 2]\n  style C fill:#1e3a5f,stroke:#4fc3f7,color:#e0e0e0\n  style G fill:#1e3a5f,stroke:#4fc3f7,color:#e0e0e0\n  style D fill:#5c1a1a,stroke:#ef5350,color:#e0e0e0"}
      />

      <InfoBox variant="info" title="Why useReducer Wins Here">
        <p>
          With <code>useReducer</code>, a single <code>dispatch</code> call updates all related state in <strong>one atomic operation</strong> —
          always one render, no batching concerns, no risk of forgetting a setter. The <code>await</code> split doesn't matter
          because each dispatch already captures all the state changes for that transition.
        </p>
      </InfoBox>

      <h4>What Counts as a "Synchronous Block"?</h4>

      <p>
        A synchronous block is any uninterrupted run of JavaScript before the engine yields
        back to the event loop. <strong>If JS doesn't pause, it's one block. If it pauses, it's a new block.</strong>
      </p>

      <CodeBlock language="jsx" title="What Breaks a Batch vs What Doesn't">
{`// ✅ ONE block — all batched into 1 render:
function handleClick() {
  setState1('a');    // queued
  setState2('b');    // queued
  setState3('c');    // queued
  for (let i = 0; i < 1000; i++) { /* sync work */ }
  setState4('d');    // still queued — same block
}
// → 1 render (loops, if/else, function calls don't break it)

// ❌ BREAKS into separate blocks:
async function handleSubmit() {
  setState1('a');       // Block 1
  await fetch('/api');  // ← YIELDS to event loop
  setState2('b');       // Block 2
}
// → 2 renders

// ❌ Each setTimeout callback = its own block:
setTimeout(() => setState1('a'), 0);  // Block 1 → Render 1
setTimeout(() => setState2('b'), 0);  // Block 2 → Render 2

// ✅ But INSIDE one setTimeout = one block:
setTimeout(() => {
  setState1('a');  // queued
  setState2('b');  // queued
}, 0);             // → 1 render

// ❌ Each .then() = its own microtask = its own block:
fetch('/api')
  .then(() => setState1('a'))   // Block 1 → Render 1
  .then(() => setState2('b'));  // Block 2 → Render 2`}
      </CodeBlock>

      <InfoBox variant="note" title="The Mental Model">
        <p><strong>Things that DON'T break a block:</strong> <code>for</code>/<code>while</code> loops, <code>if</code>/<code>else</code>, function calls, <code>.map()</code>/<code>.filter()</code>/<code>.reduce()</code> — any synchronous computation.</p>
        <p><strong>Things that DO break a block:</strong> <code>await</code>, <code>setTimeout</code>/<code>setInterval</code> callbacks, <code>.then()</code> callbacks, event listener callbacks, <code>requestAnimationFrame</code>.</p>
        <p>Rule of thumb: if JavaScript has to "come back later" to run your code, that's a new block.</p>
      </InfoBox>

      <InfoBox variant="tip" title="Pro Tip: dispatch is Stable">
        <p><code>dispatch</code> from <code>useReducer</code> has a stable identity — it never changes between renders. This means you can pass it to child components without wrapping in <code>useCallback</code>, and it won't break <code>React.memo</code>. This is one of the biggest practical advantages over <code>useState</code> setters when combined with context.</p>
      </InfoBox>

      <InteractiveChallenge
        question="You have a component with 4 related state values (status, data, error, retryCount) that all change together based on fetch outcomes. What's the best approach?"
        options={[
          "Four separate useState calls with careful coordination",
          "One useState with an object and spread updates",
          "useReducer with named action types for each transition",
          "useRef to avoid re-renders"
        ]}
        correctIndex={2}
        explanation="useReducer is ideal here: the state values are related and change together based on distinct events (fetch start, success, error, retry). A reducer centralizes all transition logic, prevents impossible states (e.g., loading=true + error=true), and the dispatch function is stable for passing to children."
      />

      <h2>useMemo &amp; useCallback — Referential Stability</h2>

      <p>
        These two hooks solve the same fundamental problem: <strong>preventing new references from being created
        every render</strong>. They differ only in <em>what</em> they memoize.
      </p>

      <CodeBlock language="jsx" title="The Core Difference">
{`// useCallback memoizes a FUNCTION
const fn = useCallback(() => doSomething(a, b), [a, b]);
// Equivalent to:
const fn = useMemo(() => () => doSomething(a, b), [a, b]);

// useMemo memoizes a VALUE (the result of calling a function)
const value = useMemo(() => expensiveComputation(a, b), [a, b]);

// Both return the SAME reference until deps change.
// Both use Object.is to compare each dep with the previous render's dep.`}
      </CodeBlock>

      <h3>useCallback — When and Why</h3>

      <p>
        Every time a component renders, any function defined inside it is <strong>re-created</strong> as a new reference.
        This is usually fine — but it becomes a problem in two specific cases:
      </p>

      <CodeBlock language="jsx" title="The Problem: Inline Functions Break Memo" showLineNumbers>
{`// ❌ WITHOUT useCallback — child re-renders every time Parent renders
function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // This function is re-created every render = new reference every time
  const handleDelete = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <>
      <input value={name} onChange={e => setName(e.target.value)} />
      {/* ExpensiveList is wrapped in React.memo, BUT... */}
      {/* handleDelete is a new reference → memo check fails → re-renders */}
      <ExpensiveList items={items} onDelete={handleDelete} />
    </>
  );
}

const ExpensiveList = React.memo(({ items, onDelete }) => {
  // This renders 10,000 rows — expensive!
  return items.map(item => (
    <Row key={item.id} item={item} onDelete={onDelete} />
  ));
});`}
      </CodeBlock>

      <CodeBlock language="jsx" title="The Fix: useCallback Stabilizes the Reference" showLineNumbers>
{`// ✅ WITH useCallback — child only re-renders when items actually change
function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // Same reference across renders (until deps change)
  const handleDelete = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []); // Empty deps because functional update doesn't need 'items'

  return (
    <>
      <input value={name} onChange={e => setName(e.target.value)} />
      {/* Now when parent re-renders from typing, handleDelete is the SAME ref */}
      {/* → memo check passes → ExpensiveList skips re-render ✓ */}
      <ExpensiveList items={items} onDelete={handleDelete} />
    </>
  );
}`}
      </CodeBlock>

      <FlowChart
        title="useCallback Props Flow"
        chart={"graph TD\n  A[Parent re-renders] --> B{Is handleDelete the same ref?}\n  B -->|Without useCallback: NO| C[React.memo fails]\n  C --> D[ExpensiveList re-renders - wasted]\n  B -->|With useCallback: YES| E[React.memo passes]\n  E --> F[ExpensiveList skips re-render]\n  style C fill:#5c1a1a,stroke:#ef5350,color:#e0e0e0\n  style D fill:#5c1a1a,stroke:#ef5350,color:#e0e0e0\n  style F fill:#1a3a1a,stroke:#66bb6a,color:#e0e0e0"}
      />

      <InfoBox variant="warning" title="useCallback Is Useless Without React.memo">
        <p>
          If the child component is <strong>not</strong> wrapped in <code>React.memo</code>, <code>useCallback</code> does nothing useful.
          The child will re-render anyway because its parent re-rendered — the stable reference doesn't help if nobody is checking it.
        </p>
        <p><strong>Both halves are required:</strong> <code>useCallback</code> on the parent + <code>React.memo</code> on the child.</p>
      </InfoBox>

      <h3>When to Use useCallback</h3>

      <CodeBlock language="jsx" title="✅ Use It vs ❌ Skip It">
{`// ✅ USE useCallback when:

// 1. Passing a function to a React.memo child
const handleClick = useCallback(() => { ... }, []);
<MemoizedChild onClick={handleClick} />

// 2. Function is a dependency of useEffect/useMemo
const fetchData = useCallback(async () => {
  const res = await fetch(\`/api/users/\${userId}\`);
  return res.json();
}, [userId]);

useEffect(() => {
  fetchData().then(setData);
}, [fetchData]); // fetchData only changes when userId changes

// 3. Function is passed to a context value
const contextValue = useMemo(() => ({
  onSave: handleSave,  // handleSave should be useCallback'd
}), [handleSave]);


// ❌ SKIP useCallback when:

// 1. Passing to a non-memoized child (no one checks the ref)
<RegularChild onClick={() => doThing()} />  // Fine — no memo

// 2. The function is only used locally
const computeTotal = () => items.reduce((sum, i) => sum + i.price, 0);
const total = computeTotal();  // Just call it — no need to memoize

// 3. The function changes every render anyway (all deps change)
const handleChange = useCallback((e) => {
  validate(value, e.target.value);  // 'value' changes every keystroke
}, [value]);  // ← deps change every render → new ref every render → pointless`}
      </CodeBlock>

      <h3>useMemo — Memoizing Values</h3>

      <p>
        <code>useMemo</code> serves two purposes: <strong>skipping expensive computations</strong> and
        <strong>stabilizing object/array references</strong>.
      </p>

      <CodeBlock language="jsx" title="Purpose 1: Expensive Computation" showLineNumbers>
{`function SearchResults({ items, query }) {
  // ❌ Without useMemo: filters + sorts 10,000 items on EVERY render
  const results = items
    .filter(item => item.name.includes(query))
    .sort((a, b) => a.relevance - b.relevance);

  // ✅ With useMemo: only recomputes when items or query change
  const results = useMemo(() => {
    return items
      .filter(item => item.name.includes(query))
      .sort((a, b) => a.relevance - b.relevance);
  }, [items, query]);

  // When parent re-renders for unrelated reasons (e.g., a timer),
  // the memoized version returns the cached result instantly.
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Purpose 2: Referential Stability for Objects/Arrays" showLineNumbers>
{`function Dashboard({ user, permissions }) {
  // ❌ Without useMemo: new object every render
  const config = { theme: 'dark', locale: user.locale };
  // Every child receiving 'config' sees a new reference → breaks memo

  // ✅ With useMemo: same reference until deps change
  const config = useMemo(() => ({
    theme: 'dark',
    locale: user.locale,
  }), [user.locale]);

  // ❌ Without useMemo: new array every render
  const columns = ['name', 'email', 'role'];

  // ✅ With useMemo: same reference (empty deps = never changes)
  const columns = useMemo(() => ['name', 'email', 'role'], []);
  // Or even better — move it OUTSIDE the component:
}`}
      </CodeBlock>

      <h3>useMemo for Context Values — The Critical Pattern</h3>

      <p>
        This is where <code>useMemo</code> has the <strong>highest impact</strong>. Without it, every consumer
        of your context re-renders every time the provider's parent re-renders — even if the actual data hasn't changed.
      </p>

      <CodeBlock language="jsx" title="The Context Object Trap" showLineNumbers>
{`// ❌ THE TRAP: New object every render
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  const login = async (credentials) => { /* ... */ };
  const logout = () => { setUser(null); setPermissions([]); };

  return (
    <AuthContext.Provider value={{
      user,           //  These values might not change...
      permissions,    //  ...but the {} wrapper is NEW every render
      login,          //  And login/logout are new functions too!
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// What happens when AuthProvider's PARENT re-renders:
//   1. AuthProvider re-renders (cascade from parent)
//   2. value={{ ... }} creates a new object reference
//   3. React sees new context value → notifies ALL consumers
//   4. Every useContext(AuthContext) component re-renders
//   5. Even though user, permissions, etc. haven't changed!
//   6. In a big app: 50+ components re-render for NOTHING`}
      </CodeBlock>

      <CodeBlock language="jsx" title="The Fix: useMemo + useCallback" showLineNumbers>
{`// ✅ THE FIX: Stabilize everything
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Stabilize functions with useCallback
  const login = useCallback(async (credentials) => {
    const userData = await authApi.login(credentials);
    setUser(userData.user);
    setPermissions(userData.permissions);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPermissions([]);
  }, []);

  // Stabilize the context value object with useMemo
  const contextValue = useMemo(() => ({
    user,
    permissions,
    login,
    logout,
  }), [user, permissions, login, logout]);
  // ↑ This object only gets a new reference when one of these actually changes

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Now when AuthProvider's parent re-renders:
//   1. AuthProvider re-renders
//   2. useMemo checks deps: user same? permissions same? login same? logout same?
//   3. All same → returns SAME object reference
//   4. React sees same context value → does NOT notify consumers
//   5. Zero unnecessary re-renders ✓`}
      </CodeBlock>

      <FlowChart
        title="Context Value: Unmemoized vs Memoized"
        chart={"graph TD\n  A[Provider parent re-renders] --> B[Provider re-renders]\n  B --> C{Is context value memoized?}\n  C -->|No: value is new object| D[ALL consumers re-render]\n  D --> E[Their children re-render]\n  E --> F[Cascade: 50+ wasted renders]\n  C -->|Yes: useMemo returns same ref| G[React skips notification]\n  G --> H[Zero consumers re-render]\n  style D fill:#5c1a1a,stroke:#ef5350,color:#e0e0e0\n  style F fill:#5c1a1a,stroke:#ef5350,color:#e0e0e0\n  style H fill:#1a3a1a,stroke:#66bb6a,color:#e0e0e0"}
      />

      <h3>When NOT to Memoize</h3>

      <CodeBlock language="jsx" title="Skip Memoization When...">
{`// ❌ Cheap computation — useMemo overhead > computation cost
const fullName = useMemo(() => first + ' ' + last, [first, last]);
const fullName = first + ' ' + last;  // Just compute it. Strings are primitives.

// ❌ Value isn't passed anywhere that checks references
const total = useMemo(() => items.reduce((s, i) => s + i.price, 0), [items]);
// If 'total' is only used in this component's JSX as text, skip it.
// Primitives (numbers) pass Object.is by value anyway.

// ❌ Deps change every render — memoization does nothing
const filtered = useMemo(() => data.filter(predicate), [data, predicate]);
// If 'predicate' is an inline function, it's new every render → cache always misses

// ✅ RULE OF THUMB: Memoize when ALL of these are true:
//   1. The value is an object, array, or function (not a primitive)
//   2. It's passed to something that checks references (memo, deps, context)
//   3. Its deps DON'T change on most renders`}
      </CodeBlock>

      <InteractiveChallenge
        question="You have a function handleSave passed as a prop to a React.memo child. The function uses 'formData' from state which changes on every keystroke. What should you do?"
        options={[
          "Wrap handleSave in useCallback with [formData] as a dep",
          "Use useCallback with [] deps and access formData via a ref",
          "Skip useCallback — the dep changes every render so it's pointless",
          "Remove React.memo from the child instead"
        ]}
        correctIndex={1}
        explanation={"Option A creates a new ref on every keystroke (dep changes), so it's useless. Option C means the child re-renders every time. Option D works but sacrifices optimization. Option B is the correct pattern: store formData in a ref, then useCallback with [] deps reads ref.current at call-time — stable function that always uses the latest data (the useStableCallback pattern we covered earlier)."}
      />

      <h2>Lesser-Known Hooks</h2>

      <CodeBlock language="jsx" title="useId, useSyncExternalStore, useDebugValue" showLineNumbers>
{`// useId — generates stable unique IDs for accessibility (SSR-safe)
function FormField({ label }) {
  const id = useId(); // e.g., ":r1:" — consistent between server/client
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}

// useSyncExternalStore — subscribe to external stores safely
function useWindowWidth() {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener('resize', notify);
      return () => window.removeEventListener('resize', notify);
    },
    () => window.innerWidth,         // client snapshot
    () => 1024                        // server snapshot (SSR fallback)
  );
}

// useDebugValue — label custom hooks in React DevTools
function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  useDebugValue(isOnline ? 'Online' : 'Offline');
  return isOnline;
}

// useImperativeHandle — customize ref exposed to parent
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    scrollIntoView: () => inputRef.current.scrollIntoView(),
    // Don't expose the full DOM node — only what parent needs
  }));
  return <input ref={inputRef} {...props} />;
});`}
      </CodeBlock>

      <h2>Custom Hooks — Composition Pattern</h2>

      <CodeBlock language="jsx" title="Building Custom Hooks" showLineNumbers>
{`// Custom hooks extract reusable stateful logic
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

  return [value, setValue];
}

// Compose hooks together
function useAuthenticatedFetch(url) {
  const { token } = useAuth();           // Another custom hook
  const [state, dispatch] = useReducer(fetchReducer, initialState);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    dispatch({ type: 'START' });

    fetch(url, {
      signal: controller.signal,
      headers: { Authorization: \`Bearer \${token}\` },
    })
      .then(r => r.json())
      .then(data => dispatch({ type: 'SUCCESS', payload: data }))
      .catch(err => {
        if (!controller.signal.aborted)
          dispatch({ type: 'ERROR', payload: err });
      });

    return () => controller.abort();
  }, [url, token]);

  return state;
}`}
      </CodeBlock>

      <h2>useLayoutEffect — Synchronous Post-DOM Effects</h2>

      <p>
        <code>useLayoutEffect</code> has the same signature as <code>useEffect</code>, but it fires
        <strong> synchronously after DOM mutations and before the browser paints</strong>. This gives
        you a window to read layout and make changes without the user ever seeing an intermediate state.
      </p>

      <InfoBox variant="info" title="useLayoutEffect vs useEffect — Timing">
        <p><strong>useEffect</strong> runs asynchronously <em>after</em> the browser paints. This is the default for most side effects — data fetching, subscriptions, logging, etc.</p>
        <p><strong>useLayoutEffect</strong> runs synchronously <em>before</em> the browser paints. Use it when you need to measure or mutate the DOM and the user must never see the pre-adjustment state.</p>
      </InfoBox>

      <FlowChart
        title="Effect Timing in the React Lifecycle"
        chart={"graph TD\n  A[Component Renders] --> B[React commits DOM mutations]\n  B --> C[useLayoutEffect fires - sync, blocks paint]\n  C --> D[Browser paints to screen]\n  D --> E[useEffect fires - async, after paint]"}
      />

      <h3>When to Use useLayoutEffect</h3>

      <InfoBox variant="tip" title="Use useLayoutEffect When...">
        <p><strong>1. Measuring DOM elements</strong> — reading offsetWidth, getBoundingClientRect, scrollHeight before the user sees the layout.</p>
        <p><strong>2. Preventing visual flicker</strong> — dynamically sizing or repositioning an element that would flash at the wrong size/position with useEffect.</p>
        <p><strong>3. Tooltip/popover positioning</strong> — calculating where a tooltip fits on screen and adjusting before paint.</p>
        <p><strong>4. Synchronizing DOM state</strong> — setting scrollTop, focus, or selection range immediately after a DOM update.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Tooltip Positioning with useLayoutEffect" showLineNumbers>
{`function Tooltip({ anchorRef, children }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!anchorRef.current || !tooltipRef.current) return;

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = anchorRect.bottom + 8; // 8px gap below anchor
    let left = anchorRect.left;

    // Prevent going off-screen to the right
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    // Flip above anchor if it would go off-screen below
    if (top + tooltipRect.height > window.innerHeight) {
      top = anchorRect.top - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  }); // Runs every render — always repositions before paint

  return (
    <div
      ref={tooltipRef}
      style={{ position: 'fixed', top: position.top, left: position.left }}
    >
      {children}
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Preventing Layout Flash with useLayoutEffect" showLineNumbers>
{`function AutoHeightTextarea({ value, onChange }) {
  const textareaRef = useRef(null);

  // useEffect here would cause a visible flash:
  // 1. Textarea renders at old height
  // 2. Browser paints the wrong height
  // 3. useEffect fires, corrects height
  // 4. Browser paints again — user sees the flicker!

  // useLayoutEffect prevents this:
  // 1. Textarea renders at old height (in memory)
  // 2. useLayoutEffect fires, corrects height
  // 3. Browser paints ONCE at the correct height
  useLayoutEffect(() => {
    const el = textareaRef.current;
    el.style.height = 'auto'; // Reset to measure natural height
    el.style.height = el.scrollHeight + 'px';
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="useLayoutEffect Blocks Paint">
        <p>Because useLayoutEffect runs synchronously before the browser paints, <strong>slow code inside it will delay the paint and cause visible jank</strong>. Never put data fetching, heavy computation, or long-running tasks inside useLayoutEffect.</p>
        <p>Rule of thumb: if your effect does not need to read or mutate the DOM before paint, use <code>useEffect</code> instead. <code>useEffect</code> is the correct default.</p>
      </InfoBox>

      <h2>useInsertionEffect — For CSS-in-JS Libraries</h2>

      <p>
        <code>useInsertionEffect</code> fires <strong>before DOM mutations</strong> — even before
        useLayoutEffect. It exists specifically for CSS-in-JS libraries like Emotion or styled-components
        to inject <code>&lt;style&gt;</code> tags before any DOM reads happen.
      </p>

      <FlowChart
        title="Complete Effect Timing Order"
        chart={"graph TD\n  A[Component Renders] --> B[useInsertionEffect fires - before DOM mutations]\n  B --> C[React commits DOM mutations]\n  C --> D[useLayoutEffect fires - sync, before paint]\n  D --> E[Browser paints to screen]\n  E --> F[useEffect fires - async, after paint]"}
      />

      <InfoBox variant="note" title="You Almost Never Use useInsertionEffect Directly">
        <p>This hook is designed for library authors building CSS-in-JS solutions. It has no access to refs or state updates. If you are not writing a styling library, you do not need this hook.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="useInsertionEffect — Library-Level Usage" showLineNumbers>
{`// This is what a CSS-in-JS library does internally:
function useCSS(rule) {
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.appendChild(style);
    return () => style.remove();
  }, [rule]);
  // Styles are injected BEFORE any useLayoutEffect reads the DOM,
  // so measurements will include the correct styles.
}`}
      </CodeBlock>

      <h2>useTransition — Non-Urgent State Updates</h2>

      <p>
        <code>useTransition</code> lets you mark state updates as <strong>non-urgent transitions</strong>.
        React will keep the UI responsive to urgent updates like typing while rendering the transition
        in the background. The <code>isPending</code> flag lets you show a loading indicator during
        the transition.
      </p>

      <CodeBlock language="jsx" title="useTransition — Filtering a Large List" showLineNumbers>
{`function FilterableList({ items }) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    // Urgent: update the input immediately so typing feels snappy
    setQuery(value);

    // Non-urgent: filter the large list in a transition
    startTransition(() => {
      const result = items.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(result);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="Search..." />
      {isPending && <p style={{ opacity: 0.6 }}>Updating list...</p>}
      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="useTransition vs useDeferredValue">
        <p><strong>useTransition</strong> — wraps the state-setting code. Use when you control the state update and want to mark it as non-urgent.</p>
        <p><strong>useDeferredValue</strong> — wraps a value you receive as a prop or from a parent. Use when you do not control the state update but want to defer your rendering of it.</p>
      </InfoBox>

      <h2>useDeferredValue — Deferred Rendering Priority</h2>

      <p>
        <code>useDeferredValue</code> accepts a value and returns a deferred copy that lags behind
        during urgent updates. React will first re-render with the old deferred value, then try a
        background re-render with the new value. Unlike debouncing, this is <strong>React-aware</strong> — it
        integrates with concurrent rendering and does not use arbitrary time delays.
      </p>

      <CodeBlock language="jsx" title="useDeferredValue — Search with Deferred Results" showLineNumbers>
{`function SearchResults({ query }) {
  // Expensive render — deferred so typing stays responsive
  const items = computeExpensiveSearch(query);
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}

function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type to search..."
      />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <SearchResults query={deferredQuery} />
      </div>
    </div>
  );
}

// How it differs from debouncing:
// - Debounce: waits a fixed time (e.g., 300ms) regardless of device speed
// - useDeferredValue: React renders as fast as the device allows
//   On fast devices, the lag is almost imperceptible
//   On slow devices, the lag is proportional to render time
//   It is also interruptible — new input cancels stale renders`}
      </CodeBlock>

      <InteractiveChallenge
        question="What happens if you call useState inside a conditional?"
        options={[
          "It works fine but may cause extra re-renders",
          "React throws an error at runtime on the second render if hook order changes",
          "It always throws immediately on first render",
          "It works but DevTools shows a warning"
        ]}
        correctIndex={1}
        explanation="React identifies hooks by their call order (position in the linked list). If a conditional causes a hook to be skipped on a subsequent render, React will try to match hook N with the wrong stored state, resulting in a runtime error: 'Rendered fewer/more hooks than during the previous render.'"
        language="jsx"
        code={"// This will crash on re-render if 'show' changes:\nfunction Bad({ show }) {\n  if (show) {\n    const [val, setVal] = useState(0); // Hook order changes!\n  }\n  const [name, setName] = useState('');\n}"}
      />

      <InteractiveChallenge
        question="You have a tooltip that measures its own width to avoid going off-screen. Which hook should you use?"
        options={[
          "useEffect — it runs after render and can measure the DOM",
          "useLayoutEffect — it measures before paint so the tooltip never flashes in the wrong position",
          "useMemo — memoize the position calculation for performance",
          "useInsertionEffect — it runs earliest so you get the first measurement"
        ]}
        correctIndex={1}
        explanation="useLayoutEffect runs synchronously after DOM mutations but before the browser paints. This lets you measure the tooltip dimensions and reposition it so the user never sees it in the wrong spot. useEffect would cause a visible flash because the browser paints the wrong position first. useInsertionEffect runs before DOM mutations so refs are not yet attached."
        language="jsx"
        code={"useLayoutEffect(() => {\n  const rect = tooltipRef.current.getBoundingClientRect();\n  // Reposition based on measurement — happens before paint\n  setPosition(calculateSafePosition(rect));\n});"}
      />

      <InteractiveChallenge
        question="When should you use useTransition instead of just calling setState directly?"
        options={[
          "Always — it makes every state update faster",
          "When you need to fetch data from an API",
          "When a state update triggers expensive re-rendering and you want to keep the UI responsive to urgent updates like typing",
          "When you want to delay a state update by a fixed number of milliseconds"
        ]}
        correctIndex={2}
        explanation="useTransition marks a state update as non-urgent. React will prioritize urgent updates like typing and render the transition in the background. It is not a general performance tool — it is specifically for keeping the UI responsive when a state update causes expensive rendering. It does not use fixed time delays like debouncing."
        language="jsx"
        code={"const [isPending, startTransition] = useTransition();\n\nconst handleInput = (e) => {\n  setQuery(e.target.value);        // Urgent: input stays snappy\n  startTransition(() => {\n    setFilteredList(filterBigList(e.target.value)); // Non-urgent\n  });\n};"}
      />
    </LessonLayout>
  );
}
