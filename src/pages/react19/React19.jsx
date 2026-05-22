import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function React19() {
  return (
    <LessonLayout
      title="React 19 New Features"
      sectionId="react19"
      lessonIndex={6}
      prev={{ path: '/react19/performance', label: 'Performance & Memoization' }}
      next={{ path: '/react19/server', label: 'Server Components & Actions' }}
    >
      <p>React 19 is the most significant release since hooks. It introduces the React Compiler (automatic memoization), Actions for async state transitions, new hooks for forms and optimistic UI, and the <code>use()</code> hook. Let's dive into each.</p>

      <h2>React Compiler (React Forget)</h2>

      <InfoBox variant="success" title="The End of Manual Memoization">
        <p>The React Compiler automatically memoizes components, hooks, and their dependencies at build time. This means <code>useMemo</code>, <code>useCallback</code>, and <code>React.memo</code> are largely unnecessary in React 19 projects using the compiler. It analyzes your code and inserts memoization where beneficial.</p>
      </InfoBox>

      <FlowChart
        title="React Compiler — Before and After"
        chart={"graph LR\n  A[Your Code] --> B[React Compiler - Build Step]\n  B --> C[Auto-memoized Output]\n  D[Before: Manual] --> E[useMemo useCallback React.memo]\n  F[After: Compiler] --> G[Just write plain code]\n  G --> H[Compiler inserts memo where needed]\n  H --> I[Same or better performance]"}
      />

      <CodeBlock language="jsx" title="React Compiler — Write Less, Get More" showLineNumbers>
{`// BEFORE React 19 (manual memoization hell)
function TodoList({ todos, filter }) {
  const filteredTodos = useMemo(
    () => todos.filter(t => t.status === filter),
    [todos, filter]
  );

  const handleToggle = useCallback((id) => {
    dispatch({ type: 'TOGGLE', id });
  }, [dispatch]);

  return filteredTodos.map(todo => (
    <MemoizedTodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
  ));
}
const MemoizedTodoItem = React.memo(TodoItem);

// AFTER React 19 with Compiler — just write normal code
function TodoList({ todos, filter }) {
  const filteredTodos = todos.filter(t => t.status === filter);

  const handleToggle = (id) => {
    dispatch({ type: 'TOGGLE', id });
  };

  return filteredTodos.map(todo => (
    <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
  ));
}
// The compiler figures out what to memoize automatically!`}
      </CodeBlock>

      <h2>Actions & useActionState</h2>

      <p>Actions are async functions that handle form submissions and state transitions with built-in pending states, error handling, and optimistic updates.</p>

      <CodeBlock language="jsx" title="useActionState — Form Actions" showLineNumbers>
{`import { useActionState } from 'react';

// Action function: receives previous state + form data, returns new state
async function updateProfile(previousState, formData) {
  const name = formData.get('name');
  const email = formData.get('email');

  try {
    const result = await api.updateProfile({ name, email });
    return { success: true, message: 'Profile updated!', errors: null };
  } catch (error) {
    return { success: false, message: null, errors: error.fields };
  }
}

function ProfileForm() {
  // useActionState wraps an async action with pending state management
  const [state, formAction, isPending] = useActionState(updateProfile, {
    success: false,
    message: null,
    errors: null,
  });

  return (
    <form action={formAction}>
      <input name="name" disabled={isPending} />
      {state.errors?.name && <span>{state.errors.name}</span>}

      <input name="email" disabled={isPending} />
      {state.errors?.email && <span>{state.errors.email}</span>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>

      {state.message && <p>{state.message}</p>}
    </form>
  );
}
// No manual useState for loading/error/success states!
// No event.preventDefault() — React handles the form submission`}
      </CodeBlock>

      <h2>useFormStatus</h2>

      <CodeBlock language="jsx" title="useFormStatus — Child Components Read Form State" showLineNumbers>
{`import { useFormStatus } from 'react-dom';

// useFormStatus lets ANY child of a <form> read the pending state
// Must be rendered inside a <form> that uses an action
function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

// Works great for reusable form UI components
function FormProgress() {
  const { pending } = useFormStatus();
  return pending ? <ProgressBar /> : null;
}

function MyForm() {
  return (
    <form action={submitAction}>
      <input name="title" />
      <FormProgress />    {/* Reads pending state from nearest form */}
      <SubmitButton />    {/* Reads pending state from nearest form */}
    </form>
  );
}`}
      </CodeBlock>

      <h2>useOptimistic</h2>

      <CodeBlock language="jsx" title="useOptimistic — Instant UI Feedback" showLineNumbers>
{`import { useOptimistic } from 'react';

function MessageThread({ messages, sendMessage }) {
  // optimisticMessages shows immediately, reverts if action fails
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    // Merge function: (currentState, optimisticValue) => newOptimisticState
    (currentMessages, newMessage) => [
      ...currentMessages,
      { ...newMessage, status: 'sending' },
    ]
  );

  async function handleSend(formData) {
    const text = formData.get('message');
    const optimisticMsg = { id: crypto.randomUUID(), text, status: 'sending' };

    addOptimistic(optimisticMsg); // Instantly shows in UI

    // When this resolves, React uses the real 'messages' prop again
    await sendMessage(text);
  }

  return (
    <div>
      {optimisticMessages.map(msg => (
        <div key={msg.id} style={{ opacity: msg.status === 'sending' ? 0.7 : 1 }}>
          {msg.text}
          {msg.status === 'sending' && <span> (sending...)</span>}
        </div>
      ))}
      <form action={handleSend}>
        <input name="message" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}`}
      </CodeBlock>

      <h2>use() Hook — Resolve Promises & Read Context Conditionally</h2>

      <InfoBox variant="info" title="use() Breaks the Rules (Intentionally)">
        <p>The <code>use()</code> hook is special: it CAN be called inside conditionals and loops. It reads the value from a Promise (suspending until resolved) or from a Context. It replaces many patterns that previously required useEffect for data fetching.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="use() Hook — Promise Resolution" showLineNumbers>
{`import { use, Suspense } from 'react';

// use() with Promises — component suspends until resolved
function UserProfile({ userPromise }) {
  // Suspends this component until promise resolves
  const user = use(userPromise);

  return <h1>{user.name}</h1>;
}

// Parent creates the promise, child consumes it
function ProfilePage({ userId }) {
  // Start fetching immediately (not inside useEffect!)
  const userPromise = fetchUser(userId);

  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}

// use() with Context — can be conditional!
function Dashboard({ showAdmin }) {
  if (showAdmin) {
    const admin = use(AdminContext); // Conditional context read — LEGAL with use()
    return <AdminPanel config={admin} />;
  }
  return <UserDashboard />;
}

// use() replaces many useEffect data-fetching patterns:
// Before: useState + useEffect + loading/error states
// After: Pass promise as prop, use() to read, Suspense for loading`}
      </CodeBlock>

      <h2>Other React 19 Improvements</h2>

      <CodeBlock language="jsx" title="ref as Prop, Document Metadata, Error Reporting" showLineNumbers>
{`// REF AS PROP — no more forwardRef!
// React 19: ref is just a regular prop on function components
function MyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
// Usage: <MyInput ref={inputRef} /> — works directly!

// Before React 19 (still works but unnecessary):
const MyInput = forwardRef(function MyInput(props, ref) {
  return <input ref={ref} {...props} />;
});

// DOCUMENT METADATA — render <title>, <meta>, <link> anywhere
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.summary} />
      <link rel="canonical" href={post.url} />
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
  // React 19 hoists these to <head> automatically!
}

// IMPROVED ERROR REPORTING
// React 19 deduplicates errors and provides better stack traces
// onCaughtError: called when ErrorBoundary catches an error
// onUncaughtError: called for uncaught errors
// onRecoverableError: called when React recovers from an error
createRoot(document.getElementById('root'), {
  onCaughtError: (error, errorInfo) => {
    reportToSentry(error, { componentStack: errorInfo.componentStack });
  },
  onUncaughtError: (error, errorInfo) => {
    showCrashDialog(error);
  },
});`}
      </CodeBlock>

      <InteractiveChallenge
        question="What makes the use() hook unique compared to other React hooks?"
        options={[
          "It can only be used in Server Components",
          "It can be called inside conditionals, loops, and after early returns",
          "It automatically caches the resolved value forever",
          "It replaces both useState and useEffect completely"
        ]}
        correctIndex={1}
        explanation="Unlike all other hooks which must be called at the top level unconditionally, use() can be called conditionally. This is because use() integrates with React's Suspense mechanism rather than the hook linked-list. It suspends the component until the promise resolves, working with Suspense boundaries for loading states."
        language="jsx"
      />
    </LessonLayout>
  );
}
