import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function CssSizing() {
  return (
    <LessonLayout
      title="Why Is This Element That Size?"
      sectionId="css-mastery"
      lessonIndex={3}
      prev={{ path: '/css-mastery/grid', label: 'CSS Grid Complete Guide' }}
      next={{ path: '/css-mastery/gotchas', label: 'CSS Gotchas: Collapse, Stacking & Containing Blocks' }}
    >
      <p>
        Three questions account for most time lost in a browser&apos;s Elements panel:{' '}
        <em>why does this child fill its parent?</em>,{' '}
        <em>why doesn&apos;t it?</em>, and{' '}
        <em>why is this content stretching the container instead of being clipped?</em>{' '}
        All three have precise answers, and none of them are obvious.
      </p>
      <p>
        Every number on this page was measured in Chromium 149 at a 600×400 viewport,
        in standards mode.
      </p>

      <h2>Width: The Default Is Not One Rule</h2>
      <p>
        <code>width: auto</code> means completely different things depending on the
        element&apos;s <strong>display type</strong> and its parent&apos;s layout mode.
        That is the root of the confusion.
      </p>

      <CodeBlock language="text" title="Real output — a child with width:auto inside a 300px parent">
{`parent: width 300px            child rendered width
─────────────────────────────  ───────────────────────
display:block child                   300    <- FILLS it
display:inline-block child              8    <- SHRINKS to content
flex child (width:auto)                 8    <- SHRINKS to content
flex child with flex:1                300    <- fills
grid child in 1fr column              300    <- fills`}
      </CodeBlock>

      <InfoBox variant="tip" title="The one-sentence version">
        <p style={{ marginBottom: 0 }}>
          A <strong>block</strong> child fills its parent&apos;s width by default. An{' '}
          <strong>inline-block or flex</strong> child shrink-wraps its content by default.
          So &quot;my div stopped filling the width&quot; almost always means a parent
          became <code>display: flex</code>.
        </p>
      </InfoBox>

      <h2>Height: Nothing Fills by Default</h2>
      <p>
        Height is the asymmetry that catches everyone. Width has a natural answer — the
        parent is as wide as the viewport, eventually. Height does not: the page is as
        tall as its content, so there is nothing to take a percentage <em>of</em>.
      </p>

      <CodeBlock language="text" title="Real output — a child inside a 200px-tall parent">
{`child CSS                              rendered height
─────────────────────────────────────  ───────────────
height:auto                                  18   <- content only
height:100%, parent height 200px            200   <- works
height:100%, parent height AUTO              18   <- SILENTLY IGNORED
flex child, align-items default (stretch)   200   <- works, for free
flex child, align-items:flex-start           18`}
      </CodeBlock>

      <InfoBox variant="danger" title="height: 100% needs a parent with a DEFINITE height">
        <p>
          A percentage height resolves against the parent&apos;s height. If the parent is{' '}
          <code>height: auto</code> — which is the default — there is no number to take a
          percentage of, so the declaration is <strong>dropped</strong>. No error, no
          warning: measured above, the child rendered at 18px (its content height) rather
          than filling anything.
        </p>
        <p style={{ marginBottom: 0 }}>
          This is why the old advice was{' '}
          <code>html, body, #root &#123; height: 100% &#125;</code> — you had to chain a
          definite height all the way down from the viewport. Two modern fixes are better:
          use <code>100dvh</code> on the outermost element (dynamic viewport height, which
          handles mobile browser chrome correctly), or make the parent a{' '}
          <strong>flex container</strong> — a flex child stretches to the cross-axis size
          for free, with no percentage involved.
        </p>
      </InfoBox>

      <FlowChart
        title="Debugging &quot;my element is the wrong height&quot;"
        chart={"graph TD\n  A[\"height looks wrong\"] --> B{\"did you set a % height?\"}\n  B -->|yes| C{\"does the PARENT have a\\ndefinite height?\"}\n  C -->|no| D[\"the % is dropped.\\nUse flex, or 100dvh,\\nor give the parent a height\"]\n  C -->|yes| E[\"check box-sizing and\\npadding/border\"]\n  B -->|no| F{\"is the parent flex or grid?\"}\n  F -->|flex| G[\"align-items:stretch is the\\nDEFAULT — something changed it\"]\n  F -->|grid| H[\"the row track sizing decides it.\\nCheck align-items and the\\ngrid-template-rows value\"]\n  F -->|no| I[\"height:auto = content height.\\nThat IS the answer.\"]\n  style D fill:#3b1a1a,stroke:#f87171\n  style G fill:#1a3329,stroke:#4ade80"}
      />

      <h2>The Big One: Content Stretching Its Container</h2>
      <p>
        This is the bug that looks like CSS is broken. You set a width, you add{' '}
        <code>overflow: hidden</code> or <code>text-overflow: ellipsis</code>, and the
        element <em>still</em> blows past its container and adds a horizontal scrollbar.
      </p>
      <p>
        The cause is a rule almost nobody is taught:{' '}
        <strong>flex and grid items have an automatic minimum size</strong>. Their{' '}
        <code>min-width</code> computes to <code>auto</code>, which resolves to{' '}
        <em>the size of their content</em> — and a minimum beats a maximum. So the item
        refuses to shrink below its longest unbreakable word, no matter what you set.
      </p>

      <CodeBlock language="text" title="Real output — one long unbreakable word in a 300px flex container">
{`#wrap { width: 300px; display: flex }
#item { flex: 1; white-space: nowrap }

                                    container  item   overflow?
no min-width, no overflow                 300   471   YES — 171px over
+ min-width: 0                            300   300   fixed
+ overflow: hidden (instead)               300   300   also fixed`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same trap in Grid">
{`#wrap { display: grid; grid-template-columns: 1fr 1fr; width: 300px }

                                    container  item   scrollWidth
1fr 1fr, no overflow                      300   471   479  <- overflows
minmax(0, 1fr)                            300   150   300  <- correct`}
      </CodeBlock>

      <InfoBox variant="success" title="The two fixes, and why each works">
        <p>
          <strong><code>min-width: 0</code></strong> on the flex item (or{' '}
          <code>min-height: 0</code> in a column) overrides the automatic minimum
          explicitly. This is the direct fix and the one to reach for.
        </p>
        <p>
          <strong><code>overflow: hidden</code></strong> (or <code>auto</code>, or{' '}
          <code>scroll</code>) <em>also</em> fixes it — and this surprises people.
          Anything other than <code>overflow: visible</code> zeroes the automatic minimum
          size, because an element that can clip its own content no longer needs to be as
          large as that content. Measured above: it dropped the item from 471px to 300px
          on its own.
        </p>
        <p style={{ marginBottom: 0 }}>
          In Grid, use <strong><code>minmax(0, 1fr)</code></strong> instead of{' '}
          <code>1fr</code>. A bare <code>1fr</code> is shorthand for{' '}
          <code>minmax(auto, 1fr)</code> — that <code>auto</code> is the same content
          floor. Writing <code>minmax(0, 1fr)</code> everywhere is a reasonable default
          habit for grid columns holding text.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="The ellipsis recipe that actually works">
        <p>
          Truncating text inside a flex or grid layout needs <em>all</em> of these, and
          the <code>min-width: 0</code> is the one everyone forgets:
        </p>
        <CodeBlock language="css" title="Truncation inside a flex row">
{`.row   { display: flex; }

.label {
  flex: 1;
  min-width: 0;          /* <- without this, the rest does nothing */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}`}
        </CodeBlock>
      </InfoBox>

      <h2>Blocks Overflow Instead — They Do Not Stretch</h2>
      <p>
        A plain block container behaves differently, and knowing the difference tells you
        which kind of bug you have:
      </p>
      <CodeBlock language="text" title="Real output — the same long word in a plain 300px block">
{`#blk { width: 300px }

rendered width   300    <- the BOX stayed put
scrollWidth      452    <- the CONTENT is wider
overflows        true   <- it spills out visibly`}
      </CodeBlock>
      <p>
        So: in a <strong>block</strong> layout, long content <em>overflows</em> its box.
        In <strong>flex or grid</strong>, long content <em>expands</em> the box. Same
        input, two different failures, and the diagnosis is different. If the container
        itself got wider, you are looking at a minimum-size problem; if the container
        stayed put and content spilled, you want{' '}
        <code>overflow-wrap: anywhere</code> or <code>hyphens: auto</code>.
      </p>

      <h2>Intrinsic Sizing Keywords</h2>
      <CodeBlock language="css" title="The vocabulary for &quot;size to the content&quot;">
{`width: min-content;   /* as narrow as possible — wraps at every
                         opportunity. Width of the LONGEST WORD. */
width: max-content;   /* as wide as the content wants — NO wrapping.
                         This is what the automatic minimum uses. */
width: fit-content;   /* max-content, but capped by the available space.
                         The shrink-wrap you usually want. */

width: fit-content(300px);   /* the same, with an explicit cap */

/* And the companion that stops text lines being too long: */
max-width: 65ch;      /* ch = width of the "0" glyph. ~65 characters,
                         which is the readable line-length range. */`}
      </CodeBlock>

      <h2>Finding It in DevTools</h2>
      <p>
        The panel workflow for all of the above, in the order that answers the question
        fastest:
      </p>
      <ol>
        <li>
          Select the element. Read the <strong>box model diagram</strong> at the bottom of
          Styles — is the extra space padding, margin, or border?
        </li>
        <li>
          Open <strong>Computed</strong> and look at the resolved{' '}
          <code>width</code>/<code>height</code>. Then look at{' '}
          <code>min-width</code>: if it says <code>auto</code> and the element is a flex
          or grid item, you have found the stretching bug.
        </li>
        <li>
          Look at the <strong>parent&apos;s</strong> <code>display</code>. Block, flex and
          grid give three different default answers, per the tables above.
        </li>
        <li>
          Check for a <strong><code>scroll</code> badge</strong> in the Elements tree. An
          unexpected scroll container explains clipped dropdowns and a scrollbar you
          cannot find the source of.
        </li>
        <li>
          Toggle declarations off one at a time with the checkbox in Styles. It is crude
          and it is the fastest way to find which declaration is responsible.
        </li>
      </ol>

      <InfoBox variant="note" title="Next: tracing a value back to the rule that set it">
        <p style={{ marginBottom: 0 }}>
          When the Computed tab shows you a value you did not write, the next question is{' '}
          <em>where did that come from?</em> — inherited, a user-agent default, a utility
          class, a token. That workflow has its own lesson:{' '}
          <a href="/devtools/css">Debugging CSS: Tracing a Computed Value</a>.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
