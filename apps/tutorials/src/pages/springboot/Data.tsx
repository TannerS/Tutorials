import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Data() {
  return (
    <LessonLayout
      title="Spring Data & JPA"
      sectionId="springboot"
      lessonIndex={4}
      prev={{ path: '/springboot/rest', label: 'Building REST APIs' }}
      next={{ path: '/springboot/security', label: 'Spring Security & Auth' }}
    >
      <h2>Spring Data JPA in One Sentence</h2>
      <p>
        Spring Data JPA is a repository abstraction on top of JPA (usually Hibernate) that
        gives you type-safe CRUD, derived queries from method names, and a paged / sorted
        query API — without writing implementations. Productive by default, treacherous
        at scale if you don't understand what it does behind the scenes.
      </p>

      <FlowChart
        title="Layers involved in one JPA query"
        chart={"graph TD\nA[Controller] --> B[Service]\nB --> C[Repository interface]\nC --> D[Spring proxy]\nD --> E[EntityManager]\nE --> F[Hibernate]\nF --> G[JDBC]\nG --> H[Database]\nF --> I[First-level cache]\nF --> J[Persistence context]"}
      />

      <h2>Defining Entities</h2>

      <CodeBlock language="java" title="A well-shaped JPA entity">
{`@Entity
@Table(name = "customer",
       indexes = @Index(name = "ix_customer_email", columnList = "email", unique = true))
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CustomerStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Version                        // optimistic locking
    private Long version;

    // JPA needs a no-arg constructor. Keep it protected so app code
    // uses the meaningful factory below.
    protected Customer() { }

    public static Customer create(String email, String displayName) {
        var c = new Customer();
        c.id = UUID.randomUUID();
        c.email = email;
        c.displayName = displayName;
        c.status = CustomerStatus.ACTIVE;
        c.createdAt = Instant.now();
        return c;
    }
    // getters (no public setters — use domain methods)
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Enum ordinal vs string — always string">
        <p>
          Default JPA maps enums to <code>ORDINAL</code> — a plain integer. Reorder or
          insert an enum value later and every row in the database silently means
          something different. Always use
          <code>@Enumerated(EnumType.STRING)</code>. Costs a few bytes; saves you a
          catastrophic bug.
        </p>
      </InfoBox>

      <h3>Records for entities? Not yet.</h3>
      <p>
        Records look like a natural fit but JPA needs a no-arg constructor and mutable state
        for lifecycle callbacks and lazy-loading proxies. Records forbid both. Use records
        for DTOs and projections, plain classes for entities.
      </p>

      <h3>equals() and hashCode() on entities</h3>
      <p>
        This is the entity mistake that produces the strangest bugs. A JPA entity&apos;s id is{' '}
        <code>null</code> until it is persisted, so an IDE-generated{' '}
        <code>equals</code>/<code>hashCode</code> over all fields — or over a null id — breaks the
        moment you put a transient entity in a <code>HashSet</code> and then save it: its hash
        changes, and the set can no longer find it.
      </p>

      <CodeBlock language="java" title="The entity equality contract">
{`@Entity
public class Customer {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        // Hibernate hands you a proxy subclass, so getClass() != o.getClass()
        // is WRONG. Compare the effective class instead.
        if (!(o instanceof Customer other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public final int hashCode() {
        // CONSTANT hash, deliberately. It must not change when the id is
        // assigned on persist. Collisions inside one persistence context
        // are irrelevant — you never hold thousands of entities in a Set.
        return getClass().hashCode();
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The simplest way out: assign ids in the application">
        <p>
          Notice the entity above uses <code>GenerationType.UUID</code> and the factory method
          sets <code>id</code> at construction. If the id is assigned <em>before</em> the entity is
          ever persisted, it is never null, and both <code>equals</code> and{' '}
          <code>hashCode</code> can simply delegate to it. Application-assigned UUIDs also let you
          batch inserts properly, which <code>GenerationType.IDENTITY</code> silently prevents —
          Hibernate must round-trip to the database for each row to learn the generated key. If
          you need sequential ids for index locality, use a UUIDv7 generator or a database
          sequence with an allocation size, not <code>IDENTITY</code>.
        </p>
      </InfoBox>

      <h2>The Persistence Context — What Actually Happens</h2>
      <p>
        Most confusing JPA behaviour comes from not having a mental model of the persistence
        context. It is a first-level cache scoped to the transaction that tracks every entity it
        has loaded, and at commit it compares each one against the snapshot it took at load time.
      </p>

      <FlowChart
        title="Entity lifecycle states"
        chart={"graph LR\nA[Transient/New] -->|persist| B[Managed]\nB -->|commit or flush| C[(Database)]\nB -->|detach / tx ends| D[Detached]\nD -->|merge| B\nB -->|remove| E[Removed]\nE -->|flush| C"}
      />

      <CodeBlock language="java" title="Dirty checking: the save() you don't need">
{`@Transactional
public void rename(UUID id, String newName) {
    Customer c = customers.findById(id).orElseThrow();
    c.rename(newName);
    // NO save() call. The entity is MANAGED — at commit, Hibernate compares
    // it to the load-time snapshot, sees the change, and issues the UPDATE.
    // This is "dirty checking", and it is why an accidental setter call
    // inside a transaction silently writes to the database.
}

// Corollary: the same mutation OUTSIDE a transaction does nothing at all.
public void renameBroken(UUID id, String newName) {
    Customer c = customers.findById(id).orElseThrow();  // tx opens and closes here
    c.rename(newName);                                  // entity is now DETACHED
}                                                       // change is silently lost

// save() on a DETACHED entity performs a merge: it loads the current row,
// copies your state onto the managed copy, and returns THAT copy.
// The instance you passed in stays detached.
Customer detached = /* from a previous transaction */;
Customer managed = customers.save(detached);
// managed != detached — mutate 'managed' from here on, not 'detached'.`}
      </CodeBlock>

      <InfoBox variant="warning" title="LazyInitializationException, explained">
        <p>
          Touching a lazy association after the transaction closed throws{' '}
          <code>LazyInitializationException</code> — the proxy needs a session to load from and
          there isn&apos;t one. The tempting fixes are the wrong ones:{' '}
          <code>FetchType.EAGER</code> pulls the association on <em>every</em> load of that entity
          everywhere in the app, and{' '}
          <code>spring.jpa.open-in-view</code> (which Boot enables by default, and logs a warning
          about) keeps the session open for the whole HTTP request, meaning your view layer can
          silently trigger database queries while holding a connection.
        </p>
        <p>
          The correct fix is to decide what you need <em>inside</em> the transaction: fetch it
          explicitly with an <code>@EntityGraph</code> or <code>join fetch</code>, or — better for
          read paths — map to a DTO before the transaction ends so nothing lazy ever escapes.
          Setting <code>spring.jpa.open-in-view: false</code> turns these mistakes into loud
          failures in development instead of quiet connection-holding in production.
        </p>
      </InfoBox>

      <h2>Repository Interfaces</h2>
      <p>
        You define an interface; Spring generates the implementation at startup. Method
        names are parsed into queries. Custom logic goes in <code>@Query</code>-annotated
        methods, native queries, or a hand-written implementation.
      </p>

      <CodeBlock language="java" title="A repository with the four common shapes">
{`public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    // 1. Derived query — method name is parsed into a query.
    Optional<Customer> findByEmailIgnoreCase(String email);

    // 2. Paged and sorted — take Pageable, return Page.
    Page<Customer> findByStatus(CustomerStatus status, Pageable pageable);

    // 3. JPQL — for anything beyond trivial derived queries.
    @Query("""
           select c from Customer c
           where c.status = :status
             and c.createdAt >= :since
           order by c.createdAt desc
           """)
    List<Customer> findRecentByStatus(
            @Param("status") CustomerStatus status,
            @Param("since") Instant since);

    // 4. Native — when you need database-specific SQL (PostgreSQL, window functions, ...)
    @Query(value = """
           select * from customer
           where email ilike concat('%', :fragment, '%')
           order by created_at desc
           limit :limit
           """, nativeQuery = true)
    List<Customer> searchByEmailFragment(@Param("fragment") String fragment,
                                         @Param("limit") int limit);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to stop using derived queries">
        <p>
          Derived queries are magical until they aren't. Once a method name goes past
          two conditions —
          <code>findByStatusAndCreatedAtGreaterThanEqualAndTypeIn(...)</code> — you're
          writing a query in the world's worst DSL. Switch to <code>@Query</code>.
          Rule of thumb: if the method name is longer than the JPQL would be, use
          JPQL.
        </p>
      </InfoBox>

      <h2>Pagination and Sorting</h2>
      <p>
        <code>Pageable</code> carries page number, size, and sort. Spring MVC auto-binds
        it from <code>?page=&size=&sort=</code>. Prefer
        <code>Page&lt;T&gt;</code> when total count is displayed; <code>Slice&lt;T&gt;</code>
        or <code>List&lt;T&gt;</code> when it isn't (skips the expensive count query).
      </p>
      <CodeBlock language="java" title="Page vs Slice vs List — pick the right one">
{`Page<Customer>  paged = customers.findByStatus(ACTIVE,
    PageRequest.of(0, 20, Sort.by("createdAt").descending()));
// Two queries: SELECT ... LIMIT 20  + SELECT count(*)

Slice<Customer> slice = customers.findFirst20ByStatusOrderByCreatedAtDesc(ACTIVE);
// One query: SELECT ... LIMIT 21 — 21st row means "has next"

List<Customer>  list  = customers.findTop20ByStatusOrderByCreatedAtDesc(ACTIVE);
// One query, no next/prev metadata`}
      </CodeBlock>

      <h2>Projections — Return Only What You Need</h2>
      <p>
        Fetching a full entity for a list view is wasteful. Use projections to select
        specific columns and get a lean DTO or interface.
      </p>

      <CodeBlock language="java" title="Interface, record, and open-projection projections">
{`// 1. Interface projection — Spring generates a proxy.
public interface CustomerSummary {
    UUID getId();
    String getEmail();
    String getDisplayName();
}

// 2. Record (DTO) projection with a constructor expression — cleanest.
public record CustomerSummaryDto(UUID id, String email, String displayName) { }

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    // Returns lean DTOs; SQL selects only 3 columns, not the whole row.
    @Query("""
           select new com.example.customer.CustomerSummaryDto(c.id, c.email, c.displayName)
           from Customer c
           where c.status = :status
           """)
    List<CustomerSummaryDto> summariesByStatus(@Param("status") CustomerStatus status);

    // Or derive the projection from the interface.
    List<CustomerSummary> findByStatus(CustomerStatus status);
}`}
      </CodeBlock>

      <h2>The N+1 Problem</h2>
      <p>
        The single most common performance disaster in JPA. A query that looks like it should
        run once actually runs N+1 times because JPA lazily loads each row's associations.
      </p>

      <CodeBlock language="java" title="The bug that shows up in every JPA codebase">
{`@Entity
public class Order {
    @Id UUID id;
    @ManyToOne(fetch = FetchType.LAZY) Customer customer;
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY) List<OrderItem> items;
}

// Innocent-looking service method:
List<Order> orders = orderRepository.findByStatus(OPEN); // 1 query
for (Order o : orders) {
    log.info("Order {} for {} with {} items",
        o.getId(),
        o.getCustomer().getDisplayName(),   // +N queries: one per order
        o.getItems().size());                // +N MORE queries: one per order
}
// 1000 orders in status=OPEN? 2001 queries just to log them.`}
      </CodeBlock>

      <CodeBlock language="java" title="Four ways to fix N+1">
{`// Fix 1: EntityGraph — declarative fetch plan. Preferred for a small number of joins.
public interface OrderRepository extends JpaRepository<Order, UUID> {

    @EntityGraph(attributePaths = { "customer", "items" })
    List<Order> findByStatus(OrderStatus status);
}

// Fix 2: JOIN FETCH in JPQL — explicit and inspectable.
@Query("""
       select distinct o from Order o
         join fetch o.customer
         left join fetch o.items
       where o.status = :status
       """)
List<Order> findWithDetailsByStatus(@Param("status") OrderStatus status);

// Fix 3: DTO projection — the fastest option and side-steps the whole entity graph.
// Best for read-only list views.

// Fix 4: batch fetching — Hibernate loads N associations with one IN(...) query.
// Configure per-property with @BatchSize(size = 50) or globally in application.yml:
//   spring.jpa.properties.hibernate.default_batch_fetch_size: 50`}
      </CodeBlock>

      <InfoBox variant="danger" title="Two traps inside the fixes themselves">
        <p>
          <strong>MultipleBagFetchException.</strong> You cannot{' '}
          <code>join fetch</code> two <code>List</code> associations in one query. Hibernate calls
          an unordered <code>List</code> a &quot;bag&quot;, and joining two of them produces a
          cartesian product it cannot un-multiply. Fix it by changing the collections to{' '}
          <code>Set</code>, or by fetching one collection per query and letting the persistence
          context stitch them together (two queries beats N+1, and beats a cartesian explosion).
        </p>
        <p>
          <strong>Pagination plus a collection join fetch.</strong> If you combine{' '}
          <code>Pageable</code> with a <code>join fetch</code> of a <code>@OneToMany</code>,
          Hibernate cannot apply <code>LIMIT</code> in SQL — a parent with 5 children occupies 5
          rows, so limiting rows would truncate the children. Older Hibernate versions logged{' '}
          <code>HHH000104: firstResult/maxResults specified with collection fetch; applying in
          memory</code> and then loaded the <em>entire</em> table into heap to paginate it.
          Hibernate 6 handles this better for some shapes, but the reliable pattern is a{' '}
          <strong>two-query approach</strong>: page the ids first, then fetch the full graph for
          just those ids with <code>where id in :ids</code>.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="Show me the SQL, always">
        <p>
          Turn on SQL logging in development. In <code>application.yml</code>:
        </p>
        <pre style={{ marginTop: '0.5rem' }}>
          {`spring:
  jpa:
    show-sql: true
    properties:
      hibernate.format_sql: true
      hibernate.generate_statistics: true`}
        </pre>
        <p>
          Now every JPA call prints its SQL. If a single service method logs eight
          queries when you expected one, you found an N+1.
        </p>
      </InfoBox>

      <h2>Transactions in JPA</h2>
      <p>
        A dedicated lesson covers <code>@Transactional</code> gotchas — this section
        just shows the shape most day-to-day code uses.
      </p>
      <CodeBlock language="java" title="Transactional boundaries at the service layer">
{`@Service
public class OrderService {

    private final OrderRepository orders;
    private final InventoryClient inventory;

    public OrderService(OrderRepository orders, InventoryClient inventory) {
        this.orders = orders;
        this.inventory = inventory;
    }

    // Read-only transactions get a cheaper JDBC setting and Hibernate flush=NEVER.
    // Always mark queries as readOnly when they are.
    @Transactional(readOnly = true)
    public Optional<Order> findById(UUID id) {
        return orders.findById(id);
    }

    // Write transactions default to REQUIRED — join existing, else start one.
    // Any exception (RuntimeException subclass) triggers rollback.
    @Transactional
    public Order place(NewOrderRequest req) {
        Order order = orders.save(Order.from(req));
        inventory.reserve(order.items());   // external side effect — see Transactions lesson
        return order;
    }
}`}
      </CodeBlock>

      <h2>Optimistic Locking</h2>
      <p>
        JPA's <code>@Version</code> field automatically detects concurrent updates. Two
        clients read the same row, both increment it — the second commit fails with
        <code>OptimisticLockException</code>, which Spring translates to
        <code>ObjectOptimisticLockingFailureException</code>. Retry or return a 409 to the
        client.
      </p>
      <CodeBlock language="java" title="Handling optimistic-lock failures">
{`@Retryable(retryFor = ObjectOptimisticLockingFailureException.class,
           maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2))
@Transactional
public Order applyDiscount(UUID id, BigDecimal pct) {
    var order = orders.findById(id).orElseThrow();
    order.applyDiscount(pct);
    return orders.save(order);
}`}
      </CodeBlock>

      <h2>Custom Repository Implementations</h2>
      <p>
        When the query doesn't fit derived-methods or <code>@Query</code>, you can add a
        hand-rolled implementation. Two interfaces + one implementation class; Spring stitches
        them together at startup.
      </p>
      <CodeBlock language="java" title="Custom impl for dynamic queries (JPA Criteria)">
{`public interface CustomerSearchRepository {
    Page<Customer> search(CustomerSearchCriteria c, Pageable pageable);
}

public interface CustomerRepository
        extends JpaRepository<Customer, UUID>, CustomerSearchRepository { }

@Repository
class CustomerSearchRepositoryImpl implements CustomerSearchRepository {

    private final EntityManager em;
    CustomerSearchRepositoryImpl(EntityManager em) { this.em = em; }

    public Page<Customer> search(CustomerSearchCriteria c, Pageable pageable) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Customer> q = cb.createQuery(Customer.class);
        Root<Customer> root = q.from(Customer.class);

        List<Predicate> where = new ArrayList<>();
        if (c.email() != null)
            where.add(cb.like(cb.lower(root.get("email")), c.email().toLowerCase() + "%"));
        if (c.status() != null)
            where.add(cb.equal(root.get("status"), c.status()));

        q.where(where.toArray(Predicate[]::new));
        // ... apply Pageable sort + pagination, then return a PageImpl.
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="jOOQ or QueryDSL for complex dynamic queries">
        <p>
          Criteria API is verbose. For heavy dynamic-query workloads, teams often reach
          for <strong>jOOQ</strong> (typed SQL, code-gen from schema) or
          <strong>QueryDSL</strong> (typed JPA queries). Both integrate with Spring Data
          repositories. Small services can stay on JPQL + Criteria; large ones benefit
          from a real query DSL.
        </p>
      </InfoBox>

      <h2>Batch Writes</h2>
      <p>
        Inserting 10,000 rows one <code>save()</code> at a time is 10,000 round-trips.
        Enable batching and flush in chunks.
      </p>
      <CodeBlock language="yaml" title="application.yml — Hibernate batch settings">
{`spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
          batch_versioned_data: true
        order_inserts: true
        order_updates: true`}
      </CodeBlock>
      <CodeBlock language="java" title="Batch pattern in code">
{`@Transactional
public void importAll(List<CustomerImport> rows) {
    int batch = 50;
    for (int i = 0; i < rows.size(); i++) {
        customers.save(Customer.create(rows.get(i).email(), rows.get(i).name()));
        if (i > 0 && i % batch == 0) {
            em.flush();
            em.clear(); // free the persistence context so it doesn't grow unbounded
        }
    }
}`}
      </CodeBlock>

      <h2>Auditing</h2>
      <p>
        Spring Data can auto-populate created/modified timestamps and user fields.
      </p>
      <CodeBlock language="java" title="Auditing setup">
{`@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditor")
class AuditingConfig {
    @Bean
    AuditorAware<String> auditor() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext())
            .map(SecurityContext::getAuthentication)
            .filter(Authentication::isAuthenticated)
            .map(Authentication::getName);
    }
}

@EntityListeners(AuditingEntityListener.class)
@MappedSuperclass
public abstract class Auditable {
    @CreatedDate    @Column(updatable = false) Instant createdAt;
    @LastModifiedDate                           Instant updatedAt;
    @CreatedBy      @Column(updatable = false) String  createdBy;
    @LastModifiedBy                             String  updatedBy;
}`}
      </CodeBlock>

      <h2>Schema Migrations — Never Let Hibernate Own the Schema</h2>
      <p>
        Hibernate&apos;s <code>ddl-auto</code> can create tables from your entities. It is a
        development convenience and a production hazard: it has no notion of data migration, no
        review history, and no rollback. Every serious Spring service versions its schema with{' '}
        <strong>Flyway</strong> or <strong>Liquibase</strong>, and Boot runs those migrations
        automatically at startup before the JPA <code>EntityManagerFactory</code> initialises.
      </p>

      <CodeBlock language="yaml" title="ddl-auto settings and what they mean">
{`spring:
  jpa:
    hibernate:
      ddl-auto: validate   # <- the correct production value
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true   # for adopting Flyway on an existing database

# ddl-auto values:
#   none        no schema management at all
#   validate    verify entities match the existing schema, fail fast if not.
#               THIS is what you want with Flyway: migrations own the schema,
#               and validate catches entity/schema drift at startup.
#   update      attempt to alter the schema to match entities. Never in
#               production: it never drops or renames, silently accumulates
#               dead columns, and behaves differently across Hibernate versions.
#   create      drop and recreate on startup
#   create-drop drop and recreate, then drop again on shutdown (test only)`}
      </CodeBlock>

      <CodeBlock language="sql" title="src/main/resources/db/migration/V3__add_customer_status.sql">
{`-- Flyway naming: V<version>__<description>.sql, applied in version order
-- and recorded in the flyway_schema_history table. Applied files are
-- checksummed: editing one after it has run is a startup failure, which is
-- the point — migrations are append-only.

ALTER TABLE customer
    ADD COLUMN status VARCHAR(20);

UPDATE customer SET status = 'ACTIVE' WHERE status IS NULL;

ALTER TABLE customer
    ALTER COLUMN status SET NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY ix_customer_email ON customer (LOWER(email));`}
      </CodeBlock>

      <InfoBox variant="tip" title="Expand / contract for zero-downtime deploys">
        <p>
          During a rolling deploy, the old and new versions of your application run against the
          same database at the same time. A migration that renames or drops a column breaks the
          instances that have not restarted yet. The safe pattern is two releases:{' '}
          <strong>expand</strong> (add the new nullable column, write to both, backfill), then{' '}
          <strong>contract</strong> (once every instance uses the new column, drop the old one).
          The same reasoning is why{' '}
          <code>NOT NULL</code> is added as a separate step after the backfill, and why Postgres
          index creation on a live table uses <code>CREATE INDEX CONCURRENTLY</code> — a plain{' '}
          <code>CREATE INDEX</code> takes a write lock for the duration.
        </p>
      </InfoBox>

      <h2>Testing Repositories</h2>
      <p>
        <code>@DataJpaTest</code> spins up only the JPA slice with an in-memory database
        (H2 by default) — fast and hermetic. For anything that must run on the real
        database engine, use TestContainers.
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
      <CodeBlock language="java" title="Real-database test with TestContainers">
{`@Testcontainers
@SpringBootTest
class CustomerRepositoryIT {

    @Container
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", pg::getJdbcUrl);
        r.add("spring.datasource.username", pg::getUsername);
        r.add("spring.datasource.password", pg::getPassword);
    }

    @Autowired CustomerRepository customers;
    // Tests run against a real Postgres — catches dialect-specific bugs.
}`}
      </CodeBlock>
      <InfoBox variant="tip" title="@ServiceConnection replaces the @DynamicPropertySource boilerplate">
        <p>
          Since Boot 3.1, annotating the container with <code>@ServiceConnection</code> wires the
          URL, username, and password automatically — Boot recognises the container type and
          derives the right properties. The <code>@DynamicPropertySource</code> block above is
          still worth understanding (you need it for containers Boot has no support for), but new
          tests should use the shorter form:
        </p>
        <CodeBlock language="java" title="The modern form">
{`@Testcontainers
@SpringBootTest
class CustomerRepositoryIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired CustomerRepository customers;
}

// Reuse one container across the whole suite by making it static and NOT
// using @Container (which ties the lifecycle to the class), starting it once
// in a static block. Otherwise every test class pays the startup cost.`}
        </CodeBlock>
      </InfoBox>

      <InfoBox variant="warning" title="H2 lies">
        <p>
          H2 is fast and convenient but not your production database. It ignores or
          differently interprets things like case-insensitive collations, array types,
          JSON columns, window functions, and CTE semantics. Anything more than the
          simplest tests should run on TestContainers with the real engine.
        </p>
      </InfoBox>

      <h2>JPA Anti-Patterns Cheat Sheet</h2>
      <InfoBox variant="danger" title="Habits that bite you at scale">
        <ul>
          <li><strong>Fetching entities for list views.</strong> Use projections.</li>
          <li><strong>Ignoring N+1.</strong> Always <em>look at the SQL</em> in dev.</li>
          <li><strong>Using <code>save()</code> in a loop without flush/clear.</strong>
              Persistence context grows unbounded, GC pressure explodes.</li>
          <li><strong>Long-open transactions doing I/O.</strong> Never make an HTTP call
              inside <code>@Transactional</code>; you're holding a DB connection for the
              length of that call.</li>
          <li><strong>Enum <code>ORDINAL</code> mapping.</strong> Always
              <code>STRING</code>.</li>
          <li><strong>Bidirectional relations "just in case."</strong> Bidirectional means
              you must maintain both sides in memory; usually one side is enough.</li>
          <li><strong>Assuming H2 behavior matches production.</strong> Test on the real
              engine for anything non-trivial.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="A list endpoint that returns 500 orders is running 1000+ queries. Each order has a customer and items relation lazily loaded. What's the fix that fetches everything in one query?"
        options={[
          "Change fetch = FetchType.EAGER on the associations",
          "Use @EntityGraph(attributePaths = { \"customer\", \"items\" }) on the repository method, or a JOIN FETCH in JPQL",
          "Add @Cacheable on the entity to cache the results",
          "Increase the JDBC connection pool size"
        ]}
        correctIndex={1}
        explanation="This is the N+1 problem. EAGER fetching is a footgun — it applies everywhere the entity is loaded, not just where you need it, and creates its own N+1 problems. @EntityGraph (declarative) or JOIN FETCH (explicit JPQL) load the associations in the same SQL statement as the parent, turning 1001 queries into 1. Caching would hide the symptom but not fix the underlying query; the pool size doesn't matter if you're doing 1000 queries in serial."
      />
    </LessonLayout>
  );
}
