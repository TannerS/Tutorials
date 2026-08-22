import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function DesignSystemTokens() {
  return (
    <LessonLayout
      title="Design System Tokens: A Carbon Deep Dive"
      sectionId="css-mastery"
      lessonIndex={8}
      prev={{ path: '/css-mastery/tokens', label: 'Design Tokens & Theming Architecture' }}
      next={{ path: '/css-mastery/style-inclusion', label: 'Style-Inclusion Methods' }}
    >
      <p>
        The previous lesson covered the three token tiers and light/dark redefinition in the
        abstract. This one takes a single, real block of CSS — the one below, which ships in every
        Carbon build — and explains every character of it, because that block is where two things
        that feel like magic actually happen: components nesting inside components and adapting to
        each other, and a theme switch that repaints an entire app instantly without touching a
        stylesheet.
      </p>

      <CodeBlock language="css" title="The block in question — from a compiled Carbon stylesheet">
{`.cds--layer-one, :root {
  --cds-layer: var(--cds-layer-01, #fff);
  --cds-layer-active: var(--cds-layer-active-01, #c6c6c6);
  --cds-layer-hover: var(--cds-layer-hover-01, #e8e8e8);
  --cds-layer-selected: var(--cds-layer-selected-01, #e0e0e0);
  --cds-field: var(--cds-field-01, #fff);
  --cds-border-subtle: var(--cds-border-subtle-00, #c6c6c6);
  --cds-border-strong: var(--cds-border-strong-01, #8d8d8d);
}`}
      </CodeBlock>

      <p>
        Nothing here is hand-written. It is generated output, and we can name the exact source file
        that produced it. Everything in this lesson was read out of the{' '}
        <a href="https://github.com/carbon-design-system/carbon" target="_blank" rel="noreferrer">
          carbon-design-system/carbon
        </a>{' '}
        repository rather than recalled, and every claim about how the browser resolves these
        values was measured in headless Chromium with <code>getComputedStyle</code>. Where a number
        appears below, it is a real reading.
      </p>

      <InfoBox variant="note" title="A free diagnostic: this snippet identifies your build's theme">
        Those hardcoded fallbacks are not arbitrary — they are the values of the theme your app
        compiled Carbon with. Two of them are decisive. In Carbon&apos;s <strong>white</strong>{' '}
        theme <code>field-01</code> is <code>#f4f4f4</code> and <code>border-subtle-00</code> is{' '}
        <code>#e0e0e0</code>; in <strong>g10</strong> they are <code>#ffffff</code> and{' '}
        <code>#c6c6c6</code>. The snippet says <code>#fff</code> and <code>#c6c6c6</code>, so this
        build was compiled with <strong>g10</strong> as its base theme, not white. That is the kind
        of fact this block quietly encodes once you can read it.
      </InfoBox>

      <h2>1. The Crux: Why Sass Variables Could Never Do This</h2>

      <p>
        This is almost certainly the thing that never clicked, and everything else follows from it.
        A Sass <code>$variable</code> and a CSS <code>--custom-property</code> look like the same
        idea with different syntax. They are not remotely the same idea. One is a text macro that
        stops existing before the browser ever sees the file; the other is a live, inherited
        property that the browser re-resolves per element.
      </p>

      <p>
        Here is a Sass file that tries to do what Carbon does — define a surface color, then
        override it inside a dark zone:
      </p>

      <CodeBlock language="scss" title="attempt.scss — trying to override a $variable for a subtree">
{`$layer: #ffffff;

.card { background: $layer; }

.dark-zone {
  $layer: #262626;
  background: $layer;
}

.dark-zone .card { background: $layer; }`}
      </CodeBlock>

      <p>
        Compiled with the same Dart Sass version this site depends on (1.102.0), that produces
        exactly this — no interpretation, this is the compiler output:
      </p>

      <CodeBlock language="css" title="Compiler output — measured, not paraphrased">
{`.card {
  background: #ffffff;
}

.dark-zone {
  background: #262626;
}

.dark-zone .card {
  background: #ffffff;
}`}
      </CodeBlock>

      <p>
        Look at the last rule. A card inside the dark zone is <strong>still white</strong>. The
        <code>$layer: #262626</code> reassignment was scoped to the <code>.dark-zone</code> block at
        compile time and had no effect on any rule written outside it. But notice the more
        fundamental problem first: <strong>there are no variables in the output at all.</strong>{' '}
        Three literal hex values. By the time this reaches the browser there is nothing named{' '}
        <code>$layer</code> anywhere — nothing to override, nothing to swap, nothing for a theme
        toggle to change. Sass variables are a feature of the <em>build</em>. They are gone before
        the page loads.
      </p>

      <p>
        A CSS custom property is a completely different animal. It is a real CSS property. It{' '}
        <strong>inherits</strong>, like <code>color</code> or <code>font-family</code>. It is
        resolved at <em>computed-value time</em>, per element, every time styles are recalculated.
        That means any element, anywhere in the tree, can redeclare it and change it for its entire
        subtree — and changing it later re-resolves everything downstream, live.
      </p>

      <CodeBlock language="css" title="The same intent, in custom properties">
{`:root      { --layer: #ffffff; }
.dark-zone { --layer: #262626; }        /* redefined for this subtree only */
.card      { background: var(--layer); }`}
      </CodeBlock>

      <p>
        Measured in Chromium, a <code>.card</code> at the top level computes{' '}
        <code>background-color: rgb(255, 255, 255)</code>, and a <code>.card</code> nested anywhere
        inside <code>.dark-zone</code> computes <code>rgb(38, 38, 38)</code> — from{' '}
        <strong>one</strong> <code>.card</code> rule, with no descendant selector written for the
        dark case. That single difference is the foundation the entire design system stands on.
      </p>

      <InfoBox variant="tip" title="The one-sentence version">
        Sass variables are compile-time text substitution and cannot be overridden per subtree or
        changed at runtime; CSS custom properties are inherited runtime properties, so redefining
        one on any element rewrites every value derived from it beneath that element. Every
        remaining trick in this lesson is a consequence of that sentence.
      </InfoBox>

      <h2>2. Reading <code>var(--cds-layer-01, #fff)</code> Correctly</h2>

      <p>
        Now the snippet itself. The instinct is to read it left to right, which makes it look
        circular and pointless — why define <code>--cds-layer</code> as <code>--cds-layer-01</code>{' '}
        instead of just using <code>--cds-layer-01</code> everywhere? Read it{' '}
        <strong>right to left</strong> and it turns into three deliberate, independent layers of
        defence.
      </p>

      <CodeBlock language="css" title="One declaration, three override points">
{`/*  the CONTEXTUAL token         the NUMBERED token      the HARDCODED fallback
    (what components read)       (what themes set)       (last resort)
          |                             |                       |
          v                             v                       v      */
    --cds-layer:                var(--cds-layer-01,           #fff);`}
      </CodeBlock>

      <p>
        Reading right to left:
      </p>

      <ul>
        <li>
          <strong><code>#fff</code> — the hardcoded fallback.</strong> This is used only if{' '}
          <code>--cds-layer-01</code> was never defined anywhere up the tree. In practice that means
          the theme layer failed to load. Its job is to keep a component <em>visible</em> rather
          than transparent in a broken build. It is a seatbelt, not a design decision.
        </li>
        <li>
          <strong><code>--cds-layer-01</code> — the numbered token.</strong> This is the{' '}
          <em>theme&apos;s</em> slot. Themes set numbered tokens: white, g10, g90, and g100 each
          assign a different hex to <code>--cds-layer-01</code>. Components are not supposed to read
          this directly.
        </li>
        <li>
          <strong><code>--cds-layer</code> — the contextual token.</strong> This is the{' '}
          <em>component-facing API</em>. Every Carbon component writes{' '}
          <code>background-color: var(--cds-layer)</code> and nothing else. It has no number in it,
          which is the entire point: the component does not know or care which level it is on.
        </li>
      </ul>

      <FlowChart
        title="Token Resolution Chain — how one pixel gets its color"
        chart={"graph TD\n  C[\"Component CSS<br/>background-color: var(--cds-layer)\"] --> S[\"Contextual token<br/>--cds-layer\"]\n  S --> D{\"Is --cds-layer declared<br/>on this element,<br/>or inherited from an ancestor?\"}\n  D -->|\"Yes — normal case\"| N[\"Its value is<br/>var(--cds-layer-01, fallback)\"]\n  D -->|\"No — nothing set it\"| INIT[\"Declaration is invalid<br/>background falls back to<br/>its initial value: transparent\"]\n  N --> Q{\"Is --cds-layer-01 defined<br/>on THIS element or inherited?\"}\n  Q -->|\"Yes\"| T[\"Theme layer supplies it<br/>g10 white / g100 dark gray\"]\n  Q -->|\"No — theme CSS missing\"| F[\"Hardcoded fallback used\"]\n  T --> P[\"Computed background-color\"]\n  F --> P\n  style S fill:#1a3329\n  style T fill:#1a2744\n  style F fill:#3d2f14\n  style INIT fill:#3b1a1a"}
      />

      <p>
        All three points are genuinely independent, and all three were measured. Building a page
        with the real Carbon declarations and reading back computed values:
      </p>

      <CodeBlock language="text" title="Measured in headless Chromium via getComputedStyle">
{`Override point 1 — set the contextual token directly on the element:
  <div class="tile" style="--cds-layer:#ff0000">
  computed --cds-layer     = #ff0000
  computed background-color = rgb(255, 0, 0)      <- the element wins

Override point 2 — leave --cds-layer alone, change the numbered token:
  --cds-layer-01 set to #262626 on the same element that declares --cds-layer
  computed --cds-layer     = #262626
  computed background-color = rgb(38, 38, 38)     <- the theme wins

Override point 3 — reference a token that was never defined:
  --cds-layer: var(--cds-nonexistent-token, #fff)
  computed --cds-layer     = #fff
  computed background-color = rgb(255, 255, 255)  <- the fallback fires`}
      </CodeBlock>

      <InfoBox variant="warning" title="Note what the computed value is NOT">
        In every reading above, <code>getComputedStyle</code> reports{' '}
        <code>--cds-layer</code> as a finished value like <code>#262626</code> — never as{' '}
        <code>var(--cds-layer-01, #fff)</code>. The chain is <em>already collapsed</em> by the time
        anything can inspect it. This is exactly why these systems are hard to debug, and we come
        back to it in the trade-offs section.
      </InfoBox>

      <h2>3. Contextual Layering — the &quot;components inside components&quot; answer</h2>

      <p>
        This is the most important section in the lesson, and it is the direct answer to how a Tile
        inside a Tile inside a Modal all end up with sensible, distinguishable backgrounds without
        any of them knowing the others exist.
      </p>

      <p>
        Carbon defines each surface as a <strong>set</strong> of three values, one per nesting
        depth. Here is the real source — this is the actual file, not a paraphrase:
      </p>

      <CodeBlock language="scss" title="packages/styles/scss/layer/_layer-sets.scss (excerpt)">
{`$-default-layer-sets: (
  layer: (
    theme.$layer-01,
    theme.$layer-02,
    theme.$layer-03,
  ),
  layer-hover: (
    theme.$layer-hover-01,
    theme.$layer-hover-02,
    theme.$layer-hover-03,
  ),
  field: (
    theme.$field-01,
    theme.$field-02,
    theme.$field-03,
  ),
  border-subtle: (
    theme.$border-subtle-00,
    theme.$border-subtle-01,
    theme.$border-subtle-02,
    theme.$border-subtle-03,
  ),
  border-strong: (
    theme.$border-strong-01,
    theme.$border-strong-02,
    theme.$border-strong-03,
  ),
  /* ...plus layer-active, layer-selected, layer-accent, field-hover, border-tile... */
);`}
      </CodeBlock>

      <p>
        That map explains a detail of the original snippet that otherwise looks like a typo. Every
        set starts at <code>01</code> except <code>border-subtle</code>, which starts at{' '}
        <code>00</code> and has four entries. So at level one,{' '}
        <code>--cds-border-subtle</code> resolves to <code>--cds-border-subtle-00</code> while{' '}
        <code>--cds-border-strong</code> resolves to <code>--cds-border-strong-01</code>. That
        asymmetry in the pasted CSS is not a mistake — it is the first element of a longer list.
      </p>

      <p>
        A tiny mixin walks those lists, and a tiny file emits it three times:
      </p>

      <CodeBlock language="scss" title="packages/styles/scss/layer/_layer-tokens.scss — the whole mixin">
{`/// Emit the layer tokens defined in $layer-sets for the given $level
/// @param {Number} $level
@mixin emit-layer-tokens($level) {
  @each $key, $layer-set in $layer-sets {
    $value: list.nth($layer-set, $level);
    @include custom-property.declaration($key, $value);
  }
}`}
      </CodeBlock>

      <CodeBlock language="scss" title="packages/styles/scss/_layer.scss — where your snippet comes from">
{`:root {
  @include layer-tokens.emit-layer-tokens(1);
}

.#{$prefix}--layer-one {
  @include layer-tokens.emit-layer-tokens(1);
}

.#{$prefix}--layer-two {
  @include layer-tokens.emit-layer-tokens(2);
}

.#{$prefix}--layer-three {
  @include layer-tokens.emit-layer-tokens(3);
}`}
      </CodeBlock>

      <p>
        There it is. Your pasted block is <code>emit-layer-tokens(1)</code>, and it appears twice in
        the Sass source — once for <code>:root</code>, once for <code>.cds--layer-one</code> — with
        byte-identical bodies. A CSS minifier then merged those two rules into the single
        comma-separated selector you saw. <code>.cds--layer-one, :root</code> is not something a
        human wrote; it is two separate rules that a build step folded together. (Selector order
        inside a selector list has no effect on the cascade — each selector is matched
        independently — so the fold is safe.)
      </p>

      <h3>Why nesting works</h3>

      <p>
        Put the two mechanisms together and the behaviour falls out for free:
      </p>

      <ol>
        <li>The component only ever writes <code>var(--cds-layer)</code> — no number.</li>
        <li>
          A wrapper with <code>class=&quot;cds--layer-two&quot;</code> redeclares{' '}
          <code>--cds-layer</code> to point at <code>--cds-layer-02</code> instead.
        </li>
        <li>
          Custom properties inherit, so <em>everything</em> inside that wrapper now reads the level-2
          value — including components written years apart by people who never spoke.
        </li>
      </ol>

      <FlowChart
        title="Layer nesting — the same .tile rule, three different results"
        chart={"graph TD\n  R[\":root sets --cds-layer to point at --cds-layer-01\"] --> W1[\"div.cds--layer-one\"]\n  W1 --> T1[\"div.tile<br/>background-color: var(--cds-layer)\"]\n  T1 --> M1[\"MEASURED: rgb(38, 38, 38)\"]\n  W1 --> W2[\"div.cds--layer-two<br/>redeclares --cds-layer to --cds-layer-02\"]\n  W2 --> T2[\"div.tile<br/>same CSS rule, unchanged\"]\n  T2 --> M2[\"MEASURED: rgb(57, 57, 57)\"]\n  W2 --> W3[\"div.cds--layer-three<br/>redeclares --cds-layer to --cds-layer-03\"]\n  W3 --> T3[\"div.tile<br/>same CSS rule, unchanged\"]\n  T3 --> M3[\"MEASURED: rgb(82, 82, 82)\"]\n  style M1 fill:#1a3329\n  style M2 fill:#1a3329\n  style M3 fill:#1a3329\n  style W2 fill:#1a2744\n  style W3 fill:#1a2744"}
      />

      <p>
        Those three measurements come from one <code>.tile</code> rule and three identical{' '}
        <code>&lt;div class=&quot;tile&quot;&gt;</code> elements. The only difference between them
        is which wrapper they happen to be sitting inside. The tile CSS was written once:
      </p>

      <CodeBlock language="css" title="The entire component contract">
{`.tile {
  background-color: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="This is the part that answers your question">
        A component nested inside another component does not &quot;know&quot; anything, and there is
        no coordination logic anywhere. The outer component drops a class on a wrapper element that
        redefines one inherited custom property; the inner component reads that property because it
        was always reading that property. Inheritance does the communication. Neither component
        contains a single line of code referring to the other.
      </InfoBox>

      <h3>The subtle bug this design has to work around</h3>

      <p>
        There is a trap here that Carbon hit in production, documented in a comment in{' '}
        <code>packages/styles/scss/_theme.scss</code> and filed as{' '}
        <a href="https://github.com/carbon-design-system/carbon/issues/11138" target="_blank" rel="noreferrer">
          carbon issue #11138
        </a>
        . It is worth understanding because it is the single most counter-intuitive thing about
        custom properties, and it explains why the theme machinery looks redundant.
      </p>

      <CodeBlock language="scss" title="The comment, verbatim, from Carbon's source">
{`// Note: we need to re-emit the contextual layer tokens as part of the theme
// mixin. Otherwise, the layer tokens are defined at the :root level and will
// not pick up the theme-specific, or zone-specific, value from the first
// layer.
//
// For example, in this situation:
//
//   :root {
//     --layer-one: #000000;
//     --layer: var(--layer-one);
//   }
//
// This will always evaluate to the value of --layer-one at the :root
// selector, even if --layer-one is redefined layer on in the cascade.
//
//   .zone {
//     --layer-one: #ffffff;
//   }
//
// Even though you would expect --layer to be redefined, it will keep the
// value defined at the :root level.`}
      </CodeBlock>

      <p>
        This is surprising enough that it needed measuring rather than trusting. Two cases, same
        theme values, one difference:
      </p>

      <CodeBlock language="css" title="Case D — a zone that sets the numbered token but does NOT re-emit">
{`:root {
  --cds-layer-01: #ffffff;
  --cds-layer: var(--cds-layer-01, #fff);
}
.g100-no-reemit {
  --cds-layer-01: #262626;    /* theme value set... */
                              /* ...but --cds-layer is NOT redeclared here */
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Measured result — the dark zone renders a white tile">
{`element #dt  (a .tile inside .g100-no-reemit)
  computed --cds-layer-01  = #262626      <- the theme value IS there
  computed --cds-layer     = #ffffff      <- but this did not re-resolve
  computed background-color = rgb(255, 255, 255)`}
      </CodeBlock>

      <p>
        The reason is precise, and once you see it you can predict this behaviour forever:{' '}
        <strong>substitution happens once, per element, at computed-value time.</strong> At{' '}
        <code>:root</code>, <code>--cds-layer</code> computed to the literal <code>#ffffff</code> by
        substituting whatever <code>--cds-layer-01</code> was <em>at that element</em>. Descendants
        that do not declare <code>--cds-layer</code> themselves inherit that{' '}
        <em>already-substituted</em> result. They inherit <code>#ffffff</code>, not the recipe{' '}
        <code>var(--cds-layer-01, #fff)</code>. Redefining the ingredient afterwards cannot change a
        meal that was already cooked.
      </p>

      <p>
        Now the contrast that isolates the rule. Set the numbered token on the{' '}
        <em>same element</em> that declares the contextual token — which is what Carbon&apos;s theme
        classes do — and it works perfectly:
      </p>

      <CodeBlock language="text" title="Measured — same override, applied at the same element as the declaration">
{`--cds-layer-01 set to #262626 on the same element carrying
the ":root { --cds-layer: var(--cds-layer-01, #fff) }" declaration:

  computed --cds-layer      = #262626
  computed background-color = rgb(38, 38, 38)     <- re-resolved correctly`}
      </CodeBlock>

      <p>
        Hence the rule Carbon follows everywhere: <strong>any selector that changes a numbered
        token must re-emit the contextual tokens in the same rule.</strong> That is why{' '}
        <code>emit-layer-tokens(1)</code> shows up inside the theme mixin and inside every theme
        zone class, and why the snippet you pasted appears to duplicate work it has already done at{' '}
        <code>:root</code>. It is not duplication. It is the fix.
      </p>

      <h2>4. Theme Switching, and Why It Is Instant</h2>

      <p>
        Carbon ships four themes: two light (<strong>white</strong>, <strong>g10</strong>) and two
        dark (<strong>g90</strong>, <strong>g100</strong>). Here are the real values for the tokens
        in your snippet, resolved from Carbon&apos;s checked-in DTCG theme files through the{' '}
        <code>@carbon/colors</code> palette:
      </p>

      <CodeBlock language="text" title="Real Carbon token values (resolved from packages/themes/src/dtcg/*.json)">
{`token                 white       g10         g90         g100
------------------------------------------------------------------
background            #ffffff     #f4f4f4     #262626     #161616
layer-01              #f4f4f4     #ffffff     #393939     #262626
layer-02              #ffffff     #f4f4f4     #525252     #393939
layer-03              #f4f4f4     #ffffff     #6f6f6f     #525252
layer-hover-01        #e8e8e8     #e8e8e8     #474747     #333333
layer-active-01       #c6c6c6     #c6c6c6     #6f6f6f     #525252
layer-selected-01     #e0e0e0     #e0e0e0     #525252     #393939
field-01              #f4f4f4     #ffffff     #393939     #262626
border-subtle-00      #e0e0e0     #c6c6c6     #525252     #393939
border-strong-01      #8d8d8d     #8d8d8d     #8d8d8d     #6f6f6f
text-primary          #161616     #161616     #f4f4f4     #f4f4f4`}
      </CodeBlock>

      <p>
        Two things are worth noticing. First, <strong>white and g10 are inverses of each other</strong>:
        white puts a white page background behind gray layers, g10 puts a gray background behind
        white layers. Same components, opposite stacking. Second, the layer values in a light theme
        alternate rather than march in one direction (g10 goes white, gray-10, white), while the
        dark themes step steadily lighter. Depth is communicated by contrast against the
        neighbouring surface, not by a fixed brightness ramp.
      </p>

      <p>
        A theme is emitted as a class that dumps every token as a literal value. This is the real
        generator from <code>packages/styles/scss/_zone.scss</code>:
      </p>

      <CodeBlock language="scss" title="packages/styles/scss/_zone.scss — how .cds--g100 is built">
{`$zones: (
  white: themes.$white,
  g10: themes.$g10,
  g90: themes.$g90,
  g100: themes.$g100,
) !default;

@each $name, $theme in $zones {
  .#{config.$prefix}--#{'' + $name} {
    background-color: custom-property.get-var('background');
    color: custom-property.get-var('text-primary');

    @each $key, $value in $theme {
      @if meta.type-of($value) == color {
        @include custom-property.declaration($key, $value);
      }
    }

    /* ...and the mandatory re-emit from section 3: */
    @include layer-tokens.emit-layer-tokens(1);
  }
}`}
      </CodeBlock>

      <p>
        Which compiles to something shaped like this:
      </p>

      <CodeBlock language="css" title="Compiled theme class (abridged)">
{`.cds--g100 {
  background-color: var(--cds-background);
  color: var(--cds-text-primary);
  --cds-background: #161616;
  --cds-layer-01: #262626;
  --cds-layer-02: #393939;
  --cds-layer-03: #525252;
  --cds-border-subtle-00: #393939;
  --cds-text-primary: #f4f4f4;
  /* ...every other color token... */

  /* the re-emit, without which none of the above would reach components: */
  --cds-layer: var(--cds-layer-01, #fff);
  --cds-border-subtle: var(--cds-border-subtle-00, #c6c6c6);
}`}
      </CodeBlock>

      <p>
        Switching themes means changing which of those classes is on an element. Nothing is
        recompiled, no stylesheet is edited, no CSS is fetched — all four theme classes were already
        in the bundle. Measured before and after flipping the token values on the root element, with
        the tiles from section 3 left completely untouched:
      </p>

      <CodeBlock language="text" title="Measured — one root-level change, three components repaint">
{`before:  tile L1 rgb(255, 255, 255)   tile L2 rgb(244, 244, 244)   tile L3 rgb(255, 255, 255)
after :  tile L1 rgb(38, 38, 38)      tile L2 rgb(57, 57, 57)      tile L3 rgb(82, 82, 82)`}
      </CodeBlock>

      <p>
        It is instant because it is not a rebuild — it is a style recalculation, the same operation
        the browser performs when you add any class to any element. The components did not
        re-render, were not notified, and contain no theme-awareness whatsoever. They read{' '}
        <code>var(--cds-layer)</code> before and they read <code>var(--cds-layer)</code> after.
      </p>

      <h3>Scoped theming falls out for free</h3>

      <p>
        Because the theme is a class rather than a global mode, putting it on a <code>div</code>{' '}
        instead of <code>&lt;html&gt;</code> gives you a dark panel inside a light page with no
        additional machinery. This is the same mechanism, applied lower in the tree:
      </p>

      <CodeBlock language="html" title="A dark island in a light page">
{`<body>                                  <!-- light: g10 tokens from :root -->
  <div class="cds--g100 cds--layer-one"> <!-- dark from here down -->
    <div class="tile">dark tile</div>
    <div class="cds--layer-two">
      <div class="tile">dark tile, one level deeper</div>
    </div>
  </div>
</body>`}
      </CodeBlock>

      <CodeBlock language="text" title="Measured — layering still steps correctly inside the scoped theme">
{`.tile directly in .cds--g100
  computed --cds-layer      = #262626
  computed background-color = rgb(38, 38, 38)

.tile inside .cds--layer-two inside .cds--g100
  computed --cds-layer-01   = #262626    <- inherited from the theme zone
  computed --cds-layer      = #393939    <- but points at 02, per the wrapper
  computed background-color = rgb(57, 57, 57)`}
      </CodeBlock>

      <p>
        The two mechanisms compose without knowing about each other: the theme zone decides{' '}
        <em>what</em> the numbered tokens mean, the layer wrapper decides <em>which</em> numbered
        token the contextual token points at.
      </p>

      <h3>The discipline that makes all of it work</h3>

      <p>
        Every bit of this depends on one rule that is trivially easy to break:{' '}
        <strong>a component must never write a literal color.</strong> A component that hardcodes{' '}
        <code>#fff</code> has permanently opted out of theming, and no amount of correct token
        infrastructure elsewhere can save it. Measured, inside a fully correct dark zone:
      </p>

      <CodeBlock language="text" title="Measured — the token is right there and the component ignores it">
{`.tile-hardcoded { background-color: #ffffff; }   <- the offending rule

element inside .cds--g100:
  computed --cds-layer      = #262626    <- the correct dark value IS available
  computed background-color = rgb(255, 255, 255)   <- and is simply not used`}
      </CodeBlock>

      <InfoBox variant="danger" title="This is the whole failure mode of design systems">
        Nothing errors. Nothing warns. The build passes, the tests pass, and the component looks
        perfect in the theme its author happened to be using. It only breaks for the users on the
        other theme, and only visually. This is why teams enforce &quot;no literal colors in
        component CSS&quot; with lint rules rather than code review — it is invisible to every other
        check.
      </InfoBox>

      <h2>5. What a Component Library Actually Ships</h2>

      <p>
        This explains why importing one stylesheet was enough. The library is split into three
        pieces that meet only through token names:
      </p>

      <ul>
        <li>
          <strong>Component CSS</strong> authored strictly against contextual tokens.
          Carbon&apos;s real Tile stylesheet contains lines like{' '}
          <code>background-color: $layer;</code> and <code>background: $layer-hover;</code> — and{' '}
          <code>$layer</code> there is a Sass variable whose <em>value is the string</em>{' '}
          <code>var(--cds-layer)</code>. Sass is used only to spell the custom property, never to
          hold a color.
        </li>
        <li>
          <strong>A theme layer</strong> that supplies values for the numbered tokens — the{' '}
          <code>.cds--white</code> / <code>.cds--g10</code> / <code>.cds--g90</code> /{' '}
          <code>.cds--g100</code> classes plus the <code>:root</code> defaults.
        </li>
        <li>
          <strong>Layer machinery</strong> that maps contextual tokens onto numbered tokens at each
          nesting depth.
        </li>
      </ul>

      <p>
        The Sass-to-custom-property bridge is worth seeing, because it is the thing that makes
        &quot;use Sass but stay themeable&quot; possible. From{' '}
        <code>packages/styles/scss/utilities/_custom-property.scss</code>:
      </p>

      <CodeBlock language="scss" title="The bridge — a Sass function that emits a var() call, not a color">
{`@function get-var($name, $fallback: false) {
  @if $fallback {
    @return var(--#{config.$prefix}-#{$name}, #{$fallback});
  }
  @return var(--#{config.$prefix}-#{$name});
}

@mixin declaration($name, $value) {
  #{get-name($name)}: #{$value};
}`}
      </CodeBlock>

      <p>
        And the generator that decides whether fallbacks are baked in at all, from{' '}
        <code>packages/themes/style-dictionary/formats/scss-tokens.js</code>:
      </p>

      <CodeBlock language="javascript" title="Where the #fff in your snippet actually comes from">
{`t.IfStatement({
  test: 'config.$use-fallback-value == false',
  consequent: '@return var(--#{config.$prefix}-#{$token})',
  alternate:  '@return var(--#{config.$prefix}-#{$token}, #{theme.get($token)})',
})`}
      </CodeBlock>

      <p>
        <code>theme.get($token)</code> reads from the theme your app compiled with — which is how we
        identified g10 at the top of this lesson. And{' '}
        <code>packages/themes/scss/_config.scss</code> exposes the switch:{' '}
        <code>$use-fallback-value: true !default;</code>. Set it to <code>false</code> and every
        fallback disappears from your bundle, shrinking it at the cost of the seatbelt.
      </p>

      <h3>The React side is thinner than you would guess</h3>

      <p>
        Carbon&apos;s <code>&lt;Layer&gt;</code> component does not compute colors. It tracks a
        number in React context and turns it into a class name. This is the real implementation,
        condensed:
      </p>

      <CodeBlock language="tsx" title="packages/react/src/components/Layer/index.tsx (condensed from source)">
{`export const levels = ['one', 'two', 'three'] as const;
export const LayerContext = React.createContext<LayerLevel>(1);

const contextLevel = React.useContext(LayerContext);
const level = overrideLevel ?? contextLevel;
const className = cx(prefix + '--layer-' + levels[level], customClassName);

// the next Layer down renders one level deeper, clamped at three
const value = clamp(level + 1, MIN_LEVEL, MAX_LEVEL);

return (
  <LayerContext.Provider value={value}>
    <BaseComponent className={className}>{children}</BaseComponent>
  </LayerContext.Provider>
);`}
      </CodeBlock>

      <p>
        React context carries the depth; CSS inheritance carries the colors. And the{' '}
        <code>&lt;Theme&gt;</code> component does the equivalent for themes — note the last line,
        which is the section-3 re-emit rule showing up in the component layer:
      </p>

      <CodeBlock language="tsx" title="packages/react/src/components/Theme/index.tsx (excerpt from source)">
{`const className = cx(customClassName, {
  [prefix + '--white']: theme === 'white',
  [prefix + '--g10']:   theme === 'g10',
  [prefix + '--g90']:   theme === 'g90',
  [prefix + '--g100']:  theme === 'g100',
  [prefix + '--layer-one']: true,   // ALWAYS applied: a new theme resets to layer one
});`}
      </CodeBlock>

      <p>
        That unconditional <code>layer-one</code> is deliberate. Entering a new theme scope should
        restart the layering from the base surface — otherwise a dark panel dropped three levels
        deep in a light page would start at level three of the dark theme and look wrong.
      </p>

      <InfoBox variant="info" title="Why one import is enough">
        Because the three pieces never reference each other directly, you get override points the
        library never had to anticipate. Want every card in your app one shade darker? Redefine{' '}
        <code>--cds-layer-01</code> in your own CSS, after Carbon&apos;s. Want one section themed
        differently? Add a theme class to a wrapper. Want one single component changed? Set{' '}
        <code>--cds-layer</code> on that element. None of these require forking the library or
        writing a selector that fights Carbon&apos;s specificity, because you are not overriding
        rules — you are supplying inputs.
      </InfoBox>

      <h2>6. Build a Minimal Version You Could Actually Use Tomorrow</h2>

      <p>
        Carbon&apos;s system is large because it serves many products across many teams. The{' '}
        <em>architecture</em> is about thirty lines. Here it is in full — primitives, a theme layer,
        contextual layer classes, and components:
      </p>

      <CodeBlock language="css" title="A complete miniature design-token system">
{`/* 1. PRIMITIVES — raw palette, no meaning. Nothing outside tier 2 reads these. */
:root {
  --gray-0: #ffffff; --gray-10: #f4f4f4; --gray-20: #e0e0e0; --gray-30: #c6c6c6;
  --gray-70: #525252; --gray-80: #393939; --gray-90: #262626; --gray-100: #161616;
}

/* 2. THEME — numbered tokens. This is the ONLY tier that names literal colors.
      Note the last two lines: the mandatory re-emit from section 3. */
:root, .theme-light {
  --surface-01: var(--gray-0);
  --surface-02: var(--gray-10);
  --surface-03: var(--gray-20);
  --border-subtle-01: var(--gray-30);
  --text-primary: var(--gray-100);

  --surface: var(--surface-01, #ffffff);
  --border-subtle: var(--border-subtle-01, #c6c6c6);
}

.theme-dark {
  --surface-01: var(--gray-90);
  --surface-02: var(--gray-80);
  --surface-03: var(--gray-70);
  --border-subtle-01: var(--gray-70);
  --text-primary: var(--gray-10);

  --surface: var(--surface-01, #ffffff);        /* re-emit, or dark breaks */
  --border-subtle: var(--border-subtle-01, #c6c6c6);
}

/* 3. CONTEXTUAL — put these on wrappers to step the nesting depth. */
.layer-1 { --surface: var(--surface-01, #ffffff); }
.layer-2 { --surface: var(--surface-02, #f4f4f4); }
.layer-3 { --surface: var(--surface-03, #e0e0e0); }

/* 4. COMPONENTS — contextual tokens only. Never a hex, never a number. */
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}`}
      </CodeBlock>

      <p>
        That system was built and measured rather than assumed. Six identical{' '}
        <code>.card</code> elements, three nested in a light tree and three in a{' '}
        <code>.theme-dark</code> tree:
      </p>

      <CodeBlock language="text" title="Measured — one .card rule, six correct results">
{`light  layer-1  background rgb(255, 255, 255)  border rgb(198, 198, 198)  text rgb(22, 22, 22)
light  layer-2  background rgb(244, 244, 244)  border rgb(198, 198, 198)  text rgb(22, 22, 22)
light  layer-3  background rgb(224, 224, 224)  border rgb(198, 198, 198)  text rgb(22, 22, 22)
dark   layer-1  background rgb(38, 38, 38)     border rgb(82, 82, 82)     text rgb(244, 244, 244)
dark   layer-2  background rgb(57, 57, 57)     border rgb(82, 82, 82)     text rgb(244, 244, 244)
dark   layer-3  background rgb(82, 82, 82)     border rgb(82, 82, 82)     text rgb(244, 244, 244)`}
      </CodeBlock>

      <p>
        The naming discipline in that file is the part worth copying, and it is exactly
        Carbon&apos;s:
      </p>

      <ul>
        <li>
          <strong>Numbered tokens are for themes.</strong> If a name ends in a number, only theme
          definitions may set it and only the contextual tier may read it.
        </li>
        <li>
          <strong>Un-numbered tokens are the component API.</strong> If a component reads a name
          with a number in it, it has hardcoded a depth and will break when nested.
        </li>
        <li>
          <strong>Literal colors appear in exactly two places</strong> — the primitive tier, and the
          fallback arm of a <code>var()</code>. Anywhere else is a bug.
        </li>
        <li>
          <strong>Any rule that sets a numbered token must re-emit the contextual tokens.</strong>{' '}
          This is the one non-obvious rule, and section 3 shows what silently breaks without it.
        </li>
      </ul>

      <h2>7. Honest Trade-offs</h2>

      <h3>Debugging is genuinely worse</h3>

      <p>
        This is the real cost and it is not small. When a background is the wrong color, DevTools
        shows you the <em>resolved</em> value and the chain that produced it is already gone. We
        measured this above: <code>getComputedStyle</code> returns <code>#262626</code>, never{' '}
        <code>var(--cds-layer-01, #fff)</code>. Finding out <em>why</em> means walking the chain by
        hand — which element declared <code>--cds-layer</code>, which ancestor set{' '}
        <code>--cds-layer-01</code>, whether a theme zone re-emitted. A three-link indirection turns
        a ten-second fix into a ten-minute one.
      </p>

      <p>
        There is a sharper edge, too, and it violates most people&apos;s intuition about what{' '}
        <code>var()</code> fallbacks protect against. Measured:
      </p>

      <CodeBlock language="text" title="Measured — the fallback does NOT rescue a bad value">
{`/* token is UNDEFINED — fallback fires as expected */
background-color: var(--cds-nope, #00ff00);
  computed background-color = rgb(0, 255, 0)         <- green, as you would hope

/* token is DEFINED but holds garbage — fallback does NOT fire */
--cds-layer: not-a-color;
background-color: var(--cds-layer, #00ff00);
  computed --cds-layer      = not-a-color
  computed background-color = rgba(0, 0, 0, 0)       <- TRANSPARENT, not green`}
      </CodeBlock>

      <p>
        A <code>var()</code> fallback only covers the case where the property was{' '}
        <em>never defined</em>. If it holds an invalid value, the whole declaration becomes{' '}
        &quot;invalid at computed-value time&quot; and the property reverts to its{' '}
        <strong>initial</strong> value — <code>transparent</code> for a background. So a typo in one
        theme token does not produce a wrong color you would notice; it produces an{' '}
        <em>invisible element</em>, with the fallback sitting right there in the source looking like
        it should have caught it.
      </p>

      <h3>Naming is the hard part, and bad names outlive bad code</h3>

      <p>
        The mechanism in this lesson is maybe two hundred lines of Sass. The taxonomy — deciding
        that <code>layer</code>, <code>field</code>, <code>border-subtle</code> and{' '}
        <code>border-strong</code> are the right joints to carve at, that borders need four levels
        while layers need three, that hover and selected deserve their own sets — is years of work
        and cannot be refactored cheaply. A badly named token gets adopted by hundreds of
        components; renaming it is a breaking change for every consumer. You can rewrite a bad
        implementation in an afternoon. You live with a bad token name for the life of the design
        system.
      </p>

      <h3>It is overkill for a small app</h3>

      <p>
        The three-tier indirection buys you exactly one thing: the ability to change values for a
        subtree or a theme without touching component code. If your app has one theme, no scoped
        theming, and no nesting requirements, you are paying the debugging cost for a capability you
        never use. The previous lesson&apos;s point applies here too — this very site runs a flat,
        two-tier system with no layer machinery at all, and that is the right call for its size. The
        contextual layer tier earns its keep at the point where components genuinely nest inside
        each other in arrangements their authors could not predict. Below that threshold, a simple{' '}
        <code>:root</code> block and a <code>[data-theme]</code> override is not a lesser version of
        this — it is the correct design.
      </p>

      <InfoBox variant="note" title="What was measured and what was read">
        Every computed value quoted in this lesson was produced by building the CSS case and reading{' '}
        <code>getComputedStyle</code> in headless Chromium; the Sass output was produced by the Dart
        Sass compiler this repo depends on. The Carbon source excerpts, file paths, and the four
        themes&apos; token values were read from the carbon-design-system/carbon repository
        (<code>packages/styles</code>, <code>packages/themes</code>, <code>packages/react</code>,
        and <code>packages/colors</code>) rather than recalled. One inference is stated as such: the
        merged <code>.cds--layer-one, :root</code> selector is attributed to a CSS minifier because
        the Sass source emits those two rules separately with identical bodies.
      </InfoBox>

      <InteractiveChallenge
        question={"A .cds--g100 dark theme class sets --cds-layer-01: #262626 on a wrapper div. Inside it, a Carbon Tile that writes background-color: var(--cds-layer) still renders white. The theme class definitely applied — DevTools confirms --cds-layer-01 is #262626 on the wrapper. What is wrong?"}
        options={[
          "The Tile's CSS has higher specificity than the theme class, so it wins the cascade",
          "The wrapper sets the numbered token but does not re-declare --cds-layer, so the Tile inherits the already-substituted value computed back at :root",
          "--cds-layer-01 does not inherit to descendants; only --cds-layer does",
          "The theme class must be applied to <html>, never to a wrapper div"
        ]}
        correctIndex={1}
        explanation={"This is carbon issue #11138, measured in the lesson. Custom properties are substituted once per element at computed-value time. :root computed --cds-layer by substituting the value --cds-layer-01 had AT :root, producing the literal #ffffff. Descendants that never declare --cds-layer inherit that finished value, not the var(--cds-layer-01, #fff) recipe, so redefining --cds-layer-01 further down changes nothing. The fix — which Carbon applies in both its theme mixin and _zone.scss — is to re-emit the contextual tokens inside the same rule that sets the numbered ones. Specificity is irrelevant here: the wrapper never made a competing --cds-layer declaration at all."}
        language="css"
      />

      <InteractiveChallenge
        question={"Why can a Carbon Tile nested inside another Tile automatically use a different background, when neither Tile's CSS contains any reference to nesting, depth, or the other component?"}
        options={[
          "Carbon's JavaScript walks the DOM after mount and assigns each component a depth-appropriate background",
          "Each Tile's CSS uses descendant selectors like .cds--tile .cds--tile to target nested instances",
          "The outer component renders a wrapper carrying .cds--layer-two, which redeclares the inherited --cds-layer to point at --cds-layer-02; the inner Tile reads var(--cds-layer) as it always did, and inheritance delivers the new value",
          "CSS automatically increments custom properties that end in a number as elements nest"
        ]}
        correctIndex={2}
        explanation={"Neither component knows about the other, and no code coordinates them. The wrapper redefines one inherited custom property for its subtree; the inner component was already reading that property. Measured in the lesson: three identical <div class=\"tile\"> elements from one .tile rule computed rgb(38, 38, 38), rgb(57, 57, 57) and rgb(82, 82, 82) purely on the basis of which wrapper they sat inside. On the React side, <Layer> only tracks a depth number in context and turns it into a class name — it never computes a color."}
        language="css"
      />

      <InteractiveChallenge
        question={"You are adding a Card component to an app that uses this token architecture. Which single line most reliably breaks theming, in a way that no test, lint pass, or build step will catch by default?"}
        options={[
          "background: var(--surface);",
          "background: #ffffff;",
          "background: var(--surface, #ffffff);",
          "background: var(--surface-02);"
        ]}
        correctIndex={1}
        explanation={"A literal color opts the component out of theming permanently. Measured in the lesson: inside a fully correct dark zone where --cds-layer computed to #262626, a component with background-color: #ffffff still rendered rgb(255, 255, 255) — the correct value was available and simply unused. Nothing errors and nothing warns; it looks perfect in whichever theme its author was using. Option 4 is a milder bug worth noting — reading a numbered token hardcodes a nesting depth, so the component will still theme correctly but will not step when nested. Option 3 is fine: a fallback inside var() is one of only two legitimate places for a literal color, the other being the primitive tier."}
        language="css"
      />
    </LessonLayout>
  );
}
