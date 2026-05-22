import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Aria() {
  return (
    <LessonLayout
      title="ARIA Roles & Attributes"
      sectionId="accessibility"
      lessonIndex={2}
      prev={{ path: '/accessibility/semantic', label: 'Semantic HTML & Landmarks' }}
      next={{ path: '/accessibility/keyboard', label: 'Keyboard Navigation & Focus' }}
    >
      <p>
        ARIA (Accessible Rich Internet Applications) is a set of HTML attributes that modify how
        elements are exposed in the accessibility tree. It bridges the gap between complex web UIs
        and assistive technologies — but it's a double-edged sword. Misused ARIA is worse than no
        ARIA at all.
      </p>

      <InfoBox variant="danger" title="The First Rule of ARIA">
        <strong>Do not use ARIA if you can use a native HTML element or attribute with the semantics
        and behavior you need.</strong> Native HTML has built-in keyboard support, focus management,
        and a11y tree mapping. ARIA only changes what assistive tech sees — it does NOT add behavior.
        A <code>div role="button"</code> is not focusable or keyboard-activatable unless you add all
        that yourself.
      </InfoBox>

      {/* ── Five Rules of ARIA ────────────────────────────── */}
      <h2>The Five Rules of ARIA</h2>

      <FlowChart
        title="The Five Rules of ARIA"
        chart={"graph TD\n  R1[Rule 1: Prefer native HTML] --> R2[Rule 2: Do not change native semantics]\n  R2 --> R3[Rule 3: All interactive ARIA elements must be keyboard operable]\n  R3 --> R4[Rule 4: Do not use role=presentation or aria-hidden on focusable elements]\n  R4 --> R5[Rule 5: All interactive elements must have an accessible name]"}
      />

      <CodeBlock language="html" title="The Five Rules Illustrated">
{`<!-- Rule 1: Prefer native HTML -->
<!-- ❌ --> <div role="button" tabindex="0">Save</div>
<!-- ✅ --> <button>Save</button>

<!-- Rule 2: Do not change native semantics unnecessarily -->
<!-- ❌ --> <h2 role="tab">Section Title</h2>
<!-- ✅ --> <div role="tab"><h2>Section Title</h2></div>

<!-- Rule 3: Interactive ARIA must be keyboard operable -->
<!-- ❌ --> <div role="button">Click me</div>  <!-- no tabindex, no keydown -->
<!-- ✅ --> <div role="button" tabindex="0"
              onkeydown="if(e.key==='Enter'||e.key===' ')activate()">
              Click me</div>

<!-- Rule 4: Don't hide focusable elements -->
<!-- ❌ --> <button aria-hidden="true">Hidden but focusable!</button>
<!-- ✅ --> <button style="display:none">Properly hidden</button>

<!-- Rule 5: Interactive elements must have accessible names -->
<!-- ❌ --> <button><svg>...</svg></button>  <!-- no name! -->
<!-- ✅ --> <button aria-label="Close"><svg>...</svg></button>`}
      </CodeBlock>

      {/* ── ARIA Roles ────────────────────────────────────── */}
      <h2>ARIA Role Categories</h2>

      <FlowChart
        title="ARIA Role Categories"
        chart={"graph LR\n  ROLES[ARIA Roles] --> LM[Landmark Roles]\n  ROLES --> WG[Widget Roles]\n  ROLES --> DS[Document Structure]\n  ROLES --> LV[Live Region Roles]\n  LM --> banner & navigation & main & complementary & contentinfo & search & form & region\n  WG --> button & checkbox & dialog & tab & tabpanel & menu & menuitem & slider & switch & combobox\n  DS --> heading & list & listitem & table & row & cell & img & article\n  LV --> alert & status & log & timer & marquee"}
      />

      <p>
        <strong>Landmark roles</strong> define page structure (prefer native HTML elements).
        <strong> Widget roles</strong> describe interactive components.
        <strong> Document structure roles</strong> describe content organization.
        <strong> Live region roles</strong> announce dynamic content changes.
      </p>

      {/* ── Naming: label vs labelledby vs describedby ───── */}
      <h2>aria-label vs aria-labelledby vs aria-describedby</h2>

      <CodeBlock language="html" title="Accessible Naming Attributes">
{`<!-- aria-label — provides an invisible text label directly -->
<button aria-label="Close dialog">✕</button>
<nav aria-label="Footer links">...</nav>

<!-- aria-labelledby — references another element's text as the label -->
<h2 id="billing-title">Billing Information</h2>
<section aria-labelledby="billing-title">
  <!-- Screen reader: "Billing Information, region" -->
</section>

<!-- aria-describedby — adds supplemental description (read AFTER the label) -->
<label for="password">Password</label>
<input type="password" id="password" aria-describedby="pw-hint" />
<div id="pw-hint">Must be at least 8 characters with one number</div>
<!-- Screen reader: "Password, edit text, Must be at least 8 characters..." -->

<!-- Priority order (highest to lowest):
     1. aria-labelledby (references visible text — preferred)
     2. aria-label (invisible string — use when no visible text exists)
     3. <label> element (for form controls)
     4. title attribute (tooltip — least reliable, avoid for a11y)
-->`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer Visible Labels">
        <code>aria-labelledby</code> is usually better than <code>aria-label</code> because it
        references visible text, keeping the visual and accessible names in sync. When visible text
        exists, point to it with <code>aria-labelledby</code> rather than duplicating it in{' '}
        <code>aria-label</code>.
      </InfoBox>

      {/* ── aria-hidden ───────────────────────────────────── */}
      <h2>aria-hidden</h2>

      <CodeBlock language="html" title="aria-hidden Usage">
{`<!-- aria-hidden="true" removes an element from the a11y tree -->
<!-- Use for decorative/redundant content that would clutter screen readers -->

<!-- Decorative icon next to text — hide icon, text is enough -->
<button>
  <span aria-hidden="true">🔍</span>
  Search
</button>

<!-- Icon-only button — hide icon, provide label -->
<button aria-label="Search">
  <svg aria-hidden="true"><!-- search icon --></svg>
</button>

<!-- ⚠️ NEVER use aria-hidden on focusable elements -->
<!-- ❌ This creates a ghost element — focusable but invisible to AT -->
<button aria-hidden="true">I'm a trap!</button>

<!-- ⚠️ aria-hidden on a parent hides ALL children too -->
<div aria-hidden="true">
  <button>This button is also hidden from AT!</button>
</div>`}
      </CodeBlock>

      {/* ── Live Regions ──────────────────────────────────── */}
      <h2>aria-live — Dynamic Content Announcements</h2>
      <p>
        When content changes dynamically (toast notifications, form validation, loading states),
        screen readers won't notice unless you use a live region.
      </p>

      <CodeBlock language="html" title="aria-live Patterns">
{`<!-- polite — waits for the user to finish current task before announcing -->
<div aria-live="polite" aria-atomic="true">
  <!-- Content updates here get announced after a pause -->
  3 results found
</div>

<!-- assertive — interrupts immediately (use sparingly!) -->
<div role="alert">
  <!-- role="alert" implies aria-live="assertive" -->
  Error: Your session has expired. Please log in again.
</div>

<!-- status — polite live region for status messages -->
<div role="status">
  Saving... → Saved successfully!
</div>

<!-- Common patterns: -->
<!-- Toast notifications → role="alert" or aria-live="polite" -->
<!-- Form validation errors → role="alert" -->
<!-- Loading indicators → role="status" with aria-live="polite" -->
<!-- Search result count → aria-live="polite" -->
<!-- Chat messages → aria-live="polite" with aria-relevant="additions" -->`}
      </CodeBlock>

      <CodeBlock language="jsx" title="React Live Region Pattern">
{`function SearchResults({ results, query }) {
  return (
    <div>
      {/* Live region announces result count changes */}
      <div role="status" aria-live="polite" className="sr-only">
        {results.length} results found for "{query}"
      </div>

      <ul>
        {results.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

// sr-only CSS class — visually hidden but accessible
// .sr-only {
//   position: absolute;
//   width: 1px; height: 1px;
//   padding: 0; margin: -1px;
//   overflow: hidden;
//   clip: rect(0, 0, 0, 0);
//   white-space: nowrap;
//   border: 0;
// }`}
      </CodeBlock>

      {/* ── Disclosure Widgets ────────────────────────────── */}
      <h2>aria-expanded &amp; aria-controls</h2>

      <CodeBlock language="jsx" title="Accessible Disclosure / Accordion">
{`function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <h3>
        <button
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(!isOpen)}
        >
          {title}
          <span aria-hidden="true">{isOpen ? '▼' : '▶'}</span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={panelId + '-btn'}
        hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
}

// Screen reader flow:
// "Title, collapsed, button" → user presses Enter →
// "Title, expanded, button" → panel content is now readable`}
      </CodeBlock>

      {/* ── Accessible Modal ──────────────────────────────── */}
      <h2>Complete Accessible Modal in React</h2>

      <InfoBox variant="info" title="Modal Accessibility Requirements">
        An accessible modal must: (1) trap focus inside, (2) close on Escape, (3) return focus to
        the trigger on close, (4) have role="dialog" and aria-modal="true", (5) have an accessible
        name via aria-labelledby, and (6) hide background content from AT.
      </InfoBox>

      <CodeBlock language="jsx" title="Accessible Modal Component">
{`function Modal({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      dialogRef.current?.focus();
    } else {
      triggerRef.current?.focus(); // restore focus on close
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();

      // Focus trap — cycle Tab within modal
      if (e.key === 'Tab') {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}`}
      </CodeBlock>

      {/* ── Accessible Tabs ───────────────────────────────── */}
      <h2>Complete Accessible Tabs</h2>

      <CodeBlock language="jsx" title="Accessible Tabs with Roving Tabindex">
{`function Tabs({ tabs }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e) => {
    let newIndex = activeIndex;
    if (e.key === 'ArrowRight') newIndex = (activeIndex + 1) % tabs.length;
    if (e.key === 'ArrowLeft') newIndex = (activeIndex - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') newIndex = 0;
    if (e.key === 'End') newIndex = tabs.length - 1;

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      document.getElementById('tab-' + newIndex)?.focus();
    }
  };

  return (
    <div>
      <div role="tablist" aria-label="Content sections" onKeyDown={handleKeyDown}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            id={'tab-' + i}
            role="tab"
            aria-selected={i === activeIndex}
            aria-controls={'panel-' + i}
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => setActiveIndex(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={i}
          id={'panel-' + i}
          role="tabpanel"
          aria-labelledby={'tab-' + i}
          hidden={i !== activeIndex}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

// Keyboard pattern:
// Tab → focuses the active tab
// Arrow Left/Right → moves between tabs
// Home/End → first/last tab
// Tab again → moves into the panel content`}
      </CodeBlock>

      {/* ── Common ARIA Patterns Reference ────────────────── */}
      <h2>ARIA Patterns Quick Reference</h2>

      <CodeBlock language="html" title="Common Widget ARIA Patterns">
{`<!-- Tooltip -->
<button aria-describedby="tip1">Settings</button>
<div id="tip1" role="tooltip">Configure your preferences</div>

<!-- Combobox / Autocomplete -->
<label for="city">City</label>
<input id="city" role="combobox"
  aria-expanded="true"
  aria-controls="city-listbox"
  aria-activedescendant="city-opt-2"
  autocomplete="off" />
<ul id="city-listbox" role="listbox">
  <li id="city-opt-1" role="option">New York</li>
  <li id="city-opt-2" role="option" aria-selected="true">Los Angeles</li>
  <li id="city-opt-3" role="option">Chicago</li>
</ul>

<!-- Switch / Toggle -->
<button role="switch" aria-checked="true">
  Dark mode: On
</button>

<!-- Progress Bar -->
<div role="progressbar" aria-valuenow="65"
  aria-valuemin="0" aria-valuemax="100"
  aria-label="Upload progress">
  65%
</div>`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You have an icon-only button with an SVG icon. What is the correct accessible pattern?"}
        options={[
          "Add role=\"img\" to the SVG",
          "Add aria-label to the button and aria-hidden to the SVG",
          "Add alt text to the SVG element",
          "Add a title attribute to the button"
        ]}
        correctIndex={1}
        explanation={"The button gets aria-label to provide its accessible name, and the SVG gets aria-hidden=\"true\" since it's decorative — the label on the button is what screen readers need. Title attributes are unreliable for accessibility."}
        language="html"
      />

      <InteractiveChallenge
        question={"When should you use aria-live=\"assertive\" instead of \"polite\"?"}
        options={[
          "For all dynamic content changes",
          "For error messages and time-critical alerts only",
          "When the content is inside a modal",
          "When using React state updates"
        ]}
        correctIndex={1}
        explanation={"assertive interrupts whatever the screen reader is currently saying — use it only for critical errors, session timeouts, or urgent alerts. For everything else (search results, status updates, toasts), use polite so you don't disrupt the user's workflow."}
        language="html"
      />

    </LessonLayout>
  );
}

export default function AriaPage() {
  return <Aria />;
}
