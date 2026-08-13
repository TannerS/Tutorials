import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideAdvancedRendering() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Scaling Re-Render Performance"
      tagline="Large-codebase techniques for when memo alone isn't enough — where to actually put state, how to find the real bottleneck, and what changes with the React Compiler."
      meta={['React 19', '10 techniques']}
      footerLabel="Personal study reference — Rendering at Scale"
      pageLabel="React 19 Field Guide · Scaling Renders"
      prev={{ path: '/react-field-guide/stability', label: 'Re-Renders, Memo & Stability' }}
      next={{ path: '/react-field-guide/gotchas', label: 'Gotchas & Anti-Patterns' }}
    >
      <PosterCard
        glyph="Co"
        title={<>State Colocation<span className="dim"> — the #1 fix</span></>}
        code={`// ❌ Search input's state lives at the top — every keystroke
// re-renders the ENTIRE dashboard, sidebar, and every widget
function Dashboard() {
  const [query, setQuery] = useState('');
  return <><Sidebar /><SearchBox query={query} onChange={setQuery} /><Widgets /></>;
}

// ✅ Move state down into the component that actually owns it —
// keystrokes only re-render SearchBox and its children
function Dashboard() {
  return <><Sidebar /><SearchBox /><Widgets /></>;
}
function SearchBox() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`}
        caption="The highest-leverage fix in a large codebase isn't memo — it's not lifting state higher than it needs to be. State lifted 'just in case a sibling needs it later' turns every update into a whole-subtree cascade. Lift only when a sibling actually needs it."
      />

      <PosterCard
        glyph="Sp"
        title={<>Split Context: State vs Actions</>}
        code={`// setUser/login never change identity — split them out so
// components that only DISPATCH never re-render on state change
const AuthStateCtx = createContext(null);     // { user } — changes often
const AuthActionsCtx = createContext(null);   // { login, logout } — stable forever

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const actions = useMemo(() => ({
    login: (u) => setUser(u),
    logout: () => setUser(null),
  }), []); // empty deps — setUser is always stable, so this never changes
  const state = useMemo(() => ({ user }), [user]);
  return <AuthActionsCtx value={actions}><AuthStateCtx value={state}>{children}</AuthStateCtx></AuthActionsCtx>;
}
// A LogoutButton reading only AuthActionsCtx NEVER re-renders — ever.`}
        caption="One shared context for both state and actions means every dispatcher-only consumer (buttons, forms) re-renders on every state change too. Splitting means a component that only calls actions has a permanently stable subscription."
      />

      <PosterCard
        glyph="Hk!"
        title={<>Custom Hooks Can Leak Instability</>}
        code={`// ❌ Returns a NEW object every call — even if width/height
// haven't changed, any memo'd consumer of this hook re-renders
function useWindowSize() {
  const [size, setSize] = useState({ width: innerWidth, height: innerHeight });
  useEffect(() => { /* ...resize listener... */ }, []);
  return { width: size.width, height: size.height }; // new object, every call
}

// ✅ Return the state object directly — same ref until setSize runs
function useWindowSize() {
  const [size, setSize] = useState({ width: innerWidth, height: innerHeight });
  useEffect(() => { /* ...resize listener... */ }, []);
  return size; // stable until it actually changes
}`}
        caption="A custom hook is just a function — if it builds a fresh object/array on every call before returning it, every component that uses it inherits that instability, and every memo downstream of it silently stops working. Easy to miss because the bug lives in the hook, not the component that broke."
      />

      <PosterCard
        glyph="Km"
        title={<>key Changes = Remount<span className="dim">, not re-render</span></>}
        code={`// ❌ A new key on every render — this isn't optimization,
// it's destroying and recreating the component every time
<UserCard key={Math.random()} user={user} />

// ❌ Accidental non-stable key in a large refactor
<Row key={JSON.stringify(item)} item={item} /> // new string if item is a new object

// ✅ Intentional use: force a full reset when the identity changes
<EditForm key={selectedUserId} /> // switching users = fresh form state`}
        caption="Remounting is far more expensive than re-rendering — every hook re-initializes, every effect's cleanup and setup reruns, all DOM nodes are destroyed and recreated. In a large codebase, an accidentally-unstable key silently costs 10-100x more than the re-render it was trying to avoid."
      />

      <PosterCard
        glyph="Tx"
        title={<>Deprioritize <span className="dim">instead of prevent</span></>}
        code={`const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();

function handleChange(e) {
  setQuery(e.target.value);              // urgent — input stays snappy
  startTransition(() => {
    setFilteredResults(search(e.target.value)); // low priority, interruptible
  });
}
// The expensive re-render still happens — React just lets a newer
// urgent update (the next keystroke) interrupt and supersede it.`}
        caption="Not every expensive re-render needs to be avoided — sometimes the fix is telling React it can wait. useTransition/useDeferredValue don't reduce the NUMBER of re-renders, they change their priority so the UI never feels blocked."
      />

      <PosterCard
        glyph="Cp"
        title={<>The React Compiler<span className="dim"> changes the calculus</span></>}
        language="text"
        code={`If the compiler is enabled on your project (check babel-plugin-
react-compiler / the "rc" flag in your build config):

  It auto-inserts useMemo/useCallback/memo equivalents for you
  at BUILD time, for any component/hook that follows the Rules
  of React (pure render, no mutating props/state/refs mid-render).

  Manual useMemo/useCallback become mostly unnecessary — but
  ONLY for code the compiler can prove is safe to memoize.
  Code that breaks the rules (mutation, non-idempotent render)
  silently opts OUT of compiler memoization for that component.`}
        caption="Ask on day one whether the codebase has the React Compiler enabled — it inverts a lot of this page's advice from 'do this manually' to 'the compiler already does this, don't fight it.' It doesn't remove the need to understand WHY, since broken rules silently lose the optimization."
      />

      <PosterCard
        glyph="Pr"
        title={<>Find It, Don't Guess It</>}
        language="text"
        code={`Before adding memo/useMemo anywhere:

  1. React DevTools → Profiler tab → record a session → interact
  2. Flame graph: wider bar = took longer to render
  3. Click a component → "Why did this render?" panel tells you
     exactly which prop/state/context changed
  4. Settings gear → "Highlight updates when components render"
     → see re-renders flash in the actual running app, live

Optimizing a component that wasn't actually slow adds
complexity (deps arrays to maintain, bugs to introduce) for
zero measured benefit.`}
        caption="In a large codebase, guessing which component to memo wastes time and adds maintenance burden. The Profiler's 'why did this render' panel gives you the exact cause — use it before reaching for useMemo/useCallback/memo, not after."
      />

      <PosterCard
        glyph="Cm"
        title={<>memo's Second Argument<span className="dim"> — custom compare</span></>}
        code={`// Default: shallow-compares every prop with Object.is.
// Custom comparator: you decide which props actually matter.
const Chart = memo(function Chart({ data, onExport }) {
  /* ...renders data, onExport is only used on click, not render... */
}, (prevProps, nextProps) => {
  // Return true to SKIP re-render (props treated as equal)
  return prevProps.data === nextProps.data; // ignore onExport entirely
});`}
        caption="An escape hatch for when a prop changes identity often but genuinely doesn't affect what gets rendered (e.g., a callback only used in a click handler). Use sparingly — a wrong comparator silently skips renders that should have happened."
      />

      <PosterCard
        glyph="Sl"
        title={<>Selector Pattern <span className="dim">(what stores do internally)</span></>}
        code={`// Context: ANY value change re-renders EVERY consumer.
// External stores (Zustand/Redux/Jotai) use useSyncExternalStore
// with a SELECTOR, so a component only re-renders when the
// SLICE it selected actually changes:
const userName = useStore(state => state.user.name); // only this
const cartCount = useStore(state => state.cart.length); // only this
// Both read the same store, but a cart update never re-renders
// the component that only selected user.name.`}
        caption="This is the structural fix Context can't offer natively — Context has no concept of 'subscribe to part of the value.' If a large codebase has many far-apart consumers of a frequently-changing global value, this is usually the actual answer, not more useMemo."
      />

      <PosterCard
        glyph="Rp"
        title={<>Render Props <span className="dim">obey the same rules</span></>}
        code={`// ❌ Still a new function every render — same as any inline prop
<DataFetcher render={(data) => <Table data={data} />} />

// ✅ Stabilize it exactly like any other function prop
const renderTable = useCallback((data) => <Table data={data} />, []);
<DataFetcher render={renderTable} />`}
        caption="Advanced composition patterns (render props, compound components, slots) don't get special treatment from React — a render-prop function is exactly as unstable as any other inline function, and breaks memo the same way if DataFetcher is memoized internally."
      />

      <PosterQuickRef
        title="Large-codebase re-render checklist"
        rows={[
          { need: 'Whole page re-renders on one input keystroke', answer: 'State colocation — move state down' },
          { need: 'A button-only component re-renders on unrelated state', answer: 'Split context into state vs actions' },
          { need: 'memo works everywhere except one custom hook\'s consumers', answer: 'The hook returns a new object/array every call' },
          { need: 'A component\'s internal state keeps resetting', answer: 'Its key is changing — check what generates it' },
          { need: 'Typing feels laggy during a big list re-render', answer: 'useTransition on the expensive update' },
          { need: 'Unsure if manual memo is even needed', answer: 'Check if the React Compiler is enabled first' },
          { need: 'Don\'t know which component is actually slow', answer: 'DevTools Profiler → "why did this render"' },
          { need: 'Many distant consumers of one global store', answer: 'Selector pattern (useSyncExternalStore), not Context' },
        ]}
      />
    </PosterLayout>
  );
}
