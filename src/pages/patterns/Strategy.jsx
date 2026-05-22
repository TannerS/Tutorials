import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Strategy() {
  return (
    <LessonLayout
      title="Strategy & Observer Patterns"
      sectionId="patterns"
      lessonIndex={2}
      prev={{ path: '/patterns/singleton', label: 'Singleton & Factory' }}
      next={{ path: '/patterns/decorator', label: 'Decorator & Adapter' }}
    >
      <h2>Strategy Pattern</h2>
      <p>
        Defines a family of algorithms, encapsulates each one, and makes them interchangeable.
        Strategy lets the algorithm vary independently from clients that use it. This is one of
        the most frequently used patterns in enterprise Java.
      </p>

      <FlowChart
        title="Strategy Pattern Structure"
        chart={"graph TD\n  A[Context] --> B[Strategy Interface]\n  B --> C[ConcreteStrategyA]\n  B --> D[ConcreteStrategyB]\n  B --> E[ConcreteStrategyC]\n  A -->|\"delegates to\"| B"}
      />

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

      <InteractiveChallenge
        question="In the Strategy pattern, what is the main benefit of injecting a List<PaymentStrategy> in Spring?"
        options={[
          "It makes the code run faster due to parallel processing",
          "New strategies can be added without modifying the PaymentService class",
          "It allows multiple payments to be processed simultaneously",
          "It prevents null pointer exceptions in the payment flow"
        ]}
        correctIndex={1}
        explanation="This is the Open/Closed Principle (the 'O' in SOLID). The PaymentService is open for extension (add a new @Component implementing PaymentStrategy) but closed for modification (never need to change PaymentService itself). Spring auto-discovers and injects all implementations."
      />
    </LessonLayout>
  );
}
