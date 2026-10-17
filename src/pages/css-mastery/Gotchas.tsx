import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function CssGotchas() {
  return (
    <LessonLayout
      title="CSS Gotchas: Collapse, Stacking & Containing Blocks"
      sectionId="css-mastery"
      lessonIndex={4}
      prev={{ path: '/css-mastery/sizing', label: 'Why Is This Element That Size?' }}
      next={{ path: '/css-mastery/responsive', label: 'Responsive Design' }}
    >
      <p>
        CSS behaviours that look like bugs, are not bugs, and will each cost you an
        afternoon the first time. Every one of these has a specific rule behind it, and
        every number below was measured in Chromium 149 — including two cases where the
        commonly-repeated explanation turned out to be wrong.
      </p>

      <h2>1. Margins Collapse</h2>
      <p>
        Adjacent vertical margins do not add up. They <strong>collapse</strong> to the
        larger of the two, which is why 20px plus 30px of gap is 30px of gap.
      </p>

      <CodeBlock language="text" title="Real output — adjacent siblings">
{`#a { margin-bottom: 20px }
#b { margin-top: 30px }

actual gap between them:  30px      <- the MAX, not the sum (50)`}
      </CodeBlock>

      <p>
        The worse case is parent/child. A first child&apos;s top margin collapses{' '}
        <em>through</em> its parent and pushes the parent down instead:
      </p>

      <CodeBlock language="text" title="Real output — margin escaping through the parent">
{`#parent { }                      parent top: 40   kid top: 40
#kid    { margin-top: 40px }     ^ the PARENT moved. The margin
                                   escaped and acted on the parent.

/* Add any padding or border to the parent and it stops: */
#parent { padding-top: 1px }     parent top:  8   kid top: 49
                                   ^ now the margin is INSIDE, as expected.`}
      </CodeBlock>

      <InfoBox variant="success" title="Flex and grid do not collapse margins at all">
        <p>
          Measured: the same 20px + 30px siblings inside{' '}
          <code>display: flex; flex-direction: column</code> produced a{' '}
          <strong>50px</strong> gap — the real sum.
        </p>
        <p style={{ marginBottom: 0 }}>
          This is one of the quiet reasons modern layout is less surprising: margin
          collapsing simply does not exist in flex or grid containers. Better still, use{' '}
          <code>gap</code> and stop setting margins on children entirely — it cannot
          collapse, it does not add a trailing margin to the last item, and it is one
          declaration on the parent.
        </p>
      </InfoBox>

      <h2>2. Percentage Padding Resolves Against <em>Width</em></h2>
      <CodeBlock language="text" title="Real output — padding-top as a percentage">
{`#a { width: 200px; padding-top: 50% }

rendered height: 292px

// Not 100px (50% of its own 200px width) and not 50% of any height.
// It resolved against the CONTAINING BLOCK's width — the body, which
// was 584px wide. 50% of 584 = 292.`}
      </CodeBlock>
      <p>
        <code>padding-top</code>, <code>padding-bottom</code>,{' '}
        <code>margin-top</code> and <code>margin-bottom</code> percentages all resolve
        against the containing block&apos;s <strong>width</strong>, never its height.
        That is not a quirk — it is the spec, and it exists so that a percentage box
        cannot depend on a height that depends on the box.
      </p>
      <InfoBox variant="tip" title="It used to be the aspect-ratio hack. Now use aspect-ratio.">
        <p style={{ marginBottom: 0 }}>
          The <code>padding-top: 56.25%</code> trick for a 16:9 video box is this rule
          exploited deliberately. You no longer need it:{' '}
          <code>aspect-ratio: 16 / 9</code> says what you mean, and{' '}
          <code>width</code>/<code>height</code> attributes on an{' '}
          <code>&lt;img&gt;</code> give you one for free.
        </p>
      </InfoBox>

      <h2>3. <code>z-index</code> Does Nothing on a Static Element</h2>
      <CodeBlock language="text" title="Real output — two overlapping boxes">
{`#a { z-index: 999; background: red }       <- static (the default)
#b { background: blue; margin-top: -25px }

getComputedStyle(a).zIndex                 -> "999"
elementFromPoint() in the overlap          -> "b"      <- BLUE wins

/* Add one declaration: */
#a { position: relative; z-index: 999 }
elementFromPoint() in the overlap          -> "a"      <- now red wins`}
      </CodeBlock>
      <p>
        <code>z-index</code> applies only to <strong>positioned</strong> elements
        (anything other than <code>position: static</code>) and to flex/grid items. On a
        static element it computes, it shows in DevTools, and it is ignored — which is
        exactly why it is so confusing. If a <code>z-index</code> is having no effect,
        check <code>position</code> first.
      </p>

      <h2>4. <code>transform</code> Creates a Containing Block</h2>
      <p>
        This is the one that produces the &quot;my fixed modal is trapped inside a
        card&quot; bug, and nothing about the symptom points at the cause.
      </p>
      <CodeBlock language="text" title="Real output — a position:fixed child">
{`#parent { margin: 50px }                     kid top: 0    <- escaped to
#kid    { position: fixed; top: 0; left: 0 }               the viewport

#parent { margin: 50px; transform: translateZ(0) }
#kid    { position: fixed; top: 0; left: 0 }  kid top: 50   <- TRAPPED
                                              kid left: 50     inside the
                                                               parent`}
      </CodeBlock>
      <InfoBox variant="danger" title="Which properties do this">
        <p>
          Any of these on an ancestor makes it the containing block for{' '}
          <code>position: fixed</code> descendants, and most of them also create a new{' '}
          <strong>stacking context</strong> (so your <code>z-index: 9999</code> is now
          only competing inside that subtree):
        </p>
        <CodeBlock language="css" title="The usual suspects">
{`transform: anything (even translateZ(0))
filter: anything (even none → no, but blur/drop-shadow yes)
backdrop-filter
perspective
will-change: transform
contain: paint  /  contain: layout
opacity: < 1                 /* stacking context only, not containing block */
position: sticky             /* stacking context */
isolation: isolate           /* stacking context, on purpose */`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Note <code>will-change: transform</code> in that list — a performance hint
          people add casually, which silently changes layout semantics for every fixed
          descendant. The real fix for trapped overlays is not to fight it: render into
          the <strong>top layer</strong> with <code>&lt;dialog&gt;</code> or the popover
          API (<a href="/html/interactive">Native Interactive Elements</a>), or portal
          out of the subtree (<a href="/react18/portals">Portals, In Depth</a>).
        </p>
      </InfoBox>

      <h2>5. <code>position: sticky</code> — The Real Failure Cases</h2>
      <p>
        &quot;An ancestor with <code>overflow: hidden</code> breaks sticky&quot; is the
        usual explanation. It is not quite right, and testing it shows why.
      </p>
      <CodeBlock language="text" title="Real output — page scrolled to 250px; a working sticky reports viewport top 0">
{`control: plain ancestors                        top 0     works

ancestor has overflow:hidden,
  and the PAGE is the scroller                  top -250  BROKEN
  // it scrolled away completely

the sticky element's PARENT is shorter
  than the scroll range                         top -188  BROKEN
  // sticky only works WITHIN its parent's box

ancestor is a flex column                       top 0     works fine`}
      </CodeBlock>
      <InfoBox variant="warning" title="The accurate version of the rule">
        <p>
          A sticky element sticks relative to its <strong>nearest scrolling
          ancestor</strong>, and only <strong>within its own parent&apos;s box</strong>.
          So the two real failures are:
        </p>
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>An intermediate ancestor clips</strong> (<code>overflow: hidden</code>{' '}
            on something between the element and the real scroller). The element now
            sticks relative to that box, which is not scrolling — so it just scrolls away.
            Note: if the <code>overflow: hidden</code> element <em>is</em> the scroller,
            sticky works fine. That is why the folklore version is unreliable.
          </li>
          <li>
            <strong>The parent is too short.</strong> Sticky cannot escape its parent, so
            a header inside an 80px wrapper un-sticks after 80px. The fix is usually that
            the sticky element&apos;s parent should be the long scrolling section itself.
          </li>
        </ul>
      </InfoBox>

      <h2>6. The Inline-Block Whitespace Gap</h2>
      <CodeBlock language="text" title="Real output — two inline-blocks">
{`<span id=a>a</span>
<span id=b>b</span>        gap between them: 4px

<span id=a>a</span><span id=b>b</span>   gap: 0px`}
      </CodeBlock>
      <p>
        The 4px is a <strong>space character</strong> — the newline in your source is
        whitespace, and inline-level elements honour it (see{' '}
        <a href="/html/parser">How the Browser Parses &amp; Repairs HTML</a>). The classic
        hacks were negative margins or <code>font-size: 0</code> on the parent. Use{' '}
        <code>display: flex</code> with <code>gap</code> instead and the problem does not
        exist.
      </p>

      <h2>7. Shorthands Reset What You Did Not Mention</h2>
      <CodeBlock language="css" title="The silent-reset trap">
{`/* This sets background-image to none, background-position to 0% 0%,
   background-size to auto, background-repeat to repeat… all of it. */
.card { background: red; }

/* Same for these — each resets every longhand it covers: */
font: 16px/1.5 sans-serif;   /* wipes font-weight, font-style, variant */
all: unset;
grid-area / flex / transition / animation / border

/* So ORDER matters more than it looks: */
.card { background-image: url(x.png); background: red; }   /* image GONE */
.card { background: red; background-image: url(x.png); }   /* correct */`}
      </CodeBlock>
      <InfoBox variant="tip" title="flex: 1 is three properties">
        <p style={{ marginBottom: 0 }}>
          <code>flex: 1</code> expands to{' '}
          <code>flex-grow: 1; flex-shrink: 1; flex-basis: 0%</code>. That{' '}
          <code>flex-basis: 0%</code> is the part people do not expect — it means the
          item&apos;s own content width is ignored as a starting point, which is usually
          what you want for equal columns and <em>not</em> what you want when you expected{' '}
          <code>flex-grow: 1</code> alone. If items are sizing oddly, write the three
          longhands out and see which one you actually meant.
        </p>
      </InfoBox>

      <h2>8. A Few More, Briefly</h2>
      <CodeBlock language="text" title="Caveats worth recognising on sight">
{`box-sizing            The default is content-box, so width:200px +
                      padding:20px renders 240px. Every reset starts with
                      *{box-sizing:border-box} for this reason.

em vs rem             em is relative to the ELEMENT's font-size, so it
                      COMPOUNDS through nesting. rem is relative to the
                      root and does not. Use rem for sizing, em for things
                      that should scale with their own text (padding on a
                      button).

line-height unitless  line-height: 1.5 is inherited as a RATIO;
                      line-height: 150% is inherited as a COMPUTED PX
                      value, so children of a different font-size inherit
                      the wrong leading. Always use the unitless form.

100vh on mobile       includes the browser chrome that hides on scroll,
                      so a 100vh panel is taller than the visible area.
                      Use 100dvh (dynamic) or 100svh (small).

:hover on touch       sticks after a tap on many touch devices. Guard with
                      @media (hover: hover) { … }.

outline vs border     outline does NOT take up space and does not affect
                      layout. Never remove a focus outline without
                      replacing it — see the Accessibility section.

overflow: hidden      is not only clipping: it creates a scroll container,
                      zeroes a flex item's automatic minimum size, and
                      blocks sticky positioning for descendants. One
                      declaration, four effects.

gap                   works in flex, grid AND multi-column now. It
                      replaced nearly every use of margins between
                      children.`}
      </CodeBlock>

      <InfoBox variant="note" title="Where to go when you cannot find the source of a value">
        <p style={{ marginBottom: 0 }}>
          Everything above is about <em>behaviour</em>. The other half of CSS debugging is{' '}
          <em>provenance</em>: a colour or size is being applied and you cannot find the
          rule responsible. That is a DevTools workflow, and it has its own lesson —{' '}
          <a href="/devtools/css">Debugging CSS: Tracing a Computed Value</a>.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
