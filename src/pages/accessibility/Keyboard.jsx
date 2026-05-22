import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Keyboard() {
  return (
    <LessonLayout
      title="Keyboard Navigation & Focus"
      sectionId="accessibility"
      lessonIndex={3}
      prev={{ path: '/accessibility/aria', label: 'ARIA Roles & Attributes' }}
      next={{ path: '/accessibility/testing', label: 'Testing Accessibility' }}
    >
      <p>
        Keyboard accessibility is the foundation of all assistive technology support. Screen readers,
        switch devices, and voice control all ultimately rely on keyboard interactions. If your app
        isn't keyboard-accessible, it's inaccessible to a large group of users — and it fails
        WCAG 2.1.1 (Level A).
      </p>

      <InfoBox variant="warning" title="The Keyboard Test">
        Unplug your mouse and try to use your app. Can you reach every interactive element with Tab?
        Can you activate buttons with Enter/Space? Can you close modals with Escape? Can you always
        see where focus is? If any answer is "no", you have a keyboard accessibility bug.
      </InfoBox>

      {/* ── Tab Order & tabindex ──────────────────────────── */}
      <h2>Tab Order &amp; tabindex</h2>
      <p>
        The tab order follows the DOM order by default. Interactive elements (links, buttons, inputs)
        are naturally focusable. Use <code>tabindex</code> to modify focus behavior:
      </p>

      <FlowChart
        title="tabindex Values"
        chart={"graph TD\n  TI[tabindex values] --> T0[tabindex=0]\n  TI --> TN1[tabindex=-1]\n  TI --> TP[tabindex=1+]\n  T0 --> T0D[Adds element to natural tab order]\n  T0 --> T0E[Use for custom interactive elements]\n  TN1 --> TN1D[Focusable via JavaScript only]\n  TN1 --> TN1E[Not in tab order - good for programmatic focus]\n  TP --> TPD[Forces element earlier in tab order]\n  TP --> TPE[AVOID - creates confusing tab order]"}
      />

      <CodeBlock language="html" title="tabindex Usage">
{`<!-- tabindex="0" — adds to tab order (use for custom interactive elements) -->
<div role="button" tabindex="0" onclick="doAction()"
     onkeydown="if(event.key==='Enter'||event.key===' ')doAction()">
  Custom Button
</div>

<!-- tabindex="-1" — focusable via JS only, NOT in tab order -->
<!-- Perfect for: modal containers, headings to focus on route change,
     non-active tabs in roving tabindex pattern -->
<h2 tabindex="-1" id="section-title">Section Title</h2>
<!-- JS: document.getElementById('section-title').focus() -->

<!-- tabindex="1+" — NEVER USE THIS -->
<!-- ❌ Positive tabindex forces elements to the front of the tab order.
     It creates a confusing, unpredictable navigation experience.
     If you need to change tab order, restructure your DOM instead. -->
<input tabindex="3" />  <!-- DON'T DO THIS -->
<input tabindex="1" />  <!-- User tabs here first — confusing! -->
<input tabindex="2" />  <!-- Then here — DOM order is ignored -->`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never Use Positive tabindex">
        Positive tabindex values are a code smell in every a11y audit. They override the natural DOM
        order, creating an unpredictable tab sequence that confuses all keyboard users. The correct
        fix is always to restructure your HTML so the DOM order matches the visual order.
      </InfoBox>

      {/* ── Focus Management in SPAs ──────────────────────── */}
      <h2>Focus Management in SPAs</h2>
      <p>
        Single-page applications don't trigger full page loads, so the browser doesn't reset focus
        on navigation. Without focus management, screen reader users get lost after route changes.
      </p>

      <CodeBlock language="jsx" title="Focus on Route Change in React">
{`import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function useRouteAnnouncer() {
  const location = useLocation();
  const headingRef = useRef(null);

  useEffect(() => {
    // Focus the main heading after route change
    const heading = document.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
      // Remove tabindex after blur to keep natural tab order clean
      heading.addEventListener('blur', () => {
        heading.removeAttribute('tabindex');
      }, { once: true });
    }
  }, [location.pathname]);

  return headingRef;
}

// Alternative: use a live region to announce the new page
function RouteAnnouncer() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Small delay to let the new page render its title
    const timer = setTimeout(() => {
      const title = document.querySelector('h1')?.textContent || document.title;
      setAnnouncement('Navigated to ' + title);
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}`}
      </CodeBlock>

      {/* ── Focus Trapping ────────────────────────────────── */}
      <h2>Focus Trapping in Modals</h2>
      <p>
        When a modal is open, focus must be trapped inside it — Tab should cycle through the modal's
        interactive elements and never escape to the background content.
      </p>

      <CodeBlock language="jsx" title="useFocusTrap Custom Hook">
{`function useFocusTrap(isActive) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const container = containerRef.current;
    const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),' +
      'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = [...container.querySelectorAll(FOCUSABLE)];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    container.addEventListener('keydown', handleKeyDown);
    const focusable = [...container.querySelectorAll(FOCUSABLE)];
    if (focusable.length) focusable[0].focus();
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}`}
      </CodeBlock>

      {/* ── Skip Navigation ───────────────────────────────── */}
      <h2>Skip Navigation Links</h2>
      <p>
        A skip link lets keyboard users jump past repetitive navigation directly to the main content.
        It should be the first focusable element on the page.
      </p>

      <CodeBlock language="html" title="Skip Navigation Implementation">
{`<!-- HTML — first element in <body> -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<header>
  <nav><!-- Many links here --></nav>
</header>

<main id="main-content" tabindex="-1">
  <!-- tabindex="-1" ensures focus moves here on click -->
  <h1>Page Title</h1>
  ...
</main>`}
      </CodeBlock>

      <CodeBlock language="css" title="Skip Link CSS">
{`.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  background: #1a1a2e;
  color: #fff;
  padding: 0.75rem 1.5rem;
  z-index: 9999;
  transition: top 0.2s ease;
}
.skip-link:focus { top: 0; }
/* Slides into view on Tab, invisible to mouse users */`}
      </CodeBlock>

      {/* ── Roving Tabindex ───────────────────────────────── */}
      <h2>Roving Tabindex Pattern</h2>
      <p>
        For composite widgets (toolbars, tab lists, menus), only one item should be in the tab order
        at a time. Arrow keys move focus between items. This is called "roving tabindex."
      </p>

      <FlowChart
        title="Roving Tabindex Flow"
        chart={"graph LR\n  TAB[Tab into widget] --> ACTIVE[Active item: tabindex=0]\n  ACTIVE --> ARROW[Arrow key pressed]\n  ARROW --> UPDATE[Move tabindex=0 to new item]\n  UPDATE --> PREV[Previous item: tabindex=-1]\n  UPDATE --> FOCUS[Focus new item]\n  FOCUS --> ARROW"}
      />

      <CodeBlock language="jsx" title="Roving Tabindex Hook">
{`function useRovingTabindex(itemCount) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e) => {
    let newIndex = activeIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (activeIndex + 1) % itemCount;
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (activeIndex - 1 + itemCount) % itemCount;
        e.preventDefault();
        break;
      case 'Home':
        newIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        newIndex = itemCount - 1;
        e.preventDefault();
        break;
      default:
        return;
    }

    setActiveIndex(newIndex);
  };

  const getItemProps = (index) => ({
    tabIndex: index === activeIndex ? 0 : -1,
    'aria-selected': index === activeIndex,
    ref: (el) => {
      if (index === activeIndex && el) el.focus();
    },
  });

  return { activeIndex, handleKeyDown, getItemProps };
}`}
      </CodeBlock>

      {/* ── Focus Styles ──────────────────────────────────── */}
      <h2>Focus Styles: :focus-visible vs :focus</h2>
      <p>
        Focus indicators must be visible for keyboard users. The <code>:focus-visible</code>
        pseudo-class shows focus styles only for keyboard navigation, not mouse clicks.
      </p>

      <CodeBlock language="css" title="Focus Styling Best Practices">
{`/* ❌ NEVER DO THIS — removes all focus indication */
*:focus {
  outline: none;
}

/* ❌ Also bad — only styling :focus shows outlines on mouse clicks too */
button:focus {
  outline: 3px solid blue;  /* Annoying for mouse users */
}

/* ✅ Use :focus-visible — only shows for keyboard navigation */
button:focus-visible {
  outline: 2px solid #4A90D9;
  outline-offset: 2px;
}

/* ✅ Custom focus ring with better aesthetics */
:focus-visible {
  outline: 2px solid #4A90D9;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ✅ High contrast mode support */
@media (forced-colors: active) {
  :focus-visible {
    outline: 2px solid CanvasText;
  }
}

/* WCAG 2.4.7 (AA): Focus must be visible
   WCAG 2.4.11 (AAA): Focus indicator must have
   sufficient contrast and minimum area */`}
      </CodeBlock>

      <InfoBox variant="tip" title="Never outline: none Without an Alternative">
        Removing <code>outline: none</code> globally is one of the most common accessibility
        violations. If you must remove the default outline, you <strong>must</strong> replace it with
        a custom focus indicator that has sufficient contrast. Use <code>:focus-visible</code> to
        keep mouse users happy while maintaining keyboard accessibility.
      </InfoBox>

      {/* ── Keyboard Patterns ─────────────────────────────── */}
      <h2>Standard Keyboard Interaction Patterns</h2>

      <CodeBlock language="javascript" title="Expected Keyboard Behaviors">
{`// Key patterns per ARIA Authoring Practices Guide (APG):
// Buttons:       Enter / Space → activate
// Links:         Enter only (Space does NOT work)
// Checkboxes:    Space → toggle
// Radio groups:  Arrow keys → move, Space → select
// Tabs:          Arrow Left/Right → switch, Home/End → first/last
// Menus:         Arrow Down → open/next, Enter → activate, Escape → close
// Modals:        Escape → close, Tab → cycle (trapped), focus auto-managed
// Combobox:      Arrow Down → open, type → filter, Enter → select`}
      </CodeBlock>

      {/* ── Focus Restoration ─────────────────────────────── */}
      <h2>Focus Restoration After Modal Close</h2>

      <CodeBlock language="jsx" title="Focus Restoration Pattern">
{`function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const open = (e) => {
    triggerRef.current = e.currentTarget;
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return { isOpen, open, close };
}

// Usage:
function App() {
  const { isOpen, open, close } = useModal();
  return (
    <>
      <button onClick={open}>Edit Profile</button>
      {isOpen && <Modal onClose={close} title="Edit Profile">...</Modal>}
    </>
  );
  // After close → focus snaps back to "Edit Profile" button
}`}
      </CodeBlock>

      {/* ── Complete Dropdown ─────────────────────────────── */}
      <h2>Complete Keyboard-Accessible Dropdown</h2>

      <CodeBlock language="jsx" title="Accessible Dropdown Menu">
{`function DropdownMenu({ label, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const buttonRef = useRef(null);
  const menuId = useId();

  const openMenu = () => { setIsOpen(true); setActiveIndex(0); };
  const closeMenu = () => { setIsOpen(false); setActiveIndex(-1); buttonRef.current?.focus(); };

  const handleMenuKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIndex(i => Math.min(i + 1, items.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); break;
      case 'Home':      e.preventDefault(); setActiveIndex(0); break;
      case 'End':       e.preventDefault(); setActiveIndex(items.length - 1); break;
      case 'Enter': case ' ': e.preventDefault(); items[activeIndex]?.action(); closeMenu(); break;
      case 'Escape': case 'Tab': closeMenu(); break;
    }
  };

  useEffect(() => {
    if (isOpen && activeIndex >= 0)
      document.getElementById(menuId + '-item-' + activeIndex)?.focus();
  }, [activeIndex, isOpen, menuId]);

  return (
    <div style={{ position: 'relative' }}>
      <button ref={buttonRef} aria-haspopup="true" aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        onKeyDown={(e) => { if (['ArrowDown','Enter',' '].includes(e.key)) { e.preventDefault(); openMenu(); } }}>
        {label}
      </button>
      {isOpen && (
        <ul id={menuId} role="menu" aria-label={label} onKeyDown={handleMenuKeyDown}>
          {items.map((item, i) => (
            <li key={i} id={menuId + '-item-' + i} role="menuitem"
              tabIndex={i === activeIndex ? 0 : -1}
              onClick={() => { item.action(); closeMenu(); }}>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What value should tabindex be set to for a modal container that needs to receive focus programmatically but should NOT be in the natural tab order?"}
        options={[
          "tabindex=\"0\"",
          "tabindex=\"1\"",
          "tabindex=\"-1\"",
          "No tabindex needed"
        ]}
        correctIndex={2}
        explanation={"tabindex=\"-1\" makes an element focusable via JavaScript (element.focus()) but keeps it out of the natural tab order. This is perfect for modal containers, section headings after route changes, and error summary containers that need programmatic focus."}
        language="html"
      />

      <InteractiveChallenge
        question={"In the roving tabindex pattern for a tab list, what happens when the user presses the Right Arrow key on the last tab?"}
        options={[
          "Focus stays on the last tab",
          "Focus moves to the first tab (wraps around)",
          "Focus moves to the tab panel",
          "Nothing happens"
        ]}
        correctIndex={1}
        explanation={"The roving tabindex pattern wraps around — pressing Right Arrow on the last item moves focus to the first item, and Left Arrow on the first item moves to the last. This creates a circular navigation pattern that users of composite widgets expect per the ARIA Authoring Practices Guide."}
        language="html"
      />

    </LessonLayout>
  );
}

export default function KeyboardPage() {
  return <Keyboard />;
}
