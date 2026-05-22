import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function A11yAria() {
  return (
    <LessonLayout title="ARIA Attributes" sectionId="accessibility" lessonIndex={2} prev={{ path: "/accessibility/semantic", label: "Semantic HTML" }} next={{ path: "/accessibility/keyboard", label: "Keyboard Navigation" }}>
      <p>ARIA (Accessible Rich Internet Applications) attributes communicate component state and roles to assistive technology when semantic HTML alone is insufficient — primarily for dynamic widgets like modals, tabs, and comboboxes.</p>
      <CodeBlock language="jsx" title="Essential ARIA Patterns">
{`// === ARIA ROLES ===
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Delete</h2>
  <p>Are you sure you want to delete this item?</p>
  <button>Cancel</button>
  <button>Delete</button>
</div>

// === ARIA STATES ===
<button
  aria-expanded={isOpen}        // true/false — is menu open?
  aria-controls="dropdown-menu" // which element does this control?
  aria-haspopup="listbox"       // announces it opens a popup
  onClick={toggle}
>
  Options ▼
</button>
<ul id="dropdown-menu" role="listbox" hidden={!isOpen}>
  <li role="option" aria-selected="true">Option A</li>
  <li role="option" aria-selected="false">Option B</li>
</ul>

// === ARIA LABELS ===
<button aria-label="Close dialog">✕</button>       // labels icon-only button
<input aria-label="Search products" type="search" /> // when no visible label
<section aria-labelledby="section-heading">
  <h2 id="section-heading">Features</h2>
  ...
</section>

// === LIVE REGIONS (dynamic content) ===
<div aria-live="polite">   // announces when content changes
  {loading ? "Loading..." : "3 results found"}
</div>
<div aria-live="assertive" role="alert">  // interrupts immediately (errors)
  {error && "Error: " + error.message}
</div>
<div aria-live="off">      // changes not announced (default)

// === RULE: First rule of ARIA ===
// Don't use ARIA if you can use semantic HTML instead
// <button> is better than <div role="button">
// <input type="checkbox"> is better than <div role="checkbox">`}
      </CodeBlock>
      <InteractiveChallenge
        question="What is the first rule of ARIA?"
        options={["Always add ARIA roles to interactive elements", "Don't use ARIA if a semantic HTML element achieves the same result", "Use aria-label on every element", "ARIA roles override HTML semantics"]}
        correctIndex={1}
        explanation="The first rule of ARIA: If you can use a native HTML element with the semantics and behavior you need, use it instead of adding ARIA. <button> already has role=button, keyboard handling, and focus management built in. Adding role='button' to a div still requires you to add tabIndex, keyboard handlers, and more."
      />

    </LessonLayout>
  );
}
