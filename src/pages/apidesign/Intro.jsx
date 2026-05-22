import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ApiDesignIntro() {
  return (
    <LessonLayout
      title="API Design Principles"
      sectionId="apidesign"
      lessonIndex={0}
      prev={{ path: "/microservices/migration", label: "Migration Strategies" }}
      next={{ path: "/apidesign/methods", label: "HTTP Methods" }}
    >
      <p>A well-designed API is a product. It needs to be intuitive, consistent, and stable. REST (Representational State Transfer) is the dominant API style for web services, built on HTTP's native semantics: resources, methods, and status codes.</p>

      <h2>REST Constraints</h2>

      <FlowChart
        title="REST Architectural Constraints"
        chart={"graph TD\n  A[REST API] --> B[Client-Server]\n  A --> C[Stateless]\n  A --> D[Cacheable]\n  A --> E[Uniform Interface]\n  A --> F[Layered System]\n  E --> G[Resource identification]\n  E --> H[Self-descriptive messages]\n  E --> I[HATEOAS]"}
      />

      <CodeBlock language="http" title="REST API Design Examples">
{`# Resources are nouns, methods are verbs
GET    /api/users           # list all users
POST   /api/users           # create a user
GET    /api/users/42        # get user 42
PUT    /api/users/42        # replace user 42
PATCH  /api/users/42        # partial update user 42
DELETE /api/users/42        # delete user 42

# Nested resources for relationships
GET    /api/users/42/orders          # orders for user 42
POST   /api/users/42/orders          # create order for user 42
GET    /api/users/42/orders/99       # specific order

# Filtering, sorting, pagination via query params
GET    /api/products?category=books&sort=price&order=asc&page=2&size=20

# Actions that don't fit CRUD — use verb as sub-resource
POST   /api/orders/99/cancel        # cancel order
POST   /api/users/42/verify-email   # trigger verification
POST   /api/payments/123/refund     # refund payment`}
      </CodeBlock>

      <CodeBlock language="java" title="Well-Designed Spring Boot Controller">
{`@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    @GetMapping
    public Page<UserDto> listUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String search) {
        return userService.findAll(page, size, search);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createUser(@Valid @RequestBody CreateUserRequest req) {
        return userService.create(req);
    }

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @PatchMapping("/{id}")
    public UserDto updateUser(@PathVariable Long id,
                              @Valid @RequestBody UpdateUserRequest req) {
        return userService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="API Design Principles">
        <p>Be consistent — use the same naming, casing, and pagination style across all endpoints. Be predictable — developers should be able to guess your endpoints. Be forgiving on input, strict on output. Version from day one — adding /v1/ costs nothing upfront but saves significant pain later.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What HTTP status code should a successful POST /api/users return?"
        options={["200 OK", "201 Created", "202 Accepted", "204 No Content"]}
        correctIndex={1}
        explanation="201 Created indicates that the request succeeded and a new resource was created as a result. The response should also include a Location header with the URL of the newly created resource (e.g., Location: /api/users/42) and the created resource in the body."
      />

    </LessonLayout>
  );
}
