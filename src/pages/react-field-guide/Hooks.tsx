import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideHooks() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Hooks Cheat Sheet"
      tagline="Every hook's signature and the one thing that trips people up — condensed for offline study."
      meta={['React 19', '16 hooks & APIs']}
      footerLabel="Personal study reference — React 19"
      pageLabel="React 19 Field Guide · Hooks"
      prev={null}
      next={{ path: '/react-field-guide/stability', label: 'Re-Renders, Memo & Stability' }}
    >
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
// <ThemeCtx.Provider> still works but is DEPRECATED

// reader — anywhere below, no prop drilling
const theme = useContext(ThemeCtx);`}
        caption="Reads the nearest provider's value, skipping every level in between. React 19 lets you render the context object directly as the provider; Context.Provider and Context.Consumer are both deprecated."
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
        glyph="R"
        title={<>Ref <span className="dim">Cleanup &amp; ref-as-prop</span></>}
        badge="R19"
        code={`// ref is a plain prop now — forwardRef is deprecated
function MyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

// ref callbacks can return a cleanup function
<div ref={(node) => {
  const obs = new ResizeObserver(fn); obs.observe(node);
  return () => obs.disconnect();   // runs on unmount
}} />`}
        caption="Because React now USES the return value, the concise form (node) => (myRef.current = node) returns the node and React calls it as cleanup. Always use a braced body. TypeScript catches this; plain JS does not."
      />

      <PosterQuickRef
        title="Which hook do I need?"
        rows={[
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
        ]}
      />
    </PosterLayout>
  );
}
