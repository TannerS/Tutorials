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
      prev={null}
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
