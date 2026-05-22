import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AntiPatternsState() {
  return (
    <LessonLayout
      title="State Anti-Patterns"
      sectionId="react-antipatterns"
      lessonIndex={1}
      prev={{ path: "/react-antipatterns/intro", label: "Anti-Patterns Overview" }}
      next={{ path: "/react-antipatterns/effects", label: "Effects Anti-Patterns" }}
    >
      <p>State management is where most React bugs originate. The core principle: state should be the minimal set of data that drives your UI. If it can be computed from other state or props, it should not be state.</p>

      <h2>Anti-Pattern 1: Derived State</h2>

      <CodeBlock language="jsx" title="Derived State — Before and After">
{`// ANTI-PATTERN: Storing derived data in state
function ProductList({ products }) {
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFiltered(
      products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);  // double render, stale state risk

  return (
    <>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      {filtered.map(p => <Product key={p.id} product={p} />)}
    </>
  );
}

// CORRECT: Compute during render, memoize if expensive
function ProductList({ products }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(
    () => products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  );

  return (
    <>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      {filtered.map(p => <Product key={p.id} product={p} />)}
    </>
  );
}`}
      </CodeBlock>

      <h2>Anti-Pattern 2: Prop Drilling</h2>

      <CodeBlock language="jsx" title="Prop Drilling vs Context">
{`// ANTI-PATTERN: Passing props through every level
function App() {
  const [user, setUser] = useState(null);
  return <Dashboard user={user} onUserChange={setUser} />;
}
function Dashboard({ user, onUserChange }) {
  return <Header user={user} onUserChange={onUserChange} />;  // just passing through
}
function Header({ user, onUserChange }) {
  return <Avatar user={user} onUserChange={onUserChange} />;  // just passing through
}
function Avatar({ user, onUserChange }) {
  return <img src={user.avatar} onClick={() => onUserChange(null)} />;  // uses it here
}

// CORRECT: Context for truly global/shared state
const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Dashboard />
    </UserContext.Provider>
  );
}
function Dashboard() { return <Header />; }  // no props
function Header()    { return <Avatar />; }  // no props
function Avatar() {
  const { user, setUser } = useContext(UserContext);  // takes what it needs
  return <img src={user.avatar} onClick={() => setUser(null)} />;
}`}
      </CodeBlock>

      <h2>Anti-Pattern 3: Copying Props to State</h2>

      <CodeBlock language="jsx" title="Stale State from Props">
{`// ANTI-PATTERN: Initializing state from prop, then ignoring prop changes
function EditableTitle({ title }) {
  const [localTitle, setLocalTitle] = useState(title);
  // BUG: if parent changes title prop, localTitle stays stale
  return <input value={localTitle} onChange={e => setLocalTitle(e.target.value)} />;
}

// FIX 1: Use a key to reset component when prop changes
function Parent() {
  const [title, setTitle] = useState("Hello");
  return <EditableTitle key={title} title={title} />;
  // When title changes, React remounts EditableTitle with fresh state
}

// FIX 2: Controlled component — parent owns the state
function EditableTitle({ title, onChange }) {
  return <input value={title} onChange={e => onChange(e.target.value)} />;
}

// FIX 3: useEffect to sync (last resort, usually a design smell)
function EditableTitle({ title }) {
  const [localTitle, setLocalTitle] = useState(title);
  useEffect(() => setLocalTitle(title), [title]);  // sync on prop change
  return <input value={localTitle} onChange={e => setLocalTitle(e.target.value)} />;
}`}
      </CodeBlock>

      <FlowChart
        title="State Decision Flowchart"
        chart={"graph TD\n  A[Do I need this data?] --> B{Can I compute it\nfrom props or state?}\n  B -- Yes --> C[useMemo or compute inline]\n  B -- No --> D{Is it passed from parent?}\n  D -- Yes --> E[Use the prop directly]\n  D -- No --> F{Does it change over time?}\n  F -- No --> G[Constant or ref]\n  F -- Yes --> H[useState or useReducer]"}
      />

      <InfoBox variant="warning" title="useReducer for Complex State">
        <p>When state has multiple sub-values that change together, or when next state depends on the previous, replace multiple useState calls with useReducer. It centralizes update logic and makes state transitions explicit and testable — especially valuable for form state with 5+ fields.</p>
      </InfoBox>

      <InteractiveChallenge
        question="If you have items in state and need a filtered version based on a search term, what is the correct approach?"
        options={["Store filtered items in a second useState", "Compute filtered in a useEffect and setFiltered", "Compute filtered with useMemo during render", "Use a ref to store filtered items"]}
        correctIndex={2}
        explanation="Derived data should be computed during render, not stored in state. useMemo memoizes the computation so it only recalculates when items or the search term change. This avoids double renders, stale data, and unnecessary state synchronization."
      />

    </LessonLayout>
  );
}
