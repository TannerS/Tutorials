import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Isp() {
  return (
    <LessonLayout
      title="Interface Segregation Principle"
      sectionId="solid"
      lessonIndex={4}
      prev={{ path: '/solid/lsp', label: 'Liskov Substitution' }}
      next={{ path: '/solid/dip', label: 'Dependency Inversion' }}
    >
      <h2>No Client Should Be Forced to Depend on Methods It Does Not Use</h2>
      <p>
        The Interface Segregation Principle (ISP) states that many small,
        focused interfaces are better than one large, general-purpose
        interface. When a class is forced to implement methods it does not
        need, you create coupling, empty stub implementations, and fragile
        code.
      </p>

      <InfoBox variant="info" title="Robert C. Martin on ISP">
        <p>
          Uncle Bob articulated ISP after working on Xerox printer software.
          A single <code>Job</code> interface had grown so large that every
          change caused a cascade of recompilation. Splitting it into focused
          interfaces solved the problem. The lesson: fat interfaces create
          unnecessary coupling.
        </p>
      </InfoBox>

      <FlowChart
        title="Fat Interface vs. Segregated Interfaces"
        chart={"graph TD\nFAT[Fat Interface: 10 methods] --> ROBOT[Robot]\nFAT --> HUMAN[Human Worker]\nFAT --> INTERN[Intern]\nP[Workable] --> ROBOT2[Robot]\nP --> HUMAN2[Human Worker]\nE[Eatable] --> HUMAN2\nS[Sleepable] --> HUMAN2"}
      />

      <h2>Bad Example — The Fat Interface</h2>
      <p>
        Consider a multi-function machine interface. A simple printer is
        forced to implement fax and scan methods it cannot perform, leading
        to stub methods that throw exceptions or do nothing.
      </p>

      <CodeBlock language="java" title="MultiFunctionMachineBad.java">
{`// BAD — One fat interface forces all implementors to handle
// every method, even when they don't apply.
public interface MultiFunctionDevice {
    void print(Document doc);
    void scan(Document doc);
    void fax(Document doc);
    void staple(Document doc);
    void photocopy(Document doc);
}

// A simple printer only prints, but must implement everything.
public class SimplePrinter implements MultiFunctionDevice {
    @Override
    public void print(Document doc) {
        System.out.println("Printing: " + doc.getTitle());
    }

    @Override
    public void scan(Document doc) {
        throw new UnsupportedOperationException("Cannot scan");
    }

    @Override
    public void fax(Document doc) {
        throw new UnsupportedOperationException("Cannot fax");
    }

    @Override
    public void staple(Document doc) {
        throw new UnsupportedOperationException("Cannot staple");
    }

    @Override
    public void photocopy(Document doc) {
        throw new UnsupportedOperationException("Cannot photocopy");
    }
}`}
      </CodeBlock>

      <p>
        The same anti-pattern appears in worker interfaces:
      </p>

      <CodeBlock language="java" title="WorkerBad.java">
{`// BAD — Robot workers don't eat or sleep, but must implement these.
public interface Worker {
    void work();
    void eat();
    void sleep();
    void attendMeeting();
}

public class RobotWorker implements Worker {
    @Override
    public void work() {
        System.out.println("Robot working 24/7");
    }

    @Override
    public void eat() {
        // Robots don't eat — empty stub!
    }

    @Override
    public void sleep() {
        // Robots don't sleep — empty stub!
    }

    @Override
    public void attendMeeting() {
        // Robots don't attend meetings — empty stub!
    }
}`}
      </CodeBlock>

      <h2>Good Example — Small, Focused Interfaces</h2>
      <p>
        Split the fat interface into cohesive, single-purpose interfaces.
        Each implementor picks only the interfaces that match its
        capabilities.
      </p>

      <CodeBlock language="java" title="SegregatedInterfaces.java">
{`// GOOD — Each interface represents one capability.
public interface Printer {
    void print(Document doc);
}

public interface Scanner {
    void scan(Document doc);
}

public interface Fax {
    void fax(Document doc);
}

public interface Stapler {
    void staple(Document doc);
}

public interface Photocopier {
    void photocopy(Document doc);
}`}
      </CodeBlock>

      <CodeBlock language="java" title="DeviceImplementations.java">
{`// GOOD — SimplePrinter only implements what it can do.
public class SimplePrinter implements Printer {
    @Override
    public void print(Document doc) {
        System.out.println("Printing: " + doc.getTitle());
    }
}

// GOOD — MultiFunctionPrinter composes multiple interfaces.
public class MultiFunctionPrinter
        implements Printer, Scanner, Fax, Photocopier {

    @Override
    public void print(Document doc) {
        System.out.println("Printing: " + doc.getTitle());
    }

    @Override
    public void scan(Document doc) {
        System.out.println("Scanning: " + doc.getTitle());
    }

    @Override
    public void fax(Document doc) {
        System.out.println("Faxing: " + doc.getTitle());
    }

    @Override
    public void photocopy(Document doc) {
        System.out.println("Photocopying: " + doc.getTitle());
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="WorkerGood.java">
{`// GOOD — Segregated worker interfaces.
public interface Workable {
    void work();
}

public interface Eatable {
    void eat();
}

public interface Sleepable {
    void sleep();
}

public interface MeetingAttendee {
    void attendMeeting();
}

// Human implements all relevant interfaces.
public class HumanWorker
        implements Workable, Eatable, Sleepable, MeetingAttendee {

    @Override public void work() { System.out.println("Working"); }
    @Override public void eat() { System.out.println("Eating lunch"); }
    @Override public void sleep() { System.out.println("Sleeping"); }
    @Override public void attendMeeting() { System.out.println("In meeting"); }
}

// Robot only implements what it can do.
public class RobotWorker implements Workable {
    @Override
    public void work() {
        System.out.println("Robot working 24/7");
    }
}`}
      </CodeBlock>

      <p>
        Client code now depends only on the interface it needs:
      </p>

      <CodeBlock language="java" title="ClientCode.java">
{`// GOOD — This service only depends on Printer, not the full device.
public class PrintService {
    private final Printer printer;

    public PrintService(Printer printer) {
        this.printer = printer;
    }

    public void printDocument(Document doc) {
        printer.print(doc);
    }
}

// Works with SimplePrinter or MultiFunctionPrinter — doesn't matter.
PrintService service = new PrintService(new SimplePrinter());
service.printDocument(myDoc);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Composing Interfaces in Java">
        <p>
          Java allows a class to implement multiple interfaces. This makes ISP
          natural in Java: define small interfaces and let implementors
          compose exactly the capabilities they support. This also pairs well
          with Dependency Inversion — clients depend on the narrowest
          interface possible.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the main problem with a fat interface?"
        options={[
          "It makes the interface file too long to read",
          "It forces implementors to depend on methods they don't use, causing empty stubs or exceptions",
          "Java limits the number of methods an interface can have",
          "Fat interfaces run slower than small interfaces at runtime"
        ]}
        correctIndex={1}
        explanation="The core problem with fat interfaces is forced coupling. Implementors must provide bodies for methods they don't need, resulting in UnsupportedOperationException throws or empty no-op stubs. This violates ISP and often LSP as well, since the subtype doesn't truly fulfill the interface contract."
      />
    </LessonLayout>
  );
}
