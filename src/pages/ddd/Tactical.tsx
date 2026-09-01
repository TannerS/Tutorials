import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function DddTactical() {
  return (
    <LessonLayout
      title="Tactical DDD: Entities, Value Objects & Aggregates"
      sectionId="ddd"
      lessonIndex={2}
      prev={{ path: '/ddd/strategic', label: 'Strategic DDD: Bounded Contexts & Context Mapping' }}
      next={{ path: '/ddd/domain-events', label: 'Domain Events & the Repository Pattern' }}
    >
      <p>
        Strategic DDD decides <strong>where</strong> a boundary goes — which bounded context owns
        &quot;Order,&quot; and how that context talks to its neighbors. Tactical DDD starts once that
        decision is already made: it is the set of patterns you use to model <em>inside</em> a single
        bounded context. None of what follows is new Java syntax — the OOP fundamentals lesson already
        covered classes, fields, and methods. What is new is a small, precise vocabulary for what a given
        class <em>is</em>, because &quot;is it a class with some fields&quot; is true of almost everything,
        and it is not a useful enough answer once a codebase has real invariants to protect.
      </p>

      <InfoBox variant="info" title="The Question Each Pattern Answers">
        <p><strong>Value Object</strong> — &quot;What are its attributes?&quot; Two with the same attributes are interchangeable.</p>
        <p><strong>Entity</strong> — &quot;What is its identity?&quot; Two with the same attributes but different identity are NOT interchangeable.</p>
        <p><strong>Aggregate</strong> — &quot;What is the consistency boundary?&quot; A cluster of Entities/Value Objects that must change together, correctly, or not at all.</p>
      </InfoBox>

      <h2>Value Objects: Defined Entirely by Value</h2>

      <p>
        A <strong>Value Object</strong> has no identity of its own — it is completely described by its
        attributes. Two Value Objects with the same field values are not &quot;similar,&quot; they are{' '}
        <strong>equal</strong>, full stop, even though they are two distinct objects sitting at two
        different memory addresses. Value Objects should also be immutable: instead of a{' '}
        <code>setAmount()</code> method, an operation like <code>add()</code> returns a brand-new instance.
        <code>Money</code> is the textbook example — a dollar amount plus a currency code, nothing else:
      </p>

      <CodeBlock language="java" title="Money.java — A Value Object">
{`import java.util.Objects;

public final class Money {
    private final long amount;      // whole currency units, kept simple for the demo
    private final String currency;  // ISO 4217 code

    public Money(long amount, String currency) {
        this.amount = amount;
        this.currency = currency;
    }

    public Money add(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("Cannot add " + other.currency + " to " + currency);
        }
        return new Money(this.amount + other.amount, this.currency); // NEW instance — never mutates
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money)) return false;
        Money other = (Money) o;
        return amount == other.amount && currency.equals(other.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);
    }
}`}
      </CodeBlock>

      <p>
        Everything hinges on <code>equals()</code> and <code>hashCode()</code> being overridden to compare
        fields instead of the default (reference-identity) behavior every Java object inherits from{' '}
        <code>Object</code>. Here is the proof, compiled and run for real — not a claim:
      </p>

      <CodeBlock language="java" title="MoneyDemo.java — Compiled and Run (real output in comments)">
{`public class MoneyDemo {
    public static void main(String[] args) {
        Money a = new Money(10, "USD");
        Money b = new Money(10, "USD");
        Money c = new Money(10, "EUR");

        System.out.println("a == b (same reference)?      " + (a == b));
        // a == b (same reference)?      false

        System.out.println("a.equals(b) (same value)?     " + a.equals(b));
        // a.equals(b) (same value)?     true

        System.out.println("a.equals(c) (diff currency)?  " + a.equals(c));
        // a.equals(c) (diff currency)?  false

        if (!a.equals(b)) {
            throw new AssertionError("FAILED: two Money value objects with identical fields must be equal");
        }
        System.out.println("ASSERTION PASSED: new Money(10, \\"USD\\").equals(new Money(10, \\"USD\\")) == true");
        // ASSERTION PASSED: new Money(10, "USD").equals(new Money(10, "USD")) == true
    }
}`}
      </CodeBlock>

      <p>
        <code>a</code> and <code>b</code> are two separate objects (<code>a == b</code> is{' '}
        <code>false</code> — different references) — but <code>a.equals(b)</code> is <code>true</code>{' '}
        because <code>equals()</code> was overridden to compare <code>amount</code> and{' '}
        <code>currency</code> instead of memory addresses. That is the entire definition of a Value
        Object: identity is irrelevant, value is everything.
      </p>

      <h2>Entities: Identity That Persists Through Change</h2>

      <p>
        An <strong>Entity</strong> is the mirror image: it has an identity — usually an ID field — that
        stays constant across its lifetime even as every other field changes. An <code>Order</code> that
        gets a line item added, then gets cancelled, then gets reopened, is still <em>the same order</em>{' '}
        the whole time, because &quot;the same order&quot; is defined by its ID, not by its current
        field values. Concretely, this means <code>equals()</code> on an Entity should compare{' '}
        <strong>only the ID</strong> — comparing every field, the way you naturally would for a Value
        Object, is one of the most common tactical-DDD mistakes, because it makes an entity stop being
        equal to its earlier self the moment anything about it changes.
      </p>

      <p>
        Here is the aggregate this lesson builds toward — <code>Order</code> as an Entity, plus a child{' '}
        <code>OrderLine</code> entity and an <code>OrderStatus</code> enum. Focus on the bottom of{' '}
        <code>Order</code> for now: <code>equals()</code> checks <code>id</code> alone.
      </p>

      <CodeBlock language="java" title="OrderLine.java — a child Entity, reached only through Order">
{`public final class OrderLine {
    private final String lineId;
    private final String product;
    private final int quantity;
    private final long unitPriceCents; // in a larger system, this would likely be a Money value object

    public OrderLine(String lineId, String product, int quantity, long unitPriceCents) {
        this.lineId = lineId;
        this.product = product;
        this.quantity = quantity;
        this.unitPriceCents = unitPriceCents;
    }

    public String getProduct() { return product; }
    public int getQuantity() { return quantity; }
    public long lineTotalCents() { return quantity * unitPriceCents; }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Order.java — the Entity (and, as the next section covers, the Aggregate Root)">
{`import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public final class Order {
    private final String id;
    private OrderStatus status;
    private final List<OrderLine> lines = new ArrayList<>();
    private int nextLineId = 1;

    public Order(String id, OrderStatus status) {
        this.id = id;
        this.status = status;
    }

    public String getId() { return id; }
    public OrderStatus getStatus() { return status; }
    public List<OrderLine> getLines() { return Collections.unmodifiableList(lines); }
    public long totalCents() { return lines.stream().mapToLong(OrderLine::lineTotalCents).sum(); }

    public void cancel() {
        this.status = OrderStatus.CANCELLED;
    }

    public void addLine(String product, int quantity, long unitPriceCents) {
        if (status == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot add a line to order " + id + " — it is CANCELLED");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive, got " + quantity);
        }
        lines.add(new OrderLine("line-" + (nextLineId++), product, quantity, unitPriceCents));
    }

    // --- Identity-based equality: the defining trait of an Entity ---
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order)) return false;
        Order other = (Order) o;
        return id.equals(other.id); // fields are NOT part of equality — only id is
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Order{id=" + id + ", status=" + status + ", lines=" + lines.size() + ", total=" + totalCents() + "c}";
    }
}`}
      </CodeBlock>

      <p>
        Two scenarios prove the point: the <strong>same</strong> ID with different field values must
        stay equal, and <strong>different</strong> IDs with identical field values must stay unequal.
        Compiled and run, real output in the comments:
      </p>

      <CodeBlock language="java" title="OrderIdentityDemo.java — Compiled and Run (real output in comments)">
{`public class OrderIdentityDemo {
    public static void main(String[] args) {
        // Same ID, read at two different points in time — simulating the same
        // order loaded from a database before and after it changed.
        Order beforeShipping = new Order("order-42", OrderStatus.OPEN);
        beforeShipping.addLine("Keyboard", 1, 5000);

        Order afterShipping = new Order("order-42", OrderStatus.OPEN);
        afterShipping.addLine("Keyboard", 1, 5000);
        afterShipping.addLine("Mouse", 1, 2500);
        afterShipping.cancel();

        System.out.println(beforeShipping.equals(afterShipping));
        // true — same id, wildly different fields (status, line count, total)

        // Different IDs, but identical fields.
        Order orderA = new Order("order-100", OrderStatus.OPEN);
        orderA.addLine("Widget", 2, 500);

        Order orderB = new Order("order-200", OrderStatus.OPEN);
        orderB.addLine("Widget", 2, 500);

        System.out.println(orderA.equals(orderB));
        // false — identical fields, but different id

        if (!beforeShipping.equals(afterShipping) || orderA.equals(orderB)) {
            throw new AssertionError("FAILED");
        }
        System.out.println("ASSERTIONS PASSED: identity (id), not field values, determines Entity equality.");
        // ASSERTIONS PASSED: identity (id), not field values, determines Entity equality.
    }
}`}
      </CodeBlock>

      <p>
        That first result is easy to find counterintuitive if you are used to value-based{' '}
        <code>equals()</code>: <code>beforeShipping</code> and <code>afterShipping</code> disagree on
        status, line count, and total, and <code>equals()</code> still says <code>true</code>. That is
        correct — they represent the same order at two moments, and &quot;same order, different
        moment&quot; is exactly what Entity identity is for.
      </p>

      <h2>Aggregates &amp; Aggregate Roots: The Consistency Boundary</h2>

      <p>
        An <strong>Aggregate</strong> is a cluster of Entities and Value Objects that must stay
        consistent as a unit — <code>Order</code> and its <code>OrderLine</code>s only make sense
        together; a total computed from lines that no longer belong to the order they claim to belong to
        is a data-integrity bug waiting to happen. The <strong>Aggregate Root</strong> is the single
        Entity in that cluster that external code is allowed to hold a reference to. Everything else in
        the cluster is reached <em>only</em> by going through the root, and the root is where every
        invariant for the whole cluster gets enforced.
      </p>

      <FlowChart
        title="The Aggregate Boundary: One Way In"
        chart={"graph TD\n  Client[\"External code<br/>(a Controller, another Aggregate)\"] -->|\"only entry point\"| Root\n  subgraph Boundary [\"Order Aggregate — consistency boundary\"]\n    Root[\"Order<br/>(Aggregate Root)\"]\n    L1[\"OrderLine<br/>(child Entity)\"]\n    L2[\"OrderLine<br/>(child Entity)\"]\n    Root --> L1\n    Root --> L2\n  end\n  Client -.->|\"no direct access\"| L1\n  Client -.->|\"no direct access\"| L2\n  style Root fill:#1a2744,stroke:#5b9cf6\n  style Boundary stroke-dasharray: 5 5"}
      />

      <p>
        That dashed line is the consistency boundary made visible: <code>Order</code> is the only
        node external code ever holds a reference to (the solid arrow). The two <code>OrderLine</code>{' '}
        children exist only inside the boundary — nothing outside <code>Order</code> is allowed to
        reach in and grab one directly (the dotted, crossed-out arrows), which is exactly what{' '}
        <code>getLines()</code> returning an unmodifiable view enforces below.
      </p>

      <p>
        The <code>Order.addLine()</code> method above is not incidental plumbing — it is the invariant
        enforcement point. A lone <code>OrderLine</code> object has no way to know the order's status or
        see its sibling lines, so it physically cannot enforce &quot;no lines on a cancelled order&quot;
        by itself. Only the aggregate root, which can see the whole cluster, can. Run it against both an
        invalid and a valid case:
      </p>

      <CodeBlock language="java" title="OrderInvariantDemo.java — Compiled and Run (real output in comments)">
{`public class OrderInvariantDemo {
    public static void main(String[] args) {
        // 1. Valid: adding a line to an OPEN order succeeds.
        Order order = new Order("order-9", OrderStatus.OPEN);
        order.addLine("Monitor", 2, 15000);
        System.out.println(order);
        // Order{id=order-9, status=OPEN, lines=1, total=30000c}

        // 2. Cancel it, then try to add another line.
        order.cancel();
        try {
            order.addLine("Webcam", 1, 4000);
        } catch (IllegalStateException e) {
            System.out.println("Caught: " + e.getMessage());
            // Caught: Cannot add a line to order order-9 — it is CANCELLED
        }

        // 3. A second invariant: quantity must be positive, even on an open order.
        Order order2 = new Order("order-10", OrderStatus.OPEN);
        try {
            order2.addLine("Cable", 0, 999);
        } catch (IllegalArgumentException e) {
            System.out.println("Caught: " + e.getMessage());
            // Caught: Quantity must be positive, got 0
        }

        System.out.println(order);
        // Order{id=order-9, status=CANCELLED, lines=1, total=30000c} — unchanged by the rejected call
    }
}`}
      </CodeBlock>

      <p>
        The rejected calls throw <em>before</em> touching <code>lines</code>, so <code>order</code>&apos;s
        state after the failed <code>addLine()</code> is identical to before it — the invariant protects
        the aggregate rather than leaving it half-mutated. And the boundary is not just a naming
        convention: <code>getLines()</code> returns <code>Collections.unmodifiableList(lines)</code>, so
        code outside <code>Order</code> cannot bypass <code>addLine()</code> and splice in a line by hand.
        Confirmed by running it:
      </p>

      <CodeBlock language="java" title="BoundaryDemo.java — Compiled and Run (real output in comment)">
{`List<OrderLine> lines = order.getLines();
lines.add(new OrderLine("hack-1", "Smuggled Item", 1, 1));
// throws java.lang.UnsupportedOperationException
// — getLines() returns a read-only view; the only way in is order.addLine()`}
      </CodeBlock>

      <InfoBox variant="warning" title="Every Aggregate Root Is an Entity. Not Every Entity Is a Root.">
        <p>
          <code>Order</code> is both an Entity (it has identity via <code>id</code>) and the Aggregate
          Root (external code is allowed to hold a reference to it directly).{' '}
          <code>OrderLine</code> is <em>also</em> an Entity — it has its own <code>lineId</code> — but it
          is deliberately <strong>not</strong> a root. Nothing outside <code>Order</code> should hold a
          bare <code>OrderLine</code> reference or call a repository method that fetches one directly.
          The rule is about designated access, not about which classes technically have identity: a
          child Entity only becomes reachable by first going through its aggregate root.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"Two Order objects both have id = \"order-42\". orderBefore has status OPEN and 1 line item (loaded from the database this morning). orderAfter has status CANCELLED and 2 line items (loaded this afternoon, after changes were made). Using the Entity-style equals() from this lesson (based on id only), what does orderBefore.equals(orderAfter) return, and why?"}
        options={[
          "false — their status and line counts are different, so they can't be equal",
          "true — they share the same id, and Entity equality is identity-based, not field-based, so it doesn't matter that the fields changed between the two reads",
          "It throws an exception, because equals() can't compare objects in different states",
          "true, but only because line count doesn't matter — status changing would make it false"
        ]}
        correctIndex={1}
        explanation={"Entities are defined by identity, not by their current attribute values. orderBefore and orderAfter represent the same order at two different moments — exactly the scenario Entity semantics exist for. If equals() compared fields (the way it correctly does for a Value Object), an order would stop being 'equal to itself' the instant any field changed, which breaks things like re-fetching an order from a repository and expecting it to match a cached reference. The OrderIdentityDemo above proves this: identical id, completely different fields, equals() still returns true."}
      />
    </LessonLayout>
  );
}
