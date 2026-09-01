import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function ZustandCheatsheet() {
  return (
    <GuideLayout
      title="Zustand"
      kicker="FIELD GUIDE"
      glyph="🐻"
      tagline="State living outside the component tree — verified against zustand@5.0.15 (plus immer@11.1.17) via zustand/vanilla, no React or DOM required."
      meta={['zustand@5.0.15', 'immer@11.1.17', '9 panels']}
      page="1 / 1"
      footer="This page is the recall sheet — the two lessons before it carry the reasoning, the escalation ladder, and the worked examples."
      prev={{ path: '/state-mgmt/zustand-advanced', label: 'Zustand: Advanced Patterns' }}
      next={null}
    >
      <GuidePanel n={1} title="The Core Shape" accent="blue" glyph="🐻" span={2}>
        <GuideCode>{`import { create } from 'zustand';

const useBearStore = create((set, get) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

// No Provider, no wrapper — just import and call:
const bears = useBearStore((state) => state.bears);
const increase = useBearStore((state) => state.increasePopulation);`}</GuideCode>
        <GuideRules items={[
          'A store is a plain object living in module scope, outside the React tree — importing the hook IS the wiring.',
          "Context needs a Provider because its value is scoped to a subtree; a Zustand store isn't scoped to anything.",
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Where It Sits" accent="purple" glyph="🪜">
        <GuideRules items={[
          "Zustand is Rung 5 (a dedicated external store) on the section's escalation ladder — reach for it when a Profiler run shows real re-render pain, or non-React code needs to read/write shared state.",
          'If useState, lifting state up, or Context already solves the problem, Zustand adds nothing but a dependency.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="set() — Three Forms" accent="green" glyph="✏️">
        <GuideCode>{`set({ bears: 5 })                            // replace this key, merge with the rest
set((state) => ({ bears: state.bears + 1 })) // functional update — read old state safely
set(state => { state.bears++ }, false, 'increment')
                                              // immer middleware only —
                                              // mutate-looking syntax, real new object`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={4} title="Slices Pattern" accent="amber" glyph="🧩" span={2}>
        <GuideCode>{`export const createUserSlice = (set, get) => ({
  user: { name: '', loggedIn: false },
  login: (name) => set((s) => ({ user: { name, loggedIn: true } })),
});
export const createCartSlice = (set, get) => ({
  cart: { items: [], total: 0 },
  addItem: (price) => set((s) => ({
    cart: { items: [...s.cart.items, price], total: s.cart.total + price },
  })),
});

const useStore = create((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}));`}</GuideCode>
        <GuideRules items={[
          'Every slice shares the same set/get — a cart action can read get().user.loggedIn. Slices are organization, not isolation.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Middleware Order" accent="pink" glyph="🧱" span={2}>
        <GuideCode>{`import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create()(
  devtools(
    persist(
      immer((set) => ({
        user: { profile: { address: { city: 'NYC' } } },
        moveTo: (city) => set((state) => { state.user.profile.address.city = city; }),
      })),
      { name: 'app-store', partialize: (s) => ({ user: s.user }) },
    ),
    { name: 'AppStore' },
  ),
);`}</GuideCode>
        <GuideTable
          head={['Middleware', 'Does', 'Verified gotcha']}
          rows={[
            ['immer', 'mutate-looking syntax, real new objects', "Untouched branches stay Object.is-equal — only the changed path gets new references"],
            ['persist', 'writes to storage on every set, rehydrates on load', 'Default merge is shallow — a partialized nested object silently drops sibling keys on rehydrate'],
            ['devtools', 'Redux DevTools integration, named actions', 'Runs harmlessly with the extension absent — no crash, no-op'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={6} title="persist + partialize Gotcha" accent="cyan" glyph="⚠️">
        <GuideRules items={[
          'partialize trims a nested key down to a subset (e.g. keeping only user.name) — the default shallow merge REPLACES the entire user object on rehydrate.',
          'Sibling fields like user.token come back undefined, not their default.',
          "Fix with a custom merge: (persisted, current) => deepMerge(current, persisted), or don't nest what you persist.",
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Performance — Selectors" accent="red" glyph="⚡" span={2}>
        <GuideCode>{`useStore((s) => s)                    // re-renders on ANY change to ANY field
useStore((s) => s.bears)              // re-renders only when 'bears' changes

import { useShallow } from 'zustand/react/shallow';
useStore(useShallow((s) => ({ bears: s.bears, fish: s.fish })))
// selecting multiple fields without useShallow makes a new object
// literal every render -> infinite loop`}</GuideCode>
        <GuideRules items={[
          'shallow(a, b) is true for different refs with equal top-level k/v pairs, false the moment any value differs.',
          'Shallow comparison is one level deep only — nested objects that look equal but are different references still fail it.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Async Actions" accent="blue" glyph="⏳">
        <GuideCode>{`const useUserStore = create((set) => ({
  user: null, loading: false, error: null,
  fetchUser: async (id) => {
    set({ loading: true, error: null });
    try {
      const user = await fetch(\`/api/users/\${id}\`).then(r => r.json());
      set({ user, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={9} title="TypeScript — Curried create" accent="purple" glyph="🔡">
        <GuideDefs
          items={[
            ['create<State>(devtools(...))', 'TS2345 — a single generic call cannot infer through the middleware type augmentation ($$storeMutators)'],
            ['create<State>()(devtools(...))', 'compiles clean — infers State from the first call, then applies the middleware transform on the second'],
          ]}
        />
        <GuideRules items={['The extra () is deliberate — not a typo.']} />
      </GuidePanel>
    </GuideLayout>
  );
}
