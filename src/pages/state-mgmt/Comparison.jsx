import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Comparison() {
  return (
    <LessonLayout
      title="Library Comparison"
      sectionId="state-mgmt"
      lessonIndex={3}
      prev={{ path: '/state-mgmt/zustand', label: 'Zustand' }}
      next={{ path: '/state-mgmt/patterns', label: 'Real-World Patterns' }}
    >
      <h2>The Landscape at a Glance</h2>
      <p>
        There are six credible options for shared client state in React. Each makes different
        tradeoffs between simplicity, performance, developer experience, and scalability. None
        is universally &quot;best&quot; — the right choice depends on your team size, app complexity,
        and how much structure you want enforced.
      </p>

      <CodeBlock language="jsx" title="Comparison Matrix">
{`┌─────────────────┬──────────┬────────────┬─────────┬──────────┬─────────┬──────────┐
│                 │ Redux TK │  Zustand   │  Jotai  │  Recoil  │  MobX   │ Context  │
├─────────────────┼──────────┼────────────┼─────────┼──────────┼─────────┼──────────┤
│ Bundle (gzip)   │  ~11 KB  │   ~1 KB    │  ~3 KB  │  ~21 KB  │  ~16 KB │   0 KB   │
│ Boilerplate     │  Medium  │    Low     │   Low   │  Medium  │   Low   │   Low    │
│ Learning curve  │  Medium  │    Low     │   Low   │  Medium  │  Medium │   Low    │
│ DevTools        │  ★★★★★   │   ★★★☆☆    │  ★★☆☆☆  │  ★★★☆☆   │  ★★★★☆  │  ★☆☆☆☆   │
│ TypeScript      │  ★★★★★   │   ★★★★★    │  ★★★★★  │  ★★★☆☆   │  ★★★★☆  │  ★★★★☆   │
│ Middleware      │  ★★★★★   │   ★★★★☆    │  ★★☆☆☆  │  ★★☆☆☆   │  ★★★☆☆  │  ☆☆☆☆☆   │
│ Performance     │  ★★★★☆   │   ★★★★★    │  ★★★★★  │  ★★★★☆   │  ★★★★★  │  ★★☆☆☆   │
│ Community/Docs  │  ★★★★★   │   ★★★★☆    │  ★★★☆☆  │  ★★☆☆☆   │  ★★★★☆  │  ★★★★★   │
│ Async built-in  │  Yes     │   Yes      │  Yes    │  Yes     │  Yes    │   No     │
│ SSR support     │  ★★★★☆   │   ★★★★★    │  ★★★★★  │  ★★☆☆☆   │  ★★★☆☆  │  ★★★★★   │
│ Mental model    │ Flux     │  Simple fn │ Atomic  │  Atomic  │  OOP    │ React    │
│ Provider req'd  │  Yes     │    No      │   Yes   │   Yes    │   No    │   Yes    │
└─────────────────┴──────────┴────────────┴─────────┴──────────┴─────────┴──────────┘`}
      </CodeBlock>

      <InfoBox variant="info" title="Bundle Sizes Are Approximate">
        Sizes change with every release. Check <a href="https://bundlephobia.com">bundlephobia.com</a> for
        current numbers. The important takeaway: Zustand and Jotai are an order of magnitude smaller
        than Redux or MobX. For bundle-sensitive apps (mobile web, embedded), this matters.
      </InfoBox>

      <h2>Jotai — The Atomic Model</h2>
      <p>
        Jotai (&quot;state&quot; in Japanese) uses an atomic model inspired by Recoil but with
        a simpler API. Each atom is an independent piece of state. Components subscribe to only
        the atoms they use — no selectors needed, no wasted re-renders.
      </p>

      <CodeBlock language="jsx" title="Jotai — Atoms and Derived State">
{`import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// Primitive atoms
const todosAtom = atom([]);
const filterAtom = atom('all');

// Derived atom (read-only, recomputes when dependencies change)
const filteredTodosAtom = atom((get) => {
  const todos = get(todosAtom);
  const filter = get(filterAtom);
  switch (filter) {
    case 'active':    return todos.filter((t) => !t.completed);
    case 'completed': return todos.filter((t) => t.completed);
    default:          return todos;
  }
});

// Write-only atom (action)
const addTodoAtom = atom(null, (get, set, text) => {
  const prev = get(todosAtom);
  set(todosAtom, [...prev, {
    id: crypto.randomUUID(),
    text,
    completed: false,
  }]);
});

// Usage in components — dead simple
function TodoApp() {
  const filteredTodos = useAtomValue(filteredTodosAtom);
  const addTodo = useSetAtom(addTodoAtom);
  const [filter, setFilter] = useAtom(filterAtom);

  return (
    <div>
      <button onClick={() => addTodo('New task')}>Add</button>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>
      {filteredTodos.map((t) => <TodoItem key={t.id} todo={t} />)}
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Jotai's Superpower: Bottom-Up Composition">
        In Redux/Zustand, you design top-down: define the store shape, then select into it. In Jotai,
        you design bottom-up: create small atoms, compose them into derived atoms. This makes Jotai
        excellent for highly dynamic UIs where state shapes aren&apos;t known upfront (dashboards,
        form builders, drag-and-drop editors).
      </InfoBox>

      <h2>Recoil — Facebook&apos;s Atomic Approach</h2>
      <p>
        Recoil pioneered the atomic model in React. Atoms hold state; selectors derive it. It
        integrates deeply with React Concurrent Mode and Suspense. However, it&apos;s been in
        experimental status since 2020 with slow development — most teams now choose Jotai instead.
      </p>

      <CodeBlock language="jsx" title="Recoil — Atoms and Selectors">
{`import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';

const todosState = atom({
  key: 'todosState', // globally unique key (required)
  default: [],
});

const filterState = atom({
  key: 'filterState',
  default: 'all',
});

const filteredTodosState = selector({
  key: 'filteredTodosState',
  get: ({ get }) => {
    const todos = get(todosState);
    const filter = get(filterState);
    switch (filter) {
      case 'active':    return todos.filter((t) => !t.completed);
      case 'completed': return todos.filter((t) => t.completed);
      default:          return todos;
    }
  },
});

// Async selector with automatic Suspense integration
const userState = selector({
  key: 'userState',
  get: async () => {
    const res = await fetch('/api/user');
    return res.json(); // Component using this auto-suspends
  },
});

function TodoApp() {
  const [todos, setTodos] = useRecoilState(todosState);
  const filtered = useRecoilValue(filteredTodosState);
  // ...
}`}
      </CodeBlock>

      <h2>MobX — Observable State</h2>
      <p>
        MobX uses an OOP-friendly observable/computed/action pattern. You mutate state directly,
        and MobX tracks dependencies at runtime to surgically update only the affected components.
        It&apos;s the closest to &quot;just write normal code&quot; — but the magic can make
        debugging harder when things go wrong.
      </p>

      <CodeBlock language="jsx" title="MobX — Observable Store">
{`import { makeAutoObservable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';

class TodoStore {
  items = [];
  filter = 'all';

  constructor() {
    makeAutoObservable(this); // auto-wraps properties/methods
  }

  // Actions — directly mutate state
  addTodo(text) {
    this.items.push({
      id: crypto.randomUUID(),
      text,
      completed: false,
    });
  }

  toggleTodo(id) {
    const todo = this.items.find((t) => t.id === id);
    if (todo) todo.completed = !todo.completed;
  }

  removeTodo(id) {
    this.items = this.items.filter((t) => t.id !== id);
  }

  // Computed — auto-cached, recalculates when dependencies change
  get filteredTodos() {
    switch (this.filter) {
      case 'active':    return this.items.filter((t) => !t.completed);
      case 'completed': return this.items.filter((t) => t.completed);
      default:          return this.items;
    }
  }

  get counts() {
    return {
      total: this.items.length,
      active: this.items.filter((t) => !t.completed).length,
    };
  }

  // Async action
  async fetchTodos() {
    const res = await fetch('/api/todos');
    const data = await res.json();
    runInAction(() => { this.items = data; });
  }
}

const todoStore = new TodoStore();

// Components must be wrapped with observer()
const TodoApp = observer(function TodoApp() {
  return (
    <div>
      <p>{todoStore.counts.active} remaining</p>
      {todoStore.filteredTodos.map((t) => (
        <div key={t.id} onClick={() => todoStore.toggleTodo(t.id)}>
          {t.text}
        </div>
      ))}
    </div>
  );
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="MobX Gotcha: The observer Tax">
        Every component reading MobX state must be wrapped with <code>observer()</code>. Forget
        it on one component and it silently won&apos;t re-render — no error, no warning. In large
        codebases this is the #1 source of &quot;why isn&apos;t my component updating?&quot; bugs.
        MobX also requires careful handling of destructuring: <code>const {'{ items }'} = store</code> breaks
        reactivity because you&apos;ve read the property outside the tracked render.
      </InfoBox>

      <h2>Context API — When It&apos;s Still the Right Call</h2>
      <p>
        Don&apos;t dismiss Context entirely. For truly low-frequency, app-wide values — theme,
        locale, authenticated user, feature flags — Context is zero-dependency and built-in.
        The rule: if the value changes less than once per minute and all consumers need the
        full value, Context is fine.
      </p>

      <CodeBlock language="jsx" title="Context — Ideal Use Cases">
{`// ✅ Perfect for Context: changes rarely, every consumer needs it
const ThemeContext = createContext('light');
const LocaleContext = createContext('en');
const FeatureFlagContext = createContext({});

// ❌ Bad for Context: changes frequently, consumers need slices
const ShoppingCartContext = createContext({ items: [], total: 0 });
const NotificationContext = createContext({ messages: [], unread: 0 });
const FormContext = createContext({ values: {}, errors: {}, touched: {} });`}
      </CodeBlock>

      <h2>Decision Matrix</h2>

      <FlowChart
        title="Which Library Should You Choose?"
        chart={"graph TD\n  START[Choose a State Library] --> Q1{Team size?}\n  Q1 -->|1-3 devs| Q2{App complexity?}\n  Q1 -->|4+ devs| Q3{Need strict conventions?}\n  Q2 -->|Simple| ZS1[Zustand or Context]\n  Q2 -->|Complex| ZS2[Zustand + TanStack Query]\n  Q3 -->|Yes| RTK[Redux Toolkit]\n  Q3 -->|No| Q4{State shape known upfront?}\n  Q4 -->|Yes| ZS3[Zustand]\n  Q4 -->|No, dynamic| JT[Jotai]\n  style ZS1 fill:#10b981,color:#fff\n  style ZS2 fill:#10b981,color:#fff\n  style ZS3 fill:#10b981,color:#fff\n  style RTK fill:#8b5cf6,color:#fff\n  style JT fill:#f59e0b,color:#fff"}
      />

      <h2>The Same Feature in Every Library</h2>
      <p>
        To make the comparison concrete, here&apos;s a counter with increment and async
        reset in each library, stripped to the minimum.
      </p>

      <CodeBlock language="jsx" title="Counter — All Libraries Side by Side">
{`// ━━━ Redux Toolkit ━━━
const counterSlice = createSlice({
  name: 'counter', initialState: { value: 0 },
  reducers: { increment: (s) => { s.value += 1; } },
});
const store = configureStore({ reducer: { counter: counterSlice.reducer } });
// Component: useSelector(s => s.counter.value) + useDispatch()

// ━━━ Zustand ━━━
const useCounter = create((set) => ({
  value: 0,
  increment: () => set((s) => ({ value: s.value + 1 })),
}));
// Component: useCounter(s => s.value) + useCounter(s => s.increment)

// ━━━ Jotai ━━━
const countAtom = atom(0);
// Component: const [count, setCount] = useAtom(countAtom)

// ━━━ Recoil ━━━
const countState = atom({ key: 'count', default: 0 });
// Component: const [count, setCount] = useRecoilState(countState)

// ━━━ MobX ━━━
class CounterStore { value = 0; constructor() { makeAutoObservable(this); }
  increment() { this.value += 1; } }
const counterStore = new CounterStore();
// Component: observer(() => <span>{counterStore.value}</span>)

// ━━━ Context ━━━
const CountContext = createContext();
// Provider: <CountContext.Provider value={{ count, setCount }}>
// Component: const { count } = useContext(CountContext)`}
      </CodeBlock>

      <h2>When to NOT Use a State Library</h2>
      <p>
        State libraries solve coordination problems between unrelated components. If your app
        doesn&apos;t have that problem, adding one is pure overhead.
      </p>

      <CodeBlock language="jsx" title="You Probably Don't Need a Library When...">
{`// ✅ State is local to one component → useState
const [isOpen, setIsOpen] = useState(false);

// ✅ State is shared between parent/child → lift state up
function Parent() {
  const [selected, setSelected] = useState(null);
  return <Child selected={selected} onSelect={setSelected} />;
}

// ✅ State is complex but local → useReducer
const [state, dispatch] = useReducer(formReducer, initialFormState);

// ✅ State is server data → TanStack Query
const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// ✅ State is in the URL → React Router
const [searchParams, setSearchParams] = useSearchParams();`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You're building a dashboard where users can add/remove/rearrange widget panels dynamically. Each widget has its own independent state. Which library fits best?"}
        options={[
          "Redux Toolkit — it handles complex state well",
          "Zustand — minimal boilerplate for simple stores",
          "Jotai — atomic model handles dynamic, unknown-at-build-time state",
          "Context — built-in and sufficient for any use case"
        ]}
        correctIndex={2}
        explanation="Jotai's atomic model shines when state shape is dynamic. Each widget can create its own atoms on the fly. In Redux or Zustand, you'd need to design a normalized shape upfront to handle an unknown number of widgets — doable but more ceremony. Context would cause every widget to re-render when any widget changes."
        language="jsx"
      />

      <h2>Key Takeaways</h2>
      <p>
        <strong>Default choice:</strong> Zustand + TanStack Query covers 90% of apps.{' '}
        <strong>Large teams:</strong> Redux Toolkit provides guardrails and the best debugging.{' '}
        <strong>Dynamic UIs:</strong> Jotai&apos;s atomic model handles unpredictable state shapes.{' '}
        <strong>OOP fans:</strong> MobX lets you write classes and mutate directly.{' '}
        <strong>Simple apps:</strong> Context + useState is still perfectly valid.
      </p>
    </LessonLayout>
  );
}
