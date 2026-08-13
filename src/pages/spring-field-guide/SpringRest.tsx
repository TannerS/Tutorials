import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringRest() {
  return (
    <PosterLayout
      accent="emerald"
      eyebrow="Spring Boot 4 · Field Reference"
      title="Spring REST & Validation"
      tagline="Controllers, request binding, Bean Validation, and the throw-at-the-fault-line error-handling pattern — condensed for offline study."
      meta={['Spring Boot 4', '12 patterns']}
      footerLabel="Personal study reference — Spring Boot"
      pageLabel="Spring Field Guide · REST & Validation"
      prev={{ path: '/spring-field-guide/spring-di', label: 'Spring DI & Beans' }}
      next={{ path: '/spring-field-guide/error-handling', label: 'Error Handling & Validation' }}
    >
      <PosterCard
        glyph="Rc"
        title={<>@RestController<span className="dim"> + request mapping</span></>}
        language="java"
        code={`@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public UserDto get(@PathVariable UUID id) { }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto create(@Valid @RequestBody CreateUserRequest req) { }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { }
}`}
        caption="@RestController = @Controller + @ResponseBody — every return value serializes straight to the response body via Jackson, no view resolution."
      />

      <PosterCard
        glyph="Bd"
        title={<>Request-binding<span className="dim"> annotations</span></>}
        language="java"
        code={`@GetMapping("/orders/{orderId}")           // URL segment
public OrderDto get(@PathVariable UUID orderId) { }

@GetMapping("/search")                       // query string
public List<Product> search(
    @RequestParam String q,
    @RequestParam(defaultValue = "20") int limit) { }

@PostMapping
public OrderDto place(@RequestBody @Valid PlaceOrderRequest req) { }

@GetMapping("/me")                           // header
public UserDto me(@RequestHeader("X-Client-Version") String v) { }`}
        caption="These four annotations — PathVariable, RequestParam, RequestBody, RequestHeader — cover roughly 95% of endpoint signatures."
      />

      <PosterCard
        glyph="Rp"
        title={<>Composite params<span className="dim"> — the record trick</span></>}
        language="java"
        code={`public record ProductFilter(
        String q, String category,
        BigDecimal minPrice, BigDecimal maxPrice,
        int page, int size) { }

@GetMapping("/products")
public Page<ProductDto> list(@ModelAttribute ProductFilter filter) {
    // ?q=chair&category=furniture&minPrice=100
    // -> populates ProductFilter by field name
    return catalog.search(filter);
}`}
        caption="Don't annotate a long list of query params individually. Bind them into a record with @ModelAttribute for a cleaner signature and an easily testable type."
      />

      <PosterCard
        glyph="Bv"
        title={<>Bean Validation<span className="dim"> — the constraints you'll use</span></>}
        language="java"
        code={`@NotNull  @NotBlank  @NotEmpty     // presence
@Min(1)  @Max(999)  @Positive       // numbers
@Digits(integer = 10, fraction = 2)
@Size(min = 8, max = 128)           // strings
@Pattern(regexp = "^[A-Z0-9-]+$")
@Email
@Past  @Future                      // dates
@Valid                              // recurse into nested object`}
        caption="Bean Validation checks the shape of input — length, format, presence. Business rules ('email already exists') belong in the service layer as domain exceptions, not in the DTO."
      />

      <PosterCard
        glyph="Va"
        title={<>Validated request DTO<span className="dim"> with @Valid</span></>}
        language="java"
        code={`public record CreateUserRequest(
        @NotBlank @Email             String email,
        @NotBlank @Size(min = 12)    String password,
        @NotBlank @Size(max = 100)   String displayName) { }

@PostMapping
public UserDto create(@Valid @RequestBody CreateUserRequest req) {
    return users.create(req);
}
// Failure -> MethodArgumentNotValidException -> your
// global handler converts it to a structured 400.`}
        caption="Combine @Valid on the parameter with Jakarta constraints on the DTO's record components — validation runs before your method body executes."
      />

      <PosterCard
        glyph="Re"
        title={<>ResponseEntity<span className="dim"> — full control</span></>}
        language="java"
        code={`@PostMapping("/orders")
public ResponseEntity<OrderDto> place(@Valid @RequestBody PlaceOrderRequest req) {
    OrderDto order = orderService.place(req);
    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}").buildAndExpand(order.id()).toUri();

    return ResponseEntity.created(location)
        .header("X-Trace-Id", TracingContext.current().traceId())
        .body(order);
}`}
        caption="Reach for ResponseEntity<T> when the status, headers, or Location URI depend on runtime logic — otherwise returning the DTO directly is enough."
      />

      <PosterCard
        glyph="?"
        title={<>Which return type<span className="dim"> by default?</span></>}
        language="text"
        code={`The DTO directly    -> normal 2xx; Spring defaults to 200
                        unless @ResponseStatus says otherwise.

ResponseEntity<T>   -> status/headers/location depend on
                        runtime logic at THIS endpoint.

Throw an exception  -> every error response. A
                        @RestControllerAdvice converts it —
                        never hand-roll an error DTO with an if.`}
        caption="Picking the wrong one is how error handling ends up scattered across controllers as ad hoc if-return blocks."
      />

      <PosterCard
        glyph="Pd"
        title={<>ProblemDetail<span className="dim"> — RFC 7807</span></>}
        language="json"
        code={`{
  "type": "https://api.example.com/errors/customer-not-found",
  "title": "Customer not found",
  "status": 404,
  "detail": "No customer exists with id 8f2b...",
  "code": "CUSTOMER_NOT_FOUND",
  "errors": [
    { "field": "email", "message": "must be a valid email" }
  ]
}`}
        caption="Spring 6's first-class error body type. Enable spring.mvc.problemdetails.enabled=true and uncaught MVC exceptions produce this shape automatically, no handler required."
      />

      <PosterCard
        glyph="Dx"
        title={<>Domain exception<span className="dim"> hierarchy</span></>}
        language="java"
        code={`public abstract class DomainException extends RuntimeException {
    private final String code;
    private final HttpStatus status;
    // carries code + status so the handler needs one entry
}

public abstract class BusinessException extends DomainException { }
    // 4xx — caller-actionable, client can fix and retry

public class SystemException extends DomainException {
    // 500 — page oncall, client can't help
}`}
        caption="A base exception carrying code + HttpStatus, plus a discriminated hierarchy, lets logging and metrics bucket by exception class instead of magic status codes."
      />

      <PosterCard
        glyph="Ad"
        title={<>@RestControllerAdvice<span className="dim"> — the global handler</span></>}
        language="java"
        code={`@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ProblemDetail> handleDomain(DomainException e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(
            e.status(), e.getMessage());
        p.setProperty("code", e.code());
        return ResponseEntity.status(e.status()).body(p);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(
            MethodArgumentNotValidException e) { /* 400 + field errors */ }
}`}
        caption="Throw at the fault line, translate once at the edge. One @RestControllerAdvice converts every domain exception into the right HTTP status and JSON body — controllers stay free of if-return error logic."
      />

      <PosterCard
        glyph="Wr"
        title={<>Wrapping third-party<span className="dim"> exceptions</span></>}
        language="java"
        code={`@Repository
public class CustomerRepository {
    public void save(Customer c) {
        try {
            jdbc.update("INSERT INTO customer ...", c.id(), c.email());
        } catch (DuplicateKeyException e) {       // Spring translation
            throw new DuplicateEmailException(c.email());  // domain
        }
    }
}`}
        caption="Never let a driver exception (JDBC, HTTP client) escape to the handler. Catch it at the repository/client boundary and re-throw as a domain exception."
      />

      <PosterCard
        glyph="St"
        title={<>Common HTTP status<span className="dim"> codes</span></>}
        language="text"
        code={`200 OK              successful GET/PUT/PATCH
201 Created         POST that created a resource (+ Location)
204 No Content       successful DELETE, no body
400 Bad Request      malformed body / failed validation
401 Unauthorized     NOT authenticated (misnamed — it means
                     "unauthenticated"); send a WWW-Authenticate
403 Forbidden        authenticated but not authorized
404 Not Found        resource doesn't exist
409 Conflict         duplicate / concurrent-write conflict
422 Unprocessable    valid shape, failed a business rule
500 Internal Error   unhandled — log full stack, hide details`}
        caption="Pick the status by what actually happened, not habit. 422 vs 400 is the one people get wrong most: 400 is malformed input, 422 is well-formed input that violates a business rule."
      />

      <PosterQuickRef
        title="Which REST tool do I need?"
        rows={[
          { need: 'Bind a URL segment', answer: '@PathVariable' },
          { need: 'Bind a query param', answer: '@RequestParam' },
          { need: 'Bind the JSON body', answer: '@RequestBody + @Valid' },
          { need: 'Many query params', answer: '@ModelAttribute into a record' },
          { need: 'Status depends on logic', answer: 'ResponseEntity<T>' },
          { need: 'Any error response', answer: 'Throw a domain exception, never return an error DTO' },
          { need: 'Structured error body', answer: 'ProblemDetail (RFC 7807)' },
          { need: 'Centralize error mapping', answer: '@RestControllerAdvice + @ExceptionHandler' },
          { need: 'Driver exception leaked', answer: 'Catch at repository boundary, wrap as domain exception' },
          { need: 'Malformed vs business-rule error', answer: '400 for shape, 422 for a violated rule' },
        ]}
      />
    </PosterLayout>
  );
}
