import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function SpringBoot2Cheatsheet() {
  return (
    <LessonLayout
      title="Spring Boot 2 Cheat Sheet"
      sectionId="springboot2"
      lessonIndex={8}
      prev={{ path: '/springboot2/migration', label: 'Migrating 2 → 3 → 4, In Order' }}
      next={null}
    >
      <p>
        Everything in this section, condensed. This is a <em>translation</em> reference: the
        left-hand column is what you will find in a Boot 2 codebase, the right-hand column is what
        it becomes. Every version number here was verified against real jars — see the individual
        lessons for the commands that produced them.
      </p>

      <h2>Which Version Am I On?</h2>
      <CodeBlock language="bash" title="Three ways, in order of reliability">
{`# 1. What the build DECLARES (can lie — a BOM may override it)
grep -A2 spring-boot-starter-parent pom.xml
./gradlew dependencies --configuration runtimeClasspath | head

# 2. What actually RESOLVES (the truth)
mvn dependency:tree -Dincludes=org.springframework.boot:spring-boot
./gradlew dependencyInsight --dependency spring-boot --configuration runtimeClasspath

# 3. Smell tests — no build file needed
grep -rl "javax.persistence"            # javax imports  -> Boot 2
grep -rl "WebSecurityConfigurerAdapter" # removed in Security 6 -> Boot 2
grep -rl "@MockBean"                    # removed in Boot 4    -> Boot 2 or 3
grep -rl "tools.jackson"                # Jackson 3            -> Boot 4`}
      </CodeBlock>

      <h2>Support Status</h2>
      <CodeBlock language="text" title="Why Boot 2 is still in production">
{`Boot 2.7.18   last 2.x release
              OSS support ENDED        2023-06-30
              commercial support to    2029-06-30   <- the reason it persists

Boot 3.x      current LTS line
Boot 4.x      current

You are not "on an unsupported version" if your employer pays for
commercial support. You ARE on one that gets no free security patches.`}
      </CodeBlock>

      <h2>The Namespace Change</h2>
      <CodeBlock language="text" title="javax -> jakarta: the packages that moved">
{`javax.persistence.*   ->  jakarta.persistence.*     entities, JPA
javax.servlet.*       ->  jakarta.servlet.*          filters, servlets
javax.validation.*    ->  jakarta.validation.*       @Valid, @NotNull
javax.annotation.*    ->  jakarta.annotation.*       @PostConstruct, @Resource
javax.transaction.*   ->  jakarta.transaction.*
javax.jms.*           ->  jakarta.jms.*
javax.mail.*          ->  jakarta.mail.*

DO NOT RENAME — these are JDK-owned and stayed put:
javax.crypto.*   javax.net.*     javax.naming.*    javax.management.*
javax.imageio.*  javax.sql.*     javax.security.auth.*

A blind sed across the tree breaks these. Use OpenRewrite, which
knows the difference.`}
      </CodeBlock>

      <InfoBox variant="danger" title="The Failure That Bites Late">
        <p>
          Your own code can compile clean against <code>jakarta</code> while a third-party jar is
          still compiled against <code>javax</code>. Nothing fails at build time. The app starts,
          then dies at class-load with{' '}
          <code>NoClassDefFoundError: javax/servlet/Filter</code>. Every dependency has to have
          released a Jakarta-compatible version — that, not your own imports, is what usually
          decides how long this migration takes.
        </p>
      </InfoBox>

      <h2>Dependency Coordinates That Changed</h2>
      <CodeBlock language="text" title="Not just the import — the artifact itself">
{`javax.servlet:javax.servlet-api   ->  jakarta.servlet:jakarta.servlet-api
mysql:mysql-connector-java        ->  com.mysql:mysql-connector-j
javax.validation:validation-api   ->  jakarta.validation:jakarta.validation-api

The old mysql coordinate has a <relocation> block in its POM — Maven
will warn, then follow it. It still works, so it hides.`}
      </CodeBlock>

      <h2>Security: The Whole Translation</h2>
      <CodeBlock language="text" title="Deprecated in Security 5.7, REMOVED in 6.0 (verified by bytecode)">
{`extends WebSecurityConfigurerAdapter  ->  @Bean SecurityFilterChain
configure(HttpSecurity)               ->  the bean body itself
authorizeRequests()                   ->  authorizeHttpRequests()
antMatchers("/x/**")                  ->  requestMatchers("/x/**")
mvcMatchers(...)                      ->  requestMatchers(...)
.and().x()                            ->  lambda DSL, no chaining
@EnableGlobalMethodSecurity           ->  @EnableMethodSecurity
configure(AuthenticationManagerBuilder)  ->  @Bean AuthenticationManager
WebSecurityConfigurerAdapter#userDetailsService  ->  @Bean UserDetailsService`}
      </CodeBlock>

      <InfoBox variant="tip" title="Do This Rewrite Before You Upgrade">
        <p>
          The lambda DSL arrived in Spring Security <strong>5.7</strong>, which Boot 2.7 already
          ships. So you can convert the whole security config to{' '}
          <code>SecurityFilterChain</code> while still on Boot 2, verify it there, and land the
          Boot 3 upgrade separately. Two risky changes decoupled into two boring ones — the single
          highest-leverage move in this whole migration.
        </p>
      </InfoBox>

      <h2>Testing</h2>
      <CodeBlock language="text" title="@MockBean is gone in Boot 4 — a compile error, not a warning">
{`@MockBean      ->  @MockitoBean       (org.springframework.test.context.bean.override.mockito)
@SpyBean       ->  @MockitoSpyBean

deprecated in Boot 3.4, REMOVED in Boot 4.

Unchanged across all three: @SpringBootTest, @WebMvcTest, @DataJpaTest,
@JsonTest, TestRestTemplate, MockMvc.

JUnit:  Boot 2 -> JUnit 5      Boot 4 -> JUnit 6 baseline
        (5 -> 6 is near-drop-in; only long-deprecated APIs were removed)`}
      </CodeBlock>

      <h2>Properties That Moved</h2>
      <CodeBlock language="text" title="Run spring-boot-properties-migrator to find the rest">
{`spring.redis.*                 ->  spring.data.redis.*
spring.data.cassandra.*        ->  spring.cassandra.*
server.max-http-header-size    ->  server.max-http-request-header-size

# Add this to a Boot 3 run and it reports every renamed property
# you are still using, at startup. Remove it once you are clean.
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-properties-migrator</artifactId>
  <scope>runtime</scope>
</dependency>`}
      </CodeBlock>

      <h2>Actuator</h2>
      <CodeBlock language="text" title="Endpoint and type renames at the 2 -> 3 line">
{`/actuator/httptrace     ->  /actuator/httpexchanges
HttpTraceRepository     ->  HttpExchangeRepository
                            (org.springframework.boot.actuate.web.exchanges)

Also changed in 3.x:
  - only /health is exposed over JMX by default
  - /env and /configprops sanitize far more aggressively
  - trailing-slash matching is OFF by default, so "/actuator/health/"
    no longer resolves`}
      </CodeBlock>

      <h2>Data & JPA</h2>
      <CodeBlock language="text" title="Hibernate 5.6 -> 6.1 is inside the Boot 2 -> 3 jump">
{`The ID generator change is the one that corrupts data if you miss it:

  Hibernate 5.6   SequenceStyleGenerator.DEF_SEQUENCE_NAME = "hibernate_sequence"
                  (one shared sequence for every entity, by default)
  Hibernate 6.1   that constant is GONE — only DEF_SEQUENCE_SUFFIX = "_SEQ"
                  (a per-entity sequence, <table>_SEQ)

  AvailableSettings.USE_NEW_ID_GENERATOR_MAPPINGS existed in 5.6 and is
  absent in 6.1 — you cannot opt back out.

  => @GeneratedValue(strategy = SEQUENCE) without an explicit generator
     silently changes which sequence it reads. Name your generators.

Embedded MongoDB auto-configuration: REMOVED in Boot 3.
  -> Testcontainers, or Flapdoodle wired up yourself.`}
      </CodeBlock>

      <h2>The Migration Order</h2>
      <CodeBlock language="text" title="One major at a time. Never skip.">
{`0. Pre-flight   green test suite, pinned deps, a rollback plan
1. Boot 2.7.18  get to the LAST 2.x patch first
2. Java 17      on Boot 2 still — decouple the JDK jump
3. Security DSL SecurityFilterChain, still on Boot 2 (see above)
4. Boot 3.0     jakarta via OpenRewrite + properties-migrator
5. Boot 3.x     walk up the line, patch by patch
6. Boot 4       Jackson 3 (com.fasterxml -> tools.jackson),
                @MockBean -> @MockitoBean, JUnit 6, module split

Steps 2 and 3 are done ON Boot 2. That is the point: arrive at the
3.0 upgrade with only ONE variable left to change.`}
      </CodeBlock>

      <InfoBox variant="note" title="When Not To Migrate">
        <p>
          A Boot 2 service with commercial support, no new feature work, and a hard dependency on a
          library that never shipped a Jakarta build is a service you should probably leave alone
          and plan to replace, not upgrade. The migration is worth it when you are actively
          developing on the codebase — the cost is roughly proportional to how many third-party
          jars you depend on, not to how much of your own code there is.
        </p>
      </InfoBox>

      <h2>Section Index</h2>
      <CodeBlock language="text" title="All 9 lessons, in reading order">
{`1. Spring Boot 2 in 2026: Where It Stands   support status, version ID
2. The javax World                          the namespace change
3. Security the Boot 2 Way                  WebSecurityConfigurerAdapter
4. Spring Data & JPA on Hibernate 5         ID generators, property moves
5. Configuration & Properties That Moved    renames, properties-migrator
6. Testing in Boot 2                        @MockBean and the slices
7. Actuator & Metrics Before the Rename     httptrace -> httpexchanges
8. Migrating 2 -> 3 -> 4, In Order          the ordered path
9. This cheat sheet

For the far side of the migration see Spring Boot 4:
  /springboot/security-migration   Security 5/6 -> 7 in detail
  /springboot/boot4                what Boot 4 adds over Boot 3`}
      </CodeBlock>
    </LessonLayout>
  );
}
