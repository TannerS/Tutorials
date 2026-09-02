import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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

      <p>
        <code>aria-hidden="true"</code> removes an element — and everything inside it — from the
        accessibility tree. The content still renders visually, but screen readers act as though it
        doesn't exist. It's for purely decorative content that would just add noise if read aloud.
      </p>

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

      <InfoBox variant="info" title="What Live Regions Actually Do">
        <code>aria-live</code> tells the screen reader to watch an element and announce whatever
        changes inside it, without the user needing to move focus there. <code>aria-atomic="true"</code>{' '}
        re-reads the whole region on any change instead of just the bit that changed.{' '}
        <code>role="status"</code> and <code>role="alert"</code> are shortcuts that already imply{' '}
        <code>aria-live="polite"</code> and <code>"assertive"</code> — you rarely need to set both.
      </InfoBox>

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

      <p>
        This is plain HTML — no framework required. Here's the same pattern wired up in a React
        component:
      </p>

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

      <h3>Live Region Pitfalls — Why Yours Probably Does Not Announce</h3>

      <p>
        Live regions are the single most common source of &quot;I added the ARIA and nothing
        happened.&quot; Almost always it is one of these four.
      </p>

      <InfoBox variant="danger" title="1. The Region Must Already Exist in the DOM">
        <p>
          This is the big one. The screen reader has to be <em>watching</em> a region before its
          contents change. If you mount the live region and its message in the same render, there was
          nothing to observe changing, and most screen readers announce nothing at all.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="The Mount-and-Announce Bug">
{`// BROKEN — the live region and its text appear together, so there
// was never a "change" for the screen reader to notice.
function Toast({ message }) {
  return message
    ? <div role="status">{message}</div>
    : null;
}

// FIXED — the region is ALWAYS rendered and always empty-or-full.
// Only its text content changes, which is what gets announced.
function Toast({ message }) {
  return (
    <div role="status" className="sr-only">
      {message}
    </div>
  );
}

// Same rule in vanilla JS: put the empty container in your HTML at
// page load, then write into it later.
//   <div id="announcer" role="status" class="sr-only"></div>
//   document.getElementById('announcer').textContent = 'Saved';`}
      </CodeBlock>

      <InfoBox variant="warning" title="2. Do Not Set Both role and aria-live">
        <p>
          <code>role=&quot;status&quot;</code> already implies{' '}
          <code>aria-live=&quot;polite&quot;</code>, and <code>role=&quot;alert&quot;</code> implies{' '}
          <code>aria-live=&quot;assertive&quot;</code>. Setting both is redundant, and some screen
          reader/browser pairs have historically double-announced as a result. Pick one — the role is
          usually the better choice because it also conveys meaning.
        </p>
        <p>
          (The React example above uses both to make the mapping obvious while you are learning. In
          production, <code>role=&quot;status&quot;</code> alone is enough.)
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="3. Identical Text Twice Announces Once">
        <p>
          If the new content is character-for-character the same as what is already there, there is no
          change and nothing is announced. Two failed save attempts producing the same
          &quot;Could not save&quot; means the user hears it once and assumes their second attempt did
          nothing.
        </p>
        <p>
          Fix it by clearing the region first (set it to <code>&#39;&#39;</code>, then set the message
          on the next tick), or by including something that varies — a count, a timestamp.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="4. assertive Is Not &quot;Important&quot; — It Is &quot;Interrupt&quot;">
        <p>
          <code>assertive</code> cuts off whatever the user is currently listening to, mid-word. On a
          page that fires several of them it becomes unusable. Reserve it for genuinely urgent,
          time-sensitive information: a session about to expire, a submission that failed
          destructively. Autosave confirmations, search counts, and loading states are all{' '}
          <code>polite</code>.
        </p>
        <p>
          A related trap: never put an <code>aria-live</code> region around content that updates
          constantly (a timer, a live-updating count). The screen reader will talk over itself
          indefinitely.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Do Not Hide a Live Region with display:none">
        <p>
          A region hidden with <code>display: none</code> or{' '}
          <code>visibility: hidden</code> is removed from the accessibility tree entirely, so its
          changes are never announced. Use the <code>.sr-only</code> clip technique shown above, which
          keeps the element in the tree while making it visually imperceptible.
        </p>
      </InfoBox>

      {/* ── Disclosure Widgets ────────────────────────────── */}
      <h2>aria-expanded &amp; aria-controls</h2>

      <p>
        <code>aria-expanded</code> tells assistive tech whether a collapsible section is open or
        closed — announced as "collapsed" or "expanded" right on the toggle button.{' '}
        <code>aria-controls</code> points at the <code>id</code> of the element the button reveals,
        so a screen reader can connect the two even though they aren't nested together in the DOM.
      </p>

      <CodeBlock language="jsx" title="Accessible Disclosure / Accordion">
{`function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <h3>
        <button
          id={panelId + '-btn'}   // the panel points BACK at this id
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

// NOTE the id on the button. An aria-labelledby that points at an id
// which does not exist fails SILENTLY -- no console error, no visual
// difference, the region just ends up with no accessible name. This
// is the single most common ARIA bug, and only an a11y tree
// inspection or an automated check will catch it.

// Screen reader flow:
// "Title, collapsed, button" → user presses Enter →
// "Title, expanded, button" → panel content is now readable`}
      </CodeBlock>

      <p>
        None of this is React-specific — it's plain HTML attributes plus a bit of script to flip
        them:
      </p>

      <CodeBlock language="html" title="Same Accordion — Plain HTML + Vanilla JS">
{`<h3>
  <button id="acc-btn" aria-expanded="false" aria-controls="acc-panel"
    onclick="toggleAccordion()">
    Section Title
    <span aria-hidden="true">▶</span>
  </button>
</h3>
<div id="acc-panel" role="region" aria-labelledby="acc-btn" hidden>
  Panel content goes here.
</div>

<script>
function toggleAccordion() {
  const btn = document.getElementById('acc-btn');
  const panel = document.getElementById('acc-panel');
  const isOpen = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!isOpen));
  panel.hidden = isOpen;
}
</script>`}
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

      <p>
        Strip away the React wrapper and it's the same handful of plain HTML attributes — the
        behavior (focus trap, Escape, restoring focus) is just vanilla JS instead of hooks:
      </p>

      <CodeBlock language="html" title="Same Modal — Plain HTML + Vanilla JS">
{`<div class="modal-overlay" id="overlay" onclick="closeModal()" hidden>
  <div id="dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title"
    tabindex="-1" onclick="event.stopPropagation()">
    <h2 id="modal-title">Confirm Deletion</h2>
    <p>Are you sure you want to delete this item?</p>
    <button onclick="closeModal()">Close</button>
  </div>
</div>

<script>
let lastFocused;

function openModal() {
  lastFocused = document.activeElement;       // remember trigger
  document.getElementById('overlay').hidden = false;
  document.getElementById('dialog').focus();
  document.addEventListener('keydown', handleModalKeydown);
}

function closeModal() {
  document.getElementById('overlay').hidden = true;
  document.removeEventListener('keydown', handleModalKeydown);
  lastFocused?.focus();                       // return focus on close
}

function handleModalKeydown(e) {
  if (e.key === 'Escape') closeModal();
  // Tab: cycle focus between the first and last focusable element
  // inside #dialog — same logic as the React version above.
}
</script>`}
      </CodeBlock>

      <InfoBox variant="tip" title="Or Skip the Manual Work">
        HTML5's native <code>&lt;dialog&gt;</code> element (covered in the previous lesson) gives you
        focus trapping, Escape-to-close, and an implicit <code>role="dialog"</code> for free — reach
        for it before hand-rolling a div-based modal like the one above.
      </InfoBox>

      {/* ── Accessible Tabs ───────────────────────────────── */}
      <h2>Complete Accessible Tabs</h2>

      <p>
        <code>role="tablist"</code> groups the tabs, <code>role="tab"</code> marks each clickable
        tab, and <code>role="tabpanel"</code> marks the content tied to a tab.{' '}
        <code>aria-selected</code> marks which tab is active, and <code>aria-controls</code> /{' '}
        <code>aria-labelledby</code> link each tab to its panel so a screen reader can announce
        "Tab 1 of 3, selected" and jump straight to the matching content.
      </p>

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

      <p>
        Again, none of the accessibility here comes from React — it's the roles, attributes, and
        keyboard handling below, translated to vanilla JS:
      </p>

      <CodeBlock language="html" title="Same Tabs — Plain HTML + Vanilla JS">
{`<div role="tablist" aria-label="Content sections" id="tablist">
  <button id="tab-0" role="tab" aria-selected="true"
    aria-controls="panel-0" tabindex="0">Tab One</button>
  <button id="tab-1" role="tab" aria-selected="false"
    aria-controls="panel-1" tabindex="-1">Tab Two</button>
</div>
<div id="panel-0" role="tabpanel" aria-labelledby="tab-0" tabindex="0">
  Panel one content
</div>
<div id="panel-1" role="tabpanel" aria-labelledby="tab-1" tabindex="0" hidden>
  Panel two content
</div>

<script>
document.getElementById('tablist').addEventListener('keydown', (e) => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
  let next = current;
  if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
  if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
  if (next === current) return;

  tabs.forEach((t, i) => {
    const selected = i === next;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
  });
  tabs[next].focus();
});
</script>`}
      </CodeBlock>

      {/* ── Common ARIA Patterns Reference ────────────────── */}
      <h2>ARIA Patterns Quick Reference</h2>

      <p>These are plain HTML patterns — no framework needed. Quick summary of each role:</p>

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

      <InfoBox variant="note" title="What Each Role Means">
        <strong>tooltip</strong> — supplementary text shown on hover/focus, linked via{' '}
        <code>aria-describedby</code>. <strong>combobox</strong> — a text input paired with a popup
        list; <code>aria-activedescendant</code> tracks the highlighted option without moving real
        focus. <strong>switch</strong> — a two-state on/off toggle, communicated via{' '}
        <code>aria-checked</code>. <strong>progressbar</strong> — exposes a numeric progress value
        through <code>aria-valuenow</code>/<code>min</code>/<code>max</code>.
      </InfoBox>

    </LessonLayout>
  );
}

export default function AriaPage() {
  return <Aria />;
}
