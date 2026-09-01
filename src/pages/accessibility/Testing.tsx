import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Testing() {
  return (
    <LessonLayout
      title="Testing Accessibility"
      sectionId="accessibility"
      lessonIndex={4}
      prev={{ path: '/accessibility/keyboard', label: 'Keyboard Navigation & Focus' }}
      next={null}
    >
      <p>
        Automation gets you roughly half the way there and never further. Deque&apos;s own study —
        2,000+ audits across 13,000+ pages, nearly 300,000 issues, run with axe — found automated
        testing completely covered <strong>57%</strong> of the issues found. The rest require manual
        testing, screen reader verification, and human judgment. A robust a11y testing strategy
        combines all three layers: automated CI checks, manual audits, and assistive technology
        testing.
      </p>

      <InfoBox variant="info" title="Why You See 20–30%, 30–50% and 57% Quoted for the Same Thing">
        <p>
          These numbers are not competing measurements — they answer different questions, and it is
          worth knowing which one someone means before arguing about it.
        </p>
        <p>
          The older <strong>20–30%</strong> figure counts <em>WCAG success criteria</em>: of the ~50
          testable criteria, how many can a machine decide? That is a deliberately harsh denominator,
          because criteria like &quot;is this alt text meaningful&quot; are one criterion each and are
          permanently un-automatable.
        </p>
        <p>
          Deque&apos;s <strong>57%</strong> counts <em>issue volume</em>: of every defect found in a
          real audit, what share did the tool catch? Real pages fail the machine-checkable criteria
          over and over — a hundred unlabelled inputs is a hundred issues — so the same tool scores
          much higher on this denominator.
        </p>
        <p>
          Both are honest; neither changes the practical conclusion. Run the automation, because it is
          free and it clears out the high-volume noise. Then do the manual pass, because the criteria
          it cannot reach are the ones that decide whether the page is actually usable.
        </p>
      </InfoBox>

      <FlowChart
        title="Accessibility Testing Pyramid"
        chart={"graph TD\n  AT[A11y Testing Strategy] --> AUTO[Automated - CI/CD]\n  AT --> MANUAL[Manual - Human Audit]\n  AT --> ASSIST[Assistive Tech - Screen Readers]\n  AUTO --> LINT[eslint-plugin-jsx-a11y]\n  AUTO --> AXE[jest-axe / axe-core]\n  AUTO --> LH[Lighthouse CI]\n  AUTO --> E2E[Playwright / Cypress a11y]\n  MANUAL --> KB[Keyboard-only navigation]\n  MANUAL --> ZOOM[Zoom to 200%]\n  MANUAL --> HC[High contrast mode]\n  MANUAL --> CHECK[Manual checklist audit]\n  ASSIST --> VO[VoiceOver - macOS]\n  ASSIST --> NVDA[NVDA - Windows]\n  ASSIST --> JAWS[JAWS - Windows]"}
      />

      <InfoBox variant="warning" title="Automated Tools Are Not Enough">
        Tools like axe-core and Lighthouse are essential but limited. They can catch missing alt text,
        low contrast, and missing labels — but they <strong>cannot</strong> verify that alt text is
        meaningful, that focus order makes sense, or that screen reader announcements are helpful.
        Always pair automated tests with manual testing.
      </InfoBox>

      {/* ── Manual Testing Checklist ──────────────────────── */}
      <h2>Manual Testing Checklist</h2>

      <CodeBlock language="javascript" title="Manual A11y Testing Checklist">
{`// KEYBOARD: Tab to all controls, visible focus, Enter/Space/Escape work,
//   modal focus trapping, focus returns after close, skip nav works

// VISUAL: Zoom 200% (no horizontal scroll), high contrast mode,
//   CSS off (reading order ok?), color contrast 4.5:1, no color-only info

// STRUCTURE: All images have alt text, headings h1→h2→h3 (no skips),
//   all inputs labeled, errors linked via aria-describedby, landmarks exist

// DYNAMIC: Loading states announced, form errors via role="alert",
//   toasts use aria-live, animations respect prefers-reduced-motion`}
      </CodeBlock>

      {/* ── eslint-plugin-jsx-a11y ────────────────────────── */}
      <h2>eslint-plugin-jsx-a11y</h2>
      <p>
        This ESLint plugin catches accessibility issues at development time, right in your editor.
        It's the cheapest form of a11y testing — zero runtime cost, instant feedback.
      </p>

      <CodeBlock language="javascript" title="eslint-plugin-jsx-a11y Setup">
{`// npm install --save-dev eslint-plugin-jsx-a11y

// ESLint 9+ uses FLAT config (eslint.config.js). The older
// .eslintrc.js format below still works via ESLINT_USE_FLAT_CONFIG=false,
// but new projects should use flat config:
//
//   import jsxA11y from 'eslint-plugin-jsx-a11y';
//   export default [
//     jsxA11y.flatConfigs.recommended,
//     { rules: { 'jsx-a11y/no-redundant-roles': 'warn' } },
//   ];

// .eslintrc.js (legacy format)
module.exports = {
  plugins: ['jsx-a11y'],
  extends: ['plugin:jsx-a11y/recommended'],
  rules: {
    // Key rules it enforces:
    'jsx-a11y/alt-text': 'error',              // images need alt
    'jsx-a11y/anchor-has-content': 'error',     // links need text
    'jsx-a11y/aria-props': 'error',             // valid ARIA attributes
    'jsx-a11y/aria-role': 'error',              // valid ARIA roles
    'jsx-a11y/click-events-have-key-events': 'error', // onClick needs onKeyDown
    'jsx-a11y/heading-has-content': 'error',    // headings need text
    'jsx-a11y/label-has-associated-control': 'error', // labels need inputs
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-redundant-roles': 'warn',      // no role="button" on <button>
    'jsx-a11y/tabindex-no-positive': 'error',   // no tabindex > 0
  },
};

// Catches issues like:
// ❌ <img src="photo.jpg" />              → Missing alt prop
// ❌ <div onClick={handler}>Click</div>   → Missing keyboard handler
// ❌ <span role="buton">Save</span>       → Invalid ARIA role (typo)
// ❌ <input aria-labelby="title" />        → Invalid ARIA attribute (typo)`}
      </CodeBlock>

      {/* ── jest-axe ──────────────────────────────────────── */}
      <h2>jest-axe — Unit Testing for Accessibility</h2>
      <p>
        jest-axe integrates axe-core into your Jest test suite. It checks rendered components for
        WCAG violations and gives detailed failure messages.
      </p>

      <CodeBlock language="jsx" title="jest-axe Complete Example">
{`// npm install --save-dev jest-axe @testing-library/react

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('LoginForm accessibility', () => {
  it('should have no a11y violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
    // If violations exist, the error message includes:
    // - Rule ID (e.g., "color-contrast")
    // - Impact level (critical, serious, moderate, minor)
    // - Affected HTML element
    // - How to fix it
  });

  it('should have no violations when showing errors', async () => {
    const { container, getByRole } = render(<LoginForm />);

    // Submit empty form to trigger validation errors
    fireEvent.click(getByRole('button', { name: /submit/i }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations in modal state', async () => {
    const { container, getByRole } = render(<Dashboard />);

    // Open the modal
    fireEvent.click(getByRole('button', { name: /edit profile/i }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// Run specific axe rules only:
const results = await axe(container, {
  rules: {
    'color-contrast': { enabled: true },
    'label': { enabled: true },
    region: { enabled: false }, // disable specific rule
  },
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Test All States">
        Don't just test the initial render. Components often have multiple states — empty, loading,
        error, modal open, dropdown expanded. Run axe on each state. Accessibility bugs frequently
        hide in dynamic states that only appear after user interaction.
      </InfoBox>

      <InfoBox variant="warning" title="jest-axe Under Vitest — Use vitest-axe Instead">
        <p>
          The example above is written for Jest, but the <strong>react-testing</strong> section of
          this site standardizes on Vitest, not Jest — and <code>jest-axe</code> does not port over
          cleanly. It assumes Jest&apos;s global <code>expect</code> wiring, and under Vitest&apos;s{' '}
          <code>happy-dom</code> environment specifically it has known compatibility issues (matcher
          registration and serialization both behave differently from Jest&apos;s <code>jsdom</code>{' '}
          setup).
        </p>
        <p>
          The Vitest-native answer is <code>vitest-axe</code> — a maintained fork of jest-axe with
          the same <code>axe(container)</code> / <code>toHaveNoViolations</code> API, wired for{' '}
          <code>vi.expect.extend</code> instead of Jest&apos;s global. If you&apos;d rather stay on
          jest-axe itself, it can still work under <code>jsdom</code> (not <code>happy-dom</code>)
          with <code>expect.extend</code> wired manually in a setup file — but for a Vitest project,
          reach for <code>vitest-axe</code> first and save yourself the debugging.
        </p>
      </InfoBox>

      {/* ── React Testing Library ─────────────────────────── */}
      <h2>React Testing Library — Accessibility-First Queries</h2>
      <p>
        React Testing Library encourages accessible queries by default. The query priority order
        pushes you toward accessible patterns:
      </p>

      <CodeBlock language="jsx" title="RTL Accessible Queries">
{`// Priority 1: Accessible to everyone (visual + AT)
getByRole('button', { name: /submit/i })   // role + accessible name
getByLabelText('Email')                     // form controls by label
getByPlaceholderText('Search...')           // fallback for inputs
getByText('Welcome back')                  // visible text content
getByDisplayValue('john@example.com')       // current input value

// Priority 2: Semantic queries
getByAltText('User avatar')                // images
getByTitle('Close')                        // title attribute

// Priority 3: Test IDs — LAST RESORT
getByTestId('submit-button')               // no a11y meaning

// ✅ Best practice — use getByRole as much as possible
// It validates that your elements have correct roles and names

// Find all buttons
screen.getAllByRole('button');

// Find a specific tab
screen.getByRole('tab', { name: 'Settings', selected: true });

// Find a checkbox by label
screen.getByRole('checkbox', { name: 'Accept terms' });

// Find navigation landmark
screen.getByRole('navigation', { name: 'Main' });

// Find a heading at specific level
screen.getByRole('heading', { level: 1, name: 'Dashboard' });

// If getByRole can't find your element, that's a hint
// your HTML isn't accessible — fix the HTML, not the test!`}
      </CodeBlock>

      {/* ── Lighthouse ────────────────────────────────────── */}
      <h2>Lighthouse Accessibility Audit</h2>

      <CodeBlock language="javascript" title="Lighthouse CLI & CI Integration">
{`// Run Lighthouse from CLI:
// npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json

// Lighthouse CI in GitHub Actions:
// .github/workflows/a11y.yml
// name: Accessibility Audit
// on: [pull_request]
// jobs:
//   lighthouse:
//     runs-on: ubuntu-latest
//     steps:
//       - uses: actions/checkout@v7
//       - run: npm ci && npm run build
//       - uses: treosh/lighthouse-ci-action@v11
//         with:
//           urls: |
//             http://localhost:3000/
//             http://localhost:3000/login
//             http://localhost:3000/dashboard
//           budgetPath: ./lighthouse-budget.json

// lighthouse-budget.json — fail CI if score drops
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    }
  }
}

// Lighthouse checks ~50 a11y rules including:
// - Color contrast
// - Image alt text
// - Form labels
// - ARIA validity
// - Document language
// - Focus order
// - Heading hierarchy`}
      </CodeBlock>

      {/* ── Playwright/Cypress A11y ───────────────────────── */}
      <h2>E2E Accessibility Testing</h2>

      <CodeBlock language="javascript" title="Playwright + axe-core E2E Testing">
{`// npm install --save-dev @axe-core/playwright
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage has no a11y violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('login error state is accessible', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('modal a11y and keyboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /edit/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeFocused();
    const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(results.violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});`}
      </CodeBlock>

      {/* ── Screen Reader Testing ─────────────────────────── */}
      <h2>Screen Reader Testing</h2>

      <CodeBlock language="javascript" title="Screen Reader Quick Reference">
{`// VoiceOver (macOS) — Cmd+F5 to toggle
// VO = Control + Option (held together)
// VO+Right/Left → next/prev element  |  VO+Space → activate
// VO+U → rotor (headings, links, landmarks list)

// NVDA (Windows) — free from nvaccess.org
// Insert = NVDA key  |  NVDA+Down → read all
// H → next heading   |  D → next landmark  |  K → next link

// Test checklist:
// Page title announced, landmarks found, all controls named,
// form labels read, errors announced, live regions work,
// modal announced as dialog, decorative images skipped`}
      </CodeBlock>

      <InfoBox variant="info" title="Test With Real Screen Readers">
        Automated tools test the DOM. Screen readers test the actual user experience. VoiceOver on
        Mac is free and takes 10 minutes to learn the basics. Test your most critical user flows
        (login, checkout, data entry) with VoiceOver at least once per sprint.
      </InfoBox>

      {/* ── Color Contrast ────────────────────────────────── */}
      <h2>Color Contrast Checking</h2>

      <CodeBlock language="css" title="WCAG Contrast Ratios">
{`/* WCAG 2.2 AA Requirements (unchanged from 2.1 — 2.2 added no new
   contrast thresholds, it added 9 other success criteria): */
/* Normal text (< 18pt): minimum 4.5:1 contrast ratio */
/* Large text (≥ 18pt or ≥ 14pt bold): minimum 3:1 */
/* UI components and graphics: minimum 3:1 */
/* AAA raises normal text to 7:1 and large text to 4.5:1 */

/* ❌ Fails AA — gray text on white (2.85:1) */
.bad-contrast {
  color: #999999;
  background: #ffffff;
}

/* ✅ Passes AA and AAA — dark gray on white (12.63:1) */
.good-contrast {
  color: #333333;
  background: #ffffff;
}

/* The AAA boundary is darker than most people guess. On white,
   #595959 is 7.00:1 — the lightest neutral gray that still passes
   AAA. One step lighter, #5a5a5a, is 6.90:1 and fails. Never eyeball
   a ratio; compute it or let a tool do it. */

/* ✅ Check with these tools: */
/* - Chrome DevTools → Inspect element → color picker shows contrast ratio */
/* - Firefox → Accessibility Inspector → Check for Issues → Contrast */
/* - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/ */
/* - Stark (Figma plugin) — catch issues in design phase */

/* Don't forget focus indicators! */
/* Focus outlines need 3:1 contrast against adjacent colors */
:focus-visible {
  /* Must contrast with both the element AND the background */
  outline: 2px solid #0050aa; /* 3:1 minimum against surrounding colors */
  outline-offset: 2px;
}`}
      </CodeBlock>

      {/* ── Common Bugs & Fixes ───────────────────────────── */}
      <h2>Common Accessibility Bugs &amp; Fixes</h2>

      <CodeBlock language="html" title="Top 10 A11y Bugs and Fixes">
{`<!-- 1. Missing alt text -->
<!-- ❌ <img src="hero.jpg" /> -->
<!-- ✅ <img src="hero.jpg" alt="Team celebrating launch" /> -->

<!-- 2. Missing form labels -->
<!-- ❌ <input type="email" placeholder="Email" /> -->
<!-- ✅ <label for="email">Email</label><input id="email" type="email" /> -->

<!-- 3. Low contrast: ❌ #aaa on #fff (2.3:1) → ✅ #595959 on #fff (7:1) -->
<!-- 4. Removed focus: ❌ *:focus{outline:none} → ✅ :focus-visible{outline:2px solid} -->
<!-- 5. Div buttons: ❌ <div onclick=""> → ✅ <button> -->
<!-- 6. No lang: ❌ <html> → ✅ <html lang="en"> -->
<!-- 7. Empty links: ❌ <a href><img/></a> → ✅ <a href><img alt="Profile"/></a> -->
<!-- 8. No skip nav → ✅ <a href="#main" class="skip-link">Skip to content</a> -->
<!-- 9. Autoplay: ❌ <video autoplay> → ✅ <video> (user controls) -->
<!-- 10. Silent updates: ❌ <div>Saved</div> → ✅ <div role="status">Saved</div> -->`}
      </CodeBlock>

      {/* ── CI Integration ────────────────────────────────── */}
      <h2>CI Integration Strategy</h2>

      <FlowChart
        title="A11y Testing in CI/CD Pipeline"
        chart={"graph LR\n  DEV[Developer writes code] --> LINT[ESLint jsx-a11y plugin]\n  LINT --> UNIT[jest-axe unit tests]\n  UNIT --> BUILD[Build application]\n  BUILD --> E2E[Playwright axe-core E2E]\n  E2E --> LH[Lighthouse CI audit]\n  LH --> PASS{Score >= 90%?}\n  PASS -->|Yes| DEPLOY[Deploy]\n  PASS -->|No| FAIL[Block merge - fix violations]"}
      />

      <CodeBlock language="javascript" title="GitHub Actions A11y Pipeline">
{`// .github/workflows/accessibility.yml
// name: Accessibility Tests
// on: pull_request
// jobs:
//   a11y:
//     runs-on: ubuntu-latest
//     steps:
//       - uses: actions/checkout@v7
//       - run: npm ci
//       - name: Lint (jsx-a11y)
//         run: npx eslint . --max-warnings 0
//       - name: Unit tests (jest-axe)
//         run: npx jest --testPathPattern=a11y
//       - run: npm run build
//       - run: npx serve -s build -l 3000 &
//       - name: E2E a11y
//         run: npx playwright test tests/a11y/
//       - uses: treosh/lighthouse-ci-action@v11
//         with:
//           urls: http://localhost:3000/
// Block merge on failure — regressions are expensive to fix later.`}
      </CodeBlock>

      <InfoBox variant="success" title="Shift Left on Accessibility">
        The earlier you catch a11y issues, the cheaper they are to fix. A linting error costs 30
        seconds. A jest-axe failure costs 5 minutes. A screen reader bug found in QA costs hours.
        A lawsuit costs millions. Invest in automated checks and make them blocking in CI.
      </InfoBox>

      <InteractiveChallenge
        question={"You will see automated a11y coverage quoted as \"20-30%\" and as \"57%\" (Deque's study of 13,000+ pages with axe). Why do the two figures differ so much, and what does that change?"}
        options={[
          "The 57% figure is vendor marketing; 20-30% is the real number, so automation is barely worth running",
          "They use different denominators — 20-30% counts WCAG success criteria a machine can decide, 57% counts share of total issues found. Automation is worth more than the old number suggests, and a manual pass is still mandatory under either figure.",
          "axe simply got better, so the old figure is obsolete and automation now covers most of what matters",
          "It is a sampling difference; averaged over enough sites the true value is about 40%"
        ]}
        correctIndex={1}
        explanation={"Both numbers are honest measurements of different things. Counting success criteria is a harsh denominator: \"is the alt text meaningful\" is one criterion and is permanently un-automatable, so tools score 20-30%. Counting issue volume is kinder: real pages fail the machine-checkable criteria hundreds of times each, so Deque measured 57% of found issues fully covered. Neither figure changes the strategy — automation clears the high-volume, unambiguous defects (missing alt text, low contrast, invalid ARIA, missing labels) and cannot evaluate whether alt text is meaningful, whether focus order is logical, or whether a screen reader user can actually complete the flow. Estimates vary by methodology; quote the denominator with the number."}
        language="html"
      />

      <InteractiveChallenge
        question={"In React Testing Library, which query should you use FIRST when looking for a button labeled \"Submit\"?"}
        options={[
          "getByTestId('submit-button')",
          "getByText('Submit')",
          "getByRole('button', { name: /submit/i })",
          "querySelector('button')"
        ]}
        correctIndex={2}
        explanation={"getByRole is the preferred query because it validates that the element has the correct accessible role AND name. If getByRole can't find your element, it means the element isn't accessible — the test failure is telling you to fix your HTML, not to use a weaker query."}
        language="jsx"
      />

      {/* ── Wrap-up ───────────────────────────────────────── */}
      <h2>Accessibility Is a Journey</h2>
      <p>
        You now have the foundation: WCAG principles, semantic HTML, ARIA, keyboard navigation, and
        a multi-layered testing strategy. Accessibility isn't a one-time checklist — it's a practice
        you build into every feature, every PR, and every design review. Start with the automated
        tools, add keyboard testing to your development workflow, and test with a screen reader at
        least once per sprint. Your users — all of them — will benefit.
      </p>

      <CodeBlock language="javascript" title="Your A11y Action Items">
{`// Today: Add eslint-plugin-jsx-a11y + jest-axe + Lighthouse CI
// Today: Test login flow keyboard-only + try VoiceOver (Cmd+F5)
// This week: Audit headings, alt text, form labels, skip nav
// This sprint: Screen-reader test top 3 flows, check contrast,
//   verify modal focus trapping, add aria-live for dynamic content`}
      </CodeBlock>

    </LessonLayout>
  );
}

export default function TestingPage() {
  return <Testing />;
}
