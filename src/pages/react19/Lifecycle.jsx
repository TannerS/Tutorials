import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactLifecycle() {
  return (
    <LessonLayout
      title="Component Lifecycle"
      sectionId="react19"
      lessonIndex={0}
      prev={null}
      next={{ path: "/react19/lifecycle-sim", label: "Lifecycle Simulator" }}
    >
      <p>Understanding when React renders, commits, and cleans up is fundamental to writing correct, performant React applications. React 19 has two distinct phases.</p>

      <FlowChart
        title="React Render and Commit Phases"
        chart={"graph TD\n  A[State/Prop Change] --> B[Render Phase]\n  B --> C[Reconciliation - VDOM diff]\n  C --> D[Commit Phase]\n  D --> E[DOM mutations]\n  E --> F[useLayoutEffect runs sync]\n  F --> G[Browser paint]\n  G --> H[useEffect runs async]"}
      />

      <h2>Class Lifecycle vs Hook Equivalents</h2>
      <CodeBlock language="jsx" title="Class vs Hooks Comparison">
{`// CLASS COMPONENT                    // HOOK EQUIVALENT
// ─────────────────────────────────────────────────────
// constructor(props)                 // useState initial value
// componentDidMount()                // useEffect(() => {}, [])
// componentDidUpdate(prev)           // useEffect(() => {}, [dep])
// componentWillUnmount()             // useEffect cleanup return
// shouldComponentUpdate()            // React.memo + useMemo
// getDerivedStateFromProps()         // useMemo/useEffect
// getSnapshotBeforeUpdate()          // useLayoutEffect

// Hooks version of a typical class lifecycle:
function MyComponent({ userId }) {
    const [user, setUser] = useState(null);

    // componentDidMount + componentDidUpdate for userId changes
    useEffect(() => {
        let cancelled = false;
        fetchUser(userId).then(data => {
            if (!cancelled) setUser(data);
        });
        // componentWillUnmount equivalent
        return () => { cancelled = true; };
    }, [userId]);

    if (!user) return <div>Loading...</div>;
    return <div>{user.name}</div>;
}`}
      </CodeBlock>

      <h2>Render Phase</h2>
      <p>During the render phase, React calls your component function (or render method) to determine what the UI should look like. This phase is <strong>pure</strong> — no side effects, no DOM mutations, no subscriptions.</p>

      <CodeBlock language="jsx" title="What Triggers a Re-render">
{`function Counter() {
    const [count, setCount] = useState(0); // 1. state changes
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(c => c + 1)}>+</button>
        </div>
    );
}

// Re-renders are triggered by:
// 1. setState / dispatch (state change)
// 2. Parent re-renders with new props
// 3. Context value changes
// 4. forceUpdate (class components)

// React 19 batches ALL state updates automatically:
function handleClick() {
    setCount(c => c + 1); // React 19: batched together
    setName("Alice");      // single re-render
    setAge(25);            // not three separate renders
}`}
      </CodeBlock>

      <h2>Strict Mode</h2>
      <CodeBlock language="jsx" title="StrictMode Behavior">
{`// StrictMode intentionally double-invokes:
// - Component render functions
// - State initializer functions
// - Reducer functions
// This helps detect side effects in the render phase

// In development only, React also:
// - Mounts → unmounts → remounts components
// to verify effects clean up properly

// This is why you might see effects run twice in dev:
useEffect(() => {
    console.log("effect ran"); // appears twice in dev with StrictMode
    const sub = subscribe();
    return () => sub.unsubscribe(); // cleanup must be correct!
}, []);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Pure Render Rule">
        <p>Component functions must be pure — given the same props and state, they must return the same JSX. Never perform side effects (fetch, setTimeout, DOM mutations) directly in the render body. Use useEffect for side effects.</p>
      </InfoBox>

      <InteractiveChallenge
        question="In which phase does React update the DOM?"
        options={["Render phase", "Commit phase", "Effect phase", "Reconciliation phase"]}
        correctIndex={1}
        explanation="The commit phase is when React applies the calculated changes to the actual DOM. The render phase is pure computation (no DOM changes). useLayoutEffect runs synchronously after DOM updates in the commit phase. useEffect runs asynchronously after the browser paints."
      />

      <InteractiveChallenge
        question="Why does React StrictMode run effects twice in development?"
        options={["Bug in React", "To detect side effects in the render phase and verify effect cleanup is correct", "Performance optimization", "Required for concurrent features"]}
        correctIndex={1}
        explanation="StrictMode mounts → unmounts → remounts components in development to ensure your effects properly clean up and do not cause issues when React needs to remount (which happens in concurrent mode features like Suspense)."
      />
    </LessonLayout>
  );
}
