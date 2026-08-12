import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideHooks() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React + TypeScript · Field Reference"
      title="Hooks Cheat Sheet"
      tagline="Every hook's signature and the one thing that trips people up — condensed for offline study."
      meta={['React 19', '12 hooks']}
      footerLabel="Personal study reference — React 19"
      pageLabel="React + TS Field Guide · Hooks"
      prev={null}
      next={{ path: '/react-field-guide/component-patterns', label: 'Component Patterns' }}
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

// provider — anywhere above the reader
<ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>

// reader — anywhere below, no prop drilling
const theme = useContext(ThemeCtx);`}
        caption="Reads the nearest Provider's value. Skips passing props down through every level in between."
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
        ]}
      />
    </PosterLayout>
  );
}
