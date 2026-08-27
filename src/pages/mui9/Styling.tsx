import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Mui9Styling() {
  return (
    <LessonLayout
      title="Styling in v9 — styled() and sx"
      sectionId="mui9"
      lessonIndex={2}
      prev={{ path: '/mui9/silent-breaks', label: 'The Breaks That Do Not Warn You' }}
      next={{ path: '/mui9/theming', label: 'Theming with CSS Variables & Color Schemes' }}
    >
      <p>
        v9 gives you two styling APIs and no third. There is no <code>makeStyles</code>, no{' '}
        <code>withStyles</code>, no <code>classes</code>-prop-as-primary-mechanism. Both APIs run
        on the same engine — <strong>emotion</strong> — which is why they compose more cleanly
        than the v4 equivalents ever did.
      </p>

      <CodeBlock language="text" title="The whole surface">
{`styled(Component)(styles)     a NEW component, styles defined at module scope
sx={{ ... }}                  styles on THIS element, defined at the call site

Both compile to real CSS classes through emotion.
Neither is inline styles. Neither uses the style="" attribute.`}
      </CodeBlock>

      <h2>styled(): A Component, Defined Once</h2>

      <CodeBlock language="jsx" title="The shape">
{`import { styled } from '@mui/material/styles';

// a plain element
const Panel = styled('div')({
  padding: 16,
  color: 'red',
});

// wrapping a MUI component
const RoundButton = styled(Button)({
  borderRadius: 99,
});

// reading the theme - the callback form
const ThemedPanel = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  color: theme.palette.primary.main,
}));`}
      </CodeBlock>

      <p>That last one compiles to exactly what you would hope:</p>

      <CodeBlock language="text" title="Real output — the emitted rule">
{`.css-<hash> { padding:16px; color:#1976d2; }

# theme.spacing(2) -> "16px"  (a STRING in v9 - see the previous lesson)
# theme.palette.primary.main -> #1976d2`}
      </CodeBlock>

      <h2>sx: Styles at the Call Site</h2>

      <p>
        <code>sx</code> is a prop available on every MUI component and on{' '}
        <code>Box</code>. It accepts the same style objects, plus a shorthand vocabulary from
        MUI&apos;s system package:
      </p>

      <CodeBlock language="jsx" title="The shorthand is the point">
{`<Box sx={{ p: 2, color: 'red' }} />

// p/m are padding/margin in SPACING UNITS, not pixels:
//   p: 2  ->  padding: 16px      (2 * 8px)
//   px: 1 ->  padding-left/right
//   mt: 3 ->  margin-top: 24px

// colors resolve against the theme palette:
<Box sx={{ color: 'primary.main', bgcolor: 'background.paper' }} />

// breakpoints are objects, keyed by breakpoint name:
<Box sx={{ width: { xs: '100%', md: '50%' } }} />`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — what sx={{ p: 2, color: 'red' }} actually emits">
{`padding:16px;color:red;`}
      </CodeBlock>

      <h2>What Each One Costs</h2>

      <p>
        The usual advice is &quot;<code>sx</code> is slower, use <code>styled</code> for hot
        paths.&quot; That is roughly right but the reason is usually stated wrong, so here is the
        measurement — three instances of each, counting the distinct emotion classes produced:
      </p>

      <CodeBlock language="text" title="Real output — distinct CSS classes generated, 3 instances each">
{`same sx object on 3 instances     -> 1 class   (css-1w0jgfk)
sx with a DIFFERENT value each    -> 3 classes (css-1j9994z, css-1w0jgfk, css-12z9qmj)
styled() component, 3 instances   -> 1 class   (css-o1501e)`}
      </CodeBlock>

      <InfoBox variant="note" title="sx does not create a class per element">
        <p>
          Three elements with the <em>identical</em> <code>sx</code> object share one class.
          Emotion hashes the serialized style, so identical styles deduplicate no matter how many
          elements use them. The class count only grows when the <em>values</em> differ.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          So the real cost of <code>sx</code> is not class explosion — it is that the object is
          rebuilt and re-serialized on <strong>every render</strong>, because it is a fresh object
          literal in your JSX each time. A <code>styled()</code> component serializes once, at
          module scope, and never again. That is the difference, and it only matters in a list of
          a thousand rows or a component that re-renders constantly.
        </p>
      </InfoBox>

      <h2>How They Combine — There Is No Specificity War</h2>

      <p>
        In v4, layering styles meant fighting specificity: your class and MUI&apos;s class had
        equal weight, and whichever got injected later won, which depended on module evaluation
        order. v9 does something better. Put a <code>sx</code> on a <code>styled()</code>{' '}
        component and emotion <strong>merges them into one class</strong>:
      </p>

      <CodeBlock language="text" title="Real output — styled(Button)({color:'red'}) rendered with sx={{color:'blue'}}">
{`emitted rules, in document order:
  ru4hv0 => color:red;color:blue;
             ^^^^^^^^^ ^^^^^^^^^^
             styled     sx

element class list:
  MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-sizeMedium
  MuiButton-colorPrimary css-lxgte5-MuiButtonBase-root-MuiButton-root`}
      </CodeBlock>

      <p>
        One rule, two declarations, <code>sx</code> last. Since both declarations sit in the same
        rule at the same specificity, the later one wins by ordinary CSS cascade rules. There is
        no <code>!important</code>, no <code>&amp;&amp;</code> doubling trick, no injection-order
        gamble.
      </p>

      <InfoBox variant="tip" title="This is the single biggest quality-of-life win over v4">
        <p>
          The v4 section documents an entire class of bug where merely{' '}
          <em>importing Button before your makeStyles call</em> changed which styles won, because
          JSS assigned injection indices at module evaluation time. That bug does not exist here.
          Style precedence in v9 follows the order you wrote things in, which is what everyone
          assumed was happening all along.
        </p>
      </InfoBox>

      <FlowChart
        title="Choosing between them"
        chart={"graph TD\n  A[\"I need to style something\"] --> B{\"reused in more<br/>than one place?\"}\n  B -->|\"yes\"| C[\"styled()<br/>define once, import it\"]\n  B -->|\"no\"| D{\"does it change per<br/>render or per item?\"}\n  D -->|\"no\"| E[\"sx - a one-off<br/>layout tweak\"]\n  D -->|\"yes, and it is<br/>a long list\"| F[\"styled() + a prop<br/>keeps serialization<br/>out of the render\"]\n  D -->|\"yes, but small\"| E\n  style C fill:#1a3329,stroke:#4ade80\n  style E fill:#1a2744,stroke:#5b9cf6\n  style F fill:#1a3329,stroke:#4ade80"}
      />

      <h2>Custom Props, and Keeping Them Out of the DOM</h2>

      <p>
        A common pattern is a styled component that varies on a prop. The trap is that unknown
        props are forwarded to the underlying DOM element, which produces the same React warning
        you saw with <code>Grid item</code>:
      </p>

      <CodeBlock language="jsx" title="shouldForwardProp is the fix">
{`// PROBLEM: "active" ends up as an HTML attribute on the div
const Row = styled('div')(({ active }) => ({
  background: active ? '#eef' : 'transparent',
}));

// FIX 1: tell styled() not to forward it
const Row = styled('div', {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ active }) => ({
  background: active ? '#eef' : 'transparent',
}));

// FIX 2: the convention - prefix with $ and filter on that
const Row = styled('div', {
  shouldForwardProp: (prop) => !String(prop).startsWith('$'),
})(({ $active }) => ({
  background: $active ? '#eef' : 'transparent',
}));`}
      </CodeBlock>

      <InfoBox variant="warning" title="Prefer data attributes for a handful of states">
        <p>
          If the variation is a small set of states, a <code>data-</code> attribute is often
          simpler than a forwarded prop, because it is valid HTML, needs no filtering, and is
          visible in devtools:
        </p>
        <CodeBlock language="jsx" title="No shouldForwardProp needed">
{`const Row = styled('div')({
  '&[data-active="true"]': { background: '#eef' },
});

<Row data-active={isActive} />`}
        </CodeBlock>
      </InfoBox>

      <h2>Coming From v4</h2>

      <CodeBlock language="text" title="The mental translation">
{`v4                              v9
------------------------------  ------------------------------
makeStyles + useStyles hook     styled() at module scope
classes.foo on className        the styled component IS foo
withStyles(styles)(Component)   styled(Component)(styles)
createStyles({...})             not needed - types just work
clsx(classes.a, cond && b)      still fine, or sx, or data-attrs
theme.overrides                 theme.components.X.styleOverrides
$ruleName nesting syntax        plain & nesting: '&.Mui-focused'

The big shift: in v4 you produced CLASS NAMES and applied them.
In v9 you produce COMPONENTS and render them.`}
      </CodeBlock>

      <InteractiveChallenge
        question="You render a 2,000-row table. Each row uses sx={{ py: 1, bgcolor: row.isError ? 'error.light' : 'transparent' }}. Profiling shows heavy time in style serialization. What is the most effective fix?"
        options={[
          'Wrap each row in React.memo — the sx object is not the problem',
          'Move the static parts into a styled() component and express the variable part as a data attribute or a filtered prop, so the per-row object is not rebuilt and re-serialized each render',
          'Replace sx with inline style={{ }} to skip emotion entirely',
          'Add !important to the sx values so emotion can skip specificity resolution',
        ]}
        correctIndex={1}
        explanation={"The sx object is a fresh literal on every row on every render, so emotion re-serializes and re-hashes 2,000 objects each time. Note that the CLASS count stays small — isError only has two outcomes, so emotion deduplicates down to about two classes — which is exactly why this shows up as serialization time rather than stylesheet bloat. Moving the static declarations into a styled() component serializes them once at module scope, and expressing the variance as a data attribute (or a shouldForwardProp-filtered prop) means the per-row work disappears. React.memo may help for unrelated reasons but does not address serialization on the renders that do happen. Inline styles would skip emotion but lose pseudo-selectors, media queries and theme resolution, and !important does not change how emotion works."}
      />
    </LessonLayout>
  );
}

export default Mui9Styling;
