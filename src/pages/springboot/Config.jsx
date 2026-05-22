import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringConfig() {
  return (
    <LessonLayout
      title="Configuration"
      sectionId="springboot"
      lessonIndex={7}
      prev={{ path: "/springboot/testing", label: "Testing Spring Apps" }}
      next={{ path: "/springboot/error", label: "Error Handling" }}
    >
      <p>Spring Boot supports flexible externalized configuration through properties files, YAML, environment variables, and command-line arguments.</p>

      <h2>Configuration Hierarchy</h2>
      <p>Spring Boot loads configuration from multiple sources in order of precedence. Higher sources override lower ones.</p>
      <CodeBlock language="yaml" title="application.yml — Full Example">
{`spring:
  profiles:
    active: dev         # active profile

  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver

  jpa:
    defer-datasource-initialization: true

# Custom properties
app:
  api-key: my-secret-key
  max-upload-size: 10MB
  feature-flags:
    new-checkout: true
    beta-ui: false`}
      </CodeBlock>

      <h2>@ConfigurationProperties (Preferred)</h2>
      <CodeBlock language="java" title="Type-Safe Configuration">
{`// Define a properties class
@ConfigurationProperties(prefix = "app")
@Validated  // enables Bean Validation on properties
public record AppProperties(
    @NotBlank String apiKey,
    @NotNull @Positive int maxUploadSizeMb,
    FeatureFlags featureFlags
) {
    public record FeatureFlags(boolean newCheckout, boolean betaUi) {}
}

// Enable in @SpringBootApplication or @Configuration
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class MyApplication { ... }

// Inject and use
@Service
public class PaymentService {
    private final AppProperties props;

    public PaymentService(AppProperties props) {
        this.props = props;
    }

    public void process() {
        if (props.featureFlags().newCheckout()) {
            // use new checkout flow
        }
    }
}`}
      </CodeBlock>

      <h2>Profiles</h2>
      <CodeBlock language="java" title="Spring Profiles">
{`// application-dev.yml  — loaded when profile "dev" is active
// application-prod.yml — loaded when profile "prod" is active

// Activate profile:
// 1. In application.yml: spring.profiles.active=dev
// 2. As JVM arg: -Dspring.profiles.active=prod
// 3. As env variable: SPRING_PROFILES_ACTIVE=prod
// 4. In tests: @ActiveProfiles("test")

// Profile-specific beans
@Profile("dev")
@Bean
public DataSource devDataSource() {
    return new EmbeddedDatabaseBuilder()
        .setType(EmbeddedDatabaseType.H2)
        .build();
}

@Profile("prod")
@Bean
public DataSource prodDataSource() {
    return DataSourceBuilder.create()
        .url(env.getProperty("DB_URL"))
        .build();
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Environment Variables Override Properties">
        <p>Environment variables take precedence over application.properties. Use SNAKE_CASE env vars (SPRING_DATASOURCE_URL) to override spring.datasource.url. This is the standard pattern for containerized deployments where secrets are passed as env vars.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the advantage of @ConfigurationProperties over @Value?"
        options={["@Value is better — it is simpler", "@ConfigurationProperties provides type-safe, grouped configuration with validation support", "@ConfigurationProperties only works with YAML", "@Value supports nested properties"]}
        correctIndex={1}
        explanation="@ConfigurationProperties binds an entire group of related properties to a class, provides type safety, supports Bean Validation, and is IDE-friendly (autocomplete). @Value injects single values and uses SpEL expressions, but lacks grouping and validation."
      />
    </LessonLayout>
  );
}
