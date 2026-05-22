import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function PatternsStrategy() {
  return (
    <LessonLayout
      title="Strategy Pattern"
      sectionId="patterns"
      lessonIndex={2}
      prev={{ path: "/patterns/singleton", label: "Singleton Pattern" }}
      next={{ path: "/patterns/decorator", label: "Decorator Pattern" }}
    >
      <p>The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. It lets the algorithm vary independently from the clients that use it. Instead of if/else or switch chains, you pick a strategy object at runtime.</p>

      <h2>The Problem Strategy Solves</h2>

      <CodeBlock language="java" title="Before Strategy — Rigid if/else">
{`// BAD: every new payment type requires editing this class
class PaymentService {
    double charge(Order order, String paymentType) {
        if (paymentType.equals("CREDIT")) {
            return order.total * 1.02;   // 2% fee
        } else if (paymentType.equals("PAYPAL")) {
            return order.total * 1.035;  // 3.5% fee
        } else if (paymentType.equals("CRYPTO")) {
            return order.total * 1.01;   // 1% fee
        }
        throw new IllegalArgumentException("Unknown: " + paymentType);
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="After Strategy — Open for Extension">
{`// Strategy interface
@FunctionalInterface
public interface PricingStrategy {
    double calculate(double baseAmount);
}

// Concrete strategies
public class CreditCardPricing implements PricingStrategy {
    @Override public double calculate(double amount) { return amount * 1.02; }
}
public class PayPalPricing implements PricingStrategy {
    @Override public double calculate(double amount) { return amount * 1.035; }
}
public class CryptoPricing implements PricingStrategy {
    @Override public double calculate(double amount) { return amount * 1.01; }
}

// Context — uses whatever strategy is injected
public class PaymentService {
    private final PricingStrategy pricing;
    public PaymentService(PricingStrategy pricing) { this.pricing = pricing; }
    public double charge(Order order) { return pricing.calculate(order.total); }
}

// Client selects strategy
PaymentService ps = new PaymentService(new CreditCardPricing());
double total = ps.charge(order);  // uses credit card pricing`}
      </CodeBlock>

      <FlowChart
        title="Strategy Pattern Structure"
        chart={"graph LR\n  A[Context] --> B[Strategy Interface]\n  B --> C[ConcreteStrategyA]\n  B --> D[ConcreteStrategyB]\n  B --> E[ConcreteStrategyC]\n  A -- delegates --> B"}
      />

      <h2>Strategy with Lambdas</h2>
      <p>Because PricingStrategy is a functional interface (one abstract method), Java 8+ lets you use lambdas directly — no need to create a class for each algorithm.</p>

      <CodeBlock language="java" title="Strategy with Lambdas and Map">
{`// Strategy registry using lambdas
public class PaymentService {
    private static final Map<String, PricingStrategy> STRATEGIES = Map.of(
        "CREDIT",  amount -> amount * 1.02,
        "PAYPAL",  amount -> amount * 1.035,
        "CRYPTO",  amount -> amount * 1.01,
        "CASH",    amount -> amount           // no fee
    );

    public double charge(Order order, String method) {
        PricingStrategy strategy = STRATEGIES.getOrDefault(method,
            amount -> { throw new IllegalArgumentException("Unknown: " + method); });
        return strategy.calculate(order.total);
    }
}

// Adding a new payment method = one new map entry, zero existing changes`}
      </CodeBlock>

      <h2>Real-World: Sorting Strategy</h2>

      <CodeBlock language="java" title="Sorting Strategy with Comparator">
{`// Java's Comparator IS the Strategy pattern
List<Employee> employees = getEmployees();

// Strategy 1: sort by salary
employees.sort(Comparator.comparingDouble(Employee::getSalary));

// Strategy 2: sort by name then department
employees.sort(Comparator.comparing(Employee::getName)
                         .thenComparing(Employee::getDepartment));

// Strategy 3: custom — highest performers first, then alphabetical
employees.sort(Comparator.comparingDouble(Employee::getPerformanceScore)
                         .reversed()
                         .thenComparing(Employee::getName));

// The sort algorithm stays the same; only the Comparator (strategy) changes`}
      </CodeBlock>

      <h2>Strategy in Spring Boot</h2>

      <CodeBlock language="java" title="Strategy with Spring DI">
{`// All strategies auto-registered with Spring
public interface NotificationStrategy {
    void send(String userId, String message);
    String getChannel();
}

@Component public class EmailNotification implements NotificationStrategy {
    public void send(String userId, String msg) { /* send email */ }
    public String getChannel() { return "EMAIL"; }
}
@Component public class SmsNotification implements NotificationStrategy {
    public void send(String userId, String msg) { /* send SMS */ }
    public String getChannel() { return "SMS"; }
}
@Component public class PushNotification implements NotificationStrategy {
    public void send(String userId, String msg) { /* send push */ }
    public String getChannel() { return "PUSH"; }
}

// Context — Spring injects all strategies automatically!
@Service
public class NotificationService {
    private final Map<String, NotificationStrategy> strategies;

    public NotificationService(List<NotificationStrategy> strategies) {
        this.strategies = strategies.stream()
            .collect(Collectors.toMap(NotificationStrategy::getChannel, s -> s));
    }

    public void notify(String userId, String message, String channel) {
        strategies.get(channel).send(userId, message);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Strategy vs State">
        <p>Strategy and State look similar structurally, but have different intents. Strategy delegates a single algorithm chosen by the client. State encapsulates behavior that varies based on internal state, and the object itself transitions between states. If the context changes which "strategy" automatically based on its own data, it's actually State.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the primary benefit of the Strategy pattern over if/else chains?"
        options={["Faster execution speed", "Open/Closed principle — add new behaviors without modifying existing code", "Reduces memory usage", "Eliminates the need for interfaces"]}
        correctIndex={1}
        explanation="Strategy follows the Open/Closed Principle: open for extension (add new strategies), closed for modification (context never needs to change). Each new algorithm is a new class, not a new branch in existing code."
      />

    </LessonLayout>
  );
}
