import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

const th = { padding: '0.75rem', textAlign: 'left' as const, color: 'var(--accent-amber)' };
const td = { padding: '0.75rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, margin: '1rem 0' };
const headRow = { borderBottom: '2px solid var(--border-color)' };
const row = { borderBottom: '1px solid var(--border-color)' };

function MuiCheatsheet() {
  return (
    <LessonLayout
      title="MUI Cheat Sheet (v4 → v5)"
      sectionId="mui"
      lessonIndex={5}
      prev={{ path: '/mui/styled-v5', label: 'v5 and Beyond — styled() and sx' }}
      next={null}
    >
      <p>
        A single-page reconciliation of the five lessons before this one. Every import path, API
        name, theme key, class name, and error string below was read off a real install rather
        than recalled: <strong>@material-ui/core 4.12.4</strong>,{' '}
        <strong>@mui/material 5.18.0</strong>, <strong>@mui/material 9.3.1</strong>,{' '}
        <strong>@mui/styles 5.18.0</strong>. Anything that could not be verified by running it is
        marked <em>(unverified)</em>.
      </p>

      <h2>Version Reality</h2>

      <CodeBlock language="bash" title="npm view, August 2026">
{`@material-ui/core   latest = 4.12.4        <- final v4; your codebase
@mui/material       latest = 9.3.1         <- CURRENT (v9 stable: 7 Apr 2026)
                    latest-v7 = 7.3.11
                    latest-v6 = 6.5.0
                    latest-v5 = 5.18.0
@mui/styles         6.5.0 highest stable   <- JSS bridge; ENDS HERE
                    (latest tag = 6.4.8, behind; next = 7.0.0-beta.4)

# There is no 8.x. The version list goes 7.3.11 -> 9.0.0-alpha.0.
# Migration route: v4 -> v5 (the real work) -> v6 -> v7 -> v9.
# Do not attempt v4 -> v9 directly.`}
      </CodeBlock>

      <h2>Import Translation</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>v4</th>
            <th style={th}>v5 → v9</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><code>@material-ui/core</code></td>
            <td style={td}><code>@mui/material</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>@material-ui/core/styles</code></td>
            <td style={td}><code>@mui/material/styles</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>@material-ui/icons</code></td>
            <td style={td}><code>@mui/icons-material</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>@material-ui/lab</code></td>
            <td style={td}><code>@mui/lab</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>@material-ui/system</code></td>
            <td style={td}><code>@mui/system</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>@material-ui/styles</code></td>
            <td style={td}>
              <code>@mui/styles</code> — bridge only, <strong>stops at 6.5.0</strong>
            </td>
          </tr>
          <tr>
            <td style={td}>— (JSS was bundled)</td>
            <td style={td}>
              <code>@emotion/react</code> + <code>@emotion/styled</code> — <strong>peer deps you
              install yourself</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="bash" title="The swap, and the codemods that do most of it">
{`npm uninstall @material-ui/core @material-ui/icons @material-ui/lab
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# Official codemods — @mui/codemod is still published at 9.3.1.
# preset-safe bundles ~40 transforms: core-styles-import, create-theme,
# theme-palette-mode, theme-spacing, adapter-v4, styled-engine-provider...
# Its own README says: run this ONCE.
npx @mui/codemod@latest v5.0.0/preset-safe src/
npx @mui/codemod@latest v5.0.0/variant-prop src/
npx @mui/codemod@latest v5.0.0/link-underline-hover src/

# preset-safe does NOT touch makeStyles. Two separate transforms do — pick one:
npx @mui/codemod@latest v5.0.0/jss-to-styled src/      # -> styled()
npx @mui/codemod@latest v5.0.0/jss-to-tss-react src/   # -> tss-react

# Caveat from the codemod's own README on jss-to-styled: it converts the FIRST
# element of the return statement into a styled component and RAISES CSS
# specificity to reach nested children. Run it after the other breaking
# changes are handled, and read every diff.`}
      </CodeBlock>

      <h2>API Translation</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>v4</th>
            <th style={th}>v5 → v9</th>
            <th style={th}>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><code>makeStyles(styles)</code></td>
            <td style={td}><code>styled(Cmp)(fn)</code></td>
            <td style={td}>
              <strong>Throws</strong> if imported from <code>@mui/material/styles</code>. Returns
              a component, not a hook.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}><code>withStyles(styles)(Cmp)</code></td>
            <td style={td}><code>styled(Cmp)(fn)</code></td>
            <td style={td}>Same throw.</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>createMuiTheme()</code></td>
            <td style={td}><code>createTheme()</code></td>
            <td style={td}>
              <strong>4.12 already exports <code>createTheme</code> as an alias</strong> — rename
              on v4, for free.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}><code>createStyles()</code></td>
            <td style={td}>Not needed</td>
            <td style={td}>Existed to fix TS widening in <code>makeStyles</code>.</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>MuiThemeProvider</code></td>
            <td style={td}><code>ThemeProvider</code></td>
            <td style={td}>v4 exports both names already.</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>StylesProvider injectFirst</code></td>
            <td style={td}><code>StyledEngineProvider injectFirst</code></td>
            <td style={td}>Same job, emotion instead of JSS.</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>&apos;&amp;$disabled&apos;</code></td>
            <td style={td}><code>&apos;&amp;.Mui-disabled&apos;</code></td>
            <td style={td}>
              No empty rule, no <code>classes</code> threading. Just a selector.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}><code>classes</code> prop</td>
            <td style={td}><code>classes</code> prop</td>
            <td style={td}><strong>Unchanged.</strong> Still works, still typed by slot.</td>
          </tr>
          <tr style={row}>
            <td style={td}>—</td>
            <td style={td}><code>sx</code> prop</td>
            <td style={td}>New. On every component.</td>
          </tr>
          <tr style={row}>
            <td style={td}>—</td>
            <td style={td}><code>shouldForwardProp</code></td>
            <td style={td}>
              New obligation. Styling props now leak to the DOM unless filtered.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}><code>ServerStyleSheets</code></td>
            <td style={td}>emotion SSR (<code>createCache</code>)</td>
            <td style={td}>Different setup entirely; see MUI SSR docs.</td>
          </tr>
          <tr>
            <td style={td}><code>{'<Grid item xs={6}>'}</code></td>
            <td style={td}><code>Grid</code> (v2 layout)</td>
            <td style={td}>
              Old grid lived on as <code>GridLegacy</code>; removed in v9.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Theme Key Translation</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>v4 theme key</th>
            <th style={th}>v5 → v9 theme key</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><code>overrides.MuiButton.root</code></td>
            <td style={td}><code>components.MuiButton.styleOverrides.root</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>props.MuiButton</code></td>
            <td style={td}><code>components.MuiButton.defaultProps</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>palette.type: &apos;dark&apos;</code></td>
            <td style={td}><code>palette.mode: &apos;dark&apos;</code></td>
          </tr>
          <tr style={row}>
            <td style={td}>—</td>
            <td style={td}><code>components.MuiButton.variants[]</code> (new)</td>
          </tr>
          <tr style={row}>
            <td style={td}>—</td>
            <td style={td}><code>cssVariables: true</code> (new)</td>
          </tr>
          <tr>
            <td style={td}><code>theme.mixins.gutters()</code></td>
            <td style={td}>Removed — inline the padding, or use <code>sx</code></td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="danger" title="The silent killer of every v4 theme migration">
        <p style={{ marginBottom: 0 }}>
          <code>createTheme</code> does <strong>not</strong> validate top-level keys. Leave{' '}
          <code>overrides</code> or <code>props</code> in place and there is no error, no warning,
          and no styling — the keys are carried onto the theme object as inert data that nothing
          reads. Verified: at 5.18.0 and 9.3.1 the constructed theme has neither key. Grep your
          theme file for both words before you call a migration done.
        </p>
      </InfoBox>

      <h2>Theme Object Shape</h2>

      <CodeBlock language="javascript" title="v4 — createMuiTheme / createTheme (4.12+)">
{`const theme = createMuiTheme({
  palette: {
    type: 'light',                       // <- 'type'
    primary: { main: '#3f51b5' },
    error:   { main: '#f44336' },
  },
  typography: { fontFamily: 'Inter, sans-serif', button: { fontWeight: 600 } },
  spacing: 8,                            // theme.spacing(2) === '16px'
  shape:   { borderRadius: 4 },
  breakpoints: { values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 } },

  overrides: {                           // STYLES, keyed by CSS API slot
    MuiButton: {
      root:  { textTransform: 'none' },
      label: { fontWeight: 600 },        // 'label' slot exists in v4 only
    },
    MuiOutlinedInput: {
      root: { '&$focused $notchedOutline': { borderWidth: 1 } },
      notchedOutline: {},                // empty rules required by $ syntax
      focused: {},
    },
  },

  props: {                               // DEFAULT PROPS, no styling
    MuiButton:    { disableRipple: true },
    MuiTextField: { variant: 'outlined', size: 'small' },
  },
});

// Verified ThemeOptions keys at 4.12.4: shape, breakpoints, direction,
// mixins, overrides, palette, props, shadows, spacing, transitions,
// typography, zIndex, unstable_strictMode`}
      </CodeBlock>

      <CodeBlock language="javascript" title="v5 → v9 — createTheme">
{`const theme = createTheme({
  palette: {
    mode: 'light',                       // <- 'mode'
    primary: { main: '#1976d2' },
  },
  typography: { fontFamily: 'Inter, sans-serif' },
  spacing: 8,
  shape:   { borderRadius: 4 },

  components: {                          // ONE key, three sub-keys
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
        // slot keys are the same CSS API names, minus removed slots
      },
      defaultProps: {
        disableRipple: true,
      },
      variants: [
        { props: { variant: 'dashed' }, style: { border: '2px dashed' } },
      ],
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1 } },
      },
    },
  },
});

// Verified top-level keys on the RESULT at 5.18.0: breakpoints, direction,
// components, palette, spacing, shape, applyStyles, unstable_sxConfig,
// unstable_sx, mixins, shadows, typography, transitions, zIndex
// 9.3.1 adds: containerQueries, motion, alpha, lighten, darken, toRuntimeSource`}
      </CodeBlock>

      <CodeBlock language="javascript" title="The escape hatch during migration">
{`import { adaptV4Theme } from '@mui/material/styles';

// Moves props -> defaultProps and overrides -> styleOverrides. Warns on
// every call. Does NOT translate the CSS inside, so overrides targeting
// slots that v5 deleted (MuiButton label) are copied faithfully into a
// key nothing reads. Scaffolding, not a migration.
const theme = createTheme(adaptV4Theme(legacyThemeObject));`}
      </CodeBlock>

      <h2>The CSS-API-Slot Override Recipe (v4)</h2>

      <CodeBlock language="jsx" title="The whole pattern in one block">
{`// 1. Find the slots. Every component exports its union from its own .d.ts:
//    ButtonClassKey, TextFieldClassKey, DialogClassKey, ChipClassKey...
//    Ctrl-click the component, or pass a junk key and read the warning.

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: 24,
    '&:hover':    { backgroundColor: theme.palette.primary.dark },
    '&$disabled': { opacity: 0.4 },      // 2. $ = "the generated name of
  },                                     //    the rule 'disabled' in THIS sheet"
  label:    { fontWeight: 700 },
  disabled: {},                          // 3. empty rule is REQUIRED — it is
}));                                     //    what $disabled resolves to

function Save() {
  const classes = useStyles();
  return (
    <Button
      variant="contained"
      classes={{                         // 4. every slot you styled must be
        root:     classes.root,          //    passed, or its selector never
        label:    classes.label,         //    matches anything
        disabled: classes.disabled,
      }}
    >
      Save
    </Button>
  );
}

/* Emitted CSS (verified):
   .makeStyles-root-1                              { border-radius: 24px }
   .makeStyles-root-1:hover                        { ... }
   .makeStyles-root-1.makeStyles-disabled-2        { opacity: .4 }   (0,2,0)
   MUI's opponent:  .MuiButton-root.Mui-disabled                     (0,2,0) */`}
      </CodeBlock>

      <CodeBlock language="text" title="Verified DOM output — your class is MERGED, never replaced">
{`<button class="MuiButtonBase-root MuiButton-root makeStyles-root-1 MuiButton-contained">
  <span class="MuiButton-label makeStyles-label-2">Save</span>
</button>

Dev:  makeStyles-<rule>-<n>      Prod:  jss<n>
MUI's own names are stable in BOTH — never selector on your generated name.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Fastest CSS API lookup there is">
        <p style={{ marginBottom: '0.5rem' }}>
          Pass a deliberately wrong slot key once and read the console. Verbatim from 4.12.4:
        </p>
        <CodeBlock language="text" showLineNumbers={false}>
{`Material-UI: The key \`notAKey\` provided to the classes prop is not
implemented in ForwardRef(Button).
You can only override one of the following: root,label,text,textPrimary,
textSecondary,outlined,outlinedPrimary,outlinedSecondary,contained,
containedPrimary,containedSecondary,disableElevation,focusVisible,disabled,
colorInherit,textSizeSmall,textSizeLarge,outlinedSizeSmall,outlinedSizeLarge,
containedSizeSmall,containedSizeLarge,sizeSmall,sizeLarge,fullWidth,
startIcon,endIcon,iconSizeSmall,iconSizeMedium,iconSizeLarge.`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>It prints the complete slot list, every time.</p>
      </InfoBox>

      <h2>The Global State Classes</h2>

      <CodeBlock language="javascript" title="From @material-ui/styles/createGenerateClassName — and unchanged through v9">
{`const pseudoClasses = [
  'checked', 'disabled', 'error', 'focused',
  'focusVisible', 'required', 'expanded', 'selected',
];
// These eight slot names compile to SHORT GLOBAL names, not per-component ones:

  Mui-checked      Mui-disabled     Mui-error      Mui-focused
  Mui-focusVisible Mui-required     Mui-expanded   Mui-selected

// So a disabled Button carries 'Mui-disabled', NOT 'MuiButton-disabled'.
// Verified identical at 4.12.4 and 9.3.1 — safe to target in either major.
// Everything else is per-component:  MuiButton-root, MuiChip-label, ...`}
      </CodeBlock>

      <h2>Specificity Escape Hatches</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Hatch</th>
            <th style={th}>Emits</th>
            <th style={th}>Cost</th>
            <th style={th}>Use when</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><code>{"'&&': { ... }"}</code></td>
            <td style={td}><code>.x.x</code> — (0,2,0)</td>
            <td style={td}><strong>Low</strong></td>
            <td style={td}>
              You need one more class of weight. Comment which rule you are outweighing.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}><code>{"'& .MuiButton-root'"}</code></td>
            <td style={td}><code>.x .MuiButton-root</code> — (0,2,0)</td>
            <td style={td}><strong>Moderate</strong></td>
            <td style={td}>
              Reaching a child you do not render. Bounded by your own subtree.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}><code>StylesProvider injectFirst</code></td>
            <td style={td}>Moves MUI&apos;s style tags to the top of <code>head</code></td>
            <td style={td}><strong>App-wide</strong></td>
            <td style={td}>
              Plain <code>.css</code> files must win ties. Does nothing for specificity losses.
            </td>
          </tr>
          <tr>
            <td style={td}><code>!important</code></td>
            <td style={td}>A higher cascade layer</td>
            <td style={td}><strong>High</strong></td>
            <td style={td}>
              Last resort. Kills every future state style on that property.
            </td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="css" title="Specificity ladder — the numbers that decide every fight">
{`(0,1,0)  .MuiButton-root                     .makeStyles-mine-1
(0,2,0)  .MuiButton-root:hover               .makeStyles-root-1:hover
(0,2,0)  .MuiButton-root.Mui-disabled        .makeStyles-root-1.makeStyles-disabled-2
(0,2,0)  .MuiButton-contained:active         '&&' doubling
(0,3,0)  .MuiButton-root:hover.Mui-disabled  '&&&' tripling

TIES are broken by SOURCE ORDER in the stylesheet — later wins.
The order of names inside a class="..." attribute is IRRELEVANT.`}
      </CodeBlock>

      <InfoBox variant="warning" title="v4 only: your import order decides who wins a tie">
        <p style={{ marginBottom: 0 }}>
          Every <code>makeStyles</code> / <code>withStyles</code> call takes the next value from a
          module-level counter as its injection index, at module <em>evaluation</em> time.
          Verified: requiring <code>@material-ui/core/Button</code> before calling{' '}
          <code>makeStyles</code> puts your sheet last and your override wins; flipping the two
          lines puts your sheet first and MUI wins — same styles, opposite outcome. This is why an
          override can work in dev and vanish in a production build.{' '}
          <strong>Emotion has no injection counter, so v5+ does not have this failure mode at
          all.</strong>
        </p>
      </InfoBox>

      <h2>Which Override Mechanism Do I Want?</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Situation</th>
            <th style={th}>v4</th>
            <th style={th}>v5 → v9</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}>Flat properties, outer element, one call site</td>
            <td style={td}><code>className</code></td>
            <td style={td}><code>sx</code> prop</td>
          </tr>
          <tr style={row}>
            <td style={td}>An inner element (label, icon, notched outline)</td>
            <td style={td}><code>classes</code> prop + slot</td>
            <td style={td}><code>classes</code> / <code>slotProps</code> / descendant selector</td>
          </tr>
          <tr style={row}>
            <td style={td}>A state — hover, focus, disabled, checked</td>
            <td style={td}>
              <code>classes</code> + <code>&apos;&amp;$disabled&apos;</code> + empty rule + pass
              the slot
            </td>
            <td style={td}><code>&apos;&amp;.Mui-disabled&apos;</code></td>
          </tr>
          <tr style={row}>
            <td style={td}>Every instance in the app</td>
            <td style={td}>theme <code>overrides.MuiX</code></td>
            <td style={td}>theme <code>components.MuiX.styleOverrides</code></td>
          </tr>
          <tr style={row}>
            <td style={td}>Change a default prop everywhere</td>
            <td style={td}>theme <code>props.MuiX</code></td>
            <td style={td}>theme <code>components.MuiX.defaultProps</code></td>
          </tr>
          <tr style={row}>
            <td style={td}>A recurring <em>kind</em> of component</td>
            <td style={td}>Wrap it once</td>
            <td style={td}><code>styled(Cmp)</code>, or theme <code>variants[]</code></td>
          </tr>
          <tr>
            <td style={td}>Styles depend on a custom prop</td>
            <td style={td}><code>useStyles(props)</code></td>
            <td style={td}><code>styled</code> + <code>shouldForwardProp</code></td>
          </tr>
        </tbody>
      </table>

      <h2>styled() — the v5+ Signature</h2>

      <CodeBlock language="jsx" title="Every option, verified from @mui/system/createStyled.d.ts">
{`import { styled } from '@mui/material/styles';

const Fancy = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'accent',  // stop it hitting the DOM
  name: 'AppFancyButton',      // registers with the theme + labels the class
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root,
  skipVariantsResolver: false,
  skipSx: false,
})(({ theme, accent }) => ({
  backgroundColor: accent,
  padding: theme.spacing(1, 3),
  '&:hover':        { backgroundColor: theme.palette.action.hover },
  '&.Mui-disabled': { opacity: 0.4 },
  '& .MuiChip-label': { paddingLeft: 12 },      // reach an inner element
}));

// styled() returns a COMPONENT. Call it at module scope, never in a render.
// makeStyles returned a HOOK. That is the shape change that matters.

// Convention for many styling-only props:
//   shouldForwardProp: (prop) => !String(prop).startsWith('$')`}
      </CodeBlock>

      <h2>Symptom → Cause</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Symptom</th>
            <th style={th}>Cause</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}>Style applies at rest, reverts on hover</td>
            <td style={td}>
              You wrote (0,1,0); MUI&apos;s <code>:hover</code> rule is (0,2,0). Add{' '}
              <code>&apos;&amp;:hover&apos;</code> to match.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}>
              <code>&apos;&amp;$disabled&apos;</code> compiles but never matches, no warning
            </td>
            <td style={td}>
              You did not pass <code>classes.disabled</code>. It is a two-class selector; both
              classes must land.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}>Override works in dev, gone in prod</td>
            <td style={td}>
              v4 injection-order tie. Module evaluation order flipped. Raise specificity instead
              of relying on the tie.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}>Theme migrated, nothing themed, no errors</td>
            <td style={td}>
              Still using <code>overrides</code>/<code>props</code>. v5+ reads{' '}
              <code>components</code>.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}>
              <code>MUI: makeStyles is no longer exported...</code>
            </td>
            <td style={td}>
              Not a deprecation — the export throws. Rewrite to <code>styled</code>, or install{' '}
              <code>@mui/styles</code> and accept a v6 ceiling.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}>Button text styling stopped working after v5</td>
            <td style={td}>
              The <code>label</code> slot was deleted. Verified:{' '}
              <code>&apos;label&apos; in buttonClasses</code> is <code>false</code> at 5.18.0.
              Fold it into <code>root</code>.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}>
              <code>React does not recognize the X prop on a DOM element</code>
            </td>
            <td style={td}>
              A <code>styled</code> component forwarding a styling-only prop. Add{' '}
              <code>shouldForwardProp</code>.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}>
              <code>containedPrimary</code> override does nothing on v9
            </td>
            <td style={td}>
              Slot renamed. 5.18.0 has <code>containedPrimary</code>; 9.3.1 has{' '}
              <code>colorPrimary</code>. <em>(Which major renamed it: unverified.)</em>
            </td>
          </tr>
          <tr>
            <td style={td}>Grid props error after upgrading past v7</td>
            <td style={td}>
              Old grid became <code>GridLegacy</code>, then was removed in v9 per its changelog.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>The Debugging Loop</h2>

      <CodeBlock language="text" title="Four steps, in order, every time">
{`1. INSPECT THE ELEMENT — the actual DOM node that paints wrong. In v4 a
   Button is a <button> wrapping a <span class="MuiButton-label">. You are
   often targeting the wrong one.

2. FIND THE WINNING RULE in the Styles panel — the declaration that is NOT
   struck through. Read its specificity straight off the selector.

3. MATCH ITS SHAPE.
     opponent .MuiButton-root            -> one class is enough
     opponent .MuiButton-root:hover      -> you need '&:hover'
     opponent .MuiButton-root.Mui-disabled
              v4  -> classes + '&$disabled' + empty rule + pass the slot
              v5+ -> '&.Mui-disabled'

4. ONLY THEN reach for a hatch. Skipping to !important means you never
   learned which rule was winning — and you will be back for the hover state.`}
      </CodeBlock>

      <h2>The Rules</h2>

      <ol>
        <li>Read the DOM before writing a single line of override CSS.</li>
        <li>
          <code>className</code> is a bet on winning a tie. In v4 that tie is decided by module
          evaluation order — do not bet on it for anything stateful.
        </li>
        <li>
          The <code>classes</code> prop is the intended v4 mechanism, and it survives unchanged
          into v9. Slot names live in the component&apos;s <code>*ClassKey</code> type.
        </li>
        <li>
          <code>$name</code> means &quot;the generated class for rule <code>name</code> in this
          sheet&quot;. Declare the rule <em>and</em> pass it through <code>classes</code>.
        </li>
        <li>
          One instance → <code>classes</code>. Every instance → theme overrides. A new kind of
          thing → a wrapper (v4) or <code>styled</code> (v5+).
        </li>
        <li>
          Global class names (<code>MuiButton-root</code>, <code>Mui-disabled</code>) are stable
          across every major. Scoped under a class you own, they are fine; app-wide in a global
          stylesheet, they are theme overrides in disguise.
        </li>
        <li>
          <code>!important</code> is a loan at high interest. <code>&amp;&amp;</code> is the cheap
          hatch. <code>injectFirst</code> is a one-time app-wide decision.
        </li>
        <li>
          Rename <code>createMuiTheme</code> → <code>createTheme</code> on v4.12 today. It is a
          free line of migration.
        </li>
        <li>
          Grep any migrated theme for the words <code>overrides</code> and <code>props</code>.
          They fail silently.
        </li>
        <li>
          Every prop you style on in <code>styled()</code> is also a prop being forwarded to the
          DOM. Filter it.
        </li>
        <li>
          <code>sx</code> for one-offs, <code>styled</code> for reuse and hot paths, theme{' '}
          <code>styleOverrides</code> for &quot;all of them&quot;.
        </li>
        <li>
          <code>@mui/styles</code> caps you at v6 — it keeps JSS alive. <code>tss-react</code> is
          the same <code>makeStyles</code> shape on emotion, so it is not capped. Prefer it if you
          want a rename instead of a rewrite.
        </li>
      </ol>

      <h2>Going Past v5</h2>

      <p>
        This sheet stops at v5 because that is the jump out of v4. The library did not stop there —
        the current release is <strong>9.3.1</strong>, and several things that were true at v5
        changed again afterwards.
      </p>

      <CodeBlock language="text" title="What is waiting on the other side of v5">
{`Grid          v5/v6:  <Grid item xs={12} md={6}>
              v7/v9:  <Grid size={{ xs: 12, md: 6 }}>
              the old spelling emits NO width rule - layout silently stacks

breakpoints   values moved again, and down() changed MEANING at v5:
              v4 down("sm") = max-width:959.95px
              v9 down("sm") = max-width:599.95px      <- 360px, no warning

spacing()     v4 returns 16 (number), v9 returns "16px" (string)

theming       CSS variables + colorSchemes now exist:
              createTheme({ cssVariables: true, colorSchemes: {...} })
              fixes the dark-mode flash on first paint

versions      published majors are 5, 6, 7, 9 - THERE IS NO 8.x`}
      </CodeBlock>

      <InfoBox variant="tip" title="The current-version section">
        <p>
          All of that is covered, verified against a real{' '}
          <code>@mui/material@9.3.1</code> install, in{' '}
          <a href="/mui9/intro">MUI Current (v9)</a> — with{' '}
          <a href="/mui9/silent-breaks">The Breaks That Do Not Warn You</a> being the one to read
          before you attempt an upgrade, and{' '}
          <a href="/mui9/cheatsheet">its own cheat sheet</a> for the v9 translation tables.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default MuiCheatsheet;
