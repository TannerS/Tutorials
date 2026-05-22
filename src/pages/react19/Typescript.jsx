import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactTypescript() {
  return (
    <LessonLayout
      title="React with TypeScript"
      sectionId="react19"
      lessonIndex={10}
      prev={{ path: "/react19/patterns", label: "React Patterns" }}
      next={null}
    >
      <p>TypeScript and React are a powerful combination. Proper typing of components, hooks, events, and context eliminates entire categories of runtime errors.</p>

      <h2>Typing Components and Props</h2>
      <CodeBlock language="tsx" title="Component and Props Types">
{`import React, { ReactNode, CSSProperties } from 'react';

// Props interface
interface ButtonProps {
    label: string;
    variant?: 'primary' | 'secondary' | 'danger'; // string union
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    onClick?: () => void;
    children?: ReactNode;    // any React content
    style?: CSSProperties;   // inline style object
    className?: string;
}

// Function component with typed props
function Button({
    label,
    variant = 'primary',
    disabled = false,
    onClick,
    children,
}: ButtonProps) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={"btn btn-" + variant}
        >
            {children ?? label}
        </button>
    );
}

// Generic component
function List<T extends { id: string | number }>({
    items,
    renderItem,
}: {
    items: T[];
    renderItem: (item: T) => ReactNode;
}) {
    return <ul>{items.map(item => <li key={item.id}>{renderItem(item)}</li>)}</ul>;
}`}
      </CodeBlock>

      <h2>Typing Hooks</h2>
      <CodeBlock language="tsx" title="Typed useState, useRef, useReducer">
{`// useState — type is usually inferred
const [count, setCount] = useState(0);           // number
const [name, setName]   = useState<string | null>(null); // explicit

// useRef — HTMLElement types
const inputRef = useRef<HTMLInputElement>(null);
const divRef   = useRef<HTMLDivElement>(null);
// Access: inputRef.current?.value  (optional chaining because null initially)

// useReducer with discriminated union actions
type Action =
    | { type: 'increment' }
    | { type: 'decrement' }
    | { type: 'reset'; payload: number };

interface State { count: number; }

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'increment': return { count: state.count + 1 };
        case 'decrement': return { count: state.count - 1 };
        case 'reset':     return { count: action.payload };
    }
}

const [state, dispatch] = useReducer(reducer, { count: 0 });
dispatch({ type: 'reset', payload: 10 }); // payload required and typed`}
      </CodeBlock>

      <h2>Typing Events and Context</h2>
      <CodeBlock language="tsx" title="Event Handlers and Context">
{`// Event handler types
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // submit logic
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log(e.currentTarget.id);
};

// Typed context
interface AuthContextType {
    user: User | null;
    login: (credentials: Credentials) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be inside AuthProvider");
    return ctx; // non-null after guard
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="React.FC vs Function Declarations">
        <p>Prefer plain function declarations over React.FC. React.FC implicitly adds children?: ReactNode to props (even when you do not want it) and adds unnecessary complexity. Just type props directly and declare children explicitly when needed.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What type should you use for a ref attached to an HTML input element?"
        options={["useRef<Element>", "useRef<InputElement>", "useRef<HTMLInputElement>", "useRef<HTMLElement>"]}
        correctIndex={2}
        explanation="useRef<HTMLInputElement>(null) is the correct type for an input ref. TypeScript's DOM types follow the HTML*Element naming convention. This gives you full type safety for input-specific properties like .value, .checked, .focus(), and .select()."
      />
    </LessonLayout>
  );
}
