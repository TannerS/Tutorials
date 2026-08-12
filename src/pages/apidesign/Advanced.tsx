import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Advanced() {
  return (
    <LessonLayout
      title="Advanced API Patterns"
      sectionId="apidesign"
      lessonIndex={5}
      prev={{ path: '/apidesign/versioning', label: 'Versioning & Pagination' }}
      next={null}
    >
      <h2>API Gateway Pattern</h2>
      <p>
        An API gateway is a single entry point for all client requests. It sits between
        clients and your backend services, providing cross-cutting concerns like
        authentication, rate limiting, request routing, response aggregation, and protocol
        translation. In a microservices architecture, the gateway prevents clients from
        needing to know the locations of dozens of internal services.
      </p>

      <CodeBlock language="http" title="API Gateway Routing Example">
        {`# Without a gateway — client must know every service
GET https://user-service:8081/users/42
GET https://order-service:8082/orders?userId=42
GET https://inventory-service:8083/products/99

# With an API gateway — single entry point
GET https://api.example.com/users/42           → routes to user-service
GET https://api.example.com/orders?userId=42   → routes to order-service
GET https://api.example.com/products/99        → routes to inventory-service

# The gateway handles:
# - SSL termination
# - Authentication / token validation
# - Rate limiting
# - Request logging and metrics
# - Response caching
# - Request/response transformation
# - Circuit breaking`}
      </CodeBlock>

      <FlowChart
        title="API Gateway Architecture"
        chart={"graph TD\n    CLIENT[Client Apps] -->|HTTPS| GW[API Gateway]\n    GW -->|Auth Check| AUTH[Auth Service]\n    GW -->|/users| USER[User Service]\n    GW -->|/orders| ORDER[Order Service]\n    GW -->|/products| PRODUCT[Product Service]\n    GW -->|/payments| PAY[Payment Service]\n    GW -.->|Rate Limiting| RL[Rate Limiter]\n    GW -.->|Caching| CACHE[Cache Layer]\n    GW -.->|Logging| LOG[Logging & Metrics]"}
      />

      <h2>Bulk and Batch Operations</h2>
      <p>
        Sometimes clients need to create, update, or delete multiple resources in a single
        request. Batch operations reduce the number of HTTP round trips and can improve
        performance dramatically. There are two common approaches: homogeneous batches
        (same operation on multiple resources) and heterogeneous batches (different
        operations in one request).
      </p>

      <CodeBlock language="json" title="Homogeneous Batch — Create Multiple Resources">
        {`// POST /api/users/bulk
// Request: Create multiple users at once
{
  "items": [
    { "name": "Alice", "email": "alice@example.com" },
    { "name": "Bob", "email": "bob@example.com" },
    { "name": "Charlie", "email": "charlie@example.com" }
  ]
}

// Response: 207 Multi-Status
{
  "summary": { "total": 3, "succeeded": 3, "failed": 0 },
  "results": [
    { "index": 0, "status": 201, "data": { "id": 101, "name": "Alice" } },
    { "index": 1, "status": 201, "data": { "id": 102, "name": "Bob" } },
    { "index": 2, "status": 201, "data": { "id": 103, "name": "Charlie" } }
  ]
}`}
      </CodeBlock>

      <CodeBlock language="json" title="Heterogeneous Batch — Mixed Operations">
        {`// POST /api/batch
// Request: Multiple different operations in one call
{
  "operations": [
    {
      "method": "POST",
      "path": "/api/users",
      "body": { "name": "Alice", "email": "alice@example.com" }
    },
    {
      "method": "PATCH",
      "path": "/api/users/42",
      "body": { "status": "active" }
    },
    {
      "method": "DELETE",
      "path": "/api/users/99"
    }
  ]
}

// Response: 207 Multi-Status
{
  "results": [
    { "index": 0, "status": 201, "body": { "id": 103, "name": "Alice" } },
    { "index": 1, "status": 200, "body": { "id": 42, "status": "active" } },
    { "index": 2, "status": 204, "body": null }
  ]
}`}
      </CodeBlock>

      <h2>Long-Running Operations</h2>
      <p>
        Some operations take too long for a synchronous HTTP request — report generation,
        data imports, video processing, bulk updates. For these, use the asynchronous
        request pattern: accept the request immediately, return a task reference, and let
        the client poll for completion or receive a webhook callback.
      </p>

      <CodeBlock language="http" title="Async Operations with Polling">
        {`# Step 1: Client initiates a long-running operation
POST /api/reports
{ "type": "annual-sales", "year": 2024 }

# Server accepts immediately with 202
HTTP/1.1 202 Accepted
Location: /api/tasks/task-abc-123
Retry-After: 10

{
  "taskId": "task-abc-123",
  "status": "pending",
  "links": {
    "poll": "/api/tasks/task-abc-123",
    "cancel": "/api/tasks/task-abc-123/cancel"
  }
}

# Step 2: Client polls the task endpoint
GET /api/tasks/task-abc-123

HTTP/1.1 200 OK
{
  "taskId": "task-abc-123",
  "status": "processing",
  "progress": 45,
  "estimatedCompletion": "2024-03-15T10:35:00Z"
}

# Step 3: Task completes
GET /api/tasks/task-abc-123

HTTP/1.1 200 OK
{
  "taskId": "task-abc-123",
  "status": "completed",
  "progress": 100,
  "result": {
    "downloadUrl": "/api/reports/rpt-def-456/download",
    "expiresAt": "2024-03-16T10:30:00Z"
  }
}`}
      </CodeBlock>

      <CodeBlock language="http" title="Async Operations with Webhooks">
        {`# Client initiates and provides a callback URL
POST /api/reports
{
  "type": "annual-sales",
  "year": 2024,
  "callbackUrl": "https://client.example.com/webhooks/reports"
}

# Server accepts immediately
HTTP/1.1 202 Accepted
{ "taskId": "task-abc-123", "status": "pending" }

# When complete, server calls the client's webhook
POST https://client.example.com/webhooks/reports
X-Webhook-Signature: sha256=abc123...
{
  "event": "report.completed",
  "taskId": "task-abc-123",
  "result": {
    "downloadUrl": "https://api.example.com/reports/rpt-def-456/download"
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Support Both Polling and Webhooks">
        <p>
          The best APIs support both patterns. Webhooks are more efficient (no wasted
          polling requests), but they require the client to have an HTTPS endpoint.
          Polling works for any client. Let the client choose by optionally providing
          a <code>callbackUrl</code> in the initial request.
        </p>
      </InfoBox>

      <h2>Idempotency Keys</h2>
      <p>
        Idempotency keys solve the duplicate request problem for non-idempotent operations.
        The client generates a unique key for each logical operation and includes it in the
        request header. If the server has already processed a request with that key, it
        returns the cached response instead of processing it again.
      </p>

      <CodeBlock language="http" title="Idempotency Key Pattern">
        {`# Client sends a payment with an idempotency key
POST /api/payments
Idempotency-Key: pay-2024-03-15-user42-abc123
{
  "amount": 100.00,
  "currency": "USD",
  "merchantId": "merchant-456"
}

# Server processes and stores the key + response
HTTP/1.1 201 Created
{ "paymentId": "pay-789", "status": "completed", "amount": 100.00 }

# Client retries (network timeout, uncertain if first succeeded)
POST /api/payments
Idempotency-Key: pay-2024-03-15-user42-abc123
{ "amount": 100.00, "currency": "USD", "merchantId": "merchant-456" }

# Server recognizes the key — returns cached response
HTTP/1.1 201 Created
Idempotency-Replayed: true
{ "paymentId": "pay-789", "status": "completed", "amount": 100.00 }

# Key reuse with different body is an error
POST /api/payments
Idempotency-Key: pay-2024-03-15-user42-abc123
{ "amount": 200.00, "currency": "USD", "merchantId": "merchant-456" }

HTTP/1.1 422 Unprocessable Entity
{
  "error": "Idempotency key already used with different parameters"
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Express.js — Idempotency Key Middleware">
        {`const idempotencyStore = new Map(); // Use Redis in production

function idempotencyMiddleware(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  // Check if we have a cached response for this key
  const cached = idempotencyStore.get(key);

  if (cached) {
    // Verify the request body matches the original
    const bodyHash = hashBody(req.body);
    if (bodyHash !== cached.bodyHash) {
      return res.status(422).json({
        type: 'https://api.example.com/errors/idempotency-mismatch',
        title: 'Idempotency Key Mismatch',
        status: 422,
        detail: 'This idempotency key was used with different request parameters.'
      });
    }

    // Return the cached response
    res.set('Idempotency-Replayed', 'true');
    return res.status(cached.status).json(cached.body);
  }

  // Intercept the response to cache it
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    idempotencyStore.set(key, {
      status: res.statusCode,
      body,
      bodyHash: hashBody(req.body),
      createdAt: Date.now()
    });
    return originalJson(body);
  };

  next();
}

app.post('/api/payments', idempotencyMiddleware, paymentHandler);`}
      </CodeBlock>

      <h2>Content Negotiation</h2>
      <p>
        Content negotiation allows clients to request different representations of the
        same resource. The most common use is requesting JSON vs XML, but it can also
        handle different languages, compression, and versioning.
      </p>

      <CodeBlock language="http" title="Content Negotiation Examples">
        {`# Client requests JSON (most common)
GET /api/users/42
Accept: application/json

# Client requests XML
GET /api/users/42
Accept: application/xml

# Client requests a specific version + format
GET /api/users/42
Accept: application/vnd.example.v2+json

# Server responds based on Accept header
HTTP/1.1 200 OK
Content-Type: application/json
Vary: Accept

{ "id": 42, "name": "Alice" }

# If the server cannot produce the requested format
HTTP/1.1 406 Not Acceptable
{
  "detail": "Supported formats: application/json, application/xml"
}`}
      </CodeBlock>

      <h2>GraphQL vs REST</h2>
      <p>
        GraphQL is not a replacement for REST — it is an alternative with different
        strengths. Understanding when to use each is important for making the right
        architectural choice.
      </p>

      <CodeBlock language="graphql" title="GraphQL vs REST Comparison">
        {`# REST: Multiple endpoints, server-defined shape
GET /api/users/42              → { id, name, email, address, ... }
GET /api/users/42/orders       → [{ id, total, items, ... }]
GET /api/users/42/orders/1/items → [{ id, name, price, ... }]
# 3 requests, each returns a fixed shape (over-fetching or under-fetching)

# GraphQL: Single endpoint, client-defined shape
POST /graphql
{
  user(id: 42) {
    name
    email
    orders(first: 5) {
      id
      total
      items {
        name
        price
      }
    }
  }
}
# 1 request, exactly the data needed — no more, no less

# When to choose REST:
# - Simple CRUD operations
# - Public APIs (easier to document, cache, and rate limit)
# - When HTTP caching is important (GET requests are cacheable)
# - When team is more familiar with REST
# - Microservice-to-microservice communication

# When to choose GraphQL:
# - Complex, deeply nested data requirements
# - Mobile apps that need to minimize data transfer
# - When clients have very different data needs
# - Rapid frontend iteration (no backend changes for new data shapes)
# - When over-fetching and under-fetching are significant problems`}
      </CodeBlock>

      <h2>gRPC for Internal Services</h2>
      <p>
        gRPC is a high-performance RPC framework that uses Protocol Buffers for serialization
        and HTTP/2 for transport. It excels in service-to-service communication where
        performance matters more than human readability.
      </p>

      <CodeBlock language="protobuf" title="gRPC Service Definition">
        {`// user.proto — Define the service contract
syntax = "proto3";
package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (UserResponse);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser(CreateUserRequest) returns (UserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UserResponse);
  rpc DeleteUser(DeleteUserRequest) returns (Empty);
  rpc StreamUserEvents(StreamRequest) returns (stream UserEvent);
}

message GetUserRequest {
  int64 id = 1;
}

message UserResponse {
  int64 id = 1;
  string name = 2;
  string email = 3;
  string status = 4;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
  string filter = 3;
}

message ListUsersResponse {
  repeated UserResponse users = 1;
  string next_page_token = 2;
  int32 total_count = 3;
}

// gRPC advantages over REST for internal services:
// - Binary serialization (smaller payloads, faster parsing)
// - HTTP/2 multiplexing (multiple requests on one connection)
// - Bi-directional streaming
// - Strongly typed contracts via .proto files
// - Automatic code generation for any language`}
      </CodeBlock>

      <InfoBox variant="note" title="REST + gRPC: A Common Architecture">
        <p>
          Many organizations use REST for external-facing APIs (because it is human-readable,
          cacheable, and universally supported) and gRPC for internal service-to-service
          communication (because it is faster and more efficient). The API gateway often
          translates between REST and gRPC.
        </p>
      </InfoBox>

      <h2>API Security Best Practices</h2>

      <CodeBlock language="http" title="API Security Checklist">
        {`# 1. Always use HTTPS — never HTTP
# All API traffic must be encrypted in transit

# 2. Authentication — use standard tokens
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
# Use OAuth 2.0 / OpenID Connect for most APIs
# API keys for server-to-server (never expose in client-side code)

# 3. Input validation — validate EVERYTHING
# - Type checking (string, number, boolean)
# - Length limits (max 255 chars for name)
# - Format validation (email, URL, UUID)
# - Whitelist allowed values for enums
# - Sanitize to prevent XSS and SQL injection

# 4. Rate limiting — protect against abuse
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42

# 5. Security headers
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Cache-Control: no-store  (for sensitive data)

# 6. CORS — restrict allowed origins
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type

# 7. Audit logging — log all access
# WHO accessed WHAT resource WHEN and from WHERE
# Log request ID, user ID, IP, method, path, status code`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never Do These">
        <p><strong>Never</strong> put API keys in URLs (they appear in logs and browser history).</p>
        <p><strong>Never</strong> expose stack traces or internal paths in error responses.</p>
        <p><strong>Never</strong> allow unlimited request body sizes (set a reasonable max).</p>
        <p><strong>Never</strong> trust client-provided data without validation.</p>
        <p><strong>Never</strong> use HTTP for any API traffic — always HTTPS.</p>
        <p><strong>Never</strong> store tokens in localStorage for sensitive apps (use httpOnly cookies).</p>
      </InfoBox>

      <h2>API Documentation with OpenAPI</h2>

      <CodeBlock language="yaml" title="OpenAPI 3.0 Specification Example">
        {`openapi: 3.0.3
info:
  title: User Management API
  version: 1.0.0
  description: REST API for managing users

paths:
  /api/users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated list of users
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'

    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
        '422':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
          format: email`}
      </CodeBlock>

      <h2>API Design Review Checklist</h2>

      <InfoBox variant="success" title="Pre-Launch API Checklist">
        <p><strong>URL Design:</strong> Plural nouns, lowercase, hyphens, consistent prefix, no verbs</p>
        <p><strong>HTTP Methods:</strong> Correct method for each operation, proper status codes</p>
        <p><strong>Error Handling:</strong> RFC 7807 format, field-level validation, no leaked internals</p>
        <p><strong>Pagination:</strong> All collection endpoints paginated, includes links and meta</p>
        <p><strong>Versioning:</strong> Strategy chosen and documented, backward compatibility policy</p>
        <p><strong>Authentication:</strong> OAuth 2.0 or API keys, HTTPS only</p>
        <p><strong>Rate Limiting:</strong> Limits set and documented, proper 429 responses with headers</p>
        <p><strong>Documentation:</strong> OpenAPI spec, examples for every endpoint, error catalog</p>
        <p><strong>Security:</strong> Input validation, CORS configured, security headers set</p>
        <p><strong>Performance:</strong> Response times measured, caching strategy in place</p>
      </InfoBox>

      <InteractiveChallenge
        question={"A client sends a POST request to create a payment, receives a network timeout, and does not know if the payment was processed. What pattern prevents a duplicate charge on retry?"}
        options={[
          "The client should just not retry — timeouts mean the server crashed",
          "Use an idempotency key header so the server recognizes the retry",
          "Switch to GET requests for payments since GET is idempotent",
          "Always use synchronous processing so timeouts cannot occur"
        ]}
        correctIndex={1}
        explanation={"Idempotency keys solve exactly this problem. The client includes a unique key (Idempotency-Key header) with each payment request. If the server already processed a request with that key, it returns the cached response instead of charging again. Stripe, PayPal, and all major payment APIs use this pattern."}
      />

      <InteractiveChallenge
        question={"You need to build an API that generates large reports taking 2-5 minutes. What is the correct pattern?"}
        options={[
          "Set the HTTP timeout to 10 minutes and make the client wait",
          "Return 202 Accepted immediately with a task ID, and let the client poll for completion",
          "Generate the report synchronously but compress it to make the response faster",
          "Break the report into small pages and return one page per request"
        ]}
        correctIndex={1}
        explanation={"The async request pattern is correct for long-running operations. Return 202 Accepted immediately with a task resource URL. The client can poll the task endpoint or receive a webhook when complete. This avoids HTTP timeouts, keeps connections free, and provides progress visibility."}
      />

    </LessonLayout>
  );
}
