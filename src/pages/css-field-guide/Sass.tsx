import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideCssSass() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="CSS · Field Reference"
      title="Sass Essentials"
      tagline="Variables, mixins, the @use module system — condensed for a fast lookup while writing real .scss files."
      meta={['Dart Sass', '12 essentials']}
      footerLabel="Personal study reference — Sass"
      pageLabel="CSS Field Guide · Sass"
      prev={{ path: '/css-field-guide/patterns', label: 'Layout & Design Patterns' }}
      next={{ path: '/css-field-guide/tokens', label: 'Design Tokens & Style Inclusion' }}
    >
      <PosterCard
        glyph="Vr"
        title={<>$variables<span className="dim"> — compile-time only</span></>}
        language="scss"
        code={`$spacing-unit: 8px;
$color-primary: #6366f1;

.card { padding: $spacing-unit * 3; }
// compiles to: .card { padding: 24px; } — $ names are GONE from output`}
        caption="A Sass variable is text substitution, erased at build time. Reach for a CSS --custom-property instead the moment a value needs to change after the page has loaded (theme, JS, media query)."
      />

      <PosterCard
        glyph="Ns"
        title={<>Nesting<span className="dim"> — cap it at 2 levels</span></>}
        language="scss"
        code={`.card {
  padding: 1rem;

  &:hover { box-shadow: var(--shadow-lg); }   // & = parent ref
  .title { font-size: 1.25rem; }              // .card .title — specificity (0,0,2,0)
}
// avoid: .card .header .list .item .link { } — 4+ levels = unoverridable`}
        caption="Every nesting level compiles to an additional class in the flattened selector, adding specificity. Nest for genuine parent-child relevance (&:hover, a state class) — not just to visually mirror the markup."
      />

      <PosterCard
        glyph="Mx"
        title={<>Mixins<span className="dim"> — @include, parameterized</span></>}
        language="scss"
        code={`@mixin flex-center($gap: 0) {
  display: flex; align-items: center; justify-content: center; gap: $gap;
}
.toolbar { @include flex-center($gap: 0.75rem); }`}
        caption="A mixin emits a whole BLOCK of declarations — use it whenever you're repeating more than one property together across selectors, with optional default parameters for variation."
      />

      <PosterCard
        glyph="Fn"
        title={<>Functions<span className="dim"> — @return a single value</span></>}
        language="scss"
        code={`@use 'sass:math';

@function px-to-rem($px, $base: 16px) {
  @return math.div($px, $base) * 1rem;   // NOT ($px / $base)
}
.heading { font-size: px-to-rem(24px); } // 1.5rem`}
        caption="A function computes and returns ONE value to slot into a property. Divide with math.div() — bare / is deprecated (it's a separator in real CSS, as in font: 16px/1.5) and is removed in Dart Sass 2.0."
      />

      <PosterCard
        glyph="Us"
        title={<>@use<span className="dim"> — namespaced module import</span></>}
        language="scss"
        code={`// _tokens.scss
$primary: #6366f1;

// button.scss — ALL @use rules first, before any other rule
@use 'tokens';
@use 'tokens' as t;   // optional alias

.btn   { background: tokens.$primary; }
.badge { background: t.$primary; }`}
        caption="Replaces the deprecated @import. Loads a partial exactly once regardless of how many files @use it, and namespaces everything — two partials can each define $primary with zero collision. Every @use must appear before the first style rule, or Sass errors with '@use rules must be written before any other rules'."
      />

      <PosterCard
        glyph="Fw"
        title={<>@forward<span className="dim"> — a single public entry point</span></>}
        language="scss"
        code={`// tokens/_index.scss
@forward 'color';
@forward 'spacing';

// anywhere else in the app:
@use 'tokens';  // pulls color AND spacing through ONE door
.alert { background: tokens.$danger; }`}
        caption="@forward re-exports a partial's contents through an index file — consumers @use the index and never need to know how many internal files the token system is actually split across."
      />

      <PosterCard
        glyph="Pt"
        title={<>Partials<span className="dim"> — the underscore prefix</span></>}
        language="text"
        code={`_button.scss     ← underscore = "fragment, don't compile standalone"
_tokens.scss
styles.scss      ← no underscore = the ACTUAL entry point compiled to CSS

@use '_button';   // ❌ wrong — omit the underscore
@use 'button';    // ✅ correct — Sass strips it automatically`}
        caption="The leading underscore tells Sass this file is meant to be @use'd into another file, not compiled to its own standalone .css output — but you always reference it WITHOUT the underscore in the @use path."
      />

      <PosterCard
        glyph="Ea"
        title={<>@each<span className="dim"> — loop over a list or map</span></>}
        language="scss"
        code={`$sizes: (sm: 4px, md: 8px, lg: 16px);

@each $name, $value in $sizes {
  .p-#{$name} { padding: $value; }
}
// generates .p-sm, .p-md, .p-lg — one rule per map entry`}
        caption="@each with a Sass map generates a whole family of utility classes from one data structure — add a new size to the map and the class is generated automatically, no copy-pasted rule needed."
      />

      <PosterCard
        glyph="If"
        title={<>@if / @else<span className="dim"> — conditional output</span></>}
        language="scss"
        code={`@mixin truncate($lines: 1) {
  @if $lines == 1 {
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  } @else {
    display: -webkit-box; -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical; overflow: hidden;
  }
}`}
        caption="Branches at BUILD time based on the argument passed in — the compiled CSS only ever contains the branch that was actually selected, not both, so there's no runtime cost to the conditional."
      />

      <PosterCard
        glyph="Mp"
        title={<>Sass Maps<span className="dim"> — key-value config</span></>}
        language="scss"
        code={`@use 'sass:map';   // REQUIRED — map.get is a built-in module member

$breakpoints: (sm: 640px, md: 768px, lg: 1024px);

@mixin respond-above($bp) {
  @media (min-width: map.get($breakpoints, $bp)) { @content; }
}
.nav { @include respond-above(md) { display: flex; } }`}
        caption="@content forwards whatever block is passed at the @include call site INTO the mixin's @media wrapper — one respond-above() mixin drives every breakpoint from one config map. Forget the @use 'sass:map' line and compilation fails outright with 'There is no module with the namespace map'."
      />

      <PosterCard
        glyph="In"
        title={<>Interpolation<span className="dim"> — #&#123;&#125; in selectors/values</span></>}
        language="scss"
        code={`$side: 'top';
.border-#{$side} { border-#{$side}: 1px solid; }
// compiles to: .border-top { border-top: 1px solid; }

@each $name, $hue in (primary: 243, danger: 4) {
  :root { --color-#{$name}: oklch(0.6 0.2 #{$hue}); }
}`}
        caption="#{} injects a Sass expression's value into a place plain variable interpolation can't reach — a selector name, a property name, part of a string. Without it, $side couldn't become part of the class name .border-top."
      />

      <PosterCard
        glyph="Ex"
        title={<>%placeholder<span className="dim"> + @extend</span></>}
        language="scss"
        code={`%btn-base {
  padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;
}
.btn-primary { @extend %btn-base; background: var(--accent); }
.btn-danger  { @extend %btn-base; background: var(--danger); }
// %btn-base itself emits NO css — only the .btn-* selectors do`}
        caption="A %placeholder never compiles to its own CSS rule — only classes that @extend it appear in the output, and Sass merges them into one combined selector rather than duplicating the shared declarations per class."
      />

      <PosterQuickRef
        title="Which Sass feature do I need?"
        rows={[
          { need: 'A build-time constant (breakpoint number, config)', answer: '$variable' },
          { need: 'A value that changes at runtime (theme, JS)', answer: 'CSS --custom-property instead' },
          { need: 'Reusable block of multiple declarations', answer: '@mixin' },
          { need: 'Reusable single computed value', answer: '@function' },
          { need: 'Import a partial without global collisions', answer: "@use 'partial'" },
          { need: 'Re-export many partials through one file', answer: "@forward 'partial'" },
          { need: 'Generate N classes from a data structure', answer: '@each over a Sass map' },
          { need: 'Share declarations without duplicating output', answer: '%placeholder + @extend' },
        ]}
      />
    </PosterLayout>
  );
}
