import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Sass() {
  return (
    <LessonLayout
      title="Sass &amp; SCSS Fundamentals"
      sectionId="css-mastery"
      lessonIndex={6}
      prev={{ path: '/css-mastery/variables', label: 'Custom Properties & Modern CSS' }}
      next={{ path: '/css-mastery/tokens', label: 'Design Tokens & Theming Architecture' }}
    >
      <p>
        Sass (via its SCSS syntax — a strict superset of CSS, unlike the old whitespace-sensitive
        indented syntax) is a compile-time preprocessor: everything below compiles down to plain CSS
        before it ever reaches the browser. It solves a different problem than custom properties do,
        which is why serious codebases run both side by side rather than picking one.
      </p>

      <h2>Sass Variables vs CSS Custom Properties</h2>
      <p>
        This is the single most important distinction in this lesson, and it&apos;s worth being
        precise about it: a Sass <code>$variable</code> is a compile-time text substitution — the
        browser never sees <code>$spacing-unit</code>, it only ever sees the number Sass replaced it
        with. A CSS <code>--custom-property</code> is a runtime value that lives in the CSSOM — the
        browser can read it, recompute it on a media query, and JavaScript can mutate it.
      </p>

      <CodeBlock language="scss" title="Same Intent, Two Different Mechanisms">
{`// Sass variable — resolved and ERASED at build time
$spacing-unit: 8px;
$color-primary: #6366f1;

.card {
  padding: $spacing-unit * 3;   // compiles to: padding: 24px;
  color: $color-primary;        // compiles to: color: #6366f1;
}

// CSS custom property — SHIPPED to the browser, live at runtime
:root {
  --spacing-unit: 8px;
  --color-primary: #6366f1;
}
.card {
  padding: calc(var(--spacing-unit) * 3); // still "calc(var(--spacing-unit) * 3)" at runtime
  color: var(--color-primary);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Complementary, not competing">
        Use Sass <code>$variables</code> for things that are truly fixed at build time and never need
        to change without a redeploy: breakpoint numbers fed into <code>@media</code>, magic numbers
        used in math, config that drives <code>@each</code> loops. Use CSS <code>--custom-properties</code>{' '}
        for anything a user, a theme switch, or JavaScript needs to touch after the page has loaded —
        colors that flip with dark mode, a sidebar width a user can drag, a value an animation
        interpolates. In a mature codebase they nest inside each other: a Sass function computes a
        derived value once, then writes it into a <code>:root</code> block as a custom property.
      </InfoBox>

      <CodeBlock language="scss" title="They Nest Inside Each Other in Practice">
{`// Sass computes the palette ONCE, at build time...
$brand-hues: (primary: 243, danger: 4, success: 142);

:root {
  // ...then WRITES it out as runtime custom properties the browser can theme-swap
  @each $name, $hue in $brand-hues {
    --color-#{$name}: oklch(0.6 0.2 #{$hue});
  }
}`}
      </CodeBlock>

      <h2>Nesting — and Its Pitfalls</h2>
      <p>
        Sass nesting mirrors your HTML structure, which reads nicely, but nesting compiles to
        descendant selectors — every level you nest adds a class to the compiled selector&apos;s
        specificity. Nesting is a readability tool, not a specificity-free zone.
      </p>

      <CodeBlock language="scss" title="Nesting Compiles to Flat, Increasingly Specific CSS">
{`.card {
  padding: 1rem;

  .header {
    font-weight: 600;

    .title {
      font-size: 1.25rem; // compiles to: .card .header .title { ... }
    }                     // specificity (0,0,3,0) — three classes deep
  }

  &:hover { box-shadow: var(--shadow-lg); }   // & = parent reference
  &.featured { border-color: var(--accent); } // .card.featured
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Over-Nesting = Specificity Creep">
        The classic mistake: nesting 4-5 levels deep because it visually matches the markup. The
        result is a <code>.sidebar .nav .list .item .link</code>-shaped selector that only a more
        specific (or nastier) selector can ever override, and that breaks the moment the markup
        structure changes. The Sass style guide convention that avoids this: <strong>cap nesting at
        2 levels</strong>, and never nest just to &quot;organize&quot; — nest only when the child
        rule genuinely only makes sense inside that parent (a <code>&amp;:hover</code>, a state
        class, a pseudo-element).
      </InfoBox>

      <h2>Mixins</h2>
      <p>
        A mixin is a reusable block of styles you can <code>@include</code> anywhere, optionally
        parameterized. Where a Sass function <em>returns a value</em>, a mixin <em>emits
        declarations</em> — that&apos;s the distinction between the next two sections.
      </p>

      <CodeBlock language="scss" title="Mixins — Reusable Declaration Blocks">
{`@mixin flex-center($direction: row, $gap: 0) {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: $direction;
  gap: $gap;
}

@mixin truncate($lines: 1) {
  @if $lines == 1 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.toolbar   { @include flex-center($gap: 0.75rem); }
.card-title { @include truncate(2); }`}
      </CodeBlock>

      <h2>Functions</h2>
      <p>
        A Sass <code>@function</code> takes arguments and <code>@return</code>s a single value — use
        it when you need a computed number, color, or string to plug into a property, not a whole
        block of declarations.
      </p>

      <CodeBlock language="scss" title="Functions — Compute a Value">
{`@use 'sass:math';

@function px-to-rem($px, $base: 16px) {
  // math.div, NOT $px / $base — see the warning below
  @return math.div($px, $base) * 1rem;
}

@function contrast-text($bg-lightness) {
  @if $bg-lightness > 60% { @return #111; }
  @return #fff;
}

.heading { font-size: px-to-rem(24px); } // 1.5rem
.badge   { color: contrast-text(85%); }  // #111`}
      </CodeBlock>

      <InfoBox variant="warning" title="/ is no longer division in Sass">
        <code>/</code> was always ambiguous — it&apos;s a separator in real CSS
        (<code>font: 16px/1.5</code>, <code>grid-area: 1 / 3</code>), so Sass could never tell
        &quot;divide&quot; from &quot;print a slash.&quot; Writing <code>$px / $base</code> now emits
        a <code>slash-div</code> deprecation warning and <strong>stops working entirely in Dart Sass
        2.0</strong>. Use <code>math.div($px, $base)</code> (after <code>@use &apos;sass:math&apos;</code>),
        which is unambiguous. The same applies to <code>if(...)</code>: Sass&apos;s function form is
        now deprecated in favour of CSS&apos;s own <code>if()</code>, so inside a{' '}
        <code>@function</code> reach for a plain <code>@if</code>/<code>@return</code> instead — it
        reads better and carries no deprecation.
      </InfoBox>

      <InfoBox variant="info" title="Mixin or function?">
        Ask what you&apos;re producing. Need multiple declarations (a media query block, vendor
        prefixes, a whole reset) → mixin. Need one value to slot into a single property → function.
        A common tell: if you find yourself writing <code>@include something()</code> as the entire
        right-hand side of a property, it should probably be a function instead.
      </InfoBox>

      <h2>@use / @forward vs the Deprecated @import</h2>
      <p>
        Sass&apos;s own <code>@import</code> is deprecated (Dart Sass has scheduled its removal) —
        it pollutes a single global namespace, re-evaluates the same partial every time it&apos;s
        imported twice, and gives no way to tell where a mixin or variable actually came from.
        Modern Sass uses the module system: <code>@use</code> to consume a partial, <code>@forward</code>{' '}
        to re-export it from an index file.
      </p>

      <CodeBlock language="scss" title="@import (deprecated) — Global Namespace, No Isolation">
{`// _variables.scss
$primary: #6366f1;

// button.scss
@import 'variables';     // $primary now dumped into GLOBAL scope
.btn { background: $primary; }

// card.scss ALSO imports variables.scss — re-parsed and re-evaluated
// again, and if two partials both define $primary, last one silently wins`}
      </CodeBlock>

      <CodeBlock language="scss" title="@use — the partial being loaded (_tokens.scss)">
{`// _tokens.scss
$primary: #6366f1;
@function spacing($n) { @return $n * 0.25rem; }`}
      </CodeBlock>

      <CodeBlock language="scss" title="@use — Namespaced, Loaded Once, Explicit (button.scss)">
{`// button.scss — every @use goes at the TOP, before any style rule.
// Sass enforces this: a @use after any style rule is a compile error,
// "@use rules must be written before any other rules."
@use 'tokens';            // loaded exactly once, namespaced as "tokens."
@use 'tokens' as t;       // alias the namespace if you want it shorter

.btn {
  background: tokens.$primary;
  padding: tokens.spacing(4);
}
.badge { background: t.$primary; }`}
      </CodeBlock>

      <InfoBox variant="warning" title="@use must come first">
        Every <code>@use</code> has to appear before the first style rule in the file (only{' '}
        <code>@charset</code>, comments, and variable declarations may precede it). Slipping one in
        further down — a very natural thing to do when you realise mid-file that you need another
        partial — fails the build outright with <em>&quot;@use rules must be written before any
        other rules&quot;</em>. Hoist it to the top of the file instead.
      </InfoBox>

      <CodeBlock language="scss" title="@forward — Building a Single Public Entry Point">
{`// styles/tokens/_color.scss
$primary: #6366f1;
$danger: #ef4444;

// styles/tokens/_spacing.scss
$unit: 8px;

// styles/tokens/_index.scss — the ONE file the rest of the app imports
@forward 'color';
@forward 'spacing';

// anywhere else in the app:
@use 'tokens';   // pulls in color AND spacing through one door
.alert { background: tokens.$danger; padding: tokens.$unit * 2; }`}
      </CodeBlock>

      <InfoBox variant="success" title="Why this matters at scale">
        <code>@use</code> namespacing means two partials can each define <code>$primary</code>{' '}
        without collision — you always write <code>tokens.$primary</code> vs <code>legacy.$primary</code>,
        so there&apos;s never an ambiguous &quot;which one wins&quot; the way there was with{' '}
        <code>@import</code>. It also loads each file exactly once no matter how many other partials
        <code>@use</code> it, so large stylesheets compile faster and predictably.
      </InfoBox>

      <h2>Partials &amp; Module Organization</h2>
      <p>
        A <em>partial</em> is a Sass file prefixed with an underscore (<code>_button.scss</code>) —
        the underscore tells Sass &quot;this is a fragment to be <code>@use</code>d, don&apos;t
        compile it to its own CSS file.&quot; A typical real-project layout groups partials by
        role, with an index (<code>_index.scss</code> or <code>styles.scss</code>) that
        <code>@forward</code>s the public ones and <code>@use</code>s the rest to assemble the
        final stylesheet.
      </p>

      <CodeBlock language="text" title="A Real Project's Sass Directory">
{`styles/
├── styles.scss              # entry point — the only file the bundler compiles
├── tokens/
│   ├── _index.scss          # @forward 'color'; @forward 'spacing'; @forward 'type';
│   ├── _color.scss
│   ├── _spacing.scss
│   └── _type.scss
├── mixins/
│   ├── _index.scss
│   ├── _layout.scss         # flex-center, grid-auto-fit, ...
│   └── _responsive.scss     # respond-above($bp), respond-below($bp)
├── base/
│   ├── _reset.scss
│   └── _typography.scss
└── components/
    ├── _button.scss
    ├── _card.scss
    └── _modal.scss`}
      </CodeBlock>

      <CodeBlock language="scss" title="styles.scss — Assembling Everything">
{`@use 'tokens';
@use 'mixins';
@use 'base/reset';
@use 'base/typography';
@use 'components/button';
@use 'components/card';
@use 'components/modal';

// tokens and mixins are re-usable namespaces; base/ and components/
// partials are consumed purely for their side effect (the CSS they emit)`}
      </CodeBlock>

      <FlowChart
        title="Sass Variable vs CSS Custom Property — Decision Guide"
        chart={"graph TD\n  Q[Need a reusable value?] --> RT{Changes after page load?}\n  RT -->|Yes: theme, JS, media query| CP[CSS Custom Property --var]\n  RT -->|No: fixed build-time constant| BT{Used in Sass logic? @each/@if/math}\n  BT -->|Yes| SV[Sass Variable $var]\n  BT -->|No, just a literal| SV\n  CP --> WRITE[Written once into :root via Sass @each if generated]\n  style CP fill:#1a2744\n  style SV fill:#1a3329"}
      />

      <InteractiveChallenge
        question={"Why is a CSS custom property (--color) able to support runtime dark-mode theming, while a Sass variable ($color) cannot on its own?"}
        options={[
          "Sass variables are always slower to compile than custom properties",
          "Custom properties live in the CSSOM and can be reassigned per-selector or via JS at runtime; Sass variables are substituted into static text at build time and no longer exist in the shipped CSS",
          "Custom properties only work inside media queries",
          "Sass variables can only hold color values, not numbers"
        ]}
        correctIndex={1}
        explanation={"A Sass variable is gone by the time CSS ships — every usage was replaced with its literal value during compilation. A custom property is still a named, live value in the browser, so redeclaring --color under [data-theme='light'] retheme's every var(--color) reference without recompiling anything."}
        language="scss"
      />

      <InteractiveChallenge
        question={"What's the main problem with Sass's deprecated @import that @use fixes?"}
        options={[
          "@import doesn't support nesting",
          "@import can't be used with mixins",
          "@import dumps everything into one global namespace and re-evaluates the same partial every time it's imported, with no way to tell where a variable came from",
          "@import only works with the indented Sass syntax, not SCSS"
        ]}
        correctIndex={2}
        explanation={"@import has no module isolation: two partials defining the same variable name silently collide, and importing the same partial from multiple files re-parses it each time. @use loads each file exactly once and namespaces everything behind the partial's name (tokens.$primary), removing the ambiguity entirely."}
        language="scss"
      />
    </LessonLayout>
  );
}
