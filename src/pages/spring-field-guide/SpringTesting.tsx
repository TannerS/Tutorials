import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringTesting() {
  return (
    <PosterLayout
      accent="emerald"
      eyebrow="Spring Boot 4 · Field Reference"
      title="Spring Testing"
      tagline="Unit tests, slice tests, and TestContainers — which level to reach for and the annotation that gets you there."
      meta={['JUnit 5', '12 patterns']}
      footerLabel="Personal study reference — Spring Boot"
      pageLabel="Spring Field Guide · Testing"
      prev={{ path: '/spring-field-guide/aop-events', label: 'AOP & Async Events' }}
      next={{ path: '/spring-field-guide/kafka-observability', label: 'Kafka & Observability' }}
    >
      <PosterCard
        glyph="U"
        title={<>Plain unit test<span className="dim"> — no Spring</span></>}
        language="java"
        code={`class OrderServiceTest {
    OrderRepository orders = mock(OrderRepository.class);
    PaymentGateway  payments = mock(PaymentGateway.class);
    OrderService    svc = new OrderService(orders, payments);

    @Test
    void placesOrderAndCharges() {
        when(orders.save(any())).thenAnswer(inv -> inv.getArgument(0));
        Order placed = svc.place(new PlaceOrderRequest(/*...*/));
        verify(payments).charge(placed.total(), any());
    }
}`}
        caption="Constructor injection means you can 'new' the service directly with mocks — no Spring context, runs in milliseconds. Should be 80-90% of your suite."
      />

      <PosterCard
        glyph="Wm"
        title={<>@WebMvcTest<span className="dim"> — controller slice</span></>}
        language="java"
        code={`@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean OrderService orders;

    @Test
    void createReturns201WithLocation() throws Exception {
        when(orders.place(any())).thenReturn(placedDto());
        mvc.perform(post("/api/orders")
                .contentType(APPLICATION_JSON)
                .content(json.writeValueAsBytes(validRequest())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("PLACED"));
    }
}`}
        caption="Loads only the web layer — controllers, filters, converters, exception handlers. Services and repositories are absent; provide them with @MockitoBean."
      />

      <PosterCard
        glyph="Dj"
        title={<>@DataJpaTest<span className="dim"> — repository slice</span></>}
        language="java"
        code={`@DataJpaTest
class CustomerRepositoryTest {
    @Autowired CustomerRepository customers;
    @Autowired TestEntityManager em;

    @Test
    void findByEmailIsCaseInsensitive() {
        em.persistAndFlush(
            Customer.create("Alice@Example.com", "Alice"));

        assertThat(customers.findByEmailIgnoreCase("alice@example.com"))
            .isPresent();
    }
}`}
        caption="Autoconfigures an in-memory H2 database and rolls back each test in a transaction. Fast, but H2 differs from real engines — see the gotcha below."
      />

      <PosterCard
        glyph="!"
        title={<>H2 lies<span className="dim"> about production</span></>}
        language="text"
        code={`H2 differs from real databases in:
- case-insensitive collations
- array / JSON columns
- window functions
- CTE materialization semantics

A @DataJpaTest can PASS on H2 and FAIL in prod.
Use TestContainers for anything beyond trivial CRUD.`}
        caption="H2 is a fast but lying test double. If your query relies on any Postgres-specific feature, the slice test gives false confidence — verify on the real engine."
      />

      <PosterCard
        glyph="Tc"
        title={<>@Testcontainers<span className="dim"> — real Postgres</span></>}
        language="java"
        code={`@Testcontainers
@SpringBootTest
class OrderFlowIT {

    @Container
    static PostgreSQLContainer<?> pg =
        new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", pg::getJdbcUrl);
        r.add("spring.datasource.username", pg::getUsername);
        r.add("spring.datasource.password", pg::getPassword);
    }
}`}
        caption="Spins up a real Docker Postgres for the test class. Slower than H2 by a couple of seconds but honest — catches dialect-specific bugs H2 hides."
      />

      <PosterCard
        glyph="Re"
        title={<>TestContainers reuse<span className="dim"> for local dev</span></>}
        language="text"
        code={`# ~/.testcontainers.properties
testcontainers.reuse.enable=true

# per-container
new PostgreSQLContainer<>("postgres:17-alpine")
    .withReuse(true);`}
        caption="Without reuse, every test run pays the container-startup tax again. With it, containers persist across runs and subsequent runs start in seconds."
      />

      <PosterCard
        glyph="Sb"
        title={<>@SpringBootTest<span className="dim"> — full context</span></>}
        language="java"
        code={`@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApplicationSmokeTest {
    @Autowired TestRestTemplate rest;

    @Test
    void healthEndpointIsUp() {
        var response = rest.getForEntity("/actuator/health", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}`}
        caption="Boots the entire application context — slow (5-15s per class). Use sparingly, one smoke test per service proving 'the wiring works and health returns UP'."
      />

      <PosterCard
        glyph="Mb"
        title={<>@MockitoBean<span className="dim"> vs @MockBean</span></>}
        language="java"
        code={`// @MockBean: deprecated in Boot 3.4, REMOVED in Boot 4.
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService orders;   // replaces the bean in the context
}

// Plain Mockito mock() — no Spring context involvement at all
OrderRepository repo = mock(OrderRepository.class);`}
        caption="@MockitoBean (Spring Framework 6.2+) replaces a bean inside the ApplicationContext for slice/integration tests; @MockBean was deprecated in Boot 3.4 and removed in Boot 4, so on Boot 4 the migration is mandatory, not optional. Plain mock() is for unit tests with no context."
      />

      <PosterCard
        glyph="Js"
        title={<>@JsonTest<span className="dim"> — serialization slice</span></>}
        language="java"
        code={`@JsonTest
class OrderDtoJsonTest {
    @Autowired JacksonTester<OrderDto> json;

    @Test
    void serializesTotalAsBigDecimalString() throws Exception {
        var dto = new OrderDto(id, PLACED, new BigDecimal("42.10"));
        JsonContent<OrderDto> written = json.write(dto);
        assertThat(written).hasJsonPathValue("$.total", "42.10");
    }
}`}
        caption="Cheap and often skipped — verifies your DTOs round-trip through Jackson correctly, catching serialization regressions before they hit a client."
      />

      <PosterCard
        glyph="Wi"
        title={<>WireMock<span className="dim"> vs MockRestServiceServer</span></>}
        language="java"
        code={`// @AutoConfigureWireMock needs spring-cloud-contract-wiremock
// (it is NOT part of core Spring Boot test).
@SpringBootTest
@AutoConfigureWireMock(port = 0)
class CatalogClientTest {
    @Test
    void returnsProductWhenFound() {
        WireMock.stubFor(get(urlEqualTo("/products/PROD-1"))
            .willReturn(aResponse().withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("{\\"id\\":\\"PROD-1\\",\\"name\\":\\"Chair\\"}")));

        ProductDto p = client.get("PROD-1");
        assertThat(p.name()).isEqualTo("Chair");
    }
}`}
        caption="WireMock runs a real HTTP server on a random port — best for testing wire format, and the only option that also exercises your HTTP client's own config (timeouts, interceptors, deserialization). MockRestServiceServer is in-process and stubs at the RestTemplate/RestClient layer, so it never proves the real bytes parse."
      />

      <PosterCard
        glyph="Bd"
        title={<>Test data builders<span className="dim"></span></>}
        language="java"
        code={`public class OrderTestData {
    public static OrderBuilder anOrder() { return new OrderBuilder(); }

    public static class OrderBuilder {
        OrderStatus status = PLACED;
        BigDecimal total = new BigDecimal("42.00");
        public OrderBuilder status(OrderStatus s) { this.status = s; return this; }
        public Order build() { return new Order(id, status, total); }
    }
}
// anOrder().status(PLACED).total(new BigDecimal("100")).build();`}
        caption="Ad-hoc constructor calls with six positional args become unreadable fast. A fluent builder keeps only the fields that matter to the test visible."
      />

      <PosterCard
        glyph="Pt"
        title={<>@ParameterizedTest<span className="dim"></span></>}
        language="java"
        code={`@ParameterizedTest
@CsvSource({
    "hunter2hunter2, true",
    "short,          false",
})
void strongPasswordChecksLengthAndClasses(
        String candidate, boolean expected) {
    assertThat(validator.isStrong(candidate)).isEqualTo(expected);
}

@ParameterizedTest
@EnumSource(OrderStatus.class)
void anyStatusRendersToJson(OrderStatus status) { /* ... */ }`}
        caption="Collapses many near-identical @Test methods into one, driven by @CsvSource, @EnumSource, @MethodSource, or @ValueSource — one failure per row, not one giant test."
      />

      <PosterQuickRef
        title="Which test level do I need?"
        rows={[
          { need: 'Pure logic / service method', answer: 'Plain JUnit + Mockito' },
          { need: 'HTTP controller behavior', answer: '@WebMvcTest + MockMvc' },
          { need: 'Repository query correctness', answer: '@DataJpaTest (H2) or TestContainers (real DB)' },
          { need: 'DTO serialization', answer: '@JsonTest + JacksonTester' },
          { need: 'External HTTP dependency', answer: 'WireMock or MockRestServiceServer' },
          { need: 'Full startup + wiring smoke test', answer: '@SpringBootTest (sparingly)' },
          { need: 'Replace a bean in the context', answer: '@MockitoBean, not deprecated @MockBean' },
          { need: 'Many similar test cases', answer: '@ParameterizedTest + @CsvSource/@EnumSource' },
        ]}
      />
    </PosterLayout>
  );
}
