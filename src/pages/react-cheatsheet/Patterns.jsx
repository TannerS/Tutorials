import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactCPatterns() {
  return (
    <LessonLayout
      title="React Patterns Cheat Sheet"
      sectionId="react-cheatsheet"
      lessonIndex={1}
      prev={{ path: "/react-cheatsheet/hooks", label: "React Hooks Cheat Sheet" }}
      next={{ path: "/react-cheatsheet/state", label: "State Management Cheat Sheet" }}
    >
      <p>Quick reference for essential React patterns — composition, render props, HOCs, compound components, and controlled vs uncontrolled inputs.</p>

      <CodeBlock language="jsx" title="Core Patterns Reference">
{`// === COMPOSITION (preferred over HOC) ===
function Page({ header, sidebar, children }) {
  return (
    <div className="layout">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}
// Usage: <Page header={<Nav />} sidebar={<Menu />}><Content /></Page>

// === COMPOUND COMPONENTS ===
const TabContext = createContext(null);
function Tabs({ children, defaultTab }) {
  const [active, setActive] = useState(defaultTab);
  return <TabContext.Provider value={{ active, setActive }}>{children}</TabContext.Provider>;
}
Tabs.Tab = function Tab({ id, children }) {
  const { active, setActive } = useContext(TabContext);
  return <button className={active===id ? 'active' : ''} onClick={() => setActive(id)}>{children}</button>;
};
Tabs.Panel = function Panel({ id, children }) {
  const { active } = useContext(TabContext);
  return active === id ? <div>{children}</div> : null;
};

// === CONTROLLED vs UNCONTROLLED ===
// Controlled: React owns state
<input value={value} onChange={e => setValue(e.target.value)} />
// Uncontrolled: DOM owns state, React reads via ref
const ref = useRef(); <input ref={ref} defaultValue="hello" />
const val = ref.current.value; // read imperatively

// === ERROR BOUNDARY (class component only) ===
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) { log.error(err, info); }
  render() {
    return this.state.error ? <FallbackUI /> : this.props.children;
  }
}

// === PORTAL (render outside parent DOM) ===
createPortal(<Modal />, document.getElementById('modal-root'));

// === SUSPENSE + LAZY ===
const LazyChart = lazy(() => import('./Chart'));
<Suspense fallback={<Spinner />}><LazyChart /></Suspense>`}
      </CodeBlock>

      <InfoBox variant="tip" title="Pattern Selection">
        <p>Use composition (children/slot props) for layout. Compound components for related UI with shared state (Tabs, Accordion, Form). Error boundaries around feature sections, not individual components. Portals for modals, tooltips, and toasts that need to escape z-index stacking. Lazy + Suspense for code-splitting large routes.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the main advantage of the compound components pattern?"
        options={["It prevents unnecessary re-renders", "It allows parent and child components to share implicit state via context without prop drilling", "It makes components lazy-loaded automatically", "It replaces the need for global state management"]}
        correctIndex={1}
        explanation="Compound components (like Tabs/Tab/Panel) share state via context internally, giving consumers a clean declarative API without passing explicit state props between them. The parent manages state; children access it through context. This creates flexible, readable component APIs."
      />

    </LessonLayout>
  );
}
