import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringGotchas() {
  return (
    <PosterLayout
      accent="emerald"
      eyebrow="Spring Boot 4 · Field Reference"
      title="Gotchas & Pitfalls"
      tagline="The got-ya moments — things that compile clean, pass code review, and still silently break in production."
      meta={['Spring Boot 4', '10 gotchas']}
      footerLabel="Personal study reference — Spring Boot Gotchas"
      pageLabel="Spring Field Guide · Gotchas"
      prev={{ path: '/spring-field-guide/boot4', label: 'Spring Boot 4 Novelties' }}
      next={null}
    >
      <PosterCard
        glyph="Su"
        title={<>Startup-failure triage<span className="dim"> — read the message, not the trace</span></>}
        language="text"
        code={`Boot prints a Description/Action block above the stack trace.
That block is the answer; the trace almost never is.

"required a bean of type X that could not be found"
   -> X isn't annotated, OR it lives outside the package tree under your
      @SpringBootApplication class, so component scan never saw it.

"required a single bean, but 2 were found"  (it lists both)
   -> @Primary on the default, or @Qualifier at the injection point.

"...form a cycle"  (with an ASCII diagram of the loop)
   -> extract the shared concern into a third bean. Do NOT set
      spring.main.allow-circular-references=true.

"Port 8080 was already in use"
   -> a previous run:  lsof -i :8080   or  --server.port=8081

"No property 'emial' found for type 'Customer'"
   -> typo in a derived query method name; the message lists the valid ones.

"There is no PasswordEncoder mapped for the id \\"null\\""
   -> stored hashes lack the {bcrypt} prefix DelegatingPasswordEncoder needs.

"Failed to bind properties under 'app.x'"
   -> @ConfigurationProperties + @Validated doing its job. Fix the yaml.

--debug  prints the CONDITIONS EVALUATION REPORT: every auto-configuration
         with the condition that let it in (Positive) or kept it out
         (Negative). The answer to "why does this bean exist / not exist?".`}
        caption={<>Spring Boot&apos;s startup failures are unusually well-diagnosed — a <code>FailureAnalyzer</code> turns the common ones into a plain-English Description and Action. Scrolling past that to read a 200-frame reflection trace is the single biggest time-waster in Spring debugging.</>}
      />

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
        code={`A CGLIB proxy is a SUBCLASS, so it can only weave what a
subclass could override. private and final methods (and
final classes) are out: a private @Transactional or
@Cacheable method compiles fine and does nothing at
runtime — no error, no warning, silently ignored.

NOT out, since Framework 6.0: protected and
package-visible methods. The old "public only" rule is a
Spring 5 fact that outlived its framework.`}
        caption="Unlike self-invocation, this one gives you nothing to grep for — the pointcut 'matches' at compile time but Spring's proxy-based AOP can never intercept a private or final method call. Two carve-outs still hold: a JDK dynamic proxy (interface-based) only ever sees public interface methods, and a package-private method inherited from a parent class in a different package is effectively private."
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
          { need: "App won't start", answer: 'Read the Description/Action block, not the trace. --debug for the conditions report' },
          { need: '@Transactional silently no-ops', answer: 'Called via this. — extract to another bean' },
          { need: 'Private method annotation ignored', answer: 'CGLIB proxies only weave overridable methods — private/final are out. protected + package-private are fine since Framework 6.0' },
          { need: '1000+ queries for a list endpoint', answer: 'N+1 — add @EntityGraph or JOIN FETCH' },
          { need: 'Old rows change meaning after a deploy', answer: 'Enum ORDINAL mapping — always use STRING' },
          { need: 'Connection pool exhausted under load', answer: 'HTTP/Kafka call inside @Transactional — move it outside' },
          { need: 'Checked exception but no rollback', answer: '@Transactional(rollbackFor = ...)' },
          { need: 'JPA test passes, prod query fails', answer: 'H2 lies — retest on TestContainers' },
          { need: 'Nightly job runs N times', answer: 'Shedlock or move it to an external scheduler' },
          { need: 'Config typo blows up mid-request', answer: '@Validated on @ConfigurationProperties' },
        ]}
      />
    </PosterLayout>
  );
}
