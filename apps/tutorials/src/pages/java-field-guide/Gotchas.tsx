import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaGotchas() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java + Spring Boot 4 · Field Reference"
      title="Gotchas & Pitfalls"
      tagline="The got-ya moments — things that compile clean, pass code review, and still silently break in production."
      meta={['Java + Spring', '13 gotchas']}
      footerLabel="Personal study reference — Java Gotchas"
      pageLabel="Java + Spring Field Guide · Gotchas"
      prev={{ path: '/java-field-guide/boot4', label: 'Spring Boot 4 Novelties' }}
      next={null}
    >
      <PosterCard
        glyph="!"
        title={<>Self-invocation<span className="dim"> breaks every proxy annotation</span></>}
        language="java"
        code={`@Service
public class ReportService {
    @Transactional
    public void generateBatch(List<ReportRequest> requests) {
        // this.generateOne() skips the proxy — annotation ignored!
        for (var req : requests) this.generateOne(req);
    }

    @Transactional(propagation = REQUIRES_NEW)
    public void generateOne(ReportRequest req) { /* ... */ }
}`}
        caption="Spring adds @Transactional, @Async, @Cacheable, and @PreAuthorize via a proxy wrapping your bean. Calling this.method() goes straight to the target, bypassing the proxy — the annotation silently does nothing. Fix: extract to another bean, or inject yourself with @Lazy."
      />

      <PosterCard
        glyph="Pv"
        title={<>Private / final methods<span className="dim"> — AOP never fires</span></>}
        language="text"
        code={`Spring AOP only weaves PUBLIC methods on beans obtained
through the proxy. A private @Transactional or @Cacheable
method compiles fine and does nothing at runtime — no
error, no warning, just silently ignored behavior.`}
        caption="Unlike self-invocation, this one gives you nothing to grep for — the pointcut 'matches' at compile time but Spring's proxy-based AOP can never intercept a private or final method call."
      />

      <PosterCard
        glyph="N+1"
        title={<>N+1 queries<span className="dim"> from lazy associations</span></>}
        language="java"
        code={`List<Order> orders = orderRepository.findByStatus(OPEN); // 1 query
for (Order o : orders) {
    log.info("{} items", o.getItems().size()); // +N queries!
}
// 1000 orders -> 1001 queries just to log them.

// Fix: @EntityGraph(attributePaths = {"items"}) on the repo method
// or a JOIN FETCH in JPQL.`}
        caption="A loop that looks like it runs one query actually runs N+1 because JPA lazily loads each row's association on first access. Always check SHOW SQL in dev — one method logging eight queries when you expected one is the tell."
      />

      <PosterCard
        glyph="En"
        title={<>Enum ORDINAL mapping<span className="dim"> — silent data corruption</span></>}
        language="java"
        code={`// WRONG — default. Stores the enum's integer position.
@Enumerated
private CustomerStatus status;

// RIGHT — always.
@Enumerated(EnumType.STRING)
private CustomerStatus status;`}
        caption="Default JPA enum mapping is ORDINAL — a plain integer. Reorder or insert a new enum constant later and every existing row silently means something different. Always use EnumType.STRING; costs a few bytes, prevents a catastrophic bug."
      />

      <PosterCard
        glyph="Tx"
        title={<>HTTP calls inside @Transactional<span className="dim"></span></>}
        language="java"
        code={`@Transactional
public Order place(NewOrderRequest req) {
    Order order = orders.save(Order.from(req));
    inventory.reserve(order.items()); // network call — holds the
                                       // DB connection for its duration!
    return order;
}`}
        caption="Any I/O inside a transaction holds a DB connection open for the length of that call. A slow downstream service starves your connection pool. Keep transactions to pure DB work; do the HTTP/Kafka call before or after the boundary."
      />

      <PosterCard
        glyph="Ex"
        title={<>Checked exceptions<span className="dim"> don't roll back by default</span></>}
        language="java"
        code={`@Transactional
public void process() throws IOException {
    // ... work ...
    throw new IOException("boom"); // COMMITS anyway!
}

// Fix: be explicit.
@Transactional(rollbackFor = IOException.class)`}
        caption="@Transactional only rolls back on unchecked (RuntimeException) by default — a thrown checked exception commits whatever happened before it. Use rollbackFor when a checked exception should undo the transaction."
      />

      <PosterCard
        glyph="H2"
        title={<>H2 lies<span className="dim"> about production behavior</span></>}
        language="text"
        code={`H2 differs from Postgres in: case-insensitive collations,
array/JSON columns, window functions, CTE semantics.

A @DataJpaTest can pass on H2 and fail in prod.
spring.jpa.database=POSTGRESQL only changes Hibernate's
SQL dialect — H2's ENGINE still runs H2 SQL underneath.`}
        caption="Anything beyond trivial CRUD deserves a TestContainers test against the real engine — setting the dialect property does not make H2 behave like Postgres."
      />

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
        glyph="Sc"
        title={<>@Scheduled<span className="dim"> runs once per replica</span></>}
        language="java"
        code={`@Scheduled(cron = "0 15 3 * * *")
public void nightlyReindex() { /* ... */ }

// 5 replicas in production = this runs 5 times, not once.
// Fix: distributed lock (Shedlock) or move the job to a
// real external scheduler (K8s CronJob) calling your API.`}
        caption="Every replica of a horizontally-scaled service runs its own copy of every @Scheduled method — there is no built-in coordination. A job assumed to run once nightly can quietly run N times and double-process data."
      />

      <PosterCard
        glyph="Cf"
        title={<>@ConfigurationProperties<span className="dim"> without validation</span></>}
        language="java"
        code={`// WRONG — a missing/malformed property fails at first USE,
// deep in a request, hours after deploy.
@ConfigurationProperties(prefix = "app.catalog")
public record CatalogApiProperties(String baseUrl) { }

// RIGHT — fails fast at STARTUP instead.
@ConfigurationProperties(prefix = "app.catalog")
@Validated
public record CatalogApiProperties(@NotBlank String baseUrl) { }`}
        caption="Skipping @Validated on a properties class turns a bad config value into a runtime NullPointerException in production instead of a startup failure your deploy pipeline would have caught immediately."
      />

      <PosterQuickRef
        title="Gotcha -> fix, fast lookup"
        rows={[
          { need: '@Transactional silently no-ops', answer: 'Called via this. — extract to another bean' },
          { need: 'Private method annotation ignored', answer: 'Spring AOP only weaves public methods' },
          { need: '1000+ queries for a list endpoint', answer: 'N+1 — add @EntityGraph or JOIN FETCH' },
          { need: 'Old rows change meaning after a deploy', answer: 'Enum ORDINAL mapping — always use STRING' },
          { need: 'Checked exception but no rollback', answer: '@Transactional(rollbackFor = ...)' },
          { need: 'JPA test passes, prod query fails', answer: 'H2 lies — retest on TestContainers' },
          { need: 'NoSuchElementException from Optional', answer: 'Use orElseThrow, never bare .get()' },
          { need: 'Default object built on every call', answer: 'orElseGet(Supplier), not orElse(value)' },
          { need: 'Vthreads throttling under load', answer: 'Pinning — swap synchronized for ReentrantLock' },
          { need: 'Nightly job runs N times', answer: 'Shedlock or move it to an external scheduler' },
        ]}
      />
    </PosterLayout>
  );
}
