import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ZustandAdvanced() {
  return (
    <LessonLayout
      title="Zustand: Advanced Patterns"
      sectionId="state-zustand"
      lessonIndex={1}
      prev={{ path: '/state-mgmt/zustand-fundamentals', label: 'Zustand: Fundamentals' }}
      next={{ path: '/state-mgmt/zustand-cheatsheet', label: '📋 Zustand Field Guide' }}
    >
      <p>
        You already know <code>create()</code>, the store hook, and basic selecting. This lesson is
        everything that turns a toy store into a production one: splitting a growing store into{' '}
        <strong>slices</strong>, the three middleware you&apos;ll reach for constantly
        (<code>persist</code>, <code>devtools</code>, <code>immer</code>), combining them without
        breaking each other, deriving values Zustand doesn&apos;t track for you, async actions, the
        one performance mistake that shows up in almost every real Zustand codebase, and the
        TypeScript form you need the moment middleware enters the picture.
      </p>

      <h2>The Slices Pattern</h2>
      <p>
        A single <code>create()</code> call with twenty fields and fifteen actions is a maintenance
        problem, not a feature. The fix isn&apos;t multiple stores — cross-slice actions get awkward
        across separate stores — it&apos;s multiple <strong>slice creator functions</strong>, each
        owning one concern, combined with object spread inside <em>one</em> <code>create()</code>{' '}
        call. Every slice still shares the same <code>set</code> and <code>get</code>, so any action
        can read or update any part of the store.
      </p>

      <FlowChart
        title="Slices compose into one store"
        chart={"graph LR\n  A[createUserSlice] --> D[create]\n  B[createCartSlice] --> D\n  C[createUiSlice] --> D\n  D --> S[(One Store)]\n  S --> U[Components use the whole store\\nvia normal selectors]\n  style D fill:#1a2744\n  style S fill:#1a3329"}
      />

      <CodeBlock language="tsx" title="Two independent slices, combined in one create()">
{`// userSlice.ts
export const createUserSlice = (set, get) => ({
  user: { name: 'Ada', loggedIn: false },
  login: (name) => set((state) => { state.user = { name, loggedIn: true }; }),
  logout: () => set((state) => { state.user.loggedIn = false; }),
});

// cartSlice.ts
export const createCartSlice = (set, get) => ({
  cart: { items: [], total: 0 },
  addItem: (price) =>
    set((state) => {
      state.cart.items.push(price);
      state.cart.total += price;
    }),
});

// store.ts — one create() call, spreads both slices into a single state object
import { create } from 'zustand';

export const useStore = create((...args) => ({
  ...createUserSlice(...args),
  ...createCartSlice(...args),
}));

// Any component still uses the store exactly like a non-sliced one:
// useStore((s) => s.cart.total), useStore((s) => s.login), etc.
// A cart action reading user state (e.g. "free shipping if loggedIn")
// just calls get().user.loggedIn — slices aren't isolated, they're organized.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Verified">
        Ran this exact pattern against <code>zustand/vanilla</code> in Node with real slice
        creators: calling <code>login(&apos;Grace&apos;)</code> then <code>addItem(19.99)</code> and{' '}
        <code>addItem(5)</code> produced <code>{'{ user: { name: \'Grace\', loggedIn: true }, cart: { items: [19.99, 5], total: 24.99 } }'}</code>{' '}
        — both slices updated correctly through the shared <code>set</code>/<code>get</code>, with
        no cross-slice interference.
      </InfoBox>

      <p>
        Split by concern, not by file size — a slice should be something you could describe in one
        sentence (&quot;owns the cart&quot;). If two slices constantly need each other&apos;s state
        to do their job, that&apos;s a sign they&apos;re one concern wearing two names.
      </p>

      <h2>Middleware: persist</h2>
      <p>
        <code>persist</code> writes your store to storage on every <code>set</code> call and
        rehydrates from it on load — the standard way to survive a page refresh. Wrap the state
        creator, give it a storage key, and optionally trim what actually gets saved.
      </p>

      <CodeBlock language="tsx" title="persist with partial persistence">
{`import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create()(
  persist(
    (set) => ({
      user: { name: '', token: '' },
      count: 0,
      draftNotes: '',            // ephemeral — should never hit disk
      increment: () => set((s) => ({ count: s.count + 1 })),
      setDraft: (text) => set({ draftNotes: text }),
    }),
    {
      name: 'auth-store',                              // localStorage key
      storage: createJSONStorage(() => localStorage),   // sessionStorage also works
      // Only persist what should survive a refresh — never a session token,
      // never in-progress form state.
      partialize: (state) => ({
        count: state.count,
        user: { name: state.user.name },
      }),
    },
  ),
);`}
      </CodeBlock>

      <p>
        This was run for real against a fake in-memory <code>storage</code> object (a plain{' '}
        <code>{'{ getItem, setItem, removeItem }'}</code> — the standard way to test{' '}
        <code>persist</code> without a browser). Two logged <code>setItem</code> calls, one per{' '}
        <code>set()</code>:
      </p>

      <CodeBlock language="text" title="Actual logged setItem calls">
{`[fakeStorage] setItem("demo-store", {"state":{"count":1,"user":{"name":"Ada"}},"version":0})
[fakeStorage] setItem("demo-store", {"state":{"count":1,"user":{"name":"Ada"}},"version":0})

// parsed payload — token and draftNotes are genuinely absent, not just empty:
"token" in parsed.state.user        -> false
"draftNotes" in parsed.state        -> false
"count" in parsed.state             -> true  (1)`}
      </CodeBlock>

      <InfoBox variant="warning" title="partialize + Nested Objects: the Default merge Is Shallow">
        Rehydrating a fresh store instance against that same storage confirmed a real gotcha:{' '}
        <code>user.token</code> came back <code>undefined</code>, not the store&apos;s default value.
        <code>persist</code>&apos;s default <code>merge</code> is{' '}
        <code>{'{ ...currentState, ...persistedState }'}</code> — a <em>shallow</em>, top-level-only
        merge. Since <code>partialize</code> only kept <code>{'{ name: ... }'}</code> on the{' '}
        <code>user</code> key, the merge replaced the <em>entire</em> <code>user</code> object with
        that trimmed one, dropping <code>token</code> entirely rather than filling it back in from
        defaults. If you partialize a nested object down to a subset of its keys, pass a custom{' '}
        <code>merge: (persisted, current) =&gt; deepMerge(current, persisted)</code>, or don&apos;t
        nest the persisted fields in the first place.
      </InfoBox>

      <h2>Middleware: devtools</h2>
      <p>
        <code>devtools</code> connects the store to the Redux DevTools browser extension — every{' '}
        <code>set</code> shows up as a labeled entry you can inspect, time-travel through, and diff.
        Give <code>set</code> a third argument to name the action; without it every update shows up
        as the generic <code>&quot;setState&quot;</code>, which is nearly useless once a store has
        more than two actions.
      </p>

      <CodeBlock language="tsx" title="Named actions show up as labeled entries in DevTools">
{`import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useCounterStore = create()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 }), false, 'increment'),
      reset: () => set({ count: 0 }, false, 'reset'),
    }),
    { name: 'CounterStore' },   // the store's label in the DevTools dropdown
  ),
);`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified">
        Ran this exact store in Node (no extension installed, matching a production build or CI
        environment): <code>increment</code>, <code>increment</code>, <code>reset</code> executed
        cleanly with no throw, final <code>count</code> was <code>0</code> as expected. This confirms
        the documented behavior — <code>devtools</code> is a silent no-op when the extension isn&apos;t
        present, so it&apos;s safe to leave wired up (though most teams still strip it in production
        via <code>{'devtools(fn, { enabled: process.env.NODE_ENV !== \'production\' })'}</code>).
      </InfoBox>

      <h2>Middleware: immer — the Deep-Update Problem It Solves</h2>
      <p>
        Without <code>immer</code>, updating a value three levels deep means manually spreading
        every level in between — miss one and you either mutate state directly (React won&apos;t
        re-render) or silently overwrite sibling keys.
      </p>

      <CodeBlock language="tsx" title="Without immer: manual spreading gets ugly fast">
{`// Updating user.profile.address.city, by hand, correctly:
set((state) => ({
  ...state,
  user: {
    ...state.user,
    profile: {
      ...state.user.profile,
      address: {
        ...state.user.profile.address,
        city: 'Berlin',
      },
    },
  },
}));
// Four levels of spread for ONE changed field. Forget any one of them and
// you either lose sibling data (a shallow spread swallowing nested keys)
// or hand back the same object reference (a missed spread means React
// sees no change and skips the re-render).`}
      </CodeBlock>

      <p>
        <code>immer</code> middleware (needs the separate <code>immer</code> package installed
        alongside <code>zustand</code>) lets you write updates that <em>look</em> like direct
        mutation. Internally it wraps state in a Proxy, records what you touched, and produces a
        real new, immutable object — you never actually mutate anything.
      </p>

      <CodeBlock language="tsx" title="With immer: the same update, mutate-looking, still immutable">
{`import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useAppStore = create()(
  immer((set) => ({
    user: {
      profile: { name: 'Ada', address: { city: 'London', zip: 'EC1A' } },
    },
    settings: { theme: 'dark', notifications: { email: true, sms: false } },
    updateCity: (city) =>
      set((state) => {
        state.user.profile.address.city = city;   // looks like mutation
      }),
  })),
);`}
      </CodeBlock>

      <InfoBox variant="success" title="Verified — real Object.is() proof, not a description">
        Ran <code>updateCity(&apos;Berlin&apos;)</code> against the store above and captured{' '}
        <code>getState()</code> before and after:
        <CodeBlock language="text" title="Actual logged output">
{`Object.is(before, after)                                            [top-level]     -> false
Object.is(before.user, after.user)                                   [changed branch] -> false
Object.is(before.user.profile.address, after.user.profile.address)   [changed leaf]   -> false
Object.is(before.settings, after.settings)                           [UNTOUCHED]      -> true
Object.is(before.settings.notifications, after.settings.notifications) [UNTOUCHED]    -> true

before.user.profile.address.city -> "London"
after.user.profile.address.city  -> "Berlin"`}
        </CodeBlock>
        That&apos;s the whole point of <code>immer</code> in one log: the top-level state and every
        object on the path you touched (<code>user</code> → <code>profile</code> →{' '}
        <code>address</code>) got a genuinely new reference — real immutability, so React and any
        memoized selector correctly see a change. The completely unrelated{' '}
        <code>settings</code> branch, including its own nested <code>notifications</code> object,
        kept the <em>exact same reference</em> — no wasted re-renders anywhere the update
        didn&apos;t touch.
      </InfoBox>

      <h2>Combining Middleware: Order Matters</h2>
      <p>
        Each middleware wraps the one inside it, so the order you nest them in changes what each one
        sees. The order that actually works — and was run end-to-end below —
        is <strong><code>devtools(persist(immer(stateCreator)))</code></strong>: <code>immer</code>{' '}
        stays innermost so it&apos;s wrapping the raw <code>set</code>/<code>get</code> your slices
        call; <code>persist</code> wraps that so it serializes the plain state{' '}
        <code>immer</code> already produced; <code>devtools</code> stays outermost so it can observe
        and label everything beneath it.
      </p>

      <CodeBlock language="tsx" title="Full stack: slices + immer + persist + devtools, all combined">
{`import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create()(
  devtools(
    persist(
      immer((set, get, ...rest) => ({
        ...createUserSlice(set, get, ...rest),
        ...createCartSlice(set, get, ...rest),
      })),
      { name: 'combined-store', storage: createJSONStorage(() => localStorage) },
    ),
    { name: 'CombinedStore' },
  ),
);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Verified">
        Ran this exact four-layer stack (slices inside immer inside persist inside devtools) in
        Node against a fake storage object. <code>login(&apos;Grace&apos;)</code> and two{' '}
        <code>addItem()</code> calls produced the correct combined state
        (<code>{'{ user: { name: \'Grace\', loggedIn: true }, cart: { items: [19.99, 5], total: 24.99 } }'}</code>)
        <em>and</em> the fake storage received the fully-updated, correctly serialized state — proving{' '}
        <code>persist</code> still fires on every <code>set</code> even when <code>immer</code> and
        the slice spread sit between it and the raw config function. Swap the order — say,{' '}
        <code>immer(devtools(...))</code> — and you lose type inference in TypeScript because{' '}
        <code>immer</code> needs to see the middleware chain&apos;s mutators to know what shape of{' '}
        <code>set</code> it&apos;s wrapping; keep <code>immer</code> innermost.
      </InfoBox>

      <h2>Computed / Derived Values</h2>
      <p>
        Zustand has no built-in &quot;computed&quot; concept — no <code>derive()</code>, no
        automatic memoized getters. There are two idiomatic patterns instead, and they serve
        different needs.
      </p>

      <CodeBlock language="tsx" title="Pattern 1 — a function in the store, reading via get()">
{`const useCartStore = create((set, get) => ({
  items: [10, 20, 30],
  addItem: (price) => set((s) => ({ items: [...s.items, price] })),
  // Recomputes on every call — fine for cheap derivations, and it's always
  // in sync because it reads live state, never a stale cached value.
  getTotal: () => get().items.reduce((sum, n) => sum + n, 0),
}));

// component: const total = useCartStore((s) => s.getTotal());`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Pattern 2 — a selector function outside the store">
{`// Better for expensive derivations: keep it out of the store entirely and
// let the calling component (or useMemo) control when it actually runs.
const selectCartTotal = (state) => state.items.reduce((sum, n) => sum + n, 0);

// component: const total = useCartStore(selectCartTotal);
// Selectors are also unit-testable with a plain state object — no store,
// no React, no middleware — which the get()-in-store version cannot offer.`}
      </CodeBlock>

      <InfoBox variant="note" title="Verified">
        Ran the <code>get()</code>-based pattern against a real store with{' '}
        <code>cartItems: [10, 20, 30]</code>: <code>getTotal()</code> returned <code>60</code>, and
        recomputing after further state changes stayed correct on every call.
      </InfoBox>

      <h2>Async Actions</h2>
      <p>
        There&apos;s nothing special about async in a Zustand action — it&apos;s a plain async
        function that calls <code>set</code> before and after an <code>await</code>. The standard
        shape tracks a status so the UI can show loading and error states.
      </p>

      <CodeBlock language="tsx" title="fetch-style action: loading -> success | error">
{`const useUserStore = create((set) => ({
  status: 'idle',   // 'idle' | 'loading' | 'success' | 'error'
  data: null,
  error: null,
  fetchUser: async (id) => {
    set({ status: 'loading', error: null });
    try {
      const res = await fetch(\`/api/users/\${id}\`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      set({ status: 'success', data });
    } catch (err) {
      set({ status: 'error', error: err.message });
    }
  },
}));

// component:
// const { status, data, error, fetchUser } = useUserStore();
// useEffect(() => { fetchUser(id); }, [id]);
// if (status === 'loading') return <Spinner />;
// if (status === 'error') return <ErrorBanner message={error} />;`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified">
        Ran this exact status/data/error shape against a fake async fetch. A successful call:{' '}
        <code>idle → loading → success</code> with <code>data</code> populated. A rejected call
        (simulated 404): <code>idle → loading → error</code> with{' '}
        <code>error === &apos;404 not found&apos;</code>. Both transitions logged correctly with no
        unhandled rejection — the <code>try/catch</code> around the <code>await</code> is what makes
        that safe.
      </InfoBox>

      <h2>Performance: What You Select Decides What Re-Renders</h2>
      <p>
        This is the single most common real-world Zustand mistake. Zustand only re-renders a
        component when the value its selector returns actually changed (compared with{' '}
        <code>Object.is</code>) — which means the selector you write is a performance decision, not
        just a data-access one.
      </p>

      <CodeBlock language="tsx" title="Three selectors, three very different re-render profiles">
{`// ❌ Selecting the WHOLE store: this component re-renders on ANY change to
// ANY field in the store, even ones it doesn't use.
const store = useAppStore();

// ✅ Selecting ONE field: re-renders only when count itself changes.
const count = useAppStore((s) => s.count);

// ⚠️ Selecting MULTIPLE fields as an object literal: BROKEN. The selector
// runs on every store update and returns a brand-new object every time —
// Object.is(prevResult, newResult) is always false, so this re-renders on
// every single store change, defeating the entire purpose of narrowing.
const { count, name } = useAppStore((s) => ({ count: s.count, name: s.name }));`}
      </CodeBlock>

      <InfoBox variant="danger" title="Verified — the exact object-literal trap, logged">
        Called a naive multi-field selector twice against the <em>same</em> unchanged state:
        <CodeBlock language="text" title="Actual logged output">
{`const badSelector = (s) => ({ name: s.name, age: s.age });
r1 = badSelector(state);  r2 = badSelector(state);   // same state both times

Object.is(r1, r2)  -> false   // <- this is why it re-renders every single time
shallow(r1, r2)     -> true    // <- useShallow uses this instead, breaking the loop`}
        </CodeBlock>
        Two different object literals with identical contents are never{' '}
        <code>Object.is</code>-equal — that&apos;s not a bug, it&apos;s how JavaScript object
        identity works. It&apos;s also the classic route to a genuine{' '}
        <strong>infinite re-render</strong>: the new object triggers a re-render, the re-render
        calls the selector again, which produces yet another new object, forever.
      </InfoBox>

      <p>
        The fix for &quot;I need several fields but want them treated as equal when their values
        didn&apos;t change&quot; is <code>useShallow</code>, which swaps the equality check from{' '}
        <code>Object.is</code> to a shallow (one-level-deep) comparison:
      </p>

      <CodeBlock language="tsx" title="useShallow — multiple fields, without the re-render trap">
{`import { useShallow } from 'zustand/react/shallow';

// Same object-literal selector as above, wrapped in useShallow. The selector
// still returns a new object every call — but the component only re-renders
// when a value INSIDE that object actually differs from last time.
const { count, name } = useAppStore(
  useShallow((s) => ({ count: s.count, name: s.name })),
);

// The non-React comparator it's built on, for use outside components
// (e.g. comparing two selector results directly, or memoizing elsewhere):
import { shallow } from 'zustand/shallow';`}
      </CodeBlock>

      <InfoBox variant="tip" title="Verified — shallow() proven both ways">
        <CodeBlock language="text" title="Actual logged output">
{`a1 = { name: 'Ada', age: 30 };  a2 = { name: 'Ada', age: 30 };   // different refs, same k/v
Object.is(a1, a2)  -> false
shallow(a1, a2)     -> true

b1 = { name: 'Ada', age: 30 };  b2 = { name: 'Ada', age: 31 };   // one value differs
shallow(b1, b2)     -> false

c1 = { address: { city: 'London' } };  c2 = { address: { city: 'London' } };
shallow(c1, c2)     -> false   // nested object is a NEW reference: shallow is ONE level deep only`}
        </CodeBlock>
        <code>shallow</code> returns <code>true</code> for different references with equal
        top-level values, <code>false</code> the moment one value actually differs, and{' '}
        <code>false</code> for equal-looking nested objects that don&apos;t share a reference —
        exactly the one-level-deep contract it advertises. That last case is worth internalizing: if
        your selected fields include a nested object that&apos;s rebuilt each render,{' '}
        <code>useShallow</code> alone won&apos;t save you — narrow the selector further, down to the
        nested value itself.
      </InfoBox>

      <h2>TypeScript: the Curried create&lt;State&gt;()(...) Form</h2>
      <p>
        Once middleware is involved, <code>create&lt;State&gt;(stateCreator)</code> — one call, one
        generic — stops compiling. This isn&apos;t arbitrary API design; it&apos;s a real TypeScript
        inference limitation. <code>create</code> has a second, hidden type parameter that tracks{' '}
        <em>which middleware</em> are in the chain (so it knows the augmented shape of{' '}
        <code>set</code>/<code>get</code> each one produces), and TypeScript cannot infer both{' '}
        <code>State</code> and that middleware-mutator list from a single call. The curried form —
        call <code>create&lt;State&gt;()</code> first to pin down <code>State</code> explicitly, then
        call the result with your (possibly middleware-wrapped) state creator — splits it into two
        inference steps that each succeed on their own.
      </p>

      <CodeBlock language="tsx" title="Non-curried + middleware: a real compile error">
{`import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface BearState {
  bears: number;
  increase: (by: number) => void;
}

const useBearStore = create<BearState>(
  devtools((set) => ({
    bears: 0,
    increase: (by) => set((state) => ({ bears: state.bears + by })),
  })),
);
// error TS2345: Argument of type 'StateCreator<BearState, [], [["zustand/devtools", never]], ...>'
//   is not assignable to parameter of type 'StateCreator<BearState, [], []>'.
//     Types of property '$$storeMutators' are incompatible.
//       Type '[["zustand/devtools", never]]' is not assignable to type '[]'.
//         Source has 1 element(s) but target allows only 0.`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Curried form: the same store, compiles clean">
{`const useBearStore = create<BearState>()(
  devtools((set) => ({
    bears: 0,
    increase: (by) => set((state) => ({ bears: state.bears + by })),
  })),
);
// No error. create<BearState>() fixes State first; the returned function then
// infers the [["zustand/devtools", never]] mutator tuple from the devtools()
// call itself, and set/get inside the creator are typed with that mutator
// applied — e.g. devtools's set correctly accepts the third "action name" arg.`}
      </CodeBlock>

      <InfoBox variant="success" title="Verified — real tsc output, not a description">
        Compiled both versions above (TypeScript 6.0, strict mode) against the actual installed{' '}
        <code>zustand</code> type definitions. The non-curried version failed with exactly the{' '}
        <code>TS2345</code> / <code>$$storeMutators</code> error pasted above (exit code 2); the
        curried version compiled with zero errors (exit code 0). Same store, same middleware, same{' '}
        <code>strict: true</code> — the only difference is one extra pair of parentheses after the
        generic.
      </InfoBox>

      <p>
        With no middleware at all, <code>create&lt;State&gt;(stateCreator)</code> works fine — the
        mutator list is empty either way, so there&apos;s nothing for the single-call form to fail
        to infer. The curried form is only <em>required</em> once middleware enters the chain, but
        it&apos;s common to default to it everywhere so adding middleware later never means
        revisiting the call site.
      </p>

      <h2>Key Principles</h2>
      <p>
        <strong>1. Slices organize, they don&apos;t isolate.</strong> Every slice shares one{' '}
        <code>set</code>/<code>get</code>, so cross-slice actions are still trivial.{' '}
        <strong>2. Middleware order is innermost-out: immer, then persist, then devtools.</strong>{' '}
        Each wraps the one inside it, and getting this backwards breaks type inference or the
        behavior itself. <strong>3. immer trades manual spreading for real immutability</strong> —
        verified: the changed path gets new references, untouched branches keep theirs.{' '}
        <strong>4. There&apos;s no built-in computed</strong> — derive with a{' '}
        <code>get()</code>-based function in the store, or a selector outside it for anything
        expensive or testable in isolation. <strong>5. Async actions are just async functions</strong>{' '}
        — set a status before the <code>await</code>, set data or error after, inside a{' '}
        <code>try/catch</code>. <strong>6. What you select is what re-renders</strong> — whole-store
        reads over-render, narrow selectors are the default, and multi-field object-literal
        selectors need <code>useShallow</code> or they re-render (or infinite-loop) on every store
        change. <strong>7. Once middleware is in the chain, type the store with{' '}
        <code>create&lt;State&gt;()(...)</code></strong> — verified as a real compiler requirement,
        not a style preference.
      </p>
    </LessonLayout>
  );
}
