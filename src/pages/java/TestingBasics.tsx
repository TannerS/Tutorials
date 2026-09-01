import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function JavaTestingBasics() {
  return (
    <LessonLayout
      title="Unit Testing Fundamentals — Dummies, Stubs, Spies, Mocks"
      sectionId="java"
      lessonIndex={14}
      prev={{ path: '/java/build-tools', label: 'Build Tools: Maven & Gradle' }}
      next={{ path: '/java/mockito', label: 'Mockito in Practice' }}
    >
      <p>
        Almost every Java team says &ldquo;stub&rdquo; when they mean &ldquo;mock&rdquo;, and
        &ldquo;mock&rdquo; when they mean &ldquo;whatever Mockito gave me&rdquo;. That sounds
        like pedantry until you sit in a code review where one person is arguing that a test
        is over-specified and the other thinks they are talking about return values. The words
        have precise meanings — Gerard Meszaros pinned them down in{' '}
        <em>xUnit Test Patterns</em> (2007) — and knowing them turns a vague argument into a
        two-minute one.
      </p>
      <p>
        This lesson builds all five test doubles <strong>by hand</strong>, with no mocking
        library anywhere. That is deliberate. Mockito is a code generator for exactly these
        five shapes, and once you have written them yourself, every Mockito API in the next
        lesson has an obvious referent instead of being magic.
      </p>

      <h2>What a Unit Test Actually Is</h2>
      <p>
        A unit test is a test that runs in milliseconds, in-process, with no network, no disk,
        no database, no clock dependence, and no ordering dependence on any other test. Those
        properties are what make a test suite worth having: you can run the whole thing on
        every save, and a red bar means something is genuinely broken rather than that CI was
        flaky again.
      </p>
      <p>
        Notice what is <em>not</em> in that definition: any statement about how much code the
        test touches.
      </p>

      <h3>The argument about &ldquo;unit&rdquo;</h3>
      <p>
        Ask five Java developers what a unit is and you get three answers:
      </p>
      <ul>
        <li>
          <strong>A class.</strong> One test class per production class, every collaborator
          mocked. This is the default in most enterprise Java shops.
        </li>
        <li>
          <strong>A behaviour.</strong> One test per observable outcome, reached through
          whatever public entry point exposes it, using real collaborators wherever they are
          cheap and deterministic.
        </li>
        <li>
          <strong>A slice.</strong> A whole module or package with only its external
          boundaries faked.
        </li>
      </ul>

      <InfoBox variant="note" title="The position this site takes, and why">
        <p>
          <strong>A unit is a unit of behaviour, not a unit of code.</strong> The right test
          boundary is the smallest piece of behaviour a caller could care about, exercised
          through a stable public API, with test doubles used only at the edges where the real
          thing is slow, non-deterministic, or has side effects you cannot observe.
        </p>
        <p>
          The historical argument is on this side. When Kent Beck coined the term for SUnit,
          &ldquo;unit&rdquo; meant <em>unit of isolation</em> — tests that do not interfere
          with each other — not <em>unit of code</em>. The class-per-test rule is a later
          reinterpretation, and it has a specific, expensive failure mode: it makes your test
          suite a mirror of your class structure. Extract a helper class, and a test that
          asserted correct behaviour now fails despite the behaviour being unchanged. Teams in
          that position learn that refactoring is expensive, so they stop refactoring, and the
          tests that were supposed to enable change end up preventing it.
        </p>
        <p>
          The honest counter-argument: class-as-unit pinpoints failures precisely. When
          <code>PriceCalculatorTest</code> goes red you know exactly which file to open.
          That is real, but it is worth less than it sounds — a well-named behaviour test
          plus a stack trace gets you to the same file, and precise pinpointing is a poor
          trade for having to rewrite the suite every time you move a method.
        </p>
        <p>
          Practical rule: <em>if replacing a collaborator with the real object would keep the
          test fast and deterministic, use the real object.</em> Every double you add is a
          copy of an assumption that can drift out of date.
        </p>
      </InfoBox>

      <h2>The Five Test Doubles</h2>
      <p>
        &ldquo;Test double&rdquo; is Meszaros&apos; umbrella term — a stunt double for a real
        collaborator. There are five kinds, and they differ along exactly two axes: does the
        double <em>return</em> anything useful, and does it <em>assert</em> anything?
      </p>

      <CodeBlock language="text" title="The five, in one table">
{`                 Returns canned    Records how it    Fails the test
                 values?           was called?       by itself?
Dummy            no                no                no
Stub             yes               no                no
Spy              yes               YES               no  (you assert later)
Mock             yes               yes               YES (it asserts for you)
Fake             yes - by really   n/a - it just     no
                 working                 works`}
      </CodeBlock>

      <FlowChart
        title="Choosing a test double"
        chart={"graph TD\nA[I need to stand in for a collaborator] --> B{Does the code under test actually call it?}\nB -->|No, it only has to satisfy the constructor| C[Dummy]\nB -->|Yes| D{Do I need it to return something?}\nD -->|One canned answer is enough| E[Stub]\nD -->|It must stay self-consistent across many calls| F[Fake, a real but simplified implementation]\nD -->|No, the method returns void| G{Do I care THAT it was called?}\nG -->|No| C\nG -->|Yes, record now and assert at the end| H[Spy]\nG -->|Yes, and fail immediately on a wrong call| I[Mock]"}
      />

      <h3>The system under test</h3>
      <p>
        Everything below is built against this one small service, so you can watch the same
        class tested five different ways.
      </p>

      <CodeBlock language="java" title="OrderService and its four collaborators">
{`public record Order(String sku, int quantity, long totalCents) {}

public interface PricingApi      { long unitPriceCents(String sku); }
public interface OrderRepository { void save(Order order);
                                   Optional<Order> findBySku(String sku);
                                   List<Order> findAll(); }
public interface EmailSender     { void send(String to, String subject, String body); }
public interface AuditLog        { void record(String event); }

public class OrderService {
    private final PricingApi pricing;
    private final OrderRepository repository;
    private final EmailSender email;
    private final AuditLog audit;

    public OrderService(PricingApi pricing, OrderRepository repository,
                        EmailSender email, AuditLog audit) {
        this.pricing = pricing;
        this.repository = repository;
        this.email = email;
        this.audit = audit;
    }

    public Order place(String sku, int quantity, String customerEmail) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive, was " + quantity);
        }
        long total = pricing.unitPriceCents(sku) * quantity;
        Order order = new Order(sku, quantity, total);
        repository.save(order);
        email.send(customerEmail, "Order confirmed",
                   "You ordered " + quantity + " x " + sku);
        return order;
    }

    public void cancel(String sku) {
        audit.record("cancelled " + sku);      // the ONLY use of audit
    }
}`}
      </CodeBlock>

      <p>
        Note that <code>place()</code> never touches <code>audit</code>. That single fact is
        what makes the first double possible.
      </p>

      <h3>1. Dummy — passed to satisfy a signature, never used</h3>
      <p>
        A dummy exists only so the code compiles and the constructor runs. It carries no
        behaviour and no expectations. The classic dummy is <code>null</code>, or an
        implementation whose methods are empty.
      </p>
      <p>
        There is a strictly better version, though. If the double is genuinely never called,
        make it <em>prove</em> that by exploding if it ever is. Now the dummy documents an
        invariant of the code path instead of silently swallowing a change in behaviour.
      </p>

      <CodeBlock language="java" title="A dummy that enforces its own contract">
{`// The lazy form — legal, but it hides regressions.
AuditLog dummy = event -> {};

// The better form: if place() ever starts writing to the audit log,
// this test tells you, instead of quietly passing.
static class DummyAuditLog implements AuditLog {
    @Override public void record(String event) {
        throw new AssertionError("AuditLog must not be called on this path, got: " + event);
    }
}

@Test
void dummyBlowsUpIfTheCodeEverTouchesIt() {
    // service was built with new DummyAuditLog()
    AssertionError err = assertThrows(AssertionError.class, () -> service.cancel("SKU-1"));
    System.out.println(">>> dummy said: " + err.getMessage());
}`}
      </CodeBlock>
      <CodeBlock language="text" title="Real output — JDK 26, JUnit Jupiter 6.1.3">
{`>>> dummy said: AuditLog must not be called on this path, got: cancelled SKU-1`}
      </CodeBlock>

      <h3>2. Stub — returns canned answers, asserts nothing</h3>
      <p>
        A stub is a lookup table with a class around it. It exists to get a value into the
        code under test. It never checks anything, never counts calls, and never fails a test.
        If your &ldquo;mock&rdquo; only ever appears in <code>when(...).thenReturn(...)</code>{' '}
        and never in a <code>verify(...)</code>, it is a stub — call it one.
      </p>

      <CodeBlock language="java" title="Stub: one canned price, no assertions anywhere">
{`static class StubPricingApi implements PricingApi {
    private final long cannedPrice;
    StubPricingApi(long cannedPrice) { this.cannedPrice = cannedPrice; }

    @Override public long unitPriceCents(String sku) { return cannedPrice; }
    // Note: it ignores the sku entirely. A stub is allowed to be that dumb —
    // the test is about multiplication, not about the pricing service.
}

@Test
void placeMultipliesUnitPriceByQuantity() {
    var service = new OrderService(new StubPricingApi(999), repository,
                                   emailSpy, new DummyAuditLog());

    Order order = service.place("SKU-1", 3, "ada@example.com");

    assertEquals(2997, order.totalCents());
}`}
      </CodeBlock>

      <h3>3. Spy — a stub that also records how it was called</h3>
      <p>
        A spy answers questions like a stub, and additionally keeps a log of what happened so
        the test can inspect it <em>afterwards</em>. The crucial property is that the assertion
        lives in the test, in the Assert phase, where you can read it.
      </p>

      <CodeBlock language="java" title="Spy: record the calls, assert at the end">
{`static class SpyEmailSender implements EmailSender {
    record Sent(String to, String subject, String body) {}
    final List<Sent> sent = new ArrayList<>();

    @Override public void send(String to, String subject, String body) {
        sent.add(new Sent(to, subject, body));
    }
}

@Test
void placeEmailsTheCustomerOnce() {
    service.place("SKU-1", 1, "ada@example.com");

    assertEquals(1, emailSpy.sent.size());
    assertEquals("ada@example.com", emailSpy.sent.get(0).to());
    assertEquals("Order confirmed",  emailSpy.sent.get(0).subject());
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Spy is the default you want for outgoing calls">
        <p>
          A spy fails <em>where you can see it</em> — in the test method, with a normal
          assertion message and a normal diff. A mock fails deep inside production code, on
          the line that made the &ldquo;wrong&rdquo; call, which reads like a bug in the
          system rather than an unmet expectation. When you genuinely need to check an
          interaction, prefer the spy shape unless you specifically want the test to abort at
          the moment of the offending call.
        </p>
      </InfoBox>

      <h3>4. Mock — pre-programmed with expectations, fails the test itself</h3>
      <p>
        This is the one people mean least often when they say it. A true mock is told{' '}
        <em>in advance</em> what calls it should receive. It rejects anything unexpected on the
        spot, and at the end of the test its <code>verify()</code> fails if an expected call
        never arrived. The mock is not a passive recorder — it is an active participant that
        can fail your test on its own.
      </p>

      <CodeBlock language="java" title="Mock: expectations set up front, self-verifying at the end">
{`static class MockEmailSender implements EmailSender {
    private final List<String> expected = new ArrayList<>();
    private final List<String> actual   = new ArrayList<>();

    MockEmailSender expectSend(String to, String subject) {
        expected.add(to + "|" + subject);
        return this;
    }

    @Override public void send(String to, String subject, String body) {
        String call = to + "|" + subject;
        if (!expected.contains(call)) {                 // fails INSIDE production code
            throw new AssertionError("Unexpected call: send(" + call + ")");
        }
        actual.add(call);
    }

    void verify() {                                     // fails at the END of the test
        List<String> missing = new ArrayList<>(expected);
        missing.removeAll(actual);
        if (!missing.isEmpty()) {
            throw new AssertionError("Expected calls never happened: " + missing);
        }
    }
}

@Test
void mockFailsTheTestItselfWhenExpectationUnmet() {
    MockEmailSender emailMock = new MockEmailSender()
            .expectSend("ada@example.com", "Order confirmed")
            .expectSend("ada@example.com", "Loyalty points awarded");   // never happens
    OrderService svc = new OrderService(new StubPricingApi(999), repository,
                                        emailMock, new DummyAuditLog());

    svc.place("SKU-1", 1, "ada@example.com");

    AssertionError err = assertThrows(AssertionError.class, emailMock::verify);
    System.out.println(">>> mock.verify() said: " + err.getMessage());
}`}
      </CodeBlock>
      <CodeBlock language="text" title="Real output">
{`>>> mock.verify() said: Expected calls never happened: [ada@example.com|Loyalty points awarded]`}
      </CodeBlock>

      <h3>5. Fake — a real working implementation, simplified</h3>
      <p>
        A fake is not pretending. It genuinely implements the contract, just with a shortcut
        that makes it unsuitable for production: an in-memory map instead of a database, an
        in-process list instead of a message broker. The important property is
        self-consistency — what you save, you can read back. Stubs cannot do that.
      </p>

      <CodeBlock language="java" title="Fake: an in-memory repository that actually works">
{`static class InMemoryOrderRepository implements OrderRepository {
    private final Map<String, Order> bySku = new LinkedHashMap<>();

    @Override public void save(Order order) { bySku.put(order.sku(), order); }

    @Override public Optional<Order> findBySku(String sku) {
        return Optional.ofNullable(bySku.get(sku));
    }

    @Override public List<Order> findAll() { return List.copyOf(bySku.values()); }
}

@Test
void placePersistsTheOrder() {
    service.place("SKU-1", 2, "ada@example.com");

    // This assertion is impossible with a stub: it reads back what was written.
    assertTrue(repository.findBySku("SKU-1").isPresent());
    assertEquals(1, repository.findAll().size());
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The most under-used double in Java">
        <p>
          Fakes are the double Java teams reach for least and should reach for most. An
          <code>InMemoryOrderRepository</code> is thirty lines, is written once, is shared by
          every test in the codebase, and its tests read like descriptions of behaviour rather
          than descriptions of Mockito. Compare with stubbing <code>findBySku</code> in forty
          separate test methods, each one encoding the same assumption about what
          <code>save</code> ought to have done.
        </p>
        <p>
          The one discipline a fake requires: it must obey the same contract as the real
          implementation. If the real repository throws on a duplicate key, so must the fake.
          When they diverge, tests pass and production does not.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="All five, running">
        <CodeBlock language="text" title="mvn test — JDK 26.0.1, JUnit Jupiter 6.1.3, no Mockito on the classpath">
{`[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running lab.basics.HandRolledDoublesTest
>>> dummy said: AuditLog must not be called on this path, got: cancelled SKU-1
>>> mock.verify() said: Expected calls never happened: [ada@example.com|Loyalty points awarded]
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.028 s -- in lab.basics.HandRolledDoublesTest
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] BUILD SUCCESS`}
        </CodeBlock>
        <p>
          Five doubles, five tests, twenty-eight milliseconds, zero libraries. Everything
          Mockito does in the next lesson is a generated version of one of these five classes.
        </p>
      </InfoBox>

      <h2>State Verification vs Behaviour Verification</h2>
      <p>
        This is the distinction that actually determines whether your test suite is an asset
        or a liability, and it maps directly onto the doubles above.
      </p>
      <ul>
        <li>
          <strong>State verification</strong> asks <em>what is true afterwards?</em> Assert on
          the return value, or on state you can read back. Stubs and fakes support this.
        </li>
        <li>
          <strong>Behaviour verification</strong> asks <em>what did it do?</em> Assert that a
          particular call was made with particular arguments. Spies and mocks support this.
        </li>
      </ul>

      <FlowChart
        title="Which kind of verification does this test need?"
        chart={"graph TD\nA[What is this test trying to prove?] --> B{Is the effect visible in a return value or in state I can read back?}\nB -->|Yes| C[State verification, assert on the result]\nB -->|No, the effect leaves the system| D{Is the interaction itself part of the contract?}\nD -->|Yes, an email is sent or an event is published| E[Behaviour verification, assert on the interaction]\nD -->|No, it is an internal implementation detail| F[Do not assert on it at all]\nC --> G[Survives refactoring]\nE --> H[Breaks only when the collaboration changes, which is correct]\nF --> I[Breaks on every refactor, delete it]"}
      />

      <h3>Why over-using behaviour verification hurts</h3>
      <p>
        Behaviour verification couples your test to <em>how</em> the code works. Sometimes that
        is exactly right — &ldquo;charges the card exactly once&rdquo; is a real requirement,
        not an implementation detail, and no amount of state inspection will prove it. But
        applied by reflex, it produces tests that fail on refactors that changed nothing a user
        could observe.
      </p>
      <p>
        Here is that failure, actually run. Two tests, one refactor. The refactor replaces a
        multiplication with a loop — same inputs, same output, different call pattern:
      </p>

      <CodeBlock language="java" title="The refactor: identical behaviour, different internals">
{`// Before
long total = pricing.unitPriceCents(sku) * quantity;      // 1 call

// After
long total = 0;
for (int i = 0; i < quantity; i++) {
    total += pricing.unitPriceCents(sku);                 // N calls, same answer
}`}
      </CodeBlock>

      <CodeBlock language="java" title="The two tests">
{`/** A mock that insists unitPriceCents is called EXACTLY once. */
static class StrictPricingMock implements PricingApi {
    private int calls;
    @Override public long unitPriceCents(String sku) { calls++; return 999; }
    void verifyCalledExactlyOnce() {
        if (calls != 1) {
            throw new AssertionError("expected unitPriceCents to be called 1 time, was " + calls);
        }
    }
}

@Test
void stateVerificationSurvivesTheRefactor() {
    Order order = new OrderServiceV2(new StrictPricingMock(), repo).place("SKU-1", 3);
    assertEquals(2997, order.totalCents());        // still true after the refactor
}

@Test
void behaviourVerificationBreaksOnTheRefactor() {
    var pricing = new StrictPricingMock();
    new OrderServiceV2(pricing, repo).place("SKU-1", 3);
    pricing.verifyCalledExactlyOnce();             // <-- this one blows up
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real surefire output">
{`[INFO] Running lab.basics.StateVsBehaviourTest
[ERROR] Tests run: 2, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.002 s <<< FAILURE!
[ERROR] lab.basics.StateVsBehaviourTest.behaviourVerificationBreaksOnTheRefactor <<< FAILURE!
java.lang.AssertionError: expected unitPriceCents to be called 1 time, was 3
	at lab.basics.StateVsBehaviourTest$StrictPricingMock.verifyCalledExactlyOnce(StateVsBehaviourTest.java:21)
	at lab.basics.StateVsBehaviourTest.behaviourVerificationBreaksOnTheRefactor(StateVsBehaviourTest.java:45)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Read that failure message as a user would">
        <p>
          &ldquo;Expected <code>unitPriceCents</code> to be called 1 time, was 3.&rdquo; No
          customer has ever wanted that. The order total is still 2997 cents; nothing a user
          can observe changed. The test is asserting on the developer&apos;s previous choice of
          implementation, and the only work it created was a developer editing a test to make
          the number 3 acceptable — which teaches the team that tests are an obstacle.
        </p>
        <p>
          The tell is whether you can restate the assertion as a sentence a product owner would
          nod at. &ldquo;The customer is emailed a confirmation&rdquo; passes that test.
          &ldquo;The pricing API is queried once per order rather than once per line&rdquo; only
          passes it if you are being billed per call — in which case it is a genuine
          requirement and behaviour verification is the correct tool.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="A useful default ratio">
        <p>
          Assert on state by default. Reach for behaviour verification when the effect{' '}
          <em>leaves the system</em> and cannot be observed any other way: an email, an HTTP
          call, a published event, a charge. For those, the interaction <strong>is</strong> the
          observable outcome, and verifying it is state verification by another name — it is
          just that the state lives in someone else&apos;s system.
        </p>
      </InfoBox>

      <h2>Structure: Arrange, Act, Assert</h2>
      <p>
        Three phases, in order, visually separated by blank lines. It is a trivially simple
        convention, and it is load-bearing: a test you cannot slice into three phases is
        usually a test that is doing two things at once.
      </p>

      <CodeBlock language="java" title="AAA, and what it exposes">
{`@Test
void placeMultipliesUnitPriceByQuantity() {
    // ARRANGE — build the world. No assertions here.
    var pricing = new StubPricingApi(999);
    var service = new OrderService(pricing, repository, emailSpy, new DummyAuditLog());

    // ACT — exactly one call. If you need two, you probably need two tests.
    Order order = service.place("SKU-1", 3, "ada@example.com");

    // ASSERT — one logical outcome.
    assertEquals(2997, order.totalCents());
}`}
      </CodeBlock>

      <h3>One logical assertion per test</h3>
      <p>
        The rule is misquoted constantly. It is <em>one logical assertion</em>, not one{' '}
        <code>assertEquals</code> call. Three assertions that together describe one outcome are
        one logical assertion:
      </p>

      <CodeBlock language="java" title="One outcome, three statements — this is fine">
{`@Test
void placeEmailsTheCustomerOnce() {
    service.place("SKU-1", 1, "ada@example.com");

    assertEquals(1, emailSpy.sent.size());                      // all three describe
    assertEquals("ada@example.com", emailSpy.sent.get(0).to()); // the SAME outcome:
    assertEquals("Order confirmed", emailSpy.sent.get(0).subject()); // "one confirmation email"
}`}
      </CodeBlock>
      <p>
        What the rule forbids is a test that verifies the total, <em>and</em> that the order was
        persisted, <em>and</em> that the email went out. When that test fails you learn only
        that something in <code>place()</code> is wrong, and the first failing assertion masks
        whatever the other two would have told you.
      </p>

      <h3>Naming that says what broke</h3>
      <p>
        The name is what you read in the CI log at 6pm on a Friday. It should be a sentence
        about behaviour, so that reading the failure line alone tells you what regressed.
      </p>
      <CodeBlock language="text" title="Names, worst to best">
{`testPlace()                              tells you nothing
testPlace2()                             actively hostile
placeTest_success()                      "success" by what standard?
shouldMultiplyPrice()                    better; "should" is filler
placeMultipliesUnitPriceByQuantity()     good: a fact that is now false
placeRejectsNonPositiveQuantity()        good
place_whenQuantityIsZero_throwsIAE()     also good; pick one convention and hold it`}
      </CodeBlock>
      <p>
        Both surviving conventions work — plain sentence case, or the
        {' '}<code>method_condition_outcome</code> form. What matters is that the reader learns
        the broken behaviour without opening the file. If you want spaces, JUnit 5&apos;s{' '}
        <code>@DisplayName</code> gives you them, at the cost of the name no longer being
        greppable from a stack trace.
      </p>

      <h2>What NOT to Mock</h2>

      <InfoBox variant="danger" title="Four categories that should never get a test double">
        <ul>
          <li>
            <strong>Value objects.</strong> A <code>record Money(long cents)</code>, a{' '}
            <code>LocalDate</code>, an enum, a DTO. They have no side effects and constructing
            one is free. A mocked value object is strictly worse than the real one: slower,
            harder to read, and it will silently return <code>null</code> or <code>0</code> for
            any accessor you forgot to stub.
          </li>
          <li>
            <strong>The language and the JDK.</strong> <code>List</code>, <code>Map</code>,{' '}
            <code>Optional</code>, <code>String</code>, <code>StringBuilder</code>. Use a real{' '}
            <code>ArrayList</code>. A mocked <code>List</code> tests Mockito, not your code.
          </li>
          <li>
            <strong>Types you do not own.</strong> The AWS SDK client, the Stripe client,
            Jackson&apos;s <code>ObjectMapper</code>, an HTTP library&apos;s response type. Wrap
            them instead (below).
          </li>
          <li>
            <strong>The class under test.</strong> Partially mocking the thing you are testing
            means part of your assertion is about code that is not running. If you feel the
            need, the class is doing two jobs — split it.
          </li>
        </ul>
      </InfoBox>

      <h3>Why &ldquo;only mock types you own&rdquo; is more than style</h3>
      <p>
        The rule comes from Steve Freeman and Nat Pryce (<em>Growing Object-Oriented Software,
        Guided by Tests</em>), and the reasoning is sharper than &ldquo;it&apos;s cleaner&rdquo;.
      </p>
      <p>
        A stub encodes <strong>your belief</strong> about how the other API behaves. When the
        API is yours, that belief is checked by the compiler and by the tests of the real
        implementation. When it belongs to a third party, nothing checks it at all. If you
        believe their client throws <code>NotFoundException</code> on a missing key but it
        actually returns <code>null</code>, your test passes forever and production throws an
        NPE. You have written a test that certifies your misunderstanding.
      </p>
      <p>
        Second cost: their API is designed for their convenience, not for stubbing. Fluent
        builders, final classes, deep nested response types — you end up with eight lines of
        <code>RETURNS_DEEP_STUBS</code> to express one fact, and all eight break when they ship
        a minor version.
      </p>

      <CodeBlock language="java" title="Wrap it, then mock your own wrapper">
{`// DON'T — the test now depends on the shape of somebody else's SDK.
PaymentIntent intent = mock(PaymentIntent.class);
when(intent.getStatus()).thenReturn("succeeded");
when(stripeClient.paymentIntents().create(any())).thenReturn(intent);

// DO — define the interface YOUR domain actually wants.
public interface PaymentGateway {
    PaymentResult charge(Money amount, CardToken card);
}
public record PaymentResult(boolean approved, String reference) {}

// One adapter class translates the SDK. It is the ONLY place their types appear,
// and it is covered by an integration test against their sandbox, not by a unit test.
class StripePaymentGateway implements PaymentGateway { /* ... */ }

// Every unit test in the codebase now stubs a two-method interface you control.
PaymentGateway payments = new StubPaymentGateway(new PaymentResult(true, "ref-1"));`}
      </CodeBlock>

      <InfoBox variant="tip" title="The same argument applies to the clock">
        <p>
          <code>LocalDateTime.now()</code> is a hidden dependency on a type you do not own, and
          it is the single most common cause of tests that fail at midnight or in a different
          timezone. Do not reach for static mocking to fix it — inject{' '}
          <code>java.time.Clock</code> and pass <code>Clock.fixed(...)</code> in tests. Same
          rule, same reason: turn the untestable global into a collaborator you control. The
          next lesson shows what static mocking costs when you skip this step.
        </p>
      </InfoBox>

      <h2>JUnit 5 Essentials</h2>
      <p>
        The subset actually used above. On JUnit Jupiter 6.x (current) these APIs are unchanged
        from 5.x, so everything here applies to both.
      </p>

      <CodeBlock language="xml" title="Dependencies — resolved and run for this lesson">
{`<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>   <!-- aggregate: api + params + engine -->
    <version>6.1.3</version>
    <scope>test</scope>
</dependency>
<!-- Surefire 3.5.2+ is required to discover JUnit 6. Older Surefire finds zero tests. -->`}
      </CodeBlock>

      <CodeBlock language="java" title="@Test, @BeforeEach — a fresh instance per test">
{`class HandRolledDoublesTest {

    InMemoryOrderRepository repository;
    SpyEmailSender emailSpy;
    OrderService service;

    @BeforeEach                          // runs before EVERY @Test
    void setUp() {
        repository = new InMemoryOrderRepository();
        emailSpy   = new SpyEmailSender();
        service    = new OrderService(new StubPricingApi(999), repository,
                                      emailSpy, new DummyAuditLog());
    }

    @Test
    void placePersistsTheOrder() { /* ... */ }
}

// JUnit creates a NEW instance of the test class for every test method, so
// fields cannot leak between tests. This is why @BeforeEach can safely assign
// to plain fields, and why a shared 'static' field is a test-pollution bug
// waiting to happen.`}
      </CodeBlock>

      <CodeBlock language="java" title="assertThrows — assert on the exception, not just its type">
{`@Test
void placeRejectsZeroQuantityWithAMessageThatNamesTheValue() {
    IllegalArgumentException ex = assertThrows(
        IllegalArgumentException.class,
        () -> svc.place("SKU-1", 0, "a@b.com"));

    // assertThrows RETURNS the exception. Assert on it — a test that only
    // checks the type passes even when the message is useless.
    assertEquals("quantity must be positive, was 0", ex.getMessage());
}`}
      </CodeBlock>

      <CodeBlock language="java" title="@ParameterizedTest — same behaviour, many inputs">
{`@ParameterizedTest
@ValueSource(ints = {0, -1, -100})
void placeRejectsAnyNonPositiveQuantity(int quantity) {
    assertThrows(IllegalArgumentException.class,
                 () -> svc.place("SKU-1", quantity, "a@b.com"));
}

@ParameterizedTest
@CsvSource({ "1, 999", "2, 1998", "10, 9990" })
void totalIsUnitPriceTimesQuantity(int quantity, long expectedTotal) {
    assertEquals(expectedTotal, svc.place("SKU-1", quantity, "a@b.com").totalCents());
}

// Each row is a separate test with its own pass/fail. From the surefire report:
//   <testcase name="placeRejectsAnyNonPositiveQuantity(int)[1]"
//   <testcase name="placeRejectsAnyNonPositiveQuantity(int)[2]"
//   <testcase name="placeRejectsAnyNonPositiveQuantity(int)[3]"
//   <testcase name="totalIsUnitPriceTimesQuantity(int, long)[1]"
//   <testcase name="totalIsUnitPriceTimesQuantity(int, long)[2]"
//   <testcase name="totalIsUnitPriceTimesQuantity(int, long)[3]"
// A loop inside one @Test would report all six as a single test, and stop at
// the first failure.`}
      </CodeBlock>

      <CodeBlock language="java" title="assertAll — report every failing facet at once">
{`@Test
void assertAllReportsEveryFailingFacetAtOnce() {
    Order order = svc.place("SKU-1", 3, "ada@example.com");

    assertAll("order",
        () -> assertEquals("SKU-9", order.sku()),      // wrong on purpose
        () -> assertEquals(3, order.quantity()),       // correct
        () -> assertEquals(1000, order.totalCents())   // wrong on purpose
    );
}`}
      </CodeBlock>
      <CodeBlock language="text" title="Real output — both failures reported, not just the first">
{`[ERROR] lab.basics.JUnit5EssentialsTest.assertAllReportsEveryFailingFacetAtOnce <<< FAILURE!
org.opentest4j.MultipleFailuresError:
order (2 failures)
	org.opentest4j.AssertionFailedError: expected: <SKU-9> but was: <SKU-1>
	org.opentest4j.AssertionFailedError: expected: <1000> but was: <2997>
	at org.junit.jupiter.api.AssertAll.assertAll(AssertAll.java:80)`}
      </CodeBlock>
      <p>
        Without <code>assertAll</code>, that test stops at the first line and you never learn
        the total was wrong too — you fix the SKU, re-run, and discover the second bug on the
        next cycle. Use it when several statements describe facets of{' '}
        <strong>one</strong> outcome. It is not a licence to bundle three unrelated outcomes
        into one test.
      </p>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="Signs a Java unit test suite is healthy">
        <ul>
          <li>The whole unit suite runs in seconds and nobody hesitates to run it.</li>
          <li>No test touches the network, the disk, a real database, or{' '}
              <code>LocalDateTime.now()</code>.</li>
          <li>Test names are sentences about behaviour, readable from a CI log alone.</li>
          <li>Most assertions are on returned values or readable state, not on call counts.</li>
          <li>Interaction assertions exist only where the effect leaves the system.</li>
          <li>Third-party SDK types appear in exactly one adapter class, never in a test double.</li>
          <li>Value objects, collections and enums are constructed for real, never mocked.</li>
          <li>Repeated stubbing of the same collaborator has been replaced by one shared fake.</li>
          <li>A pure refactor — extracting a method, renaming a field — breaks zero tests.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="A colleague's test builds a mock EmailSender, stubs send() to do nothing, calls service.place(...), and then asserts only that the returned order total is 2997. They call the EmailSender a 'mock'. What is it actually, and does the naming matter?"
        options={[
          "It is a mock — anything created by a mocking library is a mock, and the terminology is interchangeable in practice",
          "It is a dummy: send() returns void and the test never asserts on it, so it exists purely to satisfy the constructor. Calling it a mock implies an expectation the test does not have, which is exactly the confusion that makes review conversations about over-specification impossible",
          "It is a spy, because it is capable of recording the calls even though the test does not read them",
          "It is a fake, since doing nothing is a valid simplified implementation of sending email"
        ]}
        correctIndex={1}
        explanation="Meszaros classifies by what the double does IN THIS TEST, not by what it could do. The test never reads anything back from the EmailSender and never asserts on it, so its only job is to let the constructor run: that is a dummy. It is not a spy, because nothing is recorded or inspected; not a fake, because it implements no real behaviour; and not a mock, because a mock carries pre-programmed expectations and fails the test on its own. The naming matters precisely because 'mock' signals 'this test asserts on the interaction'. When every double is called a mock, you cannot tell a test that pins down real requirements apart from one that will break on the next refactor — and the review conversation about which is which never gets off the ground."
      />

      <InteractiveChallenge
        question="Your OrderService calls a third-party ShippingSdk whose client returns a deeply nested RateResponse. Tests stub it with RETURNS_DEEP_STUBS. After a minor version bump of the SDK, twelve tests fail to compile and, worse, two that still compile now pass while production throws. What is the structural fix?"
        options={[
          "Pin the SDK to an exact version and never upgrade it, so the stubs stay valid",
          "Replace RETURNS_DEEP_STUBS with individually stubbed intermediate objects, which is more verbose but more explicit",
          "Define your own ShippingRates interface expressing what your domain needs, put the SDK behind a single adapter class covered by an integration test, and let every unit test stub your two-method interface instead of their type tree",
          "Move all the shipping tests to @SpringBootTest so the real SDK client is wired in"
        ]}
        correctIndex={2}
        explanation="This is 'only mock types you own', and the second symptom is the important one. Tests that fail to compile are annoying but honest — the compiler told you. Tests that still pass while production throws are the real damage: your stub encoded a belief about the SDK's behaviour, nothing ever checked that belief, and when the SDK's behaviour changed the stub kept happily asserting the old world. Pinning the version freezes the misunderstanding in place and blocks security patches. Stubbing the intermediates more explicitly is the same coupling with more typing. Wrapping the SDK in an interface your domain defines confines their types to one adapter, which you verify once against their sandbox with an integration test, and gives every unit test a stable two-method surface you control. It also usually reveals that your domain wanted three fields out of their forty-field response."
      />
    </LessonLayout>
  );
}

export default JavaTestingBasics;
