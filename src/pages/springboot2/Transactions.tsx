import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringBoot2Transactions() {
  return (
    <LessonLayout
      title="Transactions Deep-Dive"
      sectionId="springboot2"
      lessonIndex={9}
      prev={{ path: '/springboot2/testing', label: 'Testing in Boot 2 — @MockBean and Friends' }}
      next={{ path: '/springboot2/kafka', label: 'Kafka in Spring Boot 2' }}
    >
      <h2>Why This Lesson Exists</h2>
      <p>
        <code>@Transactional</code> is deceptively simple. Add the annotation, methods become
        atomic. But it is a proxy-based mechanism with subtle rules about propagation, rollback,
        isolation, and self-invocation — and every one of those rules was already true on Spring
        Framework 5.3, which is what Boot 2.7.18 ships. Almost none of this lesson is trivia about
        the difference between Boot 2 and Boot 4. Most of it is the mechanism itself, because a
        service dealing with money, orders, or reservations has a transactional incident sooner or
        later regardless of which Spring line it&apos;s on.
      </p>

      <InfoBox variant="info" title="How this lesson relates to the others">
        <p>
          The <a href="/springboot/transactions">Transactions Deep-Dive</a> lesson in the main
          Spring Boot section covers the same mechanism against Boot 4 / Hibernate 7. This page
          does not repeat the mental model twice — it teaches it once, grounded in{' '}
          <code>spring-tx 5.3.31</code> and Hibernate <code>5.6.15.Final</code> (see the{' '}
          <a href="/springboot2/data">data lesson</a> for how Boot picks that Hibernate version),
          and calls out the one place the two Spring lines genuinely disagree — verified below,
          not assumed.
        </p>
      </InfoBox>

      <h2>The Mental Model</h2>
      <p>
        Spring&apos;s <code>@Transactional</code> wraps the annotated method in a call to a{' '}
        <code>PlatformTransactionManager</code>. On entry it opens (or joins) a transaction; on
        normal return it commits; on unchecked exception it rolls back. The wrapping is
        implemented via a proxy — on Boot 2, as on Boot 4, usually a CGLIB subclass.
      </p>

      <FlowChart
        title="Transactional method invocation"
        chart={"graph TD\nA[Caller] --> B[Proxy]\nB --> C{Existing transaction?}\nC -->|No, propagation=REQUIRED| D[Begin new transaction]\nC -->|Yes| E[Join existing transaction]\nD --> F[Invoke target method]\nE --> F\nF --> G{Method threw runtime exception?}\nG -->|Yes| H[Rollback / Mark for rollback]\nG -->|No| I[Commit]"}
      />

      <h2>The Self-Invocation Trap (Again)</h2>
      <InfoBox variant="danger" title="If you take away one thing from this lesson">
        <p>
          <code>@Transactional</code> lives on a <em>proxy</em>. Calling{' '}
          <code>this.doWork()</code> from inside the bean bypasses the proxy. The annotation on{' '}
          <code>doWork()</code> is silently ignored.
        </p>
      </InfoBox>
      <CodeBlock language="java" title="The bug">
{`@Service
public class ReportService {

    @Transactional                       // opens tx as intended
    public void generateBatch(List<Request> reqs) {
        for (Request r : reqs) {
            this.generateOne(r);         // BYPASSES proxy — REQUIRES_NEW ignored
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateOne(Request r) { /* ... */ }
}`}
      </CodeBlock>
      <p>
        Fixes: extract the inner method into a separate bean, inject yourself with{' '}
        <code>@Lazy</code>, or use <code>TransactionTemplate</code> programmatically.
      </p>

      <h3>The quieter half of the same mechanism — and here the two Spring lines really differ</h3>
      <p>
        A proxy can only intercept a call it is able to see and override. That is the same fact as
        self-invocation, seen from the other side, and it produces a real, verified difference
        between Spring 5.3 (Boot 2) and Spring 6+ (Boot 3/4). A tiny standalone Spring context —
        one bean, four methods identical except for visibility, each reporting whether it actually
        ran inside a transaction — makes the difference impossible to hand-wave:
      </p>
      <CodeBlock language="java" title="Target.java — same class, run unmodified on both Spring lines">
{`@Component
class Target {
    @Transactional
    public boolean publicWork() {
        return TransactionSynchronizationManager.isActualTransactionActive();
    }

    @Transactional
    protected boolean protectedWork() {
        return TransactionSynchronizationManager.isActualTransactionActive();
    }

    @Transactional
    boolean packagePrivateWork() {                 // no modifier
        return TransactionSynchronizationManager.isActualTransactionActive();
    }
}
// A separate bean in the same package calls target.publicWork(), target.protectedWork()
// and target.packagePrivateWork() directly — not through 'this', so this is NOT the
// self-invocation case above. It is a genuinely external call through the injected proxy.`}
      </CodeBlock>
      <CodeBlock language="text" title="Real output — identical code, two dependency sets">
{`spring-boot-starter-parent 2.7.18  (spring-tx 5.3.31)
  RESULT public            active=true
  RESULT protected         active=false
  RESULT package-private   active=false

spring-boot-starter-parent 3.0.13  (spring-tx 6.0.14)
  RESULT public            active=true
  RESULT protected         active=true
  RESULT package-private   active=true`}
      </CodeBlock>
      <InfoBox variant="danger" title="On Boot 2, @Transactional on anything but a public method is silently ignored">
        <p>
          Spring&apos;s own CGLIB proxy is a <em>subclass</em> of your bean, and on Framework 5.3
          that subclass&apos;s generated interceptor only advises <strong>public</strong> methods —
          <code>protected</code> and package-visible methods run, the call succeeds, nothing
          throws, and there is simply no transaction open while they execute. No warning, no log
          line. If you inherited a Boot 2 codebase with <code>@Transactional</code> on a{' '}
          <code>protected</code> method — a common style choice, meant to say &quot;internal API,
          package callers only&quot; — read that as <strong>not currently transactional</strong>,
          verify it, and fix the visibility rather than assume the annotation is doing its job.
        </p>
        <p>
          Framework 6.0 changed this — class-based proxies advise protected and package-visible
          methods normally from Boot 3 onward, which is what the{' '}
          <a href="/springboot/transactions">Boot 4 lesson</a> describes as current behaviour. On
          Boot 2 the older, stricter rule is the one you actually have. <code>final</code> methods
          and <code>final</code> classes remain unadvisable on both lines — CGLIB cannot subclass
          either — and <code>private</code> methods are never advisable on any Spring version,
          proxy-based AOP or otherwise: <code>private</code> calls compile to <code>invokespecial</code>,
          which is statically bound and bypasses virtual dispatch — and therefore the proxy —
          entirely, even when the call is &quot;external&quot; in every other sense.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="A second annotation with the same name, seen in older Boot 2 codebases">
        <p>
          You will occasionally find <code>javax.transaction.Transactional</code> instead of{' '}
          <code>org.springframework.transaction.annotation.Transactional</code> — usually in code
          written for a JTA-managed environment (Atomikos, Bitronix, an app-server-provided
          transaction manager), which was more common in the Boot 2 era than it is now. Spring has
          recognised the JTA annotation as an alternative source of transaction metadata since
          Spring 4 — <code>JtaTransactionAnnotationParser</code> is present in both{' '}
          <code>spring-tx-5.3.31.jar</code> and <code>spring-tx-6.0.0.jar</code>, so this is not a
          Boot-2-specific quirk, and it becomes <code>jakarta.transaction.Transactional</code> on
          the same terms as everything else in the <a href="/springboot2/javax">javax lesson</a>.
          What <em>is</em> worth knowing before you touch one: the JTA annotation is smaller.
          Checked directly against <code>javax.transaction-api-1.3.jar</code>, it exposes only{' '}
          <code>value()</code> (a <code>TxType</code> enum: <code>REQUIRED</code>,{' '}
          <code>REQUIRES_NEW</code>, <code>MANDATORY</code>, <code>SUPPORTS</code>,{' '}
          <code>NOT_SUPPORTED</code>, <code>NEVER</code> — no <code>NESTED</code>),{' '}
          <code>rollbackOn()</code> and <code>dontRollbackOn()</code>. There is no{' '}
          <code>isolation</code>, no <code>readOnly</code>, no <code>timeout</code>. If a Boot 2
          service you are reading uses the JTA spelling and needs any of those three, that is
          usually the tell that it should be converted to Spring&apos;s own annotation rather than
          fought with.
        </p>
      </InfoBox>

      <h2>UnexpectedRollbackException — &quot;I caught the exception, why did it still roll back?&quot;</h2>
      <p>
        The most confusing transaction error in Spring, and it follows inevitably from how{' '}
        <code>REQUIRED</code> works — unchanged behaviour, same class, same package, on both Boot
        2 and Boot 4.
      </p>
      <CodeBlock language="java" title="The setup that produces it">
{`@Service
class OrderService {
    @Transactional                       // starts the physical transaction
    public void placeAll(List<Req> reqs) {
        for (Req r : reqs) {
            try {
                audit.record(r);         // separate bean, @Transactional(REQUIRED)
            } catch (Exception e) {
                log.warn("audit failed, carrying on", e);   // deliberate: audit
            }                                               // is not critical
        }
        orders.saveAll(reqs);
    }
}

@Service
class AuditService {
    @Transactional                       // REQUIRED — JOINS the caller's tx,
    public void record(Req r) {          // it does NOT start its own
        throw new IllegalStateException("boom");
    }
}

// Result: placeAll() returns normally, you swallowed the exception on
// purpose... and the commit throws:
//
//   org.springframework.transaction.UnexpectedRollbackException:
//     Transaction silently rolled back because it has been marked as
//     rollback-only`}
      </CodeBlock>
      <InfoBox variant="info" title="Why — and it is not Spring being difficult">
        <p>
          <code>REQUIRED</code> means <em>join the existing transaction</em>. There is only one
          physical transaction here, so when <code>record()</code> fails there is nothing to roll
          back independently. Spring sets the <strong>rollback-only</strong> flag on the shared
          transaction and lets the exception propagate. Your <code>catch</code> stops the
          exception, but the flag has already been set. At commit, the transaction manager sees
          the flag, refuses to commit, and tells you it happened rather than silently discarding
          your data.
        </p>
      </InfoBox>
      <CodeBlock language="java" title="Three fixes, by what you actually meant">
{`// (a) "The audit really is independent." Give it its own physical
//     transaction, so its failure has somewhere to roll back TO.
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void record(Req r) { ... }

// (b) "This exception is expected and shouldn't roll anything back."
@Transactional(noRollbackFor = AuditUnavailableException.class)
public void record(Req r) { ... }

// (c) "The audit isn't part of this unit of work at all." Move it out of the
//     transaction — a post-commit event is the usual answer. See below.

// Diagnostic, identical on both Spring lines:
//   TransactionAspectSupport.currentTransactionStatus().isRollbackOnly()`}
      </CodeBlock>

      <h2>Propagation — What Happens When You&apos;re Already in a Transaction</h2>
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
  Rare — for code that must not be inside a tx.

NESTED
  Uses a JDBC savepoint. Rollback rolls back to the savepoint, not the whole
  outer tx. JDBC only, not JPA (usually). Note this is also where the JTA
  javax.transaction.Transactional annotation above falls short — it has no
  NESTED value at all, only Spring's own annotation offers it.`}
      </CodeBlock>
      <InfoBox variant="warning" title="REQUIRES_NEW takes a second connection">
        <p>
          Suspending a transaction to open a new one means both are open at the same time. That is
          two connections from the pool. In a tight loop, you exhaust the pool — HikariCP is
          Boot&apos;s default connection pool on both Boot 2.7 and Boot 4, so this failure mode
          looks identical on either. Prefer moving the &quot;must commit independently&quot; work
          out of the loop.
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
Optimistic locking (@Version — javax.persistence on Boot 2, jakarta.persistence on
Boot 3+; identical annotation either side of the rename) is usually a better answer
than SERIALIZABLE.`}
      </CodeBlock>

      <h2>Rollback Rules</h2>
      <p>
        By default, Spring rolls back on <code>RuntimeException</code> <em>or</em>{' '}
        <code>Error</code>. Checked exceptions <strong>commit</strong> the transaction unless you
        say otherwise — same rule, same default, on both Spring lines.
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
          If your <code>DomainException</code> hierarchy extends <code>RuntimeException</code> —
          see the <a href="/springboot2/error">error handling lesson</a> — rollback works
          naturally, on Boot 2 exactly as on Boot 4. Don&apos;t bother tuning{' '}
          <code>rollbackFor</code> unless you&apos;re stuck with a legacy checked exception you
          can&apos;t change.
        </p>
      </InfoBox>

      <h2>Read-Only Transactions</h2>
      <p>Mark queries with <code>readOnly = true</code>. Two benefits, unchanged on Hibernate 5.6:</p>
      <ul>
        <li>Spring sets the Hibernate session&apos;s flush-mode to <code>FlushMode.MANUAL</code> —
            no dirty-checking overhead for entities you just read. (You will still see{' '}
            <code>NEVER</code> in older write-ups; that was the Hibernate 3 name, deprecated in
            favour of <code>MANUAL</code> long before Hibernate 5 — this is not a Boot 2 vs Boot 4
            difference, it just predates both.)</li>
        <li>Some drivers route the query to a read replica automatically.</li>
      </ul>
      <CodeBlock language="java" title="Read-only queries">
{`@Transactional(readOnly = true)
public Optional<Customer> findById(String id) {
    return customers.findById(id);
}`}
      </CodeBlock>

      <h2>The Cardinal Sin: I/O Inside a Transaction</h2>
      <p>
        A transaction holds a database connection from the pool. If you make an HTTP call (or
        Kafka publish, or SFTP upload) inside <code>@Transactional</code>, that connection is{' '}
        <em>held</em> for the length of the remote call.
      </p>
      <CodeBlock language="java" title="The anti-pattern and its fix">
{`// ANTI-PATTERN
@Transactional
public Order place(NewOrderRequest req) {
    Order order = orders.save(Order.from(req));
    inventory.reserve(order.getItems());              // HTTP call — pool exhaustion
    payments.charge(order.getTotal(), req.getCard());  // more HTTP — worse
    return order;
}

// FIX: shrink the transaction. Only the DB operations live inside it.
public Order place(NewOrderRequest req) {
    inventory.reserve(req.getItems());
    PaymentConfirmation confirmation = payments.charge(req.getTotal(), req.getCard());

    // Separate bean, so the call goes through its proxy and @Transactional
    // actually applies — and per the section above, this method must stay
    // PUBLIC on Boot 2 or the annotation is silently ignored.
    return orderPersistence.saveOrder(req, confirmation);
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
          When you need to atomically persist an order AND publish a Kafka event, persist a
          &quot;pending event&quot; row in the same transaction, then relay it separately — the{' '}
          <strong>transactional outbox</strong>. The{' '}
          <a href="/springboot2/kafka">Kafka in Spring Boot 2</a> lesson covers it.
        </p>
      </InfoBox>

      <h2>Programmatic Transactions — TransactionTemplate</h2>
      <p>
        <code>org.springframework.transaction.support.TransactionTemplate</code> is a Spring
        Framework class and never moved. Useful when transactional boundaries do not align with
        method boundaries:
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
        txTemplate.executeWithoutResult(status -> rowRepository.saveAll(batch));
    }
}`}
      </CodeBlock>

      <h2>@TransactionalEventListener — Events That Fire After Commit</h2>
      <p>
        Also unchanged: <code>org.springframework.transaction.event.TransactionalEventListener</code>{' '}
        never moved packages. If you want a listener to run only after the transaction
        successfully commits, use{' '}
        <code>@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)</code>.
      </p>
      <CodeBlock language="java" title="Bulletproof event handling">
{`@Component
public class OrderNotifier {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onOrderPlaced(OrderPlacedEvent event) {
        emailService.sendConfirmation(event.getOrderId());
    }
}

// The phases, in the order they fire:
//   BEFORE_COMMIT      still inside the tx — writes here are part of it
//   AFTER_COMMIT       (default) committed and durable
//   AFTER_ROLLBACK     the tx rolled back
//   AFTER_COMPLETION   either outcome

// IMPORTANT — this is NOT the transactional outbox. AFTER_COMMIT fires after
// the database has already committed, so if this method throws the event is
// lost FOREVER with no record it should have been sent. Fine for a
// best-effort email; not fine for an event another service depends on.
// For at-least-once delivery, write the event to an outbox TABLE in the same
// transaction and relay it separately (see the Kafka lesson):
@Transactional
public Order place(NewOrderRequest req) {
    Order order = orders.save(Order.from(req));
    outbox.save(new OutboxEvent("OrderPlaced", toJson(order)));  // same tx — atomic
    return order;
}`}
      </CodeBlock>
      <InfoBox variant="danger" title="&quot;My @TransactionalEventListener never fires&quot;">
        <p>
          Overwhelmingly one cause, and it is the same cause on Boot 2 as on Boot 4: the event was{' '}
          <strong>published outside a transaction</strong>. The listener attaches itself to the
          transaction active at publish time and asks to be called back at commit. No active
          transaction means nothing to attach to — the event is dropped{' '}
          <strong>silently</strong>. Check the publisher: a missing <code>@Transactional</code>, a
          self-invocation call that bypassed the proxy (see above — and remember protected/
          package-private methods are a second way to lose the proxy on Boot 2 specifically), or
          publication from a <code>@Scheduled</code> or test method with no transaction at all.
          Set <code>fallbackExecution = true</code> if you want it delivered either way.
        </p>
      </InfoBox>

      <h2>Testing Transactional Behavior</h2>
      <p>
        <code>@SpringBootTest</code> with <code>@Transactional</code> on the test class rolls back
        after each test. Same mechanism, same caveat, on Boot 2 as on Boot 4 — it can hide
        transactional bugs because everything gets rolled back anyway:
      </p>
      <CodeBlock language="java" title="A test that specifically exercises rollback">
{`@SpringBootTest
class OrderServiceTx {

    @Autowired OrderService svc;
    @Autowired OrderRepository orders;

    @Test
    void rollsBackOnDownstreamFailure() {
        String id = "ord-" + UUID.randomUUID();
        assertThatThrownBy(() -> svc.placeAndCharge(failingRequest(id)))
            .isInstanceOf(PaymentDeclinedException.class);

        assertThat(orders.findById(id)).isEmpty();
    }
}`}
      </CodeBlock>

      <h2>Diagnostic — Watch Your Transactions in Dev</h2>
      <CodeBlock language="yaml" title="Log transaction boundaries and connection usage — identical properties on Boot 2 and Boot 4">
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
          <li>Every <code>@Transactional</code> method that needs to actually run one is{' '}
              <strong>public</strong> — on Boot 2, that is not a style preference, it is the only
              visibility the proxy advises.</li>
          <li>Read-only methods are marked <code>readOnly = true</code>.</li>
          <li>No HTTP / Kafka / SFTP calls inside a transaction. Ever.</li>
          <li>Rollback semantics are known: your domain exceptions extend{' '}
              <code>RuntimeException</code>, so they roll back by default.</li>
          <li>Cross-system atomicity uses the outbox pattern, not distributed transactions.</li>
          <li>Batch processing uses <code>TransactionTemplate</code> or splits into controllable
              chunks — no unbounded single transaction.</li>
          <li>Post-commit side effects use{' '}
              <code>@TransactionalEventListener(AFTER_COMMIT)</code>.</li>
          <li>Any <code>javax.transaction.Transactional</code> usage has a reason (a real JTA
              transaction manager) rather than being an accidental import.</li>
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
        explanation="A @Transactional method holds a DB connection from method entry to commit or rollback — true on Boot 2's spring-tx 5.3.31 exactly as on Boot 4. Make an HTTP call inside it and the connection stays held for the length of that call. Under load, all connections in the pool are stuck waiting for slow downstream responses, and no new requests can grab one — hence 'Connection is not available'. Raising the pool size hides the symptom until it comes back. The real fix is to shrink the transaction: do the I/O first, then persist the result in a small transaction on a separate bean — or use the transactional-outbox pattern for atomic cross-system operations."
      />

      <InteractiveChallenge
        question="You're reading a Spring Boot 2.7.18 codebase and find @Transactional on a protected method, called from another bean in the same package (not self-invocation). On Boot 4 this would work fine. What actually happens here, on Boot 2?"
        options={[
          "Identical behaviour to Boot 4 — @Transactional's visibility rules never changed between Spring versions",
          "It throws IllegalStateException at startup because CGLIB cannot proxy a protected method",
          "The call succeeds with no error, but no transaction is opened — verified live: Spring 5.3's CGLIB interceptor only advises public methods, while Spring 6.0+ advises protected and package-private methods too",
          "It falls back to a JDK dynamic proxy automatically, which can advise protected methods"
        ]}
        correctIndex={2}
        explanation="This is a genuine, verified difference between the two Spring lines, not a hypothetical. Running the identical bean — one public, one protected, one package-private @Transactional method, each reporting TransactionSynchronizationManager.isActualTransactionActive() — against spring-tx 5.3.31 (Boot 2.7.18) shows protected and package-private both report false: no transaction opened, no error raised, no log line. The exact same class run against spring-tx 6.0.14 (Boot 3.0.13) shows both report true. Framework 6.0 extended class-based proxies to advise protected/package-private methods; Boot 2 has the older, stricter rule. Option 2 is wrong because nothing fails loudly — that's what makes this dangerous. Option 4 is wrong because CGLIB is used automatically here (the bean implements no interface) and a JDK dynamic proxy would actually be MORE restrictive, not less — it can only see public interface methods."
      />
    </LessonLayout>
  );
}
