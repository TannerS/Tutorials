import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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
        chart={"graph TD\nA[I need to run some code...] --> B{Is it in response to a user action?}\nB -->|Yes| C[Use an event handler, not useEffect]\nB -->|No| D{Is it computing a value from state/props?}\nD -->|Yes| E[Compute during render or useMemo]\nD -->|No| F{Is it syncing with an external system?}\nF -->|Yes, DOM/API/subscription| G[useEffect is correct]\nF -->|No| H{Is it initializing something on mount?}\nH -->|Yes| I[useEffect with empty deps]\nH -->|No| J[You probably do not need useEffect]\nstyle C fill:#1a3329\nstyle E fill:#1a3329\nstyle G fill:#1a2744\nstyle I fill:#1a2744\nstyle J fill:#3b1a1a"}
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

      <InfoBox variant="info" title="Why does useRef fix the stale closure?">
        <p>
          The stale closure happens because <code>useEffect</code> with <code>[]</code> runs once on
          mount. The handler it creates closes over the <em>value</em> of <code>roomId</code> at that
          moment — and since the effect never re-runs, the handler never sees updates.
        </p>
        <p>
          <code>useRef</code> works because a closure captures a <strong>reference to an object</strong>,
          not a snapshot of a primitive. React guarantees that <code>useRef</code> returns the{' '}
          <strong>same object in memory</strong> across every render. So the old closure still points
          to it — and <code>.current</code> on that same object has already been updated.
        </p>
        <p>
          You might wonder: <em>what if I used a plain state object instead of a primitive?</em> It
          still would not work. <code>useState</code> deliberately creates a <strong>new object reference</strong>{' '}
          on each update to trigger re-renders. The old closure would still hold a reference to the
          original object. <code>useRef</code> is specifically designed to give you a stable, mutable
          container — one object that never moves, so any closure can always find it and read the
          current value.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '1px solid #444' }}></th>
              <th style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '1px solid #444' }}>Same object across renders?</th>
              <th style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '1px solid #444' }}>Triggers re-render on change?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px 12px' }}><code>useState</code></td>
              <td style={{ padding: '6px 12px' }}>No — new reference each update</td>
              <td style={{ padding: '6px 12px' }}>Yes</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 12px' }}><code>useRef</code></td>
              <td style={{ padding: '6px 12px' }}>Yes — always the same reference</td>
              <td style={{ padding: '6px 12px' }}>No</td>
            </tr>
          </tbody>
        </table>
      </InfoBox>

      <InfoBox variant="success" title="React 19.2: useEffectEvent is the version to write today">
        <p>
          The ref trick above is the pre-2026 workaround. React 19.2 ships{' '}
          <code>useEffectEvent</code>, which does the same job with the intent stated out loud —
          &quot;this part of the effect reads the latest values but is <em>not</em> reactive&quot;:
        </p>
        <pre style={{ margin: '0.5rem 0 0.75rem', fontSize: '0.82rem', overflowX: 'auto' }}>{
`function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  const poll = useEffectEvent(() => {
    fetch(\`/api/rooms/\${roomId}/messages\`)   // always the latest roomId
      .then(r => r.json()).then(setMessages);
  });

  useEffect(() => {
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);   // honest: nothing in here is reactive
}`
        }</pre>
        <p style={{ marginBottom: 0 }}>
          <strong>But read the example above carefully before copying either version.</strong> In
          this specific case, <em>not</em> re-running on <code>roomId</code> is arguably the bug:
          switching rooms should probably cancel the in-flight poll and reset{' '}
          <code>messages</code> immediately, which only the <code>[roomId]</code> version does.
          Suppressing a dependency is a decision about behaviour, not a performance trick — the
          ref and <code>useEffectEvent</code> are both ways to say &quot;I meant to do this,&quot;
          not ways to silence the linter.
        </p>
      </InfoBox>

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

      <InfoBox variant="tip" title="React 19: use() — and the Trap Everyone Hits First">
        <p>
          React 19&apos;s <code>use()</code> hook reads a Promise during render and
          suspends until it settles, so the nearest <code>&lt;Suspense&gt;</code>
          boundary shows the fallback and the nearest error boundary catches
          failures. That removes the hand-rolled <code>isLoading</code> and{' '}
          <code>error</code> state from the component.
        </p>
        <p>
          <strong>What it does not do is let you create the promise during
          render.</strong> This is the first thing nearly everyone tries, and it is an
          infinite loop:
        </p>
        <CodeBlock language="jsx" title="The trap">
          {`// ❌ Infinite loop — a NEW promise on every render
function Profile({ userId }) {
  const user = use(fetch(\`/api/users/\${userId}\`).then(r => r.json()));
  // render → new promise → suspend → retry render → new promise → ...
}`}
        </CodeBlock>
        <p>
          <code>use()</code> needs a promise that is <em>stable across renders</em>,
          which means something else has to own its lifetime and cache it. In
          practice that is a Server Component that starts the fetch and passes the
          promise down as a prop, a framework route loader (React Router&apos;s{' '}
          <code>loader</code>, covered in the React Router section), or a cache from a
          library like React Query. React deliberately ships no built-in fetch cache
          for this.
        </p>
        <p style={{ marginBottom: 0 }}>
          So <code>use()</code> changes <em>who owns the fetch</em>; it does not
          delete the problem. Race conditions and cancellation still exist — they have
          moved into the loader or cache layer, which is exactly where they are easier
          to get right once, rather than in every component. Until you have one of
          those owners in place, the <code>AbortController</code> pattern above is
          still the correct thing to write.
        </p>
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

// ⚠️ NOT a loop — but still wrong (this is derived state, Anti-Pattern 1)
function App() {
  const [items, setItems] = useState([]);
  const [processed, setProcessed] = useState([]);

  useEffect(() => {
    setProcessed(items.map(i => ({ ...i, processed: true })));
  }, [items]);
  // Trace it: the effect re-renders (it sets "processed"), but on that
  // re-render "items" is the same reference → deps unchanged → the effect
  // does not run again. Half the cycle is missing, so it settles after one
  // extra render. The cost is a wasted render and a stale frame, not a hang.
  //
  // The rule needs BOTH halves: the effect must re-render AND its deps must
  // differ on that re-render. Here only the first half holds.

  // ❌ THIS one is a real infinite loop — it writes to its own dependency:
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

      <InfoBox variant="tip" title="The Two-Part Test for &ldquo;Will This Effect Loop?&rdquo;">
        <p style={{ marginTop: 0 }}>
          An effect loops when <strong>both</strong> of these are true — neither one
          alone is enough:
        </p>
        <ol>
          <li>
            <strong>Running it causes a re-render.</strong> It sets state (or dispatches)
            to a value React does not bail out on. An effect that only fetches, logs or
            subscribes cannot loop, because nothing re-renders to run it again.
          </li>
          <li>
            <strong>Its dependencies differ on that re-render</strong> — or there is no
            dependency array at all, which means &ldquo;always re-run&rdquo;.
          </li>
        </ol>
        <p>
          Note what the second half is <em>not</em>: it is not &ldquo;the effect writes
          something in its own deps.&rdquo; Overlap is one way to satisfy it, not the
          only way. The two counterexamples are both in the block above:{' '}
          <code>useEffect(() =&gt; setCount(count + 1))</code> has <em>no deps to
          overlap with</em> and loops anyway; and{' '}
          <code>useEffect(fn, [{'{ token }'}])</code> loops because the object literal
          is a new reference every render, regardless of what the body writes. Overlap
          is not sufficient either — an effect that writes its own dep back to the{' '}
          <em>same</em> value fails part 1, because React bails out and never
          re-renders.
        </p>
        <p style={{ marginBottom: 0 }}>
          This matters because the two problems have different fixes. A genuine loop
          means the effect is doing something it should not be doing at all. A wasted
          render usually means you are computing derived state and should delete the
          effect in favour of a calculation during render. Guessing &ldquo;probably a
          loop&rdquo; and bolting on a <code>useRef</code> guard hides both.
        </p>
      </InfoBox>

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
        chart={"graph TD\nA[useEffect that calls setState] --> B{What triggers it?}\nB -->|Props/state changed| C{Is the new state derived from those?}\nC -->|Yes| D[Remove effect - compute during render]\nC -->|No| E{Is it in response to user action?}\nE -->|Yes| F[Move to event handler]\nE -->|No| G[Effect might be correct - external sync]\nstyle D fill:#1a3329\nstyle F fill:#1a3329\nstyle G fill:#1a2744"}
      />

    </LessonLayout>
  );
}
