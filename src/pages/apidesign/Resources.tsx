import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Resources() {
  return (
    <LessonLayout
      title="Resource Naming & URLs"
      sectionId="apidesign"
      lessonIndex={2}
      prev={{ path: '/apidesign/methods', label: 'HTTP Methods & Status Codes' }}
      next={{ path: '/apidesign/errors', label: 'Error Handling & Responses' }}
    >
      <h2>The Art of Resource Naming</h2>
      <p>
        URL design is one of the most visible aspects of your API. Well-designed URLs make
        an API intuitive and self-documenting. Poorly designed URLs create confusion, increase
        support burden, and make integration harder. A good URL should tell you exactly what
        resource you are working with.
      </p>

      <InfoBox variant="info" title="URLs Are Forever">
        <p>
          Once you publish a URL and clients start using it, changing it becomes extremely
          expensive. You will need redirects, deprecation notices, and migration periods.
          Invest time in getting your URL design right from the start — it is one of the
          most important decisions you will make in API design.
        </p>
      </InfoBox>

      <h2>Rule 1: Use Nouns, Not Verbs</h2>
      <p>
        Resources represent things (nouns), not actions (verbs). The HTTP method already
        describes the action — the URL should only identify the resource. This is one of
        the most common mistakes in API design.
      </p>

      <CodeBlock language="http" title="Nouns vs Verbs in URLs">
        {`# ❌ BAD — Verbs in URLs (RPC-style)
POST   /getUser
POST   /createUser
POST   /deleteUser
GET    /fetchAllOrders
POST   /updateUserEmail
GET    /searchProducts
POST   /sendEmail

# ✅ GOOD — Nouns as resources, HTTP methods as verbs
GET    /users/42          # Get user (the GET method is the verb)
POST   /users             # Create user (POST is the verb)
DELETE /users/42          # Delete user (DELETE is the verb)
GET    /orders            # List orders
PATCH  /users/42          # Partially update user
GET    /products?q=widget # Search products via query params
POST   /emails            # Send an email (create an email resource)`}
      </CodeBlock>

      <h2>Rule 2: Use Plural Resource Names</h2>
      <p>
        Always use plural nouns for resource collections. This maintains consistency
        whether you are accessing a collection or a single item within it. Mixing singular
        and plural names creates confusion and inconsistency.
      </p>

      <CodeBlock language="http" title="Plural vs Singular">
        {`# ❌ BAD — Inconsistent singular/plural
GET /user/42
GET /users
GET /order/100
GET /product

# ❌ BAD — Singular everywhere
GET /user
GET /user/42

# ✅ GOOD — Plural everywhere
GET /users           # Collection of users
GET /users/42        # Single user within the collection
POST /users          # Create in the users collection
GET /orders          # Collection of orders
GET /orders/100      # Single order
GET /products        # Collection of products
GET /products/abc    # Single product`}
      </CodeBlock>

      <InfoBox variant="tip" title="Exception: Singleton Resources">
        <p>
          Some resources are singletons within a context — use singular for these.
          For example: <code>GET /users/42/profile</code> (a user has one profile),
          <code>GET /configuration</code> (system has one config),
          <code>GET /me</code> (the authenticated user). These represent a single
          resource, not a collection.
        </p>
      </InfoBox>

      <h2>Rule 3: Nesting for Relationships</h2>
      <p>
        Use URL nesting to express parent-child relationships between resources. If a
        resource only exists in the context of another, nest it under the parent. But
        avoid nesting deeper than two levels — it makes URLs hard to work with.
      </p>

      <CodeBlock language="http" title="Resource Nesting">
        {`# ✅ GOOD — Clear parent-child relationships
GET /users/42/orders              # Orders belonging to user 42
GET /users/42/orders/100          # Order 100 of user 42
GET /orders/100/items             # Items in order 100
POST /users/42/addresses          # Create an address for user 42

# ❌ BAD — Too deep (more than 2 levels)
GET /users/42/orders/100/items/5/reviews/3
GET /companies/1/departments/2/teams/3/members/4

# ✅ GOOD — Flatten deep nesting
GET /order-items/5/reviews/3      # Access the item directly
GET /team-members/4               # Access the member directly

# ✅ GOOD — Use query params for deep filtering
GET /reviews?orderId=100&itemId=5
GET /members?teamId=3`}
      </CodeBlock>

      <FlowChart
        title="URL Design Decision Flow"
        chart={"graph TD\n    START[New Resource Endpoint] -->|Is it a collection?| PLURAL[Use plural noun: /resources]\n    PLURAL -->|Accessing single item?| SINGLE[Add ID: /resources/id]\n    SINGLE -->|Has child resources?| NESTED{Nesting depth?}\n    NESTED -->|1-2 levels| NEST[Nest: /resources/id/children]\n    NESTED -->|3+ levels| FLAT[Flatten or use query params]\n    START -->|Is it a singleton?| SING[Use singular: /resource]\n    START -->|Is it an action?| ACTION{Can it be modeled as a resource?}\n    ACTION -->|Yes| RESOURCE[Model as resource: POST /emails]\n    ACTION -->|No| SUB[POST /resources/id/action]"}
      />

      <h2>Rule 4: Query Parameters for Filtering, Sorting, and Pagination</h2>
      <p>
        Use query parameters for operations that do not identify a resource but modify
        how a collection is returned. Filtering, sorting, searching, pagination, and
        field selection all belong in query parameters.
      </p>

      <CodeBlock language="http" title="Query Parameter Patterns">
        {`# Pagination
GET /users?page=2&size=20
GET /users?offset=40&limit=20
GET /users?cursor=eyJpZCI6NDJ9

# Filtering
GET /users?status=active
GET /users?role=admin&status=active
GET /products?minPrice=10&maxPrice=100
GET /orders?createdAfter=2024-01-01

# Sorting
GET /users?sort=name:asc
GET /users?sort=createdAt:desc,name:asc
GET /products?sort=-price,name     # - prefix for descending

# Searching
GET /users?q=alice
GET /products?search=wireless+keyboard

# Field selection (sparse fieldsets)
GET /users?fields=id,name,email
GET /users/42?fields=name,email

# Combining everything
GET /products?category=electronics&minPrice=50&sort=-rating&page=1&size=10&fields=id,name,price,rating`}
      </CodeBlock>

      <h2>Rule 5: URL Conventions</h2>
      <p>
        Consistency in URL formatting is critical. Establish conventions early and enforce
        them across all endpoints.
      </p>

      <CodeBlock language="http" title="URL Convention Rules">
        {`# ✅ GOOD — Lowercase with hyphens for multi-word resources
GET /user-profiles
GET /order-items
GET /shipping-addresses
GET /api/v1/line-items

# ❌ BAD — camelCase
GET /userProfiles
GET /orderItems

# ❌ BAD — snake_case
GET /user_profiles
GET /order_items

# ❌ BAD — PascalCase
GET /UserProfiles
GET /OrderItems

# ✅ GOOD — No trailing slashes
GET /users
GET /users/42

# ❌ BAD — Trailing slashes
GET /users/
GET /users/42/

# ✅ GOOD — No file extensions in URLs
GET /users/42
Accept: application/json

# ❌ BAD — File extensions
GET /users/42.json
GET /users/42.xml

# ✅ GOOD — Consistent API prefix
GET /api/v1/users
GET /api/v1/orders

# ❌ BAD — Inconsistent prefixes
GET /api/users
GET /v1/orders
GET /service/products`}
      </CodeBlock>

      <h2>Sub-Resources vs Flat URLs</h2>
      <p>
        Choosing between nested (sub-resource) and flat URL structures is a common design
        decision. Each approach has trade-offs.
      </p>

      <CodeBlock language="http" title="Sub-Resources vs Flat URLs">
        {`# Sub-resource approach — shows ownership
GET /users/42/orders          # Orders belong to user 42
POST /users/42/orders         # Create order for user 42

# Flat approach — independent access
GET /orders?userId=42         # Filter orders by user
POST /orders                  # Create order (userId in body)

# When to use sub-resources:
# - The child cannot exist without the parent
# - You always access the child through the parent
# - The relationship is strong and clear

# When to use flat URLs:
# - The child can exist independently
# - You often search across all children (not just one parent)
# - You need complex filtering across multiple parents

# Practical example: Blog posts and comments
GET /posts/1/comments         # Comments on post 1 (sub-resource ✅)
GET /comments?since=2024-01   # Recent comments across all posts (flat ✅)
GET /comments/567             # Direct access to a specific comment (flat ✅)`}
      </CodeBlock>

      <InfoBox variant="note" title="Both Approaches Can Coexist">
        <p>
          It is perfectly valid to support both sub-resource and flat URLs for the same
          resource. <code>GET /users/42/orders</code> for scoped access and
          <code>GET /orders?userId=42</code> for flexible querying can both exist.
          The sub-resource URL is more semantically expressive, while the flat URL
          supports complex cross-cutting queries.
        </p>
      </InfoBox>

      <h2>HATEOAS Links in Responses</h2>
      <p>
        Hypermedia As The Engine Of Application State (HATEOAS) means that API responses
        include links to related resources and available actions. This allows clients to
        discover the API dynamically rather than hardcoding URLs.
      </p>

      <CodeBlock language="json" title="HATEOAS Response Example">
        {`{
  "id": 42,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "status": "active",
  "_links": {
    "self": {
      "href": "/api/users/42"
    },
    "orders": {
      "href": "/api/users/42/orders"
    },
    "profile": {
      "href": "/api/users/42/profile"
    },
    "deactivate": {
      "href": "/api/users/42/deactivate",
      "method": "POST"
    }
  }
}

// Collection with pagination links
{
  "data": [...],
  "meta": {
    "page": 2,
    "size": 20,
    "total": 156
  },
  "_links": {
    "self": { "href": "/api/users?page=2&size=20" },
    "first": { "href": "/api/users?page=1&size=20" },
    "prev": { "href": "/api/users?page=1&size=20" },
    "next": { "href": "/api/users?page=3&size=20" },
    "last": { "href": "/api/users?page=8&size=20" }
  }
}`}
      </CodeBlock>

      <h2>Comprehensive Examples: Bad vs Good</h2>

      <CodeBlock language="http" title="Complete Bad vs Good Comparison">
        {`# ===== ❌ BAD URL DESIGN =====

POST /api/getUserById              # Verb in URL
GET  /api/user/42                  # Singular resource name
GET  /api/Users/42                 # PascalCase
GET  /api/user_profiles/42         # snake_case
POST /api/createOrder              # Verb in URL
GET  /api/orders/getByUser/42      # Verb in nested path
GET  /api/orders?action=list       # Action as query param
POST /api/orders/42/cancelOrder    # Redundant verb
GET  /api/v1/users/42/orders/100/items/5/reviews  # Too deep
POST /api/sendNotification         # Verb, not resource

# ===== ✅ GOOD URL DESIGN =====

GET    /api/users/42               # Noun, plural, lowercase
GET    /api/user-profiles/42       # Hyphenated multi-word
POST   /api/orders                 # Create via POST to collection
GET    /api/users/42/orders        # Clear relationship
POST   /api/orders/42/cancel       # Action as sub-resource
GET    /api/order-items?orderId=100  # Flat with filter
POST   /api/notifications          # Resource noun
GET    /api/products?q=widget&sort=price:asc&page=1&size=20
PATCH  /api/users/42               # Partial update
DELETE /api/users/42/addresses/3   # Two-level nesting`}
      </CodeBlock>

      <CodeBlock language="java" title="Spring Boot — Well-Designed Resource URLs">
        {`@RestController
@RequestMapping("/api/users")
public class UserController {

    // GET /api/users — list with filtering and pagination
    @GetMapping
    public ResponseEntity<PagedResponse<UserDto>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sort) {
        UserFilter filter = new UserFilter(status, sort);
        return ResponseEntity.ok(userService.findAll(filter, page, size));
    }

    // GET /api/users/{id} — single resource
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/users/{id}/orders — nested sub-resource
    @GetMapping("/{id}/orders")
    public ResponseEntity<List<OrderDto>> getUserOrders(
            @PathVariable Long id,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(orderService.findByUserId(id, status));
    }

    // POST /api/users/{id}/addresses — create nested resource
    @PostMapping("/{id}/addresses")
    public ResponseEntity<AddressDto> addAddress(
            @PathVariable Long id,
            @Valid @RequestBody CreateAddressRequest request) {
        AddressDto address = addressService.create(id, request);
        URI location = URI.create("/api/users/" + id + "/addresses/" + address.getId());
        return ResponseEntity.created(location).body(address);
    }
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Express.js — Well-Designed Resource URLs">
        {`const express = require('express');
const router = express.Router();

// GET /api/users — list with filtering, sorting, pagination
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, size = 20, status, sort, q } = req.query;
    const result = await userService.findAll({
      page: parseInt(page),
      size: parseInt(size),
      filters: { status },
      sort: parseSort(sort),
      search: q
    });

    res.json({
      data: result.items,
      meta: { page: parseInt(page), size: parseInt(size), total: result.total },
      _links: {
        self: \`/api/users?page=\${page}&size=\${size}\`,
        next: result.hasNext ? \`/api/users?page=\${parseInt(page) + 1}&size=\${size}\` : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:userId/orders — nested sub-resource
router.get('/users/:userId/orders', async (req, res, next) => {
  try {
    const orders = await orderService.findByUserId(req.params.userId, req.query);
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:userId/addresses — create nested resource
router.post('/users/:userId/addresses', async (req, res, next) => {
  try {
    const address = await addressService.create(req.params.userId, req.body);
    res.status(201)
       .location(\`/api/users/\${req.params.userId}/addresses/\${address.id}\`)
       .json(address);
  } catch (err) {
    next(err);
  }
});

module.exports = router;`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Which URL correctly follows REST resource naming conventions?"}
        options={[
          "POST /api/createUser",
          "GET /api/user/42",
          "GET /api/users/42/orders",
          "GET /api/fetchUserOrders?userId=42"
        ]}
        correctIndex={2}
        explanation={"GET /api/users/42/orders follows REST conventions: it uses plural nouns (users, orders), expresses the parent-child relationship through nesting, uses no verbs in the URL, and relies on the HTTP method (GET) for the action. The others use verbs in URLs or singular resource names."}
      />

      <InteractiveChallenge
        question={"You need to search for products with a price range and sort by rating. Which URL design is most RESTful?"}
        options={[
          "POST /api/searchProducts { minPrice: 10, maxPrice: 100, sortBy: 'rating' }",
          "GET /api/products/search/price/10/100/sort/rating",
          "GET /api/products?minPrice=10&maxPrice=100&sort=rating:desc",
          "GET /api/getFilteredProducts?min=10&max=100"
        ]}
        correctIndex={2}
        explanation={"Query parameters are the correct place for filtering, sorting, and searching. GET /api/products with query params uses the correct HTTP method for reading, plural noun for the resource, and query parameters for modifying the result set. POST should not be used for read operations, and embedding filter values in the URL path is not RESTful."}
      />

    </LessonLayout>
  );
}
