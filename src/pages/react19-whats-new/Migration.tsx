import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function WhatsNewMigration() {
  return (
    <LessonLayout
      title="Migrating from React 18 to 19"
      sectionId="react19-whats-new"
      lessonIndex={2}
      prev={{ path: '/react19-whats-new/react19', label: 'React 19 in Depth' }}
      next={{ path: '/react19-whats-new/cheatsheet', label: "📋 What's New in React 19 Field Guide" }}
    >
      {/* ── 1. Framing ── */}
      <p>
        The previous lesson covered what's <em>new</em> in React 19 &mdash; Actions, the{' '}
        <code>use</code> hook, <code>useOptimistic</code>, and the rest. This lesson is the
        opposite angle: you have a working React 18 app, and you need to know exactly what
        will <strong>break</strong>, what's quietly <strong>deprecated</strong>, and what
        concrete steps to run to get to 19 safely.
      </p>
      <InfoBox variant="tip" title="The honest headline">
        If your codebase has no legacy class components using <code>contextTypes</code> or
        string refs, no <code>PropTypes</code>/<code>defaultProps</code> on function
        components, and no <code>react-test-renderer</code> in your test suite, the upgrade
        is often close to a version-number bump: <code>npm install react@19 react-dom@19</code>{' '}
        and you're mostly done. Most modern React 18 apps (hooks-only, function components,
        TypeScript types instead of PropTypes) fall into this bucket. The rest of this lesson
        is about confirming that's actually true for <em>your</em> app before you assume it.
      </InfoBox>

      {/* ── 2. What actually breaks — overview ── */}
      <h2>What Actually Breaks</h2>
      <p>
        React 19 removes a short list of APIs that were deprecated years ago (some as far
        back as 2017) and prints a warning if you're still using the old JSX transform. It
        does <strong>not</strong> introduce a wave of new breaking changes on top of that —
        the removals below are the entire list from React's official upgrade guide.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
            <th style={{ padding: '0.6rem 0.75rem' }}>Removed / changed</th>
            <th style={{ padding: '0.6rem 0.75rem' }}>Deprecated since</th>
            <th style={{ padding: '0.6rem 0.75rem' }}>Status in React 19</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['PropTypes checks', 'v15.5.0 (2017)', 'Removed from the package; silently ignored (all components)'],
            ['defaultProps on function components', 'React 18 docs', 'Removed; class components still support it'],
            ['String refs (ref="x")', 'v16.3.0 (2018)', 'Removed entirely'],
            ['Legacy Context (contextTypes)', 'v16.6.0 (2018)', 'Removed entirely'],
            ['react-test-renderer', 'n/a', 'Deprecated, warns, now uses concurrent rendering'],
            ['Module pattern factories', 'v16.9.0 (2019)', 'Removed entirely'],
            ['ReactDOM.render / ReactDOM.hydrate', 'v18.0.0 (2022)', 'Removed entirely'],
            ['UMD builds', 'n/a', 'Removed; use an ESM CDN like esm.sh instead'],
            ['Classic JSX transform', '2020 announcement', 'Still runs, but logs a console warning'],
          ].map(([what, since, status]) => (
            <tr key={what} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.6rem 0.75rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{what}</td>
              <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{since}</td>
              <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <InfoBox variant="info" title="Notice the pattern">
        Every one of these was deprecated years before React 19 shipped &mdash; most with a
        console warning telling you exactly what to do instead. React 19 is the release that
        finally deletes the code paths, it isn't introducing surprise changes. If your app has
        been running warning-free on React 18, you've likely already dodged most of this list.
      </InfoBox>
      {/* ── 3. PropTypes and defaultProps ── */}
      <h2>PropTypes and defaultProps for Function Components</h2>
      <p>
        <code>PropTypes</code> validation is removed from the React package entirely in 19
        &mdash; setting <code>MyComponent.propTypes = {'{ ... }'}</code> is now silently
        ignored, on <em>any</em> component type, function or class. <code>defaultProps</code>{' '}
        is a narrower change: it's removed specifically for <strong>function components</strong>{' '}
        in favor of ES6 default parameters. Class components keep <code>defaultProps</code>{' '}
        support, since there's no default-parameter equivalent for class fields.
      </p>
      <CodeBlock language="tsx" title="Before → After (function component)">{`
// React 18 — PropTypes + defaultProps on a function component
import PropTypes from 'prop-types';

function Greeting({ name, excited }) {
  return <div>Hello {name}{excited ? '!' : ''}</div>;
}
Greeting.propTypes = { name: PropTypes.string, excited: PropTypes.bool };
Greeting.defaultProps = { excited: false };

// React 19 — types + a default parameter, both checked at compile time
interface GreetingProps {
  name: string;
  excited?: boolean;
}
function Greeting({ name, excited = false }: GreetingProps) {
  return <div>Hello {name}{excited ? '!' : ''}</div>;
}
`}</CodeBlock>
      <InfoBox variant="warning" title="This fails silently, not loudly">
        Neither removal throws or errors at runtime — your build succeeds and the app renders,
        it just stops validating props or applying defaults. That makes this the easiest
        breaking change to miss. Search your codebase for <code>.propTypes</code> and{' '}
        <code>.defaultProps</code> before upgrading rather than waiting for a bug report.
      </InfoBox>

      {/* ── 4. String refs ── */}
      <h2>String Refs</h2>
      <p>
        The old <code>ref="someName"</code> string-ref API (class components only, deprecated
        since v16.3.0) is removed entirely in React 19. Use a callback ref or{' '}
        <code>useRef</code>/<code>createRef</code> object ref instead.
      </p>
      <CodeBlock language="jsx" title="Before → After">{`
// React 18 (deprecated) — string ref
class Form extends React.Component {
  componentDidMount() {
    this.refs.input.focus();
  }
  render() {
    return <input ref="input" />;
  }
}

// React 19 — callback ref
class Form extends React.Component {
  inputRef = null;
  componentDidMount() {
    this.inputRef?.focus();
  }
  render() {
    return <input ref={(el) => { this.inputRef = el; }} />;
  }
}
`}</CodeBlock>

      {/* ── 5. Legacy Context ── */}
      <h2>Legacy Context API</h2>
      <p>
        The old class-only context API &mdash; <code>contextTypes</code> and{' '}
        <code>getChildContext</code> (deprecated since v16.6.0) &mdash; is removed. Use{' '}
        <code>createContext</code> + <code>useContext</code> (function components) or the{' '}
        <code>contextType</code> static (class components) instead.
      </p>
      <CodeBlock language="jsx" title="Before → After">{`
// React 18 (deprecated) — legacy context
class Parent extends React.Component {
  static childContextTypes = { theme: PropTypes.string };
  getChildContext() {
    return { theme: 'dark' };
  }
  render() { return <Child />; }
}
class Child extends React.Component {
  static contextTypes = { theme: PropTypes.string };
  render() { return <div>{this.context.theme}</div>; }
}

// React 19 — createContext + useContext
const ThemeContext = React.createContext('light');

function Parent() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}
function Child() {
  const theme = React.useContext(ThemeContext);
  return <div>{theme}</div>;
}
`}</CodeBlock>

      {/* ── 6. Smaller removals ── */}
      <h2>The Smaller Removals</h2>
      <p>
        Three more changes round out the list. All three are rare in a typical app, but worth
        a quick check.
      </p>
      <InfoBox variant="note" title="react-test-renderer — deprecated, not removed">
        <code>react-test-renderer</code> still works in 19 but now logs a deprecation warning
        and renders concurrently (which can change timing-sensitive test behavior). React
        recommends migrating to <code>@testing-library/react</code>, which tests against real
        DOM behavior instead of an internal renderer.
      </InfoBox>
      <InfoBox variant="note" title="Module pattern factories — removed">
        An old, rarely-used pattern where a component function returned an object with a{' '}
        <code>render()</code> method instead of returning JSX directly. Deprecated since
        v16.9.0, now removed. If you've never seen this pattern, you don't have it.
        <CodeBlock language="jsx" showLineNumbers={false}>{`
// Removed pattern
function FactoryComponent() {
  return { render() { return <div />; } };
}
// Just return JSX
function FactoryComponent() {
  return <div />;
}
`}</CodeBlock>
      </InfoBox>
      <InfoBox variant="note" title="UMD builds — removed">
        React no longer ships UMD bundles, so a bare <code>{'<script src="react.production.min.js">'}</code>{' '}
        global-variable setup no longer has an official build to point at. For script-tag
        usage without a bundler, React's guide points to an ESM-based CDN such as{' '}
        <code>esm.sh</code> instead.
      </InfoBox>

      {/* ── 7. ReactDOM.render / hydrate ── */}
      <h2>ReactDOM.render and ReactDOM.hydrate Are Gone</h2>
      <p>
        These were deprecated (with a console warning) back in React 18.0 in favor of{' '}
        <code>createRoot</code>/<code>hydrateRoot</code>. In React 19 they are fully removed
        &mdash; calling <code>ReactDOM.render(...)</code> is a hard error now, not a warning.
        If your app somehow still uses the old API, this is the one item on this list that
        will stop your app from rendering at all until fixed.
      </p>
      <CodeBlock language="jsx" title="Before → After">{`
// React 18 and earlier — removed in React 19
import { render } from 'react-dom';
render(<App />, document.getElementById('root'));

// React 18+ API, required in React 19
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Hydration equivalent
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />);
`}</CodeBlock>
      <InfoBox variant="tip" title="Most apps already did this migration">
        If you're on a modern starter (Vite, Next.js, Create React App's last versions) your{' '}
        <code>main.tsx</code> almost certainly already calls <code>createRoot</code> &mdash;
        this became the default output of every scaffolding tool once React 18 shipped. Check
        your entry file once and move on.
      </InfoBox>

      {/* ── 8. JSX transform ── */}
      <h2>The New JSX Transform</h2>
      <p>
        React 19 adds features (like passing <code>ref</code> as a regular prop) that depend
        on the automatic JSX transform introduced back in 2020. If your build is still on the
        classic transform, your app doesn't fail to build or crash &mdash; it logs this
        console warning instead:
      </p>
      <CodeBlock language="text" showLineNumbers={false}>{`
Your app (or one of its dependencies) is using an outdated JSX transform.
Update to the modern JSX transform for faster performance:
https://react.dev/link/new-jsx-transform
`}</CodeBlock>
      <p>
        In practice this rarely bites anyone: every mainstream toolchain (Vite, Next.js,
        current Babel/TypeScript presets) has defaulted to the automatic transform for
        several years. It only shows up if you're hand-rolling an old Babel or TypeScript
        config. Set <code>"jsx": "react-jsx"</code> in <code>tsconfig.json</code> (or the
        equivalent Babel preset option) to confirm you're on it.
      </p>
      {/* ── 9. Upgrade steps ── */}
      <h2>The Actual Upgrade Steps</h2>
      <FlowChart
        title="React 18 → 19 Upgrade Flow"
        chart={`
graph TD
  A[Start on React 18] --> B[Search codebase for propTypes, defaultProps on function components, string refs, contextTypes]
  B --> C{Found any?}
  C -->|Yes| D[Fix or run the codemod recipe first]
  C -->|No| E[Skip straight to install]
  D --> F["npm install react@19 react-dom@19"]
  E --> F
  F --> G["npm install @types/react@19 @types/react-dom@19"]
  G --> H[Run tsc --noEmit]
  H --> I[Run full test suite]
  I --> J{Warnings or errors?}
  J -->|Yes| K[Fix flagged usages, re-run]
  J -->|No| L[Ship it]
  K --> H
`}
      />
      <p>Run through these in order:</p>
      <ol>
        <li>
          <strong>Install React 19 itself.</strong> Pin an exact version &mdash; and pin one at
          or above the security floor, not <code>19.0.0</code>:
          <CodeBlock language="bash" showLineNumbers={false}>{`npm install --save-exact react@19.2.8 react-dom@19.2.8`}</CodeBlock>
          <InfoBox variant="warning" title="Do not start from react@^19.0.0">
            <p>
              You will see <code>npm install --save-exact react@^19.0.0</code> quoted a lot.
              It is self-contradictory &mdash; <code>--save-exact</code> means &ldquo;write a
              bare version into <code>package.json</code>&rdquo;, while <code>^19.0.0</code> is
              a range, so the two flags argue about the same field.
            </p>
            <p style={{ marginBottom: 0 }}>
              More importantly the floor is unsafe. <strong>CVE-2025-55182</strong> (CVSS 10.0,
              pre-auth RCE in React Server Components) affects <code>19.0.0</code>,{' '}
              <code>19.1.0</code>, <code>19.1.1</code> and <code>19.2.0</code>; the fixes are{' '}
              <code>19.0.1</code>, <code>19.1.2</code> and <code>19.2.1</code>. A range starting
              at <code>^19.0.0</code> permits every vulnerable release, and a lockfile written
              from a stale cache can land on one. Name the exact version you intend to run.
            </p>
          </InfoBox>
        </li>
        <li>
          <strong>Update the TypeScript types</strong> to match &mdash; this project already
          pins <code>@types/react@19.2.15</code>, but for a fresh upgrade:
          <CodeBlock language="bash" showLineNumbers={false}>{`npm install --save-exact @types/react@19.2.15 @types/react-dom@19.2.3`}</CodeBlock>
        </li>
        <li>
          <strong>Run React's official codemod recipe.</strong> This is the current command
          from React's own upgrade guide &mdash; it chains five individual codemods
          (<code>replace-reactdom-render</code>, <code>replace-string-ref</code>,{' '}
          <code>replace-act-import</code>, <code>replace-use-form-state</code>, and{' '}
          <code>prop-types-typescript</code>) so you don't have to remember or run them one
          at a time:
          <CodeBlock language="bash" showLineNumbers={false}>{`npx codemod@latest react/19/migration-recipe`}</CodeBlock>
          It rewrites the mechanical stuff (<code>ReactDOM.render</code> call sites, string
          refs) automatically. Legacy Context and module pattern factories aren't covered by
          a codemod &mdash; those need a manual rewrite since they involve real API/shape
          changes, not just a rename.
        </li>
        <li>
          <strong>Type-check the whole project.</strong> Because <code>defaultProps</code> is
          dropped from the <code>FunctionComponent</code> type in <code>@types/react</code>{' '}
          19, TypeScript itself will flag any function component still assigning it &mdash;
          this alone catches a good chunk of the PropTypes/defaultProps cleanup for you:
          <CodeBlock language="bash" showLineNumbers={false}>{`npx tsc --noEmit`}</CodeBlock>
        </li>
        <li>
          <strong>Run your test suite and watch the console</strong>, not just the exit code.
          PropTypes and legacy patterns fail silently rather than throwing, so a green test
          run doesn't guarantee you've caught everything &mdash; grep for{' '}
          <code>.propTypes</code>, <code>.defaultProps</code>, <code>ref=&quot;</code>, and{' '}
          <code>contextTypes</code> across the codebase as a final manual pass.
        </li>
      </ol>

      {/* ── 10. Honest risk assessment ── */}
      <h2>How Much Work Is This, Really?</h2>
      <p>
        Circling back to the framing at the top: the actual amount of work depends entirely
        on how old your patterns are, not on how big your app is.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
            <th style={{ padding: '0.6rem 0.75rem' }}>Your app looks like...</th>
            <th style={{ padding: '0.6rem 0.75rem' }}>Expected effort</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.6rem 0.75rem' }}>
              Function components + hooks only, TypeScript (or no PropTypes usage), already on{' '}
              <code>createRoot</code>, no string refs, no legacy context
            </td>
            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--accent-green)' }}>
              Version bump. Install, type-check, ship.
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.6rem 0.75rem' }}>
              Mixed function/class components, some PropTypes on function components, plain
              JS (no TypeScript safety net)
            </td>
            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--accent-amber-deep)' }}>
              Small cleanup. Run the codemod, manually convert PropTypes to param defaults,
              re-test.
            </td>
          </tr>
          <tr>
            <td style={{ padding: '0.6rem 0.75rem' }}>
              Older class-heavy codebase: string refs, <code>contextTypes</code>/
              <code>getChildContext</code>, still calling <code>ReactDOM.render</code>
            </td>
            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--accent-red-deep)' }}>
              Real migration work. Budget dedicated time; legacy Context in particular needs
              a manual rewrite to <code>createContext</code>, not just a codemod pass.
            </td>
          </tr>
        </tbody>
      </table>
      <InfoBox variant="success" title="Bottom line">
        There is no new mental model to learn to move from 18 to 19 &mdash; every removal here
        already had a replacement API you could have been using in React 18. The upgrade is
        entirely about clearing out API usage that was already flagged as deprecated, in some
        cases for the better part of a decade.
      </InfoBox>

      {/* ── 11. Check yourself ── */}
    </LessonLayout>
  );
}
