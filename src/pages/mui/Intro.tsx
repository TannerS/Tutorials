import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function MuiIntro() {
  return (
    <LessonLayout
      title="MUI v4 — What You Have, and Where It Sits"
      sectionId="mui"
      lessonIndex={0}
      prev={null}
      next={{ path: '/mui/styling-v4', label: 'Styling in v4 — makeStyles & withStyles' }}
    >
      <InfoBox variant="warning" title="⚠️ Version notice — this section teaches a legacy version">
        <p>
          <strong>This section teaches Material-UI v4</strong> (<code>@material-ui/core</code>), because
          that is what runs in the codebase you work in. It is <strong>not</strong> the current version
          of the library, and a meaningful amount of what you learn here does not transfer forward.
        </p>
        <p>
          <strong>What you are learning:</strong> <code>@material-ui/core@4.12.4</code> — the final v4
          release, published <strong>April 2022</strong>. v4.0.0 shipped in <strong>May 2019</strong>.
          npm prints a deprecation warning on install: <em>&quot;Material UI v4 doesn&apos;t receive
          active development since September 2021.&quot;</em>
        </p>
        <p>
          <strong>The rename:</strong> at v5 the project became &quot;MUI&quot; and moved every package
          from the <code>@material-ui/*</code> scope to <code>@mui/*</code>. <code>@mui/material@5.0.0</code>{' '}
          was published <strong>September 2021</strong>. So <code>@material-ui/core</code> and{' '}
          <code>@mui/material</code> are the same library under two names, split at that line.
        </p>
        <p>
          <strong>The current version:</strong> <code>@mui/material@9.3.1</code> is the{' '}
          <code>latest</code> tag as of <strong>August 2026</strong>; the v9 line opened with 9.0.0 in{' '}
          <strong>April 2026</strong>. The published major timeline is v5 (Sept 2021), v6 (Aug 2024),
          v7 (Mar 2025), v9 (Apr 2026) — npm lists <em>no</em> 8.x release of{' '}
          <code>@mui/material</code> at all, and this lesson could not verify why that major was
          skipped, so treat that gap as an unexplained observation rather than a fact about the
          project. Every version number here was read from npm at the time of writing
          (<code>npm view @mui/material version</code>, <code>npm view @material-ui/core version</code>),
          not from memory — re-run those two commands if you want today&apos;s numbers.
        </p>
        <p>
          <strong>Net:</strong> v4 is roughly five majors and about seven years behind, and has been
          unmaintained for about five of those. Everything in this section is still true of the code on
          your screen at work. Very little of it is how you would start a new app today.
        </p>
      </InfoBox>

      <h2>What MUI Is</h2>
      <p>
        MUI is a React component library: <code>Button</code>, <code>TextField</code>,{' '}
        <code>Dialog</code>, <code>Table</code>, <code>Drawer</code>, and a few hundred more, plus a
        theming system that all of them read from. You install it, drop <code>&lt;Button&gt;</code> into
        your JSX, and get an accessible, keyboard-navigable, ripple-animated button without writing
        any of that yourself.
      </p>
      <p>
        The &quot;Material&quot; part is Google&apos;s <strong>Material Design</strong> — a published
        visual design specification (elevation, type scale, an 8px spacing grid, a specific ripple
        interaction). MUI is an <em>independent implementation</em> of that spec for React. It is not a
        Google project. That distinction matters in practice for two reasons: MUI ships on its own
        schedule and diverges from the spec where it wants to, and MUI&apos;s theme system is
        deliberately built so you can drag the components away from Material Design entirely and make
        them look like your own brand. Most production MUI apps have done exactly that.
      </p>

      <InfoBox variant="note" title="Naming, so the search results make sense">
        You will see three names for the same thing depending on the era: <strong>material-ui</strong>{' '}
        (v0, pre-2018), <strong>Material-UI</strong> (v1 through v4), and <strong>MUI</strong> (v5+).
        When you search a problem, add the version — &quot;material-ui v4 makeStyles&quot; — or you will
        land on v5+ docs that tell you to use APIs your <code>node_modules</code> does not contain.
      </InfoBox>

      <h2>The v4 Package Layout</h2>
      <p>
        v4 splits across several npm packages under the <code>@material-ui</code> scope. You will see
        all of these in a v4 <code>package.json</code>.
      </p>

      <CodeBlock language="json" title="A typical v4 package.json — versions verified on npm">
{`{
  "dependencies": {
    "@material-ui/core":   "^4.12.4",        // components + theming. The main one.
    "@material-ui/icons":  "^4.11.3",        // ~2000 Material icons as React components
    "@material-ui/lab":    "^4.0.0-alpha.61",// incubator: Autocomplete, Skeleton, Alert...
    "@material-ui/styles": "^4.11.5",        // the JSS engine, standalone
    "@material-ui/system": "^4.12.2"         // style-props helpers (spacing, palette)
  }
}`}
      </CodeBlock>

      <h3>@material-ui/core</h3>
      <p>
        Every stable component, plus the styling and theming exports. In v4 you will see two import
        styles for it, and both work:
      </p>

      <CodeBlock language="jsx" title="Named vs path imports">
{`// Named imports off the package root — concise, what most code uses.
import { Button, TextField, Dialog } from '@material-ui/core';

// Path imports — one component per file.
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

// Both resolve to the same component. The path form used to matter a lot for
// bundle size with older bundlers; with a modern bundler doing tree-shaking the
// difference is mostly gone. Match whatever the file you are editing already does.`}
      </CodeBlock>

      <h3>@material-ui/icons</h3>
      <p>
        Each icon is its own React component wrapping an <code>&lt;SvgIcon&gt;</code>. It is a large
        package, so path imports genuinely help here — importing the barrel pulls a lot of modules
        into the dependency graph.
      </p>

      <CodeBlock language="jsx" title="Icons">
{`import DeleteIcon from '@material-ui/icons/Delete';
import { Delete as DeleteIcon } from '@material-ui/icons'; // same thing

// Icons are components, so they accept MUI's icon props:
<DeleteIcon color="error" fontSize="small" />
<Button startIcon={<DeleteIcon />}>Delete</Button>`}
      </CodeBlock>

      <h3>@material-ui/lab</h3>
      <p>
        The incubator for components not yet promoted into core. In v4, <code>lab</code> never left
        alpha — the newest published v4 <code>lab</code> release is <code>4.0.0-alpha.61</code>. This
        is where <code>Autocomplete</code>, <code>Alert</code>, <code>Skeleton</code>,{' '}
        <code>Pagination</code>, <code>Rating</code>, <code>TreeView</code> and the timeline components
        lived in v4. If you have ever wondered why your <code>Autocomplete</code> import comes from a
        different package than your <code>TextField</code>, that is why. Most of them were promoted
        into <code>@mui/material</code> core in v5.
      </p>

      <InfoBox variant="tip" title="An alpha version number is not a warning here">
        <code>@material-ui/lab@4.0.0-alpha.61</code> looks alarming in a <code>package.json</code>, but
        it is the highest v4 <code>lab</code> release that exists and is what every v4 app uses.{' '}
        <code>Autocomplete</code> in particular was heavily used and heavily fixed. The alpha tag meant
        &quot;the API may change before promotion to core&quot; — which it did, at v5 — not
        &quot;unfinished.&quot;
      </InfoBox>

      <h3>@material-ui/styles</h3>
      <p>
        The styling engine itself, packaged separately so it could be used without any MUI components.
        This is where <code>makeStyles</code>, <code>withStyles</code>, <code>createStyles</code>,{' '}
        <code>useTheme</code>, <code>ThemeProvider</code> and <code>StylesProvider</code> actually
        live. <code>@material-ui/core</code> depends on it and re-exports the useful parts, which is
        why you can import from either path:
      </p>

      <CodeBlock language="jsx" title="Two import paths, one implementation">
{`import { makeStyles } from '@material-ui/core/styles';   // preferred in an app using core
import { makeStyles } from '@material-ui/styles';         // works, but see below

// Prefer '@material-ui/core/styles'. The core re-export is pre-wired with MUI's
// default theme, so a stray makeStyles(theme => ...) still gets a real theme when
// no ThemeProvider is mounted above it. The standalone '@material-ui/styles' import
// has no default theme, and theme.spacing(2) will throw on undefined.`}
      </CodeBlock>

      <p>
        Verified exports of <code>@material-ui/core/styles</code> in 4.12.4 (read straight off the
        installed package):
      </p>

      <CodeBlock language="text" title="Object.keys(require('@material-ui/core/styles'))">
{`MuiThemeProvider, ServerStyleSheets, StylesProvider, ThemeProvider,
alpha, createGenerateClassName, createMuiTheme, createStyles, createTheme,
darken, decomposeColor, duration, easing, emphasize, fade, getContrastRatio,
getLuminance, hexToRgb, hslToRgb, jssPreset, lighten, makeStyles,
recomposeColor, responsiveFontSizes, rgbToHex, styled,
unstable_createMuiStrictModeTheme, useTheme, withStyles, withTheme`}
      </CodeBlock>

      <InfoBox variant="info" title="Two surprises in that list">
        <p>
          <code>createTheme</code> <strong>is in v4</strong> — 4.12 back-ported the v5 name as an alias
          so migrations could start early. Calling the old <code>createMuiTheme</code> in 4.12.4 logs{' '}
          <em>&quot;the createMuiTheme function was renamed to createTheme&quot;</em> to the console.
          Both work; the theme object they return is identical.
        </p>
        <p>
          <code>styled</code> <strong>is also in v4</strong> — but it is the JSS-backed v4{' '}
          <code>styled</code>, not the emotion-backed v5 one, and it does not support the{' '}
          <code>sx</code> prop. Seeing <code>styled</code> in an import line is therefore <em>not</em>{' '}
          proof a file is v5. Check the package name, not the function name.
        </p>
      </InfoBox>

      <h2>The Styling Engine: JSS in v4, Emotion in v5+</h2>
      <p>
        This is the single largest difference between the version you use and every version after it,
        and it is the reason v4 styling knowledge does not carry forward cleanly.
      </p>
      <p>
        <strong>v4 styles with JSS.</strong> You author styles as a plain JavaScript object. JSS
        compiles that object into real CSS text, generates a unique class name for each rule, and
        injects a <code>&lt;style&gt;</code> tag into the document head. Your component receives a{' '}
        <code>classes</code> object mapping your rule names to those generated class names, and you put
        them on elements with <code>className</code>.
      </p>
      <p>
        <strong>v5 and later style with emotion.</strong> Emotion is a different CSS-in-JS library with
        a different authoring model: template-literal or object styles attached to a <em>component</em>{' '}
        via <code>styled()</code>, plus the <code>sx</code> prop for one-off overrides inline on any MUI
        component. There is no <code>classes</code> object to thread through, and no hook to call.
      </p>

      <CodeBlock language="jsx" title="The same button, both eras">
{`// ---------- v4: JSS, makeStyles, a hook, a classes object ----------
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
  },
}));

function Save() {
  const classes = useStyles();          // hook call, inside the component
  return <Button className={classes.root}>Save</Button>;
}

// ---------- v5+: emotion, styled() or sx, no hook, no classes ----------
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

const SaveButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
}));

function Save() {
  return <SaveButton>Save</SaveButton>;
}

// ...or with no styled() at all:
function Save() {
  return (
    <Button sx={{ p: 2, backgroundColor: 'primary.main' }}>Save</Button>
  );
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="What does NOT transfer from v4 to v5+">
        <p>
          <code>makeStyles</code> and <code>withStyles</code> were <strong>removed from the main
          package</strong> at v5. They survive only in a separate legacy compatibility package
          (<code>@mui/styles</code>), which MUI ships explicitly as a migration crutch and documents as
          deprecated — MUI&apos;s own migration guide additionally states it is not compatible with
          React 18 or <code>React.StrictMode</code>, which this lesson takes from the docs rather than
          from a verified install. A v5+ codebase that still imports <code>makeStyles</code> is a
          codebase mid-migration.
        </p>
        <p>
          The <code>theme.overrides</code> and <code>theme.props</code> keys were replaced by a single{' '}
          <code>theme.components</code> key with a different internal shape. Class names changed from{' '}
          <code>.MuiButton-label</code>-style JSS output to emotion&apos;s hashed names plus a stable{' '}
          <code>.MuiButton-*</code> layer. <code>createMuiTheme</code> became{' '}
          <code>createTheme</code>, and <code>palette.type</code> became <code>palette.mode</code>.
        </p>
        <p>
          <strong>What does transfer:</strong> the component API surface (props like{' '}
          <code>variant</code>, <code>color</code>, <code>size</code>), the shape and meaning of the
          theme object, the breakpoint model, and the general idea of theme-driven design. That is a
          real chunk of what you are about to learn — it is specifically the <em>styling mechanism</em>{' '}
          that got replaced.
        </p>
      </InfoBox>

      <h2>How To Tell Which Version A Codebase Is On</h2>
      <p>
        You will land in unfamiliar repos and need to know within ten seconds which world you are in.
        Three signals, in order of reliability:
      </p>

      <CodeBlock language="bash" title="1. package.json — the only definitive answer">
{`# The package NAME is the version boundary.
#   @material-ui/core   ->  v4 or earlier
#   @mui/material       ->  v5 or later
grep -E '"@(material-ui|mui)/' package.json

# Or read what is actually installed, which can differ from the range in package.json:
npm ls @material-ui/core @mui/material`}
      </CodeBlock>

      <CodeBlock language="jsx" title="2. Import lines — fast, and right in the file you are editing">
{`// v4 — the old scope, and /core in the path
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

// v5+ — the @mui scope, and /material instead of /core
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

// A mid-migration repo can contain BOTH, sometimes in the same file.
// The legacy engine also lives on as its own package:
import { makeStyles } from '@mui/styles';   // v5+ repo, still on legacy JSS`}
      </CodeBlock>

      <CodeBlock language="jsx" title="3. Styling shape — the tell inside component code">
{`// v4 shape: a hook defined at module scope, called inside the component,
// producing a classes object.
const useStyles = makeStyles({ root: { color: 'red' } });
const classes = useStyles();
<div className={classes.root} />

// v5+ shape: sx prop, or a styled component. No hook, no classes object.
<Box sx={{ color: 'red' }} />
const Red = styled('div')({ color: 'red' });`}
      </CodeBlock>

      <InfoBox variant="warning" title="The one signal that lies">
        Seeing <code>styled()</code> does not prove v5, because v4 exports a <code>styled()</code> too
        (verified in the export list above). Seeing the <code>sx</code> prop <em>is</em> a reliable
        v5+ signal — <code>sx</code> does not exist in v4 at all. And seeing{' '}
        <code>makeStyles</code> does not prove v4, because <code>@mui/styles</code> keeps it alive in
        v5+ repos. Always confirm against the import path.
      </InfoBox>

      <FlowChart
        title="Which MUI Am I Looking At?"
        chart={"graph TD\n  START[\"Open the file's import lines\"] --> SCOPE{\"Which npm scope?\"}\n  SCOPE -->|\"@material-ui/*\"| V4[\"v4 or earlier: JSS engine\"]\n  SCOPE -->|\"@mui/*\"| V5[\"v5 or later: emotion engine\"]\n  V4 --> V4S[\"makeStyles, withStyles, createMuiTheme<br/>theme.overrides and theme.props<br/>palette.type\"]\n  V5 --> LEGACY{\"Any @mui/styles imports?\"}\n  LEGACY -->|\"Yes\"| MID[\"Mid-migration: emotion available,<br/>legacy JSS still in use\"]\n  LEGACY -->|\"No\"| V5S[\"styled and sx<br/>theme.components<br/>palette.mode\"]\n  V4S --> CONFIRM[\"Confirm in package.json,<br/>or run npm ls for what is installed\"]\n  MID --> CONFIRM\n  V5S --> CONFIRM\n  style V4 fill:#3d2f14\n  style V5 fill:#1a3329\n  style MID fill:#2a1f44\n  style CONFIRM fill:#1a2744"}
      />

      <h2>What This Section Covers, In Order</h2>
      <p>
        The order is deliberate: it builds the thing you touch daily first, then the thing that feeds
        it, then the thing that fights you, then the escape route forward.
      </p>

      <CodeBlock language="text" title="Section map">
{`1. Intro (you are here)
     Where v4 sits, what is in the box, why JSS vs emotion is the fault line.

2. Styling in v4 — makeStyles & withStyles
     The core lesson. The hook form, the HOC form, createStyles, dynamic
     styles from props, clsx composition, and the specificity problem that
     eats an afternoon the first time you hit it.

3. Theming & the Theme Object
     createMuiTheme, ThemeProvider, and the real shape of the theme:
     palette, typography, spacing, breakpoints, shape, zIndex, transitions.
     Reading the theme three different ways. Dark mode via palette.type.

4. Overriding Component Styles
     theme.overrides and theme.props: changing every Button in the app from
     one place, rather than per-component.

5. v5 and Beyond — styled() and sx
     What replaced all of the above, so the migration guide reads as
     "this maps to that" rather than as a new library.

6. Cheat Sheet (v4 -> v5)
     The lookup table. Old name on the left, new name on the right.`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You open a file and see: import { styled } from '@material-ui/core/styles'. What can you conclude about which styling engine this code uses?"}
        options={[
          "It is v5+, because styled() is the v5 API",
          "It is v4 and JSS-backed — v4 exports its own styled(), and the @material-ui scope is the actual version signal",
          "It is ambiguous; styled() exists identically in both versions",
          "It is a mid-migration file mixing both engines",
        ]}
        correctIndex={1}
        explanation={"The import PATH is the signal, not the function name. @material-ui/core/styles is unambiguously v4, and v4's export list genuinely includes styled — it is a JSS-backed styled() that does not support the sx prop. Reading styled() as 'therefore v5' is the most common misread when moving between versions, which is why the reliable check is the scope (@material-ui vs @mui) or package.json."}
        language="jsx"
      />

      <InteractiveChallenge
        question={"Why does swapping v4 for v5 count as a real migration rather than a version bump, even though the components' props barely changed?"}
        options={[
          "v5 dropped support for React, requiring a framework change",
          "v5 removed most components, so you have to rewrite the UI",
          "The entire styling engine was replaced — JSS gave way to emotion, so makeStyles/withStyles left the main package, theme.overrides became theme.components, and every generated class name changed",
          "The Material Design specification was rewritten, so all visual output differs",
        ]}
        correctIndex={2}
        explanation={"The component API is the part that mostly survives — <Button variant=\"contained\" color=\"primary\"> reads the same in both. The breakage is underneath: JSS out, emotion in. That single swap is what forces makeStyles into a deprecated compatibility package, restructures the theme's override keys, and changes class-name generation, which in turn breaks any CSS or test selector that targeted the old generated names."}
        language="jsx"
      />

      <InfoBox variant="tip" title="Reading the rest of this section">
        Every API asserted here was checked against a real <code>@material-ui/core@4.12.4</code>{' '}
        install — export lists, the theme object&apos;s keys, the CSS that JSS actually emits — rather
        than written from memory. Where something could not be verified that way, the prose says so
        explicitly instead of guessing. Next up is the lesson you actually came for:{' '}
        <a href="/mui/styling-v4">makeStyles and withStyles</a>.
      </InfoBox>
    </LessonLayout>
  );
}

export default MuiIntro;
