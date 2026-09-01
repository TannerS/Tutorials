import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Mui9SilentBreaks() {
  return (
    <LessonLayout
      title="The Breaks That Do Not Warn You"
      sectionId="mui9"
      lessonIndex={1}
      prev={{ path: '/mui9/intro', label: 'MUI v9 — Where the Library Actually Is' }}
      next={{ path: '/mui9/styling', label: 'Styling in v9 — styled() and sx' }}
    >
      <p>
        Most breaking changes are polite. They delete an export, your build fails, you fix it, you
        move on. The dangerous ones are the changes where the old code still compiles, still runs,
        emits nothing, and quietly means something <em>different</em> than it used to.
      </p>

      <p>
        This page is only those. Everything below was reproduced against a real{' '}
        <code>@material-ui/core@4.12.4</code> and a real <code>@mui/material@9.4.0</code>, and{' '}
        <strong>every single one produced zero console output</strong>.
      </p>

      <InfoBox variant="danger" title="Why this category deserves its own lesson">
        <p>
          A typecheck will not catch these. A unit test will usually not catch them either, because
          the component still renders and still has a class. They surface as a layout that looks
          slightly wrong at certain widths, or a dark mode that does not turn on — noticed by a
          user, weeks after the upgrade, with no obvious connection to the upgrade.
        </p>
      </InfoBox>

      <h2>1. Breakpoints: The Same Call, 360 Pixels Apart</h2>

      <p>
        This is the worst one, and it is worth reading slowly. Two things changed at once: the
        breakpoint <em>values</em>, and the <em>meaning</em> of <code>down()</code>.
      </p>

      <CodeBlock language="text" title="Real output — breakpoint values, both versions">
{`v4:  {"xs":0, "sm":600, "md":960,  "lg":1280, "xl":1920}
v9:  {"xs":0, "sm":600, "md":900,  "lg":1200, "xl":1536}
                              ^^^        ^^^^       ^^^^
                        md, lg and xl all moved`}
      </CodeBlock>

      <p>
        In v4, <code>down(key)</code> meant &quot;below the <strong>next</strong> breakpoint
        up&quot; — an off-by-one that confused people for years. In v5 it was redefined to mean
        &quot;below <strong>this</strong> breakpoint&quot;, which is what everyone assumed it
        meant all along. Combine that with the moved values and you get this:
      </p>

      <CodeBlock language="text" title="Real output — identical call, both versions">
{`down(sm)   v4=(max-width:959.95px)     v9=(max-width:599.95px)
down(md)   v4=(max-width:1279.95px)    v9=(max-width:899.95px)
down(lg)   v4=(max-width:1919.95px)    v9=(max-width:1199.95px)
down(xl)   v4=(min-width:0px)          v9=(max-width:1535.95px)

between("sm","md")
           v4=(min-width:600px) and (max-width:1279.95px)
           v9=(min-width:600px) and (max-width:899.95px)`}
      </CodeBlock>

      <p>
        Read the first row again. <code>theme.breakpoints.down(&apos;sm&apos;)</code> is a media
        query that fires below <strong>960px</strong> in v4 and below <strong>600px</strong> in v9.
        Every style hidden behind that query — every &quot;stack this on mobile&quot;, every
        &quot;hide the sidebar&quot; — now applies over a 360-pixel-narrower range. Tablets and
        small laptops fall out of it entirely.
      </p>

      <InfoBox variant="warning" title="down('xl') is the strangest of them">
        <p>
          In v4, <code>down(&apos;xl&apos;)</code> produced <code>(min-width:0px)</code> — a query
          that matches <em>everything</em>, because xl was the top and there was nothing above it.
          In v9 it produces <code>(max-width:1535.95px)</code>, which matches everything{' '}
          <em>except</em> the largest screens. So a rule that used to apply universally now
          silently switches off on a wide monitor. If you have ever wondered why a style
          disappears only on the designer&apos;s 4K display, this is a candidate.
        </p>
      </InfoBox>

      <p>
        For the record, <code>up()</code> was always sane and did not change meaning — only the
        underlying values moved:
      </p>

      <CodeBlock language="text" title="Real output — up() in v9">
{`up(xs) = (min-width:0px)      up(lg) = (min-width:1200px)
up(sm) = (min-width:600px)    up(xl) = (min-width:1536px)
up(md) = (min-width:900px)

# and one curiosity, harmless but confusing if you hit it:
down(xs) = (max-width:-0.05px)     <- matches nothing, ever`}
      </CodeBlock>

      <InfoBox variant="tip" title="The migration move: rewrite down() as up() where you can">
        <p>
          Because <code>up()</code> never changed meaning, mobile-first styles written with{' '}
          <code>up()</code> migrate cleanly. If you are about to do this upgrade, converting the
          desktop-first <code>down()</code> rules to mobile-first <code>up()</code> rules{' '}
          <em>before</em> you bump the version is the safer order: you do the rewrite while you can
          still see the old behaviour to compare against.
        </p>
      </InfoBox>

      <h2>2. spacing() Changed Its Return Type</h2>

      <CodeBlock language="text" title="Real output — same call, different type">
{`v4:  theme.spacing(2)  ->  16        (number)
v9:  theme.spacing(2)  ->  "16px"    (string)`}
      </CodeBlock>

      <p>
        Inside a style object this is invisible — <code>padding: 16</code> and{' '}
        <code>padding: &quot;16px&quot;</code> both work. It breaks the moment you do{' '}
        <em>arithmetic</em>:
      </p>

      <CodeBlock language="javascript" title="The failure mode">
{`// v4: 16 * 2 = 32. Fine.
// v9: "16px" * 2 = NaN, and "16px" + 8 = "16px8"
const doubled = theme.spacing(2) * 2;
const offset  = theme.spacing(2) + 8;

// v9-safe: let spacing do the arithmetic
const doubled = theme.spacing(4);
const offset  = 'calc(' + theme.spacing(2) + ' + 8px)';`}
      </CodeBlock>

      <p>
        <code>NaN</code> in a CSS value produces an invalid declaration, which the browser drops
        silently. The element simply has no padding, and nothing anywhere says why.
      </p>

      <h2>3. Grid: The Layout That Collapses Without Complaining</h2>

      <p>
        The Grid API was rewritten. <code>item</code> is gone, and the per-breakpoint size props
        (<code>xs</code>, <code>sm</code>, <code>md</code>) were replaced by a single{' '}
        <code>size</code> prop. In 9.4.0, <code>Grid</code> accepts exactly these:
      </p>

      <CodeBlock language="text" title="Real output — Grid propTypes on 9.4.0">
{`children, columns, columnSpacing, container, direction, offset,
rowSpacing, size, spacing, sx, unstable_level, wrap

# note what is NOT there: item, xs, sm, md, lg, xl`}
      </CodeBlock>

      <p>Rendering the v4 spelling against v9 produces this:</p>

      <CodeBlock language="text" title="Real output — rendered markup and the CSS rule that resulted">
{`--- v4 spelling: <Grid container><Grid item xs={6}>A</Grid></Grid> ---
<div class="MuiGrid-root MuiGrid-container ...">
  <div class="MuiGrid-root ... css-17fpwt7-MuiGrid-root" xs="6">A</div>
</div>
   css rule:  min-width:0; box-sizing:border-box;
                                   ^ no width. none. the item does not size.

--- v9 spelling: <Grid container><Grid size={6}>A</Grid></Grid> ---
<div class="MuiGrid-root MuiGrid-container ...">
  <div class="MuiGrid-root ... MuiGrid-grid-xs-6 css-1ml5fja-MuiGrid-root">A</div>
</div>
   css rule:  flex-grow:0; flex-basis:auto;
              width:calc(100% * 6 / var(--Grid-parent-columns) - ...)`}
      </CodeBlock>

      <p>
        The v4 spelling produces an element with <strong>no width rule at all</strong>, and{' '}
        <code>xs=&quot;6&quot;</code> leaks into the DOM as a meaningless HTML attribute. Your
        twelve-column layout becomes a stack of full-width divs.
      </p>

      <InfoBox variant="note" title="The one warning you do get, and why it is easy to miss">
        <p>
          React itself complains about <code>item</code>, because a boolean is being forwarded to
          a DOM attribute: <em>&quot;Received `true` for a non-boolean attribute `item`&quot;</em>.
          That is React, not MUI, and it says nothing about layout. There is no warning at all
          about <code>xs</code>, and no warning that the sizing did not apply. In a codebase with
          any existing console noise, this vanishes.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="The translation">
{`// v5 / v6
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>A</Grid>
</Grid>

// v7 / v9
<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 6 }}>A</Grid>
</Grid>

// a single number is shorthand for all breakpoints
<Grid size={6}>A</Grid>
<Grid size="grow">fills remaining space</Grid>`}
      </CodeBlock>

      <h2>4. palette.type Became palette.mode</h2>

      <CodeBlock language="text" title="Real output — the v4 spelling against v9">
{`createTheme({ palette: { type: "dark" } })      // v4 spelling
   palette.mode        = light          <- ignored
   background.default  = #fff
   text.primary        = rgba(0, 0, 0, 0.87)

createTheme({ palette: { mode: "dark" } })      // v9 spelling
   palette.mode        = dark
   background.default  = #121212`}
      </CodeBlock>

      <p>
        Dark mode simply does not turn on. No error, no warning — the unknown key is accepted and
        ignored. This one is symmetric, incidentally: passing the <em>v9</em> spelling to a{' '}
        <em>v4</em> theme is equally silent, which is covered in the v4 section.
      </p>

      <h2>5. theme.overrides and theme.props Became theme.components</h2>

      <p>
        This is the sneakiest entry on the page, because the old key does not get dropped — it
        gets <em>kept</em>, and does nothing:
      </p>

      <CodeBlock language="text" title="Real output — v4 keys passed to createTheme on 9.4.0">
{`createTheme({
  overrides: { MuiButton: { root: { borderRadius: 99 } } },
  props:     { MuiButton: { disableRipple: true } },
})

   theme.overrides  = {"MuiButton":{"root":{"borderRadius":99}}}   <- still there!
   theme.components = {}                                           <- but empty

# So console.log(theme.overrides) shows your config, looking correct,
# while nothing on screen is overridden.`}
      </CodeBlock>

      <p>
        You can inspect the theme, see your overrides sitting right there, and conclude the theme
        is fine and the problem must be specificity. It is not. The key is inert — MUI only reads{' '}
        <code>components</code>.
      </p>

      <CodeBlock language="javascript" title="The translation">
{`// v4
createTheme({
  overrides: { MuiButton: { root:  { borderRadius: 99 } } },
  props:     { MuiButton: { disableRipple: true } },
})

// v9
createTheme({
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 99 } },
      defaultProps:   { disableRipple: true },
    },
  },
})`}
      </CodeBlock>

      <h2>6. Slot Class Names Were Removed</h2>

      <p>
        v4 wrapped button text in an inner span with the class{' '}
        <code>MuiButton-label</code>. That element no longer exists:
      </p>

      <CodeBlock language="text" title="Real output — buttonClasses on 9.4.0">
{`'label' in buttonClasses  ->  false

available keys: root, text, outlined, contained, disableElevation,
                focusVisible, disabled, colorInherit, colorPrimary,
                colorSecondary, colorSuccess, colorError, colorInfo,
                colorWarning, ...`}
      </CodeBlock>

      <p>
        Any CSS targeting <code>.MuiButton-label</code> now matches nothing. A selector that
        matches nothing is not an error in CSS — it is just a rule that never applies.
      </p>

      <h2>The Whole Category, at a Glance</h2>

      <FlowChart
        title="What each silent break looks like from the outside"
        chart={"graph LR\n  A[\"down('sm')\"] --> A2[\"query fires 360px<br/>narrower than before\"]\n  B[\"spacing(2) * 2\"] --> B2[\"NaN -> browser drops<br/>the declaration\"]\n  C[\"Grid item xs={6}\"] --> C2[\"no width rule<br/>layout stacks\"]\n  D[\"palette.type\"] --> D2[\"dark mode never<br/>turns on\"]\n  E[\"theme.overrides\"] --> E2[\"key kept, ignored<br/>looks correct in devtools\"]\n  F[\".MuiButton-label\"] --> F2[\"selector matches<br/>nothing\"]\n  style A2 fill:#3b1a1a,stroke:#f87171\n  style B2 fill:#3b1a1a,stroke:#f87171\n  style C2 fill:#3b1a1a,stroke:#f87171\n  style D2 fill:#3b1a1a,stroke:#f87171\n  style E2 fill:#3b1a1a,stroke:#f87171\n  style F2 fill:#3b1a1a,stroke:#f87171"}
      />

      <CodeBlock language="bash" title="Grep for all six before you upgrade">
{`grep -rn "breakpoints.down"      # every one needs re-reading, not just fixing
grep -rn "spacing(.*)\\s*[*+-]"   # arithmetic on spacing()
grep -rn "<Grid item"            # Grid API
grep -rn "palette.*type:"        # palette.type
grep -rn "overrides:\\|props:"    # theme keys (check context - both are common words)
grep -rn "MuiButton-label\\|-label" # removed slot classes

# MUI ships codemods that handle much of this mechanically:
npx @mui/codemod@latest v5.0.0/preset-safe src/
npx @mui/codemod@latest v7.0.0/grid-props src/`}
      </CodeBlock>

      <InfoBox variant="tip" title="The one that codemods cannot fix">
        <p>
          Five of the six are mechanical translations a codemod can do. <strong>Breakpoints are
          not.</strong> A codemod cannot know whether{' '}
          <code>down(&apos;sm&apos;)</code> in your code meant &quot;below 960&quot; (the v4
          behaviour you were relying on) or &quot;below the sm breakpoint&quot; (what you thought
          you were writing). Each call site is a judgement about design intent, and it has to be
          looked at by a person.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="After upgrading v4 to v9, your app looks correct on phones and on desktop, but on tablets the sidebar that should be hidden is visible. Nothing was logged. What is the first thing to check?"
        options={[
          'The z-index of the sidebar changed between versions',
          "A theme.breakpoints.down() call — down('sm') covered up to 960px in v4 and only 600px in v9, so the 600–960px range lost the rule",
          'The Grid container lost its spacing prop',
          'Emotion is injecting styles in a different order than JSS did',
        ]}
        correctIndex={1}
        explanation={"Correct at the extremes and wrong in the middle is the signature of a breakpoint range change rather than a broken rule — a rule that was simply gone would be wrong everywhere below the threshold, including on phones. In v4 down('sm') meant max-width:959.95px, so a 'hide on small screens' rule covered tablets. In v9 the same call means max-width:599.95px, so the 600–960px band no longer matches and the sidebar reappears exactly there. Injection order (option 4) is a real v4-to-v5 concern and worth knowing about, but it would not produce a clean phone/desktop-correct, tablet-wrong split."}
      />
    </LessonLayout>
  );
}

export default Mui9SilentBreaks;
