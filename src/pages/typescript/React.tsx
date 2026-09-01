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
// Use JS default parameters — NOT defaultProps. It was deprecated in 18.3 and
// REMOVED for function components in React 19: it is now silently ignored,
// with no warning. (Class components still honour it.)`
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
      <p>
        There is no React magic here &mdash; <code>useState</code> is a generic function, and
        everything it does follows from the inference rules you already know. Its signature is
        effectively <code>{'useState<S>(initial: S): [S, Dispatch<SetStateAction<S>>]'}</code>,
        so <strong>whatever you pass as the initial value decides <code>S</code></strong>. Two
        consequences cause nearly every <code>useState</code> type complaint.
      </p>

      <CodeBlock language="tsx" title="Consequence 1: a null initial value infers S = null">{
`const [user, setUser] = useState(null);   // S inferred as null

setUser({ id: 1, name: 'Alice' });
//        ~~
// error TS2353: Object literal may only specify known properties, and
//               'id' does not exist in type '(prevState: null) => null'.`
      }</CodeBlock>

      <p>
        That error is worth decoding, because it looks like nonsense the first time. Why is it
        talking about a <em>function</em>? Because the setter accepts{' '}
        <code>{'SetStateAction<null>'}</code>, which is{' '}
        <code>{'null | ((prev: null) => null)'}</code>. Your object matched neither member, and
        when an argument fails against a union, TypeScript reports the failure against the last
        candidate it tried &mdash; here, the updater-function form. The real message is
        simply: <em>S is <code>null</code>, and your object is not.</em>
      </p>
      <p>
        The fix is to tell it the type the state will eventually hold, since the initial value
        cannot: <code>{'useState<User | null>(null)'}</code>. That is the whole reason the
        generic argument exists.
      </p>

      <CodeBlock language="tsx" title="Consequence 2: initial values widen, exactly as in any other position">{
`const [status, setStatus] = useState('idle');   // S inferred as string, NOT 'idle'

const s: 'idle' | 'loading' = status;
// error TS2322: Type 'string' is not assignable to type '"idle" | "loading"'.

setStatus('lodaing');   // typo — accepted, because any string is valid

// Fix: state the union you actually mean.
const [ok, setOk] = useState<'idle' | 'loading' | 'error'>('idle');
setOk('lodaing');
// error TS2345: Argument of type '"lodaing"' is not assignable to parameter
//               of type SetStateAction<"idle" | "loading" | "error">.`
      }</CodeBlock>

      <InfoBox variant="tip" title="The Rule, Derived Rather Than Memorised">
        <p>
          Pass the generic argument whenever the initial value is a <em>poorer</em> description
          of the state than the state deserves &mdash; <code>null</code> before data arrives,{' '}
          <code>[]</code> before items arrive, one member of a union you will move through. Let
          inference do it when the initial value already is a faithful example
          (<code>useState(0)</code>, <code>useState(false)</code>).
        </p>
        <p>
          Same widening rule as the <code>as const</code> lesson: a value that can be reassigned
          gets the base type. <code>useState</code> is not an exception to anything.
        </p>
      </InfoBox>

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
`// DOM ref — pass null; React assigns .current when the node mounts
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

      <InfoBox variant="info" title="RefObject vs MutableRefObject — Gone in React 19">
        <p>
          Pre-19 tutorials draw a line between <code>RefObject</code> (read-only{' '}
          <code>.current</code>) and <code>MutableRefObject</code> (writable). That distinction
          no longer exists. In <code>@types/react</code> 19, <strong>every</strong>{' '}
          <code>useRef</code> overload returns <code>RefObject&lt;T&gt;</code>,{' '}
          <code>RefObject.current</code> is writable, and <code>MutableRefObject</code> is
          marked <em>@deprecated — use RefObject instead</em>.
        </p>
        <p>
          What the argument still controls is the <em>nullability</em> baked into the type:{' '}
          <code>useRef&lt;HTMLInputElement&gt;(null)</code> gives{' '}
          <code>RefObject&lt;HTMLInputElement | null&gt;</code>, while{' '}
          <code>useRef&lt;number&gt;(0)</code> gives <code>RefObject&lt;number&gt;</code> with no{' '}
          <code>null</code> to check.
        </p>
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
    <AuthCtx value={{ user, login, logout: () => setUser(null) }}>
      {children}
    </AuthCtx>
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

      <p>
        The table below is worth having, but memorising it is the wrong goal &mdash; there are
        dozens of elements and you will always hit one that is not listed. Learn to{' '}
        <em>derive</em> the type instead. Three techniques, in order of how often you should
        reach for them:
      </p>

      <CodeBlock language="tsx" title="How to find an event type without looking it up">{
`// 1. Write the handler INLINE first. In a JSX attribute the parameter is
//    contextually typed, so TypeScript already knows it — hover to read it,
//    then copy the annotation out to a named function.
<input onChange={(e) => { /* e: React.ChangeEvent<HTMLInputElement> */ }} />

// 2. Ask the element's props for it. This always works, for any element and
//    any handler, and never goes stale:
type InputChange = React.ComponentProps<'input'>['onChange'];
//   → React.ChangeEventHandler<HTMLInputElement> | undefined

const handleChange: NonNullable<InputChange> = (e) => {
  e.target.value;   // string — fully typed, nothing memorised
};

// 3. Recognise the naming scheme. It is completely regular:
//      React.<Kind>Event<TElement>          — the event object
//      React.<Kind>EventHandler<TElement>   — the whole handler function
//    so Change / Mouse / Keyboard / Focus / Form / Drag / Pointer / Wheel
//    / Clipboard / Touch / Animation / Transition all follow the same shape.`
      }</CodeBlock>

      <InfoBox variant="warning" title="Two Traps Worth Knowing Before They Bite">
        <p>
          <strong>The element parameter is not decoration.</strong>{' '}
          <code>{'ChangeEvent<HTMLInputElement>'}</code> is what makes{' '}
          <code>e.target.value</code> a <code>string</code>. Write plain{' '}
          <code>{'ChangeEvent<Element>'}</code> and <code>e.target</code> has no{' '}
          <code>value</code> at all &mdash; you get{' '}
          <em>TS2339: Property &apos;value&apos; does not exist on type &apos;EventTarget
          &amp; Element&apos;</em>, which reads like a React problem and is really a missing
          type argument.
        </p>
        <p>
          <strong><code>currentTarget</code> is typed; <code>target</code> often is not.</strong>{' '}
          On most React event types <code>currentTarget</code> is the element you attached the
          handler to (known statically), while <code>target</code> is whatever was actually
          clicked (not knowable) and is typed as a bare <code>EventTarget</code>.{' '}
          <code>ChangeEvent</code> is the friendly exception that types both. When{' '}
          <code>e.target.something</code> will not compile, reach for{' '}
          <code>e.currentTarget</code> before reaching for a cast.
        </p>
      </InfoBox>

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
  return <TodoCtx value={{ todos, dispatch }}>{children}</TodoCtx>;
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

      <h2>9. Typing Refs on Components</h2>

      <p>
        In React 19, <code>ref</code> is an ordinary prop on function components.
        You type it like any other prop &mdash; no wrapper function, no reversed
        generic order to memorise.
      </p>

      <CodeBlock language="tsx" title="React 19 — ref as a plain prop">{
`import type { ComponentPropsWithRef, Ref } from 'react';

interface TextInputProps {
  label: string;
  error?: string;
  name: string;
  ref?: Ref<HTMLInputElement>;   // just another optional prop
}

function TextInput({ label, error, name, ref, ...rest }: TextInputProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input ref={ref} id={name} name={name} {...rest} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

// Even less typing: ComponentPropsWithRef pulls in ref AND every native
// <input> attribute, so callers get placeholder, disabled, onChange, etc.
interface BetterInputProps extends ComponentPropsWithRef<'input'> {
  label: string;
  error?: string;
}

function BetterInput({ label, error, ref, ...rest }: BetterInputProps) {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} {...rest} />
    </div>
  );
}

// Parent — ref is typed as HTMLInputElement
const inputRef = useRef<HTMLInputElement>(null);
<TextInput ref={inputRef} label="Name" name="name" />`
      }</CodeBlock>

      <InfoBox variant="tip" title="useRef Typing Cheat Sheet">
        <p>
          <code>useRef&lt;HTMLInputElement&gt;(null)</code> gives{' '}
          <code>RefObject&lt;HTMLInputElement | null&gt;</code> &mdash; the right choice for a DOM
          ref you hand to JSX. Use <code>useRef&lt;number&gt;(0)</code> when you want a
          mutable box you write to yourself. In React 19 the two-overload distinction
          from earlier versions is gone: <code>ref.current</code> is always writable, and
          you always null-check before touching a DOM node.
        </p>
      </InfoBox>

      <CodeBlock language="tsx" title="Legacy — forwardRef (no longer necessary in React 19)">{
`import { forwardRef } from 'react';

// Still works, but no longer necessary. You will see this everywhere in
// code written before React 19, and in most component libraries.
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, name, ...rest }, ref) => (
    <input ref={ref} id={name} name={name} {...rest} />
  )
);
TextInput.displayName = 'TextInput';   // forwardRef components need this`
      }</CodeBlock>

      <InfoBox variant="warning" title="forwardRef Generic Order Is Backwards">
        <p>
          If you are reading or maintaining legacy code, note the order is{' '}
          <code>forwardRef&lt;RefType, PropsType&gt;</code> &mdash; the <em>ref element type comes
          first</em>, then props. This trips up almost everyone. It is one more reason to
          migrate to the plain-prop form, where the ref is typed inline with everything else.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Precisely: not deprecated yet, but on that path">
        <p>
          Be exact about where <code>forwardRef</code> actually stands. It carries no{' '}
          <code>@deprecated</code> tag in <code>@types/react</code> today, and calling it does not
          warn. The official React docs say <code>ref</code> being a normal prop makes{' '}
          <code>forwardRef</code> &ldquo;no longer necessary&rdquo; and that it{' '}
          <strong>&ldquo;will be deprecated in a future release&rdquo;</strong> &mdash; future
          tense, not a done deal. The practical advice does not change: write new components with
          the plain-prop form. Just do not tell a teammate it is deprecated today; it is
          scheduled to be.
        </p>
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

      <h2>14. Typing Hook Returns — The <code>Use&lt;Hook&gt;Result</code> Convention</h2>

      <p>
        Section 7 covered the mechanics of typing a custom hook. This section is about the <strong>naming convention</strong>{' '}
        for hook input and output types — a small habit that pays huge dividends across a codebase.
      </p>

      <h3>The convention</h3>

      <CodeBlock language="ts" title="Named interfaces for hook inputs and outputs" showLineNumbers>
{`// Convention: export NAMED interfaces for what goes in and what comes out.
//
//   Use<HookName>Params  / Use<HookName>Options  → for the argument
//   Use<HookName>Result  / Use<HookName>Return   → for the return value

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalItems: number;
}

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  totalPages: number;
  goToPage: (n: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination(options: UsePaginationOptions): UsePaginationResult {
  // ... implementation
  return {
    page: /* ... */ 1,
    pageSize: options.pageSize ?? 10,
    totalPages: 0,
    goToPage: () => {},
    nextPage: () => {},
    prevPage: () => {},
    canGoNext: false,
    canGoPrev: false,
  };
}`}
      </CodeBlock>

      <h3>Why named types beat anonymous returns</h3>

      <CodeBlock language="ts" title="Anonymous vs named return type" showLineNumbers>
{`// ❌ Anonymous inline return — works, but…
export function usePagination(opts: { totalItems: number }) {
  return {
    page: 1,
    nextPage: () => {},
    /* ... */
  };
}

// Problems:
//   1. Consumers can't reference the return type by name in their own props.
//   2. Mocking in tests requires re-inferring the shape every time.
//   3. JSDoc / API docs have nothing to anchor to.
//   4. Renaming a field shows up in 100 'Property X does not exist' errors
//      with no obvious source-of-truth file to fix.

// ─────────────────────────────────────────────────────────────

// ✅ Named result interface
export interface UsePaginationResult { /* ... */ }
export function usePagination(opts: UsePaginationOptions): UsePaginationResult { /* ... */ }

// Now callers can:
function Toolbar(props: { pagination: UsePaginationResult }) {
  /* explicitly typed against the hook's contract */
}

// And tests can mock easily:
const mockPagination: UsePaginationResult = {
  page: 1, pageSize: 10, totalPages: 5,
  goToPage: jest.fn(), nextPage: jest.fn(), prevPage: jest.fn(),
  canGoNext: true, canGoPrev: false,
};`}
      </CodeBlock>

      <h3>Generic hooks return generic result types</h3>

      <CodeBlock language="ts" title="Generics flow through the naming convention" showLineNumbers>
{`// When the hook is generic, its result type is generic too.
// Same naming convention, with the type parameter threaded through.

export interface UsePaginatedItemsOptions<T> {
  items: T[];
  pageSize?: number;
}

export interface UsePaginatedItemsResult<T> {
  page: number;
  pageItems: T[];
  totalPages: number;
  goToPage: (n: number) => void;
}

export function usePaginatedItems<T>(
  opts: UsePaginatedItemsOptions<T>
): UsePaginatedItemsResult<T> {
  // ... implementation
  return {
    page: 1,
    pageItems: opts.items.slice(0, opts.pageSize ?? 10),
    totalPages: Math.ceil(opts.items.length / (opts.pageSize ?? 10)),
    goToPage: () => {},
  };
}

// Consumer:
const { pageItems } = usePaginatedItems({ items: products });
//      ^ inferred as Product[]`}
      </CodeBlock>

      <h3>When to return a tuple instead of an object</h3>

      <p>
        React itself uses tuples (<code>const [state, setState] = useState(0)</code>) for two-element returns. For
        custom hooks, follow the same rule: <strong>tuples are great for exactly two values where the order is
        intuitive</strong> — typically <code>[value, setter]</code>. For three or more values, switch to an object so
        consumers don't have to memorize positions.
      </p>

      <CodeBlock language="ts" title="Tuple vs object — when each fits" showLineNumbers>
{`// ✅ Two values, obvious order — tuple is idiomatic
export function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}
const [isOpen, toggleOpen] = useToggle();

// ❌ Three+ values as a tuple — order is arbitrary, hard to read at call site
export function useFetchBad(): [Data | null, boolean, string | null, () => void] {
  /* ... */
  return [null, false, null, () => {}];
}
const [data, loading, error, refetch] = useFetchBad();
//     ^ what order? readers can't tell without checking the source

// ✅ Three+ values as a named object — self-documenting
export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
export function useFetch<T>(url: string): UseFetchResult<T> {
  /* ... */
  return { data: null, loading: false, error: null, refetch: () => {} };
}
const { data, loading, error, refetch } = useFetch<Recipe>('/recipes/me');
//      ^ order doesn't matter; destructuring is self-documenting`}
      </CodeBlock>

      <InfoBox variant="tip" title="Concrete rule">
        <p>
          <strong>2 values, obvious order:</strong> tuple — <code>[value, setter]</code>, <code>[isOpen, toggle]</code>.<br />
          <strong>3+ values, or any non-obvious order:</strong> named-object return with an exported{' '}
          <code>Use&lt;Hook&gt;Result</code> interface.
        </p>
      </InfoBox>

      <h3>Putting it all together</h3>

      <CodeBlock language="ts" title="One file per hook — the full convention" showLineNumbers>
{`// hooks/useShoppingCart.ts

import { useState, useCallback, useMemo } from 'react';

// ── 1. Domain types (often imported from a shared types file) ────────────────
export interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// ── 2. Hook input contract ───────────────────────────────────────────────────
export interface UseShoppingCartOptions {
  initialItems?: CartItem[];
  taxRate?: number;
}

// ── 3. Hook output contract ──────────────────────────────────────────────────
export interface UseShoppingCartResult {
  items: ReadonlyArray<CartItem>;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  subtotal: number;
  tax: number;
  total: number;
}

// ── 4. Hook implementation, fully typed against 2 and 3 ──────────────────────
export function useShoppingCart(
  options: UseShoppingCartOptions = {}
): UseShoppingCartResult {
  const { initialItems = [], taxRate = 0 } = options;
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const addItem = useCallback((item: CartItem) => {
    setItems((curr) => [...curr, item]);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((curr) => curr.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return { items, addItem, removeItem, clear, subtotal, tax, total };
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Why this pays off">
        <p>
          Three exported interfaces (<code>CartItem</code>, <code>UseShoppingCartOptions</code>,{' '}
          <code>UseShoppingCartResult</code>) give every consumer something to import, every test something to mock
          against, and every refactor a clear blast radius. The hook's <em>contract</em> is now searchable, type-safe,
          and stable — independent of its <em>implementation</em>.
        </p>
      </InfoBox>

      <h2>15. Interactive Challenges</h2>

      <InteractiveChallenge
        question={"Under React 19's types, which of these does NOT give you a usable <input> ref?"}
        options={[
          "useRef<HTMLInputElement>(null)",
          "useRef<HTMLInputElement | null>(null)",
          "useRef<HTMLInputElement>(undefined)",
          "Both A and B work and produce the identical type",
        ]}
        correctIndex={2}
        explanation={"A and B are indistinguishable in React 19 — both resolve to RefObject<HTMLInputElement | null>, so option D is a true statement and neither is 'wrong'. C is the odd one out: it selects the `initialValue: T | undefined` overload and yields RefObject<HTMLInputElement | undefined>, which JSX will not accept as a ref (a ref's current must be able to hold null). Note that pre-19 answers claiming option B creates a 'MutableRefObject' are stale — useRef has no MutableRefObject overload any more."}
        language="tsx"
        code={`const a = useRef<HTMLInputElement>(null);        // RefObject<HTMLInputElement | null>
const b = useRef<HTMLInputElement | null>(null); // RefObject<HTMLInputElement | null>  — same
const c = useRef<HTMLInputElement>(undefined);   // RefObject<HTMLInputElement | undefined>

a.current?.focus();  // safe, typed
<input ref={a} />    // c would be rejected here`}
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
