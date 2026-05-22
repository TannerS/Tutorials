import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SolidLsp() {
  return (
    <LessonLayout
      title="Liskov Substitution Principle"
      sectionId="solid"
      lessonIndex={3}
      prev={{ path: '/solid/ocp', label: 'Open/Closed Principle' }}
      next={{ path: '/solid/isp', label: 'Interface Segregation' }}
    >
      <h2>What Is LSP?</h2>
      <p>
        The Liskov Substitution Principle: <em>objects of a supertype should be replaceable with
        objects of any subtype without breaking correctness.</em> If code works with a
        <code>Shape</code> reference, it must work just as correctly whether that shape is a
        <code>Circle</code>, <code>Rectangle</code>, or any other subtype. LSP violations cause
        silent, hard-to-debug failures — code that looks right but produces wrong results when
        a different implementation is used.
      </p>

      <FlowChart
        title="LSP — Subtypes Must Honor the Contract"
        chart={"graph TD\n  A[Base class contract] --> B[Preconditions - what it requires]\n  A --> C[Postconditions - what it guarantees]\n  A --> D[Invariants - what always remains true]\n  E[Subclass must] --> F[Not strengthen preconditions]\n  E --> G[Not weaken postconditions]\n  E --> H[Not break invariants]"}
      />

      <h2>The Rectangle-Square Problem — The Classic Violation</h2>

      <CodeBlock language="java" title="Classic LSP Violation — Square Extends Rectangle">
{`// Intuition: a Square IS-A Rectangle — inheritance seems natural
public class Rectangle {
    protected double width;
    protected double height;

    public void setWidth(double w)  { this.width = w; }
    public void setHeight(double h) { this.height = h; }
    public double getWidth()  { return width; }
    public double getHeight() { return height; }
    public double area() { return width * height; }
}

// Square "fixes" the setters to maintain the equal-sides invariant
public class Square extends Rectangle {
    @Override
    public void setWidth(double w)  { this.width  = w; this.height = w; } // surprise!
    @Override
    public void setHeight(double h) { this.width  = h; this.height = h; } // surprise!
}

// This utility method is correct for Rectangle but BREAKS for Square
void scaleWidth(Rectangle rect, double factor) {
    double originalHeight = rect.getHeight();
    rect.setWidth(rect.getWidth() * factor);

    // Postcondition: area should equal newWidth * originalHeight
    // For Rectangle: 6 * 4 * 2 = 48 — correct
    // For Square: setWidth ALSO changes height, so area = (6*2)^2 = 144 — WRONG!
    assert rect.area() == rect.getWidth() * originalHeight : "LSP violated!";
}

// The problem: Square strengthens the postcondition of setWidth()
// Parent guarantees: "sets width, height unchanged"
// Square changes: "sets width AND height (they must stay equal)"
// This breaks code that depended on "height unchanged"

// ── CORRECT DESIGN ─────────────────────────────────────────────────
// Don't use inheritance — use separate types sharing a common interface

public interface Shape {
    double area();
    double perimeter();
}

public record Rectangle(double width, double height) implements Shape {
    public double area()      { return width * height; }
    public double perimeter() { return 2 * (width + height); }
}

public record Square(double side) implements Shape {
    public double area()      { return side * side; }
    public double perimeter() { return 4 * side; }
}
// Now scaleWidth() takes Rectangle — not Shape — correctly expressing intent
// If you need to work with any shape: use the Shape interface`}
      </CodeBlock>

      <h2>LSP Violations in Practice</h2>

      <CodeBlock language="java" title="NotImplementedException — The Obvious Violation">
{`// Common LSP violation: subclass throws UnsupportedOperationException
// for methods it "doesn't support"

public interface Repository<T, ID> {
    T save(T entity);
    Optional<T> findById(ID id);
    List<T> findAll();
    void delete(ID id);
    long count();
}

// VIOLATION: ReadOnly subtype throws on write methods
public class ReadOnlyUserCache implements Repository<User, Long> {
    private final Map<Long, User> cache = new HashMap<>();

    @Override public Optional<User> findById(Long id) { return Optional.ofNullable(cache.get(id)); }
    @Override public List<User> findAll() { return new ArrayList<>(cache.values()); }
    @Override public long count() { return cache.size(); }

    // ✗ VIOLATIONS: breaks callers who expect these to work
    @Override public User save(User user) { throw new UnsupportedOperationException("Read-only!"); }
    @Override public void delete(Long id) { throw new UnsupportedOperationException("Read-only!"); }
}

// Any code using Repository<User, Long> will crash at runtime when
// handed a ReadOnlyUserCache and calling save() — silent type system failure!

// ── CORRECT DESIGN ─────────────────────────────────────────────────
// Separate read and write interfaces — ISP + LSP together

public interface ReadRepository<T, ID> {
    Optional<T> findById(ID id);
    List<T> findAll();
    long count();
}

public interface WriteRepository<T, ID> {
    T save(T entity);
    void delete(ID id);
}

// Full repository: extends both
public interface Repository<T, ID> extends ReadRepository<T, ID>, WriteRepository<T, ID> {}

// Read-only implementation: only implements ReadRepository
public class ReadOnlyUserCache implements ReadRepository<User, Long> {
    // Only implements read methods — no need to throw on write methods
    // Code that uses ReadRepository<User, Long> can safely be passed this
}

// Now the type system enforces LSP at compile time, not runtime`}
      </CodeBlock>

      <CodeBlock language="java" title="Strengthened Preconditions — Another LSP Violation">
{`// LSP Rule: subclass must NOT require MORE from callers than the parent

public class EmailService {
    // Parent postcondition: send returns true on success, false on failure
    // Parent precondition: 'to' is a valid email string
    public boolean send(String to, String subject, String body) {
        return mailer.send(new Email(to, subject, body));
    }
}

// VIOLATION: subclass STRENGTHENS preconditions
public class PremiumEmailService extends EmailService {
    @Override
    public boolean send(String to, String subject, String body) {
        // Now requires 'to' to be a verified premium subscriber — MORE restrictive!
        if (!premiumSubscriberRepo.isVerified(to)) {
            throw new NotPremiumSubscriberException(to);
        }
        return super.send(to, subject, body);
    }
}

// Calling code:
void notifyUser(EmailService emailService, String email) {
    emailService.send(email, "Hello", "Message");
    // Works fine with EmailService
    // Throws runtime exception with PremiumEmailService
    // — LSP violated, callers must know the concrete type!
}

// ── CORRECT DESIGN ─────────────────────────────────────────────────
// Don't inherit — compose or use different method signature
public class PremiumEmailService {
    private final EmailService base;

    // Different method — different preconditions are explicit in the signature
    public boolean sendToPremium(PremiumSubscriber subscriber, String subject, String body) {
        if (!subscriber.isVerified()) throw new NotVerifiedException();
        return base.send(subscriber.getEmail(), subject, body);
    }
}`}
      </CodeBlock>

      <h2>LSP in JavaScript — Duck Typing</h2>

      <CodeBlock language="javascript" title="LSP in Dynamic Languages">
{`// JavaScript has structural typing — LSP still applies at the contract level
// If code expects an "iterable", every iterable must work the same way

// ── PROMISE-LIKE VIOLATION ────────────────────────────────────────
// Contract: async functions return something with .then() and .catch()
async function fetchData(url) {
  return fetch(url).then(r => r.json());
}

// Caller code expects Promise-like behavior:
const result = await fetchData('/api/users');
// Works with real fetch

// ── VIOLATING THE ITERATOR PROTOCOL ──────────────────────────────
// Built-in iterables: Array, Set, Map, String, generators
// All must implement Symbol.iterator returning { next() { return {value, done} } }

// ✗ Bad custom iterable — breaks when used in for...of
class BadCounter {
  [Symbol.iterator]() {
    let i = 0;
    return {
      next() {
        i++;
        if (i > 5) return { value: undefined, done: true };
        // VIOLATION: returns value even when done=true (spec says value should be undefined)
        return { value: i, done: true };  // done=true but value set — unexpected
      }
    };
  }
}

// ✓ Correct iterator
class Counter {
  constructor(max) { this.max = max; }
  [Symbol.iterator]() {
    let i = 0;
    const max = this.max;
    return {
      next() {
        return i < max
          ? { value: ++i, done: false }
          : { value: undefined, done: true }; // value undefined when done
      }
    };
  }
}

// for (const n of new Counter(5)) console.log(n); // 1 2 3 4 5

// ── REACT COMPONENT SUBSTITUTABILITY ─────────────────────────────
// If you have multiple button components, they should all accept the same props
// and behave consistently — LSP for UI components

// ✗ Violation: PrimaryButton ignores onClick in some conditions
function PrimaryButton({ onClick, children, loading }) {
  return (
    <button
      onClick={loading ? undefined : onClick}  // surprising: onClick sometimes ignored
      disabled={loading}
    >
      {children}
    </button>
  );
}

// ✓ Consistent: always calls onClick if provided; caller controls disabled state
function Button({ onClick, children, disabled, loading }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}>
      {loading ? <Spinner /> : children}
    </button>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Design by Contract">
        <p>
          LSP is grounded in Bertrand Meyer's <em>Design by Contract</em>. Every method has:
        </p>
        <ul>
          <li><strong>Preconditions</strong> — what the method requires from callers (e.g., "argument must not be null")</li>
          <li><strong>Postconditions</strong> — what the method guarantees to callers (e.g., "returns a non-empty list")</li>
          <li><strong>Invariants</strong> — what always remains true about the object's state</li>
        </ul>
        <p>
          LSP rules: subclasses may <em>weaken</em> preconditions (require less from callers — fine) but must
          not <em>strengthen</em> them (require more — breaks callers). Subclasses may <em>strengthen</em>
          postconditions (guarantee more — fine) but must not <em>weaken</em> them (guarantee less — breaks callers).
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Which behavior in a subclass violates LSP?"
        options={[
          "A subclass adds new public methods that the parent does not have",
          "A subclass overrides a method to throw UnsupportedOperationException for functionality the parent supports",
          "A subclass calls super() at the start of every overridden method",
          "A subclass implements an additional interface beyond the parent"
        ]}
        correctIndex={1}
        explanation="Throwing UnsupportedOperationException in a subclass is the classic LSP violation — it weakens the postcondition. Code written against the parent type expects all inherited methods to work. When a subclass throws instead, substituting it breaks the calling code at runtime. The fix is to split the interface so the subtype only implements what it genuinely supports."
      />

      <InteractiveChallenge
        question="In the Rectangle-Square problem, why does Square extending Rectangle violate LSP?"
        options={[
          "Square has fewer fields than Rectangle, making it a bad subtype",
          "Square's setWidth also changes height, breaking the postcondition that setWidth only changes width",
          "Rectangle is immutable and Square is mutable — type system conflict",
          "LSP only applies to interfaces, not abstract classes or concrete inheritance"
        ]}
        correctIndex={1}
        explanation="Rectangle's setWidth postcondition is: 'after calling setWidth(w), getWidth() returns w and getHeight() is unchanged.' Square violates this: it changes both width and height when setWidth is called, weakening the 'height is unchanged' guarantee. Code that uses a Rectangle and calls setWidth to scale width independently of height will produce wrong results when given a Square. The fix: use a Shape interface where width and height are not independently mutable."
      />
    </LessonLayout>
  );
}
