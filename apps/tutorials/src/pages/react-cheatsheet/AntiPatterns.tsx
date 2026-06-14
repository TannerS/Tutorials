import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function AntiPatterns() {
  return (
    <LessonLayout
      title="Anti-Patterns Quick Reference"
      sectionId="react-cheatsheet"
      lessonIndex={5}
      prev={{ path: '/react-cheatsheet/recipes', label: 'Common Recipes' }}
      next={null}
    >
      <p>
        Every common React mistake in one place — the bad pattern, why it breaks, and the fix.
        Four categories: State, Components, Effects, Performance.
      </p>

      {/* ══════════════════════════════════════════════════
          STATE ANTI-PATTERNS
      ══════════════════════════════════════════════════ */}
      <h2>State Anti-Patterns</h2>

      <h3>1. Storing derived state separately</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ fullName is derived from firstName + lastName — don't store it
const [firstName, setFirst] = useState('');
const [lastName,  setLast]  = useState('');
const [fullName,  setFull]  = useState('');          // stale if you forget to sync

useEffect(() => setFull(firstName + ' ' + lastName), [firstName, lastName]);

// ✅ Compute inline — always in sync, no extra state, no useEffect
const fullName = firstName + ' ' + lastName;`}
      </CodeBlock>

      <h3>2. State that should be a ref (doesn't affect rendering)</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ Storing a timer ID in state triggers a needless re-render on every setInterval
const [timerId, setTimerId] = useState(null);
useEffect(() => { setTimerId(setInterval(tick, 1000)); }, []);

// ✅ useRef — mutable, never triggers re-render
const timerRef = useRef(null);
useEffect(() => { timerRef.current = setInterval(tick, 1000); }, []);`}
      </CodeBlock>

      <h3>3. Mutating state directly</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ Mutation — React doesn't know the array changed, no re-render
const [items, setItems] = useState([]);
items.push(newItem);       // direct mutation
setItems(items);           // same reference — React bails out

// ✅ Always return a new reference
setItems(prev => [...prev, newItem]);                    // add
setItems(prev => prev.filter(x => x.id !== id));         // remove
setItems(prev => prev.map(x => x.id === id ? {...x, done: true} : x)); // update`}
      </CodeBlock>

      <h3>4. Mega-state object vs granular states</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ One big object — every field change re-renders all consumers
const [state, setState] = useState({ name: '', email: '', theme: 'light', modal: false });

// ✅ Split by update frequency / concern
const [name,  setName]  = useState('');
const [email, setEmail] = useState('');
const [theme, setTheme] = useState('light');
const [modal, setModal] = useState(false);
// Or useReducer when the fields are tightly related (form submit, etc.)`}
      </CodeBlock>

      <h3>5. Prop drilling instead of context or composition</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ Passing theme through 4 layers that don't use it
<App theme={theme}>
  <Layout theme={theme}>
    <Sidebar theme={theme}>
      <NavItem theme={theme} />   {/* only this one needs it */}

// ✅ Context — consumers subscribe directly
const ThemeCtx = createContext('light');
function NavItem() {
  const theme = useContext(ThemeCtx); // no prop needed
}

// ✅ Composition — pass the already-themed component as children
<Sidebar>
  <NavItem theme={theme} />   {/* theme passed once, at the right level */}
</Sidebar>`}
      </CodeBlock>

      <h3>6. Syncing state between components (instead of lifting)</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ Two components keeping their own copies in sync via useEffect
function Parent() {
  const [selected, setSelected] = useState(null);
  return <List onSelect={setSelected} />;   // List has its OWN selected state too
}

// ✅ Single source of truth — lift to the lowest common ancestor
function Parent() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <List selected={selected} onSelect={setSelected} />
      <Detail item={selected} />
    </>
  );
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          COMPONENT ANTI-PATTERNS
      ══════════════════════════════════════════════════ */}
      <h2>Component Anti-Patterns</h2>

      <h3>7. God components (doing too much)</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ One component fetches, renders, validates, and handles all interactions
function UserDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  // ... 4 more useEffects, 3 handlers, 300 lines of JSX

// ✅ Each piece has one job
function UserDashboard() {                // orchestrates
  return <DashboardLayout>
    <UserProfile />                       // owns user data + render
    <OrderHistory />                      // owns orders data + render
  </DashboardLayout>;
}
// Exception: a provider component that only renders {children} is fine
// even if it fetches from many sources — that IS its one responsibility.`}
      </CodeBlock>

      <h3>8. Index as key in dynamic lists</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ Index key — when items are removed/reordered, keys shift
// React reuses the component instance at each index position,
// so stale state (inputs, checkboxes) ends up on the wrong item
{items.map((item, i) => <Row key={i} item={item} />)}

// ✅ Stable ID from the data
{items.map(item => <Row key={item.id} item={item} />)}

// Index key is only safe when the list is static or append-only
// AND items have no internal state (no inputs, checkboxes, etc.)`}
      </CodeBlock>

      <h3>9. Prop explosion instead of composition</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ Component grows a prop for every variation
<Button size="lg" color="blue" iconLeft="check" iconRight="arrow"
        loading={true} disabled={false} fullWidth={true} rounded={true} />

// ✅ Composition — let the caller control the content
<Button size="lg" variant="primary">
  <CheckIcon /> Save <ArrowIcon />
</Button>`}
      </CodeBlock>

      <h3>10. Overusing context for everything</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ Using context for state that's only needed by one or two nearby components
const ModalContext = createContext();          // just to pass isOpen 2 levels down

// ✅ Local state + props for nearby components (context is for truly global state)
function Page() {
  const [open, setOpen] = useState(false);   // local — no context needed
  return <Modal isOpen={open} onClose={() => setOpen(false)} />;
}

// Context rule: reach for it when 3+ levels deep, or 5+ consumers, or
// the data genuinely belongs to the whole app (user, theme, locale).`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          EFFECT ANTI-PATTERNS
      ══════════════════════════════════════════════════ */}
      <h2>Effect Anti-Patterns</h2>

      <h3>11. useEffect for derived state</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ useEffect to compute filtered list — runs a render cycle late
const [filter, setFilter] = useState('all');
const [filtered, setFiltered] = useState(items);
useEffect(() => {
  setFiltered(filter === 'all' ? items : items.filter(x => x.status === filter));
}, [items, filter]);

// ✅ Compute directly — no extra state, no extra render, always in sync
const filtered = filter === 'all' ? items : items.filter(x => x.status === filter);
// If expensive: const filtered = useMemo(() => ..., [items, filter]);`}
      </CodeBlock>

      <h3>12. useEffect as an event handler</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ useEffect watching state to fire a side effect
const [submitted, setSubmitted] = useState(false);
useEffect(() => {
  if (submitted) { sendAnalytics('form_submitted'); setSubmitted(false); }
}, [submitted]);

// ✅ Just call it in the handler — effects are for syncing with external systems,
// not for responding to user events
function handleSubmit() {
  sendAnalytics('form_submitted');  // called directly, no effect needed
  saveForm();
}`}
      </CodeBlock>

      <h3>13. Stale closures (missing deps)</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ count captured at 0, never updates — always logs 0
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []);   // ← missing count

// ✅ Include count in deps (re-creates interval when count changes)
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, [count]);

// ✅ Or use a ref to always read the latest value without re-subscribing
const countRef = useRef(count);
useEffect(() => { countRef.current = count; });
useEffect(() => {
  const id = setInterval(() => console.log(countRef.current), 1000);
  return () => clearInterval(id);
}, []);   // stable — reads ref, not stale closure`}
      </CodeBlock>

      <h3>14. Race conditions in fetch</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ If userId changes quickly, an older response can overwrite a newer one
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);

// ✅ AbortController cancels the previous request on cleanup
useEffect(() => {
  const ctrl = new AbortController();
  fetch('/api/users/' + userId, { signal: ctrl.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
  return () => ctrl.abort();
}, [userId]);`}
      </CodeBlock>

      <h3>15. Infinite loops</h3>
      <CodeBlock language="jsx" title="❌ Common loop causes → ✅ Fix">
{`// ❌ Object in deps — new reference every render → effect runs every render
useEffect(() => { fetchData(options) }, [options]);  // options = { page: 1 } inline

// ✅ Stable dep (primitive or memoized)
useEffect(() => { fetchData({ page }) }, [page]);    // primitive dep

// ❌ setState inside effect with no condition → render → effect → render...
useEffect(() => { setCount(count + 1); });           // no deps = runs every render

// ✅ Conditional update or proper deps
useEffect(() => { if (count < 5) setCount(c => c + 1); }, [count]);`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          PERFORMANCE ANTI-PATTERNS
      ══════════════════════════════════════════════════ */}
      <h2>Performance Anti-Patterns</h2>

      <h3>16. Inline objects/arrays/functions passed as props or deps</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ New reference every render — breaks React.memo and useEffect deps
<Child style={{ color: 'red' }} />                   // new object every render
<Child items={[1, 2, 3]} />                          // new array every render
<Child onClick={() => doThing(id)} />                // new function every render

useEffect(() => { fetch(options) }, [options]);      // options inline → runs every render

// ✅ Stabilize with useMemo / useCallback / module-level constants
const style = useMemo(() => ({ color: 'red' }), []);
const items = useMemo(() => [1, 2, 3], []);
const handleClick = useCallback(() => doThing(id), [id]);

// Or, if truly static — move completely outside the component
const STATIC_STYLE = { color: 'red' };               // created once, module scope`}
      </CodeBlock>

      <h3>17. React.memo with unstable props (useless memo)</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ React.memo is useless if any prop is a new reference every render
const Child = React.memo(({ onSave, config }) => { ... });

function Parent() {
  return <Child onSave={() => save()} config={{ mode: 'edit' }} />; // memo does nothing
}

// ✅ memo only works when ALL props are stable
function Parent() {
  const onSave = useCallback(() => save(), []);
  const config = useMemo(() => ({ mode: 'edit' }), []);
  return <Child onSave={onSave} config={config} />;  // memo works now
}

// Also: React.memo does NOT prevent re-renders from useContext.
// A consumer always re-renders when its context value changes, memo or not.`}
      </CodeBlock>

      <h3>18. Not using code splitting for large routes</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ Everything bundled together — user downloads all routes on first visit
import Dashboard from './pages/Dashboard';   // 420 KB included in main bundle
import AdminPanel from './pages/AdminPanel'; // 490 KB included in main bundle

// ✅ React.lazy + Suspense — bundler splits each into its own chunk file
import { lazy, Suspense } from 'react';
const Dashboard  = lazy(() => import('./pages/Dashboard'));   // chunk: dashboard.js
const AdminPanel = lazy(() => import('./pages/AdminPanel')); // chunk: adminpanel.js

// Wrap in Suspense as close as possible to the lazy component (not at the root!)
<Route path="/dashboard" element={
  <Suspense fallback={<PageSkeleton />}>
    <Dashboard />
  </Suspense>
} />

// First visit to /dashboard: downloads dashboard.js (first time only)
// Second visit: loads from browser cache instantly — zero network cost
// /admin never visited: adminpanel.js never downloaded`}
      </CodeBlock>

      <h3>19. Premature optimization (memoizing everything)</h3>
      <CodeBlock language="jsx" title="❌ Bad → ✅ Fix">
{`// ❌ Wrapping cheap operations in useMemo — costs more than it saves
const doubled = useMemo(() => count * 2, [count]);   // multiplication is instant
const label   = useMemo(() => \`User: \${name}\`, [name]); // string concat is instant

// ✅ useMemo only for expensive work or stable references that matter
const filtered = useMemo(
  () => largeList.filter(expensiveCheck),  // ✅ genuinely expensive
  [largeList]
);
const value = useMemo(
  () => ({ user, settings }),              // ✅ context value — needs stable ref
  [user, settings]
);

// Rule: profile first, optimize second. React DevTools Profiler → Ranked chart
// shows which components are actually slow. Don't memo what you haven't measured.`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          SUMMARY TABLE
      ══════════════════════════════════════════════════ */}
      <h2>Summary — One-Line Rules</h2>
      <CodeBlock language="text" title="All 19 anti-patterns at a glance">
{`STATE
  1. Derived state stored separately  →  compute inline (or useMemo)
  2. Timer/ref value in useState      →  use useRef instead
  3. Mutating state directly          →  always return a new reference
  4. One mega-state object            →  split by update frequency / concern
  5. Prop drilling                    →  context (deep) or composition (nearby)
  6. Two components syncing state     →  lift state to lowest common ancestor

COMPONENTS
  7. God component                    →  split; extract custom hooks; provider = fine
  8. Index as key (dynamic list)      →  use stable item.id
  9. Prop explosion                   →  composition + children
 10. Context for everything           →  local state first; context for truly global data

EFFECTS
 11. useEffect for derived state      →  compute inline, skip the effect entirely
 12. useEffect as event handler       →  call the side effect directly in the handler
 13. Missing deps (stale closure)     →  include all captured variables in deps array
 14. Race condition in fetch          →  AbortController + abort() in cleanup
 15. Infinite loop                    →  stable deps (primitives or memoized objects)

PERFORMANCE
 16. Inline object/array/function     →  useMemo / useCallback / module-level const
 17. React.memo with unstable props   →  stabilize ALL props first, then memo
 18. No code splitting                →  React.lazy + dynamic import + per-route Suspense
 19. Memoizing everything             →  profile first (DevTools Profiler), optimize second`}
      </CodeBlock>

      <InfoBox variant="tip" title="The two most common mistakes in production">
        <p>
          <strong>#16 (inline objects/functions)</strong> and <strong>#17 (useless React.memo)</strong> are
          the most frequent performance bugs. They often appear together — someone adds{' '}
          <code>React.memo</code> to fix performance, but the component still gets an inline
          function as a prop, so <code>Object.is</code> fails on every render and memo does nothing.
          The fix is always: stabilize the props first, then memo.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>#11 (useEffect for derived state)</strong> is the most common correctness bug.
          If a value can be computed from existing state or props, computing it inline is
          simpler, always in sync, and needs no cleanup.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
