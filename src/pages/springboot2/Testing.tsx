import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Testing() {
  return (
    <LessonLayout
      title="Testing in Boot 2 — @MockBean and Friends"
      sectionId="springboot2"
      lessonIndex={8}
      prev={{ path: '/springboot2/error', label: 'Error Handling & Validation' }}
      next={{ path: '/springboot2/transactions', label: 'Transactions Deep-Dive' }}
    >
      <p>
        Most of a Boot 2 test suite is portable. <code>@SpringBootTest</code>,{' '}
        <code>@WebMvcTest</code>, <code>@DataJpaTest</code>, <code>MockMvc</code>,{' '}
        <code>TestRestTemplate</code>, AssertJ — all of it still exists in Boot 4 under the same
        names. There is exactly one thing that will stop your build, and it is the annotation
        this lesson is named after.
      </p>

      <h2>The @MockBean Timeline</h2>
      <p>
        <code>@MockBean</code> and <code>@SpyBean</code> are the Boot 2 idiom. You will find them
        in essentially every Boot 2 test suite. Their story across three major versions is worth
        knowing precisely, because the failure mode changes at each step.
      </p>

      <FlowChart
        title="One annotation, three eras"
        chart={"graph LR\nA[\"@MockBean on Boot 2.x — the normal idiom\"] --> B[\"@MockBean on Boot 3.0 to 3.3 — still fine\"]\nB --> C[\"@MockBean on Boot 3.4+ — deprecated, marked for removal\"]\nC --> D[\"@MockBean on Boot 4 — package gone, COMPILE ERROR\"]\nC --> E[\"@MockitoBean — the replacement, available from 3.4\"]\nE --> F[\"@MockitoBean on Boot 4 — compiles clean\"]"}
      />

      <h3>Era 1 — Boot 2: this is just how you write tests</h3>
      <CodeBlock language="java" title="A real, passing test on Spring Boot 2.7.18">
{`package demo;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;      // <- the Boot 2 package
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(OrderController.class)
class MockBeanBoot2Test {
    @Autowired MockMvc mvc;
    @MockBean OrderService orders;

    @Test
    void returnsTheMockedOrder() throws Exception {
        given(orders.find("42")).willReturn("mocked-order-42");
        mvc.perform(get("/orders/42"))
           .andExpect(status().isOk())
           .andExpect(content().string("mocked-order-42"));
    }
}`}
      </CodeBlock>
      <CodeBlock language="text" title="Actual result — Boot 2.7.18, JDK 21">
{`[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.747 s - in demo.MockBeanBoot2Test
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS`}
      </CodeBlock>

      <h3>Era 2 — Boot 3.4+: deprecated, and the compiler tells you so</h3>
      <p>
        The same annotation on Spring Boot 3.5.16. The build still succeeds — this is a warning,
        and only if you have deprecation warnings switched on:
      </p>
      <CodeBlock language="text" title="Actual javac output — Boot 3.5.16 with -Dmaven.compiler.showDeprecation=true">
{`[INFO] Compiling 1 source file with javac [debug deprecation parameters release 21] to target/test-classes
[WARNING] .../src/test/java/demo/DeprecationTest.java:[9,6] org.springframework.boot.test.mock.mockito.MockBean in org.springframework.boot.test.mock.mockito has been deprecated and marked for removal
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS`}
      </CodeBlock>
      <InfoBox variant="warning" title="'marked for removal' is a promise, and most builds never show it">
        <p>
          Note the exact wording: <em>deprecated and marked for removal</em>. That is{' '}
          <code>@Deprecated(forRemoval = true)</code>, which is the JDK&apos;s strongest available
          signal short of deleting the class. The catch is that a default Maven build does not
          print per-usage deprecation warnings — you need{' '}
          <code>-Dmaven.compiler.showDeprecation=true</code> (or{' '}
          <code>{'<compilerArgs><arg>-Xlint:deprecation</arg></compilerArgs>'}</code>) to see the
          list at all. Most teams discover the deprecation the day they attempt Boot 4, not during
          the 3.x window when fixing it would have been free.
        </p>
        <p>
          <strong>Turn deprecation warnings on while you are on 3.x.</strong> That single flag
          converts the Boot 4 leg from a surprise into a to-do list.
        </p>
      </InfoBox>

      <h3>Era 3 — Boot 4: removed. This is a compile error, not a warning.</h3>
      <CodeBlock language="text" title="Actual Maven output — Spring Boot 4.1.1, same file">
{`[ERROR] COMPILATION ERROR :
[ERROR] .../src/test/java/demo/MockBeanTest.java:[5,50] package org.springframework.boot.test.mock.mockito does not exist
[ERROR] .../src/test/java/demo/MockBeanTest.java:[9,6] cannot find symbol
  symbol:   class MockBean
  location: class demo.MockBeanTest
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.15.0:testCompile
        (default-testCompile) on project boot4mock: Compilation failure`}
      </CodeBlock>
      <p>
        The entire package <code>org.springframework.boot.test.mock.mockito</code> is gone. There
        is no shim, no property to re-enable it, and no partial migration — every test class using{' '}
        <code>@MockBean</code> or <code>@SpyBean</code> must be converted before the test sources
        will compile at all.
      </p>

      <h2>The Replacement, and Where It Moved To</h2>
      <p>
        The rename is mechanical. The <em>package</em> change is the part that makes a
        find-and-replace fail if you only replace the annotation name.
      </p>

      <CodeBlock language="text" title="Old → new, including the package move">
{`@MockBean     ->  @MockitoBean
@SpyBean      ->  @MockitoSpyBean

org.springframework.boot.test.mock.mockito.MockBean
        ->  org.springframework.test.context.bean.override.mockito.MockitoBean
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            NOT a Boot package any more.

Read that carefully. The old annotation lived in SPRING BOOT
(org.springframework.boot.test...). The new one lives in the
SPRING FRAMEWORK test module (org.springframework.test...).

Why: the capability was generalised into Spring Framework 6.2's "bean
override" support, so it now works in any Spring test — not only in a
Spring Boot one. Boot no longer needs to own it.`}
      </CodeBlock>

      <CodeBlock language="java" title="The same test, converted — compiles clean on Boot 4.1.1">
{`import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class MockBeanTest {
    @MockitoBean OrderService orders;
    @Test void contextLoads() { }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Two ways to do this rename safely">
        <p>
          <strong>Do it on 3.4+, not during the Boot 4 bump.</strong> Both spellings work on Boot
          3.4 through 3.5 — the new one is available and the old one merely warns. Converting
          there means your test suite is green the whole time and the Boot 4 upgrade does not have
          to be debugged with a broken test suite.
        </p>
        <p>
          The order that works: replace the <em>import</em> lines first (that is where the package
          move lives), then the annotation names. An IDE&apos;s
          &quot;Migrate to&quot;/&quot;Replace deprecated&quot; refactoring handles both at once,
          and OpenRewrite has a recipe for it too — see the Migration lesson.
        </p>
      </InfoBox>

      <h3>The wider bean-override family</h3>
      <p>
        Since the mechanism moved into the Framework, it grew siblings. Worth knowing so you can
        pick the right one when you are converting rather than mapping everything to{' '}
        <code>@MockitoBean</code> reflexively.
      </p>
      <CodeBlock language="java" title="Boot 3.4+ / Boot 4">
{`@MockitoBean      Replace the bean with a Mockito mock.     (was @MockBean)
@MockitoSpyBean   Wrap the REAL bean in a Mockito spy.      (was @SpyBean)
@TestBean         Replace the bean with one your test supplies — no Mockito
                  involved. New; there was no Boot 2 equivalent.

// @TestBean looks for a static factory method in the test class:
@TestBean ClockService clockService;
static ClockService clockService() {
    return () -> Instant.parse("2026-01-01T00:00:00Z");
}`}
      </CodeBlock>

      <h2>@SpringBootTest and the Slices</h2>
      <p>
        None of this changed in any way that breaks. It is here because using it{' '}
        <em>well</em> is what makes a legacy suite tolerable to work in, and Boot 2 suites are
        usually the ones that got it wrong.
      </p>

      <CodeBlock language="java" title="@SpringBootTest — the full context">
{`// webEnvironment decides whether a real server starts.
@SpringBootTest(webEnvironment = WebEnvironment.MOCK)          // DEFAULT
//   No servlet container. MockMvc available. Fastest of the four.

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
//   Real embedded Tomcat on a free port. Inject it with @LocalServerPort,
//   or just use TestRestTemplate, which is pre-configured with the base URL.

@SpringBootTest(webEnvironment = WebEnvironment.DEFINED_PORT)
//   Real server on server.port. Avoid — parallel builds collide.

@SpringBootTest(webEnvironment = WebEnvironment.NONE)
//   No web environment at all. For batch/messaging apps.`}
      </CodeBlock>

      <CodeBlock language="java" title="TestRestTemplate — the Boot 2 integration-test client">
{`@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class OrderApiIT {

    @Autowired TestRestTemplate rest;      // auto-configured; base URL already set

    @Test
    void createsAnOrder() {
        ResponseEntity<OrderDto> response =
            rest.postForEntity("/api/orders", new CreateOrder("SKU-1", 2), OrderDto.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().sku()).isEqualTo("SKU-1");
    }
}

// TestRestTemplate vs RestTemplate — the difference that matters:
// TestRestTemplate does NOT throw on 4xx/5xx. It returns the ResponseEntity
// so you can assert on the status. A plain RestTemplate throws
// HttpClientErrorException, which makes "assert we return 404" awkward.
//
// It is still present and supported in Boot 4, so this is NOT migration
// work. For NEW tests, Boot 3.2+ also offers RestClient-based options.`}
      </CodeBlock>

      <h3>The slice annotations</h3>
      <CodeBlock language="text" title="Each one auto-configures a narrow subset of the app">
{`@WebMvcTest(OrderController.class)
    Web layer only: your controller, @ControllerAdvice, converters, filters,
    WebMvcConfigurer, MockMvc. NOT @Service / @Repository / @Component beans.
    => Every collaborator must be supplied as @MockBean (Boot 2) /
       @MockitoBean (Boot 4). That is by design, not an inconvenience.

@DataJpaTest
    JPA only: entities, repositories, TestEntityManager, DataSource.
    Transactional and ROLLED BACK after each test by default.
    Replaces your DataSource with an embedded one if it finds H2 on the
    classpath — @AutoConfigureTestDatabase(replace = NONE) turns that off.

@JsonTest
    Jackson/Gson only: ObjectMapper, plus JacksonTester / JsonContentAssert.
    For serialization contracts — date formats, @JsonProperty names, nulls.

@WebFluxTest, @DataMongoTest, @DataRedisTest, @RestClientTest, @JdbcTest ...
    Same idea, different slice.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why a Boot 2 suite is usually slow — and it is not the tests">
        <p>
          The pattern to look for in legacy code: <code>@SpringBootTest</code> on{' '}
          <em>every</em> test class, because it is the annotation that always works and slices
          require thinking about which beans exist. The result is a suite where every class boots
          the entire application.
        </p>
        <p>
          That would still be survivable if the context were shared — and it is, but only under
          conditions that this style keeps breaking. Spring caches an{' '}
          <code>ApplicationContext</code> and reuses it across test classes{' '}
          <strong>only when the full context key matches</strong>: same configuration classes,
          same <code>@ActiveProfiles</code>, same inline <code>properties</code>, same
          initializers, same web environment — <em>and the same set of bean-override definitions</em>.
        </p>
        <p>
          That last clause is the one that surprises people:{' '}
          <strong>
            your <code>@MockBean</code>/<code>@MockitoBean</code> fields are part of the cache key.
          </strong>{' '}
          Class A mocking <code>PaymentGateway</code> and class B mocking{' '}
          <code>PaymentGateway</code> and <code>ShippingClient</code> are two different contexts,
          each built from scratch. A suite with fifty distinct mock combinations builds fifty
          application contexts.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Diagnosing it — works identically on Boot 2 and Boot 4">
{`logging.level.org.springframework.test.context.cache=DEBUG

# You are looking for lines reporting the cache size and miss count:
#   "Spring test ApplicationContext cache statistics: [DefaultContextCache@...
#    size = 12, maxSize = 32, parentContextCount = 0, hitCount = 40, missCount = 12]"
#
# missCount is the number of contexts actually BUILT. If it is close to your
# number of test classes, nothing is being reused. Note maxSize = 32 by
# default: exceed it and contexts start getting EVICTED, so you can rebuild
# the same context repeatedly in one run.

The fixes, in order of payoff:
  1. Push shared setup into ONE abstract base class and extend it, so the
     context key is identical everywhere.
  2. Use slices (@WebMvcTest / @DataJpaTest) instead of @SpringBootTest.
     A slice context is smaller AND shared with other tests of that slice.
  3. Standardise the mock set in the base class rather than per test class.
  4. Delete @DirtiesContext unless you can explain what it is protecting —
     it evicts the context, forcing the NEXT test to rebuild too.`}
      </CodeBlock>

      <h2>@MockBean Reset Semantics</h2>
      <p>
        Because the context is shared, the mock instance is shared too. Spring handles this for
        you, and the detail is worth knowing because it explains a class of &quot;works alone,
        fails in the suite&quot; bugs.
      </p>
      <CodeBlock language="java" title="The default is MockReset.AFTER">
{`@MockBean OrderService orders;
//   Equivalent to @MockBean(reset = MockReset.AFTER)
//   The mock is reset AFTER each test method: stubs and recorded
//   interactions are cleared, so the next test starts clean.

@MockBean(reset = MockReset.BEFORE)   // reset before each test instead
@MockBean(reset = MockReset.NONE)     // never reset — state leaks BY DESIGN

// The trap is MockReset.NONE, and the reason people reach for it:
// stubbing in a @BeforeAll (which is static and runs once) looks like an
// optimisation. With the default AFTER, that stub is wiped after test one
// and every subsequent test sees a mock returning null. Stub in @BeforeEach
// or in the test method itself.`}
      </CodeBlock>
      <InfoBox variant="note" title="This is unchanged in @MockitoBean">
        <p>
          <code>@MockitoBean</code> keeps the same <code>reset</code> attribute with the same{' '}
          <code>MockReset.AFTER</code> default, so converting does not change behaviour. The only
          thing you are changing is the name and the import.
        </p>
      </InfoBox>

      <h2>JUnit and Mockito Versions</h2>
      <p>
        Boot manages these for you, so &quot;which JUnit am I on&quot; is answered by your Boot
        version. These figures are from <code>mvn dependency:tree</code> on{' '}
        <code>spring-boot-starter-test</code> at each version:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Library</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Boot 2.7.18</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Boot 4.1.1</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>junit-jupiter</code></td>
            <td style={{ padding: '0.75rem' }}>5.8.2</td>
            <td style={{ padding: '0.75rem' }}>6.0.3</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>junit-platform-commons</code></td>
            <td style={{ padding: '0.75rem' }}>1.8.2</td>
            <td style={{ padding: '0.75rem' }}>6.0.3</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>mockito-core</code></td>
            <td style={{ padding: '0.75rem' }}>4.5.1</td>
            <td style={{ padding: '0.75rem' }}>5.23.0</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}><code>assertj-core</code></td>
            <td style={{ padding: '0.75rem' }}>3.22.0</td>
            <td style={{ padding: '0.75rem' }}>3.27.7</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="JUnit 6 renumbered the platform, and that is all it looks like at first">
        <p>
          JUnit 6 unified the version numbers — <code>junit-platform-commons</code> went from the
          1.x line straight to 6.0.3 to match Jupiter. That cosmetic-looking change is a real
          signal: anything pinning <code>junit-platform</code> to a <code>1.x</code> version in
          your build (a BOM, an explicit surefire provider, a Gradle constraint) needs updating,
          and the failure looks like a resolution conflict rather than a version-support message.
        </p>
        <p>
          JUnit 6 requires <strong>Java 17+</strong>, which is not a new constraint if you are
          already on Boot 4. The APIs you use day to day — <code>@Test</code>,{' '}
          <code>@BeforeEach</code>, <code>@ParameterizedTest</code>, assertions — are unchanged.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Old JUnit 4 tests: no vintage engine in the starter">
        <p>
          Spring Boot 2.2 made JUnit 5 the default, and <strong>Boot 2.4 removed{' '}
          <code>junit-vintage-engine</code> from <code>spring-boot-starter-test</code></strong>.
          Confirmed on 2.7.18: the starter pulls <code>junit-jupiter</code>,{' '}
          <code>mockito-core</code>, <code>mockito-junit-jupiter</code>, <code>assertj-core</code>{' '}
          and <code>hamcrest</code> — no vintage engine.
        </p>
        <p>
          So a Boot 2 codebase with surviving JUnit 4 tests has an{' '}
          <em>explicitly re-added</em> vintage dependency somewhere. Find it and treat those tests
          as migration debt: <code>org.junit.Test</code>, <code>@RunWith(SpringRunner.class)</code>
          , <code>@Rule</code> and JUnit 4 <code>@Before</code> are all things you want gone before
          Boot 4, because JUnit 6 is a further step away from them.
        </p>
      </InfoBox>

      <h2>Annotations You Will See in Boot 2 Tests and Should Delete</h2>
      <CodeBlock language="java" title="Vestiges of the JUnit 4 era">
{`@RunWith(SpringRunner.class)          // JUnit 4 only. On JUnit 5: delete it.
@SpringBootTest
public class OldStyleTest { }
//   The JUnit 5 equivalent is @ExtendWith(SpringExtension.class), and you
//   do not need to write that either — @SpringBootTest and every slice
//   annotation are meta-annotated with it already.

@RunWith(MockitoJUnitRunner.class)    // JUnit 4 only.
//   JUnit 5 equivalent: @ExtendWith(MockitoExtension.class)

public class OldStyleTest {
    @Rule public ExpectedException thrown = ExpectedException.none();
    //   JUnit 4 only. Use assertThatThrownBy(...) / assertThrows(...).
}

// Also: JUnit 5 test classes and methods do NOT need to be public.
// package-private is the idiomatic form and it is what Boot's own
// generated tests use.`}
      </CodeBlock>

      <InteractiveChallenge
        question="You are upgrading a Boot 2.7 service. Your plan is: bump straight to Boot 4, then fix whatever breaks. The test suite has 180 classes using @MockBean. What actually happens when you run the build, and what would a better plan have been?"
        options={[
          "Tests compile with deprecation warnings and pass; you fix them later at your leisure",
          "Test compilation fails outright — the package org.springframework.boot.test.mock.mockito no longer exists — so you have no working test suite while debugging the rest of the upgrade. Convert to @MockitoBean on 3.4+ first, where both spellings work",
          "Spring Boot 4 provides a compatibility shim, so @MockBean still resolves but logs a runtime warning per test class",
          "Only the @SpyBean usages break; @MockBean was kept as an alias for @MockitoBean"
        ]}
        correctIndex={1}
        explanation="On Boot 4 the whole package is gone. Real output: 'package org.springframework.boot.test.mock.mockito does not exist' followed by 'cannot find symbol: class MockBean' — a testCompile failure, so nothing in src/test compiles and you cannot run a single test. That is the worst possible moment to lose your test suite, because the rest of a Boot 2 to 4 upgrade (jakarta namespace, Jackson 3, property renames) is exactly the kind of change you want a green suite to validate. The better plan uses the overlap window: @MockitoBean exists from Boot 3.4 onward while @MockBean is merely deprecated, so on 3.4/3.5 you can convert all 180 classes with the suite passing the entire time, then bump to 4 with the test code already correct. Note also that the fix is not a pure rename — the annotation moved from a Spring Boot package to a Spring Framework one (org.springframework.test.context.bean.override.mockito), so replacing only the annotation name while leaving the old import leaves you exactly as broken."
      />

      <InteractiveChallenge
        question="A Boot 2 suite of 200 test classes takes 25 minutes. Almost every class is annotated @SpringBootTest, and most declare two or three @MockBean fields — but the specific set of mocks differs from class to class. Where is the time going?"
        options={[
          "Mockito mock creation is expensive; switching to hand-written stubs is the fix",
          "The @MockBean definitions are part of the context cache key, so each distinct combination of mocks builds a separate ApplicationContext — you are booting the app up to 200 times",
          "@SpringBootTest starts a real Tomcat by default, so 200 servers are being started and stopped",
          "MockReset.AFTER forces a full context refresh between test methods"
        ]}
        correctIndex={1}
        explanation="Spring's TestContext framework caches an ApplicationContext and reuses it across classes only when the whole context key matches — configuration classes, active profiles, inline properties, initializers, web environment, AND the set of bean override (@MockBean / @MockitoBean) definitions. Varying the mock set per class therefore varies the key per class, so almost nothing is reused and the application is built from scratch each time. Turn on logging.level.org.springframework.test.context.cache=DEBUG and read missCount: if it approaches your class count, that is the whole story. Also watch maxSize, which defaults to 32 — beyond that, contexts are evicted and can be rebuilt more than once in a single run. Option 3 is wrong because @SpringBootTest defaults to WebEnvironment.MOCK, which starts no server. Option 4 is wrong because MockReset resets the mock, not the context — that is the cheap part, and it is exactly what lets a context be shared safely. The fixes are structural: one abstract base class holding the shared configuration and the standard mock set, and slices instead of full-context tests wherever the test only touches one layer."
      />

      <InfoBox variant="success" title="Testing checklist for the upgrade">
        <ul>
          <li>
            Turn on <code>-Xlint:deprecation</code> while you are still on 3.x — it turns the Boot
            4 test breakage into a list you can work through.
          </li>
          <li>
            Convert <code>@MockBean</code> → <code>@MockitoBean</code> and{' '}
            <code>@SpyBean</code> → <code>@MockitoSpyBean</code>{' '}
            <strong>on Boot 3.4+</strong>, where both work. Fix the imports, not just the names.
          </li>
          <li>
            Delete <code>@RunWith(SpringRunner.class)</code> and any surviving JUnit 4 constructs;
            find whoever re-added <code>junit-vintage-engine</code> and remove it.
          </li>
          <li>
            Check for <code>junit-platform</code> pins on the <code>1.x</code> line before the
            JUnit 6 jump.
          </li>
          <li>
            While you are editing every test file anyway, downgrade the ones that do not need a
            full context to slices. It is the cheapest suite-speed win you will ever get, and you
            are already touching the files.
          </li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}

export default SpringBoot2Testing;
