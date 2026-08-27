import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function CheatSheet() {
  return (
    <LessonLayout
      title="📋 React Cheat Sheet"
      sectionId="react18"
      lessonIndex={14}
      prev={{ path: '/react18/build-toolchain', label: 'Build Toolchain' }}
      next={{ path: '/react18/adapters', label: 'API Adapters & Envelopes' }}
    >

      <h2>📋 Cheat Sheet — Re-Renders, Memo &amp; Stability</h2>

      <p>Quick-reference summary of everything covered in the tutorial pages. Pin this.</p>

      <h3>🔄 What Triggers a Re-Render</h3>

      <CodeBlock language="text" title="The 4 re-render triggers">
{`1. setState() called          → the component re-renders
2. Parent re-renders           → all children re-render (cascade)
3. Context value changes       → all consumers re-render (bypasses memo)
4. useReducer dispatch called  → the component re-renders

That's it. Nothing else causes a re-render.
Props changing does NOT cause re-renders by itself —
the PARENT re-rendering is what triggers the child.`}
      </CodeBlock>

      <InfoBox variant="note" title="📝 Why 'Props Changing' Isn't a Trigger">
        <p><strong>Props can never change without the parent re-rendering first.</strong> If a parent passes <code>count</code> to a child and <code>count</code> changes, that means the parent called <code>setState</code> → parent re-rendered → child re-renders via rule #2 (parent cascade).</p>
        <p>The key implication: even if every prop is <strong>exactly the same</strong>, the child STILL re-renders when the parent re-renders. React does not check "did props change?" before re-rendering children — it blindly cascades down the tree. That's why <code>React.memo</code> exists — it <em>adds</em> the prop comparison check that React doesn't do by default.</p>
        <p><strong>There is no "prop watcher."</strong> Re-renders flow top-down via cascade, never bottom-up via prop detection.</p>
      </InfoBox>

      <InfoBox variant="note" title="📝 It Doesn't Matter WHERE the Prop Comes From">
        <p>The re-render cascade happens regardless of what you pass as props — state, hardcoded values, inline objects, computed values. Once the parent re-renders, <strong>every child re-renders unconditionally</strong>. React never inspects props to decide.</p>
        <p><code>&lt;Child name="hardcoded" /&gt;</code> — static string, still re-renders.<br/>
        <code>&lt;Child value=&#123;42&#125; /&gt;</code> — static number, still re-renders.<br/>
        <code>&lt;Child items=&#123;[1,2,3]&#125; /&gt;</code> — inline array, still re-renders.<br/>
        <code>&lt;Child config=&#123;&#123; a: 1 &#125;&#125; /&gt;</code> — inline object, still re-renders.</p>
        <p>Where the prop source <em>does</em> matter is with <code>React.memo</code>: primitives like <code>"hardcoded"</code> and <code>42</code> pass Object.is (memo skips re-render ✅), but inline objects/arrays are new references every render (memo sees "changed" → re-renders anyway ❌).</p>
      </InfoBox>

      <InfoBox variant="warning" title="⚠️ Non-State Variables Can't Trigger Re-Renders">
        <p>A regular variable (<code>let</code>, <code>const</code>) inside a component <strong>cannot change between renders</strong> — because the function only runs again when something triggers a re-render. The variable is re-created as a <em>consequence</em> of re-rendering, never the <em>cause</em>.</p>
        <p><code>let x = Math.random();</code> — gets a new value every render, but does NOT cause renders. Something else (setState in a parent, context change) must trigger the parent to run again. Then <code>x</code> is recalculated, the child gets the new prop, and re-renders via cascade.</p>
        <p><strong>Only <code>setState</code> and <code>dispatch</code> can tell React "something changed, re-render me."</strong> If you mutate a regular variable, React has no idea — it never re-runs your function, and no child ever sees the new value. This is why state exists.</p>
      </InfoBox>

      <h3>🛡️ React.memo Rules</h3>

      <CodeBlock language="text" title="When memo works vs when it's useless">
{`WHAT IT DOES:
  Prevents a component from re-rendering when its parent
  re-renders, IF all props pass Object.is comparison.

WHAT IT DOESN'T DO:
  ❌ Does NOT prevent re-renders from setState inside the component
  ❌ Does NOT prevent re-renders from context changes
  ❌ Does NOT check children — only props

MEMO WORKS WHEN:
  ✅ All props are primitives (strings, numbers, booleans)
  ✅ All object/array props come from useMemo
  ✅ All function props come from useCallback
  ✅ All props come from useState (stable until setter called)

MEMO IS USELESS WHEN:
  ❌ Any prop is an inline object: style={{ color: 'red' }}
  ❌ Any prop is an inline function: onClick={() => doThing()}
  ❌ Any prop is an inline array: items={[1, 2, 3]}
  ❌ The component uses useContext and that context changes
  ❌ The component's props change on every render anyway

THE RULE:
  Memo on the child = necessary but not sufficient.
  Parent must ALSO stabilize all props it passes.
  Both halves are required.`}
      </CodeBlock>

      <h3>📌 Stable vs Unstable References</h3>

      <CodeBlock language="text" title="What passes Object.is across renders">
{`ALWAYS STABLE (same reference every render):
  ✅ useState setter     → setCount, setUser, etc.
  ✅ useReducer dispatch → dispatch
  ✅ useRef return       → ref (the ref object itself)
  ✅ useState value      → until you call the setter
  ✅ useMemo result      → until deps change
  ✅ useCallback result  → until deps change

ACCIDENTALLY STABLE (re-created but same value):
  ✅ Primitives          → "hello", 42, true, null
     Re-assigned every render, but Object.is compares by VALUE
     so they pass anyway.

ALWAYS UNSTABLE (new reference every render):
  ❌ Inline objects      → { color: 'red' }
  ❌ Inline arrays       → [1, 2, 3]
  ❌ Inline functions    → () => doSomething()
  ❌ Object literals in JSX → style={{ margin: 0 }}

INSTABILITY ONLY MATTERS IN 3 PLACES:
  1. Dependency arrays   → useEffect, useMemo, useCallback
  2. React.memo props    → triggers re-render of memoized child
  3. Context value       → triggers re-render of ALL consumers`}
      </CodeBlock>

      <h3>📦 The Context Gotchas</h3>

      <CodeBlock language="text" title="Context re-render rules">
{`RULE 1: Context bypasses React.memo
  A memoized component that uses useContext WILL re-render
  when the context value changes. Memo only checks props.

RULE 2: The {} trap
  value={{ user, permissions }} creates a NEW object every render.
  Even if user and permissions haven't changed, the wrapper
  object is new → Object.is fails → all consumers re-render.
  FIX: useMemo(() => ({ user, permissions }), [user, permissions])

RULE 3: The cascade
  Consumer re-renders → all its children re-render →
  their children re-render → entire subtree.
  One unmemoized provider can cause 100+ unnecessary re-renders.

RULE 4: Parent re-render ≠ data change
  If something UNRELATED causes the provider to re-render
  (e.g., sibling state change), and you don't have useMemo
  on the value, ALL consumers re-render for nothing.`}
      </CodeBlock>

      <h3>🔧 Stabilization Quick Reference</h3>

      <CodeBlock language="text" title="How to fix each type of instability">
{`PROBLEM                          FIX
─────────────────────────────    ─────────────────────────────
Inline function as prop          useCallback(() => fn(), [deps])
Inline object as prop            useMemo(() => ({ ... }), [deps])
Inline array as prop             useMemo(() => [...], [deps])
Inline style as prop             useMemo(() => ({ color }), [color])
Context value object             useMemo(() => ({ ...vals }), [deps])
Derived/computed value           useMemo(() => compute(), [deps])
Static value that never changes  useState(value) or module-level const
Expensive initial computation    useState(() => expensiveCompute())`}
      </CodeBlock>

      <h3>⚡ Decision Cheat Sheet</h3>

      <CodeBlock language="text" title="Quick decisions for common scenarios">
{`SCENARIO                                      ACTION
────────────────────────────────────────────  ──────────────
Child re-renders but nothing changed?         → Wrap in React.memo + stabilize props
Memo'd child STILL re-renders?               → Check: inline props? context? setState inside?
useEffect runs every render?                  → Unstable value in dependency array
useEffect loops forever?                      → It WRITES its own dependency. Compare deps vs
                                                 what the body sets — overlap is the whole cause.
                                                 (No deps array = everything is a dependency.)
Context consumers re-render too often?        → useMemo the provider value object
Should I memo this component?                 → Only if: expensive + parent re-renders often + props rarely change
Should I useMemo this value?                  → Only if: passed to memo'd child, in deps array, or in context value
Should I useCallback this function?           → Only if: passed to memo'd child or in deps array
useState vs useMemo for stable ref?           → useState = might change later; useMemo = derived from other values
Why does memo + context not work?             → Memo checks PROPS only. Context bypasses it entirely.
Arrow function vs named function?             → Named function for components (auto name in DevTools)`}
      </CodeBlock>

      <InfoBox variant="success" title="The Golden Rule">
        <p>React re-renders are <strong>not the enemy</strong> — unnecessary re-renders of <strong>expensive components</strong> are. Don't optimize everything. Profile first, then apply memo + stabilization only where it matters. The React Compiler does most of this automatically once you enable it.</p>
      </InfoBox>

      <h2>🎯 React Stability Master Reference</h2>

      <p>Everything about what's stable, what's not, and why — in one place.</p>

      <h3>What "Stable" Means</h3>

      <CodeBlock language="text" title="Stability = same reference across renders (passes Object.is)">
{`Object.is(valueFromRender1, valueFromRender2) === true  →  STABLE
Object.is(valueFromRender1, valueFromRender2) === false →  UNSTABLE

Why it matters:
  1. Dependency arrays (useEffect, useMemo, useCallback) — unstable = re-run
  2. React.memo props — unstable = re-render
  3. Context values — unstable = every consumer re-renders`}
      </CodeBlock>

      <h3>Stability by Hook</h3>

      <CodeBlock language="text" title="Every hook's return value — is it stable?">
{`HOOK                    RETURNS           STABLE?    WHY
──────────────────────  ────────────────  ─────────  ─────────────────────────────────────
useState                [value, setter]
  → value                                 ✅ Yes     Same ref until you call setter
  → setter (setX)                         ✅ Always  Created once, bound to fiber slot

useReducer              [state, dispatch]
  → state                                 ✅ Yes     Same ref until dispatch changes it
  → dispatch                              ✅ Always  Created once, never changes

useRef                  { current: ... }
  → the ref object                        ✅ Always  Same object every render
  → ref.current                           ⚠️  Varies  Mutable — you control it

useMemo                 computedValue     ✅ Yes     Same until deps change
useCallback             memoizedFn        ✅ Yes     Same until deps change

useContext              contextValue      ⚠️  Depends  Stable if provider value is memoized
useId                   string            ✅ Always  Generated once, never changes
useTransition           [isPending, start]
  → isPending                             ❌ No      A boolean that flips true/false
  → startTransition                       ✅ Always  Same function every render
useDeferredValue        deferredValue     ⚠️  Varies  New ref when source changes
useEffectEvent          eventFn           ✅ Always  Stable ref, always latest closure`}
      </CodeBlock>

      <h3>Stability by Value Type</h3>

      <CodeBlock language="text" title="JavaScript values — which survive Object.is?">
{`TYPE          EXAMPLE              Object.is STABLE?    NOTES
────────────  ───────────────────  ───────────────────  ──────────────────────────────
number        42                   ✅ Yes                Same value = same identity
string        "hello"              ✅ Yes                Same value = same identity
boolean       true                 ✅ Yes                Same value = same identity
null          null                 ✅ Yes                Only one null
undefined     undefined            ✅ Yes                Only one undefined
NaN           NaN                  ✅ Yes                Object.is(NaN, NaN) = true!
+0 vs -0     0, -0                ❌ No                 Object.is(0, -0) = false!
object        { a: 1 }             ❌ No*                New {} = new reference
array         [1, 2, 3]            ❌ No*                New [] = new reference
function      () => {}             ❌ No*                New arrow = new reference
Date          new Date()           ❌ No*                New Date = new reference

* Unless you preserve the same reference with useState, useMemo, useRef, etc.`}
      </CodeBlock>

      <h3>Common Patterns — Stable vs Unstable</h3>

      <CodeBlock language="jsx" title="Inside a Component — What Creates New References?">
{`function MyComponent({ userId }) {
  // ── STABLE (same ref across renders) ──────────────────────
  const [count, setCount] = useState(0);       // both stable
  const ref = useRef(null);                     // ref object stable
  const dispatch = useReducer(reducer, init)[1]; // dispatch stable
  const id = useId();                           // string, stable
  
  const cached = useMemo(() => heavy(userId), [userId]); // stable until userId changes
  const handler = useCallback(() => {}, []);             // stable (no deps)

  // ── UNSTABLE (new ref every render) ───────────────────────
  const style = { color: 'red' };              // ❌ new object
  const items = [1, 2, 3];                     // ❌ new array
  const onClick = () => doThing();             // ❌ new function
  const config = { theme: 'dark', lang: 'en' }; // ❌ new object
  
  // ── FIXES ─────────────────────────────────────────────────
  const style2 = useMemo(() => ({ color: 'red' }), []);
  const items2 = useMemo(() => [1, 2, 3], []);
  const onClick2 = useCallback(() => doThing(), []);
  // Or if truly static: move OUTSIDE the component
}`}
      </CodeBlock>

      <h3>Batching Reference</h3>

      <CodeBlock language="text" title="How many renders does this cause?">
{`SCENARIO                                              RENDERS   WHY
────────────────────────────────────────────────────  ────────  ──────────────────────
setState x3 in click handler                          1         Auto-batched (sync block)
setState x3 in setTimeout callback                    1         Auto-batched (React 18+)
setState before await fetch() + setState after        2         Real async work splits it
setState in 3 setTimeout(..., 0) — all same turn      1         All land before the flush
setState in 3 setTimeout spread 0/30/60ms             3         React flushes in between
setState in 3 separate .then() callbacks              1         Microtasks all drain first
setState in a 3-link .then() CHAIN                    1         Same checkpoint — chain ≠ split
dispatch(action) once (updates 5 state fields)        1         Always 1 — atomic update
setState + dispatch in same handler                   1         Auto-batched together

THE REAL RULE: a batch ends when React gets a chance to FLUSH — not when a
callback ends. Everything queued before that flush lands in ONE render. So
"separate callback" does NOT imply "separate render": three .then()s all
drain in the same microtask checkpoint — chained or independent, it makes
no difference — and three setTimeout(..., 0) all run in the same timer
turn, so each group repaints once.

RELIABLY SEPARATE RENDERS (React flushes in between):
  • await on REAL async work — a fetch, a timer, res.json()
  • Timers spaced far enough apart to let a flush land
  • Separate user events (two real clicks)

STILL ONE RENDER (everything queued before the flush):
  • Any uninterrupted sync code — loops, if/else, calls, .map/.filter
  • Several setState inside ONE timer or promise callback
  • Several timers or promises that all fire in the SAME turn
  • A .then() CHAIN whose links do no real async work — the whole
    chain drains in one microtask checkpoint (measured: 1 render)`}
      </CodeBlock>

      <h3>The Complete Decision Table</h3>

      <CodeBlock language="text" title="I need to... → Use this">
{`I NEED TO...                                    USE THIS
──────────────────────────────────────────────  ────────────────────────────────────────
Store a value that triggers re-render           useState(value)
Store a value that DOESN'T trigger re-render    useRef(value)
Expensive computation from other values         useMemo(() => compute(), [deps])
Stable function reference                       useCallback(fn, [deps])
Stable function that always uses latest closure useRef + wrapper pattern (useStableCallback)
Remember previous render's value                useRef + useEffect (usePrevious)
Complex related state transitions               useReducer(reducer, initialState)
Pass updater to deep children without re-render useReducer (dispatch is stable)
One-time expensive initial state                useState(() => expensiveFn())
Static value that never changes                 Module-level const (outside component)
Detect if a prop changed since last render      usePrevious(prop) + comparison`}
      </CodeBlock>

      <h2>🔁 Re-Render Deep Dive — The Full Mental Model</h2>

      <p>Understanding exactly what happens during a re-render, what gets re-created, and what survives.</p>

      <h3>What Happens During a Re-Render</h3>

      <CodeBlock language="text" title="Step-by-step: a component re-renders">
{`WHEN YOUR COMPONENT RE-RENDERS, THIS HAPPENS:

  1. React calls your function component again (top to bottom)
  2. All local variables are re-created (const, let, etc.)
  3. All inline objects, arrays, functions → NEW references
  4. Hooks execute in order:
     • useState returns EXISTING state (doesn't re-init)
     • useRef returns EXISTING ref object
     • useMemo re-runs ONLY if deps changed
     • useCallback returns SAME fn ONLY if deps unchanged
     • useEffect → scheduled for AFTER commit (not during render)
  5. JSX returned → React diffs against previous output
  6. React commits only the DOM changes that differ (reconciliation)

KEY INSIGHT:
  "Re-render" ≠ "DOM update"
  A re-render is just calling your function again.
  The DOM only updates if the JSX output actually changed.
  So re-renders are cheap unless your component is expensive to call.`}
      </CodeBlock>

      <h3>Re-Render vs Remount (Destroyed & Recreated)</h3>

      <CodeBlock language="text" title="When state is PRESERVED vs DESTROYED">
{`RE-RENDER (state preserved):
  • Parent re-renders → child at same position re-renders
  • Props change → child re-renders (but keeps state!)
  • Context changes → consumer re-renders (keeps state!)
  ✅ useState values survive
  ✅ useRef values survive
  ✅ DOM nodes are reused (just patched)

REMOUNT (state destroyed, component starts fresh):
  • Component type changes at same position:
      {isAdmin ? <AdminPanel /> : <UserPanel />}  ← switches = remount
  • key prop changes:
      <Profile key={userId} />  ← userId changes = full remount
  • Parent is removed from tree:
      {showPanel && <Panel />}  ← toggled off then on = remount
  ❌ All state reset to initial values
  ❌ All refs reset to initial values
  ❌ All effects run cleanup then re-run
  ❌ DOM nodes destroyed and recreated

THE key PROP TRICK:
  Want to "reset" a component? Change its key.
  React treats different keys as different component INSTANCES.
  <Form key={selectedId} />  ← form resets when selection changes`}
      </CodeBlock>

      <h3>The Children Prop Optimization</h3>

      <CodeBlock language="jsx" title="Why children don't re-render when parent state changes">
{`// PATTERN: Children as props DON'T re-render when parent's state changes!

// ❌ BAD — ExpensiveTree re-renders every time count changes
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveTree />  {/* Re-renders! Parent re-rendered → cascade */}
    </div>
  );
}

// ✅ GOOD — ExpensiveTree does NOT re-render when count changes
function App() {
  return (
    <Parent>
      <ExpensiveTree />  {/* Created by App, not Parent */}
    </Parent>
  );
}
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      {children}  {/* Same JSX reference from App — not re-created! */}
    </div>
  );
}

// WHY THIS WORKS:
// children is a prop. Its JSX was created in App's render.
// When Parent re-renders, children is the same reference
// (App didn't re-render, so it didn't recreate the JSX).
// React sees same reference → skips re-rendering those children.`}
      </CodeBlock>

      <h3>What Actually Breaks the Children-as-Props Bailout</h3>

      <InfoBox variant="warning" title="The bailout depends on element identity — not on WHY the parent re-rendered">
        <p>
          React bails out of re-rendering a child fiber when the new element object is{' '}
          <code>===</code> the old one (<code>oldProps === newProps</code> and nothing is
          scheduled on that fiber). It never asks <em>why</em> the parent re-rendered. So a
          parent re-rendering from its own <code>setState</code>, from a context subscription,
          or from wrapping <code>{'{children}'}</code> in a Provider all behave the same:{' '}
          <strong>the children reference is untouched, so the bailout still holds.</strong>
        </p>
        <p style={{ marginBottom: 0 }}>
          The bailout only breaks when something produces a <strong>new element object</strong>{' '}
          for that child.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="When children-as-props stops working">
{`// ✅ WORKS — App owns the JSX, Parent never recreates it
function App() {
  return <Parent><ExpensiveTree /></Parent>;
}
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return <div><button onClick={() => setCount(c => c + 1)}>{count}</button>{children}</div>;
}
// ExpensiveTree does NOT re-render when count changes ✅

// ✅ STILL WORKS — Parent also consumes a context
function Parent({ children }) {
  const theme = useContext(ThemeCtx);  // re-renders when theme changes...
  return <div className={theme}>{children}</div>;
}
// ...but 'children' is Parent's own prop, unchanged → ExpensiveTree bails out ✅

// ✅ STILL WORKS — Parent wraps children in a Provider
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return <SomeContext value={count}>{children}</SomeContext>;
}
// The <SomeContext> element is new each render, but its 'children' prop is the
// SAME element object → that subtree bails out. Only useContext(SomeContext)
// CONSUMERS inside it re-render, via the context broadcast. ✅

// ─────────────────────────────────────────────────────────────────────────────
// ❌ BREAKS 1: the OWNER re-renders (this is the only structural cause)
function App() {
  const [appState, setAppState] = useState(0);  // App has state too
  return <Parent><ExpensiveTree /></Parent>;     // App re-renders → new JSX → new ref
}
// App re-renders → recreates <ExpensiveTree /> → ExpensiveTree re-renders ❌
// FIX: move the state down (into Parent or a sibling), or lift the provider
//      tree into main.tsx where nothing above it ever re-renders.

// ❌ BREAKS 2: Parent rebuilds the children elements
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return Children.map(children, (child) =>
    cloneElement(child, { count })     // cloneElement returns a NEW element
  );
}
// Every render produces fresh element objects → no bailout ❌
// FIX: pass data via context, or accept a render prop you control.

// ❌ BREAKS 3: children is a FUNCTION (render prop), called during render
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return <div>{children(count)}</div>;   // calling it creates new elements
}
// The function reference is stable, but its RETURN VALUE is new every call ❌
// This is the real cost of render props vs. plain children.

// ❌ BREAKS 4: the child subtree reads changed context, or has its own
//    scheduled update. Bailout is skipped for fibers with pending work —
//    which is correct: they genuinely need to re-render.`}
      </CodeBlock>

      <InfoBox variant="note" title="Two Independent Re-render Mechanisms">
        <p>React has <strong>two completely separate</strong> mechanisms that can cause a component to re-render:</p>
        <ol>
          <li><strong>Structural cascade</strong> — parent re-renders → all children in its JSX output re-render. Stops at <code>React.memo</code> (if props are stable).</li>
          <li><strong>Context subscription</strong> — context value changes → all consumers re-render. Bypasses <code>React.memo</code> entirely.</li>
        </ol>
        <p>These are <em>additive</em>: a component can be hit by both at once, or just one, or neither. The children-as-props pattern only protects against #1 (structural cascade). It does nothing for context subscriptions.</p>
      </InfoBox>

      <h3>Pure Components</h3>

      <CodeBlock language="text" title="What 'pure' means for a component">
{`A PURE COMPONENT:
  • Output depends ONLY on its inputs: props, state, and context
  • Same inputs → same JSX output, every time
  • No side effects during render (no mutations, no API calls, no random values)

PURE:
  function InfoBox({ title, text }) {
    return <div><h3>{title}</h3><p>{text}</p></div>;
  }
  // Call it with title="Hello", text="World" → always renders the same thing ✅

NOT PURE:
  function Feed({ posts }) {
    analytics.track('feed_rendered');        // ❌ side effect DURING render
    return <p>{Math.random()}</p>;           // ❌ non-deterministic output
  }
  // Impurity means the RENDER itself mutates something outside the component,
  // does I/O, or reads a changing global (Math.random, Date.now).

LOCAL STATE DOES NOT MAKE A COMPONENT IMPURE:
  function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  }
  // ✅ Still pure. State is an INPUT to the render, exactly like props:
  // same (props, state, context) → same JSX, every time. Calling a setter
  // from an EVENT HANDLER is not a render side effect.

WHY IT MATTERS FOR PERFORMANCE:
  A pure component is safe to skip re-rendering when its inputs haven't
  changed. That is what React.memo adds — it wraps a component and says:
  "On a PARENT cascade, skip this if all props pass Object.is."

  React.memo on a stateful component is CORRECT and extremely common.
  memo only intercepts the parent-cascade path (trigger #2). A component's
  own setState schedules a re-render directly on that fiber and is never
  blocked by memo — that is required for correctness, not a hole in it.
  It is the same fact as "❌ Does NOT prevent re-renders from setState
  inside the component" in the React.memo Rules block above.

RULE:
  Candidate for React.memo  ←→  render is pure AND every prop is stable
  AND the parent re-renders often. Internal state does not disqualify it.`}
      </CodeBlock>

      <InfoBox variant="note" title="📝 Same Position in Tree = Same Instance">
        <p>React identifies component instances by their <strong>position in the render tree</strong> + their <strong>type</strong>. If a component appears at the same position with the same type, React reuses the instance (preserves state). If the type changes at that position, or you give it a different <code>key</code>, React destroys the old instance and creates a new one.</p>
      </InfoBox>

      <h3>useEffect Re-Run Rules</h3>

      <CodeBlock language="text" title="When effects run, re-run, and clean up">
{`WHEN EFFECTS RUN:
  • After EVERY render (no deps array):
      useEffect(() => { ... })           ← runs after every single render

  • After FIRST render only (empty deps):
      useEffect(() => { ... }, [])        ← mount only

  • When specific values change:
      useEffect(() => { ... }, [a, b])    ← runs when a OR b changes (Object.is)

HOW "CHANGE" IS DETERMINED:
  React compares each dep with Object.is(prevDep, currentDep)
  • Primitives: compared by value (42 === 42, "hi" === "hi")
  • Objects/arrays/functions: compared by REFERENCE
    → {} !== {} (new object = "changed" to React)
    → same reference from useState/useMemo = "unchanged"

CLEANUP TIMING:
  1. Component re-renders
  2. React commits DOM changes
  3. React runs CLEANUP of PREVIOUS effect (if deps changed)
  4. React runs NEW effect

  On unmount:
  1. React runs cleanup of all effects (no new effects scheduled)

COMMON TRAP — EFFECT RUNS EVERY RENDER:
  useEffect(() => {
    fetchData(options);    // Runs every render!
  }, [options]);           // ← options is { page: 1 } inline = new ref each time

  FIX: useMemo the options, or restructure deps:
  useEffect(() => {
    fetchData({ page });
  }, [page]);              // ← primitive dep, stable`}
      </CodeBlock>

      <h3>What Gets Re-Created vs Reused on Each Render</h3>

      <CodeBlock language="jsx" title="Line-by-line: what's new vs preserved">
{`function MyComponent({ items, onSelect }) {
  // ── RE-CREATED EVERY RENDER (new references) ──────────────
  const filtered = items.filter(i => i.active);  // new array
  const style = { padding: 16 };                 // new object
  const handleClick = (id) => onSelect(id);      // new function
  const label = \`Items: \${items.length}\`;        // new string (but stable via Object.is!)

  // ── PRESERVED ACROSS RENDERS (same references) ────────────
  const [selected, setSelected] = useState(null);      // same value until setter called
  const inputRef = useRef(null);                        // same ref object always
  const memoList = useMemo(() => items.filter(i => i.active), [items]); // same until items changes
  const stableClick = useCallback((id) => onSelect(id), [onSelect]);   // same until onSelect changes

  // ── THE JSX ITSELF ────────────────────────────────────────
  // Every element in JSX = React.createElement() call = new object.
  // BUT React's reconciler diffs them efficiently.
  // It only updates DOM for elements that ACTUALLY changed.
  return (
    <div style={style}>          {/* style is new → if child is memo'd, it re-renders */}
      <List
        items={filtered}         {/* new array → memo'd List would re-render */}
        items2={memoList}        {/* same ref → memo'd List would skip */}
        onSelect={handleClick}   {/* new fn → breaks memo */}
        onSelect2={stableClick}  {/* same fn → memo works */}
      />
    </div>
  );
}`}
      </CodeBlock>

      <h3>State Update Timing & Closures</h3>

      <CodeBlock language="text" title="When state actually changes and the stale closure trap">
{`CRITICAL CONCEPT: setState is NOT immediate.

  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(1);
    console.log(count);  // Still 0! State updates on NEXT render.
    setCount(count + 1); // Uses current render's count (0), not 1
  }

THE STALE CLOSURE TRAP:
  function Timer() {
    const [count, setCount] = useState(0);

    useEffect(() => {
      const id = setInterval(() => {
        setCount(count + 1);  // ❌ count is ALWAYS 0 (captured in closure)
      }, 1000);
      return () => clearInterval(id);
    }, []);  // Empty deps = effect captures initial count forever

    // FIX 1: functional update
    setCount(prev => prev + 1);  // ✅ Always has latest

    // FIX 2: include in deps (but creates new interval each time)
    useEffect(() => { ... }, [count]);

    // FIX 3: useRef for mutable "latest value"
    const countRef = useRef(count);
    countRef.current = count;  // Update ref every render
    setInterval(() => setCount(countRef.current + 1), 1000);  // ✅
  }

WHY useRef FIXES IT (but a state object doesn't):
  Closures capture REFERENCES to objects, not value snapshots.
  useRef   → same object every render; .current is always fresh ✅
  useState → NEW object on each update; old closure holds old object ❌
                                Same ref?  Triggers re-render?
  useRef                          ✅ Yes        ❌ No
  useState                        ❌ No         ✅ Yes

WHEN IS STATE ACTUALLY "UPDATED"?
  1. You call setState(newValue)
  2. React schedules a re-render (batches with other setState calls)
  3. React calls your component function again
  4. useState NOW returns the new value
  5. You can "see" the new state only in the NEXT render`}
      </CodeBlock>

      <h3>Strict Mode & Double Rendering</h3>

      <CodeBlock language="text" title="Why everything runs twice in development">
{`IN DEVELOPMENT ONLY (with <StrictMode>):
  • Component functions are called TWICE per render
  • Effects mount → unmount → mount (double-invoked)
  • useState initializers run twice
  • useReducer reducers run twice

WHY:
  React is testing that your code is "pure" —
  that calling it twice produces the same result.
  This catches side effects in render, leaked state, etc.

IN PRODUCTION:
  Everything runs exactly once. No double-rendering.

WHAT THIS MEANS FOR YOU:
  • Console.logs appear twice — normal, don't worry
  • Effects run twice — if this breaks you, your effect has
    a bug (missing cleanup, non-idempotent side effect)
  • If your code works correctly with Strict Mode,
    it's resilient to future React features (concurrent rendering)`}
      </CodeBlock>

      <h3>Reconciliation Rules — When React Reuses DOM</h3>

      <CodeBlock language="text" title="How React decides to update, reuse, or destroy DOM">
{`REACT'S RECONCILIATION ALGORITHM:

  1. Same element type at same position?
     → REUSE the DOM node, just update changed attributes/props
     <div className="old" /> → <div className="new" />  ← same div, update class

  2. Different element type at same position?
     → DESTROY old DOM subtree, CREATE new one
     <div>...</div> → <span>...</span>  ← destroy div + children, create span

  3. Same COMPONENT type at same position?
     → REUSE the instance (state preserved), re-render with new props
     <UserProfile userId={1} /> → <UserProfile userId={2} />  ← same instance, new props

  4. Different component type at same position?
     → DESTROY old instance + state, CREATE new instance
     <UserProfile /> → <AdminProfile />  ← full remount, state lost

  5. Lists without keys?
     → React matches by INDEX. Insert/delete causes all items after to remount.

  6. Lists with keys?
     → React matches by KEY. Only truly added/removed items remount.

KEY RULE FOR LISTS:
  • key={index} — almost always wrong (same problems as no key)
  • key={item.id} — correct (stable identity across re-orders)
  • key={Math.random()} — TERRIBLE (remount everything every render)`}
      </CodeBlock>

      <InfoBox variant="tip" title="💡 The Simplest Mental Model">
        <p><strong>Re-render = your function runs again.</strong> Everything not wrapped in useState/useRef/useMemo/useCallback is brand new. Hooks are the "memory" that persists across renders. The DOM only updates where the output actually differs. State only resets when the component <em>unmounts</em> (position changes, type changes, or key changes).</p>
      </InfoBox>

      <h2>⚛️ React 19 API Quick Reference</h2>

      <CodeBlock language="jsx" title="The new hooks — signature and when to reach for each" showLineNumbers>
{`// use() — read a Promise or Context. The ONLY hook allowed in a
// conditional or loop. Suspends the component until the promise resolves.
const user  = use(userPromise);   // parent creates the promise, child reads it
const theme = use(ThemeContext);  // conditional context read is legal
// The promise MUST be stable across renders. Creating it during the render
// that reads it is itself an infinite loop: render → new promise → suspend →
// re-render → new promise → forever. Create it in the parent, in a cache, or
// in a framework loader — never inline:
//   const user = use(fetch('/api/me').then(r => r.json()));  // ❌ never resolves

// useActionState(action, initialState) => [state, formAction, isPending]
// Wraps an async action; React tracks pending + result state for you.
const [state, formAction, isPending] = useActionState(updateProfile, { errors: null });
<form action={formAction}>...</form>          // no onSubmit, no preventDefault

// useFormStatus() => { pending, data, method, action }   — from 'react-dom'
// Any DESCENDANT of a <form action={...}> can read its pending state.
// Returns pending: false if the component is not inside such a form.
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Save</button>;
}

// useOptimistic(actualState, reducer) => [optimisticState, addOptimistic]
// Shows a value immediately; snaps back to actualState when the action ends.
const [optimistic, addOptimistic] = useOptimistic(messages, (cur, msg) => [...cur, msg]);

// useDeferredValue(value, initialValue?)  — 2nd arg is new in 19
const deferred = useDeferredValue(query, '');   // first render uses '' , not query
const isStale  = query !== deferred;            // the standard "dim it" signal`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Syntax that changed in React 19" showLineNumbers>
{`// ── ref is a normal prop; forwardRef is no longer needed ──
function MyInput({ ref, ...props }) { return <input ref={ref} {...props} />; }
// forwardRef still works and is NOT deprecated: react.dev says it "is no
// longer necessary" and "will be deprecated in a future release". No
// warning in 19 — don't write new ones, don't rush to rip out old ones.

// ── ref callbacks can return a cleanup function ──
<div ref={(node) => {
  const obs = new ResizeObserver(fn); obs.observe(node);
  return () => obs.disconnect();          // called on unmount
}} />
// GOTCHA: React only uses the return value if it IS a function; anything else
// is ignored and the ref is called with null as before. So the concise
// (node) => (ref.current = node) still works, but TypeScript rejects it.
// Use a braced body: (node) => { ... }

// ── render the Context itself as the provider ──
<ThemeContext value="dark">{children}</ThemeContext>
// <ThemeContext.Provider> still works and is NOT deprecated yet (no
// warning in 19); React plans to deprecate it later. <Context.Consumer>
// IS marked deprecated — replace it with useContext() / use().

// ── document metadata hoists to <head> from anywhere ──
<title>{post.title}</title>
<meta name="description" content={post.summary} />
<link rel="stylesheet" href="/w.css" precedence="default" />  // deduped + ordered
<script async src="/sdk.js" />                                 // deduped + hoisted

// ── resource hints, from 'react-dom' ──
prefetchDNS(host)  preconnect(host)
preload(href, { as: 'font' | 'image' | 'script' | 'style' | 'fetch' })  // fetch only
preinit(href, { as: 'script' | 'style' })                                // fetch + run

// ── root-level error hooks ──
createRoot(el, { onCaughtError, onUncaughtError, onRecoverableError })`}
      </CodeBlock>

      <CodeBlock language="text" title="Removed in React 19 — hard failures on upgrade">
{`propTypes / defaultProps on FUNCTION components  →  TypeScript + default params
Legacy Context (contextTypes/getChildContext)    →  createContext
String refs (ref="input")                        →  useRef or a callback ref
ReactDOM.render / .hydrate / unmountComponentAtNode → createRoot / hydrateRoot / root.unmount()
ReactDOM.findDOMNode                             →  refs
react-test-renderer/shallow                      →  React Testing Library
useRef() with no argument (@types/react 19)      →  useRef<T>(null) — arg now required
MutableRefObject (@types/react 19)               →  RefObject<T> — no overload returns it

Deprecated but still working (migrate at leisure):
forwardRef            →  ref as a plain prop
<Context.Provider>    →  <Context>
<Context.Consumer>    →  useContext() / use()`}
      </CodeBlock>

      <InfoBox variant="note" title="Compiler vs. Manual Memoization — the short version">
        <p>
          With the React Compiler enabled, <code>useMemo</code>, <code>useCallback</code>, and{' '}
          <code>React.memo</code> are mostly unnecessary — it inserts equivalent caching at build
          time. It still cannot help you with: <code>useRef</code>, <code>useLayoutEffect</code>,
          context splitting, <code>key</code> props, list virtualization, or code splitting.
          And it silently opts out of any component that breaks the Rules of React, so run the
          compiler lint rules first. Those rules now ship <em>inside</em>{' '}
          <code>eslint-plugin-react-hooks</code> (v6+) — the standalone{' '}
          <code>eslint-plugin-react-compiler</code> package is retired. Enable the{' '}
          <code>recommended-latest</code> config and fix what it reports before turning
          compilation on.
        </p>
      </InfoBox>

      <h2>🔗 Refs — Measured Behaviour</h2>

      <CodeBlock language="text" title="Verified in a real browser on react 19.2.6">
{`ref.current during the FIRST render          null
ref.current during the SECOND render         populated
   => never read ref.current during render to decide what to render

INLINE arrow callback ref, on every re-render:
   1. the OLD callback is called with null
   2. the NEW callback is called with the node
   (it is a new function identity each render, so React detaches/reattaches)
   => useCallback the ref, or accept the churn

Callback ref that RETURNS A CLEANUP (React 19):
   React NEVER calls it with null at all - it calls the cleanup instead.
   => the old "if (!node) return" guard is DEAD CODE in that form

ON UNMOUNT, the object ref is:
   still POPULATED during useLayoutEffect cleanup
   already NULL     during useEffect cleanup
   => teardown that needs the node MUST be in useLayoutEffect

forwardRef on 19.2.6: ZERO console warnings. Not deprecated today.`}
      </CodeBlock>

      <CodeBlock language="jsx" title="The four ref shapes">
{`// 1. DOM handle
const ref = useRef(null);  <input ref={ref} />  ref.current.focus();

// 2. instance storage that must NOT re-render
const timer = useRef(null);        // interval id, AbortController,
timer.current = setInterval(...);  // previous value, render counter

// 3. callback ref - fires when the node attaches/detaches.
//    The one case an object ref CANNOT do: measuring a node that
//    appears later. On mount the object ref is still null.
<div ref={(node) => {
  if (!node) return;
  setWidth(node.getBoundingClientRect().width);
}} />

// 4. useImperativeHandle - expose a NARROW api, not the node
useImperativeHandle(ref, () => ({ focus, scrollIntoView }), []);
// deps [] pins the handle to the FIRST render's closure;
// omitting deps rebuilds it every render. Measured: with [], the
// handle still returns render-0 values after a re-render.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Refs vs state, in one line">
        <p>
          If the UI must reflect it, it is <strong>state</strong>. If it must survive a render but
          never trigger one, it is a <strong>ref</strong>. Mutating a ref changes the value
          immediately but the screen keeps showing the old one until something else re-renders —
          measured: three increments show <code>0</code> on screen while{' '}
          <code>current</code> is already <code>3</code>. Full treatment in{' '}
          <a href="/react18/refs">Refs In Depth</a>.
        </p>
      </InfoBox>

      <h2>🆕 React 19.1 / 19.2 Additions</h2>

      <CodeBlock language="jsx" title="APIs added after the 19.0 release" showLineNumbers>
{`// ── useEffectEvent (19.2) — the sanctioned fix for stale closures in effects ──
// Extracts non-reactive logic out of an effect. The returned function has a
// STABLE identity but always sees the LATEST props/state. Never goes in deps.
import { useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showToast('Connected!', theme);   // reads latest 'theme'...
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('connected', onConnected);
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]);   // ...but 'theme' is NOT a dependency → no reconnect on theme change
}
// RULES: only call it from inside an effect, only declare it in the component/hook
// that uses it, never pass it to another component, never put it in a deps array.
// This replaces the old useRef "useLatest / useStableCallback" workaround.

// ── <Activity> (19.2) — hide a subtree without unmounting it ──
import { Activity } from 'react';

<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <ExpensiveTab />
</Activity>
// hidden: DOM stays in the tree (display:none), state and refs are PRESERVED,
//         effects are cleaned up, and re-renders happen at low priority.
// Use for: tab panels, wizard steps, prerendering the likely next route.
// NOT the same as {isVisible && <X />} — that unmounts and loses all state.

// ── cache() — dedupe/memoize async work per request (Server Components) ──
import { cache } from 'react';

const getUser = cache(async (id) => db.user.findUnique({ where: { id } }));
// Ten Server Components calling getUser(1) in one request = ONE query.
// Server Components only. Cache is scoped to a single request, then discarded.

// ── cacheSignal() (19.2) — abort work when the cache is discarded ──
import { cacheSignal } from 'react';
const res = await fetch(url, { signal: cacheSignal() });`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Rendering entry points — client, hydration, and SSR" showLineNumbers>
{`// ── CLIENT-ONLY (SPA — this is what Vite gives you) ──
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')).render(<App />);

// ── HYDRATION (attach to server-rendered HTML) ──
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />, {
  onCaughtError, onUncaughtError, onRecoverableError,
});
// hydrateRoot takes the JSX as the 2nd ARGUMENT — there is no .render() call.
// Mismatch between server HTML and the first client render = hydration error.

// ── SSR, Node streams (Express, etc.) ──
import { renderToPipeableStream } from 'react-dom/server';
const { pipe, abort } = renderToPipeableStream(<App />, {
  bootstrapScripts: ['/main.js'],
  onShellReady()  { res.statusCode = 200; pipe(res); },  // shell is flushable
  onShellError()  { res.statusCode = 500; res.send('<h1>Error</h1>'); },
  onError(err)    { logError(err); },
});

// ── SSR, Web streams (Cloudflare Workers, Deno, Bun, edge runtimes) ──
import { renderToReadableStream } from 'react-dom/server';
const stream = await renderToReadableStream(<App />, { bootstrapScripts: ['/main.js'] });

// ── prerender / prerenderToNodeStream (19.x) — static generation ──
// Same idea, but WAITS for all data before resolving instead of streaming.

// ── renderToString — legacy, synchronous, NO streaming, NO Suspense support ──
// Avoid in new code; it cannot wait for Suspense boundaries to resolve.`}
      </CodeBlock>

      <h2>🏗️ Enterprise Patterns — Advanced Reference</h2>

      <h3>API Adapter Layer</h3>
      <CodeBlock language="ts" title="Wire shape ↔ UI shape at one seam">
{`interface Adapter<TWire, TModel> {
  toModel(row: TWire): TModel;
  toWire(model: TModel): TWire;
}

// Fetch layer converts once; components see only TModel.
async function apiFetch<W, M>(url: string, init: RequestInit, adapter: Adapter<W, M>): Promise<M> {
  const res = await fetch(url, init);
  if (!res.ok) throw await parseApiError(res);
  const body = (await res.json()) as { data: W };
  return adapter.toModel(body.data);
}`}
      </CodeBlock>

      <h3>Error Envelope Normalization</h3>
      <CodeBlock language="ts" title="Discriminated union — every error kind handled once">
{`type ApiError =
  | { kind: 'validation'; fieldErrors: Record<string,string>; message: string }
  | { kind: 'business'; code: string; message: string }
  | { kind: 'auth'; message: string }
  | { kind: 'notFound'; message: string }
  | { kind: 'server'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'unknown'; message: string };

// Handle every case in a switch; use 'const _: never = error' to catch missing cases.`}
      </CodeBlock>

      <h3>Promise-Bridged Imperative Dialog</h3>
      <CodeBlock language="tsx" title="await confirm() from any component">
{`// Provider: resolver in a ref (not state) so Strict Mode doesn't lose it
const resolveRef = useRef<((v: boolean) => void) | null>(null);
const [current, setCurrent] = useState<ConfirmOptions | null>(null);

const confirm = useCallback((opts: ConfirmOptions) => {
  if (resolveRef.current) resolveRef.current(false); // supersede previous
  return new Promise<boolean>((resolve) => {
    resolveRef.current = resolve;
    setCurrent(opts);
  });
}, []);

// Caller
const ok = await confirm({ title: 'Delete?', danger: true });
if (ok) doDelete();`}
      </CodeBlock>

      <h3>Dual-Context Split</h3>
      <CodeBlock language="tsx" title="Read-many, write-rarely — split into two contexts">
{`// Auth as a canonical example
const AuthStateContext   = createContext<AuthState | null>(null);
const AuthActionsContext = createContext<AuthActions | null>(null);

// Header reads state; re-renders only when state changes
const { user } = useAuthState();

// Login button reads actions; never re-renders (stable identity)
const { login } = useAuthActions();

// Split only when: state changes on a schedule AND many consumers read AND few write.`}
      </CodeBlock>

      <h3>Module Federation Cheat Rules</h3>
      <CodeBlock language="text" title="MFE non-negotiables">
{`Singletons: react, react-dom, @mui/material, @emotion/react, @emotion/styled
            in every remote AND the shell.

Webpack:    optimization.concatenateModules: false (MUI + MF incompatibility)

Bootstrap:  main.ts → dynamic import('./bootstrap') so MF resolves shared deps
            before app code runs.

Remote URLs: fetched from a per-env overlay (remotePaths.json) at boot, not
             baked into the manifest at build time.

Isolation:   RemoteErrorBoundary per remote so one failed load doesn't
             crash the shell.

Contract:    shell exposes a small stable API; remotes never reach into
             shell internals.`}
      </CodeBlock>

      <h3>Feature-Based Folder Boundary</h3>
      <CodeBlock language="text" title="One rule to keep boundaries alive">
{`src/features/orders/
  ├─ components/, hooks/, api/, types.ts
  └─ index.ts        <-- ONLY exports here are reachable from outside

Enforce with ESLint:
  'no-restricted-imports': ['error', {
    patterns: [{ group: ['**/features/*/**'],
                 message: 'Import from features/<name> only.' }],
  }]

If a business-domain component ends up in shared/, the boundary is dead.`}
      </CodeBlock>

      <h3>The Enterprise Anti-Pattern Sweep</h3>
      <InfoBox variant="danger" title="Habits that quietly kill a large React codebase">
        <ul>
          <li>Wire shape leaking into components (no adapter layer).</li>
          <li>Error handling as string-checks on the response body.</li>
          <li>Confirm dialog with a hand-rolled open/close state per button.</li>
          <li>Single auth context that re-renders every consumer on token refresh.</li>
          <li>MFE built without singleton libs → mysterious "Invalid hook call" in prod.</li>
          <li>MFE deploy that points at localhost URLs in production.</li>
          <li>Layer-based folders past ~50 files (find-and-replace becomes archaeology).</li>
          <li>Business-domain components in <code>shared/</code>.</li>
        </ul>
      </InfoBox>

    </LessonLayout>
  );
}
