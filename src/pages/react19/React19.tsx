import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function React19() {
  return (
    <LessonLayout
      title="React 19 New Features"
      sectionId="react19"
      lessonIndex={8}
      prev={{ path: '/react19/profiling', label: 'Profiling React Apps in the Browser' }}
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
          codebase. Most violations are surfaced by the compiler lint rules, which you
          should enable first to catch issues before enabling compilation.
        </p>
        <p style={{ marginBottom: 0 }}>
          Those rules used to live in a standalone{' '}
          <code>eslint-plugin-react-compiler</code> package. They were folded into{' '}
          <code>eslint-plugin-react-hooks</code> in v6 — install that and use its{' '}
          <code>recommended-latest</code> config. Don&apos;t add the old standalone plugin
          to a new project.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="Install the Compiler">
{`npm install --save-dev babel-plugin-react-compiler
# The compiler reached 1.0 (stable) — install the default 'latest' tag.
# Do NOT use @rc: that tag still points at a pre-1.0 release candidate.`}
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

      <InfoBox variant="danger" title="The trap: never create the promise during a client render">
        <p>
          <code>ProfilePage</code> above is written as a <strong>Server Component</strong>, where
          the function body runs once per request. In a <em>client</em> component the exact same
          code is a bug: every render calls <code>fetchUser(userId)</code> again, producing a{' '}
          <strong>new promise</strong>. <code>use()</code> suspends on it, React re-renders when
          it resolves, a new promise is created, it suspends again — an infinite fetch loop.
        </p>
        <p style={{ marginBottom: 0 }}>
          On the client, the promise must come from somewhere stable: a Server Component passing
          it down as a prop, a Suspense-aware cache (TanStack Query, a framework loader), or a
          module-level memo keyed by the input. React deliberately does <em>not</em> give you a
          client-side <code>cache()</code> for this — that gap is what a data library fills.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Client-side use(): stable promise, not a fresh one" showLineNumbers>
{`// ❌ INFINITE LOOP — new promise every render
'use client';
function ProfilePage({ userId }) {
  const userPromise = fetchUser(userId);   // new promise on EVERY render
  return <Suspense fallback={<Skeleton />}><UserProfile userPromise={userPromise} /></Suspense>;
}

// ✅ Memoize by key so the same input yields the SAME promise object
const userCache = new Map();
function getUser(id) {
  if (!userCache.has(id)) userCache.set(id, fetchUser(id));
  return userCache.get(id);
}

function ProfilePage({ userId }) {
  const userPromise = getUser(userId);   // stable per userId
  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
// In production, let a library own this cache — it also handles invalidation,
// retries, and garbage collection, which the 6-line Map above does not.`}
      </CodeBlock>

      <h2>Context as a Provider &mdash; <code>Context.Provider</code> Is Deprecated</h2>

      <p>
        React 19 lets you render the context object itself as the provider. The old{' '}
        <code>&lt;MyContext.Provider&gt;</code> form still works, but it is deprecated and
        will be removed in a future major version.
      </p>

      <CodeBlock language="jsx" title="The new provider syntax" showLineNumbers>
{`const ThemeContext = createContext('light');

// React 19 — render the context directly
function App({ children }) {
  return (
    <ThemeContext value="dark">
      {children}
    </ThemeContext>
  );
}

// Before React 19 (deprecated — still works, will be removed)
function OldApp({ children }) {
  return (
    <ThemeContext.Provider value="dark">
      {children}
    </ThemeContext.Provider>
  );
}

// Consumers are unchanged:
const theme = useContext(ThemeContext);
// ...or, new in 19, conditionally:
const theme2 = use(ThemeContext);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Note on the Rest of This Site">
        <p>
          You will still see <code>Context.Provider</code> in plenty of examples here and
          in almost every codebase and blog post written before 2025 &mdash; the two forms are
          behaviourally identical, so treat them as interchangeable when reading. Write the
          new one in new code. <code>&lt;Context.Consumer&gt;</code> is deprecated in React 19
          as well; use <code>useContext</code> or <code>use</code> instead.
        </p>
      </InfoBox>

      <h2>Ref Cleanup Functions</h2>

      <p>
        A ref callback can now return a cleanup function, exactly like{' '}
        <code>useEffect</code>. React calls it when the element is removed, instead of
        calling the ref again with <code>null</code>.
      </p>

      <CodeBlock language="jsx" title="Ref callbacks that clean up after themselves" showLineNumbers>
{`// React 19 — return a cleanup function
function Chart({ data }) {
  return (
    <div
      ref={(node) => {
        const observer = new ResizeObserver(handleResize);
        observer.observe(node);
        // Cleanup runs when the element unmounts or the ref changes
        return () => observer.disconnect();
      }}
    />
  );
}

// Before React 19 — the awkward null-check dance
function OldChart() {
  const observerRef = useRef(null);
  return (
    <div
      ref={(node) => {
        if (node) {
          observerRef.current = new ResizeObserver(handleResize);
          observerRef.current.observe(node);
        } else {
          observerRef.current?.disconnect();  // called with null on unmount
        }
      }}
    />
  );
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="A Breaking Change in Disguise">
        <p>
          Because React now uses the return value, a ref callback must <strong>not</strong>{' '}
          implicitly return anything else. The concise arrow body{' '}
          <code>ref={'{'}(node) =&gt; (myRef.current = node){'}'}</code> returns the assigned
          node, which React 19 will try to call as a cleanup function. Wrap it in braces:{' '}
          <code>ref={'{'}(node) =&gt; {'{'} myRef.current = node; {'}}'}</code>. TypeScript
          flags this for you; plain JavaScript does not.
        </p>
      </InfoBox>

      <h2>Resource Preloading APIs</h2>

      <p>
        React 19 exposes the browser&apos;s resource hints as functions you can call from
        components or event handlers. React deduplicates the calls and emits the
        corresponding <code>&lt;link&gt;</code> tags into the document head.
      </p>

      <CodeBlock language="jsx" title="preload, preinit, prefetchDNS, preconnect" showLineNumbers>
{`import { preload, preinit, prefetchDNS, preconnect } from 'react-dom';

function SearchPage() {
  // Start the DNS lookup / TCP handshake for a host you'll hit soon
  prefetchDNS('https://cdn.example.com');
  preconnect('https://api.example.com');

  // Download a resource now, use it later (does NOT execute)
  preload('/fonts/inter.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  preload('/hero.jpg', { as: 'image', fetchPriority: 'high' });

  // Download AND execute/apply immediately
  preinit('/analytics.js', { as: 'script' });
  preinit('/theme.css', { as: 'style' });

  return <Results />;
}

// Common pattern: warm the next route on hover
<Link
  to="/checkout"
  onMouseEnter={() => {
    preload('/api/cart', { as: 'fetch' });
    preinit('/checkout.chunk.js', { as: 'script' });
  }}
/>`}
      </CodeBlock>

      <InfoBox variant="tip" title="preload vs preinit">
        <p>
          <code>preload</code> fetches into cache and stops &mdash; use it for fonts, images, and
          data you will need shortly. <code>preinit</code> fetches <em>and</em> evaluates &mdash;
          the script runs, the stylesheet applies. Reach for <code>preinit</code> only when
          you genuinely want the side effect now.
        </p>
      </InfoBox>

      <h2>useDeferredValue Gets an Initial Value</h2>

      <CodeBlock language="jsx" title="The second argument, new in React 19" showLineNumbers>
{`// React 19: the second argument is what's returned on the FIRST render,
// before the deferred value has caught up.
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query, '');

  // On the very first render deferredQuery is '' rather than query,
  // so the expensive list renders empty immediately and fills in after.
  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.6 : 1 }}>
      <ExpensiveResultList query={deferredQuery} />
    </div>
  );
}

// Without the initial value, the first render is NOT deferred —
// it renders synchronously with the full query, which is exactly the
// blocking render you were trying to avoid on initial mount.`}
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
});

// STYLESHEETS WITH PRECEDENCE — render <link> in a component and React
// hoists it to <head>, ordered by precedence, deduplicated across components.
function Widget() {
  return (
    <>
      <link rel="stylesheet" href="/widget.css" precedence="default" />
      <div className="widget" />
    </>
  );
}

// ASYNC SCRIPTS — render <script async> anywhere; React dedupes and hoists it.
function Map() {
  return (
    <>
      <script async src="https://maps.example.com/sdk.js" />
      <div id="map" />
    </>
  );
}`}
      </CodeBlock>

      <h2>Added After 19.0 — <code>useEffectEvent</code> and <code>&lt;Activity&gt;</code></h2>

      <p>
        React 19 was not a single drop. Two additions in the 19.1/19.2 point releases are
        significant enough that you should treat them as part of &quot;React 19&quot; when
        writing new code.
      </p>

      <h3><code>useEffectEvent</code> — non-reactive logic inside a reactive effect</h3>

      <p>
        The oldest unsolved problem in hooks: an effect needs to <em>read</em> a value without{' '}
        <em>reacting</em> to it. Put it in the deps and the effect re-runs too often; leave it
        out and you get a stale closure plus a lint warning. Every codebase grew its own{' '}
        <code>useLatest</code> / <code>useStableCallback</code> ref hack.{' '}
        <code>useEffectEvent</code> is the official answer.
      </p>

      <CodeBlock language="jsx" title="useEffectEvent — the deps array finally says what you mean" showLineNumbers>
{`import { useEffect, useEffectEvent } from 'react';

// ❌ BEFORE — 'theme' is genuinely used, so the linter demands it in deps.
// Result: changing the theme tears down and rebuilds the chat connection.
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('connected', () => showToast('Connected!', theme));
    conn.connect();
    return () => conn.disconnect();
  }, [roomId, theme]);   // ← theme does not belong here, but omitting it lies
}

// ✅ AFTER — split the reactive part from the non-reactive part.
function ChatRoom({ roomId, theme }) {
  // Effect Event: stable identity, but its body always reads the LATEST render's
  // props and state. It is not a dependency of anything.
  const onConnected = useEffectEvent(() => {
    showToast('Connected!', theme);
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('connected', onConnected);
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]);   // ← honest and complete: only roomId is reactive
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The rules are stricter than a normal hook">
        <ul style={{ marginBottom: 0 }}>
          <li>Only call an Effect Event from inside an effect — never during render, never from an event handler where a plain function would do.</li>
          <li>Declare it in the same component or custom hook that uses it. <strong>Never pass it to another component or hook</strong>, and never return it from a custom hook.</li>
          <li><strong>Never put it in a dependency array.</strong> Its identity is stable by design; listing it defeats the purpose and the linter will flag it.</li>
          <li>It is not a replacement for <code>useCallback</code>. <code>useCallback</code> stabilizes a function you hand to <em>children</em>; <code>useEffectEvent</code> de-reactifies a function your <em>own effect</em> calls.</li>
        </ul>
      </InfoBox>

      <h3><code>&lt;Activity&gt;</code> — hide a subtree without destroying it</h3>

      <p>
        Conditional rendering (<code>{'{isOpen && <Panel />}'}</code>) unmounts the subtree:
        state gone, refs gone, scroll position gone, every child remounts when it comes back.{' '}
        <code>&lt;Activity&gt;</code> gives you the third option — visually gone, but alive.
      </p>

      <CodeBlock language="jsx" title="Activity — tabs that remember where you were" showLineNumbers>
{`import { Activity } from 'react';

function Tabs({ active }) {
  return (
    <>
      <Activity mode={active === 'search' ? 'visible' : 'hidden'}>
        <SearchTab />    {/* query text and scroll position survive tab switches */}
      </Activity>
      <Activity mode={active === 'settings' ? 'visible' : 'hidden'}>
        <SettingsTab />  {/* half-filled form is still half-filled when you return */}
      </Activity>
    </>
  );
}

// What "hidden" actually does:
//   • DOM stays mounted, styled display: none
//   • useState / useRef values are PRESERVED
//   • Effects are cleaned up (as if unmounted) and re-run when it goes visible
//   • Renders happen at a LOWER priority than anything visible
//
// Compare:
//   {show && <Panel />}          → unmount. State destroyed. Cheapest memory.
//   <div hidden><Panel /></div>  → state kept, but effects KEEP RUNNING (timers,
//                                  subscriptions, fetches all still firing). Leaky.
//   <Activity mode="hidden">     → state kept AND effects cleaned up. What you wanted.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The other use for Activity: pre-rendering">
        <p style={{ marginBottom: 0 }}>
          Because hidden subtrees render at low priority, you can mount the route the user is
          most likely to visit next inside a hidden <code>&lt;Activity&gt;</code>. React builds
          it during idle time; flipping it to <code>visible</code> is then instant. Do not do
          this for more than one or two candidates — hidden trees still cost memory.
        </p>
      </InfoBox>

      <h2>What React 19 Removed</h2>

      <InfoBox variant="danger" title="Removed APIs — Not Deprecated, Gone">
        <p>These were long-deprecated and are deleted in React 19. If you are upgrading, these are the hard failures:</p>
        <ul>
          <li>
            <code>propTypes</code> and <code>defaultProps</code> <strong>on function
            components</strong> &mdash; silently ignored. Use TypeScript for the first and ES
            default parameters (<code>{'function Btn({ size = \'md\' })'}</code>) for the
            second. Class components keep <code>defaultProps</code>.
          </li>
          <li>
            <strong>Legacy Context</strong> (<code>contextTypes</code> /{' '}
            <code>getChildContext</code>) &mdash; use <code>createContext</code>.
          </li>
          <li>
            <strong>String refs</strong> (<code>ref=&quot;input&quot;</code>) &mdash; use callback
            refs or <code>useRef</code>.
          </li>
          <li>
            <code>ReactDOM.render</code>, <code>ReactDOM.hydrate</code>, and{' '}
            <code>unmountComponentAtNode</code> &mdash; use <code>createRoot</code>,{' '}
            <code>hydrateRoot</code>, and <code>root.unmount()</code>.
          </li>
          <li>
            <code>ReactDOM.findDOMNode</code> &mdash; use refs.
          </li>
          <li>
            <code>react-test-renderer/shallow</code> &mdash; use React Testing Library.
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          <code>forwardRef</code> and <code>Context.Provider</code> are <em>deprecated but
          still functional</em> &mdash; they will be removed in a later major, so migrate at
          your leisure rather than in a panic.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
