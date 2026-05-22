import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function CheatSheet() {
  return (
    <LessonLayout
      title="📋 React Cheat Sheet"
      sectionId="react19"
      lessonIndex={13}
      prev={{ path: '/react19/build-toolchain', label: 'Build Toolchain' }}
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
Context consumers re-render too often?        → useMemo the provider value object
Should I memo this component?                 → Only if: expensive + parent re-renders often + props rarely change
Should I useMemo this value?                  → Only if: passed to memo'd child, in deps array, or in context value
Should I useCallback this function?           → Only if: passed to memo'd child or in deps array
useState vs useMemo for stable ref?           → useState = might change later; useMemo = derived from other values
Why does memo + context not work?             → Memo checks PROPS only. Context bypasses it entirely.
Arrow function vs named function?             → Named function for components (auto name in DevTools)`}
      </CodeBlock>

      <InfoBox variant="success" title="The Golden Rule">
        <p>React re-renders are <strong>not the enemy</strong> — unnecessary re-renders of <strong>expensive components</strong> are. Don't optimize everything. Profile first, then apply memo + stabilization only where it matters. The React Compiler (coming soon) will do most of this automatically.</p>
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
useTransition           [isPending, fn]   ✅ Always  Both are stable
useDeferredValue        deferredValue     ⚠️  Varies  New ref when source changes`}
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
setState before await + setState after await          2         await splits the block
setState in 3 separate setTimeout calls               3         Each callback = own block
setState in 3 separate .then() calls                  3         Each .then = own microtask
dispatch(action) once (updates 5 state fields)        1         Always 1 — atomic update
setState + dispatch in same handler                   1         Auto-batched together

WHAT BREAKS A BATCH (creates new synchronous block):
  • await                     • setTimeout/setInterval callbacks
  • .then() callbacks         • requestAnimationFrame callbacks
  • Separate event listeners

WHAT DOESN'T BREAK A BATCH (same sync block):
  • for/while loops           • if/else branches
  • Function calls            • .map/.filter/.reduce
  • Any synchronous code`}
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

    </LessonLayout>
  );
}
