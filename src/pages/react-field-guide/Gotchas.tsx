import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideGotchas() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Gotchas & Anti-Patterns"
      tagline="The got-ya moments — things that silently break, pass code review, and don't show up until production. Won't need to google it."
      meta={['React 19', '12 gotchas']}
      footerLabel="Personal study reference — React Gotchas"
      pageLabel="React 19 Field Guide · Gotchas"
      prev={{ path: '/react-field-guide/advanced-rendering', label: 'Scaling Re-Render Performance' }}
      next={{ path: '/react-field-guide/server-components', label: 'Server Components & Actions' }}
    >
      <PosterCard
        glyph="SC"
        title={<>Stale Closures<span className="dim"> in useEffect</span></>}
        code={`useEffect(() => {
  const id = setInterval(() => {
    console.log('Polling room:', roomId); // captured from FIRST render
    fetch(\`/api/rooms/\${roomId}/messages\`);
  }, 5000);
  return () => clearInterval(id);
}, []); // ❌ roomId missing — closure never sees updates`}
        caption="The effect's closure captures roomId's value from the render that created it. Since the effect never re-runs, it keeps using the original value forever. Fix: add roomId to deps, or read the latest value from a ref."
      />

      <PosterCard
        glyph="Dp"
        title="Missing Dependency Arrays"
        code={`// ❌ New object every render — reference changes = infinite loop
useEffect(() => {
  fetch('/api/data', { headers: { Authorization: \`Bearer \${token}\` } });
}, [{ token }]);

// ✅ Primitive dependency — stable across renders
useEffect(() => {
  fetch('/api/data', { headers: { Authorization: \`Bearer \${token}\` } });
}, [token]);`}
        caption="An object or array literal in the dependency array is a new reference every render, so the effect thinks its inputs changed and re-runs endlessly. Depend on primitives, or memoize the object first."
      />

      <PosterCard
        glyph="Mu"
        title="Mutating State Directly"
        code={`// ❌ push mutates the existing array — same reference
todos.push(newTodo);
setTodos(todos); // React bails out, no re-render

// ✅ always return a new reference
setTodos(prev => [...prev, newTodo]);`}
        caption="React uses Object.is to detect changes. Mutating an array or object keeps the same reference, so React thinks nothing changed and skips the re-render — your UI silently goes stale."
      />

      <PosterCard
        glyph="∞"
        title="Infinite Re-render Loops"
        code={`// THE TEST: an effect loops only if it WRITES its own dependency.
// Compare the deps array against what the body sets. Overlap = loop.

// ❌ No deps = every value is a dependency; it writes count
useEffect(() => { setCount(count + 1); });

// ❌ Writes items, depends on items
useEffect(() => { setItems([...items, newItem]); }, [items]);

// ✅ Writes items, depends on query — no overlap, no loop
useEffect(() => { setItems(fetchFor(query)); }, [query]);`}
        caption="Read the deps array, read what the body sets, and look for overlap — that one test explains every infinite-loop effect without needing to trace the cycle. No deps array means EVERY value is a dependency, which is why it's the easiest way to trigger this. Watch for the indirect form too: writing state that an unstable dep is derived from counts as writing the dep."
      />

      <PosterCard
        glyph="Ky"
        title="Key Prop Misuse"
        code={`// ❌ Index key — shifts when items are reordered or removed
{messages.map((msg, i) => <MessageItem key={i} message={msg} />)}

// ✅ Stable, unique id
{messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}`}
        caption="React matches elements between renders by key. With index keys, deleting item #2 shifts every later item's index — React reuses the wrong DOM node's local state (inputs, checkboxes) for the wrong item."
      />

      <PosterCard
        glyph="SM"
        title="StrictMode Double-Invoking"
        language="text"
        code={`Development only, with <StrictMode>:
  • Component functions called TWICE per render
  • Effects mount → unmount → mount (double-invoked)
  • useState / useReducer initializers run twice

Production: everything runs exactly once, no double-invoking.`}
        caption="React intentionally double-invokes render and effects in dev to surface impure code and missing cleanup — it's not a bug, and duplicate console.logs are expected. If double-invoking breaks something, it was already broken."
      />

      <PosterCard
        glyph="Ho"
        title="Calling Hooks Conditionally"
        code={`// ❌ Breaks the hooks call order on renders where isLoggedIn is false
if (isLoggedIn) {
  const [user, setUser] = useState(null);
}

// ✅ Always call the hook — branch on the VALUE instead
const [user, setUser] = useState(null);
if (isLoggedIn) { /* use user */ }`}
        caption="React associates each hook with its position in a per-component call-order list, not by name. A hook inside a conditional shifts every subsequent hook's slot on renders where the branch is skipped, corrupting all their state."
      />

      <PosterCard
        glyph="Pd"
        title={<>Prop Drilling<span className="dim"> vs Context</span></>}
        code={`// ❌ Dashboard and Sidebar don't use theme, just forward it
<Dashboard theme={theme} setTheme={setTheme} />

// ✅ Context — only the actual consumer subscribes
const ThemeCtx = createContext(initial);
<ThemeCtx.Provider value={{ theme, setTheme }}><Dashboard /></ThemeCtx.Provider>
// deep in the tree: const { theme } = useContext(ThemeCtx);`}
        caption="Prop drilling through components that don't use the value makes every intermediate layer fragile to refactor. But don't over-correct — every Context consumer re-renders on any value change, so keep fast-changing state out of it."
      />

      <PosterCard
        glyph="Dr"
        title="useEffect for Derived State"
        code={`// ❌ One stale render frame before the effect catches up
const [results, setResults] = useState([]);
useEffect(() => {
  setResults(items.filter(i => i.name.includes(query)));
}, [items, query]);

// ✅ Compute during render — always in sync, no extra render
const results = items.filter(i => i.name.includes(query));`}
        caption="Setting state from an effect means React renders once with stale data, then again after the effect fires — users can see a flash of wrong content. Compute the value directly during render (useMemo if it's expensive)."
      />

      <PosterCard
        glyph="Li"
        title={<>Lazy useState<span className="dim"> Init</span></>}
        code={`// ❌ expensiveComputation() runs on EVERY render — result thrown away
const [data] = useState(expensiveComputation());

// ✅ React calls this function once, on mount only
const [data] = useState(() => expensiveComputation());`}
        caption="JavaScript evaluates function-call arguments before useState ever sees them, so useState(fn()) always runs fn — on every render. Passing a function instead lets React control when it's actually invoked."
      />

      <PosterCard
        glyph="Rc"
        title="Race Conditions in Fetching"
        code={`// ❌ Fast userId changes (1→2→3) can resolve out of order —
// UI shows whichever response finished LAST, maybe user #1
useEffect(() => {
  fetch(\`/api/users/\${userId}\`).then(r => r.json()).then(setUser);
}, [userId]);

// ✅ AbortController cancels the stale request
useEffect(() => {
  const c = new AbortController();
  fetch(\`/api/users/\${userId}\`, { signal: c.signal }).then(r => r.json()).then(setUser);
  return () => c.abort();
}, [userId]);`}
        caption="Without cancellation, in-flight requests can resolve in any order — the last one to finish wins, not the last one requested. The cleanup runs before the next effect, aborting the previous request every time userId changes."
      />

      <PosterCard
        glyph="Mm"
        title={<>React.memo<span className="dim"> with Unstable Props</span></>}
        code={`const Child = memo(({ onSave, config }) => { /* ... */ });

// ❌ memo does nothing — new reference every render
<Child onSave={() => save()} config={{ mode: 'edit' }} />

// ✅ Stabilize every prop first, then memo actually works
const onSave = useCallback(() => save(), []);
const config = useMemo(() => ({ mode: 'edit' }), []);
<Child onSave={onSave} config={config} />`}
        caption="React.memo does a shallow comparison of props. If even one prop is a fresh object or function reference each render, memo re-renders anyway — memoizing the child is wasted unless every prop is stable."
      />

      <PosterQuickRef
        title="What broke, and why?"
        rows={[
          { need: 'Effect reads a stale prop/state forever', answer: 'Missing dependency — add it, or read from a ref' },
          { need: 'Effect fires forever / infinite loop', answer: 'It writes its own dependency — break the overlap' },
          { need: 'Deleting a list item corrupts other rows', answer: 'Index as key — use a stable id' },
          { need: 'console.log fires twice in dev only', answer: 'StrictMode double-invoke — expected, not a bug' },
          { need: 'Hook order error mid-render', answer: 'Hook called conditionally — hoist above the branch' },
          { need: 'Component re-renders on every unrelated keystroke', answer: 'Context holding fast-changing values — split it' },
          { need: 'UI flickers between two values', answer: 'useEffect deriving state — compute inline instead' },
          { need: 'React.memo child still re-renders every time', answer: 'Unstable prop reference — useMemo/useCallback it' },
          { need: 'Wrong user briefly flashes on screen', answer: 'Fetch race condition — AbortController in cleanup' },
        ]}
      />
    </PosterLayout>
  );
}
