import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Integration() {
  return (
    <LessonLayout
      title="Integration Testing"
      sectionId="testing"
      lessonIndex={3}
      prev={{ path: '/testing/mocking', label: 'Mocking & Test Doubles' }}
      next={{ path: '/testing/e2e', label: 'End-to-End Testing' }}
    >
      <h2>What Is Integration Testing?</h2>
      <p>
        Integration tests verify that multiple components work together correctly.
        Unlike unit tests (which isolate a single class), integration tests exercise
        real interactions — a controller calling a service calling a repository,
        or a React component fetching data from an API.
      </p>

      <FlowChart
        title="Integration Test Scope"
        chart={"graph LR\n  UT[\"Unit Test\\nSingle class, mocked deps\"] --> IT[\"Integration Test\\nMultiple classes, real interactions\"]\n  IT --> E2E[\"E2E Test\\nFull stack, real browser\"]"}
      />

      <InfoBox variant="info" title="The Integration Testing Sweet Spot">
        Integration tests offer the best balance of confidence and speed. They catch
        wiring bugs (misconfigured beans, wrong query, incorrect API contract) that
        unit tests miss, while running much faster than E2E tests.
      </InfoBox>

      <h2>Spring Boot Integration Testing</h2>

      <h3>@SpringBootTest — Full Context</h3>
      <p>
        <code>@SpringBootTest</code> loads the entire Spring application context.
        Use it when you need all beans wired together.
      </p>

      <CodeBlock language="java" title="Full Integration Test">
{`@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepo;

    @BeforeEach
    void setUp() {
        userRepo.deleteAll();
    }

    @Test
    @DisplayName("POST /api/users — should create a new user")
    void createUser() throws Exception {
        String requestBody = """
            {
                "name": "Alice",
                "email": "alice@example.com"
            }
            """;

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Alice"))
            .andExpect(jsonPath("$.email").value("alice@example.com"))
            .andExpect(jsonPath("$.id").isNotEmpty());

        assertEquals(1, userRepo.count());
    }

    @Test
    @DisplayName("GET /api/users/:id — should return 404 for missing user")
    void getUserNotFound() throws Exception {
        mockMvc.perform(get("/api/users/999"))
            .andExpect(status().isNotFound());
    }
}`}
      </CodeBlock>

      <h3>@WebMvcTest — Controller Slice</h3>
      <p>
        <code>@WebMvcTest</code> loads only the web layer — controllers, filters,
        and converters. Service and repository beans must be mocked.
      </p>

      <CodeBlock language="java" title="Controller Slice Test">
{`@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("should return orders for a customer")
    void getOrdersByCustomer() throws Exception {
        List<Order> orders = List.of(
            new Order("ORD-1", "SHIPPED"),
            new Order("ORD-2", "PENDING")
        );
        when(orderService.findByCustomerId("CUST-1")).thenReturn(orders);

        mockMvc.perform(get("/api/orders")
                .param("customerId", "CUST-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id").value("ORD-1"))
            .andExpect(jsonPath("$[0].status").value("SHIPPED"));

        verify(orderService).findByCustomerId("CUST-1");
    }

    @Test
    @DisplayName("should return 400 for invalid request")
    void createOrderInvalidRequest() throws Exception {
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").isNotEmpty());
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="@WebMvcTest vs @SpringBootTest">
        Use <code>@WebMvcTest</code> when you only need to test the controller layer
        with mocked services. It&apos;s much faster because it doesn&apos;t load the full
        context. Use <code>@SpringBootTest</code> when you need the complete wiring.
      </InfoBox>

      <h3>@DataJpaTest — Repository Slice</h3>
      <CodeBlock language="java" title="Repository Integration Test">
{`@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("should find users by email domain")
    void findByEmailDomain() {
        entityManager.persist(new User("Alice", "alice@company.com"));
        entityManager.persist(new User("Bob", "bob@company.com"));
        entityManager.persist(new User("Charlie", "charlie@gmail.com"));
        entityManager.flush();

        List<User> companyUsers = userRepo.findByEmailEndingWith("@company.com");

        assertEquals(2, companyUsers.size());
    }
}`}
      </CodeBlock>

      <h3>Testcontainers — Real Database Testing</h3>
      <p>
        Testcontainers spins up real Docker containers (PostgreSQL, MySQL, Redis, etc.)
        for your tests. This eliminates the gap between your test database and production.
      </p>

      <CodeBlock language="java" title="Testcontainers with PostgreSQL">
{`@SpringBootTest
@Testcontainers
class ProductServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private ProductService productService;

    @Test
    @DisplayName("should persist and retrieve product from real PostgreSQL")
    void createAndFindProduct() {
        Product saved = productService.create(new Product("Widget", 9.99));

        assertNotNull(saved.getId());

        Optional<Product> found = productService.findById(saved.getId());

        assertTrue(found.isPresent());
        assertEquals("Widget", found.get().getName());
        assertEquals(9.99, found.get().getPrice(), 0.01);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Testcontainers Requires Docker">
        Testcontainers needs Docker running on the machine executing tests. Make sure
        your CI environment supports Docker-in-Docker or has Docker available.
        Tests with Testcontainers are slower than H2 but much more realistic.
      </InfoBox>

      <h2>JavaScript Integration Testing</h2>

      <h3>API Integration Tests with Supertest</h3>
      <CodeBlock language="javascript" title="Express API Integration Test">
{`const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('POST /api/users', () => {
  beforeEach(async () => {
    await db.query('DELETE FROM users');
  });

  afterAll(async () => {
    await db.end();
  });

  it('should create a user and return 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
    });
    expect(response.body.id).toBeDefined();
  });

  it('should return 400 for missing email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Alice' })
      .expect(400);

    expect(response.body.errors).toBeDefined();
  });
});`}
      </CodeBlock>

      <h3>React Integration Testing</h3>
      <p>
        React integration tests render multiple components together and verify
        they interact correctly — data flows, callbacks fire, and state updates
        propagate.
      </p>

      <CodeBlock language="jsx" title="Multi-Component Integration Test">
{`import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import App from './App';

const server = setupServer(
  http.get('/api/todos', () => {
    return HttpResponse.json([
      { id: 1, text: 'Buy groceries', completed: false },
      { id: 2, text: 'Clean house', completed: true },
    ]);
  }),
  http.post('/api/todos', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body, completed: false }, { status: 201 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Todo App Integration', () => {
  it('should load, display, and add todos', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    });
    expect(screen.getByText('Clean house')).toBeInTheDocument();

    // Add a new todo
    await user.type(screen.getByPlaceholderText(/add a todo/i), 'Walk the dog');
    await user.click(screen.getByRole('button', { name: /add/i }));

    // Verify the new todo appears
    await waitFor(() => {
      expect(screen.getByText('Walk the dog')).toBeInTheDocument();
    });
  });
});`}
      </CodeBlock>

      <h2>Test Database Strategies</h2>

      <FlowChart
        title="Test Database Approaches"
        chart={"graph TD\n  A[\"Test Database Strategy\"] --> B[\"In-Memory DB\\n(H2, SQLite)\\nFast but may differ from prod\"]\n  A --> C[\"Testcontainers\\nReal DB in Docker\\nRealistic but slower\"]\n  A --> D[\"Shared Test DB\\nDedicated instance\\nRisk of test pollution\"]\n  A --> E[\"Transaction Rollback\\nRollback after each test\\nFast, isolated\"]"}
      />

      <table>
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Speed</th>
            <th>Realism</th>
            <th>Isolation</th>
            <th>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>In-Memory (H2/SQLite)</td>
            <td>Fast</td>
            <td>Low</td>
            <td>High</td>
            <td>Simple queries, rapid dev</td>
          </tr>
          <tr>
            <td>Testcontainers</td>
            <td>Medium</td>
            <td>High</td>
            <td>High</td>
            <td>Complex queries, CI pipelines</td>
          </tr>
          <tr>
            <td>Transaction Rollback</td>
            <td>Fast</td>
            <td>High</td>
            <td>High</td>
            <td>JPA repository tests</td>
          </tr>
          <tr>
            <td>Shared Test DB</td>
            <td>Fast</td>
            <td>High</td>
            <td>Low</td>
            <td>Legacy projects (avoid if possible)</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="java" title="Transaction Rollback Strategy">
{`@DataJpaTest
@Transactional  // Each test runs in a transaction that is rolled back
class OrderRepositoryTest {

    @Autowired
    private OrderRepository orderRepo;

    @Test
    void testA() {
        orderRepo.save(new Order("A"));
        assertEquals(1, orderRepo.count());
        // Transaction rolls back here — no data persists
    }

    @Test
    void testB() {
        // Starts clean — testA's data was rolled back
        assertEquals(0, orderRepo.count());
        orderRepo.save(new Order("B"));
        assertEquals(1, orderRepo.count());
    }
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="JavaScript Test DB Setup">
{`// jest.setup.js — per-test cleanup
const db = require('./db');

beforeEach(async () => {
  // Truncate all tables before each test
  await db.query('BEGIN');
});

afterEach(async () => {
  await db.query('ROLLBACK');
});

afterAll(async () => {
  await db.end();
});`}
      </CodeBlock>

      <h2>MockMvc Patterns</h2>
      <CodeBlock language="java" title="MockMvc Request Patterns">
{`// GET with query parameters
mockMvc.perform(get("/api/users")
        .param("page", "0")
        .param("size", "10"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.content", hasSize(10)));

// PUT with auth header
mockMvc.perform(put("/api/users/{id}", userId)
        .contentType(MediaType.APPLICATION_JSON)
        .content(updatedUserJson)
        .header("Authorization", "Bearer " + token))
    .andExpect(status().isOk());`}
      </CodeBlock>

      <InteractiveChallenge
        question={"When should you use @WebMvcTest instead of @SpringBootTest?"}
        options={[
          "When you need to test the full application stack with real database",
          "When you only need to test the controller layer with mocked services",
          "When you want to test JavaScript code",
          "When you need to run E2E tests with a real browser"
        ]}
        correctIndex={1}
        explanation="@WebMvcTest loads only the web layer (controllers, filters, advice) and is much faster than @SpringBootTest. Services and repositories are provided as @MockBean. Use @SpringBootTest when you need the full context."
        language="java"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Integration tests verify multiple components working together</li>
        <li>Use <code>@WebMvcTest</code> for fast controller tests with mocked services</li>
        <li>Use <code>@SpringBootTest</code> when you need the full application context</li>
        <li>Testcontainers provides real databases in Docker for realistic testing</li>
        <li>Transaction rollback keeps tests isolated without manual cleanup</li>
        <li>MSW + React Testing Library create realistic frontend integration tests</li>
        <li>Supertest is the go-to tool for Node.js API integration testing</li>
      </ul>
    </LessonLayout>
  );
}
