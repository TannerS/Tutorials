import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactCHooks() {
  return (
    <LessonLayout
      title="React Hooks Cheat Sheet"
      sectionId="react-cheatsheet"
      lessonIndex={0}
      prev={{ path: "/java-cheatsheet/annotations", label: "Annotations Cheat Sheet" }}
      next={{ path: "/react-cheatsheet/patterns", label: "React Patterns Cheat Sheet" }}
    >
      <p>Quick reference for all React hooks — when to use each one, with concise examples.</p>

      <h2>All Hooks at a Glance</h2>
      <CodeBlock language="jsx" title="React Hooks Reference">
{`// === STATE ===
const [value, setValue] = useState(initialValue);
const [state, dispatch] = useReducer(reducerFn, initialState);

// === EFFECTS ===
useEffect(() => {
  // Runs after render
  return () => { /* cleanup */ };
}, [deps]);       // [] = mount only, [dep] = when dep changes, omit = every render

useLayoutEffect(() => { /* before browser paint */ }, [deps]);
useInsertionEffect(() => { /* before DOM mutations, for CSS-in-JS */ }, [deps]);

// === REFS ===
const ref = useRef(initialValue);   // ref.current = mutable, no re-render
const cb  = useCallback(fn, [deps]);  // memoize function reference
const val = useMemo(() => expensive(), [deps]);  // memoize computed value

// === CONTEXT ===
const value = useContext(MyContext);

// === TRANSITIONS (React 18+) ===
const [isPending, startTransition] = useTransition();
startTransition(() => setSlowState(newValue)); // mark as non-urgent

const deferredValue = useDeferredValue(value); // defer re-renders

// === IMPERATIVE ===
useImperativeHandle(ref, () => ({ focus, scroll }), []);

// === DEBUG ===
useDebugValue(label);  // custom label in React DevTools

// === IDs (React 18+) ===
const id = useId();  // stable unique ID for accessibility (label htmlFor)

// === SYNC EXTERNAL STORE (React 18+) ===
const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

// === OPTIMISTIC UI (React 19) ===
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);

// === ACTIONS (React 19) ===
const [state, formAction, isPending] = useActionState(actionFn, initialState);`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Common Custom Hooks">
{`// useLocalStorage
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initialValue; }
    catch { return initialValue; }
  });
  const set = useCallback(v => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  return [value, set];
}

// useDebounce
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// useOnClickOutside
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = e => { if (!ref.current?.contains(e.target)) handler(e); };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="When should you use useLayoutEffect instead of useEffect?"
        options={["When the effect doesn't need cleanup", "When you need to read or modify the DOM synchronously before the browser paints to avoid visual flicker", "When the effect runs on every render", "When the effect depends on a ref"]}
        correctIndex={1}
        explanation="useLayoutEffect fires synchronously after DOM mutations but before the browser paints. Use it when you need to measure DOM nodes or make DOM changes that would cause visual flicker if deferred (e.g., setting scroll position, measuring element size for positioning a tooltip). For everything else, prefer useEffect."
      />

    </LessonLayout>
  );
}
