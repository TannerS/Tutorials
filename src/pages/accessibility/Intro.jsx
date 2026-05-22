import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function A11yIntro() {
  return (
    <LessonLayout
      title="Accessibility Introduction"
      sectionId="accessibility"
      lessonIndex={0}
      prev={null}
      next={{ path: '/accessibility/semantic', label: 'Semantic HTML' }}
    >
      <h2>Why Accessibility Matters</h2>
      <p>
        Web accessibility (a11y) means building websites usable by people with disabilities.
        ~15% of the world's population — over 1 billion people — live with some form of disability.
        Accessibility also improves SEO, usability for everyone, and legal compliance.
      </p>

      <FlowChart
        title="WCAG Four Principles (POUR)"
        chart={"graph TD\n  A[Accessible Web] --> B[Perceivable]\n  A --> C[Operable]\n  A --> D[Understandable]\n  A --> E[Robust]\n  B --> F[Alt text, captions, contrast ratio]\n  C --> G[Keyboard nav, no seizure triggers]\n  D --> H[Clear language, error messages]\n  E --> I[Works with screen readers and assistive tech]"}
      />

      <h2>WCAG 2.1 — The Standard</h2>

      <CodeBlock language="markdown" title="WCAG Conformance Levels">
{`## Level A — Minimum (must fix, breaks basic access)
# Examples:
# - Images have alt text
# - Form inputs have labels
# - Content doesn't require color alone to understand
# - Videos have captions (pre-recorded)

## Level AA — Standard (required by law in most countries)
# Examples:
# - Contrast ratio ≥ 4.5:1 for text, 3:1 for large text
# - Keyboard accessible for all functionality
# - Error messages identify the field and describe the error
# - Page has meaningful title
# - Headings describe the topic of each section

## Level AAA — Enhanced (aspirational, not required for all)
# Examples:
# - Contrast ratio ≥ 7:1
# - Sign language for pre-recorded video
# - Reading level at lower secondary education
# - No timing on any functionality

## Legal Requirements
# USA: ADA (Americans with Disabilities Act) — applies to websites
#      Section 508 — federal agencies MUST be AA compliant
# EU:  European Accessibility Act — 2025, products/services must comply
# UK:  Equality Act 2010
# CA:  Accessibility for Ontarians with Disabilities Act (AODA)
# Consequences: lawsuits, fines, reputational damage
# Domino's was sued for inaccessible app — Supreme Court allowed case`}
      </CodeBlock>

      <h2>Disability Categories and Assistive Technologies</h2>

      <CodeBlock language="markdown" title="Who Benefits from Accessibility">
{`## Visual Disabilities
# - Blindness: uses screen readers (NVDA, JAWS, VoiceOver, TalkBack)
# - Low vision: uses screen magnification (200-800%), high contrast
# - Color blindness: 8% of men, 0.5% of women (red-green most common)
# - What to do: alt text, proper contrast, don't use color alone

## Motor/Physical Disabilities
# - Limited hand movement: uses keyboard-only navigation, switch access
# - Tremors: needs large click targets, no hover-required interactions
# - One-handed: keyboard shortcuts matter more
# - What to do: full keyboard support, visible focus indicators, no time limits

## Cognitive and Neurological Disabilities
# - Dyslexia: benefits from plain language, good spacing, clear fonts
# - ADHD: benefits from clear structure, predictable navigation
# - Autism: benefits from literal language, no ambiguous icons
# - Memory impairment: needs clear navigation, consistent layouts
# - What to do: clear headings, simple language, consistent UI patterns

## Auditory Disabilities
# - Deafness: needs captions and transcripts for audio/video
# - Hard of hearing: needs captions, visual alerts instead of only audio
# - What to do: captions (CC) on all videos, never audio-only content

## Temporary and Situational Disabilities
# - Broken arm (motor, temporary)
# - Bright sun washing out screen (visual, situational)
# - Loud environment (auditory, situational)
# - Slow internet connection (cognitive load, situational)
# Accessibility features help everyone in these situations`}
      </CodeBlock>

      <h2>The Most Common Accessibility Failures</h2>

      <CodeBlock language="jsx" title="Top 10 Accessibility Mistakes (and Fixes)">
{`// 1. Missing alt text on images
// ❌
<img src="chart.png" />
// ✅ Descriptive alt for informative images
<img src="chart.png" alt="Q3 revenue increased 23% to $4.2M" />
// ✅ Empty alt for decorative images (screen reader skips it)
<img src="divider.svg" alt="" role="presentation" />

// 2. Non-semantic clickable divs
// ❌ Not keyboard accessible, no ARIA role, no accessible name
<div onClick={handleClick} className="btn">Submit</div>
// ✅ Native semantics: keyboard accessible, focusable, correct role
<button onClick={handleClick}>Submit</button>

// 3. Missing form labels
// ❌ placeholder disappears when user types, screen readers may miss it
<input type="email" placeholder="Email address" />
// ✅ Associated label
<label htmlFor="email">Email address</label>
<input id="email" type="email" aria-describedby="email-hint" />
<p id="email-hint" className="hint">We'll never share your email.</p>

// 4. Color as the only indicator
// ❌ Colorblind users can't distinguish
<span style={{ color: 'red' }}>Error</span>
// ✅ Icon + color + text
<span role="img" aria-hidden="true">⚠️</span>
<span style={{ color: '#dc2626' }}>Error: Invalid email address</span>

// 5. Insufficient color contrast
// ❌ Light gray on white (#999 on #fff = 2.85:1 — fails AA)
<p style={{ color: '#999', background: '#fff' }}>Help text</p>
// ✅ Meet 4.5:1 minimum for normal text
<p style={{ color: '#6b7280', background: '#fff' }}>Help text</p>
// Tools: WebAIM Contrast Checker, browser DevTools accessibility panel

// 6. No keyboard focus indicators
// ❌ Removing default focus ring with no replacement
button:focus { outline: none; }
// ✅ Custom focus style that's visible
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

// 7. Missing page title and landmark structure
// ❌ Generic title, no landmarks
<title>Page</title>
<div class="nav">...</div>
// ✅ Descriptive title, semantic landmarks
<title>Dashboard | Acme App</title>
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<footer>...</footer>

// 8. Auto-playing media
// ❌ Autoplaying video with sound (users can't stop it)
<video src="promo.mp4" autoPlay />
// ✅ No autoplay, or muted with controls
<video src="promo.mp4" controls muted />

// 9. Inaccessible modals
// ❌ Focus not trapped inside modal, ESC doesn't close
<div class="modal" tabIndex={-1}>...</div>
// ✅ Use focus-trap-react or native <dialog> element
<dialog ref={dialogRef} onClose={handleClose}>
  {/* focus trapped automatically, ESC closes */}
</dialog>

// 10. Missing skip link
// ❌ Every page load forces keyboard users through the entire nav
// ✅ Skip to main content link (visible on focus)
<a href="#main-content" className="skip-link">Skip to main content</a>
<main id="main-content" tabIndex={-1}>...</main>`}
      </CodeBlock>

      <h2>Quick Wins — Fix 80% of Issues Fast</h2>

      <CodeBlock language="jsx" title="Audit Checklist — Quick Wins">
{`// Run this in your browser console to find some issues:
// 1. Install axe DevTools Chrome extension → Run accessibility scan
// 2. Tab through your entire page — can you use it without a mouse?
// 3. Check contrast ratios with browser DevTools

// AUTOMATED CHECKS (catches ~30% of issues):
// eslint-plugin-jsx-a11y — lint rules in your editor
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
// Add to ESLint config — catches missing alts, labels, ARIA issues

// jest-axe — accessibility testing in unit tests
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// MANUAL CHECKS (catches the other 70%):
// 1. Keyboard test: tab through entire page without mouse
//    - Can you reach every interactive element?
//    - Is focus always visible?
//    - Do modals trap focus?
//    - Does ESC close modals?

// 2. Screen reader test (Mac: Cmd+F5 for VoiceOver):
//    - Navigate by headings (VoiceOver: Ctrl+Option+Cmd+H)
//    - Are images described meaningfully?
//    - Do form errors announce correctly?
//    - Do live updates announce (aria-live)?

// 3. Zoom test: zoom to 200% — does layout break?
//    - No horizontal scrollbar (unless unavoidable)
//    - No text overlap
//    - All features still accessible`}
      </CodeBlock>

      <InfoBox variant="tip" title="Accessibility Is a Feature, Not a Checklist">
        <p>
          The best time to fix accessibility is when writing code, not in a separate audit phase.
          Install <code>eslint-plugin-jsx-a11y</code> in your IDE to catch issues as you type.
          Use semantic HTML by default — a <code>&lt;button&gt;</code> is always better than a
          <code>&lt;div onClick&gt;</code>. Treat keyboard users as first-class: if you can't
          use your app with Tab + Enter + Space + Arrow keys, it's not accessible.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"What alt attribute should a purely decorative image have?"}
        options={[
          "alt=\"decorative\"",
          'alt="" (empty string)',
          "No alt attribute at all",
          "alt=\"image\""
        ]}
        correctIndex={1}
        explanation={'An empty alt="" is the correct signal for decorative images. It tells screen readers to skip the image entirely — it adds no information. Omitting alt entirely is wrong — screen readers may read the filename instead. alt="decorative" is wrong — screen readers will literally announce "decorative" which is unhelpful. Only use descriptive alt text when the image conveys information that\'s not available in surrounding text.'}
      />

      <InteractiveChallenge
        question="What is the minimum color contrast ratio required for normal body text under WCAG 2.1 Level AA?"
        options={["2:1", "3:1", "4.5:1", "7:1"]}
        correctIndex={2}
        explanation="WCAG 2.1 Level AA requires a minimum 4.5:1 contrast ratio for normal text (body copy, labels). Large text (18pt+ or 14pt bold) has a lower requirement of 3:1. Level AAA raises the bar to 7:1 for normal text and 4.5:1 for large text. Use the WebAIM Contrast Checker or browser DevTools to measure. Common fails: light gray text on white (#999 on #fff = 2.85:1), or light blue on white for links."
      />
    </LessonLayout>
  );
}
