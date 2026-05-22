import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function CSSVariables() {
  return (
    <LessonLayout
      title="CSS Variables"
      sectionId="css-mastery"
      lessonIndex={4}
      prev={{ path: "/css-mastery/animations", label: "Animations" }}
      next={{ path: "/css-mastery/patterns", label: "CSS Patterns" }}
    >
      <p>
        CSS Custom Properties (variables) are the foundation of modern design systems. They
        enable dynamic theming, live dark mode switching, component-scoped tokens, and
        JavaScript-driven styling — all with zero runtime overhead.
      </p>

      <FlowChart
        title="CSS Variables — Cascade and Inheritance"
        chart={"graph TD\n  A[:root — global scope] --> B[Component scope override]\n  B --> C[Element-level override]\n  A --> D[Media query override]\n  D --> E[prefers-color-scheme: dark]\n  A --> F[Data attribute override]\n  F --> G[data-theme=dark]\n  C --> H[var() reads nearest ancestor value]"}
      />

      <CodeBlock language="css" title="Defining and Using Custom Properties">
{`/* Custom properties are defined with -- prefix */
/* They cascade and inherit just like color or font-size */

:root {
  /* === COLOR TOKENS === */
  --color-primary:    #5b9cf6;
  --color-secondary:  #a78bfa;
  --color-success:    #4ade80;
  --color-warning:    #fbbf24;
  --color-danger:     #f87171;
  --color-info:       #60a5fa;

  /* Surface colors */
  --color-bg:         #0f1117;
  --color-surface:    #1a1d2e;
  --color-surface-2:  #252840;
  --color-border:     #2a2e42;

  /* Text colors */
  --color-text:       #e4e6f0;
  --color-text-muted: #9399b2;
  --color-text-dim:   #6c7293;

  /* === SPACING SCALE === */
  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-12: 3rem;      /* 48px */

  /* === TYPOGRAPHY === */
  --font-sans:    'Inter', system-ui, sans-serif;
  --font-mono:    'Fira Code', 'Cascadia Code', monospace;
  --text-xs:    0.75rem;
  --text-sm:    0.875rem;
  --text-base:  1rem;
  --text-lg:    1.125rem;
  --text-xl:    1.25rem;
  --text-2xl:   1.5rem;
  --text-3xl:   1.875rem;
  --leading-tight:  1.25;
  --leading-normal: 1.5;

  /* === RADII === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* === SHADOWS === */
  --shadow-sm:  0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md:  0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg:  0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px rgba(91, 156, 246, 0.3);

  /* === TRANSITIONS === */
  --transition-fast:   0.1s ease;
  --transition-base:   0.2s ease;
  --transition-slow:   0.3s ease;
  --transition-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* var(--name) reads the value. var(--name, fallback) provides a default */
.button {
  background: var(--color-primary);
  color: var(--color-text);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: background var(--transition-base);
}

/* Nested var() — chain fallbacks */
.text {
  color: var(--text-color, var(--color-text, #e4e6f0));
  /* tries --text-color, then --color-text, then hard-coded fallback */
}`}
      </CodeBlock>

      <CodeBlock language="css" title="Dark Mode — Two Approaches">
{`/* === APPROACH 1: prefers-color-scheme media query (automatic) === */
:root {
  /* Default: dark theme (matches this app's dark aesthetic) */
  --color-bg:      #0f1117;
  --color-surface: #1a1d2e;
  --color-text:    #e4e6f0;
  --color-border:  #2a2e42;
}
@media (prefers-color-scheme: light) {
  :root {
    --color-bg:      #ffffff;
    --color-surface: #f8fafc;
    --color-text:    #1a1a2e;
    --color-border:  #e2e8f0;
  }
}

/* === APPROACH 2: data attribute (user-controlled toggle) === */
:root {
  --color-bg:      #0f1117;
  --color-surface: #1a1d2e;
  --color-text:    #e4e6f0;
}
[data-theme="light"] {
  --color-bg:      #ffffff;
  --color-surface: #f8fafc;
  --color-text:    #1a1a2e;
}

/* JavaScript toggle */
// document.documentElement.dataset.theme = 'light';
// document.documentElement.dataset.theme = 'dark';

/* === APPROACH 3: Combine both (best UX) === */
/* Default to system preference, but allow manual override */
:root { color-scheme: dark; }           /* tells browser which scrollbars/inputs to render */
@media (prefers-color-scheme: dark) {
  :root { --color-bg: #0f1117; /* ... */ }
}
[data-theme="dark"]  { --color-bg: #0f1117; /* ... */ }
[data-theme="light"] { --color-bg: #ffffff; /* ... */ }

/* Component uses the variables — no changes needed when theme switches */
body {
  background: var(--color-bg);
  color: var(--color-text);
  /* All children inherit these variables automatically */
}`}
      </CodeBlock>

      <CodeBlock language="css" title="Component-Scoped Variables and calc()">
{`/* Variables can be scoped to a component — override :root values locally */
.card {
  --card-padding: var(--space-6);
  --card-bg: var(--color-surface);
  --card-radius: var(--radius-lg);

  background: var(--card-bg);
  padding: var(--card-padding);
  border-radius: var(--card-radius);
}

/* Variant: override the scoped variable, not the component styles */
.card--compact { --card-padding: var(--space-3); }
.card--dark    { --card-bg: var(--color-surface-2); }
.card--hero    { --card-padding: var(--space-12); }

/* === CALC() WITH VARIABLES === */
:root {
  --sidebar-width: 260px;
  --nav-height: 60px;
  --content-padding: var(--space-8);
}

.sidebar  { width: var(--sidebar-width); }
.main     { width: calc(100% - var(--sidebar-width)); margin-left: var(--sidebar-width); }
.content  { min-height: calc(100vh - var(--nav-height)); }
.full-bleed { margin-inline: calc(-1 * var(--content-padding)); }

/* Fluid value using calc + clamp + variable */
:root { --fluid-ratio: 0.5vw; }
h1 { font-size: clamp(1.75rem, calc(1.5rem + var(--fluid-ratio) * 4), 3.5rem); }

/* === :has, :is, :where, :not selectors (modern CSS) === */

/* :has — parent selector — style based on children */
.card:has(img) { padding: 0; }                      /* card with image: no padding */
.form:has(input:invalid) { border-color: red; }     /* form with invalid input */
.nav:has(.active) { background: var(--color-surface-2); } /* nav with active link */

/* :is — matches any of the listed selectors (specificity of highest arg) */
:is(h1, h2, h3, h4) { line-height: var(--leading-tight); }
:is(.card, .panel, .box):hover { border-color: var(--color-primary); }

/* :where — same as :is but specificity is always 0 (easy to override) */
:where(h1, h2, h3) { margin-top: 0; }             /* easy to override base reset */

/* :not — exclude elements */
.list li:not(:last-child) { border-bottom: 1px solid var(--color-border); }
button:not(:disabled):hover { background: var(--color-surface-2); }`}
      </CodeBlock>

      <CodeBlock language="javascript" title="JavaScript + CSS Variables Interaction">
{`// READ a CSS variable value
const root = document.documentElement;
const style = getComputedStyle(root);
const primaryColor = style.getPropertyValue('--color-primary').trim();
// Returns: "#5b9cf6"

// WRITE a CSS variable value (live update — all consumers react instantly)
root.style.setProperty('--color-primary', '#ff6b6b');
root.style.setProperty('--sidebar-width', '320px');

// REMOVE an override (reverts to :root definition)
root.style.removeProperty('--color-primary');

// React: theme toggle example
function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') ?? 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return { theme, toggle };
}

// Dynamic theming: set brand color, derive others
function applyBrandColor(hex) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', hex);
  // Use color-mix() in CSS to auto-derive variants:
  // --color-primary-light: color-mix(in srgb, var(--color-primary) 60%, white);
  // --color-primary-dark:  color-mix(in srgb, var(--color-primary) 80%, black);
}

// Read variable in JavaScript animation
const sidebar = document.querySelector('.sidebar');
const sidebarWidth = parseInt(
  getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width')
);
sidebar.animate([{ width: '0px' }, { width: sidebarWidth + 'px' }], { duration: 300 });`}
      </CodeBlock>

      <InteractiveChallenge
        question="What makes CSS custom properties more powerful than Sass or Less variables?"
        options={[
          "CSS variables compile faster than Sass",
          "CSS custom properties are live at runtime — they cascade, respond to media queries, can be changed by JavaScript, and are inherited by child elements. Sass/Less variables are resolved at compile time and baked into static CSS.",
          "CSS variables support more data types than Sass variables",
          "CSS variables work in all browsers while Sass requires a compiler"
        ]}
        correctIndex={1}
        explanation="Sass variables are processed at compile time — the output CSS contains hardcoded values with no variable names. CSS custom properties exist in the browser at runtime: they participate in the cascade (a child element can override them), respond to media queries and container queries, can be read and written by JavaScript instantly (enabling live theming), and are inherited by all descendants. This is what makes dark mode, dynamic theming, and component-scoped tokens possible."
      />

      <InteractiveChallenge
        question="What does the :has() selector enable that was previously impossible in CSS?"
        options={[
          "Selecting elements by their ID attribute",
          "Styling a parent element based on its children or descendants — a parent selector",
          "Selecting elements that are not visible on screen",
          "Chaining multiple class selectors together"
        ]}
        correctIndex={1}
        explanation=":has() is the long-awaited parent selector. Before it, you could only select elements based on their ancestors or siblings, never their descendants. Now you can write .card:has(img) to style a card differently when it contains an image, or .form:has(input:invalid) to highlight a form when any input is invalid. The browser support is excellent in modern browsers (Chrome 105+, Safari 15.4+, Firefox 121+)."
      />

      <InfoBox variant="tip" title="Design Token Best Practices">
        <p>
          Organize variables in two layers: <strong>primitive tokens</strong> (the actual values)
          and <strong>semantic tokens</strong> (what those values are used for):
        </p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
          <li>Primitive: <code>--blue-500: #5b9cf6</code></li>
          <li>Semantic: <code>--color-primary: var(--blue-500)</code></li>
          <li>Semantic: <code>--color-link: var(--blue-500)</code></li>
        </ul>
        <p style={{ marginTop: '0.5rem' }}>
          Dark mode only changes semantic tokens — primitives stay the same. Components always
          use semantic tokens, never primitives directly. This makes theme changes a single-line
          variable reassignment.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
