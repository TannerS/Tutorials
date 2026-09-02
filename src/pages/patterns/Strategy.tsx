import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Strategy() {
  return (
    <LessonLayout
      title="Strategy & Observer Patterns"
      sectionId="patterns"
      lessonIndex={3}
      prev={{ path: '/patterns/abstract-factory', label: 'Abstract Factory' }}
      next={{ path: '/patterns/decorator', label: 'Decorator & Adapter' }}
    >
      <h2>Strategy Pattern</h2>
      <p>
        Defines a family of algorithms, encapsulates each one, and makes them interchangeable.
        Strategy lets the algorithm vary independently from clients that use it. This is one of
        the most frequently used patterns in enterprise Java.
      </p>

      <h3>First, the Code That Hurts</h3>
      <p>
        Strategy is easiest to understand as the answer to a specific, very common kind of pain,
        so it is worth meeting that pain first. Here is a payment service after eighteen months of
        &quot;just add one more payment method&quot; tickets:
      </p>

      <CodeBlock language="java" title="The Version You Actually Inherit" showLineNumbers={true}>
{`@Service
public class PaymentService {

    public PaymentResult pay(Order order) {
        if (order.getPaymentMethod() == PaymentMethod.CREDIT_CARD) {
            String token = gateway.tokenize(order.getCardDetails());
            return gateway.charge(token, order.getTotal());

        } else if (order.getPaymentMethod() == PaymentMethod.PAYPAL) {
            return paypalClient.executePayment(
                order.getPaypalToken(), order.getTotal());

        } else if (order.getPaymentMethod() == PaymentMethod.APPLE_PAY) {
            var decrypted = applePayDecryptor.decrypt(order.getApplePayBlob());
            return gateway.charge(decrypted.token(), order.getTotal());

        } else if (order.getPaymentMethod() == PaymentMethod.KLARNA) {
            var session = klarnaClient.createSession(order);
            return klarnaClient.authorize(session, order.getTotal());

        } // ...and four more branches below this one

        throw new UnsupportedPaymentException(order.getPaymentMethod());
    }
}`}
      </CodeBlock>

      <p>
        Nothing here is <em>wrong</em>, which is exactly why it survives code review the first
        three times. The problems are structural, and they compound:
      </p>
      <ul>
        <li>
          <strong>One class now has every payment team&apos;s dependencies.</strong> The
          constructor needs a card gateway, a PayPal client, an Apple Pay decryptor, and a Klarna
          client — so a unit test of the PayPal branch still has to construct or mock all four.
        </li>
        <li>
          <strong>Every new method edits a file four teams share.</strong> Adding Klarna meant
          touching the same method that handles credit cards, and the credit-card path is the one
          that must never break.
        </li>
        <li>
          <strong>The branches drift.</strong> One adds retry logic, another adds a metrics
          counter, a third forgets both, and the inconsistency is invisible because it is spread
          down a 200-line method.
        </li>
      </ul>
      <p>
        Notice what varies and what doesn&apos;t: the <em>selection</em> (&quot;which method did
        the customer choose?&quot;) is identical every time, while the <em>algorithm</em> behind
        each branch is entirely different. That split — one stable question, many interchangeable
        answers — is precisely the seam Strategy cuts along. Each branch becomes its own class,
        and the if-chain becomes a lookup.
      </p>

      <FlowChart
        title="Strategy Pattern Structure"
        chart={"graph TD\n  A[Context] --> B[Strategy Interface]\n  B --> C[ConcreteStrategyA]\n  B --> D[ConcreteStrategyB]\n  B --> E[ConcreteStrategyC]\n  A -->|\"delegates to\"| B"}
      />

      <p>
        Here is the same feature after the cut. Read it against the three problems above: each
        strategy now carries only <em>its own</em> dependency, so testing the PayPal path
        constructs one class with one mock; adding Klarna adds a file instead of editing the
        credit-card path; and the shared concerns (selection, the &quot;unsupported&quot; error)
        live in exactly one place where they cannot drift.
      </p>

      <CodeBlock language="java" title="Strategy Pattern - Payment Processing" showLineNumbers={true}>
{`// Strategy interface
public interface PaymentStrategy {
    PaymentResult process(Order order);
    boolean supports(PaymentMethod method);
}

// Concrete strategies
@Component
public class CreditCardStrategy implements PaymentStrategy {
    private final PaymentGateway gateway;

    public CreditCardStrategy(PaymentGateway gateway) {
        this.gateway = gateway;
    }

    @Override
    public PaymentResult process(Order order) {
        String token = gateway.tokenize(order.getCardDetails());
        return gateway.charge(token, order.getTotal());
    }

    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.CREDIT_CARD;
    }
}

@Component
public class PayPalStrategy implements PaymentStrategy {
    private final PayPalClient client;

    public PayPalStrategy(PayPalClient client) {
        this.client = client;
    }

    @Override
    public PaymentResult process(Order order) {
        return client.executePayment(order.getPaypalToken(), order.getTotal());
    }

    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.PAYPAL;
    }
}

// Context - selects strategy at runtime
@Service
public class PaymentService {
    private final List<PaymentStrategy> strategies;

    public PaymentService(List<PaymentStrategy> strategies) {
        this.strategies = strategies; // Spring injects all implementations
    }

    public PaymentResult pay(Order order) {
        return strategies.stream()
            .filter(s -> s.supports(order.getPaymentMethod()))
            .findFirst()
            .orElseThrow(() -> new UnsupportedPaymentException(
                order.getPaymentMethod()))
            .process(order);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Strategy + Spring DI">
        In Spring Boot, you can inject a List of all Strategy implementations automatically.
        This means adding a new payment method only requires creating a new class annotated with
        @Component — zero changes to existing code. This is the Open/Closed Principle in action.
      </InfoBox>

      <InfoBox variant="tip" title="When to Reach for Strategy">
        Strategy earns its keep when you already have (or expect to keep adding) multiple
        interchangeable ways to do the same job — payment methods, discount/pricing rules, sort
        orders, auth providers. The tell-tale sign it's needed is a growing if/else or switch
        chain on a "type" field, especially one that gets a new branch every few months from a
        different team. If you genuinely have one algorithm and no credible second one coming,
        skip it — a plain method is simpler than a one-implementation Strategy interface, and you
        can always extract the interface later when a second implementation actually shows up.
      </InfoBox>

      <h2>Observer Pattern</h2>
      <p>
        Defines a one-to-many dependency between objects so that when one object changes state,
        all its dependents are notified automatically. This is the foundation of event-driven
        architecture and reactive programming.
      </p>

      <FlowChart
        title="Observer Pattern Structure"
        chart={"graph LR\n  A[Subject/Publisher] -->|notifies| B[Observer 1]\n  A -->|notifies| C[Observer 2]\n  A -->|notifies| D[Observer 3]\n  E[Event Source] -->|state change| A"}
      />

      <CodeBlock language="java" title="Observer Pattern - Order Event System" showLineNumbers={true}>
{`// Event class
public class OrderEvent {
    private final Order order;
    private final OrderStatus newStatus;
    private final LocalDateTime timestamp;

    public OrderEvent(Order order, OrderStatus newStatus) {
        this.order = order;
        this.newStatus = newStatus;
        this.timestamp = LocalDateTime.now();
    }
    // getters...
}

// Observer interface
public interface OrderEventListener {
    void onOrderEvent(OrderEvent event);
}

// Concrete observers
@Component
public class EmailNotifier implements OrderEventListener {
    @Override
    public void onOrderEvent(OrderEvent event) {
        if (event.getNewStatus() == OrderStatus.SHIPPED) {
            emailService.sendShippingNotification(
                event.getOrder().getCustomerEmail(),
                event.getOrder().getTrackingNumber()
            );
        }
    }
}

@Component
public class InventoryUpdater implements OrderEventListener {
    @Override
    public void onOrderEvent(OrderEvent event) {
        if (event.getNewStatus() == OrderStatus.CONFIRMED) {
            event.getOrder().getItems().forEach(item ->
                inventoryService.decrementStock(item.getSku(), item.getQty())
            );
        }
    }
}

@Component
public class AnalyticsTracker implements OrderEventListener {
    @Override
    public void onOrderEvent(OrderEvent event) {
        metricsService.recordOrderTransition(
            event.getOrder().getId(),
            event.getNewStatus(),
            event.getTimestamp()
        );
    }
}

// Subject/Publisher
@Service
public class OrderService {
    private final List<OrderEventListener> listeners;
    private final OrderRepository repository;

    public OrderService(List<OrderEventListener> listeners,
                       OrderRepository repository) {
        this.listeners = listeners;
        this.repository = repository;
    }

    public void updateStatus(Long orderId, OrderStatus newStatus) {
        Order order = repository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
        order.setStatus(newStatus);
        repository.save(order);

        // Notify all observers
        OrderEvent event = new OrderEvent(order, newStatus);
        listeners.forEach(listener -> listener.onOrderEvent(event));
    }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Spring's Built-in Event System">
        Spring provides ApplicationEventPublisher and @EventListener for a more decoupled
        implementation. You don't even need to define your own listener interface — just annotate
        methods with @EventListener and Spring handles the wiring automatically.
      </InfoBox>

      <CodeBlock language="java" title="Spring Events - Modern Observer" showLineNumbers={true}>
{`// Using Spring's built-in event system
@Service
public class OrderService {
    private final ApplicationEventPublisher eventPublisher;

    public void updateStatus(Long orderId, OrderStatus newStatus) {
        Order order = repository.findById(orderId).orElseThrow();
        order.setStatus(newStatus);
        repository.save(order);

        // Publish event - Spring routes it to all @EventListener methods
        eventPublisher.publishEvent(new OrderEvent(order, newStatus));
    }
}

// Any component can listen - fully decoupled
@Component
public class ShippingListener {
    @EventListener
    @Async  // Non-blocking - runs in separate thread
    public void handleShipped(OrderEvent event) {
        if (event.getNewStatus() == OrderStatus.SHIPPED) {
            shippingService.scheduleDelivery(event.getOrder());
        }
    }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Two Traps in Spring's Event System">
        <p>
          <strong>1. <code>publishEvent()</code> is synchronous by default.</strong> Without{' '}
          <code>@Async</code> the listener runs on the calling thread, inside the caller&apos;s
          transaction, and a listener that throws will <em>roll back the publisher&apos;s
          transaction</em>. That surprises people who assumed &quot;publishing an event&quot; meant
          fire-and-forget.
        </p>
        <p>
          <strong>2. <code>@Async</code> alone creates a race with the transaction.</strong> Adding{' '}
          <code>@Async</code> fixes the blocking, but now the listener runs on another thread{' '}
          <em>before the publisher&apos;s transaction has committed</em>. The listener queries the
          database for the order it was just told about — and does not find it. This is one of the most
          common intermittent bugs in Spring codebases, and it only shows up under load.
        </p>
        <p>
          <strong>The fix is <code>@TransactionalEventListener</code></strong>, which defers delivery
          until the transaction actually commits:
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Publish-After-Commit — the Correct Default" showLineNumbers={true}>
{`@Component
public class ShippingListener {

    // AFTER_COMMIT is the default phase: the listener only runs once
    // the publisher's transaction has successfully committed, so the
    // data it was told about is guaranteed to be visible.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleShipped(OrderEvent event) {
        shippingService.scheduleDelivery(event.getOrder());
    }
}

// Consequences worth knowing:
//  - If the transaction ROLLS BACK, the listener never fires. Usually
//    what you want: no email about an order that does not exist.
//  - After commit you are outside the transaction, so writes here need
//    their own (REQUIRES_NEW), and a failure cannot undo the commit.
//    If the side effect MUST happen, an event listener is the wrong
//    tool — use the transactional outbox pattern instead.`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Reach for Observer">
        Reach for Observer when one event needs to trigger several independent side effects that
        shouldn't block each other or know about each other — an order being placed should update
        inventory, send an email, and record analytics, but the checkout flow shouldn't fail (or
        even slow down) because the analytics service is having a bad day. That's exactly what
        <code>@Async @EventListener</code> buys you above. Avoid it for a single, tightly-coupled
        reaction that's really just "step 2 of this workflow" — publishing an event for something
        only one caller will ever handle just hides a direct method call behind indirection,
        making the code harder to trace for no real benefit.
      </InfoBox>

    </LessonLayout>
  );
}
