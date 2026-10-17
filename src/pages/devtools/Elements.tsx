import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function DevtoolsElements() {
  return (
    <LessonLayout
      title="Elements: Inspecting the Live DOM"
      sectionId="devtools"
      lessonIndex={0}
      prev={null}
      next={{ path: '/devtools/console', label: 'Console: Beyond console.log' }}
    >
      <p>
        Most developers use maybe a fifth of the Elements panel — inspect, read a colour,
        close it. The other four-fifths is where CSS debugging actually happens, and
        learning it is the difference between &quot;add <code>!important</code> and
        hope&quot; and knowing exactly which rule won and why.
      </p>
      <p>
        This section describes Chrome/Edge DevTools (Chromium 149). Firefox and Safari
        have equivalents for nearly everything; the names differ.
      </p>

      <h2>Getting In</h2>
      <CodeBlock language="text" title="The shortcuts worth having in your fingers">
{`F12                      open/close DevTools
Cmd+Opt+I   / Ctrl+Shift+I    same
Cmd+Opt+C   / Ctrl+Shift+C    INSPECT MODE — click an element to select it
Cmd+Opt+J   / Ctrl+Shift+J    jump straight to the Console
Cmd+Shift+P / Ctrl+Shift+P    the COMMAND MENU — see below
Cmd+F       / Ctrl+F          search the DOM tree (accepts CSS selectors)`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Command Menu is the one shortcut to actually memorise">
        <p>
          <code>Cmd+Shift+P</code> inside DevTools opens a fuzzy-search palette over
          every DevTools feature. Type <code>screenshot</code> to capture a single node,{' '}
          <code>coverage</code> to find unused CSS, <code>rendering</code> to open the
          paint-flashing tools, <code>disable javascript</code> to check progressive
          enhancement. It means you never have to remember where a panel lives.
        </p>
      </InfoBox>

      <h2>The DOM Tree Is the Repaired Tree</h2>
      <p>
        This matters more than it sounds. The Elements panel shows the DOM the browser{' '}
        <em>built</em> — after the parser repaired your markup. &quot;View Source&quot;
        shows the bytes you sent. When those two disagree, the parser rewrote something,
        and the <a href="/html/parser">parser lesson</a> catalogues how.
      </p>
      <p>Useful things you can do in the tree itself:</p>
      <ul>
        <li>
          <strong>Edit anything live</strong> — double-click a tag name, attribute or text
          node. <code>F2</code> switches to raw HTML editing for a whole subtree, so you
          can paste in markup.
        </li>
        <li>
          <strong>Drag nodes</strong> to reorder them, and <code>Delete</code> to remove
          one. Great for &quot;is this element causing the overflow?&quot;.
        </li>
        <li>
          <strong>Right-click → Force state</strong> — pin <code>:hover</code>,{' '}
          <code>:active</code>, <code>:focus</code>, <code>:focus-visible</code> or{' '}
          <code>:target</code> on. The only sane way to style a hover state you cannot
          hold still, or debug a focus ring.
        </li>
        <li>
          <strong>Right-click → Break on</strong> — a DOM breakpoint. Covered in{' '}
          <a href="/devtools/breakpoints">the breakpoints lesson</a>; it is how you find
          out which script is mutating an element.
        </li>
        <li>
          <strong>Right-click → Copy → Copy JS path</strong> gives you a{' '}
          <code>document.querySelector(...)</code> string for the node, which is how you
          get a selector into the Console without typing it.
        </li>
      </ul>

      <h2>The Styles Pane: Reading the Cascade</h2>
      <p>
        The right-hand Styles pane lists every rule matching the selected element,{' '}
        <strong>in cascade order — the winner at the top</strong>. Learning to read it is
        the whole skill.
      </p>

      <CodeBlock language="text" title="What the visual cues mean">
{`color: red;              normal — this declaration is applied
color: blue;             STRUCK THROUGH — overridden by something above it
                         (hover it: DevTools often says WHY)

element.style { }        inline styles. Beats everything except !important.
                         React's style prop lands here.

.card  styles.css:42     click the file:line to jump to the source

(index)                  the rule came from a <style> tag in the document

user agent stylesheet    the BROWSER's own default. If you are fighting
                         a margin you never wrote, it is probably here.

Inherited from <body>    inherited properties, shown in a separate block`}
      </CodeBlock>

      <InfoBox variant="tip" title="Computed is the tab that answers &quot;what is it actually?&quot;">
        <p>
          The <strong>Computed</strong> tab gives the single resolved value for every
          property, after the cascade, inheritance, and unit resolution. Expand a property
          and it shows the full list of rules that tried to set it, winner first, each one
          linking to its source.
        </p>
        <p style={{ marginBottom: 0 }}>
          This is where to go when Styles has three struck-through declarations and you
          still cannot tell what won. Tick <strong>Show all</strong> to include every
          property at its default — useful for finding an inherited value you did not
          expect.
        </p>
      </InfoBox>

      <h2>The Box Model Diagram</h2>
      <p>
        At the bottom of Styles (or in Computed) is the box diagram: content, padding,
        border, margin, with live numbers. Hovering each ring highlights that region on
        the page in colour.
      </p>
      <p>
        It answers the two most common layout questions instantly:{' '}
        <em>is this spacing padding or margin?</em> and{' '}
        <em>is the element the size I think it is?</em> A dash instead of a number means
        the value is <code>auto</code> or not applicable.
      </p>

      <h2>The Overlays That Make Layout Debuggable</h2>
      <CodeBlock language="text" title="Badges next to elements in the tree">
{`grid     click it -> overlay showing every grid line, with NUMBERS and
                     named areas. Stop counting tracks by hand.
flex     click it -> overlay showing the main/cross axis and gaps
scroll   this element is a scroll container (often a surprise)
slot     a web component slot
ad       detected as an ad frame

// The Layout pane (next to Styles) lists every grid and flex container
// on the page with persistent checkboxes, so you can leave overlays on.`}
      </CodeBlock>

      <InfoBox variant="warning" title="The scroll badge is the one that solves bugs">
        <p>
          A <code>scroll</code> badge on an element you did not intend to be scrollable
          explains a whole category of problems: a nested scrollbar, a sticky element that
          sticks to the wrong thing (<code>position: sticky</code> resolves against the
          nearest scroll container, not the viewport), or an{' '}
          <code>overflow: hidden</code> that is clipping your dropdown. If a popover is
          being cut off, look for this badge on its ancestors — or use the top layer,
          per <a href="/html/interactive">Native Interactive Elements</a>.
        </p>
      </InfoBox>

      <h2>Accessibility, From the Same Panel</h2>
      <p>
        With an element selected, the <strong>Accessibility</strong> pane shows its
        computed role, its accessible name <em>and where the name came from</em>, and its
        position in the accessibility tree. That last part is the useful bit: it is the
        tree a screen reader navigates, which is not the same shape as the DOM.
      </p>
      <p>
        It is also the fastest way to check the name-computation rules from{' '}
        <a href="/accessibility/aria">ARIA Roles &amp; Attributes</a> —{' '}
        <code>aria-labelledby</code> beating <code>aria-label</code> beating text
        content — without writing a test.
      </p>

      <InfoBox variant="tip" title="Three more things hiding in this panel">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>The colour picker</strong> on any colour swatch has an eyedropper and
            a live contrast-ratio readout against the computed background, with
            pass/fail for AA and AAA. Fix contrast here, not in a separate tool.
          </li>
          <li>
            <strong>Rendering</strong> (Command Menu →{' '}
            <code>Show Rendering</code>) has <em>Paint flashing</em> to see what repaints,{' '}
            <em>Emulate CSS prefers-color-scheme</em> to test dark mode, and{' '}
            <em>Emulate vision deficiencies</em>.
          </li>
          <li>
            <strong><code>$0</code></strong> in the Console is the element currently
            selected here — the bridge between the two panels, and the subject of the next
            lesson.
          </li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
