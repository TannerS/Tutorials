import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Rest() {
  return (
    <LessonLayout
      title="Building REST APIs"
      sectionId="springboot"
      lessonIndex={3}
      prev={{ path: '/springboot/di', label: 'Dependency Injection & IoC' }}
      next={{ path: '/springboot/data', label: 'Spring Data & JPA' }}
    >
      <h2>REST with Spring MVC</h2>
      <p>
        Spring MVC exposes HTTP endpoints through annotated controller classes.
        <code>@RestController</code> = <code>@Controller</code> + <code>@ResponseBody</code>,
        which means every method return value is serialized directly to the HTTP response
        (no view resolution). JSON serialization is done by Jackson, plugged in through
        the <code>HttpMessageConverter</code> chain.
      </p>

      <FlowChart
        title="Request lifecycle in Spring MVC"
        chart={"graph TD\nA[HTTP Request] --> B[Servlet Filters]\nB --> C[DispatcherServlet]\nC --> D[HandlerMapping]\nD --> E[HandlerInterceptors: preHandle]\nE --> F[Controller Method]\nF --> G[Service Layer]\nG --> H[Repository / Client]\nH --> G\nG --> F\nF --> I[HandlerInterceptors: postHandle]\nI --> J[HttpMessageConverter]\nJ --> K[Response Filters]\nK --> L[HTTP Response]"}
      />

      <h2>Request Mapping</h2>
      <p>
        <code>@RequestMapping</code> is the general form; the shorthand annotations
        (<code>@GetMapping</code>, <code>@PostMapping</code>, <code>@PutMapping</code>,
        <code>@PatchMapping</code>, <code>@DeleteMapping</code>) are used almost everywhere.
      </p>

      <CodeBlock language="java" title="A controller with the common surface">
{`@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    // GET /api/users?status=active&page=0&size=20
    @GetMapping
    public Page<UserDto> list(
            @RequestParam(defaultValue = "active") UserStatus status,
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

    // PATCH /api/users/{id}/status
    @PatchMapping("/{id}/status")
    public UserDto updateStatus(@PathVariable UUID id,
                                @RequestBody UserStatusUpdate patch) {
        return users.updateStatus(id, patch.status());
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        users.delete(id);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Return types you should reach for by default">
        <ul>
          <li><strong>The DTO directly</strong> — for a normal 2xx response. Spring
            sets <code>200</code> unless you annotate with <code>@ResponseStatus</code>.</li>
          <li><strong><code>ResponseEntity&lt;T&gt;</code></strong> — when the status,
            headers, or location URI depend on runtime logic. Prefer this when you need
            fine-grained control at that specific endpoint.</li>
          <li><strong>Throw an exception</strong> — for error responses. A
            <code>@RestControllerAdvice</code> converts it into the correct HTTP
            envelope. Never return an error DTO manually with an <code>if</code>.</li>
        </ul>
      </InfoBox>

      <h2>Binding Request Data</h2>
      <p>
        Every piece of the request has an annotation. Learn these five and you cover 95%
        of endpoints:
      </p>

      <CodeBlock language="java" title="Request-binding annotations">
{`// @PathVariable — segment of the URL path
@GetMapping("/orders/{orderId}/items/{itemId}")
public ItemDto item(@PathVariable String orderId, @PathVariable UUID itemId) { /* ... */ }

// @RequestParam — query string
@GetMapping("/search")
public List<Product> search(
        @RequestParam String q,
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "20") int limit) { /* ... */ }

// @RequestBody — request body deserialized via Jackson
@PostMapping
public OrderDto place(@RequestBody @Valid PlaceOrderRequest req) { /* ... */ }

// @RequestHeader — arbitrary header
@GetMapping("/me")
public UserDto me(@RequestHeader("X-Client-Version") String version) { /* ... */ }

// @CookieValue — a single cookie
@GetMapping("/preferences")
public PrefsDto prefs(@CookieValue(name = "session", required = false) String session) { /* ... */ }`}
      </CodeBlock>

      <h3>Composite parameters — the record trick</h3>
      <p>
        For endpoints with many query parameters, don't annotate each one. Bind them into a
        record (or a POJO) and Spring populates fields by name. Cleaner signatures, easier
        to test.
      </p>
      <CodeBlock language="java" title="Composite query parameters into a record">
{`public record ProductFilter(
        String q,
        String category,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        int page,
        int size) { }

@GetMapping("/products")
public Page<ProductDto> list(@ModelAttribute ProductFilter filter) {
    // ?q=chair&category=furniture&minPrice=100&page=0&size=20
    // -> populates ProductFilter automatically
    return catalog.search(filter);
}`}
      </CodeBlock>

      <h2>Request-Body Validation</h2>
      <p>
        Combine <code>@Valid</code> on the parameter with Jakarta Bean Validation constraints
        on the DTO. When validation fails, Spring throws
        <code>MethodArgumentNotValidException</code> — your global handler catches it and
        returns a structured 400.
      </p>

      <CodeBlock language="java" title="Validated request DTO">
{`public record CreateUserRequest(
        @NotBlank @Email                                    String email,
        @NotBlank @Size(min = 12, max = 128)                String password,
        @NotBlank @Size(max = 100)                          String displayName,
        @Pattern(regexp = "^[a-z]{2}(-[A-Z]{2})?$")         String locale,
        @NotNull                                             LocalDate dateOfBirth) {

    // Custom validation via a compact assertion in a canonical constructor:
    public CreateUserRequest {
        if (dateOfBirth != null && dateOfBirth.isAfter(LocalDate.now().minusYears(13))) {
            throw new IllegalArgumentException("User must be 13 or older");
        }
    }
}

// Nested validation propagates through @Valid on the field.
public record CreateOrderRequest(
        @NotNull  ShippingAddress shipping,
        @NotEmpty @Valid List<OrderItem> items) { }

public record OrderItem(
        @NotNull UUID productId,
        @Min(1) @Max(999) int quantity) { }`}
      </CodeBlock>

      <InfoBox variant="warning" title="Validation ≠ business rules">
        <p>
          Bean validation is for the <em>shape</em> of the input — length, format,
          presence. Business rules ("email must not already exist", "order total below
          credit limit") belong in the service layer, thrown as domain exceptions.
          Mixing them into <code>@AssertTrue</code> methods pollutes the DTO with
          knowledge it shouldn't have.
        </p>
      </InfoBox>

      <h2>Response Control — Status, Headers, and Location</h2>

      <CodeBlock language="java" title="ResponseEntity for full control">
{`@PostMapping("/orders")
public ResponseEntity<OrderDto> place(@Valid @RequestBody PlaceOrderRequest req) {
    OrderDto order = orderService.place(req);

    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}")
        .buildAndExpand(order.id())
        .toUri();

    return ResponseEntity
        .created(location)
        .header("X-Trace-Id", TracingContext.current().traceId())
        .body(order);
}

// Cached read with ETag/Last-Modified — cheap 304 for clients.
@GetMapping("/reports/{id}")
public ResponseEntity<ReportDto> get(@PathVariable UUID id,
                                     WebRequest webReq) {
    Report report = reports.byId(id);
    if (webReq.checkNotModified(report.lastModifiedEpoch(), report.etag())) {
        return null; // Spring writes 304 automatically
    }
    return ResponseEntity.ok()
        .eTag(report.etag())
        .lastModified(report.lastModifiedEpoch())
        .body(reportMapper.toDto(report));
}`}
      </CodeBlock>

      <h2>Content Negotiation</h2>
      <p>
        By default, Spring produces JSON. You can declare produced/consumed content types
        per endpoint, and Spring picks the right converter based on <code>Accept</code> and
        <code>Content-Type</code> headers.
      </p>
      <CodeBlock language="java" title="Multiple response formats from one endpoint">
{`@GetMapping(value = "/reports/{id}",
            produces = { MediaType.APPLICATION_JSON_VALUE,
                         MediaType.APPLICATION_PDF_VALUE,
                         "text/csv" })
public ResponseEntity<?> get(@PathVariable UUID id,
                             @RequestHeader("Accept") String accept) {
    Report r = reports.byId(id);
    return switch (accept) {
        case MediaType.APPLICATION_PDF_VALUE ->
            ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).body(pdf.render(r));
        case "text/csv" ->
            ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv")).body(csv.render(r));
        default ->
            ResponseEntity.ok(reportMapper.toDto(r));
    };
}`}
      </CodeBlock>

      <h2>File Upload and Streaming</h2>

      <CodeBlock language="java" title="Multipart upload">
{`@PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public DocumentDto upload(
        @RequestPart("file") MultipartFile file,
        @RequestPart("metadata") @Valid DocumentMeta meta) {

    if (file.getSize() > 25 * 1024 * 1024) {
        throw new PayloadTooLargeException("Max 25MB");
    }
    return docs.store(file.getInputStream(), meta);
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Streaming response (large files, no OOM)">
{`@GetMapping("/exports/{id}")
public ResponseEntity<StreamingResponseBody> download(@PathVariable UUID id) {
    StreamingResponseBody body = out -> {
        try (var stream = exports.open(id)) {
            stream.transferTo(out); // pipes bytes without buffering in memory
        }
    };
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\\"export.zip\\"")
        .body(body);
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Don't buffer big responses in a byte[]">
        <p>
          Returning <code>byte[]</code> means the entire payload sits in the JVM heap.
          For anything above a few MB use <code>StreamingResponseBody</code> or
          <code>InputStreamResource</code> so bytes flow from source to socket.
          This is a real production incident waiting to happen.
        </p>
      </InfoBox>

      <h2>Server-Sent Events</h2>
      <p>
        For streaming updates to a browser or long-lived clients, use SSE. Simpler than
        WebSocket, one-way, and works over ordinary HTTP.
      </p>
      <CodeBlock language="java" title="SSE endpoint with heartbeat">
{`@GetMapping(value = "/live/prices", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter livePrices() {
    SseEmitter emitter = new SseEmitter(TimeUnit.MINUTES.toMillis(5));
    Disposable sub = priceFeed.subscribe(tick -> {
        try {
            emitter.send(SseEmitter.event().name("price").data(tick));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
    });
    emitter.onCompletion(sub::dispose);
    emitter.onTimeout(sub::dispose);
    return emitter;
}`}
      </CodeBlock>

      <h2>Interceptors, Filters, and Advice</h2>
      <p>
        Three tools for cross-cutting HTTP concerns. Learn which layer each operates at.
      </p>
      <CodeBlock language="java" title="When to use each">
{`// Servlet Filter — earliest hook. Sees raw request/response bytes.
// Use for: request ID injection, gzip, security headers, low-level rewrites.
@Component
public class TraceIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String traceId = req.getHeader("X-Trace-Id");
        if (traceId == null) traceId = UUID.randomUUID().toString();
        MDC.put("traceId", traceId);
        try {
            res.setHeader("X-Trace-Id", traceId);
            chain.doFilter(req, res);
        } finally {
            MDC.remove("traceId");
        }
    }
}

// HandlerInterceptor — after handler mapping. Knows the controller method.
// Use for: authorization checks (though Spring Security is usually better),
// per-endpoint timing.
@Component
public class TimingInterceptor implements HandlerInterceptor {
    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res,
                                Object handler, Exception ex) {
        long start = (Long) req.getAttribute("startNanos");
        Metrics.timer("http.duration").record(System.nanoTime() - start, NANOSECONDS);
    }
}

// @ControllerAdvice / @RestControllerAdvice — after controller returns or throws.
// Use for: global exception mapping, response body wrapping.
@RestControllerAdvice
public class ApiErrorAdvice {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> notFound(ResourceNotFoundException e) { /* ... */ }
}`}
      </CodeBlock>

      <h2>Interface-Driven HTTP Clients — @HttpExchange</h2>
      <p>
        Spring 6 introduced a declarative HTTP-client style similar to Feign or Retrofit.
        You define an interface with mapping annotations; Spring generates an implementation
        backed by <code>RestClient</code> or <code>WebClient</code>. This is the modern
        replacement for hand-written <code>RestTemplate</code> wrappers.
      </p>
      <CodeBlock language="java" title="Declarative HTTP client">
{`public interface CatalogApi {

    @GetExchange("/products/{id}")
    ProductDto get(@PathVariable String id);

    @GetExchange("/products")
    Page<ProductDto> search(@RequestParam String q,
                            @RequestParam int page,
                            @RequestParam int size);

    @PostExchange("/products")
    ProductDto create(@RequestBody CreateProduct payload);
}

@Configuration
class HttpClientsConfig {
    @Bean
    public CatalogApi catalogApi(RestClient.Builder builder) {
        RestClient client = builder.baseUrl("https://catalog.example.com").build();
        HttpServiceProxyFactory factory =
            HttpServiceProxyFactory.builderFor(RestClientAdapter.create(client)).build();
        return factory.createClient(CatalogApi.class);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="RestClient vs WebClient vs RestTemplate">
        <p>
          <strong>RestClient</strong> (Spring 6.1+): the modern synchronous client. Fluent
          API, replaces <code>RestTemplate</code> for new code. <br />
          <strong>WebClient</strong>: reactive/async. Use when you're on WebFlux or need
          reactive composition. <br />
          <strong>RestTemplate</strong>: legacy but not removed. Existing code can keep it;
          new code should not adopt it.
        </p>
      </InfoBox>

      <h2>CORS</h2>
      <p>
        Two options: annotate specific controllers with <code>@CrossOrigin</code>, or
        register a global config once. Prefer the global one — CORS is a policy, not a
        per-endpoint decision.
      </p>
      <CodeBlock language="java" title="Global CORS config">
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

      <h2>API Versioning</h2>
      <p>
        Four common strategies. Pick one and be consistent across the whole API.
      </p>
      <CodeBlock language="text" title="Versioning strategies at a glance">
{`1. URL path            /api/v1/users   /api/v2/users
   Pros: dead simple, easy caching, obvious to clients.
   Cons: URL churns per version.

2. Custom header        Accept-Version: 2
   Pros: URL stable.
   Cons: harder to cache; harder to test in a browser.

3. Media type           Accept: application/vnd.example.v2+json
   Pros: HTTP-idiomatic.
   Cons: awkward tooling; almost nobody actually adopts this.

4. Query parameter      /api/users?version=2
   Pros: easy.
   Cons: mixes semantics with filter params; caching subtleties.

In practice: /api/v1 in the path is the most-battle-tested choice.`}
      </CodeBlock>

      <h2>Testing Controllers</h2>
      <p>
        Use <code>@WebMvcTest</code> for the controller slice, <code>MockMvc</code> to
        exercise routing and serialization, and mocks for the service layer.
      </p>
      <CodeBlock language="java" title="Controller slice test">
{`@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean UserService users;

    @Test
    void createReturns201WithLocation() throws Exception {
        when(users.create(any())).thenReturn(new UserDto(UUID.randomUUID(), "a@b.com"));

        mvc.perform(post("/api/users")
                .contentType(APPLICATION_JSON)
                .content(json.writeValueAsBytes(
                    new CreateUserRequest("a@b.com", "hunter2hunter2", "Alice",
                                          "en-US", LocalDate.of(1990,1,1)))))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.email").value("a@b.com"));
    }

    @Test
    void createReturns400OnInvalidEmail() throws Exception {
        mvc.perform(post("/api/users")
                .contentType(APPLICATION_JSON)
                .content("""
                    {"email":"not-an-email","password":"hunter2hunter2",
                     "displayName":"A","locale":"en-US","dateOfBirth":"1990-01-01"}"""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[?(@.field=='email')]").exists());
    }
}`}
      </CodeBlock>

      <h2>Real-World Checklist</h2>
      <InfoBox variant="success" title="A REST endpoint is ready for production when">
        <ul>
          <li>Every request DTO is a record with <code>@Valid</code>-checked constraints.</li>
          <li>Every error path throws a domain exception; no manual error DTOs in controllers.</li>
          <li>Location header is set on 201 responses that create a resource.</li>
          <li><code>ProblemDetail</code> is used for all 4xx/5xx bodies
              (see the Error Handling lesson).</li>
          <li>Large downloads use <code>StreamingResponseBody</code>, not <code>byte[]</code>.</li>
          <li>Slice tests cover happy path, one validation failure, and one auth-denied case.</li>
          <li>OpenAPI docs auto-generated via <code>springdoc-openapi</code>.</li>
          <li>Trace ID header is round-tripped and propagated to downstream calls.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="You need a controller endpoint that returns a 300 MB export. What return type should you use?"
        options={[
          "byte[] — it's simplest and Spring handles it",
          "ResponseEntity<byte[]> for control over headers",
          "StreamingResponseBody or InputStreamResource so bytes flow from source to socket without buffering the whole file in the JVM heap",
          "Return a String with the file base64-encoded"
        ]}
        correctIndex={2}
        explanation="Returning byte[] means the entire 300 MB payload sits in the JVM heap simultaneously — a straight path to OutOfMemoryError under moderate concurrent load. StreamingResponseBody accepts an OutputStream and lets you pipe bytes from disk / a database blob / an S3 stream directly to the response, using constant memory regardless of file size."
      />
    </LessonLayout>
  );
}
