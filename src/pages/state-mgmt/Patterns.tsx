import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Patterns() {
  return (
    <LessonLayout
      title="Real-World Patterns"
      sectionId="state-mgmt"
      lessonIndex={2}
      prev={{ path: '/state-mgmt/comparison', label: 'The State Escalation Ladder' }}
      next={{ path: '/state-mgmt/react-query', label: 'TanStack Query' }}
    >
      <p>
        The previous lesson decided <em>which rung</em> to stand on. This one is the production
        toolkit for the rung most apps live on: <strong>Context composed with useReducer</strong>.
        Everything here is built-in React — no dependencies — and covers the problems that actually
        show up in a real codebase: unnecessary re-renders, provider nesting, normalization,
        optimistic updates, undo, persistence, and testing.
      </p>

      <h2>The Canonical Pattern: Context + useReducer</h2>
      <p>
        A reducer gives you the transition logic; Context gives you the distance. Composed, they
        are a small, typed, testable store — and the whole thing fits in one file per feature.
        Three details separate the production version from the tutorial version:{' '}
        <strong>two contexts instead of one</strong>, <strong>hooks that throw when the provider is
        missing</strong>, and <strong>the reducer exported on its own</strong> so it can be tested
        without React.
      </p>

      <CodeBlock language="tsx" title="features/cart/CartContext.tsx — the complete pattern">
{`import {
  createContext, useContext, useReducer, useMemo,
  type Dispatch, type ReactNode,
} from 'react';

// ── 1. Types ────────────────────────────────────────────────────────────────
export interface CartItem { id: string; name: string; price: number; qty: number }
export interface CartState { items: CartItem[]; coupon: string | null }

export type CartAction =
  | { type: 'added'; item: Omit<CartItem, 'qty'> }
  | { type: 'removed'; id: string }
  | { type: 'qtyChanged'; id: string; qty: number }
  | { type: 'couponApplied'; code: string }
  | { type: 'cleared' };

export const initialCartState: CartState = { items: [], coupon: null };

// ── 2. The reducer — a pure function, exported for direct unit testing ──────
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'added': {
      const existing = state.items.find((i) => i.id === action.item.id);
      return {
        ...state,
        items: existing
          ? state.items.map((i) =>
              i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i)
          : [...state.items, { ...action.item, qty: 1 }],
      };
    }
    case 'removed':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'qtyChanged':
      return {
        ...state,
        items: action.qty <= 0
          ? state.items.filter((i) => i.id !== action.id)
          : state.items.map((i) =>
              i.id === action.id ? { ...i, qty: action.qty } : i),
      };
    case 'couponApplied':
      return { ...state, coupon: action.code };
    case 'cleared':
      return initialCartState;
    default: {
      // Exhaustiveness check: adding an action without handling it fails to compile
      const _never: never = action;
      return state;
    }
  }
}

// ── 3. TWO contexts: one for the value, one for dispatch ───────────────────
const CartStateContext = createContext<CartState | null>(null);
const CartDispatchContext = createContext<Dispatch<CartAction> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  return (
    <CartDispatchContext.Provider value={dispatch}>
      <CartStateContext.Provider value={state}>
        {children}
      </CartStateContext.Provider>
    </CartDispatchContext.Provider>
  );
}

// ── 4. Hooks that fail loudly instead of returning undefined ───────────────
export function useCart(): CartState {
  const ctx = useContext(CartStateContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

export function useCartDispatch(): Dispatch<CartAction> {
  const ctx = useContext(CartDispatchContext);
  if (!ctx) throw new Error('useCartDispatch must be used inside <CartProvider>');
  return ctx;
}

// ── 5. Derived values belong in hooks, not in state ────────────────────────
export function useCartTotal(): number {
  const { items } = useCart();
  return useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items],
  );
}`}
      </CodeBlock>

      <h3>Why Two Contexts</h3>
      <p>
        This is the highest-value line in the pattern. <code>dispatch</code> has a stable identity
        for the life of the provider, so <code>CartDispatchContext</code> never changes value —
        which means every component that only <em>writes</em> is permanently insulated from state
        changes. In a typical app that is most of them: every &quot;Add to cart&quot; button on a
        product grid, every remove button, every quantity stepper.
      </p>

      <CodeBlock language="tsx" title="Write-only components never re-render">
{`// This button subscribes to dispatch only. Adding 200 items to the cart
// re-renders it exactly zero times.
function AddToCartButton({ product }: { product: Product }) {
  const dispatch = useCartDispatch();
  return (
    <button onClick={() => dispatch({ type: 'added', item: product })}>
      Add to cart
    </button>
  );
}

// Only this one re-renders when the cart changes.
function CartBadge() {
  const { items } = useCart();
  return <span>{items.length}</span>;
}

// ❌ The single-context version: value is { state, dispatch }, so its identity
//    changes on every state change and BOTH components above re-render.`}
      </CodeBlock>

      <InfoBox variant="tip" title="No useMemo Needed Here">
        Because state and dispatch are provided separately, neither provider value is an object
        literal — <code>state</code> is already a new identity only when it genuinely changed, and{' '}
        <code>dispatch</code> is stable. The <code>useMemo</code> ceremony that single-context
        providers require disappears entirely. That is a correctness win, not just a performance
        one: a forgotten <code>useMemo</code> is invisible until a profiler finds it.
      </InfoBox>

      <h2>Splitting Contexts by Concern</h2>
      <p>
        The same logic extends past state/dispatch. Group values by <strong>update
        frequency</strong>, not by domain tidiness: things that change together belong together,
        and things that change at wildly different rates must be separated or the fast one drags
        the slow one&apos;s consumers along with it.
      </p>

      <CodeBlock language="tsx" title="One 'AppContext' → several honest ones">
{`// ❌ The god context: a theme change re-renders every cart consumer
const AppContext = createContext({ user, theme, cart, notifications, sidebarOpen });

// ✅ Split by how often each thing changes
<AuthProvider>             {/* changes ~once per session   */}
  <ThemeProvider>          {/* changes ~once per session   */}
    <NotificationProvider> {/* changes a few times a minute */}
      <CartProvider>       {/* changes per click            */}
        <App />
      </CartProvider>
    </NotificationProvider>
  </ThemeProvider>
</AuthProvider>`}
      </CodeBlock>

      <p>
        A useful sanity check: if a context&apos;s value contains two fields and you cannot name a
        single component that reads both, it should be two contexts.
      </p>

      <h2>Provider Hell and How to Fix It</h2>
      <p>
        Splitting contexts produces the well-known pyramid at the app root. The pyramid itself is
        cosmetic; the real problems are that every provider mounts for every route, and that
        feature state lives structurally as far from the feature as it possibly could. There are
        three fixes, in increasing order of value.
      </p>

      <CodeBlock language="tsx" title="Fix 1 — flatten the pyramid (cosmetic but free)">
{`type ProviderComponent = ({ children }: { children: ReactNode }) => ReactNode;

function composeProviders(...providers: ProviderComponent[]) {
  return function Composed({ children }: { children: ReactNode }) {
    return providers.reduceRight<ReactNode>(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children,
    );
  };
}

const AppProviders = composeProviders(
  ThemeProvider,
  AuthProvider,
  NotificationProvider,
);

// <AppProviders><App /></AppProviders>`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Fix 2 — colocate: mount the provider where the feature lives">
{`// ❌ CheckoutProvider at the root: mounted on every page, state survives
//    navigations that should have reset it, and every route pays for it.

// ✅ Scoped to the routes that need it. The state is created on entry and
//    garbage collected on exit — no manual 'reset' action required.
<Routes>
  <Route path="/products" element={<ProductList />} />
  <Route
    path="/checkout/*"
    element={
      <CheckoutProvider>
        <CheckoutFlow />
      </CheckoutProvider>
    }
  />
</Routes>

// The same idea per-instance: one provider per row, not one for the table.
// Each <EditableRow> owns its own draft state, and editing row 4 cannot
// re-render rows 1-3.
{rows.map((row) => (
  <RowDraftProvider key={row.id} initial={row}>
    <EditableRow />
  </RowDraftProvider>
))}`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Fix 3 — providers must render children as a prop">
{`// ❌ The provider renders the tree itself, so its own state changes
//    re-render everything below it, context or not.
function BadProvider() {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <Ctx.Provider value={state}>
      <Header />
      <Main />       {/* re-created on every state change */}
    </Ctx.Provider>
  );
}

// ✅ children arrives as an already-created element, so React reuses it.
//    Only actual context consumers re-render.
function GoodProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Signal That You've Split Too Far">
        Splitting has a real cost: a component needing four contexts now calls four hooks, and
        testing it means wrapping it in four providers. When you find yourself writing a{' '}
        <code>renderWithAllProviders</code> helper just to mount a single component, you have gone
        past the point where a store with selectors would have been simpler. That is a legitimate
        moment to climb the last rung.
      </InfoBox>

      <h2>Selector-Style Reads Without a Library</h2>
      <p>
        Context has no selectors — but you can get the same behavior by putting a{' '}
        <em>stable store object</em> in the context instead of the state itself. The context value
        then never changes, so nothing re-renders through Context at all; components subscribe
        individually via <code>useSyncExternalStore</code> and re-render only when their own slice
        changes. This is the pattern behind libraries like <code>use-context-selector</code>, and
        it keeps the scoping benefit of Context (per-route, per-row instances) that a
        module-level store gives up.
      </p>

      <CodeBlock language="tsx" title="Context that holds a store, not a value">
{`import { createContext, useContext, useRef, useSyncExternalStore, type ReactNode } from 'react';

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(update: (prev: T) => T) {
      const next = update(state);
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

type Store<T> = ReturnType<typeof createStore<T>>;
const FormStoreContext = createContext<Store<FormState> | null>(null);

export function FormStoreProvider({ children }: { children: ReactNode }) {
  // useRef so the store is created once and its identity never changes.
  // React 19 requires an explicit initial argument — useRef<T>() no longer compiles.
  const storeRef = useRef<Store<FormState> | null>(null);
  storeRef.current ??= createStore<FormState>({ values: {}, errors: {} });
  return (
    <FormStoreContext.Provider value={storeRef.current}>
      {children}
    </FormStoreContext.Provider>
  );
}

// The selector hook: re-renders ONLY when the selected slice changes identity
export function useFormStore<S>(selector: (state: FormState) => S): S {
  const store = useContext(FormStoreContext);
  if (!store) throw new Error('useFormStore must be used inside <FormStoreProvider>');
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

// A field re-renders on its own keystrokes only — not on any other field's
function Field({ name }: { name: string }) {
  const value = useFormStore((s) => s.values[name] ?? '');
  const store = useContext(FormStoreContext)!;
  return (
    <input
      value={value}
      onChange={(e) =>
        store.set((s) => ({ ...s, values: { ...s.values, [name]: e.target.value } }))
      }
    />
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The getSnapshot Rule">
        The snapshot function must return a value that is <code>Object.is</code>-stable when nothing
        changed. Returning a fresh object — <code>() =&gt; ({'{'} a: s.a, b: s.b {'}'})</code> — makes React
        re-render on every store notification and, in development, throws &quot;The result of
        getSnapshot should be cached.&quot; Select primitives, or select the same object reference
        your reducer preserved. For genuinely derived objects, use{' '}
        <code>useSyncExternalStoreWithSelector</code> from <code>use-sync-external-store/shim</code>,
        which accepts an equality function.
      </InfoBox>

      <p>
        The cheaper, dependency-free 80% solution when only one expensive child is the problem:
        keep plain Context, and put the memo boundary between the consumer and the expensive work.
      </p>

      <CodeBlock language="tsx" title="Memo boundary — the poor man's selector">
{`// The consumer re-renders (it must — it reads context), but the expensive
// child only re-renders when the specific slice it receives actually changes.
const ExpensiveChart = memo(function ExpensiveChart({ points }: { points: Point[] }) {
  /* thousands of SVG nodes */
});

function ChartPanel() {
  const { series, hoveredId } = useDashboard();   // re-renders on any change
  const points = useMemo(() => series.map(toPoint), [series]);
  return <ExpensiveChart points={points} />;      // skipped when only hoveredId changed
}`}
      </CodeBlock>

      <h2>Normalized State Shape</h2>
      <p>
        When a reducer manages relational data (users, posts, comments), normalize it like a
        database: entities by ID in a lookup table, plus an ordered array of IDs. This eliminates
        duplicate data, makes updates O(1), and keeps a reducer update from touching unrelated
        objects — which matters because untouched object identities are what let memoized children
        skip rendering.
      </p>

      <CodeBlock language="tsx" title="Normalized vs denormalized">
{`// ❌ Denormalized — duplicated user data, hard to update consistently
const state = {
  posts: [
    { id: 'p1', title: 'Hello', author: { id: 'u1', name: 'Alice' } },
    { id: 'p2', title: 'World', author: { id: 'u1', name: 'Alice' } },
    // If Alice changes her name, you must update EVERY post
  ],
};

// ✅ Normalized — single source of truth per entity
interface NormalizedState {
  users: Record<string, User>;
  posts: Record<string, Post>;      // Post holds authorId, not the author
  postIds: string[];                // order lives separately from entities
}

// A rename touches exactly one object; every post object keeps its identity,
// so memoized <PostRow> components don't re-render.
case 'userRenamed':
  return {
    ...state,
    users: {
      ...state.users,
      [action.id]: { ...state.users[action.id], name: action.name },
    },
  };`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Small normalization helpers — all you need">
{`export const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

export const upsert = <T extends { id: string }>(
  table: Record<string, T>,
  item: T,
): Record<string, T> => ({ ...table, [item.id]: item });

export const removeKey = <T,>(table: Record<string, T>, id: string): Record<string, T> => {
  const { [id]: _removed, ...rest } = table;
  return rest;
};

// Denormalize at the edge, memoized, never in state
export function usePostsWithAuthors() {
  const { posts, postIds, users } = usePostState();
  return useMemo(
    () => postIds.map((id) => ({ ...posts[id], author: users[posts[id].authorId] })),
    [posts, postIds, users],
  );
}`}
      </CodeBlock>

      <h2>Your Reducer Is Already a State Machine</h2>
      <p>
        A reducer that switches on <code>action.type</code> only is a bag of transitions. A reducer
        that switches on <strong>the current status first</strong> is a state machine — and it
        makes an entire class of race conditions unrepresentable, like a late response from a
        cancelled request overwriting fresh data.
      </p>

      <CodeBlock language="tsx" title="Guarding transitions by current state">
{`type CheckoutState =
  | { status: 'cart' }
  | { status: 'shipping'; address: Address | null }
  | { status: 'paying'; address: Address }
  | { status: 'confirmed'; orderId: string }
  | { status: 'failed'; address: Address; reason: string };

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (state.status) {
    case 'cart':
      return action.type === 'proceed'
        ? { status: 'shipping', address: null }
        : state;

    case 'shipping':
      if (action.type === 'addressSet') return { ...state, address: action.address };
      if (action.type === 'proceed' && state.address)
        return { status: 'paying', address: state.address };
      return state;

    case 'paying':
      if (action.type === 'paid') return { status: 'confirmed', orderId: action.orderId };
      if (action.type === 'failed')
        return { status: 'failed', address: state.address, reason: action.reason };
      return state;   // a second 'paid' event is silently ignored — no double order

    case 'confirmed':
      return state;   // terminal

    case 'failed':
      return action.type === 'retry'
        ? { status: 'paying', address: state.address }
        : state;
  }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="When to Reach for XState">
        Hand-rolled machines stop scaling around a dozen states, or when you need parallel regions,
        hierarchical states, delayed transitions, or a visualizer the whole team can read. XState
        formalizes all of that. It solves a different axis than Context — the legal transitions, not
        the distribution — and the two compose: XState for the workflow, Context to hand the machine
        to descendants.
      </InfoBox>

      <h2>Optimistic Updates</h2>
      <p>
        Show the result immediately, then reconcile with the server. If the server rejects the
        change, roll back. With a reducer the rollback is trivial, because the previous state is
        just a value you already have.
      </p>

      <FlowChart
        title="Optimistic Update Flow"
        chart={"graph TD\n  A[User Action] --> B[Dispatch optimistic action]\n  B --> C[Send API Request]\n  C --> D{Server Response}\n  D -->|Success| E[Dispatch confirmed]\n  D -->|Failure| F[Dispatch rollback with snapshot]\n  F --> G[Show Error Toast]\n  style B fill:#10b981,color:#fff\n  style F fill:#ef4444,color:#fff"}
      />

      <CodeBlock language="tsx" title="Async actions live in hooks, never in the reducer">
{`// The reducer stays pure and synchronous. Effects belong in a hook that
// dispatches around them — that boundary is what keeps the reducer testable.
export function useToggleTodo() {
  const state = useTodoState();
  const dispatch = useTodoDispatch();

  return useCallback(async (id: string) => {
    const snapshot = state.items;             // 1. capture for rollback
    dispatch({ type: 'toggled', id });        // 2. optimistic, instant UI

    try {
      const completed = !state.items.find((t) => t.id === id)?.completed;
      const res = await fetch(\`/api/todos/\${id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error(res.statusText);
    } catch {
      dispatch({ type: 'restored', items: snapshot });   // 3. roll back
      toast.error('Failed to update todo');
    }
  }, [state.items, dispatch]);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="React 19: useOptimistic">
        For the common &quot;show it now, let the real value replace it&quot; case, React 19 ships{' '}
        <code>useOptimistic</code>, which layers a temporary value over real state and discards it
        automatically when the transition settles — no snapshot, no rollback action. Reach for the
        manual pattern above when the optimistic value must survive across components or outlive a
        single transition.
      </InfoBox>

      <h2>Undo/Redo as a Higher-Order Reducer</h2>
      <p>
        Because a reducer is a plain function, you can wrap it. <code>withHistory</code> takes any
        reducer and returns one that tracks past and future stacks — the feature reducer never
        learns that undo exists.
      </p>

      <CodeBlock language="tsx" title="withHistory — works with any reducer">
{`export interface History<T> { past: T[]; present: T; future: T[] }

type HistoryAction = { type: 'undo' } | { type: 'redo' };

export function withHistory<T, A>(
  reducer: (state: T, action: A) => T,
  { limit = 50 }: { limit?: number } = {},
) {
  return function historyReducer(
    state: History<T>,
    action: A | HistoryAction,
  ): History<T> {
    if ((action as HistoryAction).type === 'undo') {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    if ((action as HistoryAction).type === 'redo') {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest };
    }

    const present = reducer(state.present, action as A);
    if (Object.is(present, state.present)) return state;   // no-op: don't record
    return {
      past: [...state.past, state.present].slice(-limit),   // bound the memory
      present,
      future: [],                                           // a new edit clears redo
    };
  };
}

const [{ present: doc }, dispatch] = useReducer(
  withHistory(documentReducer),
  { past: [], present: initialDoc, future: [] },
);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two Things That Bite">
        Snapshot history holds a full copy of state per entry — bound it with a limit, or store
        inverse actions (command pattern) instead of snapshots for large documents. And typing
        &quot;hello&quot; should be one undo step, not five: debounce or coalesce consecutive
        actions of the same type within a short window before pushing to <code>past</code>.
      </InfoBox>

      <h2>Persistence</h2>
      <p>
        With <code>useReducer</code>, persistence is two pieces: a lazy initializer that reads once
        on mount, and an effect that writes on change. Version the payload from day one — the shape
        <em>will</em> change, and users have your old shape in their browser.
      </p>

      <CodeBlock language="tsx" title="Versioned localStorage persistence">
{`const STORAGE_KEY = 'app-settings';
const VERSION = 2;

function loadSettings(fallback: Settings): Settings {
  if (typeof window === 'undefined') return fallback;   // SSR guard
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { version: number; state: Record<string, unknown> };
    return { ...fallback, ...migrate(parsed) };         // merge: new keys get defaults
  } catch {
    return fallback;   // corrupt JSON or blocked storage must never crash boot
  }
}

function migrate({ version, state }: { version: number; state: any }): Partial<Settings> {
  if (version < 1) {
    state.theme = state.darkMode ? 'dark' : 'light';    // v0 → v1
    delete state.darkMode;
  }
  if (version < 2) state.fontSize ??= 16;               // v1 → v2
  return state;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Third argument = lazy init, runs once instead of on every render
  const [state, dispatch] = useReducer(settingsReducer, defaultSettings, loadSettings);

  useEffect(() => {
    const { draft, ...persisted } = state;              // skip transient fields
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: VERSION, state: persisted }),
    );
  }, [state]);

  return /* providers */;
}`}
      </CodeBlock>

      <h2>Cross-Tab Sync</h2>
      <p>
        When the app is open in several tabs, an action in one should reach the others — logging out
        in one tab must log out all of them. <code>BroadcastChannel</code> does this natively, and
        with a reducer you broadcast <em>actions</em> rather than whole state: smaller messages, and
        each tab applies the same transition through the same pure function.
      </p>

      <CodeBlock language="tsx" title="Broadcast actions, not state">
{`export function useSyncedReducer<S, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  initial: S,
  channelName: string,
) {
  const [state, rawDispatch] = useReducer(reducer, initial);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;
    // Remote actions are applied WITHOUT re-broadcasting (no echo loop)
    channel.onmessage = (e: MessageEvent<A>) => rawDispatch(e.data);
    return () => { channel.close(); channelRef.current = null; };
  }, [channelName]);

  const dispatch = useCallback((action: A) => {
    rawDispatch(action);
    channelRef.current?.postMessage(action);
  }, []);

  return [state, dispatch] as const;
}

// Beware of non-deterministic actions: { type: 'added', id: crypto.randomUUID() }
// must generate the id at DISPATCH time (as above) and not inside the reducer,
// or each tab produces a different id from the same message.`}
      </CodeBlock>

      <h2>Form State Stays Out of It</h2>
      <p>
        Form state is local, ephemeral, and updates on every keystroke — the exact profile Context
        handles worst. Dedicated libraries use uncontrolled inputs and refs to avoid re-rendering
        during typing at all.
      </p>

      <CodeBlock language="tsx" title="React Hook Form + Zod">
{`import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']),
});

type FormValues = z.infer<typeof schema>;   // types derived from the schema

function UserForm({ onSubmit }: { onSubmit: (v: FormValues) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { name: '', email: '', role: 'viewer' },
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit" disabled={isSubmitting}>Save</button>
    </form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Never Put Draft Form State in a Shared Context">
        A 10-field form in Context re-renders every consumer on every keystroke. Keep the draft
        local — <code>useState</code>, <code>useReducer</code>, or React Hook Form — and dispatch to
        the shared context <em>once</em>, on submit. The only exception is a genuinely multi-step
        wizard whose steps are separate routes, and even then the shared value should be the
        accumulated result of completed steps, not the field currently being typed into.
      </InfoBox>

      <h2>Testing</h2>
      <p>
        The payoff for keeping the reducer pure: most of your state logic is testable with no
        rendering, no mocking, and no async. Test the reducer directly, and test components against
        a provider wrapper.
      </p>

      <CodeBlock language="tsx" title="Reducer tests need no React at all">
{`import { cartReducer, initialCartState } from './CartContext';

test('adding the same product twice increments quantity', () => {
  const item = { id: 'p1', name: 'Mug', price: 9 };
  const once = cartReducer(initialCartState, { type: 'added', item });
  const twice = cartReducer(once, { type: 'added', item });

  expect(twice.items).toHaveLength(1);
  expect(twice.items[0].qty).toBe(2);
});

test('setting quantity to zero removes the item', () => {
  const state = { items: [{ id: 'p1', name: 'Mug', price: 9, qty: 3 }], coupon: null };
  expect(cartReducer(state, { type: 'qtyChanged', id: 'p1', qty: 0 }).items).toEqual([]);
});

test('unrelated actions preserve state identity', () => {
  const state = { items: [], coupon: null };
  // Identity preservation is a real contract — memoized children depend on it
  expect(cartReducer(state, { type: 'removed', id: 'nope' }).items).toBe(state.items);
});`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Component and hook tests with a provider wrapper">
{`import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart, useCartDispatch } from './CartContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

test('add button updates the badge', async () => {
  render(<><AddToCartButton product={{ id: 'p1', name: 'Mug', price: 9 }} /><CartBadge /></>,
    { wrapper });

  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  expect(screen.getByText('1')).toBeInTheDocument();
});

test('useCart throws a useful error outside its provider', () => {
  // Guard hooks are worth one test — they turn a confusing null crash
  // deep in a component into an actionable message.
  expect(() => renderHook(() => useCart())).toThrow(/inside <CartProvider>/);
});`}
      </CodeBlock>

      <h2>Putting It Together</h2>

      <FlowChart
        title="Production State Architecture"
        chart={"graph TD\n  APP[React App] --> SS[Server State]\n  APP --> CS[Client State]\n  APP --> FS[Form State]\n  APP --> US[URL State]\n  SS --> TQ[TanStack Query]\n  CS --> LOCAL[useState / useReducer - colocated]\n  CS --> CTX[Context + useReducer - shared]\n  FS --> RHF[React Hook Form]\n  US --> RR[React Router]\n  CTX --> SPLIT[Split state / dispatch]\n  CTX --> PERSIST[Lazy init + effect persistence]\n  TQ --> CACHE[Automatic Cache]\n  style TQ fill:#10b981,color:#fff\n  style CTX fill:#3b82f6,color:#fff\n  style LOCAL fill:#6b7280,color:#fff\n  style RHF fill:#f59e0b,color:#fff\n  style RR fill:#8b5cf6,color:#fff"}
      />

      <CodeBlock language="tsx" title="What a real feature actually uses">
{`function CheckoutPage() {
  // Server state — TanStack Query owns the cache, not your reducer
  const { data: shippingOptions } = useQuery({
    queryKey: ['shipping'], queryFn: fetchShipping,
  });

  // Shared client state — Context + useReducer, scoped to this route
  const cart = useCart();
  const dispatch = useCartDispatch();

  // Derived — computed during render, never stored
  const total = useCartTotal();

  // Form state — local, ephemeral, dispatched upward only on submit
  const { register, handleSubmit } = useForm<AddressForm>();

  // URL state — shareable and bookmarkable
  const [params] = useSearchParams();
  const step = params.get('step') ?? 'address';

  // Low-frequency globals — Context, no reducer needed
  const { locale } = useLocale();

  // Five tools, five distinct problems. That isn't over-engineering —
  // the over-engineered version is forcing all five into one store.
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"A data-grid page keeps filters, the selected row, and a per-row inline draft in one Context. Typing in a draft field visibly lags: the Profiler shows all 200 rows re-rendering per keystroke. What's the smallest fix that actually works?"}
        options={[
          'Wrap each row in React.memo',
          'Wrap the context value in useMemo',
          'Move the draft into a provider mounted per row, and split state from dispatch',
          'Replace Context with an external store',
        ]}
        correctIndex={2}
        explanation="React.memo cannot stop a context update — rows read the context, so the update goes around memo. useMemo on the value only prevents re-renders when nothing changed; here the draft genuinely changed, so every consumer still re-renders. Colocating the draft in a per-row provider means a keystroke only invalidates that one row, and splitting dispatch out keeps write-only controls inert. An external store would also work, but it's a dependency and a rewrite when a scoping fix costs half an hour."
        language="tsx"
      />

      <h2>Key Principles</h2>
      <p>
        <strong>1. Two contexts, always.</strong> State and dispatch separately — write-only
        components then never re-render. <strong>2. Keep reducers pure.</strong> Effects go in
        hooks that dispatch around them; that boundary is what makes the logic testable.{' '}
        <strong>3. Scope providers to features.</strong> Colocation fixes both provider hell and
        most performance problems, and gives you free state reset on unmount.{' '}
        <strong>4. Normalize relational data.</strong> Flat beats nested, and preserved object
        identities are what let memoized children skip work. <strong>5. Derive, don&apos;t
        store.</strong> If it can be computed from existing state, compute it in a hook with{' '}
        <code>useMemo</code>. <strong>6. Test the reducer, not React.</strong> Pure functions in,
        pure functions out.
      </p>
    </LessonLayout>
  );
}
