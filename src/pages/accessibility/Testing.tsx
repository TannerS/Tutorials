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
        Automated tools catch roughly 30–50% of accessibility issues. The rest require manual testing,
        screen reader verification, and human judgment. A robust a11y testing strategy combines all
        three layers: automated CI checks, manual audits, and assistive technology testing.
      </p>

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

// .eslintrc.js
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
//       - uses: actions/checkout@v4
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
{`/* WCAG 2.1 AA Requirements: */
/* Normal text (< 18pt): minimum 4.5:1 contrast ratio */
/* Large text (≥ 18pt or ≥ 14pt bold): minimum 3:1 */
/* UI components and graphics: minimum 3:1 */

/* ❌ Fails AA — gray text on white (ratio ~2.5:1) */
.bad-contrast {
  color: #999999;
  background: #ffffff;
}

/* ✅ Passes AA — dark gray on white (ratio ~7:1) */
.good-contrast {
  color: #333333;
  background: #ffffff;
}

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
//       - uses: actions/checkout@v4
//       - run: npm ci
//       - name: Lint (jsx-a11y)
//         run: npx eslint src/ --ext .jsx,.tsx
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
        question={"What percentage of accessibility issues can automated tools (like axe-core) typically detect?"}
        options={[
          "80-90%",
          "30-50%",
          "10-20%",
          "60-70%"
        ]}
        correctIndex={1}
        explanation={"Automated tools catch roughly 30-50% of WCAG issues. They're great at detecting missing alt text, low contrast, invalid ARIA, and missing labels — but they cannot evaluate whether alt text is meaningful, whether focus order is logical, or whether the user experience actually works with a screen reader. Manual testing is always required."}
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
