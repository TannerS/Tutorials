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

      <InfoBox variant="danger" title="The Problem: One Context Means Every Consumer Re-renders">
        <p>
          When state and dispatch share a single context, React compares the context
          value by reference. Every time state changes, the provider creates a{' '}
          <strong>new object</strong> — <code>{`{ todos, dispatch }`}</code> — even
          though <code>dispatch</code> itself never changed. React sees a new reference
          and re-renders <em>every</em> consumer, including components that only ever
          call <code>dispatch</code> and never read the state.
        </p>
        <CodeBlock language="jsx" title="❌ Single combined context — all consumers re-render on every state change">
          {`const TodoContext = createContext(null);

function TodoProvider({ children }) {
  const [todos, dispatch] = useReducer(todoReducer, []);

  // NEW object created on every render → every consumer re-renders
  return (
    <TodoContext.Provider value={{ todos, dispatch }}>
      {children}
    </TodoContext.Provider>
  );
}

function AddTodo() {
  // This component only needs dispatch — it never reads todos.
  // But it still re-renders every time a todo is added, toggled, or deleted
  // because the context value object is brand new each time.
  const { dispatch } = useContext(TodoContext);
  ...
}`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          In a small app this is harmless. At scale — dozens of consumers, frequent
          updates — it becomes a source of wasted renders and laggy UIs.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Does useMemo on the Value Help?">
        <p>Wrapping the context value in <code>useMemo</code> is a partial fix — worth doing, but it only solves half the problem.</p>
        <p><strong>What it fixes:</strong> without it, every time the Provider's parent re-renders, a new object is created even if state didn't change, triggering all consumers. <code>useMemo</code> gives you a stable reference when nothing has actually changed.</p>
        <p><strong>What it doesn't fix:</strong> the moment any dep actually changes — say <code>todos</code> updates — <code>useMemo</code> returns a new object and every consumer still re-renders, including components that only call <code>dispatch</code> and never read <code>todos</code>.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="useMemo on context value — partial improvement only">
{`// ⚠️ Better than nothing — prevents re-renders from parent re-rendering
//    but does NOT prevent re-renders when todos actually changes
function TodoProvider({ children }) {
  const [todos, dispatch] = useReducer(todoReducer, []);

  const value = useMemo(() => ({ todos, dispatch }), [todos]); // dispatch is stable

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

// AddTodo still re-renders every time todos changes —
// even though it only uses dispatch — because it subscribed to the combined object.
// The real fix is splitting into separate contexts (see below).`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why dispatch Is Safe to Isolate">
        <code>dispatch</code> returned by <code>useReducer</code> is <strong>referentially
        stable</strong> — React guarantees the same function reference across every
        render of the same component. That means a context whose only value is{' '}
        <code>dispatch</code> never produces a new reference, so its consumers{' '}
        <strong>never re-render</strong> due to context changes. Splitting the two
        contexts exploits this guarantee: read-only components subscribe to the state
        context, action-only components subscribe to the dispatch context and are
        permanently insulated from state changes.
      </InfoBox>

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

      <h2>Nested Providers — Do Re-renders Cascade?</h2>

      <p>
        A natural follow-on question: if you have many providers stacked at the app
        root and one of them re-renders, does the entire app re-render? The answer
        depends on <strong>where the children JSX is created</strong>.
      </p>

      <InfoBox variant="success" title="✅ Children as Props — Re-renders Stay Contained">
        <p>
          In the typical setup, children are written <em>outside</em> the provider and
          passed in as a prop. The provider just renders what it was given — it does not
          create that JSX itself.
        </p>
        <CodeBlock language="jsx" title="How you write providers at the app root (main.jsx)">
          {`// main.jsx — JSX for AuthProvider, App, etc. is created HERE
<ThemeProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</ThemeProvider>

// ThemeProvider.jsx
function ThemeProvider({ children }) {   // children arrives as a prop
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={theme}>
      {children}   {/* just renders what it was handed */}
    </ThemeContext.Provider>
  );
}`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          When <code>theme</code> changes, <code>ThemeProvider</code> re-renders. But
          its <code>children</code> prop is the same JSX reference that was created in{' '}
          <code>main.jsx</code> — nothing there changed. React sees the same reference
          and bails out. <strong>Only components that call{' '}
          <code>useContext(ThemeContext)</code> re-render</strong>, wherever they are
          in the tree.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="❌ Children Defined Inline — Re-renders Do Cascade">
        <p>
          If a provider defines its subtree <em>inside its own function body</em> instead
          of accepting children as a prop, every re-render creates brand-new JSX
          references and React re-renders everything below it.
        </p>
        <CodeBlock language="jsx" title="Bad pattern — children created inside the provider">
          {`// ThemeProvider.jsx — no children prop
function ThemeProvider() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={theme}>
      <AuthProvider>   {/* created HERE on every render */}
        <App />        {/* brand-new JSX reference each time */}
      </AuthProvider>
    </ThemeContext.Provider>
  );
}`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Every time <code>theme</code> changes, <code>ThemeProvider</code> runs again
          and produces new <code>&lt;AuthProvider&gt;</code> and <code>&lt;App /&gt;</code>{' '}
          elements. React sees new references and re-renders both — even though neither
          cares about <code>theme</code>. This is the cascade. You would rarely write
          providers this way, but it explains <em>why</em> the children-as-props pattern
          is not just convention — it is what keeps re-renders contained.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="One-Line Rule">
        <strong>Who creates the children JSX determines who owns its re-render.</strong>
        {' '}If the parent of the provider creates it, the provider re-rendering cannot
        invalidate it. If the provider creates it, every re-render throws it away and
        starts fresh.
      </InfoBox>

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

    </LessonLayout>
  );
}
