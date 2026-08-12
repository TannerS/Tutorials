import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaGotchas() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java · Field Reference"
      title="Gotchas & Pitfalls"
      tagline="The got-ya moments — things that compile clean, pass code review, and still silently break in production."
      meta={['Java 21+', '7 gotchas']}
      footerLabel="Personal study reference — Java Gotchas"
      pageLabel="Java Field Guide · Gotchas"
      prev={{ path: '/java-field-guide/concurrency', label: 'Concurrency & Virtual Threads' }}
      next={null}
    >
      <PosterCard
        glyph="Op"
        title={<>Optional misuse<span className="dim"> — fields, params, get()</span></>}
        language="java"
        code={`// WRONG on all three counts:
private Optional<String> nickname;             // field
void search(Optional<String> id) { ... }        // parameter
Customer c = customers.findById(id).get();      // unguarded get()

// RIGHT: Optional only as a return type; orElseThrow, not get().
Optional<Customer> findById(UUID id);
c = customers.findById(id).orElseThrow(NotFound::new);`}
        caption="Optional is a return-type contract only — as a field it breaks serializers (JPA/Jackson), as a parameter it pushes null-check ceremony onto callers without removing it, and .get() throws NoSuchElementException, defeating the whole point."
      />

      <PosterCard
        glyph="Og"
        title={<>orElse<span className="dim"> eagerly evaluates its argument</span></>}
        language="java"
        code={`// WRONG — createFreshCustomer() runs on EVERY call,
// even when the Optional is present.
Customer c = customers.findById(id).orElse(createFreshCustomer());

// RIGHT — orElseGet takes a Supplier, only runs when empty.
Customer c = customers.findById(id).orElseGet(this::createFreshCustomer);`}
        caption="orElse's argument is evaluated unconditionally before the Optional is even checked. If building the default is expensive or has side effects, that cost is paid on every single call — use orElseGet for a lazy Supplier instead."
      />

      <PosterCard
        glyph="Pin"
        title={<>Virtual thread pinning<span className="dim"> under synchronized</span></>}
        language="java"
        code={`// Pinned: I/O runs while holding a monitor lock.
public synchronized void inc() {
    externalCall();      // vthread can't unmount — pinned!
    count++;
}

// Diagnose: -Djdk.tracePinnedThreads=full
// Fix: ReentrantLock instead of synchronized around I/O.`}
        caption="A virtual thread that hits synchronized (or a native call) pins to its carrier thread and can't be unmounted during I/O. Enough pinned vthreads under load exhausts the small carrier pool and latency gets WORSE, not better."
      />

      <PosterCard
        glyph="Vp"
        title={<>Pooling virtual threads<span className="dim"> defeats the point</span></>}
        language="java"
        code={`// WRONG — reflex from the platform-thread era.
ExecutorService pool = Executors.newFixedThreadPool(50);

// RIGHT — one fresh virtual thread per task; no pool sizing.
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    tasks.forEach(t -> exec.submit(t));
}`}
        caption="Virtual threads are meant to be created and discarded per task — the JVM manages the real OS resources underneath. Wrapping them in a sized pool re-introduces the exact queueing bottleneck they exist to remove."
      />

      <PosterCard
        glyph="Oc"
        title={<>Optional&lt;Collection&gt;<span className="dim"> — two empty states</span></>}
        language="java"
        code={`// WRONG — caller now has TWO empty states to check: empty Optional
// AND a present-but-empty List.
public Optional<List<Order>> findByCustomer(UUID id) { ... }

// RIGHT — an empty list already IS the empty state.
public List<Order> findByCustomer(UUID id) {
    return orders.findByCustomerId(id);   // possibly empty, never null
}`}
        caption="For any type that already has a natural empty value — List, Set, Map, String, arrays — return that empty value instead of wrapping it in Optional. Optional-of-a-collection just makes callers unwrap twice for the same information."
      />

      <PosterCard
        glyph="Of"
        title={<>Optional.of()<span className="dim"> throws on null</span></>}
        language="java"
        code={`String maybeEmpty = lookupThatMightReturnNull();

// WRONG — throws NullPointerException immediately if maybeEmpty is null.
Optional<String> opt = Optional.of(maybeEmpty);

// RIGHT — ofNullable is the safe wrap for anything that might be null.
Optional<String> opt = Optional.ofNullable(maybeEmpty);`}
        caption="Optional.of() is not a safe wrapper — it's an assertion that the value is already known non-null, and it NPEs immediately if you're wrong. Reserve Optional.of() for values you've already verified; use ofNullable everywhere else."
      />

      <PosterCard
        glyph="Sm"
        title={<>Sealed subtypes<span className="dim"> need a modifier</span></>}
        language="java"
        code={`public sealed class Shape permits Circle, Rectangle, Triangle {}

// Every direct subtype MUST declare exactly one of:
public final class Circle extends Shape { ... }        // closed for good
public non-sealed class Triangle extends Shape { ... }   // reopens the hierarchy
// sealed class Rectangle extends Shape permits ... {}    // re-restricts further

// omitting final/sealed/non-sealed on a permitted subtype = COMPILE ERROR`}
        caption="A sealed type only controls its own direct subclasses — each one must explicitly pick final, sealed, or non-sealed, or the compiler rejects it. Forgetting this modifier (easy to do when adding a new permitted class) is a compile-time gotcha, not a runtime one, but it trips people up constantly."
      />

      <PosterQuickRef
        title="Gotcha -> fix, fast lookup"
        rows={[
          { need: 'NoSuchElementException from Optional', answer: 'Use orElseThrow, never bare .get()' },
          { need: 'Default object built on every call', answer: 'orElseGet(Supplier), not orElse(value)' },
          { need: 'Vthreads throttling under load', answer: 'Pinning — swap synchronized for ReentrantLock' },
          { need: 'Manually sizing a thread pool for tasks', answer: 'Use newVirtualThreadPerTaskExecutor instead' },
          { need: 'Two empty states to check on a lookup', answer: 'Return empty collection, not Optional<Collection>' },
          { need: 'NPE from Optional.of(value)', answer: 'Use Optional.ofNullable for anything that might be null' },
          { need: 'Compile error adding a sealed subtype', answer: 'Declare it final, sealed, or non-sealed' },
        ]}
      />
    </PosterLayout>
  );
}
