import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Testing() {
  return (
    <LessonLayout
      title="Testing in Spring Boot"
      sectionId="springboot"
      lessonIndex={6}
      prev={{ path: '/springboot/security', label: 'Spring Security & Auth' }}
      next={{ path: '/springboot/config', label: 'Configuration & Profiles' }}
    >
      <h2>The Testing Pyramid, Applied</h2>
      <p>
        A well-tested Spring Boot service has three tiers:
      </p>
      <ol>
        <li>
          <strong>Plain unit tests</strong> — no Spring, no context. Instantiate the class
          with mocked collaborators. Should be 80–90% of your suite by count. Runs in
          seconds.
        </li>
        <li>
          <strong>Slice tests</strong> — load only the layer under test
          (<code>@WebMvcTest</code>, <code>@DataJpaTest</code>, <code>@JsonTest</code>).
          Fast enough to run on every save.
        </li>
        <li>
          <strong>Integration tests</strong> — full <code>@SpringBootTest</code> with real
          collaborators (via TestContainers). Slow; use sparingly for smoke and true
          end-to-end coverage.
        </li>
      </ol>

      <FlowChart
        title="Test level for a given piece of code"
        chart={"graph TD\nA[What do I need to test?] --> B{Pure logic, service method?}\nB -->|Yes| C[Plain JUnit + Mockito]\nA --> D{HTTP controller behavior?}\nD -->|Yes| E[@WebMvcTest + MockMvc]\nA --> F{Repository query correctness?}\nF -->|Yes| G[@DataJpaTest + TestContainers]\nA --> H{Full startup + wiring works?}\nH -->|Yes| I[@SpringBootTest smoke test]"}
      />

      <h2>Level 1 — Plain Unit Tests</h2>
      <p>
        The fastest and most valuable tests. If your services take dependencies through the
        constructor (they should — see the DI lesson), no Spring context is needed at all.
      </p>
      <CodeBlock language="java" title="Service unit test with Mockito">
{`class OrderServiceTest {

    OrderRepository orders     = mock(OrderRepository.class);
    PaymentGateway  payments   = mock(PaymentGateway.class);
    Notifications   notifs     = mock(Notifications.class);
    OrderService    svc        = new OrderService(orders, payments, notifs);

    @Test
    void placesOrderAndCharges() {
        var req = new PlaceOrderRequest(/*...*/);
        when(orders.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Order placed = svc.place(req);

        assertThat(placed.status()).isEqualTo(OrderStatus.PLACED);
        verify(payments).charge(placed.total(), req.card());
        verify(notifs).orderPlaced(placed);
    }

    @Test
    void refusesWhenInventoryUnavailable() {
        doThrow(new OutOfStockException("SKU-1"))
            .when(payments).charge(any(), any());
        // ...
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer real objects over mocks when the collaborator is trivial">
        <p>
          Mocking a two-line email formatter is theater. Use the real one. Mock at
          architectural boundaries: HTTP clients, message publishers, repositories,
          the clock, randomness — anything that is slow, non-deterministic, or side-effecting.
        </p>
      </InfoBox>

      <h2>Level 2a — Web Slice (@WebMvcTest)</h2>
      <p>
        Loads only the web layer: controllers, filters, converters, exception handlers.
        Auto-configures <code>MockMvc</code>. Services and repositories are absent —
        provide them as <code>@MockitoBean</code>.
      </p>
      <CodeBlock language="java" title="Controller slice test">
{`@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean OrderService orders;

    @Test
    void createReturns201WithLocation() throws Exception {
        var placed = new OrderDto(UUID.randomUUID(), OrderStatus.PLACED, /*...*/);
        when(orders.place(any())).thenReturn(placed);

        mvc.perform(post("/api/orders")
                .contentType(APPLICATION_JSON)
                .content(json.writeValueAsBytes(validRequest())))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", endsWith("/" + placed.id())))
            .andExpect(jsonPath("$.status").value("PLACED"));
    }

    @Test
    void invalidBodyReturns400WithProblemDetail() throws Exception {
        mvc.perform(post("/api/orders")
                .contentType(APPLICATION_JSON)
                .content("""
                    {"items":[]}"""))
            .andExpect(status().isBadRequest())
            .andExpect(content().contentType(APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}`}
      </CodeBlock>

      <h2>Level 2b — JPA Slice (@DataJpaTest)</h2>
      <p>
        Loads only <code>DataSource</code> + JPA + your repositories. Autoconfigures an
        in-memory DB (H2) and rolls back each test in a transaction.
      </p>
      <CodeBlock language="java" title="Repository slice test">
{`@DataJpaTest
class CustomerRepositoryTest {

    @Autowired CustomerRepository customers;
    @Autowired TestEntityManager em;

    @Test
    void findByEmailIsCaseInsensitive() {
        em.persistAndFlush(Customer.create("Alice@Example.com", "Alice"));

        assertThat(customers.findByEmailIgnoreCase("alice@example.com")).isPresent();
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="H2 is a lying test double for your database">
        <p>
          H2 differs from real databases in subtle ways: case-insensitive collations,
          array/JSON columns, window functions, CTE semantics. If your query relies on
          any of these — and enterprise queries do — the slice test will pass and prod
          will fail. Use TestContainers for anything beyond trivial CRUD.
        </p>
      </InfoBox>

      <h2>Level 3 — Real Dependencies with TestContainers</h2>
      <p>
        TestContainers spins up Docker containers on demand for your tests. Real Postgres,
        real Kafka, real Redis, real S3 (LocalStack). Slower than H2 by a couple of seconds
        but honest.
      </p>
      <CodeBlock language="java" title="Postgres + Kafka integration test">
{`@Testcontainers
@SpringBootTest
class OrderFlowIT {

    @Container
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    static ConfluentKafkaContainer kafka =
        new ConfluentKafkaContainer("confluentinc/cp-kafka:7.7.0");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",         pg::getJdbcUrl);
        r.add("spring.datasource.username",    pg::getUsername);
        r.add("spring.datasource.password",    pg::getPassword);
        r.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired OrderService svc;

    @Test
    void placingOrderPublishesEventAndPersistsRow() {
        Order placed = svc.place(validRequest());

        // Query the real DB directly to prove the row is there.
        assertThat(jdbc.queryForObject("SELECT status FROM \\"order\\" WHERE id = ?",
            String.class, placed.id())).isEqualTo("PLACED");

        // Consume the event from real Kafka.
        var records = KafkaTestUtils.getRecords(consumer, Duration.ofSeconds(3));
        assertThat(records).anySatisfy(r ->
            assertThat(r.value()).contains(placed.id().toString()));
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="TestContainers reuse — make it fast enough for local dev">
        <p>
          Add <code>~/.testcontainers.properties</code> with
          <code>testcontainers.reuse.enable=true</code> and mark containers with
          <code>.withReuse(true)</code>. Containers persist across test runs — subsequent
          runs start in seconds instead of tens of seconds.
        </p>
      </InfoBox>

      <h2>@SpringBootTest — Full Context</h2>
      <p>
        Boots the entire application context. Slow (5–15 seconds per class) but useful
        for one class per service that proves "the wiring works and the happy path holds".
      </p>
      <CodeBlock language="java" title="Smoke test that catches wiring bugs">
{`@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApplicationSmokeTest {

    @Autowired TestRestTemplate rest;
    @LocalServerPort int port;

    @Test
    void healthEndpointIsUp() {
        var response = rest.getForEntity("/actuator/health", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("\\"status\\":\\"UP\\"");
    }

    @Test
    void publicEndpointRespondsWithoutAuth() {
        var response = rest.getForEntity("/api/public/status", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}`}
      </CodeBlock>

      <h2>Serialization Slice (@JsonTest)</h2>
      <p>
        Cheap and useful. Verifies your DTOs round-trip correctly.
      </p>
      <CodeBlock language="java" title="@JsonTest for a DTO">
{`@JsonTest
class OrderDtoJsonTest {

    @Autowired JacksonTester<OrderDto> json;

    @Test
    void serializesTotalAsBigDecimalString() throws Exception {
        var dto = new OrderDto(UUID.fromString("..."), OrderStatus.PLACED,
            new BigDecimal("42.10"));

        JsonContent<OrderDto> written = json.write(dto);
        assertThat(written).hasJsonPathValue("$.total", "42.10");
    }
}`}
      </CodeBlock>

      <h2>Mocking External HTTP Calls</h2>
      <p>
        Two established options.
      </p>
      <ul>
        <li>
          <strong>WireMock</strong> — an actual HTTP server on a random port. Best when
          you want to test the wire format (headers, status codes, TLS).
        </li>
        <li>
          <strong>MockRestServiceServer</strong> — for tests of code that uses
          <code>RestTemplate</code> or <code>RestClient</code>. In-process, no HTTP.
        </li>
      </ul>
      <CodeBlock language="java" title="WireMock stubbing an external API">
{`@SpringBootTest
@AutoConfigureWireMock(port = 0)
class CatalogClientTest {

    @Autowired CatalogClient client;
    @Value("\${wiremock.server.port}") int port;

    @Test
    void returnsProductWhenFound() {
        WireMock.stubFor(get(urlEqualTo("/products/PROD-1"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    { "id": "PROD-1", "name": "Chair", "price": "199.00" }""")));

        ProductDto p = client.get("PROD-1");
        assertThat(p.name()).isEqualTo("Chair");
    }

    @Test
    void translates404ToDomainNotFound() {
        WireMock.stubFor(get(urlEqualTo("/products/UNKNOWN"))
            .willReturn(aResponse().withStatus(404)));

        assertThatThrownBy(() -> client.get("UNKNOWN"))
            .isInstanceOf(ProductNotFoundException.class);
    }
}`}
      </CodeBlock>

      <h2>Test Fixtures and Builders</h2>
      <p>
        As tests grow, ad-hoc object construction becomes duplicative and brittle. Use
        builders or factory methods to keep intent clear.
      </p>
      <CodeBlock language="java" title="Test data builders">
{`public class OrderTestData {
    public static OrderBuilder anOrder() { return new OrderBuilder(); }

    public static class OrderBuilder {
        UUID id             = UUID.randomUUID();
        OrderStatus status  = OrderStatus.PLACED;
        BigDecimal total    = new BigDecimal("42.00");
        String customer     = "customer-1";

        public OrderBuilder status(OrderStatus s)  { this.status = s;  return this; }
        public OrderBuilder total(BigDecimal t)    { this.total = t;   return this; }
        public OrderBuilder customer(String c)     { this.customer = c; return this; }
        public Order build() { return new Order(id, status, total, customer); }
    }
}

// Reads much better than a raw constructor with six positional args.
Order placed = anOrder().status(PLACED).total(new BigDecimal("100")).build();`}
      </CodeBlock>

      <h2>Parameterized Tests</h2>
      <CodeBlock language="java" title="JUnit 5 parameterized tests">
{`@ParameterizedTest
@CsvSource({
    "hunter2hunter2, true",
    "short,          false",
    "no-upper-nums,  false",
    "'',             false"
})
void strongPasswordChecksLengthAndClasses(String candidate, boolean expected) {
    assertThat(validator.isStrong(candidate)).isEqualTo(expected);
}

@ParameterizedTest
@EnumSource(OrderStatus.class)
void anyStatusRendersToJson(OrderStatus status) throws Exception {
    var written = json.write(new OrderDto(UUID.randomUUID(), status, ZERO));
    assertThat(written).hasJsonPathValue("$.status", status.name());
}`}
      </CodeBlock>

      <h2>The Test Coverage Discussion</h2>
      <InfoBox variant="note" title="Chase behaviors, not line coverage">
        <p>
          A 100%-line-coverage codebase can still be riddled with untested behaviors,
          and a 60%-line-coverage codebase can be solid if the 40% is trivial getters and
          config. Prefer tests that <em>describe behavior</em> ("returns 404 when the
          customer does not exist", "publishes the event after commit"). Line coverage is
          a smell detector for missing tests, not a goal.
        </p>
      </InfoBox>

      <h2>Testing Checklist</h2>
      <InfoBox variant="success" title="A well-tested service has">
        <ul>
          <li>Plain unit tests for every service; no Spring context.</li>
          <li>Slice tests (<code>@WebMvcTest</code>, <code>@DataJpaTest</code>) for the web
              and persistence layers.</li>
          <li>Repository tests that run against the real database via TestContainers, not H2.</li>
          <li>At least one <code>@SpringBootTest</code> smoke test proving the context loads
              and health returns UP.</li>
          <li>External HTTP dependencies stubbed with WireMock in integration tests.</li>
          <li>Test data built via builders / factory methods, not inline constructor calls.</li>
          <li>Every exception type has a matching slice test asserting the response shape.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Your JPA repository test passes on H2 in CI but the same query fails in production against Postgres. What's the fix?"
        options={[
          "Add more @DataJpaTest coverage to hit edge cases",
          "Use TestContainers to run tests against a real Postgres — H2 differs from Postgres in JSON columns, arrays, case-insensitive collation, and CTE semantics, so tests that pass on H2 can silently fail on the real engine",
          "Set spring.jpa.database=POSTGRESQL so H2 emulates Postgres",
          "Add @ActiveProfiles(\"test\") to the test class"
        ]}
        correctIndex={1}
        explanation="H2 is fast and convenient but a lying test double. It ignores or differently interprets features that real databases handle — array columns, JSON operators, ILIKE, CTE materialization behavior, window function edge cases. spring.jpa.database=POSTGRESQL only sets the SQL dialect for Hibernate; H2's engine still runs H2 SQL. Only running your tests against the same engine you deploy on gives real confidence."
      />
    </LessonLayout>
  );
}
