import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Realworld() {
  return (
    <LessonLayout
      title="Real-World Pattern Applications"
      sectionId="patterns"
      lessonIndex={13}
      prev={{ path: '/patterns/flyweight', label: 'Flyweight & Interpreter' }}
      next={null}
    >
      <h2>Patterns in Enterprise Architecture</h2>
      <p>
        In real Spring Boot applications, patterns don't exist in isolation — they combine
        to form architectural layers. Understanding how they work together is what separates
        a senior developer from a junior one.
      </p>

      <FlowChart
        title="Layered Architecture - Patterns at Each Level"
        chart={"graph TD\n  A[Controller Layer] -->|DTO Pattern| B[Service Layer / Facade]\n  B -->|Strategy / Observer| C[Domain Logic]\n  C -->|Repository Pattern| D[Data Access Layer]\n  D -->|Adapter| E[Database / External APIs]\n  F[Spring AOP] -->|Proxy| A\n  F -->|Proxy| B\n  F -->|Proxy| D"}
      />

      <h2>Repository Pattern</h2>
      <p>
        Mediates between the domain and data mapping layers. It provides a collection-like
        interface for accessing domain objects, hiding the details of data access.
      </p>

      <CodeBlock language="java" title="Repository Pattern with Spring Data" showLineNumbers={true}>
{`// Domain entity
@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String email;
    private String name;
    private CustomerStatus status;
    private LocalDateTime createdAt;
}

// Repository interface - Spring generates implementation via Proxy
public interface CustomerRepository extends JpaRepository<Customer, String> {
    // Derived query methods
    Optional<Customer> findByEmail(String email);
    List<Customer> findByStatus(CustomerStatus status);

    // Custom query
    @Query("SELECT c FROM Customer c WHERE c.createdAt > :since AND c.status = :status")
    List<Customer> findRecentByStatus(
        @Param("since") LocalDateTime since,
        @Param("status") CustomerStatus status);
}

// Service layer uses repository - doesn't know about SQL/JPA internals
@Service
@Transactional(readOnly = true)
public class CustomerService {
    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    public CustomerDto getByEmail(String email) {
        return repository.findByEmail(email)
            .map(this::toDto)
            .orElseThrow(() -> new CustomerNotFoundException(email));
    }

    @Transactional
    public CustomerDto create(CreateCustomerRequest request) {
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException(request.getEmail());
        }

        Customer customer = new Customer();
        customer.setEmail(request.getEmail());
        customer.setName(request.getName());
        customer.setStatus(CustomerStatus.ACTIVE);
        customer.setCreatedAt(LocalDateTime.now());

        return toDto(repository.save(customer));
    }
}`}
      </CodeBlock>

      <h2>DTO Pattern &amp; Service Layer</h2>
      <p>
        The repository above solved persistence. This solves the opposite end: what the
        outside world is allowed to see. The block below is one request travelling through
        four types, and each one exists to stop a different kind of coupling.
      </p>
      <ul>
        <li>
          <strong>DTO</strong> — the wire shape. Returning the <code>@Entity</code> instead
          would publish your schema as your API, so a column rename becomes a breaking
          change, and lazy JPA associations serialize themselves into surprise queries (or
          throw) during response writing.
        </li>
        <li>
          <strong>Mapper</strong> — the one place entity and DTO know about each other. Keep
          it here and the translation is testable in isolation; spread it across controllers
          and every endpoint grows its own slightly-different version.
        </li>
        <li>
          <strong>Service</strong> — a <strong>Facade</strong>. The caller says
          &quot;place this order&quot;, not &quot;reserve stock, then charge, then save, in
          that order&quot;. This is also where <code>@Transactional</code> belongs, because
          the transaction boundary should be the business operation.
        </li>
        <li>
          <strong>Controller</strong> — deliberately thin: bind, validate, delegate, map a
          status code. Logic that drifts in here becomes unreachable from any other entry
          point, which is what makes a codebase hard to add a queue consumer or a CLI to
          later.
        </li>
      </ul>
      <p>
        Read it as one vertical slice rather than four classes — the point is the direction
        of the dependencies, which all run inward toward the service.
      </p>

      <CodeBlock language="java" title="DTO + Service + Controller - Full Stack" showLineNumbers={true}>
{`// DTO - what the API exposes (never expose entities directly!)
@Builder
@Value
public class OrderResponseDto {
    String orderId;
    String customerName;
    BigDecimal total;
    OrderStatus status;
    List<LineItemDto> items;
    LocalDateTime placedAt;
}

// Mapper - translates between layers
@Component
public class OrderMapper {
    public OrderResponseDto toDto(Order order) {
        return OrderResponseDto.builder()
            .orderId(order.getId())
            .customerName(order.getCustomer().getName())
            .total(order.calculateTotal())
            .status(order.getStatus())
            .items(order.getItems().stream()
                .map(this::toLineItemDto)
                .toList())
            .placedAt(order.getCreatedAt())
            .build();
    }

    private LineItemDto toLineItemDto(OrderItem item) {
        return new LineItemDto(
            item.getProduct().getName(),
            item.getQuantity(),
            item.getUnitPrice());
    }
}

// Service - orchestrates business logic (Facade pattern)
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepo;
    private final CustomerRepository customerRepo;
    private final OrderMapper mapper;
    private final List<OrderValidator> validators; // Strategy pattern
    private final ApplicationEventPublisher events; // Observer pattern

    @Transactional
    public OrderResponseDto placeOrder(PlaceOrderRequest request) {
        // Validate using strategy chain
        validators.forEach(v -> v.validate(request));

        Customer customer = customerRepo.findById(request.getCustomerId())
            .orElseThrow(() -> new NotFoundException("Customer not found"));

        Order order = Order.create(customer, request.getItems());
        order = orderRepo.save(order);

        // Publish event for observers
        events.publishEvent(new OrderPlacedEvent(order));

        return mapper.toDto(order);
    }
}

// Controller - thin, delegates everything to service
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponseDto placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        return orderService.placeOrder(request);
    }

    @GetMapping("/{id}")
    public OrderResponseDto getOrder(@PathVariable String id) {
        return orderService.getById(id);
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="How Spring Boot Uses Patterns Internally">
        <ul>
          <li><strong>Singleton</strong> — All beans are singleton-scoped by default</li>
          <li><strong>Factory</strong> — BeanFactory creates and manages beans</li>
          <li><strong>Proxy</strong> — AOP, @Transactional, @Cacheable, @Async</li>
          <li><strong>Template Method</strong> — JdbcTemplate, RestTemplate, JmsTemplate</li>
          <li><strong>Observer</strong> — ApplicationEventPublisher / @EventListener</li>
          <li><strong>Strategy</strong> — HandlerMapping, ViewResolver, AuthenticationProvider</li>
          <li><strong>Chain of Responsibility</strong> — Security Filter Chain</li>
          <li><strong>Adapter</strong> — HandlerAdapter for different controller types</li>
        </ul>
      </InfoBox>

      <h2>Event-Driven Architecture</h2>
      <p>
        The service above worked because it knew every step of placing an order. That stops
        scaling the moment the fifth team wants to react to a new order — each one needs a
        line inside <code>placeOrder</code>, so an unrelated feature keeps editing the same
        method and inherits its transaction and its failure modes.
      </p>
      <p>
        Inverting it fixes the direction of the dependency: the service announces{' '}
        <em>what happened</em> and knows nothing about who cares. Adding a consumer becomes
        adding a class. This is <strong>Observer</strong>, with Spring owning the registry
        and the events as immutable <code>record</code>s — past tense on purpose
        (<code>OrderPlacedEvent</code>, not <code>PlaceOrder</code>), because a listener
        reacting to a fact cannot veto it.
      </p>
      <p>
        The thing actually worth studying in the code is the{' '}
        <code>@TransactionalEventListener(phase = AFTER_COMMIT)</code> choice and the
        comments around it. Both the timing trap (a plain <code>@EventListener</code> plus{' '}
        <code>@Async</code> races the commit, so a listener can read a row that does not
        exist yet — or act on an order that is about to roll back) and the
        double-registration trap (stacking both annotations fires the listener twice) are
        the kind of bug that only shows up under load, in production.
      </p>

      <FlowChart
        title="Event-Driven Order Processing"
        chart={"graph LR\n  A[OrderController] --> B[OrderService]\n  B -->|publishes| C[OrderPlacedEvent]\n  C --> D[InventoryListener]\n  C --> E[PaymentListener]\n  C --> F[EmailListener]\n  C --> G[AnalyticsListener]\n  D -->|publishes| H[StockReservedEvent]\n  E -->|publishes| I[PaymentCapturedEvent]"}
      />

      <CodeBlock language="java" title="Event-Driven Architecture with Spring" showLineNumbers={true}>
{`// Domain events
public record OrderPlacedEvent(Order order, LocalDateTime timestamp) {}
public record PaymentCapturedEvent(String orderId, BigDecimal amount) {}
public record StockReservedEvent(String orderId, List<String> skus) {}

// Listeners - each handles one concern (Single Responsibility)
@Component
@RequiredArgsConstructor
public class InventoryEventListener {
    private final InventoryService inventory;
    private final ApplicationEventPublisher events;

    // @TransactionalEventListener is ITSELF meta-annotated with
    // @EventListener. Stacking both registers the listener TWICE, so
    // the method fires once immediately and again after commit --
    // reserving the stock twice. Use one or the other, never both.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onOrderPlaced(OrderPlacedEvent event) {
        Order order = event.order();
        order.getItems().forEach(item ->
            inventory.reserve(item.getSku(), item.getQuantity()));

        events.publishEvent(new StockReservedEvent(
            order.getId(),
            order.getItems().stream().map(OrderItem::getSku).toList()));
    }
}

@Component
@RequiredArgsConstructor
public class NotificationEventListener {
    private final EmailService emailService;

    // Also after-commit: a plain @EventListener + @Async would race the
    // publisher's transaction and could email a customer about an order
    // whose transaction then rolls back.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onOrderPlaced(OrderPlacedEvent event) {
        emailService.sendOrderConfirmation(
            event.order().getCustomer().getEmail(),
            event.order());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onPaymentCaptured(PaymentCapturedEvent event) {
        emailService.sendPaymentReceipt(event.orderId(), event.amount());
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Interview Tip: Combining Patterns">
        When asked "how would you design X?" in an interview, demonstrate how patterns work together:
        Controller (thin) → Service (Facade) → Domain (Strategy/Observer) → Repository (Adapter to DB).
        Show you understand the WHY, not just the structure.
      </InfoBox>

    </LessonLayout>
  );
}
