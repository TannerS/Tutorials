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
      meta={['CSS3', '12 gotchas']}
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
        code={`.section { margin-bottom: 40px; }
.section:last-child { margin-bottom: 0; }
/* footer directly after .section still gets a gap from
   the SECOND-to-last margin, not what you'd expect —
   collapsing "reaches through" empty/margin-only elements too */

.parent { padding: 0; }
.child { margin-top: 20px; }
/* child's margin ESCAPES the parent entirely if parent has
   no padding/border/BFC — parent moves down, not the child */`}
        caption="The second case trips people up constantly: a child's top margin can collapse THROUGH its own parent if the parent has no padding, border, or established block formatting context — the whole parent box shifts down instead of gaining internal space."
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
        code={`.scroll-parent { overflow-y: auto; }  /* or overflow: hidden, clip, scroll */
.scroll-parent .sidebar { position: sticky; top: 0; }
/* ❌ sticky silently falls back to static behavior — ANY ancestor
   with overflow other than visible breaks it, not just the direct parent */`}
        caption="position: sticky requires every ancestor up to the scrolling container to have overflow: visible (the default). Adding overflow: hidden anywhere in that chain — even for an unrelated clipping reason — silently disables sticky with no console warning."
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
        title={<>flex-shrink<span className="dim"> Default Causes Overflow</span></>}
        language="css"
        code={`.row { display: flex; gap: 1rem; }
.row img { flex-shrink: 0; }   /* WITHOUT this: images shrink past
                                   their intrinsic size to fit the row,
                                   sometimes to near-0 width */`}
        caption="flex-shrink: 1 is the default on every flex item, including images — a row that runs out of space will squash an <img> instead of wrapping, because images have no natural minimum width. flex-shrink: 0 or min-width on the item fixes it."
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

      <PosterQuickRef
        title="Symptom → root cause"
        rows={[
          { need: 'z-index has no visible effect', answer: "Element isn't positioned — add position: relative/absolute/fixed" },
          { need: 'position: sticky does nothing', answer: 'Some ancestor has overflow != visible' },
          { need: 'width: 100% overflows its container', answer: 'Missing box-sizing: border-box' },
          { need: 'An <img> in a flex row gets squashed', answer: 'flex-shrink: 0 needed — images shrink by default' },
          { need: 'height: 100% resolves to nothing', answer: 'Parent chain has no definite height' },
          { need: 'A child margin pushed the whole parent down', answer: 'Margin collapsed through the parent — add padding or a BFC' },
          { need: 'Cards are all the same height unexpectedly', answer: 'align-items: stretch is the flex default' },
          { need: 'New override rule refuses to win', answer: "Check for an unlayered rule beating your @layer, or an existing !important" },
        ]}
      />
    </PosterLayout>
  );
}
