import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Realworld() {
  return (
    <LessonLayout
      title="Real-World Pattern Applications"
      sectionId="patterns"
      lessonIndex={7}
      prev={{ path: '/patterns/proxy', label: 'Proxy & Chain of Responsibility' }}
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

    @EventListener
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
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

    @EventListener
    @Async
    public void onOrderPlaced(OrderPlacedEvent event) {
        emailService.sendOrderConfirmation(
            event.order().getCustomer().getEmail(),
            event.order());
    }

    @EventListener
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

      <InteractiveChallenge
        question="Why should you NEVER expose JPA entities directly in your REST API responses?"
        options={[
          "JPA entities are too slow to serialize",
          "Entities may expose sensitive fields, create circular references, and couple your API contract to your database schema",
          "Spring Boot doesn't support serializing entities to JSON",
          "Entities can only be used within @Transactional methods"
        ]}
        correctIndex={1}
        explanation="Exposing entities directly means: (1) database schema changes break your API, (2) lazy-loaded relationships cause N+1 queries or LazyInitializationExceptions, (3) sensitive fields (passwords, internal IDs) leak to clients, (4) bidirectional relationships cause infinite JSON recursion. DTOs decouple your API contract from your persistence model."
      />
    </LessonLayout>
  );
}
