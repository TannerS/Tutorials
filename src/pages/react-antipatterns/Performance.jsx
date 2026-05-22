import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AntiPatternsPerf() {
  return (
    <LessonLayout
      title="Performance Anti-Patterns"
      sectionId="react-antipatterns"
      lessonIndex={3}
      prev={{ path: "/react-antipatterns/effects", label: "Effects Anti-Patterns" }}
      next={{ path: "/react-antipatterns/components", label: "Component Anti-Patterns" }}
    >
      <p>React is fast by default, but certain patterns defeat its optimizations. Performance anti-patterns usually involve breaking referential equality — React uses Object.is comparison to detect changes, so new references equal re-renders.</p>

      <h2>Anti-Pattern 1: New Objects/Arrays as Props</h2>

      <CodeBlock language="jsx" title="Inline Objects and Arrays Break Memo">
{`// ANTI-PATTERN: Inline objects/arrays create new references every render
const MemoList = React.memo(({ style, items }) => { ... });

function Parent() {
  return (
    // New {} and [] created on EVERY render of Parent
    <MemoList
      style={{ color: 'red', padding: 8 }}  // new object every render
      items={[1, 2, 3]}                     // new array every render
    />
    // React.memo is completely defeated — MemoList always re-renders
  );
}

// CORRECT: Define outside component or memoize
const LIST_STYLE = { color: 'red', padding: 8 };  // defined once, module scope
const DEFAULT_ITEMS = [1, 2, 3];

function Parent() {
  // OR memoize dynamic values:
  const style = useMemo(() => ({ color: theme.primary, padding: 8 }), [theme.primary]);
  const items = useMemo(() => computeItems(data), [data]);
  return <MemoList style={style} items={items} />;
}`}
      </CodeBlock>

      <h2>Anti-Pattern 2: Over-Using useMemo/useCallback</h2>

      <CodeBlock language="jsx" title="Premature Memoization Costs">
{`// ANTI-PATTERN: Memoizing everything "just in case"
function SimpleComponent({ name }) {
  // useMemo on a string concatenation? The memoization costs MORE than the computation
  const displayName = useMemo(() => name.toUpperCase(), [name]);

  // useCallback for an event handler that doesn't flow to a memoized child
  const handleClick = useCallback(() => console.log('clicked'), []);

  return <button onClick={handleClick}>{displayName}</button>;
}

// WHEN to actually memoize:
// useMemo: expensive computations (sorting 10,000 items, complex math)
// useCallback: stable function reference needed by React.memo child or useEffect dep

// Rule of thumb:
// - Profile first with React DevTools
// - Memoize AFTER measuring, not before
// - Simple string/number operations: never memoize
// - Object/array creation for memoized children: memoize
// - Filtering/sorting large arrays: memoize with useMemo`}
      </CodeBlock>

      <h2>Anti-Pattern 3: Key Misuse</h2>

      <CodeBlock language="jsx" title="Keys — The Right and Wrong Way">
{`// ANTI-PATTERN 1: Index as key for dynamic lists
{items.map((item, index) => (
  <TodoItem key={index} item={item} />
  // When item deleted from middle: all subsequent items remount
  // Input state, animations, focus — all reset incorrectly
))}

// ANTI-PATTERN 2: Random keys — remounts on every render!
{items.map(item => (
  <TodoItem key={Math.random()} item={item} />  // remounts every render!
))}

// CORRECT: Stable, unique IDs
{items.map(item => (
  <TodoItem key={item.id} item={item} />  // React tracks identity correctly
))}

// USEFUL PATTERN: key to reset component state intentionally
// When you WANT a component to fully reset when a prop changes:
<UserProfileForm key={userId} userId={userId} />
// Changing userId forces a fresh mount — all state resets cleanly
// Better than syncing state with useEffect`}
      </CodeBlock>

      <FlowChart
        title="When to Memoize"
        chart={"graph TD\n  A[Should I memoize?] --> B{Is child wrapped in React.memo?}\n  B -- No --> C[Probably not needed]\n  B -- Yes --> D{Is prop a function?}\n  D -- Yes --> E[useCallback]\n  D -- No --> F{Is prop an object/array?}\n  F -- Yes --> G{Expensive to compute?}\n  G -- Yes --> H[useMemo]\n  G -- No --> I[useMemo only if\nchild is slow]\n  F -- No --> J[No memoization needed]"}
      />

      <InfoBox variant="note" title="Profiling First">
        <p>Before optimizing, use React DevTools Profiler to identify which components are actually slow. You may discover the bottleneck is a 3rd-party component, a large list without virtualization, or a specific re-render path. Profiling takes 5 minutes and prevents hours of premature optimization.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Why does passing an inline object as a prop defeat React.memo?"
        options={["React.memo doesn't work with object props", "A new object literal creates a new reference on every render, so shallow comparison always sees it as changed", "Objects are compared by value in JavaScript", "React.memo requires useMemo to work with objects"]}
        correctIndex={1}
        explanation="React.memo uses shallow comparison (Object.is). {} === {} is false in JavaScript — each object literal creates a new reference. So even if the contents are identical, React sees the prop as changed every render and re-renders the memoized component anyway."
      />

    </LessonLayout>
  );
}
