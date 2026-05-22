import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactPerformance() {
  return (
    <LessonLayout
      title="Performance Optimization"
      sectionId="react19"
      lessonIndex={6}
      prev={{ path: "/react19/context", label: "Context API" }}
      next={{ path: "/react19/react19", label: "React 19 New Features" }}
    >
      <p>React is fast by default, but poorly written code can still cause unnecessary re-renders. Learn when and how to optimize — and crucially, when NOT to.</p>

      <h2>React.memo — Skip Re-renders</h2>
      <CodeBlock language="jsx" title="React.memo for Component Memoization">
{`// Without memo: re-renders every time parent renders (even with same props)
function ExpensiveChild({ items, onSelect }) {
    console.log("ExpensiveChild rendered");
    return <ul>{items.map(i => <li onClick={() => onSelect(i)}>{i}</li>)}</ul>;
}

// With memo: only re-renders when props change (shallow comparison)
const ExpensiveChild = React.memo(function ExpensiveChild({ items, onSelect }) {
    console.log("ExpensiveChild rendered");
    return <ul>{items.map(i => <li onClick={() => onSelect(i)}>{i}</li>)}</ul>;
});

// PROBLEM: if parent passes inline functions/objects, memo is useless!
function Parent() {
    const [count, setCount] = useState(0);
    return (
        <>
            <button onClick={() => setCount(c => c + 1)}>+ {count}</button>
            {/* BAD: creates new function on every render → memo skipped */}
            <ExpensiveChild items={[1,2,3]} onSelect={(i) => console.log(i)} />
        </>
    );
}`}
      </CodeBlock>

      <h2>useMemo and useCallback</h2>
      <CodeBlock language="jsx" title="Stabilizing References">
{`function Parent() {
    const [count, setCount] = useState(0);
    const [query, setQuery] = useState("");

    // useMemo: only recompute expensive value when inputs change
    const filteredItems = useMemo(
        () => hugeList.filter(item => item.name.includes(query)),
        [query] // not count — filter does not depend on count
    );

    // useCallback: stable function reference for memo'd children
    const handleSelect = useCallback((item) => {
        console.log("Selected:", item);
    }, []); // empty deps — never recreated

    return (
        <>
            <button onClick={() => setCount(c => c + 1)}>{count}</button>
            <input value={query} onChange={e => setQuery(e.target.value)} />
            {/* memo works now because handleSelect and filteredItems are stable */}
            <ExpensiveChild items={filteredItems} onSelect={handleSelect} />
        </>
    );
}`}
      </CodeBlock>

      <h2>When NOT to Optimize</h2>
      <InfoBox variant="warning" title="Premature Optimization">
        <p>useMemo and useCallback have a cost — they add complexity and the memoization itself takes time. Only add them when you have measured a performance problem. React.memo is worth adding to components that: (1) render frequently, (2) receive stable props, and (3) have expensive render logic.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="React Compiler (React 19)">
{`// React Compiler (released in React 19) automatically memoizes:
// - Components
// - useMemo values
// - useCallback functions

// With React Compiler, you can often remove manual memoization:
// BEFORE:
const value = useMemo(() => compute(input), [input]);
const handler = useCallback(() => doThing(dep), [dep]);

// AFTER (with React Compiler enabled):
const value = compute(input);   // compiler handles it
const handler = () => doThing(dep); // compiler handles it

// Enable in babel.config.js:
// plugins: [['babel-plugin-react-compiler', {}]]`}
      </CodeBlock>

      <InteractiveChallenge
        question="When should you wrap a value in useMemo?"
        options={["Always, for every computed value", "Never — React handles this automatically", "When the computation is expensive AND the component re-renders frequently with unchanged inputs", "Only when using TypeScript"]}
        correctIndex={2}
        explanation="useMemo is only worthwhile when the computation is genuinely expensive (complex sort/filter on large datasets) AND the component re-renders often with the same inputs. For simple calculations, the overhead of useMemo itself is larger than just recomputing the value."
      />
    </LessonLayout>
  );
}
