import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="Testing Pyramid & Philosophy"
      sectionId="testing"
      lessonIndex={0}
      prev={null}
      next={{ path: '/testing/unit', label: 'Unit Testing (JUnit & Jest)' }}
    >
      <h2>Why Testing Matters</h2>
      <p>
        Software testing is the practice of verifying that your code behaves as expected.
        Without tests, every code change becomes a gamble. With a solid test suite, you
        refactor with confidence, catch regressions early, and document expected behavior
        for the entire team.
      </p>

      <InfoBox variant="tip" title="Testing Is a Skill">
        Writing good tests is a discipline that takes practice. Great tests are fast,
        deterministic, focused, and act as living documentation. Poor tests are brittle,
        slow, and give false confidence.
      </InfoBox>

      <h2>The Testing Pyramid</h2>
      <p>
        The testing pyramid is a mental model for balancing test types. More tests at the
        bottom (fast, cheap unit tests), fewer at the top (slow, expensive E2E tests).
      </p>

      <FlowChart
        title="The Testing Pyramid"
        chart={"graph TD\n  E2E[\"E2E Tests\\n(Few, Slow, Expensive)\"]\n  INT[\"Integration Tests\\n(Some, Medium Speed)\"]\n  UNIT[\"Unit Tests\\n(Many, Fast, Cheap)\"]\n  E2E --> INT\n  INT --> UNIT"}
      />

      <h3>Layer Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>Speed</th>
            <th>Scope</th>
            <th>Quantity</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit Tests</td>
            <td>Milliseconds</td>
            <td>Single function/class</td>
            <td>Hundreds to thousands</td>
            <td>Low</td>
          </tr>
          <tr>
            <td>Integration Tests</td>
            <td>Seconds</td>
            <td>Multiple components</td>
            <td>Tens to hundreds</td>
            <td>Medium</td>
          </tr>
          <tr>
            <td>E2E Tests</td>
            <td>Seconds to minutes</td>
            <td>Entire application flow</td>
            <td>Tens</td>
            <td>High</td>
          </tr>
        </tbody>
      </table>

      <h2>Unit vs Integration vs E2E</h2>

      <h3>Unit Tests</h3>
      <p>
        Test a single unit of code in isolation. Dependencies are mocked or stubbed.
        These run extremely fast and pinpoint exactly where failures occur.
      </p>

      <CodeBlock language="java" title="Java Unit Test Example">
{`@Test
@DisplayName("should calculate total with tax")
void calculateTotalWithTax() {
    PriceCalculator calculator = new PriceCalculator(0.08);
    double result = calculator.calculateTotal(100.00);
    assertEquals(108.00, result, 0.01);
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="JavaScript Unit Test Example">
{`test('should calculate total with tax', () => {
  const calculator = new PriceCalculator(0.08);
  const result = calculator.calculateTotal(100.00);
  expect(result).toBeCloseTo(108.00);
});`}
      </CodeBlock>

      <h3>Integration Tests</h3>
      <p>
        Verify that multiple components work together correctly. These might test a
        controller with its service layer, or a React component that calls an API.
      </p>

      <h3>End-to-End Tests</h3>
      <p>
        Simulate real user behavior through the full application stack. Slow but
        catch issues that unit and integration tests miss.
      </p>

      <h2>TDD: Test-Driven Development</h2>
      <p>
        TDD is a development discipline where you write tests before writing production
        code. It follows a strict cycle known as Red-Green-Refactor.
      </p>

      <FlowChart
        title="TDD Cycle: Red-Green-Refactor"
        chart={"graph LR\n  RED[\"RED\\nWrite a failing test\"] --> GREEN[\"GREEN\\nWrite minimal code to pass\"]\n  GREEN --> REFACTOR[\"REFACTOR\\nClean up the code\"]\n  REFACTOR --> RED"}
      />

      <h3>TDD in Practice</h3>
      <CodeBlock language="java" title="Step 1: RED — Write a Failing Test">
{`@Test
void shouldReturnEmptyListWhenNoUsersExist() {
    UserService service = new UserService(new InMemoryUserRepo());
    List<User> users = service.findAll();
    assertTrue(users.isEmpty());
}
// Compile error — UserService doesn't exist yet!`}
      </CodeBlock>

      <CodeBlock language="java" title="Step 2: GREEN — Minimal Implementation">
{`public class UserService {
    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public List<User> findAll() {
        return repo.findAll();
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Step 3: REFACTOR — Clean Up">
{`// Maybe extract an interface, add null checks,
// or improve naming. Tests keep you safe during refactoring.`}
      </CodeBlock>

      <h2>BDD: Behavior-Driven Development</h2>
      <p>
        BDD extends TDD by using natural language to describe behavior. Tests are
        written in a Given-When-Then format that stakeholders can understand.
      </p>

      <CodeBlock language="java" title="BDD-Style Test (Java)">
{`@Test
@DisplayName("Given a user with admin role, when accessing settings, then allow access")
void adminCanAccessSettings() {
    // Given
    User admin = new User("alice", Role.ADMIN);
    SettingsService settings = new SettingsService();

    // When
    boolean hasAccess = settings.canAccess(admin);

    // Then
    assertTrue(hasAccess);
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="BDD-Style Test (JavaScript)">
{`describe('SettingsService', () => {
  it('should allow admin users to access settings', () => {
    // Given
    const admin = { name: 'alice', role: 'ADMIN' };
    const settings = new SettingsService();

    // When
    const hasAccess = settings.canAccess(admin);

    // Then
    expect(hasAccess).toBe(true);
  });
});`}
      </CodeBlock>

      <h2>Testing ROI</h2>
      <p>
        Not all tests provide equal value. Focus your testing effort where it matters most:
      </p>

      <InfoBox variant="info" title="High-Value Testing Targets">
        <ul>
          <li><strong>Business logic</strong> — core domain rules, calculations, state machines</li>
          <li><strong>Edge cases</strong> — boundaries, null values, empty collections</li>
          <li><strong>Error handling</strong> — exception paths, validation failures</li>
          <li><strong>Integration points</strong> — API contracts, database queries</li>
          <li><strong>Regression-prone areas</strong> — code that has broken before</li>
        </ul>
      </InfoBox>

      <h3>What NOT to Test</h3>
      <ul>
        <li>Framework code (Spring, React internals) — trust the framework</li>
        <li>Simple getters/setters with no logic</li>
        <li>Private methods directly — test them through public interfaces</li>
        <li>Implementation details — test behavior, not how it&apos;s done</li>
        <li>Third-party library internals</li>
      </ul>

      <h2>Code Coverage Philosophy</h2>
      <p>
        Code coverage measures what percentage of your code is exercised by tests.
        It&apos;s a useful metric but can be misleading if used as a target.
      </p>

      <InfoBox variant="warning" title="The 80% Rule">
        Aim for around 80% code coverage. Going from 80% to 100% often means writing
        low-value tests for trivial code. The last 20% typically takes 80% of the effort
        and provides diminishing returns. Coverage tells you what&apos;s NOT tested — it
        doesn&apos;t tell you if your tests are any good.
      </InfoBox>

      <CodeBlock language="bash" title="Checking Coverage">
{`# Java (JaCoCo via Maven)
mvn test jacoco:report

# JavaScript (Jest built-in)
npx jest --coverage

# Coverage thresholds in jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};`}
      </CodeBlock>

      <h2>Testing Anti-Patterns</h2>

      <FlowChart
        title="Common Testing Anti-Patterns"
        chart={"graph TD\n  A[\"Testing Anti-Patterns\"] --> B[\"Ice Cream Cone\\nToo many E2E, few unit\"]\n  A --> C[\"Testing Implementation\\nCoupled to internals\"]\n  A --> D[\"Flaky Tests\\nNon-deterministic results\"]\n  A --> E[\"Slow Test Suite\\nDiscourages running tests\"]\n  A --> F[\"Test Duplication\\nSame logic tested many times\"]\n  A --> G[\"No Assertions\\nTests that can't fail\"]"}
      />

      <table>
        <thead>
          <tr>
            <th>Anti-Pattern</th>
            <th>Problem</th>
            <th>Solution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ice Cream Cone</td>
            <td>Inverted pyramid — too many slow E2E tests</td>
            <td>Push tests down to unit/integration level</td>
          </tr>
          <tr>
            <td>Testing Implementation</td>
            <td>Tests break when refactoring internals</td>
            <td>Test behavior and outputs, not how</td>
          </tr>
          <tr>
            <td>Flaky Tests</td>
            <td>Tests pass/fail randomly</td>
            <td>Eliminate time dependencies, use deterministic data</td>
          </tr>
          <tr>
            <td>Slow Suites</td>
            <td>Developers skip running tests</td>
            <td>Parallelize, mock heavy dependencies</td>
          </tr>
          <tr>
            <td>No Assertions</td>
            <td>Tests that never fail are worthless</td>
            <td>Every test must assert something meaningful</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"In the testing pyramid, which layer should have the MOST tests?"}
        options={[
          "End-to-End tests",
          "Integration tests",
          "Unit tests",
          "Manual tests"
        ]}
        correctIndex={2}
        explanation="Unit tests form the base of the pyramid. They are fast, cheap, and should make up the majority of your test suite. E2E tests are at the top — few in number but high in confidence."
        language="java"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Follow the testing pyramid: many unit tests, fewer integration, fewest E2E</li>
        <li>Use TDD (Red-Green-Refactor) to drive design and catch bugs early</li>
        <li>Write BDD-style tests for better readability and documentation</li>
        <li>Aim for ~80% coverage but focus on quality over quantity</li>
        <li>Avoid anti-patterns: flaky tests, ice cream cones, testing implementation details</li>
        <li>Test behavior, not implementation</li>
      </ul>
    </LessonLayout>
  );
}
