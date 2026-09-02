import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function WhatsNewFeatures() {
  return (
    <LessonLayout
      title="The Complete Feature List"
      sectionId="react19-whats-new"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react19-whats-new/react19', label: 'React 19 in Depth' }}
    >
      <p>
        This lesson is a catalog, not a tutorial. If you already know React and you're coming from
        an 18 codebase, this is the "what did I miss?" list — every headline feature React 19
        shipped, what problem it solves, and a minimal code sample for each. It intentionally does{' '}
        <strong>not</strong> cover breaking changes, removed APIs, or upgrade steps — that's the
        next lesson, <em>Migrating from React 18 to 19</em>. Think of this one as "what's new and
        how do I use it," and the next one as "what do I need to fix before I can ship."
      </p>

      <InfoBox variant="info" title="How to use this lesson">
        <p>
          Each section below is self-contained — jump to whatever you don't recognize. Every
          non-trivial claim about API shape was checked by actually compiling a small component
          against this repo's real <code>react@19.2.6</code> / <code>@types/react@19.2.15</code>{' '}
          (in <code>node_modules</code>) rather than recited from memory. Where a claim is only
          verified by type-checking (not by running it), that's called out explicitly.
        </p>
      </InfoBox>

      <h2>1. Actions — Async Transitions With Built-In Pending/Error State</h2>

      <p>
        Before React 19, handling a form submission meant hand-rolling three pieces of state
        yourself: a pending flag, an error value, and (if you wanted snappy UI) an optimistic
        value that reverts on failure. <strong>Actions</strong> are just async functions passed to
        things like <code>&lt;form action={'{fn}'}&gt;</code> or a transition — React automatically
        tracks their in-flight state for you. Three hooks were introduced (or evolved) around this
        idea: <code>useActionState</code>, <code>useFormStatus</code>, and <code>useOptimistic</code>.
      </p>

      <h3>useActionState — pending/error/result, without the boilerplate</h3>

      <p>
        <code>useActionState</code> is the renamed and expanded version of the experimental{' '}
        <code>useFormState</code> from React 18's canary channel. It wraps an async action function
        and gives you back the latest state, a wrapped action to pass to your form, and a pending
        boolean — all managed by React.
      </p>

      <CodeBlock language="jsx" title="useActionState — form submission with zero manual state" showLineNumbers>
{`import { useActionState } from 'react';

async function updateName(prevState, formData) {
  const name = formData.get('name');
  if (!name) return { error: 'Name is required' };

  await saveNameToServer(name);
  return { error: null, savedName: name };
}

function NameForm() {
  const [state, formAction, isPending] = useActionState(updateName, {
    error: null,
    savedName: null,
  });

  return (
    <form action={formAction}>
      <input name="name" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </button>
      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state.savedName && <p>Saved: {state.savedName}</p>}
    </form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The three return values">
        <ul>
          <li><code>state</code> — whatever your action last returned (starts as the initial value you pass)</li>
          <li><code>formAction</code> — pass this to <code>&lt;form action={'{...}'}&gt;</code>; React wraps your function so calling it updates <code>state</code> automatically</li>
          <li><code>isPending</code> — <code>true</code> while the action's promise is in flight</li>
        </ul>
        <p>No <code>useState</code> for the pending flag, no try/catch boilerplate for errors — React derives both from the action's lifecycle.</p>
      </InfoBox>

      <h3>useFormStatus — read the parent form's status without prop drilling</h3>

      <p>
        <code>useFormStatus</code> is imported from <code>react-dom</code> (not <code>react</code>).
        It reads the submission status of the nearest ancestor <code>&lt;form&gt;</code> from{' '}
        <em>any</em> child component — no need to pass <code>isPending</code> down as a prop. This
        is what lets you build a generic <code>&lt;SubmitButton&gt;</code> that works inside any
        form.
      </p>

      <CodeBlock language="jsx" title="useFormStatus — a reusable submit button" showLineNumbers>
{`import { useFormStatus } from 'react-dom';

// This component has NO idea what form it's in, and receives no props.
// It just asks: "is my nearest parent <form> submitting right now?"
function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting…' : 'Submit'}
    </button>
  );
}

function SignupForm() {
  return (
    <form action={signupAction}>
      <input name="email" />
      {/* Drop it in anywhere inside the form — it just works */}
      <SubmitButton />
    </form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Gotcha: must be a child of the <form>, not the form itself">
        <p>
          <code>useFormStatus</code> only sees a parent <code>&lt;form&gt;</code>. Calling it in the
          same component that renders the <code>&lt;form&gt;</code> tag returns <code>pending: false</code>{' '}
          always — you have to call it from a component rendered <em>inside</em> that form.
        </p>
      </InfoBox>

      <h3>useOptimistic — instant UI that auto-reverts on failure</h3>

      <p>
        <code>useOptimistic</code> lets you show a "hoped-for" result immediately, before the
        server confirms it. If the underlying action succeeds, the optimistic value is replaced by
        the real one when state updates; if it throws, React automatically reverts to the last
        known-good state.
      </p>

      <CodeBlock language="jsx" title="useOptimistic — instant message send" showLineNumbers>
{`import { useOptimistic, startTransition } from 'react';

function Thread({ messages, sendMessage }) {
  // First arg: the real state. Second arg: how to merge an optimistic update into it.
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [...state, { text: newMessage, sending: true }]
  );

  async function formAction(formData) {
    const text = formData.get('text');
    addOptimisticMessage(text); // shows instantly, tagged "sending"
    await sendMessage(text);    // real request; on success, 'messages' prop
                                 // updates and replaces the optimistic entry.
                                 // On throw, React reverts automatically.
  }

  return (
    <form action={formAction}>
      <ul>
        {optimisticMessages.map((m, i) => (
          <li key={i} style={{ opacity: m.sending ? 0.5 : 1 }}>{m.text}</li>
        ))}
      </ul>
      <input name="text" />
    </form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Verified against real @types/react 19.2.15">
        <p>
          A small file exercising <code>useActionState</code>, <code>useFormStatus</code> (from{' '}
          <code>react-dom</code>), and <code>useOptimistic</code> with the exact shapes shown above
          was type-checked with <code>tsc --noEmit</code> against this repo's installed{' '}
          <code>react@19.2.6</code> / <code>@types/react@19.2.15</code> and produced{' '}
          <strong>zero errors</strong>. This confirms the API shapes compile; it does not prove
          runtime revert-on-error behavior (that would require a browser/DOM test harness), so
          treat the "auto-reverts on error" claim as documented React behavior, not something
          re-verified here.
        </p>
      </InfoBox>

      <h2>2. The <code>use()</code> API — Read a Promise or Context During Render</h2>

      <p>
        <code>use()</code> is a new kind of React API — it's not a hook, even though it looks like
        one. It reads the value of a <strong>promise</strong> (integrating with Suspense) or a{' '}
        <strong>context</strong>, but unlike every hook you know, <code>use()</code> can be called{' '}
        <strong>conditionally</strong>, inside loops, and after early returns. The Rules of Hooks
        ("only call at the top level") simply don't apply to it.
      </p>

      <CodeBlock language="jsx" title="use(promise) — reads a promise, suspends until resolved" showLineNumbers>
{`import { use, Suspense } from 'react';

function Profile({ userPromise }) {
  // Suspends this component (and shows the nearest Suspense fallback)
  // until userPromise resolves. On reject, it triggers the nearest
  // error boundary — same integration points as Suspense already has.
  const user = use(userPromise);
  return <p>{user.name}</p>;
}

function ProfilePage({ userPromise }) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Profile userPromise={userPromise} />
    </Suspense>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Don't create the promise inside the component you call use() in">
        <p>
          If you write <code>use(fetch(...))</code> directly inside a component body, you create a{' '}
          <strong>new</strong> promise every render, which re-suspends forever. The promise needs
          to come from somewhere stable — a Server Component, a cache, or a ref/state that isn't
          recreated each render.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="use(Context) — an alternative to useContext, callable conditionally" showLineNumbers>
{`import { use, createContext } from 'react';

const ThemeContext = createContext('light');

function ThemedLabel({ show }) {
  // Illegal for useContext (can't be after a conditional return) —
  // perfectly legal for use().
  if (!show) return null;
  const theme = use(ThemeContext);
  return <span>{theme}</span>;
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Verified at RUNTIME (not just type-checked)">
        <p>
          Unlike most claims in this lesson, this one was proven by actually executing code — a
          Node script imported <code>react</code> and <code>react-dom/server</code> directly from
          this repo's <code>node_modules</code> (real <code>react@19.2.6</code>) and rendered with{' '}
          <code>renderToStaticMarkup</code>:
        </p>
        <pre style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', overflowX: 'auto' }}>
{`RENDERED HTML: <span>theme=dark</span>
PASS: use(Context) + <Context value> provider shorthand both work at runtime.
RENDERED HTML 2: <p>Hello, Ada</p>
PASS: use() synchronously unwraps an already-settled thenable.`}
        </pre>
        <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          The first case proves <code>use(ThemeContext)</code> reads a value provided by{' '}
          <code>&lt;ThemeContext value="dark"&gt;</code> (see the next section) — actually executed,
          not just compiled. The second proves <code>use()</code> can synchronously unwrap an
          already-settled thenable — the pattern React's own <code>cache()</code> relies on. A
          genuinely <em>pending</em> native promise triggering real Suspense fallback/retry
          behavior would need a full browser reconciler loop (not <code>renderToStaticMarkup</code>,
          which has no commit phase to retry after) — that part of the promise story is documented
          React behavior, not independently re-verified here.
        </p>
      </InfoBox>

      <h2>3. <code>ref</code> as a Plain Prop — No More <code>forwardRef</code></h2>

      <p>
        In React 18, any function component that wanted to accept a <code>ref</code> from its
        parent had to be wrapped in <code>forwardRef</code> — <code>ref</code> was a special,
        non-prop parameter. In React 19, <code>ref</code> is just a regular prop that function
        components can destructure and read directly.
      </p>

      <CodeBlock language="jsx" title="Before (React 18) vs after (React 19)" showLineNumbers>
{`// ❌ React 18 way — still works in 19, but no longer necessary
const TextInput = forwardRef(function TextInput(props, ref) {
  return <input {...props} ref={ref} />;
});

// ✅ React 19 way — ref is just a prop now
function TextInput({ placeholder, ref }) {
  return <input placeholder={placeholder} ref={ref} />;
}

// Usage is identical either way:
function Parent() {
  const inputRef = useRef(null);
  return <TextInput placeholder="name" ref={inputRef} />;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="forwardRef still works">
        <p>
          Nothing breaks — <code>forwardRef</code> is not removed or deprecated in a way that
          errors. It's simply the legacy path now; new components don't need it, and the React
          team has signaled it may be deprecated in a future major version.
        </p>
      </InfoBox>

      <h2>4. Ref Callback Cleanup Functions</h2>

      <p>
        Ref callbacks (the <code>ref={'{(node) => { ... }}'}</code> form) can now return a cleanup
        function, exactly like <code>useEffect</code>. React calls it when the element unmounts{' '}
        <em>or</em> when the ref callback itself changes identity — before that happens, previously
        the only signal you got was the callback being called again with <code>null</code>.
      </p>

      <CodeBlock language="jsx" title="Ref callback with cleanup — the useEffect-shaped pattern" showLineNumbers>
{`function ListItem({ label, onVisible }) {
  return (
    <li
      ref={(node) => {
        if (!node) return; // still need this guard for the old null-call case
        const observer = new IntersectionObserver(() => onVisible(label));
        observer.observe(node);

        // NEW in React 19: return a cleanup function.
        // Called on unmount, or when this ref callback is replaced.
        return () => observer.disconnect();
      }}
    >
      {label}
    </li>
  );
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Gotcha: a TypeScript-only trap when migrating">
        <p>
          If your ref callback used to end with an implicit <code>undefined</code> return but now
          you accidentally return something non-function (e.g. the result of an assignment
          expression like <code>ref={'{(node) => (instance = node)}'}</code>), TypeScript's{' '}
          <code>@types/react</code> 19 types will flag it — because a returned value is now
          meaningfully interpreted as a cleanup function, arrow functions with implicit returns
          need an explicit <code>{'{ instance = node; }'}</code> block body to avoid accidentally
          "returning" the assigned value.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="Verified by type-checking against real @types/react 19.2.15">
        <p>
          Both of the patterns above (destructuring <code>ref</code> as a plain prop with no{' '}
          <code>forwardRef</code>, and a ref callback returning a cleanup closure) were written as
          real <code>.tsx</code> components and checked with <code>tsc --noEmit</code> against this
          repo's installed <code>@types/react@19.2.15</code> — <strong>zero type errors</strong>.
          Under React 18's <code>@types/react</code>, the plain-prop-<code>ref</code> form would
          not type-check (<code>ref</code> wasn't recognized as an ordinary prop), and a returned
          cleanup function from a ref callback would be silently accepted as an error case (React
          18 has no cleanup-function contract for ref callbacks). This was checked as a
          type-checking exercise, not run in a browser, since verifying the cleanup actually fires
          on unmount would need a DOM + real unmount cycle.
        </p>
      </InfoBox>

      <h2>5. Document Metadata Hoisting — <code>&lt;title&gt;</code>, <code>&lt;meta&gt;</code>, <code>&lt;link&gt;</code> Anywhere</h2>

      <p>
        You can render <code>&lt;title&gt;</code>, <code>&lt;meta&gt;</code>, and{' '}
        <code>&lt;link&gt;</code> tags directly inside <em>any</em> component — not just at the
        document root — and React automatically hoists them into <code>&lt;head&gt;</code>. This
        replaces most of what libraries like <code>react-helmet</code> existed for: a product page
        component can own its own <code>&lt;title&gt;</code> without any portal or context
        gymnastics.
      </p>

      <CodeBlock language="jsx" title="A component three levels deep sets the page title" showLineNumbers>
{`function ProductPage({ product }) {
  return (
    <article>
      {/* Rendered deep in the tree — React still moves this to <head> */}
      <title>{product.name} — My Store</title>
      <meta name="description" content={product.summary} />
      <h1>{product.name}</h1>
      <p>{product.summary}</p>
    </article>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Verified at RUNTIME with react-dom/server">
        <p>
          Rendered a <code>&lt;title&gt;</code> and <code>&lt;meta&gt;</code> nested three levels
          deep (<code>main &gt; section &gt; div</code>) with real <code>renderToString</code> from
          this repo's <code>react-dom</code>. Actual output:
        </p>
        <pre style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', overflowX: 'auto' }}>
{`<title>Hoisted Title</title><meta name="description" content="Hoisted description"/><main><section><div>Visible body content</div></section></main>`}
        </pre>
        <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          The tags were pulled entirely out of their nested position in the tree and emitted first
          in the stream — exactly the hoisting behavior described above. (The script didn't render
          an explicit <code>&lt;head&gt;</code> element, so this proves the hoist-out-of-position
          mechanism; a real app's document shell with <code>&lt;head&gt;</code> at the root is what
          makes these actually land inside it in the browser.)
        </p>
      </InfoBox>

      <h2>6. Stylesheet Support — <code>precedence</code> Integrates With Suspense</h2>

      <p>
        A <code>&lt;link rel="stylesheet"&gt;</code> rendered anywhere in the tree can take a new{' '}
        <code>precedence</code> prop. React uses it to control insertion order in the DOM (so you
        can express "this stylesheet should win over that one" declaratively) <em>and</em> to
        integrate with Suspense — React waits for the stylesheet to finish loading before revealing
        the content that depends on it, avoiding a flash of unstyled content.
      </p>

      <CodeBlock language="jsx" title="Stylesheet with precedence, co-located with the component that needs it" showLineNumbers>
{`function ThemedCard() {
  return (
    <Suspense fallback={<Spinner />}>
      {/* React de-dupes identical hrefs, orders by precedence, and
          won't reveal this subtree until the stylesheet has loaded. */}
      <link rel="stylesheet" href="/card-theme.css" precedence="default" />
      <div className="card">Themed content</div>
    </Suspense>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="precedence values are just insertion buckets">
        <p>
          <code>precedence</code> isn't a fixed enum — you invent the bucket names (e.g.{' '}
          <code>"reset"</code>, <code>"default"</code>, <code>"high"</code>) and React groups
          stylesheets by them, inserting each group's <code>&lt;link&gt;</code> tags together and
          in the order the precedence values were first seen. It's a declarative substitute for
          manually ordering <code>&lt;link&gt;</code> tags in <code>&lt;head&gt;</code>.
        </p>
      </InfoBox>

      <h2>7. Async Script Support — Dedup + Hoist Automatically</h2>

      <p>
        A <code>&lt;script async&gt;</code> rendered anywhere in the component tree is deduplicated
        (React won't inject the same script twice, even if the component rendering it mounts
        multiple times) and hoisted into the document. This makes it safe to co-locate a
        third-party script tag with the component that actually needs it, instead of hand-managing
        it at the app root.
      </p>

      <CodeBlock language="jsx" title="A widget component owns its own script tag" showLineNumbers>
{`function MapWidget({ apiKey }) {
  return (
    <>
      {/* Safe even if <MapWidget> renders many times on the page —
          React only injects one copy of this script. */}
      <script async src={\`https://maps.example.com/sdk?key=\${apiKey}\`} />
      <div id="map" />
    </>
  );
}`}
      </CodeBlock>

      <h2>8. Resource Preloading APIs</h2>

      <p>
        <code>react-dom</code> now exports four functions for imperatively hinting the browser
        about resources you're about to need — useful in event handlers (e.g. preload a route's
        assets on hover) or render logic, outside of JSX entirely.
      </p>

      <CodeBlock language="jsx" title="preload, preinit, prefetchDNS, preconnect" showLineNumbers>
{`import { preload, preinit, prefetchDNS, preconnect } from 'react-dom';

function ProductLink({ product }) {
  return (
    <a
      href={\`/products/\${product.id}\`}
      onMouseEnter={() => {
        // Fetch and cache, but don't execute/apply it yet.
        preload(\`/api/products/\${product.id}\`, { as: 'fetch' });
        preload('/fonts/product-page.woff2', { as: 'font', type: 'font/woff2' });
      }}
    >
      {product.name}
    </a>
  );
}

// Fetch AND actually insert/execute — for things you know you need now.
preinit('/critical.css', { as: 'style' });
preinit('/analytics.js', { as: 'script' });

// Cheaper hints for a domain you'll talk to soon, before you know the exact URL.
prefetchDNS('https://api.example.com');
preconnect('https://cdn.example.com'); // DNS + TCP + TLS handshake`}
      </CodeBlock>

      <InfoBox variant="note" title="Verified by type-checking against real @types/react-dom 19.2.15">
        <p>
          A file importing and calling <code>preload</code>, <code>preinit</code>,{' '}
          <code>prefetchDNS</code>, and <code>preconnect</code> from <code>react-dom</code> with
          the argument shapes shown above was checked with <code>tsc --noEmit</code> against this
          repo's <code>@types/react-dom@19.2.15</code> — <strong>zero type errors</strong>,
          confirming these four are real exports with these signatures (not renamed or
          experimental-only). The document metadata section above additionally has runtime proof
          via <code>renderToString</code>.
        </p>
      </InfoBox>

      <h2>9. <code>&lt;Context&gt;</code> as a Provider Directly</h2>

      <p>
        You can now render a context object itself as a provider — <code>&lt;ThemeContext
        value={'{theme}'}&gt;</code> — instead of the more verbose <code>&lt;ThemeContext.Provider
        value={'{theme}'}&gt;</code>. The <code>.Provider</code> form still works unchanged; this
        is purely a shorter, less noisy alternative.
      </p>

      <CodeBlock language="jsx" title="Before vs after" showLineNumbers>
{`const ThemeContext = createContext('light');

// ❌ React 18 way — still works in 19
function App18() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

// ✅ React 19 way — shorter
function App19() {
  return (
    <ThemeContext value="dark">
      <Toolbar />
    </ThemeContext>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Verified at RUNTIME — same script as the use() section">
        <p>
          The Node runtime script in the <code>use()</code> section above rendered{' '}
          <code>{'<ThemeContext value="dark">'}</code> (the direct-provider form, not{' '}
          <code>.Provider</code>) and a child reading it with <code>use(ThemeContext)</code>. The
          real output was <code>{'<span>theme=dark</span>'}</code> — proof the value actually
          flowed through the direct-provider form end to end, executed by this repo's real{' '}
          <code>react-dom/server</code>.
        </p>
      </InfoBox>

      <h2>10. Improved Hydration Errors + New Root-Level Error Handlers</h2>

      <p>
        Hydration mismatches in React 18 were notorious for dumping several confusing, generic
        console errors that didn't point at the actual mismatch. React 19 collapses this into a{' '}
        <strong>single, clear diff-style message</strong> showing exactly what the server rendered
        versus what the client expected. Alongside that, <code>createRoot</code> and{' '}
        <code>hydrateRoot</code> gained three new options for centralized error handling, replacing
        the old pattern of only being able to log via error boundaries or a blanket{' '}
        <code>window.onerror</code>.
      </p>

      <CodeBlock language="jsx" title="createRoot's three new error handler options" showLineNumbers>
{`import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'), {
  // An error boundary caught it — you're overriding the default console.error
  onCaughtError: (error, errorInfo) => {
    logToService(error, errorInfo.componentStack);
  },
  // Nothing caught it — no error boundary above the throw
  onUncaughtError: (error, errorInfo) => {
    logToService(error, errorInfo.componentStack);
  },
  // React recovered on its own (e.g. a hydration mismatch it patched up)
  onRecoverableError: (error, errorInfo) => {
    logToService(error, errorInfo.componentStack);
  },
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why this matters beyond nicer console output">
        <p>
          Before React 19, routing every uncaught render error to your error-tracking service
          (Sentry, Datadog, etc.) meant wrapping the whole app in an error boundary and hoping it
          caught everything. These three root options give you a single, guaranteed hook for{' '}
          <em>every</em> render-time error category — caught, uncaught, and silently-recovered —
          without depending on boundary placement.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="Verified by type-checking against real @types/react-dom 19.2.15">
        <p>
          <code>createRoot(container, {'{ onCaughtError, onUncaughtError, onRecoverableError }'})</code>{' '}
          with handlers matching the signatures above was checked with <code>tsc --noEmit</code>{' '}
          against this repo's <code>@types/react-dom@19.2.15</code> — <strong>zero type errors</strong>.
          The improved hydration diff formatting itself is a console-output/DX change with no type
          signature to check — that part is stated as documented React 19 behavior, not
          independently re-verified here.
        </p>
      </InfoBox>

      <h2>11. The React Compiler — a Separate, Opt-In Build Tool</h2>

      <InfoBox variant="warning" title="Not part of the react package — don't confuse this with a runtime feature">
        <p>
          Everything else in this lesson ships inside the <code>react</code> /{' '}
          <code>react-dom</code> packages themselves. The <strong>React Compiler</strong> is
          different: it's a <strong>separate build-time tool</strong> (a Babel plugin, with support
          for other build pipelines) announced alongside React 19 but shipped and versioned on its
          own track. It is not bundled into <code>react@19</code>, and enabling React 19 does{' '}
          <strong>not</strong> turn it on.
        </p>
      </InfoBox>

      <p>
        The Compiler analyzes your components at build time and automatically inserts the
        memoization you'd otherwise write by hand with <code>useMemo</code>, <code>useCallback</code>,
        and <code>React.memo</code> — following the Rules of React, it figures out what can safely
        be skipped on a re-render and rewrites your code to skip it, without you writing a single
        memoization call.
      </p>

      <CodeBlock language="jsx" title="What the Compiler does conceptually (illustrative, not literal output)" showLineNumbers>
{`// You write plain, unmemoized code:
function ProductList({ products, filter }) {
  const filtered = products.filter(p => p.category === filter);
  return filtered.map(p => <ProductCard key={p.id} product={p} />);
}

// The Compiler emits (conceptually) the equivalent of:
function ProductList({ products, filter }) {
  const filtered = useMemo(
    () => products.filter(p => p.category === filter),
    [products, filter]
  );
  return filtered.map(p => <ProductCard key={p.id} product={p} />);
}
// You never write the useMemo — the compiler infers it from your code.`}
      </CodeBlock>

      <p>
        It's mentioned here only because it's commonly (and incorrectly) assumed to be "part of
        React 19." Setting it up, its ESLint plugin, and its current stability are out of scope for
        this catalog — treat it as a distinct tool to evaluate separately from the React 19 upgrade
        itself.
      </p>

      <h2>Quick Reference</h2>

      <CodeBlock language="text" title="Everything in this lesson, at a glance">
{`Actions              useActionState, useFormStatus (react-dom), useOptimistic
use()                use(promise) + use(Context) — callable conditionally
ref as prop          function Foo({ ref }) { ... }  — no forwardRef required
ref cleanup          ref={(node) => { ...; return () => cleanup(); }}
Document metadata    <title>/<meta>/<link> anywhere — auto-hoisted to <head>
Stylesheets          <link rel="stylesheet" precedence="..."> — Suspense-integrated
Async scripts        <script async> anywhere — deduped + hoisted
Preloading           preload, preinit, prefetchDNS, preconnect (react-dom)
Context provider     <ThemeContext value={theme}> — .Provider still works
Error handling       onCaughtError / onUncaughtError / onRecoverableError (createRoot)
React Compiler       separate opt-in build tool — NOT bundled in react@19`}
      </CodeBlock>

    </LessonLayout>
  );
}
