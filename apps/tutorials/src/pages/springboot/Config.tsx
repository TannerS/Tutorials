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
      <h2>Externalized Configuration — The Twelve-Factor Way</h2>
      <p>
        Every non-trivial application ships to at least three environments: local, staging,
        production. Configuration that varies between them — database URLs, secrets, feature
        toggles, third-party endpoints — must live outside the code, and Spring Boot has an
        opinionated but flexible system for it.
      </p>

      <h2>Property Sources and Precedence</h2>
      <p>
        Spring merges configuration from many sources into a single <code>Environment</code>.
        When the same key appears in multiple places, the last one wins. Memorize this order
        — it's how you debug "why is this value X in dev and Y in prod?".
      </p>
      <CodeBlock language="text" title="Property precedence — highest wins">
{`1.  Devtools global settings              (dev only)
2.  @TestPropertySource / SpringBootTest args
3.  Command-line args              --db.url=jdbc:postgresql://...
4.  ServletConfig / ServletContext init params
5.  JNDI                                   (rare today)
6.  Java system properties                 -Dspring.profiles.active=prod
7.  OS environment variables               DB_URL=jdbc:postgresql://...
8.  RandomValuePropertySource              \${random.uuid}, \${random.int}
9.  application-{profile}.yml              (from packaged jar or classpath)
10. application.yml                        (from packaged jar or classpath)
11. application-{profile}.yml              (from outside the jar)
12. application.yml                        (from outside the jar)
13. @PropertySource on @Configuration
14. Default properties (SpringApplication.setDefaultProperties)`}
      </CodeBlock>

      <InfoBox variant="tip" title="The two rules to remember">
        <ul>
          <li><strong>Environment variables trump files.</strong> Anything you set with
              <code>DATABASE_URL=...</code> in the container beats what's in
              <code>application.yml</code>.</li>
          <li><strong>Profile-specific overrides base.</strong>
              <code>application-prod.yml</code> replaces same-key values from
              <code>application.yml</code> when the <code>prod</code> profile is active.</li>
        </ul>
      </InfoBox>

      <h2>application.yml vs application.properties</h2>
      <p>
        Same content, different syntax. YAML wins on readability for anything nested; properties
        wins on machine-tooling and simplicity. Modern codebases pick YAML.
      </p>
      <CodeBlock language="yaml" title="A representative application.yml">
{`spring:
  application:
    name: order-service
  datasource:
    url: \${DATABASE_URL:jdbc:postgresql://localhost:5432/orders}
    username: \${DATABASE_USER:orders}
    password: \${DATABASE_PASSWORD:orders}
    hikari:
      maximum-pool-size: 20
      connection-timeout: 3000
  jpa:
    hibernate:
      ddl-auto: none
    properties:
      hibernate.jdbc.batch_size: 50

server:
  port: 8080
  shutdown: graceful

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true

# Custom app-specific config
app:
  features:
    notifications:
      enabled: false
      channel: email
  external:
    catalog-api:
      base-url: \${CATALOG_API_URL:https://catalog.example.com}
      timeout: PT3S`}
      </CodeBlock>

      <h3>Placeholder syntax</h3>
      <CodeBlock language="text" title="Placeholders inside values">
{`\${var}                      # required — startup fails if var is missing
\${var:default}              # fallback if missing
\${var:\${other:literal}}     # nested defaults
\${random.uuid}              # generates a UUID at startup
\${random.int(10,100)}       # random int in range`}
      </CodeBlock>

      <h2>@ConfigurationProperties — Type-Safe Config</h2>
      <p>
        Binding config values to a typed POJO. This is the modern replacement for
        <code>@Value("${'{'}...{'}'}")</code> field injection sprinkled across the codebase.
      </p>
      <CodeBlock language="java" title="A typed configuration record">
{`@ConfigurationProperties(prefix = "app.external.catalog-api")
@Validated
public record CatalogApiProperties(
        @NotBlank String baseUrl,
        @NotNull Duration timeout,
        @NotNull @Positive Integer maxRetries) {

    // Provide sensible defaults via a compact constructor.
    public CatalogApiProperties {
        if (maxRetries == null) maxRetries = 3;
    }
}

// Enable binding of this type. Put on your @SpringBootApplication class
// or a dedicated @Configuration.
@SpringBootApplication
@ConfigurationPropertiesScan          // scans for @ConfigurationProperties classes
public class Application { /* ... */ }

// Now inject the record anywhere.
@Service
public class CatalogClient {
    private final CatalogApiProperties props;
    public CatalogClient(CatalogApiProperties props) { this.props = props; }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Records + @ConfigurationProperties = the modern default">
        <p>
          A record makes the config immutable, gives you a copy constructor for tests, and
          keeps the class file to two lines. Bean Validation runs at startup — bad config
          fails the app before it accepts traffic. This is what you want.
        </p>
      </InfoBox>

      <h3>Nested config classes</h3>
      <CodeBlock language="java" title="Nested types for complex trees">
{`@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Features features,
        Map<String, ClientConfig> clients) {

    public record Features(
            Notifications notifications,
            boolean darkMode) {

        public record Notifications(
                boolean enabled,
                String channel) { }
    }

    public record ClientConfig(
            String baseUrl,
            Duration timeout) { }
}

// application.yml
// app:
//   features:
//     notifications:
//       enabled: true
//       channel: sms
//     dark-mode: true
//   clients:
//     catalog:
//       base-url: https://catalog.example.com
//       timeout: PT3S
//     billing:
//       base-url: https://billing.example.com
//       timeout: PT5S`}
      </CodeBlock>

      <h2>@Value — When You Really Do Just Need One Value</h2>
      <p>
        Fine for one-off values and quick scripts; a smell if you have three or more of them
        in one class.
      </p>
      <CodeBlock language="java" title="@Value examples">
{`@Component
public class Foo {

    // Required — fails startup if missing.
    @Value("\${app.upload.dir}")
    private String uploadDir;

    // With default.
    @Value("\${app.upload.max-bytes:26214400}")
    private long maxBytes;

    // SpEL expression.
    @Value("#{ T(java.time.Duration).parse('\${app.session.timeout:PT30M}') }")
    private Duration sessionTimeout;

    // A comma-separated list bound to a List.
    @Value("\${app.allowed-origins:}")
    private List<String> allowedOrigins;
}`}
      </CodeBlock>

      <h2>Spring Profiles</h2>
      <p>
        A profile is a named subset of beans and properties. Activate one or more at startup
        and the app is configured for that environment.
      </p>
      <CodeBlock language="text" title="Activating profiles">
{`# Command line
java -jar app.jar --spring.profiles.active=prod,us-east-1

# Environment variable
export SPRING_PROFILES_ACTIVE=prod,us-east-1

# application.yml
spring:
  profiles:
    active: dev

# In tests
@ActiveProfiles("test")`}
      </CodeBlock>

      <CodeBlock language="yaml" title="Profile-specific files">
{`# application.yml — base
app:
  cache:
    ttl: PT1M

# application-prod.yml — overrides for prod
app:
  cache:
    ttl: PT10M
server:
  compression:
    enabled: true

# application-test.yml — for @ActiveProfiles("test")
spring:
  jpa:
    hibernate:
      ddl-auto: create-drop`}
      </CodeBlock>

      <h3>Profile-scoped beans</h3>
      <CodeBlock language="java" title="Different beans per environment">
{`@Service
@Profile("prod")
public class SesEmailSender implements EmailSender { /* real SES */ }

@Service
@Profile("!prod")   // any profile except prod
public class LogOnlyEmailSender implements EmailSender {
    public void send(Email e) { log.info("[email suppressed] {}", e.subject()); }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Profile-per-environment is a trap at scale">
        <p>
          It works fine for a small app. As soon as you have multiple regions, feature flags,
          and A/B experiments, profile matrices explode combinatorially (e.g.,
          <code>prod-eu-canary-feature-x</code>). Prefer <em>flag-driven</em> configuration
          (<code>@ConditionalOnProperty</code> reading environment variables) for feature
          toggling, and reserve profiles for genuinely different modes (dev / test / prod).
        </p>
      </InfoBox>

      <h2>Secrets — What Not to Put in application.yml</h2>
      <p>
        Passwords, API keys, and tokens must never be committed to Git. In practice:
      </p>
      <ul>
        <li>Local dev: <code>.env</code> file (git-ignored) + a script that exports variables.</li>
        <li>Cloud: your platform's secret manager (AWS Secrets Manager, GCP Secret Manager,
            Kubernetes Secrets), mounted as env vars or files.</li>
        <li>CI: masked secrets stored in the CI system.</li>
      </ul>
      <CodeBlock language="yaml" title="Reference secrets via env vars">
{`spring:
  datasource:
    password: \${DATABASE_PASSWORD}           # no default: startup fails if unset

app:
  external:
    stripe:
      api-key: \${STRIPE_API_KEY}
      webhook-secret: \${STRIPE_WEBHOOK_SECRET}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never log a properties dump in production">
        <p>
          Spring's <code>/actuator/env</code> and <code>/actuator/configprops</code> endpoints
          expose the entire configuration. Behind auth in prod, or don't expose them at all.
          A test that prints <code>System.getProperties()</code> on failure is another
          common leak.
        </p>
      </InfoBox>

      <h2>Config Metadata for IDE Autocomplete</h2>
      <p>
        Spring Boot generates config metadata (<code>META-INF/spring-configuration-metadata.json</code>)
        so IDEs can autocomplete and validate your custom properties.
      </p>
      <CodeBlock language="xml" title="Enable in pom.xml">
{`<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-configuration-processor</artifactId>
  <optional>true</optional>
</dependency>`}
      </CodeBlock>
      <p>
        Now typing <code>app.external.catalog-api.</code> in <code>application.yml</code>
        shows the fields of your <code>CatalogApiProperties</code> record with their types
        and validation annotations.
      </p>

      <h2>Refreshable Config (Spring Cloud Config)</h2>
      <p>
        For values you want to change without redeploying, Spring Cloud Config provides a
        centralized config server and refreshable properties. Overkill for most apps; useful
        for platforms with dozens of services that share configuration.
      </p>
      <CodeBlock language="java" title="A refreshable bean">
{`@RefreshScope
@Component
public class RateLimitConfig {
    @Value("\${app.rate-limit.per-second:100}")
    private int perSecond;
    // POST /actuator/refresh rebuilds this bean with the latest value.
}`}
      </CodeBlock>

      <h2>Configuration Checklist</h2>
      <InfoBox variant="success" title="What good config hygiene looks like">
        <ul>
          <li>All custom config is typed via <code>@ConfigurationProperties</code>, not
              <code>@Value</code> sprinkled everywhere.</li>
          <li>All properties classes are validated (<code>@Validated</code>) so bad config
              fails the app at startup, not at first use.</li>
          <li>Secrets never live in <code>application.yml</code>; environment variables or
              a secret manager only.</li>
          <li>Profiles are used for <em>modes</em> (dev/test/prod), not for feature toggling.
              Toggles use <code>@ConditionalOnProperty</code>.</li>
          <li><code>spring-boot-configuration-processor</code> is on the classpath so
              IDEs autocomplete custom properties.</li>
          <li><code>/actuator/env</code> is authenticated in production.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="You want the app to fail startup if the API_TOKEN environment variable is missing. Which yaml reference does that?"
        options={[
          "${API_TOKEN:}",
          "${API_TOKEN:default}",
          "${API_TOKEN}",
          "${env.API_TOKEN}"
        ]}
        correctIndex={2}
        explanation="Placeholder syntax without a default (${API_TOKEN}) makes the value required — Spring throws IllegalArgumentException at startup if it's missing. ${API_TOKEN:} defaults to empty string (silent failure at runtime). ${API_TOKEN:default} always resolves. ${env.API_TOKEN} isn't Spring's syntax (it's a common environment-variable convention in other systems)."
      />
    </LessonLayout>
  );
}
