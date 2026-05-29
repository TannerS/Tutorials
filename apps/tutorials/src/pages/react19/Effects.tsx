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

      <InfoBox variant="info" title="Why This Happens">
        <p>When a dep like <code>userId</code> changes, React starts a new effect — which fires a new fetch. But the <strong>old fetch is still in flight</strong>. It has no idea the component moved on. Whichever request lands last wins and calls <code>setUser</code>, even if it's carrying stale data from a previous <code>userId</code>.</p>
        <p>This is easy to miss in development because localhost requests are fast and almost always resolve in order. In production, unpredictable network latency means the order is never guaranteed.</p>
      </InfoBox>

      <InfoBox variant="info" title="What the Cleanup Actually Does">
        <p>The <code>return</code> in a <code>useEffect</code> is the cleanup — it runs when the dep changes, targeting the <strong>previous</strong> effect's scope, not the new one. So when <code>userId</code> changes:</p>
        <ul>
          <li>The old fetch is still alive in memory, its <code>.then()</code> will still fire when it resolves</li>
          <li>The cleanup runs immediately and either kills the old request (<code>AbortController</code>) or flags its result to be ignored (boolean)</li>
          <li>The new effect starts fresh with its own fetch</li>
        </ul>
        <p>The two solutions below both solve the same problem — they just differ in <em>when</em> they stop the old request from affecting state.</p>
      </InfoBox>

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

      <InfoBox variant="tip" title="Boolean vs AbortController — What's the Difference?">
        <p><strong>Boolean flag:</strong> the old request still completes on the network. When <code>.then()</code> fires, it checks the flag and skips <code>setUser</code>. The request was wasted but the UI is correct.</p>
        <p><strong>AbortController:</strong> the browser kills the request mid-flight. The fetch promise rejects with an <code>AbortError</code>, so <code>.then(setUser)</code> never fires at all. More efficient — nothing to ignore because the request never comes back.</p>
        <p>In both cases the cleanup is reaching backwards into the <em>previous</em> effect's closure — not setting up anything for the new one.</p>
      </InfoBox>

      <h2>Stale Closures — The Most Common Hook Bug</h2>

      <p>A <strong>stale closure</strong> occurs when a callback or effect captures a variable from a previous render and continues using the old value, even though the component has re-rendered with a new value. This is the #1 source of subtle bugs in React hook code.</p>

      <InfoBox variant="info" title="Why Component Functions Are Different From Normal Functions">
        <p>
          There is nothing special about a component function at the JavaScript level.
          The only things that make it a component are that it <strong>returns JSX</strong>{' '}
          and <strong>React calls it</strong> — not you. That second part is what causes stale closures.
        </p>
        <p>
          Every time React calls your component function it creates a <strong>brand new
          scope</strong> with brand new variables. Any closure created during that call —
          an event handler, a <code>setTimeout</code> callback, an effect — captures that
          render's variables and can never see a newer render's copies.
        </p>
        <CodeBlock language="js" title="Outside a component — no stale closure problem">
          {`// Module-level variable — created once, never recreated
let count = 0;
function logLater() {
  setTimeout(() => console.log(count), 3000);
}
count = 5;
logLater(); // logs 5 — one scope, one shared binding`}
        </CodeBlock>
        <CodeBlock language="js" title="Inside a component — new scope on every render">
          {`function MyComponent() {
  // React calls this again on every render — fresh scope each time
  const [count, setCount] = useState(0);
  // This closure captures THIS render's count only
  const handleClick = () => setTimeout(() => alert(count), 3000);
}`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          <strong>The rule:</strong> a variable goes stale when the function that <em>created</em> it
          gets called again, producing a new copy. React does this on every render.
          <code> useRef</code> is the escape hatch — a single shared object that lives outside
          the render cycle, so every closure always reads the same <code>.current</code>.
        </p>
      </InfoBox>

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

      <InfoBox variant="info" title="How useLatest Actually Works — useRef Is Never Recreated">
        <p>
          You might expect that calling <code>useLatest(value)</code> on every render
          recreates the ref with a new value — but that is not what happens.{' '}
          <code>useRef</code> has a specific guarantee: <strong>the initial value is
          only used on the very first call</strong>. Every subsequent render, React
          ignores the argument entirely and returns the exact same ref object it
          created on mount.
        </p>
        <CodeBlock language="js" title="useRef ignores its argument after the first render">
          {`// React only uses the initial value ONCE
Render 1: useRef(0)  →  creates { current: 0 }   ← initialValue used here
Render 2: useRef(1)  →  returns { current: 0 }   ← argument ignored
Render 3: useRef(2)  →  returns { current: 0 }   ← argument ignored`}
        </CodeBlock>
        <p>
          The ref object itself is stored on the component instance and handed back
          every render. It is never recreated. So the line doing the real work in{' '}
          <code>useLatest</code> is not the <code>useRef</code> call — it is the
          direct mutation on the next line:
        </p>
        <CodeBlock language="js" title="The mutation is what keeps it current">
          {`const ref = useRef(value); // after render 1, this argument is ignored
ref.current = value;       // THIS runs every render and updates the shared object

// Render 1: ref created → { current: 0 },  then ref.current = 0  → { current: 0 }
// Render 2: same ref    → { current: 0 },  then ref.current = 1  → { current: 1 }
// Render 3: same ref    → { current: 1 },  then ref.current = 2  → { current: 2 }`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Any closure that holds a reference to this ref object — whether it was
          created on render 1 or render 10 — reads <code>.current</code> off the
          same object and always gets the latest value. The closure is no longer
          frozen because it is not holding a primitive snapshot — it is holding a
          <strong> pointer to a mutable object</strong>. That is the same reason a
          plain module-level variable does not go stale: one shared binding, not a
          per-render copy.
        </p>
      </InfoBox>

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

      <FlowChart
        title="Which Stale State Fix Should I Use?"
        chart={"graph TD\n  A[I have stale state] --> B{Am I calling setState?}\n  B -->|Yes| C[Use functional update: setState prev => ...]\n  B -->|No, I am reading state| D{Where am I reading it?}\n  D -->|In a timer or event listener| E[Store in a ref, read ref.current]\n  D -->|In an effect body| F{Is the dep array correct?}\n  F -->|Missing dep| G[Add the missing dependency]\n  F -->|Deps correct but still stale| H[Use a ref for the value]\n  D -->|In an async function after await| I[Use a ref — read ref.current after the await]"}
      />

      <h2>Stale State in Async Operations</h2>

      <p>Any time you use <code>async/await</code>, there is a gap between the <code>await</code> and the code that follows. During that gap, the component may re-render multiple times. The state variables in your closure are frozen at the values they had when the function started.</p>

      <CodeBlock language="jsx" title="Async Stale State Bug" showLineNumbers>
{`// BUG: formData after the await is the frozen snapshot from when handleSubmit started
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
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Is This Actually a Problem for a Form Submit?">
        <p>
          For a button-triggered submit, probably not. The user has to click Submit
          to call <code>handleSubmit</code>, so <code>formData</code> at click time
          is exactly what you want to send. The staleness after the <code>await</code>{' '}
          only matters if you read <code>formData</code> <em>after</em> the call and
          expect it to reflect changes made during the network request.
        </p>
        <p style={{ marginBottom: 0 }}>
          The pattern genuinely matters in cases where the async operation fires
          automatically rather than from a click — autosave on a timer, a debounced
          live preview, or a continuously running message handler. In those cases the
          function is set up once and fires repeatedly, so the closure can become
          genuinely stale between calls.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Fix: Line-by-Line — How the Ref Pattern Solves It">
        <CodeBlock language="jsx" title="Fix — ref keeps .current live across the await gap">
          {`function SubmitForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  // 1. Create the ref once on mount. initialValue only used this one time.
  const formDataRef = useRef(formData);

  // 2. This line runs on EVERY render, synchronously, in the component body.
  //    Every keystroke → setFormData → re-render → this line fires → ref is current.
  formDataRef.current = formData;

  const handleSubmit = async () => {
    // 3. The closure captures formDataRef — the ref OBJECT, not .current.
    //    A ref object is one shared pointer, never recreated across renders.
    await submitToAPI(formDataRef.current); // reads live .current at call time

    // 4. Reading .current here only makes sense if you need to compare
    //    what was submitted vs what the user may have changed during the await.
    const submittedData = formDataRef.current; // snapshot at submit time
    await submitToAPI(submittedData);

    if (formDataRef.current !== submittedData) {
      // Form changed while request was in flight — handle accordingly
    }
  };
}`}
        </CodeBlock>
        <p>
          Reading <code>formDataRef.current</code> <em>after</em> the <code>await</code>{' '}
          is only useful if you need to react to changes that happened during the
          network request. If you just need to send the data and move on, reading{' '}
          <code>.current</code> once before the <code>await</code> and storing it in
          a local variable is cleaner and communicates intent.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>What's the point of updating <code>.current</code> after the async
          call if the call already used the value?</strong> There isn't one — by the
          time the <code>await</code> resolves, the API call has already fired with
          whatever <code>.current</code> held at that moment. Updating <code>.current</code>{' '}
          after the call does nothing useful for that request. The ref stays current
          because <code>formDataRef.current = formData</code> runs on every render
          automatically — that line is what keeps it live, not anything you do inside
          the handler. Inside the handler you are only ever <em>reading</em> the ref,
          never writing it.
        </p>
      </InfoBox>

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

    </LessonLayout>
  );
}
