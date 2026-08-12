import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Error() {
  return (
    <LessonLayout
      title="Error Handling & Validation"
      sectionId="springboot"
      lessonIndex={8}
      prev={{ path: '/springboot/config', label: 'Configuration & Profiles' }}
      next={{ path: '/springboot/advanced', label: 'Advanced Topics' }}
    >
      <h2>The Philosophy</h2>
      <p>
        Good error handling has two rules:
      </p>
      <ol>
        <li>
          <strong>Throw at the fault line.</strong> The service or repository that discovers
          the problem raises a well-typed exception. It does not know or care about HTTP.
        </li>
        <li>
          <strong>Translate once at the edge.</strong> A single
          <code>@RestControllerAdvice</code> converts every domain exception into the correct
          HTTP status and a structured JSON body.
        </li>
      </ol>
      <p>
        Anything else — controllers checking preconditions with <code>if</code>-and-return,
        services returning <code>{`Optional<Error>`}</code>, boolean success flags — leaks
        error handling into every layer and multiplies the cases you have to remember.
      </p>

      <FlowChart
        title="Error flow from service to client"
        chart={"graph TD\nA[Service throws domain exception] --> B[Exception propagates up call stack]\nB --> C[RestControllerAdvice matches exception type]\nC --> D[Builds ProblemDetail with status + code + details]\nD --> E[JSON response to client]"}
      />

      <h2>ProblemDetail (RFC 7807) — the default from Spring Boot 3+</h2>
      <p>
        RFC 7807 defines a media type — <code>application/problem+json</code> — for HTTP
        API error bodies. Spring 6 provides <code>ProblemDetail</code> as a first-class
        class and Spring Boot exposes it automatically.
      </p>
      <CodeBlock language="json" title="What a ProblemDetail response looks like">
{`{
  "type":   "https://api.example.com/errors/customer-not-found",
  "title":  "Customer not found",
  "status": 404,
  "detail": "No customer exists with id 8f2b91c6-3f2a-4f5b-a831-8f3fe0a5d1f0",
  "instance": "/api/customers/8f2b91c6-3f2a-4f5b-a831-8f3fe0a5d1f0",
  "code":   "CUSTOMER_NOT_FOUND",
  "errors": [
    { "field": "email", "message": "must be a valid email" }
  ]
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Enable ProblemDetail globally">
        <p>
          In <code>application.yml</code>:
        </p>
        <pre>{`spring:
  mvc:
    problemdetails:
      enabled: true`}</pre>
        <p>
          With this on, uncaught Spring MVC exceptions
          (<code>MethodArgumentNotValidException</code>, <code>HttpMessageNotReadableException</code>,
          etc.) automatically produce <code>ProblemDetail</code> bodies without you writing
          a handler.
        </p>
      </InfoBox>

      <h2>Domain Exception Hierarchies</h2>
      <p>
        Two concepts every enterprise app benefits from: a <strong>base exception</strong>
        that carries the code + HTTP status, and a <strong>discriminated hierarchy</strong>
        for the categories your handler needs to distinguish.
      </p>

      <CodeBlock language="java" title="A discriminated exception hierarchy">
{`// Base — every domain exception extends this, so the handler only needs one entry.
public abstract class DomainException extends RuntimeException {
    private final String code;
    private final HttpStatus status;
    private final Map<String, Object> details;

    protected DomainException(String code, HttpStatus status, String message) {
        this(code, status, message, Map.of());
    }
    protected DomainException(String code, HttpStatus status, String message,
                              Map<String, Object> details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
    }
    public String code() { return code; }
    public HttpStatus status() { return status; }
    public Map<String, Object> details() { return details; }
}

// A caller-actionable failure: bad input, business-rule violation.
// HTTP 4xx. Client can fix and retry.
public abstract class BusinessException extends DomainException {
    protected BusinessException(String code, HttpStatus status, String msg) {
        super(code, status, msg);
    }
    protected BusinessException(String code, HttpStatus status, String msg,
                                Map<String, Object> details) {
        super(code, status, msg, details);
    }
}

// A configuration / system fault. HTTP 500. Client can't help — page an oncall.
public class SystemException extends DomainException {
    public SystemException(String code, String msg) {
        super(code, HttpStatus.INTERNAL_SERVER_ERROR, msg);
    }
}

// An authorization refusal. Split out because we log it differently and never
// leak "why" to the client for security reasons.
public class AuthorizationException extends DomainException {
    public AuthorizationException(String code, String msg) {
        super(code, HttpStatus.FORBIDDEN, msg);
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Concrete business exceptions">
{`public class CustomerNotFoundException extends BusinessException {
    public CustomerNotFoundException(UUID id) {
        super("CUSTOMER_NOT_FOUND", HttpStatus.NOT_FOUND,
              "No customer exists with id " + id,
              Map.of("customerId", id));
    }
}

public class DuplicateEmailException extends BusinessException {
    public DuplicateEmailException(String email) {
        super("DUPLICATE_EMAIL", HttpStatus.CONFLICT,
              "Email already registered",
              Map.of("email", email));
    }
}

public class OrderTotalOverLimitException extends BusinessException {
    public OrderTotalOverLimitException(BigDecimal total, BigDecimal limit) {
        super("ORDER_OVER_LIMIT", HttpStatus.UNPROCESSABLE_ENTITY,
              "Order total exceeds account limit",
              Map.of("total", total, "limit", limit));
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why not one massive exception with a status field?">
        <p>
          You could carry the HTTP status on a single <code>ApiException</code>. It works
          — but a discriminated hierarchy has three real advantages: logging can be
          class-based (e.g., all <code>SystemException</code>s go to error level with
          alerts; <code>BusinessException</code>s stay at info), tests can assert types
          instead of magic status codes, and metrics can bucket by exception class for
          free.
        </p>
      </InfoBox>

      <h2>The Global Handler</h2>

      <CodeBlock language="java" title="One handler for the whole API">
{`@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    // Domain exceptions — the well-behaved case. Our own type.
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ProblemDetail> handleDomain(DomainException e, HttpServletRequest req) {
        // Log at the level appropriate to the class.
        if (e instanceof SystemException) log.error("System error", e);
        else if (e instanceof AuthorizationException) log.warn("Auth denied: {}", e.code());
        else                                          log.info("Business error: {}", e.code());

        ProblemDetail p = ProblemDetail.forStatusAndDetail(e.status(), e.getMessage());
        p.setType(URI.create("https://api.example.com/errors/" + e.code().toLowerCase()));
        p.setTitle(humanize(e.code()));
        p.setInstance(URI.create(req.getRequestURI()));
        p.setProperty("code", e.code());
        e.details().forEach(p::setProperty);
        return ResponseEntity.status(e.status()).body(p);
    }

    // Bean validation on @Valid @RequestBody parameters.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException e,
                                                          HttpServletRequest req) {
        List<Map<String, String>> errors = e.getBindingResult().getFieldErrors().stream()
            .map(f -> Map.of("field", f.getField(), "message", f.getDefaultMessage()))
            .toList();
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
            "One or more fields are invalid");
        p.setTitle("Validation failed");
        p.setInstance(URI.create(req.getRequestURI()));
        p.setProperty("code", "VALIDATION_FAILED");
        p.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(p);
    }

    // Body couldn't be parsed as JSON at all.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleUnreadable(HttpMessageNotReadableException e,
                                                          HttpServletRequest req) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
            "Request body could not be parsed");
        p.setTitle("Malformed request body");
        p.setInstance(URI.create(req.getRequestURI()));
        p.setProperty("code", "MALFORMED_BODY");
        return ResponseEntity.badRequest().body(p);
    }

    // Anything else — the catch-all. Log the full stack, hide details from the client.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnknown(Exception e, HttpServletRequest req) {
        log.error("Unhandled exception at {}", req.getRequestURI(), e);
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred");
        p.setTitle("Internal server error");
        p.setInstance(URI.create(req.getRequestURI()));
        p.setProperty("code", "INTERNAL_ERROR");
        return ResponseEntity.internalServerError().body(p);
    }

    private static String humanize(String code) {
        return Arrays.stream(code.split("_"))
            .map(w -> w.charAt(0) + w.substring(1).toLowerCase())
            .collect(Collectors.joining(" "));
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Never leak internals in error messages">
        <p>
          The <code>Exception.class</code> catch-all logs the stack trace on the server
          and returns a generic message to the client. Never put <code>e.getMessage()</code>
          into the response body for unknown exceptions — you'll leak SQL fragments, file
          paths, or class names that help an attacker.
        </p>
      </InfoBox>

      <h2>Bean Validation — The 20 Constraints You'll Actually Use</h2>

      <CodeBlock language="java" title="Jakarta Bean Validation reference">
{`// Presence
@NotNull       // not null
@NotBlank      // not null AND not whitespace-only (String)
@NotEmpty      // not null AND has size (String, Collection, Map, array)

// Numbers
@Min(1)  @Max(999)
@Positive  @PositiveOrZero  @Negative  @NegativeOrZero
@Digits(integer = 10, fraction = 2)

// Strings
@Size(min = 8, max = 128)
@Pattern(regexp = "^[A-Z0-9-]+$")
@Email

// Dates
@Past  @PastOrPresent  @Future  @FutureOrPresent

// Collections
@Size(min = 1, max = 100)
@NotEmpty

// Custom
@AssertTrue                     // for a boolean method that must return true
@AssertFalse

// Nested and cross-field
@Valid                          // apply constraints on the referenced object
@ScriptAssert(lang = "javascript",
              script = "_this.password.equals(_this.passwordConfirm)")`}
      </CodeBlock>

      <h3>Custom constraints for domain rules</h3>
      <CodeBlock language="java" title="A reusable @StrongPassword constraint">
{`@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = StrongPasswordValidator.class)
public @interface StrongPassword {
    String message() default "password too weak";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    int minLength() default 12;
}

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {
    private int minLength;
    public void initialize(StrongPassword ann) { this.minLength = ann.minLength(); }

    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null) return true; // let @NotNull handle null
        return value.length() >= minLength
            && value.chars().anyMatch(Character::isDigit)
            && value.chars().anyMatch(Character::isUpperCase)
            && value.chars().anyMatch(Character::isLowerCase);
    }
}

// Usage
public record CreateUserRequest(
        @NotBlank @Email                              String email,
        @NotBlank @StrongPassword                     String password,
        @NotBlank @Size(max = 100)                    String displayName) { }`}
      </CodeBlock>

      <h2>Validation Groups — Different Rules for Different Operations</h2>
      <p>
        Sometimes the same DTO should validate differently in <code>POST</code> (create)
        vs <code>PUT</code> (update). Validation groups let you activate different subsets
        of constraints.
      </p>
      <CodeBlock language="java" title="Groups in action">
{`interface OnCreate {}
interface OnUpdate {}

public record UserRequest(
        @NotNull(groups = OnUpdate.class)              UUID id,
        @NotBlank(groups = { OnCreate.class, OnUpdate.class })
        @Email(groups = { OnCreate.class, OnUpdate.class })
        String email,
        @NotBlank(groups = OnCreate.class)             String password) { }

// Controller uses @Validated with the group
@PostMapping
public UserDto create(@Validated(OnCreate.class) @RequestBody UserRequest req) { /* ... */ }

@PutMapping("/{id}")
public UserDto update(@PathVariable UUID id,
                      @Validated(OnUpdate.class) @RequestBody UserRequest req) { /* ... */ }`}
      </CodeBlock>

      <h2>Wrapping Third-Party Exceptions</h2>
      <p>
        Never let low-level driver exceptions escape to your handler.
        Catch, wrap, re-throw as a domain exception. This keeps the handler free of
        knowledge about which database / HTTP client you happen to be using.
      </p>
      <CodeBlock language="java" title="Turning a driver exception into a domain one">
{`@Repository
public class CustomerRepository {

    private final JdbcTemplate jdbc;
    public CustomerRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void save(Customer c) {
        try {
            jdbc.update("INSERT INTO customer(id,email,...) VALUES (?,?,...)",
                c.id(), c.email());
        } catch (DuplicateKeyException e) {                   // Spring translation
            throw new DuplicateEmailException(c.email());     // our domain exception
        }
    }
}`}
      </CodeBlock>

      <h2>Error Envelope Testing</h2>
      <CodeBlock language="java" title="Testing that the right exception maps to the right response">
{`@WebMvcTest(CustomerController.class)
class CustomerControllerErrorTest {

    @Autowired MockMvc mvc;
    @MockitoBean CustomerService service;

    @Test
    void notFoundReturns404ProblemDetail() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.byId(id)).thenThrow(new CustomerNotFoundException(id));

        mvc.perform(get("/api/customers/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.code").value("CUSTOMER_NOT_FOUND"))
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.customerId").value(id.toString()));
    }

    @Test
    void invalidBodyReturns400WithFieldErrors() throws Exception {
        mvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"not-an-email","password":"x","displayName":""}"""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors[?(@.field=='email')]").exists())
            .andExpect(jsonPath("$.errors[?(@.field=='password')]").exists())
            .andExpect(jsonPath("$.errors[?(@.field=='displayName')]").exists());
    }
}`}
      </CodeBlock>

      <h2>Error Handling Checklist</h2>
      <InfoBox variant="success" title="What good error handling looks like">
        <ul>
          <li>All application errors extend a single <code>DomainException</code> base.</li>
          <li>Two subclasses at minimum: <code>BusinessException</code> (4xx, caller-actionable)
              and <code>SystemException</code> (5xx, page oncall).</li>
          <li>One <code>@RestControllerAdvice</code> converts all of them to
              <code>ProblemDetail</code> with a stable machine-readable <code>code</code>.</li>
          <li>No <code>if</code>-return error-DTO logic anywhere in controllers.</li>
          <li>Validation via Jakarta constraints on request DTOs; business rules stay in
              services.</li>
          <li>Third-party driver exceptions are caught at the repository / client boundary
              and re-thrown as domain exceptions.</li>
          <li>Every exception class has at least one slice test that asserts the response
              shape.</li>
          <li>Logging levels match severity: system errors at ERROR, business errors at
              INFO, auth denials at WARN.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Your controller currently checks 'if (customer == null) return ResponseEntity.status(404).body(errorDto);'. What's the idiomatic Spring approach?"
        options={[
          "Return Optional<Customer> from the service and let the controller unwrap it",
          "Throw a domain exception (e.g., CustomerNotFoundException) from the service and let a @RestControllerAdvice translate it to a 404 ProblemDetail response",
          "Return null and let Spring auto-generate a 404",
          "Return ResponseEntity.notFound() and log the error"
        ]}
        correctIndex={1}
        explanation="'Throw at the fault line, translate once at the edge' is the guiding principle. The service that discovers the problem raises a typed domain exception; a single @RestControllerAdvice converts it into HTTP. Controllers stay clean of if-return error logic. Optional works for a genuine 'may or may not exist' return type in a service, but it doesn't scale — every consumer would have to reinvent the 'convert to HTTP 404' step."
      />
    </LessonLayout>
  );
}
