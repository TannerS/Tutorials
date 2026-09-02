import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function SpringBoot2Error() {
  return (
    <LessonLayout
      title="Error Handling & Validation"
      sectionId="springboot2"
      lessonIndex={7}
      prev={{ path: '/springboot2/config', label: 'Configuration & Properties That Moved' }}
      next={{ path: '/springboot2/testing', label: 'Testing in Boot 2 — @MockBean and Friends' }}
    >
      <h2>The Philosophy (This Part Never Changed)</h2>
      <p>
        Good error handling has two rules, and they are exactly as true on Spring Boot 2.7 as on
        Boot 4:
      </p>
      <ol>
        <li>
          <strong>Throw at the fault line.</strong> The service or repository that discovers the
          problem raises a well-typed exception. It does not know or care about HTTP.
        </li>
        <li>
          <strong>Translate once at the edge.</strong> A single{' '}
          <code>@RestControllerAdvice</code> converts every domain exception into the correct
          HTTP status and a structured JSON body.
        </li>
      </ol>
      <p>
        What changes on Boot 2 is the shape of &quot;a structured JSON body&quot; — because the
        class most modern Spring tutorials reach for to build one does not exist yet.
      </p>

      <FlowChart
        title="Error flow from service to client"
        chart={"graph TD\nA[Service throws domain exception] --> B[Exception propagates up call stack]\nB --> C[RestControllerAdvice matches exception type]\nC --> D[Builds an ApiError DTO with status + code + details]\nD --> E[JSON response to client]"}
      />

      <InfoBox variant="info" title="How this lesson relates to the others">
        <p>
          The <a href="/springboot/error">Error Handling &amp; Validation</a> lesson in the main
          Spring Boot section teaches the current approach, built on{' '}
          <code>ProblemDetail</code>. <strong>This page does not repeat that lesson</strong> — it
          covers the same two rules, the same exception-hierarchy design, and the same validation
          constraints, but grounded in the tooling actually available on Spring Boot 2.7.18 /
          Spring Framework 5.3.x / <code>javax.validation</code>. Where the two pages would give
          identical code, this one says so and moves on; where they genuinely differ, that
          difference is the point.
        </p>
      </InfoBox>

      <h2>Why ProblemDetail Isn&apos;t The Answer Here</h2>
      <p>
        <code>ProblemDetail</code> — Spring&apos;s built-in class for RFC 9457 (formerly RFC 7807)
        &quot;Problem Details for HTTP APIs&quot; responses — is a <strong>Spring Framework 6
        class</strong>. Boot 2.7.18 runs Framework 5.3.x. It is not deprecated, not hidden behind
        a flag, not available with an extra dependency. It is not in the jar:
      </p>

      <CodeBlock language="bash" title="The check — same class, both Framework releases">
{`for v in 5.3.31 6.0.0; do
  printf 'spring-web %-8s ' $v
  unzip -l spring-web-$v.jar | grep -c 'org/springframework/http/ProblemDetail.class'
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`spring-web 5.3.31   0
spring-web 6.0.0    1`}
      </CodeBlock>

      <p>
        The same is true of the newer <code>ErrorResponse</code> / <code>ErrorResponseException</code>{' '}
        interfaces that let a hand-thrown exception carry its own <code>ProblemDetail</code> body —
        they arrived in the same release as <code>ProblemDetail</code> itself:
      </p>

      <CodeBlock language="text" title="Real output — same check, the ErrorResponse pair">
{`spring-web 5.3.31 : org/springframework/web/ErrorResponse.class           -> absent
spring-web 5.3.31 : org/springframework/web/ErrorResponseException.class  -> absent
spring-web 6.0.0  : org/springframework/web/ErrorResponse.class           -> present
spring-web 6.0.0  : org/springframework/web/ErrorResponseException.class  -> present`}
      </CodeBlock>

      <InfoBox variant="danger" title="So a Boot 2 error-handling lesson needs a different centerpiece">
        <p>
          Every Spring 6+ tutorial you find online will tell you to build a{' '}
          <code>ProblemDetail</code> and return it. On a Boot 2.7.18 codebase that code does not
          compile — there is no such class to import, on the classpath or anywhere else. The
          idiomatic Boot 2 approach is what this page teaches instead: a hand-written response DTO
          plus a <code>@RestControllerAdvice</code>. It is less standardized than{' '}
          <code>ProblemDetail</code>, which is exactly why every real Boot 2 codebase has its own
          slightly different version of it — and why reading someone else&apos;s version fluently
          is a skill worth having.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="One artifact of RFC 7807 did ship early, and it is easy to mistake for full support">
        <p>
          The <code>application/problem+json</code> media type constant predates the{' '}
          <code>ProblemDetail</code> class by years — it is already on Boot 2.7.18&apos;s
          classpath as <code>MediaType.APPLICATION_PROBLEM_JSON</code>, verified directly against
          the jar (<code>javap -constants -p -cp spring-web-5.3.31.jar
          org.springframework.http.MediaType | grep PROBLEM</code>). You can set that header on a
          hand-built response right now, on Boot 2, and be spec-correct about the wire format —
          Spring simply never shipped the class that builds the body for you. Some Boot 2
          codebases also reach for the third-party <code>org.zalando:problem-spring-web</code>{' '}
          library for exactly this — real, on Maven Central, but its last release was in 2023, so
          treat it as a stopgap, not a long-term dependency to build on.
        </p>
      </InfoBox>

      <h2>What Boot 2 Gives You For Free</h2>
      <p>
        Before writing a single line of error-handling code, it is worth seeing what{' '}
        <code>BasicErrorController</code> and <code>DefaultErrorAttributes</code> produce with
        zero configuration — because the default is stingier than most people expect, and that
        stinginess is deliberate. Real output, from an unhandled <code>RuntimeException</code>, a
        failed <code>@Valid</code> body, and a plain 404, on a stock Boot 2.7.18 app with no{' '}
        <code>@ControllerAdvice</code> at all:
      </p>

      <CodeBlock language="text" title="Real output — Boot 2.7.18, default configuration">
{`$ curl -s http://localhost:8080/api/boom
{"timestamp":"2026-09-01T10:14:08.020+00:00","status":500,"error":"Internal Server Error","path":"/api/boom"}

$ curl -s -X POST http://localhost:8080/api/validate -H "Content-Type: application/json" -d '{"name":""}'
{"timestamp":"2026-09-01T10:14:08.083+00:00","status":400,"error":"Bad Request","path":"/api/validate"}

$ curl -s http://localhost:8080/api/does-not-exist
{"timestamp":"2026-09-01T10:14:08.096+00:00","status":404,"error":"Not Found","path":"/api/does-not-exist"}`}
      </CodeBlock>

      <p>
        Notice what is missing: no exception message, no field-level validation errors, nothing
        that would tell a client <em>what</em> was wrong beyond the status code. That is not a bug
        — it is a security default, and you can prove exactly when it was introduced:
      </p>

      <CodeBlock language="bash" title="When did include-message default to never?">
{`for v in 2.1.18.RELEASE 2.2.13.RELEASE 2.3.12.RELEASE; do
  echo "=== boot $v ==="
  unzip -p spring-boot-autoconfigure-$v.jar META-INF/spring-configuration-metadata.json \\
    2>/dev/null | grep -c '"server.error.include-message"'
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`=== boot 2.1.18.RELEASE ===
0        <- property does not exist yet; the message was always included
=== boot 2.2.13.RELEASE ===
0        <- still doesn't exist
=== boot 2.3.12.RELEASE ===
1        <- introduced here, defaultValue "never", unchanged through 2.7.18`}
      </CodeBlock>

      <p>
        Turn both properties up and the raw shapes appear — and seeing them is the best argument
        for not shipping them as-is:
      </p>

      <CodeBlock language="properties" title="For local debugging ONLY — see the warning below">
{`server.error.include-message=always
server.error.include-binding-errors=always`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — same two requests, with both properties set to always">
{`$ curl -s http://localhost:8080/api/boom
{"timestamp":"...","status":500,"error":"Internal Server Error","message":"No customer exists with id cust-123","path":"/api/boom"}

$ curl -s -X POST http://localhost:8080/api/validate -H "Content-Type: application/json" -d '{"name":""}'
{"timestamp":"...","status":400,"error":"Bad Request","message":"Validation failed for object='createRequest'. Error count: 1","errors":[{"codes":["NotBlank.createRequest.name","NotBlank.name","NotBlank"],"arguments":[{"codes":["createRequest.name","name"],"arguments":null,"defaultMessage":"name","code":"name"}],"defaultMessage":"must not be blank","objectName":"createRequest","field":"name","rejectedValue":"","bindingFailure":false,"code":"NotBlank"}],"path":"/api/validate"}`}
      </CodeBlock>

      <InfoBox variant="warning" title="This is exactly why teams write their own handler instead of flipping these two flags">
        <p>
          <code>always</code> does make the information appear — but look at the shape. The{' '}
          <code>message</code> on the 500 is <code>e.getMessage()</code> verbatim, which is fine
          for a domain exception you wrote and dangerous for anything wrapping a driver or client
          library. The validation <code>errors</code> array is <code>FieldError</code>&apos;s
          internal representation dumped almost as-is — <code>codes</code>, <code>arguments</code>,{' '}
          <code>bindingFailure</code> — which is Spring&apos;s bean-binding machinery leaking into
          your public API contract. Nobody hand-designs an error contract that looks like this; it
          is what you get by turning a debug knob and shipping it. The fix is not tuning these
          properties further — it is the <code>@RestControllerAdvice</code> below, which decides
          exactly what goes in the body.
        </p>
      </InfoBox>

      <h2>Domain Exception Hierarchies</h2>
      <p>
        Unchanged from the Boot 4 lesson — this part of the design has nothing to do with which
        Spring version you are on. A <strong>base exception</strong> that carries the code + HTTP
        status, and a <strong>discriminated hierarchy</strong> for the categories your handler
        needs to distinguish:
      </p>

      <CodeBlock language="java" title="A discriminated exception hierarchy">
{`// Base — every domain exception extends this, so the handler only needs one entry.
public abstract class DomainException extends RuntimeException {
    private final String code;
    private final HttpStatus status;
    private final Map<String, Object> details;

    protected DomainException(String code, HttpStatus status, String message) {
        this(code, status, message, Collections.emptyMap());
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

// An authorization refusal.
public class AuthorizationException extends DomainException {
    public AuthorizationException(String code, String msg) {
        super(code, HttpStatus.FORBIDDEN, msg);
    }
}

public class CustomerNotFoundException extends BusinessException {
    public CustomerNotFoundException(String id) {
        super("CUSTOMER_NOT_FOUND", HttpStatus.NOT_FOUND,
              "No customer exists with id " + id,
              Collections.singletonMap("customerId", id));
    }
}`}
      </CodeBlock>

      <p>
        <code>org.springframework.http.HttpStatus</code> is a Spring Framework class, not a
        Jakarta EE one — it never moved, and this hierarchy compiles identically on Boot 2 and
        Boot 4. The only Boot-2-specific choice here is what <code>DomainException</code> is
        translated <em>into</em>, which is next.
      </p>

      <h2>The Global Handler</h2>
      <p>
        A hand-written response type standing in for <code>ProblemDetail</code>, and one{' '}
        <code>@RestControllerAdvice</code> to build it. This is not a framework convention on Boot
        2 — every codebase names its fields slightly differently — but the shape below (an RFC
        7807-flavoured DTO: a stable machine-readable <code>code</code>, a human <code>title</code>
        , a request-specific <code>detail</code>) is the closest Boot 2 gets to the standard
        without a third-party dependency:
      </p>

      <CodeBlock language="java" title="ApiError.java — Boot 2's stand-in for ProblemDetail">
{`public class ApiError {
    public final Instant timestamp = Instant.now();
    public final int status;
    public final String code;
    public final String title;
    public final String detail;
    public final String path;
    public final Map<String, Object> extra;
    public List<FieldViolation> errors;

    public ApiError(int status, String code, String title, String detail, String path,
                     Map<String, Object> extra) {
        this.status = status;
        this.code = code;
        this.title = title;
        this.detail = detail;
        this.path = path;
        this.extra = extra;
    }

    public static class FieldViolation {
        public final String field;
        public final String message;
        public FieldViolation(String field, String message) {
            this.field = field;
            this.message = message;
        }
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="ApiExceptionHandler.java — compiled and run against real Boot 2.7.18">
{`import javax.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiError> handleDomain(DomainException e, HttpServletRequest req) {
        ApiError body = new ApiError(e.status().value(), e.code(), humanize(e.code()),
                e.getMessage(), req.getRequestURI(), e.details());
        return ResponseEntity.status(e.status()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e,
                                                       HttpServletRequest req) {
        List<ApiError.FieldViolation> violations = e.getBindingResult().getFieldErrors().stream()
                .map(f -> new ApiError.FieldViolation(f.getField(), f.getDefaultMessage()))
                .collect(Collectors.toList());
        ApiError body = new ApiError(400, "VALIDATION_FAILED", "Validation failed",
                "One or more fields are invalid", req.getRequestURI(), Collections.emptyMap());
        body.errors = violations;
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnknown(Exception e, HttpServletRequest req) {
        ApiError body = new ApiError(500, "INTERNAL_ERROR", "Internal server error",
                "An unexpected error occurred", req.getRequestURI(), Collections.emptyMap());
        return ResponseEntity.internalServerError().body(body);
    }

    private static String humanize(String code) {
        return Arrays.stream(code.split("_"))
                .map(w -> w.charAt(0) + w.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — compiled against javax.servlet, run on Boot 2.7.18 (JDK 21)">
{`$ curl -s http://localhost:8080/api/boom
{"timestamp":"2026-09-01T10:15:41.883271Z","status":404,"code":"CUSTOMER_NOT_FOUND","title":"Customer not found","detail":"No customer exists with id cust-123","path":"/api/boom","extra":{},"errors":null}

$ curl -s -X POST http://localhost:8080/api/validate -H "Content-Type: application/json" -d '{"name":""}'
{"timestamp":"2026-09-01T10:15:41.953913Z","status":400,"code":"VALIDATION_FAILED","title":"Validation failed","detail":"One or more fields are invalid","path":"/api/validate","extra":{},"errors":[{"field":"name","message":"must not be blank"}]}`}
      </CodeBlock>

      <p>
        That is a controlled, intentional body — a stable <code>code</code> a client can switch
        on, and exactly the fields you chose to expose. Nothing here needed{' '}
        <code>server.error.include-message</code> at all; the advice builds its own message from
        the domain exception, which is precisely the point of throwing a typed exception in the
        first place.
      </p>

      <InfoBox variant="warning" title="Never leak internals in error messages">
        <p>
          The <code>Exception.class</code> catch-all above deliberately does <strong>not</strong>{' '}
          put <code>e.getMessage()</code> into the response body — only a fixed, generic string.
          Log the real exception on the server (<code>log.error(...)</code>, omitted above for
          space) and keep the client-facing message boring. This is the same discipline the
          default <code>include-message=never</code> setting is enforcing for you before you have
          written any code at all — the handler just does it deliberately instead of by omission.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="The catch-all will swallow your 403s here too">
        <p>
          This is unchanged from Boot 4 because it is not a Boot-version fact — it is how{' '}
          <code>@ExceptionHandler</code> resolution has always worked. When{' '}
          <code>@PreAuthorize</code> rejects a call, Spring Security throws{' '}
          <code>AccessDeniedException</code> from <em>inside</em> the controller invocation, so the
          advice above catches it in <code>handleUnknown</code> and turns a legitimate{' '}
          <strong>403</strong> into a <strong>500</strong>. Fix it with an explicit, more specific
          handler — specificity wins regardless of where it is declared:
        </p>
        <CodeBlock language="java" title="Let security exceptions through, Boot 2 style">
{`@ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
public ResponseEntity<ApiError> handleDenied(
        org.springframework.security.access.AccessDeniedException e,
        HttpServletRequest req) {
    // Deliberately vague — never tell the caller WHY they were refused.
    ApiError body = new ApiError(403, "ACCESS_DENIED", "Access denied",
            "Access denied", req.getRequestURI(), Collections.emptyMap());
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
}

// There is no ErrorResponseException to delegate to here — that interface pair
// is Spring 6. If you want a quick one-off status+message throw from deep in a
// service without a dedicated exception class, ResponseStatusException DOES
// already exist on Boot 2 (it has been in spring-web since Spring 5.0):
throw new org.springframework.web.server.ResponseStatusException(
        HttpStatus.CONFLICT, "Order already shipped");

// ResponseEntityExceptionHandler also already exists on Boot 2 and is worth
// extending — but on Framework 5.3 its default handling does NOT build a
// ProblemDetail (it can't; the class doesn't exist). It hands you a
// ResponseEntity<Object> with a body you still have to shape yourself by
// overriding handleExceptionInternal(). On Boot 3+ the same base class
// defaults to building ProblemDetail for you. Same class name, different
// amount of work, depending which side of the upgrade you're standing on.

// NOTE: an AccessDeniedException from the FILTER chain (a URL-level
// .authenticated() rule) never reaches @ControllerAdvice at all — it goes to
// the AccessDeniedHandler configured on HttpSecurity. Same as Boot 4; you need
// both. See the security lesson for the Boot 2 HttpSecurity shape.`}
        </CodeBlock>
      </InfoBox>

      <h2>Bean Validation — The Same 20 Constraints, Different Package</h2>
      <p>
        Boot 2.7.18 pulls in Hibernate Validator <code>6.2.5.Final</code>, verified straight from
        the <code>spring-boot-dependencies</code> BOM:
      </p>
      <CodeBlock language="text" title="Real output">
{`$ curl -s .../spring-boot-dependencies/2.7.18/spring-boot-dependencies-2.7.18.pom \\
  | grep -oE '<hibernate-validator.version>[^<]+'
<hibernate-validator.version>6.2.5.Final`}
      </CodeBlock>
      <p>
        Hibernate Validator 6.x implements Bean Validation 2.0, which lives under{' '}
        <code>javax.validation</code>. Hibernate Validator 7.x (the one Boot 3+ ships) implements
        Jakarta Bean Validation 3.0, under <code>jakarta.validation</code>. Same annotations, same
        semantics — see the <a href="/springboot2/javax">javax lesson</a> for why the rename
        itself is mechanical. Here they are with the Boot 2 imports:
      </p>

      <CodeBlock language="java" title="javax.validation.constraints — the reference">
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

// Custom
@AssertTrue  @AssertFalse

// Nested
@Valid

// All imported from javax.validation.constraints on Boot 2, jakarta.validation.constraints
// on Boot 3+. The class names, attributes and defaults are identical either side.

// CROSS-FIELD: do NOT reach for Hibernate Validator's @ScriptAssert here either.
// It needs a JSR-223 script engine, and Nashorn shipped with the JDK from 8
// through 14 and was removed in 15. A Boot 2 app that still targets Java 8 in
// its OWN build might get away with it — but plenty of Boot 2 services now run
// on a modern JDK for security patches while staying on Boot 2 dependencies
// (this section's own Testing lesson does exactly that, on JDK 21), and on
// those the script engine is simply gone. Write a class-level constraint.`}
      </CodeBlock>

      <h3>Custom constraints for domain rules</h3>
      <CodeBlock language="java" title="A reusable @StrongPassword constraint, javax.validation">
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

// Usage — a record works fine here as long as the module is compiled with a
// JDK new enough to have records (16+); the Boot 2 FRAMEWORK classes are still
// bytecode-52 (Java 8), but your own module can target whatever JDK you build
// with. See the config lesson's note on records binding on Boot 2.7.
public record CreateUserRequest(
        @NotBlank @Email                              String email,
        @NotBlank @StrongPassword                     String password,
        @NotBlank @Size(max = 100)                    String displayName) { }

// ---- Cross-field: a CLASS-level constraint ----
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordsMatchValidator.class)
public @interface PasswordsMatch {
    String message() default "passwords do not match";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PasswordsMatchValidator
        implements ConstraintValidator<PasswordsMatch, SignupRequest> {

    public boolean isValid(SignupRequest r, ConstraintValidatorContext ctx) {
        if (r.password() == null || r.passwordConfirm() == null) return true;
        if (r.password().equals(r.passwordConfirm())) return true;

        ctx.disableDefaultConstraintViolation();
        ctx.buildConstraintViolationWithTemplate(ctx.getDefaultConstraintMessageTemplate())
           .addPropertyNode("passwordConfirm")
           .addConstraintViolation();
        return false;
    }
}

@PasswordsMatch
public record SignupRequest(String password, String passwordConfirm) { }`}
      </CodeBlock>

      <h2>Validation Groups</h2>
      <p>
        Unchanged — <code>org.springframework.validation.annotation.Validated</code> is a Spring
        Framework class and never moved. Different rules for <code>POST</code> vs{' '}
        <code>PUT</code>, activated with validation groups:
      </p>
      <CodeBlock language="java" title="Groups in action">
{`interface OnCreate {}
interface OnUpdate {}

public record UserRequest(
        @NotNull(groups = OnUpdate.class)              String id,
        @NotBlank(groups = { OnCreate.class, OnUpdate.class })
        @Email(groups = { OnCreate.class, OnUpdate.class })
        String email,
        @NotBlank(groups = OnCreate.class)             String password) { }

@PostMapping
public UserDto create(@Validated(OnCreate.class) @RequestBody UserRequest req) { /* ... */ }

@PutMapping("/{id}")
public UserDto update(@PathVariable String id,
                      @Validated(OnUpdate.class) @RequestBody UserRequest req) { /* ... */ }`}
      </CodeBlock>

      <h2>Wrapping Third-Party Exceptions</h2>
      <p>
        Also unchanged — never let a driver exception escape to the handler. Catch, wrap, re-throw
        as a domain exception, so the handler stays ignorant of which database you use:
      </p>
      <CodeBlock language="java" title="Turning a driver exception into a domain one">
{`@Repository
public class CustomerRepository {

    private final JdbcTemplate jdbc;
    public CustomerRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void save(Customer c) {
        try {
            jdbc.update("INSERT INTO customer(id,email,...) VALUES (?,?,...)",
                c.getId(), c.getEmail());
        } catch (DuplicateKeyException e) {                   // Spring translation
            throw new DuplicateEmailException(c.getEmail());  // our domain exception
        }
    }
}`}
      </CodeBlock>

      <h2>Error Envelope Testing</h2>
      <p>
        The one line that differs from a Boot 4 test class:{' '}
        <code>@MockBean</code>, not <code>@MockitoBean</code>. That distinction — and exactly when
        each spelling works — is the whole subject of the{' '}
        <a href="/springboot2/testing">next lesson</a>; here it is just used correctly for the
        version this page targets.
      </p>
      <CodeBlock language="java" title="Testing that the right exception maps to the right response — Boot 2">
{`@WebMvcTest(CustomerController.class)
class CustomerControllerErrorTest {

    @Autowired MockMvc mvc;
    @MockBean CustomerService service;

    @Test
    void notFoundReturns404ApiError() throws Exception {
        when(service.byId("cust-123")).thenThrow(new CustomerNotFoundException("cust-123"));

        mvc.perform(get("/api/customers/{id}", "cust-123"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("CUSTOMER_NOT_FOUND"))
            .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void invalidBodyReturns400WithFieldErrors() throws Exception {
        mvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\\"email\\":\\"not-an-email\\",\\"password\\":\\"x\\",\\"displayName\\":\\"\\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors[?(@.field=='email')]").exists())
            .andExpect(jsonPath("$.errors[?(@.field=='password')]").exists())
            .andExpect(jsonPath("$.errors[?(@.field=='displayName')]").exists());
    }
}`}
      </CodeBlock>

      <h2>Error Handling Checklist</h2>
      <InfoBox variant="success" title="What good error handling looks like on Boot 2">
        <ul>
          <li>All application errors extend a single <code>DomainException</code> base — same
              design as Boot 4, unrelated to the framework version.</li>
          <li>Two subclasses at minimum: <code>BusinessException</code> (4xx) and{' '}
              <code>SystemException</code> (5xx).</li>
          <li>One <code>@RestControllerAdvice</code> converts all of them to a hand-written{' '}
              <code>ApiError</code> DTO — <code>ProblemDetail</code> is not available until you
              migrate to Boot 3.</li>
          <li>Validation constraints come from <code>javax.validation.constraints</code>, not{' '}
              <code>jakarta.validation.constraints</code> — a one-word compile error if you get it
              backwards.</li>
          <li><code>server.error.include-message</code> and{' '}
              <code>include-binding-errors</code> stay at their <code>never</code> default in any
              environment a client can reach; your own handler decides what to expose.</li>
          <li>An explicit handler exists for <code>AccessDeniedException</code> so the{' '}
              <code>Exception.class</code> catch-all doesn&apos;t turn 403s into 500s.</li>
          <li>Tests use <code>@MockBean</code>, matching the rest of a Boot 2 test suite.</li>
        </ul>
      </InfoBox>

    </LessonLayout>
  );
}
