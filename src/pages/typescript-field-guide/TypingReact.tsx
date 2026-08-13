import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideTypingReact() {
  return (
    <PosterLayout
      accent="blue"
      eyebrow="TypeScript · Field Reference"
      title="Typing React"
      tagline="Every hook, prop, and event typed correctly on the first try — condensed for offline study."
      meta={['React 19', '13 patterns']}
      footerLabel="Personal study reference — React + TypeScript"
      pageLabel="TypeScript Field Guide · Typing React"
      prev={{ path: '/typescript-field-guide/typescript-types', label: 'TypeScript Types & Generics' }}
      next={{ path: '/typescript-field-guide/migration-enterprise', label: 'Migration & Enterprise Patterns' }}
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
// JS default parameters — NOT defaultProps.
// React 19 REMOVED defaultProps on function components: it is now
// silently ignored, so the old form fails without any warning.`}
        caption="Optional props get a `?`; defaults come from JS destructuring defaults. defaultProps was deprecated in 18.3 and removed for function components in React 19 — it does nothing now, and nothing tells you. Class components still honour it."
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
        code={`// DOM ref — pass null. Type is RefObject<HTMLInputElement | null>
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();

// Instance ref — pass the initial value. RefObject<number>
const renderCount = useRef<number>(0);

// ❌ useRef();  — the zero-argument overload was REMOVED in
//    @types/react 19. "Expected 1 arguments, but got 0."
// ❌ MutableRefObject<T> — deprecated; no useRef overload returns it.`}
        caption="An argument is now mandatory — pass null for DOM refs, a real value for instance refs. Both return RefObject<T>, and in React 19 its .current is writable in every case: the old readonly-vs-mutable split (RefObject vs MutableRefObject) is gone, so reach for RefObject<T> in your own annotations and never MutableRefObject."
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
        glyph="rP"
        title={<>Typing a <span className="dim">ref prop</span></>}
        badge="R19"
        code={`// ✅ React 19 — ref is an ordinary prop. No wrapper.
interface TextInputProps extends ComponentPropsWithRef<'input'> {
  label: string;
}
function TextInput({ label, ref, ...rest }: TextInputProps) {
  return <div><label>{label}</label><input ref={ref} {...rest} /></div>;
}

// Custom handle via useImperativeHandle — still no forwardRef
interface Handle { focus(): void }
function Fancy({ ref }: { ref?: Ref<Handle> }) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inner.current?.focus() }), []);
  return <input ref={inner} />;
}

// ⚠️ DEPRECATED — you'll still read this everywhere pre-2025
const Old = forwardRef<HTMLInputElement, Props>(({ label, ...r }, ref) => ...);`}
        caption="forwardRef is deprecated in React 19 and slated for removal — ref is just a prop on function components now. Two type notes: ComponentPropsWithRef<'input'> already includes the correctly-typed ref, and ComponentPropsWithoutRef is the one you want when you are NOT forwarding. If you do read the old form, the generic order is forwardRef<RefType, PropsType> — ref first, which is the reverse of what the JSX suggests."
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
          { need: 'Type a DOM ref', answer: 'useRef<HTMLElement>(null) — the arg is required' },
          { need: 'Type a context with a guard', answer: 'createContext<T | undefined>(undefined) + guard hook' },
          { need: 'Type a form input change', answer: 'React.ChangeEvent<HTMLInputElement>' },
          { need: 'Type a submit handler', answer: 'React.FormEvent<HTMLFormElement>' },
          { need: 'Type a [value, setter] hook return', answer: 'as const tuple' },
          { need: 'Type a ref-forwarding component', answer: 'Accept `ref` as a prop — ComponentPropsWithRef<"input"> (R19)' },
          { need: 'Type a reusable list/select', answer: 'Generic component (plain function, not FC)' },
          { need: 'Type a form action', answer: 'useActionState(action, initialState)' },
        ]}
      />
    </PosterLayout>
  );
}
