import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Grid() {
  return (
    <LessonLayout
      title="CSS Grid Complete Guide"
      sectionId="css-mastery"
      lessonIndex={2}
      prev={{ path: '/css-mastery/flexbox', label: 'Flexbox Complete Guide' }}
      next={{ path: '/css-mastery/responsive', label: 'Responsive Design' }}
    >
      <p>CSS Grid is the first layout system designed for two dimensions. Unlike Flexbox (one axis at a time), Grid gives you simultaneous control over rows and columns. This guide covers everything from container basics to subgrid and production patterns.</p>

      <h2>Grid Container Properties</h2>

      <CodeBlock language="css" title="Core Container Setup">
{`.container {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: 80px auto 60px;
  gap: 16px 24px;              /* row-gap | column-gap */

  /* Align ALL items within their cells */
  justify-items: stretch;      /* start | end | center | stretch */
  align-items: stretch;        /* start | end | center | stretch | baseline */
  place-items: center;         /* shorthand: align-items / justify-items */

  /* Align the GRID TRACKS within the container */
  justify-content: start;      /* start | end | center | space-between | space-around | space-evenly */
  align-content: start;
  place-content: center;       /* shorthand: align-content / justify-content */
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="justify vs align — the mental model">
        <strong>justify</strong> = inline axis (horizontal in LTR). <strong>align</strong> = block axis (vertical). The <code>*-items</code> properties position items <em>inside</em> their cells. The <code>*-content</code> properties position the tracks themselves within the container — only visible when the grid doesn&apos;t fill its container.
      </InfoBox>

      <h2>The fr Unit</h2>
      <p>The <code>fr</code> unit distributes <em>remaining</em> space after fixed tracks are allocated — it&apos;s not a percentage.</p>

      <CodeBlock language="css" title="How fr Distributes Space">
{`/* Container is 1200px wide */
.layout {
  grid-template-columns: 300px 1fr 2fr;
  /* 300px fixed → 900px remaining → 1fr = 300px, 2fr = 600px */
}

/* With gap: fr accounts for it */
.with-gap {
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  /* Container 1000px: available = 1000 - 20 = 980px → each col = 490px */
}`}
      </CodeBlock>

      <h2>repeat() and minmax()</h2>

      <CodeBlock language="css" title="repeat() and minmax() Patterns">
{`.grid { grid-template-columns: repeat(3, 1fr); }          /* 1fr 1fr 1fr */
.grid { grid-template-columns: repeat(3, 100px 1fr); }    /* alternating pattern ×3 */
.grid { grid-template-columns: repeat(3, minmax(200px, 1fr)); }  /* floor + ceiling */

/* The responsive holy grail — no media queries */
.responsive {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}`}
      </CodeBlock>

      <h2>auto-fill vs auto-fit</h2>
      <p>Both create as many tracks as fit, but they differ when there are <em>empty</em> tracks — the most commonly confused Grid concept.</p>

      <CodeBlock language="css" title="auto-fill vs auto-fit">
{`/* auto-fill: keeps empty tracks — items DON'T stretch to fill the row */
.fill { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
/* 800px container, 3 items → 5 tracks created, 2 empty but preserved */

/* auto-fit: collapses empty tracks to 0 — items STRETCH to fill the row */
.fit { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
/* 800px container, 3 items → empty tracks collapse, 3 items share all space */`}
      </CodeBlock>

      <InfoBox variant="warning" title="When auto-fill and auto-fit look identical">
        When items fill all available tracks, they produce the exact same result. The difference only shows with fewer items than tracks. Use <strong>auto-fit</strong> for stretching items. Use <strong>auto-fill</strong> for consistent column widths regardless of item count.
      </InfoBox>

      <h2>Grid Item Placement</h2>

      <CodeBlock language="css" title="Placing Items">
{`.item {
  grid-column: 1 / 3;         /* line 1 to line 3 (spans 2 cols) */
  grid-row: 2 / 4;
  grid-column: 1 / span 2;    /* start at 1, span 2 */
  grid-column: span 2;        /* auto-placed, spans 2 */
  grid-column: 1 / -1;        /* full row (first to last line) */

  justify-self: end;           /* override container's justify-items */
  align-self: center;
  place-self: center end;      /* shorthand: align / justify */
}`}
      </CodeBlock>

      <h2>Named Grid Lines</h2>

      <CodeBlock language="css" title="Semantic Line Names">
{`.layout {
  grid-template-columns:
    [sidebar-start] 250px [sidebar-end content-start] 1fr [content-end];
  grid-template-rows:
    [header-start] 80px [header-end main-start] 1fr [main-end footer-start] 60px [footer-end];
}
.sidebar { grid-column: sidebar-start / sidebar-end; }
.content { grid-column: content-start / content-end; }

/* repeat() with named lines — access as col-start 2, col-start 3, etc. */
.grid {
  grid-template-columns: repeat(3, [col-start] 1fr [col-end]);
}`}
      </CodeBlock>

      <h2>Named Grid Areas (ASCII Art Layout)</h2>

      <CodeBlock language="css" title="grid-template-areas">
{`.page {
  display: grid;
  grid-template-columns: 220px 1fr 220px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header  header  header"
    "sidebar content aside"
    "footer  footer  footer";
  min-height: 100vh;
  gap: 16px;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.aside   { grid-area: aside; }
.footer  { grid-area: footer; }

/* Responsive: redefine areas at breakpoints */
@media (max-width: 768px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "content" "sidebar" "aside" "footer";
  }
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"In grid-template-areas, what does a period (.) represent?"}
        options={[
          "A grid line intersection",
          "An empty cell with no named area",
          "A cell that spans the full row",
          "A repeating pattern marker"
        ]}
        correctIndex={1}
        explanation={"A dot (.) designates an empty cell. You can use multiple dots (...) for readability. The cell exists in the grid but has no named area assigned."}
        language="css"
      />

      <h2>Implicit vs Explicit Grid</h2>
      <p>The <strong>explicit grid</strong> is defined by <code>grid-template-*</code>. Items placed beyond those bounds create <strong>implicit tracks</strong> controlled by <code>grid-auto-*</code>.</p>

      <CodeBlock language="css" title="Controlling the Implicit Grid">
{`.grid {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 200px 200px;        /* 2 explicit rows */
  grid-auto-rows: minmax(150px, auto);     /* any extra rows */
  grid-auto-columns: 200px;
  grid-auto-flow: row;           /* row | column | row dense | column dense */
}

/* dense packing: reorders items to fill holes (great for galleries) */
.masonry-like {
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 50px;
  grid-auto-flow: dense;
}`}
      </CodeBlock>

      <InfoBox variant="info" title="dense and accessibility">
        <code>grid-auto-flow: dense</code> reorders items visually without changing DOM order. This breaks tab/screen-reader order. Only use it for non-sequential content like image galleries — never for navigational or textual content.
      </InfoBox>

      <h2>Subgrid</h2>
      <p>
        The problem subgrid solves is worth stating precisely, because the feature looks pointless
        until you have hit it. A nested grid normally has <strong>no relationship whatsoever</strong>{' '}
        to its parent&apos;s tracks — each card sizes its own rows from its own content. So in a row
        of three cards, a two-line title in card 1 pushes card 1&apos;s body down while cards 2 and
        3 keep theirs high, and the footers land at three different heights. Cards <em>stretch</em>{' '}
        to equal outer height; their <em>internal</em> rows do not line up. <code>subgrid</code>{' '}
        makes the child stop inventing its own tracks and use the parent&apos;s instead — so all
        three cards are laid out against one shared set of rows and everything aligns.
      </p>

      <CodeBlock language="css" title="Subgrid for Aligned Cards">
{`.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.card {
  display: grid;

  /* A subgrid can only borrow tracks it actually SPANS, so the card must
     first claim as many parent rows as it has children to place. Three
     children (header, body, footer) -> span 3. Get this number wrong and
     the children silently pile into too few tracks. */
  grid-row: span 3;

  grid-template-rows: subgrid;   /* use the parent's 3 row tracks, don't
                                    create my own from my own content */
}
/* Now every card's header sits in parent row 1, body in row 2, footer in
   row 3 — and each of those rows is sized by the TALLEST content across
   all three cards, which is exactly the alignment you wanted. */`}
      </CodeBlock>

      <InfoBox variant="tip" title="Two things that trip people up with subgrid">
        <p>
          <strong>It works per axis.</strong> <code>grid-template-rows: subgrid</code> adopts row
          tracks only; columns still come from the child&apos;s own definition unless you also say{' '}
          <code>grid-template-columns: subgrid</code>. Most card layouts want rows only.
        </p>
        <p>
          <strong>Gaps come from the parent by default.</strong> The subgrid inherits the
          parent&apos;s <code>gap</code> for the adopted axis, which is usually right — but it means
          setting <code>gap</code> on the card is what you do to override it, not what you do to
          create it.
        </p>
      </InfoBox>

      <h2>Dashboard Layout</h2>

      <CodeBlock language="html" title="Dashboard HTML">
{`<div class="dashboard">
  <header class="dash-header">Dashboard</header>
  <nav class="dash-nav">Navigation</nav>
  <main class="dash-main">
    <div class="widget widget-wide">Revenue Chart</div>
    <div class="widget">Users Online</div>
    <div class="widget">Conversion Rate</div>
    <div class="widget widget-tall">Activity Feed</div>
  </main>
</div>`}
      </CodeBlock>

      <CodeBlock language="css" title="Dashboard CSS">
{`.dashboard {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  grid-template-areas: "nav header" "nav main";
  height: 100vh;
}
.dash-header { grid-area: header; }
.dash-nav    { grid-area: nav; }
.dash-main   {
  grid-area: main;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-auto-rows: minmax(180px, auto);
  grid-auto-flow: dense;
  gap: 20px;
  padding: 24px;
}
.widget-wide { grid-column: span 2; }
.widget-tall { grid-row: span 2; }`}
      </CodeBlock>

      <h2>Magazine / Editorial Layout</h2>

      <CodeBlock language="css" title="Magazine Layout">
{`.editorial {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.story-hero {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
}
.story-hero img  { grid-column: 1 / 3; }
.story-hero .text { grid-column: 3 / 5; }
.story-feature   { grid-column: span 2; }
.story-aside     { grid-column: 4; grid-row: 2 / 4; }`}
      </CodeBlock>

      <h2>Masonry-Like Layout</h2>

      <CodeBlock language="css" title="Masonry Approximation">
{`.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-auto-rows: 60px;         /* small row unit for fine height control */
  grid-auto-flow: dense;
  gap: 16px;
}
/* Spanning N rows also swallows the N-1 gaps BETWEEN those rows, so the
   height is  N x row-size + (N - 1) x gap  — not just N x row-size.
   With 60px rows and a 16px gap: */
.masonry-item.small  { grid-row: span 3; }  /* 3x60 + 2x16 = 212px */
.masonry-item.medium { grid-row: span 4; }  /* 4x60 + 3x16 = 288px */
.masonry-item.large  { grid-row: span 6; }  /* 6x60 + 5x16 = 440px */
.masonry-item.wide   { grid-column: span 2; grid-row: span 4; }
.masonry-item img    { width: 100%; height: 100%; object-fit: cover; }

/* Forgetting the absorbed gaps is why hand-computed span counts always come
   out short. Work backwards from the height you want:
   span = (target + gap) / (row-size + gap)
   e.g. a 300px card -> (300 + 16) / (60 + 16) = 4.2, so span 4 (288px). */`}
      </CodeBlock>

      <h2>Responsive Card Grid (No Media Queries)</h2>

      <CodeBlock language="css" title="auto-fit + minmax Pattern">
{`.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
/*
 * 1400px → 4 cols (~340px each)
 * 900px  → 2 cols (3×300 + 2×24 = 948 > 900)
 * 500px  → 1 col (stretches full width)
 * The minmax floor (300px) implicitly controls breakpoints.
 */
.card {
  display: grid;
  grid-template-rows: auto 1fr auto;   /* header, body, footer */
}`}
      </CodeBlock>

      <CodeBlock language="html" title="Card Grid HTML">
{`<div class="card-grid">
  <article class="card">
    <img src="thumb.jpg" alt="Thumbnail" />
    <div class="card-body">
      <h3>Card Title</h3>
      <p>Description text...</p>
    </div>
    <footer class="card-footer">
      <span>Jan 2024</span>
      <a href="#">Read more</a>
    </footer>
  </article>
</div>`}
      </CodeBlock>

      <h2>Grid vs Flexbox Decision Guide</h2>

      <FlowChart
        title="When to Use Grid vs Flexbox"
        chart={"graph TD\n  A[Layout Need] --> B{Two-dimensional?\nRows AND columns?}\n  B -->|Yes| C[Use CSS Grid]\n  B -->|No| D{Content size\ndrives layout?}\n  D -->|Yes| E[Use Flexbox]\n  D -->|No| F{Known column count?}\n  F -->|Yes| C\n  F -->|No| G{Items wrap naturally?}\n  G -->|Into rows| H[Flexbox + wrap]\n  G -->|Grid pattern| C\n  C --> I[grid-template-areas for pages\nauto-fit + minmax for cards]\n  E --> J[Navbars, toolbars,\ncentering, spacing]\n  H --> K[Tag lists, chips,\nicon rows]\n  style C fill:#1a3329,stroke:#4ade80\n  style E fill:#1a2744,stroke:#5b9cf6\n  style H fill:#1a2744,stroke:#5b9cf6\n  style I fill:#1a3329,stroke:#4ade80\n  style J fill:#1a2744,stroke:#5b9cf6\n  style K fill:#1a2744,stroke:#5b9cf6"}
      />

      <CodeBlock language="css" title="Grid + Flexbox Together">
{`/* Grid for page structure */
.page {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-areas: "header header" "sidebar main" "footer footer";
}
/* Flexbox for header alignment */
.header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* Grid for card layout in main */
.main {
  grid-area: main;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
/* Flexbox for card internals */
.card { display: flex; flex-direction: column; }
.card-body { flex: 1; }
.card-footer { margin-top: auto; }`}
      </CodeBlock>

      <InfoBox variant="tip" title="The practical rule">
        Use <strong>Grid</strong> when defining layout from the container&apos;s perspective (slots items fill). Use <strong>Flexbox</strong> when items dictate layout based on content size. Most UIs combine both: Grid for macro layout, Flexbox for micro alignment.
      </InfoBox>

      <h2>Common Gotchas</h2>

      <CodeBlock language="css" title="Grid Pitfalls and Fixes">
{`/* GOTCHA: min-width: auto causes overflow on grid items */
.grid-item {
  min-width: 0;        /* allow shrinking below content size */
  overflow: hidden;
}

/* GOTCHA: z-index works on grid items WITHOUT position: relative.
   Precise rule: a grid or flex item with a z-index OTHER than auto
   creates a stacking context. A plain item with z-index: auto does not —
   so this is about z-index being honoured on a static element, not about
   every grid item being its own stacking context. */
.grid-item { z-index: 1; }

/* GOTCHA: minmax(0, 1fr) is how you get TRULY equal columns.
   Plain 1fr means minmax(auto, 1fr) — the auto floor is the item's
   min-content size, so a long unbreakable word blows the track out. */
.equal { grid-template-columns: repeat(3, minmax(0, 1fr)); }  /* ✅ */
.uneven { grid-template-columns: repeat(3, 1fr); }             /* can drift wider */

/* GOTCHA: auto-fit/auto-fill with a 0 minimum destroys the responsive
   breakpoint. It does NOT collapse to one column — the opposite happens.
   The minimum is what tells the browser when a track no longer fits, so a
   0 floor means every track always "fits": the row NEVER wraps at any
   width, and the items just squeeze thinner and thinner. */
.broken { grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); }   /* ❌ never wraps */
.works  { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); } /* ✅ wraps at 280px */`}
      </CodeBlock>

      <InfoBox variant="warning" title="Measured in Chromium — the 0-minimum grid stays on one row forever">
        <p>
          Six items, <code>gap: 16px</code>, full-width container. With{' '}
          <code>minmax(0, 1fr)</code>: <strong>1280px &rarr; 6 columns of 200px</strong>,{' '}
          <strong>768px &rarr; 6 columns of 114.7px</strong>,{' '}
          <strong>390px &rarr; 6 columns of 51.7px</strong> &mdash; always one row, on a phone the
          cards are 52px wide. With <code>minmax(280px, 1fr)</code> the same six items go{' '}
          <strong>4 + 2</strong> at 1280px, <strong>2 per row</strong> at 768px, and{' '}
          <strong>1 per row</strong> at 390px.
        </p>
        <p>
          The mechanism is worth knowing because it is counter-intuitive: <code>auto-fit</code>{' '}
          generates as many tracks as could theoretically fit (with a 0 floor, dozens of them) and
          then <em>collapses the empty ones to 0px</em>. Your six filled tracks are therefore always
          the only ones with width, and they always split the container between them. If you are
          debugging &quot;my auto-fit grid refuses to stack on mobile,&quot; a{' '}
          <code>0</code> or very small minimum is the first thing to check. Note{' '}
          <code>auto-fill</code> is worse, not better: it keeps the empty tracks, so the six items
          get a sliver each and overflow their own tracks.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"A 3-column grid has items with long text overflowing horizontally. What is the most common fix?"}
        options={[
          "Set overflow: visible on the container",
          "Set min-width: 0 on the grid items",
          "Change to display: flex instead",
          "Add word-break: break-all to the container"
        ]}
        correctIndex={1}
        explanation={"Grid items default to min-width: auto, so they won't shrink below their content's intrinsic width. Setting min-width: 0 allows items to shrink within their track, letting text-wrapping and overflow rules work correctly."}
        language="css"
      />

      <InteractiveChallenge
        question={"What does grid-column: 1 / -1 do?"}
        options={[
          "Places the item in the first column only",
          "Removes the item from the grid flow",
          "Spans the item across ALL columns from first to last line",
          "Creates a negative-width column"
        ]}
        correctIndex={2}
        explanation={"Negative line numbers count from the end of the explicit grid. Line -1 is always the last line, so 1 / -1 spans every column regardless of how many exist."}
        language="css"
      />

      <h2>Quick Reference</h2>

      <CodeBlock language="css" title="Grid Cheat Sheet">
{`/* CONTAINER */
display: grid;
grid-template-columns: 200px 1fr repeat(3, 1fr);
grid-template-rows: auto 1fr auto;
grid-template-areas: "hd hd" "sd mn" "ft ft";
gap: 16px;
justify-items | align-items: start | end | center | stretch;
justify-content | align-content: start | end | center | space-between;
grid-auto-rows: minmax(100px, auto);
grid-auto-flow: row | column | dense;

/* ITEMS */
grid-column: 1 / 3;          grid-row: 1 / span 2;
grid-area: header;            /* or: row-start / col-start / row-end / col-end */
justify-self | align-self: start | end | center | stretch;
grid-column: 1 / -1;         /* full width */`}
      </CodeBlock>

    </LessonLayout>
  );
}
