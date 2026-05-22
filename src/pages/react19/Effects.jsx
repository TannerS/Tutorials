import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Effects() {
  return (
    <LessonLayout
      title="Effects & Data Fetching"
      sectionId="react19"
      lessonIndex={3}
      prev={{ path: '/react19/state', label: 'State Management Patterns' }}
      next={{ path: '/react19/context', label: 'Context & Composition' }}
    >
      <p>Effects are React's escape hatch to synchronize with external systems. They're also the most misunderstood hook. The mental model: effects are for <strong>synchronization</strong>, not for <strong>reacting to events</strong>.</p>

      <h2>The Dependency Array Mental Model</h2>

      <FlowChart
        title="useEffect Dependency Array Behavior"
        chart={"graph TD\n  A[useEffect called] --> B{Dependency array?}\n  B -->|No array| C[Run after EVERY render]\n  B -->|Empty array| D[Run only on mount]\n  B -->|With deps| E[Compare deps with previous]\n  E --> F{Any dep changed? - Object.is}\n  F -->|Yes| G[Run cleanup of previous effect]\n  G --> H[Run new effect]\n  F -->|No| I[Skip effect]\n  D --> J[Run cleanup on unmount only]\n  C --> K[Run cleanup before each re-run]"}
      />

      <InfoBox variant="warning" title="Effects Are Not Event Handlers">
        <p>If something should happen <strong>in response to a user action</strong> (click, submit, navigate), put it in an event handler — not an effect. Effects are for synchronizing with external systems (subscriptions, DOM APIs, timers) based on current state/props.</p>
        <p><strong>Ask:</strong> "Does this need to happen because the component is visible with these props?" → Effect. "Does this need to happen because the user did something?" → Event handler.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Effects vs Event Handlers" showLineNumbers>
{`// BAD: Using effect as event handler proxy
function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) {
      fetch(\`/api/search?q=\${query}\`); // Don't do this!
      setSubmitted(false);
    }
  }, [submitted, query]);

  return <button onClick={() => setSubmitted(true)}>Search</button>;
}

// GOOD: Just call fetch in the event handler
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await fetch(\`/api/search?q=\${query}\`);
    setResults(await res.json());
  };

  return <button onClick={handleSearch}>Search</button>;
}

// GOOD USE OF EFFECT: Sync with external system based on props
function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // Re-sync when room changes
}`}
      </CodeBlock>

      <h2>Race Conditions in Data Fetching</h2>

      <CodeBlock language="jsx" title="Handling Race Conditions" showLineNumbers>
{`// PROBLEM: Fast prop changes cause stale responses
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // If userId changes quickly: request A (slow) then request B (fast)
    // B resolves first, then A resolves and overwrites with stale data!
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(setUser); // BUG: might set data from old userId
  }, [userId]);
}

// SOLUTION 1: Cleanup boolean (simple)
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setUser(data); // Only update if still relevant
      });

    return () => { cancelled = true; }; // Previous effect's cleanup runs first
  }, [userId]);
}

// SOLUTION 2: AbortController (also cancels network request)
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
      .then(r => r.json())
      .then(setUser)
      .catch(err => {
        if (err.name !== 'AbortError') throw err;
      });

    return () => controller.abort();
  }, [userId]);
}

// SOLUTION 3: Use a library (recommended for production)
// TanStack Query handles races, caching, deduplication, retries
function UserProfile({ userId }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(\`/api/users/\${userId}\`).then(r => r.json()),
  });
}`}
      </CodeBlock>

      <h2>Stale Closures — The Most Common Hook Bug</h2>

      <p>A <strong>stale closure</strong> occurs when a callback or effect captures a variable from a previous render and continues using the old value, even though the component has re-rendered with a new value. This is the #1 source of subtle bugs in React hook code.</p>

      <p>Every time React renders your component, it calls your function again. Each call creates a <strong>brand new closure</strong> — a snapshot of all local variables (state, props, handlers) at that moment. If a timer, event listener, or async operation holds a reference to a closure from a <em>previous</em> render, it will see the old values forever.</p>

      <FlowChart
        title="How Stale Closures Form"
        chart={"graph TD\n  A[Render 1: count = 0] --> B[Effect creates closure capturing count = 0]\n  B --> C[setInterval saves this closure]\n  D[Render 2: count = 1] --> E[New closure created with count = 1]\n  E --> F[But setInterval still holds Render 1 closure]\n  F --> G[Interval fires: reads count = 0, sets count to 0 + 1 = 1]\n  G --> H[count never goes past 1 -- stale closure bug]"}
      />

      <InfoBox variant="danger" title="Why This Is So Tricky">
        <p>Stale closure bugs are silent. There is no error, no warning, no crash. Your code runs — it just uses the wrong value. The component <em>looks</em> correct. The logic <em>reads</em> correct. But the closure captured a snapshot from a render that no longer exists.</p>
      </InfoBox>

      <h3>setInterval Stale State</h3>

      <p>The classic stale closure: a counter that should increment every second but gets stuck at 1.</p>

      <CodeBlock language="jsx" title="setInterval Stale Closure Bug and Fix" showLineNumbers>
{`// BUG: count is always 0 inside the interval callback
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // This closure captured count = 0 from the mount render.
      // It will ALWAYS read 0 here, no matter how many renders happen.
      setCount(count + 1); // Always sets count to 0 + 1 = 1
    }, 1000);
    return () => clearInterval(id);
  }, []); // Empty deps: effect only runs on mount

  return <p>Count: {count}</p>; // Stuck at 1 forever
}

// FIX: Use functional update — no dependency on the closed-over value
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // Functional update receives the CURRENT state as an argument.
      // No closure over count needed — React provides the latest value.
      setCount(prev => prev + 1); // Always correct
    }, 1000);
    return () => clearInterval(id);
  }, []); // Safe with empty deps now

  return <p>Count: {count}</p>; // 1, 2, 3, 4, ...
}`}
      </CodeBlock>

      <h3>setTimeout Stale State</h3>

      <p>Click a button 5 times quickly, then wait for the alert. It shows the value from the <em>render when you clicked</em>, not the current value.</p>

      <CodeBlock language="jsx" title="setTimeout Stale Closure Bug and Fix" showLineNumbers>
{`// BUG: Alert shows the stale value from the render when you clicked
function DelayedAlert() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // count is captured HERE at this render's value
    setTimeout(() => {
      alert('Count is: ' + count); // Shows old value!
    }, 3000);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={handleClick}>Show count in 3s</button>
    </div>
  );
  // Click increment 5 times, then "Show count in 3s"
  // Alert says "Count is: 5" — but if you keep clicking, it still says 5
}

// FIX: Use a ref to always read the latest value
function DelayedAlert() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count; // Update ref on every render

  const handleClick = () => {
    setTimeout(() => {
      alert('Count is: ' + countRef.current); // Always latest!
    }, 3000);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={handleClick}>Show count in 3s</button>
    </div>
  );
}`}
      </CodeBlock>

      <h3>Event Handler Stale State</h3>

      <p>When you register an event listener in an effect, the handler captures state from that render. If the effect does not re-run when state changes, the handler is permanently stale.</p>

      <CodeBlock language="jsx" title="Event Handler Stale Closure Bug and Fix" showLineNumbers>
{`// BUG: Scroll handler always sees count = 0
function ScrollLogger() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // count is captured from the mount render = 0
      console.log('Scrolled! Count is:', count); // Always 0
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Never re-runs, so handler is never refreshed

  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}

// FIX: Use a ref so the handler always reads the latest value
function ScrollLogger() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count;

  useEffect(() => {
    const handleScroll = () => {
      console.log('Scrolled! Count is:', countRef.current); // Always fresh
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Safe: ref.current is always up to date

  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}`}
      </CodeBlock>

      <h3>useEffect Stale Dependency</h3>

      <p>An effect that reads state but omits it from the dependency array will see the initial value forever.</p>

      <CodeBlock language="jsx" title="Missing Dependency = Permanent Stale Read" showLineNumbers>
{`// BUG: Effect reads count but doesn't list it in deps
function Logger() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // This effect only ran once (empty deps), so count = 0 forever
      console.log('Current count:', count); // Always logs 0
    }, 2000);
    return () => clearInterval(id);
  }, []); // ESLint warns: "count" is missing from dependencies

  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}

// FIX 1: Add count to deps (interval restarts each time — acceptable for many cases)
useEffect(() => {
  const id = setInterval(() => {
    console.log('Current count:', count); // Fresh on each re-run
  }, 2000);
  return () => clearInterval(id);
}, [count]); // Effect re-runs when count changes

// FIX 2: Use a ref (interval stays stable — better for performance)
const countRef = useRef(count);
countRef.current = count;

useEffect(() => {
  const id = setInterval(() => {
    console.log('Current count:', countRef.current); // Always latest
  }, 2000);
  return () => clearInterval(id);
}, []); // Stable interval, fresh reads`}
      </CodeBlock>

      <h2>The Ref Escape Hatch</h2>

      <p>When you need to read the latest value of state or props inside a callback without causing re-renders or re-registering listeners, <code>useRef</code> is your escape hatch. Refs are mutable containers that persist across renders and are <strong>not</strong> part of the render cycle.</p>

      <CodeBlock language="jsx" title="The useLatest Custom Hook Pattern" showLineNumbers>
{`// A reusable hook that always gives you a ref to the latest value
function useLatest(value) {
  const ref = useRef(value);
  ref.current = value; // Update synchronously on every render
  return ref;
}

// Usage: combine with any callback that might go stale
function ChatRoom({ roomId, onMessage }) {
  const onMessageRef = useLatest(onMessage);

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('message', (msg) => {
      // Always calls the latest onMessage, even if parent re-renders
      onMessageRef.current(msg);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // onMessage is NOT a dependency — ref handles freshness
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Decision Tree: How to Fix Stale State">
        <p><strong>1. Are you calling a state setter?</strong> → Use a functional update: <code>{"setState(prev => prev + 1)"}</code></p>
        <p><strong>2. Are you reading state inside a timer or event listener?</strong> → Use a ref: <code>{"ref.current = state"}</code> on every render, read <code>{"ref.current"}</code> in the callback.</p>
        <p><strong>3. Is your effect missing a dependency?</strong> → Add the dependency to the array. The effect will re-run and capture fresh values.</p>
        <p><strong>4. Is a callback prop going stale?</strong> → Use the <code>useLatest</code> ref pattern to avoid adding the callback to deps.</p>
        <p><strong>5. Do you need the value at the time of an event, not the latest?</strong> → Capture it in a local variable before the async gap: <code>{"const snapshot = count;"}</code></p>
      </InfoBox>

      <FlowChart
        title="Which Stale State Fix Should I Use?"
        chart={"graph TD\n  A[I have stale state] --> B{Am I calling setState?}\n  B -->|Yes| C[Use functional update: setState prev => ...]\n  B -->|No, I am reading state| D{Where am I reading it?}\n  D -->|In a timer or event listener| E[Store in a ref, read ref.current]\n  D -->|In an effect body| F{Is the dep array correct?}\n  F -->|Missing dep| G[Add the missing dependency]\n  F -->|Deps correct but still stale| H[Use a ref for the value]\n  D -->|In an async function after await| I[Capture value before await or use ref]"}
      />

      <h2>Stale State in Async Operations</h2>

      <p>Any time you use <code>async/await</code>, there is a gap between the <code>await</code> and the code that follows. During that gap, the component may re-render multiple times. The state variables in your closure are frozen at the values they had when the function started.</p>

      <CodeBlock language="jsx" title="Async Stale State Bug and Fixes" showLineNumbers>
{`// BUG: formData may have changed during the await
function SubmitForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async () => {
    setStatus('submitting');
    await submitToAPI(formData); // Network takes 2 seconds...
    // User may have edited the form during those 2 seconds!
    // But formData here is the OLD snapshot from when handleSubmit started
    setStatus('submitted');
    console.log('Submitted:', formData.name); // Possibly stale!
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
      />
    </form>
  );
}

// FIX 1: Capture the value before the await (intentional snapshot)
const handleSubmit = async () => {
  const dataToSubmit = formData; // Snapshot is intentional now
  setStatus('submitting');
  await submitToAPI(dataToSubmit);
  console.log('Submitted:', dataToSubmit.name); // Clear intent: we wanted this snapshot
};

// FIX 2: Use a ref when you need the absolute latest value
function SubmitForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const handleSubmit = async () => {
    setStatus('submitting');
    await submitToAPI(formDataRef.current); // Always latest
    console.log('Submitted:', formDataRef.current.name); // Fresh
  };
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Snapshot vs Latest — Be Intentional">
        <p>Sometimes the stale value is actually what you want. For example, if a user clicks "Submit", you probably want to submit the data as it was when they clicked — not whatever it changed to 2 seconds later. The key is to be <strong>intentional</strong> about which behavior you need, rather than getting stale values by accident.</p>
      </InfoBox>

      <InteractiveChallenge
        question={"What will this counter display after 5 seconds?\n\nconst [count, setCount] = useState(0);\nuseEffect(() => {\n  const id = setInterval(() => {\n    setCount(count + 1);\n  }, 1000);\n  return () => clearInterval(id);\n}, []);"}
        options={[
          "5 — it increments every second",
          "1 — it sets count to 0 + 1 every tick, staying at 1",
          "0 — setCount does nothing inside setInterval",
          "Error — you cannot use setCount inside setInterval"
        ]}
        correctIndex={1}
        explanation={"The effect runs once on mount, capturing count = 0 in its closure. Every second, setInterval calls setCount(0 + 1), which always sets count to 1. The count variable inside the closure never updates — it is a stale closure. The fix is to use a functional update: setCount(prev => prev + 1)."}
        language="jsx"
        code={"// Stale closure in setInterval\nconst [count, setCount] = useState(0);\nuseEffect(() => {\n  const id = setInterval(() => {\n    setCount(count + 1); // count is always 0 here\n  }, 1000);\n  return () => clearInterval(id);\n}, []);\n// After 5 seconds, count = 1 (not 5)"}
      />

      <InteractiveChallenge
        question={"You have an event listener registered in a useEffect with an empty dependency array. The listener needs to read the latest value of a state variable. Which fix is most appropriate?"}
        options={[
          "Add the state variable to the dependency array so the effect re-runs",
          "Store the state in a ref and read ref.current in the listener",
          "Use a functional update inside the listener",
          "Move the listener registration outside of useEffect"
        ]}
        correctIndex={1}
        explanation={"While adding the state to the dependency array works, it means the listener is removed and re-added on every state change — which can be expensive and cause missed events. A ref lets you keep a single stable listener that always reads the latest value via ref.current. Functional updates only help when you are calling setState, not when you need to read state. Moving the listener outside useEffect would cause it to be registered on every render without cleanup."}
        language="jsx"
        code={"// Best fix: ref pattern for event listeners\nconst [count, setCount] = useState(0);\nconst countRef = useRef(count);\ncountRef.current = count; // Sync ref every render\n\nuseEffect(() => {\n  const handler = () => {\n    console.log(countRef.current); // Always fresh\n  };\n  window.addEventListener('scroll', handler);\n  return () => window.removeEventListener('scroll', handler);\n}, []); // Stable listener, no stale reads"}
      />

      <h2>Avoiding Infinite Loops</h2>

      <CodeBlock language="jsx" title="Common Infinite Loop Traps" showLineNumbers>
{`// INFINITE LOOP 1: Missing dependency array
useEffect(() => {
  setCount(count + 1); // Triggers re-render → effect runs again → loop
});

// INFINITE LOOP 2: Object/array in dependency array
function Component({ id }) {
  const options = { id, format: 'full' }; // New object every render!

  useEffect(() => {
    fetchData(options);
  }, [options]); // ALWAYS considered "changed" → infinite loop

  // FIX: Move object inside effect, or useMemo, or depend on primitives
  useEffect(() => {
    const options = { id, format: 'full' };
    fetchData(options);
  }, [id]); // Primitive dep — stable comparison
}

// INFINITE LOOP 3: State update creates new reference that's a dependency
function Component() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems().then(data => {
      setItems(data); // New array → items changes → effect re-runs → loop!
    });
  }, [items]); // BUG: items should NOT be a dependency here

  // FIX: Remove items from deps — this effect doesn't READ items
  useEffect(() => {
    fetchItems().then(setItems);
  }, []); // Correct: fetch once on mount
}`}
      </CodeBlock>

      <h2>Effect Cleanup Patterns</h2>

      <CodeBlock language="jsx" title="Cleanup Patterns" showLineNumbers>
{`// Timer cleanup
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

// Event listener cleanup
useEffect(() => {
  const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
  window.addEventListener('mousemove', handler);
  return () => window.removeEventListener('mousemove', handler);
}, []);

// WebSocket cleanup
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (event) => setMessages(prev => [...prev, event.data]);
  ws.onerror = (error) => setError(error);
  return () => ws.close();
}, [url]);

// Intersection Observer cleanup
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsVisible(entry.isIntersecting),
    { threshold: 0.1 }
  );
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);`}
      </CodeBlock>

      <InfoBox variant="tip" title="The React 19 Alternative">
        <p>React 19 introduces the <code>use()</code> hook and Server Components which eliminate many data-fetching effects entirely. For new code, consider whether your fetch belongs in a Server Component or can use Suspense + the <code>use()</code> hook instead of useEffect.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does the cleanup function returned from useEffect do when the component re-renders with new dependencies?"
        options={[
          "It runs immediately when the new props arrive",
          "It runs after the new effect executes",
          "It runs before the new effect, after the DOM update",
          "It runs during the render phase before DOM commit"
        ]}
        correctIndex={2}
        explanation="On re-render with changed deps: React commits DOM changes first, then runs the previous effect's cleanup, then runs the new effect. This ensures cleanup has access to the previous render's values (via closure) and the new effect sees the updated DOM."
        language="jsx"
        code={"useEffect(() => {\n  console.log('effect runs with', dep);\n  return () => console.log('cleanup runs with', dep);\n}, [dep]);\n// dep: A → B\n// Output: 'cleanup runs with A', 'effect runs with B'"}
      />
    </LessonLayout>
  );
}
