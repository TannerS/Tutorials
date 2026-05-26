import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';
import LifecycleSimulator from '../../components/LifecycleSimulator';

export default function LifecycleSim() {
  return (
    <LessonLayout
      title="🧪 Lifecycle Simulator"
      sectionId="react19"
      lessonIndex={1}
      prev={{ path: '/react19/lifecycle', label: 'Component Lifecycle' }}
      next={{ path: '/react19/hooks', label: 'Hooks Deep Dive' }}
    >
      {/* ── Introduction ── */}
      <p>
        This is a <strong>live, interactive lifecycle simulator</strong>. Mount
        and unmount components, toggle state, change props — and watch every
        hook fire in real-time in the log panel.
      </p>
      <p>
        The best way to internalize React&apos;s execution order is to
        <em> see it happen</em>. No amount of reading replaces direct
        observation.
      </p>

      <InfoBox variant="tip" title="How to Use the Simulator">
        Click <strong>Mount Child</strong> first, then try updating state and
        props. Watch the log panel to see exactly when each hook fires. Pay
        attention to the order — it tells you everything about React&apos;s
        render and commit phases.
      </InfoBox>

      {/* ── The Interactive Simulator ── */}
      <h2>Interactive Simulator</h2>
      <LifecycleSimulator />

      {/* ── Guided Walkthrough ── */}
      <h2>Guided Walkthrough — Follow Along Step by Step</h2>
      <p>
        Work through each step below <strong>in order</strong>, using the
        simulator above. After each action, compare the log output with the
        expected output shown here. This is a hands-on lab — you learn by doing.
      </p>

      <h3>Step 1: Mount Your First Child</h3>
      <InfoBox variant="note" title="Action: Click Mount Child">
        Click the <strong>Mount Child</strong> button in the simulator. This
        creates a new ChildDemo component. Watch the log panel carefully.
      </InfoBox>
      <CodeBlock language="text" title="Expected Log Output">
        {"🔄 [ChildDemo A] Render (value=0)\n🧮 [ChildDemo A] useMemo computed: VALUE=0\n📐 [ChildDemo A] useLayoutEffect [mount]\n✅ [ChildDemo A] useEffect [mount]"}
      </CodeBlock>
      <InfoBox variant="info" title="What Just Happened?">
        React renders the component first — this is the <strong>render phase</strong>,
        where the component function runs and useMemo computes. Then in the{' '}
        <strong>commit phase</strong>, useLayoutEffect fires synchronously
        BEFORE the browser paints, and useEffect fires AFTER paint. The order
        is always: render → memo → layoutEffect → paint → effect.
      </InfoBox>

      <h3>Step 2: Update Parent State</h3>
      <InfoBox variant="note" title="Action: Click Update Parent">
        Click the <strong>Update Parent</strong> button. This increments the
        parent&apos;s count state. Watch how it affects the child.
      </InfoBox>
      <CodeBlock language="text" title="Expected Log Output">
        {"🔄 [Parent] Render (count=1)\n🔄 [ChildDemo A] Render (value=0)\n📐 [Parent] useLayoutEffect [update] count=1\n📐 [ChildDemo A] useLayoutEffect [update]\n📦 [Parent] useEffect [update] count=1"}
      </CodeBlock>
      <InfoBox variant="warning" title="Key Insight: Unnecessary Re-renders">
        The CHILD re-renders even though its props did not change! This is
        React&apos;s default behavior — <strong>ALL children re-render when
        a parent re-renders</strong>, unless wrapped in React.memo. This is
        one of the most common performance pitfalls in React applications.
      </InfoBox>

      <h3>Step 3: Update Child Props</h3>
      <InfoBox variant="note" title="Action: Click Update Child Props">
        Click the <strong>Update Child Props</strong> button. This changes the
        value prop passed to ChildDemo A. Watch for the useMemo recomputation.
      </InfoBox>
      <CodeBlock language="text" title="Expected Log Output">
        {"🔄 [ChildDemo A] Render (value=1)\n🧮 [ChildDemo A] useMemo computed: VALUE=1\n📐 [ChildDemo A] useLayoutEffect [update]\n✅ [ChildDemo A] useEffect [update]"}
      </CodeBlock>
      <InfoBox variant="tip" title="Key Insight: useMemo Dependency Tracking">
        Notice the 🧮 emoji — useMemo recomputed because its dependency (value)
        changed. If value had stayed the same, useMemo would have returned the
        cached result and you would NOT see the 🧮 line. This is how React
        optimizes expensive computations.
      </InfoBox>

      <h3>Step 4: Unmount the Child</h3>
      <InfoBox variant="note" title="Action: Click Unmount Child">
        Click the <strong>Unmount Child</strong> button. Watch the cleanup
        functions fire — pay attention to the ORDER.
      </InfoBox>
      <CodeBlock language="text" title="Expected Log Output">
        {"🧹 [ChildDemo A] useEffect cleanup\n🧹 [ChildDemo A] useLayoutEffect cleanup"}
      </CodeBlock>
      <InfoBox variant="warning" title="Key Insight: Cleanup Order">
        Cleanup runs in this order: useEffect cleanup first, then useLayoutEffect
        cleanup. This is the reverse of the mount order. React tears down effects
        in the opposite sequence from how it set them up — ensuring each cleanup
        can safely reference the DOM state left by the previous cleanup.
      </InfoBox>

      <h3>Step 5: Mount Two Children, Then Update Parent</h3>
      <InfoBox variant="note" title="Action: Mount Child, Toggle 2nd Child, Then Update Parent">
        First click <strong>Mount Child</strong>, then click{' '}
        <strong>Toggle 2nd Child</strong> to mount ChildDemo B. Then click{' '}
        <strong>Update Parent</strong>. Watch how effects from both children
        interleave in the log.
      </InfoBox>
      <CodeBlock language="text" title="Expected Log Output">
        {"🔄 [Parent] Render (count=1)\n🔄 [ChildDemo A] Render (value=0)\n🔄 [ChildDemo B] Render (value=0)\n📐 [ChildDemo A] useLayoutEffect [update]\n📐 [ChildDemo B] useLayoutEffect [update]\n📐 [Parent] useLayoutEffect [update] count=1\n📦 [Parent] useEffect [update] count=1"}
      </CodeBlock>
      <InfoBox variant="info" title="Key Insight: Bottom-Up Effect Processing">
        React processes effects <strong>bottom-up</strong> — children before
        parent. Both ChildDemo A and ChildDemo B fire their effects before the
        Parent. This guarantees that when a parent effect runs, all child effects
        have already completed.
      </InfoBox>

      <h3>Step 6: Force Re-render</h3>
      <InfoBox variant="note" title="Action: Click Force Re-render With a Child Mounted">
        Make sure a child is mounted, then click <strong>Force Re-render</strong>.
        Watch the log — you will see render phase output but NO mount effects.
      </InfoBox>
      <CodeBlock language="text" title="Expected Log Output">
        {"🔄 [Parent] Render (count=1)\n🔄 [ChildDemo A] Render (value=0)\n📐 [Parent] useLayoutEffect [update] count=1\n📐 [ChildDemo A] useLayoutEffect [update]"}
      </CodeBlock>
      <InfoBox variant="tip" title="Key Insight: Re-render vs Mount">
        Force re-render triggers the render phase for all components, but only
        update effects fire — not mount effects. React knows the component is
        already mounted, so it runs the update path. Effects with unchanged
        dependencies will not re-execute at all.
      </InfoBox>

      {/* ── Observation Challenges ── */}
      <InfoBox variant="question" title="Observation Challenges">
        <p>
          Try to answer these questions by experimenting with the simulator.
          Each one reveals an important detail about React&apos;s behavior:
        </p>
        <ol>
          <li>
            <strong>What happens if you update parent state 3 times
            quickly?</strong> Do you see 3 separate render cycles or does
            React batch them into one?
          </li>
          <li>
            <strong>Does the child&apos;s useEffect cleanup run when the
            PARENT updates?</strong> Yes — because useEffect re-runs on
            every render by default if no deps array is specified, and cleanup
            runs before each re-execution.
          </li>
          <li>
            <strong>What&apos;s the time gap between useLayoutEffect and
            useEffect in the timestamps?</strong> That gap represents the
            browser paint time — the moment the user actually sees the update.
          </li>
          <li>
            <strong>When you update child props, does useMemo
            recompute?</strong> Yes — because the value dependency changed.
            Watch for the 🧮 emoji in the log.
          </li>
          <li>
            <strong>What happens to ChildDemo B&apos;s effects when you
            unmount ChildDemo A?</strong> Nothing — ChildDemo B is independent.
            Only ChildDemo A&apos;s cleanup fires.
          </li>
        </ol>
      </InfoBox>

      {/* ── Understanding the Log Output ── */}
      <h2>Understanding the Log Output</h2>
      <p>
        The log panel shows the precise order of operations React performs.
        Here are the three key flows you&apos;ll observe:
      </p>

      <FlowChart
        title="Mount Order"
        chart={"graph TD\n  A[Component Function Called] --> B[Render Phase - Pure]\n  B --> C[React Diffs Virtual DOM]\n  C --> D[Commit Phase Begins]\n  D --> E[DOM Updated]\n  E --> F[useLayoutEffect Fires]\n  F --> G[Browser Paints Screen]\n  G --> H[useEffect Fires]"}
      />

      <FlowChart
        title="Unmount Order"
        chart={"graph TD\n  A[Unmount Triggered] --> B[useEffect Cleanup Runs]\n  B --> C[useLayoutEffect Cleanup Runs]\n  C --> D[Component Removed from DOM]"}
      />

      <FlowChart
        title="Re-render / Update Order"
        chart={"graph TD\n  A[State or Props Change] --> B[Render Phase - Recompute]\n  B --> C[useMemo Recomputes if deps changed]\n  C --> D[Diff Virtual DOM]\n  D --> E[Commit Phase]\n  E --> F[Previous useLayoutEffect Cleanup]\n  F --> G[useLayoutEffect Fires]\n  G --> H[Browser Paints]\n  H --> I[Previous useEffect Cleanup]\n  I --> J[useEffect Fires]"}
      />

      {/* ── Key Takeaways ── */}
      <h2>Key Takeaways</h2>
      <InfoBox variant="success" title="What to Remember">
        <ul>
          <li>
            <strong>Render phase runs FIRST and is pure</strong> — no side
            effects allowed here.
          </li>
          <li>
            <strong>useLayoutEffect fires BEFORE the browser paints</strong> —
            use it for DOM measurements and synchronous adjustments.
          </li>
          <li>
            <strong>useEffect fires AFTER paint</strong> — this is the default
            choice for most side effects like data fetching and subscriptions.
          </li>
          <li>
            <strong>Cleanup functions run BEFORE the next effect</strong>, not
            after the component is gone.
          </li>
          <li>
            <strong>Parent effects fire AFTER child effects</strong> —
            React processes the tree bottom-up during the commit phase.
          </li>
        </ul>
      </InfoBox>

      {/* ── Common Misconceptions ── */}
      <h2>Common Misconceptions</h2>
      <InfoBox variant="warning" title="Things Developers Get Wrong">
        <ul>
          <li>
            <strong>&quot;useEffect fires on mount&quot;</strong> — Yes, but it
            fires <em>after</em> paint, not immediately. If you need something
            synchronous before paint, use useLayoutEffect.
          </li>
          <li>
            <strong>&quot;Cleanup runs on unmount&quot;</strong> — It also runs
            before <em>every</em> re-execution of the effect, not just on
            unmount.
          </li>
          <li>
            <strong>&quot;Render means DOM update&quot;</strong> — No! The render
            phase is pure computation. DOM updates happen in the commit phase.
          </li>
          <li>
            <strong>&quot;Effects fire top-down&quot;</strong> — No! Child
            effects fire before parent effects. React commits bottom-up.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="note" title="Next Steps">
        Once you&apos;re comfortable with the lifecycle order, move on to the{' '}
        <strong>Hooks Deep Dive</strong> to understand how each hook leverages
        these phases internally.
      </InfoBox>
    </LessonLayout>
  );
}
