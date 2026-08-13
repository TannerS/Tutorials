import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideCssBasics() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="CSS · Field Reference"
      title="CSS Basics Cheat Sheet"
      tagline="Box model, cascade, units, positioning — the fundamentals condensed for a fast lookup, not a first read."
      meta={['CSS3', '14 fundamentals']}
      footerLabel="Personal study reference — CSS Basics"
      pageLabel="CSS Field Guide · Basics"
      prev={null}
      next={{ path: '/css-field-guide/advanced', label: 'Advanced CSS & Modern Selectors' }}
    >
      <PosterCard
        glyph="Bx"
        title={<>Box Model<span className="dim"> — content vs border-box</span></>}
        language="css"
        code={`/* content-box (default): width = CONTENT only,
   padding/border are ADDED on top */
.a { box-sizing: content-box; width: 200px; padding: 20px; }
/* rendered width = 240px */

/* border-box: width INCLUDES padding + border */
.b { box-sizing: border-box; width: 200px; padding: 20px; }
/* rendered width = 200px */

*, *::before, *::after { box-sizing: border-box; } /* set this globally */`}
        caption="content-box is the CSS default and it's almost never what you want — padding silently grows the element past the width you set. Every modern reset flips to border-box globally on day one."
      />

      <PosterCard
        glyph="Sp"
        title={<>Specificity<span className="dim"> — the four-column score</span></>}
        language="css"
        code={`/* (inline, id, class/attr/pseudo-class, element/pseudo-element) */
h1                  { }  /* (0,0,0,1) */
.title              { }  /* (0,0,1,0) */
#page-title         { }  /* (0,1,0,0) */
div.title.large     { }  /* (0,0,2,1) */
style="color:red"      /* (1,0,0,0) — always wins over any selector */

/* Higher column wins outright — 1 id beats 100 classes */`}
        caption="Compare left to right, column by column — a single id always beats any number of classes, and any number of classes always beats any number of element selectors. Equal specificity falls back to source order: last declared wins."
      />

      <PosterCard
        glyph="Ca"
        title={<>The Cascade<span className="dim"> & !important</span></>}
        language="css"
        code={`.card { color: blue; }
.card { color: red !important; }   /* wins regardless of specificity */

/* Cascade resolution order (simplified):
   1. Origin & importance (user !important > author !important > author > user-agent)
   2. Specificity
   3. Source order (last wins on a tie) */`}
        caption="!important flips a declaration into its own higher-priority bucket — two !important rules on the same property still fall back to specificity, then source order, to break the tie. Treat it as a last resort, not a specificity shortcut."
      />

      <PosterCard
        glyph="Ih"
        title={<>Inheritance<span className="dim"> — and the four global keywords</span></>}
        language="css"
        code={`/* INHERITED by default: text-ish properties */
color, font-*, line-height, text-align, visibility, letter-spacing

/* NOT inherited: box & layout properties */
margin, padding, border, background, width, display, position

body { color: #333; font-family: system-ui; } /* every descendant gets these free */

.a { color: inherit; }  /* force-take the parent's computed value */
.a { color: initial; }  /* the spec default for that property */
.a { color: unset; }    /* inherit if inheritable, else initial */
.a { all: revert; }     /* roll back to the browser's own stylesheet */

input, button, select, textarea { font: inherit; } /* form controls DON'T inherit font */`}
        caption="Setting color and font once on body is inheritance doing the work for you — but form controls are the famous exception, they opt out of font inheritance entirely, which is why `font: inherit` on inputs is in every reset ever written."
      />

      <PosterCard
        glyph="Cb"
        title={<>Combinators<span className="dim"> — space, &gt;, +, ~</span></>}
        language="css"
        code={`.card p    { }  /* DESCENDANT — any depth below */
.menu > li { }  /* CHILD — direct children only, one level */
h2 + p     { }  /* ADJACENT SIBLING — the very NEXT sibling element */
h2 ~ p     { }  /* GENERAL SIBLING — any LATER sibling, same parent */

/* Combinators add ZERO specificity — only the selectors around them count */
.a .b  /* (0,0,2,0) */
.a > .b /* (0,0,2,0) — identical score */`}
        caption="The descendant space is the one people forget is a combinator at all — which is why `.menu li` accidentally catching a nested submenu's items is such a common bug, and `>` is the fix. Note that siblings only look forward: there is no previous-sibling combinator, that job belongs to :has()."
      />

      <PosterCard
        glyph="Un"
        title={<>Units<span className="dim"> — px vs rem vs em vs %</span></>}
        language="css"
        code={`html { font-size: 100%; }        /* respects user's browser setting */
.title { font-size: 2rem; }      /* relative to ROOT font-size, always */
.title .sub { font-size: 0.8em; } /* relative to PARENT's font-size — compounds! */
.box { width: 50%; }             /* relative to parent's width */

/* Viewport units — vh is the mobile footgun */
.a { height: 100vh; }  /* LARGE viewport: ignores the URL bar, so content
                          is clipped while the bar is showing */
.b { height: 100svh; } /* SMALL viewport: assumes the bar is visible — safe,
                          never clips, but leaves a gap once it hides */
.c { height: 100dvh; } /* DYNAMIC: tracks the bar live. Best for a full-height
                          body; avoid for scroll-snap, since resizing
                          mid-scroll fights the snap. */`}
        caption="rem is the safe default for type scale — it never compounds because it always reads the root; em compounds through nesting, a feature for component-local scaling and a footgun everywhere else. For full-height layouts reach for dvh, not vh: 100vh measures the viewport as if the mobile URL bar were hidden, so it overflows while the bar is on screen."
      />

      <PosterCard
        glyph="Ps"
        title={<>position<span className="dim"> — five values</span></>}
        language="css"
        code={`.a { position: static; }             /* default — no offset props apply */
.b { position: relative; top: 4px; } /* offset from its OWN normal spot */
.c { position: absolute; top: 0; }   /* offset from nearest positioned ancestor */
.d { position: fixed; bottom: 0; }   /* offset from the VIEWPORT, ignores scroll */
.e { position: sticky; top: 0; }     /* relative until a scroll threshold, then fixed */`}
        caption="absolute positions relative to the nearest ancestor that is NOT static — that's the single most common positioning bug: forgetting to add position: relative to the intended anchor."
      />

      <PosterCard
        glyph="Di"
        title={<>display<span className="dim"> — block, inline, inline-block, none</span></>}
        language="css"
        code={`.block  { display: block; }        /* full width, respects width/height/margin-block */
.inline { display: inline; }       /* flows in text, IGNORES width/height/vertical margin */
.hybrid { display: inline-block; } /* flows inline, but respects width/height/margin */
.hidden { display: none; }         /* removed from layout AND accessibility tree entirely */`}
        caption="display: none removes the element from layout and from the accessibility tree — different from visibility: hidden (still takes up space, still in the a11y tree in most cases) or opacity: 0 (still clickable unless pointer-events is also set)."
      />

      <PosterCard
        glyph="Cl"
        title={<>Color Functions<span className="dim"> — hex, rgb, hsl</span></>}
        language="css"
        code={`.a { color: #6366f1; }                      /* hex */
.b { color: rgb(99 102 241 / 60%); }        /* rgb, modern space-separated + alpha */
.c { color: hsl(243 75% 67%); }             /* hue, saturation, lightness — easy to reason about */
.d { border-color: currentColor; }          /* inherits the element's own text color */
.e { background: color-mix(in oklch, #6366f1 80%, black); }`}
        caption="hsl() is the easiest to hand-tune (drop lightness for a darker shade, raise saturation to pop) — hex is the most compact but opaque to read. currentColor is the quiet trick that keeps borders/icons in sync with text color for free."
      />

      <PosterCard
        glyph="Ps2"
        title={<>Pseudo-class<span className="dim"> vs pseudo-element</span></>}
        language="css"
        code={`/* pseudo-CLASS (single colon) — targets a STATE of a real element */
.btn:hover { }
.btn:focus-visible { }
li:first-child { }

/* pseudo-ELEMENT (double colon) — targets a sub-part that ISN'T a real DOM node */
.quote::before { content: open-quote; }
p::first-line { }
input::placeholder { color: gray; }`}
        caption="Modern convention is single colon for classes (:hover), double colon for elements (::before) — CSS still accepts single-colon ::before as ::before for legacy reasons, but write it double to keep the distinction visible."
      />

      <PosterCard
        glyph="Mc"
        title={<>Margin Collapsing<span className="dim"> — vertical only</span></>}
        language="css"
        code={`.a { margin-bottom: 20px; }
.b { margin-top: 30px; }
/* .a and .b stacked: gap between them is 30px, NOT 50px — the larger wins */

/* Fixes: */
.parent { display: flow-root; }  /* new block formatting context — no collapsing */
.parent { padding-top: 1px; }    /* or gap/flex/grid, which never collapse */`}
        caption="Only vertical margins between block-level siblings (and between a parent and its first/last child) collapse — horizontal margins never do, and flex/grid item margins never do either. Reach for gap over margin in a flex/grid container specifically to sidestep this."
      />

      <PosterCard
        glyph="Zi"
        title={<>z-index<span className="dim"> & stacking contexts</span></>}
        language="css"
        code={`.a { position: relative; z-index: 999; } /* only competes within its OWN stacking context */

.parent { position: relative; z-index: 1; }  /* creates a NEW stacking context */
.parent .child { position: relative; z-index: 9999; }
/* child's 9999 is still trapped INSIDE .parent's context — can't escape it */`}
        caption="z-index only requires position !== static to apply, but it only compares against SIBLINGS within the same stacking context — a new stacking context (opacity < 1, transform, filter, position + z-index, etc.) traps all descendant z-index values inside it."
      />

      <PosterCard
        glyph="Sh"
        title={<>Shorthand Properties<span className="dim"> — order matters</span></>}
        language="css"
        code={`margin: 10px;                 /* all sides */
margin: 10px 20px;             /* vertical | horizontal */
margin: 10px 20px 30px;        /* top | horizontal | bottom */
margin: 10px 20px 30px 40px;   /* top | right | bottom | left — clockwise */

font: italic 700 1.2rem/1.5 'Inter', sans-serif; /* style weight size/line-height family */
background: url(bg.jpg) center/cover no-repeat;   /* image position/size repeat */`}
        caption="Any shorthand you don't fully specify resets the OMITTED longhands to their initial value — `border: 1px solid red` after a `border-radius` elsewhere is fine, but `font: ...` resets font-variant/font-stretch you may not have meant to touch."
      />

      <PosterCard
        glyph="At"
        title={<>Attribute Selectors<span className="dim"> — beyond [class]</span></>}
        language="css"
        code={`[disabled] { opacity: 0.5; }                 /* attribute present, any value */
[type="email"] { }                            /* exact match */
[class^="icon-"] { }                          /* STARTS with */
[href$=".pdf"] { }                            /* ENDS with */
[data-status*="error"] { }                    /* CONTAINS substring */
a[href^="https://"][target="_blank"] { }      /* chain multiple */`}
        caption="Attribute selectors add specificity like a class (0,0,1,0 each) and let you style off data-* attributes React apps already have, without inventing a parallel class-naming scheme for every state."
      />

      <PosterQuickRef
        title="Which CSS fundamental do I need?"
        rows={[
          { need: 'Make width include padding + border', answer: 'box-sizing: border-box' },
          { need: 'Font size that never compounds', answer: 'rem, not em' },
          { need: 'Direct children only, not all descendants', answer: '> child combinator' },
          { need: 'Style the element right after another', answer: '+ adjacent sibling' },
          { need: 'Make inputs match the page font', answer: 'font: inherit' },
          { need: 'Pin an element to the viewport', answer: 'position: fixed' },
          { need: 'Pin until scrolled past, then stick', answer: 'position: sticky' },
          { need: 'Remove from layout AND a11y tree', answer: 'display: none' },
          { need: 'Border that matches text color', answer: 'border-color: currentColor' },
          { need: 'Style a state (hover/focus)', answer: 'single-colon pseudo-class' },
          { need: 'Style a non-DOM sub-part', answer: 'double-colon pseudo-element' },
          { need: 'Stop unexpected vertical margin merging', answer: 'gap in flex/grid, or display: flow-root' },
          { need: 'z-index not applying', answer: 'add position: relative (or similar) first' },
        ]}
      />
    </PosterLayout>
  );
}
