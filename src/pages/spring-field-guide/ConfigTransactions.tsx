import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringConfigTransactions() {
  return (
    <PosterLayout
      accent="emerald"
      eyebrow="Spring Boot 4 · Field Reference"
      title="Config & Transactions"
      tagline="Property precedence, typed config, profiles, and the propagation/isolation mechanics behind @Transactional — condensed for offline study."
      meta={['Spring Boot 4', '14 patterns']}
      footerLabel="Personal study reference — Spring Boot"
      pageLabel="Spring Field Guide · Config & Transactions"
      prev={{ path: '/spring-field-guide/spring-data', label: 'Spring Data & JPA' }}
      next={{ path: '/spring-field-guide/spring-security', label: 'Spring Security' }}
    >
      <PosterCard
        glyph="Pc"
        title={<>Property precedence<span className="dim"> — highest wins</span></>}
        language="text"
        code={`Command-line args        --db.url=jdbc:postgresql://...
Java system properties   -Dspring.profiles.active=prod
OS environment variables DB_URL=jdbc:postgresql://...
application-{profile}.yml  (outside the jar beats inside)
application.yml            (outside the jar beats inside)
@PropertySource on @Configuration
Default properties (SpringApplication.setDefaultProperties)`}
        caption="Two rules cover 90% of 'why is this value X in dev and Y in prod' debugging: env vars beat files, and profile-specific files beat the base application.yml."
      />

      <PosterCard
        glyph="Rb"
        title={<>Relaxed binding<span className="dim"> — and where it stops</span></>}
        language="text"
        code={`An env var can't contain a dot. So how does SPRING_DATASOURCE_URL
become spring.datasource.url? Relaxed binding: one property, many
accepted spellings.

Canonical (use this in YAML):   app.catalog-api.max-retries
  app.catalog-api.max-retries   kebab-case  <- canonical
  app.catalogApi.maxRetries     camelCase
  app.catalog_api.max_retries   snake_case
  APP_CATALOG_API_MAX_RETRIES   upper snake <- environment variables

THE ENV-VAR RULE, precisely: uppercase it, then replace every character
that is not a letter or digit with '_'. Dots AND dashes both become '_'.
  spring.datasource.url          -> SPRING_DATASOURCE_URL
  spring.jpa.hibernate.ddl-auto  -> SPRING_JPA_HIBERNATE_DDLAUTO
  app.servers[0].host            -> APP_SERVERS_0_HOST

So you can override anything in a container with no file:
  docker run -e SPRING_DATASOURCE_URL=jdbc:postgresql://db/orders my-app`}
        caption={<><strong>@ConfigurationProperties gets relaxed binding; @Value does not.</strong> Properties classes bind through the <code>Binder</code>, which tries every spelling above. <code>@Value(&quot;${'{'}...{'}'}&quot;)</code> is a plain placeholder lookup against the <code>Environment</code> — it matches the exact string you wrote and nothing else. The classic failure: <code>@Value(&quot;${'{'}app.maxRetries{'}'}&quot;)</code> works locally where the YAML spells it <code>maxRetries</code>, then fails in prod where the value arrives as <code>APP_MAX_RETRIES</code>. One more reason typed properties are the default.</>}
      />

      <PosterCard
        glyph="Ph"
        title={<>Placeholder syntax<span className="dim"> — required vs default</span></>}
        language="text"
        code={`\${var}                     required — startup FAILS if missing
\${var:default}             fallback if missing
\${var:\${other:literal}}    nested defaults
\${random.uuid}             generated at startup
\${random.int(10,100)}      random int in range`}
        caption="Skipping the default (${API_TOKEN} not ${API_TOKEN:}) is how you make a missing secret fail fast at startup instead of null-pointering deep in a request hours later."
      />

      <PosterCard
        glyph="Cp"
        title={<>@ConfigurationProperties<span className="dim"> — the typed default</span></>}
        language="java"
        code={`@ConfigurationProperties(prefix = "app.external.catalog-api")
@Validated
public record CatalogApiProperties(
        @NotBlank String baseUrl,
        @NotNull Duration timeout,
        @NotNull @Positive Integer maxRetries) {

    public CatalogApiProperties {          // compact ctor = defaults
        if (maxRetries == null) maxRetries = 3;
    }
}

@SpringBootApplication
@ConfigurationPropertiesScan
public class Application { }`}
        caption="A record makes config immutable, and its canonical constructor is what tests instantiate directly — no builder, no setters. @Validated is what turns a bad value into a startup failure your deploy pipeline catches — never skip it."
      />

      <PosterCard
        glyph="Nc"
        title={<>Nested config<span className="dim"> — trees, not flat keys</span></>}
        language="java"
        code={`@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Features features,
        Map<String, ClientConfig> clients) {

    public record Features(
            Notifications notifications, boolean darkMode) {
        public record Notifications(boolean enabled, String channel) { }
    }
    public record ClientConfig(String baseUrl, Duration timeout) { }
}
// app.clients.catalog.base-url, app.clients.billing.timeout, ...`}
        caption="A Map<String, ClientConfig> binds an arbitrary set of named clients from yaml without a case per client — add a new one in config, zero code changes."
      />

      <PosterCard
        glyph="Vl"
        title={<>@Value<span className="dim"> — fine for one-offs only</span></>}
        language="java"
        code={`@Component
public class Foo {
    @Value("\${app.upload.dir}")               // required
    private String uploadDir;

    @Value("\${app.upload.max-bytes:26214400}") // with default
    private long maxBytes;

    @Value("\${app.allowed-origins:}")          // comma-list -> List
    private List<String> allowedOrigins;
}`}
        caption="Fine for one or two values in a small class. Three or more @Value fields in one place is a smell — switch to a typed @ConfigurationProperties record instead."
      />

      <PosterCard
        glyph="Ap"
        title={<>Activating profiles<span className="dim"></span></>}
        language="text"
        code={`# Command line
java -jar app.jar --spring.profiles.active=prod,us-east-1

# Environment variable
export SPRING_PROFILES_ACTIVE=prod,us-east-1

# application.yml
spring:
  profiles:
    active: dev

# In tests
@ActiveProfiles("test")`}
        caption="Multiple profiles can be active at once (comma-separated) — properties from every active profile file merge, with later ones in the precedence chain winning on conflicts."
      />

      <PosterCard
        glyph="Pb"
        title={<>Profile-scoped beans<span className="dim"> — @Profile</span></>}
        language="java"
        code={`@Service
@Profile("prod")
public class SesEmailSender implements EmailSender { }

@Service
@Profile("!prod")            // any profile EXCEPT prod
public class LogOnlyEmailSender implements EmailSender {
    public void send(Email e) { log.info("[suppressed] {}", e.subject()); }
}`}
        caption="Swap an entire bean implementation by environment — a real SES sender in prod, a log-only stub everywhere else. The negation syntax (!prod) keeps you from listing every non-prod profile."
      />

      <PosterCard
        glyph="!"
        badge="Gotcha"
        title={<>Profiles for modes<span className="dim">, not feature flags</span></>}
        language="text"
        code={`Fine:   dev / test / prod  — genuinely different modes.

A trap at scale:
  prod-eu-canary-feature-x   <- profile matrix explosion

Prefer flag-driven config instead:
  @ConditionalOnProperty(prefix = "features.notifications",
      name = "enabled", havingValue = "true")`}
        caption="Profiles combine multiplicatively — add regions, canaries, and A/B experiments and you get a combinatorial mess of profile names. Reserve profiles for dev/test/prod; use @ConditionalOnProperty for toggles."
      />

      <PosterCard
        glyph="Sk"
        title={<>Secrets<span className="dim"> — never in application.yml</span></>}
        language="yaml"
        code={`spring:
  datasource:
    password: \${DATABASE_PASSWORD}      # no default: fails if unset

app:
  external:
    stripe:
      api-key: \${STRIPE_API_KEY}
      webhook-secret: \${STRIPE_WEBHOOK_SECRET}
# local: .env (git-ignored) · cloud: platform secret manager · CI: masked secrets`}
        caption="A reference (${VAR}) is safe to commit; the value never is. /actuator/env and /actuator/configprops dump the resolved Environment, secrets included — authenticate or exclude them in prod."
      />

      <PosterCard
        glyph="Pp"
        title={<>Propagation<span className="dim"> — modes you'll actually use</span></>}
        language="text"
        code={`REQUIRED (default)  join existing tx, else start one — 99% of methods
REQUIRES_NEW        suspend + always start a new one — audit logs,
                     "commit even if caller fails". Takes a 2nd
                     connection — pool-exhaustion risk in a loop.
SUPPORTS             join if a tx exists, else run without one
NOT_SUPPORTED        suspend current tx, run with none — long reports
MANDATORY             throw if no tx is active
NESTED                JDBC savepoint — rollback undoes only this segment`}
        caption="NESTED is the one people forget exists: a savepoint lets an inner failure roll back just that segment while the outer transaction keeps going — JDBC-backed, usually not available under JPA."
      />

      <PosterCard
        glyph="!"
        badge="Gotcha"
        title={<>UnexpectedRollbackException<span className="dim"> — &quot;I caught it, why did it roll back?&quot;</span></>}
        language="java"
        code={`@Transactional                              // outer: starts the tx
public void importAll(List<Row> rows) {
    for (var row : rows) {
        try {
            importer.importOne(row);        // separate bean -> proxy DOES apply
        } catch (Exception e) {
            log.warn("skipping bad row", e);  // "handled" — carry on
        }
    }
}                                            // commit -> BOOM

@Transactional                               // inner: REQUIRED (the default)
public void importOne(Row row) { ... }       // so it JOINS the outer tx

// org.springframework.transaction.UnexpectedRollbackException:
//   Transaction silently rolled back because it has been marked as rollback-only

// WHY it follows from REQUIRED: the inner method did not get its own
// transaction — it joined yours. When it threw, Spring could not roll back
// "just the inner part", so it set rollbackOnly on the SHARED transaction.
// Your catch swallowed the exception but not the flag. At commit time the
// tx manager sees rollbackOnly and refuses.

// FIXES — pick by intent:
//   inner work is independent   -> @Transactional(propagation = REQUIRES_NEW)
//   this exception is benign    -> @Transactional(noRollbackFor = X.class)
//   it needn't be in a tx       -> move it outside the boundary`}
        caption={<>Not a mystery once you follow the propagation: <code>REQUIRED</code> means the inner method <em>joins</em> the caller&apos;s transaction rather than getting its own, so its failure is your failure. Catching the exception hides the symptom and leaves the <code>rollbackOnly</code> flag set — the whole batch dies at commit, after every log line said it succeeded.</>}
      />

      <PosterCard
        glyph="Is"
        title={<>Isolation levels<span className="dim"> — leave at the DB default</span></>}
        language="text"
        code={`READ_UNCOMMITTED   Sees dirty writes. Never use.
READ_COMMITTED     Sees only committed data. Postgres/Oracle default.
REPEATABLE_READ    Same read = same result in-tx. MySQL InnoDB default.
SERIALIZABLE       Fully sequential. Strictest, most contention.`}
        caption="Higher isolation trades throughput for safety — it is not free. For most concurrent-write conflicts, @Version (optimistic locking) beats reaching for SERIALIZABLE."
      />

      <PosterCard
        glyph="Tt"
        title={<>TransactionTemplate<span className="dim"> — programmatic control</span></>}
        language="java"
        code={`@Service
public class ImportService {
    private final TransactionTemplate txTemplate;
    public ImportService(PlatformTransactionManager mgr) {
        this.txTemplate = new TransactionTemplate(mgr);
    }

    void flushBatch(List<Row> batch) {
        txTemplate.executeWithoutResult(status ->
            rowRepository.saveAll(batch));
    }
}`}
        caption="Reach for this when transaction boundaries don't line up with method boundaries — batching 500-row chunks inside a loop, or transactional code inside a lambda that can't carry @Transactional."
      />

      <PosterQuickRef
        title="Which config/transaction tool do I need?"
        rows={[
          { need: 'Value differs dev vs prod', answer: 'Env var — beats every file-based source' },
          { need: 'Override a property from a container', answer: 'UPPER_SNAKE env var — non-alphanumerics become _' },
          { need: 'Property binds under @ConfigurationProperties but not @Value', answer: 'Only the former gets relaxed binding — write the exact key' },
          { need: 'Custom config, 3+ related values', answer: '@ConfigurationProperties record + @Validated' },
          { need: 'Fail fast on bad config', answer: '@Validated + no default on the placeholder' },
          { need: 'Different bean per environment', answer: '@Profile("prod") / @Profile("!prod")' },
          { need: 'Feature toggle, not an environment', answer: '@ConditionalOnProperty, not a new profile' },
          { need: 'A secret value', answer: 'Env var / secret manager — never committed yaml' },
          { need: '"Commit even if caller fails"', answer: 'Propagation.REQUIRES_NEW' },
          { need: 'Caught the exception, still got UnexpectedRollbackException', answer: 'Inner REQUIRED joined your tx and set rollbackOnly — use REQUIRES_NEW/noRollbackFor' },
          { need: 'Partial rollback inside a larger tx', answer: 'Propagation.NESTED (JDBC savepoint)' },
          { need: 'Concurrent write conflict', answer: '@Version optimistic locking, not SERIALIZABLE' },
          { need: 'Transaction boundary not = method boundary', answer: 'TransactionTemplate' },
        ]}
      />
    </PosterLayout>
  );
}
