import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Testcontainers() {
  return (
    <LessonLayout
      title="Testcontainers & Test Data"
      sectionId="testing"
      lessonIndex={5}
      prev={{ path: '/testing/integration', label: 'Integration Testing' }}
      next={{ path: '/testing/contract', label: 'Contract & Property-Based Testing' }}
    >
      <h2>The Problem With Mocking the Database</h2>
      <p>
        It&apos;s tempting to reach for an in-memory database (H2, SQLite) or a mocked
        repository when writing integration tests. It&apos;s fast and easy to set up. But
        it also lies to you: H2 doesn&apos;t enforce Postgres-specific constraints, doesn&apos;t
        support the same JSON operators, and silently accepts SQL that would fail in
        production. A test suite that&apos;s green against H2 can still ship a query that
        breaks against real Postgres.
      </p>

      <p>
        This gap between your test double and the real dependency is called{' '}
        <strong>behavior drift</strong> — the further your test environment diverges from
        production, the less confidence a passing test actually gives you.
      </p>

      <FlowChart
        title="Behavior Drift"
        chart={"graph LR\n  A[\"Mock/In-Memory DB\"] -->|\"looks similar\"| B[\"Tests Pass\"]\n  C[\"Real Postgres in Prod\"] -->|\"subtle differences\"| D[\"Bug Ships\"]\n  B -.->|\"false confidence\"| D"}
      />

      <h2>Testcontainers: Real Dependencies, Disposable Lifetime</h2>
      <p>
        Testcontainers is a library that spins up real dependencies — Postgres, MySQL,
        Kafka, Redis, even entire microservices — inside Docker containers, scoped to
        the lifetime of a test run. You get the real database engine, with a fresh
        instance per test class, and it&apos;s torn down automatically when the run finishes.
        No shared test database, no leftover state, no drift from production behavior.
      </p>

      <InfoBox variant="tip" title="Reserve Testcontainers for Integration-Level Tests">
        Spinning up a Docker container takes hundreds of milliseconds to a few seconds.
        That&apos;s fine for a handful of integration tests but far too slow if you scatter
        it across thousands of unit tests. Keep unit tests mocked and fast; use
        Testcontainers where you&apos;re already paying the integration-test cost and want
        real fidelity in exchange.
      </InfoBox>

      <h2>Java: JUnit 5/6 + Testcontainers</h2>
      <p>
        The <code>@Testcontainers</code> extension manages container lifecycle for you —
        unchanged whether the project is on JUnit Jupiter 5.x or the current 6.x line.
        <code>@Container</code> marks the field; a static field is shared across all
        tests in the class (started once), an instance field restarts per test.
      </p>

      <CodeBlock language="java" title="Maven Dependencies">
{`<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers-junit-jupiter</artifactId>
    <version>2.0.5</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers-postgresql</artifactId>
    <version>2.0.5</version>
    <scope>test</scope>
</dependency>`}
      </CodeBlock>

      <InfoBox variant="warning" title="Testcontainers 2.0 Renamed Every Module">
        <p>
          Testcontainers 2.0 (April 2026) prefixed every module artifact with{' '}
          <code>testcontainers-</code> — <code>org.testcontainers:postgresql</code> became{' '}
          <code>org.testcontainers:testcontainers-postgresql</code> — and moved each
          container class into its own package: <code>PostgreSQLContainer</code> now
          lives under <code>org.testcontainers.postgresql</code>, not{' '}
          <code>org.testcontainers.containers</code>. It also dropped the container
          classes&apos; self-referencing generic parameter, so construction is now{' '}
          <code>PostgreSQLContainer postgres = new PostgreSQLContainer(...)</code> — no{' '}
          <code>&lt;?&gt;</code>, no diamond. The old <code>org.testcontainers:postgresql</code>{' '}
          artifact still resolves on Maven Central for unmigrated projects, but it is
          capped at the 1.21.x line and gets no further releases.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Repository Integration Test With a Real Postgres">
{`import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers
@SpringBootTest
class OrderRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer postgres =
            new PostgreSQLContainer("postgres:16-alpine")
                    .withDatabaseName("orders_test")
                    .withUsername("test")
                    .withPassword("test");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private OrderRepository orderRepo;

    @Test
    @DisplayName("should persist and retrieve an order with real Postgres constraints")
    void savesAndFindsOrder() {
        Order order = new Order("ORD-100", "alice@test.com", BigDecimal.valueOf(59.99));

        Order saved = orderRepo.save(order);
        Optional<Order> found = orderRepo.findById(saved.getId());

        assertTrue(found.isPresent());
        assertEquals("ORD-100", found.get().getOrderNumber());
    }

    @Test
    @DisplayName("should reject duplicate order numbers via unique constraint")
    void enforcesUniqueOrderNumber() {
        orderRepo.save(new Order("ORD-200", "bob@test.com", BigDecimal.TEN));

        assertThrows(DataIntegrityViolationException.class, () ->
            orderRepo.saveAndFlush(new Order("ORD-200", "carol@test.com", BigDecimal.ONE))
        );
    }
}`}
      </CodeBlock>

      <p>
        The Postgres container starts once for the class, Spring&apos;s datasource
        properties are wired to point at it dynamically (the mapped port changes every
        run), and the unique constraint test above would silently pass against H2 with
        the wrong constraint syntax — but fails correctly here because it&apos;s real Postgres.
      </p>

      <h2>Node.js: the testcontainers Package</h2>
      <p>
        The same idea is available in Node via the <code>testcontainers</code> npm
        package. You start a container, read back its mapped host/port, connect your
        client to it, and stop it when you&apos;re done.
      </p>

      <CodeBlock language="bash" title="Install">
{`# 'testcontainers' is the core package (GenericContainer, networks, wait strategies).
# Each pre-built module ships separately under the @testcontainers scope.
npm install --save-dev testcontainers @testcontainers/postgresql pg`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Postgres Integration Test (Node)">
{`import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';

describe('order repository (Postgres via Testcontainers)', () => {
  let container;
  let client;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('orders_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    client = new Client({ connectionString: container.getConnectionUri() });
    await client.connect();

    await client.query(\`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        customer_email TEXT NOT NULL,
        total NUMERIC(10,2) NOT NULL
      )
    \`);
  }, 60_000);

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  test('persists and retrieves an order', async () => {
    await client.query(
      'INSERT INTO orders (order_number, customer_email, total) VALUES ($1, $2, $3)',
      ['ORD-100', 'alice@test.com', 59.99]
    );

    const { rows } = await client.query(
      'SELECT * FROM orders WHERE order_number = $1',
      ['ORD-100']
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].customer_email).toBe('alice@test.com');
  });

  test('rejects duplicate order numbers via unique constraint', async () => {
    await client.query(
      'INSERT INTO orders (order_number, customer_email, total) VALUES ($1, $2, $3)',
      ['ORD-200', 'bob@test.com', 10]
    );

    await expect(
      client.query(
        'INSERT INTO orders (order_number, customer_email, total) VALUES ($1, $2, $3)',
        ['ORD-200', 'carol@test.com', 1]
      )
    ).rejects.toThrow(/unique/i);
  });
});`}
      </CodeBlock>

      <p>
        For dependencies without a dedicated module, the generic{' '}
        <code>GenericContainer</code> API works for anything with a Docker image —
        Redis, RabbitMQ, LocalStack, or your own service image:
      </p>

      <CodeBlock language="javascript" title="GenericContainer for Redis">
{`import { GenericContainer } from 'testcontainers';
import { createClient } from 'redis';

let container;
let redisClient;

beforeAll(async () => {
  container = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  const port = container.getMappedPort(6379);
  const host = container.getHost();

  redisClient = createClient({ url: \`redis://\${host}:\${port}\` });
  await redisClient.connect();
});

afterAll(async () => {
  await redisClient.quit();
  await container.stop();
});

test('caches a value with a TTL', async () => {
  await redisClient.set('session:1', 'active', { EX: 60 });
  const value = await redisClient.get('session:1');
  expect(value).toBe('active');
});`}
      </CodeBlock>

      <h2>Test Data Builders / Object Mother</h2>
      <p>
        As integration tests grow, inline object literals with a dozen fields become
        unreadable and every test breaks when you add a required field. Two patterns
        fix this: <strong>Test Data Builders</strong> (a fluent builder with sensible
        defaults that you override only the fields relevant to the test) and{' '}
        <strong>Object Mother</strong> (named factory methods for common fixture
        &quot;archetypes&quot;, like <code>anAdminUser()</code> or{' '}
        <code>aPendingOrder()</code>).
      </p>

      <CodeBlock language="java" title="Java Test Data Builder">
{`public class OrderTestDataBuilder {
    private String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8);
    private String customerEmail = "test@example.com";
    private BigDecimal total = BigDecimal.valueOf(19.99);
    private OrderStatus status = OrderStatus.PENDING;

    public static OrderTestDataBuilder anOrder() {
        return new OrderTestDataBuilder();
    }

    public OrderTestDataBuilder withCustomerEmail(String email) {
        this.customerEmail = email;
        return this;
    }

    public OrderTestDataBuilder withTotal(BigDecimal total) {
        this.total = total;
        return this;
    }

    public OrderTestDataBuilder withStatus(OrderStatus status) {
        this.status = status;
        return this;
    }

    public Order build() {
        return new Order(orderNumber, customerEmail, total, status);
    }
}

// Usage — only the relevant field stands out
@Test
void cancelledOrdersAreExcludedFromRevenue() {
    Order cancelled = OrderTestDataBuilder.anOrder()
            .withStatus(OrderStatus.CANCELLED)
            .withTotal(BigDecimal.valueOf(500))
            .build();

    orderRepo.save(cancelled);

    BigDecimal revenue = revenueService.calculateTotalRevenue();
    assertEquals(BigDecimal.ZERO, revenue);
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Node.js Factory Function Equivalent">
{`import { faker } from '@faker-js/faker';

function buildOrder(overrides = {}) {
  return {
    orderNumber: \`ORD-\${faker.string.alphanumeric(8).toUpperCase()}\`,
    customerEmail: faker.internet.email(),
    total: faker.commerce.price({ min: 5, max: 500 }),
    status: 'PENDING',
    ...overrides,
  };
}

// "Object Mother"-style named fixtures built on top of the base factory
const orderMother = {
  pending: (overrides) => buildOrder({ status: 'PENDING', ...overrides }),
  cancelled: (overrides) => buildOrder({ status: 'CANCELLED', ...overrides }),
  highValue: (overrides) => buildOrder({ total: '999.99', ...overrides }),
};

test('cancelled orders are excluded from revenue', async () => {
  const cancelled = orderMother.cancelled({ total: '500.00' });
  await ordersTable.insert(cancelled);

  const revenue = await calculateTotalRevenue();
  expect(revenue).toBe(0);
});`}
      </CodeBlock>

      <InfoBox variant="info" title="Faker.js / datafaker for Realistic Data">
        Hardcoded fixture values like <code>&quot;test@example.com&quot;</code> repeated across
        hundreds of tests can mask bugs that only appear with varied data (unicode
        names, long strings, edge-case formats). Java&apos;s <code>datafaker</code> and
        JavaScript&apos;s <code>@faker-js/faker</code> generate realistic random values —
        names, emails, addresses, dates — so builders produce varied, production-like
        data by default while still letting you pin down exactly the fields your
        assertion cares about.
      </InfoBox>

      <h2>CI Considerations</h2>

      <InfoBox variant="warning" title="Docker-in-Docker and the Docker Socket">
        Testcontainers needs a Docker daemon to talk to. Most CI runners (GitHub
        Actions, GitLab CI, CircleCI) provide Docker out of the box on their standard
        Linux runners, but some sandboxed or Kubernetes-based CI environments don&apos;t
        expose the Docker socket by default. You&apos;ll need either the host&apos;s Docker
        socket mounted into the CI job (Docker-outside-of-Docker) or a
        Docker-in-Docker sidecar. Check for a &quot;Docker support&quot; setting in your CI
        provider before assuming Testcontainers will just work — it&apos;s one of the most
        common first-run failures.
      </InfoBox>

      <table>
        <thead>
          <tr>
            <th>Approach</th>
            <th>Speed</th>
            <th>Fidelity</th>
            <th>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mocked repository</td>
            <td>Fastest</td>
            <td>Low — no real SQL, no real constraints</td>
            <td>Unit tests of business logic</td>
          </tr>
          <tr>
            <td>In-memory DB (H2)</td>
            <td>Fast</td>
            <td>Medium — SQL dialect differences</td>
            <td>Quick smoke tests, legacy suites</td>
          </tr>
          <tr>
            <td>Testcontainers</td>
            <td>Slower (container startup)</td>
            <td>High — the real engine, real version</td>
            <td>Integration tests that must be trustworthy</td>
          </tr>
        </tbody>
      </table>

      <h2>Key Takeaways</h2>
      <ul>
        <li>Mocking or faking a database risks behavior drift from production</li>
        <li>Testcontainers spins up real, disposable Docker containers for the test&apos;s lifetime</li>
        <li>Java: <code>@Testcontainers</code>, <code>@Container</code>, and <code>@DynamicPropertySource</code> wire a real Postgres into Spring Boot</li>
        <li>Node.js: the <code>testcontainers</code> package offers typed containers (<code>PostgreSqlContainer</code>) and a generic <code>GenericContainer</code> for any image</li>
        <li>Test Data Builders and Object Mother keep fixtures readable as tests grow</li>
        <li>Faker.js / datafaker generate realistic random data instead of repetitive hardcoded values</li>
        <li>Reserve Testcontainers for integration tests — it&apos;s too slow for the unit test layer</li>
        <li>Verify Docker socket availability before relying on Testcontainers in CI</li>
      </ul>
    </LessonLayout>
  );
}
