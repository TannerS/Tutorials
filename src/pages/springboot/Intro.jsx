import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="What is Spring Boot?"
      sectionId="springboot"
      lessonIndex={0}
      prev={null}
      next={{ path: '/springboot/setup', label: 'Project Setup & Structure' }}
    >
      <h2>Introduction to the Spring Ecosystem</h2>
      <p>
        Spring Boot is an opinionated framework built on top of the Spring Framework that
        dramatically simplifies the process of building production-ready Java applications.
        It removes the boilerplate configuration that made traditional Spring development
        tedious, letting you focus on your business logic instead of XML files and manual
        dependency wiring.
      </p>

      <h3>The Spring Ecosystem</h3>
      <p>
        The Spring ecosystem is a collection of projects that address virtually every aspect
        of enterprise application development. At its core is the Spring Framework, which
        provides dependency injection and aspect-oriented programming. Spring Boot sits on
        top, offering auto-configuration, embedded servers, and production-ready features.
      </p>

      <FlowChart
        title="The Spring Ecosystem"
        chart={"graph TD\nA[Spring Framework] --> B[Spring Boot]\nA --> C[Spring MVC]\nA --> D[Spring Data]\nA --> E[Spring Security]\nB --> F[Auto-Configuration]\nB --> G[Embedded Server]\nB --> H[Spring Actuator]\nC --> I[REST APIs]\nD --> J[JPA / Hibernate]\nE --> K[Authentication & Authorization]"}
      />

      <h3>Spring vs Spring Boot</h3>
      <p>
        Traditional Spring required extensive XML configuration or Java-based configuration
        classes. Spring Boot eliminates most of this through convention over configuration
        and intelligent auto-configuration.
      </p>

      <CodeBlock language="java" title="TraditionalSpringConfig.java">
{`// Traditional Spring Configuration (verbose)
@Configuration
@EnableWebMvc
@ComponentScan(basePackages = "com.example")
public class WebConfig implements WebMvcConfigurer {

    @Bean
    public ViewResolver viewResolver() {
        InternalResourceViewResolver resolver =
            new InternalResourceViewResolver();
        resolver.setPrefix("/WEB-INF/views/");
        resolver.setSuffix(".jsp");
        return resolver;
    }

    @Bean
    public DataSource dataSource() {
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
        ds.setUrl("jdbc:mysql://localhost:3306/mydb");
        ds.setUsername("root");
        ds.setPassword("password");
        return ds;
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="SpringBootApplication.java">
{`// Spring Boot equivalent — auto-configured!
@SpringBootApplication
public class MyApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}

// Just add to application.properties:
// spring.datasource.url=jdbc:mysql://localhost:3306/mydb
// spring.datasource.username=root
// spring.datasource.password=password`}
      </CodeBlock>

      <h3>How Auto-Configuration Works Under the Hood</h3>

      <InfoBox variant="info" title="What Auto-Configuration Does">
        <p>
          Spring Boot inspects your classpath at startup and automatically configures beans
          based on the libraries present. For example, if it finds <code>spring-boot-starter-web</code> on
          the classpath, it automatically sets up an embedded Tomcat server, configures Spring MVC,
          and registers default error handlers — all without a single line of configuration from you.
        </p>
      </InfoBox>

      <p>
        Auto-configuration classes are registered in <code>META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code>.
        Each class uses conditional annotations to decide whether to activate:
      </p>

      <CodeBlock language="java" title="How Auto-Configuration Conditionals Work">
{`// Spring Boot auto-config uses conditional annotations
@Configuration
@ConditionalOnClass(DataSource.class)          // only if DataSource is on classpath
@ConditionalOnMissingBean(DataSource.class)    // only if user hasn't defined one
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "spring.datasource", name = "url")
    public DataSource dataSource(DataSourceProperties props) {
        return DataSourceBuilder.create()
            .url(props.getUrl())
            .username(props.getUsername())
            .password(props.getPassword())
            .build();
    }
}

// Key conditional annotations:
// @ConditionalOnClass       — class exists on classpath
// @ConditionalOnMissingBean — no bean of this type defined by user
// @ConditionalOnProperty    — config property is set
// @ConditionalOnWebApplication — only in web apps`}
      </CodeBlock>

      <FlowChart
        title="Spring Boot Startup Sequence"
        chart={"graph TD\n  A[main method called] --> B[SpringApplication.run]\n  B --> C[Create ApplicationContext]\n  C --> D[Component Scan - find @Component, @Service, @Repository]\n  D --> E[Process Auto-Configuration classes]\n  E --> F[Evaluate @Conditional annotations]\n  F --> G[Create and wire beans]\n  G --> H[Start embedded server - Tomcat/Jetty/Undertow]\n  H --> I[Run ApplicationRunner / CommandLineRunner]\n  I --> J[Application ready - accepting requests]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style J fill:#1a3329,stroke:#4ade80"}
      />

      <h3>Key Features of Spring Boot</h3>
      <ul>
        <li><strong>Auto-Configuration:</strong> Automatically configures your application based on dependencies</li>
        <li><strong>Embedded Servers:</strong> Ships with Tomcat, Jetty, or Undertow — no WAR deployment needed</li>
        <li><strong>Starter Dependencies:</strong> Curated dependency sets that just work together</li>
        <li><strong>Production-Ready:</strong> Built-in health checks, metrics, and externalized configuration</li>
        <li><strong>No Code Generation:</strong> No XML configuration required</li>
      </ul>

      <h3>The @SpringBootApplication Annotation</h3>
      <p>
        The <code>@SpringBootApplication</code> annotation is a convenience annotation that
        combines three important annotations into one:
      </p>

      <CodeBlock language="java" title="SpringBootAnnotation.java">
{`// @SpringBootApplication is equivalent to:
@SpringBootConfiguration  // Marks this as a configuration class (@Configuration)
@EnableAutoConfiguration  // Enables Spring Boot auto-configuration magic
@ComponentScan            // Scans for @Component, @Service, @Repository, @Controller
                          // in this package and all sub-packages
public class MyApplication {

    public static void main(String[] args) {
        // Creates the ApplicationContext, triggers auto-config,
        // starts the embedded server
        SpringApplication.run(MyApplication.class, args);
    }
}`}
      </CodeBlock>

      <h3>Creating Your First REST Endpoint</h3>

      <CodeBlock language="java" title="HelloController.java — Your First Endpoint">
{`import org.springframework.web.bind.annotation.*;

@RestController               // = @Controller + @ResponseBody on every method
@RequestMapping("/api")       // base path for all endpoints in this controller
public class HelloController {

    // GET /api/hello
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }

    // GET /api/greet?name=Alice
    @GetMapping("/greet")
    public Map<String, String> greet(@RequestParam(defaultValue = "World") String name) {
        return Map.of("message", "Hello, " + name + "!");
    }

    // POST /api/users
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User saved = userService.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // GET /api/users/42
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}`}
      </CodeBlock>

      <h3>Spring Boot Starters</h3>

      <InfoBox variant="tip" title="Common Spring Boot Starters">
        <p><strong>spring-boot-starter-web:</strong> Tomcat + Spring MVC + Jackson JSON. Everything for REST APIs.</p>
        <p><strong>spring-boot-starter-data-jpa:</strong> Hibernate + Spring Data JPA. Database access with repositories.</p>
        <p><strong>spring-boot-starter-security:</strong> Spring Security with sensible defaults (basic auth, CSRF).</p>
        <p><strong>spring-boot-starter-test:</strong> JUnit 5 + Mockito + Spring Test. All testing tools you need.</p>
        <p><strong>spring-boot-starter-validation:</strong> Bean Validation (Hibernate Validator). <code>@Valid</code>, <code>@NotNull</code>, etc.</p>
        <p><strong>spring-boot-starter-actuator:</strong> Production monitoring endpoints (/health, /metrics, /info).</p>
      </InfoBox>

      <h3>application.properties vs application.yml</h3>

      <CodeBlock language="properties" title="application.properties — Flat Key-Value">
{`# Server configuration
server.port=8080
server.servlet.context-path=/api

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/mydb
spring.datasource.username=postgres
spring.datasource.password=secret

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Logging
logging.level.root=INFO
logging.level.com.example=DEBUG
logging.level.org.hibernate.SQL=DEBUG`}
      </CodeBlock>

      <CodeBlock language="yaml" title="application.yml — Hierarchical (same settings)">
{`server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: postgres
    password: secret
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    root: INFO
    com.example: DEBUG
    org.hibernate.SQL: DEBUG`}
      </CodeBlock>

      <h3>Embedded Server & DevTools</h3>

      <InfoBox variant="info" title="Embedded Server Options">
        <p>
          Spring Boot embeds a servlet container directly in your JAR — no external Tomcat installation needed.
          <strong>Tomcat</strong> is the default. Switch to <strong>Jetty</strong> or <strong>Undertow</strong> by
          excluding Tomcat and adding the alternative starter dependency.
        </p>
      </InfoBox>

      <CodeBlock language="xml" title="pom.xml — Switching to Jetty">
{`<!-- Exclude Tomcat (included by default in spring-boot-starter-web) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- Add Jetty instead -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>

<!-- DevTools: auto-restart on code changes (dev only) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>`}
      </CodeBlock>

      <InfoBox variant="tip" title="Spring Boot DevTools">
        <p>
          Add <code>spring-boot-devtools</code> to your project for automatic restarts when files change.
          It uses two classloaders: one for your code (reloaded) and one for dependencies (cached).
          Restart time drops from 5-10s to under 2s. DevTools is automatically disabled in production
          when running as a packaged JAR.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the primary advantage of Spring Boot over traditional Spring?"
        options={[
          "It uses a different programming language",
          "It eliminates boilerplate configuration through auto-configuration",
          "It only works with microservices",
          "It replaces the need for Java"
        ]}
        correctIndex={1}
        explanation="Spring Boot's primary advantage is auto-configuration. It inspects your classpath and automatically configures beans and settings, eliminating the verbose XML and Java configuration that traditional Spring required."
      />

      <InteractiveChallenge
        question={"What does @ConditionalOnMissingBean do in a Spring Boot auto-configuration class?"}
        options={[
          "Throws an error if the bean is missing",
          "Creates the bean only if the user has NOT already defined one",
          "Removes the bean from the application context",
          "Logs a warning if the bean is missing"
        ]}
        correctIndex={1}
        explanation="@ConditionalOnMissingBean ensures the auto-configured bean is only created if the developer hasn't already defined their own. This is how Spring Boot provides sensible defaults that you can override — your custom @Bean definition takes priority over auto-configuration."
      />
    </LessonLayout>
  );
}
