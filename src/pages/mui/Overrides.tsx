import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

const th = { padding: '0.75rem', textAlign: 'left' as const, color: 'var(--accent-amber)' };
const td = { padding: '0.75rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, margin: '1rem 0' };
const headRow = { borderBottom: '2px solid var(--border-color)' };
const row = { borderBottom: '1px solid var(--border-color)' };

function MuiOverrides() {
  return (
    <LessonLayout
      title="Overriding Component Styles"
      sectionId="mui"
      lessonIndex={3}
      prev={{ path: '/mui/theming', label: 'Theming & the Theme Object' }}
      next={{ path: '/mui/styled-v5', label: 'v5 and Beyond — styled() and sx' }}
    >
      <p>
        This is the lesson the rest of the section exists for. You have a MUI component, the
        design says it should look different, and the CSS you write does nothing. That is not a
        skill problem — it is a <strong>specificity and injection-order</strong> problem, and MUI
        v4 ships a specific mechanism to solve it that most people never find.
      </p>
      <p>
        Every class name, warning string, and compiled selector on this page was produced by
        server-rendering <code>@material-ui/core@4.12.4</code> and reading the emitted CSS, not
        recalled from memory. Where a claim comes from MUI&apos;s docs rather than from a run,
        it says so.
      </p>

      <h2>First: look at what you are actually styling</h2>

      <p>
        Before overriding anything, render the component and read the DOM. A v4{' '}
        <code>Button</code> is not one element with one class — it is a nest of elements, each
        carrying several class names that MUI generated.
      </p>

      <CodeBlock language="jsx" title="The input">
{`import Button from '@material-ui/core/Button';

<Button variant="contained" color="primary" className={classes.myButton}>
  className
</Button>

<Button variant="outlined" disabled>
  disabled
</Button>`}
      </CodeBlock>

      <CodeBlock language="html" title="The actual output — NODE_ENV=development">
{`<button class="MuiButtonBase-root MuiButton-root MuiButton-contained makeStyles-myButton-1 MuiButton-containedPrimary"
        tabindex="0" type="button">
  <span class="MuiButton-label">className</span>
</button>

<button class="MuiButtonBase-root MuiButton-root MuiButton-outlined Mui-disabled Mui-disabled"
        tabindex="-1" type="button" disabled="">
  <span class="MuiButton-label">disabled</span>
</button>`}
      </CodeBlock>

      <CodeBlock language="html" title="The same render with NODE_ENV=production">
{`<button class="MuiButtonBase-root MuiButton-root MuiButton-contained jss1 MuiButton-containedPrimary"
        tabindex="0" type="button">
  <span class="MuiButton-label">className</span>
</button>`}
      </CodeBlock>

      <p>Three things are worth naming before we go further.</p>

      <ul>
        <li>
          <strong>MUI&apos;s own classes are stable and human-readable</strong> —{' '}
          <code>MuiButton-root</code>, <code>MuiButton-contained</code>,{' '}
          <code>MuiButton-label</code>. They do not get hashed, in dev or in prod.
        </li>
        <li>
          <strong>Your class is the one that changes</strong> —{' '}
          <code>makeStyles-myButton-1</code> in development,{' '}
          <code>jss1</code> in production. That is by design: the generator only keeps the
          readable name for sheets whose <code>name</code> option starts with{' '}
          <code>Mui</code>. So never write a selector against your own generated name.
        </li>
        <li>
          <strong>State is a separate, global class</strong> — the disabled button got{' '}
          <code>Mui-disabled</code>, not <code>MuiButton-disabled</code>. It appears twice
          because both <code>ButtonBase</code> and <code>Button</code> apply it. That{' '}
          <code>Mui-</code> prefix is the whole reason the <code>$</code> syntax exists, which
          we get to shortly.
        </li>
      </ul>

      <h2>Level 1: the className prop, and why it silently loses</h2>

      <p>
        <code>className</code> is the first thing everyone reaches for, and it works often enough
        to be trusted and rarely enough to be maddening. It fails in two distinct ways, and they
        have different fixes, so it is worth separating them.
      </p>

      <InfoBox variant="note" title="Specificity notation, recapped">
        <p style={{ marginBottom: 0 }}>
          Every tuple below, like <code>(0,1,0)</code>, is the same three-column specificity score
          introduced in the previous lesson: (ID selectors, class/attribute/pseudo-class selectors,
          type/pseudo-element selectors), compared column by column, left to right — a higher number
          in an earlier column wins outright, and equal tuples fall back to source order. It is a
          three-column simplification of the four-column form{' '}
          <a href="/css-mastery/fundamentals">CSS Fundamentals from Scratch</a> teaches, which also
          tracks a leading inline-style column; that column is dropped here because nothing on this
          page is ever competing against an inline <code>style=&quot;...&quot;</code> attribute. See{' '}
          <a href="/mui/styling-v4">Styling in v4</a> for the full walkthrough with worked examples,
          or the CSS Fundamentals lesson for the cascade this all sits on top of.
        </p>
      </InfoBox>

      <h3>Failure mode A — a tie, decided by injection order</h3>

      <p>
        <code>.makeStyles-myButton-1</code> and <code>.MuiButton-containedPrimary</code> are both
        a single class: specificity <code>(0,1,0)</code> each. A tie in CSS is broken by source
        order — whichever rule appears <em>later in the stylesheet</em> wins. So the question is
        which sheet got injected first.
      </p>
      <p>
        In v4, every call to <code>makeStyles()</code> or <code>withStyles()</code> takes the next
        value from a module-level counter and uses it as the sheet&apos;s injection index. That
        call happens when the module is <em>evaluated</em>. Which means:{' '}
        <strong>your import order decides whether your override wins.</strong> Both of these
        render the same button:
      </p>

      <CodeBlock language="javascript" title="Verified — same styles, opposite outcome">
{`// ---- Case 1: Button's module evaluated first ----
const Button = require('@material-ui/core/Button').default;
const useStyles = makeStyles({ mine: { backgroundColor: 'hotpink' } });

//   MuiButton-containedPrimary   at char 3xxx
//   makeStyles-mine-1            at char 253x   <- LATER
//   => your rule wins. Button is hotpink.


// ---- Case 2: makeStyles evaluated first ----
const useStyles = makeStyles({ mine: { backgroundColor: 'hotpink' } });
const Button = require('@material-ui/core/Button').default;

//   makeStyles-mine-1            at char 0      <- FIRST
//   MuiButton-containedPrimary   at char 4250
//   => MUI's rule wins. Button is still indigo.`}
      </CodeBlock>

      <InfoBox variant="danger" title="This is the &quot;it works on my machine&quot; bug">
        <p style={{ marginBottom: 0 }}>
          Nothing about your component changed between those two cases. A reordered import, a
          barrel file, a lazy-loaded route, or a bundler deciding to hoist a chunk differently can
          flip which sheet is injected first — and your styling changes with it. If you have ever
          watched an override work in dev and vanish in a production build, this is a prime
          suspect. Overrides that rely on winning a tie are not stable overrides.
        </p>
      </InfoBox>

      <h3>Failure mode B — you are not tied, you are outgunned</h3>

      <p>
        Even when your sheet is injected last, a flat single-class rule cannot touch MUI&apos;s
        state and interaction rules, because those are two-class or class-plus-pseudo selectors.
        Here is a slice of what MUI actually emits for a Button:
      </p>

      <CodeBlock language="css" title="Real emitted CSS from @material-ui/core@4.12.4">
{`.MuiButton-root                     { ... }   /* (0,1,0) */
.MuiButton-root:hover               { ... }   /* (0,2,0) */
.MuiButton-root.Mui-disabled        { ... }   /* (0,2,0) */
.MuiButton-root:hover.Mui-disabled  { ... }   /* (0,3,0) */
.MuiButton-contained                { ... }   /* (0,1,0) */
.MuiButton-contained:hover          { ... }   /* (0,2,0) */
.MuiButton-contained:active         { ... }   /* (0,2,0) */
.MuiButton-contained.Mui-focusVisible { ... } /* (0,2,0) */
.MuiButton-contained.Mui-disabled   { ... }   /* (0,2,0) */
@media (hover: none) {
  .MuiButton-contained:hover        { ... }
  .MuiButton-contained:hover.Mui-disabled { ... }
}

/* Your rule: */
.makeStyles-myButton-1              { ... }   /* (0,1,0) */`}
      </CodeBlock>

      <p>
        So <code>background-color: hotpink</code> on your class beats{' '}
        <code>.MuiButton-containedPrimary</code> at rest — and then the user hovers, and{' '}
        <code>.MuiButton-contained:hover</code> at <code>(0,2,0)</code> snaps it back to grey.
        Or the button is disabled and <code>.MuiButton-root.Mui-disabled</code> overrides your
        colour. The override looks half-broken because it <em>is</em> half-broken: it won one
        selector and lost five.
      </p>

      <InfoBox variant="note" title="The order of class names in the attribute is irrelevant">
        <p style={{ marginBottom: 0 }}>
          A common wrong theory is that <code>className</code> loses because MUI puts its class
          later in the <code>class=&quot;...&quot;</code> string. It does not matter. The order of
          names inside a <code>class</code> attribute has no effect on the cascade at all — the
          browser treats it as an unordered set. Only selector specificity and stylesheet source
          order decide the winner.
        </p>
      </InfoBox>

      <h2>Level 2: the classes prop and the CSS API</h2>

      <p>
        Here is the mechanism v4 actually intends you to use, and the thing most people never
        learn. <strong>Every MUI component documents a set of named style slots</strong> — one
        per internal element and per meaningful state. That list is the component&apos;s{' '}
        <em>CSS API</em>, and it is published on each component&apos;s API page under the heading
        &quot;CSS&quot;. You pass a class for any slot through the <code>classes</code> prop, and
        MUI merges yours onto the element it belongs to.
      </p>

      <CodeBlock language="typescript" title="Button's CSS API — verified from ButtonClassKey in 4.12.4">
{`export type ButtonClassKey =
  | 'root'                 // the <button> element
  | 'label'                // the inner <span> wrapping the children
  | 'text' | 'textPrimary' | 'textSecondary'
  | 'outlined' | 'outlinedPrimary' | 'outlinedSecondary'
  | 'contained' | 'containedPrimary' | 'containedSecondary'
  | 'disableElevation'
  | 'focusVisible'         // state slot
  | 'disabled'             // state slot
  | 'colorInherit'
  | 'textSizeSmall' | 'textSizeLarge'
  | 'outlinedSizeSmall' | 'outlinedSizeLarge'
  | 'containedSizeSmall' | 'containedSizeLarge'
  | 'sizeSmall' | 'sizeLarge'
  | 'fullWidth'
  | 'startIcon' | 'endIcon'
  | 'iconSizeSmall' | 'iconSizeMedium' | 'iconSizeLarge';`}
      </CodeBlock>

      <InfoBox variant="tip" title="How to read a CSS API without leaving your editor">
        <p style={{ marginBottom: 0 }}>
          You do not need the website. Every v4 component exports its slot union from its own{' '}
          <code>.d.ts</code>: <code>ButtonClassKey</code>, <code>TextFieldClassKey</code>,{' '}
          <code>DialogClassKey</code>, and so on. Ctrl-click the component, or ask your editor for
          the type of the <code>classes</code> prop, and you get the exhaustive list with
          autocomplete. If TypeScript accepts the key, the slot is real.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Targeting slots instead of the whole element">
{`const useStyles = makeStyles({
  root:  { borderRadius: 24 },
  label: { fontWeight: 700 },
});

function Save() {
  const classes = useStyles();
  return (
    <Button
      variant="contained"
      classes={{ root: classes.root, label: classes.label }}
    >
      Save
    </Button>
  );
}`}
      </CodeBlock>

      <CodeBlock language="html" title="What that renders — your class is MERGED, not replaced">
{`<button class="MuiButtonBase-root MuiButton-root makeStyles-root-1 MuiButton-contained"
        tabindex="0" type="button">
  <span class="MuiButton-label makeStyles-label-2">Save</span>
</button>`}
      </CodeBlock>

      <p>
        Two payoffs. First, <code>classes.label</code> reaches an element you have no other handle
        on — there is no prop that gives you a ref to that inner span. Second, and less obviously:
        this puts you in the right <em>place</em> in the cascade to keep fighting, because you can
        now write state selectors that match MUI&apos;s own specificity, which is what the next
        section is about.
      </p>

      <InfoBox variant="warning" title="Misspell a slot and v4 tells you — read your console">
        <p style={{ marginBottom: '0.5rem' }}>
          Passing an unknown key is not silently ignored. This is the exact warning, verbatim from
          a 4.12.4 run:
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
        <p style={{ marginBottom: 0 }}>
          The warning prints the complete slot list. It is, in practice, the fastest CSS API
          reference there is — deliberately pass a junk key once and read what comes back.
        </p>
      </InfoBox>

      <h2>State slots and the $ syntax</h2>

      <p>
        Now the part that looks like magic and is not. To style a MUI component{' '}
        <em>when it is disabled</em>, you write:
      </p>

      <CodeBlock language="javascript" title="The shape you will see everywhere in v4 code">
{`const useStyles = makeStyles({
  root: {
    color: 'green',
    '&$disabled': { color: 'purple', opacity: 1 },
    '&:hover':    { color: 'teal' },
  },
  disabled: {},   // <- REQUIRED, and empty on purpose
});

<Button
  disabled
  classes={{ root: classes.root, disabled: classes.disabled }}
>
  Save
</Button>`}
      </CodeBlock>

      <p>Three questions people get stuck on, answered by looking at the compiled output:</p>

      <CodeBlock language="css" title="What JSS actually emits for the sheet above">
{`.makeStyles-root-1 {
  color: green;
}
.makeStyles-root-1.makeStyles-disabled-2 {   /* <- '&$disabled' */
  color: purple;
  opacity: 1;
}
.makeStyles-root-1:hover {
  color: teal;
}`}
      </CodeBlock>

      <h3>Why <code>$</code> and not <code>.disabled</code>?</h3>

      <p>
        Because there is no class literally named <code>disabled</code> anywhere in the document.
        Class names are generated. <code>$disabled</code> is a JSS instruction meaning{' '}
        <em>&quot;substitute the generated name of the rule called <code>disabled</code> in this
        same sheet&quot;</em>. Writing <code>&apos;&amp;.disabled&apos;</code> would emit a
        selector for a class that never appears in the DOM, and it would silently do nothing.
        This is also why the <code>disabled: {'{}'}</code> rule must exist and must be listed — it is
        the thing being referenced. An empty rule is a legal, deliberate declaration of a name.
      </p>

      <h3>Why must I also pass <code>classes.disabled</code>?</h3>

      <p>
        Because <code>&amp;$disabled</code> compiled to a <em>two-class</em> selector:{' '}
        <code>.makeStyles-root-1.makeStyles-disabled-2</code>. Both classes must be on the element
        for it to match. MUI only puts <code>makeStyles-disabled-2</code> on the button when the
        button is disabled — and only if you handed that class to the <code>disabled</code> slot.
        Pass only <code>classes.root</code> and the selector is emitted, is correct, and never
        matches anything. That is the single most common way this trips people up.
      </p>

      <CodeBlock language="html" title="Verified — both classes land, so the selector matches">
{`<button class="MuiButtonBase-root MuiButton-root makeStyles-root-1 MuiButton-text
               Mui-disabled makeStyles-disabled-2 Mui-disabled"
        tabindex="-1" type="button" disabled="">
  <span class="MuiButton-label">Save</span>
</button>`}
      </CodeBlock>

      <h3>Why does this finally beat MUI?</h3>

      <p>
        Specificity. MUI&apos;s rule is <code>.MuiButton-root.Mui-disabled</code> —{' '}
        <code>(0,2,0)</code>. Yours is <code>.makeStyles-root-1.makeStyles-disabled-2</code> —
        also <code>(0,2,0)</code>. You are now fighting at weight, not from below. It still comes
        down to source order, but at least you are in the fight; a flat <code>(0,1,0)</code> rule
        could never win no matter where it was injected.
      </p>

      <h3>The global state classes, verified</h3>

      <p>
        Eight slot names are special-cased by v4&apos;s class-name generator. When a sheet belongs
        to MUI (its <code>name</code> starts with <code>Mui</code>) and the rule key is one of
        these, the emitted name is a short <em>global</em> one:
      </p>

      <CodeBlock language="javascript" title="From @material-ui/styles/createGenerateClassName">
{`const pseudoClasses = [
  'checked', 'disabled', 'error', 'focused',
  'focusVisible', 'required', 'expanded', 'selected',
];

// ...
if (pseudoClasses.indexOf(rule.key) !== -1) {
  return 'Mui-' + rule.key;      // template literal in the real source
}

// => Mui-checked  Mui-disabled  Mui-error   Mui-focused
//    Mui-focusVisible  Mui-required  Mui-expanded  Mui-selected`}
      </CodeBlock>

      <p>
        That is why the disabled button showed <code>Mui-disabled</code> and not{' '}
        <code>MuiButton-disabled</code>: it is one shared name across the whole library, so a
        Checkbox, a MenuItem, and a Button all say &quot;disabled&quot; the same way. Those eight
        names are stable and safe to reference; they are the closest thing v4 has to a public
        state contract.
      </p>

      <InfoBox variant="tip" title="MUI&apos;s own source uses the same trick — go read it">
        <p style={{ marginBottom: 0 }}>
          Open <code>@material-ui/core/Button/Button.js</code> and scroll to the styles object.
          You will find <code>&apos;&amp;$disabled&apos;</code> and{' '}
          <code>&apos;&amp;$focusVisible&apos;</code> used a dozen times, and near the bottom,{' '}
          <code>focusVisible: {'{}'}</code> and <code>disabled: {'{}'}</code> declared empty for exactly
          the reason above. The library styles itself with the same API it gives you — which is a
          good sign that <code>classes</code> is the supported path and not a workaround.
        </p>
      </InfoBox>

      <h2>Global class names: when .MuiButton-root is fine</h2>

      <p>
        Because <code>MuiButton-root</code> is stable in dev and prod, you <em>can</em> write
        plain CSS against it. Whether you <em>should</em> depends entirely on what you are trying
        to reach.
      </p>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Situation</th>
            <th style={th}>Verdict</th>
            <th style={th}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}>Reaching into a component you rendered yourself</td>
            <td style={td}><strong>Smell</strong></td>
            <td style={td}>
              You have a <code>classes</code> prop right there. Using a global selector instead is
              an action at a distance for no gain.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}>
              Styling a nested child a parent renders for you — a <code>Select</code>&apos;s menu
              paper, a <code>Tooltip</code>&apos;s popper
            </td>
            <td style={td}><strong>Often necessary</strong></td>
            <td style={td}>
              Prefer the documented escape hatch (<code>MenuProps</code>,{' '}
              <code>PopperProps</code>, <code>InputProps</code>). Reach for the global class only
              when no prop threads through.
            </td>
          </tr>
          <tr style={row}>
            <td style={td}>
              A scoped descendant rule inside your own component&apos;s sheet
            </td>
            <td style={td}><strong>Legitimate</strong></td>
            <td style={td}>
              <code>{"'& .MuiButton-root'"}</code> nested under a class you own is bounded by
              your component&apos;s subtree and reads clearly.
            </td>
          </tr>
          <tr>
            <td style={td}>App-wide <code>.MuiButton-root {'{...}'}</code> in a global stylesheet</td>
            <td style={td}><strong>Wrong tool</strong></td>
            <td style={td}>
              You want theme <code>overrides</code>. Same reach, but typed, themeable, and merged
              rather than fighting the cascade.
            </td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="javascript" title="The bounded version — scoped to a subtree you own">
{`const useStyles = makeStyles((theme) => ({
  toolbar: {
    display: 'flex',
    gap: theme.spacing(1),

    // Reads as: "buttons inside MY toolbar". Bounded, greppable,
    // and it cannot leak into someone else's screen.
    '& .MuiButton-root': {
      textTransform: 'none',
    },
  },
}));`}
      </CodeBlock>

      <h2>Level 3: theme-level overrides for every instance</h2>

      <p>
        Everything so far changes one call site. When the answer is &quot;all of our buttons look
        like this&quot;, the right lever is the theme. v4 gives you two keys, and they do
        different jobs:
      </p>

      <CodeBlock language="javascript" title="v4 theme — overrides (styles) and props (defaults)">
{`import { createTheme } from '@material-ui/core/styles';

const theme = createTheme({
  // 1. STYLES: merged into each component's own style sheet, per slot.
  //    The keys under MuiButton are exactly the CSS API slots.
  overrides: {
    MuiButton: {
      root: {
        textTransform: 'none',      // kill SHOUTING BUTTONS globally
        borderRadius: 8,
      },
      containedPrimary: {
        boxShadow: 'none',
      },
      label: {
        fontWeight: 600,
      },
    },
    MuiOutlinedInput: {
      root: {
        '&$focused $notchedOutline': { borderWidth: 1 },
      },
      notchedOutline: {},
      focused: {},
    },
  },

  // 2. DEFAULT PROPS: same as writing the prop at every call site.
  //    No styling involved — this changes behaviour and defaults.
  props: {
    MuiButton:    { disableRipple: true, disableElevation: true },
    MuiTextField: { variant: 'outlined', size: 'small' },
    MuiTooltip:   { arrow: true },
  },
});`}
      </CodeBlock>

      <InfoBox variant="info" title="createTheme vs createMuiTheme — a real detail, easy to get wrong">
        <p style={{ marginBottom: 0 }}>
          <code>createMuiTheme</code> is the classic v4 name. But{' '}
          <strong>4.12 also exports <code>createTheme</code> as an alias</strong> — verified in{' '}
          <code>@material-ui/core/styles/index.d.ts</code> at 4.12.4, where both are exported from
          the same module. If your project is on 4.12.x you can rename to{' '}
          <code>createTheme</code> today and delete one line of migration work later. On earlier
          4.x, only <code>createMuiTheme</code> exists.
        </p>
      </InfoBox>

      <p>
        Two properties of theme <code>overrides</code> make them stronger than they look. They are
        <strong> merged into MUI&apos;s own sheet</strong>, not layered on top — so there is no
        second selector and no specificity fight at all; your{' '}
        <code>text-transform: none</code> is simply part of what{' '}
        <code>.MuiButton-root</code> means now. And they are keyed by{' '}
        <em>slot</em>, so everything you learned about the CSS API transfers directly, including
        the <code>$</code> syntax (note <code>notchedOutline: {'{}'}</code> and{' '}
        <code>focused: {'{}'}</code> declared empty in the example above for exactly that reason).
      </p>

      <h3>Which one is right?</h3>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Question</th>
            <th style={th}>Per-instance <code>classes</code></th>
            <th style={th}>Theme <code>overrides</code></th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}>Scope</td>
            <td style={td}>One call site</td>
            <td style={td}>Every instance in the ThemeProvider</td>
          </tr>
          <tr style={row}>
            <td style={td}>Cascade cost</td>
            <td style={td}>Adds a second class; must win on specificity</td>
            <td style={td}>None — merged into the original rule</td>
          </tr>
          <tr style={row}>
            <td style={td}>Discoverability</td>
            <td style={td}>Obvious at the usage</td>
            <td style={td}>Invisible at the usage; one file to read</td>
          </tr>
          <tr style={row}>
            <td style={td}>Failure mode</td>
            <td style={td}>Copy-pasted into 40 files, drifts</td>
            <td style={td}>Someone changes it and breaks a screen nobody tested</td>
          </tr>
          <tr>
            <td style={td}>Use when</td>
            <td style={td}>This one is genuinely special</td>
            <td style={td}>The design system says so</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="The third case: neither">
        <p style={{ marginBottom: 0 }}>
          If you find yourself repeating the same <code>classes</code> object at five call sites,
          you do not have an override problem — you have an undeclared component. Wrap it once,
          give it a name, and let the rest of the app import that. A{' '}
          <code>DangerButton</code> that owns its own styling is easier to find, easier to change,
          and easier to delete than five copies of a <code>classes</code> literal. Theme overrides
          are for &quot;all buttons&quot;; a wrapper is for &quot;this <em>kind</em> of button&quot;.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="The wrapper — a new variant, not an override">
{`const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    '&:hover': { backgroundColor: theme.palette.error.dark },
    '&$disabled': { backgroundColor: theme.palette.action.disabledBackground },
  },
  disabled: {},
}));

// Forward everything else through, and let callers still pass className.
export default function DangerButton({ className, ...props }) {
  const classes = useStyles();
  return (
    <Button
      variant="contained"
      className={className}
      classes={{ root: classes.root, disabled: classes.disabled }}
      {...props}
    />
  );
}`}
      </CodeBlock>

      <h2>Escape hatches, and what each one costs</h2>

      <p>
        Sometimes you are out of good options — a third-party wrapper, a legacy global stylesheet,
        a deadline. These work. Each one buys you a win and charges rent.
      </p>

      <h3>1. The double ampersand</h3>

      <CodeBlock language="javascript" title="Verified compile output">
{`const useStyles = makeStyles({
  doubled: {
    '&&': { color: 'crimson' },
  },
});

/* emits: */
.makeStyles-doubled-3.makeStyles-doubled-3 { color: crimson; }
/*  (0,2,0) from a single class on the element. Use '&&&' for (0,3,0). */`}
      </CodeBlock>

      <p>
        <strong>Cost:</strong> low, and this is the least bad hatch on the list. It is local,
        visible, and does not touch anything outside the rule. <strong>But</strong> it is
        unexplained to the next reader — always leave a comment saying which MUI selector you are
        outweighing, because otherwise someone will &quot;clean it up&quot;.
      </p>

      <h3>2. !important</h3>

      <CodeBlock language="javascript" title="Works, passed straight through by JSS">
{`const useStyles = makeStyles({
  bang: { color: 'orange !important' },
});

/* emits: .makeStyles-bang-4 { color: orange !important; } */`}
      </CodeBlock>

      <p>
        <strong>Cost:</strong> high, and it compounds. <code>!important</code> does not raise your
        specificity — it moves you into a different, higher cascade layer where the{' '}
        <em>only</em> way anyone can ever override you is another <code>!important</code>. You
        have not won the argument, you have escalated it, and every future state style on that
        property (hover, focus, disabled) is now dead. Reach for it when you are overriding
        something you do not control and cannot reach any other way.
      </p>

      <h3>3. StylesProvider injectFirst</h3>

      <CodeBlock language="jsx" title="Fixes the plain-CSS case, and only that case">
{`import { StylesProvider } from '@material-ui/core/styles';

// Forces MUI's <style> tags to be inserted at the TOP of <head>, so any
// stylesheet you ship — a .css file, Tailwind, a legacy global.css —
// comes later in source order and wins ties.
<StylesProvider injectFirst>
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
</StylesProvider>`}
      </CodeBlock>

      <p>
        <strong>Cost:</strong> it is app-wide and it only settles <em>ties</em>. If you mix it
        with <code>makeStyles</code>, your JSS sheets move to the front too — so this helps plain
        CSS files and does nothing for the <code>makeStyles</code> ordering problem from Failure
        Mode A. And it still will not beat <code>.MuiButton-root.Mui-disabled</code>, because that
        is a specificity loss, not an ordering loss. Set it once at the root, early, or not at all.
      </p>

      <h3>4. Nesting for specificity</h3>

      <CodeBlock language="javascript" title="Wrapping a class around a class">
{`const useStyles = makeStyles({
  panel: {
    '& .MuiButton-root': { textTransform: 'none' },   // (0,2,0)
  },
});`}
      </CodeBlock>

      <p>
        <strong>Cost:</strong> moderate. This is fine and often the honest answer for reaching a
        child you do not render. It becomes a problem when the nesting gets deep purely to win
        specificity — <code>&apos;&amp; &amp; &amp; .MuiButton-root&apos;</code> is a smell that
        the override belongs in the theme.
      </p>

      <h2>The decision tree</h2>

      <FlowChart
        title="Which override mechanism do I want?"
        chart={"graph TD\n  START[\"This MUI component must look different\"] --> SCOPE{\"How many instances?\"}\n  SCOPE -->|Every instance in the app| THEME[\"Theme overrides — MuiButton root\"]\n  SCOPE -->|A recurring KIND of button| WRAP[\"Wrap the component once and export it\"]\n  SCOPE -->|Genuinely just this one| WHERE{\"Which element inside it?\"}\n  WHERE -->|The outer element only| CN{\"Does it involve hover, focus or disabled?\"}\n  WHERE -->|An inner element — label, icon, outline| SLOT[\"classes prop, targeting that slot\"]\n  CN -->|No, flat properties only| CLASSNAME[\"className is fine here\"]\n  CN -->|Yes| SLOT\n  SLOT --> STATE{\"Styling a STATE?\"}\n  STATE -->|Yes| DOLLAR[\"Write amp-dollar-disabled AND pass classes.disabled\"]\n  STATE -->|No| DONE[\"Done\"]\n  DOLLAR --> DONE\n  CLASSNAME --> DONE\n  THEME --> DONE\n  WRAP --> DONE\n  DONE --> CHECK{\"Still not applying?\"}\n  CHECK -->|Inspect the element| DIAG[\"Read the winning rule in DevTools, then raise specificity deliberately\"]\n  style THEME fill:#1a3329\n  style SLOT fill:#1a3329\n  style WRAP fill:#1a3329\n  style DOLLAR fill:#1a2744\n  style DIAG fill:#3d2f14"}
      />

      <h2>The debugging loop that always works</h2>

      <InfoBox variant="success" title="Four steps, in order, every time">
        <ol style={{ marginBottom: 0 }}>
          <li>
            <strong>Inspect the element.</strong> Not the component — the actual DOM node whose
            paint is wrong. It is often an inner span you were not targeting.
          </li>
          <li>
            <strong>Find the property in the Styles panel</strong> and look at what is{' '}
            <em>not</em> struck through. That selector is your opponent. Read its specificity off
            the selector itself.
          </li>
          <li>
            <strong>Match its shape.</strong> If it is <code>.MuiX-root.Mui-disabled</code>, you
            need a two-class selector, which means the <code>classes</code> prop plus{' '}
            <code>&apos;&amp;$disabled&apos;</code> plus passing <code>classes.disabled</code>.
          </li>
          <li>
            <strong>Only then reach for a hatch.</strong> If you skipped straight to{' '}
            <code>!important</code>, you never learned which rule was winning — and you will be
            back tomorrow for the hover state.
          </li>
        </ol>
      </InfoBox>

      <InteractiveChallenge
        question={"This override applies at rest but the button reverts to grey the moment you hover it. Why?"}
        code={`const useStyles = makeStyles({
  mine: { backgroundColor: 'hotpink' },
});

<Button variant="contained" className={classes.mine}>Save</Button>`}
        options={[
          "MUI puts its class name after yours in the class attribute, so it wins",
          "The hover style comes from '.MuiButton-contained:hover', a (0,2,0) selector — your single class is (0,1,0) and cannot outweigh it regardless of injection order",
          "makeStyles does not support hover states, so MUI's default takes over",
          "className is ignored by MUI components; only the classes prop is read",
        ]}
        correctIndex={1}
        explanation={"Specificity, not order. A single class is (0,1,0); '.MuiButton-contained:hover' is a class plus a pseudo-class, (0,2,0), and it wins every time. Attribute order is irrelevant to the cascade, and className IS applied — it just loses. The fix is to match the shape: add '&:hover' inside your own rule so you emit a (0,2,0) selector too."}
        language="javascript"
      />

      <InteractiveChallenge
        question={"A developer writes this, and nothing changes when the button is disabled. There is no console warning. What is missing?"}
        code={`const useStyles = makeStyles({
  root: {
    color: 'green',
    '&$disabled': { color: 'purple' },
  },
  disabled: {},
});

<Button disabled classes={{ root: classes.root }}>Save</Button>`}
        options={[
          "The 'disabled' rule must contain at least one property; empty rules are dropped",
          "'&$disabled' should be '&.Mui-disabled' — the $ form only works inside theme overrides",
          "classes.disabled is never passed, so the generated disabled class never lands on the element and the two-class selector cannot match",
          "makeStyles needs the theme callback form for state selectors to compile",
        ]}
        correctIndex={2}
        explanation={"'&$disabled' compiles to '.makeStyles-root-1.makeStyles-disabled-2' — a two-class selector. BOTH classes have to be on the element. MUI only applies your generated disabled class if you hand it to the disabled slot, so the fix is classes={{ root: classes.root, disabled: classes.disabled }}. The empty rule is required and correct: it exists purely to give $disabled a name to resolve. And there is no warning because nothing is wrong — the CSS is valid, it just never matches."}
        language="javascript"
      />

      <h2>Carry this forward</h2>

      <ul>
        <li>
          <strong>Read the DOM first.</strong> Every override decision follows from which element
          and which selector is actually winning.
        </li>
        <li>
          <strong><code>className</code> is a tie-breaker bet</strong>, and the tie is broken by
          module evaluation order. Fine for flat properties on the outer element; unreliable for
          anything else.
        </li>
        <li>
          <strong>The <code>classes</code> prop is the intended v4 mechanism.</strong> The slot
          names live in the component&apos;s <code>*ClassKey</code> type — autocomplete is your
          documentation.
        </li>
        <li>
          <strong><code>$name</code> means &quot;the generated class for the rule called{' '}
          <code>name</code> in this sheet&quot;</strong> — declare the rule, and pass it through{' '}
          <code>classes</code>, or the selector never matches.
        </li>
        <li>
          <strong>One instance → <code>classes</code>. Every instance → theme{' '}
          <code>overrides</code>. A new kind of thing → a wrapper component.</strong>
        </li>
        <li>
          <strong>Escape hatches are loans.</strong> <code>&amp;&amp;</code> is cheap,{' '}
          <code>injectFirst</code> is a one-time app-wide decision, <code>!important</code> is
          expensive and charges interest on every future state style.
        </li>
      </ul>

      <p>
        Everything on this page describes v4&apos;s JSS engine. The next lesson follows the same
        component through the v5 rewrite — where <code>classes</code> survives,{' '}
        <code>overrides</code> becomes <code>styleOverrides</code>, and the <code>$</code> syntax
        disappears entirely because generated names stop being the problem.
      </p>
    </LessonLayout>
  );
}

export default MuiOverrides;
