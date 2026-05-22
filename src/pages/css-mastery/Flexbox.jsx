import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function CSSFlexbox() {
  return (
    <LessonLayout
      title="CSS Flexbox"
      sectionId="css-mastery"
      lessonIndex={0}
      prev={null}
      next={{ path: '/css-mastery/grid', label: 'CSS Grid' }}
    >
      <h2>Flexbox Mental Model</h2>
      <p>
        Flexbox is a one-dimensional layout system — it lays items out along a single axis
        (row or column). The key insight: there is a <strong>flex container</strong> (parent) and
        <strong> flex items</strong> (direct children). Properties on the container control how
        items are distributed; properties on items control how they individually behave.
      </p>

      <FlowChart
        title="Flexbox Axis System"
        chart={"graph LR\n  A[flex-direction: row] --> B[Main Axis: horizontal]\n  A --> C[Cross Axis: vertical]\n  D[flex-direction: column] --> E[Main Axis: vertical]\n  D --> F[Cross Axis: horizontal]\n  B --> G[justify-content controls]\n  C --> H[align-items controls]"}
      />

      <CodeBlock language="css" title="Flex Container — The Basics">
{`.container {
  display: flex;              /* or inline-flex */
  flex-direction: row;        /* row | row-reverse | column | column-reverse */
  flex-wrap: nowrap;          /* nowrap | wrap | wrap-reverse */
  gap: 1rem;                  /* space between items (modern approach, replaces margin hacks) */
}

/* flex-flow is shorthand for flex-direction + flex-wrap */
.container { flex-flow: row wrap; }

/* justify-content — distribution along the MAIN axis */
.container {
  justify-content: flex-start;    /* default — items at start */
  justify-content: flex-end;      /* items at end */
  justify-content: center;        /* centered */
  justify-content: space-between; /* equal space BETWEEN items (no edge space) */
  justify-content: space-around;  /* equal space AROUND each item (half-space at edges) */
  justify-content: space-evenly;  /* equal space everywhere including edges */
}

/* align-items — alignment along the CROSS axis */
.container {
  align-items: stretch;     /* default — items stretch to fill container height */
  align-items: flex-start;  /* items at start of cross axis */
  align-items: flex-end;    /* items at end of cross axis */
  align-items: center;      /* centered on cross axis */
  align-items: baseline;    /* aligned by text baseline */
}

/* align-content — controls ROWS when wrapping (like justify-content for rows) */
.container {
  align-content: flex-start;    /* rows packed at start */
  align-content: space-between; /* equal space between rows */
  align-content: center;        /* rows centered vertically */
}`}
      </CodeBlock>

      <CodeBlock language="css" title="Flex Items — Individual Control">
{`/* flex-grow — how much an item grows to fill available space */
.item { flex-grow: 0; } /* default — don't grow */
.item { flex-grow: 1; } /* grow proportionally with others that have grow:1 */
/* If item A has flex-grow:2 and item B has flex-grow:1,
   A gets twice the extra space as B */

/* flex-shrink — how much an item shrinks when space is tight */
.item { flex-shrink: 1; } /* default — shrink proportionally */
.item { flex-shrink: 0; } /* don't shrink — stays at its base size */

/* flex-basis — the starting size before grow/shrink applies */
.item { flex-basis: auto; }    /* default — use width/height */
.item { flex-basis: 200px; }   /* start at 200px, then grow/shrink */
.item { flex-basis: 0; }       /* ignore content size — grow from zero */

/* flex shorthand: flex: grow shrink basis */
.item { flex: 1; }             /* flex: 1 1 0 — equal-width flexible items */
.item { flex: auto; }          /* flex: 1 1 auto — flexible, content-aware */
.item { flex: none; }          /* flex: 0 0 auto — rigid, no grow/shrink */
.item { flex: 0 1 200px; }     /* start at 200px, can shrink but not grow */

/* order — visual reordering without changing DOM order */
.item { order: 0; }   /* default */
.item { order: -1; }  /* move to front */
.item { order: 10; }  /* move to back */
/* Warning: breaks keyboard tab order — accessibility concern! */

/* align-self — override container's align-items for one item */
.special-item {
  align-self: flex-start;  /* while others are centered */
}`}
      </CodeBlock>

      <h2>Real-World Flexbox Patterns</h2>

      <CodeBlock language="css" title="Navbar Pattern">
{`/* Classic navbar: logo left, links right */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 56px;
}

/* OR: logo left, links centered, actions right */
.navbar {
  display: flex;
  align-items: center;
}
.navbar-logo { /* takes natural width */ }
.navbar-links {
  flex: 1;              /* takes all remaining space */
  display: flex;
  justify-content: center; /* centers links within that space */
  gap: 2rem;
}
.navbar-actions { /* takes natural width */ }

/* Responsive: collapse to hamburger at small screens */
@media (max-width: 768px) {
  .navbar-links {
    display: none; /* or position:fixed for mobile drawer */
  }
}`}
      </CodeBlock>

      <CodeBlock language="css" title="Common Flexbox Patterns">
{`/* ===== PERFECT CENTERING ===== */
.center-everything {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; /* or any height */
}

/* ===== SIDEBAR LAYOUT ===== */
.layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 280px;
  flex-shrink: 0;  /* don't let sidebar shrink */
}
.main-content {
  flex: 1;          /* take all remaining width */
  overflow-y: auto;
}

/* ===== CARD GRID (equal height cards) ===== */
.card-row {
  display: flex;
  gap: 1rem;
  align-items: stretch; /* all cards same height */
}
.card {
  flex: 1;         /* equal width */
  display: flex;
  flex-direction: column;
}
.card-body {
  flex: 1;         /* push footer to bottom */
}
.card-footer { /* sticks to bottom */ }

/* ===== STICKY FOOTER ===== */
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
main {
  flex: 1; /* push footer down */
}
footer { /* natural height */ }`}
      </CodeBlock>

      <CodeBlock language="css" title="Flexbox for Forms and Inputs">
{`/* ===== INLINE FORM ===== */
.search-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.search-input {
  flex: 1;        /* expand to fill space */
  min-width: 0;   /* allow shrinking below default min-width! */
}
.search-btn {
  flex-shrink: 0; /* keep button at natural size */
  white-space: nowrap;
}

/* ===== LABEL + INPUT ROW ===== */
.field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.field label {
  flex-basis: 120px;
  flex-shrink: 0;
  text-align: right;
}
.field input {
  flex: 1;
  min-width: 0;  /* ALWAYS add this to flex children that can shrink */
}

/* ===== INPUT GROUP (prepend/append) ===== */
.input-group {
  display: flex;
}
.input-group-prefix {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-right: none;
  border-radius: 4px 0 0 4px;
}
.input-group input {
  flex: 1;
  border-radius: 0 4px 4px 0;
}`}
      </CodeBlock>

      <h2>Common Flexbox Bugs and Fixes</h2>

      <CodeBlock language="css" title="Flexbox Gotchas">
{`/* BUG 1: Text truncation not working */
/* Problem: flex items have a default min-width:auto (content size) */
/* Text expands the item instead of truncating */
.item { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Fix: add min-width: 0 to the flex item */
.item { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* BUG 2: Image stretching vertically in flex container */
/* Problem: align-items: stretch stretches images to container height */
/* Fix: set align-items: flex-start or set align-self on the image */
.container { align-items: flex-start; }
/* OR */
img { align-self: flex-start; }

/* BUG 3: Flex items not wrapping */
/* Default is flex-wrap: nowrap — items compress instead of wrapping */
.container { flex-wrap: wrap; }

/* BUG 4: flex: 1 items not equal width */
/* Problem: flex: 1 is flex: 1 1 auto — starts from content size */
/* Fix: use flex: 1 1 0 or just flex: 1 with flex-basis: 0 */
.equal-item { flex: 1; flex-basis: 0; }
/* OR shorthand */
.equal-item { flex: 1 1 0%; }

/* BUG 5: Gap not working (older browsers) */
/* Flexbox gap has excellent support now (>95% global) */
/* Fallback for old browsers: */
.item + .item { margin-left: 1rem; }  /* replaced by gap: 1rem in modern code */

/* BUG 6: Nested flex containers and height */
/* Parent needs explicit height for children to flex properly */
.outer { display: flex; height: 100vh; }
.sidebar { display: flex; flex-direction: column; }
/* Without height on outer, inner flex won't stretch to fill */`}
      </CodeBlock>

      <InfoBox variant="tip" title="Flexbox vs Grid: When to Use Which">
        <p>
          <strong>Use Flexbox when:</strong> you have a single row or column of items, you need
          content-driven sizing, you're building navbars, button groups, or form rows.<br /><br />
          <strong>Use Grid when:</strong> you have a two-dimensional layout (rows AND columns),
          you want to define a layout template and place items into it, or you're building page
          layouts, dashboards, or image galleries.<br /><br />
          They work great together: Grid for page layout, Flexbox for component internals.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A flex item has flex: 1 but is not shrinking below its text content width. What property fixes this?"
        options={[
          "overflow: hidden",
          "min-width: 0",
          "flex-shrink: 1",
          "width: 100%"
        ]}
        correctIndex={1}
        explanation="Flex items have min-width: auto by default, which prevents them from shrinking below their content size. Adding min-width: 0 overrides this, allowing the flex item to shrink as needed. This is the most common flexbox bug — you'll hit it constantly with text truncation, responsive layouts, and any flex item containing content that resists shrinking."
      />

      <InteractiveChallenge
        question="What is the difference between justify-content and align-items in a row-direction flex container?"
        options={[
          "They are identical — both align items on all axes",
          "justify-content controls horizontal distribution; align-items controls vertical alignment",
          "justify-content aligns the container; align-items aligns each item",
          "justify-content is for grid; align-items is for flexbox"
        ]}
        correctIndex={1}
        explanation="In a row-direction flex container, justify-content distributes items along the horizontal (main) axis — space-between, center, flex-end, etc. align-items aligns items along the vertical (cross) axis — center, flex-start, stretch, baseline. When you flip to column direction, the axes swap: justify-content becomes vertical and align-items becomes horizontal."
      />
    </LessonLayout>
  );
}
