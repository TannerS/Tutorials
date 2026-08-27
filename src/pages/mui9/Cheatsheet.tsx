import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function Mui9Cheatsheet() {
  return (
    <LessonLayout
      title="📋 MUI v9 Cheat Sheet"
      sectionId="mui9"
      lessonIndex={4}
      prev={{ path: '/mui9/theming', label: 'Theming with CSS Variables & Color Schemes' }}
      next={null}
    >
      <p>
        Everything in this section, condensed. Every value here was read out of a real{' '}
        <code>@mui/material@9.3.1</code> install or the npm registry — not from documentation.
      </p>

      <h2>Versions</h2>
      <CodeBlock language="text" title="npm view @mui/material dist-tags">
{`latest     = 9.3.1        <- current
latest-v7  = 7.3.11
latest-v6  = 6.5.0
latest-v5  = 5.18.0

published majors: 5, 6, 7, 9     THERE IS NO 8.x
peer react:       ^17 || ^18 || ^19

@mui/styles (JSS bridge)
  latest    = 6.4.8       <- tag is BEHIND the newest stable
  latest-v6 = 6.5.0       <- highest stable
  next      = 7.0.0-beta.4
  => no stable 7 or 9. Depending on it CAPS YOU AT v6.
  => want a makeStyles-shaped API that is not capped? tss-react.`}
      </CodeBlock>

      <h2>Package Names</h2>
      <CodeBlock language="text" title="The v5 rename dates every code sample you read">
{`@material-ui/core     ->  @mui/material
@material-ui/icons    ->  @mui/icons-material
@material-ui/lab      ->  @mui/lab
@material-ui/styles   ->  @mui/styles     (bridge only, dead end)
                          @mui/system     (the sx/styled engine)

styling engine:  JSS  ->  emotion (Pigment CSS is opt-in)`}
      </CodeBlock>

      <h2>⚠️ The Silent Breaks</h2>

      <InfoBox variant="danger" title="Every one of these produced ZERO console output">
        <p>
          They compile, they run, and they mean something different than they used to. This table
          is the reason the second lesson in this section exists.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Breakpoints — the values AND the meaning of down() both changed">
{`values
  v4  {xs:0, sm:600, md:960, lg:1280, xl:1920}
  v9  {xs:0, sm:600, md:900, lg:1200, xl:1536}

down(key)  -- v4 meant "below the NEXT breakpoint", v9 means "below THIS one"
  down(sm)   v4=(max-width:959.95px)    v9=(max-width:599.95px)   <- 360px!
  down(md)   v4=(max-width:1279.95px)   v9=(max-width:899.95px)
  down(lg)   v4=(max-width:1919.95px)   v9=(max-width:1199.95px)
  down(xl)   v4=(min-width:0px)         v9=(max-width:1535.95px)

  between("sm","md")
             v4=(min-width:600px) and (max-width:1279.95px)
             v9=(min-width:600px) and (max-width:899.95px)

up() never changed meaning - only the values moved. Migrate to up().
Curiosity: down("xs") = (max-width:-0.05px), matches nothing.`}
      </CodeBlock>

      <CodeBlock language="text" title="The other five">
{`spacing()      v4: theme.spacing(2) -> 16      (number)
               v9: theme.spacing(2) -> "16px"  (string)
               => "16px" * 2 = NaN -> browser drops the declaration

Grid           v4/v5/v6:  <Grid item xs={12} md={6}>
               v7/v9:     <Grid size={{ xs: 12, md: 6 }}>
               old spelling emits NO width rule - layout silently stacks,
               and xs="6" leaks into the DOM as a dead attribute.
               v9 Grid props: children, columns, columnSpacing, container,
               direction, offset, rowSpacing, size, spacing, sx, wrap

palette        v4: palette: { type: 'dark' }
               v9: palette: { mode: 'dark' }
               wrong key = silently ignored, mode stays 'light'

theme keys     v4: overrides / props
               v9: components.X.styleOverrides / components.X.defaultProps
               WORST ONE: theme.overrides is KEPT on the object and ignored,
               so devtools shows your config while nothing is applied.

slot classes   .MuiButton-label was REMOVED ('label' in buttonClasses = false)
               a selector that matches nothing is not an error.`}
      </CodeBlock>

      <h2>Styling</h2>
      <CodeBlock language="jsx" title="Two APIs, one engine">
{`import { styled } from '@mui/material/styles';

const Panel = styled('div')({ padding: 16 });
const Themed = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  color: theme.palette.primary.main,
}));

<Box sx={{ p: 2, color: 'primary.main' }} />
<Box sx={{ width: { xs: '100%', md: '50%' } }} />   // breakpoints
// p/m are SPACING UNITS: p:2 -> padding:16px

// keep custom props out of the DOM
const Row = styled('div', {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ active }) => ({ background: active ? '#eef' : 'transparent' }));`}
      </CodeBlock>

      <CodeBlock language="text" title="Measured behaviour — 3 instances each">
{`same sx object on 3 instances    -> 1 class    (emotion dedupes identical styles)
sx with a different value each   -> 3 classes
styled() component, 3 instances  -> 1 class

=> sx does NOT create a class per element. Its cost is that the object
   literal is rebuilt and re-serialized on every render. styled()
   serializes once, at module scope.

Precedence: styled + sx MERGE INTO ONE CLASS, sx declarations last:
   .css-ru4hv0 { color:red; color:blue; }
                 ^styled     ^sx  -> sx wins by cascade order.
No specificity war, no injection-order gamble. (v4 had both.)`}
      </CodeBlock>

      <h2>Theming</h2>
      <CodeBlock language="jsx" title="Classic and CSS-variable forms">
{`// classic
createTheme({
  palette: { mode: 'dark', primary: { main: '#1976d2' } },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 99 } },
      defaultProps:   { disableRipple: true },
    },
  },
})

// CSS variables - fixes the dark-mode flash on first paint
createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: { light: true, dark: true },
})`}
      </CodeBlock>

      <CodeBlock language="text" title="colorSchemeSelector -> the selector it generates">
{`'media'   (default)       @media (prefers-color-scheme: dark)
'class'                   .dark &
'data'                    [data-dark] &
'data-mui-color-scheme'   [data-mui-color-scheme="dark"] &

*** A TOGGLE CANNOT WORK ON 'media'. ***
JS cannot override a media query - setMode runs, nothing changes.
Pick 'class' or a data strategy if your design has a switch.

theme.vars.palette.primary.main
  = var(--mui-palette-primary-main, #1976d2)
theme.vars EXISTS ONLY when cssVariables is enabled.
cssVarPrefix: 'app' -> var(--app-palette-primary-main, #1976d2)`}
      </CodeBlock>

      <h2>Defaults, Verified on 9.3.1</h2>
      <CodeBlock language="text" title="Spot-check values">
{`palette.mode                'light'      ('type' is GONE)
palette.primary.main        #1976d2
palette.background.default  #fff  (light)  /  #121212 (dark)
spacing(2)                  "16px"
breakpoints.values          {xs:0, sm:600, md:900, lg:1200, xl:1536}
zIndex.appBar               1100         (unchanged since v4)
shape.borderRadius          4
components                  {}

createMuiTheme              ABSENT (removed - it is createTheme)
makeStyles                  THROWS: "MUI: makeStyles is no longer
                            exported from @mui/material/styles."`}
      </CodeBlock>

      <h2>Dating a Codebase</h2>
      <CodeBlock language="bash" title="Fastest signals first">
{`grep -rl "@material-ui/"     # -> v4 or earlier
grep -rl "@mui/styles"       # -> v5/v6, and CAPPED at v6
grep -rl "<Grid item"        # -> v5/v6 Grid API
grep -rl "createMuiTheme"    # -> v4 spelling
grep -rl "palette.*type:"    # -> v4 spelling

npm ls @mui/material                                # what resolved
node -p "require('@mui/material/package.json').version"`}
      </CodeBlock>

      <h2>Upgrade Order</h2>
      <CodeBlock language="text" title="One major at a time; never skip">
{`0. green test suite, pinned deps, a rollback plan
1. rename @material-ui/* -> @mui/*        (codemod)
2. theme keys: overrides/props -> components, type -> mode
3. styling: makeStyles -> styled()/sx, or tss-react
   (DO NOT reach for @mui/styles - it caps you at v6)
4. v5 -> v6 -> v7: Grid item/xs -> size
5. v7 -> v9
6. LAST, and by hand: breakpoints

npx @mui/codemod@latest v5.0.0/preset-safe src/
npx @mui/codemod@latest v7.0.0/grid-props src/
npx @mui/codemod@latest v5.0.0/jss-to-tss-react src/

Codemods handle 5 of the 6 silent breaks. NOT breakpoints:
a codemod cannot know whether down('sm') meant "below 960" (the v4
behaviour you relied on) or "below sm" (what you thought you wrote).
Every call site is a judgement about design intent.`}
      </CodeBlock>

      <InfoBox variant="tip" title="If you only remember three things">
        <p>
          <strong>1.</strong> <code>down(&apos;sm&apos;)</code> moved by 360 pixels and nothing
          will tell you. <strong>2.</strong> <code>@mui/styles</code> is a one-way door that ends
          at v6. <strong>3.</strong> A dark-mode toggle requires{' '}
          <code>colorSchemeSelector</code> to be something other than the default.
        </p>
      </InfoBox>

      <h2>Section Index</h2>
      <CodeBlock language="text" title="Five lessons">
{`1. MUI v9 - Where the Library Actually Is    versions, packages, dating a codebase
2. The Breaks That Do Not Warn You           the six silent changes
3. Styling in v9 - styled() and sx           both APIs, measured
4. Theming with CSS Variables                colorSchemes, the flash, toggles
5. This cheat sheet

For v4 - makeStyles, withStyles, JSS, the classes prop - see the
separate MUI (Material UI) section at /mui/intro.`}
      </CodeBlock>
    </LessonLayout>
  );
}

export default Mui9Cheatsheet;
