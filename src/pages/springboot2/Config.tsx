import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Config() {
  return (
    <LessonLayout
      title="Configuration & Properties That Moved"
      sectionId="springboot2"
      lessonIndex={4}
      prev={{ path: '/springboot2/data', label: 'Spring Data & JPA on Hibernate 5' }}
      next={{ path: '/springboot2/testing', label: 'Testing in Boot 2 — @MockBean and Friends' }}
    >
      <p>
        Configuration is the part of a Boot 2 upgrade that <em>does not fail at compile time</em>.
        The jakarta namespace change is loud — thousands of red squiggles, and you cannot ignore
        it. A renamed property is silent: the key you wrote is simply not read by anything, the
        framework falls back to its default, and you find out in production when your Redis pool
        is the wrong size or your header limit is back to 8&nbsp;KB.
      </p>
      <p>
        This lesson is about how Boot 2 config works, which keys moved, and — most usefully — the
        tool that will tell you which ones <em>your</em> application is using so you do not have to
        read a release-notes appendix line by line.
      </p>

      <h2>The Tool That Does This For You</h2>
      <p>
        Spring Boot ships a dependency whose entire job is to compare the keys in your{' '}
        <code>Environment</code> against its own metadata and report the ones that have been
        renamed. Add it, start the app, read the log, delete it. It is the single highest-value
        thing in this lesson.
      </p>

      <CodeBlock language="xml" title="pom.xml — add it as runtime scope, temporarily">
{`<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-properties-migrator</artifactId>
    <scope>runtime</scope>
</dependency>`}
      </CodeBlock>

      <CodeBlock language="text" title="build.gradle equivalent">
{`runtimeOnly 'org.springframework.boot:spring-boot-properties-migrator'`}
      </CodeBlock>

      <FlowChart
        title="How to find every renamed property in your app"
        chart={"graph TD\nA[Boot 2.7 app, config unchanged] --> B[Add spring-boot-properties-migrator]\nB --> C[Bump to Boot 3.x and start the app]\nC --> D{What did it log?}\nD -->|WARN: renamed| E[Temporarily mapped for you — app behaves correctly]\nD -->|ERROR: no longer supported| F[NOT mapped — your value is being ignored right now]\nE --> G[Update application.yml to the new keys]\nF --> G\nG --> H[Restart: log is silent]\nH --> I[Delete the migrator dependency]"}
      />

      <h3>What it actually prints</h3>
      <p>
        This is a real run. A Boot 3.5.16 application with the migrator on the classpath and four
        deliberately-stale keys in <code>application.properties</code>:
      </p>

      <CodeBlock language="properties" title="application.properties — the Boot 2 spellings">
{`spring.redis.host=localhost
spring.redis.port=6379
server.max-http-header-size=16KB
spring.data.cassandra.keyspace-name=demo`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual startup log — Spring Boot 3.5.16, trimmed to the migrator output">
{`2026-08-24T18:24:35.630  INFO 42773 --- [main] demo.App : Started App in 0.899 seconds
2026-08-24T18:24:35.631  WARN 42773 --- [main] o.s.b.c.p.m.PropertiesMigrationListener  :
The use of configuration keys that have been renamed was found in the environment:

Property source 'Config resource 'class path resource [application.properties]' via location 'optional:classpath:/'':
	Key: spring.data.cassandra.keyspace-name
		Line: 4
		Replacement: spring.cassandra.keyspace-name
	Key: spring.redis.host
		Line: 1
		Replacement: spring.data.redis.host
	Key: spring.redis.port
		Line: 2
		Replacement: spring.data.redis.port

Each configuration key has been temporarily mapped to its replacement for your
convenience. To silence this warning, please update your configuration to use
the new keys.

2026-08-24T18:24:35.632 ERROR 42773 --- [main] o.s.b.c.p.m.PropertiesMigrationListener  :
The use of configuration keys that are no longer supported was found in the environment:

Property source 'Config resource 'class path resource [application.properties]' via location 'optional:classpath:/'':
	Key: server.max-http-header-size
		Line: 3
		Reason: Replacement key 'server.max-http-request-header-size' uses an incompatible target type

Please refer to the release notes or reference guide for potential alternatives.`}
      </CodeBlock>

      <InfoBox variant="danger" title="WARN and ERROR mean very different things — this is the whole trick">
        <p>
          Notice that the migrator produced <strong>two separate blocks</strong>, at two different
          log levels, and they are not the same severity of problem:
        </p>
        <ul>
          <li>
            <strong>WARN — &quot;renamed&quot;.</strong> The migrator has{' '}
            <em>temporarily mapped the old key to the new one for you</em>. Your Redis host is
            working right now. This is a to-do item, not an outage. When you delete the migrator
            dependency, the mapping disappears — so the cleanup has to happen before you remove it.
          </li>
          <li>
            <strong>ERROR — &quot;no longer supported&quot;.</strong> Nothing was mapped. In the
            run above, <code>server.max-http-header-size=16KB</code> is being{' '}
            <strong>silently ignored</strong> and the server is running on the default header
            limit. The migrator could not auto-map it because the replacement key has an
            incompatible target type, so it can only tell you.
          </li>
        </ul>
        <p>
          The practical consequence: <strong>an app can start clean, serve traffic, pass a smoke
          test, and still be misconfigured.</strong> Read the ERROR block first.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Two limits on what the migrator can see">
        <p>
          It reports on keys <em>present in the Environment at startup</em>. A key that only
          appears under the <code>prod</code> profile is invisible unless you start the app with
          that profile active — so run it once per profile, or at minimum once with your production
          config tree mounted. And it only knows about keys that Spring Boot itself publishes
          metadata for; a renamed property belonging to a third-party starter is only covered if
          that starter ships its own deprecation metadata.
        </p>
        <p>
          Also: <strong>remove it before you ship.</strong> It exists to report, and leaving it in
          means production is quietly relying on those temporary mappings.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="Run the migrator on an EARLY 3.x — the metadata is pruned over time">
        <p>
          This is the least obvious thing on the page, and it was verified by running the same
          config against two Boot versions. Boot&apos;s deprecation metadata is not kept forever:
          once a rename is a few releases old, the entry is deleted and the migrator goes quiet
          about it.
        </p>
        <CodeBlock language="properties" title="The same two keys, fed to two different Boot versions">
{`management.metrics.export.prometheus.enabled=true
management.metrics.export.prometheus.step=1m`}
        </CodeBlock>
        <CodeBlock language="text" title="Spring Boot 3.0.13 — reports both">
{`WARN o.s.b.c.p.m.PropertiesMigrationListener :
The use of configuration keys that have been renamed was found in the environment:
	Key: management.metrics.export.prometheus.enabled
		Line: 1
		Replacement: management.prometheus.metrics.export.enabled
	Key: management.metrics.export.prometheus.step
		Line: 2
		Replacement: management.prometheus.metrics.export.step`}
        </CodeBlock>
        <CodeBlock language="text" title="Spring Boot 3.5.16 — same keys, same migrator, total silence">
{`(no PropertiesMigrationListener output at all — the app starts clean)`}
        </CodeBlock>
        <p>
          So &quot;I ran the migrator on the latest 3.5 and it was clean&quot; does{' '}
          <strong>not</strong> mean your config is current. Run it on the{' '}
          <strong>first</strong> 3.x you land on — ideally 3.0 or 3.1 — because that is where the
          2&nbsp;→&nbsp;3 rename metadata still lives. This is a concrete argument for stepping
          through 3.0 rather than jumping 2.7 straight to 3.5.
        </p>
      </InfoBox>

      <h2>The Renames Worth Knowing By Heart</h2>
      <p>
        Run the migrator for the complete list for your app. These are the ones common enough that
        you will recognise them on sight in someone else&apos;s <code>application.yml</code> and
        immediately know the codebase predates Boot 3.
      </p>

      <CodeBlock language="text" title="Boot 2 key → Boot 3+ key">
{`spring.redis.*                    ->  spring.data.redis.*
    spring.redis.host             ->  spring.data.redis.host
    spring.redis.port             ->  spring.data.redis.port
    (Redis moved UNDER spring.data — it was the odd one out before.)

spring.data.cassandra.*           ->  spring.cassandra.*
    (Cassandra moved the OTHER WAY, OUT of spring.data. These two renames
     are mirror images of each other, which is exactly why people typo them.
     Redis moved in; Cassandra moved out.)

server.max-http-header-size       ->  server.max-http-request-header-size
    (Renamed to make room for a separate RESPONSE header limit. This is the
     one the migrator reports as ERROR, not WARN — it is not auto-mapped.)

spring.profiles: prod             ->  spring.config.activate.on-profile: prod
    (In-document profile activation. Deprecated in 2.4, REMOVED in 3.0.)

spring.jpa.hibernate.use-new-id-generator-mappings
    (Removed in Boot 3 — Hibernate 6 has no equivalent switch. See the
     Data lesson; this one changes generated primary keys, so it is a
     data-correctness issue rather than a config chore.)`}
      </CodeBlock>

      <InfoBox variant="note" title="Why 'spring.data.redis' and not 'spring.redis'?">
        <p>
          The <code>spring.data.*</code> prefix is reserved for keys consumed by a{' '}
          <strong>Spring Data module</strong>. Redis support lives in Spring Data Redis, so it
          belonged under that prefix and had been the historical exception. Cassandra&apos;s
          connection-level settings (contact points, keyspace, SSL) are consumed by the{' '}
          <em>driver</em>, not by Spring Data Cassandra, so they moved out to{' '}
          <code>spring.cassandra.*</code>. Knowing the rule means you can usually guess the
          direction rather than looking it up.
        </p>
      </InfoBox>

      <h2>Relaxed Binding — Unchanged, and Still the Thing People Get Wrong</h2>
      <p>
        Relaxed binding works identically in Boot 2 and Boot 4, so nothing here is a migration
        item. It is in this lesson because a Boot 2 codebase is old enough to contain the mistake,
        and because the fix is the same one you would make today.
      </p>

      <CodeBlock language="text" title="Four spellings, one property">
{`Canonical form (write this in YAML):   app.catalog-api.max-retries

  app.catalog-api.max-retries     kebab-case   <- canonical
  app.catalogApi.maxRetries       camelCase
  app.catalog_api.max_retries     snake_case
  APP_CATALOG_API_MAX_RETRIES     upper snake  <- environment variables

THE ENV-VAR RULE: uppercase it, then replace every character that is not a
letter or a digit with '_'. Dots AND dashes both become '_'.

  spring.datasource.url          ->  SPRING_DATASOURCE_URL
  spring.redis.host              ->  SPRING_REDIS_HOST        (Boot 2)
  spring.data.redis.host         ->  SPRING_DATA_REDIS_HOST   (Boot 3+)
  app.servers[0].host            ->  APP_SERVERS_0_HOST`}
      </CodeBlock>

      <InfoBox variant="danger" title="@ConfigurationProperties gets relaxed binding. @Value does not.">
        <p>
          A <code>@ConfigurationProperties</code> class binds through the <code>Binder</code>,
          which tries every spelling above. <code>{'@Value("${...}")'}</code> is a plain
          placeholder lookup against the <code>Environment</code> — the exact string you wrote,
          nothing else.
        </p>
        <p>
          This is why <code>{'@Value("${app.maxRetries}")'}</code> works on a laptop where{' '}
          <code>application.yml</code> spells it <code>maxRetries</code>, then fails in Kubernetes
          where the value arrives as <code>APP_MAX_RETRIES</code>. In a legacy Boot 2 service this
          bites hardest during containerisation, because that is usually the moment config first
          starts arriving as environment variables.
        </p>
      </InfoBox>

      <h2>@ConfigurationProperties on Boot 2</h2>
      <p>
        The annotation itself is unchanged. Two things around it are not.
      </p>

      <h3>1. Registration: three ways, and Boot 2 code usually uses the oldest</h3>
      <CodeBlock language="java" title="All three still work — you will meet all three">
{`// (a) Stereotype it. Simple, but couples the properties class to component
//     scanning and makes it a bean you can accidentally inject anywhere.
@Component
@ConfigurationProperties(prefix = "app.catalog")
public class CatalogProperties { ... }

// (b) Register it explicitly from a @Configuration class. Very common in
//     Boot 2 codebases, and the most verbose.
@Configuration
@EnableConfigurationProperties(CatalogProperties.class)
public class CatalogConfig { }

// (c) Scan for them. Added in Boot 2.2, and what you want today.
@SpringBootApplication
@ConfigurationPropertiesScan
public class Application { }`}
      </CodeBlock>

      <h3>2. @ConstructorBinding moved package — and this one IS a compile error</h3>
      <p>
        Immutable (constructor-bound) properties classes are the good pattern, and Boot 2 supports
        them. But the annotation that enables them lives in a different package in Boot 3+, so
        every Boot 2 codebase that did the right thing has a compile break waiting for it.
      </p>

      <CodeBlock language="java" title="Boot 2 spelling">
{`import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.ConstructorBinding;   // <- HERE

@ConfigurationProperties(prefix = "app.catalog")
@ConstructorBinding
public class CatalogProperties {
    private final String baseUrl;
    private final Integer maxRetries;

    public CatalogProperties(String baseUrl, Integer maxRetries) {
        this.baseUrl = baseUrl;
        this.maxRetries = maxRetries;
    }
    public String getBaseUrl() { return baseUrl; }
    public Integer getMaxRetries() { return maxRetries; }
}`}
      </CodeBlock>

      <p>
        That import compiles cleanly on Spring Boot 2.7.18. Carry it to Boot 3.5.16 unchanged and
        the build stops:
      </p>

      <CodeBlock language="text" title="Real javac output — same file, Boot 3.5.16">
{`[ERROR] COMPILATION ERROR :
[ERROR] .../src/main/java/demo/CbCheck.java:[2,51] cannot find symbol
[ERROR]   symbol:   class ConstructorBinding
[ERROR]   location: package org.springframework.boot.context.properties`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3+ spelling — new package, and usually deletable entirely">
{`import org.springframework.boot.context.properties.bind.ConstructorBinding;
//                                             ^^^^^ .bind was inserted

// But read this before you fix the import: from Boot 3 onwards the
// annotation is only needed when the class has MORE THAN ONE constructor,
// to say which one binding should use. With a single constructor it is
// inferred, so the usual fix is to DELETE the annotation, not re-import it.

@ConfigurationProperties(prefix = "app.catalog")
public record CatalogProperties(String baseUrl, Integer maxRetries) { }`}
      </CodeBlock>

      <InfoBox variant="tip" title="Records bind on Boot 2.7 without the annotation">
        <p>
          Verified on a live 2.7.18 app: a <code>record</code> annotated only with{' '}
          <code>@ConfigurationProperties</code> and picked up by{' '}
          <code>@ConfigurationPropertiesScan</code> bound correctly, returning{' '}
          <code>
            CatalogProps[baseUrl=https://catalog.example.com, maxRetries=3]
          </code>
          . So if the Boot 2 code you are reading uses records, it likely has no{' '}
          <code>@ConstructorBinding</code> to migrate. It is the older hand-written immutable
          classes — the ones with an explicit constructor and getters — that carry the stale
          import.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Validation — identical on both, and worth adding during the upgrade">
{`@ConfigurationProperties(prefix = "app.catalog")
@Validated                              // fail at STARTUP, not at first use
public record CatalogProperties(
        @NotBlank String baseUrl,
        @NotNull Duration timeout,
        @NotNull @Positive Integer maxRetries) { }

// Why this matters specifically during a property-rename migration: a key
// that silently stopped being read leaves the field null. @Validated turns
// "mysteriously broken at 3am" into "refused to start, named the property".`}
      </CodeBlock>

      <h2>Profiles and Config Files</h2>
      <p>
        Boot 2.4 rewrote config-file processing, which means &quot;Boot 2&quot; is really two
        different systems depending on the patch version. If the codebase you are reading is on
        2.0&ndash;2.3, it uses the legacy processor; 2.4+ uses the current one. Getting to the
        latest 2.7 patch — step one of the migration — puts you on the modern behaviour.
      </p>

      <CodeBlock language="yaml" title="The in-document profile key: old spelling vs current">
{`# OLD — Boot 2.0-2.3 style. Deprecated in 2.4, REMOVED in Boot 3.0.
# On Boot 3 this key is not an error; it simply does nothing, which is the
# worst possible failure mode: your prod overrides stop applying.
---
spring:
  profiles: prod
app:
  cache:
    ttl: PT10M

# CURRENT — works on Boot 2.4+ and on Boot 3/4.
---
spring:
  config:
    activate:
      on-profile: prod
app:
  cache:
    ttl: PT10M`}
      </CodeBlock>

      <InfoBox variant="warning" title="spring.profiles.include has a rule that surprises people">
        <p>
          From Boot 2.4 onward, <code>spring.profiles.include</code> may only be used in a{' '}
          <em>non-profile-specific</em> document — you cannot use it inside a document that is
          itself guarded by <code>spring.config.activate.on-profile</code>. The replacement for
          the &quot;profile that pulls in other profiles&quot; pattern is{' '}
          <code>spring.profiles.group.*</code>:
        </p>
        <CodeBlock language="yaml" title="Profile groups (Boot 2.4+)">
{`spring:
  profiles:
    group:
      prod: "prod-db,prod-mq,metrics"
# Activating 'prod' now also activates prod-db, prod-mq and metrics.`}
        </CodeBlock>
      </InfoBox>

      <CodeBlock language="yaml" title="spring.config.import — Boot 2.4+, and the reason to get to 2.7 first">
{`spring:
  config:
    import:
      # Each FILE in the directory becomes a property: filename = key,
      # contents = value. Exactly how Kubernetes mounts a Secret or a
      # ConfigMap as a volume.
      - optional:configtree:/etc/secrets/
      - optional:file:./local-overrides.yml
      - optional:vault://

# This is the mechanism that replaces bootstrap.yml and the Spring Cloud
# Config bootstrap context. If the Boot 2 app you are upgrading has a
# bootstrap.yml, it predates this, and moving it to spring.config.import
# is a change you can make WHILE STILL ON 2.7 — one less thing entangled
# with the major-version bump.`}
      </CodeBlock>

      <h3>Precedence, highest wins</h3>
      <CodeBlock language="text" title="Unchanged between Boot 2 and Boot 4">
{`devtools settings
  > @TestPropertySource / @SpringBootTest(properties=...)
  > command-line arguments
  > SPRING_APPLICATION_JSON
  > java -D system properties
  > OS environment variables
  > application-{profile}.yml
  > application.yml
  > @PropertySource
  > defaults

# Which source actually won? Ask the running app:
#   GET /actuator/env/spring.datasource.url
# (On Boot 3+ the VALUE will be masked by default — see the Actuator lesson.)`}
      </CodeBlock>

      <InteractiveChallenge
        question="You upgrade a Boot 2.7 service to Boot 3.5 with spring-boot-properties-migrator on the classpath. The app starts, health is UP, and smoke tests pass. The log contains one WARN block listing spring.redis.host and one ERROR block listing server.max-http-header-size. What is the actual state of the running application?"
        options={[
          "Both keys are broken — the app is running on defaults for Redis and for the header size",
          "Redis is working (the migrator temporarily mapped the key); the header size is NOT applied and is running on the default",
          "Both keys are fine — the migrator maps everything it reports, and the log levels are just cosmetic",
          "The ERROR block would have prevented startup, so the app you are looking at cannot be running"
        ]}
        correctIndex={1}
        explanation="The two log levels describe two different outcomes. The WARN block says explicitly: 'Each configuration key has been temporarily mapped to its replacement for your convenience' — so spring.redis.host IS reaching spring.data.redis.host and Redis is configured correctly, for as long as the migrator stays on the classpath. The ERROR block says 'no longer supported' and gives a Reason ('Replacement key uses an incompatible target type'); nothing was mapped, so server.max-http-header-size=16KB is being ignored entirely and the server is running on its default header limit. This is why the app can start clean, report UP, and pass smoke tests while still being misconfigured — a header-size limit only shows up under a request with large headers, which is exactly the kind of thing a smoke test does not send. Option 4 is wrong for an important reason: the migrator only reports, it never fails startup."
      />

      <InteractiveChallenge
        question={'A Boot 2 service reads @Value("${app.catalog.maxRetries}") and works in every environment until it is deployed to Kubernetes with the value supplied as the env var APP_CATALOG_MAX_RETRIES. It now fails to start with "Could not resolve placeholder". Why, and what is the fix that survives the Boot 3 upgrade too?'}
        options={[
          "Relaxed binding was removed in Boot 2.4 — pin the app to 2.3 or set the property in application.yml instead",
          "Environment variables cannot supply Spring properties without SPRING_APPLICATION_JSON",
          "@Value is a literal placeholder lookup with no relaxed binding — move the property onto a @ConfigurationProperties class, which binds through the Binder and tries every spelling",
          "The env var name is wrong; it should be APP_CATALOG_MAXRETRIES to match the camelCase spelling exactly"
        ]}
        correctIndex={2}
        explanation={'Relaxed binding is a feature of the Binder, which is what @ConfigurationProperties classes bind through — it tries kebab-case, camelCase, snake_case and upper-snake-case. @Value is not part of that machinery at all: it is a plain placeholder resolution against the Environment for the exact string you typed, so "${app.catalog.maxRetries}" looks for a property literally named app.catalog.maxRetries and APP_CATALOG_MAX_RETRIES does not match it. Option 4 is a tempting near-miss — the env-var rule is "uppercase, then replace every non-alphanumeric character with underscore", which is applied to the CANONICAL kebab-case name (app.catalog.max-retries), so APP_CATALOG_MAX_RETRIES is the correct variable name; the problem is the @Value on the receiving end, not the variable. Nothing about this changed between Boot 2 and Boot 4, which is the point: fixing it is not migration work you have to sequence, it is a straight improvement you can land on 2.7 today.'}
      />

      <InfoBox variant="success" title="Config-specific checklist for the 2 → 3 leg">
        <ul>
          <li>Get to the latest 2.7 patch first so you are on the 2.4+ config processor.</li>
          <li>
            Move any <code>bootstrap.yml</code> to <code>spring.config.import</code>{' '}
            <em>while still on 2.7</em>.
          </li>
          <li>
            Grep for <code>spring.profiles:</code> used as an in-document activation key and
            convert it to <code>spring.config.activate.on-profile</code>. It fails silently on
            Boot 3.
          </li>
          <li>
            Add <code>spring-boot-properties-migrator</code>, start the app{' '}
            <strong>once per profile</strong>, and fix the ERROR block before the WARN block.
          </li>
          <li>
            Fix <code>@ConstructorBinding</code> imports — or better, delete the annotation where
            the class has a single constructor.
          </li>
          <li>
            Add <code>@Validated</code> to your properties classes so a key that stopped binding
            fails startup instead of surfacing later as a null.
          </li>
          <li>Remove the migrator dependency before shipping.</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}

export default SpringBoot2Config;
