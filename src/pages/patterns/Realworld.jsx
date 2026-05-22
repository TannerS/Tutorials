import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function PatternsRealworld() {
  return (
    <LessonLayout
      title="Real-World Patterns"
      sectionId="patterns"
      lessonIndex={7}
      prev={{ path: "/patterns/proxy", label: "Proxy Pattern" }}
      next={{ path: "/react-antipatterns/intro", label: "React Anti-Patterns" }}
    >
      <p>In practice, design patterns rarely appear in isolation. Real applications combine multiple patterns to solve complex problems. This lesson walks through practical, production-grade examples where patterns work together.</p>

      <h2>E-Commerce Order System</h2>
      <p>A typical order processing flow combines Strategy (pricing), Builder (order construction), Observer (notifications), Command (undoable operations), and Decorator (order enrichment).</p>

      <CodeBlock language="java" title="Order System — Multiple Patterns">
{`// Strategy: pricing algorithm
public interface PricingStrategy {
    BigDecimal applyDiscount(BigDecimal price, Customer customer);
}
@Component class RegularPricing implements PricingStrategy {
    public BigDecimal applyDiscount(BigDecimal p, Customer c) { return p; }
    public String getType() { return "REGULAR"; }
}
@Component class VipPricing implements PricingStrategy {
    public BigDecimal applyDiscount(BigDecimal p, Customer c) {
        return p.multiply(BigDecimal.valueOf(0.85)); // 15% off
    }
    public String getType() { return "VIP"; }
}

// Builder: construct order
@Builder
public class Order {
    private final String id;
    private final String customerId;
    private final List<OrderLine> lines;
    private final BigDecimal total;
    private final OrderStatus status;
}

// Observer: notify on order events
public interface OrderEventListener {
    void onOrderPlaced(Order order);
}

@Component class EmailNotifier implements OrderEventListener {
    public void onOrderPlaced(Order o) {
        emailService.send(o.getCustomerEmail(), "Order confirmed: " + o.getId());
    }
}
@Component class InventoryReserver implements OrderEventListener {
    public void onOrderPlaced(Order o) {
        o.getLines().forEach(l -> inventory.reserve(l.getSku(), l.getQty()));
    }
}

// Service orchestrates everything
@Service
public class OrderService {
    private final Map<String, PricingStrategy> strategies;
    private final List<OrderEventListener> listeners;
    private final OrderRepository repo;

    public Order placeOrder(Cart cart, Customer customer) {
        PricingStrategy pricing = strategies.get(customer.getTier());
        BigDecimal total = cart.getLines().stream()
            .map(l -> pricing.applyDiscount(l.getTotal(), customer))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
            .id(UUID.randomUUID().toString())
            .customerId(customer.getId())
            .lines(cart.getLines())
            .total(total)
            .status(OrderStatus.PENDING)
            .build();

        repo.save(order);
        listeners.forEach(l -> l.onOrderPlaced(order)); // notify all observers
        return order;
    }
}`}
      </CodeBlock>

      <FlowChart
        title="Order Processing Pattern Flow"
        chart={"graph TD\n  A[Cart] --> B[OrderService]\n  B --> C[PricingStrategy]\n  B --> D[Order Builder]\n  D --> E[Order]\n  E --> F[Repository]\n  E --> G[EventPublisher]\n  G --> H[EmailNotifier]\n  G --> I[InventoryReserver]\n  G --> J[AnalyticsTracker]"}
      />

      <h2>Repository with Decorator Chain</h2>

      <CodeBlock language="java" title="Layered Repository Decorators">
{`// Base interface
public interface ProductRepository {
    Optional<Product> findById(String id);
    void save(Product product);
}

// JPA implementation
@Repository
class JpaProductRepository implements ProductRepository { ... }

// Caching decorator
class CachedProductRepository implements ProductRepository {
    private final ProductRepository delegate;
    private final Cache<String, Product> cache;
    // ...
}

// Audit decorator
class AuditingProductRepository implements ProductRepository {
    private final ProductRepository delegate;
    private final AuditLog auditLog;
    public void save(Product p) {
        auditLog.record("PRODUCT_SAVE", p.getId(), SecurityContext.getUser());
        delegate.save(p);
    }
    // ...
}

// Spring configuration wires them together
@Configuration
class RepositoryConfig {
    @Bean
    ProductRepository productRepository(JpaProductRepository jpa,
                                         Cache<String,Product> cache,
                                         AuditLog audit) {
        return new AuditingProductRepository(
                   new CachedProductRepository(jpa, cache),
                   audit);
    }
}`}
      </CodeBlock>

      <h2>Command Pattern for Undo/Redo</h2>

      <CodeBlock language="java" title="Command with Undo Stack">
{`public interface Command {
    void execute();
    void undo();
}

public class MoveItemCommand implements Command {
    private final CartService cart;
    private final String itemId;
    private final int fromQty, toQty;

    public MoveItemCommand(CartService cart, String itemId, int qty) {
        this.cart   = cart;
        this.itemId = itemId;
        this.fromQty = cart.getQuantity(itemId);
        this.toQty   = qty;
    }
    public void execute() { cart.setQuantity(itemId, toQty); }
    public void undo()    { cart.setQuantity(itemId, fromQty); }
}

// Command history manager
public class CommandHistory {
    private final Deque<Command> history = new ArrayDeque<>();
    private final Deque<Command> redoStack = new ArrayDeque<>();

    public void execute(Command cmd) {
        cmd.execute();
        history.push(cmd);
        redoStack.clear(); // new action clears redo stack
    }
    public void undo() {
        if (!history.isEmpty()) {
            Command cmd = history.pop();
            cmd.undo();
            redoStack.push(cmd);
        }
    }
    public void redo() {
        if (!redoStack.isEmpty()) {
            Command cmd = redoStack.pop();
            cmd.execute();
            history.push(cmd);
        }
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Pattern Combinations to Know">
        <p>Strategy + Factory: Factory creates the right Strategy. Decorator + Composite: Decorators wrap Composite leaves. Proxy + Singleton: The Proxy itself is a Singleton gateway. Observer + Command: Commands are queued and notify Observers on execution. These combinations are extremely common in production codebases.</p>
      </InfoBox>

      <InteractiveChallenge
        question="In the order system example, which pattern handles notifying the email service and inventory system when an order is placed?"
        options={["Strategy", "Builder", "Observer", "Decorator"]}
        correctIndex={2}
        explanation="Observer (also called Event Listener or Pub/Sub) handles broadcasting events to multiple interested parties. When an order is placed, the OrderService publishes the event and all registered OrderEventListeners (email, inventory, analytics) are notified automatically without the OrderService knowing about them specifically."
      />

    </LessonLayout>
  );
}
