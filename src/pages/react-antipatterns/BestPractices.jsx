import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function BestPractices() {
  return (
    <LessonLayout
      title="Best Practices Checklist"
      sectionId="react-antipatterns"
      lessonIndex={5}
      prev={{ path: '/react-antipatterns/components', label: 'Component Anti-Patterns' }}
      next={null}
    >
      <InfoBox variant="success" title="Congratulations!">
        <p>
          You have reached the final lesson in the React Anti-Patterns section.
          This page consolidates everything into an actionable checklist you can
          reference during code reviews and daily development.
        </p>
      </InfoBox>

      {/* ── DO's ─────────────────────────────────────────────── */}

      <h2>✅ Best Practices — The DO List</h2>

      <h3>1. Use Composition Over Inheritance</h3>

      <p>
        React is built around composition. Prefer small, composable pieces over
        deep class hierarchies.
      </p>

      <CodeBlock language="jsx" title="Composition Pattern">
        {`// ✅ Good — compose behaviour with wrapper components
function Card({ header, children, footer }) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

function UserCard({ user }) {
  return (
    <Card
      header={<Avatar src={user.avatar} />}
      footer={<FollowButton userId={user.id} />}
    >
      <h3>{user.name}</h3>
      <p>{user.bio}</p>
    </Card>
  );
}`}
      </CodeBlock>

      <h3>2. Keep Components Small and Focused</h3>

      <InfoBox variant="tip" title="Single Responsibility">
        <p>
          A component should ideally do one thing. If you find yourself adding
          comments like <code>// handle search</code> and{' '}
          <code>// handle pagination</code> inside the same component, it is
          time to split.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Small, Focused Components">
        {`// ✅ Good — each component owns one concern
function SearchBar({ query, onChange }) {
  return (
    <input
      type="search"
      value={query}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search"
    />
  );
}

function ResultsList({ items }) {
  if (items.length === 0) return <EmptyState />;
  return (
    <ul role="list">
      {items.map((item) => (
        <ResultItem key={item.id} item={item} />
      ))}
    </ul>
  );
}

function SearchPage() {
  const { query, setQuery, results } = useSearch();
  return (
    <main>
      <SearchBar query={query} onChange={setQuery} />
      <ResultsList items={results} />
    </main>
  );
}`}
      </CodeBlock>

      <h3>3. Use Custom Hooks for Reusable Logic</h3>

      <CodeBlock language="jsx" title="Extracting Logic into Custom Hooks">
        {`// ✅ Good — reusable, testable logic in a custom hook
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function useSearch(endpoint) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(\`\${endpoint}?q=\${encodeURIComponent(debouncedQuery)}\`)
      .then((res) => res.json())
      .then(setResults)
      .finally(() => setLoading(false));
  }, [debouncedQuery, endpoint]);

  return { query, setQuery, results, loading };
}`}
      </CodeBlock>

      <h3>4. Use TypeScript for Type Safety</h3>

      <CodeBlock language="jsx" title="TypeScript Interfaces for Props">
        {`// ✅ Good — explicit prop types catch bugs at compile time
interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  onFollow: (userId: string) => void;
  variant?: 'compact' | 'full';
}

function UserCard({ user, onFollow, variant = 'full' }: UserCardProps) {
  return (
    <article className={\`user-card user-card--\${variant}\`}>
      <img src={user.avatar ?? '/default-avatar.png'} alt="" />
      <h3>{user.name}</h3>
      {variant === 'full' && <p>{user.email}</p>}
      <button onClick={() => onFollow(user.id)}>Follow</button>
    </article>
  );
}`}
      </CodeBlock>

      <h3>5. Embrace React 19 Features</h3>

      <InfoBox variant="info" title="React 19 Highlights">
        <p>
          React 19 introduces <code>use()</code> for reading promises and
          context, <strong>Actions</strong> for async transitions, and{' '}
          <code>useOptimistic</code> for instant UI feedback.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="React 19 — use(), Actions, useOptimistic">
        {`// ✅ use() — read a promise directly in render
import { use, useOptimistic, useTransition } from 'react';

function UserProfile({ userPromise }) {
  const user = use(userPromise); // suspends until resolved
  return <h1>{user.name}</h1>;
}

// ✅ Actions + useOptimistic for instant feedback
function LikeButton({ postId, initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLikes, addOptimistic] = useOptimistic(
    likes,
    (current, delta) => current + delta
  );
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    startTransition(async () => {
      addOptimistic(1);
      const updated = await likePost(postId);
      setLikes(updated.likes);
    });
  }

  return (
    <button onClick={handleLike} disabled={isPending}>
      ♥ {optimisticLikes}
    </button>
  );
}`}
      </CodeBlock>

      <h3>6. Test Components with React Testing Library</h3>

      <CodeBlock language="jsx" title="Testing Best Practices">
        {`// ✅ Good — test behaviour, not implementation
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submits the form with valid data', async () => {
  const onSubmit = vi.fn();
  render(<ContactForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/name/i), 'Ada Lovelace');
  await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com');
  await userEvent.click(screen.getByRole('button', { name: /send/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
  });
});

test('shows validation error for empty name', async () => {
  render(<ContactForm onSubmit={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /send/i }));
  expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i);
});`}
      </CodeBlock>

      {/* ── DON'Ts ────────────────────────────────────────────── */}

      <h2>🚫 Anti-Patterns — The DON&apos;T List</h2>

      <h3>1. Don&apos;t Store Derived State</h3>

      <CodeBlock language="jsx" title="Derived State Anti-Pattern">
        {`// ❌ Bad — storing what can be computed
function FilteredList({ items }) {
  const [filter, setFilter] = useState('');
  const [filtered, setFiltered] = useState(items); // redundant!

  useEffect(() => {
    setFiltered(items.filter((i) => i.name.includes(filter)));
  }, [items, filter]);

  return <List items={filtered} />;
}

// ✅ Good — derive during render
function FilteredList({ items }) {
  const [filter, setFilter] = useState('');
  const filtered = useMemo(
    () => items.filter((i) => i.name.includes(filter)),
    [items, filter]
  );

  return <List items={filtered} />;
}`}
      </CodeBlock>

      <h3>2. Don&apos;t Use useEffect for Synchronization</h3>

      <InfoBox variant="warning" title="You Might Not Need an Effect">
        <p>
          If you are using <code>useEffect</code> only to keep two pieces of
          state in sync, you are doing extra work. Compute the value inline or
          use an event handler instead.
        </p>
      </InfoBox>

      <h3>3. Don&apos;t Mutate State Directly</h3>

      <CodeBlock language="jsx" title="State Mutation Anti-Pattern">
        {`// ❌ Bad — mutating the existing array
function TodoList() {
  const [todos, setTodos] = useState([]);

  function addTodo(text) {
    todos.push({ id: crypto.randomUUID(), text }); // mutation!
    setTodos(todos); // same reference — React skips re-render
  }

  // ✅ Good — always create a new reference
  function addTodoCorrectly(text) {
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text }]);
  }
}`}
      </CodeBlock>

      <h3>4. Don&apos;t Ignore Accessibility</h3>

      <InfoBox variant="danger" title="Accessibility Is Not Optional">
        <p>
          Every interactive element needs keyboard support, proper ARIA
          attributes, and visible focus indicators. Use semantic HTML first —
          reach for ARIA only when native elements are insufficient.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Accessible Component Example">
        {`// ✅ Good — semantic HTML + ARIA where needed
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">{title}</h2>
      <div>{children}</div>
      <button onClick={onClose} aria-label="Close dialog">
        ✕
      </button>
    </div>
  );
}`}
      </CodeBlock>

      <h3>5. Don&apos;t Over-Optimize Prematurely</h3>

      <InfoBox variant="note" title="Measure First, Optimize Second">
        <p>
          Wrapping every component in <code>React.memo</code> or every function
          in <code>useCallback</code> adds complexity without measurable gain.
          Use the React DevTools Profiler to identify real bottlenecks before
          optimizing.
        </p>
      </InfoBox>

      {/* ── Ideal Component Structure ────────────────────────── */}

      <h2>Ideal React Component Structure</h2>

      <p>
        Follow this mental model when building or reviewing any component:
      </p>

      <FlowChart
        title="Ideal React Component Structure"
        chart={"graph TD\nA[Props & Types] --> B[Hooks & State]\nB --> C[Derived Values]\nC --> D[Event Handlers]\nD --> E[Early Returns / Guards]\nE --> F[JSX Return]\nF --> G[Accessible Markup]\nG --> H[Composed Children]"}
      />

      <InfoBox variant="question" title="Why This Order?">
        <p>
          Placing hooks at the top satisfies the Rules of Hooks. Deriving values
          next avoids redundant state. Handlers before JSX keeps the return
          block clean. Early returns prevent deeply nested conditionals.
        </p>
      </InfoBox>

      {/* ── Code Review Checklist ─────────────────────────────── */}

      <h2>React Code Review Checklist</h2>

      <p>
        Copy this checklist into your PR template or keep it handy during code
        reviews:
      </p>

      <CodeBlock language="jsx" title="React Code Review Checklist">
        {`/*
 * ═══════════════════════════════════════════════════════════
 *  REACT CODE REVIEW CHECKLIST
 * ═══════════════════════════════════════════════════════════
 *
 *  COMPONENT DESIGN
 *  ☐ Single responsibility — component does one thing well
 *  ☐ Props are minimal and well-typed (TypeScript interfaces)
 *  ☐ No prop drilling beyond 2 levels (use Context or composition)
 *  ☐ Composition over inheritance — no class extends Component chains
 *  ☐ Components are < 150 lines; extract sub-components if larger
 *
 *  STATE MANAGEMENT
 *  ☐ No derived state stored in useState
 *  ☐ State lives at the lowest common ancestor
 *  ☐ State updates are immutable (no push/splice on arrays)
 *  ☐ Complex state uses useReducer instead of multiple useStates
 *  ☐ Server state managed by React Query / SWR, not manual useEffect
 *
 *  HOOKS
 *  ☐ Hooks called at the top level (not inside conditions/loops)
 *  ☐ Custom hooks extracted for reusable logic
 *  ☐ useEffect has correct dependency arrays
 *  ☐ useEffect cleanup functions prevent memory leaks
 *  ☐ No useEffect for state synchronisation — derive instead
 *
 *  PERFORMANCE
 *  ☐ Lists use stable, unique keys (not array index)
 *  ☐ useMemo/useCallback used only where profiling shows a need
 *  ☐ Large lists use virtualisation (react-window / tanstack-virtual)
 *  ☐ Lazy loading for route-level code splitting
 *  ☐ Images use loading="lazy" and explicit width/height
 *
 *  ACCESSIBILITY
 *  ☐ Semantic HTML elements used (button, nav, main, article)
 *  ☐ All images have meaningful alt text (or alt="" for decorative)
 *  ☐ Form inputs have associated <label> elements
 *  ☐ Interactive custom components are keyboard navigable
 *  ☐ Focus management handled for modals and route changes
 *  ☐ Colour contrast meets WCAG AA (4.5:1 for text)
 *
 *  TESTING
 *  ☐ Tests assert behaviour, not implementation details
 *  ☐ Queries use accessible selectors (getByRole, getByLabelText)
 *  ☐ Async operations use findBy* or waitFor
 *  ☐ Edge cases covered (empty state, error state, loading state)
 *  ☐ No snapshot tests for complex components
 *
 *  REACT 19 READINESS
 *  ☐ use() for reading promises / context where appropriate
 *  ☐ Actions (useTransition) for async state updates
 *  ☐ useOptimistic for instant UI feedback
 *  ☐ No deprecated APIs (findDOMNode, legacy context, string refs)
 *  ☐ Compatible with React Compiler (no non-standard mutations)
 *
 * ═══════════════════════════════════════════════════════════
 */`}
      </CodeBlock>

      {/* ── Final Challenge ───────────────────────────────────── */}

      <h2>Final Challenge</h2>

      <InfoBox variant="info" title="Section Recap">
        <p>
          This question tests everything you have learned across the entire
          React Anti-Patterns section — state management, effects, component
          design, and modern best practices.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"A component stores a filtered list in useState and keeps it in sync with the source array via useEffect. A colleague suggests replacing this with useMemo to derive the filtered list. Which combination of best practices does this refactoring align with?"}
        options={[
          "Avoid derived state + avoid unnecessary effects",
          "Use composition over inheritance + keep components small",
          "Use TypeScript for type safety + test with React Testing Library",
          "Embrace React 19 features + avoid premature optimisation"
        ]}
        correctIndex={0}
        explanation="Replacing a useState + useEffect synchronisation pair with useMemo eliminates derived state and removes an unnecessary effect. This aligns with two core best practices: never store values that can be computed, and avoid useEffect for keeping state in sync."
      />
    </LessonLayout>
  );
}
