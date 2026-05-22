import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function A11yKeyboard() {
  return (
    <LessonLayout title="Keyboard Navigation" sectionId="accessibility" lessonIndex={3} prev={{ path: "/accessibility/aria", label: "ARIA Attributes" }} next={{ path: "/accessibility/testing", label: "Accessibility Testing" }}>
      <p>All functionality must be operable with a keyboard alone. Users who can't use a mouse — motor disabilities, power users, screen reader users — rely on keyboard navigation.</p>
      <CodeBlock language="jsx" title="Keyboard Navigation Patterns">
{`// === FOCUS MANAGEMENT ===
// Always show visible focus indicator
// CSS: :focus-visible { outline: 2px solid #5b9cf6; outline-offset: 2px; }
// NEVER: * { outline: none; } — this blinds keyboard users

// Focus trap in modals — keyboard stays inside while open
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const focusable = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    const last  = focusable?.[focusable.length - 1];
    first?.focus();  // auto-focus first element

    const trap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first?.focus(); } }
    };
    const close = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', trap);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('keydown', trap); document.removeEventListener('keydown', close); };
  }, [isOpen, onClose]);
  return isOpen ? <div ref={modalRef} role="dialog">{children}</div> : null;
}

// tabIndex usage
// tabIndex={0}   — include in natural tab order
// tabIndex={-1}  — focusable programmatically, not in tab order
// Positive tabIndex — avoid (disrupts natural order)

// Skip navigation link — jump past repetitive nav
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
<nav>...</nav>
<main id="main-content">...</main>`}
      </CodeBlock>
      <InteractiveChallenge
        question="Why should you never use CSS `outline: none` globally?"
        options={["It causes layout issues", "It removes the visible focus indicator, making keyboard navigation impossible for sighted keyboard users", "It breaks form validation", "It conflicts with ARIA attributes"]}
        correctIndex={1}
        explanation="outline: none removes the browser's default focus ring. Sighted keyboard users rely on the focus indicator to know which element is currently active. Without it, tab navigation becomes unusable. Use :focus-visible (which only shows the outline when navigating by keyboard, not mouse) instead of removing it."
      />

    </LessonLayout>
  );
}
