import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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
        {`function TodoList() {
  const [todos, setTodos] = useState([]);

  return (
    <ul>
      {todos.map((todo) => (
        <MemoizedTodoItem
          key={todo.id}
          todo={todo}
          // A new closure per row, per render. Even if only ONE todo changed,
          // every row gets a fresh onDelete/onToggle, so memo's shallow
          // comparison fails for all 500 rows and all 500 re-render.
          onDelete={() => setTodos((prev) => prev.filter((t) => t.id !== todo.id))}
          onToggle={() => setTodos((prev) => prev.map((t) =>
            t.id === todo.id ? { ...t, done: !t.done } : t))}
        />
      ))}
    </ul>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Why the Fix Is a Signature Change, Not a Wrapper">
        Notice what actually changed. You cannot fix the version above by wrapping
        those arrows in <code>useCallback</code> — they are created inside{' '}
        <code>.map()</code>, so there is one per row, and hooks cannot be called in a
        loop anyway. The closure over <code>todo.id</code> is the problem itself.
        <br />
        <br />
        The fix moves that argument across the boundary: the parent supplies one
        id-agnostic handler, and the child — which already knows its own{' '}
        <code>todo</code> — supplies the id at call time. The inline arrow does not
        disappear, it just relocates <em>inside</em> the memoized child, where
        creating it fresh costs nothing because that component is re-rendering
        anyway. Recognising which side of a memo boundary an allocation lands on is
        most of what performance work in React actually is.
      </InfoBox>

      <CodeBlock language="jsx" title="✅ GOOD — useCallback with stable identity">
        {`function TodoList() {
  const [todos, setTodos] = useState([]);

  // Note the shape change: the handler now takes an \`id\` parameter instead
  // of closing over one. That is what lets a SINGLE function instance serve
  // every row — the identity no longer varies per item.
  const handleDelete = useCallback((id) => {
    // The prev => updater is what makes [] a correct dep array: we never
    // read \`todos\` from the closure, so the callback never goes stale.
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
  // Unnecessary — this goes to a plain <button>. DOM elements are not
  // memoized components; React never compares their prop identity to decide
  // whether to re-render, so a stable handler buys literally nothing.
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
      {/* New function every render */}
      <SearchBar value={search} onChange={(value) => setSearch(value)} />
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
        {`// Every child that receives a stabilised prop must itself be memo'd,
// otherwise the useMemo/useCallback below is pure overhead. See §5.
const SearchBar = memo(function SearchBar({ value, onChange }) {
  // Contract: this component calls onChange(nextString), NOT onChange(event).
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
});

const CategoryFilter = memo(function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <select value={selected} onChange={(e) => onSelect(e.target.value)}>
      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
});

const StatsPanel = memo(function StatsPanel({ stats }) {
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
        <p style={{ marginBottom: 0 }}>
          That last point is why the &ldquo;optimized&rdquo; version had to add{' '}
          <code>memo</code> to <code>SearchBar</code> and <code>CategoryFilter</code>{' '}
          too. Had they stayed unmemoized, <code>handleCategorySelect</code>{' '}
          would have been dead weight — you would be paying for a dependency array to
          stabilise a prop that nothing ever compares.
        </p>
      </InfoBox>

      <InfoBox variant="question" title="Trace It: What Still Re-Renders When You Type?">
        Worth walking through, because &ldquo;fully optimized&rdquo; does not mean
        &ldquo;nothing re-renders.&rdquo; Type one character into the search box:
        <ul>
          <li>
            <code>search</code> changes, so <code>ProductDashboard</code> re-renders.
            Memoization never prevents a component from re-rendering due to{' '}
            <em>its own</em> state.
          </li>
          <li>
            <code>SearchBar</code> re-renders — its <code>value</code> prop genuinely
            changed. Correct and unavoidable.
          </li>
          <li>
            <code>filtered</code> is in <code>search</code>&apos;s dep list, so it
            recomputes and returns a new array. <code>stats</code> depends on{' '}
            <code>filtered</code>, so it recomputes too. Both{' '}
            <code>ProductGrid</code> and <code>StatsPanel</code> re-render.
          </li>
          <li>
            <code>CategoryFilter</code> is the one that is actually skipped: its three
            props are all unchanged and it is memoized.
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          So the entire elaborate setup saves exactly one small component on this
          interaction. That is the honest yield, and it is why{' '}
          <strong>§5 comes before this section</strong>: measure first. The
          memoization earns its keep here only if <code>ProductGrid</code> renders
          hundreds of cards and the category filter is expensive — otherwise the
          unoptimized version was fine and considerably easier to read.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="A Note on the React Compiler">
        Much of this lesson describes manual work that the React Compiler automates:
        it analyses your components and inserts the
        equivalent of <code>useMemo</code>/<code>useCallback</code>/<code>memo</code>{' '}
        for you, which is why you will see new codebases with almost no manual
        memoization.
        <br />
        <br />
        Get its status right, because it is widely misreported: the compiler shipped{' '}
        <strong>1.0 (stable)</strong>, but it is a <strong>separate build-time
        plugin</strong> (<code>babel-plugin-react-compiler</code>) versioned on its own
        track. It is <em>not</em> bundled with React 19, and upgrading React does not
        switch it on — a project adds it to its Babel/Vite config deliberately. So
        &ldquo;we are on React 19&rdquo; tells you nothing about whether this lesson&apos;s
        manual work is already being done for you; check the build config.
        <br />
        <br />
        Learn the manual version anyway, for two reasons. First, you will maintain
        pre-compiler code for years. Second — and this is the part that matters in
        interviews — the compiler can only memoize code that follows the Rules of
        React. Mutating props, writing to a ref during render, or reading state
        outside a hook all cause it to silently bail out on that component. Debugging
        &ldquo;why did the compiler skip this?&rdquo; requires exactly the model this
        lesson builds.
      </InfoBox>

      {/* ------------------------------------------------------------------ */}
      {/* Interactive Challenges                                              */}
      {/* ------------------------------------------------------------------ */}
      <h2>Test Your Knowledge</h2>

    </LessonLayout>
  );
}
