import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Context() {
  return (
    <LessonLayout
      title="Context & Composition"
      sectionId="react19"
      lessonIndex={4}
      prev={{ path: '/react19/effects', label: 'Effects & Data Fetching' }}
      next={{ path: '/react19/performance', label: 'Performance & Memoization' }}
    >
      <p>Context provides a way to pass data through the component tree without prop drilling. But it's often overused where composition patterns would be simpler and more performant.</p>

      <h2>Context Performance Model</h2>

      <FlowChart
        title="Context Update Propagation"
        chart={"graph TD\n  A[Provider value changes] --> B[React finds all consumers]\n  B --> C[ALL consumers re-render]\n  C --> D{Even if they use React.memo}\n  D -->|Yes| E[memo is bypassed for context]\n  F[Optimization strategies] --> G[Split contexts by update frequency]\n  F --> H[Memoize provider value]\n  F --> I[Use selectors via useSyncExternalStore]\n  F --> J[Prefer composition over context]"}
      />

      <InfoBox variant="warning" title="Context Re-renders All Consumers">
        <p>When a context value changes, <strong>every</strong> component that calls <code>useContext</code> for that context re-renders — regardless of whether it uses the changed part. <code>React.memo</code> does NOT prevent context-triggered re-renders. This is why context splitting matters.</p>
      </InfoBox>

      <h2>Context Splitting Pattern</h2>

      <CodeBlock language="jsx" title="Split Context by Update Frequency" showLineNumbers>
{`// BAD: One big context that changes on every keystroke
const AppContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);       // Changes rarely
  const [theme, setTheme] = useState('dark');   // Changes rarely
  const [query, setQuery] = useState('');       // Changes on every keystroke!

  // Every keystroke re-renders ALL consumers, even those using only 'user'
  return (
    <AppContext.Provider value={{ user, theme, query, setQuery }}>
      {children}
    </AppContext.Provider>
  );
}

// GOOD: Split into separate contexts by update frequency
const UserContext = createContext(null);
const ThemeContext = createContext('dark');
const SearchContext = createContext({ query: '', setQuery: () => {} });

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [query, setQuery] = useState('');

  // Memoize values that depend on state
  const searchValue = useMemo(() => ({ query, setQuery }), [query]);

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <SearchContext.Provider value={searchValue}>
          {children}
        </SearchContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

// Now typing in search only re-renders SearchContext consumers`}
      </CodeBlock>

      <h2>Composition Over Context</h2>

      <p>Before reaching for Context, consider whether component composition solves the problem more simply:</p>

      <CodeBlock language="jsx" title="Composition Patterns That Replace Context" showLineNumbers>
{`// SCENARIO: Dashboard needs user data in deeply nested components

// APPROACH 1 (Common but often wrong): Context
// Creates coupling — every component implicitly depends on UserContext

// APPROACH 2 (Often better): Compose at the top, pass assembled components
function Dashboard() {
  const user = useUser(); // Only ONE component reads context

  return (
    <DashboardLayout
      header={<Header userName={user.name} avatar={user.avatar} />}
      sidebar={<Sidebar permissions={user.permissions} />}
      content={<MainContent userId={user.id} />}
    />
  );
}

// DashboardLayout knows nothing about users — pure layout component
function DashboardLayout({ header, sidebar, content }) {
  return (
    <div className="dashboard">
      <nav>{header}</nav>
      <aside>{sidebar}</aside>
      <main>{content}</main>
    </div>
  );
}

// APPROACH 3: Render props for dynamic composition
function AuthGate({ children, fallback }) {
  const user = useUser();
  if (!user) return fallback;
  return children(user); // Pass user to render function
}

// Usage:
<AuthGate fallback={<LoginPage />}>
  {(user) => <Dashboard user={user} />}
</AuthGate>`}
      </CodeBlock>

      <h2>Provider Pattern with TypeScript</h2>

      <CodeBlock language="typescript" title="Type-Safe Context Pattern" showLineNumbers>
{`// The definitive pattern for type-safe context in production

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthActions {
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

// Separate state from actions (different update frequencies)
const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthActionsContext = createContext<AuthActions | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  // Actions are stable — memoize once
  const actions = useMemo<AuthActions>(() => ({
    login: async (credentials) => {
      setState(s => ({ ...s, isLoading: true }));
      const user = await authApi.login(credentials);
      setState({ user, isLoading: false });
    },
    logout: () => {
      authApi.logout();
      setState({ user: null, isLoading: false });
    },
    refresh: async () => {
      const user = await authApi.refresh();
      setState({ user, isLoading: false });
    },
  }), []);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionsContext.Provider value={actions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

// Hook with runtime safety check
export function useAuthState(): AuthState {
  const ctx = useContext(AuthStateContext);
  if (ctx === undefined) {
    throw new Error('useAuthState must be used within AuthProvider');
  }
  return ctx;
}

export function useAuthActions(): AuthActions {
  const ctx = useContext(AuthActionsContext);
  if (ctx === undefined) {
    throw new Error('useAuthActions must be used within AuthProvider');
  }
  return ctx;
}`}
      </CodeBlock>

      <h2>React 19 Context Changes</h2>

      <InfoBox variant="success" title="React 19: Context as Provider">
        <p>In React 19, you can render <code>&lt;Context&gt;</code> directly as a provider instead of <code>&lt;Context.Provider&gt;</code>. The old syntax still works but is deprecated. Also, React 19's compiler may reduce unnecessary context re-renders through automatic memoization.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="React 19 Context Syntax" showLineNumbers>
{`// React 18 (still works but deprecated)
<ThemeContext.Provider value={theme}>
  {children}
</ThemeContext.Provider>

// React 19 — cleaner syntax
<ThemeContext value={theme}>
  {children}
</ThemeContext>`}
      </CodeBlock>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: Why does <code>{'{}'}</code> cause context re-renders when the data inside hasn't changed?</h3>

      <InfoBox variant="info" title="Short Answer: It's the box, not the contents">
        <p>State values like <code>user</code> and <code>permissions</code> keep the same reference between renders (assuming you didn't call setState). The problem is the <code>{'{}'}</code> wrapper — it creates a <strong>new object (new box)</strong> every render, even though the contents are identical.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="The Box Problem" showLineNumbers>
{`function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // user → same reference (useState preserves it)
  // permissions → same reference
  // setUser → stable (React guarantee)
  // setPermissions → stable

  // BUT: { } creates a NEW OBJECT every render
  // Think of it as a new box:
  //
  //   Render 1: 📦 Box A → { user, permissions, setUser, setPermissions }
  //   Render 2: 📦 Box B → { user, permissions, setUser, setPermissions }
  //
  //   Contents are identical. But Box A !== Box B (different box).
  //   React checks the BOX with Object.is, not the contents.
  //   New box = new value = all consumers re-render.

  return (
    <AuthContext.Provider value={{ user, permissions, setUser, setPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

// FIX: useMemo reuses the same box when contents haven't changed
function AuthProviderFixed({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  const value = useMemo(
    () => ({ user, permissions, setUser, setPermissions }),
    [user, permissions]
  );
  // Render 1: creates Box A
  // Render 2: user & permissions unchanged → returns Box A (same box!)
  // React: Object.is(Box A, Box A) === true → no consumer re-renders

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}`}
      </CodeBlock>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: When a context consumer re-renders, do its children also re-render?</h3>

      <InfoBox variant="danger" title="Short Answer: Yes — the entire subtree below every consumer">
        <p>This is React's default behavior: when a component re-renders (for <em>any</em> reason), <strong>all children re-render too</strong>. Context doesn't change this rule — it just adds another trigger. Once a consumer re-renders from a context change, normal cascade rules take over.</p>
      </InfoBox>

      <CodeBlock language="text" title="The Full Cascade">
{`Theme toggle (unrelated to auth) causes AuthProvider to re-render
  │
  ├─ value={{ user, permissions }} ← NEW object (no useMemo)
  │
  ├─→ <Navbar />   ← useContext sees new ref → RE-RENDERS
  │     ├─→ <Logo />               ← re-renders (parent did)
  │     ├─→ <SearchBar />          ← re-renders
  │     │     └─→ <Suggestions />  ← re-renders
  │     └─→ <UserAvatar />         ← re-renders
  │
  ├─→ <Sidebar />  ← useContext sees new ref → RE-RENDERS
  │     └─→ <NavLinks />           ← re-renders
  │
  └─→ <MainContent />  ← useContext sees new ref → RE-RENDERS
        ├─→ <Dashboard />          ← re-renders
        │     └─→ <Chart />        ← re-renders (expensive!)
        └─→ <DataTable />          ← re-renders (expensive!)

1 unmemoized provider → 3 consumers → 10+ descendant re-renders
Auth data never changed. All of this was unnecessary.`}
      </CodeBlock>

      <InfoBox variant="info" title="The Chain of Events">
        <ol>
          <li><strong>Something unrelated</strong> causes the provider's parent to re-render</li>
          <li>The provider re-renders → <code>{'{}'}</code> creates a <strong>new value object</strong></li>
          <li><code>Object.is(oldValue, newValue)</code> returns <strong>false</strong></li>
          <li><strong>Every consumer</strong> using <code>useContext(AuthContext)</code> re-renders — <em>regardless of React.memo</em></li>
          <li>Each consumer re-renders → React's <strong>default cascade</strong> kicks in → all children re-render</li>
          <li>Children's children re-render → <strong>entire subtree</strong> below every consumer</li>
        </ol>
      </InfoBox>

      <CodeBlock language="jsx" title="The Fix — One line of useMemo saves the entire tree" showLineNumbers>
{`// With useMemo:
//   Provider re-renders → useMemo returns SAME object → Object.is = true
//   → 0 consumers re-render → 0 descendants cascade
//   One line saved the entire component tree.

const value = useMemo(
  () => ({ user, permissions, setUser, setPermissions }),
  [user, permissions]
);`}
      </CodeBlock>

      <FlowChart title="Without useMemo vs With useMemo" chart={"graph LR\n  subgraph Without\n  A1[Provider re-renders] --> B1[New object created]\n  B1 --> C1[ALL consumers re-render]\n  C1 --> D1[ALL descendants cascade]\n  end\n  subgraph With\n  A2[Provider re-renders] --> B2[useMemo returns cached object]\n  B2 --> C2[No consumers re-render]\n  C2 --> D2[No cascade]\n  end\n  style B1 fill:#f44336,color:#fff\n  style D1 fill:#f44336,color:#fff\n  style B2 fill:#4caf50,color:#fff\n  style D2 fill:#4caf50,color:#fff"} />

      <InfoBox variant="note" title="React.memo Does NOT Protect Against Context">
        <p>Even if a consumer is wrapped in <code>React.memo</code>, it will <strong>still re-render</strong> when its context value changes. React.memo only checks props — context bypasses it entirely. The only fix is at the <strong>provider level</strong> (memoize the value) or use a state management library with <strong>selector-based subscriptions</strong> (like Zustand).</p>
      </InfoBox>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: When does memoizing the context value actually matter?</h3>

      <InfoBox variant="info" title="Short Answer: When the provider re-renders for reasons unrelated to its data">
        <p>If the only thing that causes your provider to re-render is <code>setState</code> on its own state, then the data IS changing and consumers SHOULD re-render. useMemo helps when <strong>something else</strong> causes the provider to re-render (parent state, parent context, etc.).</p>
      </InfoBox>

      <CodeBlock language="jsx" title="The scenario where useMemo matters" showLineNumbers>
{`function App() {
  const [theme, setTheme] = useState('dark');  // UNRELATED to auth

  return (
    // AuthProvider is a child of App.
    // When App re-renders (theme changes), AuthProvider re-renders too.
    <AuthProvider>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
      <UserProfile />   {/* uses useContext(AuthContext) */}
    </AuthProvider>
  );
}

// Click "Toggle Theme":
//
// ❌ WITHOUT useMemo:
//   App re-renders → AuthProvider re-renders → new value object
//   → UserProfile re-renders (auth data didn't change!)
//
// ✅ WITH useMemo:
//   App re-renders → AuthProvider re-renders → useMemo returns cached object
//   → UserProfile does NOT re-render ✅`}
      </CodeBlock>

      <InteractiveChallenge
        question={"An AuthProvider has value={{ user, setUser }} without useMemo. A sibling component changes theme state. What happens to components using useContext(AuthContext)?"}
        options={[
          "Nothing — the auth data didn't change",
          "Only components that read 'user' re-render",
          "All consumers re-render, plus all their descendants",
          "Only the AuthProvider re-renders, consumers are protected"
        ]}
        correctIndex={2}
        explanation={"Without useMemo, the {} creates a new object every render. When the parent re-renders (theme change), AuthProvider re-renders too, creating a new value object. Object.is fails → all consumers re-render → each consumer's children cascade. The entire subtree below every consumer re-renders unnecessarily."}
      />

      <InteractiveChallenge
        question={"A MemoizedChart component is wrapped in React.memo but uses useContext(ThemeContext). The theme changes. What happens?"}
        options={[
          "Nothing — React.memo blocks the re-render because props didn't change",
          "MemoizedChart re-renders because context bypasses React.memo",
          "Only the children of MemoizedChart re-render",
          "MemoizedChart re-renders only if it also receives new props"
        ]}
        correctIndex={1}
        explanation={"React.memo only checks props — it has no awareness of context. When a context value changes, every component that calls useContext for that context re-renders, regardless of whether it's wrapped in React.memo. The memo gate only guards against prop changes; context walks right through it."}
      />

      <InteractiveChallenge
        question="A component wrapped in React.memo consumes a context via useContext. The context value changes. What happens?"
        options={[
          "React.memo prevents the re-render since props didn't change",
          "The component re-renders — context changes bypass React.memo",
          "The component re-renders only if the context value fails Object.is comparison",
          "It depends on whether the component reads the changed property"
        ]}
        correctIndex={1}
        explanation="React.memo only prevents re-renders caused by parent re-rendering with same props. Context is a separate subscription mechanism — when context value changes, ALL subscribed consumers re-render unconditionally. This is why splitting contexts and memoizing provider values is important."
        language="jsx"
      />
    </LessonLayout>
  );
}
