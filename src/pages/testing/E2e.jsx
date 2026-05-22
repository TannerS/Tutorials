import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TestingE2e() {
  return (
    <LessonLayout
      title="End-to-End Testing"
      sectionId="testing"
      lessonIndex={4}
      prev={{ path: '/testing/integration', label: 'Integration Testing' }}
      next={{ path: '/testing/bestpractices', label: 'Testing Best Practices' }}
    >
      <h2>What Are E2E Tests?</h2>
      <p>
        End-to-end tests verify complete user workflows through a real browser against a running
        application. They are the most realistic test type — they find problems no unit or
        integration test catches: broken routing, missing environment variables, auth cookie
        issues, or UI bugs. The trade-off is cost: E2E tests are slow (seconds to minutes each),
        sometimes flaky, and expensive to maintain. Focus them on your most critical user journeys.
      </p>

      <FlowChart
        title="Playwright Test Flow"
        chart={"graph LR\n  A[Test starts browser] --> B[Navigate to page]\n  B --> C[Interact via locators]\n  C --> D[Wait for assertions]\n  D --> E[Pass or Fail]\n  F[Network requests] --> C\n  G[Real server + DB] --> F"}
      />

      <h2>Playwright — Modern E2E Testing</h2>

      <CodeBlock language="javascript" title="Playwright Setup and Configuration">
{`// Install: npm install -D @playwright/test
// Initialize: npx playwright install (downloads browsers)

// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,          // 30s per test
  retries: process.env.CI ? 2 : 0,  // retry flaky tests in CI
  workers: process.env.CI ? 1 : 4,  // parallel workers

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',   // capture trace on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile',   use: { ...devices['iPhone 15'] } },
  ],

  // Start dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Playwright Locators and Interactions">
{`import { test, expect } from '@playwright/test';

// ── LOCATOR PRIORITY — from most to least preferred ───────────────
// 1. Role-based (most accessible and resilient)
page.getByRole('button', { name: 'Submit order' })
page.getByRole('heading', { name: 'Checkout', level: 1 })
page.getByRole('link', { name: 'Sign in' })
page.getByRole('textbox', { name: 'Email address' })
page.getByRole('checkbox', { name: 'Remember me' })

// 2. Label (form elements)
page.getByLabel('Password')
page.getByLabel('Date of birth')

// 3. Placeholder
page.getByPlaceholder('Search products...')

// 4. Text content
page.getByText('Order confirmed!')
page.getByText('Error', { exact: false })  // partial match

// 5. Test ID (last resort — add data-testid to element)
page.getByTestId('cart-item-count')

// ── INTERACTIONS ─────────────────────────────────────────────────
await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.getByRole('combobox', { name: 'Country' }).selectOption('US');
await page.getByRole('checkbox', { name: 'Agree to terms' }).check();
await page.getByRole('textbox', { name: 'Search' }).press('Enter');
await page.keyboard.press('Escape');  // dismiss modals

// ── NAVIGATION AND WAITING ────────────────────────────────────────
await page.goto('/checkout');
await page.waitForURL('/order-confirmed');  // wait for redirect
await page.waitForLoadState('networkidle'); // wait for all requests done

// ── ASSERTIONS (auto-retry until timeout) ────────────────────────
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveTitle('Dashboard | MyApp');
await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
await expect(page.getByRole('alert')).toHaveText('Order placed successfully');
await expect(page.getByTestId('cart-count')).toHaveText('3');
await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();`}
      </CodeBlock>

      <h2>Complete E2E Test Examples</h2>

      <CodeBlock language="javascript" title="Authentication and Protected Routes">
{`import { test, expect } from '@playwright/test';

// ── FIXTURE: log in once, reuse across tests ──────────────────────
// fixtures/auth.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Auto-login fixture — runs before tests that need it
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/dashboard');
    await use(page);  // hand authenticated page to the test
  },
});

// ── AUTH TESTS ────────────────────────────────────────────────────
test.describe('Authentication', () => {

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    // Verify nav shows logged-in state
    await expect(page.getByRole('link', { name: 'Sign in' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });

  test('invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Stays on login
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('alert')).toHaveText(/invalid email or password/i);
    // Password field cleared for security
    await expect(page.getByLabel('Password')).toHaveValue('');
  });

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirect=\/dashboard/);
  });

  // Using the authenticated fixture
  test('logout clears session', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(page).toHaveURL('/');
    // Can no longer access protected page
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Complete Checkout Flow">
{`import { test, expect } from '@playwright/test';

test.describe('Shopping Cart and Checkout', () => {

  test.beforeEach(async ({ page }) => {
    // Log in before each cart test
    await page.goto('/login');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/dashboard');
  });

  test('add product to cart and verify count', async ({ page }) => {
    await page.goto('/products');

    // Add first product
    const firstProduct = page.getByTestId('product-card').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();

    // Cart count updates immediately (optimistic update)
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    // Toast notification appears
    await expect(page.getByRole('status')).toContainText('Added to cart');
    await expect(page.getByRole('status')).not.toBeVisible({ timeout: 3000 });
  });

  test('complete checkout flow', async ({ page }) => {
    // Add a product
    await page.goto('/products');
    await page.getByTestId('product-WIDGET-1')
      .getByRole('button', { name: 'Add to cart' }).click();

    // Go to cart
    await page.getByRole('link', { name: 'Cart (1)' }).click();
    await expect(page).toHaveURL('/cart');
    await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();

    // Proceed to checkout
    await page.getByRole('button', { name: 'Proceed to checkout' }).click();
    await expect(page).toHaveURL('/checkout');

    // Fill shipping
    await page.getByLabel('Full name').fill('Alice Smith');
    await page.getByLabel('Address').fill('123 Main St');
    await page.getByLabel('City').fill('Seattle');
    await page.getByLabel('ZIP Code').fill('98101');
    await page.getByLabel('Country').selectOption('US');

    // Fill payment
    await page.getByLabel('Card number').fill('4242424242424242');
    await page.getByLabel('Expiry').fill('12/26');
    await page.getByLabel('CVV').fill('123');

    // Submit
    await page.getByRole('button', { name: 'Place order' }).click();

    // Confirm order
    await expect(page).toHaveURL(/\/orders\/[A-Z0-9-]+\/confirmation/);
    await expect(page.getByRole('heading', { name: 'Order confirmed!' })).toBeVisible();
    await expect(page.getByTestId('order-number')).toBeVisible();

    // Cart is cleared
    await expect(page.getByTestId('cart-count')).not.toBeVisible();
  });
});`}
      </CodeBlock>

      <h2>API Mocking and Network Interception</h2>

      <CodeBlock language="javascript" title="Playwright Network Interception">
{`// Playwright can intercept and mock network requests
// Use for: testing error states, payment APIs, third-party services

test('shows error when payment fails', async ({ page }) => {
  // Intercept POST to payment endpoint
  await page.route('/api/orders', async (route) => {
    await route.fulfill({
      status: 402,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Card declined', code: 'PAYMENT_DECLINED' }),
    });
  });

  // Complete checkout form...
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page.getByRole('alert')).toHaveText(
    /your card was declined/i
  );
  await expect(page).toHaveURL('/checkout'); // stays on checkout
});

test('handles slow API gracefully', async ({ page }) => {
  // Delay API response to test loading states
  await page.route('/api/products*', async (route) => {
    await new Promise(r => setTimeout(r, 2000)); // 2 second delay
    await route.continue();
  });

  await page.goto('/products');
  await expect(page.getByTestId('loading-skeleton')).toBeVisible();
  await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 5000 });
});

// Screenshot and visual comparison
test('product page matches screenshot', async ({ page }) => {
  await page.goto('/products/WIDGET-1');
  await expect(page).toHaveScreenshot('product-detail.png', {
    maxDiffPixels: 100,    // allow minor rendering differences
    threshold: 0.2,         // 20% pixel difference threshold
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="E2E Test Strategy — What to Test">
        <p>
          E2E tests are expensive — 10x slower and 10x flakier than unit tests. Limit them to:
        </p>
        <ul>
          <li><strong>Critical paths</strong>: login, signup, checkout, primary CRUD</li>
          <li><strong>Auth boundaries</strong>: protected routes, role-based access</li>
          <li><strong>Integrations</strong>: payment flow, email confirmation, SSO login</li>
          <li><strong>Cross-browser</strong>: layout and interaction differences</li>
        </ul>
        <p>
          Run a fast smoke suite (5–10 tests) on every PR. Run the full E2E suite nightly
          or before releases. Never use E2E to test business logic — that belongs in unit tests.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Why is getByRole() preferred over CSS class selectors for Playwright locators?"
        options={[
          "getByRole() is significantly faster than CSS selectors at runtime",
          "getByRole() tests accessibility semantics and is resilient to CSS refactoring — if the role exists, the element is accessible",
          "CSS class selectors are not supported in Playwright's locator API",
          "getByRole() works across all browsers while CSS selectors are browser-specific"
        ]}
        correctIndex={1}
        explanation="getByRole() selects elements by their ARIA role — the same way screen readers navigate. A test using getByRole('button', {name: 'Submit'}) passes only if the element has the button role AND the accessible name 'Submit'. This means: (1) tests survive CSS refactoring and class renames, (2) tests verify accessibility — if the locator finds it, screen readers can too, (3) tests are more readable and intention-revealing."
      />

      <InteractiveChallenge
        question="When should you use network interception in Playwright tests?"
        options={[
          "Always — intercept all API calls to make tests deterministic",
          "For testing specific error states and third-party services that cannot be controlled in the test environment",
          "Network interception is a code smell — E2E tests should always use real APIs",
          "Only in CI environments, never locally"
        ]}
        correctIndex={1}
        explanation="Network interception shines for testing conditions that are hard to reproduce with real APIs: payment declines, server errors, network timeouts, or third-party services (Stripe, SendGrid) that you cannot control. For your own API endpoints, use real requests against a test database when possible — intercepting everything makes E2E tests closer to integration tests and defeats the purpose of testing the full stack."
      />
    </LessonLayout>
  );
}
