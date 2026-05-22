import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ApiDesignResources() {
  return (
    <LessonLayout
      title="Resource Design"
      sectionId="apidesign"
      lessonIndex={2}
      prev={{ path: "/apidesign/methods", label: "HTTP Methods" }}
      next={{ path: "/apidesign/errors", label: "Error Handling" }}
    >
      <p>Good resource design is the foundation of a usable API. Resources should be nouns, URLs should be hierarchical and readable, and response shapes should be consistent and versioned.</p>

      <h2>URL Design Rules</h2>

      <CodeBlock language="http" title="Good vs Bad URL Design">
{`# BAD — verb in URL, inconsistent casing, actions as endpoints
GET  /api/getUser?userId=42
POST /api/createNewOrder
GET  /api/getUserOrders/42
POST /api/cancelOrder
GET  /api/getProductsByCategory?cat=books

# GOOD — nouns, hierarchical, consistent
GET  /api/users/42
POST /api/orders
GET  /api/users/42/orders
POST /api/orders/99/cancel       # action as sub-resource (acceptable)
GET  /api/products?category=books

# Naming conventions
# ✓ Plural nouns for collections: /users, /orders, /products
# ✓ Lowercase with hyphens: /user-profiles, /order-items
# ✓ No trailing slash: /api/users (not /api/users/)
# ✓ Stable URLs — avoid including implementation details (no /api/mysql/users)`}
      </CodeBlock>

      <h2>Response Envelope Design</h2>

      <CodeBlock language="json" title="Consistent Response Structure">
{`// Single resource
GET /api/users/42
{
  "id": 42,
  "name": "Alice Smith",
  "email": "alice@example.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-03-20T14:22:00Z"
}

// Collection with pagination
GET /api/users?page=2&size=10
{
  "data": [
    { "id": 41, "name": "Bob" },
    { "id": 42, "name": "Alice" }
  ],
  "pagination": {
    "page": 2,
    "size": 10,
    "total": 247,
    "totalPages": 25,
    "hasNext": true,
    "hasPrevious": true,
    "links": {
      "self":  "/api/users?page=2&size=10",
      "next":  "/api/users?page=3&size=10",
      "prev":  "/api/users?page=1&size=10",
      "first": "/api/users?page=1&size=10",
      "last":  "/api/users?page=25&size=10"
    }
  }
}

// Error response (RFC 7807 Problem Details)
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Request body contains invalid fields",
  "instance": "/api/users",
  "errors": [
    { "field": "email", "message": "Must be a valid email address" },
    { "field": "name",  "message": "Must be between 2 and 100 characters" }
  ]
}`}
      </CodeBlock>

      <FlowChart
        title="API Resource Hierarchy"
        chart={"graph TD\n  A[/api/v1] --> B[/users]\n  A --> C[/products]\n  A --> D[/orders]\n  B --> E[/users/id]\n  E --> F[/users/id/orders]\n  E --> G[/users/id/addresses]\n  D --> H[/orders/id]\n  H --> I[/orders/id/items]\n  H --> J[/orders/id/cancel]"}
      />

      <InfoBox variant="tip" title="OpenAPI / Swagger">
        <p>Document your API with OpenAPI 3.0 (formerly Swagger). Use springdoc-openapi in Spring Boot to auto-generate docs from your annotations. Good API docs include: request/response schemas, all possible status codes, authentication requirements, example values, and rate limits.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What naming convention should REST API endpoints follow?"
        options={["camelCase verbs: /getUser, /createOrder", "Plural nouns with lowercase and hyphens: /users, /order-items", "UPPERCASE with underscores: /USER_PROFILES", "snake_case verbs: /get_user, /create_order"]}
        correctIndex={1}
        explanation="REST URLs should use plural nouns (collections) in lowercase with hyphens as separators. /users refers to the users collection, /users/42 refers to a specific user, /order-items uses a hyphen for multi-word resources. The HTTP method expresses the action — the URL only identifies the resource."
      />

    </LessonLayout>
  );
}
