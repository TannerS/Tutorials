import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function State() {
  return (
    <LessonLayout
      title="State Management Patterns"
      sectionId="react19"
      lessonIndex={2}
      prev={{ path: '/react19/hooks', label: 'Hooks Deep Dive' }}
      next={{ path: '/react19/effects', label: 'Effects & Data Fetching' }}
    >
      <p>State management is the central challenge in React applications. The right approach depends on the scope, frequency of updates, and number of consumers. Here's a framework for choosing.</p>

      <FlowChart
        title="State Management Decision Tree"
        chart={"graph TD\n  A[Where does this state belong?] --> B{Used by single component?}\n  B -->|Yes| C[Local useState/useReducer]\n  B -->|No| D{Used by parent + few children?}\n  D -->|Yes| E[Lift state to parent]\n  D -->|No| F{Deeply nested consumers?}\n  F -->|Yes| G{Updates frequently?}\n  F -->|No| E\n  G -->|No| H[Context + useReducer]\n  G -->|Yes| I{Need derived/computed state?}\n  I -->|Yes| J[Zustand or Jotai]\n  I -->|No| K[Zustand with selectors]\n  L[Server state?] --> M[TanStack Query / SWR]"}
      />

      <h2>Lifting State & Prop Drilling</h2>

      <InfoBox variant="info" title="Prop Drilling Is Not Always Bad">
        <p>Passing props through 2-3 levels is normal React. It makes data flow explicit and components easy to test. Start worrying at 4+ levels or when intermediate components don't use the props at all.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Prop Drilling Solutions" showLineNumbers>
{`// Problem: intermediate components pass props they don't use
function App() {
  const [user, setUser] = useState(null);
  return <Layout user={user} setUser={setUser} />;
}
function Layout({ user, setUser }) {
  // Layout doesn't use user — it just passes it through
  return <Sidebar user={user} setUser={setUser} />;
}

// Solution 1: Component composition (move components up)
function App() {
  const [user, setUser] = useState(null);
  return (
    <Layout
      sidebar={<Sidebar user={user} setUser={setUser} />}
    />
  );
}
function Layout({ sidebar }) {
  return <div className="layout">{sidebar}</div>; // No prop drilling!
}

// Solution 2: Children pattern
function App() {
  const [user, setUser] = useState(null);
  return (
    <Layout>
      <Sidebar user={user} setUser={setUser} />
    </Layout>
  );
}`}
      </CodeBlock>

      <h2>useReducer + Context — Built-in Global State</h2>

      <CodeBlock language="jsx" title="Scalable Context + Reducer Pattern" showLineNumbers>
{`// Split context into State and Dispatch for performance
const TodoStateContext = createContext(null);
const TodoDispatchContext = createContext(null);

function todoReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, { id: crypto.randomUUID(), text: action.text, done: false }];
    case 'TOGGLE':
      return state.map(t => t.id === action.id ? { ...t, done: !t.done } : t);
    case 'DELETE':
      return state.filter(t => t.id !== action.id);
    default:
      throw new Error(\`Unknown action: \${action.type}\`);
  }
}

function TodoProvider({ children }) {
  const [todos, dispatch] = useReducer(todoReducer, []);
  return (
    <TodoStateContext.Provider value={todos}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  );
}

// Custom hooks for consuming — encapsulate context access
function useTodos() {
  const context = useContext(TodoStateContext);
  if (context === null) throw new Error('useTodos must be inside TodoProvider');
  return context;
}

function useTodoDispatch() {
  const context = useContext(TodoDispatchContext);
  if (context === null) throw new Error('useTodoDispatch must be inside TodoProvider');
  return context;
}

// WHY split? Components using only dispatch won't re-render when state changes.
// dispatch is stable (same reference across renders).
function AddTodo() {
  const dispatch = useTodoDispatch(); // Never re-renders from state changes
  const [text, setText] = useState('');
  return (
    <form onSubmit={e => {
      e.preventDefault();
      dispatch({ type: 'ADD', text });
      setText('');
    }}>
      <input value={text} onChange={e => setText(e.target.value)} />
    </form>
  );
}`}
      </CodeBlock>

      <h2>External Libraries — Zustand & Jotai</h2>

      <CodeBlock language="jsx" title="Zustand — Minimal Global Store" showLineNumbers>
{`import { create } from 'zustand';

// Define store — plain function, no providers needed
const useStore = create((set, get) => ({
  bears: 0,
  fish: [],
  // Actions live alongside state
  increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  addFish: (fish) => set(state => ({ fish: [...state.fish, fish] })),
  // Async actions are just regular async functions
  fetchFish: async () => {
    const response = await fetch('/api/fish');
    const fish = await response.json();
    set({ fish });
  },
}));

// Components subscribe to slices — only re-render when selected value changes
function BearCounter() {
  const bears = useStore(state => state.bears); // Selector!
  return <h1>{bears} bears</h1>;
}

function Controls() {
  const increase = useStore(state => state.increasePopulation);
  return <button onClick={increase}>Add bear</button>;
}

// Zustand with immer for nested updates
import { immer } from 'zustand/middleware/immer';

const useNestedStore = create(immer((set) => ({
  deeply: { nested: { value: 0 } },
  increment: () => set(state => { state.deeply.nested.value += 1; }),
})));`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Jotai — Atomic State" showLineNumbers>
{`import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// Atoms are minimal state units — like useState but shareable
const countAtom = atom(0);
const doubleCountAtom = atom(get => get(countAtom) * 2); // Derived atom

// Async derived atom
const userAtom = atom(async (get) => {
  const id = get(userIdAtom);
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json();
});

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubled = useAtomValue(doubleCountAtom); // Read-only
  return (
    <div>
      <span>{count} (doubled: {doubled})</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}

// When to choose Jotai over Zustand:
// - Fine-grained reactivity (many independent pieces of state)
// - Derived/computed state is central to your app
// - You want React-like mental model (atoms ≈ useState that's global)`}
      </CodeBlock>

      <h2>State Machines Concept</h2>

      <InfoBox variant="tip" title="State Machines Prevent Impossible States">
        <p>Instead of multiple booleans (<code>isLoading</code>, <code>isError</code>, <code>isSuccess</code>) that can conflict, model state as explicit states with defined transitions. Libraries like XState formalize this, but you can apply the concept with useReducer.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="State Machine with useReducer" showLineNumbers>
{`// Define valid states and transitions explicitly
const machine = {
  idle: { FETCH: 'loading' },
  loading: { SUCCESS: 'success', ERROR: 'error' },
  success: { FETCH: 'loading', RESET: 'idle' },
  error: { RETRY: 'loading', RESET: 'idle' },
};

function reducer(state, event) {
  const nextStatus = machine[state.status]?.[event.type];
  if (!nextStatus) return state; // Invalid transition — ignore

  switch (event.type) {
    case 'FETCH':
    case 'RETRY':
      return { status: 'loading', data: state.data, error: null };
    case 'SUCCESS':
      return { status: 'success', data: event.data, error: null };
    case 'ERROR':
      return { status: 'error', data: null, error: event.error };
    case 'RESET':
      return { status: 'idle', data: null, error: null };
    default:
      return state;
  }
}

// Now it's IMPOSSIBLE to be in loading + error simultaneously`}
      </CodeBlock>

      <InteractiveChallenge
        question="Why split Context into separate State and Dispatch providers?"
        options={[
          "It reduces bundle size by tree-shaking unused context",
          "Components that only dispatch actions won't re-render when state changes",
          "React requires separate contexts for objects vs functions",
          "It enables server-side rendering of the dispatch context"
        ]}
        correctIndex={1}
        explanation="When state and dispatch share a context, every state change creates a new context value object, causing ALL consumers to re-render — even those that only call dispatch. Since dispatch from useReducer is referentially stable, putting it in its own context means action-only consumers never re-render from state changes."
        language="jsx"
      />
    </LessonLayout>
  );
}
