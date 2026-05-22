import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SMZustand() {
  return (
    <LessonLayout
      title="Zustand"
      sectionId="state-mgmt"
      lessonIndex={2}
      prev={{ path: '/state-mgmt/redux', label: 'Redux Toolkit' }}
      next={{ path: '/state-mgmt/comparison', label: 'State Library Comparison' }}
    >
      <h2>Why Zustand?</h2>
      <p>
        Zustand is a minimal, unopinionated state management library — less than 1KB gzipped.
        Unlike Redux, there are no actions, reducers, or providers. Unlike React Context, components
        only re-render when the specific slice of state they subscribe to changes. You get a store,
        a hook, and a simple update function. That is the entire API.
      </p>

      <FlowChart
        title="Zustand vs Context vs Redux"
        chart={"graph LR\n  A[Context] --> B[All consumers re-render on any change]\n  C[Zustand] --> D[Only subscribed slice triggers re-render]\n  E[Redux] --> F[Selector-based, requires Provider + actions]\n  C --> G[No Provider needed]\n  C --> H[Simple set function]\n  C --> I[Built-in devtools and persist]"}
      />

      <CodeBlock language="jsx" title="Creating a Store">
{`import { create } from 'zustand';

// create() takes a function that receives set and get
// Returns a hook — use directly in any component, no Provider needed!

const useCartStore = create((set, get) => ({
  // ── STATE ───────────────────────────────────────────────────────
  items: [],
  total: 0,
  couponCode: null,

  // ── ACTIONS ─────────────────────────────────────────────────────
  // set(updater) — merge partial state (like setState in class components)
  addItem: (product) => set((state) => ({
    items: [...state.items, { ...product, quantity: 1 }],
    total: state.total + product.price,
  })),

  removeItem: (id) => set((state) => {
    const item = state.items.find(i => i.id === id);
    return {
      items: state.items.filter(i => i.id !== id),
      total: state.total - (item ? item.price * item.quantity : 0),
    };
  }),

  updateQuantity: (id, quantity) => set((state) => {
    const item = state.items.find(i => i.id === id);
    if (!item) return state;
    const diff = (quantity - item.quantity) * item.price;
    return {
      items: state.items.map(i =>
        i.id === id ? { ...i, quantity } : i
      ),
      total: state.total + diff,
    };
  }),

  clearCart: () => set({ items: [], total: 0, couponCode: null }),

  applyCoupon: (code) => set({ couponCode: code }),

  // ── COMPUTED VALUES via get() ────────────────────────────────────
  // get() reads current state — useful for derived values or async actions
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  getDiscountedTotal: () => {
    const { total, couponCode } = get();
    const discount = couponCode === 'SAVE10' ? 0.10 : 0;
    return total * (1 - discount);
  },
}));`}
      </CodeBlock>

      <h2>Selective Subscriptions — Performance</h2>

      <CodeBlock language="jsx" title="Subscribing to Slices of State">
{`// KEY PERFORMANCE PATTERN: subscribe to only what you need
// Each selector runs on every state change — component re-renders
// only if the selected value actually changed

// ✓ Subscribe to specific field — re-renders only when items.length changes
function CartIcon() {
  const itemCount = useCartStore(state => state.items.length);
  return <span className="badge">{itemCount}</span>;
}

// ✓ Subscribe to derived value
function CartTotal() {
  const total = useCartStore(state => state.total);
  const coupon = useCartStore(state => state.couponCode);
  // Re-renders when total OR couponCode changes — fine, both affect display
  return <p>Total: \${coupon ? (total * 0.9).toFixed(2) : total.toFixed(2)}</p>;
}

// ✓ Subscribe to an action (actions are stable — never cause re-renders)
function AddToCartButton({ product }) {
  const addItem = useCartStore(state => state.addItem);
  // addItem is a stable function reference — component never re-renders
  // because actions don't change (only their internal state does)
  return <button onClick={() => addItem(product)}>Add to cart</button>;
}

// ✓ Subscribe to multiple fields with shallow equality
import { shallow } from 'zustand/shallow';

function CheckoutSummary() {
  // shallow: re-renders only if items or total reference changes
  const { items, total } = useCartStore(
    state => ({ items: state.items, total: state.total }),
    shallow
  );
  return <div>{items.length} items · \${total.toFixed(2)}</div>;
}

// ✗ Anti-pattern: subscribing to entire store — re-renders on ANY change
function BadComponent() {
  const store = useCartStore();  // DO NOT DO THIS
  // This re-renders whenever ANYTHING in the store changes
  return <div>{store.items.length}</div>;
}`}
      </CodeBlock>

      <h2>Middleware — Persist, DevTools, Immer</h2>

      <CodeBlock language="jsx" title="Zustand Middleware">
{`import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ── PERSIST — save to localStorage ───────────────────────────────
const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      notifications: true,
      setTheme: (theme) => set({ theme }),
      setLanguage: (lang) => set({ language: lang }),
      toggleNotifications: () => set(state => ({ notifications: !state.notifications })),
    }),
    {
      name: 'app-settings',       // localStorage key
      // Optionally persist only specific fields:
      partialize: (state) => ({ theme: state.theme, language: state.language }),
    }
  )
);

// ── DEVTOOLS — Redux DevTools integration ──────────────────────────
const useCounterStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(state => ({ count: state.count + 1 }), false, 'increment'),
      //                                                           ^^^^ replace?  ^^^^ action name in devtools
      decrement: () => set(state => ({ count: state.count - 1 }), false, 'decrement'),
    }),
    { name: 'CounterStore' }      // DevTools label
  )
);

// ── IMMER — mutable syntax for complex state ──────────────────────
const useTodoStore = create(
  immer((set) => ({
    todos: [],
    addTodo: (text) => set(state => {
      state.todos.push({ id: Date.now(), text, done: false });
    }),
    toggleTodo: (id) => set(state => {
      const todo = state.todos.find(t => t.id === id);
      if (todo) todo.done = !todo.done;  // direct mutation — Immer handles it
    }),
    deleteTodo: (id) => set(state => {
      state.todos = state.todos.filter(t => t.id !== id);
    }),
  }))
);

// ── COMBINE MIDDLEWARE ─────────────────────────────────────────────
const useUserStore = create(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        token: null,
        setUser: (user) => set(state => { state.user = user; }),
        logout: () => set(state => { state.user = null; state.token = null; }),
        isLoggedIn: () => get().user !== null,
      })),
      { name: 'user-session' }
    ),
    { name: 'UserStore' }
  )
);`}
      </CodeBlock>

      <h2>Async Actions and Data Fetching</h2>

      <CodeBlock language="jsx" title="Async State in Zustand">
{`const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  error: null,
  selectedId: null,

  // Async action — Zustand has no special async handling needed
  // Just call set() when the promise resolves
  fetchProducts: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch('/api/products?' + params);
      if (!response.ok) throw new Error('Failed to fetch');
      const products = await response.json();
      set({ products, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  selectProduct: (id) => set({ selectedId: id }),

  getSelectedProduct: () => {
    const { products, selectedId } = get();
    return products.find(p => p.id === selectedId) ?? null;
  },

  addProduct: async (productData) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    const newProduct = await response.json();
    // Optimistically add to list
    set(state => ({ products: [...state.products, newProduct] }));
    return newProduct;
  },
}));

// Usage in component
function ProductList() {
  const { products, loading, error, fetchProducts } = useProductStore(
    state => ({
      products: state.products,
      loading: state.loading,
      error: state.error,
      fetchProducts: state.fetchProducts,
    }),
    shallow
  );

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return products.map(p => <ProductCard key={p.id} product={p} />);
}

// Note: For most data fetching, prefer React Query or RTK Query over
// manual loading state in Zustand — they handle caching, stale data,
// background refetch, and deduplication automatically.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Zustand vs React Context">
        <p>
          The key difference is subscription granularity. With React Context, any update to the
          context value re-renders <em>all</em> consumers — even ones that don't use the changed
          data. Zustand's selector-based subscriptions mean each component only re-renders when
          its specific slice changes. For a cart with items, total, and coupon: a CartIcon
          subscribed to <code>state.items.length</code> won't re-render when the coupon changes.
          This makes Zustand dramatically more performant for frequently-updated state.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the key performance advantage of Zustand over React Context for global state?"
        options={[
          "Zustand is built into React's core, making it faster than third-party Context",
          "Components subscribed to Zustand only re-render when their specific selector result changes — unlike Context where all consumers re-render on any update",
          "Zustand automatically memoizes all component renders",
          "Zustand uses Web Workers to compute state off the main thread"
        ]}
        correctIndex={1}
        explanation="With React Context, any value change re-renders all consumers of that context — even ones that use a different field. Zustand uses selector subscriptions: useCartStore(state => state.items.length) only triggers a re-render if items.length actually changes. If the coupon code changes but item count doesn't, CartIcon (subscribed to items.length) does not re-render. This makes Zustand much more efficient for frequently-updated or large state objects."
      />

      <InteractiveChallenge
        question="When would you choose Zustand over Redux Toolkit for a new project?"
        options={[
          "Zustand is always better — RTK is outdated",
          "When the app is medium-sized, the team prefers simplicity, and you don't need advanced DevTools features like time-travel debugging or action replay",
          "When you need persistence — RTK has no built-in persistence",
          "Zustand supports TypeScript but Redux Toolkit does not"
        ]}
        correctIndex={1}
        explanation="Zustand shines for medium-sized apps that need global state without Redux's boilerplate (slices, actions, reducers, dispatch). RTK is better for large teams that benefit from enforced structure, comprehensive DevTools with time-travel debugging, and RTK Query for server state. Both support TypeScript well. Both support DevTools. Choose by team size and complexity: Zustand for simplicity, RTK for scale and structure."
      />
    </LessonLayout>
  );
}
