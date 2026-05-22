import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AntiPatternsEffects() {
  return (
    <LessonLayout
      title="Effects Anti-Patterns"
      sectionId="react-antipatterns"
      lessonIndex={2}
      prev={{ path: "/react-antipatterns/state", label: "State Anti-Patterns" }}
      next={{ path: "/react-antipatterns/performance", label: "Performance Anti-Patterns" }}
    >
      <p>useEffect is one of the most misused hooks. The rule of thumb: <strong>useEffect synchronizes your component with an external system</strong>. If there is no external system (network, browser API, subscription), you probably don't need useEffect.</p>

      <h2>Anti-Pattern 1: Fetching Without Cleanup</h2>

      <CodeBlock language="jsx" title="Race Condition in Data Fetching">
{`// ANTI-PATTERN: No cleanup — race condition when props change fast
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/users/' + userId)
      .then(r => r.json())
      .then(data => setUser(data));  // may arrive after component unmounts!
  }, [userId]);

  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}

// CORRECT: Cancel stale requests with AbortController
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch('/api/users/' + userId, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data => { setUser(data); setLoading(false); })
      .catch(err => {
        if (err.name !== 'AbortError') {  // ignore expected cancellation
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();  // cancel on userId change or unmount
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error)   return <div>Error: {error}</div>;
  return <div>{user?.name}</div>;
}`}
      </CodeBlock>

      <h2>Anti-Pattern 2: Effects for Event Handlers</h2>

      <CodeBlock language="jsx" title="Effect Used Where an Event Handler Belongs">
{`// ANTI-PATTERN: useEffect reacting to state that was just set by a user action
function Form() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({});

  // This runs after EVERY render where submitted is true
  useEffect(() => {
    if (submitted) {
      submitToApi(formData);
      setSubmitted(false);
    }
  }, [submitted, formData]);

  return <button onClick={() => setSubmitted(true)}>Submit</button>;
}

// CORRECT: Put the logic in the event handler directly
function Form() {
  const [formData, setFormData] = useState({});

  const handleSubmit = async () => {
    try {
      await submitToApi(formData);
      toast.success('Submitted!');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return <button onClick={handleSubmit}>Submit</button>;
}`}
      </CodeBlock>

      <h2>Anti-Pattern 3: Missing Dependencies</h2>

      <CodeBlock language="jsx" title="Stale Closure — Missing Deps">
{`// ANTI-PATTERN: Suppressing eslint-plugin-react-hooks warnings
function Timer({ onTick }) {
  useEffect(() => {
    const id = setInterval(() => {
      onTick();  // stale closure! onTick captured at mount, never updated
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line  ← this is the red flag
}

// CORRECT option 1: Add dep (safe if onTick is stable via useCallback)
useEffect(() => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}, [onTick]);

// CORRECT option 2: useRef to hold latest callback without re-running effect
function Timer({ onTick }) {
  const onTickRef = useRef(onTick);
  useLayoutEffect(() => { onTickRef.current = onTick; });  // sync before effect

  useEffect(() => {
    const id = setInterval(() => onTickRef.current(), 1000);
    return () => clearInterval(id);
  }, []);  // empty deps is OK now — we read the latest ref, not a closure
}`}
      </CodeBlock>

      <FlowChart
        title="useEffect Decision Tree"
        chart={"graph TD\n  A[Need useEffect?] --> B{External system?}\n  B -- No --> C{Deriving data?}\n  C -- Yes --> D[useMemo / compute inline]\n  C -- No --> E{Reacting to user event?}\n  E -- Yes --> F[Put in event handler]\n  E -- No --> G[Probably no effect needed]\n  B -- Yes --> H[useEffect with cleanup]"}
      />

      <InfoBox variant="tip" title="React Query / SWR">
        <p>For data fetching, use React Query or SWR instead of raw useEffect. They handle loading states, error states, caching, deduplication, and race conditions automatically. The pattern of useEffect + useState for data fetching has enough footguns that the community has essentially standardized on dedicated libraries.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the purpose of returning a cleanup function from useEffect?"
        options={["To run code before the component first mounts", "To cancel/cleanup subscriptions, timers, or requests when deps change or component unmounts", "To prevent the effect from running on the initial render", "To memoize the effect's return value"]}
        correctIndex={1}
        explanation="The cleanup function returned from useEffect runs before the effect re-runs (when dependencies change) and when the component unmounts. This prevents memory leaks, stale event listeners, and race conditions by cancelling outstanding work when it's no longer needed."
      />

    </LessonLayout>
  );
}
