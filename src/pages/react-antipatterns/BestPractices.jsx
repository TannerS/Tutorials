import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AntiPatternsBest() {
  return (
    <LessonLayout
      title="React Best Practices"
      sectionId="react-antipatterns"
      lessonIndex={5}
      prev={{ path: "/react-antipatterns/components", label: "Component Anti-Patterns" }}
      next={{ path: "/microservices/intro", label: "Microservices Intro" }}
    >
      <p>Having covered the anti-patterns, here are the positive best practices that prevent them. These are the habits that distinguish senior React developers: correct state modeling, clean effect usage, smart performance optimization, and composable component design.</p>

      <h2>State Best Practices</h2>

      <CodeBlock language="jsx" title="State Rules of Thumb">
{`// 1. Minimize state — if derivable, don't store it
const [items, setItems] = useState([]);
const [filter, setFilter] = useState('all');
// ✓ Derived — computed during render, not stored
const filtered = useMemo(
  () => filter === 'all' ? items : items.filter(i => i.status === filter),
  [items, filter]
);

// 2. Co-locate state — keep state close to where it's used
function SearchBox() {
  const [query, setQuery] = useState('');  // only SearchBox needs this
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
// Don't lift to a parent that doesn't need it

// 3. Group related state with useReducer
const [state, dispatch] = useReducer(formReducer, {
  name: '', email: '', password: '', errors: {}, isSubmitting: false
});
// All form state in one place — transitions are explicit and testable

// 4. Use URL state for shareable/bookmarkable data
const [searchParams, setSearchParams] = useSearchParams();
const query = searchParams.get('q') ?? '';
// Refresh page → state preserved in URL`}
      </CodeBlock>

      <h2>Effect Best Practices</h2>

      <CodeBlock language="jsx" title="Effect Patterns That Work">
{`// 1. Custom hooks abstract effects
function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch('/api/users/' + userId, { signal: controller.signal })
      .then(r => r.json())
      .then(user => { setUser(user); setLoading(false); })
      .catch(err => { if (err.name !== 'AbortError') setError(err); });
    return () => controller.abort();
  }, [userId]);

  return { user, loading, error };
}

// 2. React Query instead of raw effects
import { useQuery } from '@tanstack/react-query';
function UserProfile({ userId }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch('/api/users/' + userId).then(r => r.json()),
    staleTime: 5 * 60 * 1000,  // cache for 5 minutes
  });
  if (isLoading) return <Skeleton />;
  if (error)     return <ErrorBoundary error={error} />;
  return <div>{user.name}</div>;
}

// 3. Separate effects for separate concerns
useEffect(() => { document.title = title; }, [title]);          // title sync
useEffect(() => { analytics.track('page_view', path); }, [path]); // analytics`}
      </CodeBlock>

      <h2>Component Best Practices</h2>

      <CodeBlock language="jsx" title="Composable Component Patterns">
{`// 1. Compound components for related UI
function Tabs({ children, defaultTab }) {
  const [active, setActive] = useState(defaultTab);
  return <TabContext.Provider value={{ active, setActive }}>{children}</TabContext.Provider>;
}
Tabs.Tab    = function Tab({ id, children }) { ... };
Tabs.Panel  = function Panel({ id, children }) { ... };

// Usage — reads like English, fully composable
<Tabs defaultTab="profile">
  <Tabs.Tab id="profile">Profile</Tabs.Tab>
  <Tabs.Tab id="settings">Settings</Tabs.Tab>
  <Tabs.Panel id="profile"><ProfileForm /></Tabs.Panel>
  <Tabs.Panel id="settings"><SettingsForm /></Tabs.Panel>
</Tabs>

// 2. Prefer composition over configuration
// BAD: one component with 15 boolean props
<Modal showHeader showFooter showCloseButton showOverlay centerContent>

// GOOD: compose the pieces you need
<Modal>
  <Modal.Header>Title <Modal.CloseButton /></Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer><Button>Save</Button></Modal.Footer>
</Modal>

// 3. Forward refs for reusable inputs
const TextInput = React.forwardRef(({ label, error, ...props }, ref) => (
  <label>
    {label}
    <input ref={ref} {...props} className={error ? 'error' : ''} />
    {error && <span className="error-msg">{error}</span>}
  </label>
));`}
      </CodeBlock>

      <FlowChart
        title="React Best Practices Summary"
        chart={"graph TD\n  A[React Best Practices] --> B[State]\n  A --> C[Effects]\n  A --> D[Components]\n  A --> E[Performance]\n  B --> F[Minimize and co-locate]\n  C --> G[Custom hooks + React Query]\n  D --> H[Single responsibility]\n  E --> I[Profile before optimizing]"}
      />

      <InfoBox variant="tip" title="The Senior Dev Checklist">
        <p>Before code review: (1) Can every piece of state be justified? (2) Does every useEffect have cleanup if needed? (3) Is every memoization measured, not assumed? (4) Can each component be described in one sentence without "and"? (5) Are stable IDs used as keys? If yes to all five, you have clean React code.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the recommended modern alternative to useEffect for data fetching?"
        options={["useFetch hook built into React 19", "React Query or SWR — dedicated data-fetching libraries", "Suspense with fetch() calls in render", "Redux RTK Query only"]}
        correctIndex={1}
        explanation="React Query and SWR handle caching, loading states, error states, deduplication, background refetching, and race conditions automatically. They turn data fetching from a 30-line useEffect pattern into a 5-line hook call with significantly better UX."
      />

    </LessonLayout>
  );
}
