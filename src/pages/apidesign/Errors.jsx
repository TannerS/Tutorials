import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ApiDesignErrors() {
  return (
    <LessonLayout
      title="Error Handling"
      sectionId="apidesign"
      lessonIndex={3}
      prev={{ path: "/apidesign/resources", label: "Resource Design" }}
      next={{ path: "/apidesign/versioning", label: "API Versioning" }}
    >
      <p>Consistent, informative error responses are one of the most important parts of API usability. A developer integrating your API will encounter errors constantly during development — clear error messages save hours of debugging.</p>

      <h2>Global Exception Handler</h2>

      <CodeBlock language="java" title="Spring Boot Global Error Handler">
{`@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    // 404 — Resource not found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex,
                                         HttpServletRequest req) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        pd.setTitle("Resource Not Found");
        pd.setDetail(ex.getMessage());
        pd.setProperty("resourceType", ex.getResourceType());
        pd.setProperty("resourceId", ex.getResourceId());
        pd.setInstance(URI.create(req.getRequestURI()));
        return pd;
    }

    // 400 — Validation errors
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        List<FieldError> fieldErrors = ex.getBindingResult().getFieldErrors()
            .stream()
            .map(e -> new FieldError(e.getField(), e.getDefaultMessage(),
                                      e.getRejectedValue()))
            .toList();

        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Validation Failed");
        pd.setDetail("One or more fields are invalid");
        pd.setProperty("errors", fieldErrors);
        return ResponseEntity.badRequest().body(pd);
    }

    // 409 — Conflict (duplicate, optimistic lock)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleConflict(DataIntegrityViolationException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        pd.setTitle("Data Conflict");
        pd.setDetail("The resource already exists or violates a unique constraint");
        return pd;
    }

    // 500 — Catch-all (never expose stack traces!)
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex, HttpServletRequest req) {
        String errorId = UUID.randomUUID().toString();
        log.error("Unexpected error [{}]: {}", errorId, req.getRequestURI(), ex);
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        pd.setTitle("Internal Server Error");
        pd.setDetail("An unexpected error occurred. Reference: " + errorId);
        return pd;  // errorId lets you find the stack trace in logs
    }
}`}
      </CodeBlock>

      <FlowChart
        title="Error Handling Flow"
        chart={"graph TD\n  A[Request] --> B[Controller]\n  B --> C{Exception?}\n  C -- No --> D[200 Response]\n  C -- Yes --> E[GlobalExceptionHandler]\n  E --> F{Exception type?}\n  F --> G[404 Not Found]\n  F --> H[400 Validation]\n  F --> I[409 Conflict]\n  F --> J[500 Server Error]"}
      />

      <InfoBox variant="note" title="RFC 7807 Problem Details">
        <p>RFC 7807 standardizes error responses with a machine-readable format: type (URI identifying the error type), title (human-readable summary), status (HTTP status code), detail (human-readable explanation), and instance (URI of the specific occurrence). Spring Boot 3 supports ProblemDetail natively.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Why should you never expose a full stack trace in an API error response?"
        options={["Stack traces are too large for HTTP responses", "Stack traces reveal implementation details that attackers can use to find vulnerabilities", "Stack traces are only available in development mode", "Stack traces slow down the server"]}
        correctIndex={1}
        explanation="Stack traces reveal your framework versions, internal package structure, class names, and sometimes even file paths — valuable intelligence for attackers. Log the full stack trace server-side with a correlation ID, then return only the correlation ID to the client so you can debug without exposing internals."
      />

    </LessonLayout>
  );
}
