import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactCState() {
  return (
    <LessonLayout
      title="State Management Cheat Sheet"
      sectionId="react-cheatsheet"
      lessonIndex={2}
      prev={{ path: "/react-cheatsheet/patterns", label: "React Patterns Cheat Sheet" }}
      next={{ path: "/react-cheatsheet/styling", label: "Styling Cheat Sheet" }}
    >
      <p>Quick reference comparing state management approaches: local state, Context, Zustand, and when to use each.</p>

      <CodeBlock language="jsx" title="State Management Decision Guide">
{`// === LOCAL STATE (useState) ===
// Use for: UI state, form inputs, toggles, local data
// Scope: single component
const [isOpen, setIsOpen] = useState(false);
const [count, setCount]   = useState(0);
const [form, setForm]     = useState({ name: '', email: '' });

// === REDUCER (useReducer) ===
// Use for: complex state with multiple sub-values, explicit transitions
// Scope: single component (or passed via context)
const [state, dispatch] = useReducer((state, action) => {
  switch (action.type) {
    case 'INCREMENT': return { ...state, count: state.count + 1 };
    case 'SET_USER':  return { ...state, user: action.user, loading: false };
    case 'ERROR':     return { ...state, error: action.error, loading: false };
    default: return state;
  }
}, { count: 0, user: null, loading: true, error: null });

// === CONTEXT (useContext) ===
// Use for: theme, locale, auth user — truly global, infrequently updated
// Scope: component subtree
const ThemeContext = createContext('light');
function App() {
  const [theme, setTheme] = useState('light');
  return <ThemeContext.Provider value={{ theme, setTheme }}><Routes /></ThemeContext.Provider>;
}
function Button() {
  const { theme } = useContext(ThemeContext); // no prop drilling
  return <button className={theme}>Click</button>;
}

// === ZUSTAND (recommended for app state) ===
// Use for: shared state between distant components, server data cache
import { create } from 'zustand';
const useStore = create((set, get) => ({
  user: null,
  cart: [],
  setUser: (user) => set({ user }),
  addToCart: (item) => set(state => ({ cart: [...state.cart, item] })),
  removeFromCart: (id) => set(state => ({ cart: state.cart.filter(i => i.id !== id) })),
  cartTotal: () => get().cart.reduce((sum, i) => sum + i.price, 0),
}));
// Usage: const { user, setUser } = useStore(); — no Provider needed!

// === REACT QUERY (server state) ===
// Use for: API data — handles caching, refetching, loading/error states
const { data, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetch('/api/users/' + userId).then(r => r.json()),
  staleTime: 5 * 60 * 1000,
});`}
      </CodeBlock>

      <FlowChart
        title="State Management Decision"
        chart={"graph TD\n  A[Where is this state needed?] --> B{Only one component?}\n  B -- Yes --> C[useState or useReducer]\n  B -- No --> D{Server data?}\n  D -- Yes --> E[React Query or SWR]\n  D -- No --> F{Whole app needs it?}\n  F -- Yes --> G{Updates frequently?}\n  G -- Yes --> H[Zustand]\n  G -- No --> I[Context]\n  F -- No --> J[Lift state to common parent]"}
      />

      <InteractiveChallenge
        question="What type of state is React Query / SWR designed to manage?"
        options={["UI state like form inputs and toggles", "Server state — remote data that needs caching, synchronization, and background updates", "Browser storage state", "Animation state"]}
        correctIndex={1}
        explanation="React Query and SWR manage server state — data that lives on a remote server. They handle the complex lifecycle: fetching, caching, deduplicating, background refetching, and invalidation. This is fundamentally different from client state (owned by your app) and frees you from writing dozens of useEffect+useState patterns."
      />

    </LessonLayout>
  );
}
