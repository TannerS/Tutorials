import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SolidDip() {
  return (
    <LessonLayout
      title="Dependency Inversion Principle"
      sectionId="solid"
      lessonIndex={5}
      prev={{ path: '/solid/isp', label: 'Interface Segregation' }}
      next={null}
    >
      <h2>What Is DIP?</h2>
      <p>
        The Dependency Inversion Principle: <em>high-level modules should not depend on low-level
        modules — both should depend on abstractions. Abstractions should not depend on details;
        details should depend on abstractions.</em> In practice: your business logic should not
        directly reference MySQL, SMTP, or AWS S3. Instead, it should depend on interfaces
        (OrderRepository, EmailSender, FileStorage) that the infrastructure implements.
      </p>

      <FlowChart
        title="Dependency Direction"
        chart={"graph LR\n  A[OrderService - business] --> B[OrderRepository - interface]\n  C[JpaOrderRepository - infra] --> B\n  D[InMemoryOrderRepository - test] --> B\n  E[High level] --> F[Abstraction]\n  G[Low level] --> F"}
      />

      <h2>DIP Violation — High Level Depends on Low Level</h2>

      <CodeBlock language="java" title="Tightly Coupled — Business Logic Knows Infrastructure">
{`// VIOLATION: OrderService (high-level business logic) directly depends on
// MySqlOrderRepository and SmtpEmailSender (low-level infrastructure details)

public class OrderService {
    // Hardcoded infrastructure — tightly coupled
    private final MySqlOrderRepository orderDb =
        new MySqlOrderRepository("jdbc:mysql://localhost:3306/orders", "root", "secret");

    private final SmtpEmailSender emailSender =
        new SmtpEmailSender("smtp.gmail.com", 587, "system@company.com", "password");

    private final StripePaymentGateway stripe =
        new StripePaymentGateway("sk_live_...");

    public Receipt placeOrder(PlaceOrderRequest request) {
        // Business logic entangled with infrastructure concerns
        Order order = new Order(request.getItems(), request.getCustomerId());
        orderDb.executeUpdate("INSERT INTO orders ..."); // raw SQL in service!

        StripeCharge charge = stripe.createCharge(
            request.getCardToken(), order.getTotalCents(), "usd"
        );

        emailSender.sendHtml(request.getEmail(), "Order Confirmed",
            "<h1>Thank you for your order!</h1>");

        return new Receipt(order.getId(), charge.getId());
    }
}

// Problems:
// 1. Cannot unit test without MySQL + Stripe + SMTP running
// 2. Switching from Stripe to Braintree requires modifying OrderService
// 3. Switching from MySQL to PostgreSQL requires modifying OrderService
// 4. Team members cannot work independently on business vs infrastructure
// 5. OrderService imports from multiple infrastructure packages`}
      </CodeBlock>

      <h2>DIP Applied — Repository and Adapter Pattern</h2>

      <CodeBlock language="java" title="Define Abstractions in the Business Layer">
{`// STEP 1: Define interfaces IN the business/domain layer
// These represent what the business needs — not how it's implemented

// domain/ports/OrderRepository.java
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(Long id);
    List<Order> findByCustomerId(Long customerId);
    void delete(Long id);
}

// domain/ports/PaymentGateway.java
public interface PaymentGateway {
    PaymentResult charge(String customerId, long amountCents, String currency);
    void refund(String chargeId, long amountCents);
}

// domain/ports/NotificationService.java
public interface NotificationService {
    void sendOrderConfirmation(String email, Order order);
    void sendShippingNotification(String email, Order order, String trackingNumber);
}

// STEP 2: Business logic depends ONLY on its own interfaces
// domain/services/OrderService.java
@Service
public class OrderService {
    private final OrderRepository orders;     // interface — not JPA
    private final PaymentGateway payments;    // interface — not Stripe
    private final NotificationService notify; // interface — not SMTP

    // Constructor injection — DI framework provides concrete implementations
    public OrderService(
        OrderRepository orders,
        PaymentGateway payments,
        NotificationService notify
    ) {
        this.orders  = orders;
        this.payments = payments;
        this.notify  = notify;
    }

    @Transactional
    public Receipt placeOrder(PlaceOrderRequest request) {
        Order order = Order.create(request.getCustomerId(), request.getItems());
        orders.save(order);

        PaymentResult payment = payments.charge(
            request.getPaymentMethodId(),
            order.getTotalCents(),
            "USD"
        );

        if (!payment.isSuccessful()) {
            orders.delete(order.getId());
            throw new PaymentFailedException(payment.getErrorMessage());
        }

        notify.sendOrderConfirmation(request.getEmail(), order);
        return new Receipt(order.getId(), payment.getTransactionId());
    }
}

// STEP 3: Infrastructure IMPLEMENTS the interfaces (depends inward)

// infrastructure/persistence/JpaOrderRepository.java
@Repository
public class JpaOrderRepository implements OrderRepository {
    private final JpaOrderJpaRepo jpa; // Spring Data JPA internal

    @Override public Order save(Order order)              { return jpa.save(order); }
    @Override public Optional<Order> findById(Long id)   { return jpa.findById(id); }
    @Override public List<Order> findByCustomerId(Long id){ return jpa.findByCustomerId(id); }
    @Override public void delete(Long id)                { jpa.deleteById(id); }
}

// infrastructure/payment/StripePaymentGateway.java
@Component
public class StripePaymentGatewayAdapter implements PaymentGateway {
    private final Stripe stripe;

    @Override
    public PaymentResult charge(String paymentMethodId, long amountCents, String currency) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountCents)
                .setCurrency(currency.toLowerCase())
                .setPaymentMethod(paymentMethodId)
                .setConfirm(true)
                .build();
            PaymentIntent intent = PaymentIntent.create(params);
            return PaymentResult.success(intent.getId());
        } catch (StripeException e) {
            return PaymentResult.failure(e.getMessage());
        }
    }
}`}
      </CodeBlock>

      <h2>Testing Benefits of DIP</h2>

      <CodeBlock language="java" title="Dependency Injection Makes Testing Trivial">
{`// Because OrderService depends on interfaces, unit testing is trivial

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orders;
    @Mock PaymentGateway payments;
    @Mock NotificationService notify;
    @InjectMocks OrderService service;

    @Test
    void placeOrder_savesOrder_andChargesPayment() {
        // Arrange
        PlaceOrderRequest request = new PlaceOrderRequest(
            "customer-1", "pm_card_visa",
            List.of(new LineItem("PROD-1", 1, new BigDecimal("29.99"))),
            "alice@example.com"
        );
        when(payments.charge(any(), anyLong(), any()))
            .thenReturn(PaymentResult.success("pi_123"));
        when(orders.save(any())).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(1L);
            return o;
        });

        // Act
        Receipt receipt = service.placeOrder(request);

        // Assert
        assertThat(receipt.getOrderId()).isEqualTo(1L);
        assertThat(receipt.getTransactionId()).isEqualTo("pi_123");
        verify(orders).save(any());
        verify(notify).sendOrderConfirmation("alice@example.com", any());
    }

    @Test
    void placeOrder_deletesOrder_whenPaymentFails() {
        when(payments.charge(any(), anyLong(), any()))
            .thenReturn(PaymentResult.failure("Insufficient funds"));
        when(orders.save(any())).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(42L);
            return o;
        });

        assertThatThrownBy(() -> service.placeOrder(request))
            .isInstanceOf(PaymentFailedException.class);

        // Order should be rolled back when payment fails
        verify(orders).delete(42L);
        verifyNoInteractions(notify); // no notification on failure
    }
}

// For integration tests: swap implementations via Spring profiles
// @Profile("test") — use InMemoryOrderRepository, FakePaymentGateway
// @Profile("prod") — use JpaOrderRepository, StripePaymentGateway`}
      </CodeBlock>

      <h2>DIP in Frontend — Dependency Injection for Services</h2>

      <CodeBlock language="typescript" title="DIP in React — Service Abstractions">
{`// Define what the component needs — not how it's fetched
interface UserService {
  getCurrentUser(): Promise<User>;
  updateProfile(data: Partial<User>): Promise<User>;
}

interface AnalyticsService {
  track(event: string, properties?: Record<string, unknown>): void;
}

// Component depends on abstractions via Context
const UserServiceContext = React.createContext<UserService | null>(null);
const AnalyticsContext = React.createContext<AnalyticsService | null>(null);

function ProfilePage() {
  const userService = useContext(UserServiceContext)!;
  const analytics = useContext(AnalyticsContext)!;
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    userService.getCurrentUser().then(setUser);
  }, [userService]);

  const handleSave = async (data: Partial<User>) => {
    const updated = await userService.updateProfile(data);
    setUser(updated);
    analytics.track('profile_updated', { fields: Object.keys(data) });
  };

  return <ProfileForm user={user} onSave={handleSave} />;
}

// Production: real API implementation
const realUserService: UserService = {
  getCurrentUser: () => fetch('/api/me').then(r => r.json()),
  updateProfile: (data) => fetch('/api/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }).then(r => r.json()),
};

const realAnalytics: AnalyticsService = {
  track: (event, props) => window.gtag('event', event, props),
};

// Test: injectable fakes — no HTTP, no window.gtag needed
const fakeUserService: UserService = {
  getCurrentUser: () => Promise.resolve({ id: '1', name: 'Alice', email: 'alice@test.com' }),
  updateProfile: (data) => Promise.resolve({ id: '1', name: 'Alice', ...data } as User),
};

const fakeAnalytics: AnalyticsService = {
  track: vi.fn(),
};

// Wrap in test:
render(
  <UserServiceContext.Provider value={fakeUserService}>
    <AnalyticsContext.Provider value={fakeAnalytics}>
      <ProfilePage />
    </AnalyticsContext.Provider>
  </UserServiceContext.Provider>
);`}
      </CodeBlock>

      <InfoBox variant="note" title="DIP vs Dependency Injection">
        <p>
          DIP is a design <em>principle</em> — high-level code depends on abstractions, not
          concretions. Dependency Injection (DI) is one <em>technique</em> for implementing DIP —
          the concrete dependency is provided by the caller (or a framework) rather than
          instantiated inside the class. Spring's <code>@Autowired</code> automates DI.
          You can follow DIP without any framework: just pass interfaces through constructors.
          DI frameworks make DIP convenient at scale.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the correct way to implement DIP in a service class?"
        options={[
          "Use new() inside the class to create all dependencies at construction time",
          "Receive dependencies through the constructor as interface types, letting the caller provide the concrete implementation",
          "Use static utility methods for all dependencies to avoid instantiation",
          "Extend the concrete dependency class to inherit its behavior"
        ]}
        correctIndex={1}
        explanation="Constructor injection with interface types is the canonical DIP implementation. The service declares what it needs (interfaces), and the caller or DI container provides concrete implementations. This makes the service testable (inject mocks), flexible (swap implementations), and honest about its dependencies (visible in the constructor signature). Using new() inside the service hard-codes the implementation and prevents testing without real infrastructure."
      />

      <InteractiveChallenge
        question="In Clean Architecture, which direction should dependencies point?"
        options={[
          "Infrastructure layer depends on the web layer; web layer depends on business layer",
          "Business layer depends on infrastructure — infrastructure knows the domain best",
          "Infrastructure depends on business interfaces; business logic is unaware of infrastructure details",
          "All layers should depend on a shared utilities module"
        ]}
        correctIndex={2}
        explanation="In Clean Architecture (also called Hexagonal or Ports and Adapters), dependencies point inward: infrastructure adapters implement interfaces defined in the business layer. The business layer defines OrderRepository (interface). Infrastructure implements JpaOrderRepository (concrete). Business logic imports only its own interface — it has no compile-time dependency on JPA, MySQL, or any infrastructure library. Swapping the database requires only changing the infrastructure layer."
      />
    </LessonLayout>
  );
}
