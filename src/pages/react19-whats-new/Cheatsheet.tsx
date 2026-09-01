import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function WhatsNewCheatsheet() {
  return (
    <GuideLayout
      title="React 19"
      kicker="WHAT'S NEW"
      glyph="✨"
      tagline="Every headline feature, what got removed, and the honest verdict on upgrading from 18."
      meta={['react@19.0.0+', '9 panels']}
      page="1 / 1"
      footer="This page is the recall sheet for the two lessons that precede it — the feature walkthrough and the migration reasoning live there, not here."
      prev={{ path: '/react19-whats-new/migration', label: 'Migrating from React 18 to 19' }}
      next={null}
    >
      <GuidePanel n={1} title="Actions — The Shape to Remember" accent="blue" glyph="⚡" span={2}>
        <GuideCode>{`const [state, formAction, isPending] = useActionState(actionFn, initialState);
// actionFn: (prevState, formData) => newState

function SubmitButton() {
  const { pending } = useFormStatus();   // react-dom — reads nearest parent <form>
  return <button disabled={pending}>Save</button>;
}

const [optimisticState, addOptimistic] = useOptimistic(realState, mergeFn);
// mergeFn: (state, update) => newState — auto-reverts if the action throws`}</GuideCode>
        <GuideRules items={[
          'useFormStatus only sees a PARENT <form> — calling it in the same component that renders the <form> tag always returns pending: false.',
          'useOptimistic auto-reverts to realState if the action throws — no manual rollback needed.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="use() — Not a Hook" accent="purple" glyph="🪝">
        <GuideDefs
          items={[
            ['use(promise)', 'suspends the component until it resolves, then returns the value'],
            ['use(Context)', 'same function also reads context — no useContext needed'],
            ['conditional', 'callable inside if / loops — unlike every other hook'],
          ]}
        />
        <GuideRules items={[
          'A promise created inline in the render body (use(fetch(...))) is a NEW promise every render — re-suspends forever. The promise must be stable.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="ref as a Prop" accent="green" glyph="🔗">
        <GuideCode>{`function Foo({ ref }) {
  return <div ref={ref} />;
}   // no forwardRef required

ref={(node) => {
  attach(node);
  return () => cleanup();   // NEW: a ref callback can return cleanup
}}`}</GuideCode>
        <GuideRules items={[
          'forwardRef still works and is not deprecated — ref-as-a-prop is additive, not a replacement requirement.',
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Document Metadata & Resources" accent="amber" glyph="📄" span={2}>
        <GuideDefs
          items={[
            ['<title> / <meta> / <link>', 'render anywhere in the tree — auto-hoisted into <head>'],
            ['<link rel="stylesheet" precedence>', 'Suspense-integrated; precedence controls insertion order'],
            ['<script async>', 'anywhere in the tree — deduped and hoisted automatically'],
            ['preload / preinit', 'react-dom — fetch, or fetch + execute, a resource early'],
            ['prefetchDNS / preconnect', 'react-dom — warm up a connection before the request'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={5} title="Context & Error Handling" accent="pink" glyph="🌐">
        <GuideCode>{`<ThemeContext value={theme}>          {/* new shorthand */}
  ...
</ThemeContext>
// <ThemeContext.Provider value={theme}> still works`}</GuideCode>
        <GuideDefs
          items={[
            ['onCaughtError', 'createRoot option — fires when an error boundary catches'],
            ['onUncaughtError', 'createRoot option — fires when nothing caught it'],
            ['onRecoverableError', 'createRoot option — React recovered automatically (e.g. a hydration mismatch)'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={6} title="React Compiler" accent="cyan" glyph="🛠️">
        <GuideRules items={[
          'A separate, opt-in BUILD TOOL — not bundled in react@19 and not on by default.',
          'Auto-memoizes components at build time; the useMemo/useCallback/memo triage from React 18 still applies to any code it has not run over.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Removed in 19 — What Actually Breaks" accent="red" glyph="🚫" span={2}>
        <GuideTable
          head={['Removed', 'Replacement']}
          rows={[
            ['PropTypes (all components)', 'TypeScript types'],
            ['defaultProps (function components only)', 'JS default parameters'],
            ['String refs (ref="x")', 'Callback ref / useRef'],
            ['Legacy Context (contextTypes)', 'createContext + useContext'],
            ['Module pattern factories', 'Return JSX directly'],
            ['ReactDOM.render / .hydrate', 'createRoot / hydrateRoot'],
            ['UMD builds', 'ESM CDN (e.g. esm.sh)'],
          ]}
        />
        <GuideRules items={[
          'Every removal fails SILENTLY except one: ReactDOM.render(...) is now a hard error, not a warning.',
          'PropTypes, string refs and legacy Context just quietly stop working — the build succeeds and the app renders, it just stops validating/applying what you thought it was.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Upgrade Steps, In Order" accent="blue" glyph="⬆️" span={2}>
        <GuideCode>{`npm install --save-exact react@^19.0.0 react-dom@^19.0.0
npm install --save-exact @types/react@^19.0.0 @types/react-dom@^19.0.0

npx codemod@latest react/19/migration-recipe
# ReactDOM.render, string refs, useFormState rename, etc.

npx tsc --noEmit
# defaultProps is dropped from FunctionComponent's type — this alone
# catches most of the PropTypes/defaultProps cleanup for you`}</GuideCode>
        <GuideRules items={[
          'Then run the full test suite AND grep manually for .propTypes / .defaultProps / ref=" / contextTypes — these fail silently, a green suite does not prove you caught everything.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="The Honest Bottom Line" accent="purple" glyph="✅">
        <GuideRules items={[
          'Function-components-only, hooks-based, TypeScript-typed (or PropTypes-free), already on createRoot: none of the removals above apply.',
          'There is no new mental model to learn moving 18 → 19 — every removed API already had a replacement available in 18.',
          'For a codebase shaped like that, the upgrade really is close to a version-number bump.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
