import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ZustandCheatsheet() {
  return (
    <LessonLayout
      title="📋 Zustand Field Guide"
      sectionId="state-zustand"
      lessonIndex={2}
      prev={{ path: '/state-mgmt/zustand-advanced', label: 'Zustand: Advanced Patterns' }}
      next={null}
    >
      <p>
        A single-page reconciliation of the two Zustand lessons that precede this one. Every
        behavior below was verified for real against <code>zustand@5.0.15</code> (plus{' '}
        <code>immer@11.1.17</code> for the middleware section) via its framework-agnostic{' '}
        <code>zustand/vanilla</code> API — no React or DOM required to prove any of it.
      </p>

      <h2>The Core Shape</h2>

      <CodeBlock language="tsx" title="Every Zustand store starts here">
{`import { create } from 'zustand';

const useBearStore = create((set, get) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

// In a component — no Provider, no wrapper, just import and call:
const bears = useBearStore((state) => state.bears);
const increase = useBearStore((state) => state.increasePopulation);`}
      </CodeBlock>

      <InfoBox variant="info" title="No Provider — and why that's actually possible">
        <p>
          Context needs a Provider because a context value is scoped to a subtree. A Zustand store
          isn&apos;t scoped to anything — it&apos;s a plain object living in module scope, outside
          the React tree entirely. Importing the hook <em>is</em> the wiring.
        </p>
      </InfoBox>

      <h2>Where It Sits on the Escalation Ladder</h2>

      <p>
        Zustand isn&apos;t a new rung — it&apos;s <strong>Rung 5</strong> (a dedicated external
        store) from the State Management section&apos;s escalation ladder, chosen when a Profiler
        run shows real re-render pain or non-React code needs to read/write shared state. If{' '}
        <code>useState</code>, lifting state up, or Context already solves the problem, Zustand
        adds nothing but a dependency.
      </p>

      <h2>set() — the Three Forms</h2>

      <CodeBlock language="tsx" title="Verified against zustand/vanilla">
{`set({ bears: 5 })                          // replace this key, merge with the rest
set((state) => ({ bears: state.bears + 1 })) // functional update — read old state safely
set(state => { state.bears++ }, false, 'increment')  // only inside immer middleware —
                                                        // mutate-looking syntax, real new object`}
      </CodeBlock>

      <h2>Slices Pattern</h2>

      <CodeBlock language="tsx" title="Split by concern, combine with spread inside ONE create() call">
{`export const createUserSlice = (set, get) => ({
  user: { name: '', loggedIn: false },
  login: (name) => set((s) => ({ user: { name, loggedIn: true } })),
});
export const createCartSlice = (set, get) => ({
  cart: { items: [], total: 0 },
  addItem: (price) => set((s) => ({ cart: { items: [...s.cart.items, price], total: s.cart.total + price } })),
});

const useStore = create((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}));
// Verified: every slice shares the same set/get, so a cart action can read
// get().user.loggedIn — slices are organization, not isolation.`}
      </CodeBlock>

      <h2>Middleware — Correct Wrapping Order</h2>

      <CodeBlock language="tsx" title="devtools(persist(immer(...))) — verified running together">
{`import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create()(
  devtools(
    persist(
      immer((set) => ({
        user: { profile: { address: { city: 'NYC' } } },
        settings: { notifications: true },
        moveTo: (city) => set((state) => { state.user.profile.address.city = city; }),
      })),
      { name: 'app-store', partialize: (s) => ({ user: s.user }) },
    ),
    { name: 'AppStore' },
  ),
);`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Middleware</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Does</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Verified gotcha</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>immer</code></td>
            <td style={{ padding: '0.75rem' }}>mutate-looking syntax, real new objects</td>
            <td style={{ padding: '0.75rem' }}>Untouched branches stay <code>Object.is</code>-equal — only the changed path gets new references</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>persist</code></td>
            <td style={{ padding: '0.75rem' }}>writes to storage on every <code>set</code>, rehydrates on load</td>
            <td style={{ padding: '0.75rem' }}>Default <code>merge</code> is <strong>shallow</strong> — a <code>partialize</code>d nested object silently drops sibling keys on rehydrate</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}><code>devtools</code></td>
            <td style={{ padding: '0.75rem' }}>Redux DevTools integration, named actions</td>
            <td style={{ padding: '0.75rem' }}>Runs harmlessly with the extension absent — no crash, no-op</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="persist + partialize + nested objects — verified real bug shape">
        <p>
          If <code>partialize</code> trims a nested key down to a subset (e.g. keeping only{' '}
          <code>user.name</code>), the default shallow <code>merge</code> replaces the{' '}
          <em>entire</em> <code>user</code> object on rehydrate — sibling fields like{' '}
          <code>user.token</code> come back <code>undefined</code>, not their default. Fix with a
          custom <code>merge: (persisted, current) =&gt; deepMerge(current, persisted)</code>, or
          don&apos;t nest what you persist.
        </p>
      </InfoBox>

      <h2>Performance — The One Mistake That Shows Up Everywhere</h2>

      <CodeBlock language="tsx" title="Verified: whole-store vs narrow selector vs multi-field">
{`useStore((s) => s)                    // ❌ re-renders on ANY change to ANY field
useStore((s) => s.bears)              // ✅ re-renders only when 'bears' changes

// Selecting multiple fields needs shallow comparison, or you get a new
// object literal every render -> infinite loop:
import { useShallow } from 'zustand/react/shallow';
useStore(useShallow((s) => ({ bears: s.bears, fish: s.fish })))

// Verified: shallow(a, b) is true for different refs with equal top-level
// k/v pairs, false the moment any value differs, and false for nested
// objects that look equal but are different references (one level deep only).`}
      </CodeBlock>

      <h2>Async Actions</h2>

      <CodeBlock language="tsx" title="Loading / success / error, right inside the store">
{`const useUserStore = create((set) => ({
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
}));`}
      </CodeBlock>

      <h2>TypeScript — Why create&lt;T&gt;()(...) Is Curried</h2>

      <CodeBlock language="tsx" title="Verified: the non-curried form really fails to compile with middleware">
{`// ❌ create<State>(devtools(...))
// error TS2345 — middleware augments the store's type ($$storeMutators),
// and a single generic call can't infer through that augmentation.

// ✅ create<State>()(devtools(...))  — the extra () is deliberate
// The curried form lets TypeScript infer State from the first call,
// THEN apply the middleware's type transformation on the second. Compiles clean.`}
      </CodeBlock>

      <h2>Section Index</h2>

      <CodeBlock language="text" title="Both lessons, in reading order">
{`1. Zustand: Fundamentals        create(), the hook, actions, narrow selectors, vanilla verified
2. Zustand: Advanced Patterns   slices, persist/devtools/immer, computed values, async actions,
                                 useShallow, curried TypeScript typing
3. This page`}
      </CodeBlock>
    </LessonLayout>
  );
}
