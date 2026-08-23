import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Profiling() {
  return (
    <LessonLayout
      title="Profiling React Apps in the Browser"
      sectionId="react18"
      lessonIndex={7}
      prev={{ path: '/react18/performance', label: 'Performance & Memoization' }}
      next={{ path: '/react18/server', label: 'Server Components & Actions' }}
    >
      <p>
        Never guess at performance problems. Profile first, optimize second. There are two
        tools you will use: the <strong>React DevTools Profiler</strong> for component-level
        render analysis, and the <strong>Chrome DevTools Performance tab</strong> for
        frame-level browser analysis. They answer different questions — use both.
      </p>

      <InfoBox variant="note" title="Step 0 — Install React DevTools">
        <p>
          Install the <strong>React Developer Tools</strong> browser extension (available for
          Chrome and Firefox — search "React Developer Tools" in the extension store). After
          installing, two new tabs appear in DevTools: <strong>Components</strong> and{' '}
          <strong>Profiler</strong>.
        </p>
        <p style={{ marginBottom: 0 }}>
          Open your app, press <strong>F12</strong> (or right-click → Inspect), and look for
          those tabs. If they don't appear, make sure you're running the app in{' '}
          <strong>development mode</strong> — the extension works in production but shows
          much less detail.
        </p>
      </InfoBox>

      {/* ── TOOL 1: React DevTools Profiler ── */}
      <h2>Tool 1: React DevTools Profiler</h2>
      <p>
        The Profiler records which components rendered, how long each took, and exactly why
        they rendered. This is your primary tool for finding unnecessary re-renders and
        slow components.
      </p>

      <h3>Step 1 — Enable "Record why each component rendered"</h3>
      <p>
        This setting is off by default and makes the Profiler dramatically more useful.
        Turn it on before recording anything.
      </p>
      <CodeBlock language="text" title="How to enable it">
{`1. Open DevTools → click the "Profiler" tab
2. Click the ⚙️ gear icon in the top-right corner of the Profiler panel
3. Check the box: "Record why each component rendered while profiling"
4. Close the settings panel`}
      </CodeBlock>

      <h3>Step 2 — Record a Session</h3>
      <CodeBlock language="text" title="Recording steps">
{`1. Navigate to the page or feature you want to investigate
2. Click the ● (record) button — top-left of the Profiler tab
   The button turns red to confirm recording is active
3. Perform the interaction you think is slow:
   click a button, type in a field, open a modal, scroll
4. Click ● again to stop
5. The Profiler renders the recorded session — this is what you analyze`}
      </CodeBlock>

      <InfoBox variant="tip" title="Keep recordings short and focused">
        Record one specific interaction per session — not the entire page lifecycle.
        A focused 2-second recording of one button click is easier to analyze than a
        30-second recording of everything. If you have multiple suspects, profile them
        separately.
      </InfoBox>

      <h3>Step 3 — Read the Flamegraph</h3>
      <p>
        The flamegraph is a horizontal bar chart where each bar is one component, arranged
        in a tree matching your component hierarchy. Width represents render time.
      </p>
      <CodeBlock language="text" title="Annotated flamegraph example">
{`App ████████████████████████████ 12ms     ← wide = slow, investigate
  Header ██ 0.8ms
  TodoList ████████████████ 8.4ms          ← second priority
    TodoItem ████ 0.3ms  (×24 items)       ← 24 renders × 0.3ms = all re-rendered
    TodoItem ████ 0.3ms
    TodoItem ████ 0.3ms
    ...
  Footer  (gray — did not render)          ← gray = skipped, React.memo working

Color guide:
  Yellow/Orange  rendered, took notable time    → look here
  Gray           skipped this commit            → memoization working ✓
  Teal/Blue      rendered, completed quickly`}
      </CodeBlock>

      <InfoBox variant="tip" title="What to look for in the flamegraph">
        <ul style={{ marginBottom: 0 }}>
          <li><strong>Wide yellow bars</strong> — this component's render function is slow. Click it to see the call stack and why it rendered.</li>
          <li><strong>Many identical bars</strong> — every item in a list re-rendered (e.g., 24 TodoItems all re-rendered when one changed). Usually fixed with <code>React.memo</code>.</li>
          <li><strong>Gray bars</strong> — component was skipped. This is the goal — the more gray the better.</li>
          <li><strong>Wide bar near the root</strong> — a parent re-rendered and dragged everything below it. Fix the parent before touching children.</li>
        </ul>
      </InfoBox>

      <h3>Step 4 — Check "Why Did This Render?"</h3>
      <p>
        Click any bar in the flamegraph. The right panel shows the render duration and —
        because you enabled the setting in Step 1 — the exact reason it rendered.
      </p>
      <CodeBlock language="text" title="Example: clicking on TodoList">
{`Component: TodoList
Self duration: 8.4ms

Why did this render?
  Props changed:
    items      [prev: Array(5), next: Array(5)]  ← same length, new reference!
    onToggle   [prev: ƒ, next: ƒ]               ← new function created every render

What this tells you:
  • items is being re-created every render → add useMemo in parent
  • onToggle is being re-created every render → add useCallback in parent
  Both cause React.memo to do nothing, even if it's applied to TodoList`}
      </CodeBlock>

      <InfoBox variant="info" title="The four reasons a component re-renders">
        <ul style={{ marginBottom: 0 }}>
          <li><strong>Props changed</strong> — a prop's reference or value changed (even if the data is the same, a new object/function reference counts as changed)</li>
          <li><strong>State changed</strong> — the component's own useState value changed</li>
          <li><strong>Context changed</strong> — a context the component subscribes to updated (bypasses React.memo entirely)</li>
          <li><strong>Parent re-rendered</strong> — no specific reason; the parent ran so all its children ran too (fixed by React.memo on the child)</li>
        </ul>
      </InfoBox>

      <h3>Step 5 — Use the Ranked Chart</h3>
      <p>
        Switch from "Flamegraph" to "Ranked" using the toggle at the top of the Profiler.
        This sorts every component by render time, slowest first — a direct hit list.
      </p>
      <CodeBlock language="text" title="Ranked chart (slowest first)">
{`Component            Self Time   Bar
─────────────────────────────────────────────────────
TodoList             8.4ms       ████████████████████  ← fix this first
ProductCard          3.1ms       ████████
SearchBar            1.8ms       █████
Header               0.9ms       ██
Footer               0.4ms       █

Strategy: start with the top entry. Ignore everything under ~1ms
until the top entries are resolved.`}
      </CodeBlock>

      <h3>Step 6 — Navigate Between Commits</h3>
      <p>
        A single recording captures multiple "commits" — React batches updates into commits,
        one per state change cycle. The commit bars appear as a row of small rectangles at
        the top of the Profiler panel. Taller bars are slower commits.
      </p>
      <CodeBlock language="text" title="Reading the commit bar row">
{`Commits bar row (each rectangle = one commit):

  | | | |█| | | |████| | | | |
            ↑           ↑
         medium       slow — click this one

Click the tallest bar to jump to the slowest commit.
Use the ← → arrows to step through commits one at a time.
Each commit shows only what rendered in that specific update.`}
      </CodeBlock>

      {/* ── TOOL 2: Chrome DevTools Performance Tab ── */}
      <h2>Tool 2: Chrome DevTools Performance Tab</h2>
      <p>
        The React Profiler shows component renders. The Chrome Performance tab shows
        everything the <em>browser</em> does — JavaScript execution, layout recalculation,
        painting, garbage collection, and frames per second. Use it when you have jank
        (stuttering, dropped frames) or a slow initial page load.
      </p>

      <h3>Step 1 — Record a Trace</h3>
      <CodeBlock language="text" title="Recording steps">
{`1. Open DevTools → click the "Performance" tab
2. Check the "Screenshots" checkbox (top of panel) — gives you a
   filmstrip of the UI at each point in the trace
3. Click ● or press Ctrl+E (Windows) / Cmd+E (Mac) to start recording
4. Perform the slow interaction
5. Click ● or press Ctrl+E / Cmd+E to stop
6. Wait a few seconds for the trace to process and render

Tip: before recording, click the throttle CPU dropdown
and select "4x slowdown" to simulate a mid-range mobile device.
Problems invisible on your fast dev machine become obvious.`}
      </CodeBlock>

      <h3>Step 2 — Read the Timeline</h3>
      <CodeBlock language="text" title="What each row in the timeline means">
{`── FPS (frames per second) ────────────────────────────────────
  Green bars = smooth frames (60fps target = 16ms per frame)
  Red bar    = frame budget exceeded — user sees jank here
  Tall bars  = good; short/missing bars = dropped frames

── CPU activity ───────────────────────────────────────────────
  Yellow  = JavaScript execution
  Purple  = Style recalculation / Layout
  Green   = Painting
  White   = Idle (the browser has nothing to do — good)

── Main Thread (most important) ───────────────────────────────
  A flame chart showing every JS call stack
  Long yellow blocks = slow JavaScript — your bottleneck is here`}
      </CodeBlock>

      <h3>Step 3 — Find Long Tasks</h3>
      <p>
        A <strong>Long Task</strong> is any main-thread task over 50ms. The browser cannot
        respond to user input (clicks, typing) while a Long Task is running — this is the
        source of "the UI feels frozen" complaints. Long Tasks are marked with a{' '}
        <strong>red triangle</strong> in the corner of the task block.
      </p>
      <CodeBlock language="text" title="Identifying and reading a Long Task">
{`Main thread view:

[———— JavaScript: React render ————————————————]▲  ← red triangle
     [reconcile]
          [TodoList render]
               [expensiveFilter()]
                                                  ↑ 210ms total

This blocks user input for 210ms. The user cannot click anything
during this time. Anything over 50ms is a Long Task.

Click the block → bottom panel shows the call stack:
  Self Time  Total Time  Function
  140ms      210ms       expensiveFilter       ← your code, the hot path
   50ms       50ms       Array.prototype.filter
   20ms       20ms       TodoItem (React)`}
      </CodeBlock>

      <InfoBox variant="tip" title="What to do with a Long Task">
        <ul style={{ marginBottom: 0 }}>
          <li>If it's a React render: return to the React DevTools Profiler to find the slow component</li>
          <li>If it's a JS computation (filter, sort, map on large data): move it to <code>useMemo</code> so it only runs when inputs change, or move it to a Web Worker to run off the main thread</li>
          <li>If it's an initial page load: add code splitting with <code>React.lazy</code> to defer loading until the route is visited</li>
        </ul>
      </InfoBox>

      <h3>Step 4 — Use the Bottom-Up Panel</h3>
      <CodeBlock language="text" title="Analyzing with Bottom-Up">
{`After the trace loads, select a time range by clicking and dragging
across the main thread flame chart.

Bottom panel tabs:
  Summary    → pie chart (JS vs Layout vs Paint vs Idle)
  Bottom-Up  → functions sorted by total time, most expensive first ← use this
  Call Tree  → where execution started (top of the call stack)
  Event Log  → every event in chronological order

Bottom-Up example after selecting a slow interaction:

  Self Time  | Total Time | Function
  ───────────────────────────────────────────────
  140ms      | 210ms      | expensiveFilter       ← your code
   50ms      |  50ms      | Array.prototype.filter
   20ms      |  20ms      | TodoItem (React render)
    5ms      |   5ms      | Object.keys

Self Time = time spent IN this function (not in functions it calls)
Total Time = self time + all descendants

Focus on Self Time — that's where the actual work happens.`}
      </CodeBlock>

      {/* ── TOOL 3: Components Tab ── */}
      <h2>Tool 3: React DevTools Components Tab</h2>
      <p>
        Not a profiler — a live inspector. Use it to verify what props and state a component
        currently holds, and to test whether memoization is working without recording a full
        session.
      </p>
      <CodeBlock language="text" title="How to use the Components tab">
{`1. Open DevTools → Components tab
   The left panel shows your full component tree (mirrors the React tree,
   not the DOM — you see your component names, not divs and spans)

2. Click any component to inspect it on the right:
   props  → current values being passed in
   state  → current useState values (editable live!)
   hooks  → every hook in order with its current value
   source → click < > to jump to the source file in Sources tab

3. Testing if React.memo is working:
   a) Find the parent component in the tree
   b) Click the 🔄 (force re-render) icon in the top toolbar
   c) Watch the component tree — re-rendered components briefly flash
   d) If a memoized child does NOT flash, React.memo is working
   e) If it DOES flash, something is causing a prop to change — go back
      to the Profiler and check "Why did this render?"

4. Enable render highlights:
   ⚙️ gear → General → check "Highlight updates when components render"
   Now as you interact with your app normally, every component that
   re-renders gets a colored border flash. This is the fastest way to
   spot surprise re-renders without recording a full session.`}
      </CodeBlock>

      {/* ── Workflow ── */}
      <h2>Putting It All Together</h2>

      <FlowChart
        title="Performance Investigation Workflow"
        chart={"graph TD\n  A[User reports sluggish UI] --> B[React DevTools Profiler]\n  B --> C{Wide/yellow bars?}\n  C -->|Yes - slow render| D[Click bar → Why did this render?]\n  D --> E{Props unstable?}\n  E -->|Object/Array| F[useMemo in parent]\n  E -->|Function| G[useCallback in parent]\n  E -->|Parent re-render| H[React.memo on child]\n  C -->|No - jank/freeze| I[Chrome Performance tab]\n  I --> J{Long Tasks?}\n  J -->|Yes| K[Bottom-Up → find hot function]\n  K --> L[useMemo or Web Worker]\n  J -->|No| M[Check FPS row for dropped frames]\n  H --> N[Re-profile to confirm]\n  F --> N\n  G --> N\n  L --> N"}
      />

      <CodeBlock language="text" title="Quick reference — which tool answers which question">
{`React DevTools Profiler:
  ✓ Which components re-rendered in this interaction?
  ✓ How long did each component's render function take?
  ✓ Why did each component render? (props / state / context / parent)
  ✓ Which components were skipped by React.memo?
  ✓ How many times did a component render in one session?

Chrome DevTools Performance:
  ✓ Are frames being dropped? (FPS row)
  ✓ Is there a Long Task blocking user input?
  ✓ Which specific JavaScript function is the bottleneck?
  ✓ How much time is JS vs Layout vs Paint?

React DevTools Components:
  ✓ What are this component's current props/state?
  ✓ Is React.memo actually preventing re-renders?
  ✓ Which hook variable holds which value right now?`}
      </CodeBlock>

      <InfoBox variant="warning" title="Always profile dev mode first, then confirm in production">
        <p>
          Development mode makes React 2–3× slower than production because it runs extra
          checks and warnings. Profile in dev to find <em>which</em> components are slow.
          Then confirm the real user impact by building a production bundle:
        </p>
        <CodeBlock language="bash" title="Build and preview production locally">
{`npm run build
npm run preview   # serves the production build on localhost`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Profile the preview build in Chrome to see actual user-facing performance. The
          bottleneck may shrink significantly, or a different one may appear.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
