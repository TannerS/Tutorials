import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function State() {
  return (
    <LessonLayout
      title="State & Forms"
      sectionId="react-cheatsheet"
      lessonIndex={2}
      prev={{ path: '/react-cheatsheet/patterns', label: 'Component Patterns' }}
      next={{ path: '/react-cheatsheet/styling', label: 'Styling Approaches' }}
    >
      <p>State management patterns, form handling recipes, and React 19 form actions — all in one place.</p>

      <FlowChart
        title="State Management Decision"
        chart={"graph TD\n  A[Where does state live?] --> B{Shared across components?}\n  B -->|No| C[useState / useReducer]\n  B -->|Yes| D{How many consumers?}\n  D -->|Few nearby| E[Lift state up]\n  D -->|Many / deep| F[Context + useReducer]\n  D -->|App-wide + complex| G[External store: Zustand / Redux]"}
      />

      {/* ── useState Patterns ────────────────────────────── */}
      <h2>useState Patterns</h2>
      <CodeBlock language="jsx" title="Common useState Recipes">
{`// Toggle
const [open, setOpen] = useState(false);
const toggle = () => setOpen(prev => !prev);

// Counter
const [count, setCount] = useState(0);
const inc = () => setCount(prev => prev + 1);
const dec = () => setCount(prev => Math.max(0, prev - 1));
const reset = () => setCount(0);

// Object state
const [form, setForm] = useState({ name: '', email: '' });
const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

// Array state
const [items, setItems] = useState([]);
const add = (item) => setItems(prev => [...prev, item]);
const remove = (id) => setItems(prev => prev.filter(x => x.id !== id));
const update = (id, data) =>
  setItems(prev => prev.map(x => x.id === id ? { ...x, ...data } : x));
const reorder = (from, to) =>
  setItems(prev => {
    const next = [...prev];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  });`}
      </CodeBlock>

      {/* ── useReducer ───────────────────────────────────── */}
      <h2>useReducer for Complex State</h2>
      <CodeBlock language="jsx" title="useReducer Pattern">
{`const initialState = { items: [], filter: 'all', loading: false };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, items: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(x => x.id !== action.payload) };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'ADD_ITEM', payload: { id: 1, text: 'New' } });`}
      </CodeBlock>

      <InfoBox variant="tip" title="useState vs useReducer">
        <p><strong>useState</strong> — simple values, independent updates, few transitions.</p>
        <p><strong>useReducer</strong> — related state fields, complex transitions, when next state depends on multiple current values, or when you want to pass dispatch down instead of multiple setters.</p>
      </InfoBox>

      {/* ── Form Handling ────────────────────────────────── */}
      <h2>Controlled Form Inputs</h2>
      <CodeBlock language="jsx" title="All Input Types">
{`function FullForm() {
  const [form, setForm] = useState({
    name: '', email: '', bio: '', role: 'dev', agree: false, plan: 'free',
  });

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Text */}
      <input name="name" value={form.name} onChange={set} />

      {/* Email */}
      <input name="email" type="email" value={form.email} onChange={set} />

      {/* Textarea */}
      <textarea name="bio" value={form.bio} onChange={set} />

      {/* Select */}
      <select name="role" value={form.role} onChange={set}>
        <option value="dev">Developer</option>
        <option value="pm">PM</option>
      </select>

      {/* Checkbox */}
      <input name="agree" type="checkbox" checked={form.agree} onChange={set} />

      {/* Radio group */}
      {['free', 'pro', 'enterprise'].map(plan => (
        <label key={plan}>
          <input type="radio" name="plan" value={plan}
            checked={form.plan === plan} onChange={set} />
          {plan}
        </label>
      ))}
    </form>
  );
}`}
      </CodeBlock>

      {/* ── Validation ───────────────────────────────────── */}
      <h2>Form Validation</h2>
      <CodeBlock language="jsx" title="Validation Pattern">
{`function useFormValidation(values, rules) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    const newErrors = {};
    for (const [field, rule] of Object.entries(rules)) {
      const error = rule(values[field], values);
      if (error) newErrors[field] = error;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const blur = (field) => setTouched(prev => ({ ...prev, [field]: true }));
  const error = (field) => touched[field] ? errors[field] : undefined;
  return { validate, blur, error, errors };
}

// Usage
const { validate, blur, error } = useFormValidation(form, {
  name:  (v) => !v ? 'Required' : v.length < 2 ? 'Min 2 chars' : null,
  email: (v) => !v ? 'Required' : !v.includes('@') ? 'Invalid email' : null,
});`}
      </CodeBlock>

      {/* ── React 19 Form Actions ────────────────────────── */}
      <h2>React 19 Form Actions</h2>

      <FlowChart
        title="React 19 Form Flow"
        chart={"graph LR\n  A[form action=fn] --> B[useActionState]\n  B --> C[isPending + state]\n  C --> D[useFormStatus in children]\n  D --> E[useOptimistic for instant UI]"}
      />

      <CodeBlock language="jsx" title="Full React 19 Form Example">
{`import { useActionState, useOptimistic } from 'react';

function TodoForm({ todos, addTodo }) {
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      const text = formData.get('text');
      if (!text?.trim()) return { error: 'Text is required' };
      try {
        await addTodo(text);
        return { error: null };
      } catch (e) {
        return { error: e.message };
      }
    },
    { error: null }
  );

  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (current, newText) => [...current, { id: 'temp', text: newText, pending: true }]
  );

  return (
    <>
      <ul>
        {optimisticTodos.map(t => (
          <li key={t.id} style={{ opacity: t.pending ? 0.5 : 1 }}>{t.text}</li>
        ))}
      </ul>
      <form action={async (formData) => {
        addOptimistic(formData.get('text'));
        await formAction(formData);
      }}>
        <input name="text" />
        <button disabled={isPending}>Add</button>
        {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      </form>
    </>
  );
}`}
      </CodeBlock>

      {/* ── Multi-Step Forms ─────────────────────────────── */}
      <h2>Multi-Step Form</h2>
      <CodeBlock language="jsx" title="Multi-Step Form Pattern">
{`function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: '', email: '', plan: 'free' });

  const steps = [
    <StepName value={data.name} onChange={v => setData(p => ({ ...p, name: v }))} />,
    <StepEmail value={data.email} onChange={v => setData(p => ({ ...p, email: v }))} />,
    <StepPlan value={data.plan} onChange={v => setData(p => ({ ...p, plan: v }))} />,
    <StepReview data={data} />,
  ];

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));
  const isLast = step === steps.length - 1;

  return (
    <div>
      <ProgressBar current={step} total={steps.length} />
      {steps[step]}
      <div>
        {step > 0 && <button onClick={prev}>Back</button>}
        <button onClick={isLast ? handleSubmit : next}>
          {isLast ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}`}
      </CodeBlock>

      {/* ── Dynamic Forms ────────────────────────────────── */}
      <h2>Dynamic Forms</h2>
      <CodeBlock language="jsx" title="Dynamic Field List">
{`function DynamicForm() {
  const [fields, setFields] = useState([{ id: crypto.randomUUID(), value: '' }]);

  const addField = () =>
    setFields(prev => [...prev, { id: crypto.randomUUID(), value: '' }]);
  const removeField = (id) =>
    setFields(prev => prev.filter(f => f.id !== id));
  const updateField = (id, value) =>
    setFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));

  return (
    <div>
      {fields.map(field => (
        <div key={field.id}>
          <input value={field.value} onChange={e => updateField(field.id, e.target.value)} />
          <button onClick={() => removeField(field.id)}>✕</button>
        </div>
      ))}
      <button onClick={addField}>+ Add Field</button>
    </div>
  );
}`}
      </CodeBlock>

      {/* ── Debounced Input ──────────────────────────────── */}
      <h2>Debounced Input</h2>
      <CodeBlock language="jsx" title="Debounced Search">
{`function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`}
      </CodeBlock>

      {/* ── Context Global State ─────────────────────────── */}
      <h2>Context for Global State</h2>
      <CodeBlock language="jsx" title="Context + Reducer Pattern">
{`const StoreContext = createContext();

function storeReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':    return { ...state, user: action.payload };
    case 'SET_THEME':   return { ...state, theme: action.payload };
    case 'ADD_NOTIFICATION': return {
      ...state, notifications: [...state.notifications, action.payload],
    };
    default: return state;
  }
}

function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(storeReducer, {
    user: null, theme: 'light', notifications: [],
  });
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}`}
      </CodeBlock>

      {/* ── State Lifting ────────────────────────────────── */}
      <h2>State Lifting</h2>
      <CodeBlock language="jsx" title="Lifting State Up">
{`// When siblings need shared state, lift it to their parent
function Parent() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <List items={items} onSelect={setSelected} />
      <Detail item={selected} />
    </>
  );
}

// Rule of thumb: state lives in the lowest common ancestor
// of all components that need it.`}
      </CodeBlock>

      <InteractiveChallenge
        question={"In React 19, what does useActionState return?"}
        options={[
          "[state, setState]",
          "[state, formAction, isPending]",
          "[state, dispatch]",
          "[formData, isPending]"
        ]}
        correctIndex={1}
        explanation={"useActionState returns [state, formAction, isPending]. 'state' is the current form state, 'formAction' is passed to the form's action prop, and 'isPending' indicates if the action is running."}
        language="jsx"
      />
    </LessonLayout>
  );
}

export default State;
