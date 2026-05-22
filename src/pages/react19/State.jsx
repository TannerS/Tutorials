import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactState() {
  return (
    <LessonLayout
      title="State Management"
      sectionId="react19"
      lessonIndex={3}
      prev={{ path: "/react19/hooks", label: "React Hooks Deep Dive" }}
      next={{ path: "/react19/effects", label: "Side Effects & useEffect" }}
    >
      <p>State is the core of React interactivity. Understanding batching, immutability, and the relationship between local state and derived values is essential.</p>

      <h2>State Fundamentals</h2>
      <CodeBlock language="jsx" title="State Rules and Patterns">
{`// State triggers re-render — plain variables do not
function Counter() {
    let count = 0;                    // WRONG: won't re-render
    const [count, setCount] = useState(0); // CORRECT

    // WRONG: direct mutation
    const addItem = () => { items.push(newItem); setItems(items); };
    // CORRECT: create new array
    const addItem = () => setItems([...items, newItem]);

    // WRONG: update and read in same render
    setCount(count + 1);
    console.log(count); // still old value! State updates are async

    // CORRECT: functional update for sequential changes
    setCount(c => c + 1);
    setCount(c => c + 1); // both apply: count += 2
}`}
      </CodeBlock>

      <h2>Immutable State Updates</h2>
      <CodeBlock language="jsx" title="Updating Nested State">
{`const [form, setForm] = useState({ name: "", address: { city: "", zip: "" } });

// Update nested object — must spread at each level
const updateCity = (city) => setForm(prev => ({
    ...prev,
    address: { ...prev.address, city }
}));

// Arrays — never mutate directly
const [todos, setTodos] = useState([]);

// Add
setTodos(prev => [...prev, { id: Date.now(), text, done: false }]);

// Remove
setTodos(prev => prev.filter(t => t.id !== id));

// Update one item
setTodos(prev => prev.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
));

// Reorder
setTodos(prev => {
    const next = [...prev];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
});`}
      </CodeBlock>

      <h2>Derived State vs Stored State</h2>
      <CodeBlock language="jsx" title="Avoid Redundant State">
{`// BAD: redundant state — derives from existing state
const [items, setItems] = useState([]);
const [count, setCount] = useState(0); // redundant!
// count is always items.length

// GOOD: derive it
const count = items.length; // no state needed

// BAD: mirroring props in state
function Component({ initialName }) {
    const [name, setName] = useState(initialName); // stale on prop change!
}

// GOOD: use prop directly, or use key to reset
function Component({ name }) {
    return <div>{name}</div>; // just use the prop
}

// BAD: storing computed values in state
const [fullName, setFullName] = useState(first + " " + last);

// GOOD: compute on every render (or useMemo for expensive ones)
const fullName = first + " " + last;`}
      </CodeBlock>

      <FlowChart
        title="When to Use Which State Solution"
        chart={"graph TD\n  A[Need state?] --> B{Shared across components?}\n  B --> |No - single component| C[useState or useReducer]\n  B --> |Yes - nearby components| D[Lift state up]\n  B --> |Yes - distant components| E{How often changes?}\n  E --> |Rarely - theme/user| F[Context + useContext]\n  E --> |Frequently| G[State library - Zustand/Redux]"}
      />

      <InteractiveChallenge
        question="What happens when you call setState multiple times in the same event handler in React 19?"
        options={["Three separate re-renders occur", "All updates are batched into a single re-render", "Only the last setState call takes effect", "React throws an error"]}
        correctIndex={1}
        explanation="React 19 (and React 18+) automatically batches ALL state updates — even those in setTimeout, Promises, and native event handlers — into a single re-render. This is a performance improvement over React 17 which only batched updates in React event handlers."
      />
    </LessonLayout>
  );
}
