import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaOopGenerics() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java · Field Reference"
      title="OOP & Generics"
      tagline="Classes, inheritance, and the type-safety tools that keep collections honest at compile time — condensed for offline study."
      meta={['Java 21+', '17 patterns']}
      footerLabel="Personal study reference — Java"
      pageLabel="Java Field Guide · OOP & Generics"
      prev={{ path: '/java-field-guide/syntax', label: 'Modern Java Syntax' }}
      next={{ path: '/java-field-guide/collections-streams', label: 'Collections & Streams' }}
    >
      <PosterCard
        glyph="Cl"
        title={<>Class<span className="dim"> — constructor overloading</span></>}
        language="java"
        code={`public class Car {
    private final String make;
    private double mileage;

    public Car(String make) {
        this(make, 0.0);   // delegate to the other constructor
    }

    public Car(String make, double mileage) {
        this.make = make;
        this.mileage = mileage;
    }
}`}
        caption={<><code>this(...)</code> as the first statement chains to another constructor in the same class, so shared init logic lives in exactly one place instead of being copy-pasted across overloads.</>}
      />

      <PosterCard
        glyph="En"
        title={<>Encapsulation<span className="dim"> — access modifiers</span></>}
        language="java"
        code={`public class BankAccount {
    private double balance;         // this class only

    public boolean withdraw(double amt) {
        if (amt <= 0 || amt > balance) return false;
        balance -= amt;              // validated in one place
        return true;
    }

    public double getBalance() { return balance; }
}`}
        caption="private + validated methods means balance can never go negative through any code path — a public field can't make that guarantee. protected opens access to the package and subclasses; default (no modifier) opens it to the package only."
      />

      <PosterCard
        glyph="Ih"
        title={<>Inheritance<span className="dim"> — extends / super()</span></>}
        language="java"
        code={`public class Animal {
    protected String name;
    public Animal(String name) { this.name = name; }
    public void eat() { System.out.println(name + " eating"); }
}

public class Dog extends Animal {
    private final String breed;
    public Dog(String name, String breed) {
        super(name);           // must be the first statement
        this.breed = breed;
    }
}`}
        caption={<><code>super(...)</code> must run before any other statement in the subclass constructor — the parent's fields have to be initialized before the child can add its own. Java is single-inheritance for classes; use interfaces to add more than one type.</>}
      />

      <PosterCard
        glyph="Ov"
        title={<>Overriding<span className="dim"> vs Overloading</span></>}
        language="java"
        code={`// Overriding — same signature, runtime dispatch (subclass)
@Override
public String toString() { return name + " the " + breed; }

// Overloading — same name, different params, resolved at compile time
public Car(String make) { this(make, 0.0); }
public Car(String make, double mileage) { ... }`}
        caption="Overriding is resolved at runtime based on the object's actual class (dynamic dispatch); overloading is resolved at compile time based on the argument types you pass. Mixing these up is a common interview gotcha."
      />

      <PosterCard
        glyph="Po"
        title={<>Polymorphism<span className="dim"> — one method, many shapes</span></>}
        language="java"
        code={`public static void printArea(Shape shape) {
    System.out.println("Area: " + shape.area());   // dispatches per actual type
}

Shape[] shapes = { new Circle(5), new Rectangle(4, 6) };
for (Shape s : shapes) printArea(s);   // correct area() picked at runtime`}
        caption="The variable's declared type (Shape) is checked at compile time; the object's actual type decides which area() runs. This is what lets printArea accept every current and future Shape subclass unchanged."
      />

      <PosterCard
        glyph="If"
        title={<>interface<span className="dim"> — contract + default methods</span></>}
        language="java"
        code={`public interface Drawable {
    void draw();                     // abstract — implementers must provide

    default void erase() {           // Java 8+ — implementers get this for free
        System.out.println("Erasing...");
    }
}

public class Square implements Drawable, Resizable { ... }`}
        caption="A class can implement any number of interfaces (unlike extends, capped at one class). default methods let an interface gain new behavior without breaking every existing implementer's compile."
      />

      <PosterCard
        glyph="Ab"
        title={<>abstract class<span className="dim"> vs interface</span></>}
        language="java"
        code={`public abstract class GeometricShape {
    protected String color;                    // shared STATE
    public GeometricShape(String color) { this.color = color; }

    public abstract double area();              // must implement
    public String getColor() { return color; }  // shared behavior, inherited
}`}
        caption="Reach for an abstract class when subclasses share state or a constructor; reach for an interface when unrelated classes just need to satisfy a contract (Comparable, Serializable). A class extends one abstract class but implements many interfaces."
      />

      <PosterCard
        glyph="Gc"
        title={<>Generic Class<span className="dim"> — &lt;T&gt; / &lt;K,V&gt;</span></>}
        language="java"
        code={`public class Box<T> {
    private T content;
    public Box(T content) { this.content = content; }
    public T getContent() { return content; }
}

Box<String> stringBox = new Box<>("Hello");   // T resolved to String
Box<Integer> intBox = new Box<>(42);           // T resolved to Integer, no cast`}
        caption="Before generics, a Box stored Object and every getContent() call needed an explicit cast that could fail at runtime with ClassCastException. The type parameter pushes that check to compile time instead."
      />

      <PosterCard
        glyph="Gm"
        title={<>Generic Method<span className="dim"> — &lt;T&gt; on a static method</span></>}
        language="java"
        code={`// Type parameter declared before the return type — class itself isn't generic
public static <T> List<T> arrayToList(T[] array) {
    List<T> list = new ArrayList<>();
    for (T element : array) list.add(element);
    return list;
}

List<Integer> nums  = arrayToList(numbers);   // T inferred as Integer
List<String>  strs  = arrayToList(words);     // T inferred as String`}
        caption="A method can introduce its own type parameter even when the enclosing class has none — Java infers T from the argument at the call site, no explicit &lt;Integer&gt; needed."
      />

      <PosterCard
        glyph="Bt"
        title={<>Bounded Types<span className="dim"> — extends</span></>}
        language="java"
        code={`// T must be a Number or subclass — .doubleValue() becomes available
public static <T extends Number> double sum(List<T> list) {
    double total = 0;
    for (T element : list) total += element.doubleValue();
    return total;
}

// An interface bound still uses "extends", never "implements"
public static <T extends Comparable<T>> T findMax(List<T> list) { ... }

// Multiple bounds joined with & — class bound first, then interfaces
public static <T extends Number & Comparable<T>> T clamp(T v, T lo, T hi) { ... }`}
        caption={<><code>extends</code> in a bound means &quot;is-a or implements&quot; for both classes and interfaces — it's the only keyword generics use, even for interface bounds. Without the bound, <code>.doubleValue()</code> wouldn't compile because plain <code>T</code> only has <code>Object</code>'s methods.</>}
      />

      <PosterCard
        glyph="Wc"
        title={<>Wildcards<span className="dim"> — PECS</span></>}
        language="java"
        code={`// DON'T memorise the mnemonic — DERIVE it. Read a wildcard as
// "some ONE SPECIFIC type I don't know", never "any type".

// ? extends Number = an unknown SUBTYPE. Might be List<Integer>,
// List<Double>, or List<Number> — the compiler doesn't know which.
public static double sumAll(List<? extends Number> numbers) { ... }
//   READ  ok: whatever comes out is at least a Number.
//   WRITE no: add(1) into an actual List<Double> would corrupt it.

// ? super Integer = an unknown SUPERTYPE. Might be List<Integer>,
// List<Number>, or List<Object>. Everything inverts:
public static void addNumbers(List<? super Integer> list) {
    list.add(1);                 // WRITE ok: an Integer fits all of those.
    // Integer n = list.get(0);  // READ  no: it might be List<Object>,
}                                //           so get() only promises Object.

// javac even NAMES the unknown type when it rejects you:
//   incompatible types: Integer cannot be converted to CAP#1
//   where CAP#1 extends Number from capture of ? extends Number
// CAP#1 *is* "the one specific type I don't know".`}
        caption={<>PECS is easy to apply backwards because &quot;producer&quot; and &quot;consumer&quot; are named from the <em>collection&apos;s</em> point of view, not yours. One idea replaces the mnemonic: a wildcard is one specific unknown type, so you can never prove a value fits an unknown <em>subtype</em>, and you can never prove an unknown <em>supertype</em> hands back anything narrower than <code>Object</code>. Plain <code>T</code> when you do both.</>}
      />

      <PosterCard
        glyph="Er"
        title={<>Type Erasure<span className="dim"> gotcha</span></>}
        language="java"
        code={`List<String> strings = new ArrayList<>();
List<Integer> ints = new ArrayList<>();
strings.getClass() == ints.getClass();   // true — both just "List" at runtime

// if (obj instanceof List<String>) { }  // COMPILE ERROR — can't check erased type
if (obj instanceof List<?> list) { }      // OK — unbounded wildcard works`}
        caption="The compiler enforces generic type constraints, then erases them from the bytecode — a List<String> and List<Integer> are identical at runtime. That's why instanceof and array creation can't target a specific parameterized type, only a raw type or unbounded wildcard."
      />

      <PosterCard
        glyph="Em"
        title={<>enum<span className="dim"> — with state &amp; behaviour</span></>}
        language="java"
        code={`public enum Operation {
    PLUS("+")  { public double apply(double x, double y) { return x + y; } },
    TIMES("*") { public double apply(double x, double y) { return x * y; } };

    private final String symbol;
    Operation(String symbol) { this.symbol = symbol; }   // implicitly private
    public abstract double apply(double x, double y);
}

Status.values()        // all constants, declaration order
Status.valueOf("OPEN") // IllegalArgumentException if unknown
EnumMap / EnumSet      // array-backed, far faster than HashMap/HashSet

// NEVER persist ordinal() — reordering constants reinterprets every row.
// JPA: @Enumerated(EnumType.STRING), never the ORDINAL default.`}
        caption={<>A Java enum is a real class: fields, constructors, methods, per-constant bodies, and interface implementations. Constants are JVM-enforced singletons, so <code>==</code> is safe and preferred over <code>.equals()</code>.</>}
      />

      <PosterCard
        glyph="Ne"
        title={<>Nested classes<span className="dim"> — four kinds</span></>}
        language="java"
        code={`class Outer {
    static class Builder { }   // STATIC NESTED — no outer reference. Default choice.
    class Iterator { }         // INNER — holds a hidden Outer.this. Leak risk.
    void m() {
        class Local { }        // LOCAL — scoped to the method body
        Runnable r = new Runnable() { public void run() { } };  // ANONYMOUS
    }
}

new Outer.Builder();          // static nested — no instance needed
outer.new Iterator();         // inner — needs an enclosing instance`}
        caption={<>Declare it <code>static</code> unless it genuinely needs the enclosing instance&apos;s state — the hidden reference is both a cost and an accidental lifetime dependency. Prefer a lambda over an anonymous class for single-method interfaces.</>}
      />

      <PosterCard
        glyph="Cmp"
        title={<>Composition<span className="dim"> over inheritance</span></>}
        language="java"
        code={`// FRAGILE — HashSet.addAll internally calls add(), so counts double.
class CountingSet<E> extends HashSet<E> {
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size(); return super.addAll(c);   // BUG
    }
}

// ROBUST — implement the interface, delegate to a field.
class CountingSet<E> implements Set<E> {
    private final Set<E> delegate;
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size(); return delegate.addAll(c);  // calls THEIR add
    }
}`}
        caption="Inheritance couples you to the parent's internal call structure, which is not part of its contract — the fragile-base-class problem. Extend only what was designed for it; otherwise implement an interface and delegate, and mark your own classes final."
      />

      <PosterCard
        glyph="&"
        title={<>Intersection bounds<span className="dim"> — T extends A &amp; B</span></>}
        language="java"
        code={`// At most one class bound, and it must come first; rest are interfaces.
static <T extends Comparable<T> & Serializable> T maxAndPersist(List<T> xs) { }
static <T extends Number & Comparable<T>> void audit(T value) { }

// Erasure replaces T with its LEFTMOST bound (Object if unbounded).

// Heap pollution: generic varargs compile to an erased array.
@SafeVarargs   // only legal on static / final / private methods + constructors
static <T> List<T> listOf(T... items) { return List.of(items); }`}
        caption={<>Multiple bounds joined with <code>&amp;</code> give the type parameter every member of every bound. Annotate generic-varargs methods with <code>@SafeVarargs</code> only when the array is read and never stored or exposed.</>}
      />

      <PosterCard
        glyph="Inv"
        title={<>Invariance<span className="dim"> — why wildcards exist</span></>}
        language="java"
        code={`// Arrays are COVARIANT — and unsound.
Object[] objects = new String[3];   // compiles
objects[0] = 42;                    // ArrayStoreException at RUNTIME

// Generics are INVARIANT — same mistake caught at compile time.
List<Object> list = new ArrayList<String>();   // COMPILE ERROR

void strict(List<Number> ns) { }
strict(List.of(1, 2, 3));           // ERROR: List<Integer> != List<Number>

void flexible(List<? extends Number> ns) { }
flexible(List.of(1, 2, 3));         // OK — wildcards restore the flexibility`}
        caption={<>A <code>List&lt;String&gt;</code> is not a <code>List&lt;Object&gt;</code>, because it would let you insert a non-String. Wildcards give back the flexibility without the hole — which is the whole motivation for PECS.</>}
      />

      <PosterQuickRef
        title="Which OOP/generics tool do I need?"
        rows={[
          { need: 'Share a constructor across overloads', answer: 'this(...) as the first statement' },
          { need: 'Call the parent constructor', answer: 'super(...) as the first statement' },
          { need: 'Contract for unrelated classes', answer: 'interface' },
          { need: 'Shared state across related subclasses', answer: 'abstract class' },
          { need: 'Add a method to an interface without breaking implementers', answer: 'default method' },
          { need: 'Type-safe container for any type', answer: 'generic class <T>' },
          { need: 'One-off generic type param on a method', answer: 'generic method <T> before return type' },
          { need: 'Restrict a type param to Number/Comparable/etc', answer: 'bounded type <T extends X>' },
          { need: 'Read-only param that accepts subtypes', answer: '? extends T — unknown subtype, so writes are banned' },
          { need: 'Write-only param that accepts supertypes', answer: '? super T — unknown supertype, so reads give Object' },
          { need: 'Check generic type at runtime', answer: "can't — type erasure; use List<?> instead" },
        ]}
      />
    </PosterLayout>
  );
}
