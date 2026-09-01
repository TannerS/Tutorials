import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function CssMasteryFieldGuide() {
  return (
    <GuideLayout
      title="CSS"
      kicker="FIELD GUIDE"
      glyph="🎨"
      tagline="Box model through anchor positioning, Sass, and design tokens — condensed from the CSS Mastery lessons into one fast-lookup sheet."
      meta={['CSS3 + Sass', '27 panels']}
      page="1 / 1"
      footer="This page is for recall. The CSS Mastery lessons carry the walkthroughs and the reasoning behind each rule — this page is the fast-lookup sheet."
      prev={{ path: '/css-mastery/patterns', label: 'Layout Patterns & Recipes' }}
      next={null}
    >
      <GuidePanel n={1} title="Box Model" accent="blue" glyph="📦">
        <GuideCode>{`.a { box-sizing: content-box; width: 200px; padding: 20px; } /* renders 240px */
.b { box-sizing: border-box;  width: 200px; padding: 20px; } /* renders 200px */
*, *::before, *::after { box-sizing: border-box; } /* set this globally */`}</GuideCode>
        <GuideRules items={[
          'content-box is the default and almost never what you want — padding grows the element past the width you set.',
          'Without the global reset, width: 100% plus any padding/border overflows its container silently — first rule in nearly every reset ever written.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Specificity, Cascade & !important" accent="purple" glyph="⚖️" span={2}>
        <GuideCode>{`h1              { }  /* (0,0,0,1) */
.title          { }  /* (0,0,1,0) */
#page-title     { }  /* (0,1,0,0) */
div.title.large { }  /* (0,0,2,1) */
style="color:red"   /* (1,0,0,0) — always wins over any selector */

.btn { background: blue !important; }  /* file A, loaded first */
.btn { background: red !important; }   /* file B, loaded later — red wins */
/* !important ties still resolve by specificity, THEN source order */`}</GuideCode>
        <GuideDefs items={[
          ['Cascade order', 'origin & importance → specificity → source order'],
          ['Equal specificity', 'last declared wins'],
        ]} />
        <GuideRules items={[
          'Compare specificity left to right, column by column — one id beats any number of classes; any number of classes beats any number of elements.',
          'Reaching for a bigger selector or !important to win a fight escalates the war for whoever edits this next — remove the earlier offender instead of out-specifying it.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Inheritance & Global Keywords" accent="green" glyph="🧬">
        <GuideCode>{`/* INHERITED by default */
color, font-*, line-height, text-align, visibility, letter-spacing

/* NOT inherited — box & layout properties */
margin, padding, border, background, width, display, position

input, button, select, textarea { font: inherit; } /* form controls don't inherit font */`}</GuideCode>
        <GuideDefs items={[
          ['inherit', "force-take the parent's computed value"],
          ['initial', 'the spec default for that property'],
          ['unset', 'inherit if inheritable, else initial'],
          ['all: revert', "roll back to the browser's own stylesheet"],
        ]} />
        <GuideRules items={['Form controls are the famous exception — font: inherit belongs in every reset ever written.']} />
      </GuidePanel>

      <GuidePanel n={4} title="Combinators" accent="amber" glyph="🔗">
        <GuideCode>{`.card p    { }  /* DESCENDANT — any depth below */
.menu > li { }  /* CHILD — direct children only */
h2 + p     { }  /* ADJACENT SIBLING — the very NEXT element */
h2 ~ p     { }  /* GENERAL SIBLING — any LATER sibling */
/* combinators add ZERO specificity — only the selectors around them count */`}</GuideCode>
        <GuideRules items={[
          'The descendant space is the combinator people forget exists — ".menu li" catching a nested submenu is a common bug; > is the fix.',
          'Siblings only look forward — there is no previous-sibling combinator; that job belongs to :has().',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Units" accent="pink" glyph="📏">
        <GuideCode>{`html { font-size: 100%; }         /* respects the user's browser setting */
.title { font-size: 2rem; }       /* relative to ROOT font-size — never compounds */
.title .sub { font-size: 0.8em; } /* relative to PARENT — compounds through nesting */
.a { height: 100vh; }  /* large viewport — clipped while a mobile URL bar shows */
.c { height: 100dvh; } /* dynamic — tracks the bar live, best for full-height */`}</GuideCode>
        <GuideRules items={[
          'rem is the safe default for type scale; em is a footgun outside component-local scaling.',
          'Reach for dvh over vh for full-height layouts — vh overflows while a mobile URL bar is on screen.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="position — five values" accent="cyan" glyph="📍">
        <GuideCode>{`.a { position: static; }             /* default — no offset props apply */
.b { position: relative; top: 4px; } /* offset from its OWN normal spot */
.c { position: absolute; top: 0; }   /* offset from nearest positioned ancestor */
.d { position: fixed; bottom: 0; }   /* offset from the viewport, ignores scroll */
.e { position: sticky; top: 0; }     /* relative until a threshold, then fixed */`}</GuideCode>
        <GuideRules items={['absolute anchors to the nearest ancestor that is NOT static — forgetting position: relative on the intended anchor is the most common positioning bug.']} />
      </GuidePanel>

      <GuidePanel n={7} title="display" accent="red" glyph="👁️">
        <GuideCode>{`.block  { display: block; }        /* full width, respects width/height/margin */
.inline { display: inline; }       /* flows in text, IGNORES width/height */
.hybrid { display: inline-block; } /* flows inline, respects width/height */
.hidden { display: none; }         /* removed from layout AND a11y tree */`}</GuideCode>
        <GuideRules items={['display: none removes an element from layout and the accessibility tree — different from visibility: hidden (still takes space) or opacity: 0 (still clickable unless pointer-events is set too).']} />
      </GuidePanel>

      <GuidePanel n={8} title="Color Functions" accent="blue" glyph="🎨">
        <GuideCode>{`.a { color: #6366f1; }                         /* hex */
.b { color: rgb(99 102 241 / 60%); }           /* space-separated + alpha */
.c { color: hsl(243 75% 67%); }                /* easiest to hand-tune */
.d { border-color: currentColor; }             /* inherits the element's text color */
.e { background: color-mix(in oklch, var(--accent) 85%, black); } /* live blend */`}</GuideCode>
        <GuideRules items={[
          'hsl() is easiest to hand-tune — drop lightness for a darker shade, raise saturation to pop.',
          'color-mix() computes a hover/disabled shade live off whatever --accent currently is — no preprocessor darken()/lighten() baked at build time.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Pseudo-class vs Pseudo-element" accent="purple" glyph="🎭">
        <GuideCode>{`/* pseudo-CLASS (single colon) — a STATE of a real element */
.btn:hover { }
li:first-child { }

/* pseudo-ELEMENT (double colon) — a sub-part that ISN'T a real DOM node */
.quote::before { content: open-quote; }
input::placeholder { color: gray; }`}</GuideCode>
        <GuideRules items={['Modern convention: single colon for classes, double colon for elements — CSS still accepts single-colon ::before for legacy reasons, but write it double.']} />
      </GuidePanel>

      <GuidePanel n={10} title="Margin Collapse, Stacking Contexts & z-index" accent="green" glyph="🧱" span={2}>
        <GuideCode>{`.a { margin-bottom: 20px; } .b { margin-top: 30px; }
/* stacked siblings: gap is 30px, NOT 50 — the LARGER wins, not the sum */

.parent { padding: 0; } .child { margin-top: 20px; }
/* child's margin ESCAPES the parent when it has no padding/border/BFC —
   the whole parent box moves down instead */

.modal { z-index: 9999; }                    /* ❌ no effect — still position: static */
.modal { position: fixed; z-index: 9999; }   /* ✅ now it applies */`}</GuideCode>
        <GuideRules items={[
          'Only vertical margins between block siblings collapse — gap in flex/grid never collapses; display: flow-root stops it for block layouts.',
          'z-index is silently ignored on statically positioned elements — no error, just a no-op. The single most common "overlay is behind everything" bug report.',
          'z-index only compares siblings within the SAME stacking context — opacity < 1, transform, filter, or position + z-index all open a new one that traps descendants inside it.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Shorthand & Attribute Selectors" accent="amber" glyph="✂️">
        <GuideCode>{`margin: 10px 20px 30px 40px;  /* top right bottom left — clockwise */
font: italic 700 1.2rem/1.5 'Inter', sans-serif;

[disabled] { opacity: 0.5; }       /* attribute present, any value */
[class^="icon-"] { }               /* STARTS with */
[href$=".pdf"] { }                 /* ENDS with */
[data-status*="error"] { }         /* CONTAINS substring */`}</GuideCode>
        <GuideRules items={[
          "Any shorthand you don't fully specify resets the omitted longhands to their initial value.",
          "Attribute selectors add specificity like a class (0,0,1,0 each) and target the data-* attributes React apps already have.",
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Modern Selector Toolkit" accent="pink" glyph="🧲" span={2}>
        <GuideCode>{`.card:has(img) { grid-template-rows: 200px 1fr; }        /* style a parent by its child */
li:has(> a[aria-current="page"]) { background: var(--accent-dim); }

:is(article, .post) h2 { }    /* specificity = its MOST specific argument */
:where(ul, ol) { padding-left: 1.5rem; }  /* ALWAYS zero specificity */

li:not(.active) { color: gray; }          /* :not() is NOT specificity-free */
li:not(:where(.active)) { color: gray; }  /* :where() zeroes it back out */`}</GuideCode>
        <GuideRules items={[
          ':has() checks descendants and styles the ancestor — the one relationship selectors could not express for two decades.',
          'Use :where() for resets you want overridden without a fight; use :is() when the grouped selector should carry real weight.',
          ":not()'s specificity is its argument's specificity, same rule as :is() — it is often assumed free, and isn't.",
        ]} />
      </GuidePanel>

      <GuidePanel n={13} title="Grid Power Moves" accent="cyan" glyph="🧮" span={2}>
        <GuideCode>{`.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
/* auto-fit collapses empty tracks so cards stretch; auto-fill keeps them */

.layout { display: grid; grid-template-areas: "hd hd" "lt ct" "ft ft"; grid-template-columns: 200px 1fr; }
.layout > nav { grid-area: lt; }

.card { grid-column: span 2; display: grid; grid-template-columns: subgrid; }
/* child's columns now align to the OUTER grid's tracks */

/* span N absorbs the N-1 gaps between tracks too */
.medium { grid-row: span 4; }  /* grid-auto-rows:60px gap:16px -> 4*60+3*16 = 288px */`}</GuideCode>
        <GuideRules items={[
          'grid-template-areas is self-documenting — reordering a breakpoint is rewriting the ASCII string, no renumbering.',
          'Without subgrid, a nested grid defines its own tracks and rarely lines up with siblings.',
          'span = (target + gap) / (track + gap) — the inverse of the absorbed-gap formula, for turning a target pixel height into a span count.',
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="Flexbox One-Liners & gap" accent="red" glyph="🏹">
        <GuideCode>{`.center  { display: flex; justify-content: center; align-items: center; }
/* NOT place-items — that's a GRID shorthand; flex ignores justify-items */
.between { display: flex; justify-content: space-between; align-items: center; }
.pin-end { display: flex; } .pin-end > :last-child { margin-left: auto; }
.row     { display: flex; gap: 1rem 2rem; }  /* row-gap column-gap — never collapses */`}</GuideCode>
        <GuideRules items={['margin-left: auto on a flex item consumes all remaining free space up to that point — pins one item to the far edge without switching to space-between.']} />
      </GuidePanel>

      <GuidePanel n={15} title="Container Queries, Units & Style Queries" accent="blue" glyph="📦" span={2}>
        <GuideCode>{`.card-wrapper { container-type: inline-size; container-name: card; }
@container card (min-width: 400px) { .card { grid-template-columns: 120px 1fr; } }
/* a container can NEVER query itself — put container-type on a dedicated wrapper */

.card__title { font-size: clamp(1rem, 5cqi, 2rem); } /* cqi = 1% of the CONTAINER's inline size */

@container style(--variant: featured) { .card__title { font-size: 1.5rem; } }
/* style() needs no container-type — every element is a style container */`}</GuideCode>
        <GuideRules items={[
          'Media queries only see the viewport; container queries let a component respond to the space its own container actually gives it.',
          'container-type: inline-size is a containment switch, not a label — it also kills shrink-to-fit and opens a new stacking context, so keep it off components already carrying layout duties.',
          "No container-type on an ancestor silently falls cqi back to the small-viewport size — that missing declaration is nearly always why cqi \"isn't responding\".",
        ]} />
      </GuidePanel>

      <GuidePanel n={16} title="clamp() & aspect-ratio" accent="purple" glyph="📐">
        <GuideCode>{`h1 { font-size: clamp(1.75rem, 4vw + 1rem, 3.5rem); }  /* min preferred max */
.wrap { padding-inline: clamp(1rem, 5vw, 4rem); }

.video  { aspect-ratio: 16 / 9; width: 100%; }  /* height computed automatically */
.avatar { aspect-ratio: 1; object-fit: cover; } /* replaces the padding-top hack */`}</GuideCode>
        <GuideRules items={[
          'clamp() replaces 3-4 font-size media query breakpoints with one declaration and no visible jump.',
          'aspect-ratio reserves the box before media loads, preventing layout shift; object-fit: cover then crops without distorting.',
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="Native Nesting & Cascade Layers" accent="green" glyph="🪺" span={2}>
        <GuideCode>{`.card {
  padding: 1.5rem;
  &:hover { box-shadow: var(--shadow-lg); }
  @media (width < 768px) { padding: 1rem; }
}

@layer base { .btn { color: blue; } }
.btn { color: red; }  /* unlayered wins — regardless of specificity or layer order */

/* !important INVERTS both rules: layered beats unlayered, EARLIEST layer wins */`}</GuideCode>
        <GuideRules items={[
          "Plain CSS nesting is baseline now — for a component's own hover/state variants you may not need Sass nesting at all; Sass still earns its keep for build-time loops/mixins.",
          'Cascade layers only govern priority AMONG layered styles — one unlayered rule anywhere outranks every @layer. Wrap ALL your CSS in a layer, or an app\'s unlayered overrides win.',
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="Entry Animations & Independent Transforms" accent="amber" glyph="🎬" span={2}>
        <GuideCode>{`.popover {
  opacity: 1; scale: 1;
  transition: opacity 250ms, scale 250ms, display 250ms allow-discrete;
}
@starting-style { .popover { opacity: 0; scale: 0.95; } }
.popover[hidden] { opacity: 0; scale: 0.95; display: none; }

/* ❌ old problem: :hover must restate translate or it's lost */
.badge       { translate: 0 -50%; }
.badge:hover { scale: 1.1; }   /* translate untouched — applied translate → rotate → scale */`}</GuideCode>
        <GuideRules items={[
          'Transitions need a previous value, and display: none has none — @starting-style supplies the "before it existed" state; allow-discrete defers the display flip so the fade finishes first.',
          'Standalone translate/rotate/scale compose instead of clobbering, trading arbitrary ordering for that composability — keep the transform shorthand when order matters.',
        ]} />
      </GuidePanel>

      <GuidePanel n={19} title="Anchor Positioning & light-dark()" accent="pink" glyph="🧭" span={2}>
        <GuideCode>{`.trigger { anchor-name: --trigger; }
.tooltip {
  position: absolute; position-anchor: --trigger;
  position-area: block-start center;
  position-try-fallbacks: flip-block, flip-inline;  /* first that fits wins */
}

:root {
  color-scheme: light dark;         /* REQUIRED or light-dark() always resolves light */
  --bg: light-dark(#fff, #0f0f1a);
}
:root[data-theme="dark"] { color-scheme: dark; }  /* NOT bare [data-theme] — ties :root on specificity */`}</GuideCode>
        <GuideRules items={[
          'Anchor positioning replaces the getBoundingClientRect + reposition-on-scroll loop Floating UI/Popper exist for — reached Baseline 2026, but still gate it with @supports(anchor-name: --x) and keep a static fallback.',
          'light-dark() collapses duplicated theme variable blocks into one declaration; color-scheme also flips native scrollbars/inputs/date pickers to match.',
        ]} />
      </GuidePanel>

      <GuidePanel n={20} title="Flex/Grid Sizing Gotchas" accent="cyan" glyph="🪤" span={2}>
        <GuideCode>{`.row img { flex-shrink: 0; }  /* images shrink to near-0 by default without this */
/* shrink factor is WEIGHTED by flex-basis, not a plain ratio */

.layout { display: flex; } .main { flex: 1; min-width: 0; }
/* flex/grid items default to min-width: auto — a hard floor at their
   min-content size. That's why ellipsis "doesn't work" inside flex. */

.row { display: flex; } /* align-items defaults to STRETCH, not flex-start */

.child { height: 100%; }  /* resolves to 0 without a parent with a definite height */`}</GuideCode>
        <GuideRules items={[
          'flex-shrink: 1 is the default on every item, images included — a full row squashes an <img> because it has no natural minimum width.',
          'Set min-width: 0 on the flex ITEM, not on the element with the ellipsis — the most common flexbox bug there is.',
          'Cards silently end up the same height as the tallest sibling unless align-items: flex-start overrides the stretch default.',
        ]} />
      </GuidePanel>

      <GuidePanel n={21} title="Form, Transition & Sticky Gotchas" accent="red" glyph="🚧" span={2}>
        <GuideCode>{`input:invalid { border-color: red; }        /* ❌ fires while the field is still EMPTY */
input:user-invalid { border-color: red; }   /* ✅ only after the user's had a turn */

.card { transition: all 0.3s ease; }  /* ❌ animates every changed property, real perf cost */
.card { transition: background-color 0.3s ease, transform 0.3s ease; }  /* ✅ */

.panel { height: 0; transition: height 300ms; }
.panel.open { height: auto; }  /* ❌ snaps — auto can't be interpolated */
:root { interpolate-size: allow-keywords; }  /* ✅ opts the subtree in */

.parent { overflow: hidden; }  /* ❌ can't scroll — sticky child has nothing to stick against */`}</GuideCode>
        <GuideRules items={[
          ':invalid is true from first paint; :user-invalid adds "and the user already had their turn" — almost always the one you want.',
          "sticky never falls back to static — it sticks to the nearest ancestor whose overflow isn't visible; overflow: hidden/clip breaks it because THAT ancestor can't scroll at all.",
          'Name the exact properties you intend to transition instead of all.',
        ]} />
      </GuidePanel>

      <GuidePanel n={22} title="Layout Recipe Quick Table" accent="blue" glyph="🗂️" span={3}>
        <GuideCode>{`/* Holy Grail — named areas map straight to the visual layout */
.holy-grail { display: grid; grid-template-areas: "hd hd hd" "lt ct rt" "ft ft ft";
              grid-template-columns: 200px 1fr 200px; min-height: 100dvh; }

/* Full-bleed breakout — the 100vw version overshoots by the scrollbar width */
.wrapper { display: grid; grid-template-columns: 1fr min(65ch, 100%) 1fr; }
.wrapper > * { grid-column: 2; }  .full-bleed { grid-column: 1 / -1; }`}</GuideCode>
        <GuideTable
          head={['Pattern', 'Key CSS']}
          rows={[
            ['Card grid, no breakpoints', 'grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))'],
            ['Sticky header', 'position: sticky; top: 0 — no ancestor with overflow: hidden/clip'],
            ['Centered modal backdrop', 'display: grid; place-items: center'],
            ['1-line ellipsis', 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis (all three or it silently fails)'],
            ['Multi-line clamp', '-webkit-line-clamp: N; display: -webkit-box; -webkit-box-orient: vertical'],
            ['Featured pricing card', 'align-items: start on the grid stops shorter cards from stretching'],
            ['Collapsible sidebar', 'swap grid-template-columns + the sidebar\'s own display at the breakpoint'],
            ['Toast stack, newest at bottom', 'flex-direction: column-reverse'],
            ['Custom scrollbar', 'scrollbar-width / scrollbar-color — standard now, not Firefox-only'],
            ['Dashboard cards not stretching', 'align-content: start on the content grid'],
          ]}
        />
        <GuideRules items={['calc(50% - 50vw) is the exact distance from a constrained container edge to the viewport edge — but 100vw includes the scrollbar gutter that 50% doesn\'t, so the grid breakout above is the scrollbar-safe version.']} />
      </GuidePanel>

      <GuidePanel n={23} title="Sass Core" accent="purple" glyph="🧵" span={2}>
        <GuideCode>{`$spacing-unit: 8px;
.card { padding: $spacing-unit * 3; }   // compiles to 24px — $ names are GONE from output

.card {
  padding: 1rem;
  &:hover { box-shadow: var(--shadow-lg); }  // & = parent ref
  .title { font-size: 1.25rem; }             // .card .title — avoid 4+ levels deep
}

@mixin flex-center($gap: 0) { display: flex; align-items: center; justify-content: center; gap: $gap; }
.toolbar { @include flex-center($gap: 0.75rem); }

@use 'sass:math';
@function px-to-rem($px, $base: 16px) { @return math.div($px, $base) * 1rem; }  // NOT $px / $base`}</GuideCode>
        <GuideRules items={[
          'A Sass variable is text substitution, erased at build time — reach for a CSS custom property instead the moment a value needs to change after load.',
          'Every nesting level adds specificity in the flattened output — nest for genuine state/relevance, not to visually mirror the markup.',
          'Bare / is deprecated and removed in Dart Sass 2.0 — divide with math.div().',
        ]} />
      </GuidePanel>

      <GuidePanel n={24} title="Sass Modules & Tooling" accent="green" glyph="📚" span={2}>
        <GuideCode>{`// button.scss — ALL @use rules first, before any other rule
@use 'tokens';               // loaded once, namespaced — no collisions
@use 'tokens' as t;

// tokens/_index.scss
@forward 'color'; @forward 'spacing';   // one public door for many partials

_button.scss  →  @use 'button';   // reference WITHOUT the leading underscore

@each $name, $value in (sm: 4px, md: 8px, lg: 16px) { .p-#{$name} { padding: $value; } }`}</GuideCode>
        <GuideDefs items={[
          ['@use', 'namespaced import, replaces the deprecated @import'],
          ['@forward', 're-exports partials through one entry point'],
          ['%placeholder + @extend', 'shared declarations merged into one selector; emits no CSS of its own'],
          ['@if / @else', 'branches at BUILD time — only the selected branch ships'],
        ]} />
        <GuideRules items={[
          'Every @use must appear before the first style rule or Sass errors outright.',
          '#{} interpolation reaches selectors and property names that plain variable substitution cannot.',
        ]} />
      </GuidePanel>

      <GuidePanel n={25} title="Design Tokens: Tiers, Naming & Fallback Chains" accent="amber" glyph="🏷️" span={2}>
        <GuideCode>{`:root { --blue-60: #4589ff; }                       /* Tier 1 — primitive, no meaning */
:root { --text-primary: var(--gray-100); }          /* Tier 2 — semantic, name by intent */
.button { --button-color-primary: var(--link-primary); }  /* Tier 3 — component-scoped */

--bg-primary  --bg-secondary  --bg-card    /* [category]-[role]-[variant] sorts together */

.button { background: var(--btn-bg, var(--color-primary, #6366f1)); }  /* fallback chain */`}</GuideCode>
        <GuideRules items={[
          'Components should consume the semantic tier, not primitives directly — redefining what a color means never touches component code.',
          'Everything after the first comma in var() is the fallback; nest them for a component library with optional consumer-supplied tokens.',
        ]} />
      </GuidePanel>

      <GuidePanel n={26} title="Theming & @property" accent="pink" glyph="🌗">
        <GuideCode>{`:root { --bg-primary: #0f1117; }
:root[data-theme="light"] { --bg-primary: #f6f7fa; }  /* same NAME, new value */

document.documentElement.dataset.theme = theme;  // "light" | "dark"

@property --gradient-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
/* without @property, custom props are opaque STRINGS — the browser can't interpolate them */`}</GuideCode>
        <GuideRules items={[
          'A theme switch is nothing but redeclaring the same token names under a different selector — no component file has to know dark mode exists.',
          "Registering a token's type is what unlocks smooth animation of angle/color/number custom properties.",
        ]} />
      </GuidePanel>

      <GuidePanel n={27} title="Style-Inclusion Methods" accent="cyan" glyph="🚚" span={2}>
        <GuideTable
          head={['Method', 'Bundle / runtime cost']}
          rows={[
            ['<link> stylesheet', 'Smallest bundle, zero runtime cost — scoping is naming discipline only'],
            ['CSS Modules', 'Hashed at build time — near-zero runtime, real scoping'],
            ['Sass @use', 'Compiles away — same runtime story as plain <link>'],
            ['Runtime CSS-in-JS', 'Styles generated in the browser as props change — real ongoing cost'],
            ['Inline style prop', "SSR-safe, zero extraction step, reads live custom properties; no :hover/media without JS"],
          ]}
        />
        <GuideRules items={["This site's own choice, throughout: inline style + CSS custom properties — SSR-safe with no build step, at the cost of the cascade/pseudo-class ergonomics it doesn't need for a single-owner site."]} />
      </GuidePanel>
    </GuideLayout>
  );
}
