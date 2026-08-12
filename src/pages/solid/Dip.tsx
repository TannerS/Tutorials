import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Dip() {
  return (
    <LessonLayout
      title="Dependency Inversion Principle"
      sectionId="solid"
      lessonIndex={5}
      prev={{ path: '/solid/isp', label: 'Interface Segregation' }}
      next={null}
    >
      <h2>Depend on Abstractions, Not Concretions</h2>
      <p>
        The Dependency Inversion Principle (DIP) has two parts:
      </p>
      <ol>
        <li>
          <strong>High-level modules should not depend on low-level
          modules.</strong> Both should depend on abstractions.
        </li>
        <li>
          <strong>Abstractions should not depend on details.</strong> Details
          should depend on abstractions.
        </li>
      </ol>
      <p>
        In practice, this means your business logic should depend on
        interfaces, not on concrete implementations like specific databases,
        email libraries, or file systems.
      </p>

      <InfoBox variant="info" title="DIP vs. Dependency Injection">
        <p>
          DIP is a <em>design principle</em> — it tells you{' '}
          <strong>what</strong> to depend on (abstractions). Dependency
          Injection (DI) is a <em>technique</em> for <strong>how</strong> to
          supply those dependencies (constructor injection, setter injection,
          etc.). Frameworks like Spring implement DI to help you follow DIP,
          but you can practice DIP without any framework.
        </p>
      </InfoBox>

      <FlowChart
        title="Without DIP vs. With DIP"
        chart={"graph TD\nsubgraph Without DIP\nHL1[OrderService] --> LL1[MySQLRepository]\nHL1 --> LL2[SmtpEmailSender]\nend\nsubgraph With DIP\nHL2[OrderService] --> ABS1[OrderRepository]\nHL2 --> ABS2[EmailSender]\nABS1 --> IMPL1[MySQLRepository]\nABS1 --> IMPL2[MongoRepository]\nABS2 --> IMPL3[SmtpSender]\nABS2 --> IMPL4[SendGridSender]\nend"}
      />

      <h2>Bad Example — Tight Coupling to Concretions</h2>
      <p>
        The following service directly instantiates its dependencies. It is
        impossible to test without a real MySQL database and a real SMTP
        server. Swapping to a different database or email provider requires
        modifying the service itself.
      </p>

      <CodeBlock language="java" title="OrderServiceBad.java">
{`// BAD — High-level module directly depends on low-level details.
public class OrderService {
    // Tight coupling: creating concrete dependencies directly.
    private MySqlOrderRepository repository = new MySqlOrderRepository();
    private SmtpEmailSender emailSender = new SmtpEmailSender();

    public void placeOrder(Order order) {
        // Business logic mixed with infrastructure concerns
        repository.save(order);
        emailSender.send(
            order.getCustomerEmail(),
            "Order Confirmation",
            "Your order #" + order.getId() + " has been placed."
        );
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="ConcreteDependenciesBad.java">
{`// BAD — Concrete classes with no abstraction layer.
public class MySqlOrderRepository {
    public void save(Order order) {
        // Direct JDBC code — tightly coupled to MySQL
        Connection conn = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/orders");
        PreparedStatement ps = conn.prepareStatement(
            "INSERT INTO orders (id, total) VALUES (?, ?)");
        ps.setLong(1, order.getId());
        ps.setDouble(2, order.getTotal());
        ps.executeUpdate();
        conn.close();
    }
}

public class SmtpEmailSender {
    public void send(String to, String subject, String body) {
        // Direct javax.mail code — tightly coupled to SMTP
        Session session = Session.getInstance(smtpProperties);
        MimeMessage msg = new MimeMessage(session);
        msg.setRecipient(Message.RecipientType.TO,
            new InternetAddress(to));
        msg.setSubject(subject);
        msg.setText(body);
        Transport.send(msg);
    }
}`}
      </CodeBlock>

      <h2>Good Example — Depend on Abstractions</h2>
      <p>
        Define interfaces for the dependencies. The service depends only on
        these abstractions. Concrete implementations are injected from the
        outside — making the service testable, flexible, and insulated from
        infrastructure changes.
      </p>

      <CodeBlock language="java" title="Abstractions.java">
{`// GOOD — Define abstractions that high-level modules depend on.
public interface OrderRepository {
    void save(Order order);
    Order findById(long id);
}

public interface EmailSender {
    void send(String to, String subject, String body);
}`}
      </CodeBlock>

      <CodeBlock language="java" title="OrderServiceGood.java">
{`// GOOD — High-level module depends only on abstractions.
// Dependencies are injected via constructor (Dependency Injection).
public class OrderService {
    private final OrderRepository repository;
    private final EmailSender emailSender;

    public OrderService(OrderRepository repository,
                        EmailSender emailSender) {
        this.repository = repository;
        this.emailSender = emailSender;
    }

    public void placeOrder(Order order) {
        repository.save(order);
        emailSender.send(
            order.getCustomerEmail(),
            "Order Confirmation",
            "Your order #" + order.getId() + " has been placed."
        );
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="ConcreteImplementations.java">
{`// GOOD — Low-level modules implement the abstractions.
public class MySqlOrderRepository implements OrderRepository {
    private final DataSource dataSource;

    public MySqlOrderRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void save(Order order) {
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO orders (id, total) VALUES (?, ?)");
            ps.setLong(1, order.getId());
            ps.setDouble(2, order.getTotal());
            ps.executeUpdate();
        }
    }

    @Override
    public Order findById(long id) {
        // ... implementation
        return null;
    }
}

public class SendGridEmailSender implements EmailSender {
    @Override
    public void send(String to, String subject, String body) {
        // SendGrid API call — swapped without changing OrderService
        SendGrid sg = new SendGrid(System.getenv("SENDGRID_API_KEY"));
        // ... build and send request
    }
}`}
      </CodeBlock>

      <h2>Testing With DIP</h2>
      <p>
        Because the service depends on interfaces, you can easily inject
        test doubles without any framework:
      </p>

      <CodeBlock language="java" title="OrderServiceTest.java">
{`// GOOD — Unit testing is trivial with DIP.
public class OrderServiceTest {
    @Test
    public void placeOrder_savesAndSendsEmail() {
        // Arrange — use simple test doubles
        List<Order> savedOrders = new ArrayList<>();
        List<String> sentEmails = new ArrayList<>();

        OrderRepository fakeRepo = order -> savedOrders.add(order);
        EmailSender fakeSender = (to, subj, body) -> sentEmails.add(to);

        OrderService service = new OrderService(fakeRepo, fakeSender);
        Order order = new Order(1L, 99.99, "test@example.com");

        // Act
        service.placeOrder(order);

        // Assert
        assertEquals(1, savedOrders.size());
        assertEquals("test@example.com", sentEmails.get(0));
    }
}`}
      </CodeBlock>

      <h2>DIP With Spring Framework</h2>
      <p>
        Spring&apos;s IoC container automates Dependency Injection. You
        declare your abstractions and implementations, and Spring wires them
        together:
      </p>

      <CodeBlock language="java" title="SpringDipExample.java">
{`// Spring automatically injects the right implementation.
@Service
public class OrderService {
    private final OrderRepository repository;
    private final EmailSender emailSender;

    @Autowired
    public OrderService(OrderRepository repository,
                        EmailSender emailSender) {
        this.repository = repository;
        this.emailSender = emailSender;
    }

    public void placeOrder(Order order) {
        repository.save(order);
        emailSender.send(
            order.getCustomerEmail(),
            "Order Confirmation",
            "Your order #" + order.getId() + " has been placed."
        );
    }
}

@Repository
public class JpaOrderRepository implements OrderRepository {
    @PersistenceContext
    private EntityManager em;

    @Override
    public void save(Order order) { em.persist(order); }

    @Override
    public Order findById(long id) { return em.find(Order.class, id); }
}

@Component
public class SmtpEmailSender implements EmailSender {
    private final JavaMailSender mailSender;

    @Autowired
    public SmtpEmailSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void send(String to, String subject, String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        mailSender.send(msg);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Power of DIP">
        <p>
          With DIP in place, you can swap your entire persistence layer from
          MySQL to MongoDB, or your email provider from SMTP to SendGrid,
          without changing a single line in your business logic. This is the
          foundation of hexagonal architecture (Ports and Adapters) and clean
          architecture. DIP ties all the other SOLID principles together.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the key difference between Dependency Inversion (DIP) and Dependency Injection (DI)?"
        options={[
          "They are the same thing — just different names",
          "DIP is a design principle about depending on abstractions; DI is a technique for supplying those dependencies",
          "DI is a principle and DIP is a framework feature",
          "DIP only applies to databases; DI applies to all dependencies"
        ]}
        correctIndex={1}
        explanation="DIP is a design principle that says 'depend on abstractions, not concretions.' DI is a technique (constructor injection, setter injection, etc.) for providing those abstract dependencies to a class at runtime. You can follow DIP without a DI framework by manually passing interfaces via constructors. Spring's @Autowired automates DI but the principle (DIP) is framework-independent."
        code={"// DIP: depend on the interface\nprivate final OrderRepository repo;\n\n// DI: inject via constructor\npublic OrderService(OrderRepository repo) {\n    this.repo = repo;\n}"}
        language="java"
      />
    </LessonLayout>
  );
}
