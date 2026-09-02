import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function JavaMockito() {
  return (
    <LessonLayout
      title="Mockito in Practice"
      sectionId="java"
      lessonIndex={15}
      prev={{ path: '/java/testing-basics', label: 'Unit Testing Fundamentals — Dummies, Stubs, Spies, Mocks' }}
      next={{ path: '/java/cheatsheet', label: 'Java Cheat Sheet' }}
    >
      <p>
        The previous lesson built all five test doubles by hand. Mockito generates four of
        them for you at runtime. Everything below maps back onto that vocabulary, because the
        single most common source of confusion in Mockito code is that the library calls
        everything a &ldquo;mock&rdquo; regardless of which double you actually built.
      </p>

      <CodeBlock language="text" title="Mockito API to Meszaros double">
{`mock(Foo.class), never stubbed, never verified ......... DUMMY
when(mock.m()).thenReturn(v), never verified ........... STUB
verify(mock).m(...) after the fact ..................... SPY
strict stubs + verify(...) in the same test ............ MOCK
                                                         (closest Mockito gets)
--- and the one it CANNOT do ---
a real, simplified, self-consistent implementation ..... FAKE — write it by hand`}
      </CodeBlock>

      <InfoBox variant="note" title="Mockito has no fake, and that is the gap teams fall into">
        <p>
          There is no Mockito API that gives you an in-memory repository where what you{' '}
          <code>save</code> comes back from <code>findById</code>. Because the library offers
          no fake, teams reach for the tool that <em>is</em> there and stub the same repository
          method in forty test classes. The fake is thirty lines of hand-written Java, is
          written once, and deletes all forty of those stubs. Mockito not having an API for it
          is not a signal that you should not want one.
        </p>
      </InfoBox>

      <h2>Setup — Versions That Resolve Today</h2>
      <p>
        Everything in this lesson was compiled and run on <strong>JDK 26.0.1</strong> with{' '}
        <strong>Mockito 5.23.0</strong> and <strong>JUnit Jupiter 6.1.3</strong>, under Maven
        3.9.16 and Surefire 3.5.6. Every console block below is pasted from those runs.
      </p>

      <CodeBlock language="xml" title="pom.xml — pinned to what Maven Central serves today">
{`<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>6.1.3</version>
    <scope>test</scope>
</dependency>

<!-- The engine. Brings byte-buddy + objenesis. -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.23.0</version>
    <scope>test</scope>
</dependency>

<!-- The JUnit 5/6 integration: @ExtendWith(MockitoExtension.class), @Mock, @InjectMocks -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.23.0</version>
    <scope>test</scope>
</dependency>`}
      </CodeBlock>

      <CodeBlock language="text" title="mvn dependency:tree — what you actually get">
{`[INFO] lab:mockito-lab:jar:1.0
[INFO] +- org.junit.jupiter:junit-jupiter:jar:6.1.3:test
[INFO] |  +- org.junit.jupiter:junit-jupiter-api:jar:6.1.3:test
[INFO] |  |  +- org.opentest4j:opentest4j:jar:1.3.0:test
[INFO] |  |  +- org.junit.platform:junit-platform-commons:jar:6.1.3:test
[INFO] |  |  +- org.apiguardian:apiguardian-api:jar:1.1.2:test
[INFO] |  |  \\- org.jspecify:jspecify:jar:1.0.0:test
[INFO] |  +- org.junit.jupiter:junit-jupiter-params:jar:6.1.3:test
[INFO] |  \\- org.junit.jupiter:junit-jupiter-engine:jar:6.1.3:test
[INFO] |     \\- org.junit.platform:junit-platform-engine:jar:6.1.3:test
[INFO] +- org.mockito:mockito-core:jar:5.23.0:test
[INFO] |  +- net.bytebuddy:byte-buddy:jar:1.17.7:test
[INFO] |  +- net.bytebuddy:byte-buddy-agent:jar:1.17.7:test
[INFO] |  \\- org.objenesis:objenesis:jar:3.3:test
[INFO] \\- org.mockito:mockito-junit-jupiter:jar:5.23.0:test`}
      </CodeBlock>

      <InfoBox variant="info" title="Two version notes worth having in your head">
        <ul>
          <li>
            <strong>mockito-junit-jupiter 5.23.0 declares junit-jupiter-api 5.13.4</strong>, but
            it runs fine against JUnit Jupiter 6.1.3 — Maven&apos;s nearest-wins resolution puts
            6.1.3 on the classpath and <code>MockitoExtension</code> works unchanged. Verified,
            not assumed. Do not let the transitive 5.13.4 in the tree talk you into downgrading.
          </li>
          <li>
            <strong>Surefire must be 3.5.2 or newer to discover JUnit 6 tests.</strong> An older
            Surefire does not fail — it reports zero tests and a green build, which is worse.
          </li>
        </ul>
      </InfoBox>

      <h3>The JDK 26 self-attach warning — new, and you will hit it</h3>
      <p>
        Mockito&apos;s inline mock maker needs a Java agent. Historically it attached one to its
        own JVM at runtime. Modern JDKs are closing that door, and on JDK 26 the very first test
        that touches Mockito prints this:
      </p>

      <CodeBlock language="text" title="Real output — JDK 26.0.1, Mockito 5.23.0, no agent configured">
{`Mockito is currently self-attaching to enable the inline-mock-maker. This will no longer work in future releases of the JDK. Please add Mockito as an agent to your build as described in Mockito's documentation: https://javadoc.io/doc/org.mockito/mockito-core/latest/org.mockito/org/mockito/Mockito.html#0.3
WARNING: A Java agent has been loaded dynamically (.../net/bytebuddy/byte-buddy-agent/1.17.7/byte-buddy-agent-1.17.7.jar)
WARNING: If a serviceability tool is in use, please run with -XX:+EnableDynamicAgentLoading to hide this warning
WARNING: If a serviceability tool is not in use, please run with -Djdk.instrument.traceUsage for more information
WARNING: Dynamic loading of agents will be disallowed by default in a future release`}
      </CodeBlock>

      <p>
        &ldquo;Will be disallowed by default in a future release&rdquo; means this becomes a
        hard failure, not a warning, on some JDK you have not upgraded to yet. The fix is to
        pass the agent explicitly. Two plugins: <code>maven-dependency-plugin</code> resolves the
        Mockito jar into a property, and Surefire puts it on the command line.
      </p>

      <CodeBlock language="xml" title="The fix — verified to silence every line above">
{`<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-dependency-plugin</artifactId>
    <version>3.7.0</version>
    <executions>
        <execution>
            <goals><goal>properties</goal></goals>
        </execution>
    </executions>
</plugin>
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.5.6</version>
    <configuration>
        <!-- the 'properties' goal above defines this property -->
        <argLine>-javaagent:\${org.mockito:mockito-core:jar}</argLine>
    </configuration>
</plugin>`}
      </CodeBlock>

      <CodeBlock language="text" title="Same test class, after adding the agent">
{`[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running lab.mock.StaticAndFinalTest
>>> reference = fixed-id-SW1A1AA
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.207 s

# All five warning lines are gone.`}
      </CodeBlock>

      <h2>@ExtendWith, @Mock, @InjectMocks</h2>
      <p>
        The extension does three things before each test: creates a mock for every{' '}
        <code>@Mock</code> field, constructs the <code>@InjectMocks</code> field with those
        mocks, and — after the test — enforces strict stubbing. That last one is covered in
        detail further down; it is the reason the extension is worth using over a bare{' '}
        <code>mock()</code> call.
      </p>

      <CodeBlock language="java" title="The standard shape, verified running">
{`@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock PricingApi      pricing;
    @Mock OrderRepository repository;
    @Mock EmailSender     email;
    @Mock AuditLog        audit;

    @InjectMocks OrderService service;   // built from the four mocks above

    @Test
    void extensionWiresMocksAndInjectsThem() {
        when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);

        Order order = service.place("SKU-1", 3, "ada@example.com");

        assertEquals(2997, order.totalCents());
        verify(repository).save(order);
        verify(email).send("ada@example.com", "Order confirmed", "You ordered 3 x SKU-1");
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="You may not need @InjectMocks at all">
        <p>
          If the class takes its dependencies through a constructor — and it should — then{' '}
          <code>new OrderService(pricing, repository, email, audit)</code> is one line, is
          checked by the compiler, and fails at the constructor call if you forget an argument.
          <code>@InjectMocks</code> is reflection that does the same job while giving up both of
          those properties. The section near the end of this lesson shows exactly what that
          costs.
        </p>
      </InfoBox>

      <h2>mock() vs spy()</h2>
      <p>
        <code>mock(Foo.class)</code> gives you an object where <strong>every</strong> method is
        replaced. Nothing of the original runs. Unstubbed methods return the type&apos;s empty
        value: <code>null</code> for objects, <code>0</code> for numbers, <code>false</code> for
        booleans, an empty collection for collection types.
      </p>
      <p>
        <code>spy(new Foo())</code> wraps a <em>real instance</em>. Every method runs the real
        implementation unless you have specifically overridden it. It is a partial mock, and it
        exists for one legitimate situation: a legacy class you cannot refactor, where you need
        real behaviour for most methods and a stub for one.
      </p>

      <FlowChart
        title="mock, spy, or the real object?"
        chart={"graph TD\nA[I need a collaborator in this test] --> B{Is the real object fast and deterministic?}\nB -->|Yes| C[Use the real object, no Mockito needed]\nB -->|No| D{Do I want real behaviour for SOME methods?}\nD -->|No, replace everything| E[\"mock(Foo.class) or @Mock\"]\nD -->|Yes, override one or two| F[\"spy(new Foo()) or @Spy\"]\nE --> G[\"Stub with when(mock.m()).thenReturn(v)\"]\nF --> H[\"Stub with doReturn(v).when(spy).m()\"]\nF --> I[A spy is usually a design smell, split the class instead]"}
      />

      <h3>The trap: when() on a spy calls the REAL method</h3>
      <p>
        This is the single most surprising thing in Mockito, and the reason is mechanical.{' '}
        <code>when(spy.taxFor(-1))</code> is ordinary Java: to evaluate the argument to{' '}
        <code>when()</code>, the JVM must <strong>call</strong> <code>spy.taxFor(-1)</code>{' '}
        first. On a mock that is harmless — the call does nothing and returns a default. On a
        spy, the real method body executes.
      </p>

      <CodeBlock language="java" title="A real method with a side effect and a guard clause">
{`public class TaxCalculator {
    public long taxFor(long amountCents) {
        System.out.println("    !! REAL taxFor() ran with amountCents=" + amountCents);
        if (amountCents < 0) {
            throw new IllegalArgumentException("amount must not be negative, was " + amountCents);
        }
        return amountCents * 20 / 100;
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Both forms, side by side">
{`@Test
void whenOnASpyCallsTheRealMethod() {
    TaxCalculator taxes = spy(new TaxCalculator());

    System.out.println(">>> about to call when(spy.taxFor(-1))");
    IllegalArgumentException boom = assertThrows(IllegalArgumentException.class,
        () -> when(taxes.taxFor(-1)).thenReturn(0L));      // <-- throws DURING STUBBING
    System.out.println(">>> stubbing threw: " + boom.getClass().getName() + ": " + boom.getMessage());
}

@Test
void doReturnDoesNotCallTheRealMethod() {
    TaxCalculator taxes = spy(new TaxCalculator());

    System.out.println(">>> about to call doReturn(0L).when(spy).taxFor(-1)");
    doReturn(0L).when(taxes).taxFor(-1);                   // <-- no real invocation
    System.out.println(">>> stubbing completed with no real invocation");

    assertEquals(0L, taxes.taxFor(-1));
    assertEquals(200L, taxes.taxFor(1000));                // unstubbed -> real method runs
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — both tests, JDK 26.0.1 / Mockito 5.23.0">
{`>>> about to call when(spy.taxFor(-1))
    !! REAL taxFor() ran with amountCents=-1
>>> stubbing threw: java.lang.IllegalArgumentException: amount must not be negative, was -1
>>> about to call doReturn(0L).when(spy).taxFor(-1)
>>> stubbing completed with no real invocation
    !! REAL taxFor() ran with amountCents=1000`}
      </CodeBlock>

      <InfoBox variant="danger" title="Read the order of those lines carefully">
        <p>
          <code>!! REAL taxFor() ran</code> is printed <em>before</em> the stubbing line. The
          real method executed while you were trying to describe how it should be replaced. Here
          the guard clause threw, so you at least get a loud failure — but note that the
          exception is an <code>IllegalArgumentException</code> from your production class, not
          a Mockito error, so the stack trace points at the thing you were trying to stub and
          reads exactly like a bug in the code under test.
        </p>
        <p>
          The genuinely dangerous version is when the real method does <strong>not</strong>{' '}
          throw. Then it quietly runs — inserting the database row, sending the email,
          incrementing the counter — the stubbing succeeds, and your test passes with a side
          effect nobody knows about. In the second test above, the last line is the same thing
          happening on purpose: <code>taxFor(1000)</code> was never stubbed, so the real method
          ran and returned 200.
        </p>
        <p>
          <strong>Rule: on a spy, always stub with <code>doReturn(...).when(spy).method()</code>.</strong>{' '}
          Never <code>when(spy.method())</code>. The <code>doX</code> family puts the mock into
          stubbing mode before the method reference is evaluated, so nothing real is invoked.
        </p>
      </InfoBox>

      <h2>Stubbing</h2>
      <p>
        Four shapes cover essentially everything. All four outputs below are real.
      </p>

      <CodeBlock language="java" title="thenReturn and thenThrow">
{`@Test
void thenReturnAndThenThrow() {
    when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);
    when(pricing.unitPriceCents("SKU-GONE"))
        .thenThrow(new IllegalStateException("no price for SKU-GONE"));

    assertEquals(2997, service().place("SKU-1", 3, "a@b.com").totalCents());

    var ex = assertThrows(IllegalStateException.class,
                          () -> service().place("SKU-GONE", 1, "a@b.com"));
    System.out.println(">>> thenThrow produced: " + ex.getMessage());
}`}
      </CodeBlock>

      <CodeBlock language="java" title="thenAnswer — compute the response from the arguments">
{`@Test
void thenAnswerComputesFromTheArguments() {
    when(pricing.unitPriceCents(anyString()))
        .thenAnswer(inv -> (long) inv.<String>getArgument(0).length() * 100);

    assertEquals(500L * 2, service().place("SKU-1", 2, "a@b.com").totalCents());
}

// The workhorse use of thenAnswer is echoing an argument back, which is how you
// stub a repository save() that returns the saved entity:
when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));`}
      </CodeBlock>

      <CodeBlock language="java" title="Consecutive returns — different answer per call">
{`@Test
void consecutiveReturnsForRetryLogic() {
    when(pricing.unitPriceCents("SKU-1")).thenReturn(100L, 200L, 300L);

    System.out.println(">>> consecutive: " + pricing.unitPriceCents("SKU-1")
                     + ", " + pricing.unitPriceCents("SKU-1")
                     + ", " + pricing.unitPriceCents("SKU-1")
                     + ", " + pricing.unitPriceCents("SKU-1") + " (4th reuses the last)");
}

// You can chain the fluent form too, and mix outcomes — this is how you test
// "fails twice, then succeeds" retry logic:
when(client.fetch()).thenThrow(new TimeoutException())
                    .thenThrow(new TimeoutException())
                    .thenReturn(response);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — all three stubbing tests">
{`>>> thenThrow produced: no price for SKU-GONE
>>> thenAnswer: SKU-1 has 5 chars -> 500 cents each
>>> consecutive: 100, 200, 300, 300 (4th reuses the last)`}
      </CodeBlock>

      <InfoBox variant="warning" title="The last value repeats forever">
        <p>
          Note the fourth call in that output: <code>300</code>, not an error and not{' '}
          <code>0</code>. Once a consecutive stub runs out of values, Mockito keeps returning
          the final one indefinitely. If your test depends on &ldquo;the third call behaves
          differently&rdquo;, that is fine; if you were expecting call four to fail loudly
          because you did not describe it, it will not.
        </p>
      </InfoBox>

      <h2>Verification</h2>
      <p>
        <code>verify()</code> is behaviour verification, and everything the previous lesson said
        about over-using it applies here with more force, because Mockito makes it so easy.
      </p>

      <CodeBlock language="java" title="times, never, atLeast">
{`@Test
void verifyTimesNeverAtLeast() {
    when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);
    var svc = service();
    svc.place("SKU-1", 1, "a@b.com");
    svc.place("SKU-1", 2, "a@b.com");

    verify(repository, times(2)).save(any());                       // exactly 2
    verify(email, atLeast(1)).send(eq("a@b.com"), anyString(), anyString());
    verify(audit, never()).record(anyString());                     // 0 times
    verify(repository, never()).findBySku(anyString());
}

// verify(mock) with no mode is shorthand for verify(mock, times(1)).
// Other modes: atMost(n), atLeastOnce(), only(), timeout(ms) for async code.`}
      </CodeBlock>

      <InfoBox variant="tip" title="never() is the most valuable verification mode">
        <p>
          Positive verifications largely duplicate what a state assertion already proves.{' '}
          <code>never()</code> does not: &ldquo;does <em>not</em> charge the card when the order
          is rejected&rdquo;, &ldquo;does <em>not</em> email the customer on a dry run&rdquo;.
          Those are real requirements with no observable state to assert on, and they are
          exactly the bugs that reach production. If you only use one verification mode, use
          this one.
        </p>
      </InfoBox>

      <h3>verifyNoMoreInteractions — usually a mistake</h3>
      <p>
        It asserts that every interaction with a mock has been explicitly verified. That sounds
        rigorous. In practice it converts your test into a snapshot of the current
        implementation, and it fails when someone adds a call that has nothing to do with what
        the test is about.
      </p>
      <p>
        Here is that, run for real. A test about the confirmation email. Then v2 of the service
        adds one audit line:
      </p>

      <CodeBlock language="java" title="The test, and the one-line change that breaks it">
{`// v2 of place() added exactly one statement:
    audit.record("placed " + sku);           // <-- NEW in v2

@Test
void verifyNoMoreInteractionsBreaksWhenAnUnrelatedCallIsAdded() {
    when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);
    var svc = new OrderServiceWithAudit(pricing, repository, email, audit);

    svc.place("SKU-1", 3, "ada@example.com");

    // This test is ABOUT the confirmation email.
    verify(email).send("ada@example.com", "Order confirmed", "You ordered 3 x SKU-1");
    verifyNoMoreInteractions(audit);   // v2 added audit.record() -> boom
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real failure">
{`org.mockito.exceptions.verification.NoInteractionsWanted:

No interactions wanted here:
-> at lab.mock.StubbingAndVerifyingTest.verifyNoMoreInteractionsBreaksWhenAnUnrelatedCallIsAdded(StubbingAndVerifyingTest.java:97)
But found this interaction on mock 'audit':
-> at lab.mockdomain.OrderServiceWithAudit.place(OrderServiceWithAudit.java:23)
Actually, above is the only interaction with this mock.`}
      </CodeBlock>

      <InfoBox variant="warning" title="What that red build actually told the team">
        <p>
          Adding an audit log line is a strictly additive, obviously-safe change. It broke a
          test whose name says it is about the confirmation email, and the failure message
          points at a line in production code that is working exactly as intended. The only
          available action is to edit the test to permit the new call — which means the
          assertion never had any content; it just had to be kept in sync.
        </p>
        <p>
          Multiply that across a suite and you get the outcome the previous lesson warned about:
          developers learn that touching code means fixing unrelated tests, so they stop
          touching code. Use <code>verifyNoMoreInteractions</code> only where
          &ldquo;absolutely nothing else happened&rdquo; is a genuine requirement — a dry-run
          mode, an idempotency guard, an audited security boundary. Not by default, and never
          as a habit.
        </p>
      </InfoBox>

      <h2>ArgumentCaptor</h2>
      <p>
        A captor grabs the actual object that was passed to a mock so you can assert on it
        afterwards. This is the Mockito equivalent of the hand-rolled spy from the previous
        lesson — record the call, inspect it in the Assert phase.
      </p>

      <CodeBlock language="java" title="Capture the saved entity and assert on its fields">
{`@Captor ArgumentCaptor<Order> savedOrder;      // or ArgumentCaptor.forClass(Order.class)

@Test
void argumentCaptorInspectsWhatWasActuallyPassed() {
    when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);

    service().place("SKU-1", 3, "a@b.com");

    verify(repository).save(savedOrder.capture());
    Order captured = savedOrder.getValue();
    System.out.println(">>> captured: " + captured);
    assertAll(
        () -> assertEquals("SKU-1", captured.sku()),
        () -> assertEquals(3, captured.quantity()),
        () -> assertEquals(2997, captured.totalCents()));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`>>> captured: Order[sku=SKU-1, quantity=3, totalCents=2997]`}
      </CodeBlock>

      <InfoBox variant="info" title="When a captor beats a matcher">
        <p>
          You could write <code>verify(repository).save(new Order(&quot;SKU-1&quot;, 3, 2997))</code>{' '}
          and let <code>equals</code> do the work. Prefer the captor when:
        </p>
        <ul>
          <li>
            <strong>The object has fields you cannot predict</strong> — a generated UUID, a
            timestamp. A captor lets you assert on the three fields you care about and ignore
            the rest; an equality matcher forces you to know all of them.
          </li>
          <li>
            <strong>The type has no useful <code>equals</code></strong> — a JPA entity with
            identity semantics, or any class that did not override it. Equality matching
            silently becomes reference matching and never passes.
          </li>
          <li>
            <strong>You want a good failure message.</strong> A failed argument matcher tells
            you the whole object did not match and prints both in full. A failed assertion on{' '}
            <code>captured.totalCents()</code> tells you <code>expected: 2997 but was: 999</code>.
          </li>
          <li>
            <strong>You need the sequence.</strong> <code>getAllValues()</code> returns every
            captured call in order, which is how you assert on a batch of saves.
          </li>
        </ul>
        <p>
          Use the plain matcher when the object is a small value object with real{' '}
          <code>equals</code> and every field is predictable — then the one-liner is clearer.
        </p>
      </InfoBox>

      <h2>Argument Matchers — and the Rule That Trips Everyone</h2>
      <p>
        Matchers let you stub or verify without naming exact values: <code>any()</code>,{' '}
        <code>anyString()</code>, <code>anyLong()</code>, <code>argThat(predicate)</code>,{' '}
        <code>isNull()</code>. They work by pushing an entry onto a thread-local stack as they
        are evaluated, which Mockito pops when the mocked method is invoked.
      </p>
      <p>
        That implementation detail produces the rule: <strong>if you use a matcher for one
        argument, you must use matchers for all of them.</strong> A raw value pushes nothing
        onto the stack, so the counts do not line up.
      </p>

      <CodeBlock language="java" title="The mistake — one raw String among two matchers">
{`@Test
void mixingRawValuesWithMatchersBlowsUp() {
    EmailSender email = mock(EmailSender.class);
    // subject and body use matchers, 'to' is a raw String -> illegal
    doNothing().when(email).send("ada@example.com", anyString(), anyString());
    email.send("ada@example.com", "s", "b");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real InvalidUseOfMatchersException — Mockito 5.23.0">
{`org.mockito.exceptions.misusing.InvalidUseOfMatchersException:

Invalid use of argument matchers!
3 matchers expected, 2 recorded:
-> at lab.mock.MatchersTest.mixingRawValuesWithMatchersBlowsUp(MatchersTest.java:14)
-> at lab.mock.MatchersTest.mixingRawValuesWithMatchersBlowsUp(MatchersTest.java:14)

This exception may occur if matchers are combined with raw values:
    //incorrect:
    someMethod(any(), "raw String");
When using matchers, all arguments have to be provided by matchers.
For example:
    //correct:
    someMethod(any(), eq("String by matcher"));

For more info see javadoc for Matchers class.`}
      </CodeBlock>

      <p>
        &ldquo;3 matchers expected, 2 recorded&rdquo; is the whole story: the method takes three
        arguments, so Mockito expected three stack entries and found two. The fix is{' '}
        <code>eq()</code>, which is a matcher that matches one specific value:
      </p>

      <CodeBlock language="java" title="The fix — wrap the raw value in eq()">
{`// WRONG
doNothing().when(email).send("ada@example.com", anyString(), anyString());

// RIGHT — all three are matchers
doNothing().when(email).send(eq("ada@example.com"), anyString(), anyString());

// ALSO RIGHT — no matchers at all, all raw values
doNothing().when(email).send("ada@example.com", "Order confirmed", "body");

// argThat for a condition matchers do not cover
verify(repository).save(argThat(o -> o.totalCents() > 1000));`}
      </CodeBlock>

      <InfoBox variant="danger" title="The failure lands in the WRONG test — verified">
        <p>
          A misused matcher leaves the thread-local stack dirty, and Mockito does not always
          detect it at the offending line. It detects it at the <em>next</em> mock interaction —
          which may be in a completely different test class.
        </p>
        <p>
          In the run for this lesson, <code>MatchersTest</code> failed as expected. Then{' '}
          <code>StrictStubsTest</code> — a different file, testing something unrelated — failed
          too, with a stack trace pointing into <code>MatchersTest</code>:
        </p>
        <CodeBlock language="text" title="Real cross-contamination, same JVM">
{`[INFO] Running lab.mock.StrictStubsTest
[ERROR] lab.mock.StrictStubsTest.stubForASkuTheCodeNeverAsksFor <<< ERROR!
org.mockito.exceptions.misusing.UnfinishedStubbingException:

Unfinished stubbing detected here:
-> at lab.mock.MatchersTest.mixingRawValuesWithMatchersBlowsUp(MatchersTest.java:14)

E.g. thenReturn() may be missing.
Hints:
 1. missing thenReturn()
 2. you are trying to stub a final method, which is not supported
 3. you are stubbing the behaviour of another mock inside before 'thenReturn' ...

	at lab.mock.StrictStubsTest.stubForASkuTheCodeNeverAsksFor(StrictStubsTest.java:22)`}
        </CodeBlock>
        <p>
          Run that class on its own and it passes. This is the practical lesson: when a Mockito
          failure names a file that is not the failing test, or a test only fails as part of the
          full suite, look for a matcher misuse or an unfinished <code>when()</code> earlier in
          the run. Chasing the reported test is chasing the victim, not the cause.
        </p>
      </InfoBox>

      <h2>Strict Stubs</h2>
      <p>
        Since Mockito 2, and enforced by <code>MockitoExtension</code> by default, unused
        stubbings fail the test. This surprises people who expect a stub to be harmless.
      </p>

      <CodeBlock language="java" title="One stub the code never asks for">
{`@Test
void stubForASkuTheCodeNeverAsksFor() {
    when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);
    when(pricing.unitPriceCents("SKU-2")).thenReturn(500L);   // never used

    var service = new OrderService(pricing, repository, email, audit);
    assertEquals(2997, service.place("SKU-1", 3, "ada@example.com").totalCents());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real UnnecessaryStubbingException — note it fires in afterEach">
{`org.mockito.exceptions.misusing.UnnecessaryStubbingException:

Unnecessary stubbings detected.
Clean & maintainable test code requires zero unnecessary code.
Following stubbings are unnecessary (click to navigate to relevant line of code):
  1. -> at lab.mock.StrictStubsTest.stubForASkuTheCodeNeverAsksFor(StrictStubsTest.java:23)
Please remove unnecessary stubbings or use 'lenient' strictness. More info: javadoc for UnnecessaryStubbingException class.
	at org.mockito.junit.jupiter.MockitoExtension.lambda$afterEach$2(MockitoExtension.java:200)
	at java.base/java.util.Optional.ifPresent(Optional.java:182)
	at org.mockito.junit.jupiter.MockitoExtension.afterEach(MockitoExtension.java:198)`}
      </CodeBlock>

      <InfoBox variant="success" title="Why this is a feature, not an annoyance">
        <p>
          An unused stub is a lie in the test. It says &ldquo;this test needs the pricing API to
          answer for SKU-2&rdquo; when the code path never asks. Every such line is a reader
          being misled about what the test covers, and they accumulate: a method gets deleted,
          the stub for it stays, and two years later the test reads as if it exercises code that
          no longer exists.
        </p>
        <p>
          It is also a genuine bug detector. If you stubbed a method and the code never called
          it, one of two things is true — the stub is dead, or <em>the code should have called
          it and does not</em>. Loose stubbing hides the second case completely; strict stubbing
          turns it into a red build. That is why Mockito changed the default.
        </p>
      </InfoBox>

      <p>
        There is an escape hatch, and it should be rare. <code>lenient()</code> exempts a single
        stubbing; <code>@MockitoSettings(strictness = Strictness.LENIENT)</code> exempts a whole
        class.
      </p>

      <CodeBlock language="java" title="lenient() — verified to pass with an unused stub">
{`@Test
void lenientStubbingIsExemptFromStrictChecks() {
    when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);
    lenient().when(pricing.unitPriceCents("SKU-2")).thenReturn(500L);  // unused, no failure

    var svc = new OrderService(pricing, repository, email, audit);
    assertEquals(2997, svc.place("SKU-1", 3, "a@b.com").totalCents());
}
// >>> lenient() stub went unused and the test still passed`}
      </CodeBlock>
      <p>
        The legitimate use is a shared <code>@BeforeEach</code> that stubs a collaborator most
        tests in the class need and two do not. Reaching for class-wide{' '}
        <code>LENIENT</code> because a suite went red after a Mockito upgrade throws away the
        detector along with the noise — fix the stubs instead.
      </p>

      <h2>Mocking void Methods</h2>
      <p>
        <code>when(mock.voidMethod())</code> does not compile — there is no value to pass to{' '}
        <code>when()</code>. Use the <code>doX</code> family, which puts the mock into stubbing
        mode first. This is the same mechanism that makes <code>doReturn</code> safe on spies.
      </p>

      <FlowChart
        title="Which stubbing API?"
        chart={"graph TD\nA[I want to stub a method] --> B{Is it on a mock or a spy?}\nB -->|Spy| C[\"ALWAYS doReturn(v).when(spy).m()\"]\nC --> D[when on a spy runs the real method first]\nB -->|Mock| E{Does the method return a value?}\nE -->|Yes| F[\"when(mock.m()).thenReturn(v)\"]\nE -->|No, it is void| G{What should it do?}\nG -->|Nothing| H[\"doNothing()\"]\nG -->|Throw| I[\"doThrow(ex)\"]\nG -->|Run a side effect| J[\"doAnswer(inv -> ...)\"]"}
      />

      <CodeBlock language="java" title="doNothing, doThrow, doAnswer">
{`// doNothing() — the DEFAULT for a void method on a mock, so you rarely write it.
// It is only needed to reset a spy, or to change behaviour between calls:
doNothing().doThrow(new IllegalStateException("SMTP down")).when(email)
           .send(anyString(), anyString(), anyString());

@Test
void doThrowOnAVoidMethod() {
    when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);
    doThrow(new IllegalStateException("SMTP down")).when(email)
        .send(anyString(), anyString(), anyString());

    var svc = new OrderService(pricing, repository, email, audit);
    var ex = assertThrows(IllegalStateException.class,
                          () -> svc.place("SKU-1", 1, "a@b.com"));
    System.out.println(">>> doThrow on void: " + ex.getMessage());
    verify(repository).save(any());   // proves save happened BEFORE the email blew up
}

@Test
void doAnswerCapturesSideEffectsOfAVoidMethod() {
    when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);
    List<String> outbox = new ArrayList<>();
    doAnswer(inv -> {
        outbox.add(inv.getArgument(0) + " / " + inv.getArgument(1));
        return null;                  // void answers MUST return null
    }).when(email).send(anyString(), anyString(), anyString());

    new OrderService(pricing, repository, email, audit).place("SKU-1", 1, "a@b.com");
    System.out.println(">>> doAnswer outbox = " + outbox);
    assertEquals(List.of("a@b.com / Order confirmed"), outbox);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`>>> doAnswer outbox = [a@b.com / Order confirmed]
>>> doThrow on void: SMTP down`}
      </CodeBlock>

      <InfoBox variant="tip" title="That verify() in the doThrow test is the interesting part">
        <p>
          <code>verify(repository).save(any())</code> after the exception proves the order was
          persisted <em>before</em> the email failed — which is a real question about failure
          ordering that no state assertion can answer. Injecting a failure with{' '}
          <code>doThrow</code> and then verifying what did and did not happen around it is the
          most valuable thing this API is for. Note also that <code>doAnswer</code> on a void
          method must <code>return null</code>; returning anything else throws.
        </p>
      </InfoBox>

      <h2>@InjectMocks and Its Silent Failure Mode</h2>
      <p>
        <code>@InjectMocks</code> constructs the class under test and fills its dependencies by
        reflection — constructor injection first, then setters, then fields. When it{' '}
        <strong>cannot</strong> find a mock for a dependency, it does not fail, does not warn,
        and does not log. It passes <code>null</code> and moves on.
      </p>

      <CodeBlock language="java" title="One @Mock field is missing. Nothing complains.">
{`@ExtendWith(MockitoExtension.class)
class InjectMocksNpeTest {

    @Mock PricingApi pricing;
    @Mock OrderRepository repository;
    @Mock AuditLog audit;
    // NOTE: no @Mock EmailSender declared. Mockito says nothing about this.
    @InjectMocks OrderService service;

    @Test
    void injectMocksSilentlyLeavesTheMissingDependencyNull() {
        when(pricing.unitPriceCents("SKU-1")).thenReturn(999L);
        assertNotNull(service, "the SUT itself is constructed fine");
        service.place("SKU-1", 3, "ada@example.com");
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real failure — an NPE deep inside production code">
{`java.lang.NullPointerException: Cannot invoke "lab.basics.EmailSender.send(String, String, String)" because "this.email" is null
	at lab.basics.OrderService.place(OrderService.java:24)
	at lab.mock.InjectMocksNpeTest.injectMocksSilentlyLeavesTheMissingDependencyNull(InjectMocksNpeTest.java:26)`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why this one costs so much time">
        <p>
          Read that stack trace as you would at 6pm. The top frame is{' '}
          <code>OrderService.place</code>, line 24 — <em>production code</em>. Nothing in the
          message mentions Mockito, <code>@InjectMocks</code>, or a missing mock. The obvious
          reading is &ldquo;there is a null-safety bug in OrderService&rdquo;, and people go and
          add a null check to production code to fix a broken test setup.
        </p>
        <p>
          The <code>assertNotNull(service)</code> passes, which makes it worse: the object was
          constructed, so the wiring &ldquo;looks&rdquo; fine. Only the one field is null. Helpful
          NPE messages (on by default since JDK 15) are the only reason this is diagnosable at
          all — <code>because &quot;this.email&quot; is null</code> names the field. On an older
          JDK you get a bare NPE and a line number.
        </p>
        <p>
          <strong>The fix is to not use <code>@InjectMocks</code>.</strong> Construct the class
          yourself. <code>new OrderService(pricing, repository, email, audit)</code> is a{' '}
          <em>compile error</em> when a dependency is missing, delivered instantly in your
          editor, naming the exact parameter — instead of a runtime NPE pointing at the wrong
          file. You give up one line of typing and gain the entire type system.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="The version that cannot fail this way">
{`@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock PricingApi pricing;
    @Mock OrderRepository repository;
    @Mock EmailSender email;
    @Mock AuditLog audit;

    OrderService service;

    @BeforeEach
    void setUp() {
        // Forget an argument here and the build fails before any test runs.
        service = new OrderService(pricing, repository, email, audit);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The other @InjectMocks trap: field-name matching">
        <p>
          When two dependencies share a type, Mockito disambiguates by <strong>field
          name</strong>. Two <code>EmailSender</code> fields called <code>email</code> and{' '}
          <code>backupEmail</code> are matched to constructor parameters by name — so renaming a
          constructor parameter, a refactor the compiler considers completely safe, can silently
          swap which mock goes where. Your test then verifies the wrong collaborator and passes.
          Constructor calls are positional and immune to this.
        </p>
      </InfoBox>

      <h2>Where Mockito Genuinely Cannot Help</h2>

      <h3>Static methods</h3>
      <p>
        Mockito 5 can mock statics through <code>mockStatic</code>, using the inline mock maker.
        It is scoped to a try-with-resources block and to the current thread.
      </p>

      <CodeBlock language="java" title="mockStatic — scoped, and it MUST be closed">
{`@Test
void mockStaticIsScopedToTheTryBlock() {
    System.out.println(">>> before mockStatic, real id = " + IdGenerator.newId());

    try (MockedStatic<IdGenerator> ids = mockStatic(IdGenerator.class)) {
        ids.when(IdGenerator::newId).thenReturn("fixed-id");
        System.out.println(">>> inside mockStatic, id = " + IdGenerator.newId());
        assertEquals("fixed-id", IdGenerator.newId());
    }

    System.out.println(">>> after mockStatic, real id again = " + IdGenerator.newId());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`>>> before mockStatic, real id = 302070ec-dc61-4ab1-8eda-6b1f5dc66be3
>>> inside mockStatic, id = fixed-id
>>> after mockStatic, real id again = 891c47bb-97b0-45f7-9755-8aaacb314bdc`}
      </CodeBlock>

      <InfoBox variant="warning" title="mockito-inline is obsolete — do not add it">
        <p>
          Guides written for Mockito 3 tell you to add the <code>mockito-inline</code> artifact
          for static mocking. Do not. <strong>The inline mock maker has been the default since
          Mockito 5</strong>, and <code>mockito-inline</code> was discontinued — its last release
          is 5.2.0, while <code>mockito-core</code> is on 5.23.0. Adding it today pins you to a
          three-year-old engine. Everything in this section ran on plain{' '}
          <code>mockito-core</code> with no extra dependency.
        </p>
      </InfoBox>

      <p>
        The static mock is also <strong>thread-local</strong>, so it does not affect code running
        on another thread, and if you forget to close it — by not using try-with-resources — it
        leaks into every subsequent test in that thread. That is the same class of
        cross-contamination shown in the matchers section, and it is just as confusing to debug.
      </p>

      <h3>Final classes</h3>
      <p>
        Also handled by the inline mock maker, and worth seeing because the evidence is unusual:
      </p>

      <CodeBlock language="java" title="Mocking a final class — works, with no configuration">
{`@Test
void mockito5CanMockFinalClassesOutOfTheBox() {
    PostcodeFormatter formatter = mock(PostcodeFormatter.class);   // final class!
    when(formatter.format("sw1a 1aa")).thenReturn("STUBBED");

    assertEquals("STUBBED", formatter.format("sw1a 1aa"));
    System.out.println(">>> mocked a final class: " + formatter.getClass().getName());
}

// >>> mocked a final class: lab.mockdomain.PostcodeFormatter`}
      </CodeBlock>

      <p>
        Note the class name in that output: <code>lab.mockdomain.PostcodeFormatter</code>, with
        no <code>$MockitoMock$</code> suffix. A subclass-based mock would have one. The inline
        mock maker cannot subclass a final class, so it <em>retransforms the loaded class
        itself</em> via the Java agent. That is why the agent matters, why the JDK 26 self-attach
        warning at the top of this lesson exists, and why static and final mocking are the same
        feature wearing two hats.
      </p>

      <h3>Constructors</h3>
      <p>
        <code>mockConstruction(Foo.class)</code> exists and intercepts <code>new Foo(...)</code>{' '}
        inside its scope. It is the last resort of the three, because unlike a static method
        there is usually a trivial alternative: inject a factory, or pass the object in.
      </p>

      <InfoBox variant="danger" title="Needing any of these three usually means a design problem">
        <p>
          Mockito can do static, final and constructor mocking. That does not make them good
          news. Each one is a signal:
        </p>
        <ul>
          <li>
            <strong>Static method</strong> — a hidden global dependency. <code>LocalDateTime.now()</code>{' '}
            is the classic; the fix is to inject <code>java.time.Clock</code> and pass{' '}
            <code>Clock.fixed(...)</code>. Same for <code>UUID.randomUUID()</code> (inject an{' '}
            <code>IdGenerator</code> interface) and static config lookups. Every one of these
            becomes a normal constructor parameter and a normal <code>@Mock</code>, and the
            production code gets more honest about what it depends on.
          </li>
          <li>
            <strong>Final class you need to stub</strong> — usually a third-party type, which the
            previous lesson covered: wrap it behind an interface you own and mock that instead.
            If it is <em>your</em> final class and it needs stubbing, ask why the collaborator is
            not an interface.
          </li>
          <li>
            <strong>Constructor</strong> — the class is building its own collaborators, so it has
            no seam. Inject them.
          </li>
        </ul>
        <p>
          The practical cost of ignoring this: these mocks are slow (class retransformation is
          not free), they are the leakiest part of the API when a scope is not closed, and they
          let untestable designs survive. Use them to get a legacy class under test so you can
          refactor it — then delete them.
        </p>
      </InfoBox>

      <h2>Bridge — How This Maps onto Spring</h2>
      <p>
        Everything above is plain Mockito with no Spring anywhere, and that is where the large
        majority of your tests should live. When you do need a Spring context, the annotations
        change but the semantics do not: a <code>@MockitoBean</code> is a Mockito mock that has
        been placed into the application context in place of the real bean, and you stub and
        verify it with exactly the <code>when</code> / <code>verify</code> / captor APIs from
        this lesson.
      </p>

      <CodeBlock language="text" title="The mapping">
{`Plain Mockito                     Spring test context
----------------------------------------------------------------
@Mock Foo foo;                    @MockitoBean Foo foo;
@Spy  Foo foo = new Foo();        @MockitoSpyBean Foo foo;
new Sut(mockA, mockB)             @Autowired Sut sut;   (context wires it)
@ExtendWith(MockitoExtension)     @WebMvcTest / @SpringBootTest

Stubbing and verification are IDENTICAL:
    when(foo.bar()).thenReturn(x);
    verify(foo).bar();`}
      </CodeBlock>

      <InfoBox variant="info" title="@MockBean is gone in Boot 4">
        <p>
          <code>@MockBean</code> was the Boot 2 and early Boot 3 idiom. It was deprecated in Boot
          3.4 when <code>@MockitoBean</code> arrived, and the package was{' '}
          <strong>removed in Boot 4</strong> — old code does not deprecate, it fails to compile.
          If you are maintaining an older service, the migration and the exact compiler errors
          are covered in <a href="/springboot2/testing">Testing in Boot 2 — @MockBean and Friends</a>.
        </p>
        <p>
          For the current stack — slice tests, context caching, TestContainers, and where{' '}
          <code>@MockitoBean</code> fits in the pyramid — see{' '}
          <a href="/springboot/testing">Testing in Spring Boot</a>.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="One thing the Spring lessons will tell you that is worth repeating here">
        <p>
          Every distinct set of <code>@MockitoBean</code> declarations produces a{' '}
          <strong>different Spring context cache key</strong>, and therefore a whole new
          application context. Mocking one extra bean in one test class can add seconds to the
          build. Plain Mockito tests have no such cost — which is one more reason to keep the
          bulk of your suite out of Spring entirely.
        </p>
      </InfoBox>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="Signs Mockito is being used well">
        <ul>
          <li>The Mockito agent is configured in the build, so no self-attach warning appears.</li>
          <li>Collaborators that are cheap and deterministic are real objects, not mocks.</li>
          <li>Repeated stubbing of the same interface has been replaced by a hand-written fake.</li>
          <li>Spies are rare, and every one is stubbed with <code>doReturn(...).when(spy)</code>.</li>
          <li>Strict stubs are on; <code>lenient()</code> appears only in shared setup, with a reason.</li>
          <li><code>verifyNoMoreInteractions</code> appears almost nowhere.</li>
          <li><code>never()</code> is used for the behaviours that must not happen.</li>
          <li>Classes under test are constructed with <code>new</code>, not <code>@InjectMocks</code>.</li>
          <li>No <code>mockStatic</code> for the clock or for id generation — those are injected.</li>
          <li>No <code>mockito-inline</code> dependency in the build file.</li>
        </ul>
      </InfoBox>

    </LessonLayout>
  );
}

export default JavaMockito;
