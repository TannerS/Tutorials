import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringData() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java + Spring Boot 4 · Field Reference"
      title="Spring Data & JPA"
      tagline="Repositories, derived queries, the N+1 trap, and @Transactional boundaries — condensed for offline study."
      meta={['Spring Boot 4', '13 patterns']}
      footerLabel="Personal study reference — Spring Boot"
      pageLabel="Java + Spring Field Guide · Data & JPA"
      prev={{ path: '/java-field-guide/spring-rest', label: 'Spring REST & Validation' }}
      next={{ path: '/java-field-guide/spring-security', label: 'Spring Security' }}
    >
      <PosterCard
        glyph="En"
        title={<>JPA entity<span className="dim"> — the well-shaped version</span></>}
        language="java"
        code={`@Entity
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)   // NEVER the ORDINAL default —
    private CustomerStatus status; // reordering values corrupts data

    @Version                       // optimistic locking
    private Long version;

    protected Customer() { }       // JPA needs a no-arg ctor
}`}
        caption="Records can't be entities — JPA needs a no-arg constructor and mutable state for lazy-loading proxies. Use records for DTOs/projections, plain classes for entities."
      />

      <PosterCard
        glyph="Rp"
        title={<>JpaRepository<span className="dim"> + derived queries</span></>}
        language="java"
        code={`public interface CustomerRepository
        extends JpaRepository<Customer, UUID> {

    // Method name is parsed straight into a query.
    Optional<Customer> findByEmailIgnoreCase(String email);

    Page<Customer> findByStatus(CustomerStatus status, Pageable p);
}`}
        caption="JpaRepository gives type-safe CRUD, paging, and sorting for free. Derived query methods generate the implementation from the method name at startup — no SQL written."
      />

      <PosterCard
        glyph="Dq"
        title={<>Derived queries<span className="dim"> — know when to stop</span></>}
        language="java"
        code={`// Fine:
Optional<Customer> findByEmailIgnoreCase(String email);

// A DSL nightmare — switch to @Query instead:
List<Customer> findByStatusAndCreatedAtGreaterThanEqual
    AndTypeIn(CustomerStatus s, Instant since, List<Type> t);`}
        caption="Rule of thumb: once the method name is longer than the JPQL would be, write the JPQL — a chained derived-query name past two conditions is the world's worst DSL."
      />

      <PosterCard
        glyph="Jp"
        title={<>@Query<span className="dim"> — custom JPQL</span></>}
        language="java"
        code={`@Query("""
       select c from Customer c
       where c.status = :status
         and c.createdAt >= :since
       order by c.createdAt desc
       """)
List<Customer> findRecentByStatus(
        @Param("status") CustomerStatus status,
        @Param("since") Instant since);`}
        caption="For anything beyond a trivial derived query. Named parameters via @Param keep the JPQL readable and safe from injection, same as a prepared statement."
      />

      <PosterCard
        glyph="Pg"
        title={<>Page<span className="dim"> vs Slice vs List</span></>}
        language="java"
        code={`Page<Customer> p = repo.findByStatus(ACTIVE,
    PageRequest.of(0, 20, Sort.by("createdAt").descending()));
// 2 queries: SELECT ... LIMIT 20  +  SELECT count(*)

Slice<Customer> s = repo.findFirst20ByStatusOrderByCreatedAtDesc(ACTIVE);
// 1 query: LIMIT 21 — the 21st row means "has next"`}
        caption="Prefer Page<T> only when you actually display a total count — it costs a second query. Slice or a plain List skips the count entirely when you don't need it."
      />

      <PosterCard
        glyph="Pj"
        title={<>Projections<span className="dim"> — select only what you need</span></>}
        language="java"
        code={`public record CustomerSummaryDto(
        UUID id, String email, String displayName) { }

@Query("""
       select new com.example.CustomerSummaryDto(
           c.id, c.email, c.displayName)
       from Customer c where c.status = :status
       """)
List<CustomerSummaryDto> summariesByStatus(
        @Param("status") CustomerStatus status);`}
        caption="Fetching a full entity for a list view is wasteful. A record constructor-expression projection selects only the columns you need — leaner SQL, leaner objects."
      />

      <PosterCard
        glyph="!"
        badge="Gotcha"
        title={<>The N+1 problem<span className="dim"> — JPA's classic disaster</span></>}
        language="java"
        code={`@ManyToOne(fetch = FetchType.LAZY) Customer customer;
@OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
List<OrderItem> items;

List<Order> orders = repo.findByStatus(OPEN);  // 1 query
for (Order o : orders) {
    o.getCustomer().getDisplayName();  // +N queries
    o.getItems().size();               // +N MORE queries
}   // 1000 orders -> 2001 queries just to log them`}
        caption="The single most common JPA performance disaster. A query that looks like it runs once actually runs N+1 times because each row's lazy association triggers its own SELECT."
      />

      <PosterCard
        glyph="Fx"
        title={<>Fixing N+1<span className="dim"> — EntityGraph or JOIN FETCH</span></>}
        language="java"
        code={`// Declarative — preferred for a small number of joins.
@EntityGraph(attributePaths = { "customer", "items" })
List<Order> findByStatus(OrderStatus status);

// Explicit JPQL — inspectable, same effect.
@Query("""
       select distinct o from Order o
       join fetch o.customer left join fetch o.items
       where o.status = :status
       """)
List<Order> findWithDetailsByStatus(@Param("status") OrderStatus s);`}
        caption="Both load the associations in the same SQL statement as the parent, turning 1001 queries into 1. Avoid FetchType.EAGER — it applies everywhere the entity loads, creating its own N+1 problems."
      />

      <PosterCard
        glyph="Tx"
        title={<>@Transactional<span className="dim"> — the everyday shape</span></>}
        language="java"
        code={`@Service
public class OrderService {

    @Transactional(readOnly = true)   // cheaper JDBC setting,
    public Optional<Order> findById(UUID id) {  // Hibernate flush=NEVER
        return orders.findById(id);
    }

    @Transactional                     // REQUIRED by default —
    public Order place(NewOrderRequest req) {  // join tx or start one
        return orders.save(Order.from(req));
    }
}`}
        caption="Mark every read as readOnly = true — it skips dirty-checking overhead and some drivers route it to a read replica. Writes default to REQUIRED propagation."
      />

      <PosterCard
        glyph="Pp"
        title={<>Propagation<span className="dim"> — modes you'll actually use</span></>}
        language="text"
        code={`REQUIRED (default)   join existing tx, else start one — 99% of methods
REQUIRES_NEW         suspend current tx, always start a new one —
                      audit logs, "commit even if caller fails"
                      WARNING: a second DB connection, can deadlock
SUPPORTS              join if a tx exists, else run without one`}
        caption="REQUIRES_NEW takes a second connection from the pool while the first stays suspended — fine occasionally, a pool-exhaustion risk inside a tight loop."
      />

      <PosterCard
        glyph="Rb"
        title={<>Rollback rules<span className="dim"> — checked vs unchecked</span></>}
        language="java"
        code={`@Transactional
public void placeOrder(NewOrderRequest req) throws OrderException {
    orders.save(order);
    throw new OrderException("...");     // checked — COMMITS!
    throw new IllegalStateException(""); // RuntimeException — ROLLS BACK
}

// Fix: declare the checked type as a rollback trigger.
@Transactional(rollbackFor = OrderException.class)`}
        caption="Spring only rolls back on unchecked (RuntimeException) exceptions by default. A checked exception commits the transaction unless you explicitly add rollbackFor."
      />

      <PosterCard
        glyph="Io"
        badge="Gotcha"
        title={<>I/O inside a transaction<span className="dim"> — the cardinal sin</span></>}
        language="java"
        code={`// ANTI-PATTERN — holds a DB connection for the HTTP call.
@Transactional
public Order place(NewOrderRequest req) {
    Order order = orders.save(Order.from(req));
    inventory.reserve(order.items());   // HTTP call — pool exhaustion
    return order;
}
// FIX: do external I/O first/after; keep only DB ops inside
// a small @Transactional method.`}
        caption="A transaction holds a pooled DB connection for its full duration. An HTTP or Kafka call inside it means a slow downstream holds that connection — under load this exhausts the pool for everyone."
      />

      <PosterCard
        glyph="Vr"
        title={<>Optimistic locking<span className="dim"> — @Version</span></>}
        language="java"
        code={`@Version
private Long version;

// Two clients read the same row, both write — the second
// commit throws OptimisticLockException, Spring translates
// it to ObjectOptimisticLockingFailureException.
@Retryable(retryFor = ObjectOptimisticLockingFailureException.class,
           maxAttempts = 3)
@Transactional
public Order applyDiscount(UUID id, BigDecimal pct) { }`}
        caption="@Version auto-detects concurrent updates without taking a database lock. Retry the operation or surface a 409 Conflict to the client — don't reach for SERIALIZABLE isolation first."
      />

      <PosterQuickRef
        title="Which Spring Data tool do I need?"
        rows={[
          { need: 'Simple lookup by field', answer: 'Derived query method — findByX' },
          { need: 'Complex / multi-condition query', answer: '@Query with JPQL' },
          { need: 'List view, don’t need total count', answer: 'Slice<T> or List<T>, not Page<T>' },
          { need: 'Lean read-only column set', answer: 'A record projection via @Query' },
          { need: 'Service method logs N queries', answer: 'You have N+1 — check for lazy associations' },
          { need: 'Fix N+1', answer: '@EntityGraph or JOIN FETCH, never FetchType.EAGER' },
          { need: 'Enum column mapping', answer: '@Enumerated(EnumType.STRING), never ORDINAL' },
          { need: 'Read query', answer: '@Transactional(readOnly = true)' },
          { need: 'Must commit independently', answer: 'Propagation.REQUIRES_NEW — watch pool usage' },
          { need: 'Checked exception should roll back', answer: '@Transactional(rollbackFor = ...)' },
          { need: 'Concurrent write conflict', answer: '@Version + retry on ObjectOptimisticLockingFailureException' },
        ]}
      />
    </PosterLayout>
  );
}
