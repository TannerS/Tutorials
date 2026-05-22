import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TestingIntegration() {
  return (
    <LessonLayout
      title="Integration Testing"
      sectionId="testing"
      lessonIndex={3}
      prev={{ path: '/testing/mocking', label: 'Mocking' }}
      next={{ path: '/testing/e2e', label: 'End-to-End Testing' }}
    >
      <h2>Why Integration Tests?</h2>
      <p>
        Unit tests verify logic in isolation. Integration tests verify that the components work
        correctly <em>together</em> — your service with a real database, your controller with real
        HTTP serialization, or your repository with an actual SQL query. Integration tests catch
        problems that unit tests cannot: incorrect SQL, wrong JSON mapping, misconfigured
        security, or database constraint violations.
      </p>

      <FlowChart
        title="Integration Test Scope"
        chart={"graph LR\n  A[Controller test] --> B[HTTP serialization]\n  A --> C[Validation]\n  A --> D[Security]\n  E[Repository test] --> F[SQL queries]\n  E --> G[Schema constraints]\n  E --> H[Transactions]\n  I[Full stack test] --> J[All layers together]"}
      />

      <h2>Spring Boot Slice Tests</h2>

      <CodeBlock language="java" title="@WebMvcTest — Controller Layer Only">
{`// @WebMvcTest loads only the web layer: controllers, filters, security config.
// Services and repositories are replaced with @MockBean.
// Much faster than @SpringBootTest because 90% of the app is not loaded.

@WebMvcTest(ProductController.class)
@AutoConfigureMockMvc
class ProductControllerTest {

    @Autowired MockMvc mvc;
    @MockBean  ProductService productService;

    @Test
    void getProduct_returnsJsonWithCorrectFields() throws Exception {
        Product product = new Product(1L, "Widget", new BigDecimal("29.99"), "Electronics");
        when(productService.findById(1L)).thenReturn(Optional.of(product));

        mvc.perform(get("/api/products/1")
               .accept(MediaType.APPLICATION_JSON))
           .andExpect(status().isOk())
           .andExpect(content().contentType(MediaType.APPLICATION_JSON))
           .andExpect(jsonPath("$.id").value(1))
           .andExpect(jsonPath("$.name").value("Widget"))
           .andExpect(jsonPath("$.price").value(29.99))
           .andExpect(jsonPath("$.category").value("Electronics"));
    }

    @Test
    void getProduct_returns404_whenNotFound() throws Exception {
        when(productService.findById(999L)).thenReturn(Optional.empty());

        mvc.perform(get("/api/products/999"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.error").value("Product not found"));
    }

    @Test
    void createProduct_returns201_withLocationHeader() throws Exception {
        Product created = new Product(5L, "Gadget", new BigDecimal("49.99"), "Electronics");
        when(productService.create(any())).thenReturn(created);

        String requestBody = """
            { "name": "Gadget", "price": 49.99, "category": "Electronics" }
            """;

        mvc.perform(post("/api/products")
               .contentType(MediaType.APPLICATION_JSON)
               .content(requestBody))
           .andExpect(status().isCreated())
           .andExpect(header().string("Location", containsString("/api/products/5")));
    }

    @Test
    void createProduct_returns400_forInvalidInput() throws Exception {
        String invalidBody = """
            { "name": "", "price": -10.0 }
            """;

        mvc.perform(post("/api/products")
               .contentType(MediaType.APPLICATION_JSON)
               .content(invalidBody))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.errors[*].field",
               containsInAnyOrder("name", "price")));
    }

    // ── SECURITY TESTING ─────────────────────────────────────────────
    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteProduct_succeeds_forAdmin() throws Exception {
        mvc.perform(delete("/api/products/1"))
           .andExpect(status().isNoContent());
    }

    @Test
    void deleteProduct_returns403_forRegularUser() throws Exception {
        mvc.perform(delete("/api/products/1"))
           .andExpect(status().isForbidden());
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="@DataJpaTest — Repository Layer">
{`// @DataJpaTest loads only JPA components: entities, repositories, Hibernate.
// Auto-configures in-memory H2 database (or test-specific config).
// Each test runs in a transaction that rolls back automatically.

@DataJpaTest
class OrderRepositoryTest {

    @Autowired OrderRepository orderRepo;
    @Autowired CustomerRepository customerRepo;
    @Autowired TestEntityManager em;

    private Customer savedCustomer;

    @BeforeEach
    void setUp() {
        savedCustomer = customerRepo.save(new Customer("alice@example.com", "Alice"));
        em.flush();
    }

    @Test
    void findByCustomerId_returnsOnlyThatCustomersOrders() {
        // Arrange: two customers with orders
        Customer bob = customerRepo.save(new Customer("bob@example.com", "Bob"));
        orderRepo.save(new Order(savedCustomer, new BigDecimal("100.00")));
        orderRepo.save(new Order(savedCustomer, new BigDecimal("50.00")));
        orderRepo.save(new Order(bob, new BigDecimal("75.00")));
        em.flush();
        em.clear();  // clear persistence context — forces fresh DB reads

        // Act
        List<Order> aliceOrders = orderRepo.findByCustomerId(savedCustomer.getId());

        // Assert
        assertThat(aliceOrders).hasSize(2)
            .extracting(Order::getTotal)
            .containsExactlyInAnyOrder(
                new BigDecimal("100.00"),
                new BigDecimal("50.00")
            );
    }

    @Test
    void findTopOrdersByRevenue_returnsCorrectlyOrdered() {
        orderRepo.save(new Order(savedCustomer, new BigDecimal("300.00")));
        orderRepo.save(new Order(savedCustomer, new BigDecimal("100.00")));
        orderRepo.save(new Order(savedCustomer, new BigDecimal("200.00")));
        em.flush();
        em.clear();

        List<Order> top2 = orderRepo.findTopByRevenue(PageRequest.of(0, 2));

        assertThat(top2).hasSize(2)
            .extracting(o -> o.getTotal().intValue())
            .containsExactly(300, 200);  // descending order
    }

    @Test
    void save_enforces_positiveAmount_constraint() {
        Order invalid = new Order(savedCustomer, new BigDecimal("-10.00"));

        assertThatThrownBy(() -> {
            orderRepo.save(invalid);
            em.flush();  // flush triggers DB constraint check
        }).hasCauseInstanceOf(ConstraintViolationException.class);
    }
}`}
      </CodeBlock>

      <h2>Testcontainers — Real Database in Tests</h2>

      <CodeBlock language="java" title="Testcontainers — Docker-Based Integration Tests">
{`// Testcontainers starts real Docker containers for tests.
// Use when: H2 doesn't fully match production DB (PostgreSQL-specific features,
// JSON operators, generated columns, different NULL handling, etc.)

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class OrderServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired OrderService orderService;
    @Autowired OrderRepository orderRepo;
    @Autowired CustomerRepository customerRepo;

    @BeforeEach
    void cleanDatabase() {
        orderRepo.deleteAll();
        customerRepo.deleteAll();
    }

    @Test
    void placeOrder_persistsAndReturnsOrderWithId() {
        Customer customer = customerRepo.save(
            new Customer("alice@example.com", "Alice")
        );

        PlaceOrderRequest request = new PlaceOrderRequest(
            customer.getId(),
            List.of(new LineItem("PROD-1", 2, new BigDecimal("49.99")))
        );

        Order placed = orderService.placeOrder(request);

        assertThat(placed.getId()).isNotNull();
        assertThat(placed.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(placed.getTotal()).isEqualByComparingTo(new BigDecimal("99.98"));

        // Verify persistence — reload from DB
        Order fromDb = orderRepo.findById(placed.getId()).orElseThrow();
        assertThat(fromDb.getItems()).hasSize(1);
    }

    @Test
    @Transactional
    void concurrentOrderUpdates_handledCorrectly() throws InterruptedException {
        // Test optimistic locking / concurrent access
        Order order = orderRepo.save(new Order(customer, new BigDecimal("100.00")));

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(2);
        AtomicInteger successCount = new AtomicInteger(0);

        Runnable updateTask = () -> {
            try {
                orderService.updateStatus(order.getId(), OrderStatus.PROCESSING);
                successCount.incrementAndGet();
            } catch (OptimisticLockException e) {
                // Expected for one of the two concurrent updates
            } finally {
                latch.countDown();
            }
        };

        executor.submit(updateTask);
        executor.submit(updateTask);
        latch.await(5, TimeUnit.SECONDS);

        // Only one update should succeed
        assertThat(successCount.get()).isEqualTo(1);
    }
}`}
      </CodeBlock>

      <h2>Integration Testing with React — MSW</h2>

      <CodeBlock language="javascript" title="Mock Service Worker for API Integration">
{`// MSW (Mock Service Worker) intercepts HTTP requests at the network level.
// Tests run against real API calls — just the server is mocked.
// Much more realistic than mocking fetch/axios directly.

// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    const products = [
      { id: 1, name: 'Widget', price: 29.99, category: 'Electronics' },
      { id: 2, name: 'Gadget', price: 49.99, category: 'Electronics' },
      { id: 3, name: 'Book', price: 14.99, category: 'Books' },
    ].filter(p => !category || p.category === category);

    return HttpResponse.json(products);
  }),

  http.post('/api/orders', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 'ORDER-123', ...body, status: 'pending' },
      { status: 201 }
    );
  }),

  http.get('/api/products/:id', ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({ id: params.id, name: 'Widget', price: 29.99 });
  }),
];

// src/mocks/server.js (Node — for tests)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);

// vitest.setup.js — run before all tests
import { server } from './src/mocks/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());  // reset per-test overrides
afterAll(() => server.close());

// Integration test — component + real HTTP + MSW
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import ProductList from './ProductList';

describe('ProductList', () => {
  it('displays products from API', async () => {
    render(<ProductList />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Products appear after fetch
    await waitFor(() => {
      expect(screen.getByText('Widget')).toBeInTheDocument();
      expect(screen.getByText('Gadget')).toBeInTheDocument();
    });
  });

  it('shows error when API fails', async () => {
    // Override default handler for this test only
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 })
      )
    );

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load/i);
    });
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Slice Tests vs Full Context">
        <p>
          Use the most focused test that catches the bug. For controller input validation: use
          <code>@WebMvcTest</code>. For a custom JPQL query: use <code>@DataJpaTest</code>. For a
          multi-service workflow involving transactions: use <code>@SpringBootTest</code> with
          Testcontainers. Full context tests are slow (seconds each) while slice tests are fast
          (milliseconds). Keep full-context tests rare and focused on high-value integration points.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the advantage of @DataJpaTest over @SpringBootTest for testing repositories?"
        options={[
          "@DataJpaTest uses a faster JVM process per test",
          "@DataJpaTest loads only JPA-related beans, auto-configures an in-memory database, and rolls back each test in a transaction — much faster than full context",
          "@DataJpaTest supports more database types than @SpringBootTest",
          "@DataJpaTest automatically generates realistic test data from entity definitions"
        ]}
        correctIndex={1}
        explanation="@DataJpaTest is a slice test that loads only the JPA layer — repositories, entities, Hibernate, and related config. It does not load web controllers, services, or security filters. This makes it much faster than @SpringBootTest. It auto-configures an in-memory H2 database (by default) and wraps each test in a transaction that rolls back after the test completes, so tests are isolated without needing manual cleanup."
      />

      <InteractiveChallenge
        question="Why use Testcontainers (real Docker PostgreSQL) instead of H2 for integration tests?"
        options={[
          "H2 is too slow; Docker containers are faster",
          "H2 doesn't fully replicate PostgreSQL behavior — different SQL dialect, missing features like JSONB operators, different constraint handling",
          "Testcontainers generates better test data automatically",
          "H2 doesn't support JPA repositories, only raw SQL"
        ]}
        correctIndex={1}
        explanation="H2's in-memory mode is convenient but it's a different database than PostgreSQL. Problems H2 misses: PostgreSQL-specific JSON operators (@>, ?), generated columns, partial indexes, different NULL handling, full-text search syntax, and window functions. Tests using H2 may pass while the same queries fail in production. Testcontainers starts a real PostgreSQL in Docker — the test environment matches production perfectly."
      />
    </LessonLayout>
  );
}
