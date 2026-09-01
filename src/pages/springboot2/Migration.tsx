import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Migration() {
  return (
    <LessonLayout
      title="Migrating 2 → 3 → 4, In Order"
      sectionId="springboot2"
      lessonIndex={7}
      prev={{ path: '/springboot2/actuator', label: 'Actuator & Metrics Before the Rename' }}
      next={{ path: '/springboot2/cheatsheet', label: '📋 Spring Boot 2 Cheat Sheet' }}
    >
      <p>
        There is one rule, and everything else in this lesson is a consequence of it:
      </p>

      <InfoBox variant="danger" title="One major version at a time. 2 → 3, then 3 → 4. Never 2 → 4.">
        <p>
          This is not caution or preference — it is how Spring&apos;s deprecation policy works.
          Something removed in Boot 4 was <em>deprecated in Boot 3</em>, which means Boot 3 is the
          version that will tell you about it, in a build that still compiles and a test suite that
          still runs. Skip it and every one of those warnings becomes a compile error you meet for
          the first time simultaneously, with no working test suite to tell you whether your fixes
          are right.
        </p>
        <p>
          The migration guides are written the same way — there is a 2.7&nbsp;→&nbsp;3.0 guide and
          a 3.x&nbsp;→&nbsp;4.0 guide. There is no 2.x&nbsp;→&nbsp;4 guide, because nobody supports
          that path.
        </p>
      </InfoBox>

      <FlowChart
        title="The ordered path — each box is a separate, independently shippable change"
        chart={"graph TD\nA[Boot 2.x, wherever you are] --> B[Latest 2.7 patch: 2.7.18]\nB --> C[Java 17]\nC --> D[Boot 3.0 — the big one]\nD --> D1[jakarta namespace]\nD --> D2[Property renames]\nD --> D3[Spring Security 6]\nD --> D4[Hibernate 6]\nD --> D5[Sleuth to Micrometer Tracing]\nD1 --> E[Walk up the 3.x line to 3.5]\nD2 --> E\nD3 --> E\nD4 --> E\nD5 --> E\nE --> F[Fix every deprecation warning ON 3.5]\nF --> G[Boot 4.x]\nG --> G1[Jackson 3 to tools.jackson]\nG --> G2[\"@MockBean to @MockitoBean\"]\nG --> G3[Module restructuring]\nG --> G4[JUnit 6 and Security 7]"}
      />

      <h2>Pre-Flight: Before You Change a Single Version Number</h2>
      <p>
        A migration fails on the things you did not measure, not the things you did. Every item
        here is work you can do this week, on Boot 2, with nothing at risk.
      </p>

      <InfoBox variant="warning" title="The pre-flight checklist">
        <ul>
          <li>
            <strong>Do you have tests that would notice?</strong> This is the real gate. A
            migration is a large behavioural change validated by your test suite; if coverage of
            the critical paths is thin, <em>write those tests first</em>, on Boot 2, where they
            currently pass. Tests written after a migration only prove the new behaviour is
            self-consistent.
          </li>
          <li>
            <strong>Can you build and run it at all?</strong> Sounds insulting. It is the most
            common blocker on genuinely old services: a dead internal Nexus, a snapshot dependency
            nobody can rebuild, a plugin that needs a JDK you cannot install. Prove a clean
            checkout builds on a clean machine before planning anything.
          </li>
          <li>
            <strong>Inventory your third-party dependencies.</strong> Run{' '}
            <code>mvn dependency:tree</code> and, for anything Spring-adjacent, find out whether a
            Boot 3-compatible version exists <em>at all</em>. This is where migrations actually
            die — not on Spring&apos;s changes, but on a library that was abandoned in 2021.
            Do this first; it can change the decision entirely.
          </li>
          <li>
            <strong>Find the jakarta blast radius.</strong>{' '}
            <code>grep -rn &quot;javax\.&quot; src/ | wc -l</code> gives you a number. It is
            usually smaller than feared, because most of it is imports OpenRewrite will rewrite.
          </li>
          <li>
            <strong>Find your Spring Security configuration.</strong> Grep for{' '}
            <code>WebSecurityConfigurerAdapter</code>. Its removal is the single most-hit manual
            code change in the 2&nbsp;→&nbsp;3 leg.
          </li>
          <li>
            <strong>Do you use Spring Cloud?</strong> Spring Cloud release trains are pinned to
            Boot versions, and <strong>Spring Cloud Sleuth was not ported to Boot 3</strong>.
            Check the compatibility matrix before committing to a date.
          </li>
          <li>
            <strong>Is anything generating code?</strong> MapStruct, Lombok, QueryDSL, jOOQ,
            OpenAPI generators, and any annotation processor need versions that understand your new
            JDK. An out-of-date Lombok on a new JDK fails in ways that look like compiler bugs.
          </li>
          <li>
            <strong>Turn on deprecation warnings now.</strong>{' '}
            <code>-Xlint:deprecation</code>. Everything it prints today is work you were going to
            do anyway, and doing it on Boot 2 makes the next step smaller.
          </li>
          <li>
            <strong>Write down how you will roll back.</strong> If the answer is &quot;revert the
            deploy&quot;, check whether the migration includes database schema changes (Hibernate 6
            can generate different DDL) — because those do not revert with the deploy.
          </li>
        </ul>
      </InfoBox>

      <h2>Step 1 — Get to the Latest 2.7 Patch First</h2>
      <p>
        The final open-source release of the 2.x line is <strong>Spring Boot 2.7.18</strong>{' '}
        (confirmed against Maven Central: 2.7.18 is the highest 2.7.x artifact published). Land
        there before anything else.
      </p>
      <CodeBlock language="xml" title="Step 1 is a one-line change">
{`<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.18</version>
</parent>`}
      </CodeBlock>
      <InfoBox variant="tip" title="Why this is worth its own deploy">
        <ul>
          <li>
            It is the version the official 2.7&nbsp;→&nbsp;3.0 migration guide assumes. Starting
            anywhere else means the guide&apos;s instructions do not quite match what you see.
          </li>
          <li>
            2.7 carries the <strong>deprecation warnings for things removed in 3.0</strong>. That
            is the entire value: it is a preview of the next step, delivered by your compiler.
          </li>
          <li>
            Config-file processing was rewritten in <strong>2.4</strong>. If you are coming from
            2.0&ndash;2.3, that behaviour change (profile activation, config import, document
            ordering) is a real migration on its own — do not let it happen inside the 3.0 jump
            where you cannot tell which change broke what.
          </li>
          <li>
            <code>WebSecurityConfigurerAdapter</code> was deprecated in Spring Security{' '}
            <strong>5.7</strong>, which ships with Boot 2.7. So you can do the entire security
            rewrite here, on a version where both styles still work.
          </li>
        </ul>
      </InfoBox>

      <h2>Step 2 — Get to Java 17</h2>
      <p>
        Boot 3 requires Java 17 as a hard baseline. Do this <em>while still on Boot 2.7</em>, as a
        separate deploy: Boot 2.7 runs on Java 17 perfectly well, so you can isolate every
        JDK-related problem from every Spring-related one.
      </p>
      <CodeBlock language="xml" title="Java 17 on Boot 2.7 — a standalone change">
{`<properties>
    <java.version>17</java.version>
</properties>`}
      </CodeBlock>
      <InfoBox variant="warning" title="What actually breaks on the JDK jump">
        <p>
          Rarely your code. Usually the ecosystem around it: <strong>Lombok</strong> (older
          versions cannot see the new compiler internals), <strong>Mockito/ByteBuddy</strong>{' '}
          (bytecode-level mocking must know the new class-file version),{' '}
          <strong>the strong encapsulation of JDK internals</strong> (anything reflecting into{' '}
          <code>sun.misc</code> or <code>java.lang</code> internals now needs{' '}
          <code>--add-opens</code>, or a newer version of whatever it is), and{' '}
          <strong>build plugins</strong> generally.
        </p>
        <p>
          Also watch for JVM flags in your <code>Dockerfile</code> or start script that were
          removed between Java 8 and 17 — a removed GC flag is a JVM that will not start at all.
        </p>
      </InfoBox>

      <h2>Step 3 — Boot 2.7 → 3.0: The Big One</h2>
      <p>
        Everything before this was preparation. This is the step with real work in it, and it
        breaks down into five independent workstreams.
      </p>

      <h3>3a. The jakarta namespace — let a tool do it</h3>
      <p>
        Jakarta EE 9 renamed every <code>javax.*</code> package to <code>jakarta.*</code>. It is a
        huge number of lines and almost zero thinking, which is exactly what automated refactoring
        is for. <strong>OpenRewrite</strong> is the standard tool.
      </p>
      <CodeBlock language="bash" title="Run it without committing to anything — dryRun first">
{`# dryRun writes a patch file and changes nothing.
./mvnw -U org.openrewrite.maven:rewrite-maven-plugin:dryRun \\
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \\
  -Drewrite.activeRecipes=org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0

# Read target/rewrite/rewrite.patch, then apply for real:
./mvnw -U org.openrewrite.maven:rewrite-maven-plugin:run \\
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \\
  -Drewrite.activeRecipes=org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0

# Gradle equivalent: apply the org.openrewrite.rewrite plugin and set
# activeRecipe(...) in a rewrite { } block.`}
      </CodeBlock>
      <CodeBlock language="text" title="Real dryRun output — Spring Boot 2.7.18 sample project">
{`[INFO] Using active recipe(s) [org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0]
[INFO] Validating active recipes...
[INFO] Project [boot2] Parsing source files
[INFO] Running recipe(s)...
[WARNING] These recipes would make changes to pom.xml:
[WARNING]     org.openrewrite.maven.UpgradeParentVersion: {groupId=org.springframework.boot,
                artifactId=spring-boot-starter-parent, newVersion=3.0.x}
[WARNING] Patch file available:
[WARNING]     .../target/rewrite/rewrite.patch
[WARNING] Estimate time saved: 5m
[WARNING] Run 'mvn rewrite:run' to apply the recipes.
[INFO] BUILD SUCCESS`}
      </CodeBlock>
      <CodeBlock language="text" title="...and the patch it wrote">
{`diff --git a/pom.xml b/pom.xml
--- a/pom.xml
+++ b/pom.xml
@@ -6,7 +6,7 @@ org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0
   <parent>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-parent</artifactId>
-    <version>2.7.18</version>
+    <version>3.0.13</version>
     <relativePath/>
   </parent>`}
      </CodeBlock>
      <InfoBox variant="note" title="What this run does and does not demonstrate">
        <p>
          This is genuine output, but be clear about the sample: the project it ran against was a
          small Boot 2.7.18 web/actuator app with <strong>no <code>javax</code> imports</strong>,
          so the only change available to the recipe was the parent version. On a real codebase
          this section of the log is where you would see the namespace rewrites and Spring-specific
          recipes listed. The namespace-rewriting behaviour described below is documented, not
          reproduced here.
        </p>
        <p>
          Two details worth taking from it anyway: <code>dryRun</code>{' '}
          <strong>changes nothing</strong> and leaves a reviewable{' '}
          <code>target/rewrite/rewrite.patch</code>, and the recipe resolved{' '}
          <code>3.0.x</code> to the concrete latest 3.0 patch (3.0.13) by itself — so it lands you
          on the 3.0 line, which is exactly where you want to run the properties-migrator.
        </p>
      </InfoBox>
      <CodeBlock language="text" title="Useful recipe names">
{`org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0
org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_1
    ... one per minor; run them IN ORDER, same as the versions themselves.
org.openrewrite.java.migrate.jakarta.JavaxMigrationToJakarta
    Just the namespace change, nothing else. Useful when you want the
    jakarta move as its own reviewable commit.
org.openrewrite.java.migrate.UpgradeToJava17
    JDK-level modernisation (text blocks, records where applicable, etc.)`}
      </CodeBlock>
      <InfoBox variant="tip" title="Commit the tool's output on its own, and read the diff">
        <p>
          OpenRewrite does more than the namespace: it will bump your parent version, rewrite
          property keys it knows about, and apply assorted Spring-specific recipes. That is useful
          but it means the diff deserves review — <strong>a single commit containing only the
          OpenRewrite output</strong>, reviewed separately from your hand-written changes, is worth
          the discipline. When something misbehaves three weeks later, you want to be able to tell
          which changes were yours.
        </p>
        <p>
          What it will <em>not</em> do reliably: rewrite <code>javax</code> strings in
          non-Java files (persistence.xml, logback config, generated sources), or resolve a
          third-party dependency that has no jakarta-compatible release. Both need you.
        </p>
      </InfoBox>
      <InfoBox variant="note" title="The one javax package that does NOT move">
        <p>
          <code>javax.sql.DataSource</code>, <code>javax.crypto</code>,{' '}
          <code>javax.naming</code> and friends are part of the <strong>JDK</strong>, not Jakarta
          EE. They keep the <code>javax</code> prefix forever. A blind find-and-replace of{' '}
          <code>javax.</code> → <code>jakarta.</code> will break these — another reason to use the
          recipe rather than <code>sed</code>.
        </p>
      </InfoBox>

      <h3>3b. Property renames — run the migrator</h3>
      <p>
        Covered in full in the <strong>Configuration &amp; Properties That Moved</strong> lesson.
        The short version: add <code>spring-boot-properties-migrator</code> at runtime scope, start
        the app once per profile, fix the <code>ERROR</code> block before the <code>WARN</code>{' '}
        block, then remove the dependency.
      </p>
      <InfoBox variant="danger" title="Do this on Boot 3.0, not on 3.5">
        <p>
          Verified: given{' '}
          <code>management.metrics.export.prometheus.enabled</code>, Boot{' '}
          <strong>3.0.13</strong> reports the rename; Boot <strong>3.5.16</strong> reports nothing
          at all, because the deprecation metadata has since been pruned. The migrator only knows
          about renames that are still recent, so it must be run on the{' '}
          <em>first</em> 3.x you land on. This is a concrete, mechanical reason the
          &quot;3.0 then walk up&quot; ordering beats jumping straight to the newest 3.x.
        </p>
      </InfoBox>

      <h3>3c. Spring Security — the biggest manual code change</h3>
      <p>
        <code>WebSecurityConfigurerAdapter</code> was deprecated in Security 5.7 (Boot 2.7) and{' '}
        <strong>removed in Security 6</strong> (Boot 3.0). Every security configuration class
        extending it must be rewritten as <code>SecurityFilterChain</code> beans.
      </p>
      <CodeBlock language="java" title="The shape of the change">
{`// BEFORE — Boot 2. Does not compile on Boot 3.
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
                .antMatchers("/public/**").permitAll()
                .anyRequest().authenticated()
            .and().formLogin();
    }
}

// AFTER — a bean, not a subclass.
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(a -> a
                .requestMatchers("/public/**").permitAll()
                .anyRequest().authenticated())
            .formLogin(Customizer.withDefaults())
            .build();
    }
}`}
      </CodeBlock>
      <InfoBox variant="tip" title="This lesson deliberately stops here — the detail lives elsewhere">
        <p>
          The full treatment is in{' '}
          <strong>Spring Boot &rarr; Spring Security 7 &amp; Boot 4 Changes</strong> at{' '}
          <code>/springboot/security-migration</code>: all three generations of configuration
          syntax, the complete rename list (<code>authorizeRequests</code> →{' '}
          <code>authorizeHttpRequests</code>, <code>antMatchers</code> →{' '}
          <code>requestMatchers</code>, deleting <code>.and()</code>),{' '}
          <code>PathPatternRequestMatcher</code> and the CVE behind it, method security, and
          password-hash migration. Do not re-derive it here — that page is the reference.
        </p>
        <p>
          The scheduling point that <em>is</em> this lesson&apos;s business:{' '}
          <strong>do the security rewrite while you are still on Boot 2.7</strong>, where both the
          adapter and the <code>SecurityFilterChain</code> style work. Then it is a reviewed,
          tested, separately-deployed change rather than one more broken thing during the 3.0 bump.
        </p>
      </InfoBox>

      <h3>3d. Hibernate 5 → 6</h3>
      <p>
        Boot 3 brings Hibernate 6, and this is the workstream most likely to change{' '}
        <em>runtime behaviour</em> rather than compilation. Covered in the{' '}
        <strong>Spring Data &amp; JPA on Hibernate 5</strong> lesson; the migration-relevant
        summary:
      </p>
      <CodeBlock language="text" title="What to watch for">
{`ID GENERATION
  hibernate.id.new_generator_mappings behaviour becomes the only behaviour.
  GenerationType.AUTO on a numeric id can resolve to a DIFFERENT strategy
  (sequence rather than identity/table), which changes the generated DDL.
  => Compare generated schema BEFORE and AFTER. This is the item that can
     corrupt data rather than merely fail.

QUERY VALIDATION
  Hibernate 6 parses HQL more strictly. Queries that "worked" via lenient
  parsing now fail at STARTUP — which is the good outcome, but it is a
  startup failure you meet all at once.

TYPE MAPPINGS
  Several basic type mappings changed, notably around enums, LOBs, and
  java.time. Check any column where you relied on the default mapping.

REMOVED
  @Type(type = "...") string-based type declarations.
  Legacy Criteria API (already deprecated for years).`}
      </CodeBlock>

      <h3>3e. Spring Cloud Sleuth → Micrometer Tracing</h3>
      <p>
        Only relevant if you do distributed tracing — but if you do, this is a dependency swap
        plus a configuration rewrite, not a rename. Sleuth was not ported to Boot 3 and is
        end-of-life. Details and the property mapping are in the{' '}
        <strong>Actuator &amp; Metrics Before the Rename</strong> lesson.
      </p>

      <h2>Step 4 — Walk Up the 3.x Line</h2>
      <p>
        3.0 → 3.1 → 3.2 → … → 3.5, one minor at a time. These are small and mostly boring, which
        is the point: you are collecting deprecation warnings, and the last 3.x is where the Boot 4
        preparation happens.
      </p>
      <InfoBox variant="success" title="On the last 3.x, before you touch Boot 4">
        <ul>
          <li>
            Build with <code>-Xlint:deprecation</code> and fix <strong>everything</strong> it
            prints. On 3.4+ that list includes every <code>@MockBean</code> and{' '}
            <code>@SpyBean</code> in your test suite.
          </li>
          <li>
            Convert <code>@MockBean</code> → <code>@MockitoBean</code> and{' '}
            <code>@SpyBean</code> → <code>@MockitoSpyBean</code> <strong>here</strong>, where both
            spellings compile. Remember the annotation moved from a Spring Boot package to a
            Spring Framework one — see the Testing lesson.
          </li>
          <li>Remove any lingering JUnit 4 tests and the vintage engine.</li>
          <li>
            Delete the <code>spring-boot-properties-migrator</code> dependency if it is still
            there.
          </li>
        </ul>
      </InfoBox>

      <h2>Step 5 — 3.x → 4.x</h2>
      <p>
        A genuinely smaller step than 2&nbsp;→&nbsp;3, with one item that touches a lot of files.
      </p>
      <CodeBlock language="text" title="The 3 → 4 workstreams, ranked by actual cost">
{`1. JACKSON 3 — the package rename. Highest line count.
     com.fasterxml.jackson.*  ->  tools.jackson.*
     ObjectMapper is now IMMUTABLE; build it via JsonMapper.builder().
     => Mostly find-and-replace, EXCEPT any code that mutates a shared
        ObjectMapper after construction. That code has to be restructured,
        and it is the part a tool cannot do for you.
     => NOTE: com.fasterxml.jackson.annotation.* annotations are a separate
        artifact with its own lifecycle — check each import rather than
        assuming every com.fasterxml line moves.

2. @MockBean / @SpyBean REMOVED — a compile error, not a warning.
     Already done in step 4 if you followed the order. If not, your test
     sources will not compile at all. See the Testing lesson for the real
     compiler output.

3. MODULE RESTRUCTURING — spring-boot-autoconfigure was split per
     technology (spring-boot-webmvc, spring-boot-data-jpa, ...), and the
     spring.factories auto-configuration mechanism was removed.
     => Invisible if you use starters. Significant if you MAINTAIN a
        custom starter or auto-configuration.

4. JUNIT 6 is the Boot 4 baseline (verified: junit-jupiter 6.0.3 on Boot
     4.1.1 vs 5.8.2 on Boot 2.7.18). Everyday APIs unchanged; watch for
     anything pinning junit-platform on the 1.x line.

5. SPRING SECURITY 7 — .and() chaining and authorizeRequests are gone,
     AntPathRequestMatcher / MvcRequestMatcher removed.
     => Fully covered at /springboot/security-migration.

6. NULL-SAFETY moves to JSpecify; packages are @NullMarked. Opt-in in
     practice — it changes what your static analysis reports, not what
     compiles.`}
      </CodeBlock>
      <InfoBox variant="tip" title="The Boot 4 lesson is the reference for the destination">
        <p>
          <code>/springboot/boot4</code> covers what Boot 4 <em>is</em> — API versioning,{' '}
          <code>@Retryable</code> in core, <code>@ImportHttpServices</code>,{' '}
          <code>BeanRegistrar</code>, the module split. This page is about getting there; that page
          is about what you get. Read it before you plan the 3&nbsp;→&nbsp;4 leg, because several
          of its features let you delete dependencies (spring-retry, hand-rolled HTTP client
          factories) as part of the upgrade rather than after it.
        </p>
      </InfoBox>

      <h2>When NOT to Migrate</h2>
      <p>
        Everything above assumes migrating is the right call. Often it is. Sometimes it is not,
        and a good engineer is expected to be able to say so with reasons.
      </p>

      <InfoBox variant="note" title="Reasons to stay on Boot 2 — legitimately, for now">
        <ul>
          <li>
            <strong>The service is being decommissioned.</strong> If it is switched off in nine
            months, migrating it is work with a guaranteed zero return. Isolate it at the network
            level and let it die on schedule.
          </li>
          <li>
            <strong>A hard dependency has no jakarta-compatible version.</strong> An abandoned
            library, a vendor SDK, an internal framework nobody owns. The migration is then a{' '}
            <em>replace-that-dependency</em> project wearing a migration costume — size it
            honestly, and do not start the version bump until that question is answered.
          </li>
          <li>
            <strong>You cannot roll back.</strong> If Hibernate 6&apos;s DDL differences mean the
            schema changes, and there is no rehearsed restore, the risk is not in the code.
          </li>
          <li>
            <strong>There is no test suite and no time to write one.</strong> Migrating an
            untested service is a rewrite you are not calling a rewrite. Write the tests first;
            that is the actual first step, and it is valuable regardless of what you decide next.
          </li>
          <li>
            <strong>Right now is a freeze.</strong> Peak season, an audit, a launch. A framework
            major version is not an emergency fix, and it should not be deployed into a window
            where nobody can respond to it.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="danger" title="But be honest about what staying costs">
        <p>
          Spring Boot <strong>2.7.18</strong> was the final open-source release of the 2.x line —
          published in November 2023 as a last courtesy patch — but OSS support for 2.7 had
          already ended on <strong>2023-06-30</strong>. Commercial extended support is available
          from Broadcom/VMware Tanzu on a paid basis — but if nobody at your
          company has actually bought it, then in practice{' '}
          <strong>your framework receives no security patches at all</strong>. Not
          &quot;delayed&quot; patches. None.
        </p>
        <p>
          &quot;We will do it later&quot; also gets more expensive with time, not less: the
          properties-migrator metadata is pruned as releases pass, the community answers move on,
          third-party libraries drop their last Boot 2-compatible branches, and the number of
          people who remember how the application works declines. If the answer is genuinely
          &quot;not now&quot;, put a date on it and write down what has to be true by then.
        </p>
      </InfoBox>

      <h2>Sequencing It as Real Work</h2>
      <CodeBlock language="text" title="Each line is a separate PR that can ship on its own">
{` 1. Write/expand tests on the critical paths                   (Boot 2.x)
 2. Inventory third-party deps for jakarta compatibility       (no code)
 3. Bump to 2.7.18                                             -> deploy
 4. Move to Java 17                                            -> deploy
 5. Rewrite Spring Security as SecurityFilterChain beans       -> deploy
 6. Move bootstrap.yml to spring.config.import                 -> deploy
 7. Fix all deprecation warnings visible on 2.7                -> deploy
    ------------------------------------------------------------
 8. OpenRewrite UpgradeSpringBoot_3_0, reviewed as its own commit
 9. properties-migrator on 3.0, fix ERROR then WARN
10. Hibernate 6: diff the generated schema, fix HQL
11. Sleuth -> Micrometer Tracing, if applicable
12. Boot 3.0 green                                             -> deploy
    ------------------------------------------------------------
13. 3.1, 3.2, 3.3, 3.4, 3.5 one at a time                      -> deploy each
14. @MockBean -> @MockitoBean; clear every deprecation on 3.5  -> deploy
    ------------------------------------------------------------
15. Jackson 3 package rename; fix mutated ObjectMappers
16. Boot 4                                                     -> deploy

Steps 1-7 carry almost no risk and make everything after them smaller.
If you get interrupted after step 7, you have still left the codebase
meaningfully better than you found it — which is what makes this ordering
survivable in a real team, where migrations get paused.`}
      </CodeBlock>

      <InteractiveChallenge
        question="Your team has a Boot 2.7 service and a two-week window. Someone proposes going straight to Boot 4 to 'avoid doing the work twice'. What is the strongest technical argument against it?"
        options={[
          "Boot 4 cannot read Boot 2 configuration files, so the app would not start",
          "Deprecation is the mechanism that tells you what to fix: things removed in 4 were deprecated in 3, and things removed in 3 were deprecated in 2.7. Skipping means every warning arrives as a simultaneous compile error, with no working test suite to validate the fixes",
          "Maven cannot resolve a parent POM more than one major version ahead of the current one",
          "It is only a licensing problem — Boot 4 requires a commercial agreement for migrations from 2.x"
        ]}
        correctIndex={1}
        explanation="Spring's deprecate-then-remove policy is the migration documentation. WebSecurityConfigurerAdapter is deprecated on 2.7 and removed on 3.0; @MockBean is deprecated on 3.4 and removed on 4.0. If you sit on each major version long enough to build with -Xlint:deprecation and clear the warnings, the next major upgrade is largely a version bump. Skip a major and you never see the warnings — you meet the removals as compile errors instead, all at once, and critically your test suite does not compile either, so you are making large changes with no way to check them. There is also no official 2.x-to-4 migration guide, because that path is not supported. Note that 'doing the work twice' is mostly a misconception: the work is the same set of edits either way, the difference is whether you do them incrementally with a green build or all at once with a red one. Options 1 and 3 are fabrications — nothing mechanically prevents the version bump, which is precisely why this mistake is easy to make."
      />

      <InteractiveChallenge
        question="You have completed the 2.7 → 3.0 jump. The app compiles, all tests pass, it starts cleanly, and the properties-migrator (run on 3.0) reports nothing. What is the item most likely to still bite you in production, and why did none of the above catch it?"
        options={[
          "The jakarta namespace change — some javax imports may not have been rewritten",
          "Hibernate 6 ID generation and type mapping changes, which alter generated DDL and runtime type handling rather than anything that compiles or fails a test against a fresh schema",
          "The @MockBean deprecation, which will begin failing at runtime once the app is under load",
          "Spring Security, because SecurityFilterChain beans are not registered until the first request arrives"
        ]}
        correctIndex={1}
        explanation="Compilation catches the jakarta namespace completely — a missed javax import for a Jakarta EE type is a 'cannot find symbol', so option 1 cannot survive a successful build. @MockBean is test-scope only and, on Boot 3, merely deprecated, so it has no runtime effect whatsoever. Hibernate 6 is different in kind: GenerationType.AUTO can resolve to a different generation strategy than it did under Hibernate 5, and several basic type mappings changed. Against a fresh test schema created by ddl-auto, everything is self-consistent and every test passes — the new code and the new schema agree with each other. The mismatch only appears against your EXISTING production data, where the old schema was created under the old rules. This is why 'diff the generated DDL before and after' belongs in the plan as an explicit step, and why this is the one migration item where the rollback question is about the database rather than the deployment. The general lesson: your test suite validates behaviour against a schema it just built, so it structurally cannot see a schema-compatibility problem."
      />

      <InfoBox variant="success" title="The short version">
        <ol>
          <li>Tests first, on Boot 2, or you are flying blind.</li>
          <li>Inventory dependencies before promising a date.</li>
          <li>2.7.18, then Java 17, then Security rewrite — all still on Boot 2.</li>
          <li>OpenRewrite for jakarta; review its diff as its own commit.</li>
          <li>properties-migrator on 3.0, not on 3.5.</li>
          <li>Diff the Hibernate-generated schema.</li>
          <li>Walk the 3.x line; clear every deprecation on the last one.</li>
          <li>Then, and only then, Boot 4.</li>
        </ol>
      </InfoBox>
    </LessonLayout>
  );
}

export default SpringBoot2Migration;
