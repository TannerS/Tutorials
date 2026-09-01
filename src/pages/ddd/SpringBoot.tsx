import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function DddSpringBoot() {
  return (
    <LessonLayout
      title="DDD in a Spring Boot Codebase"
      sectionId="ddd"
      lessonIndex={5}
      prev={{ path: '/ddd/event-storming', label: 'Event Storming: Discovering Bounded Contexts' }}
      next={{ path: '/ddd/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        Everything so far — <strong>Entities</strong>, <strong>Value Objects</strong>,{' '}
        <strong>Aggregates</strong>, <strong>domain events</strong>, the DDD-flavored{' '}
        <strong>Repository</strong> pattern — has been vocabulary and diagrams. This lesson maps
        every one of those words onto an actual Spring Boot package layout and actual Java classes,
        and it does something the earlier lessons couldn&apos;t: <strong>it was compiled and run</strong>.
      </p>

      <InfoBox variant="note" title="What was actually verified here">
        <p>
          Every class on this page was written to a real Maven project and built with{' '}
          <code>mvn test</code> against <strong>Spring Boot 4.1.1</strong> (the version this whole
          course targets — see the Spring Boot section&apos;s <strong>Boot 4 Novelties</strong>{' '}
          lesson), which pulled in <strong>Hibernate ORM 7.4.5.Final</strong> and{' '}
          <strong>Spring Data JPA 4.1.1</strong>, running on a real <strong>JDK 25.0.2</strong>{' '}
          (the current LTS this course standardizes on). Persistence used a real in-memory{' '}
          <strong>H2 2.4.240</strong> database via <code>@DataJpaTest</code> — an actual schema
          was generated, actual SQL ran, actual rows round-tripped. None of it is pseudocode. Where
          this page shows the deliberately-wrong version of something, that&apos;s labeled, and
          the working test that proves it&apos;s wrong is shown too — not asserted, demonstrated.
        </p>
      </InfoBox>

      <h2>Package by Bounded Context, Not by Technical Layer</h2>
      <p>
        The most common structural mistake in a Spring Boot codebase isn&apos;t a missing
        annotation — it&apos;s the package layout itself. The default instinct, especially coming
        from tutorials, is to group classes by <em>what kind of thing they are</em>:
      </p>

      <CodeBlock language="text" title="The common mistake: package-by-technical-layer, across the whole app">
{`com.example
├── controllers
│   ├── OrderController.java
│   ├── PaymentController.java
│   └── InventoryController.java
├── services
│   ├── OrderService.java
│   ├── PaymentService.java
│   └── InventoryService.java
├── repositories
│   ├── OrderRepository.java        <- extends JpaRepository directly, see below
│   ├── PaymentRepository.java
│   └── InventoryRepository.java
└── entities
    ├── Order.java
    ├── Payment.java
    └── InventoryItem.java

PROBLEM: nothing here reflects where the seams from Event Storming actually
were. "services" contains Ordering logic, Payment logic, and Inventory logic
sitting in the same folder with nothing stopping OrderService from reaching
into PaymentRepository directly -- the package structure enforces zero
boundaries between contexts that are supposed to be independent.`}
      </CodeBlock>

      <p>
        Compare that with grouping by <strong>bounded context first</strong>, and only then by
        technical role <em>within</em> that context — which is what the rest of this lesson builds:
      </p>

      <CodeBlock language="text" title="Package by bounded context, technical layer second">
{`com.example.ordering
├── domain                          <- the aggregate + its rules. No framework imports
│   ├── Order.java                     that aren't strictly needed for mapping.
│   ├── OrderLine.java
│   ├── OrderStatus.java
│   └── OrderRepository.java        <- narrow, domain-shaped interface (no JpaRepository here)
├── application
│   └── OrderApplicationService.java   <- use-case orchestration, transactions
└── infrastructure
    └── persistence
        ├── SpringDataOrderRepository.java   <- package-PRIVATE, wraps JpaRepository
        └── JpaOrderRepository.java          <- package-PRIVATE, implements domain.OrderRepository

com.example.payment
├── domain
├── application
└── infrastructure

PAYOFF: "ordering" and "payment" are now the same seams Event Storming found
on the wall. A class in com.example.payment cannot reach into
com.example.ordering.infrastructure.persistence even if someone tries --
that package's types are package-private, and Java's compiler, not a linter
or a code-review comment, is what stops it.`}
      </CodeBlock>

      <h2>The Order Aggregate as a JPA @Entity</h2>
      <p>
        Here is the load-bearing distinction this whole lesson rests on: a JPA{' '}
        <code>@Entity</code> and a DDD <strong>Entity</strong> are related concepts that get
        conflated constantly, and the conflation is expensive.
      </p>

      <InfoBox variant="warning" title="JPA @Entity is a mapping concept. DDD Entity is a modeling concept.">
        <p>
          <code>@Entity</code> tells Hibernate &quot;map instances of this class to rows in a
          table.&quot; That&apos;s it — it says nothing about behavior, invariants, or what
          operations are legal. A DDD <strong>Entity</strong> is a much bigger claim: an object
          with a stable identity across its lifetime whose job is to <em>protect its own
          invariants</em> at every single state change. Spring Data JPA tutorials teach the first
          meaning almost exclusively — a class with fields, getters, setters, and{' '}
          <code>@Entity</code> on it — which trains developers to treat the annotated class as a
          dumb data holder. Every business rule then has nowhere else to go but the service layer,
          because the &quot;model&quot; was never given anywhere to put it. That is precisely how
          an <strong>anemic domain model</strong> is born: not from laziness, but from treating
          the persistence annotation as if it were the whole design.
        </p>
      </InfoBox>

      <p>
        The fix isn&apos;t to stop using <code>@Entity</code> — it&apos;s to keep it on a class
        that also does the DDD Entity&apos;s actual job. Below, <code>Order</code> has{' '}
        <strong>zero public setters</strong>. Every legal state change is a named method that
        enforces a rule in plain Java, and this compiles and persists correctly against real
        Hibernate with no Bean Validation annotations doing any of that enforcement:
      </p>

      <CodeBlock language="java" title="com/example/ordering/domain/Order.java — compiled and persisted for real">
{`@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private String customerId;

    @ElementCollection
    @CollectionTable(name = "order_lines", joinColumns = @JoinColumn(name = "order_id"))
    private List<OrderLine> lines = new ArrayList<>();

    // Required by Hibernate: it builds the instance via reflection before
    // populating fields from a JDBC result set. Note: protected, not public.
    // Nothing outside this package can call 'new Order()' and get a
    // half-built order past the compiler. Hibernate can, because it never
    // goes through ordinary constructor-call semantics -- it's reflection,
    // which is exactly why this constructor doesn't (and can't) validate
    // anything.
    protected Order() { }

    private Order(String customerId, List<OrderLine> lines) {
        this.customerId = customerId;
        this.lines = new ArrayList<>(lines);
        this.status = OrderStatus.PLACED;
    }

    // The ONLY supported way to create an Order. Every invariant that must
    // hold the instant an order exists is enforced HERE, in plain Java --
    // not in a DTO validator, not in a database CHECK constraint.
    public static Order place(String customerId, List<OrderLine> lines) {
        if (customerId == null || customerId.isBlank()) {
            throw new IllegalArgumentException("Order requires a customer");
        }
        if (lines == null || lines.isEmpty()) {
            throw new IllegalArgumentException("Order requires at least one line item");
        }
        for (OrderLine line : lines) {
            if (line.quantity() <= 0) {
                throw new IllegalArgumentException("Line quantity must be positive: " + line);
            }
        }
        return new Order(customerId, lines);
    }

    // Behavior, not a setter. This is a state-machine invariant that Bean
    // Validation has no vocabulary for -- "legal values depend on the
    // object's CURRENT state" isn't something an annotation can express.
    public void authorizePayment() {
        if (status != OrderStatus.PLACED) {
            throw new IllegalStateException(
                "Cannot authorize payment for an order in status " + status);
        }
        this.status = OrderStatus.PAYMENT_AUTHORIZED;
    }

    public void ship() {
        if (status != OrderStatus.PAYMENT_AUTHORIZED) {
            throw new IllegalStateException(
                "Cannot ship an order before payment is authorized (status=" + status + ")");
        }
        this.status = OrderStatus.SHIPPED;
        // A real codebase registers an OrderShipped domain event on 'this'
        // right here -- the mechanism the previous lesson covered -- for
        // the application service to publish after a successful save.
    }

    public void cancel() {
        if (status == OrderStatus.SHIPPED) {
            throw new IllegalStateException("Cannot cancel an order that has already shipped");
        }
        this.status = OrderStatus.CANCELLED;
    }

    public Long id() { return id; }
    public String customerId() { return customerId; }
    public OrderStatus status() { return status; }
    public List<OrderLine> lines() { return Collections.unmodifiableList(lines); }
}`}
      </CodeBlock>

      <p>
        The <code>protected Order()</code> constructor is required by the JPA spec — Hibernate has
        to be able to instantiate the class before it has any data to put in it — and it&apos;s
        the one place the persistence concern leaks into the domain class&apos;s API surface at
        all. Everything else on this class is ordinary Java: a private constructor, a validating
        static factory, and methods named after what a domain expert would call them (
        <code>authorizePayment</code>, <code>ship</code>, <code>cancel</code>), each one guarding
        exactly the transition it&apos;s responsible for. Hibernate maps this via{' '}
        <strong>field access</strong> (the annotations are on the fields, not on getters), which
        is what makes &quot;zero public setters&quot; possible at all — it does not need a setter
        to populate <code>status</code> when loading a row; it writes the field directly through
        reflection.
      </p>

      <p>
        <code>OrderLine</code> is the Value Object from the tactical lesson, and it&apos;s mapped
        as a Java <code>record</code> annotated <code>@Embeddable</code> — a genuinely real
        Hibernate 6.2+ capability, not a simplification for this lesson, and it round-tripped
        correctly through the actual H2 database in the same test run:
      </p>

      <CodeBlock language="java" title="com/example/ordering/domain/OrderLine.java — a Value Object as an @Embeddable record">
{`@Embeddable
public record OrderLine(String productSku, int quantity, long unitPriceCents) {
}
// No identity, equality by value, immutable -- a record gets all of that
// for free, which is exactly the shape a Value Object needs.`}
      </CodeBlock>

      <h2>The Repository Anti-Pattern, Proven Empirically</h2>
      <p>
        Now the part that actually costs teams real invariant violations in production. Spring
        Data JPA makes it trivial to write this:
      </p>

      <CodeBlock language="java" title="THE ANTI-PATTERN — exposing JpaRepository<Order, Long> directly">
{`// Looks completely reasonable. This is the interface every Spring Data
// tutorial teaches first.
public interface OrderJpaRepository extends JpaRepository<Order, Long> { }

@RestController
@RequestMapping("/api/orders")
class OrderController {

    private final OrderJpaRepository orders;   // <- injected straight in

    OrderController(OrderJpaRepository orders) { this.orders = orders; }

    @DeleteMapping("/{id}")
    void cancel(@PathVariable Long id) {
        orders.deleteById(id);   // no call to Order.cancel(). No invariant check. Just gone.
    }
}`}
      </CodeBlock>

      <p>
        <code>Order.cancel()</code> throws <code>IllegalStateException</code> for a shipped order
        — that invariant is real, and it&apos;s enforced in the class shown above. But{' '}
        <code>deleteById</code> never calls <code>cancel()</code>. It never touches an{' '}
        <code>Order</code> instance at all — it issues <code>DELETE FROM orders WHERE id = ?</code>{' '}
        directly. The aggregate&apos;s protective methods only protect callers who go{' '}
        <em>through the aggregate</em>. A generic repository handed out to arbitrary callers is a
        second, ungoverned door into the same data, and every method on it —{' '}
        <code>deleteById</code>, <code>saveAll</code>, <code>findAll</code> — walks straight past
        that door.
      </p>

      <p>
        This is not a hypothetical. It was reproduced directly, on the real H2 database, in the
        same build referenced above:
      </p>

      <CodeBlock language="java" title="The failing case, as an actual passing test (proving the bug exists)">
{`@Test
void rawSpringDataRepositoryCanDeleteAShippedOrder_whichIsExactlyTheBug() {
    Order order = Order.place("cust-1", List.of(new OrderLine("W-1", 1, 500)));
    order.authorizePayment();
    order.ship();
    Order shipped = orders.save(order);

    // order.cancel() would throw IllegalStateException right here --
    // that's a separate, passing test. But this line doesn't call
    // cancel(). It goes straight to the database.
    jpa.deleteById(shipped.id());

    assertThat(jpa.findById(shipped.id())).isEmpty();   // gone. No exception. No invariant.
}`}
      </CodeBlock>

      <p>
        The fix is the narrow domain-facing <code>OrderRepository</code> interface from the
        previous lesson, backed by a <strong>package-private</strong> implementation. This isn&apos;t
        a style preference — it changes what the compiler will let other code do:
      </p>

      <CodeBlock language="java" title="com/example/ordering/domain/OrderRepository.java — the narrow contract">
{`// Deliberately NOT a Spring Data JpaRepository. This is the aggregate-shaped
// contract the domain and application layers depend on: find the whole
// aggregate, save the whole aggregate. No findAll(), no deleteById(), no
// generic query methods -- those belong to the persistence technology, not
// to the domain's vocabulary.
public interface OrderRepository {
    Optional<Order> findById(Long id);
    Order save(Order order);
}`}
      </CodeBlock>

      <CodeBlock language="java" title="com/example/ordering/infrastructure/persistence — the only place the CRUD surface exists">
{`// Package-PRIVATE. Classes in com.example.ordering.domain or .application
// cannot import this type -- it will not compile if they try. Spring Data
// still generates a working implementation for it; interface visibility
// has no effect on that.
interface SpringDataOrderRepository extends JpaRepository<Order, Long> { }

// Also package-private. The only public export of this package that the
// rest of the app may depend on for persistence is the DOMAIN interface --
// this class depends on OrderRepository's shape, never the other way
// around.
@Repository
class JpaOrderRepository implements OrderRepository {

    private final SpringDataOrderRepository jpa;

    JpaOrderRepository(SpringDataOrderRepository jpa) { this.jpa = jpa; }

    @Override
    public Optional<Order> findById(Long id) { return jpa.findById(id); }

    @Override
    public Order save(Order order) { return jpa.save(order); }
}`}
      </CodeBlock>

      <p>
        Every class outside this package — the application service, any future controller,
        another developer six months from now who has never read this lesson — depends on{' '}
        <code>OrderRepository</code>, which physically does not expose a way to delete or bulk-list
        orders. That&apos;s not a code-review rule someone has to remember to enforce. It&apos;s a
        compile error if violated, which was confirmed the same way everything else on this page
        was: by actually building it and watching Spring wire package-private beans without
        complaint.
      </p>

      <CodeBlock language="java" title="com/example/ordering/application/OrderApplicationService.java — the only legal way in">
{`@Service
public class OrderApplicationService {

    private final OrderRepository orders;   // the narrow interface -- deleteById does not exist here

    public OrderApplicationService(OrderRepository orders) { this.orders = orders; }

    @Transactional
    public Order placeOrder(String customerId, List<OrderLine> lines) {
        Order order = Order.place(customerId, lines);   // invariants enforced before anything is saved
        return orders.save(order);
    }

    @Transactional
    public Order cancel(Long orderId) {
        Order order = orders.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("No such order: " + orderId));
        order.cancel();          // THIS throws for a shipped order -- the invariant actually runs
        return orders.save(order);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="A real friction point this build surfaced, worth knowing before you hit it">
        <p>
          <code>@DataJpaTest</code> auto-detects JPA entities and Spring Data repository{' '}
          <em>interfaces</em>, but it does not scan ordinary <code>@Component</code>/
          <code>@Repository</code> classes — which is exactly what the hand-written{' '}
          <code>JpaOrderRepository</code> is. The first test run failed with{' '}
          <code>NoSuchBeanDefinitionException</code> for <code>OrderRepository</code> until{' '}
          <code>@Import(JpaOrderRepository.class)</code> was added to the test class. Small
          detail, but it's a real, first-hand example of the extra ceremony this pattern costs —
          see the honest accounting below.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Re-verifying on Boot 4.1.1 surfaced a second, Boot-4-specific friction point">
        <p>
          On Spring Boot 3.x, <code>@DataJpaTest</code> shipped inside{' '}
          <code>spring-boot-test-autoconfigure</code>, which <code>spring-boot-starter-test</code>{' '}
          already pulls in — nothing extra to add. Boot 4&apos;s module split (covered in{' '}
          <strong>Boot 4 Novelties</strong>) moved it into its own per-technology module, so the
          same POM that worked on Boot 3 fails to compile on Boot 4 with{' '}
          <code>package org.springframework.boot.test.autoconfigure.orm.jpa does not exist</code>{' '}
          until <code>spring-boot-starter-data-jpa-test</code> (test scope) is added explicitly.
          The class also <strong>changed package</strong>, not just module —{' '}
          <code>org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest</code> (Boot 3.x)
          became <code>org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest</code>{' '}
          (Boot 4.x). Every other annotation and API used on this page — <code>@Entity</code>,{' '}
          <code>@Embeddable</code> on a record, <code>@ElementCollection</code>,{' '}
          <code>JpaRepository</code>, <code>@Transactional</code> — compiled and behaved
          identically on both versions; this import was the only change this page&apos;s code
          actually needed for Boot 4.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="What actually happened when this was built (trimmed, real output)">
{`$ mvn clean test          # Spring Boot 4.1.1, Hibernate 7.4.5.Final, JDK 25.0.2

Hibernate: create table order_lines (quantity integer, order_id bigint not null,
    unit_price_cents bigint, product_sku varchar(255))
Hibernate: create table orders (id bigint generated by default as identity,
    customer_id varchar(255) not null,
    status enum ('CANCELLED','PAYMENT_AUTHORIZED','PLACED','SHIPPED') not null,
    primary key (id))
Hibernate: alter table if exists order_lines add constraint FK1smc0...
    foreign key (order_id) references orders

Hibernate: insert into orders (customer_id,status,id) values (?,?,default)
Hibernate: insert into orders (customer_id,status,id) values (?,?,default)

-------------------------------------------------------------------------------
Test set: com.example.ordering.domain.OrderTest
Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
-------------------------------------------------------------------------------
Test set: com.example.ordering.infrastructure.persistence.JpaOrderRepositoryTest
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
-------------------------------------------------------------------------------

BUILD SUCCESS`}
      </CodeBlock>

      <p>
        The seven <code>OrderTest</code> cases are plain JUnit — no Spring context at all — and
        prove the invariants (rejecting an empty order, refusing to ship before payment, refusing
        to cancel after shipping) hold as ordinary Java method calls. The two{' '}
        <code>JpaOrderRepositoryTest</code> cases are the real Hibernate round trip and the
        anti-pattern proof above, both against the real H2 database. The generated schema — an
        <code> orders</code> table plus a child <code>order_lines</code> table with a foreign key
        — is exactly what you&apos;d expect from the <code>@ElementCollection</code> mapping, and
        it came from Hibernate reading the annotations, not from hand-written DDL.
      </p>

      <h2>The Honest Cost of This Pattern</h2>
      <InfoBox variant="danger" title="This is more code. Sometimes that's the wrong trade.">
        <p>
          Counted plainly, protecting one aggregate this way took <strong>six classes</strong>{' '}
          (<code>Order</code>, <code>OrderLine</code>, <code>OrderStatus</code>,{' '}
          <code>OrderRepository</code>, <code>SpringDataOrderRepository</code>,{' '}
          <code>JpaOrderRepository</code>) plus an application service, spread across three
          packages, versus the one <code>@Entity</code> and one{' '}
          <code>JpaRepository&lt;Order, Long&gt;</code> interface the naive version needs. Every
          new query — &quot;find orders placed in the last 24 hours&quot; — means adding a method
          to the domain interface <em>and</em> its implementation, instead of one derived-query
          method on a Spring Data interface. Test setup gets an extra <code>@Import</code> line
          per repository, as shown above, and every teammate has to actually understand{' '}
          <em>why</em> the indirection exists or they&apos;ll &quot;simplify&quot; it away the
          first time it&apos;s in their way.
        </p>
        <p>
          For a small internal CRUD service — an admin tool over a handful of tables, a service
          where &quot;update the row&quot; genuinely is the entire business rule — this is not
          worth building. Bean Validation on a plain <code>@Entity</code>, a public setter or
          two, and a directly-injected <code>JpaRepository</code> is the correct, boring choice,
          and reaching for the full pattern there is cargo-culting DDD onto a problem that doesn't
          have the complexity to justify it. The trade only pays for itself once an aggregate has
          real state-machine invariants — transitions that are illegal in some states and legal in
          others — that a generic <code>save()</code> can silently violate. If every field on your
          entity can be set independently of every other field with no rule connecting them,
          you don't have an aggregate invariant to protect, and this lesson's entire apparatus is
          solving a problem you don't have yet.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A junior developer on your team writes: public interface ProductRepository extends JpaRepository<Product, Long> {} and injects it directly into a ProductController, reasoning 'it's less code and Spring Data already gives me save() and findById() for free.' Product has no state-machine invariants -- it's a name, a price, and a description, each independently editable. What's the correct response?"
        options={[
          "Always wrong -- every aggregate must be protected behind a narrow domain repository interface, no exceptions",
          "It's fine here -- Product has no cross-field invariants or illegal state transitions for a generic save()/findById() to bypass, so the extra indirection of a hand-written repository and package-private Spring Data interface would be pure cost with nothing to protect",
          "It's wrong, but only because the interface name should be OrderRepository",
          "It's wrong because JpaRepository should never be used in a Spring Boot application"
        ]}
        correctIndex={1}
        explanation="The Repository indirection exists to protect aggregate invariants that a generic save()/deleteById() could otherwise bypass -- exactly what was demonstrated with the Order aggregate's shipped-order-deletion bug. Product, as described, has no such invariants: nothing connects its fields, and no operation is illegal in some state and legal in another. Building six classes and three packages to protect nothing is the anti-pattern in the other direction -- as the cost section states, this pattern only pays for itself once there's a real invariant on the line."
      />
    </LessonLayout>
  );
}
