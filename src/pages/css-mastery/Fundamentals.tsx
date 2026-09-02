import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Fundamentals() {
  return (
    <LessonLayout
      title="CSS Fundamentals from Scratch"
      sectionId="css-mastery"
      lessonIndex={0}
      prev={null}
      next={{ path: '/css-mastery/flexbox', label: 'Flexbox Complete Guide' }}
    >
      <p>
        Every later lesson in this section &mdash; Flexbox, Grid, custom properties, Sass &mdash;
        assumes you already know what a selector is, how two conflicting rules resolve, what
        <code> box-sizing: border-box</code> is fixing, and why <code>rem</code> and <code>em</code> are
        different. This lesson is that assumed layer, built from zero. Nothing here is optional
        knowledge: every single CSS bug you will ever debug comes back to the cascade, the box model,
        or the containing block.
      </p>

      <h2>Anatomy of a CSS Rule</h2>
      <p>
        CSS is a list of <strong>rules</strong>. Each rule has a <strong>selector</strong> (which
        elements it applies to) and a <strong>declaration block</strong> (what to do to them). Each
        declaration inside the block is a <strong>property</strong> and a <strong>value</strong>,
        separated by a colon and terminated by a semicolon.
      </p>

      <CodeBlock language="css" title="The Four Parts of Every Rule">
{`.card {              /* selector — WHICH elements */
  color: #333;       /* declaration: property "color", value "#333" */
  padding: 16px;     /* another declaration */
}                    /* the braces are the declaration block */

/* Multiple selectors share one block — comma-separated */
h1, h2, h3 { line-height: 1.2; }

/* An invalid declaration is silently DROPPED, not an error.
   The rest of the block still applies. */
.card {
  color: not-a-color;  /* thrown away by the parser */
  padding: 16px;       /* still applied */
}`}
      </CodeBlock>

      <InfoBox variant="info" title="CSS fails silently, and that is deliberate">
        A property the browser does not understand, or a value it cannot parse, is discarded and
        everything else continues. There is no exception, no console error, no build failure. This is
        what makes CSS forward-compatible &mdash; old browsers ignore new syntax instead of blowing
        up &mdash; and it is also why a single typo can waste twenty minutes. When a style
        &quot;isn&apos;t working,&quot; check DevTools: an invalid declaration shows up struck out.
      </InfoBox>

      <h2>Selectors</h2>
      <p>
        A selector is a pattern that matches elements in the DOM. There are five kinds of{' '}
        <em>simple</em> selector, and four <em>combinators</em> for expressing relationships between
        them. Everything else in CSS &mdash; including the fancy modern stuff like{' '}
        <code>:has()</code> &mdash; is built out of these.
      </p>

      <h3>Simple Selectors</h3>
      <CodeBlock language="css" title="The Five Simple Selector Types">
{`/* 1. TYPE (element) — matches by tag name */
p       { margin-block: 1em; }
button  { cursor: pointer; }

/* 2. CLASS — matches class="..." — your everyday workhorse */
.card       { border-radius: 8px; }
.card.large { padding: 2rem; }   /* BOTH classes on the same element */

/* 3. ID — matches id="..." — unique per document, very high specificity */
#app { min-height: 100vh; }

/* 4. ATTRIBUTE — matches on an attribute's presence or value */
[disabled]              { opacity: 0.5; }      /* present, any value */
[type="email"]          { }                     /* exact match */
[class^="icon-"]        { }                     /* STARTS with */
[href$=".pdf"]          { }                     /* ENDS with */
[data-status*="error"]  { }                     /* CONTAINS substring */

/* 5. UNIVERSAL — matches everything */
* { box-sizing: border-box; }`}
      </CodeBlock>

      <h3>Pseudo-classes vs Pseudo-elements</h3>
      <p>
        These two get conflated constantly because they look alike. A <strong>pseudo-class</strong>{' '}
        (one colon) selects a real element that happens to be in some <em>state</em> or{' '}
        <em>position</em>. A <strong>pseudo-element</strong> (two colons) selects a sub-part of an
        element that has no DOM node of its own &mdash; you are styling something the browser
        generates.
      </p>

      <CodeBlock language="css" title="One Colon vs Two Colons">
{`/* PSEUDO-CLASS — a state or position of a real element */
.btn:hover          { }  /* pointer is over it */
.btn:focus-visible  { }  /* keyboard-focused (not mouse-clicked) */
.btn:disabled       { }  /* has the disabled attribute */
li:first-child      { }  /* first among its siblings */
li:nth-child(2n)    { }  /* every even sibling */
li:last-child       { }
input:checked       { }
a:not(.external)    { }  /* negation */

/* PSEUDO-ELEMENT — a generated sub-part, no DOM node exists */
.quote::before      { content: "\\201C"; }  /* content is REQUIRED or nothing renders */
.quote::after       { content: "\\201D"; }
p::first-line       { font-weight: 600; }
input::placeholder  { color: #999; }
::selection         { background: yellow; }`}
      </CodeBlock>

      <InfoBox variant="warning" title="::before and ::after need content, always">
        A pseudo-element without a <code>content</code> property does not render at all &mdash; not
        even as an empty box. <code>content: &quot;&quot;</code> (empty string) is the correct value
        when you only want a decorative shape. This is the single most common
        &quot;why is my ::after invisible&quot; cause.
      </InfoBox>

      <h3>Combinators</h3>
      <p>
        Combinators express a relationship between two selectors. The whitespace one is so common
        people forget it <em>is</em> a combinator.
      </p>

      <CodeBlock language="css" title="The Four Combinators">
{`/* DESCENDANT (space) — any depth below */
.card p        { }  /* every p inside .card, however deeply nested */

/* CHILD (>) — direct children only, one level */
.menu > li     { }  /* skips li inside a nested submenu */

/* ADJACENT SIBLING (+) — the very next sibling element */
h2 + p         { margin-top: 0; }  /* only the p IMMEDIATELY after an h2 */

/* GENERAL SIBLING (~) — any later sibling, same parent */
h2 ~ p         { }  /* every p after an h2, not just the first */

/* They combine freely */
nav > ul li a:hover { }`}
      </CodeBlock>

      <FlowChart
        title="Combinator Relationships"
        chart={"graph TD\n  A[\"div.card — ancestor\"] --> B[\"h2 — child\"]\n  A --> C[\"p — child, adjacent sibling of h2\"]\n  A --> D[\"section — child\"]\n  D --> E[\"p — descendant of .card, NOT a child\"]\n  B -.->|\"h2 + p matches\"| C\n  A -.->|\"'.card p' matches BOTH p elements\"| E\n  A -.->|\"'.card > p' matches only the direct child\"| C"}
      />

      <h2>The Cascade &mdash; How Conflicts Are Resolved</h2>
      <p>
        Two rules set <code>color</code> on the same element. Which wins? The browser runs a fixed,
        deterministic algorithm called <strong>the cascade</strong>. It checks criteria in strict
        order and stops at the first one that breaks the tie.
      </p>

      <FlowChart
        title="Cascade Resolution Order"
        chart={"graph TD\n  A[\"Two declarations conflict\"] --> B[\"1. Origin and importance\"]\n  B -->|\"still tied\"| C[\"2. Specificity score\"]\n  C -->|\"still tied\"| D[\"3. Source order — last one wins\"]\n  B -->|\"resolved\"| W[\"Winner applied\"]\n  C -->|\"resolved\"| W\n  D --> W"}
      />

      <CodeBlock language="text" title="Step 1 — Origin and Importance, Weakest to Strongest">
{`1. browser (user-agent) default styles      ← weakest
2. user stylesheet
3. YOUR stylesheet (author)                 ← where you normally live
4. author !important
5. user !important
6. browser !important                        ← strongest, wins over everything
                                               (used for accessibility overrides)

Note: !important INVERTS the normal order — that's why user
!important beats author !important, so a user's accessibility
settings can never be overridden by a site.`}
      </CodeBlock>

      <h3>Specificity Scoring</h3>
      <p>
        If origin and importance tie (the usual case &mdash; all your rules are plain author styles),
        the browser scores each selector as a tuple and compares column by column, left to right. A
        higher number in an earlier column wins outright, no matter what the later columns say.
      </p>

      <CodeBlock language="css" title="The Four-Column Score">
{`/* (inline, ID, class/attribute/pseudo-class, element/pseudo-element) */

*                        /* (0,0,0,0)  universal adds nothing */
p                        /* (0,0,0,1) */
p::before                /* (0,0,0,2)  pseudo-ELEMENT counts as an element */
.title                   /* (0,0,1,0) */
p.title                  /* (0,0,1,1) */
[type="text"]            /* (0,0,1,0)  attribute counts as a class */
a:hover                  /* (0,0,1,1)  pseudo-CLASS counts as a class */
.nav .item .link         /* (0,0,3,0) */
#page                    /* (0,1,0,0) */
#page .title p           /* (0,1,1,1) */
style="color: red"       /* (1,0,0,0)  inline style */

/* THE KEY RULE: compare column by column, left to right.
   #page          (0,1,0,0)  BEATS
   .a.b.c.d.e.f.g (0,0,7,0)
   because column 2 is compared before column 3 —
   one ID beats any number of classes. It is not a sum. */`}
      </CodeBlock>

      <InfoBox variant="tip" title="Specificity of the modern selectors">
        <code>:is()</code> and <code>:not()</code> take the specificity of their{' '}
        <em>most specific argument</em> &mdash; <code>:is(#a, p)</code> scores{' '}
        <code>(0,1,0,0)</code>. <code>:where()</code> always scores zero, which makes it the correct
        tool for resets and library defaults you want consumers to override trivially. You will see
        this used constantly in the Custom Properties lesson.
      </InfoBox>

      <h3>Source Order and !important</h3>
      <CodeBlock language="css" title="Ties Break on Source Order">
{`.card { color: blue; }
.card { color: red; }    /* SAME specificity (0,0,1,0) → last one wins → red */

/* This is why stylesheet ORDER matters, and why a utility
   class often "doesn't work" — it's declared before the
   component rule it's trying to override. */

/* !important escapes specificity entirely... */
.card { color: green !important; }  /* wins over the above */
/* ...but two !important rules still fall back to
   specificity, then source order, to break their own tie. */
#page .card { color: purple !important; }  /* this one wins */`}
      </CodeBlock>

      <InfoBox variant="danger" title="!important is a debt, not a tool">
        Every <code>!important</code> you add can only be overridden by another{' '}
        <code>!important</code> with higher specificity. Teams that reach for it end up in an
        escalation war where every rule is important and none of them are. The legitimate uses are
        narrow: overriding a third-party stylesheet you cannot edit, and utility classes in a
        framework that are meant to be final. Everything else means your specificity is structured
        wrong &mdash; the real fix is usually cascade layers, covered in the Custom Properties lesson.
      </InfoBox>

      <h3>Inheritance</h3>
      <p>
        Separate from the cascade: some properties pass down to descendants automatically, and some
        do not. Broadly, <strong>text-related properties inherit</strong> (color, font-family,
        font-size, line-height, text-align, visibility) and{' '}
        <strong>box/layout properties do not</strong> (margin, padding, border, background, width,
        display, position).
      </p>

      <CodeBlock language="css" title="Inheritance and the Four Global Keywords">
{`body { color: #333; font-family: system-ui; }
/* every descendant gets #333 and system-ui for free —
   no need to repeat it on each element */

body { border: 1px solid red; }
/* NOT inherited — only body gets the border */

/* Four keywords available on ANY property: */
.a { color: inherit; }   /* force-take the parent's computed value */
.a { color: initial; }   /* the property's spec default (color → black) */
.a { color: unset; }     /* inherit if inheritable, else initial */
.a { all: revert; }      /* roll back to the browser's default stylesheet */

/* Classic use: form controls do NOT inherit font by default */
input, button, select, textarea { font: inherit; }`}
      </CodeBlock>

      <h2>The Box Model</h2>
      <p>
        Every element is a rectangular box made of four concentric layers. Understanding which layer
        a size refers to is the difference between layouts that work and layouts that overflow by
        exactly the amount of padding you added.
      </p>

      <FlowChart
        title="The Four Box Layers, Outside In"
        chart={"graph TD\n  M[\"MARGIN — space OUTSIDE the border, transparent, can collapse\"] --> B[\"BORDER — drawn edge, has a width\"]\n  B --> P[\"PADDING — space INSIDE the border, shows the background\"]\n  P --> C[\"CONTENT — the text or child boxes\"]"}
      />

      <CodeBlock language="css" title="The Layers, and Their Shorthands">
{`.box {
  /* CONTENT box size */
  width: 200px;
  height: 100px;

  /* PADDING — inside the border, painted with the background */
  padding: 16px;              /* all four sides */
  padding: 8px 16px;          /* vertical | horizontal */
  padding: 8px 16px 24px;     /* top | horizontal | bottom */
  padding: 8px 16px 24px 32px;/* top | right | bottom | left — CLOCKWISE */

  /* BORDER — width, style, color (style is required or nothing draws) */
  border: 1px solid #ddd;
  border-bottom: 2px solid red;   /* one side */

  /* MARGIN — outside the border, transparent, same shorthand rules */
  margin: 0 auto;             /* 0 vertical, auto horizontal → centers a block */
}`}
      </CodeBlock>

      <h3>box-sizing &mdash; the one you must change</h3>
      <p>
        By default (<code>content-box</code>), <code>width</code> sets the size of the{' '}
        <em>content</em> layer only &mdash; padding and border are then <em>added on top</em>. So a
        200px box with 20px padding renders 240px wide. This is almost never what anyone wants, which
        is why the very first line of every modern CSS reset flips it.
      </p>

      <CodeBlock language="css" title="content-box vs border-box">
{`/* DEFAULT — content-box */
.a {
  box-sizing: content-box;
  width: 200px;
  padding: 20px;
  border: 5px solid;
}
/* rendered width = 200 + 20 + 20 + 5 + 5 = 250px  ← surprise */

/* WHAT YOU WANT — border-box */
.b {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 5px solid;
}
/* rendered width = 200px exactly; content shrinks to 150px */

/* Put this at the top of every project, once: */
*, *::before, *::after { box-sizing: border-box; }`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why border-box makes math work">
        With <code>border-box</code>, three columns at <code>width: 33.333%</code> with padding still
        add up to 100% &mdash; the padding lives inside the percentage. With{' '}
        <code>content-box</code> they overflow their container by six paddings. Percentage widths and
        <code> content-box</code> are fundamentally incompatible, and that incompatibility is the
        origin of a decade of float-layout hacks.
      </InfoBox>

      <h3>Margin Collapsing</h3>
      <p>
        Adjacent <em>vertical</em> margins merge into one, taking the larger value rather than adding
        up. This applies between block-level siblings, and between a parent and its first or last
        child. Horizontal margins never collapse, and flex/grid item margins never collapse.
      </p>

      <CodeBlock language="css" title="Collapsing, and How to Stop It">
{`.a { margin-bottom: 20px; }
.b { margin-top: 30px; }
/* Stacked, the gap between them is 30px — NOT 50px. The larger wins. */

/* Parent/child collapse — the child's margin "escapes" the parent: */
.parent { }                      /* no padding, no border */
.parent .child { margin-top: 40px; }
/* the 40px pushes the PARENT down instead of the child */

/* Fixes — any of these create a new block formatting context
   or sidestep margins entirely: */
.parent { display: flow-root; }  /* cleanest modern fix */
.parent { padding-top: 1px; }    /* a border or padding also blocks it */
.parent { display: flex; gap: 40px; }  /* gap never collapses — best answer */`}
      </CodeBlock>

      <h2>display &mdash; Block, Inline, Inline-Block</h2>
      <p>
        The <code>display</code> property decides two things at once: how the box participates in its
        parent&apos;s layout (its <em>outer</em> role) and how its own children are laid out (its{' '}
        <em>inner</em> role). <code>flex</code> and <code>grid</code> change the inner role and get
        their own lessons; these three change the outer role and you need them constantly.
      </p>

      <CodeBlock language="css" title="The Core Display Values">
{`/* BLOCK — div, p, h1, section, ul are block by default */
.block {
  display: block;
  /* starts on a new line, fills the parent's width by default,
     width / height / all margins and padding apply normally */
}

/* INLINE — span, a, strong, em are inline by default */
.inline {
  display: inline;
  /* flows within a line of text, only as wide as its content.
     width and height are IGNORED.
     Vertical margin/padding don't push siblings away
     (they render but don't affect line height).
     Horizontal margin/padding DO work. */
}

/* INLINE-BLOCK — the hybrid */
.hybrid {
  display: inline-block;
  /* flows inline like a span, BUT respects width, height,
     and all margins/padding like a block. */
}

/* NONE — removed from layout AND the accessibility tree */
.hidden { display: none; }`}
      </CodeBlock>

      <InfoBox variant="warning" title="display: none vs visibility: hidden vs opacity: 0">
        <code>display: none</code> removes the element from layout entirely and hides it from screen
        readers. <code>visibility: hidden</code> keeps its space reserved but hides it visually and
        from screen readers. <code>opacity: 0</code> keeps the space{' '}
        <em>and keeps it clickable and focusable</em> &mdash; an invisible button that still traps
        keyboard focus is a genuine accessibility bug, so pair it with{' '}
        <code>pointer-events: none</code> and remove it from the tab order if you use it for a fade.
      </InfoBox>

      <CodeBlock language="css" title="Why inline-block Used to Matter, and Where It Still Does">
{`/* The classic problem: you want a nav item that's inline
   but needs vertical padding to make a bigger click target. */
.nav a {
  display: inline-block;   /* now vertical padding works */
  padding: 12px 16px;
}

/* Modern answer for a nav BAR is flex — but inline-block is
   still the right tool when items must WRAP within flowing text,
   e.g. inline badges inside a paragraph: */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
}`}
      </CodeBlock>

      <h2>Positioning</h2>
      <p>
        <code>position</code> controls whether an element sits in the normal document flow and what
        the offset properties (<code>top</code>, <code>right</code>, <code>bottom</code>,{' '}
        <code>left</code>) are measured against. The measuring reference is called the{' '}
        <strong>containing block</strong>, and getting it wrong is the most common positioning bug
        there is.
      </p>

      <CodeBlock language="css" title="The Five position Values">
{`/* STATIC — the default. In normal flow.
   top/right/bottom/left and z-index have NO effect. */
.a { position: static; }

/* RELATIVE — stays in flow (its original space is preserved),
   but is visually offset from its OWN normal position.
   Also becomes a positioning ANCESTOR for absolute children. */
.b { position: relative; top: 4px; left: 8px; }

/* ABSOLUTE — REMOVED from flow (no space reserved).
   Offsets measured from the nearest POSITIONED ancestor
   (any ancestor whose position is not static),
   falling back to the initial containing block. */
.c { position: absolute; top: 0; right: 0; }

/* FIXED — removed from flow, offsets measured from the VIEWPORT.
   Stays put while the page scrolls. */
.d { position: fixed; bottom: 16px; right: 16px; }

/* STICKY — in flow and relative, until it hits the given
   threshold during scroll, then behaves like fixed.
   REQUIRES at least one of top/right/bottom/left. */
.e { position: sticky; top: 0; }`}
      </CodeBlock>

      <FlowChart
        title="Which Containing Block Do Offsets Use?"
        chart={"graph TD\n  A[\"You set top / left on an element\"] --> B{\"What is its position?\"}\n  B -->|static| N[\"Offsets are ignored entirely\"]\n  B -->|relative| S[\"Its own normal position in flow\"]\n  B -->|absolute| P{\"Any ancestor with position not static?\"}\n  P -->|yes| Q[\"That ancestor's padding box\"]\n  P -->|no| R[\"The initial containing block — the page\"]\n  B -->|fixed| V[\"The viewport\"]\n  B -->|sticky| T[\"Nearest scrolling ancestor, past the threshold\"]"}
      />

      <CodeBlock language="css" title="The Anchor Pattern — relative Parent, absolute Child">
{`/* THE single most common positioning idiom in all of CSS */
.card {
  position: relative;   /* creates the anchor — this line is the whole trick */
}
.card .badge {
  position: absolute;   /* now measured from .card, not from the page */
  top: 8px;
  right: 8px;
}

/* Forget position: relative on .card and the badge flies to the
   top-right corner of the DOCUMENT. That is bug #1. */

/* Full-cover overlay — all four offsets at 0 */
.overlay { position: absolute; inset: 0; }  /* inset: 0 = top/right/bottom/left: 0 */`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why your position: sticky silently does nothing">
        Three requirements, and all three must hold. (1) It needs a threshold &mdash;{' '}
        <code>top: 0</code> or similar; <code>position: sticky</code> alone does nothing.
        (2) No ancestor may have <code>overflow: hidden</code>, <code>auto</code>, or{' '}
        <code>scroll</code> &mdash; that silently creates a different scroll container and the element
        sticks inside it, invisibly. (3) The parent must be taller than the sticky element, or there
        is no distance to stick across.
      </InfoBox>

      <h3>z-index and Stacking</h3>
      <CodeBlock language="css" title="z-index Only Works on Positioned Elements">
{`.a { z-index: 999; }                      /* IGNORED — position is static */
.b { position: relative; z-index: 999; }  /* works */
/* (flex and grid ITEMS are the exception — z-index works on them
   even while static) */

/* Stacking contexts trap their children: */
.parent { position: relative; z-index: 1; }   /* NEW stacking context */
.parent .child { position: relative; z-index: 9999; }
/* .child's 9999 competes only INSIDE .parent — it can never
   render above a sibling of .parent that has z-index: 2. */

/* Things that quietly create a stacking context:
   opacity < 1, transform, filter, will-change, isolation: isolate,
   position: fixed/sticky, and a positioned element with any z-index. */`}
      </CodeBlock>

      <FlowChart
        title="Stacking Contexts Nest — z-index Only Wins Locally"
        chart={"graph TD\n  ROOT[\"Page — root stacking context\"] --> PARENT[\".parent — position:relative; z-index:1 — NEW stacking context\"]\n  ROOT --> SIB[\".sibling — position:relative; z-index:2 — a later sibling of .parent, same root context\"]\n  PARENT --> CHILD[\".child — position:relative; z-index:9999 — trapped inside .parent\"]\n  CHILD -.->|\"9999 only ranks among .parent's OWN children\"| PARENT\n  SIB -.->|\".sibling's 2 beats .parent's 1 in the root context — so .sibling renders above .child too, despite 9999\"| PARENT\n  style PARENT fill:#1a2744\n  style CHILD fill:#3b1a1a\n  style SIB fill:#1a3329"}
      />

      <h2>Units</h2>
      <p>
        CSS units split into <strong>absolute</strong> (fixed physical size) and{' '}
        <strong>relative</strong> (computed from something else). Choosing correctly is mostly about
        deciding <em>what should this scale with</em>.
      </p>

      <CodeBlock language="css" title="The Units You Will Actually Use">
{`/* px — absolute. 1 CSS pixel, does not scale with user font settings. */
.a { border-width: 1px; }     /* good: hairlines, shadows, tiny offsets */

/* rem — relative to the ROOT (html) font-size. Never compounds. */
html { font-size: 100%; }     /* = 16px by default, RESPECTS user settings */
.b { font-size: 1.5rem; }     /* = 24px, but scales if the user zooms text */
.c { padding: 1rem; }         /* = 16px, scales with the type system */

/* em — relative to THIS element's font-size (or the parent's,
   when used for font-size itself). COMPOUNDS through nesting. */
.d { font-size: 1.2em; }
.d .e { font-size: 1.2em; }   /* = 1.44x the grandparent — compounding */
.btn { padding: 0.5em 1em; }  /* GOOD use: padding scales with the button's
                                 own text, so one rule fits every size */

/* % — relative to the PARENT's corresponding dimension */
.f { width: 50%; }            /* half the parent's width */
.g { height: 100%; }          /* needs the parent to have a definite height! */

/* vw / vh — 1% of viewport width / height */
.hero { min-height: 100vh; }
/* vh is unreliable on mobile — browser chrome shows/hides.
   Prefer the dynamic variants: */
.hero { min-height: 100dvh; } /* dynamic viewport height */

/* ch / ex — width of "0" / height of "x" in the current font */
.prose { max-width: 65ch; }   /* the best line-length rule there is */

/* fr — grid only, a fraction of the free space */
.grid { grid-template-columns: 1fr 2fr; }`}
      </CodeBlock>

      <InfoBox variant="tip" title="The practical rule for picking a unit">
        Use <code>rem</code> for font sizes and most spacing &mdash; it scales with the user&apos;s
        browser font setting, which is a real accessibility requirement, and it never compounds. Use{' '}
        <code>em</code> deliberately when a value should scale with the element&apos;s{' '}
        <em>own</em> text (button padding, icon sizing next to a label). Use <code>px</code> only for
        things that genuinely should not scale: borders, hairlines, small shadow offsets. Never set{' '}
        <code>html &#123; font-size: 62.5%; &#125;</code> to make 1rem = 10px &mdash; it looks
        convenient and it breaks the user&apos;s font-size preference.
      </InfoBox>

      <h2>Colors</h2>
      <CodeBlock language="css" title="Color Syntaxes, Oldest to Newest">
{`/* NAMED — 148 of them, useful for prototyping only */
.a { color: rebeccapurple; }

/* HEX — #RRGGBB, or #RGB shorthand, or #RRGGBBAA with alpha */
.b { color: #6366f1; }
.c { color: #f00; }          /* = #ff0000 */
.d { color: #6366f180; }     /* trailing 80 = ~50% alpha */

/* RGB — 0-255 per channel. Modern syntax: spaces, slash for alpha. */
.e { color: rgb(99 102 241); }
.f { color: rgb(99 102 241 / 60%); }
.g { color: rgba(99, 102, 241, 0.6); }   /* legacy comma form, still valid */

/* HSL — hue 0-360, saturation %, lightness %.
   By far the easiest to hand-tune. */
.h { color: hsl(243 75% 67%); }
.i { color: hsl(243 75% 45%); }   /* same hue, just darker */
.j { color: hsl(243 75% 67% / 0.6); }

/* SPECIAL KEYWORDS */
.k { border-color: currentColor; }  /* = this element's own color value */
.l { background: transparent; }     /* = rgb(0 0 0 / 0) */

/* MODERN — wide gamut and blending, no preprocessor needed */
.m { color: oklch(60% 0.2 275); }
.n { background: color-mix(in oklch, #6366f1 80%, black); }`}
      </CodeBlock>

      <InfoBox variant="info" title="Why HSL is worth learning even though hex is everywhere">
        With hex you cannot look at <code>#6366f1</code> and produce a slightly darker version
        without a tool. With <code>hsl(243 75% 67%)</code> you drop the lightness to 45% and you have
        it. That makes hover states, disabled states, and a whole tonal ramp derivable by hand from
        one base color &mdash; which is exactly the job the Design Tokens lesson formalizes.
        <code> currentColor</code> is the other quiet win: a border or SVG icon set to{' '}
        <code>currentColor</code> tracks the text color through every theme and state for free.
      </InfoBox>

      <h2>Putting It Together</h2>
      <CodeBlock language="css" title="A Complete Component Using Only What's Above">
{`*, *::before, *::after { box-sizing: border-box; }

.card {
  position: relative;              /* anchor for the badge */
  display: block;
  max-width: 65ch;                 /* readable line length */
  padding: 1.5rem;                 /* scales with root font-size */
  border: 1px solid hsl(243 20% 88%);
  border-radius: 8px;
  color: hsl(243 15% 20%);         /* inherited by all descendants */
  background: white;
}

.card > h3 {                       /* direct child only */
  margin-block: 0 0.5rem;
  font-size: 1.25rem;
}

.card h3 + p { margin-top: 0; }    /* adjacent sibling */

.card .badge {
  position: absolute;              /* measured from .card */
  top: 0.75rem;
  right: 0.75rem;
  display: inline-block;           /* so vertical padding applies */
  padding: 0.25em 0.75em;          /* em → scales with the badge's own text */
  border-radius: 999px;
  font-size: 0.75rem;
  background: hsl(243 75% 95%);
  color: hsl(243 75% 40%);
}

.card[data-status="error"] .badge {   /* attribute selector */
  background: hsl(0 75% 95%);
  color: hsl(0 75% 40%);
}

.card:hover {                      /* pseudo-class */
  border-color: currentColor;
}

.card::after {                     /* pseudo-element */
  content: "";                     /* required, or nothing renders */
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 1px 3px hsl(243 20% 50% / 0.15);
  pointer-events: none;            /* never intercept clicks */
}`}
      </CodeBlock>

      <h2>Knowledge Check</h2>

    </LessonLayout>
  );
}
