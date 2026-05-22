import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ApiDesignMethods() {
  return (
    <LessonLayout
      title="HTTP Methods and Status Codes"
      sectionId="apidesign"
      lessonIndex={1}
      prev={{ path: "/apidesign/intro", label: "API Design Principles" }}
      next={{ path: "/apidesign/resources", label: "Resource Design" }}
    >
      <p>HTTP methods and status codes are the vocabulary of REST APIs. Using them correctly makes your API predictable and allows clients to handle errors intelligently without reading documentation.</p>

      <h2>HTTP Methods</h2>

      <CodeBlock language="http" title="HTTP Methods — Properties and Use Cases">
{`# GET — safe (no side effects) and idempotent
GET /api/products/123    # Fetch resource
# Multiple identical GETs produce same result, no state change

# POST — not safe, not idempotent
POST /api/orders         # Create new resource
# Each call creates a new resource — calling twice = two orders

# PUT — not safe, idempotent (replace entire resource)
PUT /api/users/42
Body: { "name": "Alice", "email": "alice@example.com" }
# Replaces ALL fields — omitted fields are deleted/defaulted

# PATCH — not safe, idempotent (update specific fields)
PATCH /api/users/42
Body: { "email": "newalice@example.com" }
# Only updates specified fields — other fields unchanged

# DELETE — not safe, idempotent
DELETE /api/users/42     # First call: deletes. Second call: 404 (already gone)
# Idempotent because repeated calls leave same state (user doesn't exist)

# HEAD — like GET but returns headers only (check existence/metadata)
HEAD /api/files/report.pdf

# OPTIONS — returns allowed methods (used in CORS preflight)
OPTIONS /api/users  → Allow: GET, POST, HEAD, OPTIONS`}
      </CodeBlock>

      <h2>Status Codes Reference</h2>

      <CodeBlock language="java" title="Status Codes in Spring Boot">
{`// 2xx Success
@ResponseStatus(HttpStatus.OK)           // 200 — default for GET, PUT, PATCH
@ResponseStatus(HttpStatus.CREATED)      // 201 — POST that creates a resource
@ResponseStatus(HttpStatus.ACCEPTED)     // 202 — async processing started
@ResponseStatus(HttpStatus.NO_CONTENT)   // 204 — DELETE, PUT with no body

// 3xx Redirection
// 301 Moved Permanently — old URL permanently moved (update bookmarks)
// 302 Found — temporary redirect
// 304 Not Modified — conditional GET, use cached version

// 4xx Client Errors (client's fault)
@ResponseStatus(HttpStatus.BAD_REQUEST)       // 400 — invalid input, validation failed
@ResponseStatus(HttpStatus.UNAUTHORIZED)      // 401 — not authenticated (no/bad token)
@ResponseStatus(HttpStatus.FORBIDDEN)         // 403 — authenticated but not authorized
@ResponseStatus(HttpStatus.NOT_FOUND)         // 404 — resource doesn't exist
@ResponseStatus(HttpStatus.CONFLICT)          // 409 — duplicate, optimistic lock failure
@ResponseStatus(HttpStatus.UNPROCESSABLE)     // 422 — syntactically valid but semantically wrong
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS) // 429 — rate limited

// 5xx Server Errors (server's fault)
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)  // 500 — unexpected server error
@ResponseStatus(HttpStatus.BAD_GATEWAY)             // 502 — upstream service failed
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)     // 503 — overloaded/maintenance
@ResponseStatus(HttpStatus.GATEWAY_TIMEOUT)         // 504 — upstream timeout`}
      </CodeBlock>

      <FlowChart
        title="Status Code Decision Tree"
        chart={"graph TD\n  A[Request processed?] --> B{Success?}\n  B -- Yes --> C{Resource created?}\n  C -- Yes --> D[201 Created]\n  C -- No --> E{Has body?}\n  E -- Yes --> F[200 OK]\n  E -- No --> G[204 No Content]\n  B -- No --> H{Client error?}\n  H -- Yes --> I{Auth issue?}\n  I -- Yes --> J[401 or 403]\n  I -- No --> K[400 / 404 / 422]\n  H -- No --> L[500 / 503]"}
      />

      <InfoBox variant="warning" title="401 vs 403">
        <p>401 Unauthorized means "you are not authenticated — I don't know who you are." 403 Forbidden means "I know who you are, but you don't have permission." This distinction matters: 401 should trigger a login redirect; 403 should show an "Access Denied" page.</p>
      </InfoBox>

      <InteractiveChallenge
        question="A client sends a DELETE request for a resource that has already been deleted. What status code should the server return?"
        options={["200 OK", "404 Not Found", "409 Conflict", "Either 200 or 404 depending on your design"]}
        correctIndex={3}
        explanation="Both approaches are defensible. 404 is strictly correct — the resource doesn't exist. However, since DELETE is idempotent, some APIs return 204 No Content on repeat deletes to confirm the desired state (resource gone) is achieved. Choose one approach and document it consistently."
      />

    </LessonLayout>
  );
}
