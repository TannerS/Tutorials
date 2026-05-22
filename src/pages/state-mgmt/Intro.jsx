import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SMIntro() {
  return (
    <LessonLayout
      title="State Management Introduction"
      sectionId="state-mgmt"
      lessonIndex={0}
      prev={null}
      next={{ path: '/state-mgmt/redux', label: 'Redux Toolkit' }}
    >
      <h2>The Four Categories of State</h2>
      <p>
        Not all state is the same. The biggest mistake in React apps is using the wrong tool for
        the wrong type of state. Before reaching for Redux or Zustand, ask: what kind of state
        is this?
      </p>

      <FlowChart
        title="State Decision Flowchart"
        chart={"graph TD\n  A[I need state] --> B{Is it server data?}\n  B -- Yes --> C[React Query or SWR]\n  B -- No --> D{Shared across many components?}\n  D -- No --> E[useState or useReducer]\n  D -- Yes --> F{Large app with complex logic?}\n  F -- No --> G[Zustand or Context]\n  F -- Yes --> H[Redux Toolkit]\n  E --> I[Co-locate near usage]\n  G --> J[Small shared store]"}
      />

      <CodeBlock language="jsx" title="The Four State Categories">
{`// ===== 1. LOCAL STATE — UI interactions, temporary values =====
// Lives in a single component, not shared
// Tool: useState, useReducer
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);    // UI state
  const [inputValue, setInputValue] = useState(''); // form state
  // ...
}

// ===== 2. SERVER STATE — data from APIs =====
// Lives on the server, cached locally, needs sync/refresh
// Tool: React Query (TanStack Query) or SWR — NOT useState + useEffect
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch('/api/users/' + userId).then(r => r.json()),
    staleTime: 5 * 60 * 1000,    // treat as fresh for 5 minutes
    gcTime: 10 * 60 * 1000,      // garbage collect after 10 minutes
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage />;
  return <div>{user.name}</div>;
}

// ===== 3. GLOBAL CLIENT STATE — auth, preferences, cart =====
// Client-only, shared across many components, rarely changes
// Tool: Zustand (lightweight) or Redux Toolkit (complex/large apps)
const useStore = create((set) => ({
  user: null,
  theme: 'dark',
  setUser: (user) => set({ user }),
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
}));

// ===== 4. URL STATE — filters, pagination, tabs =====
// Lives in the URL — bookmarkable, shareable, browser back works
// Tool: useSearchParams (React Router), nuqs (Next.js)
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1');
  const query = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';

  return (
    <input
      value={query}
      onChange={e => setSearchParams(p => {
        p.set('q', e.target.value);
        p.set('page', '1'); // reset page on search
        return p;
      })}
    />
  );
}`}
      </CodeBlock>

      <h2>The Server State Problem</h2>
      <p>
        The #1 mistake in React is using <code>useState + useEffect</code> to manage server data.
        React Query handles caching, deduplication, background refetch, loading/error states, and
        cache invalidation — all the things you'd have to build yourself.
      </p>

      <CodeBlock language="jsx" title="useState+useEffect vs React Query">
{`// ❌ THE WRONG WAY — manual server state management
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  // Problems:
  // - No caching: refetches every mount (even seconds apart)
  // - No deduplication: 5 components mount simultaneously = 5 API calls
  // - No background updates: data goes stale
  // - Race conditions: fast navigation can show wrong data
  // - Manual loading/error state: repetitive boilerplate
}

// ✅ THE RIGHT WAY — React Query
function UserList() {
  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  });

  // Benefits:
  // ✓ Auto-caching: same key = same cache entry, no duplicate calls
  // ✓ Background refetch: keeps data fresh silently
  // ✓ Loading/error states: built in
  // ✓ DevTools: inspect and invalidate cache
  // ✓ Optimistic updates: update UI before server confirms
  // ✓ Infinite scroll, pagination: built-in utilities
}

// Mutations (POST/PUT/DELETE) with cache invalidation:
function CreateUser() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (newUser) => fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // ↑ Forces all useQuery(['users']) to refetch
    },
  });
  return <button onClick={() => mutation.mutate({ name: 'Alice' })}>Add User</button>;
}`}
      </CodeBlock>

      <h2>When to Reach for Global State</h2>

      <CodeBlock language="jsx" title="Context + useReducer Pattern">
{`// Context is fine for low-frequency global state (theme, auth, locale)
// Problems start when: deeply nested components must subscribe,
// any state change re-renders everything subscribed to the context

// ✅ Context is RIGHT for:
const ThemeContext = createContext('light');
function App() {
  const [theme, setTheme] = useState('dark');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Layout />
    </ThemeContext.Provider>
  );
}
// Theme rarely changes → minimal re-renders → Context is fine

// ❌ Context is WRONG for:
// - High-frequency updates (mouse position, scroll, timers)
// - Large state objects where parts update independently
// - State shared by many distant components that need independent subscriptions

// Context performance tip: split by update frequency
const ThemeContext = createContext();     // changes rarely
const AuthContext = createContext();     // changes on login/logout
const NotifContext = createContext();    // changes frequently

// This way a theme change doesn't re-render auth consumers

// ✅ Zustand solves the subscription problem:
// Components subscribe to individual slices
// Only re-renders if the subscribed value changes
const useUser = () => useStore(state => state.user);    // subscribes to user only
const useTheme = () => useStore(state => state.theme);  // subscribes to theme only
// Changing user doesn't re-render theme consumers`}
      </CodeBlock>

      <h2>Prop Drilling and When It Becomes a Problem</h2>

      <CodeBlock language="jsx" title="Prop Drilling Analysis">
{`// Prop drilling: passing state through many intermediate components
// FINE for 1-2 levels — don't prematurely add complexity

// OK — 2 levels, easy to follow
function App() {
  const [user, setUser] = useState(null);
  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
function Dashboard({ user, onLogout }) {
  return <Navbar user={user} onLogout={onLogout} />;
}

// ❌ PROBLEM — 5+ levels, intermediate components carry props they don't use
function App() {
  const [user, setUser] = useState(null);
  return <Page1 user={user} />; // Page1 doesn't USE user
}
function Page1({ user }) {       // just passing through
  return <Page2 user={user} />;  // just passing through
}
function Page2({ user }) {       // just passing through
  return <Sidebar user={user} />; // just passing through
}
function Sidebar({ user }) {
  return <Avatar user={user} />; // FINALLY uses it
}

// Solution: Context for tree-local state (auth user is classic example)
const UserContext = createContext(null);
function App() {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Page1 /> {/* no props needed */}
    </UserContext.Provider>
  );
}
function Avatar() {
  const { user } = useContext(UserContext); // reads directly
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="State Colocation — The Most Underused Pattern">
        <p>
          Before adding global state, ask: can I move this state <em>down</em> to the component
          that needs it? State at the highest necessary level is always better than state at a
          global level. If only two sibling components share state, lifting to their common parent
          is cleaner than Zustand. Global state should be a last resort, not a first instinct.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="You have a list of products fetched from an API. Which tool should manage this state?"
        options={[
          "useState with useEffect to fetch on mount",
          "Redux with a products slice and async thunks",
          "React Query (TanStack Query) with useQuery",
          "Zustand with a products store"
        ]}
        correctIndex={2}
        explanation="Products fetched from an API are server state — they live on the server and are cached locally. React Query is purpose-built for this: it handles caching (no duplicate requests), background refetching (stays fresh), loading/error states (no boilerplate), and cache invalidation (after mutations). useState+useEffect doesn't cache or deduplicate. Redux and Zustand are for client state — you'd still need to manage fetching yourself."
      />

      <InteractiveChallenge
        question="A user's search query and current page number should live in what kind of state?"
        options={[
          "Global state in Zustand — so any component can read it",
          "Server state in React Query — since search results come from the server",
          "URL state via useSearchParams — it should be bookmarkable",
          "Local state in useState — it only affects the current component"
        ]}
        correctIndex={2}
        explanation="Search queries and pagination are URL state. Storing them in the URL (/?q=react&page=2) makes the page bookmarkable, shareable, and back/forward navigable. useSearchParams from React Router reads and writes URL parameters. The server state (search results) is managed by React Query keyed on the URL parameters. This separation — URL state for filters, React Query for results — is the correct pattern."
      />
    </LessonLayout>
  );
}
