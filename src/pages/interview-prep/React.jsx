import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function IPReact() {
  return (
    <LessonLayout
      title="React Interview Q&A"
      sectionId="interview-prep"
      lessonIndex={0}
      prev={null}
      next={{ path: '/interview-prep/typescript', label: 'TypeScript Interview Q&A' }}
    >
      <h2>Top 30 React Interview Questions</h2>
      <p>
        Curated answers to the most common React interview questions, from junior to senior level.
        Answers are concise but complete — give the concept, then the why.
      </p>

      <h2>Core Concepts (Questions 1-10)</h2>

      <InfoBox variant="info" title="Q1: What is the Virtual DOM and how does it work?">
        <p>
          The Virtual DOM is an in-memory representation of the real DOM. When state changes, React creates a new
          virtual DOM tree and diffs it against the previous one (reconciliation). Only the changed nodes are
          updated in the real DOM. This batches DOM mutations for efficiency — direct DOM manipulation is expensive,
          but object comparisons in JS are cheap.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q2: What is the difference between controlled and uncontrolled components?">
        <p>
          <strong>Controlled:</strong> React state is the single source of truth. The input value is set from state,
          and onChange updates state. You always know the current value. <br />
          <strong>Uncontrolled:</strong> The DOM manages the value. You access it via a ref when needed (e.g., on submit).
          Simpler for basic forms; harder to validate in real-time.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Controlled vs Uncontrolled">
{`// Controlled
function ControlledInput() {
  const [value, setValue] = useState('')
  return <input value={value} onChange={e => setValue(e.target.value)} />
}

// Uncontrolled
function UncontrolledInput() {
  const ref = useRef()
  const handleSubmit = () => console.log(ref.current.value)
  return <input ref={ref} defaultValue="" />
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Q3: When does a React component re-render?">
        <p>A component re-renders when: (1) its own state changes, (2) its parent re-renders (unless memoized),
        (3) a context it consumes changes. It does NOT re-render when a ref changes.</p>
      </InfoBox>

      <InfoBox variant="info" title="Q4: What is the purpose of the key prop in lists?">
        <p>
          Keys help React identify which list items have changed, been added, or removed. React uses keys to
          match elements between renders. A stable, unique key (like an id) allows React to reuse existing DOM nodes.
          Using array index as key causes bugs when the list is reordered — React reuses the DOM element at position
          0 for a different item, breaking state and focus.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q5: Explain useEffect cleanup. When does it run?">
        <p>
          The cleanup function returned from useEffect runs: (1) before the effect re-runs (when deps change),
          and (2) when the component unmounts. It is used to cancel subscriptions, clear timers, and abort fetch
          requests to prevent memory leaks and state updates on unmounted components.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="useEffect cleanup pattern">
{`useEffect(() => {
  const controller = new AbortController()
  fetch('/api/data', { signal: controller.signal })
    .then(r => r.json())
    .then(setData)
    .catch(err => { if (err.name !== 'AbortError') setError(err) })
  return () => controller.abort()  // cleanup
}, [id])`}
      </CodeBlock>

      <InfoBox variant="info" title="Q6: What is React.memo and when should you use it?">
        <p>
          React.memo wraps a component and memoizes its output. It performs a shallow prop comparison;
          if props have not changed, the component skips re-rendering. Use it when: (1) a component renders
          often, (2) it receives the same props frequently, and (3) the component is computationally expensive.
          Do NOT use it for every component — the comparison has its own cost.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q7: Difference between useMemo and useCallback?">
        <p>
          <code>useMemo</code> memoizes a computed <em>value</em>. <code>useCallback</code> memoizes a <em>function reference</em>.
          Both take a deps array and recompute only when deps change. useCallback(fn, deps) is equivalent to
          useMemo(() =&gt; fn, deps). Use them to prevent unnecessary re-renders of child components that
          receive the memoized value or function as props.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q8: What are React hooks rules?">
        <p>
          (1) Only call hooks at the top level — never inside conditionals, loops, or nested functions.
          (2) Only call hooks from React function components or custom hooks. These rules ensure hooks are
          called in the same order every render, which React requires to preserve state between renders.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q9: What is lifting state up?">
        <p>
          When two components need to share state, move the state to their closest common ancestor.
          The parent holds the state and passes it down as props with a callback to update it.
          This is the React way of sharing state without a state management library.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q10: What is prop drilling and how do you solve it?">
        <p>
          Prop drilling is passing props through multiple intermediary components that do not need them.
          Solutions: (1) React Context API for global/theme state, (2) Component composition
          (children prop / render props) to avoid passing props through intermediaries,
          (3) External state management (Redux, Zustand) for complex global state.
        </p>
      </InfoBox>

      <h2>Hooks Deep Dive (Questions 11-20)</h2>

      <CodeBlock language="jsx" title="Q11-12: useReducer vs useState">
{`// Use useReducer when:
// - State is complex (object with multiple sub-values)
// - Next state depends on previous state in complex ways
// - Multiple state transitions share logic
// - You want to test state logic in isolation

// Use useState when:
// - Simple value: string, number, boolean
// - Independent pieces of state

// Q12: What is the useState initializer function?
// Lazy initialization — runs only on first render
const [state, setState] = useState(() => JSON.parse(localStorage.getItem('data') || '{}'))
// Without the function, JSON.parse runs every render (wasteful)`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Q13: What is batching in React 18?">
{`// React 18: ALL state updates are batched (even in async)
async function handleClick() {
  setCount(c => c + 1)   // \
  setName('Alice')       //  } batched — one re-render
  setFlag(true)          // /
  await fetch('/api')
  setLoading(false)      // also batched in React 18
}

// React 17: only batched inside React event handlers
// setTimeout, fetch callbacks triggered individual re-renders

// Opt out of batching when needed:
import { flushSync } from 'react-dom'
flushSync(() => setCount(c => c + 1))  // immediate re-render`}
      </CodeBlock>

      <InfoBox variant="info" title="Q14: Explain the useRef hook uses">
        <p>
          useRef has two main uses: (1) DOM access — attach to a JSX element with ref= to get the DOM node.
          (2) Mutable value that persists across renders without causing re-renders — like storing
          a previous value, a timer ID, or a flag. Unlike state, changing a ref does not schedule a re-render.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q15: What is React.StrictMode?">
        <p>
          StrictMode is a development tool that helps find bugs. In React 18, it intentionally invokes render
          functions and effects twice to expose side effects in the setup phase. If your component or effect
          breaks when run twice, it has impure behavior. It does not affect production builds.
        </p>
      </InfoBox>

      <h2>Performance and Patterns (Questions 16-25)</h2>

      <CodeBlock language="jsx" title="Q16: How do you optimize a slow React app?">
{`// Profile first — React DevTools Profiler
// 1. Identify slow components
// 2. Memoize expensive computations: useMemo
// 3. Memoize stable callbacks: useCallback
// 4. Wrap heavy child components: React.memo
// 5. Virtualize long lists: react-window or react-virtual
// 6. Code split heavy routes: React.lazy + Suspense
// 7. Defer non-urgent updates: useDeferredValue / useTransition
// 8. Consider React Compiler (experimental) for automatic memoization`}
      </CodeBlock>

      <InfoBox variant="info" title="Q17: What is Suspense and what does it solve?">
        <p>
          Suspense lets components declare a loading state while they wait for something (data, lazy component).
          It eliminates the need for manual loading state management. React.lazy + Suspense handles code splitting.
          React 19's use() hook extends Suspense to work with any Promise in render.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q18: What are Server Components in React 19?">
        <p>
          Server Components render on the server and send HTML (not JS) to the client. They can access
          databases, file systems, and APIs directly without API round trips. They reduce the client-side
          JS bundle. Client Components (with {'use client'} directive) maintain interactivity.
          The key rule: Server Components cannot use state, effects, or browser APIs.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q19: Explain compound components pattern">
        <p>
          Compound components use context to share state between related components without explicit prop passing.
          Example: Tab, TabList, TabPanel share the active tab state via context.
          The parent component provides the state; children consume it implicitly.
          This allows flexible, composable APIs (like HTML select + option).
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q20: What is the difference between useLayoutEffect and useEffect?">
        <p>
          Both run after render. <code>useEffect</code> runs asynchronously (after browser has painted).
          <code>useLayoutEffect</code> runs synchronously after DOM mutations but before the browser paints.
          Use useLayoutEffect only for: measuring DOM elements, synchronizing DOM reads/writes to prevent flicker.
          In all other cases, prefer useEffect (it does not block painting).
        </p>
      </InfoBox>

      <h2>Advanced Questions (21-30)</h2>

      <CodeBlock language="jsx" title="Q21: Custom hooks — when and why?">
{`// Extract stateful logic for reuse and testability
// Custom hooks MUST start with "use"

// Before: logic scattered across components
// After: encapsulated, testable, reusable

function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initialValue }
    catch { return initialValue }
  })
  const setValue = (value) => {
    setStored(value)
    localStorage.setItem(key, JSON.stringify(value))
  }
  return [stored, setValue]
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Q22: What is reconciliation and the diffing algorithm?">
        <p>
          Reconciliation is React's process of updating the DOM efficiently. The diffing algorithm works by:
          (1) If element type changes, unmount old tree, mount new. (2) Same type — update changed props only.
          (3) For lists, use keys to match elements across renders. The algorithm is O(n) rather than O(n³)
          because it only compares elements at the same tree level.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Q23-25: Fiber, Concurrent Mode, and Transitions">
        <p>
          <strong>React Fiber</strong> is the reconciliation engine introduced in React 16. It breaks rendering into
          units of work that can be paused, resumed, or aborted. This enables concurrent features.
          <strong>Concurrent Mode</strong> allows React to prepare multiple UIs simultaneously, prioritizing urgent
          updates (typing) over less urgent ones (data loading).
          <strong>useTransition</strong> marks state updates as non-urgent, keeping the UI responsive.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What happens when you update state to the same value in React?"
        options={[
          "React always re-renders regardless of value",
          "React bails out and skips re-rendering (uses Object.is comparison)",
          "React throws a warning about unnecessary updates",
          "React schedules an update but defers it indefinitely"
        ]}
        correctIndex={1}
        explanation="React uses Object.is() to compare the new state value to the current one. If they are the same (by reference for objects/arrays, by value for primitives), React bails out and does not re-render the component or its children. This is why mutating state directly (instead of creating new objects) fails — the reference stays the same so React sees no change."
      />

      <InteractiveChallenge
        question="Why should you avoid defining components inside other components?"
        options={[
          "It causes infinite loops in the rendering cycle",
          "The inner component is recreated as a new type every render, forcing full unmount/remount and losing state",
          "React does not support nested component definitions",
          "It prevents the React DevTools from profiling correctly"
        ]}
        correctIndex={1}
        explanation="When you define a component inside another component, a new function reference is created on every render. React compares element types using reference equality — since the type changes every render, React treats it as a completely different component, unmounts the old one, and mounts a new one. This destroys state, breaks focus, and causes performance issues. Always define components at the module level."
      />
    </LessonLayout>
  );
}
