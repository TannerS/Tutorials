import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Validation() {
  return (
    <LessonLayout
      title="Testing Validation & Error Handling"
      sectionId="api-testing"
      lessonIndex={2}
      prev={{ path: '/api-testing/controllers', label: 'Testing Controllers & Responses' }}
      next={{ path: '/api-testing/security', label: 'Testing Secured Endpoints' }}
    >
      <h2>The Happy Path Is the Easy 20%</h2>
      <p>
        Most controller test suites are thick on the happy path and thin on everything
        else. But a client integrating against your API spends far more time handling
        4xx responses than 2xx ones — malformed bodies, missing fields, business-rule
        violations, wrong content types. If your error responses aren&apos;t tested, they&apos;re
        effectively undocumented.
      </p>

      <FlowChart
        title="Where Bad Requests Get Rejected"
        chart={"graph TD\n  REQ[\"Incoming Request\"] --> PARSE{\"Parseable JSON?\"}\n  PARSE -->|No| E400A[\"400 — malformed body\"]\n  PARSE -->|Yes| BEAN{\"Bean Validation\\npasses?\"}\n  BEAN -->|No| E400B[\"400 — field errors\"]\n  BEAN -->|Yes| BIZ{\"Business rule\\nsatisfied?\"}\n  BIZ -->|No| E409[\"409/422 — domain exception\"]\n  BIZ -->|Yes| OK[\"200/201\"]"}
      />

      <h2>Testing Bean Validation Failures</h2>
      <p>
        A single invalid field is the easy case. The interesting tests are: multiple
        simultaneous violations, nested object validation, and collection element
        validation — all of which need to surface every failure, not just the first one.
      </p>

      <CodeBlock language="java" title="Multiple Field Violations in One Response">
{`public record CreateOrderRequest(
    @NotBlank(message = "customerEmail is required") @Email String customerEmail,
    @NotEmpty(message = "items must not be empty") List<@Valid OrderItemRequest> items,
    @Positive(message = "quantity must be positive") Integer quantity
) {}

@Test
@DisplayName("returns one error per violated field, not just the first")
void returnsAllValidationErrors() throws Exception {
    mvc.perform(post("/api/orders")
            .contentType(APPLICATION_JSON)
            .content("""
                { "customerEmail": "not-an-email", "items": [], "quantity": -1 }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors", hasSize(3)))
        .andExpect(jsonPath("$.errors[*].field",
            containsInAnyOrder("customerEmail", "items", "quantity")));
}

@Test
@DisplayName("validates elements nested inside a collection")
void validatesNestedListElements() throws Exception {
    mvc.perform(post("/api/orders")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "customerEmail": "alice@test.com",
                  "items": [ { "sku": "", "qty": 0 } ],
                  "quantity": 1
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors[*].field", hasItem("items[0].sku")));
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Assert on Field Names, Not Just Count">
        <code>jsonPath("$.errors", hasSize(3))</code> alone is a weak assertion — it
        passes even if the wrong three fields failed. Always pair a count assertion with
        a field-name assertion (<code>containsInAnyOrder</code>,{' '}
        <code>hasItem</code>) so a regression that swaps which field is validated still
        fails the test.
      </InfoBox>

      <h2>Testing @ExceptionHandler / @ControllerAdvice</h2>
      <p>
        Domain exceptions (out of stock, insufficient funds, duplicate order) need their
        own mapping to HTTP status and response shape. Test the{' '}
        <code>@ControllerAdvice</code> directly through the controller — don&apos;t just
        unit test it in isolation, since the interesting behavior is the mapping from
        &quot;this exception was thrown&quot; to &quot;this exact response went out.&quot;
      </p>

      <CodeBlock language="java" title="Global Exception Handler">
{`@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail handleNotFound(OrderNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Order Not Found");
        problem.setProperty("orderId", ex.getOrderId());
        return problem;
    }

    @ExceptionHandler(InsufficientInventoryException.class)
    ProblemDetail handleOutOfStock(InsufficientInventoryException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Insufficient Inventory");
        problem.setProperty("sku", ex.getSku());
        problem.setProperty("requested", ex.getRequestedQuantity());
        problem.setProperty("available", ex.getAvailableQuantity());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation Failed");
        problem.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
            .map(err -> Map.of("field", err.getField(), "message", err.getDefaultMessage()))
            .toList());
        return problem;
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Testing the Mapping — RFC 9457 ProblemDetail Assertions">
{`@Test
@DisplayName("out-of-stock throws 409 with a structured ProblemDetail body")
void insufficientInventoryReturns409() throws Exception {
    when(orders.place(any())).thenThrow(
        new InsufficientInventoryException("SKU-1", 5, 2));

    mvc.perform(post("/api/orders")
            .contentType(APPLICATION_JSON)
            .content(validOrderJson()))
        .andExpect(status().isConflict())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.title").value("Insufficient Inventory"))
        .andExpect(jsonPath("$.sku").value("SKU-1"))
        .andExpect(jsonPath("$.requested").value(5))
        .andExpect(jsonPath("$.available").value(2));
}

@Test
@DisplayName("not-found exception maps to 404 with the order id in the body")
void orderNotFoundReturns404() throws Exception {
    when(orders.findById("UNKNOWN")).thenThrow(new OrderNotFoundException("UNKNOWN"));

    mvc.perform(get("/api/orders/{id}", "UNKNOWN"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.orderId").value("UNKNOWN"))
        .andExpect(jsonPath("$.detail").value(containsString("UNKNOWN")));
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Why RFC 9457 ProblemDetail Matters for Tests">
        The spec is <strong>RFC 9457</strong>, which obsoleted RFC 7807 in 2023 — the
        media type (<code>application/problem+json</code>) and every field name are
        unchanged, so most material still cites 7807 and nothing you test breaks.{' '}
        Spring&apos;s built-in <code>ProblemDetail</code> gives error responses a
        predictable shape (<code>type</code>, <code>title</code>, <code>status</code>,{' '}
        <code>detail</code>, <code>instance</code>, plus custom properties). Testing
        against that fixed shape means clients can write generic error-handling code
        once, instead of parsing a different ad-hoc JSON structure per endpoint.
      </InfoBox>

      <h2>Malformed Input Before Validation Even Runs</h2>
      <p>
        Bean Validation only runs if Jackson can deserialize the body in the first
        place. Broken JSON, wrong types, and unknown fields (depending on config) fail
        earlier and differently — test them separately from field-level violations.
      </p>

      <CodeBlock language="java" title="Testing Malformed Requests">
{`@Test
@DisplayName("unparseable JSON returns 400, not a 500")
void malformedJsonReturns400() throws Exception {
    mvc.perform(post("/api/orders")
            .contentType(APPLICATION_JSON)
            .content("{ this is not json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Malformed JSON Request"));
}

@Test
@DisplayName("wrong JSON type for a field returns 400, not an unhandled exception")
void typeMismatchReturns400() throws Exception {
    mvc.perform(post("/api/orders")
            .contentType(APPLICATION_JSON)
            .content("""
                { "customerEmail": "alice@test.com", "quantity": "not-a-number" }
                """))
        .andExpect(status().isBadRequest());
}

@Test
@DisplayName("empty body on a required-body endpoint returns 400")
void emptyBodyReturns400() throws Exception {
    mvc.perform(post("/api/orders").contentType(APPLICATION_JSON))
        .andExpect(status().isBadRequest());
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Every Exception Type Needs a Test — Including the Unmapped Ones">
        It&apos;s easy to test the exceptions you explicitly handle and forget the
        catch-all. Add one test that throws a completely unexpected{' '}
        <code>RuntimeException</code> from the service and asserts the response is a
        generic <code>500</code> <em>without</em> leaking a stack trace or internal
        class names in the body — that&apos;s a real information-disclosure bug if missed.
      </InfoBox>

      <CodeBlock language="java" title="Testing the Catch-All Handler Doesn't Leak Internals">
{`@ExceptionHandler(Exception.class)
ProblemDetail handleUnexpected(Exception ex, HttpServletRequest req) {
    log.error("Unhandled exception on {}", req.getRequestURI(), ex);
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    problem.setTitle("Internal Server Error");
    problem.setDetail("An unexpected error occurred."); // no ex.getMessage(), no stack trace
    return problem;
}

@Test
@DisplayName("unexpected exceptions don't leak stack traces or exception class names")
void unexpectedErrorDoesNotLeakInternals() throws Exception {
    when(orders.findById(anyString()))
        .thenThrow(new IllegalStateException("connection pool exhausted at 10.0.4.2:5432"));

    mvc.perform(get("/api/orders/{id}", "ORD-1"))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.detail").value("An unexpected error occurred."))
        .andExpect(content().string(not(containsString("10.0.4.2"))))
        .andExpect(content().string(not(containsString("IllegalStateException"))));
}`}
      </CodeBlock>

      <h2>Isolating the Exception Handler in a Slice Test</h2>
      <p>
        <code>@WebMvcTest(OrderController.class)</code> automatically picks up{' '}
        <code>@RestControllerAdvice</code> classes in the same package structure. If your
        advice lives elsewhere or you want to test it against a minimal stand-in
        controller, wire it explicitly.
      </p>

      <CodeBlock language="java" title="Explicit Controller Advice Wiring">
{`@WebMvcTest(controllers = OrderController.class)
@Import(ApiExceptionHandler.class)  // ensure the advice is loaded even if package scanning wouldn't find it
class OrderControllerErrorHandlingTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService orders;
    // ...
}`}
      </CodeBlock>

      <h2>Key Takeaways</h2>
      <ul>
        <li>Test multiple simultaneous validation failures and nested/collection field validation, not just single-field cases</li>
        <li>Assert on field names alongside error counts — count-only assertions hide regressions</li>
        <li>Test @ExceptionHandler / @ControllerAdvice mappings through the controller, asserting the full ProblemDetail shape (status, title, custom properties)</li>
        <li>Malformed JSON, type mismatches, and empty bodies fail before Bean Validation runs — test them as a separate category</li>
        <li>Always test the catch-all exception handler explicitly for information disclosure — no stack traces, no internal class names in the response</li>
        <li>@Import your @ControllerAdvice explicitly in a slice test if package scanning might not find it</li>
      </ul>
    </LessonLayout>
  );
}
