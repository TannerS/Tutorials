import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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
        output shown here. This is a hands-on lab — you learn by doing.
      </p>

      <h3>Step 1: Mount Your First Child</h3>
      <InfoBox variant="note" title="Action: Click Mount Child">
        Click the <strong>Mount Child</strong> button in the simulator. This
        creates a new child component, labelled <code>Child A</code> in the simulator. Watch the log panel carefully.
      </InfoBox>
      <CodeBlock language="text" title="Log Output — the lines to look for">
        {"🔄 Child A: Render phase (prop: 0, renders: 1)\n🧮 Child A: useMemo computed (value × 2)\n📐 Child A: useLayoutEffect\n✅ Child A: useEffect [mounted]\n📦 Child A: useEffect [prop changed → 0]"}
      </CodeBlock>
      <InfoBox variant="info" title="What Just Happened?">
        React renders the component first — this is the <strong>render phase</strong>,
        where the component function runs and useMemo computes. Then in the{' '}
        <strong>commit phase</strong>, useLayoutEffect fires synchronously
        BEFORE the browser paints, and both useEffects fire AFTER paint, in the
        order they were declared. The order is always: render → memo →
        layoutEffect → paint → effects.
      </InfoBox>
      <InfoBox variant="note" title="Compare the ordering, not the exact text">
        Mounting a child also re-renders the parent that owns the toggle, so you
        will see a <code>🔄 Parent: Render phase</code> line mixed in, and any
        children already on screen will log their own re-render. That is normal.
        What matters in every step below is the <strong>relative order</strong> of
        the emoji-tagged phases, not a line-for-line match with the block shown.
      </InfoBox>

      <h3>Step 2: Update Parent State</h3>
      <InfoBox variant="note" title="Action: Click Update Parent">
        Click the <strong>Update Parent</strong> button. This increments the
        parent&apos;s count state. Watch how it affects the child.
      </InfoBox>
      <CodeBlock language="text" title="Log Output — the lines to look for">
        {"🔄 Parent: Render phase (count: 1)\n🔄 Child A: Render phase (prop: 0, renders: 2)\n🧹 Parent: cleanup [count effect]\n📦 Parent: useEffect [count changed → 1]"}
      </CodeBlock>
      <InfoBox variant="tip" title="Why only ONE effect re-fired">
        Both components re-rendered, but the only effect that ran again is the
        one whose dependency actually changed — Parent&apos;s{' '}
        <code>useEffect(..., [count])</code>. Every other effect in the
        simulator depends on values that are stable across renders, so React
        skipped them. Notice the cleanup fires <em>before</em> the re-run: React
        always tears down the previous effect before running the next one.
        <br /><br />
        This is the single most useful thing in this lab: <strong>re-rendering
        and re-running effects are different events.</strong> A component can
        re-render many times without a single effect firing.
      </InfoBox>
      <InfoBox variant="warning" title="Key Insight: Unnecessary Re-renders">
        The CHILD re-renders even though its props did not change! This is
        React&apos;s default behavior — <strong>ALL children re-render when
        a parent re-renders</strong>, unless wrapped in React.memo. This is
        one of the most common performance pitfalls in React applications.
      </InfoBox>

      <h3>Step 3: Update Child Props</h3>
      <InfoBox variant="note" title="Action: Click Update Child Props">
        Click the <strong>Update Child Props</strong> button. This changes the
        value prop passed to Child A. Watch for the useMemo recomputation.
      </InfoBox>
      <CodeBlock language="text" title="Log Output — the lines to look for">
        {"🔄 Parent: Render phase (count: 0)\n🔄 Child A: Render phase (prop: 1, renders: 2)\n🧮 Child A: useMemo computed (value × 2)\n🧹 Child A: cleanup [prop effect]\n📦 Child A: useEffect [prop changed → 1]"}
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
      <CodeBlock language="text" title="Log Output — the lines to look for">
        {"🧹 Child A: layoutEffect cleanup\n🧹 Child A: cleanup [unmounting]\n🧹 Child A: cleanup [prop effect]"}
      </CodeBlock>
      <InfoBox variant="warning" title="Key Insight: Cleanup Order">
        <strong>useLayoutEffect cleanup runs first, then the useEffect
        cleanups.</strong> That is the same relative order as mount, not the
        reverse of it — and the reason is the same in both directions: layout
        effects are synchronous parts of the commit, while passive effects are
        flushed separately afterwards.
        <br /><br />
        On unmount React runs the layout cleanup synchronously while it is
        tearing the node out of the DOM, so anything measuring or mutating
        layout is undone before the browser can paint a half-removed UI. The
        passive cleanups — cancelling a fetch, clearing a timer, closing a
        socket — run just after, because nothing visual depends on them.
        Within each group, cleanups run in the order the effects were declared.
      </InfoBox>

      <h3>Step 5: Mount Two Children, Then Update Parent</h3>
      <InfoBox variant="note" title="Action: Mount Child, Toggle 2nd Child, Then Update Parent">
        First click <strong>Mount Child</strong>, then click{' '}
        <strong>Toggle 2nd Child</strong> to mount Child B. Then click{' '}
        <strong>Update Parent</strong>. Watch how effects from both children
        interleave in the log.
      </InfoBox>
      <CodeBlock language="text" title="Log Output — the lines to look for">
        {"🔄 Parent: Render phase (count: 1)\n🔄 Child A: Render phase (prop: 0, renders: 2)\n🔄 Child B: Render phase (prop: 10, renders: 2)\n🧹 Parent: cleanup [count effect]\n📦 Parent: useEffect [count changed → 1]"}
      </CodeBlock>
      <InfoBox variant="info" title="Key Insight: Three renders, one effect">
        All three components re-render, and again only the one effect whose
        dependency changed actually runs. Both children re-render purely because
        their parent did.
      </InfoBox>
      <InfoBox variant="note" title="Seeing bottom-up ordering for yourself">
        React does process effects <strong>bottom-up</strong> — a child&apos;s
        effects complete before its parent&apos;s, so a parent effect can rely on
        every child having finished. This step won&apos;t show it, because the
        children&apos;s effect dependencies don&apos;t change here.
        <br /><br />
        To watch it happen, use <strong>Mount Child</strong> and{' '}
        <strong>Toggle 2nd Child</strong> instead: on mount every effect runs for
        the first time, and you&apos;ll see each child&apos;s{' '}
        <code>📐</code> and <code>✅</code> lines land before the parent&apos;s.
      </InfoBox>

      <h3>Step 6: Force Re-render</h3>
      <InfoBox variant="note" title="Action: Click Force Re-render With a Child Mounted">
        Make sure a child is mounted, then click <strong>Force Re-render</strong>.
        Watch the log — you will see render phase output but NO mount effects.
      </InfoBox>
      <CodeBlock language="text" title="Log Output — the lines to look for">
        {"🔄 Parent: Render phase (count: 0)\n🔄 Child A: Render phase (prop: 0, renders: 3)"}
      </CodeBlock>
      <InfoBox variant="tip" title="Key Insight: Re-render vs Mount — and vs Effects">
        This is the purest demonstration in the lab: <strong>render lines only,
        and not one effect</strong>. Nothing changed except React being told to
        render again, so every dependency array is identical to last time and
        React skips every effect. The render counter still climbs, proving the
        components really did re-render.
        <br /><br />
        Three distinct things are easy to conflate — this step separates them:
        a component <em>re-rendering</em>, a component <em>mounting</em>, and an
        effect <em>re-running</em>. Only the first happened here.
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
            <strong>What happens to Child B&apos;s effects when you
            unmount Child A?</strong> Nothing — Child B is independent.
            Only Child A&apos;s cleanup fires.
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
