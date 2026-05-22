import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactEffects() {
  return (
    <LessonLayout
      title="Side Effects & useEffect"
      sectionId="react19"
      lessonIndex={4}
      prev={{ path: "/react19/state", label: "State Management" }}
      next={{ path: "/react19/context", label: "Context API" }}
    >
      <p>useEffect is the primary hook for side effects — data fetching, subscriptions, timers, and DOM manipulation. Understanding its dependency array and cleanup is critical.</p>

      <h2>useEffect Anatomy</h2>
      <CodeBlock language="jsx" title="Effect Dependency Patterns">
{`// Run once on mount (empty deps)
useEffect(() => {
    document.title = "App Loaded";
}, []); // [] = run once

// Run on every render (no deps array — rare, usually a mistake)
useEffect(() => {
    console.log("rendered");
}); // no array

// Run when specific deps change
useEffect(() => {
    setFilteredItems(items.filter(i => i.category === category));
}, [items, category]); // re-run when items or category changes

// Cleanup — runs before next effect and on unmount
useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id); // cleanup: stop timer
}, []);

// Async data fetch with cleanup
useEffect(() => {
    const controller = new AbortController();
    fetch("/api/users", { signal: controller.signal })
        .then(r => r.json())
        .then(setUsers)
        .catch(err => { if (err.name !== "AbortError") setError(err); });
    return () => controller.abort(); // cancel fetch on cleanup
}, []);`}
      </CodeBlock>

      <h2>Common Effect Patterns</h2>
      <CodeBlock language="jsx" title="Data Fetching Hook">
{`// Custom hook for data fetching
function useFetch(url) {
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch(url)
            .then(r => r.ok ? r.json() : Promise.reject(new Error(r.statusText)))
            .then(data => { if (!cancelled) { setData(data); setLoading(false); } })
            .catch(err => { if (!cancelled) { setError(err); setLoading(false); } });

        return () => { cancelled = true; };
    }, [url]);

    return { data, loading, error };
}

// Usage
function UserProfile({ userId }) {
    const { data: user, loading, error } = useFetch("/api/users/" + userId);
    if (loading) return <Spinner />;
    if (error)   return <Error message={error.message} />;
    return <div>{user.name}</div>;
}`}
      </CodeBlock>

      <h2>Effect Pitfalls</h2>
      <CodeBlock language="jsx" title="Common Mistakes">
{`// MISTAKE: infinite loop — effect updates state that is in its deps
useEffect(() => {
    setCount(count + 1); // updates count → triggers effect → updates count...
}, [count]);

// FIX: use functional update
useEffect(() => {
    setCount(c => c + 1); // count not needed in deps
}, []);

// MISTAKE: missing dependency
function Component({ onUpdate }) {
    useEffect(() => {
        onUpdate(); // uses onUpdate but it is not in deps!
    }, []); // stale closure — will use initial onUpdate forever
}

// FIX: include it in deps, or wrap onUpdate in useCallback
useEffect(() => { onUpdate(); }, [onUpdate]);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Object/Function Dependencies">
        <p>Objects and functions are created anew on every render, so including them in deps causes infinite loops. Wrap objects in useMemo and functions in useCallback, or move them inside the effect if they are not needed elsewhere.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What should you do when a useEffect makes an async request that might complete after the component unmounts?"
        options={["Nothing — React handles it automatically", "Use useLayoutEffect instead", "Return a cleanup function that cancels or ignores the stale response", "Store the result in a ref instead of state"]}
        correctIndex={2}
        explanation="Return a cleanup function that either cancels the request (AbortController for fetch) or uses a cancelled flag to guard against calling setState on an unmounted component. Without this, you get the 'Can not update state on an unmounted component' warning and potential bugs."
      />
    </LessonLayout>
  );
}
