import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function MuiTheming() {
  return (
    <LessonLayout
      title="Theming & the Theme Object"
      sectionId="mui"
      lessonIndex={2}
      prev={{ path: '/mui/styling-v4', label: 'Styling in v4 — makeStyles & withStyles' }}
      next={{ path: '/mui/overrides', label: 'Overriding Component Styles' }}
    >
      <p>
        Every <code>theme.spacing(2)</code> and <code>theme.palette.primary.main</code> in the previous
        lesson came from one object, created once and pushed down the tree through React context. This
        lesson is that object: how you build it, what is actually in it, and the three ways to read it
        back out. As before, every key, default value and return value below was read off a live{' '}
        <code>@material-ui/core@4.12.4</code> install rather than written from memory.
      </p>

      <h2>createMuiTheme and ThemeProvider</h2>
      <p>
        <code>createMuiTheme</code> takes a <em>partial</em> theme — only the bits you want to change —
        and deep-merges it into MUI&apos;s defaults, filling in everything you left out. It also{' '}
        <em>derives</em> values: give it a <code>primary.main</code> and it computes{' '}
        <code>primary.light</code>, <code>primary.dark</code> and a readable{' '}
        <code>primary.contrastText</code> for you.
      </p>

      <CodeBlock language="jsx" title="The standard setup, once at the app root" showLineNumbers>
{`import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

const theme = createMuiTheme({
  palette: {
    primary:   { main: '#0b5fff' },   // light/dark/contrastText are DERIVED
    secondary: { main: '#d81b60' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    button: { textTransform: 'none' },  // kill the SHOUTY default. See below.
  },
  shape: { borderRadius: 8 },
  spacing: 8,
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />   {/* normalize + apply palette.background to <body> */}
      <Router />
    </ThemeProvider>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="createMuiTheme vs createTheme in v4.12">
        <p>
          Both names exist in <code>@material-ui/core@4.12.4</code> — <code>createTheme</code> was
          back-ported from v5 so migrations could start early. They are separate function objects
          (<code>createTheme === createMuiTheme</code> is <code>false</code>) but produce an identical
          theme.
        </p>
        <p>
          Calling <code>createMuiTheme()</code> on 4.12.4 prints a console notice:
        </p>
        <CodeBlock language="text" title="Console output, verified">
{`Material-UI: the createMuiTheme function was renamed to createTheme.

You should use: import { createTheme } from '@material-ui/core/styles'`}
        </CodeBlock>
        <p>
          (The original wraps that import line in backticks.) If your app is pinned below 4.12 the
          alias does not exist and <code>createMuiTheme</code> is your only option — which is why most
          v4 code you will read uses the old name. Switching to <code>createTheme</code> silences the
          notice and removes one rename from a future migration, but it is cosmetic. Do not churn a
          working codebase over it.
        </p>
      </InfoBox>

      <p>
        Mount <code>ThemeProvider</code> <strong>above everything that renders MUI components</strong>.
        Anything outside it falls back to MUI&apos;s default theme, which is a common source of &quot;why
        is this one dialog still indigo&quot; — portalled components render into a different DOM node
        but stay inside the React tree, so they inherit correctly; a second{' '}
        <code>ReactDOM.render</code> root does not.
      </p>

      <InfoBox variant="note" title="MuiThemeProvider is the same component">
        <code>MuiThemeProvider</code> is exported alongside <code>ThemeProvider</code> in v4 (both are
        in the verified export list) and is the older name kept for v3 compatibility. If you see it in
        your codebase it is not doing anything different.
      </InfoBox>
      <h2>The Real Shape of the Theme Object</h2>
      <p>
        Not a summary — this is <code>Object.keys(createMuiTheme())</code> from a live install. Twelve
        keys, and that is the entire object:
      </p>

      <CodeBlock language="text" title="Object.keys(createMuiTheme()), verified on 4.12.4">
{`breakpoints  direction  mixins  overrides  palette  props
shadows      shape      spacing  transitions  typography  zIndex`}
      </CodeBlock>

      <p>
        Below, each one with its actual default content. Print this section&apos;s values once and you
        will stop guessing at autocomplete.
      </p>

      <h3>palette</h3>

      <CodeBlock language="js" title="theme.palette — verified keys and defaults" showLineNumbers>
{`// Object.keys(theme.palette):
//   action, augmentColor, background, common, contrastThreshold, divider,
//   error, getContrastText, grey, info, primary, secondary, success,
//   text, tonalOffset, type, warning

theme.palette.type          // 'light'  <- v4's name. v5 renamed this to 'mode'.

theme.palette.primary       // { light: '#7986cb', main: '#3f51b5',
                            //   dark: '#303f9f', contrastText: '#fff' }
                            // (indigo — MUI's default brand color)

theme.palette.text          // { primary:   'rgba(0, 0, 0, 0.87)',
                            //   secondary: 'rgba(0, 0, 0, 0.54)',
                            //   disabled:  'rgba(0, 0, 0, 0.38)',
                            //   hint:      'rgba(0, 0, 0, 0.38)'  <- v4 only,
                            //                                    removed in v5
theme.palette.background    // light: { paper: '#fff', default: '#fafafa' }
                            // dark:  { paper: '#424242', default: '#303030' }

// Semantic colors, each with light/main/dark/contrastText:
theme.palette.error  theme.palette.warning  theme.palette.info  theme.palette.success

// Utilities, not colors — these are FUNCTIONS on the palette:
theme.palette.getContrastText('#0b5fff')  // -> a readable text color for that bg
theme.palette.augmentColor({ main: '#0b5fff' })  // -> fills in light/dark/contrastText

// Tuning knobs for the derivation above:
theme.palette.tonalOffset        // 0.2  — how far light/dark sit from main
theme.palette.contrastThreshold  // 3    — min contrast ratio getContrastText targets

theme.palette.grey       // { 50, 100, ..., 900, A100, A200, A400, A700 }
theme.palette.common     // { black: '#000', white: '#fff' }
theme.palette.divider    // 'rgba(0, 0, 0, 0.12)'
theme.palette.action     // { active, hover, hoverOpacity, selected, disabled,
                         //   disabledBackground, focus, ... }`}
      </CodeBlock>

      <InfoBox variant="tip" title="palette.action is the one people re-invent by hand">
        Hover and selected states across the whole library read from{' '}
        <code>theme.palette.action.hover</code> and <code>theme.palette.action.selected</code>. Using
        those in your own <code>makeStyles</code> rules is what makes a custom row or card feel like it
        belongs next to a real <code>ListItem</code> — and it is the difference between a hover state
        that follows your theme into dark mode and one that is a hardcoded grey forever.
      </InfoBox>

      <h3>typography</h3>

      <CodeBlock language="js" title="theme.typography — verified" showLineNumbers>
{`// Object.keys(theme.typography):
//   fontFamily, fontSize, fontWeightLight, fontWeightRegular,
//   fontWeightMedium, fontWeightBold, htmlFontSize, pxToRem, round,
//   h1, h2, h3, h4, h5, h6, subtitle1, subtitle2,
//   body1, body2, button, caption, overline

theme.typography.fontFamily   // '"Roboto", "Helvetica", "Arial", sans-serif'
theme.typography.fontSize     // 14
theme.typography.htmlFontSize // 16  — what MUI assumes the <html> font-size is

theme.typography.button
// {
//   fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
//   fontWeight: 500,
//   fontSize: '0.875rem',
//   lineHeight: 1.75,
//   letterSpacing: '0.02857em',
//   textTransform: 'uppercase'      <- THE one everybody overrides
// }

// Each variant is a complete style object, so you can spread it into a rule:
const useStyles = makeStyles((theme) => ({
  heading: { ...theme.typography.h6, color: theme.palette.text.primary },
}));

// pxToRem converts against htmlFontSize — use it instead of hardcoding rems:
theme.typography.pxToRem(24)   // '1.5rem'`}
      </CodeBlock>

      <InfoBox variant="note" title="If you changed the root font size, tell MUI">
        A CSS reset that sets <code>html &#123; font-size: 62.5% &#125;</code> (the old
        &quot;1rem = 10px&quot; trick) silently shrinks every MUI component, because MUI sizes
        everything in <code>rem</code> against an assumed 16px root. The fix is{' '}
        <code>typography: &#123; htmlFontSize: 10 &#125;</code> so <code>pxToRem</code> and every
        built-in variant recompute against your actual root.
      </InfoBox>

      <h3>spacing — a function, not a number</h3>
      <p>
        You configure <code>spacing</code> as a number (the base unit, default <strong>8</strong>), but
        you <em>read</em> it as a function. The return type changes with the argument count, which is
        the part that surprises people:
      </p>

      <CodeBlock language="js" title="theme.spacing() — verified return values" showLineNumbers>
{`// Configured as a number:
createMuiTheme({ spacing: 8 });   // 8 is also the default

// Read as a function. ONE argument -> a NUMBER (unitless):
theme.spacing()      // 8       (no argument == spacing(1))
theme.spacing(2)     // 16
theme.spacing(0.5)   // 4       (fractions are fine)

// TWO OR MORE arguments -> a STRING with px units, CSS-shorthand order:
theme.spacing(1, 2)        // '8px 16px'
theme.spacing(1, 2, 3, 4)  // '8px 16px 24px 32px'

// Why that matters in practice:
{ padding: theme.spacing(2) }           // padding: 16      -> JSS adds 'px'. Fine.
{ padding: theme.spacing(1, 2) }        // padding: '8px 16px'      Fine.
{ padding: theme.spacing(2) + 4 }       // 20               Fine (number math).
{ padding: theme.spacing(1, 2) + 4 }    // '8px 16px4'      BROKEN — string concat.

// You can also pass a function for a non-linear scale:
createMuiTheme({ spacing: (factor) => [0, 4, 8, 16, 32, 64][factor] });`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why JSS lets you write a bare number">
        <code>&#123; padding: 16 &#125;</code> compiles to <code>padding: 16px</code> because JSS
        appends <code>px</code> to unitless numbers for length properties. It correctly leaves{' '}
        <code>zIndex</code>, <code>flexGrow</code>, <code>opacity</code>, <code>lineHeight</code> and
        friends alone. This is why the one-argument form returning a number is convenient rather than
        broken.
      </InfoBox>

      <h3>breakpoints</h3>

      <CodeBlock language="js" title="theme.breakpoints — verified values and output" showLineNumbers>
{`theme.breakpoints.values
// { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 }
//   ^ note: v5 changed these defaults (sm:600, md:900, lg:1200, xl:1536)

theme.breakpoints.keys   // ['xs', 'sm', 'md', 'lg', 'xl']

// Each helper returns a MEDIA QUERY STRING, which you use as an object key:
theme.breakpoints.up('sm')            // '@media (min-width:600px)'
theme.breakpoints.down('sm')          // '@media (max-width:959.95px)'   <- !!
theme.breakpoints.down('md')          // '@media (max-width:1279.95px)'  <- !!
theme.breakpoints.down('xl')          // '@media (min-width:0px)'        <- !!
theme.breakpoints.between('sm','md')  // '@media (min-width:600px) and (max-width:1279.95px)'
theme.breakpoints.only('sm')          // '@media (min-width:600px) and (max-width:959.95px)'`}
      </CodeBlock>

      <InfoBox variant="danger" title="The v4 down() off-by-one — read this twice">
        <p>
          In v4, <code>down(key)</code> means <strong>&quot;this breakpoint and everything
          below&quot;</strong>. It resolves to the <em>next</em> breakpoint&apos;s value minus 0.05px,
          not the key&apos;s own value.
        </p>
        <p>
          So <code>down(&apos;sm&apos;)</code> is <strong>max-width 959.95px</strong> — it covers the
          whole <code>sm</code> range <em>and</em> the <code>md</code> range up to <code>lg</code>. If
          you read it as &quot;below 600px&quot; you have just applied your mobile styles to tablets
          and small laptops. Nearly everyone gets this wrong once.
        </p>
        <p>
          <strong>v5 changed the meaning</strong> to the intuitive one: <code>down(key)</code> is
          strictly below the key&apos;s own value. Identical code, different rendering — which makes
          this one of the genuinely dangerous items in a v4-to-v5 migration, because nothing errors and
          nothing warns.
        </p>
        <CodeBlock language="js" title="Same call, two versions">
{`theme.breakpoints.down('sm')
//   v4: '@media (max-width:959.95px)'   -> phones AND tablets
//   v5: '@media (max-width:599.95px)'   -> phones only`}
        </CodeBlock>
        <p>
          There is also a special case, verified: <code>down(&apos;xl&apos;)</code> returns{' '}
          <code>&apos;@media (min-width:0px)&apos;</code> — there is no breakpoint above{' '}
          <code>xl</code>, so it degrades to &quot;always true&quot; rather than to a max-width. A rule
          nested under it applies at every size.
        </p>
        <p>
          <code>between(&apos;sm&apos;, &apos;md&apos;)</code> is inclusive of the end key for the same
          reason — it reaches 1279.95px, the top of <code>md</code>, not the start of it. If you want a
          single band, <code>only(&apos;sm&apos;)</code> says exactly that and cannot be misread.
        </p>
        <p>
          <strong>Practical rule for v4:</strong> prefer <code>up()</code> and write mobile-first. Its
          meaning is identical in both versions, so it is the only one of these that survives a
          migration untouched.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Breakpoints inside makeStyles" showLineNumbers>
{`const useStyles = makeStyles((theme) => ({
  sidebar: {
    width: '100%',
    // The media-query string is used as a computed object KEY:
    [theme.breakpoints.up('md')]: {
      width: 280,
      position: 'sticky',
      top: theme.spacing(2),
    },
    [theme.breakpoints.up('lg')]: {
      width: 320,
    },
  },
}));`}
      </CodeBlock>

      <h3>shape, zIndex, transitions</h3>

      <CodeBlock language="js" title="The three small ones — verified defaults" showLineNumbers>
{`// --- shape: one key. The global corner radius. ---
theme.shape.borderRadius        // 4

// --- zIndex: the stacking contract. Never hardcode against these. ---
theme.zIndex
// { mobileStepper: 1000, speedDial: 1050, appBar: 1100, drawer: 1200,
//   modal: 1300, snackbar: 1400, tooltip: 1500 }
//
// Your sticky header must sit under the Drawer? Use theme.zIndex.drawer - 1.
// Above the AppBar?  theme.zIndex.appBar + 1.  Written this way, raising a
// value in the theme keeps every relationship intact.

// --- transitions: durations, easings, and a builder. ---
theme.transitions.duration
// { shortest: 150, shorter: 200, short: 250, standard: 300, complex: 375,
//   enteringScreen: 225, leavingScreen: 195 }

theme.transitions.easing
// { easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
//   easeOut:   'cubic-bezier(0.0, 0, 0.2, 1)',
//   easeIn:    'cubic-bezier(0.4, 0, 1, 1)',
//   sharp:     'cubic-bezier(0.4, 0, 0.6, 1)' }

theme.transitions.create(['background-color'], {
  duration: theme.transitions.duration.short,
});
// -> 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'   (verified)

theme.transitions.getAutoHeightDuration(200)  // duration scaled to a height`}
      </CodeBlock>

      <h3>direction, mixins, shadows</h3>

      <CodeBlock language="js" title="The remaining three — verified" showLineNumbers>
{`theme.direction     // 'ltr'  — set to 'rtl' for right-to-left layouts

theme.shadows       // an array of 25 CSS box-shadow strings, index 0 = 'none'.
                    // Elevation props map straight into it:
                    // <Paper elevation={3} />  uses  theme.shadows[3]

theme.mixins.toolbar
// { minHeight: 56,
//   '@media (min-width:0px) and (orientation: landscape)': { minHeight: 48 },
//   '@media (min-width:600px)': { minHeight: 64 } }
//
// Spread this to offset content below a fixed AppBar at every size — this is
// the correct fix for "my first row is hidden under the header":
const useStyles = makeStyles((theme) => ({
  offset: theme.mixins.toolbar,
}));`}
      </CodeBlock>

      <h3>overrides and props</h3>
      <p>
        The last two top-level keys both default to an empty object (<code>&#123;&#125;</code>,
        verified) and both are about changing MUI&apos;s <em>own</em> components globally rather than
        styling yours:
      </p>

      <CodeBlock language="js" title="Where they sit — the deep dive is the next lesson">
{`createMuiTheme({
  // overrides: CSS applied to a component's internal slots, app-wide.
  //            Keyed by component name, then by that component's rule name.
  overrides: {
    MuiButton: {
      root:  { borderRadius: 8 },
      label: { fontWeight: 600 },
    },
  },

  // props: DEFAULT PROP VALUES for a component, app-wide. No CSS involved.
  props: {
    MuiButton:    { disableElevation: true, variant: 'contained' },
    MuiTextField: { variant: 'outlined', size: 'small' },
  },
});`}
      </CodeBlock>

      <InfoBox variant="info" title="Covered properly in the next lesson">
        <p>
          These two keys are how you stop writing the same <code>makeStyles</code> override in fifteen
          files. They get a lesson of their own —{' '}
          <a href="/mui/overrides">Overriding Component Styles</a> — including how to find a
          component&apos;s rule names, and how <code>overrides</code> interacts with the specificity
          problem from the previous lesson.
        </p>
        <p>
          One forward-looking note: v5 collapsed both keys into a single{' '}
          <code>theme.components</code> entry, where the old <code>overrides</code> content moves under{' '}
          <code>styleOverrides</code> and the old <code>props</code> content moves under{' '}
          <code>defaultProps</code>.
        </p>
      </InfoBox>

      <h2>Three Ways To Read the Theme</h2>
      <p>
        All three pull from the same context. Which one you reach for is decided by what you are doing
        with the value, not by preference.
      </p>

      <CodeBlock language="jsx" title="1. The theme callback in makeStyles — for STYLING" showLineNumbers>
{`// The default and correct choice whenever the theme value ends up in CSS.
// No extra hook call, and the resulting CSS is cached per theme rather than
// recomputed on every render.
const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    color: theme.palette.text.primary,
    borderRadius: theme.shape.borderRadius,
    transition: theme.transitions.create('background-color'),
  },
}));`}
      </CodeBlock>

      <CodeBlock language="jsx" title="2. useTheme() — for LOGIC" showLineNumbers>
{`import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';

function Layout() {
  const theme = useTheme();

  // The real reason useTheme exists: you need a theme value in JavaScript,
  // not in a style rule.
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));

  return isMobile ? <MobileNav /> : <DesktopNav />;
}

// Also legitimate: passing a theme value to a non-MUI API.
const theme = useTheme();
<Chart strokeColor={theme.palette.primary.main} />   // a chart lib wanting a hex

// NOT the right use: reading the theme just to build an inline style object.
// That recomputes the object every render and loses JSS caching.
// 🔴 <div style={{ padding: theme.spacing(2) }} />
// 🟢 put it in makeStyles instead.`}
      </CodeBlock>

      <InfoBox variant="warning" title="useTheme has the same default-theme trap as makeStyles">
        Import it from <code>@material-ui/core/styles</code>, not <code>@material-ui/styles</code>. The
        core re-export is pre-wired with MUI&apos;s default theme, so it still returns a real object
        when no <code>ThemeProvider</code> is mounted above. The standalone package&apos;s version
        returns <code>null</code>, and your next line — <code>theme.spacing(2)</code> — throws.
      </InfoBox>

      <CodeBlock language="jsx" title="3. withTheme — for CLASS COMPONENTS" showLineNumbers>
{`import { withTheme } from '@material-ui/core/styles';

// The HOC form, for the same reason withStyles exists: classes cannot call hooks.
class Chart extends React.Component {
  render() {
    const { theme } = this.props;   // injected as a 'theme' prop
    return <svg stroke={theme.palette.primary.main} />;
  }
}
export default withTheme(Chart);

// Composing both, when a class needs styles AND raw theme values:
export default withStyles(styles)(withTheme(Chart));`}
      </CodeBlock>

      <h2>Theme Nesting</h2>
      <p>
        <code>ThemeProvider</code> can be nested to give a subtree different values — an inverted
        header, a preview pane, a branded checkout flow. But <strong>how</strong> you pass the inner
        theme decides whether the outer one survives, and the object form is a trap.
      </p>

      <CodeBlock language="jsx" title="Object form vs function form" showLineNumbers>
{`// 🔴 OBJECT FORM — this is a SHALLOW merge. Verified in v4's ThemeProvider
//    source, which does the equivalent of: { ...outerTheme, ...localTheme }
<ThemeProvider theme={outerTheme}>
  <ThemeProvider theme={{ palette: { primary: { main: 'red' } } }}>
    {/* palette is REPLACED wholesale, not merged. Everything else in the
        outer palette — text, background, error, grey, action, type — is
        gone, and so are the derived light/dark/contrastText for primary.
        theme.palette.text.primary is now undefined. */}
  </ThemeProvider>
</ThemeProvider>

// 🟢 FUNCTION FORM — you receive the outer theme and return the full inner one.
<ThemeProvider theme={outerTheme}>
  <ThemeProvider theme={(outer) => createMuiTheme({
    ...outer,
    palette: { ...outer.palette, primary: { main: 'red' } },
  })}>
    <Checkout />
  </ThemeProvider>
</ThemeProvider>

// Re-running createMuiTheme is what re-derives primary.light / .dark /
// .contrastText for the new main color. A raw spread would leave the OLD
// derived values sitting next to the new main, which renders as unreadable
// button text — a genuinely confusing bug to look at.`}
      </CodeBlock>

      <InfoBox variant="note" title="A guard rail in the source">
        v4&apos;s <code>ThemeProvider</code> logs a console error if you pass the function form with no
        outer theme present (<em>&quot;However, no outer theme is present&quot;</em>) — the function
        would be called with <code>null</code>. The function form is only valid <em>inside</em> another{' '}
        <code>ThemeProvider</code>; at the app root, pass an object.
      </InfoBox>

      <h2>Dark Mode via palette.type</h2>
      <p>
        v4 spells it <code>palette.type</code>. Setting it to <code>&apos;dark&apos;</code> flips
        MUI&apos;s default text and background colors and changes how components derive their surface
        shades.
      </p>

      <CodeBlock language="jsx" title="A working light/dark toggle" showLineNumbers>
{`import { useMemo, useState } from 'react';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import useMediaQuery from '@material-ui/core/useMediaQuery';

function App() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDark ? 'dark' : 'light');

  // useMemo matters here: a new theme object identity invalidates every JSS
  // sheet downstream, so rebuilding it on each render is expensive.
  const theme = useMemo(() => createMuiTheme({
    palette: {
      type: mode,                        // 'light' | 'dark'
      primary: { main: '#0b5fff' },
      // Optional: override the defaults MUI picks for dark mode.
      ...(mode === 'dark' && {
        background: { default: '#0f1117', paper: '#1a1d2e' },
      }),
    },
  }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />   {/* required — this is what paints <body> */}
      <Toggle onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} />
    </ThemeProvider>
  );
}`}
      </CodeBlock>

      <CodeBlock language="js" title="What type: 'dark' actually changes — verified" showLineNumbers>
{`createMuiTheme({ palette: { type: 'dark' } })

  palette.type                // 'dark'
  palette.background          // { paper: '#424242', default: '#303030' }
  palette.text.primary        // '#fff'

// versus the light default:
  palette.background          // { paper: '#fff', default: '#fafafa' }
  palette.text.primary        // 'rgba(0, 0, 0, 0.87)'`}
      </CodeBlock>

      <InfoBox variant="danger" title="palette.mode fails SILENTLY in v4">
        <p>
          v5 renamed <code>palette.type</code> to <code>palette.mode</code>. Write the v5 name in a v4
          app — copied from a Stack Overflow answer, or from muscle memory after working in a newer
          codebase — and <strong>nothing happens and nothing warns</strong>. Verified on 4.12.4:
        </p>
        <CodeBlock language="js" title="The silent failure">
{`createMuiTheme({ palette: { mode: 'dark' } })

  palette.type        // 'light'        <- unchanged, your key was ignored
  palette.background  // { paper: '#fff', default: '#fafafa' }   <- still light`}
        </CodeBlock>
        <p>
          The unknown <code>mode</code> key is merged onto the palette and simply never read. Your app
          stays light and there is no error to search for. If dark mode &quot;does not work&quot; in a
          v4 app, check this key first — and note that <code>CssBaseline</code> being absent produces
          the same symptom on <code>&lt;body&gt;</code> specifically.
        </p>
      </InfoBox>

      <h2>Putting It Together</h2>

      <CodeBlock language="jsx" title="A realistic v4 theme file" showLineNumbers>
{`// src/theme.js
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    type: 'light',
    primary:   { main: '#0b5fff' },
    secondary: { main: '#d81b60' },
    background: { default: '#f6f7fa' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
    h1: { fontSize: '2.5rem', fontWeight: 700 },
  },
  shape: { borderRadius: 8 },
  spacing: 8,
  breakpoints: {
    // Only override these if the design system genuinely disagrees with MUI.
    // Changing them changes every up()/down() call in the app at once.
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  // Covered in the next lesson:
  props:     { MuiButton: { disableElevation: true } },
  overrides: { MuiButton: { root: { minHeight: 40 } } },
});

export default theme;`}
      </CodeBlock>

      <InteractiveChallenge
        question={"In a v4 app you write [theme.breakpoints.down('sm')]: { flexDirection: 'column' } expecting it to apply on phones only. On a 900px-wide tablet the layout is also stacked. What happened?"}
        options={[
          "The rule needs theme.breakpoints.only('sm') because down() is not a valid media-query helper",
          "In v4, down(key) resolves to the NEXT breakpoint minus 0.05px — down('sm') is max-width:959.95px, which covers sm AND md, so a 900px tablet matches",
          "makeStyles cannot nest media queries, so the rule leaked to all widths",
          "The theme's breakpoint values were customised and sm is set to 960",
        ]}
        correctIndex={1}
        explanation={"v4's down(key) means 'this breakpoint and everything below it', implemented as the next breakpoint's value minus 0.05px. down('sm') is verifiably '@media (max-width:959.95px)', so every viewport up to 959.95px matches — phones and tablets alike. v5 redefined down() to mean strictly below the key's own value, so the identical line becomes max-width:599.95px there. Writing up() and going mobile-first sidesteps the whole issue, because up() means the same thing in both versions."}
        language="jsx"
      />

      <InteractiveChallenge
        question={"You nest <ThemeProvider theme={{ palette: { primary: { main: 'red' } } }}> inside your app's main ThemeProvider. Buttons inside turn red, but text throughout the subtree loses its color and theme.palette.text.primary is undefined. Why?"}
        options={[
          "A nested ThemeProvider always resets to MUI's default theme; only the root provider can supply a full theme",
          "The inner theme must be created with createMuiTheme or it is rejected entirely",
          "Passing an OBJECT does a shallow merge — { ...outerTheme, ...localTheme } — so the whole palette key is replaced rather than merged. Use the function form theme={outer => ...} to spread the outer palette",
          "palette.text can only be set at the root because CssBaseline reads it once at mount",
        ]}
        correctIndex={2}
        explanation={"v4's ThemeProvider merges an object theme one level deep only — its source does the equivalent of { ...outerTheme, ...localTheme }. Supplying a palette therefore replaces the outer palette entirely, taking text, background, error, grey and action with it. The function form gives you the outer theme so you can spread it: theme={outer => createMuiTheme({ ...outer, palette: { ...outer.palette, primary: { main: 'red' } } })}. Re-running createMuiTheme also matters, because it re-derives primary.light/.dark/.contrastText for the new main."}
        language="jsx"
      />

      <InfoBox variant="tip" title="Next">
        You now have the theme object and three ways to read it. The obvious next question is how to
        make a theme value apply to <em>every</em> MUI <code>Button</code> in the app without touching
        each call site — that is <code>theme.overrides</code> and <code>theme.props</code>, in{' '}
        <a href="/mui/overrides">Overriding Component Styles</a>.
      </InfoBox>

    </LessonLayout>
  );
}

export default MuiTheming;
