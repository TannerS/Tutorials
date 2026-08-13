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

      <h3>First, three words you need before anything else makes sense</h3>
      <p>
        Almost every Spring explanation on the internet uses these three terms in its first
        paragraph and defines none of them. They are the whole model, and they are simpler than
        the jargon suggests.
      </p>

      <CodeBlock language="text" title="Bean, container, context — the entire vocabulary">
{`BEAN       An ordinary Java object that Spring created for you and holds onto,
           instead of you writing 'new'. There is nothing special about the
           class. A bean is just "an object under the framework's management".

CONTAINER  The thing holding all those objects. It knows how to build each one,
           what each one needs, and hands out the same instance to everyone who
           asks (by default). "IoC container" is the same thing — Inversion of
           Control just names the fact that IT calls the constructors, not you.

CONTEXT    The concrete container object, class ApplicationContext. When people
           say "the context failed to start", they mean this object could not
           finish building the map of beans. It IS the running application:
           kill the context and your app is over.

So: "Spring injects the repository bean into your service" unpacks to
"the container called your service's constructor and passed in the repository
object it had already built."`}
      </CodeBlock>

      <h3>What does Spring Boot actually do that plain Java doesn't?</h3>
      <p>
        A fair question, because none of the above is magic you couldn&apos;t write yourself.
        Here is the same tiny application twice — once wired by hand, once by the container —
        so you can see exactly what work is being taken off you and what it costs.
      </p>

      <CodeBlock language="java" title="Plain Java: you own every constructor call">
{`public class Main {
    public static void main(String[] args) {
        // You build the object graph by hand, bottom-up, in dependency order.
        DataSource dataSource   = new HikariDataSource(hikariConfig());
        OrderRepository repo    = new JdbcOrderRepository(dataSource);
        PaymentGateway gateway  = new StripeGateway(System.getenv("STRIPE_KEY"));
        OrderService service    = new OrderService(repo, gateway);
        OrderController ctrl    = new OrderController(service);

        // ...and you own the HTTP server, the routing table, the JSON codec,
        // the shutdown hook, the connection-pool lifecycle, and the config
        // parsing. None of that is business logic. All of it is load-bearing.
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/api/orders", exchange -> { /* parse, route, serialise */ });
        server.start();
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="The same thing in Spring Boot">
{`@SpringBootApplication
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}

@RestController
class OrderController {
    private final OrderService service;
    // Spring sees this constructor, sees it needs an OrderService, finds or
    // builds that bean, and passes it in. That is dependency injection.
    OrderController(OrderService service) { this.service = service; }
}

// The DataSource, the connection pool, the HTTP server, the JSON codec, the
// shutdown hook and the config parsing are all still there — they are just
// beans Spring Boot created for you because it saw the matching libraries on
// the classpath. That inference is called AUTO-CONFIGURATION, and the rest of
// this page is about how it decides.`}
      </CodeBlock>

      <InfoBox variant="note" title="The trade you are making">
        <p>
          Hand-wiring is explicit: you can read <code>main</code> and know the entire object
          graph. Spring&apos;s version is shorter and uniform, but the graph is now
          <em> implied</em> — assembled at runtime from annotations, the classpath, and your
          config. That is a genuinely good trade at the scale of a real service, and it is
          also the reason Spring gets called &quot;magic&quot;. The cure is not to avoid it; it
          is to know the rules the container follows, which is what the next few lessons do.
        </p>
      </InfoBox>

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
{`// Spring Boot auto-config uses conditional annotations.
// Note @AutoConfiguration, not plain @Configuration: it marks the class as an
// auto-configuration and lets you order it with before/after attributes.
@AutoConfiguration
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
{`import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController               // = @Controller + @ResponseBody on every method
@RequestMapping("/api")       // base path for all endpoints in this controller
public class HelloController {

    // The controller is a bean, so its collaborators arrive through the
    // constructor. UserService is another bean; you never call 'new' on it.
    private final UserService users;

    public HelloController(UserService users) {
        this.users = users;
    }

    // GET /api/hello
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }

    // GET /api/greet?name=Alice
    @GetMapping("/greet")
    public Map<String, String> greet(@RequestParam(defaultValue = "World") String name) {
        // Returning a Map: Jackson serialises it to {"message":"Hello, Alice!"}.
        return Map.of("message", "Hello, " + name + "!");
    }

    // POST /api/users
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User saved = users.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // GET /api/users/42
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return users.findById(id)
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

      <h2>Reading a Startup Failure</h2>
      <p>
        Your first hundred Spring problems will be startup problems, and Boot is unusually good
        at explaining them — it runs a set of <strong>failure analyzers</strong> that recognise
        common exceptions and reformat them into a Description/Action block. The trick is
        knowing to scroll <em>past</em> the stack trace to find it. Anything under
        <code> ***************************</code> was written for you to read; the trace above
        it usually was not.
      </p>

      <CodeBlock language="text" title="The four failures you will actually hit">
{`(1) A dependency has no bean to satisfy it
***************************
APPLICATION FAILED TO START
***************************
Description:
Parameter 0 of constructor in com.example.OrderService required a bean of
type 'com.example.OrderRepository' that could not be found.
Action:
Consider defining a bean of type 'com.example.OrderRepository' in your
configuration.

  READ IT AS: "I was told to build OrderService, its constructor wants an
  OrderRepository, and I have none registered under that type."
  USUAL CAUSE: the class isn't annotated (@Service/@Component/@Repository),
  or it lives OUTSIDE the package tree under your @SpringBootApplication
  class, so component scanning never saw it. Check the package first — the
  annotation is usually right there and visibly correct, which is exactly
  why people stare at it for ten minutes.


(2) Two beans fit, and Spring will not guess
Parameter 0 of constructor in com.example.CheckoutService required a single
bean, but 2 were found:
	- stripeGateway: defined in file [.../StripePaymentGateway.class]
	- paypalGateway: defined in file [.../PaypalPaymentGateway.class]

  READ IT AS: NoUniqueBeanDefinitionException. Note that it NAMES both
  candidates — that list is the answer to "which one did I forget about?".
  FIX: @Primary on the default, or @Qualifier at the injection point.
  Covered in the Dependency Injection lesson.


(3) The port is taken
Description:
Web server failed to start. Port 8080 was already in use.
Action:
Identify and stop the process that's listening on port 8080 or configure
this application to listen on another port.

  Almost always a previous run you didn't stop.
  lsof -i :8080     (macOS/Linux)      then kill the pid
  Or just: --server.port=8081


(4) The beans depend on each other in a loop
Description:
The dependencies of some of the beans in the application context form a cycle:
   orderService defined in file [...]
      ↓
   inventoryService defined in file [...]
      ↑     ↓
   +---------+

  Boot 2.6+ refuses this by default. The ASCII diagram tells you exactly
  which beans are in the loop. Fix the design, don't set
  spring.main.allow-circular-references=true — see the DI lesson.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The one flag worth memorising: --debug">
        <p>
          When the failure is &quot;auto-configuration did something I did not expect&quot; —
          the wrong <code>DataSource</code>, security switched on when you didn&apos;t ask for
          it, an endpoint missing — run with <code>--debug</code>. Boot prints a{' '}
          <strong>CONDITIONS EVALUATION REPORT</strong> listing every auto-configuration class
          under <em>Positive matches</em> (it applied, and why) and <em>Negative matches</em>
          (it backed off, and which condition failed). This turns &quot;why is this bean
          here?&quot; from guesswork into a lookup.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="What --debug prints, trimmed">
{`$ ./mvnw spring-boot:run -Dspring-boot.run.arguments=--debug

============================
CONDITIONS EVALUATION REPORT
============================

Positive matches:
-----------------
   DataSourceAutoConfiguration matched:
      - @ConditionalOnClass found required class
        'javax.sql.DataSource' (OnClassCondition)

   DataSourceAutoConfiguration#dataSource matched:
      - @ConditionalOnMissingBean (types: javax.sql.DataSource;
        SearchStrategy: all) did not find any beans (OnBeanCondition)
        ^^ this line is the whole "you can override it" mechanism, visible.

Negative matches:
-----------------
   RedisAutoConfiguration:
      Did not match:
         - @ConditionalOnClass did not find required class
           'org.springframework.data.redis.core.RedisOperations'
        ^^ i.e. "you don't have the Redis starter, so I did nothing."

Read this as a decision log. Every bean Spring Boot created for you has a
line here saying which condition let it in.`}
      </CodeBlock>

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
