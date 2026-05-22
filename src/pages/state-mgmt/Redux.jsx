import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Redux() {
  return (
    <LessonLayout
      title="Redux Toolkit"
      sectionId="state-mgmt"
      lessonIndex={1}
      prev={{ path: '/state-mgmt/intro', label: "When Context Isn't Enough" }}
      next={{ path: '/state-mgmt/zustand', label: 'Zustand' }}
    >
      <h2>Redux Core Concepts</h2>
      <p>
        Redux is a predictable state container. Every state change follows the same unidirectional
        flow: a component dispatches an action, a reducer processes it immutably, and the store
        notifies subscribed components. This rigid flow makes state changes traceable and debuggable.
      </p>

      <FlowChart
        title="Redux Data Flow"
        chart={"graph LR\n  UI[Component] -->|dispatch| A[Action]\n  A --> MW[Middleware]\n  MW --> R[Reducer]\n  R --> S[Store]\n  S -->|useSelector| UI\n  style A fill:#f59e0b,color:#fff\n  style R fill:#3b82f6,color:#fff\n  style S fill:#10b981,color:#fff\n  style MW fill:#8b5cf6,color:#fff"}
      />

      <InfoBox variant="info" title="Redux Toolkit Is Redux">
        Nobody writes vanilla Redux anymore. Redux Toolkit (RTK) is the official, opinionated
        toolset that eliminates boilerplate. When someone says &quot;Redux&quot; in 2024+, they
        mean RTK. If a tutorial has you writing <code>switch</code> statements and
        <code>combineReducers</code>, close the tab.
      </InfoBox>

      <h2>Store Setup</h2>
      <p>
        <code>configureStore</code> wraps <code>createStore</code> with good defaults: Redux
        DevTools, <code>redux-thunk</code> middleware, and development-mode checks for accidental
        mutations and non-serializable values.
      </p>

      <CodeBlock language="jsx" title="store.js">
{`import { configureStore } from '@reduxjs/toolkit';
import todosReducer from './features/todos/todosSlice';
import authReducer from './features/auth/authSlice';

export const store = configureStore({
  reducer: {
    todos: todosReducer,
    auth: authReducer,
  },
  // middleware is auto-configured (thunk + dev checks)
  // devTools is enabled in development automatically
});

// Infer types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;`}
      </CodeBlock>

      <h2>createSlice — Actions + Reducers in One</h2>
      <p>
        A slice owns a piece of state: its initial value, the reducers that update it, and the
        action creators that trigger those reducers. RTK uses Immer under the hood, so you
        write &quot;mutating&quot; syntax that produces immutable updates.
      </p>

      <CodeBlock language="jsx" title="features/todos/todosSlice.js">
{`import { createSlice, nanoid } from '@reduxjs/toolkit';

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    filter: 'all', // 'all' | 'active' | 'completed'
  },
  reducers: {
    addTodo: {
      reducer(state, action) {
        // Immer lets you "mutate" — it produces an immutable update
        state.items.push(action.payload);
      },
      prepare(text) {
        return { payload: { id: nanoid(), text, completed: false } };
      },
    },
    toggleTodo(state, action) {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) todo.completed = !todo.completed;
    },
    removeTodo(state, action) {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    updateTodo(state, action) {
      const { id, text } = action.payload;
      const todo = state.items.find(t => t.id === id);
      if (todo) todo.text = text;
    },
    setFilter(state, action) {
      state.filter = action.payload;
    },
  },
});

export const { addTodo, toggleTodo, removeTodo, updateTodo, setFilter } = todosSlice.actions;
export default todosSlice.reducer;`}
      </CodeBlock>

      <h2>Selectors — Deriving Data from State</h2>
      <p>
        Selectors extract and transform data from the store. Colocate them with the slice to
        encapsulate the state shape. Use <code>createSelector</code> from Reselect (bundled with
        RTK) for memoized derived data.
      </p>

      <CodeBlock language="jsx" title="features/todos/todosSelectors.js">
{`import { createSelector } from '@reduxjs/toolkit';

// Simple selectors
export const selectAllTodos = (state) => state.todos.items;
export const selectFilter = (state) => state.todos.filter;

// Memoized selector — only recomputes when items or filter change
export const selectFilteredTodos = createSelector(
  [selectAllTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'active':    return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default:          return todos;
    }
  }
);

export const selectTodoCount = createSelector(
  [selectAllTodos],
  (todos) => ({
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  })
);`}
      </CodeBlock>

      <h2>useSelector and useDispatch</h2>

      <CodeBlock language="jsx" title="TodoApp.jsx — Complete Component">
{`import { useSelector, useDispatch } from 'react-redux';
import { addTodo, toggleTodo, removeTodo, setFilter } from './todosSlice';
import { selectFilteredTodos, selectTodoCount } from './todosSelectors';

function TodoApp() {
  const dispatch = useDispatch();
  const todos = useSelector(selectFilteredTodos);
  const counts = useSelector(selectTodoCount);
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      dispatch(addTodo(text.trim()));
      setText('');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={text} onChange={e => setText(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <div>
        {['all', 'active', 'completed'].map(f => (
          <button key={f} onClick={() => dispatch(setFilter(f))}>{f}</button>
        ))}
      </div>

      <p>{counts.active} remaining / {counts.total} total</p>

      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch(toggleTodo(todo.id))}
            />
            <span>{todo.text}</span>
            <button onClick={() => dispatch(removeTodo(todo.id))}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Async Operations with createAsyncThunk</h2>
      <p>
        <code>createAsyncThunk</code> generates pending/fulfilled/rejected action types for async
        operations. Handle each lifecycle in <code>extraReducers</code>.
      </p>

      <CodeBlock language="jsx" title="Async CRUD Operations">
{`import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTodos = createAsyncThunk(
  'todos/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch');
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const saveTodo = createAsyncThunk(
  'todos/save',
  async (todo) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    return await res.json();
  }
);

// In the slice:
const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [], status: 'idle', error: null },
  reducers: { /* ... */ },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});`}
      </CodeBlock>

      <h2>RTK Query — Built-in Data Fetching</h2>
      <p>
        RTK Query is Redux Toolkit&apos;s answer to TanStack Query. It auto-generates hooks,
        handles caching, invalidation, polling, and optimistic updates — all integrated into your
        Redux store.
      </p>

      <CodeBlock language="jsx" title="RTK Query API Definition">
{`import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const todosApi = createApi({
  reducerPath: 'todosApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Todo'],
  endpoints: (builder) => ({
    getTodos: builder.query({
      query: () => '/todos',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Todo', id })), 'Todo']
          : ['Todo'],
    }),
    addTodo: builder.mutation({
      query: (todo) => ({
        url: '/todos',
        method: 'POST',
        body: todo,
      }),
      invalidatesTags: ['Todo'],
    }),
    deleteTodo: builder.mutation({
      query: (id) => ({
        url: \`/todos/\${id}\`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Todo', id }],
    }),
  }),
});

// Auto-generated hooks
export const { useGetTodosQuery, useAddTodoMutation, useDeleteTodoMutation } = todosApi;`}
      </CodeBlock>

      <InfoBox variant="tip" title="RTK Query vs TanStack Query">
        Use RTK Query if you&apos;re already using Redux and want everything in one store. Use
        TanStack Query if you don&apos;t need Redux for client state — it&apos;s lighter, more
        flexible, and framework-agnostic. Don&apos;t use both in the same app.
      </InfoBox>

      <h2>Middleware</h2>
      <p>
        Middleware intercepts dispatched actions before they reach the reducer. Use it for logging,
        analytics, side effects, or transforming actions. RTK includes <code>redux-thunk</code> by
        default.
      </p>

      <CodeBlock language="jsx" title="Custom Middleware">
{`const analyticsMiddleware = (store) => (next) => (action) => {
  if (action.type === 'todos/addTodo') {
    analytics.track('todo_created', {
      userId: store.getState().auth.user?.id,
    });
  }
  return next(action); // always call next()
};

const store = configureStore({
  reducer: { todos: todosReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(analyticsMiddleware),
});`}
      </CodeBlock>

      <h2>Folder Structure</h2>

      <CodeBlock language="jsx" title="Feature-Based Structure (Recommended)">
{`src/
├── app/
│   ├── store.js          # configureStore
│   └── hooks.js          # typed useAppDispatch, useAppSelector
├── features/
│   ├── todos/
│   │   ├── todosSlice.js
│   │   ├── todosSelectors.js
│   │   ├── todosApi.js       # RTK Query endpoints
│   │   ├── TodoList.jsx
│   │   ├── TodoItem.jsx
│   │   └── AddTodoForm.jsx
│   └── auth/
│       ├── authSlice.js
│       ├── authSelectors.js
│       ├── LoginForm.jsx
│       └── UserMenu.jsx
└── index.jsx`}
      </CodeBlock>

      <h2>DevTools</h2>
      <p>
        Redux DevTools (browser extension) lets you inspect every dispatched action, time-travel
        through state changes, diff state before/after each action, and export/import state
        snapshots. This is Redux&apos;s killer feature for debugging — no other library matches
        its debugging experience out of the box.
      </p>

      <InteractiveChallenge
        question={"What does `createSlice` generate automatically?"}
        options={[
          "Only reducer functions",
          "Action creators and action type constants from the reducer names",
          "React components that connect to the store",
          "API endpoints for data fetching"
        ]}
        correctIndex={1}
        explanation="createSlice takes reducer functions and auto-generates corresponding action creators and action type strings (e.g., 'todos/addTodo'). This eliminates the need to manually define action types and action creator functions — the biggest source of Redux boilerplate."
        language="jsx"
      />

      <InfoBox variant="warning" title="Common RTK Mistakes">
        Don&apos;t destructure or spread state outside of Immer reducers — Immer&apos;s proxy only
        works inside <code>createSlice</code> reducers. Don&apos;t put non-serializable values
        (class instances, functions, Promises) in the store. Don&apos;t create selectors inside
        components — define them outside to enable memoization.
      </InfoBox>

      <h2>When Redux Toolkit Shines</h2>
      <p>
        RTK is the right choice for large teams that benefit from enforced conventions, apps with
        complex state interactions across many features, and when you need the best debugging
        tooling available. The tradeoff is more ceremony than lighter alternatives — which
        we&apos;ll explore next with Zustand.
      </p>
    </LessonLayout>
  );
}
