import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringRest() {
  return (
    <LessonLayout
      title="Building REST APIs"
      sectionId="springboot"
      lessonIndex={3}
      prev={{ path: "/springboot/di", label: "Dependency Injection" }}
      next={{ path: "/springboot/data", label: "Spring Data JPA" }}
    >
      <p>Spring Boot makes building REST APIs straightforward with @RestController, request mapping annotations, and ResponseEntity for full control over HTTP responses.</p>

      <FlowChart
        title="HTTP Request Flow in Spring Boot"
        chart={"graph LR\n  A[HTTP Request] --> B[DispatcherServlet]\n  B --> C[HandlerMapping]\n  C --> D[@RestController]\n  D --> E[@Service]\n  E --> F[@Repository]\n  F --> G[Database]\n  G --> F\n  F --> E\n  E --> D\n  D --> H[HTTP Response]"}
      />

      <h2>@RestController Basics</h2>
      <CodeBlock language="java" title="REST Controller">
{`import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;

@RestController
@RequestMapping("/api/users")   // base path for all methods
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users
    @GetMapping
    public List<UserDTO> getAllUsers() {
        return userService.findAll();
    }

    // GET /api/users/42
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/users
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody CreateUserRequest req) {
        UserDTO created = userService.create(req);
        URI location = URI.create("/api/users/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    // PUT /api/users/42
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest req) {
        return userService.update(id, req)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/users/42
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/users/search?name=alice&minAge=18
    @GetMapping("/search")
    public List<UserDTO> search(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int minAge) {
        return userService.search(name, minAge);
    }
}`}
      </CodeBlock>

      <h2>Request/Response DTOs</h2>
      <CodeBlock language="java" title="DTOs with Validation">
{`// Request DTO with Bean Validation
public record CreateUserRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min=2, max=50) String name,
    @Min(0) @Max(150) int age
) {}

// Response DTO
public record UserDTO(Long id, String email, String name, int age) {}

// Mapper (or use MapStruct)
@Component
public class UserMapper {
    public UserDTO toDTO(User user) {
        return new UserDTO(user.getId(), user.getEmail(),
                           user.getName(), user.getAge());
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="ResponseEntity">
        <p>Use ResponseEntity to control the HTTP status code, headers, and body. Return ResponseEntity.ok(body) for 200, .created(location).body(body) for 201, .noContent().build() for 204, and .notFound().build() for 404.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between @RequestParam and @PathVariable?"
        options={["They are identical", "@PathVariable reads from the URL path (/users/42); @RequestParam reads from the query string (?id=42)", "@RequestParam is for POST only", "@PathVariable only works with GET"]}
        correctIndex={1}
        explanation="@PathVariable extracts values from the URL path template (e.g., /users/{id} → id=42). @RequestParam extracts query string parameters (e.g., /users?name=alice → name=alice). Both can have default values and be optional."
      />
    </LessonLayout>
  );
}
