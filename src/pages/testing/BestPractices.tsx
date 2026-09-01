import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function BestPractices() {
  return (
    <LessonLayout
      title="Testing Best Practices"
      sectionId="testing"
      lessonIndex={9}
      prev={{ path: '/testing/performance', label: 'Test Performance & Parallelization' }}
      next={null}
    >
      <h2>Arrange-Act-Assert (AAA)</h2>
      <p>
        Every test should follow the AAA pattern. It makes tests readable, consistent,
        and easy to debug when they fail.
      </p>

      <FlowChart
        title="Arrange-Act-Assert Pattern"
        chart={"graph LR\n  A[\"ARRANGE\\nSet up test data\\nand dependencies\"] --> B[\"ACT\\nExecute the\\ncode under test\"]\n  B --> C[\"ASSERT\\nVerify the\\nexpected outcome\"]"}
      />

      <CodeBlock language="java" title="AAA in Java">
{`@Test
@DisplayName("should apply 15% discount for premium members")
void premiumDiscount() {
    // Arrange
    PricingService pricing = new PricingService();
    Customer premium = new Customer("Alice", MembershipTier.PREMIUM);
    Order order = new Order(premium, BigDecimal.valueOf(200.00));

    // Act
    BigDecimal total = pricing.calculateTotal(order);

    // Assert — compareTo, NOT assertEquals (see the warning below)
    assertThat(total).isEqualByComparingTo("170.00");
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never assertEquals two BigDecimals">
        <p>
          <code>BigDecimal.equals()</code> compares <strong>value and scale</strong>,
          so <code>170.0</code> and <code>170.00</code> are not equal to each other
          even though they are the same number. A test written as{' '}
          <code>assertEquals(BigDecimal.valueOf(170.00), total)</code> passes or fails
          based on how many trailing zeros the production code happened to produce —
          which changes the first time someone swaps a <code>multiply</code> for a{' '}
          <code>divide</code>.
        </p>
        <p>
          Compare numerically instead: AssertJ&apos;s{' '}
          <code>assertThat(total).isEqualByComparingTo(&quot;170.00&quot;)</code>, or
          with plain JUnit{' '}
          <code>assertEquals(0, expected.compareTo(total))</code>. This is one of the
          most common false-failure sources in Java money code.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="AAA in JavaScript">
{`test('should apply 15% discount for premium members', () => {
  // Arrange
  const pricing = new PricingService();
  const premium = { name: 'Alice', tier: 'PREMIUM' };
  const order = { customer: premium, subtotal: 200.00 };

  // Act
  const total = pricing.calculateTotal(order);

  // Assert
  expect(total).toBe(170.00);
});`}
      </CodeBlock>

      <h2>Test Naming Conventions</h2>
      <p>
        Good test names describe the scenario, not the implementation. When a test fails,
        the name should tell you what went wrong without reading the code.
      </p>

      <CodeBlock language="java" title="Good vs Bad Test Names">
{`// BAD — tells you nothing when it fails
@Test void test1() { ... }
@Test void testCalculate() { ... }

// GOOD — "should [expected behavior]" pattern
@Test
@DisplayName("should reject negative quantities")
void rejectNegativeQuantity() { ... }

@Test
@DisplayName("should calculate shipping as free for orders over $50")
void freeShippingOver50() { ... }`}
      </CodeBlock>

      <h2>Test Isolation</h2>
      <p>
        Every test must be independent — no shared mutable state, no execution order
        dependencies. Use <code>@BeforeEach</code> / <code>beforeEach</code> to create
        fresh state for every test.
      </p>

      <CodeBlock language="java" title="Isolated State per Test">
{`class UserServiceTest {
    private List<User> users;

    @BeforeEach
    void setUp() {
        users = new ArrayList<>(); // Fresh list every test
    }

    @Test void createUser() {
        users.add(new User("Alice"));
        assertEquals(1, users.size()); // Always passes
    }

    @Test void createAnotherUser() {
        users.add(new User("Bob"));
        assertEquals(1, users.size()); // Always passes — clean state
    }
}`}
      </CodeBlock>

      <h2>Deterministic Tests (No Flaky Tests)</h2>
      <p>
        A flaky test passes sometimes and fails sometimes. Flaky tests erode team
        trust in the test suite faster than having no tests at all.
      </p>

      <InfoBox variant="danger" title="Common Flakiness Sources">
        <ul>
          <li><strong>Time-dependent logic</strong> — use injectable clocks</li>
          <li><strong>Random data</strong> — use seeded random or fixed data</li>
          <li><strong>Race conditions</strong> — use proper async waiting</li>
          <li><strong>External services</strong> — mock them</li>
          <li><strong>Test order dependency</strong> — isolate test state</li>
          <li><strong>Shared databases</strong> — use per-test cleanup or transactions</li>
        </ul>
      </InfoBox>

      <CodeBlock language="java" title="Fixing Time-Dependent Tests">
{`// FLAKY — depends on real system clock
public class TrialService {
    public boolean isTrialExpired(LocalDate startDate) {
        return LocalDate.now().isAfter(startDate.plusDays(30));
    }
}

// DETERMINISTIC — inject the clock
public class TrialService {
    private final Clock clock;

    public TrialService(Clock clock) {
        this.clock = clock;
    }

    public boolean isTrialExpired(LocalDate startDate) {
        return LocalDate.now(clock).isAfter(startDate.plusDays(30));
    }
}

@Test
void trialShouldExpireAfter30Days() {
    Clock fixed = Clock.fixed(
        LocalDate.of(2024, 3, 1).atStartOfDay(ZoneId.systemDefault()).toInstant(),
        ZoneId.systemDefault()
    );
    TrialService service = new TrialService(fixed);

    assertTrue(service.isTrialExpired(LocalDate.of(2024, 1, 15)));
    assertFalse(service.isTrialExpired(LocalDate.of(2024, 2, 15)));
}`}
      </CodeBlock>

      <h2>Root-Causing a Flaky Test</h2>
      <p>
        Knowing the usual causes is not the same as finding <em>this</em> one. The
        mistake almost everyone makes is re-running the test until it fails again and
        guessing. Work through it in order instead — each step rules out a whole
        category:
      </p>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Ask</th>
            <th>How to Check</th>
            <th>If Yes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Does it fail in isolation?</td>
            <td>Run that single test 100&times; on its own</td>
            <td>Self-contained bug: timing, randomness, or a real race in the code</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Does it fail only after other tests?</td>
            <td>Run the whole file/suite repeatedly; try a fixed vs. random seed order</td>
            <td>Order dependence — leaked global state, unreset mock, unclosed connection</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Does it pass serially but fail in parallel?</td>
            <td>Re-run with one worker (<code>--runInBand</code> / <code>maxWorkers=1</code> / <code>-DforkCount=1</code>)</td>
            <td>Shared resource — same DB rows, same port, same temp file, same fixture</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Does it fail only in CI?</td>
            <td>Compare timezone, locale, CPU count, and clock; CI is slower and often UTC</td>
            <td>Environment assumption — a hardcoded timeout or a local-timezone date</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Is the failure timing-shaped?</td>
            <td>Look for <code>sleep</code>, fixed waits, or polling in the test or code</td>
            <td>Replace the wait with a condition (<code>waitFor</code>, Awaitility)</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="bash" title="Reproducing Flakiness on Purpose">
{`# JavaScript — hammer one test, single worker, fail fast
npx jest path/to/file.test.js -t "the flaky one" --runInBand --bail
npx vitest run path/to/file.test.ts --repeat 100 --no-file-parallelism

# Randomize order to expose test-order coupling
npx jest --randomize            # Jest 29.5+
npx vitest run --sequence.shuffle

# Java — repeat a single test, then force serial execution
@RepeatedTest(100)
mvn test -Dtest=OrderServiceTest#flakyMethod -DforkCount=1`}
      </CodeBlock>

      <InfoBox variant="danger" title="Quarantine Is a Timer, Not a Trash Can">
        When you cannot fix a flaky test today, quarantine it — but attach a ticket, an
        owner, and a date. A <code>@Disabled</code> / <code>test.skip</code> with no
        follow-up is just a deleted test with extra steps, and the bug it was catching
        is now invisible. Track the count of quarantined tests; if it only ever goes
        up, the suite is dying.
      </InfoBox>

      <h2>Test Data Builders &amp; Factories</h2>
      <p>
        Complex test data setup clutters tests. Use builders or factories to create
        test objects with sensible defaults that can be overridden per test.
      </p>

      <CodeBlock language="java" title="Test Data Builder Pattern">
{`public class UserBuilder {
    private String name = "Default User";
    private String email = "default@test.com";
    private Role role = Role.USER;
    private boolean active = true;

    public static UserBuilder aUser() {
        return new UserBuilder();
    }

    public UserBuilder withName(String name) {
        this.name = name;
        return this;
    }

    public UserBuilder withRole(Role role) {
        this.role = role;
        return this;
    }

    public UserBuilder inactive() {
        this.active = false;
        return this;
    }

    public User build() {
        return new User(name, email, role, active);
    }
}

// Usage in tests — clean, readable, focused on what matters
@Test
void adminShouldHaveFullAccess() {
    User admin = aUser().withName("Alice").withRole(Role.ADMIN).build();
    assertTrue(accessControl.hasFullAccess(admin));
}

@Test
void inactiveUserShouldBeDenied() {
    User inactive = aUser().inactive().build();
    assertFalse(accessControl.canLogin(inactive));
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Factory Functions (JavaScript)">
{`// testFactories.js
function createUser(overrides = {}) {
  return {
    id: '1',
    name: 'Default User',
    email: 'default@test.com',
    role: 'user',
    active: true,
    ...overrides,
  };
}

function createOrder(overrides = {}) {
  return {
    id: 'ORD-1',
    userId: '1',
    items: [],
    status: 'PENDING',
    total: 0,
    ...overrides,
  };
}

// Usage
test('admin should have full access', () => {
  const admin = createUser({ role: 'admin', name: 'Alice' });
  expect(accessControl.hasFullAccess(admin)).toBe(true);
});

test('should calculate total for order with items', () => {
  const order = createOrder({
    items: [{ name: 'Widget', price: 9.99, qty: 3 }],
  });
  expect(calculateTotal(order)).toBeCloseTo(29.97);
});`}
      </CodeBlock>

      <h2>Testing Error Paths</h2>
      <CodeBlock language="java" title="Error Path Testing (Java)">
{`@Test
@DisplayName("should throw when transferring more than balance")
void overdraftThrows() {
    Account from = new Account("A", BigDecimal.valueOf(100));
    Account to = new Account("B", BigDecimal.ZERO);

    InsufficientFundsException ex = assertThrows(
        InsufficientFundsException.class,
        () -> bankService.transfer(from, to, BigDecimal.valueOf(150))
    );

    assertEquals("Insufficient funds: balance=100, requested=150", ex.getMessage());
    assertThat(from.getBalance()).isEqualByComparingTo("100");  // not assertEquals — scale
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Error Path Testing (JavaScript)">
{`test('should throw for negative deposit amount', () => {
  const account = new Account(100);
  expect(() => account.deposit(-50)).toThrow('Amount must be positive');
  expect(account.balance).toBe(100); // unchanged
});

test('should handle API errors gracefully', async () => {
  server.use(
    http.get('/api/data', () => {
      return HttpResponse.json({ error: 'Service down' }, { status: 503 });
    })
  );

  render(<DataDisplay />);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load data. Please try again.'
    );
  });
});`}
      </CodeBlock>

      <h2>Testing Async Code</h2>
      <CodeBlock language="javascript" title="Async Testing in JavaScript">
{`// Testing promises
test('should fetch user data', async () => {
  const user = await userService.getById('123');
  expect(user.name).toBe('Alice');
});

// Testing rejected promises
test('should reject for unknown user', async () => {
  await expect(userService.getById('unknown'))
    .rejects.toThrow('User not found');
});`}
      </CodeBlock>

      <CodeBlock language="java" title="Async Testing in Java">
{`@Test
@DisplayName("should complete async operation within timeout")
void asyncProcessing() throws Exception {
    CompletableFuture<Result> future = asyncService.process("data");
    Result result = future.get(5, TimeUnit.SECONDS);
    assertEquals(Status.SUCCESS, result.getStatus());
}`}
      </CodeBlock>

      <h2>CI/CD Test Strategies</h2>

      <FlowChart
        title="CI/CD Test Pipeline"
        chart={"graph LR\n  COMMIT[\"Commit\"] --> LINT[\"Lint &\\nFormat Check\"]\n  LINT --> UNIT[\"Unit Tests\\n(Parallel)\"]\n  UNIT --> INT[\"Integration Tests\"]\n  INT --> E2E[\"E2E Tests\\n(Critical paths)\"]\n  E2E --> DEPLOY[\"Deploy to\\nStaging\"]"}
      />

      <h2>Code Coverage Tools</h2>
      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>Language</th>
            <th>Metrics</th>
            <th>Integration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>JaCoCo</td>
            <td>Java</td>
            <td>Line, branch, method, class</td>
            <td>Maven/Gradle, SonarQube</td>
          </tr>
          <tr>
            <td>Istanbul/nyc</td>
            <td>JavaScript</td>
            <td>Statement, branch, function, line</td>
            <td>Jest (built-in), Mocha</td>
          </tr>
          <tr>
            <td>c8</td>
            <td>JavaScript</td>
            <td>V8 native coverage</td>
            <td>Node.js, Vitest</td>
          </tr>
        </tbody>
      </table>

      <h2>What Coverage Actually Measures (and What It Can&apos;t)</h2>
      <p>
        Coverage tools answer exactly one question: <em>was this line executed while
        the tests ran?</em> They do not — cannot — tell you whether anything was{' '}
        <strong>asserted</strong> about it. This test earns 100% coverage of{' '}
        <code>calculateTotal</code> and would still pass if the function returned
        garbage:
      </p>

      <CodeBlock language="javascript" title="100% Covered, 0% Tested">
{`test('calculates the total', () => {
  const pricing = new PricingService();
  pricing.calculateTotal({ subtotal: 200, tier: 'PREMIUM' });
  // ...and that's it. No expect(). Every line ran. Coverage: 100%.
});`}
      </CodeBlock>

      <p>
        Not all coverage metrics are equally strict either. They form a hierarchy, and
        the number your dashboard shows is usually the weakest one:
      </p>

      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Satisfied When</th>
            <th>What It Still Misses</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Line / statement</td>
            <td>Every line ran at least once</td>
            <td>A line with a branch on it needs only one of its paths taken</td>
          </tr>
          <tr>
            <td>Branch</td>
            <td>Every <code>if</code> went both true and false</td>
            <td>Compound conditions — <code>a &amp;&amp; b</code> counts as covered without ever varying <code>b</code></td>
          </tr>
          <tr>
            <td>Condition / MC-DC</td>
            <td>Each sub-condition independently affects the outcome</td>
            <td>Whether the outcome was ever <em>checked</em></td>
          </tr>
          <tr>
            <td>Mutation score</td>
            <td>Deliberately broken code makes a test fail</td>
            <td>Behavior you never wrote a test for at all</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Read Branch Coverage, Not Line Coverage">
        If your team tracks a single number, make it <strong>branch</strong> coverage.
        Line coverage on typical business code runs 10–20 points higher than branch
        coverage for the same test suite, because a guard clause, a ternary, or a{' '}
        <code>?.</code> counts as fully covered the moment either path is taken. An 85%
        line / 62% branch project is usually reported as &quot;85% covered&quot;.
      </InfoBox>

      <h2>Mutation Testing — Grading the Tests Themselves</h2>
      <p>
        Coverage grades your <em>code</em>. Mutation testing grades your{' '}
        <em>tests</em>. The tool makes small, deliberate edits to production code —{' '}
        changing <code>&gt;</code> to <code>&gt;=</code>, swapping <code>+</code> for{' '}
        <code>-</code>, replacing a return value with <code>null</code>, deleting a
        method call — then reruns the suite. Each edit is a <strong>mutant</strong>. If
        a test fails, the mutant is <strong>killed</strong> — your suite noticed. If
        every test still passes, the mutant <strong>survived</strong>, and you have
        found a line that is covered but not actually verified.
      </p>

      <CodeBlock language="java" title="A Surviving Mutant — Covered but Unverified">
{`// Production code
public boolean isEligibleForFreeShipping(Order order) {
    return order.getTotal() > 50;      // MUTANT: change > to >=
}

// The only test — passes against BOTH the original and the mutant
@Test
void freeShippingForLargeOrders() {
    assertTrue(service.isEligibleForFreeShipping(orderOf(100)));
    assertFalse(service.isEligibleForFreeShipping(orderOf(10)));
}
// Line coverage: 100%. Mutation score: 0% for the boundary.
// Nothing pins down what happens at exactly 50 — the classic off-by-one gap.

// The test that kills it
@Test
void fiftyExactlyIsNotFreeShipping() {
    assertFalse(service.isEligibleForFreeShipping(orderOf(50)));
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Running Mutation Testing">
{`# Java — PIT (pitest)
mvn org.pitest:pitest-maven:mutationCoverage
# HTML report: target/pit-reports/index.html

# JavaScript / TypeScript — Stryker
npx stryker run
# Config: stryker.config.json — set mutate globs to a single module first`}
      </CodeBlock>

      <InfoBox variant="tip" title="How to Actually Adopt Mutation Testing">
        It is slow — the suite reruns once per mutant, so a full run can take
        minutes to hours. Don&apos;t bolt it onto every PR. Scope it to your highest-risk
        module (pricing, permissions, the state machine), run it nightly or weekly, and
        treat surviving mutants as a to-do list rather than a build gate. A mutation
        score of 60–70% on critical code tells you far more than 90% line coverage
        across the whole repo.
      </InfoBox>

      <h2>Common Testing Mistakes</h2>
      <FlowChart
        title="Testing Mistakes to Avoid"
        chart={"graph TD\n  M[\"Common Mistakes\"] --> M1[\"Testing implementation\\nnot behavior\"]\n  M --> M2[\"Over-mocking\\n(tests pass, code broken)\"]\n  M --> M3[\"No error path\\ntesting\"]\n  M --> M4[\"Ignoring flaky tests\\ninstead of fixing them\"]\n  M --> M5[\"Copy-paste tests\\nwith no thought\"]\n  M --> M6[\"Testing trivial code\\n(getters/setters)\"]"}
      />

      <table>
        <thead>
          <tr>
            <th>Mistake</th>
            <th>Why It&apos;s Bad</th>
            <th>Better Approach</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Testing implementation</td>
            <td>Tests break on every refactor</td>
            <td>Test inputs &amp; outputs, not internals</td>
          </tr>
          <tr>
            <td>Over-mocking</td>
            <td>Only proves mocks are configured right</td>
            <td>Use real objects when fast and deterministic</td>
          </tr>
          <tr>
            <td>No error paths</td>
            <td>Bugs hide in exception handling</td>
            <td>Test every error condition explicitly</td>
          </tr>
          <tr>
            <td>Ignoring flaky tests</td>
            <td>Erodes trust in the entire suite</td>
            <td>Fix or quarantine immediately</td>
          </tr>
          <tr>
            <td>Copy-paste tests</td>
            <td>Maintenance nightmare, false confidence</td>
            <td>Parameterized tests or shared helpers</td>
          </tr>
          <tr>
            <td>Chasing a coverage percentage</td>
            <td>The cheapest way to raise it is assertion-free tests</td>
            <td>Read the uncovered branches and judge each one; grade depth with mutation score</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"A test passes locally but fails randomly in CI. What is this called?"}
        options={[
          "A regression test",
          "A flaky test",
          "A mutation test",
          "An integration test"
        ]}
        correctIndex={1}
        explanation="A flaky test is one that passes and fails non-deterministically. Common causes include timing issues, shared state, external dependencies, and test order coupling. Flaky tests should be fixed immediately or quarantined — never ignored."
        language="java"
      />

      <h2>Testing Checklist</h2>
      <InfoBox variant="success" title="Before Merging Your PR">
        <ul>
          <li>✅ All tests pass locally and in CI</li>
          <li>✅ New code has corresponding tests</li>
          <li>✅ Both happy path and error paths are covered</li>
          <li>✅ Tests are deterministic — no flakiness</li>
          <li>✅ Test names clearly describe the scenario</li>
          <li>✅ No over-mocking — real objects used where possible</li>
          <li>✅ Newly uncovered branches in the diff have been looked at and consciously accepted</li>
          <li>✅ Tests run fast (unit tests &lt; 10s total)</li>
        </ul>
      </InfoBox>

      <h2>Key Takeaways</h2>
      <ul>
        <li>Follow Arrange-Act-Assert for consistent, readable tests</li>
        <li>Name tests descriptively — they&apos;re documentation</li>
        <li>Isolate every test — no shared mutable state</li>
        <li>Fix flaky tests immediately; never disable and forget</li>
        <li>Use test data builders/factories for clean setup</li>
        <li>Test error paths as thoroughly as happy paths</li>
        <li>Run tests in CI stages: lint → unit → integration → E2E</li>
        <li>Use JaCoCo (Java) or Istanbul (JS) for coverage, mutation testing for depth</li>
        <li>Track branch coverage over line coverage, and read it as a report of gaps rather than a target to hit</li>
      </ul>
    </LessonLayout>
  );
}
