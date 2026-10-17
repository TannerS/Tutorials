import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function DevtoolsReact() {
  return (
    <LessonLayout
      title="React DevTools & Profiling"
      sectionId="devtools"
      lessonIndex={6}
      prev={{ path: '/devtools/performance', label: 'Performance: Flame Charts & Long Tasks' }}
      next={{ path: '/devtools/field-guide', label: 'DevTools Field Guide' }}
    >
      <p>
        The browser&apos;s own panels show you the DOM and the main thread. Neither knows
        what a component is. React DevTools adds the two tabs that do —{' '}
        <strong>Components</strong> and <strong>Profiler</strong> — and the Profiler is
        the only tool that answers &quot;why did this re-render?&quot; with evidence
        instead of a guess.
      </p>
      <p>
        It is a browser extension, installed separately from DevTools itself. React
        exposes a global hook (<code>__REACT_DEVTOOLS_GLOBAL_HOOK__</code>) that the
        extension attaches to; without the extension installed that global is{' '}
        <code>undefined</code>, which is the quickest way to check whether it is present.
      </p>

      <h2>The Components Tab</h2>
      <CodeBlock language="text" title="What you get per selected component">
{`props          every prop, expandable, EDITABLE — change one and the
               component re-renders immediately. Test an edge case
               without touching the code.

hooks          every hook IN ORDER, with its current value. State is
               editable too. Named by type (State, Effect, Memo, Ref)
               plus the name of any custom hook that owns it.

rendered by    the parent chain — the component "breadcrumb"

source         click to jump to the component's definition in Sources`}
      </CodeBlock>

      <InfoBox variant="tip" title="Four settings to turn on immediately">
        <p>In the Components tab&apos;s gear icon:</p>
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Highlight updates when components render.</strong> Flashes a border
            around each component as it re-renders. Type in one input and watch half the
            page flash — that is your performance problem, visible in five seconds with
            no profiling at all. The single most useful setting here.
          </li>
          <li>
            <strong>Hide components where …</strong> filters out framework wrappers
            (Context providers, <code>Router</code>, memo shells) so the tree is your
            components rather than forty layers of plumbing.
          </li>
          <li>
            <strong>Record why each component rendered.</strong> Required for the
            Profiler&apos;s most valuable feature — see below. It is off by default.
          </li>
          <li>
            <strong>Break on warnings</strong> — pauses the debugger when React logs a
            warning, so you get a stack instead of a console line.
          </li>
        </ul>
      </InfoBox>

      <CodeBlock language="javascript" title="The console bridge, the equivalent of $0">
{`// Select a component in the Components tab, then in the Console:
$r            // the selected component's instance / hooks state

// And the browser's own $0 still works on the DOM node, so you can
// cross-reference the component and the element it produced.`}
      </CodeBlock>

      <h2>The Profiler Tab</h2>
      <p>
        Record, interact, stop — same as the Performance panel, but the unit is a{' '}
        <em>commit</em> (one React render-and-apply) instead of a stack frame.
      </p>

      <CodeBlock language="text" title="The three views">
{`Flamegraph     one bar per component for the SELECTED COMMIT. Width is
               time INCLUDING children. Grey = did not re-render this
               commit. The grey is as informative as the colour.

Ranked         the same commit, sorted by own render time, descending.
               Start here: the top row is the expensive component.

Timeline       every commit across the recording, as a bar chart. Tall
               bars are slow commits; MANY bars for one interaction means
               you are rendering repeatedly when once would do.`}
      </CodeBlock>

      <InfoBox variant="success" title="&quot;Why did this render?&quot; — the feature that pays for the whole tool">
        <p>
          With <em>Record why each component rendered</em> enabled, selecting a component
          in a commit shows the reason, in React&apos;s own words:
        </p>
        <CodeBlock language="text" title="The reasons, and what each one means">
{`"Props changed (items)"        -> a new prop value. If "items" is an
                                  array/object literal recreated in the
                                  parent's render, this fires every time
                                  even when the contents are identical.

"Hooks changed"                -> useState/useReducer/useContext updated.

"The parent component rendered" -> no props or state of its own changed.
                                  This is the one React.memo exists for.

"Context changed"              -> a provider above it published a new
                                  value. A context value built inline
                                  (value={{ a, b }}) is a NEW OBJECT every
                                  render, so every consumer re-renders.

"This is the first time the component rendered" -> mount.`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Those five strings diagnose nearly every React performance problem. Note the
          second and fourth: both are an identity problem, not an amount-of-work problem,
          and both are fixed by stabilising a value rather than by memoising the child.
        </p>
      </InfoBox>

      <h2>A Workflow That Actually Finds Things</h2>
      <CodeBlock language="text" title="In this order">
{`1. Turn on "Highlight updates". Interact.
     -> If components flash that have nothing to do with your action,
        you have found the problem without profiling.

2. Profiler: record ONE interaction. Stop.

3. Timeline: how many commits did one interaction cause?
     -> Many short commits is a different bug from one long commit.
        Many = you are setting state in a loop or in an effect chain.

4. Pick the tallest commit. Switch to Ranked.
     -> The top row is the expensive component.

5. Select it and read "why did this render?"
     -> "The parent component rendered" or "Props changed (x)" where x
        looks identical = an identity problem. Fix the value, not the child.

6. Only now reach for memoisation, and re-record to confirm it helped.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Measure before memoising — and after">
        <p>
          <code>React.memo</code>, <code>useMemo</code> and <code>useCallback</code> are
          not free: each adds a comparison and keeps the previous value alive. Applied
          without evidence they make code harder to read and measurably slower. The
          Profiler is what turns &quot;this feels slow&quot; into &quot;this commit is
          40ms and this component is 32ms of it&quot;.
        </p>
        <p style={{ marginBottom: 0 }}>
          And re-record afterwards. A <code>React.memo</code> on a component whose props
          include an inline arrow or object literal does nothing at all — the comparison
          fails every render and you have added cost for no benefit. See{' '}
          <a href="/react18/performance">Performance &amp; Memoization</a> and{' '}
          <a href="/react-antipatterns/performance">Performance Mistakes</a>.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Two things that will confuse your first recording">
        <p>
          <strong>StrictMode double-renders in development.</strong> Every component
          renders twice on purpose, to surface impure logic. Commit counts and render
          times in dev are therefore not production numbers — use them to find{' '}
          <em>relative</em> cost, not absolute.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Development React is much slower than production React.</strong> The dev
          build carries warnings, prop-type checks and the DevTools hook. Profile the dev
          build to find <em>which</em> component is expensive; never quote a dev timing as
          the real one.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="When to use which profiler">
        <p style={{ marginBottom: 0 }}>
          <strong>React Profiler</strong> for &quot;which component is re-rendering and
          why&quot;. <strong>Browser Performance panel</strong> for &quot;where did the
          50ms go&quot; — it sees everything React&apos;s profiler cannot: layout, paint,
          garbage collection, third-party scripts, and your own non-React code. A slow
          interaction with no expensive commits means the cost is not in rendering at all,
          and only the browser panel will show you that.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
