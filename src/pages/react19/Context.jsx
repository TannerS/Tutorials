import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactContext() {
  return (
    <LessonLayout
      title="Context API"
      sectionId="react19"
      lessonIndex={5}
      prev={{ path: "/react19/effects", label: "Side Effects & useEffect" }}
      next={{ path: "/react19/performance", label: "Performance Optimization" }}
    >
      <p>Context lets you pass data through the component tree without prop drilling. React 19 introduces the use() hook for cleaner context consumption.</p>

      <h2>Creating and Using Context</h2>
      <CodeBlock language="jsx" title="Context Pattern">
{`import { createContext, useContext, useState } from 'react';

// 1. Create context with default value
const ThemeContext = createContext('light');
const UserContext  = createContext(null);

// 2. Provider wraps the tree
function App() {
    const [theme, setTheme] = useState('light');
    const [user, setUser]   = useState({ name: 'Alice', role: 'admin' });

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <UserContext.Provider value={user}>
                <Layout />
            </UserContext.Provider>
        </ThemeContext.Provider>
    );
}

// 3. Consumer — any component in the tree
function Header() {
    const { theme, setTheme } = useContext(ThemeContext);
    const user = useContext(UserContext);

    return (
        <header className={"header-" + theme}>
            <span>Hello, {user?.name}</span>
            <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
                Toggle Theme
            </button>
        </header>
    );
}

// React 19: use() hook for context (works in conditionals!)
function ConditionalComponent({ showUser }) {
    const theme = use(ThemeContext);
    if (!showUser) return <div theme={theme}>No user</div>;
    const user = use(UserContext); // can call use() conditionally
    return <div>{user.name}</div>;
}`}
      </CodeBlock>

      <h2>Context Performance</h2>
      <CodeBlock language="jsx" title="Splitting Contexts for Performance">
{`// PROBLEM: one big context re-renders everything when any value changes
const AppContext = createContext({ user, theme, cart, notifications });

// SOLUTION: split into stable and dynamic contexts
const UserContext  = createContext(null);     // changes rarely
const ThemeContext = createContext('light');   // changes on toggle
const CartContext  = createContext([]);        // changes often

// Also stabilize context value with useMemo
function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');

    const value = useMemo(
        () => ({ theme, setTheme }),
        [theme] // only creates new object when theme changes
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// Custom hook encapsulates context usage
function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Context vs State Management Libraries">
        <p>Context is great for infrequently changing global data like themes, user info, and locale. For high-frequency updates (cart, real-time data) or complex state logic, use Zustand or Redux Toolkit — they are more performant and easier to debug.</p>
      </InfoBox>

      <InteractiveChallenge
        question="When does a component re-render due to context?"
        options={["Only when the component explicitly subscribes", "Every time any context in the app changes", "When the context value it consumes changes (by reference)", "Never — context does not cause re-renders"]}
        correctIndex={2}
        explanation="A component re-renders whenever the context value it consumes changes by reference. This is why you should memoize context values with useMemo — if the Provider re-renders and creates a new object {} even with the same data, all consumers re-render unnecessarily."
      />
    </LessonLayout>
  );
}
