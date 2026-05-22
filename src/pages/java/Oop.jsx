import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaOop() {
  return (
    <LessonLayout
      title="Object-Oriented Programming"
      sectionId="java"
      lessonIndex={2}
      prev={{ path: "/java/syntax", label: "Java Syntax" }}
      next={{ path: "/java/collections", label: "Collections Framework" }}
    >
      <p>Object-Oriented Programming (OOP) organizes code around objects — entities that combine state (fields) and behavior (methods). Java is built entirely around OOP with four core pillars.</p>

      <FlowChart
        title="The Four Pillars of OOP"
        chart={"graph TD\n  A[OOP Pillars] --> B[Encapsulation]\n  A --> C[Inheritance]\n  A --> D[Polymorphism]\n  A --> E[Abstraction]\n  B --> F[Hide state via private fields]\n  C --> G[Reuse with extends]\n  D --> H[One interface many forms]\n  E --> I[Abstract classes and Interfaces]"}
      />

      <h2>Classes and Objects</h2>
      <CodeBlock language="java" title="Class Definition and Instantiation">
{`public class Person {
    // Fields — private for encapsulation
    private String name;
    private int age;
    private static int totalCount = 0; // class-level (shared)

    // Constructor
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
        totalCount++;
    }

    // Getters/Setters (encapsulation)
    public String getName() { return name; }
    public void setName(String n) {
        if (n != null && !n.isBlank()) this.name = n;
    }
    public int getAge() { return age; }

    // Instance method
    public void introduce() {
        System.out.printf("Hi, I am %s, age %d%n", name, age);
    }

    // Static method
    public static int getTotalCount() { return totalCount; }

    @Override
    public String toString() {
        return "Person{name=" + name + ", age=" + age + "}";
    }
}

// Creating instances (objects)
Person alice = new Person("Alice", 30);
Person bob   = new Person("Bob", 25);
alice.introduce();
System.out.println(Person.getTotalCount()); // 2`}
      </CodeBlock>

      <h2>Inheritance (extends)</h2>
      <CodeBlock language="java" title="Single Inheritance">
{`// Parent class (superclass)
public class Vehicle {
    protected String brand;
    protected int year;

    public Vehicle(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }

    public void start() {
        System.out.println(brand + " starting...");
    }

    public String info() {
        return brand + " (" + year + ")";
    }
}

// Child class inherits all non-private members
public class Car extends Vehicle {
    private int doors;

    public Car(String brand, int year, int doors) {
        super(brand, year); // must call parent constructor first!
        this.doors = doors;
    }

    @Override
    public void start() {
        super.start();  // call parent method
        System.out.println("Car engine revving!");
    }

    // Additional method
    public void honk() { System.out.println("Beep beep!"); }
}

Car car = new Car("Toyota", 2023, 4);
car.start();  // Toyota starting... Car engine revving!
car.honk();   // Beep beep!
System.out.println(car.info()); // Toyota (2023)`}
      </CodeBlock>

      <h2>Abstract Classes and Interfaces</h2>
      <CodeBlock language="java" title="Abstract Class vs Interface">
{`// Abstract class — partial implementation, can have state
public abstract class Shape {
    protected String color;
    public Shape(String color) { this.color = color; }
    public abstract double area();       // subclasses MUST implement
    public abstract double perimeter();
    public void describe() {             // concrete shared method
        System.out.printf("%s %s (area=%.2f)%n",
            color, getClass().getSimpleName(), area());
    }
}

// Interface — pure contract (since Java 8: can have default methods)
public interface Drawable {
    void draw();  // abstract by default
    default void drawWithColor(String c) {  // default implementation
        System.out.println("Drawing in " + c);
        draw();
    }
}

public interface Serializable {
    byte[] serialize();
}

// Concrete class — can implement MULTIPLE interfaces
public class Circle extends Shape implements Drawable, Serializable {
    private double radius;
    public Circle(String color, double r) { super(color); this.radius = r; }
    @Override public double area()      { return Math.PI * radius * radius; }
    @Override public double perimeter() { return 2 * Math.PI * radius; }
    @Override public void draw()        { System.out.println("O (r=" + radius + ")"); }
    @Override public byte[] serialize() { return ("Circle:" + radius).getBytes(); }
}`}
      </CodeBlock>

      <h2>Polymorphism</h2>
      <CodeBlock language="java" title="Method Overriding and Overloading">
{`// Overriding — subclass redefines inherited method (runtime polymorphism)
Shape[] shapes = { new Circle("red", 5), new Rectangle("blue", 3, 4) };
for (Shape s : shapes) {
    s.describe();    // calls the correct implementation at runtime
    System.out.println(s.area()); // Circle=78.54, Rectangle=12.0
}

// Overloading — same name, different parameters (compile-time)
public class Calculator {
    public int add(int a, int b)           { return a + b; }
    public double add(double a, double b)  { return a + b; }
    public int add(int a, int b, int c)    { return a + b + c; }
    public String add(String a, String b)  { return a + b; }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Abstract vs Interface — When to Use">
        <p>Use an abstract class when subclasses share common state/behavior and have an IS-A relationship. Use an interface to define a contract (capability) that unrelated classes can implement. Prefer interfaces for flexibility — a class can implement many interfaces but extend only one class.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between method overloading and method overriding?"
        options={["They are the same thing", "Overloading = same method name different parameters (compile-time); Overriding = subclass redefines parent method (runtime)", "Overloading is only for constructors", "Overriding requires the static keyword"]}
        correctIndex={1}
        explanation="Overloading: multiple methods with the same name but different parameter types/counts — resolved at compile time. Overriding: a subclass provides a different implementation of an inherited method — resolved at runtime via dynamic dispatch."
      />
    </LessonLayout>
  );
}
