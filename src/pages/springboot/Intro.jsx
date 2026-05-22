import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringIntro() {
  return (
    <LessonLayout
      title="Spring Boot Overview"
      sectionId="springboot"
      lessonIndex={0}
      prev={null}
      next={{ path: "/springboot/setup", label: "Project Setup" }}
    >
      <p>Spring Boot makes it easy to create stand-alone, production-ready Spring applications. It takes an opinionated view of the Spring platform and adds auto-configuration, embedded servers, and starter dependencies.</p>

      <FlowChart
        title="Spring vs Spring Boot"
        chart={"graph TD\n  A[Spring Framework] --> B[Lots of XML config]\n  A --> C[Manual bean wiring]\n  A --> D[External server needed]\n  E[Spring Boot] --> F[Auto-configuration]\n  E --> G[Starter dependencies]\n  E --> H[Embedded Tomcat/Jetty]\n  E --> I[Production-ready by default]"}
      />

      <h2>Core Concepts</h2>
      <p>Spring Boot is built on three key ideas: auto-configuration, opinionated defaults, and embedded servers. These eliminate most boilerplate from traditional Spring apps.</p>

      <InfoBox variant="info" title="Auto-Configuration">
        <p>Spring Boot examines the classpath and your configuration, then automatically configures beans you likely need. Add spring-data-jpa to the classpath and Spring Boot auto-configures a DataSource, EntityManager, and TransactionManager — without any XML.</p>
      </InfoBox>

      <h2>Spring Ecosystem</h2>
      <CodeBlock language="java" title="Spring Boot Starters">
{`// Each starter pulls in all dependencies for a feature
// spring-boot-starter-web        → MVC, REST, Tomcat
// spring-boot-starter-data-jpa   → JPA, Hibernate, JDBC
// spring-boot-starter-security   → Spring Security
// spring-boot-starter-test       → JUnit 5, Mockito, MockMvc
// spring-boot-starter-validation → Bean Validation (Hibernate Validator)
// spring-boot-starter-actuator   → Health, metrics, management endpoints
// spring-boot-starter-cache      → Caching abstraction

// In pom.xml (Maven)
// <dependency>
//   <groupId>org.springframework.boot</groupId>
//   <artifactId>spring-boot-starter-web</artifactId>
// </dependency>`}
      </CodeBlock>

      <h2>The @SpringBootApplication Annotation</h2>
      <CodeBlock language="java" title="Main Application Class">
{`import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication is shorthand for 3 annotations:
// @Configuration     — this class can define @Bean methods
// @EnableAutoConfiguration — enable Spring Boot auto-config
// @ComponentScan     — scan for @Component, @Service, etc. in this package
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        // Bootstraps the application, starts embedded server
        SpringApplication.run(MyApplication.class, args);
    }
}`}
      </CodeBlock>

      <FlowChart
        title="Spring Boot Startup Flow"
        chart={"graph LR\n  A[main] --> B[SpringApplication.run]\n  B --> C[Create ApplicationContext]\n  C --> D[Auto-configure beans]\n  D --> E[Start embedded Tomcat]\n  E --> F[App Ready on :8080]"}
      />

      <h2>Embedded Server</h2>
      <p>Spring Boot embeds Tomcat (default), Jetty, or Undertow directly in your JAR. You deploy a single fat JAR — no need to install or manage an external application server.</p>

      <CodeBlock language="bash" title="Build and Run">
{`# Build executable JAR
./mvnw clean package

# Run the fat JAR
java -jar target/myapp-0.0.1-SNAPSHOT.jar

# Or use Spring Boot Maven plugin directly
./mvnw spring-boot:run

# With custom port
java -jar myapp.jar --server.port=9090`}
      </CodeBlock>

      <InfoBox variant="tip" title="Spring Initializr">
        <p>Use start.spring.io to generate a Spring Boot project with your chosen dependencies. You can also use it from IntelliJ IDEA (File → New Project → Spring Initializr) or VS Code with the Spring Boot Extension Pack.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does Spring Boot auto-configuration do?"
        options={["It writes your business logic automatically", "It configures beans based on what is on the classpath and your properties", "It auto-generates REST endpoints", "It replaces the need for Spring Framework"]}
        correctIndex={1}
        explanation="Spring Boot auto-configuration inspects the classpath and your application.properties/yml, then automatically creates and configures beans you likely need. For example, finding spring-data-jpa on the classpath triggers automatic DataSource and EntityManager configuration."
      />
    </LessonLayout>
  );
}
