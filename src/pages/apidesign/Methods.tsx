import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Methods() {
  return (
    <LessonLayout
      title="HTTP Methods & Status Codes"
      sectionId="apidesign"
      lessonIndex={1}
      prev={{ path: '/apidesign/intro', label: 'REST Principles' }}
      next={{ path: '/apidesign/resources', label: 'Resource Naming & URLs' }}
    >
      <h2>HTTP Methods (Verbs)</h2>
      <p>
        HTTP methods define the action to be performed on a resource. Choosing the correct
        method is fundamental to RESTful API design. Each method has specific semantics
        regarding safety, idempotency, and whether it should have a request body.
      </p>

      <InfoBox variant="info" title="Safety and Idempotency">
        <p>
          A <strong>safe</strong> method does not modify server state — it only retrieves
          data. A safe request can be made any number of times without side effects.
        </p>
        <p>
          An <strong>idempotent</strong> method produces the same result whether called once
          or multiple times. Making the same idempotent request 10 times has the same effect
          as making it once.
        </p>
      </InfoBox>

      <h3>GET — Retrieve a Resource</h3>
      <p>
        GET is the most common HTTP method. It retrieves a representation of a resource
        without modifying it. GET is both <strong>safe</strong> and <strong>idempotent</strong>.
        GET requests should never have a request body (although HTTP technically allows it,
        many servers and proxies will strip or ignore it).
      </p>
      <ul>
        <li>Use for reading single resources: <code>GET /users/42</code></li>
        <li>Use for listing collections: <code>GET /users?page=1&amp;size=20</code></li>
        <li>Responses should be cacheable when possible</li>
        <li>Should return 200 OK with the resource, or 404 Not Found</li>
      </ul>

      <h3>POST — Create a New Resource</h3>
      <p>
        POST submits data to the server to create a new resource. It is <strong>neither safe
        nor idempotent</strong> — making the same POST request twice will typically create two
        separate resources. The response should return 201 Created with a Location header
        pointing to the newly created resource.
      </p>
      <ul>
        <li>Use for creating: <code>POST /users</code> with a JSON body</li>
        <li>Also used for operations that do not map to CRUD (e.g., <code>POST /emails/send</code>)</li>
        <li>Returns 201 Created with the new resource and a Location header</li>
      </ul>

      <h3>PUT — Full Resource Replacement</h3>
      <p>
        PUT replaces the entire resource at the given URI with the provided representation.
        It is <strong>idempotent but not safe</strong>. If you PUT the same data 10 times,
        the resource ends up in the same state. The client must send the complete resource —
        any fields omitted will be set to null or their defaults.
      </p>
      <ul>
        <li>Use for full updates: <code>PUT /users/42</code> with the complete user object</li>
        <li>Can also create a resource if the client controls the ID: <code>PUT /users/custom-id</code></li>
        <li>Returns 200 OK with the updated resource, or 204 No Content</li>
      </ul>

      <h3>PATCH — Partial Update</h3>
      <p>
        PATCH applies a partial modification to a resource. Unlike PUT, the client only sends
        the fields that should change. PATCH is <strong>neither safe nor necessarily
        idempotent</strong> (although well-designed PATCH operations often are).
      </p>
      <ul>
        <li>Use for partial updates: <code>PATCH /users/42</code> with only changed fields</li>
        <li>JSON Merge Patch (RFC 7396) is the most common format</li>
        <li>JSON Patch (RFC 6902) provides operation-based patching</li>
      </ul>

      <h3>DELETE — Remove a Resource</h3>
      <p>
        DELETE removes the resource at the given URI. It is <strong>idempotent but not
        safe</strong> — deleting a resource that was already deleted should return 404 (or 204,
        depending on your design), but the end state is the same: the resource is gone.
      </p>
      <ul>
        <li>Use for removal: <code>DELETE /users/42</code></li>
        <li>Returns 204 No Content (no body) or 200 OK with a confirmation body</li>
        <li>Consider soft deletes for audit trails</li>
      </ul>

      <FlowChart
        title="Choosing the Right HTTP Method"
        chart={"graph TD\n    START[What do you want to do?] -->|Read data| GET[GET - Safe & Idempotent]\n    START -->|Create new| POST[POST - Neither Safe nor Idempotent]\n    START -->|Full replace| PUT[PUT - Idempotent, Not Safe]\n    START -->|Partial update| PATCH[PATCH - Not Safe, Not Necessarily Idempotent]\n    START -->|Remove| DELETE[DELETE - Idempotent, Not Safe]\n    GET --> R200[200 OK with resource]\n    POST --> R201[201 Created + Location header]\n    PUT --> R200B[200 OK or 204 No Content]\n    PATCH --> R200C[200 OK with updated resource]\n    DELETE --> R204[204 No Content]"}
      />

      <h2>Idempotency Deep Dive</h2>
      <p>
        Idempotency is one of the most important concepts in API design, especially for
        reliability. In distributed systems, network failures and retries are inevitable.
        If a client sends a request and never receives a response (timeout), it needs to know
        whether it is safe to retry.
      </p>

      <CodeBlock language="http" title="Idempotent vs Non-Idempotent Examples">
        {`# Idempotent: PUT the same data multiple times → same result
PUT /users/42
{ "name": "Alice", "email": "alice@example.com" }
# Call this 1 time or 100 times — user 42 has the same data

# Idempotent: DELETE the same resource multiple times
DELETE /users/42   → 204 No Content
DELETE /users/42   → 404 Not Found (already gone, same end state)

# NOT Idempotent: POST creates a new resource each time
POST /orders
{ "product": "Widget", "quantity": 1 }
# Call this 3 times → 3 separate orders created!

# Danger scenario: Client POSTs, gets timeout, retries
POST /payments
{ "amount": 100.00, "to": "merchant-123" }
# Timeout... client retries... double charge!
# Solution: Use idempotency keys (covered in Advanced lesson)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Network Failures and Retries">
        <p>
          In production, network failures are not edge cases — they happen constantly.
          Load balancers drop connections, TCP timeouts occur, and mobile networks are
          unreliable. Your API must be designed with retries in mind. For non-idempotent
          operations like POST, consider implementing idempotency keys to prevent
          duplicate processing.
        </p>
      </InfoBox>

      <h2>Conditional Requests: ETag, If-Match, and the Lost Update Problem</h2>

      <p>
        Idempotency protects you from your <em>own</em> retries. Conditional requests protect you
        from <em>other people&apos;s</em> writes — and they are the missing piece behind the{' '}
        <code>409 Conflict</code> status mentioned above.
      </p>

      <InfoBox variant="warning" title="The Lost Update Problem">
        <p>
          Two users open the same record. Alice changes the phone number; Bob changes the address.
          Both send a <code>PUT</code> with their full copy of the resource. Bob&apos;s request
          arrives second and overwrites everything — <strong>Alice&apos;s phone number change is
          silently gone</strong>. Nobody gets an error. Nobody finds out until a delivery fails.
        </p>
        <p>
          This is not a rare race. It is the normal outcome any time two people edit the same thing,
          and a plain <code>PUT</code> API has no way to detect it.
        </p>
      </InfoBox>

      <p>
        The fix is <strong>optimistic concurrency control</strong>: the server hands out a version
        marker with every read, and requires the client to present it when writing. If the resource
        has changed since, the write is rejected instead of silently clobbering.
      </p>

      <CodeBlock language="http" title="ETag + If-Match — Optimistic Concurrency">
        {`# 1. Client reads the resource. The server returns a version marker.
GET /api/users/42
HTTP/1.1 200 OK
ETag: "v3-8a7f2c"                <- opaque; a hash or a version number
{ "id": 42, "name": "Alice", "phone": "555-0100" }

# 2. Client writes back, quoting the version it based its edit on.
PUT /api/users/42
If-Match: "v3-8a7f2c"
{ "id": 42, "name": "Alice", "phone": "555-0199" }

# 3a. Still v3 -> the write is applied, and a NEW etag is returned.
HTTP/1.1 200 OK
ETag: "v4-c1d9e0"

# 3b. Someone else already wrote v4 -> REJECTED. Nothing is lost.
HTTP/1.1 412 Precondition Failed
Content-Type: application/problem+json
{
  "type": "https://api.example.com/errors/stale-resource",
  "title": "Precondition Failed",
  "status": 412,
  "detail": "This user was modified by someone else. Re-read it and reapply your change."
}

# 428 Precondition Required: use this to REJECT unconditional writes
# outright, forcing every client to participate rather than letting
# careless ones opt out of the safety mechanism.
PUT /api/users/42          (no If-Match header)
HTTP/1.1 428 Precondition Required`}
      </CodeBlock>

      <InfoBox variant="info" title="The Same Mechanism Saves Bandwidth on Reads">
        <p>
          <code>If-Match</code> guards writes; its read-side sibling{' '}
          <code>If-None-Match</code> powers caching. The client sends back the{' '}
          <code>ETag</code> it already has, and if nothing changed the server replies{' '}
          <code>304 Not Modified</code> with <strong>an empty body</strong> — the client reuses its
          cached copy and you have spent a few hundred bytes instead of a full payload.
        </p>
        <p>
          <code>Last-Modified</code> / <code>If-Modified-Since</code> do the same job with
          timestamps, but they are only accurate to one second and cannot distinguish two changes
          within the same second. Prefer <code>ETag</code> when correctness matters.
        </p>
      </InfoBox>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Header</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Used On</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Means</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Failure Status</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>If-Match</code></td>
            <td style={{ padding: '0.75rem' }}>PUT, PATCH, DELETE</td>
            <td style={{ padding: '0.75rem' }}>&quot;Only apply this if the resource is still the version I read&quot;</td>
            <td style={{ padding: '0.75rem' }}><code>412</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>If-None-Match</code></td>
            <td style={{ padding: '0.75rem' }}>GET</td>
            <td style={{ padding: '0.75rem' }}>&quot;Only send a body if it changed since this version&quot;</td>
            <td style={{ padding: '0.75rem' }}><code>304</code> (a success, not an error)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>If-None-Match: *</code></td>
            <td style={{ padding: '0.75rem' }}>PUT</td>
            <td style={{ padding: '0.75rem' }}>&quot;Create only if it does not already exist&quot; — a safe upsert</td>
            <td style={{ padding: '0.75rem' }}><code>412</code></td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="tip" title="Weak vs Strong ETags — and How to Generate One">
        <p>
          A <strong>strong</strong> ETag (<code>&quot;abc123&quot;</code>) means byte-for-byte
          identical. A <strong>weak</strong> ETag (<code>W/&quot;abc123&quot;</code>) means
          semantically equivalent — useful when a response is re-serialised with different
          whitespace or key order but the same meaning. <code>If-Match</code> requires a strong
          comparison; <code>If-None-Match</code> accepts weak.
        </p>
        <p>
          In practice you rarely hash the body. The cheap and correct approach is to expose your
          database&apos;s existing row version: JPA&apos;s <code>@Version</code> column, Postgres{' '}
          <code>xmin</code>, or an <code>updated_at</code> timestamp. Emit it as the ETag, and let
          the database&apos;s own optimistic-locking check reject the stale write — which is exactly
          what <code>OptimisticLockException</code> already does. Map that exception to a{' '}
          <code>412</code> in your error handler and you are done.
        </p>
      </InfoBox>

      <h2>HTTP Methods in Practice</h2>

      <CodeBlock language="java" title="Spring Boot Controller — Complete CRUD">
        {`@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users — List with pagination
    @GetMapping
    public ResponseEntity<Page<UserDto>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UserDto> users = userService.findAll(PageRequest.of(page, size));
        return ResponseEntity.ok(users);
    }

    // GET /api/users/{id} — Retrieve single resource
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/users — Create new resource
    @PostMapping
    public ResponseEntity<UserDto> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserDto created = userService.create(request);
        URI location = URI.create("/api/users/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    // PUT /api/users/{id} — Full replacement
    @PutMapping("/{id}")
    public ResponseEntity<UserDto> replaceUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserDto updated = userService.replace(id, request);
        return ResponseEntity.ok(updated);
    }

    // PATCH /api/users/{id} — Partial update
    @PatchMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        UserDto updated = userService.partialUpdate(id, updates);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/users/{id} — Remove resource
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Express.js Router — Complete CRUD">
        {`const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { validateUser } = require('../middleware/validation');

// GET /api/users — List with pagination
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 20;
    const result = await userService.findAll({ page, size });
    res.json({
      data: result.items,
      meta: { page, size, total: result.total }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id — Retrieve single resource
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: \`User \${req.params.id} not found\`
      });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/users — Create new resource
router.post('/users', validateUser, async (req, res, next) => {
  try {
    const user = await userService.create(req.body);
    res.status(201)
       .location(\`/api/users/\${user.id}\`)
       .json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id — Full replacement
router.put('/users/:id', validateUser, async (req, res, next) => {
  try {
    const user = await userService.replace(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id — Partial update
router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await userService.partialUpdate(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id — Remove resource
router.delete('/users/:id', async (req, res, next) => {
  try {
    await userService.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;`}
      </CodeBlock>

      <h2>HTTP Status Codes</h2>
      <p>
        Status codes are how the server communicates the result of a request. Using them
        correctly is just as important as using the right HTTP method. Status codes are
        grouped into five classes.
      </p>

      <h3>2xx — Success</h3>
      <InfoBox variant="success" title="Success Codes">
        <p><strong>200 OK</strong> — The request succeeded. Used for successful GET, PUT, PATCH requests that return data.</p>
        <p><strong>201 Created</strong> — A new resource was created. Used after successful POST. Must include a Location header pointing to the new resource.</p>
        <p><strong>204 No Content</strong> — The request succeeded but there is no body to return. Used for successful DELETE or PUT/PATCH when no response body is needed.</p>
      </InfoBox>

      <h3>3xx — Redirection</h3>
      <InfoBox variant="note" title="Redirection Codes">
        <p><strong>301 Moved Permanently</strong> — The resource has been permanently moved to a new URI. Clients should update their bookmarks. Include a Location header.</p>
        <p><strong>304 Not Modified</strong> — Used with conditional requests (If-None-Match, If-Modified-Since). Tells the client its cached version is still current.</p>
      </InfoBox>

      <h3>4xx — Client Errors</h3>
      <InfoBox variant="warning" title="Client Error Codes">
        <p><strong>400 Bad Request</strong> — The request is malformed. Invalid JSON syntax, missing required fields, or invalid data types.</p>
        <p><strong>401 Unauthorized</strong> — Authentication is required and has failed or not been provided. Misleadingly named — it means unauthenticated.</p>
        <p><strong>403 Forbidden</strong> — The client is authenticated but does not have permission. The server understood the request but refuses to authorize it.</p>
        <p><strong>404 Not Found</strong> — The requested resource does not exist. Also used to hide the existence of resources the user is not authorized to see.</p>
        <p><strong>409 Conflict</strong> — The request conflicts with the current state of the resource. Common with concurrent updates or duplicate unique constraints.</p>
        <p><strong>412 Precondition Failed</strong> — An <code>If-Match</code>/<code>If-None-Match</code> precondition did not hold. The resource changed underneath the client; they must re-read and retry. See the conditional-requests section above.</p>
        <p><strong>422 Unprocessable Content</strong> — The request is well-formed but semantically invalid. Validation errors belong here. (RFC 9110 renamed this from &quot;Unprocessable Entity&quot;; both names refer to 422.)</p>
        <p><strong>428 Precondition Required</strong> — The server requires the request to be conditional. Used to force clients to send <code>If-Match</code> so they cannot accidentally clobber concurrent edits.</p>
        <p><strong>429 Too Many Requests</strong> — Rate limit exceeded. Include Retry-After header telling the client when to retry.</p>
      </InfoBox>

      <h3>5xx — Server Errors</h3>
      <InfoBox variant="danger" title="Server Error Codes">
        <p><strong>500 Internal Server Error</strong> — An unexpected error occurred on the server. Never expose stack traces or internal details to clients.</p>
        <p><strong>502 Bad Gateway</strong> — The server, while acting as a gateway or proxy, received an invalid response from an upstream server.</p>
        <p><strong>503 Service Unavailable</strong> — The server is temporarily unable to handle the request. Include a Retry-After header. Used during deployments or overload.</p>
      </InfoBox>

      <CodeBlock language="http" title="Status Code Usage Examples">
        {`# Successful retrieval
GET /api/users/42
HTTP/1.1 200 OK
Content-Type: application/json
{ "id": 42, "name": "Alice" }

# Successful creation
POST /api/users
HTTP/1.1 201 Created
Location: /api/users/43
Content-Type: application/json
{ "id": 43, "name": "Bob" }

# Successful deletion (no body)
DELETE /api/users/42
HTTP/1.1 204 No Content

# Validation error
POST /api/users
HTTP/1.1 422 Unprocessable Entity
{
  "type": "validation-error",
  "title": "Validation Failed",
  "status": 422,
  "errors": [
    { "field": "email", "message": "must be a valid email address" },
    { "field": "name", "message": "must not be blank" }
  ]
}

# Rate limited
GET /api/users
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699900000`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Which HTTP method is idempotent but NOT safe?"}
        options={[
          "GET",
          "POST",
          "PUT",
          "PATCH"
        ]}
        correctIndex={2}
        explanation={"PUT is idempotent (calling it multiple times produces the same result) but not safe (it modifies server state). GET is both safe and idempotent. POST is neither safe nor idempotent. PATCH is not safe and not necessarily idempotent."}
      />

      <InteractiveChallenge
        question={"A client sends a POST request to create a new user, but receives a network timeout with no response. What is the correct concern?"}
        options={[
          "The user was definitely not created",
          "The user was definitely created",
          "The user may or may not have been created — retrying could create a duplicate",
          "The server will automatically roll back the request"
        ]}
        correctIndex={2}
        explanation={"POST is not idempotent — the server may have processed the request before the timeout occurred. Retrying could create a duplicate user. This is why idempotency keys are important for critical POST operations like payments and order creation."}
      />

    </LessonLayout>
  );
}
