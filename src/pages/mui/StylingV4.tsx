import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function MuiStylingV4() {
  return (
    <LessonLayout
      title="Styling in v4 — makeStyles & withStyles"
      sectionId="mui"
      lessonIndex={1}
      prev={{ path: '/mui/intro', label: 'MUI v4 — What You Have, and Where It Sits' }}
      next={{ path: '/mui/theming', label: 'Theming & the Theme Object' }}
    >
      <p>
        This is the lesson that covers what you touch every day. In Material-UI v4, styling means
        writing a plain JavaScript object, handing it to <code>makeStyles</code> or{' '}
        <code>withStyles</code>, and getting back generated class names to put on elements. Everything
        below was checked against a real <code>@material-ui/core@4.12.4</code> install — including the
        CSS that JSS actually emits, which is more informative than any description of it.
      </p>

      <h2>makeStyles: The Hook Form</h2>
      <p>
        <code>makeStyles</code> is a factory. You call it <strong>once, at module scope</strong>, and it
        returns a custom React hook — conventionally named <code>useStyles</code>. Calling that hook
        inside a component gives you a <code>classes</code> object whose keys are your rule names and
        whose values are the generated class-name strings.
      </p>

      <CodeBlock language="jsx" title="The full shape" showLineNumbers>
{`import { makeStyles } from '@material-ui/core/styles';

// 1. MODULE SCOPE. Runs once, when the module is first evaluated.
//    The argument is either a plain style object, or a function of the theme.
const useStyles = makeStyles((theme) => ({
  root: {                                  // "root" is a RULE NAME you invent
    padding: theme.spacing(2),             // -> padding: 16px
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
  },
  title: {
    ...theme.typography.h6,                // spread a whole typography variant
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  danger: {
    color: theme.palette.error.main,
  },
}));

function Card({ title, children }) {
  // 2. INSIDE THE COMPONENT. This is a real hook call.
  const classes = useStyles();
  // classes === { root: 'makeStyles-root-1', title: 'makeStyles-title-2', danger: '...' }

  // 3. Apply via className. There is no automatic wiring — you place them yourself.
  return (
    <div className={classes.root}>
      <h2 className={classes.title}>{title}</h2>
      {children}
    </div>
  );
}`}
      </CodeBlock>

      <h3>Why it has to be a hook</h3>
      <p>
        The style object is a function of the theme, and the theme lives in <strong>React context</strong>{' '}
        — supplied by whatever <code>&lt;ThemeProvider&gt;</code> is above this component in the tree.
        There is no way to read context from module scope, so the theme cannot be resolved when{' '}
        <code>makeStyles</code> is called. It can only be resolved during render, from inside the
        component, which means the read has to go through <code>useContext</code>, which means the whole
        thing has to be a hook.
      </p>
      <p>
        That also explains a behaviour that otherwise looks arbitrary: nest a second{' '}
        <code>ThemeProvider</code> with a different palette, and the same <code>useStyles</code> hook
        produces different CSS for components underneath it, because the hook re-resolves the theme from
        wherever it is called.
      </p>

      <InfoBox variant="info" title="What the hook does on each render">
        On first use with a given theme, it compiles your style object to CSS, generates class names,
        and injects a <code>&lt;style&gt;</code> tag. On later renders it reuses that sheet and simply
        returns the cached <code>classes</code> object — so calling <code>useStyles()</code> in a
        component that re-renders sixty times a second is cheap. The expensive part is sheet{' '}
        <em>creation</em>, which is why where you call <code>makeStyles</code> matters enormously (see
        the gotchas at the end).
      </InfoBox>

      <h2>withStyles: The HOC Form</h2>
      <p>
        <code>withStyles</code> is the same engine wearing a higher-order-component costume. It takes
        the same style object and returns a function that wraps a component, injecting a{' '}
        <code>classes</code> prop.
      </p>

      <CodeBlock language="jsx" title="withStyles, both usages" showLineNumbers>
{`import { withStyles } from '@material-ui/core/styles';

const styles = (theme) => ({
  root: { padding: theme.spacing(2) },
  label: { fontWeight: 600 },
});

// --- Usage A: wrapping YOUR OWN component. classes arrives as a prop. ---
class Panel extends React.Component {
  render() {
    const { classes, children } = this.props;   // classes injected by the HOC
    return <div className={classes.root}>{children}</div>;
  }
}
export default withStyles(styles)(Panel);

// --- Usage B: wrapping a component you do NOT control, to restyle it. ---
// withStyles merges into that component's own classes prop, so you can target
// its internal slots by their documented rule names.
const BigButton = withStyles({
  root: { height: 56, textTransform: 'none' },
  label: { fontSize: '1.125rem' },              // MuiButton's "label" slot
})(Button);

<BigButton variant="contained" color="primary">Continue</BigButton>`}
      </CodeBlock>

      <h3>When withStyles is still the right choice</h3>
      <p>Three cases, and only three:</p>
      <ul>
        <li>
          <strong>Class components.</strong> Hooks cannot be called from a class, so{' '}
          <code>makeStyles</code> is simply unavailable. If the file has{' '}
          <code>class Foo extends React.Component</code>, it is <code>withStyles</code> or nothing.
        </li>
        <li>
          <strong>Restyling a component you do not control.</strong> Wrapping an imported{' '}
          <code>Button</code> in <code>withStyles</code> produces a new component with the overrides
          baked in, reusable everywhere. With <code>makeStyles</code> you would have to call the hook
          and spell out the <code>classes</code> prop at every call site.
        </li>
        <li>
          <strong>Exporting a styled component from a library or shared module.</strong> The consumer
          gets a component, not a hook they must remember to call.
        </li>
      </ul>
      <p>
        In function-component application code you control, <code>makeStyles</code> wins on every axis:
        no wrapper component in the tree, no prop-name collision on <code>classes</code>, no lost{' '}
        <code>ref</code> forwarding, and readable output in React DevTools.
      </p>

      <h2>createStyles: A TypeScript Helper, Not A Runtime Thing</h2>
      <p>
        <code>createStyles</code> is the identity function. It takes your object and returns the exact
        same object. It exists purely to fix a TypeScript inference problem.
      </p>

      <CodeBlock language="tsx" title="The inference problem it solves" showLineNumbers>
{`// THE PROBLEM: TypeScript widens the literal types in an object literal that is
// assigned to a variable. 'absolute' becomes string, and string is not assignable
// to CSSProperties['position'], which is a union of specific literals.
const styles = (theme: Theme) => ({
  root: {
    position: 'absolute',   // inferred as: string  -> type error downstream
    display: 'flex',        // inferred as: string  -> type error downstream
  },
});
withStyles(styles);         // ERROR: Type 'string' is not assignable to ...

// THE FIX: createStyles is typed to accept StyleRules, so the literals are
// checked against CSSProperties in place and keep their narrow types.
import { createStyles } from '@material-ui/core/styles';

const styles = (theme: Theme) => createStyles({
  root: {
    position: 'absolute',   // now checked as CSSProperties['position']. Fine.
    display: 'flex',
  },
});

// It is a no-op at runtime. This is the entire implementation:
//   function createStyles(styles) { return styles; }`}
      </CodeBlock>

      <InfoBox variant="tip" title="Do you need it?">
        <p>
          Only in TypeScript, and mostly only with the <em>separate variable</em> pattern above. Passing
          the object literal <strong>inline</strong> to <code>makeStyles</code> usually types fine
          without it, because the parameter&apos;s contextual type does the narrowing for you:
        </p>
        <p>
          <code>makeStyles(&#123; root: &#123; position: &apos;absolute&apos; &#125; &#125;)</code> —
          no <code>createStyles</code> needed.
        </p>
        <p>
          Many v4 codebases wrap everything in <code>createStyles</code> out of habit, from the era when
          the inference was weaker. It is harmless. Do not go delete it from a working file; do not
          reach for it reflexively in new code either. And note the alternative when you <em>do</em> hit
          the widening error: <code>as const</code>, or an explicit{' '}
          <code>: CSSProperties</code> annotation, both work too.
        </p>
      </InfoBox>

      <h2>Rules of the Hook</h2>
      <p>
        <code>useStyles</code> is a real hook and every Rule of Hooks applies to it verbatim.
      </p>

      <CodeBlock language="jsx" title="Where useStyles may and may not be called" showLineNumbers>
{`const useStyles = makeStyles({ a: { color: 'red' }, b: { color: 'blue' } });

// ✅ Top level of a function component
function Good() {
  const classes = useStyles();
  return <div className={classes.a} />;
}

// ✅ Top level of a custom hook
function useCardStyles() {
  const classes = useStyles();
  return classes;
}

// ❌ Conditionally — changes hook call ORDER between renders
function Bad({ isActive }) {
  if (isActive) {
    const classes = useStyles();   // React's hook list gets misaligned
  }
}

// ❌ Inside a loop, callback, or event handler
function AlsoBad({ items }) {
  const handleClick = () => {
    const classes = useStyles();   // not a render, no fiber to attach to
  };
  return items.map(() => useStyles());  // call count varies with data length
}

// ❌ In a class component. Not possible at all — use withStyles.

// ✅ The fix for the conditional case: always call it, decide afterwards.
function Fixed({ isActive }) {
  const classes = useStyles();
  return <div className={isActive ? classes.a : classes.b} />;
}`}
      </CodeBlock>

      <h3>Passing props into styles</h3>
      <p>
        <code>useStyles</code> accepts one argument, and whatever you pass is handed to any rule value
        written as a function. This is v4&apos;s dynamic-styles mechanism.
      </p>

      <CodeBlock language="jsx" title="Dynamic styles as functions of props" showLineNumbers>
{`const useStyles = makeStyles((theme) => ({
  bar: {
    height: 8,
    borderRadius: 4,
    transition: theme.transitions.create('width'),

    // A rule VALUE can be a function of the argument you pass to useStyles().
    width: (props) => props.percent + '%',
    backgroundColor: (props) =>
      props.percent > 80 ? theme.palette.error.main : theme.palette.primary.main,
  },

  // A whole RULE can also be a function, returning a style object.
  label: (props) => ({
    color: props.muted ? theme.palette.text.secondary : theme.palette.text.primary,
    fontWeight: props.muted ? 400 : 600,
  }),
}));

function ProgressBar(props) {
  // Pass the props object through. Common idiom: useStyles(props).
  const classes = useStyles(props);
  return (
    <div>
      <div className={classes.bar} />
      <span className={classes.label}>{props.percent}%</span>
    </div>
  );
}

<ProgressBar percent={92} muted />`}
      </CodeBlock>

      <InfoBox variant="warning" title="What dynamic styles actually emit — and what it costs">
        <p>
          Rendering the component above through <code>ServerStyleSheets</code> on a real v4 install
          produces <strong>two</strong> rules and <strong>two</strong> class names on the element:
        </p>
        <CodeBlock language="css" title="Verified JSS output">
{`/* static rule, shared by every instance */
.MyThing-root-1 { padding: 16px; }

/* dynamic rule, generated PER COMPONENT INSTANCE */
.MyThing-root-4 { color: blue; }`}
        </CodeBlock>
        <p>
          The element gets <code>class=&quot;MyThing-root-1 MyThing-root-4&quot;</code>. That is the
          cost model you need to know: a rule with a function value creates a{' '}
          <strong>separate stylesheet per mounted instance</strong>, updated on every render whose
          argument changed. For a handful of components it is invisible. For a thousand-row table with
          a dynamic rule per row, it is thousands of injected rules and a measurable slowdown — reach
          for an inline <code>style</code> prop there instead, which React diffs cheaply.
        </p>
      </InfoBox>

      <h2>clsx: Conditional Class Composition</h2>
      <p>
        <code>classes.root</code> is a string, and combining strings conditionally with template
        literals gets ugly fast — you end up with double spaces and stray{' '}
        <code>&quot;undefined&quot;</code> in your class attribute. The idiomatic v4 pairing is{' '}
        <strong>clsx</strong>, and you already have it: <code>clsx</code> is a direct dependency of{' '}
        <code>@material-ui/core@4.12.4</code>, which uses it internally.
      </p>

      <CodeBlock language="jsx" title="clsx in practice" showLineNumbers>
{`import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  root:     { padding: theme.spacing(1), border: '1px solid transparent' },
  selected: { borderColor: theme.palette.primary.main },
  disabled: { opacity: 0.5, pointerEvents: 'none' },
  compact:  { padding: theme.spacing(0.5) },
}));

function Row({ selected, disabled, density, className }) {
  const classes = useStyles();

  return (
    <div
      className={clsx(
        classes.root,                          // string: always included
        {                                      // object: key included if value truthy
          [classes.selected]: selected,
          [classes.disabled]: disabled,
        },
        density === 'compact' && classes.compact,  // falsy values are dropped
        className,                             // let callers add their own
      )}
    />
  );
}

// clsx accepts strings, objects, arrays, and ignores false/null/undefined/0/''.
// clsx('a', false, ['b', { c: true, d: false }])  ->  'a b c'`}
      </CodeBlock>

      <InfoBox variant="note" title="clsx vs classnames">
        Identical API. <code>classnames</code> is the older, larger package;{' '}
        <code>clsx</code> is the smaller reimplementation and is what MUI v4 depends on. If your repo
        already imports <code>classnames</code> somewhere, do not start a migration over it — they are
        interchangeable. Just do not import both in the same file.
      </InfoBox>

      <p>
        Note the <code>className</code> pass-through in that example. It matters: accepting a{' '}
        <code>className</code> prop and merging it last is what lets a parent override a child&apos;s
        styling — and JSS specifically orders its sheets so that a parent&apos;s styles can win over a
        child&apos;s. The comment in v4&apos;s own <code>indexCounter.js</code> spells this out:
      </p>

      <CodeBlock language="js" title="From @material-ui/styles/makeStyles/indexCounter.js (verbatim)">
{`// Global index counter to preserve source order.
// We create the style sheet during the creation of the component,
// children are handled after the parents, so the order of style elements
// would be parent->child.
// It is a problem though when a parent passes a className which needs to
// override any child's styles. StyleSheet of the child has a higher
// specificity, because of the source order. So our solution is to render
// sheets them in the reverse order child->sheet, so that parent has a
// higher specificity.
var indexCounter = -1e9;`}
      </CodeBlock>

      <h2>Class Name Generation</h2>
      <p>
        JSS generates the class names, and the format depends on the build and on whether the rule
        belongs to a named sheet. All of these were produced by an actual render:
      </p>

      <CodeBlock language="text" title="Verified class-name formats" showLineNumbers>
{`Development, anonymous sheet:
  makeStyles-root-1        <classNamePrefix>-<ruleName>-<counter>

Development, named sheet — makeStyles(styles, { name: 'MyThing' }):
  MyThing-root-1
  MyThing-label-3

MUI's own components (they use a name starting with "Mui"):
  MuiButton-root           <Name>-<ruleName>, GLOBAL and stable, no counter
  MuiButton-label
  MuiOutlinedInput-notchedOutline

Global state classes (a special case, no component prefix):
  Mui-focused  Mui-disabled  Mui-selected  Mui-error  Mui-checked

Production build:
  jss1  jss2  jss3          <productionPrefix><counter>`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never write .makeStyles-root-1 in a stylesheet or a test">
        The counter is assigned at sheet-creation order and shifts the moment anyone adds an import.{' '}
        <code>jss1</code> in production is even less stable. Target{' '}
        <code>classes.root</code> from JS, or add a <code>data-testid</code>. The{' '}
        <strong>only</strong> class names safe to select on are MUI&apos;s own global ones —{' '}
        <code>.MuiButton-root</code>, <code>.Mui-focused</code> — which are deliberately stable and
        counter-free.
      </InfoBox>

      <h2>The Specificity Problem</h2>
      <p>
        This is the one that costs an afternoon. You write a <code>makeStyles</code> rule to change a
        MUI component, apply it with <code>className</code>, and nothing happens. The class is on the
        element — you can see it in DevTools — but MUI&apos;s own rule wins.
      </p>
      <p>
        There are two separate failure modes here and they have different fixes, so diagnose before you
        reach for <code>!important</code>.
      </p>

      <h3>Failure mode 1: MUI&apos;s selector is more specific</h3>
      <p>
        MUI v4 does not style everything with a single class. Its own emitted CSS is full of multi-class
        and descendant selectors. These are real, taken from the CSS a v4{' '}
        <code>&lt;TextField variant=&quot;outlined&quot; /&gt;</code> injects:
      </p>

      <CodeBlock language="css" title="Actual MUI v4 output — note the specificity">
{`/* specificity 0,3,0 — three classes deep */
.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline { ... }

/* specificity 0,2,0 */
.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline { ... }
.MuiInputBase-root.Mui-disabled { ... }
.MuiButton-endIcon.MuiButton-iconSizeSmall { ... }

/* your override — specificity 0,1,0. It loses, and source order is irrelevant. */
.makeStyles-root-1 { border-color: red; }`}
      </CodeBlock>

      <p>
        Source order cannot rescue a 0,1,0 selector from a 0,3,0 one. You need more specificity. The two
        real fixes:
      </p>

      <CodeBlock language="jsx" title="Fix A — the $ruleName nesting syntax" showLineNumbers>
{`// $ruleName is JSS's reference-to-a-sibling-rule syntax. At compile time it is
// replaced by that rule's generated class name, producing a compound selector
// with genuinely higher specificity — no !important anywhere.
const useStyles = makeStyles((theme) => ({
  // The empty rule is REQUIRED. It exists so JSS generates a class name that
  // $focused can point at. Deleting it silently breaks the selector.
  focused: {},

  input: {
    color: theme.palette.text.primary,

    '&$focused': {                        // -> .MyThing-input-3.MyThing-focused-2
      color: theme.palette.error.main,    // specificity 0,2,0
    },
  },
}));

function Field() {
  const classes = useStyles();
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      className={clsx(classes.input, { [classes.focused]: focused })}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Verified compilation of $ruleName">
        <p>
          Compiling <code>&#123; focused: &#123;&#125;, label: &#123; &apos;&amp;$focused&apos;: &#123;
          color: &apos;red&apos; &#125; &#125; &#125;</code> through a real v4 render emits exactly:
        </p>
        <CodeBlock language="css">
{`.MyThing-label-3.MyThing-focused-2 { color: red; }`}
        </CodeBlock>
        <p>
          Two classes, one selector, no space between them. That is the mechanism — <code>$focused</code>{' '}
          resolved to the generated class name of the sibling <code>focused</code> rule. This is exactly
          how MUI itself builds <code>.Mui-focused</code>-style selectors internally.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Fix B — target MUI's internal slot from your rule" showLineNumbers>
{`// Write a descendant/compound selector against MUI's own stable class names.
// Your generated class is the anchor, so this beats MUI's rule on both
// specificity AND source order.
const useStyles = makeStyles((theme) => ({
  field: {
    // .MyThing-field-1 .MuiOutlinedInput-notchedOutline  -> 0,2,0
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.grey[400],
    },
    // .MyThing-field-1 .MuiOutlinedInput-root.Mui-focused .Mui...  -> 0,4,0
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.error.main,
    },
  },
}));

<TextField variant="outlined" className={classes.field} />

// Trade-off: this couples your CSS to MUI's internal DOM structure and class
// names. Those are documented per-component in v4 ("CSS" section of each API
// page) so it is a supported technique, not a hack — but it is the thing most
// likely to break on a version bump, since v5 changed class generation.`}
      </CodeBlock>

      <h3>Failure mode 2: ordering against non-JSS stylesheets</h3>
      <p>
        Different problem, different fix. If your override lives in a plain <code>.css</code> file, a
        CSS Module, or a utility framework like Tailwind, then specificity may be equal and the winner
        is decided by <strong>which stylesheet is later in the head</strong>. JSS injects at runtime,
        so MUI&apos;s <code>&lt;style&gt;</code> tags typically land <em>after</em> your bundled CSS
        link — and MUI wins ties you expected to win.
      </p>

      <CodeBlock language="jsx" title="StylesProvider injectFirst" showLineNumbers>
{`import { StylesProvider } from '@material-ui/core/styles';

// injectFirst inserts a comment node at the TOP of <head> and points JSS's
// insertionPoint at it, so all JSS <style> tags go BEFORE your own stylesheets.
// Result: your CSS file now wins equal-specificity ties.
ReactDOM.render(
  <StylesProvider injectFirst>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StylesProvider>,
  document.getElementById('root'),
);

// Verified constraints from v4's source — these log console errors:
//   - injectFirst + a custom insertionPoint together: not allowed
//   - injectFirst + a custom jss prop together:       not allowed
//
// The manual alternative, if you need finer control:
//   <head>
//     <link rel="stylesheet" href="/app.css" />
//     <!-- jss-insertion-point -->
//   </head>
// ...then pass a jss instance configured with that insertionPoint.`}
      </CodeBlock>

      <FlowChart
        title="My Override Is Not Applying — Diagnosis"
        chart={"graph TD\n  START[\"Class is on the element<br/>but the style loses\"] --> DEV{\"Inspect in DevTools.<br/>Is your rule struck through?\"}\n  DEV -->|\"Rule not present at all\"| MISSING[\"Never compiled: typo in<br/>the rule name, so<br/>classes.foo is undefined\"]\n  DEV -->|\"Struck through\"| WHO{\"What is the winning selector?\"}\n  WHO -->|\"A multi-class Mui selector\"| SPEC[\"Specificity loss\"]\n  WHO -->|\"Same specificity, from a<br/>plain CSS file or Tailwind\"| ORDER[\"Source-order loss\"]\n  SPEC --> FIXA[\"Fix A: nest with the<br/>dollar-ruleName syntax to get<br/>a two-class selector\"]\n  SPEC --> FIXB[\"Fix B: target MUI's own slot<br/>from inside your rule\"]\n  SPEC --> FIXC[\"Fix C: theme.overrides,<br/>set it globally instead\"]\n  ORDER --> FIXD[\"StylesProvider injectFirst<br/>moves JSS above your CSS\"]\n  MISSING --> FIXE[\"Check the rule name, and that<br/>useStyles is actually called\"]\n  style SPEC fill:#3b1a1a\n  style ORDER fill:#3d2f14\n  style FIXA fill:#1a3329\n  style FIXB fill:#1a3329\n  style FIXC fill:#1a2744\n  style FIXD fill:#1a3329"}
      />

      <InfoBox variant="note" title="The third fix, covered in the next-but-one lesson">
        If you are overriding the same component the same way in more than two places, stop patching per
        call site and set it once in the theme via <code>theme.overrides</code>. That is a global rule
        applied to every instance of that component in the app, and it has its own lesson:{' '}
        <a href="/mui/overrides">Overriding Component Styles</a>.
      </InfoBox>

      <h2>Nesting Syntax v4 Supports</h2>
      <p>
        JSS supports nested selectors through the <code>&amp;</code> parent reference, the same idea as
        Sass. These are the forms you will actually use:
      </p>

      <CodeBlock language="jsx" title="The nesting vocabulary" showLineNumbers>
{`const useStyles = makeStyles((theme) => ({
  focused: {},
  disabled: {},

  button: {
    color: theme.palette.text.primary,

    // --- Pseudo-classes and pseudo-elements: & is this rule's own class ---
    '&:hover':          { backgroundColor: theme.palette.action.hover },
    '&:active':         { transform: 'scale(0.98)' },
    '&:focus-visible':  { outline: '2px solid ' + theme.palette.primary.main },
    '&::after':         { content: '""', display: 'block' },

    // --- $ruleName: reference a sibling rule in THIS sheet ---
    '&$focused':  { borderColor: theme.palette.primary.main },
    '&$disabled': { opacity: 0.4 },

    // --- Descendants: reach into MUI's internal slots ---
    '& .MuiButton-label':  { fontWeight: 700 },
    '& .MuiSvgIcon-root':  { fontSize: 20 },

    // --- Combining them ---
    '&:hover .MuiButton-label': { textDecoration: 'underline' },
    '&$focused .MuiSvgIcon-root': { color: theme.palette.primary.main },

    // --- Media queries: raw, or from the theme's breakpoints ---
    '@media (max-width: 600px)':   { width: '100%' },
    [theme.breakpoints.down('sm')]: { width: '100%' },  // preferred

    // --- Sibling and child combinators ---
    '& + &':      { marginLeft: theme.spacing(1) },  // adjacent same-class
    '& > span':   { pointerEvents: 'none' },
  },
}));`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two nesting traps">
        <p>
          <strong>Omitting the <code>&amp;</code>.</strong> <code>&apos;:hover&apos;</code> without the
          ampersand is not valid nesting — JSS needs <code>&apos;&amp;:hover&apos;</code> to know where
          to splice the parent selector.
        </p>
        <p>
          <strong>Adding a space in <code>&apos;&amp;$focused&apos;</code>.</strong>{' '}
          <code>&apos;&amp; $focused&apos;</code> (with a space) means <em>a descendant</em> carrying
          that class, which is a completely different selector from{' '}
          <code>&apos;&amp;$focused&apos;</code> (the same element carrying both classes). This one is
          easy to introduce accidentally and produces silence rather than an error.
        </p>
      </InfoBox>

      <h2>Common v4 Gotchas</h2>

      <h3>1. makeStyles called inside a component — a real performance bug</h3>

      <CodeBlock language="jsx" title="The single worst mistake in v4 styling" showLineNumbers>
{`// 🔴 BROKEN. Looks harmless. Is not.
function Widget({ color }) {
  const useStyles = makeStyles({ root: { color } });  // NEW factory every render
  const classes = useStyles();
  return <div className={classes.root} />;
}
// Every render builds a brand-new stylesheet, generates brand-new class names,
// and injects another <style> tag. Renders in a loop and the head fills with
// thousands of tags. The element's class also changes identity every render,
// defeating any CSS transition and any memoisation downstream.
// It also breaks the Rules of Hooks in spirit: useStyles is a different hook
// function on each render, so nothing about it can be cached.

// 🟢 CORRECT. Factory at module scope, dynamic bit through props.
const useStyles = makeStyles({
  root: { color: (props) => props.color },
});

function Widget({ color }) {
  const classes = useStyles({ color });
  return <div className={classes.root} />;
}

// 🟢 ALSO CORRECT, and cheaper for a one-off value: skip JSS entirely.
function Widget({ color }) {
  return <div style={{ color }} />;
}`}
      </CodeBlock>

      <h3>2. Hook ordering</h3>
      <p>
        <code>useStyles()</code> occupies a slot in the component&apos;s hook list. Calling it after an
        early <code>return</code>, inside a condition, or in a variable-length loop desynchronises that
        list and produces React&apos;s <em>&quot;Rendered fewer hooks than expected&quot;</em> error —
        or worse, silently hands one hook&apos;s state to another. Call it unconditionally, at the top,
        before any early return.
      </p>

      <CodeBlock language="jsx" title="Early return is the sneaky one" showLineNumbers>
{`// 🔴 On the loading path, useStyles is never reached. Hook count differs
//    between renders as soon as isLoading flips.
function Panel({ isLoading, data }) {
  if (isLoading) return <Spinner />;
  const classes = useStyles();
  return <div className={classes.root}>{data}</div>;
}

// 🟢 All hooks first, branching after.
function Panel({ isLoading, data }) {
  const classes = useStyles();
  if (isLoading) return <Spinner />;
  return <div className={classes.root}>{data}</div>;
}`}
      </CodeBlock>

      <h3>3. Reading a rule name that does not exist</h3>
      <p>
        <code>classes.roott</code> is <code>undefined</code>, and{' '}
        <code>className=&#123;undefined&#125;</code> is silently valid JSX. No error, no warning, no
        style. When an override does nothing at all and the class is <em>absent</em> from the element
        (rather than struck through in DevTools), check the spelling first — it is far more often a typo
        than a specificity problem. TypeScript catches this if you type the hook; plain JS does not.
      </p>

      <h3>4. Order of className merging</h3>
      <p>
        <code>clsx(className, classes.root)</code> and <code>clsx(classes.root, className)</code> put
        the same two classes on the element. CSS does not care about attribute order — the winner is
        decided by specificity and stylesheet order, not by which name you wrote first. If you are
        relying on argument order to win a fight, you are not actually fixing anything; go back to the
        diagnosis chart above.
      </p>

      <InteractiveChallenge
        question={"You add className={classes.outline} to an outlined TextField to change its border color, and nothing changes. DevTools shows your class on the element, and shows your rule struck through, beaten by .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline. What is the correct fix?"}
        options={[
          "Add !important to the border-color declaration",
          "Move the makeStyles call inside the component so it is created later",
          "Write the override as a descendant selector anchored on your own class — '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline' — so your selector is more specific than MUI's",
          "Wrap the app in StylesProvider injectFirst",
        ]}
        correctIndex={2}
        explanation={"MUI's selector is 0,3,0; a bare .makeStyles-outline-1 is 0,1,0, so no amount of reordering helps — this is a specificity loss, not an ordering loss. Anchoring the same selector on your own class raises yours to 0,4,0 and it wins. !important works but escalates a war you will keep re-fighting. Moving makeStyles inside the component is the performance bug from the gotchas section and does not change specificity. injectFirst fixes ordering against non-JSS stylesheets, which is a different failure mode entirely."}
        language="jsx"
      />

      <InteractiveChallenge
        question={"In makeStyles({ focused: {}, label: { '&$focused': { color: 'red' } } }), why is the empty focused: {} rule required rather than removable dead code?"}
        options={[
          "It reserves the name so JSS does not warn about an unknown rule",
          "$focused compiles to the generated class name of the sibling 'focused' rule — with no such rule there is no class name to substitute, so the selector never forms",
          "Empty rules are how JSS marks a rule as dynamic",
          "It is a TypeScript requirement, and can be deleted in plain JavaScript",
        ]}
        correctIndex={1}
        explanation={"$ruleName is a compile-time reference to a sibling rule's generated class. The empty rule exists purely so JSS mints a class name (MyThing-focused-2) that $focused can resolve to, and that you can then apply conditionally with clsx. A real render confirms the output: .MyThing-label-3.MyThing-focused-2 { color: red; }. Delete the empty rule and the compound selector silently fails to materialise — no error, just no styling."}
        language="jsx"
      />

      <InfoBox variant="tip" title="Next">
        Every example above leaned on <code>theme.spacing</code>, <code>theme.palette</code>,{' '}
        <code>theme.breakpoints</code> and <code>theme.transitions</code> without explaining where any
        of it comes from. That is the next lesson:{' '}
        <a href="/mui/theming">Theming &amp; the Theme Object</a>.
      </InfoBox>
    </LessonLayout>
  );
}

export default MuiStylingV4;
