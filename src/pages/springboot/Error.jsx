import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringError() {
  return (
    <LessonLayout
      title="Error Handling"
      sectionId="springboot"
      lessonIndex={8}
      prev={{ path: "/springboot/config", label: "Configuration" }}
      next={{ path: "/springboot/advanced", label: "Advanced Spring Boot" }}
    >
      <p>Good error handling returns clear, consistent error responses. Spring Boot provides @ControllerAdvice and @ExceptionHandler for centralized exception handling.</p>

      <h2>Global Exception Handler</h2>
      <CodeBlock language="java" title="@ControllerAdvice">
{`@RestControllerAdvice  // combines @ControllerAdvice + @ResponseBody
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Handle specific domain exceptions
    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(UserNotFoundException ex) {
        return new ErrorResponse("NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(DuplicateEmailException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleDuplicate(DuplicateEmailException ex) {
        return new ErrorResponse("DUPLICATE", ex.getMessage());
    }

    // Handle Bean Validation failures (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors()
            .stream()
            .map(fe -> new FieldError(fe.getField(), fe.getDefaultMessage()))
            .toList();
        return new ValidationErrorResponse("VALIDATION_FAILED", errors);
    }

    // Catch-all for unexpected errors
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        return new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    }
}`}
      </CodeBlock>

      <h2>Error Response DTOs</h2>
      <CodeBlock language="java" title="Standard Error Shapes">
{`// Simple error response
public record ErrorResponse(String code, String message) {}

// Validation error response
public record ValidationErrorResponse(
    String code,
    List<FieldError> errors
) {}

public record FieldError(String field, String message) {}

// Example responses:
// {"code":"NOT_FOUND","message":"User 42 not found"}
// {"code":"VALIDATION_FAILED","errors":[{"field":"email","message":"must not be blank"}]}`}
      </CodeBlock>

      <h2>Custom Domain Exceptions</h2>
      <CodeBlock language="java" title="Domain Exception Hierarchy">
{`// Base exception for domain errors
public abstract class DomainException extends RuntimeException {
    protected DomainException(String message) { super(message); }
}

public class UserNotFoundException extends DomainException {
    public UserNotFoundException(Long id) {
        super("User not found: " + id);
    }
}

public class DuplicateEmailException extends DomainException {
    public DuplicateEmailException(String email) {
        super("Email already in use: " + email);
    }
}

public class InsufficientStockException extends DomainException {
    public InsufficientStockException(String productId, int requested, int available) {
        super(String.format("Product %s: requested %d, available %d",
              productId, requested, available));
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Validation with @Valid">
        <p>Add @Valid to @RequestBody parameters to trigger Bean Validation. Annotate your DTO fields with constraints like @NotBlank, @Email, @Min, @Max, @Size, @Pattern. When validation fails, Spring automatically calls your MethodArgumentNotValidException handler.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What annotation centralizes exception handling across all @Controller classes?"
        options={["@ExceptionHandler", "@ControllerAdvice", "@ResponseStatus", "@ErrorHandler"]}
        correctIndex={1}
        explanation="@ControllerAdvice (or @RestControllerAdvice for REST) marks a class whose @ExceptionHandler, @ModelAttribute, and @InitBinder methods apply globally to all controllers. Without it, @ExceptionHandler only applies to the controller class it is defined in."
      />
    </LessonLayout>
  );
}
