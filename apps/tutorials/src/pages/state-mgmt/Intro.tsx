import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="When Context Isn't Enough"
      sectionId="state-mgmt"
      lessonIndex={0}
      prev={null}
      next={{ path: '/state-mgmt/redux', label: 'Redux Toolkit' }}
    >
      <h2>React Context Recap</h2>
      <p>
        React Context lets you broadcast data to any component in a subtree without manually
        threading props. It&apos;s built into React, requires zero dependencies, and is perfect
        for low-frequency updates like themes, locale, or auth status.
      </p>

      <CodeBlock language="jsx" title="Basic Context Pattern">
{`const ThemeContext = createContext('light');

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  // ⚠️ This object is recreated every render unless memoized
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}`}
      </CodeBlock>

      <h2>The Performance Problem</h2>
      <p>
        Context has a fundamental limitation: <strong>every consumer re-renders when the provider
        value changes</strong>, even if the consumer only reads a slice of that value. There is no
        built-in selector mechanism. This is fine for a theme toggle that fires once an hour — it&apos;s
        catastrophic for a shopping cart that updates on every click.
      </p>

      <CodeBlock language="jsx" title="The Re-render Problem">
{`const AppContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Every consumer re-renders when ANY of these change
  return (
    <AppContext.Provider value={{
      user, setUser,
      cart, setCart,
      notifications, setNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

// This component re-renders when cart or notifications change,
// even though it only reads user
function UserAvatar() {
  const { user } = useContext(AppContext);
  return <img src={user?.avatar} alt={user?.name} />;
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Context Splitting Isn't Free">
        The common advice is &quot;split your context into multiple providers.&quot; This works but
        quickly leads to Provider Hell — 8+ nested providers at your app root. Each split also
        increases cognitive overhead and makes refactoring harder. At some point you&apos;re
        reinventing a state management library, poorly.
      </InfoBox>

      <h2>Prop Drilling vs Context vs External Store</h2>

      <CodeBlock language="jsx" title="The Three Approaches">
{`// 1. Prop Drilling — explicit, traceable, but verbose
<App user={user}>
  <Dashboard user={user}>
    <Sidebar user={user}>
      <UserMenu user={user} />
    </Sidebar>
  </Dashboard>
</App>

// 2. Context — no drilling, but all consumers re-render
<UserProvider>
  <App>
    <Dashboard>
      <Sidebar>
        <UserMenu /> {/* reads from context */}
      </Sidebar>
    </Dashboard>
  </App>
</UserProvider>

// 3. External Store — selector-based, surgical re-renders
function UserMenu() {
  // Only re-renders when user.name actually changes
  const name = useStore(state => state.user.name);
  return <span>{name}</span>;
}`}
      </CodeBlock>

      <h2>State Categories</h2>
      <p>
        Not all state is created equal. The first step in choosing a solution is categorizing
        what you&apos;re actually managing. Most apps have four distinct types of state, and each
        has a best-fit tool.
      </p>

      <FlowChart
        title="State Categories and Best-Fit Tools"
        chart={"graph TD\n  S[Application State] --> UI[UI State]\n  S --> SC[Server Cache]\n  S --> FS[Form State]\n  S --> URL[URL State]\n  UI --> UI1[Local: useState/useReducer]\n  UI --> UI2[Shared: Zustand/Redux/Context]\n  SC --> SC1[TanStack Query]\n  SC --> SC2[RTK Query / SWR]\n  FS --> FS1[React Hook Form]\n  FS --> FS2[Formik / useState]\n  URL --> URL1[React Router]\n  URL --> URL2[nuqs / useSearchParams]\n  style UI fill:#3b82f6,color:#fff\n  style SC fill:#10b981,color:#fff\n  style FS fill:#f59e0b,color:#fff\n  style URL fill:#8b5cf6,color:#fff"}
      />

      <h3>UI State</h3>
      <p>
        Modals, sidebars, selected tabs, accordion state. If it&apos;s local to one component,
        <code>useState</code> is perfect. If it&apos;s shared across unrelated components (like a
        global sidebar toggle), an external store shines.
      </p>

      <h3>Server Cache</h3>
      <p>
        Data fetched from APIs is <em>not your state</em> — it&apos;s a cache of someone else&apos;s
        state. TanStack Query (React Query) handles caching, background refetching, stale-while-revalidate,
        pagination, optimistic updates, and deduplication out of the box. Putting server data in Redux
        is the single most common over-engineering mistake in React apps.
      </p>

      <CodeBlock language="jsx" title="Server State with TanStack Query">
{`import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5 min before refetch
  });
}

function useAddTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (todo) => fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(todo),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}`}
      </CodeBlock>

      <h3>Form State</h3>
      <p>
        Form state is inherently local and ephemeral. Libraries like React Hook Form use
        uncontrolled inputs and refs to avoid re-renders on every keystroke — something neither
        Context nor Redux can match for performance.
      </p>

      <h3>URL State</h3>
      <p>
        Filters, pagination, sort order, selected tabs — if a user should be able to bookmark
        or share the current view, it belongs in the URL. React Router&apos;s <code>useSearchParams</code> or
        libraries like <code>nuqs</code> handle this natively.
      </p>

      <InfoBox variant="tip" title="You Might Not Need Redux">
        Before reaching for any state library, audit your state. If 80% of it is server cache
        (use TanStack Query), 15% is form state (use React Hook Form), and 5% is UI toggles
        (use useState) — you might not need a global store at all. The best state management
        is the state you don&apos;t manage.
      </InfoBox>

      <h2>The Decision Framework</h2>

      <FlowChart
        title="Do You Need a State Management Library?"
        chart={"graph TD\n  START[New State Requirement] --> Q1{Is it server data?}\n  Q1 -->|Yes| TQ[Use TanStack Query / RTK Query]\n  Q1 -->|No| Q2{Is it form data?}\n  Q2 -->|Yes| RHF[Use React Hook Form]\n  Q2 -->|No| Q3{Is it URL state?}\n  Q3 -->|Yes| RR[Use Router / useSearchParams]\n  Q3 -->|No| Q4{Shared across 2+ unrelated components?}\n  Q4 -->|No| US[Use useState / useReducer]\n  Q4 -->|Yes| Q5{High-frequency updates?}\n  Q5 -->|No| CTX[Context might be fine]\n  Q5 -->|Yes| EXT[Use Zustand / Redux Toolkit]\n  style TQ fill:#10b981,color:#fff\n  style RHF fill:#f59e0b,color:#fff\n  style RR fill:#8b5cf6,color:#fff\n  style US fill:#6b7280,color:#fff\n  style CTX fill:#3b82f6,color:#fff\n  style EXT fill:#ef4444,color:#fff"}
      />

      <h2>Signals and the Future of React State</h2>
      <p>
        Signals (popularized by SolidJS, adopted by Preact and Angular) offer fine-grained
        reactivity without selectors — the runtime tracks which components read which values
        and only re-renders those. The React team has explored compiler-based approaches
        (React Forget / React Compiler) that achieve similar goals by auto-memoizing components
        at build time, reducing the need for manual <code>useMemo</code> and <code>useCallback</code>.
      </p>

      <CodeBlock language="jsx" title="Signals Concept (Preact Signals)">
{`import { signal, computed } from '@preact/signals-react';

// Granular reactivity — no selectors, no re-render of parent
const count = signal(0);
const doubled = computed(() => count.value * 2);

function Counter() {
  // Only this component re-renders when count changes
  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="React Compiler (React 19+)">
        React Compiler (formerly React Forget) auto-memoizes components and hooks at build time.
        It won&apos;t eliminate the need for external stores in complex apps, but it will reduce
        the performance penalty of Context and make <code>useMemo</code>/<code>useCallback</code> largely
        unnecessary for most components.
      </InfoBox>

      <InteractiveChallenge
        question={"A component reads `user.name` from a Context that also contains `cart`, `notifications`, and `preferences`. When does this component re-render?"}
        options={[
          "Only when user.name changes",
          "When user.name or any other context value changes",
          "Only on mount and unmount",
          "When the parent component re-renders"
        ]}
        correctIndex={1}
        explanation="React Context has no selector mechanism. When any value in the provider changes, every consumer re-renders — even if it only reads a single field. This is the core limitation that external state libraries solve with selector-based subscriptions."
        language="jsx"
      />

      <h2>What&apos;s Next</h2>
      <p>
        Now that you understand <em>when</em> you need external state management, the next lessons
        dive into the <em>how</em>. We&apos;ll build the same todo app in Redux Toolkit and Zustand,
        then compare every major library side-by-side so you can make an informed choice for your
        next project.
      </p>
    </LessonLayout>
  );
}
