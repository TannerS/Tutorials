import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Transactions() {
  return (
    <LessonLayout
      title="Transactions Deep-Dive"
      sectionId="springboot"
      lessonIndex={10}
      prev={{ path: '/springboot/advanced', label: 'Advanced Topics' }}
      next={{ path: '/springboot/kafka', label: 'Kafka in Spring' }}
    >
      <h2>Why This Lesson Exists</h2>
      <p>
        <code>@Transactional</code> is deceptively simple. Add the annotation, methods
        become atomic. But it's a proxy-based mechanism with subtle rules about
        propagation, rollback, isolation, and self-invocation. Almost every service that
        deals with money, orders, or reservations has a production incident caused by
        transactional misunderstanding. This lesson exists to inoculate you against them.
      </p>

      <h2>The Mental Model</h2>
      <p>
        Spring's <code>@Transactional</code> wraps the annotated method in a call to a
        <code>PlatformTransactionManager</code>. On entry it opens (or joins) a transaction;
        on normal return it commits; on unchecked exception it rolls back. The wrapping is
        implemented via a proxy — usually a CGLIB subclass or a JDK dynamic proxy.
      </p>

      <FlowChart
        title="Transactional method invocation"
        chart={"graph TD\nA[Caller] --> B[Proxy]\nB --> C{Existing transaction?}\nC -->|No, propagation=REQUIRED| D[Begin new transaction]\nC -->|Yes| E[Join existing transaction]\nD --> F[Invoke target method]\nE --> F\nF --> G{Method threw runtime exception?}\nG -->|Yes| H[Rollback / Mark for rollback]\nG -->|No| I[Commit]"}
      />

      <h2>The Self-Invocation Trap (Again)</h2>
      <p>
        The single most misunderstood behavior in Spring:
      </p>
      <InfoBox variant="danger" title="If you take away one thing from this lesson">
        <p>
          <code>@Transactional</code> lives on a <em>proxy</em>. Calling
          <code>this.doWork()</code> from inside the bean bypasses the proxy. The
          annotation on <code>doWork()</code> is silently ignored.
        </p>
      </InfoBox>
      <CodeBlock language="java" title="The bug">
{`@Service
public class ReportService {

    @Transactional                       // opens tx as intended
    public void generateBatch(List<Request> reqs) {
        for (var r : reqs) {
            this.generateOne(r);         // BYPASSES proxy — REQUIRES_NEW ignored
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateOne(Request r) { /* ... */ }
}`}
      </CodeBlock>
      <p>Fixes: extract the inner method into a separate bean, inject yourself with
      <code>@Lazy</code>, or use <code>TransactionTemplate</code> programmatically.</p>

      <h2>Propagation — What Happens When You're Already in a Transaction</h2>
      <p>
        Every <code>@Transactional</code> method decides how to handle an <em>existing</em>
        transaction. The propagation setting is the answer.
      </p>
      <CodeBlock language="text" title="The propagation modes you actually use">
{`REQUIRED (default)
  If there's a tx, join it. If not, start one.
  99% of your @Transactional methods should use this.

REQUIRES_NEW
  Suspend the current tx (if any) and always start a new one.
  Use for audit logs, retries, "commit this outcome even if the caller fails".
  WARNING: uses a second DB connection — can deadlock with parent.

SUPPORTS
  Join if a tx exists; run without one otherwise.
  Rarely needed. Mostly a code smell.

NOT_SUPPORTED
  Suspend the current tx and run outside any tx.
  For read-only operations that must NOT be inside a tx (e.g. long reports).

MANDATORY
  Throw if not in a transaction.
  Useful on internal methods that must only be called from within a tx.

NEVER
  Throw if in a transaction.
  Rare — for code that must not be inside a tx (dangerous otherwise).

NESTED
  Uses a JDBC savepoint. Rollback rolls back to the savepoint,
  not the whole outer tx. JDBC only, not JPA (usually).`}
      </CodeBlock>

      <InfoBox variant="warning" title="REQUIRES_NEW takes a second connection">
        <p>
          Suspending a transaction to open a new one means both are open at the same time.
          That's two connections from the pool. In a tight loop, you exhaust the pool.
          Prefer moving the "must commit independently" work out of the loop.
        </p>
      </InfoBox>

      <h2>Isolation Levels</h2>
      <CodeBlock language="text" title="Isolation, roughly ordered by strictness">
{`READ_UNCOMMITTED   Sees dirty writes. Never use.
READ_COMMITTED     Sees only committed data. Default on Postgres and Oracle.
REPEATABLE_READ    Same read = same result within the tx. Default on MySQL InnoDB.
SERIALIZABLE       Fully sequential; the strictest. Most contention. Rarely used.

Practical rule: leave isolation at the database default unless you have a specific
concurrency problem. Higher isolation is not free — it trades throughput for safety.
Optimistic locking (@Version) is usually a better answer than SERIALIZABLE.`}
      </CodeBlock>

      <h2>Rollback Rules</h2>
      <p>
        By default, Spring rolls back on <code>RuntimeException</code> subclasses only.
        Checked exceptions <strong>commit</strong> the transaction unless you say
        otherwise.
      </p>
      <CodeBlock language="java" title="What rolls back by default">
{`@Transactional
public void placeOrder(NewOrderRequest req) throws OrderException {
    orders.save(order);                 // committed if...
    if (someCondition) {
        throw new OrderException(...);  // ...OrderException is checked — WILL COMMIT
    }
    if (otherCondition) {
        throw new IllegalStateException(...);  // RuntimeException — WILL ROLL BACK
    }
}

// Fix: declare the checked exception as a rollback trigger.
@Transactional(rollbackFor = OrderException.class)
public void placeOrder(NewOrderRequest req) throws OrderException { /* ... */ }

// Or invert: some runtime exceptions you specifically don't want to roll back.
@Transactional(noRollbackFor = { OptimisticLockingFailureException.class })
public void tryUpdate() { /* ... */ }`}
      </CodeBlock>

      <InfoBox variant="tip" title="Domain exceptions extending RuntimeException are correct">
        <p>
          If your <code>DomainException</code> hierarchy extends
          <code>RuntimeException</code> (which it should), rollback works naturally. Don't
          bother tuning <code>rollbackFor</code> unless you're stuck with a legacy checked
          exception you can't change.
        </p>
      </InfoBox>

      <h2>Read-Only Transactions</h2>
      <p>
        Mark queries with <code>readOnly = true</code>. Two benefits:
      </p>
      <ul>
        <li>Hibernate sets flush-mode to <code>NEVER</code> — no dirty-checking overhead
            for entities you just read.</li>
        <li>Some drivers route the query to a read replica automatically.</li>
      </ul>
      <CodeBlock language="java" title="Read-only queries">
{`@Transactional(readOnly = true)
public Optional<Customer> findById(UUID id) {
    return customers.findById(id);
}`}
      </CodeBlock>

      <h2>The Cardinal Sin: I/O Inside a Transaction</h2>
      <p>
        A transaction holds a database connection from the pool. If you make an HTTP call
        (or Kafka publish, or SFTP upload) inside <code>@Transactional</code>, that
        connection is <em>held</em> for the length of the remote call. A slow downstream
        that takes 5 seconds means every DB connection is stuck for 5 seconds.
      </p>
      <CodeBlock language="java" title="The anti-pattern and its fix">
{`// ANTI-PATTERN
@Transactional
public Order place(NewOrderRequest req) {
    Order order = orders.save(Order.from(req));
    inventory.reserve(order.items());        // HTTP call — pool exhaustion
    payments.charge(order.total(), req.card());  // more HTTP — worse
    return order;
}

// FIX: shrink the transaction. Only the DB operations live inside it.
public Order place(NewOrderRequest req) {
    // Do external work first, or after.
    inventory.reserve(req.items());
    var confirmation = payments.charge(req.total(), req.card());

    return orderService.saveOrder(req, confirmation);   // small @Transactional
}

@Service
class OrderPersistence {
    @Transactional
    public Order saveOrder(NewOrderRequest req, PaymentConfirmation conf) {
        return orders.save(Order.from(req, conf));
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="This scales into the transactional-outbox pattern">
        <p>
          When you need to atomically persist an order AND publish a Kafka event,
          you can't do both inside the same DB transaction (they're different systems).
          Solution: persist a "pending event" row in the same transaction, then a separate
          worker reads pending rows and publishes them. This is the
          <strong>transactional outbox</strong>. The Kafka lesson covers it.
        </p>
      </InfoBox>

      <h2>Programmatic Transactions — TransactionTemplate</h2>
      <p>
        Sometimes you need finer control than annotations offer: transactional boundaries
        that don't align with method boundaries, or transactions in code that can't be
        annotated (a lambda, an event handler).
      </p>
      <CodeBlock language="java" title="TransactionTemplate for programmatic control">
{`@Service
public class ImportService {

    private final TransactionTemplate txTemplate;
    public ImportService(PlatformTransactionManager txManager) {
        this.txTemplate = new TransactionTemplate(txManager);
    }

    public void importInBatches(Iterable<Row> rows) {
        List<Row> buffer = new ArrayList<>();
        for (Row row : rows) {
            buffer.add(row);
            if (buffer.size() >= 500) {
                flushBatch(buffer);
                buffer.clear();
            }
        }
        if (!buffer.isEmpty()) flushBatch(buffer);
    }

    private void flushBatch(List<Row> batch) {
        txTemplate.executeWithoutResult(status -> {
            rowRepository.saveAll(batch);
        });
    }
}`}
      </CodeBlock>

      <h2>@TransactionalEventListener — Events That Fire After Commit</h2>
      <p>
        Covered briefly in <em>Advanced Topics</em>; worth reinforcing here. If you want a
        listener to run only after the transaction successfully commits (so a rollback
        doesn't leave you with half-executed side effects), use
        <code>@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)</code>.
      </p>
      <CodeBlock language="java" title="Bulletproof event handling">
{`@Component
public class OutboxRelay {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onOrderPlaced(OrderPlacedEvent event) {
        // Only runs if the order was persisted. Kafka publish here is safe.
    }
}`}
      </CodeBlock>

      <h2>Testing Transactional Behavior</h2>
      <p>
        <code>@SpringBootTest</code> with <code>@Transactional</code> on the test class
        rolls back after each test — useful for keeping the DB clean, but sometimes it
        <em>hides</em> transactional bugs because everything gets rolled back anyway.
      </p>
      <CodeBlock language="java" title="A test that specifically exercises rollback">
{`@SpringBootTest
class OrderServiceTx {

    @Autowired OrderService svc;
    @Autowired OrderRepository orders;

    @Test
    void rollsBackOnDownstreamFailure() {
        UUID id = UUID.randomUUID();
        assertThatThrownBy(() -> svc.placeAndCharge(failingRequest(id)))
            .isInstanceOf(PaymentDeclinedException.class);

        // Order should NOT be persisted — the rollback undid the save.
        assertThat(orders.findById(id)).isEmpty();
    }
}`}
      </CodeBlock>

      <h2>Diagnostic — Watch Your Transactions in Dev</h2>
      <CodeBlock language="yaml" title="Log transaction boundaries and connection usage">
{`logging:
  level:
    org.springframework.transaction.interceptor: TRACE
    org.springframework.orm.jpa: DEBUG
    com.zaxxer.hikari.HikariConfig: DEBUG   # see pool state on startup
spring:
  datasource:
    hikari:
      leak-detection-threshold: 2000        # ms — log stack if a connection isn't returned`}
      </CodeBlock>

      <h2>Transactions Checklist</h2>
      <InfoBox variant="success" title="Signs your transaction handling is healthy">
        <ul>
          <li><code>@Transactional</code> lives on service methods, not on controllers or
              repositories.</li>
          <li>Read-only methods are marked <code>readOnly = true</code>.</li>
          <li>No HTTP / Kafka / SFTP calls inside a transaction. Ever.</li>
          <li>Rollback semantics are known: your domain exceptions extend
              <code>RuntimeException</code>, so they roll back by default.</li>
          <li>Cross-system atomicity uses the outbox pattern, not distributed transactions.</li>
          <li>Batch processing uses <code>TransactionTemplate</code> or splits into
              controllable chunks — no unbounded single transaction.</li>
          <li>Post-commit side effects use
              <code>@TransactionalEventListener(AFTER_COMMIT)</code>.</li>
          <li>Connection leak detection is on in dev.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Your order service saves an order and calls an external inventory API — all inside one @Transactional method. Under moderate load, the app hangs on 'Connection is not available' errors. Why?"
        options={[
          "The connection pool is too small — increase spring.datasource.hikari.maximum-pool-size",
          "The @Transactional method holds a database connection for the duration of the external HTTP call, so slow downstream calls exhaust the pool. Move the HTTP call outside the transaction.",
          "The HTTP client isn't configured with a timeout",
          "You need to add @Async to release the connection"
        ]}
        correctIndex={1}
        explanation="A @Transactional method holds a DB connection from method entry to commit or rollback. If you make an HTTP call inside, the connection stays held for the length of that call. Under load, all connections in the pool are stuck waiting for slow downstream responses, and no new requests can grab one — hence 'Connection is not available'. Raising the pool size hides the symptom until it comes back. The real fix is to shrink the transaction: do the I/O first, then persist the result in a small transaction — or use the transactional-outbox pattern for atomic cross-system operations."
      />
    </LessonLayout>
  );
}
