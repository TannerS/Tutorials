import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SolidIntro() {
  return (
    <LessonLayout
      title="SOLID Principles Overview"
      sectionId="solid"
      lessonIndex={0}
      prev={null}
      next={{ path: '/solid/srp', label: 'Single Responsibility' }}
    >
      <h2>Why SOLID?</h2>
      <p>
        SOLID is a set of five design principles that make object-oriented code maintainable,
        flexible, and testable. Without them, code rots — it becomes harder to change over time.
        SOLID describes the symptoms of that rot and how to avoid it.
      </p>

      <FlowChart
        title="SOLID at a Glance"
        chart={"graph TD\n  A[SOLID] --> B[S - Single Responsibility]\n  A --> C[O - Open/Closed]\n  A --> D[L - Liskov Substitution]\n  A --> E[I - Interface Segregation]\n  A --> F[D - Dependency Inversion]\n  B --> G[One reason to change]\n  C --> H[Extend without modifying]\n  D --> I[Subtypes substitutable]\n  E --> J[No fat interfaces]\n  F --> K[Depend on abstractions]"}
      />

      <h2>The Four Symptoms of Bad Design</h2>

      <CodeBlock language="java" title="Code Rot Symptoms">
{`// RIGIDITY — one change requires many others
// "Change the report format" touches 7 files because nothing is isolated

// FRAGILITY — changes break unrelated things
// Fix a payment bug → authentication breaks
// Caused by hidden coupling between unrelated modules

// IMMOBILITY — can't reuse code without copy-pasting
// Email-sending logic buried inside OrderService
// Can't use it in RegistrationService → copy-paste duplication

// VISCOSITY — easier to do the wrong thing than the right thing
// Clean solution: refactor first, then add feature (takes 4 hours)
// Hacky solution: add another if-else (takes 30 minutes)
// When viscosity is high, hacks accumulate and rot accelerates

// Root cause of all four: HIGH COUPLING
// Coupling = components depend on each other's implementation details
// Low coupling = components depend on stable abstractions (interfaces)

// SOLID addresses coupling:
// SRP → one reason to change = fewer cascading changes
// OCP → extend without modifying = existing code stays stable
// LSP → substitutable types = polymorphism works reliably
// ISP → focused interfaces = minimal unnecessary dependencies
// DIP → abstractions not concretions = swap implementations freely`}
      </CodeBlock>

      <h2>Coupling vs Cohesion</h2>

      <CodeBlock language="java" title="High Coupling (Bad) vs Low Coupling (Good)">
{`// HIGH COUPLING — OrderService knows SMTP details (wrong abstraction level)
public class OrderService {
    public void placeOrder(Order order) {
        orderRepo.save(order);

        // EmailService's implementation leaks into OrderService
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("smtp.gmail.com");
        sender.setPort(587);
        MimeMessage msg = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg);
        helper.setTo(order.getEmail());
        helper.setSubject("Order #" + order.getId() + " confirmed");
        sender.send(msg);
    }
}
// Problems: can't test without SMTP server, can't swap to SendGrid,
// email logic is scattered across services

// LOW COUPLING — depends on interface, not implementation
public interface NotificationService {
    void sendOrderConfirmation(Order order);
}

public class OrderService {
    private final OrderRepository orderRepo;
    private final NotificationService notifications;

    public OrderService(OrderRepository repo, NotificationService notifications) {
        this.orderRepo = repo;
        this.notifications = notifications;
    }

    public void placeOrder(Order order) {
        orderRepo.save(order);
        notifications.sendOrderConfirmation(order);
    }
}

// HIGH COHESION: each class has ONE clear purpose
// LOW COUPLING: OrderService is unaware of SMTP, SendGrid, or Slack
// TESTABLE: inject MockNotificationService in unit tests
// FLEXIBLE: swap SmtpNotificationService → SendGridNotificationService freely`}
      </CodeBlock>

      <h2>SOLID One-Liners with Examples</h2>

      <CodeBlock language="java" title="Each Principle in One Line">
{`// S — Single Responsibility Principle
// "A class should have only ONE reason to change."
// Violation: UserService handles auth + profile updates + email sending
// Fix:       AuthService, ProfileService, EmailService — separate classes

// O — Open/Closed Principle
// "Open for extension, closed for modification."
// Violation: if (type == "PDF") ... else if (type == "CSV") ...
// Fix:       interface Report { generate(); } → PdfReport, CsvReport

// L — Liskov Substitution Principle
// "Subtypes must be usable wherever their supertype is expected."
// Violation: Square extends Rectangle — setWidth(5); setHeight(3); area != 15
// Fix:       Shape interface, independent Square and Rectangle implementations

// I — Interface Segregation Principle
// "Clients should not depend on methods they don't use."
// Violation: interface Worker { work(); eat(); sleep(); } — Robot can't eat()
// Fix:       interface Workable { work(); } separate from interface Feedable

// D — Dependency Inversion Principle
// "Depend on abstractions, not on concretions."
// Violation: OrderService creates new MySqlOrderRepository()
// Fix:       OrderService depends on OrderRepository interface;
//            MySqlOrderRepository implements OrderRepository (injected)`}
      </CodeBlock>

      <h2>Dependency Direction — The Key Insight</h2>

      <CodeBlock language="java" title="Dependencies Should Point Inward">
{`// WRONG: business logic depends on infrastructure
package com.example.orders;
import com.example.infrastructure.MySqlOrderRepository;  // BAD
import javax.mail.JavaMailSender;                         // BAD
import software.amazon.awssdk.services.s3.S3Client;       // BAD

public class OrderService {
    private MySqlOrderRepository repo;    // concrete DB class
    private JavaMailSender mailer;        // concrete mail class
    private S3Client storage;             // concrete AWS class
}
// Problem: business logic has AWS/MySQL/mail as compile dependencies
// Can't test without real infrastructure
// Can't swap MySQL for Postgres without changing business logic

// CORRECT: infrastructure depends on business logic interfaces
// business/OrderRepository.java (interface defined in business layer)
public interface OrderRepository {
    Order findById(Long id);
    Order save(Order order);
}

// infrastructure/MySqlOrderRepository.java (lives in infrastructure layer)
public class MySqlOrderRepository implements OrderRepository { ... }

// business/OrderService.java (no infrastructure imports!)
public class OrderService {
    private final OrderRepository repo;  // depends on OWN interface

    public OrderService(OrderRepository repo) {
        this.repo = repo; // spring injects MySqlOrderRepository at runtime
    }
}

// Clean Architecture arrows:
// Infrastructure → Business Interfaces ← Business Logic
// Infrastructure knows about business; business is unaware of infrastructure`}
      </CodeBlock>

      <InfoBox variant="note" title="SOLID + Design Patterns">
        <p>
          SOLID principles and design patterns are complementary. SOLID tells you <em>what
          properties</em> good design has. Design patterns tell you <em>how</em> to achieve them.
          The <strong>Strategy pattern</strong> achieves OCP.
          The <strong>Repository pattern</strong> achieves DIP.
          The <strong>Decorator pattern</strong> achieves SRP and OCP together.
          Learn SOLID first — patterns become much easier to understand in context.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="SOLID in Practice — Spring Boot">
{`// Spring Boot applications naturally follow SOLID through:

// S — @Service, @Repository, @Controller are separate concerns
@Service public class OrderService { ... }
@Repository public class OrderRepository { ... }

// O — Spring uses @Bean configuration and polymorphism
// Add a new PaymentProvider without modifying existing services

// D — @Autowired injects interfaces, not concrete classes
@Service
public class OrderService {
    private final OrderRepository orderRepo; // interface!
    private final PaymentService paymentService; // interface!

    public OrderService(OrderRepository orderRepo,
                        PaymentService paymentService) {
        this.orderRepo = orderRepo;
        this.paymentService = paymentService;
    }
}
// Spring resolves the concrete implementation at runtime
// Test with @MockBean, production with real implementation

// I — define focused interfaces
public interface OrderQueryService {
    Order findById(Long id);
    Page<Order> findByUser(Long userId, Pageable pageable);
}
public interface OrderCommandService {
    Order placeOrder(PlaceOrderRequest request);
    void cancelOrder(Long orderId);
}
// Separate read and write interfaces — clients depend only on what they use`}
      </CodeBlock>

      <InteractiveChallenge
        question="Which symptom of bad design occurs when changing one module unexpectedly breaks unrelated modules?"
        options={[
          "Rigidity — every change requires many other changes",
          "Fragility — changes break unrelated things",
          "Immobility — components can't be reused",
          "Viscosity — the right way is harder than the wrong way"
        ]}
        correctIndex={1}
        explanation="Fragility describes code where changes cause unexpected failures in unrelated areas — a result of hidden tight coupling. Rigidity is when a change requires many other changes (different symptom). Immobility is when you can't extract and reuse code. Viscosity is when hacks are easier than clean solutions. SOLID principles combat fragility by isolating responsibilities and reducing coupling."
      />

      <InteractiveChallenge
        question="What is the core benefit of depending on interfaces rather than concrete classes?"
        options={[
          "Interfaces execute faster than concrete classes at runtime",
          "You can swap implementations without modifying the dependent class",
          "Interfaces automatically add caching to method calls",
          "Concrete classes cannot be unit tested directly"
        ]}
        correctIndex={1}
        explanation="Depending on interfaces (Dependency Inversion Principle) means the dependent class only knows about the contract (interface), not the implementation. This enables: (1) testing — inject a mock implementation in unit tests without real infrastructure, (2) flexibility — swap MySQL for PostgreSQL by changing a single Spring bean, (3) runtime polymorphism — different implementations per environment or configuration. Concrete dependencies lock you in; interface dependencies open your options."
      />
    </LessonLayout>
  );
}
