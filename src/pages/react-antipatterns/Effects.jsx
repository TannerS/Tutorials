import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Effects() {
  return (
    <LessonLayout
      title="useEffect Anti-Patterns"
      sectionId="react-antipatterns"
      lessonIndex={2}
      prev={{ path: '/react-antipatterns/state', label: 'State Anti-Patterns' }}
      next={{ path: '/react-antipatterns/performance', label: 'Performance Mistakes' }}
    >
      <h2>The Most Misused Hook in React</h2>
      <p>
        <code>useEffect</code> is designed for <strong>synchronizing with external systems</strong> —
        fetching data, setting up subscriptions, manipulating the DOM. It is NOT for computing
        derived values, handling events, or syncing state. Yet most React codebases are full
        of unnecessary effects.
      </p>

      <FlowChart
        title="Should You Use useEffect?"
        chart={"graph TD\nA[I need to run some code...] --> B{Is it in response to a user action?}\nB -->|Yes| C[Use an event handler, not useEffect]\nB -->|No| D{Is it computing a value from state/props?}\nD -->|Yes| E[Compute during render or useMemo]\nD -->|No| F{Is it syncing with an external system?}\nF -->|Yes, DOM/API/subscription| G[useEffect is correct]\nF -->|No| H{Is it initializing something on mount?}\nH -->|Yes| I[useEffect with empty deps]\nH -->|No| J[You probably do not need useEffect]\nstyle C fill:#22c55e,color:#fff\nstyle E fill:#22c55e,color:#fff\nstyle G fill:#3b82f6,color:#fff\nstyle I fill:#3b82f6,color:#fff\nstyle J fill:#ef4444,color:#fff"}
      />

      <h2>Anti-Pattern 1: useEffect for Derived State</h2>

      <CodeBlock language="jsx" title="Effect for Derived State">
{`// ❌ BAD — useEffect to compute derived value
function SearchResults({ items, query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    setResults(items.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    ));
  }, [items, query]);

  // Problem: For one render frame, results is STALE.
  // React renders with old results, then the effect fires,
  // then React re-renders with new results. Double render!

  return <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>;
}

// ✅ GOOD — compute during render
function SearchResults({ items, query }) {
  const results = items.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>;
}

// ✅ GOOD — useMemo if the computation is expensive
function SearchResults({ items, query }) {
  const results = useMemo(() =>
    items.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    ),
    [items, query]
  );

  return <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>;
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Double-Render Problem">
        When you use useEffect to set state derived from props/state, React renders TWICE:
        once with stale data, then again after the effect fires and updates state. Users may
        see a flash of wrong content. Computing during render avoids this entirely.
      </InfoBox>

      <h2>Anti-Pattern 2: useEffect as Event Handler</h2>

      <CodeBlock language="jsx" title="Effect as Event Handler">
{`// ❌ BAD — using useEffect to react to user action
function ProductPage({ product }) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // This runs on EVERY quantity change — even on mount!
    // What if quantity is set programmatically? This still fires.
    analytics.track('quantity_changed', { productId: product.id, quantity });
  }, [quantity, product.id]);

  // Also fires on initial render with quantity=1
  // Not what we intended — we only want to track USER changes

  return (
    <input
      type="number"
      value={quantity}
      onChange={e => setQuantity(Number(e.target.value))}
    />
  );
}

// ✅ GOOD — handle in the event handler itself
function ProductPage({ product }) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (e) => {
    const newQuantity = Number(e.target.value);
    setQuantity(newQuantity);
    // Track ONLY when user actually changes it
    analytics.track('quantity_changed', {
      productId: product.id,
      quantity: newQuantity,
    });
  };

  return (
    <input type="number" value={quantity} onChange={handleQuantityChange} />
  );
}`}
      </CodeBlock>

      <h2>Anti-Pattern 3: Missing Dependencies (Stale Closures)</h2>

      <CodeBlock language="jsx" title="Stale Closure Bug">
{`// ❌ BAD — stale closure
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // roomId is captured from the FIRST render's closure!
      // If roomId changes, this still uses the old one.
      console.log('Polling room:', roomId); // Always logs initial roomId
      fetch(\`/api/rooms/\${roomId}/messages\`)
        .then(r => r.json())
        .then(setMessages);
    }, 5000);

    return () => clearInterval(interval);
  }, []); // ❌ Empty deps — roomId is missing!

  return <div>{messages.length} messages in {roomId}</div>;
}

// ✅ GOOD — include roomId in dependencies
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(\`/api/rooms/\${roomId}/messages\`)
        .then(r => r.json())
        .then(setMessages);
    }, 5000);

    // Cleanup: clear old interval when roomId changes
    return () => clearInterval(interval);
  }, [roomId]); // ✅ Re-runs when roomId changes

  return <div>{messages.length} messages in {roomId}</div>;
}

// ✅ ALTERNATIVE — useRef for values that change but should not re-run the effect
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId; // Always up to date

  useEffect(() => {
    const interval = setInterval(() => {
      // Reads from ref — always current, no stale closure
      fetch(\`/api/rooms/\${roomIdRef.current}/messages\`)
        .then(r => r.json())
        .then(setMessages);
    }, 5000);

    return () => clearInterval(interval);
  }, []); // Safe — we read from the ref, not the closure

  return <div>{messages.length} messages in {roomId}</div>;
}`}
      </CodeBlock>

      <h2>Anti-Pattern 4: Race Conditions in Data Fetching</h2>

      <CodeBlock language="jsx" title="Data Fetching Race Condition">
{`// ❌ BAD — race condition
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // If userId changes rapidly (1 → 2 → 3), three fetches start.
    // They may resolve in any order: 3, 1, 2
    // The UI shows whichever resolved LAST — might be user 1!
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}

// ✅ GOOD — cleanup with abort flag
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setUser(data); // Only set if this is still the current request
        }
      });

    return () => {
      cancelled = true; // Previous request's callback will be ignored
    };
  }, [userId]);

  return <div>{user?.name}</div>;
}

// ✅ BEST — AbortController cancels the network request entirely
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

    return () => controller.abort(); // Cancels the actual network request
  }, [userId]);

  return <div>{user?.name}</div>;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="React 19: use() Replaces Fetch-in-Effect">
        React 19 introduces the <code>use()</code> hook which can read a Promise directly
        during render. Combined with Suspense, this eliminates the need for useEffect-based
        data fetching entirely — no loading state, no race conditions, no cleanup.
      </InfoBox>

      <h2>Anti-Pattern 5: Infinite Loops</h2>

      <CodeBlock language="jsx" title="Effect Infinite Loops">
{`// ❌ BAD — infinite loop (no dependency array)
useEffect(() => {
  setCount(count + 1);
  // Runs after EVERY render. Sets state → triggers render → runs again → forever
});

// ❌ BAD — infinite loop (object in dependency)
useEffect(() => {
  fetch('/api/data', {
    headers: { Authorization: \`Bearer \${token}\` },
  }).then(r => r.json()).then(setData);
}, [{ token }]); // ❌ New object every render! Reference changes = infinite loop

// ❌ BAD — infinite loop (array/object state in dependency)
function App() {
  const [items, setItems] = useState([]);
  const [processed, setProcessed] = useState([]);

  useEffect(() => {
    setProcessed(items.map(i => ({ ...i, processed: true })));
  }, [items]); // Seems fine, but if items is set elsewhere with same values
  // but new reference, this loops

  // Even worse:
  useEffect(() => {
    setItems([...items, { id: Date.now() }]); // ❌ Grows forever
  }, [items]); // items changes → effect runs → items changes → ...
}

// ✅ GOOD — stable references and correct dependencies
function App() {
  const [items, setItems] = useState([]);

  // Computed during render — no effect needed
  const processed = useMemo(
    () => items.map(i => ({ ...i, processed: true })),
    [items]
  );

  return <div>{processed.length} items</div>;
}`}
      </CodeBlock>

      <h2>Anti-Pattern 6: Syncing Parent-Child State</h2>

      <CodeBlock language="jsx" title="Parent-Child State Sync">
{`// ❌ BAD — child syncs its state to parent via effect
function Parent() {
  const [value, setValue] = useState('');
  return <Child value={value} onChange={setValue} />;
}

function Child({ value, onChange }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    onChange(localValue); // Syncs child → parent via effect
  }, [localValue, onChange]);

  useEffect(() => {
    setLocalValue(value); // Syncs parent → child via effect
  }, [value]);

  // Two effects fighting each other!
  // Parent updates → child effect sets localValue → child effect calls onChange
  // → parent updates → infinite loop risk!

  return (
    <input value={localValue} onChange={e => setLocalValue(e.target.value)} />
  );
}

// ✅ GOOD — controlled component, single source of truth
function Parent() {
  const [value, setValue] = useState('');
  return <Child value={value} onChange={setValue} />;
}

function Child({ value, onChange }) {
  // No local state — parent owns the value
  return (
    <input value={value} onChange={e => onChange(e.target.value)} />
  );
}`}
      </CodeBlock>

      <h2>Anti-Pattern 7: The Fetch-on-Mount Pattern</h2>

      <p>
        While <code>useEffect</code> for fetching on mount technically works, it forces you
        to hand-roll loading states, error handling, caching, and cleanup. Modern libraries
        solve all of these problems and avoid the pitfalls of manual effect-based fetching.
      </p>

      <CodeBlock language="jsx" title="Fetch on Mount — Manual vs Library">
{`// ❌ BAD — verbose, no caching, no deduplication
function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    fetch('/api/products')
      .then(r => r.json())
      .then(data => { if (!ignore) setProducts(data); })
      .catch(err => { if (!ignore) setError(err); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}

// ✅ GOOD — React Query handles caching, dedup, retries, and cleanup
import { useQuery } from '@tanstack/react-query';

function Products() {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Why Data-Fetching Libraries Win">
        Libraries like React Query and SWR give you automatic caching, request
        deduplication, stale-while-revalidate, background refetching, and retry
        logic — none of which you get from a raw useEffect fetch.
      </InfoBox>

      <FlowChart
        title="Common useEffect Mistakes"
        chart={"graph TD\nA[useEffect that calls setState] --> B{What triggers it?}\nB -->|Props/state changed| C{Is the new state derived from those?}\nC -->|Yes| D[Remove effect - compute during render]\nC -->|No| E{Is it in response to user action?}\nE -->|Yes| F[Move to event handler]\nE -->|No| G[Effect might be correct - external sync]\nstyle D fill:#22c55e,color:#fff\nstyle F fill:#22c55e,color:#fff\nstyle G fill:#3b82f6,color:#fff"}
      />

      <InteractiveChallenge
        question={"Which useEffect usage is correct?"}
        options={[
          'useEffect to filter a list when search term changes',
          'useEffect to set up a WebSocket connection on mount',
          'useEffect to call setState with a computed value from props',
          'useEffect to update state when a button is clicked',
        ]}
        correctIndex={1}
        explanation={"Setting up a WebSocket is synchronizing with an external system — the correct use of useEffect. Filtering a list is derived state (compute during render). Setting state from props is the derived state anti-pattern. Button clicks should be handled in event handlers."}
      />

      <InteractiveChallenge
        question={"What causes a stale closure in useEffect?"}
        options={[
          'Using async/await inside the effect',
          'Having too many dependencies',
          'Missing a variable from the dependency array that the effect reads',
          'Returning a cleanup function',
        ]}
        correctIndex={2}
        explanation={"A stale closure happens when the effect reads a variable (state or prop) but that variable is not in the dependency array. The effect captures the value from the render when it was created and never sees updates."}
      />
    </LessonLayout>
  );
}
