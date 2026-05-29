import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Unit() {
  return (
    <LessonLayout
      title="Unit Testing (JUnit & Jest)"
      sectionId="testing"
      lessonIndex={1}
      prev={{ path: '/testing/intro', label: 'Testing Pyramid & Philosophy' }}
      next={{ path: '/testing/mocking', label: 'Mocking & Test Doubles' }}
    >
      <h2>What Is a Unit Test?</h2>
      <p>
        A unit test verifies a single &quot;unit&quot; of code — typically a method or function —
        in isolation from its dependencies. Unit tests are fast, deterministic, and should
        pinpoint exactly where a failure occurs.
      </p>

      <FlowChart
        title="Unit Test Anatomy"
        chart={"graph LR\n  A[\"Arrange\\nSet up test data\"] --> B[\"Act\\nCall the method\"]\n  B --> C[\"Assert\\nVerify the result\"]"}
      />

      <h2>JUnit 5 — Java Unit Testing</h2>

      <h3>Setup &amp; Dependencies</h3>
      <CodeBlock language="java" title="Maven Dependencies (pom.xml)">
{`<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.2</version>
    <scope>test</scope>
</dependency>`}
      </CodeBlock>

      <h3>Core Annotations</h3>
      <CodeBlock language="java" title="JUnit 5 Lifecycle Annotations">
{`import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class OrderServiceTest {

    private OrderService orderService;

    @BeforeAll
    static void setupClass() {
        // Runs ONCE before all tests in this class
        System.out.println("Test class starting");
    }

    @BeforeEach
    void setUp() {
        // Runs before EACH test — fresh instance every time
        orderService = new OrderService(new InMemoryOrderRepo());
    }

    @AfterEach
    void tearDown() {
        // Runs after EACH test — cleanup resources
        orderService = null;
    }

    @AfterAll
    static void tearDownClass() {
        // Runs ONCE after all tests in this class
        System.out.println("Test class complete");
    }

    @Test
    @DisplayName("should create order with valid items")
    void createOrderWithValidItems() {
        Order order = orderService.createOrder(List.of("item1", "item2"));
        assertNotNull(order);
        assertEquals(2, order.getItems().size());
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Use @DisplayName Liberally">
        Method names like <code>testCreateOrder1</code> are cryptic in reports.
        Use <code>@DisplayName</code> to describe the scenario in plain English.
        Your test report becomes living documentation.
      </InfoBox>

      <h3>@Nested — Grouping Related Tests</h3>
      <CodeBlock language="java" title="Nested Test Classes">
{`class CalculatorTest {

    private Calculator calc;

    @BeforeEach
    void setUp() {
        calc = new Calculator();
    }

    @Nested
    @DisplayName("Addition")
    class AdditionTests {
        @Test
        @DisplayName("should add two positive numbers")
        void addPositive() {
            assertEquals(5, calc.add(2, 3));
        }

        @Test
        @DisplayName("should handle negative numbers")
        void addNegative() {
            assertEquals(-1, calc.add(2, -3));
        }
    }

    @Nested
    @DisplayName("Division")
    class DivisionTests {
        @Test
        @DisplayName("should divide evenly")
        void divideEvenly() {
            assertEquals(5, calc.divide(10, 2));
        }

        @Test
        @DisplayName("should throw on divide by zero")
        void divideByZero() {
            assertThrows(ArithmeticException.class,
                () -> calc.divide(10, 0));
        }
    }
}`}
      </CodeBlock>

      <h3>@ParameterizedTest — Data-Driven Tests</h3>
      <CodeBlock language="java" title="Parameterized Tests">
{`import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;

class EmailValidatorTest {

    private final EmailValidator validator = new EmailValidator();

    @ParameterizedTest
    @ValueSource(strings = {"user@example.com", "admin@company.org"})
    @DisplayName("should accept valid emails")
    void validEmails(String email) {
        assertTrue(validator.isValid(email));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"not-an-email", "@missing.user"})
    @DisplayName("should reject invalid emails")
    void invalidEmails(String email) {
        assertFalse(validator.isValid(email));
    }

    @ParameterizedTest
    @CsvSource({"100, 10, 10", "9, 3, 3", "20, 4, 5"})
    @DisplayName("should divide correctly")
    void division(int dividend, int divisor, int expected) {
        assertEquals(expected, dividend / divisor);
    }
}`}
      </CodeBlock>

      <h3>Assertions Deep Dive</h3>
      <CodeBlock language="java" title="JUnit 5 Assertions">
{`// Basic assertions
assertEquals("expected", actual);
assertNotEquals("unexpected", actual);
assertTrue(condition);
assertFalse(condition);
assertNull(value);
assertNotNull(value);

// Exception assertions
ArithmeticException ex = assertThrows(
    ArithmeticException.class,
    () -> calculator.divide(1, 0)
);
assertEquals("/ by zero", ex.getMessage());

// Grouped assertions — all run even if one fails
assertAll("user validation",
    () -> assertEquals("Alice", user.getName()),
    () -> assertEquals("alice@test.com", user.getEmail()),
    () -> assertTrue(user.isActive())
);

// Timeout assertion
assertTimeout(Duration.ofMillis(500), () -> {
    slowService.process();
});`}
      </CodeBlock>

      <h2>Jest — JavaScript Unit Testing</h2>

      <h3>Setup</h3>
      <CodeBlock language="bash" title="Install Jest">
{`npm install --save-dev jest @types/jest

# For TypeScript
npm install --save-dev ts-jest
npx ts-jest config:init`}
      </CodeBlock>

      <h3>describe / it / test</h3>
      <CodeBlock language="javascript" title="Jest Test Structure">
{`const { calculateDiscount } = require('./pricing');

describe('calculateDiscount', () => {
  it('should return 0 for orders under $50', () => {
    expect(calculateDiscount(49.99)).toBe(0);
  });

  it('should apply 10% discount for orders over $100', () => {
    expect(calculateDiscount(200)).toBe(20);
  });
});`}
      </CodeBlock>

      <h3>Expect Matchers</h3>
      <CodeBlock language="javascript" title="Common Jest Matchers">
{`// Equality
expect(value).toBe(42);              // strict equality (===)
expect(obj).toEqual({ a: 1, b: 2 }); // deep equality
expect(obj).toStrictEqual(expected);  // deep + type checking

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThanOrEqual(10);
expect(0.1 + 0.2).toBeCloseTo(0.3);

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');

// Arrays & Iterables
expect(arr).toContain('item');
expect(arr).toHaveLength(3);
expect(arr).toEqual(expect.arrayContaining([1, 2]));

// Exceptions
expect(() => dangerousCall()).toThrow();
expect(() => dangerousCall()).toThrow('specific message');
expect(() => dangerousCall()).toThrow(CustomError);

// Functions (spies/mocks)
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(3);`}
      </CodeBlock>

      <h2>React Testing Library</h2>
      <p>
        React Testing Library (RTL) encourages testing components the way users
        interact with them — by querying the DOM like a user would.
      </p>

      <InfoBox variant="info" title="Philosophy: Test Behavior, Not Implementation">
        RTL deliberately does not expose component internals. You query by role, text,
        and label — the same things a user sees. If your test breaks, it means the user
        experience changed, not just an internal detail.
      </InfoBox>

      <CodeBlock language="jsx" title="Basic Component Test">
{`import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('should show error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});`}
      </CodeBlock>

      <h3>Async Testing with waitFor</h3>
      <CodeBlock language="jsx" title="Testing Async Behavior">
{`import { render, screen, waitFor } from '@testing-library/react';
import UserProfile from './UserProfile';

it('should load and display user data', async () => {
  render(<UserProfile userId="123" />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <h3>Testing Custom Hooks</h3>
      <CodeBlock language="jsx" title="Testing Hooks with renderHook">
{`import { renderHook, act } from '@testing-library/react';
import useCounter from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter(0));
    expect(result.current.count).toBe(0);
  });

  it('should increment the counter', () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });

  it('should accept a custom initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });
});`}
      </CodeBlock>

      <h3>Snapshot Testing</h3>
      <CodeBlock language="jsx" title="Snapshot Tests">
{`import { render } from '@testing-library/react';
import Button from './Button';

it('should match snapshot', () => {
  const { container } = render(
    <Button variant="primary" size="large">Click Me</Button>
  );
  expect(container.firstChild).toMatchSnapshot();
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="Snapshot Testing Caveats">
        Snapshots are easy to write but can become a maintenance burden. Large snapshots
        get blindly updated. Use them sparingly — prefer explicit assertions for critical
        behavior. Snapshots work best for small, stable UI components.
      </InfoBox>

      <h2>JUnit vs Jest Comparison</h2>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>JUnit 5</th>
            <th>Jest</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Test annotation/function</td>
            <td><code>@Test</code></td>
            <td><code>test()</code> / <code>it()</code></td>
          </tr>
          <tr>
            <td>Setup</td>
            <td><code>@BeforeEach</code></td>
            <td><code>beforeEach()</code></td>
          </tr>
          <tr>
            <td>Grouping</td>
            <td><code>@Nested</code></td>
            <td><code>describe()</code></td>
          </tr>
          <tr>
            <td>Display name</td>
            <td><code>@DisplayName</code></td>
            <td>String in <code>it()</code></td>
          </tr>
          <tr>
            <td>Parameterized</td>
            <td><code>@ParameterizedTest</code></td>
            <td><code>test.each()</code></td>
          </tr>
          <tr>
            <td>Exception assertion</td>
            <td><code>assertThrows()</code></td>
            <td><code>expect().toThrow()</code></td>
          </tr>
          <tr>
            <td>Snapshot testing</td>
            <td>N/A (use ApprovalTests)</td>
            <td>Built-in</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"Which React Testing Library query best follows the \"test like a user\" philosophy?"}
        options={[
          "getByTestId('submit-btn')",
          "container.querySelector('.btn-primary')",
          "getByRole('button', { name: /submit/i })",
          "wrapper.find('Button').props()"
        ]}
        correctIndex={2}
        explanation="getByRole queries by accessibility role and visible label — exactly how a user or screen reader would find the button. getByTestId is acceptable as a last resort, but role-based queries should be preferred."
        language="javascript"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>JUnit 5 uses annotations (@Test, @BeforeEach, @Nested, @ParameterizedTest) for structure</li>
        <li>Jest uses functions (describe, it, beforeEach, test.each) for the same patterns</li>
        <li>React Testing Library tests user behavior, not implementation details</li>
        <li>Use <code>userEvent</code> over <code>fireEvent</code> for more realistic interactions</li>
        <li>Use <code>waitFor</code> for async operations, <code>renderHook</code> for custom hooks</li>
        <li>Snapshots are useful but use them sparingly</li>
      </ul>
    </LessonLayout>
  );
}
