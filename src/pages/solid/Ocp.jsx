import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SolidOcp() {
  return (
    <LessonLayout
      title="Open/Closed Principle"
      sectionId="solid"
      lessonIndex={2}
      prev={{ path: '/solid/srp', label: 'Single Responsibility' }}
      next={{ path: '/solid/lsp', label: 'Liskov Substitution' }}
    >
      <h2>What Is OCP?</h2>
      <p>
        The Open/Closed Principle: <em>software entities should be open for extension but closed
        for modification.</em> This means you add new behavior by writing new code — not by
        changing existing, tested code. Every time you open an existing class to add a new feature,
        you risk introducing bugs in features that already worked. OCP achieves stability by
        expressing variation through abstractions (interfaces, inheritance, composition).
      </p>

      <FlowChart
        title="OCP — Extend Without Modifying"
        chart={"graph TD\n  A[PaymentProcessor] --> B[PaymentStrategy interface]\n  B --> C[CreditCardPayment]\n  B --> D[PayPalPayment]\n  B --> E[CryptoPayment - NEW]\n  E --> F[No changes to A or B]\n  G[if/else switch on type] --> H[Must modify class for each new type]"}
      />

      <h2>The Classic OCP Violation — Switch on Type</h2>

      <CodeBlock language="java" title="Violation — if/else Grows With Each New Type">
{`// VIOLATION: every new payment type requires opening and modifying this class
public class PaymentProcessor {

    public Receipt process(Payment payment) {
        if ("CREDIT_CARD".equals(payment.getType())) {
            // Credit card logic
            String token = creditCardGateway.tokenize(payment.getCardNumber());
            return creditCardGateway.charge(token, payment.getAmount());

        } else if ("PAYPAL".equals(payment.getType())) {
            // PayPal logic (different API, different error handling)
            PaypalOrder order = paypalClient.createOrder(payment.getAmount());
            paypalClient.capture(order.getId());
            return new Receipt(order.getId(), payment.getAmount());

        } else if ("APPLE_PAY".equals(payment.getType())) {
            // Apple Pay logic — added in sprint 12, touched working code
            ApplePayToken appleToken = applePayService.validate(payment.getToken());
            return applePayService.charge(appleToken, payment.getAmount());

        } else if ("CRYPTO".equals(payment.getType())) {
            // Crypto — added in sprint 18, again changed this class!
            return cryptoGateway.transfer(payment.getWalletAddress(), payment.getAmount());
        }

        throw new UnsupportedPaymentException(payment.getType());
    }
}
// Problems with this design:
// 1. Every new payment method REQUIRES modifying this class
// 2. Risk of breaking existing payment types with each change
// 3. Class grows indefinitely — eventually hundreds of lines
// 4. Unit testing becomes complex: mock 4 different gateways
// 5. Teams cannot work in parallel on different payment types`}
      </CodeBlock>

      <h2>OCP Applied — Strategy Pattern</h2>

      <CodeBlock language="java" title="Open for Extension via Abstraction">
{`// STEP 1: Define the abstraction — a contract for all payment types
public interface PaymentStrategy {
    Receipt process(Payment payment);
    boolean supports(String paymentType);
}

// STEP 2: Implement each type in its own class
@Component
public class CreditCardPaymentStrategy implements PaymentStrategy {
    private final CreditCardGateway gateway;

    @Override
    public boolean supports(String type) {
        return "CREDIT_CARD".equals(type);
    }

    @Override
    public Receipt process(Payment payment) {
        String token = gateway.tokenize(payment.getCardNumber());
        return gateway.charge(token, payment.getAmount());
    }
}

@Component
public class PayPalPaymentStrategy implements PaymentStrategy {
    private final PayPalClient client;

    @Override
    public boolean supports(String type) {
        return "PAYPAL".equals(type);
    }

    @Override
    public Receipt process(Payment payment) {
        PaypalOrder order = client.createOrder(payment.getAmount());
        client.capture(order.getId());
        return new Receipt(order.getId(), payment.getAmount());
    }
}

// STEP 3: Processor is now CLOSED for modification
// Spring injects ALL beans implementing PaymentStrategy
@Service
public class PaymentProcessor {
    private final List<PaymentStrategy> strategies;

    public PaymentProcessor(List<PaymentStrategy> strategies) {
        this.strategies = strategies;
    }

    public Receipt process(Payment payment) {
        return strategies.stream()
            .filter(s -> s.supports(payment.getType()))
            .findFirst()
            .orElseThrow(() -> new UnsupportedPaymentException(payment.getType()))
            .process(payment);
    }
}

// STEP 4: Add new payment type — zero changes to existing code!
@Component
public class CryptoPaymentStrategy implements PaymentStrategy {
    private final CryptoGateway gateway;

    @Override
    public boolean supports(String type) {
        return "CRYPTO".equals(type);
    }

    @Override
    public Receipt process(Payment payment) {
        return gateway.transfer(payment.getWalletAddress(), payment.getAmount());
    }
}`}
      </CodeBlock>

      <h2>OCP in Frontend — Component Composition</h2>

      <CodeBlock language="jsx" title="OCP Applied to React Components">
{`// VIOLATION: alert component modified every time a new type is added
function Alert({ type, message }) {
  if (type === 'success') {
    return <div className="bg-green-100 text-green-800">{message}</div>;
  } else if (type === 'error') {
    return <div className="bg-red-100 text-red-800">{message}</div>;
  } else if (type === 'warning') {  // added later — modified existing component
    return <div className="bg-yellow-100 text-yellow-800">{message}</div>;
  }
  return null;
}

// ✓ OCP APPLIED — extend by passing configuration, not by modifying
const ALERT_STYLES = {
  success: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
  error:   { bg: 'bg-red-100',   text: 'text-red-800',   icon: '✗' },
  warning: { bg: 'bg-yellow-100',text: 'text-yellow-800',icon: '⚠' },
  info:    { bg: 'bg-blue-100',  text: 'text-blue-800',  icon: 'ℹ' },
};

function Alert({ type, message, actions }) {
  const styles = ALERT_STYLES[type] ?? ALERT_STYLES.info;
  return (
    <div className={\`\${styles.bg} \${styles.text} p-4 rounded\`}>
      <span>{styles.icon}</span>
      <span>{message}</span>
      {actions && <div className="mt-2">{actions}</div>}
    </div>
  );
}
// Add new type: just add a key to ALERT_STYLES — Alert component unchanged

// ✓ OCP via render props — consumer controls rendering
function DataTable({ data, renderRow, renderHeader }) {
  return (
    <table>
      <thead>{renderHeader()}</thead>
      <tbody>{data.map(renderRow)}</tbody>
    </table>
  );
}
// Add new row format without touching DataTable

// ✓ OCP via HOC (Higher-Order Component) — wrap to extend
function withLogging(WrappedComponent) {
  return function LoggedComponent(props) {
    useEffect(() => {
      console.log(WrappedComponent.displayName + ' mounted');
    }, []);
    return <WrappedComponent {...props} />;
  };
}
// Adds behavior without modifying WrappedComponent`}
      </CodeBlock>

      <h2>Template Method Pattern — OCP for Algorithms</h2>

      <CodeBlock language="java" title="Template Method — Skeleton With Extension Points">
{`// Template method defines the algorithm skeleton; subclasses fill in steps
// Open for extension (subclasses), closed for modification (template method)

public abstract class ReportGenerator {

    // Template method — defines the algorithm, calls overridable hooks
    public final Report generate(ReportRequest request) {
        List<Object> rawData   = fetchData(request);      // hook
        List<Object> filtered  = filterData(rawData);     // hook (has default)
        List<Object> formatted = formatData(filtered);    // hook
        String output          = renderOutput(formatted); // hook
        return new Report(output, request.getTitle());
    }

    // Abstract hooks — must be implemented by subclasses
    protected abstract List<Object> fetchData(ReportRequest request);
    protected abstract List<Object> formatData(List<Object> data);
    protected abstract String renderOutput(List<Object> data);

    // Hook with default behavior — subclasses may override
    protected List<Object> filterData(List<Object> data) {
        return data;  // default: no filtering
    }
}

// Extension 1: CSV report — no changes to ReportGenerator
public class CsvReportGenerator extends ReportGenerator {
    @Override protected List<Object> fetchData(ReportRequest req) { /* query DB */ }
    @Override protected List<Object> formatData(List<Object> data) { /* format rows */ }
    @Override protected String renderOutput(List<Object> data) { /* join with commas */ }
}

// Extension 2: PDF report — no changes to existing code
public class PdfReportGenerator extends ReportGenerator {
    @Override protected List<Object> fetchData(ReportRequest req) { /* same data */ }
    @Override protected List<Object> formatData(List<Object> data) { /* add bold headers */ }
    @Override protected String renderOutput(List<Object> data) { /* PDFBox rendering */ }
    @Override protected List<Object> filterData(List<Object> data) {
        return data.stream().filter(row -> /* filter confidential rows */).toList();
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Patterns That Enable OCP">
        <p>
          These design patterns naturally achieve OCP:
        </p>
        <ul>
          <li><strong>Strategy</strong> — swap algorithms without modifying the context</li>
          <li><strong>Template Method</strong> — define skeleton, extend with subclasses</li>
          <li><strong>Decorator</strong> — add behavior by wrapping, not modifying</li>
          <li><strong>Observer / Events</strong> — publish events; new subscribers extend without changing publisher</li>
          <li><strong>Plugin / Registry</strong> — register handlers; processor never changes</li>
        </ul>
        <p>
          The common thread: define a stable abstraction, then express variation through
          implementations of that abstraction.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="How does the Strategy pattern support the Open/Closed Principle?"
        options={[
          "It prevents any code from being changed or deleted once written",
          "New behaviors are added as new strategy implementations without modifying the context class that uses the strategy",
          "It requires modifying the common interface every time a new strategy is needed",
          "Strategy eliminates the need for interfaces by using inheritance"
        ]}
        correctIndex={1}
        explanation="The Strategy pattern encapsulates each algorithm in its own class implementing a common interface. To add a new behavior, create a new class — the context that uses the strategy never changes. In the payment example, PaymentProcessor never changes when you add CryptoPaymentStrategy. This is the definition of OCP: open for extension (new strategies), closed for modification (PaymentProcessor)."
      />

      <InteractiveChallenge
        question="Which scenario is a clear OCP violation?"
        options={[
          "Adding a new class that implements an existing interface",
          "Modifying a switch statement or if/else chain every time a new type is added",
          "Creating a subclass that overrides a method",
          "Registering a new event listener on an existing event emitter"
        ]}
        correctIndex={1}
        explanation="A switch statement or if/else chain that checks a type is the canonical OCP violation. Adding a new type requires opening the existing class and modifying the switch. Each modification risks breaking existing cases and requires re-testing the entire class. The fix is to replace the switch with a polymorphic dispatch — a common interface with each type implemented in its own class. Adding a new implementation then requires zero changes to existing code."
      />
    </LessonLayout>
  );
}
