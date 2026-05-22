import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Components() {
  return (
    <LessonLayout
      title="Component Design Anti-Patterns"
      sectionId="react-antipatterns"
      lessonIndex={4}
      prev={{ path: '/react-antipatterns/performance', label: 'Performance Mistakes' }}
      next={{ path: '/react-antipatterns/bestpractices', label: 'Best Practices Checklist' }}
    >
      <InfoBox variant="info" title="Why Component Design Matters">
        Poor component design is the root cause of most React maintenance nightmares.
        Well-structured components are small, focused, composable, and easy to test.
        This lesson covers the eight most common anti-patterns and how to fix them.
      </InfoBox>

      {/* ─── 1. God Components ─── */}
      <h2>1. God Components (Doing Too Much)</h2>
      <p>
        A &quot;god component&quot; handles data fetching, business logic, form validation,
        routing, and rendering all in one massive file. They are impossible to test
        in isolation and painful to modify.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — God Component">
        {`function UserDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { fetchUser().then(setUser); }, []);
  useEffect(() => { fetchOrders().then(setOrders); }, []);
  useEffect(() => { fetchNotifications().then(setNotifications); }, []);
  useEffect(() => { fetchSettings().then(setSettings); }, []);

  const handleUpdateProfile = async (data) => { /* 50 lines */ };
  const handleCancelOrder = async (id) => { /* 30 lines */ };
  const handleDismissNotification = (id) => { /* 20 lines */ };

  return (
    <div>
      {/* 300+ lines of mixed JSX for profile, orders,
          notifications, and settings */}
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Split Into Focused Components">
        {`function UserDashboard() {
  return (
    <DashboardLayout>
      <UserProfile />
      <OrderHistory />
      <NotificationPanel />
      <UserSettings />
    </DashboardLayout>
  );
}

function UserProfile() {
  const { user, updateProfile } = useUser();
  return <ProfileCard user={user} onUpdate={updateProfile} />;
}

function OrderHistory() {
  const { orders, cancelOrder } = useOrders();
  return <OrderList orders={orders} onCancel={cancelOrder} />;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Rule of Thumb">
        If a component is longer than ~150 lines or manages more than two pieces of
        independent state, it is probably doing too much. Extract sub-components and
        custom hooks.
      </InfoBox>

      {/* ─── 2. Deeply Nested Conditional Rendering ─── */}
      <h2>2. Deeply Nested Conditional Rendering</h2>
      <p>
        Ternary pyramids make JSX unreadable and nearly impossible to debug.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Ternary Pyramid">
        {`function Page({ status, user, data }) {
  return (
    <div>
      {status === 'loading' ? (
        <Spinner />
      ) : status === 'error' ? (
        <Error />
      ) : user ? (
        user.isAdmin ? (
          data.length > 0 ? (
            <AdminTable data={data} />
          ) : (
            <EmptyState />
          )
        ) : (
          <UserView data={data} />
        )
      ) : (
        <LoginPrompt />
      )}
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Early Returns and Guard Clauses">
        {`function Page({ status, user, data }) {
  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <Error />;
  if (!user) return <LoginPrompt />;

  if (user.isAdmin) {
    return data.length > 0
      ? <AdminTable data={data} />
      : <EmptyState />;
  }

  return <UserView data={data} />;
}`}
      </CodeBlock>

      {/* ─── 3. Index as Key in Dynamic Lists ─── */}
      <h2>3. Using Index as Key in Dynamic Lists</h2>
      <p>
        Using the array index as <code>key</code> breaks React&#39;s reconciliation when
        items are reordered, inserted, or deleted, causing stale state and subtle UI bugs.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Index as Key">
        {`function TodoList({ todos, onRemove }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>
          <input defaultValue={todo.text} />
          <button onClick={() => onRemove(index)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
// Removing an item causes inputs below it to display wrong values`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Stable Unique Key">
        {`function TodoList({ todos, onRemove }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <input defaultValue={todo.text} />
          <button onClick={() => onRemove(todo.id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
// Each item keeps its identity across re-renders`}
      </CodeBlock>

      <InfoBox variant="warning" title="When Index Keys Are Acceptable">
        Index keys are only safe when the list is static, never reordered, and items
        have no local state. In every other case, use a stable unique identifier.
      </InfoBox>

      {/* ─── 4. Prop Explosion vs Composition ─── */}
      <h2>4. Prop Explosion Instead of Composition</h2>
      <p>
        When a component grows dozens of props to cover every variation, it becomes
        rigid and hard to extend. The <code>children</code> prop and composition
        solve this elegantly.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Prop Explosion">
        {`function Card({
  title, subtitle, headerIcon, headerAction,
  bodyText, bodyImage, bodyList, bodyFootnote,
  footerLeftButton, footerRightButton, footerLink,
  variant, size, bordered, shadow, rounded,
}) {
  return (
    <div className={getClasses(variant, size, bordered, shadow, rounded)}>
      <div className="header">
        {headerIcon && <Icon name={headerIcon} />}
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
        {headerAction && <button>{headerAction}</button>}
      </div>
      <div className="body">
        {bodyText && <p>{bodyText}</p>}
        {bodyImage && <img src={bodyImage} alt="" />}
        {bodyList && bodyList.map(item => <li key={item}>{item}</li>)}
        {bodyFootnote && <small>{bodyFootnote}</small>}
      </div>
      {/* ... and on and on */}
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Composition With children">
        {`function Card({ variant, children }) {
  return <div className={\`card card--\${variant}\`}>{children}</div>;
}
function CardHeader({ children }) {
  return <div className="card-header">{children}</div>;
}
function CardBody({ children }) {
  return <div className="card-body">{children}</div>;
}
function CardFooter({ children }) {
  return <div className="card-footer">{children}</div>;
}

// Usage — infinitely flexible
<Card variant="elevated">
  <CardHeader>
    <Icon name="star" />
    <h3>My Title</h3>
  </CardHeader>
  <CardBody>
    <p>Any content goes here.</p>
  </CardBody>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>`}
      </CodeBlock>

      <FlowChart
        title="Composition Pattern Flow"
        chart={"graph TD\nA[Parent Component]-->B[Card]\nB-->C[CardHeader]\nB-->D[CardBody]\nB-->E[CardFooter]\nC-->F[children: any JSX]\nD-->G[children: any JSX]\nE-->H[children: any JSX]"}
      />

      {/* ─── 5. Mixing Concerns ─── */}
      <h2>5. Mixing Concerns in One Component</h2>
      <p>
        Combining data fetching, business logic, and presentation in a single
        component makes it impossible to reuse or test any one layer independently.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — All Concerns in One Place">
        {`function ProductPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(\`/api/products/\${productId}\`)
      .then(res => res.json())
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  const discountedPrice = product
    ? product.price * (1 - product.discount / 100)
    : 0;

  if (loading) return <Spinner />;
  if (!product) return <NotFound />;

  return (
    <div>
      <h1>{product.name}</h1>
      <p className="price">\${discountedPrice.toFixed(2)}</p>
      <p>{product.description}</p>
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Separated Layers">
        {`// Custom hook — data fetching
function useProduct(productId) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(\`/api/products/\${productId}\`)
      .then(res => res.json())
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [productId]);

  return { product, loading };
}

// Pure utility — business logic
function calculateDiscount(price, discount) {
  return price * (1 - discount / 100);
}

// Presentation component
function ProductDisplay({ name, price, description }) {
  return (
    <div>
      <h1>{name}</h1>
      <p className="price">\${price.toFixed(2)}</p>
      <p>{description}</p>
    </div>
  );
}

// Container gluing it together
function ProductPage({ productId }) {
  const { product, loading } = useProduct(productId);
  if (loading) return <Spinner />;
  if (!product) return <NotFound />;

  const price = calculateDiscount(product.price, product.discount);
  return <ProductDisplay name={product.name} price={price} description={product.description} />;
}`}
      </CodeBlock>

      {/* ─── 6. Not Extracting Custom Hooks ─── */}
      <h2>6. Not Using Custom Hooks to Extract Logic</h2>
      <p>
        Duplicating stateful logic across components is a maintenance burden.
        Custom hooks let you share behaviour without changing component hierarchy.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Duplicated Logic in Every Component">
        {`function SearchUsers() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ... use debouncedQuery
}

function SearchProducts() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ... exact same debounce logic copied again
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Custom Hook Extracted">
        {`function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function SearchUsers() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  // ... use debouncedQuery
}

function SearchProducts() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  // ... same hook, zero duplication
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Hook Extraction Rule">
        If you copy-paste the same <code>useState</code> + <code>useEffect</code> combo
        into a second component, stop and extract a custom hook immediately.
      </InfoBox>

      {/* ─── 7. Tight Coupling Between Components ─── */}
      <h2>7. Tight Coupling Between Components</h2>
      <p>
        When a child component reaches deep into a parent&#39;s data structure or relies
        on implementation details, changing one component breaks the other.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Child Knows Parent Data Shape">
        {`function UserList({ apiResponse }) {
  return (
    <ul>
      {apiResponse.data.users.edges.map(edge => (
        <li key={edge.node.id}>
          {edge.node.profile.firstName} {edge.node.profile.lastName}
          <span>{edge.node.account.email}</span>
        </li>
      ))}
    </ul>
  );
}
// If the API shape changes, this component breaks`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Decoupled With a Clean Interface">
        {`// Parent adapts the data before passing it down
function UserPage() {
  const { data } = useUsersQuery();
  const users = data.users.edges.map(edge => ({
    id: edge.node.id,
    name: \`\${edge.node.profile.firstName} \${edge.node.profile.lastName}\`,
    email: edge.node.account.email,
  }));
  return <UserList users={users} />;
}

// Child only knows about its own simple contract
function UserList({ users }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} <span>{user.email}</span>
        </li>
      ))}
    </ul>
  );
}
// API changes are absorbed by the parent — child is untouched`}
      </CodeBlock>

      <FlowChart
        title="Decoupled Data Flow"
        chart={"graph TD\nAPI[API Response]-->Parent[Parent: adapts data]\nParent-->Child[Child: simple props]\nChild-->UI[Rendered UI]\nstyle Parent fill:#d4edda\nstyle Child fill:#d4edda"}
      />

      {/* ─── 8. Overusing Context ─── */}
      <h2>8. Overusing Context for Everything</h2>
      <p>
        Context is powerful, but using it for frequently changing values causes
        every consumer to re-render. It is not a replacement for proper state management.
      </p>

      <CodeBlock language="jsx" title="❌ BAD — Dumping Everything Into Context">
        {`const AppContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [cart, setCart] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  return (
    <AppContext.Provider value={{
      user, setUser, theme, setTheme,
      cart, setCart, notifications, setNotifications,
      searchQuery, setSearchQuery,
      mousePosition, setMousePosition,
    }}>
      {children}
    </AppContext.Provider>
  );
}
// Every keystroke in search or mouse move re-renders EVERYTHING`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ GOOD — Separate Contexts by Change Frequency">
        {`// Rarely changes — safe for Context
const AuthContext = createContext();
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const ThemeContext = createContext();
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Frequently changes — use local state or a dedicated store
function SearchBar() {
  const [query, setQuery] = useState('');
  // Keep fast-changing state local, lift only when needed
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Context Performance Trap">
        Every component that calls <code>useContext(SomeContext)</code> re-renders
        whenever <strong>any</strong> value in that context changes. Splitting contexts
        by domain and change frequency is critical for performance.
      </InfoBox>

      {/* ─── Summary Flow ─── */}
      <FlowChart
        title="Component Design Decision Tree"
        chart={"graph TD\nStart[New Component]-->Q1{More than one responsibility?}\nQ1-->|Yes|Split[Split into smaller components]\nQ1-->|No|Q2{Duplicated stateful logic?}\nQ2-->|Yes|Hook[Extract a custom hook]\nQ2-->|No|Q3{Many config props?}\nQ3-->|Yes|Compose[Use children + composition]\nQ3-->|No|Q4{Needs shared state?}\nQ4-->|Yes|Q5{Changes frequently?}\nQ5-->|Yes|Local[Keep state local or use a store]\nQ5-->|No|Ctx[Context is fine]\nQ4-->|No|Done[Ship it]"}
      />

      {/* ─── Challenges ─── */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"A component has 22 props, including headerIcon, bodyText, footerLeftButton, and footerLink. What is the best refactoring strategy?"}
        options={[
          'Add PropTypes to document every prop',
          'Split into composed sub-components using the children prop',
          'Convert all props to a single config object',
          'Use defaultProps to reduce the number of required props',
        ]}
        correctIndex={1}
        explanation="When a component suffers from prop explosion, the solution is composition. Break it into smaller sub-components (e.g., CardHeader, CardBody, CardFooter) that accept children, letting consumers compose any content they need without adding more props."
      />

      <InteractiveChallenge
        question={"You have a Context that holds user info, theme, shopping cart, search query, and mouse position. Users report the app feels sluggish. What is the most likely cause and fix?"}
        options={[
          'The Context value is too large — compress it with JSON.stringify',
          'Too many providers — merge them into one for simplicity',
          'Fast-changing values (search, mouse) in Context trigger re-renders on every consumer — split into separate Contexts by change frequency',
          'Add React.memo to every component that consumes the Context',
        ]}
        correctIndex={2}
        explanation="Context re-renders every consumer when any value changes. Putting fast-changing values like mouse position and search queries alongside stable values like user info causes unnecessary re-renders across the entire tree. The fix is to split contexts by how often their values change."
      />

      <InfoBox variant="success" title="Key Takeaways">
        Keep components small and focused. Prefer composition over configuration.
        Extract custom hooks for shared logic. Use early returns instead of nested
        ternaries. Reserve Context for stable, widely-shared values. Decouple
        children from parent data shapes. Always use stable keys for dynamic lists.
      </InfoBox>
    </LessonLayout>
  );
}
