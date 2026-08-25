import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Intro() {
  return (
    <LessonLayout
      title="Spring Boot 2 in 2026: Where It Stands"
      sectionId="springboot2"
      lessonIndex={0}
      prev={null}
      next={{ path: '/springboot2/javax', label: 'The javax World — Namespace, JPA, Servlets' }}
    >
      <p>
        The main <a href="/springboot/intro">Spring Boot</a> section teaches Boot 4 — the
        framework as it exists today. This section is for the other thing that happens in a
        career: you join a team, open the repository, and the <code>pom.xml</code> says{' '}
        <code>2.7.18</code>.
      </p>

      <p>
        This is <strong>not</strong> a second Spring Boot curriculum. Almost nothing conceptual
        changed between Boot 2 and Boot 4 — dependency injection is dependency injection, a bean
        is still a bean, <code>@RestController</code> still means what it meant. Re-teaching that
        would waste your time and mine. What this section covers is the delta: the specific
        things that are <em>spelled differently</em> in a Boot 2 codebase, why they changed, and
        what it takes to get off them.
      </p>

      <InfoBox variant="info" title="Who this section is for">
        <p>
          Someone who already knows Boot 4 and now has to read, debug, and safely change a Boot 2
          service. If you are learning Spring for the first time, do the{' '}
          <a href="/springboot/intro">Spring Boot section</a> first — starting here would teach
          you a dialect nobody is writing new code in.
        </p>
      </InfoBox>

      <h2>Where Boot 2 Actually Stands</h2>

      <p>
        &quot;Is Spring Boot 2 still supported?&quot; has an annoying answer: <em>no, and also
        yes, and the difference is a purchase order.</em> Rather than assert dates from memory,
        here is the machine-readable source that backs the support table on spring.io. You can
        re-run this in a terminal right now.
      </p>

      <CodeBlock language="bash" title="Ask the Spring project API directly">
{`curl -s https://api.spring.io/projects/spring-boot/generations \\
  | jq -r '._embedded.generations[]
           | [.name, .initialReleaseDate, .ossSupportEndDate, .commercialSupportEndDate]
           | @tsv' \\
  | column -t

# Works for any Spring project — swap the path segment:
#   .../projects/spring-framework/generations
#   .../projects/spring-security/generations`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output, trimmed to the interesting rows (run 2026-08-24)">
{`BRANCH  RELEASED    OSS_ENDS    COMMERCIAL_ENDS
2.7.x   2022-05-31  2023-06-30  2029-06-30
3.0.x   2022-11-30  2023-12-31  2024-12-31
3.5.x   2025-05-31  2026-06-30  2032-06-30
4.0.x   2025-11-30  2026-12-31  2027-12-31
4.1.x   2026-06-30  2027-07-31  2028-07-31`}
      </CodeBlock>

      <p>Three things fall out of that table, and all three matter to you.</p>

      <InfoBox variant="danger" title="1. Open-source support for 2.7.x ended on 2023-06-30">
        <p>
          There are no more free patch releases on the 2.x line. The last one published to Maven
          Central is <code>2.7.18</code>:
        </p>
        <CodeBlock language="bash" title="Confirming the last public 2.x release">
{`$ curl -sI https://repo1.maven.org/maven2/org/springframework/boot/\\
spring-boot/2.7.18/spring-boot-2.7.18.jar | grep -i last-modified
last-modified: Thu, 23 Nov 2023 08:05:27 GMT`}
        </CodeBlock>
        <p>
          Read that date as a hard line. Any CVE in Spring Boot 2 disclosed after it is not
          getting a free fix — not &quot;probably not&quot;, not &quot;eventually&quot;. If your
          organisation has no commercial subscription, an unpatched Boot 2 service is a security
          finding waiting to be written up, and &quot;it still works&quot; is not a response to
          it.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="2. Commercial support for 2.7.x runs to 2029-06-30">
        <p>
          This is the single most important line in the table for understanding why you keep
          meeting Boot 2 in the wild. Broadcom/VMware sells extended support for the 2.7 line for
          roughly <strong>six years past</strong> the open-source cutoff — far longer than any
          other 2.x branch got (2.6.x, by comparison, ended commercially on 2024-02-29).
        </p>
        <p>
          So a Boot 2.7 service inside a large enterprise may be genuinely, contractually
          patched. That is a real engineering position, not negligence. A Boot 2.7 service in a
          startup with no subscription is a different situation wearing the same version number.
          Before you write the migration proposal, <strong>find out which one you are in</strong>{' '}
          — it changes the urgency by years.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="3. 2.7 is the only 2.x branch worth being on">
        <p>
          Every other 2.x branch is out of commercial support too. If you are on 2.3 or 2.5, you
          are not &quot;on Boot 2&quot; in a supportable sense — you are on an abandoned point in
          history, and your first move is to get to the top of the 2.7 line before anything else.
          That step is cheap: within a major version, Spring Boot takes backwards compatibility
          seriously.
        </p>
      </InfoBox>

      <h2>Why You Still Meet It</h2>

      <p>
        It is tempting to read a legacy version as a story about a lazy team. Usually it is not.
        The recurring reasons, roughly in order of how often they are the real one:
      </p>

      <ul>
        <li>
          <strong>The Java version is the actual blocker.</strong> Boot 3+ requires Java 17. Boot
          2 runs on Java 8. A shop still on Java 8 or 11 cannot upgrade Spring without first
          upgrading the JDK, which is a separate project with its own risk, its own vendor
          licensing questions, and its own set of libraries that break. Spring is downstream of
          that decision.
        </li>
        <li>
          <strong>A dependency never made the jakarta jump.</strong> An internal framework, a
          vendor SDK, a SOAP client generated in 2016, a licensed PDF or reporting library whose
          vendor wants a new contract for the Jakarta EE build. One of these can pin an entire
          service. See the <a href="/springboot2/javax">javax lesson</a> — this is the hard case.
        </li>
        <li>
          <strong>It is genuinely finished software.</strong> A service that has not needed a
          feature in four years, has no roadmap, and is scheduled for decommission. Migrating it
          is spending risk on something you plan to delete.
        </li>
        <li>
          <strong>An acquisition.</strong> You bought a company and inherited their estate. Nobody
          chose this.
        </li>
        <li>
          <strong>Nobody was ever given the time.</strong> This one does exist. It is just less
          common than engineers assume from the outside.
        </li>
      </ul>

      <InfoBox variant="tip" title="What this means for how you talk about it">
        <p>
          When you are the new person, &quot;why are we still on Boot 2?&quot; lands badly and
          teaches you nothing. &quot;What is blocking the upgrade?&quot; gets you the actual
          dependency graph, and often gets you the migration ticket too.
        </p>
      </InfoBox>

      <h2>The Three-Jump Reality</h2>

      <p>
        Here is the thing people get wrong when they scope this work. Going from Boot 2 to
        current is not one upgrade. It is <strong>three</strong>, and they are not the same size.
      </p>

      <FlowChart
        title="Boot 2 to current — three jumps, not one"
        chart={"graph LR\nA[\"Boot 2.7 / Framework 5.3 / Security 5.8\"] -->|\"BIG: javax to jakarta + Java 17 + Hibernate 6\"| B[\"Boot 3.0 / Framework 6.0 / Security 6.0\"]\nB -->|\"Small: patch-level deprecations\"| C[\"Boot 3.5 / Framework 6.2 / Security 6.5\"]\nC -->|\"Medium: DSL removals, API reshuffles\"| D[\"Boot 4.x / Framework 7.x / Security 7.x\"]\nstyle A fill:#3a1f1f,stroke:#f87171\nstyle B fill:#3a2f1a,stroke:#fbbf24\nstyle C fill:#1a2744,stroke:#5b9cf6\nstyle D fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        The version numbers move as a locked set. You do not pick them independently — Spring
        Boot&apos;s dependency management chooses the Framework and Security versions for you:
      </p>

      <CodeBlock language="text" title="The version chain (verified from the spring-boot-dependencies POMs)">
{`Spring Boot 2.7.18  ->  Framework 5.3.x  ->  Security 5.8.x  ->  Hibernate 5.6.15   javax.*
Spring Boot 3.0.x   ->  Framework 6.0.x  ->  Security 6.0.x  ->  Hibernate 6.1.7    jakarta.*
Spring Boot 4.1.x   ->  Framework 7.x    ->  Security 7.x    ->  Hibernate 7.4.5    jakarta.*

Checked with:
  curl -s https://repo1.maven.org/maven2/org/springframework/boot/\\
       spring-boot-dependencies/2.7.18/spring-boot-dependencies-2.7.18.pom \\
    | grep -oE '<hibernate.version>[^<]+'
  ->  <hibernate.version>5.6.15.Final

  ...same for 3.0.13  ->  <hibernate.version>6.1.7.Final
  ...same for 4.1.1   ->  <hibernate.version>7.4.5.Final`}
      </CodeBlock>

      <h3>Why the first jump is the expensive one</h3>

      <p>
        Boot 2 &rarr; 3 bundles four independent breaking changes into one release, and each of
        them can independently stall you:
      </p>

      <CodeBlock language="text" title="What Boot 3.0 changed all at once">
{`1. javax.*  ->  jakarta.*        Every servlet, JPA, validation and annotation
                                 import in your codebase. A COMPILE break, not a
                                 deprecation. Third-party jars must be re-released
                                 by their vendors. -> the javax lesson

2. Java 8/11  ->  Java 17        Minimum, not a suggestion. Boot 3 classes are
                                 compiled to bytecode 61.

3. Hibernate 5  ->  Hibernate 6  ID generator mappings tightened; several legacy
                                 generator classes deleted outright; HQL parser
                                 rewritten. -> the data lesson

4. Security 5  ->  Security 6    WebSecurityConfigurerAdapter REMOVED, not
                                 deprecated-but-present. -> the security lesson`}
      </CodeBlock>

      <InfoBox variant="warning" title="Jumps two and three are real, just smaller">
        <p>
          People who have done the 2&rarr;3 jump sometimes assume the rest is free. It is not.
          Security 7 removes the <code>.and()</code> chaining style and both{' '}
          <code>AntPathRequestMatcher</code> and <code>MvcRequestMatcher</code>, and Boot 4
          reshuffles a lot of API surface (<code>RestTemplate</code> &rarr;{' '}
          <code>RestClient</code>, <code>@MockBean</code> &rarr; <code>@MockitoBean</code>,
          Jackson moving to <code>tools.jackson</code>). That is the{' '}
          <a href="/springboot/security-migration">Spring Security 7 &amp; Boot 4 Changes</a>{' '}
          lesson&apos;s territory, and it is a genuine second project.
        </p>
      </InfoBox>

      <h3>The tooling agrees with this framing</h3>

      <p>
        You do not have to take my word for the ordering. OpenRewrite ships the standard
        automated migration recipes, and its Boot 3.0 recipe <em>begins by running the Boot 2.7
        recipe</em>. Here is the real recipe definition, pulled straight out of the published jar:
      </p>

      <CodeBlock language="bash" title="Reading the recipe yourself">
{`curl -sO https://repo1.maven.org/maven2/org/openrewrite/recipe/\\
rewrite-spring/6.37.1/rewrite-spring-6.37.1.jar
unzip -p rewrite-spring-6.37.1.jar META-INF/rewrite/spring-boot-30.yml`}
      </CodeBlock>

      <CodeBlock language="yaml" title="Real excerpt from META-INF/rewrite/spring-boot-30.yml">
{`name: org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0
displayName: Migrate to Spring Boot 3.0
preconditions:
  - org.openrewrite.Singleton
recipeList:
  - org.openrewrite.java.spring.boot2.UpgradeSpringBoot_2_7   # <- get to 2.7 FIRST
  - org.openrewrite.java.spring.boot3.RemoveEnableBatchProcessing
  - org.openrewrite.java.migrate.UpgradeToJava17               # <- then the JDK
  - org.openrewrite.java.dependencies.UpgradeDependencyVersion:
      groupId: org.springframework.boot
      artifactId: "*"
      newVersion: 3.0.x
      overrideManagedVersion: false
      retainVersions:
        - org.thymeleaf:thymeleaf-spring5
        - org.thymeleaf.extras:thymeleaf-extras-springsecurity5
  - org.openrewrite.java.dependencies.UpgradeDependencyVersion:
      groupId: org.springframework
      artifactId: "*"
      newVersion: 6.0.x`}
      </CodeBlock>

      <InfoBox variant="note" title="Read that recipe list as a scoping document">
        <p>
          The first entry is <code>UpgradeSpringBoot_2_7</code> and the third is{' '}
          <code>UpgradeToJava17</code>. The official automated tool <strong>refuses to skip
          steps</strong>: it gets you to the top of the 2.x line, then moves the JDK, and only
          then touches Boot 3 coordinates. When you write the migration ticket, that is your
          phase list — and each phase is independently shippable, which is the property you want
          when something goes wrong.
        </p>
      </InfoBox>

      <h2>Version Identification: What Am I Actually On?</h2>

      <p>
        Before anything else, establish the truth. This sounds trivial and is not — the number in{' '}
        <code>pom.xml</code> is what someone <em>declared</em>, and the number on the classpath is
        what you are <em>running</em>. A parent POM, a BOM import, a dependency-management block
        in a corporate parent, or a Gradle plugin can all move it out from under you.
      </p>

      <h3>Step 1 — the declaration</h3>

      <CodeBlock language="xml" title="Maven: where the version hides">
{`<!-- Case A: the common one. Version is on the parent. -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.18</version>          <!-- <- this is your Boot version -->
</parent>

<!-- Case B: a corporate parent. The Boot version is NOT visible here at all;
     it is imported as a BOM, possibly several POMs up the inheritance chain. -->
<parent>
    <groupId>com.megacorp.platform</groupId>
    <artifactId>megacorp-service-parent</artifactId>
    <version>14.2.0</version>
</parent>

<!-- Case C: BOM import instead of parent inheritance. -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>2.7.18</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>`}
      </CodeBlock>

      <CodeBlock language="groovy" title="Gradle: same idea, different spelling">
{`plugins {
    id 'org.springframework.boot' version '2.7.18'      // <- usually here
    id 'io.spring.dependency-management' version '1.0.15.RELEASE'
}

// ...but it can also be set indirectly:
ext['spring-boot.version'] = '2.7.18'

// or come from a platform:
dependencies {
    implementation platform('org.springframework.boot:spring-boot-dependencies:2.7.18')
}`}
      </CodeBlock>

      <h3>Step 2 — the resolved truth (this is the one that counts)</h3>

      <CodeBlock language="bash" title="Ask the build tool what it actually resolved">
{`# Maven — the effective, post-inheritance, post-BOM answer:
./mvnw dependency:tree | grep -E 'spring-boot|spring-core|spring-security-core|hibernate-core'

# ...or skip straight to the fully-merged POM:
./mvnw help:effective-pom | grep -A2 spring-boot-dependencies

# Gradle:
./gradlew dependencies --configuration runtimeClasspath \\
  | grep -E 'spring-boot|spring-core|spring-security-core|hibernate-core'

# Nothing builds? You still have the jar names:
ls ~/.m2/repository/org/springframework/boot/spring-boot/
unzip -l target/myapp.jar | grep -E 'spring-boot-[0-9]|spring-core-[0-9]'`}
      </CodeBlock>

      <h3>Step 3 — the two-second smell tests</h3>

      <p>
        Once you have a jar in hand, two commands tell you which world you are in without reading
        a single line of application code. Both of these are real output, run against jars pulled
        from Maven Central.
      </p>

      <CodeBlock language="bash" title="Test A: what bytecode level is this framework built for?">
{`# Bytes 6-7 of any .class file are the major version.
#   52 = Java 8      61 = Java 17
for v in 2.7.18 3.0.13 4.1.1; do
  unzip -p spring-boot-autoconfigure-$v.jar \\
    org/springframework/boot/autoconfigure/SpringBootApplication.class > /tmp/c.class
  printf 'boot %-8s major=' $v
  python3 -c "print(int.from_bytes(open('/tmp/c.class','rb').read()[6:8],'big'))"
done

# Real output:
boot 2.7.18   major=52
boot 3.0.13   major=61
boot 4.1.1    major=61`}
      </CodeBlock>

      <CodeBlock language="bash" title="Test B: which servlet namespace is compiled in?">
{`# Look inside a Spring class that touches HttpServletRequest.
for v in 5.3.39 6.2.11; do
  printf 'spring-web %-8s ' $v
  unzip -p spring-web-$v.jar \\
    org/springframework/web/filter/OncePerRequestFilter.class \\
    | strings | grep -oE '(javax|jakarta)/servlet/http/HttpServletRequest' | sort -u
done

# Real output:
spring-web 5.3.39   javax/servlet/http/HttpServletRequest
spring-web 6.2.11   jakarta/servlet/http/HttpServletRequest`}
      </CodeBlock>

      <InfoBox variant="tip" title="At runtime, without a build">
        <p>
          The startup banner prints the Boot version, and the log line right under it prints the
          JVM: <code>Starting MyApplication using Java 11.0.21 on ...</code>. If Actuator is
          enabled and the build plugin generated <code>build-info.properties</code>,{' '}
          <code>GET /actuator/info</code> returns the build and version. These are documented
          behaviours rather than something reproduced on this page — standing up a Boot 2
          application was outside what I could verify here, and I would rather tell you that than
          paste a console block I made up.
        </p>
      </InfoBox>

      <h2>Migrate, or Leave It Alone?</h2>

      <p>
        The honest answer is that both are defensible and the decision is not primarily technical.
        Here is the shape of it.
      </p>

      <FlowChart
        title="Deciding what to do with a Boot 2 service"
        chart={"graph TD\nA[\"Boot 2 service\"] --> B{\"Commercial support subscription?\"}\nB -->|No| C[\"Unpatched since 2023-11. Security exposure is REAL.\"]\nB -->|Yes| D{\"Scheduled for decommission < 12 months?\"}\nC --> E{\"Internet-facing or handling PII?\"}\nE -->|Yes| F[\"Migrate. This is the urgent case.\"]\nD -->|Yes| G[\"Leave it. Do not spend risk on something you will delete.\"]\nD -->|No| H{\"Still under active feature development?\"}\nE -->|No| H\nH -->|Yes| I[\"Migrate. Every new feature is being written twice.\"]\nH -->|No| J[\"Budget it deliberately. Not urgent, not never.\"]\nstyle F fill:#3a1f1f,stroke:#f87171\nstyle I fill:#3a2f1a,stroke:#fbbf24\nstyle G fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="danger" title="Migrate now if any of these are true">
        <ul>
          <li>
            <strong>No commercial subscription and the service is exposed.</strong> Internet-facing,
            or handling personal or payment data. You are running software with no security
            patches since November 2023.
          </li>
          <li>
            <strong>You cannot hire for it.</strong> When new joiners have only ever used Boot 3+,
            every task on this service costs extra and the knowledge is concentrated in one or two
            people.
          </li>
          <li>
            <strong>It blocks something else.</strong> A shared library, a platform migration, a
            new observability standard, a Java version bump the rest of the estate already did.
          </li>
          <li>
            <strong>It is under active development.</strong> Every feature written against a dead
            API is work you will pay for twice.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="success" title="Leave it alone if all of these are true">
        <ul>
          <li>
            <strong>It is finished.</strong> No roadmap, no feature requests, changes measured in
            hours per year.
          </li>
          <li>
            <strong>It is contained.</strong> Internal network only, no untrusted input, no
            sensitive data — the blast radius of an unpatched CVE is small and known.
          </li>
          <li>
            <strong>It has an end date.</strong> A real decommission ticket with a real quarter on
            it, not an aspiration.
          </li>
          <li>
            <strong>It is either covered or accepted.</strong> Either the subscription is paid, or
            somebody with the authority to accept that risk has written down that they accept it.
          </li>
        </ul>
        <p>
          &quot;Leave it alone&quot; is a legitimate engineering decision. &quot;Nobody has looked
          at it&quot; is not the same decision, even though it produces the same commits.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="The one thing that is never right">
        <p>
          Half-migrating. A codebase where some modules are on Boot 3 and some are on Boot 2,
          sharing an internal library that has to compile against both namespaces, is worse than
          either endpoint — you now maintain two dialects and a compatibility shim. If you start,
          finish. If you cannot finish, do not start.
        </p>
      </InfoBox>

      <h2>What The Rest of This Section Covers</h2>

      <FlowChart
        title="Section map"
        chart={"graph TD\nA[\"You inherited a Boot 2 codebase\"] --> B[\"javax: the namespace, JPA, servlets\"]\nA --> C[\"Security the Boot 2 way\"]\nA --> D[\"Spring Data on Hibernate 5\"]\nB --> E[\"Config and properties that moved\"]\nC --> E\nD --> E\nE --> F[\"Testing: @MockBean and friends\"]\nF --> G[\"Actuator before the rename\"]\nG --> H[\"Migrating 2 to 3 to 4, in order\"]\nstyle A fill:#1a2744,stroke:#5b9cf6\nstyle H fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        Next is the one that touches every file you own: the{' '}
        <a href="/springboot2/javax">javax to jakarta rename</a>. It is the most mechanical change
        in the whole migration and also the one most likely to stop it dead, which is an unusual
        combination worth understanding properly.
      </p>

      <InteractiveChallenge
        question="You inherit a Spring Boot 2.7.18 service. It is internal-only, has had four commits in two years, is scheduled for decommission next quarter, and your company pays for Broadcom commercial support. What is the right call?"
        options={[
          "Migrate to Boot 4 immediately — 2.7 is out of OSS support and that is unacceptable",
          "Leave it alone; the decommission date and the subscription together make migration a waste of risk",
          "Migrate to Boot 3 only, as a compromise",
          "Half-migrate the modules that are easy and leave the rest"
        ]}
        correctIndex={1}
        explanation="Every factor points the same way. Commercial support for the 2.7 line runs to 2029-06-30, so the service IS being patched — the 2023-06-30 OSS cutoff does not apply to you. It is internal-only, so the blast radius is small. It is not under development, so there is no compounding cost. And it has a real end date next quarter, so migration effort would be spent on something about to be deleted. Option 1 mistakes a general rule for this specific situation. Option 3 spends most of the cost (javax to jakarta, Java 17, Hibernate 6) for a service that will not exist long enough to benefit. Option 4 is the one genuinely wrong answer in every scenario: a codebase split across two namespaces with a shim between them is worse than either endpoint."
      />

      <InteractiveChallenge
        question="Your pom.xml inherits from a corporate parent POM with no visible Spring Boot version. What is the most reliable way to find out which Boot version you are actually running?"
        options={[
          "Search the corporate parent POM in its own repository and read the version from there",
          "Check the Spring Boot version in your IDE's project settings panel",
          "Run ./mvnw dependency:tree and read the resolved spring-boot artifact version",
          "Look at which Java version the project targets and infer it — Java 17 means Boot 3+"
        ]}
        correctIndex={2}
        explanation="dependency:tree reports what Maven ACTUALLY resolved after inheritance, BOM imports, dependency management and any version overrides have all been applied. Option 1 is the right instinct but incomplete — the corporate parent may itself inherit from something else, or a dependencyManagement block in your own POM may override it, so you can read the wrong number confidently. Option 2 shows you the IDE's model of the project, which is usually right and is exactly the kind of 'usually' that costs you an afternoon. Option 4 is backwards: Java 17 is REQUIRED by Boot 3+, but Boot 2 runs perfectly well on Java 17 too, so a Java 17 target tells you nothing about the Boot version. Only the resolved classpath is authoritative."
      />
    </LessonLayout>
  );
}

export default SpringBoot2Intro;
