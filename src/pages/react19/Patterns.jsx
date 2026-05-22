import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactPatterns() {
  return (
    <LessonLayout
      title="React Patterns"
      sectionId="react19"
      lessonIndex={9}
      prev={{ path: "/react19/server", label: "Server Components" }}
      next={{ path: "/react19/typescript", label: "React with TypeScript" }}
    >
      <p>Advanced React patterns help you build reusable, composable components. Learn compound components, render props, HOCs, and the most modern pattern: custom hooks.</p>

      <h2>Compound Components</h2>
      <CodeBlock language="jsx" title="Compound Component Pattern">
{`// Compound components share state implicitly via context
// Usage: <Select> <Select.Option> without passing callbacks manually

const SelectContext = createContext(null);

function Select({ value, onChange, children }) {
    return (
        <SelectContext.Provider value={{ value, onChange }}>
            <div className="select">{children}</div>
        </SelectContext.Provider>
    );
}

Select.Option = function Option({ value: optValue, children }) {
    const { value, onChange } = useContext(SelectContext);
    const isSelected = value === optValue;
    return (
        <div
            className={"option" + (isSelected ? " selected" : "")}
            onClick={() => onChange(optValue)}
        >
            {children}
        </div>
    );
};

// Clean usage — no prop drilling
function App() {
    const [color, setColor] = useState("blue");
    return (
        <Select value={color} onChange={setColor}>
            <Select.Option value="red">Red</Select.Option>
            <Select.Option value="blue">Blue</Select.Option>
            <Select.Option value="green">Green</Select.Option>
        </Select>
    );
}`}
      </CodeBlock>

      <h2>Custom Hooks (Best Pattern)</h2>
      <CodeBlock language="jsx" title="Extracting Logic into Custom Hooks">
{`// Custom hooks extract and reuse stateful logic
function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const stored = window.localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialValue;
        } catch { return initialValue; }
    });

    const set = useCallback((newValue) => {
        setValue(newValue);
        window.localStorage.setItem(key, JSON.stringify(newValue));
    }, [key]);

    return [value, set];
}

function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

function useWindowSize() {
    const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    useEffect(() => {
        const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return size;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer Custom Hooks Over HOCs">
        <p>Custom hooks are the modern replacement for both HOCs (Higher-Order Components) and render props. They share logic without adding wrapper components to the tree, have no naming collision issues, and are easier to compose and test.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What makes compound components better than deeply nested prop-drilling?"
        options={["They use fewer components", "They share state via context, so consumers do not need to explicitly pass callbacks through every level", "They are faster to render", "They work without React"]}
        correctIndex={1}
        explanation="Compound components use React Context internally to share state between a parent and its sub-components. The consumer gets a clean, semantic API (<Select><Select.Option>) without managing callbacks or passing them through intermediate components."
      />
    </LessonLayout>
  );
}
