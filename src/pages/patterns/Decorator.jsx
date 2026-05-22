import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Decorator() {
  return (
    <LessonLayout
      title="Decorator & Adapter Patterns"
      sectionId="patterns"
      lessonIndex={3}
      prev={{ path: '/patterns/strategy', label: 'Strategy & Observer' }}
      next={{ path: '/patterns/builder', label: 'Builder & Prototype' }}
    >
      <h2>Decorator Pattern</h2>
      <p>
        Attaches additional responsibilities to an object dynamically. Decorators provide a
        flexible alternative to subclassing for extending functionality. Java's I/O streams
        are the classic real-world example.
      </p>

      <FlowChart
        title="Decorator Pattern Structure"
        chart={"graph TD\n  A[Component Interface] --> B[ConcreteComponent]\n  A --> C[BaseDecorator]\n  C --> D[DecoratorA]\n  C --> E[DecoratorB]\n  C -->|wraps| A"}
      />

      <CodeBlock language="java" title="Decorator - Java I/O Streams Example" showLineNumbers={true}>
{`// This is how Java I/O actually works - layers of decorators:
InputStream raw = new FileInputStream("data.txt");        // Base component
InputStream buffered = new BufferedInputStream(raw);       // Decorator: adds buffering
InputStream gzip = new GZIPInputStream(buffered);          // Decorator: adds decompression
Reader reader = new InputStreamReader(gzip, "UTF-8");      // Decorator: adds char decoding

// Each layer adds behavior without modifying the original
// You can compose them in any combination!`}
      </CodeBlock>

      <CodeBlock language="java" title="Custom Decorator - Logging HTTP Client" showLineNumbers={true}>
{`// Component interface
public interface HttpClient {
    HttpResponse send(HttpRequest request);
}

// Concrete component
public class DefaultHttpClient implements HttpClient {
    @Override
    public HttpResponse send(HttpRequest request) {
        // Actual HTTP call
        return executeHttp(request);
    }
}

// Base decorator
public abstract class HttpClientDecorator implements HttpClient {
    protected final HttpClient delegate;

    protected HttpClientDecorator(HttpClient delegate) {
        this.delegate = delegate;
    }
}

// Concrete decorator: logging
public class LoggingHttpClient extends HttpClientDecorator {
    private static final Logger log = LoggerFactory.getLogger(LoggingHttpClient.class);

    public LoggingHttpClient(HttpClient delegate) {
        super(delegate);
    }

    @Override
    public HttpResponse send(HttpRequest request) {
        log.info("Sending {} to {}", request.getMethod(), request.getUri());
        long start = System.currentTimeMillis();

        HttpResponse response = delegate.send(request);

        long elapsed = System.currentTimeMillis() - start;
        log.info("Received {} in {}ms", response.getStatus(), elapsed);
        return response;
    }
}

// Concrete decorator: retry
public class RetryingHttpClient extends HttpClientDecorator {
    private final int maxRetries;

    public RetryingHttpClient(HttpClient delegate, int maxRetries) {
        super(delegate);
        this.maxRetries = maxRetries;
    }

    @Override
    public HttpResponse send(HttpRequest request) {
        int attempts = 0;
        while (true) {
            try {
                return delegate.send(request);
            } catch (HttpException e) {
                if (++attempts >= maxRetries) throw e;
                sleep(attempts * 1000L); // Exponential backoff
            }
        }
    }
}

// Compose decorators - order matters!
HttpClient client = new LoggingHttpClient(
    new RetryingHttpClient(
        new DefaultHttpClient(), 3
    )
);
// Logs -> Retries -> Actual HTTP call`}
      </CodeBlock>

      <InfoBox variant="tip" title="Decorator vs Inheritance">
        Inheritance is static — you choose the behavior at compile time. Decorator is dynamic —
        you compose behavior at runtime. With 5 optional features, inheritance needs 2^5 = 32 subclasses.
        Decorator needs just 5 decorator classes that can be combined freely.
      </InfoBox>

      <h2>Adapter Pattern</h2>
      <p>
        Converts the interface of a class into another interface that clients expect.
        Adapter lets classes work together that couldn't otherwise because of incompatible interfaces.
        It's like a power adapter when you travel abroad.
      </p>

      <FlowChart
        title="Adapter Pattern Structure"
        chart={"graph LR\n  A[Client] -->|uses| B[Target Interface]\n  B --> C[Adapter]\n  C -->|delegates to| D[Adaptee / Legacy System]"}
      />

      <CodeBlock language="java" title="Adapter - Integrating Legacy Payment System" showLineNumbers={true}>
{`// Your application's expected interface (Target)
public interface PaymentProcessor {
    PaymentResult charge(String customerId, BigDecimal amount, Currency currency);
}

// Legacy third-party SDK you can't modify (Adaptee)
public class LegacyPaymentGateway {
    public int makePayment(String acctNum, double amountInCents, String currCode) {
        // Returns: 0 = success, 1 = declined, 2 = error
        // Uses doubles, cents, and string currency codes
    }
}

// Adapter - translates between your interface and the legacy one
public class LegacyPaymentAdapter implements PaymentProcessor {
    private final LegacyPaymentGateway legacy;
    private final AccountMappingService accountService;

    public LegacyPaymentAdapter(LegacyPaymentGateway legacy,
                                AccountMappingService accountService) {
        this.legacy = legacy;
        this.accountService = accountService;
    }

    @Override
    public PaymentResult charge(String customerId, BigDecimal amount, Currency currency) {
        // Adapt: customerId -> account number
        String acctNum = accountService.getAccountNumber(customerId);

        // Adapt: BigDecimal dollars -> double cents
        double amountInCents = amount.multiply(BigDecimal.valueOf(100)).doubleValue();

        // Adapt: Currency enum -> string code
        String currCode = currency.getCurrencyCode();

        // Delegate to legacy system
        int result = legacy.makePayment(acctNum, amountInCents, currCode);

        // Adapt: int code -> PaymentResult
        return switch (result) {
            case 0 -> PaymentResult.success();
            case 1 -> PaymentResult.declined("Card declined");
            default -> PaymentResult.error("Gateway error: " + result);
        };
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Adapter in the Wild">
        You use adapters constantly in enterprise Java: SLF4J adapts various logging frameworks,
        Spring's HandlerAdapter adapts different controller types, and JDBC itself is an adapter
        between your code and vendor-specific database drivers.
      </InfoBox>

      <InteractiveChallenge
        question="What is the key structural difference between Decorator and Adapter?"
        options={[
          "Decorator uses inheritance while Adapter uses composition",
          "Decorator enhances existing behavior while Adapter translates between incompatible interfaces",
          "Decorator is a structural pattern while Adapter is behavioral",
          "Decorator works with multiple objects while Adapter works with only one"
        ]}
        correctIndex={1}
        explanation="Both use composition (wrapping another object). The intent differs: Decorator adds/enhances behavior while keeping the same interface. Adapter converts one interface into another to make incompatible systems work together. Both are structural patterns."
      />
    </LessonLayout>
  );
}
