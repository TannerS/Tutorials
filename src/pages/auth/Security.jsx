import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AuthSecurity() {
  return (
    <LessonLayout
      title="Security Best Practices"
      sectionId="auth"
      lessonIndex={6}
      prev={{ path: "/auth/authz", label: "Authorization Patterns" }}
      next={{ path: "/java-cheatsheet/syntax", label: "Java Cheat Sheet" }}
    >
      <p>Security is not a feature you add at the end — it is built in from the start. The OWASP Top 10 lists the most critical web application security risks. Understanding and mitigating these risks is a fundamental developer responsibility.</p>

      <h2>OWASP Top 10 Essentials</h2>

      <CodeBlock language="java" title="SQL Injection Prevention">
{`// VULNERABLE — never concatenate user input into queries
public User findByUsername(String username) {
    String sql = "SELECT * FROM users WHERE username = '" + username + "'";
    // Attacker enters: admin'-- or ' OR '1'='1
    return jdbcTemplate.queryForObject(sql, User.class);
}

// SAFE — parameterized queries (PreparedStatement)
public User findByUsername(String username) {
    return jdbcTemplate.queryForObject(
        "SELECT * FROM users WHERE username = ?",
        new Object[]{ username },
        User.class
    );
}

// SAFE — Spring Data JPA (always parameterized)
Optional<User> findByUsername(String username);  // auto-parameterized

// SAFE — @Query with named parameters
@Query("SELECT u FROM User u WHERE u.username = :username AND u.active = true")
Optional<User> findActiveUser(@Param("username") String username);`}
      </CodeBlock>

      <CodeBlock language="java" title="XSS and Input Validation">
{`// Validate all inputs — reject early
public class CreateUserRequest {
    @NotBlank
    @Size(min = 2, max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Username: alphanumeric only")
    private String username;

    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 12, max = 100)
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$",
             message = "Password requires upper, lower, digit, special char")
    private String password;
}

// Output encoding prevents XSS — Thymeleaf does this automatically
// React escapes by default — dangerous if you use dangerouslySetInnerHTML

// Sanitize HTML if you must accept rich text
import org.jsoup.safety.Safelist;
public String sanitizeHtml(String input) {
    return Jsoup.clean(input, Safelist.basicWithImages());
    // Allows safe tags like <b>, <p>, <a href> but strips <script>, onclick, etc.
}`}
      </CodeBlock>

      <FlowChart
        title="Security Defense in Depth"
        chart={"graph TD\n  A[Request] --> B[TLS - encrypt in transit]\n  B --> C[Rate limiting]\n  C --> D[Authentication]\n  D --> E[Authorization]\n  E --> F[Input validation]\n  F --> G[Parameterized queries]\n  G --> H[Output encoding]\n  H --> I[Audit logging]"}
      />

      <CodeBlock language="java" title="Sensitive Data Exposure Prevention">
{`// Never log passwords, tokens, or PII
@Slf4j
public class AuthService {
    public void login(String username, String password) {
        log.info("Login attempt for user: {}", username);  // OK
        // log.info("Password: {}", password);  // NEVER!
        // log.info("Token: {}", token);         // NEVER!
    }
}

// Mask sensitive fields in toString / JSON
public class UserDto {
    private String username;
    private String email;

    @JsonIgnore  // never serialize password
    private String passwordHash;

    @ToString.Exclude  // exclude from Lombok toString
    private String socialSecurityNumber;
}

// Use environment variables / secrets manager, never hardcode
// BAD:
String apiKey = "sk-live-abc123def456";  // visible in source control!

// GOOD:
@Value("${app.api.key}")
private String apiKey;  // loaded from environment or Vault`}
      </CodeBlock>

      <InfoBox variant="warning" title="Security Checklist">
        <p>Always: use HTTPS everywhere, parameterize all queries, validate and sanitize all inputs, use bcrypt for passwords, implement rate limiting on auth endpoints, log security events (logins, failures, admin actions), keep dependencies updated (use Dependabot), implement security headers (CSP, HSTS, X-Frame-Options), and never expose stack traces to clients.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the most effective defense against SQL injection attacks?"
        options={["Input validation and blacklisting dangerous characters", "Parameterized queries (PreparedStatements) — never concatenate user input into SQL", "Encrypting the database", "Running the database on an internal network only"]}
        correctIndex={1}
        explanation="Parameterized queries (PreparedStatements) are the definitive defense against SQL injection. The query structure is compiled first; user input is always treated as data, never as SQL code. Input validation is a helpful additional layer, but blacklisting is incomplete — parameterized queries are the reliable fix."
      />

    </LessonLayout>
  );
}
