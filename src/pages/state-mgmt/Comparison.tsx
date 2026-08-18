import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Comparison() {
  return (
    <LessonLayout
      title="The State Escalation Ladder"
      sectionId="state-mgmt"
      lessonIndex={1}
      prev={{ path: '/state-mgmt/intro', label: "When Context Isn't Enough" }}
      next={{ path: '/state-mgmt/zustand-fundamentals', label: 'Zustand: Fundamentals' }}
    >
      <h2>Climb Only When Forced</h2>
      <p>
        Every React state decision is a choice of <em>altitude</em>: how far from the component
        that uses a value should that value live? There are five rungs, each strictly more
        powerful and strictly more expensive than the one below it. The rule that survives
        contact with real codebases is simple — <strong>start on the lowest rung that works, and
        climb only when a concrete symptom forces you to</strong>. Climbing early is the most
        common source of unnecessary re-renders, untestable components, and &quot;global state&quot;
        that nobody dares delete.
      </p>

      <FlowChart
        title="The Escalation Ladder"
        chart={"graph TD\n  A[New piece of state] --> Q1{Used by exactly one component?}\n  Q1 -->|Yes| R1[Rung 1: useState — colocate it]\n  Q1 -->|No| Q2{Shared with a close relative?}\n  Q2 -->|Yes| R2[Rung 2: Lift state up]\n  Q2 -->|No| Q3{Many fields that change together?}\n  Q3 -->|Yes| R3[Rung 3: useReducer]\n  Q3 -->|No| Q4{Distant components, low update rate?}\n  Q4 -->|Yes| R4[Rung 4: Context]\n  Q4 -->|No| R5[Rung 5: External store with selectors]\n  R3 --> R4\n  style R1 fill:#10b981,color:#fff\n  style R2 fill:#22c55e,color:#fff\n  style R3 fill:#3b82f6,color:#fff\n  style R4 fill:#8b5cf6,color:#fff\n  style R5 fill:#ef4444,color:#fff"}
      />

      <h2>Rung 1 — Local State (useState)</h2>
      <p>
        Local state is the only rung with no coordination cost. A component that owns its state is
        independently testable, independently reusable, and re-renders nothing but itself and its
        children. The most valuable refactor in React is not lifting state up — it&apos;s
        <strong> pushing state down</strong> to the smallest component that needs it.
      </p>

      <CodeBlock language="tsx" title="Push state down before you lift it up">
{`// ❌ State lives at the top, so the whole page re-renders on every keystroke
function ProductPage({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  return (
    <>
      <ExpensiveGallery images={product.images} />   {/* re-renders per keystroke */}
      <Reviews productId={product.id} />             {/* re-renders per keystroke */}
      <input value={qty} onChange={(e) => setQty(+e.target.value)} />
    </>
  );
}

// ✅ State moved down into the only component that reads it
function QuantityPicker() {
  const [qty, setQty] = useState(1);
  return <input value={qty} onChange={(e) => setQty(+e.target.value)} />;
}

function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <ExpensiveGallery images={product.images} />   {/* never re-renders */}
      <Reviews productId={product.id} />
      <QuantityPicker />
    </>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Not All State Is State">
        Before adding <code>useState</code>, check whether the value can be <em>derived</em> during
        render (<code>const total = items.reduce(...)</code>) or read from the URL. Derived values
        that live in state must be manually kept in sync, and that synchronization is where the bugs
        are. State is only for what cannot be computed from something you already have.
      </InfoBox>

      <h2>Rung 2 — Lifting State Up</h2>
      <p>
        When two siblings need the same value, the value moves to their nearest common parent and
        comes back down as props. This is still plain React with no machinery: data flow stays
        explicit and traceable, and TypeScript checks every hop.
      </p>

      <CodeBlock language="tsx" title="Lifting, and the cost that comes with it">
{`function FilterableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');           // shared by two children
  const visible = items.filter((i) => i.name.includes(query)); // derived, not state

  return (
    <>
      <SearchBox value={query} onChange={setQuery} />
      <ResultList items={visible} />
    </>
  );
}`}
      </CodeBlock>

      <p>
        The cost is real but bounded: the parent re-renders on every change, so everything it
        renders re-renders too. Two escapes exist before you climb higher — wrap expensive siblings
        in <code>React.memo</code>, or pass them through as <code>children</code> so React reuses the
        same element object across renders.
      </p>

      <CodeBlock language="tsx" title="The children trick — a subtree the state can't touch">
{`// <ExpensiveSidebar /> is created by App, not by Shell, so it is the SAME
// element object on every Shell render. React bails out of re-rendering it.
function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}>Toggle</button>
      {open && <Drawer />}
      {children}          {/* untouched by 'open' changes */}
    </div>
  );
}

function App() {
  return (
    <Shell>
      <ExpensiveSidebar />
    </Shell>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Why the children Trick Works — and When It Stops">
        The mechanism is one line of React&apos;s reconciler. When <code>Shell</code>{' '}
        re-renders, the element it returns for <code>{'{children}'}</code> is the exact
        same object it saw last time, because <code>App</code> — the component that{' '}
        <em>created</em> that element — did not re-render. React compares the incoming
        props to the previous props, finds them reference-identical, and bails out of
        the entire subtree without calling <code>ExpensiveSidebar</code> at all.
        <br />
        <br />
        So the precondition is: <strong>the state must live below the component that
        creates the children</strong>. Move <code>open</code> up into{' '}
        <code>App</code> and the trick evaporates — <code>App</code> re-renders,
        builds a fresh <code>&lt;ExpensiveSidebar /&gt;</code> element, and the bailout
        no longer applies. This is the same identity rule behind <code>memo</code>,
        applied to elements instead of props, and it needs no <code>memo</code> because
        reference equality is doing the work for free.
      </InfoBox>

      <p>
        Prop drilling only becomes a genuine problem past roughly three hops, or when intermediate
        components have to accept props they never read. Two hops of explicit props are usually
        better than a Context nobody can trace.
      </p>

      <h2>Rung 3 — useReducer for Complex Local State</h2>
      <p>
        <code>useReducer</code> is not a &quot;global state&quot; tool — it is <code>useState</code>{' '}
        for state whose fields change <em>together</em>. The moment you find yourself writing three{' '}
        <code>set*</code> calls in one handler, or writing an <code>if</code> to decide which of two
        state fields is valid, the state has transitions, and transitions belong in a reducer.
      </p>

      <CodeBlock language="tsx" title="Four useStates that should have been one reducer">
{`// ❌ Impossible states are representable: isLoading && error && data
const [data, setData] = useState<User[] | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [page, setPage] = useState(1);

// ✅ One value, one transition at a time — impossible states can't be built
type State =
  | { status: 'idle' }
  | { status: 'loading'; page: number }
  | { status: 'success'; page: number; users: User[] }
  | { status: 'error'; page: number; message: string };

type Action =
  | { type: 'fetch'; page: number }
  | { type: 'resolved'; users: User[] }
  | { type: 'rejected'; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'fetch':
      return { status: 'loading', page: action.page };
    case 'resolved':
      if (state.status !== 'loading') return state;   // ignore stale results
      return { status: 'success', page: state.page, users: action.users };
    case 'rejected':
      if (state.status !== 'loading') return state;
      return { status: 'error', page: state.page, message: action.message };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, { status: 'idle' });`}
      </CodeBlock>

      <p>
        Three concrete wins come with that shape. The reducer is a <strong>pure function</strong>,
        so it can be unit tested with no React at all. The transition logic lives in one place
        instead of being smeared across event handlers. And a discriminated union makes the
        compiler reject <code>state.users</code> anywhere the status is not <code>&apos;success&apos;</code>.
      </p>

      <InfoBox variant="tip" title="dispatch Has a Stable Identity">
        React guarantees <code>dispatch</code> is the same function for the lifetime of the
        component — like a <code>setState</code> updater. You never need to wrap it in{' '}
        <code>useCallback</code>, it is safe in dependency arrays, and it can be handed to a Context
        that never changes value. That last property is what makes the split state/dispatch Context
        pattern in the next lesson work.
      </InfoBox>

      <h2>Rung 4 — Context</h2>
      <p>
        Context is <strong>dependency injection, not a store</strong>. It solves exactly one
        problem: getting a value to a distant descendant without threading it through every
        component in between. It does not add caching, subscriptions, or selective updates — those
        are what the next rung buys.
      </p>

      <h3>What Actually Triggers a Consumer Re-render</h3>
      <p>
        The mechanics are precise and worth memorizing, because almost all &quot;Context is
        slow&quot; complaints come from misunderstanding them:
      </p>

      <CodeBlock language="tsx" title="The three rules of Context re-rendering">
{`// RULE 1: A consumer re-renders when the provider's \`value\` changes identity
//         (Object.is comparison), regardless of which part it reads.
//         There is no selector. Reading one field subscribes you to all of them.

// RULE 2: React.memo does NOT stop a context update. memo compares props;
//         context is read inside the component, so the update goes around memo.
const Avatar = memo(function Avatar() {
  const { user } = useContext(AppContext);  // re-renders on ANY AppContext change
  return <img src={user.avatarUrl} />;
});

// RULE 3: If the provider component re-renders and rebuilds \`value\` inline,
//         every consumer re-renders — even when nothing meaningful changed.
function Provider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  return (
    // ❌ new object identity on every Provider render
    <AppContext value={{ user, setUser }}>{children}</AppContext>
  );
}

function FixedProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  // ✅ identity changes only when \`user\` does (setUser is already stable)
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AppContext value={value}>{children}</AppContext>;
}`}
      </CodeBlock>

      <h3>When Context Actually Becomes a Bottleneck</h3>
      <p>
        Context propagation itself is cheap — React walks its list of subscribed fibers and marks
        them dirty. The cost is entirely in <em>what those consumers render</em>. So the honest
        formula is:
      </p>

      <CodeBlock language="text" title="The cost model">
{`  cost  ≈  updates per second  ×  number of consumers  ×  cost of each consumer's subtree

  Theme toggle:     0.001 updates/sec ×  40 consumers × cheap     →  free, ship it
  Auth/user object: 0.01  updates/sec ×  20 consumers × cheap     →  free, ship it
  Shopping cart:    2     updates/sec ×  15 consumers × moderate  →  split the context
  Text editor doc:  30    updates/sec × 100 consumers × expensive →  you need selectors
  Drag position:    60    updates/sec ×  50 consumers × anything  →  don't use state at all
                                                                     (refs + CSS transforms)`}
      </CodeBlock>

      <p>
        Note the bottom row: at animation frequency the answer is not a better store, it is keeping
        the value out of React state entirely — a ref plus a direct style write. No state library
        makes 60 renders per second cheap.
      </p>

      <InfoBox variant="warning" title="Measure Before You Migrate">
        Open React DevTools → Profiler, enable &quot;Highlight updates when components render&quot;,
        and interact with the feature. If you see a wide flash across the tree on every keystroke,
        you have a Context problem. If you see two components flash, you do not — and swapping in a
        state library will cost you a dependency and buy nothing. The Profiler also reports{' '}
        <em>why</em> a component rendered (&quot;Context changed&quot;), which points straight at the
        provider to split.
      </InfoBox>

      <p>
        Before climbing off this rung, three fixes solve most Context performance problems and are
        covered in depth in the next lesson: <strong>split one context into several</strong> by
        update frequency, <strong>separate state from dispatch</strong> into two contexts so
        write-only components never re-render, and <strong>mount the provider lower</strong> in the
        tree so fewer components are consumers at all.
      </p>

      <h2>Rung 5 — A Dedicated Store</h2>
      <p>
        The one thing a store gives you that Context structurally cannot is a{' '}
        <strong>subscription with a selector</strong>: a component says &quot;wake me only when this
        derived slice changes,&quot; and the store compares the previous and next selected value
        before re-rendering. React ships the primitive for this —{' '}
        <code>useSyncExternalStore</code> — and every library on this rung is a wrapper around it.
        A minimal store is about twenty lines:
      </p>

      <CodeBlock language="tsx" title="A store from scratch — this is the entire trick">
{`import { useSyncExternalStore } from 'react';

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState(update: T | ((prev: T) => T)) {
      const next = typeof update === 'function'
        ? (update as (prev: T) => T)(state)
        : update;
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const cartStore = createStore({ items: [] as CartItem[], coupon: null as string | null });

// The selector is the whole point: this component re-renders only when the
// item COUNT changes — not when a quantity changes, not when the coupon changes.
function useCartCount() {
  return useSyncExternalStore(
    cartStore.subscribe,
    () => cartStore.getState().items.length,
  );
}`}
      </CodeBlock>

      <p>
        Four properties fall out of that design, and they are the honest reasons a team adopts a
        store: selector-based rendering, state that lives <em>outside</em> the React tree (readable
        and writable from an interceptor, a WebSocket handler, or a test with no rendering), no
        provider nesting, and a single place to hang middleware — logging, persistence,
        devtools, time-travel.
      </p>

      <h3>The Landscape, Briefly</h3>
      <p>
        For completeness, since you will meet these in job interviews and existing codebases:{' '}
        <strong>Redux Toolkit</strong> is the conservative enterprise choice — one store, explicit
        actions, unmatched devtools with time-travel, and conventions that keep a large team
        consistent, at the price of ceremony. <strong>Zustand</strong> is essentially the hook above
        with a nicer API and middleware, roughly 1 KB, no provider required.{' '}
        <strong>Jotai</strong> (and its predecessor Recoil) inverts the model into independent atoms
        composed bottom-up, which suits UIs whose state shape isn&apos;t known until runtime.{' '}
        <strong>MobX</strong> tracks observable mutations at runtime for an OOP-flavored style. And{' '}
        <strong>XState</strong> solves a different axis entirely — legal transitions in complex
        workflows. This site doesn&apos;t teach them in depth on purpose: the concepts on rungs 1–4
        transfer to all of them, and picking one up afterwards takes an afternoon.
      </p>

      <InfoBox variant="info" title="React Compiler Changes the Math a Little">
        React Compiler auto-memoizes components and hook results at build time, which removes most
        manual <code>useMemo</code>/<code>useCallback</code> — including the memoized provider value
        above — and cuts the cost of consumers whose render work is derived. What it does{' '}
        <em>not</em> do is add selectors to Context: a consumer still re-renders when the provider
        value changes identity. It lowers the cost of rung 4; it doesn&apos;t remove the reason for
        rung 5.
      </InfoBox>

      <h2>The Decision Framework</h2>
      <p>
        Rather than comparing libraries, compare rungs. Each row is a symptom that justifies
        climbing — no symptom, no climb.
      </p>

      <CodeBlock language="text" title="Rung, trigger, and cost">
{`┌────────────────────┬──────────────────────────────────┬─────────────────────────────┐
│ Rung               │ Climb when…                      │ What it costs you           │
├────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ 1. useState        │ (default — always start here)    │ Nothing                     │
│ 2. Lift state up   │ A sibling needs the same value   │ Parent subtree re-renders   │
│ 3. useReducer      │ Fields change together; you      │ Indirection: one more file  │
│                    │ can represent impossible states  │ to open to follow a click   │
│ 4. Context         │ 3+ prop hops, or unrelated       │ All consumers re-render;    │
│                    │ branches of the tree need it     │ provider nesting; harder    │
│                    │                                  │ to test in isolation        │
│ 5. External store  │ Profiler shows wide re-render    │ A dependency; state outside │
│                    │ flashes on frequent updates,     │ React's lifecycle; a second │
│                    │ OR non-React code must read      │ mental model for the team   │
│                    │ and write the state              │                             │
└────────────────────┴──────────────────────────────────┴─────────────────────────────┘`}
      </CodeBlock>

      <p>
        Three questions worth asking out loud before adding a store to an existing app. <em>Is this
        actually client state?</em> — most &quot;global state&quot; turns out to be server cache and
        belongs in TanStack Query. <em>Have I split the context yet?</em> — separating state from
        dispatch is a thirty-minute refactor that often ends the conversation. <em>Do I have a
        profile?</em> — if the answer is &quot;it feels slow,&quot; you are guessing.
      </p>

      <InfoBox variant="warning" title="The Failure Mode in Both Directions">
        Climbing too early produces an app where a checkbox lives in a global store three folders
        away, every feature is coupled to one state shape, and no component can be rendered in a
        test without a wall of providers. Climbing too late produces an app where every interaction
        re-renders the page, and the fix keeps getting deferred because &quot;we&apos;d have to
        rewrite state management.&quot; The ladder exists so you can move one rung at a time, with a
        reason you can name.
      </InfoBox>

      <InteractiveChallenge
        question={"A settings panel has 9 related fields, several of which are only valid depending on the others (e.g. `notifyBy: 'email'` requires an email address). It is used on exactly one route. What's the right rung?"}
        options={[
          'Rung 1: nine useState calls, one per field',
          'Rung 3: a useReducer whose state is a discriminated union',
          'Rung 4: a SettingsContext so the fields can be read anywhere',
          'Rung 5: an external store, since the validation logic is complex',
        ]}
        correctIndex={1}
        explanation="The fields change together and have interdependent validity — that is exactly the useReducer signal. It stays local because only one route uses it, the reducer is a pure function you can unit test without rendering, and a discriminated union makes the invalid combinations unrepresentable. Nothing here is shared across distant components, so Context and an external store are both pure overhead."
        language="tsx"
      />

      <h2>Key Takeaways</h2>
      <p>
        <strong>Colocate by default.</strong> Pushing state down is a more common fix than lifting
        it up. <strong>useReducer is local.</strong> It&apos;s the answer to complexity, not to
        distance. <strong>Context is injection, not subscription.</strong> Every consumer re-renders
        when the provider value changes identity, and <code>React.memo</code> won&apos;t save you.{' '}
        <strong>The cost is the consumers, not Context.</strong> Frequency × consumer count ×
        render cost — profile it before you migrate. <strong>A store buys selectors and
        out-of-tree access.</strong> If you need neither, you don&apos;t need the dependency.
      </p>
    </LessonLayout>
  );
}
