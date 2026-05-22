import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ApiDesignVersioning() {
  return (
    <LessonLayout
      title="API Versioning"
      sectionId="apidesign"
      lessonIndex={4}
      prev={{ path: "/apidesign/errors", label: "Error Handling" }}
      next={{ path: "/apidesign/advanced", label: "Advanced API Design" }}
    >
      <p>APIs must evolve without breaking existing clients. API versioning is how you signal breaking changes. There are three main strategies: URL versioning, header versioning, and query parameter versioning. Each has trade-offs.</p>

      <h2>Versioning Strategies</h2>

      <CodeBlock language="http" title="Three Versioning Approaches">
{`# 1. URL versioning (most common, most visible)
GET /api/v1/users/42
GET /api/v2/users/42   # v2 adds new fields, changes response shape

# 2. Header versioning (cleaner URLs, harder to test in browser)
GET /api/users/42
Accept: application/vnd.myapi.v2+json

# 3. Query parameter versioning
GET /api/users/42?version=2

# Recommendation: URL versioning for public APIs
# Header versioning for internal/partner APIs where URL stability matters`}
      </CodeBlock>

      <CodeBlock language="java" title="URL Versioning in Spring Boot">
{`// V1 controller
@RestController
@RequestMapping("/api/v1/users")
public class UserControllerV1 {
    @GetMapping("/{id}")
    public UserDtoV1 getUser(@PathVariable Long id) {
        User user = userService.findById(id).orElseThrow();
        return new UserDtoV1(user.getId(), user.getName());  // v1 shape
    }
}

// V2 controller — adds email, avatar, enriched profile
@RestController
@RequestMapping("/api/v2/users")
public class UserControllerV2 {
    @GetMapping("/{id}")
    public UserDtoV2 getUser(@PathVariable Long id) {
        User user = userService.findById(id).orElseThrow();
        return new UserDtoV2(user.getId(), user.getName(),
                             user.getEmail(), user.getAvatarUrl(),
                             user.getCreatedAt());  // v2 shape
    }
}

// Both run simultaneously — old clients use v1, new clients use v2
// Eventually deprecate v1 with Sunset header`}
      </CodeBlock>

      <h2>Breaking vs Non-Breaking Changes</h2>

      <CodeBlock language="json" title="What Requires a Version Bump">
{`// NON-BREAKING (no version bump needed):
// ✓ Adding new optional fields to response
// ✓ Adding new optional query parameters
// ✓ Adding new endpoints
// ✓ Relaxing validation (accepting more values)
// ✓ Adding new enum values (if client ignores unknowns)

// BREAKING (requires new version):
// ✗ Renaming or removing response fields
//   v1: { "user_name": "Alice" }
//   v2: { "name": "Alice" }      // renames field → breaks clients

// ✗ Changing field types
//   v1: { "id": 42 }             // integer
//   v2: { "id": "usr_42abc" }    // string UUID → breaks clients

// ✗ Changing URL structure
//   v1: GET /api/orders/99
//   v2: GET /api/users/42/orders/99  // moved under user

// ✗ Removing endpoints or HTTP methods
// ✗ Tightening validation (rejecting previously valid input)
// ✗ Changing pagination style
//   v1: { "items": [...], "total": 100 }
//   v2: { "data": [...], "meta": { "count": 100 } }  // renamed keys`}
      </CodeBlock>

      <FlowChart
        title="Versioning Lifecycle"
        chart={"graph LR\n  A[v1 Released] --> B[v2 Released]\n  B --> C[v1 Deprecated]\n  C --> D[Sunset Header Added]\n  D --> E[v1 Removed after sunset date]\n  B --> F[v3 Released]"}
      />

      <InfoBox variant="tip" title="Sunset Header">
        <p>When deprecating an API version, add a Sunset header to responses: <code>Sunset: Sat, 01 Jan 2026 00:00:00 GMT</code>. This tells clients the exact date the version will be removed, giving them time to migrate. Send email notifications to registered API key holders too.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Which of the following changes requires a new API version?"
        options={["Adding a new optional 'avatarUrl' field to user responses", "Adding a new GET /api/reports endpoint", "Renaming the 'user_name' field to 'name' in user responses", "Adding an optional 'include' query parameter"]}
        correctIndex={2}
        explanation="Renaming a field is a breaking change — clients that parse 'user_name' will break when the field becomes 'name'. Adding new optional fields, new endpoints, or new optional parameters are non-breaking changes that don't require a version bump."
      />

    </LessonLayout>
  );
}
