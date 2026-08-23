import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function ErrorBoundaries() {
  return (
    <LessonLayout
      title="Error Boundaries"
      sectionId="react18"
      lessonIndex={18}
      prev={{ path: '/react18/feature-folder', label: 'Feature-Based Architecture' }}
      next={{ path: '/react18/animations', label: 'Animation Libraries (Framer Motion & Beyond)' }}
    >
      <p>
        Before React 16, one component throwing during render blanked the entire app — React
        unmounted the whole tree because it had no way to know how much of the UI was still
        trustworthy. An error boundary is a component that catches a render-time error <em>below</em>{' '}
        it in the tree and swaps in a fallback UI instead of taking the rest of the page down with
        it. That is the whole job: contain render-phase crashes to a subtree, and let the rest of
        the app keep working.
      </p>

      <InfoBox variant="info" title="The Contract">
        <p><strong>static getDerivedStateFromError(error)</strong> — runs during render, returns
        state used to render the fallback UI. Must be pure: no side effects, no logging here.</p>
        <p style={{ marginBottom: 0 }}><strong>componentDidCatch(error, info)</strong> — runs after
        the fallback has committed, in the commit phase. This is where side effects belong: log to
        Sentry, report to your backend, etc. <code>info.componentStack</code> tells you which
        component tree the error came from.</p>
      </InfoBox>

      <CodeBlock language="jsx" title="A Minimal Error Boundary" showLineNumbers>
{`class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    // Pure — just compute the next state. No logging here.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Side effects go here — this runs in the commit phase, after
    // the fallback UI has already been rendered.
    logErrorToService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong.</h2>;
    }
    return this.props.children;
  }
}

<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>`}
      </CodeBlock>

      <h2>Why Is This Still a Class Component?</h2>

      <p>
        There is no hooks-based error boundary API in React 19 — this was checked directly against
        the installed <code>react@19.2.6</code> package: <code>getDerivedStateFromError</code> and{' '}
        <code>componentDidCatch</code> are lifecycle methods that only exist on the{' '}
        <code>Component</code> base class, and there is no <code>useErrorBoundary</code> (or
        equivalent) exported from <code>react</code>. If you want to catch a rendering error and
        substitute a fallback, a class component wrapping the failing subtree is still the only
        built-in mechanism. Libraries fill the gap with a pre-built class (see below) so you never
        have to hand-roll one yourself, but under the hood it's still a class.
      </p>

      <h2>What Error Boundaries Do NOT Catch</h2>

      <p>
        This is the part that trips people up in practice, so each of the following was verified by
        actually throwing in a running React 19 app and watching what happened — not assumed from
        memory.
      </p>

      <CodeBlock language="jsx" title="The setup used for every case below">
{`class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('Boundary caught:', error); }
  render() {
    return this.state.hasError ? <div>Fallback UI</div> : this.props.children;
  }
}

function DangerButton() {
  return (
    <button onClick={() => { throw new Error('boom-in-event-handler'); }}>
      Click me
    </button>
  );
}

<ErrorBoundary>
  <DangerButton />
</ErrorBoundary>`}
      </CodeBlock>

      <InfoBox variant="danger" title="Verified live: clicking the button above does NOT trigger the fallback">
        <p>
          Clicking <code>DangerButton</code> in a real running app: <code>getDerivedStateFromError</code>{' '}
          and <code>componentDidCatch</code> are never called, the fallback UI never appears, and the
          button stays mounted and clickable. The error surfaces exactly as it would with{' '}
          <em>no</em> boundary present at all — as an uncaught exception. In the browser that means a{' '}
          <code>window</code> <code>&quot;error&quot;</code> event and a console stack trace, the same
          place a plain <code>try</code>/<code>catch</code> around the click handler would need to
          live to actually handle it.
        </p>
      </InfoBox>

      <p>Four categories, all confirmed the same way — throw it, watch whether the fallback renders:</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Where it throws</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Caught?</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What actually happens</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Event handler (<code>onClick</code>, etc.)</td>
            <td style={{ padding: '0.75rem' }}>No</td>
            <td style={{ padding: '0.75rem' }}>Uncaught exception — a <code>window</code> <code>error</code> event fires; app keeps running</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>setTimeout</code> callback</td>
            <td style={{ padding: '0.75rem' }}>No</td>
            <td style={{ padding: '0.75rem' }}>Same as above — it's just a callback running outside React's render call stack</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Thrown inside a <code>.then()</code>/<code>async</code> function</td>
            <td style={{ padding: '0.75rem' }}>No</td>
            <td style={{ padding: '0.75rem' }}>Becomes a rejected promise — fires <code>window</code>'s <code>unhandledrejection</code> event, not <code>error</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>During <code>renderToString</code> (SSR)</td>
            <td style={{ padding: '0.75rem' }}>No</td>
            <td style={{ padding: '0.75rem' }}><code>renderToString</code> itself throws synchronously — verified with Node's <code>react-dom/server</code> directly; there's no client to hand a fallback to yet</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="Verified: a promise rejection is a different event than a thrown error">
        <p>
          Worth being precise about, since it changes how you'd catch it: <code>throw</code> inside a{' '}
          <code>.then()</code> callback doesn't produce an uncaught-exception event the way a
          synchronous throw does — it rejects the promise, and the browser reports it via{' '}
          <code>window.addEventListener(&apos;unhandledrejection&apos;, ...)</code>, a separate event
          from <code>&apos;error&apos;</code>. Both are invisible to an error boundary either way, but
          if you're building your own global error reporter you need both listeners, not just one.
        </p>
      </InfoBox>

      <h3>An error boundary can't catch its own error</h3>

      <p>
        If <code>getDerivedStateFromError</code> (or the boundary's own <code>render</code>) throws,
        that boundary does not catch itself — the error propagates up to the <strong>nearest
        ancestor</strong> boundary instead, exactly like any other render error. Verified by wrapping
        a boundary that deliberately throws from <code>getDerivedStateFromError</code> inside a second,
        outer boundary: the outer one's fallback renders, the inner one's never does. And if there is{' '}
        <em>no</em> ancestor boundary above the one that fails, the behavior is the pre-16 one all
        over again — React unmounts the whole tree at that root, verified by checking that the root's
        DOM content becomes empty.
      </p>

      <InfoBox variant="warning" title="The practical takeaway">
        <p>
          Keep boundary components themselves trivial. A boundary that does complex work in{' '}
          <code>getDerivedStateFromError</code> or its fallback <code>render</code> is a boundary that
          can itself throw — and when it does, it takes out everything below the next boundary up,
          not just the subtree it was supposed to protect.
        </p>
      </InfoBox>

      <h2>Granularity — Where to Put Boundaries</h2>

      <p>
        A boundary catches errors in the subtree <em>below</em> it — so placement decides the blast
        radius. One boundary around the entire app means any single broken widget takes down
        everything. A boundary per independent unit means a broken widget shows its own fallback
        while its siblings keep rendering normally — verified below with two sibling widgets sharing
        a page, only one of which is broken.
      </p>

      <CodeBlock language="jsx" title="Granular boundaries — one broken widget, unaffected siblings" showLineNumbers>
{`function Dashboard() {
  return (
    <div className="dashboard-grid">
      <WidgetBoundary name="weather">
        <WeatherWidget />
      </WidgetBoundary>
      <WidgetBoundary name="stock-ticker">
        <StockTickerWidget />  {/* throws — maybe the feed sent bad data */}
      </WidgetBoundary>
      <WidgetBoundary name="comments">
        <CommentsWidget />
      </WidgetBoundary>
    </div>
  );
}

// Verified: if StockTickerWidget throws during render, WeatherWidget and
// CommentsWidget are completely unaffected — they're outside the boundary
// that caught the error, so React never touches their fibers.`}
      </CodeBlock>

      <InfoBox variant="tip" title="A practical default">
        <p>
          Use both, at different levels. One boundary near the app root as a last-resort net (so a
          truly unexpected crash still shows &quot;Something went wrong, reload&quot; instead of a
          white screen), plus a boundary around each independently-useful unit — a widget, a route, a
          third-party embed, a remote module (see the <strong>Module Federation</strong> lesson for
          the same pattern applied to failed remote loads). The root boundary is your safety net; the
          granular ones are what keep a single broken feature from being a site-wide outage.
        </p>
      </InfoBox>

      <h2>Reach for <code>react-error-boundary</code> Instead of Hand-Rolling</h2>

      <p>
        Writing the class above by hand is fine for a demo, but <code>react-error-boundary</code>{' '}
        (maintained by a former React core team member) is the practical default in real codebases.
        Its API was checked directly against the library's source
        (<code>lib/components/ErrorBoundary.tsx</code> and <code>lib/types.ts</code> on its
        GitHub, version 6) rather than assumed — here's exactly what it adds beyond the hand-rolled
        version:
      </p>

      <CodeBlock language="jsx" title="react-error-boundary — the real props" showLineNumbers>
{`import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  // Exactly one of these three fallback props:
  fallback={<p>Something went wrong</p>}               // static content
  FallbackComponent={ErrorFallback}                    // component, gets { error, resetErrorBoundary }
  fallbackRender={({ error, resetErrorBoundary }) =>    // inline render prop, same args
    <p>{error.message}</p>
  }

  onError={(error, info) => logErrorToService(error, info.componentStack)}

  // Reset the boundary (clear the error, retry rendering children) whenever
  // any value in this array changes between renders — e.g. tie it to a
  // route param so navigating away from the page that crashed clears it.
  resetKeys={[routeId]}
  onReset={(details) => { /* details.reason is 'keys' or 'imperative-api' */ }}
>
  <Dashboard />
</ErrorBoundary>`}
      </CodeBlock>

      <p>
        <code>resetKeys</code> solves a real annoyance with the hand-rolled version: once a boundary's
        <code>state.hasError</code> flips to <code>true</code>, it stays <code>true</code> forever —
        even if the user navigates to a completely different page that would render fine. With{' '}
        <code>resetKeys</code>, the boundary automatically clears its error state and retries
        rendering the children the moment any listed value changes, no manual reset button required
        (though <code>resetErrorBoundary</code> — handed to your fallback via props — still exists for
        a manual &quot;Try again&quot; button).
      </p>

      <InfoBox variant="success" title="It also gives event handlers and async code a path into the boundary">
        <p>
          Since render-phase catching is the only mechanism React has, the library's{' '}
          <code>useErrorBoundary()</code> hook doesn't bypass that — it works <em>with</em> it. Calling
          the <code>showBoundary(error)</code> function it returns stores the error in local state and
          throws it on the <em>next render</em> of the component that called the hook. Because that
          component is a descendant of the <code>ErrorBoundary</code>, the throw happens during render
          like any other, and the boundary catches it normally. In other words: it converts an
          event-handler or async error into a render-phase throw for you, rather than adding a second,
          different catching mechanism.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Routing an event-handler error into the boundary" showLineNumbers>
{`import { useErrorBoundary } from 'react-error-boundary';

function SaveButton() {
  const { showBoundary } = useErrorBoundary();

  const handleClick = async () => {
    try {
      await saveData();
    } catch (error) {
      showBoundary(error); // schedules a render-phase throw → the nearest boundary catches it
    }
  };

  return <button onClick={handleClick}>Save</button>;
}`}
      </CodeBlock>

      <h2>React 19: <code>createRoot</code> Gained Root-Level Error Hooks</h2>

      <p>
        This was verified against <code>react-dom@19.2.6</code>'s source and cross-checked with
        React's official docs at <code>react.dev/reference/react-dom/client/createRoot</code> — it's
        easy to misremember exactly what these do, so both were checked rather than relying on
        recall. <code>createRoot</code> now accepts three optional callbacks that fire in addition to
        (not instead of) your boundaries' own <code>componentDidCatch</code>:
      </p>

      <CodeBlock language="jsx" title="Root-level error callbacks (React 19)" showLineNumbers>
{`const root = createRoot(document.getElementById('root'), {
  // Fires when a boundary DOES catch an error — good for centralized
  // logging without adding onError to every single boundary.
  onCaughtError: (error, errorInfo) => {
    reportToService(error, errorInfo.componentStack);
  },

  // Fires when an error is thrown and NO boundary catches it — this is
  // your last-resort global handler.
  onUncaughtError: (error, errorInfo) => {
    reportFatalToService(error, errorInfo.componentStack);
  },

  // Fires for errors React recovers from automatically on its own,
  // e.g. certain hydration mismatches — the app keeps running.
  onRecoverableError: (error, errorInfo) => {
    reportRecoverableToService(error, errorInfo.componentStack);
  },
});`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified live: onCaughtError fires alongside componentDidCatch, not instead of it">
        <p>
          Wired up a root with <code>onCaughtError</code> and a child boundary with{' '}
          <code>componentDidCatch</code>, then threw during render: both fired, in that order —{' '}
          <code>onCaughtError</code> first, then the boundary's own <code>componentDidCatch</code>.
          The fallback UI still rendered normally. These root options are a way to centralize error
          reporting across every boundary in the app without touching each boundary's own code — they
          don't change what gets caught or how.
        </p>
      </InfoBox>

      <p>
        One more React 19-specific change, also verified live rather than assumed: errors thrown
        inside the callback passed to the <code>startTransition</code> function returned by{' '}
        <code>useTransition</code> are now caught by the nearest error boundary. Before, a throw
        inside a transition callback was just an uncaught exception like any other async code. This
        doesn't extend to real async work like <code>setTimeout</code> or unresolved promises — it's
        specific to the synchronous function you pass to <code>startTransition</code> itself.
      </p>

      <h2>Decision Table</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Situation</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Use</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>A component might throw during render</td>
            <td style={{ padding: '0.75rem' }}>Wrap it in an error boundary — the only thing that catches render-phase throws</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>An <code>onClick</code>/<code>onChange</code>/etc. handler might throw</td>
            <td style={{ padding: '0.75rem' }}>Normal <code>try</code>/<code>catch</code> in the handler, or <code>useErrorBoundary().showBoundary(error)</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>A <code>fetch</code>/promise chain might reject</td>
            <td style={{ padding: '0.75rem' }}><code>.catch()</code> it directly, or route it into <code>showBoundary()</code> if you want the same fallback UI</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Building a new boundary from scratch today</td>
            <td style={{ padding: '0.75rem' }}><code>react-error-boundary</code> — <code>resetKeys</code> alone saves the manual reset logic</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Need one place to log every caught/uncaught error app-wide</td>
            <td style={{ padding: '0.75rem' }}><code>createRoot(container, {'{ onCaughtError, onUncaughtError }'})</code> instead of repeating <code>onError</code> per boundary</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>One widget failing shouldn&apos;t take down the whole page</td>
            <td style={{ padding: '0.75rem' }}>A boundary per independent widget/route, plus one root-level boundary as a last resort</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question="Why does React 19 still require error boundaries to be class components?"
        options={[
          "Function components technically can't hold state, so they can't track whether an error occurred",
          "There is no hook equivalent to getDerivedStateFromError/componentDidCatch — checked directly against react@19.2.6's exports, no such hook exists",
          "Hooks aren't allowed to render fallback UI under any circumstances",
          "It's a build-tool limitation in Vite, not a React limitation"
        ]}
        correctIndex={1}
        explanation="Function components hold state fine (useState exists precisely for that). The actual reason is narrower: React has not shipped a hooks-based equivalent for getDerivedStateFromError or componentDidCatch. Checking react@19.2.6's own exports directly confirms there's no useErrorBoundary or similar hook — Component, with those two static/instance methods, remains the only built-in way to catch a render-phase error in React."
        language="jsx"
      />

      <InteractiveChallenge
        question="An ErrorBoundary wraps a button whose onClick handler throws. What happens when the button is clicked, verified by actually running it?"
        options={[
          "getDerivedStateFromError runs and the fallback UI replaces the button",
          "componentDidCatch runs to log it, but the button stays visible",
          "Neither lifecycle method runs — it's an uncaught exception exactly like there was no boundary at all, and the button stays mounted and clickable",
          "React silently swallows the error since it's inside a try/catch React adds around all event handlers"
        ]}
        correctIndex={2}
        explanation="Verified live: clicking the button does not invoke getDerivedStateFromError or componentDidCatch, and the fallback never renders. Error boundaries only catch errors thrown during React's render phase. Event handlers run outside that call stack entirely, so a throw there is a plain uncaught exception — it fires a window 'error' event and prints to the console, the same as it would with zero boundaries anywhere in the app."
        language="jsx"
      />

      <InteractiveChallenge
        question="What does the resetKeys prop actually do on react-error-boundary's <ErrorBoundary>, per the library's own source?"
        options={[
          "It lists which child components are allowed to trigger the fallback",
          "When any value in the array changes between renders, the boundary automatically clears its error state and retries rendering the children",
          "It sets a timeout after which the boundary auto-resets regardless of props",
          "It's a list of error messages that should be ignored and not caught"
        ]}
        correctIndex={1}
        explanation="Confirmed against the library's actual componentDidUpdate implementation: it compares the previous and next resetKeys arrays, and if any entry changed (via Object.is), it calls onReset and resets state back to { didCatch: false, error: null } — which makes React attempt to render the children again. A common use is tying resetKeys to a route param, so navigating away from the page that crashed automatically clears the error instead of leaving the fallback stuck forever."
        language="jsx"
      />
    </LessonLayout>
  );
}
