import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ZustandFundamentals() {
  return (
    <LessonLayout
      title="Zustand: Fundamentals"
      sectionId="state-zustand"
      lessonIndex={0}
      prev={{ path: '/state-mgmt/patterns', label: 'Context Patterns in the Real World' }}
      next={{ path: '/state-mgmt/zustand-advanced', label: 'Zustand: Advanced Patterns' }}
    >
      <h2>What Zustand Actually Is</h2>
      <p>
        In the last lesson you built a store <em>by hand</em> — a plain object holding state, a{' '}
        <code>setState</code> that notified a set of listeners, and <code>useSyncExternalStore</code>{' '}
        wiring it into React. Zustand is that exact pattern, packaged: a small, unopinionated
        library (roughly 1 KB gzipped) that gives you a hook-backed store with{' '}
        <strong>no Provider, no Context, and no wrapper around your app</strong>. You call{' '}
        <code>create()</code> once to define a store, get back a hook, and import that hook from
        any component that needs it — no tree to climb, nothing to mount at the root.
      </p>

      <p>
        That &quot;no Provider&quot; property is the whole design center, and it&apos;s worth being
        precise about why it&apos;s possible. Context <em>has</em> to use a Provider because a
        context value is scoped to a subtree — React needs a component in the tree to hang the
        value on. A Zustand store isn&apos;t scoped to a subtree at all; it&apos;s a plain
        JavaScript object that happens to live outside React entirely, in module scope. Importing
        the hook <em>is</em> the wiring. There is nothing to mount.
      </p>

      <FlowChart
        title="How a Zustand Store Actually Connects to Your Components"
        chart={
          'graph TD\n' +
          '  App[App root — no Provider wrapper anywhere] --> CompA[Component A]\n' +
          '  App --> CompB[Component B]\n' +
          '  CompA -->|"useBearStore(s => s.bears)"| Store[(Store state — lives outside the React tree)]\n' +
          '  CompB -->|"useBearStore(s => s.increasePopulation)"| Store\n' +
          '  Action["an action calls set(...)"] --> Store\n' +
          '  Store -->|notifies every subscriber| Check{Did MY selected slice change?}\n' +
          '  Check -->|Yes| Rerender[That component re-renders]\n' +
          '  Check -->|No| Skip[That component does nothing]\n' +
          '  style Store fill:#3b1a1a\n' +
          '  style Rerender fill:#1a3329\n' +
          '  style Skip fill:#1a2744'
        }
      />

      <InfoBox variant="note" title="Where This Sits on the Escalation Ladder">
        Zustand is not a new rung — it&apos;s an implementation of <strong>Rung 5</strong> from the
        ladder in the previous lesson: a dedicated external store, chosen when a Profiler run
        shows wide re-render flashes on frequent updates, or when non-React code needs to read or
        write the state. Everything that justified climbing to Rung 5 still applies here. What
        Zustand adds over the twenty-line store you wrote by hand is ergonomics — a friendlier API,
        middleware for persistence and devtools, and a maintained package — not a new
        capability. If <code>useState</code>, lifting state up, or Context already solves your
        problem, Zustand solves nothing extra. Reach for it only when you&apos;ve actually hit the
        rung 5 trigger.
      </InfoBox>

      <h2>Verifying the Core Mechanics, for Real</h2>
      <p>
        Rather than take the &quot;it just works&quot; claim on faith, here&apos;s a real install
        and two real scripts run against Zustand&apos;s framework-agnostic vanilla API —{' '}
        <code>zustand/vanilla</code>. This is plain JavaScript with no React and no DOM; it exposes
        the exact <code>create</code> / <code>set</code> / <code>get</code> / <code>subscribe</code>{' '}
        mechanics that the React hook you&apos;ll use below wraps with{' '}
        <code>useSyncExternalStore</code>.
      </p>

      <CodeBlock language="bash" title="Real install — package and version actually installed">
{`$ npm init -y && npm install zustand
added 1 package, and audited 2 packages in 1s
found 0 vulnerabilities

$ node -p "require('zustand/package.json').version"
5.0.15`}
      </CodeBlock>

      <p>
        First: create a store with an initial state and an action, call the action, and log the
        real state before and after.
      </p>

      <CodeBlock language="javascript" title="01-create-and-action.mjs">
{`import { createStore } from 'zustand/vanilla';

const bearStore = createStore((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

console.log('initial state:', bearStore.getState());

bearStore.getState().increasePopulation();
bearStore.getState().increasePopulation();
bearStore.getState().increasePopulation();

console.log('after 3x increasePopulation():', bearStore.getState());

bearStore.getState().removeAllBears();

console.log('after removeAllBears():', bearStore.getState());`}
      </CodeBlock>

      <CodeBlock language="text" title="$ node 01-create-and-action.mjs — real output">
{`initial state: {
  bears: 0,
  increasePopulation: [Function: increasePopulation],
  removeAllBears: [Function: removeAllBears]
}
after 3x increasePopulation(): {
  bears: 3,
  increasePopulation: [Function: increasePopulation],
  removeAllBears: [Function: removeAllBears]
}
after removeAllBears(): {
  bears: 0,
  increasePopulation: [Function: increasePopulation],
  removeAllBears: [Function: removeAllBears]
}`}
      </CodeBlock>

      <p>
        Second: prove that <code>subscribe()</code> — the same primitive React&apos;s hook calls
        internally — really fires with the real new state whenever <code>set</code> runs, and
        really stops firing after you unsubscribe.
      </p>

      <CodeBlock language="javascript" title="02-subscribe.mjs">
{`import { createStore } from 'zustand/vanilla';

const bearStore = createStore((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}));

const unsubscribe = bearStore.subscribe((state, prevState) => {
  console.log('subscriber fired! prev bears:', prevState.bears, '-> next bears:', state.bears);
});

console.log('calling increasePopulation() once...');
bearStore.getState().increasePopulation();

console.log('calling increasePopulation() again...');
bearStore.getState().increasePopulation();

unsubscribe();

console.log('unsubscribed. calling increasePopulation() again (no log expected below)...');
bearStore.getState().increasePopulation();

console.log('final state:', bearStore.getState());`}
      </CodeBlock>

      <CodeBlock language="text" title="$ node 02-subscribe.mjs — real output">
{`calling increasePopulation() once...
subscriber fired! prev bears: 0 -> next bears: 1
calling increasePopulation() again...
subscriber fired! prev bears: 1 -> next bears: 2
unsubscribed. calling increasePopulation() again (no log expected below)...
final state: { bears: 3, increasePopulation: [Function: increasePopulation] }
`}
      </CodeBlock>

      <p>
        Two things to notice in that output. The state update is real and cumulative — 0 → 1 → 2 →
        3, exactly as many increments as were called. And the subscriber is a live callback, not a
        one-time snapshot: it fired twice, with the correct previous and next state each time, and
        then genuinely stopped after <code>unsubscribe()</code> — the third{' '}
        <code>increasePopulation()</code> call still updated <code>bears</code> to 3, but produced
        no log line. That&apos;s the entire subscription model React&apos;s hook builds on.
      </p>

      <h2>Creating Your First Store</h2>
      <p>
        In a React app you don&apos;t reach for <code>zustand/vanilla</code> directly — you use{' '}
        <code>create</code> from the main <code>zustand</code> package. It does the same thing as{' '}
        <code>createStore</code> above, plus it returns a <strong>hook</strong> instead of a plain
        object, so components can call it directly.
      </p>

      <CodeBlock language="tsx" title="store/useBearStore.ts">
{`import { create } from 'zustand';

interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

// create() takes a function that receives \`set\` (and \`get\`) and returns the
// initial state PLUS the actions, all in one object. The return value —
// useBearStore — is a hook you import anywhere in your component tree.
const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

export default useBearStore;`}
      </CodeBlock>

      <p>
        That&apos;s the entire store definition — one file, no boilerplate, no action-type
        constants, no reducer switch statement, and critically:{' '}
        <strong>no <code>&lt;BearStoreProvider&gt;</code> to wrap around your app</strong>. The
        store exists the moment this module is imported.
      </p>

      <h2>How <code>create()</code> Actually Works — No Magic, Just Modules and Closures</h2>
      <p>
        &quot;No Provider needed&quot; is easy to state and hard to actually believe until
        you&apos;ve seen the mechanism. So here it is — not a metaphor, the real thing, trimmed
        down from the actual source of the <code>zustand</code> package you just installed
        (compare against <code>node_modules/zustand/esm/vanilla.mjs</code> and{' '}
        <code>react.mjs</code> yourself; this is a faithful simplification, not an approximation):
      </p>

      <CodeBlock language="tsx" title="createStore() — the whole store, ~12 lines">
{`function createStore(initializer) {
  let state;
  const listeners = new Set();          // who to notify on change

  const setState = (partial) => {
    state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) };
    listeners.forEach((listener) => listener(state));   // notify EVERY subscriber
  };
  const getState = () => state;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);            // unsubscribe function
  };

  state = initializer(setState, getState);   // run your (set) => ({ bears: 0, ... }) fn
  return { setState, getState, subscribe };  // "api" — a plain object, not a component
}`}
      </CodeBlock>

      <p>
        Notice what that returns: <code>{'{ setState, getState, subscribe }'}</code> — three
        functions closing over one <code>state</code> variable and one <code>listeners</code>{' '}
        set. No JSX. No component. Nothing React-specific at all — this is exactly the object{' '}
        <code>zustand/vanilla</code>&apos;s <code>createStore</code> gave you two sections ago,
        and it&apos;s the same object you called <code>.getState()</code> and{' '}
        <code>.subscribe()</code> on directly, with real console output, before any React was
        involved.
      </p>

      <p>
        Now the part that replaces the Provider — the React binding. This is what{' '}
        <code>create()</code> hands back to you as the hook:
      </p>

      <CodeBlock language="tsx" title="create() — wrapping the store in a hook, ~8 lines">
{`function create(initializer) {
  const api = createStore(initializer);   // ONE store object, built right here

  function useBoundStore(selector) {
    return useSyncExternalStore(
      api.subscribe,                       // "call me when the store changes"
      () => selector(api.getState()),      // "here's the current value I care about"
    );
  }

  return useBoundStore;   // <-- this is what "const useBearStore = create(...)" gives you
}`}
      </CodeBlock>

      <p>
        <code>useSyncExternalStore</code> is a built-in React hook whose entire job is bridging a
        data source that lives <em>outside</em> React (a store, a browser API, a WebSocket) into
        React&apos;s render cycle. You hand it two functions — <em>how to subscribe</em> and{' '}
        <em>how to read the current value</em> — and React calls <code>subscribe</code> once per
        component instance, then re-renders that component every time the subscribed callback
        fires, reading <code>getSnapshot</code> again to get the new value. That&apos;s the
        entire contract. It doesn&apos;t care where the store came from or how it&apos;s shaped.
      </p>

      <FlowChart
        title="Why Every Component Shares the Same Store — Without a Provider"
        chart={
          'graph TD\n' +
          '  Module["useBearStore.ts — a JS module"] -->|"runs ONCE, first time anything imports it"| Api["api = createStore(...) — one object, one listeners Set, held in closure"]\n' +
          '  Api --> Hook["useBoundStore — the returned hook, closes over THIS api"]\n' +
          '  Hook -->|"export default useBoundStore"| Cache[("Module cache — every import gets the SAME function reference")]\n' +
          '  Cache -->|"import useBearStore"| CompA["Component A — anywhere in the tree"]\n' +
          '  Cache -->|"import useBearStore"| CompB["Component B — anywhere else, no relation to A"]\n' +
          '  CompA -->|"useSyncExternalStore(api.subscribe, ...)"| Api\n' +
          '  CompB -->|"useSyncExternalStore(api.subscribe, ...)"| Api\n' +
          '  style Module fill:#1a2744\n' +
          '  style Cache fill:#3b1a1a\n' +
          '  style Api fill:#1a3329'
        }
      />

      <p>
        That diagram is the actual answer to &quot;how does this work without a Provider.&quot;{' '}
        <code>const useBearStore = create(...)</code> at the top of a module is code that runs{' '}
        <strong>exactly once</strong> — the first time anything imports that file. JavaScript
        module systems cache the result: a second, third, or hundredth <code>import</code> of the
        same file does not re-run it, it just hands back the same values already computed the
        first time. So <code>useBearStore</code> is one specific function object, created once,
        permanently closing over one specific <code>api</code> object (one <code>state</code>{' '}
        variable, one <code>listeners</code> set). Every component that imports it — no matter
        where it sits in the component tree, or whether it&apos;s even rendered by the same root —
        gets that exact same function, and therefore reaches the exact same store.
      </p>

      <InfoBox variant="info" title="Context vs. Zustand: Two Completely Different Lookup Strategies">
        <p>
          Context <em>has</em> to use a Provider because a context value is found by{' '}
          <strong>walking the component tree</strong> — <code>useContext(MyContext)</code> asks
          React &quot;climb up from here and find the nearest <code>&lt;MyContext.Provider&gt;</code>
          above me,&quot; and if none exists, you get the default value. That lookup is inherently
          tree-shaped, so something has to exist in the tree to be found.
        </p>
        <p>
          Zustand&apos;s hook does no tree walking at all. It doesn&apos;t ask &quot;what&apos;s
          above me?&quot; — it already has a direct reference to <code>api</code>, captured in a
          closure when the module first loaded, completely independent of where in the tree the
          component calling the hook happens to render. Two components in entirely unrelated
          branches of the tree, even rendered by two different <code>createRoot()</code> calls on
          the same page, still share the same store as long as they both imported the same module.
          &quot;No Provider&quot; isn&apos;t Zustand doing something clever <em>instead of</em> tree
          lookup — it&apos;s Zustand not needing tree lookup <em>at all</em>, because module
          imports already give every caller the same reference for free.
        </p>
      </InfoBox>

      <h2>Using the Store in a Component</h2>
      <p>
        Call the hook like any other hook. Passed no arguments, it returns the{' '}
        <em>entire</em> state object:
      </p>

      <CodeBlock language="tsx" title="BearCounter.tsx">
{`import useBearStore from './store/useBearStore';

function BearCounter() {
  const state = useBearStore(); // the whole store — see the next section for why not to do this
  return <h1>{state.bears} bears around here</h1>;
}`}
      </CodeBlock>

      <p>
        This works, and for a one-off demo it&apos;s fine. But calling the hook with no selector
        subscribes the component to <em>every</em> field in the store — it re-renders on any
        change to any part of the state, exactly like reading a Context value with no selector.
        The fix is one line, and it&apos;s the subject of the next section.
      </p>

      <h2>Writing Actions</h2>
      <p>
        Actions are just functions defined inside the store creator, sitting right next to the
        state they modify. They call <code>set</code> to update state — either with a partial
        object that gets shallow-merged in, or with a function that receives the current state and
        returns the update (use the function form whenever the new value depends on the old one,
        for the same reason you&apos;d write <code>setCount(c =&gt; c + 1)</code> instead of{' '}
        <code>setCount(count + 1)</code> in <code>useState</code>).
      </p>

      <CodeBlock language="tsx" title="Calling actions from a component">
{`import useBearStore from './store/useBearStore';

function Controls() {
  // Grab just the actions — functions are stable across renders in Zustand,
  // so subscribing to them doesn't cause extra re-renders.
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  const removeAllBears = useBearStore((state) => state.removeAllBears);

  return (
    <>
      <button onClick={increasePopulation}>Add a bear</button>
      <button onClick={removeAllBears}>Remove all bears</button>
    </>
  );
}`}
      </CodeBlock>

      <p>
        Keeping actions colocated with state inside <code>create()</code> is a deliberate design
        choice, not just convenience: the logic that&apos;s allowed to change <code>bears</code>{' '}
        lives in exactly one place, so a component can never mutate state by hand and drift out of
        sync with the rest of the app. Components only ever call named actions — the same
        discipline a reducer&apos;s <code>dispatch</code> enforces, without the switch statement.
      </p>

      <h2>Selecting a Slice — Why It&apos;s Not Optional</h2>
      <p>
        This is the single most important habit to build early, so it&apos;s worth stating plainly
        before you have a real performance problem to justify it. Instead of calling the hook with
        no arguments, pass a <strong>selector</strong> — a function that picks out just the piece of
        state this component actually needs:
      </p>

      <CodeBlock language="tsx" title="Selecting a narrow slice">
{`function BearCounter() {
  // Subscribes to ONLY the bears field. This component re-renders when
  // bears changes — and does not re-render when any other field in the
  // store changes, no matter how large the store grows.
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} bears around here</h1>;
}`}
      </CodeBlock>

      <p>
        You saw this exact shape already, back in <em>When Context Isn&apos;t Enough</em> —{' '}
        <code>{"useStore(state => state.user.name)"}</code> was shown there as the pattern Context{' '}
        <em>structurally cannot offer</em>, because Context has no selector step at all: reading
        one field subscribes a consumer to the whole value. Zustand&apos;s <code>create</code>{' '}
        builds that selector comparison in for you — under the hood it&apos;s the same{' '}
        <code>useSyncExternalStore</code> mechanism, with the selector&apos;s result compared
        between renders so React only re-renders the component when <em>that specific
        return value</em> changes.
      </p>

      <InfoBox variant="info" title="This Is a Seed, Not the Full Story">
        At this level, the rule is simple: <strong>select the narrowest slice a component
        actually reads</strong>. What counts as &quot;changed&quot; when a selector returns an
        object or array instead of a primitive, how Zustand compares values by default, and how to
        override that comparison — that&apos;s real nuance with real footguns, and it&apos;s
        covered in full in the next lesson. For now, the habit to build is: never call the hook
        with zero arguments in a component that only needs one field.
      </InfoBox>

      <h2>Key Takeaways</h2>
      <p>
        <strong>Zustand is Rung 5, packaged.</strong> Reach for it under the same conditions as any
        external store — a profiled re-render problem or non-React code that needs the state — not
        by default. <strong><code>create()</code> replaces a Provider.</strong> The hook it returns
        is importable from anywhere; nothing needs to wrap your app.{' '}
        <strong>Actions live inside the store</strong>, colocated with the state they change, so
        components only ever call named functions instead of mutating state directly.{' '}
        <strong>Always select a slice.</strong> <code>useStore(state =&gt; state.field)</code> is
        the difference between a component that re-renders on one relevant change and one that
        re-renders on all of them — and it costs nothing extra to write.
      </p>
    </LessonLayout>
  );
}
