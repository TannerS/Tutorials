import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Setup() {
  return (
    <LessonLayout
      title="Project Setup & Structure"
      sectionId="springboot"
      lessonIndex={1}
      prev={{ path: '/springboot/intro', label: 'What is Spring Boot?' }}
      next={{ path: '/springboot/di', label: 'Dependency Injection & IoC' }}
    >
      <h2>Setting Up a Spring Boot Project</h2>
      <p>
        The fastest way to bootstrap a Spring Boot project is through Spring Initializr, an
        official web-based tool that generates a project skeleton with your chosen dependencies,
        build tool, and Java version. You can access it at <strong>start.spring.io</strong> or
        directly from most modern IDEs like IntelliJ IDEA and VS Code.
      </p>

      <h3>Using Spring Initializr</h3>
      <p>
        When creating a new project, you will select a build tool (Maven or Gradle), the Spring Boot
        version, your project metadata (group, artifact, package name), and your starter dependencies.
        For a typical web API project, you would select <code>Spring Web</code>, <code>Spring Data JPA</code>,
        and a database driver like <code>H2</code> or <code>PostgreSQL</code>.
      </p>

      <FlowChart
        title="Spring Boot Project Structure"
        chart={"graph TD\nA[my-app/] --> B[src/main/java/]\nA --> C[src/main/resources/]\nA --> D[src/test/java/]\nA --> E[pom.xml or build.gradle]\nB --> F[com.example.myapp/]\nF --> G[MyAppApplication.java]\nF --> H[controller/]\nF --> I[service/]\nF --> J[repository/]\nF --> K[model/]\nC --> L[application.properties]\nC --> M[static/]\nC --> N[templates/]"}
      />

      <h3>Understanding pom.xml</h3>
      <p>
        The <code>pom.xml</code> file is the heart of a Maven-based Spring Boot project. It defines
        your project metadata, the Spring Boot parent POM (which manages dependency versions for you),
        and your starter dependencies.
      </p>

      <CodeBlock language="xml" title="pom.xml">
{`<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- Spring Boot Parent POM manages dependency versions -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>my-app</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>my-app</name>

    <properties>
        <!-- Boot 4 requires 17 as a minimum; target 21+ for virtual threads. -->
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <!-- Web starter: Tomcat + Spring MVC + Jackson -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- JPA starter: Hibernate + Spring Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- H2 in-memory database for development -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Test starter: JUnit 5 + Mockito + Spring Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`}
      </CodeBlock>

      <InfoBox variant="tip" title="Starter Dependencies">
        <p>
          Spring Boot starters are curated sets of dependencies that work together. Instead of
          manually adding individual libraries and worrying about version compatibility, a single
          starter like <code>spring-boot-starter-web</code> pulls in everything you need for web
          development: Spring MVC, embedded Tomcat, Jackson for JSON, and validation support.
          The parent POM ensures all versions are compatible.
        </p>
      </InfoBox>

      <h3>The Gradle Equivalent</h3>
      <p>
        Gradle is the other mainstream choice. It is faster on large builds (incremental
        compilation and a build cache) at the cost of a build script that is code rather than
        declarative XML. Boot provides an official plugin, and the{' '}
        <code>io.spring.dependency-management</code> plugin does the same version-alignment job as
        Maven&apos;s parent POM.
      </p>

      <CodeBlock language="text" title="build.gradle.kts (Kotlin DSL)">
{`plugins {
    java
    id("org.springframework.boot") version "4.0.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        // Gradle downloads this JDK if it isn't installed — builds become
        // reproducible regardless of what the developer has on PATH.
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:postgresql")
}

tasks.withType<Test> { useJUnitPlatform() }`}
      </CodeBlock>

      <InfoBox variant="info" title="Dependency scopes, and why they matter">
        <p>
          <code>implementation</code> (Gradle) / default <code>compile</code> scope (Maven) puts a
          library on both the compile and runtime classpath. <code>runtimeOnly</code> /{' '}
          <code>&lt;scope&gt;runtime&lt;/scope&gt;</code> puts it only on the runtime classpath —
          correct for JDBC drivers, which you never import in code, and it stops anyone accidentally
          coupling application code to a specific driver. <code>testImplementation</code> /{' '}
          <code>&lt;scope&gt;test&lt;/scope&gt;</code> keeps test-only libraries out of the shipped
          artifact entirely.
        </p>
      </InfoBox>

      <h3>Structuring the Package Tree</h3>
      <p>
        The diagram above shows <strong>package-by-layer</strong> — a{' '}
        <code>controller</code>, <code>service</code>, and <code>repository</code> package each
        holding every class of that kind. It is the structure most tutorials use and it is fine for
        a small application, but it scales poorly: a single feature is smeared across four
        packages, every class must be <code>public</code> to be reachable, and nothing stops any
        class from calling any other.
      </p>

      <CodeBlock language="text" title="Two ways to organise the same application">
{`PACKAGE BY LAYER — fine for a demo, awkward past ~20 classes
com.example.shop
├── controller/   OrderController, ProductController, CustomerController
├── service/      OrderService, ProductService, CustomerService
├── repository/   OrderRepository, ProductRepository, CustomerRepository
└── model/        Order, Product, Customer

PACKAGE BY FEATURE — each package is a vertical slice
com.example.shop
├── order/        OrderController, OrderService, OrderRepository, Order
├── product/      ProductController, ProductService, ProductRepository, Product
├── customer/     CustomerController, CustomerService, CustomerRepository, Customer
└── shared/       cross-cutting config, error handling, common types

Why the second wins as the codebase grows:
  - A change to "orders" touches one directory, not four.
  - Only the package's entry point needs to be public. OrderRepository can be
    package-private, so nothing outside com.example.shop.order can reach the
    database directly. The compiler enforces the layering.
  - Deleting a feature means deleting a directory.
  - It maps cleanly onto modules later, if the service is ever split.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Keep the main class at the root of your package tree">
        <p>
          <code>@SpringBootApplication</code> component-scans <em>its own package and everything
          below it</em>. If <code>MyAppApplication</code> lives in{' '}
          <code>com.example.myapp</code>, then <code>com.example.myapp.order</code> is scanned but{' '}
          <code>com.example.other</code> is not — and the symptom is a confusing{' '}
          <code>NoSuchBeanDefinitionException</code> for a class that is visibly annotated{' '}
          <code>@Service</code>. Putting the main class at the root is the convention precisely
          because it makes scanning cover everything without extra configuration.
        </p>
      </InfoBox>

      <h3>The Main Application Class</h3>
      <p>
        Every Spring Boot project has a main application class annotated with
        <code>@SpringBootApplication</code>. This class serves as the entry point and
        triggers the auto-configuration and component scanning processes.
      </p>

      <CodeBlock language="java" title="MyAppApplication.java">
{`package com.example.myapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyAppApplication {

    public static void main(String[] args) {
        // This single line:
        // 1. Creates the Spring ApplicationContext
        // 2. Triggers auto-configuration
        // 3. Performs component scanning
        // 4. Starts the embedded web server
        SpringApplication.run(MyAppApplication.class, args);
    }
}`}
      </CodeBlock>

      <h3>Running Your Application</h3>
      <p>
        You can run your Spring Boot application in several ways: through your IDE, using Maven
        or Gradle from the command line, or by building a fat JAR and running it directly.
      </p>

      <CodeBlock language="text" title="Running the Application (Terminal)">
{`# Using Maven wrapper (recommended)
./mvnw spring-boot:run

# Using Gradle wrapper
./gradlew bootRun

# Building and running the fat JAR
./mvnw clean package
java -jar target/my-app-0.0.1-SNAPSHOT.jar

# With a specific profile
java -jar target/my-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev`}
      </CodeBlock>

      <h3>Building a Container Image</h3>
      <p>
        Boot can build an OCI image without a Dockerfile, using Cloud Native Buildpacks. The
        resulting image is layered so that dependencies (which rarely change) sit in a different
        layer from your application classes (which change every build) — so a redeploy pushes a few
        hundred kilobytes rather than the whole fat JAR.
      </p>

      <CodeBlock language="text" title="Buildpacks, and the hand-written equivalent">
{`# No Dockerfile required — Boot builds a layered image directly.
./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=myorg/my-app:1.0
./gradlew bootBuildImage --imageName=myorg/my-app:1.0

# The equivalent multi-stage Dockerfile, if you need full control.
# The key idea is layer extraction — it splits the fat JAR into layers
# ordered by how often they change, so Docker can cache the stable ones.
# (Boot 3.3+ spells this '-Djarmode=tools ... extract'. On Boot 3.2 and
#  earlier it was '-Djarmode=layertools ... extract'.)

FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY . .
RUN ./mvnw -DskipTests clean package
RUN java -Djarmode=tools -jar target/*.jar extract --layers --destination extracted

FROM eclipse-temurin:21-jre
WORKDIR /app
# Order matters: least-frequently-changed layer first, so a code-only change
# invalidates just the last COPY.
COPY --from=builder /app/extracted/dependencies/ ./
COPY --from=builder /app/extracted/spring-boot-loader/ ./
COPY --from=builder /app/extracted/snapshot-dependencies/ ./
COPY --from=builder /app/extracted/application/ ./
# Never run as root.
RUN useradd -r -u 1001 appuser
USER appuser
# NOT "java -jar app.jar" — the layers are exploded on disk, there is no fat
# JAR any more. Launch the exploded form through the Boot loader instead.
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]`}
      </CodeBlock>

      <InfoBox variant="tip" title="Let the JVM see the container's limits">
        <p>
          Modern JVMs are container-aware and size the heap from the cgroup memory limit rather
          than the host&apos;s total RAM — but the default ceiling is only 25% of that limit, which
          wastes most of a small container. Set{' '}
          <code>-XX:MaxRAMPercentage=75</code> so the heap actually uses the memory you paid for,
          and leave the rest for metaspace, thread stacks, and native buffers. Avoid hardcoding{' '}
          <code>-Xmx</code>: it silently ignores the container limit and is the usual cause of a
          pod being OOM-killed by the platform while the JVM believes it has room to spare.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What does the spring-boot-starter-parent POM provide?"
        options={[
          "The actual application code for your project",
          "Dependency version management and sensible default configurations",
          "A pre-built database schema",
          "Automatic deployment to cloud platforms"
        ]}
        correctIndex={1}
        explanation="The spring-boot-starter-parent POM provides dependency version management (so you don't need to specify versions for common libraries), sensible plugin defaults, and resource filtering. It ensures all Spring-related dependencies use compatible versions."
      />
    </LessonLayout>
  );
}
