import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Zustand() {
  return (
    <LessonLayout
      title="Zustand"
      sectionId="state-mgmt"
      lessonIndex={2}
      prev={{ path: '/state-mgmt/redux', label: 'Redux Toolkit' }}
      next={{ path: '/state-mgmt/comparison', label: 'Library Comparison' }}
    >
      <h2>Why Zustand?</h2>
      <p>
        Zustand (&quot;state&quot; in German) is a minimal state management library that strips away
        everything you don&apos;t need: no providers, no boilerplate, no context, no reducers. You
        create a store with a function, use it with a hook, and you&apos;re done. At ~1KB gzipped,
        it adds almost nothing to your bundle.
      </p>

      <FlowChart
        title="Zustand Architecture"
        chart={"graph LR\n  S[create store] --> H[useStore hook]\n  H --> C1[Component A]\n  H --> C2[Component B]\n  H --> C3[Component C]\n  C1 -->|selector| S\n  C2 -->|selector| S\n  C3 -->|action| S\n  style S fill:#10b981,color:#fff\n  style H fill:#3b82f6,color:#fff"}
      />

      <InfoBox variant="tip" title="No Provider Required">
        Unlike Redux or Context, Zustand stores live outside the React tree. No
        <code>&lt;Provider&gt;</code> wrapping, no prop drilling, no context nesting. Any component
        anywhere in your app can subscribe to any store — including components rendered outside
        the main React root (portals, micro-frontends).
      </InfoBox>

      <h2>Creating a Store</h2>

      <CodeBlock language="jsx" title="todosStore.js — Complete CRUD Store">
{`import { create } from 'zustand';

const useTodoStore = create((set, get) => ({
  // State
  items: [],
  filter: 'all',

  // Actions — just functions that call set()
  addTodo: (text) =>
    set((state) => ({
      items: [...state.items, {
        id: crypto.randomUUID(),
        text,
        completed: false,
      }],
    })),

  toggleTodo: (id) =>
    set((state) => ({
      items: state.items.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),

  removeTodo: (id) =>
    set((state) => ({
      items: state.items.filter((t) => t.id !== id),
    })),

  updateTodo: (id, text) =>
    set((state) => ({
      items: state.items.map((t) =>
        t.id === id ? { ...t, text } : t
      ),
    })),

  setFilter: (filter) => set({ filter }),

  // Computed values via get()
  getFilteredTodos: () => {
    const { items, filter } = get();
    switch (filter) {
      case 'active':    return items.filter((t) => !t.completed);
      case 'completed': return items.filter((t) => t.completed);
      default:          return items;
    }
  },

  getCounts: () => {
    const { items } = get();
    return {
      total: items.length,
      active: items.filter((t) => !t.completed).length,
      completed: items.filter((t) => t.completed).length,
    };
  },
}));

export default useTodoStore;`}
      </CodeBlock>

      <h2>Using the Store in Components</h2>

      <CodeBlock language="jsx" title="TodoApp.jsx — Same App, Zustand Edition">
{`import useTodoStore from './todosStore';

function TodoApp() {
  const [text, setText] = useState('');

  // Selectors — component only re-renders when selected value changes
  const addTodo = useTodoStore((s) => s.addTodo);
  const setFilter = useTodoStore((s) => s.setFilter);
  const filteredTodos = useTodoStore((s) => s.getFilteredTodos());
  const counts = useTodoStore((s) => s.getCounts());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      addTodo(text.trim());
      setText('');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <div>
        {['all', 'active', 'completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <p>{counts.active} remaining / {counts.total} total</p>

      <TodoList todos={filteredTodos} />
    </div>
  );
}

// Extracted component with its own selectors
function TodoList({ todos }) {
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const removeTodo = useTodoStore((s) => s.removeTodo);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span>{todo.text}</span>
          <button onClick={() => removeTodo(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}`}
      </CodeBlock>

      <h2>Selectors for Performance</h2>
      <p>
        Zustand uses strict equality (<code>===</code>) by default. If your selector returns a
        new object/array reference every render, the component re-renders unnecessarily. Use
        <code>shallow</code> comparison for object slices, or select primitives individually.
      </p>

      <CodeBlock language="jsx" title="Selector Strategies">
{`import { shallow } from 'zustand/shallow';

// ❌ BAD — creates new object every time, always re-renders
const { items, filter } = useTodoStore((s) => ({
  items: s.items,
  filter: s.filter,
}));

// ✅ GOOD — shallow comparison prevents unnecessary re-renders
const { items, filter } = useTodoStore(
  (s) => ({ items: s.items, filter: s.filter }),
  shallow
);

// ✅ BEST — select primitives individually (no comparison needed)
const filter = useTodoStore((s) => s.filter);
const count = useTodoStore((s) => s.items.length);

// ✅ ALSO GOOD — useShallow (Zustand v4.5+)
import { useShallow } from 'zustand/react/shallow';

const { items, filter } = useTodoStore(
  useShallow((s) => ({ items: s.items, filter: s.filter }))
);`}
      </CodeBlock>

      <h2>Middleware</h2>
      <p>
        Zustand middleware wraps the store creator to add cross-cutting behavior. Stack them
        by nesting function calls.
      </p>

      <CodeBlock language="jsx" title="Middleware — persist, devtools, immer">
{`import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useTodoStore = create(
  devtools(
    persist(
      immer((set) => ({
        items: [],
        filter: 'all',

        // With immer middleware, you can "mutate" directly
        addTodo: (text) =>
          set((state) => {
            state.items.push({
              id: crypto.randomUUID(),
              text,
              completed: false,
            });
          }),

        toggleTodo: (id) =>
          set((state) => {
            const todo = state.items.find((t) => t.id === id);
            if (todo) todo.completed = !todo.completed;
          }),

        removeTodo: (id) =>
          set((state) => {
            const idx = state.items.findIndex((t) => t.id === id);
            if (idx !== -1) state.items.splice(idx, 1);
          }),
      })),
      { name: 'todo-storage' } // localStorage key for persist
    ),
    { name: 'TodoStore' }      // DevTools label
  )
);`}
      </CodeBlock>

      <InfoBox variant="info" title="Middleware Ordering Matters">
        Middleware is applied inside-out. <code>devtools(persist(immer(fn)))</code> means immer
        runs first (closest to your code), then persist serializes the result, then devtools logs
        it. If you put <code>immer</code> outside <code>persist</code>, persist would try to
        serialize Immer&apos;s draft objects — which breaks.
      </InfoBox>

      <h2>Async Actions</h2>
      <p>
        No special utilities needed. Actions are plain functions — just use <code>async/await</code>.
      </p>

      <CodeBlock language="jsx" title="Async CRUD">
{`const useTodoStore = create((set, get) => ({
  items: [],
  status: 'idle',  // 'idle' | 'loading' | 'error'
  error: null,

  fetchTodos: async () => {
    set({ status: 'loading', error: null });
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      set({ items: data, status: 'idle' });
    } catch (err) {
      set({ status: 'error', error: err.message });
    }
  },

  saveTodo: async (text) => {
    const todo = { id: crypto.randomUUID(), text, completed: false };
    // Optimistic update
    set((state) => ({ items: [...state.items, todo] }));
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      });
    } catch {
      // Rollback on failure
      set((state) => ({
        items: state.items.filter((t) => t.id !== todo.id),
      }));
    }
  },
}));`}
      </CodeBlock>

      <h2>Subscriptions Outside React</h2>
      <p>
        Zustand stores are framework-agnostic. You can subscribe to changes from vanilla JS,
        Node.js, or any other context — useful for analytics, logging, or WebSocket bridges.
      </p>

      <CodeBlock language="jsx" title="External Subscriptions">
{`// Subscribe to all changes
const unsub = useTodoStore.subscribe((state) => {
  console.log('State changed:', state);
});

// Subscribe to a slice (only fires when that slice changes)
const unsub = useTodoStore.subscribe(
  (state) => state.items.length,
  (count, prevCount) => {
    console.log(\`Todo count: \${prevCount} → \${count}\`);
  }
);

// Read state outside React
const currentItems = useTodoStore.getState().items;

// Set state outside React
useTodoStore.getState().addTodo('From a WebSocket handler');
// or directly:
useTodoStore.setState({ filter: 'completed' });`}
      </CodeBlock>

      <h2>TypeScript Integration</h2>

      <CodeBlock language="jsx" title="Fully Typed Store">
{`interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoState {
  items: Todo[];
  filter: 'all' | 'active' | 'completed';
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  fetchTodos: () => Promise<void>;
}

const useTodoStore = create<TodoState>()((set) => ({
  items: [],
  filter: 'all',
  addTodo: (text) =>
    set((state) => ({
      items: [...state.items, {
        id: crypto.randomUUID(),
        text,
        completed: false,
      }],
    })),
  toggleTodo: (id) =>
    set((state) => ({
      items: state.items.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),
  removeTodo: (id) =>
    set((state) => ({
      items: state.items.filter((t) => t.id !== id),
    })),
  fetchTodos: async () => {
    const res = await fetch('/api/todos');
    const data = await res.json();
    set({ items: data });
  },
}));`}
      </CodeBlock>

      <h2>Multiple Stores vs Single Store</h2>

      <InfoBox variant="warning" title="One Store or Many?">
        Unlike Redux (which enforces a single store), Zustand encourages multiple stores split
        by domain: <code>useAuthStore</code>, <code>useTodoStore</code>, <code>useUIStore</code>.
        Each store is independent, testable, and tree-shakeable. Only merge stores if they
        have tightly coupled state that changes together.
      </InfoBox>

      <h2>Zustand vs Redux — Code Comparison</h2>
      <p>
        Here&apos;s the same &quot;add todo&quot; feature side by side. Zustand removes the
        action types, action creators, reducers, selectors, Provider, and dispatch ceremony.
      </p>

      <CodeBlock language="jsx" title="Redux Toolkit — Adding a Todo">
{`// todosSlice.js (RTK)
const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [] },
  reducers: {
    addTodo: {
      reducer(state, action) { state.items.push(action.payload); },
      prepare(text) { return { payload: { id: nanoid(), text, completed: false } }; },
    },
  },
});
export const { addTodo } = todosSlice.actions;
export default todosSlice.reducer;

// store.js
export const store = configureStore({ reducer: { todos: todosReducer } });

// App.jsx — needs Provider
<Provider store={store}><App /></Provider>

// Component
const dispatch = useDispatch();
const todos = useSelector((s) => s.todos.items);
dispatch(addTodo('Buy milk'));`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Zustand — Adding a Todo">
{`// todosStore.js
const useTodoStore = create((set) => ({
  items: [],
  addTodo: (text) => set((s) => ({
    items: [...s.items, { id: crypto.randomUUID(), text, completed: false }],
  })),
}));

// No Provider needed — ever.

// Component
const addTodo = useTodoStore((s) => s.addTodo);
const items = useTodoStore((s) => s.items);
addTodo('Buy milk');`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Why does Zustand not need a Provider component?"}
        options={[
          "It uses React Context internally but hides the Provider",
          "It stores state in a module-level closure outside the React tree",
          "It patches React's internal fiber tree directly",
          "It requires a Provider but it's optional for small apps"
        ]}
        correctIndex={1}
        explanation="Zustand stores live in a module-level closure (a plain JavaScript variable outside React). Components subscribe to changes via useSyncExternalStore. No Context, no Provider, no tree dependency — any component anywhere can access any store."
        language="jsx"
      />

      <h2>When to Choose Zustand</h2>
      <p>
        Zustand is the right choice when you want minimal API surface, fast setup, and
        don&apos;t need the enforced structure that Redux provides. It&apos;s excellent for
        small-to-medium apps, prototypes, and teams that prefer convention over configuration.
        For large teams that need strict patterns and the best debugging tools, Redux Toolkit
        may still be worth the extra ceremony.
      </p>
    </LessonLayout>
  );
}
