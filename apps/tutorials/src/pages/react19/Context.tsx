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

      <InfoBox variant="info" title="What the Provider Pattern actually is">
        <p>
          The Provider Pattern is just a convention for packaging context properly. Instead of
          scattering <code>createContext</code>, <code>useState</code>, and <code>useContext</code>
          calls across your app, you bundle them into three things that live in one file:
        </p>
        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', lineHeight: 2 }}>
          <li>A <strong>context object</strong> (created with <code>createContext</code>, kept private)</li>
          <li>A <strong>Provider component</strong> that owns the state and wraps children</li>
          <li><strong>Custom hooks</strong> (<code>useAuth</code>, etc.) that are the only public API</li>
        </ol>
        <p style={{ marginTop: '0.75rem' }}>
          Consumers never touch the context object directly — they call the hook. This means you
          can change the internals later without breaking anything that uses it.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="Why undefined instead of null as the default?">
        <p>
          <code>createContext&lt;AuthState | undefined&gt;(undefined)</code> is a deliberate trick.
          If you pass a real default value, <code>useContext</code> will silently return it when
          called outside a Provider — your component appears to work, but it's reading stale dummy
          data with no error.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          With <code>undefined</code> as the default, the custom hook can check{' '}
          <code>if (ctx === undefined)</code> and throw immediately with a clear message:{' '}
          <em>"useAuthState must be used within AuthProvider."</em> You get a loud, obvious crash
          at the call site instead of a silent data bug far from the root cause.
        </p>
      </InfoBox>

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

// ─── Step 1: create two separate contexts ────────────────────────────────────
// State and actions are split because they update at different rates.
// A component that only dispatches actions (a button) subscribes to
// AuthActionsContext — it never re-renders when state changes.
const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthActionsContext = createContext<AuthActions | undefined>(undefined);

// ─── Step 2: one Provider component owns all the state ───────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  // Actions never change — useMemo with empty deps creates them once.
  // This is what keeps AuthActionsContext stable (no re-renders for action consumers).
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
  }), []); // ← no deps: actions are created once and never replaced

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionsContext.Provider value={actions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

// ─── Step 3: export hooks, NOT the context objects ───────────────────────────
// Consumers call useAuthState() or useAuthActions() — they never import
// AuthStateContext directly. If you ever swap the internals, the hook API stays.
export function useAuthState(): AuthState {
  const ctx = useContext(AuthStateContext);
  if (ctx === undefined) {
    // undefined = called outside a Provider. Give a clear error immediately.
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
}

// ─── Usage ────────────────────────────────────────────────────────────────────
// Wrap once at the app root:
// <AuthProvider><App /></AuthProvider>

// In any component below it:
function Avatar() {
  const { user } = useAuthState();       // re-renders when state changes
  return <img src={user?.avatar} />;
}

function LogoutButton() {
  const { logout } = useAuthActions();   // never re-renders when state changes
  return <button onClick={logout}>Log out</button>;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The TypeScript generics at a glance">
        <p><code>createContext&lt;AuthState | undefined&gt;(undefined)</code> — the generic tells TypeScript what type consumers will receive. Without it, TypeScript infers <code>undefined</code> as the only possible value and will complain every time you try to use the context.</p>
        <p style={{ marginTop: '0.5rem' }}><code>useState&lt;AuthState&gt;(...)</code> and <code>useMemo&lt;AuthActions&gt;(...)</code> are optional here because TypeScript can infer them from the initial value — but writing them explicitly documents intent and catches mistakes when the shape changes.</p>
      </InfoBox>

      <h2>Stateful Providers — The Standard Shape</h2>

      <p>The "raw" form — <code>{'<Context.Provider value={staticValue}>'}</code> — is rare in production. Most providers you'll see in real apps own state, fetch data, expose actions, and bundle everything into the context value. That's not a code smell, that's the norm.</p>

      <InfoBox variant="info" title="Why providers own state">
        <p>If a provider just exposed a static value, you wouldn't need a provider at all — you could just <code>import</code> it. The reason a provider exists is to <strong>own dynamic state and expose it tree-wide</strong>. That naturally means it does the work of fetching, storing, mutating, and computing that state.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="The Canonical Stateful Provider" showLineNumbers>
{`function AuthProvider({ children }) {
  // 1. State the provider owns
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Initial load — fetch current user once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.fetchCurrentUser();
        if (!cancelled) setUser(me);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 3. Action handlers — stable references via useCallback
  const login = useCallback(async (credentials) => { /* ... */ }, []);
  const logout = useCallback(async () => { /* ... */ }, []);
  const refresh = useCallback(async () => { /* ... */ }, []);

  // 4. Derived values — recomputed only when their deps change
  const isAdmin = useMemo(
    () => user?.roles?.includes('admin') ?? false,
    [user]
  );

  // 5. Bundle into a memoized value — same reference until contents change
  const value = useMemo(
    () => ({ user, loading, error, login, logout, refresh, isAdmin }),
    [user, loading, error, login, logout, refresh, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}`}
      </CodeBlock>

      <p>Five pieces that appear in nearly every production provider: <strong>state</strong> (1) → <strong>side effects</strong> (2) → <strong>action handlers</strong> (3) → <strong>derived values</strong> (4) → <strong>memoized value bundle</strong> (5). Every <code>useCallback</code> stabilizes a callback so its reference doesn't churn. The final <code>useMemo</code> stabilizes the whole bundle so consumers don't re-render when the parent re-renders for unrelated reasons.</p>

      <InfoBox variant="warning" title="When a stateful provider becomes a smell">
        <ul>
          <li><strong>Hundreds of lines</strong> — multiple concerns crammed into one provider. Split it: <code>AuthProvider</code>, <code>UserProfileProvider</code>, <code>PermissionsProvider</code>.</li>
          <li><strong>Touches unrelated APIs</strong> — if <code>UserProvider</code> is also fetching feature flags, that's two contexts pretending to be one.</li>
          <li><strong>Most consumers only need 1 of 12 fields</strong> — context's all-or-nothing re-render model bites hardest here. Either split contexts or move that data to a state-management library with selector subscriptions.</li>
          <li><strong>Logic so complex you can't unit-test it</strong> — extract custom hooks (<code>useAuthData</code>, <code>useAuthActions</code>) that the provider just composes together. Each hook becomes testable; the provider becomes thin glue.</li>
        </ul>
      </InfoBox>

      <CodeBlock language="jsx" title="Refactor: provider as glue, hooks as logic" showLineNumbers>
{`// Before: 200-line god provider
function AuthProvider({ children }) {
  // useState x5, useEffect x3, useCallback x6, useMemo x4...
  return <AuthContext.Provider value={...}>{children}</AuthContext.Provider>;
}

// After: hooks own logic, provider owns composition
function AuthProvider({ children }) {
  const authState = useAuthData();         // fetch + cache user
  const authActions = useAuthActions();    // login/logout/refresh
  const perms = useAuthPermissions(authState.user);

  const value = useMemo(
    () => ({ ...authState, ...authActions, ...perms }),
    [authState, authActions, perms]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}`}
      </CodeBlock>

      <h2>Two Mechanisms: Cascade vs Broadcast</h2>

      <p>When React re-renders things, there are actually <strong>two distinct mechanisms</strong> at play. They get conflated constantly — but separating them is the single biggest unlock for understanding why your tree re-rendered (and how to stop it).</p>

      <FlowChart
        title="Cascade vs Broadcast — Two Different Mechanisms"
        chart={"graph TB\n  subgraph Cascade[\"📥 Render Cascade (top → down)\"]\n    A1[Parent re-renders] --> B1[Children re-render by default]\n    B1 --> C1[Cascade continues into grandchildren]\n    C1 --> D1[React.memo can stop this]\n  end\n  subgraph Broadcast[\"📡 Context Broadcast (sideways)\"]\n    A2[Provider value reference changes] --> B2[Every useContext consumer re-renders]\n    B2 --> C2[Regardless of where they are in the tree]\n    C2 --> D2[React.memo CANNOT stop this]\n  end\n  style A1 fill:#1976d2,color:#fff\n  style A2 fill:#7b1fa2,color:#fff\n  style D1 fill:#388e3c,color:#fff\n  style D2 fill:#d32f2f,color:#fff"}
      />

      <InfoBox variant="info" title="The two mechanisms at a glance">
        <p><strong>Cascade</strong> is React's default behavior. When a component re-renders, all of its children re-render too. <code>React.memo</code> stops this if the child's props haven't changed reference.</p>
        <p style={{ marginTop: '0.5rem' }}><strong>Broadcast</strong> is the context-specific path. When a <code>{'<Context.Provider value={X}>'}</code> renders with a new <code>X</code> reference, every <code>useContext</code> consumer re-renders — <em>anywhere in the tree</em>, regardless of memoization. This is the only mechanism that bypasses <code>React.memo</code>.</p>
      </InfoBox>

      <CodeBlock language="text" title="Different optimization strategies for each">
{`Cascade (parent → children)         | Broadcast (provider → consumers)
─────────────────────────────────── | ─────────────────────────────────────
Default React behavior              | Triggered by context value change
Top-down through the tree           | Anywhere in the tree
Blocked by React.memo + stable      | NOT blocked by React.memo
  props                             |
Fix: memoize props you pass down,   | Fix: useMemo the provider value
  wrap children in React.memo       |   OR split contexts by update freq
                                    |   OR use selector-based stores`}
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

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: When a provider re-renders, do its children re-render?</h3>

      <InfoBox variant="info" title="Short Answer: It depends on WHY the provider re-rendered">
        <p>There are two reasons a stateful provider can re-render, and they have <strong>different consequences for the children</strong>. Mixing them up is the source of most "wait, why didn't that re-render?" confusion.</p>
      </InfoBox>

      <CodeBlock language="text" title="Two Cases — Same Provider, Different Outcomes">
{`Case A: Provider re-renders because its PARENT re-rendered
  └─ The parent's render produced new JSX
  └─ children prop is a NEW reference
  └─ Cascade continues through → entire subtree re-renders
  └─ Plus: useContext consumers re-render (broadcast)

Case B: Provider re-renders because its OWN state changed
  └─ The parent did NOT re-render
  └─ children prop is the SAME reference as last render
  └─ React skips re-rendering children (children-as-prop optimization)
  └─ Only: useContext consumers re-render (broadcast)`}
      </CodeBlock>

      <CodeBlock language="jsx" title="The children-as-prop optimization in action" showLineNumbers>
{`function CountProvider({ children }) {
  const [count, setCount] = useState(0);

  // When setCount fires, this provider re-renders.
  // BUT 'children' was passed in by the parent — and the parent
  // didn't re-render. So 'children' is the SAME REFERENCE
  // it was on the previous render.
  //
  // React sees the same element reference and skips re-rendering it.
  // Only useContext(CountContext) consumers re-render via broadcast.

  const value = useMemo(() => ({ count, setCount }), [count]);

  return (
    <CountContext.Provider value={value}>
      {children}
    </CountContext.Provider>
  );
}

function App() {
  return (
    <CountProvider>
      <ExpensiveTree />    {/* does NOT re-render when count changes */}
      <CountDisplay />     {/* uses useContext — DOES re-render */}
    </CountProvider>
  );
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Why this matters for deep provider stacks">
        <p>Real apps often have 10+ providers nested at the root (auth, theme, locale, feature flags, toast, modal, breadcrumb, router, query client, ...). It <em>looks</em> catastrophic — surely every state change blows up the whole tree?</p>
        <p style={{ marginTop: '0.5rem' }}>It doesn't, because of Case B. When <code>AuthProvider</code> updates its own state, only the providers above it might be involved (if they cascade down to it), and only <code>useContext(AuthContext)</code> consumers re-render. The rest of the tree below — passed through as <code>children</code> — is untouched.</p>
      </InfoBox>

      <CodeBlock language="text" title="A deep provider stack — what actually re-renders">
{`<App>
  <ConfigProvider>          ← state: app config (loaded once)
    <AuthProvider>          ← state: user (changes on login)
      <ThemeProvider>       ← state: theme ("dark" / "light")
        <LocaleProvider>    ← state: locale (rarely changes)
          <AppRoot />        ← the actual app
        </LocaleProvider>
      </ThemeProvider>
    </AuthProvider>
  </ConfigProvider>
</App>

User clicks "Toggle Theme":
  └─ ThemeProvider's own state changes (Case B)
  └─ ThemeProvider re-runs its function
  └─ children prop is unchanged → LocaleProvider/AppRoot subtree is NOT re-rendered
  └─ Only useContext(ThemeContext) consumers re-render
  └─ ConfigProvider, AuthProvider above are untouched
  └─ Total: 1 provider + N theme consumers re-render`}
      </CodeBlock>

      <InfoBox variant="warning" title="The catch — when Case B turns into Case A">
        <p>The children-as-prop optimization only holds when the children reference is <strong>actually stable</strong>. If your parent re-renders (Case A), it produces new JSX, which produces a new children reference, which means the cascade runs through the whole tree below.</p>
        <p style={{ marginTop: '0.5rem' }}>This is why memoizing the provider's <code>value</code> matters most when the <strong>provider's parent</strong> re-renders for unrelated reasons. If your provider's parent is also stable, the provider's own state changes only touch its direct consumers.</p>
      </InfoBox>

      <FlowChart
        title="Decision Tree: What Re-renders When a Provider Re-renders"
        chart={"graph TD\n  Start[Provider re-renders] --> Q1{Did the parent re-render?}\n  Q1 -->|Yes - Case A| Cascade[children is a new reference]\n  Cascade --> CascadeResult[Whole subtree re-renders<br/>PLUS useContext consumers re-render]\n  Q1 -->|No - Case B| Stable[children reference unchanged]\n  Stable --> StableResult[Subtree is NOT re-rendered<br/>ONLY useContext consumers re-render]\n  style CascadeResult fill:#d32f2f,color:#fff\n  style StableResult fill:#388e3c,color:#fff\n  style Cascade fill:#7b1fa2,color:#fff\n  style Stable fill:#1976d2,color:#fff"}
      />

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: Is the wrapper hook pattern worth the boilerplate (and does it hold up without TypeScript)?</h3>

      <InfoBox variant="info" title="Short Answer: Yes — 4 of the 5 reasons still apply in plain JS, and the one that drops out is replaced by something stronger">
        <p>You'll see this pattern in nearly every well-typed React codebase:</p>
      </InfoBox>

      <CodeBlock language="jsx" title="The Pattern" showLineNumbers>
{`export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};`}
      </CodeBlock>

      <p>Three lines of guard around a built-in hook. Why is this the standard?</p>

      <h4>The five reasons the wrapper exists</h4>

      <CodeBlock language="text" title="Why the wrapper hook earns its keep">
{`1. TYPE NARROWING ('T | undefined' → 'T')
   Context type is 'T | undefined' so misuse is caught. The wrapper
   does the null-check once and returns the narrowed 'T' to every
   call site — no per-call-site null checks needed.

2. LOUD FAILURES INSTEAD OF SILENT BUGS
   If you used a fake default ({} or null with real types), consumers
   outside the provider read dummy data silently. The throw turns
   misuse into an immediate, clear error pointing at the exact fix.

3. ENCAPSULATION — REFACTOR INTERNALS FREELY
   Consumers only know about useSettings(). Swap the implementation
   (different context, Zustand store, fetched config) — every caller
   keeps working. The context object stays a private detail.

4. SINGLE IMPORT FOR CONSUMERS
   import { useSettings } from '...'  instead of
   import { useContext } from 'react' + import { SettingsContext } from '...'
   Less ceremony per call site; self-documenting.

5. NATURAL SEAM FOR CROSS-CUTTING LOGIC
   A clean place to add dev warnings, telemetry, selector overloads,
   or read-only freezing — without scattering it across every
   useContext call.`}
      </CodeBlock>

      <h4>What changes when you drop TypeScript</h4>

      <CodeBlock language="text" title="JS vs TS — which reasons survive?">
{`Reason                              | With TS  | Without TS
─────────────────────────────────── | ──────── | ────────────────────────
1. Type narrowing                   | ✅       | ❌ no types, no narrowing
2. Loud failures vs silent bugs     | ✅       | ✅ STRONGER (only safety net)
3. Encapsulation                    | ✅       | ✅ design pattern, language-agnostic
4. Single import                    | ✅       | ✅ convenience benefit
5. Cross-cutting logic seam         | ✅       | ✅ architectural value

Score: 5/5 with TS  →  4/5 without TS
But #2 carries more weight in JS than it does in TS.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why 'loud failures' is the big one in plain JS">
        <p>With TypeScript, misuse (rendering a consumer outside the provider) is often caught at compile time — TS yells about the possibly-undefined context. You fix it before shipping.</p>
        <p style={{ marginTop: '0.5rem' }}>Without TypeScript, the misuse only manifests at runtime. <em>What kind</em> of runtime error you get depends entirely on your provider design:</p>
      </InfoBox>

      <CodeBlock language="js" title="JS: misuse with vs without the wrapper hook" showLineNumbers>
{`// ❌ Without the wrapper hook
const { apiUrl } = useContext(SettingsContext);
//
// Best case:  TypeError: Cannot destructure property 'apiUrl' of undefined
//             — cryptic, points at the destructure not the missing provider.
//
// Worst case (if you used a fake default like createContext({})):
//             apiUrl is undefined or "".
//             Component renders empty silently.
//             Bug ships. QA finds it three sprints later.

// ✅ With the wrapper hook
const { apiUrl } = useSettings();
//
// Misuse path: Error: useSettings must be used within a SettingsProvider
//             — exact problem, exact fix, at the exact call site.`}
      </CodeBlock>

      <h4>One tweak for plain JS: default to <code>null</code>, not <code>undefined</code></h4>

      <p>In TypeScript the convention is <code>{'createContext<T | undefined>(undefined)'}</code> because the generic type is what forces consumers to null-check. In plain JS there's no generic, so the convention shifts slightly — <code>null</code> reads more naturally as "explicitly no value" in JS:</p>

      <CodeBlock language="js" title="Plain JS — the same pattern, idiomatic defaults" showLineNumbers>
{`// SettingsContext.js
import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext(null);   // null, not undefined, in JS

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(/* ... */);
  return (
    <SettingsContext.Provider value={{ config, setConfig }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}

// Note: SettingsContext is NOT exported.
// useSettings() is the ONLY public API.
// '!ctx' catches both null and undefined.`}
      </CodeBlock>

      <InfoBox variant="note" title="When you can skip the wrapper (even in JS)">
        <ul>
          <li><strong>Truly safe static defaults.</strong> If <code>createContext('light')</code> is the theme and your provider is <em>always</em> at the root, undefined literally can't happen by design. The null-check is dead weight. (But: this is rare. Most contexts have setup phases where undefined IS possible.)</li>
          <li><strong>Throwaway prototypes / single-file demos.</strong> If you're going to delete the code in a week, the indirection costs more than it saves.</li>
          <li><strong>A "hook" that adds zero value.</strong> <code>{'export const useThing = () => useContext(ThingContext)'}</code> with no guard, no narrowing, no encapsulation — that's pure noise. The wrapper earns its keep only when it does something the raw <code>useContext</code> call doesn't.</li>
        </ul>
      </InfoBox>

      <InfoBox variant="success" title="The bottom line">
        <p>The wrapper hook isn't a TypeScript pattern that happens to work in JS — it's a <strong>React design pattern</strong> that composes really well with TypeScript when you have it. Use it in any non-trivial app, language regardless. In plain JS the <code>if (!context) throw</code> is doing more work than it does in TS, because it's the only thing standing between you and silent misuse.</p>
      </InfoBox>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />
      <h3>💡 Deep Dive: What does "must be used within a Provider" actually mean?</h3>

      <InfoBox variant="info" title="Short Answer: The Provider must be MOUNTED as an ancestor in the React tree at the time the hook is called">
        <p>Importing the Provider isn't enough. Defining it isn't enough. It has to be <strong>actually rendered</strong> somewhere above the component that calls the hook — and still mounted when that hook runs. Context lives in the runtime fiber tree, not in the module graph.</p>
      </InfoBox>

      <CodeBlock language="text" title="How useContext actually finds a value">
{`When a component calls useContext(SomeContext), React walks UP
the rendered fiber tree from that component, looking for the
nearest <SomeContext.Provider> ancestor:

  Root
   ├─ <SomeContext.Provider value={X}>     ← React finds this
   │    └─ <Layout>
   │         └─ <Page>
   │              └─ <Widget>              ← calls useContext(SomeContext)
   │                                          gets X (from the Provider above)

If no Provider is found anywhere in the ancestry, React falls back
to the DEFAULT value — the argument you passed to createContext():

  createContext<T | undefined>(undefined)
  //                           ^^^^^^^^^
  //                           returned when no Provider is in scope`}
      </CodeBlock>

      <p>This is why the throwing wrapper hook works: the context's default is <code>undefined</code>, so if the consumer is outside the Provider's subtree, <code>useContext</code> returns <code>undefined</code>, the guard fires, and the error message lands at the exact misuse site.</p>

      <h4>What "rendered above" actually requires</h4>

      <CodeBlock language="text" title="Three conditions for the hook to find a value">
{`1. The Provider component must be RENDERED.
   Importing it does nothing. Just defining <ViewerProvider> in
   a file does nothing. It has to appear in JSX that React actually
   evaluates.

2. As an ANCESTOR in the fiber tree.
   The consumer must be inside the Provider's children (directly or
   transitively). Siblings can't see each other's contexts.

3. STILL MOUNTED at the time the hook is called.
   If the Provider unmounts and remounts (e.g., behind a conditional),
   its internal useState is gone. Consumers below see fresh state
   from the new mount.`}
      </CodeBlock>

      <h4>The standard pattern: mount providers at the root</h4>

      <CodeBlock language="jsx" title="Why the app shell wraps everything in providers" showLineNumbers>
{`// AppShell.jsx — the place where every cross-cutting context is mounted
function AppShell({ children }) {
  return (
    <ConfigProvider>
      <ViewerProvider>
        <ThemeProvider>
          <LocaleProvider>
            <NotificationProvider>
              {children}    {/* every route / page / component below */}
            </NotificationProvider>
          </LocaleProvider>
        </ThemeProvider>
      </ViewerProvider>
    </ConfigProvider>
  );
}

// main.jsx
ReactDOM.createRoot(root).render(
  <AppShell>
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings"  element={<Settings />} />
      </Routes>
    </Router>
  </AppShell>
);

// Dashboard.jsx — anywhere below
function Dashboard() {
  const { viewer } = useViewer();    // ✅ works — ViewerProvider is mounted above
  const { theme } = useTheme();      // ✅ works
  const { settings } = useSettings(); // ✅ works
  return <h1>Hello {viewer.name}</h1>;
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Why this is the standard">
        <p>Putting every cross-cutting Provider at or near the root means:</p>
        <ul style={{ marginTop: '0.5rem' }}>
          <li>Every route / page / component is automatically a descendant — no per-feature re-wrapping needed.</li>
          <li>Providers stay mounted for the app's lifetime, so their state survives navigation.</li>
          <li>Adding a new context is a one-line change in one file, available everywhere instantly.</li>
        </ul>
        <p style={{ marginTop: '0.5rem' }}>The trade-off is the deep nesting you see in real apps — 15+ providers wrapping the root isn't unusual. That looks scary but is actually fine (see the deep dive on "When a provider re-renders, do its children re-render?" above — most provider state changes don't cascade).</p>
      </InfoBox>

      <h4>Practical consequences</h4>

      <InfoBox variant="warning" title="Tests need the wrapper too">
        <p>When you unit-test a component that calls <code>useViewer()</code>, your test render must also wrap the component in a Provider — or the hook throws because nothing is mounted above it in the test tree:</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Testing — wrap in the Provider (or a test-specific mock)" showLineNumbers>
{`// ❌ Throws: useViewer must be used within a ViewerProvider
render(<Dashboard />);

// ✅ Real provider — works but does real fetches, slow & flaky
render(
  <ViewerProvider>
    <Dashboard />
  </ViewerProvider>
);

// ✅ BETTER: test-specific provider with controlled state
function TestViewerProvider({ user, children }) {
  const value = useMemo(() => ({ user, login: jest.fn(), logout: jest.fn() }), [user]);
  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

render(
  <TestViewerProvider user={{ name: 'Alice', id: 1 }}>
    <Dashboard />
  </TestViewerProvider>
);

// Note: this requires the context object to be exported (or a test helper from the
// provider's file), which slightly breaks encapsulation. Some codebases export an
// 'export const __TEST_ONLY_ViewerContext = ViewerContext' to make the boundary explicit.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Portals stay in context scope">
        <p>A common confusion: React portals (e.g., a <code>{'<Modal>'}</code> rendered to <code>document.body</code> via <code>createPortal</code>) <strong>still inherit context</strong> from their React-tree parent, not their DOM parent. So a modal portal can call <code>useViewer()</code> as long as the <code>{'<Modal>'}</code> component itself is rendered inside a <code>ViewerProvider</code> in the React tree — even though the modal's DOM lives outside the app root.</p>
        <p style={{ marginTop: '0.5rem' }}>This is one of the rare cases where React's tree and the DOM's tree diverge — and React explicitly preserves context inheritance across that boundary.</p>
      </InfoBox>

      <InfoBox variant="danger" title="Watch out: unmounting the Provider blows away its state">
        <p>If the Provider unmounts (because something above it conditionally rendered it out), its <code>useState</code> is gone. When it remounts, consumers below see fresh state — login status reset, cached data lost, etc.</p>
        <p style={{ marginTop: '0.5rem' }}>This is rarely what you want, which is why Providers usually live at the app root where they stay mounted for the app's lifetime. Don't accidentally put a Provider inside a route or conditional render unless you intend the state to reset.</p>
      </InfoBox>

      <CodeBlock language="text" title="A subtle gotcha — Provider inside a conditional">
{`// ❌ Anti-pattern: provider inside conditional rendering
function App() {
  const [showFeature, setShowFeature] = useState(false);
  return (
    <>
      <button onClick={() => setShowFeature(s => !s)}>Toggle</button>
      {showFeature && (
        <ViewerProvider>     ← Provider mounts/unmounts with the toggle
          <FeaturePanel />
        </ViewerProvider>
      )}
    </>
  );
}

// Every toggle:
//   showFeature: true → ViewerProvider mounts, state initialized
//   showFeature: false → unmounts, state lost
//   showFeature: true again → FRESH mount, FRESH state

// If FeaturePanel had a logged-in user before, that's gone now.

// ✅ Mount the Provider once, ABOVE the conditional
function App() {
  const [showFeature, setShowFeature] = useState(false);
  return (
    <ViewerProvider>     ← stays mounted always
      <button onClick={() => setShowFeature(s => !s)}>Toggle</button>
      {showFeature && <FeaturePanel />}
    </ViewerProvider>
  );
}`}
      </CodeBlock>

      <InfoBox variant="success" title="The mental model">
        <p><code>createContext()</code> creates an empty "channel." <code>{'<SomeContext.Provider value={...}>'}</code> publishes a value on that channel for everything rendered inside it. <code>useContext(SomeContext)</code> subscribes to the channel and returns whatever the nearest enclosing Provider published.</p>
        <p style={{ marginTop: '0.5rem' }}>No Provider above = no one publishing = default value (which is usually <code>undefined</code>, which makes the wrapper hook throw).</p>
      </InfoBox>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />

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
