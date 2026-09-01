import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Contract() {
  return (
    <LessonLayout
      title="Contract & Property-Based Testing"
      sectionId="testing"
      lessonIndex={6}
      prev={{ path: '/testing/testcontainers', label: 'Testcontainers & Test Data' }}
      next={{ path: '/testing/e2e', label: 'End-to-End Testing' }}
    >
      <h2>The Microservices Integration Problem</h2>
      <p>
        In a microservices architecture, teams own services independently. A provider
        team changes a response field name; a consumer team&apos;s service silently breaks
        in production because nothing caught the mismatch until it shipped. Full
        end-to-end tests across every service combination would catch this, but they&apos;re
        slow, flaky, and require standing up the entire system for every change —
        infeasible once you have more than a handful of services.
      </p>

      <p>
        <strong>Consumer-Driven Contract Testing</strong> solves this without full E2E
        tests. The consumer defines exactly what it expects from the provider&apos;s API
        (a &quot;contract&quot;), and that contract is verified independently against both sides —
        fast, isolated, and it fails the build the moment either side breaks the agreement.
      </p>

      <h2>Pact&apos;s Consumer/Provider/Broker Model</h2>
      <p>
        Pact is the most widely used contract testing tool. The workflow has three
        participants:
      </p>

      <FlowChart
        title="Pact Consumer-Driven Contract Flow"
        chart={"graph TD\n  C[\"Consumer Test\\n(writes expectations)\"] -->|\"generates\"| PACT[\"Pact Contract File\\n(JSON)\"]\n  PACT -->|\"publishes\"| BROKER[\"Pact Broker\\n(central registry)\"]\n  BROKER -->|\"fetches\"| PV[\"Provider Verification Test\"]\n  PV -->|\"replays requests\\nagainst real provider\"| PROVIDER[\"Provider API\"]\n  PV -->|\"pass/fail result\"| BROKER"}
      />

      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Responsibility</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Consumer</td>
            <td>Writes a test describing the exact request/response it needs; Pact records this as a contract file</td>
          </tr>
          <tr>
            <td>Pact Broker</td>
            <td>Central registry that stores contracts and verification results, and tracks which versions are safe to deploy together</td>
          </tr>
          <tr>
            <td>Provider</td>
            <td>Replays every recorded request against its real implementation and confirms the actual response matches the contract</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="Consumer-Driven, Not Provider-Driven">
        The consumer defines the contract, not the provider. This keeps contracts
        anchored to what&apos;s actually used in production rather than a hypothetical
        &quot;complete&quot; API spec — a provider can change fields nobody consumes without
        breaking anything.
      </InfoBox>

      <h2>Java: Pact-JVM</h2>

      <CodeBlock language="java" title="Maven Dependency">
{`<dependency>
    <groupId>au.com.dius.pact.consumer</groupId>
    <artifactId>junit5</artifactId>
    <!-- 4.7.0 left beta in April 2026; this is the latest stable 4.7.x release. -->
    <version>4.7.5</version>
    <scope>test</scope>
</dependency>`}
      </CodeBlock>

      <CodeBlock language="java" title="Consumer Contract Test">
{`@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "order-service")
class OrderClientPactTest {

    @Pact(consumer = "billing-service")
    public RequestResponsePact getOrderPact(PactDslWithProvider builder) {
        return builder
            .given("order ORD-100 exists")
            .uponReceiving("a request for order ORD-100")
                .path("/api/orders/ORD-100")
                .method("GET")
            .willRespondWith()
                .status(200)
                .headers(Map.of("Content-Type", "application/json"))
                .body(new PactDslJsonBody()
                    .stringType("orderNumber", "ORD-100")
                    .stringType("status", "PAID")
                    .numberType("total", 59.99))
            .toPact();
    }

    @Test
    @PactTestFor(pactMethod = "getOrderPact")
    void clientParsesOrderResponse(MockServer mockServer) {
        OrderClient client = new OrderClient(mockServer.getUrl());

        Order order = client.getOrder("ORD-100");

        assertEquals("ORD-100", order.getOrderNumber());
        assertEquals("PAID", order.getStatus());
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Provider Verification Test">
{`// The provider test runs the REAL service, so it needs a real running
// server — @LocalServerPort is only populated by a @SpringBootTest that
// actually starts one (RANDOM_PORT), never by a slice test.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Provider("order-service")
@PactBroker(url = "https://pact-broker.internal.company.com")
class OrderServiceProviderVerificationTest {

    @LocalServerPort
    int port;

    @Autowired
    OrderRepository orderRepository;

    @BeforeEach
    void setUp(PactVerificationContext context) {
        context.setTarget(new HttpTestTarget("localhost", port));
    }

    @State("order ORD-100 exists")
    void orderExists() {
        orderRepository.save(new Order("ORD-100", "PAID", BigDecimal.valueOf(59.99)));
    }

    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void pactVerificationTestTemplate(PactVerificationContext context) {
        context.verifyInteraction();
    }
}`}
      </CodeBlock>

      <h2>Node.js: pact-js</h2>

      <CodeBlock language="bash" title="Install">
{`npm install --save-dev @pact-foundation/pact`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Consumer Contract Test">
{`import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { getOrder } from './orderClient';

const { like, string } = MatchersV3;

const provider = new PactV3({
  consumer: 'billing-service',
  provider: 'order-service',
});

describe('order client contract', () => {
  test('fetches an existing order', async () => {
    provider
      .given('order ORD-100 exists')
      .uponReceiving('a request for order ORD-100')
      .withRequest({ method: 'GET', path: '/api/orders/ORD-100' })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          orderNumber: string('ORD-100'),
          status: string('PAID'),
          total: like(59.99),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const order = await getOrder(mockServer.url, 'ORD-100');
      expect(order.orderNumber).toBe('ORD-100');
      expect(order.status).toBe('PAID');
    });
  });
});`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Provider Verification Test">
{`import { Verifier } from '@pact-foundation/pact';
import { startServer } from './server';

describe('order-service provider verification', () => {
  test('validates the expectations of billing-service', async () => {
    const server = await startServer({ port: 8080 });

    const opts = {
      provider: 'order-service',
      providerBaseUrl: 'http://localhost:8080',
      pactBrokerUrl: 'https://pact-broker.internal.company.com',
      publishVerificationResult: true,
      providerVersion: process.env.GIT_SHA,
      stateHandlers: {
        'order ORD-100 exists': async () => {
          await ordersTable.insert({
            orderNumber: 'ORD-100',
            status: 'PAID',
            total: 59.99,
          });
        },
      },
    };

    await new Verifier(opts).verifyProvider();
    await server.close();
  });
});`}
      </CodeBlock>

      <h2>Property-Based Testing</h2>
      <p>
        Example-based tests (everything you&apos;ve written so far) only verify the specific
        cases the author thought to write down. They&apos;re easy to write but blind to
        inputs nobody imagined — the empty list, the negative number, the string with
        embedded null bytes. <strong>Property-based testing</strong> flips the approach:
        instead of hand-picking examples, you describe a <em>property</em> that should
        hold for all valid inputs, and the framework generates hundreds of random
        inputs (including aggressive edge cases) to try to break it.
      </p>

      <InfoBox variant="tip" title="Properties, Not Examples">
        A good property is an invariant like &quot;encoding then decoding returns the
        original value&quot; or &quot;sorting a list twice gives the same result as sorting it
        once (idempotence)&quot; — something true for every valid input, not just the ones
        you happened to write a test for.
      </InfoBox>

      <h3>Java: jqwik</h3>

      <CodeBlock language="java" title="Maven Dependency">
{`<dependency>
    <groupId>net.jqwik</groupId>
    <artifactId>jqwik</artifactId>
    <version>1.9.0</version>
    <scope>test</scope>
</dependency>`}
      </CodeBlock>

      <CodeBlock language="java" title="Property: Reversing a List Twice Returns the Original">
{`class ListReverseProperties {

    @Property
    void reversingTwiceReturnsOriginal(@ForAll List<Integer> list) {
        List<Integer> reversedTwice = new ArrayList<>(list);
        Collections.reverse(reversedTwice);
        Collections.reverse(reversedTwice);

        assertEquals(list, reversedTwice);
    }

    @Property
    void reversedListHasSameSize(@ForAll List<String> list) {
        List<String> reversed = new ArrayList<>(list);
        Collections.reverse(reversed);

        assertEquals(list.size(), reversed.size());
    }

    // jqwik reports the smallest failing input it can find ("shrinking")
    // if a property fails, making the counterexample easy to debug.
}`}
      </CodeBlock>

      <h3>Node.js: fast-check</h3>

      <CodeBlock language="bash" title="Install">
{`npm install --save-dev fast-check`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Property: Reversing an Array Twice Returns the Original">
{`import fc from 'fast-check';

describe('array reverse properties', () => {
  test('reversing twice returns the original array', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const reversedTwice = [...arr].reverse().reverse();
        expect(reversedTwice).toEqual(arr);
      })
    );
  });

  test('reversed array has the same length', () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (arr) => {
        expect([...arr].reverse().length).toBe(arr.length);
      })
    );
  });
});

// fast-check runs 100 random cases by default and shrinks any failure
// down to the smallest array that reproduces it.`}
      </CodeBlock>

      <p>
        Both frameworks share the same mental model: generate (<code>@ForAll</code> /{' '}
        <code>fc.array()</code>), assert an invariant, and on failure automatically{' '}
        <strong>shrink</strong> the failing case to the smallest input that still
        reproduces the bug — far more useful for debugging than a single hand-picked
        failing example.
      </p>

      <h2>Choosing the Right Tool</h2>

      <InfoBox variant="note" title="Contract vs Property-Based vs Example-Based">
        <ul>
          <li>
            <strong>Example-based tests</strong> — your default. Fast to write, easy to
            read, good for documenting specific known behaviors and regression cases.
          </li>
          <li>
            <strong>Contract tests</strong> — reach for these at service boundaries in a
            microservices architecture, when you need confidence that two independently
            deployed services agree on an API shape, without paying for full E2E tests.
          </li>
          <li>
            <strong>Property-based tests</strong> — reach for these on pure functions
            with a clear invariant (serialization, math, parsing, sorting) where you
            suspect example-based tests are only covering the &quot;happy path&quot; inputs you
            thought of.
          </li>
        </ul>
      </InfoBox>

      <table>
        <thead>
          <tr>
            <th>Approach</th>
            <th>Catches</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Example-based</td>
            <td>Known specific scenarios</td>
            <td>Low</td>
          </tr>
          <tr>
            <td>Contract testing</td>
            <td>Cross-service API mismatches</td>
            <td>Medium — requires a broker and provider verification in CI</td>
          </tr>
          <tr>
            <td>Property-based</td>
            <td>Unanticipated edge cases in pure logic</td>
            <td>Medium — requires framing invariants, slower runs</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"A team wants confidence that their service's client library still matches the shape of a downstream API, without standing up the full system in CI. Which testing approach fits best?"}
        options={[
          "Property-based testing",
          "Consumer-driven contract testing",
          "Manual exploratory testing",
          "Increasing unit test coverage"
        ]}
        correctIndex={1}
        explanation="Consumer-driven contract testing (e.g. Pact) is designed exactly for this: the consumer records its expectations as a contract, and the provider verifies it independently in its own CI pipeline — no need to run both services together."
        language="java"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Consumer-driven contract testing catches API mismatches between services without full E2E tests</li>
        <li>Pact&apos;s model: consumer records a contract, a broker stores it, the provider verifies it independently</li>
        <li>Pact-JVM and pact-js follow the same consumer test / provider verification structure</li>
        <li>Property-based testing generates hundreds of random inputs to check an invariant always holds</li>
        <li>jqwik (<code>@Property</code>, <code>@ForAll</code>) and fast-check (<code>fc.assert</code>, <code>fc.property</code>) both shrink failures to a minimal reproducing case</li>
        <li>Use example-based tests by default, contract tests at service boundaries, and property-based tests for pure logic with clear invariants</li>
      </ul>
    </LessonLayout>
  );
}
