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
      next={{ path: '/state-mgmt/comparison', label: 'The State Escalation Ladder' }}
    >
      <h2>React Context Recap</h2>
      <p>
        React Context lets you broadcast data to any component in a subtree without manually
        threading props. It&apos;s built into React, requires zero dependencies, and is perfect
        for low-frequency updates like themes, locale, or auth status.
      </p>

      <CodeBlock language="jsx" title="Basic Context Pattern">
{`// Default is undefined ON PURPOSE — see the note below.
const ThemeContext = createContext(undefined);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  // ⚠️ This object is recreated every render unless memoized
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <ThemeContext value={value}>
      {children}
    </ThemeContext>
  );
}

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why the Default Value Is undefined, Not 'light'">
        <p>
          A plausible-looking <code>createContext('light')</code> quietly disables the
          guard on the next line. The default is returned only when there is{' '}
          <strong>no matching provider above</strong> — which is exactly the case the
          guard exists to catch. Give it a truthy default and{' '}
          <code>if (!ctx)</code> can never fire.
        </p>
        <p>
          The failure is not a clean crash, either. A component rendered outside the
          provider gets the string <code>'light'</code>, destructures it as{' '}
          <code>{'const { theme, setTheme } = useTheme()'}</code>, and receives{' '}
          <code>undefined</code> for both — because strings have no{' '}
          <code>.theme</code> property. You then get{' '}
          <em>&ldquo;setTheme is not a function&rdquo;</em> from somewhere deep in a
          click handler, far from the missing provider that actually caused it.
        </p>
        <p style={{ marginBottom: 0 }}>
          Hence the rule: <strong>make the default value unusable.</strong> Pass{' '}
          <code>undefined</code> (or <code>null</code>) and let the custom hook throw a
          message that names the missing provider. A context default is genuinely
          useful only when a component is <em>designed</em> to work without a provider
          — which is rarer than it sounds. In TypeScript this is enforced for you:
          typing the context as <code>ThemeValue | undefined</code> makes the guard the
          only way to narrow it before use.
        </p>
      </InfoBox>

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
    <AppContext value={{
      user, setUser,
      cart, setCart,
      notifications, setNotifications
    }}>
      {children}
    </AppContext>
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
// (This selector shape is what Zustand and Redux both give you. It is
//  rung 5 of the ladder in the next lesson — shown here only for contrast.)
function UserMenu() {
  // The store calls this selector on every change and re-renders ONLY if
  // the SELECTED slice differs. That extra comparison step is the thing
  // Context structurally cannot do.
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
        chart={"graph TD\n  S[Application State] --> UI[UI State]\n  S --> SC[Server Cache]\n  S --> FS[Form State]\n  S --> URL[URL State]\n  UI --> UI1[Local: useState/useReducer]\n  UI --> UI2[Shared: Context + useReducer]\n  SC --> SC1[TanStack Query]\n  SC --> SC2[SWR]\n  FS --> FS1[React Hook Form]\n  FS --> FS2[Formik / useState]\n  URL --> URL1[React Router]\n  URL --> URL2[nuqs / useSearchParams]\n  style UI fill:#1a2744\n  style SC fill:#1a3329\n  style FS fill:#3d2f14\n  style URL fill:#2a1f44"}
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
        state. TanStack Query (React Query) handles caching, background refetching,
        <strong> stale-while-revalidate</strong> — serve the cached copy instantly, then quietly
        refetch and swap in fresh data if it changed, so the user never waits on a spinner for
        data you already had — plus pagination, optimistic updates, and deduplication out of
        the box. Copying server data into
        your own client state — a Context, a reducer, a store — and then hand-maintaining it is the
        single most common over-engineering mistake in React apps.
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
        uncontrolled inputs and refs to avoid re-renders on every keystroke — something no
        Context-based or global store solution can match for performance.
      </p>

      <h3>URL State</h3>
      <p>
        Filters, pagination, sort order, selected tabs — if a user should be able to bookmark
        or share the current view, it belongs in the URL. React Router&apos;s <code>useSearchParams</code> or
        libraries like <code>nuqs</code> handle this natively.
      </p>

      <InfoBox variant="tip" title="You Might Not Need a Store At All">
        Before reaching for any state library, audit your state. If 80% of it is server cache
        (use TanStack Query), 15% is form state (use React Hook Form), and 5% is UI toggles
        (use useState) — you might not need a global store at all. The best state management
        is the state you don&apos;t manage.
      </InfoBox>

      <h2>The Decision Framework</h2>

      <FlowChart
        title="Do You Need a State Management Library?"
        chart={"graph TD\n  START[New State Requirement] --> Q1{Is it server data?}\n  Q1 -->|Yes| TQ[Use TanStack Query]\n  Q1 -->|No| Q2{Is it form data?}\n  Q2 -->|Yes| RHF[Use React Hook Form]\n  Q2 -->|No| Q3{Is it URL state?}\n  Q3 -->|Yes| RR[Use Router / useSearchParams]\n  Q3 -->|No| Q4{Shared across 2+ unrelated components?}\n  Q4 -->|No| US[Use useState / useReducer]\n  Q4 -->|Yes| Q5{High-frequency updates?}\n  Q5 -->|No| CTX[Context + useReducer]\n  Q5 -->|Yes| EXT[Split contexts, or an external store]\n  style TQ fill:#1a3329\n  style RHF fill:#3d2f14\n  style RR fill:#2a1f44\n  style US fill:#1a2744\n  style CTX fill:#1a2744\n  style EXT fill:#3b1a1a"}
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
        Now that you can categorize state, the next lesson walks the escalation ladder rung by
        rung — <code>useState</code>, lifting state up, <code>useReducer</code>, Context, and finally
        a dedicated store — with the real re-render cost of each and an honest test for when to
        climb. After that we cover the production Context + <code>useReducer</code> patterns, and
        finish with TanStack Query for the server cache, which is a different problem entirely.
      </p>
    </LessonLayout>
  );
}
