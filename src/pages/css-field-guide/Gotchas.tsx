import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideCssGotchas() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="CSS · Field Reference"
      title="Gotchas & Specificity Pitfalls"
      tagline="The got-ya moments that pass code review and don't show up until someone else's screen — mostly about specificity, containment, and defaults nobody reads."
      meta={['CSS3', '15 gotchas']}
      footerLabel="Personal study reference — CSS Gotchas"
      pageLabel="CSS Field Guide · Gotchas"
      prev={{ path: '/css-field-guide/advanced', label: 'Advanced CSS & Modern Selectors' }}
      next={{ path: '/css-field-guide/patterns', label: 'Layout & Design Patterns' }}
    >
      <PosterCard
        glyph="Sp"
        title={<>Specificity <span className="dim">War</span></>}
        language="css"
        code={`.nav .link { color: blue; }              /* (0,0,2,0) */
#header .nav .link { color: red; }        /* (0,1,2,0) — id wins, ALWAYS */

/* "fix" that makes it worse: */
.link { color: green !important; }        /* now NOTHING but another
                                              !important can touch it */`}
        caption="Reaching for a more specific selector (or !important) to win a fight escalates the war for the next person, who reaches for something even more specific. The real fix is almost always removing the id selector or the earlier !important, not adding a bigger one."
      />

      <PosterCard
        glyph="!i"
        title={<>!important<span className="dim"> Escalation</span></>}
        language="css"
        code={`/* file A, loaded first */
.btn { background: blue !important; }

/* file B, loaded later, SAME specificity + !important */
.btn { background: red !important; }
/* red wins — !important ties still fall back to SOURCE ORDER,
   not "most important important" */`}
        caption="!important doesn't create an unbeatable rule — it just moves the declaration into a higher-priority bucket where specificity and source order still apply exactly as before. Two !important declarations still resolve by the normal cascade rules within that bucket."
      />

      <PosterCard
        glyph="Mc"
        title={<>Margin Collapse<span className="dim"> Surprise</span></>}
        language="css"
        code={`/* 1. SIBLINGS — the gap is the LARGER margin, not the sum */
.a { margin-bottom: 20px; }
.b { margin-top: 30px; }
/* gap between them is 30px, not 50px */

/* 2. PARENT/CHILD — the child's margin ESCAPES the parent if the
   parent has no padding, border, or block formatting context.
   The whole parent box moves down; the child gains no inset. */
.parent { padding: 0; }
.child  { margin-top: 20px; }

/* 3. THROUGH AN EMPTY ELEMENT — a box with no content, height,
   padding or border lets its own top and bottom margins collapse
   together AND merge with its neighbours' */
.spacer { margin: 20px 0; }   /* empty div: contributes 20px total, not 40 */`}
        caption="Three distinct forms, all of which take the LARGEST margin rather than adding. Collapsing only reaches 'through' an element when that element is genuinely empty — no content, height, padding or border. Any of padding, border, display: flow-root, or a flex/grid parent stops it; gap never collapses at all, which is the main reason gap beats margin for spacing children."
      />

      <PosterCard
        glyph="Zi"
        title={<>z-index<span className="dim"> Silently Does Nothing</span></>}
        language="css"
        code={`.modal { z-index: 9999; }  /* ❌ no effect — position is still "static" */

.modal { position: fixed; z-index: 9999; } /* ✅ now it applies */`}
        caption="z-index is IGNORED on statically positioned elements — no error, no warning, it's just quietly a no-op. This is the single most common 'why is my overlay behind everything' bug report."
      />

      <PosterCard
        glyph="Ov"
        title={<>overflow: hidden<span className="dim"> Breaks sticky</span></>}
        language="css"
        code={`/* The real rule: the nearest ancestor with overflow != visible becomes
   the sticky element's scroll container. It does NOT become static. */

.parent { overflow: hidden; }              /* ❌ container can't scroll, so
.parent .sidebar { position: sticky; top: 0; }  nothing to stick against */

.parent { overflow-y: auto; height: 100vh; } /* ✅ works — but sticks to
.parent .sidebar { position: sticky; top: 0; }    THIS box, not the viewport */`}
        caption="Sticky never silently becomes static — it stays sticky, but relative to the nearest ancestor whose overflow isn't visible. overflow: auto/scroll is fine (that ancestor just becomes the scrollport). The real killers are overflow: hidden and clip, where the container cannot scroll at all, so the element has nothing to stick against. A parent with no height set is the other common cause."
      />

      <PosterCard
        glyph="Bx"
        title={<>box-sizing<span className="dim"> Default Trap</span></>}
        language="css"
        code={`.input {
  width: 100%;       /* 300px, say */
  padding: 12px;
  border: 1px solid;
}
/* content-box (the default): RENDERED width = 300 + 24 + 2 = 326px
   — overflows its 300px container by 26px, silently */`}
        caption="Without a global border-box reset, width: 100% plus any padding or border overflows the parent — this is why *, *::before, *::after { box-sizing: border-box } is in nearly every reset ever written, first rule, no exceptions."
      />

      <PosterCard
        glyph="Fs"
        title={<>flex-shrink<span className="dim"> Is Weighted by flex-basis</span></>}
        language="css"
        code={`.row { display: flex; gap: 1rem; }
.row img { flex-shrink: 0; }   /* WITHOUT this: images shrink past
                                   their intrinsic size to fit the row,
                                   sometimes to near-0 width */

/* Shrink factors are NOT a plain ratio the way grow factors are —
   each one is weighted by that item's flex-basis. */
.wide   { flex: 0 1 800px; }
.narrow { flex: 0 1 200px; }
/* Container 600px, so 400px has to come back off:
     weighted factor = flex-shrink x flex-basis
     .wide    1 x 800 = 800  loses 400 x 800/1000 = 320  ->  480px
     .narrow  1 x 200 = 200  loses 400 x 200/1000 =  80  ->  120px
   NOT 600 / 0, which is what an even 200-each split would give. */`}
        caption="flex-shrink: 1 is the default on every flex item, images included — a row that runs out of space squashes an <img> instead of wrapping, because images have no natural minimum width. The basis weighting is why a small item barely moves while a big one gives up a lot, with nothing configured: you can only take from an item in proportion to what it has. So flex-shrink: 3 means '3x a sibling' only when both start from the same basis. flex-shrink: 0 or a min-width opts out."
      />

      <PosterCard
        glyph="Ph"
        title={<>Percentage Height<span className="dim"> Needs a Sized Parent</span></>}
        language="css"
        code={`.parent { /* no explicit height */ }
.child { height: 100%; }  /* ❌ resolves to 0 — parent has no defined height
                              for the percentage to be relative TO */

.parent { height: 100vh; }
.child { height: 100%; }  /* ✅ now 100% has something concrete to measure against */`}
        caption="A percentage height only works if the parent has an explicit (or otherwise definite) height — height: 100% cascading through a chain of auto-height parents resolves to 0 at every level, silently, with no error."
      />

      <PosterCard
        glyph="Ui"
        title={<>:invalid<span className="dim"> Fires Before Anyone Types</span></>}
        language="css"
        code={`/* ❌ a required field is invalid while it is still EMPTY, so every
   input on the form turns red the instant the page loads */
input:invalid { border-color: red; }

/* ✅ matches only once the user has interacted AND left it bad */
input:user-invalid { border-color: red; }
input:user-valid   { border-color: green; }`}
        caption=":invalid is a statement about the value alone and it is true from first paint; :user-invalid adds 'and the user has already had their turn with this field'. For error styling you almost always want the second — the first is why so many forms greet you entirely in red."
      />

      <PosterCard
        glyph="Is"
        title={<>height: auto<span className="dim"> Won&apos;t Animate</span></>}
        language="css"
        code={`.panel { height: 0; transition: height 300ms; }
.panel.open { height: auto; }   /* ❌ snaps — auto is a keyword, and
                                    the browser can't interpolate
                                    toward a value it hasn't computed */

/* ✅ opt the subtree into interpolating keyword sizes. Set once. */
:root { interpolate-size: allow-keywords; }
/* per-value opt-in instead of globally: */
.drawer { max-height: calc-size(max-content, size + 2rem); }`}
        caption="The max-height: 1000px guess makes the easing a lie (the growth finishes in the first fraction of the duration) and clips if you guess low. The grid 0fr → 1fr trick is the correct fallback and the safe default today; interpolate-size is the real answer for new code — feature-detect it with @supports if your baseline is conservative."
      />

      <PosterCard
        glyph="Nt"
        title={<>:not()<span className="dim"> Still Carries Specificity</span></>}
        language="css"
        code={`li:not(.active) { color: gray; }
/* :not()'s specificity = its ARGUMENT's specificity, same rule as :is() */
/* (0,0,1,1) — the .active class inside :not() counts */

li:not(:where(.active)) { color: gray; }  /* :where() zeroes it back out */`}
        caption=":not() is often assumed to be 'free' the way a combinator is — it isn't. It takes on the specificity of whatever selector is inside it, same as :is(). Wrap the argument in :where() if you specifically need zero added specificity."
      />

      <PosterCard
        glyph="Ta"
        title={<>transition: all<span className="dim"> Animates More Than You Think</span></>}
        language="css"
        code={`.card { transition: all 0.3s ease; }
/* ❌ animates EVERY property that changes, including ones you
   didn't intend — height changes from content reflow, color
   changes from a theme swap — all get the same 0.3s treatment,
   and "all" also has a real perf cost: browser has to check
   every animatable property on every frame */

.card { transition: background-color 0.3s ease, transform 0.3s ease; }`}
        caption="transition: all is a footgun for both correctness (unexpected properties animate) and performance (the browser can't optimize what it doesn't know is coming). Name the exact properties you intend to transition."
      />

      <PosterCard
        glyph="Ly"
        title={<>Unlayered Styles<span className="dim"> Always Beat @layer</span></>}
        language="css"
        code={`@layer base { .btn { color: blue; } }

.btn { color: red; }  /* NOT in any @layer */
/* red wins — ANY unlayered declaration beats ANY layered one,
   regardless of specificity OR layer order */`}
        caption="Cascade layers only govern priority AMONG layered styles — a single unlayered rule anywhere in the stylesheet outranks every @layer, including ones declared later. Adopting @layer for a component library means wrapping ALL of it, or an app's un-layered override styles will always win unexpectedly."
      />

      <PosterCard
        glyph="Ai"
        title={<>align-items: stretch<span className="dim"> Default</span></>}
        language="css"
        code={`.row { display: flex; }  /* align-items defaults to STRETCH, not flex-start */
.row .card { /* no explicit height set */ }
/* every .card silently stretches to match the TALLEST sibling's height —
   surprising when you expected each card to size to its own content */`}
        caption="stretch is flexbox's default cross-axis alignment, which is why flex children with no explicit height all end up the same height as the tallest one — set align-items: flex-start explicitly when content-sized rows are what you actually want."
      />

      <PosterCard
        glyph="Mw"
        title={<>min-width: auto<span className="dim"> Refuses to Shrink</span></>}
        language="css"
        code={`.layout { display: flex; }
.main   { flex: 1; }
/* ❌ a long URL or a wide <pre> inside .main forces a page-level
   horizontal scrollbar. flex-shrink can't help: flex and grid items
   default to min-width: auto, which resolves to their MIN-CONTENT
   size — a hard floor below which they will not go. */

.main { flex: 1; min-width: 0; }   /* ✅ the whole fix */
/* column direction / grid rows use min-height: 0 instead */`}
        caption="The most common flexbox bug there is, and the reason text-overflow: ellipsis 'doesn't work' inside flex — truncation needs the box to get narrower than its text, and the automatic minimum size forbids it. Set min-width: 0 on the flex ITEM, not on the element with the ellipsis. overflow: hidden has the same effect, since any overflow other than visible changes the automatic minimum to 0."
      />

      <PosterQuickRef
        title="Symptom → root cause"
        rows={[
          { need: 'z-index has no visible effect', answer: "Element isn't positioned — add position: relative/absolute/fixed" },
          { need: 'position: sticky does nothing', answer: 'Ancestor has overflow: hidden or clip (auto/scroll are fine), or no height — it never falls back to static' },
          { need: 'width: 100% overflows its container', answer: 'Missing box-sizing: border-box' },
          { need: 'An <img> in a flex row gets squashed', answer: 'flex-shrink: 0 needed — images shrink by default' },
          { need: 'One flex item collapsed, its sibling barely moved', answer: 'Shrink is weighted by flex-basis, not a plain ratio' },
          { need: 'height: 100% resolves to nothing', answer: 'Parent chain has no definite height' },
          { need: 'A child margin pushed the whole parent down', answer: 'Margin collapsed through the parent — add padding or a BFC' },
          { need: 'Cards are all the same height unexpectedly', answer: 'align-items: stretch is the flex default' },
          { need: 'New override rule refuses to win', answer: "Check for an unlayered rule beating your @layer, or an existing !important" },
          { need: 'Long content forces a horizontal scrollbar', answer: 'Flex/grid item needs min-width: 0 — min-width: auto is the default floor' },
          { need: "text-overflow: ellipsis does nothing in a flex row", answer: 'Same cause — add min-width: 0 to the flex item' },
          { need: 'Every required field is red on page load', answer: ':invalid matches empty fields — use :user-invalid' },
          { need: 'Transition to height: auto just snaps', answer: 'interpolate-size: allow-keywords (or the grid 0fr → 1fr trick)' },
        ]}
      />
    </PosterLayout>
  );
}
