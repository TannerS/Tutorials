import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function HtmlInteractive() {
  return (
    <LessonLayout
      title="Native Interactive Elements"
      sectionId="html"
      lessonIndex={3}
      prev={{ path: '/html/forms', label: 'Forms, Inputs & Native Validation' }}
      next={{ path: '/html/media', label: 'Images, Media & Responsive Assets' }}
    >
      <p>
        Modals, dropdowns, accordions and tooltips are the four components every React
        codebase reimplements, usually badly — focus escapes, Escape does nothing, the
        thing renders behind something else. The platform now ships all four, and the
        native versions get the hard parts right.
      </p>
      <p>
        This lesson is short on purpose: the point is knowing these exist before you
        reach for a library. Everything below was run in Chromium 149.
      </p>

      <h2><code>&lt;dialog&gt;</code> — Modals Without the Focus Bugs</h2>
      <p>
        The two methods are not interchangeable, and the difference is the whole value of
        the element.
      </p>

      <CodeBlock language="html" title="dialog.html">
{`<dialog id="confirm">
  <form method="dialog">
    <h2>Delete invoice?</h2>
    <p>This cannot be undone.</p>
    <button value="cancel">Cancel</button>
    <button value="confirmed">Delete</button>
  </form>
</dialog>

<script>
  const d = document.getElementById('confirm');
  d.showModal();                       // modal: top layer, backdrop, focus trap
  d.addEventListener('close', () => {
    console.log(d.returnValue);        // "confirmed" or "cancel"
  });
</script>`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Chromium 149">
{`d.show()       -> d.matches(':modal') === false   (inert page behind? no)
d.showModal()  -> d.matches(':modal') === true
                  document.activeElement === the first focusable child
                  (focus moves INTO the dialog automatically)

// A <button value="confirmed"> inside <form method="dialog">:
click -> events fired: ["close"]
         d.returnValue === "confirmed"
         d.open === false

// Escape key on a modal dialog:
press Escape -> d.open === false   (closes, no JS required)`}
      </CodeBlock>

      <p>What you get without writing any of it:</p>
      <ul>
        <li>
          <strong>Top layer.</strong> A modal dialog paints above everything regardless of{' '}
          <code>z-index</code> or which overflow container it sits in — the single hardest
          problem in a hand-rolled modal.
        </li>
        <li>
          <strong>Focus moves in, and is trapped.</strong> Tab cycles inside the dialog;
          the rest of the page is inert.
        </li>
        <li>
          <strong>Escape closes it</strong> and fires <code>cancel</code> then{' '}
          <code>close</code>.
        </li>
        <li>
          <strong><code>::backdrop</code></strong> styles the dim layer, and{' '}
          <code>form method="dialog"</code> closes the dialog on submit while passing the
          clicked button&apos;s <code>value</code> through <code>returnValue</code>.
        </li>
      </ul>

      <InfoBox variant="warning" title="Two things dialog does not do">
        <p>
          <strong>Clicking the backdrop does not close it.</strong> There is no option for
          that; you add a click handler and compare the event target to the dialog itself.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong><code>show()</code> is not a modal.</strong> It opens the dialog in the
          normal flow with no backdrop, no focus trap, and no Escape handling — useful for
          a non-blocking panel, wrong for a confirmation. If you meant a modal, call{' '}
          <code>showModal()</code>. Verified above: only <code>showModal()</code> matches{' '}
          <code>:modal</code>.
        </p>
      </InfoBox>

      <h2><code>&lt;details&gt;</code> — Accordions, Including Exclusive Ones</h2>
      <CodeBlock language="html" title="The whole accordion, no JavaScript">
{`<details>
  <summary>Shipping options</summary>
  <p>Standard, express, or pickup.</p>
</details>

<!-- Give several the SAME name and they become mutually exclusive:
     opening one closes the others, like radio buttons. -->
<details name="faq"><summary>Is it free?</summary><p>Yes.</p></details>
<details name="faq"><summary>Can I cancel?</summary><p>Any time.</p></details>
<details name="faq"><summary>Where is my data?</summary><p>EU.</p></details>`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the exclusive-accordion behaviour, measured">
{`// two <details name="faq">, opening both in sequence:
a.open = true;   b.open = true;
  -> a.open === false
     b.open === true
// Opening the second CLOSED the first. 'name' grouping works —
// no JavaScript, no state, no library.`}
      </CodeBlock>

      <InfoBox variant="tip" title="What you give up, and when it matters">
        <p>
          <code>&lt;details&gt;</code> cannot animate its own open/close height the way a
          hand-built accordion can (though <code>::details-content</code> and{' '}
          <code>interpolate-size</code> are closing that gap). It is also searchable: in
          Chromium, browser find-in-page can open a closed{' '}
          <code>&lt;details&gt;</code> to reveal a match — which is a genuine
          accessibility win a <code>div</code> accordion will never have.
        </p>
      </InfoBox>

      <h2>The Popover API — Dropdowns and Tooltips</h2>
      <p>
        Newer than <code>dialog</code> and aimed at the non-modal case: menus, tooltips,
        comboboxes. The attribute wiring means the common case needs no JavaScript.
      </p>

      <CodeBlock language="html" title="popover.html">
{`<!-- popovertarget wires the button to the popover. No JS. -->
<button popovertarget="menu">Options</button>

<div id="menu" popover>
  <button>Rename</button>
  <button>Duplicate</button>
</div>

<!-- popover="auto"   (the default) one at a time; Escape closes;
                      clicking outside closes it — "light dismiss"
     popover="manual" stays until you close it explicitly -->`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Chromium 149">
{`'popover' in div          -> true
div.popover               -> "auto"        (the default)
div.showPopover()         -> div.matches(':popover-open') === true`}
      </CodeBlock>

      <InfoBox variant="note" title="dialog or popover?">
        <p>
          <strong>Modal and blocking</strong> — a confirmation, a form the user must deal
          with: <code>&lt;dialog&gt;</code> + <code>showModal()</code>.{' '}
          <strong>Non-modal and dismissible</strong> — a menu, a tooltip, a date picker
          panel: <code>popover</code>. Both use the top layer, so neither has the{' '}
          <code>z-index</code> and <code>overflow: hidden</code> problems that make
          hand-built versions fragile.
        </p>
      </InfoBox>

      <h2>The Small Ones Worth Knowing</h2>
      <CodeBlock language="html" title="Four elements that replace a surprising amount of code">
{`<!-- datalist: free-text input WITH suggestions. Not a <select> —
     the user may type anything; the list is only a hint. -->
<input list="cities" name="city" />
<datalist id="cities">
  <option value="Berlin"></option>
  <option value="Lisbon"></option>
</datalist>

<!-- progress: a task advancing. Indeterminate if you omit value. -->
<progress value="0.5"></progress>   <!-- .position === 0.5 -->
<progress></progress>               <!-- the "working…" barber pole -->

<!-- meter: a measurement inside a known range. NOT a progress bar —
     browsers colour it by which band the value falls in. -->
<meter value="0.5" low="0.2" high="0.8" optimum="1">50%</meter>

<!-- output: a computed result, announced to screen readers when it changes -->
<output name="total" for="qty price">£0.00</output>`}
      </CodeBlock>

      <InfoBox variant="tip" title="progress vs meter, in one line">
        <p>
          <code>&lt;progress&gt;</code> is &quot;how far through a task am I&quot;
          (upload, install). <code>&lt;meter&gt;</code> is &quot;where does this value
          sit in its range&quot; (disk usage, a score, a rating). Using{' '}
          <code>&lt;meter&gt;</code> for a loading bar is the common mix-up — it will
          render, and it will tell a screen reader the wrong thing.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
