import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AntiPatternsIntro() {
  return (
    <LessonLayout
      title="React Anti-Patterns Overview"
      sectionId="react-antipatterns"
      lessonIndex={0}
      prev={{ path: "/patterns/realworld", label: "Real-World Patterns" }}
      next={{ path: "/react-antipatterns/state", label: "State Anti-Patterns" }}
    >
      <p>Anti-patterns are common solutions that seem reasonable at first but create problems as applications grow. Recognizing them early saves hours of debugging. React anti-patterns typically fall into four areas: state management mistakes, effect misuse, performance killers, and component design flaws.</p>

      <h2>Why Anti-Patterns Are Dangerous</h2>
      <p>Anti-patterns often work initially. A prop drilling chain of 4 components functions correctly — until you need to add a 5th level, at which point refactoring costs exceed the original time saved. Anti-patterns compound: one leads to another, making codebases progressively harder to maintain.</p>

      <FlowChart
        title="React Anti-Pattern Categories"
        chart={"graph TD\n  A[React Anti-Patterns] --> B[State]\n  A --> C[Effects]\n  A --> D[Performance]\n  A --> E[Components]\n  B --> F[Prop drilling]\n  B --> G[Derived state]\n  C --> H[Missing deps]\n  C --> I[Over-fetching]\n  D --> J[Anonymous fns]\n  D --> K[Key misuse]\n  E --> L[God components]\n  E --> M[Over-abstraction]"}
      />

      <h2>Most Common Anti-Patterns</h2>

      <CodeBlock language="jsx" title="Quick Reference — Anti-Patterns to Avoid">
{`// 1. Prop drilling (>2 levels)
<App user={user}>
  <Dashboard user={user}>
    <Header user={user}>
      <Avatar user={user} />  {/* user drilled 4 levels */}
    </Header>
  </Dashboard>
</App>
// Fix: Context, composition, or Zustand/Redux for shared state

// 2. Copying props to state
function Component({ initialCount }) {
  const [count, setCount] = useState(initialCount); // ANTI-PATTERN
  // If parent changes initialCount, state won't update
}
// Fix: Use the prop directly, or use a key to reset

// 3. useEffect for derived data
const [filtered, setFiltered] = useState([]);
useEffect(() => {
  setFiltered(items.filter(i => i.active)); // double render, unnecessary
}, [items]);
// Fix: const filtered = useMemo(() => items.filter(i => i.active), [items]);

// 4. Anonymous functions as props (breaks memo)
<Button onClick={() => handleClick(id)} />  // new fn every render
// Fix: const handleClick = useCallback((id) => { ... }, []);

// 5. Index as key (for reorderable/filterable lists)
{items.map((item, index) => <Item key={index} />)}  // broken reorder
// Fix: key={item.id} — always use stable, unique IDs

// 6. Missing cleanup in useEffect
useEffect(() => {
  const timer = setInterval(tick, 1000);
  // Missing: return () => clearInterval(timer);
}, []);`}
      </CodeBlock>

      <h2>The Cost of Each Anti-Pattern</h2>

      <CodeBlock language="jsx" title="Measuring the Impact">
{`// PROP DRILLING cost: every intermediate component re-renders
// when user changes, even if Dashboard doesn't use user

// DERIVED STATE cost:
// Parent renders → child renders → useEffect fires → setFiltered
// → child renders AGAIN (double render on every parent update)

// ANONYMOUS FUNCTION cost:
function List({ items, onDelete }) {
  return items.map(item => (
    // New function created every render → React.memo on ListItem is useless
    <ListItem key={item.id} onDelete={() => onDelete(item.id)} />
  ));
}

// KEY misuse cost:
// React destroys and recreates DOM nodes on reorder
// Component state (form inputs, scroll position) is lost
// Causes visual flicker and accessibility issues`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Detection Rule">
        <p>When a component becomes hard to test in isolation, it's likely doing too much (God Component anti-pattern). When adding a feature requires changes in 5+ files, you probably have prop drilling or wrong abstraction boundaries. When performance profiler shows a component re-rendering on every parent update, look for anonymous functions or missing memo.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the most common performance cost of using anonymous functions as props?"
        options={["They cause memory leaks", "They prevent React.memo from working because a new function reference is created every render", "They make components harder to test", "They prevent useCallback from working"]}
        correctIndex={1}
        explanation="React.memo bails out of re-rendering when props haven't changed. But anonymous functions () => {} create a new function object on every render, so the prop reference always changes, making React.memo ineffective. Use useCallback to memoize the function reference."
      />

    </LessonLayout>
  );
}
