import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';
import LifecycleSimulator from '../../components/LifecycleSimulator';

export default function ReactLifecycleSim() {
  return (
    <LessonLayout
      title="Lifecycle Simulator"
      sectionId="react19"
      lessonIndex={1}
      prev={{ path: '/react19/lifecycle', label: 'Component Lifecycle' }}
      next={{ path: '/react19/hooks', label: 'React Hooks Deep Dive' }}
    >
      <p>This interactive simulator lets you see React lifecycle events fire in real-time. Mount and unmount components, update props and state, and watch the Event Log to understand exactly when each hook and effect runs.</p>

      <FlowChart
        title="Mount Phase Order"
        chart={"graph LR\n  A[Component called - render] --> B[DOM updated]\n  B --> C[useLayoutEffect]\n  C --> D[Browser paint]\n  D --> E[useEffect]"}
      />

      <h2>Interactive Simulator</h2>
      <p>Click the buttons below to trigger lifecycle events. Watch the log to see which hooks fire, in what order, and when cleanup runs.</p>

      <LifecycleSimulator />

      <h2>Key Observations</h2>
      <InfoBox variant="tip" title="Mount Order">
        <p>On mount: render runs first, then useLayoutEffect (synchronously before paint), then useEffect (asynchronously after paint). Both fire on the initial mount.</p>
      </InfoBox>

      <InfoBox variant="info" title="Unmount Cleanup">
        <p>When a component unmounts, its useEffect and useLayoutEffect cleanup functions run. This is where you should cancel subscriptions, clear timers, and abort fetch requests.</p>
      </InfoBox>

      <FlowChart
        title="Update Phase Order"
        chart={"graph LR\n  A[State or prop change] --> B[render called]\n  B --> C[DOM mutations committed]\n  C --> D[Previous useLayoutEffect cleanup]\n  D --> E[useLayoutEffect runs]\n  E --> F[Browser paint]\n  F --> G[Previous useEffect cleanup]\n  G --> H[useEffect runs]"}
      />

      <CodeBlock language="jsx" title="Effect Cleanup Pattern">
{`// Pattern: cleanup in return function prevents stale updates
useEffect(() => {
    let cancelled = false;

    async function loadData() {
        const data = await fetchUser(userId);
        if (!cancelled) {  // guard against stale updates
            setUser(data);
        }
    }

    loadData();

    return () => {
        cancelled = true; // cleanup: mark as cancelled
    };
}, [userId]); // re-run whenever userId changes`}
      </CodeBlock>

      <InteractiveChallenge
        question="In what order do these run after a state update: useEffect, DOM mutation, useLayoutEffect?"
        options={["useEffect → DOM → useLayoutEffect", "DOM → useEffect → useLayoutEffect", "DOM → useLayoutEffect → useEffect", "useLayoutEffect → useEffect → DOM"]}
        correctIndex={2}
        explanation="After a state update: (1) React updates the DOM, (2) useLayoutEffect runs synchronously before the browser paints, (3) browser paints the screen, (4) useEffect runs asynchronously. useLayoutEffect is for DOM measurements; useEffect is for side effects like data fetching."
      />

      <InteractiveChallenge
        question="Why should you return a cleanup function from useEffect?"
        options={["It is optional and has no effect", "To run code on the next render", "To cancel side effects when the component unmounts or before the effect re-runs", "To update state after the effect"]}
        correctIndex={2}
        explanation="The cleanup function runs: (1) before the component unmounts and (2) before the effect runs again due to a dependency change. Without cleanup, you risk memory leaks, stale closures, and double-execution bugs (especially with React StrictMode's double-mount behavior)."
      />
    </LessonLayout>
  );
}
