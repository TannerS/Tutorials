import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideTypingReact() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React + TypeScript · Field Reference"
      title="Typing React"
      tagline="Every hook, prop, and event typed correctly on the first try — condensed for offline study."
      meta={['React 19', '13 patterns']}
      footerLabel="Personal study reference — React + TypeScript"
      pageLabel="React + TS Field Guide · Typing React"
      prev={{ path: '/react-field-guide/typescript-types', label: 'TypeScript Types & Generics' }}
      next={{ path: '/react-field-guide/state-management', label: 'State Management' }}
    >
      <PosterCard
        glyph="FC"
        title={<>Function <span className="dim">Components</span></>}
        code={`// Inline / inferred — RECOMMENDED
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

// React.FC — avoid: implicit children, no generics
const Greeting: React.FC<{ name: string }> = ({ name }) => <h1>{name}</h1>;`}
        caption="Skip React.FC — it used to implicitly add children and it can't express generic components. Destructure typed props inline instead."
      />

      <PosterCard
        glyph="Pr"
        title={<>Props <span className="dim">Typing Patterns</span></>}
        code={`interface CardProps {
  title: string;          // required
  subtitle?: string;      // optional
  maxWidth?: number;
}
function Card({ title, subtitle, maxWidth = 400 }: CardProps) { /* ... */ }
// JS default parameters — NOT defaultProps (deprecated in React 18.3+)`}
        caption="Optional props get a `?`; defaults come from JS destructuring defaults, not the old defaultProps API."
      />

      <PosterCard
        glyph="uS"
        title={<>useState<span className="dim"> generics</span></>}
        code={`const [count, setCount] = useState(0); // inferred: number

// generic needed when initial value ≠ full type
const [user, setUser] = useState<User | null>(null);
const [status, setStatus] =
  useState<'idle' | 'loading' | 'error'>('idle');`}
        caption="Add the generic whenever the initial value can't represent every possible future value — null starting states are the most common case."
      />

      <PosterCard
        glyph="uR"
        title={<>useReducer<span className="dim"> generics</span></>}
        code={`type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User[] };

function reducer(state: State, action: Action): State {
  switch (action.type) { /* ... */ }
}
const [state, dispatch] = useReducer(reducer, initial);`}
        caption="Type the action as a discriminated union — dispatch becomes fully checked, and a missing payload is a compile error, not a runtime bug."
      />

      <PosterCard
        glyph="Rf"
        title={<>useRef<span className="dim"> — DOM vs mutable</span></>}
        code={`// DOM ref — pass null, readonly .current
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();

// mutable ref — pass initial value, writable .current
const renderCount = useRef<number>(0);`}
        caption="Passing null with a non-null generic gives a read-only DOM ref; passing a real initial value gives a writable mutable ref. Always null for DOM refs."
      />

      <PosterCard
        glyph="Cx"
        title={<>useContext<span className="dim"> — guarded pattern</span></>}
        code={`const AuthCtx = createContext<AuthContext | undefined>(undefined);

function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}`}
        caption="Default to undefined, never a fake cast — the guard hook turns 'used outside provider' into a loud error instead of a silent undefined bug."
      />

      <PosterCard
        glyph="Ev"
        title={<>Event <span className="dim">Handler Types</span></>}
        code={`function handleChange(e: React.ChangeEvent<HTMLInputElement>) {}
function handleSubmit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); }
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {}
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {}`}
        caption="Every DOM event type takes the target element as its generic — match the element the handler is actually attached to, not the element being changed."
      />

      <PosterCard
        glyph="Fm"
        title={<>Typing <span className="dim">Forms</span></>}
        code={`interface FormData { username: string; role: 'admin' | 'editor' | 'viewer'; }

const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setForm(prev => ({ ...prev, role: e.target.value as FormData['role'] }));
};`}
        caption="<select> values are always string at the DOM level — cast back to your literal union type when writing them into typed state."
      />

      <PosterCard
        glyph="Hk"
        title={<>Custom <span className="dim">Hooks</span></>}
        code={`function useLocalStorage<T>(key: string, initial: T) {
  const [stored, setStored] = useState<T>(/* ... */);
  const setValue = (v: T | ((prev: T) => T)) => { /* ... */ };
  return [stored, setValue] as const; // tuple, not union array
}`}
        caption="as const on a [value, setter] return turns it into a proper tuple type — without it, TS infers a plain array and destructuring order is untyped."
      />

      <PosterCard
        glyph="HOC"
        title={<>HOC <span className="dim">&amp; Render Props</span></>}
        code={`function withTheme<P extends object>(Wrapped: React.ComponentType<P & { theme: Theme }>) {
  return function Themed(props: Omit<P & { theme: Theme }, 'theme'>) {
    const theme = useThemeFromContext();
    return <Wrapped {...(props as P)} theme={theme} />;
  };
}`}
        caption="P extends object keeps the wrapped component's own props flowing through; Omit strips the injected prop back out of what callers must supply."
      />

      <PosterCard
        glyph="fR"
        title={<>forwardRef<span className="dim">()</span></>}
        code={`const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, ...rest }, ref) => (
    <div><label>{label}</label><input ref={ref} {...rest} /></div>
  )
);`}
        caption="Generic order is forwardRef<RefType, PropsType> — ref type first, the opposite order from how you'd guess reading the JSX."
      />

      <PosterCard
        glyph="Ge"
        title={<>Generic <span className="dim">Components</span></>}
        code={`interface SelectProps<T> {
  items: T[];
  onChange: (item: T) => void;
  getLabel: (item: T) => string;
}
function Select<T>({ items, onChange, getLabel }: SelectProps<T>) { /* ... */ }

<Select<User> items={users} onChange={setUser} getLabel={u => u.name} />`}
        caption="A plain function component can take its own type parameter; React.FC cannot — one more reason to avoid it for reusable primitives."
      />

      <PosterCard
        glyph="19"
        title={<>React 19 <span className="dim">Types</span></>}
        badge="R19"
        code={`async function submitAction(prev: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string;
  if (!name) return { message: '', errors: { name: 'Required' } };
  return { message: 'Saved!', errors: {} };
}
const [state, formAction, isPending] = useActionState(submitAction, initial);`}
        caption="The action's signature is (prevState, formData) => Promise<State> — its inferred return type becomes the type of state automatically."
      />

      <PosterQuickRef
        title="Which typing pattern do I need?"
        rows={[
          { need: "Type a component's props", answer: 'Inline destructured interface, not React.FC' },
          { need: "Type a hook's initial null state", answer: 'useState<T | null>(null)' },
          { need: 'Type a DOM ref', answer: 'useRef<HTMLElement>(null)' },
          { need: 'Type a context with a guard', answer: 'createContext<T | undefined>(undefined) + guard hook' },
          { need: 'Type a form input change', answer: 'React.ChangeEvent<HTMLInputElement>' },
          { need: 'Type a submit handler', answer: 'React.FormEvent<HTMLFormElement>' },
          { need: 'Type a [value, setter] hook return', answer: 'as const tuple' },
          { need: 'Type a ref-forwarding component', answer: 'forwardRef<RefType, PropsType>' },
          { need: 'Type a reusable list/select', answer: 'Generic component (plain function, not FC)' },
          { need: 'Type a form action', answer: 'useActionState(action, initialState)' },
        ]}
      />
    </PosterLayout>
  );
}
