import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function BuildTools() {
  return (
    <LessonLayout
      title="Build Tools: Maven & Gradle"
      sectionId="java"
      lessonIndex={13}
      prev={{ path: '/java/reflection', label: 'Reflection & Annotations' }}
      next={{ path: '/java/testing-basics', label: 'Unit Testing Fundamentals — Dummies, Stubs, Spies, Mocks' }}
    >
      <p>
        A build tool does three jobs that used to be scripted by hand, badly: it resolves your{' '}
        <strong>dependencies</strong> (including the dependencies of your dependencies —{' '}
        <em>transitive</em> deps — recursively, picking one version when two libraries disagree),
        it runs a repeatable <strong>build lifecycle</strong> (compile, test, package, verify,
        install, deploy — the same phases, in the same order, on every machine), and it lets{' '}
        <strong>plugins</strong> hook into that lifecycle to do real work — compiling, running
        tests, building a JAR, generating code. In the Java world there are two tools that matter:
        Maven, which describes the build declaratively in XML, and Gradle, which describes it as
        code in a Groovy or Kotlin DSL. Neither is going away; knowing when a team reaches for
        which is as important as knowing the syntax of either.
      </p>

      <InfoBox variant="info" title="Verified on This Machine">
        <p>
          The version banners in this lesson are real output, captured by running{' '}
          <code>mvn --version</code> and <code>gradle --version</code> locally — not fabricated.
          Everything else — POM syntax, scope semantics, the Gradle DSL — is checked against{' '}
          <code>maven.apache.org/docs</code> and <code>docs.gradle.org</code> and labeled
          &quot;verified against docs, not executed&quot; where it wasn&apos;t run directly, matching
          the pattern used in the IaC lesson.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="mvn --version / gradle --version — Real Output From This Machine">
{`$ mvn --version
Apache Maven 3.9.16 (2bdd9fddda4b155ebf8000e807eb73fd829a51d5)
Java version: 25.0.2, vendor: Homebrew
OS name: "mac os x", arch: "aarch64"

$ gradle --version
------------------------------------------------------------
Gradle 9.5.0
------------------------------------------------------------
Kotlin:        2.3.20
Groovy:        4.0.29
Launcher JVM:  25.0.2 (Homebrew 25.0.2)`}
      </CodeBlock>

      <h2>Dependency Resolution, in One Picture</h2>

      <p>
        Declare <code>spring-boot-starter-web</code> and you get one line in your build file — but
        the tool pulls down Spring MVC, Jackson, an embedded Tomcat, and everything each of{' '}
        <em>those</em> needs, transitively, then resolves version conflicts when two branches of
        that tree want different versions of the same library (Maven takes the &quot;nearest
        wins&quot; version by dependency-tree depth; Gradle takes the highest version by default).
        This is the single biggest reason build tools exist — nobody wants to hand-manage a
        transitive dependency graph that can run to hundreds of JARs.
      </p>

      <FlowChart
        title="One Declared Dependency, One Resolved Version"
        chart={"graph TD\nA[spring-boot-starter-web] --> B[Spring MVC]\nA --> C[Jackson]\nA --> D[Embedded Tomcat]\nB --> E[transitively pulls spring-web]\nC --> F[transitively pulls jackson-databind]\nE --> G{Another branch also wants jackson-databind, different version}\nF --> G\nG -->|Maven| H[Nearest wins: shallowest depth in the tree, ties by declaration order]\nG -->|Gradle| I[Highest version wins by default: 2.18.0 beats 2.17.0]"}
      />

      <h2>Maven: Declarative XML</h2>

      <p>
        A Maven project is described entirely in <code>pom.xml</code> — the &quot;Project Object
        Model.&quot; The lifecycle is fixed and ordered: <code>validate → compile → test →
        package → verify → install → deploy</code>. Running <code>mvn package</code> runs every
        phase up to and including <code>package</code>, in order — that ordering is not
        configurable per-project, which is exactly why a Maven build reads the same way in every
        repo you open.
      </p>

      <CodeBlock language="xml" title="Minimal pom.xml — verified against docs, not executed">
{`<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.example</groupId>
  <artifactId>my-service</artifactId>
  <version>1.0.0</version>
  <packaging>jar</packaging>

  <properties>
    <maven.compiler.release>21</maven.compiler.release>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`}
      </CodeBlock>

      <h3>The Four Scopes That Matter</h3>

      <p>
        <code>&lt;scope&gt;</code> controls two independent things at once: which classpath a
        dependency appears on (compile-time vs. test vs. runtime), and whether it gets bundled
        into the final artifact. Get these four right and the rest of Maven's scope list
        (<code>system</code>, <code>import</code>) is easy to pick up later.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Scope</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Compile classpath</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Runtime classpath</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Packaged in artifact</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>compile</code> (default)</td>
            <td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}><code>spring-boot-starter-web</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>test</code></td>
            <td style={{ padding: '0.75rem' }}>Test only</td>
            <td style={{ padding: '0.75rem' }}>Test only</td>
            <td style={{ padding: '0.75rem' }}>No</td>
            <td style={{ padding: '0.75rem' }}><code>junit-jupiter</code>, <code>mockito-core</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>provided</code></td>
            <td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}>No</td>
            <td style={{ padding: '0.75rem' }}>No</td>
            <td style={{ padding: '0.75rem' }}><code>jakarta.servlet-api</code> (the container supplies it)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>runtime</code></td>
            <td style={{ padding: '0.75rem' }}>No</td>
            <td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}><code>postgresql</code> JDBC driver</td>
          </tr>
        </tbody>
      </table>

      <p>
        <code>provided</code> and <code>runtime</code> are mirror images of each other:{' '}
        <code>provided</code> is needed to compile against but must not ship (a servlet API the
        app server already has on its classpath — shipping it too can cause classloader
        conflicts); <code>runtime</code> is the opposite, needed only once the code is actually
        executing (you call JDBC through an interface at compile time, but the concrete driver
        class only has to be present when the connection is opened).
      </p>

      <h3>Standard Directory Layout</h3>

      <p>
        Maven's &quot;convention over configuration&quot; philosophy means a default project needs
        almost no build-file plumbing to describe where source lives — the tool already assumes
        this layout:
      </p>

      <CodeBlock language="text" title="Maven Standard Directory Layout">
{`src/
  main/
    java/        # application source
    resources/   # non-code files copied onto the classpath (application.yml, etc.)
  test/
    java/        # test source
    resources/   # test-only classpath resources
target/          # build output — compiled classes, the packaged JAR/WAR, reports`}
      </CodeBlock>

      <h3>BOMs: Aligning Versions With &lt;dependencyManagement&gt;</h3>

      <p>
        A <strong>Bill of Materials (BOM)</strong> is a POM whose only job is to declare compatible
        versions for a family of libraries. Importing one into{' '}
        <code>&lt;dependencyManagement&gt;</code> means every dependency you later declare from
        that family — without a version number of your own — gets the version the BOM chose,
        guaranteed to be mutually compatible. This is exactly how a Spring Boot project keeps
        dozens of Spring modules in lockstep: the Spring Boot parent (or its BOM) has already
        solved the compatibility matrix, so you never hand-pick a Jackson or Spring Data version
        that happens to clash with the rest.
      </p>

      <CodeBlock language="xml" title="Importing a BOM — verified against docs, not executed">
{`<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-dependencies</artifactId>
      <version>4.1.1</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <!-- No <version> needed — the BOM already decided it -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
</dependencies>`}
      </CodeBlock>

      <h2>Gradle: Build Files as Code</h2>

      <p>
        A Gradle build is described in <code>build.gradle</code> (Groovy DSL) or{' '}
        <code>build.gradle.kts</code> (Kotlin DSL, now the more common default for new projects —
        it gets IDE autocomplete and type checking that the Groovy DSL can't). Unlike Maven's
        fixed phase list, Gradle builds a directed graph of <strong>tasks</strong>, and plugins
        contribute the tasks — the <code>java</code> plugin adds <code>compileJava</code>,{' '}
        <code>test</code>, <code>jar</code>; Spring Boot's plugin adds{' '}
        <code>bootJar</code> and <code>bootRun</code>.
      </p>

      <CodeBlock language="kotlin" title="Minimal build.gradle.kts — verified against docs, not executed">
{`plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}

group = "com.example"
version = "1.0.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.junit.jupiter:junit-jupiter")
}

tasks.test {
    useJUnitPlatform()
}`}
      </CodeBlock>

      <h3>implementation vs. api — the Fact to Actually Remember</h3>

      <p>
        This is the single most important Gradle-specific idea in this lesson, and it has no
        equivalent in Maven's scope model. Both configurations come from the{' '}
        <code>java-library</code> plugin (apply that instead of the plain <code>java</code> plugin
        to get <code>api</code> at all) and both put a dependency on your module's own compile and
        runtime classpaths — the difference is entirely about what happens to{' '}
        <strong>consumers</strong> of your module:
      </p>

      <InfoBox variant="warning" title="api Leaks Through. implementation Does Not.">
        <p>
          Declare a dependency with <code>api(...)</code> and it becomes part of your module's{' '}
          <em>public</em> API — any project that depends on your module gets that dependency on{' '}
          <em>its own</em> compile classpath too, transitively, whether it wants it or not.
        </p>
        <p>
          Declare it with <code>implementation(...)</code> and it's an internal detail — it's on
          your classpath, your code can use it, but a consumer of your module cannot see or
          compile against it at all, even indirectly.
        </p>
      </InfoBox>

      <CodeBlock language="kotlin" title="Why the Distinction Matters — verified against docs, not executed">
{`// In library-a's build.gradle.kts:
dependencies {
    api("com.fasterxml.jackson.core:jackson-databind:2.18.0")       // leaks to consumers
    implementation("org.apache.commons:commons-lang3:3.17.0")       // stays internal
}

// In app's build.gradle.kts (app depends on library-a):
dependencies {
    implementation(project(":library-a"))
}

// app's code CAN reference com.fasterxml.jackson.databind.ObjectMapper directly —
// it arrived transitively via library-a's "api" dependency.
//
// app's code CANNOT reference org.apache.commons.lang3.StringUtils —
// library-a hid it behind "implementation", so it never reached app's classpath.`}
      </CodeBlock>

      <p>
        The payoff isn't just encapsulation, it's build speed. If <code>library-a</code> bumps its{' '}
        <code>implementation</code> dependency to a new version, Gradle knows that change is
        invisible to consumers and only recompiles <code>library-a</code> itself. Bump an{' '}
        <code>api</code> dependency and every downstream module that might touch it has to
        recompile too, because it's genuinely part of their compile classpath now. Defaulting to{' '}
        <code>implementation</code> and reaching for <code>api</code> only when a type from that
        dependency actually appears in your module's public method signatures keeps compile-avoidance
        working across the whole project.
      </p>

      <h3>Incremental Builds and the Build Cache</h3>

      <p>
        Gradle's headline advantage over Maven isn't the DSL, it's speed on repeated builds. Every
        task declares its inputs and outputs; if neither changed since the last run, Gradle marks
        the task <code>UP-TO-DATE</code> and skips it entirely. The <strong>build cache</strong>{' '}
        takes this further — it keys task outputs by a hash of their inputs, so if a{' '}
        <em>teammate</em> already compiled the exact same source with the exact same
        configuration, you can pull their compiled output from a shared cache instead of
        recompiling it yourself, locally or in CI. Maven has no first-party equivalent to either
        mechanism, which is the main reason large multi-module builds tend to reach for Gradle.
      </p>

      <h2>Which One Do Teams Actually Pick?</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Situation</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Typical pick</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>New Spring Boot project via start.spring.io</td>
            <td style={{ padding: '0.75rem' }}><strong>Maven</strong> (the default selection)</td>
            <td style={{ padding: '0.75rem' }}>Spring Initializr defaults to Maven; XML's rigidity is a feature for teams that want every build to look the same</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Android app</td>
            <td style={{ padding: '0.75rem' }}><strong>Gradle</strong> — exclusively</td>
            <td style={{ padding: '0.75rem' }}>Android Studio and the Android toolchain are built on Gradle; there is no supported Maven path</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Large multi-module monorepo</td>
            <td style={{ padding: '0.75rem' }}><strong>Gradle</strong></td>
            <td style={{ padding: '0.75rem' }}>Incremental builds and the build cache pay off most when there's a lot to avoid rebuilding</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Team wants a single obvious way to do everything</td>
            <td style={{ padding: '0.75rem' }}><strong>Maven</strong></td>
            <td style={{ padding: '0.75rem' }}>Declarative XML resists clever custom logic — that's often exactly the point</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Build needs real custom logic (codegen, complex packaging)</td>
            <td style={{ padding: '0.75rem' }}><strong>Gradle</strong></td>
            <td style={{ padding: '0.75rem' }}>It's a real DSL on the JVM — arbitrary Kotlin/Groovy code runs inside the build itself</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="tip" title="You Don't Have to Choose Once, Forever">
        <p>
          Both tools read the same Maven Central repository and produce the same JARs — switching
          later is a real project, but it&apos;s not a rewrite of your code, only of the build
          description. Plenty of teams start on the Spring Initializr&apos;s default Maven setup
          and migrate to Gradle only once a monorepo's build times make the case for it.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
