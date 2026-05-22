import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TestIntro() {
  return (
    <LessonLayout
      title="Testing Strategies"
      sectionId="testing"
      lessonIndex={0}
      prev={null}
      next={{ path: '/testing/unit', label: 'Unit Testing' }}
    >
      <h2>The Testing Pyramid</h2>
      <p>
        The testing pyramid describes the ideal proportion of test types: many fast unit tests at
        the base, fewer integration tests in the middle, and a small number of slow end-to-end
        tests at the top. Each layer serves a different purpose and has different cost/value.
      </p>

      <FlowChart
        title="Testing Pyramid"
        chart={"graph TD\n  A[E2E Tests - 10%] --> B[Integration Tests - 30%]\n  B --> C[Unit Tests - 60%]\n  A --> D[Slow - expensive - realistic]\n  B --> E[Medium - verify wiring]\n  C --> F[Fast - cheap - isolated]"}
      />

      <CodeBlock language="markdown" title="Test Types Comparison">
{`## Unit Tests
# What: test a single function, method, or class in isolation
# Speed: milliseconds per test — run thousands in seconds
# Dependencies: mocked (no DB, no network, no filesystem)
# Feedback: instant — tells you exactly which logic is wrong
# When to write: every business logic function, edge cases, algorithms
# Tools: JUnit 5 (Java), Jest/Vitest (JavaScript)

## Integration Tests
# What: test how components work together (e.g., service + real DB)
# Speed: seconds — real DB connections, real HTTP calls
# Dependencies: real (test DB, embedded server, containers)
# Feedback: slower, but tests actual wiring between layers
# When to write: repository queries, REST endpoint behavior, auth flows
# Tools: @SpringBootTest (Java), Testing Library (React)

## End-to-End (E2E) Tests
# What: test complete user workflows through a real browser
# Speed: minutes — real browser, real server, real DB
# Dependencies: fully deployed system (or close to it)
# Feedback: most realistic, but slow and flaky
# When to write: critical user journeys (checkout, login, signup)
# Tools: Playwright (recommended), Cypress, Selenium

## Contract Tests
# What: verify API producer and consumer agree on interface
# When: microservices, frontend + backend separate teams
# Tools: Pact (consumer-driven contract testing)

## Proportion Rule of Thumb
# 60% unit, 30% integration, 10% E2E for most applications
# E2E ratio lower → faster CI, less flakiness
# Unit ratio lower → less confidence in business logic`}
      </CodeBlock>

      <h2>TDD and BDD</h2>

      <CodeBlock language="java" title="Test-Driven Development (TDD)">
{`// TDD Cycle: Red → Green → Refactor
// 1. RED: write a failing test for the feature you're about to build
// 2. GREEN: write the minimal code to make the test pass
// 3. REFACTOR: clean up the code, tests still pass

// Example: implementing a password validator with TDD
// Step 1 — RED: write tests first (feature doesn't exist yet)
@Test
void passwordMustBeAtLeast8Characters() {
    assertThrows(InvalidPasswordException.class,
        () -> new Password("short"));
}
@Test
void passwordMustContainUppercase() {
    assertThrows(InvalidPasswordException.class,
        () -> new Password("alllowercase1"));
}
@Test
void validPasswordIsAccepted() {
    assertDoesNotThrow(() -> new Password("Str0ng!Pass"));
}

// Step 2 — GREEN: minimal implementation
public class Password {
    public Password(String value) {
        if (value.length() < 8)
            throw new InvalidPasswordException("Must be 8+ chars");
        if (!value.matches(".*[A-Z].*"))
            throw new InvalidPasswordException("Must have uppercase");
    }
}

// Step 3 — REFACTOR: clean up, add more edge cases

// TDD benefits:
// - Tests document exactly what the code should do
// - Design pressure: hard-to-test code → refactor the design
// - Confidence: every feature has a test by definition
// - Debugging: failing test immediately narrows the problem`}
      </CodeBlock>

      <CodeBlock language="java" title="BDD — Given/When/Then">
{`// BDD (Behavior-Driven Development) uses domain language
// Tests read like specifications rather than code

// JUnit 5 with BDD style
@Test
@DisplayName("Given a valid user, when they log in, then they get a JWT token")
void givenValidUser_whenLoginCalled_thenReturnsJwt() {
    // Given
    User user = new User("alice@example.com", passwordEncoder.encode("secret"));
    userRepository.save(user);

    // When
    LoginResponse response = authService.login("alice@example.com", "secret");

    // Then
    assertThat(response.getToken()).isNotNull();
    assertThat(response.getToken()).startsWith("eyJ"); // JWT prefix
}

// Jest with BDD style
describe('ShoppingCart', () => {
  describe('when adding an item', () => {
    it('increases the cart total', () => {
      // Given
      const cart = new ShoppingCart();

      // When
      cart.addItem({ name: 'Widget', price: 9.99 });

      // Then
      expect(cart.total).toBe(9.99);
    });

    it('updates item count', () => {
      const cart = new ShoppingCart();
      cart.addItem({ name: 'Widget', price: 9.99 });
      expect(cart.itemCount).toBe(1);
    });
  });
});`}
      </CodeBlock>

      <h2>FIRST Principles of Good Tests</h2>

      <CodeBlock language="java" title="What Makes a Good Test">
{`// FIRST: Fast, Isolated, Repeatable, Self-validating, Timely

// FAST
// Unit tests should run in < 1ms each, thousands in seconds
// Slow tests: DB calls, network, file I/O — use mocks in unit tests
// Running tests frequently requires them to be fast

// ISOLATED
// Each test must be independent — order doesn't matter, no shared state
@BeforeEach
void setUp() {
    // Reset state before each test
    database.clear();
    cache.invalidateAll();
}
// ❌ Bad: test 2 depends on test 1 creating a user
// ✓ Good: each test creates its own data

// REPEATABLE
// Same test must give same result every time, in any environment
// ❌ Bad: test that depends on current time, random values
// ✓ Good: mock Clock.fixed(Instant.now(), ZoneId.UTC)
//         mock Random with a fixed seed

// SELF-VALIDATING
// Test must have a clear pass/fail — no manual inspection
// ❌ Bad: test that just prints output, developer reads it
// ✓ Good: assertEquals, assertThat, expect().toBe()

// TIMELY
// Tests should be written at the same time as the code
// Retroactively testing legacy code is valuable but much harder
// TDD: tests BEFORE code (most timely)
// At minimum: tests in the same PR as the feature`}
      </CodeBlock>

      <h2>Test Coverage — What It Means and What It Doesn't</h2>

      <CodeBlock language="bash" title="Coverage Metrics">
{`# Line Coverage — % of lines executed during tests
# 80% line coverage = 80% of code was executed
# Most common metric, but can be gamed

# Branch Coverage — % of branches (if/else, switch) tested
# More valuable than line coverage
# A line can be covered without testing all branches

# Mutation Coverage (most valuable)
# Intentionally mutate code (change > to >=, remove conditions)
# Tests should FAIL when code is mutated
# If tests still pass with mutations → tests don't verify behavior
# Tools: PIT (Java), Stryker (JS/TS)

# Coverage targets
# 70% line coverage: minimum for non-trivial business logic
# 80% line coverage: solid baseline for most apps
# 100%: overkill for most apps, appropriate for critical libraries

# What coverage DOESN'T tell you:
# - Quality of assertions (covered but not actually verified)
# - Integration between modules
# - Performance and scalability
# - Security vulnerabilities
# - User experience

# Jacoco (Java) configuration in pom.xml:
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <configuration>
    <rules>
      <rule>
        <limits>
          <limit>
            <minimum>0.80</minimum>  <!-- 80% line coverage -->
          </limit>
        </limits>
      </rule>
    </rules>
  </configuration>
</plugin>`}
      </CodeBlock>

      <InfoBox variant="tip" title="Testing Mindset: What Are You Testing?">
        <p>
          The most important question before writing any test: <em>what behavior are you verifying?</em>
          Not "does this method return X" but "given this situation, when this happens, then this outcome
          should result." Tests that verify implementation details break every refactor.
          Tests that verify behavior survive refactoring and become living documentation.
          Write tests that would still be valuable if you rewrote the implementation from scratch.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Why does the testing pyramid recommend many unit tests but few E2E tests?"
        options={[
          "E2E tests are harder to write than unit tests",
          "Unit tests are faster, cheaper, and more isolated — they pinpoint failures precisely; E2E tests are slow, expensive, and flaky",
          "E2E tests require paid tools while unit tests are free",
          "Unit tests cover more code than E2E tests"
        ]}
        correctIndex={1}
        explanation="Unit tests run in milliseconds, require no infrastructure, and when they fail they point directly to the broken function. E2E tests take minutes, require a deployed environment, are prone to flakiness (timing, network, data), and when they fail you don't know which layer broke. Many fast unit tests give continuous feedback; a few E2E tests verify critical user journeys. The pyramid shape optimizes for both speed and confidence."
      />

      <InteractiveChallenge
        question="What is the TDD cycle in order?"
        options={[
          "Write code → Write tests → Refactor",
          "Write tests → Refactor → Write code",
          "Write failing test (Red) → Write minimal code to pass (Green) → Refactor",
          "Design interface → Implement → Test"
        ]}
        correctIndex={2}
        explanation="TDD follows Red-Green-Refactor: (1) Red — write a test for the feature before any implementation; it fails because the feature doesn't exist. (2) Green — write the minimal code to make the test pass (no more, no less). (3) Refactor — improve the code quality while keeping tests green. This cycle ensures every feature has tests from day one, and the 'minimal implementation' step prevents over-engineering."
      />
    </LessonLayout>
  );
}
