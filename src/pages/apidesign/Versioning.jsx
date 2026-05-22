import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Versioning() {
  return (
    <LessonLayout
      title="Versioning & Pagination"
      sectionId="apidesign"
      lessonIndex={4}
      prev={{ path: '/apidesign/errors', label: 'Error Handling & Responses' }}
      next={{ path: '/apidesign/advanced', label: 'Advanced API Patterns' }}
    >
      <h2>Why API Versioning Matters</h2>
      <p>
        APIs evolve over time. New features are added, data models change, and sometimes
        breaking changes are unavoidable. Without versioning, any change risks breaking
        existing clients. API versioning lets you introduce breaking changes safely while
        giving consumers time to migrate to the new version.
      </p>
      <p>
        The key principle is: <strong>never break existing clients</strong>. If you need to
        make an incompatible change, create a new version and maintain the old one until
        all consumers have migrated.
      </p>

      <InfoBox variant="info" title="What Counts as a Breaking Change?">
        <p>
          Breaking changes include: removing a field, renaming a field, changing a field type,
          removing an endpoint, changing the URL structure, changing required parameters,
          or altering the semantics of an operation. Non-breaking changes include: adding
          optional fields, adding new endpoints, adding optional query parameters, or adding
          new enum values (if clients handle unknown values gracefully).
        </p>
      </InfoBox>

      <h2>Versioning Strategies</h2>

      <h3>1. URL Path Versioning</h3>
      <p>
        The version number is embedded directly in the URL path. This is the most common
        and most visible approach. It is easy to understand, easy to route, and easy to
        test with curl or a browser.
      </p>

      <CodeBlock language="http" title="URL Path Versioning">
        {`# Version in the URL path
GET /api/v1/users/42
GET /api/v2/users/42

# Pros:
# ✅ Highly visible — easy to see which version you are using
# ✅ Easy to route in API gateways and load balancers
# ✅ Simple to test with curl or browser
# ✅ Easy to cache (different URLs = different cache entries)
# ✅ Most widely adopted pattern

# Cons:
# ❌ Pollutes the URI (purists argue URIs should identify resources, not versions)
# ❌ Can lead to URL proliferation
# ❌ Clients must update all URLs when migrating`}
      </CodeBlock>

      <h3>2. Query Parameter Versioning</h3>
      <CodeBlock language="http" title="Query Parameter Versioning">
        {`# Version as a query parameter
GET /api/users/42?version=1
GET /api/users/42?v=2

# Pros:
# ✅ Clean base URLs
# ✅ Easy to default to latest version if omitted
# ✅ No URL path changes needed

# Cons:
# ❌ Easy to forget the parameter
# ❌ Can complicate caching
# ❌ Less visible than path versioning
# ❌ Mixes resource identification with version selection`}
      </CodeBlock>

      <h3>3. Header Versioning (Custom Header)</h3>
      <CodeBlock language="http" title="Custom Header Versioning">
        {`# Version in a custom request header
GET /api/users/42
X-API-Version: 1

GET /api/users/42
X-API-Version: 2

# Pros:
# ✅ Clean URLs — no version in the path or query string
# ✅ Separates versioning concern from resource identification
# ✅ Flexible — can add other metadata headers

# Cons:
# ❌ Invisible in browser address bar
# ❌ Harder to test with curl (must remember the header)
# ❌ API gateways may not route based on custom headers easily
# ❌ Clients must remember to set the header`}
      </CodeBlock>

      <h3>4. Content Negotiation (Accept Header)</h3>
      <CodeBlock language="http" title="Content Negotiation Versioning">
        {`# Version via the Accept header with vendor media types
GET /api/users/42
Accept: application/vnd.example.v1+json

GET /api/users/42
Accept: application/vnd.example.v2+json

# Pros:
# ✅ Most RESTfully pure approach (uses HTTP content negotiation)
# ✅ Clean URLs
# ✅ Allows version + format in a single header

# Cons:
# ❌ Complex Accept header syntax
# ❌ Difficult to test in browser
# ❌ Many developers find it unintuitive
# ❌ Caching becomes more complex (Vary: Accept header needed)`}
      </CodeBlock>

      <FlowChart
        title="Choosing a Versioning Strategy"
        chart={"graph TD\n    START[Need API Versioning] --> Q1{Is simplicity the top priority?}\n    Q1 -->|Yes| URL[URL Path Versioning /api/v1/]\n    Q1 -->|No| Q2{Is URL purity important?}\n    Q2 -->|Yes| Q3{Want full REST compliance?}\n    Q3 -->|Yes| CONTENT[Content Negotiation Accept header]\n    Q3 -->|No| HEADER[Custom Header X-API-Version]\n    Q2 -->|No| Q4{Need easy default version?}\n    Q4 -->|Yes| QUERY[Query Param ?v=1]\n    Q4 -->|No| URL\n    URL --> REC1[Most recommended for public APIs]\n    HEADER --> REC2[Good for internal APIs]\n    CONTENT --> REC3[Purest but most complex]\n    QUERY --> REC4[Simple but easy to forget]"}
      />

      <InfoBox variant="tip" title="Recommendation: URL Path Versioning">
        <p>
          For most teams and most APIs, URL path versioning is the best choice. It is the
          simplest to implement, easiest to understand, and most widely adopted. Companies
          like Stripe, GitHub, Twitter, and Google all use URL path versioning. Save the
          more exotic approaches for situations with specific requirements.
        </p>
      </InfoBox>

      <h2>Pagination Patterns</h2>
      <p>
        Any collection endpoint that could return more than a handful of items must support
        pagination. Without it, you risk returning enormous payloads that slow down clients,
        overload servers, and consume excessive bandwidth. There are three main pagination
        strategies, each with different trade-offs.
      </p>

      <h3>Offset-Based Pagination</h3>
      <CodeBlock language="http" title="Offset-Based Pagination">
        {`# Request
GET /api/users?page=3&size=20

# Response
{
  "data": [...],
  "meta": {
    "page": 3,
    "size": 20,
    "total": 1234,
    "totalPages": 62
  },
  "links": {
    "self":  "/api/users?page=3&size=20",
    "first": "/api/users?page=1&size=20",
    "prev":  "/api/users?page=2&size=20",
    "next":  "/api/users?page=4&size=20",
    "last":  "/api/users?page=62&size=20"
  }
}

# Pros: ✅ Simple, ✅ Jump to any page, ✅ Total count available
# Cons: ❌ Inconsistent with inserts/deletes (items shift),
#        ❌ Performance degrades with large offsets (OFFSET 100000)`}
      </CodeBlock>

      <h3>Cursor-Based Pagination</h3>
      <CodeBlock language="http" title="Cursor-Based Pagination">
        {`# First page
GET /api/users?limit=20

# Response includes an opaque cursor
{
  "data": [...],
  "meta": {
    "hasNext": true,
    "cursor": "eyJpZCI6NDIsImNyZWF0ZWQiOiIyMDI0LTAxLTE1In0="
  },
  "links": {
    "next": "/api/users?limit=20&cursor=eyJpZCI6NDIsImNyZWF0ZWQiOiIyMDI0LTAxLTE1In0="
  }
}

# Next page using cursor
GET /api/users?limit=20&cursor=eyJpZCI6NDIsImNyZWF0ZWQiOiIyMDI0LTAxLTE1In0=

# Pros: ✅ Consistent results even with inserts/deletes
#        ✅ Efficient (uses indexed WHERE clause, not OFFSET)
#        ✅ Works well with real-time data
# Cons: ❌ Cannot jump to arbitrary page
#        ❌ Total count requires separate query
#        ❌ Cursor is opaque (harder to debug)`}
      </CodeBlock>

      <h3>Keyset Pagination</h3>
      <CodeBlock language="http" title="Keyset Pagination">
        {`# Uses the last seen value as the starting point
GET /api/users?limit=20&after_id=42&sort=id:asc

# Response
{
  "data": [
    { "id": 43, "name": "..." },
    { "id": 44, "name": "..." },
    ...
    { "id": 62, "name": "..." }
  ],
  "meta": {
    "hasNext": true,
    "lastId": 62
  },
  "links": {
    "next": "/api/users?limit=20&after_id=62&sort=id:asc"
  }
}

# Keyset is essentially cursor pagination with a transparent cursor
# The "cursor" is the last known value of the sort key
# Pros: ✅ All the benefits of cursor pagination
#        ✅ Transparent — easy to understand and debug
# Cons: ❌ Requires a unique, sequential sort key
#        ❌ Cannot jump to arbitrary pages`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Use Which Pagination">
        <p>
          <strong>Offset-based</strong>: Best for admin dashboards and UIs with page numbers.
          Use when total counts are needed and data does not change frequently.
        </p>
        <p>
          <strong>Cursor-based</strong>: Best for feeds, timelines, and real-time data. Use
          when data changes frequently and consistent results matter.
        </p>
        <p>
          <strong>Keyset</strong>: Best when you have a natural sort key (like id or timestamp)
          and want transparent pagination without the complexity of opaque cursors.
        </p>
      </InfoBox>

      <h2>Filtering and Sorting Conventions</h2>
      <p>
        Consistent filtering and sorting conventions make your API predictable and easy to
        use. Choose a convention and apply it uniformly across all endpoints.
      </p>

      <CodeBlock language="http" title="Filtering and Sorting Patterns">
        {`# Simple equality filters
GET /api/users?status=active
GET /api/users?role=admin&department=engineering

# Bracket notation for operators (JSON:API style)
GET /api/products?filter[price][gte]=10&filter[price][lte]=100
GET /api/orders?filter[status]=pending,processing
GET /api/users?filter[createdAt][after]=2024-01-01

# LHS bracket notation
GET /api/products?price[gte]=10&price[lte]=100

# Sorting
GET /api/users?sort=name:asc
GET /api/users?sort=createdAt:desc,name:asc
GET /api/products?sort=-price,name        # - prefix for descending

# Field selection (sparse fieldsets)
GET /api/users?fields=id,name,email
GET /api/users?fields[user]=id,name&fields[order]=id,total

# Full example combining everything
GET /api/products?filter[category]=electronics&filter[price][lte]=500&sort=-rating,price&fields=id,name,price,rating&page=1&size=20`}
      </CodeBlock>

      <CodeBlock language="java" title="Spring Boot — Pagination and Filtering">
        {`@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<PagedResponse<ProductDto>> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "name:asc") String sort) {

        ProductFilter filter = ProductFilter.builder()
                .category(category)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .build();

        Sort sortSpec = parseSortParameter(sort);
        PageRequest pageRequest = PageRequest.of(page, size, sortSpec);

        Page<ProductDto> result = productService.findAll(filter, pageRequest);

        return ResponseEntity.ok(PagedResponse.<ProductDto>builder()
                .data(result.getContent())
                .meta(PaginationMeta.builder()
                        .page(page)
                        .size(size)
                        .total(result.getTotalElements())
                        .totalPages(result.getTotalPages())
                        .build())
                .build());
    }

    private Sort parseSortParameter(String sort) {
        return Arrays.stream(sort.split(","))
                .map(s -> {
                    String[] parts = s.split(":");
                    String field = parts[0];
                    Sort.Direction dir = parts.length > 1 && parts[1].equalsIgnoreCase("desc")
                            ? Sort.Direction.DESC : Sort.Direction.ASC;
                    return Sort.Order.by(field).with(dir);
                })
                .collect(Collectors.collectingAndThen(
                        Collectors.toList(), Sort.by()));
    }
}`}
      </CodeBlock>

      <h2>Rate Limiting</h2>
      <p>
        Rate limiting protects your API from abuse, prevents resource exhaustion, and
        ensures fair usage among consumers. It is essential for any production API. There
        are several common algorithms for implementing rate limits.
      </p>

      <h3>Token Bucket Algorithm</h3>
      <p>
        Each client has a bucket that fills with tokens at a fixed rate. Each request
        consumes one token. When the bucket is empty, requests are rejected. The bucket
        has a maximum capacity, so tokens do not accumulate indefinitely. This allows
        short bursts of traffic up to the bucket size.
      </p>

      <h3>Sliding Window Algorithm</h3>
      <p>
        Counts requests within a sliding time window (e.g., the last 60 seconds). Unlike
        fixed windows, this prevents the boundary burst problem where a client could make
        double the allowed requests by timing them around a window boundary.
      </p>

      <CodeBlock language="http" title="Rate Limiting Headers">
        {`# Standard rate limit headers in a response
HTTP/1.1 200 OK
X-RateLimit-Limit: 100         # Max requests per window
X-RateLimit-Remaining: 73      # Requests remaining in this window
X-RateLimit-Reset: 1699900060  # Unix timestamp when the window resets

# When rate limited
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699900060
Retry-After: 30                 # Seconds until the client should retry

{
  "type": "https://api.example.com/errors/rate-limited",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded 100 requests per minute. Try again in 30 seconds.",
  "retryAfter": 30
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Express.js — Rate Limiting Middleware">
        {`const rateLimit = require('express-rate-limit');

// Basic rate limiter — 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute window
  max: 100,                      // 100 requests per window
  standardHeaders: true,         // Send RateLimit-* headers
  legacyHeaders: false,          // Disable X-RateLimit-* headers

  message: {
    type: 'https://api.example.com/errors/rate-limited',
    title: 'Rate Limit Exceeded',
    status: 429,
    detail: 'Too many requests. Please try again later.'
  },

  keyGenerator: (req) => {
    // Rate limit by API key if authenticated, IP otherwise
    return req.headers['x-api-key'] || req.ip;
  }
});

// Stricter limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minute window
  max: 10,                       // 10 attempts per 15 minutes
  message: {
    type: 'https://api.example.com/errors/rate-limited',
    title: 'Too Many Login Attempts',
    status: 429,
    detail: 'Too many login attempts. Please try again in 15 minutes.'
  }
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Rate Limit by API Key, Not Just IP">
        <p>
          IP-based rate limiting is a baseline, but it can be unfair to users behind
          shared IPs (NAT, corporate proxies). For authenticated APIs, rate limit by
          API key or user ID. Consider different rate limits for different tiers:
          free users get 100 req/min, paid users get 1000 req/min, enterprise gets 10000.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"Which API versioning strategy is most widely adopted and recommended for public APIs?"}
        options={[
          "Query parameter versioning (?v=1)",
          "URL path versioning (/api/v1/)",
          "Content negotiation (Accept header)",
          "Custom header versioning (X-API-Version)"
        ]}
        correctIndex={1}
        explanation={"URL path versioning (/api/v1/) is the most widely adopted strategy, used by Stripe, GitHub, Google, and most major API providers. It is the simplest to implement, most visible, and easiest to test. While purists may prefer content negotiation, the pragmatic benefits of path versioning make it the default recommendation."}
      />

      <InteractiveChallenge
        question={"You are building a social media feed API where new posts are constantly being created. Users scroll through an infinite feed. Which pagination strategy is best?"}
        options={[
          "Offset-based pagination (page=1&size=20) because it supports page numbers",
          "Cursor-based pagination because it handles real-time data consistently",
          "No pagination — return all posts at once for the best user experience",
          "Random sampling — return a random subset of posts each time"
        ]}
        correctIndex={1}
        explanation={"Cursor-based pagination is ideal for social media feeds. With offset-based pagination, new posts being inserted at the top would cause items to shift — users would see duplicate posts or miss posts entirely. Cursor-based pagination uses a stable reference point (like a post ID or timestamp) so results are consistent regardless of new inserts."}
      />

    </LessonLayout>
  );
}
