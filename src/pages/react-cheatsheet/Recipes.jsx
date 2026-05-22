import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactCRecipes() {
  return (
    <LessonLayout
      title="React Recipes"
      sectionId="react-cheatsheet"
      lessonIndex={4}
      prev={{ path: "/react-cheatsheet/styling", label: "Styling Cheat Sheet" }}
      next={{ path: "/testing/intro", label: "Testing Introduction" }}
    >
      <p>Common React code recipes — copy-paste ready solutions for the most frequent patterns.</p>

      <CodeBlock language="jsx" title="Data Fetching Recipe">
{`// Complete data fetching with loading, error, and empty states
function UserList() {
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    }),
  });

  if (isLoading) return <div className="skeleton" aria-busy="true">Loading...</div>;
  if (error)     return (
    <div role="alert">
      <p>Error: {error.message}</p>
      <button onClick={() => refetch()}>Retry</button>
    </div>
  );
  if (!users?.length) return <p>No users found.</p>;

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Form Recipe with Validation">
{`function LoginForm({ onSuccess }) {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isPending, setIsPending] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (form.password.length < 8)  errs.password = 'Min 8 characters';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsPending(true);
    try {
      await login(form.email, form.password);
      onSuccess();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsPending(false);
    }
  };

  const field = name => ({
    value: form[name],
    onChange: e => {
      setForm(f => ({ ...f, [name]: e.target.value }));
      if (errors[name]) setErrors(er => ({ ...er, [name]: undefined }));
    },
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? \`\${name}-error\` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors.form && <p role="alert">{errors.form}</p>}
      <label>Email <input type="email" {...field('email')} /></label>
      {errors.email && <p id="email-error" role="alert">{errors.email}</p>}
      <label>Password <input type="password" {...field('password')} /></label>
      {errors.password && <p id="password-error" role="alert">{errors.password}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Modal, Toast, and Infinite Scroll Recipes">
{`// Modal with Portal + focus trap
function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return createPortal(
    <div role="dialog" aria-modal="true"
         style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'grid', placeItems:'center' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'white', borderRadius:8, padding:24, minWidth:320 }}>
        {children}
        <button onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>,
    document.body
  );
}

// Infinite scroll with Intersection Observer
function useInfiniteScroll(loadMore) {
  const sentinelRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);
  return sentinelRef;
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="Why should form submit buttons use type='submit' rather than an onClick handler?"
        options={["type='submit' is faster", "type='submit' works with the form's onSubmit, enabling keyboard submission (Enter key) and proper HTML form semantics", "onClick doesn't work on buttons", "type='submit' automatically validates the form"]}
        correctIndex={1}
        explanation="Using type='submit' and handling onSubmit on the <form> enables: Enter key submission from any input, browser native validation (noValidate disables it when you handle custom validation), proper form accessibility semantics, and compatibility with password managers and autofill."
      />

    </LessonLayout>
  );
}
