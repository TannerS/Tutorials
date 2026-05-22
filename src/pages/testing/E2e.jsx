import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function E2e() {
  return (
    <LessonLayout
      title="End-to-End Testing"
      sectionId="testing"
      lessonIndex={4}
      prev={{ path: '/testing/integration', label: 'Integration Testing' }}
      next={{ path: '/testing/bestpractices', label: 'Testing Best Practices' }}
    >
      <h2>E2E Testing Philosophy</h2>
      <p>
        End-to-end tests simulate real user workflows through the entire application stack —
        browser, frontend, API, and database. They provide the highest confidence that your
        system works but are the slowest and most expensive to maintain.
      </p>

      <FlowChart
        title="E2E Test Flow"
        chart={"graph LR\n  BROWSER[\"Browser\\n(Automated)\"] --> FE[\"Frontend\\n(React App)\"]\n  FE --> API[\"Backend API\\n(Spring/Express)\"]\n  API --> DB[\"Database\\n(Real or Test)\"]"}
      />

      <InfoBox variant="warning" title="E2E Tests: Less Is More">
        Write E2E tests for critical user journeys only — login, checkout, signup,
        core workflows. Don&apos;t duplicate what unit and integration tests already cover.
        A good rule: if a unit test can catch the bug, don&apos;t write an E2E test for it.
      </InfoBox>

      <h2>Playwright Overview</h2>
      <p>
        Playwright is a modern E2E testing framework by Microsoft. It supports Chromium,
        Firefox, and WebKit with a single API, runs tests in parallel, and has excellent
        auto-wait capabilities.
      </p>

      <h3>Setup</h3>
      <CodeBlock language="bash" title="Install Playwright">
{`# Initialize a new Playwright project
npm init playwright@latest

# Or add to existing project
npm install --save-dev @playwright/test
npx playwright install`}
      </CodeBlock>

      <CodeBlock language="javascript" title="playwright.config.js">
{`import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});`}
      </CodeBlock>

      <h3>Core API</h3>
      <CodeBlock language="javascript" title="Navigation and Actions">
{`import { test, expect } from '@playwright/test';

test('user login flow', async ({ page }) => {
  // Navigation
  await page.goto('/login');

  // Fill form fields
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'securePass123');

  // Click actions
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForURL('/dashboard');

  // Verify content
  await expect(page.locator('h1')).toHaveText('Welcome Back');
});`}
      </CodeBlock>

      <h3>Locator Strategies</h3>
      <p>
        Playwright provides semantic locators that mirror how users find elements.
        Always prefer accessible locators over CSS selectors or test IDs.
      </p>

      <CodeBlock language="javascript" title="Locator Priority (Best to Worst)">
{`// 1. getByRole — BEST: accessible, resilient to markup changes
const submitBtn = page.getByRole('button', { name: 'Submit' });
const emailInput = page.getByRole('textbox', { name: 'Email' });
const nav = page.getByRole('navigation');
const heading = page.getByRole('heading', { level: 1 });

// 2. getByLabel — Great for form fields
const passwordField = page.getByLabel('Password');

// 3. getByText — Good for static content
const welcomeMsg = page.getByText('Welcome to the app');

// 4. getByPlaceholder — Acceptable for inputs
const searchBox = page.getByPlaceholder('Search...');

// 5. getByTestId — Last resort when no semantic option exists
const customWidget = page.getByTestId('color-picker');`}
      </CodeBlock>

      <InfoBox variant="tip" title="Locator Best Practice">
        Use <code>getByRole</code> as your default. It tests accessibility for free —
        if your locator can&apos;t find the element by role, your app likely has an
        accessibility problem. Fall back to <code>getByTestId</code> only for custom
        components with no accessible role.
      </InfoBox>

      <h3>Assertions</h3>
      <CodeBlock language="javascript" title="Playwright Assertions">
{`import { test, expect } from '@playwright/test';

test('dashboard content verification', async ({ page }) => {
  await page.goto('/dashboard');

  // Visibility and text
  await expect(page.getByRole('heading')).toBeVisible();
  await expect(page.getByRole('heading')).toHaveText('Dashboard');

  // URL and title
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page).toHaveTitle('My App - Dashboard');

  // Element state
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
  await expect(page.getByRole('checkbox')).toBeChecked();

  // Count
  await expect(page.getByRole('listitem')).toHaveCount(5);
});`}
      </CodeBlock>

      <h2>Page Object Model</h2>
      <p>
        The Page Object Model (POM) encapsulates page interactions into reusable classes,
        making tests more readable and easier to maintain.
      </p>

      <FlowChart
        title="Page Object Model Pattern"
        chart={"graph TD\n  TEST[\"Test File\\nDescribes user scenarios\"] --> POM[\"Page Object\\nEncapsulates page interactions\"]\n  POM --> PAGE[\"Actual Page\\nHTML/DOM elements\"]"}
      />

      <CodeBlock language="javascript" title="Page Object Class">
{`// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Log In' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message) {
    await expect(this.errorMessage).toHaveText(message);
  }
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Using Page Objects in Tests">
{`import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Authentication', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login('admin@example.com', 'password123');

    await expect(page).toHaveURL('/dashboard');
    await dashboardPage.expectWelcomeMessage('Welcome, Admin');
  });

  test('invalid credentials show error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('wrong@example.com', 'badpassword');

    await loginPage.expectError('Invalid email or password');
    await expect(page).toHaveURL('/login');
  });
});`}
      </CodeBlock>

      <h2>API Testing with Playwright</h2>
      <CodeBlock language="javascript" title="API Tests Without a Browser">
{`import { test, expect } from '@playwright/test';

test.describe('Users API', () => {
  let createdUserId;

  test('POST /api/users — create user', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: { name: 'Alice', email: 'alice@test.com' },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.name).toBe('Alice');
    createdUserId = body.id;
  });

  test('GET /api/users/:id — fetch user', async ({ request }) => {
    const response = await request.get(\`/api/users/\${createdUserId}\`);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({
      name: 'Alice',
      email: 'alice@test.com',
    });
  });

  test('DELETE /api/users/:id — remove user', async ({ request }) => {
    const response = await request.delete(\`/api/users/\${createdUserId}\`);
    expect(response.status()).toBe(204);

    const getResponse = await request.get(\`/api/users/\${createdUserId}\`);
    expect(getResponse.status()).toBe(404);
  });
});`}
      </CodeBlock>

      <h2>Visual Regression Testing</h2>
      <CodeBlock language="javascript" title="Screenshot Comparison">
{`test('homepage visual regression', async ({ page }) => {
  await page.goto('/');

  // Full page screenshot comparison
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100,
  });

  // Element-level screenshot
  const header = page.getByRole('banner');
  await expect(header).toHaveScreenshot('header.png');

  // With masking for dynamic content
  await expect(page).toHaveScreenshot('dashboard.png', {
    mask: [
      page.locator('.timestamp'),
      page.locator('.user-avatar'),
    ],
  });
});`}
      </CodeBlock>

      <h2>CI Integration</h2>
      <CodeBlock language="yaml" title="GitHub Actions Workflow">
{`name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npx playwright install --with-deps

      - run: npx playwright test
        env:
          CI: true

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7`}
      </CodeBlock>

      <h2>Cypress vs Playwright</h2>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Playwright</th>
            <th>Cypress</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Browser support</td>
            <td>Chromium, Firefox, WebKit</td>
            <td>Chromium, Firefox, WebKit (limited)</td>
          </tr>
          <tr>
            <td>Language</td>
            <td>JS, TS, Python, .NET, Java</td>
            <td>JavaScript/TypeScript only</td>
          </tr>
          <tr>
            <td>Parallel execution</td>
            <td>Built-in, free</td>
            <td>Paid (Cypress Cloud)</td>
          </tr>
          <tr>
            <td>Multi-tab/multi-origin</td>
            <td>Full support</td>
            <td>Limited</td>
          </tr>
          <tr>
            <td>Auto-waiting</td>
            <td>Built-in for all actions</td>
            <td>Built-in with retry-ability</td>
          </tr>
          <tr>
            <td>API testing</td>
            <td>First-class support</td>
            <td><code>cy.request()</code></td>
          </tr>
          <tr>
            <td>Visual testing</td>
            <td>Built-in screenshots</td>
            <td>Plugin required</td>
          </tr>
          <tr>
            <td>Test runner UI</td>
            <td>HTML report, trace viewer</td>
            <td>Interactive runner (great DX)</td>
          </tr>
          <tr>
            <td>Community</td>
            <td>Growing rapidly</td>
            <td>Large, mature ecosystem</td>
          </tr>
          <tr>
            <td>iframes</td>
            <td>Full support</td>
            <td>Limited support</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="Our Recommendation">
        For new projects, Playwright is generally the better choice — it&apos;s faster, supports
        more browsers, and has free parallelism. Cypress still excels in developer experience
        with its interactive test runner and time-travel debugging. Both are excellent tools.
      </InfoBox>

      <h2>E2E Testing Best Practices</h2>
      <CodeBlock language="javascript" title="Test Isolation with API Seeding">
{`import { test, expect } from '@playwright/test';

// Each test seeds its own data via API — no shared state
test.describe('Order Management', () => {
  let orderId;

  test.beforeEach(async ({ request }) => {
    // Seed test data via API
    const response = await request.post('/api/test/seed', {
      data: {
        users: [{ id: 'user-1', name: 'Alice' }],
        orders: [{ id: 'order-1', userId: 'user-1', status: 'PENDING' }],
      },
    });
    expect(response.ok()).toBeTruthy();
  });

  test.afterEach(async ({ request }) => {
    // Clean up test data
    await request.post('/api/test/cleanup');
  });

  test('should display order details', async ({ page }) => {
    await page.goto('/orders/order-1');
    await expect(page.getByText('PENDING')).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
  });
});`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Which Playwright locator strategy should be your FIRST choice?"}
        options={[
          "page.locator('.css-class')",
          "page.getByTestId('element-id')",
          "page.getByRole('button', { name: 'Submit' })",
          "page.locator('#element-id')"
        ]}
        correctIndex={2}
        explanation="getByRole is the preferred locator because it queries elements the way assistive technology and users find them. It also doubles as an accessibility check — if getByRole can't find your element, it may not be accessible."
        language="javascript"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Write E2E tests only for critical user journeys — quality over quantity</li>
        <li>Playwright is the modern standard for E2E testing</li>
        <li>Use semantic locators (getByRole, getByLabel) over CSS selectors</li>
        <li>Encapsulate page interactions with the Page Object Model</li>
        <li>Seed test data via APIs for reliable, isolated tests</li>
        <li>Run E2E tests in CI with artifact collection on failure</li>
        <li>Visual regression testing catches UI changes that other tests miss</li>
      </ul>
    </LessonLayout>
  );
}
