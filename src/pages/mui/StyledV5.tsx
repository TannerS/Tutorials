import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import LessonLayout from '../../components/LessonLayout';

const th = { padding: '0.75rem', textAlign: 'left' as const, color: 'var(--accent-amber)' };
const td = { padding: '0.75rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, margin: '1rem 0' };
const headRow = { borderBottom: '2px solid var(--border-color)' };
const row = { borderBottom: '1px solid var(--border-color)' };

function MuiStyledV5() {
  return (
    <LessonLayout
      title="v5 and Beyond — styled() and sx"
      sectionId="mui"
      lessonIndex={4}
      prev={{ path: '/mui/overrides', label: 'Overriding Component Styles' }}
      next={{ path: '/mui/cheatsheet', label: '📋 MUI v4 Field Guide' }}
    >
      <p>
        v5 is the version where MUI stopped being the library you know. The package changed name,
        the styling engine was replaced, <code>makeStyles</code> was cut loose, and the theme
        grew a different shape. Everything after v5 has been comparatively gentle. So this lesson
        is mostly about one migration — and then an honest accounting of how far past it the
        library has actually gone.
      </p>

      <h2>Where the library actually is</h2>

      <p>
        This matters before anything else, because a lot of migration advice online quietly
        assumes v5 is the finish line. It is not. Read straight off the npm registry:
      </p>

      <CodeBlock language="bash" title="Verified against the registry, August 2026">
{`$ npm view @mui/material version
9.4.0

$ npm view @mui/material dist-tags
{
  latest:     '9.4.0',
  'latest-v7': '7.3.11',
  'latest-v6': '6.5.0',
  'latest-v5': '5.18.0',
  next:       '9.0.0-beta.1'
}

$ npm view @material-ui/core dist-tags
{ latest: '4.12.4', next: '5.0.0-beta.5' }`}
      </CodeBlock>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Major</th>
            <th style={th}>Package</th>
            <th style={th}>Latest</th>
            <th style={th}>Engine</th>
            <th style={th}>What it means for you</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><strong>v4</strong></td>
            <td style={td}><code>@material-ui/core</code></td>
            <td style={td}>4.12.4</td>
            <td style={td}>JSS</td>
            <td style={td}>Where your codebase is. Final release; no further updates.</td>
          </tr>
          <tr style={row}>
            <td style={td}><strong>v5</strong></td>
            <td style={td}><code>@mui/material</code></td>
            <td style={td}>5.18.0</td>
            <td style={td}>emotion</td>
            <td style={td}>The break. Rename, engine swap, new theme shape.</td>
          </tr>
          <tr style={row}>
            <td style={td}><strong>v6</strong></td>
            <td style={td}><code>@mui/material</code></td>
            <td style={td}>6.5.0</td>
            <td style={td}>emotion</td>
            <td style={td}>CSS theme variables go mainstream. Last major with <code>@mui/styles</code>.</td>
          </tr>
          <tr style={row}>
            <td style={td}><strong>v7</strong></td>
            <td style={td}><code>@mui/material</code></td>
            <td style={td}>7.3.11</td>
            <td style={td}>emotion</td>
            <td style={td}>Packaging/ESM cleanup. <code>@mui/styles</code> has no stable release here.</td>
          </tr>
          <tr>
            <td style={td}><strong>v9</strong></td>
            <td style={td}><code>@mui/material</code></td>
            <td style={td}><strong>9.4.0</strong></td>
            <td style={td}>emotion</td>
            <td style={td}>Current. Stable since 7 Apr 2026.</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="There is no v8 — that is not a typo">
        <p style={{ marginBottom: 0 }}>
          The published version list for <code>@mui/material</code> goes{' '}
          <code>7.3.11</code> → <code>9.0.0-alpha.0</code>. Searching the registry for any{' '}
          <code>8.x</code> release returns zero results. MUI skipped the number so that Material
          UI, Base UI, and the X packages could share a major-version line. If you see a guide
          referencing &quot;MUI v8&quot;, it is describing something that was never published.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="What this lesson claims, and what it verified">
        <p style={{ marginBottom: 0 }}>
          Every API name, error string, class name, and theme key below was produced by installing
          and running <code>@material-ui/core@4.12.4</code>, <code>@mui/material@5.18.0</code>, and{' '}
          <code>@mui/material@9.4.0</code> — reading the shipped type definitions and
          server-rendering real components. The v6 and v7 rows above are the exception: those are
          inferred from the registry (dist-tags, the absence of a stable{' '}
          <code>@mui/styles@7</code>) and from the shipped changelog, not from a run. Anything
          resting on that weaker evidence is flagged where it appears.
        </p>
      </InfoBox>

      <h2>The five things that changed at v5</h2>

      <h3>1. The package rename</h3>

      <CodeBlock language="bash" title="Old scope out, new scope in">
{`# Remove
npm uninstall @material-ui/core @material-ui/icons @material-ui/lab

# Install — note emotion is a PEER dependency you install yourself
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

@material-ui/core    ->  @mui/material
@material-ui/icons   ->  @mui/icons-material
@material-ui/lab     ->  @mui/lab
@material-ui/styles  ->  @mui/styles      (bridge only — see below)
@material-ui/system  ->  @mui/system`}
      </CodeBlock>

      <p>
        <code>@emotion/react</code> and <code>@emotion/styled</code> are declared as peer
        dependencies — verified in the shipped <code>package.json</code> at both 5.18.0 and 9.4.0.
        Forget them and you get a runtime error, not an install warning.
      </p>

      <h3>2. JSS out, emotion in</h3>

      <p>
        This is the change everything else falls out of. Here is the same Button rendered by both
        engines, so the difference is concrete rather than abstract:
      </p>

      <CodeBlock language="html" title="v4.12.4 — JSS">
{`<button class="MuiButtonBase-root MuiButton-root MuiButton-contained
               makeStyles-myButton-1 MuiButton-containedPrimary">
  <span class="MuiButton-label">Save</span>
</button>`}
      </CodeBlock>

      <CodeBlock language="html" title="v9.4.0 — emotion">
{`<button class="MuiButtonBase-root MuiButton-root MuiButton-contained
               MuiButton-sizeMedium MuiButton-colorPrimary my-class
               css-xgx37o-MuiButtonBase-root-MuiButton-root">
  Save
</button>`}
      </CodeBlock>

      <p>Read those two carefully, because three separate lessons are sitting in them.</p>

      <ul>
        <li>
          <strong>The global names survived.</strong> <code>MuiButton-root</code>,{' '}
          <code>MuiButton-contained</code>, <code>Mui-disabled</code> — same names, same meaning,
          four majors later. Any CSS you wrote against those still targets the same thing. That is
          the single largest piece of continuity in the whole migration.
        </li>
        <li>
          <strong>The generated name is now a content hash.</strong>{' '}
          <code>css-xgx37o-MuiButtonBase-root-MuiButton-root</code> — emotion hashes the resolved
          style object and appends the component labels for debuggability. There is no injection
          counter and therefore no import-order lottery. The Failure Mode A from the previous
          lesson — where whether your override won depended on which module was evaluated first —
          <strong> simply does not exist in v5+</strong>.
        </li>
        <li>
          <strong><code>MuiButton-label</code> is gone.</strong> Verified: at 5.18.0,{' '}
          <code>&apos;label&apos; in buttonClasses</code> is <code>false</code>. v5 deleted the
          inner span and put the children directly in the button. Every override you have that
          targets the <code>label</code> slot has nothing to attach to and dies silently.
        </li>
      </ul>

      <h3>3. makeStyles is not deprecated — it is evicted</h3>

      <p>
        This is stated too softly almost everywhere. <code>makeStyles</code> is not exported from{' '}
        <code>@mui/material/styles</code> with a warning. The export exists and{' '}
        <strong>throws</strong>. Here is the shipped implementation, identical at 5.18.0 and
        9.4.0:
      </p>

      <CodeBlock language="javascript" title="node_modules/@mui/material/styles/makeStyles.js — the entire file">
{`export default function makeStyles() {
  throw new Error(
    process.env.NODE_ENV !== "production"
      ? 'MUI: makeStyles is no longer exported from @mui/material/styles.\\n' +
        'You have to import it from @mui/styles.\\n' +
        'See https://mui.com/r/migration-v4/#mui-material-styles for more details.'
      : formatMuiErrorMessage(14)
  );
}

// withStyles.js is the same shape, with the same throw.`}
      </CodeBlock>

      <p>
        The error points you at <code>@mui/styles</code>, the standalone JSS bridge. It is real,
        it works, and it is a dead end with a visible end date:
      </p>

      <CodeBlock language="bash" title="The bridge, and where it stops">
{`$ npm view @mui/styles dist-tags
latest    = 6.4.8   <- NOTE: the latest tag is BEHIND the newest stable
latest-v6 = 6.5.0   <- the actual highest stable release
next      = 7.0.0-beta.4

# Every 7.x entry in the version list is an alpha or a beta.
# There is no stable @mui/styles@7, and none for 9.`}
      </CodeBlock>

      <InfoBox variant="danger" title="What the bridge really buys you">
        <p style={{ marginBottom: '0.5rem' }}>
          <code>@mui/styles</code> lets a v5 or v6 upgrade land without rewriting every{' '}
          <code>makeStyles</code> call on day one. That is a genuine and worthwhile use. But be
          clear-eyed about the deal: taking it <strong>caps you at v6</strong>. To reach v7 or v9
          you must delete every <code>makeStyles</code> call anyway, and you will be doing it
          later, under more pressure, on more code.
        </p>
        <p style={{ marginBottom: 0 }}>
          MUI additionally documents that <code>@mui/styles</code> is not compatible with React 18
          / <code>React.StrictMode</code>. <em>I could not verify that claim by running it</em> —
          the package&apos;s own README and type definitions say nothing about StrictMode, and the
          declared peer range still lists React 17, 18, and 19. Treat it as a documented caveat
          worth testing on your own app rather than as something established here.
        </p>
      </InfoBox>

      <InfoBox variant="success" title="The better bridge, if you have a lot of makeStyles: tss-react">
        <p style={{ marginBottom: '0.5rem' }}>
          There is a third option that is easy to miss, and MUI ships a codemod for it —{' '}
          <strong>tss-react</strong> (4.9.21 on npm, verified). It gives you a{' '}
          <code>makeStyles</code>-shaped API — a hook returning an object of class names —
          implemented on top of <em>emotion</em> rather than JSS.
        </p>
        <p style={{ marginBottom: 0 }}>
          That difference is the whole point. <code>@mui/styles</code> keeps JSS alive and is
          therefore capped at v6. <code>tss-react</code> is just emotion wearing a familiar API,
          so it rides along to v7 and v9 with everything else. For a codebase with hundreds of{' '}
          <code>makeStyles</code> calls, it converts a rewrite into a rename. Both routes have an
          official transform:{' '}
          <code>npx @mui/codemod@latest v5.0.0/jss-to-styled</code> and{' '}
          <code>npx @mui/codemod@latest v5.0.0/jss-to-tss-react</code> — verified present in{' '}
          <code>@mui/codemod@9.4.0</code>.
        </p>
      </InfoBox>

      <h3>4. The theme changed shape</h3>

      <p>
        Two v4 keys, <code>overrides</code> and <code>props</code>, collapsed into one{' '}
        <code>components</code> key with named sub-keys. Verified by inspecting the constructed
        theme object: at 5.18.0 and 9.4.0, <code>overrides</code> and <code>props</code> are{' '}
        <strong>not present at all</strong> on the result of <code>createTheme</code>. They do not
        warn. They are silently ignored.
      </p>

      <CodeBlock language="javascript" title="Side by side">
{`// ---------- v4 ----------
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
  },
  overrides: {
    MuiButton: {
      root:  { textTransform: 'none', borderRadius: 8 },
      label: { fontWeight: 600 },
    },
  },
  props: {
    MuiButton: { disableRipple: true },
  },
});

// ---------- v5 through v9 ----------
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',                       // 'type' -> 'mode'
  },
  components: {
    MuiButton: {
      styleOverrides: {                 // 'overrides' -> 'styleOverrides'
        root: { textTransform: 'none', borderRadius: 8 },
        // 'label' slot no longer exists — fold it into root
      },
      defaultProps: {                   // 'props' -> 'defaultProps'
        disableRipple: true,
      },
      variants: [                       // NEW in v5: named variants
        {
          props: { variant: 'dashed' },
          style: { border: '2px dashed' },
        },
      ],
    },
  },
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="createTheme already exists in v4.12 — rename it before you migrate">
        <p style={{ marginBottom: 0 }}>
          Verified in <code>@material-ui/core@4.12.4</code>: <code>styles/index.d.ts</code>{' '}
          exports <code>createTheme</code> and <code>createMuiTheme</code> from the same module,
          as aliases. If you are on 4.12.x you can do that rename today, on v4, as a no-op commit
          — and have one fewer thing to change on migration day. Free progress.
        </p>
      </InfoBox>

      <p>
        MUI also ships <code>adaptV4Theme</code>, which mechanically converts the old shape. It is
        worth knowing what it does and does not do — here is its actual body:
      </p>

      <CodeBlock language="javascript" title="@mui/material/styles/adaptV4Theme.js — the real mapping">
{`export default function adaptV4Theme(inputTheme) {
  console.warn('MUI: adaptV4Theme() is deprecated. ...');   // it warns, every time

  const { defaultProps = {}, mixins = {}, overrides = {},
          palette = {}, props = {}, styleOverrides = {}, ...other } = inputTheme;

  const theme = { ...other, components: {} };

  //  props     ->  components[X].defaultProps
  //  overrides ->  components[X].styleOverrides
  //  plus theme.spacing and the old theme.mixins.gutters helper

  return theme;
}`}
      </CodeBlock>

      <p>
        Note what is <em>not</em> in there: it moves your keys, it does not translate your CSS. A{' '}
        <code>label</code> slot that no longer exists is copied faithfully into a{' '}
        <code>styleOverrides.label</code> that nothing reads. Treat <code>adaptV4Theme</code> as a
        way to keep the app booting during a migration, not as the migration.
      </p>

      <h3>5. The $ syntax is gone, and good riddance</h3>

      <p>
        <code>&apos;&amp;$disabled&apos;</code> existed because JSS class names were generated and
        you needed a way to reference one. In v5 the state classes are exported as plain string
        constants, so you write an ordinary CSS selector:
      </p>

      <CodeBlock language="javascript" title="Verified values from @mui/material/Button">
{`import { buttonClasses } from '@mui/material/Button';

buttonClasses.root         // 'MuiButton-root'
buttonClasses.disabled     // 'Mui-disabled'      <- global, same as v4
buttonClasses.focusVisible // 'Mui-focusVisible'  <- global, same as v4
buttonClasses.contained    // 'MuiButton-contained'

// v4:  '&$disabled': { ... }   + disabled: {} + classes.disabled
// v5+: '&.Mui-disabled': { ... }
//      or, referencing the constant instead of the literal string:
//      ['&.' + buttonClasses.disabled]: { ... }`}
      </CodeBlock>

      <p>
        The three-part ritual from the last lesson — declare an empty rule, reference it with{' '}
        <code>$</code>, remember to pass it through <code>classes</code> — collapses to one
        selector that does what it looks like it does.
      </p>

      <h2>styled(): the replacement for makeStyles</h2>

      <p>
        <code>styled()</code> is the primary styling API from v5 onward. The most important thing
        to internalise is that it is <strong>not a renamed <code>makeStyles</code></strong>. It
        produces a different kind of thing, and that changes how you structure a file.
      </p>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}></th>
            <th style={th}><code>makeStyles</code> (v4)</th>
            <th style={th}><code>styled</code> (v5+)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}>Returns</td>
            <td style={td}>A hook</td>
            <td style={td}>A component</td>
          </tr>
          <tr style={row}>
            <td style={td}>You get back</td>
            <td style={td}>An object of class-name strings</td>
            <td style={td}>Something you render directly</td>
          </tr>
          <tr style={row}>
            <td style={td}>Called</td>
            <td style={td}>Inside the component body</td>
            <td style={td}>At module scope, outside any component</td>
          </tr>
          <tr style={row}>
            <td style={td}>Reads the theme</td>
            <td style={td}>Callback arg to <code>makeStyles</code></td>
            <td style={td}><code>theme</code> destructured from the style callback&apos;s argument</td>
          </tr>
          <tr style={row}>
            <td style={td}>Reads props</td>
            <td style={td}>Argument to the hook: <code>useStyles(props)</code></td>
            <td style={td}>Same callback argument, alongside <code>theme</code></td>
          </tr>
          <tr>
            <td style={td}>One sheet, many rules</td>
            <td style={td}>Yes — <code>root</code>, <code>label</code>, <code>icon</code>…</td>
            <td style={td}>No — one call per styled element</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="jsx" title="The signature, annotated">
{`import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

//        what you are wrapping        options (all optional)
//              |                              |
const Fancy = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'accent',
  name: 'AppFancyButton',        // shows up in the generated class name
  slot: 'Root',                  // and lets the THEME target this component
})(({ theme, accent }) => ({
  //   ^        ^
  //   |        the props of the rendered element, after filtering
  //   the full theme object — no hook, no context call
  borderRadius: 0,
  backgroundColor: accent,
  padding: theme.spacing(1, 3),
  transition: theme.transitions.create('background-color'),

  // Ordinary nested selectors. No $ needed.
  '&:hover':        { backgroundColor: theme.palette.action.hover },
  '&.Mui-disabled': { opacity: 0.4 },
}));

<Fancy accent="hotpink" variant="contained">Save</Fancy>`}
      </CodeBlock>

      <h3>shouldForwardProp, and why you will forget it exactly once</h3>

      <p>
        A styled component passes every prop it receives down to what it wraps. When the wrapped
        thing eventually renders a DOM element, React tries to put your styling prop on it as an
        HTML attribute — and React logs a warning about an unrecognised attribute, or worse,
        quietly emits <code>accent=&quot;hotpink&quot;</code> into your markup.
      </p>

      <CodeBlock language="jsx" title="The filter, and the verified result">
{`const Fancy = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'accent',
})(({ accent }) => ({ backgroundColor: accent }));

// Rendered output — 'accent' was consumed by the style callback
// and never reached the DOM:
<button class="MuiButtonBase-root MuiButton-root MuiButton-contained
               css-xsgvo3-MuiButtonBase-root-MuiButton-root"
        tabindex="0" type="button">c</button>

// A convention that scales past one prop: prefix styling-only props
// with '$' and filter them all with a single rule.
shouldForwardProp: (prop) => !String(prop).startsWith('$')`}
      </CodeBlock>

      <InfoBox variant="tip" title="name + slot make your component themeable">
        <p style={{ marginBottom: 0 }}>
          Passing <code>name: &apos;AppFancyButton&apos;</code> and <code>slot: &apos;Root&apos;</code>{' '}
          is not cosmetic. It registers your component with the theme, so a consumer can write{' '}
          <code>components.AppFancyButton.styleOverrides.root</code> in{' '}
          <code>createTheme</code> and restyle it exactly like a built-in — after augmenting
          MUI&apos;s <code>ComponentNameToClassKey</code> type. The full option set on{' '}
          <code>styled</code>, verified from <code>@mui/system/createStyled.d.ts</code>:{' '}
          <code>name</code>, <code>slot</code>, <code>overridesResolver</code>,{' '}
          <code>shouldForwardProp</code>, <code>skipVariantsResolver</code>,{' '}
          <code>skipSx</code>. This is how MUI builds MUI.
        </p>
      </InfoBox>

      <h2>The sx prop</h2>

      <p>
        <code>sx</code> is a style prop available on every MUI component. It accepts a CSS-ish
        object with three superpowers: theme-aware shorthands, responsive array/object values, and
        access to the theme without a callback.
      </p>

      <CodeBlock language="jsx" title="What sx is genuinely good at">
{`<Box
  sx={{
    // Spacing shorthands, multiplied through theme.spacing
    p: 2, mt: 1, mx: 'auto',        // padding: 16px; margin-top: 8px; ...

    // Palette paths resolved as strings
    color: 'primary.main',
    bgcolor: 'background.paper',

    // Responsive by breakpoint, without writing a media query
    width: { xs: '100%', md: 480 },
    display: { xs: 'none', sm: 'block' },

    // Still just CSS underneath
    '&:hover': { boxShadow: 3 },
  }}
/>`}
      </CodeBlock>

      <h3>What it is bad at</h3>

      <ul>
        <li>
          <strong>Repetition.</strong> The same twelve-line <code>sx</code> object pasted at six
          call sites is worse than the <code>classes</code> duplication it replaced, because it is
          bulkier and harder to grep. Six copies means you wanted a <code>styled</code> component.
        </li>
        <li>
          <strong>Anything conditional and complex.</strong> Ternaries nested inside an{' '}
          <code>sx</code> object read badly. Props-based branching is what{' '}
          <code>styled</code>&apos;s callback exists for.
        </li>
        <li>
          <strong>Being someone else&apos;s API.</strong> Accepting an <code>sx</code> prop into
          your own shared component hands callers unlimited reach into your internals. It is a
          public API you did not intend to publish.
        </li>
      </ul>

      <h3>The performance argument, stated fairly</h3>

      <p>
        <code>sx</code> costs more at runtime than <code>styled</code>. The object literal is
        constructed fresh on every render, then walked and resolved — shorthand keys expanded,
        theme paths looked up, breakpoint values turned into media queries — before emotion
        serialises the result and looks up or inserts a class. A <code>styled</code> component
        does its resolution once at module scope for static styles.
      </p>

      <InfoBox variant="info" title="How much does that actually cost?">
        <p style={{ marginBottom: 0 }}>
          Honestly: usually not enough to notice, and I did not benchmark it here, so I am not
          going to invent a number. What is verifiable is that MUI itself treats it as real —
          the shipped changelog for <strong>9.0.0 (7 Apr 2026)</strong> names{' '}
          <em>&quot;sx prop performance&quot;</em> as one of three headline focus areas of the
          major. The practical rule holds regardless of the size of the constant: use{' '}
          <code>sx</code> for one-off adjustments and layout tweaks at a call site; reach for{' '}
          <code>styled</code> when the styles are reused, or when the component is inside a list
          rendering hundreds of rows.
        </p>
      </InfoBox>

      <h2>The same component, both ways</h2>

      <p>
        One realistic component — a status chip with a colour that depends on a prop, a hover
        state, and a disabled state — written twice. Compare them line for line.
      </p>

      <CodeBlock language="jsx" title="v4 — makeStyles + classes + $ syntax">
{`import React from 'react';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    // props reach makeStyles by calling the hook with them
    backgroundColor: (props) =>
      props.tone === 'danger'
        ? theme.palette.error.main
        : theme.palette.success.main,
    fontWeight: 600,
    borderRadius: theme.shape.borderRadius,

    '&:hover': {
      backgroundColor: (props) =>
        props.tone === 'danger'
          ? theme.palette.error.dark
          : theme.palette.success.dark,
    },

    // state slot: needs the $ reference AND the empty rule AND
    // the class threaded through the classes prop
    '&$disabled': { opacity: 0.4 },
  },
  label: { paddingLeft: 12, paddingRight: 12 },
  disabled: {},
}));

export default function StatusChip({ tone, ...props }) {
  const classes = useStyles({ tone });
  return (
    <Chip
      classes={{
        root: classes.root,
        label: classes.label,
        disabled: classes.disabled,
      }}
      {...props}
    />
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="v5 through v9 — styled()">
{`import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';

const StatusChip = styled(Chip, {
  // 'tone' is ours; do not let it become a DOM attribute
  shouldForwardProp: (prop) => prop !== 'tone',
})(({ theme, tone }) => {
  const color = tone === 'danger' ? theme.palette.error : theme.palette.success;

  return {
    backgroundColor: color.main,
    fontWeight: 600,
    borderRadius: theme.shape.borderRadius,

    '&:hover': { backgroundColor: color.dark },

    // no $, no empty rule, no classes prop — a plain selector
    '&.Mui-disabled': { opacity: 0.4 },

    // the label slot still exists on Chip; target it by its global class
    '& .MuiChip-label': { paddingLeft: 12, paddingRight: 12 },
  };
});

export default StatusChip;`}
      </CodeBlock>

      <p>What actually changed, item by item:</p>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Concern</th>
            <th style={th}>v4</th>
            <th style={th}>v5+</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}>Wrapper component</td>
            <td style={td}>Hand-written, to call the hook</td>
            <td style={td}>None — <code>styled</code> returns it</td>
          </tr>
          <tr style={row}>
            <td style={td}>Props in styles</td>
            <td style={td}>Per-property arrow functions</td>
            <td style={td}>One callback arg, computed once</td>
          </tr>
          <tr style={row}>
            <td style={td}>Prop leaking to DOM</td>
            <td style={td}>Not an issue — hook args never forward</td>
            <td style={td}><strong>Is an issue</strong> — needs <code>shouldForwardProp</code></td>
          </tr>
          <tr style={row}>
            <td style={td}>Disabled state</td>
            <td style={td}>3 moving parts</td>
            <td style={td}><code>&apos;&amp;.Mui-disabled&apos;</code></td>
          </tr>
          <tr style={row}>
            <td style={td}>Inner element</td>
            <td style={td}><code>classes.label</code></td>
            <td style={td}>Descendant selector, or <code>slotProps</code></td>
          </tr>
          <tr>
            <td style={td}>Theme access</td>
            <td style={td}>Callback to <code>makeStyles</code></td>
            <td style={td}>Callback arg on the style function</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="The one thing that got harder">
        <p style={{ marginBottom: 0 }}>
          <code>shouldForwardProp</code> is new work with no v4 equivalent — a v4 hook took props
          as an argument, so they could never leak into the DOM. In v5 every custom prop you style
          on is also a prop being forwarded. If a migrated component starts emitting warnings
          about unknown DOM attributes, this is the cause, every time.
        </p>
      </InfoBox>

      <h2>Choosing an API in v5+</h2>

      <FlowChart
        title="Which v5+ styling API?"
        chart={"graph TD\n  Q[\"I need to style something\"] --> SCOPE{\"How widely does it apply?\"}\n  SCOPE -->|Every instance of a MUI component| THEME[\"createTheme components styleOverrides\"]\n  SCOPE -->|A reusable component of my own| STYLED[\"styled() at module scope\"]\n  SCOPE -->|This one call site only| ONEOFF{\"How much CSS?\"}\n  ONEOFF -->|A few layout or spacing props| SX[\"sx prop\"]\n  ONEOFF -->|More than a handful of lines| STYLED\n  STYLED --> PROPS{\"Do styles depend on a custom prop?\"}\n  PROPS -->|Yes| FWD[\"Add shouldForwardProp so it never reaches the DOM\"]\n  PROPS -->|No| OK[\"Done\"]\n  FWD --> OK\n  SX --> HOT{\"Rendered in a long list or hot path?\"}\n  HOT -->|Yes| STYLED\n  HOT -->|No| OK\n  THEME --> OK\n  style THEME fill:#1a3329\n  style STYLED fill:#1a3329\n  style SX fill:#1a2744\n  style FWD fill:#3d2f14"}
      />

      <h2>What happened after v5</h2>

      <p>
        Short version: nothing on the scale of v5, and nothing that changes the mental model you
        just built. <code>styled</code>, <code>sx</code>, <code>components.X.styleOverrides</code>,
        and the <code>MuiButton-root</code> class names all still mean what they mean at 9.4.0.
        The differences are narrower:
      </p>

      <ul>
        <li>
          <strong>CSS theme variables.</strong> At 9.4.0, <code>createTheme</code> accepts a{' '}
          <code>cssVariables</code> option — verified in the shipped{' '}
          <code>createTheme.d.ts</code> — which emits the theme as real CSS custom properties so
          light/dark switching stops re-rendering the tree. v9 also leans on this internally: a
          rendered v9 Button declares its own <code>--variant-containedBg</code> and friends, so
          overriding <code>backgroundColor</code> on <code>root</code> now competes with a{' '}
          <code>var()</code> reference rather than a literal colour.
        </li>
        <li>
          <strong>Button slot names drifted.</strong> Verified: at 5.18.0{' '}
          <code>buttonClasses</code> contains <code>containedPrimary</code>,{' '}
          <code>textSecondary</code>, and so on. At 9.4.0 those are gone, replaced by{' '}
          <code>colorPrimary</code>, <code>colorSecondary</code>, <code>colorError</code>, plus a
          set of new <code>loading*</code> slots. Which major dropped them, I did not verify.
        </li>
        <li>
          <strong>Grid was replaced.</strong> The old grid survived under the name{' '}
          <code>GridLegacy</code> for a while; the shipped v9 changelog records{' '}
          <em>&quot;Remove GridLegacy component&quot;</em>, and 9.4.0 ships only a{' '}
          <code>Grid</code> directory. If your v4 code is grid-heavy, budget for this
          specifically.
        </li>
        <li>
          <strong>v9 headline focus</strong>, quoting its own changelog:{' '}
          <em>&quot;accessibility improvements, sx prop performance, and cleanup of deprecated
          APIs&quot;</em>. &quot;Cleanup of deprecated APIs&quot; is the phrase that matters to a
          v4 codebase — the bridges get shorter with every major.
        </li>
      </ul>

      <InfoBox variant="success" title="So what is the actual route off v4?">
        <p style={{ marginBottom: 0 }}>
          v4 → v5 is the real work: rename, engine, theme shape, and every{' '}
          <code>makeStyles</code> call. Start with{' '}
          <code>npx @mui/codemod@latest v5.0.0/preset-safe src/</code> — around forty transforms
          bundled, and its own README says to run it exactly once. Then choose your JSS exit:{' '}
          <code>jss-to-styled</code> if you are willing to restructure, <code>jss-to-tss-react</code>{' '}
          if you would rather keep the hook shape and move on. Use <code>@mui/styles</code> only
          as scaffolding you have committed to removing, because it does not go past v6. Once you
          are on v5 with no JSS left, v5 → v6 → v7 → v9 are ordinary upgrades. Skipping straight
          from v4 to v9 means eating four majors&apos; worth of breaking changes with no working
          state in between — do not.
        </p>
      </InfoBox>

      <h2>Carry this forward</h2>

      <ul>
        <li>
          <strong>The current major is 9.</strong> v5 is the migration you have to make, not the
          place the library lives. There is no v8.
        </li>
        <li>
          <strong>The global class names survived every major.</strong>{' '}
          <code>MuiButton-root</code> and <code>Mui-disabled</code> mean the same thing at 4.12.4
          and 9.4.0. That is your bridge.
        </li>
        <li>
          <strong><code>makeStyles</code> throws</strong> from <code>@mui/material/styles</code>,
          and its bridge package <code>@mui/styles</code> stops at 6.5.0. There is no version of
          the future that contains it.
        </li>
        <li>
          <strong><code>styled</code> returns a component, not a hook.</strong> Module scope, one
          call per element, theme and props arrive together in one callback argument.
        </li>
        <li>
          <strong><code>shouldForwardProp</code> is the new failure mode.</strong> Any prop you
          style on is also a prop being forwarded.
        </li>
        <li>
          <strong><code>sx</code> for one-offs, <code>styled</code> for reuse, theme{' '}
          <code>styleOverrides</code> for &quot;all of them&quot;</strong> — the same three-tier
          decision you already learned in v4, under new names.
        </li>
      </ul>
    </LessonLayout>
  );
}

export default MuiStyledV5;
