import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="Design Patterns Overview"
      sectionId="patterns"
      lessonIndex={0}
      prev={null}
      next={{ path: '/patterns/singleton', label: 'Singleton & Factory' }}
    >
      <h2>What Are Design Patterns?</h2>
      <p>
        Design patterns are <strong>reusable solutions to commonly occurring problems</strong> in software design.
        They aren't code you copy-paste — they're templates and strategies that guide how you structure
        your classes and objects to solve specific types of problems elegantly.
      </p>
      <p>
        Think of them like architectural blueprints: an architect doesn't reinvent load-bearing walls
        for every building. Similarly, a software developer shouldn't reinvent the Observer pattern
        every time they need event-driven communication.
      </p>
      <p>
        A good pattern gives you three things: a <strong>name</strong> (shared vocabulary),
        a <strong>structure</strong> (class/interface relationships), and documented
        <strong> tradeoffs</strong> (when to use it and when not to).
      </p>

      <h2>The Gang of Four (GoF)</h2>
      <p>
        In 1994, Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides published
        "Design Patterns: Elements of Reusable Object-Oriented Software." These 23 patterns
        became the foundation of modern software architecture and are still heavily tested
        in technical interviews today.
      </p>

      <InfoBox variant="info" title="Why Design Patterns Matter">
        Design patterns provide a shared vocabulary for developers. When someone says "use a Strategy here,"
        the entire team immediately understands the intent, structure, and tradeoffs — no lengthy explanation needed.
        They are also one of the most commonly tested topics in senior Java developer interviews.
      </InfoBox>

      <h2>Pattern Categories — The Complete List</h2>

      <FlowChart
        title="All 23 GoF Design Patterns by Category"
        chart={"graph TD\n  A[Design Patterns] --> B[Creational - 5 patterns]\n  A --> C[Structural - 7 patterns]\n  A --> D[Behavioral - 11 patterns]\n  B --> B1[Singleton]\n  B --> B2[Factory Method]\n  B --> B3[Abstract Factory]\n  B --> B4[Builder]\n  B --> B5[Prototype]\n  C --> C1[Adapter]\n  C --> C2[Bridge]\n  C --> C3[Composite]\n  C --> C4[Decorator]\n  C --> C5[Facade]\n  C --> C6[Flyweight]\n  C --> C7[Proxy]\n  D --> D1[Chain of Responsibility]\n  D --> D2[Command]\n  D --> D3[Interpreter]\n  D --> D4[Iterator]\n  D --> D5[Mediator]\n  D --> D6[Memento]\n  D --> D7[Observer]\n  D --> D8[State]\n  D --> D9[Strategy]\n  D --> D10[Template Method]\n  D --> D11[Visitor]"}
      />

      <h3>Creational Patterns (5)</h3>
      <p>
        Deal with object creation mechanisms. They abstract the instantiation process,
        making systems independent of how objects are created, composed, and represented.
      </p>
      <ul>
        <li><strong>Singleton:</strong> Ensure a class has only one instance (e.g., connection pool, config manager)</li>
        <li><strong>Factory Method:</strong> Define an interface for creating objects, let subclasses decide which class to instantiate</li>
        <li><strong>Abstract Factory:</strong> Create families of related objects without specifying their concrete classes</li>
        <li><strong>Builder:</strong> Construct complex objects step by step (e.g., query builders, HTTP request builders)</li>
        <li><strong>Prototype:</strong> Create new objects by cloning an existing instance</li>
      </ul>

      <h3>Structural Patterns (7)</h3>
      <p>
        Concerned with how classes and objects are composed to form larger structures.
        They use inheritance and composition to create flexible and efficient structures.
      </p>
      <ul>
        <li><strong>Adapter:</strong> Convert one interface to another (e.g., wrapping a legacy API)</li>
        <li><strong>Bridge:</strong> Separate abstraction from implementation so both can vary independently</li>
        <li><strong>Composite:</strong> Treat individual objects and compositions uniformly (e.g., file/folder tree)</li>
        <li><strong>Decorator:</strong> Add behavior to objects dynamically (e.g., Java I/O streams, middleware)</li>
        <li><strong>Facade:</strong> Provide a simplified interface to a complex subsystem</li>
        <li><strong>Flyweight:</strong> Share common state to support large numbers of fine-grained objects</li>
        <li><strong>Proxy:</strong> Control access to an object (e.g., lazy loading, security, caching)</li>
      </ul>

      <h3>Behavioral Patterns (11)</h3>
      <p>
        Focus on communication between objects. They define how objects interact and
        distribute responsibility among them.
      </p>
      <ul>
        <li><strong>Chain of Responsibility:</strong> Pass requests along a chain of handlers (e.g., middleware, servlet filters)</li>
        <li><strong>Command:</strong> Encapsulate a request as an object (e.g., undo/redo, task queues)</li>
        <li><strong>Interpreter:</strong> Define a grammar and interpret sentences in that language</li>
        <li><strong>Iterator:</strong> Access elements of a collection sequentially without exposing internals</li>
        <li><strong>Mediator:</strong> Centralize complex communication between objects (e.g., chat room, event bus)</li>
        <li><strong>Memento:</strong> Capture and restore an object's state (e.g., undo, snapshots)</li>
        <li><strong>Observer:</strong> Notify dependents when state changes (e.g., event listeners, pub/sub)</li>
        <li><strong>State:</strong> Alter behavior when internal state changes (e.g., order status, workflow)</li>
        <li><strong>Strategy:</strong> Define a family of interchangeable algorithms (e.g., sorting, payment, auth)</li>
        <li><strong>Template Method:</strong> Define the skeleton of an algorithm, let subclasses fill in steps</li>
        <li><strong>Visitor:</strong> Add operations to objects without modifying their classes</li>
      </ul>

      <h2>Which Pattern Should I Use?</h2>

      <FlowChart
        title="Pattern Decision Tree"
        chart={"graph TD\n  Q{What is the problem?} -->|Creating objects| C1{How complex?}\n  Q -->|Composing structures| S1{What relationship?}\n  Q -->|Object communication| B1{What kind?}\n  C1 -->|Single instance needed| P1[Singleton]\n  C1 -->|Multiple types at runtime| P2[Factory Method]\n  C1 -->|Complex construction steps| P3[Builder]\n  S1 -->|Incompatible interfaces| P4[Adapter]\n  S1 -->|Simplify a complex API| P5[Facade]\n  S1 -->|Add behavior dynamically| P6[Decorator]\n  S1 -->|Tree structures| P7[Composite]\n  B1 -->|Event notification| P8[Observer]\n  B1 -->|Interchangeable algorithms| P9[Strategy]\n  B1 -->|Request pipeline| P10[Chain of Responsibility]\n  B1 -->|State-dependent behavior| P11[State]\n  style Q fill:#2a1f44,stroke:#a78bfa\n  style P1 fill:#1a3329,stroke:#4ade80\n  style P2 fill:#1a3329,stroke:#4ade80\n  style P3 fill:#1a3329,stroke:#4ade80\n  style P4 fill:#1a2744,stroke:#5b9cf6\n  style P5 fill:#1a2744,stroke:#5b9cf6\n  style P6 fill:#1a2744,stroke:#5b9cf6\n  style P7 fill:#1a2744,stroke:#5b9cf6\n  style P8 fill:#3d2f14,stroke:#d97706\n  style P9 fill:#3d2f14,stroke:#d97706\n  style P10 fill:#3d2f14,stroke:#d97706\n  style P11 fill:#3d2f14,stroke:#d97706"}
      />

      <h2>When to Use Patterns</h2>

      <CodeBlock language="java" title="Pattern Applied: Strategy for Payment" showLineNumbers={true}>
{`// WITHOUT a pattern - rigid, hard to extend
public class PaymentService {
    public void pay(String type, double amount) {
        if (type.equals("CREDIT_CARD")) {
            // credit card logic
        } else if (type.equals("PAYPAL")) {
            // paypal logic
        } else if (type.equals("CRYPTO")) {
            // crypto logic - added 6 months later
        }
        // Every new payment method modifies this class!
    }
}

// WITH Strategy pattern - open for extension, closed for modification
public interface PaymentStrategy {
    void pay(double amount);
}

public class CreditCardPayment implements PaymentStrategy {
    public void pay(double amount) { /* credit card logic */ }
}

public class PayPalPayment implements PaymentStrategy {
    public void pay(double amount) { /* paypal logic */ }
}

public class PaymentService {
    private final PaymentStrategy strategy;

    public PaymentService(PaymentStrategy strategy) {
        this.strategy = strategy;
    }

    public void processPayment(double amount) {
        strategy.pay(amount); // No if/else chains!
    }
}`}
      </CodeBlock>

      <h2>Patterns in the Real World</h2>

      <InfoBox variant="tip" title="Patterns You Use Every Day (Without Realizing)">
        <p><strong>Observer:</strong> React's useState, JavaScript event listeners, Spring's ApplicationEvent</p>
        <p><strong>Strategy:</strong> Java's Comparator, Spring's AuthenticationProvider, sorting algorithms</p>
        <p><strong>Decorator:</strong> Java I/O streams (BufferedReader wrapping FileReader), Express middleware, Python decorators</p>
        <p><strong>Factory:</strong> Spring's BeanFactory, JDBC DriverManager.getConnection(), React.createElement()</p>
        <p><strong>Iterator:</strong> Java's for-each loop, Python generators, JavaScript Symbol.iterator</p>
        <p><strong>Proxy:</strong> Spring AOP (@Transactional, @Cacheable), JPA lazy loading, JavaScript Proxy object</p>
        <p><strong>Template Method:</strong> JUnit's test lifecycle (setUp → test → tearDown), Spring's JdbcTemplate</p>
        <p><strong>Chain of Responsibility:</strong> Express/Koa middleware, Java servlet filters, Spring Security filter chain</p>
      </InfoBox>

      <h2>Anti-Patterns: What NOT to Do</h2>

      <InfoBox variant="warning" title="Pattern Overuse">
        Don't apply patterns just because you can. A pattern adds abstraction, and abstraction
        has a cost. If your problem is simple, a simple solution is better. "Patternitis" — applying
        patterns everywhere — leads to over-engineered code that's harder to understand.
      </InfoBox>

      <InfoBox variant="danger" title="Common Anti-Patterns to Avoid">
        <p><strong>God Object:</strong> One class that knows everything and does everything. Violates Single Responsibility. Break it up.</p>
        <p><strong>Spaghetti Code:</strong> No structure, deeply nested logic, tangled dependencies. Usually means missing abstractions.</p>
        <p><strong>Golden Hammer:</strong> Using the same pattern/tool for everything. "When all you have is a hammer, everything looks like a nail."</p>
        <p><strong>Lava Flow:</strong> Dead code that nobody dares to remove because nobody understands what it does. Delete it — that's what version control is for.</p>
        <p><strong>Copy-Paste Programming:</strong> Duplicating code instead of abstracting. Leads to bugs that get fixed in one copy but not others.</p>
      </InfoBox>

      <CodeBlock language="java" title="Anti-Pattern: Unnecessary Abstraction" showLineNumbers={true}>
{`// OVER-ENGINEERED: Factory for a single implementation
public interface GreeterFactory {
    Greeter createGreeter();
}

public class DefaultGreeterFactory implements GreeterFactory {
    public Greeter createGreeter() {
        return new SimpleGreeter();
    }
}

// JUST DO THIS INSTEAD:
Greeter greeter = new SimpleGreeter();

// Use a Factory when:
// - You have multiple implementations chosen at runtime
// - Object creation is complex
// - You need to decouple client from concrete classes`}
      </CodeBlock>

      <h2>Choosing the Right Pattern</h2>
      <p>Ask yourself these questions:</p>
      <ul>
        <li><strong>Is the problem about creating objects?</strong> → Creational pattern</li>
        <li><strong>Is the problem about composing structures?</strong> → Structural pattern</li>
        <li><strong>Is the problem about object communication?</strong> → Behavioral pattern</li>
        <li><strong>Is there only one variation?</strong> → Maybe you don't need a pattern yet (YAGNI)</li>
        <li><strong>Will this code change frequently?</strong> → Patterns help isolate change</li>
        <li><strong>Are you the only developer?</strong> → Patterns help teams communicate, but may be overkill for solo projects</li>
      </ul>

      <InteractiveChallenge
        question="Which category of design pattern would you use to ensure only one database connection pool exists in your application?"
        options={[
          "Behavioral - it's about how objects communicate",
          "Structural - it's about composing objects together",
          "Creational - it's about controlling object creation",
          "None - patterns aren't needed for this"
        ]}
        correctIndex={2}
        explanation="Singleton is a Creational pattern that ensures a class has only one instance. A database connection pool is a classic use case — you want exactly one pool managing all connections."
      />

      <h2>Pattern Complexity Guide</h2>

      <InfoBox variant="note" title="Start Simple, Refactor to Patterns">
        <p>
          Don't start with a pattern. Start with the simplest code that works, then <strong>refactor
          toward a pattern</strong> when the code starts showing the symptoms the pattern solves.
          Two concrete implementations? Maybe it's time for a Strategy. Third switch case added?
          Consider a Factory. The need should be obvious, not theoretical.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Pattern Applied: Observer in Event Systems" showLineNumbers={true}>
{`// Observer pattern: decouple event producers from consumers
public interface OrderEventListener {
    void onOrderPlaced(Order order);
}

public class InventoryService implements OrderEventListener {
    public void onOrderPlaced(Order order) {
        // reduce stock for each item
    }
}

public class NotificationService implements OrderEventListener {
    public void onOrderPlaced(Order order) {
        // send confirmation email
    }
}

public class OrderService {
    private final List<OrderEventListener> listeners = new ArrayList<>();

    public void addListener(OrderEventListener listener) {
        listeners.add(listener);
    }

    public void placeOrder(Order order) {
        // ... save order ...
        // Notify all listeners — OrderService doesn't know or care
        // what happens after the order is placed
        listeners.forEach(l -> l.onOrderPlaced(order));
    }
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Your Express.js app uses app.use(cors()), app.use(auth()), app.use(logger()). Which design pattern does this middleware pipeline represent?"}
        options={[
          "Observer — each middleware observes the request",
          "Decorator — each middleware wraps the next one",
          "Chain of Responsibility — each handler decides to process or pass along",
          "Strategy — each middleware is an interchangeable algorithm"
        ]}
        correctIndex={2}
        explanation="Middleware pipelines are a textbook Chain of Responsibility pattern. Each middleware in the chain can process the request, modify it, or pass it to the next handler via next(). The request flows through the chain until one handler completes the response."
      />
    </LessonLayout>
  );
}
