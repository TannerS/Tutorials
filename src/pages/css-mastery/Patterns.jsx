import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function CSSPatterns() {
  return (
    <LessonLayout title="CSS Patterns" sectionId="css-mastery" lessonIndex={5} prev={{ path: "/css-mastery/variables", label: "CSS Variables" }} next={{ path: "/react-testing/intro", label: "React Testing Introduction" }}>
      <p>Common CSS patterns for real-world UI components: cards, overlays, scroll behavior, aspect ratios, and modern layout tricks.</p>
      <CodeBlock language="css" title="Essential CSS Patterns">
{`/* === CARD WITH HOVER EFFECT === */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

/* === OVERLAY / BACKDROP === */
.overlay {
  position: fixed;
  inset: 0;           /* shorthand for top/right/bottom/left: 0 */
  background: rgba(0, 0, 0, 0.6);
  display: grid;
  place-items: center; /* centers child in both axes */
  z-index: 1000;
  backdrop-filter: blur(4px);
}

/* === ASPECT RATIO === */
.video-wrapper { aspect-ratio: 16 / 9; width: 100%; }
.avatar        { aspect-ratio: 1; border-radius: 50%; }
.thumbnail     { aspect-ratio: 4 / 3; object-fit: cover; }

/* === SCROLLBAR STYLING === */
.scrollable::-webkit-scrollbar       { width: 6px; }
.scrollable::-webkit-scrollbar-track { background: var(--color-surface); }
.scrollable::-webkit-scrollbar-thumb { background: var(--color-muted); border-radius: 3px; }
.scrollable { scrollbar-width: thin; scrollbar-color: var(--color-muted) transparent; }

/* === TRUNCATE TEXT === */
.truncate      { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.line-clamp-2  { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* === VISUALLY HIDDEN (accessible) === */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* === SMOOTH SCROLL === */
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }`}
      </CodeBlock>
      <InteractiveChallenge
        question="What does the .sr-only CSS class do?"
        options={["Hides elements from everyone", "Makes elements visually invisible while keeping them accessible to screen readers", "Makes text appear smaller", "Positions elements off-screen permanently"]}
        correctIndex={1}
        explanation="The sr-only (screen-reader only) pattern visually hides an element by collapsing it to 1x1px and clipping it, but does NOT use display:none or visibility:hidden — those hide content from screen readers too. sr-only lets you add extra context (like 'for user John') that's helpful for screen reader users but clutters the visual design."
      />

    </LessonLayout>
  );
}
