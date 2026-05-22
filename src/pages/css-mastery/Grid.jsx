import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function CSSGrid() {
  return (
    <LessonLayout
      title="CSS Grid"
      sectionId="css-mastery"
      lessonIndex={1}
      prev={{ path: '/css-mastery/flexbox', label: 'Flexbox' }}
      next={{ path: '/css-mastery/responsive', label: 'Responsive Design' }}
    >
      <h2>CSS Grid Mental Model</h2>
      <p>
        CSS Grid is a two-dimensional layout system. Unlike Flexbox (one axis at a time), Grid
        controls both rows and columns simultaneously. Think of it as a spreadsheet: you define
        the grid tracks (rows and columns), then place items into cells.
      </p>

      <FlowChart
        title="Grid vs Flexbox"
        chart={"graph LR\n  A[Layout task] --> B{One dimension?}\n  B -- Yes --> C[Flexbox - row or column]\n  B -- No --> D{Two dimensions?}\n  D -- Yes --> E[CSS Grid - rows AND columns]\n  C --> F[Navbars, card rows, button groups]\n  E --> G[Page layouts, dashboards, galleries]"}
      />

      <CodeBlock language="css" title="Grid Container Fundamentals">
{`.grid {
  display: grid;

  /* Define columns: 3 equal columns */
  grid-template-columns: 1fr 1fr 1fr;
  /* Or shorthand: */
  grid-template-columns: repeat(3, 1fr);

  /* Define rows */
  grid-template-rows: 80px auto 60px;

  /* Gap between cells */
  gap: 1rem;              /* row-gap + column-gap */
  row-gap: 1rem;
  column-gap: 1.5rem;
}

/* fr unit — fractional unit of remaining space */
/* 1fr 2fr 1fr = first/third get 1 part, middle gets 2 parts */
grid-template-columns: 1fr 2fr 1fr;

/* repeat() — shorthand for repeated patterns */
grid-template-columns: repeat(4, 1fr);        /* 4 equal columns */
grid-template-columns: repeat(3, 200px 1fr);  /* 6 col alternating */

/* minmax() — flexible with a minimum size */
grid-template-columns: repeat(3, minmax(200px, 1fr));

/* auto — sized to content */
grid-template-columns: auto 1fr auto; /* sidebar auto, main 1fr, sidebar auto */

/* Named lines */
grid-template-columns: [sidebar-start] 280px [sidebar-end main-start] 1fr [main-end];
/* Reference by name: grid-column: sidebar-start / sidebar-end */`}
      </CodeBlock>

      <h2>Placing Items on the Grid</h2>

      <CodeBlock language="css" title="Grid Item Placement">
{`/* Items auto-place sequentially by default */
/* Override with grid-column and grid-row */

.hero {
  /* grid-column: start-line / end-line (or span N) */
  grid-column: 1 / 3;       /* from line 1 to line 3 (spans 2 columns) */
  grid-column: 1 / span 2;  /* same: start at 1, span 2 */
  grid-column: span 2;      /* span 2 columns from auto-placement */
  grid-column: 1 / -1;      /* from first to last line (full width!) */

  grid-row: 1 / 3;          /* spans 2 rows */
}

/* Grid area — shorthand for row-start / col-start / row-end / col-end */
.item {
  grid-area: 1 / 1 / 3 / 3; /* row-start / col-start / row-end / col-end */
}

/* Auto-placement algorithm */
.grid {
  grid-auto-flow: row;    /* default: fill rows left to right */
  grid-auto-flow: column; /* fill columns top to bottom */
  grid-auto-flow: dense;  /* fill gaps with smaller items */
}

/* Align items within their cells */
.grid {
  justify-items: stretch; /* horizontal: start | end | center | stretch */
  align-items: stretch;   /* vertical:   start | end | center | stretch */
}

/* Override for a single item */
.item {
  justify-self: center;  /* center this item horizontally in its cell */
  align-self: end;       /* push this item to the bottom of its cell */
}`}
      </CodeBlock>

      <h2>Grid Template Areas — Named Layouts</h2>

      <CodeBlock language="css" title="Grid Template Areas">
{`/* Define regions with names — layout becomes self-documenting */
.page-layout {
  display: grid;
  grid-template-areas:
    "header  header  header"
    "sidebar main    main  "
    "footer  footer  footer";
  grid-template-columns: 280px 1fr 1fr;
  grid-template-rows: 56px 1fr 60px;
  min-height: 100vh;
}

/* Assign items to named areas */
header { grid-area: header; }
aside  { grid-area: sidebar; }
main   { grid-area: main; }
footer { grid-area: footer; }

/* Mobile: single column */
@media (max-width: 768px) {
  .page-layout {
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "footer";
    grid-template-columns: 1fr;
    grid-template-rows: 56px 1fr auto 60px;
  }
}

/* A . represents an empty cell */
.dashboard {
  grid-template-areas:
    "nav     nav    nav   "
    "sidebar stats  stats "
    "sidebar chart  widget"
    ".       footer footer";
}`}
      </CodeBlock>

      <h2>Responsive Grid Without Media Queries</h2>

      <CodeBlock language="css" title="auto-fill and auto-fit">
{`/* auto-fill: create as many columns as fit */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}
/* Result: 1 column on mobile, 2-3 on tablet, 4-5 on desktop
   WITHOUT any media queries! */

/* auto-fill vs auto-fit:
   auto-fill: keeps empty tracks at end of row (columns don't stretch)
   auto-fit: collapses empty tracks — remaining items stretch to fill */

/* Example: 3 items in a 5-column grid */
/* auto-fill: [item][item][item][empty][empty] — items stay small */
/* auto-fit: [item         ][item         ][item         ] — items grow */

/* Practical difference: */
/* auto-fill → for image galleries where you want consistent sizes */
/* auto-fit  → for feature cards where you want them to fill the space */

.gallery {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
.features {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}`}
      </CodeBlock>

      <h2>Real-World Grid Patterns</h2>

      <CodeBlock language="css" title="Dashboard Layout">
{`/* === ANALYTICS DASHBOARD === */
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, 1fr); /* 12-column grid like Bootstrap */
  gap: 1.5rem;
  padding: 1.5rem;
}

.metric-card { grid-column: span 3; }   /* 4 cards per row */
.chart-main  { grid-column: span 8; }   /* wide chart */
.chart-side  { grid-column: span 4; }   /* narrow sidebar chart */
.data-table  { grid-column: 1 / -1; }   /* full width */

@media (max-width: 1024px) {
  .metric-card { grid-column: span 6; } /* 2 cards per row */
  .chart-main  { grid-column: 1 / -1; } /* full width */
  .chart-side  { grid-column: 1 / -1; }
}

@media (max-width: 640px) {
  .metric-card { grid-column: 1 / -1; } /* 1 card per row */
}

/* === IMAGE MASONRY/MOSAIC === */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 200px;
  gap: 0.5rem;
}
.photo-featured {
  grid-column: span 2;
  grid-row: span 2;    /* tall + wide featured photo */
}

/* === MAGAZINE LAYOUT === */
.magazine {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto auto;
  gap: 1rem;
}
.feature-story {
  grid-column: 1;
  grid-row: 1 / 3;    /* spans both rows on left */
}`}
      </CodeBlock>

      <h2>Subgrid — Aligning Nested Content</h2>

      <CodeBlock language="css" title="Subgrid (Modern CSS)">
{`/* Problem: nested items in different cards won't line up */
/* Because each card creates its own grid context */

/* Without subgrid — cards misalign: */
.card {
  display: grid;
  grid-template-rows: auto 1fr auto; /* heading, body, footer */
}
/* Each card has independent row heights — footers misalign */

/* WITH subgrid — nested elements share parent's grid tracks */
.card-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr auto; /* heading, body, footer */
  gap: 1rem;
}

.card {
  display: grid;
  grid-row: span 3;       /* take up 3 rows */
  grid-template-rows: subgrid; /* USE THE PARENT'S ROW TRACKS */
}

/* Now all card headings, bodies, and footers line up! */
/* Browser support: Chrome 117+, Firefox 71+, Safari 16+ */

/* Fallback for older browsers */
@supports not (grid-template-rows: subgrid) {
  .card { display: flex; flex-direction: column; }
  .card-body { flex: 1; }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Grid Shorthand">
        <p>
          The <code>grid</code> shorthand combines <code>grid-template</code> and
          <code>grid-auto</code> properties: <code>grid: "header" 56px "main" 1fr "footer" 60px / 1fr</code>.
          However, it's complex and easy to get wrong. Prefer the explicit
          <code>grid-template-areas</code> + <code>grid-template-columns/rows</code> for readability.
          Use shorthand only when you're very confident in the grid system.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What does grid-column: 1 / -1 do?"
        options={[
          "Hides the grid item",
          "Makes the item span from the first column line to the last column line (full width)",
          "Places the item in column -1 (invalid)",
          "Creates a negative column offset"
        ]}
        correctIndex={1}
        explanation="Negative grid line numbers count from the end. Line -1 is always the last line of the explicit grid. So grid-column: 1 / -1 means 'start at the first column line and end at the last column line' — spanning the full width of the grid, regardless of how many columns exist. This is much cleaner than grid-column: 1 / 5 when you might change the column count."
      />

      <InteractiveChallenge
        question="What is the difference between auto-fill and auto-fit in repeat()?">
        options={[
          "auto-fill creates more columns; auto-fit creates fewer",
          "auto-fill keeps empty tracks at end of row; auto-fit collapses them so items stretch",
          "auto-fit requires explicit column widths; auto-fill uses minmax",
          "They are identical — both are aliases"
        ]}
        correctIndex={1}
        explanation="With auto-fill, the browser creates as many columns as fit and keeps empty column tracks at the end — items maintain their defined size. With auto-fit, empty tracks are collapsed to zero width, so remaining items stretch to fill the full row width. For image galleries where consistent sizing matters: auto-fill. For feature cards that should fill available space: auto-fit."
      />
    </LessonLayout>
  );
}
