import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="REST Principles"
      sectionId="apidesign"
      lessonIndex={0}
      prev={null}
      next={{ path: '/apidesign/methods', label: 'HTTP Methods & Status Codes' }}
    >
      <h2>What Is REST?</h2>
      <p>
        REST, or <strong>Representational State Transfer</strong>, is an architectural style
        for designing networked applications. It was introduced by Roy Fielding in his 2000
        doctoral dissertation at the University of California, Irvine. REST is not a protocol
        or a standard — it is a set of architectural constraints that, when applied to web
        services, produce systems that are scalable, loosely coupled, and easy to maintain.
      </p>
      <p>
        At its core, REST treats everything as a <strong>resource</strong> — a user, an order,
        a product, a document. Each resource is identified by a unique URI, and clients interact
        with resources by exchanging <strong>representations</strong> (typically JSON or XML)
        using standard HTTP methods.
      </p>

      <InfoBox variant="info" title="REST Is Not HTTP">
        <p>
          A common misconception is that REST and HTTP are the same thing. REST is an
          architectural style that can theoretically work over any protocol, but in practice
          it is almost always implemented over HTTP. HTTP provides the verbs (GET, POST, PUT,
          DELETE), status codes, and header mechanisms that map naturally to REST constraints.
        </p>
      </InfoBox>

      <h2>The 6 REST Constraints</h2>
      <p>
        For an API to be truly RESTful, it must adhere to six architectural constraints
        defined by Fielding. Understanding these constraints is essential to designing APIs
        that scale and evolve gracefully.
      </p>

      <h3>1. Client-Server Separation</h3>
      <p>
        The client and server must be independent of each other. The client handles the user
        interface and user experience, while the server handles data storage, business logic,
        and security. This separation allows each side to evolve independently — you can
        completely rewrite your frontend without touching the backend, and vice versa.
      </p>

      <h3>2. Statelessness</h3>
      <p>
        Every request from the client must contain all the information needed for the server
        to process it. The server does not store any client context between requests. This
        means no server-side sessions — authentication tokens, user preferences, and context
        must all be sent with every request. Statelessness enables horizontal scaling because
        any server instance can handle any request.
      </p>

      <h3>3. Cacheability</h3>
      <p>
        Responses must explicitly define themselves as cacheable or non-cacheable. When a
        response is cacheable, the client (or intermediary proxies) can reuse that response
        for subsequent equivalent requests. Proper caching eliminates redundant interactions,
        reduces latency, and improves perceived performance.
      </p>

      <h3>4. Uniform Interface</h3>
      <p>
        This is the most fundamental constraint of REST. The uniform interface simplifies
        and decouples the architecture by defining four sub-constraints:
      </p>
      <ul>
        <li><strong>Resource Identification</strong> — Resources are identified by URIs</li>
        <li><strong>Resource Manipulation Through Representations</strong> — Clients hold representations (JSON, XML) that contain enough info to modify or delete the resource</li>
        <li><strong>Self-Descriptive Messages</strong> — Each message includes enough information to describe how to process it (Content-Type headers, status codes)</li>
        <li><strong>HATEOAS</strong> — Hypermedia As The Engine Of Application State — responses contain links to related actions and resources</li>
      </ul>

      <h3>5. Layered System</h3>
      <p>
        A client cannot tell whether it is connected directly to the end server or to an
        intermediary. Layers such as load balancers, API gateways, caching proxies, and
        authentication servers can be inserted without the client knowing. Each layer only
        interacts with adjacent layers, promoting encapsulation and security.
      </p>

      <h3>6. Code on Demand (Optional)</h3>
      <p>
        The only optional constraint — servers can temporarily extend client functionality
        by sending executable code (like JavaScript). This is rarely used in modern REST APIs
        but is part of the original specification.
      </p>

      <FlowChart
        title="REST Architecture Overview"
        chart={"graph TD\n    CLIENT[Client Application] -->|HTTP Request| GW[API Gateway / Load Balancer]\n    GW -->|Route| SERVER[REST API Server]\n    SERVER -->|Query| DB[(Database)]\n    SERVER -->|JSON Response| GW\n    GW -->|Cached or Fresh Response| CLIENT\n    CLIENT -->|Contains Auth Token| GW\n    CACHE[Cache Layer] -.->|Cached Response| GW\n    GW -.->|Store in Cache| CACHE"}
      />

      <h2>The Richardson Maturity Model</h2>
      <p>
        Leonard Richardson proposed a model that breaks down the principal elements of a REST
        approach into three levels. It provides a useful way to think about how RESTful
        your API actually is.
      </p>

      <h3>Level 0 — The Swamp of POX</h3>
      <p>
        A single URI endpoint that accepts all operations. Think of a SOAP service with one
        URL and XML payloads that describe what action to take. There is no use of HTTP
        methods or URIs to distinguish operations.
      </p>

      <CodeBlock language="http" title="Level 0 — Single Endpoint">
        {`POST /api HTTP/1.1
Content-Type: application/json

{
  "action": "getUser",
  "userId": 42
}

POST /api HTTP/1.1
Content-Type: application/json

{
  "action": "deleteUser",
  "userId": 42
}`}
      </CodeBlock>

      <h3>Level 1 — Resources</h3>
      <p>
        Individual resources are identified by unique URIs, but all operations still use a
        single HTTP method (usually POST). The API now has structure, but does not leverage
        HTTP semantics.
      </p>

      <CodeBlock language="http" title="Level 1 — Resources but Only POST">
        {`POST /users/42 HTTP/1.1
{ "action": "get" }

POST /users/42 HTTP/1.1
{ "action": "delete" }`}
      </CodeBlock>

      <h3>Level 2 — HTTP Verbs</h3>
      <p>
        Operations use the correct HTTP methods — GET for reading, POST for creating,
        PUT/PATCH for updating, DELETE for removing. Status codes are used properly. This
        is where most modern REST APIs operate.
      </p>

      <CodeBlock language="http" title="Level 2 — Proper HTTP Methods">
        {`GET /users/42 HTTP/1.1
200 OK

DELETE /users/42 HTTP/1.1
204 No Content

POST /users HTTP/1.1
{ "name": "Alice", "email": "alice@example.com" }
201 Created`}
      </CodeBlock>

      <h3>Level 3 — Hypermedia Controls (HATEOAS)</h3>
      <p>
        Responses include links that tell the client what actions are available next.
        The client does not need to hardcode URIs — it discovers them through the API.
        This is the glory of REST as Fielding originally described it.
      </p>

      <CodeBlock language="json" title="Level 3 — HATEOAS Response">
        {`{
  "id": 42,
  "name": "Alice",
  "email": "alice@example.com",
  "_links": {
    "self": { "href": "/users/42" },
    "orders": { "href": "/users/42/orders" },
    "update": { "href": "/users/42", "method": "PUT" },
    "delete": { "href": "/users/42", "method": "DELETE" }
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Most APIs Stop at Level 2">
        <p>
          In practice, most production APIs implement Level 2 of the Richardson Maturity
          Model. Full HATEOAS (Level 3) adds complexity that many teams find hard to justify.
          However, including basic self-links and pagination links is a good compromise that
          provides some hypermedia benefits without the full overhead.
        </p>
      </InfoBox>

      <h2>RESTful vs REST-like</h2>
      <p>
        There is an important distinction between APIs that are truly <strong>RESTful</strong>
        (adhering to all six constraints, including HATEOAS) and those that are <strong>
        REST-like</strong> (using HTTP methods and resource URIs but not fully implementing
        all constraints). Most APIs marketed as REST are actually REST-like.
      </p>

      <CodeBlock language="javascript" title="A REST-like Express API (Level 2)">
        {`const express = require('express');
const router = express.Router();

// GET a single user — proper resource URI and HTTP method
router.get('/users/:id', async (req, res) => {
  const user = await UserService.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST to create — returns 201 with Location header
router.post('/users', async (req, res) => {
  const user = await UserService.create(req.body);
  res.status(201)
     .location(\`/users/\${user.id}\`)
     .json(user);
});

// PUT to fully replace
router.put('/users/:id', async (req, res) => {
  const user = await UserService.replace(req.params.id, req.body);
  res.json(user);
});

// DELETE with 204 No Content
router.delete('/users/:id', async (req, res) => {
  await UserService.delete(req.params.id);
  res.status(204).send();
});`}
      </CodeBlock>

      <h2>Why Good API Design Matters</h2>

      <InfoBox variant="warning" title="Bad APIs Are Expensive">
        <p>
          A poorly designed API is one of the most costly technical mistakes an organization
          can make. Once an API is published and consumers depend on it, changing it becomes
          extremely difficult. Breaking changes require versioning, migration guides, and
          deprecation periods. Good upfront design prevents years of maintenance headaches.
        </p>
      </InfoBox>

      <p>
        Good API design matters because APIs are <strong>contracts</strong>. They are promises
        to external and internal consumers. Here is what good API design gives you:
      </p>
      <ul>
        <li><strong>Developer Experience</strong> — Intuitive APIs reduce onboarding time and support burden</li>
        <li><strong>Scalability</strong> — Statelessness and cacheability allow horizontal scaling</li>
        <li><strong>Evolvability</strong> — Loose coupling means the server can change internally without breaking clients</li>
        <li><strong>Reliability</strong> — Proper status codes and error messages make debugging easier</li>
        <li><strong>Interoperability</strong> — Standard HTTP semantics let any language or platform consume the API</li>
      </ul>

      <h2>Real-World Examples: Good vs Bad</h2>

      <CodeBlock language="http" title="Bad API Design">
        {`# Verb in the URL — not RESTful
POST /api/getUserById
{ "id": 42 }

# Inconsistent naming
GET /api/Users/42
GET /api/fetch-orders?userId=42
GET /api/product_list

# Using 200 for everything
200 OK
{ "success": false, "error": "User not found" }

# No pagination on a collection
GET /api/users  → returns 50,000 records`}
      </CodeBlock>

      <CodeBlock language="http" title="Good API Design">
        {`# Resources are nouns, plural, consistent
GET /api/users/42
GET /api/users/42/orders
GET /api/products

# Proper status codes
404 Not Found
{ "type": "about:blank", "title": "Not Found", "status": 404 }

# Paginated collection with metadata
GET /api/users?page=1&size=20
200 OK
{
  "data": [...],
  "meta": { "page": 1, "size": 20, "total": 1234 },
  "links": {
    "next": "/api/users?page=2&size=20",
    "prev": null
  }
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Which of the following is NOT one of the six REST constraints defined by Roy Fielding?"}
        options={[
          "Statelessness",
          "Client-Server separation",
          "Database normalization",
          "Uniform Interface"
        ]}
        correctIndex={2}
        explanation={"Database normalization is a relational database concept, not a REST constraint. The six REST constraints are: Client-Server, Stateless, Cacheable, Uniform Interface, Layered System, and Code on Demand (optional)."}
      />

      <InteractiveChallenge
        question={"At which level of the Richardson Maturity Model does an API start using proper HTTP methods (GET, POST, PUT, DELETE)?"}
        options={[
          "Level 0 — The Swamp of POX",
          "Level 1 — Resources",
          "Level 2 — HTTP Verbs",
          "Level 3 — Hypermedia Controls"
        ]}
        correctIndex={2}
        explanation={"Level 2 is where APIs start using HTTP methods correctly. Level 0 uses a single endpoint for everything, Level 1 introduces unique resource URIs but still uses POST for all operations, and Level 3 adds HATEOAS links to responses."}
      />

    </LessonLayout>
  );
}
