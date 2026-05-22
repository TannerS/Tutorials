import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactHooks() {
  return (
    <LessonLayout
      title="React Hooks Deep Dive"
      sectionId="react19"
      lessonIndex={2}
      prev={{ path: "/react19/lifecycle-sim", label: "Lifecycle Simulator" }}
      next={{ path: "/react19/state", label: "State Management" }}
    >
      <p>Hooks let you use state and other React features in function components. React 19 provides 15+ built-in hooks covering state, effects, context, refs, and performance.</p>

      <h2>State Hooks</h2>
      <CodeBlock language="jsx" title="useState and useReducer">
{`// useState — simple state
const [count, setCount] = useState(0);
const [user, setUser]   = useState({ name: "", age: 0 });

// Functional update — safe when new state depends on old
setCount(prev => prev + 1);

// Object state — always spread to avoid mutation
setUser(prev => ({ ...prev, name: "Alice" }));

// Lazy initializer — expensive computation runs only once
const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("items") ?? "[]"));

// useReducer — for complex state logic
const initialState = { count: 0, step: 1 };
function reducer(state, action) {
    switch (action.type) {
        case "increment": return { ...state, count: state.count + state.step };
        case "decrement": return { ...state, count: state.count - state.step };
        case "setStep":   return { ...state, step: action.payload };
        case "reset":     return initialState;
        default:          throw new Error("Unknown action: " + action.type);
    }
}
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: "increment" });
dispatch({ type: "setStep", payload: 5 });`}
      </CodeBlock>

      <h2>Effect Hooks</h2>
      <CodeBlock language="jsx" title="useEffect and useLayoutEffect">
{`// useEffect — async, after paint
useEffect(() => {
    const handler = () => console.log("resize");
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler); // cleanup!
}, []); // empty array = run once on mount, cleanup on unmount

// useEffect with dependency
useEffect(() => {
    document.title = "You clicked " + count + " times";
}, [count]); // run whenever count changes

// useLayoutEffect — sync, before paint (use for DOM measurements)
useLayoutEffect(() => {
    const height = ref.current?.getBoundingClientRect().height;
    setContainerHeight(height);
}, []);`}
      </CodeBlock>

      <h2>Ref Hooks</h2>
      <CodeBlock language="jsx" title="useRef and useImperativeHandle">
{`// useRef — DOM reference
const inputRef = useRef(null);
const focusInput = () => inputRef.current?.focus();
return <input ref={inputRef} />;

// useRef — mutable value that does NOT trigger re-render
const renderCount = useRef(0);
useEffect(() => { renderCount.current++; }); // no re-render!

// useRef — store previous value
const prevCount = useRef(count);
useEffect(() => { prevCount.current = count; }); // after render

// useImperativeHandle — expose custom methods to parent
const FancyInput = forwardRef((props, ref) => {
    const inputRef = useRef(null);
    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => { if (inputRef.current) inputRef.current.value = ""; },
    }));
    return <input ref={inputRef} {...props} />;
});`}
      </CodeBlock>

      <h2>Context and Performance Hooks</h2>
      <CodeBlock language="jsx" title="useMemo, useCallback, useContext">
{`// useContext — subscribe to a context
const theme = useContext(ThemeContext);

// useMemo — memoize expensive computation
const sortedList = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items] // only recompute when items changes
);

// useCallback — stable function reference (avoid child re-renders)
const handleSubmit = useCallback((data) => {
    api.post("/submit", data).then(onSuccess);
}, [onSuccess]); // only recreate when onSuccess changes

// useDeferredValue — React 18+ — defer non-urgent updates
const deferred = useDeferredValue(searchQuery);
// deferred lags behind searchQuery, keeping UI responsive

// useTransition — mark updates as non-urgent
const [isPending, startTransition] = useTransition();
const handleSearch = (q) => {
    startTransition(() => setResults(search(q))); // non-urgent
};`}
      </CodeBlock>

      <InfoBox variant="tip" title="Rules of Hooks">
        <p>Only call hooks at the top level of a function component or custom hook — never inside loops, conditions, or nested functions. React relies on the order of hook calls to track state correctly between renders.</p>
      </InfoBox>

      <InteractiveChallenge
        question="When should you use useReducer over useState?"
        options={["Never — useState is always better", "When state is complex with multiple sub-values or when next state depends on the previous in non-trivial ways", "When the component is large", "Only in class components"]}
        correctIndex={1}
        explanation="useReducer is preferred when: state has multiple related values that update together, when the next state depends on the previous in complex ways, or when you want to co-locate state logic. It also makes state transitions more testable since reducers are pure functions."
      />
    </LessonLayout>
  );
}
