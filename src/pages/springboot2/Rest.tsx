import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Rest() {
  return (
    <LessonLayout
      title="Building REST APIs"
      sectionId="springboot2"
      lessonIndex={3}
      prev={{ path: '/springboot2/di', label: 'Dependency Injection & IoC' }}
      next={{ path: '/springboot2/security', label: 'Security the Boot 2 Way' }}
    >
      <p>
        <code>@RestController</code> means what it has always meant: <code>@Controller</code> +{' '}
        <code>@ResponseBody</code>, every return value serialized through the{' '}
        <code>HttpMessageConverter</code> chain instead of resolved to a view. That has not moved
        between Boot 2.7 and Boot 4. What moved is one type you reach for constantly (bean
        validation constraints), one type that flatly doesn&apos;t exist yet
        (<code>ProblemDetail</code>), and one default that flipped quietly enough that most teams
        find out about it from a bug report, not a changelog.
      </p>

      <FlowChart
        title="Request lifecycle in Spring MVC — same shape, Boot 2.7 or Boot 4"
        chart={"graph TD\nA[HTTP Request] --> B[Servlet Filters]\nB --> C[DispatcherServlet]\nC --> D[HandlerMapping]\nD --> E[HandlerInterceptors: preHandle]\nE --> F[Controller Method]\nF --> G[Service Layer]\nG --> H[Repository / Client]\nH --> G\nG --> F\nF --> I[HandlerInterceptors: postHandle]\nI --> J[HttpMessageConverter]\nJ --> K[Response Filters]\nK --> L[HTTP Response]"}
      />

      <p>
        Every box in that diagram is the same class, doing the same job, on both versions. The
        <code>B</code> box — Servlet Filters — is the one place the diagram lies by omission: the{' '}
        <code>HttpServletRequest</code> flowing through it is <code>javax.servlet</code> on 2.7,
        not <code>jakarta.servlet</code>. That is fully covered in the{' '}
        <a href="/springboot2/javax">javax lesson</a> and not repeated here — this lesson assumes
        you&apos;ve read it.
      </p>

      <h2>Request Mapping — Same Annotations, javax Imports</h2>

      <CodeBlock language="java" title="A controller with the common surface — Boot 2.7">
{`import javax.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    // GET /api/users?status=active&page=0&size=20
    @GetMapping
    public Page<UserDto> list(
            @RequestParam(defaultValue = "ACTIVE") UserStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return users.list(status, pageable);
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public UserDto get(@PathVariable UUID id) {
        return users.byId(id);
    }

    // POST /api/users
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto create(@Valid @RequestBody CreateUserRequest req) {
        return users.create(req);
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public UserDto update(@PathVariable UUID id,
                          @Valid @RequestBody UpdateUserRequest req) {
        return users.update(id, req);
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        users.delete(id);
    }
}

// Every annotation here — @RestController, @RequestMapping, @GetMapping,
// @PathVariable, @RequestParam, @RequestBody, @ResponseStatus — lives in
// org.springframework.web.bind.annotation, which never moved. Compare to
// the Boot 4 version of this controller: the class body is identical
// except for one import line.`}
      </CodeBlock>

      <p>
        The five request-binding annotations — <code>@PathVariable</code>,{' '}
        <code>@RequestParam</code>, <code>@RequestBody</code>, <code>@RequestHeader</code>,{' '}
        <code>@CookieValue</code> — cover the same 95% of endpoints they always have, with the
        same behavior. The composite-parameter trick (<code>@ModelAttribute</code> onto a record
        or POJO for a large query-parameter set) works identically too.
      </p>

      <h2>Request-Body Validation — javax.validation, Not jakarta.validation</h2>

      <p>
        This is the single most common javax import you will hit while writing REST endpoints,
        and it is worth pinning the exact versions Boot 2.7.18 resolves rather than assuming:
      </p>

      <CodeBlock language="bash" title="Reading it straight out of the BOM">
{`curl -s https://repo1.maven.org/maven2/org/springframework/boot/spring-boot-dependencies/2.7.18/\\
spring-boot-dependencies-2.7.18.pom | grep -E 'jakarta-validation.version|hibernate-validator.version'`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`<jakarta-validation.version>2.0.2</jakarta-validation.version>
<hibernate-validator.version>6.2.5.Final</hibernate-validator.version>`}
      </CodeBlock>

      <InfoBox variant="warning" title="Same story as @PostConstruct: jakarta coordinate, javax package">
        <p>
          The artifact is <code>jakarta.validation:jakarta.validation-api:2.0.2</code> — but open
          it and the classes inside are still under <code>javax.validation</code>, confirmed the
          same way as the annotation API in the{' '}
          <a href="/springboot2/di">DI lesson</a>:
        </p>
        <CodeBlock language="text" title="Real output — unzip -l jakarta.validation-api-2.0.2.jar">
{`1056  08-10-2019 21:44   javax/validation/constraints/NotNull.class
 485  08-10-2019 21:44   javax/validation/Valid.class`}
        </CodeBlock>
        <p>
          Import <code>javax.validation.Valid</code> and{' '}
          <code>javax.validation.constraints.*</code> on Boot 2.7. Hibernate Validator{' '}
          6.2.5.Final is the engine actually evaluating the constraints underneath — a full major
          version behind the 8.x line Boot 4 ships, though the annotations themselves
          (<code>@NotBlank</code>, <code>@Size</code>, <code>@Pattern</code>, <code>@Positive</code>)
          have not changed meaning across that gap.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Validated request DTO — Boot 2.7 imports">
{`import javax.validation.Valid;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

import java.time.LocalDate;

public class CreateUserRequest {

    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 12, max = 128)
    private String password;

    @NotBlank @Size(max = 100)
    private String displayName;

    @Pattern(regexp = "^[a-z]{2}(-[A-Z]{2})?$")
    private String locale;

    @NotNull
    private LocalDate dateOfBirth;

    // getters/setters omitted — records are usable on 2.7 too if your build
    // targets Java 16+, but a plain shop still on Java 8/11 (the majority
    // of real Boot 2.7 deployments) writes this as an ordinary class.
}

// Nested validation still propagates through @Valid on the field —
// unchanged mechanism, javax annotations either way.
public class CreateOrderRequest {
    @NotNull
    private ShippingAddress shipping;

    @javax.validation.Valid
    private List<OrderItem> items;
}`}
      </CodeBlock>

      <h3>Where @Valid actually runs — the two-machine explanation still applies</h3>
      <p>
        &quot;<code>@Valid</code> validates the object&quot; is as incomplete a description on
        2.7 as it is anywhere else. The same two machines from Boot 4 exist on Framework 5.3,
        because neither is Boot-version-specific — they are Spring MVC / Spring AOP behavior that
        predates Boot 3 entirely.
      </p>

      <CodeBlock language="java" title="Machine 1 — the argument resolver (controllers). Reliable, always runs.">
{`@PostMapping
public UserDto create(@Valid @RequestBody CreateUserRequest req) { ... }

// RequestResponseBodyMethodProcessor deserializes with Jackson, then
// checks the parameter for an annotation whose simple name starts with
// "Valid" and runs the Validator BEFORE the method body. Failures become
// MethodArgumentNotValidException. This class and this behavior exist
// unchanged in spring-webmvc 5.3.31.`}
      </CodeBlock>

      <CodeBlock language="java" title="Machine 2 — the AOP proxy (everywhere else). Needs @Validated.">
{`// Compiles, reads correctly, validates NOTHING without @Validated on the class.
@Service
public class UserService {
    public void register(@Valid CreateUserRequest req) { ... }   // no-op
}

@Service
@Validated                                   // <- turns method validation on
public class UserService {
    public void register(@Valid CreateUserRequest req) { ... }   // now checked
}

// Same two consequences as on Boot 4: failures are
// ConstraintViolationException (not MethodArgumentNotValidException), and
// self-invocation bypasses the proxy exactly like @Transactional does.`}
      </CodeBlock>

      <h2>ProblemDetail Does Not Exist on Boot 2.7 — Plan Error Bodies Accordingly</h2>

      <p>
        This is the biggest REST-shaped gap between the two worlds, and it is a gap you cannot
        paper over with an import change. <code>org.springframework.http.ProblemDetail</code>{' '}
        (RFC 9457, formerly RFC 7807, support built into Spring itself) is a{' '}
        <strong>Spring Framework 6.0</strong>{' '}
        addition. It is not present at any point in the Framework 5.3 line:
      </p>

      <CodeBlock language="bash" title="The check">
{`echo "=== spring-web 5.3.31 (Boot 2.7.18) ==="
unzip -l spring-web-5.3.31.jar | grep -i ProblemDetail
echo "exit=$?"
echo "=== spring-web 6.0.14 (Boot 3.0.13) ==="
unzip -l spring-web-6.0.14.jar | grep -i ProblemDetail`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`=== spring-web 5.3.31 (Boot 2.7.18) ===
exit=1

=== spring-web 6.0.14 (Boot 3.0.13) ===
  6232  11-16-2023 13:58   org/springframework/http/ProblemDetail.class
  1473  11-16-2023 13:58   org/springframework/http/converter/json/ProblemDetailJacksonXmlMixin.class
   936  11-16-2023 13:58   org/springframework/http/converter/json/ProblemDetailJacksonMixin.class
  1700  11-16-2023 13:58   org/springframework/http/converter/json/ProblemDetailRuntimeHints.class`}
      </CodeBlock>

      <InfoBox variant="danger" title="What this means for a Boot 2 codebase's error handling">
        <p>
          If you&apos;ve read the main <a href="/springboot/error">Boot 4 error-handling
          lesson</a>&apos;s checklist item &quot;<code>ProblemDetail</code> for all 4xx/5xx
          bodies&quot; and gone looking for it in a Boot 2 service, stop looking — it genuinely
          is not there. Boot 2 codebases handle this one of three ways, and all three are correct
          for the version:
        </p>
        <ul>
          <li>
            A hand-rolled error DTO (commonly named <code>ApiError</code> or{' '}
            <code>ErrorResponse</code>) returned from a <code>@RestControllerAdvice</code>.
          </li>
          <li>
            <code>org.springframework.web.server.ResponseStatusException</code> — this one{' '}
            <em>does</em> exist on 5.3.31, thrown directly from a controller or service with a
            status and a reason, handled automatically without any custom advice code.
          </li>
          <li>
            A third-party library implementing RFC 7807 ahead of Spring doing it natively (Zalando&apos;s{' '}
            <code>problem-spring-web</code> was the common choice before Framework 6 made it
            built-in).
          </li>
        </ul>
        <p>
          None of these are wrong, and none of them are &quot;the old way that needs fixing&quot;
          before you&apos;ve actually decided to upgrade. Migrating error handling to{' '}
          <code>ProblemDetail</code> is Boot-3-and-later work — don&apos;t backport the shape of
          Boot 4&apos;s answer onto a service that is staying on 2.7.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="A representative Boot 2.7 error advice, using what's actually available">
{`@RestControllerAdvice
public class ApiErrorAdvice {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> notFound(ResourceNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ApiError(HttpStatus.NOT_FOUND.value(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> badRequest(MethodArgumentNotValidException e) {
        String detail = e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(new ApiError(400, detail));
    }
}

// A plain, hand-written shape — not RFC 7807, but a stable and entirely
// reasonable contract for a service staying on Boot 2.
public class ApiError {
    private final int status;
    private final String message;
    public ApiError(int status, String message) {
        this.status = status;
        this.message = message;
    }
    // getters omitted
}`}
      </CodeBlock>

      <h2>Response Control — ResponseEntity, Unchanged Mechanics</h2>

      <CodeBlock language="java" title="ResponseEntity for full control — Boot 2.7">
{`@PostMapping("/orders")
public ResponseEntity<OrderDto> place(@Valid @RequestBody PlaceOrderRequest req) {
    OrderDto order = orderService.place(req);

    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}")
        .buildAndExpand(order.getId())
        .toUri();

    return ResponseEntity
        .created(location)
        .header("X-Trace-Id", TracingContext.current().traceId())
        .body(order);
}

// ServletUriComponentsBuilder, WebRequest.checkNotModified, ResponseEntity's
// builder chain — none of this moved. The underlying request object it
// reads from is javax.servlet.http.HttpServletRequest, not exposed in this
// signature, so this method compiles character-for-character the same on
// both versions.`}
      </CodeBlock>

      <h2>Content Negotiation — Mostly Unchanged, One Thing Worth Flagging Early</h2>

      <p>
        Declaring <code>produces</code> per handler and letting Spring pick by{' '}
        <code>Accept</code> header works exactly as it does on Boot 4. One detail is worth
        knowing precisely because it is <em>not</em> a Boot 2 vs Boot 3 difference — it&apos;s a
        Boot 4 one, and finding out early saves confusion later:
      </p>

      <CodeBlock language="bash" title="Does MediaType.sortBySpecificityAndQuality exist on 5.3.31?">
{`unzip -p spring-web-5.3.31.jar org/springframework/http/MediaType.class > /tmp/MediaType.class
javap -p /tmp/MediaType.class | grep -i sortBySpecificity`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — present, on both 5.3.31 and 6.0.14">
{`public static void sortBySpecificity(java.util.List<org.springframework.http.MediaType>);
public static void sortBySpecificityAndQuality(java.util.List<org.springframework.http.MediaType>);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Don't front-load a worry that doesn't apply to your jump">
        <p>
          This utility is fully present and usable through Framework 5.3 <em>and</em> 6.0 alike —
          it is only removed starting Framework 7 (Boot 4). If your team&apos;s current project is
          the Boot 2 → Boot 3 migration, this specific removal is not on your list; it shows up
          two jumps later. It&apos;s a good example of why the{' '}
          <a href="/springboot2/intro">intro lesson</a>&apos;s &quot;three jumps, not one&quot;
          framing matters in practice — checking a Boot 4 changelog against a Boot 2 → 3 migration
          plan will surface changes that are real, but not yet relevant to the step you&apos;re on.
        </p>
      </InfoBox>

      <h2>Path Matching: The Trailing-Slash Default Actually Did Flip</h2>

      <p>
        Here is a genuine, easy-to-miss behavioral difference, and it is worth being precise about
        which release changed it, because two things moved independently and it is easy to
        conflate them.
      </p>

      <p>
        <strong>First, what did <em>not</em> change:</strong> Boot 2.7.18 already defaults to the
        modern <code>PathPatternParser</code> matching strategy, same as Boot 3/4. This is not a
        Boot 3 upgrade — it landed inside the 2.x line:
      </p>

      <CodeBlock language="bash" title="The check">
{`unzip -p spring-boot-autoconfigure-2.7.18.jar META-INF/spring-configuration-metadata.json \\
  | jq '.properties[] | select(.name == "spring.mvc.pathmatch.matching-strategy")'`}
      </CodeBlock>

      <CodeBlock language="json" title="Real output — Boot 2.7.18">
{`{
  "name": "spring.mvc.pathmatch.matching-strategy",
  "type": "org.springframework.boot.autoconfigure.web.servlet.WebMvcProperties$MatchingStrategy",
  "description": "Choice of strategy for matching request paths against registered mappings.",
  "sourceType": "org.springframework.boot.autoconfigure.web.servlet.WebMvcProperties$Pathmatch",
  "defaultValue": "path-pattern-parser"
}`}
      </CodeBlock>

      <p>
        <strong>What did change</strong> is a default inside <code>PathPatternParser</code>{' '}
        itself, between Framework 5.3 and Framework 6.0 — whether a mapping like{' '}
        <code>/api/orders</code> also matches a request for <code>/api/orders/</code>. Read
        straight out of each version&apos;s bytecode, at the exact constructor line that sets the
        field:
      </p>

      <CodeBlock language="bash" title="The check">
{`for jar in spring-web-5.3.31.jar spring-web-6.0.14.jar; do
  echo "=== $jar ==="
  unzip -p "$jar" org/springframework/web/util/pattern/PathPatternParser.class > /tmp/ppp.class
  javap -c -p /tmp/ppp.class | grep -A1 'putfield.*matchOptionalTrailingSeparator' | head -2
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the constructor sets a different default in each version">
{`=== spring-web 5.3.31 ===
   4: aload_0
   5: iconst_1                       <- TRUE. Trailing slash matches by default.
   6: putfield #2  // matchOptionalTrailingSeparator:Z

=== spring-web 6.0.14 ===
   4: aload_0
   5: iconst_0                       <- FALSE. Trailing slash does NOT match.
   6: putfield #7  // matchOptionalTrailingSeparator:Z`}
      </CodeBlock>

      <FlowChart
        title="Same URL, two versions, two outcomes"
        chart={"graph TD\nA[\"@GetMapping(\\\"/api/orders\\\")\"] --> B[\"Client requests GET /api/orders/ (trailing slash)\"]\nB --> C{\"Which Framework version?\"}\nC -->|\"5.3.x — Boot 2.7\"| D[\"Matches. 200 OK, same handler.\"]\nC -->|\"6.0.x+ — Boot 3/4\"| E[\"Does NOT match. 404.\"]\nstyle D fill:#1a3329,stroke:#4ade80\nstyle E fill:#3a1f1f,stroke:#f87171"}
      />

      <InfoBox variant="danger" title="Where this actually bites">
        <p>
          Nobody writes a test for the trailing-slash variant of every endpoint, so this rarely
          shows up in your own test suite. It shows up in <strong>API consumers</strong> — an
          older mobile client, a hand-written integration, an internal script — that happened to
          append a trailing slash and worked fine against your Boot 2 service for years. The exact
          same request against the upgraded Boot 3+ service returns a bare 404, with nothing in
          your logs pointing at &quot;path matching changed&quot; as the cause.
        </p>
        <p>
          If you are migrating a Boot 2 service with external consumers you don&apos;t control,
          check your access logs for trailing-slash requests before the cutover, not after.
        </p>
      </InfoBox>

      <h2>PUT vs PATCH, and Idempotency — No Version Dependency</h2>

      <p>
        The absent-vs-null ambiguity in naive PATCH deserialization, and the fix (
        <code>JsonNullable&lt;T&gt;</code>, or RFC 7386 JSON Merge Patch) are Jackson-level and
        HTTP-semantics-level concerns, not Spring-version concerns. They apply identically here.
      </p>

      <CodeBlock language="java" title="Making PATCH unambiguous — same fix, Boot 2.7">
{`// THE BUG: was 'nickname' omitted (leave it alone) or sent as null (clear it)?
public class UpdateUser {
    private String email;
    private String nickname;
    // Both {"email":"a@b.com"} and {"email":"a@b.com","nickname":null}
    // deserialize identically — nickname is null either way.
}

// FIX — JsonNullable from openapi-jackson-nullable. Same library, same
// group ID, works fine against the Jackson version Boot 2.7 bundles.
public class UpdateUser {
    private JsonNullable<String> email;
    private JsonNullable<String> nickname;
}

public void apply(User user, UpdateUser patch) {
    if (patch.getEmail().isPresent())    user.setEmail(patch.getEmail().get());
    if (patch.getNickname().isPresent()) user.setNickname(patch.getNickname().get());
}`}
      </CodeBlock>

      <h2>Interface-Driven HTTP Clients: What Boot 2.7 Actually Has</h2>

      <p>
        Boot 4&apos;s declarative <code>@HttpExchange</code> interfaces (backed by{' '}
        <code>RestClient</code> or <code>WebClient</code>) are a <strong>Spring Framework
        6.0</strong> feature. Neither the annotation nor <code>RestClient</code> exists on
        Framework 5.3:
      </p>

      <CodeBlock language="bash" title="The check">
{`unzip -l spring-web-5.3.31.jar | grep -i HttpExchange
echo "exit=$?"`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`exit=1
(no match)`}
      </CodeBlock>

      <p>
        On Boot 2.7 the standard synchronous client is <code>RestTemplate</code> — not legacy
        here, just the tool of the era — configured through Boot&apos;s{' '}
        <code>RestTemplateBuilder</code>:
      </p>

      <CodeBlock language="java" title="A hand-wrapped client — the Boot 2.7 equivalent of an @HttpExchange interface">
{`@Component
public class CatalogApiClient {

    private final RestTemplate restTemplate;

    public CatalogApiClient(RestTemplateBuilder builder) {
        this.restTemplate = builder
            .rootUri("https://catalog.example.com")
            .build();
    }

    public ProductDto get(String id) {
        return restTemplate.getForObject("/products/{id}", ProductDto.class, id);
    }

    public ProductDto create(CreateProduct payload) {
        return restTemplate.postForObject("/products", payload, ProductDto.class);
    }
}

// WebClient (reactive) is available too — it shipped in Framework 5.0,
// well before Boot 2.7 — if you're already on WebFlux or need reactive
// composition. What you don't get on 2.7 is the interface-plus-annotations
// style; every client here is a hand-written class with hand-written methods.`}
      </CodeBlock>

      <InfoBox variant="note" title="If your Boot 2 codebase already has declarative interfaces, it's probably Feign">
        <p>
          Spring Cloud OpenFeign — <code>@FeignClient</code> on an interface, with{' '}
          <code>@GetMapping</code>-style methods — was the era&apos;s real answer to &quot;I want
          an interface, not a hand-rolled client class,&quot; and it is genuinely common in Boot
          2.x microservice codebases. It is a separate framework from core Spring (Spring Cloud,
          not Spring Framework), so it is out of scope for a Spring Boot core lesson — but if
          you&apos;re staring at a client interface annotated <code>@FeignClient</code> instead of{' '}
          <code>@HttpExchange</code>, that is the Boot 2-era equivalent, not a mistake to
          &quot;fix&quot; before you&apos;ve actually decided to migrate.
        </p>
      </InfoBox>

      <h2>CORS — No Change</h2>

      <CodeBlock language="java" title="Global CORS config — identical on Boot 2.7 and Boot 4">
{`@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://app.example.com")
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}`}
      </CodeBlock>

      <h2>Documenting the API — springdoc-openapi, Different Artifact</h2>

      <p>
        <code>springdoc-openapi</code> still scans controllers, DTOs, and validation annotations
        at startup — but the artifact for a javax-based Boot 2 project is a different, older
        coordinate than the Boot 3+ one, and it is easy to add the wrong one from a copy-pasted
        Boot 4 pom and get a confusing dependency-resolution error instead of a clear one:
      </p>

      <CodeBlock language="xml" title="Boot 2.7 — the javax-compatible artifact">
{`<!-- Boot 2.7, Spring MVC. NOT springdoc-openapi-starter-webmvc-ui — that
     one requires jakarta.servlet and will not resolve cleanly here. -->
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-ui</artifactId>
  <version>1.8.0</version>
</dependency>`}
      </CodeBlock>

      <p>
        Version pinned explicitly above because, unlike the Boot 3+ starter, this one is not
        managed by the Boot BOM — <code>springdoc-openapi-ui</code> 1.8.0 is confirmed (via
        Maven Central&apos;s search API) as the current release on the 1.x line that targets
        Spring Boot 2. It serves the same two endpoints as its Boot 3 successor:
      </p>

      <CodeBlock language="text" title="Same endpoints, different artifact underneath">
{`/v3/api-docs          the OpenAPI 3 JSON spec
/swagger-ui.html      interactive UI

@Operation, @ApiResponse, @Schema — same annotations, same package
(io.swagger.v3.oas.annotations.*), same behavior on both artifacts.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Lock the UI down outside development — same rule, same version">
        <p>
          Swagger UI on a public Boot 2 endpoint is exactly as much of an API map handout as it is
          on Boot 4. Disable it per-environment (<code>springdoc.swagger-ui.enabled: false</code>)
          or put <code>/swagger-ui/**</code> and <code>/v3/api-docs/**</code> behind
          authentication.
        </p>
      </InfoBox>

      <h2>Testing Controllers — @MockBean Again</h2>

      <p>
        Covered in depth in the <a href="/springboot2/di">DI lesson</a>: <code>@MockitoBean</code>{' '}
        does not exist on Framework 5.3, so controller slice tests on Boot 2.7 use{' '}
        <code>@MockBean</code>. Everything else about <code>@WebMvcTest</code> and{' '}
        <code>MockMvc</code> is unchanged.
      </p>

      <CodeBlock language="java" title="Controller slice test — Boot 2.7 imports">
{`import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockBean UserService users;

    @Test
    void createReturns201WithLocation() throws Exception {
        when(users.create(any())).thenReturn(new UserDto(UUID.randomUUID(), "a@b.com"));

        mvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsBytes(new CreateUserRequest(/* ... */))))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.email").value("a@b.com"));
    }
}`}
      </CodeBlock>

      <h2>Real-World Checklist — Boot 2.7</h2>
      <InfoBox variant="success" title="A REST endpoint is ready for production on Boot 2.7 when">
        <ul>
          <li>Request DTOs use <code>javax.validation.Valid</code> and{' '}
              <code>javax.validation.constraints.*</code> — not <code>jakarta.validation</code>.</li>
          <li>Every error path throws a domain exception; error bodies come from a hand-rolled
              DTO or <code>ResponseStatusException</code> — never <code>ProblemDetail</code>, which
              doesn&apos;t exist yet.</li>
          <li>You&apos;ve checked whether any external API consumer relies on trailing-slash
              matching before this service is scheduled for a Boot 3+ upgrade.</li>
          <li>Outbound HTTP clients use <code>RestTemplate</code> (or Feign, if Spring Cloud is in
              play) — not <code>RestClient</code> or <code>@HttpExchange</code>.</li>
          <li>Large downloads use <code>StreamingResponseBody</code>, not <code>byte[]</code> —
              this one was never version-dependent.</li>
          <li>Slice tests use <code>@MockBean</code>, not <code>@MockitoBean</code>.</li>
          <li>OpenAPI docs come from <code>springdoc-openapi-ui</code> (1.x), not{' '}
              <code>springdoc-openapi-starter-webmvc-ui</code> (2.x, jakarta-only).</li>
        </ul>
      </InfoBox>

    </LessonLayout>
  );
}

export default SpringBoot2Rest;
