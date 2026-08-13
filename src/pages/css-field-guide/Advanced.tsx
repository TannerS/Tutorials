import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideCssAdvanced() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="CSS · Field Reference"
      title="Advanced CSS & Modern Selectors"
      tagline="Grid/flexbox tricks and the 2023+ selector toolkit — :has(), container queries, subgrid, native nesting."
      meta={['CSS Grid Level 2', '18 techniques']}
      footerLabel="Personal study reference — Advanced CSS"
      pageLabel="CSS Field Guide · Advanced"
      prev={{ path: '/css-field-guide/basics', label: 'CSS Basics Cheat Sheet' }}
      next={{ path: '/css-field-guide/gotchas', label: 'Gotchas & Specificity Pitfalls' }}
    >
      <PosterCard
        glyph="AF"
        title={<>auto-fit<span className="dim"> + minmax() Grid</span></>}
        language="css"
        code={`.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}
/* responsive card grid — ZERO media queries. Tracks collapse
   and cards stretch to fill the row as the viewport shrinks. */`}
        caption="auto-fit collapses empty tracks so existing cards stretch to fill the space; auto-fill keeps the empty tracks (useful when you want consistent card width and don't want stretching)."
      />

      <PosterCard
        glyph="GA"
        title={<>grid-template-areas<span className="dim"> — named regions</span></>}
        language="css"
        code={`.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "nav    main"
    "footer footer";
  grid-template-columns: 200px 1fr;
}
.layout > header { grid-area: header; }
.layout > nav    { grid-area: nav; }`}
        caption="ASCII-art layout that's self-documenting in the CSS itself — reordering the visual layout for a breakpoint is just rewriting the string in a media query, no renumbering of columns/rows."
      />

      <PosterCard
        glyph="Fx"
        title={<>Flexbox One-Liners</>}
        language="css"
        code={`.center   { display: flex; justify-content: center; align-items: center; }
/* ❌ NOT place-items: center — justify-items is IGNORED in flexbox,
   so you'd get cross-axis centring only. place-items is a GRID shorthand. */
.between  { display: flex; justify-content: space-between; align-items: center; }
.stack    { display: flex; flex-direction: column; gap: 1rem; }
.wrap     { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.pin-end  { display: flex; }  .pin-end > :last-child { margin-left: auto; }`}
        caption="Centring on both axes in flexbox takes the two-liner (justify-content + align-items); only display: grid can do it with place-items, because flex containers ignore justify-items outright. margin-left: auto on a flex item consumes ALL remaining free space up to that point — the classic trick for pinning one item to the far edge without switching to space-between."
      />

      <PosterCard
        glyph="Gp"
        title={<>gap<span className="dim"> — works in flex too, not just grid</span></>}
        language="css"
        code={`.row { display: flex; gap: 1rem 2rem; }  /* row-gap column-gap */
/* gap NEVER collapses like margin does, and only adds space
   BETWEEN items — no leading/trailing space to subtract off */`}
        caption="Before gap shipped for flexbox (~2021, now universal), spacing between flex items required margin tricks with negative-margin containers to cancel the extra edge space — gap makes that entire workaround obsolete."
      />

      <PosterCard
        glyph="Hs"
        title={<>:has()<span className="dim"> — the parent selector</span></>}
        language="css"
        code={`/* style a card differently IF it contains an image */
.card:has(img) { grid-template-rows: 200px 1fr; }

/* form field reacts to its OWN child's validity */
.field:has(input:invalid) { border-color: red; }

/* nav item highlights when its link is the current page */
li:has(> a[aria-current="page"]) { background: var(--accent-dim); }`}
        caption=":has() checks a condition on descendants and styles the ANCESTOR — the one relationship CSS selectors couldn't express for two decades. It unlocks patterns that used to require JavaScript just to toggle a class."
      />

      <PosterCard
        glyph="IW"
        title={<>:is() <span className="dim">vs</span> :where()</>}
        language="css"
        code={`/* :is() takes the specificity of its MOST specific argument */
:is(article, .post) h2 { }        /* specificity: (0,0,1,1) — from .post */

/* :where() ALWAYS has zero specificity — trivial to override */
:where(ul, ol) { padding-left: 1.5rem; }
.compact { padding-left: 0.5rem; }  /* wins easily, no fight needed */`}
        caption="Use :where() for resets/defaults you WANT consumers to override without a specificity fight. Use :is() when you want the grouped selector to carry real, comparable weight."
      />

      <PosterCard
        glyph="CQ"
        title={<>Container Queries<span className="dim"> — @container</span></>}
        language="css"
        code={`.card-wrapper { container-type: inline-size; container-name: card; }

@container card (min-width: 400px) {
  .card { grid-template-columns: 120px 1fr; }
}
/* responds to the PARENT's width, not the viewport —
   the same .card component adapts in a 300px sidebar
   AND a 900px main column, correctly, in both places */`}
        caption="Media queries only ever see the viewport; container queries let a component respond to the space its own container actually gives it — the single biggest gap component-driven CSS had until 2023."
      />

      <PosterCard
        glyph="cq"
        title={<>Container Units<span className="dim"> — cqi / cqw / cqb</span></>}
        language="css"
        code={`.wrapper { container-type: inline-size; }

.card__title { font-size: clamp(1rem, 5cqi, 2rem); }
.card__body  { padding: 2cqi; }
/* cqi = 1% of the CONTAINER's inline size (cqw/cqh/cqb, cqmin/cqmax too).
   vw-based type inside a component is still secretly coupled to the
   viewport — cqi scales with the space the component was actually given. */`}
        caption="With no container-type on an ancestor, container units silently fall back to the small-viewport size — the CSS keeps working but stops being component-relative. That missing container-type is nearly always why cqi 'isn't responding'."
      />

      <PosterCard
        glyph="Sq"
        title={<>Style Queries<span className="dim"> — @container style()</span></>}
        language="css"
        code={`.card { --variant: default; }
.card.is-featured { --variant: featured; }

@container style(--variant: featured) {
  .card__title { font-size: 1.5rem; }
  .card__badge { display: block; }
}
/* style() needs NO container-type — every element is a style container.
   Only SIZE queries require opting in. */`}
        caption="A parent sets one custom property and any descendant can react to it, without threading a modifier class down through every child in the markup."
      />

      <PosterCard
        glyph="Sg"
        title={<>subgrid<span className="dim"> — inherit parent tracks</span></>}
        language="css"
        code={`.outer { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.card { grid-column: span 2; display: grid; grid-template-columns: subgrid; }
/* .card's own children now align to the OUTER grid's column
   tracks — no more independent, misaligned nested grids */`}
        caption="Without subgrid, a nested grid defines its own tracks from scratch, so nested-card contents rarely line up with siblings' contents. subgrid makes the child grid inherit the parent's actual track sizing."
      />

      <PosterCard
        glyph="Cl"
        title={<>clamp()<span className="dim"> — fluid, bounded values</span></>}
        language="css"
        code={`h1 { font-size: clamp(1.75rem, 4vw + 1rem, 3.5rem); }
/*             MIN         PREFERRED         MAX      */
.wrap { padding-inline: clamp(1rem, 5vw, 4rem); }`}
        caption="clamp(min, preferred, max) scales smoothly with viewport width between the two bounds — one declaration replaces 3-4 font-size media query breakpoints, with no visible 'jump' at any width."
      />

      <PosterCard
        glyph="Ar"
        title={<>aspect-ratio<span className="dim"> — intrinsic sizing</span></>}
        language="css"
        code={`.video { aspect-ratio: 16 / 9; width: 100%; }  /* height computed automatically */
.avatar { aspect-ratio: 1; object-fit: cover; }
/* replaces the old padding-top: 56.25% hack entirely */`}
        caption="Before aspect-ratio (2021), a fixed-ratio box needed a padding-top percentage hack plus an absolutely positioned child — this is the same result in one declaration, and it respects the box's actual width."
      />

      <PosterCard
        glyph="Ns"
        title={<>Native Nesting<span className="dim"> — & works without Sass</span></>}
        language="css"
        code={`.card {
  padding: 1.5rem;
  &:hover { box-shadow: var(--shadow-lg); }
  & > .title { font-size: 1.25rem; }

  @media (width < 768px) { padding: 1rem; }  /* nested media query, scoped to .card */
}`}
        caption="Plain CSS supports & nesting now (baseline across evergreen browsers) — for a component's own hover/state variants, you may not need Sass's nesting at all anymore. Sass nesting is still useful for build-time loops/mixins around it."
      />

      <PosterCard
        glyph="Mx"
        title={<>color-mix()<span className="dim"> — blend without a preprocessor</span></>}
        language="css"
        code={`.btn { background: var(--accent); }
.btn:hover  { background: color-mix(in oklch, var(--accent) 85%, black); }
.btn:disabled { background: color-mix(in oklch, var(--accent) 40%, white); }`}
        caption="Hover/disabled shades used to require a Sass darken()/lighten() function baked at build time — color-mix() computes it live, in the browser, off whatever the CURRENT value of --accent is, so it works even when the token changes per-theme at runtime."
      />

      <PosterCard
        glyph="St"
        title={<>@starting-style<span className="dim"> + allow-discrete</span></>}
        language="css"
        code={`.popover {
  opacity: 1; scale: 1;
  transition: opacity 250ms, scale 250ms,
              display 250ms allow-discrete;  /* hold display til the end */
}
@starting-style { .popover { opacity: 0; scale: 0.95; } }
.popover[hidden] { opacity: 0; scale: 0.95; display: none; }`}
        caption="Transitions need a previous value, and display:none has none — so entry animations were impossible in pure CSS until these two landed. @starting-style supplies the 'before it existed' state; allow-discrete defers the display flip so the fade finishes first. Declare @starting-style AFTER the rule it targets or it loses the cascade."
      />

      <PosterCard
        glyph="Tr"
        title={<>translate / rotate / scale<span className="dim"> — independent</span></>}
        language="css"
        code={`/* ❌ the old problem — :hover must restate translate or it's lost */
.badge:hover { transform: translateY(-50%) scale(1.1); }

/* ✅ standalone properties compose instead of clobbering */
.badge       { translate: 0 -50%; }
.badge:hover { scale: 1.1; }   /* translate untouched */
/* applied in a FIXED order: translate → rotate → scale */`}
        caption="Value syntax differs from the transform functions — translate: 10px 20px (space-separated), rotate: 45deg, scale: 1.2. You trade arbitrary ordering for composability; keep the transform shorthand when order actually matters."
      />

      <PosterCard
        glyph="An"
        title={<>Anchor Positioning<span className="dim"> — tether without JS</span></>}
        language="css"
        code={`.trigger { anchor-name: --trigger; }        /* 1. name the anchor */

.tooltip {
  position: absolute;                      /* or fixed — required */
  position-anchor: --trigger;              /* 2. point at the name */
  position-area: block-start center;        /* 3. a 3x3 grid around the anchor */

  /* tried in order; first that fits on screen wins — no JS flipping */
  position-try-fallbacks: flip-block, flip-inline;
}
.dropdown { min-width: anchor-size(width); }  /* match the trigger's width */`}
        caption="Replaces the getBoundingClientRect + reposition-on-scroll loop that Floating UI/Popper exist for — it runs in the layout engine, so it stays correct while scrolling with zero listeners. Least settled feature here: gate it behind @supports (anchor-name: --x), because without support the element falls back to plain absolute positioning and lands in the wrong place rather than merely looking plainer."
      />

      <PosterCard
        glyph="Ld"
        title={<>light-dark()<span className="dim"> — one token, both themes</span></>}
        language="css"
        code={`:root {
  color-scheme: light dark;   /* REQUIRED, or it always resolves light */
  --bg:   light-dark(#fff,    #0f0f1a);
  --text: light-dark(#1a1a2e, #e2e8f0);
}
[data-theme="dark"] { color-scheme: dark; }  /* manual override */`}
        caption="Collapses the duplicated light/dark variable blocks into one declaration. color-scheme earns its keep independently too — it makes the browser render native scrollbars, form controls, and date pickers in the matching theme."
      />

      <PosterQuickRef
        title="Which modern CSS feature do I need?"
        rows={[
          { need: 'Responsive card grid, no breakpoints', answer: 'repeat(auto-fit, minmax(240px, 1fr))' },
          { need: 'Style a parent based on its children', answer: ':has()' },
          { need: 'Zero-specificity reset selector', answer: ':where(...)' },
          { need: "Component reacts to ITS container's width", answer: '@container query' },
          { need: 'Nested grid columns aligned to parent', answer: 'grid-template-columns: subgrid' },
          { need: 'Font size that scales with viewport, bounded', answer: 'clamp(min, preferred, max)' },
          { need: 'Fixed-ratio box without the padding-top hack', answer: 'aspect-ratio: w / h' },
          { need: 'Hover shade computed from a live token', answer: 'color-mix(in oklch, var(--x) 85%, black)' },
          { need: 'Type that scales with the COMPONENT, not the window', answer: 'clamp(1rem, 5cqi, 2rem)' },
          { need: 'Children react to an ancestor’s variant flag', answer: '@container style(--variant: x)' },
          { need: 'Fade something IN from display: none', answer: '@starting-style + transition-behavior: allow-discrete' },
          { need: 'Change scale on hover without losing translate', answer: 'Separate translate / rotate / scale properties' },
          { need: 'Tether a tooltip/menu to its trigger, no JS', answer: 'anchor-name + position-anchor + position-area' },
          { need: 'Flip a popover when it would overflow', answer: 'position-try-fallbacks: flip-block, flip-inline' },
          { need: 'Light + dark value in one declaration', answer: 'light-dark(a, b) — needs color-scheme: light dark' },
          { need: 'Bounce or spring easing curve', answer: 'linear() with multiple stops' },
          { need: 'Animate on scroll without a scroll listener', answer: 'animation-timeline: scroll() / view()' },
          { need: 'Morph between two DOM states', answer: 'view-transition-name + startViewTransition()' },
        ]}
      />
    </PosterLayout>
  );
}
