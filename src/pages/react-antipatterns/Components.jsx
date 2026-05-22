import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AntiPatternsComponents() {
  return (
    <LessonLayout
      title="Component Anti-Patterns"
      sectionId="react-antipatterns"
      lessonIndex={4}
      prev={{ path: "/react-antipatterns/performance", label: "Performance Anti-Patterns" }}
      next={{ path: "/react-antipatterns/bestpractices", label: "Best Practices" }}
    >
      <p>Component design anti-patterns make code hard to reuse, test, and maintain. The most common are God Components that do too much, over-abstraction that creates needless complexity, and poor composition that leads to rigid hierarchies.</p>

      <h2>Anti-Pattern 1: God Component</h2>

      <CodeBlock language="jsx" title="God Component — Does Too Much">
{`// ANTI-PATTERN: One component handles data fetching, business logic, AND rendering
function UserDashboard({ userId }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  // ... 200 more lines of mixed concerns

  useEffect(() => { fetchUser(userId).then(setUser); }, [userId]);
  useEffect(() => { fetchOrders(userId, filter, sortBy, page).then(setOrders); }, [...]);
  useEffect(() => { fetchNotifications(userId).then(setNotifications); }, [userId]);
  // ... event handlers, business logic, form validation, all mixed in

  return (
    // 300 lines of JSX
  );
}

// CORRECT: Separate concerns, compose small focused components
function UserDashboard({ userId }) {
  return (
    <div className="dashboard">
      <UserProfile userId={userId} />
      <OrderList userId={userId} />
      <NotificationCenter userId={userId} />
    </div>
  );
}

// Each sub-component owns its own data fetching and state
function UserProfile({ userId }) { /* focused on user display/editing */ }
function OrderList({ userId })   { /* focused on orders with filter/sort/page */ }
function NotificationCenter({ userId }) { /* focused on notifications */ }`}
      </CodeBlock>

      <h2>Anti-Pattern 2: Over-Abstraction</h2>

      <CodeBlock language="jsx" title="Abstraction Before Understanding">
{`// ANTI-PATTERN: Creating a "flexible" component before knowing all use cases
// Over-engineered — too many props to handle every possible scenario
function DataRenderer({
  data, renderItem, renderEmpty, renderError, renderLoading,
  onItemClick, onItemHover, onItemFocus, keyExtractor,
  filterFn, sortFn, groupByFn, virtualize, pageSize,
  headerComponent, footerComponent, separatorComponent,
  estimatedItemHeight, onEndReached, onEndReachedThreshold,
  // ... 20 more props
}) { ... }

// BETTER: Start simple, extract abstraction once the pattern is clear
// Rule of Three: abstract AFTER you've written the same thing 3 times

// First usage — just write it directly
function ProductList({ products }) {
  return products.map(p => <ProductCard key={p.id} product={p} />);
}

// Second usage — still just write it
function OrderList({ orders }) {
  return orders.map(o => <OrderCard key={o.id} order={o} />);
}

// Third usage — NOW you see the pattern, extract it
function ItemList({ items, renderItem, keyFn }) {
  return items.map(item => (
    <div key={keyFn(item)}>{renderItem(item)}</div>
  ));
}`}
      </CodeBlock>

      <h2>Anti-Pattern 3: Render Props Overuse</h2>

      <CodeBlock language="jsx" title="Modern Alternatives to Render Props">
{`// ANTI-PATTERN: Deeply nested render props (pre-hooks pattern)
<DataProvider>
  {data => (
    <ThemeProvider>
      {theme => (
        <AuthProvider>
          {user => (
            // "Callback hell" / "Pyramid of doom"
            <Component data={data} theme={theme} user={user} />
          )}
        </AuthProvider>
      )}
    </ThemeProvider>
  )}
</DataProvider>

// MODERN: Hooks flatten the hierarchy
function Component() {
  const data  = useData();     // custom hook
  const theme = useTheme();    // custom hook
  const user  = useAuth();     // custom hook
  return <div style={{ color: theme.primary }}>{data.title} - {user.name}</div>;
}

// GOOD use of render props: when a child needs to control rendering
// (e.g., headless UI components like Downshift, react-table)
<Combobox>
  {({ isOpen, getInputProps, getMenuProps, getItemProps, items }) => (
    <div>
      <input {...getInputProps()} />
      {isOpen && (
        <ul {...getMenuProps()}>
          {items.map((item, i) => (
            <li key={item.id} {...getItemProps({ item, index: i })}>{item.label}</li>
          ))}
        </ul>
      )}
    </div>
  )}
</Combobox>`}
      </CodeBlock>

      <FlowChart
        title="Component Responsibility Check"
        chart={"graph TD\n  A[Is component >150 lines?] --> B{Multiple concerns?}\n  B -- Yes --> C[Split into smaller components]\n  B -- No --> D{Hard to test in isolation?}\n  D -- Yes --> E[Extract logic to custom hook]\n  D -- No --> F{More than 5 props?}\n  F -- Yes --> G{Related props?}\n  G -- Yes --> H[Group into object prop]\n  G -- No --> I[Likely doing too much]\n  F -- No --> J[Component is well-scoped]"}
      />

      <InfoBox variant="tip" title="The Single Responsibility Test">
        <p>Describe your component in one sentence without using "and". If you can't — "it fetches user data AND displays a form AND handles validation AND submits to the API" — it violates Single Responsibility. Each "and" is a reason to split.</p>
      </InfoBox>

      <InteractiveChallenge
        question="When should you extract an abstraction for a repeated pattern?"
        options={["As soon as you write it the first time", "After writing it twice to be safe", "After writing it three times (Rule of Three)", "Never — always write it inline"]}
        correctIndex={2}
        explanation="The Rule of Three: resist the urge to abstract after the first or second occurrence. You don't yet know the shape of the abstraction. After three instances, you understand the variation points and can design an abstraction that fits all cases without over-engineering."
      />

    </LessonLayout>
  );
}
