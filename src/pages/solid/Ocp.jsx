import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Ocp() {
  return (
    <LessonLayout
      title="Open/Closed Principle"
      sectionId="solid"
      lessonIndex={2}
      prev={{ path: '/solid/srp', label: 'Single Responsibility' }}
      next={{ path: '/solid/lsp', label: 'Liskov Substitution' }}
    >
      <h2>Open for Extension, Closed for Modification</h2>
      <p>
        The Open/Closed Principle (OCP) states that software entities —
        classes, modules, functions — should be <strong>open for
        extension</strong> but <strong>closed for modification</strong>.
        You should be able to add new behavior to a system without changing
        the existing, tested code.
      </p>

      <InfoBox variant="info" title="Bertrand Meyer's Formulation">
        <p>
          OCP was originally defined by Bertrand Meyer in 1988. Robert C.
          Martin later popularized a polymorphism-based interpretation: use
          abstractions (interfaces and abstract classes) so that new
          functionality can be plugged in without editing existing source
          files.
        </p>
      </InfoBox>

      <FlowChart
        title="OCP — Closed Code vs. Open Extension Points"
        chart={"graph TD\nCLIENT[Client Code] --> ABSTRACTION[Abstraction / Interface]\nABSTRACTION --> IMPL_A[Implementation A - existing]\nABSTRACTION --> IMPL_B[Implementation B - existing]\nABSTRACTION --> IMPL_C[Implementation C - NEW]\nstyle IMPL_C fill:#4caf50,color:#fff"}
      />

      <h2>Bad Example — Switch/If Chains</h2>
      <p>
        The following discount calculator uses a chain of if/else statements.
        Every time a new customer type is added, this class must be modified —
        violating OCP and risking regressions in the existing logic.
      </p>

      <CodeBlock language="java" title="DiscountCalculatorBad.java">
{`// BAD — Every new customer type requires modifying this method.
public class DiscountCalculator {
    public double calculateDiscount(Order order) {
        if (order.getCustomerType().equals("Regular")) {
            return order.getTotal() * 0.05;
        } else if (order.getCustomerType().equals("Premium")) {
            return order.getTotal() * 0.10;
        } else if (order.getCustomerType().equals("VIP")) {
            return order.getTotal() * 0.20;
        }
        // Adding "Employee" discount? Must edit this class again!
        return 0;
    }
}`}
      </CodeBlock>

      <p>
        A similar problem appears in shape-area calculations — the classic
        example of OCP violation:
      </p>

      <CodeBlock language="java" title="AreaCalculatorBad.java">
{`// BAD — Adding a new shape means editing this method.
public class AreaCalculator {
    public double calculateArea(Object shape) {
        if (shape instanceof Circle) {
            Circle c = (Circle) shape;
            return Math.PI * c.getRadius() * c.getRadius();
        } else if (shape instanceof Rectangle) {
            Rectangle r = (Rectangle) shape;
            return r.getWidth() * r.getHeight();
        }
        // New shape? Must modify this class!
        throw new IllegalArgumentException("Unknown shape");
    }
}`}
      </CodeBlock>

      <h2>Good Example — Strategy Pattern / Polymorphism</h2>
      <p>
        By defining an abstraction (interface) for discount strategies, we can
        add new customer types without touching the existing calculator. The
        existing code is <em>closed</em> for modification; new strategies{' '}
        <em>extend</em> the behavior.
      </p>

      <CodeBlock language="java" title="DiscountStrategy.java">
{`// GOOD — Define an abstraction for discount behavior.
public interface DiscountStrategy {
    double calculateDiscount(Order order);
}

public class RegularDiscount implements DiscountStrategy {
    @Override
    public double calculateDiscount(Order order) {
        return order.getTotal() * 0.05;
    }
}

public class PremiumDiscount implements DiscountStrategy {
    @Override
    public double calculateDiscount(Order order) {
        return order.getTotal() * 0.10;
    }
}

public class VipDiscount implements DiscountStrategy {
    @Override
    public double calculateDiscount(Order order) {
        return order.getTotal() * 0.20;
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="DiscountCalculatorGood.java">
{`// GOOD — Calculator is closed for modification. New types are
// added by creating a new DiscountStrategy implementation.
public class DiscountCalculator {
    private final Map<String, DiscountStrategy> strategies;

    public DiscountCalculator(Map<String, DiscountStrategy> strategies) {
        this.strategies = strategies;
    }

    public double calculateDiscount(Order order) {
        DiscountStrategy strategy = strategies.get(
            order.getCustomerType());
        if (strategy == null) {
            throw new IllegalArgumentException(
                "No strategy for: " + order.getCustomerType());
        }
        return strategy.calculateDiscount(order);
    }
}

// Adding "Employee" discount? Just create a new class:
public class EmployeeDiscount implements DiscountStrategy {
    @Override
    public double calculateDiscount(Order order) {
        return order.getTotal() * 0.30;
    }
}`}
      </CodeBlock>

      <p>
        The shape example benefits from the same approach — let each shape
        know how to compute its own area:
      </p>

      <CodeBlock language="java" title="ShapeGood.java">
{`// GOOD — Each shape implements its own area calculation.
public interface Shape {
    double area();
}

public class Circle implements Shape {
    private final double radius;

    public Circle(double radius) { this.radius = radius; }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public class Rectangle implements Shape {
    private final double width;
    private final double height;

    public Rectangle(double w, double h) { this.width = w; this.height = h; }

    @Override
    public double area() {
        return width * height;
    }
}

// GOOD — AreaCalculator never needs to change for new shapes.
public class AreaCalculator {
    public double totalArea(List<Shape> shapes) {
        return shapes.stream()
            .mapToDouble(Shape::area)
            .sum();
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to Apply OCP">
        <p>
          You do not need to anticipate every future extension up front. Apply
          OCP when you notice a pattern of repeated modifications to the same
          class for similar reasons. The first time you add a second
          if-branch, consider whether an abstraction would serve you better.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Which technique best achieves the Open/Closed Principle?"
        options={[
          "Using switch statements to handle every possible case",
          "Making all fields public so subclasses can override behavior",
          "Defining abstractions (interfaces) that new implementations can extend",
          "Marking all classes as final to prevent modification"
        ]}
        correctIndex={2}
        explanation="OCP is achieved by programming to abstractions. When behavior is behind an interface, new implementations can be added (open for extension) without changing the client code that depends on the interface (closed for modification). Switch statements require editing existing code for every new case — the opposite of OCP."
      />
    </LessonLayout>
  );
}
