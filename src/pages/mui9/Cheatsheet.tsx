import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

function Mui9Cheatsheet() {
  return (
    <GuideLayout
      title="MUI v9"
      kicker="FIELD GUIDE"
      glyph="🆕"
      tagline="Silent breaking changes, styled()/sx, and CSS-variable theming — everything read out of a real @mui/material@9.4.0 install."
      meta={['@mui/material 9.4.0', 'v4 → v9 breaking changes', '11 panels']}
      page="1 / 1"
      footer="Every figure here came from running the code or reading dist-tags, not from documentation. For v4's makeStyles/withStyles/JSS/classes, see the separate MUI (Material UI) section at /mui/intro."
      prev={{ path: '/mui9/theming', label: 'Theming with CSS Variables & Color Schemes' }}
      next={null}
    >
      <GuidePanel n={1} title="Where the Library Actually Is" accent="blue" glyph="📦" span={2}>
        <GuideCode>{`latest     = 9.4.0        <- current
latest-v7  = 7.3.11
latest-v6  = 6.5.0
latest-v5  = 5.18.0

published majors: 5, 6, 7, 9     THERE IS NO 8.x
peer react:        ^17 || ^18 || ^19`}</GuideCode>
        <GuideDefs
          items={[
            ['@material-ui/core', '→ @mui/material'],
            ['@material-ui/icons', '→ @mui/icons-material'],
            ['@material-ui/lab', '→ @mui/lab'],
            ['@material-ui/styles', '→ @mui/styles — bridge only, a dead end'],
            ['@mui/system', 'the sx/styled engine'],
            ['styling engine', 'JSS → emotion (Pigment CSS is opt-in)'],
          ]}
        />
        <GuideRules
          items={[
            '@mui/styles dist-tags: latest=6.4.8 (behind), latest-v6=6.5.0 (highest stable), next=7.0.0-beta.4 — no stable 7 or 9. Depending on it CAPS YOU AT v6.',
            'Want a makeStyles-shaped API that is not capped? Reach for tss-react instead.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={2} title="⚠ Breakpoints — The Big One" accent="red" glyph="📐" span={2}>
        <GuideTable
          head={['Breakpoint', 'v4 value', 'v9 value']}
          rows={[
            ['xs', '0', '0'],
            ['sm', '600', '600'],
            ['md', '960', '900'],
            ['lg', '1280', '1200'],
            ['xl', '1920', '1536'],
          ]}
        />
        <GuideCode>{`down(key) -- v4 meant "below the NEXT breakpoint", v9 means "below THIS one"
down(sm)   v4=(max-width:959.95px)    v9=(max-width:599.95px)   <- 360px!
down(md)   v4=(max-width:1279.95px)   v9=(max-width:899.95px)
down(lg)   v4=(max-width:1919.95px)   v9=(max-width:1199.95px)
down(xl)   v4=(min-width:0px)         v9=(max-width:1535.95px)

between("sm","md")
  v4=(min-width:600px) and (max-width:1279.95px)
  v9=(min-width:600px) and (max-width:899.95px)`}</GuideCode>
        <GuideRules
          items={[
            'up() never changed meaning — only the values moved. Migrate to up().',
            'down("xs") = (max-width:-0.05px) on both v4 and v9 — matches nothing.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={3} title="⚠ The Other Five Silent Breaks" accent="red" glyph="🤫" span={2}>
        <GuideDefs
          items={[
            ['spacing()', 'v4: theme.spacing(2) → 16 (number). v9: → "16px" (string) — "16px" * 2 = NaN, the browser drops the declaration.'],
            ['Grid API', 'v5/v6: <Grid item xs={12} md={6}>. v7/v9: <Grid size={{ xs: 12, md: 6 }}>. Old spelling emits NO width rule — layout silently stacks, and xs="6" leaks into the DOM as a dead attribute.'],
            ['palette.mode', "v4: palette:{type:'dark'}. v9: palette:{mode:'dark'}. Wrong key is silently ignored — mode stays 'light'."],
            ['theme keys', 'v4: overrides/props. v9: components.X.styleOverrides/defaultProps. theme.overrides is KEPT on the object and ignored — devtools shows your config while nothing applies.'],
            ['slot classes', ".MuiButton-label was REMOVED ('label' in buttonClasses = false). A selector that matches nothing is not an error."],
          ]}
        />
        <GuideRules items={['v9 Grid props: children, columns, columnSpacing, container, direction, offset, rowSpacing, size, spacing, sx, wrap.']} />
      </GuidePanel>

      <GuidePanel n={4} title="styled() & sx — Two APIs, One Engine" accent="purple" glyph="🎨">
        <GuideCode>{`import { styled } from '@mui/material/styles';

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
})(({ active }) => ({ background: active ? '#eef' : 'transparent' }));`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={5} title="Measured: Class Generation & Precedence" accent="cyan" glyph="🔬">
        <GuideCode>{`same sx object on 3 instances    -> 1 class    (emotion dedupes identical styles)
sx with a different value each   -> 3 classes
styled() component, 3 instances  -> 1 class`}</GuideCode>
        <GuideRules
          items={[
            'sx does NOT create a class per element. Its cost is the object literal being rebuilt and re-serialized every render — styled() serializes once, at module scope.',
            'styled + sx MERGE INTO ONE CLASS, sx declarations last: .css-x { color:red; color:blue; } — sx wins by cascade order, not a specificity or injection-order gamble (v4 had both).',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={6} title="Theming — Classic & CSS Variables" accent="green" glyph="🎭">
        <GuideCode>{`// classic
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
})`}</GuideCode>
        <GuideDefs
          items={[
            ['theme.vars.palette.primary.main', '= var(--mui-palette-primary-main, #1976d2)'],
            ['theme.vars', 'EXISTS ONLY when cssVariables is enabled'],
            ["cssVarPrefix: 'app'", '→ var(--app-palette-primary-main, #1976d2)'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={7} title="colorSchemeSelector → Generated Selector" accent="amber" glyph="🌓">
        <GuideTable
          head={['colorSchemeSelector', 'Generates']}
          rows={[
            ["'media' (default)", '@media (prefers-color-scheme: dark)'],
            ["'class'", '.dark &'],
            ["'data'", '[data-dark] &'],
            ["'data-mui-color-scheme'", '[data-mui-color-scheme="dark"] &'],
          ]}
        />
        <GuideRules
          items={[
            "A TOGGLE CANNOT WORK ON 'media'. JS cannot override a media query — setMode runs, nothing changes.",
            "Pick 'class' or a data strategy if the design has a switch.",
          ]}
        />
      </GuidePanel>

      <GuidePanel n={8} title="Defaults, Verified on 9.4.0" accent="blue" glyph="✅">
        <GuideDefs
          items={[
            ['palette.mode', "'light' ('type' is GONE)"],
            ['palette.primary.main', '#1976d2'],
            ['palette.background.default', '#fff (light) / #121212 (dark)'],
            ['spacing(2)', '"16px"'],
            ['breakpoints.values', '{xs:0, sm:600, md:900, lg:1200, xl:1536}'],
            ['zIndex.appBar', '1100 (unchanged since v4)'],
            ['shape.borderRadius', '4'],
            ['createMuiTheme', 'ABSENT — removed, it is createTheme'],
            ['makeStyles', 'THROWS: "MUI: makeStyles is no longer exported from @mui/material/styles."'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={9} title="Dating a Codebase" accent="pink" glyph="🕵️">
        <GuideCode>{`grep -rl "@material-ui/"     # -> v4 or earlier
grep -rl "@mui/styles"       # -> v5/v6, and CAPPED at v6
grep -rl "<Grid item"        # -> v5/v6 Grid API
grep -rl "createMuiTheme"    # -> v4 spelling
grep -rl "palette.*type:"    # -> v4 spelling

npm ls @mui/material                                # what resolved
node -p "require('@mui/material/package.json').version"`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={10} title="Upgrade Order" accent="cyan" glyph="🪜" span={2}>
        <GuideCode>{`0. green test suite, pinned deps, a rollback plan
1. rename @material-ui/* -> @mui/*        (codemod)
2. theme keys: overrides/props -> components, type -> mode
3. styling: makeStyles -> styled()/sx, or tss-react
   (DO NOT reach for @mui/styles - it caps you at v6)
4. v5 -> v6 -> v7: Grid item/xs -> size
5. v7 -> v9
6. LAST, and by hand: breakpoints

npx @mui/codemod@latest v5.0.0/preset-safe src/
npx @mui/codemod@latest v7.0.0/grid-props src/
npx @mui/codemod@latest v5.0.0/jss-to-tss-react src/`}</GuideCode>
        <GuideRules
          items={[
            'Codemods handle 5 of the 6 silent breaks. NOT breakpoints: a codemod cannot know whether down(\'sm\') meant "below 960" (the v4 behaviour you relied on) or "below sm" (what you thought you wrote). Every call site is a judgement about design intent.',
          ]}
        />
      </GuidePanel>

      <GuidePanel n={11} title="If You Only Remember Three Things" accent="amber" glyph="💡">
        <GuideRules
          items={[
            "down('sm') moved by 360 pixels and nothing will tell you.",
            '@mui/styles is a one-way door that ends at v6.',
            'A dark-mode toggle requires colorSchemeSelector to be something other than the default.',
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}

export default Mui9Cheatsheet;
