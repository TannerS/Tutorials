import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideStability() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Re-Renders, Memo & Stability"
      tagline="What actually causes a re-render, what 'stable' means, and exactly what breaks memo — the mental model, not just the syntax."
      meta={['React 19', '14 concepts']}
      footerLabel="Personal study reference — React Rendering Model"
      pageLabel="React 19 Field Guide · Stability"
      prev={{ path: '/react-field-guide/testing', label: 'Testing Quick Reference' }}
      next={{ path: '/react-field-guide/advanced-rendering', label: 'Scaling Re-Render Performance' }}
    >
      <PosterCard
        glyph="Tr"
        title="The 4 Re-Render Triggers"
        language="text"
        code={`1. setState() called          → this component re-renders
2. Parent re-renders           → ALL children re-render (cascade)
3. Context value changes       → ALL consumers re-render (skips memo)
4. useReducer dispatch called  → this component re-renders

That's it. Props changing is NOT a trigger by itself —
the parent re-rendering is what pushes new props down.`}
        caption="React never checks 'did props change' before re-rendering a child — it cascades unconditionally. React.memo exists specifically to add that missing check."
      />

      <PosterCard
        glyph="=?"
        title={<>Stable<span className="dim"> = passes Object.is()</span></>}
        language="text"
        code={`Object.is(valueLastRender, valueThisRender)

  true  → STABLE    (safe in deps, safe as a memo prop)
  false → UNSTABLE   (deps re-fire, memo bails and re-renders)

Primitives compare by VALUE:     42 === 42 → stable
Objects/arrays/fns compare by REF: {} !== {} → unstable
  (even with identical contents — it's a NEW object)`}
        caption="This one rule explains every 'gotcha' below. Everything else — deps arrays, memo, context — is just this comparison applied in three different places."
      />

      <PosterCard
        glyph="Hk"
        title="Stability by Hook"
        language="text"
        code={`useState value      stable  — until the setter is called
useState setter      stable  — always, same fn forever
useReducer dispatch  stable  — always, never changes
useRef (the object)  stable  — always, same object every render
useRef.current        varies  — you control it, mutation doesn't re-render
useMemo result       stable  — until a dep changes
useCallback result    stable  — until a dep changes
useContext value      varies  — stable only if the Provider's value is memoized`}
        caption="Only six things are stable by default. Everything else you write inline — objects, arrays, arrow functions — is a new reference on every single render."
      />

      <PosterCard
        glyph="Mo"
        title={<>React.memo<span className="dim"> — what it actually checks</span></>}
        code={`const Row = memo(function Row({ user, onSelect }) {
  return <li onClick={() => onSelect(user.id)}>{user.name}</li>;
});

// memo shallow-compares EVERY prop with Object.is.
// One unstable prop = memo bails out = re-renders anyway.
// It does NOT look at children, does NOT look at context,
// does NOT stop the component's OWN setState from re-rendering it.`}
        caption="Memo adds exactly one check: 'are all props Object.is-equal to last time?' It's necessary but not sufficient — the parent has to hand it stable references too."
      />

      <PosterCard
        glyph="!fn"
        title={<>Inline Function Prop<span className="dim"> breaks memo</span></>}
        code={`// ❌ () => {} is a NEW function object every render
<Row user={user} onSelect={() => setSelectedId(user.id)} />

// ✅ Stable reference — memo can actually skip this row
const onSelect = useCallback((id) => setSelectedId(id), []);
<Row user={user} onSelect={onSelect} />`}
        caption="Yes — an inline arrow function is a brand new object every render, same as any other object literal. Object.is sees a different reference and memo re-renders the child, even though the function 'does the same thing.'"
      />

      <PosterCard
        glyph="!{}"
        title={<>Inline Object Prop<span className="dim"> — same problem</span></>}
        code={`// Only a problem if Panel is memo'd. If it isn't, Panel
// re-renders from the parent cascade anyway and the inline
// object changed nothing.
const Panel = memo(function Panel({ style, config }) { /* ... */ });

// ❌ New object every render, even with identical values
<Panel style={{ padding: 16 }} config={{ mode: 'edit' }} />

// ✅ Stabilize with useMemo — same ref until deps change
const style = useMemo(() => ({ padding: 16 }), []);
const config = useMemo(() => ({ mode: 'edit' }), []);
<Panel style={style} config={config} />`}
        caption="{ padding: 16 } creates a fresh object on the heap every render, and Object.is compares the reference, not the contents — so memo treats it as changed. But note the precondition: an inline object prop does not cause a re-render on its own. Without memo on the receiver there is nothing to defeat, and the useMemo is pure overhead."
      />

      <PosterCard
        glyph="1+1"
        title={<>memo + stable props<span className="dim"> = ONE technique</span></>}
        language="text"
        code={`memo, no stable props   → memo bails every render. No gain.
stable props, no memo   → child re-renders anyway. No gain.
memo + stable props     → the child actually skips. ✅

Neither half does anything alone. Half-applying it is the
most common "I optimized it and nothing got faster" bug —
and useCallback/useMemo on props nobody memoized is
strictly negative: allocation + deps checks, zero payoff.`}
        caption="Treat these as one inseparable technique, never as two separate tips. The corollary matters just as much in reverse: an inline object or arrow function is not a performance bug by itself — it only costs anything when the receiving component is memo'd."
      />

      <PosterCard
        glyph="Cx"
        title={<>Context Bypasses memo<span className="dim"> entirely</span></>}
        code={`const MemoPanel = memo(function Panel() {
  const theme = useContext(ThemeCtx); // subscribed
  return <div className={theme}>...</div>;
});

// MemoPanel has ZERO props, but still re-renders
// every time ThemeCtx's value changes. memo never
// even gets a chance to compare — context re-renders
// are a separate mechanism that doesn't go through props.`}
        caption="This is the #1 memo surprise: memoizing a component does nothing to stop it re-rendering from a context value it reads via useContext. Memo only guards the props path."
      />

      <PosterCard
        glyph="{}!"
        title={<>The Provider {'{}'} Trap<span className="dim"> — yes, this is why</span></>}
        code={`// ❌ { user, permissions } is a NEW object every render of Provider
<AuthCtx value={{ user, permissions }}>
  {children}
</AuthCtx>
// Every consumer re-renders on EVERY Provider render,
// even if user and permissions haven't actually changed.

// ✅ Memoize the value — same ref unless deps actually change
const value = useMemo(() => ({ user, permissions }), [user, permissions]);
<AuthCtx value={value}>{children}</AuthCtx>`}
        caption="Directly answers 'does value={{ foo: 'bar' }} cause re-renders': yes. The object literal is recreated every time the Provider component runs, so Object.is always reports a change, and every consumer re-renders — regardless of whether user or permissions actually changed."
      />

      <PosterCard
        glyph="Sh"
        title={<>Should You memo <span className="dim">a Provider component?</span></>}
        code={`// Wrapping the PROVIDER in memo doesn't help consumers —
// they don't re-render because Provider re-rendered,
// they re-render because the VALUE reference changed.
const AuthProvider = memo(function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthCtx value={value}>{children}</AuthCtx>;
});
// ^ memo() here is doing nothing useful. The useMemo is what matters.`}
        caption="memo on a Provider guards against ITS parent re-rendering it for unrelated reasons — a real but secondary win. The value passed to .Provider is what determines consumer re-renders, so useMemo on the value is the fix that actually matters, not memo on the component."
      />

      <PosterCard
        glyph="Ef"
        title={<>Unstable Deps <span className="dim">in useEffect</span></>}
        code={`// ❌ { page: 1 } is a new object every render → effect re-fires every render
useEffect(() => {
  fetchResults(options);
}, [options]); // options = { page } created inline above

// ✅ Depend on the primitive that's actually inside it
useEffect(() => {
  fetchResults({ page });
}, [page]);`}
        caption="Same Object.is rule, third location: an unstable value in a dependency array never equals its previous self, so the effect re-runs on every render — often silently, since nothing visibly breaks until it's an infinite fetch loop."
      />

      <PosterCard
        glyph="Rd"
        title={<>Reducers must preserve<span className="dim"> identity on no-ops</span></>}
        code={`// ❌ filter() ALWAYS allocates a new array — even when it
// removes nothing. Every REMOVE for a missing id re-renders.
case 'REMOVE': return { ...s, todos: s.todos.filter(t => t.id !== id) };

// ✅ Bail out when the action changed nothing
case 'REMOVE': {
  const todos = s.todos.filter(t => t.id !== id);
  return todos.length === s.todos.length ? s : { ...s, todos };
}

// Make it a contract your tests enforce:
expect(reducer(state, { type: 'REMOVE', id: 'missing' })).toBe(state);`}
        caption="Returning the SAME state object lets React skip the re-render entirely. filter/map/slice/spread allocate unconditionally, so a no-op action silently produces a new reference and defeats every memo downstream. toBe (reference equality), not toEqual, is what makes it a real test."
      />

      <PosterCard
        glyph="Ch"
        title={<>children as Props<span className="dim"> — the escape hatch</span></>}
        code={`function App() {
  return <Panel><ExpensiveTree /></Panel>;  // App owns this JSX
}
function Panel({ children }) {
  const [open, setOpen] = useState(false);   // Panel's own state
  return <div>{children}</div>;              // same children ref — no re-render
}
// ExpensiveTree does NOT re-render when Panel's 'open' state changes —
// its JSX was created by App, and App didn't re-render.`}
        caption="children is just a prop. If the component that created that JSX didn't re-render, the reference is unchanged and React skips re-rendering it — no memo needed. Breaks if App itself re-renders, or if Panel is also a context consumer."
      />

      <PosterCard
        glyph="Pu"
        title={<>Pure Components <span className="dim">= memo candidates</span></>}
        code={`// Pure: output depends ONLY on props, no internal state
function Badge({ count }) { return <span>{count}</span>; }  // ✅ safe to memo

// NOT pure: has its own state, changes independent of props
function Counter({ initial }) {
  const [n, setN] = useState(initial);   // ❌ memo can't detect this changing
  return <button onClick={() => setN(n+1)}>{n}</button>;
}`}
        caption="memo only ever compares props. If a component has its own state or reads context, it can change on its own — memo is irrelevant to that, and wrapping it in memo() doesn't cause bugs but also doesn't do anything for its internal re-renders."
      />

      <PosterQuickRef
        title="Why did this actually re-render?"
        rows={[
          { need: 'Parent re-rendered', answer: 'Cascade — memo it + stabilize its props' },
          { need: 'This component called setState', answer: 'Expected — memo cannot prevent this' },
          { need: 'A context value it reads changed', answer: 'Context bypasses memo entirely' },
          { need: 'memo() but still re-renders', answer: 'One prop is an inline object/array/fn' },
          { need: 'value={{ a, b }} on a Provider', answer: 'New object every render — useMemo it' },
          { need: 'useEffect fires every render', answer: 'Unstable value in the deps array' },
          { need: 'onClick={() => fn()} passed to memo child', answer: 'New function ref — useCallback it' },
          { need: 'I stabilized the props and nothing improved', answer: 'The child was never memo’d — you need both halves' },
          { need: 'Inline object prop on a NON-memo child', answer: 'Costs nothing — do not useMemo it' },
          { need: 'Dispatching a no-op action still re-renders', answer: 'Reducer returned a fresh object — return the same state' },
          { need: 'Should I memo this at all?', answer: 'Only if: expensive + parent renders often + props rarely change' },
        ]}
      />
    </PosterLayout>
  );
}
