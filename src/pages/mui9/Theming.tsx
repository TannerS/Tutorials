import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function Mui9Theming() {
  return (
    <LessonLayout
      title="Theming with CSS Variables & Color Schemes"
      sectionId="mui9"
      lessonIndex={3}
      prev={{ path: '/mui9/styling', label: 'Styling in v9 — styled() and sx' }}
      next={{ path: '/mui9/cheatsheet', label: '📋 MUI v9 Cheat Sheet' }}
    >
      <p>
        The theme in v9 does the same job it did in v4 — one object holding palette, typography,
        spacing and breakpoints — but it gained a capability that changes how dark mode works.
        It can emit its values as <strong>CSS custom properties</strong> instead of baking them
        into JavaScript-generated classes.
      </p>

      <p>
        That sounds like an implementation detail. It is not: it is the difference between a dark
        mode that flashes white on every page load and one that does not.
      </p>

      <h2>The Classic Theme, First</h2>

      <CodeBlock language="jsx" title="This still works and is still the default">
{`import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',                  // NOT "type" - see the silent-breaks lesson
    primary: { main: '#1976d2' },
  },
  spacing: 8,
  shape: { borderRadius: 8 },
  components: {                    // NOT "overrides"/"props"
    MuiButton: {
      styleOverrides: { root: { borderRadius: 99 } },
      defaultProps:   { disableRipple: true },
    },
  },
});

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>`}
      </CodeBlock>

      <p>
        With a plain <code>createTheme()</code>, values are resolved in JavaScript at render time.{' '}
        <code>theme.palette.primary.main</code> is the literal string{' '}
        <code>#1976d2</code>, and switching modes means re-rendering everything with a different
        theme object.
      </p>

      <h2>Turning On CSS Variables</h2>

      <CodeBlock language="jsx" title="One flag">
{`const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
});`}
      </CodeBlock>

      <p>Now the same values come out as variable references:</p>

      <CodeBlock language="text" title="Real output — theme.vars on 9.4.0">
{`vars.palette.primary.main        = var(--mui-palette-primary-main, #1976d2)
vars.palette.background.default  = var(--mui-palette-background-default, #fff)
vars.spacing                     = var(--mui-spacing, 8px)

colorSchemes:        light, dark
defaultColorScheme:  light

light background.default = #fff
dark  background.default = #121212`}
      </CodeBlock>

      <InfoBox variant="note" title="theme.vars only exists when you ask for it">
        <p>
          A plain <code>createTheme()</code> has no <code>vars</code> property at all — verified on
          9.4.0. So <code>theme.vars.palette.primary.main</code> throws a &quot;cannot read
          property of undefined&quot; error unless <code>cssVariables</code> is on. If you are
          writing a shared component library, read <code>theme.palette</code>, which works either
          way, or handle both.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Also note the fallback baked into each variable:{' '}
          <code>var(--mui-palette-primary-main, #1976d2)</code>. If the custom property is missing
          for any reason, the literal value still applies.
        </p>
      </InfoBox>

      <h2>Why This Fixes the Dark Mode Flash</h2>

      <p>
        With a JS-resolved theme, the browser cannot know the user&apos;s colour scheme until
        React has mounted and rendered. On a server-rendered or statically-hosted page that means
        the first paint uses the default theme, and the correct one swaps in a moment later — the
        white flash before dark mode appears.
      </p>

      <p>
        With CSS variables, both colour schemes are written into the stylesheet up front, and
        which one applies is decided by a CSS selector. The browser resolves it during the very
        first paint, before any JavaScript runs.
      </p>

      <FlowChart
        title="First paint, both strategies"
        chart={"graph TD\n  A[\"browser gets HTML\"] --> B{\"theme strategy?\"}\n  B -->|\"JS theme\"| C[\"paint with DEFAULT theme\"]\n  C --> D[\"JS loads, React mounts\"]\n  D --> E[\"re-render in dark\"]\n  E --> F[\"visible FLASH\"]\n  B -->|\"CSS variables\"| G[\"stylesheet already holds<br/>both schemes\"]\n  G --> H[\"selector picks one<br/>during first paint\"]\n  H --> I[\"correct colours immediately\"]\n  style F fill:#3b1a1a,stroke:#f87171\n  style I fill:#1a3329,stroke:#4ade80"}
      />

      <h2>Choosing How the Scheme Is Selected</h2>

      <p>
        The default strategy follows the operating system and offers no manual override. If you
        want a toggle in your UI, you have to pick a different selector — here is what each option
        actually generates:
      </p>

      <CodeBlock language="text" title="Real output — getColorSchemeSelector('dark') per strategy">
{`colorSchemeSelector          generated selector
---------------------------  ------------------------------------
'media'      (default)       @media (prefers-color-scheme: dark)
'class'                      .dark &
'data'                       [data-dark] &
'data-mui-color-scheme'      [data-mui-color-scheme="dark"] &`}
      </CodeBlock>

      <CodeBlock language="jsx" title="A theme that supports a manual toggle">
{`const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: { light: true, dark: true },
});

// you can also rename the variable prefix:
const branded = createTheme({
  cssVariables: { cssVarPrefix: 'app' },
  colorSchemes: { light: true, dark: true },
});
// -> var(--app-palette-primary-main, #1976d2)`}
      </CodeBlock>

      <InfoBox variant="warning" title="The default strategy cannot be toggled">
        <p>
          With <code>colorSchemeSelector: &apos;media&apos;</code> — the default — the scheme is a
          media query, and a media query cannot be overridden from JavaScript. A toggle button
          will appear to do nothing. If your design has a light/dark switch, you must choose{' '}
          <code>&apos;class&apos;</code> or one of the <code>data</code> strategies up front.
        </p>
      </InfoBox>

      <h2>Reading and Changing the Scheme</h2>

      <CodeBlock language="jsx" title="useColorScheme">
{`import { useColorScheme } from '@mui/material/styles';

function ModeToggle() {
  const { mode, setMode } = useColorScheme();

  // mode is undefined on the very first client render, before the
  // provider has resolved the stored/system preference. Rendering
  // different markup for undefined vs resolved is a hydration
  // mismatch waiting to happen - render a stable placeholder.
  if (!mode) return <Button disabled>Theme</Button>;

  return (
    <Button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
      {mode === 'dark' ? 'Light mode' : 'Dark mode'}
    </Button>
  );
}`}
      </CodeBlock>

      <p>
        For server rendering, MUI ships <code>InitColorSchemeScript</code> — verified present in
        9.4.0 both as a named export and as its own module at{' '}
        <code>@mui/material/InitColorSchemeScript</code>. It emits a tiny blocking script that
        sets the class or data attribute before the page paints, which is what keeps the toggle
        strategies flash-free too.
      </p>

      <h2>Using Theme Values in Styles</h2>

      <CodeBlock language="jsx" title="Prefer vars when they exist">
{`// resolves at render time to a literal colour
const A = styled('div')(({ theme }) => ({
  color: theme.palette.primary.main,        // "#1976d2"
}));

// emits a variable reference - the SAME class works in both schemes
const B = styled('div')(({ theme }) => ({
  color: theme.vars.palette.primary.main,   // "var(--mui-palette-primary-main, #1976d2)"
}));`}
      </CodeBlock>

      <p>
        The difference matters more than it looks. Version A bakes a literal colour into the
        generated class, so light and dark need <em>two different classes</em>. Version B emits one
        class whose value is resolved by the browser per scheme. Fewer classes, no re-serialization
        on theme switch, and the switch itself becomes a CSS-only operation.
      </p>

      <InfoBox variant="tip" title="Scheme-specific overrides, when you need them">
        <p>
          When a value genuinely has to differ beyond what the palette expresses, use the selector
          the theme gives you rather than hard-coding a media query — that way it keeps working if
          you change strategies later:
        </p>
        <CodeBlock language="jsx" title="theme.getColorSchemeSelector">
{`const Card = styled('div')(({ theme }) => ({
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  [theme.getColorSchemeSelector('dark')]: {
    boxShadow: '0 1px 3px rgba(0,0,0,0.8)',
  },
}));`}
        </CodeBlock>
      </InfoBox>

      <h2>The Theme Keys You Will Actually Touch</h2>

      <CodeBlock language="text" title="Verified defaults on 9.4.0">
{`palette.mode              'light'          ('type' is GONE)
palette.primary.main      #1976d2
palette.background.default  #fff / #121212 (light / dark)
spacing(2)                "16px"           (a STRING - v4 returned 16)
breakpoints.values        {xs:0, sm:600, md:900, lg:1200, xl:1536}
zIndex.appBar             1100             (unchanged since v4)
shape.borderRadius        4
components                {}               (was 'overrides' + 'props')`}
      </CodeBlock>

    </LessonLayout>
  );
}

export default Mui9Theming;
