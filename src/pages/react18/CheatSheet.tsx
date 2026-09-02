import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function CheatSheet() {
  return (
    <GuideLayout
      title="REACT 18"
      kicker="FIELD GUIDE"
      glyph="⚛️"
      tagline="Hooks, re-renders, refs and effects, plus the patterns, styling, routing, state and testing calls that come up daily — the parts that decide whether an app is fast, stable and shippable."
      meta={['React 18 core', 'measured on 19.2.6', '26 panels']}
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

      <GuidePanel n={15} title="Gotchas — Stale Closures, Loops & Bad Inits" accent="amber" glyph="⚠️" span={2}>
        <GuideCode>{`// Stale closure — the effect's closure captures roomId from
// the FIRST render and never sees a later one
useEffect(() => {
  const id = setInterval(() => fetch(\`/api/rooms/\${roomId}/messages\`), 5000);
  return () => clearInterval(id);
}, []); // roomId missing — add it, or read the latest value from a ref

// Lazy useState init — the CALLED form always re-runs on every render
useState(expensiveCompute());       // ❌ runs every render, result thrown away
useState(() => expensiveCompute()); // ✅ React calls this once, on mount only`}</GuideCode>
        <GuideRules items={[
          "An infinite effect loop needs BOTH halves — it sets state, AND its deps differ on the next render (or there is no deps array). Either half alone settles.",
          "Don't derive state in an effect — compute it inline during render (useMemo if expensive). Setting it from an effect renders once with stale data, then again a tick later.",
          "A reducer case that changes nothing must still return the SAME state reference — filter/map/spread allocate unconditionally, so a no-op action silently re-renders every consumer downstream.",
          "An object or array literal in a dependency array is a new reference every render — depend on the primitive inside it instead.",
        ]} />
      </GuidePanel>

      <GuidePanel n={16} title="Scaling State — Colocation, Split Context & Remounts" accent="green" glyph="📉" span={2}>
        <GuideRules items={[
          "State colocation is the highest-leverage fix in a large app: state lifted 'just in case a sibling needs it' turns every keystroke into a whole-subtree cascade. Move state down to the component that actually owns it.",
          "Split a context that mixes fast-changing state and stable actions into two contexts — a component that only dispatches (a button, a form) then never re-renders when the state half changes.",
          "A custom hook that builds a fresh object or array before returning it hands every caller a new reference on every call — any memo downstream of it silently stops working. The instability lives in the hook, not the component that 'broke'.",
          "Changing a key REMOUNTS, not re-renders: every hook re-initialises, every effect tears down and re-runs, every DOM node is destroyed and recreated. An accidentally unstable key (Math.random(), JSON.stringify(item)) costs far more than the render it was meant to avoid.",
          "children passed down as JSX keeps its reference if the component that created it did not re-render — a free way to shield an expensive subtree from a parent's own state changes, no memo required.",
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="The React Compiler" accent="purple" glyph="🧠">
        <GuideRules items={[
          "Auto-inserts memo/useMemo/useCallback equivalents at BUILD time for any component or hook that follows the Rules of React (pure render, no mutating props/state/refs mid-render).",
          "Code that breaks those rules silently opts OUT of compiler memoisation for just that component — it doesn't error, it just stops helping there.",
          'Check the installed VERSION, not just presence: babel-plugin-react-compiler reached a stable 1.0.0, but the older "rc" dist-tag still resolves to a pre-1.0 build — pin ^1.0.0 for the stable compiler.',
          "Ask on day one whether a codebase has it enabled — it inverts a lot of this page's manual-memoisation advice from 'do this by hand' to 'the compiler already does this, don't fight it'.",
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="memo's Fine Print" accent="blue" glyph="🔍" span={2}>
        <GuideRules items={[
          "memo takes an optional second argument, a custom comparator — return true to SKIP the re-render (props treated as equal). Use it when a prop changes identity often but genuinely doesn't affect output, e.g. a callback only read on click.",
          "Wrapping a Context Provider component in memo does not help its consumers — they re-render because the VALUE reference changed, not because the Provider component re-rendered. useMemo the value; memo on the Provider is a separate, secondary win.",
          "External stores (Zustand, Redux, Jotai) subscribe with useSyncExternalStore plus a SELECTOR, so a component re-renders only when the slice it selected actually changes — Context has no equivalent, it re-renders every consumer on any value change.",
        ]} />
      </GuidePanel>

      <GuidePanel n={19} title="Component Patterns — Which Shape?" accent="pink" glyph="🧩" span={2}>
        <GuideTable
          head={['Pattern', 'Reach for it when']}
          rows={[
            ['Compound components', 'Related sub-parts share implicit state — <Tabs><Tabs.Tab/></Tabs> (full build-out: Advanced Patterns lesson)'],
            ['Render props', 'A component controls layout around output it does not own — mostly superseded by custom hooks'],
            ['Higher-order component', 'Injecting cross-cutting behaviour into an existing tree — prefer a custom hook for new code'],
            ['Polymorphic (`as` prop)', 'One component must render as any tag or component, avoiding near-duplicate wrappers'],
            ['Slot pattern', 'Named layout regions (header/sidebar/footer) — clearer than one children blob with positioning logic'],
            ['Container / presentational', 'Separating data-fetching from markup — largely replaced by a custom data hook plus a dumb component'],
            ['Provider + guarded hook', 'Sharing state app-wide; pair the Provider with a useX() hook that throws if called outside it'],
          ]}
        />
        <GuideRules items={[
          "React has no class inheritance for components — every pattern above is composition, wrapping and passing children/props, never extension.",
        ]} />
      </GuidePanel>

      <GuidePanel n={20} title="Styling in React — Quick Decision" accent="cyan" glyph="🎨">
        <GuideTable
          head={['Approach', 'Runtime cost', 'Reach for it when']}
          rows={[
            ['CSS Modules', 'zero — compiles to plain CSS', 'new project, build-time scoping, no naming scheme to invent'],
            ['Tailwind', 'zero — purged at build', 'rapid iteration, no context-switch to a CSS file'],
            ['CSS-in-JS (styled-components/Emotion)', 'runtime — generates & injects styles as it renders', 'highly dynamic per-prop styling, component libraries'],
            ['Inline style prop', 'zero build cost, no cascade/pseudo-classes', 'a truly runtime-computed value — drag position, chart bar height'],
            ['CSS custom properties', 'resolved live by the browser, zero re-renders', 'app-wide theming / dark mode via a data attribute'],
          ]}
        />
        <GuideRules items={[
          "clsx (or classnames) beats a template-literal className string past 2-3 conditions — pairs with CSS Modules or Tailwind either way.",
          "React.CSSProperties doesn't know about custom-property names — cast the object (as React.CSSProperties) when setting a --custom-property inline.",
          "CSS fundamentals (box model, cascade, specificity) live in the CSS Field Guide; full wiring walkthroughs live in CSS Mastery's Style-Inclusion lesson — this is the React-integration summary.",
        ]} />
      </GuidePanel>

      <GuidePanel n={21} title="Routing — Core Concepts" accent="green" glyph="🧭">
        <GuideDefs
          items={[
            ['Link / NavLink', 'anywhere clickable — NavLink adds isActive/isPending for nav-menu styling'],
            ['useNavigate', 'navigation from CODE, not a click — after submit, after login, conditional redirects'],
            ['nested routes', 'a route with children needs its element to render <Outlet /> — otherwise the children match the URL but never appear'],
            ['key={id}', "changing a component's key when a route param changes forces a full remount — the idiomatic way to reset per-record state"],
          ]}
        />
        <GuideRules items={[
          "v6+ ranks routes by specificity, not declaration order — a static segment beats a :param, which beats a splat. v5 matched top-to-bottom; that rule does not carry over.",
          "Full data-router API (loaders, actions, guards) has its own field guide — this is the routing-as-React-concepts summary.",
        ]} />
      </GuidePanel>

      <GuidePanel n={22} title="State Management — Which Tool?" accent="pink" glyph="🗂️">
        <GuideTable
          head={['Need', 'Reach for']}
          rows={[
            ['Local to one component', 'useState / useReducer'],
            ['Rarely-changing global value (theme, locale)', 'Context'],
            ['Small-to-medium app, minimal ceremony', 'Zustand'],
            ['Large team, strict conventions, best DevTools', 'Redux Toolkit'],
            ['Dynamic, unknown-at-build-time shape', 'Jotai'],
            ['Server/API data — caching, refetching', 'TanStack Query, not useEffect + useState'],
            ['Default for most new apps', 'Zustand + TanStack Query'],
          ]}
        />
        <GuideRules items={[
          "State libraries solve coordination between unrelated components — local state, server data, or URL state (React Router's useSearchParams) don't need one.",
        ]} />
      </GuidePanel>

      <GuidePanel n={23} title="Common Recipes — Quick Index" accent="cyan" glyph="🧰" span={2}>
        <GuideDefs
          items={[
            ['useDebouncedValue', 'setTimeout + cleanup — only the last value in a burst survives long enough to fire'],
            ['useFetch', 'loading/data/error state + AbortController cleanup — cancels the request on unmount or url change'],
            ['useClickOutside', 'a document mousedown listener checks !ref.current.contains(e.target)'],
            ['useKeyboardShortcut', 'stores the handler in a ref so the listener attaches once but always calls the latest version'],
            ['useLocalStorage', 'lazy useState init reads storage once on mount; an effect writes back on every change'],
            ['usePrevious', 'writes ref.current in an effect (runs AFTER render) — reading it during render gives last render’s value'],
            ['useLatest', 'mutates ref.current directly in the render body — the general fix for a long-lived callback that needs fresh values'],
            ['useMediaQuery', 'useSyncExternalStore + matchMedia — the correct hook for subscribing to browser state'],
            ['useInfiniteScroll', 'IntersectionObserver on a sentinel div — cheaper than a scroll listener'],
          ]}
        />
        <GuideRules items={[
          "Every recipe here is the same shape: subscribe in an effect, always return a cleanup. Skipping the cleanup is the bug in all of them.",
        ]} />
      </GuidePanel>

      <GuidePanel n={24} title="Testing — Quick Recall" accent="red" glyph="🧪">
        <GuideCode>{`1. getByRole       — button, heading, textbox (try this first)
2. getByLabelText  — form fields with associated labels
3. getByText       — non-interactive content
4. getByTestId     — last resort only`}</GuideCode>
        <GuideRules items={[
          "getBy throws if missing; queryBy returns null (the only one safe for asserting absence); findBy is getBy + waitFor for anything that appears async.",
          "userEvent fires the full real interaction (pointerdown/mousedown/pointerup/mouseup/click/focus); fireEvent fires only the named event — prefer userEvent.",
          "renderHook tests a hook without a host component — unlike render()/userEvent, it does not auto-wrap state updates in act(), so wrap them yourself.",
          "Full RTL + Vitest walkthrough (MSW, router testing, spies vs mocks) has its own field guide — this is the fast-lookup subset.",
        ]} />
      </GuidePanel>

      <GuidePanel n={25} title="Server Components & Actions — Recall" accent="purple" glyph="🖥️">
        <GuideDefs
          items={[
            ['Server Component', 'runs ONLY on the server, can be async and await data directly — zero JS shipped for it'],
            ['"use client"', 'the opt-in boundary — that file and its imports become client code'],
            ['"use server"', 'a Server Action — a mutation callable directly from a form action or imperatively'],
          ]}
        />
        <GuideRules items={[
          "Composition rule: a Server Component can import and render a Client Component directly. A Client Component cannot import a Server Component — it can only render one handed to it as children/props.",
          "This is framework-provided, not bare React — it needs a framework implementing the RSC protocol (Next.js App Router). Plain Vite + React does not support it.",
          "Full walkthrough — the mental model, streaming, cache(), parallel fetching — lives in Server Components & Actions.",
        ]} />
      </GuidePanel>

      <GuidePanel n={26} title="Prop Drilling vs Context" accent="amber" glyph="🪜">
        <GuideCode>{`// Dashboard and Sidebar don't use theme, just forward it
<Dashboard theme={theme} setTheme={setTheme} />

// Only the actual consumer subscribes
<ThemeCtx value={{ theme, setTheme }}><Dashboard /></ThemeCtx>`}</GuideCode>
        <GuideRules items={[
          "Drilling through 2-3 levels that all use the value is fine — plain props. Drilling through layers that only forward it is the smell context fixes.",
          "Don't over-correct: every context consumer re-renders on any value change, so keep fast-changing state (cursor position, per-keystroke form fields) out of it.",
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
