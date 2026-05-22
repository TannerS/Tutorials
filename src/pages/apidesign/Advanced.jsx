import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ApiDesignAdvanced() {
  return (
    <LessonLayout
      title="Advanced API Design"
      sectionId="apidesign"
      lessonIndex={5}
      prev={{ path: "/apidesign/versioning", label: "API Versioning" }}
      next={{ path: "/auth/encryption", label: "Encryption Basics" }}
    >
      <p>Advanced API design covers rate limiting, pagination strategies, HATEOAS, GraphQL vs REST trade-offs, and API security patterns that separate good APIs from great ones.</p>

      <h2>Rate Limiting</h2>

      <CodeBlock language="java" title="Rate Limiting with Bucket4j">
{`@Component
public class RateLimitingFilter implements Filter {
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        String apiKey = request.getHeader("X-API-Key");

        Bucket bucket = buckets.computeIfAbsent(apiKey, this::createBucket);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        HttpServletResponse response = (HttpServletResponse) res;
        response.addHeader("X-RateLimit-Limit", "100");
        response.addHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
        response.addHeader("X-RateLimit-Reset",
            String.valueOf(Instant.now().plusNanos(probe.getNanosToWaitForRefill()).getEpochSecond()));

        if (probe.isConsumed()) {
            chain.doFilter(req, res);
        } else {
            response.setStatus(429);
            response.getWriter().write("""
                {"type":"https://api.example.com/problems/rate-limited",
                 "title":"Too Many Requests",
                 "status":429,
                 "detail":"Rate limit of 100 requests per minute exceeded"}""");
        }
    }

    private Bucket createBucket(String apiKey) {
        return Bucket.builder()
            .addLimit(Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1))))
            .build();
    }
}`}
      </CodeBlock>

      <h2>Cursor-Based Pagination</h2>

      <CodeBlock language="java" title="Cursor Pagination for Large Datasets">
{`// Offset pagination: LIMIT 20 OFFSET 200 — slow for large offsets
// Cursor pagination: WHERE id > lastSeenId LIMIT 20 — always fast

@GetMapping("/api/events")
public CursorPage<EventDto> listEvents(
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "20") int size) {

    Long afterId = cursor != null
        ? Long.parseLong(new String(Base64.decode(cursor)))
        : null;

    List<Event> events = repo.findAfter(afterId, size + 1);  // fetch one extra
    boolean hasMore = events.size() > size;
    if (hasMore) events = events.subList(0, size);

    String nextCursor = hasMore
        ? Base64.encode(String.valueOf(events.get(events.size()-1).getId()))
        : null;

    return new CursorPage<>(events.stream().map(EventDto::from).toList(),
                            nextCursor, hasMore);
}

// Response
{
  "data": [...],
  "nextCursor": "MTIzNDU2",
  "hasMore": true
}
// Client calls: GET /api/events?cursor=MTIzNDU2 for next page`}
      </CodeBlock>

      <FlowChart
        title="Pagination Strategy Comparison"
        chart={"graph TD\n  A[Pagination Need] --> B{Real-time data?}\n  B -- Yes --> C[Cursor Pagination]\n  B -- No --> D{Large dataset > 10k rows?}\n  D -- Yes --> C\n  D -- No --> E[Offset Pagination]\n  C --> F[Stable across inserts/deletes]\n  E --> G[Simple but slow at large offsets]"}
      />

      <InfoBox variant="note" title="GraphQL vs REST">
        <p>REST is best for: simple CRUD, caching (GET requests cache naturally), public APIs, and team unfamiliar with GraphQL. GraphQL is best for: complex nested data, mobile apps needing bandwidth optimization, multiple clients with different data needs, and rapidly evolving schemas. Most teams start with REST and add GraphQL for specific use cases.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the key advantage of cursor-based pagination over offset-based pagination?"
        options={["Cursor pagination is easier to implement", "Cursor pagination works correctly with real-time data and is always fast regardless of page depth", "Cursor pagination allows jumping to any page", "Cursor pagination uses less memory on the server"]}
        correctIndex={1}
        explanation="Offset pagination (SKIP 10000 LIMIT 20) gets slower as offset increases — the DB scans and discards rows. It also shows incorrect results if items are inserted/deleted between pages. Cursor pagination always queries from a known position (WHERE id > cursor), making it O(1) regardless of depth and stable under concurrent writes."
      />

    </LessonLayout>
  );
}
