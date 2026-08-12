import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Oop() {
  return (
    <LessonLayout
      title="OOP Fundamentals"
      sectionId="java"
      lessonIndex={2}
      prev={{ path: '/java/syntax', label: 'Syntax & Data Types' }}
      next={{ path: '/java/collections', label: 'Collections Framework' }}
    >
      <h2>Object-Oriented Programming in Java</h2>
      <p>
        Java is fundamentally an object-oriented language. Everything in Java revolves around
        objects and classes. Object-Oriented Programming (OOP) organizes code into reusable
        blueprints (classes) that model real-world entities, making programs easier to design,
        understand, and maintain.
      </p>

      <FlowChart
        title="Four Pillars of OOP"
        chart={"graph TD\nA[OOP Principles] --> B[Encapsulation]\nA --> C[Inheritance]\nA --> D[Polymorphism]\nA --> E[Abstraction]\nB --> F[Private fields + public getters/setters]\nC --> G[Child extends Parent]\nD --> H[Method overriding + overloading]\nE --> I[Abstract classes + Interfaces]"}
      />

      <h2>Classes and Objects</h2>
      <p>
        A <strong>class</strong> is a blueprint that defines the properties (fields) and
        behaviors (methods) of an object. An <strong>object</strong> is a specific instance of a
        class created at runtime.
      </p>

      <CodeBlock language="java" title="Car.java">
{`public class Car {
    // Fields (instance variables)
    private String make;
    private String model;
    private int year;
    private double mileage;

    // Constructor
    public Car(String make, String model, int year) {
        this.make = make;
        this.model = model;
        this.year = year;
        this.mileage = 0.0;
    }

    // Overloaded constructor
    public Car(String make, String model, int year, double mileage) {
        this(make, model, year); // calls the other constructor
        this.mileage = mileage;
    }

    // Methods
    public void drive(double miles) {
        if (miles > 0) {
            this.mileage += miles;
            System.out.println(make + " " + model + " drove " + miles + " miles.");
        }
    }

    public String getInfo() {
        return year + " " + make + " " + model + " (" + mileage + " miles)";
    }

    // Getters and setters
    public String getMake() { return make; }
    public String getModel() { return model; }
    public int getYear() { return year; }
    public double getMileage() { return mileage; }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Main.java">
{`public class Main {
    public static void main(String[] args) {
        // Creating objects
        Car car1 = new Car("Toyota", "Camry", 2023);
        Car car2 = new Car("Honda", "Civic", 2022, 15000);

        car1.drive(150.5);
        car1.drive(200.0);

        System.out.println(car1.getInfo());
        System.out.println(car2.getInfo());
    }
}`}
      </CodeBlock>

      <h2>Encapsulation</h2>
      <p>
        Encapsulation means bundling data (fields) and the methods that operate on that data
        within a single class, and restricting direct access to the internal state. This is
        achieved using access modifiers:
      </p>
      <ul>
        <li><code>private</code> — accessible only within the same class</li>
        <li><code>protected</code> — accessible within the same package and subclasses</li>
        <li><code>public</code> — accessible from anywhere</li>
        <li><em>default (no modifier)</em> — accessible within the same package only</li>
      </ul>

      <InfoBox variant="tip" title="Why Encapsulation Matters">
        <p>
          Encapsulation protects an object&apos;s internal state from unintended changes. By
          making fields <code>private</code> and providing controlled access through getter and
          setter methods, you can validate data before setting it, compute values on the fly in
          getters, and change internal implementation without breaking code that uses your class.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="BankAccount.java">
{`public class BankAccount {
    private String owner;
    private double balance;

    public BankAccount(String owner, double initialBalance) {
        this.owner = owner;
        this.balance = Math.max(0, initialBalance); // prevent negative initial balance
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            System.out.println("Deposited $" + amount + ". New balance: $" + balance);
        } else {
            System.out.println("Deposit amount must be positive.");
        }
    }

    public boolean withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            System.out.println("Withdrew $" + amount + ". New balance: $" + balance);
            return true;
        }
        System.out.println("Insufficient funds or invalid amount.");
        return false;
    }

    public double getBalance() { return balance; }
    public String getOwner() { return owner; }
}`}
      </CodeBlock>

      <h2>Inheritance</h2>
      <p>
        Inheritance allows a class (child/subclass) to inherit fields and methods from another
        class (parent/superclass). This promotes code reuse and establishes an &quot;is-a&quot;
        relationship between classes.
      </p>

      <CodeBlock language="java" title="InheritanceExample.java">
{`// Parent class
public class Animal {
    protected String name;
    protected int age;

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void eat() {
        System.out.println(name + " is eating.");
    }

    public void sleep() {
        System.out.println(name + " is sleeping.");
    }

    @Override
    public String toString() {   // overrides Object.toString()
        return name + " (age " + age + ")";
    }
}

// Child class
public class Dog extends Animal {
    private String breed;

    public Dog(String name, int age, String breed) {
        super(name, age); // call parent constructor
        this.breed = breed;
    }

    // New method specific to Dog
    public void fetch(String item) {
        System.out.println(name + " fetches the " + item + "!");
    }

    // Override parent method
    @Override
    public String toString() {
        return name + " the " + breed + " (age " + age + ")";
    }
}

// Another child class
public class Cat extends Animal {
    private boolean isIndoor;

    public Cat(String name, int age, boolean isIndoor) {
        super(name, age);
        this.isIndoor = isIndoor;
    }

    public void purr() {
        System.out.println(name + " is purring.");
    }
}`}
      </CodeBlock>

      <h2>Polymorphism</h2>
      <p>
        Polymorphism means &quot;many forms.&quot; It allows objects of different classes to be
        treated through a common interface. There are two types:
      </p>
      <ul>
        <li>
          <strong>Compile-time (method overloading)</strong> — Multiple methods with the same name
          but different parameters.
        </li>
        <li>
          <strong>Runtime (method overriding)</strong> — A subclass provides its own
          implementation of a method defined in its parent class.
        </li>
      </ul>

      <CodeBlock language="java" title="PolymorphismExample.java">
{`public class Shape {
    public double area() {
        return 0;
    }
}

public class Circle extends Shape {
    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public class Rectangle extends Shape {
    private double width, height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }
}

// Polymorphism in action
public class ShapeDemo {
    public static void printArea(Shape shape) {
        // This method works with ANY Shape subclass
        System.out.println("Area: " + shape.area());
    }

    public static void main(String[] args) {
        Shape[] shapes = {
            new Circle(5),
            new Rectangle(4, 6),
            new Circle(3)
        };

        for (Shape s : shapes) {
            printArea(s); // correct area() is called for each type
        }
    }
}`}
      </CodeBlock>

      <h2>Interfaces vs Abstract Classes</h2>
      <p>
        Both interfaces and abstract classes provide abstraction, but they serve different
        purposes:
      </p>

      <CodeBlock language="java" title="InterfacesAndAbstracts.java">
{`// Interface: defines a contract (what to do, not how)
public interface Drawable {
    void draw();               // abstract method (no body)
    default void erase() {     // default method (with body, Java 8+)
        System.out.println("Erasing...");
    }
}

public interface Resizable {
    void resize(double factor);
}

// Abstract class: partial implementation
public abstract class GeometricShape {
    protected String color;

    public GeometricShape(String color) {
        this.color = color;
    }

    // Abstract method: must be implemented by subclasses
    public abstract double area();
    public abstract double perimeter();

    // Concrete method: shared by all subclasses
    public String getColor() {
        return color;
    }
}

// A class can extend one abstract class AND implement multiple interfaces
public class Square extends GeometricShape implements Drawable, Resizable {
    private double side;

    public Square(String color, double side) {
        super(color);
        this.side = side;
    }

    @Override
    public double area() { return side * side; }

    @Override
    public double perimeter() { return 4 * side; }

    @Override
    public void draw() { System.out.println("Drawing a " + color + " square"); }

    @Override
    public void resize(double factor) { this.side *= factor; }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Use Which?">
        <p>
          Use an <strong>interface</strong> when you want to define a contract that unrelated
          classes can implement (e.g., <code>Comparable</code>, <code>Serializable</code>). Use
          an <strong>abstract class</strong> when you have shared state or behavior among closely
          related classes. A class can implement multiple interfaces but can only extend one
          abstract class.
        </p>
      </InfoBox>

      <h2>Enums — Type-Safe Constants With Behaviour</h2>
      <p>
        An <code>enum</code> declares a fixed, finite set of instances. Unlike{' '}
        <code>static final int</code> constants, enums are type-safe (you cannot pass an unrelated
        int where a <code>Status</code> is expected), print meaningfully, and can be switched over
        exhaustively. Crucially, a Java enum is a real class: it can have fields, constructors,
        methods, and even per-constant method implementations.
      </p>

      <CodeBlock language="java" title="Enums.java">
{`// Simple enum
public enum Status { PENDING, ACTIVE, SUSPENDED, CLOSED }

// Enum with state and behaviour
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    EARTH  (5.976e+24, 6.37814e6),
    MARS   (6.421e+23, 3.3972e6);

    private final double mass;      // fields are implicitly final in practice
    private final double radius;

    // Constructors are implicitly private — you cannot create new constants.
    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    public double surfaceGravity() {
        return 6.67300E-11 * mass / (radius * radius);
    }

    public double weightOf(double massKg) {
        return massKg * surfaceGravity();
    }
}

// Constant-specific behaviour — each constant overrides the abstract method.
public enum Operation {
    PLUS("+")  { public double apply(double x, double y) { return x + y; } },
    MINUS("-") { public double apply(double x, double y) { return x - y; } },
    TIMES("*") { public double apply(double x, double y) { return x * y; } },
    DIVIDE("/") {
        public double apply(double x, double y) {
            if (y == 0) throw new ArithmeticException("divide by zero");
            return x / y;
        }
    };

    private final String symbol;
    Operation(String symbol) { this.symbol = symbol; }
    public abstract double apply(double x, double y);

    @Override public String toString() { return symbol; }
}

// Enums can implement interfaces — a common way to build a strategy registry.
public enum Rounding implements DoubleUnaryOperator {
    UP   { public double applyAsDouble(double v) { return Math.ceil(v); } },
    DOWN { public double applyAsDouble(double v) { return Math.floor(v); } };
}`}
      </CodeBlock>

      <CodeBlock language="java" title="UsingEnums.java">
{`// Built-in members every enum gets for free
Status[] all   = Status.values();          // all constants, in declaration order
Status parsed  = Status.valueOf("ACTIVE"); // throws IllegalArgumentException if unknown
String  label  = parsed.name();            // "ACTIVE"
int     index  = parsed.ordinal();         // 1 — declaration position

// Exhaustive switch: no default needed, and adding a constant becomes a
// compile error in every switch that doesn't handle it.
String describe(Status s) {
    return switch (s) {
        case PENDING   -> "waiting for review";
        case ACTIVE    -> "in good standing";
        case SUSPENDED -> "temporarily disabled";
        case CLOSED    -> "permanently closed";
    };
}

// EnumMap / EnumSet — array-backed, dramatically faster than HashMap/HashSet
// for enum keys, and they iterate in declaration order.
EnumMap<Status, Integer> counts = new EnumMap<>(Status.class);
EnumSet<Status> live = EnumSet.of(Status.PENDING, Status.ACTIVE);
EnumSet<Status> dead = EnumSet.complementOf(live);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Never persist ordinal()">
        <p>
          <code>ordinal()</code> is the constant&apos;s position in the source file. Storing it in
          a database or serialising it means that reordering the constants — or inserting a new one
          in the middle — silently reinterprets every existing row. Persist <code>name()</code>{' '}
          instead, or give the enum an explicit stable code field. The same rule is why JPA&apos;s{' '}
          <code>@Enumerated(EnumType.STRING)</code> is correct and the default{' '}
          <code>EnumType.ORDINAL</code> is a bug waiting to happen.
        </p>
        <p>
          A related guarantee worth relying on: enum constants are singletons enforced by the JVM,
          including across serialisation, so <code>==</code> comparison is both safe and preferred
          over <code>.equals()</code>.
        </p>
      </InfoBox>

      <h2>Nested and Inner Classes</h2>
      <p>
        A class declared inside another class comes in four flavours, and the difference between
        the first two matters more than most people realise.
      </p>

      <CodeBlock language="java" title="NestedClasses.java">
{`public class Outer {
    private int instanceField = 1;
    private static int staticField = 2;

    // 1. STATIC NESTED CLASS — no reference to the enclosing instance.
    //    This is what you almost always want. Use it for helper types that
    //    are conceptually scoped to Outer but don't need its state.
    public static class Builder {
        // Can access staticField, but NOT instanceField.
        public Outer build() { return new Outer(); }
    }

    // 2. INNER (non-static) CLASS — holds an implicit reference to Outer.this.
    //    That hidden reference is what keeps the outer object alive and is a
    //    classic memory-leak source when the inner instance outlives it.
    public class Iterator {
        public int read() { return instanceField; }   // can see outer state
    }

    void demo() {
        // 3. LOCAL CLASS — declared inside a method body.
        class Local { int doubled() { return instanceField * 2; } }

        // 4. ANONYMOUS CLASS — a one-off implementation with no name.
        Runnable r = new Runnable() {
            @Override public void run() { System.out.println(instanceField); }
        };
    }
}

// Instantiation differs, and this trips people up:
Outer.Builder b = new Outer.Builder();      // static nested — no outer instance
Outer outer = new Outer();
Outer.Iterator it = outer.new Iterator();   // inner — needs an outer instance`}
      </CodeBlock>

      <InfoBox variant="tip" title="Default to static nested; reach for lambdas over anonymous classes">
        <p>
          If a nested class does not need the enclosing instance&apos;s state, declare it{' '}
          <code>static</code>. It is cheaper (no hidden field), and it removes an accidental
          object-lifetime dependency. For anonymous classes that implement a single-method
          interface, a lambda is shorter and does not create a separate class file — anonymous
          classes are now mostly reserved for implementing multi-method interfaces or capturing a
          generic type at runtime.
        </p>
      </InfoBox>

      <h2>Composition Over Inheritance</h2>
      <p>
        Inheritance is the loudest tool in the OOP toolbox and the one most often reached for too
        early. It couples the subclass to its parent&apos;s <em>implementation</em>, not just its
        interface: a change to how the parent calls its own methods can break subclasses that
        compiled fine yesterday. This is the fragile-base-class problem.
      </p>

      <CodeBlock language="java" title="CompositionOverInheritance.java">
{`// FRAGILE — extends a class whose internal call structure is not part of its contract.
public class CountingSet<E> extends HashSet<E> {
    private int addCount = 0;

    @Override public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);      // HashSet.addAll internally calls add()...
    }                                // ...so every element is counted TWICE.

    public int getAddCount() { return addCount; }
}

// ROBUST — composition + forwarding. Depends only on the Set interface,
// so the internal behaviour of the wrapped implementation cannot leak in.
public class CountingSet<E> implements Set<E> {
    private final Set<E> delegate;
    private int addCount = 0;

    public CountingSet(Set<E> delegate) { this.delegate = delegate; }

    @Override public boolean add(E e) {
        addCount++;
        return delegate.add(e);
    }

    @Override public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return delegate.addAll(c);   // calls the DELEGATE's add, not ours
    }

    public int getAddCount() { return addCount; }
    // ...remaining Set methods forward to delegate
}`}
      </CodeBlock>

      <InfoBox variant="note" title="The rule of thumb">
        <p>
          Use inheritance only for a genuine <strong>is-a</strong> relationship where the parent
          was <em>designed</em> for extension — documented for it, or sealed so the author controls
          every subtype. Use composition for <strong>has-a</strong> and for
          <strong> behaves-like</strong>. In practice this means: prefer implementing an interface
          and delegating to a field over extending a concrete class. If a class is not designed to
          be subclassed, mark it <code>final</code> so nobody has to guess.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Where this goes next">
        <p>
          Modern Java adds two features that reshape everything on this page:{' '}
          <strong>records</strong>, which collapse an immutable data class down to one line, and{' '}
          <strong>sealed types</strong>, which let you declare a closed set of subtypes that the
          compiler can check exhaustively. Both are covered in the{' '}
          <strong>Advanced Java Features</strong> lesson. Once you have them, most of the abstract
          class hierarchies in this lesson are better modelled as a sealed interface with record
          implementations.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"What is the output of this code?"}
        options={[
          "Rex (age 3)",
          "Rex the Labrador (age 3)",
          "Compilation error — Animal reference cannot hold Dog object",
          "Runtime error"
        ]}
        correctIndex={1}
        explanation="This demonstrates runtime polymorphism. Even though the variable type is Animal, the actual object is a Dog. Java uses Dog's overridden toString() at runtime (dynamic method dispatch)."
        code={'Animal a = new Dog("Rex", 3, "Labrador");\nSystem.out.println(a.toString());'}
        language="java"
      />
    </LessonLayout>
  );
}

export default Oop;
