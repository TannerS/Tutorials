import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Config() {
  return (
    <LessonLayout
      title="Configuration & Profiles"
      sectionId="springboot"
      lessonIndex={7}
      prev={{ path: '/springboot/testing', label: 'Testing in Spring Boot' }}
      next={{ path: '/springboot/error', label: 'Error Handling & Validation' }}
    >
      <h2>Externalized Configuration</h2>
      <p>
        Spring Boot supports a rich set of externalized configuration options that let you
        change application behavior without modifying code. Configuration can come from
        properties files, YAML files, environment variables, command-line arguments, and more.
        Spring Boot resolves them in a well-defined priority order.
      </p>

      <FlowChart
        title="Configuration Resolution Order (Highest to Lowest Priority)"
        chart={"graph TD\nA[Command-Line Arguments] --> B[OS Environment Variables]\nB --> C[application-profile.properties]\nC --> D[application.properties]\nD --> E[application-profile.yml]\nE --> F[application.yml]\nF --> G[@PropertySource annotations]\nG --> H[Default Properties]"}
      />

      <h3>application.properties vs application.yml</h3>
      <p>
        Spring Boot supports both <code>.properties</code> and <code>.yml</code> formats for
        configuration. YAML is often preferred for its readability and support for hierarchical
        data, but both are fully equivalent in functionality.
      </p>

      <CodeBlock language="java" title="application.properties">
{`# Server Configuration
server.port=8080
server.servlet.context-path=/api

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/mydb
spring.datasource.username=postgres
spring.datasource.password=secret
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# Logging
logging.level.root=INFO
logging.level.com.example.myapp=DEBUG
logging.level.org.springframework.security=DEBUG

# Custom Application Properties
app.jwt.secret=my-secret-key
app.jwt.expiration-ms=86400000
app.cors.allowed-origins=http://localhost:3000`}
      </CodeBlock>

      <CodeBlock language="java" title="application.yml">
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
    show-sql: false

app:
  jwt:
    secret: my-secret-key
    expiration-ms: 86400000
  cors:
    allowed-origins:
      - http://localhost:3000
      - http://localhost:5173`}
      </CodeBlock>

      <h3>@Value and @ConfigurationProperties</h3>
      <p>
        Use <code>@Value</code> for injecting individual properties. For groups of related
        properties, use <code>@ConfigurationProperties</code> which provides type safety,
        validation, and IDE auto-completion.
      </p>

      <CodeBlock language="java" title="JwtProperties.java">
{`// Type-safe configuration with @ConfigurationProperties
@ConfigurationProperties(prefix = "app.jwt")
@Validated
public class JwtProperties {

    @NotBlank
    private String secret;

    @Min(60000) // At least 1 minute
    private long expirationMs = 86400000;

    private String issuer = "my-app";

    // Getters and setters required for @ConfigurationProperties
    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public long getExpirationMs() { return expirationMs; }
    public void setExpirationMs(long expirationMs) {
        this.expirationMs = expirationMs;
    }
    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }
}

// Enable it in your configuration or main class
@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class MyApp { }

// Inject the type-safe config object
@Service
public class JwtService {
    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String generateToken(UserDetails user) {
        return Jwts.builder()
            .setSubject(user.getUsername())
            .setIssuer(jwtProperties.getIssuer())
            .setExpiration(new Date(
                System.currentTimeMillis()
                + jwtProperties.getExpirationMs()))
            .signWith(getSigningKey())
            .compact();
    }
}`}
      </CodeBlock>

      <h3>Spring Profiles</h3>
      <p>
        Profiles allow you to define environment-specific configuration. Common profiles include
        <code>dev</code>, <code>staging</code>, and <code>prod</code>. You can activate a profile
        via environment variable, command-line argument, or in the default properties file.
      </p>

      <CodeBlock language="java" title="application-dev.yml">
{`# application-dev.yml — loaded when profile "dev" is active
spring:
  datasource:
    url: jdbc:h2:mem:devdb
    driver-class-name: org.h2.Driver
  h2:
    console:
      enabled: true
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true

logging:
  level:
    com.example: DEBUG

---
# application-prod.yml — production settings
spring:
  datasource:
    url: jdbc:postgresql://prod-db:5432/myapp
    username: \${DB_USERNAME}
    password: \${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

logging:
  level:
    root: WARN
    com.example: INFO`}
      </CodeBlock>

      <InfoBox variant="info" title="Environment Variables and Secrets">
        <p>
          Never commit secrets (passwords, API keys, JWT secrets) to source control. Use
          environment variables with the <code>{"${ENV_VAR}"}</code> syntax in your properties files,
          or use a secrets manager like HashiCorp Vault or AWS Secrets Manager. Spring Boot
          automatically maps environment variables to properties — for example,
          <code>SPRING_DATASOURCE_PASSWORD</code> maps to <code>spring.datasource.password</code>.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the advantage of @ConfigurationProperties over @Value?"
        options={[
          "@Value is newer and always preferred",
          "@ConfigurationProperties provides type safety, validation, and groups related properties together",
          "@ConfigurationProperties works without Spring Boot",
          "There is no difference between them"
        ]}
        correctIndex={1}
        explanation="@ConfigurationProperties binds a group of related properties to a type-safe Java object, supports JSR-303 validation (@NotBlank, @Min), enables IDE auto-completion, and makes configuration easier to test. @Value is fine for individual properties but becomes unwieldy when you have many related settings."
      />
    </LessonLayout>
  );
}
