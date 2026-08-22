import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringErrorHandling() {
  return (
    <PosterLayout
      accent="emerald"
      eyebrow="Spring Boot 4 · Field Reference"
      title="Error Handling & Validation"
      tagline="Custom constraints, validation groups, and the handler methods that turn every failure mode into a structured ProblemDetail — condensed for offline study."
      meta={['Spring Boot 4', '11 patterns']}
      footerLabel="Personal study reference — Spring Boot"
      pageLabel="Spring Field Guide · Error Handling & Validation"
      prev={{ path: '/spring-field-guide/spring-rest', label: 'Spring REST & Validation' }}
      next={{ path: '/spring-field-guide/spring-data', label: 'Spring Data & JPA' }}
    >
      <PosterCard
        glyph="Ru"
        title={<>Two rules<span className="dim"> of good error handling</span></>}
        language="text"
        code={`1. Throw at the fault line.
   The service/repository that discovers the problem raises
   a well-typed exception. It doesn't know or care about HTTP.

2. Translate once at the edge.
   One @RestControllerAdvice converts every domain exception
   into the right HTTP status + JSON body.

Anything else (if-return in controllers, Optional<Error>,
boolean success flags) leaks error handling into every layer.`}
        caption="This is the organizing principle behind every card below — controllers and services stay free of error-response logic; only the advice class knows about HTTP."
      />

      <PosterCard
        glyph="Sp"
        title={<>Custom constraint<span className="dim"> — @StrongPassword</span></>}
        language="java"
        code={`@Target({ FIELD, PARAMETER })
@Retention(RUNTIME)
@Constraint(validatedBy = StrongPasswordValidator.class)
public @interface StrongPassword {
    String message() default "password too weak";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    int minLength() default 12;
}

public class StrongPasswordValidator
        implements ConstraintValidator<StrongPassword, String> {
    private int minLength;
    public void initialize(StrongPassword a) { minLength = a.minLength(); }
    public boolean isValid(String v, ConstraintValidatorContext ctx) {
        if (v == null) return true;   // let @NotNull handle null
        return v.length() >= minLength
            && v.chars().anyMatch(Character::isDigit)
            && v.chars().anyMatch(Character::isUpperCase);
    }
}`}
        caption="A business rule that Jakarta's built-in constraints can't express (password strength, domain-specific formats) becomes a reusable annotation instead of duplicated if-logic in every DTO."
      />

      <PosterCard
        glyph="Gr"
        title={<>Validation groups<span className="dim"> — different rules per operation</span></>}
        language="java"
        code={`interface OnCreate {}
interface OnUpdate {}

public record UserRequest(
        @NotNull(groups = OnUpdate.class)         UUID id,
        @NotBlank(groups = { OnCreate.class, OnUpdate.class })
        @Email(groups = { OnCreate.class, OnUpdate.class })
        String email,
        @NotBlank(groups = OnCreate.class)        String password) { }

@PostMapping
UserDto create(@Validated(OnCreate.class) @RequestBody UserRequest r) { }

@PutMapping("/{id}")
UserDto update(@Validated(OnUpdate.class) @RequestBody UserRequest r) { }`}
        caption="One DTO, two validation profiles — POST doesn't require an id, PUT does; PUT doesn't require a password, POST does. Beats maintaining two near-duplicate request records."
      />

      <PosterCard
        glyph="Ma"
        title={<>MethodArgumentNotValidException<span className="dim"> — field errors</span></>}
        language="java"
        code={`@ExceptionHandler(MethodArgumentNotValidException.class)
ResponseEntity<ProblemDetail> handleValidation(
        MethodArgumentNotValidException e, HttpServletRequest req) {
    var errors = e.getBindingResult().getFieldErrors().stream()
        .map(f -> Map.of("field", f.getField(),
                         "message", f.getDefaultMessage()))
        .toList();
    ProblemDetail p = ProblemDetail.forStatusAndDetail(
        HttpStatus.BAD_REQUEST, "One or more fields are invalid");
    p.setProperty("code", "VALIDATION_FAILED");
    p.setProperty("errors", errors);
    return ResponseEntity.badRequest().body(p);
}`}
        caption="This is what actually fires when @Valid fails on a @RequestBody — walk getBindingResult().getFieldErrors() to build a per-field error list instead of one generic message."
      />

      <PosterCard
        glyph="Un"
        title={<>HttpMessageNotReadableException<span className="dim"> — malformed JSON</span></>}
        language="java"
        code={`// Body isn't even valid JSON — @Valid never runs, Jackson fails first.
@ExceptionHandler(HttpMessageNotReadableException.class)
ResponseEntity<ProblemDetail> handleUnreadable(
        HttpMessageNotReadableException e, HttpServletRequest req) {
    ProblemDetail p = ProblemDetail.forStatusAndDetail(
        HttpStatus.BAD_REQUEST, "Request body could not be parsed");
    p.setProperty("code", "MALFORMED_BODY");
    return ResponseEntity.badRequest().body(p);
}`}
        caption="A distinct exception type from MethodArgumentNotValidException — this fires on truncated JSON, wrong types, or a missing body entirely, before field-level validation ever gets a chance to run."
      />

      <PosterCard
        glyph="Ca"
        title={<>Catch-all handler<span className="dim"> — never leak internals</span></>}
        language="java"
        code={`@ExceptionHandler(Exception.class)
ResponseEntity<ProblemDetail> handleUnknown(
        Exception e, HttpServletRequest req) {
    log.error("Unhandled exception at {}", req.getRequestURI(), e);
    ProblemDetail p = ProblemDetail.forStatusAndDetail(
        HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    p.setProperty("code", "INTERNAL_ERROR");
    return ResponseEntity.internalServerError().body(p);
}`}
        caption="Log the full stack trace server-side, but never put e.getMessage() from an unknown exception into the client response — it can leak SQL fragments, file paths, or class names."
      />

      <PosterCard
        glyph="Az"
        title={<>AuthorizationException<span className="dim"> — split out on purpose</span></>}
        language="java"
        code={`// A refusal, not a business-rule failure — logged and handled
// differently, and the "why" is never leaked to the client.
public class AuthorizationException extends DomainException {
    public AuthorizationException(String code, String msg) {
        super(code, HttpStatus.FORBIDDEN, msg);
    }
}`}
        caption="Splitting authorization refusals out of BusinessException lets the handler log them at WARN (someone may be probing) instead of INFO, without special-casing status codes in the log call."
      />

      <PosterCard
        glyph="Lg"
        title={<>Log level by exception class<span className="dim"></span></>}
        language="java"
        code={`if (e instanceof SystemException) log.error("System error", e);
else if (e instanceof AuthorizationException)
                                  log.warn("Auth denied: {}", e.code());
else                              log.info("Business error: {}", e.code());`}
        caption="Class-based logging beats checking the HTTP status code — SystemException always pages oncall at ERROR, BusinessException is routine at INFO, no magic-number comparisons needed."
      />

      <PosterCard
        glyph="Pd"
        title={<>Enriching ProblemDetail<span className="dim"> beyond the basics</span></>}
        language="java"
        code={`ProblemDetail p = ProblemDetail.forStatusAndDetail(e.status(), e.getMessage());
p.setType(URI.create("https://api.example.com/errors/" + e.code().toLowerCase()));
p.setTitle(humanize(e.code()));
p.setInstance(URI.create(req.getRequestURI()));
p.setProperty("code", e.code());
e.details().forEach(p::setProperty);   // e.g. customerId, orderId`}
        caption="setType/setInstance/setProperty are what turn the bare RFC 9457 skeleton into something a client can branch logic on — a stable machine-readable code, not just a human title."
      />

      <PosterCard
        glyph="Te"
        title={<>Testing the error mapping<span className="dim"></span></>}
        language="java"
        code={`@WebMvcTest(CustomerController.class)
class CustomerControllerErrorTest {
    @Autowired MockMvc mvc;
    @MockitoBean CustomerService service;

    @Test
    void notFoundReturns404ProblemDetail() throws Exception {
        when(service.byId(id)).thenThrow(new CustomerNotFoundException(id));
        mvc.perform(get("/api/customers/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(content().contentType(APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.code").value("CUSTOMER_NOT_FOUND"));
    }
}`}
        caption="Every exception class deserves at least one slice test asserting the actual response shape — status, content type, and the machine-readable code, not just 'it returns something 4xx'."
      />

      <PosterCard
        glyph="Cf"
        title={<>Cross-field validation<span className="dim"> — a class-level constraint</span></>}
        language="java"
        code={`@Target(TYPE) @Retention(RUNTIME)          // TYPE, not FIELD
@Constraint(validatedBy = PasswordsMatchValidator.class)
public @interface PasswordsMatch {
    String message() default "passwords must match";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PasswordsMatchValidator
        implements ConstraintValidator<PasswordsMatch, SignupRequest> {
    public boolean isValid(SignupRequest r, ConstraintValidatorContext ctx) {
        if (r.password() == null || r.passwordConfirm() == null) return true;
        if (r.password().equals(r.passwordConfirm())) return true;
        ctx.disableDefaultConstraintViolation();      // attach to a FIELD so the
        ctx.buildConstraintViolationWithTemplate(ctx.getDefaultConstraintMessageTemplate())
           .addPropertyNode("passwordConfirm")        // client can highlight it
           .addConstraintViolation();
        return false;
    }
}

@PasswordsMatch
public record SignupRequest(
        @NotBlank String password,
        @NotBlank String passwordConfirm) { }`}
        caption="Field-level constraints can't compare two fields, so the comparison moves to a TYPE-level constraint whose validator receives the whole object. Avoid Hibernate's @ScriptAssert for this: it needs a JSR-223 engine, and Nashorn was REMOVED from the JDK in Java 15 — on Java 17/21 it throws unless you add GraalVM JS yourself, and evaluating a script against user input is a needless injection risk. Re-attaching the violation to a property node is what makes the error land on a field instead of the whole object."
      />

      <PosterQuickRef
        title="Which error-handling tool do I need?"
        rows={[
          { need: 'A business rule no built-in constraint covers', answer: 'Custom @Constraint + ConstraintValidator' },
          { need: 'Same DTO, different rules on create vs update', answer: 'Validation groups + @Validated(OnX.class)' },
          { need: '@Valid failed on a field', answer: 'MethodArgumentNotValidException handler' },
          { need: 'Body is not valid JSON at all', answer: 'HttpMessageNotReadableException handler' },
          { need: 'Truly unexpected exception', answer: 'Exception.class catch-all — log full, hide details' },
          { need: 'Authorization refusal vs business rule', answer: 'Separate AuthorizationException — logs at WARN' },
          { need: 'Log level should match severity', answer: 'Branch on exception class, not status code' },
          { need: 'Client needs a stable machine code', answer: 'ProblemDetail.setProperty("code", ...)' },
          { need: 'Compare two fields against each other', answer: 'TYPE-level @Constraint — not @ScriptAssert (no JDK script engine since Java 15)' },
          { need: 'Prove the mapping is correct', answer: '@WebMvcTest + jsonPath on the ProblemDetail body' },
        ]}
      />
    </PosterLayout>
  );
}
