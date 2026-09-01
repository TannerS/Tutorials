import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function MuiCheatsheet() {
  return (
    <GuideLayout
      title="MUI v4"
      kicker="FIELD GUIDE"
      glyph="🧩"
      tagline="Material-UI v4 (makeStyles / withStyles / theme overrides) and the migration path onto v5's styled() and sx."
      meta={['@material-ui/core 4.12.4', '@mui/material 5.18.0', '16 panels']}
      page="1 / 1"
      footer="Every import path, API name, theme key and error string here was read off a real install — @material-ui/core 4.12.4, @mui/material 5.18.0/9.3.1, @mui/styles 5.18.0. The five lessons before this one carry the reasoning; this page is the recall sheet."
      prev={{ path: '/mui/styled-v5', label: 'v5 and Beyond — styled() and sx' }}
      next={null}
    >
      <GuidePanel n={1} title="Version Reality & the Migration Route" accent="blue" glyph="🧭" span={2}>
        <GuideCode>{`@material-ui/core   latest = 4.12.4        <- final v4; your codebase
@mui/material       latest = 9.3.1         <- CURRENT (v9 stable)
                    latest-v7 = 7.3.11, latest-v6 = 6.5.0, latest-v5 = 5.18.0
@mui/styles         6.5.0 highest stable   <- JSS bridge; ENDS HERE

# There is no 8.x. The version list goes 7.3.11 -> 9.0.0-alpha.0.
# Migration route: v4 -> v5 (the real work) -> v6 -> v7 -> v9.
# Do not attempt v4 -> v9 directly.`}</GuideCode>
        <GuideRules items={[
          '@mui/styles caps you at 6.5.0 — it keeps JSS alive.',
          'The v9 translation tables live in the mui9 field guide, not here.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Import Translation" accent="purple" glyph="📦">
        <GuideTable
          head={['v4', 'v5 → v9']}
          rows={[
            ['@material-ui/core', '@mui/material'],
            ['@material-ui/core/styles', '@mui/material/styles'],
            ['@material-ui/icons', '@mui/icons-material'],
            ['@material-ui/lab', '@mui/lab'],
            ['@material-ui/styles', '@mui/styles — bridge only, stops at 6.5.0'],
            ['— (JSS bundled)', '@emotion/react + @emotion/styled — peer deps'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={3} title="The Swap — Uninstall, Install, Codemods" accent="green" glyph="🔧">
        <GuideCode>{`npm uninstall @material-ui/core @material-ui/icons @material-ui/lab
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

npx @mui/codemod@latest v5.0.0/preset-safe src/     # ~40 transforms, run ONCE
npx @mui/codemod@latest v5.0.0/variant-prop src/

# preset-safe does NOT touch makeStyles — pick one:
npx @mui/codemod@latest v5.0.0/jss-to-styled src/   # -> styled()
npx @mui/codemod@latest v5.0.0/jss-to-tss-react src/ # -> tss-react`}</GuideCode>
        <GuideRules items={[
          "jss-to-styled's own README: it raises CSS specificity to reach nested children — run it after the other breaking changes, read every diff.",
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="API Translation" accent="amber" glyph="🔄" span={2}>
        <GuideTable
          head={['v4', 'v5 → v9', 'Note']}
          rows={[
            ['makeStyles(styles)', 'styled(Cmp)(fn)', 'Throws if imported from @mui/material/styles. Returns a component, not a hook.'],
            ['withStyles(styles)(Cmp)', 'styled(Cmp)(fn)', 'Same throw.'],
            ['createMuiTheme()', 'createTheme()', '4.12 already exports createTheme as an alias — free rename on v4.'],
            ['createStyles()', 'Not needed', 'Existed only to fix TS widening in makeStyles.'],
            ['MuiThemeProvider', 'ThemeProvider', 'v4 exports both names already.'],
            ['StylesProvider injectFirst', 'StyledEngineProvider injectFirst', 'Same job, emotion instead of JSS.'],
            ["'&$disabled'", "'&.Mui-disabled'", 'No empty rule, no classes threading — just a selector.'],
            ['classes prop', 'classes prop', 'Unchanged. Still works, still typed by slot.'],
            ['—', 'sx prop', 'New. On every component.'],
            ['—', 'shouldForwardProp', 'New obligation — styling props leak to the DOM unless filtered.'],
            ["<Grid item xs={6}>", 'Grid (v2 layout)', 'Old grid lived on as GridLegacy; removed in v9.'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={5} title="Theme Key Translation" accent="pink" glyph="🎨">
        <GuideTable
          head={['v4 key', 'v5 → v9 key']}
          rows={[
            ['overrides.MuiButton.root', 'components.MuiButton.styleOverrides.root'],
            ['props.MuiButton', 'components.MuiButton.defaultProps'],
            ["palette.type: 'dark'", "palette.mode: 'dark'"],
            ['—', 'components.MuiButton.variants[] (new)'],
            ['theme.mixins.gutters()', 'Removed — inline the padding, or use sx'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={6} title="The Silent Killer" accent="red" glyph="⚠️">
        <GuideRules items={[
          'createTheme does NOT validate top-level keys. Leave overrides or props in place and there is no error, no warning, and no styling.',
          'Verified: at 5.18.0 and 9.3.1 the constructed theme has neither key — they ride along as inert data nothing reads.',
          'Grep your theme file for both words before calling a migration done.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Theme Shape — v4" accent="cyan" glyph="🏗️">
        <GuideCode>{`createMuiTheme({
  palette: { type: 'light', primary: { main: '#3f51b5' } },
  spacing: 8,                     // theme.spacing(2) === '16px'

  overrides: {                    // STYLES, keyed by CSS API slot
    MuiButton: {
      root: { textTransform: 'none' },
      label: { fontWeight: 600 }, // 'label' slot: v4 only
    },
  },
  props: {                        // DEFAULT PROPS, no styling
    MuiButton: { disableRipple: true },
  },
});`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={8} title="Theme Shape — v5 → v9" accent="blue" glyph="🏗️" span={2}>
        <GuideCode>{`createTheme({
  palette: { mode: 'light', primary: { main: '#1976d2' } },
  spacing: 8,

  components: {                   // ONE key, three sub-keys
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none' } },
      defaultProps: { disableRipple: true },
      variants: [{ props: { variant: 'dashed' }, style: { border: '2px dashed' } }],
    },
  },
});

// The escape hatch during migration — moves props -> defaultProps and
// overrides -> styleOverrides. Warns on every call. Does NOT translate the
// CSS inside, so an override targeting a slot v5 deleted (label) is copied
// faithfully into a key nothing reads. Scaffolding, not a migration.
import { adaptV4Theme } from '@mui/material/styles';
const theme = createTheme(adaptV4Theme(legacyThemeObject));`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={9} title="The v4 CSS-API-Slot Recipe" accent="purple" glyph="🧩" span={2}>
        <GuideCode>{`const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: 24,
    '&$disabled': { opacity: 0.4 },   // $ = "the generated name of
  },                                  //   the rule 'disabled' in THIS sheet"
  label: { fontWeight: 700 },
  disabled: {},                       // empty rule REQUIRED — it is what
}));                                  // $disabled resolves to

function Save() {
  const classes = useStyles();
  return (
    <Button
      classes={{ root: classes.root, label: classes.label, disabled: classes.disabled }}
    >   {/* every slot styled must be passed, or its selector matches nothing */}
      Save
    </Button>
  );
}

/* Verified emitted CSS:
   .makeStyles-root-1.makeStyles-disabled-2  { opacity: .4 }   (0,2,0)
   MUI's opponent: .MuiButton-root.Mui-disabled                (0,2,0)
   Dev class names: makeStyles-<rule>-<n>   Prod: jss<n>
   MUI's own names are stable in both — never selector on your generated one. */`}</GuideCode>
        <GuideRules items={[
          "Fastest slot lookup: pass a deliberately wrong classes key once. The console error prints the component's complete slot list, every time.",
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Global State Classes" accent="green" glyph="🌐">
        <GuideDefs
          items={[
            ['8 pseudo-slots', 'checked, disabled, error, focused, focusVisible, required, expanded, selected'],
            ['compile to', 'SHORT GLOBAL names: Mui-checked, Mui-disabled, Mui-error...'],
            ['everything else', 'per-component: MuiButton-root, MuiChip-label, ...'],
          ]}
        />
        <GuideRules items={['Verified identical at 4.12.4 and 9.3.1 — safe to target in either major.']} />
      </GuidePanel>

      <GuidePanel n={11} title="Specificity — Hatches, Ladder & the Import-Order Gotcha" accent="amber" glyph="🪜" span={2}>
        <GuideTable
          head={['Hatch', 'Emits', 'Cost']}
          rows={[
            ["'&&': { ... }", '.x.x — (0,2,0)', 'Low'],
            ["'& .MuiButton-root'", '.x .MuiButton-root — (0,2,0)', 'Moderate'],
            ['StylesProvider injectFirst', "moves MUI's <style> tags to the top of head", 'App-wide'],
            ['!important', 'a higher cascade layer', 'High — kills every future state style on that property'],
          ]}
        />
        <GuideRules items={[
          'Ties are broken by SOURCE ORDER in the stylesheet — later wins, not the order of names in class="...".',
          "v4 only: every makeStyles/withStyles call takes its injection index from a module-level counter, at module evaluation time. Requiring the component before calling makeStyles flips who wins a tie — same styles, opposite outcome in dev vs. a production build.",
          'Emotion has no injection counter, so v5+ does not have this failure mode at all.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Which Override Mechanism Do I Want?" accent="pink" glyph="🧭" span={2}>
        <GuideTable
          head={['Situation', 'v4', 'v5 → v9']}
          rows={[
            ['Flat properties, one call site', 'className', 'sx prop'],
            ['An inner element (label, icon)', 'classes prop + slot', 'classes / slotProps / descendant selector'],
            ['A state — hover, focus, disabled', "classes + '&$disabled' + empty rule", "'&.Mui-disabled'"],
            ['Every instance in the app', 'theme overrides.MuiX', 'theme components.MuiX.styleOverrides'],
            ['Default prop everywhere', 'theme props.MuiX', 'theme components.MuiX.defaultProps'],
            ['A recurring kind of component', 'Wrap it once', 'styled(Cmp), or theme variants[]'],
            ['Styles depend on a custom prop', 'useStyles(props)', 'styled + shouldForwardProp'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={13} title="styled() — the v5+ Signature" accent="cyan" glyph="🎯">
        <GuideCode>{`import { styled } from '@mui/material/styles';

const Fancy = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'accent',  // keep it off the DOM
  name: 'AppFancyButton',
  overridesResolver: (props, styles) => styles.root,
})(({ theme, accent }) => ({
  backgroundColor: accent,
  '&.Mui-disabled': { opacity: 0.4 },
  '& .MuiChip-label': { paddingLeft: 12 },  // reach an inner element
}));

// styled() returns a COMPONENT, called at module scope — never in render.
// makeStyles returned a HOOK. That is the shape change that matters.`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={14} title="Symptom → Cause & The Debugging Loop" accent="red" glyph="🩺" span={3}>
        <GuideTable
          head={['Symptom', 'Cause']}
          rows={[
            ['Style applies at rest, reverts on hover', "You wrote (0,1,0); MUI's :hover rule is (0,2,0) — add '&:hover'."],
            ["'&$disabled' compiles but never matches", 'classes.disabled was never passed — both classes must land.'],
            ['Override works in dev, gone in prod', 'v4 injection-order tie. Raise specificity instead of relying on it.'],
            ['Theme migrated, nothing themed, no errors', 'Still using overrides/props — v5+ reads components.'],
            ['"makeStyles is no longer exported..."', 'Not a deprecation — the export throws. Rewrite to styled, or install @mui/styles and accept a v6 ceiling.'],
            ['Button text styling stopped after v5', "The label slot was deleted (verified: 'label' in buttonClasses is false at 5.18.0). Fold it into root."],
            ['"React does not recognize the X prop..."', 'A styled component forwarding a styling-only prop — add shouldForwardProp.'],
          ]}
        />
        <GuideCode>{`1. INSPECT THE ELEMENT that actually paints wrong — a v4 Button is a
   <button> wrapping <span class="MuiButton-label">. You are often
   targeting the wrong one.
2. FIND THE WINNING RULE in the Styles panel (not struck through);
   read its specificity off the selector.
3. MATCH ITS SHAPE — one class, '&:hover', or (v4) classes+'&$disabled'+
   empty rule vs. (v5+) '&.Mui-disabled'.
4. ONLY THEN reach for a hatch. Skipping to !important means you never
   learned which rule was winning — you'll be back for the hover state.`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={15} title="The Rules" accent="blue" glyph="📜" span={2}>
        <GuideRules items={[
          'Read the DOM before writing a single line of override CSS.',
          'className is a bet on winning a tie — in v4 that tie is module evaluation order. Do not bet on it for anything stateful.',
          'The classes prop is the intended v4 mechanism and survives unchanged into v9; slot names live in the component’s *ClassKey type.',
          '$name means "the generated class for rule name in this sheet" — declare it AND pass it through classes.',
          'One instance -> classes. Every instance -> theme overrides. A new kind of thing -> a wrapper (v4) or styled (v5+).',
          'Rename createMuiTheme -> createTheme on v4.12 today — free line of migration.',
          'Grep any migrated theme for overrides and props. They fail silently.',
          'sx for one-offs, styled for reuse and hot paths, theme styleOverrides for "all of them".',
        ]} />
      </GuidePanel>

      <GuidePanel n={16} title="Going Past v5" accent="purple" glyph="🚀">
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--g-dim)' }}>
          This sheet stops at v5 — the jump out of v4. The current release is 9.3.1, and things
          keep moving: Grid grew a <code>size</code> prop, <code>breakpoints.down()</code> changed
          meaning, <code>spacing()</code> returns a string, not a number. Covered, verified against
          a real <code>@mui/material@9.3.1</code> install, in{' '}
          <a href="/mui9/intro">MUI Current (v9)</a> and{' '}
          <a href="/mui9/cheatsheet">its own field guide</a>.
        </p>
      </GuidePanel>
    </GuideLayout>
  );
}
