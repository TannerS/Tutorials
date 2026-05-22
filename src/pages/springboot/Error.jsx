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
      <h2>Global Error Handling</h2>
      <p>
        Spring Boot provides a powerful mechanism for handling errors globally across your
        entire application using <code>@ControllerAdvice</code> and <code>@ExceptionHandler</code>.
        Instead of scattering try-catch blocks throughout your controllers, you define a single
        class that catches exceptions and transforms them into consistent, client-friendly
        error responses.
      </p>

      <FlowChart
        title="Error Handling Flow"
        chart={"graph TD\nA[Controller Method] --> B{Exception Thrown?}\nB -->|No| C[Normal Response]\nB -->|Yes| D[@ControllerAdvice]\nD --> E{Matching @ExceptionHandler?}\nE -->|Yes| F[Custom Error Response]\nE -->|No| G[Default Spring Error Handler]\nF --> H[JSON Error Body + HTTP Status]\nG --> H"}
      />

      <h3>Custom Exception Classes</h3>
      <p>
        Define meaningful exception classes that represent specific error conditions in your
        domain. This makes your error handling more precise and your code more readable.
      </p>

      <CodeBlock language="java" title="CustomExceptions.java">
{`// Base application exception
public abstract class AppException extends RuntimeException {
    private final HttpStatus status;

    protected AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}

// 404 — Resource not found
public class ResourceNotFoundException extends AppException {
    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found with id: " + id,
              HttpStatus.NOT_FOUND);
    }
}

// 409 — Duplicate resource conflict
public class DuplicateResourceException extends AppException {
    public DuplicateResourceException(String resource, String field,
                                      Object value) {
        super(resource + " with " + field + " '" + value
              + "' already exists",
              HttpStatus.CONFLICT);
    }
}

// 403 — Access denied
public class AccessDeniedException extends AppException {
    public AccessDeniedException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}`}
      </CodeBlock>

      <h3>Global Exception Handler</h3>

      <CodeBlock language="java" title="GlobalExceptionHandler.java">
{`@RestControllerAdvice
public class GlobalExceptionHandler {

    // Standard error response body
    public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> validationErrors
    ) {}

    // Handle custom application exceptions
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(
            AppException ex, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
            LocalDateTime.now(),
            ex.getStatus().value(),
            ex.getStatus().getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI(),
            null
        );
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    // Handle validation errors from @Valid
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(),
                       error.getDefaultMessage()));

        ErrorResponse body = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            "Validation Failed",
            "One or more fields have invalid values",
            request.getRequestURI(),
            errors
        );
        return ResponseEntity.badRequest().body(body);
    }

    // Catch-all for unexpected exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            "An unexpected error occurred",
            request.getRequestURI(),
            null
        );
        return ResponseEntity.internalServerError().body(body);
    }
}`}
      </CodeBlock>

      <h3>Bean Validation with @Valid</h3>
      <p>
        Spring Boot integrates with Jakarta Bean Validation (formerly javax.validation) to
        validate incoming request data declaratively using annotations. Add
        <code>spring-boot-starter-validation</code> to your dependencies and annotate your
        DTO fields.
      </p>

      <CodeBlock language="java" title="ValidationAnnotations.java">
{`public record CreateUserRequest(

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100,
          message = "Password must be 8-100 characters")
    @Pattern(regexp = ".*[A-Z].*",
             message = "Password must contain an uppercase letter")
    String password,

    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 50)
    String displayName,

    @Min(value = 13, message = "Must be at least 13 years old")
    @Max(value = 150)
    Integer age
) {}

// In the controller, @Valid triggers validation
@PostMapping
public ResponseEntity<UserDTO> createUser(
        @Valid @RequestBody CreateUserRequest request) {
    // If validation fails, MethodArgumentNotValidException
    // is thrown and caught by GlobalExceptionHandler
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(userService.create(request));
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Validation Error Responses">
        <p>
          When validation fails, Spring throws <code>MethodArgumentNotValidException</code>.
          Your global exception handler should catch this and return a structured response
          with the field-level errors, so the client knows exactly which fields failed and
          why. A typical response includes a map of field names to error messages, along with
          a 400 Bad Request status code.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What annotation marks a class as a global exception handler in Spring?"
        options={[
          "@ExceptionHandler",
          "@RestControllerAdvice or @ControllerAdvice",
          "@ErrorController",
          "@GlobalHandler"
        ]}
        correctIndex={1}
        explanation="@ControllerAdvice (or @RestControllerAdvice, which adds @ResponseBody) marks a class as a global exception handler. Methods within it annotated with @ExceptionHandler catch exceptions thrown by any controller. @ExceptionHandler alone only works within a single controller."
      />
    </LessonLayout>
  );
}
