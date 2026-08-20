import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function WhatsNewCheatsheet() {
  return (
    <LessonLayout
      title="What's New in React 19 Cheat Sheet"
      sectionId="react19-whats-new"
      lessonIndex={2}
      prev={{ path: '/react19-whats-new/migration', label: 'Migrating from React 18 to 19' }}
      next={null}
    >
      <p>
        A single-page reconciliation of both lessons that precede this one — what's new, and
        what breaks moving from React 18.
      </p>

      <h2>New in 19 — At a Glance</h2>

      <CodeBlock language="text" title="Every headline feature, one line each">
{`Actions              useActionState, useFormStatus (react-dom), useOptimistic
use()                use(promise) + use(Context) — callable conditionally, unlike hooks
ref as prop           function Foo({ ref }) { ... }  — no forwardRef required
ref cleanup           ref={(node) => { ...; return () => cleanup(); }}
Document metadata     <title>/<meta>/<link> anywhere — auto-hoisted to <head>
Stylesheets           <link rel="stylesheet" precedence="..."> — Suspense-integrated
Async scripts         <script async> anywhere — deduped + hoisted automatically
Preloading            preload, preinit, prefetchDNS, preconnect (react-dom)
Context provider      <ThemeContext value={theme}> — .Provider form still works
Error handling         onCaughtError / onUncaughtError / onRecoverableError (createRoot)
React Compiler        separate opt-in BUILD TOOL — not bundled in react@19, off by default`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Actions — the shape to remember">
{`const [state, formAction, isPending] = useActionState(actionFn, initialState);
// actionFn: (prevState, formData) => newState

function SubmitButton() {
  const { pending } = useFormStatus();   // from react-dom — reads nearest parent <form>
  return <button disabled={pending}>Save</button>;
}

const [optimisticState, addOptimistic] = useOptimistic(realState, mergeFn);
// mergeFn: (state, update) => newState — auto-reverts if the action throws`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two gotchas worth remembering">
        <p>
          <code>useFormStatus</code> only sees a parent <code>&lt;form&gt;</code> — calling it in
          the same component that renders the <code>&lt;form&gt;</code> tag itself always returns{' '}
          <code>pending: false</code>. And <code>use(somePromise)</code> must receive a{' '}
          <em>stable</em> promise — creating one inline in the component body
          (<code>use(fetch(...))</code>) makes a new promise every render and re-suspends forever.
        </p>
      </InfoBox>

      <h2>Removed in 19 — What Actually Breaks</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Removed</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Replacement</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>PropTypes (all components)</td>
            <td style={{ padding: '0.75rem' }}>TypeScript types</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>defaultProps (function components only)</td>
            <td style={{ padding: '0.75rem' }}>JS default parameters</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>String refs (<code>ref=&quot;x&quot;</code>)</td>
            <td style={{ padding: '0.75rem' }}>Callback ref / <code>useRef</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Legacy Context (<code>contextTypes</code>)</td>
            <td style={{ padding: '0.75rem' }}><code>createContext</code> + <code>useContext</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Module pattern factories</td>
            <td style={{ padding: '0.75rem' }}>Return JSX directly</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>ReactDOM.render</code> / <code>.hydrate</code></td>
            <td style={{ padding: '0.75rem' }}><code>createRoot</code> / <code>hydrateRoot</code></td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}>UMD builds</td>
            <td style={{ padding: '0.75rem' }}>ESM CDN (e.g. esm.sh)</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="danger" title="The one that actually stops your app">
        <p>
          Every removal above fails <em>silently</em> except one: <code>ReactDOM.render(...)</code>{' '}
          is a hard error in React 19, not a warning. Everything else (PropTypes, string refs,
          legacy Context) just quietly stops working — your build succeeds and the app renders,
          it just stops validating/applying what you thought it was.
        </p>
      </InfoBox>

      <h2>Upgrade Steps</h2>

      <CodeBlock language="bash" title="In order">
{`npm install --save-exact react@^19.0.0 react-dom@^19.0.0
npm install --save-exact @types/react@^19.0.0 @types/react-dom@^19.0.0

npx codemod@latest react/19/migration-recipe   # ReactDOM.render, string refs, useFormState rename, etc.

npx tsc --noEmit     # defaultProps is dropped from FunctionComponent's type — this alone
                      # catches most of the PropTypes/defaultProps cleanup for you

# Then: run the full test suite AND grep manually for .propTypes / .defaultProps /
# ref=" / contextTypes — these fail silently, a green test run doesn't prove you
# caught everything.`}
      </CodeBlock>

      <InfoBox variant="success" title="The honest bottom line">
        <p>
          If your app is function-components-only, hooks-based, TypeScript-typed (or no PropTypes
          at all), and already calling <code>createRoot</code> — none of the removals above apply,
          and the upgrade really is close to a version-number bump. There's no new mental model to
          learn moving 18 → 19; every removed API already had a replacement you could have been
          using in 18.
        </p>
      </InfoBox>

      <h2>Section Index</h2>

      <CodeBlock language="text" title="Both lessons, in reading order">
{`1. The Complete Feature List        Actions, use(), ref-as-prop, metadata/stylesheets/scripts,
                                     preloading, <Context> shorthand, error handlers, Compiler
2. Migrating from React 18 to 19     What breaks, why, and the real upgrade steps
3. This page`}
      </CodeBlock>
    </LessonLayout>
  );
}
