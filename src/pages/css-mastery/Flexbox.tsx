import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Flexbox() {
  return (
    <LessonLayout
      title="Flexbox Complete Guide"
      sectionId="css-mastery"
      lessonIndex={0}
      prev={null}
      next={{ path: '/css-mastery/grid', label: 'CSS Grid Complete Guide' }}
    >
      <h2>Flex Container vs Flex Items</h2>
      <p>
        Flexbox operates on a parent-child relationship. The element with <code>display: flex</code> becomes
        the <strong>flex container</strong>. Its direct children automatically become <strong>flex items</strong>.
        Only direct children participate in the flex formatting context &mdash; grandchildren are unaffected
        unless they themselves become flex containers. This single-level scope is a key distinction from
        older layout methods and means you frequently nest flex containers to build complex layouts.
      </p>

      <CodeBlock language="html" title="Container and Items">{`.flex-container {
  display: flex; /* establishes flex formatting context */
}
/* .item-a, .item-b, .item-c are flex items */
<div class="flex-container">
  <div class="item-a">A</div>
  <div class="item-b">B</div>
  <div class="item-c">C</div>
</div>`}</CodeBlock>

      <h2>Main Axis vs Cross Axis</h2>
      <p>
        Every flex container has two axes. The <strong>main axis</strong> is defined by <code>flex-direction</code> and
        determines the direction items flow. The <strong>cross axis</strong> runs perpendicular to it.
        Understanding which axis you&apos;re targeting is critical &mdash; <code>justify-content</code> always
        controls the main axis, while <code>align-items</code> and <code>align-content</code> control the cross axis.
      </p>

      <FlowChart
        title="Axis Directions by flex-direction"
        chart={"graph LR\n  A[flex-direction: row] --> B[Main Axis = Horizontal]\n  A --> C[Cross Axis = Vertical]\n  D[flex-direction: column] --> E[Main Axis = Vertical]\n  D --> F[Cross Axis = Horizontal]"}
      />

      <InfoBox variant="tip" title="Axis Mental Model">
        When you switch <code>flex-direction</code> from <code>row</code> to <code>column</code>, the
        axes swap. That means <code>justify-content: center</code> centers horizontally in row mode
        but vertically in column mode. This catches many developers off guard.
      </InfoBox>

      <h2>display: flex vs display: inline-flex</h2>
      <p>
        <code>display: flex</code> makes the container a block-level flex container &mdash; it takes the full
        width of its parent and starts on a new line. <code>display: inline-flex</code> makes it an inline-level
        flex container &mdash; it only takes the width needed by its content and sits inline with surrounding
        elements. Inside both, flex item behavior is identical; the difference is purely how the container
        participates in the outer layout.
      </p>

      <CodeBlock language="css" title="inline-flex Example">{`/* Useful for inline badges, tag groups, icon rows */
.tag-group {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
/* Container sits inline with surrounding text */`}</CodeBlock>

      <h2>flex-direction</h2>
      <p>
        Controls the main axis direction and, consequently, the order in which items are placed.
      </p>
      <CodeBlock language="css" title="All flex-direction Values">{`.row        { flex-direction: row; }            /* left to right (default) */
.row-rev    { flex-direction: row-reverse; }    /* right to left */
.col        { flex-direction: column; }         /* top to bottom */
.col-rev    { flex-direction: column-reverse; } /* bottom to top */`}</CodeBlock>

      <InfoBox variant="warning" title="Accessibility with Reverse Directions">
        Visual reordering via <code>row-reverse</code>, <code>column-reverse</code>, or the <code>order</code> property
        does not change DOM order. Screen readers and keyboard navigation still follow the source order.
        Use these only for decorative reordering, never for meaningful content sequencing.
      </InfoBox>

      <h2>flex-wrap</h2>
      <p>
        By default, flex items try to fit on one line (<code>nowrap</code>). When items exceed the
        container&apos;s main axis size, <code>flex-wrap: wrap</code> lets them flow onto new lines.
        With <code>wrap-reverse</code>, new lines stack in the opposite direction along the cross axis.
      </p>
      <CodeBlock language="css" title="flex-wrap Behavior">{`.no-wrap     { flex-wrap: nowrap; }       /* default: items shrink to fit */
.wrap        { flex-wrap: wrap; }         /* overflow onto new lines */
.wrap-rev    { flex-wrap: wrap-reverse; } /* new lines stack in reverse */
.shorthand   { flex-flow: row wrap; }    /* direction + wrap combined */`}</CodeBlock>

      <h2>justify-content (Main Axis Alignment)</h2>
      <p>
        Distributes free space along the main axis. This is the property you reach for
        when items don&apos;t fill the container and you need to control their positioning.
      </p>
      <CodeBlock language="css" title="justify-content Values">{`.jc-start    { justify-content: flex-start; }    /* pack to start (default) */
.jc-end      { justify-content: flex-end; }      /* pack to end */
.jc-center   { justify-content: center; }        /* center on main axis */
.jc-between  { justify-content: space-between; } /* first/last flush, equal gaps */
.jc-around   { justify-content: space-around; }  /* equal space around items */
.jc-evenly   { justify-content: space-evenly; }  /* truly uniform gaps */
/*
 * space-between: |A     B     C|  — no outer gaps
 * space-around:  | A   B   C |  — half gap at edges
 * space-evenly:  |  A  B  C  |  — uniform gaps everywhere
 */`}</CodeBlock>

      <h2>align-items (Cross Axis Alignment)</h2>
      <p>
        Controls how items align along the cross axis within each flex line.
        <code>stretch</code> is the default, which is why flex items expand to fill the
        container height in a row layout &mdash; a behavior many developers find surprising.
      </p>
      <CodeBlock language="css" title="align-items Values">{`.ai-stretch   { align-items: stretch; }    /* fill cross axis (default) */
.ai-start     { align-items: flex-start; } /* align to cross-axis start */
.ai-end       { align-items: flex-end; }   /* align to cross-axis end */
.ai-center    { align-items: center; }     /* center along cross axis */
/* baseline: align by text baselines — great for mixed font sizes */
.ai-baseline  { align-items: baseline; }`}</CodeBlock>

      <h2>align-content (Multi-Line Cross Axis)</h2>
      <p>
        Only applies when <code>flex-wrap: wrap</code> produces multiple lines.
        It controls how those lines distribute across the cross axis &mdash; the
        cross-axis equivalent of <code>justify-content</code>. Has no effect on
        single-line containers.
      </p>
      <CodeBlock language="css" title="align-content Values">{`.ac-stretch  { align-content: stretch; }       /* lines stretch (default) */
.ac-start    { align-content: flex-start; }    /* pack to cross-axis start */
.ac-end      { align-content: flex-end; }      /* pack to cross-axis end */
.ac-center   { align-content: center; }        /* center lines */
.ac-between  { align-content: space-between; } /* equal space between lines */
.ac-around   { align-content: space-around; }  /* equal space around lines */`}</CodeBlock>

      <h2>The gap Property</h2>
      <p>
        <code>gap</code> defines spacing between flex items without adding margins. It only
        creates space between items, never at the outer edges &mdash; eliminating the classic
        &quot;last-child negative margin&quot; hack. Accepts one value (both axes) or two
        values (row-gap, column-gap).
      </p>
      <CodeBlock language="css" title="gap Usage">{`/* Uniform 16px gap between all items */
.cards { display: flex; flex-wrap: wrap; gap: 16px; }

/* Different row and column gaps */
.grid-like { display: flex; flex-wrap: wrap; gap: 24px 16px; }

/* Individual axis control */
.fine-tuned {
  row-gap: 1rem;
  column-gap: 0.5rem;
}`}</CodeBlock>

      <h2>flex-grow</h2>
      <p>
        Defines how much of the remaining free space an item absorbs. A value of <code>0</code> (default)
        means the item won&apos;t grow. The growth is proportional: if item A has <code>flex-grow: 2</code> and
        item B has <code>flex-grow: 1</code>, A gets twice as much of the leftover space as B &mdash; not
        twice the total width.
      </p>
      <CodeBlock language="css" title="flex-grow Distribution">{`/* 300px container, three 50px items → 150px free space */
.item-a { flex-grow: 2; } /* gets 2/4 = 75px extra → 125px */
.item-b { flex-grow: 1; } /* gets 1/4 = 37.5px extra → 87.5px */
.item-c { flex-grow: 1; } /* gets 1/4 = 37.5px extra → 87.5px */`}</CodeBlock>

      <h2>flex-shrink</h2>
      <p>
        Controls how items shrink when they overflow the container. Default is <code>1</code>, meaning
        all items shrink equally. Set to <code>0</code> to prevent an item from shrinking &mdash; common
        for fixed-width sidebars or icons that must maintain their size.
      </p>
      <CodeBlock language="css" title="flex-shrink Example">{`.sidebar { flex-shrink: 0; width: 250px; } /* stays fixed at 250px */
.main    { flex-shrink: 1; }               /* absorbs overflow */
.shrink-fast { flex-shrink: 3; } /* shrinks 3x faster than default */
.shrink-slow { flex-shrink: 1; }`}</CodeBlock>

      <h2>flex-basis</h2>
      <p>
        Sets the initial main-axis size of an item before <code>flex-grow</code> and <code>flex-shrink</code> kick
        in. Defaults to <code>auto</code>, which uses the item&apos;s <code>width</code> or <code>height</code> (depending
        on the main axis). Setting <code>flex-basis: 0</code> ignores intrinsic size and distributes all
        space purely via <code>flex-grow</code> ratios.
      </p>
      <CodeBlock language="css" title="flex-basis vs width">{`/* flex-basis takes precedence over width in flex context */
.item { width: 200px; flex-basis: 300px; } /* 300px wins */

.equal-share { flex-grow: 1; flex-basis: 0; }    /* start from nothing */
.natural     { flex-grow: 1; flex-basis: auto; } /* use content size */`}</CodeBlock>

      <h2>flex Shorthand</h2>
      <p>
        The <code>flex</code> shorthand sets <code>flex-grow</code>, <code>flex-shrink</code>,
        and <code>flex-basis</code> in one declaration. The spec strongly recommends using
        the shorthand because it intelligently resets unspecified values.
      </p>
      <CodeBlock language="css" title="Common flex Shorthand Patterns">{`/* flex: <grow> <shrink> <basis> */
/* flex: 1 → 1 1 0% — equal-width items, THE most common pattern */
.fill { flex: 1; }

/* flex: auto → 1 1 auto — grows/shrinks, respects content size */
.fluid { flex: auto; }

/* flex: none → 0 0 auto — rigid, no flex behavior */
.rigid { flex: none; }

/* Fixed 250px, never grows or shrinks */
.fixed-sidebar { flex: 0 0 250px; }

/* Grows at 2x rate relative to flex: 1 siblings */
.double-wide { flex: 2; }`}</CodeBlock>

      <InfoBox variant="info" title="Why Use the Shorthand?">
        Writing <code>flex-grow: 1</code> alone leaves <code>flex-basis</code> at its
        default <code>auto</code>. The shorthand <code>flex: 1</code> sets
        <code>flex-basis</code> to <code>0%</code>, which usually produces the equal-width
        columns you actually want. Always prefer the shorthand unless you have a specific
        reason to set individual properties.
      </InfoBox>

      <h2>order Property</h2>
      <p>
        Overrides the visual rendering order of a flex item without changing the DOM.
        Default is <code>0</code>. Lower values render first. Useful for responsive layouts
        where you need a sidebar to appear before or after main content depending on viewport.
      </p>
      <CodeBlock language="css" title="order Usage">{`.featured   { order: -1; } /* renders first visually */
.normal     { order: 0; }  /* default */
.secondary  { order: 1; }  /* renders last visually */

/* Responsive reorder — sidebar drops below main on mobile */
@media (max-width: 768px) {
  .sidebar { order: 2; }
  .main    { order: 1; }
}`}</CodeBlock>

      <h2>align-self</h2>
      <p>
        Overrides the container&apos;s <code>align-items</code> for a single item. Accepts the same values:
        <code>stretch</code>, <code>flex-start</code>, <code>flex-end</code>, <code>center</code>,
        and <code>baseline</code>. Indispensable for one-off alignment tweaks.
      </p>
      <CodeBlock language="css" title="align-self Override">{`/* Container aligns everything to the top */
.container { display: flex; align-items: flex-start; }

/* But this one item centers itself vertically */
.special-item { align-self: center; }

/* And this one sticks to the bottom */
.bottom-item { align-self: flex-end; }`}</CodeBlock>

      <h2>Common Flexbox Patterns</h2>

      <h3>Perfect Centering</h3>
      <CodeBlock language="css" title="Centering Techniques">{`/* Center both axes — the classic two-liner */
.center-both {
  display: flex;
  justify-content: center;
  align-items: center;
}
/* Horizontal only */
.center-h { display: flex; justify-content: center; }
/* Vertical only */
.center-v { display: flex; align-items: center; }
/* Single-item centering with margin auto */
.container { display: flex; }
.centered-child { margin: auto; }`}</CodeBlock>

      <h3>Equal Height Columns</h3>
      <CodeBlock language="css" title="Equal Height Columns">{`/* align-items: stretch (default) does the heavy lifting */
.columns {
  display: flex;
  gap: 1rem;
}
.column {
  flex: 1;           /* equal widths */
  /* height auto-stretches to tallest sibling */
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
}`}</CodeBlock>

      <h3>Sticky Footer</h3>
      <CodeBlock language="css" title="Sticky Footer Layout">{`/* Footer stays at bottom even with little content */
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.header  { flex-shrink: 0; }
.main    { flex: 1; }          /* absorbs all free space */
.footer  { flex-shrink: 0; }`}</CodeBlock>

      <h3>Navigation Bar</h3>
      <CodeBlock language="css" title="Responsive Navigation">{`.navbar {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  height: 64px;
}
.logo {
  flex: none;              /* fixed size */
  margin-right: auto;      /* pushes nav links to the right */
}
.nav-links {
  display: flex;
  gap: 1.5rem;
  list-style: none;
}
.auth-buttons {
  display: flex;
  gap: 0.5rem;
  margin-left: 2rem;
}`}</CodeBlock>

      <h3>Card Layout with Wrapping</h3>
      <CodeBlock language="css" title="Responsive Card Grid">{`.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.card {
  flex: 1 1 300px;         /* grow, shrink, min 300px */
  max-width: 400px;        /* prevent cards from getting too wide */
  display: flex;
  flex-direction: column;  /* nested flex for internal layout */
}
.card-body {
  flex: 1;                 /* body fills available height */
}
.card-footer {
  flex-shrink: 0;          /* footer stays at bottom of card */
  margin-top: auto;        /* pushes footer down */
}`}</CodeBlock>

      <h3>Holy Grail Layout</h3>
      <CodeBlock language="css" title="Holy Grail with Flexbox">{`.holy-grail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.hg-header, .hg-footer {
  flex-shrink: 0;
}
.hg-body {
  display: flex;
  flex: 1;
}
.hg-content {
  flex: 1;                  /* main content fills center */
  padding: 1rem;
}
.hg-nav {
  flex: 0 0 200px;          /* left sidebar fixed 200px */
  order: -1;                /* DOM: content first for SEO */
}
.hg-aside {
  flex: 0 0 200px;          /* right sidebar fixed 200px */
}`}</CodeBlock>

      <CodeBlock language="html" title="Holy Grail HTML Structure">{`<div class="holy-grail">
  <header class="hg-header">Header</header>
  <div class="hg-body">
    <!-- Content first in DOM for accessibility/SEO -->
    <main class="hg-content">Main Content</main>
    <nav class="hg-nav">Left Nav</nav>
    <aside class="hg-aside">Right Sidebar</aside>
  </div>
  <footer class="hg-footer">Footer</footer>
</div>`}</CodeBlock>

      <h2>Property Decision Tree</h2>
      <FlowChart
        title="Choosing the Right Flex Property"
        chart={"graph TD\n  A[What do you need?] --> B[Distribute items along main axis]\n  A --> C[Align items along cross axis]\n  A --> D[Control item sizing]\n  A --> E[Reorder items]\n  B --> F[justify-content]\n  C --> G{All items or one?}\n  G --> H[All: align-items]\n  G --> I[One: align-self]\n  D --> J{Grow into space?}\n  J --> K[flex-grow]\n  J --> L{Shrink when tight?}\n  L --> M[flex-shrink]\n  L --> N[Set base size: flex-basis]\n  E --> O[order property]"}
      />

      <h2>Knowledge Check</h2>

      <InteractiveChallenge
        question={"What does flex: 1 expand to?"}
        options={[
          "flex-grow: 1; flex-shrink: 1; flex-basis: auto;",
          "flex-grow: 1; flex-shrink: 1; flex-basis: 0%;",
          "flex-grow: 1; flex-shrink: 0; flex-basis: 0%;",
          "flex-grow: 1; flex-shrink: 1; flex-basis: 100%;"
        ]}
        correctIndex={1}
        explanation={"flex: 1 is shorthand for flex: 1 1 0%. The key insight is that flex-basis becomes 0%, not auto. This means all items ignore their intrinsic width and divide space purely by flex-grow ratio, giving you truly equal-width columns."}
        language="css"
      />

      <InteractiveChallenge
        question="Which property controls spacing between wrapped flex lines?"
        options={[
          "justify-content",
          "align-items",
          "align-content",
          "gap"
        ]}
        correctIndex={2}
        explanation="align-content controls the distribution of space between flex lines on the cross axis when wrapping occurs. justify-content handles the main axis, align-items handles individual item alignment within a line, and gap sets fixed spacing between items but does not distribute remaining space."
        language="css"
      />

      <InteractiveChallenge
        question={"An item has flex: 0 0 250px. What behavior does this produce?"}
        options={[
          "The item is 250px wide and can grow or shrink",
          "The item is exactly 250px wide and will not flex at all",
          "The item starts at 250px but shrinks if the container is smaller",
          "The item ignores 250px and uses its content width"
        ]}
        correctIndex={1}
        explanation={"flex: 0 0 250px means flex-grow: 0 (won't grow), flex-shrink: 0 (won't shrink), flex-basis: 250px (starts at 250px). This creates a rigid, fixed-width item — perfect for sidebars or fixed-width panels that should never change size."}
        language="css"
      />
    </LessonLayout>
  );
}
