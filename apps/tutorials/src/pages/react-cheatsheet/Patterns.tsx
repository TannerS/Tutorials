import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Patterns() {
  return (
    <LessonLayout
      title="Component Patterns"
      sectionId="react-cheatsheet"
      lessonIndex={1}
      prev={{ path: '/react-cheatsheet/hooks', label: 'All Hooks Reference' }}
      next={{ path: '/react-cheatsheet/state', label: 'State & Forms' }}
    >
      <p>Battle-tested component patterns for composition, flexibility, and reuse. Copy, adapt, ship.</p>

      <FlowChart
        title="Pattern Decision Tree"
        chart={"graph TD\n  A[Need to share UI?] -->|Yes| B{Share behavior too?}\n  B -->|No| C[Children / Slots]\n  B -->|Yes| D{Need render control?}\n  D -->|No| E[HOC or Custom Hook]\n  D -->|Yes| F[Render Props / Headless]\n  A -->|No| G{Complex sub-components?}\n  G -->|Yes| H[Compound Components]\n  G -->|No| I[Simple Component]"}
      />

      {/* ── Composition ──────────────────────────────────── */}
      <h2>Composition vs Inheritance</h2>
      <CodeBlock language="jsx" title="Always Composition">
{`// ✅ Composition — flexible, testable
function Dialog({ title, children }) {
  return (
    <div className="dialog">
      <h2>{title}</h2>
      <div className="dialog-body">{children}</div>
    </div>
  );
}

function ConfirmDialog({ onConfirm, onCancel }) {
  return (
    <Dialog title="Are you sure?">
      <button onClick={onConfirm}>Yes</button>
      <button onClick={onCancel}>No</button>
    </Dialog>
  );
}

// ❌ Never do this — no class inheritance for components`}
      </CodeBlock>

      {/* ── Children Prop ────────────────────────────────── */}
      <h2>Children Prop Patterns</h2>
      <CodeBlock language="jsx" title="children Variations">
{`// Basic children
<Card>{content}</Card>

// Multiple children
<Layout>
  <Header />
  <Main />
  <Footer />
</Layout>

// Children as function (render prop shorthand)
<DataFetcher url="/api/users">
  {({ data, loading }) => loading ? <Spinner /> : <UserList users={data} />}
</DataFetcher>

// Manipulating children
function Toolbar({ children }) {
  return (
    <div className="toolbar">
      {React.Children.map(children, (child, i) =>
        React.cloneElement(child, { key: i, size: 'sm' })
      )}
    </div>
  );
}`}
      </CodeBlock>

      {/* ── Render Props ─────────────────────────────────── */}
      <h2>Render Props</h2>
      <CodeBlock language="jsx" title="Render Props Pattern">
{`function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const handleMove = (e) => setPos({ x: e.clientX, y: e.clientY });
  return <div onMouseMove={handleMove}>{render(pos)}</div>;
}

// Usage
<MouseTracker render={({ x, y }) => <p>Mouse: {x}, {y}</p>} />

// Modern alternative — custom hook (preferred)
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Render Props vs Custom Hooks">
        <p>Custom hooks have largely replaced render props. Use render props only when you need to pass rendered output <em>into</em> a component that controls layout/wrapping. For sharing logic alone, hooks are simpler.</p>
      </InfoBox>

      {/* ── HOC ──────────────────────────────────────────── */}
      <h2>Higher-Order Components (HOC)</h2>
      <CodeBlock language="jsx" title="HOC Pattern">
{`function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return <WrappedComponent {...props} user={user} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);

// Convention: prefix with "with", preserve displayName
withAuth.displayName = \`withAuth(\${WrappedComponent.displayName || WrappedComponent.name})\`;

// ⚠️ HOCs add wrapper divs and can obscure component trees.
// Prefer custom hooks for new code.`}
      </CodeBlock>

      {/* ── Compound Components ──────────────────────────── */}
      <h2>Compound Components</h2>
      <CodeBlock language="jsx" title="Compound Components with Context">
{`const TabsContext = createContext();

function Tabs({ children, defaultTab }) {
  const [active, setActive] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }) {
  return <div role="tablist">{children}</div>;
}

function Tab({ value, children }) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button role="tab" aria-selected={active === value}
      onClick={() => setActive(value)}>{children}</button>
  );
}

function TabPanel({ value, children }) {
  const { active } = useContext(TabsContext);
  return active === value ? <div role="tabpanel">{children}</div> : null;
}

// Attach sub-components
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Usage — clean, declarative API
<Tabs defaultTab="one">
  <Tabs.List>
    <Tabs.Tab value="one">Tab 1</Tabs.Tab>
    <Tabs.Tab value="two">Tab 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="one">Content 1</Tabs.Panel>
  <Tabs.Panel value="two">Content 2</Tabs.Panel>
</Tabs>`}
      </CodeBlock>

      {/* ── Controlled vs Uncontrolled ───────────────────── */}
      <h2>Controlled vs Uncontrolled</h2>
      <CodeBlock language="jsx" title="Controlled vs Uncontrolled">
{`// Controlled — React owns the state
function Controlled() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}

// Uncontrolled — DOM owns the state
function Uncontrolled() {
  const ref = useRef();
  const handleSubmit = () => console.log(ref.current.value);
  return <input ref={ref} defaultValue="hello" />;
}

// Hybrid — support both modes
function Toggle({ value: controlledValue, onChange, defaultValue = false }) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internal;

  const handleChange = () => {
    if (!isControlled) setInternal(prev => !prev);
    onChange?.(!value);
  };
  return <button onClick={handleChange}>{value ? 'ON' : 'OFF'}</button>;
}`}
      </CodeBlock>

      {/* ── Container/Presentational ─────────────────────── */}
      <h2>Container / Presentational</h2>
      <CodeBlock language="jsx" title="Separation of Concerns">
{`// Presentational — pure UI, receives data via props
function UserCard({ name, avatar, role }) {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <span>{role}</span>
    </div>
  );
}

// Container — handles data fetching & state (or use a custom hook)
function UserCardContainer({ userId }) {
  const { data: user, loading } = useFetch(\`/api/users/\${userId}\`);
  if (loading) return <Skeleton />;
  return <UserCard name={user.name} avatar={user.avatar} role={user.role} />;
}`}
      </CodeBlock>

      {/* ── Polymorphic Components ────────────────────────── */}
      <h2>Polymorphic Components</h2>
      <CodeBlock language="jsx" title="as Prop Pattern">
{`function Box({ as: Component = 'div', children, ...rest }) {
  return <Component {...rest}>{children}</Component>;
}

// Renders <article>
<Box as="article" className="card">Content</Box>

// Renders a Link component
<Box as={Link} to="/about">About</Box>

// Renders a button
<Box as="button" onClick={handleClick}>Click me</Box>`}
      </CodeBlock>

      {/* ── Slot Pattern ─────────────────────────────────── */}
      <h2>Slot Pattern</h2>
      <CodeBlock language="jsx" title="Named Slots via Props">
{`function PageLayout({ header, sidebar, children, footer }) {
  return (
    <div className="page">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
      <footer>{footer}</footer>
    </div>
  );
}

// Usage — each slot gets its own JSX
<PageLayout
  header={<NavBar />}
  sidebar={<SideMenu items={menuItems} />}
  footer={<FooterLinks />}
>
  <ArticleContent />
</PageLayout>`}
      </CodeBlock>

      {/* ── Headless Components ──────────────────────────── */}
      <h2>Headless Components</h2>
      <CodeBlock language="jsx" title="Logic Without UI">
{`// Hook-based headless component (most common today)
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(prev => !prev), []);
  const reset = useCallback(() => setOn(initial), [initial]);
  return { on, toggle, reset, setOn };
}

// Usage — you own all the markup
function Accordion({ title, children }) {
  const { on, toggle } = useToggle();
  return (
    <div>
      <button onClick={toggle}>{title} {on ? '▲' : '▼'}</button>
      {on && <div>{children}</div>}
    </div>
  );
}`}
      </CodeBlock>

      {/* ── Provider Pattern ─────────────────────────────── */}
      <h2>Provider Pattern</h2>
      <CodeBlock language="jsx" title="Provider + Hook">
{`const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = async (creds) => { /* ... */ };
  const logout = () => setUser(null);
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

// App.jsx
<AuthProvider><App /></AuthProvider>

// Any component
const { user, logout } = useAuth();`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Which pattern lets a component render as different HTML elements or other components via a prop?"}
        options={[
          "Compound Components",
          "Render Props",
          "Polymorphic Components (as prop)",
          "Higher-Order Components"
        ]}
        correctIndex={2}
        explanation={"The polymorphic pattern uses an 'as' prop to let the consumer control what element or component is rendered, while the component provides consistent styling and behavior."}
        language="jsx"
      />
    </LessonLayout>
  );
}

export default Patterns;
