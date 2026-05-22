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
      <h2>RESTful APIs with Spring MVC</h2>
      <p>
        Spring Boot makes building REST APIs straightforward through Spring MVC annotations.
        The <code>@RestController</code> annotation combines <code>@Controller</code> and
        <code>@ResponseBody</code>, meaning every method return value is automatically
        serialized to JSON (or XML) and written directly to the HTTP response body.
      </p>

      <FlowChart
        title="HTTP Request Lifecycle in Spring Boot"
        chart={"graph TD\nA[HTTP Request] --> B[DispatcherServlet]\nB --> C[Handler Mapping]\nC --> D[Controller Method]\nD --> E[Service Layer]\nE --> F[Repository Layer]\nF --> G[Database]\nG --> F\nF --> E\nE --> D\nD --> H[HttpMessageConverter]\nH --> I[JSON Response]"}
      />

      <h3>Creating a REST Controller</h3>
      <p>
        A REST controller defines HTTP endpoints using mapping annotations. Each method
        handles a specific HTTP verb and URL pattern, accepting request data through
        path variables, query parameters, or the request body.
      </p>

      <CodeBlock language="java" title="UserController.java">
{`@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/users
    @PostMapping
    public ResponseEntity<UserDTO> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserDTO created = userService.create(request);
        URI location = URI.create("/api/users/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}`}
      </CodeBlock>

      <h3>DTOs (Data Transfer Objects)</h3>
      <p>
        DTOs separate your API contract from your internal domain model. This gives you the
        freedom to evolve your database schema without breaking your API, and vice versa. It
        also prevents accidentally exposing sensitive fields like passwords.
      </p>

      <CodeBlock language="java" title="UserDTO.java">
{`// Response DTO — what the client receives
public record UserDTO(
    Long id,
    String email,
    String displayName,
    LocalDateTime createdAt
) {}

// Request DTO — what the client sends for creation
public record CreateUserRequest(
    @NotBlank String email,
    @NotBlank @Size(min = 8) String password,
    @NotBlank String displayName
) {}

// Request DTO — what the client sends for updates
public record UpdateUserRequest(
    @NotBlank String displayName,
    String bio
) {}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Use Java Records for DTOs">
        <p>
          Java records (available since Java 16) are ideal for DTOs because they are immutable,
          automatically generate <code>equals()</code>, <code>hashCode()</code>, and
          <code>toString()</code>, and require minimal boilerplate. Jackson (the JSON library
          Spring Boot uses) supports records out of the box.
        </p>
      </InfoBox>

      <h3>ResponseEntity and HTTP Status Codes</h3>
      <p>
        <code>ResponseEntity</code> gives you full control over the HTTP response, including
        the status code, headers, and body. Using proper HTTP status codes is essential for a
        well-designed REST API.
      </p>

      <CodeBlock language="java" title="ResponseEntityExamples.java">
{`// 200 OK with body
return ResponseEntity.ok(userDTO);

// 201 Created with Location header
URI location = URI.create("/api/users/" + id);
return ResponseEntity.created(location).body(userDTO);

// 204 No Content (successful delete)
return ResponseEntity.noContent().build();

// 404 Not Found
return ResponseEntity.notFound().build();

// 400 Bad Request with error body
return ResponseEntity.badRequest()
    .body(new ErrorResponse("Invalid email format"));

// Custom status with headers
return ResponseEntity
    .status(HttpStatus.ACCEPTED)
    .header("X-Request-Id", requestId)
    .body(result);`}
      </CodeBlock>

      <InteractiveChallenge
        question="What does @RestController combine?"
        options={[
          "@Component and @Service",
          "@Controller and @ResponseBody",
          "@RequestMapping and @GetMapping",
          "@Service and @Repository"
        ]}
        correctIndex={1}
        explanation="@RestController is a convenience annotation that combines @Controller (marks the class as a Spring MVC controller) and @ResponseBody (tells Spring to serialize return values directly into the HTTP response body as JSON/XML instead of resolving a view template)."
      />
    </LessonLayout>
  );
}
