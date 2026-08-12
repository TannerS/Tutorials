import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideComponentPatterns() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Component Patterns"
      tagline="The reusable shapes for structuring components — composition, state ownership, and API design — condensed for offline study."
      meta={['React 19', '11 patterns']}
      footerLabel="Personal study reference — React 19"
      pageLabel="React 19 Field Guide · Component Patterns"
      prev={{ path: '/react-field-guide/server-components', label: 'Server Components & Actions' }}
      next={{ path: '/react-field-guide/styling', label: 'Styling Approaches' }}
    >
      <PosterCard
        glyph="Co"
        title={<>Composition <span className="dim">vs Inheritance</span></>}
        language="tsx"
        code={`function Dialog({ title, children }) {
  return (
    <div className="dialog">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function ConfirmDialog({ onConfirm }) {
  return <Dialog title="Sure?"><button onClick={onConfirm}>Yes</button></Dialog>;
}`}
        caption="React has no class inheritance for components — wrap and pass children/props instead. Composition stays flexible and easy to test."
      />

      <PosterCard
        glyph="Ch"
        title={<>children<span className="dim"> Prop Patterns</span></>}
        language="tsx"
        code={`// as a function (render-prop shorthand)
<DataFetcher url="/api/users">
  {({ data, loading }) => loading ? <Spinner /> : <UserList users={data} />}
</DataFetcher>

// cloning to inject props
React.Children.map(children, (child, i) =>
  React.cloneElement(child, { key: i, size: 'sm' })
);`}
        caption="children can be JSX, a function, or an array to clone — the most flexible extension point a component can offer."
      />

      <PosterCard
        glyph="RP"
        title={<>Render <span className="dim">Props</span></>}
        language="tsx"
        code={`function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}
    </div>
  );
}
<MouseTracker render={({ x, y }) => <p>{x}, {y}</p>} />`}
        caption="Passes rendered output through a function prop. Mostly superseded by custom hooks — keep it only when a component controls layout around your output."
      />

      <PosterCard
        glyph="HOC"
        title={<>Higher-Order <span className="dim">Components</span></>}
        language="tsx"
        code={`function withAuth(Wrapped) {
  return function Authed(props) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return <Wrapped {...props} user={user} />;
  };
}
const ProtectedDashboard = withAuth(Dashboard);`}
        caption="Wraps a component to inject behavior. Adds wrapper divs and obscures the tree in DevTools — prefer a custom hook for new code."
      />

      <PosterCard
        glyph="Cp"
        title={<>Compound <span className="dim">Components</span></>}
        language="tsx"
        code={`const TabsContext = createContext();
function Tabs({ children, defaultTab }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;`}
        caption="Sub-components share implicit state via context while the call site stays declarative — <Tabs><Tabs.Tab/></Tabs> instead of one giant props object."
      />

      <PosterCard
        glyph="C/U"
        title={<>Controlled <span className="dim">vs Uncontrolled</span></>}
        language="tsx"
        code={`// controlled — React owns the value
<input value={value} onChange={e => setValue(e.target.value)} />

// uncontrolled — DOM owns the value
const ref = useRef();
<input ref={ref} defaultValue="hello" />`}
        caption="Controlled inputs need state + onChange for every keystroke; uncontrolled inputs read from the DOM only when you actually need to, e.g. on submit."
      />

      <PosterCard
        glyph="C/P"
        title={<>Container <span className="dim">/ Presentational</span></>}
        language="tsx"
        code={`// Presentational — pure UI
function UserCard({ name, avatar, role }) {
  return <div><img src={avatar} /><h3>{name}</h3><span>{role}</span></div>;
}

// Container — fetches, delegates rendering
function UserCardContainer({ userId }) {
  const { data } = useFetch(\`/api/users/\${userId}\`);
  return <UserCard {...data} />;
}`}
        caption="Separates data-fetching from markup so the presentational half is trivial to test and reuse. Custom hooks now often replace the container half."
      />

      <PosterCard
        glyph="Po"
        title={<>Polymorphic <span className="dim"> (as prop)</span></>}
        language="tsx"
        code={`function Box({ as: Component = 'div', children, ...rest }) {
  return <Component {...rest}>{children}</Component>;
}

<Box as="article" className="card">Content</Box>
<Box as={Link} to="/about">About</Box>`}
        caption="One component renders as any tag or component via an `as` prop — avoids near-duplicate wrapper components for every element type."
      />

      <PosterCard
        glyph="Sl"
        title={<>Slot <span className="dim">Pattern</span></>}
        language="tsx"
        code={`function PageLayout({ header, sidebar, children, footer }) {
  return (
    <div className="page">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
      <footer>{footer}</footer>
    </div>
  );
}`}
        caption="Named props act as named slots for layout regions, while children fills the default/main slot — clearer than one children blob with positioning logic."
      />

      <PosterCard
        glyph="He"
        title={<>Headless <span className="dim">Components</span></>}
        language="tsx"
        code={`function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(p => !p), []);
  return { on, toggle };
}

function Accordion({ title, children }) {
  const { on, toggle } = useToggle();
  return <div><button onClick={toggle}>{title}</button>{on && children}</div>;
}`}
        caption="Ships behavior with zero markup opinions — you own every element and class name, the hook owns only the logic."
      />

      <PosterCard
        glyph="Pr"
        title={<>Provider <span className="dim">Pattern</span></>}
        language="tsx"
        code={`const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}`}
        caption="Pairs a Provider with a guarded custom hook so consumers get a non-null value and a clear error if used outside the tree."
      />

      <PosterQuickRef
        title="Which pattern do I need?"
        rows={[
          { need: 'Share layout, no shared state', answer: 'children / Slot pattern' },
          { need: 'Share logic, no markup opinion', answer: 'Headless component (custom hook)' },
          { need: 'Multiple related sub-parts', answer: 'Compound components' },
          { need: 'Inject cross-cutting behavior', answer: 'HOC (or a hook)' },
          { need: 'Parent controls rendered output', answer: 'Render props' },
          { need: 'Component must render as any tag', answer: "Polymorphic (`as` prop)" },
          { need: 'Fetch data, keep UI dumb', answer: 'Container / Presentational' },
          { need: 'Input works with or without parent state', answer: 'Controlled/uncontrolled hybrid' },
          { need: 'Share state app-wide', answer: 'Provider pattern' },
        ]}
      />
    </PosterLayout>
  );
}
