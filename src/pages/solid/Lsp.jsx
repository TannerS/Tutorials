import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Lsp() {
  return (
    <LessonLayout
      title="Liskov Substitution Principle"
      sectionId="solid"
      lessonIndex={3}
      prev={{ path: '/solid/ocp', label: 'Open/Closed Principle' }}
      next={{ path: '/solid/isp', label: 'Interface Segregation' }}
    >
      <h2>Subtypes Must Be Substitutable</h2>
      <p>
        The Liskov Substitution Principle (LSP), formulated by Barbara Liskov
        in 1987, states that objects of a superclass should be replaceable
        with objects of a subclass <strong>without altering the correctness
        </strong> of the program. If class <code>B</code> extends class{' '}
        <code>A</code>, then anywhere <code>A</code> is used,{' '}
        <code>B</code> should work seamlessly.
      </p>

      <InfoBox variant="info" title="Formal Definition">
        <p>
          If <em>S</em> is a subtype of <em>T</em>, then objects of type{' '}
          <em>T</em> may be replaced with objects of type <em>S</em> without
          altering any of the desirable properties of the program
          (correctness, task performed, etc.). Violations typically surface
          as unexpected exceptions, broken invariants, or silent incorrect
          results.
        </p>
      </InfoBox>

      <FlowChart
        title="LSP — Proper Hierarchy Design"
        chart={"graph TD\nSHAPE[Shape interface] --> RECT[Rectangle]\nSHAPE --> SQUARE[Square]\nSHAPE --> CIRCLE[Circle]\nRECT -.->|NOT a parent of| SQUARE\nstyle SQUARE fill:#ff9800,color:#fff\nstyle RECT fill:#2196f3,color:#fff"}
      />

      <h2>Bad Example — Rectangle / Square Problem</h2>
      <p>
        The classic LSP violation: making <code>Square</code> extend{' '}
        <code>Rectangle</code>. Mathematically a square <em>is a</em>{' '}
        rectangle, but in code the substitution breaks because{' '}
        <code>Square</code> overrides setters in a way that violates the
        expected behavior of <code>Rectangle</code>.
      </p>

      <CodeBlock language="java" title="RectangleBad.java">
{`// BAD — Square inherits from Rectangle but changes setter behavior.
public class Rectangle {
    protected int width;
    protected int height;

    public void setWidth(int width) {
        this.width = width;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getArea() {
        return width * height;
    }
}

public class Square extends Rectangle {
    // Overriding setters to enforce equal sides — breaks LSP!
    @Override
    public void setWidth(int width) {
        this.width = width;
        this.height = width; // surprise side-effect
    }

    @Override
    public void setHeight(int height) {
        this.width = height; // surprise side-effect
        this.height = height;
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="RectangleTestBad.java">
{`// BAD — This test passes for Rectangle but FAILS for Square.
public class RectangleTest {
    public static void checkArea(Rectangle r) {
        r.setWidth(5);
        r.setHeight(4);
        // Expected: 5 * 4 = 20
        assert r.getArea() == 20 : "Area should be 20, got " + r.getArea();
    }

    public static void main(String[] args) {
        checkArea(new Rectangle()); // PASSES — area is 20
        checkArea(new Square());    // FAILS  — area is 16 (4 * 4)
    }
}`}
      </CodeBlock>

      <h2>Good Example — Proper Hierarchy</h2>
      <p>
        Instead of forcing an inheritance relationship, define a common
        interface that both shapes implement independently. Each shape
        maintains its own invariants without breaking the contract.
      </p>

      <CodeBlock language="java" title="ShapeGood.java">
{`// GOOD — Common interface; no broken inheritance.
public interface Shape {
    int getArea();
}

public class Rectangle implements Shape {
    private final int width;
    private final int height;

    public Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }

    public int getWidth() { return width; }
    public int getHeight() { return height; }

    @Override
    public int getArea() {
        return width * height;
    }
}

public class Square implements Shape {
    private final int side;

    public Square(int side) {
        this.side = side;
    }

    public int getSide() { return side; }

    @Override
    public int getArea() {
        return side * side;
    }
}`}
      </CodeBlock>

      <p>
        Now any code that depends on <code>Shape</code> works correctly
        regardless of which implementation it receives:
      </p>

      <CodeBlock language="java" title="ShapeServiceGood.java">
{`// GOOD — Works with any Shape implementation — LSP satisfied.
public class ShapeService {
    public void printArea(Shape shape) {
        System.out.println("Area: " + shape.getArea());
    }

    public int totalArea(List<Shape> shapes) {
        return shapes.stream()
            .mapToInt(Shape::getArea)
            .sum();
    }
}

// Usage:
ShapeService service = new ShapeService();
service.printArea(new Rectangle(5, 4)); // Area: 20
service.printArea(new Square(4));       // Area: 16
service.printArea(new Rectangle(3, 7)); // Area: 21`}
      </CodeBlock>

      <h2>Another Real-World Example</h2>
      <p>
        LSP violations also appear when subclasses throw unexpected
        exceptions or silently ignore operations:
      </p>

      <CodeBlock language="java" title="BirdBad.java">
{`// BAD — Ostrich inherits fly() but cannot fly.
public class Bird {
    public void fly() {
        System.out.println("Flying...");
    }
}

public class Ostrich extends Bird {
    @Override
    public void fly() {
        throw new UnsupportedOperationException("Ostriches can't fly!");
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="BirdGood.java">
{`// GOOD — Separate interfaces for different capabilities.
public interface Bird {
    void eat();
}

public interface FlyingBird extends Bird {
    void fly();
}

public class Sparrow implements FlyingBird {
    @Override
    public void eat() { System.out.println("Pecking seeds"); }

    @Override
    public void fly() { System.out.println("Flying high"); }
}

public class Ostrich implements Bird {
    @Override
    public void eat() { System.out.println("Eating plants"); }
    // No fly() method — no LSP violation!
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Signs of LSP Violations">
        <p>
          Watch for these red flags: subclasses that throw{' '}
          <code>UnsupportedOperationException</code>, override methods with
          empty bodies, add <code>instanceof</code> checks in client code, or
          have preconditions that are stricter than the parent class. All of
          these break the substitution contract.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Why does making Square extend Rectangle violate LSP?"
        options={[
          "Squares have fewer methods than Rectangles",
          "Square overrides setters with side-effects that break Rectangle's expected behavior",
          "Java does not allow Square to extend Rectangle",
          "Rectangles cannot be instantiated if Square exists"
        ]}
        correctIndex={1}
        explanation="When Square overrides setWidth() to also set height (and vice versa), it changes the postcondition of the setter. Client code that calls setWidth(5) then setHeight(4) on a Rectangle expects area = 20, but gets 16 from a Square. The subclass is not safely substitutable for the parent — a textbook LSP violation."
        code={"Rectangle r = new Square();\nr.setWidth(5);\nr.setHeight(4);\n// Expected area: 20\n// Actual area:  16 (4 * 4)"}
        language="java"
      />
    </LessonLayout>
  );
}
