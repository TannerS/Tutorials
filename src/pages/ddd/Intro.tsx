import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function DddIntro() {
  return (
    <LessonLayout
      title="Why Domain-Driven Design"
      sectionId="ddd"
      lessonIndex={0}
      prev={null}
      next={{ path: '/ddd/strategic', label: 'Strategic DDD: Bounded Contexts & Context Mapping' }}
    >
      <p>
        Every codebase starts clean. Six months in, the <code>OrderService</code> has grown a
        400-line method, the domain classes underneath it are just getters and setters, and nobody
        can say with confidence what &quot;customer&quot; means without opening three different
        files to check. Domain-Driven Design (DDD) is not a framework or a library — it is a
        discipline for keeping a codebase's model of the business aligned with the business itself,
        specifically so that this drift does not happen as the system grows.
      </p>

      <h2>The Drift: Rich Models Rotting Into Data Bags</h2>

      <p>
        The most common failure mode has a name: the <strong>anemic domain model</strong>. It starts
        innocently — a developer adds &quot;just one&quot; piece of logic to a service class instead
        of the entity it belongs to, because the service already has the data loaded and it&apos;s
        faster than teaching the entity a new method. Repeat that decision for a year and the entity
        has degraded into a bag of fields, and every rule the business actually cares about lives in
        a service method that has to be traced line by line to understand.
      </p>

      <CodeBlock language="java" title="Before: Behavior Lives on the Domain Object">
{`public class Order {
    private List<LineItem> items;
    private OrderStatus status;
    private LocalDate placedOn;

    public Money calculateTotal() {
        return items.stream()
            .map(LineItem::subtotal)
            .reduce(Money.ZERO, Money::add);
    }

    public void applyDiscount(Discount discount) {
        if (status != OrderStatus.PLACED) {
            throw new IllegalStateException("Cannot discount a " + status + " order");
        }
        this.items = discount.applyTo(items);
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="After Two Years of Drift: Order Is Just Storage">
{`public class Order {
    private List<LineItem> items;
    private OrderStatus status;
    private LocalDate placedOn;
    // ... twelve getters, twelve setters, no behavior
}

public class OrderService {
    // 40 lines of nested conditionals that used to be applyDiscount(),
    // now duplicated with slight variations in three other service methods
    // because nobody could find the original rule to reuse it.
    public void applyDiscountToOrder(Long orderId, Long discountId) {
        Order order = orderRepository.findById(orderId);
        Discount discount = discountRepository.findById(discountId);
        if (order.getStatus() != OrderStatus.PLACED) {
            throw new IllegalStateException("Cannot discount a " + order.getStatus() + " order");
        }
        // ... the actual discount math, reimplemented here instead of called
        order.setItems(recalculatedItems);
        orderRepository.save(order);
    }
}`}
      </CodeBlock>

      <p>
        Nothing in the &quot;after&quot; version is a bug on its own — it compiles, it passes its
        tests, it ships. The cost shows up later: the discount rule now exists in one place per
        caller instead of one place total, and each copy drifts slightly from the others every time
        someone fixes it in only one spot. DDD&apos;s response to this is not &quot;write more
        unit tests.&quot; It is to keep behavior on the object that owns the concept, which requires
        the team to agree — precisely — on what that object <em>means</em>.
      </p>

      <h2>Ubiquitous Language: No Translation Layer</h2>

      <p>
        That agreement is what Eric Evans calls the <strong>ubiquitous language</strong>: the
        discipline of using the exact same term, with the exact same meaning, in the code, in
        conversation with the domain experts, and in the documentation. Not a business glossary that
        gets translated into different variable names during implementation — the literal same word,
        everywhere. If the domain expert says &quot;chargeback&quot; and the code has a class called
        <code> PaymentReversal</code>, that gap is not a naming preference, it is a bug waiting to
        surface the first time a new developer has to map one word to the other under time pressure.
      </p>

      <p>
        The discipline matters most exactly where it feels unnecessary: when a word seems obvious.
        &quot;Customer&quot; is the textbook case. Say a marketing team wants to email everyone who
        abandoned a cart, and a finance team needs a list of everyone with a completed, paid order.
        Both teams say &quot;customer.&quot; A codebase with a single, sprawling <code>Customer</code>{' '}
        entity is quietly assuming those are the same thing:
      </p>

      <CodeBlock language="java" title="One Customer Class Pretending Two Concepts Are One">
{`public class Customer {
    private String email;
    private String name;
    private Cart abandonedCart;       // null unless they walked away mid-checkout
    private List<Order> paidOrders;   // empty unless they've actually bought something
    private PaymentMethod billingInfo; // only meaningful once an order exists

    public boolean isAbandonedCart() {
        return abandonedCart != null && paidOrders.isEmpty();
    }

    public boolean isPayingCustomer() {
        return !paidOrders.isEmpty();
    }
}`}
      </CodeBlock>

      <p>
        Every field on this class is conditionally meaningless depending on which kind of
        &quot;customer&quot; the row represents, and every consumer of it has to know which
        <code>is*()</code> guard to check before touching which field. Ubiquitous language does not
        let this stay implicit — it forces the team to ask the domain experts directly: is a person
        who abandoned a cart the same business concept as a person with a paid order? In most retail
        businesses, the honest answer is no. They&apos;re tracked differently, they trigger different
        workflows, and conflating them into one class is exactly the ambiguity DDD is designed to
        surface. The next lesson (<strong>Strategic DDD</strong>) covers the formal tool for
        resolving this — a <strong>Bounded Context</strong> — but the first move is simpler and
        happens before any diagramming: stop building software using words that nobody stopped to
        define.
      </p>

      <InfoBox variant="info" title="Ubiquitous Language, Precisely">
        <p>
          A shared vocabulary used identically in three places at once: the code (class and method
          names), the conversation with domain experts, and the documentation. There is no
          translation step between &quot;what the business calls it&quot; and &quot;what the
          variable is named.&quot; When those diverge, every conversation between a developer and a
          domain expert requires a mental round-trip through a private dictionary — and that
          round-trip is where requirements get lost.
        </p>
      </InfoBox>

      <h2>Where the Term Comes From</h2>

      <p>
        Eric Evans coined &quot;Domain-Driven Design&quot; as the title of his 2003 book{' '}
        <em>Domain-Driven Design: Tackling Complexity in the Heart of Software</em> (Addison-Wesley).
        The book&apos;s central argument is that software projects fail less often because of
        technical mistakes and more often because of a communication breakdown between the people
        who understand the business problem and the people writing the code — and that the fix is to
        put the shared model, not the database schema or the class diagram, at the center of the
        design process.
      </p>

      <h2>DDD Is a Modeling Discipline First</h2>

      <p>
        It is easy to meet DDD backwards — through a list of code-level patterns like Entity, Value
        Object, and Aggregate, and to conclude that DDD <em>is</em> those patterns. It isn&apos;t.
        Those are <strong>tactical</strong> patterns, covered in the next-but-one lesson (
        <strong>Tactical DDD</strong>), and they are secondary — implementation tools you reach for
        <em> after</em> the modeling work is done. The actual discipline is upstream of any code at
        all: sitting with domain experts, building a shared vocabulary, and identifying where that
        vocabulary legitimately changes meaning across the organization (the subject of the next
        lesson, <strong>Strategic DDD</strong>). A codebase can use Entities and Aggregates
        correctly and still not be doing DDD, if the model those classes represent was never
        validated against how the business actually thinks. The tactical patterns make a good model
        easier to keep clean in code; they cannot manufacture a good model on their own.
      </p>

      <h2>When It&apos;s Worth the Overhead</h2>

      <p>
        DDD costs something real: time spent in modeling sessions with domain experts, and code that
        is sometimes more indirect than the shortest path to a working feature. That cost is not
        always worth paying.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Your situation&hellip;</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>DDD?</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>A core domain with real behavioral nuance — pricing rules, underwriting, scheduling with conflicting constraints</td>
            <td style={{ padding: '0.75rem' }}><strong>Worth it</strong></td>
            <td style={{ padding: '0.75rem' }}>Complexity is inherent to the business, not the code — a rich model earns its keep by making that complexity explicit and testable</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Domain experts and engineers routinely discover they meant different things by the same word</td>
            <td style={{ padding: '0.75rem' }}><strong>Worth it</strong></td>
            <td style={{ padding: '0.75rem' }}>That gap is exactly the failure mode ubiquitous language is designed to catch early instead of in production</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>An admin panel or internal CRUD tool with no real business rules — create/read/update/delete and little else</td>
            <td style={{ padding: '0.75rem' }}><strong>Skip it</strong></td>
            <td style={{ padding: '0.75rem' }}>There is no meaningful domain complexity to model — DDD&apos;s ceremony has nothing to pay for itself with</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>A thin integration service that just forwards and reshapes data between two other systems</td>
            <td style={{ padding: '0.75rem' }}><strong>Skip it</strong></td>
            <td style={{ padding: '0.75rem' }}>The &quot;domain&quot; here is a data contract, not a business concept with rules — the wiring belongs to the systems on either end</td>
          </tr>
        </tbody>
      </table>

      <p>
        The honest version of this lesson is not &quot;always do DDD.&quot; It&apos;s: apply it where
        the domain is genuinely complex and getting the vocabulary wrong has a real cost, and don&apos;t
        apply it to the parts of the system that are just plumbing. The next lesson picks up exactly
        where the <code>Customer</code> example left off — how to formalize &quot;this word means
        something different over here&quot; instead of pretending it doesn&apos;t.
      </p>

      <InteractiveChallenge
        question={"A codebase has OrderService.applyDiscountToOrder() containing 40 lines of business rules, while the Order class itself has only getters and setters. According to DDD, what does this indicate, and what's the correct fix?"}
        options={[
          "This is a healthy layered architecture — services should own logic, entities should stay pure data. No change needed.",
          "This is an anemic domain model: behavior has drained out of the domain object into a service. The fix is to move logic that's intrinsically about an Order (like applying a discount) back onto Order or a close collaborator — not to keep adding it to more services.",
          "The method name is unclear; renaming applyDiscountToOrder() to a more descriptive name resolves the issue.",
          "DDD requires removing OrderService entirely and replacing all business logic with database stored procedures."
        ]}
        correctIndex={1}
        explanation={"An anemic domain model is what happens when every entity becomes a pure data holder and all behavior is externalized into services. It compiles and passes tests, but the same rule tends to get reimplemented slightly differently by every caller, since there's no single owned method to call. DDD's fix isn't 'no services' — domain services are a legitimate tactical pattern for behavior that doesn't belong to one entity — it's putting behavior back on the object whose concept it actually describes, so there's one place the rule lives and one place to fix it."}
      />
    </LessonLayout>
  );
}
