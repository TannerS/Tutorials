import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideHooks() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Hooks Cheat Sheet"
      tagline="What a hook actually is, the two rules that govern all of them, then every hook's signature and the one thing that trips people up."
      meta={['React 19.2', 'Rules + 17 hooks']}
      footerLabel="Personal study reference — React 19"
      pageLabel="React 19 Field Guide · Hooks"
      prev={{ path: '/react-field-guide/fundamentals', label: 'React Fundamentals' }}
      next={{ path: '/react-field-guide/component-patterns', label: 'Component Patterns' }}
    >
      <PosterCard
        glyph="?"
        title={<>What Is <span className="dim">a Hook?</span></>}
        code={`// A hook is a function starting with "use" that lets a
// component tap into React features between renders.

function Counter() {
  const [n, setN] = useState(0);   // ← remembers n across renders
  useEffect(() => { document.title = n; }, [n]);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}

// React tracks hooks BY CALL ORDER, per component instance.
// Two <Counter /> elements have two completely separate n values.`}
        caption="Plain function calls forget everything when they return; hooks are how React gives your function a memory and a way to reach outside itself. The 'use' prefix isn't decoration — the linter uses it to know these rules apply."
      />

      <PosterCard
        glyph="!"
        title={<>The Rules <span className="dim">of Hooks</span></>}
        code={`// 1. Only at the TOP LEVEL — never in a condition, loop, or nested fn
if (isOpen) { const [x, setX] = useState(0); }   // ❌ order shifts
const [x, setX] = useState(0);                    // ✅ always runs

// 2. Only inside a component or another hook
function formatDate() { useState(); }             // ❌ plain function
function useMyThing() { const [a] = useState(); } // ✅ custom hook

// A custom hook is just a function that calls other hooks.
// It shares LOGIC, never state — each caller gets its own copy.`}
        caption="Because hooks are matched up by call order, skipping one on a later render hands the next hook the wrong slot. Keeping every call unconditional at the top is what makes that impossible — enable eslint-plugin-react-hooks and let it enforce it."
      />

      <PosterCard
        glyph="S"
        title={<>useState<span className="dim">()</span></>}
        code={`const [state, setState] = useState(initial);

// functional update — use when next depends on prev
setState(prev => prev + 1);

// object/array — always spread, never mutate
setState(prev => ({ ...prev, name: 'new' }));`}
        caption="Local component state. Reach for the functional-update form any time the next value depends on the last one."
      />

      <PosterCard
        glyph="R"
        title={<>useReducer<span className="dim">()</span></>}
        code={`const [state, dispatch] = useReducer(reducer, initial);

function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    default: throw new Error('Unknown action');
  }
}`}
        caption="Centralizes complex state transitions into one pure function, called by dispatching plain action objects."
      />

      <PosterCard
        glyph="C"
        title={<>useContext<span className="dim">()</span></>}
        code={`const ThemeCtx = createContext('light');

// provider — React 19: render the context itself
<ThemeCtx value={theme}>{children}</ThemeCtx>
// <ThemeCtx.Provider> is the pre-19 form — still supported

// reader — anywhere below, no prop drilling
const theme = useContext(ThemeCtx);`}
        caption="Reads the nearest provider's value, skipping every level in between. React 19 lets you render the context object directly as the provider. Be precise about status: Context.Provider is NOT deprecated — it is fully supported and warning-free in 19, and React has only said it plans to deprecate it later. Context.Consumer is the one react.dev already marks legacy; replace it with useContext() or use()."
      />

      <PosterCard
        glyph="E"
        title={<>useEffect<span className="dim">()</span></>}
        code={`useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // cleanup
}, [ ]); // deps — [] = once, [a,b] = on change`}
        caption="Runs after paint. Always return a cleanup function for anything you subscribed to or scheduled."
      />

      <PosterCard
        glyph="L"
        title={<>useLayoutEffect<span className="dim">()</span></>}
        code={`useLayoutEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  setHeight(height); // runs before paint — no flash
}, [ ]);`}
        caption="Same timing guarantee as useEffect but fires before the browser paints. Only for DOM reads/fixes the user must never see wrong."
      />

      <PosterCard
        glyph="Rf"
        title={<>useRef<span className="dim">()</span></>}
        code={`const ref = useRef(initial); // { current: initial }

<input ref={ref} />
ref.current.focus();

// mutable value — changing it does NOT re-render
const countRef = useRef(0);
countRef.current += 1;`}
        caption="A mutable box that survives re-renders. Use for DOM handles or any value that shouldn't trigger a render when it changes."
      />

      <PosterCard
        glyph="M"
        title={<>useMemo<span className="dim"> &amp; </span>useCallback</>}
        code={`// cache an expensive VALUE
const sorted = useMemo(() => items.sort(cmp), [items]);

// cache a stable FUNCTION reference
const onClick = useCallback(id => {
  removeItem(id);
}, [ ]);`}
        caption="Skip recomputation or a fresh function identity every render — mainly matters for expensive work or memoized children."
      />

      <PosterCard
        glyph="T"
        title={<>useTransition<span className="dim">()</span></>}
        code={`const [isPending, startTransition] = useTransition();

setInput(value); // urgent — updates immediately
startTransition(() => {
  setFilteredResults(filter(value)); // low priority
});`}
        caption="Marks an update as interruptible so typing/clicking stays responsive while the expensive part renders behind it."
      />

      <PosterCard
        glyph="Id"
        title={<>useId<span className="dim">()</span></>}
        code={`function PasswordField() {
  const id = useId(); // e.g. ":r0:"
  return <>
    <label htmlFor={id}>Password</label>
    <input id={id} type="password" />
  </>;
}`}
        caption="A stable, globally-unique id that matches on server and client. Use for a11y attributes — never for list keys."
      />

      <PosterCard
        glyph="Sy"
        title={<>useSyncExternalStore<span className="dim">()</span></>}
        code={`useSyncExternalStore(
  subscribe,        // (cb) => unsubscribe
  getSnapshot,       // () => value — must be stable!
  getServerSnapshot  // SSR fallback
);`}
        caption="The safe way to subscribe React to state that lives outside it — window size, localStorage, WebSocket, Redux internals."
      />

      <PosterCard
        glyph="19"
        title={<>useActionState<span className="dim">()</span></>}
        badge="R19"
        code={`const [state, formAction, isPending] = useActionState(
  async (prev, formData) => {
    const res = await saveUser(formData);
    return res.error ? { error: res.error } : { ok: true };
  },
  { error: null }
);`}
        caption="Wires a form directly to a server/client action — gives you pending state and the action's return value with no extra plumbing."
      />

      <PosterCard
        glyph="19"
        title={<>useOptimistic<span className="dim">()</span></>}
        badge="R19"
        code={`const [items, addOptimistic] = useOptimistic(
  serverItems,
  (current, newItem) => [...current, newItem]
);

addOptimistic(draft); // shows instantly, reconciles later
await saveToServer(draft);`}
        caption="Renders the expected result immediately, then swaps in the real server state once the request actually resolves."
      />

      <PosterCard
        glyph="19"
        title={<>use<span className="dim">()</span></>}
        badge="R19"
        code={`// Reads a Promise — suspends until it resolves
function Profile({ userPromise }) {
  const user = use(userPromise);   // parent created the promise
  return <h1>{user.name}</h1>;
}
<Suspense fallback={<Skeleton />}><Profile ... /></Suspense>

// Reads Context — and this one may be CONDITIONAL
if (showAdmin) {
  const cfg = use(AdminContext);   // legal — use() is not a normal hook
}`}
        caption="The only hook you may call inside a condition or loop. Create the promise in the parent (or a cache) — creating it during the child's own render restarts the fetch on every attempt and loops forever."
      />

      <PosterCard
        glyph="19"
        title={<>useFormStatus<span className="dim">()</span></>}
        badge="R19"
        code={`import { useFormStatus } from 'react-dom';

function SubmitButton() {          // must be a DESCENDANT of the <form>
  const { pending, data, method, action } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}

<form action={formAction}>
  <input name="title" />
  <SubmitButton />                 // reads the parent form's state
</form>`}
        caption="Lets a reusable button or progress bar read its form's pending state with no prop drilling. It reads the NEAREST ANCESTOR form — calling it in the same component that renders the <form> always returns pending: false."
      />

      <PosterCard
        glyph="Df"
        title={<>useDeferredValue<span className="dim">()</span></>}
        code={`const deferred = useDeferredValue(query, '');  // 2nd arg new in R19
const isStale = query !== deferred;

<div style={{ opacity: isStale ? 0.6 : 1 }}>
  <ExpensiveList query={deferred} />
</div>`}
        caption="Lets an expensive subtree lag behind a fast-changing value instead of blocking it. The optional initial value is what the first render sees — without it, the initial mount is NOT deferred and renders synchronously."
      />

      <PosterCard
        glyph="19"
        title={<>useEffectEvent<span className="dim">()</span></>}
        badge="R19.2"
        code={`// Splits an effect into "reactive" and "not reactive" halves.
// Stable identity, but the body always sees the LATEST render.
function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showToast('Connected!', theme);   // reads latest theme...
  });

  useEffect(() => {
    const c = createConnection(roomId);
    c.on('connected', onConnected);
    c.connect();
    return () => c.disconnect();
  }, [roomId]);   // ...but theme is NOT a dep → no reconnect on theme change
}`}
        caption="The official replacement for the useRef 'useLatest / useStableCallback' hack. Four hard rules: call it only from inside an effect, declare it in the component or hook that uses it, never pass it to a child or return it from a custom hook, and never put it in a deps array. For a stable function you hand to a CHILD, that's still useCallback."
      />

      <PosterCard
        glyph="Ac"
        title={<>&lt;Activity&gt;<span className="dim"> — hide, don't unmount</span></>}
        badge="R19.2"
        code={`<Activity mode={isOpen ? 'visible' : 'hidden'}>
  <SettingsPanel />
</Activity>

// hidden:  DOM stays (display:none), state + refs PRESERVED,
//          effects cleaned up, re-renders at low priority.
//
// {isOpen && <Panel />}         → unmount, state destroyed
// <div hidden><Panel /></div>   → state kept, but effects KEEP
//                                 RUNNING (timers, sockets) — leaky
// <Activity mode="hidden">      → state kept AND effects cleaned up`}
        caption="Not a hook, but it belongs next to them: it's the third option between 'mounted' and 'unmounted.' Use it for tab panels and wizard steps where losing scroll position and half-typed input is a bug — and for prerendering the route the user will probably visit next during idle time."
      />

      <PosterCard
        glyph="R"
        title={<>Ref <span className="dim">Cleanup &amp; ref-as-prop</span></>}
        badge="R19"
        code={`// ref is a plain prop now — forwardRef is no longer necessary
// (not deprecated: no warning in 19, deprecation is "a future release")
function MyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

// ref callbacks can return a cleanup function
<div ref={(node) => {
  const obs = new ResizeObserver(fn); obs.observe(node);
  return () => obs.disconnect();   // runs on unmount
}} />`}
        caption="React uses the return value only if it IS a function; anything else is ignored and the ref is called with null as before. So the concise form (node) => (myRef.current = node) still works at runtime — but TypeScript rejects it, so use a braced body. The real trap is a concise body that happens to return a function."
      />

      <PosterQuickRef
        title="Which hook do I need?"
        rows={[
          { need: 'Reuse stateful logic across components', answer: 'Write a custom use* hook' },
          { need: 'Component state', answer: 'useState / useReducer' },
          { need: 'Side effect', answer: 'useEffect / useLayoutEffect' },
          { need: 'Stable reference', answer: 'useRef' },
          { need: 'Skip recompute', answer: 'useMemo / useCallback' },
          { need: 'Shared state', answer: 'useContext + Provider' },
          { need: 'Non-blocking update', answer: 'useTransition / useDeferredValue' },
          { need: 'Unique a11y id', answer: 'useId' },
          { need: 'External store', answer: 'useSyncExternalStore' },
          { need: 'Form + action', answer: 'useActionState + useFormStatus' },
          { need: 'Instant UI feedback', answer: 'useOptimistic' },
          { need: 'Read a promise / conditional context', answer: 'use()' },
          { need: 'Pending state in a child of a form', answer: 'useFormStatus()' },
          { need: 'Forward a ref to a function component', answer: 'Just accept `ref` as a prop (R19)' },
          { need: 'Effect must READ a value without RE-RUNNING on it', answer: 'useEffectEvent() (R19.2)' },
          { need: 'Hide a subtree but keep its state', answer: '<Activity mode="hidden"> (R19.2)' },
        ]}
      />
    </PosterLayout>
  );
}
