import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function OptionalDeepDive() {
  return (
    <LessonLayout
      title="Optional — Best and Worst Practices"
      sectionId="java"
      lessonIndex={10}
      prev={{ path: '/java/advanced', label: 'Advanced Java Features' }}
      next={null}
    >
      <h2>What Optional Is For</h2>
      <p>
        <code>Optional&lt;T&gt;</code> was introduced in Java 8 to communicate a
        <em>possibly-absent</em> value in a method return type. Its point is to force
        callers to acknowledge the absence at compile time, replacing a class of
        NullPointerExceptions with explicit code paths.
      </p>
      <p>
        Optional is often misused. The rules for when to use it and when NOT to use it
        matter more than the API surface — most bugs come from applying Optional in the
        wrong places.
      </p>

      <h2>The Golden Rule</h2>
      <InfoBox variant="tip" title="Use Optional ONLY as a return type">
        <p>
          Optional is a return-type contract, nothing more. Not for fields, not for
          parameters, not for collections. Return an <code>Optional&lt;T&gt;</code> when
          the caller cannot know from context whether a result exists. Everywhere else,
          use a plain <code>T</code> — possibly null, with clear conventions — or a
          proper empty collection.
        </p>
      </InfoBox>

      <h2>The Right Way — Idiomatic Optional</h2>
      <CodeBlock language="java" title="Optional as a return type">
{`public interface CustomerRepository {
    // Correct — return Optional when the customer may not exist.
    Optional<Customer> findById(UUID id);
}

// Caller code — clear "handle both cases" semantics.
public String greet(UUID id) {
    return customers.findById(id)
        .map(c -> "Hi " + c.displayName())
        .orElse("Hello, guest");
}

// Chain — transform and default.
public boolean canPromote(UUID id) {
    return customers.findById(id)
        .filter(Customer::isActive)
        .map(Customer::tier)
        .filter(t -> t.ordinal() >= Tier.GOLD.ordinal())
        .isPresent();
}

// Throw a specific exception when absence is unexpected.
public Customer required(UUID id) {
    return customers.findById(id)
        .orElseThrow(() -> new CustomerNotFoundException(id));
}`}
      </CodeBlock>

      <h2>Anti-Pattern #1 — Optional as a Field</h2>
      <CodeBlock language="java" title="Don't do this">
{`public class Customer {
    private final UUID id;
    private final String email;
    private final Optional<String> nickname;   // WRONG
}

// Reasons:
// - Not serializable in most serializers without custom converters.
// - Optional is not designed for storage; it lives about as well in memory
//   as a "boxed" flag but with the added cost of the Optional wrapper.
// - JPA / Jackson / Kryo / Protobuf all have to be taught it, one by one.
// - Reflection code that iterates fields hits an extra unwrap step.

// Instead:
public class Customer {
    private final UUID id;
    private final String email;
    private final String nickname;             // may be null

    // Give callers Optional at the API boundary if you want.
    public Optional<String> nickname() { return Optional.ofNullable(nickname); }
}`}
      </CodeBlock>

      <h2>Anti-Pattern #2 — Optional as a Parameter</h2>
      <CodeBlock language="java" title="Don't do this either">
{`// WRONG — pushes null-check ceremony onto the caller AND doesn't remove it.
public List<Order> search(Optional<String> customerId,
                          Optional<OrderStatus> status) {
    ...
}

// Callers now write:
search(Optional.of("C-1"), Optional.empty());
search(Optional.empty(), Optional.of(OrderStatus.OPEN));
// which is worse than nulls.

// RIGHT — overloads OR a builder / criteria object
public List<Order> search(String customerId, OrderStatus status) { ... }
public List<Order> searchByStatus(OrderStatus status) { ... }
public List<Order> searchByCustomer(String customerId) { ... }

// OR a criteria record when parameters explode
public record OrderCriteria(String customerId, OrderStatus status, Range<Instant> when) { }
public List<Order> search(OrderCriteria c) { ... }`}
      </CodeBlock>

      <h2>Anti-Pattern #3 — Optional of a Collection</h2>
      <CodeBlock language="java" title="Empty list beats Optional-of-list every time">
{`// WRONG — the caller now has TWO empty states to check.
public Optional<List<Order>> findByCustomer(UUID id) { ... }

// RIGHT — an empty list IS the empty state.
public List<Order> findByCustomer(UUID id) {
    return orders.findByCustomerId(id);  // possibly empty, never null
}

// This is a general rule: for T where T has a natural empty (List, Set, Map,
// String, arrays), return the empty value, not Optional.`}
      </CodeBlock>

      <h2>Anti-Pattern #4 — Optional.get() Without a Guard</h2>
      <CodeBlock language="java" title="Calling get() is almost always wrong">
{`// WRONG — throws NoSuchElementException if absent, defeating the point.
Customer c = customers.findById(id).get();

// RIGHT — always pair get with the isPresent check, OR just use orElseThrow.
Customer c = customers.findById(id)
    .orElseThrow(() -> new CustomerNotFoundException(id));

// The only place get() is defensible is inside a chain that has already
// established presence (e.g. after filter + isPresent), and even there,
// map/flatMap is clearer.`}
      </CodeBlock>

      <h2>Anti-Pattern #5 — orElse With an Expensive Default</h2>
      <CodeBlock language="java" title="orElse eagerly evaluates its argument">
{`// WRONG — createFreshCustomer() runs EVERY call, even when the Optional is present.
Customer c = customers.findById(id).orElse(createFreshCustomer());

// RIGHT — orElseGet takes a Supplier; only runs when needed.
Customer c = customers.findById(id).orElseGet(this::createFreshCustomer);`}
      </CodeBlock>

      <h2>Anti-Pattern #6 — isPresent + get Instead of ifPresent / map</h2>
      <CodeBlock language="java" title="The imperative pattern you're trying to avoid">
{`// WRONG — reads like the null-check code Optional was meant to replace.
Optional<Customer> opt = customers.findById(id);
if (opt.isPresent()) {
    Customer c = opt.get();
    log.info("Found {}", c.displayName());
}

// RIGHT — the fluent form
customers.findById(id)
    .ifPresent(c -> log.info("Found {}", c.displayName()));

// Or, if you're transforming
String label = customers.findById(id)
    .map(Customer::displayName)
    .orElse("unknown");`}
      </CodeBlock>

      <h2>The Full API — Only What You'll Actually Use</h2>
      <CodeBlock language="java" title="Optional cheat sheet">
{`// Constructors
Optional.of(value);            // NPE if value is null — for "must not be null" invariants
Optional.ofNullable(value);    // safe wrap
Optional.empty();              // no value

// Query
opt.isPresent();               // has value
opt.isEmpty();                 // no value (Java 11+)

// Extract with a fallback
opt.orElse(fallback);          // eager; fine for constants
opt.orElseGet(() -> compute());// lazy; use when default is expensive
opt.orElseThrow(() -> new MyException());   // throw on absence

// Transform
opt.map(fn);                   // Optional<A> -> Optional<B>
opt.flatMap(fn);               // fn returns Optional<B>; unwraps the wrapper
opt.filter(pred);              // Optional -> Optional (empty if pred is false)

// Consume
opt.ifPresent(consumer);       // side effect only if present
opt.ifPresentOrElse(consumer, runnable);   // Java 9+

// Stream
opt.stream();                  // Java 9+ — 0 or 1 element stream
customers.stream()
    .map(this::maybeGetOrder)  // Stream<Optional<Order>>
    .flatMap(Optional::stream) // Stream<Order> — drops empties
    .toList();`}
      </CodeBlock>

      <h2>Optional and Records</h2>
      <p>
        Records aren't a good place for <code>Optional</code> fields (see anti-pattern
        #1). If a record field is truly optional, store it as nullable and expose an
        accessor that wraps it:
      </p>
      <CodeBlock language="java" title="Records with an optional field">
{`public record Customer(UUID id, String email, String nickname) {
    // Accessor that wraps for callers who prefer Optional.
    public Optional<String> nicknameOpt() { return Optional.ofNullable(nickname); }
}

// Consumers pick their style
customer.nickname();           // may be null
customer.nicknameOpt().orElse("no nickname");`}
      </CodeBlock>

      <h2>Optional vs Nullable Return</h2>
      <p>
        A team-wide rule pays off:
      </p>
      <InfoBox variant="tip" title="Decision rule">
        <ul>
          <li>Return type is a lookup that may miss (find, get-by-id) →
              <code>Optional&lt;T&gt;</code>.</li>
          <li>Return type is a collection → the empty collection, not
              <code>Optional&lt;Collection&gt;</code>.</li>
          <li>Return type is a fluent-chain step where absent has no semantic meaning →
              nullable <code>T</code> with a documented convention, not Optional.</li>
          <li>Field type → plain <code>T</code>, may be null.</li>
          <li>Parameter type → plain <code>T</code>; use overloads for absence.</li>
        </ul>
      </InfoBox>

      <h2>Working With Optional From Other Languages</h2>
      <p>
        If your service exposes Kotlin, Scala, or interop with a language whose null
        semantics differ:
      </p>
      <ul>
        <li>Kotlin's <code>T?</code> nullable type interops with Java's plain
            <code>T</code>-may-be-null naturally. Optional is unnecessary friction here.</li>
        <li>Scala's <code>Option[T]</code> maps one-to-one to Java's
            <code>Optional&lt;T&gt;</code>. Prefer symmetry when you have both.</li>
      </ul>

      <h2>Common Bug: Optional.of on a Nullable</h2>
      <CodeBlock language="java" title="Optional.of throws — don't feed it a maybe">
{`String maybeEmpty = /* ... */ ;

// WRONG — throws NullPointerException if maybeEmpty is null.
Optional<String> opt = Optional.of(maybeEmpty);

// RIGHT — use ofNullable for anything that might be null.
Optional<String> opt = Optional.ofNullable(maybeEmpty);

// Reserve Optional.of for values you KNOW are non-null; it functions as an assertion.`}
      </CodeBlock>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="Signs your Optional usage is healthy">
        <ul>
          <li>Optional appears only as a return type.</li>
          <li>Never used as a field, parameter, or collection element.</li>
          <li>Collections return empty, not <code>Optional&lt;List&gt;</code>.</li>
          <li><code>get()</code> is rare; <code>orElseThrow</code>, <code>map</code>,
              <code>ifPresent</code>, <code>orElse</code> are common.</li>
          <li><code>orElseGet(Supplier)</code> when the default is expensive.</li>
          <li>Consuming code uses fluent <code>map/filter/ifPresent</code>, not
              <code>isPresent() + get()</code>.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="A service method looks up a customer by id and, if not found, returns a new default Customer built from the id. Which is the correct signature and body?"
        options={[
          "public Customer find(UUID id) { return repo.findById(id).orElse(new Customer(id, 'default')); }",
          "public Optional<Customer> find(UUID id) { return repo.findById(id).or(() -> Optional.of(new Customer(id, 'default'))); }",
          "public Customer find(UUID id) { return repo.findById(id).orElseGet(() -> new Customer(id, 'default')); }",
          "public Customer find(UUID id) { return repo.findById(id).get(); }"
        ]}
        correctIndex={2}
        explanation="Two problems with option 1: (a) orElse eagerly evaluates its argument, so `new Customer(...)` runs on every call even when the lookup succeeds, and (b) the constructor may not be free — a large default object should not be created for the 99% of calls that don't need it. orElseGet(Supplier) evaluates only when the Optional is empty. Option 2 leaks the wrapper unnecessarily (the caller wanted a Customer). Option 4 throws NoSuchElementException if the customer doesn't exist, defeating the purpose of returning a default."
      />
    </LessonLayout>
  );
}
