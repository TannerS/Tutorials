import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="SOLID Principles Overview"
      sectionId="solid"
      lessonIndex={0}
      prev={null}
      next={{ path: '/solid/srp', label: 'Single Responsibility' }}
    >
      <h2>What Are the SOLID Principles?</h2>
      <p>
        SOLID is a mnemonic acronym introduced by Robert C. Martin (Uncle Bob)
        that represents five fundamental design principles for writing
        maintainable, flexible, and scalable object-oriented software. These
        principles have become cornerstones of professional software
        engineering.
      </p>

      <InfoBox variant="info" title="Origin of SOLID">
        <p>
          The SOLID principles were first compiled by Robert C. Martin in the
          early 2000s, though the individual principles were formulated over
          the preceding decades. Michael Feathers coined the SOLID mnemonic.
          These principles guide developers toward designs that are easier to
          understand, change, and test.
        </p>
      </InfoBox>

      <h2>The Five Principles</h2>

      <FlowChart
        title="The SOLID Principles at a Glance"
        chart={"graph TD\nS[S — Single Responsibility] --> GOAL[Clean, Maintainable Code]\nO[O — Open/Closed] --> GOAL\nL[L — Liskov Substitution] --> GOAL\nI[I — Interface Segregation] --> GOAL\nD[D — Dependency Inversion] --> GOAL\nGOAL --> BENEFITS[Flexible & Testable Systems]"}
      />

      <h3>S — Single Responsibility Principle (SRP)</h3>
      <p>
        A class should have only one reason to change. Each class should
        encapsulate a single responsibility or concern.
      </p>

      <h3>O — Open/Closed Principle (OCP)</h3>
      <p>
        Software entities should be open for extension but closed for
        modification. You should be able to add new behavior without changing
        existing code.
      </p>

      <h3>L — Liskov Substitution Principle (LSP)</h3>
      <p>
        Subtypes must be substitutable for their base types without altering
        the correctness of the program.
      </p>

      <h3>I — Interface Segregation Principle (ISP)</h3>
      <p>
        Clients should not be forced to depend on interfaces they do not use.
        Prefer many small, focused interfaces over one large interface.
      </p>

      <h3>D — Dependency Inversion Principle (DIP)</h3>
      <p>
        High-level modules should not depend on low-level modules. Both should
        depend on abstractions. Abstractions should not depend on details;
        details should depend on abstractions.
      </p>

      <h2>Why SOLID Matters</h2>
      <p>
        Without guiding principles, codebases become tangled and fragile over
        time. Here is a typical example of code that violates multiple SOLID
        principles at once:
      </p>

      <CodeBlock language="java" title="GodClass.java">
{`// BAD — This class does everything: validation, persistence,
// notification, and formatting. It violates SRP, OCP, and DIP.
public class OrderProcessor {
    public void processOrder(Order order) {
        // Validate
        if (order.getItems().isEmpty()) {
            throw new RuntimeException("No items");
        }

        // Calculate total (hard-coded tax logic)
        double total = 0;
        for (Item item : order.getItems()) {
            total += item.getPrice();
        }
        if (order.getCountry().equals("US")) {
            total *= 1.07; // US tax
        } else if (order.getCountry().equals("UK")) {
            total *= 1.20; // UK VAT
        }

        // Save to database (direct JDBC)
        Connection conn = DriverManager.getConnection("jdbc:mysql://...");
        PreparedStatement ps = conn.prepareStatement(
            "INSERT INTO orders VALUES (?, ?)");
        ps.setInt(1, order.getId());
        ps.setDouble(2, total);
        ps.executeUpdate();

        // Send email (hard-coded SMTP)
        Transport.send(createMimeMessage(order));
    }
}`}
      </CodeBlock>

      <p>
        Now compare that with a design that respects the SOLID principles.
        Each concern lives in its own class, dependencies are injected, and
        the system is open for extension:
      </p>

      <CodeBlock language="java" title="SolidOrderService.java">
{`// GOOD — Responsibilities are separated and dependencies are abstracted.
public class OrderService {
    private final OrderValidator validator;
    private final TaxCalculator taxCalculator;
    private final OrderRepository repository;
    private final NotificationService notifier;

    public OrderService(OrderValidator validator,
                        TaxCalculator taxCalculator,
                        OrderRepository repository,
                        NotificationService notifier) {
        this.validator = validator;
        this.taxCalculator = taxCalculator;
        this.repository = repository;
        this.notifier = notifier;
    }

    public void processOrder(Order order) {
        validator.validate(order);
        double total = taxCalculator.calculate(order);
        repository.save(order, total);
        notifier.notify(order);
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Abstractions.java">
{`// Supporting interfaces — each defines a single responsibility.
public interface OrderValidator {
    void validate(Order order);
}

public interface TaxCalculator {
    double calculate(Order order);
}

public interface OrderRepository {
    void save(Order order, double total);
}

public interface NotificationService {
    void notify(Order order);
}`}
      </CodeBlock>

      <h2>How the Principles Relate</h2>

      <FlowChart
        title="How SOLID Principles Reinforce Each Other"
        chart={"graph LR\nSRP[SRP: Focused Classes] --> OCP[OCP: Extensible Design]\nOCP --> LSP[LSP: Safe Substitution]\nLSP --> ISP[ISP: Lean Interfaces]\nISP --> DIP[DIP: Depend on Abstractions]\nDIP -->|enables| SRP"}
      />

      <p>
        The principles are not isolated rules — they reinforce one another.
        Following SRP makes classes small enough that OCP becomes natural.
        LSP ensures your polymorphic extensions actually work. ISP keeps
        interfaces focused so that DIP is practical. Together they form a
        virtuous cycle.
      </p>

      <InteractiveChallenge
        question="What does the 'S' in SOLID stand for?"
        options={[
          "Separation of Concerns",
          "Single Responsibility Principle",
          "Simple Design Principle",
          "Structured Responsibility Pattern"
        ]}
        correctIndex={1}
        explanation="The 'S' stands for the Single Responsibility Principle — a class should have only one reason to change. While 'Separation of Concerns' is a related concept, the specific acronym letter refers to SRP as defined by Robert C. Martin."
      />
    </LessonLayout>
  );
}
