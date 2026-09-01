import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function CssBasicsCheatsheet() {
  return (
    <GuideLayout
      title="CSS Basics"
      kicker="FIELD GUIDE"
      glyph="🃏"
      tagline="Box model, cascade, units, positioning — the fundamentals condensed for a fast lookup, not a first read."
      meta={['CSS3', '12 panels']}
      page="1 / 6"
      footer="This page is for recall. The lessons in this section carry the walkthroughs — this is the fast-lookup sheet."
      prev={null}
      next={{ path: '/css-field-guide/advanced', label: 'Advanced CSS & Modern Selectors' }}
    >
      <GuidePanel n={1} title="Box Model" accent="blue" glyph="📦">
        <GuideCode>{`/* content-box (default): width = CONTENT only,
   padding/border are ADDED on top */
.a { box-sizing: content-box; width: 200px; padding: 20px; }
/* rendered width = 240px */

/* border-box: width INCLUDES padding + border */
.b { box-sizing: border-box; width: 200px; padding: 20px; }
/* rendered width = 200px */

*, *::before, *::after { box-sizing: border-box; } /* set this globally */`}</GuideCode>
        <GuideRules items={[
          'content-box is the default and it is almost never what you want — padding silently grows the element past the width you set.',
          'Every modern reset flips to border-box globally on day one.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Specificity & Cascade" accent="purple" glyph="⚖️" span={2}>
        <GuideCode>{`/* (inline, id, class/attr/pseudo-class, element/pseudo-element) */
h1                  { }  /* (0,0,0,1) */
.title              { }  /* (0,0,1,0) */
#page-title         { }  /* (0,1,0,0) */
div.title.large     { }  /* (0,0,2,1) */
style="color:red"      /* (1,0,0,0) — always wins over any selector */

.card { color: blue; }
.card { color: red !important; }   /* wins regardless of specificity */`}</GuideCode>
        <GuideRules items={[
          'Compare left to right, column by column — one id beats any number of classes; any number of classes beats any number of element selectors.',
          'Equal specificity falls back to source order: last declared wins.',
          'Cascade order, simplified: origin & importance (user !important > author !important > author > user-agent) → specificity → source order.',
          '!important flips a declaration into its own higher-priority bucket, but two !important rules on the same property still fall back to specificity, then source order — treat it as a last resort, not a specificity shortcut.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Inheritance & Global Keywords" accent="green" glyph="🧬">
        <GuideCode>{`/* INHERITED by default: text-ish properties */
color, font-*, line-height, text-align, visibility, letter-spacing

/* NOT inherited: box & layout properties */
margin, padding, border, background, width, display, position

input, button, select, textarea { font: inherit; } /* form controls DON'T inherit font */`}</GuideCode>
        <GuideDefs
          items={[
            ['inherit', "force-take the parent's computed value"],
            ['initial', 'the spec default for that property'],
            ['unset', 'inherit if inheritable, else initial'],
            ['all: revert', "roll back to the browser's own stylesheet"],
          ]}
        />
        <GuideRules items={[
          'Setting color and font once on body is inheritance doing the work for you.',
          "Form controls are the famous exception — they opt out of font inheritance, which is why font: inherit on inputs is in every reset ever written.",
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Combinators" accent="amber" glyph="🔗">
        <GuideCode>{`.card p    { }  /* DESCENDANT — any depth below */
.menu > li { }  /* CHILD — direct children only, one level */
h2 + p     { }  /* ADJACENT SIBLING — the very NEXT sibling element */
h2 ~ p     { }  /* GENERAL SIBLING — any LATER sibling, same parent */

/* Combinators add ZERO specificity — only the selectors around them count */
.a .b   /* (0,0,2,0) */
.a > .b /* (0,0,2,0) — identical score */`}</GuideCode>
        <GuideRules items={[
          'The descendant space is the one people forget is a combinator at all — ".menu li" accidentally catching a nested submenu is a common bug, and > is the fix.',
          'Siblings only look forward — there is no previous-sibling combinator, that job belongs to :has().',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Units — px, rem, em, %, viewport" accent="pink" glyph="📏">
        <GuideCode>{`html { font-size: 100%; }        /* respects user's browser setting */
.title { font-size: 2rem; }      /* relative to ROOT font-size, always */
.title .sub { font-size: 0.8em; } /* relative to PARENT's font-size — compounds! */
.box { width: 50%; }             /* relative to parent's width */

.a { height: 100vh; }  /* LARGE viewport: ignores the URL bar, clipped
                          while it is showing */
.b { height: 100svh; } /* SMALL viewport: assumes the bar is visible —
                          safe, but leaves a gap once it hides */
.c { height: 100dvh; } /* DYNAMIC: tracks the bar live. Best for a
                          full-height body; avoid with scroll-snap. */`}</GuideCode>
        <GuideRules items={[
          'rem is the safe default for type scale — it always reads the root, so it never compounds.',
          'em compounds through nesting — a feature for component-local scaling, a footgun everywhere else.',
          'For full-height layouts reach for dvh, not vh: 100vh measures as if the mobile URL bar were hidden and overflows while it is on screen.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="position — five values" accent="cyan" glyph="📍">
        <GuideCode>{`.a { position: static; }             /* default — no offset props apply */
.b { position: relative; top: 4px; } /* offset from its OWN normal spot */
.c { position: absolute; top: 0; }   /* offset from nearest positioned ancestor */
.d { position: fixed; bottom: 0; }   /* offset from the VIEWPORT, ignores scroll */
.e { position: sticky; top: 0; }     /* relative until a scroll threshold, then fixed */`}</GuideCode>
        <GuideRules items={[
          'absolute positions relative to the nearest ancestor that is NOT static — forgetting position: relative on the intended anchor is the single most common positioning bug.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="display — block, inline, inline-block, none" accent="red" glyph="👁️">
        <GuideCode>{`.block  { display: block; }        /* full width, respects width/height/margin-block */
.inline { display: inline; }       /* flows in text, IGNORES width/height/vertical margin */
.hybrid { display: inline-block; } /* flows inline, but respects width/height/margin */
.hidden { display: none; }         /* removed from layout AND accessibility tree entirely */`}</GuideCode>
        <GuideRules items={[
          'display: none removes the element from layout and from the accessibility tree.',
          "That's different from visibility: hidden (still takes up space, still in the a11y tree in most cases) or opacity: 0 (still clickable unless pointer-events is also set).",
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Color Functions" accent="blue" glyph="🎨">
        <GuideCode>{`.a { color: #6366f1; }                      /* hex */
.b { color: rgb(99 102 241 / 60%); }        /* rgb, modern space-separated + alpha */
.c { color: hsl(243 75% 67%); }             /* hue, saturation, lightness — easy to reason about */
.d { border-color: currentColor; }          /* inherits the element's own text color */
.e { background: color-mix(in oklch, #6366f1 80%, black); }`}</GuideCode>
        <GuideRules items={[
          'hsl() is the easiest to hand-tune — drop lightness for a darker shade, raise saturation to pop.',
          'hex is the most compact but opaque to read.',
          'currentColor is the quiet trick that keeps borders/icons in sync with text color for free.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Pseudo-class vs Pseudo-element" accent="purple" glyph="🎭">
        <GuideCode>{`/* pseudo-CLASS (single colon) — targets a STATE of a real element */
.btn:hover { }
.btn:focus-visible { }
li:first-child { }

/* pseudo-ELEMENT (double colon) — targets a sub-part that ISN'T a real DOM node */
.quote::before { content: open-quote; }
p::first-line { }
input::placeholder { color: gray; }`}</GuideCode>
        <GuideRules items={[
          'Modern convention is single colon for classes (:hover), double colon for elements (::before).',
          'CSS still accepts single-colon ::before for legacy reasons, but write it double to keep the distinction visible.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Margin Collapsing & Stacking Contexts" accent="green" glyph="🧱" span={2}>
        <GuideCode>{`.a { margin-bottom: 20px; }
.b { margin-top: 30px; }
/* .a and .b stacked: gap between them is 30px, NOT 50px — the larger wins */

.parent { display: flow-root; }  /* new block formatting context — no collapsing */

.parent { position: relative; z-index: 1; }  /* creates a NEW stacking context */
.parent .child { position: relative; z-index: 9999; }
/* child's 9999 is still trapped INSIDE .parent's context — can't escape it */`}</GuideCode>
        <GuideRules items={[
          'Only vertical margins between block-level siblings (and a parent with its first/last child) collapse — horizontal margins never do, and flex/grid item margins never do either.',
          'gap in a flex/grid container sidesteps collapsing entirely; display: flow-root is the fix for block layouts.',
          'z-index only requires position !== static, but it only compares against SIBLINGS within the same stacking context — opacity < 1, transform, filter, or position + z-index all create a new one that traps descendant z-index values inside it.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Shorthand & Attribute Selectors" accent="amber" glyph="✂️" span={2}>
        <GuideCode>{`margin: 10px 20px 30px 40px;   /* top | right | bottom | left — clockwise */
font: italic 700 1.2rem/1.5 'Inter', sans-serif; /* style weight size/line-height family */
background: url(bg.jpg) center/cover no-repeat;   /* image position/size repeat */

[disabled] { opacity: 0.5; }             /* attribute present, any value */
[type="email"] { }                        /* exact match */
[class^="icon-"] { }                      /* STARTS with */
[href$=".pdf"] { }                        /* ENDS with */
[data-status*="error"] { }                /* CONTAINS substring */`}</GuideCode>
        <GuideRules items={[
          "Any shorthand you don't fully specify resets the OMITTED longhands to their initial value — font: ... resets font-variant/font-stretch you may not have meant to touch.",
          'Attribute selectors add specificity like a class (0,0,1,0 each) and let you style off data-* attributes React apps already have.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Quick Lookup" accent="pink" glyph="🔍" span={2}>
        <GuideTable
          head={['Need', 'Answer']}
          rows={[
            ['Make width include padding + border', 'box-sizing: border-box'],
            ['Font size that never compounds', 'rem, not em'],
            ['Direct children only, not all descendants', '> child combinator'],
            ['Style the element right after another', '+ adjacent sibling'],
            ['Make inputs match the page font', 'font: inherit'],
            ['Pin an element to the viewport', 'position: fixed'],
            ['Pin until scrolled past, then stick', 'position: sticky'],
            ['Remove from layout AND a11y tree', 'display: none'],
            ['Border that matches text color', 'border-color: currentColor'],
            ['Style a state (hover/focus)', 'single-colon pseudo-class'],
            ['Style a non-DOM sub-part', 'double-colon pseudo-element'],
            ['Stop unexpected vertical margin merging', 'gap in flex/grid, or display: flow-root'],
            ['z-index not applying', 'add position: relative (or similar) first'],
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}
