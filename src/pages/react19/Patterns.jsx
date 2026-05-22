import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Patterns() {
  return (
    <LessonLayout
      title="Advanced Patterns"
      sectionId="react19"
      lessonIndex={8}
      prev={{ path: '/react19/server', label: 'Server Components & Actions' }}
      next={{ path: '/react19/typescript', label: 'React + TypeScript' }}
    >
      <p>These patterns solve recurring composition and flexibility challenges. Knowing when to apply each pattern—and when simpler approaches suffice—distinguishes senior React developers.</p>

      <h2>Pattern Selection Guide</h2>

      <FlowChart
        title="Choosing the Right Pattern"
        chart={"graph TD\n  A[Need flexible component API?] --> B{Who controls behavior?}\n  B -->|Consumer controls| C{Complex shared state?}\n  C -->|Yes| D[Compound Components]\n  C -->|No| E[Render Props or Slots]\n  B -->|Component controls| F{Need to enhance existing?}\n  F -->|Yes| G[Higher-Order Component]\n  F -->|No| H[Custom Hook]\n  I[Need UI-less logic?] --> J[Headless Component / Custom Hook]\n  K[Need controlled + uncontrolled?] --> L[State Reducer Pattern]"}
      />

      <h2>Compound Components</h2>

      <InfoBox variant="info" title="When to Use Compound Components">
        <p>Use when multiple components work together as a unit and share implicit state. Think <code>&lt;Select&gt; + &lt;Option&gt;</code>, <code>&lt;Tabs&gt; + &lt;Tab&gt; + &lt;TabPanel&gt;</code>, or <code>&lt;Accordion&gt; + &lt;AccordionItem&gt;</code>. The parent manages state; children communicate through context.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Compound Components — Tabs Example" showLineNumbers>
{`// Internal context for tab state
const TabsContext = createContext(null);

function Tabs({ defaultValue, children }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const contextValue = useMemo(
    () => ({ activeTab, setActiveTab }),
    [activeTab]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div role="tablist">{children}</div>
    </TabsContext.Provider>
  );
}

function TabTrigger({ value, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

function TabContent({ value, children }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <div role="tabpanel">{children}</div>;
}

// Attach sub-components for clean API
Tabs.Trigger = TabTrigger;
Tabs.Content = TabContent;

// Usage — clean, declarative, flexible
<Tabs defaultValue="code">
  <Tabs.Trigger value="code">Code</Tabs.Trigger>
  <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
  <Tabs.Content value="code"><CodeEditor /></Tabs.Content>
  <Tabs.Content value="preview"><Preview /></Tabs.Content>
</Tabs>`}
      </CodeBlock>

      <h2>Render Props (Still Useful)</h2>

      <CodeBlock language="jsx" title="Render Props for Flexible Rendering" showLineNumbers>
{`// Render prop: component delegates rendering to the consumer
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return render(position); // Consumer decides what to render
}

// Usage — different UIs, same logic
<MouseTracker render={({ x, y }) => <Crosshair x={x} y={y} />} />
<MouseTracker render={({ x, y }) => <Tooltip x={x} y={y} text="Follow me" />} />

// Modern equivalent: custom hook (usually preferred)
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return position;
}

// When render props still win over hooks:
// 1. You need to prevent rendering when not visible (hooks always run)
// 2. Library provides render prop API (e.g., Downshift, React Spring)
// 3. You want to scope logic to a subtree without a wrapper component`}
      </CodeBlock>

      <h2>Controlled vs Uncontrolled — The Hybrid Pattern</h2>

      <CodeBlock language="jsx" title="Supporting Both Controlled and Uncontrolled Usage" showLineNumbers>
{`// A component that works both controlled and uncontrolled
function Dropdown({ value: controlledValue, defaultValue, onChange, options }) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');

  // Determine if controlled
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (newValue) => {
    if (!isControlled) {
      setInternalValue(newValue); // Update internal state
    }
    onChange?.(newValue); // Always notify parent
  };

  return (
    <select value={value} onChange={e => handleChange(e.target.value)}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// Uncontrolled — component manages its own state
<Dropdown defaultValue="a" options={opts} onChange={console.log} />

// Controlled — parent manages state
const [selected, setSelected] = useState('a');
<Dropdown value={selected} onChange={setSelected} options={opts} />`}
      </CodeBlock>

      <h2>State Reducer Pattern</h2>

      <CodeBlock language="jsx" title="State Reducer — Consumer Overrides Internal Logic" showLineNumbers>
{`// Let consumers override state transitions — maximum flexibility
function useToggle({ reducer = defaultReducer } = {}) {
  const [state, dispatch] = useReducer(reducer, { on: false });

  const toggle = () => dispatch({ type: 'TOGGLE' });
  const setOn = () => dispatch({ type: 'ON' });
  const setOff = () => dispatch({ type: 'OFF' });

  return { on: state.on, toggle, setOn, setOff, dispatch };
}

function defaultReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE': return { on: !state.on };
    case 'ON': return { on: true };
    case 'OFF': return { on: false };
    default: return state;
  }
}

// Consumer can override behavior:
function App() {
  // Custom reducer: prevent toggling off more than 3 times
  const offCount = useRef(0);

  const customReducer = (state, action) => {
    if (action.type === 'TOGGLE' && state.on) {
      if (offCount.current >= 3) return state; // Block!
      offCount.current++;
    }
    return defaultReducer(state, action);
  };

  const { on, toggle } = useToggle({ reducer: customReducer });
  return <Switch on={on} onClick={toggle} />;
}`}
      </CodeBlock>

      <h2>Headless Components</h2>

      <InfoBox variant="tip" title="Headless = Logic Without UI">
        <p>Headless components (or hooks) provide behavior, state management, and accessibility — but zero styling or DOM structure. Libraries like Radix UI, Headless UI, and Downshift use this pattern. You get all the complex logic (keyboard nav, ARIA, focus management) with complete visual control.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="Headless Combobox Hook Pattern" showLineNumbers>
{`// Headless hook provides all logic, consumer provides all UI
function useCombobox({ items, onSelect }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filtered = items.filter(item =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  const getInputProps = () => ({
    value: query,
    onChange: (e) => { setQuery(e.target.value); setIsOpen(true); },
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown') setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
      if (e.key === 'ArrowUp') setHighlightedIndex(i => Math.max(i - 1, 0));
      if (e.key === 'Enter') { onSelect(filtered[highlightedIndex]); setIsOpen(false); }
      if (e.key === 'Escape') setIsOpen(false);
    },
    role: 'combobox',
    'aria-expanded': isOpen,
  });

  const getItemProps = (index) => ({
    onClick: () => { onSelect(filtered[index]); setIsOpen(false); },
    'aria-selected': index === highlightedIndex,
    role: 'option',
  });

  return { getInputProps, getItemProps, filtered, isOpen, highlightedIndex };
}

// Consumer has full control over rendering
function MyCombobox() {
  const { getInputProps, getItemProps, filtered, isOpen } = useCombobox({
    items: ['React', 'Vue', 'Angular', 'Svelte'],
    onSelect: (item) => console.log('Selected:', item),
  });

  return (
    <div className="my-custom-styles">
      <input {...getInputProps()} className="my-input" />
      {isOpen && (
        <ul className="my-dropdown">
          {filtered.map((item, i) => (
            <li key={item} {...getItemProps(i)}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="You're building a reusable Accordion component. Users need to control which panels are open, customize panel headers, and have multiple panels open simultaneously. Which pattern fits best?"
        options={[
          "Higher-Order Component wrapping each panel",
          "Render props on the Accordion root",
          "Compound Components with shared context",
          "A single component with many configuration props"
        ]}
        correctIndex={2}
        explanation="Compound Components shine here: Accordion manages open/close state in context, AccordionItem reads that context to show/hide. Users compose panels declaratively, control order and content freely, and the shared context handles coordination. This avoids prop explosion and gives maximum layout flexibility."
        language="jsx"
      />
    </LessonLayout>
  );
}
