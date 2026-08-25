import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Data() {
  return (
    <LessonLayout
      title="Spring Data & JPA on Hibernate 5"
      sectionId="springboot2"
      lessonIndex={3}
      prev={{ path: '/springboot2/security', label: 'Security the Boot 2 Way' }}
      next={{ path: '/springboot2/config', label: 'Configuration & Properties That Moved' }}
    >
      <p>
        The <a href="/springboot2/javax">javax lesson</a> was a compile break: loud, total,
        impossible to ship by accident. This one is the opposite, and that makes it more
        dangerous. The Hibernate 5 &rarr; 6 jump contains changes that compile perfectly, start
        perfectly, and then behave differently against <em>your existing data</em>.
      </p>

      <p>
        Spring Data repositories themselves barely changed. What changed is the ORM underneath
        them, and one of those changes can hand out primary keys that collide with rows you
        already have.
      </p>

      <InfoBox variant="danger" title="The one-sentence version">
        <p>
          Hibernate 6 removed the single global <code>hibernate_sequence</code> default and
          replaced it with a per-entity <code>&lt;table&gt;_SEQ</code> default. If your Boot 2
          database was built on the old default, Hibernate 6 will look for sequences that do not
          exist — or, if schema generation creates them, start numbering from 1 in tables that
          already contain rows. Everything below is elaboration on that sentence.
        </p>
      </InfoBox>

      <h2>Which Hibernate Am I On?</h2>

      <p>
        Boot picks it for you. Verified by reading the <code>spring-boot-dependencies</code> BOM
        for each release straight from Maven Central:
      </p>

      <CodeBlock language="bash" title="The check">
{`for v in 2.7.18 3.0.13 4.1.1; do
  printf '  boot %-8s : ' $v
  curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot-dependencies/$v/spring-boot-dependencies-$v.pom \\
    | grep -oE '<hibernate.version>[^<]+' | head -1
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`  boot 2.7.18  : <hibernate.version>5.6.15.Final
  boot 3.0.13  : <hibernate.version>6.1.7.Final
  boot 4.1.1   : <hibernate.version>7.4.5.Final`}
      </CodeBlock>

      <p>
        So &quot;we are on Boot 2.7&quot; means &quot;we are on Hibernate 5.6&quot;. You do not
        get to upgrade one without the other — which is worth knowing, because it means you cannot
        de-risk the Boot 3 jump by moving to Hibernate 6 first and seeing what breaks.
      </p>

      <h3>The entity imports</h3>

      <p>
        Every entity in a Boot 2 codebase imports from <code>javax.persistence</code>, and every
        one of them must become <code>jakarta.persistence</code>. That is the same mechanical
        rename covered in the <a href="/springboot2/javax">javax lesson</a> — the package mapping
        is 1:1, the class names and annotation attributes are unchanged, and OpenRewrite handles
        it. It is not repeated here.
      </p>

      <p>
        Mentioning it only to be clear about the division of labour:{' '}
        <strong>the import change is free, and everything else on this page is not.</strong> Do
        not let a clean compile after the rename convince you the persistence layer is migrated.
      </p>

      <h2>The ID Generator Change</h2>

      <p>
        This is the headline. It is worth understanding the mechanism rather than memorising a
        fix, because the right response depends on what your database already looks like.
      </p>

      <h3>The setting that used to exist</h3>

      <p>
        Boot 2 exposed a property that toggled between Hibernate&apos;s legacy and modern
        identifier generators. Here is its real entry from the configuration metadata inside{' '}
        <code>spring-boot-autoconfigure-2.7.18.jar</code>:
      </p>

      <CodeBlock language="bash" title="Reading configuration metadata out of a Boot jar">
{`unzip -p spring-boot-autoconfigure-2.7.18.jar \\
  META-INF/spring-configuration-metadata.json | jq '.properties[]
    | select(.name == "spring.jpa.hibernate.use-new-id-generator-mappings")'`}
      </CodeBlock>

      <CodeBlock language="json" title="Real output — Boot 2.7.18">
{`{
  "name": "spring.jpa.hibernate.use-new-id-generator-mappings",
  "type": "java.lang.Boolean",
  "description": "Whether to use Hibernate's newer IdentifierGenerator for AUTO, TABLE and SEQUENCE. This is actually a shortcut for the \\"hibernate.id.new_generator_mappings\\" property. When not specified will default to \\"true\\".",
  "sourceType": "org.springframework.boot.autoconfigure.orm.jpa.HibernateProperties"
}`}
      </CodeBlock>

      <p>And the same query against Boot 3.0.13:</p>

      <CodeBlock language="json" title="Real output — Boot 3.0.13">
{`{
  "name": "spring.jpa.hibernate.use-new-id-generator-mappings",
  "type": "java.lang.Boolean",
  "description": "Whether to use Hibernate's newer IdentifierGenerator for AUTO, TABLE and SEQUENCE. ...",
  "deprecated": true,
  "deprecation": {
    "level": "error",
    "reason": "Hibernate no longer supports disabling the use of new ID generator mappings."
  }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="What level: error means in Boot's metadata">
        <p>
          Spring Boot&apos;s configuration metadata format defines two deprecation levels.{' '}
          <code>warning</code> is the default and means the property still works but should be
          replaced. <code>error</code> means the property is <strong>no longer bound at
          all</strong> — it has been removed, and setting it has no effect. Every property on this
          page is marked <code>error</code>, which is why none of them fail loudly: a property
          that is not bound is, from the application&apos;s point of view, a property you never
          set.
        </p>
      </InfoBox>

      <h3>The underlying Hibernate constant is gone</h3>

      <p>
        Boot&apos;s property was a shortcut for a Hibernate setting. That setting no longer
        exists, which you can confirm directly:
      </p>

      <CodeBlock language="bash" title="Ask each Hibernate release for the constant">
{`for v in 5.6.15.Final 6.1.7.Final; do
  echo "=== hibernate-core $v ==="
  javap -constants -p -cp hibernate-core-$v.jar org.hibernate.cfg.AvailableSettings \\
    | grep -iE 'new_generator|USE_NEW_ID' || echo "   (no such constant)"
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`=== hibernate-core 5.6.15.Final ===
  public static final java.lang.String USE_NEW_ID_GENERATOR_MAPPINGS = "hibernate.id.new_generator_mappings";
=== hibernate-core 6.1.7.Final ===
   (no such constant)`}
      </CodeBlock>

      <h3>Legacy generator classes were deleted outright</h3>

      <p>
        The old generators the flag selected between are not deprecated in Hibernate 6 — they are
        not in the jar. Checked by listing both jars:
      </p>

      <CodeBlock language="text" title="Real output — presence of ID generator classes (1 = present, 0 = absent)">
{`                                          hib 5.6.15   hib 6.1.7
org.hibernate.id.SequenceGenerator              1            0    <- REMOVED
org.hibernate.id.SequenceHiLoGenerator          1            0    <- REMOVED
org.hibernate.id.MultipleHiLoPerTableGenerator  1            0    <- REMOVED
org.hibernate.id.enhanced.SequenceStyleGenerator 1           1
org.hibernate.id.IdentityGenerator              1            1
org.hibernate.id.UUIDHexGenerator               1            1`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why this matters even though you never wrote those class names">
        <p>
          Most people never referenced these directly — but a surprising number of Boot 2
          codebases do, via <code>@GenericGenerator</code>:
        </p>
        <CodeBlock language="java" title="A pattern that compiles on Boot 3 and fails at runtime">
{`@Id
@GeneratedValue(generator = "legacy")
@GenericGenerator(name = "legacy", strategy = "org.hibernate.id.SequenceGenerator")
private Long id;

// The strategy is a STRING. javac cannot check it. It compiles cleanly on
// Hibernate 6 and fails when Hibernate tries to resolve the generator.`}
        </CodeBlock>
        <p>
          Grep for these before migrating —{' '}
          <code>grep -rn &quot;org.hibernate.id.&quot; --include=&apos;*.java&apos; src/</code> —
          because the compiler will not find them for you.
        </p>
      </InfoBox>

      <h3>The sequence-naming change, and why it is the dangerous one</h3>

      <p>
        Here is the change most likely to cause a real incident, and the bytecode shows it
        cleanly. Look at what <code>SequenceStyleGenerator</code> declares as its defaults in each
        version:
      </p>

      <CodeBlock language="bash" title="The check">
{`for v in 5.6.15.Final 6.1.7.Final; do
  echo "=== hibernate-core $v ==="
  javap -constants -p -cp hibernate-core-$v.jar \\
    org.hibernate.id.enhanced.SequenceStyleGenerator \\
    | grep -iE 'DEF_SEQUENCE|SEQUENCE_SUFFIX'
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`=== hibernate-core 5.6.15.Final ===
  public static final java.lang.String DEF_SEQUENCE_NAME = "hibernate_sequence";
  public static final java.lang.String CONFIG_SEQUENCE_PER_ENTITY_SUFFIX = "sequence_per_entity_suffix";
  public static final java.lang.String DEF_SEQUENCE_SUFFIX = "_SEQ";

=== hibernate-core 6.1.7.Final ===
  public static final java.lang.String CONFIG_SEQUENCE_PER_ENTITY_SUFFIX = "sequence_per_entity_suffix";
  public static final java.lang.String DEF_SEQUENCE_SUFFIX = "_SEQ";`}
      </CodeBlock>

      <p>
        <code>DEF_SEQUENCE_NAME = &quot;hibernate_sequence&quot;</code> is <strong>gone</strong> in
        6.1. The single shared global sequence is no longer a default that exists; per-entity
        naming via <code>DEF_SEQUENCE_SUFFIX</code> is the only remaining behaviour.
      </p>

      <FlowChart
        title="What happens to your IDs across the upgrade"
        chart={"graph TD\nA[\"@GeneratedValue(strategy = SEQUENCE) with no generator name\"] --> B[\"Hibernate 5: default sequence 'hibernate_sequence'\"]\nA --> C[\"Hibernate 6: default sequence 'order_SEQ' (per entity)\"]\nB --> D[\"Your production DB has hibernate_sequence, currently at 4,812,006\"]\nC --> E{\"Does order_SEQ exist?\"}\nE -->|\"No, ddl-auto=validate\"| F[\"Startup fails — loud, and this is the GOOD outcome\"]\nE -->|\"No, ddl-auto=update\"| G[\"Hibernate CREATES it, starting at 1\"]\nG --> H[\"Inserts collide with existing rows: duplicate key violation\"]\nstyle F fill:#3a2f1a,stroke:#fbbf24\nstyle H fill:#3a1f1f,stroke:#f87171"}
      />

      <InfoBox variant="danger" title="Read that diagram carefully — the safe path is the one that fails">
        <p>
          With <code>spring.jpa.hibernate.ddl-auto=validate</code> (or <code>none</code> plus a
          migration tool), a missing sequence is a startup failure. Loud, immediate, caught in
          your first test environment. That is the outcome you want.
        </p>
        <p>
          With <code>ddl-auto=update</code>, Hibernate helpfully creates the missing sequence
          starting from 1 — into a table that already has four million rows. The application
          starts fine. It serves traffic fine. It fails on insert, intermittently, with primary
          key violations, and the cause is several layers away from the symptom.
        </p>
        <p>
          If your Boot 2 application runs <code>ddl-auto=update</code> against production, fixing
          that is a prerequisite for this migration, not a nice-to-have.
        </p>
      </InfoBox>

      <h3>What to actually do about it</h3>

      <CodeBlock language="java" title="Option A (best) — name the generator explicitly, before you migrate">
{`// Do this while STILL ON BOOT 2. It pins the sequence name to what your
// database already has, so the Hibernate 6 default never comes into play.
// Behaviour is identical on Hibernate 5, so this ships as a no-op change.
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_gen")
@SequenceGenerator(name = "order_gen",
                   sequenceName = "hibernate_sequence",   // the EXISTING sequence
                   allocationSize = 50)                   // match what you already use
private Long id;`}
      </CodeBlock>

      <InfoBox variant="warning" title="allocationSize is its own trap, and it is not new">
        <p>
          <code>@SequenceGenerator</code> defaults <code>allocationSize</code> to{' '}
          <strong>50</strong>, and Hibernate expects the database sequence to be declared with a
          matching <code>INCREMENT BY 50</code>. A database sequence created with{' '}
          <code>INCREMENT BY 1</code> against a mapping that says 50 will hand out overlapping
          identifiers. If you are adding explicit <code>@SequenceGenerator</code> annotations as
          part of this work, check the real increment on the real sequence rather than assuming:
        </p>
        <CodeBlock language="sql" title="Postgres: what is actually there">
{`SELECT sequencename, increment_by, last_value
  FROM pg_sequences
 WHERE schemaname = 'public';`}
        </CodeBlock>
      </InfoBox>

      <CodeBlock language="sql" title="Option B — rename the sequences to match the new default">
{`-- Only if you genuinely want per-entity sequences (which is the better
-- long-term design — a single global sequence is a contention point).
-- Do it as a versioned migration, not by hand.

CREATE SEQUENCE order_seq START WITH 5000000 INCREMENT BY 50;
CREATE SEQUENCE customer_seq START WITH 5000000 INCREMENT BY 50;

-- Start each one comfortably ABOVE the current max id in its table.
-- Verify before switching:
--   SELECT MAX(id) FROM orders;`}
      </CodeBlock>

      <InfoBox variant="note" title="A note on what I could and could not verify here">
        <p>
          The constants, the removed classes and the metadata above are all read from real
          published jars, and the commands to reproduce them are on this page. The{' '}
          <em>runtime consequences</em> — the exact duplicate-key error, the sequence Hibernate
          picks for a given mapping — are documented behaviour that I did not stand up a database
          and a Boot 2 application to reproduce. I would rather tell you that than paste a console
          block I invented. Treat the mechanism as verified and the incident narrative as the
          well-documented consequence of it.
        </p>
      </InfoBox>

      <h3>GenerationType.AUTO deserves its own warning</h3>

      <CodeBlock language="java" title="The mapping to be most suspicious of">
{`@Id
@GeneratedValue(strategy = GenerationType.AUTO)   // or just @GeneratedValue
private Long id;

// AUTO means "Hibernate, you decide." What it decides depends on the
// dialect AND the Hibernate version. That is precisely the combination
// this migration changes — both at once.
//
// IDENTITY and TABLE are explicit and far more predictable across the jump.
// SEQUENCE is explicit but subject to the naming default above.
// AUTO is the one where you should go and check what it resolved to.`}
      </CodeBlock>

      <CodeBlock language="properties" title="Make Hibernate tell you what it is doing">
{`# Turn this on in a test environment during migration and read the DDL and
# the sequence calls it actually emits, on BOTH versions, and diff them.
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.id=DEBUG

# Dump the schema Hibernate WOULD create, without touching the database:
spring.jpa.properties.jakarta.persistence.schema-generation.scripts.action=create
spring.jpa.properties.jakarta.persistence.schema-generation.scripts.create-target=/tmp/schema.sql
# (on Boot 2 the same keys are spelled javax.persistence.schema-generation.*)

# Diffing those two files across the two versions is the single most
# useful thing you can do before this migration.`}
      </CodeBlock>

      <h2>Other spring.jpa Behaviour Worth Knowing</h2>

      <CodeBlock language="text" title="Things that changed shape between Boot 2 and Boot 3">
{`spring.jpa.hibernate.use-new-id-generator-mappings
    REMOVED (level: error). Covered above.

spring.jpa.defer-datasource-initialization
    Added in Boot 2.5 and it still catches people. From 2.5 onward,
    data.sql runs BEFORE Hibernate creates the schema, so a data.sql that
    inserts into a Hibernate-generated table fails unless you set this to
    true. Not a Boot 3 change, but Boot 2 codebases upgrading WITHIN 2.x
    hit it, and it is often mistaken for a Boot 3 problem.

spring.jpa.open-in-view
    Default is TRUE in both. It has always logged a warning at startup
    suggesting you turn it off. This did not change; it is just that more
    people finally read the warning during a migration. Turning it off is
    usually right and is NOT a safe drive-by change — it converts lazy
    loading outside a transaction from "silently works" into
    LazyInitializationException. Do it as its own piece of work.

spring.jpa.properties.hibernate.dialect
    Rarely needed now. Hibernate 6 detects the dialect from the JDBC
    metadata, and several Boot 2 codebases pin a dialect class that was
    renamed or removed in Hibernate 6 (the *83Dialect / *95Dialect
    variants in particular). Try DELETING the pin before trying to
    translate it.`}
      </CodeBlock>

      <h2>Properties That Moved Namespace</h2>

      <p>
        Separate from JPA, several Spring Data property prefixes were reorganised in Boot 3 so
        that the namespace reflects whether a technology is a Spring Data module or a plain
        driver. These are pure renames — but they are renames that <strong>fail
        silently</strong>.
      </p>

      <h3>Redis</h3>

      <CodeBlock language="bash" title="The check">
{`unzip -p spring-boot-autoconfigure-3.0.13.jar \\
  META-INF/spring-configuration-metadata.json \\
  | jq '.properties[] | select(.name == "spring.redis.host")'`}
      </CodeBlock>

      <CodeBlock language="json" title="Real output — Boot 3.0.13">
{`{
  "name": "spring.redis.host",
  "type": "java.lang.String",
  "deprecated": true,
  "deprecation": {
    "level": "error",
    "replacement": "spring.data.redis.host"
  }
}`}
      </CodeBlock>

      <CodeBlock language="yaml" title="Boot 2 -> Boot 3: the whole Redis block moves down one level">
{`# Boot 2
spring:
  redis:
    host: redis.internal
    port: 6379
    password: hunter2
    timeout: 2s
    lettuce:
      pool:
        max-active: 16

# Boot 3/4 — prefix becomes spring.data.redis.*
spring:
  data:
    redis:
      host: redis.internal
      port: 6379
      password: hunter2
      timeout: 2s
      lettuce:
        pool:
          max-active: 16`}
      </CodeBlock>

      <h3>Cassandra — the same idea, in the opposite direction</h3>

      <CodeBlock language="json" title="Real output — Boot 3.0.13">
{`{
  "name": "spring.data.cassandra.keyspace-name",
  "type": "java.lang.String",
  "deprecated": true,
  "deprecation": {
    "level": "error",
    "replacement": "spring.cassandra.keyspace-name"
  }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Both moves, side by side">
{`spring.redis.*            ->  spring.data.redis.*      (moved DOWN, under data)
spring.data.cassandra.*   ->  spring.cassandra.*       (moved UP, out of data)

Why opposite directions? The rule Boot settled on is that spring.data.*
holds the SPRING DATA MODULE's settings, and the bare prefix holds the
DRIVER's connection settings. Cassandra's keyspace and contact points are
driver-level, so they moved out. Redis connection settings are consumed by
Spring Data Redis, so they moved in.

Knowing the rule is less useful than knowing that it is easy to get
backwards. Check the metadata rather than guessing:
  unzip -p spring-boot-autoconfigure-<version>.jar \\
    META-INF/spring-configuration-metadata.json \\
    | jq '.properties[] | select(.deprecation.level == "error")
          | {name, replacement: .deprecation.replacement}'`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why a renamed property is worse than a removed class">
        <p>
          Setting <code>spring.redis.host=redis.internal</code> on Boot 3 does not fail. It is not
          bound to anything, so Redis auto-configuration falls back to its default —{' '}
          <code>localhost:6379</code>. In a container, that is a connection refused at first use;
          in an environment where something <em>is</em> listening on 6379, it is worse, because
          you silently connect to the wrong Redis.
        </p>
        <p>
          The same applies to the password. A moved <code>spring.redis.password</code> means you
          are now connecting with no credentials. There is no error at startup for any of this.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Catch these mechanically instead of by eye">
        <p>
          Add <code>spring-boot-properties-migrator</code> as a temporary runtime dependency. It
          reads the same metadata shown above, reports every deprecated property you are setting,
          and temporarily binds the renamed ones at runtime so the application still works while
          you fix the config:
        </p>
        <CodeBlock language="xml" title="Add it, run once, read the log, then DELETE it">
{`<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-properties-migrator</artifactId>
    <scope>runtime</scope>
</dependency>`}
        </CodeBlock>
        <p>
          It is explicitly a migration aid, not a compatibility layer — remove it once the
          properties are renamed, or you ship a dependency whose whole job is hiding the problem
          you were trying to find.
        </p>
      </InfoBox>

      <h2>Embedded MongoDB Auto-Configuration Was Removed</h2>

      <p>
        Boot 2 could auto-configure Flapdoodle&apos;s embedded MongoDB for tests from properties
        alone. That support is gone in Boot 3. Both halves are verifiable:
      </p>

      <CodeBlock language="text" title="Real output — the auto-configuration class">
{`$ for v in 2.7.18 3.0.13; do
    printf '  boot %s -> ' $v
    unzip -l spring-boot-autoconfigure-$v.jar | grep -c 'EmbeddedMongoAutoConfiguration.class'
  done

  boot 2.7.18 -> 1
  boot 3.0.13 -> 0`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — and the properties that drove it">
{`  property                          boot 2.7.18   boot 3.0.13
  "spring.mongodb.embedded.version"   PRESENT        absent

Note the contrast with the Redis and Cassandra moves: those left a
deprecated stub in the metadata pointing at the replacement. This one has
no stub at all, because there is no replacement property — the feature
was removed rather than renamed.`}
      </CodeBlock>

      <CodeBlock language="properties" title="Boot 2 — what this looked like">
{`# src/test/resources/application.properties
spring.mongodb.embedded.version=4.0.21
# ...and Boot started a real mongod for the test context.`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3/4 — use Testcontainers instead">
{`@SpringBootTest
@Testcontainers
class OrderRepositoryTest {

    @Container
    @ServiceConnection                    // Boot 3.1+: wires spring.data.mongodb.* for you
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7");

    @Autowired OrderRepository repository;

    @Test
    void findsByReference() {
        repository.save(new Order("ORD-1"));
        assertThat(repository.findByReference("ORD-1")).isPresent();
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="This one is arguably an upgrade">
        <p>
          Embedded Mongo ran a downloaded <code>mongod</code> binary whose version drifted from
          production, and Flapdoodle&apos;s supported versions lagged upstream. Testcontainers runs{' '}
          <em>the actual production image</em>. If a Boot 2 codebase you are migrating uses
          embedded Mongo, the replacement is genuinely better — this is a good place to spend the
          migration effort rather than resent it. If Testcontainers is new to you, the site has a{' '}
          <a href="/testing/testcontainers">Testcontainers lesson</a>.
        </p>
      </InfoBox>

      <h2>Checklist For The Persistence Layer</h2>

      <InfoBox variant="success" title="In order, and most of it before you upgrade anything">
        <ul>
          <li>
            <strong>Find every <code>@GeneratedValue</code></strong> and write down the strategy.
            Anything on <code>AUTO</code>, or on <code>SEQUENCE</code> with no explicit{' '}
            <code>@SequenceGenerator</code>, is exposed to the naming default change.
          </li>
          <li>
            <strong>Grep for <code>org.hibernate.id.</code> strings</strong> in{' '}
            <code>@GenericGenerator</code> annotations. The compiler cannot see these; three of
            those classes no longer exist.
          </li>
          <li>
            <strong>Inventory your real sequences</strong> — names, increments, current values —
            from the actual production database, not from the entity mappings.
          </li>
          <li>
            <strong>Pin the generator names explicitly while still on Boot 2.</strong> This is a
            behavioural no-op on Hibernate 5, so it ships safely on its own, and it removes the
            entire class of problem before the upgrade.
          </li>
          <li>
            <strong>Get off <code>ddl-auto=update</code></strong> anywhere that matters. On this
            migration specifically, it converts a loud startup failure into a silent data
            corruption.
          </li>
          <li>
            <strong>Diff the generated schema across versions</strong> using the
            schema-generation script properties above. This surfaces the ID and dialect
            differences as a text diff before they reach a database.
          </li>
          <li>
            <strong>Try deleting any pinned <code>hibernate.dialect</code></strong> rather than
            translating it. Hibernate 6 detects it, and several pinned dialect classes no longer
            exist.
          </li>
          <li>
            <strong>Run <code>spring-boot-properties-migrator</code> once</strong> and fix every
            property it reports — then remove the dependency.
          </li>
          <li>
            <strong>Replace embedded Mongo with Testcontainers</strong> if you use it.
          </li>
          <li>
            <strong>Test against a restored copy of production data</strong>, not against seed
            data. Every hazard on this page is invisible against an empty database, because an
            empty database has no existing IDs to collide with.
          </li>
        </ul>
      </InfoBox>

      <p>
        The <a href="/springboot2/config">next lesson</a> covers the rest of the properties that
        moved — the ones outside the persistence layer — along with the config-binding changes
        that came with them.
      </p>

      <InteractiveChallenge
        question="Your Boot 2 entity uses @GeneratedValue(strategy = GenerationType.SEQUENCE) with no explicit @SequenceGenerator. Production has a sequence named hibernate_sequence currently at 4.8 million. You upgrade to Boot 3 with spring.jpa.hibernate.ddl-auto=update. What is the most likely outcome?"
        options={[
          "Startup fails because the order_seq sequence does not exist",
          "Hibernate keeps using hibernate_sequence — the default name is stable across versions",
          "Hibernate creates a new per-entity sequence starting at 1, the app starts normally, and inserts later fail with duplicate key violations",
          "Hibernate automatically detects and reuses the existing sequence by inspecting the table"
        ]}
        correctIndex={2}
        explanation={'Hibernate 5\'s SequenceStyleGenerator declared DEF_SEQUENCE_NAME = "hibernate_sequence"; that constant does not exist in Hibernate 6.1, where per-entity naming (DEF_SEQUENCE_SUFFIX = "_SEQ") is the only remaining default. So Hibernate 6 looks for a per-entity sequence, not hibernate_sequence. Option 1 is what you would get with ddl-auto=validate — a loud startup failure, and genuinely the outcome you WANT. But with ddl-auto=update, Hibernate creates the missing sequence instead, starting from 1, against a table that already contains 4.8 million rows. The application starts cleanly and serves traffic, then fails on insert with primary key violations, several layers away from the cause. Option 4 is wishful — Hibernate does not reconcile sequence state against table contents. The fix is to pin the generator name explicitly with @SequenceGenerator(sequenceName = "hibernate_sequence") WHILE STILL ON BOOT 2, where it is a behavioural no-op.'}
      />

      <InteractiveChallenge
        question="After upgrading to Boot 3, your application starts with no errors but cannot reach Redis. Your application.yml still has spring.redis.host and spring.redis.password under it. Why was there no startup error?"
        options={[
          "Redis auto-configuration is lazy, so the error only appears on first use — the property name is fine",
          "spring.redis.* is marked deprecated at level 'error' in Boot 3 metadata, meaning it is no longer bound at all, so Redis fell back to its localhost default",
          "Boot 3 requires spring.data.redis.enabled=true to be set before any Redis property is read",
          "The properties are still bound but the Lettuce client changed its default port"
        ]}
        correctIndex={1}
        explanation="Boot 3's configuration metadata marks spring.redis.host as deprecated with level 'error' and replacement spring.data.redis.host. In Boot's metadata format, level 'error' means the property is no longer bound at all — so from the application's point of view you simply never set a host, and Redis auto-configuration used its default of localhost:6379. Unknown properties are not errors in Spring Boot, so nothing fails at startup. The password is the genuinely alarming part of this: it moved too, so you are now attempting to connect with no credentials. Option 1 has the timing right but the cause wrong. Options 3 and 4 are invented. Catch this whole class of problem by adding spring-boot-properties-migrator as a temporary runtime dependency — it reads this same metadata, reports every deprecated property you are setting, and temporarily binds the renamed ones while you fix them."
      />
    </LessonLayout>
  );
}

export default SpringBoot2Data;
