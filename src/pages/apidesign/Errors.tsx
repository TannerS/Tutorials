import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Errors() {
  return (
    <LessonLayout
      title="Error Handling & Responses"
      sectionId="apidesign"
      lessonIndex={3}
      prev={{ path: '/apidesign/resources', label: 'Resource Naming & URLs' }}
      next={{ path: '/apidesign/versioning', label: 'Versioning & Pagination' }}
    >
      <h2>Why Error Handling Matters</h2>
      <p>
        Error handling is arguably the most important part of API design after URL structure.
        When things go wrong — and they always do — your API needs to communicate clearly
        what happened, why, and what the client can do about it. A well-designed error
        response saves developers hours of debugging. A poorly designed one creates support
        tickets and frustrated integrators.
      </p>
      <p>
        Great APIs treat error responses with the same care as success responses. They are
        part of your API contract and should be documented, consistent, and actionable.
      </p>

      <InfoBox variant="warning" title="Never Expose Internal Details">
        <p>
          Error responses should never include stack traces, database queries, internal
          file paths, or server configuration details. These leak implementation details
          that can be exploited by attackers. Always sanitize errors before sending them
          to clients. Log the full details server-side for debugging.
        </p>
      </InfoBox>

      <h2>RFC 7807 — Problem Details for HTTP APIs</h2>
      <p>
        RFC 7807 (now superseded by RFC 9457) defines a standard format for error responses
        called <strong>Problem Details</strong>. It provides a consistent, machine-readable
        structure that any client can parse without knowing your specific API. Adopting this
        standard means your errors are predictable across all your services.
      </p>

      <CodeBlock language="json" title="RFC 7807 Problem Details Format">
        {`{
  "type": "https://api.example.com/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 422,
  "detail": "Your account balance of $10.00 is insufficient for the $25.00 transfer.",
  "instance": "/transfers/abc-123",
  "balance": 10.00,
  "required": 25.00
}

// Field descriptions:
// type     — A URI reference that identifies the problem type (documentation link)
// title    — A short, human-readable summary of the problem type
// status   — The HTTP status code (repeated for convenience when body is logged)
// detail   — A human-readable explanation specific to THIS occurrence
// instance — A URI reference that identifies this specific occurrence`}
      </CodeBlock>

      <InfoBox variant="tip" title="The type Field Is a Documentation Link">
        <p>
          The <code>type</code> field should be a real URI that points to documentation
          explaining this error type in detail. This turns every error into a self-documenting
          entry point. If you do not have documentation links, use <code>about:blank</code>
          to indicate that the title alone provides sufficient description.
        </p>
      </InfoBox>

      <h2>Error Codes vs HTTP Status Codes</h2>
      <p>
        HTTP status codes are coarse-grained — 400 Bad Request covers many different failure
        modes. Application-level error codes provide the fine-grained detail clients need
        to handle errors programmatically.
      </p>

      <CodeBlock language="json" title="Application Error Codes">
        {`// HTTP 400 alone is ambiguous — what exactly is wrong?

// With application error codes, the client can branch:
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "code": "INVALID_EMAIL_FORMAT",
  "detail": "The email address 'not-an-email' is not valid.",
  "field": "email"
}

{
  "type": "https://api.example.com/errors/business-rule",
  "title": "Business Rule Violation",
  "status": 422,
  "code": "ORDER_LIMIT_EXCEEDED",
  "detail": "Maximum 10 items per order. You requested 15.",
  "maxAllowed": 10,
  "requested": 15
}

{
  "type": "https://api.example.com/errors/conflict",
  "title": "Resource Conflict",
  "status": 409,
  "code": "DUPLICATE_EMAIL",
  "detail": "A user with email 'alice@example.com' already exists.",
  "field": "email"
}

// Common error code naming pattern: SCREAMING_SNAKE_CASE
// Examples:
// INVALID_INPUT, RESOURCE_NOT_FOUND, UNAUTHORIZED,
// RATE_LIMIT_EXCEEDED, DUPLICATE_RESOURCE, STALE_DATA,
// INSUFFICIENT_PERMISSIONS, SERVICE_UNAVAILABLE`}
      </CodeBlock>

      <h2>Validation Errors — Field-Level Detail</h2>
      <p>
        Validation errors are the most common type of client error. Returning field-level
        detail allows client applications to display errors next to the corresponding form
        fields, dramatically improving user experience.
      </p>

      <CodeBlock language="json" title="Field-Level Validation Errors">
        {`// Single validation error
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more fields failed validation.",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Must be a valid email address"
    }
  ]
}

// Multiple validation errors — return ALL at once
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "3 fields failed validation.",
  "errors": [
    {
      "field": "email",
      "code": "REQUIRED",
      "message": "Email is required"
    },
    {
      "field": "password",
      "code": "TOO_SHORT",
      "message": "Password must be at least 8 characters",
      "meta": { "minLength": 8, "actualLength": 3 }
    },
    {
      "field": "birthDate",
      "code": "INVALID_FORMAT",
      "message": "Must be in ISO 8601 format (YYYY-MM-DD)",
      "meta": { "expected": "YYYY-MM-DD", "received": "01/15/1990" }
    }
  ]
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Return All Validation Errors at Once">
        <p>
          Never return validation errors one at a time. If a form has 5 invalid fields,
          return all 5 errors in a single response. Forcing the client to fix and resubmit
          repeatedly is a terrible developer experience and wastes server resources.
        </p>
      </InfoBox>

      <h2>Consistent Response Envelopes</h2>
      <p>
        A response envelope wraps your data in a consistent top-level structure. While not
        required by REST, envelopes make it easier for clients to handle both success and
        error responses with a single pattern.
      </p>

      <CodeBlock language="json" title="Consistent Response Envelope Pattern">
        {`// Success response
{
  "data": {
    "id": 42,
    "name": "Alice Johnson",
    "email": "alice@example.com"
  },
  "meta": {
    "requestId": "req-abc-123",
    "timestamp": "2024-03-15T10:30:00Z"
  }
}

// Success with collection + pagination
{
  "data": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ],
  "meta": {
    "page": 1,
    "size": 20,
    "total": 156,
    "requestId": "req-def-456"
  },
  "links": {
    "self": "/api/users?page=1&size=20",
    "next": "/api/users?page=2&size=20"
  }
}

// Error response — same top-level structure
{
  "error": {
    "type": "https://api.example.com/errors/not-found",
    "title": "Not Found",
    "status": 404,
    "detail": "User 999 does not exist.",
    "code": "RESOURCE_NOT_FOUND"
  },
  "meta": {
    "requestId": "req-ghi-789",
    "timestamp": "2024-03-15T10:31:00Z"
  }
}`}
      </CodeBlock>

      <FlowChart
        title="Error Handling Decision Flow"
        chart={"graph TD\n    REQ[Incoming Request] --> AUTH{Authenticated?}\n    AUTH -->|No| R401[401 Unauthorized]\n    AUTH -->|Yes| AUTHZ{Authorized?}\n    AUTHZ -->|No| R403[403 Forbidden]\n    AUTHZ -->|Yes| PARSE{Valid JSON?}\n    PARSE -->|No| R400[400 Bad Request]\n    PARSE -->|Yes| VALIDATE{Passes validation?}\n    VALIDATE -->|No| R422[422 Unprocessable Entity + field errors]\n    VALIDATE -->|Yes| BIZ{Business rules pass?}\n    BIZ -->|No| R409[409 Conflict or 422]\n    BIZ -->|Yes| EXEC{Execution succeeds?}\n    EXEC -->|No| R500[500 Internal Server Error]\n    EXEC -->|Yes| R200[200/201/204 Success]"}
      />

      <h2>Partial Failures in Batch Operations</h2>
      <p>
        Batch operations introduce a unique challenge: some items may succeed while others
        fail. Your API needs to communicate the mixed result clearly. There are two common
        approaches: all-or-nothing (transactional) and partial success.
      </p>

      <CodeBlock language="json" title="Batch Operation with Partial Failures">
        {`// Request: Bulk create users
POST /api/users/bulk
[
  { "name": "Alice", "email": "alice@example.com" },
  { "name": "Bob", "email": "invalid-email" },
  { "name": "Charlie", "email": "charlie@example.com" }
]

// Response: 207 Multi-Status (partial success)
{
  "status": 207,
  "summary": {
    "total": 3,
    "succeeded": 2,
    "failed": 1
  },
  "results": [
    {
      "index": 0,
      "status": 201,
      "data": { "id": 43, "name": "Alice", "email": "alice@example.com" }
    },
    {
      "index": 1,
      "status": 422,
      "error": {
        "code": "VALIDATION_ERROR",
        "detail": "Invalid email format",
        "field": "email"
      }
    },
    {
      "index": 2,
      "status": 201,
      "data": { "id": 44, "name": "Charlie", "email": "charlie@example.com" }
    }
  ]
}

// Alternative: All-or-nothing approach
// If ANY item fails, the entire batch is rejected
// Returns 422 with all errors listed
{
  "type": "https://api.example.com/errors/batch-validation",
  "title": "Batch Validation Failed",
  "status": 422,
  "detail": "1 of 3 items failed validation. No items were created.",
  "errors": [
    { "index": 1, "field": "email", "code": "INVALID_FORMAT", "message": "Invalid email" }
  ]
}`}
      </CodeBlock>

      <h2>Implementation: Spring Boot Error Handling</h2>

      <CodeBlock language="java" title="Spring Boot @ControllerAdvice — Global Error Handler">
        {`@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Handle validation errors (422)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        ProblemDetail problem = ProblemDetail.forStatus(422);
        problem.setType(URI.create("https://api.example.com/errors/validation-error"));
        problem.setTitle("Validation Failed");
        problem.setDetail(ex.getBindingResult().getErrorCount() + " fields failed validation.");
        problem.setInstance(URI.create(request.getRequestURI()));

        List<Map<String, String>> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> Map.of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage(),
                        "code", fe.getCode() != null ? fe.getCode() : "INVALID"
                ))
                .toList();

        problem.setProperty("errors", errors);
        return ResponseEntity.status(422).body(problem);
    }

    // Handle not found (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {

        ProblemDetail problem = ProblemDetail.forStatus(404);
        problem.setType(URI.create("https://api.example.com/errors/not-found"));
        problem.setTitle("Resource Not Found");
        problem.setDetail(ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(404).body(problem);
    }

    // Handle duplicate/conflict (409)
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ProblemDetail> handleConflict(
            DuplicateResourceException ex, HttpServletRequest request) {

        ProblemDetail problem = ProblemDetail.forStatus(409);
        problem.setType(URI.create("https://api.example.com/errors/duplicate"));
        problem.setTitle("Resource Conflict");
        problem.setDetail(ex.getMessage());
        problem.setProperty("conflictingField", ex.getField());
        return ResponseEntity.status(409).body(problem);
    }

    // Handle all unhandled exceptions (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(
            Exception ex, HttpServletRequest request) {

        // Log the full stack trace for debugging
        log.error("Unexpected error processing {}", request.getRequestURI(), ex);

        // Return a safe, generic error to the client
        ProblemDetail problem = ProblemDetail.forStatus(500);
        problem.setType(URI.create("https://api.example.com/errors/internal"));
        problem.setTitle("Internal Server Error");
        problem.setDetail("An unexpected error occurred. Please try again later.");
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(500).body(problem);
    }
}`}
      </CodeBlock>

      <h2>Implementation: Express.js Error Middleware</h2>

      <CodeBlock language="javascript" title="Express.js — Centralized Error Middleware">
        {`// Custom error classes
class AppError extends Error {
  constructor(status, code, detail, extras = {}) {
    super(detail);
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.extras = extras;
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(404, 'RESOURCE_NOT_FOUND', \`\${resource} \${id} not found\`);
    this.resource = resource;
  }
}

class ValidationError extends AppError {
  constructor(errors) {
    super(422, 'VALIDATION_ERROR', \`\${errors.length} fields failed validation\`);
    this.fieldErrors = errors;
  }
}

class ConflictError extends AppError {
  constructor(detail, field) {
    super(409, 'DUPLICATE_RESOURCE', detail);
    this.field = field;
  }
}

// Global error handling middleware (must be registered last)
function errorHandler(err, req, res, next) {
  // Log the full error server-side
  console.error(\`[\${req.method} \${req.path}] Error:\`, {
    message: err.message,
    stack: err.stack,
    code: err.code
  });

  // Handle known application errors
  if (err instanceof ValidationError) {
    return res.status(422).json({
      type: 'https://api.example.com/errors/validation-error',
      title: 'Validation Failed',
      status: 422,
      detail: err.detail,
      code: err.code,
      errors: err.fieldErrors,
      instance: req.originalUrl
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      type: \`https://api.example.com/errors/\${err.code.toLowerCase().replace(/_/g, '-')}\`,
      title: err.code.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase()),
      status: err.status,
      detail: err.detail,
      code: err.code,
      instance: req.originalUrl,
      ...err.extras
    });
  }

  // Handle unknown errors — never expose internals
  res.status(500).json({
    type: 'https://api.example.com/errors/internal',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred. Please try again later.',
    instance: req.originalUrl
  });
}

// Usage in routes
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) throw new NotFoundError('User', req.params.id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const errors = validateUser(req.body);
    if (errors.length > 0) throw new ValidationError(errors);

    const user = await userService.create(req.body);
    res.status(201).json({ data: user });
  } catch (err) {
    if (err.code === 'UNIQUE_VIOLATION') {
      return next(new ConflictError('Email already exists', 'email'));
    }
    next(err);
  }
});

module.exports = { errorHandler, AppError, NotFoundError, ValidationError, ConflictError };`}
      </CodeBlock>

      <InfoBox variant="success" title="Key Principles for Error Handling">
        <p><strong>Be consistent</strong> — Every error should follow the same structure.</p>
        <p><strong>Be specific</strong> — Include error codes, field names, and actionable details.</p>
        <p><strong>Be safe</strong> — Never expose stack traces, SQL queries, or internal paths.</p>
        <p><strong>Be complete</strong> — Return all validation errors at once, not one at a time.</p>
        <p><strong>Be documented</strong> — Every error code should be in your API documentation.</p>
      </InfoBox>

      <InteractiveChallenge
        question={"A client submits a form with 3 invalid fields. What is the best API behavior?"}
        options={[
          "Return 400 Bad Request with a generic error message",
          "Return only the first validation error so the client can fix and resubmit",
          "Return 422 Unprocessable Entity with all 3 field-level errors in one response",
          "Return 500 Internal Server Error because the data was invalid"
        ]}
        correctIndex={2}
        explanation={"The best practice is to return all validation errors at once with 422 Unprocessable Entity. Each error should include the field name, error code, and human-readable message. This lets the client display all errors to the user simultaneously. Returning errors one at a time wastes server round trips and frustrates users."}
      />

      <InteractiveChallenge
        question={"Which field in RFC 7807 Problem Details should contain a link to documentation about the error type?"}
        options={[
          "detail",
          "instance",
          "type",
          "title"
        ]}
        correctIndex={2}
        explanation={"The 'type' field is a URI reference that identifies the problem type and should link to documentation. 'detail' is a human-readable description of this specific occurrence. 'instance' identifies this specific error occurrence (usually the request URL). 'title' is a short human-readable summary of the problem type."}
      />

    </LessonLayout>
  );
}
