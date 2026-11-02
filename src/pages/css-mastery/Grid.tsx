import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Grid() {
  return (
    <LessonLayout
      title="CSS Grid Complete Guide"
      sectionId="css-mastery"
      lessonIndex={2}
      prev={{ path: '/css-mastery/flexbox', label: 'Flexbox Complete Guide' }}
      next={{ path: '/css-mastery/sizing', label: 'Why Is This Element That Size?' }}
    >
      <p>CSS Grid is the first layout system designed for two dimensions. Unlike Flexbox (one axis at a time), Grid gives you simultaneous control over rows and columns. This guide covers everything from container basics to subgrid and production patterns.</p>

      <h2>The Vocabulary: Lines, Tracks, Cells, Areas</h2>
      <p>
        Four words do all the work in Grid, and the rest of this lesson is unreadable without them.
        The one that matters most is <strong>track</strong>, because every property you are about to
        meet &mdash; <code>grid-template-columns</code>, <code>fr</code>, <code>minmax()</code>,{' '}
        <code>repeat()</code>, <code>auto-fill</code> &mdash; is a way of describing tracks.
      </p>

      <CodeBlock language="text" title="One grid, with every term labelled">
{`A 3-column, 2-row grid. Every term below is labelled on it.

           line 1         line 2          line 3         line 4
             |              |               |              |
             v              v               v              v
             +--------------+---------------+--------------+  <- row line 1
             |              |               |              |
             |     cell     |     cell      |     cell     |  ROW TRACK 1
             |              |               |              |
             +--------------+---------------+--------------+  <- row line 2
             |              |               |              |
             |     cell     |     cell      |     cell     |  ROW TRACK 2
             |              |               |              |
             +--------------+---------------+--------------+  <- row line 3

             <--- 200px ---><---- 1fr -----><--- 1fr ----->
             COLUMN TRACK 1  COLUMN TRACK 2  COLUMN TRACK 3

   LINE   — a numbered divider BETWEEN tracks (and at both outer edges).
            3 columns means 4 column lines. Lines are what you place
            items against: grid-column: 1 / 3 means "line 1 to line 3".
            They are 1-indexed, and -1 is the last line.

   TRACK  — the band of space BETWEEN two adjacent lines: a whole row
            or a whole column. "grid-template-columns: 200px 1fr 1fr"
            declares three column tracks. A track is the unit Grid
            actually sizes; items are then fitted into it.

   CELL   — one row track crossed with one column track. The smallest
            unit you can place something in. 2 rows x 3 cols = 6 cells.

   AREA   — any rectangular block of one or more cells, named or spanned.

   GUTTER — the space 'gap' puts BETWEEN tracks. It is not a track and
            not a cell: nothing can be placed in it, and it is subtracted
            before any fr is calculated.`}
      </CodeBlock>

      <p>
        &ldquo;A track is the unit Grid actually sizes&rdquo; is not a metaphor. Ask the browser what
        it decided and it hands back a resolved pixel width per track &mdash; which is also the
        fastest way to debug a grid that came out wrong:
      </p>

      <CodeBlock language="text" title="Measured in Chromium 149 — what a declared track list resolves to">
{`.g { display: grid; width: 600px;
     grid-template-columns: 100px 1fr 2fr;
     gap: 20px; }

getComputedStyle(g).gridTemplateColumns
  -> "100px 153.328px 306.672px"      <- three TRACKS, resolved to pixels

  How it got there:
    600px container
    - 40px  two 20px gutters, removed FIRST
    - 100px the fixed track
    = 460px of free space left for the fr tracks
      1fr = 460 / 3 = 153.33px
      2fr = 460 / 3 * 2 = 306.67px

  Measured item widths: 100, 153.328125, 306.671875`}
      </CodeBlock>

      <InfoBox variant="tip" title="getComputedStyle is the grid debugger you already have">
        <code>grid-template-columns</code> is one of the properties whose <em>computed</em> value is
        the used value, so the browser reports the real pixel width of every track &mdash; including
        tracks you never declared. If your layout has more columns than you asked for, this prints the
        evidence in one line. DevTools&apos; grid overlay draws the same information; this is the
        version you can log.
      </InfoBox>

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
      <p>
        Everywhere else in Grid <em>you</em> say how many tracks there are. These two keywords hand
        that decision to the browser: &ldquo;fit as many tracks as you can at this width.&rdquo; That
        is what makes a card grid respond with no media queries at all &mdash; and the reason the two
        are so easily confused is that they pick the <em>same</em> number of tracks. They differ only
        in what they do with the tracks that end up <strong>empty</strong>.
      </p>
      <p>
        The count comes first, and it is pure arithmetic on the track <em>minimum</em>. With{' '}
        <code>minmax(150px, 1fr)</code> in an 800px container, the browser asks how many 150px bands
        fit: <code>800 / 150 = 5.33</code>, so it lays down <strong>5 tracks</strong>. Both keywords
        lay down 5. Then:
      </p>
      <ul>
        <li>
          <strong>auto-fill</strong> leaves all 5 alone. Each keeps its <code>1fr</code> share, so
          every track is 160px wide whether anything is in it or not.
        </li>
        <li>
          <strong>auto-fit</strong> collapses the empty ones to <code>0px</code>, then lets the
          surviving tracks&apos; <code>1fr</code> maxima re-divide the full width.
        </li>
      </ul>

      <CodeBlock language="text" title="The same declaration, 3 items, 800px container">
{`repeat(auto-X, minmax(150px, 1fr))   800 / 150 = 5.33   5 tracks either way

auto-fill  +--------+--------+--------+--------+--------+
           | item 1 | item 2 | item 3 | empty  | empty  |
           +--------+--------+--------+--------+--------+
             160px    160px    160px    160px    160px
           every track keeps its 1fr share. The 3 items stay 160px
           wide and the row ends 320px short of the container.

auto-fit   +--------------+--------------+--------------+++
           |    item 1    |    item 2    |    item 3    |||
           +--------------+--------------+--------------+++
               266.67px       266.67px       266.67px    ^^
                                                         ||
                      two collapsed tracks, 0px wide ----++
           the 2 empty tracks collapse, so the 3 survivors
           re-divide the whole 800px.`}
      </CodeBlock>

      <CodeBlock language="text" title="Measured in Chromium 149 — the computed track list proves it">
{`// 3 items, 800px container, gap 0
auto-fill -> "160px 160px 160px 160px 160px"
             5 tracks, none collapsed, item widths 160/160/160

auto-fit  -> "266.656px 266.672px 266.656px 0px 0px"
             STILL 5 tracks. The last two are 0px, not absent.
             item widths 266.66/266.67/266.66

// 5 items, same container — now nothing is empty
auto-fill -> "160px 160px 160px 160px 160px"
auto-fit  -> "160px 160px 160px 160px 160px"   <- byte-identical`}
      </CodeBlock>

      <InfoBox variant="tip" title="&quot;Collapsed&quot; means 0px, not deleted — and that is testable">
        An auto-fit track that collapses is still in the track list, still numbered, and still
        targetable by line number. That is why the measured output above shows five entries with two
        at <code>0px</code> rather than three entries. It also means an item you place{' '}
        <em>explicitly</em> into a far track keeps that track alive, because the track is no longer
        empty &mdash; measured with two items, one of them at <code>grid-column: 5</code>:
        <br />
        <code>&quot;400px 0px 0px 0px 400px&quot;</code> &mdash; tracks 1 and 5 survive, the three
        between them collapse. &ldquo;Empty&rdquo; is decided per track, not from the end.
      </InfoBox>

      <InfoBox variant="warning" title="gap collapses with the track it was next to">
        Add <code>gap: 20px</code> to that 800px container and two things change. The count drops,
        because gutters are subtracted before the arithmetic &mdash;{' '}
        <code>150n + 20(n-1) &le; 800</code> gives <strong>4</strong> tracks, not 5. And the gutters
        beside a collapsed track collapse with it: measured, the three surviving items are 253.33px
        each, totalling 759.99px, so only <strong>40px</strong> of gap was consumed &mdash; the 2
        gaps <em>between</em> the real items. The third gutter vanished with its track. Without that
        behaviour an auto-fit row would end with a visible gap hanging off the right edge.
      </InfoBox>

      <InfoBox variant="danger" title="Both need a definite width, or you silently get one track">
        The repetition count is division, so it needs something to divide. Put an auto-fit grid in a
        shrink-to-fit context &mdash; a <code>display: inline-block</code> wrapper, a float, a table
        cell, an <code>auto</code>-sized grid track &mdash; and there is no width to divide yet.
        Measured inside an <code>inline-block</code> parent, the track list comes back as plain{' '}
        <code>&quot;150px&quot;</code>: <strong>one</strong> track at its own minimum, items stacked
        in a single column. The CSS is not wrong and nothing warns you; the parent just never had a
        width to share. Give the grid a definite width, or make the parent a block.
      </InfoBox>

      <CodeBlock language="css" title="auto-fill vs auto-fit">
{`/* auto-fill: keeps empty tracks — items DON'T stretch to fill the row */
.fill { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
/* 800px container, 3 items → 5 tracks created, 2 empty but preserved */

/* auto-fit: collapses empty tracks to 0 — items STRETCH to fill the row */
.fit { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
/* 800px container, 3 items → empty tracks collapse, 3 items share all space */`}
      </CodeBlock>

      <InfoBox variant="info" title="Which one do you actually want?">
        Pick by asking what should happen on the <em>last, half-empty row</em> &mdash; that is the
        only place they differ. Want three leftover cards to stretch into a tidy full-width row? That
        is <strong>auto-fit</strong>. Want every card the same width on every row, so a 3-card row
        lines up column-for-column with a 5-card row above it? That is{' '}
        <strong>auto-fill</strong>. Dashboards and image galleries usually want auto-fill for the
        alignment; marketing card rows usually want auto-fit so nothing looks abandoned. If your
        content always fills the row, the choice is cosmetic &mdash; pick auto-fit and move on.
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
      <p>
        <code>grid-column: 2 / 4</code> works until someone inserts a column, and then every number
        in your stylesheet is quietly off by one. Naming the lines fixes that: you place items
        against <em>meaning</em> rather than against a count.
      </p>

      <h3>Where can names be defined?</h3>
      <p>
        Anywhere a line exists &mdash; which means anywhere in the track list, in square brackets,
        between any two track sizes. Specifically, all four of these positions are legal, and you can
        use as few or as many as you like:
      </p>
      <ul>
        <li><strong>Before the first track</strong> &mdash; names the leading edge line.</li>
        <li><strong>Between any two tracks</strong> &mdash; names the divider they share.</li>
        <li><strong>After the last track</strong> &mdash; names the trailing edge line.</li>
        <li>
          <strong>Several names in one bracket</strong>, separated by spaces &mdash;{' '}
          <code>[sidebar-end content-start]</code> gives that <em>one</em> line two names, and either
          works. This is the normal case, not an edge case: one line is almost always the end of one
          thing and the start of the next.
        </li>
      </ul>
      <p>
        The one place the answer is &ldquo;no&rdquo; is <em>across axes</em>. Brackets live inside{' '}
        <code>grid-template-columns</code> and <code>grid-template-rows</code>, and each axis keeps
        its own name list, so a column line name is invisible to <code>grid-row</code>. Measured:
        using a column name in <code>grid-row</code> does not error &mdash; it silently creates
        implicit <em>row</em> tracks (<code>&quot;100px 182px 0px 18px&quot;</code> on a two-row
        grid) and drops the item 290px below where you wanted it. The upside of separate lists is
        that the same name can safely mean different things on each axis:{' '}
        <code>[edge] 200px [mid] 1fr</code> for columns and <code>[edge] 100px [mid] 1fr</code> for
        rows gives <code>grid-column: edge / mid; grid-row: edge / mid</code> a measured 200&times;100
        cell, each axis having used its own.
      </p>

      <CodeBlock language="text" title="Measured in Chromium 149 — names at every legal position resolve">
{`.g { width: 600px;
     grid-template-columns:
       [full-start sidebar-start] 200px
       [sidebar-end content-start] 1fr
       [content-end full-end]; }

getComputedStyle(g).gridTemplateColumns
  -> "[full-start sidebar-start] 200px
      [sidebar-end content-start] 400px
      [content-end full-end]"          (one line, wrapped here to fit)

  grid-column: sidebar-start / sidebar-end  ->  200px wide
  grid-column: content-start / content-end  ->  400px wide
  grid-column: full-start    / full-end     ->  600px wide (the whole grid)

  Three lines, five names, zero numbers anywhere in the placement.`}
      </CodeBlock>

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

      <h3>A reused name becomes a numbered series</h3>
      <p>
        <code>repeat(3, [col] 1fr)</code> gives three different lines the <em>same</em> name, which
        sounds like a mistake and is in fact the intended idiom. A repeated name turns into an
        ordinal series you index: <code>col 1</code>, <code>col 2</code>, <code>col 3</code>. A bare{' '}
        <code>col</code> with no number means the first one.
      </p>

      <CodeBlock language="text" title="Measured in Chromium 149 — the ordinal series">
{`.g { width: 600px; grid-template-columns: repeat(3, [col] 1fr); }

computed -> "[col] 200px [col] 200px [col] 200px"

  grid-column: col 2 / span 1   ->  offsetLeft 200   (2nd named line)
  grid-column: col   / span 1   ->  offsetLeft   0   (bare name == col 1)

This is what makes a 12-column system expressible in one line:
  grid-template-columns: repeat(12, [col] 1fr);
  .wide { grid-column: col 2 / col 8; }   /* no magic numbers */`}
      </CodeBlock>

      <InfoBox variant="warning" title="Asking for a line that is not there does not fail — it invents tracks">
        Name-plus-index is resolved by <em>counting</em>, and if the count runs out Grid does not
        error or clamp: it creates implicit tracks until the name exists. Measured with{' '}
        <code>grid-column: col 9</code> on a 3-track grid, the computed list came back as the three
        real 197.6px tracks followed by <strong>seven implicit 0px tracks</strong>, with the item
        stranded 601px across at 7.1px wide. Nothing in the console, nothing in the CSS looks wrong,
        and the item is simply gone off the edge of your layout. If an item vanishes after you
        refactored a track list, print the computed track list and count the entries.
      </InfoBox>

      <h3>Named lines and named areas are the same thing from two directions</h3>
      <p>
        This is the part almost nobody knows, and it removes a lot of duplicate declarations: the{' '}
        <code>-start</code> / <code>-end</code> suffix is not a convention, it is{' '}
        <em>load-bearing</em>. Name a pair of lines <code>foo-start</code> and <code>foo-end</code>{' '}
        on both axes and you have implicitly defined an <strong>area</strong> called{' '}
        <code>foo</code>, usable with <code>grid-area</code> &mdash; with no{' '}
        <code>grid-template-areas</code> anywhere. And it works in reverse: every area named in{' '}
        <code>grid-template-areas</code> implicitly defines the four lines{' '}
        <code>name-start</code> and <code>name-end</code> on each axis, usable with{' '}
        <code>grid-column</code> / <code>grid-row</code> with no brackets anywhere.
      </p>

      <CodeBlock language="text" title="Measured in Chromium 149 — both directions, verified">
{`// DIRECTION 1: line names -> an area you never declared
.g { grid-template-columns: [card-start] 200px [card-end] 1fr;
     grid-template-rows:    [card-start] 100px [card-end] 1fr; }
.a { grid-area: card; }          /* no grid-template-areas in this rule set */

  measured .a  ->  200px x 100px      the area resolved from the names alone


// DIRECTION 2: areas -> line names you never wrote
.g { grid-template-columns: 200px 1fr;
     grid-template-rows:    100px 1fr;
     grid-template-areas: "nav main"
                          "nav foot"; }
.a { grid-column: nav-start / main-end;   /* no [brackets] anywhere above */
     grid-row:    nav-start / nav-end; }

  measured .a  ->  600px x 100px      spans both columns, top row only`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why direction 2 is the one you will reach for">
        Define your layout once as <code>grid-template-areas</code> &mdash; readable, reviewable, the
        whole page shape visible in four lines &mdash; and you still get precise line names for the
        exceptions. A full-bleed hero that must start at the sidebar and run to the right edge is{' '}
        <code>grid-column: nav-start / main-end</code>, which keeps working when you redefine the
        areas at a breakpoint. You do not have to choose between the ASCII-art approach and named
        lines; picking areas gives you both.
      </InfoBox>

      <InfoBox variant="danger" title="Do not name a line &quot;span&quot; or &quot;auto&quot;">
        Line names are <code>&lt;custom-ident&gt;</code>, and <code>span</code> and <code>auto</code>{' '}
        are reserved words in the Grid grammar. Using either does not just fail locally &mdash; it
        makes the declaration unparseable, so the browser throws away{' '}
        <strong>the entire track list</strong>. Measured:
        <br />
        <code>grid-template-columns: [span] 1fr [end] 1fr</code> &rarr; computed{' '}
        <code>&quot;none&quot;</code>
        <br />
        <code>grid-template-columns: [auto] 1fr [end] 1fr</code> &rarr; computed{' '}
        <code>&quot;none&quot;</code>
        <br />
        <code>grid-template-columns: [spanner] 1fr [end] 1fr</code> &rarr; computed{' '}
        <code>&quot;[spanner] 492px [end] 492px&quot;</code>
        <br />
        <code>&quot;none&quot;</code> means you have no grid columns at all, which looks nothing like
        a naming typo when you are staring at the page. Suffixed names are fine &mdash;{' '}
        <code>spanner</code> and <code>span-start</code> both parse.
      </InfoBox>

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

      <p>
        If the cheat sheet looks like a lot, almost all of it reduces to one
        decision: <strong>grid is for two dimensions, flexbox is for
        one.</strong> If you are arranging things along a single line and
        letting them wrap, that is flexbox. If rows and columns have to line up
        with each other — a page shell, a dashboard, a form where labels align
        down the left — that is grid, and doing it in flexbox means fixing
        widths by hand until it looks right.
      </p>
      <p>
        The two entries worth memorising from that list are{' '}
        <code>grid-column: 1 / -1</code> for &ldquo;span the whole row whatever
        the column count is&rdquo;, and{' '}
        <code>repeat(auto-fit, minmax(200px, 1fr))</code>, which gives you a
        responsive card grid with no media queries at all — the browser works
        out how many fit. That second one replaces the majority of the
        breakpoint maths people used to write.
      </p>
      <p>
        Next: <strong><a href="/css-mastery/sizing">Why Is This Element That
        Size?</a></strong>, which answers the question grid and flexbox both
        raise — once a layout decides sizes for you,{' '}
        <code>width</code> stops being the final word, and knowing what{' '}
        <code>fr</code>, <code>auto</code>, <code>min-content</code> and{' '}
        <code>flex-basis</code> actually resolve to is how you stop fighting it.
      </p>

    </LessonLayout>
  );
}
