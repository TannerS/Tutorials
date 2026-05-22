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

      <CodeBlock language="java" title="pom.xml">
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
        <version>3.2.0</version>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>my-app</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>my-app</name>

    <properties>
        <java.version>17</java.version>
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

      <CodeBlock language="java" title="Running the Application (Terminal)">
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
