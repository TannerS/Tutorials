import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TestingUnit() {
  return (
    <LessonLayout
      title="Unit Testing"
      sectionId="testing"
      lessonIndex={1}
      prev={{ path: '/testing/intro', label: 'Testing Introduction' }}
      next={{ path: '/testing/mocking', label: 'Mocking' }}
    >
      <h2>What Makes a Good Unit Test?</h2>
      <p>
        A unit test verifies a single unit of behavior in complete isolation — no database, no
        network, no filesystem. The goal is not to "test code" but to <em>document behavior</em>:
        given this situation, when this happens, this is the expected outcome. Tests that verify
        behavior survive refactoring; tests that verify implementation details break every time
        you rename a method.
      </p>

      <FlowChart
        title="Unit Test Anatomy"
        chart={"graph LR\n  A[Arrange - set up context] --> B[Act - call the code]\n  B --> C[Assert - verify outcome]\n  D[Mock dependencies] --> A\n  C --> E[Pass or Fail]\n  E --> F[Instant feedback]"}
      />

      <CodeBlock language="java" title="JUnit 5 + AssertJ Essentials">
{`import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock  OrderRepository repo;
    @Mock  PaymentGateway payment;
    @Mock  EmailService email;
    @InjectMocks OrderService service;  // dependencies injected automatically

    // === ARRANGE-ACT-ASSERT PATTERN ===
    @Test
    @DisplayName("should apply discount for orders over $100")
    void applyBulkDiscount() {
        // Arrange — set up test context
        Order order = new Order("O-1", List.of(
            new LineItem("Widget", 60.00, 2)   // total = $120
        ));
        when(repo.findById("O-1")).thenReturn(Optional.of(order));

        // Act — invoke the behavior under test
        BigDecimal finalPrice = service.calculateFinalPrice("O-1");

        // Assert — verify expected outcome
        assertThat(finalPrice)
            .isEqualByComparingTo(new BigDecimal("108.00")); // 10% discount
        verify(repo).findById("O-1");   // verify collaborator was called
        verifyNoInteractions(email);     // email should NOT be sent during pricing
    }

    // === EXCEPTION TESTING ===
    @Test
    void throwsWhenOrderNotFound() {
        when(repo.findById("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.calculateFinalPrice("MISSING"))
            .isInstanceOf(OrderNotFoundException.class)
            .hasMessageContaining("MISSING")
            .hasNoCause();
    }

    // === PARAMETERIZED TESTS — test multiple inputs ===
    @ParameterizedTest
    @CsvSource({
        "50.00,  0,  50.00",   // below threshold — no discount
        "100.00, 10, 90.00",   // exactly at threshold
        "200.00, 10, 180.00",  // above threshold
        "0.00,   0,  0.00",    // edge case: empty order
    })
    void calculateDiscount(double subtotal, double discountPct, double expected) {
        assertThat(service.applyDiscount(
            new BigDecimal(subtotal),
            discountPct
        )).isEqualByComparingTo(new BigDecimal(expected));
    }

    // === TEST LIFECYCLE ===
    @BeforeEach
    void setUp() {
        // runs before each @Test — reset shared state here
    }

    @AfterEach
    void tearDown() {
        // runs after each @Test — cleanup if needed
    }

    @BeforeAll
    static void setUpOnce() {
        // runs once before all tests in class — expensive setup (test containers, etc.)
    }

    @Nested  // group related tests in an inner class
    @DisplayName("when payment fails")
    class WhenPaymentFails {
        @Test void shouldNotSaveOrder() { /* ... */ }
        @Test void shouldNotSendConfirmation() { /* ... */ }
        @Test void shouldReturnPaymentError() { /* ... */ }
    }
}`}
      </CodeBlock>

      <h2>AssertJ — Fluent Assertions</h2>

      <CodeBlock language="java" title="AssertJ Assertion Patterns">
{`import static org.assertj.core.api.Assertions.*;

// String assertions
assertThat(user.getEmail())
    .isNotNull()
    .isNotEmpty()
    .endsWith("@example.com")
    .doesNotContain("admin");

// Numeric assertions
assertThat(price)
    .isPositive()
    .isBetween(80.0, 120.0)
    .isCloseTo(100.0, within(0.01));  // floating-point tolerance

// Collection assertions
assertThat(orders)
    .hasSize(3)
    .isNotEmpty()
    .contains(order1, order2)
    .doesNotContain(deletedOrder)
    .allMatch(o -> o.getStatus() != null)
    .anyMatch(o -> o.getTotal().compareTo(BigDecimal.ZERO) > 0);

// Extract fields from objects in a list
assertThat(users)
    .extracting(User::getName, User::getEmail)
    .containsExactlyInAnyOrder(
        tuple("Alice", "alice@example.com"),
        tuple("Bob", "bob@example.com")
    );

// Object field-by-field comparison (ignoring equals())
assertThat(actualUser)
    .usingRecursiveComparison()
    .ignoringFields("id", "createdAt")  // exclude generated fields
    .isEqualTo(expectedUser);

// Soft assertions — report ALL failures, not just first
SoftAssertions soft = new SoftAssertions();
soft.assertThat(user.getName()).isEqualTo("Alice");
soft.assertThat(user.getEmail()).endsWith("@example.com");
soft.assertThat(user.getAge()).isBetween(18, 100);
soft.assertAll();  // throws AssertionError listing ALL failures

// Exception assertions
assertThatThrownBy(() -> service.create(null))
    .isInstanceOf(IllegalArgumentException.class)
    .hasMessage("Name must not be null")
    .hasNoCause();

assertThatCode(() -> service.update(validRequest))
    .doesNotThrowAnyException();`}
      </CodeBlock>

      <h2>Testing with Jest and Vitest (JavaScript)</h2>

      <CodeBlock language="javascript" title="Jest / Vitest Unit Testing">
{`// Vitest (recommended for Vite projects) — Jest-compatible API
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartService } from './CartService';

describe('CartService', () => {
  let cart;

  beforeEach(() => {
    cart = new CartService();  // fresh instance per test
  });

  describe('addItem', () => {
    it('adds item to empty cart', () => {
      cart.addItem({ id: '1', name: 'Widget', price: 9.99 });
      expect(cart.items).toHaveLength(1);
      expect(cart.total).toBeCloseTo(9.99);
    });

    it('increments quantity when same item added twice', () => {
      const item = { id: '1', name: 'Widget', price: 9.99 };
      cart.addItem(item);
      cart.addItem(item);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('throws for negative price', () => {
      expect(() => cart.addItem({ id: '1', name: 'X', price: -1 }))
        .toThrow('Price must be positive');
    });
  });

  // Test.each — parameterized tests
  it.each([
    [100, 0.10, 90],
    [50,  0.20, 40],
    [200, 0.05, 190],
  ])('applies %d% discount to $%i correctly', (total, rate, expected) => {
    expect(CartService.applyDiscount(total, rate)).toBeCloseTo(expected);
  });

  // Mocking with vi.fn()
  it('calls analytics when item added', () => {
    const mockAnalytics = { track: vi.fn() };
    const cartWithAnalytics = new CartService({ analytics: mockAnalytics });

    cartWithAnalytics.addItem({ id: '1', name: 'Widget', price: 9.99 });

    expect(mockAnalytics.track).toHaveBeenCalledOnce();
    expect(mockAnalytics.track).toHaveBeenCalledWith('item_added', {
      itemId: '1',
      price: 9.99,
    });
  });
});`}
      </CodeBlock>

      <h2>Testing React Components with Testing Library</h2>

      <CodeBlock language="jsx" title="React Testing Library — Testing Behavior">
{`import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LoginForm from './LoginForm';

// Testing Library philosophy: test what users see and do,
// not component internals (state, props, refs)

describe('LoginForm', () => {
  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    // Act like a user — click without filling in email
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Assert what the user sees
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('calls onSubmit with credentials when form is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ success: true });

    render(<LoginForm onSubmit={onSubmit} />);

    // Fill in the form
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecretPass1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify callback was called correctly
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'SecretPass1!',
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    // Delay the mock to test loading state
    const onSubmit = vi.fn(() => new Promise(() => {})); // never resolves

    render(<LoginForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecretPass1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('displays server error message', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Testing Library Query Priority">
        <p>
          React Testing Library's queries have a recommended priority order — use the most
          accessible query first: <code>getByRole</code> (preferred — mirrors what screen readers
          see), then <code>getByLabelText</code> (form elements), then <code>getByPlaceholderText</code>,
          then <code>getByText</code>, and finally <code>getByTestId</code> (last resort — adds
          test-only attributes). Preferring role-based queries ensures your tests verify that
          the UI is accessible, not just that it renders.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What pattern should unit tests follow for structure?"
        options={[
          "Given-When-Then or Arrange-Act-Assert — set up context, execute behavior, verify outcome",
          "Setup-Execute-Verify-Teardown (SEVT) — always clean up after every assertion",
          "Input-Process-Output with full system integration on every test",
          "Mock everything including the class under test to isolate perfectly"
        ]}
        correctIndex={0}
        explanation="Both Given-When-Then (BDD) and Arrange-Act-Assert (AAA) describe the same three-phase structure: set up the test context (Given/Arrange), execute the behavior under test (When/Act), verify the outcome (Then/Assert). This structure makes tests self-documenting — a reader can understand what the test verifies without reading the implementation. Never mock the class under test itself; only mock its dependencies."
      />

      <InteractiveChallenge
        question="Why does React Testing Library recommend getByRole over getByTestId for finding elements?"
        options={[
          "getByRole is faster at runtime than getByTestId",
          "getByRole queries the DOM the same way assistive technology does — tests that use it verify accessibility automatically",
          "getByTestId requires adding extra HTML attributes, which getByRole avoids",
          "getByRole is newer and will eventually replace all other query methods"
        ]}
        correctIndex={1}
        explanation="getByRole queries elements by their ARIA role — the same way screen readers navigate. A test that finds a button via getByRole('button', {name: /submit/i}) simultaneously verifies that the element is a real button (not a div with onClick), that it has an accessible name, and that the name is correct. getByTestId adds data-testid attributes that exist only for tests and tell you nothing about accessibility or user experience."
      />
    </LessonLayout>
  );
}
