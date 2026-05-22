import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function A11yTesting() {
  return (
    <LessonLayout title="Accessibility Testing" sectionId="accessibility" lessonIndex={4} prev={{ path: "/accessibility/keyboard", label: "Keyboard Navigation" }} next={{ path: "/css-mastery/flexbox", label: "CSS Flexbox" }}>
      <p>Testing accessibility requires a mix of automated tools and manual testing. Automated tools catch ~30% of issues; manual keyboard and screen reader testing catches the rest.</p>
      <CodeBlock language="javascript" title="Automated Accessibility Testing">
{`// === JEST-AXE — unit test accessibility
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button label="Submit" onClick={() => {}} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('Form has proper labels', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// === PLAYWRIGHT — E2E accessibility scan
test('Home page passes axe scan', async ({ page }) => {
  await page.goto('/');
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])  // test against WCAG 2.1 AA
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

// Manual testing checklist:
// 1. Tab through entire page — all interactive elements reachable?
// 2. Focus indicator visible at all times?
// 3. Enter/Space activates buttons?
// 4. Escape closes modals/dropdowns?
// 5. Screen reader (VoiceOver/NVDA): make sense when read aloud?
// 6. Zoom to 200% — content still usable?
// 7. Color contrast ratio ≥ 4.5:1 (text) or 3:1 (large text)`}
      </CodeBlock>
      <InfoBox variant="tip" title="Quick Manual Testing">
        <p>The fastest manual accessibility test: unplug your mouse and try to use your app with only the keyboard. If you get stuck or can't find your place, you've found an accessibility bug. Then try with the screen reader built into your OS (VoiceOver on Mac/iOS, NVDA/JAWS on Windows, TalkBack on Android).</p>
      </InfoBox>
      <InteractiveChallenge
        question="What percentage of accessibility issues can automated tools like axe detect?"
        options={["100% — automated tools find all issues", "About 30% — the rest require manual testing", "About 70%", "About 10%"]}
        correctIndex={1}
        explanation="Automated tools like axe, Lighthouse, and jest-axe detect about 30% of WCAG violations — things like missing alt text, insufficient color contrast, and missing form labels. The other 70% require human judgment: Does the reading order make sense? Is the keyboard navigation flow logical? Does screen reader output make sense in context?"
      />

    </LessonLayout>
  );
}
