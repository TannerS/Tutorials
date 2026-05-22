import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function PatternsIntro() {
  return (
    <LessonLayout
      title="Design Patterns Overview"
      sectionId="patterns"
      lessonIndex={0}
      prev={null}
      next={{ path: "/patterns/singleton", label: "Singleton Pattern" }}
    >
      <p>Design patterns are proven, reusable solutions to commonly occurring problems in software design. They were popularized by the "Gang of Four" (GoF) book published in 1994, which catalogued 23 patterns across three categories: Creational, Structural, and Behavioral.</p>

      <h2>Why Patterns Matter</h2>
      <p>Patterns give developers a shared vocabulary for discussing design decisions. When a senior engineer says "use a Strategy here," everyone on the team understands the intent immediately — decoupling the algorithm from the context that uses it.</p>

      <FlowChart
        title="GoF Pattern Categories"
        chart={"graph TD\n  A[Design Patterns] --> B[Creational]\n  A --> C[Structural]\n  A --> D[Behavioral]\n  B --> E[Singleton]\n  B --> F[Builder]\n  B --> G[Factory]\n  C --> H[Decorator]\n  C --> I[Composite]\n  C --> J[Proxy]\n  D --> K[Strategy]\n  D --> L[Observer]\n  D --> M[Command]"}
      />

      <h2>Pattern Structure</h2>
      <p>Every pattern has four essential elements: a name, a problem it solves, a solution (structure of classes/objects), and the consequences (trade-offs). Understanding all four is key to applying them correctly.</p>

      <CodeBlock language="java" title="Pattern Template Concept">
{`// Every pattern has:
// 1. Intent - what problem it solves
// 2. Motivation - why you'd use it
// 3. Structure - UML / class diagram
// 4. Participants - roles each class plays
// 5. Collaborations - how participants work together
// 6. Consequences - trade-offs

// Example: identifying a pattern need
// BAD: tightly coupled
class OrderService {
    private MySQLDatabase db = new MySQLDatabase(); // concrete dep
    public void save(Order o) { db.insert(o); }
}

// GOOD: Strategy / Dependency Injection
interface Database { void insert(Object o); }
class OrderService {
    private final Database db; // abstraction
    public OrderService(Database db) { this.db = db; }
    public void save(Order o) { db.insert(o); }
}`}
      </CodeBlock>

      <h2>Creational Patterns</h2>
      <p>Creational patterns deal with object creation, decoupling the system from how objects are instantiated and composed. Key patterns include Singleton (one instance), Factory Method (subclass decides), Abstract Factory (families of objects), Builder (complex construction), and Prototype (clone).</p>

      <h2>Structural Patterns</h2>
      <p>Structural patterns describe how to assemble objects and classes into larger structures. Adapter converts incompatible interfaces; Bridge separates abstraction from implementation; Composite treats single objects and compositions uniformly; Decorator adds responsibilities dynamically; Facade provides a simplified interface; Flyweight shares fine-grained objects; Proxy controls access to an object.</p>

      <h2>Behavioral Patterns</h2>
      <p>Behavioral patterns focus on communication and responsibility between objects. Strategy defines interchangeable algorithms; Observer defines one-to-many dependencies; Command encapsulates requests; Iterator provides sequential access; Template Method defines algorithm skeletons; Chain of Responsibility passes requests along a chain; State alters behavior when state changes.</p>

      <CodeBlock language="java" title="Recognizing Pattern Opportunities">
{`// SMELL: switch/if-else on type → Strategy or State
class PaymentProcessor {
    void process(Payment p) {
        if (p.type.equals("CREDIT")) { /* ... */ }
        else if (p.type.equals("PAYPAL")) { /* ... */ }
        else if (p.type.equals("CRYPTO")) { /* ... */ }
        // adding new types means editing this class → OCP violation
    }
}

// PATTERN: Strategy
interface PaymentStrategy { void process(Payment p); }
class CreditCardStrategy  implements PaymentStrategy { ... }
class PayPalStrategy      implements PaymentStrategy { ... }
class CryptoStrategy      implements PaymentStrategy { ... }

class PaymentProcessor {
    private final Map<String, PaymentStrategy> strategies;
    void process(Payment p) {
        strategies.get(p.type).process(p);
    }
}
// Adding new type = add new class, zero changes to processor`}
      </CodeBlock>

      <InfoBox variant="tip" title="Patterns vs Anti-Patterns">
        <p>A design pattern is a good solution. An anti-pattern is a common but bad solution. Over-engineering with patterns where simple code suffices is itself an anti-pattern. Apply patterns only when the problem they solve is actually present in your code.</p>
      </InfoBox>

      <h2>Pattern Selection Guide</h2>
      <p>When you notice algorithmic variation, reach for Strategy. When object creation is complex, use Builder. When you need a single shared resource, consider Singleton. When adding features without subclassing, use Decorator. When you need to notify multiple objects, use Observer. When commands need to be queued or undone, use Command.</p>

      <CodeBlock language="java" title="Observer Pattern Preview">
{`// One-to-many dependency — when one object changes,
// all dependents are notified automatically

interface Observer { void update(String event, Object data); }

class EventBus {
    private final Map<String, List<Observer>> listeners = new HashMap<>();

    public void subscribe(String event, Observer observer) {
        listeners.computeIfAbsent(event, k -> new ArrayList<>()).add(observer);
    }

    public void publish(String event, Object data) {
        listeners.getOrDefault(event, List.of())
                 .forEach(o -> o.update(event, data));
    }
}

// Usage
EventBus bus = new EventBus();
bus.subscribe("ORDER_PLACED", (event, data) ->
    System.out.println("Email service: order " + data));
bus.subscribe("ORDER_PLACED", (event, data) ->
    System.out.println("Inventory: reserving stock for " + data));

bus.publish("ORDER_PLACED", "ORDER-42");
// Both subscribers notified automatically`}
      </CodeBlock>

      <InteractiveChallenge
        question="Which GoF category does the Builder pattern belong to?"
        options={["Behavioral", "Structural", "Creational", "Architectural"]}
        correctIndex={2}
        explanation="Builder is a Creational pattern — it deals with object creation, specifically constructing complex objects step by step. Creational patterns include Singleton, Factory Method, Abstract Factory, Builder, and Prototype."
      />

      <InteractiveChallenge
        question="When you see a long if/else chain switching on an object's type to vary behavior, which pattern is most appropriate?"
        options={["Singleton", "Strategy", "Decorator", "Facade"]}
        correctIndex={1}
        explanation="The Strategy pattern replaces conditional logic with polymorphism. Each branch of the if/else becomes a concrete Strategy implementation. The context holds a reference to a Strategy interface and delegates behavior to it."
      />

    </LessonLayout>
  );
}
