import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function PatternsDecorator() {
  return (
    <LessonLayout
      title="Decorator Pattern"
      sectionId="patterns"
      lessonIndex={3}
      prev={{ path: "/patterns/strategy", label: "Strategy Pattern" }}
      next={{ path: "/patterns/builder", label: "Builder Pattern" }}
    >
      <p>The Decorator pattern attaches additional responsibilities to an object dynamically by wrapping it in decorator objects. It is an alternative to subclassing for extending functionality — instead of creating an explosion of subclasses, you compose decorators at runtime.</p>

      <h2>The Subclass Explosion Problem</h2>
      <p>Imagine a coffee system: Coffee, CoffeeWithMilk, CoffeeWithSugar, CoffeeWithMilkAndSugar, EspressoWithMilk, EspressoWithSugarAndWhip... Every combination requires a new subclass. Decorator solves this by composing features.</p>

      <CodeBlock language="java" title="Decorator Pattern — Coffee Example">
{`// Component interface
public interface Coffee {
    String getDescription();
    double getCost();
}

// Concrete component
public class Espresso implements Coffee {
    public String getDescription() { return "Espresso"; }
    public double getCost() { return 1.99; }
}

// Base decorator — implements Coffee, wraps a Coffee
public abstract class CoffeeDecorator implements Coffee {
    protected final Coffee wrapped;
    public CoffeeDecorator(Coffee coffee) { this.wrapped = coffee; }
    public String getDescription() { return wrapped.getDescription(); }
    public double getCost() { return wrapped.getCost(); }
}

// Concrete decorators
public class Milk extends CoffeeDecorator {
    public Milk(Coffee coffee) { super(coffee); }
    public String getDescription() { return wrapped.getDescription() + ", Milk"; }
    public double getCost() { return wrapped.getCost() + 0.25; }
}
public class Sugar extends CoffeeDecorator {
    public Sugar(Coffee coffee) { super(coffee); }
    public String getDescription() { return wrapped.getDescription() + ", Sugar"; }
    public double getCost() { return wrapped.getCost() + 0.10; }
}
public class WhipCream extends CoffeeDecorator {
    public WhipCream(Coffee coffee) { super(coffee); }
    public String getDescription() { return wrapped.getDescription() + ", Whip"; }
    public double getCost() { return wrapped.getCost() + 0.50; }
}

// Usage — compose at runtime
Coffee order = new WhipCream(new Sugar(new Milk(new Espresso())));
System.out.println(order.getDescription()); // Espresso, Milk, Sugar, Whip
System.out.println(order.getCost());        // 2.84`}
      </CodeBlock>

      <FlowChart
        title="Decorator Wrapping Structure"
        chart={"graph LR\n  A[Client] --> B[WhipCream]\n  B --> C[Sugar]\n  C --> D[Milk]\n  D --> E[Espresso]\n  style E fill:#22d3ee20\n  style B fill:#a78bfa20\n  style C fill:#a78bfa20\n  style D fill:#a78bfa20"}
      />

      <h2>Java I/O is Decorator</h2>
      <p>The Java I/O library is the most famous real-world use of Decorator. InputStream is the component; BufferedInputStream, GZIPInputStream, and CipherInputStream are decorators that add buffering, compression, and encryption respectively.</p>

      <CodeBlock language="java" title="Java I/O — Classic Decorator in Action">
{`// Stacking I/O decorators
InputStream raw        = new FileInputStream("data.txt.gz");
InputStream unzipped   = new GZIPInputStream(raw);        // adds decompression
InputStream buffered   = new BufferedInputStream(unzipped); // adds buffering
Reader      reader     = new InputStreamReader(buffered);   // adds charset decoding
BufferedReader lines   = new BufferedReader(reader);        // adds line reading

// Each decorator adds one responsibility
// Compose to get: file + decompression + buffering + charset + line API
String line;
while ((line = lines.readLine()) != null) {
    System.out.println(line);
}
lines.close();

// Try-with-resources is cleaner:
try (var br = new BufferedReader(
                new InputStreamReader(
                  new GZIPInputStream(
                    new FileInputStream("data.txt.gz"))))) {
    br.lines().forEach(System.out::println);
}`}
      </CodeBlock>

      <h2>Decorator for Cross-Cutting Concerns</h2>

      <CodeBlock language="java" title="Logging and Metrics Decorator">
{`public interface UserRepository {
    User findById(long id);
    void save(User user);
}

// Real implementation
public class JpaUserRepository implements UserRepository {
    public User findById(long id) { /* JPA query */ return null; }
    public void save(User user)   { /* JPA save */ }
}

// Logging decorator
public class LoggingUserRepository implements UserRepository {
    private final UserRepository delegate;
    private final Logger log = LoggerFactory.getLogger(getClass());

    public LoggingUserRepository(UserRepository delegate) {
        this.delegate = delegate;
    }

    public User findById(long id) {
        log.info("findById({})", id);
        long start = System.nanoTime();
        User result = delegate.findById(id);
        log.info("findById({}) took {}ms", id, (System.nanoTime()-start)/1_000_000);
        return result;
    }

    public void save(User user) {
        log.info("save({})", user.getId());
        delegate.save(user);
        log.info("save complete");
    }
}

// Wire: logging wraps JPA
UserRepository repo = new LoggingUserRepository(new JpaUserRepository());`}
      </CodeBlock>

      <InfoBox variant="note" title="Decorator vs Inheritance">
        <p>Inheritance is static — you choose a subclass at compile time. Decorator is dynamic — you compose behaviors at runtime. Also, Decorator avoids the fragile base class problem: decorators don't override methods, they delegate. This makes them much safer to stack.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Which Java library is a classic real-world example of the Decorator pattern?"
        options={["java.util.Collections", "java.io streams", "java.lang.Math", "java.util.concurrent"]}
        correctIndex={1}
        explanation="Java I/O uses Decorator extensively. InputStream is the component interface, and classes like BufferedInputStream, GZIPInputStream, and CipherInputStream are decorators that wrap an InputStream to add buffering, compression, and encryption. You compose them by nesting constructors."
      />

    </LessonLayout>
  );
}
