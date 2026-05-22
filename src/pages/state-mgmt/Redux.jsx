import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SMRedux() {
  return (
    <LessonLayout
      title="Redux Toolkit"
      sectionId="state-mgmt"
      lessonIndex={1}
      prev={{ path: '/state-mgmt/intro', label: 'State Management Introduction' }}
      next={{ path: '/state-mgmt/zustand', label: 'Zustand' }}
    >
      <h2>Redux Mental Model</h2>
      <p>
        Redux is a predictable state container: all application state lives in one store, state
        can only change via dispatched actions, and reducers are pure functions that compute the
        next state. Redux Toolkit (RTK) is the official, opinionated way to write Redux — it
        eliminates the boilerplate of classic Redux with <code>createSlice</code>,
        <code>configureStore</code>, and built-in Immer for immutable updates.
      </p>

      <FlowChart
        title="Redux Data Flow"
        chart={"graph LR\n  A[User Action] --> B[dispatch action]\n  B --> C[Reducer]\n  C --> D[New State in Store]\n  D --> E[React re-renders]\n  E --> A\n  F[Async thunk] --> B\n  G[API call] --> F"}
      />

      <CodeBlock language="jsx" title="createSlice — The Core RTK Primitive">
{`import { createSlice, createAsyncThunk, configureStore } from '@reduxjs/toolkit';

// createSlice combines: initial state + reducers + action creators
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0,
    status: 'idle',  // 'idle' | 'loading' | 'error'
    error: null,
  },

  // reducers: each key becomes an action creator
  reducers: {
    addItem(state, action) {
      // Immer allows "mutating" syntax — converts to immutable update
      state.items.push(action.payload);
      state.total += action.payload.price;
    },

    removeItem(state, action) {
      const index = state.items.findIndex(i => i.id === action.payload);
      if (index !== -1) {
        state.total -= state.items[index].price;
        state.items.splice(index, 1);
      }
    },

    updateQuantity(state, action) {
      const { id, quantity } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) {
        state.total += (quantity - item.quantity) * item.price;
        item.quantity = quantity;
      }
    },

    clearCart(state) {
      state.items = [];
      state.total = 0;
    },
  },

  // extraReducers: handle actions from OTHER slices or async thunks
  extraReducers: (builder) => {
    builder
      .addCase(submitCheckout.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(submitCheckout.fulfilled, (state) => {
        state.items = [];
        state.total = 0;
        state.status = 'idle';
      })
      .addCase(submitCheckout.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload;
      });
  },
});

// Action creators are auto-generated from reducer names
export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;`}
      </CodeBlock>

      <h2>Async Thunks — createAsyncThunk</h2>

      <CodeBlock language="jsx" title="createAsyncThunk for API Calls">
{`import { createAsyncThunk } from '@reduxjs/toolkit';

// createAsyncThunk(typePrefix, payloadCreator)
// Automatically dispatches: typePrefix/pending, /fulfilled, /rejected

export const submitCheckout = createAsyncThunk(
  'cart/checkout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { cart, user } = getState();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);  // triggers rejected action
      }

      return await response.json();  // triggers fulfilled action
    } catch (err) {
      return rejectWithValue('Network error');
    }
  }
);

// Fetch with cancellation support
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (filters, { signal }) => {
    const response = await fetch('/api/products?' + new URLSearchParams(filters), {
      signal,  // AbortController signal — cancels on component unmount
    });
    return response.json();
  }
);

// Using thunks in components:
function CheckoutButton() {
  const dispatch = useDispatch();
  const { status, error } = useSelector(state => state.cart);

  const handleCheckout = async () => {
    const result = await dispatch(submitCheckout());
    if (submitCheckout.fulfilled.match(result)) {
      navigate('/order-confirmed');
    }
  };

  return (
    <button onClick={handleCheckout} disabled={status === 'loading'}>
      {status === 'loading' ? 'Processing...' : 'Place Order'}
    </button>
  );
}`}
      </CodeBlock>

      <h2>configureStore and Middleware</h2>

      <CodeBlock language="jsx" title="Store Setup and Middleware">
{`import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import cartReducer from './cartSlice';
import userReducer from './userSlice';
import productsReducer from './productsSlice';

// configureStore automatically adds:
// - redux-thunk middleware (for async thunks)
// - Redux DevTools Extension integration
// - Immutability and serializability checks (dev mode)
export const store = configureStore({
  reducer: {
    cart: cartReducer,
    user: userReducer,
    products: productsReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Allow non-serializable values (e.g., Dates, Maps) in specific paths
      serializableCheck: {
        ignoredActions: ['user/setLastLogin'],
        ignoredPaths: ['user.lastLogin'],
      },
    }),
    // .concat(loggerMiddleware)  // add custom middleware
    // .concat(rtkQueryMiddleware)  // add RTK Query middleware
});

// Infer types from store (TypeScript pattern)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Provide to React
function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>{/* ... */}</Routes>
      </Router>
    </Provider>
  );
}`}
      </CodeBlock>

      <h2>Selectors — Derived State with Memoization</h2>

      <CodeBlock language="jsx" title="createSelector for Performance">
{`import { createSelector } from '@reduxjs/toolkit';

// Raw selectors (simple, no memoization needed)
const selectCartItems = (state) => state.cart.items;
const selectCartTotal = (state) => state.cart.total;
const selectDiscount = (state) => state.user.discount;

// Derived selector — recomputes only when inputs change
const selectDiscountedTotal = createSelector(
  [selectCartTotal, selectDiscount],
  (total, discount) => {
    // This function only runs when total or discount actually changes
    return total * (1 - discount / 100);
  }
);

// Complex derived data — filter + sort without re-running on unrelated state changes
const selectInStockProducts = createSelector(
  [(state) => state.products.items, (state) => state.filters.category],
  (products, category) => {
    return products
      .filter(p => p.inStock)
      .filter(p => !category || p.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
);

// Usage in components — selector result memoized between renders
function CartSummary() {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const finalTotal = useSelector(selectDiscountedTotal);

  return (
    <div>
      <p>{items.length} items</p>
      <p>Subtotal: \${total.toFixed(2)}</p>
      <p>After discount: \${finalTotal.toFixed(2)}</p>
    </div>
  );
}

// Per-item selector with argument (factory pattern)
const makeSelectItemById = (id) =>
  createSelector(
    selectCartItems,
    (items) => items.find(i => i.id === id)
  );

function CartItem({ id }) {
  const item = useSelector(makeSelectItemById(id));
  // Component only re-renders when THIS item changes
  return <div>{item?.name}: {item?.quantity}</div>;
}`}
      </CodeBlock>

      <h2>RTK Query — Data Fetching Built In</h2>

      <CodeBlock language="jsx" title="RTK Query API Slice">
{`import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// createApi defines an API slice with endpoints
export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().user.token;
      if (token) headers.set('Authorization', 'Bearer ' + token);
      return headers;
    },
  }),
  tagTypes: ['Product', 'Order'],  // for cache invalidation

  endpoints: (builder) => ({
    // Query endpoint (GET)
    getProducts: builder.query({
      query: (filters = {}) => ({ url: 'products', params: filters }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Product', id })), 'Product']
          : ['Product'],
    }),

    getProductById: builder.query({
      query: (id) => 'products/' + id,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // Mutation endpoint (POST/PUT/DELETE)
    createProduct: builder.mutation({
      query: (newProduct) => ({
        url: 'products',
        method: 'POST',
        body: newProduct,
      }),
      invalidatesTags: ['Product'],  // clears product cache after mutation
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: 'products/' + id,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
    }),
  }),
});

// Auto-generated hooks
export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
} = productsApi;

// Register in store
const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    // ...other reducers
  },
  middleware: (getDefault) => getDefault().concat(productsApi.middleware),
});

// Usage in component — automatic loading, caching, re-fetch on invalidation
function ProductList({ category }) {
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProductsQuery({ category }, {
    skip: !category,           // don't fetch until category is available
    pollingInterval: 30_000,   // re-fetch every 30s
  });

  if (isLoading) return <Spinner />;
  if (isError) return <Error message={error.message} />;

  return products.map(p => <ProductCard key={p.id} product={p} />);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Redux Toolkit vs React Query/RTK Query">
        <p>
          RTK Query (built into Redux Toolkit) handles server state: fetching, caching, loading
          states, and cache invalidation. If you are already using Redux for UI state, RTK Query
          is the natural choice — one store, consistent patterns. If you have no Redux for UI state,
          React Query / TanStack Query may be simpler since it does not require setting up a Redux
          store. Use Redux slices for client state (cart, modals, user preferences) and RTK Query
          or React Query for server state (products, orders, user data from APIs).
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What does Immer (built into Redux Toolkit createSlice) allow you to do in reducers?"
        options={[
          "Write asynchronous code inside reducers with async/await",
          "Write reducers that appear to mutate state directly — Immer converts them to immutable updates behind the scenes",
          "Skip writing reducers entirely by auto-generating them from the initial state",
          "Automatically persist Redux state to localStorage on every change"
        ]}
        correctIndex={1}
        explanation="Redux requires immutable state updates. Immer (built into RTK createSlice) wraps your reducer in a JavaScript Proxy. You write state.items.push(item) or state.count++ as if mutating the state directly, but Immer records the changes and produces a brand-new immutable state object. This dramatically simplifies reducer code — no more spread operators or Object.assign — without sacrificing Redux's immutability guarantee."
      />

      <InteractiveChallenge
        question="When should you use createSelector instead of computing derived data directly in useSelector?"
        options={[
          "Always — createSelector is required for all useSelector calls",
          "When the derived computation is expensive or produces a new object/array reference each call, causing unnecessary re-renders",
          "Only when the selector needs access to more than one slice of state",
          "createSelector is for TypeScript only; JavaScript apps use plain functions"
        ]}
        correctIndex={1}
        explanation="useSelector re-runs the selector on every state change and re-renders the component if the result is a new reference. If your selector does .filter() or .map(), it returns a new array every call — even if the data did not change — causing unnecessary re-renders. createSelector memoizes: it only recomputes when its input selectors return different values, and returns the cached result otherwise. Use it whenever the selector computes a new array/object or does significant work."
      />
    </LessonLayout>
  );
}
