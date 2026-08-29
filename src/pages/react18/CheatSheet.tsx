import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function CheatSheet() {
  return (
    <GuideLayout
      title="REACT 18"
      kicker="FIELD GUIDE"
      glyph="⚛️"
      tagline="Hooks, re-renders, refs and effects — the parts that decide whether an app is fast or slow."
      meta={['React 18 core', 'measured on 19.2.6', '14 panels']}
      page="1 / 1"
      footer="Behaviour marked 'measured' was verified in a real browser. What's new in React 19 has its own section; this page is the core model."
      prev={{ path: '/react18/build-toolchain', label: '🔧 Build Toolchain' }}
      next={{ path: '/react18/adapters', label: 'API Adapters & Envelopes' }}
    >
      <GuidePanel n={1} title="What Causes a Re-render" accent="red" glyph="🔁" span={2}>
        <GuideDefs
          items={[
            ['state change', 'setState with a DIFFERENT value (Object.is compared)'],
            ['parent renders', 'children re-render by default — props need not change'],
            ['context change', 'every consumer of that context, regardless of memo'],
            ['hook in the tree', 'useSyncExternalStore / useReducer firing'],
          ]}
        />
        <GuideRules items={[
          'Props changing is NOT what triggers a child render — the parent rendering is. memo() is what makes props matter.',
          'Setting state to the same value bails out, but React may still render once before it notices.',
          'A re-render is not a DOM update. React re-runs the function, diffs, and commits only what changed.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Stability — What Breaks memo()" accent="amber" glyph="🧊">
        <GuideCode>{`// NEW identity every render — memo is defeated
<Child style={{ margin: 0 }} onClick={() => x()} items={[1,2]} />

// Stable
const style = { margin: 0 };            // module scope
const onClick = useCallback(() => x(), []);
const items  = useMemo(() => [1,2], []);`}</GuideCode>
        <GuideRules items={[
          'Object, array, function and JSX literals are new references every render.',
          'memo does a SHALLOW prop compare — one unstable prop defeats the whole thing.',
          'children as JSX is a new object each render, so memo on a wrapper rarely helps.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="useMemo vs useCallback vs memo" accent="blue" glyph="🎛️">
        <GuideTable
          head={['', 'Caches', 'Use when']}
          rows={[
            ['useMemo', 'a VALUE', 'expensive compute, or identity a child depends on'],
            ['useCallback', 'a FUNCTION', 'passing a callback to a memo child or an effect dep'],
            ['memo()', 'a COMPONENT', 'the component re-renders often with equal props'],
          ]}
        />
        <GuideRules items={[
          'useCallback(fn, d) is exactly useMemo(() => fn, d).',
          'Memoising is not free — it costs memory and a dependency compare. Profile first.',
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Effects — Timing & Cleanup" accent="green" glyph="⏱️">
        <GuideCode>{`useEffect(() => {
  const c = new AbortController();
  fetch(url, { signal: c.signal }).then(setData).catch(ignoreAbort);
  return () => c.abort();      // cleanup runs BEFORE the next effect
}, [url]);`}</GuideCode>
        <GuideDefs
          items={[
            ['useLayoutEffect', 'after DOM mutation, BEFORE paint — blocking. Measuring.'],
            ['useEffect', 'after paint — non-blocking. Almost always this one.'],
            ['deps []', 'run once on mount'],
            ['no deps array', 'run after EVERY render'],
          ]}
        />
        <GuideRules items={[
          'Order per update: cleanup of the previous effect, then the new effect.',
          'StrictMode in dev mounts, unmounts and remounts — an effect that breaks on double-invoke has a missing cleanup.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Refs — Measured Behaviour" accent="purple" glyph="🔗" span={2}>
        <GuideCode>{`ref.current during the FIRST render   ->  null
ref.current during the SECOND render  ->  populated

// inline callback ref, on every re-render:
//   1. OLD callback called with null
//   2. NEW callback called with the node

// a callback ref that RETURNS a cleanup:
//   React NEVER calls it with null — it calls the cleanup instead

// ON UNMOUNT the object ref is:
//   still POPULATED in useLayoutEffect cleanup
//   already NULL     in useEffect cleanup`}</GuideCode>
        <GuideRules items={[
          'Never read ref.current during render to decide what to render.',
          'Teardown that needs the DOM node MUST live in useLayoutEffect cleanup.',
          'forwardRef is NOT deprecated in 19 and emits no warning — ref-as-a-prop simply also works.',
          'Only a callback ref can measure a node that appears later; an object ref is still null on mount.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Refs vs State" accent="cyan" glyph="⚖️">
        <GuideDefs
          items={[
            ['state', 'the UI must reflect it → triggers a render'],
            ['ref', 'must survive a render but never trigger one'],
            ['examples', 'timer id, AbortController, previous value, instance handles'],
          ]}
        />
        <GuideCode>{`count.current += 1;   // x3
// screen still shows 0 — current is already 3.
// The value "teleports in" on the next unrelated render.`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={7} title="State Updates" accent="amber" glyph="🧮">
        <GuideCode>{`setN(n + 1); setN(n + 1);       // +1 — both read the same n
setN(p => p + 1); setN(p => p + 1); // +2 — queued updaters

// Derive, do not mirror:
const [items, setItems] = useState([]);
const total = items.length;        // NOT a second useState + effect`}</GuideCode>
        <GuideRules items={[
          'Use the updater form whenever the next value depends on the previous.',
          'State is a snapshot per render — the variable does not change mid-function.',
          'State duplicated from props or other state is the most common source of bugs.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Context" accent="pink" glyph="🌍">
        <GuideCode>{`// Splitting by cadence: a fast-changing value should not sit
// in the same provider as a stable one.
<AuthContext value={user}>          {/* rarely changes */}
  <CursorContext value={pos}>       {/* changes constantly */}

const value = useMemo(() => ({ user, logout }), [user, logout]);`}</GuideCode>
        <GuideRules items={[
          'Every consumer re-renders when the context VALUE identity changes — memo does not stop it.',
          'An inline object as the provider value re-renders all consumers every render.',
          'Context is dependency injection, not a state manager — it does not batch or select.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Keys & Lists" accent="red" glyph="🔑">
        <GuideCode>{`{items.map(i => <Row key={i.id} {...i} />)}   // stable id
{items.map((i, idx) => <Row key={idx} />)}    // BUG on reorder/insert`}</GuideCode>
        <GuideRules items={[
          'The index as a key reuses the wrong component instance when the list reorders — state sticks to the position, not the item.',
          'Changing a key REMOUNTS a component. That is the idiomatic way to reset state.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="The Rules of Hooks" accent="blue" glyph="📏">
        <GuideRules items={[
          'Call them at the top level — never inside a condition, loop or nested function.',
          'Call them only from components or other hooks.',
          'React tracks hooks BY CALL ORDER, which is why a conditional hook corrupts every later hook.',
          'A custom hook is just a function starting with "use" that calls other hooks.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Error Boundaries" accent="red" glyph="🛡️">
        <GuideCode>{`class Boundary extends React.Component {
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch(e, info) { log(e, info.componentStack); }
  render() { return this.state?.err ? <Fallback/> : this.props.children; }
}`}</GuideCode>
        <GuideRules items={[
          'Class-only — there is still no hook equivalent.',
          'Catches render, lifecycle and constructor errors of the tree BELOW it.',
          'Does NOT catch event handlers, async code, SSR, or its own errors.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Concurrent Features" accent="purple" glyph="⚡">
        <GuideDefs
          items={[
            ['useTransition', 'you control the setState — mark it non-urgent'],
            ['useDeferredValue', 'you only have the value — lag it behind'],
            ['Suspense', 'declarative fallback while children suspend'],
            ['useId', 'SSR-safe unique id; never use for keys'],
          ]}
        />
        <GuideCode>{`const [isPending, startTransition] = useTransition();
startTransition(() => setQuery(next));   // keeps typing responsive

const deferred = useDeferredValue(query);
const isStale  = query !== deferred;      // the "dim it" signal`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={13} title="Portals" accent="green" glyph="🚪">
        <GuideCode>{`createPortal(children, document.body)`}</GuideCode>
        <GuideRules items={[
          'Moves the DOM node, NOT the React tree — context still flows, and events still bubble through the React parent.',
          'That event behaviour surprises people: a click inside a portalled modal fires handlers on its React ancestor.',
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="Performance Triage, In Order" accent="cyan" glyph="🔬" span={2}>
        <GuideRules items={[
          '1. Profile first — React DevTools Profiler, "why did this render".',
          '2. Are you rendering too much? Move state DOWN to the component that uses it.',
          '3. Lift the expensive child into children so the re-rendering parent does not recreate it.',
          '4. Only then reach for memo / useMemo / useCallback, and check they actually helped.',
          '5. Long lists need virtualisation, not memoisation.',
          'Premature memoisation makes code harder to read and can be slower than the render it avoids.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
