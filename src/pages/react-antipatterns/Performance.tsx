import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Performance() {
  return (
    <LessonLayout
      title="Performance Anti-Patterns"
      sectionId="react-antipatterns"
      lessonIndex={3}
      prev={{ path: '/react-antipatterns/effects', label: 'useEffect Anti-Patterns' }}
      next={{ path: '/react-antipatterns/components', label: 'Component Anti-Patterns' }}
    >
      <InfoBox variant="info" title="Why Performance Matters">
        React is fast by default, but certain coding patterns silently defeat its
        optimisation mechanisms. This lesson covers the most common performance
        anti-patterns and shows you how to fix each one.
      </InfoBox>

      <FlowChart
        title="React Re-Render Cascade"
        chart={"graph TD\nA[State Change] --> B[Parent Re-Renders]\nB --> C[Child A Re-Renders]\nB --> D[Child B Re-Renders]\nC --> E[Grandchild Re-Renders]\nD --> F[Grandchild Re-Renders]\nE --> G[DOM Updates]\nF --> G\nG --> H[Browser Paint]"}
      />

      <InfoBox variant="warning" title="Re-Render ≠ DOM Update">
        A re-render means React calls your component function again and diffs the
        result. It does NOT mean the browser repaints. Still, unnecessary re-renders
        waste CPU cycles—especially in large trees.
      </InfoBox>

      {/* ------------------------------------------------------------------ */}
      {/* 1. New Objects / Arrays in Render                                   */}
      {/* ------------------------------------------------------------------ */}
      <h2>1. Creating New Objects/Arrays in Render</h2>

      <p>
        Every time a component re-renders, inline object or array literals create
        brand-new references. This defeats <code>React.memo</code> and{' '}
        <code>PureComponent</code> because their shallow comparison sees a
        different reference each time.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — New object every render">
        {`function Parent() {
  const [count, setCount] = useState(0);

  return (
    <MemoizedChild
      // New object reference on every render — memo is useless
      style={{ color: 'red', fontSize: 14 }}
      config={{ sortBy: 'name', order: 'asc' }}
    />
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Stable references">
        {`const style = { color: 'red', fontSize: 14 };
const config = { sortBy: 'name', order: 'asc' };

function Parent() {
  const [count, setCount] = useState(0);

  // References are stable — memo works correctly
  return <MemoizedChild style={style} config={config} />;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="When values depend on props or state">
        Use <code>useMemo</code> to stabilise references that depend on reactive
        values. Move truly static objects outside the component entirely.
      </InfoBox>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Inline Functions Passed to Children                              */}
      {/* ------------------------------------------------------------------ */}
      <h2>2. Inline Function Definitions Passed to Children</h2>

      <p>
        Arrow functions defined inside JSX create a new function reference on every
        render. If the child is wrapped in <code>React.memo</code>, the new
        reference breaks memoisation.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — New function every render">
        {`function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <MemoizedTodoItem
          key={todo.id}
          todo={todo}
          // New function reference each render
          onDelete={() => deleteTodo(todo.id)}
          onToggle={() => toggleTodo(todo.id)}
        />
      ))}
    </ul>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — useCallback with stable identity">
        {`function TodoList({ todos }) {
  const handleDelete = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleToggle = useCallback((id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  return (
    <ul>
      {todos.map((todo) => (
        <MemoizedTodoItem
          key={todo.id}
          todo={todo}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      ))}
    </ul>
  );
}

// Child calls handler with its own id
const MemoizedTodoItem = memo(function TodoItem({ todo, onDelete, onToggle }) {
  return (
    <li>
      <span onClick={() => onToggle(todo.id)}>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
});`}
      </CodeBlock>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Missing Key / Index as Key                                      */}
      {/* ------------------------------------------------------------------ */}
      <h2>3. Missing Key or Using Index as Key in Lists</h2>

      <p>
        React uses keys to match elements between renders. Using the array index
        causes incorrect recycling when items are reordered, inserted, or deleted.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Index as key">
        {`function MessageList({ messages }) {
  return (
    <ul>
      {messages.map((msg, index) => (
        // Index key breaks when items are reordered or removed
        <MessageItem key={index} message={msg} />
      ))}
    </ul>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Stable, unique key">
        {`function MessageList({ messages }) {
  return (
    <ul>
      {messages.map((msg) => (
        // Unique id survives reordering and deletion
        <MessageItem key={msg.id} message={msg} />
      ))}
    </ul>
  );
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Stateful children + index keys = bugs">
        If list items contain local state (inputs, checkboxes, animations), index
        keys cause state to stick to the wrong item after reordering.
      </InfoBox>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Not Memoizing Expensive Computations                            */}
      {/* ------------------------------------------------------------------ */}
      <h2>4. Not Memoizing Expensive Computations</h2>

      <p>
        Filtering, sorting, or transforming large datasets on every render wastes
        cycles. Wrap heavy work in <code>useMemo</code> so it only recalculates
        when its dependencies change.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Expensive work on every render">
        {`function AnalyticsDashboard({ transactions }) {
  // Runs on EVERY render, even if transactions hasn't changed
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const totals = transactions.reduce(
    (acc, t) => ({
      revenue: acc.revenue + t.amount,
      count: acc.count + 1,
    }),
    { revenue: 0, count: 0 }
  );

  return <Report data={sorted} totals={totals} />;
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Memoized computation">
        {`function AnalyticsDashboard({ transactions }) {
  const sorted = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    [transactions]
  );

  const totals = useMemo(
    () =>
      transactions.reduce(
        (acc, t) => ({
          revenue: acc.revenue + t.amount,
          count: acc.count + 1,
        }),
        { revenue: 0, count: 0 }
      ),
    [transactions]
  );

  return <Report data={sorted} totals={totals} />;
}`}
      </CodeBlock>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Premature Optimization                                          */}
      {/* ------------------------------------------------------------------ */}
      <h2>5. Premature Optimization</h2>

      <InfoBox variant="warning" title="Memo Has a Cost">
        <code>React.memo</code>, <code>useMemo</code>, and{' '}
        <code>useCallback</code> are not free. They add memory overhead and
        comparison logic. Only use them when you have measured a real problem.
      </InfoBox>

      <CodeBlock language="jsx" title="❌ BAD — Wrapping everything in memo">
        {`// Unnecessary — this component is trivial and renders fast
const Label = memo(function Label({ text }) {
  return <span>{text}</span>;
});

function Form() {
  // Unnecessary — simple handler, child is not memoized
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  // Unnecessary — cheap computation
  const greeting = useMemo(() => 'Hello ' + name, [name]);

  return (
    <div>
      <Label text={greeting} />
      <button onClick={handleClick}>Click</button>
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Optimize only where it matters">
        {`// No memo needed for a simple label
function Label({ text }) {
  return <span>{text}</span>;
}

function Form() {
  // Simple handler — no useCallback needed
  const handleClick = () => console.log('clicked');

  // Cheap concatenation — no useMemo needed
  const greeting = 'Hello ' + name;

  return (
    <div>
      <Label text={greeting} />
      <button onClick={handleClick}>Click</button>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="When to reach for memo">
        Profile first with React DevTools. Memoize when a component re-renders
        frequently AND its render is expensive or it sits deep in a large tree.
      </InfoBox>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Large Trees Re-Rendering on Every State Change                  */}
      {/* ------------------------------------------------------------------ */}
      <h2>6. Large Component Trees Re-Rendering on Every State Change</h2>

      <p>
        Lifting state too high causes the entire subtree to re-render whenever that
        state changes. Push state down to the smallest component that needs it, or
        split the fast-changing part into its own component.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — State at the top re-renders everything">
        {`function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // Entire tree re-renders on every mouse move
  return (
    <div>
      <Header />
      <Sidebar />
      <Dashboard />
      <MouseTracker position={mousePos} />
      <Footer />
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Isolate fast-changing state">
        {`function App() {
  return (
    <div>
      <Header />
      <Sidebar />
      <Dashboard />
      <MouseTracker />
      <Footer />
    </div>
  );
}

// State is local — only this component re-renders on mouse move
function MouseTracker() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div>
      Position: {mousePos.x}, {mousePos.y}
    </div>
  );
}`}
      </CodeBlock>

      {/* ------------------------------------------------------------------ */}
      {/* 7. Not Using React.lazy for Code Splitting                         */}
      {/* ------------------------------------------------------------------ */}
      <h2>7. Not Using React.lazy for Code Splitting</h2>

      <p>
        Importing every page eagerly means users download the entire app upfront.
        Use <code>React.lazy</code> and <code>Suspense</code> to split by route
        or feature.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Eager imports bloat the bundle">
        {`import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Reports from './pages/Reports';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Lazy-loaded routes">
        {`import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Reports = lazy(() => import('./pages/Reports'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Granular Suspense boundaries">
        Wrap individual routes or feature sections in their own{' '}
        <code>Suspense</code> boundary so the rest of the page remains interactive
        while one chunk loads.
      </InfoBox>

      {/* ------------------------------------------------------------------ */}
      {/* 8. ProductDashboard — putting it all together                      */}
      {/* ------------------------------------------------------------------ */}
      <h2>8. Putting It All Together — ProductDashboard</h2>

      <p>
        This example shows how <code>useMemo</code>, <code>useCallback</code>,
        and <code>React.memo</code> work together to prevent unnecessary
        re-renders in a realistic dashboard.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — ProductDashboard with no memoization">
        {`function ProductDashboard({ products, categories }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Recomputed every render
  const filtered = products
    .filter((p) => p.category === selectedCategory || selectedCategory === 'all')
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: filtered.length,
    avgPrice: filtered.reduce((s, p) => s + p.price, 0) / (filtered.length || 1),
  };

  return (
    <div>
      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} />
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        // New function every render
        onSelect={(cat) => setSelectedCategory(cat)}
      />
      {/* New object every render */}
      <StatsPanel stats={stats} />
      <ProductGrid
        products={filtered}
        // New function every render
        onAddToCart={(id) => addToCart(id)}
      />
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — ProductDashboard fully optimized">
        {`const StatsPanel = memo(function StatsPanel({ stats }) {
  return (
    <div>
      <span>Total: {stats.total}</span>
      <span>Avg Price: \${stats.avgPrice.toFixed(2)}</span>
    </div>
  );
});

const ProductGrid = memo(function ProductGrid({ products, onAddToCart }) {
  return (
    <ul>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
      ))}
    </ul>
  );
});

function ProductDashboard({ products, categories }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Only recomputes when products, search, or category changes
  const filtered = useMemo(
    () =>
      products
        .filter(
          (p) => p.category === selectedCategory || selectedCategory === 'all'
        )
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search, selectedCategory]
  );

  // Stable reference — only recomputes when filtered changes
  const stats = useMemo(
    () => ({
      total: filtered.length,
      avgPrice:
        filtered.reduce((s, p) => s + p.price, 0) / (filtered.length || 1),
    }),
    [filtered]
  );

  // Stable callback — does not change between renders
  const handleAddToCart = useCallback((id) => {
    addToCart(id);
  }, []);

  const handleCategorySelect = useCallback((cat) => {
    setSelectedCategory(cat);
  }, []);

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
      />
      <StatsPanel stats={stats} />
      <ProductGrid products={filtered} onAddToCart={handleAddToCart} />
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Key Takeaways from the Dashboard">
        <ul>
          <li><strong>useMemo</strong> — stabilises filtered data and derived stats.</li>
          <li><strong>useCallback</strong> — stabilises event handlers passed to children.</li>
          <li><strong>React.memo</strong> — skips re-render when props are shallowly equal.</li>
          <li>All three must work together; any missing link breaks the chain.</li>
        </ul>
      </InfoBox>

      {/* ------------------------------------------------------------------ */}
      {/* Interactive Challenges                                              */}
      {/* ------------------------------------------------------------------ */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"A parent component passes style={{ color: 'red' }} to a React.memo child. The parent re-renders due to unrelated state. What happens?"}
        options={[
          'The child skips re-rendering because the style value is the same',
          'The child re-renders because a new object reference is created each time',
          'React.memo performs a deep comparison and skips the re-render',
          'The child only re-renders if color actually changed',
        ]}
        correctIndex={1}
        explanation="Inline object literals create a new reference on every render. React.memo uses shallow comparison (Object.is), so it sees a different reference and re-renders the child even though the values are identical. Move the object outside the component or wrap it in useMemo."
      />

      <InteractiveChallenge
        question={"You have a list of 1,000 items rendered with index as the key. A user deletes the third item. What problem will React encounter?"}
        options={[
          'React throws an error because keys must be unique strings',
          'React unmounts and remounts every item after the deleted one',
          'React incorrectly recycles DOM nodes, shifting state to the wrong items',
          'There is no problem — index keys work fine for deletions',
        ]}
        correctIndex={2}
        explanation="When an item is removed, every subsequent index shifts down by one. React matches the old key=2 element to the new key=2 (which is now a different item), causing it to reuse DOM state for the wrong data. Use a stable, unique id instead."
      />
    </LessonLayout>
  );
}
