import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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

      <h2>How the Compiler Actually Works</h2>

      <p>
        The compiler is a <strong>build-time Babel/SWC plugin</strong>. It runs on your source code
        and outputs transformed JavaScript — you never see the output, but it wraps values in
        internal memoization primitives equivalent to <code>useMemo</code> and <code>useCallback</code>.
      </p>

      <InfoBox variant="info" title="Static Analysis — What the Compiler Tracks">
        <p>The compiler reads your component function and traces every value:</p>
        <ul>
          <li><strong>Props and state</strong> are the "roots" — they change when React says they change</li>
          <li><strong>Derived values</strong> (like <code>filteredTodos</code>) are only recomputed when their inputs change</li>
          <li><strong>Callbacks</strong> passed as props get stable references automatically — no manual <code>useCallback</code></li>
          <li><strong>Child components</strong> are only re-rendered if their props actually change</li>
        </ul>
        <p style={{marginBottom: 0}}>It does this entirely statically — no runtime cost, no additional JavaScript sent to the browser.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="What the Compiler Generates (Conceptual — You Never Write This)" showLineNumbers>
{`// Your code:
function Greeting({ name }) {
  const message = "Hello, " + name;
  return <h1>{message}</h1>;
}

// What the compiler produces (simplified):
function Greeting({ name }) {
  const $ = useMemoCache(2); // compiler's internal cache

  let message;
  if ($[0] !== name) {
    // Only recompute when name changes
    message = "Hello, " + name;
    $[0] = name;
    $[1] = message;
  } else {
    message = $[1]; // Return cached value
  }

  return <h1>{message}</h1>;
}

// You write the simple version — the compiler adds the caching.`}
      </CodeBlock>

      <h2>What the Compiler Can and Cannot Handle</h2>

      <InfoBox variant="warning" title="The Compiler Requires Rules of React Compliance">
        <p>
          The compiler only works on code that follows the <strong>Rules of React</strong> — the
          same rules the linter already enforces. If you violate them, the compiler either opts that
          component out of optimization silently, or (in strict mode) errors at build time.
        </p>
        <ul style={{marginBottom: 0}}>
          <li>No mutation of props or state during render</li>
          <li>No side effects during render (no <code>fetch</code>, no <code>console.log</code> that matters, no DOM reads)</li>
          <li>Hooks called unconditionally and in the same order every render</li>
          <li>Component functions are pure given the same props/state</li>
        </ul>
      </InfoBox>

      <CodeBlock language="jsx" title="Cases Where the Compiler Opts Out" showLineNumbers>
{`// ✅ SAFE — compiler optimizes this
function SafeComponent({ items }) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map(item => <Item key={item.id} item={item} />);
}

// ❌ BREAKS COMPILER — mutating props
function BadComponent({ items }) {
  items.sort(); // Mutates the prop array in place — compiler opts out
  return items.map(item => <Item key={item.id} item={item} />);
}

// ❌ BREAKS COMPILER — reading external mutable state during render
let externalCounter = 0;
function AlsoBreaks() {
  externalCounter++; // Side effect during render — compiler opts out
  return <div>{externalCounter}</div>;
}

// ✅ SAFE — refs are fine, they're an intentional escape hatch
function WithRef({ value }) {
  const ref = useRef(null);
  const handleClick = () => { ref.current?.focus(); }; // Event handler, not render
  return <input ref={ref} value={value} onChange={() => {}} />;
}`}
      </CodeBlock>

      <h2>Enabling the Compiler</h2>

      <InfoBox variant="note" title="Current Status — Stable but Opt-In">
        <p>
          As of React 19, the compiler is <strong>stable and production-ready</strong> but
          opt-in. It ships as a separate package. Meta uses it across their entire
          codebase. Many violations are surfaced by the{' '}
          <code>eslint-plugin-react-compiler</code> linter rule, which you should enable
          first to catch issues before enabling compilation.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="Install the Compiler">
{`npm install --save-dev babel-plugin-react-compiler
# or for Next.js:
npm install --save-dev babel-plugin-react-compiler@rc`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Enable in Vite (babel.config.js or vite.config.js)" showLineNumbers>
{`// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            // Optional: only compile specific directories during rollout
            // sources: (filename) => filename.includes('src/components'),
          }],
        ],
      },
    }),
  ],
});

// Next.js (next.config.js)
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
};
module.exports = nextConfig;`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Opt Out Individual Components With a Directive" showLineNumbers>
{`// If a specific component doesn't play well with the compiler,
// opt it out with the 'use no memo' directive:
function ProblematicComponent() {
  'use no memo'; // Compiler skips this component entirely

  // This component might use an external library that mutates objects,
  // or has intentional side effects during render for legacy reasons.
  return <div />;
}

// Check whether the compiler is transforming a component:
// Look for _c() calls in your compiled bundle, or use React DevTools
// which shows "Memo ✓" in the component tree for compiled components.`}
      </CodeBlock>

      <h2>What Still Requires Manual Work</h2>

      <InfoBox variant="info" title="The Compiler Doesn't Replace Everything">
        <ul style={{marginBottom: 0}}>
          <li><strong>useRef</strong> — still required for DOM access and mutable values that don't trigger re-renders</li>
          <li><strong>useLayoutEffect</strong> — still required for synchronous DOM measurements before paint</li>
          <li><strong>Context splitting</strong> — the compiler doesn't split contexts; split State/Dispatch contexts still gives better performance than a single combined context</li>
          <li><strong>Key props</strong> — still required to help React identify list items</li>
          <li><strong>Virtualization</strong> — still required for very long lists (thousands of items)</li>
          <li><strong>Code splitting / lazy()</strong> — still required for bundle optimization</li>
        </ul>
      </InfoBox>

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

    </LessonLayout>
  );
}
