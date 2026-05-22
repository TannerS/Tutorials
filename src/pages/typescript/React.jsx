import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsReact() {
  return (
    <LessonLayout
      title="React + TypeScript"
      sectionId="typescript"
      lessonIndex={5}
      prev={{ path: '/typescript/advanced', label: 'Advanced Types' }}
      next={{ path: '/typescript/migration', label: 'Migration Guide (JS → TS)' }}
    >
      <p>
        TypeScript transforms React development by catching prop mismatches, invalid hook usage,
        and event handler errors at compile time. This lesson is a comprehensive reference for
        typing every part of a React application.
      </p>

      <FlowChart
        title="React + TypeScript Mental Model"
        chart={"graph TD\nA[Props Types] --> B[Component]\nB --> C[Hooks with Generics]\nB --> D[Event Handlers]\nC --> E[State / Ref / Context Types]\nD --> F[DOM Event Types]\nB --> G[Return: ReactElement]"}
      />

      <h2>1. Typing Functional Components</h2>

      <CodeBlock language="tsx" title="Three approaches compared">{
`// A) React.FC — controversial, can't do generics
const Greeting: React.FC<{ name: string }> = ({ name }) => <h1>Hello, {name}!</h1>;

// B) Explicit return type
function Greeting(props: { name: string }): React.ReactElement {
  return <h1>Hello, {props.name}!</h1>;
}

// C) Inline / inferred — RECOMMENDED
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}`
      }</CodeBlock>

      <InfoBox variant="warning" title="Why React.FC is controversial">
        Before React 18, <code>React.FC</code> implicitly included <code>children</code>,
        letting callers pass children even when the component did not render them. It also
        prevents generic components. Most style guides now recommend Approach C.
      </InfoBox>

      <h2>2. Props Typing Patterns</h2>

      <CodeBlock language="tsx" title="Required, optional, and default props">{
`interface CardProps {
  title: string;        // required
  subtitle?: string;    // optional
  maxWidth?: number;    // optional with JS default
}

function Card({ title, subtitle, maxWidth = 400 }: CardProps) {
  return (
    <div style={{ maxWidth }}>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
// Use JS default parameters — NOT defaultProps (deprecated in React 18.3+)`
      }</CodeBlock>

      <CodeBlock language="tsx" title="Children prop types">{
`interface LayoutProps  { children: React.ReactNode; }      // anything renderable (most common)
interface WrapperProps { children: React.ReactElement; }    // JSX only, no strings/numbers
interface DataProps<T> { children: (data: T) => React.ReactNode; } // render prop`
      }</CodeBlock>

      <CodeBlock language="tsx" title="Spread props with ComponentPropsWithoutRef">{
`import { ComponentPropsWithoutRef } from 'react';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant: 'primary' | 'secondary';
  isLoading?: boolean;
}

function Button({ variant, isLoading, children, ...rest }: ButtonProps) {
  return (
    <button className={\`btn btn-\${variant}\`} disabled={isLoading} {...rest}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
}`
      }</CodeBlock>

      <CodeBlock language="tsx" title="Discriminated union props — polymorphic component">{
`type ButtonProps =
  | { as: 'a'; href: string; onClick?: never }
  | { as?: 'button'; href?: never; onClick: () => void };

type Props = ButtonProps & { children: React.ReactNode };

function ActionButton(props: Props) {
  if (props.as === 'a') return <a href={props.href}>{props.children}</a>;
  return <button onClick={props.onClick}>{props.children}</button>;
}

// TypeScript enforces correct combos:
<ActionButton as="a" href="/home">Home</ActionButton>      // OK
<ActionButton onClick={() => save()}>Save</ActionButton>    // OK
// <ActionButton as="a" onClick={fn}>X</ActionButton>       // ERROR`
      }</CodeBlock>

      <h2>3. Typing All Hooks</h2>

      <FlowChart
        title="Hook Type Decision Tree"
        chart={"graph TD\nA[Which hook?] --> B[useState]\nA --> C[useReducer]\nA --> D[useRef]\nA --> E[useContext]\nB --> B1[Initial value matches full type?]\nB1 -->|Yes| B2[Let TS infer]\nB1 -->|No| B3[Add generic]\nD --> D1[DOM element?]\nD1 -->|Yes| D2[useRef&lt;HTMLElement&gt; null]\nD1 -->|No| D3[useRef&lt;T&gt; initial value]"}
      />

      <h3>useState</h3>
      <CodeBlock language="tsx" title="useState typing patterns">{
`const [count, setCount] = useState(0);           // inferred as number
const [name, setName] = useState('');             // inferred as string

// Generic needed when initial value doesn't represent full type
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<string[]>([]);
const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

setCount(prev => prev + 1);  // prev is number — inferred from generic`
      }</CodeBlock>

      <h3>useReducer</h3>
      <CodeBlock language="tsx" title="Full typed reducer for async data fetching">{
`interface FetchState<T> { data: T | null; loading: boolean; error: string | null; }

type FetchAction<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: T }
  | { type: 'FETCH_ERROR'; error: string };

function fetchReducer<T>(state: FetchState<T>, action: FetchAction<T>): FetchState<T> {
  switch (action.type) {
    case 'FETCH_START':   return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS': return { data: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':   return { ...state, loading: false, error: action.error };
  }
}

// Usage — dispatch is fully typed
const [state, dispatch] = useReducer(fetchReducer<User[]>, {
  data: null, loading: false, error: null,
});
dispatch({ type: 'FETCH_SUCCESS', payload: users });
// dispatch({ type: 'FETCH_SUCCESS' });  // ERROR: missing payload`
      }</CodeBlock>

      <h3>useRef</h3>
      <CodeBlock language="tsx" title="DOM refs vs mutable refs">{
`// DOM ref — pass null, React manages .current (readonly)
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();  // optional chaining for null safety
<input ref={inputRef} />

// Mutable ref — pass initial value (.current is writable)
const renderCount = useRef<number>(0);
useEffect(() => { renderCount.current += 1; });

// Timer ref pattern
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
useEffect(() => {
  intervalRef.current = setInterval(() => tick(), 1000);
  return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
}, []);`
      }</CodeBlock>

      <InfoBox variant="info" title="RefObject vs MutableRefObject">
        Pass <code>null</code> with a non-null generic → <code>RefObject</code> (read-only .current).
        Pass an initial value matching the generic → <code>MutableRefObject</code> (writable .current).
        For DOM refs, always pass <code>null</code>.
      </InfoBox>

      <h3>useContext</h3>
      <CodeBlock language="tsx" title="Full typed context pattern">{
`interface AuthContext {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContext | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
  };
  return (
    <AuthCtx.Provider value={{ user, login, logout: () => setUser(null) }}>
      {children}
    </AuthCtx.Provider>
  );
}

// Custom hook with null guard — consumers get guaranteed AuthContext
function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}`
      }</CodeBlock>

      <h3>useMemo, useCallback, and useEffect</h3>
      <CodeBlock language="tsx" title="Memo, callback, and effect patterns">{
`// useMemo — return type is inferred
const sorted = useMemo(() => items.sort((a, b) => a.name.localeCompare(b.name)), [items]);

// useCallback — parameter types from the signature
const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setName(e.target.value);
}, []);

// useEffect — async pattern (never pass async directly)
useEffect(() => {
  const controller = new AbortController();
  async function load() {
    const res = await fetch('/api/data', { signal: controller.signal });
    setData(await res.json());
  }
  load();
  return () => controller.abort();
}, []);`
      }</CodeBlock>

      <h2>4. Event Handling Types</h2>

      <CodeBlock language="tsx" title="All common event types">{
`function handleChange(e: React.ChangeEvent<HTMLInputElement>) { }
function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) { }
function handleSubmit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); }
function handleClick(e: React.MouseEvent<HTMLButtonElement>) { }
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) { }
function handleFocus(e: React.FocusEvent<HTMLInputElement>) { }
function handleDrop(e: React.DragEvent<HTMLDivElement>) { e.preventDefault(); }

// Event handler prop types — equivalent shorthand
interface FieldProps {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
}`
      }</CodeBlock>

      <h2>5. Typing Forms</h2>

      <CodeBlock language="tsx" title="Complete typed form with all input types">{
`interface FormData {
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  agreedToTerms: boolean;
}

function RegistrationForm() {
  const [form, setForm] = useState<FormData>({
    username: '', role: 'viewer', agreedToTerms: false,
  });

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, role: e.target.value as FormData['role'] }));
  };
  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, agreedToTerms: e.target.checked }));
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" value={form.username} onChange={handleText} />
      <select value={form.role} onChange={handleSelect}>
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </select>
      <label>
        <input type="checkbox" checked={form.agreedToTerms} onChange={handleCheck} />
        I agree to the terms
      </label>
      <button type="submit">Register</button>
    </form>
  );
}`
      }</CodeBlock>

      <h2>6. Context with useReducer</h2>

      <CodeBlock language="tsx" title="Context + useReducer full pattern">{
`type TodoAction =
  | { type: 'ADD'; text: string }
  | { type: 'TOGGLE'; id: number }
  | { type: 'DELETE'; id: number };

interface TodoCtxValue {
  todos: Todo[];
  dispatch: React.Dispatch<TodoAction>;
}

const TodoCtx = createContext<TodoCtxValue | undefined>(undefined);

function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'ADD':    return [...state, { id: Date.now(), text: action.text, done: false }];
    case 'TOGGLE': return state.map(t => t.id === action.id ? { ...t, done: !t.done } : t);
    case 'DELETE': return state.filter(t => t.id !== action.id);
  }
}

function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, dispatch] = useReducer(todoReducer, []);
  return <TodoCtx.Provider value={{ todos, dispatch }}>{children}</TodoCtx.Provider>;
}

function useTodos() {
  const ctx = useContext(TodoCtx);
  if (!ctx) throw new Error('useTodos must be inside TodoProvider');
  return ctx;
}`
      }</CodeBlock>

      <h2>7. Typing Custom Hooks</h2>

      <InfoBox variant="tip" title="Tuple returns need as const">
        When a hook returns <code>[value, setter]</code>, add <code>as const</code> so TypeScript
        infers a tuple type instead of a union array.
      </InfoBox>

      <CodeBlock language="tsx" title="useLocalStorage — generic custom hook">{
`function useLocalStorage<T>(key: string, initial: T) {
  const [stored, setStored] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initial;
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    const next = value instanceof Function ? value(stored) : value;
    setStored(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  return [stored, setValue] as const;
}

const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');`
      }</CodeBlock>

      <CodeBlock language="tsx" title="useFetch — async data hook">{
`interface UseFetchResult<T> {
  data: T | null; loading: boolean; error: string | null; refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally { setLoading(false); }
  }, [url]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}

const { data: users, loading } = useFetch<User[]>('/api/users');`
      }</CodeBlock>

      <CodeBlock language="tsx" title="useDebounce — timer hook">{
`function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}`
      }</CodeBlock>

      <h2>8. HOCs and Render Props</h2>

      <CodeBlock language="tsx" title="Higher-Order Component">{
`interface WithThemeProps { theme: 'light' | 'dark'; }

function withTheme<P extends object>(
  Wrapped: React.ComponentType<P & WithThemeProps>
) {
  return function Themed(props: Omit<P & WithThemeProps, keyof WithThemeProps>) {
    const theme = useThemeFromContext();
    return <Wrapped {...(props as P)} theme={theme} />;
  };
}

const ThemedButton = withTheme(Button);`
      }</CodeBlock>

      <CodeBlock language="tsx" title="Render prop pattern">{
`interface MouseTrackerProps {
  children: (pos: { x: number; y: number }) => React.ReactNode;
}

function MouseTracker({ children }: MouseTrackerProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}>
      {children(pos)}
    </div>
  );
}

<MouseTracker>{({ x, y }) => <p>Mouse at {x}, {y}</p>}</MouseTracker>`
      }</CodeBlock>

      <h2>9. Typing forwardRef</h2>

      <CodeBlock language="tsx" title="forwardRef input component">{
`import { forwardRef } from 'react';

interface TextInputProps { label: string; error?: string; name: string; }

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, name, ...rest }, ref) => (
    <div>
      <label htmlFor={name}>{label}</label>
      <input ref={ref} id={name} name={name} {...rest} />
      {error && <span className="error">{error}</span>}
    </div>
  )
);
TextInput.displayName = 'TextInput';

// Parent — ref is typed as HTMLInputElement
const inputRef = useRef<HTMLInputElement>(null);
<TextInput ref={inputRef} label="Name" name="name" />`
      }</CodeBlock>

      <InfoBox variant="info" title="forwardRef generic order">
        The order is <code>forwardRef&lt;RefType, PropsType&gt;</code> — the ref element type
        comes <strong>first</strong>, then props. This is the opposite of what you might expect.
      </InfoBox>

      <h2>10. React.lazy and Suspense</h2>

      <CodeBlock language="tsx" title="Lazy loading with type flow">{
`import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));
// Types flow through — Dashboard has same type as the default export

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard userId={42} />  {/* props are type-checked */}
    </Suspense>
  );
}`
      }</CodeBlock>

      <h2>11. Generic Components</h2>

      <CodeBlock language="tsx" title="Generic Select component">{
`interface SelectProps<T> {
  items: T[];
  selected: T | null;
  onChange: (item: T) => void;
  getLabel: (item: T) => string;
  getKey: (item: T) => string | number;
}

function Select<T>({ items, selected, onChange, getLabel, getKey }: SelectProps<T>) {
  return (
    <ul role="listbox">
      {items.map(item => (
        <li key={getKey(item)} role="option"
            aria-selected={item === selected} onClick={() => onChange(item)}>
          {getLabel(item)}
        </li>
      ))}
    </ul>
  );
}

// T is inferred as User from the items prop
<Select<User>
  items={users} selected={selectedUser} onChange={setSelectedUser}
  getLabel={u => u.name} getKey={u => u.id}
/>`
      }</CodeBlock>

      <InfoBox variant="note" title="Generics require plain functions">
        You <strong>cannot</strong> create generic components with <code>React.FC</code>.
        This is another reason to prefer Approach C from Section 1.
      </InfoBox>

      <h2>12. React 19 Types</h2>

      <CodeBlock language="tsx" title="useActionState">{
`import { useActionState } from 'react';

interface FormState { message: string; errors: Record<string, string>; }

async function submitAction(prev: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string;
  if (!name) return { message: '', errors: { name: 'Required' } };
  await saveToServer(name);
  return { message: 'Saved!', errors: {} };
}

function MyForm() {
  const [state, formAction, isPending] = useActionState(submitAction, {
    message: '', errors: {},
  });
  return (
    <form action={formAction}>
      <input name="name" />
      {state.errors.name && <span>{state.errors.name}</span>}
      <button disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</button>
    </form>
  );
}`
      }</CodeBlock>

      <CodeBlock language="tsx" title="useFormStatus and useOptimistic">{
`import { useFormStatus } from 'react-dom';
import { useOptimistic } from 'react';

// useFormStatus — must be in a child of <form>
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Sending...' : 'Submit'}</button>;
}

// useOptimistic — instant UI updates before server confirms
function Chat({ messages }: { messages: Message[] }) {
  const [optimistic, addOptimistic] = useOptimistic<Message[], string>(
    messages,
    (state, newText) => [...state, { id: Date.now(), text: newText, sending: true }]
  );
  // addOptimistic(text) renders immediately; reverts if action fails
}`
      }</CodeBlock>

      <h2>13. React TS Patterns — Cheat Sheet</h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #555', padding: '8px', textAlign: 'left' }}>Pattern</th>
              <th style={{ border: '1px solid #555', padding: '8px', textAlign: 'left' }}>Type</th>
              <th style={{ border: '1px solid #555', padding: '8px', textAlign: 'left' }}>Example</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Children', 'React.ReactNode', 'children: React.ReactNode'],
              ['Style prop', 'React.CSSProperties', 'style?: React.CSSProperties'],
              ['onChange', 'ChangeEventHandler', 'React.ChangeEventHandler<HTMLInputElement>'],
              ['onClick', 'MouseEventHandler', 'React.MouseEventHandler<HTMLButtonElement>'],
              ['DOM ref', 'RefObject', 'useRef<HTMLDivElement>(null)'],
              ['Nullable state', 'T | null', 'useState<User | null>(null)'],
              ['Extend element', 'ComponentPropsWithoutRef', "ComponentPropsWithoutRef<'button'>"],
              ['Extend with ref', 'ComponentPropsWithRef', "ComponentPropsWithRef<'input'>"],
              ['Context default', 'T | undefined', 'createContext<Theme | undefined>(undefined)'],
              ['Dispatch', 'React.Dispatch', 'React.Dispatch<Action>'],
              ['Render function', '(args) => ReactNode', 'render: (item: T) => React.ReactNode'],
              ['Class name', 'string', 'className?: string'],
            ].map(([pattern, type, example], i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #555', padding: '8px' }}>{pattern}</td>
                <td style={{ border: '1px solid #555', padding: '8px' }}><code>{type}</code></td>
                <td style={{ border: '1px solid #555', padding: '8px' }}><code>{example}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>14. Interactive Challenges</h2>

      <InteractiveChallenge
        question={"You want to create a ref for an <input> that React manages. Which is correct?"}
        options={[
          "useRef<HTMLInputElement>(undefined)",
          "useRef<HTMLInputElement>(null)",
          "useRef<HTMLInputElement | null>(null)",
          "useRef(document.querySelector('input'))",
        ]}
        correctIndex={1}
        explanation={"For DOM refs, pass null and provide the element type as the generic: useRef<HTMLInputElement>(null). This gives you a RefObject with readonly .current. Option C would create a MutableRefObject instead."}
        language="tsx"
        code={`// Correct:
const ref = useRef<HTMLInputElement>(null);
ref.current?.focus();  // safe, typed`}
      />

      <InteractiveChallenge
        question={"What is the correct type for an onChange handler on a <select> element?"}
        options={[
          "React.ChangeEvent<HTMLInputElement>",
          "React.ChangeEvent<HTMLSelectElement>",
          "React.SelectEvent<HTMLSelectElement>",
          "React.FormEvent<HTMLSelectElement>",
        ]}
        correctIndex={1}
        explanation={"Select elements fire change events, so use React.ChangeEvent<HTMLSelectElement>. There is no React.SelectEvent. FormEvent would compile but lacks e.target.value typing."}
        language="tsx"
        code={`function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
  console.log(e.target.value);  // correctly typed as string
}`}
      />

      <InteractiveChallenge
        question={"When creating a context, what should the default value be?"}
        options={[
          "createContext(null)",
          "createContext({} as MyContextType)",
          "createContext<MyContextType | undefined>(undefined)",
          "createContext<MyContextType>(defaultValue)",
        ]}
        correctIndex={2}
        explanation={"Use createContext<T | undefined>(undefined) plus a custom hook with an undefined check. Casting with 'as' hides bugs — components silently get wrong values if used outside the Provider."}
      />

      <InfoBox variant="success" title="Key takeaways">
        <ul>
          <li>Prefer inline destructured props over React.FC</li>
          <li>Use discriminated unions for polymorphic component props</li>
          <li>Always add a useState generic when the initial value does not represent the full type</li>
          <li>DOM refs: <code>useRef&lt;Element&gt;(null)</code> — mutable refs provide an initial value</li>
          <li>Create context with undefined default + guarded custom hook</li>
          <li>Use <code>as const</code> for tuple returns from custom hooks</li>
          <li>Generic components are the key to reusable, type-safe UI primitives</li>
        </ul>
      </InfoBox>

    </LessonLayout>
  );
}
