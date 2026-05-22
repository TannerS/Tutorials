import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Variables() {
  return (
    <LessonLayout
      title="Custom Properties & Modern CSS"
      sectionId="css-mastery"
      lessonIndex={4}
      prev={{ path: '/css-mastery/animations', label: 'Animations & Transitions' }}
      next={{ path: '/css-mastery/patterns', label: 'Layout Patterns & Recipes' }}
    >
      <h2>CSS Custom Properties</h2>
      <p>
        Custom properties are true runtime variables. Unlike Sass/Less variables that compile
        to static values, custom properties live in the browser — they cascade, inherit through
        the DOM, and can be read/written from JavaScript.
      </p>

      <CodeBlock language="css" title="Declaring & Using Custom Properties">
{`:root {
  --color-primary: #6366f1;
  --spacing-unit: 8px;
  --radius-md: 0.5rem;
}

.card {
  background: var(--color-surface, #1e1e2e);
  padding: calc(var(--spacing-unit) * 3);
  border-radius: var(--radius-md);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Preprocessor vs Custom Properties">
        Sass $variables resolve at compile time — the browser never sees them. CSS --variables
        are live in the CSSOM: changeable by media queries, overridden per-component, toggled
        via JS, and inspectable in DevTools. Use preprocessor vars for build-time constants;
        custom properties for anything the runtime touches.
      </InfoBox>

      <h2>Scoping, Inheritance & Fallbacks</h2>
      <p>
        Custom properties follow normal cascade rules. :root declarations are global; selector
        declarations scope to that subtree. Children inherit unless they redeclare the property.
        var() accepts nested fallbacks for component libraries with optional consumer tokens.
      </p>

      <CodeBlock language="css" title="Scoping & Nested Fallbacks">
{`:root { --color-brand: #6366f1; }

/* Component scope — only .sidebar subtree sees this override */
.sidebar { --color-brand: #ec4899; }
.sidebar .nav-link {
  color: var(--color-brand); /* #ec4899 inside sidebar, #6366f1 elsewhere */
}

/* Nested fallback chain */
.button {
  background: var(--btn-bg, var(--color-primary, #6366f1));
  /* Everything after the FIRST comma is fallback, so this works: */
  font-family: var(--icon-font, "Material Symbols", sans-serif);
}`}
      </CodeBlock>

      <h2>Theming System</h2>
      <p>
        Production theming uses semantic token layers: primitives feed semantic aliases, which
        components consume. This decouples design decisions from component code.
      </p>

      <CodeBlock language="css" title="Three-Layer Token Architecture">
{`/* Primitives — never used directly in components */
:root { --indigo-500: #6366f1; --gray-900: #0f172a; --gray-50: #f8fafc; }

/* Semantic tokens — map primitives to intent */
:root {
  --color-bg: var(--gray-50);
  --color-text: var(--gray-900);
  --color-primary: var(--indigo-500);
  --color-surface: white;
}

/* Component tokens — consume semantic layer */
.card {
  --card-bg: var(--color-surface);
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.75rem;
}`}
      </CodeBlock>

      <h2>Dark Mode Implementation</h2>
      <p>
        Combine prefers-color-scheme for system preference with a data attribute for manual
        override. Only semantic tokens change — every component adapts automatically.
      </p>

      <CodeBlock language="css" title="Dark Mode: System + Manual Toggle">
{`:root {
  --color-bg: #fff; --color-text: #1a1a2e;
  --color-surface: #f1f5f9; --color-primary: #6366f1;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f0f1a; --color-text: #e2e8f0;
    --color-surface: #1e1e2e; --color-primary: #818cf8;
  }
}

/* Manual override — higher specificity than :root */
[data-theme="dark"] {
  --color-bg: #0f0f1a; --color-text: #e2e8f0;
  --color-surface: #1e1e2e; --color-primary: #818cf8;
}
[data-theme="light"] {
  --color-bg: #fff; --color-text: #1a1a2e;
  --color-surface: #f1f5f9; --color-primary: #6366f1;
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Theme Toggle Logic">
{`function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const isDark = current === 'dark' ||
    (!current && matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}`}
      </CodeBlock>

      <h2>The :has() Selector</h2>
      <p>
        :has() selects an element based on what it <em>contains</em> — the &quot;parent
        selector&quot; CSS developers requested for two decades. It enables patterns that
        previously required JavaScript.
      </p>

      <CodeBlock language="css" title=":has() Practical Examples">
{`/* Card layout adapts to whether it contains an image */
.card:has(img) { grid-template-rows: 200px 1fr; }
.card:not(:has(img)) { grid-template-rows: 1fr; }

/* Form validation styling — parent reacts to child state */
.field:has(input:invalid) { --field-color: #ef4444; }
.field:has(input:valid) { --field-color: #22c55e; }
.field label { color: var(--field-color, #64748b); }

/* Nav: highlight parent when child link is current */
nav li:has(> a[aria-current="page"]) {
  background: var(--color-primary);
}

/* Lock scroll when dialog is open */
body:has(dialog[open]) { overflow: hidden; }`}
      </CodeBlock>

      <h2>:is() and :where()</h2>
      <p>
        Both group selectors to reduce repetition. Critical difference: :is() takes the
        specificity of its most specific argument; :where() always has zero specificity —
        ideal for resets and defaults that should be easy to override.
      </p>

      <CodeBlock language="css" title=":is() vs :where()">
{`/* :is() — specificity = (0,0,2) */
:is(article, section) :is(h1, h2, h3) { line-height: 1.2; }

/* :where() — specificity = (0,0,0), trivially overridable */
:where(ul, ol) { padding-left: 1.5rem; }
.compact-list { padding-left: 0.5rem; } /* wins easily */

/* Group all interactive focus styles */
:is(button, [role="button"], a):focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}`}
      </CodeBlock>

      <h2>Native CSS Nesting</h2>
      <p>
        CSS supports nesting natively now. The &amp; parent reference works like Sass. Key
        difference: native nesting requires &amp; before element selectors in some contexts.
      </p>

      <CodeBlock language="css" title="Native Nesting Syntax">
{`.card {
  background: var(--color-surface);
  padding: 1.5rem;

  &:hover { box-shadow: var(--shadow-lg); }
  &.featured { border: 2px solid var(--color-primary); }

  .title { font-size: 1.25rem; font-weight: 600; }
  & p { color: var(--color-text-muted); }

  /* Nested media queries scope to .card */
  @media (width < 768px) {
    padding: 1rem;
    .title { font-size: 1rem; }
  }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Nesting Depth Warning">
        Deep nesting (4+ levels) creates highly specific selectors that are hard to override.
        Keep nesting shallow — two levels is ideal, three is the practical max. The specificity
        is identical whether you nest or write flat selectors.
      </InfoBox>

      <h2>@layer — Cascade Layers</h2>
      <p>
        Cascade layers give explicit control over which styles win regardless of specificity.
        Earlier layers always lose to later layers. Unlayered styles beat all layered styles.
      </p>

      <CodeBlock language="css" title="Cascade Layers">
{`@layer reset, base, components, utilities;

@layer reset {
  *, *::before, *::after { margin: 0; box-sizing: border-box; }
}
@layer base {
  body { font-family: var(--font-sans); line-height: 1.6; }
}
@layer components {
  .btn { padding: 0.5rem 1rem; border-radius: var(--radius-md); }
}
@layer utilities {
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; }
}

/* Unlayered styles always win — use sparingly */`}
      </CodeBlock>

      <h2>@scope — Subtree Scoping</h2>
      <p>
        @scope limits styles to a DOM subtree with an optional lower boundary — true component
        encapsulation without Shadow DOM or CSS-in-JS naming conventions.
      </p>

      <CodeBlock language="css" title="@scope for Encapsulation">
{`/* Styles apply inside .media-card but stop at .user-content */
@scope (.media-card) to (.user-content) {
  img { border-radius: 0.5rem; width: 100%; object-fit: cover; }
  p { color: var(--color-text-muted); font-size: 0.875rem; }
}

@scope (.dashboard-widget) {
  :scope { container-type: inline-size; padding: 1rem; }
  .metric { font-size: 2rem; font-weight: 700; }
}`}
      </CodeBlock>

      <h2>color-mix() &amp; oklch Color Spaces</h2>
      <p>
        color-mix() blends colors in any color space — no manual hex calculation for hover
        states. oklch is perceptually uniform: equal lightness values look equally bright
        regardless of hue, unlike HSL where yellow appears far brighter than blue at the
        same &quot;lightness.&quot;
      </p>

      <CodeBlock language="css" title="color-mix() with oklch">
{`.button {
  --btn-color: var(--color-primary);
  background: var(--btn-color);
  &:hover { background: color-mix(in oklch, var(--btn-color) 85%, black); }
  &:disabled { background: color-mix(in oklch, var(--btn-color) 40%, white); }
}

:root {
  --brand: oklch(0.65 0.25 265);
  --brand-light: color-mix(in oklch, var(--brand) 30%, white);
  --brand-dark: color-mix(in oklch, var(--brand) 70%, black);
}`}
      </CodeBlock>

      <InfoBox variant="info" title="oklch Components">
        In oklch, &quot;l&quot; is true perceptual lightness (0-1), &quot;c&quot; is chroma/saturation, and
        &quot;h&quot; is hue angle (0-360). Use oklch for design systems where palette consistency
        matters — generating tints/shades from a single base color will look uniform across hues.
      </InfoBox>

      <h2>text-wrap: balance &amp; pretty</h2>
      <p>
        balance distributes words evenly across lines (ideal for headings — no more awkward
        single-word last lines). pretty prevents orphaned last words in paragraphs. Both
        previously required JavaScript.
      </p>

      <CodeBlock language="css" title="Better Typography">
{`h1, h2, h3 { text-wrap: balance; }  /* ~6 line limit for perf */
p { text-wrap: pretty; }             /* prevents orphaned last word */

article {
  max-width: 65ch;
  & :is(h1, h2, h3) { text-wrap: balance; }
  & p { text-wrap: pretty; }
}`}
      </CodeBlock>

      <h2>Scroll Snap</h2>
      <p>
        Native scroll-to-position behavior — no carousel libraries needed. Container defines
        snap type/axis; children declare alignment.
      </p>

      <CodeBlock language="css" title="Scroll Snap Carousel">
{`.carousel {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 1rem;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
.carousel-item {
  flex: 0 0 min(300px, 80vw);
  scroll-snap-align: start;
}

/* Full-page vertical snap */
.page-snap { height: 100vh; overflow-y: auto; scroll-snap-type: y proximity; }
.page-snap section { height: 100vh; scroll-snap-align: start; }`}
      </CodeBlock>

      <h2>content-visibility</h2>
      <p>
        content-visibility: auto skips rendering off-screen content entirely. For long pages,
        this dramatically cuts initial render time. contain-intrinsic-size keeps scrollbar
        height correct.
      </p>

      <CodeBlock language="css" title="content-visibility Optimization">
{`.page-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
.page-section:first-child { content-visibility: visible; }`}
      </CodeBlock>

      <h2>@property — Typed Custom Properties</h2>
      <p>
        @property registers custom properties with a type, initial value, and inheritance
        flag. This is what makes custom properties <em>animatable</em> — without it, the
        browser treats them as opaque strings it can&apos;t interpolate.
      </p>

      <CodeBlock language="css" title="@property for Animations">
{`@property --gradient-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.gradient-border {
  --gradient-angle: 0deg;
  background: conic-gradient(from var(--gradient-angle), #6366f1, #ec4899, #6366f1);
  transition: --gradient-angle 0.6s ease;
}
.gradient-border:hover { --gradient-angle: 180deg; }

@property --glow-opacity {
  syntax: "<number>";
  initial-value: 0;
  inherits: false;
}
.glow-card {
  box-shadow: 0 0 30px rgba(99, 102, 241, var(--glow-opacity));
  transition: --glow-opacity 0.3s ease;
}
.glow-card:hover { --glow-opacity: 0.6; }`}
      </CodeBlock>

      <InfoBox variant="success" title="@property Unlocks Gradient Animations">
        Without @property, gradients cannot animate — the browser sees them as strings with no
        way to interpolate between states. Registering angle/color stops as typed properties
        enables smooth animated gradient borders, pulsing glows, and color-space shifts.
      </InfoBox>

      <h2>Modern CSS Reset</h2>

      <CodeBlock language="css" title="Minimal Modern Reset">
{`*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }

body {
  min-height: 100dvh;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; color: inherit; }
h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; text-wrap: balance; }
p { overflow-wrap: break-word; text-wrap: pretty; }
#root, #__next { isolation: isolate; }
:where(ul, ol)[role="list"] { list-style: none; padding: 0; }`}
      </CodeBlock>

      <FlowChart
        title="Modern CSS Feature Decision Guide"
        chart={"graph TD\n  START[Styling decision] --> VARS{Dynamic value?}\n  VARS -->|Yes| CP[Custom Properties]\n  VARS -->|No| STATIC[Static value]\n  CP --> ANIM{Animate it?}\n  ANIM -->|Yes| PROP[@property typed registration]\n  ANIM -->|No| THEME{Theming?}\n  THEME -->|Yes| TOKEN[Semantic tokens + dark mode]\n  THEME -->|No| SCOPE{Scope issues?}\n  SCOPE -->|Yes| LAYER{Cascade conflict?}\n  LAYER -->|Yes| ATLAYER[@layer]\n  LAYER -->|No| ATSCOPE[@scope]\n  SCOPE -->|No| NEST[Native nesting]\n  START --> SEL{Complex selector?}\n  SEL -->|Parent-based| HAS[:has]\n  SEL -->|Grouping| ISWR[:is / :where]\n  style CP fill:#6366f1,color:#fff\n  style PROP fill:#ec4899,color:#fff\n  style TOKEN fill:#10b981,color:#fff\n  style HAS fill:#f59e0b,color:#000\n  style ATLAYER fill:#06b6d4,color:#fff"}
      />

      <InteractiveChallenge
        question={"What is the key difference between :is() and :where() in CSS?"}
        options={[
          ":is() only works with classes, :where() works with any selector",
          ":is() takes the specificity of its most specific argument, :where() has zero specificity",
          ":where() is faster because it skips specificity calculations",
          ":is() supports nesting but :where() does not"
        ]}
        correctIndex={1}
        explanation={"Both accept the same selectors and match identically. The only difference is specificity: :is(.foo, #bar) has specificity (1,0,0) from #bar, while :where(.foo, #bar) has (0,0,0). This makes :where() ideal for defaults that should be easy to override."}
        language="css"
      />

      <InteractiveChallenge
        question={"Why does @property make custom properties animatable?"}
        options={[
          "It adds !important to custom property declarations",
          "It pre-computes all intermediate values at parse time",
          "It declares the value type so the browser can interpolate between states",
          "It converts custom properties into standard CSS properties"
        ]}
        correctIndex={2}
        explanation={"Without @property, the browser treats custom properties as opaque strings — it cannot interpolate '0deg' to '180deg' because it doesn't know they're angles. The syntax descriptor declares the type, enabling smooth intermediate value computation during transitions."}
        language="css"
      />

      <InteractiveChallenge
        question={"In cascade layers, which styles have the highest priority?"}
        options={[
          "Styles in the first declared layer",
          "Styles in the last declared layer",
          "Unlayered styles not in any @layer",
          "Styles with the highest selector specificity"
        ]}
        correctIndex={2}
        explanation={"Unlayered styles always beat layered styles, regardless of specificity or layer order. Among layered styles, later-declared layers beat earlier ones. The order declaration (@layer reset, base, components, utilities) defines priority. Unlayered styles sit above all layers."}
        language="css"
      />
    </LessonLayout>
  );
}
